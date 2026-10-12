import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.PROPERTYPRO_CONFIG = {MODE:'live',BASE_URL:'/api/v1'};
globalThis.window = {location:{href:''}};
globalThis.document = {querySelector:()=>({content:'test-csrf'})};
// Live sessions must not trust a persisted demo role or browser bearer token.
globalThis.localStorage = {getItem(){throw Error('Live auth read local storage');},setItem(){throw Error('Live auth wrote local storage');}};
let calls=[], responder;
globalThis.fetch = async (url, options) => {
  calls.push({url,options});
  const {status=200,body} = responder(url,options);
  return {ok:status>=200&&status<300,status,text:async()=>JSON.stringify(body)};
};
const {default:session} = await import('../src/auth/session.js');
const {api} = await import('../src/api/client.js');
const {renderLivePage} = await import('../src/features/foundation/foundation.page.js');
const {topbar} = await import('../src/components/topbar.js');
const {renderDashboard} = await import('../src/features/dashboard/dashboard.page.js');

test('live authentication derives role from server, restores session, and logs out', async()=>{
  const identity={id:7,name:'Manager',email:'actual@example.test',role:'manager'};
  responder=()=>({body:identity});
  await session.signIn('admin',{email:identity.email,password:'entered-password'});
  assert.equal(session.role,'manager');
  assert.deepEqual(JSON.parse(calls.at(-1).options.body),{email:identity.email,password:'entered-password'});
  assert.equal(calls.at(-1).options.headers['X-CSRF-TOKEN'],'test-csrf');
  assert.equal(calls.at(-1).options.headers.Authorization,undefined);
  assert.equal(calls.at(-1).options.credentials,'same-origin');
  assert.equal(window.location.href,'/portal#/dashboard');
  await session.restore();
  assert.equal(calls.at(-1).url,'/api/v1/auth/me');
  assert.equal(session.user.id,7);
  const menu=String(topbar({user:identity,menuOpen:true}));
  assert.ok(menu.includes('data-action="sign-out"'));
  assert.ok(!menu.includes('data-action="switch-role"'));
  await session.signOut();
  assert.equal(calls.at(-1).url,'/api/v1/auth/logout');
  assert.equal(session.isAuthenticated,false);
});

test('expired session is cleared and field validation feedback is preserved',async()=>{
  responder=()=>({status:401,body:{message:'Unauthenticated.'}});
  await session.restore();
  assert.equal(session.isAuthenticated,false);
  responder=()=>({status:422,body:{message:'Invalid input',errors:{email:['Email already exists.']}}});
  await assert.rejects(api.post('/foundation/tenants',{}),{message:'Email already exists.',status:422});
});

test('dashboard uses real foundation counts; unfinished pages never request mock bills',async()=>{
  responder=()=>({body:{id:7,name:'Manager',role:'manager'}});
  await session.restore();
  responder=()=>({body:{properties:[{id:1}],units:[],tenants:[],leases:[],assignments:[]}});
  const host={innerHTML:''};
  await renderLivePage(host,{page:'dashboard'});
  assert.ok(host.innerHTML.includes('Properties'));
  assert.ok(host.innerHTML.includes('<h2>1</h2>'));
  assert.equal(calls.at(-1).url,'/api/v1/foundation/records');
  const before=calls.length;
  await renderLivePage(host,{page:'bills'});
  assert.ok(host.innerHTML.includes('Under development'));
  assert.equal(calls.length,before);
});

test('tenant home uses own server-scoped assignment endpoint and escapes stored text',async()=>{
  responder=()=>({body:{id:9,name:'Tenant',role:'tenant'}});
  await session.restore();
  responder=()=>({body:{assignments:[{property_name:'<script>bad</script>',code:'A1',start_date:'2026-10-01',end_date:'2027-09-30',arrangement:'individual'}]}});
  const host={innerHTML:''};
  await renderLivePage(host,{page:'tenantHome'});
  assert.equal(calls.at(-1).url,'/api/v1/tenant/assignment');
  assert.ok(!host.innerHTML.includes('<script>'));
  assert.ok(host.innerHTML.includes('&lt;script&gt;'));
});

test('original prototype dashboard renders its cards and sections with backend contracts',async()=>{
  responder=url=>({body:url.includes('/dashboard/stats') ? {
    totalUnits:{value:2,delta:null},totalTenants:{value:1,delta:null},
    incomingBills:{value:'—',delta:null},exceptionQueue:{value:'—',delta:null},
    openExceptions:0,outstanding:0,occupancy:0,
  } : []});
  const host={innerHTML:'',querySelector:()=>null};
  await renderDashboard(host);
  assert.ok(host.innerHTML.includes('Property Overview'));
  assert.ok(host.innerHTML.includes('Recent Activity'));
  assert.ok(host.innerHTML.includes('stat-card'));
  assert.ok(!host.innerHTML.includes('Dashboard data could not be loaded'));
  assert.ok(!host.innerHTML.includes('NaN'));
});
