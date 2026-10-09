/**
 * API configuration.
 *
 * Flip `MODE` to `"live"` once the backend is deployed: every data call in
 * the portal already goes through `src/api/client.js`, which switches between
 * the in-browser mock adapter and real `fetch` calls against `BASE_URL`
 * without touching a single feature module.
 */

export const apiConfig = {
  /** `"mock"` = in-memory demo data, `"live"` = REST backend. */
  MODE: import.meta?.env?.VITE_API_MODE ?? "mock",

  /** Root of the backend REST API. */
  BASE_URL: import.meta?.env?.VITE_API_URL ?? "http://localhost:8080/api/v1",

  /** Bearer token candidate read on each live request. */
  TOKEN_STORAGE_KEY: "propertypro.auth.token",

  /** Request timeout in milliseconds. */
  TIMEOUT_MS: 12_000,

  /** Simulated latency for mock responses (keeps loading states honest). */
  MOCK_LATENCY_MS: 220,
};

export const isMockMode = () => apiConfig.MODE !== "live";
