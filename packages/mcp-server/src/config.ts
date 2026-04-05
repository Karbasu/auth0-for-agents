import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const config = {
  auth0: {
    domain: required("AUTH0_DOMAIN"),
    clientId: required("AUTH0_CLIENT_ID"),
    clientSecret: required("AUTH0_CLIENT_SECRET"),
    audience: required("AUTH0_AUDIENCE"),
  },
  scopes: {
    gmail: optional("GMAIL_SCOPES")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    github: optional("GITHUB_SCOPES")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    calendar: optional("CALENDAR_SCOPES")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  },
} as const;
