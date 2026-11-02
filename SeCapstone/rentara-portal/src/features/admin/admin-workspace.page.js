import { html,render } from '../../utils/dom.js';
import { api } from '../../api/client.js';
import { navigate } from '../../app/router.js';
import { dataTable } from '../../components/data-table.js';
import { statCard } from '../../components/stat-card.js';
import { emptyState } from '../../components/empty-state.js';
import { openModal } from '../../components/modal.js';
import { tenantPersonalInformation } from '../tenants/tenant-personal-info.js';
import { billDetails } from '../billing/bill-details.js';
import { peso,date,dateTime } from '../../utils/format.js';

const route=params=>'#/admin/workspace?'+new URLSearchParams(Object.entries(params).filter(([,v])=>v)).toString();
const apiPath=(kind,id,workspaceId)=>'/admin/workspace-view/'+kind+'/'+encodeURIComponent(id)+(workspaceId?'?workspaceId='+encodeURIComponent(workspaceId):'');
const field=(label,value)=>html`<div class="desc-item"><span class="desc-item__label">${label}</span><span class="desc-item__value">${value??'—'}</span></div>`;

export async function renderAdminWorkspace(container,{query=new URLSearchParams()}={}) {
  const params=Object.fromEntries(query);
  render(container,html`<section class="page"><h1>Workspaces</h1><p role="status">Loading read-only view…</p></section>`);
  try {
    const workspaces=await api.get('/admin/workspaces');
    let data=null,detail=null,workspaceId=params.workspaceId||'';
    const selection=params.tenantId?['tenants',params.tenantId]:params.billId?['bills',params.billId]:params.receiptId?['receipts',params.receiptId]:null;
    if(selection){
      detail=await api.get(apiPath(...selection,workspaceId));workspaceId=detail.workspace.id;
      // Keep direct links, refresh and Back tied to the resolved workspace.
      if(!params.workspaceId)history.replaceState(null,'',route({...params,workspaceId}));
    }
    if(workspaceId&&!selection){
      const filters=new URLSearchParams({workspaceId});
      for(const key of ['propertyId','unitId','q'])if(params[key])filters.set(key,params[key]);
      data=await api.get('/admin/workspace-view?'+filters);
    }
    if(!container.isConnected)return;
    const workspace=detail?.workspace??data?.workspace;
    const context={workspaceId,view:params.view||'overview',propertyId:params.propertyId||'',unitId:params.unitId||'',q:params.q||''};
    const tabs=[['overview','Overview'],['properties','Properties'],['units','Units'],['tenants','Tenants'],['bills','Bills']];
    render(container,html`<section class="page" aria-labelledby="page-title">
      <div class="page-header"><div class="page-header__title"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/admin">Admin</a><span> / </span><span>Workspaces</span></nav><h1 id="page-title">${workspace?.name??'Workspaces'}</h1><p>Inspect shared records. Management actions remain with the assigned roles.</p></div></div>
      <section class="card"><div class="card__body"><label>Workspace<select class="input select" data-admin-workspace><option value="">Select a workspace</option>${workspaces.map(w=>html`<option value="${w.id}" ${w.id===workspaceId?'selected':''}>${w.name}</option>`)}</select></label>
      ${workspace?html`<p class="notice-strip notice-strip--info mt-3" data-admin-context>${workspace.name} · Admin · Read-only</p><nav class="row row-wrap mt-3" aria-label="Workspace sections">${tabs.map(([key,label])=>html`<a class="btn ${context.view===key?'btn--secondary':'btn--ghost'}" href="${route({workspaceId,view:key})}">${label}</a>`)}</nav>`:null}</div></section>
      ${detail?html`<p class="mt-3"><a href="${route(context)}">Back to ${context.view}</a></p>${detailContent(detail,context)}`:data?listContent(data,context):emptyState({title:'Select a workspace',body:'Your Admin identity stays unchanged. Each business opens in read-only mode.',iconName:'building'})}
    </section>`);
    container.querySelector('[data-admin-workspace]').onchange=e=>navigate('/admin/workspace',{workspaceId:e.target.value,view:'overview'});
    container.querySelector('[data-admin-filters]')?.addEventListener('submit',e=>{
      e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));
      navigate('/admin/workspace',{...context,...values});
    });
    container.querySelector('[data-admin-property]')?.addEventListener('change',e=>{
      navigate('/admin/workspace',{...context,propertyId:e.target.value,unitId:''});
    });
    container.querySelector('[data-admin-unit]')?.addEventListener('change',e=>navigate('/admin/workspace',{...context,unitId:e.target.value}));
    container.querySelector('[data-admin-receipt-view]')?.addEventListener('click',async e=>{
      const button=e.currentTarget;button.disabled=true;
      try{
        const markup=await api.get(apiPath('receipts',detail.receipt.id,workspaceId)+'&format=html');
        if(!container.isConnected)return;
        openModal({title:'Rent receipt · Read-only',body:html`<iframe title="System-generated rent receipt" sandbox="" style="width:100%;height:65vh;border:0" srcdoc="${markup}"></iframe>`});
      }catch{if(container.isConnected)container.querySelector('[data-receipt-status]').textContent='Receipt could not be loaded. Try again.';}
      finally{button.disabled=false;}
    });
  } catch(error){
    if(container.isConnected)render(container,html`<section class="page"><h1>Workspace view unavailable</h1><p>${error.message}</p><a class="btn btn--secondary" href="#/admin/workspace">Choose a workspace</a></section>`);
  }
}

function filters(data,context){return html`<form class="account-filters mt-3" data-admin-filters>
  <label>Property<select class="input select" name="propertyId" data-admin-property><option value="">All properties</option>${data.properties.map(p=>html`<option value="${p.id}" ${p.id===context.propertyId?'selected':''}>${p.name}</option>`)}</select></label>
  <label>Unit<select class="input select" name="unitId" data-admin-unit><option value="">All units</option>${data.units.filter(u=>!context.propertyId||u.propertyId===context.propertyId).map(u=>html`<option value="${u.id}" ${u.id===context.unitId?'selected':''}>${u.code}</option>`)}</select></label>
  <label>Search Tenants<input class="input" name="q" value="${context.q}" maxlength="150"></label><button class="btn btn--secondary" type="submit">Search</button>
</form>`;}

function billsTable(bills,context){return dataTable({ariaLabel:'Read-only bills',rows:bills,emptyTitle:'No bills in this view',columns:[
  {key:'tenantName',label:'Tenant',render:b=>html`<a href="${route({...context,tenantId:b.tenantId})}">${b.tenantName}</a>`},
  {key:'unitCode',label:'Unit'},{key:'dueDate',label:'Due',render:b=>date(b.dueDate)},
  {key:'totalDue',label:'Amount',render:b=>peso(b.totalDue)},
  {key:'status',label:'Status',render:b=>b.lines.every(l=>l.category==='rent')?String(b.paymentStatus).replaceAll('_',' '):b.utilityTrackingNeedsReview?'Tenant mark needs review; not verified':`Tenant-recorded, not verified: ${(b.utilityTrackingStatus??'not_marked_paid').replaceAll('_',' ')}`},
  {key:'view',label:'Details',render:b=>html`<a href="${route({...context,billId:b.id})}">View bill<span class="sr-only"> ${b.id}</span></a>`},
]});}

function listContent(data,context){
  if(context.view==='overview')return html`<div class="stat-row mt-3">${[['Properties',data.summary.properties,'building'],['Units',data.summary.units,'door'],['Tenants',data.summary.tenants,'users'],['Bills',data.summary.bills,'receipt']].map(([label,value,iconName])=>statCard({label,value,iconName}))}</div><p>No approval actions are available in Admin view. Choose a section above to inspect records.</p>`;
  if(context.view==='properties')return html`<section class="mt-3">${dataTable({ariaLabel:'Read-only properties',rows:data.properties,columns:[{key:'name',label:'Property'},{key:'address',label:'Address'},{key:'city',label:'City'},{key:'view',label:'Details',render:p=>html`<a href="${route({workspaceId:context.workspaceId,view:'units',propertyId:p.id})}">View units</a>`}]})}</section>`;
  if(context.view==='units')return html`${filters(data,context)}${dataTable({ariaLabel:'Read-only units',rows:data.units.filter(u=>(!context.propertyId||u.propertyId===context.propertyId)&&(!context.unitId||u.id===context.unitId)),columns:[{key:'code',label:'Unit'},{key:'propertyId',label:'Property',render:u=>data.properties.find(p=>p.id===u.propertyId)?.name},{key:'arrangement',label:'Arrangement',render:u=>u.arrangement.replaceAll('_',' ')},{key:'monthlyRent',label:'Whole-unit rent',render:u=>peso(u.monthlyRent)},{key:'view',label:'Details',render:u=>html`<a href="${route({workspaceId:context.workspaceId,view:'tenants',propertyId:u.propertyId,unitId:u.id})}">View Tenants</a>`}]})}`;
  if(context.view==='bills')return html`${filters(data,context)}${billsTable(data.bills,context)}`;
  return html`${filters(data,context)}${dataTable({ariaLabel:'Read-only Tenants',rows:data.tenants,columns:[{key:'fullName',label:'Tenant',render:t=>html`<a href="${route({...context,tenantId:t.id})}">${t.fullName}</a>`},{key:'propertyName',label:'Property'},{key:'unitCode',label:'Unit'},{key:'phone',label:'Phone'},{key:'email',label:'Email'}]})}`;
}

function detailContent(data,context){
  if(data.tenant)return html`<section class="card mt-3"><div class="card__body"><h2>${data.tenant.fullName}</h2>${tenantPersonalInformation(data.tenant,{showGovernmentId:false})}<section class="panel-section"><h3>Unit Information</h3><div class="desc-grid">${field('Property',data.tenant.propertyName)}${field('Unit',data.tenant.unitCode)}${field('Lease start',date(data.tenant.leaseStart))}</div></section><p>Private files cannot be opened in Admin view.</p>${fileMetadata(data.files)}</div></section><h2 class="mt-3">Bills</h2>${billsTable(data.bills,context)}<h2 class="mt-3">Rent receipts</h2>${receiptLinks(data.receipts,context)}`;
  if(data.bill)return html`<section class="card mt-3"><div class="card__body">${billDetails(data.bill,{observer:true})}${data.source?html`<h3>Extracted bill values</h3><div class="desc-grid">${field('Provider',data.source.provider)}${field('Amount due',peso(data.source.amountDue))}${field('Due date',date(data.source.dueDate))}${field('Period',`${date(data.source.periodStart)} – ${date(data.source.periodEnd)}`)}</div>${fileMetadata([data.source.file])}<p>Original source and raw extraction are restricted.</p>`:null}${data.bill.receiptId?receiptLinks([{id:data.bill.receiptId}],context):null}<h3>Correction history</h3>${data.corrections.length?html`<ol>${data.corrections.map(p=>html`<li>${p.state} · ${dateTime(p.decidedAt??p.createdAt)}<dl>${Object.entries(p.changes).map(([key,value])=>html`<dt>${key}</dt><dd>${p.previousValues[key]??'Not extracted'} → ${value}</dd>`)}</dl></li>`)}</ol>`:html`<p>No correction proposals recorded.</p>`}</div></section>`;
  const r=data.receipt;return html`<section class="card mt-3"><div class="card__body"><h2>Manager-confirmed rent receipt</h2><div class="desc-grid">${field('Received from',r.tenantName)}${field('Amount',peso(r.amount))}${field('Confirmed by',r.confirmedBy)}${field('Confirmed on',dateTime(r.confirmedOn))}</div><button class="btn btn--secondary mt-3" type="button" data-admin-receipt-view>View rent receipt</button><p role="status" data-receipt-status></p></div></section>`;
}
function receiptLinks(receipts,context){return html`<ul>${receipts.map(r=>html`<li><a href="${route({...context,receiptId:r.id})}">View rent receipt · ${peso(r.amount)}</a></li>`)}</ul>`;}
function fileMetadata(files){return files.length?html`<h3>File metadata</h3><ul>${files.map(f=>html`<li>${f.type} · ${dateTime(f.date)} · ${f.status}</li>`)}</ul>`:html`<p>No file metadata available.</p>`;}
