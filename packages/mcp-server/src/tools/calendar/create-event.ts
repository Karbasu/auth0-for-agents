import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const createEvent: ToolDef = {
  name: "create_event",
  description:
    "Create a new event on the user's primary Google Calendar.",
  service: "calendar",
  requiredScopes: ["https://www.googleapis.com/auth/calendar.events"],
  inputSchema: z.object({
    summary: z.string().describe("Event title"),
    description: z.string().optional().describe("Event description"),
    startDateTime: z
      .string()
      .describe("Start time in ISO 8601 format (e.g. 2025-01-15T09:00:00-05:00)"),
    endDateTime: z
      .string()
      .describe("End time in ISO 8601 format"),
    location: z.string().optional().describe("Event location"),
    attendees: z
      .array(z.string())
      .optional()
      .describe("List of attendee email addresses"),
  }),
  async execute(args, accessToken) {
    const event: any = {
      summary: args.summary,
      start: { dateTime: args.startDateTime },
      end: { dateTime: args.endDateTime },
    };
    if (args.description) event.description = args.description;
    if (args.location) event.location = args.location;
    if (args.attendees?.length) {
      event.attendees = args.attendees.map((email: string) => ({ email }));
    }

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!res.ok)
      throw new Error(`Calendar API error: ${res.status} ${await res.text()}`);
    const created: any = await res.json();

    return {
      eventId: created.id,
      htmlLink: created.htmlLink,
      status: "Event created successfully.",
    };
  },
};
