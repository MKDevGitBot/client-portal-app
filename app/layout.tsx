import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Webdesign Client Portal — Projekte, Rechnungen & Kommunikation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface-50">{children}</body>
    </html>
  );
}
