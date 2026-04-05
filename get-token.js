const http = require("http");
const fs = require("fs");

// Load .env
const lines = fs.readFileSync(".env", "utf-8").split("\n");
const env = {};
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq > 0) env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

const domain = env.AUTH0_DOMAIN;
const clientId = env.AUTH0_CLIENT_ID;
const clientSecret = env.AUTH0_CLIENT_SECRET;
const audience = env.AUTH0_AUDIENCE;
const primaryUserId = env.AUTH0_USER_ID; // e.g. google-oauth2|106783...
const redirectUri = "http://localhost:3000/callback";

// Which connection to login with (pass as CLI arg: google or github)
const arg = process.argv[2] || "google";
const connection = arg === "github" ? "github" : "google-oauth2";

// Request downstream scopes so Auth0 stores the tokens
const connectionScopes = connection === "google-oauth2"
  ? "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events"
  : "repo read:user";

/**
 * Link a secondary identity to the primary user via Auth0 Management API.
 */
async function linkAccount(secondaryIdToken) {
  // Get management API token
  const mgmtRes = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: "client_credentials",
    }),
  });
  const mgmtData = await mgmtRes.json();
  if (mgmtData.error) throw new Error(`Mgmt token failed: ${mgmtData.error_description}`);

  // Link the secondary account to the primary user
  const linkRes = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}/identities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mgmtData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ link_with: secondaryIdToken }),
    }
  );
  const linkData = await linkRes.json();
  if (!linkRes.ok) throw new Error(`Link failed (${linkRes.status}): ${JSON.stringify(linkData)}`);
  return linkData;
}

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const url = new URL(req.url, "http://localhost:3000");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("\nAuth0 error:", error, url.searchParams.get("error_description"));
    res.writeHead(400);
    res.end("Auth0 error: " + url.searchParams.get("error_description"));
    setTimeout(() => process.exit(1), 1000);
    return;
  }

  if (!code) {
    res.writeHead(400);
    res.end("No code in callback");
    return;
  }

  console.log("\nGot authorization code, exchanging for tokens...\n");

  try {
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();

    if (data.error) {
      console.error("Error:", data.error, data.error_description);
      res.writeHead(500);
      res.end("Token exchange failed: " + data.error_description);
      setTimeout(() => process.exit(1), 1000);
      return;
    }

    console.log("=== SUCCESS ===\n");
    console.log("Refresh Token:", data.refresh_token || "(none - check grant types)");

    if (data.refresh_token) {
      // Update .env with new refresh token
      let envContent = fs.readFileSync(".env", "utf-8");
      if (envContent.includes("USER_REFRESH_TOKEN=")) {
        envContent = envContent.replace(
          /USER_REFRESH_TOKEN=.*/,
          `USER_REFRESH_TOKEN=${data.refresh_token}`
        );
        fs.writeFileSync(".env", envContent);
        console.log(">> Updated USER_REFRESH_TOKEN in .env");
      } else {
        fs.appendFileSync(".env", `\nUSER_REFRESH_TOKEN=${data.refresh_token}\n`);
        console.log(">> Added USER_REFRESH_TOKEN to .env");
      }
    }

    // If this is a secondary connection (not the primary), link it to the primary user
    if (primaryUserId && !primaryUserId.startsWith(connection)) {
      console.log(`\n>> Linking ${connection} identity to primary user ${primaryUserId}...`);
      try {
        const identities = await linkAccount(data.id_token);
        console.log(`>> Linked! User now has ${identities.length} identities:`);
        for (const id of identities) {
          console.log(`   - ${id.connection} (${id.provider}|${id.user_id})`);
        }
      } catch (linkErr) {
        console.error(">> Link failed:", linkErr.message);
        console.log(">> You may need to manually link the account in Auth0 dashboard.");
      }
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h1>Success!</h1><p>Logged in via ${connection}. You can close this tab.</p>`);
  } catch (err) {
    console.error("Fetch error:", err);
    res.writeHead(500);
    res.end("Error: " + err.message);
  }

  setTimeout(() => process.exit(0), 1000);
});

server.listen(3000, () => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access",
    audience: audience,
    connection: connection,
    connection_scope: connectionScopes,
  });

  const loginUrl = `https://${domain}/authorize?${params}`;

  console.log(`\n=== Login with ${arg.toUpperCase()} ===\n`);
  console.log("Open this URL in your browser:\n");
  console.log(loginUrl);
  console.log("\nWaiting for callback...\n");
});
