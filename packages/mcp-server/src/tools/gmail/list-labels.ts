import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const listLabels: ToolDef = {
  name: "list_labels",
  description: "List all Gmail labels for the authenticated user.",
  service: "gmail",
  requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  inputSchema: z.object({}),
  async execute(_args, accessToken) {
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error(`Gmail API error: ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    return {
      labels: (data.labels ?? []).map((l: any) => ({
        id: l.id,
        name: l.name,
        type: l.type,
      })),
    };
  },
};
