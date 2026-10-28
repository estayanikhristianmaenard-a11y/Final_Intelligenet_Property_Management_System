import { ROLE } from "../config/constants.js";

/**
 * Role-Based Access Control matrix.
 *
 * Mirrors the study's security requirements:
 *  - Admin  → system maintenance only (explicitly NO billing, payment
 *             confirmation or exception-review functions).
 *  - Manager → properties, units, tenants, billing rules, exceptions,
 *             payment confirmation, receipts.
 *  - Tenant → own bills, payment status, payment reporting, receipts,
 *             permitted Web Push notifications.
 *
 * The frontend guard is defence-in-depth only — the backend must enforce the
 * same matrix on every endpoint.
 */

const ALL = true;
const NONE = false;

/** @type {Record<string, Record<string, boolean>>} */
export const PERMISSION_MATRIX = {
  [ROLE.STAFF]: {
    "dashboard:read": true, "property:read": true, "property:write": true,
    "unit:read": true, "unit:write": true, "tenant:read": true, "tenant:write": true,
    "billing:read": true, "exception:propose": true, "receipt:view": true, "staff:account": true,
  },
  /* ---------------------------------------------------------------- Admin */
  [ROLE.ADMIN]: {
    "admin:dashboard": ALL,
    "admin:audit": ALL,
    "admin:settings": ALL,
    "user:manage": ALL,
    "system:maintain": ALL,

    /* Explicitly withheld — see paper §1.5 Scope and Limitations. */
    "dashboard:read": NONE,
    "property:read": NONE,
    "property:write": NONE,
    "unit:read": NONE,
    "unit:write": NONE,
    "tenant:read": NONE,
    "tenant:write": NONE,
    "billing:read": NONE,
    "billing:write": NONE,
    "billing:configure": NONE,
    "exception:review": NONE,
    "payment:confirm": NONE,
    "receipt:view": NONE,
    "report:read": NONE,
    "settings:billing": NONE,
    "tenant:home": NONE,
    "tenant:billing": NONE,
    "tenant:report_payment": NONE,
    "tenant:notifications": NONE,
    "tenant:settings": NONE,
  },

  /* -------------------------------------------------------------- Manager */
  [ROLE.MANAGER]: {
    "dashboard:read": ALL,
    "property:read": ALL,
    "property:write": ALL,
    "unit:read": ALL,
    "unit:write": ALL,
    "tenant:read": ALL,
    "tenant:write": ALL,
    "tenant:message": ALL,

    "billing:read": ALL,
    "billing:write": ALL,
    "billing:configure": ALL,
    "billing:correct": ALL,
    "ocr:review": ALL,
    "exception:review": ALL,
    "exception:resolve": ALL,
    "payment:confirm": ALL,
    "payment:report": NONE,
    "receipt:view": ALL,
    "report:read": ALL,
    "notification:send": ALL,
    "settings:billing": ALL,

    "admin:dashboard": NONE,
    "admin:audit": NONE,
    "admin:settings": NONE,
    "user:manage": NONE,
    "system:maintain": NONE,
    "tenant:home": NONE,
    "tenant:billing": NONE,
    "tenant:report_payment": NONE,
    "tenant:notifications": NONE,
    "tenant:settings": NONE,
  },

  /* --------------------------------------------------------------- Tenant */
  [ROLE.TENANT]: {
    "tenant:home": ALL,
    "tenant:billing": ALL,
    "tenant:report_payment": ALL,
    "tenant:receipt:view": ALL,
    "tenant:notifications": ALL,
    "tenant:settings": ALL,
    "tenant:profile": ALL,

    "dashboard:read": NONE,
    "property:read": NONE,
    "property:write": NONE,
    "unit:read": NONE,
    "unit:write": NONE,
    "tenant:read": NONE,
    "tenant:write": NONE,
    "billing:read": NONE,
    "billing:write": NONE,
    "billing:configure": NONE,
    "billing:correct": NONE,
    "ocr:review": NONE,
    "exception:review": NONE,
    "exception:resolve": NONE,
    "payment:confirm": NONE,
    "receipt:view": NONE,
    "report:read": NONE,
    "notification:send": NONE,
    "settings:billing": NONE,
    "admin:dashboard": NONE,
    "admin:audit": NONE,
    "admin:settings": NONE,
    "user:manage": NONE,
    "system:maintain": NONE,
  },
};

/**
 * Can the role perform the permission?
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function can(role, permission) {
  if (!permission) return true;
  const grants = PERMISSION_MATRIX[role];
  if (!grants) return false;
  return grants[permission] === ALL;
}

export function canAny(role, permissions = []) {
  return permissions.some((p) => can(role, p));
}

export function canAll(role, permissions = []) {
  return permissions.every((p) => can(role, p));
}

/** Every permission granted to a role (used by the Settings role matrix). */
export function permissionsFor(role) {
  const grants = PERMISSION_MATRIX[role] ?? {};
  return Object.keys(grants).filter((key) => grants[key] === ALL);
}

/** The capability rows rendered in Settings → Roles & Permissions. */
export const CAPABILITY_ROWS = [
  {
    label: "System maintenance & user accounts",
    permission: "system:maintain",
  },
  { label: "Audit log", permission: "admin:audit" },
  { label: "View dashboard", permission: "dashboard:read" },
  { label: "Manage properties & units", permission: "property:write" },
  { label: "Manage tenants", permission: "tenant:write" },
  {
    label: "Configure billing rules & allocations",
    permission: "billing:configure",
  },
  { label: "Review OCR-extracted bills", permission: "ocr:review" },
  { label: "Review Exception Queue", permission: "exception:review" },
  { label: "Confirm tenant-reported payments", permission: "payment:confirm" },
  { label: "View reports", permission: "report:read" },
  { label: "View own bills", permission: "tenant:billing" },
  { label: "Report a payment", permission: "tenant:report_payment" },
  {
    label: "Receive Web Push notifications",
    permission: "tenant:notifications",
  },
];
