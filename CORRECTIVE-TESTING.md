# Corrected product URL and Merchant Center checks

## Product URL format
Use the existing working product URL format:
`https://harshyii.github.io/c5/product.html?id=PRODUCT_ID`

The publishing builder no longer creates or recommends `/products/<slug>/` product routes. It generates crawler/share metadata pages at `/share/<product-id>/`, which redirect human visitors to the existing `product.html?id=...` page.

## Build
Run `npm install` and `npm run build`. The builder fetches the catalog and refreshes `data/products-cache.json`; if the live API is unavailable, it uses a non-empty cache. If both fail, the build stops rather than generating a partial catalog/sitemap.

## Merchant Center
Confirm each product's feed link uses the query URL format above and that product ID is encoded. Open a feed link in a browser, add the product to bag, and proceed through checkout. Verify price, availability, shipping, and delivery match Merchant Center settings.
