import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ainur Protocol - A Shared Coordination Layer for Autonomous AI",
  description:
    "A shared protocol for autonomous AI agents to discover, trust, and coordinate at scale, enabling a new generation of decentralized applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetBrains.variable} bg-[#0a1929] text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
