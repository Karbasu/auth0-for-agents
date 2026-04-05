import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const readIssue: ToolDef = {
  name: "read_issue",
  description:
    "Read a specific GitHub issue including its body and comments.",
  service: "github",
  type: "read",
  requiredScopes: ["repo"],
  inputSchema: z.object({
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    issueNumber: z.number().int().describe("Issue number"),
  }),
  async execute(args, accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    };

    const [issueRes, commentsRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${args.owner}/${args.repo}/issues/${args.issueNumber}`,
        { headers }
      ),
      fetch(
        `https://api.github.com/repos/${args.owner}/${args.repo}/issues/${args.issueNumber}/comments?per_page=20`,
        { headers }
      ),
    ]);

    if (!issueRes.ok)
      throw new Error(`GitHub API error: ${issueRes.status} ${await issueRes.text()}`);

    const issue: any = await issueRes.json();
    const comments: any = commentsRes.ok ? await commentsRes.json() : [];

    return {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user?.login,
      body: issue.body ?? "",
      labels: issue.labels?.map((l: any) => l.name) ?? [],
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      comments: comments.map((c: any) => ({
        author: c.user?.login,
        body: c.body,
        createdAt: c.created_at,
      })),
    };
  },
};
