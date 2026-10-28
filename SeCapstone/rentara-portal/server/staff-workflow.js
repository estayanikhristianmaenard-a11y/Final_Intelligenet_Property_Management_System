import { createHash } from "node:crypto";
import { newId } from "./store.js";
import { requireValue, cents, money } from "./rules.js";

export const descriptiveFields = {
  properties: ["name", "letter", "address", "city", "type"],
  units: ["code", "floor", "floorNumber", "type"],
  tenants: ["fullName", "phone", "emergencyContactName", "emergencyContactPhone"],
};
const fields = ["provider", "accountRef", "amountDue", "dueDate", "periodStart", "periodEnd"];
const now = () => new Date().toISOString();

function fingerprint(service, doc, changes) {
  const s = service.s;
  const accounts = [doc.accountRef, changes.accountRef].filter(Boolean).map(v => String(v).toUpperCase());
  const mappings = s.all("mappings").filter(m => accounts.includes(m.account));
  const unitIds = new Set(mappings.map(m => m.unitId));
  const context = { doc, mappings, units: s.all("units").filter(u => unitIds.has(u.id)),
    tenants: s.all("tenants").filter(t => unitIds.has(t.unitId)), config: service.config() };
  return createHash("sha256").update(JSON.stringify(context)).digest("hex");
}
function decorate(service, proposal) {
  const source = service.s.get("incoming", proposal.sourceId);
  return { ...proposal, filename: source?.filename ?? "Bill source",
    preparerName: service.s.get("users", proposal.preparedBy)?.name ?? "Former account",
    managerName: proposal.decidedBy ? service.s.get("users", proposal.decidedBy)?.name ?? null : null };
}
export function listProposals(service, user) {
  service.role(user, "staff", "manager");
  return service.s.all("correction_proposals").map(p => decorate(service, p))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function submitProposal(service, user, sourceId, body) {
  service.role(user, "staff");
  const s = service.s;
  return s.transaction(() => {
    const doc = service.must("incoming", sourceId);
    requireValue(doc.ocrStatus !== "validated" && !s.all("bills").some(b => b.sourceId === sourceId),
      "Staff proposals are limited to unfinalized incoming bills", 409);
    requireValue(body.changes && typeof body.changes === "object" && !Array.isArray(body.changes), "Correction changes are required");
    const keys = Object.keys(body.changes);
    requireValue(keys.length > 0 && keys.every(k => fields.includes(k)), "Unsupported correction field");
    requireValue(typeof body.reason === "string" && body.reason.trim().length >= 3 && body.reason.length <= 1000,
      "Explain the correction (3-1000 characters)");
    requireValue(!s.all("correction_proposals").some(p => p.sourceId === sourceId && p.state === "pending"),
      "This bill already has a pending proposal", 409);
    const changes = {};
    for (const key of keys) {
      const value = body.changes[key];
      requireValue(["string", "number"].includes(typeof value) && String(value).length <= 200, "Invalid correction value");
      changes[key] = key === "amountDue" ? money(cents(value)) : String(value).trim();
    }
    const proposal = s.save("correction_proposals", { id: newId("proposal"), sourceId,
      changes, previousValues: Object.fromEntries(keys.map(k => [k, doc[k] ?? null])),
      reason: body.reason.trim(), preparedBy: user.id, preparedRole: user.role,
      createdAt: now(), state: "pending", fingerprint: fingerprint(service, doc, changes) });
    for (const e of s.all("exceptions").filter(e => e.sourceId === sourceId && e.state === "open"))
      s.save("exceptions", { ...e, responsibility: "manager" });
    s.audit(user, "Bill correction proposed", proposal.id);
    return decorate(service, proposal);
  });
}
export function decideProposal(service, user, id, body) {
  service.role(user, "manager");
  requireValue(["approve", "reject"].includes(body.decision), "Choose approve or reject");
  const s = service.s;
  return s.transaction(() => {
    const proposal = service.must("correction_proposals", id);
    requireValue(proposal.state === "pending", "Proposal already decided; refresh the record", 409);
    const finish = (state, reason, extra = {}) => {
      const result = s.save("correction_proposals", { ...proposal, state,
        decidedBy: user.id, decisionRole: user.role, decidedAt: now(), decisionReason: reason });
      for (const e of s.all("exceptions").filter(e => e.sourceId === proposal.sourceId && e.state === "open"))
        s.save("exceptions", { ...e, responsibility: "staff" });
      s.audit(user, "Bill proposal " + state, id);
      return { proposal: decorate(service, result), ...extra };
    };
    if (body.decision === "reject") {
      requireValue(typeof body.reason === "string" && body.reason.trim().length >= 3 && body.reason.length <= 1000,
        "Explain the rejection (3-1000 characters)");
      return finish("rejected", body.reason.trim());
    }
    const doc = service.must("incoming", proposal.sourceId);
    const preparer = s.get("users", proposal.preparedBy);
    if (!preparer || preparer.status !== "active" || preparer.role !== "staff" ||
        preparer.workspaceId !== s.workspaceId ||
        doc.ocrStatus === "validated" || s.all("bills").some(b => b.sourceId === doc.id) ||
        fingerprint(service, doc, proposal.changes) !== proposal.fingerprint)
      return finish("stale", "Source, billing context or preparer access changed. Review the current record and submit again.");
    let result;
    try {
      result = s.transaction(() => {
        const corrected = { ...doc, ...proposal.changes, revision: (doc.revision ?? 1) + 1,
          conflicts: (doc.conflicts ?? []).filter(k => !(k in proposal.changes)),
          extractionError: null, ocrStatus: "processing" };
        corrected.billingPeriod = `${corrected.periodStart} to ${corrected.periodEnd}`;
        s.save("incoming", corrected);
        for (const [field, value] of Object.entries(proposal.changes))
          s.save("corrections", { id: newId("cor"), sourceId: doc.id, billId: null,
            managerId: user.id, preparedBy: proposal.preparedBy, proposalId: id,
            field, originalValue: doc[field] ?? null, correctedValue: value,
            reason: proposal.reason, at: now(), revision: corrected.revision });
        const applied = service.processIncoming(doc.id, user);
        if (applied.failures?.length) {
          const error = new Error("Correction failed validation");
          error.validationFailures = applied.failures;
          throw error;
        }
        return applied;
      });
    } catch (error) {
      if (!error.validationFailures) throw error;
      return finish("returned", error.validationFailures.map(f => f.reason).join("; "), { failures: error.validationFailures });
    }
    return finish("applied", "Authorized and revalidated", { document: result.document, billIds: result.billIds });
  });
}
export function addExceptionNote(service, user, id, body) {
  service.role(user, "staff", "manager");
  requireValue(typeof body.note === "string" && body.note.trim().length >= 3 && body.note.length <= 1000,
    "Investigation note must contain 3-1000 characters");
  return service.s.transaction(() => {
    const e = service.must("exceptions", id);
    requireValue(e.state === "open", "Only open exceptions accept notes", 409);
    const notes = [...(e.notes ?? []), { id: newId("note"), text: body.note.trim(), actorId: user.id,
      actor: user.name, role: user.role, at: now() }];
    requireValue(notes.length <= 100, "This case has reached its note limit");
    const result = service.s.save("exceptions", { ...e, notes,
      responsibility: body.escalate === true ? "manager" : e.responsibility ?? "staff" });
    service.s.audit(user, body.escalate === true ? "Exception escalated" : "Exception note added", id);
    return result;
  });
}
