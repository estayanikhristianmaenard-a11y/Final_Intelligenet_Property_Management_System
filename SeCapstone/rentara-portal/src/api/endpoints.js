/** Registry of API paths used by the portal. See docs/api-contract.md. */

const q = (params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
  const str = search.toString();
  return str ? `?${str}` : "";
};

export const endpoints = {
  /* auth */
  login: () => "/auth/login",
  me: () => "/auth/me",

  /* dashboard */
  dashboardStats: () => "/dashboard/stats",
  activity: (limit = 12) => `/dashboard/activity${q({ limit })}`,

  /* portfolio */
  properties: () => "/properties",
  property: (id) => `/properties/${encodeURIComponent(id)}`,
  units: (filters = {}) => `/units${q(filters)}`,
  unit: (id) => `/units/${encodeURIComponent(id)}`,

  /* people */
  tenants: (filters = {}) => `/tenants${q(filters)}`,
  tenant: (id) => `/tenants/${encodeURIComponent(id)}`,
  tenantBills: (id) => `/tenants/${encodeURIComponent(id)}/bills`,
  tenantPayments: (id) => `/tenants/${encodeURIComponent(id)}/payments`,
  tenantDocuments: (id) => `/tenants/${encodeURIComponent(id)}/documents`,

  /* billing */
  bills: (filters = {}) => `/bills${q(filters)}`,
  incomingBills: (filters = {}) => `/bills/incoming${q(filters)}`,
  payments: (filters = {}) => `/payments${q(filters)}`,
  reportPayment: (billId) =>
    `/bills/${encodeURIComponent(billId)}/report-payment`,
  confirmPayment: (paymentId) =>
    `/payments/${encodeURIComponent(paymentId)}/confirm`,
  receipt: (id) => `/receipts/${encodeURIComponent(id)}`,

  /* exceptions */
  exceptions: (filters = {}) => `/exceptions${q(filters)}`,
  resolveException: (id) => `/exceptions/${encodeURIComponent(id)}/resolve`,

  /* messaging + notifications */
  messages: () => "/messages",
  notifications: () => "/notifications",
  pushSubscription: () => "/notifications/push-subscription",

  /* reporting */
  reportsSummary: (range = "current") => `/reports/summary${q({ range })}`,

  /* settings */
  profile: () => "/settings/profile",
  billingRules: () => "/settings/billing-rules",

  /* admin / system maintenance */
  adminServices: () => "/admin/services",
  adminAudit: (limit = 25, scope = "") => `/admin/audit${q({ limit, scope })}`,
  adminAuditPage: (params = {}) => `/admin/audit${q({ limit:50, page:1, ...params })}`,
  adminUsers: () => "/admin/users",
};

export default endpoints;
