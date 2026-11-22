
/**
 * CLOTH X CLUB — PAGINATED PRODUCT CLIENT
 * Homepage: 12 products
 * Shop: 12 products per batch
 * Product page: one product by ID
 */

(() => {
  "use strict";

  const API_URL = "https://script.google.com/macros/s/AKfycbwedB2j2FwFYJoDQzjowsxCLmnIYf_jjLCwNkvZeBYjrUhX4Wks9c1r4_Rg9TuDj-9G/exec";

  const PAGE_SIZE = 12;
  const cache = new Map();

  function request(params) {
    return new Promise((resolve, reject) => {
      const callback =
        "cxProducts_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2);

      const query = new URLSearchParams({
        ...params,
        callback
      });

      const script = document.createElement("script");
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Product server timed out."));
      }, 15000);

      function cleanup() {
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
      }

      window[callback] = data => {
        cleanup();

        if (!data || !data.success) {
          reject(new Error(data?.error || "Unable to load products."));
          return;
        }

        resolve(data);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("Could not connect to product spreadsheet."));
      };

      script.src = API_URL + "?" + query.toString();
      document.head.appendChild(script);
    });
  }

  function number(value) {
    const result = Number(
      String(value || "").replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(result) ? result : 0;
  }

  function images(row) {
    return Object.entries(row)
      .filter(([key, value]) =>
        (
          key === "image_link" ||
          key.startsWith("additional_image") ||
          key.startsWith("image_url")
        ) &&
        /^https?:\/\//i.test(String(value || "").trim())
      )
      .sort((a, b) => {
        if (a[0] === "image_link") return -1;
        if (b[0] === "image_link") return 1;
        return a[0].localeCompare(b[0], undefined, {
          numeric: true
        });
      })
      .map(([, value]) => String(value).trim())
      .filter((url, index, all) => all.indexOf(url) === index)
      .slice(0, 9);
  }

  function mapProduct(row) {
    const sale = number(row.sale_price);
    const mrp = number(row.price);

    const gallery = images(row);

    const specs = {};

    Object.entries(row).forEach(([key, value]) => {
      if (key.startsWith("spec_") && value) {
        specs[key.replace(/^spec_/, "")] = value;
      }
    });

    return {
      ...row,

      id: String(row.id),
      title: row.title || "Untitled product",
      name: row.title || "Untitled product",

      brand: row.brand || "CLOTH X CLUB",

      price: sale > 0 ? sale : mrp,
      salePrice: sale > 0 ? sale : mrp,
      sale_price: sale > 0 ? sale : mrp,

      mrp: mrp > 0 ? mrp : (sale || 0),
      originalPrice: mrp > 0 ? mrp : (sale || 0),

      image: gallery[0] || "",
      images: gallery,
      additionalImages: gallery.slice(1),

      color: row.color || specs.colour || specs.color || "",
      colour: row.color || specs.colour || specs.color || "",

      size: row.size || specs.size || "",
      sizes: String(row.size || specs.size || "")
        .split(/[|,;]/)
        .map(value => value.trim())
        .filter(Boolean),

      specs,

      description: row.description || "",
      availability: row.availability || "in stock",

      link: "product.html?id=" + encodeURIComponent(row.id)
    };
  }

  async function getPage(offset = 0, limit = PAGE_SIZE) {
    const key = "page:" + offset + ":" + limit;

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await request({
      offset,
      limit
    });

    const data = {
      products: result.products.map(mapProduct),
      total: result.total,
      offset: result.offset,
      hasMore: result.hasMore
    };

    cache.set(key, data);

    return data;
  }

  async function getProduct(id) {
    const key = "product:" + id;

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await request({ id });

    const product = result.products.length
      ? mapProduct(result.products[0])
      : null;

    if (product) {
      cache.set(key, product);
    }

    return product;
  }

  async function getAllPages(options = {}) {
    const limit = Math.min(
      PAGE_SIZE,
      Math.max(1, Number(options.limit) || PAGE_SIZE)
    );

    const first = await getPage(0, limit);

    return first;
  }

  async function search(query, options = {}) {
    const term = String(query || "").trim().toLowerCase();

    if (!term) {
      return getPage(0, options.limit || PAGE_SIZE);
    }

    // Search only the pages requested by the caller.
    // This does not download the entire catalogue.
    const page = await getPage(
      options.offset || 0,
      options.limit || PAGE_SIZE
    );

    return {
      ...page,
      products: page.products.filter(product =>
        [
          product.title,
          product.brand,
          product.description,
          product.category
        ].join(" ").toLowerCase().includes(term)
      )
    };
  }

  window.CXProducts = {
    load: getAllPages,
    getPage,
    getProduct,
    search,
    mapProduct,
    pageSize: PAGE_SIZE,

    clearCache() {
      cache.clear();
    }
  };

})();
