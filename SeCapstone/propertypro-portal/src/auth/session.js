import { ROLE, ROLE_LABEL } from "../config/constants.js";
import { HOME_FOR_ROLE } from "../config/navigation.js";

/**
 * Session store.
 *
 * Holds the signed-in user, exposes a tiny pub/sub so the shell re-renders on
 * auth changes, and persists across reloads via localStorage. In `mock` mode
 * signing in is a role selection; in `live` mode the same `signIn()` call
 * posts to `/auth/login` and stores the returned bearer token.
 */

const STORAGE_KEY = "propertypro.auth.session";

/** Demo identities used by the mock adapter and the login screen. */
export const DEMO_USERS = {
  [ROLE.ADMIN]: {
    id: "usr-001",
    name: "Adrian Villanueva",
    email: "admin@propertypro.ph",
    role: ROLE.ADMIN,
    scope: "System maintenance",
  },
  [ROLE.MANAGER]: {
    id: "usr-002",
    name: "Karla Dizon",
    email: "manager@propertypro.ph",
    role: ROLE.MANAGER,
    scope: "Property & billing management",
  },
  [ROLE.TENANT]: {
    id: "usr-101",
    name: "Maria Santos",
    email: "maria.santos@gmail.com",
    role: ROLE.TENANT,
    scope: "Bills & payment reporting",
    tenantId: "tnt-001",
    unitCode: "B-203",
  },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) — session simply won't survive reload */
  }
}

class SessionStore {
  constructor() {
    this.state = load() ?? { user: null, token: null };
    this.listeners = new Set();
  }

  /** @returns {{user: object|null, token: string|null}} */
  getSnapshot() {
    return this.state;
  }

  get user() {
    return this.state.user;
  }

  get role() {
    return this.state.user?.role ?? null;
  }

  get isAuthenticated() {
    return Boolean(this.state.user);
  }

  /** @param {(state:{user:object|null})=>void} fn */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  #emit() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  #set(next) {
    this.state = next;
    persist(next);
    this.#emit();
  }

  /**
   * Sign in as a role.
   * Mock mode resolves immediately; live mode posts credentials to the API.
   * @param {string} role
   * @param {{password?:string}} [credentials]
   */
  async signIn(role, credentials = {}) {
    const identity = DEMO_USERS[role];
    if (!identity) throw new Error(`Unknown role: ${role}`);

    const { isMockMode } = await import("../config/api.js");
    let token = `mock-token-${role}`;

    if (!isMockMode()) {
      const { api } = await import("../api/client.js");
      const response = await api.post("/auth/login", {
        email: identity.email,
        password: credentials.password ?? "",
      });
      token = response.token;
    }

    this.#set({
      user: { ...identity },
      token,
      signedInAt: new Date().toISOString(),
    });
    return this.state.user;
  }

  signOut() {
    this.#set({ user: null, token: null });
  }

  /** Replace the cached user (e.g. after a profile update). */
  updateUser(patch) {
    if (!this.state.user) return;
    this.#set({ ...this.state, user: { ...this.state.user, ...patch } });
  }

  /** Bearer token handed to the API client on live requests. */
  get token() {
    return this.state.token;
  }

  /** Home path for the current role (used by redirects). */
  get homePath() {
    const role = this.role ?? ROLE.MANAGER;
    return `#${HOME_FOR_ROLE[role] ?? "/dashboard"}`;
  }

  get displayName() {
    return this.state.user?.name ?? "Guest";
  }

  get roleLabel() {
    return this.role ? ROLE_LABEL[this.role] : "—";
  }
}

const session = new SessionStore();
export default session;
