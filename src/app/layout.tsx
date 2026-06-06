import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { EB_Garamond } from "next/font/google";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";
import "katex/dist/katex.min.css";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "webbench",
  description: "a behavioral benchmark for LLMs, running in your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} ${garamond.variable}`}
    >
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
