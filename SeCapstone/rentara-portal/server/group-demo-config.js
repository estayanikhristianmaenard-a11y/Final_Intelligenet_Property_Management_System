// Reuse only explicitly configured local-HTTPS hosts for the demo's own port.
// Do not reflect arbitrary request Host/Origin headers or allow wildcard origins.
export const groupDemoRecipients = Object.freeze([
  'casas_williamjake@plpasig.edu.ph',
  'estayani_khristianmaenard@plpasig.edu.ph',
  'datakanani@gmail.com',
]);

export function groupDemoPortal(configured = 'https://localhost:8444/') {
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('Group 3 needs a root HTTPS PORTAL_URL from the local HTTPS setup.');
  url.port = '8444';
  return url.href;
}

// Flags are explicit for this process only; inherited environment cannot opt in.
export function groupDemoDelivery(args, base, now = new Date()) {
  for (const flag of args) if (!['--receive','--live-delivery'].includes(flag))
    throw new Error('Unknown demo option. Use --receive and/or --live-delivery.');
  const live = args.includes('--live-delivery');
  if (live && !(base.SMTP_HOST && base.SMTP_USER && base.SMTP_PASSWORD && base.SMTP_FROM))
    throw new Error('Live demo needs SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM in .env. No sending has started.');
  return {
    DEMO_LIVE_DELIVERY: live ? 'true' : 'false',
    DEMO_LIVE_SINCE: live ? now.toISOString() : '',
    RENT_EMAIL_ENABLED: live ? 'true' : 'false',
    ...Object.fromEntries(['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','SMTP_FROM','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'].map(key=>[key,live ? base[key] || '' : ''])),
  };
}

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
