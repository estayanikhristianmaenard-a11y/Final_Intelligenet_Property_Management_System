import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { newId } from "./store.js";
import { parseUtilityText, requireValue, philippineDate } from "./rules.js";
import { RentEmail } from "./rent-email.js";
import { systemStatus } from "./system-status.js";

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
    this.rentEmail = new RentEmail(service, env);
  }
  async extract(buffer, type) {
    if (type === "application/pdf") {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const task = getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        isEvalSupported: false,
        maxImageSize: 16_000_000,
      });
      let pdf;
      try {
        pdf = await task.promise;
        requireValue(pdf.numPages <= 50, "PDF exceeds 50-page limit");
        let text = "", confidence = 100, scannedPages = 0;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          try {
            const content = await page.getTextContent();
            const digitalText = content.items.map(item => item.str + (item.hasEOL ? "\n" : " ")).join("");
            if (digitalText.trim().length > 20) text += digitalText + "\n";
            else {
              requireValue(++scannedPages <= 3, "Scanned PDF exceeds the 3-page OCR limit; upload only the bill pages");
              const viewport = page.getViewport({scale:2});
              requireValue(viewport.width > 0 && viewport.height > 0 && viewport.width <= 4096 && viewport.height <= 4096 && viewport.width * viewport.height <= 8_000_000, "PDF page is too large for OCR; upload a smaller clear scan");
              const canvas = pdf.canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
              let image;
              try {
                await page.render({canvasContext:canvas.context, viewport}).promise;
                image = canvas.canvas.toBuffer("image/png");
              } finally { pdf.canvasFactory.destroy(canvas); }
              const result = await this.extract(image, "image/png");
              text += result.text + "\n";
              confidence = Math.min(confidence, result.confidence);
            }
          } finally { page.cleanup(); }
        }
        requireValue(
          text.trim().length > 20,
          "PDF contains no readable billing text; upload a clearer bill image",
        );
        return { text, confidence, scannedPages, method:scannedPages ? "pdf_ocr" : "pdf_text" };
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
      "Unsupported attachment: only PDF, PNG, and JPEG are supported",
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
    const existing = this.s.all("incoming").find(d => d.documentHash === hash);
    let sourceFileId = existing?.sourceFileId ?? existing?.id ?? `sha256-${hash}`;
    if (!/^[a-zA-Z0-9_-]+$/.test(sourceFileId)) sourceFileId = `sha256-${hash}`;
    try { await fs.access(join(this.dataDir,"sources",sourceFileId)); }
    catch {
      sourceFileId = `sha256-${hash}`;
      try { await fs.writeFile(join(this.dataDir,"sources",sourceFileId),buffer,{flag:"wx"}); }
      catch(error) { if (error.code !== "EEXIST") throw error; }
    }
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
      extractionMethod: extracted.method ?? null,
      scannedPages: extracted.scannedPages ?? 0,
      revision: 1,
      ...metadata,
      sourceFileId,
      ...parseUtilityText(extracted.text),
    };
    this.s.save("incoming", doc);
    this.s.activity("Utility Bill Received", safeName);
    return this.service.processIncoming(id);
  }
  async ingestEmail(raw, metadata = {}, extractor) {
    const { simpleParser } = await import("mailparser");
    const mail = await simpleParser(raw, {
      skipHtmlToText: false,
      skipTextToHtml: true,
    });
    requireValue(
      mail.attachments.length <= 30,
      "Email exceeds attachment limit",
    );
    const results = [];
    // Ignore unrelated attachment formats. They must not suppress a supported
    // body summary or create billing exceptions from ordinary correspondence.
    const billAttachments = mail.attachments.filter(a =>
      ["application/pdf", "image/png", "image/jpeg"].includes(a.contentType));
    for (const a of billAttachments)
      results.push(
        await this.ingest(
          a.content,
          a.filename ?? "attachment",
          a.contentType,
          { ...metadata, messageId: mail.messageId ?? null },
          extractor,
        ),
      );
    // Prefer supported attachments when present; avoid creating two records from one email.
    // Only recognized provider summaries enter the billing pipeline, not ordinary mail.
    const summary = String(mail.text || "").trim();
    const fields = parseUtilityText(summary);
    const billingLabels = summary.match(/\b(?:amount\s+due|due\s+date|billing\s+period|account\s*(?:number)?\s*:)/gi) || [];
    if (!billAttachments.length && fields.provider && billingLabels.length >= 2) {
      requireValue(Buffer.byteLength(summary, "utf8") <= 1024 * 1024, "Email summary exceeds 1 MB intake limit");
      results.push(await this.ingest(Buffer.from(summary, "utf8"), "billing-email.txt", "text/plain",
        { ...metadata, messageId:mail.messageId ?? null, intakeMethod:"email_body" },
        async () => ({text:summary, confidence:100})));
    }
    return results;
  }
  async mailboxClient() {
    const { ImapFlow } = await import("imapflow");
    return new ImapFlow({
      host: this.env.IMAP_HOST,
      port: Number(this.env.IMAP_PORT || 993),
      secure: true,
      auth: this.env.IMAP_ACCESS_TOKEN
        ? { user: this.env.IMAP_USER, accessToken: this.env.IMAP_ACCESS_TOKEN }
        : { user: this.env.IMAP_USER, pass: this.env.IMAP_PASSWORD },
      logger: false,
      connectionTimeout: 15000,
      socketTimeout: 30000,
    });
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
      client = await this.mailboxClient();
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
        ...this.s.get("settings","last-intake"),
        id: "last-intake",
        attemptedAt: Date.now(),
        successfulAt: new Date().toISOString(),
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
      let acceptedThisAttempt = false;
      let failures = 0;
      for (const sub of subscriptions) {
        if (delivered.has(sub.id)) continue;
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: n.title,
              body: "Sign in to Rentara to view your billing update.",
              id: n.id,
              url:
                this.env.PORTAL_URL ?? "http://localhost:8080/#/tenant/bills",
            }),
            { TTL: 86400, timeout: 10000 },
          );
          delivered.add(sub.id);
          acceptedThisAttempt = true;
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
        pushAcceptedAt:acceptedThisAttempt ? new Date().toISOString() : n.pushAcceptedAt ?? null,
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
      this.s.pruneExpiredSessions();
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
            workspaceId: this.s.workspaceId,
          });
          this.s.save("settings", {
            ...this.s.get("settings","last-intake"),
            id: "last-intake",
            attemptedAt: Date.now(),
            successfulAt:new Date().toISOString(),
            status: "completed",
          });
        } catch (e) {
          this.s.save("settings", {
            ...this.s.get("settings","last-intake"),
            id: "last-intake",
            attemptedAt: Date.now(),
            status: "failed",
            reason: e.message,
          });
          console.error("Mailbox intake:", e.message);
        }
      }
      await this.rentEmail.deliver();
      await this.deliver();
    } finally {
      this.ticking = false;
    }
  }
  async services() {
    return systemStatus(this);
  }
  async close() {
    this.rentEmail.close();
    await this.imageQueue;
    if (this.worker) await this.worker.terminate();
    this.worker = null;
  }
}
