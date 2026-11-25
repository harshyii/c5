/* CLOTH X CLUB — dynamic Google Sheets catalogue adapter
   Product data is fetched from the published Apps Script endpoint.
   Do not put payment secrets in this file. */
(()=>{"use strict";
const API_URL="https://script.google.com/macros/s/AKfycbzoYg39Jxdy9l9D6CXnsAS-pV4BoYthhLTdIYpNhQb0qpoeBFh3h8gXS2j9a3t1Qw9Y/exec";
const PAGE_SIZE=12, TTL=3*60*1000, cache=new Map();
const money=v=>{const n=Number(String(v??"").replace(/[^\d.-]/g,""));return Number.isFinite(n)?n:0};
const text=v=>String(v??"").trim();
function parseImages(row){
 const keys=Object.keys(row||{}),ordered=keys.filter(k=>/^(image_link|image_url|additional_image|image\d)/i.test(k)).sort((a,b)=>a==="image_link"?-1:b==="image_link"?1:a.localeCompare(b,undefined,{numeric:true}));
 const candidates=[row.image_link,row.image_url,row.image,row.images,...ordered.map(k=>row[k])];
 return [...new Set(candidates.flatMap(v=>String(v||"").split(/[|,\n]/)).map(u=>u.trim()).filter(u=>/^https?:\/\//i.test(u)))].slice(0,12);
}
function normalize(row){
 row=row||{};const mrp=money(row.price),sale=money(row.sale_price),imgs=parseImages(row),specs={};
 Object.entries(row).forEach(([k,v])=>{if(/^spec_/i.test(k)&&v)specs[k.slice(5)]=v});
 const size=text(row.size||specs.Size||specs.size),color=text(row.color||specs.Colour||specs.Color||specs.colour);
 const qty=row.quantity===""||row.quantity==null?null:Math.max(0,Math.floor(money(row.quantity))),av=text(row.availability).toLowerCase();
 const explicitlyOut=/out of stock|out_of_stock|unavailable|discontinued/.test(av), explicitlyIn=/in stock|in_stock|available/.test(av);
 return {...row,id:text(row.id||row.sku),title:text(row.title||row.name||"Product"),name:text(row.title||row.name||"Product"),
 price:sale>0?sale:mrp,mrp:mrp>0?mrp:(sale||0),salePrice:sale>0?sale:mrp,image:imgs[0]||text(row.image_link),images:imgs,additionalImages:imgs.slice(1),specs,
 size,color,sizes:size.split(/[|,;]/).map(x=>x.trim()).filter(Boolean),colors:color.split(/[|,;]/).map(x=>x.trim()).filter(Boolean),
 category:text(row.category||row.product_type||row.product_highlight||"Clothing"),brand:text(row.brand||"CLOTH X CLUB"),quantity:qty,stock:qty,
 available:explicitlyOut?false:explicitlyIn?true:qty===null||qty>0,
 link:"product.html?id="+encodeURIComponent(text(row.id||row.sku))};
}
function request(params){return new Promise((resolve,reject)=>{
 if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(API_URL)){reject(Error("Product API URL is not configured."));return}
 const cb="cxp_"+Date.now()+"_"+Math.random().toString(36).slice(2),script=document.createElement("script"),q=new URLSearchParams({...params,callback:cb});
 const timer=setTimeout(()=>{cleanup();reject(Error("Product service timed out."))},18000);
 function cleanup(){clearTimeout(timer);delete window[cb];script.remove()}
 window[cb]=data=>{cleanup();if(!data?.success){reject(Error(data?.error||"Product request failed."));return}resolve(data)};
 script.onerror=()=>{cleanup();reject(Error("Could not connect to product service."))};script.src=API_URL+"?"+q;document.head.appendChild(script);
 });}
async function getPage(offset=0,limit=PAGE_SIZE){offset=Math.max(0,Number(offset)||0);limit=Math.max(1,Math.min(48,Number(limit)||PAGE_SIZE));const key=`p:${offset}:${limit}`,cached=cache.get(key);if(cached&&Date.now()-cached.time<TTL)return cached.data;
 const data=await request({offset,limit}),result={products:(data.products||[]).map(normalize).filter(p=>p.id&&p.title),total:Number(data.total)||0,offset:Number(data.offset)||offset,limit:Number(data.limit)||limit,hasMore:!!data.hasMore};cache.set(key,{time:Date.now(),data:result});return result;}
async function getProduct(id){id=text(id);if(!id)return null;const key="id:"+id,cached=cache.get(key);if(cached&&Date.now()-cached.time<TTL)return cached.data;const data=await request({id}),p=data.products?.[0]?normalize(data.products[0]):null;if(p)cache.set(key,{time:Date.now(),data:p});return p;}
async function getAll({maxPages=1000,pageSize=48}={}){let offset=0,items=[];for(let i=0;i<maxPages;i++){const page=await getPage(offset,pageSize);items.push(...page.products);if(!page.hasMore||!page.products.length)break;offset+=page.products.length;}return items;}
window.CXProducts={pageSize:PAGE_SIZE,getPage,getProduct,getAll,load:async()=>((await getPage(0,PAGE_SIZE)).products),clearCache:()=>cache.clear(),apiUrl:API_URL};
})();