//@ Dungeon mission kits, the shared moves: a monster the kit drives itself (dgWalkS, dgSwingS, dgGuardS), objectives with health, channels on the cast bar, damage as a share of health, reward chests (one roll for all), where waves come from (mouths by tile distance), packs, far cells, free spots; and the run-tick hook dgFxTickS (channels, hazards)
/* agent map
   exports: dgFxTickS(run,dt) (the hook in runs.js dgRunTickS: channels, then hazards.js), dgFxOf(run) (run.fx = {chan: Map pid -> channel, hz: hazards.js state}),
            dgWalkersS(run), dgAvgHitS(run), dgObjHpS(run,hits), dgObjHitS(m), dgObjHurtS(run,ob,v) -> true when it breaks, dgObjHealS(run,ob,v), dgObjMoveS(run,ob,lx,lz),
            dgWalkS(run,m,lx,lz,dt,speed,reach) -> distance, dgSwingS(m,dt,near) -> true when a swing lands, dgGuardS(run,m,dt), dgCountS(run,roles), dgAliveS(run),
            dgChannelS(run,p,ob,secs,done), dgHurtPctS(p,share), dgChestS(run,lx,lz,n) -> objective, dgChestOpenS(run,ob,p), dgHallTileS(run), dgTileDistS(run,tile),
            dgMouthsS(run,tile,dmin,dmax), dgPacksS(run,o), dgGuardiansS(run,o), dgGuardTickS(run,dt), dgFreeNearS(run,lx,lz,r), dgFarCellS(run,lx,lz,r), dgInHallS(run,lx,lz,pad), dgPickWalkerS(run),
            DG_STONE_HITS, DG_CAPTIVE_HITS, DG_CHEST_COINS, DG_WAVE_ALIVE, DG_CHAN_CAST
   users: the mission kits (server/dungeons/kits/*.js), hazards.js (dgHurtPctS); hooks: runs.js (dgFxTickS), mobs.js (m.dgOwn: dgMonTickS leaves the monster to its kit)
   test: tools/dungeon-missions-smoke.js.   Design: docs/DUNGEONS.md sections 4 (the missions), 6 (loot for all: the chests), 7b (the run object).
   A KIT-DRIVEN MONSTER: m.dgOwn = true makes dgMonTickS (mobs.js) skip it after its death check; the kit moves it every tick with dgWalkS (the walker's own flow-field step,
   stun and knockback) and lands hits with dgSwingS (the same 0.28 s wind-up and 'mact' event as the AI). Defense's breakers, the Hunt's quarry, Escort's captive-takers and
   Sabotage's guardians (dgGuardS: fights members inside its tile, else walks back to its post) are driven this way. Set m.dgOwn = false to hand it back to the AI.
   OBJECTIVES WITH HEALTH: ob.hp / ob.max (in the units of a monster's hit at the run's level, before armour: objectives have none), ob.v = the percentage the clients see
   (a dgo event when it changes by a whole percent).
   A CHANNEL (Sabotage's 2 s, Escort's 5 s): the professions' cast bar, like the revive (runs.js): p.cast = {i: DG_CHAN_CAST, end: Infinity, ...} so updateCastsS
   (server/professions.js) only ever breaks it (walking 1.5 m off, being downed: castx [pid]); dgFxTickS finishes it and calls done(p, ob). Event cast [pid, -2, seconds,
   objective id]. One channel per player; the objective must still be in run.objs. */
const DG_STONE_HITS=80, DG_CAPTIVE_HITS=20;   // the ward stone takes 80 swings of the theme's average walker, the captive 20 (x DG_PARTY.obj by the head count at setup)
const DG_CHEST_COINS=5, DG_WAVE_ALIVE=40, DG_CHAN_CAST=-2;   // a chest: two items on the boss rarity table, the n-th at least rarity n - 1, and coinsFor(L) x 5; at most 40 of a kit's wave monsters alive at once
const dgFxOf=run=>run.fx||(run.fx={chan:new Map(),hz:null});
// the run tick's hook (runs.js, every tick after the members' check): channels, guardians and hazards while the run is on; once it has ended, open channels break and the hazards' live warnings are taken back
function dgFxTickS(run,dt){
  const F=dgFxOf(run);
  if(run.endT){ for(const [pid,ch] of F.chan){ const p=S.players.get(pid); if(p&&p.cast===ch.c){ p.cast=null; ev('castx',pid); } } F.chan.clear(); dgHazardsEndS(run); return; }
  if(!run.ready) return;
  for(const [pid,ch] of [...F.chan]){
    const p=S.players.get(pid);
    if(!p||p.cast!==ch.c||p.inst!==run.id||!run.objs.includes(ch.ob)){ if(p&&p.cast===ch.c){ p.cast=null; ev('castx',pid); } F.chan.delete(pid); continue; }
    if(S.t>=ch.at){ p.cast=null; F.chan.delete(pid); ch.done(p,ch.ob); if(run.endT) return; }
  }
  dgGuardTickS(run,dt);
  dgHazardsS(run,dt);
}
const dgWalkersS=run=>((run.theme.mobs&&run.theme.mobs.walkers)||['slime','shroom','beetle']).filter(id=>DEF_BY_ID[id]);   // (the bare test set has no roster: purge.js fights the same three)
const dgPickWalkerS=run=>{ const w=dgWalkersS(run); return w[Math.floor(Math.random()*w.length)]; };
// the hit of the theme's average walker at the run's level, before armour (defAt: the numbers every monster has at a level)
function dgAvgHitS(run){ const w=dgWalkersS(run); return w.reduce((s,id)=>s+defAt(DEF_BY_ID[id],run.L).dmg,0)/Math.max(1,w.length); }
// an objective's health: that many average hits, x DG_PARTY.obj by the head count now (a party's fights last longer, so what it guards takes longer hits)
const dgObjHpS=(run,hits)=>Math.max(1,Math.round(hits*dgAvgHitS(run)*dgParty(Math.max(1,dgPresentS(run).length)).obj));
const dgObjHitS=m=>Math.max(1,Math.round(m.T.dmg*(m.dgK?m.dgK.dmg:1)*AR(0.85,1.15)));   // one swing of m at an objective (hurtP applies K.dmg for players; an objective has no armour)
function dgObjHurtS(run,ob,v){
  ob.hp=Math.max(0,ob.hp-v); const pc=Math.ceil(100*ob.hp/ob.max);
  if(pc!==ob.v) dgObjSetS(run,ob,ob.st,pc);
  return ob.hp<=0;
}
function dgObjHealS(run,ob,v){ ob.hp=Math.min(ob.max,ob.hp+v); const pc=Math.ceil(100*ob.hp/ob.max); if(pc!==ob.v) dgObjSetS(run,ob,ob.st,pc); }
// move an objective (the Hunt's sighting, Escort's captive): its world place, and a dgo event with the new x, z
function dgObjMoveS(run,ob,lx,lz){ const W=dgWorldS(run,lx,lz); ob.x=W.x; ob.z=W.z; dgObjSetS(run,ob,ob.st,ob.v); }
/* one tick of a kit-driven monster walking to the local point (lx, lz): straight when it sees it within DG_STRAIGHT, else by the flow field; stunned it only slides with
   its knockback; slowed it walks at 0.4. Returns the distance to the point (1e9 while stunned). The step is cut to 0.1 s (a larger dt from a test must not hop a wall). */
function dgWalkS(run,m,lx,lz,dt,speed,reach){
  const st=Math.min(dt,0.1), kd=Math.exp(-7*st);
  if(m.stunT>0){ m.stunT-=dt; m.pendingHit=-1; dgMoveS(run,m,m.kbx*st,m.kbz*st); m.kbx*=kd; m.kbz*=kd; m.vx=m.vz=0; return 1e9; }
  const B=run.B, mx=m.x-run.ox, mz=m.z-run.oz, dx=lx-mx, dz=lz-mz, d=Math.hypot(dx,dz);
  let vx=0, vz=0;
  if(d>reach){
    const los=dgLos(B,mx,mz,lx,lz); let dir=los&&d<DG_STRAIGHT?[dx/d,dz/d]:dgStep(B,dgFlowToS(run,lx,lz),mx,mz);
    if(!dir&&los&&d>0) dir=[dx/d,dz/d];
    if(dir){ const s=speed*(m.slowT>0?0.4:1); vx=dir[0]*s; vz=dir[1]*s; m.faceGoal=Math.atan2(-dir[0],-dir[1]); }
    m.state='chase';
  } else { m.state='attack'; if(d>0.01) m.faceGoal=Math.atan2(-dx,-dz); }
  if(m.slowT>0) m.slowT-=dt;
  m.vx=vx; m.vz=vz; dgMoveS(run,m,(vx+m.kbx)*st,(vz+m.kbz)*st); m.kbx*=kd; m.kbz*=kd;
  m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-8*st));
  return d;
}
// the AI's swing for a kit-driven monster: while near, every T.atk seconds a wind-up of 0.28 s ('mact'), then it lands (true) if it is still near
function dgSwingS(m,dt,near){
  if(m.pendingHit>=0){ m.pendingHit-=dt; return m.pendingHit<0&&near; }
  if(!near) return false;
  m.atkT-=dt; if(m.atkT<=0&&!m.T.noAttack){ m.atkT=m.T.atk; m.pendingHit=0.28; ev('mact',m.id); }
  return false;
}
/* a guardian (the theme's big monsters: they do not fit the doors' flow field, so they keep to their room): m.dgGuard = {x, z (its post, local), tile [tx, tz]}. It fights the
   nearest living member inside its tile that it can see, and walks back to its post when there is none. */
function dgGuardS(run,m,dt){
  const G=m.dgGuard, x0=G.tile[0]*DG_TILE, z0=G.tile[1]*DG_TILE, inTile=q=>{ const lx=q.x-run.ox, lz=q.z-run.oz; return lx>=x0&&lx<x0+DG_TILE&&lz>=z0&&lz<z0+DG_TILE; };
  let p=m.tgt!=null?S.players.get(m.tgt):null;
  if(p&&(p.dead||p.inst!==run.id||!inTile(p))) p=null;
  if(!p){ let bd=1e9; for(const q of dgMembersS(run)){ const d=Math.hypot(q.x-m.x,q.z-m.z); if(d<bd&&inTile(q)&&dgLos(run.B,m.x-run.ox,m.z-run.oz,q.x-run.ox,q.z-run.oz)){ bd=d; p=q; } }
    if(p&&!m.aggro) ev('aggro',m.id); m.aggro=!!p; m.tgt=p?p.id:null; }
  const reach=m.T.rad+(m.model==='treant'?1.6:1.1);
  if(p){ const d=dgWalkS(run,m,p.x-run.ox,p.z-run.oz,dt,m.T.speed,reach); if(dgSwingS(m,dt,d<=reach+0.8)) hurtP(p,Math.max(1,Math.round(m.T.dmg*AR(0.85,1.15))),m); }
  else { m.pendingHit=-1; if(dgWalkS(run,m,G.x,G.z,dt,m.T.speed,0.8)<=0.8) m.state='idle'; }
}
function dgGuardTickS(run,dt){ for(const m of run.mons) if(m.dgGuard&&m.dgOwn&&!m.dead&&!m.remove) dgGuardS(run,m,dt); }   // every guardian of the run, once a tick (dgFxTickS)
const dgCountS=(run,roles)=>{ let n=0; for(const m of run.mons) if(!m.dead&&!m.remove&&roles.includes(m.dgRole)) n++; return n; };
const dgAliveS=run=>{ let n=0; for(const m of run.mons) if(!m.dead&&!m.remove&&!m.boss) n++; return n; };
// start a channel on objective ob for p (dg{a:'use'} has checked the reach): done(p, ob) when it completes; false if p is busy
function dgChannelS(run,p,ob,secs,done){
  if(p.cast||p.dead) return false;
  const c={i:DG_CHAN_CAST,end:Infinity,x:p.x,z:p.z,ob:ob.id};
  p.cast=c; dgFxOf(run).chan.set(p.id,{c,ob,at:S.t+secs,done});
  ev('cast',p.id,DG_CHAN_CAST,secs,ob.id); return true;
}
/* damage as a share of max health, armour and passives not applied (the place itself, not a monster: no level, no zone tier): Survival's dark (4% a second) and the hazards.
   The rest is hurtP's: the hurt event, and at 0 the down (a run's down-and-revive takes it from there). */
function dgHurtPctS(p,share){
  if(p.dead) return;
  const v=Math.max(1,Math.round(p.maxHp*share));
  p.hp-=v; p.lastHit=S.t; ev('hurt',p.id,v);
  if(p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.act=null; ev('down',p.id); for(const mm of MONS) if(mm.tgt===p.id){ mm.aggro=false; mm.tgt=null; mm.state='return'; mm.pendingHit=-1; } }
}
/* REWARD CHESTS (Defense's rotation ends, Survival's marks; docs/DUNGEONS.md section 6): an objective 'chest' (v = its number n) that any living member opens with dg{a:'use'};
   rolled ONCE when opened and the same handed to every member present (alive, downed or out), like rewardAllS: two items of the run's gear tier on the boss rarity table
   (rollBossRarity), each at least rarity n - 1 (rising with each chest) and never nothing, plus coinsFor(L) x DG_CHEST_COINS. A full bag loses the item (addItemP says so). */
function dgChestS(run,lx,lz,n){ const at=dgFreeNearS(run,lx,lz,1); toastTo(null,'A reward chest appears in the round hall.','good'); return dgObjS(run,'chest',at.x,at.z,{r:1.5,v:n}); }
function dgChestOpenS(run,ob,p){
  if(ob.kind!=='chest'||ob.st!==1) return null;
  const n=ob.v|0, items=[], coins=coinsFor(run.L)*DG_CHEST_COINS;
  for(let i=0;i<2;i++) items.push(randomItem(tierFor(run.L),Math.min(4,Math.max(0,n-1,rollBossRarity()))));
  dgObjSetS(run,ob,2,n);
  for(const q of dgPresentS(run)){
    const mb=dgMemberOf(run,q);
    for(const id of items){ const had=q.gear.inv.length; addItemP(q,id,false,null); if(mb&&q.gear.inv.length>had) mb.got.items.push(id); }
    q.gear.coins+=coins; ev('coins',q.id,coins,null); if(mb) mb.got.coins+=coins; q.dirty=true;
  }
  toastTo(null,p.name+' opened the chest: the same for everyone.','good');
  return items;
}
// the boss hall's tile, and every tile's distance from a tile through the doors (layout cells, door masks): key 'x,z' -> steps
const dgHallTileS=run=>{ const b=run.B.marks.B.find(m=>m.role==='boss'); return b?b.tile:run.B.layout.start; };
function dgTileDistS(run,tile){
  const L=run.B.layout, at=new Map(L.cells.map(c=>[c.x+','+c.z,c])), d=new Map([[tile[0]+','+tile[1],0]]), q=[tile];
  for(let i=0;i<q.length;i++){ const [x,z]=q[i], c=at.get(x+','+z); if(!c) continue;
    for(const [b,dx,dz] of DG_STEP){ const k=(x+dx)+','+(z+dz); if((c.mask&b)&&at.has(k)&&!d.has(k)){ d.set(k,d.get(x+','+z)+1); q.push([x+dx,z+dz]); } } }
  return d;
}
/* where waves come from: the monster mouths (S marks) of the tiles dmin..dmax doors away from `tile`, never in the entrance or the boss hall; if there are none that far,
   the nearest ones there are (a small layout); at least one mouth always (the entrance's spot as a last resort) */
function dgMouthsS(run,tile,dmin,dmax){
  const d=dgTileDistS(run,tile), cand=run.B.marks.S.filter(s=>s.role!=='start'&&s.role!=='boss').map(s=>({s,d:d.has(s.tile[0]+','+s.tile[1])?d.get(s.tile[0]+','+s.tile[1]):99}));
  let out=cand.filter(c=>c.d>=dmin&&c.d<=dmax);
  if(!out.length&&cand.length){ const near=cand.filter(c=>c.d>=Math.max(1,dmin)).sort((a,b)=>Math.abs(a.d-dmax)-Math.abs(b.d-dmax)); const best=near.length?near[0].d:cand[0].d; out=cand.filter(c=>c.d===best); }
  return out.length?out.map(c=>c.s):[{x:run.B.start.x,z:run.B.start.z,tile:run.B.layout.start,role:'start'}];
}
// light packs in the rooms (the missions that are not about waves): at each mouth outside the entrance, the boss hall and the tiles in o.skip, with chance o.p, o.min..o.max walkers
function dgPacksS(run,o){
  const rng=mulberry32((run.seed|0)^(o.salt|0)), skip=o.skip||[], walk=dgWalkersS(run); let n=0;
  if(walk.length) for(const s of run.B.marks.S){
    if(s.role==='start'||s.role==='boss'||skip.some(t=>t[0]===s.tile[0]&&t[1]===s.tile[1])||rng()>=o.p) continue;
    const k=o.min+Math.floor(rng()*(o.max-o.min+1));
    for(let i=0;i<k;i++){ const a=rng()*TAU, r=1+rng()*2.5; if(dgSpawnS(run,walk[Math.floor(rng()*walk.length)],s.x+Math.sin(a)*r,s.z+Math.cos(a)*r,{role:o.role||'roam'})) n++; }
  }
  return n;
}
/* the theme's guardians at its guardian posts (legend cells with post 'guardian', listed in B.props): the first guardian at a post in a site tile (o.sites), the last at a post
   in a room tile (o.rooms): the Ancient Treant in the Heartwood Knot, the Rotwood in the Fungus Alcove, the Bamboo Treant in the Bamboo Cellar. Each keeps to its tile
   (m.dgOwn, m.dgGuard: dgGuardS). The barrow has none. Returns the guardians made. */
function dgGuardiansS(run,o){
  const T=run.theme, gs=((T.mobs&&T.mobs.guardians)||[]).filter(id=>DEF_BY_ID[id]), out=[]; if(!gs.length) return out;
  const posts=new Set(Object.values(run.B.legend||{}).filter(e=>e&&e.post==='guardian').map(e=>e.prop)), cells=new Map(run.B.layout.cells.map(c=>[c.x+','+c.z,c]));
  for(const pr of run.B.props){
    if(!posts.has(pr.k)) continue;
    const tile=[Math.floor(pr.x/DG_TILE),Math.floor(pr.z/DG_TILE)], c=cells.get(tile[0]+','+tile[1]), site=!!c&&c.role==='site';
    if(!c||(site?!o.sites:c.role!=='room'||!o.rooms)) continue;
    const m=dgSpawnS(run,site?gs[0]:gs[gs.length-1],pr.x,pr.z,{role:o.role||'guard'}); if(!m) continue;
    m.dgOwn=true; m.dgGuard={x:m.x-run.ox,z:m.z-run.oz,tile}; out.push(m);
  }
  return out;
}
// the free spot nearest (lx, lz) for something of radius r (cell centres, out to 8 cells), else the point itself
function dgFreeNearS(run,lx,lz,r){
  const B=run.B; if(dgFree(B,lx,lz,r)) return {x:lx,z:lz};
  let best=null, bd=1e9; const cx=Math.floor(lx/DG_CELL), cz=Math.floor(lz/DG_CELL);
  for(let dz=-8;dz<=8;dz++) for(let dx=-8;dx<=8;dx++){ const x=(cx+dx+0.5)*DG_CELL, z=(cz+dz+0.5)*DG_CELL, d=Math.hypot(x-lx,z-lz); if(d<bd&&dgFree(B,x,z,r)){ bd=d; best={x,z}; } }
  return best||{x:lx,z:lz};
}
const dgInHallS=(run,lx,lz,pad)=>!!run.B.boss&&Math.hypot(lx-run.B.boss.x,lz-run.B.boss.z)<run.B.boss.r+(pad||0);
// the far side of the map from (lx, lz): the free cell (radius r) the most steps away by the flow field, outside the boss hall and the entrance tile
function dgFarCellS(run,lx,lz,r){
  const B=run.B, f=dgFlowToS(run,lx,lz), st=B.layout.start; let best=null, bv=-1;
  for(let i=0;i<f.length;i++){
    const v=f[i]; if(v===65535||v<=bv) continue;
    const x=(i%B.w+0.5)*DG_CELL, z=(Math.floor(i/B.w)+0.5)*DG_CELL;
    if(Math.floor(x/DG_TILE)===st[0]&&Math.floor(z/DG_TILE)===st[1]) continue;
    if(dgInHallS(run,x,z,2)||!dgFree(B,x,z,r)) continue;
    bv=v; best={x,z,d:v};
  }
  return best;
}
