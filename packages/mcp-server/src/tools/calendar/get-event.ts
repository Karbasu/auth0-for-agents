import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const getEvent: ToolDef = {
  name: "get_event",
  description:
    "Get details of a specific Google Calendar event by its ID.",
  service: "calendar",
  requiredScopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  inputSchema: z.object({
    eventId: z.string().describe("The calendar event ID"),
  }),
  async execute(args, accessToken) {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok)
      throw new Error(`Calendar API error: ${res.status} ${await res.text()}`);
    const e: any = await res.json();

    return {
      id: e.id,
      summary: e.summary ?? "(no title)",
      description: e.description ?? "",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      location: e.location ?? "",
      status: e.status,
      attendees: (e.attendees ?? []).map((a: any) => ({
        email: a.email,
        responseStatus: a.responseStatus,
      })),
      organizer: e.organizer?.email ?? "",
    };
  },
};
