/* =========================================================
   CLOTH X CLUB — APP.JS
   Main Website Controller
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIGURATION
  ========================= */

  const CONFIG = {
    brand: "CLOTH X CLUB",
    freeDeliveryThreshold: 1499,
    currency: "INR",
    toastDuration: 2800
  };


  /* =========================
     DOM HELPERS
  ========================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  };


  /* =========================
     FORMATTERS
  ========================= */

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  };


  /* =========================
     TOAST NOTIFICATIONS
  ========================= */

  let toastTimer;

  function showToast(message, type = "success") {
    let toast = $("#cx-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cx-toast";

      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        z-index: 99999;
        padding: 14px 20px;
        border-radius: 10px;
        background: #111111;
        color: #ffffff;
        font-size: 13px;
        font-weight: 500;
        opacity: 0;
        pointer-events: none;
        transition: all .25s ease;
        max-width: calc(100% - 32px);
        text-align: center;
        box-shadow: 0 8px 30px rgba(0,0,0,.15);
      `;

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    if (type === "error") {
      toast.style.background = "#c62828";
    } else if (type === "success") {
      toast.style.background = "#111111";
    } else if (type === "info") {
      toast.style.background = "#333333";
    }

    clearTimeout(toastTimer);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, CONFIG.toastDuration);
  }


  /* =========================
     CART COUNT
  ========================= */

  function getCartCount() {
    /*
      Supports common cart storage formats.
      Your cart.js can also directly call:
      CXClub.updateCartCount(count)
    */

    const storageKeys = [
      "clothxclub_cart",
      "cxclub_cart",
      "cart"
    ];

    for (const key of storageKeys) {
      try {
        const stored = localStorage.getItem(key);

        if (!stored) continue;

        const cart = JSON.parse(stored);

        if (Array.isArray(cart)) {
          return cart.reduce(
            (total, item) =>
              total + (Number(item.quantity) || 1),
            0
          );
        }

        if (cart && Array.isArray(cart.items)) {
          return cart.items.reduce(
            (total, item) =>
              total + (Number(item.quantity) || 1),
            0
          );
        }

      } catch (error) {
        console.warn("Cart count could not be read:", error);
      }
    }

    return 0;
  }


  function updateCartCount(count = getCartCount()) {
    const cartCount = Number(count) || 0;

    $$("[data-cart-count], .cart-count, .cart-badge").forEach(element => {
      element.textContent = cartCount;

      element.classList.toggle("is-empty", cartCount === 0);

      if (cartCount <= 0) {
        element.setAttribute("aria-hidden", "true");
      } else {
        element.setAttribute("aria-hidden", "false");
      }
    });

    document.dispatchEvent(
      new CustomEvent("cx:cart-updated", {
        detail: { count: cartCount }
      })
    );

    return cartCount;
  }


  /* =========================
     MOBILE MENU
  ========================= */

  function initMobileMenu() {
    const menuButton = $(
      "[data-menu-toggle], .menu-toggle, #menu-toggle"
    );

    const menu = $(
      "[data-mobile-menu], .mobile-menu, #mobile-menu"
    );

    if (!menuButton || !menu) return;

    menuButton.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("active");

      menuButton.classList.toggle("active", isOpen);

      menuButton.setAttribute("aria-expanded", String(isOpen));

      menu.setAttribute("aria-hidden", String(!isOpen));

      document.body.classList.toggle("menu-open", isOpen);
    });

    $$("a", menu).forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("active");
        menuButton.classList.remove("active");

        menuButton.setAttribute("aria-expanded", "false");

        menu.setAttribute("aria-hidden", "true");

        document.body.classList.remove("menu-open");
      });
    });

    document.addEventListener("click", (event) => {
      if (
        menu.classList.contains("active") &&
        !menu.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        menu.classList.remove("active");
        menuButton.classList.remove("active");

        menuButton.setAttribute("aria-expanded", "false");

        menu.setAttribute("aria-hidden", "true");

        document.body.classList.remove("menu-open");
      }
    });
  }


  /* =========================
     SEARCH
  ========================= */

  function initSearch() {
    const searchButton = $(
      "[data-search-toggle], .search-toggle, #search-toggle"
    );

    const searchPanel = $(
      "[data-search-panel], .search-panel, #search-panel"
    );

    const searchInput = $(
      "[data-search-input], .search-input, #search-input"
    );

    if (!searchButton || !searchPanel) return;

    searchButton.addEventListener("click", () => {
      const isOpen = searchPanel.classList.toggle("active");

      searchButton.classList.toggle("active", isOpen);

      searchButton.setAttribute("aria-expanded", String(isOpen));

      if (isOpen && searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        searchPanel.classList.remove("active");
        searchButton.classList.remove("active");
        searchButton.setAttribute("aria-expanded", "false");
      }
    });
  }


  /* =========================
     HEADER SCROLL EFFECT
  ========================= */

  function initHeaderScroll() {
    const header = $(
      ".site-header, header[data-sticky], #header"
    );

    if (!header) return;

    const updateHeader = () => {
      header.classList.toggle(
        "scrolled",
        window.scrollY > 30
      );
    };

    updateHeader();

    window.addEventListener("scroll", updateHeader, {
      passive: true
    });
  }


  /* =========================
     BACK TO TOP
  ========================= */

  function initBackToTop() {
    const button = $(
      "[data-back-to-top], .back-to-top, #back-to-top"
    );

    if (!button) return;

    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    window.addEventListener("scroll", () => {
      button.classList.toggle(
        "visible",
        window.scrollY > 400
      );
    }, { passive: true });
  }


  /* =========================
     IMAGE FALLBACK
  ========================= */

  function initImageFallbacks() {
    $$("img").forEach(image => {
      image.addEventListener("error", function () {
        this.classList.add("image-error");

        this.alt = this.alt || "Product image unavailable";
      }, { once: true });
    });
  }


  /* =========================
     NEWSLETTER
  ========================= */

  function initNewsletter() {
    $$("[data-newsletter-form], .newsletter-form").forEach(form => {
      form.addEventListener("submit", event => {
        event.preventDefault();

        const input = $("input[type='email']", form);

        if (!input) return;

        const email = input.value.trim();

        if (!email || !input.checkValidity()) {
          showToast("Please enter a valid email address.", "error");
          return;
        }

        /*
          Front-end only for now.
          Connect to your backend/email provider later.
        */

        showToast("Thank you for subscribing!", "success");

        form.reset();
      });
    });
  }


  /* =========================
     GLOBAL CLICK HANDLERS
  ========================= */

  function initGlobalActions() {
    document.addEventListener("click", event => {

      /* Wishlist button */
      const wishlistButton = event.target.closest(
        "[data-wishlist], .wishlist-btn"
      );

      if (wishlistButton) {
        wishlistButton.classList.toggle("active");

        const active = wishlistButton.classList.contains("active");

        showToast(
          active ? "Added to wishlist" : "Removed from wishlist",
          "success"
        );
      }

      /* Copy coupon code */
      const couponButton = event.target.closest(
        "[data-copy-coupon]"
      );

      if (couponButton) {
        const coupon = couponButton.dataset.copyCoupon;

        if (!coupon) return;

        navigator.clipboard?.writeText(coupon)
          .then(() => showToast("Coupon copied!", "success"))
          .catch(() => showToast("Unable to copy coupon.", "error"));
      }

    });
  }


  /* =========================
     STORAGE SYNC
  ========================= */

  function initStorageSync() {
    window.addEventListener("storage", event => {
      updateCartCount();
    });
  }


  /* =========================
     GLOBAL API
  ========================= */

  window.CXClub = {
    config: CONFIG,

    formatPrice,

    showToast,

    updateCartCount,

    getCartCount,

    $,

    $$,

    /* Free delivery helper */
    getDeliveryStatus(subtotal) {
      const amount = Number(subtotal) || 0;

      const unlocked = amount >= CONFIG.freeDeliveryThreshold;

      return {
        threshold: CONFIG.freeDeliveryThreshold,
        unlocked,
        remaining: Math.max(
          0,
          CONFIG.freeDeliveryThreshold - amount
        ),
        progress: Math.min(
          100,
          (amount / CONFIG.freeDeliveryThreshold) * 100
        ),
        message: unlocked
          ? "Congratulations! You've unlocked FREE DELIVERY."
          : `Add ${formatPrice(CONFIG.freeDeliveryThreshold - amount)} more to unlock FREE DELIVERY.`
      };
    }
  };


  /* =========================
     INITIALIZE
  ========================= */

  ready(() => {
    initMobileMenu();
    initSearch();
    initHeaderScroll();
    initBackToTop();
    initImageFallbacks();
    initNewsletter();
    initGlobalActions();
    initStorageSync();

    updateCartCount();

    console.log("CLOTH X CLUB initialized successfully.");
  });

})();
