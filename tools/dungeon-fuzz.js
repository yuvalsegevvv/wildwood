// Stateful fuzz of parties and dungeon runs, straight from src/ (no build): a few level-30 players take random but VALID actions (party invites, accepts, declines, kicks, leader changes, runs started
// with the testing tool in every theme and mission that is built, leaving, reviving, walking, attacking, dying in a run, disconnecting and coming back) while the world ticks. The scripted
// tests (party-smoke, dungeon-runs-smoke, dungeon-missions-smoke) walk the happy paths; this walks the transitions between them: the leader leaves mid-run, someone disconnects during an
// invite, a run's last member drops, a player comes back to a run that has ended.
// Fails on: a throw in a handler or tick(), a non-finite number, an inconsistency between the registries (a run and its slot, a party and its members' p.party, a run's members and their
// p.inst), and, after everyone has gone and 10 minutes have passed: a run, a party, a run's monster or a held slot left behind.
// Usage: node tools/dungeon-fuzz.js [--steps 3000] [--seed 1] [--players 5] [--verbose]
const {loadServer,findNonFinite}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; };
const STEPS=arg('--steps',3000), NP=arg('--players',5), VERBOSE=process.argv.includes('--verbose');
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const pick=a=>a[Math.floor(rnd()*a.length)];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const nf=findNonFinite(m); if(nf) bad.push('a message to a client holds a NaN or an Infinity (JSON makes it null): '+nf); },broadcast(){}},['MONS','getH','DG_RUNS','PARTIES','DG_SLOT_RUN','S','dgPoolS','DG_THEMES']);
const thrown=new Map(), bad=[]; const note=(where,e)=>{ const k=where+': '+String(e&&e.message).slice(0,100)+' @ '+String(e&&e.stack).split('\n').slice(1,3).map(s=>s.trim().replace(/\(.*[\\/]/,'(')).join(' < '); thrown.set(k,(thrown.get(k)||0)+1); };
const tick=n=>{ for(let i=0;i<n;i++){ try{ W.tick(0.05); }catch(e){ note('tick()',e); } } };
const send=(pid,m)=>{ try{ W.receive(pid,m); }catch(e){ note('receive '+m.t+(m.a?'/'+m.a:''),e); if(VERBOSE) console.log(JSON.stringify(m)); } };
const ids=[...Array(NP).keys()].map(i=>'g'+i), names=ids.map((_,i)=>'Gz'+i), online=new Set();
const hello=i=>({name:names[i],look:{cls:['warrior','archer','mage'][i%3]},save:{level:30}});
const join=i=>{ try{ W.join(ids[i],hello(i)); online.add(ids[i]); send(ids[i],{t:'dev',cmd:'giveAll'}); send(ids[i],{t:'dev',cmd:'level',v:30}); }catch(e){ note('join',e); } };
const drop=i=>{ try{ W.leave(ids[i]); }catch(e){ note('leave',e); } online.delete(ids[i]); };
for(let i=0;i<NP;i++) join(i); tick(5);
const themes=Object.keys(x.DG_THEMES), missions=x.dgPoolS();
const stats={runs:0,peak:0,steps:0};
const consistent=(r)=>{
  const S=x.S;
  for(const [id,p] of S.players){ for(const k of ['x','y','z','hp']) if(typeof p[k]!=='number'||!isFinite(p[k])) bad.push(`step ${r}: ${id}.${k}=${p[k]}`); }
  for(const [id,run] of x.DG_RUNS){
    if(x.DG_SLOT_RUN[run.slot]!==run.id) bad.push(`step ${r}: run ${id} is in slot ${run.slot} but the slot table says ${x.DG_SLOT_RUN[run.slot]}`);
    for(const [k,mb] of run.members){ if(mb.p){ const q=S.players.get(mb.pid); if(q!==mb.p) bad.push(`step ${r}: run ${id} member ${mb.pid} holds a player the server does not have`); else if(q.inst!==run.id&&!mb.left) bad.push(`step ${r}: run ${id} member ${mb.pid} is present but p.inst=${q.inst}`); } }
  }
  for(const [id,p] of S.players){ if(p.inst&&!x.DG_RUNS.has(p.inst)) bad.push(`step ${r}: ${id}.inst=${p.inst} but no such run`); }
  for(const [id,pa] of x.PARTIES){
    if(new Set(pa.mem).size!==pa.mem.length) bad.push(`step ${r}: party ${id} lists a member twice`);
    if(pa.mem.length&&!pa.mem.includes(pa.lead)) bad.push(`step ${r}: party ${id}'s lead ${pa.lead} is not a member (${pa.mem})`);
    for(const m of pa.mem){ const q=S.players.get(m); if(q&&q.party!==pa.id) bad.push(`step ${r}: party ${id} lists ${m} whose p.party=${q.party}`); }
  }
  for(const [id,p] of S.players) if(p.party&&!x.PARTIES.has(p.party)) bad.push(`step ${r}: ${id}.party=${p.party} but no such party`);
};
for(let r=1;r<=STEPS&&bad.length<15;r++){
  stats.steps++;
  const i=Math.floor(rnd()*NP), id=ids[i], p=W.players.get(id), o=Math.floor(rnd()*NP);
  if(!p){ if(rnd()<0.5) join(i); tick(1+Math.floor(rnd()*10)); continue; }
  const u=rnd();
  if(u<0.04) drop(i);
  else if(u<0.14) send(id,{t:'party',a:'invite',name:names[o]});
  else if(u<0.22) send(id,{t:'party',a:'accept'});
  else if(u<0.25) send(id,{t:'party',a:'decline'});
  else if(u<0.29) send(id,{t:'party',a:'leave'});
  else if(u<0.32) send(id,{t:'party',a:'kick',name:names[o]});
  else if(u<0.36) send(id,{t:'party',a:'lead',name:names[o]});
  else if(u<0.41){ send(id,{t:'dev',cmd:'dg',v:pick(themes)+':'+pick(missions)+(rnd()<0.5?':'+Math.floor(rnd()*50):'')}); }
  else if(u<0.45) send(id,{t:'dg',a:'leave'});
  else if(u<0.52) send(id,{t:'dg',a:pick(['accept','decline'])});
  else if(u<0.56) send(id,{t:'dg',a:'revive',id:ids[o]});
  else if(u<0.58) send(id,{t:'dg',a:'use',id:'o'+Math.floor(rnd()*6)});
  else if(u<0.75){   // walk a few metres in a random direction
    const a=rnd()*6.28, d=rnd()*2.5, nx=p.x+Math.sin(a)*d, nz=p.z+Math.cos(a)*d; send(id,{t:'pos',p:[nx,p.inst?p.y:x.getH(nx,nz),nz,a,0,0]}); }
  else {   // attack the nearest awake monster within 14 m (a run's monsters count: they are in the same list)
    let best=null,bd=196; for(const m of W.monsters){ if(m.dead||m.remove||!m.awake) continue; const dx=m.x-p.x, dz=m.z-p.z, d2=dx*dx+dz*dz; if(d2<bd&&(!!m.inst===!!p.inst)){ bd=d2; best=m; } }
    if(best) send(id,{t:'atk',k:pick(['basic','skill','burst']),tg:best.id,face:Math.atan2(best.x-p.x,best.z-p.z),aim:[best.x-p.x,0,best.z-p.z]}); }
  const q=W.players.get(id); if(q&&!q.inst&&q.hp<q.maxHp*0.3){ q.hp=q.maxHp; q.dead=false; }   // in the world nobody dies for good: the runs' own downs, revives and losses are what is being tested
  tick(1+Math.floor(rnd()*16));
  stats.peak=Math.max(stats.peak,x.DG_RUNS.size);
  if(r%100===0) consistent(r);
}
consistent('end');
// everybody leaves: after 10 simulated minutes nothing may be left behind
for(let i=0;i<NP;i++) if(W.players.has(ids[i])) drop(i);
tick(20*60*10); consistent('after the exodus');
const left=[]; if(x.DG_RUNS.size) left.push(x.DG_RUNS.size+' run(s) ('+[...x.DG_RUNS.values()].map(r=>r.th+':'+r.mission+' '+r.phase).join(', ')+')');
if(x.PARTIES.size) left.push(x.PARTIES.size+' party(ies)'); const mi=x.MONS.filter(m=>m.inst&&!m.remove).length; if(mi) left.push(mi+' monster(s) of a run');
const held=x.DG_SLOT_RUN.filter(Boolean).length; if(held) left.push(held+' slot(s) still held'); if(W.players.size) left.push(W.players.size+' player(s)');
if(left.length) bad.push('after everyone left and 10 minutes: '+left.join(', '));
let fails=0;
for(const [k,n] of [...thrown].sort((a,b)=>b[1]-a[1])){ console.log(`FAIL threw ${n}x  ${k}`); fails++; }
for(const b of [...new Set(bad)].slice(0,20)){ console.log('FAIL '+b); fails++; }
console.log(fails?`${fails} problem(s) in ${stats.steps} steps (most runs open at once: ${stats.peak})`:`PASS ${stats.steps} random party and run actions by ${NP} players, up to ${stats.peak} runs at once: registries consistent, nothing left behind after the exodus`);
process.exit(fails?1:0);
