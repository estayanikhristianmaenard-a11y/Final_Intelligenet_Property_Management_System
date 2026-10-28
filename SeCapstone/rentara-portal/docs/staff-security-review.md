# Staff revision: targeted security review

23 October 2026. Risk-first differential triage of the Staff authorization/billing change using the installed differential-review guide. This is a focused review, not a complete security audit of every existing file. Earlier uncommitted intake/recovery work was preserved and is not claimed as newly implemented here.

## Baseline and reach

Baseline history inspected: `565eda8` (workspace-scoped role helper and service), with original ownership helper traced to `990cfb3`. The Staff change broadens permitted operational reads and adds descriptive edits; it does not remove workspace membership checks, Tenant ownership checks or Manager-only financial mutation guards. `own()` has ten call sites across service/index, covering Tenant detail, filtered bills/payments, receipt/document access and Tenant writes. Document routes keep an additional Manager/Tenant role guard. Tenant write methods keep Tenant-only guards. Financial writes keep Manager-only guards.

High-risk paths reviewed: service role/ownership/entity writes and side effects; current-user request authentication and scoped store access; four Staff workflow exports and their routes; proposal/savepoint validation; scoped proposal-table migration; mailbox role gate. Shared UI controls are convenience, not a security boundary.

## Checked scenarios and evidence

| Attempt | Protection / evidence |
| --- | --- |
| Staff posts rent confirmation, advance, setup or direct correction | Manager-only API/service guards; Staff HTTP/service denial tests and existing rent/advance tests |
| Staff submits arbitrary financial/account/workspace fields | Existing-record and exact descriptive allowlist before mutation; actor/role/workspace derived from authenticated context |
| Staff edits a Tenant contact and triggers unrelated side effects | Review found shared save path also rewrote leases/assignments, reconciled credits and copied email. Fixed: those financial writes are Manager-only; Staff account sync preserves existing email. Regression test asserts financial records unchanged and forbids reconciliation |
| Cross-workspace IDs, source/proposal or receipt | Request-scoped store, scoped must/get and workspace role check; existing two-workspace HTTP suite and new foreign-source proposal check |
| Approve stale context or a disabled/moved/non-Staff preparer | Fingerprint includes source, relevant mappings, units, Tenants and config; preparer's current access checked at authorization |
| Multi-field invalid correction partially persists | Nested transaction/savepoint rollback; source/bill/correction snapshots asserted unchanged on validation failure |
| Duplicate pending proposal or repeated authorization | One pending proposal check inside synchronous transaction; decided state check returns conflict; idempotency test confirms no new billing |
| Hide actions but bypass frontend | Real HTTP checks exercise server boundaries independently; browser test confirms visible role controls |

No unresolved authorization bypass was identified in the reviewed Staff paths. This statement is limited to the paths and tests above. The full suite passed 92/92; targeted Staff checks passed 6/6 after the side-effect safeguard. Missing real-device/external acceptance is documented separately.

## Limits and follow-up

No penetration test, dependency audit, production-load benchmark or review of every pre-existing endpoint was performed. Mailbox and notification configuration remains sensitive operational setup. Actual Gmail filter behavior, public hosting, certificate trust and Push delivery cannot be established from isolated unit/browser fixtures. Admin is not an impersonating Manager, and Staff does not verify utility settlement or issue utility receipts.

## Automatic status extension - 23 October 2026

Added a read-only workspace operational status endpoint for Staff/Manager using the existing authenticated/scoped request context. It returns fixed timing/outcome metadata, not credentials, provider errors or a way to start jobs. Tenant/Admin and cross-business reads are covered by the automation HTTP test. The full 96-test suite passed after the scheduler extension; this is targeted regression evidence rather than a new complete penetration audit.
