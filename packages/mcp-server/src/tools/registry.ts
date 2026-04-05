import { hasScopes } from "../auth/scope-resolver.js";
import type { ToolDef } from "../types.js";

// Import all tools
import { searchEmails, readEmail, listLabels, createDraft } from "./gmail/index.js";
import { listRepos, listIssues, readIssue, createComment } from "./github/index.js";
import { listEvents, getEvent, createEvent } from "./calendar/index.js";

/** Complete catalog of every tool VaultMCP knows about */
export const ALL_TOOLS: ToolDef[] = [
  // Gmail
  searchEmails,
  readEmail,
  listLabels,
  createDraft,
  // GitHub
  listRepos,
  listIssues,
  readIssue,
  createComment,
  // Calendar
  listEvents,
  getEvent,
  createEvent,
];

/**
 * Authorization by omission: return ONLY the tools whose required scopes
 * are satisfied by the user's granted scopes. Tools the user hasn't
 * authorized simply don't exist from the AI's perspective.
 */
export function getAvailableTools(): ToolDef[] {
  return ALL_TOOLS.filter((tool) =>
    hasScopes(tool.service, tool.requiredScopes)
  );
}

/**
 * Get the full catalog with availability status (for dashboard display).
 */
export function getToolCatalog(): Array<
  ToolDef & { available: boolean }
> {
  return ALL_TOOLS.map((tool) => ({
    ...tool,
    available: hasScopes(tool.service, tool.requiredScopes),
  }));
}
