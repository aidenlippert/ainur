import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export const dynamic = "force-static";

async function loadWhitepaperHtml(): Promise<string> {
  const docsPath = path.join(process.cwd(), "..", "docs", "whitepaper.md");
  const raw = fs.readFileSync(docsPath, "utf8");
  const { content } = matter(raw);

  const processed = await remark().use(html).process(content);
  return processed.toString();
}

export default async function WhitepaperPage() {
  const contentHtml = await loadWhitepaperHtml();

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800/80 bg-slate-950/70 px-6 py-8 shadow-[0_32px_120px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:px-10 sm:py-10">
        <header className="mb-8 border-b border-slate-800 pb-6 text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Ainur Protocol · Whitepaper
          </p>
          <h1 className="mt-3 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-300 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            A Distributed Infrastructure for Autonomous Agent Coordination
          </h1>
        </header>
        <article
          className="prose prose-invert prose-slate max-w-none text-sm leading-relaxed sm:text-base"
          // The whitepaper content is static and generated at build time.
          // It is authored in docs/whitepaper.md and rendered via remark.
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>
    </main>
  );
}


