import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium,expect } from '@playwright/test';
import { mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../server/store.js';
import { setupGroupDemo } from '../server/group-demo-setup.js';
import { prepareWorkspaceDemo,workspaceDemoAccounts,workspaceDemoPassword } from '../tools/prepare-workspace-demo.mjs';
import { createApp } from '../server/index.js';
import { Integrations } from '../server/integrations.js';
import { utilityPdf } from './fixtures.js';

test('Admin inspects shared records with URL workspace context, read-only receipt view, refresh consistency and safe logout Back', {timeout:120000},async()=>{
  const dir=mkdtempSync(join(tmpdir(),'rentara-admin-browser-'));let app,browser;
  try{
    setupGroupDemo(dir,[{name:'Tenant A One',email:'a1@example.test',unit:'A'},{name:'Tenant A Two',email:'a2@example.test',unit:'A'},{name:'Tenant A Three',email:'a3@example.test',unit:'B'}]);
    const seed=await prepareWorkspaceDemo(dir);const origin='http://127.0.0.1:8128';
    app=createApp({store:new Store(join(dir,'propertypro.sqlite')),dataDir:dir,env:{ALLOWED_ORIGINS:origin}});
    await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(8128,'127.0.0.1',resolve)});
    browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#/login');await page.locator('#login-email').fill('admin@propertypro.ph');await page.locator('#login-password').fill(workspaceDemoPassword);await page.locator('[data-sign-in]').click();
    await expect(page.locator('#page-title')).toHaveText('System Dashboard');
    await page.getByRole('link',{name:'Inspect workspaces'}).click();
    await page.locator('[data-admin-workspace]').selectOption(seed.testWorkspaceId);
    await expect(page.locator('[data-admin-context]')).toContainText('Bayan Demo Rentals');
    await expect(page.locator('[data-admin-context]')).toContainText('Read-only');
    await page.getByRole('navigation',{name:'Workspace sections'}).getByRole('link',{name:'Tenants',exact:true}).click();
    await page.getByRole('link',{name:'Bayan Demo Tenant One',exact:true}).click();
    await expect(page.locator('#page-title')).toHaveText('Bayan Demo Rentals');
    await expect(page.locator('.page')).toContainText(workspaceDemoAccounts.tenants[0]);
    await expect(page.locator('.page').getByRole('button',{name:/confirm|authorize|edit|mark paid/i})).toHaveCount(0);
    const detailUrl=page.url();
    app.store.withWorkspace(seed.testWorkspaceId,()=>{
      const t=app.store.get('tenants',seed.tenants[0].tenantId);
      app.service.writeEntity(app.store.get('users',seed.managerId),'tenants',{phone:'09123456789'},t.id);
    });
    await page.reload();await expect(page.locator('.page')).toContainText('09123456789');
    await page.getByRole('link',{name:/View bill/}).first().click();
    await expect(page.locator('.bill-detail')).toBeVisible();
    await page.goBack();await expect(page.locator('.page')).toContainText('09123456789');
    assert.equal(page.url(),detailUrl);
    await page.goto(origin+'/#/admin/settings');
    await page.getByRole('table',{name:'User accounts'}).getByRole('row').filter({hasText:workspaceDemoAccounts.tenants[0]}).getByRole('link',{name:'View Tenant',exact:true}).click();
    await expect(page.locator('[data-admin-context]')).toContainText('Bayan Demo Rentals');
    await expect(page.locator('.page')).toContainText('09123456789');
    // Prepare a confirmed rent receipt using its actual owning Manager in disposable data.
    const receiptId=app.store.withWorkspace(seed.testWorkspaceId,()=>{
      const t=app.store.get('users',seed.tenants[0].userId),m=app.store.get('users',seed.managerId);
      const bill=app.service.bills(t).find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');
      const report=app.service.report(t,bill.id,{method:'cash'});return app.service.confirm(m,report.payment.id).receiptNumber;
    });
    await page.goto(origin+`/#/admin/workspace?workspaceId=${seed.testWorkspaceId}&view=bills&receiptId=${receiptId}`);
    await page.getByRole('button',{name:'View rent receipt',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.frameLocator('iframe[title="System-generated rent receipt"]').getByRole('heading',{name:'Rent payment receipt'})).toBeVisible();
    await page.keyboard.press('Escape');
    for(const width of [820,390,320]){
      await page.setViewportSize({width,height:900});
      await page.goto(origin+`/#/admin/workspace?workspaceId=${seed.testWorkspaceId}&view=tenants`);
      await expect(page.locator('[data-admin-context]')).toBeVisible();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page-level overflow at '+width);
    }
    // Clear through the same session event used by the real logout workflow.
    await page.evaluate(async()=>{
      const {default:session}=await import('/src/auth/session.js');
      await fetch('/api/v1/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+session.token}});
      session.clear();window.dispatchEvent(new CustomEvent('app:signed-out'));
    });
    await expect(page.locator('#login-email')).toBeVisible();await page.goBack();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('[data-admin-context]')).toHaveCount(0);
    assert.deepEqual(errors,[]);
  }finally{await browser?.close();await app?.close();rmSync(dir,{recursive:true,force:true})}
});

test('malicious Tenant, email and OCR text stays inert in text, quoted attributes, URLs and generated receipts', {timeout:120000},async()=>{
  const dir=mkdtempSync(join(tmpdir(),'rentara-admin-xss-'));let app,browser,integration;
  try{
    setupGroupDemo(dir,[{name:'Tenant A One',email:'a1@example.test',unit:'A'},{name:'Tenant A Two',email:'a2@example.test',unit:'A'},{name:'Tenant A Three',email:'a3@example.test',unit:'B'}]);
    const seed=await prepareWorkspaceDemo(dir),store=new Store(join(dir,'propertypro.sqlite'));
    const origin='http://127.0.0.1:8129';app=createApp({store,dataDir:dir,env:{ALLOWED_ORIGINS:origin}});
    const payload=`javascript:window.__securityAttack=7 ' "><img src=x onerror="window.__securityAttack=1">`;
    let sourceId,receiptId;
    await store.withWorkspace(seed.testWorkspaceId,async()=>{
      const manager=store.get('users',seed.managerId),tenant=store.get('users',seed.tenants[0].userId);
      app.service.writeEntity(manager,'tenants',{fullName:payload,phone:`\" autofocus onfocus=\"window.__securityAttack=2`,emergencyContactName:payload},tenant.tenantId);
      integration=new Integrations(app.service,join(dir,'workspaces',seed.testWorkspaceId),{});
      const summary=['Meralco','Account: G3B-E001','Amount Due: 100.01','Due Date: 2027-01-20','Billing Period: 2026-12-15 to 2027-01-14',payload].join('\n');
      const [email]=await integration.ingestEmail(Buffer.from(`From: fixture@example.test\r\nSubject: ${payload.replace(/[\r\n]/g,'')}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${summary}`));
      assert.equal(email.document.ocrStatus,'validated');sourceId=email.document.id;
      // Exercise the normal OCR-ingestion boundary with a controlled extraction result.
      // This is not an OCR accuracy measurement or an actual Tesseract invocation.
      const ocrText=summary.replace('2026-12-15 to 2027-01-14','2027-01-15 to 2027-02-14').replace('2027-01-20','2027-02-20');
      const ocr=await integration.ingest(utilityPdf(ocrText),'synthetic-ocr.pdf','application/pdf',{},async()=>({text:ocrText,confidence:100}));
      assert.equal(ocr.document.ocrStatus,'validated');
      // Defense in depth: render contaminated stored extracted/line text too,
      // even though supported provider validation normally canonicalizes it.
      store.save('incoming',{...store.get('incoming',sourceId),provider:payload});
      for(const b of store.all('bills').filter(b=>b.sourceId===sourceId))store.save('bills',{...b,lines:b.lines.map(l=>({...l,label:payload}))});
      const rent=app.service.bills(tenant).find(b=>b.lines.every(l=>l.category==='rent')&&b.paymentStatus==='unpaid');
      const report=app.service.report(tenant,rent.id,{method:'cash',reference:payload});
      receiptId=app.service.confirm(manager,report.payment.id).receiptNumber;
    });
    await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(8129,'127.0.0.1',resolve)});
    browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
    const page=await browser.newPage();await page.addInitScript(()=>{window.__securityAttack=0});
    await page.goto(origin+'/#/login');await page.locator('#login-email').fill('admin@propertypro.ph');await page.locator('#login-password').fill(workspaceDemoPassword);await page.locator('[data-sign-in]').click();await expect(page.locator('#page-title')).toHaveText('System Dashboard');
    await page.goto(origin+`/#/admin/workspace?workspaceId=${seed.testWorkspaceId}&view=tenants&q=${encodeURIComponent(payload)}`);
    await expect(page.locator('input[name="q"]')).toHaveValue(payload);
    const tenantLink=page.getByRole('table',{name:'Read-only Tenants'}).getByRole('link',{name:payload,exact:true});await expect(tenantLink).toBeVisible();
    assert.match(await tenantLink.getAttribute('href'),/^#\/admin\/workspace\?/);
    await tenantLink.click();await expect(page.locator('.page')).toContainText(payload);
    assert.equal(await page.locator('.page img,.page [onerror],.page [onfocus]').count(),0);
    const billId=store.withWorkspace(seed.testWorkspaceId,()=>store.all('bills').find(b=>b.sourceId===sourceId&&b.tenantId===seed.tenants[0].tenantId).id);
    await page.goto(origin+`/#/admin/workspace?workspaceId=${seed.testWorkspaceId}&view=bills&billId=${billId}`);
    await expect(page.locator('.bill-detail')).toContainText(payload);
    assert.equal(await page.locator('.page img,.page [onerror],.page [onfocus]').count(),0);
    const unsafe=await page.locator('a[href],img[src],iframe[src]').evaluateAll(elements=>elements.map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(v=>/^\s*(javascript|vbscript|data):/i.test(v)));
    assert.deepEqual(unsafe,[]);assert.equal(await page.evaluate(()=>window.__securityAttack),0);
    await page.goto(origin+`/#/admin/workspace?workspaceId=${seed.testWorkspaceId}&view=bills&receiptId=${receiptId}`);
    await page.getByRole('button',{name:'View rent receipt',exact:true}).click();
    const frame=page.frameLocator('iframe[title="System-generated rent receipt"]');await expect(frame.getByRole('heading',{name:'Rent payment receipt'})).toBeVisible();
    await expect(frame.locator('body')).toContainText(payload);assert.equal(await frame.locator('img,script,[onerror],[onfocus]').count(),0);
    assert.equal(await page.evaluate(()=>window.__securityAttack),0);
  }finally{await browser?.close();await integration?.close();await app?.close();rmSync(dir,{recursive:true,force:true})}
});
