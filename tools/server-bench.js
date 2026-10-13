// Server load benchmark: N players spread over the world, walking and fighting, ticked at 20 Hz without a clock. Prints the milliseconds a tick takes
// (mean / p95 / max, all ticks and the snapshot ticks alone) and the bytes a snapshot weighs, so a change to the simulation or to what a client is sent can be
// measured. Not a pass / fail test (the numbers depend on the machine); `--check MS` exits 1 when the mean tick is above MS (a loose guard).
// Usage: node tools/server-bench.js [--players 40] [--secs 60] [--fight 0.5] [--seed 1] [--check 8]
//        node --cpu-prof --cpu-prof-dir=out tools/server-bench.js ...   (then summarise the .cpuprofile: see docs/TESTING.md, "Profiling the server")
const {loadServer}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; };
const N=arg('--players',40), SECS=arg('--secs',60), FIGHT=arg('--fight',0.5), CHECK=arg('--check',0);
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
let bytes=0, snaps=0, maxBytes=0;
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(m.t==='snap'){ const n=JSON.stringify(m).length; bytes+=n; snaps++; if(n>maxBytes) maxBytes=n; } else JSON.stringify(m); },broadcast(m){ JSON.stringify(m); }},['MONS','getH']);
const ids=[]; const spots=x.MONS.filter(m=>!m.boss&&m.def&&!m.def.prop);
for(let i=0;i<N;i++){
  const id='b'+i, m=spots[Math.floor(rnd()*spots.length)];
  W.join(id,{name:'Bench'+i,look:{cls:['warrior','archer','mage'][i%3]},save:{level:30}});
  W.receive(id,{t:'dev',cmd:'giveAll'});   // no-ops when the dev switch is off in a real server; this harness runs with dev on
  W.setPos(id,[m.x+2,x.getH(m.x+2,m.z),m.z,0,0,0]); ids.push(id);
}
for(let i=0;i<20;i++) W.tick(0.05);
const dt=0.05, ticks=Math.round(SECS/dt), all=[], snapT=[];
let tt=0;
for(let k=0;k<ticks;k++){
  for(const id of ids){
    const p=W.players.get(id); if(!p) continue; p.hp=p.maxHp; p.dead=false;
    if(k%2===0){   // the client sends its position 10 times a second
      const a=p.face+(rnd()-0.5)*0.4, v=4.5;
      if(rnd()<0.01){ const m=spots[Math.floor(rnd()*spots.length)]; W.setPos(id,[m.x+2,x.getH(m.x+2,m.z),m.z,a,0,0]); }
      else{ const nx=p.x+Math.sin(a)*v*0.1, nz=p.z+Math.cos(a)*v*0.1; W.setPos(id,[nx,x.getH(nx,nz),nz,a,Math.sin(a)*v,Math.cos(a)*v]); }
    }
    if(k%5===0&&rnd()<FIGHT){   // attack the nearest awake monster within 12 m
      let best=null,bd=144; for(const m of W.monsters){ if(m.dead||m.remove||!m.awake) continue; const d=(m.x-p.x)**2+(m.z-p.z)**2; if(d<bd){ bd=d; best=m; } }
      if(best) W.receive(id,{t:'atk',k:['basic','skill','burst'][Math.floor(rnd()*3)],tg:best.id,face:Math.atan2(best.x-p.x,best.z-p.z),aim:[best.x-p.x,0,best.z-p.z]});
    }
  }
  const s0=process.hrtime.bigint(), b0=snaps; W.tick(dt); const ms=Number(process.hrtime.bigint()-s0)/1e6;
  all.push(ms); if(snaps!==b0) snapT.push(ms); tt+=ms;
}
const stat=a=>{ if(!a.length) return {mean:0,p95:0,max:0}; const s=[...a].sort((p,q)=>p-q); return {mean:a.reduce((p,q)=>p+q,0)/a.length,p95:s[Math.floor(s.length*0.95)],max:s[s.length-1]}; };   // (no players: no snapshot is sent, so there are no snapshot ticks to measure)
const A=stat(all), B=stat(snapT), f=v=>v.toFixed(2);
console.log(`${N} players, ${SECS} s of play, ${x.MONS.length} monsters (${x.MONS.filter(m=>m.awake&&!m.dead).length} awake at the end)`);
console.log(`tick, all:       mean ${f(A.mean)} ms   p95 ${f(A.p95)}   max ${f(A.max)}   (${(A.mean/50*100).toFixed(1)}% of a core at 20 Hz)`);
console.log(`tick, snapshot:  mean ${f(B.mean)} ms   p95 ${f(B.p95)}   max ${f(B.max)}   (${snapT.length} of ${ticks} ticks)`);
console.log(`snapshot size:   mean ${snaps?Math.round(bytes/snaps):0} bytes   max ${maxBytes}   per client ${N?(bytes/SECS/N/1024).toFixed(1):0} KB/s`);
if(CHECK&&A.mean>CHECK){ console.log('FAIL mean tick above '+CHECK+' ms'); process.exit(1); }
