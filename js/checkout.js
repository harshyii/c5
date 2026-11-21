/* CLOTH X CLUB UPI checkout. Configure Apps Script URL below. */
(()=>{"use strict";
const CFG={vpa:"9050623210@sbi",payee:"CLOTH X CLUB",api:"https://script.google.com/macros/s/AKfycbwUCeTp-u165Q57Vu8aIQU_Q3RNmWx7gQopacwQH4YAyyVfWR0W61gCPoNfawkhqmpo/exec"};
const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const items=()=>window.CXCart?.getCart?.()||[], totals=()=>window.CXCart?.getTotals?.()||{};
let order=null;
function amounts(){let t=totals(),sub=Number(t.subtotal??t.subTotal??0),ship=Number(t.delivery??t.deliveryCharge??t.shipping??0);return{sub,ship,total:Number(t.total??t.grandTotal??sub+ship)}}
function render(){let a=amounts(),list=items();$("#cx-order-items").innerHTML=list.length?list.map(x=>`<div class="checkout-line"><span>${esc(x.name)} × ${+x.quantity||1}${x.size?" · "+esc(x.size):""}${x.color?" · "+esc(x.color):""}</span><strong>${money((+x.price||0)*(+x.quantity||1))}</strong></div>`).join(""):"<p>Your bag is empty. <a href='shop.html'>Browse products</a>.</p>";$("#cx-subtotal").textContent=money(a.sub);$("#cx-delivery").textContent=money(a.ship);$("#cx-total").textContent=money(a.total);$("#cx-create-order").disabled=!list.length||a.total<=0}
async function send(payload){
 if(!CFG.api.startsWith("https://script.google.com/macros/s/")||!CFG.api.endsWith("/exec"))throw Error("Order sheet connection is not configured.");
 const body=new URLSearchParams();
 Object.entries(payload).forEach(([k,v])=>body.set(k,typeof v==="string"?v:JSON.stringify(v)));
 // Apps Script web apps commonly redirect; no-cors permits a simple form POST
 // while deliberately not exposing the private sheet response to the browser.
 await fetch(CFG.api,{method:"POST",mode:"no-cors",body,redirect:"follow"});
}
function orderRef(){return"CXC-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase()}
function uri(id,amt){return"upi://pay?"+new URLSearchParams({pa:CFG.vpa,pn:CFG.payee,am:amt.toFixed(2),cu:"INR",tn:"CLOTH X CLUB "+id})}
async function create(e){e.preventDefault();let form=$("#cx-checkout-form");if(!form.reportValidity())return;let a=amounts(),cart=items();if(!cart.length||a.total<=0)return;let id=orderRef(),payUri=uri(id,a.total),customer=Object.fromEntries(new FormData(form).entries()),btn=$("#cx-create-order");btn.disabled=true;btn.textContent="Creating order…";try{await send({action:"createOrder",orderId:id,createdAt:new Date().toISOString(),amount:a.total,subtotal:a.sub,delivery:a.ship,currency:"INR",customer,items:cart,status:"PAYMENT_PENDING"});order={id,amount:a.total};$("#cx-order-id").textContent=id;$("#cx-qr-amount").textContent=money(a.total);$("#cx-upi-qr").src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data="+encodeURIComponent(payUri);$("#cx-upi-app-link").href=payUri;$("#cx-payment-section").hidden=false;$("#cx-payment-section").scrollIntoView({behavior:"smooth"});$("#cx-checkout-status").textContent="Order reference created. Pay using the QR, then submit your UTR for verification."}catch(err){$("#cx-checkout-status").textContent=err.message;btn.disabled=false;btn.textContent="Create order & show payment QR"}}
async function proof(e){
 e.preventDefault();if(!order)return;
 let form=$("#cx-payment-proof-form");if(!form.reportValidity())return;
 let btn=form.querySelector("button");btn.disabled=true;
 try{
  await send({action:"paymentProof",orderId:order.id,utr:new FormData(form).get("utr"),submittedAt:new Date().toISOString()});
  $("#cx-proof-status").textContent="Your UTR has been submitted for verification.";
  // Clear only after the customer submits the payment reference.
  window.CXCart?.clear?.();
  $("#cx-payment-section").hidden=true;
  $("#cx-checkout-form").closest(".checkout-section").hidden=true;
  $("#cx-thankyou-order").textContent=order.id;
  $("#cx-thankyou").hidden=false;
  $("#cx-thankyou").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(err){
  $("#cx-proof-status").textContent="We could not submit your UTR. Please retry. "+err.message;
  btn.disabled=false;
 }
}

document.addEventListener("DOMContentLoaded",()=>{render();document.addEventListener("cx:cart-updated",render);$("#cx-checkout-form").addEventListener("submit",create);$("#cx-payment-proof-form").addEventListener("submit",proof)});
})();