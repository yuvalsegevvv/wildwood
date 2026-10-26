//@ Stateful soak of the world server straight from src/: a dozen hikers of level 20-59 fight, die, drink, warp and jump about the lands (bosses included) for minutes; nothing may throw, nothing may go non-finite, the heap may not grow
// Usage: node tools/world-soak.js [--players 12] [--secs 90] [--seed 1]      (about 10 s for the default; --secs 600 --players 16 is the long run)
// Every tick pair each hiker walks at the nearest monster and attacks it (basic / skill / burst), sometimes drinks, heals, warps to a village or jumps to another zone; every 20 ticks the invariants are read:
// positions, hp, level and exp finite, hp within 0..maxHp, coins whole and >= 0, nobody outside the world, every monster's position and hp finite and within its max; a throw in a tick fails the run, and so does
// a heap that grew by 40 MB after the first minute (a leak: events, maps, timers kept for ever). The same hiker-driving as tools/server-bench.js, with checks instead of timings. Test: this file (tools/tests.json).
const {loadServer}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; };
const N=arg('--players',12), SECS=arg('--secs',90);
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
let GC=global.gc; if(!GC){ try{ require('v8').setFlagsFromString('--expose-gc'); GC=require('vm').runInNewContext('gc'); }catch(e){} }   // (a collection before each heap reading, with or without node --expose-gc)
const evCount={}; let snaps=0;
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(m.t==='snap'){ snaps++; for(const e of m.ev||[]) evCount[e[0]]=(evCount[e[0]]||0)+1; } JSON.stringify(m); },broadcast(m){ JSON.stringify(m); }},['MONS','getH']);
const spots=x.MONS.filter(m=>!m.prop&&!(m.def&&m.def.prop));
const bosses=x.MONS.filter(m=>m.boss);
const ids=[]; const bad=[]; const note=s=>{ if(bad.length<15) bad.push(s); };
for(let i=0;i<N;i++){
  const id='s'+i; W.join(id,{name:'Soak'+i,look:{cls:['warrior','archer','mage'][i%3]},save:{level:20+Math.floor(rnd()*40)}});
  W.receive(id,{t:'dev',cmd:'giveAll'}); W.receive(id,{t:'dev',cmd:'skills'});
  const m=(i%3===0&&bosses.length)?bosses[Math.floor(rnd()*bosses.length)]:spots[Math.floor(rnd()*spots.length)];
  W.setPos(id,[m.x+3,x.getH(m.x+3,m.z),m.z,0,0,0]); ids.push(id);
}
for(let i=0;i<20;i++) W.tick(0.05);
const dt=0.05, ticks=Math.round(SECS/dt); let thrown=0;
const fin=v=>typeof v==='number'&&isFinite(v);
let heapMid=0; const heap=()=>{ if(GC) GC(); return process.memoryUsage().heapUsed; };   // (the heap is read after the first third of the run, when the world has warmed up)
for(let k=0;k<ticks;k++){
  if(k===Math.floor(ticks/3)) heapMid=heap();
  for(const id of ids){
    const p=W.players.get(id); if(!p) continue;
    if(k%2===0&&!p.dead){
      let best=null,bd=900; for(const m of W.monsters){ if(m.dead||m.remove) continue; const d=(m.x-p.x)**2+(m.z-p.z)**2; if(d<bd){ bd=d; best=m; } }
      let a=p.face+(rnd()-0.5)*0.6; if(best&&bd>16) a=Math.atan2(best.x-p.x,best.z-p.z)+(rnd()-0.5)*0.3; const v=5;
      if(rnd()<0.004){ const m=spots[Math.floor(rnd()*spots.length)]; W.setPos(id,[m.x+2,x.getH(m.x+2,m.z),m.z,a,0,0]); }
      else{ const nx=p.x+Math.sin(a)*v*0.1, nz=p.z+Math.cos(a)*v*0.1; W.setPos(id,[nx,x.getH(nx,nz),nz,a,Math.sin(a)*v,Math.cos(a)*v]); }
    }
    if(k%4===0&&!p.dead){
      let best=null,bd=225; for(const m of W.monsters){ if(m.dead||m.remove||!m.awake) continue; const d=(m.x-p.x)**2+(m.z-p.z)**2; if(d<bd){ bd=d; best=m; } }
      if(best) W.receive(id,{t:'atk',k:['basic','basic','skill','burst'][Math.floor(rnd()*4)],tg:best.id,face:Math.atan2(best.x-p.x,best.z-p.z),aim:[best.x-p.x,0,best.z-p.z]});
    }
    if(rnd()<0.01) W.receive(id,{t:'potion',k:['hp','might','guard'][Math.floor(rnd()*3)]});
    if(rnd()<0.002) W.receive(id,{t:'dev',cmd:'heal'});
    if(rnd()<0.001){ W.receive(id,{t:'warp',to:['village','vil2','vil3','vil4','vil5','vil6','vil7'][Math.floor(rnd()*7)]}); }
  }
  try{ W.tick(dt); }catch(e){ thrown++; note('tick '+k+' threw '+(e&&e.stack||e).toString().split('\n').slice(0,3).join(' | ')); if(thrown>5) break; }
  if(k%20===0){
    for(const [id,p] of W.players){
      if(![p.x,p.y,p.z,p.hp,p.maxHp,p.level,p.exp].every(fin)) note('tick '+k+' '+id+' non-finite state '+JSON.stringify([p.x,p.y,p.z,p.hp,p.maxHp,p.level,p.exp]));
      if(p.hp>p.maxHp+1e-6||p.hp<0) note('tick '+k+' '+id+' hp '+p.hp+'/'+p.maxHp);
      if(!Number.isInteger(p.gear.coins)||p.gear.coins<0) note('tick '+k+' coins '+p.gear.coins);
      if(Math.abs(p.x)>4000||Math.abs(p.z)>4000) note('tick '+k+' '+id+' out of the world '+p.x+','+p.z);
    }
    for(const m of W.monsters){ if(![m.x,m.z,m.hp].every(fin)) note('tick '+k+' monster '+m.id+' '+JSON.stringify([m.x,m.z,m.hp])); else if(m.hp>(m.maxHp||1e12)+1e-6) note('tick '+k+' monster '+m.id+' hp>max '+m.hp+'/'+m.maxHp); }
  }
}
const growth=(heap()-heapMid)/1048576;
if(!(evCount.dmg>100&&evCount.kill>0)) note('the hikers hardly fought ('+(evCount.dmg|0)+' hits, '+(evCount.kill|0)+' kills): the soak proves nothing');
if(GC&&growth>40) note('the heap grew by '+growth.toFixed(0)+' MB in the last two thirds of the run');
if(bad.length){ console.log('FAIL world soak:\n  '+bad.join('\n  ')); process.exit(1); }
console.log('PASS '+N+' hikers, '+SECS+' s of play ('+ticks+' ticks, '+snaps+' snapshots'+(GC?', heap '+(growth>=0?'+':'')+growth.toFixed(1)+' MB':'')+'): no throw, nothing non-finite, hp and coins in range');
