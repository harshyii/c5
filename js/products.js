/* CLOTH X CLUB — Shared Google Sheets product loader */
(() => {
  "use strict";

  const CONFIG = {
    spreadsheetId: "1ipbhvrFIaOGAj-Z46Tkm9qJY_b476cYoG4sXQRuQ9yY",
    // Change this if your product data is on another worksheet tab.
    gid: "0",
    // Optional: paste a published CSV URL here. If empty, the public GViz CSV endpoint is used.
    publishedCsvUrl: "",
    fallbackJson: "Layout/data/products.json",
    cacheKey: "cx_products_cache_v1",
    cacheMinutes: 5
  };

  const money = value => {
    if (typeof value === "number") return value;
    const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };
  const truthy = value => /^(true|yes|1|in stock|available)$/i.test(String(value ?? "").trim());
  const splitList = value => {
    if (Array.isArray(value)) return value;
    return String(value ?? "").split(/[|;\n]+/).map(x => x.trim()).filter(Boolean);
  };
  const imageList = value => {
    if (Array.isArray(value)) return value;
    // URLs in the sheet should not contain commas. Comma, semicolon, pipe and line break delimit images.
    return String(value ?? "").split(/[,;|\n]+/).map(x => x.trim()).filter(x => /^https?:\/\//i.test(x));
  };
  const csvToRows = csv => {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < csv.length; i++) {
      const c = csv[i], next = csv[i + 1];
      if (c === '"' && quoted && next === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = !quoted;
      else if (c === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && next === "\n") i++;
        row.push(cell); cell = "";
        if (row.some(v => v.trim() !== "")) rows.push(row);
        row = [];
      } else cell += c;
    }
    row.push(cell);
    if (row.some(v => v.trim() !== "")) rows.push(row);
    if (!rows.length) return [];
    const headers = rows.shift().map(h => h.trim().toLowerCase().replace(/^\uFEFF/, ""));
    return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
  };

  function normalize(row = {}, index = 0) {
    const id = String(row.id || row.store_code || `product-${index + 1}`).trim();
    const title = String(row.title || row.name || "Untitled product").trim();
    const mrp = money(row.price ?? row.mrp);
    const sale = money(row.sale_price);
    const price = sale > 0 ? sale : mrp;
    const images = [
      ...imageList(row.image_link || row.image),
      ...imageList(row.additional_image_link || row.additional_images)
    ].filter((url, i, all) => all.indexOf(url) === i).slice(0, 6);
    const qtyRaw = row.quantity ?? row.stock ?? "";
    const quantity = qtyRaw === "" ? null : Math.max(0, Math.floor(money(qtyRaw)));
    const availabilityText = String(row.availability ?? "").toLowerCase();
    const available = availabilityText
      ? !/out of stock|out_of_stock|discontinued|not available|unavailable/.test(availabilityText) && truthy(availabilityText)
      : quantity === null || quantity > 0;

    // Add a "category" column to the sheet for reliable category filtering.
    const category = String(row.category || row.product_type || row.product_highlight || "Other").trim();
    const sizes = splitList(row.size || row.sizes);
    const colors = splitList(row.color || row.colors);

    return {
      ...row,
      id,
      productId: id,
      name: title,
      title,
      slug: String(row.link || id).split("?")[0].split("/").filter(Boolean).pop() || id,
      category,
      description: String(row.description || ""),
      mrp,
      price,
      offerPrice: price,
      images,
      image: images[0] || "",
      sizes,
      colors,
      stock: quantity,
      quantity,
      available,
      brand: row.brand || "CLOTH X CLUB",
      link: row.link || `product.html?id=${encodeURIComponent(id)}`,
      condition: row.condition || "new"
    };
  }

  async function fetchCSV() {
    const url = CONFIG.publishedCsvUrl.trim() ||
      `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(CONFIG.gid)}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Google Sheet returned ${response.status}`);
    const csv = await response.text();
    if (!csv || !csv.includes(",")) throw new Error("The sheet returned empty or invalid CSV data.");
    return csvToRows(csv).map(normalize).filter(p => p.id && p.name && p.price >= 0);
  }

  async function load(options = {}) {
    if (!options.force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CONFIG.cacheKey) || "null");
        if (cached && Date.now() - cached.savedAt < CONFIG.cacheMinutes * 60000 && Array.isArray(cached.products)) {
          return cached.products;
        }
      } catch (_) {}
    }

    try {
      const products = await fetchCSV();
      if (!products.length) throw new Error("No usable products found in the Google Sheet.");
      try { localStorage.setItem(CONFIG.cacheKey, JSON.stringify({ savedAt: Date.now(), products })); } catch (_) {}
      return products;
    } catch (error) {
      console.error("CLOTH X CLUB: Google Sheets product fetch failed.", error);
      // Keep the store usable during a temporary Sheets outage.
      try {
        const response = await fetch(CONFIG.fallbackJson);
        if (response.ok) {
          const data = await response.json();
          const rows = Array.isArray(data) ? data : (data.products || data.items || []);
          if (rows.length) return rows.map(normalize);
        }
      } catch (_) {}
      throw error;
    }
  }

  window.CXProducts = { config: CONFIG, load, normalize, parseCSV: csvToRows, formatMoney: money };
})();