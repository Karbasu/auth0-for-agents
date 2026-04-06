import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import type { ServiceId } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Shared scopes file at monorepo root — both MCP server and dashboard read/write this */
const SCOPES_FILE = path.resolve(__dirname, "../../../scopes.json");

export interface ScopeEntry {
  scope: string;
  expiresAt?: number; // Unix timestamp (ms). If set, scope auto-revokes after this time.
}

export interface ScopesData {
  gmail: ScopeEntry[];
  github: ScopeEntry[];
  calendar: ScopeEntry[];
}

/** Legacy format: plain string arrays (for backward compat) */
interface LegacyScopesData {
  gmail: (string | ScopeEntry)[];
  github: (string | ScopeEntry)[];
  calendar: (string | ScopeEntry)[];
}

/** Normalize a scope entry — handles both "scope-string" and { scope, expiresAt } */
function normalizeEntry(entry: string | ScopeEntry): ScopeEntry {
  if (typeof entry === "string") return { scope: entry };
  return entry;
}

/** Get default scopes from environment variables (no expiry) */
function getDefaultScopes(): ScopesData {
  return {
    gmail: config.scopes.gmail.map((s) => ({ scope: s })),
    github: config.scopes.github.map((s) => ({ scope: s })),
    calendar: config.scopes.calendar.map((s) => ({ scope: s })),
  };
}

/** Read current scopes from the shared file (falls back to env vars) */
export function getScopesRaw(): ScopesData {
  try {
    const data: LegacyScopesData = JSON.parse(
      fs.readFileSync(SCOPES_FILE, "utf-8")
    );
    return {
      gmail: (data.gmail ?? []).map(normalizeEntry),
      github: (data.github ?? []).map(normalizeEntry),
      calendar: (data.calendar ?? []).map(normalizeEntry),
    };
  } catch {
    return getDefaultScopes();
  }
}

/** Get active (non-expired) scope strings for a service */
export function getActiveScopes(service: ServiceId): string[] {
  const raw = getScopesRaw();
  const now = Date.now();
  return (raw[service] ?? [])
    .filter((e) => !e.expiresAt || e.expiresAt > now)
    .map((e) => e.scope);
}

/** Check if a service has all required scopes (excluding expired) */
export function hasScopesDynamic(
  service: ServiceId,
  required: string[]
): boolean {
  const granted = getActiveScopes(service);
  return required.every((s) => granted.includes(s));
}

/** Initialize scopes file from env vars */
export function initScopesFile(): void {
  const defaults = getDefaultScopes();
  fs.writeFileSync(SCOPES_FILE, JSON.stringify(defaults, null, 2));
  process.stderr.write(
    `[VaultMCP] Scopes file initialized: ${SCOPES_FILE}\n`
  );
}

/** Write scopes data to file */
function writeScopesFile(data: ScopesData): void {
  fs.writeFileSync(SCOPES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Start a timer that checks for expired scopes every 30 seconds.
 * If any scopes expire, they are removed from the file — which
 * triggers the file watcher and sends tools/list_changed.
 */
export function startExpiryChecker(): NodeJS.Timeout {
  return setInterval(() => {
    const raw = getScopesRaw();
    const now = Date.now();
    let changed = false;

    for (const service of ["gmail", "github", "calendar"] as const) {
      const before = raw[service].length;
      raw[service] = raw[service].filter((e) => {
        if (e.expiresAt && e.expiresAt <= now) {
          process.stderr.write(
            `[VaultMCP] Scope expired: ${e.scope} (${service})\n`
          );
          changed = true;
          return false;
        }
        return true;
      });
    }

    if (changed) {
      writeScopesFile(raw);
      process.stderr.write(
        "[VaultMCP] Expired scopes removed — tool list will update\n"
      );
    }
  }, 30_000);
}

/** Watch the scopes file for external changes (from dashboard) */
export function watchScopes(callback: () => void): fs.StatWatcher {
  return fs.watchFile(SCOPES_FILE, { interval: 500 }, () => {
    process.stderr.write(
      "[VaultMCP] Scopes file changed — updating tool list\n"
    );
    callback();
  });
}

export function getScopesFilePath(): string {
  return SCOPES_FILE;
}
