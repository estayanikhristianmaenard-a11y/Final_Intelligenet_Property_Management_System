import test from "node:test";
import assert from "node:assert/strict";
import {integrationReadiness} from "../tools/check-integrations.mjs";

test("integration preflight separates missing, disabled, showcase and configured states without leaking values",()=>{
  let result=integrationReadiness({});
  assert.equal(result.checks[0].state,"missing_configuration");
  assert.ok(result.checks[1].missing.includes("IMAP_PASSWORD or IMAP_ACCESS_TOKEN"));
  const env={SMTP_HOST:"smtp.example.test",SMTP_USER:"private-user",SMTP_PASSWORD:"private-password",SMTP_FROM:"private-from",IMAP_HOST:"imap.example.test",IMAP_USER:"private-user",IMAP_ACCESS_TOKEN:"private-token",VAPID_SUBJECT:"private-subject",VAPID_PUBLIC_KEY:"private-public",VAPID_PRIVATE_KEY:"private-key",PORTAL_URL:"http://localhost:8080/"};
  result=integrationReadiness(env);
  assert.equal(result.checks[0].state,"disabled");
  assert.equal(result.checks[1].state,"configured_not_live_verified");
  assert.equal(result.checks[3].state,"laptop_only");
  result=integrationReadiness({...env,RENT_EMAIL_ENABLED:"true"},true);
  assert.ok(result.checks.slice(0,3).every(row=>row.state==="blocked_by_showcase"));
  for(const value of Object.values(env))assert.ok(!JSON.stringify(result).includes(value));
  assert.equal(integrationReadiness({...env,RENT_EMAIL_ENABLED:"true"}).checks[0].state,"configured_not_live_verified");
  for(const url of ["ftp://example.test/","https://user:pass@example.test/","not a URL"])assert.equal(integrationReadiness({PORTAL_URL:url}).checks[3].state,"invalid");
  assert.equal(integrationReadiness({PORTAL_URL:"http://192.168.1.71:8080/"}).checks[3].state,"http_local_demo");
});
