import { NextResponse } from "next/server";
import { getAuditEntries, addAuditEntry } from "@/lib/audit-store";

/**
 * GET /api/audit — return recent audit log entries.
 */
export async function GET() {
  return NextResponse.json({ entries: getAuditEntries() });
}

/**
 * POST /api/audit — add a new audit entry (called by MCP server in HTTP mode).
 */
export async function POST(request: Request) {
  const body = await request.json();
  const entry = addAuditEntry({
    timestamp: body.timestamp ?? new Date().toISOString(),
    tool: body.tool,
    service: body.service,
    success: body.success ?? true,
    durationMs: body.durationMs ?? 0,
    error: body.error,
  });

  return NextResponse.json({ entry });
}
