import { z } from "zod";
import type { ToolDef } from "../../types.js";

export const listRepos: ToolDef = {
  name: "list_repos",
  description:
    "List GitHub repositories for the authenticated user.",
  service: "github",
  requiredScopes: ["repo", "read:user"],
  inputSchema: z.object({
    sort: z
      .enum(["updated", "created", "pushed", "full_name"])
      .default("updated")
      .describe("Sort field"),
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
      sort: args.sort ?? "updated",
      per_page: String(args.perPage ?? 20),
    });

    const res = await fetch(
      `https://api.github.com/user/repos?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
    const repos: any = await res.json();

    return {
      repos: repos.map((r: any) => ({
        fullName: r.full_name,
        description: r.description,
        private: r.private,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
        url: r.html_url,
      })),
    };
  },
};
