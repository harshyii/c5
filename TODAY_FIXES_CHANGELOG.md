# Today's rewrite and amendment log

- `scripts/build.mjs`: successful live catalog fetch is saved to `data/products-cache.json`; if API/network fails, the build uses that cache and warns. If both live fetch and cache fail, it exits before destructive generation.
- `js/product.js`: share fallback copies the generated static share URL (`share/<slugged-product-id>/`) rather than the generic query URL.
- Generated share-page routes (in builder): crawler-visible HTML metadata and Product JSON-LD; human redirects to the existing `product.html?id=...` URL.
- Product generation includes the static More-to-explore section and SEO metadata/schema.
- Existing newsletter and payment files were not intentionally changed.
- Cookies/privacy/terms pages remain included in the base.

## Run
`npm.cmd install`
`npm.cmd run build`
`npm.cmd run smoke`

A first-ever build still needs the API reachable or a catalog cache file. After a successful build, the cache will be available for fallback builds.
