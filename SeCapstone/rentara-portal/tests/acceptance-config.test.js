import test from "node:test";
import assert from "node:assert/strict";
import { acceptanceEnvironment, utilityMailbox } from "../server/acceptance-config.js";

const credentials = { IMAP_HOST: "imap.example.test", IMAP_USER: "rentara2026@gmail.com", IMAP_PASSWORD: "synthetic-secret" };
test("normal acceptance blocks inherited mail delivery, retrieval and workspace overrides", () => {
  const env = acceptanceEnvironment({ RENT_EMAIL_ENABLED: "true", IMAP_HOST: "inherited-host", IMAP_USER: "other@example.test", WORKSPACE_CONFIG_FILE: "live.json", DATA_DIR: "data/showcase" });
  assert.equal(env.RENT_EMAIL_ENABLED, "false"); assert.equal(env.IMAP_HOST, "");
  assert.equal(env.IMAP_USER, ""); assert.equal(env.WORKSPACE_CONFIG_FILE, "");
  assert.equal(env.DATA_DIR, "data/acceptance");
});
test("explicit utility intake restores only the agreed IMAP account and dedicated label while rent email stays off", () => {
  const env = acceptanceEnvironment({ RENT_EMAIL_ENABLED: "true", IMAP_MAILBOX: "INBOX" }, { enabled: true, mailbox: utilityMailbox }, credentials);
  assert.equal(env.IMAP_USER, credentials.IMAP_USER); assert.equal(env.IMAP_PASSWORD, credentials.IMAP_PASSWORD);
  assert.equal(env.IMAP_MAILBOX, utilityMailbox); assert.equal(env.RENT_EMAIL_ENABLED, "false");
});
test("utility intake cannot silently target a general inbox or another account", () => {
  assert.throws(() => acceptanceEnvironment({}, { enabled: true, mailbox: "INBOX" }, credentials), /dedicated/);
  assert.throws(() => acceptanceEnvironment({}, { enabled: true, mailbox: utilityMailbox }, { ...credentials, IMAP_USER: "other@example.test" }), /agreed/);
});
