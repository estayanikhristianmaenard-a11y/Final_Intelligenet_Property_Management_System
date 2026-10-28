// Shared by normal and demo startup. No environment-specific billing rules.
export const SCHEDULE_INTERVAL_MS = 60_000;
export const MAILBOX_INTERVAL_MS = 300_000;

export function startScheduler(integrations, { intervalMs = SCHEDULE_INTERVAL_MS, onError = () => console.error("Automatic processing cycle failed; check server status.") } = {}) {
  if (!Number.isFinite(intervalMs) || intervalMs < 1) throw new Error("Invalid scheduler interval");
  let running = null, stopped = false;
  const run = () => {
    if (stopped) return Promise.resolve();
    if (running) return running;
    running = Promise.resolve().then(() => integrations.tick()).catch(() => onError()).finally(() => { running = null; });
    return running;
  };
  const firstRun = run();
  const timer = setInterval(run, intervalMs);
  return { firstRun, async stop() { stopped = true; clearInterval(timer); await running; } };
}

export function automationStatus(runtime) {
  const intake = runtime.s.get("settings", "last-intake");
  const mailboxConfigured = Boolean(runtime.env.IMAP_HOST && runtime.env.IMAP_USER && (runtime.env.IMAP_PASSWORD || runtime.env.IMAP_ACCESS_TOKEN));
  return {
    checkedAt: new Date().toISOString(),
    scheduleIntervalMs: SCHEDULE_INTERVAL_MS,
    mailboxIntervalMs: MAILBOX_INTERVAL_MS,
    mailboxConfigured,
    lastMailboxAttemptAt: intake?.attemptedAt ? new Date(Number(intake.attemptedAt)).toISOString() : null,
    nextMailboxCheckAt: mailboxConfigured && intake?.attemptedAt ? new Date(Number(intake.attemptedAt) + MAILBOX_INTERVAL_MS).toISOString() : null,
    lastCycle: runtime.s.get("settings", "automation-cycle") ?? null,
  };
}
