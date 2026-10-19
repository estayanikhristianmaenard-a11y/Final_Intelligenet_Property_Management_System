/**
 * Hash router.
 *
 * The portal is a single-page app served as static files, so routes live in
 * the fragment (`#/bills?tab=exceptions`). Everything the backend needs is
 * still expressed as ordinary REST paths in `api/endpoints.js` — the hash only
 * describes client-side view state.
 */

/** Split a hash into a normalised path and its query string. */
export function parseHash(hash = window.location.hash) {
  const raw = String(hash ?? "").replace(/^#/, "");
  const [pathname = "", search = ""] = raw.split("?");
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  path = path.replace(/\/+$/, "");
  if (path === "") path = "/";
  return { path, query: new URLSearchParams(search) };
}

/** Current route as `{ path, query }`. */
export function currentRoute() {
  return parseHash(window.location.hash);
}

/** Programmatically navigate, e.g. `navigate("/bills", { tab: "exceptions" })`. */
export function navigate(path, params = null) {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  const search = params ? new URLSearchParams(params).toString() : "";
  const target = `#${normalised}${search ? `?${search}` : ""}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

/** Subscribe to route changes. Returns an unsubscribe function. */
export function onRouteChange(handler) {
  let pending;
  const listener = () => {
    if (pending !== undefined) return;
    // Back/Forward and same-fragment navigation may emit popstate; a fragment
    // change can emit both events. Coalesce the pair into one render so a
    // cancelled navigation cannot immediately repaint and erase edited values.
    pending=setTimeout(()=>{pending=undefined;handler(currentRoute());},0);
  };
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    clearTimeout(pending);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

export default { parseHash, currentRoute, navigate, onRouteChange };
