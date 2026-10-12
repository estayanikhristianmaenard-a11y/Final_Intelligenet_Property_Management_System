import http from "node:http";
import { promises as fs } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Store, newId } from "./store.js";
import { Service, publicUser } from "./service.js";
import { Integrations } from "./integrations.js";
import { HttpError, requireValue, philippineDate } from "./rules.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function receiptHtml(r) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Receipt ${escape(r.id)}</title><style>body{font:16px system-ui;max-width:650px;margin:40px auto;line-height:1.8}dt{font-weight:bold}button{padding:10px}</style><h1>PropertyPro payment receipt</h1><p>${escape(r.id)}</p><dl>${Object.entries(
    {
      Tenant: r.tenantName,
      Bill: r.billId,
      "Amount received": `PHP ${Number(r.amount).toFixed(2)}`,
      Method: r.method,
      Reference: r.reference,
      "Confirmed by": r.confirmedBy,
      "Confirmed on": r.confirmedOn,
    },
  )
    .map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`)
    .join(
      "",
    )}</dl><p>Issued after Manager confirmation. This receipt records the payment; no bank verification is implied.</p></html>`;
}
const csv = (rows) => {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]).filter(
    (k) => !["passwordHash", "rawText"].includes(k),
  );
  const cell = (v) => {
    let s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return [
    keys.map(cell).join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
};
async function readBody(req) {
  let size = 0,
    parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    requireValue(size <= 15 * 1024 * 1024, "Request exceeds 15 MB", 413);
    parts.push(chunk);
  }
  if (!size) return {};
  requireValue(
    (req.headers["content-type"] ?? "").startsWith("application/json"),
    "Use application/json",
    415,
  );
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(parts).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  requireValue(
    parsed && typeof parsed === "object" && !Array.isArray(parsed),
    "JSON body must be an object",
    400,
  );
  return parsed;
}
function subscriptionAllowed(endpoint) {
  try {
    const u = new URL(endpoint);
    return (
      (u.protocol === "https:" &&
        [
          "fcm.googleapis.com",
          "updates.push.services.mozilla.com",
          "web.push.apple.com",
          "wns2-par02p.wns.windows.com",
        ].some((h) => u.hostname === h)) ||
      (u.protocol === "https:" && u.hostname.endsWith(".notify.windows.com"))
    );
  } catch {
    return false;
  }
}
export function createApp({
  store,
  env = process.env,
  dataDir = resolve(projectRoot, env.DATA_DIR || "data"),
  integrations,
} = {}) {
  const s = store ?? new Store(join(dataDir, "propertypro.sqlite")),
    service = new Service(s),
    external = integrations ?? new Integrations(service, dataDir, env);
  const allowed = new Set(
    (
      env.ALLOWED_ORIGINS ||
      "http://localhost,http://localhost:8080,http://127.0.0.1:8080"
    ).split(","),
  );
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");
    const respond = (body, status = 200, type = "application/json") => {
      res.writeHead(status, { "Content-Type": type + "; charset=utf-8" });
      res.end(type === "application/json" ? JSON.stringify(body) : body);
    };
    try {
      const url = new URL(req.url, "http://localhost"),
        path = decodeURIComponent(url.pathname),
        verb = req.method;
      if (origin) {
        requireValue(allowed.has(origin), "Origin is not allowed", 403);
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, PATCH, DELETE, OPTIONS",
        );
      }
      if (verb === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      if (!path.startsWith("/api/v1")) {
        requireValue(verb === "GET", "Method not allowed", 405);
        let file = path === "/" ? "/index.html" : path;
        requireValue(
          file === "/index.html" ||
            file === "/sw.js" ||
            file.startsWith("/src/"),
          "Not found",
          404,
        );
        const full = resolve(projectRoot, "." + file);
        requireValue(
          full.startsWith(projectRoot) && !file.includes(".."),
          "Not found",
          404,
        );
        const types = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
        };
        const bytes = await fs.readFile(full).catch(() => {
          throw new HttpError(404, "Not found");
        });
        res.writeHead(200, {
          "Content-Type": types[extname(full)] ?? "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        res.end(bytes);
        return;
      }
      const p = path.slice(7),
        query = Object.fromEntries(url.searchParams),
        body = ["POST", "PATCH", "PUT"].includes(verb)
          ? await readBody(req)
          : {};
      if (verb === "POST" && p === "/auth/login") {
        respond(service.login(body, req.socket.remoteAddress));
        return;
      }
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1],
        user = service.authenticate(token);
      let output;
      if (p === "/auth/me" && verb === "GET") output = user;
      else if (p === "/auth/logout" && verb === "POST")
        output = service.logout(token, user);
      else if (p === "/auth/profile" && verb === "PATCH")
        output = service.profile(user, body);
      else if (p === "/dashboard/stats" && verb === "GET") {
        service.role(user, "manager");
        output = service.stats();
      } else if (p === "/dashboard/activity" && verb === "GET") {
        service.role(user, "manager");
        const items = s
          .all("activity")
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        output = {
          items: items.slice(0, Math.min(Number(query.limit) || 12, 200)),
          total: items.length,
        };
      } else if (p === "/admin/users") {
        service.role(user, "admin");
        if (verb === "GET") output = s.all("users").map(publicUser);
        else if (verb === "POST") output = service.userWrite(user, body);
      } else if (/^\/admin\/users\/[^/]+$/.test(p) && verb === "PATCH")
        output = service.userWrite(user, body, p.split("/")[3]);
      else if (p === "/admin/audit" && verb === "GET") {
        service.role(user, "admin");
        output = s
          .all("audit")
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, Math.min(Number(query.limit) || 50, 5000));
      } else if (p === "/admin/services" && verb === "GET") {
        service.role(user, "admin");
        output = await external.services();
      } else if (p === "/admin/health" && verb === "POST") {
        service.role(user, "admin");
        output = await external.services();
        s.audit(user, "Health check completed", "services");
      } else if (p === "/admin/backup" && verb === "POST") {
        service.role(user, "admin");
        const name = `backup-${Date.now()}.sqlite`,
          dir = join(dataDir, "backups");
        await fs.mkdir(dir, { recursive: true });
        await s.backup(join(dir, name));
        s.audit(user, "Database backup completed", name);
        output = { filename: name };
      } else if (p === "/admin/ocr-restart" && verb === "POST") {
        service.role(user, "admin");
        await external.close();
        s.audit(user, "OCR worker restarted", "ocr");
        output = { ok: true };
      } else if (p === "/admin/purge" && verb === "POST") {
        service.role(user, "admin");
        const dir = join(dataDir, "temp");
        await fs.mkdir(dir, { recursive: true });
        let removed = 0;
        for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
          if (entry.isFile()) {
            await fs.unlink(join(dir, entry.name));
            removed++;
          }
        }
        s.audit(user, "Temporary files purged", String(removed));
        output = { removed };
      } else if (p === "/settings/profile" || p === "/settings/billing-rules") {
        service.role(user, "manager");
        if (verb === "GET") output = service.config();
        else if (verb === "PATCH") {
          requireValue(
            (body.allocationRule ?? "equal_split") === "equal_split" &&
              (body.prorateEnabled ?? false) === false &&
              (body.reminderDays ?? 3) === 3,
            "Policy requires equal allocation, non-prorated rent and three-day reminders",
          );
          requireValue(
            body.advanceRentEnabled !== false,
            "First-cycle advance rent is required by the research paper",
          );
          const current = service.config();
          output = s.save("settings", {
            ...current,
            intakeMailbox: String(
              body.intakeMailbox ?? current.intakeMailbox,
            ).slice(0, 200),
            pushEnabled:
              body.pushEnabled === undefined
                ? current.pushEnabled
                : Boolean(body.pushEnabled),
          });
          s.audit(user, "Billing configuration updated", "billing");
        }
      } else if (p === "/tenant/unit" && verb === "GET") {
        service.role(user, "tenant");
        const t = service.must("tenants", user.tenantId);
        output = service.units().find((u) => u.id === t.unitId);
      } else if (/^\/tenants\/[^/]+$/.test(p) && verb === "GET")
        output = service.tenant(user, p.split("/")[2]);
      else if (/^\/(properties|units|tenants|mappings)(\/[^/]+)?$/.test(p)) {
        service.role(user, "manager");
        const [, kind, id] = p.split("/");
        if (verb === "GET") {
          if (kind === "properties")
            output = id
              ? service.property(service.must(kind, id))
              : s.all(kind).map((x) => service.property(x));
          else if (kind === "units")
            output = id
              ? service.units().find((u) => u.id === id)
              : service.units(query);
          else if (kind === "tenants")
            output = id ? service.tenant(user, id) : service.tenants(query);
          else output = id ? service.must(kind, id) : s.all(kind);
        } else if (verb === "POST" && !id)
          output = service.writeEntity(user, kind, body);
        else if (verb === "PATCH" && id)
          output = service.writeEntity(user, kind, body, id);
        else if (verb === "DELETE" && id)
          output = service.deleteEntity(user, kind, id);
      } else if (
        /^\/tenants\/[^/]+\/(bills|payments|documents)$/.test(p) &&
        verb === "GET"
      ) {
        const [, , id, kind] = p.split("/");
        service.own(user, id);
        service.must("tenants", id);
        output =
          kind === "bills"
            ? service.bills(user, { tenantId: id })
            : kind === "payments"
              ? service.payments(user, { tenantId: id })
              : service.documents(user, id);
      } else if (/^\/tenants\/[^/]+$/.test(p) && verb === "GET")
        output = service.tenant(user, p.split("/")[2]);
      else if (p === "/bills" && verb === "GET")
        output = service.bills(user, query);
      else if (
        /^\/bills\/[^/]+$/.test(p) &&
        p !== "/bills/incoming" &&
        verb === "GET"
      ) {
        const b = service.must("bills", p.split("/")[2]);
        service.own(user, b.tenantId);
        output = b;
      } else if (p === "/bills/incoming" && verb === "GET") {
        service.role(user, "manager");
        output = s
          .all("incoming")
          .filter((d) => !query.status || d.ocrStatus === query.status)
          .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
      } else if (p === "/rent/generate" && verb === "POST") {
        service.role(user, "manager");
        output = service.generateRent();
      } else if (p === "/intake/sync" && verb === "POST")
        output = await external.syncMailbox(user);
      else if (p === "/intake/upload" && verb === "POST") {
        service.role(user, "manager");
        requireValue(
          typeof body.base64 === "string" &&
            /^[A-Za-z0-9+/]*={0,2}$/.test(body.base64),
          "Invalid attachment encoding",
        );
        output = await external.ingest(
          Buffer.from(body.base64, "base64"),
          body.filename,
          body.type,
        );
        s.audit(user, "Source uploaded", output.document.id);
      } else if (/^\/incoming\/[^/]+\/source$/.test(p) && verb === "GET") {
        service.role(user, "manager");
        const d = service.must("incoming", p.split("/")[2]);
        const buffer = await fs.readFile(join(dataDir, "sources", d.id));
        res.writeHead(200, {
          "Content-Type":
            d.contentType === "application/pdf"
              ? "application/pdf"
              : ["image/png", "image/jpeg"].includes(d.contentType)
                ? d.contentType
                : "application/octet-stream",
          "Content-Disposition": `attachment; filename="${d.filename.replaceAll('"', "")}"`,
        });
        res.end(buffer);
        s.audit(user, "Source downloaded", d.id);
        return;
      } else if (/^\/incoming\/[^/]+$/.test(p) && verb === "GET") {
        service.role(user, "manager");
        output = service.must("incoming", p.split("/")[2]);
      } else if (/^\/incoming\/[^/]+\/correct$/.test(p) && verb === "POST") {
        service.role(user, "manager");
        const id = p.split("/")[2];
        const existing =
          s
            .all("exceptions")
            .find((e) => e.sourceId === id && e.state === "open") ??
          s.save("exceptions", {
            id: newId("exc"),
            sourceId: id,
            billId: null,
            source: "incoming_bill",
            state: "open",
            reason: "Manager correction",
            title: id,
            fields: [],
            severity: "medium",
            raisedAt: new Date().toISOString(),
          });
        output = service.correctException(user, existing.id, body);
      } else if (p === "/payments" && verb === "GET")
        output = service.payments(user, query);
      else if (/^\/bills\/[^/]+\/correct-rent$/.test(p) && verb === "POST")
        output = service.correctRent(user, p.split("/")[2], body);
      else if (/^\/bills\/[^/]+\/report-payment$/.test(p) && verb === "POST")
        output = service.report(user, p.split("/")[2], body);
      else if (/^\/payments\/[^/]+\/confirm$/.test(p) && verb === "POST")
        output = service.confirm(user, p.split("/")[2]);
      else if (/^\/payments\/[^/]+\/reject$/.test(p) && verb === "POST")
        output = service.reject(user, p.split("/")[2], body.reason);
      else if (/^\/receipts\/[^/]+$/.test(p) && verb === "GET") {
        const receipt = service.receipt(user, p.split("/")[2]);
        respond(receiptHtml(receipt), 200, "text/html");
        return;
      } else if (p === "/exceptions" && verb === "GET") {
        service.role(user, "manager");
        output = s
          .all("exceptions")
          .filter((e) => !query.state || e.state === query.state)
          .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
      } else if (/^\/exceptions\/[^/]+\/resolve$/.test(p) && verb === "POST")
        output = service.correctException(user, p.split("/")[2], body);
      else if (p === "/notifications" && verb === "GET") {
        service.role(user, "tenant", "manager");
        output =
          user.role === "tenant"
            ? s
                .all("notifications")
                .filter((n) => n.tenantId === user.tenantId)
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            : [];
      } else if (p === "/notifications/read" && verb === "POST") {
        service.role(user, "tenant");
        for (const n of s
          .all("notifications")
          .filter((n) => n.tenantId === user.tenantId))
          s.save("notifications", { ...n, read: true });
        output = { ok: true };
      } else if (p === "/notifications/push-config" && verb === "GET") {
        service.role(user, "tenant");
        output = await external.pushConfig();
      } else if (p === "/notifications/push-subscription" && verb === "POST") {
        service.role(user, "tenant");
        requireValue(
          subscriptionAllowed(body.endpoint) &&
            /^[\w-]{80,100}$/.test(body.keys?.p256dh ?? "") &&
            /^[\w-]{20,30}$/.test(body.keys?.auth ?? ""),
          "Invalid supported push subscription",
        );
        const id = createHash("sha256")
          .update(user.id + body.endpoint)
          .digest("hex");
        output = s.save("subscriptions", {
          id,
          userId: user.id,
          subscription: body,
          createdAt: new Date().toISOString(),
        });
      } else if (p === "/messages" && verb === "GET") {
        service.role(user, "tenant", "manager");
        output = s
          .all("messages")
          .filter(
            (m) => user.role === "manager" || m.tenantId === user.tenantId,
          );
      } else if (p === "/messages" && verb === "POST") {
        service.role(user, "manager");
        service.must("tenants", body.tenantId);
        requireValue(
          String(body.subject ?? "").trim() && String(body.body ?? "").trim(),
          "Subject and message are required",
        );
        requireValue(
          body.body.length <= 5000 && body.subject.length <= 200,
          "Message is too long",
        );
        output = s.save("messages", {
          id: newId("msg"),
          tenantId: body.tenantId,
          subject: body.subject.trim(),
          body: body.body.trim(),
          sentAt: new Date().toISOString(),
          channel: "portal_inbox",
          senderId: user.id,
          sender: user.name,
        });
        service.notify(
          body.tenantId,
          body.subject.trim(),
          body.body.trim(),
          "billing",
          "message:" + output.id,
        );
        s.audit(user, "Portal message sent", output.id);
      } else if (p === "/reports/summary" && verb === "GET") {
        service.role(user, "manager");
        output = service.summary(query.range ?? "current");
      } else if (
        /^\/exports\/(tenants|reports|audit)$/.test(p) &&
        verb === "GET"
      ) {
        const kind = p.split("/")[2];
        service.role(user, kind === "audit" ? "admin" : "manager");
        const rows =
          kind === "tenants"
            ? service.tenants()
            : kind === "audit"
              ? s.all("audit")
              : [service.summary(query.range ?? "current")];
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${kind}.csv"`,
        );
        respond(csv(rows), 200, "text/csv");
        return;
      } else if (p === "/documents" && verb === "POST") {
        service.role(user, "manager");
        service.must("tenants", body.tenantId);
        requireValue(
          ["application/pdf", "image/jpeg", "image/png"].includes(body.type),
          "Unsupported document type",
        );
        const bytes = Buffer.from(body.base64 ?? "", "base64");
        requireValue(
          bytes.length > 0 && bytes.length <= 10 * 1024 * 1024,
          "Document must be between 1 byte and 10 MB",
        );
        const id = newId("doc");
        await fs.mkdir(join(dataDir, "documents"), { recursive: true });
        await fs.writeFile(join(dataDir, "documents", id), bytes);
        output = s.save("documents", {
          id,
          tenantId: body.tenantId,
          name: String(body.filename)
            .replace(/[^a-zA-Z0-9._ -]/g, "_")
            .slice(0, 150),
          contentType: body.type,
          kind: body.type === "application/pdf" ? "pdf" : "image",
          meta: "Uploaded " + philippineDate(),
          size: `${Math.ceil(bytes.length / 1024)} KB`,
        });
        s.audit(user, "Tenant document uploaded", id);
      } else if (/^\/documents\/[^/]+$/.test(p) && verb === "GET") {
        const d = service.must("documents", p.split("/")[2]);
        service.own(user, d.tenantId);
        const bytes = await fs.readFile(join(dataDir, "documents", d.id));
        res.writeHead(200, {
          "Content-Type": d.contentType,
          "Content-Disposition": `attachment; filename="${d.name}"`,
        });
        res.end(bytes);
        s.audit(user, "Tenant document downloaded", d.id);
        return;
      }
      requireValue(output !== undefined, "API endpoint not found", 404);
      respond(output);
    } catch (e) {
      const status = e.status ?? (e.code?.startsWith("ERR_SQLITE") ? 409 : 500);
      respond(
        {
          message:
            status === 500
              ? "Operation failed; check the server log"
              : e.message,
          code: e.code ?? null,
        },
        status,
      );
      if (status === 500) console.error(e);
    }
  });
  return {
    server,
    service,
    integrations: external,
    store: s,
    async close() {
      await external.close();
      if (server.listening) await new Promise((r) => server.close(r));
      s.close();
    },
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = createApp();
  if (!app.store.all("users").length) {
    console.error(
      "Initialize the database first: npm run setup (or npm run setup -- --demo for local demonstration data).",
    );
    app.store.close();
    process.exitCode = 1;
  } else {
    app.server.listen(
      Number(process.env.PORT || 8080),
      process.env.HOST || "127.0.0.1",
      () =>
        console.log(
          `PropertyPro: http://localhost:${process.env.PORT || 8080}/`,
        ),
    );
    const tick = () =>
      app.integrations
        .tick()
        .catch((e) => console.error("Scheduler:", e.message));
    tick();
    const timer = setInterval(tick, 60_000);
    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      clearInterval(timer);
      await app.close();
    };
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
  }
}
