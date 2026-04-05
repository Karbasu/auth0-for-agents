/**
 * Token Vault client — uses Auth0 client credentials to get access tokens.
 */

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getAccessToken(): Promise<string> {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const audience = process.env.AUTH0_AUDIENCE;

  if (!domain || !clientId || !clientSecret || !audience) {
    throw new Error("Missing Auth0 credentials in environment");
  }

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth0 token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

/** Service metadata for the dashboard UI */
export const SERVICES = [
  { id: "gmail" as const, name: "Gmail", icon: "Mail", connection: "google-oauth2" },
  { id: "github" as const, name: "GitHub", icon: "Github", connection: "github" },
  { id: "calendar" as const, name: "Google Calendar", icon: "Calendar", connection: "google-oauth2" },
] as const;
