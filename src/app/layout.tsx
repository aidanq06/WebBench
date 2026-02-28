import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "webbench",
  description: "a benchmark for ai agents in browser environments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={GeistMono.className}>{children}</body>
    </html>
  );
}
