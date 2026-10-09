# PropertyPro Manager Portal

Phase 1 — **UI Dashboard & Front-End Architecture** for the capstone system
*"Intelligent Property Management Workflow with OCR-Enabled Automated Billing
Classification and Tenant Notification"* (Pasig City, A.Y. 2026–2027).

A responsive, backend-ready single-page portal built with **plain ES modules —
no build step, no framework, no npm**. Serve it through any static HTTP server
and it runs.

```bash
cd propertypro-portal
python -m http.server 8090
# → http://localhost:8090
```

---

## What Phase 1 delivers

| Requirement | Where |
| --- | --- |
| Responsive centralised portal | `src/app/shell.js` + `src/styles/layout.css` |
| Sidebar: Dashboard, Properties, Units, Tenants, Bills & Payments, Reports, Settings | `src/config/navigation.js` |
| Summary cards: Total Units, Total Tenants, Incoming Bills, Exception Queue | `src/features/dashboard/dashboard.page.js` |
| Property Overview — Buildings A–D + unit occupancy indicators | `src/features/dashboard/property-overview.js` |
| Recent Activity table (events, timestamps, Pending/Paid/Unpaid/Review) | `src/features/dashboard/recent-activity.js` |
| Slide-out "Tenant Details" panel with Overview/Billing/Payments/Documents tabs | `src/features/tenants/tenant-details.panel.js` |
| Personal / Unit / Current Billing / Recent Payments + Send Message & View Full Profile | `src/features/tenants/tabs/*` |
| Front-end RBAC separating Admin, Manager and Tenant views | `src/auth/rbac.js`, `src/auth/guards.js`, `src/config/navigation.js` |
| Backend compatibility | `src/api/client.js`, `src/api/endpoints.js`, `docs/api-contract.md` |

---

## File & folder hierarchy

```
propertypro-portal/
├── index.html                     # single entry; loads styles + src/app/app.js
├── README.md
├── docs/
│   └── api-contract.md            # REST contract the backend must implement
└── src/
    ├── app/                       # composition root
    │   ├── app.js                 #   bootstrap, route → page dispatch, badges
    │   ├── router.js              #   hash router + query parsing
    │   └── shell.js               #   sidebar + topbar + content outlet
    ├── config/                    # declarative configuration
    │   ├── api.js                 #   MODE (mock|live) + BASE_URL switch
    │   ├── constants.js           #   roles, statuses, billing categories
    │   └── navigation.js          #   nav registry + route table + role rules
    ├── auth/                      # access control
    │   ├── rbac.js                #   Admin/Manager/Tenant permission matrix
    │   ├── guards.js              #   route guard (ok | denied | redirect | 404)
    │   └── session.js             #   session store, sign-in/out, role switch
    ├── api/                       # data layer — features never fetch directly
    │   ├── client.js              #   fetch wrapper, auth header, ApiError
    │   ├── endpoints.js           #   every backend path in one registry
    │   └── mock/
    │       ├── seed.js            #   deterministic demo dataset
    │       └── adapter.js         #   in-memory REST router + mutations
    ├── models/
    │   └── index.js               # JSDoc entity contracts (= JSON shape)
    ├── components/                # reusable, feature-agnostic UI
    │   ├── sidebar.js  topbar.js  stat-card.js  data-table.js
    │   ├── side-panel.js  tabs→(in panel)  modal.js  toast.js
    │   ├── badge.js  empty-state.js  icon.js
    │   └── ...
    ├── features/                  # one folder per screen / domain
    │   ├── dashboard/   dashboard.page.js, property-overview.js, recent-activity.js
    │   ├── properties/  properties.page.js
    │   ├── units/       units.page.js
    │   ├── tenants/     tenants.page.js, tenant-details.panel.js, tabs/
    │   │                                ├── overview.tab.js
    │   │                                ├── billing.tab.js
    │   │                                ├── payments.tab.js
    │   │                                └── documents.tab.js
    │   ├── billing/     bills.page.js, exception-queue.js
    │   ├── reports/     reports.page.js
    │   ├── settings/    settings.page.js
    │   ├── admin/       admin-dashboard.page.js, admin-audit.page.js,
    │   │                admin-settings.page.js
    │   ├── tenant/      tenant-home, tenant-bills,
    │   │                tenant-notifications, tenant-settings
    │   ├── auth/        login.page.js
    │   └── errors/      access-denied.page.js (403 + 404)
    ├── styles/                    # design system, layered
    │   ├── tokens.css             #   variables: colour, type, space, shadow
    │   ├── base.css               #   reset, typography, utilities
    │   ├── layout.css             #   shell, sidebar, topbar, responsive
    │   ├── components.css         #   cards, tables, badges, panel, modal
    │   └── pages/                 #   dashboard / entities / tenants / billing
    └── utils/
        ├── dom.js                 # escaped `html` tagged template, delegation
        └── format.js              # peso, dates, relative time, initials
```

**Layering rule:** `features/` may import `components/`, `api/`, `auth/`,
`config/`, `utils/`. Nothing imports *into* `features/` except `app/`.

---

## Role-based access control (front end)

Three strictly disjoint views, mirroring the paper's scope section:

| | Admin | Manager | Tenant |
| --- | --- | --- | --- |
| Purpose | System maintenance only | Property & billing management | View bills, report payments |
| Sidebar | Dashboard (service health), Audit Log, Settings | Dashboard, Properties, Units, Tenants, Bills & Payments, Reports, Settings | My Home, My Bills & Payments, Notifications, Settings |
| Explicitly **denied** | All property/unit/tenant/billing/exception/payment-confirmation functions | System maintenance, user accounts | Any other tenant's data, all management functions |

Enforced in two places:

1. **Navigation** — `config/navigation.js` filters sidebar items by role, so a
   forbidden destination is never even rendered.
2. **Route guard** — `auth/guards.js` resolves every deep link against the
   matrix in `auth/rbac.js` and renders an explicit **403 Access Denied** view.

Use the **avatar menu (top right) → switch role** to demonstrate all three.

> The front-end guard is defence-in-depth. The backend must return
> `403 Forbidden` for every ungranted endpoint — see
> [`docs/api-contract.md`](docs/api-contract.md).

---

## Connecting the backend

All data flows through `src/api/client.js`. Right now
`src/config/api.js` has `MODE: "mock"`, so calls resolve against an in-memory
adapter that mirrors the REST contract and mutates realistically (report a
payment → confirm it → receipt appears → activity feed updates).

To go live:

```js
// src/config/api.js
export const apiConfig = {
  MODE: "live",
  BASE_URL: "https://your-api.example.com/api/v1",
  ...
};
```

or set `VITE_API_MODE=live` / `VITE_API_URL=…`. No feature module changes.

---

## Design decisions worth noting

- **Escaped-by-default templating.** `html\`…\`` in `utils/dom.js` escapes every
  interpolated value unless it is itself produced by `html`, so tenant names
  and OCR-extracted strings can never inject markup.
- **Deterministic demo data.** `api/mock/seed.js` uses a seeded PRNG — reloads
  and screenshots are reproducible.
- **"Intelligent" = rule-based.** The UI labels the OCR/exception pipeline as
  rule-based and explicitly states no AI/ML is involved, matching the study's
  scope statement.
- **Web Push only.** SMS, GSM and tenant e-mail are shown as *Blocked* in
  Settings rather than hidden, so the scope boundary is visible.
- **Payment honesty.** `Tenant Reported Paid` is visually distinct everywhere
  and never rendered as confirmed; receipts only exist after Manager
  confirmation.
