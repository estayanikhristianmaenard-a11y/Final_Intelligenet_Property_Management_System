import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Integrations } from "./integrations.js";
import { DEFAULT_WORKSPACE } from "./store.js";

// Credentials stay in a private server file/environment, never workspace API responses.
export function workspaceIntegrations(service, dataDir, env, provided) {
  const s = service.s,
    runtimes = new Map();
  const configs = env.WORKSPACE_CONFIG_FILE
    ? JSON.parse(readFileSync(env.WORKSPACE_CONFIG_FILE, "utf8"))
    : {};
  const keys = [
    "IMAP_HOST",
    "IMAP_PORT",
    "IMAP_USER",
    "IMAP_PASSWORD",
    "IMAP_ACCESS_TOKEN",
    "IMAP_MAILBOX",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "RENT_EMAIL_ENABLED",
    "VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
    "PORTAL_URL",
    "OCR_LANG_PATH",
  ];
  const runtime = (id) => {
    if (runtimes.has(id)) return runtimes.get(id);
    if (!/^[a-zA-Z0-9_-]+$/.test(id))
      throw new Error("Invalid workspace reference");
    const workspace = s.getGlobal("workspaces", id);
    if (!workspace || workspace.status !== "active")
      throw new Error("Workspace unavailable");
    const config =
      id === DEFAULT_WORKSPACE
        ? { ...env }
        : { PORTAL_URL: env.PORTAL_URL, OCR_LANG_PATH: env.OCR_LANG_PATH };
    for (const key of keys)
      if (configs[id]?.[key] !== undefined) config[key] = configs[id][key];
    const demo = s.withWorkspace(id, () => s.get("settings", "demo-showcase"));
    if (demo || workspace.demo)
      Object.assign(config, {
        RENT_EMAIL_ENABLED: "false",
        IMAP_HOST: "",
        IMAP_USER: "",
        VAPID_PUBLIC_KEY: "",
        VAPID_PRIVATE_KEY: "",
        VAPID_SUBJECT: "",
      });
    const result =
      (id === DEFAULT_WORKSPACE && provided) ||
      new Integrations(
        service,
        id === DEFAULT_WORKSPACE ? dataDir : join(dataDir, "workspaces", id),
        config,
      );
    runtimes.set(id, result);
    return result;
  };
  let ticking = false;
  return new Proxy(runtime(DEFAULT_WORKSPACE), {
    get(target, key) {
      if (key === "forWorkspace") return runtime;
      if (key === "close")
        return async () => {
          for (const instance of runtimes.values()) await instance.close();
        };
      if (key === "services")
        return async () => {
          const checks = [];
          for (const workspace of s
            .allGlobal("workspaces")
            .filter((w) => w.status === "active")) {
            let rows;
            try {
              rows = await s.withWorkspace(workspace.id, () => runtime(workspace.id).services());
            } catch {
              rows = [{id:"workspace-status",name:"Workspace checks",state:"unavailable",healthState:"unavailable",status:"degraded",checkedAt:new Date().toISOString(),detail:"Checks for this workspace could not be loaded.",method:"Load workspace status",limitation:"Other workspaces remain independently available.",nextStep:"Ask the operator to review this workspace configuration and server logs."}];
            }
            checks.push(
              ...rows.map((row) => ({
                ...row,
                id:
                  workspace.id === DEFAULT_WORKSPACE
                    ? row.id
                    : `${workspace.id}:${row.id}`,
                workspaceId: workspace.id,
                workspaceName: workspace.name,
              })),
            );
          }
          return checks;
        };
      if (key === "tick")
        return async () => {
          if (ticking) return;
          ticking = true;
          try {
            for (const workspace of s
              .allGlobal("workspaces")
              .filter((w) => w.status === "active")) {
              try {
                await s.withWorkspace(workspace.id, () =>
                  runtime(workspace.id).tick(),
                );
              } catch {
                console.error("Workspace scheduler failed:", workspace.id);
              }
            }
          } finally {
            ticking = false;
          }
        };
      const value = Reflect.get(target, key);
      return typeof value === "function"
        ? (...args) =>
            s.withWorkspace(DEFAULT_WORKSPACE, () => value.apply(target, args))
        : value;
    },
  });
}
