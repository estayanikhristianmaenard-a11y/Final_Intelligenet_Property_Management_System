# PropertyPro Manager Portal — Backend API Contract

The front-end talks to the backend **only** through [`src/api/client.js`](../src/api/client.js),
using the path builders in [`src/api/endpoints.js`](../src/api/endpoints.js).

Today `apiConfig.MODE = "mock"` routes every call to an in-browser adapter
([`src/api/mock/adapter.js`](../src/api/mock/adapter.js)) so the UI is fully
demonstrable with no server. Setting `MODE = "live"` switches the *same* calls
to `fetch()` against `BASE_URL` with the session bearer token.

Base URL: `http://localhost:8080/api/v1` (configurable via `VITE_API_URL`).

---

## Conventions

| Concern | Rule |
| --- | --- |
| Transport | JSON over HTTP, `Content-Type: application/json` |
| Auth | `Authorization: Bearer <token>` returned by `POST /auth/login` |
| Errors | Non-2xx returns `{ "message": string, "code"?: string }` |
| Dates | ISO-8601 (`2026-10-09`) or full ISO datetime for events |
| Money | Decimal/number with **exactly 2 decimal places**, currency `PHP` |
| Enums | Values below are exact — the UI renders labels from them |

### Enums

```
role            : admin | manager | tenant
payment_status  : unpaid | tenant_reported_paid | paid
category        : rent | electricity | water
arrangement     : individual | shared_occupancy
unit_status     : occupied | vacant | notice | maintenance
ocr_status      : processing | validated | failed
exception_state : open | corrected | revalidated
severity        : high | medium | low
activity_status : Pending | Paid | Unpaid | Review
```

> **Business rule:** `tenant_reported_paid` must **never** transition to `paid`
> without an explicit `POST /payments/:id/confirm` from a Manager token.
> A receipt number is issued only on that transition.

---

## Endpoints

### Auth

| Method | Path | Body → Response |
| --- | --- | --- |
| `POST` | `/auth/login` | `{ email, password }` → `{ token, user }` |
| `GET` | `/auth/me` | → `user` |

### Dashboard (Manager)

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/dashboard/stats` | `{ totalUnits:{value,delta}, totalTenants:{value,delta}, incomingBills:{value,delta}, exceptionQueue:{value,delta}, occupancy, openExceptions, outstanding, collected }` |
| `GET` | `/dashboard/activity?limit=` | `{ items: ActivityEvent[], total }` |

`ActivityEvent = { id, type, subject, actor, status, timestamp, href }`
`type ∈ Utility Bill Received | Tenant Payment | Exception Queue | Payment Confirmed | Receipt Generated | Web Push Notification | Bill Finalized | Correction Applied`

### Portfolio

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/properties` | `Property[]` incl. occupancy rollups |
| `GET` | `/properties/:id` | single `Property` |
| `GET` | `/units?propertyId=&status=&q=` | `Unit[]` |
| `GET` | `/tenants?q=&propertyId=` | `Tenant[]` (summary) |
| `GET` | `/tenants/:id` | `Tenant & { bills, payments, documents, summary }` |
| `GET` | `/tenants/:id/bills` | `Bill[]` |
| `GET` | `/tenants/:id/payments` | `Payment[]` |
| `GET` | `/tenants/:id/documents` | `Document[]` |

Full field lists are declared as JSDoc typedefs in
[`src/models/index.js`](../src/models/index.js) — implement the JSON to match.

### Billing

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/bills?status=&tenantId=&q=` | `Bill[]` |
| `GET` | `/bills/incoming?status=` | OCR-extracted `IncomingBill[]`, newest first |
| `GET` | `/payments?status=` | `Payment[]`, newest first |
| `POST` | `/bills/:id/report-payment` | `{ method, reference }` → `{ bill, payment }`; sets status `tenant_reported_paid` |
| `POST` | `/payments/:id/confirm` | Manager only → `Payment` with `status: paid` + `receiptNumber` |

### Exceptions

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/exceptions?state=` | `ExceptionRecord[]` |
| `POST` | `/exceptions/:id/resolve` | `{ revalidate: boolean }` → record; sets `corrected` or `revalidated` |

### Notifications (Web Push only)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/notifications` | `Notification[]` for the signed-in tenant |
| `POST` | `/messages` | `{ to, subject, body }` → portal-inbox message |
| `POST` | `/notifications/push-subscription` | Web Push subscription object |

> The system **must not** expose SMS, GSM or tenant-e-mail notification
> endpoints — those are explicitly out of scope for the study.

### Reports & settings

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/reports/summary?range=` | `{ byCategory, byProperty, byStatus, byStatusPercent, outstanding, collected, openExceptions, occupancy }` |
| `GET` | `/settings/profile` | `{ intakeMailbox, allocationRule, advanceRentEnabled, prorateEnabled, reminderDays, pushEnabled }` |
| `GET` | `/settings/billing-rules` | Manager billing configuration |

### Admin (system maintenance only)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/services` | service health rows |
| `GET` | `/admin/audit?limit=` | audit log entries |
| `GET` | `/admin/users` | accounts + roles |

> The `admin` role must be **denied** (HTTP 403) on every property, unit,
> tenant, billing, exception, payment-confirmation and receipt endpoint.

---

## Front-end RBAC matrix

Rendered live in **Admin → Settings → Role-based access control matrix** and
authoritatively defined in
[`src/auth/rbac.js`](../src/auth/rbac.js). The backend must mirror it; the
front-end guard is defence-in-depth only.

| Capability | Admin | Manager | Tenant |
| --- | :--: | :--: | :--: |
| System maintenance & user accounts | ✓ | — | — |
| Audit log | ✓ | — | — |
| View dashboard | — | ✓ | — |
| Manage properties & units | — | ✓ | — |
| Manage tenants | — | ✓ | — |
| Configure billing rules & allocations | — | ✓ | — |
| Review OCR-extracted bills | — | ✓ | — |
| Review Exception Queue | — | ✓ | — |
| Confirm tenant-reported payments | — | ✓ | — |
| View reports | — | ✓ | — |
| View own bills | — | — | ✓ |
| Report a payment | — | — | ✓ |
| Receive Web Push notifications | — | — | ✓ |

---

## Connecting a real backend

1. Implement the endpoints above (any stack — the contract is plain REST/JSON).
2. In `src/config/api.js` set:
   ```js
   MODE: "live",
   BASE_URL: "https://your-api.example.com/api/v1",
   ```
   …or export `VITE_API_MODE=live` and `VITE_API_URL=…`.
3. Ensure CORS allows the portal origin and returns `401`/`403` correctly —
   the client already surfaces `ApiError.isUnauthorized` / `isForbidden`.

No feature module needs to change.
