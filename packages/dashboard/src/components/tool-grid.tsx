"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

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

interface ToolGridProps {
  tools: Tool[];
  grantedScopes: Record<string, string[]>;
}

export function ToolGrid({ tools, grantedScopes }: ToolGridProps) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // Group by service
  const services = ["gmail", "github", "calendar"];

  return (
    <div className="space-y-6">
      {services.map((serviceId) => {
        const serviceTools = tools.filter((t) => t.service === serviceId);
        if (serviceTools.length === 0) return null;

        return (
          <div key={serviceId}>
            <h3 className={`text-sm font-semibold mb-3 ${SERVICE_COLORS[serviceId]}`}>
              {SERVICE_LABELS[serviceId]}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {serviceTools.map((tool) => {
                const granted = grantedScopes[tool.service] ?? [];
                const isExpanded = expandedTool === tool.name;

                return (
                  <div
                    key={tool.name}
                    className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                      tool.available
                        ? "border-emerald-500/20 bg-gray-900 hover:border-emerald-500/40"
                        : "border-gray-800 bg-gray-900/50 opacity-50 hover:opacity-70"
                    }`}
                    onClick={() =>
                      setExpandedTool(isExpanded ? null : tool.name)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
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
                          // Shorten Google scope URIs for display
                          const shortScope = scope.replace(
                            "https://www.googleapis.com/auth/",
                            ""
                          );
                          return (
                            <div
                              key={scope}
                              className="flex items-center gap-2 mb-1"
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                  hasScope ? "bg-emerald-400" : "bg-red-400"
                                }`}
                              />
                              <span
                                className={`text-xs font-mono transition-colors ${
                                  hasScope
                                    ? "text-emerald-400/80"
                                    : "text-red-400/80"
                                }`}
                              >
                                {shortScope}
                              </span>
                              <span className="text-[10px] text-gray-600 ml-auto">
                                {hasScope ? "granted" : "missing"}
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
      })}
    </div>
  );
}
