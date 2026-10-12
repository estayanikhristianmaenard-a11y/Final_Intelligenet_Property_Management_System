/**
 * API configuration.
 *
 * Laravel injects live same-origin configuration into /portal. Static previews
 * default to mock mode. Live foundation screens use real endpoints; unfinished
 * modules remain unavailable until their backend workflows are implemented.
 */

export const apiConfig = {
  /** `"mock"` = in-memory demo data, `"live"` = REST backend. */
  MODE: globalThis.PROPERTYPRO_CONFIG?.MODE ?? import.meta?.env?.VITE_API_MODE ?? "mock",

  /** Root of the backend REST API. */
  BASE_URL: globalThis.PROPERTYPRO_CONFIG?.BASE_URL ?? import.meta?.env?.VITE_API_URL ?? "/api/v1",

  /** Bearer token candidate read on each live request. */
  TOKEN_STORAGE_KEY: "propertypro.auth.token",

  /** Request timeout in milliseconds. */
  TIMEOUT_MS: 12_000,

  /** Simulated latency for mock responses (keeps loading states honest). */
  MOCK_LATENCY_MS: 220,
};

export const isMockMode = () => apiConfig.MODE !== "live";
