# Exact amendments in this rewrite

## 1. `scripts/build.mjs`
- Builds a crawler-visible static share route `/share/<slugged-product-id>/index.html` for every product.
- Each share page embeds product title, description, product image, canonical, Open Graph/Twitter metadata, and Product JSON-LD.
- Each share page redirects human visitors to the EXISTING working URL `product.html?id=...`.
- Sitemap now includes share routes.
- Related-card links in generated pages point to the existing query product URLs rather than unverified routes.

## 2. `js/product.js`
- Share Product now shares `/share/<slugged-id>/` (static crawler page) instead of the generic query URL.
- More to explore now fetches the catalog using `CXProducts.getAll()`, filters out the current item, prefers same category, and visibly renders 4 cards. Fallback links to Shop if the request fails.

## 3. Existing routes preserved
- The actual product landing URL remains `product.html?id=PRODUCT_ID`.
- The share-page redirects to that existing URL.
- Checkout/payment and newsletter scripts were not intentionally edited.

## Build/test
```powershell
npm.cmd install
npm.cmd run build
npm.cmd run smoke
```
Inspect `/share/<lowercase-id>/index.html` for OG tags. The product ID is slugged in the share route.

## Deployment verification
The build must run before deployment and the generated `share/` directory must be part of the Pages artifact. Once live, use the exact `/share/<id-slug>/` URL in Facebook Sharing Debugger and request a re-scrape. The preview cannot be proven from local file generation alone.
