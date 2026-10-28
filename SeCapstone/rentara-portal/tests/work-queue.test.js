import test from "node:test";
import assert from "node:assert/strict";
import { intakeResult, staffQueues } from "../src/features/billing/work-queue.js";
test("intake presentation distinguishes finalized bills, duplicate holds and uncertain extraction", () => {
  assert.equal(intakeResult({ocrStatus:"validated"}), "processed");
  assert.equal(intakeResult({ocrStatus:"failed",validationResults:[{rule:"V04",outcome:"failed"}]}), "duplicate");
  assert.equal(intakeResult({ocrStatus:"failed",validationResults:[{rule:"V04",outcome:"not_run"}]}), "review");
  assert.equal(intakeResult({ocrStatus:"pending"}), "processing");
});
test("work queues are disjoint and latest proposal determines returned work", () => {
  const cases = [
    {id:"a",sourceId:"s1",state:"open"}, {id:"b",sourceId:"s2",state:"open"},
    {id:"c",sourceId:"s3",state:"open",responsibility:"manager"},
    {id:"d",sourceId:"s4",state:"open"}, {id:"e",sourceId:"s5",state:"closed"}
  ];
  const proposals = [
    {sourceId:"s1",state:"rejected",createdAt:"2026-01-01"},
    {sourceId:"s1",state:"pending",createdAt:"2026-01-02"},
    {sourceId:"s2",state:"returned",createdAt:"2026-01-02"}
  ];
  const q = staffQueues(cases,proposals);
  assert.deepEqual(q.staff.map(e=>e.id),["d"]);
  assert.deepEqual(q.manager.map(e=>e.id),["a","c"]);
  assert.deepEqual(q.returned.map(e=>e.id),["b"]);
  assert.deepEqual(q.resolved.map(e=>e.id),["e"]);
  assert.equal(new Set(Object.values(q).flat().map(e=>e.id)).size,cases.length);
});
