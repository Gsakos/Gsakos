import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Generator",
  description: "Describe the situation, add the parties, and get a sendable, signable contract - drafted by Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
