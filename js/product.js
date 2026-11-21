
/* =========================================================
   CLOTH X CLUB — PRODUCT.JS
   Product Details | Gallery | Variants | Add to Cart
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. CONFIG
  ========================================================= */

  const CONFIG = {
    productsPath: "Layout/data/products.json",
    shopPage: "shop.html",
    cartPage: "cart.html",
    checkoutPage: "checkout.html",

    selectors: {
      title: "[data-product-title], #product-title",
      price: "[data-product-price], #product-price",
      mrp: "[data-product-mrp], #product-mrp",
      discount: "[data-product-discount], #product-discount",
      description: "[data-product-description], #product-description",
      image: "[data-product-image], #product-image",
      gallery: "[data-product-gallery], #product-gallery",
      thumbnails: "[data-product-thumbnails], #product-thumbnails",
      sizes: "[data-product-sizes], #product-sizes",
      colors: "[data-product-colors], #product-colors",
      quantity: "[data-product-quantity], #product-quantity",
      stock: "[data-product-stock], #product-stock",
      addButton: "[data-add-to-cart], #add-to-cart",
      buyButton: "[data-buy-now], #buy-now",
      related: "[data-related-products], #related-products"
    }
  };


  /* =========================================================
     2. HELPERS
  ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const escapeHTML = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  };


  /* =========================================================
     3. PRODUCT DATA
  ========================================================= */

  let products = [];
  let currentProduct = null;

  let selectedSize = "";
  let selectedColor = "";
  let selectedQuantity = 1;
  let selectedImage = 0;


  async function loadProducts() {
    try {
      const response = await fetch(CONFIG.productsPath);

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const data = await response.json();

      products = Array.isArray(data)
        ? data
        : data.products || data.items || [];

      return products;

    } catch (error) {
      console.error("CLOTH X CLUB product loading error:", error);
      return [];
    }
  }


  /* =========================================================
     4. NORMALIZE PRODUCT DATA
  ========================================================= */

  function normalizeProduct(product = {}) {
    const mrp = Number(
      product.mrp ??
      product.originalPrice ??
      product.original_price ??
      product.price ??
      0
    );

    const price = Number(
      product.offerPrice ??
      product.offer_price ??
      product.salePrice ??
      product.sale_price ??
      product.discountPrice ??
      product.discount_price ??
      product.price ??
      mrp
    );

    let images = [];

    if (Array.isArray(product.images)) {
      images = product.images;
    } else if (Array.isArray(product.gallery)) {
      images = product.gallery;
    } else if (product.image) {
      images = [product.image];
    } else if (product.thumbnail) {
      images = [product.thumbnail];
    }

    images = images.filter(Boolean);

    return {
      ...product,

      id: String(product.id ?? product.productId ?? product.product_id ?? ""),

      name:
        product.name ||
        product.title ||
        "Product",

      slug:
        product.slug ||
        product.urlSlug ||
        product.id ||
        "",

      category:
        product.category ||
        product.type ||
        "",

      description:
        product.description ||
        product.details ||
        "",

      mrp: Math.max(0, mrp),

      price: Math.max(0, price),

      images,

      sizes:
        product.sizes ||
        product.sizeOptions ||
        product.size_options ||
        [],

      colors:
        product.colors ||
        product.colorOptions ||
        product.color_options ||
        [],

      stock:
        product.stock ??
        product.quantity ??
        product.inventory ??
        null,

      available:
        product.available !== false &&
        product.status !== "out_of_stock" &&
        product.status !== "inactive"
    };
  }


  /* =========================================================
     5. FIND PRODUCT
  ========================================================= */

  function getProductIdentifier() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("id") ||
      params.get("product") ||
      params.get("slug") ||
      ""
    );
  }


  function findProduct(identifier) {
    const normalized = String(identifier || "").toLowerCase();

    const found = products.find(product => {
      const item = normalizeProduct(product);

      return (
        String(item.id).toLowerCase() === normalized ||
        String(item.slug).toLowerCase() === normalized
      );
    });

    return found ? normalizeProduct(found) : null;
  }


  /* =========================================================
     6. PRICE CALCULATIONS
  ========================================================= */

  function getSavings(product) {
    return Math.max(0, product.mrp - product.price);
  }


  function getDiscountPercent(product) {
    if (!product.mrp || product.mrp <= product.price) {
      return 0;
    }

    return Math.round(
      ((product.mrp - product.price) / product.mrp) * 100
    );
  }


  /* =========================================================
     7. PRODUCT TITLE / PRICE / DESCRIPTION
  ========================================================= */

  function renderBasicInfo(product) {
    const title = $(CONFIG.selectors.title);

    const price = $(CONFIG.selectors.price);

    const mrp = $(CONFIG.selectors.mrp);

    const discount = $(CONFIG.selectors.discount);

    const description = $(CONFIG.selectors.description);

    if (title) {
      title.textContent = product.name;
    }

    if (price) {
      price.textContent = formatPrice(product.price);
    }

    if (mrp) {
      mrp.textContent = formatPrice(product.mrp);

      mrp.style.display =
        product.mrp > product.price ? "" : "none";
    }

    if (discount) {
      const percentage = getDiscountPercent(product);
      const savings = getSavings(product);

      if (percentage > 0) {
        discount.textContent =
          `${percentage}% OFF · Save ${formatPrice(savings)}`;

        discount.style.display = "";
      } else {
        discount.style.display = "none";
      }
    }

    if (description) {
      description.textContent = product.description;
    }

    document.title = `${product.name} | CLOTH X CLUB`;
  }


  /* =========================================================
     8. PRODUCT IMAGE GALLERY
  ========================================================= */

  function renderGallery(product) {
    const gallery = $(CONFIG.selectors.gallery);

    const thumbnails = $(CONFIG.selectors.thumbnails);

    const images = product.images;

    if (!gallery || images.length === 0) return;

    selectedImage = 0;

    gallery.innerHTML = `
      <div class="product-main-image">
        <img
          src="${escapeHTML(images[0])}"
          alt="${escapeHTML(product.name)}"
          data-main-product-image
        >
      </div>
    `;

    if (!thumbnails) return;

    thumbnails.innerHTML = images.map((image, index) => `
      <button
        type="button"
        class="product-thumbnail ${index === 0 ? "active" : ""}"
        data-image-index="${index}"
        aria-label="View product image ${index + 1}"
      >
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)} image ${index + 1}"
          loading="lazy"
        >
      </button>
    `).join("");

    thumbnails.addEventListener("click", event => {
      const button = event.target.closest("[data-image-index]");

      if (!button) return;

      const index = Number(button.dataset.imageIndex);

      if (!images[index]) return;

      selectedImage = index;

      const mainImage = $("[data-main-product-image]", gallery);

      if (mainImage) {
        mainImage.src = images[index];
      }

      $$(".product-thumbnail", thumbnails).forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");
    });
  }


  /* =========================================================
     9. SIZE SELECTION
  ========================================================= */

  function getSizeValue(size) {
    if (typeof size === "string") return size;

    return (
      size.value ||
      size.name ||
      size.label ||
      size.size ||
      ""
    );
  }


  function renderSizes(product) {
    const container = $(CONFIG.selectors.sizes);

    if (!container) return;

    const sizes = product.sizes;

    if (!Array.isArray(sizes) || sizes.length === 0) {
      container.innerHTML = "";
      selectedSize = "";
      return;
    }

    container.innerHTML = `
      <div class="product-option-title">
        Select Size
      </div>

      <div class="product-size-options">
        ${sizes.map(size => {
          const value = getSizeValue(size);

          const unavailable =
            typeof size === "object" &&
            (size.available === false || size.stock === 0);

          return `
            <button
              type="button"
              class="size-option ${unavailable ? "unavailable" : ""}"
              data-size="${escapeHTML(value)}"
              ${unavailable ? "disabled" : ""}
            >
              ${escapeHTML(value)}
            </button>
          `;
        }).join("")}
      </div>
    `;

    container.addEventListener("click", event => {
      const button = event.target.closest("[data-size]");

      if (!button || button.disabled) return;

      selectedSize = button.dataset.size;

      $$(".size-option", container).forEach(item => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
    });
  }


  /* =========================================================
     10. COLOR SELECTION
  ========================================================= */

  function getColorValue(color) {
    if (typeof color === "string") return color;

    return (
      color.name ||
      color.label ||
      color.value ||
      color.color ||
      ""
    );
  }


  function getColorCode(color) {
    if (typeof color === "string") {
      return color;
    }

    return (
      color.hex ||
      color.code ||
      color.colorCode ||
      color.color ||
      "#cccccc"
    );
  }


  function renderColors(product) {
    const container = $(CONFIG.selectors.colors);

    if (!container) return;

    const colors = product.colors;

    if (!Array.isArray(colors) || colors.length === 0) {
      container.innerHTML = "";
      selectedColor = "";
      return;
    }

    container.innerHTML = `
      <div class="product-option-title">
        Select Color
      </div>

      <div class="product-color-options">
        ${colors.map((color, index) => {
          const value = getColorValue(color);
          const code = getColorCode(color);

          return `
            <button
              type="button"
              class="color-option"
              data-color="${escapeHTML(value)}"
              title="${escapeHTML(value)}"
              aria-label="Select ${escapeHTML(value)}"
              style="--color-option:${escapeHTML(code)}"
            >
              <span class="color-swatch"></span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    container.addEventListener("click", event => {
      const button = event.target.closest("[data-color]");

      if (!button) return;

      selectedColor = button.dataset.color;

      $$(".color-option", container).forEach(item => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
    });
  }


  /* =========================================================
     11. QUANTITY
  ========================================================= */

  function renderQuantity() {
    const container = $(CONFIG.selectors.quantity);

    if (!container) return;

    selectedQuantity = 1;

    container.innerHTML = `
      <div class="quantity-selector">

        <button
          type="button"
          data-product-quantity-minus
          aria-label="Decrease quantity"
        >−</button>

        <input
          type="number"
          data-product-quantity-value
          value="1"
          min="1"
          max="99"
        >

        <button
          type="button"
          data-product-quantity-plus
          aria-label="Increase quantity"
        >+</button>

      </div>
    `;

    const input = $("[data-product-quantity-value]", container);

    const minus = $("[data-product-quantity-minus]", container);

    const plus = $("[data-product-quantity-plus]", container);

    minus.addEventListener("click", () => {
      selectedQuantity = Math.max(1, selectedQuantity - 1);
      input.value = selectedQuantity;
    });

    plus.addEventListener("click", () => {
      selectedQuantity = Math.min(99, selectedQuantity + 1);
      input.value = selectedQuantity;
    });

    input.addEventListener("change", () => {
      selectedQuantity = Math.max(
        1,
        Math.min(99, Math.floor(Number(input.value) || 1))
      );

      input.value = selectedQuantity;
    });
  }


  /* =========================================================
     12. STOCK STATUS
  ========================================================= */

  function renderStock(product) {
    const container = $(CONFIG.selectors.stock);

    if (!container) return;

    if (!product.available) {
      container.textContent = "Currently unavailable";
      container.className = "product-stock out-of-stock";
      return;
    }

    if (product.stock !== null && Number(product.stock) <= 0) {
      container.textContent = "Out of stock";
      container.className = "product-stock out-of-stock";
      return;
    }

    if (
      product.stock !== null &&
      Number(product.stock) <= 5
    ) {
      container.textContent = `Only ${product.stock} left`;
      container.className = "product-stock low-stock";
      return;
    }

    container.textContent = "In stock";
    container.className = "product-stock in-stock";
  }


  /* =========================================================
     13. CART PRODUCT
  ========================================================= */

  function buildCartProduct() {
    if (!currentProduct) return null;

    /*
      Include selected size/color in cart ID so variants
      don't accidentally merge into a different variant.
    */

    const variant = [
      selectedSize || "",
      selectedColor || ""
    ].join("-");

    const cartId = variant
      ? `${currentProduct.id}-${variant}`
      : currentProduct.id;

    return {
      id: cartId,

      productId: currentProduct.id,

      name: currentProduct.name,

      image: currentProduct.images[0] || "",

      mrp: currentProduct.mrp,

      price: currentProduct.price,

      offerPrice: currentProduct.price,

      quantity: selectedQuantity,

      size: selectedSize,

      color: selectedColor,

      category: currentProduct.category,

      isAddon: false
    };
  }


  /* =========================================================
     14. VALIDATION
  ========================================================= */

  function validateProduct() {
    if (!currentProduct) {
      showToast("Product unavailable.", "error");
      return false;
    }

    if (!currentProduct.available) {
      showToast("This product is currently unavailable.", "error");
      return false;
    }

    if (
      currentProduct.stock !== null &&
      Number(currentProduct.stock) <= 0
    ) {
      showToast("This product is out of stock.", "error");
      return false;
    }

    if (
      Array.isArray(currentProduct.sizes) &&
      currentProduct.sizes.length > 0 &&
      !selectedSize
    ) {
      showToast("Please select a size.", "error");
      return false;
    }

    if (
      Array.isArray(currentProduct.colors) &&
      currentProduct.colors.length > 0 &&
      !selectedColor
    ) {
      showToast("Please select a color.", "error");
      return false;
    }

    return true;
  }


  /* =========================================================
     15. ADD TO CART
  ========================================================= */

  function addToCart() {
    if (!validateProduct()) return;

    const product = buildCartProduct();

    if (!product) return;

    if (window.CXCart?.add) {
      window.CXCart.add(product, selectedQuantity);

      return true;
    }

    showToast("Cart system is not loaded.", "error");

    console.error("CXCart not found. Load cart.js first.");

    return false;
  }


  /* =========================================================
     16. BUY NOW
  ========================================================= */

  function buyNow() {
    if (!validateProduct()) return;

    const product = buildCartProduct();

    if (!product) return;

    if (!window.CXCart?.add) {
      showToast("Cart system is not loaded.", "error");
      return;
    }

    window.CXCart.add(product, selectedQuantity);

    window.location.href = CONFIG.checkoutPage;
  }


  /* =========================================================
     17. BUTTONS
  ========================================================= */

  function initButtons() {
    const addButton = $(CONFIG.selectors.addButton);

    const buyButton = $(CONFIG.selectors.buyButton);

    if (addButton) {
      addButton.addEventListener("click", addToCart);
    }

    if (buyButton) {
      buyButton.addEventListener("click", buyNow);
    }

    if (currentProduct && !currentProduct.available) {
      if (addButton) addButton.disabled = true;
      if (buyButton) buyButton.disabled = true;
    }
  }


  /* =========================================================
     18. RELATED PRODUCTS
  ========================================================= */

  function renderRelatedProducts(product) {
    const container = $(CONFIG.selectors.related);

    if (!container) return;

    const related = products
      .map(normalizeProduct)
      .filter(item => item.id !== product.id)
      .filter(item =>
        !product.category ||
        item.category === product.category
      )
      .slice(0, 4);

    if (!related.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = related.map(item => `
      <article class="related-product-card">

        <a href="product.html?id=${encodeURIComponent(item.id)}">

          ${
            item.images[0]
              ? `<img
                  src="${escapeHTML(item.images[0])}"
                  alt="${escapeHTML(item.name)}"
                  loading="lazy"
                >`
              : ""
          }

          <h3>${escapeHTML(item.name)}</h3>

          <div class="related-product-price">
            ${formatPrice(item.price)}
            ${
              item.mrp > item.price
                ? `<span>${formatPrice(item.mrp)}</span>`
                : ""
            }
          </div>

        </a>

      </article>
    `).join("");
  }


  /* =========================================================
     19. TOAST
  ========================================================= */

  function showToast(message, type = "success") {
    if (window.CXClub?.showToast) {
      window.CXClub.showToast(message, type);
      return;
    }

    alert(message);
  }


  /* =========================================================
     20. PRODUCT NOT FOUND
  ========================================================= */

  function renderNotFound() {
    const container = $("[data-product-page], .product-page");

    if (!container) return;

    container.innerHTML = `
      <div class="product-not-found">
        <h2>Product not found</h2>

        <p>
          This product may no longer be available.
        </p>

        <a href="${CONFIG.shopPage}" class="btn btn-primary">
          Browse Products
        </a>
      </div>
    `;
  }


  /* =========================================================
     21. INIT
  ========================================================= */

  async function init() {
    const rawProducts = await loadProducts();

    if (!rawProducts.length) {
      console.error("No products found.");
      return;
    }

    const identifier = getProductIdentifier();

    if (!identifier) {
      renderNotFound();
      return;
    }

    currentProduct = findProduct(identifier);

    if (!currentProduct) {
      renderNotFound();
      return;
    }

    renderBasicInfo(currentProduct);

    renderGallery(currentProduct);

    renderSizes(currentProduct);

    renderColors(currentProduct);

    renderQuantity();

    renderStock(currentProduct);

    renderRelatedProducts(currentProduct);

    initButtons();

    console.log(
      "CLOTH X CLUB product initialized:",
      currentProduct.name
    );
  }


  /* =========================================================
     22. GLOBAL API
  ========================================================= */

  window.CXProduct = {
    getCurrentProduct: () => currentProduct,

    getProducts: () => products.map(normalizeProduct),

    getSavings,

    getDiscountPercent,

    addToCart,

    buyNow,

    formatPrice
  };


  /* =========================================================
     23. START
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
