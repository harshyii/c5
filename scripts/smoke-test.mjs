import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), problems=[];
async function exists(p){try{await fs.access(path.join(root,p));return true}catch{return false}}
for(const p of ['index.html','shop.html','product.html','cart.html','checkout.html','blog.html','js/checkout.js','scripts/build.mjs','sitemap.xml','SEO_AUDIT.json']){
 if(!(await exists(p))) problems.push(`Missing expected file: ${p}`);
}
if(await exists('SEO_AUDIT.json')){
 try {
  const a=JSON.parse(await fs.readFile(path.join(root,'SEO_AUDIT.json'),'utf8'));
  console.log(`Audit snapshot: ${a.products??'n/a'} products, ${a.blogs??'n/a'} blogs, ${a.sitemapUrls??'n/a'} sitemap URLs`);
  if(a.issues?.length) problems.push(...a.issues.map(x=>'Build issue: '+x));
 }catch{problems.push('SEO_AUDIT.json is not valid JSON');}
}
if(await exists('sitemap.xml')){
 const s=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
 if(!s.includes('<urlset')) problems.push('sitemap.xml has no urlset');
 if(!s.includes('<loc>')) problems.push('sitemap.xml has no URLs (check API/build)');
}
if(await exists('data/blog-index.json')){
 try {const b=JSON.parse(await fs.readFile(path.join(root,'data/blog-index.json'),'utf8'));console.log(`Blog index: ${b.length} entries`)}
 catch{problems.push('data/blog-index.json invalid JSON')}
}
if(problems.length){console.error('\nSMOKE TEST FAILED\n'+problems.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('\nStatic smoke test passed. This does NOT test real payments, Apps Script permissions, or browser behavior.');
