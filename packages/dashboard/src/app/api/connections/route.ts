import { NextResponse } from "next/server";
import { getAccessToken, SERVICES } from "@/lib/token-vault";

/**
 * GET /api/connections
 * Check if Auth0 client credentials are working (connection to Auth0 is alive).
 */
export async function GET() {
  let auth0Connected = false;
  try {
    await getAccessToken();
    auth0Connected = true;
  } catch {
    auth0Connected = false;
  }

  // Scope-based connection status from env
  const scopeVars: Record<string, string> = {
    gmail: process.env.GMAIL_SCOPES ?? "",
    github: process.env.GITHUB_SCOPES ?? "",
    calendar: process.env.CALENDAR_SCOPES ?? "",
  };

  const connections = SERVICES.map((svc) => ({
    id: svc.id,
    name: svc.name,
    icon: svc.icon,
    connected: auth0Connected && scopeVars[svc.id].length > 0,
  }));

  return NextResponse.json({ connections });
}
