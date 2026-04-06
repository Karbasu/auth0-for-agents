"use client";

import { useState, useEffect } from "react";
import { Mail, Github, Calendar, ToggleLeft, ToggleRight, Clock } from "lucide-react";

export interface ScopeEntry {
  scope: string;
  expiresAt?: number;
}

interface ScopeToggleProps {
  grantedScopes: Record<string, ScopeEntry[]>;
  onToggle: (service: string, scope: string) => void;
  onSetTimer: (service: string, scope: string, minutes: number | null) => void;
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

const TIMER_PRESETS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "4h", minutes: 240 },
];

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

function formatRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "expired";
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function ScopeToggles({ grantedScopes, onToggle, onSetTimer }: ScopeToggleProps) {
  const [, setTick] = useState(0);

  // Tick every second to update countdowns
  useEffect(() => {
    const hasTimers = Object.values(grantedScopes).some((entries) =>
      entries.some((e) => e.expiresAt)
    );
    if (!hasTimers) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [grantedScopes]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SERVICE_CONFIG.map((svc) => {
        const Icon = svc.icon;
        const entries = grantedScopes[svc.id] ?? [];

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
                const entry = entries.find((e) => e.scope === scope);
                const isGranted = !!entry;
                const label = SCOPE_LABELS[scope] ?? scope;
                const hasTimer = isGranted && entry?.expiresAt;
                const isExpired = hasTimer && entry.expiresAt! <= Date.now();

                return (
                  <div key={scope} className="space-y-1">
                    <button
                      onClick={() => onToggle(svc.id, scope)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-white/5 group"
                    >
                      {isGranted && !isExpired ? (
                        <ToggleRight className="h-5 w-5 text-emerald-400 flex-shrink-0 transition-transform group-hover:scale-110" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-600 flex-shrink-0 transition-transform group-hover:scale-110" />
                      )}
                      <span
                        className={`font-mono text-xs transition-colors ${
                          isGranted && !isExpired ? "text-gray-200" : "text-gray-500"
                        }`}
                      >
                        {label}
                      </span>

                      {/* Timer badge */}
                      {hasTimer && !isExpired && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-400/10 rounded-full px-2 py-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatRemaining(entry.expiresAt!)}
                        </span>
                      )}
                      {!hasTimer && isGranted && (
                        <span className="ml-auto text-[10px] text-gray-600 font-mono">
                          ∞
                        </span>
                      )}
                    </button>

                    {/* Timer presets — shown for active scopes */}
                    {isGranted && !isExpired && (
                      <div className="flex items-center gap-1 pl-11">
                        <span className="text-[10px] text-gray-600 mr-1">timer:</span>
                        {TIMER_PRESETS.map((preset) => (
                          <button
                            key={preset.minutes}
                            onClick={() => onSetTimer(svc.id, scope, preset.minutes)}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors border border-gray-700/50"
                          >
                            {preset.label}
                          </button>
                        ))}
                        {hasTimer && (
                          <button
                            onClick={() => onSetTimer(svc.id, scope, null)}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 transition-colors border border-gray-700/50"
                          >
                            ∞
                          </button>
                        )}
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
