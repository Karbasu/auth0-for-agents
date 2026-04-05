import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const createComment: ToolDef = {
  name: "create_comment",
  description:
    "Add a comment to a GitHub issue.",
  service: "github",
  type: "write",
  requiredScopes: ["repo"],
  inputSchema: z.object({
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name"),
    issueNumber: z.number().int().describe("Issue number"),
    body: z.string().describe("Comment body (Markdown supported)"),
  }),
  async execute(args, accessToken) {
    const res = await fetch(
      `https://api.github.com/repos/${args.owner}/${args.repo}/issues/${args.issueNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: args.body }),
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
    const comment: any = await res.json();

    return {
      commentId: comment.id,
      url: comment.html_url,
      status: "Comment created successfully.",
    };
  },
};
