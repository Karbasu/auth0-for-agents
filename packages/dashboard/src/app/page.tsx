import Link from "next/link";
import { Shield, KeyRound, Activity, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 px-4 py-16">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">
          <Shield className="h-3.5 w-3.5" />
          Auth0 Token Vault + MCP Protocol
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-emerald-400">Vault</span>MCP
        </h1>
        <p className="mt-4 text-xl text-gray-400 leading-relaxed">
          A universal MCP server powered by Auth0 Token Vault. Connect your
          services once, and let AI agents act on your behalf — safely.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          13 tools across Gmail, GitHub, and Google Calendar — all gated by OAuth scopes.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="group flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3.5 text-center font-semibold text-white transition hover:bg-emerald-600 hover:gap-3"
      >
        Open Dashboard
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* The Insight */}
      <div className="max-w-2xl rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          The Insight: Authorization by Omission
        </h2>
        <p className="text-gray-400 leading-relaxed">
          The most secure permission is the one the AI never knows about.
          Instead of denying access at runtime, VaultMCP removes unauthorized
          tools at the <span className="text-emerald-400 font-medium">discovery layer</span>.
          The AI can&apos;t hack, social-engineer, or hallucinate its way past
          a tool that doesn&apos;t exist in its world.
        </p>

        {/* Visual: before/after */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 text-left">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Traditional</span>
            </div>
            <p className="text-xs text-gray-400">
              AI sees <span className="text-red-400">send_email</span>, calls it,
              gets <span className="font-mono text-red-400">403</span>, retries
              3x, asks user to bypass
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">VaultMCP</span>
            </div>
            <p className="text-xs text-gray-400">
              AI doesn&apos;t see <span className="text-emerald-400">send_email</span>.
              It doesn&apos;t exist. No error. No retry. No risk.
            </p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid max-w-3xl gap-6 sm:grid-cols-3">
        {[
          {
            icon: Shield,
            title: "Authorization by Omission",
            desc: "Tools only appear if the user has the right OAuth scopes. The AI can't attempt what it can't see.",
            color: "text-emerald-400",
          },
          {
            icon: KeyRound,
            title: "Token Vault",
            desc: "Auth0 holds your OAuth refresh tokens. Your app only gets short-lived access tokens. Never store secrets.",
            color: "text-blue-400",
          },
          {
            icon: Activity,
            title: "Full Audit Trail",
            desc: "Every tool invocation logged with timestamp, duration, and success status. Complete forensic visibility.",
            color: "text-amber-400",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-gray-800 bg-gray-900 p-6"
            >
              <Icon className={`h-5 w-5 ${item.color} mb-3`} />
              <h3 className="font-semibold text-gray-200">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-600">
        Built for the Auth0 &ldquo;Authorized to Act&rdquo; hackathon
      </p>
    </div>
  );
}
