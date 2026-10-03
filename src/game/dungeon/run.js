//@ A dungeon run on the client: its state (DG_RUN), entering and leaving it on the server's tp (the tp hook), the run's events (dgo, dgb, dgr, dge) and snapshot field (dg), and the run's frame (dgFrame)
/* agent map
   exports: DG_RUN (null in the world; in a run: {id, m mission, th, T theme entry, seed, L level, tier, ox, oz (the bake's corner in the world), y (the floor), B (dgBake) or null, lay,
              dg (the last snapshot tuple), t0 (the frame clock t when the run's clock was 0), objs: Map id -> {id, kind, x, z, st, v, view, lbl} (world x, z), boss: {id, x, z, r, def} | null,
              respawns (counted here: the server does not send it), seen (Uint8Array gw*gh: tiles walked into), downAt, away}),
            dgIn() (any file may call it, at any time: DG_RUN is a var), dgMonK(def, level) (combat/monsters.js addMonView: a run monster's m.dgK), dgOnTp(msg) (the tp hook, net/client.js), dgRunEnter(d) / dgRunLeave(), dgFrame(dt) (main/loop.js), dgRunClock()
   users: every hook marked "// dungeons:" in the client asks dgIn(); view.js, look.js, collide.js, hud.js, minimap.js, party.js read DG_RUN
   events: EVH.dgo / dgb / dgr / dge and SNAPH.dg are filled here (this file loads after net/client.js: src/manifest.json); dgi is the Delve board's (dungeon/board.js), pty / ptyi party.js's
   test: tools/client-smoke.js (the dungeon case at its end), tools/dungeon-client-smoke.js
   Protocol: docs/DUNGEONS.md section 9. tp{x,z,face,dg:{id,m,seed,th,L,tier,ox,oz,y,ph,t,boss}} builds dgBake(dgLayout({mission:m,seed,theme:th})) with its corner at (ox, oz); tp{dg:false}
   tears it down; a tp without dg while in a run is a respawn at the entrance (one of the run's respawns, when it comes while you are down). */
var DG_RUN=null;   // (a var: hooks in files loaded earlier may ask before this line has run)
const DG_RESPAWNS_SHOW=2, DG_DOWN_SHOW=30, DG_END_SHOW=20;   // the server's DG_RESPAWNS, DG_DOWN_S, DG_END_S (server/dungeons/runs.js): shown, not enforced
function dgIn(){ return !!DG_RUN; }
const DG_MON_K=new Map();
// a run monster's numbers at the run's level against its def's own (the server's dgKOf, server/dungeons/mobs.js; the monster's view keeps it as m.dgK: the target frame, the boss bar, monTierK)
function dgMonK(d,L){ const key=d.id+'@'+L; let k=DG_MON_K.get(key); if(k) return k; const a=defAt(d,L), b=defAt(d,d.level); k={lv:L,hp:a.hp/b.hp,dmg:a.dmg/b.dmg,xp:b.xp?a.xp/b.xp:1}; DG_MON_K.set(key,k); return k; }
const dgRunClock=()=>DG_RUN?Math.max(0,t-DG_RUN.t0):0;   // seconds since the run was set up (eased to the snapshot's count)
// the tp hook: build, tear down, or count a respawn. Never throws (a failed build must not stop the tp moving you)
function dgOnTp(msg){
  try{
    const d=msg&&msg.dg;
    if(d&&typeof d==='object'){ if(DG_RUN&&DG_RUN.id===d.id) return; if(DG_RUN) dgRunLeave(); dgRunEnter(d); }
    else if(d===false){ if(DG_RUN) dgRunLeave(); }
    else if(DG_RUN&&PL.dead){ DG_RUN.respawns=Math.max(0,DG_RUN.respawns-1); DG_RUN.downAt=0; }
  }catch(err){ console.error('dungeon view:',err); }
}
function dgRunEnter(d){
  const T=DG_THEMES[d.th]||null; let lay=null, B=null;
  try{ lay=dgLayout({mission:d.m,seed:d.seed|0,theme:d.th}); B=lay&&dgBake(lay); }catch(err){ console.error('dungeon layout:',err); }
  if(!B) console.warn('dungeon '+d.th+':'+d.m+' seed '+d.seed+' could not be rebuilt here: walls are the server\'s only');
  DG_RUN={id:d.id,m:d.m,th:d.th,T,seed:d.seed|0,L:d.L|0,tier:d.tier|0,ox:+d.ox||0,oz:+d.oz||0,y:isFinite(d.y)?+d.y:DG_FLOOR_Y,B,lay,
    dg:[d.ph|0,d.t|0,0],t0:t-(d.t|0),objs:new Map(),boss:null,respawns:DG_RESPAWNS_SHOW,seen:new Uint8Array(lay?lay.gw*lay.gh:1),downAt:0,away:0,end:null};
  CB.target=null; hideCast(); PANELS.forEach(p=>{ $('#'+p).hidden=true; });
  for(const step of [dgViewBuild,dgLookEnter,dgHudEnter,dgMiniEnter]) try{ step(DG_RUN); }catch(err){ console.error('dungeon view:',err); }
}
function dgRunLeave(){
  for(const step of [dgHudLeave,dgViewClear,dgLookLeave,dgMiniLeave]) try{ step(); }catch(err){ console.error('dungeon view:',err); }
  DG_RUN=null;
}
// objectives: dgo [id, kind, x, z, st 0 removed | 1 active | 2 done, v] (world x, z)
EVH.dgo=e=>{
  const R=DG_RUN; if(!R) return;
  const id=e[1]; let o=R.objs.get(id);
  if(!e[5]){ if(o){ dgObjView(o,true); dgObjLabel(o,true); R.objs.delete(id); } return; }
  if(!o){ o={id,kind:String(e[2]),x:+e[3],z:+e[4],st:1,v:0,view:null,lbl:null}; R.objs.set(id,o); }
  o.x=+e[3]; o.z=+e[4]; o.st=e[5]|0; o.v=+e[6]||0; dgObjView(o,false); dgObjLabel(o,false);
};
// the boss appeared: dgb [boss monster id, x, z, r, def id] (the hall's circle, world coordinates)
EVH.dgb=e=>{
  const R=DG_RUN; if(!R) return; const fresh=!R.boss;
  R.boss={id:e[1],x:+e[2],z:+e[3],r:+e[4]||DG_BOSS_R,def:e[5]};
  if(fresh&&R.dg[0]===0){ const d=DEF_BY_ID[e[5]]; toast((d?d.name:'The boss')+' has appeared in the round hall!','bad'); bossRoar(e[1]); }
};
// a revive: dgr [reviver, revived]
EVH.dgr=e=>{
  const nm=pid=>pid===NET.pid?'you':(REMOTES.get(pid)||{}).name||'a teammate', who=REMOTES.get(e[2]);
  if(e[1]===NET.pid||e[2]===NET.pid||DG_RUN) toast((e[1]===NET.pid?'You':nm(e[1]))+' revived '+nm(e[2])+'.','good');
  if(e[2]===NET.pid) spawnRing(2,0x9fe08a,P.y+0.2); else if(who) spawnRingAt(who.x,who.y,who.z,2,0x9fe08a);
};
// the end: dge [pid, 1 won | 0 lost, seconds, xp, coins, [item ids], materials, why]
EVH.dge=e=>{ if(e[1]!==NET.pid) return; if(DG_RUN) DG_RUN.end={won:!!e[2],at:t}; dgResultShow(e); };
// the HUD tuple: [phase, seconds since setup, members still to answer, ...the kit's numbers]
SNAPH.dg=v=>{
  const R=DG_RUN; if(!R||!Array.isArray(v)) return;
  R.dg=v; if(Math.abs(dgRunClock()-(v[1]|0))>1.5) R.t0=t-(v[1]|0);
};
// every frame (main/loop.js, before the camera): the prompts always; in a run its view, light, HUD and explored tiles
function dgFrame(dt){
  dgPartyTick(dt);
  const R=DG_RUN; if(!R) return;
  if(!dgInSlots(P.x)){ if((R.away+=dt)>2) dgRunLeave(); return; }   // (a reconnect or a lost message left the view up while you are back in the world)
  R.away=0;
  if(R.lay){ const tx=Math.floor((P.x-R.ox)/DG_TILE), tz=Math.floor((P.z-R.oz)/DG_TILE); if(tx>=0&&tz>=0&&tx<R.lay.gw&&tz<R.lay.gh&&!R.seen[tz*R.lay.gw+tx]){ R.seen[tz*R.lay.gw+tx]=1; dgMiniSeen(); } }
  for(const step of [dgViewTick,dgLookTick,dgHudTick]) try{ step(dt); }catch(err){ console.error('dungeon frame:',err); }
}
