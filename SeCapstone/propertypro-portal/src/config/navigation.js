import { ROLE } from "./constants.js";
import { isMockMode } from "./api.js";

/**
 * Sidebar navigation registry.
 *
 * Every entry declares which roles may see it and which permission it
 * requires, so the sidebar, the router and the 403 guard all derive from a
 * single source of truth. The Manager set matches the Phase 1 spec exactly:
 * Dashboard, Properties, Units, Tenants, Bills & Payments, Reports, Settings.
 */

/** @typedef {{id:string,label:string,path:string,icon:string,section:string,roles:string[],permission?:string,badge?:string}} NavItem */

/** @type {NavItem[]} */
export const NAV_ITEMS = [
  {id:'leases',label:'Leases',path:'#/leases',icon:'file',section:'Portfolio',roles:[ROLE.MANAGER],permission:'unit:read'},
  {id:'assignments',label:'Occupancy assignments',path:'#/assignments',icon:'users',section:'Portfolio',roles:[ROLE.MANAGER],permission:'tenant:read'},
  /* ---------------------------------------------------------- Manager --- */
  {
    id: "dashboard",
    label: "Dashboard",
    path: "#/dashboard",
    icon: "dashboard",
    section: "Overview",
    roles: [ROLE.MANAGER],
    permission: "dashboard:read",
  },
  {
    id: "properties",
    label: "Properties",
    path: "#/properties",
    icon: "building",
    section: "Portfolio",
    roles: [ROLE.MANAGER],
    permission: "property:read",
  },
  {
    id: "units",
    label: "Units",
    path: "#/units",
    icon: "grid",
    section: "Portfolio",
    roles: [ROLE.MANAGER],
    permission: "unit:read",
  },
  {
    id: "tenants",
    label: "Tenants",
    path: "#/tenants",
    icon: "users",
    section: "Portfolio",
    roles: [ROLE.MANAGER],
    permission: "tenant:read",
    badge: "tenants",
  },
  {
    id: "bills",
    label: "Bills & Payments",
    path: "#/bills",
    icon: "receipt",
    section: "Operations",
    roles: [ROLE.MANAGER],
    permission: "billing:read",
    badge: "exceptions",
  },
  {
    id: "reports",
    label: "Reports",
    path: "#/reports",
    icon: "chart",
    section: "Operations",
    roles: [ROLE.MANAGER],
    permission: "report:read",
  },
  {
    id: "settings",
    label: "Settings",
    path: "#/settings",
    icon: "settings",
    section: "System",
    roles: [ROLE.MANAGER],
    permission: "settings:billing",
  },

  /* ------------------------------------------------------------ Admin --- */
  {
    id: "admin-dashboard",
    label: "Dashboard",
    path: "#/admin",
    icon: "dashboard",
    section: "System",
    roles: [ROLE.ADMIN],
    permission: "admin:dashboard",
  },
  {
    id: "admin-audit",
    label: "Audit Log",
    path: "#/admin/audit",
    icon: "shield",
    section: "System",
    roles: [ROLE.ADMIN],
    permission: "admin:audit",
  },
  {
    id: "admin-settings",
    label: "Settings",
    path: "#/admin/settings",
    icon: "settings",
    section: "System",
    roles: [ROLE.ADMIN],
    permission: "admin:settings",
  },

  /* ----------------------------------------------------------- Tenant --- */
  {
    id: "tenant-home",
    label: "My Home",
    path: "#/tenant",
    icon: "home",
    section: "My Account",
    roles: [ROLE.TENANT],
    permission: "tenant:home",
  },
  {
    id: "tenant-bills",
    label: "My Bills & Payments",
    path: "#/tenant/bills",
    icon: "receipt",
    section: "My Account",
    roles: [ROLE.TENANT],
    permission: "tenant:billing",
    badge: "myBills",
  },
  {
    id: "tenant-notifications",
    label: "Notifications",
    path: "#/tenant/notifications",
    icon: "bell",
    section: "My Account",
    roles: [ROLE.TENANT],
    permission: "tenant:notifications",
  },
  {
    id: "tenant-settings",
    label: "Settings",
    path: "#/tenant/settings",
    icon: "settings",
    section: "My Account",
    roles: [ROLE.TENANT],
    permission: "tenant:settings",
  },
];

/** Route table consumed by the router + RBAC guard. */
export const ROUTES = [
  {path:'/leases',page:'leases',roles:[ROLE.MANAGER],permission:'unit:read'},
  {path:'/assignments',page:'assignments',roles:[ROLE.MANAGER],permission:'tenant:read'},
  { path: "/", redirectTo: "/dashboard" },
  { path: "/dashboard", page: "dashboard", roles: [ROLE.MANAGER], permission: "dashboard:read" },
  { path: "/properties", page: "properties", roles: [ROLE.MANAGER], permission: "property:read" },
  { path: "/units", page: "units", roles: [ROLE.MANAGER], permission: "unit:read" },
  { path: "/tenants", page: "tenants", roles: [ROLE.MANAGER], permission: "tenant:read" },
  { path: "/bills", page: "bills", roles: [ROLE.MANAGER], permission: "billing:read" },
  { path: "/reports", page: "reports", roles: [ROLE.MANAGER], permission: "report:read" },
  { path: "/settings", page: "settings", roles: [ROLE.MANAGER], permission: "settings:billing" },

  { path: "/admin", page: "adminDashboard", roles: [ROLE.ADMIN], permission: "admin:dashboard" },
  { path: "/admin/audit", page: "adminAudit", roles: [ROLE.ADMIN], permission: "admin:audit" },
  { path: "/admin/settings", page: "adminSettings", roles: [ROLE.ADMIN], permission: "admin:settings" },

  { path: "/tenant", page: "tenantHome", roles: [ROLE.TENANT], permission: "tenant:home" },
  { path: "/tenant/bills", page: "tenantBills", roles: [ROLE.TENANT], permission: "tenant:billing" },
  { path: "/tenant/notifications", page: "tenantNotifications", roles: [ROLE.TENANT], permission: "tenant:notifications" },
  { path: "/tenant/settings", page: "tenantSettings", roles: [ROLE.TENANT], permission: "tenant:settings" },

  { path: "/login", page: "login", public: true },
  { path: "/403", page: "accessDenied", public: true },
];

/** Where each role lands after signing in (and after a denied route). */
export const HOME_FOR_ROLE = {
  [ROLE.ADMIN]: "/admin",
  [ROLE.MANAGER]: "/dashboard",
  [ROLE.TENANT]: "/tenant",
};

/** Nav items visible to a role, preserving registry order. */
export function navForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role) && (!isMockMode() || !['leases','assignments'].includes(item.id)));
}

/** Group nav items by their `section`, preserving first-seen section order. */
export function groupNav(items) {
  const groups = [];
  for (const item of items) {
    const existing = groups.find((g) => g.section === item.section);
    if (existing) existing.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  return groups;
}
