// Fresh, visibly synthetic variants of the already-anonymized first-page SOA layout.
// No original private SOA, working database mutation, Gmail connection or sending.
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {getDocument,Util} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {scannedUtilityPdf,utilityEmail} from '../tests/fixtures.js';
import {setupGroupDemo} from '../server/group-demo-setup.js';
import {Store} from '../server/store.js';
import {Service} from '../server/service.js';
import {Integrations} from '../server/integrations.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'../reports/testing/assets');await mkdir(out,{recursive:true});
const source=join(root,'docs/samples/utility-bills/anonymized/meralco-001/bill-digital.pdf');
const original=await readFile(source),hash=createHash('sha256').update(original).digest('hex');
const cases=[
 {id:'S01',unit:'A',account:'9990000001',amount:2400.50,start:'2027-02-01',end:'2027-02-28',due:'2027-03-08',periodLabel:'01 Feb 2027 to 28 Feb 2027',billLabel:'28 Feb 2027',nextLabel:'31 Mar 2027',dueLabel:'08 Mar 2027',file:'s01-unit-a-soa-layout-scan.pdf',shares:[1200.25,1200.25]},
 {id:'S02',unit:'B',account:'9990000002',amount:1875.75,start:'2027-03-01',end:'2027-03-31',due:'2027-04-08',periodLabel:'01 Mar 2027 to 31 Mar 2027',billLabel:'31 Mar 2027',nextLabel:'30 Apr 2027',dueLabel:'08 Apr 2027',file:'s02-unit-b-soa-layout-scan.pdf',shares:[1875.75]},
];
const task=getDocument({data:new Uint8Array(original),useSystemFonts:true,isEvalSupported:false,
 wasmUrl:fileURLToPath(new URL('../node_modules/pdfjs-dist/wasm/',import.meta.url)).replaceAll('\\','/'),
 standardFontDataUrl:fileURLToPath(new URL('../node_modules/pdfjs-dist/standard_fonts/',import.meta.url)).replaceAll('\\','/')});
const pdf=await task.promise;
const money=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
try{
 const page=await pdf.getPage(1),content=await page.getTextContent(),viewport=page.getViewport({scale:3});
 const rows=content.items.filter(i=>i.str&&i.transform[4]>520&&i.transform[5]>420&&i.transform[5]<540&&/^\d[\d,.]*$/.test(i.str));
 assert.equal(rows.length,11,'All summary charge lines must be identified before editing');
 const weights=rows.map(i=>Math.round(Number(i.str.replaceAll(',',''))*100));assert.equal(weights.reduce((a,b)=>a+b,0),156717);
 for(const c of cases){
  const target=pdf.canvasFactory.create(Math.ceil(viewport.width),Math.ceil(viewport.height));
  try{
   await page.render({canvasContext:target.context,viewport}).promise;
   const ctx=target.context;
   const point=(x,y)=>{const t=viewport.transform;return [t[0]*x+t[2]*y+t[4],t[1]*x+t[3]*y+t[5]];};
   const cover=(x0,y0,x1,y1)=>{const a=point(x0,y0),b=point(x1,y1);ctx.fillStyle='white';ctx.fillRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));};
   const draw=(text,x,y,size,maxWidth,align='left')=>{ctx.fillStyle='black';ctx.textAlign=align;ctx.font=`${size*3}px Arial`;const fit=Math.min(1,maxWidth*3/ctx.measureText(text).width);ctx.font=`${size*3*fit}px Arial`;const p=point(x,y);ctx.fillText(text,p[0],p[1]);ctx.textAlign='left';};
   let cans=0,dates=0;
   for(const item of content.items){
    let text=item.str;
    if(!text?.trim())continue;
    if(text.includes('9990000001')){text=text.replaceAll('9990000001',c.account);cans++;}
    else if(text==='27 Aug 2026 to 26 Sep 2026'){text=c.periodLabel;dates++;}
    else if(text==='08 Oct 2026'){text=c.dueLabel;dates++;}
    else if(text==='26 Sep 2026'){text=c.billLabel;dates++;}
    else if(text==='26 Oct 2026'){text=c.nextLabel;dates++;}
    else if(text==='Page 1 of 2')text='Demo 1 of 1';
    else continue;
    const t=Util.transform(viewport.transform,item.transform),h=Math.hypot(t[2],t[3]);
    ctx.fillStyle='white';ctx.fillRect(t[4]-3,t[5]-h-3,item.width*3+6,h*1.35+6);
    draw(text,item.transform[4],item.transform[5],h/3,item.width+1);
   }
   assert.equal(cans,2);assert.equal(dates,5);
   cover(310,620,565,655);draw('PHP '+money(c.amount),313,628,24,240);
   cover(495,370,565,390);draw('PHP '+money(c.amount),560,376,12,70,'right');
   cover(520,544,565,560);draw(money(c.amount),560,548.4,9,45,'right');
   const total=Math.round(c.amount*100),scaled=weights.map(n=>Math.floor(n*total/156717));
   const order=weights.map((n,i)=>({i,fraction:(n*total)%156717})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i);
   for(let n=total-scaled.reduce((a,b)=>a+b,0),j=0;n>0;n--,j++)scaled[order[j].i]++;
   assert.equal(scaled.reduce((a,b)=>a+b,0),total);
   rows.forEach((row,i)=>{const y=row.transform[5];cover(520,y-2,564,y+10);draw(money(scaled[i]/100),560,y,9,45,'right');});
   // Historical consumption graphics are illustrative, not recalculated provider tariffs.
   cover(33,558,180,600);draw('Illustrative test figures',36,585,9,145);draw('Not a tariff calculation',36,570,8,145);
   cover(30,14,580,40);draw('SYNTHETIC VARIANT - DO NOT PAY - account, dates and amounts are invented',36,25,8,530);
   cover(30,765,280,830);draw('DEMO TENANT - UNIT '+c.unit,36,808,10,240);draw('Synthetic SOA-layout case '+c.id,36,791,9,240);draw('Personal details and payment codes removed',36,776,8,240);
   const labelled=createCanvas(target.canvas.width,target.canvas.height+110),label=labelled.getContext('2d');
   label.fillStyle='white';label.fillRect(0,0,labelled.width,labelled.height);label.fillStyle='black';label.font='25px Arial';
   label.fillText(`SYNTHETIC SOA DEMO ${c.id} - UNIT ${c.unit} - NOT FOR PAYMENT`,24,33);
   label.font='21px Arial';label.fillText('Account, dates and amounts are invented. Charge lines reconciled; consumption graphics illustrative.',24,66);
   label.drawImage(target.canvas,0,110);
   const image=labelled.toBuffer('image/png');await writeFile(join(out,`s0${c.unit==='A'?1:2}-preview.png`),image);await writeFile(join(out,c.file),await scannedUtilityPdf(image));
   await writeFile(join(out,`s0${c.unit==='A'?1:2}-email-instructions.txt`),`TO: rentara2026@gmail.com\nSUBJECT: Group 3 Demo - SOA ${c.id} - Unit ${c.unit}\nATTACH: ${c.file}\n\nEMAIL BODY:\nSynthetic SOA-layout demonstration ${c.id}. Please process the attached test bill. No actual payment requested.\n\nDo not attach this TXT. Do not paste A03/A04 summary values into this different bill's email.\n`);
  }finally{pdf.canvasFactory.destroy(target);}
 }
}finally{await task.destroy();}
assert.equal(createHash('sha256').update(await readFile(source)).digest('hex'),hash,'Anonymized source unchanged');
const temp=await mkdtemp(join(tmpdir(),'rentara-soa-variants-'));let s,integration;
const results=[];
try{
 setupGroupDemo(temp,[{name:'Fixture One',email:'one@example.test',unit:'A'},{name:'Fixture Two',email:'two@example.test',unit:'A'},{name:'Fixture Three',email:'three@example.test',unit:'B'}]);
 s=new Store(join(temp,'propertypro.sqlite'));const service=new Service(s),manager=s.all('users').find(u=>u.role==='manager');
 for(const c of cases)service.writeEntity(manager,'mappings',{unitId:s.all('units').find(u=>u.code==='G3-'+c.unit).id,provider:'Meralco',category:'electricity',account:c.account});
 integration=new Integrations(service,temp,{});
 for(const c of cases){
  const bytes=await readFile(join(out,c.file));const [r]=await integration.ingestEmail(utilityEmail(bytes));
  assert.equal(r.document.ocrStatus,'validated',JSON.stringify({case:c.id,failures:r.failures,fields:r.document}));
  assert.equal(r.document.extractionMethod,'pdf_ocr');
  for(const [field,value] of Object.entries({accountRef:c.account,amountDue:c.amount,dueDate:c.due,periodStart:c.start,periodEnd:c.end}))assert.equal(r.document[field],value,c.id+' '+field);
  const bills=s.all('bills').filter(b=>b.sourceId===r.document.id);assert.deepEqual(bills.map(b=>b.totalDue).sort((a,b)=>a-b),c.shares);
  for(const user of s.all('users').filter(u=>u.role==='tenant')){
   const tenant=s.get('tenants',user.tenantId),unit=s.get('units',tenant.unitId);assert.equal(service.bills(user).filter(b=>b.sourceId===r.document.id).length,unit.code==='G3-'+c.unit?1:0);
  }
  const count=s.all('bills').length;await integration.ingestEmail(utilityEmail(bytes));assert.equal(s.all('bills').length,count);
  results.push({id:c.id,extraction:'pdf_ocr',fields:'passed',allocation:'passed',ownTenantVisibility:'passed',duplicates:'passed'});
 }
 await writeFile(join(out,'soa-variants-verification.json'),JSON.stringify({preparedDate:'2026-11-02',source:'Already anonymized first-page SOA; original private SOA never read',sourceSha256:hash,scope:'Two synthetic derivatives of one layout, not independent provider bills or representative OCR accuracy; disposable portfolio only',cases,results,externalMessagesSent:0,workingDatabaseChanged:false},null,2)+'\n');
 console.log('Both SOA-layout PDFs passed actual email-attachment OCR, required-field checks, allocation, Tenant visibility and duplicate prevention. No live data changed or email sent.');
}finally{await integration?.close();s?.close();const target=resolve(temp);assert.equal(dirname(target),resolve(tmpdir()));assert.ok(basename(target).startsWith('rentara-soa-variants-'));await rm(target,{recursive:true,force:true});}
