import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAvailableTools } from "./tools/registry.js";
import { exchangeToken } from "./auth/token-vault.js";
import { audit } from "./audit/logger.js";

/**
 * Create and configure the VaultMCP server.
 * Only tools that the user has authorized scopes for are registered.
 */
export function createVaultMcpServer(): McpServer {
  const server = new McpServer({
    name: "VaultMCP",
    version: "1.0.0",
  });

  const tools = getAvailableTools();

  process.stderr.write(
    `[VaultMCP] Registering ${tools.length} tools (authorization by omission active)\n`
  );

  for (const tool of tools) {
    process.stderr.write(`[VaultMCP]   + ${tool.name} (${tool.service})\n`);

    // Extract the raw Zod shape for the MCP SDK
    const shape = (tool.inputSchema as z.ZodObject<any>).shape;

    server.tool(tool.name, tool.description, shape, async (args: any) => {
      try {
        const accessToken = await exchangeToken(tool.service);
        const result = await audit.wrap(
          tool.name,
          tool.service,
          args as Record<string, unknown>,
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
  }

  return server;
}
