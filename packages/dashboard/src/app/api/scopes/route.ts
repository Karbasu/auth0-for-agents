import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Shared scopes file at monorepo root — same file the MCP server watches */
const SCOPES_FILE = path.resolve(process.cwd(), "../../scopes.json");

/**
 * GET /api/scopes
 * Read current scopes from the shared file.
 */
export async function GET() {
  try {
    const data = fs.readFileSync(SCOPES_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    // File doesn't exist yet — return empty
    return NextResponse.json({ gmail: [], github: [], calendar: [] });
  }
}

/**
 * POST /api/scopes
 * Write new scopes to the shared file.
 * The MCP server watches this file and sends tools/list_changed
 * notification to the AI client automatically.
 */
export async function POST(req: Request) {
  const scopes = await req.json();

  // Validate structure
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
