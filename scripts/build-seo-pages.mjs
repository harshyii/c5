import fs from "node:fs/promises";
import path from "node:path";

const API = "https://script.google.com/macros/s/AKfycbwedB2j2FwFYJoDQzjowsxCLmnIYf_jjLCwNkvZeBYjrUhX4Wks9c1r4_Rg9TuDj-9G/exec";
const BASE = "https://harshyii.github.io/c5/";
const PAGE_SIZE = 24;
const ROOT = process.cwd();

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const slug = value => String(value || "item").toLowerCase()
  .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70) || "item";
const money = value => {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g,""));
  return Number.isFinite(n) ? `₹${Math.round(n).toLocaleString("en-IN")}` : "";
};
const imagesOf = p => Object.entries(p)
  .filter(([k,v]) => (k === "image_link" || /^additional_image/.test(k) || /^image_url/.test(k)) && /^https?:\/\//i.test(String(v || "")))
  .sort((a,b) => a[0] === "image_link" ? -1 : b[0] === "image_link" ? 1 : a[0].localeCompare(b[0],undefined,{numeric:true}))
  .map(([,v]) => String(v).trim()).filter((v,i,a) => a.indexOf(v) === i).slice(0,6);

async function getProducts() {
  const all = [];
  for (let offset=0; ; offset+=PAGE_SIZE) {
    const url = `${API}?offset=${offset}&limit=${PAGE_SIZE}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Product API HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Product API error");
    all.push(...(data.products || []));
    if (!data.hasMore || !(data.products || []).length) break;
  }
  return all;
}
function pageShell({title,description,canonical,body,schema}) {
  return `<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111"><meta name="robots" content="index,follow,max-image-preview:large">
<title>${esc(title)}</title><meta name="description" content="${esc(description.slice(0,300))}">
<link rel="canonical" href="${esc(canonical)}"><meta property="og:site_name" content="CLOTH X CLUB"><meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description.slice(0,300))}">
<link rel="stylesheet" href="../../css/style.css"><link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,"\\u003c")}</script></head>
<body><div class="announcement-bar">FREE DELIVERY ON ELIGIBLE ORDERS ABOVE ₹1,499 · INDIA</div>
<header class="site-header"><div class="header-container"><a class="brand-logo" href="${BASE}">CLOTH<span>X</span>CLUB</a><nav class="main-nav"><a href="${BASE}">Home</a><a href="${BASE}shop.html">Shop</a><a href="${BASE}blog.html">Journal</a><a href="${BASE}info.html">About</a></nav><div class="header-actions"><a class="icon-btn" href="${BASE}cart.html">Bag</a></div></div></header>
<main class="section" style="max-width:1440px;margin:auto;padding:48px clamp(18px,4vw,64px)">${body}</main>
<footer class="site-footer"><div class="footer-bottom">© ${new Date().getFullYear()} CLOTH X CLUB. All rights reserved.</div></footer></body></html>`;
}
function productPage(p) {
  const id=String(p.id), title=String(p.title||"CLOTH X CLUB product"), imgs=imagesOf(p);
  const sale=Number(String(p.sale_price||"").replace(/[^\d.-]/g,""))||Number(String(p.price||"").replace(/[^\d.-]/g,""))||0;
  const mrp=Number(String(p.price||"").replace(/[^\d.-]/g,""))||sale;
  const urlSlug=`${slug(title)}-${slug(id)}`, canonical=`${BASE}products/${urlSlug}/`;
  const desc=String(p.description||`Shop ${title} from CLOTH X CLUB. View product images, pricing and available details.`);
  const img=imgs[0]||"";
  const body=`<nav aria-label="Breadcrumb"><a href="${BASE}">Home</a> / <a href="${BASE}shop.html">Shop</a> / ${esc(title)}</nav>
<div class="product-detail-layout" data-product-page style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:clamp(24px,5vw,72px);margin-top:30px">
<div class="product-detail-gallery"><div class="product-thumbnails" data-product-thumbnails></div><div class="product-main-image" data-product-gallery>${imgs.map((u,i)=>`<figure class="product-gallery-item"><img src="${esc(u)}" alt="${esc(title)} image ${i+1}"></figure>`).join("")}</div></div>
<div class="product-information"><p class="eyebrow">${esc(p.brand||"CLOTH X CLUB")}</p><h1 data-product-title>${esc(title)}</h1><div class="product-price-row"><strong class="product-price" data-product-price>${money(sale)}</strong><del class="product-mrp" data-product-mrp>${mrp>sale?money(mrp):""}</del></div><p data-product-stock>Product availability subject to confirmation.</p><div class="product-option"><div class="product-option-label">Choose size</div><div class="option-pills" data-product-sizes></div></div><div class="product-option"><div class="product-option-label">Choose colour</div><div class="option-pills" data-product-colors></div></div><div class="quantity-control"><button type="button" data-product-quantity-minus>−</button><input data-product-quantity-value type="number" min="1" value="1"><button type="button" data-product-quantity-plus>+</button></div><div class="product-actions"><button class="btn" id="add-to-cart" type="button">Add to bag</button><button class="btn btn-outline-dark" data-buy-now type="button">Buy now</button></div><div class="product-description" data-product-description>${esc(desc)}</div><p>Free delivery on eligible orders above ₹1,499. Please review our <a href="${BASE}shipping.html">shipping policy</a> and <a href="${BASE}returns.html">returns policy</a>.</p></div></div>
<section class="section"><h2>Product details</h2><p>${esc(desc)}</p><p>Brand: ${esc(p.brand||"CLOTH X CLUB")}</p><p>Condition: ${esc(p.condition||"New")}</p></section>
<script>window.CX_PRODUCT_ID=${JSON.stringify(id)};</script><script src="../../js/products.js"></script><script src="../../js/cart.js"></script><script src="../../js/product.js"></script>`;
  const schema={"@context":"https://schema.org","@type":"Product","name":title,"description":desc,"image":imgs,"sku":id,"brand":{"@type":"Brand","name":p.brand||"CLOTH X CLUB"},"offers":{"@type":"Offer","url":canonical,"priceCurrency":"INR","price":sale.toFixed(2),"availability":/out of stock|unavailable/i.test(p.availability||"")?"https://schema.org/OutOfStock":"https://schema.org/InStock","itemCondition":"https://schema.org/NewCondition"}};
  return {slug:urlSlug,canonical,html:pageShell({title:`${title} | CLOTH X CLUB`,description:desc,canonical,body,schema})};
}
function contentHtml(value) {
  if (Array.isArray(value)) return value.map(contentHtml).join("");
  if (value && typeof value==="object") {
    if (value.heading) return `<h2>${esc(value.heading)}</h2>`;
    return contentHtml(value.body??value.text??value.content??value.paragraph??value.description??"");
  }
  const t=String(value??"").trim(); return t?`<p>${esc(t)}</p>`:"";
}
function blogPage(post) {
  const slugValue=slug(post.slug||post.title),canonical=`${BASE}journal/${slugValue}/`;
  const title=String(post.title||"CLOTH X CLUB Journal");
  const image=String(post.image||post.image1||"");
  const content=post.content||[post.content2,post.content3,post.content4].filter(Boolean);
  const body=`<nav aria-label="Breadcrumb"><a href="${BASE}">Home</a> / <a href="${BASE}blog.html">Journal</a> / ${esc(title)}</nav><article class="article-layout" style="max-width:900px;margin:30px auto"><p class="eyebrow">${esc(post.category||"Journal")} · ${esc(post.date||"")}</p><h1>${esc(title)}</h1><p class="article-intro">${esc(post.excerpt||"")}</p>${image?`<img src="${esc(image.startsWith("http")?image:BASE+image)}" alt="${esc(title)}" style="width:100%;max-height:620px;object-fit:cover;margin:28px 0">`:""}<div class="article-body">${contentHtml(content)}</div><p><a class="btn" href="${BASE}blog.html">More journal stories</a></p></article>`;
  const schema={"@context":"https://schema.org","@type":"BlogPosting","headline":title,"description":post.excerpt||"","image":image?(image.startsWith("http")?image:BASE+image):undefined,"datePublished":post.date||undefined,"dateModified":post.updatedAt||post.date||undefined,"author":{"@type":"Organization","name":"CLOTH X CLUB"},"publisher":{"@type":"Organization","name":"CLOTH X CLUB"},"mainEntityOfPage":canonical};
  return {slug:slugValue,canonical,html:pageShell({title:`${title} | CLOTH X CLUB Journal`,description:post.excerpt||title,canonical,body,schema})};
}
await fs.mkdir(path.join(ROOT,"products"),{recursive:true});
await fs.mkdir(path.join(ROOT,"journal"),{recursive:true});
const urls=new Map();
const products=await getProducts();
for (const p of products) {
  if (!p.id||!p.title) continue;
  const out=productPage(p),dir=path.join(ROOT,"products",out.slug);
  await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,"index.html"),out.html);
  urls.set(out.canonical,p.updated_at||new Date().toISOString().slice(0,10));
}
const postsPath=path.join(ROOT,"Layout/data/posts.json");
let posts=[];
try { posts=JSON.parse(await fs.readFile(postsPath,"utf8")); } catch {}
for (const post of posts.filter(p=>p&&p.status==="published"&&p.published!==false)) {
  const out=blogPage(post),dir=path.join(ROOT,"journal",out.slug);
  await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,"index.html"),out.html);
  urls.set(out.canonical,post.updatedAt||post.date||new Date().toISOString().slice(0,10));
}
for (const file of ["index.html","shop.html","blog.html","info.html","shipping.html","returns.html","privacy.html","terms.html"]) {
  urls.set(BASE+file,new Date().toISOString().slice(0,10));
}
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map(([loc,lastmod])=>`<url><loc>${esc(loc)}</loc><lastmod>${esc(lastmod)}</lastmod></url>`).join("\n")}\n</urlset>`;
await fs.writeFile(path.join(ROOT,"sitemap.xml"),xml);
await fs.writeFile(path.join(ROOT,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log(`Generated ${products.length} product records; ${posts.length} blog records; ${urls.size} sitemap URLs.`);
