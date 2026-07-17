import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homelab Core - Steward",
  description: "Private AI command center for the homelab"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
