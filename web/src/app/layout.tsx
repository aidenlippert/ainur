import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ainur Protocol | Decentralized AI Agent Coordination",
  description:
    "A multi-layer protocol for verifiable coordination among autonomous AI agents. Built for planetary-scale agent economies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <div className="relative min-h-screen bg-black">
          {/* Animated gradient background */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950" />
            <div className="absolute top-0 left-1/4 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-indigo-600/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] animate-pulse-slower rounded-full bg-purple-600/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slowest rounded-full bg-cyan-600/10 blur-3xl" />
          </div>
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
