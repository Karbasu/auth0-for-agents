import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env from monorepo root (two levels up from packages/mcp-server/dist)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });  // from dist/ -> mcp-server -> packages -> root
dotenv.config(); // also try CWD as fallback

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
  userId: required("AUTH0_USER_ID"),
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
