import { config } from "../config.js";
import type { ServiceId, TokenExchangeResponse } from "../types.js";
import { SERVICE_CONNECTIONS } from "../types.js";

/** Cached management API token */
let mgmtToken: { token: string; expiresAt: number } | null = null;

/** Cached downstream tokens: connection -> { token, expiresAt } */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/** Cached identity data: connection -> { accessToken, refreshToken } */
const identityCache = new Map<string, { accessToken: string; refreshToken?: string }>();

/**
 * Get Auth0 Management API token (client credentials).
 */
async function getManagementToken(): Promise<string> {
  if (mgmtToken && Date.now() < mgmtToken.expiresAt) {
    return mgmtToken.token;
  }

  const res = await fetch(`https://${config.auth0.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.auth0.clientId,
      client_secret: config.auth0.clientSecret,
      audience: `https://${config.auth0.domain}/api/v2/`,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Management API token failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as TokenExchangeResponse;
  mgmtToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

/**
 * Fetch identity tokens from Auth0 Management API.
 */
async function fetchIdentityTokens(connection: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const mgmt = await getManagementToken();
  const userRes = await fetch(
    `https://${config.auth0.domain}/api/v2/users/${encodeURIComponent(config.userId)}`,
    { headers: { Authorization: `Bearer ${mgmt}` } }
  );

  if (!userRes.ok) {
    throw new Error(`Failed to fetch user (${userRes.status}): ${await userRes.text()}`);
  }

  const user: any = await userRes.json();
  const identity = user.identities?.find((i: any) => i.connection === connection);

  if (!identity?.access_token) {
    throw new Error(`No access token found for connection ${connection}. User may need to re-login.`);
  }

  return { accessToken: identity.access_token, refreshToken: identity.refresh_token };
}

/**
 * Use a Google refresh token to get a fresh access token directly from Google.
 */
async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  // We need the Google OAuth client ID/secret. Get them from the Auth0 connection config.
  const mgmt = await getManagementToken();
  const connRes = await fetch(
    `https://${config.auth0.domain}/api/v2/connections?strategy=google-oauth2`,
    { headers: { Authorization: `Bearer ${mgmt}` } }
  );
  const connections: any = await connRes.json();
  const google = connections[0];

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: google.options.client_id,
      client_secret: google.options.client_secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`);
  }

  const data: any = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

/**
 * Get a fresh downstream service access token.
 */
export async function exchangeToken(service: ServiceId): Promise<string> {
  const connection = SERVICE_CONNECTIONS[service];

  // Check cache
  const cached = tokenCache.get(connection);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  // Fetch identity from Auth0
  const identity = await fetchIdentityTokens(connection);

  // For Google connections, use the refresh token to get a fresh access token
  if (connection === "google-oauth2" && identity.refreshToken) {
    const { accessToken, expiresIn } = await refreshGoogleToken(identity.refreshToken);
    tokenCache.set(connection, {
      token: accessToken,
      expiresAt: Date.now() + (expiresIn - 60) * 1000,
    });
    return accessToken;
  }

  // For GitHub (tokens don't expire), use the stored access token directly
  tokenCache.set(connection, {
    token: identity.accessToken,
    expiresAt: Date.now() + 3600 * 1000, // re-check in 1 hour
  });
  return identity.accessToken;
}
