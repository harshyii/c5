# Corrective build test instructions

## Build
Run in PowerShell:
```powershell
npm.cmd install
npm.cmd run build
npm.cmd run smoke
```

## Confirm More to explore
Open a generated product URL (not the legacy `product.html?id=...` URL). The generated page should have a directly rendered related-card grid. Check view-source for `id="more-to-explore"` and inspect the card markup.

## Social previews
Share ONLY generated product URLs in the form `/products/product-slug-id/`. The old query URL `/product.html?id=...` is a single generic HTML document and social crawlers cannot execute the site's JavaScript to infer the product metadata. Generated pages contain product-specific title, description, canonical, OG and Twitter tags plus JSON-LD.
After deployment, use the Facebook Sharing Debugger and request a re-scrape. GitHub Pages deployment must include the generated folder tree.

## Newsletter
The frontend now requires an explicit JSON success response rather than treating a no-CORS opaque response as success. If the endpoint response is not CORS-readable or lacks a success field, signup will visibly fail instead of showing false success. The Apps Script endpoint needs to return JSON such as `{"success":true}` and support the form POST. The newsletter script URL in `js/app.js` must be verified against the deployed script and its sheet/tab. No subscription is claimed successful without confirmation.

## Product link changes
Homepage/shop cards now point to generated clean product URLs. Verify in the deployed build. Legacy query URL remains for compatibility but is not the preferred sharing URL.

This package cannot guarantee a social crawler preview until deployed and re-scraped; GitHub Pages hosting cannot provide server-side dynamic metadata for query-parameter product pages.
