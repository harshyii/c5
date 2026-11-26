# CLOTH X CLUB — live testing guide

This package is a testable base. Build and smoke tests are local; payment testing must use Razorpay TEST keys and a server-side Apps Script deployment. Do not put Razorpay secret keys in the repository, website JavaScript, or GitHub Pages variables.

## 1. Start safely
1. Download/extract the ZIP.
2. Create a separate Git branch, e.g. `automation-test`, before pushing.
3. Install Node.js 20 LTS.
4. Open a terminal in the extracted `clothxclub_final_base` directory.

## 2. Local build
```bash
npm install
npm run build
npm run smoke
```
The build fetches the product feed and generates product pages, published Markdown blog pages, blog index, sitemap, robots.txt, and SEO_AUDIT.json. If the build fails, do not deploy; capture the terminal output.

## 3. Product pagination test
- Run the build and note the product count in the terminal and `SEO_AUDIT.json`.
- Compare the count with the active catalog in the source Sheet.
- Inspect generated folders under `products/`; each should contain `index.html`.
- Open several generated pages and check ID, title, images, price, description, variant controls and add-to-cart.
- Test a product with multiple images and one with missing optional fields.
- Confirm duplicates do not appear. If the feed doesn't support offset/limit or returns a different pagination envelope, the build may need adaptation to the live API response.

## 4. Blog test
Create a test article at `content/blog/test-article.md`:
```markdown
---
title: "Test Article"
slug: "test-article"
description: "Temporary test article for build validation."
date: "2026-11-25"
author: "CLOTH X CLUB"
published: true
---

# Test Article

A test paragraph with **bold** and [a link](https://example.com).
```
Run `npm run build`. Confirm `journal/test-article/index.html` exists and Markdown links work; confirm it appears in `data/blog-index.json` and sitemap. Delete the test file and rebuild. Check whether stale output was cleaned; current builder may not remove stale generated directories.

## 5. Internal links test
- CSV columns: `Source_Slug,Target_Slug,Anchor_Text,Status`.
- Add a row for two existing/published article slugs and an anchor phrase present in source content.
- Rebuild and inspect the rendered link. Current matching is simplistic; test exact anchor text.
- Rules don't create articles; source and target pages must exist.

## 6. Related products and sharing
- Open several generated product pages. Confirm “More to explore” shows other catalog items and the current product is excluded.
- Test the share button. On browsers without Web Share support, it should copy the generated clean URL where clipboard access is allowed.
- Inspect a generated page source (not just rendered DOM) for product-specific Open Graph/Twitter title, description, image, canonical and Product JSON-LD. Test preview using platform debug tools after deployment.

## 7. Sitemap and audit
Open `sitemap.xml`; verify base URL, product pages, published blogs and excluded drafts. Open `SEO_AUDIT.json`, review issues/warnings and look for test/deleted URLs. Check the sitemap URL in `robots.txt`.

## 8. Razorpay TEST mode
The checkout code calls Apps Script actions `createOrder`, `createRazorpayOrder`, and `verifyRazorpayPayment`. Backend must use TEST credentials stored in Apps Script Script Properties and verify signatures server-side.
- Use a separate test Apps Script deployment and Razorpay test credentials.
- Configure the test API URL in checkout code only on the test branch/environment.
- Verify `createRazorpayOrder` returns the test `keyId`, Razorpay order ID, amount and currency.
- Complete a test payment using official Razorpay test details.
- Verify that altered signatures, mismatched IDs/amounts and failed payments are rejected.
- Order must be marked paid only after server-side signature verification.
- Never test with live payment credentials/cards or publish secret keys.

## 9. GitHub Actions deployment
- Push the test branch first.
- The current workflow deploys on `main` or manual dispatch. For branch testing, modify the workflow trigger or use a separate Pages test project.
- Check the Actions tab, artifact upload and deployment result.
- Merge to main only after checks. Workflow deploys an artifact, not commits generated files, so it avoids build-commit push conflicts.

## 10. Browser regression checklist
Test home, shop, filters, product details, variants, cart, wishlist, checkout validation, COD (test backend), UPI proof (test backend), Razorpay test flow, failure flow, mobile layout, policy links and existing URLs/canonicals.

## 11. What smoke test does not prove
It checks expected files, JSON and basic sitemap shape. It does not prove live API compatibility, payment security, browser compatibility or successful GitHub Pages deployment.
