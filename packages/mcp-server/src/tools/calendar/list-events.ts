import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const listEvents: ToolDef = {
  name: "list_events",
  description:
    "List upcoming events from the user's primary Google Calendar.",
  service: "calendar",
  type: "read",
  requiredScopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  inputSchema: z.object({
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of events to return"),
    query: z
      .string()
      .optional()
      .describe("Free-text search query to filter events"),
  }),
  async execute(args, accessToken) {
    const params = new URLSearchParams({
      maxResults: String(args.maxResults ?? 10),
      orderBy: "startTime",
      singleEvents: "true",
      timeMin: new Date().toISOString(),
    });
    if (args.query) params.set("q", args.query);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok)
      throw new Error(`Calendar API error: ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    return {
      events: (data.items ?? []).map((e: any) => ({
        id: e.id,
        summary: e.summary ?? "(no title)",
        start: e.start?.dateTime ?? e.start?.date ?? "",
        end: e.end?.dateTime ?? e.end?.date ?? "",
        location: e.location ?? "",
        status: e.status,
      })),
    };
  },
};
