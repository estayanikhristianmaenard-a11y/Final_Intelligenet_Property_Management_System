import { requireValue } from './rules.js';

const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value?.[k]!==undefined).map(k=>[k,value[k]]));
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,150}$/.test(value);
const lineView=line=>({...pick(line,['category','label','amount','grossAmount','sourceAmount','period','credit','isAdvance']),
  allocations:(line.allocations??[]).map(a=>pick(a,['tenantId','amount','share']))});
const billView=b=>({...pick(b,['id','tenantId','tenantName','unitCode','cycle','dueDate','totalDue','paymentStatus','receiptId','revision','createdAt','settlementReviewRequired','linkedBalanceChange']),
  lines:(b.lines??[]).map(lineView),
  utilityTrackingStatus:!b.lines?.every(l=>l.category==='rent')?(b.utilityTrackingStatus??'not_marked_paid'):undefined,
  utilityTrackingNeedsReview:!!b.utilityTrackingRevision&&b.utilityTrackingRevision!==b.revision});
const receiptView=r=>pick(r,['id','billId','tenantId','tenantName','amount','method','reference','confirmedOn','confirmedBy','paymentDate']);
const tenantFields=['id','unitId','fullName','email','phone','emergencyContactName','emergencyContactPhone','leaseStart','leaseEnd','assignmentStart','assignmentEnd','status'];
const unitFields=['id','propertyId','code','floor','type','arrangement','monthlyRent','status'];
const propertyFields=['id','name','address','city','type'];
const visibleChanges=changes=>pick(changes,['provider','amountDue','dueDate','periodStart','periodEnd']);

// This is a distinct read capability, never an Admin bypass in Manager services.
// Build every response from allowlists; retained originals/raw extraction are excluded.
export function adminWorkspaceRead(service,user,kind,recordId,query={}) {
  service.role(user,'admin');
  const s=service.s;
  requireValue(['overview','tenants','bills','receipts'].includes(kind),'Not found',404);
  for(const key of Object.keys(query))requireValue(['workspaceId','propertyId','unitId','q','format'].includes(key),'Unsupported read filter');
  if(query.format)requireValue(kind==='receipts'&&query.format==='html','Unsupported format');
  for(const key of ['workspaceId','propertyId','unitId'])if(query[key])requireValue(id(query[key]),'Invalid record reference');
  if(recordId)requireValue(id(recordId),'Not found',404);
  const record=recordId?s.getGlobal(kind,recordId):null;
  if(recordId)requireValue(record,'Not found',404);
  const workspaceId=query.workspaceId||record?.workspaceId;
  requireValue(id(workspaceId),'Select a workspace');
  const workspace=s.getGlobal('workspaces',workspaceId);
  requireValue(workspace&&(!record||record.workspaceId===workspaceId),'Not found',404);
  return s.withWorkspace(workspaceId,()=>{
    const properties=s.all('properties').map(p=>pick(p,propertyFields));
    const units=s.all('units').map(u=>pick(u,unitFields));
    if(query.propertyId)requireValue(properties.some(p=>p.id===query.propertyId),'Not found',404);
    if(query.unitId)requireValue(units.some(u=>u.id===query.unitId&&(!query.propertyId||u.propertyId===query.propertyId)),'Not found',404);
    const accounts=new Map(s.all('users').filter(u=>u.role==='tenant').map(u=>[u.tenantId,u]));
    const tenants=s.all('tenants').map(t=>{
      const unit=units.find(u=>u.id===t.unitId),property=properties.find(p=>p.id===unit?.propertyId);
      const account=accounts.get(t.id);
      return {...pick(t,tenantFields),unitCode:unit?.code,floor:unit?.floor,arrangement:unit?.arrangement,propertyId:property?.id,propertyName:property?.name,account:account?pick(account,['id','email','role','status']):null};
    });
    const bills=s.all('bills');
    const metadata=d=>({type:d.contentType??d.type??'Not recorded',date:d.receivedAt??d.uploadedAt??d.createdAt??null,status:d.ocrStatus??d.status??'Stored'});
    const history=sourceId=>s.all('correction_proposals').filter(p=>p.sourceId===sourceId).map(p=>({id:p.id,state:p.state,createdAt:p.createdAt,decidedAt:p.decidedAt,changes:visibleChanges(p.changes),previousValues:visibleChanges(p.previousValues)}));
    if(kind==='bills'){
      const source=record.sourceId?s.get('incoming',record.sourceId):null;
      const result={workspace:pick(workspace,['id','name']),bill:billView(record),source:source?{...pick(source,['provider','amountDue','dueDate','periodStart','periodEnd']),file:metadata(source)}:null,corrections:source?history(source.id):[]};
      s.audit(user,'Admin bill viewed',record.id);
      return result;
    }
    if(kind==='receipts'){
      // Only database-generated rent receipts, never uploaded evidence/files.
      const bill=s.get('bills',record.billId);
      requireValue(bill&&bill.lines?.every(l=>l.category==='rent'),'Not found',404);
      s.audit(user,'Admin rent receipt viewed',record.id);
      return {workspace:pick(workspace,['id','name']),receipt:receiptView(record)};
    }
    if(kind==='tenants'){
      const tenant=tenants.find(t=>t.id===record.id);
      const ownBills=bills.filter(b=>b.tenantId===record.id);
      const sourceIds=new Set(ownBills.map(b=>b.sourceId).filter(Boolean));
      s.audit(user,'Admin Tenant viewed',record.id);
      return {workspace:pick(workspace,['id','name']),tenant,bills:ownBills.map(billView),receipts:s.all('receipts').filter(r=>r.tenantId===record.id).map(receiptView),
        files:[...s.all('documents').filter(d=>d.tenantId===record.id),...s.all('incoming').filter(d=>sourceIds.has(d.id))].map(metadata)};
    }
    const term=String(query.q??'').trim().toLowerCase();requireValue(term.length<=150,'Search is too long');
    const filtered=tenants.filter(t=>(!query.propertyId||t.propertyId===query.propertyId)&&(!query.unitId||t.unitId===query.unitId)&&(!term||`${t.fullName} ${t.email} ${t.unitCode}`.toLowerCase().includes(term)));
    const ids=new Set(filtered.map(t=>t.id));
    return {workspace:pick(workspace,['id','name']),properties,units,tenants:filtered,bills:bills.filter(b=>ids.has(b.tenantId)).map(billView),summary:{properties:properties.length,units:units.length,tenants:tenants.length,bills:bills.length}};
  });
}
