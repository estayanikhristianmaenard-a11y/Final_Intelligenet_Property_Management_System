import { buildSeed } from "./seed.js";
import { apiConfig } from "../../config/api.js";
import { PAYMENT_STATUS, UNIT_STATUS } from "../../config/constants.js";

/**
 * In-browser mock API.
 *
 * Mimics the backend contract documented in `docs/api-contract.md`: it routes
 * `path + method` to a handler, applies a small latency so loading states are
 * honest, and mutates an in-memory database so actions taken in the UI (report
 * payment, confirm payment, resolve exception) really do change the dashboards.
 *
 * Swapping to the live backend is a one-line config change — no feature code
 * imports this module directly.
 */

const db = buildSeed();
let idSeq = 1000;

const clone = (value) => structuredClone(value);
const nowIso = () => new Date().toISOString();
const nextId = (prefix) => `${prefix}-${(idSeq += 1)}`;

/* --------------------------------------------------------- derivations -- */

function unitTally(propertyId) {
  const units = propertyId
    ? db.units.filter((u) => u.propertyId === propertyId)
    : db.units;
  const tally = {
    total: units.length,
    occupied: 0,
    vacant: 0,
    notice: 0,
    maintenance: 0,
  };
  for (const unit of units) {
    if (unit.status === UNIT_STATUS.OCCUPIED) tally.occupied += 1;
    else if (unit.status === UNIT_STATUS.VACANT) tally.vacant += 1;
    else if (unit.status === UNIT_STATUS.NOTICE) tally.notice += 1;
    else tally.maintenance += 1;
  }
  return tally;
}

function withOccupancy(property) {
  const tally = unitTally(property.id);
  const tenants = db.tenants.filter((t) => t.propertyId === property.id);
  return {
    ...property,
    totalUnits: tally.total,
    occupiedUnits: tally.occupied + tally.notice,
    vacantUnits: tally.vacant,
    noticeUnits: tally.notice,
    maintenanceUnits: tally.maintenance,
    occupancyRate: Math.round(((tally.occupied + tally.notice) / tally.total) * 100),
    monthlyRevenue: tenants
      .filter((t) => t.occupancy === "active")
      .reduce((sum, t) => sum + t.monthlyRent, 0),
  };
}

function dashboardStats() {
  const tally = unitTally();
  const activeTenants = db.tenants.filter((t) => t.occupancy !== "ended").length;
  const openExceptions = db.exceptions.filter((e) => e.state === "open").length;
  const incoming = db.incomingBills.filter(
    (b) => b.ocrStatus !== "validated",
  ).length;

  return {
    totalUnits: { value: tally.total, delta: 4 },
    totalTenants: { value: activeTenants, delta: 3 },
    incomingBills: { value: incoming, delta: 2 },
    exceptionQueue: { value: openExceptions, delta: -1 },
    occupancy: Math.round(((tally.occupied + tally.notice) / tally.total) * 100),
    openExceptions,
    outstanding: db.bills
      .filter((b) => b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + b.totalDue, 0),
    collected: db.payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
  };
}

function pushActivity(event) {
  db.activity.unshift({ id: nextId("act"), timestamp: nowIso(), ...event });
  if (db.activity.length > 40) db.activity.length = 40;
}

/* ------------------------------------------------------------- helpers -- */

function paginate(list, params = {}) {
  const limit = Number(params.limit) || 0;
  return limit > 0 ? list.slice(0, limit) : list;
}

function matches(haystack, needle) {
  if (!needle) return true;
  return String(haystack ?? "").toLowerCase().includes(String(needle).toLowerCase());
}

function tenantDocuments(tenant) {
  const bills = db.bills.filter((b) => b.tenantId === tenant.id);
  const receipts = bills
    .filter((b) => b.receiptId)
    .map((b) => b.receiptId);

  return [
    {
      id: "doc-lease",
      name: "Lease Contract 2026.pdf",
      kind: "pdf",
      meta: `Signed · ${tenant.leaseStart}`,
      size: "412 KB",
    },
    {
      id: "doc-id",
      name: "Valid Government ID.jpg",
      kind: "image",
      meta: "Verified on move-in",
      size: "1.1 MB",
    },
    {
      id: "doc-dd",
      name: "Deposit Receipt.pdf",
      kind: "pdf",
      meta: "Security deposit",
      size: "88 KB",
    },
    {
      id: "doc-clearance",
      name: "Move-in Clearance.pdf",
      kind: "pdf",
      meta: "Signed by Manager",
      size: "64 KB",
    },
    ...receipts.map((number) => ({
      id: `rcp-${number}`,
      name: `${number}.pdf`,
      kind: "receipt",
      meta: "Manager-confirmed receipt",
      size: "42 KB",
    })),
  ];
}

/* ------------------------------------------------------------- routing -- */

const routes = [
  /* ------------------------------------------------------------ stats -- */
  {
    method: "GET",
    pattern: /^\/dashboard\/stats$/,
    handler: () => dashboardStats(),
  },
  {
    method: "GET",
    pattern: /^\/dashboard\/activity$/,
    handler: ({ params }) => ({
      items: clone(
        paginate(
          [...db.activity].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
          params,
        ),
      ),
      total: db.activity.length,
    }),
  },

  /* ------------------------------------------------------- properties --- */
  {
    method: "GET",
    pattern: /^\/properties$/,
    handler: () => db.properties.map((p) => clone(withOccupancy(p))),
  },
  {
    method: "GET",
    pattern: /^\/properties\/([^/]+)$/,
    handler: ({ match }) => {
      const property = db.properties.find((p) => p.id === match[1]);
      return property ? clone(withOccupancy(property)) : null;
    },
  },

  /* ------------------------------------------------------------- units -- */
  {
    method: "GET",
    pattern: /^\/units$/,
    handler: ({ params }) => {
      let units = db.units;
      if (params.propertyId) units = units.filter((u) => u.propertyId === params.propertyId);
      if (params.status) units = units.filter((u) => u.status === params.status);
      if (params.q) {
        units = units.filter(
          (u) => matches(u.code, params.q) || matches(u.tenantName, params.q),
        );
      }
      return clone(units);
    },
  },

  /* ---------------------------------------------------------- tenants --- */
  {
    method: "GET",
    pattern: /^\/tenants$/,
    handler: ({ params }) => {
      let tenants = db.tenants;
      if (params.propertyId) {
        tenants = tenants.filter((t) => t.propertyId === params.propertyId);
      }
      if (params.q) {
        tenants = tenants.filter(
          (t) =>
            matches(t.fullName, params.q) ||
            matches(t.unitCode, params.q) ||
            matches(t.email, params.q),
        );
      }
      return clone(tenants);
    },
  },
  {
    method: "GET",
    pattern: /^\/tenants\/([^/]+)$/,
    handler: ({ match }) => {
      const tenant = db.tenants.find((t) => t.id === match[1]);
      if (!tenant) return null;
      const bills = db.bills.filter((b) => b.tenantId === tenant.id);
      const payments = db.payments
        .filter((p) => p.tenantId === tenant.id)
        .sort((a, b) => new Date(b.reportedOn) - new Date(a.reportedOn));
      return {
        ...clone(tenant),
        bills: clone(bills),
        payments: clone(payments),
        documents: clone(tenantDocuments(tenant)),
        summary: {
          currentDue: bills
            .filter((b) => b.paymentStatus !== "paid")
            .reduce((sum, b) => sum + b.totalDue, 0),
          paidTotal: payments
            .filter((p) => p.status === "paid")
            .reduce((sum, p) => sum + p.amount, 0),
          openBills: bills.filter((b) => b.paymentStatus !== "paid").length,
        },
      };
    },
  },
  {
    method: "GET",
    pattern: /^\/tenants\/([^/]+)\/bills$/,
    handler: ({ match }) => clone(db.bills.filter((b) => b.tenantId === match[1])),
  },
  {
    method: "GET",
    pattern: /^\/tenants\/([^/]+)\/payments$/,
    handler: ({ match }) =>
      clone(db.payments.filter((p) => p.tenantId === match[1])),
  },
  {
    method: "GET",
    pattern: /^\/tenants\/([^/]+)\/documents$/,
    handler: ({ match }) => {
      const tenant = db.tenants.find((t) => t.id === match[1]);
      return tenant ? clone(tenantDocuments(tenant)) : [];
    },
  },

  /* ----------------------------------------------------------- bills ---- */
  {
    method: "GET",
    pattern: /^\/bills\/incoming$/,
    handler: ({ params }) => {
      let bills = [...db.incomingBills].sort(
        (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt),
      );
      if (params.status) {
        bills = bills.filter((b) => b.ocrStatus === params.status);
      }
      return clone(bills);
    },
  },
  {
    method: "GET",
    pattern: /^\/bills$/,
    handler: ({ params }) => {
      let bills = [...db.bills];
      if (params.status) bills = bills.filter((b) => b.paymentStatus === params.status);
      if (params.tenantId) bills = bills.filter((b) => b.tenantId === params.tenantId);
      if (params.q) {
        bills = bills.filter(
          (b) =>
            matches(b.tenantName, params.q) ||
            matches(b.unitCode, params.q) ||
            matches(b.id, params.q),
        );
      }
      return clone(bills);
    },
  },

  /* --------------------------------------------------------- payments ---- */
  {
    method: "GET",
    pattern: /^\/payments$/,
    handler: ({ params }) => {
      let payments = [...db.payments].sort(
        (a, b) => new Date(b.reportedOn) - new Date(a.reportedOn),
      );
      if (params.status) payments = payments.filter((p) => p.status === params.status);
      return clone(payments);
    },
  },
  {
    method: "POST",
    pattern: /^\/bills\/([^/]+)\/report-payment$/,
    handler: ({ match, body }) => {
      const bill = db.bills.find((b) => b.id === match[1]);
      if (!bill) return null;
      if (bill.paymentStatus !== "unpaid") return { unchanged: true, bill: clone(bill) };

      bill.paymentStatus = "tenant_reported_paid";
      const payment = {
        id: nextId("pay"),
        billId: bill.id,
        tenantId: bill.tenantId,
        tenantName: bill.tenantName,
        amount: bill.totalDue,
        reportedOn: nowIso(),
        confirmedOn: null,
        method: body?.method ?? "cash",
        reference: body?.reference ?? `REF-${Math.floor(100000 + Math.random() * 899999)}`,
        status: "tenant_reported_paid",
        receiptNumber: null,
      };
      db.payments.unshift(payment);

      pushActivity({
        type: "Tenant Payment",
        subject: `${bill.tenantName} · ${bill.unitCode}`,
        actor: bill.tenantName,
        status: "Pending",
        href: "#/bills",
      });

      return { bill: clone(bill), payment: clone(payment) };
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/([^/]+)\/confirm$/,
    handler: ({ match }) => {
      const payment = db.payments.find((p) => p.id === match[1]);
      if (!payment) return null;

      payment.status = "paid";
      payment.confirmedOn = nowIso();
      payment.receiptNumber =
        payment.receiptNumber ??
        `RCP-2026-${String(Math.floor(1000 + Math.random() * 8999))}`;

      const bill = db.bills.find((b) => b.id === payment.billId);
      if (bill) {
        bill.paymentStatus = "paid";
        bill.receiptId = payment.receiptNumber;
      }

      pushActivity({
        type: "Payment Confirmed",
        subject: `${payment.tenantName} · ${bill?.unitCode ?? payment.billId}`,
        actor: "Manager",
        status: "Paid",
        href: "#/bills",
      });
      pushActivity({
        type: "Receipt Generated",
        subject: `${payment.receiptNumber} · ${bill?.unitCode ?? payment.billId}`,
        actor: "System",
        status: "Paid",
        href: "#/bills",
      });

      return clone(payment);
    },
  },

  /* -------------------------------------------------------- exceptions --- */
  {
    method: "GET",
    pattern: /^\/exceptions$/,
    handler: ({ params }) => {
      let items = [...db.exceptions].sort(
        (a, b) => new Date(b.raisedAt) - new Date(a.raisedAt),
      );
      if (params.state) items = items.filter((e) => e.state === params.state);
      return clone(items);
    },
  },
  {
    method: "POST",
    pattern: /^\/exceptions\/([^/]+)\/resolve$/,
    handler: ({ match, body }) => {
      const record = db.exceptions.find((e) => e.id === match[1]);
      if (!record) return null;
      record.state = body?.revalidate ? "revalidated" : "corrected";
      record.resolvedAt = nowIso();

      pushActivity({
        type: "Correction Applied",
        subject: `${record.reason} · ${record.title}`,
        actor: "Manager",
        status: "Pending",
        href: "#/bills",
      });

      return clone(record);
    },
  },

  /* ------------------------------------------------------ notifications -- */
  {
    method: "GET",
    pattern: /^\/notifications$/,
    handler: () =>
      clone(
        [...db.notifications].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        ),
      ),
  },

  /* ---------------------------------------------------------- reports ---- */
  {
    method: "GET",
    pattern: /^\/reports\/summary$/,
    handler: () => {
      const byCategory = {};
      for (const bill of db.bills) {
        for (const line of bill.lines) {
          byCategory[line.category] = round2(
            (byCategory[line.category] ?? 0) + line.amount,
          );
        }
      }

      const byProperty = db.properties.map((p) => {
        const tally = unitTally(p.id);
        return {
          id: p.id,
          name: p.name,
          letter: p.letter,
          occupancy: Math.round(((tally.occupied + tally.notice) / tally.total) * 100),
          revenue: withOccupancy(p).monthlyRevenue,
          units: tally.total,
        };
      });

      const byStatus = {
        paid: db.bills.filter((b) => b.paymentStatus === "paid").length,
        tenant_reported_paid: db.bills.filter(
          (b) => b.paymentStatus === "tenant_reported_paid",
        ).length,
        unpaid: db.bills.filter((b) => b.paymentStatus === "unpaid").length,
      };

      const totalBills = db.bills.length || 1;

      return {
        cycle: db.cycleLabel,
        byCategory,
        byProperty,
        byStatus,
        byStatusPercent: {
          paid: Math.round((byStatus.paid / totalBills) * 100),
          tenant_reported_paid: Math.round(
            (byStatus.tenant_reported_paid / totalBills) * 100,
          ),
          unpaid: Math.round((byStatus.unpaid / totalBills) * 100),
        },
        outstanding: dashboardStats().outstanding,
        collected: dashboardStats().collected,
        openExceptions: db.exceptions.filter((e) => e.state === "open").length,
        occupancy: dashboardStats().occupancy,
      };
    },
  },

  /* --------------------------------------------------------- settings ---- */
  {
    method: "GET",
    pattern: /^\/settings\/profile$/,
    handler: () => ({
      intakeMailbox: "bills@propertypro.ph",
      allocationRule: "equal_split",
      advanceRentEnabled: true,
      prorateEnabled: false,
      reminderDays: 3,
      pushEnabled: true,
      smsEnabled: false,
      emailNotifyEnabled: false,
    }),
  },
  {
    method: "GET",
    pattern: /^\/messages$/,
    handler: () => clone(db.messages),
  },
  {
    method: "POST",
    pattern: /^\/messages$/,
    handler: ({ body }) => {
      const message = {
        id: nextId("msg"),
        to: body?.to ?? "Unknown",
        subject: body?.subject ?? "(no subject)",
        body: body?.body ?? "",
        sentAt: nowIso(),
        channel: "portal_inbox",
      };
      db.messages.unshift(message);
      return clone(message);
    },
  },

  /* ------------------------------------------------------------ admin ---- */
  {
    method: "GET",
    pattern: /^\/admin\/services$/,
    handler: () => clone(db.services),
  },
  {
    method: "GET",
    pattern: /^\/admin\/audit$/,
    handler: ({ params }) =>
      clone(
        paginate(
          [...db.auditLog].sort((a, b) => new Date(b.at) - new Date(a.at)),
          params,
        ),
      ),
  },
  {
    method: "GET",
    pattern: /^\/admin\/users$/,
    handler: () => clone(db.adminUsers),
  },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

function parsePath(path) {
  const [pathname, search = ""] = String(path).split("?");
  const params = Object.fromEntries(new URLSearchParams(search).entries());
  return { pathname, params };
}

/**
 * Entry point used by `api/client.js` when `apiConfig.MODE !== "live"`.
 * @returns {Promise<any>} resolved response body
 */
export async function dispatchMock({ path, method = "GET", body = {} }) {
  const { pathname, params } = parsePath(path);
  const verb = method.toUpperCase();

  const route = routes.find((r) => r.method === verb && r.pattern.test(pathname));
  if (!route) {
    await delay(apiConfig.MOCK_LATENCY_MS);
    const error = new Error(`Mock API: no handler for ${verb} ${pathname}`);
    error.status = 404;
    throw error;
  }

  await delay(apiConfig.MOCK_LATENCY_MS);
  const match = pathname.match(route.pattern);
  return route.handler({ match, params, body, pathname });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Test helper — reset the in-memory database to a clean seed. */
export function resetMockDb() {
  const fresh = buildSeed();
  for (const key of Object.keys(db)) delete db[key];
  Object.assign(db, fresh);
}

export default dispatchMock;
