/**
 * Deterministic seed dataset for the in-browser mock API.
 *
 * The data intentionally follows the study's rules:
 *  - four buildings (A–D) in Pasig City with unit-level occupancy
 *  - three payment statuses; Tenant Reported Paid never auto-becomes Paid
 *  - rent is fixed, non-prorated and generated on the lease anniversary
 *  - first-billing records carry a separate one-month advance-rent line
 *  - shared-occupancy allocations reconcile exactly to the source amount
 *  - exceptions are raised instead of silently "fixing" bad OCR output
 *
 * A seeded PRNG keeps every reload identical, so screenshots and demos are
 * reproducible.
 */

import {
  BILLING_CATEGORY,
  ARRANGEMENT,
  UNIT_STATUS,
} from "../../config/constants.js";

/* ------------------------------------------------------------ PRNG ------ */
function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, min, max) => Math.round(min + rng() * (max - min));
const round2 = (n) => Math.round(n * 100) / 100;

const iso = (offsetDays = 0, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const isoDate = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

/* --------------------------------------------------------- Name pools --- */
const FIRST_NAMES = [
  "Maria", "Juan", "Angela", "Ramon", "Bea", "Carlo", "Dianne", "Emmanuel",
  "Fiona", "Gabriel", "Hazel", "Ivan", "Jasmine", "Kevin", "Liza", "Miguel",
  "Nadine", "Omar", "Paolo", "Queenie", "Rafael", "Sofia", "Theodore", "Ulisse",
  "Vanessa", "Winston", "Yna", "Zach", "Andrea", "Benedict", "Carmela", "Danilo",
];

const LAST_NAMES = [
  "Reyes", "Dela Cruz", "Bautista", "Mendoza", "Garcia", "Villareal", "Navarro",
  "Aquino", "Padilla", "Soriano", "Malabanan", "Rodriguez", "Lim", "Tan",
  "Flores", "Castillo", "Panganiban", "Ramos", "Salazar", "Torres", "Ubaldo",
  "Verde", "Yap", "Zabala", "Manalo", "Perez", "Diaz", "Mercado", "Santos",
  "Cruz",
];

/* --------------------------------------------------------- Properties --- */
const PROPERTY_BLUEPRINTS = [
  {
    id: "prp-a",
    letter: "A",
    name: "Building A",
    address: "12 Unitas Street, Kapitolyo",
    city: "Pasig City",
    type: "boarding_house",
    floors: 4,
    perFloor: 4,
    accent: ["#4f46e5", "#312e81"],
    baseRent: [9500, 13500],
  },
  {
    id: "prp-b",
    letter: "B",
    name: "Building B",
    address: "88 Brixton Street, Kapitolyo",
    city: "Pasig City",
    type: "apartment",
    floors: 4,
    perFloor: 6,
    accent: ["#0ea5e9", "#0369a1"],
    baseRent: [11000, 16500],
  },
  {
    id: "prp-c",
    letter: "C",
    name: "Building C",
    address: "27 F. Ortigas Jr. Road, Ortigas Center",
    city: "Pasig City",
    type: "apartment",
    floors: 4,
    perFloor: 5,
    accent: ["#8b5cf6", "#5b21b6"],
    baseRent: [12500, 18900],
  },
  {
    id: "prp-d",
    letter: "D",
    name: "Building D",
    address: "5 Chino Roces Avenue, Pasig",
    city: "Pasig City",
    type: "boarding_house",
    floors: 3,
    perFloor: 4,
    accent: ["#f59e0b", "#b45309"],
    baseRent: [8500, 12000],
  },
];

const FLOOR_LABELS = ["Ground Floor", "Second Floor", "Third Floor", "Fourth Floor"];

const UNIT_TYPES = [
  { type: "Single Room", weight: 0.4 },
  { type: "Double Sharing", weight: 0.35 },
  { type: "Studio Unit", weight: 0.15 },
  { type: "One-Bedroom", weight: 0.1 },
];

/* ================================================================ BUILD == */
export function buildSeed() {
  const rng = makeRng(20261009);

  /* -------------------------------------------------------- properties -- */
  const properties = PROPERTY_BLUEPRINTS.map((bp) => ({
    id: bp.id,
    name: bp.name,
    letter: bp.letter,
    address: bp.address,
    city: bp.city,
    type: bp.type,
    totalUnits: bp.floors * bp.perFloor,
    occupiedUnits: 0,
    vacantUnits: 0,
    noticeUnits: 0,
    maintenanceUnits: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    accent: bp.accent,
  }));

  /* ------------------------------------------------------------- units -- */
  const units = [];
  for (const bp of PROPERTY_BLUEPRINTS) {
    for (let floor = 1; floor <= bp.floors; floor += 1) {
      for (let slot = 1; slot <= bp.perFloor; slot += 1) {
        const roll = rng();
        let status = UNIT_STATUS.OCCUPIED;
        if (roll > 0.94) status = UNIT_STATUS.MAINTENANCE;
        else if (roll > 0.87) status = UNIT_STATUS.VACANT;
        else if (roll > 0.81) status = UNIT_STATUS.NOTICE;

        const typeRoll = rng();
        let acc = 0;
        let unitType = UNIT_TYPES[0].type;
        for (const entry of UNIT_TYPES) {
          acc += entry.weight;
          if (typeRoll <= acc) {
            unitType = entry.type;
            break;
          }
        }

        const code = `${bp.letter}-${floor}${String(slot).padStart(2, "0")}`;
        const isShared = rng() < 0.24;

        units.push({
          id: `unt-${bp.letter.toLowerCase()}-${floor}${String(slot).padStart(2, "0")}`,
          propertyId: bp.id,
          letter: bp.letter,
          code,
          floor: FLOOR_LABELS[floor - 1] ?? `Floor ${floor}`,
          floorNumber: floor,
          type: unitType,
          status,
          tenantId: null,
          tenantName: null,
          monthlyRent: between(rng, bp.baseRent[0], bp.baseRent[1]) / 50 * 50,
          arrangement: isShared ? ARRANGEMENT.SHARED : ARRANGEMENT.INDIVIDUAL,
          occupants: isShared ? between(rng, 2, 4) : 1,
        });
      }
    }
  }

  /* Force the spec's example tenant into B-203. */
  const mariaUnit = units.find((u) => u.code === "B-203");
  if (mariaUnit) {
    mariaUnit.status = UNIT_STATUS.OCCUPIED;
    mariaUnit.type = "Double Sharing";
    mariaUnit.arrangement = ARRANGEMENT.SHARED;
    mariaUnit.occupants = 3;
    mariaUnit.monthlyRent = 7250;
  }

  /* ----------------------------------------------------------- tenants -- */
  const tenants = [];
  let tenantSeq = 1;

  const nextId = () => `tnt-${String(tenantSeq++).padStart(3, "0")}`;

  if (mariaUnit) {
    tenants.push({
      id: "tnt-001",
      fullName: "Maria Santos",
      email: "maria.santos@gmail.com",
      phone: "+63 917 428 1195",
      governmentId: "123-45-67890",
      emergencyContactName: "Rogelio Santos (Father)",
      emergencyContactPhone: "+63 918 220 7741",
      propertyId: mariaUnit.propertyId,
      unitId: mariaUnit.id,
      unitCode: mariaUnit.code,
      propertyName: "Building B",
      floor: mariaUnit.floor,
      leaseStart: "2025-11-23",
      leaseAnniversary: 23,
      monthlyRent: mariaUnit.monthlyRent,
      arrangement: mariaUnit.arrangement,
      occupants: mariaUnit.occupants,
      occupancy: "active",
      moveInDate: "2025-11-23",
      firstBilling: false,
      avatarTone: "avatar--rose",
    });
    mariaUnit.tenantId = "tnt-001";
    mariaUnit.tenantName = "Maria Santos";
  }

  const usedNames = new Set(["Maria Santos"]);
  for (const unit of units) {
    if (unit.tenantId) continue;
    const isActive = unit.status === UNIT_STATUS.OCCUPIED || unit.status === UNIT_STATUS.NOTICE;
    if (!isActive) continue;

    let fullName = "";
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const candidate = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
      if (!usedNames.has(candidate)) {
        fullName = candidate;
        break;
      }
    }
    if (!fullName) fullName = `Resident ${tenantSeq}`;
    usedNames.add(fullName);

    const property = properties.find((p) => p.id === unit.propertyId);
    const moveInOffset = -between(rng, 30, 640);
    const leaseStart = isoDate(moveInOffset);
    const firstBilling = moveInOffset > -45;

    const tenant = {
      id: nextId(),
      fullName,
      email: `${fullName.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ".")}@mail.com`,
      phone: `+63 9${between(rng, 10, 99)} ${between(rng, 100, 999)} ${between(rng, 1000, 9999)}`,
      governmentId: `${between(rng, 100, 999)}-${between(rng, 10, 99)}-${between(rng, 10000, 99999)}`,
      emergencyContactName: `${pick(rng, FIRST_NAMES)} ${fullName.split(" ").pop()}`,
      emergencyContactPhone: `+63 9${between(rng, 10, 99)} ${between(rng, 100, 999)} ${between(rng, 1000, 9999)}`,
      propertyId: unit.propertyId,
      unitId: unit.id,
      unitCode: unit.code,
      propertyName: property?.name ?? `Building ${unit.letter}`,
      floor: unit.floor,
      leaseStart,
      leaseAnniversary: between(rng, 1, 28),
      monthlyRent: unit.monthlyRent,
      arrangement: unit.arrangement,
      occupants: unit.occupants,
      occupancy: unit.status === UNIT_STATUS.NOTICE ? "notice" : "active",
      moveInDate: leaseStart,
      firstBilling,
    };

    unit.tenantId = tenant.id;
    unit.tenantName = tenant.fullName;
    tenants.push(tenant);
  }

  /* ------------------------------------------------------- bills + pay -- */
  const bills = [];
  const payments = [];
  let billSeq = 1;
  let paySeq = 1;
  let receiptSeq = 41;

  const cycleLabel = new Date().toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });

  for (const tenant of tenants) {
    const due = new Date();
    due.setDate(tenant.leaseAnniversary);
    if (due.getTime() < Date.now() - 6 * 86_400_000) {
      due.setMonth(due.getMonth() + 1);
    }
    const dueDate = due.toISOString().slice(0, 10);

    const roll = rng();
    const paymentStatus =
      roll < 0.46 ? "paid" : roll < 0.66 ? "tenant_reported_paid" : "unpaid";

    const lines = [];

    /* Rent: fixed, non-prorated, generated on the lease anniversary. */
    lines.push({
      id: `ln-${billSeq}-rent`,
      category: BILLING_CATEGORY.RENT,
      period: cycleLabel,
      amount: round2(tenant.monthlyRent),
      dueDate,
      paymentStatus,
      sourceRef: null,
    });

    /* One-month advance rent appears only on a tenant's first billing. */
    if (tenant.firstBilling) {
      lines.push({
        id: `ln-${billSeq}-advance`,
        category: BILLING_CATEGORY.RENT,
        label: "Advance Rent (1 month)",
        period: "First Billing",
        amount: round2(tenant.monthlyRent),
        dueDate,
        paymentStatus,
        sourceRef: null,
        isAdvance: true,
      });
    }

    /* Utilities: electricity + water, allocated when occupancy is shared. */
    const shared = tenant.arrangement === ARRANGEMENT.SHARED;
    const elecBase = round2(between(rng, 1450, 3900));
    const waterBase = round2(between(rng, 380, 1150));

    for (const [category, base] of [
      [BILLING_CATEGORY.ELECTRICITY, elecBase],
      [BILLING_CATEGORY.WATER, waterBase],
    ]) {
      const line = {
        id: `ln-${billSeq}-${category}`,
        category,
        period: cycleLabel,
        amount: round2(base),
        dueDate,
        paymentStatus,
        sourceRef:
          category === BILLING_CATEGORY.ELECTRICITY
            ? `MER-${between(rng, 400000, 999999)}`
            : `MWA-${between(rng, 400000, 999999)}`,
      };

      if (shared) {
        /* Allocated shares: 2 dp, and they must sum exactly to the source. */
        const n = tenant.occupants;
        const share = round2(base / n);
        line.sourceAmount = base;
        line.allocations = Array.from({ length: n }, (_, i) => ({
          tenantId: i === 0 ? tenant.id : `${tenant.id}-m${i + 1}`,
          tenantName:
            i === 0
              ? tenant.fullName
              : `Co-occupant ${i + 1} (${tenant.unitCode})`,
          share: i === n - 1 ? round2(base - share * (n - 1)) : share,
        }));
        line.amount = share; /* tenant's own share of the source bill */
      }

      lines.push(line);
    }

    const totalDue = round2(lines.reduce((sum, l) => sum + l.amount, 0));

    const bill = {
      id: `bil-${String(billSeq).padStart(4, "0")}`,
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      unitCode: tenant.unitCode,
      propertyId: tenant.propertyId,
      lines,
      totalDue,
      dueDate,
      paymentStatus,
      arrangement: tenant.arrangement,
      finalized: true,
      receiptId: null,
      cycle: cycleLabel,
    };

    if (paymentStatus !== "unpaid") {
      const confirmed = paymentStatus === "paid";
      const payment = {
        id: `pay-${String(paySeq++).padStart(4, "0")}`,
        billId: bill.id,
        tenantId: tenant.id,
        tenantName: tenant.fullName,
        amount: totalDue,
        reportedOn: iso(-between(rng, 1, 12), between(rng, 8, 19)),
        confirmedOn: confirmed ? iso(-between(rng, 0, 9), between(rng, 8, 19)) : null,
        method: pick(rng, ["cash", "bank_transfer", "e_wallet"]),
        reference: `REF-${between(rng, 100000, 999999)}`,
        status: paymentStatus,
        receiptNumber: confirmed ? `RCP-2026-${String(receiptSeq++).padStart(4, "0")}` : null,
      };
      payments.push(payment);
      if (confirmed) bill.receiptId = payment.receiptNumber;
    }

    bills.push(bill);
    billSeq += 1;
  }

  /* ---------------------------------------------------- incoming bills --- */
  const incomingBills = [
    {
      id: "ocr-001",
      provider: "Meralco",
      accountRef: "MER-552194",
      category: "electricity",
      amountDue: 18450.75,
      dueDate: isoDate(6),
      billingPeriod: "01 Sep – 30 Sep 2026",
      confidence: 96,
      ocrStatus: "validated",
      receivedAt: iso(-0, 7),
      filename: "meralco-sep2026-buildingA.pdf",
      propertyId: "prp-a",
    },
    {
      id: "ocr-002",
      provider: "Maynilad",
      accountRef: "MNL-884310",
      category: "water",
      amountDue: 6210.4,
      dueDate: isoDate(9),
      billingPeriod: "September 2026",
      confidence: 92,
      ocrStatus: "validated",
      receivedAt: iso(-0, 8),
      filename: "maynilad-sep2026-buildingB.pdf",
      propertyId: "prp-b",
    },
    {
      id: "ocr-003",
      provider: "Manila Water",
      accountRef: null,
      category: "water",
      amountDue: null,
      dueDate: null,
      billingPeriod: null,
      confidence: 41,
      ocrStatus: "failed",
      receivedAt: iso(-0, 9),
      filename: "scan_20261009_0913.jpg",
      propertyId: "prp-c",
    },
    {
      id: "ocr-004",
      provider: "Meralco",
      accountRef: "MER-552907",
      category: "electricity",
      amountDue: 22980.15,
      dueDate: isoDate(4),
      billingPeriod: "01 Sep – 30 Sep 2026",
      confidence: 88,
      ocrStatus: "validated",
      receivedAt: iso(-1, 16),
      filename: "meralco-sep2026-buildingC.pdf",
      propertyId: "prp-c",
    },
    {
      id: "ocr-005",
      provider: "Meralco",
      accountRef: "MER-552194",
      category: "electricity",
      amountDue: 18450.75,
      dueDate: isoDate(6),
      billingPeriod: "01 Sep – 30 Sep 2026",
      confidence: 94,
      ocrStatus: "processing",
      receivedAt: iso(-1, 17),
      filename: "meralco-sep2026-buildingA (1).pdf",
      propertyId: "prp-a",
    },
    {
      id: "ocr-006",
      provider: "Maynilad",
      accountRef: "MNL-885022",
      category: "water",
      amountDue: 4890.2,
      dueDate: isoDate(11),
      billingPeriod: "September 2026",
      confidence: 79,
      ocrStatus: "processing",
      receivedAt: iso(-2, 10),
      filename: "waterbill-oct.jpg",
      propertyId: "prp-d",
    },
  ];

  /* --------------------------------------------------------- exceptions -- */
  const exceptions = [
    {
      id: "exc-001",
      reason: "Duplicate billing detected",
      severity: "high",
      source: "incoming_bill",
      sourceId: "ocr-005",
      title: "Meralco · MER-552194",
      detail:
        "Account reference and billing period match an already-finalised record for Building A.",
      fields: [
        { label: "Amount Due", value: "₱18,450.75" },
        { label: "Billing Period", value: "01 Sep – 30 Sep 2026" },
        { label: "Matched Record", value: "bil-0007" },
      ],
      raisedAt: iso(0, 7),
      state: "open",
    },
    {
      id: "exc-002",
      reason: "Missing account / reference identifier",
      severity: "high",
      source: "incoming_bill",
      sourceId: "ocr-003",
      title: "Manila Water · unrecognised scan",
      detail:
        "OCR could not extract an account or reference identifier, so provider mapping cannot complete.",
      fields: [
        { label: "Account / Reference", value: "not found", missing: true },
        { label: "Amount Due", value: "not found", missing: true },
        { label: "OCR Confidence", value: "41%" },
      ],
      raisedAt: iso(0, 9),
      state: "open",
    },
    {
      id: "exc-003",
      reason: "Provider mapping unresolved",
      severity: "medium",
      source: "incoming_bill",
      sourceId: "ocr-006",
      title: "Maynilad · MNL-885022",
      detail:
        "Account reference is not mapped to a property, unit or configured utility account.",
      fields: [
        { label: "Account / Reference", value: "MNL-885022" },
        { label: "Mapped Unit", value: "none", missing: true },
        { label: "OCR Confidence", value: "79%" },
      ],
      raisedAt: iso(-1, 10),
      state: "open",
    },
    {
      id: "exc-004",
      reason: "Allocation mismatch on shared occupancy",
      severity: "medium",
      source: "billing",
      sourceId: "bil-0031",
      title: "Building B · shared electricity",
      detail:
        "Allocated shares did not reconcile to the source billing amount (short by ₱0.05). Recomputation required.",
      fields: [
        { label: "Source Amount", value: "₱3,120.55" },
        { label: "Allocated Total", value: "₱3,120.50" },
        { label: "Difference", value: "₱0.05" },
      ],
      raisedAt: iso(-2, 14),
      state: "open",
    },
    {
      id: "exc-005",
      reason: "Billing period outside expected window",
      severity: "low",
      source: "incoming_bill",
      sourceId: "ocr-004",
      title: "Meralco · MER-552907",
      detail:
        "Extracted billing period overlaps the previous cycle; verify before finalising.",
      fields: [
        { label: "Billing Period", value: "01 Sep – 30 Sep 2026" },
        { label: "Expected Cycle", value: "Oct 2026" },
      ],
      raisedAt: iso(-3, 11),
      state: "open",
    },
  ];

  /* ---------------------------------------------------------- activity --- */
  const activity = [
    {
      id: "act-001",
      type: "Utility Bill Received",
      subject: "Meralco · Building A",
      actor: "Intake mailbox",
      status: "Pending",
      timestamp: iso(0, 7),
      href: "#/bills",
    },
    {
      id: "act-002",
      type: "Exception Queue",
      subject: "Duplicate billing · MER-552194",
      actor: "Validation rules",
      status: "Review",
      timestamp: iso(0, 7),
      href: "#/bills",
    },
    {
      id: "act-003",
      type: "Tenant Payment",
      subject: "Maria Santos · B-203",
      actor: "Maria Santos",
      status: "Pending",
      timestamp: iso(0, 8),
      href: "#/tenants",
    },
    {
      id: "act-004",
      type: "Utility Bill Received",
      subject: "Maynilad · Building B",
      actor: "Intake mailbox",
      status: "Paid",
      timestamp: iso(0, 8),
      href: "#/bills",
    },
    {
      id: "act-005",
      type: "Exception Queue",
      subject: "Missing reference · scan_20261009",
      actor: "OCR extraction",
      status: "Review",
      timestamp: iso(0, 9),
      href: "#/bills",
    },
    {
      id: "act-006",
      type: "Payment Confirmed",
      subject: "Angela Reyes · A-104",
      actor: "Karla Dizon",
      status: "Paid",
      timestamp: iso(-1, 15),
      href: "#/bills",
    },
    {
      id: "act-007",
      type: "Receipt Generated",
      subject: "RCP-2026-0041 · A-104",
      actor: "System",
      status: "Paid",
      timestamp: iso(-1, 15),
      href: "#/bills",
    },
    {
      id: "act-008",
      type: "Web Push Notification",
      subject: "Due-date reminder · 42 tenants",
      actor: "Notification service",
      status: "Pending",
      timestamp: iso(-1, 8),
      href: "#/tenant/notifications",
    },
    {
      id: "act-009",
      type: "Tenant Payment",
      subject: "Carlo Mendoza · C-205",
      actor: "Carlo Mendoza",
      status: "Unpaid",
      timestamp: iso(-2, 10),
      href: "#/tenants",
    },
    {
      id: "act-010",
      type: "Bill Finalized",
      subject: "Rent + utilities · Cycle Sep 2026",
      actor: "Billing engine",
      status: "Paid",
      timestamp: iso(-2, 9),
      href: "#/bills",
    },
    {
      id: "act-011",
      type: "Correction Applied",
      subject: "Building D · water allocation",
      actor: "Karla Dizon",
      status: "Pending",
      timestamp: iso(-3, 16),
      href: "#/bills",
    },
    {
      id: "act-012",
      type: "Exception Queue",
      subject: "Shared allocation mismatch · B-203",
      actor: "Reconciliation rule",
      status: "Review",
      timestamp: iso(-2, 14),
      href: "#/bills",
    },
  ];

  /* ----------------------------------------------------- notifications --- */
  const notifications = [
    {
      id: "ntf-001",
      title: "New bill available",
      body: "Your October 2026 billing statement for Unit B-203 is ready to view.",
      tone: "primary",
      timestamp: iso(-1, 8),
      read: false,
      kind: "billing",
    },
    {
      id: "ntf-002",
      title: "Payment awaiting confirmation",
      body: "We received your payment report. The Manager will confirm it before a receipt is issued.",
      tone: "warning",
      timestamp: iso(-2, 11),
      read: false,
      kind: "payment",
    },
    {
      id: "ntf-003",
      title: "Due-date reminder",
      body: "Your rent and utilities are due in 3 days.",
      tone: "info",
      timestamp: iso(-3, 7),
      read: true,
      kind: "reminder",
    },
    {
      id: "ntf-004",
      title: "Receipt issued",
      body: "Receipt RCP-2026-0041 has been generated for your confirmed payment.",
      tone: "success",
      timestamp: iso(-9, 15),
      read: true,
      kind: "receipt",
    },
  ];

  /* ------------------------------------------------------ admin surfaces - */
  const services = [
    { id: "svc-mail", name: "Property-management mailbox intake", status: "operational", detail: "imap · bills@propertypro.ph" },
    { id: "svc-ocr", name: "OCR extraction worker", status: "operational", detail: "6 documents processed today" },
    { id: "svc-rules", name: "Rule-based classification engine", status: "operational", detail: "18 rules · deterministic" },
    { id: "svc-push", name: "Web Push notification service", status: "degraded", detail: "VAPID key rotation due in 6 days" },
    { id: "svc-db", name: "Centralised database", status: "operational", detail: "last backup 02:00 PHT" },
    { id: "svc-queue", name: "Exception Queue", status: "operational", detail: "5 open records" },
  ];

  const auditLog = [
    { id: "aud-001", actor: "Karla Dizon", role: "manager", action: "Confirmed payment pay-0007", target: "A-104", at: iso(-1, 15) },
    { id: "aud-002", actor: "System", role: "admin", action: "Database backup completed", target: "central-db", at: iso(-1, 2) },
    { id: "aud-003", actor: "Adrian Villanueva", role: "admin", action: "Updated role grant: report:read", target: "manager", at: iso(-2, 10) },
    { id: "aud-004", actor: "Karla Dizon", role: "manager", action: "Corrected allocation rule", target: "Building B", at: iso(-3, 16) },
    { id: "aud-005", actor: "System", role: "admin", action: "OCR engine warm restart", target: "ocr-worker", at: iso(-4, 3) },
    { id: "aud-006", actor: "Maria Santos", role: "tenant", action: "Reported payment", target: "bil-0001", at: iso(-5, 9) },
    { id: "aud-007", actor: "Adrian Villanueva", role: "admin", action: "Signed in", target: "session", at: iso(-6, 8) },
    { id: "aud-008", actor: "Karla Dizon", role: "manager", action: "Created utility mapping", target: "MNL-884310", at: iso(-7, 14) },
  ];

  const adminUsers = [
    { id: "usr-001", name: "Adrian Villanueva", email: "admin@propertypro.ph", role: "admin", status: "active", lastSeen: iso(-0, 6) },
    { id: "usr-002", name: "Karla Dizon", email: "manager@propertypro.ph", role: "manager", status: "active", lastSeen: iso(-0, 7) },
    { id: "usr-003", name: "Nico Ferrer", email: "assistant@propertypro.ph", role: "manager", status: "active", lastSeen: iso(-1, 17) },
    { id: "usr-004", name: "Bea Tolentino", email: "bea.tolentino@mail.com", role: "tenant", status: "active", lastSeen: iso(-1, 20) },
    { id: "usr-005", name: "Ramon Aquino", email: "ramon.aquino@mail.com", role: "tenant", status: "suspended", lastSeen: iso(-14, 12) },
    { id: "usr-006", name: "System Worker", email: "worker@propertypro.ph", role: "admin", status: "service", lastSeen: iso(0, 4) },
  ];

  return {
    properties,
    units,
    tenants,
    bills,
    payments,
    incomingBills,
    exceptions,
    activity,
    notifications,
    services,
    auditLog,
    adminUsers,
    messages: [],
    cycleLabel,
    generatedAt: new Date().toISOString(),
  };
}

export default buildSeed;
