//@ Raids on the server: build and rebuild each land's stronghold, lock its tier on the first hit, wards wake the boss, spawners call reinforcements, the clear pays raid material, a clear rebuilds half an hour later
/* Agent map. Design and numbers: docs/RAIDS.md. Data: shared/raids.js (RDS, RD_LAYOUT, rdLevel, rdMatFor). Test: node tools/raids-smoke.js.
   A raid st = {R (the data), state: 'ready' | 'engaged' | 'cleared', tier, L (its level), all (every monster that belongs to it), garrison, wards, spawners, barricades, boss (the fight, B), bossLive, hit (pid -> time),
   emptyT, clearT, reinfT}. Its monsters are ordinary world monsters (MONS) carrying m.rd = st and m.dgK (the numbers at the raid's level, which monK returns before the zone tier is asked), so damage, rewards and the
   roster work as they do in a dungeon run; they never respawn (killMonsterS) and are replaced by a rebuild. The boss is made by makeBossS in the inner court and sleeps (immune, not ticked) until the wards are broken.
   Hooks (marked `// raids:`): makeMon (adoption while S.rdCtx is set), monRoster, updateMonstersS (the boss), damageMonsterS (rdHitS), killMonsterS (rdKilledS), rewardKill (no real-boss side effects),
   bossDefeatedS, initMonstersS (camps keep off the pads: arenaDist), api.js (init, tick, the join events, the sanitized save in players.js).
   Exports: initRaidsS(), rdTickS(dt), rdAdoptS(m), rdHitS(m,p), rdKilledS(m,p), rdBossDownS(m), rdEventsS(), rdSanitizeSave(g), rdMatsOf(p), RD_STATE. */
const RD_STATE=[];   // one state per raid, in RD_ORDER
let rdCtx=null;      // the raid being built or ticked: makeMon adopts what is made meanwhile (a boss's adds, a kit's spawns)
// the numbers of a raid monster at level L: the dungeon scaling, with a garrison monster's health cut to RD_MOB_HP (the boss and the destructibles keep theirs)
function rdKOf(m,L){
  const k=dgKOf(m.def,L); if(m.boss||m.def===RD_WARD_DEF||m.def===RD_SPAWNER_DEF||m.def===RD_BARRICADE_DEF) return k;
  return {lv:k.lv,hp:k.hp*RD_MOB_HP,dmg:k.dmg,xp:k.xp};
}
function rdAdoptS(m){ if(!rdCtx) return; m.rd=rdCtx; m.dgK=rdKOf(m,rdCtx.L); m.awake=true; }
// the raid bosses that exist (not in BOSSES: that list is the eight world fights; the snapshot's boss rows and a joiner's telegraphs read both)
const rdBossesS=()=>RD_STATE.map(st=>st.boss).filter(Boolean);
const rdAlive=list=>list.filter(m=>!m.dead&&!m.remove);
const rdIdx=st=>RD_STATE.indexOf(st);
function rdMatsOf(p){ const g=p.gear; if(!g.rd||typeof g.rd!=='object') g.rd={mat:{}}; if(!g.rd.mat||typeof g.rd.mat!=='object') g.rd.mat={}; return g.rd.mat; }
function rdSanitizeSave(g){
  const out={mat:{}}; if(!g||typeof g!=='object'||!g.mat||typeof g.mat!=='object') return out;
  for(const land of RD_LANDS) if(Object.prototype.hasOwnProperty.call(g.mat,land)){ const n=clampInt(g.mat[land],0,RD_MAT_MAX,0); if(n) out.mat[land]=n; }
  return out;
}
// every raid's row for a client: [index, state (0 ready, 1 engaged, 2 cleared), tier, boss slot (0 or 1), wards left, spawners left, garrison left, seconds to the rebuild, the boss is awake]
function rdRow(st){ return [rdIdx(st),st.state==='ready'?0:st.state==='engaged'?1:2,st.tier,st.bossSlot,rdAlive(st.wards).length,rdAlive(st.spawners).length,rdAlive(st.garrison).length,Math.ceil(st.clearT),st.bossLive?1:0]; }
const rdSend=st=>ev('rdst',...rdRow(st));
function rdEventsS(){ return RD_STATE.map(st=>['rdst',...rdRow(st)]); }   // for someone who joins
function rdMake(st,d,x,z,camp,opts){
  const o=opts||{}, c0=rdCtx; rdCtx=st;
  const m=makeMon(d,x,z,camp||{x,z},o.elite?RD_ELITE_S:1,!!o.temp);
  rdCtx=c0;
  if(o.elite){ m.elite=true; m.maxHp=m.hp=m.def.hp*RD_ELITE_HP; }
  ev('spawn',monRoster(m));
  return m;
}
function rdClearAll(st){
  for(const m of st.all) if(!m.remove) removeMonS(m);
  st.all=[]; st.garrison=[]; st.wards=[]; st.spawners=[]; st.barricades=[]; st.boss=null;
}
// (re)build a raid ready for the next hiker: full garrison, every structure up, a boss rolled from the land's two, level 40 until the first hit locks the tier
function rdBuildS(st){
  const R=st.R; rdClearAll(st);
  st.state='ready'; st.tier=0; st.L=rdLevel(0); st.hit=new Map(); st.emptyT=0; st.clearT=0; st.reinfT=R.spawners.map(()=>RD_REINF_T*0.5); st.bossLive=false; st.bossDead=false;
  for(const pk of R.packs) for(let i=0;i<pk.n;i++){
    const a=i/pk.n*TAU+Math.random(), rr=1.5+Math.random()*2.5, d=DEF_BY_ID[pk.kinds[i%pk.kinds.length]];
    const m=rdMake(st,d,pk.x+Math.sin(a)*rr,pk.z+Math.cos(a)*rr,{x:pk.x,z:pk.z}); st.garrison.push(m); st.all.push(m);
  }
  R.elites.forEach((e,i)=>{ const m=rdMake(st,DEF_BY_ID[R.garrison.elite],e.x,e.z,{x:e.x,z:e.z},{elite:true}); st.garrison.push(m); st.all.push(m); });
  for(const [list,defs,key] of [[R.wards,RD_WARD_DEF,'wards'],[R.spawners,RD_SPAWNER_DEF,'spawners'],[R.barricades,RD_BARRICADE_DEF,'barricades']]){
    for(const q of list){ const m=rdMake(st,defs,q.x,q.z,{x:q.x,z:q.z}); m.rdProp=key; st[key].push(m); st.all.push(m); }
  }
  st.bossSlot=Math.floor(Math.random()*R.bosses.length);
  const bd=BOSS_DEFS.find(b=>b.def.id===R.bosses[st.bossSlot]), c0=rdCtx; rdCtx=st;
  const B=makeBossS(bd,R.court); rdCtx=c0;
  B.rd=st; B.m.rd=st; B.m.dgK=dgKOf(B.m.def,st.L); B.m.immune=true; B.m.respawnT=1e9; st.boss=B; st.all.push(B.m); ev('spawn',monRoster(B.m));
  rdSend(st);
}
function initRaidsS(){ RD_STATE.length=0; for(const id of RD_ORDER){ const st={R:RDS[id],all:[],garrison:[],wards:[],spawners:[],barricades:[],boss:null,state:'ready',tier:0,L:RD_BASE_LV,bossSlot:0,bossLive:false,bossDead:false,hit:new Map(),emptyT:0,clearT:0,reinfT:[]}; RD_STATE.push(st); rdBuildS(st); } }
// the first hit on a fresh raid locks its tier to the attacker's setting for the land and re-levels what stands (one event: the clients rebuild each monster's numbers)
function rdLockS(st,p){
  st.tier=zoneTierOn(p.gear,st.R.land); st.L=rdLevel(st.tier); st.state='engaged'; st.emptyT=0;
  const ids=[]; for(const m of st.all) if(!m.remove){ m.dgK=rdKOf(m,st.L); ids.push(m.id); }
  ev('rdlv',st.L,ids); rdSend(st);
  for(const q of S.players.values()) if(Math.hypot(q.x-st.R.x,q.z-st.R.z)<RD_FOOT+40) toastTo(q.id,st.R.name+' is locked to '+(st.tier?'tier '+['','I','II','III','IV','V','VI','VII'][st.tier]+', ':'')+'level '+st.L+'.','');
}
// damageMonsterS asks before every hit on a raid monster: false = the hit does nothing (the boss sleeps while a ward stands)
function rdHitS(m,p){
  const st=m.rd; if(st.state==='cleared') return false;
  if(m.boss&&m.B&&m.B===st.boss&&!st.bossLive){ if(S.t-(p.rdWardT||-9)>3){ p.rdWardT=S.t; toastTo(p.id,'The wards still hold the court: break all three stones first.','bad'); } return false; }
  if(st.state==='ready') rdLockS(st,p);
  st.emptyT=0; st.hit.set(p.id,S.t);
  return true;
}
function rdBossWakeS(st){
  st.bossLive=true; const m=st.boss.m; m.immune=false;
  for(const q of S.players.values()) if(Math.hypot(q.x-st.R.x,q.z-st.R.z)<RD_FOOT+40) toastTo(q.id,'The wards are broken: '+st.boss.bd.short+' wakes!','bad');
  ev('roar',m.id);
}
// a raid monster died (killMonsterS): it stays dead until the rebuild, and the structures it was count towards the clear
function rdKilledS(m,p){
  const st=m.rd; m.respawnT=1e9;
  if(m.rdSp!==undefined){ st.all=st.all.filter(x=>x!==m); return; }   // a reinforcement: not part of the count
  if(!st.all.includes(m)) return;   // a boss's add: part of the fight, not of the count
  if(m.rdProp==='wards'&&!rdAlive(st.wards).length&&!st.bossLive) rdBossWakeS(st);
  rdSend(st); rdCheckClearS(st);
}
function rdBossDownS(m){
  const st=m.rd, B=st.boss; clearBossFxS(B); [...B.totems,...B.adds].forEach(x=>{ if(!x.dead) removeMonS(x); }); B.totems=[]; B.adds=[]; B.engaged=false; m.immune=false; m.respawnT=1e9;
  st.bossDead=true; rdSend(st); rdCheckClearS(st);
}
function rdCheckClearS(st){
  if(st.state==='cleared'||!st.bossDead||rdAlive(st.wards).length||rdAlive(st.spawners).length) return;
  st.state='cleared'; st.clearT=RD_RESET;
  for(const m of st.garrison) if(!m.dead&&!m.remove) removeMonS(m);   // the survivors break and flee
  const R=st.R;
  for(const [pid,t] of st.hit){ const q=S.players.get(pid); if(!q||Math.hypot(q.x-R.x,q.z-R.z)>RD_FOOT) continue;
    const tier=rdCapTier(q.gear,R.land,st.tier), got=rdMatFor(tier), mat=rdMatsOf(q);
    mat[R.land]=Math.min(RD_MAT_MAX,(mat[R.land]||0)+got); q.dirty=true;
    toastTo(q.id,R.name+' cleared: +'+got+' '+R.mat+(tier<st.tier?' (paid at your tier '+tier+')':''),'loot r3'); }
  rdSend(st);
}
// a raid boss's turn (updateMonstersS): asleep until the wards are broken, then the world boss's own fight with its kit (what the kit spawns is adopted by the raid)
function rdBossTickS(m,dt){
  const st=m.rd; if(m.dead||st.state==='cleared') return;
  if(!st.bossLive){ m.awake=anyPlayerNear(m.x,m.z,110); return; }
  const c0=rdCtx; rdCtx=st; try{ updateBossS(m,dt); } finally { rdCtx=c0; }
}
// reinforcements and the clocks, every tick
function rdTickS(dt){
  for(const st of RD_STATE){
    if(st.state==='cleared'){ st.clearT-=dt; if(st.clearT<=0) rdBuildS(st); else if(Math.ceil(st.clearT)%30===0&&st.lastSend!==Math.ceil(st.clearT)){ st.lastSend=Math.ceil(st.clearT); rdSend(st); } continue; }
    if(st.state!=='engaged') continue;
    const R=st.R; let inside=false; for(const q of S.players.values()) if(!q.dead&&Math.hypot(q.x-R.x,q.z-R.z)<RD_FOOT+10){ inside=true; break; }
    if(inside) st.emptyT=0; else { st.emptyT+=dt; if(st.emptyT>=RD_ABANDON){ rdBuildS(st); continue; } }
    if(!inside) continue;
    st.spawners.forEach((sp,i)=>{
      if(sp.dead||sp.remove) return;
      st.reinfT[i]-=dt; if(st.reinfT[i]>0) return; st.reinfT[i]=RD_REINF_T;
      if(st.all.filter(x=>x.rdSp===i&&!x.dead&&!x.remove).length>=RD_REINF_MAX) return;
      const kinds=R.garrison.reinf, d=DEF_BY_ID[kinds[Math.floor(Math.random()*kinds.length)]], a=Math.random()*TAU;
      const m=rdMake(st,d,sp.x+Math.sin(a)*3,sp.z+Math.cos(a)*3,{x:sp.x,z:sp.z},{temp:true}); m.rdSp=i; m.aggro=true; st.all.push(m);
    });
  }
}
