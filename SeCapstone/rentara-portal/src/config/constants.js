/**
 * Domain constants.
 *
 * These mirror the study's system requirements one-for-one:
 *  - three payment statuses (Unpaid / Tenant Reported Paid / Paid)
 *  - three billing categories (rent / electricity / water)
 *  - three roles (Admin / Manager / Tenant)
 *  - two billing arrangements (Individual / Shared-Occupancy)
 * Keeping them centralised guarantees the UI never invents a status that the
 * backend contract does not define.
 */

export const APP = {
  name: "Rentara",
  portal: "Manager Portal",
  tagline: "Intelligent Property Management Workflow",
  version: "2.0.0",
  locale: "en-PH",
  currency: "PHP",
};

/* ------------------------------------------------------------------ roles */
export const ROLE = {
  ADMIN: "admin",
  MANAGER: "manager",
  TENANT: "tenant",
};

export const ROLE_LABEL = {
  [ROLE.ADMIN]: "Admin",
  [ROLE.MANAGER]: "Manager",
  [ROLE.TENANT]: "Tenant",
};

export const ROLE_SCOPE = {
  [ROLE.ADMIN]: "System maintenance",
  [ROLE.MANAGER]: "Property & billing management",
  [ROLE.TENANT]: "Bills & payment reporting",
};

export const ROLES = [ROLE.ADMIN, ROLE.MANAGER, ROLE.TENANT];

/* --------------------------------------------------------------- payment */
export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  REPORTED: "tenant_reported_paid",
  PAID: "paid",
};

export const PAYMENT_STATUS_META = {
  [PAYMENT_STATUS.UNPAID]: {
    label: "Unpaid",
    tone: "danger",
    hint: "No payment reported yet.",
  },
  [PAYMENT_STATUS.REPORTED]: {
    label: "Tenant Reported Paid",
    tone: "warning",
    hint: "Reported by the tenant — awaiting Manager confirmation.",
  },
  [PAYMENT_STATUS.PAID]: {
    label: "Paid",
    tone: "success",
    hint: "Confirmed by the Manager. Digital receipt generated.",
  },
};

/* ---------------------------------------------------- activity statuses */
/* The Recent Activity feed reports workflow states, which are a superset of
   the billing statuses: Pending (processing) and Review (Exception Queue). */
export const ACTIVITY_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  UNPAID: "Unpaid",
  REVIEW: "Review",
};

export const ACTIVITY_TONE = {
  Pending: "warning",
  Paid: "success",
  Unpaid: "danger",
  Review: "violet",
};

/* -------------------------------------------------------------- billing */
export const BILLING_CATEGORY = {
  RENT: "rent",
  ELECTRICITY: "electricity",
  WATER: "water",
};

export const BILLING_CATEGORY_META = {
  [BILLING_CATEGORY.RENT]: { label: "Rent", short: "Rent", tone: "primary" },
  [BILLING_CATEGORY.ELECTRICITY]: {
    label: "Electricity",
    short: "Elec.",
    tone: "warning",
  },
  [BILLING_CATEGORY.WATER]: { label: "Water", short: "Water", tone: "info" },
};

export const ARRANGEMENT = {
  INDIVIDUAL: "individual",
  SHARED: "shared_occupancy",
};

export const ARRANGEMENT_LABEL = {
  [ARRANGEMENT.INDIVIDUAL]: "Individual Billing",
  [ARRANGEMENT.SHARED]: "Shared-Occupancy Billing",
};

export const ALLOCATION_RULES = [
  { id: "equal_split", label: "Equal split among active tenants" },
  { id: "headcount_weighted", label: "Weighted by occupied beds" },
  { id: "consumption_share", label: "Configured consumption share" },
];

/* ---------------------------------------------------------------- units */
export const UNIT_STATUS = {
  OCCUPIED: "occupied",
  VACANT: "vacant",
  NOTICE: "notice",
  MAINTENANCE: "maintenance",
};

export const UNIT_STATUS_META = {
  [UNIT_STATUS.OCCUPIED]: { label: "Occupied", tone: "primary" },
  [UNIT_STATUS.VACANT]: { label: "Vacant", tone: "neutral" },
  [UNIT_STATUS.NOTICE]: { label: "On Notice", tone: "warning" },
  [UNIT_STATUS.MAINTENANCE]: { label: "Maintenance", tone: "danger" },
};

/* ----------------------------------------------------------- exceptions */
export const EXCEPTION_SEVERITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const EXCEPTION_SEVERITY_META = {
  high: { label: "High", color: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#fef3c7", fg: "#b45309" },
  low: { label: "Low", color: "#0ea5e9", bg: "#e0f2fe", fg: "#0369a1" },
};

/* ----------------------------------------------------------- notifications */
/* Email is supplementary and rent-only. */
export const NOTIFICATION_CHANNEL = {
  WEB_PUSH: "web_push",
  RENT_EMAIL: "rent_email",
};

export const NOTIFICATION_CHANNEL_META = {
  [NOTIFICATION_CHANNEL.RENT_EMAIL]: { label: "Rent email", hint: "Rent billing updates, eligible reminders, and Manager-confirmed payment notices." },
  [NOTIFICATION_CHANNEL.WEB_PUSH]: {
    label: "Web Push Notifications",
    hint: "Billing updates and due-date alerts that open the authenticated portal.",
  },
};

export const PROHIBITED_CHANNELS = ["SMS", "GSM", "Utility email"];

/* ------------------------------------------------------------ buildings */
export const BUILDING_LETTERS = ["A", "B", "C", "D"];

export const TIMEZONE = "Asia/Manila";
