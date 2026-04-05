import { ConnectionPanel } from "@/components/connection-panel";
import { ToolGrid } from "@/components/tool-grid";
import { AuditLog } from "@/components/audit-log";

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">
            <span className="text-emerald-400">Vault</span>MCP
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Connections */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">
            Service Connections
          </h2>
          <ConnectionPanel />
        </section>

        {/* Tool Grid */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">
            Tool Availability
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Green = available to AI agents. Gray = requires additional scopes.
            Tools the AI can&apos;t see don&apos;t exist to it.
          </p>
          <ToolGrid />
        </section>

        {/* Audit Log */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">
            Audit Log
          </h2>
          <AuditLog />
        </section>
      </main>
    </div>
  );
}
