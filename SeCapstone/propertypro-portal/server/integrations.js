import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { newId } from "./store.js";
import { parseUtilityText, requireValue, philippineDate } from "./rules.js";

export class Integrations {
  constructor(service, dataDir, env = process.env) {
    this.service = service;
    this.s = service.s;
    this.dataDir = dataDir;
    this.env = env;
    this.worker = null;
    this.syncing = false;
    this.ticking = false;
    this.imageQueue = Promise.resolve();
  }
  async extract(buffer, type) {
    if (type === "application/pdf") {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const task = getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        isEvalSupported: false,
      });
      let pdf;
      try {
        pdf = await task.promise;
        requireValue(pdf.numPages <= 50, "PDF exceeds 50-page limit");
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text +=
            content.items
              .map((item) => item.str + (item.hasEOL ? "\n" : " "))
              .join("") + "\n";
        }
        requireValue(
          text.trim().length > 20,
          "PDF has no usable digital text; upload a clear image for OCR",
        );
        return { text, confidence: 100 };
      } finally {
        await task.destroy();
      }
    }
    if (["image/png", "image/jpeg"].includes(type)) {
      const pending = this.imageQueue.then(() => this.extractImage(buffer));
      this.imageQueue = pending.catch(() => {});
      return pending;
    }
    throw new Error(
      "Unsupported attachment: only digital PDF, PNG, and JPEG are supported",
    );
  }
  async extractImage(buffer) {
    const { createWorker } = await import("tesseract.js");
    const { default: english } = await import("@tesseract.js-data/eng");
    const cachePath = join(this.dataDir, "temp");
    await fs.mkdir(cachePath, { recursive: true });
    this.worker ??= await createWorker("eng", 1, {
      langPath: this.env.OCR_LANG_PATH || english.langPath,
      cachePath,
    });
    const { data } = await this.worker.recognize(buffer);
    requireValue(
      data.confidence >= 50 && data.text.trim().length > 20,
      "Image is unreadable or extraction confidence is insufficient",
    );
    return { text: data.text, confidence: data.confidence };
  }
  async ingest(buffer, filename, type, metadata = {}, extractor) {
    requireValue(
      Buffer.isBuffer(buffer) &&
        buffer.length > 0 &&
        buffer.length <= 10 * 1024 * 1024,
      "Attachment must be between 1 byte and 10 MB",
    );
    const id = newId("ocr"),
      hash = createHash("sha256").update(buffer).digest("hex");
    const safeName = String(filename)
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .slice(0, 150);
    await fs.mkdir(join(this.dataDir, "sources"), { recursive: true });
    await fs.writeFile(join(this.dataDir, "sources", id), buffer);
    let extracted = { text: "", confidence: 0 },
      extractionError = null;
    try {
      extracted = await (extractor ?? this.extract.bind(this))(buffer, type);
    } catch (e) {
      extractionError = String(e.message).slice(0, 500);
    }
    const doc = {
      id,
      filename: safeName,
      contentType: type,
      documentHash: hash,
      receivedAt: new Date().toISOString(),
      ocrStatus: "processing",
      confidence: extracted.confidence,
      rawText: extracted.text,
      extractionError,
      revision: 1,
      ...metadata,
      ...parseUtilityText(extracted.text),
    };
    this.s.save("incoming", doc);
    this.s.activity("Utility Bill Received", safeName);
    return this.service.processIncoming(id);
  }
  async ingestEmail(raw, metadata = {}, extractor) {
    const { simpleParser } = await import("mailparser");
    const mail = await simpleParser(raw, {
      skipHtmlToText: true,
      skipTextToHtml: true,
    });
    requireValue(
      mail.attachments.length <= 30,
      "Email exceeds attachment limit",
    );
    const results = [];
    for (const a of mail.attachments)
      results.push(
        await this.ingest(
          a.content,
          a.filename ?? "attachment",
          a.contentType,
          { ...metadata, messageId: mail.messageId ?? null },
          extractor,
        ),
      );
    return results;
  }
  async syncMailbox(user) {
    this.service.role(user, "manager");
    requireValue(
      !this.syncing,
      "Mailbox synchronization is already running",
      409,
    );
    requireValue(
      this.env.IMAP_HOST &&
        this.env.IMAP_USER &&
        (this.env.IMAP_PASSWORD || this.env.IMAP_ACCESS_TOKEN),
      "Mailbox is not configured. Set the IMAP account credentials locally.",
      503,
    );
    this.syncing = true;
    let client;
    try {
      const { ImapFlow } = await import("imapflow");
      client = new ImapFlow({
        host: this.env.IMAP_HOST,
        port: Number(this.env.IMAP_PORT || 993),
        secure: true,
        auth: this.env.IMAP_ACCESS_TOKEN
          ? {
              user: this.env.IMAP_USER,
              accessToken: this.env.IMAP_ACCESS_TOKEN,
            }
          : { user: this.env.IMAP_USER, pass: this.env.IMAP_PASSWORD },
        logger: false,
        connectionTimeout: 15000,
        socketTimeout: 30000,
      });
      await client.connect();
      const lock = await client.getMailboxLock(
        this.env.IMAP_MAILBOX || "INBOX",
      );
      let imported = 0;
      try {
        const uids = await client.search({ all: true }, { uid: true }),
          validity = String(client.mailbox.uidValidity);
        for (const uid of uids) {
          const key = `${this.env.IMAP_HOST}:${this.env.IMAP_USER}:${validity}:${uid}`;
          if (this.s.get("intake_messages", key)) continue;
          if (imported >= 100) break;
          const msg = await client.fetchOne(
            uid,
            { source: { maxLength: 35 * 1024 * 1024 }, size: true },
            { uid: true },
          );
          if (!msg?.source) continue;
          requireValue(
            msg.size <= 35 * 1024 * 1024,
            "Email exceeds 35 MB intake limit",
          );
          await this.ingestEmail(msg.source, { mailboxUid: key });
          this.s.save("intake_messages", {
            id: key,
            processedAt: new Date().toISOString(),
          });
          imported++;
        }
      } finally {
        lock.release();
      }
      this.s.save("settings", {
        id: "last-intake",
        attemptedAt: Date.now(),
        status: "completed",
      });
      this.s.audit(user, "Mailbox synchronized", `${imported} messages`);
      return { imported };
    } finally {
      if (client) await client.logout().catch(() => {});
      this.syncing = false;
    }
  }
  async pushConfig() {
    return {
      publicKey: this.env.VAPID_PUBLIC_KEY ?? null,
      configured: Boolean(
        this.env.VAPID_PUBLIC_KEY &&
        this.env.VAPID_PRIVATE_KEY &&
        this.env.VAPID_SUBJECT,
      ),
    };
  }
  async deliver() {
    if (!this.service.config().pushEnabled)
      return { sent: 0, configured: false };
    const config = await this.pushConfig();
    if (!config.configured) return { sent: 0, configured: false };
    const { default: webpush } = await import("web-push");
    webpush.setVapidDetails(
      this.env.VAPID_SUBJECT,
      this.env.VAPID_PUBLIC_KEY,
      this.env.VAPID_PRIVATE_KEY,
    );
    let sent = 0;
    for (const n of this.s
      .all("notifications")
      .filter(
        (n) =>
          !["sent", "skipped"].includes(n.delivery) && (n.attempts ?? 0) < 5,
      )) {
      const user = this.s
        .all("users")
        .find((u) => u.tenantId === n.tenantId && u.status === "active");
      if (!user) continue;
      const preference =
        n.kind === "reminder"
          ? "reminder"
          : n.kind === "billing"
            ? "billing"
            : "payment";
      if (user.preferences?.[preference] === false) {
        this.s.save("notifications", { ...n, delivery: "skipped" });
        continue;
      }
      let subscriptions = this.s
        .all("subscriptions")
        .filter((s) => s.userId === user.id);
      if (!subscriptions.length) continue;
      const delivered = new Set(n.deliveredSubscriptions ?? []);
      let failures = 0;
      for (const sub of subscriptions) {
        if (delivered.has(sub.id)) continue;
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: n.title,
              body: n.body,
              id: n.id,
              url:
                this.env.PORTAL_URL ?? "http://localhost:8080/#/tenant/bills",
            }),
            { TTL: 86400, timeout: 10000 },
          );
          delivered.add(sub.id);
          sent++;
        } catch (e) {
          if ([404, 410].includes(e.statusCode))
            this.s.remove("subscriptions", sub.id);
          else failures++;
        }
      }
      this.s.save("notifications", {
        ...n,
        delivery: failures ? "failed" : delivered.size ? "sent" : "expired",
        attempts: (n.attempts ?? 0) + 1,
        deliveredSubscriptions: [...delivered],
        lastAttempt: new Date().toISOString(),
        failure: failures
          ? "Push delivery failed; portal record remains available"
          : null,
      });
    }
    return { sent, configured: true };
  }
  async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      const date = philippineDate();
      this.service.generateRent(date);
      this.service.reminders(date);
      this.s.save("settings", {
        id: "last-schedule",
        date,
        at: new Date().toISOString(),
      });
      const intake = this.s.get("settings", "last-intake");
      if (
        this.env.IMAP_HOST &&
        this.env.IMAP_USER &&
        (this.env.IMAP_PASSWORD || this.env.IMAP_ACCESS_TOKEN) &&
        Date.now() - Number(intake?.attemptedAt ?? 0) >= 300000
      ) {
        try {
          await this.syncMailbox({
            role: "manager",
            id: null,
            name: "System mailbox scheduler",
          });
          this.s.save("settings", {
            id: "last-intake",
            attemptedAt: Date.now(),
            status: "completed",
          });
        } catch (e) {
          this.s.save("settings", {
            id: "last-intake",
            attemptedAt: Date.now(),
            status: "failed",
            reason: e.message,
          });
          console.error("Mailbox intake:", e.message);
        }
      }
      await this.deliver();
    } finally {
      this.ticking = false;
    }
  }
  async services() {
    const push = await this.pushConfig(),
      intake = this.s.get("settings", "last-intake");
    const mailConfigured = Boolean(
      this.env.IMAP_HOST &&
      this.env.IMAP_USER &&
      (this.env.IMAP_PASSWORD || this.env.IMAP_ACCESS_TOKEN),
    );
    const pushDelivered = this.s
      .all("notifications")
      .some((n) => n.delivery === "sent");
    const checks = [
      [
        "svc-db",
        "Centralized database",
        this.s.db.prepare("PRAGMA integrity_check").get().integrity_check ===
          "ok",
        "SQLite integrity check",
      ],
      [
        "svc-mail",
        "Property-management mailbox intake",
        mailConfigured && intake?.status === "completed",
        mailConfigured
          ? intake?.status === "completed"
            ? "Last scheduled sync completed"
            : "Configured; successful mailbox sync has not been verified"
          : "IMAP credentials required",
      ],
      [
        "svc-ocr",
        "OCR extraction worker",
        true,
        "Digital PDF and bundled English image OCR adapter available",
      ],
      [
        "svc-rules",
        "Rule-based classification engine",
        true,
        "V01?V04, C01?C02, A01, R01",
      ],
      [
        "svc-push",
        "Web Push notification service",
        push.configured && pushDelivered,
        push.configured
          ? pushDelivered
            ? "Push transport accepted a notification"
            : "Configured; successful delivery has not been verified"
          : "VAPID configuration required",
      ],
      [
        "svc-queue",
        "Exception Queue",
        true,
        this.s.all("exceptions").filter((e) => e.state === "open").length +
          " open records",
      ],
    ];
    return checks.map(([id, name, ok, detail]) => ({
      id,
      name,
      status: ok ? "operational" : "degraded",
      detail,
    }));
  }
  async close() {
    await this.imageQueue;
    if (this.worker) await this.worker.terminate();
    this.worker = null;
  }
}
