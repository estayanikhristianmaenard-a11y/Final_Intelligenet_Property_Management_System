// Synthetic manual-test inputs. Does not change the working database or contact Gmail.
import {mkdir,writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {utilityPdf,scannedUtilityPdf} from '../tests/fixtures.js';
import {setupGroupDemo} from '../server/group-demo-setup.js';
import {Store} from '../server/store.js';
import {Service} from '../server/service.js';
import {Integrations} from '../server/integrations.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'../reports/testing/assets');await mkdir(out,{recursive:true});
const cases=[
 {id:'A01',file:'a01-unit-a-electricity-scan.pdf',provider:'Meralco',account:'G3000101',unit:'G3-A',amount:1000.01,start:'2026-12-01',end:'2026-12-14',due:'2026-12-20',mode:'scan',shares:[500,500.01]},
 {id:'A02',file:'a02-unit-b-water-digital.pdf',provider:'Manila Water',account:'G3W0102',unit:'G3-B',amount:321.45,start:'2026-12-01',end:'2026-12-14',due:'2026-12-20',mode:'digital',shares:[321.45]},
 {id:'A03',file:'a03-unit-a-email-body.txt',provider:'Meralco',account:'G3000101',unit:'G3-A',amount:900,start:'2027-01-01',end:'2027-01-14',due:'2027-01-20',mode:'email',shares:[450,450]},
 {id:'A04',file:'a04-unit-b-email-body.txt',provider:'Manila Water',account:'G3W0102',unit:'G3-B',amount:280,start:'2027-01-01',end:'2027-01-14',due:'2027-01-20',mode:'email',shares:[280]},
 {id:'A05',file:'a05-unmapped-account.pdf',provider:'Meralco',account:'DEMO-NOT-MAPPED-20261102',unit:'Unmatched',amount:700,start:'2027-02-01',end:'2027-02-14',due:'2027-02-20',mode:'held',shares:[]},
 {id:'A06',file:'a06-masked-account.pdf',provider:'Meralco',account:'G30001XX',unit:'Unmatched',amount:800,start:'2027-03-01',end:'2027-03-14',due:'2027-03-20',mode:'held',shares:[]},
];
const body=c=>[c.provider,'SYNTHETIC FINAL TEST - NOT A REAL BILL',`Account: ${c.account}`,`Amount Due: ${c.amount.toFixed(2)}`,`Due Date: ${c.due}`,`Billing Period: ${c.start} to ${c.end}`].join('\n');
for(const c of cases){
 const text=body(c);
 if(c.mode==='email'){
  await writeFile(join(out,c.file),`TO: rentara2026@gmail.com\nSUBJECT: Group 3 Demo - Final Test ${c.id} - ${c.provider}\n\nCopy the subject separately. Copy only the body below into Gmail. Do not attach this text file.\n----- EMAIL BODY -----\n${text}\n`, 'utf8');
 }else if(c.mode==='scan'){
  const canvas=createCanvas(1500,1100),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1500,1100);ctx.fillStyle='black';ctx.font='34px Arial';
  text.split('\n').forEach((line,i)=>ctx.fillText(line,60,100+i*115));
  const image=canvas.toBuffer('image/png');await writeFile(join(out,'a01-unit-a-electricity-image.png'),image);await writeFile(join(out,c.file),await scannedUtilityPdf(image));
 }else await writeFile(join(out,c.file),utilityPdf(text));
}
await writeFile(join(out,'a07-not-a-bill.txt'),'Unsupported bill-upload example. This contains no billing data. Do not email it as an invoice.\n');
const dir=await mkdtemp(join(tmpdir(),'rentara-final-assets-'));let s,i;
const verified=[];
try{
 const setup=setupGroupDemo(dir,[{name:'Fixture One',email:'one@example.test',unit:'A'},{name:'Fixture Two',email:'two@example.test',unit:'A'},{name:'Fixture Three',email:'three@example.test',unit:'B'}]);
 s=new Store(join(dir,'propertypro.sqlite'));const service=new Service(s),manager=s.all('users').find(u=>u.role==='manager');
 if(!s.all('mappings').some(m=>m.account==='G3W0102'))service.writeEntity(manager,'mappings',{unitId:s.all('units').find(u=>u.code==='G3-B').id,provider:'Manila Water',category:'water',account:'G3W0102'});
 i=new Integrations(service,dir,{});
 for(const c of cases){
  let result;
  if(c.mode==='email'){
   const raw=Buffer.from(`From: final-test@example.test\r\nTo: rentara2026@gmail.com\r\nSubject: Group 3 Demo - Final Test ${c.id}\r\nMessage-ID: <final-${c.id}@example.test>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body(c)}`);
   [result]=await i.ingestEmail(raw);
  }else result=await i.ingest(await readFile(join(out,c.file)),c.file,'application/pdf');
  assert.ok(result,c.id);
  // Held sources have no finalized billIds; verify that no source-linked charge exists.
  const bills=s.all('bills').filter(b=>b.sourceId===result.document.id);
  assert.deepEqual(bills.map(b=>b.totalDue).sort((a,b)=>a-b),c.shares,c.id);
  assert.equal(result.document.ocrStatus,c.mode==='held'?'failed':'validated',c.id);
  if(c.mode!=='held')for(const key of ['amountDue','dueDate','periodStart','periodEnd','accountRef'])assert.equal(result.document[key],({amountDue:c.amount,dueDate:c.due,periodStart:c.start,periodEnd:c.end,accountRef:c.account})[key],c.id+' '+key);
  verified.push({id:c.id,status:result.document.ocrStatus,method:result.document.extractionMethod,shares:c.shares});
 }
 const count=s.all('bills').length;await i.ingest(await readFile(join(out,cases[0].file)),cases[0].file,'application/pdf');assert.equal(s.all('bills').length,count,'Repeated A01 must not duplicate charges');
 await writeFile(join(out,'manifest.json'),JSON.stringify({preparedDate:'2026-11-02',scope:'Synthetic controlled fixtures; actual libraries and disposable portfolio only; no Gmail, no working database changes; not representative accuracy',cases,verification:{checkedAt:new Date().toISOString(),results:verified,duplicatePrevention:true},otherAssets:[{id:'A07',file:'a07-not-a-bill.txt',purpose:'Unsupported upload; no charge expected'},{id:'A08',file:null,purpose:'Existing Bayan staged correction source; original due date 2026-12-20; amount 600; expected shares 300 each after authorization'}]},null,2)+'\n');
 console.log('Six synthetic cases checked with real extraction/validation/allocation, including scanned-PDF OCR, two email bodies and two held sources. Duplicate prevented. No live data changed.');
}finally{
 await i?.close();s?.close();
 const target=resolve(dir);assert.equal(dirname(target),resolve(tmpdir()));assert.ok(basename(target).startsWith('rentara-final-assets-'));
 await rm(target,{recursive:true,force:true});
}
