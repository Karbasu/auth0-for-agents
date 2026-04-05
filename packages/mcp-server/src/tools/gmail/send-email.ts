import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const sendEmail: ToolDef = {
  name: "send_email",
  description:
    "Send a draft email by its draft ID (created via create_draft).",
  service: "gmail",
  type: "write",
  requiredScopes: ["https://www.googleapis.com/auth/gmail.send"],
  inputSchema: z.object({
    draftId: z.string().describe("The draft ID returned by create_draft"),
  }),
  async execute(args, accessToken) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${args.draftId}/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) throw new Error(`Gmail API error: ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    return {
      messageId: data.id,
      threadId: data.threadId,
      status: "Email sent successfully.",
    };
  },
};
