import { apiConfig } from "../config/api.js";
import session from "../auth/session.js";

/** Authenticated REST client with timeouts, typed errors and expired-session cleanup. */

export class ApiError extends Error {
  constructor(message, { status = 0, body = null, path = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.path = path;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

function buildHeaders(extra = {}) {
  const headers = {
    Accept: "application/json",
    ...extra,
  };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  return headers;
}

async function liveRequest(
  path,
  { method = "GET", body, signal, timeout } = {},
) {
  const url = `${apiConfig.BASE_URL}${path}`;
  const requestToken = session.token;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeout ?? apiConfig.TIMEOUT_MS,
  );
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(body ? { "Content-Type": "application/json" } : {}),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "omit",
    });

    const text = await response.text();
    const parsed = text ? safeJson(text) : null;

    if (!response.ok) {
      if (
        response.status === 401 &&
        path !== "/auth/login" &&
        session.token === requestToken
      ) {
        session.clear();
        window.dispatchEvent(new CustomEvent("app:signed-out"));
      }
      throw new ApiError(
        parsed?.message ?? `${method} ${path} failed with ${response.status}`,
        { status: response.status, body: parsed, path },
      );
    }
    return parsed;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError(`Request timed out: ${path}`, { path });
    }
    throw new ApiError(error.message || "Network request failed", { path });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const method = options.method ?? "GET";

  if (method === "GET" && options.params) {
    const search = new URLSearchParams(
      Object.entries(options.params).filter(([, v]) => v != null),
    );
    const qs = search.toString();
    if (qs)
      return liveRequest(
        `${path}${path.includes("?") ? "&" : "?"}${qs}`,
        options,
      );
  }

  return liveRequest(path, options);
}

export const api = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body }),
  patch: (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options = {}) =>
    request(path, { ...options, method: "PUT", body }),
  delete: (path, options = {}) =>
    request(path, { ...options, method: "DELETE" }),
  request,
};

export default api;
