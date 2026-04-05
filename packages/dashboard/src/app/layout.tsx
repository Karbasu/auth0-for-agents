import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaultMCP Dashboard",
  description:
    "Manage your AI agent's OAuth connections through Auth0 Token Vault",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
