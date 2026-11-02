import { cp,readFile,writeFile,mkdir,rm,realpath } from 'node:fs/promises';
import { resolve,join,relative,isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Small, explicit guard-sensitivity experiment, not a mutation-testing framework.
// No .env, runtime database, original bill or dependency directory is copied.
const root=fileURLToPath(new URL('../',import.meta.url));
const cases=[
  {name:'admin-financial-denial',file:'server/service.js',test:'tests/admin-visibility.test.js',pattern:'Admin is refused for a real pending rent payment',before:'confirm(user, id) {\n    this.role(user, "manager");',after:'confirm(user, id) {\n    if (user.role === "admin") {\n      const payment = this.s.getGlobal("payments", id);\n      const manager = this.s.allGlobal("users").find(u => u.role === "manager" && u.workspaceId === payment.workspaceId);\n      return this.s.withWorkspace(payment.workspaceId, () => this.confirm(manager, id));\n    }\n    this.role(user, "manager");'},
  {name:'admin-field-allowlist',file:'server/admin-visibility.js',test:'tests/admin-visibility.test.js',pattern:'Admin responses exclude originals',before:'const billView=b=>({...pick(b,',after:'const billView=b=>({...b,...pick(b,'},
  {name:'workspace-isolation',file:'server/index.js',test:'tests/admin-visibility.test.js',pattern:'Admin read capability never grants mutation',before:'user = service.authenticate(token);',after:'user = service.authenticate(token);\n      if (query.workspaceId && user.role !== "admin") user.workspaceId = query.workspaceId;'},
  {name:'demo-profile-clamp',file:'server/profile-policy.js',test:'tests/profile-safeguards.test.js',pattern:'Demo send-point restriction overrides valid keys',before:"return env.RENTARA_PROFILE !== 'demo' ||",after:"return true || env.RENTARA_PROFILE !== 'demo' ||"},
];
const hash=text=>createHash('sha256').update(text).digest('hex');
const env={...process.env,NODE_OPTIONS:''};
for(const key of Object.keys(env))if(/^(SMTP_|IMAP_|VAPID_|RENT_|RENTARA_|UTILITY_|DEMO_)/.test(key))delete env[key];

async function main(){
  const runDir=join(root,'data/security-guard-checks',new Date().toISOString().replace(/[:.]/g,'-'));
  await mkdir(runDir,{recursive:true});
  const canonicalRoot=await realpath(runDir),results=[];
  for(const check of cases){
    const copy=join(runDir,check.name);
    const within=relative(canonicalRoot,resolve(copy));
    if(!within||within.startsWith('..')||isAbsolute(within))throw new Error('Refusing an unsafe isolated-copy target.');
    try{
      await mkdir(copy);
      for(const dir of ['server','src','tests','tools'])await cp(join(root,dir),join(copy,dir),{recursive:true});
      for(const file of ['package.json','index.html','.env.operational.example'])await cp(join(root,file),join(copy,file));
      const execute=()=>{
        const result=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-name-pattern',check.pattern,check.test],{cwd:copy,env,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:4*1024*1024});
        return {status:result.status,output:(result.stdout||'')+(result.stderr||''),error:result.error?.code??null};
      };
      const baseline=execute();
      await writeFile(join(runDir,check.name+'-baseline.log'),baseline.output);
      if(baseline.status!==0||!/\bpass\s+1\b/.test(baseline.output))throw new Error('The selected positive-control test did not pass exactly once.');
      const filename=join(copy,check.file),source=(await readFile(filename,'utf8')).replaceAll('\r\n','\n');
      if(source.split(check.before).length!==2)throw new Error('Expected exactly one mutation location.');
      const mutated=source.replace(check.before,check.after);
      await writeFile(filename,mutated);
      const negative=execute();
      await writeFile(join(runDir,check.name+'-mutated.log'),negative.output);
      const workingSourceUnchanged=hash((await readFile(join(root,check.file),'utf8')).replaceAll('\r\n','\n'))===hash(source);
      const detected=workingSourceUnchanged&&negative.status===1&&/ERR_ASSERTION|AssertionError/.test(negative.output)&&negative.output.includes(check.pattern);
      results.push({guard:check.name,file:check.file,test:check.test,pattern:check.pattern,baselineExit:baseline.status,mutatedExit:negative.status,assertionDetected:detected,workingSourceUnchanged,originalSha256:hash(source),mutatedSha256:hash(mutated),mutation:{before:check.before,after:check.after},error:negative.error});
      console.log(check.name+': baseline passed; guard removal '+(detected?'detected by assertion':'NOT verified'));
    }catch(error){results.push({guard:check.name,assertionDetected:false,error:error.message});}
    finally{
      // The resolved target is the explicit child created above, never runDir/root.
      const target=resolve(copy),boundary=relative(canonicalRoot,target);
      if(!boundary||boundary.startsWith('..')||isAbsolute(boundary))throw new Error('Refusing unsafe copy cleanup.');
      await rm(target,{recursive:true,force:true,maxRetries:5,retryDelay:100});
    }
    await writeFile(join(runDir,'results.json'),JSON.stringify({checkedAt:new Date().toISOString(),scope:'Four targeted isolated-copy sensitivity checks; no live data/services',allDetected:results.length===cases.length&&results.every(r=>r.assertionDetected),results},null,2)+'\n');
  }
  console.log('Evidence: '+relative(root,runDir).replaceAll('\\','/'));
  if(results.length!==cases.length||results.some(r=>!r.assertionDetected))throw new Error('One or more guard-sensitivity checks did not complete as expected. See retained evidence.');
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
