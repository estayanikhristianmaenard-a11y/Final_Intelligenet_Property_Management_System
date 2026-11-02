import { groupDemoRecipients } from './group-demo-config.js';
// Shared connection values never select data, mailbox, transport or delivery switches.
export const sharedConnectionKeys = [
  'SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','SMTP_FROM',
  'IMAP_HOST','IMAP_PORT','IMAP_USER','IMAP_PASSWORD','IMAP_ACCESS_TOKEN',
  'VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','OCR_LANG_PATH',
];
export function assertProfile(env) {
  if (env.RENTARA_PROFILE && !['demo','operational','acceptance'].includes(env.RENTARA_PROFILE))
    throw new Error('Unknown runtime profile. Use the fixed Demo or Operational startup command.');
}
export function deliveryAllowed(env) {
  assertProfile(env);
  return env.RENTARA_PROFILE !== 'demo' ||
    (env.DEMO_LIVE_DELIVERY === 'true' && Number.isFinite(Date.parse(env.DEMO_LIVE_SINCE)));
}
export function recipientAllowed(env, user, notification, subscription) {
  if (!deliveryAllowed(env)) return false;
  if (env.RENTARA_PROFILE !== 'demo') return true;
  const since = Date.parse(env.DEMO_LIVE_SINCE);
  return groupDemoRecipients.includes(String(user?.email || '').trim().toLowerCase()) &&
    Date.parse(notification?.timestamp) >= since &&
    (!subscription || Date.parse(subscription.createdAt) >= since);
}
export function mailboxEnabled(env) {
  assertProfile(env);
  return env.UTILITY_INTAKE_ENABLED !== 'false' &&
    (env.RENTARA_PROFILE !== 'demo' || (env.UTILITY_INTAKE_ENABLED === 'true' && env.IMAP_MAILBOX === 'Rentara-Group3-Demo')) &&
    Boolean(env.IMAP_HOST && env.IMAP_USER && (env.IMAP_PASSWORD || env.IMAP_ACCESS_TOKEN));
}
export function restrictProfile(env) {
  assertProfile(env);
  const result = {...env};
  if (result.RENTARA_PROFILE === 'operational' && (result.IMAP_MAILBOX || '').trim().toLowerCase() === 'rentara-group3-demo')
    throw new Error('Operational workspaces must not read the Group 3 Demo label. Use a separate account/label configuration.');
  if (!deliveryAllowed(result)) Object.assign(result, {RENT_EMAIL_ENABLED:'false',VAPID_PUBLIC_KEY:'',VAPID_PRIVATE_KEY:'',VAPID_SUBJECT:''});
  if (!mailboxEnabled(result)) Object.assign(result,{IMAP_HOST:'',IMAP_USER:'',IMAP_PASSWORD:'',IMAP_ACCESS_TOKEN:''});
  return result;
}
export function validateMailboxes(entries) {
  const readers = new Map();
  for (const [id,env] of entries) {
    if (!mailboxEnabled(env)) continue;
    const key = JSON.stringify([env.IMAP_USER.trim().toLowerCase(),(env.IMAP_MAILBOX || 'INBOX').trim().toLowerCase()]);
    if (readers.has(key)) throw new Error(`Mailbox label collision between workspaces ${readers.get(key)} and ${id}. Assign different account/label pairs before starting intake.`);
    readers.set(key,id);
  }
}
