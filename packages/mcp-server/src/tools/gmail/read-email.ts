import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const readEmail: ToolDef = {
  name: "read_email",
  description: "Read the full content of a Gmail message by its ID.",
  service: "gmail",
  requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  inputSchema: z.object({
    messageId: z.string().describe("The Gmail message ID"),
  }),
  async execute(args, accessToken) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${args.messageId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error(`Gmail API error: ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    const headers = Object.fromEntries(
      (data.payload?.headers ?? []).map((h: any) => [h.name, h.value])
    );

    // Extract plain text body
    let body = "";
    function extractText(part: any): void {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body += Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
      if (part.parts) part.parts.forEach(extractText);
    }
    extractText(data.payload);

    return {
      id: data.id,
      threadId: data.threadId,
      subject: headers["Subject"] ?? "(no subject)",
      from: headers["From"] ?? "",
      to: headers["To"] ?? "",
      date: headers["Date"] ?? "",
      body: body || data.snippet || "(no text content)",
      labels: data.labelIds ?? [],
    };
  },
};
