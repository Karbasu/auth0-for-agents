import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-emerald-400">Vault</span>MCP
        </h1>
        <p className="mt-4 max-w-lg text-lg text-gray-400">
          A universal MCP server powered by Auth0 Token Vault. Connect your
          services once, and let AI agents act on your behalf — safely.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="rounded-lg bg-emerald-500 px-8 py-3 text-center font-semibold text-white transition hover:bg-emerald-600"
      >
        Open Dashboard
      </Link>

      <div className="mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
        {[
          {
            title: "Authorization by Omission",
            desc: "Tools only appear if the user has the right scopes. The AI can't attempt what it can't see.",
          },
          {
            title: "Token Vault",
            desc: "Auth0 handles OAuth token exchange. No tokens stored in your app — ever.",
          },
          {
            title: "11 Tools, 3 Services",
            desc: "Gmail, GitHub, and Google Calendar — all gated by fine-grained OAuth scopes.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-gray-800 bg-gray-900 p-6"
          >
            <h3 className="font-semibold text-emerald-400">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
