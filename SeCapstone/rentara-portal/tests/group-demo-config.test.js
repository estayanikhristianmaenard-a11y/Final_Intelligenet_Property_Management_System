import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
import { groupDemoOrigins } from "../server/group-demo-config.js";

test("Group 3 origins include its HTTPS port and the explicitly configured LAN host", () => {
  const origins = new Set(groupDemoOrigins("https://192.168.1.71:8443,http://localhost:8080").split(","));
  for (const origin of ["https://localhost:8444", "https://127.0.0.1:8444", "https://192.168.1.71:8444", "http://localhost:8080"])
    assert.ok(origins.has(origin));
  assert.ok(!origins.has("*"));
  assert.ok(!origins.has("https://192.168.1.72:8444"));
  assert.ok(!groupDemoOrigins("https://user:password@example.test:8443").split(",").includes("https://example.test:8444"));
});

test("Group 3 module requests load with their browser Origin while unrelated origins remain forbidden", async () => {
  const store = new Store(":memory:");
  const app = createApp({ store, env: { ALLOWED_ORIGINS: groupDemoOrigins("https://192.168.1.71:8443") } });
  try {
    await new Promise(resolve => app.server.listen(0, "127.0.0.1", resolve));
    const root = `http://127.0.0.1:${app.server.address().port}`;
    for (const origin of ["https://localhost:8444", "https://127.0.0.1:8444", "https://192.168.1.71:8444"]) {
      const response = await fetch(root + "/src/app/app.js", { headers: { Origin: origin } });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /javascript/);
      assert.equal(response.headers.get("access-control-allow-origin"), origin);
    }
    const denied = await fetch(root + "/src/app/app.js", { headers: { Origin: "https://unrelated.example" } });
    assert.equal(denied.status, 403);
  } finally { await app.close(); }
});
