
(() => {
  "use strict";

  const $ = s => document.querySelector(s);

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

  const money = n =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(n) || 0);

  let product = null;
  let selectedSize = "";
  let selectedColor = "";

  /* ---------- META AND SEO ---------- */

  function setMeta(selector, attr, value) {
    let el = $(selector);

    if (!el) {
      el = document.createElement("meta");

      const match = selector.match(/"([^"]+)"/);

      if (selector.startsWith('meta[property=')) {
        el.setAttribute("property", match[1]);
      } else {
        el.setAttribute("name", match[1]);
      }

      document.head.appendChild(el);
    }

    el.setAttribute(attr, value);
  }

  function updateSEO(p) {
    const seoTitle = p.title + " | CLOTH X CLUB";

    const seoDesc = String(
      p.description ||
      `Shop ${p.title} at CLOTH X CLUB. Explore product details, price and availability.`
    ).slice(0, 155);

    document.title = seoTitle;

    setMeta('meta[name="description"]', "content", seoDesc);
    setMeta('meta[property="og:title"]', "content", seoTitle);
    setMeta('meta[property="og:description"]', "content", seoDesc);
    setMeta('meta[property="og:type"]', "content", "product");

    if (p.image) {
      setMeta('meta[property="og:image"]', "content", p.image);
    }

    let canonical = $('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = location.href.split("#")[0];

    let schema = $("#cx-product-schema");

    if (!schema) {
      schema = document.createElement("script");
      schema.type = "application/ld+json";
      schema.id = "cx-product-schema";
      document.head.appendChild(schema);
    }

    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title,
      image: p.images || [],
      description: seoDesc,
      sku: p.id,
      brand: {
        "@type": "Brand",
        name: p.brand || "CLOTH X CLUB"
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: String(p.price),
        availability: p.available === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
        url: location.href
      }
    });
  }

  /* ---------- SIZE AND COLOUR OPTIONS ---------- */

  function renderOptions(element, values, type) {
    if (!element) return "";

    const options = values?.length ? values : ["Standard"];

    element.innerHTML = options.map((value, index) => `
      <button
        type="button"
        class="option-pill ${index === 0 ? "active" : ""}"
        data-variant="${type}"
        data-value="${esc(value)}"
        aria-pressed="${index === 0}"
      >
        ${esc(value)}
      </button>
    `).join("");

    return options[0];
  }

  /* ---------- PRODUCT DISPLAY ---------- */

  function show(p) {
    product = p;

    updateSEO(p);

    const title = $("[data-product-title]");
    if (title) title.textContent = p.title;

    const price = $("[data-product-price]");
    if (price) price.textContent = money(p.price);

    const mrp = $("[data-product-mrp]");

    if (mrp) {
      mrp.textContent = p.mrp > p.price ? money(p.mrp) : "";
      mrp.hidden = !(p.mrp > p.price);
    }

    const desc = $("[data-product-description]");

    if (desc) {
      desc.textContent =
        p.description || "Everyday essentials from CLOTH X CLUB.";
    }

    const stock = $("[data-product-stock]");

    if (stock) {
      stock.textContent =
        p.available === false
          ? "Currently unavailable"
          : p.stock === null || p.stock === undefined
            ? "In stock"
            : p.stock > 0
              ? `${p.stock} in stock`
              : "Out of stock";
    }

    selectedSize = renderOptions(
      $("[data-product-sizes]"),
      p.sizes,
      "size"
    );

    selectedColor = renderOptions(
      $("[data-product-colors]"),
      p.colors,
      "color"
    );

    /* Product gallery */

    const gallery = $("[data-product-gallery]");
    const images = (p.images || []).slice(0, 6);

    if (gallery) {
      gallery.innerHTML = images.length
        ? images.map((url, index) => `
            <figure class="product-gallery-item">
              <img
                src="${esc(url)}"
                alt="${esc(p.title)} — image ${index + 1}"
                ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
              >
            </figure>
          `).join("")
        : "<p>Product images unavailable.</p>";

      gallery.querySelectorAll("img").forEach(img => {
        img.addEventListener("error", () => {
          img.closest("figure")?.remove();
        }, { once: true });
      });
    }

    const thumbs = $("[data-product-thumbnails]");

    if (thumbs) {
      thumbs.innerHTML = images.map((url, index) => `
        <button
          type="button"
          data-gallery-index="${index}"
          aria-label="View image ${index + 1}"
        >
          <img src="${esc(url)}" alt="">
        </button>
      `).join("");
    }

    /* Disable purchase when unavailable */

    const unavailable =
      p.available === false ||
      (p.stock !== null && p.stock !== undefined && Number(p.stock) <= 0);

    ["#add-to-cart", "[data-add-to-cart]", "[data-buy-now]"]
      .forEach(selector => {
        document.querySelectorAll(selector).forEach(button => {
          button.disabled = unavailable;
        });
      });
  }

  /* ---------- ADD TO CART ---------- */

  function addToCart(goToCart = false) {
    if (!product) {
      console.error("Product has not loaded yet.");
      return;
    }

    if (!window.CXCart || typeof window.CXCart.add !== "function") {
      console.error("CXCart.add is unavailable. Check cart.js.");
      return;
    }

    if (product.available === false) {
      window.CXClub?.showToast?.(
        "This product is currently unavailable.",
        "error"
      );
      return;
    }

    const qtyInput = $("[data-product-quantity-value]");

    const quantity = Math.max(
      1,
      Math.floor(Number(qtyInput?.value) || 1)
    );

    const cartProduct = {
      id: product.id,
      name: product.title,
      title: product.title,
      price: Number(product.price) || 0,
      mrp: Number(product.mrp) || Number(product.price) || 0,
      image: product.image || "",
      images: product.images || [],
      size: selectedSize || "",
      color: selectedColor || "",
      stock: product.stock,
      available: product.available
    };

    try {
      window.CXCart.add(cartProduct, quantity);

      if (goToCart) {
        location.href = "cart.html";
      } else {
        window.CXClub?.showToast?.(
          "Added to your bag successfully.",
          "success"
        );
      }
    } catch (error) {
      console.error("Add to cart failed:", error);

      window.CXClub?.showToast?.(
        "Unable to add this product. Please try again.",
        "error"
      );
    }
  }

  /* ---------- INITIALIZATION ---------- */

  document.addEventListener("DOMContentLoaded", async () => {
    if (!$("[data-product-page]")) return;

    const id =
      window.CX_PRODUCT_ID ||
      new URLSearchParams(location.search).get("id");

    if (!id) {
      const title = $("[data-product-title]");
      if (title) title.textContent = "Product not found";
      return;
    }

    try {
      if (!window.CXProducts?.getProduct) {
        throw new Error("Product API is not initialized.");
      }

      const loadedProduct = await window.CXProducts.getProduct(id);

      if (!loadedProduct) {
        const title = $("[data-product-title]");
        if (title) title.textContent = "Product not found";
        return;
      }

      show(loadedProduct);

    } catch (error) {
      console.error("Product loading failed:", error);

      const title = $("[data-product-title]");
      if (title) title.textContent = "Product could not be loaded";

      return;
    }

    /* Variant selection */

    document.addEventListener("click", event => {
      const variant = event.target.closest("[data-variant]");

      if (variant) {
        const type = variant.dataset.variant;

        document.querySelectorAll(
          `[data-variant="${type}"]`
        ).forEach(button => {
          button.classList.remove("active");
          button.setAttribute("aria-pressed", "false");
        });

        variant.classList.add("active");
        variant.setAttribute("aria-pressed", "true");

        if (type === "size") {
          selectedSize = variant.dataset.value;
        } else if (type === "color") {
          selectedColor = variant.dataset.value;
        }
      }

      /* Gallery navigation */

      const thumb = event.target.closest("[data-gallery-index]");

      if (thumb) {
        const images = $("[data-product-gallery]")?.querySelectorAll("img");

        images?.[Number(thumb.dataset.galleryIndex)]
          ?.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
      }
    });

    /* Product sharing */

    $("[data-share-product]")?.addEventListener(
      "click",
      async () => {
        if (!product) return;

        const shareData = {
          title: document.title,
          text: `Take a look at ${product.title} from CLOTH X CLUB`,
          url: location.href
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(location.href);

            window.CXClub?.showToast?.(
              "Product link copied.",
              "success"
            );
          } else {
            window.prompt("Copy this product link:", location.href);
          }

        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Share failed:", error);

            window.CXClub?.showToast?.(
              "Unable to share this product.",
              "error"
            );
          }
        }
      }
    );

    /* Quantity controls */

    const qty = $("[data-product-quantity-value]");

    $("[data-product-quantity-minus]")?.addEventListener("click", () => {
      if (qty) {
        qty.value = Math.max(1, (Number(qty.value) || 1) - 1);
      }
    });

    $("[data-product-quantity-plus]")?.addEventListener("click", () => {
      if (qty) {
        qty.value = Math.max(1, (Number(qty.value) || 1) + 1);
      }
    });

    /* Add to Bag */

    $("#add-to-cart")?.addEventListener("click", () => {
      addToCart(false);
    });

    $("[data-add-to-cart]")?.addEventListener("click", () => {
      addToCart(false);
    });

    /* Buy Now */

    $("[data-buy-now]")?.addEventListener("click", () => {
      addToCart(true);
    });

  });

})();
