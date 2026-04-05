import { NextResponse } from "next/server";

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

/**
 * GET /api/tools
 * Return all tools and their availability based on configured scopes.
 */
export async function GET() {
  const grantedScopes: Record<string, string[]> = {
    gmail: (process.env.GMAIL_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    github: (process.env.GITHUB_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    calendar: (process.env.CALENDAR_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  };

  const tools = TOOL_CATALOG.map((tool) => {
    const granted = grantedScopes[tool.service] ?? [];
    const available = tool.requiredScopes.every((s) => granted.includes(s));
    return { ...tool, available };
  });

  return NextResponse.json({ tools, grantedScopes });
}
