import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../server/store.js';
import { Service } from '../server/service.js';
import { bootstrap } from '../server/bootstrap.js';
import { cents } from '../server/rules.js';
import { philippineDate } from '../server/rules.js';

function fixture() {
  const store=new Store(':memory:'), service=new Service(store);
  bootstrap(service,{adminPassword:'Validation!2026',managerPassword:'Validation!2026',tenantPassword:'Validation!2026',demo:true});
  return {store,service,admin:store.get('users','usr-admin'),manager:store.get('users','usr-manager')};
}
const invalid = (action) => assert.throws(action,error=>error.status===422);

test('account and workspace writes reject coerced or oversized text without creating records',()=>{
  const f=fixture();
  try {
    const count=f.store.allGlobal('users').length;
    for(const name of [123,['Valid Name'],' ', 'n'.repeat(151)])
      invalid(()=>f.service.userWrite(f.admin,{name,email:'new@example.test',role:'manager',password:'Validation!2026'}));
    for(const email of [['new@example.test'],'a'.repeat(245)+'@example.test'])
      invalid(()=>f.service.userWrite(f.admin,{name:'New Manager',email,role:'manager',password:'Validation!2026'}));
    for(const name of [123,['Valid Workspace'],' ']) invalid(()=>f.service.workspaceWrite(f.admin,{name}));
    assert.equal(f.store.allGlobal('users').length,count);
    const valid=f.service.userWrite(f.admin,{name:"  Ana O'Neil  ",email:' NEW@EXAMPLE.TEST ',role:'manager',password:'Validation!2026'});
    assert.equal(valid.name,"Ana O'Neil");assert.equal(valid.email,'new@example.test');
  } finally { f.store.close(); }
});

test('entity text fields reject numbers, blank names and oversized names before persistence',()=>{
  const f=fixture();
  try {
    const property=f.store.get('properties','prp-b');
    for(const name of [123,' ','a'.repeat(151)]) invalid(()=>f.service.writeEntity(f.manager,'properties',{name},property.id));
    assert.deepEqual(f.store.get('properties',property.id),property);
    const tenant=f.store.get('tenants','tnt-001');
    for(const fullName of [123,'x','a'.repeat(151)]) invalid(()=>f.service.writeEntity(f.manager,'tenants',{fullName},tenant.id));
    invalid(()=>f.service.writeEntity(f.manager,'tenants',{email:'a'.repeat(245)+'@example.test'},tenant.id));
    assert.deepEqual(f.store.get('tenants',tenant.id),tenant);
    f.service.writeEntity(f.manager,'tenants',{fullName:"  Ana O'Neil  "},tenant.id);
    assert.equal(f.store.get('tenants',tenant.id).fullName,"Ana O'Neil");
  } finally { f.store.close(); }
});

test('duplicate normalized account emails give a useful conflict and preserve both accounts',()=>{
  const f=fixture();
  try {
    const before=f.store.allGlobal('users');
    for(const action of [
      ()=>f.service.profile(f.manager,{email:' ADMIN@PROPERTYPRO.PH '}),
      ()=>f.service.userWrite(f.admin,{name:'Duplicate',email:' MANAGER@PROPERTYPRO.PH ',role:'manager',password:'Validation!2026'}),
    ]) assert.throws(action,error=>error.status===409 && error.message==='Email is already used by another account');
    assert.deepEqual(f.store.allGlobal('users'),before);
  } finally { f.store.close(); }
});

test('preference patches require booleans and preserve notification opt-outs not in the patch',()=>{
  const f=fixture();
  try {
    f.service.profile(f.manager,{preferences:{billing:false,reminder:false,payment:false,emailRent:false}});
    const before=f.store.get('users',f.manager.id);
    for(const preferences of [false,[],{billing:'false'},{reminder:0}]) invalid(()=>f.service.profile(f.manager,{preferences}));
    assert.deepEqual(f.store.get('users',f.manager.id),before);
    f.service.profile(f.manager,{preferences:{billing:true}});
    assert.deepEqual(f.store.get('users',f.manager.id).preferences,{billing:true,reminder:false,payment:false,emailRent:false});
  } finally { f.store.close(); }
});

test('money accepts decimal scalars only and retains exact centavo limits',()=>{
  for(const value of [[5],['1.25'],{toString:()=> '2.50'},true,'1e2','1.001','-1',' ']) invalid(()=>cents(value));
  assert.equal(cents('0'),0);assert.equal(cents('1000.01'),100001);assert.equal(cents(12.5),1250);
  assert.equal(cents('1000000000.00'),100000000000);
  invalid(()=>cents('1000000000.01'));
});

test('malformed payment references cannot create a rent report',()=>{
  const f=fixture();
  try {
    f.service.generateRent(philippineDate());
    const tenant=f.store.get('users','usr-tenant');
    const bill=f.service.bills(tenant).find(b=>b.lines.every(line=>line.category==='rent'));
    const before=f.store.all('payments');
    for(const reference of [['bank-ref'],123,{},'x'.repeat(151)])
      invalid(()=>f.service.report(tenant,bill.id,{method:'bank_transfer',reference}));
    assert.deepEqual(f.store.all('payments'),before);
    assert.equal(f.store.get('bills',bill.id).paymentStatus,'unpaid');
    f.service.report(tenant,bill.id,{method:'bank_transfer',reference:'  BANK-123  '});
    assert.equal(f.store.all('payments').at(-1).reference,'BANK-123');
  } finally { f.store.close(); }
});
