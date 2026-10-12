import { ROLE_LABEL } from "../config/constants.js";
import { HOME_FOR_ROLE } from "../config/navigation.js";
const KEY = "propertypro.auth.session";
function load() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY));
    return cached?.token && cached?.user ? cached : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}
class SessionStore {
  constructor() {
    this.state = load();
    this.listeners = new Set();
  }
  getSnapshot() {
    return this.state;
  }
  get user() {
    return this.state.user;
  }
  get role() {
    return this.user?.role ?? null;
  }
  get token() {
    return this.state.token;
  }
  get isAuthenticated() {
    return Boolean(this.user && this.token);
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  set(next) {
    this.state = next;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
      localStorage.removeItem(KEY);
    } catch {}
    this.listeners.forEach((fn) => fn(next));
  }
  async signIn(_role, { email, password } = {}) {
    const { api } = await import("../api/client.js");
    const response = await api.post("/auth/login", { email, password });
    this.set({ ...response, signedInAt: new Date().toISOString() });
    return this.user;
  }
  async restore() {
    if (!this.token) return;
    try {
      const { api } = await import("../api/client.js");
      const user = await api.get("/auth/me");
      this.set({ ...this.state, user });
    } catch {
      this.clear();
    }
  }
  async signOut() {
    try {
      if (this.token) {
        const { api } = await import("../api/client.js");
        await api.post("/auth/logout");
      }
    } finally {
      this.clear();
    }
  }
  clear() {
    this.set({ user: null, token: null });
  }
  updateUser(patch) {
    if (this.user)
      this.set({ ...this.state, user: { ...this.user, ...patch } });
  }
  get homePath() {
    return "#" + (HOME_FOR_ROLE[this.role] ?? "/login");
  }
  get displayName() {
    return this.user?.name ?? "Guest";
  }
  get roleLabel() {
    return ROLE_LABEL[this.role] ?? "Guest";
  }
}
export default new SessionStore();
