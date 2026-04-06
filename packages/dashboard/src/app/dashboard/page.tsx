"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ConnectionPanel } from "@/components/connection-panel";
import { ScopeToggles } from "@/components/scope-toggles";
import type { ScopeEntry } from "@/components/scope-toggles";
import { AIView } from "@/components/ai-view";
import { ToolGrid } from "@/components/tool-grid";
import { AuditLog } from "@/components/audit-log";
import { Shield, Fingerprint, Activity, Zap } from "lucide-react";

interface Tool {
  name: string;
  service: string;
  requiredScopes: string[];
  type: string;
  available: boolean;
}

export default function DashboardPage() {
  const [localScopes, setLocalScopes] = useState<Record<string, ScopeEntry[]>>({});
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/tools").then((r) => r.json()),
      fetch("/api/scopes").then((r) => r.json()),
    ])
      .then(([toolsData, scopesData]) => {
        setAllTools(toolsData.tools ?? []);
        setLocalScopes(scopesData ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /** Persist scope changes to scopes.json (MCP server watches this file) */
  const persistScopes = useCallback(
    (newScopes: Record<string, ScopeEntry[]>) => {
      setSyncing(true);
      fetch("/api/scopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScopes),
      })
        .then(() => {
          setLastSynced(new Date().toLocaleTimeString());
          setSyncing(false);
        })
        .catch(() => setSyncing(false));
    },
    []
  );

  const handleToggle = useCallback(
    (service: string, scope: string) => {
      setLocalScopes((prev) => {
        const entries = prev[service] ?? [];
        const has = entries.some((e) => e.scope === scope);
        const updated = {
          ...prev,
          [service]: has
            ? entries.filter((e) => e.scope !== scope)
            : [...entries, { scope }],
        };

        // Debounce: persist after 300ms of no toggles
        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => persistScopes(updated), 300);

        return updated;
      });
    },
    [persistScopes]
  );

  const handleSetTimer = useCallback(
    (service: string, scope: string, minutes: number | null) => {
      setLocalScopes((prev) => {
        const entries = prev[service] ?? [];
        const updated = {
          ...prev,
          [service]: entries.map((e) => {
            if (e.scope !== scope) return e;
            return minutes
              ? { scope: e.scope, expiresAt: Date.now() + minutes * 60 * 1000 }
              : { scope: e.scope }; // remove timer → permanent
          }),
        };

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => persistScopes(updated), 300);

        return updated;
      });
    },
    [persistScopes]
  );

  // Convert ScopeEntry[] to plain string[] (active scopes only) for child components
  const now = Date.now();
  const activeScopesPlain: Record<string, string[]> = Object.fromEntries(
    Object.entries(localScopes).map(([service, entries]) => [
      service,
      (entries ?? [])
        .filter((e) => !e.expiresAt || e.expiresAt > now)
        .map((e) => e.scope),
    ])
  );

  // Recompute tool availability based on active (non-expired) scopes
  const computedTools = allTools.map((tool) => {
    const granted = activeScopesPlain[tool.service] ?? [];
    const available = tool.requiredScopes.every((s) => granted.includes(s));
    return { ...tool, available };
  });

  const availableCount = computedTools.filter((t) => t.available).length;
  const hiddenCount = computedTools.length - availableCount;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-emerald-400">Vault</span>MCP
              </h1>
              <p className="text-[11px] text-gray-500">Authorization by Omission</p>
            </div>
          </div>

          {/* Live stats */}
          {!loading && (
            <div className="flex items-center gap-4 text-sm">
              {syncing && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs animate-pulse">
                  <Zap className="h-3 w-3" />
                  Syncing...
                </div>
              )}
              {lastSynced && !syncing && (
                <div className="flex items-center gap-1.5 text-emerald-400/60 text-xs">
                  <Zap className="h-3 w-3" />
                  Live — synced {lastSynced}
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium">{availableCount}</span>
                <span className="text-emerald-400/60 text-xs">visible</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 border border-gray-700">
                <div className="h-2 w-2 rounded-full bg-gray-500" />
                <span className="text-gray-400 font-medium">{hiddenCount}</span>
                <span className="text-gray-500 text-xs">hidden</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {/* Section 1: Connections */}
        <section>
          <SectionHeader
            icon={<Fingerprint className="h-4 w-4" />}
            title="Service Connections"
            subtitle="OAuth providers connected via Auth0 Token Vault"
          />
          <ConnectionPanel />
        </section>

        {/* Section 2: Scope Control */}
        <section>
          <SectionHeader
            icon={<Shield className="h-4 w-4" />}
            title="Scope Control"
            subtitle="Toggle scopes to control what the AI can see — set timers for auto-revocation"
          />
          <ScopeToggles
            grantedScopes={localScopes}
            onToggle={handleToggle}
            onSetTimer={handleSetTimer}
          />
        </section>

        {/* Section 3: AI's Perspective */}
        <section>
          <SectionHeader
            icon={<Shield className="h-4 w-4" />}
            title="AI's Perspective"
            subtitle="What the AI agent can and cannot see based on current scopes"
          />
          <AIView tools={computedTools} />
        </section>

        {/* Section 4: Full Tool Catalog */}
        <section>
          <SectionHeader
            icon={<Shield className="h-4 w-4" />}
            title="Full Tool Catalog"
            subtitle="All 13 tools with scope requirements — click any tool for details"
          />
          <ToolGrid tools={computedTools} grantedScopes={activeScopesPlain} />
        </section>

        {/* Section 5: Audit Log */}
        <section>
          <SectionHeader
            icon={<Activity className="h-4 w-4" />}
            title="Audit Trail"
            subtitle="Every tool invocation logged with timing and status"
          />
          <AuditLog />
        </section>
      </main>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-emerald-400">{icon}</span>
        <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
