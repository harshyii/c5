# CLOTH X CLUB — integrated source + publishing engine

## Included
- Original storefront functionality, checkout, Razorpay client integration, cart, wishlist, product/shop/blog templates and assets.
- Node.js publishing engine.
- Markdown blog publishing at `content/blog/*.md`.
- Automatic product-page generation from the existing Google Sheets product feed.
- Automatic sitemap and robots.txt generation.
- Blog index JSON and SEO audit summary.
- GitHub Actions workflow to build and deploy.

## Local build
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run build`.

The build fetches live catalog data from the configured product feed. Set `PRODUCTS_API` to override the feed and `SITE_URL` to override the base URL.

## Blog publishing
Add a Markdown file in `content/blog/` with frontmatter:

```md
---
title: "Article title"
slug: "article-slug"
description: "Search description"
date: "2026-11-25"
author: "CLOTH X CLUB"
published: true
featured_image: ""
---

# Article title

Article text and Markdown links.
```

A push to `main` triggers the build/deployment workflow.

## Security
Do not put Razorpay secret keys, customer data or orders into this repository. The existing Razorpay flow is retained as client integration; order creation and payment verification must be performed by the existing server-side Apps Script with secrets in Script Properties. Rotate any previously exposed secret.

## Publishing/build engine

- Node.js 20+ required.
- `npm install` installs the Markdown renderer.
- `npm run build` fetches the catalog in batches, generates product share/preview pages under `share/` (while preserving the live `product.html?id=...` product URL), generates published Markdown articles under `journal/`, updates `data/blog-index.json`, `sitemap.xml`, `robots.txt`, and `SEO_AUDIT.json`.
- Blog source: `content/blog/*.md`. Use YAML-style frontmatter with `title`, `slug`, `description`, `date`, `published`, `featured_image`, and `author`.
- Internal links: `data/internal-links.csv` columns `Source_Slug,Target_Slug,Anchor_Text,Status`. Rules are applied to the matching article's rendered text; review anchor placement after builds.
- GitHub workflow builds and deploys a Pages artifact. It does not commit generated files or push back to `main`, avoiding bot/user push conflicts.
- In GitHub repository Settings → Pages, select **GitHub Actions** as the deployment source.
- Set repository variable `PRODUCTS_API` (Settings → Secrets and variables → Actions → Variables) to the product feed URL. The build has a fallback configured.

## Razorpay / checkout

The storefront's existing checkout uses the configured Apps Script orders/payment endpoint for create-order and payment verification actions. Razorpay order creation and signature verification must happen on that trusted server-side endpoint; the browser must never contain a Razorpay secret. Set secret credentials only in Apps Script Script Properties or your trusted backend. Rotate credentials that were previously exposed. Test using Razorpay test mode and the backend's verification flow before live payments.

## Build validation

Run locally: `npm install && npm run build`. The script fails if the catalog API fails and writes an SEO audit JSON report on successful generation. Deployment is not payment verification testing; complete checkout test orders separately.
