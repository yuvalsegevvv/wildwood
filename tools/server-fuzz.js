// Fuzzes the world server's message handlers straight from src/: a few players are sent thousands of messages of every type with garbage fields
// (JSON-shaped: nulls, huge and negative numbers, 1e999, strings that look like prototype keys, deep objects, arrays) mixed with real ids (items,
// skills, nodes, monsters, lands), the world is ticked between them, and afterwards the state must still be sane.
// Fails on: a handler or tick() that throws (the Node host swallows a throw from receive() and CRASHES on one from tick()), a non-finite number in a
// player or monster, a negative or fractional coin count, an inventory that is not an array of strings, a snapshot that cannot be serialized.
// Usage: node tools/server-fuzz.js [--rounds 6000] [--seed 1] [--players 3] [--nodev] [--verbose]      (--nodev: the deployed server's setting)
const {loadServer}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; };
const ROUNDS=arg('--rounds',6000), NP=arg('--players',3), NODEV=process.argv.includes('--nodev'), VERBOSE=process.argv.includes('--verbose');
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const pick=a=>a[Math.floor(rnd()*a.length)];
const inbox=[];
const {api:W,x}=loadServer({dev:!NODEV,send(pid,m){ try{ JSON.stringify(m); }catch(e){ bad.push('unserializable message to a client: '+e.message); } },broadcast(){}},['MONS','getH','ITEM','SKILLS','NODES','CLASSES','MON_BY_ID','PASSIVES','SS_ORDER']);
const bad=[], thrown=new Map();
const note=(where,e)=>{ const k=where+': '+String(e&&e.message).slice(0,100)+' @ '+String(e&&e.stack).split('\n').slice(1,3).map(s=>s.trim().replace(/\(.*[\\/]/,'(')).join(' < '); const n=thrown.get(k)||0; thrown.set(k,n+1); };
// words the server really knows: random junk alone dies in the first guard
const WORDS=[...Object.keys(x.ITEM||{}).slice(0,400),...Object.keys(x.SKILLS||{}),'warrior','archer','mage','fire','water','earth','air','dark','light','home','vale','hoar','grey','hanami','rimehold','highmark','mining','woodcutting','gathering','basic','skill','burst','pass','talk','pick','read','set','try','all','giveAll','level','coins','weather','storm','tunnel','vale','north','west','hoar','zt','mq','god','heal','three','storm','dg','join','invite','accept','decline','kick','leave','lead','start','gift','a','b','x','__proto__','constructor','prototype','toString','hasOwnProperty','','0','1','-1','NaN','Infinity','null','undefined'];
const NUMS=[0,1,2,3,5,10,-1,-5,0.5,1e-9,255,256,1000,1e6,2**31,2**53,1e308,-1e308,1e999,-1e999];
const junk=(d=0)=>{ const r=rnd();
  if(r<0.22) return pick(WORDS); if(r<0.40) return pick(NUMS); if(r<0.46) return null; if(r<0.50) return rnd()<0.5; if(r<0.54) return 'x'.repeat(Math.floor(rnd()*6000));
  if(r<0.62) return Math.floor(rnd()*(x.NODES?x.NODES.length+5:400)); if(r<0.68) return pick(x.MONS).id; if(r<0.72&&d<3) return [junk(d+1),junk(d+1),junk(d+1),junk(d+1),junk(d+1),junk(d+1)].slice(0,Math.floor(rnd()*7));
  if(r<0.78&&d<3){ const o={}; for(let i=0;i<Math.floor(rnd()*4);i++) o[pick(FIELDS)]=junk(d+1); return o; }
  if(r<0.80) return JSON.parse('{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}}}');
  return rnd()*400-200; };
const FIELDS=['id','slot','cls','tier','rar','n','k','tg','face','aim','idx','el','to','a','i','text','name','look','v','cmd','land','user','pass','token','p','worn','who','mission','dungeon','type','sel','m','set','piece','pid','dir','s','kind'];
const TYPES=['pos','atk','equip','unequip','cls','buy','sell','merge','accept','turnin','abandon','buyskill','chat','name','eqskill','unskill','upskill','soul','look','warp','mq','learn','gather','sellres','craft','brew','potion','zt','dev','ft','party','temper','rwdev','dg','register','logout','hello','nonsense','','__proto__'];
// the list above is for the odd names; every message type the server really handles is read from the source too (api.js `case 'x'`, feature files `MSG.x=`, in any folder under src/server), so a new message is fuzzed without anyone remembering to list it
const srvFiles=d=>require('fs').readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?srvFiles(require('path').join(d,e.name)):e.name.endsWith('.js')?[require('path').join(d,e.name)]:[]);
for(const f of srvFiles(require('path').join(__dirname,'..','src','server'))){ const src=require('fs').readFileSync(f,'utf8');
  if(/[\\/]api\.js$/.test(f)) for(const m of src.matchAll(/^\s*case '(\w+)'/gm)) if(!TYPES.includes(m[1])) TYPES.push(m[1]);
  for(const m of src.matchAll(/^MSG\.(\w+)\s*=/gm)) if(!TYPES.includes(m[1])) TYPES.push(m[1]); }
const DEVC=['level','coins','giveAll','three','weather','vale','north','west','tunnel','hoar','mq','zt','set','god','all','heal','day','tp','pass','rime','hall','nest','rw','dg','xp','items','skills','unlock'];
const msg=()=>{ const t=pick(TYPES), m={t}; const nf=Math.floor(rnd()*4); for(let i=0;i<nf;i++) m[pick(FIELDS)]=junk();
  if(t==='pos'&&rnd()<0.7) m.p=[(rnd()*2-1)*1500,rnd()*80,(rnd()*2-1)*1500,rnd()*7,rnd()*8-4,rnd()*8-4].map(v=>rnd()<0.05?junk():v);
  if(t==='dev'&&rnd()<0.7){ m.cmd=pick(DEVC); if(rnd()<0.6) m.v=junk(); }
  if(t==='atk'&&rnd()<0.7){ m.k=pick(['basic','skill','burst',junk()]); m.tg=rnd()<0.8?pick(x.MONS).id:junk(); m.face=rnd()*7; m.aim=[rnd()*2-1,0,rnd()*2-1]; }
  if(t==='equip'||t==='buy'||t==='sell'||t==='merge'){ if(rnd()<0.6) m.id=pick(WORDS); }
  return m; };
const tick=n=>{ for(let i=0;i<n;i++){ try{ W.tick(0.05); }catch(e){ note('tick()',e); } } };
const ids=[]; for(let i=0;i<NP;i++){ const id='f'+i; try{ W.join(id,{name:'Fuzz'+i,look:{cls:['warrior','archer','mage'][i%3]},save:{level:[1,30,60][i%3]}}); }catch(e){ note('join',e); } ids.push(id); }
for(const id of ids) try{ W.receive(id,{t:'dev',cmd:'giveAll'}); W.receive(id,{t:'dev',cmd:'level',v:30}); }catch(e){ note('setup',e); }
tick(5);
const check=(r)=>{
  for(const [id,p] of W.players){
    for(const k of ['x','y','z','hp','maxHp','exp','level','face']) if(typeof p[k]!=='number'||!isFinite(p[k])) bad.push(`round ${r}: player ${id}.${k} = ${p[k]}`);
    const g=p.gear; if(!g){ bad.push(`round ${r}: player ${id} has no gear`); continue; }
    if(!Number.isInteger(g.coins)||g.coins<0) bad.push(`round ${r}: coins = ${g.coins}`);
    if(!Array.isArray(g.inv)||g.inv.some(v=>typeof v!=='string')) bad.push(`round ${r}: inventory has a non-string`);
    if(p.level<1||p.level>99||!Number.isInteger(p.level)) bad.push(`round ${r}: level = ${p.level}`);
    { const L=p.look; if(!L||typeof L!=='object'||Object.keys(L).length>80||Object.entries(L).some(([k,v])=>typeof v==='object'||(typeof v==='string'&&(v.length>24||v==='constructor'||v==='__proto__'))||(typeof v==='number'&&!isFinite(v)))) bad.push(`round ${r}: player ${id}'s look is not a flat object of short primitives: ${JSON.stringify(L).slice(0,120)}`); }   // every client in sight builds an avatar from it
    if(Object.prototype.polluted||({}).polluted) bad.push('prototype pollution: Object.prototype.polluted is set');
    { const seen=new Set(); const walk=(o,path)=>{ if(!o||typeof o!=='object'||seen.has(o)) return; seen.add(o); const pr=Object.getPrototypeOf(o); if(!Array.isArray(o)&&pr!==Object.prototype&&pr!==null) bad.push(`round ${r}: gear${path} has a foreign prototype (a '__proto__' key from a save was copied)`); for(const k of Object.keys(o)) walk(o[k],path+'.'+k); }; walk(g,''); }
    try{ JSON.stringify(g); }catch(e){ bad.push(`round ${r}: gear cannot be serialized: ${e.message}`); }
  }
  for(const m of x.MONS) if(!m.remove&&(![m.x,m.z,m.hp].every(isFinite))) bad.push(`round ${r}: monster ${m.id} (${m.def&&m.def.id}) x=${m.x} z=${m.z} hp=${m.hp}`);
};
for(let r=1;r<=ROUNDS;r++){
  const pid=pick(ids); let m; try{ m=JSON.parse(JSON.stringify(msg())); }catch(e){ continue; }   // what the wire would deliver
  const before=W.players.get(pid)&&W.players.get(pid).gear&&W.players.get(pid).gear.coins;
  try{ W.receive(pid,m); }catch(e){ note('receive '+m.t,e); if(VERBOSE) console.log(JSON.stringify(m).slice(0,300)); }
  { const q=W.players.get(pid), c=q&&q.gear&&q.gear.coins; if(q&&(!Number.isInteger(c)||c<0)&&Number.isInteger(before)&&before>=0) bad.push(`round ${r}: coins went from ${before} to ${c} by ${JSON.stringify(m).slice(0,240)}`); }   // the message that broke them
  if(r%25===0){ for(const p of W.players.values()){ if(p.dead&&rnd()<0.5){ p.dead=false; p.hp=p.maxHp||100; } if(rnd()<0.3) { p.hp=p.maxHp||100; } } tick(2); }
  if(r%500===0){ check(r); if(bad.length>20) break; }
}
tick(40); check('end');
// the other untrusted input: a save in hello{} (a guest's browser copy, or a hand-edited one). Take a real, well-filled gear object and replace random parts with junk.
{ if(!W.players.size){ W.join('f0',{name:'Fuzz0',look:{cls:'warrior'},save:{level:30}}); W.receive('f0',{t:'dev',cmd:'giveAll'}); tick(2); }   // (a random hello may have ended every session: a failed login drops the old one)
  const base=JSON.parse(JSON.stringify([...W.players.values()][0].gear));
  const mutate=(o,depth)=>{ if(!o||typeof o!=='object') return;
    for(const k of Object.keys(o)){ const r=rnd();
      if(r<0.07) o[k]=junk(); else if(r<0.09) delete o[k]; else if(r<0.11&&Array.isArray(o[k])) o[k]=o[k].concat([junk(),junk()]); else if(depth<5) mutate(o[k],depth+1); }
    if(!Array.isArray(o)&&rnd()<0.15){ const k=pick(['__proto__','constructor','toString','hasOwnProperty']); Object.defineProperty(o,k,{value:rnd()<0.5?{helmet1:-1000,sword1:-5,x:1,n:-9}:-7,enumerable:true,writable:true,configurable:true}); } };   // (an own '__proto__' key, as JSON.parse makes one)
  for(let i=0;i<Math.floor(ROUNDS/20);i++){
    const g=JSON.parse(JSON.stringify(base)); for(let k=0;k<1+Math.floor(rnd()*4);k++) mutate(g,0);
    const hello=JSON.parse(JSON.stringify({t:'hello',name:rnd()<0.2?junk():'Mut'+i,look:rnd()<0.3?junk():{cls:'mage'},save:{level:rnd()<0.3?junk():1+Math.floor(rnd()*60),exp:rnd()<0.2?junk():Math.floor(rnd()*1e5),gear:g}}));
    const id='m'+(i%4);
    try{ W.receive(id,hello); }catch(e){ note('hello with a mutated save',e); continue; }
    tick(2);
    try{ for(let j=0;j<30;j++) W.receive(id,msg()); tick(3); }catch(e){ note('play after a mutated save',e); }
    check('save '+i);
  } }
let fails=0;
for(const [k,n] of [...thrown].sort((a,b)=>b[1]-a[1])){ console.log(`FAIL threw ${n}x  ${k}`); fails++; }
for(const b of [...new Set(bad)].slice(0,25)){ console.log('FAIL '+b); fails++; }
console.log(fails?`${fails} problem(s) after ${ROUNDS} messages`:`PASS ${ROUNDS} messages of ${TYPES.length} types, ${NP} players${NODEV?' (dev off)':''}`);
process.exit(fails?1:0);
