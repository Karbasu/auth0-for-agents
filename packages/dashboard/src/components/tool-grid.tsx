"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Unlock } from "lucide-react";

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

const SERVICE_BG: Record<string, string> = {
  gmail: "bg-red-500/10",
  github: "bg-purple-500/10",
  calendar: "bg-blue-500/10",
};

export function ToolGrid() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(data.tools ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tools...
      </div>
    );
  }

  const available = tools.filter((t) => t.available).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-sm">
        <span className="text-emerald-400">{available} available</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-500">
          {tools.length - available} restricted
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className={`flex items-center gap-3 rounded-lg border p-4 transition ${
              tool.available
                ? "border-emerald-500/20 bg-gray-900"
                : "border-gray-800 bg-gray-900/50 opacity-60"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                tool.available ? "bg-emerald-500/10" : "bg-gray-800"
              }`}
            >
              {tool.available ? (
                <Unlock className="h-4 w-4 text-emerald-400" />
              ) : (
                <Lock className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium truncate">
                  {tool.name}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    tool.type === "write"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {tool.type}
                </span>
              </div>
              <span
                className={`text-xs ${SERVICE_COLORS[tool.service] ?? "text-gray-400"}`}
              >
                {tool.service}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
