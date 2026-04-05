# VaultMCP

> A universal MCP server powered by Auth0 Token Vault — connect your services once, and let AI agents act on your behalf, safely.

**Hackathon submission for [Authorized to Act: Auth0 for AI Agents](https://authorizedtoact.devpost.com/)**

---

## The Insight: Authorization by Omission

The most secure permission is the one the AI never knows about.

Traditional agent auth: AI tries to call a tool, gets "permission denied," tries to work around it.

**VaultMCP's approach:** AI never sees unauthorized tools. They don't exist in its world.

```
User grants: gmail.readonly
  AI sees:      search_emails, read_email, list_labels     (3 tools)
  AI doesn't see: create_draft, send_email                  (hidden entirely)

User adds: gmail.compose, gmail.send
  AI now sees:  search_emails, read_email, list_labels,
                create_draft, send_email                     (5 tools)
```

The AI can't hack, social-engineer, or hallucinate its way into using tools it can't see. This is defense at the discovery layer — before execution even happens.

---

## How It Works

```
┌─────────────────┐     stdio      ┌──────────────────────────────┐
│  Claude Desktop  │ ◄────────────► │        VaultMCP Server       │
│  Claude Code     │                │                              │
│  (any MCP client)│                │  1. Read user's scopes       │
└─────────────────┘                │  2. Filter tool catalog       │
                                   │  3. Register only authorized  │
                                   │     tools (omit the rest)     │
                                   │                              │
                                   │  On tool call:               │
                                   │  4. Get mgmt API token       │
                                   │  5. Fetch user identity      │
                                   │  6. Refresh downstream token │
                                   │  7. Call API (Gmail/GitHub/  │
                                   │     Calendar)                │
                                   │  8. Log to audit trail       │
                                   └──────────────┬───────────────┘
                                                  │
                                   ┌──────────────▼───────────────┐
                                   │       Auth0 Tenant           │
                                   │  ┌────────────────────────┐  │
                                   │  │  Token Vault            │  │
                                   │  │  • google-oauth2        │  │
                                   │  │  • github               │  │
                                   │  │  (refresh tokens stored  │  │
                                   │  │   securely by Auth0)     │  │
                                   │  └────────────────────────┘  │
                                   └──────────────┬───────────────┘
                                                  │
                           ┌──────────┬───────────┴──────┬──────────┐
                           ▼          ▼                  ▼          │
                       Gmail API  GitHub API       Calendar API     │
```

**Key security property:** Your app never stores OAuth refresh tokens. Auth0 Token Vault holds them. The MCP server only ever gets short-lived access tokens.

---

## 13 MCP Tools, 3 Services

| Tool | Service | Required Scope | Type |
|------|---------|---------------|------|
| `search_emails` | Gmail | gmail.readonly | Read |
| `read_email` | Gmail | gmail.readonly | Read |
| `list_labels` | Gmail | gmail.readonly | Read |
| `create_draft` | Gmail | gmail.compose | Write |
| `send_email` | Gmail | gmail.send | Write |
| `list_repos` | GitHub | repo, read:user | Read |
| `list_issues` | GitHub | repo | Read |
| `read_issue` | GitHub | repo | Read |
| `create_comment` | GitHub | repo | Write |
| `create_issue` | GitHub | repo | Write |
| `list_events` | Calendar | calendar.readonly | Read |
| `get_event` | Calendar | calendar.readonly | Read |
| `create_event` | Calendar | calendar.events | Write |

Write tools only appear when you grant the corresponding scope. Remove a scope, and the tool vanishes from the AI's perspective.

---

## Dashboard

The web dashboard provides real-time visibility into the authorization state:

- **Connection Panel** — Shows which services are connected via Auth0
- **Tool Grid** — All 13 tools with available/restricted status. Click a tool to see its required scopes vs. your granted scopes
- **Audit Log** — Live feed of every tool invocation with timing and success/failure

---

## Setup

### Prerequisites

- Node.js 18+
- Auth0 account (free tier works — 2 social connections)
- Google Cloud project (for Gmail + Calendar APIs)
- GitHub OAuth App

### 1. Clone and Install

```bash
git clone https://github.com/Karbasu/auth0-for-agents.git
cd auth0-for-agents
npm install
```

### 2. Auth0 Configuration

1. Create an Auth0 tenant at [auth0.com](https://auth0.com)
2. Create a **Regular Web Application**
3. Enable grant types: Authorization Code, Refresh Token, Token Vault
4. Set up social connections:
   - **Google OAuth2**: Add your Google Cloud OAuth client ID/secret. Toggle **Token Vault ON**. Add `upstream_params: { prompt: { value: "consent" } }` to force refresh token return.
   - **GitHub**: Add your GitHub OAuth App client ID/secret. Toggle **Token Vault ON**.
5. Enable **Gmail API** and **Calendar API** in Google Cloud Console
6. Add your email as a test user in Google OAuth consent screen

### 3. Environment Variables

```bash
cp .env.example .env
# Fill in your Auth0 credentials
```

### 4. Get Your Auth0 User Identity

```bash
# Login with Google (creates Auth0 user, saves refresh token)
node get-token.js google

# Link your GitHub account to the same user
node get-token.js github
```

### 5. Build

```bash
npm run build:mcp
npm run build:dashboard
```

### 6. Connect to Claude Code

```bash
claude mcp add vault-mcp --transport stdio \
  -e AUTH0_DOMAIN=your-tenant.us.auth0.com \
  -e AUTH0_CLIENT_ID=your-client-id \
  -e AUTH0_CLIENT_SECRET=your-client-secret \
  -e AUTH0_AUDIENCE=https://your-tenant.us.auth0.com/api/v2/ \
  -e AUTH0_USER_ID=google-oauth2|your-user-id \
  -e GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly \
  -e GITHUB_SCOPES=repo,read:user \
  -e CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.readonly \
  -- node /path/to/packages/mcp-server/dist/index.js
```

Then try: *"Search my Gmail for recent emails"* or *"List my GitHub repos"*

### 7. Run the Dashboard

```bash
cp .env packages/dashboard/.env
npm run dev:dashboard
# Open http://localhost:3000
```

---

## Project Structure

```
auth0-for-agents/
├── packages/
│   ├── mcp-server/              # Core MCP server (TypeScript, stdio transport)
│   │   └── src/
│   │       ├── index.ts                # Entry point
│   │       ├── server.ts               # Tool registration + audit wrapping
│   │       ├── config.ts               # Environment config with dotenv
│   │       ├── types.ts                # ToolDef, ServiceId, AuditEntry
│   │       ├── auth/
│   │       │   ├── token-vault.ts      # Auth0 Management API + token refresh
│   │       │   └── scope-resolver.ts   # Scope checking logic
│   │       ├── tools/
│   │       │   ├── registry.ts         # Authorization by omission engine
│   │       │   ├── gmail/              # 5 tools (3 read, 2 write)
│   │       │   ├── github/             # 5 tools (3 read, 2 write)
│   │       │   └── calendar/           # 3 tools (2 read, 1 write)
│   │       └── audit/
│   │           └── logger.ts           # EventEmitter-based audit logging
│   └── dashboard/                # Next.js 15 web dashboard
│       └── src/
│           ├── app/                    # Pages + API routes
│           ├── components/             # ConnectionPanel, ToolGrid, AuditLog
│           └── lib/                    # Auth0 client, audit store
├── get-token.js                  # Helper: Auth0 login + account linking
├── .env.example                  # Template for env vars
└── docs/                         # Deployment notes
```

## Tech Stack

- **MCP Server**: `@modelcontextprotocol/sdk`, TypeScript, Zod schemas
- **Dashboard**: Next.js 15, React 19, Tailwind CSS
- **Auth**: Auth0 Token Vault, Management API, Google OAuth2, GitHub OAuth
- **Monorepo**: npm workspaces
- **Transport**: stdio (works with Claude Desktop, Claude Code, any MCP client)

## Auth0 Features Used

- **Token Vault** — Secure storage of OAuth refresh tokens for Google and GitHub
- **Social Connections** — Google OAuth2 + GitHub with Token Vault enabled
- **Management API** — User identity retrieval for token access
- **Account Linking** — Multiple providers linked to a single user identity

## License

MIT
