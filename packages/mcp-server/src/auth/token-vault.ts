import { config } from "../config.js";
import type { ServiceId, TokenExchangeResponse } from "../types.js";

/** Cached tokens: service -> { token, expiresAt } */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Get an access token for a downstream service using Auth0 client credentials.
 * Tokens are cached until they expire.
 */
export async function exchangeToken(service: ServiceId): Promise<string> {
  // Check cache first
  const cached = tokenCache.get(service);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const url = `https://${config.auth0.domain}/oauth/token`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.auth0.clientId,
      client_secret: config.auth0.clientSecret,
      audience: config.auth0.audience,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Token exchange failed for ${service} (${res.status}): ${err}`
    );
  }

  const data = (await res.json()) as TokenExchangeResponse;

  // Cache with 60s buffer before expiry
  tokenCache.set(service, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  });

  return data.access_token;
}
