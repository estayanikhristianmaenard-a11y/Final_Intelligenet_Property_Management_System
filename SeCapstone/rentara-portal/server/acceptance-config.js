export const utilityMailbox = "Rentara-Utility-Acceptance";

export function acceptanceEnvironment(env, intake = {}, base = {}) {
  const result = {
    ...env, DATA_DIR: "data/acceptance", WORKSPACE_CONFIG_FILE: "",
    RENT_EMAIL_ENABLED: "false", IMAP_HOST: "", IMAP_USER: "", IMAP_ACCESS_TOKEN: "",
  };
  if (intake.enabled === true) {
    if (intake.mailbox !== utilityMailbox)
      throw new Error("Acceptance intake requires the dedicated utility mailbox.");
    if (base.IMAP_USER !== "rentara2026@gmail.com" || !base.IMAP_HOST || !(base.IMAP_PASSWORD || base.IMAP_ACCESS_TOKEN))
      throw new Error("Configure the agreed utility Gmail IMAP account in .env first.");
    for (const key of ["IMAP_HOST", "IMAP_PORT", "IMAP_USER", "IMAP_PASSWORD", "IMAP_ACCESS_TOKEN"])
      result[key] = base[key] || "";
    result.IMAP_MAILBOX = utilityMailbox;
  }
  return result;
}
