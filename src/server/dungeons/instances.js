//@ Dungeon runs, the instance layer: the run object in its far-away slot, local <-> world coordinates, which events and snapshot parts reach whom (S.ctx), positions, dashes and hits inside a run's walls, entering and leaving a run
/* agent map
   exports: DG_RUNS (run id -> run), dgNewRunS(T,mission,o) -> run | null, dgWorldS(run,lx,lz) / dgLocalS(run,x,z) -> {x,z}, dgRunAt(x,z), dgCtxAt(x,z), dgRunOf(p),
            dgEv(run,...event) (an event to the run's members), dgEvTo(kind,pid,...rest) (to one player), dgEvFor(events,p), dgSnapS(p,msg), dgWallAtS(x,z),
            dgSetPosS(p,v), dgDashS(p,L), dgHitOkS(m,p,fromX,fromZ), dgKeyOf(p), dgMemberOf(run,p), dgPresentS(run), dgMembersS(run), dgEnterS(run,p), dgExitS(run,p),
            dgInfoS(run), dgSpotS(run,i) (a free place by the entrance portal)
   users: hooks in server/state.js (ev tags S.ctx), api.js (receive, tick, setPos, join, leave, broadcastSnap), world.js (getH), combat.js (hits, dashes, projectiles), the other dungeon files
   test: tools/dungeon-runs-smoke.js.   Design: docs/DUNGEONS.md sections 7 (the table of what became instance-aware) and 9 (the protocol).
   THE RUN OBJECT (other files code against it; local coordinates are metres from the bake's north-west corner, world = local + (ox, oz)):
     {id, slot, ox, oz, theme (the DG_THEMES entry), th (its id), mission (id), seed (the one dgLayout accepted), L (level), tier (the +N it is played at), B (dgBake),
      phase 'objectives'|'boss'|'won'|'lost', ready (false until the invited members answered and the kit's setup ran), t (seconds since setup), endT (S.t it ended, 0),
      members: Map key (p.acct, or 'pid:'+id without one) -> {pid, key, name, p (the player while present, else null), respawns, out, down, gone (S.t of a disconnect, 0),
               left (went back to the world), back {x,z} (where they return), got {xp, coins, items, mats, kills}},
      mons: Set of its monsters, objs: [objectives], boss: null | the boss fight state B (server/boss.js), k: {} (the mission kit's own state), hud: [numbers for the HUD],
      party (party id or 0), lead (pid), dev (started by the testing tool), inv: Map pid -> S.t its accept prompt expires, asked: Set of pids prompted, emptyT, flow (cache)}
   EVENTS: every ev() carries a.inst = S.ctx, the run that caused it (0 = the world): receive() sets it from the sender, the per-entity loops (players, projectiles,
   areas, burning) from the entity, the runs' update from the run. dgEvFor sends a player the events of his own run (or of the world), plus DG_EV_ALL to everyone,
   plus the DG_EV_SELF events about himself wherever they were caused, plus events marked e.to for him alone. */
S.ctx=0;
const DG_RUNS=new Map(), DG_SLOT_RUN=new Array(DG_MAX_INST).fill(0); let dgNextRun=1;
const DG_RESPAWNS=2, DG_POS_JUMP=12, DG_PLAYER_R=0.3;   // respawns a run; the most one position update may move you (a dash is 8 m); a player's collision radius on the server (a little less than the client's: never refuse a step the client allowed)
const DG_EV_ALL=new Set(['chat','pjoin','pleave','pname','plook','pgear','weather','thunder']);   // who is online and what they look like, chat, the weather: for everyone
// events whose e[1] is the player they are about: that player always gets them, even when another run (or the world) caused them
const DG_EV_SELF=new Set(['toast','xp','coins','loot','lvup','hurt','down','up','skillslot','qdone','qturn','merge','skillbuy','skilldrop','skillup','soul','lvset','mq','vale','north','warp','pot','craft','brew','cast','castx','gather','drop','pfx','buff']);
// a new run in a free slot: the layout from the seed (the next seeds if dgLayout gives up on one), its bake, no members yet. o: {tier, L, seed, dev, back}
function dgNewRunS(T,mission,o){
  const slot=DG_SLOT_RUN.indexOf(0); if(slot<0||!DG_MISSIONS[mission]) return null;
  let seed=o.seed===undefined?Math.floor(Math.random()*1e9):o.seed|0, L=null;
  for(let i=0;i<40&&!L;i++){ L=dgLayout({mission,seed:seed+i,theme:T}); if(L) seed+=i; }   // (the theme gives the tiles and the legend: the client rebuilds it with dgLayout({mission:m, seed, theme:th}))
  if(!L) return null;
  const O=dgSlotOrigin(slot), run={id:dgNextRun++,slot,ox:O.x,oz:O.z,theme:T,th:T.id,mission,seed,L:o.L|0||DG_LV,tier:o.tier|0,B:dgBake(L),
    phase:'objectives',ready:false,t:0,endT:0,members:new Map(),mons:new Set(),objs:[],boss:null,k:{},hud:[],party:0,lead:null,dev:!!o.dev,back:o.back||null,
    inv:new Map(),asked:new Set(),emptyT:0,flow:new Map(),nextObj:0};
  DG_SLOT_RUN[slot]=run.id; DG_RUNS.set(run.id,run); return run;
}
const dgWorldS=(run,lx,lz)=>({x:run.ox+lx,z:run.oz+lz});
const dgLocalS=(run,x,z)=>({x:x-run.ox,z:z-run.oz});
function dgRunAt(x,z){ const s=dgSlotAt(x,z); return s<0||!DG_SLOT_RUN[s]?null:DG_RUNS.get(DG_SLOT_RUN[s])||null; }
const dgCtxAt=(x,z)=>{ const r=dgRunAt(x,z); return r?r.id:0; };
const dgRunOf=p=>p&&p.inst?DG_RUNS.get(p.inst)||null:null;
function dgWallAtS(x,z){ const r=dgRunAt(x,z); return !!r&&dgSolid(r.B,x-r.ox,z-r.oz); }
function dgEv(run,...a){ const c0=S.ctx; S.ctx=run.id; const e=ev(...a); S.ctx=c0; return e; }
function dgEvTo(kind,pid,...rest){ const e=ev(kind,pid,...rest); e.to=pid; return e; }
function dgEvFor(evq,p){
  const me=p.inst|0, out=[];
  for(const e of evq){
    if(e.to!==undefined){ if(e.to===p.id) out.push(e); continue; }
    if((e.inst|0)===me||DG_EV_ALL.has(e[0])||(e[1]===p.id&&DG_EV_SELF.has(e[0]))) out.push(e);
  }
  return out;
}
// one player's snapshot, made instance-aware (the hook in broadcastSnap): events filtered, players of the same run (or the world) only, a run's own boss row and HUD tuple
function dgSnapS(p,msg){
  msg.ev=dgEvFor(msg.ev,p);
  if(!DG_RUNS.size) return msg;
  const me=p.inst|0; msg.pl=msg.pl.filter(r=>{ const q=S.players.get(r[0]); return (q?q.inst|0:0)===me; });
  const run=dgRunOf(p); if(!run) return msg;
  const B=run.boss; msg.b=B?[[B.m.id,B.engaged?1:0,B.phase,B.m.immune?1:0,B.enraged?1:0,B.stunT>0?1:0,B.aux,B.mode]]:[];   // the same row as bossState(), for the run's boss only
  msg.dg=dgHudS(run); return msg;
}
const DG_PHASE_CODE={objectives:0,boss:1,won:2,lost:3};
// the snapshot's dg tuple: [phase (0 objectives, 1 boss, 2 won, 3 lost), seconds since setup, members still to answer the start prompt (0 = under way), ...the kit's hud]
const dgHudS=run=>[DG_PHASE_CODE[run.phase],Math.floor(run.t),run.ready?0:Math.max(1,run.inv.size),...run.hud];
const dgKeyOf=p=>p.acct||'pid:'+p.id;
function dgMemberOf(run,p){ if(!p) return null; const mb=run.members.get(dgKeyOf(p)); if(mb&&mb.pid===p.id) return mb; for(const m of run.members.values()) if(m.pid===p.id) return m; return null; }
// members present in the run now (alive, downed or out; not disconnected, not gone back to the world) / and of those, the living
function dgPresentS(run){ const out=[]; for(const mb of run.members.values()){ const p=mb.p; if(p&&!mb.left&&!mb.gone&&p.inst===run.id&&S.players.get(mb.pid)===p) out.push(p); } return out; }
const dgMembersS=run=>dgPresentS(run).filter(p=>!p.dead);
// a place by the entrance portal, toward the entrance tile's door, i-th of a row (free of walls)
function dgSpotS(run,i){
  const B=run.B, P=B.start, st=B.layout.start, cell=B.layout.cells.find(c=>c.x===st[0]&&c.z===st[1]), d=DG_STEP.find(s=>cell&&(cell.mask&s[0]))||DG_STEP[0];
  const fx=d[1], fz=d[2], sx=-fz, sz=fx, off=((i|0)%4-1.5)*1.6;
  let x=P.x+fx*4+sx*off, z=P.z+fz*4+sz*off;
  if(!dgFree(B,x,z,0.5)){ x=P.x+fx*4; z=P.z+fz*4; }
  return {x,z,face:Math.atan2(-fx,-fz)};
}
const dgInfoS=run=>({id:run.id,m:run.mission,seed:run.seed,th:run.th,L:run.L,tier:run.tier,ox:run.ox,oz:run.oz,y:DG_FLOOR_Y,ph:DG_PHASE_CODE[run.phase],t:Math.floor(run.t),boss:run.boss?run.boss.m.id:0});
// into a run (at the entrance): the member's place (kept by account), the tp that tells the client to build the layout from the seed, the run's monsters, objectives and boss
function dgEnterS(run,p){
  const key=dgKeyOf(p); let mb=run.members.get(key);
  if(!mb){ mb={pid:p.id,key,name:p.name,p:null,respawns:DG_RESPAWNS,out:false,down:false,gone:0,left:false,back:run.back?{x:run.back.x,z:run.back.z}:{x:p.x,z:p.z},got:{xp:0,coins:0,items:[],mats:0,kills:0}}; run.members.set(key,mb); }
  mb.pid=p.id; mb.p=p; mb.name=p.name; mb.gone=0; mb.left=false; mb.out=false; mb.down=false;
  p.inst=run.id; p.cast=null; p.act=null; p.dead=false; p.deadT=0; run.inv.delete(p.id);
  for(const m of MONS) if(m.tgt===p.id&&!m.inst){ m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; }   // the world's monsters lose him
  const sp=dgSpotS(run,dgPresentS(run).length-1);
  p.x=run.ox+sp.x; p.z=run.oz+sp.z; p.y=DG_FLOOR_Y; p.face=sp.face; p.vx=p.vz=0; p.dgX=p.x; p.dgZ=p.z;
  sendTo(p.id,{t:'tp',x:p.x,z:p.z,face:sp.face,dg:dgInfoS(run)});
  const ros=[...run.mons].filter(m=>!m.remove).map(monRoster);
  for(let i=0;i<ros.length;i+=40) sendTo(p.id,{t:'mons',list:ros.slice(i,i+40)});
  const evs=run.objs.map(o=>['dgo',o.id,o.kind,r1(o.x),r1(o.z),o.st,o.v]);
  if(run.boss){ const A=run.boss.A; evs.push(['dgb',run.boss.m.id,r1(A.x),r1(A.z),A.r,run.boss.bd.def.id]); for(const e of run.boss.tele) evs.push(['tele',e.id,e.kind,r1(e.x),r1(e.z),r1(e.r),e.dur-e.t,Math.round(e.face*100)/100,e.half]); }
  if(evs.length) sendTo(p.id,{t:'snap',ev:evs});
  p.dirty=true; dgEv(run,'toast',null,p.name+' entered the run.','');
}
// back to the world (where they came from: the door's apron, or where a testing-tool run was started); a downed hiker wakes there. Loot stays: it was banked as it dropped
function dgExitS(run,p){
  const mb=dgMemberOf(run,p); if(mb){ mb.left=true; mb.p=null; mb.down=false; }
  const back=mb&&mb.back||{x:VIL.spawn.x,z:VIL.spawn.z};
  p.inst=0; p.cast=null; p.act=null;
  if(p.dead){ p.dead=false; p.hp=p.maxHp; p.lastHit=-99; ev('up',p.id); }
  for(const m of run.mons) if(m.tgt===p.id){ m.aggro=false; m.tgt=null; m.pendingHit=-1; }
  p.x=back.x; p.z=back.z; p.y=getH(back.x,back.z); p.vx=p.vz=0;
  sendTo(p.id,{t:'tp',x:p.x,z:p.z,face:p.face||0,dg:false});
  const gone=[...run.mons].map(m=>['despawn',m.id]); if(gone.length) sendTo(p.id,{t:'snap',ev:gone});   // the run's monsters leave his view at once
  p.dirty=true; if(!run.endT) dgEv(run,'toast',null,p.name+' left the run.','');
}
/* setPos inside a run (the hook in api.js setPos): local coordinates, never into a wall (dgSlide from where the server has you), never off the grid, no jumps a walk
   cannot make. A position from a run you just left, or slot coordinates from a hiker in no run, are ignored (they are late messages, not moves). */
function dgSetPosS(p,v){
  const run=dgRunOf(p); if(!run) return;
  const lx=v[0]-run.ox, lz=v[2]-run.oz, ox=p.x-run.ox, oz=p.z-run.oz;
  if(Math.hypot(lx-ox,lz-oz)>DG_POS_JUMP) return;
  const s=dgSlide(run.B,ox,oz,lx,lz,DG_PLAYER_R);
  p.x=run.ox+s[0]; p.z=run.oz+s[1]; p.y=clamp(v[1],DG_FLOOR_Y,DG_FLOOR_Y+6); p.face=isFinite(v[3])?v[3]:p.face; p.vx=v[4]||0; p.vz=v[5]||0;
  p.dgX=p.x; p.dgZ=p.z;
}
// a charge or dash inside a run (combat.js clamps it to the world first): from the last good place toward the target, stopping short of the first wall
function dgDashS(p,L){
  const run=dgRunOf(p); if(!run) return;
  const x0=(p.dgX!==undefined?p.dgX:run.ox+run.B.start.x)-run.ox, z0=(p.dgZ!==undefined?p.dgZ:run.oz+run.B.start.z)-run.oz, tx=L.x-run.ox, tz=L.z-run.oz, d=Math.hypot(tx-x0,tz-z0), n=Math.ceil(d/0.5);
  let x=x0, z=z0;
  for(let i=1;i<=n;i++){ const k=i/n, nx=x0+(tx-x0)*k, nz=z0+(tz-z0)*k; if(!dgFree(run.B,nx,nz,DG_PLAYER_R)) break; x=nx; z=nz; }
  p.x=run.ox+x; p.z=run.oz+z; p.y=DG_FLOOR_Y; p.dgX=p.x; p.dgZ=p.z;
}
/* may p's hit (coming from fromX, fromZ: the attacker, an area's centre, a splash) land on run monster m? Same run, and no wall between. A projectile that reached the
   monster passed no wall (walls stop projectiles: the updateProjS hook), so one of p's projectiles beside it vouches for the hit when the attacker has since stepped round a corner. */
function dgHitOkS(m,p,fx,fz){
  const run=DG_RUNS.get(m.inst); if(!run||!p||p.inst!==m.inst) return false;
  if(dgLos(run.B,fx-run.ox,fz-run.oz,m.x-run.ox,m.z-run.oz)) return true;
  for(const pr of PROJS) if(pr.owner===p.id&&Math.hypot(pr.x-m.x,pr.z-m.z)<m.T.rad+2.5) return true;
  return false;
}
