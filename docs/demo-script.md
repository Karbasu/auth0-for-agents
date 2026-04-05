# VaultMCP Demo Video Script (3 minutes)

## Pre-Recording Checklist

Before you start recording:

1. **Open Claude Code** in the `auth0-for-agents` directory (new conversation so MCP tools are fresh)
2. **Open the dashboard** at `http://localhost:3000/dashboard` in Chrome
3. **Set your .env scopes to ALL SCOPES** (we'll use the dashboard toggles to restrict them visually):
   ```
   GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.compose,https://www.googleapis.com/auth/gmail.send
   GITHUB_SCOPES=repo,read:user
   CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/calendar.events
   ```
4. **Rebuild**: `npm run build:mcp && npm run build:dashboard`
5. **Start dashboard**: `npm run dev:dashboard`
6. **Screen layout**: Split screen — Claude Code on left, Dashboard on right (or switch between tabs)
7. **Font size**: Make terminal and browser font large enough to read on video

---

## THE SCRIPT

### [0:00 - 0:20] HOOK + PROBLEM (Insight Value)

**Show**: Title card or dashboard landing page (`localhost:3000`)

**Say**:
> "Every AI agent that needs to access Gmail, GitHub, or Calendar has the same problem — OAuth. And when an agent knows about a tool it can't use, it tries to work around it — retries, hallucinated arguments, social engineering the user.
>
> VaultMCP solves this with one idea: **Authorization by Omission**. The AI never sees tools it isn't authorized to use."

---

### [0:20 - 1:00] DASHBOARD WALKTHROUGH + SCOPE TOGGLES (Design + User Control + Security Model)

**Show**: Switch to `localhost:3000/dashboard`

**Say**:
> "Here's the VaultMCP dashboard. At the top — three services connected through Auth0 Token Vault: Gmail, GitHub, and Google Calendar. My app never stores any OAuth tokens. Auth0 holds them securely."

**Action**: Point to the Connection Panel (all three green)

**Say**:
> "Below that is Scope Control — toggle switches for every OAuth scope. This is where Authorization by Omission comes alive."

**Action**: Point to the Scope Control section. Show all toggles are ON.

**Say**:
> "Right now all scopes are granted. Look at the AI's Perspective panel — 13 tools visible, zero hidden."

**Action**: Point to the AI's Perspective panel (left side green, right side empty)

**THE MONEY SHOT — do this slowly and clearly:**

**Say**:
> "Now watch what happens when I revoke `gmail.send`..."

**Action**: Click the `gmail.send` toggle OFF.

**Pause for 1 second** — let judges SEE the change happen.

**Say**:
> "Instantly — `send_email` moves from the AI's View to Hidden. The tool doesn't exist anymore. There's no 403 error. There's nothing to work around. The AI simply can't see it."

**Action**: Toggle OFF `gmail.compose` too.

**Say**:
> "`create_draft` disappears too. Now the AI can only read emails, not write them. And this is all controlled by the user, not by code."

**Action**: Toggle both back ON.

**Say**:
> "Toggle them back — tools reappear. The user controls the AI's entire surface area."

---

### [1:00 - 1:50] LIVE DEMO — CROSS-SERVICE QUERY (Technical Execution)

**Show**: Switch to Claude Code terminal

**Say**:
> "Let me show this working end-to-end. I'll ask Claude to do something that spans all three services."

**Action**: Type this prompt into Claude Code:
```
Search my Gmail for any emails about "hackathon", then check my GitHub repos, and tell me what's on my calendar this week.
```

**Wait for Claude to call the tools** (search_emails, list_repos, list_events)

**Say** (while Claude is working):
> "Claude is calling three tools across three services. Under the hood, VaultMCP handles the entire token flow through Auth0:
> - Gets a Management API token
> - Fetches my user identity from Auth0
> - Uses Token Vault's stored refresh token to get a fresh short-lived access token
> - Calls the downstream API
> - Logs everything to the audit trail
>
> Claude just sees tools and results. All the OAuth complexity is invisible."

**Action**: After Claude responds, switch to dashboard — scroll to the Audit Trail section.

**Say**:
> "And here in the audit trail — three calls logged with timestamps, response times, and success status. Full forensic visibility."

---

### [1:50 - 2:20] THE OMISSION PROOF (Security Model)

**Show**: Switch back to Claude Code

**Say**:
> "Now the real test. Can the AI work around Authorization by Omission?"

**Action**: Type into Claude Code:
```
Send an email to test@example.com saying "Hello from AI"
```

**Wait for Claude's response** — it will say it can send emails (since all scopes are granted in the MCP server).

**If Claude sends it (all scopes are on)** — that's fine! Say:
> "Claude can send this email because I've granted `gmail.send`. But if I were to remove that scope and restart the MCP server — Claude wouldn't even know sending email is possible. Not a permission error. Not a 403. The tool would simply not exist."

**Action**: Switch to dashboard, toggle OFF `gmail.send` in the Scope Control panel to demonstrate visually.

**Say**:
> "See — `send_email` is now in the Hidden panel. From the AI's perspective, this capability was never there."

---

### [2:20 - 2:45] TOOL CATALOG DEEP DIVE (Technical Execution + Design)

**Show**: Scroll to the Full Tool Catalog section on the dashboard.

**Say**:
> "The full catalog shows all 13 tools grouped by service — Gmail, GitHub, Calendar. Each has a read or write badge."

**Action**: Click on `create_event` to expand it — show the scope requirement.

**Say**:
> "Click any tool to see exactly which scopes it needs. Green means granted, red means missing. Users always know precisely what the AI can and can't do."

---

### [2:45 - 3:00] CLOSING (Insight Value + Potential Impact)

**Show**: Dashboard overview or landing page

**Say**:
> "VaultMCP shows that AI agent authorization doesn't have to be an afterthought. Auth0 Token Vault handles the tokens. MCP's tool discovery is the control point. And Authorization by Omission means **the most secure permission is the one the AI never knows about**.
>
> This works with Claude Code, Claude Desktop, or any MCP client — and the pattern extends to any OAuth service."

---

## JUDGING CRITERIA COVERAGE MAP

| Criterion | Where It's Covered | Timestamp |
|-----------|-------------------|-----------|
| **Security Model** | Scope toggle → tool vanishes live, Token Vault = no stored tokens, omission proof | 0:20-1:00, 1:50-2:20 |
| **User Control** | Interactive scope toggles, AI's View panel, click-to-expand scope details | 0:20-1:00, 2:20-2:45 |
| **Technical Execution** | Live 3-service query, token flow explanation, audit trail with real timing | 1:00-1:50 |
| **Design** | Scope toggles, AI's Perspective split panel, grouped tool catalog, dark theme | 0:20-1:00, 2:20-2:45 |
| **Potential Impact** | Works with any MCP client, any OAuth service, pattern is reusable | 2:45-3:00 |
| **Insight Value** | "Authorization by Omission" — opening hook + closing insight | 0:00-0:20, 2:45-3:00 |

---

## RECORDING TIPS

1. **The scope toggle moment is your hero shot** — do it slowly, let judges see the tool move from "AI's View" to "Hidden". This is what they'll remember.
2. **Zoom in** on the dashboard panels — judges need to read the text in the video.
3. **Don't show .env secrets** — if you show the .env file, blur or crop out your client secret.
4. **Use Loom, OBS, or Windows Game Bar** to record (Win+G on Windows).
5. **If a tool call fails** — that's fine! Show the audit log capturing the failure. That demonstrates error handling.
6. **Show real personal data** — actual email subjects, real repo names, real calendar events. Not mock data. This is how judges know it's real.
7. **Speak confidently** — you built something that solves a real problem. The pattern is genuinely novel.

---

## PHRASES THAT HIT JUDGING CRITERIA

Keep these in your back pocket:

- **Security**: "The app never touches refresh tokens. Auth0 Token Vault holds them."
- **Security**: "The AI can't hack, social-engineer, or hallucinate its way past a tool that doesn't exist."
- **User Control**: "Toggle a scope off — the tool vanishes. Toggle it on — the tool appears. The user controls the surface area."
- **User Control**: "The AI's Perspective panel shows exactly what the AI can see. No surprises."
- **Technical**: "13 tools across 3 services, all using the same auth pattern through Auth0."
- **Technical**: "Three-level caching — management token, downstream tokens, identity data."
- **Design**: "Scope toggles, AI's View split panel, grouped tool catalog, full audit trail — all in one dashboard."
- **Impact**: "This pattern works for any OAuth service — Slack, Notion, Salesforce — just add a tool file."
- **Insight**: "Traditional auth fails at the execution layer. We fail at the discovery layer — before execution happens."
- **Insight**: "The most secure permission is the one the AI never knows about."
