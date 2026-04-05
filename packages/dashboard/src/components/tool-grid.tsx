"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Unlock, Shield, ShieldOff } from "lucide-react";

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

const SERVICE_LABELS: Record<string, string> = {
  gmail: "Gmail",
  github: "GitHub",
  calendar: "Calendar",
};

export function ToolGrid() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [grantedScopes, setGrantedScopes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(data.tools ?? []);
        setGrantedScopes(data.grantedScopes ?? {});
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
  const restricted = tools.length - available;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Shield className="h-3.5 w-3.5" />
          {available} available
        </span>
        <span className="text-gray-700">|</span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <ShieldOff className="h-3.5 w-3.5" />
          {restricted} restricted
        </span>
        <span className="text-gray-700">|</span>
        <span className="text-gray-600">{tools.length} total</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const granted = grantedScopes[tool.service] ?? [];
          const isExpanded = expandedTool === tool.name;

          return (
            <div
              key={tool.name}
              className={`rounded-lg border p-4 transition cursor-pointer ${
                tool.available
                  ? "border-emerald-500/20 bg-gray-900 hover:border-emerald-500/40"
                  : "border-gray-800 bg-gray-900/50 opacity-60 hover:opacity-80"
              }`}
              onClick={() =>
                setExpandedTool(isExpanded ? null : tool.name)
              }
            >
              <div className="flex items-center gap-3">
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
                    {SERVICE_LABELS[tool.service] ?? tool.service}
                  </span>
                </div>
              </div>

              {/* Expanded scope details */}
              {isExpanded && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Required Scopes
                  </p>
                  {tool.requiredScopes.map((scope) => {
                    const hasScope = granted.includes(scope);
                    return (
                      <div
                        key={scope}
                        className="flex items-center gap-2 mb-1"
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            hasScope ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        <span
                          className={`text-xs font-mono ${
                            hasScope ? "text-emerald-400/80" : "text-red-400/80"
                          }`}
                        >
                          {scope}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
