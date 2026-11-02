import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { Store } from '../server/store.js';
import { Service } from '../server/service.js';
import { bootstrap } from '../server/bootstrap.js';
import { createApp } from '../server/index.js';
import { groupDemoRecipients } from '../server/group-demo-config.js';

test('an existing phone subscription can be refreshed through the Tenant button for this live-demo session', {timeout:60000},async()=>{
  const store=new Store(':memory:'),service=new Service(store),password='LiveDemoFixture!2026';
  bootstrap(service,{demo:true,adminPassword:password,managerPassword:password,tenantPassword:password});
  const user=store.get('users','usr-tenant');store.save('users',{...user,email:groupDemoRecipients[0]});
  const since=new Date().toISOString();
  const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/browser-fixture',keys:{p256dh:'A'.repeat(88),auth:'A'.repeat(22)}};
  const id=createHash('sha256').update(user.id+subscription.endpoint).digest('hex');
  store.save('subscriptions',{id,userId:user.id,createdAt:'2020-01-01T00:00:00Z',subscription});
  const origin='http://127.0.0.1:8127';
  const app=createApp({store,env:{ALLOWED_ORIGINS:origin,RENTARA_PROFILE:'demo',DEMO_LIVE_DELIVERY:'true',DEMO_LIVE_SINCE:since,VAPID_PUBLIC_KEY:'AQ',VAPID_PRIVATE_KEY:'fixture',VAPID_SUBJECT:'mailto:team@example.test'}});
  let browser;
  try {
    await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(8127,'127.0.0.1',resolve)});
    browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.addInitScript((value)=>{
      const sub={toJSON:()=>value};
      const registration={pushManager:{getSubscription:async()=>sub}};
      Object.defineProperty(navigator,'serviceWorker',{value:{getRegistration:async()=>registration,register:async()=>registration,ready:Promise.resolve(registration)},configurable:true});
      Object.defineProperty(window,'Notification',{value:{permission:'granted',requestPermission:async()=>'granted'},configurable:true});
      Object.defineProperty(window,'PushManager',{value:function(){},configurable:true});
    },subscription);
    await page.goto(origin+'/#/login');
    await page.locator('#login-email').fill(groupDemoRecipients[0]);
    await page.locator('#login-password').fill(password);
    await page.locator('[data-sign-in]').click();
    await expect(page.locator('.app-shell')).toBeVisible();
    await page.goto(origin+'/#/tenant/notifications');
    const button=page.getByRole('button',{name:'Refresh device registration'});
    await expect(button).toBeVisible();
    const [response]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/notifications/push-subscription')&&r.request().method()==='POST'),button.click()]);
    assert.equal(response.status(),200);
    assert.ok(Date.parse(store.get('subscriptions',id).createdAt)>=Date.parse(since));
    assert.equal(store.all('subscriptions').length,1,'Refresh preserves the device identity');
    await expect(page.locator('[data-push-status]')).toHaveText('Browser subscription registered');
  } finally {await browser?.close();await app.close();}
});
