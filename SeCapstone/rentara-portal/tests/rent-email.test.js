import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../server/store.js";
import { Service } from "../server/service.js";
import { bootstrap } from "../server/bootstrap.js";
import { RentEmail } from "../server/rent-email.js";
import { rentEmailTemplate } from "../server/rent-email-template.js";
import { philippineDate, addDays } from "../server/rules.js";

const env = { RENT_EMAIL_ENABLED: "true", SMTP_HOST: "smtp.example.test", SMTP_FROM: "portal@example.test", SMTP_USER: "sender", SMTP_PASSWORD: "synthetic-password", PORTAL_URL: "https://portal.example.test/" };
function fixture(t) {
  const s = new Store(":memory:");
  const v = new Service(s);
  bootstrap(v, { adminPassword: "EmailTests!2026", managerPassword: "EmailTests!2026", tenantPassword: "EmailTests!2026", demo: true });
  t.after(() => s.close());
  const user = s.get("users", "usr-tenant");
  const bill = s.all("bills").find(b => b.tenantId === user.tenantId);
  return { s, v, user, bill, manager: s.get("users", "usr-manager") };
}

test("rent updates and confirmed payments send once; utilities and unrelated messages never email", async t => {
  const { s, v, user, bill, manager } = fixture(t);
  const messages = [];
  const transport = { async sendMail(message) { messages.push(message); return { accepted: [message.to.address] }; } };
  const email = new RentEmail(v, env, transport);
  const utility = { ...bill, id: "utility-test", cycleKey: "utility-test", lines: [{ category: "water", amount: 10 }], totalDue: 10 };
  v.publishBill(utility);
  v.notify(user.tenantId, "Manager message", "Private message", "billing", "message-test");
  await Promise.all([email.deliver(), email.deliver()]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to.address, user.email);
  assert.match(messages[0].text, /https:\/\/portal.example.test\/#\/tenant\/bills/);
  assert.doesNotMatch(messages[0].text, /LocalDemo|EmailTests/);
  assert.match(messages[0].html, /View bill/);
  assert.doesNotMatch(messages[0].html, /LocalDemo|EmailTests/);
  assert.ok(messages[0].text.includes(`Bill total: PHP ${bill.totalDue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`));
  assert.ok(messages[0].text.includes(`Billing month: ${bill.cycle}`));
  assert.match(messages[0].html, /Due date/);
  assert.match(messages[0].text, /Includes advance rent/);
  assert.equal(s.get("bills", bill.id).paymentStatus, "unpaid");
  const report = v.report(user, bill.id, { method: "cash" });
  v.confirm(manager, report.payment.id);
  v.confirm(manager, report.payment.id);
  await email.deliver();
  assert.equal(messages.length, 2);
  assert.match(messages[1].subject, /payment confirmed/);
  await new RentEmail(v, env, transport).deliver();
  assert.equal(messages.length, 2);
  assert.equal(s.all("notifications").filter(n => n.emailDelivery === "accepted").length, 2);
});

test("rent templates escape recipient text and reject unsafe portal links", () => {
  for (const type of ["rent-update", "rent-reminder", "rent-confirmed"]) {
    const message = rentEmailTemplate({type, name:'<img src=x onerror="alert(1)">', portalUrl:'https://portal.example.test/#/tenant/bills'});
    assert.ok(message.html.includes('&lt;img'));
    assert.ok(!message.html.includes('<img'));
    assert.ok(message.text.includes('https://portal.example.test/#/tenant/bills'));
    assert.match(message.html, /Manage rent email preferences/);
  }
  assert.throws(() => rentEmailTemplate({type:'rent-update',portalUrl:'javascript:alert(1)'}));
  assert.throws(() => rentEmailTemplate({type:'rent-update',portalUrl:'https://user:password@example.test/'}));
});

test("unconfigured SMTP and Tenant opt-out keep portal records and suppress email", async t => {
  const { s, v, user } = fixture(t);
  let sends = 0;
  const transport = { async sendMail() { sends++; throw new Error("must not send"); } };
  await new RentEmail(v, {}, transport).deliver();
  assert.equal(sends, 0);
  assert.equal(s.all("notifications").find(n => n.tenantId === user.tenantId).emailDelivery, "unconfigured");
  await new RentEmail(v, env, transport).deliver();
  assert.equal(sends, 0, "old unconfigured alerts are not retroactively emailed");
  const bill = s.all("bills").find(b => b.tenantId === user.tenantId);
  v.profile(user, { preferences: { emailRent: false } });
  v.publishBill({ ...bill, revision: bill.revision + 1 });
  await new RentEmail(v, env, transport).deliver();
  assert.equal(sends, 0);
  assert.equal(s.all("notifications").find(n => n.emailRevision === 2 && n.tenantId === user.tenantId).emailDelivery, "skipped");
});

test("SMTP retries are delayed and bounded; uncertain submissions are never repeated", async t => {
  const { s, v, user } = fixture(t);
  let attempts = 0;
  const email = new RentEmail(v, env, { async sendMail() { attempts++; throw Object.assign(new Error("sensitive detail"), { code: "EAUTH" }); } });
  const now = new Date();
  await email.deliver(now);
  await email.deliver(now);
  assert.equal(attempts, 1);
  await email.deliver(new Date(now.getTime() + 300001));
  await email.deliver(new Date(now.getTime() + 600002));
  await email.deliver(new Date(now.getTime() + 900003));
  assert.equal(attempts, 3);
  const n = s.all("notifications").find(n => n.tenantId === user.tenantId);
  assert.equal(n.emailDelivery, "exhausted");
  assert.equal(n.emailFailure, "Email submission failed");
  s.save("notifications", { ...n, emailDelivery: "sending" });
  await new RentEmail(v, env, email.transport).deliver();
  assert.equal(s.get("notifications", n.id).emailDelivery, "unknown");
  assert.equal(attempts, 3);
});

test("rent reminders expire after payment reports or a missed day", async t => {
  const { s, v, user, bill } = fixture(t);
  for (const n of s.all("notifications")) s.save("notifications", { ...n, emailDelivery: "skipped" });
  const today = philippineDate();
  const current = { ...bill, dueDate: addDays(today, 3), createdAt: addDays(today, -1) + "T00:00:00Z" };
  v.saveBill(current);
  v.reminders(today, new Date(today + "T09:00:00+08:00"));
  const reminder = s.all("notifications").find(n => n.emailType === "rent-reminder" && n.tenantId === user.tenantId);
  assert.ok(reminder);
  let sends = 0;
  const transport = { async sendMail(message) { sends++; return { accepted: [message.to.address] }; } };
  v.report(user, bill.id, { method: "cash" });
  await new RentEmail(v, env, transport).deliver();
  assert.equal(s.get("notifications", reminder.id).emailDelivery, "skipped");
  s.save("notifications", { ...reminder, emailDelivery: "pending" });
  v.saveBill({ ...current, paymentStatus: "unpaid" });
  await new RentEmail(v, env, transport).deliver(new Date(today + "T09:02:00+08:00"));
  assert.equal(s.get("notifications", reminder.id).emailDelivery, "skipped", "a missed first attempt is not sent later the same day");
  s.save("notifications", { ...reminder, emailDelivery: "pending" });
  await new RentEmail(v, env, transport).deliver(new Date(addDays(today, 1) + "T09:00:00+08:00"));
  assert.equal(sends, 0);
});

test("eligible rent reminder is accepted once and stale rent revisions are skipped", async t => {
  const { s, v, user, bill } = fixture(t);
  const current = { ...bill, revision: bill.revision + 1, dueDate: addDays(philippineDate(), 3), createdAt: addDays(philippineDate(), -1) + "T00:00:00Z" };
  v.saveBill(current);
  v.reminders(philippineDate(), new Date(philippineDate() + "T09:00:00+08:00"));
  const messages = [];
  const email = new RentEmail(v, env, { async sendMail(message) { messages.push(message); return { accepted: [message.to.address] }; } });
  await email.deliver(new Date(philippineDate() + "T09:00:00+08:00"));
  await email.deliver(new Date(philippineDate() + "T09:00:00+08:00"));
  assert.equal(messages.length, 1);
  assert.match(messages[0].subject, /due-date reminder/);
  assert.equal(s.all("notifications").find(n => n.emailType === "rent-update" && n.tenantId === user.tenantId).emailDelivery, "skipped");
});
