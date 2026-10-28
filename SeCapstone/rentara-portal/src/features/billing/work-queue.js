// Presentation only: stored validation and proposal states remain authoritative.
export function intakeResult(source) {
  if (source.ocrStatus === "validated") return "processed";
  if (source.validationResults?.some(r => r.rule === "V04" && r.outcome === "failed")) return "duplicate";
  return source.ocrStatus === "failed" ? "review" : "processing";
}
export function staffQueues(exceptions, proposals) {
  const pending = new Set(proposals.filter(p => p.state === "pending").map(p => p.sourceId));
  // A source can have several historical proposals; only its latest decision matters.
  const latest = new Map();
  for (const p of [...proposals].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    if (!latest.has(p.sourceId)) latest.set(p.sourceId, p);
  }
  const returned = new Set([...latest.values()].filter(p => ["returned", "rejected", "stale"].includes(p.state) && !pending.has(p.sourceId)).map(p => p.sourceId));
  const open = exceptions.filter(e => e.state === "open");
  const withManager = open.filter(e => e.responsibility === "manager" || pending.has(e.sourceId));
  const back = open.filter(e => returned.has(e.sourceId) && !withManager.includes(e));
  return { staff: open.filter(e => !withManager.includes(e) && !back.includes(e)), manager: withManager, returned: back, resolved: exceptions.filter(e => e.state !== "open") };
}
