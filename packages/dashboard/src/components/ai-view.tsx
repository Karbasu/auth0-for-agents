"use client";

import { Eye, EyeOff, Terminal } from "lucide-react";

interface Tool {
  name: string;
  service: string;
  requiredScopes: string[];
  type: string;
  available: boolean;
}

const SERVICE_COLORS: Record<string, string> = {
  gmail: "text-red-400",
  github: "text-purple-400",
  calendar: "text-blue-400",
};

const SERVICE_DOT_COLORS: Record<string, string> = {
  gmail: "bg-red-400",
  github: "bg-purple-400",
  calendar: "bg-blue-400",
};

export function AIView({ tools }: { tools: Tool[] }) {
  const visible = tools.filter((t) => t.available);
  const hidden = tools.filter((t) => !t.available);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* What the AI sees */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-400">AI&apos;s View</h3>
            <p className="text-[11px] text-emerald-400/60">
              {visible.length} tools available
            </p>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-emerald-500/20 px-4 py-8 text-center">
            <Terminal className="mx-auto h-6 w-6 text-emerald-400/30 mb-2" />
            <p className="text-sm text-emerald-400/40">No tools visible to AI</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {visible.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-2.5 rounded-lg bg-emerald-500/5 px-3 py-2 transition-all animate-in fade-in duration-300"
              >
                <div className={`h-1.5 w-1.5 rounded-full ${SERVICE_DOT_COLORS[tool.service]}`} />
                <span className="font-mono text-xs text-gray-200">{tool.name}</span>
                <span
                  className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    tool.type === "write"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {tool.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What the AI CANNOT see */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
            <EyeOff className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-500">Hidden from AI</h3>
            <p className="text-[11px] text-gray-600">
              {hidden.length} tools omitted
            </p>
          </div>
        </div>

        {hidden.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 px-4 py-8 text-center">
            <p className="text-sm text-gray-600">All tools are visible</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {hidden.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 opacity-40 transition-all"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                <span className="font-mono text-xs text-gray-500 line-through">
                  {tool.name}
                </span>
                <span className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-gray-800 text-gray-600">
                  {tool.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
