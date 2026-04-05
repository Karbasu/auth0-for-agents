"use client";

import { Mail, Github, Calendar, ToggleLeft, ToggleRight } from "lucide-react";

interface ScopeToggleProps {
  grantedScopes: Record<string, string[]>;
  onToggle: (service: string, scope: string) => void;
}

/** Human-readable labels for long Google scope URIs */
const SCOPE_LABELS: Record<string, string> = {
  "https://www.googleapis.com/auth/gmail.readonly": "gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose": "gmail.compose",
  "https://www.googleapis.com/auth/gmail.send": "gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly": "calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events": "calendar.events",
  "repo": "repo",
  "read:user": "read:user",
};

const SERVICE_CONFIG = [
  {
    id: "gmail",
    label: "Gmail",
    icon: Mail,
    color: "text-red-400",
    borderColor: "border-red-500/20",
    bgColor: "bg-red-500/5",
    allScopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  },
  {
    id: "github",
    label: "GitHub",
    icon: Github,
    color: "text-purple-400",
    borderColor: "border-purple-500/20",
    bgColor: "bg-purple-500/5",
    allScopes: ["repo", "read:user"],
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/5",
    allScopes: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  },
];

export function ScopeToggles({ grantedScopes, onToggle }: ScopeToggleProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SERVICE_CONFIG.map((svc) => {
        const Icon = svc.icon;
        const granted = grantedScopes[svc.id] ?? [];

        return (
          <div
            key={svc.id}
            className={`rounded-xl border ${svc.borderColor} ${svc.bgColor} p-5`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <Icon className={`h-5 w-5 ${svc.color}`} />
              <h3 className={`font-semibold ${svc.color}`}>{svc.label}</h3>
            </div>

            <div className="space-y-2.5">
              {svc.allScopes.map((scope) => {
                const isGranted = granted.includes(scope);
                const label = SCOPE_LABELS[scope] ?? scope;

                return (
                  <button
                    key={scope}
                    onClick={() => onToggle(svc.id, scope)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-white/5 group"
                  >
                    {isGranted ? (
                      <ToggleRight className="h-5 w-5 text-emerald-400 flex-shrink-0 transition-transform group-hover:scale-110" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-600 flex-shrink-0 transition-transform group-hover:scale-110" />
                    )}
                    <span
                      className={`font-mono text-xs transition-colors ${
                        isGranted ? "text-gray-200" : "text-gray-500"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
