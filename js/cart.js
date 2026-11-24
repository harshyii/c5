/* =========================================================
   CLOTH X CLUB — CART.JS
   Cart Engine | Add-ons | Free Delivery | Order Summary
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. CONFIGURATION
  ========================================================= */

  const CONFIG = {
    storageKey: "clothxclub_cart",

    currency: "INR",

    freeDeliveryThreshold: 1499,

    // CHANGE THIS TO YOUR ACTUAL DELIVERY FEE
    deliveryCharge: 99,

    maxAddonOffers: 3,

    addonOffers: []
  };


  /* =========================================================
     2. HELPERS
  ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);

  const escapeHTML = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const createId = () =>
    "cx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);


  /* =========================================================
     3. CART DATA
  ========================================================= */

  let cart = [];

  function loadCart() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed.map(normalizeItem);

    } catch (error) {
      console.error("CLOTH X CLUB: Failed to load cart.", error);
      return [];
    }
  }


  function saveCart() {
    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(cart)
      );

      updateCartBadge();

      renderCart();

      document.dispatchEvent(
        new CustomEvent("cx:cart-updated", {
          detail: {
            cart,
            totals: getTotals()
          }
        })
      );

    } catch (error) {
      console.error("CLOTH X CLUB: Failed to save cart.", error);
    }
  }


  function normalizeItem(item = {}) {
    const mrp = Number(item.mrp ?? item.originalPrice ?? item.price) || 0;

    const offerPrice = Number(
      item.offerPrice ??
      item.discountPrice ??
      item.price ??
      mrp
    );

    const sellingPrice = Math.max(0, offerPrice);

    return {
      id: String(item.id || item.productId || createId()),

      productId: String(item.productId || item.id || ""),

      name: item.name || item.title || "Product",

      image: item.image || item.img || "",

      mrp,

      price: sellingPrice,

      quantity: Math.max(1, Number(item.quantity) || 1),

      size: item.size || "",

      color: item.color || "",

      category: item.category || "",

      isAddon: Boolean(item.isAddon),

      offerType: item.offerType || "",

      addedAt: item.addedAt || Date.now()
    };
  }


  /* =========================================================
     4. CART OPERATIONS
  ========================================================= */

  function findItem(id) {
    return cart.find(item => String(item.id) === String(id));
  }


  function addItem(product, quantity = 1) {
    if (!product || !product.id) {
      console.warn("Cart product requires an ID.");
      return false;
    }

    const normalized = normalizeItem({
      ...product,
      quantity
    });

    const existing = findItem(normalized.id);

    if (existing) {
      existing.quantity += normalized.quantity;
    } else {
      cart.push(normalized);
    }

    saveCart();

    showToast(`${normalized.name} added to cart`);

    return true;
  }


  let addonProducts = [];
  let addonLoading = false;

  async function loadAddonProducts() {
    if (addonProducts.length || addonLoading || !window.CXProducts?.getPage) return;
    addonLoading = true;
    try {
      // Fetch small catalogue batches until we find up to three accessories.
      const found = [];
      for (let offset = 0; offset < 96 && found.length < 3; offset += 12) {
        const page = await window.CXProducts.getPage(offset, 12);
        for (const p of page.products || []) {
          const category = String(p.category || "").toLowerCase();
          const words = `${p.title || ""} ${p.description || ""}`.toLowerCase();
          const isAccessory = category.includes("accessor") ||
            /handkerchief|hanky|perfume|fragrance|socks|cap|belt|wallet|watch|sunglass|bracelet/.test(words);
          if (!isAccessory || p.available === false || !p.price) continue;
          if (cart.some(x => x.productId === p.id || x.id === p.id)) continue;
          found.push({
            id: "bag-addon-" + p.id,
            productId: p.id,
            name: p.title,
            image: p.image,
            mrp: Number(p.mrp || p.price),
            offerPrice: Math.max(1, Math.round(Number(p.price) * 0.90)),
            category: "Accessories",
            isAddon: true,
            offerType: "one_time_bag_offer"
          });
          if (found.length >= 3) break;
        }
        if (!page.hasMore) break;
      }
      addonProducts = found;
    } catch (err) {
      console.warn("Bag accessories could not be loaded:", err);
    } finally {
      addonLoading = false;
      renderAddons();
    }
  }

  function addAddon(addonId) {
    const addon = addonProducts.find(item => item.id === String(addonId));
    if (!addon) {
      showToast("This accessory is not available right now.", "error");
      return false;
    }
    if (findItem(addon.id)) {
      showToast("This item is already in your bag.", "info");
      return false;
    }
    addItem({
      ...addon,
      name: addon.name,
      price: addon.offerPrice,
      offerPrice: addon.offerPrice,
      isAddon: true,
      offerType: "one_time_bag_offer"
    }, 1);
    return true;
  }


  function removeItem(id) {
    const existing = findItem(id);

    if (!existing) return;

    cart = cart.filter(item => String(item.id) !== String(id));

    saveCart();

    showToast(`${existing.name} removed`);
  }


  function updateQuantity(id, quantity) {
    const existing = findItem(id);

    if (!existing) return;

    quantity = Math.floor(Number(quantity));

    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeItem(id);
      return;
    }

    existing.quantity = quantity;

    saveCart();
  }


  function increaseQuantity(id) {
    const item = findItem(id);

    if (!item) return;

    updateQuantity(id, item.quantity + 1);
  }


  function decreaseQuantity(id) {
    const item = findItem(id);

    if (!item) return;

    updateQuantity(id, item.quantity - 1);
  }


  function clearCart() {
    cart = [];

    saveCart();

    showToast("Cart cleared");
  }


  /* =========================================================
     5. PRICE CALCULATIONS
  ========================================================= */

  function getSubtotal() {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }


  function getMRPTotal() {
    return cart.reduce(
      (total, item) => total + item.mrp * item.quantity,
      0
    );
  }


  function getProductSavings() {
    return cart.reduce(
      (total, item) =>
        total + Math.max(0, item.mrp - item.price) * item.quantity,
      0
    );
  }


  function getDeliveryStatus() {
    const subtotal = getSubtotal();

    const threshold = CONFIG.freeDeliveryThreshold;

    const unlocked = subtotal >= threshold;

    const remaining = Math.max(0, threshold - subtotal);

    const progress = Math.min(
      100,
      (subtotal / threshold) * 100
    );

    return {
      subtotal,
      threshold,
      unlocked,
      remaining,
      progress,

      message: unlocked
        ? "Congratulations! You've unlocked FREE DELIVERY."
        : `Add ${formatPrice(remaining)} more to unlock FREE DELIVERY.`
    };
  }


  function getDeliveryCharge() {
    const status = getDeliveryStatus();

    return status.unlocked ? 0 : CONFIG.deliveryCharge;
  }


  function getTotals() {
    const subtotal = getSubtotal();

    const mrpTotal = getMRPTotal();

    const productSavings = getProductSavings();

    const delivery = getDeliveryCharge();

    const deliverySavings = delivery === 0
      ? CONFIG.deliveryCharge
      : 0;

    const totalSavings = productSavings + deliverySavings;

    const total = subtotal + delivery;

    return {
      subtotal,
      mrpTotal,
      productSavings,
      delivery,
      deliverySavings,
      totalSavings,
      total,
      itemCount: getItemCount(),
      freeDelivery: delivery === 0
    };
  }


  function getItemCount() {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }


  /* =========================================================
     6. CART BADGE
  ========================================================= */

  function updateCartBadge() {
    const count = getItemCount();

    $$("[data-cart-count], .cart-count, .cart-badge").forEach(element => {
      element.textContent = count;

      element.classList.toggle("is-empty", count === 0);

      element.setAttribute(
        "aria-hidden",
        count === 0 ? "true" : "false"
      );
    });

    if (window.CXClub?.updateCartCount) {
      window.CXClub.updateCartCount(count);
    }
  }


  /* =========================================================
     7. TOAST
  ========================================================= */

  function showToast(message, type = "success") {
    if (window.CXClub?.showToast) {
      window.CXClub.showToast(message, type);
      return;
    }

    let toast = $("#cx-cart-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cx-cart-toast";

      toast.style.cssText = `
        position:fixed;
        left:50%;
        bottom:24px;
        transform:translate(-50%,20px);
        opacity:0;
        z-index:99999;
        background:#111;
        color:#fff;
        padding:13px 20px;
        border-radius:8px;
        font-size:13px;
        transition:.25s;
        max-width:calc(100% - 32px);
        text-align:center;
      `;

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.background =
      type === "error" ? "#c62828" : "#111111";

    clearTimeout(toast._timer);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%,0)";
    });

    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%,20px)";
    }, 2500);
  }


  /* =========================================================
     8. CART ITEM HTML
  ========================================================= */

  function createCartItemHTML(item) {
    const itemTotal = item.price * item.quantity;

    return `
      <div class="cart-item" data-cart-item="${escapeHTML(item.id)}">

        <div class="cart-item-image">
          ${
            item.image
              ? `<img
                  src="${escapeHTML(item.image)}"
                  alt="${escapeHTML(item.name)}"
                  loading="lazy"
                >`
              : ""
          }
        </div>

        <div class="cart-item-info">

          <div class="cart-item-title">
            ${escapeHTML(item.name)}
          </div>

          ${
            item.size
              ? `<div class="cart-item-meta">Size: ${escapeHTML(item.size)}</div>`
              : ""
          }

          ${
            item.color
              ? `<div class="cart-item-meta">Color: ${escapeHTML(item.color)}</div>`
              : ""
          }

          ${
            item.isAddon
              ? `<div class="addon-saving">Special checkout price</div>`
              : ""
          }

          <div class="cart-item-price">
            ${formatPrice(item.price)}

            ${
              item.mrp > item.price
                ? `<span class="price-original">${formatPrice(item.mrp)}</span>`
                : ""
            }
          </div>

          <div class="cart-item-actions">

            <div class="quantity-selector">

              <button
                type="button"
                class="quantity-btn"
                data-cart-action="decrease"
                data-id="${escapeHTML(item.id)}"
                aria-label="Decrease quantity"
              >−</button>

              <span class="quantity-value">
                ${item.quantity}
              </span>

              <button
                type="button"
                class="quantity-btn"
                data-cart-action="increase"
                data-id="${escapeHTML(item.id)}"
                aria-label="Increase quantity"
              >+</button>

            </div>

            <button
              type="button"
              class="remove-item"
              data-cart-action="remove"
              data-id="${escapeHTML(item.id)}"
            >
              Remove
            </button>

          </div>

        </div>

        <div class="cart-line-total">
          ${formatPrice(itemTotal)}
        </div>

      </div>
    `;
  }


  /* =========================================================
     9. CART RENDERING
  ========================================================= */

  function renderCart() {
    const cartContainer = $(
      "[data-cart-items], #cart-items, .cart-items"
    );

    if (cartContainer) {
      if (cart.length === 0) {
        cartContainer.innerHTML = `
          <div class="empty-cart">
            <h2 class="empty-cart-title">Your cart is empty</h2>
            <p class="empty-cart-text">
              Looks like you haven't added anything yet.
            </p>
            <a href="shop.html" class="btn btn-primary">
              Explore Collection
            </a>
          </div>
        `;
      } else {
        cartContainer.innerHTML = cart
          .map(createCartItemHTML)
          .join("");
      }
    }

    renderDeliveryProgress();

    renderAddons();

    renderSummary();

    updateCartBadge();
  }


  /* =========================================================
     10. FREE DELIVERY PROGRESS
  ========================================================= */

  function renderDeliveryProgress() {
    const container = $(
      "[data-delivery-progress], #delivery-progress, .delivery-progress-card"
    );

    if (!container) return;

    const status = getDeliveryStatus();

    container.innerHTML = `
      <div class="delivery-progress-card">

        <div class="delivery-progress-title">
          🚚 FREE DELIVERY
        </div>

        <div class="delivery-progress-message ${
          status.unlocked ? "unlocked" : ""
        }">
          ${
            status.unlocked
              ? "Congratulations! You've unlocked FREE DELIVERY."
              : `Add <strong>${formatPrice(status.remaining)}</strong> more to unlock FREE DELIVERY.`
          }
        </div>

        <div class="delivery-progress-bar">
          <div
            class="delivery-progress-fill"
            style="width:${status.progress}%"
          ></div>
        </div>

        <div class="delivery-progress-footer">
          <span>${formatPrice(status.subtotal)}</span>
          <span>${formatPrice(status.threshold)}</span>
        </div>

      </div>
    `;
  }


  /* =========================================================
     11. ADD-ON OFFERS
  ========================================================= */

  function getAvailableAddons() {
    return addonProducts
      .filter(addon => !findItem(addon.id))
      .slice(0, CONFIG.maxAddonOffers);
  }


  function createAddonHTML(addon) {
    const saving = Math.max(
      0,
      Number(addon.mrp) - Number(addon.offerPrice)
    );

    return `
      <article class="addon-card" data-addon="${escapeHTML(addon.id)}">

        ${
          addon.image
            ? `<img
                class="addon-image"
                src="${escapeHTML(addon.image)}"
                alt="${escapeHTML(addon.name)}"
                loading="lazy"
              >`
            : ""
        }

        <div class="addon-info">

          <div class="addon-name">
            ${escapeHTML(addon.name)}
          </div>

          <div class="addon-price">

            <span class="addon-current-price">
              ${formatPrice(addon.offerPrice)}
            </span>

            <span class="addon-original-price">
              ${formatPrice(addon.mrp)}
            </span>

          </div>

          <div class="addon-saving">
            One-time bag offer · Save ${formatPrice(saving)}
          </div>

        </div>

        <button
          type="button"
          class="addon-add-btn"
          data-cart-action="add-addon"
          data-id="${escapeHTML(addon.id)}"
        >
          + Add
        </button>

      </article>
    `;
  }


  function renderAddons() {
    const container = $(
      "[data-cart-addons], #cart-addons, .cart-addons"
    );

    if (!container) return;

    if (cart.length === 0) {
      container.style.display = "none";
      return;
    }

    container.style.display = "";
    if (!addonProducts.length) {
      container.innerHTML = `<div class="addon-heading"><h3 class="addon-title">Complete your look</h3></div><p class="addon-subtitle">Checking the live accessories collection for a one-time bag offer…</p>`;
      loadAddonProducts();
      return;
    }

    const available = getAvailableAddons();
    if (!available.length) {
      container.style.display = "none";
      return;
    }
    container.innerHTML = `
      <div class="addon-heading">
        <span class="eyebrow">A little extra for your order</span>
        <h3 class="addon-title">Accessories at a special bag price</h3>
      </div>
      <p class="addon-subtitle">Choose from accessories in our live catalogue. A temporary 10% bag offer is applied to these items only.</p>
      <div class="addon-list">${available.map(createAddonHTML).join("")}</div>
    `;
  }


  /* =========================================================
     12. ORDER SUMMARY
  ========================================================= */

  function renderSummary() {
    const summary = $(
      "[data-cart-summary], #cart-summary, .cart-summary"
    );

    if (!summary) return;

    const totals = getTotals();

    summary.innerHTML = `
      <h3 class="cart-summary-title">
        Order Summary
      </h3>

      <div class="summary-row">
        <span class="summary-label">
          MRP Total
        </span>
        <span class="summary-value">
          ${formatPrice(totals.mrpTotal)}
        </span>
      </div>

      <div class="summary-row">
        <span class="summary-label">
          Product Savings
        </span>
        <span class="summary-value summary-discount">
          - ${formatPrice(totals.productSavings)}
        </span>
      </div>

      <div class="summary-row">
        <span class="summary-label">
          Subtotal
        </span>
        <span class="summary-value">
          ${formatPrice(totals.subtotal)}
        </span>
      </div>

      <div class="summary-row">
        <span class="summary-label">
          Delivery
        </span>

        <span class="summary-value ${
          totals.delivery === 0 ? "summary-discount" : ""
        }">
          ${
            totals.delivery === 0
              ? "FREE"
              : formatPrice(totals.delivery)
          }
        </span>
      </div>

      ${
        totals.deliverySavings > 0
          ? `
            <div class="summary-row">
              <span class="summary-label">
                Free delivery savings
              </span>
              <span class="summary-value summary-discount">
                - ${formatPrice(totals.deliverySavings)}
              </span>
            </div>
          `
          : ""
      }

      <hr class="summary-divider">

      <div class="summary-row summary-total">
        <span>Total</span>
        <span class="summary-total-value">
          ${formatPrice(totals.total)}
        </span>
      </div>

      ${
        totals.totalSavings > 0
          ? `
            <div class="savings-banner">
              🎉 You're saving ${formatPrice(totals.totalSavings)}!
            </div>
          `
          : ""
      }

      <button
        type="button"
        class="checkout-btn"
        data-checkout-button
        ${cart.length === 0 ? "disabled" : ""}
      >
        Proceed to Checkout
      </button>

      <div class="cart-secure-note">
        Secure checkout · Easy returns
      </div>
    `;
  }


  /* =========================================================
     13. CART EVENT HANDLING
  ========================================================= */

  function initCartEvents() {
    document.addEventListener("click", event => {

      const button = event.target.closest("[data-cart-action]");

      if (!button) return;

      const action = button.dataset.cartAction;

      const id = button.dataset.id;

      switch (action) {

        case "increase":
          increaseQuantity(id);
          break;

        case "decrease":
          decreaseQuantity(id);
          break;

        case "remove":
          removeItem(id);
          break;

        case "add-addon":
          addAddon(id);
          break;
      }
    });


    /* Checkout */
    document.addEventListener("click", event => {
      const checkoutButton = event.target.closest(
        "[data-checkout-button]"
      );

      if (!checkoutButton) return;

      if (cart.length === 0) {
        showToast("Your cart is empty.", "error");
        return;
      }

      /*
        Connect your real checkout page here.
      */

      window.location.href = "checkout.html";
    });


    /* Sync cart across tabs */
    window.addEventListener("storage", event => {
      if (event.key === CONFIG.storageKey) {
        cart = loadCart();
        renderCart();
      }
    });
  }


  /* =========================================================
     14. PRODUCT PAGE ADD TO CART SUPPORT
  ========================================================= */

  function initAddToCartButtons() {
    document.addEventListener("click", event => {
      const button = event.target.closest(
        "[data-add-to-cart], .add-to-cart-btn"
      );

      if (!button) return;

      const productData = button.dataset;

      const product = {
        id: productData.productId || productData.id,
        name: productData.productName || productData.name,
        image: productData.image,
        mrp: productData.mrp,
        price: productData.price || productData.offerPrice,
        offerPrice: productData.offerPrice || productData.price,
        size: productData.size || "",
        color: productData.color || "",
        category: productData.category || ""
      };

      if (!product.id || !product.name || product.price == null) {
        showToast("Product information is incomplete.", "error");
        return;
      }

      addItem(product, 1);
    });
  }


  /* =========================================================
     15. GLOBAL CART API
  ========================================================= */

  window.CXCart = {

    config: CONFIG,

    getCart: () => [...cart],

    getItem: findItem,

    getCount: getItemCount,

    getSubtotal,

    getMRPTotal,

    getProductSavings,

    getDeliveryStatus,

    getDeliveryCharge,

    getTotals,

    add: addItem,

    addAddon,

    remove: removeItem,

    updateQuantity,

    increase: increaseQuantity,

    decrease: decreaseQuantity,

    clear: clearCart,

    render: renderCart,

    formatPrice
  };


  /* =========================================================
     16. INITIALIZATION
  ========================================================= */

  function init() {
    cart = loadCart();

    initCartEvents();

    renderCart();

    console.log("CLOTH X CLUB cart initialized.");
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
