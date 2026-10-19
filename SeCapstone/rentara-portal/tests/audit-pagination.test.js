import test from "node:test";
import assert from "node:assert/strict";
import {Store} from "../server/store.js";
import {Service} from "../server/service.js";
import {bootstrap} from "../server/bootstrap.js";
import {createApp} from "../server/index.js";

test("audit paging retains older rows, filters before paging, uses Philippine dates and restricts access", async () => {
  const store=new Store(":memory:"),service=new Service(store),password="AuditPaging!2026";
  bootstrap(service,{adminPassword:password,managerPassword:password,tenantPassword:password,demo:true});
  const admin=service.login({email:"admin@propertypro.ph",password});
  const manager=service.login({email:"manager@propertypro.ph",password});
  for(let i=0;i<123;i++) store.save("audit",{id:`paging-${String(i).padStart(3,"0")}`,action:i%2 ? "Paging odd" : "Paging even",actor:"Test manager",role:"manager",at:"2090-01-01T00:00:00.000Z"});
  store.save("audit",{id:"ph-start",action:"Date boundary",at:"2026-09-30T16:00:00.000Z"});
  store.save("audit",{id:"ph-end",action:"Date boundary",at:"2026-10-01T15:59:59.000Z"});
  store.save("audit",{id:"ph-next",action:"Date boundary",at:"2026-10-01T16:00:00.000Z"});
  const app=createApp({store,env:{}});
  await new Promise(resolve=>app.server.listen(0,"127.0.0.1",resolve));
  const url=`http://127.0.0.1:${app.server.address().port}/api/v1/admin/audit`;
  const get=(query,token=admin.token)=>fetch(url+query,{headers:{Authorization:`Bearer ${token}`}});
  try {
    const originalCount=store.all("audit").length;
    const seen=[];
    for(let page=1;page<=5;page++) {
      const response=await get(`?page=${page}&limit=25&action=Paging`);
      assert.equal(response.status,200);
      const result=await response.json();
      assert.equal(result.total,123);assert.equal(result.page,page);
      assert.ok(result.items.length<=25);
      seen.push(...result.items.map(item=>item.id));
    }
    assert.equal(new Set(seen).size,123);assert.equal(seen.length,123);
    const beyond=await (await get("?page=9999&limit=50&action=Paging")).json();
    assert.equal(beyond.page,3);assert.equal(beyond.items.length,23);
    const filtered=await (await get("?page=2&limit=25&action=Paging%20even")).json();
    assert.equal(filtered.total,62);assert.ok(filtered.items.every(row=>row.action==="Paging even"));
    const dates=await (await get("?page=1&from=2026-10-01&to=2026-10-01&action=Date%20boundary")).json();
    assert.deepEqual(new Set(dates.items.map(row=>row.id)),new Set(["ph-start","ph-end"]));
    assert.deepEqual((await (await get("?page=1&action=%27%20OR%201%3D1")).json()).items,[]);
    assert.ok(Array.isArray(await (await get("?limit=50")).json()),"legacy dashboard contract stays an array");
    for(const query of ["?page=-1","?page=1&limit=101","?page=1&limit=1.5","?page=1&from=2026-99-99","?page=1&from=2026-02-30","?page=1&from=2026-10-02&to=2026-10-01"]) assert.equal((await get(query)).status,422,query);
    assert.equal((await get("?page=1",manager.token)).status,403);
    assert.equal(store.all("audit").length,originalCount,"paging never deletes history");
  } finally {await app.close();}
});
