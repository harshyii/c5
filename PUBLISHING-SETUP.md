# CLOTH X CLUB — Integrated Publishing & SEO System
This package preserves your existing storefront and operational scripts. The build generates static product and blog SEO pages, sitemap, and a basic audit report.

## One-time setup
1. Extract this ZIP and push its contents to the existing `c5` repository (do not replace your checkout/order backend files with unrelated files).
2. GitHub: Settings → Pages → Build and deployment → Source → **GitHub Actions**.
3. Create `content/blog/` Markdown posts with frontmatter. Example:
```yaml
---
title: "How to Style Oversized T-Shirts"
slug: "how-to-style-oversized-tshirts"
description: "Practical ideas for styling oversized tees."
date: "2026-11-25"
author: "CLOTH X CLUB"
published: true
featured_image: "https://example.com/image.jpg"
---
Your article content in Markdown-like paragraphs and headings.
```
4. Commit/push. The GitHub workflow runs the builder and commits generated `products/`, `journal/`, sitemap and audit.

## Products
The builder uses the existing public product-feed API from the storefront JS and fetches product records only. It whitelists fields for rendered output and does **not** query Orders or customer/payment data. It refuses to proceed when the feed returns zero products.

## Internal link sheet (manual configuration template)
Create a Google Sheet tab named `Internal_Links` with columns:
`Link_ID | Source_Type | Source_Slug | Target_Type | Target_Slug | Anchor_Text | Link_Position | Priority | Status | Notes`
This build ZIP includes a CSV template under `data/internal-links.csv`. The initial builder does not yet consume live Google Sheets rules; that requires a read-only Apps Script publisher endpoint and its URL configuration, shown in the accompanying scaffold. Do not expose sheet contents publicly until you have restricted that endpoint to safe publishing tabs only.

## SEO_Control tab suggested columns
`Setting | Value | Notes`
`Site_URL | https://harshyii.github.io/c5/ |`
`Brand | CLOTH X CLUB |`
`Sitemap_Include_Products | TRUE |`
`Sitemap_Include_Blogs | TRUE |`
`Robots_Default | index,follow |`
`Audit_Strict | TRUE |`

## SEO_Audit
A JSON summary is emitted to `SEO_AUDIT.json` at build time. It is a build summary, not a substitute for full SEO validation.

## Safety
- Keep Orders, customer records, payment/UTR details, and payment credentials out of public repo files.
- Rotate any payment secret that has previously been shared in chats or code.
- Do not put API keys or private tokens in browser JavaScript or GitHub Pages files.
- Product data and blog content should be reviewed before publication.

## Limitations / verification
- The product endpoint's schema and CORS/JSONP behavior must be verified from your live feed.
- Sheet-driven linking is a staged integration; this package supplies the template and publisher scaffold but the current build does not fetch the sheet tab.
- The builder's Markdown conversion is intentionally lightweight; use simple headings, paragraphs and list lines, or upgrade to a tested Markdown library.
- After deploy, test product links, checkout, sitemap, canonical URLs and Search Console.
