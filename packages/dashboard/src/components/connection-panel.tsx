"use client";

import { useEffect, useState } from "react";
import { Mail, Github, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  connection: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail,
  Github,
  Calendar,
};

export function ConnectionPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((data) => {
        setConnections(data.connections ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking connections...
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {connections.map((conn) => {
        const Icon = ICON_MAP[conn.icon] ?? Mail;
        return (
          <div
            key={conn.id}
            className={`rounded-xl border p-5 transition ${
              conn.connected
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-gray-800 bg-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-6 w-6 ${
                  conn.connected ? "text-emerald-400" : "text-gray-600"
                }`}
              />
              <div className="flex-1">
                <h3 className="font-semibold">{conn.name}</h3>
                <p className="text-xs text-gray-500">{conn.connection}</p>
              </div>
              {conn.connected ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div className="mt-3">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  conn.connected
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {conn.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
