import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Store, DEFAULT_WORKSPACE, newId } from '../server/store.js';
import { Service } from '../server/service.js';
import { parseUtilityText, philippineDate } from '../server/rules.js';
import { utilityPdf } from '../tests/fixtures.js';

const root = fileURLToPath(new URL('../',import.meta.url));
export const workspaceDemoPassword = 'LocalDemo!2026';
export const workspaceDemoAccounts = Object.freeze({
  manager:'manager.b.group3@example.test',staff:'staff.b.group3@example.test',
  tenants:['tenant.b1.group3@example.test','tenant.b2.group3@example.test','tenant.b3.group3@example.test'],
});

// Additive fixture preparation only. This is not onboarding or a production seed.
export async function prepareWorkspaceDemo(dataDir=join(root,'data/group-demo')) {
  const filename=join(dataDir,'propertypro.sqlite');
  if (!existsSync(filename)) throw new Error('Prepare Group 3 first. No database was created.');
  const original=new DatabaseSync(filename,{readOnly:true});let backupFile;
  try {
    const marker=original.prepare("SELECT data FROM settings WHERE workspaceId=? AND id='group-demo'").get(DEFAULT_WORKSPACE);
    if (!marker || !JSON.parse(marker.data).ready) throw new Error('Only a prepared Group 3 database may receive these fixtures. Existing records preserved.');
    const saved=original.prepare("SELECT data FROM settings WHERE workspaceId=? AND id='group-demo-workspaces'").get(DEFAULT_WORKSPACE);
    if (saved) {
      const result=JSON.parse(saved.data);
      if (!result.ready || !original.prepare('SELECT id FROM workspaces WHERE id=?').get(result.testWorkspaceId)) throw new Error('Workspace fixture marker is incomplete; investigate without resetting records.');
      return {...result,reused:true};
    }
    mkdirSync(join(dataDir,'backups'),{recursive:true});
    backupFile=join(dataDir,'backups','before-workspace-demo-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');
    await backup(original,backupFile);
  } catch(error) {
    if (/no such table|no such column/.test(error.message)) throw new Error('Only a prepared Group 3 database may receive these fixtures. Existing records preserved.');
    throw error;
  } finally {original.close();}
  const s=new Store(filename),service=new Service(s),createdFiles=[];
  try {
    const result=s.transaction(()=>{
      const admin=s.allGlobal('users').find(u=>u.role==='admin'&&u.status==='active');
      if (!admin) throw new Error('An active Group 3 Admin is required.');
      const emails=[workspaceDemoAccounts.manager,workspaceDemoAccounts.staff,...workspaceDemoAccounts.tenants];
      if (s.allGlobal('users').some(u=>emails.includes(u.email))) throw new Error('A fixture login already exists without its setup marker; existing accounts were preserved.');
      const firstStaff=s.allGlobal('users').find(u=>u.email==='staff.group3@example.test');
      if (firstStaff && (firstStaff.role!=='staff'||firstStaff.workspaceId!==DEFAULT_WORKSPACE)) throw new Error('The existing Group 3 Staff login has a different assignment; preserved.');
      if (!firstStaff) service.userWrite(admin,{name:'Group 3 Operations Staff',email:'staff.group3@example.test',role:'staff',workspaceId:DEFAULT_WORKSPACE,password:workspaceDemoPassword});
      const workspace=service.workspaceWrite(admin,{name:'Bayan Demo Rentals'});
      s.withGlobal(()=>s.save('workspaces',{...workspace,demo:true}));
      return s.withWorkspace(workspace.id,()=>{
        const manager=service.userWrite(admin,{name:'Bayan Demo Manager',email:workspaceDemoAccounts.manager,role:'manager',workspaceId:workspace.id,password:workspaceDemoPassword});
        const staff=service.userWrite(admin,{name:'Bayan Demo Staff',email:workspaceDemoAccounts.staff,role:'staff',workspaceId:workspace.id,password:workspaceDemoPassword});
        const property=service.writeEntity(manager,'properties',{name:'Bayan Test Apartments',address:'Fictional address for workspace isolation testing',city:'Pasig City',type:'apartment'});
        const units=['B-101','B-102'].map((code,index)=>service.writeEntity(manager,'units',{propertyId:property.id,code,floor:'Ground Floor',monthlyRent:index?4500:7000,arrangement:index?'individual':'shared_occupancy'}));
        const tenants=workspaceDemoAccounts.tenants.map((email,index)=>{
          const tenant=service.writeEntity(manager,'tenants',{unitId:units[index<2?0:1].id,fullName:['Bayan Demo Tenant One','Bayan Demo Tenant Two','Bayan Demo Tenant Three'][index],email,leaseStart:'2026-10-01',assignmentStart:'2026-10-01'});
          const user=service.userWrite(admin,{name:tenant.fullName,email,role:'tenant',tenantId:tenant.id,workspaceId:workspace.id,password:workspaceDemoPassword});
          return {tenantId:tenant.id,userId:user.id,email};
        });
        for(const [unit,provider,category,account] of [[units[0],'Meralco','electricity','G3B-E001'],[units[1],'Manila Water','water','G3B-W001']]) service.writeEntity(manager,'mappings',{unitId:unit.id,provider,category,account});
        service.generateRent(philippineDate());
        const sources={};
        const sourcesDir=join(dataDir,'workspaces',workspace.id,'sources');mkdirSync(sourcesDir,{recursive:true});
        for(const c of [
          {key:'electricity',provider:'Meralco',account:'G3B-E001',amount:450,start:'2026-10-15',end:'2026-11-14',due:'2026-11-20'},
          {key:'water',provider:'Manila Water',account:'G3B-W001',amount:180,start:'2026-10-15',end:'2026-11-14',due:'2026-11-20'},
          {key:'needsReview',provider:'Meralco',account:'G3B-E001',amount:600,start:'2026-11-15',end:'2026-12-14',due:'2026-12-20',held:true},
        ]) {
          const text=[c.provider,'SYNTHETIC WORKSPACE TEST - NOT A REAL BILL',`Account: ${c.account}`,`Amount Due: ${c.amount.toFixed(2)}`,`Due Date: ${c.due}`,`Billing Period: ${c.start} to ${c.end}`].join('\n');
          const bytes=utilityPdf(text),id=newId('ocr'),file=join(sourcesDir,id);
          writeFileSync(file,bytes,{flag:'wx'});createdFiles.push(file);
          const rawText=c.held?text.replace(`Due Date: ${c.due}`,'Due Date: unreadable'):text;
          s.save('incoming',{id,filename:`workspace-b-${c.key}-synthetic.pdf`,contentType:'application/pdf',documentHash:createHash('sha256').update(bytes).digest('hex'),sourceFileId:id,receivedAt:new Date().toISOString(),rawText,confidence:c.held?60:100,ocrStatus:'processing',revision:1,extractionMethod:'synthetic_fixture',fixture:true,...parseUtilityText(rawText)});
          const processed=service.processIncoming(id);
          if (processed.document.ocrStatus!==(c.held?'failed':'validated')) throw new Error('Synthetic fixture did not reach its expected state; database changes rolled back.');
          sources[c.key]=id;
        }
        // Seed history is visible in the portal but never queued for external delivery.
        for(const n of s.all('notifications')) s.save('notifications',{...n,delivery:'skipped',emailDelivery:'skipped'});
        const marker={id:'group-demo-workspaces',ready:true,testWorkspaceId:workspace.id,workspaceName:workspace.name,managerId:manager.id,staffId:staff.id,tenants,units:units.map(u=>u.id),sources,createdAt:new Date().toISOString()};
        s.withWorkspace(DEFAULT_WORKSPACE,()=>s.save('settings',marker));
        return marker;
      });
    });
    return {...result,backupFile,reused:false};
  } catch(error) {for(const file of createdFiles)rmSync(file,{force:true});throw error;}
  finally{s.close();}
}

if (process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  prepareWorkspaceDemo().then(result=>{
    console.log(result.reused?'Existing second-workspace records and passwords preserved.':'Second Group 3 test workspace added after a SQLite backup.');
    console.log('Workspace: '+result.workspaceName);
    console.log('Manager: '+workspaceDemoAccounts.manager+'; Staff: '+workspaceDemoAccounts.staff);
    console.log('Tenants: '+workspaceDemoAccounts.tenants.join(', '));
    console.log('Initial synthetic-account password: '+workspaceDemoPassword+' (reruns never reset it).');
    console.log('Sample rent, electricity, water and one staged Staff correction case are ready. No email sent or mailbox accessed.');
  }).catch(error=>{console.error(error.message);process.exitCode=1;});
}
