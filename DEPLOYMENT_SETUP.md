# Ainur Protocol - Complete Deployment Setup

## The Issue

Right now, `docs.ainur.network` is showing the landing page instead of the whitepaper. This is because **both domains are pointing to the same Netlify site**, which is currently configured for the MkDocs documentation.

## The Solution: Two Separate Netlify Sites

You need **two independent Netlify projects**:

### Site 1: Documentation Site (MkDocs)
- **Domain**: `docs.ainur.network`
- **Repository**: `aidenlippert/ainur`
- **Base directory**: Leave empty (root)
- **Build command**: `pip install mkdocs-material && python -m mkdocs build -f mkdocs.yml`
- **Publish directory**: `site`
- **Configuration file**: `netlify.toml` (root of repo)

This is your **existing Netlify site** — keep it as is.

### Site 2: Landing Page (Next.js) — **NEW SITE NEEDED**
- **Domain**: `ainur.network` (and `www.ainur.network`)
- **Repository**: `aidenlippert/ainur`
- **Base directory**: `web`
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Configuration file**: `web/netlify.toml`
- **Node version**: 20

---

## Step-by-Step Setup

### 1. Create New Netlify Site for Landing Page

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select `aidenlippert/ainur`
4. Configure build settings:
   ```
   Base directory: web
   Build command: npm run build
   Publish directory: .next
   ```
5. Under **Environment variables**, add:
   ```
   NODE_VERSION = 20
   ```
6. Click **"Deploy site"**

### 2. Point Custom Domains

After the new site deploys successfully:

#### For the NEW landing site:
1. Go to **Domain management** in the new site
2. Add custom domain: `ainur.network`
3. Add another domain alias: `www.ainur.network`
4. Netlify will automatically provision SSL certificates

#### For the EXISTING docs site:
1. Keep `docs.ainur.network` pointed at this site
2. **Remove** `ainur.network` and `www.ainur.network` from this site (they should only be on the landing page site)

### 3. Update DNS (If Needed)

If you're using **Netlify DNS** (which you are), Netlify will automatically handle the DNS records. Just make sure:

- `ainur.network` → points to **NEW landing site**
- `www.ainur.network` → points to **NEW landing site**
- `docs.ainur.network` → points to **EXISTING docs site**

---

## Final Result

After setup:

- **`ainur.network`** → Landing page (Next.js, red theme, Material icons)
- **`www.ainur.network`** → Redirects to `ainur.network`
- **`docs.ainur.network`** → Documentation (MkDocs, whitepaper only)

---

## Verification

Once both sites are deployed:

1. Visit `https://ainur.network` → should see the red-themed landing page with "Join Waitlist"
2. Visit `https://docs.ainur.network` → should see MkDocs site with whitepaper
3. Click "Read the Whitepaper" button on landing → should navigate to docs site

---

## Troubleshooting

### "docs.ainur.network still shows landing page"

**Cause**: Domain is still pointed at the wrong Netlify site.

**Fix**: Go to your **docs** Netlify site → Domain management → ensure `docs.ainur.network` is the only domain listed there.

### "ainur.network shows 404"

**Cause**: New landing site hasn't been created yet, or domain hasn't been added.

**Fix**: Follow Step 1 above to create the new site, then add the domain in Step 2.

### Build fails on new landing site

**Cause**: Node version or missing dependencies.

**Fix**: Ensure `NODE_VERSION = 20` in environment variables. Check deploy logs for specific errors.

