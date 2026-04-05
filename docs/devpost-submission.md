# Devpost Submission Content

Copy-paste these two sections into your Devpost submission text description.

---

## SECTION 1: Project Description

### VaultMCP — Authorization by Omission for AI Agents

VaultMCP is a universal MCP (Model Context Protocol) server that uses Auth0 Token Vault to give AI agents secure, scoped access to Gmail, GitHub, and Google Calendar — with a twist: **the AI never learns about tools it isn't authorized to use.**

#### The Problem

Every AI agent framework reinvents OAuth. Tokens are stored in plaintext config files, refresh logic is hand-rolled per provider, and when an agent hits a permission boundary, it gets a "403 Forbidden" — which it then tries to work around through retries, hallucinated arguments, or asking the user to help bypass the restriction.

#### Our Approach: Authorization by Omission

Instead of denying access at execution time, VaultMCP removes unauthorized tools at the **discovery layer**. When the MCP server starts, it reads the user's granted OAuth scopes and only registers tools the user has authorized. Tools that require missing scopes are simply never advertised to the AI.

The result: the AI can't hack, social-engineer, or hallucinate its way past a permission boundary — because from its perspective, the restricted capability doesn't exist.

#### What It Does

- **13 MCP tools** across 3 services (Gmail, GitHub, Google Calendar), each classified as read or write
- **Scope-gated tool visibility** — remove `gmail.send` from your config, and the `send_email` tool vanishes from the AI's world
- **Auth0 Token Vault** stores all OAuth refresh tokens — the app never touches them
- **Short-lived access tokens** only — refreshed automatically via Auth0 Management API
- **Full audit trail** — every tool invocation logged with timestamp, duration, and success/failure
- **Interactive dashboard** with:
  - **Scope Control** — toggle switches for every OAuth scope. Flip a switch, watch tool availability change instantly
  - **AI's Perspective** — split panel showing what the AI can see vs. what's hidden. Tools move between panels in real-time as you toggle scopes
  - **Tool Catalog** — all 13 tools grouped by service with read/write badges and click-to-expand scope details
  - **Audit Trail** — live feed of every tool call with timing and success status
- **Works with any MCP client** — Claude Code, Claude Desktop, or any tool that speaks MCP over stdio

#### Auth0 Features Used

- **Token Vault** — Secure OAuth refresh token storage for Google and GitHub connections
- **Social Connections** — Google OAuth2 + GitHub with Token Vault enabled (fits the free tier: 2 connections)
- **Management API** — User identity retrieval to access linked provider tokens
- **Account Linking** — Multiple OAuth providers linked to a single Auth0 user identity

#### Built With

TypeScript, Node.js, @modelcontextprotocol/sdk, Next.js 15, React 19, Tailwind CSS, Auth0 Token Vault, Auth0 Management API, Zod

---

## SECTION 2: Blog Post

> **--- BLOG POST: Token Vault Achievement ---**

### What I Learned Building Authorization by Omission with Auth0 Token Vault

When I started building VaultMCP, I assumed the hardest part would be the MCP protocol integration or the multi-service OAuth dance. I was wrong. The hardest part was realizing that the standard approach to AI agent authorization — checking permissions at execution time — is fundamentally broken.

**The standard pattern looks like this:** an AI agent discovers all available tools, tries to call one, gets a 403 error, and then either retries, asks the user to help, or hallucinates alternative arguments. The permission boundary exists, but the AI is aware of what's behind it — and LLMs are surprisingly creative at working around restrictions they can see.

**Token Vault changed how I thought about this.** Because Auth0 manages all the OAuth complexity — storing refresh tokens securely, handling token exchange, managing multi-provider identities — I didn't need to build any token infrastructure in my app. That freed me to focus on a higher-level question: *what if the AI never learned about unauthorized tools in the first place?*

That's how Authorization by Omission was born. VaultMCP reads the user's granted OAuth scopes at startup and only registers MCP tools whose scope requirements are satisfied. If you haven't granted `gmail.send`, the `send_email` tool is never advertised. The AI doesn't see a locked door — there's no door at all.

**The Token Vault integration was the enabler.** Three specific capabilities made this architecture possible:

1. **Secure token storage** — refresh tokens live in Auth0, not my app. Even if my server is compromised, the long-lived credentials are safe.

2. **Identity linking** — a single Auth0 user can have Google and GitHub identities linked together. My MCP server fetches one user profile and gets tokens for all connected services.

3. **Management API access** — I can programmatically read the user's identity data, including provider-specific tokens, through a single authenticated API call. This is the mechanism that powers the entire token flow.

The pattern I ended up with is simple: **Auth0 Token Vault handles the "how" of token management, and Authorization by Omission handles the "whether" of tool exposure.** Together, they create a security model where credentials are never at risk and unauthorized capabilities genuinely don't exist from the AI's perspective.

What surprised me most was how little code this required. The core "omission engine" is 5 lines — a filter over the tool catalog checking if the user's scopes satisfy each tool's requirements. The real complexity lives in Auth0's infrastructure, not in my app.

To make this tangible, I built a dashboard with interactive scope toggles — flip a switch for `gmail.send`, and the `send_email` tool instantly moves from "AI's View" to "Hidden from AI." It's a split-panel visualization where the left side shows what the AI can see (green) and the right shows what's been omitted (gray, strikethrough). Watching tools appear and disappear as you toggle scopes makes the Authorization by Omission concept visceral — you're not just reading about it, you're seeing the AI's world shrink and expand in real-time.

If I were building this for production, I'd add per-session authorization (different users get different tool sets) and scope escalation flows (the AI can request additional scopes through the dashboard, pending user approval). The foundation Auth0 Token Vault provides makes all of these extensions straightforward.

**The key insight:** AI agent authorization shouldn't happen at the execution layer. It should happen at the discovery layer. And Auth0 Token Vault gives you the infrastructure to make that possible without building a token management system from scratch.

> **--- END BLOG POST ---**
