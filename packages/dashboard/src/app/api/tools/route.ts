import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Complete tool catalog with scope requirements */
const TOOL_CATALOG = [
  // Gmail (read)
  { name: "search_emails", service: "gmail", requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"], type: "read" },
  { name: "read_email", service: "gmail", requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"], type: "read" },
  { name: "list_labels", service: "gmail", requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"], type: "read" },
  // Gmail (write)
  { name: "create_draft", service: "gmail", requiredScopes: ["https://www.googleapis.com/auth/gmail.compose"], type: "write" },
  { name: "send_email", service: "gmail", requiredScopes: ["https://www.googleapis.com/auth/gmail.send"], type: "write" },
  // GitHub (read)
  { name: "list_repos", service: "github", requiredScopes: ["repo", "read:user"], type: "read" },
  { name: "list_issues", service: "github", requiredScopes: ["repo"], type: "read" },
  { name: "read_issue", service: "github", requiredScopes: ["repo"], type: "read" },
  // GitHub (write)
  { name: "create_comment", service: "github", requiredScopes: ["repo"], type: "write" },
  { name: "create_issue", service: "github", requiredScopes: ["repo"], type: "write" },
  // Calendar (read)
  { name: "list_events", service: "calendar", requiredScopes: ["https://www.googleapis.com/auth/calendar.readonly"], type: "read" },
  { name: "get_event", service: "calendar", requiredScopes: ["https://www.googleapis.com/auth/calendar.readonly"], type: "read" },
  // Calendar (write)
  { name: "create_event", service: "calendar", requiredScopes: ["https://www.googleapis.com/auth/calendar.events"], type: "write" },
];

/** Shared scopes file at monorepo root */
const SCOPES_FILE = path.resolve(process.cwd(), "../../scopes.json");

interface ScopeEntry {
  scope: string;
  expiresAt?: number;
}

/** Read scopes from shared file, normalize ScopeEntry format, filter expired */
function readScopes(): Record<string, string[]> {
  try {
    const data = JSON.parse(fs.readFileSync(SCOPES_FILE, "utf-8"));
    const now = Date.now();
    const normalize = (arr: (string | ScopeEntry)[]): string[] =>
      (arr ?? [])
        .map((e) => (typeof e === "string" ? { scope: e } : e))
        .filter((e) => !e.expiresAt || e.expiresAt > now)
        .map((e) => e.scope);
    return {
      gmail: normalize(data.gmail),
      github: normalize(data.github),
      calendar: normalize(data.calendar),
    };
  } catch {
    // Fall back to env vars if file doesn't exist
    return {
      gmail: (process.env.GMAIL_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      github: (process.env.GITHUB_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      calendar: (process.env.CALENDAR_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    };
  }
}

/**
 * GET /api/tools
 * Return all tools and their availability based on current scopes.
 */
export async function GET() {
  const grantedScopes = readScopes();

  const tools = TOOL_CATALOG.map((tool) => {
    const granted = grantedScopes[tool.service] ?? [];
    const available = tool.requiredScopes.every((s) => granted.includes(s));
    return { ...tool, available };
  });

  return NextResponse.json({ tools, grantedScopes });
}
