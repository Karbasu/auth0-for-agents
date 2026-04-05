# VaultMCP

> A universal MCP server powered by Auth0 Token Vault — connect your services once, and let AI agents act on your behalf, safely.

**Hackathon submission for [Authorized to Act: Auth0 for AI Agents](https://authorizedtoact.devpost.com/)**

---

## The Problem

Every AI agent framework reinvents OAuth. They store tokens in plaintext, implement their own refresh logic, and treat authorization as an afterthought — usually a "permission denied" error the AI tries to work around.

**The result:** Fragile token management, no centralized control, and AI agents that know about tools they shouldn't be using.

## The Insight: Authorization by Omission

> *The most secure permission is the one the AI never knows about.*

Traditional agent auth:
```
AI calls send_email → gets "403 Forbidden" → tries to work around it
```

**VaultMCP's approach:**
```
User grants: gmail.readonly
  AI sees:      search_emails, read_email, list_labels     (3 tools)
  AI doesn't see: create_draft, send_email                  (hidden entirely)

User adds: gmail.compose, gmail.send
  AI now sees:  search_emails, read_email, list_labels,
                create_draft, send_email                     (5 tools)
```

The AI can't hack, social-engineer, or hallucinate its way into using tools it can't see. This is **defense at the discovery layer** — before execution even happens.

---

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────────────────────────┐
│  Claude Desktop  │ ◄────────────► │         VaultMCP Server          │
│  Claude Code     │                │                                  │
│  (any MCP client)│                │  ┌──────────────────────────┐   │
└─────────────────┘                │  │   Scope Resolver          │   │
                                    │  │   Read user's granted     │   │
                                    │  │   scopes from env config  │   │
                                    │  └─────────┬────────────────┘   │
                                    │            ▼                     │
                                    │  ┌──────────────────────────┐   │
                                    │  │   Tool Registry           │   │
                                    │  │   Filter 13-tool catalog  │   │
                                    │  │   by granted scopes       │   │
                                    │  │   (Authorization by       │   │
                                    │  │    Omission engine)       │   │
                                    │  └─────────┬────────────────┘   │
                                    │            ▼                     │
                                    │  ┌──────────────────────────┐   │
                                    │  │   Token Vault Client      │   │
                                    │  │   1. Get mgmt API token   │   │
                                    │  │   2. Fetch user identity  │   │
                                    │  │   3. Refresh downstream   │   │
                                    │  │      access token         │   │
                                    │  └─────────┬────────────────┘   │
                                    │            ▼                     │
                                    │  ┌──────────────────────────┐   │
                                    │  │   Audit Logger            │   │
                                    │  │   Log every invocation    │   │
                                    │  │   with timing + status    │   │
                                    │  └──────────────────────────┘   │
                                    └──────────────┬───────────────────┘
                                                   │
                                    ┌──────────────▼───────────────┐
                                    │       Auth0 Tenant            │
                                    │  ┌────────────────────────┐   │
                                    │  │  Token Vault            │   │
                                    │  │  • google-oauth2        │   │
                                    │  │  • github               │   │
                                    │  │  (refresh tokens stored  │   │
                                    │  │   securely by Auth0)     │   │
                                    │  └────────────────────────┘   │
                                    │                               │
                                    │  Management API               │
                                    │  • User identities            │
                                    │  • Account linking            │
                                    └──────────────┬────────────────┘
                                                   │
                            ┌──────────┬───────────┴──────┬──────────┐
                            ▼          ▼                  ▼          │
                        Gmail API  GitHub API       Calendar API     │


┌──────────────────────────────────────────────────────────────────────┐
│                      Next.js Dashboard                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Connection   │  │   Scope      │  │      AI's Perspective      │ │
│  │  Panel        │  │   Toggles    │  │                            │ │
│  │               │  │              │  │  ┌─────────┐ ┌──────────┐ │ │
│  │  Gmail    ✓   │  │  ○ readonly  │  │  │ AI sees │ │ Hidden   │ │ │
│  │  GitHub   ✓   │  │  ○ compose   │  │  │ 8 tools │ │ 5 tools  │ │ │
│  │  Calendar ✓   │  │  ○ send      │  │  │ (green) │ │ (gray)   │ │ │
│  └──────────────┘  └──────────────┘  │  └─────────┘ └──────────┘ │ │
│                                       └────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Tool Catalog (grouped by service, click to expand scopes)    │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  Audit Trail — every invocation with timing + status          │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Token Flow (Step by Step)

```
1. AI calls search_emails("hackathon")
        │
2. VaultMCP checks: does user have gmail.readonly scope?
   YES → proceed (NO → tool was never registered, call impossible)
        │
3. Get Auth0 Management API token (client_credentials grant, cached)
        │
4. Fetch user profile: GET /api/v2/users/{userId}
   → identities array contains Google refresh_token
        │
5. Exchange refresh_token for fresh access_token
   → POST https://oauth2.googleapis.com/token
        │
6. Call Gmail API with fresh access_token
   → GET gmail.googleapis.com/gmail/v1/users/me/messages?q=hackathon
        │
7. Log to audit trail: { tool: "search_emails", success: true, 342ms }
        │
8. Return results to AI
```

**Key security properties:**
- Your app **never stores OAuth refresh tokens** — Auth0 Token Vault holds them
- The MCP server only gets **short-lived access tokens** (1 hour for Google, cached)
- **3-level caching**: management token, downstream tokens, identity data

---

## 13 MCP Tools, 3 Services

| Tool | Service | Required Scope | Type | Description |
|------|---------|---------------|------|-------------|
| `search_emails` | Gmail | gmail.readonly | Read | Search emails by query |
| `read_email` | Gmail | gmail.readonly | Read | Read a specific email by ID |
| `list_labels` | Gmail | gmail.readonly | Read | List all Gmail labels |
| `create_draft` | Gmail | gmail.compose | Write | Create a draft email |
| `send_email` | Gmail | gmail.send | Write | Send a draft email |
| `list_repos` | GitHub | repo, read:user | Read | List user's repositories |
| `list_issues` | GitHub | repo | Read | List issues in a repo |
| `read_issue` | GitHub | repo | Read | Read a specific issue |
| `create_comment` | GitHub | repo | Write | Comment on an issue |
| `create_issue` | GitHub | repo | Write | Create a new issue |
| `list_events` | Calendar | calendar.readonly | Read | List upcoming events |
| `get_event` | Calendar | calendar.readonly | Read | Get event details |
| `create_event` | Calendar | calendar.events | Write | Create a calendar event |

**Write tools only appear when you grant the corresponding scope.** Remove a scope, and the tool vanishes from the AI's perspective — it can't even attempt the action.

---

## Security Model

### Defense in Depth

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| **Discovery** | Authorization by Omission — tools only registered if scopes match | AI can't attempt unauthorized actions |
| **Token Storage** | Auth0 Token Vault holds refresh tokens — app never sees them | Token theft from app compromise |
| **Token Lifetime** | Only short-lived access tokens (1hr) are used at runtime | Reduces blast radius of leaked tokens |
| **Audit Trail** | Every tool call logged with timestamp, duration, success/failure | Full forensic visibility |
| **Scope Granularity** | Read/write separation per service (e.g., gmail.readonly vs gmail.send) | Principle of least privilege |

### Compared to Traditional Approaches

| Aspect | Traditional Agent Auth | VaultMCP |
|--------|----------------------|----------|
| Token storage | Plaintext in `.env` or database | Auth0 Token Vault (encrypted, managed) |
| Unauthorized tool call | Runtime error (403) | Impossible — tool doesn't exist |
| Token refresh | DIY per-provider logic | Auth0 handles it + MCP server auto-refreshes |
| Multi-provider | Each integration is a separate auth system | Single Auth0 user, multiple linked identities |
| Audit | DIY logging (if any) | Built-in, every call logged with timing |
| Revoking access | Delete tokens from your database | Remove scope from env config → tool vanishes |

---

## Dashboard

The Next.js web dashboard provides real-time visibility and control over the authorization state:

- **Connection Panel** — Shows which services (Gmail, GitHub, Calendar) are connected via Auth0 Token Vault, with live status
- **Scope Control** — Interactive toggle switches for every OAuth scope, grouped by service. Flip a switch and watch tool availability update instantly — Authorization by Omission visualized in real-time
- **AI's Perspective** — Split-panel view showing what the AI can see (left, green) vs. what's hidden (right, gray with strikethrough). Tools move between panels live as you toggle scopes
- **Tool Catalog** — All 13 tools grouped by service with read/write badges. Click any tool to see its required scopes vs. your granted scopes (green = granted, red = missing)
- **Audit Trail** — Live feed of every tool invocation with timing and success/failure status

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
   - Allowed Callback URLs: `http://localhost:3000/callback`
   - Allowed Logout URLs: `http://localhost:3000`
3. Enable grant types: **Authorization Code**, **Refresh Token**, **Token Vault**
4. Set up social connections:
   - **Google OAuth2**: Add your Google Cloud OAuth client ID/secret. Toggle **Token Vault ON**. Add `upstream_params: { prompt: { value: "consent" } }` to force refresh token return.
   - **GitHub**: Add your GitHub OAuth App client ID/secret. Toggle **Token Vault ON**.
5. Enable **Gmail API** and **Calendar API** in Google Cloud Console
6. Add your email as a test user in Google OAuth consent screen

### 3. Environment Variables

```bash
cp .env.example .env
# Fill in your Auth0 credentials (domain, client ID, client secret)
```

### 4. Get Your Auth0 User Identity

```bash
# Login with Google (creates Auth0 user, stores refresh token in Token Vault)
node get-token.js google

# Link your GitHub account to the same Auth0 user
node get-token.js github
```

The `get-token.js` helper handles:
- Opening a browser for OAuth login
- Exchanging the authorization code for tokens
- Automatically linking secondary accounts (GitHub) to your primary identity (Google)
- Saving the `AUTH0_USER_ID` to your `.env` file

### 5. Build

```bash
npm run build:mcp        # Build the MCP server
npm run build:dashboard   # Build the Next.js dashboard
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

Then try:
- *"Search my Gmail for recent emails"*
- *"List my GitHub repos"*
- *"What's on my calendar this week?"*

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
│   ├── mcp-server/                  # Core MCP server
│   │   └── src/
│   │       ├── index.ts             # Entry point — stdio transport
│   │       ├── server.ts            # McpServer creation + tool registration
│   │       ├── config.ts            # Environment config with dotenv
│   │       ├── types.ts             # ToolDef, ServiceId, AuditEntry
│   │       ├── auth/
│   │       │   ├── token-vault.ts   # Auth0 Management API + token refresh
│   │       │   └── scope-resolver.ts # Scope checking logic
│   │       ├── tools/
│   │       │   ├── registry.ts      # Authorization by Omission engine
│   │       │   ├── gmail/           # 5 tools (search, read, labels, draft, send)
│   │       │   ├── github/          # 5 tools (repos, issues, read, comment, create)
│   │       │   └── calendar/        # 3 tools (list, get, create)
│   │       └── audit/
│   │           └── logger.ts        # EventEmitter-based audit logging
│   └── dashboard/                   # Next.js 15 web dashboard
│       └── src/
│           ├── app/
│           │   ├── page.tsx         # Landing page
│           │   ├── dashboard/       # Main dashboard view
│           │   └── api/             # REST endpoints (connections, tools, audit)
│           ├── components/
│           │   ├── connection-panel.tsx  # Service connection status cards
│           │   ├── scope-toggles.tsx     # Interactive scope toggle switches
│           │   ├── ai-view.tsx           # Split "AI sees" vs "Hidden" panel
│           │   ├── tool-grid.tsx         # Tool catalog grouped by service
│           │   └── audit-log.tsx         # Real-time audit log viewer
│           └── lib/
│               ├── token-vault.ts   # Auth0 client for dashboard
│               └── audit-store.ts   # Audit entry storage
├── get-token.js                     # CLI helper: Auth0 login + account linking
├── .env.example                     # Template for all environment variables
├── tsconfig.base.json               # Shared TypeScript config
├── package.json                     # npm workspaces root
└── LICENSE                          # MIT
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **MCP Server** | TypeScript, `@modelcontextprotocol/sdk`, Zod schemas, stdio transport |
| **Dashboard** | Next.js 15, React 19, Tailwind CSS, Lucide icons |
| **Auth** | Auth0 Token Vault, Management API, Google OAuth2, GitHub OAuth |
| **Monorepo** | npm workspaces |
| **Transport** | stdio (compatible with Claude Desktop, Claude Code, any MCP client) |

## Auth0 Features Used

| Feature | How We Use It |
|---------|--------------|
| **Token Vault** | Securely stores OAuth refresh tokens for Google and GitHub — our app never touches them |
| **Social Connections** | Google OAuth2 + GitHub with Token Vault enabled (fits free tier: 2 connections) |
| **Management API** | Retrieves user identity data including linked provider tokens |
| **Account Linking** | Multiple OAuth providers (Google + GitHub) linked to a single Auth0 user identity |

## Why This Matters

AI agents are getting more capable every month. The question isn't *whether* they'll need to act on our behalf — it's *how we control what they can do*.

VaultMCP demonstrates that **authorization doesn't have to be an afterthought**. By combining Auth0's Token Vault with the MCP protocol's tool discovery mechanism, we get a security model where:

1. **Users control the surface area** — adjust scopes, and the AI's capabilities change instantly
2. **Tokens are never at risk** — Auth0 holds them, not your app
3. **Every action is auditable** — full trail of what the AI did, when, and whether it succeeded
4. **Adding a new service is just adding a new tool file** — the authorization framework handles the rest

This isn't just a hackathon project. It's a pattern for how AI agent authorization should work.

## License

MIT — see [LICENSE](LICENSE)
