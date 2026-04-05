import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createVaultMcpServer } from "./server.js";

async function main() {
  process.stderr.write("[VaultMCP] Starting MCP server (stdio transport)...\n");

  const server = createVaultMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("[VaultMCP] Server connected and ready.\n");
}

main().catch((err) => {
  process.stderr.write(`[VaultMCP] Fatal error: ${err.message}\n`);
  process.exit(1);
});
