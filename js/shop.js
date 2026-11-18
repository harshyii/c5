
/* =========================================================
   CLOTH X CLUB — SHOP.JS
   Product Listing | Filters | Search | Sort | Pagination
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. CONFIG
  ========================================================= */

  const CONFIG = {
    productsPath: "Layout/data/products.json",

    productsPerPage: 12,

    selectors: {
      grid: "[data-shop-grid], #shop-grid, .shop-grid",
      search: "[data-shop-search], #shop-search",
      category: "[data-shop-category], #shop-category",
      sort: "[data-shop-sort], #shop-sort",
      loadMore: "[data-shop-load-more], #shop-load-more, #load-more-products",
      count: "[data-shop-count], #shop-count",
      empty: "[data-shop-empty], #shop-empty",
      filters: "[data-shop-filters], #shop-filters",
      priceMin: "[data-price-min]",
      priceMax: "[data-price-max]"
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

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);

  const slugify = (value = "") =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");


  /* =========================================================
     3. PRODUCT DATA
  ========================================================= */

  let products = [];

  async function loadProducts() {
    try {
      const response = await fetch(CONFIG.productsPath);

      if (!response.ok) {
        throw new Error("Products could not be loaded.");
      }

      const data = await response.json();

      const rawProducts = Array.isArray(data)
        ? data
        : data.products || data.items || [];

      return rawProducts.map(normalizeProduct);

    } catch (error) {
      console.error("CLOTH X CLUB shop loading error:", error);
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

    return {
      ...product,

      id: String(
        product.id ??
        product.productId ??
        product.product_id ??
        ""
      ),

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
        "Other",

      description:
        product.description ||
        product.excerpt ||
        "",

      mrp: Math.max(0, mrp),

      price: Math.max(0, price),

      images: images.filter(Boolean),

      available:
        product.available !== false &&
        product.status !== "out_of_stock" &&
        product.status !== "inactive",

      stock:
        product.stock ??
        product.inventory ??
        product.quantity ??
        null,

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

      createdAt:
        product.createdAt ||
        product.dateAdded ||
        product.created ||
        ""
    };
  }


  /* =========================================================
     5. PRICE HELPERS
  ========================================================= */

  function getDiscount(product) {
    if (!product.mrp || product.mrp <= product.price) {
      return 0;
    }

    return Math.round(
      ((product.mrp - product.price) / product.mrp) * 100
    );
  }


  function getSavings(product) {
    return Math.max(0, product.mrp - product.price);
  }


  function isOutOfStock(product) {
    return (
      !product.available ||
      (
        product.stock !== null &&
        Number(product.stock) <= 0
      )
    );
  }


  /* =========================================================
     6. PRODUCT CARD
  ========================================================= */

  function createProductCard(product) {
    const image = product.images[0] || "";

    const discount = getDiscount(product);

    const outOfStock = isOutOfStock(product);

    const productURL =
      `product.html?id=${encodeURIComponent(product.id)}`;

    const imageHTML = image
      ? `
        <img
          class="product-card-image"
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
        >
      `
      : `
        <div class="product-image-placeholder">
          CLOTH X CLUB
        </div>
      `;

    return `
      <article
        class="product-card"
        data-product-id="${escapeHTML(product.id)}"
      >

        <div class="product-card-image-wrap">

          <a
            href="${productURL}"
            class="product-card-image-link"
            aria-label="View ${escapeHTML(product.name)}"
          >
            ${imageHTML}
          </a>

          ${
            discount > 0
              ? `
                <span class="product-discount-badge">
                  ${discount}% OFF
                </span>
              `
              : ""
          }

          ${
            outOfStock
              ? `
                <span class="product-stock-badge">
                  SOLD OUT
                </span>
              `
              : ""
          }

          <button
            type="button"
            class="product-wishlist-btn"
            data-wishlist
            data-product-id="${escapeHTML(product.id)}"
            aria-label="Add ${escapeHTML(product.name)} to wishlist"
          >
            ♡
          </button>

        </div>

        <div class="product-card-content">

          <div class="product-card-category">
            ${escapeHTML(product.category)}
          </div>

          <h3 class="product-card-title">
            <a href="${productURL}">
              ${escapeHTML(product.name)}
            </a>
          </h3>

          <div class="product-card-prices">

            <span class="product-card-price">
              ${formatPrice(product.price)}
            </span>

            ${
              product.mrp > product.price
                ? `
                  <span class="product-card-mrp">
                    ${formatPrice(product.mrp)}
                  </span>
                `
                : ""
            }

          </div>

          ${
            product.mrp > product.price
              ? `
                <div class="product-card-saving">
                  You save ${formatPrice(getSavings(product))}
                </div>
              `
              : ""
          }

          ${
            outOfStock
              ? `
                <button
                  type="button"
                  class="product-card-action disabled"
                  disabled
                >
                  Sold Out
                </button>
              `
              : `
                <button
                  type="button"
                  class="product-card-action"
                  data-shop-add
                  data-id="${escapeHTML(product.id)}"
                >
                  ${hasVariants(product) ? "Select Options" : "Add to Cart"}
                </button>
              `
          }

        </div>

      </article>
    `;
  }


  /* =========================================================
     7. VARIANT CHECK
  ========================================================= */

  function hasVariants(product) {
    return (
      (Array.isArray(product.sizes) && product.sizes.length > 0) ||
      (Array.isArray(product.colors) && product.colors.length > 0)
    );
  }


  /* =========================================================
     8. SHOP CLASS
  ========================================================= */

  class Shop {
    constructor(productList) {
      this.products = productList;

      this.filteredProducts = [...productList];

      this.currentPage = 1;

      this.grid = $(CONFIG.selectors.grid);

      this.searchInput = $(CONFIG.selectors.search);

      this.categorySelect = $(CONFIG.selectors.category);

      this.sortSelect = $(CONFIG.selectors.sort);

      this.loadMoreButton = $(CONFIG.selectors.loadMore);

      this.countElement = $(CONFIG.selectors.count);

      this.emptyElement = $(CONFIG.selectors.empty);

      this.minPriceInput = $(CONFIG.selectors.priceMin);

      this.maxPriceInput = $(CONFIG.selectors.priceMax);

      this.init();
    }


    /* =======================================================
       INIT
    ======================================================= */

    init() {
      if (!this.grid) {
        console.warn("Shop grid was not found.");
        return;
      }

      this.renderCategories();

      this.bindSearch();

      this.bindCategory();

      this.bindSorting();

      this.bindLoadMore();

      this.bindPriceFilters();

      this.bindQuickAdd();

      this.bindWishlist();

      this.render();
    }


    /* =======================================================
       CATEGORY FILTER
    ======================================================= */

    renderCategories() {
      if (!this.categorySelect) return;

      const categories = [
        ...new Set(
          this.products
            .map(product => product.category)
            .filter(Boolean)
        )
      ];

      const firstOption =
        this.categorySelect.querySelector("option");

      const defaultLabel = firstOption
        ? firstOption.textContent
        : "All Categories";

      this.categorySelect.innerHTML = `
        <option value="">${escapeHTML(defaultLabel)}</option>

        ${categories.map(category => `
          <option value="${escapeHTML(category)}">
            ${escapeHTML(category)}
          </option>
        `).join("")}
      `;
    }


    bindCategory() {
      if (!this.categorySelect) return;

      this.categorySelect.addEventListener("change", () => {
        this.applyFilters();
      });
    }


    /* =======================================================
       SEARCH
    ======================================================= */

    bindSearch() {
      if (!this.searchInput) return;

      this.searchInput.addEventListener("input", () => {
        this.applyFilters();
      });
    }


    /* =======================================================
       SORT
    ======================================================= */

    bindSorting() {
      if (!this.sortSelect) return;

      this.sortSelect.addEventListener("change", () => {
        this.applyFilters();
      });
    }


    /* =======================================================
       PRICE FILTER
    ======================================================= */

    bindPriceFilters() {
      [this.minPriceInput, this.maxPriceInput]
        .filter(Boolean)
        .forEach(input => {
          input.addEventListener("input", () => {
            this.applyFilters();
          });
        });
    }


    /* =======================================================
       LOAD MORE
    ======================================================= */

    bindLoadMore() {
      if (!this.loadMoreButton) return;

      this.loadMoreButton.addEventListener("click", () => {
        this.currentPage++;
        this.render();
      });
    }


    /* =======================================================
       QUICK ADD
    ======================================================= */

    bindQuickAdd() {
      this.grid.addEventListener("click", event => {
        const button = event.target.closest("[data-shop-add]");

        if (!button) return;

        const id = button.dataset.id;

        const product = this.products.find(
          item => String(item.id) === String(id)
        );

        if (!product) return;

        if (isOutOfStock(product)) {
          showToast("This product is out of stock.", "error");
          return;
        }

        /*
          Products with sizes/colors should go to the
          product page to select their variants.
        */

        if (hasVariants(product)) {
          window.location.href =
            `product.html?id=${encodeURIComponent(product.id)}`;

          return;
        }

        if (window.CXCart?.add) {
          window.CXCart.add({
            id: product.id,
            name: product.name,
            image: product.images[0] || "",
            mrp: product.mrp,
            price: product.price,
            offerPrice: product.price,
            category: product.category,
            isAddon: false
          }, 1);

          return;
        }

        showToast("Cart system is not loaded.", "error");
      });
    }


    /* =======================================================
       WISHLIST
    ======================================================= */

    bindWishlist() {
      this.grid.addEventListener("click", event => {
        const button = event.target.closest("[data-wishlist]");

        if (!button) return;

        /*
          app.js handles the wishlist visual toggle and toast.
        */
      });
    }


    /* =======================================================
       APPLY FILTERS
    ======================================================= */

    applyFilters() {
      const searchTerm = this.searchInput
        ? this.searchInput.value.toLowerCase().trim()
        : "";

      const category = this.categorySelect
        ? this.categorySelect.value
        : "";

      const minPrice = this.minPriceInput
        ? Number(this.minPriceInput.value) || 0
        : 0;

      const maxPrice = this.maxPriceInput
        ? Number(this.maxPriceInput.value) || Infinity
        : Infinity;

      this.filteredProducts = this.products.filter(product => {

        const searchContent = [
          product.name,
          product.category,
          product.description,
          product.brand,
          product.tags
        ]
          .flat()
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !searchTerm ||
          searchContent.includes(searchTerm);

        const matchesCategory =
          !category ||
          product.category === category;

        const matchesPrice =
          product.price >= minPrice &&
          product.price <= maxPrice;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesPrice
        );
      });

      this.sortProducts();

      this.currentPage = 1;

      this.render();
    }


    /* =======================================================
       SORT PRODUCTS
    ======================================================= */

    sortProducts() {
      if (!this.sortSelect) return;

      const sort = this.sortSelect.value;

      switch (sort) {

        case "price-low":
        case "price-asc":
          this.filteredProducts.sort(
            (a, b) => a.price - b.price
          );
          break;

        case "price-high":
        case "price-desc":
          this.filteredProducts.sort(
            (a, b) => b.price - a.price
          );
          break;

        case "name":
        case "name-asc":
          this.filteredProducts.sort(
            (a, b) => a.name.localeCompare(b.name)
          );
          break;

        case "discount":
        case "discount-high":
          this.filteredProducts.sort(
            (a, b) => getDiscount(b) - getDiscount(a)
          );
          break;

        case "newest":
          this.filteredProducts.sort(
            (a, b) =>
              new Date(b.createdAt || 0) -
              new Date(a.createdAt || 0)
          );
          break;

        default:
          // Default product order from JSON is preserved.
          break;
      }
    }


    /* =======================================================
       RENDER PRODUCTS
    ======================================================= */

    render() {
      const limit =
        this.currentPage * CONFIG.productsPerPage;

      const visibleProducts =
        this.filteredProducts.slice(0, limit);

      if (visibleProducts.length === 0) {
        this.grid.innerHTML = `
          <div class="shop-empty-state">
            <h3>No products found</h3>
            <p>Try adjusting your filters or search.</p>
            <button
              type="button"
              class="shop-reset-btn"
              data-shop-reset
            >
              Clear Filters
            </button>
          </div>
        `;
      } else {
        this.grid.innerHTML = visibleProducts
          .map(createProductCard)
          .join("");
      }

      this.renderCount();

      this.renderLoadMore();

      this.bindReset();
    }


    /* =======================================================
       PRODUCT COUNT
    ======================================================= */

    renderCount() {
      if (!this.countElement) return;

      this.countElement.textContent =
        `${this.filteredProducts.length} products`;
    }


    /* =======================================================
       LOAD MORE BUTTON
    ======================================================= */

    renderLoadMore() {
      if (!this.loadMoreButton) return;

      const hasMore =
        this.currentPage * CONFIG.productsPerPage <
        this.filteredProducts.length;

      this.loadMoreButton.style.display =
        hasMore ? "" : "none";
    }


    /* =======================================================
       RESET FILTERS
    ======================================================= */

    bindReset() {
      const resetButton = $("[data-shop-reset]", this.grid);

      if (!resetButton) return;

      resetButton.onclick = () => {
        if (this.searchInput) this.searchInput.value = "";

        if (this.categorySelect) {
          this.categorySelect.value = "";
        }

        if (this.sortSelect) {
          this.sortSelect.value = "";
        }

        if (this.minPriceInput) {
          this.minPriceInput.value = "";
        }

        if (this.maxPriceInput) {
          this.maxPriceInput.value = "";
        }

        this.filteredProducts = [...this.products];

        this.currentPage = 1;

        this.render();
      };
    }
  }


  /* =========================================================
     9. TOAST
  ========================================================= */

  function showToast(message, type = "success") {
    if (window.CXClub?.showToast) {
      window.CXClub.showToast(message, type);
      return;
    }

    let toast = $("#cx-shop-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cx-shop-toast";

      toast.style.cssText = `
        position:fixed;
        bottom:24px;
        left:50%;
        transform:translate(-50%,20px);
        opacity:0;
        z-index:99999;
        padding:14px 20px;
        background:#111;
        color:white;
        border-radius:8px;
        font-size:13px;
        transition:.25s;
      `;

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.background =
      type === "error" ? "#c62828" : "#111";

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
     10. INIT
  ========================================================= */

  async function initShop() {
    products = await loadProducts();

    if (!products.length) {
      console.warn("CLOTH X CLUB: No products loaded.");
      return;
    }

    const shopGrid = $(CONFIG.selectors.grid);

    if (!shopGrid) {
      return;
    }

    window.CXShop = new Shop(products);

    console.log(
      `CLOTH X CLUB shop initialized. ${products.length} products loaded.`
    );
  }


  /* =========================================================
     11. GLOBAL API
  ========================================================= */

  window.CXShopAPI = {
    config: CONFIG,

    getProducts: () => [...products],

    loadProducts,

    normalizeProduct,

    createProductCard,

    getDiscount,

    getSavings,

    formatPrice
  };


  /* =========================================================
     12. START
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShop);
  } else {
    initShop();
  }

})();
