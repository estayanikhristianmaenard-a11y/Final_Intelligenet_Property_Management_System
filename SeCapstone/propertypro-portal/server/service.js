import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { newId } from "./store.js";
import {
  HttpError,
  requireValue,
  cents,
  money,
  validDate,
  philippineDate,
  addDays,
  anniversary,
  monthAfter,
  splitCentavos,
  eligible,
} from "./rules.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export function passwordHash(password) {
  requireValue(
    typeof password === "string" &&
      password.length >= 12 &&
      password.length <= 200,
    "Password must contain 12 to 200 characters",
  );
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 32).toString("hex");
}
export function verifyPassword(password, hash) {
  if (typeof password !== "string" || password.length > 200 || !hash)
    return false;
  const [salt, key] = hash.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 32),
    Buffer.from(key, "hex"),
  );
}
export const publicUser = (u) => {
  const { passwordHash: ignored, ...safe } = u;
  return safe;
};
export class Service {
  constructor(store) {
    this.s = store;
    this.loginAttempts = new Map();
  }
  config() {
    return (
      this.s.get("settings", "billing") ?? {
        id: "billing",
        intakeMailbox: "",
        allocationRule: "equal_split",
        advanceRentEnabled: true,
        prorateEnabled: false,
        reminderDays: 3,
        pushEnabled: true,
      }
    );
  }
  login({ email, password }, ip = "local") {
    const key = ip + ":" + String(email).toLowerCase();
    let entry = this.loginAttempts.get(key);
    if (entry && Date.now() - entry.at >= 15 * 60_000) {
      this.loginAttempts.delete(key);
      entry = null;
    }
    requireValue(
      !entry || entry.count < 8 || Date.now() - entry.at > 15 * 60_000,
      "Too many login attempts. Try again in 15 minutes.",
      429,
    );
    const u = this.s
      .all("users")
      .find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase(),
      );
    if (
      !u ||
      u.status !== "active" ||
      !verifyPassword(password, u.passwordHash)
    ) {
      this.loginAttempts.set(key, {
        count: (entry?.count ?? 0) + 1,
        at: Date.now(),
      });
      throw new HttpError(401, "Invalid email or password");
    }
    this.loginAttempts.delete(key);
    const token = randomBytes(32).toString("base64url");
    this.s.db
      .prepare("INSERT INTO sessions VALUES (?,?,?)")
      .run(
        hashToken(token),
        u.id,
        new Date(Date.now() + 8 * 3600_000).toISOString(),
      );
    u.lastSeen = new Date().toISOString();
    this.s.save("users", u);
    this.s.audit(u, "Signed in", u.id);
    return { token, user: publicUser(u) };
  }
  authenticate(token) {
    const row =
      typeof token === "string"
        ? this.s.db
            .prepare("SELECT userId,expiresAt FROM sessions WHERE id=?")
            .get(hashToken(token))
        : null;
    requireValue(
      row && row.expiresAt > new Date().toISOString(),
      "Session expired. Sign in again.",
      401,
    );
    const user = this.s.get("users", row.userId);
    requireValue(user?.status === "active", "Account unavailable", 401);
    return publicUser(user);
  }
  logout(token, user) {
    if (token)
      this.s.db
        .prepare("DELETE FROM sessions WHERE id=?")
        .run(hashToken(token));
    this.s.audit(user, "Signed out", user.id);
    return { ok: true };
  }
  role(user, ...roles) {
    requireValue(user && roles.includes(user.role), "Access denied", 403);
  }
  own(user, tenantId) {
    this.role(user, "manager", "tenant");
    requireValue(
      user.role === "manager" || user.tenantId === tenantId,
      "Access denied",
      403,
    );
  }
  must(table, id) {
    const value = this.s.get(table, id);
    requireValue(value, "Record not found", 404);
    return value;
  }
  profile(user, body) {
    const u = this.must("users", user.id);
    if (body.password) {
      requireValue(
        verifyPassword(body.currentPassword, u.passwordHash),
        "Current password is incorrect",
        403,
      );
      u.passwordHash = passwordHash(body.password);
    }
    if (body.name !== undefined) {
      requireValue(
        String(body.name).trim().length >= 2,
        "Full name is required",
      );
      u.name = String(body.name).trim().slice(0, 150);
    }
    if (body.email !== undefined) {
      requireValue(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email),
        "Valid email is required",
      );
      u.email = body.email.trim().toLowerCase();
    }
    if (body.phone !== undefined) u.phone = String(body.phone).slice(0, 40);
    if (body.preferences)
      u.preferences = {
        billing: body.preferences.billing !== false,
        reminder: body.preferences.reminder !== false,
        payment: body.preferences.payment !== false,
      };
    return this.s.transaction(() => {
      this.s.save("users", u);
      if (body.password)
        this.s.db.prepare("DELETE FROM sessions WHERE userId=?").run(u.id);
      if (u.tenantId) {
        const t = this.must("tenants", u.tenantId);
        this.s.save("tenants", {
          ...t,
          fullName: u.name,
          email: u.email,
          phone: u.phone ?? t.phone,
        });
      }
      this.s.audit(
        user,
        body.password ? "Password changed" : "Profile updated",
        u.id,
      );
      return publicUser(u);
    });
  }
  userWrite(user, body, id) {
    this.role(user, "admin");
    const old = id ? this.must("users", id) : null;
    requireValue(
      ["admin", "manager", "tenant"].includes(body.role ?? old?.role),
      "Invalid role",
    );
    const next = {
      ...old,
      id: old?.id ?? newId("usr"),
      name: String(body.name ?? old?.name ?? "").trim(),
      email: String(body.email ?? old?.email ?? "")
        .trim()
        .toLowerCase(),
      role: body.role ?? old?.role,
      status: body.status ?? old?.status ?? "active",
      tenantId: body.tenantId ?? old?.tenantId ?? null,
    };
    requireValue(
      next.name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email),
      "Name and valid email are required",
    );
    requireValue(
      ["active", "suspended"].includes(next.status),
      "Invalid account status",
    );
    if (next.role === "tenant") {
      this.must("tenants", next.tenantId);
    } else next.tenantId = null;
    requireValue(
      !(
        next.id === user.id &&
        (next.role !== "admin" || next.status !== "active")
      ),
      "Cannot remove your own administrator access",
    );
    if (
      old?.role === "admin" &&
      (next.role !== "admin" || next.status !== "active")
    )
      requireValue(
        this.s
          .all("users")
          .filter(
            (u) =>
              u.role === "admin" && u.status === "active" && u.id !== old.id,
          ).length > 0,
        "Keep at least one active administrator",
      );
    if (body.password) next.passwordHash = passwordHash(body.password);
    requireValue(next.passwordHash, "A password is required for new accounts");
    return this.s.transaction(() => {
      this.s.save("users", next);
      if (old)
        this.s.db.prepare("DELETE FROM sessions WHERE userId=?").run(next.id);
      this.s.audit(user, old ? "Account updated" : "Account created", next.id);
      return publicUser(next);
    });
  }
  property(p) {
    const units = this.units({ propertyId: p.id });
    const occupied = units.filter(
      (u) => u.status === "occupied" || u.status === "notice",
    ).length;
    return {
      ...p,
      totalUnits: units.length,
      occupiedUnits: occupied,
      vacantUnits: units.filter((u) => u.status === "vacant").length,
      noticeUnits: units.filter((u) => u.status === "notice").length,
      maintenanceUnits: units.filter((u) => u.status === "maintenance").length,
      occupancyRate: units.length
        ? Math.round((occupied / units.length) * 100)
        : 0,
      monthlyRevenue: money(
        units
          .filter((u) => u.status === "occupied" || u.status === "notice")
          .reduce((sum, u) => sum + cents(u.monthlyRent), 0),
      ),
    };
  }
  units(filters = {}) {
    const now = philippineDate(),
      tenants = this.s.all("tenants");
    return this.s
      .all("units")
      .map((u) => {
        const occupants = eligible(tenants, u.id, now);
        return {
          ...u,
          status:
            u.status === "maintenance"
              ? "maintenance"
              : occupants.length
                ? occupants.every((t) => t.occupancy === "notice")
                  ? "notice"
                  : "occupied"
                : "vacant",
          tenantId: occupants[0]?.id ?? null,
          tenantName: occupants.map((t) => t.fullName).join(", ") || null,
          occupants: occupants.length,
        };
      })
      .filter(
        (u) =>
          (!filters.propertyId || u.propertyId === filters.propertyId) &&
          (!filters.status || u.status === filters.status) &&
          (!filters.q ||
            `${u.code} ${u.tenantName}`
              .toLowerCase()
              .includes(filters.q.toLowerCase())),
      );
  }
  tenants(filters = {}) {
    return this.s
      .all("tenants")
      .map((t) => {
        const u = this.must("units", t.unitId),
          p = this.must("properties", t.propertyId);
        return {
          ...t,
          occupancy:
            t.assignmentEnd && t.assignmentEnd < philippineDate()
              ? "ended"
              : t.occupancy,
          unitCode: u.code,
          propertyName: p.name,
          floor: u.floor,
          arrangement: u.arrangement,
          monthlyRent: u.monthlyRent,
          leaseAnniversary: Number(t.leaseStart.slice(-2)),
        };
      })
      .filter(
        (t) =>
          (!filters.propertyId || t.propertyId === filters.propertyId) &&
          (!filters.q ||
            `${t.fullName} ${t.email} ${t.unitCode}`
              .toLowerCase()
              .includes(filters.q.toLowerCase())),
      );
  }
  tenant(user, id) {
    this.own(user, id);
    this.must("tenants", id);
    const tenant = this.tenants().find((t) => t.id === id),
      bills = this.bills(user, { tenantId: id }),
      payments = this.payments(user, { tenantId: id }),
      documents = this.documents(user, id);
    return {
      ...tenant,
      bills,
      payments,
      documents,
      summary: {
        currentDue: money(
          bills
            .filter((b) => b.paymentStatus !== "paid")
            .reduce((s, b) => s + cents(b.totalDue), 0),
        ),
        paidTotal: money(
          payments
            .filter((p) => p.status === "paid")
            .reduce((s, p) => s + cents(p.amount), 0),
        ),
        openBills: bills.filter(
          (b) => b.paymentStatus !== "paid" && b.totalDue > 0,
        ).length,
      },
    };
  }
  writeEntity(user, kind, body, id) {
    this.role(user, "manager");
    requireValue(
      ["properties", "units", "tenants", "mappings"].includes(kind),
      "Invalid entity",
    );
    const old = id ? this.must(kind, id) : {};
    const p = { ...old, id: id ?? newId(kind.slice(0, 3)) };
    const fields = {
      properties: ["name", "letter", "address", "city", "type"],
      units: [
        "propertyId",
        "code",
        "floor",
        "floorNumber",
        "type",
        "status",
        "monthlyRent",
        "arrangement",
      ],
      tenants: [
        "fullName",
        "email",
        "phone",
        "governmentId",
        "emergencyContactName",
        "emergencyContactPhone",
        "unitId",
        "leaseStart",
        "leaseEnd",
        "assignmentStart",
        "assignmentEnd",
        "occupancy",
      ],
      mappings: ["provider", "account", "unitId", "category"],
    }[kind];
    for (const k of fields)
      if (body[k] !== undefined)
        p[k] = typeof body[k] === "string" ? body[k].trim() : body[k];
    for (const key of fields)
      if (p[key] !== undefined && p[key] !== null)
        requireValue(
          typeof p[key] === "string" || typeof p[key] === "number",
          "Invalid field type",
        );
    for (const key of fields)
      if (typeof p[key] === "string")
        requireValue(p[key].length <= 500, "Field exceeds 500 characters");
    if (kind === "properties") {
      requireValue(
        p.name && p.address,
        "Property name and address are required",
      );
      p.city = p.city || "Pasig City";
      requireValue(p.city === "Pasig City", "Property must be in Pasig City");
      requireValue(
        ["boarding_house", "apartment"].includes(p.type),
        "Invalid property type",
      );
      p.letter = p.letter || p.name.charAt(0).toUpperCase();
      p.accent = old.accent ?? ["#4f46e5", "#312e81"];
    }
    if (kind === "units") {
      const prop = this.must("properties", p.propertyId);
      p.letter = prop.letter;
      requireValue(
        p.code &&
          p.floor &&
          ["individual", "shared_occupancy"].includes(p.arrangement),
        "Code, floor and arrangement are required",
      );
      p.monthlyRent = money(cents(p.monthlyRent));
      requireValue(p.monthlyRent > 0, "Monthly rent must be positive");
      p.status = p.status || "vacant";
      requireValue(
        ["occupied", "vacant", "notice", "maintenance"].includes(p.status),
        "Invalid unit status",
      );
      requireValue(
        !this.s.all("units").some((u) => u.id !== p.id && u.code === p.code),
        "Unit code already exists",
        409,
      );
      if (old.propertyId && p.propertyId !== old.propertyId)
        requireValue(
          !this.s.all("tenants").some((t) => t.unitId === p.id),
          "Move occupied units only after ending assignments",
          409,
        );
      if (p.arrangement === "individual")
        requireValue(
          eligible(this.s.all("tenants"), p.id, philippineDate()).length <= 1,
          "Individual arrangement cannot have multiple occupants",
        );
    }
    if (kind === "tenants") {
      const unit = this.must("units", p.unitId);
      p.propertyId = unit.propertyId;
      requireValue(
        p.fullName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email),
        "Full name and valid email are required",
      );
      requireValue(validDate(p.leaseStart), "Valid lease start is required");
      p.assignmentStart = p.assignmentStart || p.leaseStart;
      p.assignmentEnd = p.assignmentEnd || null;
      p.leaseEnd = p.leaseEnd || null;
      requireValue(
        validDate(p.assignmentStart) &&
          (!p.assignmentEnd ||
            (validDate(p.assignmentEnd) &&
              p.assignmentEnd >= p.assignmentStart)) &&
          (!p.leaseEnd ||
            (validDate(p.leaseEnd) && p.leaseEnd >= p.leaseStart)),
        "Invalid assignment or lease dates",
      );
      requireValue(
        p.assignmentStart >= p.leaseStart &&
          (!p.leaseEnd || !p.assignmentEnd || p.assignmentEnd <= p.leaseEnd),
        "Assignment must fall inside the lease",
      );
      p.assignmentEnd = p.assignmentEnd ?? p.leaseEnd;
      p.moveInDate = p.assignmentStart;
      p.occupancy = p.occupancy || "active";
      requireValue(
        ["active", "notice", "ended"].includes(p.occupancy),
        "Invalid occupancy",
      );
      if (p.occupancy === "ended")
        requireValue(p.assignmentEnd, "Termination date is required");
      if (old.unitId && p.unitId !== old.unitId)
        requireValue(
          !this.s.all("bills").some((b) => b.tenantId === p.id),
          "Tenant with financial history requires a new assignment record; end the current lease first",
          409,
        );
      if (unit.arrangement === "individual")
        requireValue(
          !this.s
            .all("tenants")
            .some(
              (t) =>
                t.id !== p.id &&
                t.unitId === p.unitId &&
                t.assignmentStart <= (p.assignmentEnd ?? "9999-12-31") &&
                p.assignmentStart <= (t.assignmentEnd ?? "9999-12-31"),
            ),
          "Individual unit already has an overlapping assignment",
          409,
        );
      const usedCredit = this.s.get("credits", "advance:" + p.id);
      if (usedCredit?.appliedBillId) {
        const final = this.must("bills", usedCredit.appliedBillId),
          end = p.assignmentEnd ?? p.leaseEnd;
        requireValue(
          end &&
            final.dueDate <= end &&
            monthAfter(final.dueDate, Number(p.leaseStart.slice(-2))) > end,
          "Applied advance credit fixes the final cycle; financial history cannot be silently moved",
          409,
        );
      }
      if (old.leaseStart && p.leaseStart !== old.leaseStart)
        requireValue(
          !this.s.all("bills").some((b) => b.tenantId === p.id),
          "Original lease start cannot change after billing",
          409,
        );
    }
    if (kind === "mappings") {
      this.must("units", p.unitId);
      requireValue(
        p.provider &&
          p.account &&
          ["electricity", "water"].includes(p.category),
        "Provider, account and utility category are required",
      );
      p.provider = p.provider.toLowerCase();
      p.account = p.account.toUpperCase();
      requireValue(
        !this.s
          .all("mappings")
          .some(
            (m) =>
              m.id !== p.id &&
              m.provider === p.provider &&
              m.account === p.account,
          ),
        "Provider/account mapping must be unique",
        409,
        "V03",
      );
    }
    const financialFields =
      kind === "units"
        ? ["monthlyRent"]
        : kind === "tenants"
          ? ["leaseEnd", "assignmentStart", "assignmentEnd"]
          : [];
    const changedFinancial = financialFields.filter(
      (k) =>
        id && JSON.stringify(old[k] ?? null) !== JSON.stringify(p[k] ?? null),
    );
    const hasHistory = this.s
      .all("bills")
      .some((b) =>
        kind === "tenants"
          ? b.tenantId === p.id
          : kind === "units" &&
            this.must("tenants", b.tenantId).unitId === p.id,
      );
    if (changedFinancial.length && hasHistory)
      requireValue(
        typeof body.reason === "string" && body.reason.trim().length >= 3,
        "A reason is required when changing lease or rent settings with billing history",
      );
    return this.s.transaction(() => {
      for (const field of changedFinancial)
        if (hasHistory)
          this.s.save("corrections", {
            id: newId("cor"),
            sourceId: null,
            billId: null,
            managerId: user.id,
            field,
            entityType: kind,
            entityId: p.id,
            originalValue: old[field] ?? null,
            correctedValue: p[field] ?? null,
            reason: body.reason.trim(),
            at: new Date().toISOString(),
          });
      this.s.save(kind, p);
      if (kind === "tenants") {
        this.s.save("assignments", {
          id: "assignment-" + p.id,
          tenantId: p.id,
          unitId: p.unitId,
          start: p.assignmentStart,
          end: p.assignmentEnd,
          occupancy: p.occupancy,
        });
        this.s.save("leases", {
          id: "lease-" + p.id,
          tenantId: p.id,
          unitId: p.unitId,
          start: p.leaseStart,
          end: p.leaseEnd,
          anniversaryDay: Number(p.leaseStart.slice(-2)),
        });
        const account = this.s.all("users").find((u) => u.tenantId === p.id);
        if (account)
          this.s.save("users", {
            ...account,
            name: p.fullName,
            email: p.email,
            phone: p.phone,
          });
      }
      if (kind === "tenants") this.reconcileAdvanceCredits();
      this.s.audit(
        user,
        id ? "Record updated" : "Record created",
        kind + ":" + p.id,
      );
      return p;
    });
  }
  deleteEntity(user, kind, id) {
    this.role(user, "manager");
    this.must(kind, id);
    return this.s.transaction(() => {
      if (kind === "tenants") {
        requireValue(
          !this.s.all("bills").some((b) => b.tenantId === id) &&
            !this.s.all("users").some((u) => u.tenantId === id),
          "Tenant has history/account; end the assignment instead",
          409,
        );
        this.s.remove("leases", "lease-" + id);
        this.s.remove("assignments", "assignment-" + id);
      }
      try {
        this.s.remove(kind, id);
      } catch (e) {
        if (e.code?.startsWith("ERR_SQLITE"))
          throw new HttpError(
            409,
            "Record has dependent records. Preserve its history or remove unused dependencies first.",
          );
        throw e;
      }
      this.s.audit(user, "Record deleted", kind + ":" + id);
      return { ok: true };
    });
  }
  saveBill(bill) {
    this.s.save("bills", bill);
    for (const line of bill.lines)
      this.s.save("lines", { ...line, billId: bill.id });
    return bill;
  }
  billFor(tenant, unit, key, lines, dueDate, sourceId = null) {
    const id = newId("bil");
    return {
      id,
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      unitCode: unit.code,
      propertyId: unit.propertyId,
      sourceId,
      cycleKey: key,
      lines: lines.map((l) => ({
        ...l,
        id: newId("ln"),
        paymentStatus: "unpaid",
      })),
      totalDue: money(lines.reduce((s, l) => s + cents(l.amount), 0)),
      dueDate,
      paymentStatus: "unpaid",
      arrangement: unit.arrangement,
      finalized: true,
      receiptId: null,
      cycle: dueDate.slice(0, 7),
      revision: 1,
      createdAt: new Date().toISOString(),
    };
  }
  notify(tenantId, title, body, kind, key) {
    if (this.s.all("notifications").some((n) => n.eventKey === key)) return;
    return this.s.save("notifications", {
      id: newId("ntf"),
      tenantId,
      title,
      body,
      kind,
      eventKey: key,
      timestamp: new Date().toISOString(),
      read: false,
      delivery: "pending",
      attempts: 0,
    });
  }
  publishBill(b) {
    this.saveBill(b);
    this.notify(
      b.tenantId,
      "New bill available",
      `${b.cycle}: ₱${b.totalDue.toFixed(2)} due ${b.dueDate}`,
      "billing",
      "bill:" + b.id + ":" + b.revision,
    );
    this.s.activity("Bill Finalized", b.id, "Unpaid", "#/bills?tab=records");
  }
  applyAdvance(user, id, body) {
    this.role(user, "manager");
    requireValue(body.confirmed === true, "Manager confirmation of credit application is required");
    return this.s.transaction(() => {
      const bill = this.must("bills", id);
      const credit = this.s.get("credits", "advance:" + bill.tenantId);
      requireValue(credit && (!credit.appliedBillId || credit.appliedBillId === id), "No available confirmed advance for this bill", 409);
      if (credit.appliedBillId === id) return { bill, unchanged: true };
      this.reconcileAdvanceCredits(user, id);
      requireValue(this.s.get("credits", credit.id).appliedBillId === id, "Credit cannot be applied: review final-cycle eligibility, payment status and amount", 409);
      return { bill: this.must("bills", id), unchanged: false };
    });
  }
  reconcileAdvanceCredits(user = null, targetBillId = null) {
    for (const credit of this.s
      .all("credits")
      .filter((c) => !c.appliedBillId)) {
      const tenant = this.must("tenants", credit.tenantId),
        end = tenant.assignmentEnd ?? tenant.leaseEnd;
      if (!end) continue;
      const final = this.s
        .all("bills")
        .filter(
          (b) =>
            b.tenantId === tenant.id &&
            !b.sourceId &&
            b.dueDate <= end &&
            monthAfter(b.dueDate, Number(tenant.leaseStart.slice(-2))) > end,
        )
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0];
      if (!final) continue;
      if (targetBillId && targetBillId !== final.id) continue;
      const line = final.lines.find(
          (l) => l.category === "rent" && !l.isAdvance,
        ),
        amount = cents(credit.amount);
      const key = "advance-credit:" + tenant.id;
      if (
        final.paymentStatus !== "unpaid" ||
        !line ||
        amount > cents(line.amount)
      ) {
        if (
          !this.s
            .all("exceptions")
            .some((e) => e.title === key && e.state === "open")
        )
          this.s.save("exceptions", {
            id: newId("exc"),
            sourceId: null,
            billId: final.id,
            source: "billing",
            title: key,
            ruleId: "A01",
            reason: "Advance credit needs Manager review",
            detail:
              final.paymentStatus !== "unpaid"
                ? "Final rent has already been reported or confirmed. Preserve the transaction and review the payment report before applying credit."
                : "Confirmed advance exceeds the final-cycle share. The unused credit remains on record pending Manager review.",
            state: "open",
            severity: "high",
            fields: [],
            raisedAt: new Date().toISOString(),
          });
        continue;
      }
      // Generation, corrections, confirmation and scheduling never authorize settlement.
      if (!user) continue;
      this.role(user, "manager");
      const original = this.must("bills", credit.billId);
      const receipt = original.receiptId && this.s.get("receipts", original.receiptId);
      requireValue(original.paymentStatus === "paid" && receipt && receipt.tenantId === tenant.id, "Advance must have a confirmed payment and original receipt", 409);
      final.revisions = [
        ...(final.revisions ?? []),
        {
          revision: final.revision,
          lines: structuredClone(final.lines),
          totalDue: final.totalDue,
          dueDate: final.dueDate,
          recordedAt: new Date().toISOString(),
        },
      ];
      line.grossAmount = line.amount;
      line.credit = money(amount);
      line.advanceBillId = credit.billId;
      line.advanceReceiptId = this.must("bills", credit.billId).receiptId;
      line.amount = money(cents(line.amount) - amount);
      final.totalDue = money(
        final.lines.reduce((sum, l) => sum + cents(l.amount), 0),
      );
      final.revision++;
      final.creditSettled = final.totalDue === 0;
      if (final.creditSettled) {
        final.paymentStatus = "paid";
        final.receiptId = original.receiptId;
        final.settlementPaymentId = receipt.paymentId;
        final.lines = final.lines.map(l => ({ ...l, paymentStatus: "paid" }));
      }
      this.saveBill(final);
      this.s.save("credits", {
        ...credit,
        appliedBillId: final.id,
        appliedAmount: money(amount),
        appliedAt: new Date().toISOString(),
        appliedBy: user.id,
      });
      for (const e of this.s
        .all("exceptions")
        .filter((e) => e.title === key && e.state === "open"))
        this.s.save("exceptions", {
          ...e,
          state: "revalidated",
          resolvedAt: new Date().toISOString(),
        });
      this.notify(
        tenant.id,
        "Advance rent credit applied",
        `Final rent due ${final.dueDate}: ₱${final.totalDue.toFixed(2)} remaining.`,
        "billing",
        "credit:" + credit.id + ":" + final.id,
      );
      this.s.audit(user, "Confirmed advance applied to final rent", final.id);
    }
  }
  correctRent(user, id, body) {
    this.role(user, "manager");
    const original = this.must("bills", id);
    requireValue(
      !original.sourceId && original.lines.some((l) => l.category === "rent"),
      "Only a rent cycle can use this correction",
    );
    requireValue(
      typeof body.reason === "string" && body.reason.trim().length >= 3,
      "Correction reason is required",
    );
    const sourceAmount = cents(body.amount);
    requireValue(sourceAmount > 0, "Monthly rent must be positive");
    const prefix = original.cycleKey.slice(
      0,
      original.cycleKey.lastIndexOf(":"),
    );
    const group = this.s
      .all("bills")
      .filter(
        (b) => b.cycleKey.slice(0, b.cycleKey.lastIndexOf(":")) === prefix,
      );
    requireValue(
      group.every((b) => b.paymentStatus === "unpaid"),
      "Reported or confirmed financial transactions cannot be changed",
      409,
    );
    const shares = splitCentavos(sourceAmount, original.eligibleTenantIds),
      now = new Date().toISOString();
    for (const b of group) {
      const share = shares.find((s) => s.tenantId === b.tenantId),
        line = b.lines.find((l) => !l.isAdvance);
      requireValue(
        share && cents(line.credit ?? 0) <= share.cents,
        "Corrected rent cannot be below an already applied advance credit",
        409,
      );
    }
    return this.s.transaction(() => {
      for (const b of group) {
        const share = shares.find((s) => s.tenantId === b.tenantId),
          line = b.lines.find((l) => !l.isAdvance);
        this.s.save("corrections", {
          id: newId("cor"),
          sourceId: null,
          billId: b.id,
          managerId: user.id,
          field: "rentSourceAmount",
          originalValue: line.sourceAmount,
          correctedValue: money(sourceAmount),
          reason: body.reason.trim(),
          at: now,
          revision: b.revision + 1,
        });
        b.revisions = [
          ...(b.revisions ?? []),
          {
            revision: b.revision,
            lines: structuredClone(b.lines),
            totalDue: b.totalDue,
            dueDate: b.dueDate,
            recordedAt: now,
          },
        ];
        line.sourceAmount = money(sourceAmount);
        line.grossAmount = money(share.cents);
        line.amount = money(share.cents - cents(line.credit ?? 0));
        line.allocations = shares.map((s) => ({
          ...s,
          share: money(s.cents),
          tenantName: this.must("tenants", s.tenantId).fullName,
        }));
        for (const advance of b.lines.filter((l) => l.isAdvance))
          advance.amount = money(share.cents);
        b.totalDue = money(
          b.lines.reduce((sum, l) => sum + cents(l.amount), 0),
        );
        b.revision++;
        this.publishBill(b);
        const allocation = this.s
          .all("allocations")
          .find((a) => a.billId === b.id);
        if (allocation)
          this.s.save("allocations", { ...allocation, cents: share.cents });
      }
      this.reconcileAdvanceCredits();
      this.s.audit(user, "Rent correction revalidated", original.id);
      return { billIds: group.map((b) => b.id) };
    });
  }
  generateRent(today = philippineDate()) {
    requireValue(validDate(today), "Invalid generation date");
    let generated = 0;
    this.s.transaction(() => {
      const tenants = this.s.all("tenants");
      for (const unit of this.s.all("units")) {
        const dates = new Set();
        for (const t of tenants.filter((t) => t.unitId === unit.id)) {
          let date = t.leaseStart;
          let guard = 0;
          while (
            date <= today &&
            (!t.leaseEnd || date <= t.leaseEnd) &&
            guard++ < 1200
          ) {
            dates.add(date);
            date = monthAfter(date, Number(t.leaseStart.slice(-2)));
          }
        }
        for (const date of [...dates].sort()) {
          const occupants = eligible(tenants, unit.id, date).filter(
            (t) => t.leaseStart <= date && (!t.leaseEnd || date <= t.leaseEnd),
          );
          if (!occupants.length) continue;
          const cycleKey =
            unit.id +
            ":rent:" +
            date.slice(0, 7) +
            (unit.arrangement === "individual"
              ? ":lease-" + occupants[0].id
              : "");
          if (this.s.get("rent_cycles", cycleKey)) continue;
          // A shared unit has one lease-cycle schedule. Different anniversaries require intervention.
          if (
            unit.arrangement === "shared_occupancy" &&
            new Set(occupants.map((t) => Number(t.leaseStart.slice(-2)))).size >
              1
          ) {
            if (
              !this.s
                .all("exceptions")
                .some((e) => e.title === cycleKey && e.state === "open")
            )
              this.s.save("exceptions", {
                id: newId("exc"),
                billId: null,
                sourceId: null,
                source: "billing",
                title: cycleKey,
                reason: "Shared rent anniversaries conflict",
                detail: "Align the unit lease anniversary before generation.",
                severity: "high",
                ruleId: "C02",
                fields: [],
                state: "open",
                raisedAt: new Date().toISOString(),
              });
            continue;
          }
          requireValue(
            unit.arrangement === "shared_occupancy" || occupants.length === 1,
            "Invalid individual occupancy",
            422,
            "C02",
          );
          const shares = splitCentavos(
            cents(unit.monthlyRent),
            occupants.map((t) => t.id),
          );
          for (const share of shares) {
            const t = occupants.find((t) => t.id === share.tenantId),
              next = monthAfter(date, Number(t.leaseStart.slice(-2)));
            const first = !this.s
              .all("bills")
              .some(
                (b) =>
                  b.tenantId === t.id &&
                  b.lines.some((l) => l.category === "rent" && !l.isAdvance),
              );
            const lines = [
              {
                category: "rent",
                period: `${date} to ${addDays(next, -1)}`,
                coverageStart: date,
                coverageEnd: addDays(next, -1),
                generationDate: date,
                dueDate: date,
                amount: money(share.cents),
                sourceAmount: unit.monthlyRent,
                allocations: shares.map((a) => ({
                  ...a,
                  share: money(a.cents),
                  tenantName: occupants.find((o) => o.id === a.tenantId)
                    .fullName,
                })),
                rules: ["C02", "A01", "R01"],
              },
            ];
            if (first && this.config().advanceRentEnabled)
              lines.push({
                category: "rent",
                label: "Advance Rent (1 month)",
                isAdvance: true,
                period: "First Billing",
                amount: money(share.cents),
                dueDate: date,
              });
            const bill = this.billFor(
              t,
              unit,
              cycleKey + ":" + t.id,
              lines,
              date,
            );
            bill.eligibleTenantIds = shares.map((s) => s.tenantId);
            this.publishBill(bill);
            this.s.save("allocations", {
              id: newId("alloc"),
              sourceId: null,
              billId: bill.id,
              tenantId: t.id,
              cents: share.cents,
              eligibilityDate: date,
              eligibleTenantIds: bill.eligibleTenantIds,
            });
            generated++;
          }
          this.s.save("rent_cycles", {
            id: cycleKey,
            unitId: unit.id,
            date,
            rules: ["R01", "A01"],
          });
          for (const e of this.s
            .all("exceptions")
            .filter((e) => e.title === cycleKey && e.state === "open"))
            this.s.save("exceptions", {
              ...e,
              state: "revalidated",
              resolvedAt: new Date().toISOString(),
            });
        }
      }
      this.reconcileAdvanceCredits();
      if (generated)
        this.s.audit(
          null,
          "Rent generation completed",
          `${today}: ${generated} bills`,
        );
    });
    return { generated, date: today };
  }
  processIncoming(id, user = null) {
    const doc = this.must("incoming", id),
      failures = [],
      rules = [];
    const fail = (rule, reason) => {
      failures.push({ rule, reason });
      rules.push(rule);
    };
    if (doc.ocrStatus === "validated")
      return {
        document: doc,
        failures: [],
        billIds: this.s
          .all("bills")
          .filter((b) => b.sourceId === id)
          .map((b) => b.id),
        unchanged: true,
      };
    if (doc.extractionError) fail("V01", doc.extractionError);
    if (doc.conflicts?.length)
      fail("V01", "Conflicting extracted values: " + doc.conflicts.join(", "));
    if (
      !doc.provider ||
      !doc.accountRef ||
      doc.amountDue == null ||
      !doc.dueDate ||
      !doc.periodStart ||
      !doc.periodEnd
    )
      fail("V01", "Missing required billing information");
    try {
      requireValue(
        cents(doc.amountDue) >= 0 &&
          validDate(doc.dueDate) &&
          validDate(doc.periodStart) &&
          validDate(doc.periodEnd) &&
          doc.periodStart <= doc.periodEnd,
        "Invalid amount, due date or billing period",
      );
      rules.push("V02");
    } catch {
      fail("V02", "Invalid amount, due date or billing period");
    }
    const mappings = this.s
      .all("mappings")
      .filter(
        (m) =>
          m.provider === String(doc.provider).toLowerCase() &&
          m.account === String(doc.accountRef).toUpperCase(),
      );
    if (mappings.length !== 1)
      fail("V03", "Provider/account mapping unresolved or ambiguous");
    else rules.push("V03");
    const intakeOrder = this.s.db
      .prepare("SELECT id FROM incoming ORDER BY rowid")
      .all()
      .map((d) => d.id);
    const duplicates = this.s
      .all("incoming")
      .filter(
        (d) =>
          d.id !== id &&
          ((doc.documentHash &&
            d.documentHash === doc.documentHash &&
            intakeOrder.indexOf(d.id) < intakeOrder.indexOf(id)) ||
            ((d.ocrStatus === "validated" ||
              intakeOrder.indexOf(d.id) < intakeOrder.indexOf(id)) &&
              doc.provider &&
              doc.accountRef &&
              doc.periodStart &&
              doc.periodEnd &&
              String(d.provider).toLowerCase() ===
                String(doc.provider).toLowerCase() &&
              String(d.accountRef).toUpperCase() ===
                String(doc.accountRef).toUpperCase() &&
              d.periodStart === doc.periodStart &&
              d.periodEnd === doc.periodEnd)),
      );
    if (duplicates.length)
      fail("V04", "Duplicate document or provider/account billing period");
    else rules.push("V04");
    const mapping = mappings[0],
      unit = mapping ? this.must("units", mapping.unitId) : null;
    const previous = this.s.all("bills").filter((b) => b.sourceId === id);
    let occupants = unit
      ? eligible(this.s.all("tenants"), unit.id, doc.periodEnd)
      : [];
    if (previous.length)
      occupants = previous.map((b) => this.must("tenants", b.tenantId));
    if (mapping && !["electricity", "water"].includes(mapping.category))
      fail("C01", "Unsupported billing classification");
    else if (mapping) rules.push("C01");
    if (
      unit &&
      (!["individual", "shared_occupancy"].includes(unit.arrangement) ||
        (unit.arrangement === "individual"
          ? occupants.length !== 1
          : occupants.length < 1))
    )
      fail("C02", "No valid occupants for the billing-period end date");
    else if (unit) rules.push("C02");
    if (unit && !occupants.length)
      fail("A01", "No eligible allocation recipients");
    if (previous.some((b) => b.paymentStatus !== "unpaid"))
      fail(
        "A01",
        "Confirmed or reported financial records cannot be silently recomputed",
      );
    if (previous.length && unit?.id !== doc.unitId)
      fail("V03", "Finalized source mapping cannot move to another unit");
    return this.s.transaction(() => {
      const existingExceptions = this.s
        .all("exceptions")
        .filter((e) => e.sourceId === id && e.state === "open");
      for (const e of existingExceptions)
        if (!failures.some((f) => f.rule === e.ruleId && f.reason === e.reason))
          this.s.save("exceptions", {
            ...e,
            state: "revalidated",
            resolvedAt: new Date().toISOString(),
          });
      doc.rules = [...new Set(["V01", ...rules])];
      doc.validationResults = [
        "V01",
        "V02",
        "V03",
        "V04",
        "C01",
        "C02",
        "A01",
      ].map((rule) => ({
        rule,
        outcome: failures.some((f) => f.rule === rule)
          ? "failed"
          : doc.rules.includes(rule)
            ? "passed"
            : "not_run",
        reasons: failures.filter((f) => f.rule === rule).map((f) => f.reason),
      }));
      doc.processingOutcome = failures.length ? "exception" : "finalized";
      doc.ocrStatus = failures.length ? "failed" : "validated";
      doc.validatedAt = new Date().toISOString();
      if (mapping) {
        doc.category = mapping.category;
        doc.propertyId = unit.propertyId;
        doc.unitId = unit.id;
      }
      if (failures.length) {
        for (const f of failures)
          this.s.save("exceptions", {
            id:
              existingExceptions.find(
                (e) => e.ruleId === f.rule && e.reason === f.reason,
              )?.id ?? newId("exc"),
            sourceId: id,
            billId: null,
            source: "incoming_bill",
            ruleId: f.rule,
            reason: f.reason,
            title: `${doc.provider || "Unknown provider"} · ${doc.accountRef || "missing account"}`,
            detail: f.reason,
            severity: "high",
            fields: [
              "accountRef",
              "amountDue",
              "dueDate",
              "periodStart",
              "periodEnd",
            ].map((k) => ({
              label: k,
              value: String(doc[k] ?? "not found"),
              missing: doc[k] == null || doc[k] === "",
            })),
            state: "open",
            raisedAt:
              existingExceptions.find(
                (e) => e.ruleId === f.rule && e.reason === f.reason,
              )?.raisedAt ?? new Date().toISOString(),
            lastReviewedAt: new Date().toISOString(),
          });
        this.s.save("incoming", doc);
        return { document: doc, failures };
      }
      doc.rules.push("A01");
      doc.validationResults.find((r) => r.rule === "A01").outcome = "passed";
      const shares = splitCentavos(
        cents(doc.amountDue),
        occupants.map((t) => t.id),
      );
      doc.eligibleTenantIds = shares.map((s) => s.tenantId);
      for (const share of shares) {
        const t = occupants.find((t) => t.id === share.tenantId),
          existing = previous.find((b) => b.tenantId === t.id),
          line = {
            category: mapping.category,
            amount: money(share.cents),
            period: `${doc.periodStart} to ${doc.periodEnd}`,
            dueDate: doc.dueDate,
            sourceRef: doc.accountRef,
            sourceAmount: doc.amountDue,
            allocations: shares.map((a) => ({
              ...a,
              share: money(a.cents),
              tenantName: occupants.find((t) => t.id === a.tenantId).fullName,
            })),
            rules: doc.rules,
          };
        let b = existing
          ? {
              ...existing,
              lines: [
                { ...line, id: existing.lines[0].id, paymentStatus: "unpaid" },
              ],
              totalDue: line.amount,
              dueDate: doc.dueDate,
              revision: existing.revision + 1,
              revisions: [
                ...(existing.revisions ?? []),
                {
                  revision: existing.revision,
                  lines: existing.lines,
                  totalDue: existing.totalDue,
                  dueDate: existing.dueDate,
                  recordedAt: new Date().toISOString(),
                },
              ],
            }
          : this.billFor(
              t,
              unit,
              `utility:${id}:${t.id}`,
              [line],
              doc.dueDate,
              id,
            );
        b.eligibleTenantIds = doc.eligibleTenantIds;
        this.publishBill(b);
        const a = this.s.all("allocations").find((a) => a.billId === b.id);
        this.s.save("allocations", {
          id: a?.id ?? newId("alloc"),
          sourceId: id,
          billId: b.id,
          tenantId: t.id,
          cents: share.cents,
          eligibilityDate: doc.periodEnd,
          eligibleTenantIds: doc.eligibleTenantIds,
        });
      }
      this.s.save("incoming", doc);
      this.s.audit(user, "Utility record finalized", id);
      return {
        document: doc,
        failures: [],
        billIds: this.s
          .all("bills")
          .filter((b) => b.sourceId === id)
          .map((b) => b.id),
      };
    });
  }
  correctException(user, id, body) {
    this.role(user, "manager");
    const e = this.must("exceptions", id);
    if (!e.sourceId) {
      const result = this.generateRent();
      const fresh = this.must("exceptions", id);
      return {
        ...result,
        failures:
          fresh.state === "open"
            ? [{ rule: fresh.ruleId, reason: fresh.detail ?? fresh.reason }]
            : [],
      };
    }
    requireValue(
      e.sourceId,
      "This exception needs a lease/occupancy configuration correction followed by rent generation",
    );
    const doc = this.must("incoming", e.sourceId);
    if (body.field) {
      requireValue(
        [
          "provider",
          "accountRef",
          "amountDue",
          "dueDate",
          "periodStart",
          "periodEnd",
        ].includes(body.field),
        "Unsupported correction field",
      );
      requireValue(
        typeof body.reason === "string" && body.reason.trim().length >= 3,
        "Correction reason is required",
      );
      requireValue(
        !this.s
          .all("bills")
          .some((b) => b.sourceId === doc.id && b.paymentStatus !== "unpaid"),
        "Reported or confirmed financial transactions cannot be changed",
        409,
      );
      this.s.transaction(() => {
        this.s.save("corrections", {
          id: newId("cor"),
          sourceId: doc.id,
          billId: null,
          managerId: user.id,
          field: body.field,
          originalValue: doc[body.field],
          correctedValue: body.value,
          reason: body.reason,
          at: new Date().toISOString(),
          revision: (doc.revision ?? 1) + 1,
        });
        doc[body.field] =
          body.field === "amountDue"
            ? money(cents(body.value))
            : String(body.value).trim();
        doc.revision = (doc.revision ?? 1) + 1;
        doc.extractionError = null;
        doc.conflicts = (doc.conflicts ?? []).filter((k) => k !== body.field);
        doc.ocrStatus = "processing";
        doc.billingPeriod = `${doc.periodStart} to ${doc.periodEnd}`;
        this.s.save("incoming", doc);
        this.s.audit(user, "Source correction recorded", doc.id);
      });
    }
    return this.processIncoming(doc.id, user);
  }
  bills(user, filters = {}) {
    this.role(user, "manager", "tenant");
    if (filters.tenantId) this.own(user, filters.tenantId);
    return this.s
      .all("bills")
      .filter(
        (b) =>
          (user.role === "manager" || b.tenantId === user.tenantId) &&
          (!filters.tenantId || b.tenantId === filters.tenantId) &&
          (!filters.status || b.paymentStatus === filters.status) &&
          (!filters.q ||
            `${b.id} ${b.tenantName} ${b.unitCode}`
              .toLowerCase()
              .includes(filters.q.toLowerCase())),
      )
      .map(b => {
        const credit = this.s.get("credits", "advance:" + b.tenantId);
        const tenant = this.must("tenants", b.tenantId);
        const end = tenant.assignmentEnd ?? tenant.leaseEnd;
        const isFinal = end && !b.sourceId && b.dueDate <= end && monthAfter(b.dueDate, Number(tenant.leaseStart.slice(-2))) > end;
        return { ...b, availableAdvanceCredit: isFinal && credit && !credit.appliedBillId && b.paymentStatus === "unpaid" ? credit.amount : 0 };
      })
      .sort(
        (a, b) =>
          b.dueDate.localeCompare(a.dueDate) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }
  payments(user, filters = {}) {
    this.role(user, "manager", "tenant");
    if (filters.tenantId) this.own(user, filters.tenantId);
    return this.s
      .all("payments")
      .filter(
        (p) =>
          (user.role === "manager" || p.tenantId === user.tenantId) &&
          (!filters.tenantId || p.tenantId === filters.tenantId) &&
          (!filters.status || p.status === filters.status),
      )
      .sort((a, b) => b.reportedOn.localeCompare(a.reportedOn));
  }
  report(user, id, body) {
    this.role(user, "tenant");
    const bill = this.must("bills", id);
    this.own(user, bill.tenantId);
    const view = this.bills(user, {tenantId: bill.tenantId}).find(b => b.id === id);
    requireValue(!view.availableAdvanceCredit, "Manager must review/apply the confirmed final-cycle advance before the remaining balance is reported", 409);
    requireValue(
      ["cash", "bank_transfer", "e_wallet"].includes(body.method),
      "Select a valid payment method",
    );
    const reference = String(body.reference ?? "").trim();
    requireValue(
      body.method === "cash" || reference.length >= 3,
      "A payment reference is required for electronic payments",
    );
    requireValue(reference.length <= 150, "Reference is too long");
    return this.s.transaction(() => {
      const fresh = this.must("bills", id);
      if (fresh.paymentStatus === "tenant_reported_paid") {
        return {
          bill: fresh,
          payment: this.s
            .all("payments")
            .find(
              (p) =>
                p.billId === id &&
                p.status === "tenant_reported_paid" &&
                !p.rejectedOn,
            ),
          unchanged: true,
        };
      }
      requireValue(
        fresh.paymentStatus === "unpaid" && cents(fresh.totalDue) > 0,
        "This bill has no outstanding payment to report",
        409,
      );
      const p = {
        id: newId("pay"),
        billId: id,
        tenantId: bill.tenantId,
        tenantName: bill.tenantName,
        amount: bill.totalDue,
        method: body.method,
        reference,
        reportedOn: new Date().toISOString(),
        status: "tenant_reported_paid",
        confirmedOn: null,
        receiptNumber: null,
      };
      fresh.paymentStatus = "tenant_reported_paid";
      fresh.lines = fresh.lines.map((l) => ({
        ...l,
        paymentStatus: fresh.paymentStatus,
      }));
      this.saveBill(fresh);
      this.s.save("payments", p);
      this.s.audit(user, "Payment reported", p.id);
      this.s.activity(
        "Tenant Payment",
        `${bill.tenantName} · ${bill.unitCode}`,
        "Pending",
        "#/bills?tab=payments",
        user.name,
      );
      return { bill: fresh, payment: p };
    });
  }
  confirm(user, id) {
    this.role(user, "manager");
    return this.s.transaction(() => {
      const p = this.must("payments", id);
      if (p.status === "paid") return p;
      requireValue(
        !p.rejectedOn && p.status === "tenant_reported_paid",
        "This report is no longer pending",
        409,
      );
      const b = this.must("bills", p.billId);
      requireValue(
        b.paymentStatus === "tenant_reported_paid" &&
          cents(p.amount) === cents(b.totalDue),
        "Payment and outstanding bill do not match",
        409,
      );
      p.status = "paid";
      p.confirmedOn = new Date().toISOString();
      p.confirmedBy = user.id;
      p.receiptNumber = newId("RCP");
      b.paymentStatus = "paid";
      b.receiptId = p.receiptNumber;
      b.lines = b.lines.map((l) => ({ ...l, paymentStatus: "paid" }));
      this.saveBill(b);
      this.s.save("payments", p);
      this.s.save("receipts", {
        id: p.receiptNumber,
        paymentId: p.id,
        billId: b.id,
        tenantId: b.tenantId,
        tenantName: b.tenantName,
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        confirmedOn: p.confirmedOn,
        confirmedBy: user.name,
      });
      const advance = b.lines
        .filter((l) => l.isAdvance)
        .reduce((s, l) => s + cents(l.amount), 0);
      if (advance)
        this.s.save("credits", {
          id: "advance:" + b.tenantId,
          tenantId: b.tenantId,
          billId: b.id,
          amount: money(advance),
          appliedBillId: null,
        });
      this.reconcileAdvanceCredits();
      this.s.audit(user, "Payment confirmed; receipt issued", p.id);
      this.s.activity(
        "Payment Confirmed",
        b.id,
        "Paid",
        "#/bills?tab=payments",
        user.name,
      );
      this.s.activity(
        "Receipt Generated",
        p.receiptNumber,
        "Paid",
        "#/bills?tab=payments",
        user.name,
      );
      this.notify(
        b.tenantId,
        "Payment confirmed",
        `Receipt ${p.receiptNumber} is available.`,
        "receipt",
        "receipt:" + p.receiptNumber,
      );
      return p;
    });
  }
  reject(user, id, reason) {
    this.role(user, "manager");
    requireValue(
      typeof reason === "string" && reason.trim().length >= 3,
      "Rejection reason is required",
    );
    return this.s.transaction(() => {
      const p = this.must("payments", id);
      if (p.rejectedOn) return p;
      requireValue(
        p.status === "tenant_reported_paid",
        "Only pending reports can be rejected",
        409,
      );
      const b = this.must("bills", p.billId);
      p.rejectedOn = new Date().toISOString();
      p.rejectedBy = user.id;
      p.rejectionReason = reason.trim();
      p.status = "unpaid";
      b.paymentStatus = "unpaid";
      b.lines = b.lines.map((l) => ({ ...l, paymentStatus: "unpaid" }));
      this.s.save("payments", p);
      this.saveBill(b);
      this.reconcileAdvanceCredits();
      this.s.audit(user, "Payment report rejected", p.id);
      this.notify(
        b.tenantId,
        "Payment report rejected",
        reason.trim(),
        "payment",
        "reject:" + p.id,
      );
      return p;
    });
  }
  receipt(user, id) {
    const r = this.must("receipts", id);
    this.own(user, r.tenantId);
    this.s.audit(user, "Receipt downloaded", id);
    return r;
  }
  documents(user, id) {
    this.own(user, id);
    return [
      ...this.s.all("documents").filter((d) => d.tenantId === id),
      ...this.s
        .all("receipts")
        .filter((r) => r.tenantId === id)
        .map((r) => ({
          id: r.id,
          name: r.id + ".html",
          kind: "receipt",
          meta: "Manager-confirmed receipt",
          size: "Digital receipt",
        })),
    ];
  }
  reminders(today = philippineDate()) {
    let created = 0;
    this.s.transaction(() => {
      for (const b of this.s
        .all("bills")
        .filter(
          (b) =>
            b.paymentStatus === "unpaid" &&
            b.totalDue > 0 &&
            addDays(b.dueDate, -3) === today,
        )) {
        if (
          this.notify(
            b.tenantId,
            "Due-date reminder",
            `${b.cycle}: ₱${b.totalDue.toFixed(2)} due ${b.dueDate}`,
            "reminder",
            "reminder:" + b.id + ":" + b.dueDate,
          )
        )
          created++;
      }
    });
    return { created, date: today };
  }
  summary(range = "current") {
    requireValue(
      ["current", "1d", "30d", "365d", "all"].includes(range),
      "Unsupported report range",
    );
    const today = philippineDate(),
      start =
        range === "all"
          ? "0000-01-01"
          : range === "current"
            ? today.slice(0, 7) + "-01"
            : addDays(today, -Number.parseInt(range) + 1);
    const bills = this.s
      .all("bills")
      .filter(
        (b) =>
          b.dueDate >= start &&
          (range === "all" ||
            (range === "current"
              ? b.dueDate.startsWith(today.slice(0, 7))
              : b.dueDate <= today)),
      );
    const payments = this.s
      .all("payments")
      .filter(
        (p) =>
          p.status === "paid" &&
          philippineDate(new Date(p.confirmedOn)) >= start &&
          philippineDate(new Date(p.confirmedOn)) <= today,
      );
    const byCategory = { rent: 0, electricity: 0, water: 0 },
      byStatus = { paid: 0, tenant_reported_paid: 0, unpaid: 0 };
    for (const b of bills) {
      byStatus[b.paymentStatus]++;
      for (const l of b.lines) byCategory[l.category] += cents(l.amount);
    }
    for (const k in byCategory) byCategory[k] = money(byCategory[k]);
    const props = this.s.all("properties").map((p) => this.property(p));
    return {
      cycle: today.slice(0, 7),
      range,
      byCategory,
      byProperty: props.map((p) => ({
        id: p.id,
        name: p.name,
        letter: p.letter,
        occupancy: p.occupancyRate,
        revenue: p.monthlyRevenue,
        units: p.totalUnits,
      })),
      byStatus,
      byStatusPercent: Object.fromEntries(
        Object.entries(byStatus).map(([k, v]) => [
          k,
          bills.length ? Math.round((v / bills.length) * 100) : 0,
        ]),
      ),
      outstanding: money(
        bills
          .filter((b) => b.paymentStatus !== "paid")
          .reduce((s, b) => s + cents(b.totalDue), 0),
      ),
      collected: money(payments.reduce((s, p) => s + cents(p.amount), 0)),
      openExceptions: this.s.all("exceptions").filter((e) => e.state === "open")
        .length,
      occupancy: this.units().length
        ? Math.round(
            (this.units().filter(
              (u) => u.status === "occupied" || u.status === "notice",
            ).length /
              this.units().length) *
              100,
          )
        : 0,
    };
  }
  stats() {
    const summary = this.summary("all");
    return {
      ...summary,
      totalUnits: { value: this.units().length, delta: null },
      totalTenants: {
        value: this.tenants().filter((t) => t.occupancy !== "ended").length,
        delta: null,
      },
      incomingBills: {
        value: this.s.all("incoming").filter((d) => d.ocrStatus !== "validated")
          .length,
        delta: null,
      },
      exceptionQueue: { value: summary.openExceptions, delta: null },
    };
  }
}
