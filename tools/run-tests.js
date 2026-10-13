// Runs the project's tests (the registry is tools/tests.json) in parallel and prints one line per test and a summary, so a whole run costs a screenful, not a scrollback.
//   node tools/run-tests.js                    the tests that cover what you changed (git diff against HEAD + new files): the smallest matching set
//   node tools/run-tests.js --all              everything (what `npm test` runs after the build check)       --fast: all but the slow ones (3 or more minutes saved)
//   node tools/run-tests.js server-smoke tools/party-smoke.js ...   by id (or by file)       --group server|client      --for src/server/economy.js ...   as if these changed
//   node tools/run-tests.js --list [--changed]  what exists (id, time, needs, description) / what would run          -v  print every log in full     -j N  parallel jobs (default: cores - 1)
// Tests that need the built page (needs: dist) make the runner run `python3 build.py` first, so a stale dist/ can never give a false failure.
// A registry row runs tools/<id>.js, or tools/<file>.js when it has a "file" (the same script with other "args" can be a row of its own).
// A failing test prints its FAIL lines and the tail of its log (the whole log stays in <tmp>/wildwood-tests/<id>.log). A test whose failure matches a `flaky` substring in the
// registry is run once more and reported as flaky if it then passes. Exit code 1 when anything failed.
const fs=require('fs'), path=require('path'), os=require('os'), cp=require('child_process');
const ROOT=path.join(__dirname,'..'), REG=JSON.parse(fs.readFileSync(path.join(__dirname,'tests.json'),'utf8')).tests;
const argv=process.argv.slice(2), has=f=>argv.includes(f), opt=(f,d)=>{ const i=argv.indexOf(f); return i>=0?argv[i+1]:d; };
const VERBOSE=has('-v'), JOBS=Math.max(1,+opt('-j',Math.max(1,Math.min(4,os.cpus().length-1)))), OUT=path.join(os.tmpdir(),'wildwood-tests');
const flagsWithValue=new Set(['-j','--group','--for']);
const byId=new Map(REG.map(t=>[t.id,t]));
// changed files: tracked changes against HEAD plus untracked files; --for lists them by hand
function changedFiles(){
  const forIdx=argv.indexOf('--for'); if(forIdx>=0) return argv.slice(forIdx+1).filter(a=>!a.startsWith('-'));
  const sh=c=>{ try{ return cp.execSync(c,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\n').filter(Boolean); }catch(e){ return []; } };
  return [...new Set([...sh('git diff --name-only HEAD'),...sh('git ls-files --others --exclude-standard')])];
}
function select(){
  const ids=argv.filter((a,i)=>!a.startsWith('-')&&!flagsWithValue.has(argv[i-1])).map(a=>path.basename(a).replace(/\.js$/,''));
  if(has('--for')){ const files=changedFiles(); return REG.filter(t=>files.some(f=>t.covers.some(c=>new RegExp(c).test(f)))); }
  if(ids.length){ const bad=ids.filter(i=>!byId.has(i)); if(bad.length){ console.error('unknown test: '+bad.join(', ')+'  (node tools/run-tests.js --list)'); process.exit(2); } return ids.map(i=>byId.get(i)); }
  if(has('--all')) return REG;
  if(has('--fast')) return REG.filter(t=>!t.slow);
  if(opt('--group')) { const g=opt('--group'); return REG.filter(t=>g==='client'?t.needs==='dist':g==='server'?t.needs!=='dist':false); }
  const files=changedFiles(); return REG.filter(t=>files.some(f=>t.covers.some(c=>new RegExp(c).test(f))));
}
if(has('--list')){
  const sel=has('--changed')||has('--for')||has('--group')||has('--fast')||has('--all')||argv.some((a,i)=>!a.startsWith('-')&&!flagsWithValue.has(argv[i-1]))?select():REG;
  const w=Math.max(...sel.map(t=>t.id.length));
  for(const t of sel) console.log(`${t.id.padEnd(w)}  ${String(t.secs).padStart(3)}s  ${t.needs.padEnd(10)} ${t.desc}${t.slow?'  [slow]':''}`);
  console.log(`${sel.length} tests, about ${sel.reduce((a,t)=>a+t.secs,0)} s of work`); process.exit(0);
}
const todo=select();
if(!todo.length){
  const files=changedFiles();
  console.log(files.length?`no test covers the ${files.length} changed file(s): ${files.slice(0,6).join(', ')}${files.length>6?' ...':''}\n(--fast runs everything quick, --all everything, --list shows what exists)`:'nothing changed since HEAD: name tests, or use --fast / --all  (node tools/run-tests.js --list)');
  process.exit(0);
}
fs.mkdirSync(OUT,{recursive:true});
if(todo.some(t=>t.needs==='dist')){
  process.stdout.write('building dist/ for the page tests ... ');
  const b=cp.spawnSync('python3',['build.py'],{cwd:ROOT,encoding:'utf8'});
  if(b.status!==0){ console.log('FAILED\n'+(b.stdout||'')+(b.stderr||'')); process.exit(1); }
  console.log('ok');
}
const results=[]; const t0=Date.now();
function runOne(t){
  return new Promise(done=>{
    const s=Date.now(), logFile=path.join(OUT,t.id+'.log'); let log='';
    const child=cp.spawn(process.execPath,[path.join(__dirname,(t.file||t.id)+'.js'),...(t.args||[])],{cwd:ROOT,env:process.env});
    const timer=setTimeout(()=>{ log+='\nFAIL timed out after '+Math.round(t.secs*8+120)+' s\n'; child.kill('SIGKILL'); },(t.secs*8+120)*1000);
    child.stdout.on('data',d=>log+=d); child.stderr.on('data',d=>log+=d);
    child.on('close',code=>{ clearTimeout(timer); fs.writeFileSync(logFile,log); done({t,code,log,ms:Date.now()-s,logFile}); });
  });
}
const failLines=log=>log.split('\n').filter(l=>/^FAIL\b/.test(l));
async function runWithRetry(t){
  let r=await runOne(t);
  if(r.code!==0&&t.flaky&&t.flaky.length){
    const fl=failLines(r.log);
    if(fl.length&&fl.every(l=>t.flaky.some(f=>l.includes(f)))){ const first=fl[0]; const r2=await runOne(t); if(r2.code===0){ r2.flaky=first; r=r2; } else r=r2; }
  }
  return r;
}
function report(r){
  const checks=(r.log.match(/^PASS\b/gm)||[]).length, secs=(r.ms/1000).toFixed(1).padStart(5)+'s';
  if(r.code===0){ console.log(`PASS  ${r.t.id.padEnd(28)} ${String(checks).padStart(4)} checks ${secs}${r.flaky?'   (known flaky failure on the first run: '+r.flaky.slice(0,70)+')':''}`); if(VERBOSE) console.log(r.log); return; }
  console.log(`FAIL  ${r.t.id.padEnd(28)} ${String(checks).padStart(4)} checks ${secs}   exit ${r.code}   log: ${r.logFile}`);
  const fl=failLines(r.log); for(const l of fl.slice(0,12)) console.log('        '+l.slice(0,300));
  if(!fl.length||VERBOSE){ const tail=r.log.trim().split('\n').slice(-(VERBOSE?400:14)); for(const l of tail) console.log('        '+l.slice(0,300)); }
}
(async()=>{
  const queue=[...todo].sort((a,b)=>b.secs-a.secs); const workers=[];   // longest first, so the slow ones start early
  for(let i=0;i<JOBS;i++) workers.push((async()=>{ for(let t;(t=queue.shift());){ const r=await runWithRetry(t); results.push(r); report(r); } })());
  await Promise.all(workers);
  const failed=results.filter(r=>r.code!==0), checks=results.reduce((a,r)=>a+(r.log.match(/^PASS\b/gm)||[]).length,0);
  console.log(`\n${results.length-failed.length} of ${results.length} tests passed, ${checks} checks, ${((Date.now()-t0)/1000).toFixed(0)} s${failed.length?'   FAILED: '+failed.map(r=>r.t.id).join(', '):''}`);
  process.exit(failed.length?1:0);
})();
