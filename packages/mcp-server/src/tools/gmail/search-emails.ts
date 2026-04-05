import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const searchEmails: ToolDef = {
  name: "search_emails",
  description:
    "Search Gmail messages using a query string (same syntax as the Gmail search box).",
  service: "gmail",
  requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  inputSchema: z.object({
    query: z.string().describe("Gmail search query (e.g. 'from:alice subject:hackathon')"),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of results to return"),
  }),
  async execute(args, accessToken) {
    const params = new URLSearchParams({
      q: args.query,
      maxResults: String(args.maxResults ?? 10),
    });

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error(`Gmail API error: ${res.status} ${await res.text()}`);
    const data: any = await res.json();
    const messages: any[] = data.messages ?? [];

    // Fetch snippet for each message
    const details = await Promise.all(
      messages.slice(0, args.maxResults ?? 10).map(async (m: any) => {
        const r = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!r.ok) return { id: m.id, error: `Failed to fetch: ${r.status}` };
        const d: any = await r.json();
        const headers = Object.fromEntries(
          (d.payload?.headers ?? []).map((h: any) => [h.name, h.value])
        );
        return {
          id: m.id,
          subject: headers["Subject"] ?? "(no subject)",
          from: headers["From"] ?? "",
          date: headers["Date"] ?? "",
          snippet: d.snippet ?? "",
        };
      })
    );

    return { resultCount: messages.length, messages: details };
  },
};
