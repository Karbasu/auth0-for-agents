import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const listIssues: ToolDef = {
  name: "list_issues",
  description:
    "List issues for a GitHub repository.",
  service: "github",
  requiredScopes: ["repo"],
  inputSchema: z.object({
    owner: z.string().describe("Repository owner (user or org)"),
    repo: z.string().describe("Repository name"),
    state: z
      .enum(["open", "closed", "all"])
      .default("open")
      .describe("Issue state filter"),
    perPage: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Results per page"),
  }),
  async execute(args, accessToken) {
    const params = new URLSearchParams({
      state: args.state ?? "open",
      per_page: String(args.perPage ?? 20),
    });

    const res = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/issues?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
    const issues: any = await res.json();

    return {
      issues: issues.map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        author: i.user?.login,
        labels: i.labels?.map((l: any) => l.name) ?? [],
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        url: i.html_url,
      })),
    };
  },
};
