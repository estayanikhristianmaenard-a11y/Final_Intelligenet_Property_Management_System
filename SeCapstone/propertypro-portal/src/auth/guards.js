import session from "./session.js";
import { can } from "./rbac.js";
import { ROUTES, HOME_FOR_ROLE } from "../config/navigation.js";

/**
 * Route guard.
 *
 * Resolves a hash path against the route table and the RBAC matrix, returning
 * one of four outcomes so the shell can decide between rendering the page,
 * an explicit 403 view, or a redirect.
 *
 * @param {string} path hash path, e.g. "/bills"
 * @returns {{status:"ok"|"denied"|"redirect"|"login"|"not-found",
 *            route?:object, path?:string, reason?:string}}
 */
export function resolveRoute(path) {
  const normalised = normalisePath(path);

  if (!session.isAuthenticated) {
    return { status: "login", path: normalised };
  }

  const route = ROUTES.find((r) => r.path === normalised);

  if (!route) {
    return { status: "not-found", path: normalised };
  }

  if (route.public) {
    return { status: "ok", route, path: normalised };
  }

  const role = session.role;

  if (!route.roles?.includes(role)) {
    return {
      status: "denied",
      route,
      path: normalised,
      reason: "role",
    };
  }

  if (route.permission && !can(role, route.permission)) {
    return {
      status: "denied",
      route,
      path: normalised,
      reason: "permission",
    };
  }

  return { status: "ok", route, path: normalised };
}

/** Send an unauthenticated or mis-roled visitor to the right place. */
export function fallbackPathFor(result) {
  if (result.status === "login") return "#/login";
  if (result.status === "denied") return "#/403";
  return session.homePath;
}

/** The home path a role is allowed to reach. */
export function homeForRole(role) {
  return `#${HOME_FOR_ROLE[role] ?? "/dashboard"}`;
}

/** Strip hash, query, trailing slash; collapse empty → "/". */
export function normalisePath(path) {
  let value = String(path ?? "").trim();
  value = value.replace(/^#/, "");
  value = value.split("?")[0];
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+$/, "");
  return value === "" ? "/" : value;
}
