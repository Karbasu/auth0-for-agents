"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  tool: string;
  service: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = () => {
      fetch("/api/audit")
        .then((r) => r.json())
        .then((data) => {
          setEntries(data.entries ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchEntries();
    // Poll every 3 seconds for new entries
    const interval = setInterval(fetchEntries, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading audit log...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
        <Clock className="mx-auto mb-2 h-8 w-8 text-gray-700" />
        <p>No tool invocations yet.</p>
        <p className="mt-1 text-sm">
          When the AI agent calls a tool, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
        >
          {entry.success ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">
                {entry.tool}
              </span>
              <span className="text-xs text-gray-500">{entry.service}</span>
            </div>
            {entry.error && (
              <p className="mt-0.5 truncate text-xs text-red-400">
                {entry.error}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>{entry.durationMs}ms</div>
            <div>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
