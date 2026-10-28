// Reuse only explicitly configured local-HTTPS hosts for the demo's own port.
// Do not reflect arbitrary request Host/Origin headers or allow wildcard origins.
export function groupDemoOrigins(configured = "") {
  const origins = new Set(["https://localhost:8444", "https://127.0.0.1:8444"]);
  for (const value of configured.split(",").map(v => v.trim()).filter(Boolean)) {
    origins.add(value);
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && url.port === "8443" &&
          !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash) {
        url.port = "8444";
        origins.add(url.origin);
      }
    } catch { /* An invalid configured value never grants another origin. */ }
  }
  return [...origins].join(",");
}
