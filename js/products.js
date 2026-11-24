/* CLOTH X CLUB — paginated Google Sheets product API */
(()=>{"use strict";
const API_URL="https://script.google.com/macros/s/AKfycbwedB2j2FwFYJoDQzjowsxCLmnIYf_jjLCwNkvZeBYjrUhX4Wks9c1r4_Rg9TuDj-9G/exec";
const PAGE_SIZE=12, cache=new Map();
const money=v=>{const n=Number(String(v??"").replace(/[^\d.-]/g,""));return Number.isFinite(n)?n:0};
function parseImages(row){
 const keys=Object.keys(row);
 const ordered=keys.filter(k=>k==="image_link"||/^additional_image/.test(k)||/^image_url/.test(k))
 .sort((a,b)=>a==="image_link"?-1:b==="image_link"?1:a.localeCompare(b,undefined,{numeric:true}));
 return [...new Set(ordered.map(k=>String(row[k]||"").trim()).filter(u=>/^https?:\/\//i.test(u)))].slice(0,6);
}
function normalize(row){
 const mrp=money(row.price),sale=money(row.sale_price),imgs=parseImages(row);
 const specs={};Object.entries(row).forEach(([k,v])=>{if(k.startsWith("spec_")&&v)specs[k.slice(5)]=v});
 const size=String(row.size||specs.Size||specs.size||"").trim();
 const color=String(row.color||specs.Colour||specs.Color||specs.colour||"").trim();
 const qty=row.quantity===""||row.quantity==null?null:Math.max(0,Math.floor(money(row.quantity)));
 const av=String(row.availability||"").toLowerCase();
 return {...row,id:String(row.id||""),title:String(row.title||"Product"),name:String(row.title||"Product"),
 price:sale>0?sale:mrp,mrp:mrp>0?mrp:(sale||0),salePrice:sale>0?sale:mrp,
 image:imgs[0]||"",images:imgs,additionalImages:imgs.slice(1),specs,
 size,color,sizes:size?size.split(/[|,;]/).map(x=>x.trim()).filter(Boolean):[],
 colors:color?color.split(/[|,;]/).map(x=>x.trim()).filter(Boolean):[],
 category:row.category||row.product_type||row.product_highlight||"Clothing",
 brand:row.brand||"CLOTH X CLUB",quantity:qty,stock:qty,
 available:av?/out of stock|out_of_stock|unavailable|discontinued/.test(av)===false:qty===null||qty>0,
 link:"product.html?id="+encodeURIComponent(row.id)};
}
function request(params){
 return new Promise((resolve,reject)=>{
  if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(API_URL)){reject(Error("Product API URL is not configured in js/products.js."));return}
  const cb="cxp_"+Date.now()+"_"+Math.random().toString(36).slice(2),script=document.createElement("script"),q=new URLSearchParams({...params,callback:cb});
  const timer=setTimeout(()=>{cleanup();reject(Error("Product service timed out."))},15000);
  function cleanup(){clearTimeout(timer);delete window[cb];script.remove()}
  window[cb]=data=>{cleanup();if(!data?.success){reject(Error(data?.error||"Product request failed."));return}resolve(data)};
  script.onerror=()=>{cleanup();reject(Error("Could not connect to product service."))};
  script.src=API_URL+"?"+q;document.head.appendChild(script);
 });
}
async function getPage(offset=0,limit=PAGE_SIZE){
 const key=`p:${offset}:${limit}`;if(cache.has(key))return cache.get(key);
 const data=await request({offset,limit});
 const result={products:(data.products||[]).map(normalize).filter(p=>p.id&&p.title),total:data.total||0,offset:data.offset||0,limit:data.limit||limit,hasMore:!!data.hasMore};
 cache.set(key,result);return result;
}
async function getProduct(id){
 const key="id:"+id;if(cache.has(key))return cache.get(key);
 const data=await request({id:String(id)}),p=data.products?.[0]?normalize(data.products[0]):null;
 if(p)cache.set(key,p);return p;
}
window.CXProducts={pageSize:PAGE_SIZE,getPage,getProduct,load:async()=>((await getPage(0,PAGE_SIZE)).products),clearCache:()=>cache.clear()};
})();