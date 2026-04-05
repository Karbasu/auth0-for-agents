"use client";

import { useEffect, useState, useCallback } from "react";
import { ConnectionPanel } from "@/components/connection-panel";
import { ScopeToggles } from "@/components/scope-toggles";
import { AIView } from "@/components/ai-view";
import { ToolGrid } from "@/components/tool-grid";
import { AuditLog } from "@/components/audit-log";
import { Shield, Fingerprint, Activity } from "lucide-react";

interface Tool {
  name: string;
  service: string;
  requiredScopes: string[];
  type: string;
  available: boolean;
}

export default function DashboardPage() {
  const [serverScopes, setServerScopes] = useState<Record<string, string[]>>({});
  const [localScopes, setLocalScopes] = useState<Record<string, string[]>>({});
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        setAllTools(data.tools ?? []);
        setServerScopes(data.grantedScopes ?? {});
        setLocalScopes(data.grantedScopes ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = useCallback((service: string, scope: string) => {
    setLocalScopes((prev) => {
      const current = prev[service] ?? [];
      const has = current.includes(scope);
      return {
        ...prev,
        [service]: has
          ? current.filter((s) => s !== scope)
          : [...current, scope],
      };
    });
  }, []);

  // Recompute tool availability based on local (toggled) scopes
  const computedTools = allTools.map((tool) => {
    const granted = localScopes[tool.service] ?? [];
    const available = tool.requiredScopes.every((s) => granted.includes(s));
    return { ...tool, available };
  });

  const availableCount = computedTools.filter((t) => t.available).length;
  const hiddenCount = computedTools.length - availableCount;

  // Detect if user has toggled away from server state
  const hasLocalChanges = JSON.stringify(localScopes) !== JSON.stringify(serverScopes);

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
            subtitle="Toggle scopes to control what the AI can see — Authorization by Omission in action"
          />
          {hasLocalChanges && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-400">
              <span>Scope changes are previewed locally.</span>
              <span className="text-amber-400/60">Restart the MCP server to apply.</span>
            </div>
          )}
          <ScopeToggles grantedScopes={localScopes} onToggle={handleToggle} />
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
          <ToolGrid tools={computedTools} grantedScopes={localScopes} />
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
