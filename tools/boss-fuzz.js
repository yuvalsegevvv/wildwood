// Chaos test of the world bosses, straight from src/ (no build): four level-60 players fight each boss while, at random, they die in one hit, run out of the arena, step back in, disconnect and
// rejoin. Then everyone leaves, eight seconds pass, and the boss must have given up and reset: not engaged, full health, phase 1, and nothing of its fight left (zones, telegraphs, walls, orbs,
// adds, totems); a boss that was killed must come back. boss-smoke fights each boss through three clean phases; this is the messy version of the same fight.
// Fails on: a throw in a handler or tick(), a non-finite number on a player or a boss, or anything left behind. Usage: node tools/boss-fuzz.js [--seed 1] [--rounds 2] [--steps 300]
const {loadServer}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; }, ROUNDS=arg('--rounds',2), STEPS=arg('--steps',300);
const {api:W,x}=loadServer({dev:true,send(){},broadcast(){}},['MONS','getH','BOSSES','S','hurtP']);
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const pick=a=>a[Math.floor(rnd()*a.length)];
const thrown=new Map(), bad=[]; const note=(w,e)=>{ const k=w+': '+String(e&&e.message).slice(0,100)+' @ '+String(e&&e.stack).split('\n').slice(1,3).map(s=>s.trim().replace(/\(.*[\\/]/,'(')).join(' < '); thrown.set(k,(thrown.get(k)||0)+1); };
const tick=n=>{ for(let i=0;i<n;i++){ try{ W.tick(0.05); }catch(e){ note('tick',e); } } };
const send=(id,m)=>{ try{ W.receive(id,m); }catch(e){ note('receive '+m.t,e); } };
for(const [bi,B] of x.BOSSES.entries()){
  const A=B.A, ids=['b0','b1','b2','b3'];
  for(let rep=0;rep<ROUNDS;rep++){
    const live=new Set();
    const join=(i)=>{ W.join(ids[i],{name:'Bf'+i,look:{cls:['warrior','archer','mage'][i%3]},save:{level:60}}); send(ids[i],{t:'dev',cmd:'giveAll'}); send(ids[i],{t:'dev',cmd:'level',v:60}); live.add(ids[i]); const a=rnd()*6.28; W.setPos(ids[i],[A.x+Math.sin(a)*(A.r*0.5),x.getH(A.x,A.z),A.z+Math.cos(a)*(A.r*0.5),0,0,0]); };
    for(let i=0;i<4;i++) join(i); tick(5);
    for(let step=0;step<STEPS;step++){
      const i=Math.floor(rnd()*4), id=ids[i], p=W.players.get(id), u=rnd();
      if(!p){ if(rnd()<0.3) join(i); tick(3); continue; }
      if(u<0.05){ W.leave(id); live.delete(id); }
      else if(u<0.12){ try{ x.hurtP(p,1e9,B.m); }catch(e){ note('hurtP',e); } }                  // killed
      else if(u<0.17){ const a=rnd()*6.28; W.setPos(id,[A.x+Math.sin(a)*(A.r+30),x.getH(A.x,A.z),A.z+Math.cos(a)*(A.r+30),0,0,0]); }   // flees out of the arena
      else if(u<0.22){ const a=rnd()*6.28; W.setPos(id,[A.x+Math.sin(a)*(rnd()*A.r*0.8),x.getH(A.x,A.z),A.z+Math.cos(a)*(rnd()*A.r*0.8),0,0,0]); }    // steps back in
      else{ const tg=B.m; send(id,{t:'atk',k:pick(['basic','skill','burst']),tg:tg.id,face:Math.atan2(tg.x-p.x,tg.z-p.z),aim:[tg.x-p.x,0,tg.z-p.z]}); }
      if(rnd()<0.1&&p&&p.dead){ p.dead=false; p.hp=p.maxHp; }
      tick(1+Math.floor(rnd()*14));
      for(const q of W.players.values()) for(const k of ['x','y','z','hp']) if(!isFinite(q[k])) bad.push(`${B.bd.def.id}: ${q.id}.${k}=${q[k]}`);
      for(const k of ['x','z','hp']) if(!isFinite(B.m[k])) bad.push(`${B.bd.def.id}: boss ${k}=${B.m[k]}`);
    }
    for(const id of [...live]) if(W.players.has(id)) W.leave(id);
    tick(20*8);   // eight seconds later it must have given up
    const m=B.m, adds=x.MONS.filter(q=>(q.temp||q.summon)&&!q.remove&&!q.dead&&Math.hypot(q.x-A.x,q.z-A.z)<A.r+60).length;
    const left=[]; if(B.engaged&&!m.dead) left.push('still engaged'); if(!m.dead&&m.hp<m.maxHp) left.push('not at full health ('+Math.round(m.hp/m.maxHp*100)+'%)'); if(!m.dead&&B.phase!==1) left.push('phase '+B.phase); if(B.zones.length) left.push(B.zones.length+' zones'); if(B.tele.length) left.push(B.tele.length+' telegraphs'); if(B.walls.length) left.push(B.walls.length+' walls'); if(B.orbs&&B.orbs.length) left.push(B.orbs.length+' orbs'); if(B.adds.length) left.push(B.adds.length+' adds'); if(B.totems.length) left.push(B.totems.length+' totems');
    if(m.dead){ for(let k=0;k<20*130&&m.dead;k++){ if(k%20===0) try{ W.tick(0.05);}catch(e){} else tick(1);} if(m.dead) left.push('never respawned'); }
    if(left.length) bad.push(`${B.bd.def.id} (round ${rep+1}): ${left.join(', ')}`);
  }
}
let fails=0; for(const [k,n] of thrown){ console.log('FAIL threw '+n+'x '+k); fails++; } for(const b of [...new Set(bad)].slice(0,20)){ console.log('FAIL '+b); fails++; }
console.log(fails?fails+' problem(s)':'PASS '+x.BOSSES.length+' bosses x '+ROUNDS+' rounds of random joins, deaths, flights and disconnects: each gave up and reset cleanly'); process.exit(fails?1:0);
