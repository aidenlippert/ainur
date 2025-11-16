# Ainur Protocol Landing Page - Deployment Guide

This directory contains the Next.js 16 landing page for `ainur.network`.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist, Geist Mono, Space Grotesk
- **Animations**: Framer Motion + Magic UI components
- **Icons**: Lucide React

## Local Development

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Options

### Option 1: Netlify (Recommended for Next.js)

1. Create a new Netlify site
2. Connect to the GitHub repository `aidenlippert/ainur`
3. Set build settings:
   - **Base directory**: `web`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Install the `@netlify/plugin-nextjs` plugin (or let Netlify auto-detect)
5. Point custom domain `ainur.network` to this site

### Option 2: Vercel (Native Next.js hosting)

```bash
cd web
npx vercel
```

Follow prompts and set custom domain to `ainur.network`.

## Environment Variables

None required for static landing page. When adding waitlist functionality:

- `NEXT_PUBLIC_WAITLIST_API` - API endpoint for waitlist submissions
- `DATABASE_URL` - If storing emails server-side

## Build Output

- Production build: `npm run build` → outputs to `.next/`
- Static export (if needed): Add `output: 'export'` to `next.config.ts`

## Custom Domain Setup

**For `ainur.network` (landing page)**:
- Point A record to Netlify/Vercel IP or CNAME to their hostname

**For `docs.ainur.network` (documentation)**:
- Already configured in root `netlify.toml` for MkDocs deployment

