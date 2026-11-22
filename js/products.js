
/* =========================================================
   CLOTH X CLUB — GOOGLE SHEETS PRODUCT LOADER
   Supports the new product sheet structure.
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    SHEET_CSV_URL:
      "https://docs.google.com/spreadsheets/d/1oGcBQyQ7BdEd_ullw9AjCYejmuXfhyKX1GqtMrGCeN4",

    CACHE_MS: 60 * 1000
  };

  let cache = null;
  let cacheTime = 0;
  let pending = null;

  /* ---------- BASIC HELPERS ---------- */

  function clean(value) {
    return String(value ?? "").trim();
  }

  function number(value) {
    const parsed = Number(
      String(value ?? "").replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(parsed) ? parsed : 0;
  }

  function first(record, names) {
    for (const name of names) {
      const value = clean(record[name.toLowerCase()]);
      if (value) return value;
    }

    return "";
  }

  function list(value) {
    return clean(value)
      .split(/[|,;]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  /* ---------- CSV PARSER ---------- */

  function csvToRows(csv) {
    const rows = [];

    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < csv.length; i++) {
      const ch = csv[i];
      const next = csv[i + 1];

      if (ch === '"' && quoted && next === '"') {
        cell += '"';
        i++;
      }

      else if (ch === '"') {
        quoted = !quoted;
      }

      else if (ch === "," && !quoted) {
        row.push(cell);
        cell = "";
      }

      else if (
        (ch === "\n" || ch === "\r") &&
        !quoted
      ) {
        if (ch === "\r" && next === "\n") {
          i++;
        }

        row.push(cell);

        if (row.some(value => clean(value) !== "")) {
          rows.push(row);
        }

        row = [];
        cell = "";
      }

      else {
        cell += ch;
      }
    }

    row.push(cell);

    if (row.some(value => clean(value) !== "")) {
      rows.push(row);
    }

    return rows;
  }

  function parseCSV(csv) {
    const rows = csvToRows(csv);

    if (rows.length < 2) return [];

    const headers = rows[0].map(header =>
      clean(header)
        .replace(/^\uFEFF/, "")
        .toLowerCase()
    );

    return rows.slice(1).map(values => {
      const record = {};

      headers.forEach((header, index) => {
        if (header) {
          record[header] = values[index] ?? "";
        }
      });

      return record;
    });
  }

  /* ---------- PRODUCT IMAGES ---------- */

  function imageList(record) {
    const candidates = [
      record.image_link,

      record.additional_image_link_1,
      record.additional_image_link_2,
      record.additional_image_link_3,
      record.additional_image_link_4,
      record.additional_image_link_5,
      record.additional_image_link_6,

      record.image_url_7,
      record.image_url_8
    ];

    const seen = new Set();

    return candidates
      .map(clean)

      .filter(url =>
        /^https?:\/\//i.test(url)
      )

      .filter(url => {
        if (seen.has(url)) return false;

        seen.add(url);
        return true;
      })

      .slice(0, 9);
  }

  /* ---------- MAP SHEET ROW TO PRODUCT ---------- */

  function mapProduct(record) {
    const id = first(record, ["id"]);

    const title = first(record, ["title"]);

    const salePrice = number(
      first(record, ["sale_price"])
    );

    const listedPrice = number(
      first(record, ["price"])
    );

    const price =
      salePrice > 0
        ? salePrice
        : listedPrice;

    const mrp =
      listedPrice > 0
        ? listedPrice
        : price;

    const images = imageList(record);

    /* Product specifications */

    const colour = first(record, [
      "spec_colour",
      "spec_color",
      "spec_accent color"
    ]);

    const size = first(record, [
      "spec_size"
    ]);

    const fit = first(record, [
      "spec_fitting type",
      "spec_fit type"
    ]);

    const pattern = first(record, [
      "spec_pattern"
    ]);

    const material = first(record, [
      "spec_material type",
      "spec_material",
      "spec_fabric type",
      "spec_materialtype"
    ]);

    const style = first(record, [
      "spec_style name",
      "spec_stylename",
      "spec_style",
      "spec_design name"
    ]);

    const category = first(record, [
      "category",
      "product_type",
      "google_product_category",
      "spec_item type name"
    ]);

    const highlights = [
      style,
      fit,
      material,
      pattern
    ].filter(Boolean);

    const rating = number(
      first(record, ["rating"])
    );

    /* ---------- FINAL PRODUCT OBJECT ---------- */

    return {
      id: id,

      title: title || "Untitled product",
      name: title || "Untitled product",

      brand:
        first(record, [
          "brand",
          "spec_brand",
          "spec_brand name"
        ]) || "CLOTH X CLUB",

      description: first(record, [
        "description"
      ]),

      /* Pricing */

      price: price,
      salePrice: salePrice || price,
      sale_price: salePrice || price,

      mrp: mrp,
      originalPrice: mrp,
      compareAtPrice: mrp,

      /* Rating */

      rating: rating || null,

      /* Product URL */

      productUrl: first(record, [
        "product_url"
      ]),

      link:
        "product.html?id=" +
        encodeURIComponent(id),

      /* Images */

      image: images[0] || "",
      image_link: images[0] || "",

      images: images,
      additionalImages: images.slice(1),

      /* Product details */

      category: category || style || "Clothing",

      color: colour,
      colour: colour,

      colors: colour ? [colour] : [],

      size: size,
      sizes: list(size),

      fit: fit,
      material: material,
      pattern: pattern,
      style: style,

      highlights: highlights,

      /* Availability */

      available: true,
      availability: "in stock",

      stock: 1,
      quantity: 1,

      /* Preserve every original sheet column */

      raw: record
    };
  }

  /* ---------- LOAD PRODUCTS ---------- */

  async function load(options = {}) {
    const force = Boolean(options.force);

    if (
      !force &&
      cache &&
      Date.now() - cacheTime < CONFIG.CACHE_MS
    ) {
      return cache.slice();
    }

    if (!force && pending) {
      return pending;
    }

    pending = fetch(CONFIG.SHEET_CSV_URL, {
      method: "GET",
      cache: "no-store",

      headers: {
        "Accept": "text/csv,text/plain,*/*"
      }
    })

      .then(response => {
        if (!response.ok) {
          throw new Error(
            `Google Sheet request failed (${response.status})`
          );
        }

        return response.text();
      })

      .then(csv => {
        if (
          /^\s*<!doctype html|^\s*<html/i.test(csv)
        ) {
          throw new Error(
            "Google Sheet returned HTML. Check sheet sharing and publishing access."
          );
        }

        const products = parseCSV(csv)
          .map(mapProduct)

          .filter(product =>
            product.id &&
            product.title &&
            product.price > 0
          );

        if (!products.length) {
          throw new Error(
            "No valid products found. Check id, title and price columns."
          );
        }

        cache = products;
        cacheTime = Date.now();

        return products.slice();
      })

      .finally(() => {
        pending = null;
      });

    return pending;
  }

  /* ---------- PUBLIC API ---------- */

  window.CXProducts = {
    load,

    clearCache() {
      cache = null;
      cacheTime = 0;
      pending = null;
    },

    mapProduct,

    config: {
      ...CONFIG
    }
  };

})();
