import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ALL_TOOLS } from "./tools/registry.js";
import { exchangeToken } from "./auth/token-vault.js";
import { audit } from "./audit/logger.js";
import {
  getScopes,
  initScopesFile,
  watchScopes,
  hasScopesDynamic,
} from "./scopes-store.js";
import type { ToolDef } from "./types.js";

/** Check if a tool is available given current scopes */
function isToolAvailable(tool: ToolDef): boolean {
  return hasScopesDynamic(tool.service, tool.requiredScopes);
}

/**
 * Create and configure the VaultMCP server.
 *
 * Uses the low-level Server class (not McpServer) so that
 * tools/list reads scopes dynamically on every call.
 * When the dashboard toggles a scope, the scopes.json file
 * is updated, and we send a tools/list_changed notification
 * so the AI client re-fetches the tool list in real-time.
 */
export function createVaultMcpServer(): Server {
  const server = new Server(
    { name: "VaultMCP", version: "1.0.0" },
    { capabilities: { tools: { listChanged: true } } }
  );

  // Write initial scopes file from env vars
  initScopesFile();

  const available = ALL_TOOLS.filter(isToolAvailable);
  process.stderr.write(
    `[VaultMCP] ${available.length}/${ALL_TOOLS.length} tools available (authorization by omission active)\n`
  );
  for (const t of available) {
    process.stderr.write(`[VaultMCP]   + ${t.name} (${t.service})\n`);
  }

  // ── tools/list — dynamic, re-reads scopes every time ─────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = ALL_TOOLS.filter(isToolAvailable);
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema, {
          $refStrategy: "none",
        }),
      })),
    };
  });

  // ── tools/call — checks scopes before executing ──────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = ALL_TOOLS.find((t) => t.name === name);

    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    // Re-check scopes at call time (may have been revoked since tools/list)
    if (!isToolAvailable(tool)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Tool "${name}" is no longer authorized. The required scopes have been revoked.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const accessToken = await exchangeToken(tool.service);
      const result = await audit.wrap(
        tool.name,
        tool.service,
        (args ?? {}) as Record<string, unknown>,
        () => tool.execute(args, accessToken)
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // ── Watch scopes file → notify client of tool list changes ───────
  watchScopes(() => {
    const tools = ALL_TOOLS.filter(isToolAvailable);
    process.stderr.write(
      `[VaultMCP] Scopes updated — ${tools.length} tools now available\n`
    );
    for (const t of tools) {
      process.stderr.write(`[VaultMCP]   + ${t.name} (${t.service})\n`);
    }
    // Tell the MCP client to re-fetch tools/list
    server.sendToolListChanged().catch(() => {
      // Client may not support notifications yet — that's fine
    });
  });

  return server;
}
