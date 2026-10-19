// Configuration-only check: never authenticates, sends, retrieves mail or writes data.
import {existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {DatabaseSync} from "node:sqlite";

export function integrationReadiness(env,showcase=false) {
  const present=key=>Boolean(env[key]?.trim());
  const missing=keys=>keys.filter(key=>!present(key));
  const smtpMissing=missing(["SMTP_HOST","SMTP_USER","SMTP_PASSWORD","SMTP_FROM"]);
  const imapMissing=missing(["IMAP_HOST","IMAP_USER"]);
  if(!present("IMAP_PASSWORD")&&!present("IMAP_ACCESS_TOKEN"))imapMissing.push("IMAP_PASSWORD or IMAP_ACCESS_TOKEN");
  const pushMissing=missing(["VAPID_SUBJECT","VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY"]);
  let portalState="missing";
  try {
    const url=new URL(env.PORTAL_URL);
    portalState=!["http:","https:"].includes(url.protocol)||url.username||url.password ? "invalid" : ["localhost","127.0.0.1","[::1]"].includes(url.hostname) ? "laptop_only" : url.protocol==="http:" ? "http_local_demo" : "https_configured";
  } catch {if(present("PORTAL_URL"))portalState="invalid";}
  const state=(fields,enabled=true)=>showcase ? "blocked_by_showcase" : fields.length ? "missing_configuration" : !enabled ? "disabled" : "configured_not_live_verified";
  return {
    scope:"Default workspace only; private workspace overrides are not inspected",
    checks:[
      {name:"Rent email",state:state(smtpMissing,env.RENT_EMAIL_ENABLED==="true"),missing:smtpMissing},
      {name:"Property mailbox",state:state(imapMissing),missing:imapMissing},
      {name:"Web Push",state:state(pushMissing),missing:pushMissing},
      {name:"Portal links",state:portalState,missing:present("PORTAL_URL")?[]:["PORTAL_URL"]},
    ],
    notes:["Configuration presence does not verify authentication or delivery.","Showcase data must keep external messages blocked. Use a separate non-showcase database and authorized recipients for live checks.","Phone Web Push requires a supported secure context; an ordinary LAN HTTP address is not sufficient."],
  };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let database;
  try {
    const file=join(resolve(process.env.DATA_DIR||"data"),"propertypro.sqlite");
    let showcase=false;
    if(existsSync(file)) {
      database=new DatabaseSync(file,{readOnly:true});
      const row=database.prepare("SELECT data FROM settings WHERE id='demo-showcase' AND workspaceId='ws-default'").get();
      const workspace=database.prepare("SELECT data FROM workspaces WHERE id='ws-default'").get();
      showcase=Boolean(row||workspace&&JSON.parse(workspace.data).demo);
    }
    const result=integrationReadiness(process.env,showcase);
    console.log(result.scope);
    for(const check of result.checks)console.log(`${check.name}: ${check.state}${check.missing.length ? " | Missing: "+check.missing.join(", ") : ""}`);
    for(const note of result.notes)console.log(note);
  } catch {
    console.error("Configuration check could not read the database metadata. No credentials or data were printed. Check DATA_DIR and the database schema.");
    process.exitCode=1;
  } finally {database?.close();}
}
