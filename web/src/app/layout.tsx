import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} font-display bg-[#111111] text-gray-200 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
