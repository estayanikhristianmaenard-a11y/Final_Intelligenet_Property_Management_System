# Development findings retained from the initial source review

These findings describe the mock portal at the original review. Recheck them against the shortened manuscript before development. No implementation work was performed.

## Paper-to-project traceability (historical page numbers)


“Mock” means interface/demo behavior; it is not a tested backend capability.

| Paper requirement | File evidence | Current state / gap |
| --- | --- | --- |
| Property/unit/tenant management, pp. 23–24 | `features/properties`, `features/units`, `features/tenants`; mock adapter | Lists/filtering exist; Add/Assign actions and persistence are missing. |
| Roles and authenticated access, pp. 16, 25 | `auth/rbac.js`, `guards.js`, `session.js`, login page | UI guards exist. Demo roles and editable local storage are not server authorization. |
| Centralized database, p. 17 | `api/mock/adapter.js`, `seed.js` | In-memory data only; no database schema or backend found. Reload recreates data. |
| Email retrieval and actual OCR, pp. 15, 20 | Incoming records in seed and bills page | Seeded extraction results; no intake connector, parser or OCR engine found. |
| Mapping and deterministic validation, p. 21 | Manager settings; mock adapter | Static mapping rows; no executable rule engine or mapping persistence found. |
| Monthly anniversary rent and advance handling, pp. 14, 21 | Seed; settings page | Demo bill generation does not establish a scheduled, idempotent lease-cycle ledger. |
| Shared allocation reconciliation, pp. 15, 21 | Models, constants, seed | Labels and synthetic allocations; no operational allocator over real tenant memberships. |
| Corrections/revalidation, p. 22 | `billing/exception-queue.js`; adapter | Entered correction fields are ignored; state labels change without validation/recomputation. |
| Payment reporting/confirmation, pp. 15–16 | Tenant bills; adapter confirmation handler | Simulated transitions exist; no ownership enforcement, durable transactions or external Manager verification evidence. |
| Digital receipt after confirmation, p. 22 | Adapter; Tenant receipt list | Receipt number appears, but Download has no handler; no actual receipt document service. |
| Web Push with three-day reminders, p. 16 | Tenant notifications; endpoint registry | Permission request and seeded feed only; no subscription flow, sender or scheduler. |
| Quality evaluation, p. 17 | No evaluation instruments/test artifacts found | Research protocol and objective evidence still required. |

## 5. Concrete prototype mismatches and development risks

1. **Live login is not ready.** `features/auth/login.page.js` calls `session.signIn(selectedRole)` without reading email/password inputs. `auth/session.js` sends the selected demo identity's email and an empty default password in live mode, then caches the demo identity instead of the backend's returned user. Role switching also invokes this path. Replace this with real credential submission and server-derived identity during development; restrict demo switching to mock mode.
2. **Correction success is overstated.** The correction modal does not read or send the corrected field, value or note. “Save & revalidate” posts `{ revalidate: false }`. The mock only changes exception state, while the UI says revalidation/reprocessing succeeded. The future API needs an actual correction payload and validation outcome.
3. **Settings conflict with fixed scope.** Pro-rating can be toggled despite the PDF excluding it. Mandatory advance rent can be disabled. Reminder choices include 1/3/5 days while the manuscript describes three days. Either lock scoped policy or revise the paper explicitly after stakeholder agreement. None of these settings currently persists to the backend.
4. **Push state is misleading.** Notifications display “Web Push active” and “alerts delivered to this device” from static/mock state. Enable Push only requests browser permission. Mark All Read only displays a toast. These are demonstration labels, not measured delivery/read events.
5. **Shared occupancy has insufficient records.** `Unit` exposes one `tenantId`; seed construction creates one tenant per occupied unit while the `occupants` count may be higher. Add real occupancy/lease members before validating shared allocation.
6. **API contract is incomplete.** Missing operational contracts include portfolio writes, utility mappings, correction payloads, extraction jobs, bill generation/finalization, finalized corrections, receipt retrieval and durable settings. `endpoints.unit()` uses `/unit/:id`, inconsistent with the plural resource convention. The registry has receipt and billing-rules paths without corresponding mock handlers; push subscription is documented but lacks a mock handler. Manager badge loading calls notifications even though the contract describes a tenant-scoped feed. Specify authorization for each endpoint.
7. **A config flip is insufficient.** README claims backend integration needs no feature changes, but login, correction payloads, receipt actions and push registration already require changes. Plain static serving does not inject `VITE_*` environment variables into `import.meta.env`; use explicit runtime configuration or introduce a documented build process.
8. **Money and reports need precise definitions.** The API specifies numbers with exactly two decimal places, but JSON numeric values do not preserve decimal scale. Choose integer centavos or decimal strings with database decimal arithmetic. `monthlyRevenue` is computed from active configured rents, not confirmed collections; the model describes it as collected revenue. Rename/define rent roll and collections distinctly. The reports mock ignores its requested range.
9. **UI interaction risk:** `app/shell.js` recreates the content DOM from retained `innerHTML` on shell refresh. Page event listeners attached to replaced elements are lost. Verify this during development, especially when opening menus or mobile navigation.
10. **Other demonstration controls:** Add user/property/unit/tenant, several Save/Export buttons, receipt downloads and source-record opening are incomplete. Avoid treating visible controls or success toasts as implemented requirements.

These are source-review findings, not a request to start implementation now.

