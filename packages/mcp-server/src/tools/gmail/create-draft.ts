import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const createDraft: ToolDef = {
  name: "create_draft",
  description:
    "Create a draft email in Gmail. The draft can be reviewed and sent by the user.",
  service: "gmail",
  requiredScopes: ["https://www.googleapis.com/auth/gmail.compose"],
  inputSchema: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Plain text email body"),
  }),
  async execute(args, accessToken) {
    const raw = [
      `To: ${args.to}`,
      `Subject: ${args.subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      args.body,
    ].join("\r\n");

    const encoded = Buffer.from(raw)
      .toString("base64url");

    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { raw: encoded },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gmail API error: ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    return {
      draftId: data.id,
      messageId: data.message?.id,
      status: "Draft created successfully. User can review and send from Gmail.",
    };
  },
};
