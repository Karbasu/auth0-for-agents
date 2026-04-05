import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const createIssue: ToolDef = {
  name: "create_issue",
  description: "Create a new issue in a GitHub repository.",
  service: "github",
  type: "write",
  requiredScopes: ["repo"],
  inputSchema: z.object({
    owner: z.string().describe("Repository owner (user or org)"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue body (Markdown supported)"),
    labels: z.array(z.string()).optional().describe("Label names to apply"),
  }),
  async execute(args, accessToken) {
    const payload: any = { title: args.title };
    if (args.body) payload.body = args.body;
    if (args.labels?.length) payload.labels = args.labels;

    const res = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
    const issue: any = await res.json();

    return {
      issueNumber: issue.number,
      title: issue.title,
      url: issue.html_url,
      status: "Issue created successfully.",
    };
  },
};
