# Button functionality audit

Checked 12 October 2026. Scope: active JavaScript frontend under src, delegated workflow handlers, server authorization and regression tests. Counts are button markup declarations, not the number simultaneously rendered; loops, conditions and roles generate different instances.

## Fixes from this audit

- Dashboard activity refresh now disables during its request and reports failures rather than producing an unhandled rejection.
- The Tenant-panel button now says Edit tenant profile, matching the form it opens.
- Exception source download now says Download original bill, matching its action.
- Shared document handler honors preview requests rather than always downloading.
- Added browser checks for Show/Hide password, desktop sidebar hide/show, notification mark-all-read and direct Manager rent recording/receipt creation.

## Controls and verification

| Group | Actions reviewed | Verification / limits |
| --- | --- | --- |
| Login | Role shortcuts, password visibility, sign-in | Browser checks; server validates credentials rather than trusting chosen role. |
| Navigation | Sidebar open/close, role routes, account menu, logout, notifications shortcut | Browser role/mobile/desktop checks. |
| Properties/units/tenants | Add/edit/delete, assign occupant, filters, details, export | Existing browser CRUD checks plus server ownership/history protections. |
| Tenant panel | Tabs, edit profile, messaging, document upload/preview/download, receipts, confirm/reject | Handler review and browser document/message/payment checks. Disabled role-restricted controls are intentional. |
| Utility inbox | Upload, document review, source download, source correction | Browser upload/preview/correction checks; PDF and image extraction tests. |
| Email sync | Sync intake | Handler and MIME processing checked. Successful real IMAP access still requires configured credentials and real-mailbox acceptance. |
| Exceptions | Review/correct, revalidate, source download | Handler review and correction/exception regression checks. Configuration-only cases explain the required setup repair. |
| Rent bills | Generate rent, view bill, correct rent, apply advance, direct record | Generation, credit and correction server tests; view/correct/direct-record browser checks. Eligible credit button depends on final-cycle/confirmed-credit state. |
| Rent payments | Report, confirm, reject, download receipt | Browser and backend workflow checks; duplicates/permissions/receipt reuse tested. |
| Utility tracking | Mark, undo, view history | Browser mark/undo, filter retention and backend ownership/version checks. No utility confirmation or receipt action. |
| Tenant history | Month/category/status, reset, view bill, downloads | Browser filter/reset and authenticated download checks. |
| Notifications | Mark all read, enable Web Push | Mark-read browser check; unconfigured Push feedback tested. Real subscription/delivery and unsupported-phone outcomes remain external acceptance. |
| Settings | Profile save, preferences, password change, section jumps, billing mapping/settings | Handler review and browser profile/password/mapping/settings checks. Password changes invalidate the old session. |
| Admin | User creation/edit/reset, audit export, health, backup, OCR restart, temporary cache cleanup | Existing browser maintenance/account checks and backend guards. Database-only backup does not include uploaded source files. |
| Shared controls | Modal Cancel/Close/Escape, panel close/tabs, toast dismissal | Handlers reviewed; modal/panel controls exercised by browser flows. |

Passing regression tests do not mean every role/state/device combination was clicked. External services and actual phones still need acceptance checks. No production data was used for browser CRUD tests; isolated temporary databases are used.

## Source inventory

| File | Button declarations |
| --- | ---: |
| `src/app/workflows.js` | 8 |
| `src/components/modal.js` | 1 |
| `src/components/side-panel.js` | 2 |
| `src/components/sidebar.js` | 1 |
| `src/components/toast.js` | 1 |
| `src/components/topbar.js` | 4 |
| `src/features/admin/admin-audit.page.js` | 1 |
| `src/features/admin/admin-dashboard.page.js` | 4 |
| `src/features/admin/admin-settings.page.js` | 3 |
| `src/features/auth/login.page.js` | 3 |
| `src/features/billing/bills.page.js` | 14 |
| `src/features/billing/exception-queue.js` | 3 |
| `src/features/dashboard/recent-activity.js` | 1 |
| `src/features/errors/access-denied.page.js` | 1 |
| `src/features/properties/properties.page.js` | 3 |
| `src/features/reports/reports.page.js` | 1 |
| `src/features/settings/settings-live.js` | 7 |
| `src/features/tenant/tenant-bills.page.js` | 7 |
| `src/features/tenant/tenant-home.page.js` | 2 |
| `src/features/tenant/tenant-notifications.page.js` | 2 |
| `src/features/tenant/tenant-settings.page.js` | 7 |
| `src/features/tenants/tabs/documents.tab.js` | 4 |
| `src/features/tenants/tabs/payments.tab.js` | 3 |
| `src/features/tenants/tenant-details.panel.js` | 4 |
| `src/features/tenants/tenants.page.js` | 5 |
| `src/features/units/units.page.js` | 9 |

Total: 101 declarations in 26 files.

## Test result

The full 33-test suite passed after handler fixes and initial new button checks. Both extended browser tests subsequently passed with direct Manager rent recording and original role/session flows. External IMAP and phone Push success remain pending; local configuration-error behavior is covered. No commit or push was performed.
