import { apiConfig, isMockMode } from "../config/api.js";
import session from "../auth/session.js";
import { dispatchMock } from "./mock/adapter.js";

/**
 * API client.
 *
 * Single choke-point for every network call the portal makes. In `mock` mode
 * requests are routed to the in-browser adapter; in `live` mode they become
 * same-origin `fetch()` calls carrying session cookies, CSRF, a timeout and a typed
 * error envelope — so features never branch on the environment themselves.
 */

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
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrf) headers['X-CSRF-TOKEN'] = csrf;
  return headers;
}

async function liveRequest(path, { method = "GET", body, signal, timeout } = {}) {
  const url = `${apiConfig.BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout ?? apiConfig.TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(
        body ? { "Content-Type": "application/json" } : {},
      ),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "same-origin",
    });

    const text = await response.text();
    const parsed = text ? safeJson(text) : null;

    if (!response.ok) {
      throw new ApiError(
        parsed?.errors ? Object.values(parsed.errors).flat().join("\n") : parsed?.message ?? `${method} ${path} failed with ${response.status}`,
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

  if (isMockMode()) {
    return dispatchMock({ path, method, body: options.body, params: options.params });
  }

  if (method === "GET" && options.params) {
    const search = new URLSearchParams(
      Object.entries(options.params).filter(([, v]) => v != null),
    );
    const qs = search.toString();
    if (qs) return liveRequest(`${path}${path.includes("?") ? "&" : "?"}${qs}`, options);
  }

  return liveRequest(path, options);
}

export const api = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
  request,
};

export default api;
