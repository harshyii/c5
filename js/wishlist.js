/* CLOTH X CLUB — persistent wishlist */
(() => {
  "use strict";
  const KEY = "clothxclub_wishlist";
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
  const write = items => { localStorage.setItem(KEY, JSON.stringify(items)); syncButtons(); render(); };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const price = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
  function toggle(id) {
    const items = read(), key = String(id);
    const index = items.findIndex(p => String(p.id) === key);
    if (index >= 0) items.splice(index, 1);
    else {
      const products = window.CXShopAPI?.getProducts?.() || window.CXProduct?.getProducts?.() || [];
      const p = products.find(x => String(x.id) === key);
      if (!p) return false;
      items.push({id:p.id,name:p.name,title:p.name,image:p.images?.[0] || "",images:p.images || [],price:p.price,mrp:p.mrp,category:p.category});
    }
    write(items);
    window.CXClub?.showToast(index >= 0 ? "Removed from wishlist" : "Added to wishlist");
    return true;
  }
  function syncButtons() {
    const ids = new Set(read().map(p => String(p.id)));
    document.querySelectorAll("[data-wishlist]").forEach(btn => {
      const active = ids.has(String(btn.dataset.productId || btn.dataset.id || ""));
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.innerHTML = active ? "♥" : "♡";
    });
  }
  function render() {
    const grid = document.querySelector("[data-wishlist-grid], #wishlist-grid");
    if (!grid) return;
    const items = read();
    if (!items.length) {
      grid.innerHTML = `<div class="shop-empty-state"><h3>Your wishlist is empty</h3><p>Save products you love and find them here.</p><a class="btn btn-primary" href="shop.html">Explore collection</a></div>`;
      return;
    }
    grid.innerHTML = items.map(p => `<article class="product-card">
      <div class="product-card-image-wrap"><a href="product.html?id=${encodeURIComponent(p.id)}" class="product-card-image-link">
      ${p.image ? `<img class="product-card-image" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="product-image-placeholder">CLOTH X CLUB</div>`}</a>
      <button type="button" class="product-wishlist-btn active" data-wishlist data-product-id="${esc(p.id)}" aria-pressed="true" aria-label="Remove ${esc(p.name)} from wishlist">♥</button></div>
      <div class="product-card-content"><div class="product-card-category">${esc(p.category)}</div><h3 class="product-card-title"><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
      <div class="product-card-prices"><span class="product-card-price">${price(p.price)}</span>${p.mrp>p.price?`<span class="product-card-mrp">${price(p.mrp)}</span>`:""}</div>
      <a class="product-card-action" href="product.html?id=${encodeURIComponent(p.id)}">View product</a></div></article>`).join("");
  }
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-wishlist]");
    if (!btn) return;
    e.preventDefault();
    toggle(btn.dataset.productId || btn.dataset.id);
  });
  document.addEventListener("DOMContentLoaded", () => { syncButtons(); render(); });
  window.CXWishlist = { get:read, toggle, render, syncButtons, clear:() => write([]) };
  if (document.readyState !== "loading") { syncButtons(); render(); }
})();