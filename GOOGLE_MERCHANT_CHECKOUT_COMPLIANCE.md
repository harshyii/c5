# Google Merchant Center checkout experience updates

Applied in this package:
- Removed the 2% Razorpay surcharge from the checkout calculation.
- Removed the partial-COD 2% + ₹5 surcharge; partial COD is an advance payment split only.
- Checkout total is now subtotal + delivery, consistently across payment methods.
- Checkout payment options disclose that no payment surcharge is added.
- Existing product stock/availability UI and add-to-cart disabled logic in product.js are retained.
- Existing guest checkout form (no account/company fields) is retained.
- Existing delivery/address fields, privacy-policy link, and contact/footer links are retained.

## Merchant Center review checklist (manual)
1. Verify the live product pages load for each feed URL and show the matching product, price, availability and add-to-cart control.
2. Verify checkout totals match the cart and shipping charges/thresholds in Merchant Center match site policy.
3. Confirm shipping destinations and delivery availability for advertised products.
4. Confirm the site's HTTPS deployment, contact details, privacy, returns, shipping, and terms pages.
5. After publishing, request a Merchant Center review.

These edits were made to the source package; the live GitHub Pages site and Merchant Center account have not been independently verified.
