import {createRequire} from "node:module";

const resolveModule=createRequire(import.meta.url).resolve;
const iso=value=>{
  if (value === undefined || value === null || value === "") return null;
  const date=new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

// Query only delivery metadata in this workspace, not complete notification bodies.
function deliveryHistory(s, email) {
  const state=email ? "emailDelivery" : "delivery";
  const attempt=email ? "emailLastAttempt" : "lastAttempt";
  const attempts=email ? "emailAttempts" : "attempts";
  const success=email ? "emailAcceptedAt" : "pushAcceptedAt";
  const accepted=email ? "accepted" : "sent";
  const latest=s.db.prepare(`SELECT json_extract(data,'$.${state}') AS outcome,json_extract(data,'$.${attempt}') AS attemptedAt
    FROM notifications WHERE workspaceId=? AND json_extract(data,'$.${attempts}')>0
    ORDER BY coalesce(json_extract(data,'$.${attempt}'),json_extract(data,'$.timestamp')) DESC,id DESC LIMIT 1`).get(s.workspaceId);
  const previous=s.db.prepare(`SELECT max(coalesce(json_extract(data,'$.${success}'),CASE WHEN json_extract(data,'$.${state}')=? THEN json_extract(data,'$.${attempt}') END)) AS acceptedAt
    FROM notifications WHERE workspaceId=?`).get(accepted,s.workspaceId);
  return {outcome:latest?.outcome,lastAttemptAt:iso(latest?.attemptedAt),lastSuccessAt:iso(previous?.acceptedAt)};
}

export async function systemStatus(runtime) {
  const {s,env}=runtime;
  const checkedAt=new Date().toISOString();
  const check=async(id,name,method,limitation,probe)=>{
    let result;
    try {result=await probe();}
    catch {result={state:"unavailable",detail:"This check could not be completed.",nextStep:"Ask the system operator to inspect the server logs. Other checks remain available."};}
    return {id,name,checkedAt,lastAttemptAt:null,lastSuccessAt:null,method,limitation,...result,
      healthState:result.state,status:["available","recorded_success"].includes(result.state) ? "operational" : "degraded"};
  };
  const transport=(history,kind)=>{
    const failed=["failed","exhausted"].includes(history.outcome);
    const accepted=history.outcome === (kind === "email" ? "accepted" : "sent");
    return {...history,state:failed ? "last_attempt_failed" : accepted ? "recorded_success" : "unverified",
      detail:failed ? "The last recorded sending attempt failed." : accepted ? "A transport acceptance is recorded; this is historical evidence." : "No successful completed sending attempt is verified.",
      nextStep:failed ? "Review the sending records and server configuration before a deliberate retry." : accepted ? "Use the dates below to judge how recent this record is." : "Use a separate, deliberate delivery test when configuration is ready."};
  };
  return Promise.all([
    check("svc-db","Database connection","SQLite SELECT 1","Checks connection access only; not structural integrity, every table, or backup recovery.",()=>{
      if (s.db.prepare("SELECT 1 AS connected").get().connected !== 1) throw new Error("Database query failed");
      return {state:"available",detail:"SQLite responded to a read-only connection query.",lastSuccessAt:checkedAt,nextStep:"Use a separate integrity/restore procedure when a deeper database check is needed."};
    }),
    check("svc-mail","Property mailbox intake","IMAP configuration presence and stored last-sync result","Does not connect to the mailbox or prove that new provider bills are available.",()=>{
      const configured=Boolean(env.IMAP_HOST && env.IMAP_USER && (env.IMAP_PASSWORD || env.IMAP_ACCESS_TOKEN));
      const intake=s.get("settings","last-intake");
      const lastAttemptAt=iso(intake?.attemptedAt);
      const lastSuccessAt=iso(intake?.successfulAt ?? (intake?.status === "completed" ? intake.attemptedAt : null));
      return {state:!configured ? "not_configured" : intake?.status === "failed" ? "last_attempt_failed" : intake?.status === "completed" ? "recorded_success" : "unverified",
        lastAttemptAt,lastSuccessAt,detail:!configured ? "Required IMAP configuration is missing." : intake?.status === "failed" ? "The last recorded mailbox sync failed." : intake?.status === "completed" ? "A completed mailbox sync is recorded; this is not a live connection test." : "Configured; a completed mailbox sync has not been verified.",
        nextStep:!configured ? "Configure the property mailbox on the server when email intake is needed." : "Review sync dates. A Manager can deliberately synchronize the configured mailbox."};
    }),
    check("svc-rent-email","Rent email notifications","SMTP enablement/configuration and recorded sending results","Server acceptance does not prove inbox delivery or readership; no email is sent by this check.",()=>{
      const history=deliveryHistory(s,true);
      if (!runtime.rentEmail.configured()) return {...history,state:env.RENT_EMAIL_ENABLED === "false" ? "disabled" : "not_configured",detail:env.RENT_EMAIL_ENABLED === "false" ? "Rent email sending is disabled." : "Required sending configuration is incomplete.",nextStep:"The operator can configure and enable SMTP when a real sending test is authorized."};
      return transport(history,"email");
    }),
    check("svc-ocr","Bill extraction components","Resolve installed PDF, Tesseract.js and English-data packages","Availability does not prove OCR accuracy or successful worker execution; no bill is processed.",()=>{
      for (const name of ["pdfjs-dist/legacy/build/pdf.mjs","tesseract.js","@tesseract.js-data/eng"]) resolveModule(name);
      return {state:"available",detail:"Required extraction packages can be resolved.",nextStep:"Use an authorized sample bill to test actual extraction separately."};
    }),
    check("svc-rules","Billing validation rules","Check that the loaded processing function exists","Function availability is not a test of classification, allocation accuracy or every billing rule.",()=>{
      if (typeof runtime.service.processIncoming !== "function") throw new Error("Missing processor");
      return {state:"available",detail:"The bill-processing function is loaded.",nextStep:"Use the billing regression tests and controlled bill cases to verify behavior."};
    }),
    check("svc-push","Web Push notifications","VAPID configuration, delivery setting and recorded transport results","Transport acceptance does not prove device display or readership; no notification is sent.",async()=>{
      const config=await runtime.pushConfig();
      const history=deliveryHistory(s,false);
      if (!config.configured) return {...history,state:"not_configured",detail:"Required VAPID configuration is missing.",nextStep:"Configure Web Push keys on the server when device testing is needed."};
      if (runtime.service.config().pushEnabled === false) return {...history,state:"disabled",detail:"Web Push delivery is disabled in the workspace settings.",nextStep:"The Manager can enable delivery when configuration and device tests are ready."};
      return transport(history,"push");
    }),
    check("svc-queue","Exception records","Read the open-exception count for this workspace","An accessible queue does not mean its bills are resolved or correctly processed.",()=>{
      const {total}=s.db.prepare("SELECT count(*) AS total FROM exceptions WHERE workspaceId=? AND json_extract(data,'$.state')='open'").get(s.workspaceId);
      return {state:"available",detail:`${total} open exception records.`,openRecords:total,nextStep:total ? "The Manager reviews and corrects the affected bills." : "No open exceptions were found in this workspace."};
    }),
  ]);
}
