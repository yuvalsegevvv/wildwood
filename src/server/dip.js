//@ Dark Infection Pipes on the server: upgrading a pipe with the zone's materials, releasing dark energy (coins, 10 minutes), the refill ticks that spawn the zone's monsters, the active list sent to hikers
/* Agent map (docs/DIP.md; the numbers: shared/dip.js). State: gear.dip {site id: level 0-5} (saved, dipSanitize); DIP_ACT: Map site id -> {by: player id, L: level, until, next, mons: [monsters]} (not saved: a restart ends it).
   Messages in: dip{a:'open'|'up'|'go', id, lv?: the level to release at, up to your own} (within DIP_REACH of the pipe); out: {t:'dip',a:'info',id,lv,max,cost,count,every,needs:[[mat id,n]],act:seconds left} and {t:'dipa',a:[[id,seconds left]]} (every active pipe, every 3 s while any is
   active, once empty). The monsters are temporary ones (spawnMonS, temp) tagged m.dip; a kill pays as anywhere (rewardKill drops DIP_MAT_K of the usual materials); the forest's kinds below level 10 carry dgKOf(def,10).
   hooks marked `// dip:`: sanitizeGear (players.js), the player loop (dipTickP), the tick (dipTickS), rewardKill (combat.js: fewer materials). Test: tools/dip-smoke.js */
const DIP_ACT=new Map();
function dipSanitize(g,out){
  out.dip={}; const src=g&&g.dip&&typeof g.dip==='object'&&!Array.isArray(g.dip)?g.dip:{};
  for(const Z of DIP_SITES) if(Object.prototype.hasOwnProperty.call(src,Z.id)) out.dip[Z.id]=clampInt(src[Z.id],0,DIP_MAX,0);
}
const dipLevelOf=(p,Z)=>io.test?DIP_MAX:p.gear.dip[Z.id]|0;   // testworld: every pipe is maxed
const dipSecsLeft=st=>Math.max(0,Math.ceil(st.until-S.t));
function dipInfoP(p,Z){
  const L=dipLevelOf(p,Z), st=DIP_ACT.get(Z.id), up=L<DIP_MAX?dipUpNeeds(Z,L+1):null;
  const costs=[]; for(let i=0;i<=L;i++) costs.push(dipCost(Z,i));
  sendTo(p.id,{t:'dip',a:'info',id:Z.id,lv:L,max:DIP_MAX,cost:dipCost(Z,L),costs,count:DIP_COUNT[L],every:DIP_INTERVAL[L],kinds:Z.kinds,
    needs:up?up.map(x=>[x.id,x.n]):null,act:st?dipSecsLeft(st):0,next:L<DIP_MAX?{count:DIP_COUNT[L+1],every:DIP_INTERVAL[L+1]}:null});
}
function dipUpP(p,Z){
  const L=dipLevelOf(p,Z); if(L>=DIP_MAX) return;
  const need=dipUpNeeds(Z,L+1);
  if(!need.every(x=>(p.gear.mats[x.id]||0)>=x.n)){ toastTo(p.id,'You need more of this zone\'s materials','bad'); return; }
  for(const x of need){ p.gear.mats[x.id]-=x.n; if(p.gear.mats[x.id]<=0) delete p.gear.mats[x.id]; }
  p.gear.dip[Z.id]=L+1; p.dirty=true; toastTo(p.id,'The pipe is now level '+(L+1),'loot r3');
}
function dipGoP(p,Z,pick){
  if(DIP_ACT.has(Z.id)){ toastTo(p.id,'The pipe is already releasing dark energy','bad'); return; }
  const L=Math.min(dipLevelOf(p,Z),clampInt(pick,0,DIP_MAX,DIP_MAX)), cost=dipCost(Z,L);   // you may release at any level up to your own (a lower one is cheaper)
  if(p.gear.coins<cost){ toastTo(p.id,'Releasing dark energy costs '+cost.toLocaleString('en-US')+' coins','bad'); return; }
  p.gear.coins-=cost; p.dirty=true;
  DIP_ACT.set(Z.id,{S:Z,by:p.id,L,until:S.t+DIP_SECS,next:S.t,mons:[]});
  toastTo(p.id,'Dark energy released! It lasts '+DIP_SECS/60+' minutes','loot r3');
}
function dipMsgP(p,msg){
  if(p.dead||p.pv||p.inst||p.dg) return;
  const S0=DIP_BY_ID[String(msg.id)]; if(!S0||!Object.prototype.hasOwnProperty.call(DIP_BY_ID,String(msg.id))) return;
  if(Math.hypot(p.x-S0.x,p.z-S0.z)>DIP_REACH+DIP_SIDE/2){ toastTo(p.id,'Step closer to the pipe','bad'); return; }
  const a=msg.a;
  if(a==='up') dipUpP(p,S0); else if(a==='go') dipGoP(p,S0,msg.lv);
  else if(a!=='open') return;
  dipInfoP(p,S0);
}
MSG.dip=dipMsgP;
function dipSpawnS(st){
  const S0=st.S, kinds=S0.defs, alive=st.mons.filter(m=>!m.dead&&!m.remove);
  st.mons=alive; const need=DIP_COUNT[st.L]-alive.length, camp={x:S0.x,z:S0.z};
  for(let i=0;i<need;i++){
    const d=kinds[Math.floor(Math.random()*kinds.length)], x=S0.x+AR(-1,1)*DIP_SIDE/2, z=S0.z+AR(-1,1)*DIP_SIDE/2;
    const m=spawnMonS(d,x,z,camp,true); m.dip=st; m.awake=true;
    if(S0.land==='home'&&d.level<DIP_HOME_MIN_LV) m.dgK=dgKOf(d,DIP_HOME_MIN_LV);   // the forest's low kinds fight at level 10 here
    st.mons.push(m);
  }
}
function dipTickS(dt){
  for(const [id,st] of DIP_ACT){
    if(S.t>=st.until){ for(const m of st.mons) if(!m.dead&&!m.remove) removeMonS(m); DIP_ACT.delete(id); continue; }
    if(S.t>=st.next){ st.next=S.t+DIP_INTERVAL[st.L]; dipSpawnS(st); }
  }
}
function dipTickP(p){
  if(S.t-(p.dipT||0)<3) return; p.dipT=S.t;
  if(!DIP_ACT.size){ if(p.dipHad){ p.dipHad=false; sendTo(p.id,{t:'dipa',a:[]}); } return; }
  p.dipHad=true; const a=[]; for(const [id,st] of DIP_ACT) a.push([id,dipSecsLeft(st)]); sendTo(p.id,{t:'dipa',a});
}
