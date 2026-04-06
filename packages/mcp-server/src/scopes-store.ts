import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import type { ServiceId } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Shared scopes file at monorepo root — both MCP server and dashboard read/write this */
const SCOPES_FILE = path.resolve(__dirname, "../../../scopes.json");

export interface ScopesData {
  gmail: string[];
  github: string[];
  calendar: string[];
}

/** Get default scopes from environment variables */
function getDefaultScopes(): ScopesData {
  return {
    gmail: config.scopes.gmail,
    github: config.scopes.github,
    calendar: config.scopes.calendar,
  };
}

/** Read current scopes from the shared file (falls back to env vars) */
export function getScopes(): ScopesData {
  try {
    const data = fs.readFileSync(SCOPES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return getDefaultScopes();
  }
}

/** Check if a service has all required scopes */
export function hasScopesDynamic(
  service: ServiceId,
  required: string[]
): boolean {
  const scopes = getScopes();
  const granted = scopes[service] ?? [];
  return required.every((s) => granted.includes(s));
}

/** Initialize scopes file from env vars if it doesn't exist */
export function initScopesFile(): void {
  const defaults = getDefaultScopes();
  // Always write on startup so env var changes are picked up
  fs.writeFileSync(SCOPES_FILE, JSON.stringify(defaults, null, 2));
  process.stderr.write(
    `[VaultMCP] Scopes file initialized: ${SCOPES_FILE}\n`
  );
}

/** Watch the scopes file for external changes (from dashboard) */
export function watchScopes(callback: () => void): fs.StatWatcher {
  return fs.watchFile(SCOPES_FILE, { interval: 500 }, () => {
    process.stderr.write("[VaultMCP] Scopes file changed — updating tool list\n");
    callback();
  });
}

export function getScopesFilePath(): string {
  return SCOPES_FILE;
}
