/**
 * In-memory audit store for the dashboard.
 * In production this would be backed by a database.
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  tool: string;
  service: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

let entries: AuditEntry[] = [];
let nextId = 1;

export function addAuditEntry(
  entry: Omit<AuditEntry, "id">
): AuditEntry {
  const full: AuditEntry = { ...entry, id: String(nextId++) };
  entries.push(full);
  // Keep only the last 500 entries
  if (entries.length > 500) entries = entries.slice(-500);
  return full;
}

export function getAuditEntries(limit = 50): AuditEntry[] {
  return entries.slice(-limit).reverse();
}

export function clearAuditEntries(): void {
  entries = [];
}
