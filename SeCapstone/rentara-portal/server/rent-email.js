import nodemailer from "nodemailer";
import { philippineDate, addDays } from "./rules.js";
import { rentEmailTemplate } from "./rent-email-template.js";

const TYPES = new Set(["rent-update", "rent-reminder", "rent-confirmed"]);
const TERMINAL = new Set(["accepted", "skipped", "unconfigured", "unknown", "exhausted"]);

/** SMTP acceptance is recorded independently of portal and Web Push delivery. */
export class RentEmail {
  constructor(service, env = process.env, transport = null) {
    this.service = service;
    this.s = service.s;
    this.env = env;
    this.transport = transport;
    this.sending = false;
  }
  configured() {
    return this.env.RENT_EMAIL_ENABLED === "true" && Boolean(this.env.SMTP_HOST && this.env.SMTP_FROM && this.env.SMTP_USER && this.env.SMTP_PASSWORD);
  }
  async deliver(now = new Date()) {
    if (this.sending) return { accepted: 0, busy: true };
    this.sending = true;
    let accepted = 0;
    let submitted = 0;
    try {
      for (const notification of this.s.all("notifications").filter(n => TYPES.has(n.emailType) && !TERMINAL.has(n.emailDelivery))) {
        const n = this.s.get("notifications", notification.id);
        const save = (patch) => this.s.save("notifications", { ...this.s.get("notifications", n.id), ...patch });
        // A restart during SMTP submission leaves an uncertain outcome. Do not send twice.
        if (n.emailDelivery === "sending") { save({ emailDelivery: "unknown", emailFailure: "Interrupted submission; acceptance is unknown" }); continue; }
        if (!this.configured()) { save({ emailDelivery: "unconfigured" }); continue; }
        const bill = this.s.get("bills", n.emailBillId);
        const user = this.s.all("users").find(u => u.role === "tenant" && u.tenantId === n.tenantId && u.status === "active");
        const preference = n.emailType === "rent-reminder" ? "reminder" : n.emailType === "rent-confirmed" ? "payment" : "billing";
        const today = philippineDate(now);
        const firstReminderAttemptMissed = n.emailType === "rent-reminder" && !(n.emailAttempts > 0) &&
          (now < new Date(today + "T09:00:00+08:00") || now >= new Date(today + "T09:01:00+08:00"));
        const stale = !bill || bill.tenantId !== n.tenantId || !this.service.isRent(bill) ||
          (n.emailRevision !== undefined && bill.revision !== n.emailRevision) ||
          (n.emailType === "rent-reminder" && (bill.paymentStatus !== "unpaid" || philippineDate(new Date(n.timestamp)) !== today || addDays(bill.dueDate, -3) !== today || firstReminderAttemptMissed)) ||
          (n.emailType === "rent-confirmed" && bill.paymentStatus !== "paid");
        if (stale || !user || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(user.email ?? "") || user.preferences?.emailRent === false || user.preferences?.[preference] === false) {
          save({ emailDelivery: "skipped" }); continue;
        }
        if ((n.emailAttempts ?? 0) >= 3) { save({ emailDelivery: "exhausted" }); continue; }
        if (n.emailNextAttempt && now < new Date(n.emailNextAttempt)) continue;
        let portal;
        try {
          portal = new URL(this.env.PORTAL_URL || "http://localhost:8080/");
          if (!["http:", "https:"].includes(portal.protocol) || portal.username || portal.password) throw new Error();
          portal.hash = "/tenant/bills";
        } catch { save({ emailDelivery: "unconfigured", emailFailure: "Valid portal URL required" }); continue; }
        if (!this.transport) {
          const port = Number(this.env.SMTP_PORT || 587);
          this.transport = nodemailer.createTransport({
            host: this.env.SMTP_HOST, port, secure: port === 465,
            requireTLS: port !== 465,
            auth: { user: this.env.SMTP_USER, pass: this.env.SMTP_PASSWORD },
            connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
            disableFileAccess: true, disableUrlAccess: true,
          });
        }
        const attempts = (n.emailAttempts ?? 0) + 1;
        if (submitted >= 20) break;
        submitted++;
        save({ emailDelivery: "sending", emailAttempts: attempts, emailLastAttempt: now.toISOString() });
        try {
          const info = await this.transport.sendMail({
            from: this.env.SMTP_FROM,
            to: { address: user.email, name: user.name },
            ...rentEmailTemplate({ type: n.emailType, name: user.name, portalUrl: portal.href, bill }),
            messageId: `<${n.id}@propertypro.local>`,
          });
          if (!(info.accepted ?? []).some(address => String(address).toLowerCase() === user.email.toLowerCase())) throw Object.assign(new Error(), { code: "EENVELOPE" });
          save({ emailDelivery: "accepted", emailAcceptedAt: now.toISOString(), emailFailure: null, emailNextAttempt: null });
          accepted++;
        } catch (error) {
          // Retry explicit rejection/connection failures; an interrupted DATA submission may already be accepted.
          const uncertain = error.command === "DATA" && !error.responseCode;
          save({ emailDelivery: uncertain ? "unknown" : attempts >= 3 ? "exhausted" : "failed", emailFailure: uncertain ? "SMTP outcome unknown; not automatically retried" : "Email submission failed", emailNextAttempt: new Date(now.getTime() + 300000).toISOString() });
        }
      }
      return { accepted, configured: this.configured() };
    } finally { this.sending = false; }
  }
  close() { this.transport?.close?.(); this.transport = null; }
}
