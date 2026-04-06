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
AI calls send_email → gets "403 Forbidden" → retries, hallucinates, asks user to bypass
```

**VaultMCP's approach:**
```
User grants: gmail.readonly
  AI sees:      search_emails, read_email, list_labels     (3 tools)
  AI doesn't see: create_draft, send_email                  (hidden entirely)

User toggles ON: gmail.compose, gmail.send  (from dashboard, in real-time)
  AI now sees:  search_emails, read_email, list_labels,
                create_draft, send_email                     (5 tools — instantly)
```

The AI can't hack, social-engineer, or hallucinate its way into using tools it can't see. This is **defense at the discovery layer** — before execution even happens.

---

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────────────────────────────┐
│  Claude Desktop  │ ◄────────────► │           VaultMCP Server            │
│  Claude Code     │                │                                      │
│  (any MCP client)│  tools/list    │  ┌────────────────────────────────┐  │
└─────────────────┘  ◄──────────   │  │   Dynamic Scope Resolver       │  │
        ▲                           │  │   Reads scopes.json on EVERY   │  │
        │  tools/list_changed       │  │   tools/list + tools/call      │  │
        │  notification             │  └──────────┬─────────────────────┘  │
        └───────────────────────    │             ▼                        │
                                    │  ┌────────────────────────────────┐  │
                                    │  │   Tool Registry (13 tools)     │  │
                                    │  │   Filter catalog by scopes     │  │
                                    │  │   (Authorization by Omission)  │  │
                                    │  └──────────┬─────────────────────┘  │
                                    │             ▼                        │
                                    │  ┌────────────────────────────────┐  │
                                    │  │   Token Vault Client            │  │
                                    │  │   1. Get mgmt API token         │  │
                                    │  │   2. Fetch user identity        │  │
                                    │  │   3. Refresh downstream token   │  │
                                    │  └──────────┬─────────────────────┘  │
                                    │             ▼                        │
                                    │  ┌────────────────────────────────┐  │
                                    │  │   Audit Logger                  │  │
                                    │  │   Log every call with timing    │  │
                                    │  └────────────────────────────────┘  │
                                    │  ┌────────────────────────────────┐  │
                                    │  │   Expiry Checker (30s interval) │  │
                                    │  │   Remove expired scopes from    │  │
                                    │  │   scopes.json → tools/list_changed│ │
                                    │  └────────────────────────────────┘  │
                                    └──────────────┬───────────────────────┘
                                                   │
                              ┌─────────────┐      │      ┌──────────────┐
                              │ scopes.json │◄─────┤      │  Auth0       │
                              │ (shared)    │      └─────►│  Tenant      │
                              └──────┬──────┘             │              │
                                     │                    │  Token Vault │
                                     │  fs.watchFile      │  • Google    │
                                     │                    │  • GitHub    │
                                     ▼                    │              │
┌──────────────────────────────────────────────────┐      │  Mgmt API   │
│               Next.js Dashboard                   │      └──────┬──────┘
│                                                   │             │
│  POST /api/scopes ──► writes scopes.json          │    ┌────────┴────────┐
│  (MCP server detects change, sends notification)  │    ▼        ▼        ▼
│                                                   │  Gmail   GitHub  Calendar
│  ┌─────────────┐ ┌──────────────┐ ┌───────────┐  │   API     API      API
│  │ Connection  │ │ Scope        │ │ AI's      │  │
│  │ Panel       │ │ Toggles      │ │ Perspective│  │
│  │             │ │ (real-time)  │ │ (live)    │  │
│  │ Gmail   ✓  │ │ ○ readonly   │ │ ┌───┐┌──┐ │  │
│  │ GitHub  ✓  │ │ ○ compose    │ │ │vis││hid│ │  │
│  │ Cal.    ✓  │ │ ○ send       │ │ └───┘└──┘ │  │
│  └─────────────┘ └──────────────┘ └───────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │ Tool Catalog │ Audit Trail (timing + status) │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### Real-Time Scope Flow

```
1. User toggles OFF gmail.send on dashboard
        │
2. Dashboard POSTs to /api/scopes → writes scopes.json
        │
3. MCP server detects file change (fs.watchFile)
        │
4. MCP server sends tools/list_changed notification to Claude
        │
5. Claude re-fetches tools/list → send_email is gone
        │
6. User asks Claude "send an email" → Claude says "I can't do that"
        │
   No restart. No 403. The tool never existed in Claude's world.
```

### Time-Based Scope Access

Scopes can be granted with a time limit. Instead of toggling a scope off manually, set a timer and the scope auto-revokes when time is up.

```
1. User enables gmail.send and clicks the "30m" timer preset on the dashboard
        │
2. Dashboard writes { scope: "gmail.send", expiresAt: <now + 30 min> } to scopes.json
        │
3. AI can now use send_email — dashboard shows a live countdown badge
        │
4. 30 minutes pass → MCP server's expiry checker (30-second interval) detects
   that gmail.send has expired → removes it from scopes.json
        │
5. MCP server sends tools/list_changed notification to Claude
        │
6. send_email vanishes from the AI's world — automatically, no human in the loop
```

Each active scope toggle on the dashboard shows timer preset buttons (**30m**, **1h**, **4h**). A live countdown badge displays the remaining time. Click the **infinity** button to remove the timer and make the scope permanent again.

### Token Flow (Step by Step)

```
1. AI calls search_emails("hackathon")
        │
2. VaultMCP checks scopes.json: does user have gmail.readonly?
   YES → proceed (NO → tool wasn't in tools/list, call impossible)
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
- **Double-check at call time**: even if a tool was in the list, scopes are re-verified before execution

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

**Write tools only appear when you grant the corresponding scope.** Toggle a scope off on the dashboard, and the tool vanishes from the AI's world in real-time — no restart needed.

---

## Security Model

### Defense in Depth

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| **Discovery** | Authorization by Omission — tools only listed if scopes match | AI can't attempt unauthorized actions |
| **Call-time** | Scopes re-checked on every `tools/call` before execution | Race condition between scope change and tool call |
| **Real-time revocation** | Dashboard toggles → scopes.json → `tools/list_changed` notification | Delayed revocation; tools persist after scope removed |
| **Token Storage** | Auth0 Token Vault holds refresh tokens — app never sees them | Token theft from app compromise |
| **Token Lifetime** | Only short-lived access tokens (1hr) are used at runtime | Reduces blast radius of leaked tokens |
| **Audit Trail** | Every tool call logged with timestamp, duration, success/failure | Full forensic visibility |
| **Scope Granularity** | Read/write separation per service (e.g., gmail.readonly vs gmail.send) | Principle of least privilege |
| **Time-based access** | Scopes auto-revoke after a user-defined duration (30m, 1h, 4h); expiry checker runs every 30s | Permanent over-provisioning; forgotten permissions |

### Compared to Traditional Approaches

| Aspect | Traditional Agent Auth | VaultMCP |
|--------|----------------------|----------|
| Token storage | Plaintext in `.env` or database | Auth0 Token Vault (encrypted, managed) |
| Unauthorized tool call | Runtime error (403) | Impossible — tool doesn't exist |
| Token refresh | DIY per-provider logic | Auth0 handles it + MCP server auto-refreshes |
| Multi-provider | Each integration is a separate auth system | Single Auth0 user, multiple linked identities |
| Revoking access | Delete tokens, restart server | Toggle scope on dashboard → instant |
| Temporary access | No standard mechanism | Timer presets (30m/1h/4h) with auto-revocation |
| Audit | DIY logging (if any) | Built-in, every call logged with timing |

---

## Dashboard

The Next.js web dashboard provides **real-time control** over the authorization state — scope changes propagate to the MCP server instantly:

- **Connection Panel** — Shows which services (Gmail, GitHub, Calendar) are connected via Auth0 Token Vault, with live status
- **Scope Control** — Interactive toggle switches for every OAuth scope, grouped by service. Flip a switch and the change is written to a shared `scopes.json` file that the MCP server watches — tools appear or vanish from the AI's world in real-time, no restart needed
- **Time-Based Access** — Each active scope shows timer preset buttons (30m, 1h, 4h) with a live countdown badge. Set a timer and the scope auto-revokes when it expires — the MCP server's 30-second expiry checker removes it from `scopes.json` and triggers `tools/list_changed`. Click the infinity button to make a scope permanent again
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

Toggle scopes on the dashboard — the MCP server picks up changes in real-time.

---

## Project Structure

```
auth0-for-agents/
├── packages/
│   ├── mcp-server/                  # Core MCP server
│   │   └── src/
│   │       ├── index.ts             # Entry point — stdio transport
│   │       ├── server.ts            # Low-level Server with dynamic tools/list
│   │       ├── scopes-store.ts      # Read/write/watch shared scopes.json
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
│           │   └── api/
│           │       ├── connections/  # GET — service connection status
│           │       ├── tools/       # GET — tool catalog with availability
│           │       ├── scopes/      # GET/POST — read/write shared scopes
│           │       └── audit/       # GET/POST — audit log entries
│           ├── components/
│           │   ├── connection-panel.tsx  # Service connection status cards
│           │   ├── scope-toggles.tsx     # Interactive scope toggle switches
│           │   ├── ai-view.tsx           # Split "AI sees" vs "Hidden" panel
│           │   ├── tool-grid.tsx         # Tool catalog grouped by service
│           │   └── audit-log.tsx         # Real-time audit log viewer
│           └── lib/
│               ├── token-vault.ts   # Auth0 client for dashboard
│               └── audit-store.ts   # Audit entry storage
├── scopes.json                      # Shared scope config (MCP server watches this)
├── get-token.js                     # CLI helper: Auth0 login + account linking
├── .env.example                     # Template for all environment variables
├── tsconfig.base.json               # Shared TypeScript config
├── package.json                     # npm workspaces root
└── LICENSE                          # MIT
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **MCP Server** | TypeScript, `@modelcontextprotocol/sdk` (low-level `Server` class), Zod schemas, stdio transport |
| **Dashboard** | Next.js 15, React 19, Tailwind CSS, Lucide icons |
| **Auth** | Auth0 Token Vault, Management API, Google OAuth2, GitHub OAuth |
| **Real-time sync** | Shared `scopes.json` + `fs.watchFile` + MCP `tools/list_changed` notification + 30s expiry checker |
| **Monorepo** | npm workspaces |

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

1. **Users control the surface area in real-time** — toggle a scope on the dashboard, and the AI's capabilities change instantly
2. **Scopes can be time-limited** — grant `gmail.send` for 30 minutes and it auto-revokes, no human in the loop
3. **Tokens are never at risk** — Auth0 holds them, not your app
4. **Every action is auditable** — full trail of what the AI did, when, and whether it succeeded
5. **Adding a new service is just adding a new tool file** — the authorization framework handles the rest

Traditional auth says no. Authorization by Omission removes the question entirely. **The agent can't want what it doesn't know exists.**

## License

MIT — see [LICENSE](LICENSE)
