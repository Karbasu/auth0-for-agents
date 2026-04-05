# VaultMCP

> A universal MCP server powered by Auth0 Token Vault — connect your services once, and let AI agents act on your behalf, safely.

**Hackathon submission for "Authorized to Act: Auth0 for AI Agents"**

---

## The Insight: Authorization by Omission

The most secure permission is the one the AI never knows about.

VaultMCP filters MCP tools at registration time based on the user's OAuth scopes. If you haven't granted `gmail.compose`, the `create_draft` tool doesn't just fail — it **doesn't exist** from the AI's perspective. The AI can't even attempt unauthorized actions because it doesn't know those tools are possible.

```
User has gmail.readonly scopes only:

  AI sees:  search_emails, read_email, list_labels
  AI doesn't see:  create_draft  ← tool is completely hidden
```

## Architecture

```
┌─────────────────┐     stdio/HTTP     ┌──────────────────────┐
│  Claude Desktop  │ ◄───────────────► │     VaultMCP Server   │
│  (or any MCP     │                   │                       │
│   client)        ��                   │  ┌─ Tool Registry ──┐ │
└─────────────────┘                   │  │ Authorization by  │ │
                                      │  │ Omission Engine   │ │
                                      │  └────────┬──────────┘ │
                                      │           │             │
                                      │  ┌────────▼──────────┐ │
                                      │  │  Token Vault       │ │
                                      │  │  (RFC 8693         │ │
                                      │  │   Token Exchange)  │ │
                                      │  └────────┬──────────┘ │
                                      └───────────┼────────────┘
                                                  │
                                      ┌───────────▼────────────┐
                                      │     Auth0 Tenant       │
                                      │  ┌──────────────────┐  │
                                      │  │  Token Vault      │  │
                                      │  │  google-oauth2    │  │
                                      │  │  github           │  │
                                      │  └──────────────────┘  │
                                      └───────────┬────────────┘
                                                  │
                              ┌────────────┬──────┴──────┬────────────┐
                              ▼            ▼             ▼            │
                          Gmail API   GitHub API   Calendar API      │
```

## 11 MCP Tools, 3 Services

| Tool | Service | Scopes | Type |
|------|---------|--------|------|
| `search_emails` | Gmail | gmail.readonly | Read |
| `read_email` | Gmail | gmail.readonly | Read |
| `list_labels` | Gmail | gmail.readonly | Read |
| `create_draft` | Gmail | gmail.compose | Write |
| `list_repos` | GitHub | repo, read:user | Read |
| `list_issues` | GitHub | repo | Read |
| `read_issue` | GitHub | repo | Read |
| `create_comment` | GitHub | repo | Write |
| `list_events` | Calendar | calendar.readonly | Read |
| `get_event` | Calendar | calendar.readonly | Read |
| `create_event` | Calendar | calendar.events | Write |

**Auth0 Free Tier:** Gmail + Calendar share the `google-oauth2` connection (1 slot). GitHub uses the 2nd slot. All 3 services fit in the free 2-connection limit.

## Project Structure

```
auth0-for-agents/
├── packages/
│   ├── mcp-server/          # Core MCP server (stdio transport)
│   │   └── src/
│   │       ├── index.ts             # Entry point (stdio)
│   │       ├── server.ts            # McpServer + dynamic tool registration
│   │       ├── config.ts            # Environment config
│   │       ├── types.ts             # Shared types
│   │       ├── auth/
│   │       │   ├── token-vault.ts   # RFC 8693 token exchange
│   │       │   └── scope-resolver.ts
│   │       ├── tools/
│   │       │   ├── registry.ts      # Authorization by omission engine
│   │       │   ├── gmail/           # 4 tools
│   │       │   ├── github/          # 4 tools
│   │       │   └── calendar/        # 3 tools
│   │       └── audit/
���   │           └── logger.ts        # Audit logging
│   └── dashboard/           # Next.js web dashboard
│       └── src/
│           ├── app/                 # Pages + API routes
│           ├── lib/                 # Auth0, token vault, audit store
│           └── components/          # Connection panel, tool grid, audit log
```

## Setup

### Prerequisites

- Node.js 18+
- An Auth0 tenant with Token Vault enabled

### 1. Auth0 Configuration

1. Create an Auth0 tenant
2. Create a **Machine-to-Machine** app (for token exchange)
3. Create a **Regular Web Application** (for the dashboard)
4. Create a custom API with audience `https://vaultmcp.local/api`
5. Enable the **Google OAuth2** social connection with Gmail + Calendar scopes, and turn on **Token Vault**
6. Enable the **GitHub** social connection with `repo` scope, and turn on **Token Vault**
7. On the M2M app, enable the grant type: `urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token`

### 2. Environment Variables

```bash
cp .env.example .env
# Fill in your Auth0 credentials
```

### 3. Install & Build

```bash
npm install
npm run build:mcp
npm run build:dashboard
```

### 4. Test with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vault-mcp": {
      "command": "node",
      "args": ["/path/to/auth0-for-agents/packages/mcp-server/dist/index.js"],
      "env": {
        "AUTH0_DOMAIN": "your-tenant.us.auth0.com",
        "AUTH0_CLIENT_ID": "your-m2m-client-id",
        "AUTH0_CLIENT_SECRET": "your-m2m-client-secret",
        "USER_REFRESH_TOKEN": "your-refresh-token",
        "GMAIL_SCOPES": "https://www.googleapis.com/auth/gmail.readonly",
        "GITHUB_SCOPES": "repo,read:user",
        "CALENDAR_SCOPES": "https://www.googleapis.com/auth/calendar.readonly"
      }
    }
  }
}
```

Restart Claude Desktop. Try: *"Search my Gmail for emails about the hackathon"*

### 5. Run the Dashboard

```bash
npm run dev:dashboard
```

Open `http://localhost:3000`, sign in with Auth0, and manage your connections.

## How It Works

1. **User connects services** through Auth0 (OAuth2 flows for Gmail, GitHub, Calendar)
2. **Auth0 Token Vault** stores the downstream refresh tokens securely
3. **VaultMCP reads scopes** from environment and filters the tool catalog
4. **Only authorized tools are registered** with the MCP server (authorization by omission)
5. **On tool invocation**, VaultMCP exchanges the user's refresh token for a fresh downstream access token via Auth0's Token Vault (RFC 8693)
6. **Every invocation is audit-logged** with tool name, service, duration, and success/failure

## Tech Stack

- **MCP Server**: `@modelcontextprotocol/sdk`, TypeScript, Zod
- **Dashboard**: Next.js 15, React 19, Tailwind CSS, `@auth0/nextjs-auth0` v4
- **Auth**: Auth0 Token Vault, RFC 8693 token exchange
- **Monorepo**: npm workspaces

## License

MIT
