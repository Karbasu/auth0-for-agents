import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Shared scopes file at monorepo root — same file the MCP server watches */
const SCOPES_FILE = path.resolve(process.cwd(), "../../scopes.json");

interface ScopeEntry {
  scope: string;
  expiresAt?: number;
}

interface ScopesData {
  gmail: ScopeEntry[];
  github: ScopeEntry[];
  calendar: ScopeEntry[];
}

function readScopesFile(): ScopesData {
  try {
    const raw = JSON.parse(fs.readFileSync(SCOPES_FILE, "utf-8"));
    // Normalize: handle both string[] and ScopeEntry[] formats
    const normalize = (arr: (string | ScopeEntry)[]): ScopeEntry[] =>
      (arr ?? []).map((e) => (typeof e === "string" ? { scope: e } : e));
    return {
      gmail: normalize(raw.gmail),
      github: normalize(raw.github),
      calendar: normalize(raw.calendar),
    };
  } catch {
    return { gmail: [], github: [], calendar: [] };
  }
}

/**
 * GET /api/scopes
 * Read current scopes from the shared file.
 * Filters out expired scopes before returning.
 */
export async function GET() {
  const data = readScopesFile();
  const now = Date.now();

  // Filter out expired scopes for the response
  const active: ScopesData = {
    gmail: data.gmail.filter((e) => !e.expiresAt || e.expiresAt > now),
    github: data.github.filter((e) => !e.expiresAt || e.expiresAt > now),
    calendar: data.calendar.filter((e) => !e.expiresAt || e.expiresAt > now),
  };

  return NextResponse.json(active);
}

/**
 * POST /api/scopes
 * Write new scopes to the shared file.
 * Accepts ScopeEntry[] format with optional expiresAt per scope.
 * The MCP server watches this file and sends tools/list_changed automatically.
 */
export async function POST(req: Request) {
  const scopes: ScopesData = await req.json();

  const valid =
    scopes &&
    Array.isArray(scopes.gmail) &&
    Array.isArray(scopes.github) &&
    Array.isArray(scopes.calendar);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid scopes format" },
      { status: 400 }
    );
  }

  fs.writeFileSync(SCOPES_FILE, JSON.stringify(scopes, null, 2));

  return NextResponse.json({ ok: true });
}
