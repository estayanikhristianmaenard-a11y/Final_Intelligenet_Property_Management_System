import {html, render} from '../../utils/dom.js';
import {api} from '../../api/client.js';
import session from '../../auth/session.js';
import {openModal} from '../../components/modal.js';
import {toast,toastSuccess} from '../../components/toast.js';

const definitions = {
  properties: {title:'Properties', fields:{name:'Property name',address:'Address'}},
  units: {title:'Units', fields:{property_id:'Property',code:'Unit code',capacity:'Occupant capacity'}},
  tenants: {title:'Tenants', fields:{name:'Full name',email:'Email',password:'Password',phone:'Phone'}},
  leases: {title:'Leases', fields:{unit_id:'Unit',start_date:'Start date',end_date:'End date',monthly_rent_centavos:'Monthly rent (centavos)',arrangement:'Arrangement'}},
  occupancy_assignments: {title:'Occupancy assignments',fields:{lease_id:'Lease',tenant_id:'Tenant',start_date:'Start date',end_date:'End date'}},
};
const rowKey = resource => resource === 'occupancy_assignments' ? 'assignments' : resource;
const money = value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(value / 100);

function optionsFor(field, records) {
  if(field==='arrangement') return [{id:'individual',label:'Individual'},{id:'shared_occupancy',label:'Shared occupancy'}];
  const resource={property_id:'properties',unit_id:'units',tenant_id:'tenants',lease_id:'leases'}[field];
  if(!resource) return null;
  return records[resource].map(row=>({id:row.id,label:`#${row.id} ${row.name ?? row.code ?? 'Unit #'+row.unit_id+' ('+row.start_date+' to '+row.end_date+')'}`}));
}
function fieldMarkup(field, label, records) {
  const options=optionsFor(field,records);
  const type=field.includes('date')?'date':['capacity','monthly_rent_centavos'].includes(field)?'number':field==='password'?'password':field==='email'?'email':'text';
  return html`<div class="field"><label class="field__label" for="field-${field}">${label}</label>${options
    ? html`<select class="input" name="${field}" id="field-${field}" required><option value="">Select ${label.toLowerCase()}</option>${options.map(option=>html`<option value="${option.id}">${option.label}</option>`)}</select>`
    : html`<input class="input" name="${field}" id="field-${field}" type="${type}" ${type==='number'?html`min="1" step="1"`:null} ${!['password','phone'].includes(field)?html`required`:null} ${field==='password'?html`autocomplete="new-password" minlength="12"`:null}>`}</div>`;
}
function display(field,value,records) {
  if(field==='monthly_rent_centavos') return money(value);
  return optionsFor(field,records)?.find(option=>String(option.id)===String(value))?.label ?? value ?? '—';
}

async function recordPage(container, resource, records, onSaved, selectedId) {
  const definition=definitions[resource], rows=records[rowKey(resource)];
  const columns=Object.entries(definition.fields).filter(([field])=>field!=='password');
  render(container,html`<section class="page"><div class="page-header"><div class="page-header__title"><h1>${definition.title}</h1><p>Create and update your property records.</p></div></div><div class="card"><div class="card__body"><form data-record class="stack stack-3"><div class="field"><label class="field__label" for="edit-record">Record</label><select class="input" id="edit-record" name="record_id"><option value="">Create new record</option>${rows.map(row=>html`<option value="${row.id}">Edit #${row.id} ${row.name ?? row.code ?? ''}</option>`)}</select></div><div class="foundation-fields">${Object.entries(definition.fields).map(([field,label])=>fieldMarkup(field,label,records))}</div>${resource==='leases'?html`<p class="text-secondary">PHP 1,000.00 = 100000 centavos. A lease with assignments cannot be amended yet.</p>`:null}${resource==='tenants'?html`<p class="text-secondary">New accounts require a password of at least 12 characters. Leave it blank when editing to keep the existing password.</p>`:null}<p data-error role="alert" style="white-space:pre-wrap"></p><div><button class="btn btn--primary">Save record</button></div></form></div></div><div class="card" style="margin-top:24px;overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th>${columns.map(([,label])=>html`<th>${label}</th>`)}</tr></thead><tbody>${rows.map(row=>html`<tr><td>${row.id}</td>${columns.map(([field])=>html`<td>${display(field,row[field],records)}</td>`)}</tr>`)}</tbody></table>${!rows.length?html`<p class="card__body">No records yet.</p>`:null}</div></section>`);
  const form=container.querySelector('[data-record]');
  form.elements.record_id.onchange=()=>{
    const row=rows.find(row=>row.id==form.elements.record_id.value);
    for(const field of Object.keys(definition.fields)) form.elements[field].value=row?.[field]??'';
    if(form.elements.password) form.elements.password.required=!row;
  };
  if(form.elements.password) form.elements.password.required=true;
  form.onsubmit=async event=>{
    event.preventDefault();
    const button=form.querySelector('button'); button.disabled=true;
    form.querySelector('[data-error]').textContent='';
    const data=Object.fromEntries(new FormData(form)), id=data.record_id;
    delete data.record_id; if(!data.password) delete data.password;
    try {
      await api.request('/foundation/'+resource+(id?'/'+id:''),{method:id?'PATCH':'POST',body:data});
      toastSuccess('Record saved');
      if (onSaved) { await onSaved(); return; }
      await renderLivePage(container,{page:resource==='occupancy_assignments'?'assignments':resource});
    } catch(error) { form.querySelector('[data-error]').textContent=error.message; }
    finally { button.disabled=false; }
  };
  if(selectedId) { form.elements.record_id.value=selectedId;form.elements.record_id.onchange(); }
}

export async function openRecordEditor(resource, onChanged, selectedId) {
  try {
  const records = await api.get('/foundation/records');
  const host = document.createElement('div');
  const modal = openModal({title:'Manage '+definitions[resource].title.toLowerCase(),body:host});
  await recordPage(host,resource,records,async()=>{modal.close();await onChanged?.();},selectedId);
  } catch(error) { toast({title:'Unable to open record',message:error.message,tone:'danger'}); }
}

export async function renderLivePage(container,{page}) {
  if(session.role==='manager' && (page==='dashboard' || definitions[page] || page==='assignments')) {
    const records=await api.get('/foundation/records');
    if(page!=='dashboard') return recordPage(container,page==='assignments'?'occupancy_assignments':page,records);
    render(container,html`<section class="page"><div class="page-header"><div class="page-header__title"><h1>Dashboard</h1><p>Your property records.</p></div></div><div class="foundation-fields">${[['Properties',records.properties.length,'properties'],['Units',records.units.length,'units'],['Tenants',records.tenants.length,'tenants'],['Leases',records.leases.length,'leases'],['Occupancy assignments',records.assignments.length,'assignments']].map(([label,total,path])=>html`<a class="card card__body" href="#/${path}"><h2>${total}</h2><p>${label}</p></a>`)}</div><p style="margin-top:24px">Start with properties and units, then tenant accounts, leases, and occupancy assignments.</p></section>`);
    return;
  }
  if(session.role==='tenant' && page==='tenantHome') {
    const data=await api.get('/tenant/assignment');
    render(container,html`<section class="page"><div class="page-header"><div class="page-header__title"><h1>My Home</h1><p>Welcome, ${session.user.name}.</p></div></div>${data.assignments.map(row=>html`<div class="card card__body"><h2>${row.property_name} / ${row.code}</h2><p>${row.start_date} to ${row.end_date}</p><p>${row.arrangement==='individual'?'Individual':'Shared occupancy'}</p></div>`)}${!data.assignments.length?html`<p>No occupancy assignment yet. Contact your property manager.</p>`:null}</section>`);
    return;
  }
  if(page==='settings' || page==='tenantSettings' || page==='adminSettings') {
    render(container,html`<section class="page"><h1>Account</h1><div class="card card__body"><p>${session.user.name}</p><p>${session.user.email}</p><p>${session.role}</p></div></section>`); return;
  }
  render(container,html`<section class="page"><h1>${page==='adminDashboard'?'System maintenance':'Under development'}</h1><div class="card card__body"><p>${page==='adminDashboard'?'This account is restricted to system maintenance. Maintenance tools are scheduled for a later iteration.':'This section will become available in a later development iteration.'}</p></div></section>`);
}
