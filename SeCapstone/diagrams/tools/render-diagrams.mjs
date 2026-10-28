// Native mxGraph rendering using the official diagrams.net viewer downloaded to .render-cache.
// Run from any directory. No diagram content is sent to a remote service.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import http from 'node:http';
const require=createRequire(new URL('../../rentara-portal/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const dir=new URL('../',import.meta.url),out=new URL('exports/',dir);
await mkdir(out,{recursive:true});
const viewer=await readFile(new URL('.render-cache/viewer-static.min.js',dir));
const server=http.createServer((req,res)=>{if(req.url==='/viewer.js'){res.setHeader('Content-Type','application/javascript');res.end(viewer);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:white}#graph{position:relative}</style><script>var mxLoadResources=false;var mxLoadStylesheets=false;var mxBasePath="/mxgraph";</script></head><body><div id="graph"></div><script src="/viewer.js"></script></body></html>');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
const manifest=[];
try{
 const page=await browser.newPage({viewport:{width:1800,height:1400},deviceScaleFactor:1});
 await page.route('**/*',route=>route.request().url().startsWith(origin)||route.request().url().startsWith('data:')?route.continue():route.abort());
 for(const name of ['2.1_Architectural_Framework','2.2_Process_Flowchart_SIMPLE','2.3_FullBlown_DFD']){
  await page.goto(origin);
  const xml=await readFile(new URL(name+'.drawio',dir),'utf8');
  const result=await page.evaluate(xml=>{
   const parsed=mxUtils.parseXml(xml),model=parsed.getElementsByTagName('mxGraphModel')[0];
   if(!model)throw Error('Uncompressed mxGraphModel required');
   const graph=new Graph(document.getElementById('graph'));
   graph.setEnabled(false);new mxCodec(parsed).decode(model,graph.getModel());graph.view.validate();
   const geometry=[];
   for(const cell of Object.values(graph.getModel().cells)){
    const state=graph.view.getState(cell);if(!state)continue;
    const text=state.text?.boundingBox;
    geometry.push({id:cell.id,edge:!!cell.edge,vertex:!!cell.vertex,parent:cell.parent?.id,source:cell.source?.id,target:cell.target?.id,label:graph.convertValueToString(cell),box:{x:state.x,y:state.y,w:state.width,h:state.height},points:state.absolutePoints?.map(p=>p?{x:p.x,y:p.y}:null),text:text?{x:text.x,y:text.y,w:text.width,h:text.height}:null});
   }
   const svg=graph.getSvg('#ffffff',1,24);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
   return {svg:mxUtils.getXml(svg),width:parseFloat(svg.getAttribute('width')),height:parseFloat(svg.getAttribute('height')),geometry};
  },xml);
  await writeFile(new URL(name+'.svg',out),result.svg);
  await writeFile(new URL(name+'-geometry.json',new URL('.render-cache/',dir)),JSON.stringify(result.geometry));
  await page.setContent(result.svg);await page.evaluate(()=>document.fonts.ready);
  await page.setViewportSize({width:Math.ceil(result.width),height:Math.ceil(result.height)});
  await page.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
  // PDF is a figure-only export at its natural aspect ratio, not a manuscript page.
  await page.pdf({path:fileURLToPath(new URL(name+'.pdf',out)),width:Math.ceil(result.width)+'px',height:Math.ceil(result.height)+'px',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
  // Four overlapping quadrants keep small labels readable on ordinary paper.
  const detailHtml=await page.evaluate(({svg,width,height,name})=>{
   let html='<style>@page{size:letter landscape;margin:0.35in}body{margin:0;font:12pt Arial;color:black}.sheet{break-after:page;height:7.7in;display:flex;flex-direction:column}.sheet:last-child{break-after:auto}h1{font-size:12pt;margin:0 0 8pt}p{font-size:10pt;margin:6pt 0}.crop{flex:1;min-height:0}.crop svg{width:100%;height:100%;display:block}</style>';
   const cropW=width*.54,cropH=height*.54;
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const parsed=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
    parsed.setAttribute('viewBox',`${col*(width-cropW)} ${row*(height-cropH)} ${cropW} ${cropH}`);
    parsed.removeAttribute('width');parsed.removeAttribute('height');parsed.setAttribute('preserveAspectRatio','xMidYMid meet');
    html+=`<section class="sheet"><h1>${name.replaceAll('_',' ')} — enlarged detail ${row*2+col+1} of 4</h1><div class="crop">${new XMLSerializer().serializeToString(parsed)}</div><p>Overlapping detail: ${row?'lower':'upper'} ${col?'right':'left'}. Consult the full SVG/PNG for the complete connected figure.</p></section>`;
   }
   return html;
  },{svg:result.svg,width:result.width,height:result.height,name});
  await page.setContent(detailHtml);await page.evaluate(()=>document.fonts.ready);
  await page.pdf({path:fileURLToPath(new URL(name+'-print-details.pdf',out)),preferCSSPageSize:true,printBackground:true});
  manifest.push({file:name,width:result.width,height:result.height});console.log(name,result.width,result.height);
 }
 await writeFile(new URL('manifest.json',out),JSON.stringify({renderer:'Official diagrams.net viewer / mxGraph',externalDiagramUpload:false,figures:manifest},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r));}
