import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Mail Hub",
  description: "Yapay zeka raporlarını teslim alan interaktif e-posta uygulaması.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
