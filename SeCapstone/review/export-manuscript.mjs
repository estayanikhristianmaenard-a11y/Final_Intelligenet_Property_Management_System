// Rebuild the local manuscript from the canonical chapter payload, without network access.
// Run build-manuscript-payload.py first. Uses the portal's existing Playwright installation.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../rentara-portal/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const base=new URL('./',import.meta.url);
const manuscript=process.argv.includes('--chapter-iv')?'MANUSCRIPT_I_IV':'MANUSCRIPT_I_III';
const payload=JSON.parse(await readFile(new URL(manuscript+'_PAYLOAD.json',base),'utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let body='';
for(const block of payload.blocks){
 if(block.type==='image'){
  const bytes=await readFile(block.path);
  body+=`<figure><img alt="Manuscript workflow figure" src="data:image/png;base64,${bytes.toString('base64')}"></figure>`;
 }else if(block.type==='table'){
  body+='<table><thead><tr>'+block.rows[0].map(c=>`<th>${escape(c)}</th>`).join('')+'</tr></thead><tbody>';
  body+=block.rows.slice(1).map(row=>'<tr>'+row.map(c=>`<td>${escape(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
 }else{
  const heading=block.style!=='NORMAL_TEXT';
  const tag=heading?'h'+(block.style==='TITLE'?1:Math.min(6,Number(block.style.slice(-1))+1)):'p';
  body+=`<${tag} class="${block.newPage?'chapter ':''}${block.style==='TITLE'?'title':''}">${escape(block.text)}</${tag}>`;
 }
}
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>${escape(payload.title)}</title><style>
@page{size:letter;margin:1in}*{box-sizing:border-box}body{font:12pt/2 Arial,sans-serif;color:#000;margin:0;text-align:justify}
p{margin:10pt 0;orphans:3;widows:3}h1,h2,h3,h4,h5,h6{font-size:12pt;line-height:2;margin:10pt 0;font-weight:bold;break-after:avoid}
.title{margin-top:0}.chapter{break-before:page}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:10pt 0;font:inherit}
th,td{border:0.7pt solid #000;vertical-align:top;padding:4pt;overflow-wrap:anywhere;text-align:justify}thead{display:table-header-group}
tr{break-inside:avoid}figure{margin:10pt 0;break-inside:avoid}figure img{display:block;max-width:100%;max-height:7.9in;width:auto;height:auto;margin:auto}
</style><body>${body}</body></html>`;
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
try{
 const page=await browser.newPage();
 await page.route('**/*',r=>r.request().url().startsWith('data:')?r.continue():r.abort());
 await page.setContent(html,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 const audit=await page.evaluate(()=>({font:getComputedStyle(document.body).fontFamily,fontSize:getComputedStyle(document.body).fontSize,lineHeight:getComputedStyle(document.body).lineHeight,alignment:getComputedStyle(document.body).textAlign,images:[...document.images].map(i=>({loaded:i.complete&&i.naturalWidth>0})),bullets:document.querySelectorAll('ul,ol').length}));
 if(audit.images.some(i=>!i.loaded)||audit.bullets)throw Error('Manuscript structure failed: '+JSON.stringify(audit));
 await page.pdf({path:fileURLToPath(new URL(manuscript+'_REVISED.pdf',base)),preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;text-align:center;font:10pt Arial"><span class="pageNumber"></span></div>'});
 console.log(JSON.stringify({output:'SeCapstone/review/'+manuscript+'_REVISED.pdf',...audit}));
}finally{await browser.close();}
