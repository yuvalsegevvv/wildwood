//@ Server API: join, leave, receive (message routing), setPos, tick (simulation, private updates, per-player snapshots)
/* Saves: when the host gives io.store = {load(acct) -> record|null, save(acct, record)} (either may return a
   Promise), each player's progress lives on the server under their account code (a secret the browser keeps).
   A player the server doesn't know yet is created from the save their browser sends: that is how progress
   from before server saves carries over, and how it recovers if the server ever loses a record. Without
   io.store (solo, or a shared world hosted in a tab) the browser's own save is used, as before.
   Registered accounts (name + password, Node server only) are in accounts.js.
   Messages in:  hello{acct,name,look,save[,user,pass|token]}  register{user,pass}  logout{token}  pos{p:[x,y,z,face,vx,vz]}  atk{k,tg,face,aim}  equip{id}  unequip{slot}
                 cls{cls}  buy{id}  sell{id}  accept{id}  turnin{id}  look{look}  warp{to: 'home'|'hanami'|'rimehold'}  dev{cmd,v}
                 buyskill{id}  eqskill{id[,idx: passive slot]}  unskill{cls,slot[,idx]}  upskill{id}  soul{el}  mq{a:'talk'|'pick'|'read',id|i}  learn{id: a profession}  gather{i: a resource node}
   Messages out: welcome{pid,day,dev,players[,look: a logged-in account's own look]}  mons{list}  you  tp  snap{day,n,pl,mo,b:[per boss: id,engaged,phase,immune,enraged,stunned,aux,mode],ev}  auth{user,token}  authfail{text}   (see src/game/net/client.js) */
initMonstersS(); initBossS();
const ACCT=new Map(), PENDING=new Set();   // account -> pid online; pids whose save is still loading
const recordOf=p=>Object.assign({v:1,name:p.name,look:p.look,level:p.level,exp:p.exp,gear:p.gear,updated:Date.now()},p.auth?{auth:p.auth}:{});
function saveP(p){ if(!io.store||!p.acct) return Promise.resolve(); p.saveDirty=false; return Promise.resolve().then(()=>io.store.save(p.acct,recordOf(p))).catch(e=>{ p.saveDirty=true; if(io.log) io.log('save failed',e&&e.message); }); }
function flushAll(){ return Promise.all([...S.players.values()].filter(p=>p.acct).map(saveP)); }
function beginJoin(pid,hello){
  if(typeof hello.user==='string'&&hello.user){ loginJoin(pid,hello); return; }
  const acct=typeof hello.acct==='string'&&/^[a-f0-9]{32}$/.test(hello.acct)?hello.acct:null;
  if(!io.store||!acct){ join(pid,hello); return; }
  PENDING.add(pid);
  // already playing in another window? take that live progress (newer than anything on disk)
  const live=ACCT.get(acct), lp=live!==undefined&&S.players.get(live);
  Promise.resolve().then(()=>lp?recordOf(lp):io.store.load(acct)).then(rec=>{
    if(!PENDING.delete(pid)) return;   // left while loading
    const old=ACCT.get(acct);
    if(old!==undefined&&old!==pid&&S.players.has(old)){ sendTo(old,{t:'kicked',text:'You opened this account somewhere else, so this window was disconnected.'}); leave(old); if(io.kick) io.kick(old); }
    // moved to a registered account: this guest starts over (the browser's copy belongs to the account now)
    const moved=!!(rec&&rec.movedTo), migrate=!rec, h=moved?Object.assign({},hello,{save:null}):migrate?hello:Object.assign({},hello,{save:{level:rec.level,exp:rec.exp,gear:rec.gear}});
    const p=join(pid,h); p.acct=acct; ACCT.set(acct,pid);
    if(moved){ saveP(p); toastTo(pid,'The progress in this browser belongs to the account '+rec.movedTo+' now. Log in as '+rec.movedTo+' to play it.',''); }
    if(migrate){ saveP(p); if(hello.save&&(hello.save.level>1||(hello.save.gear&&hello.save.gear.coins))) toastTo(pid,'Your progress has been moved to the server. It is safe even if you clear this browser, as long as you keep your account code (settings).','good'); }
  }).catch(e=>{ PENDING.delete(pid); if(io.log) io.log('load failed',e&&e.message); sendTo(pid,{t:'kicked',text:'The server could not load your progress. Please try again in a moment.'}); if(io.kick) io.kick(pid); });
}
function join(pid,hello,auth){
  const p=newPlayer(pid,hello); S.players.set(pid,p);
  if(auth){ p.auth=auth; p.user=auth.user; }
  else { const n=freeName(p.name,p); if(n!==p.name){ toastTo(pid,'Someone already has the name '+p.name+', so you are '+n+'. Change it in Settings.',''); p.name=n; } }
  sendTo(pid,{t:'welcome',pid,day:S.day,dev:S.dev,players:[...S.players.values()].filter(q=>q!==p).map(pubInfo),look:auth?p.look:undefined});
  const ros=MONS.filter(m=>!m.remove&&!m.inst).map(monRoster);   // dungeons: the world's monsters only (a run's reach its members on entry)
  for(let i=0;i<ros.length;i+=40) sendTo(pid,{t:'mons',list:ros.slice(i,i+40)});
  for(const B of BOSSES){   // what a boss has set up right now, for someone who arrives in the middle of the fight
    for(const e of B.tele) sendTo(pid,{t:'snap',ev:[['tele',e.id,e.kind,r1(e.x),r1(e.z),r1(e.r),e.dur-e.t,Math.round(e.face*100)/100,e.half]]});
    for(const zn of B.zones) sendTo(pid,{t:'snap',ev:[['zone',zn.id,zn.kind,r1(zn.x),r1(zn.z),r1(zn.r),zn.dur-zn.t,zn.a,zn.b]]});
  }
  { const ne=nodeEvents(); if(ne.length) sendTo(pid,{t:'snap',ev:ne}); }   // the resource nodes that are taken right now
  sendTo(pid,youMsg(p)); p.dirty=false;
  ev('pjoin',pubInfo(p));
  return p;
}
function leave(pid){
  PENDING.delete(pid);
  const lp=S.players.get(pid); if(lp) mqRemoveGreyP(lp);
  if(lp){ partyGoneP(lp); dgGoneP(lp); }   // dungeons: out of the party (the lead passes on); a run holds the place 5 minutes
  if(lp&&lp.acct){ saveP(lp); if(ACCT.get(lp.acct)===pid) ACCT.delete(lp.acct); }
  if(!S.players.delete(pid)) return;
  ev('pleave',pid);
  for(const m of MONS) if(m.tgt===pid){ m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; }
}
function setPos(pid,d){
  const p=S.players.get(pid); if(!p||p.dead||!Array.isArray(d)) return;
  const v=d.map(Number); if(!v.slice(0,3).every(isFinite)) return;
  if(p.inst||dgInSlots(v[0])){ dgSetPosS(p,v); return; }   // dungeons: inside a run (its grid, never into a wall); slot coordinates from a hiker in no run are a late message: ignored
  p.x=clamp(v[0],WX0,WX1); p.y=v[1]; p.z=clamp(v[2],WZ0,WZ1); p.face=isFinite(v[3])?v[3]:p.face; p.vx=v[4]||0; p.vz=v[5]||0;
  if(p.gear.east<1 && p.x>TUN.p0) p.x=TUN.p0;   // the sealed tunnel
  if(p.gear.north<1 && p.x>HALF && p.z<PASS.ice) p.z=PASS.ice;   // the ice wall in Frostgate Pass
  if(p.gear.west<1 && p.z<HZ0 && p.x<GLEN.ice && Math.abs(p.z-GLEN.z)<GLEN.w+6) p.x=GLEN.ice;   // the ice fall in the glacier valley
  if(p.z<HZ0&&p.x<HALF) for(const G of GREY_GATES) if(p.gear[G.id]<1 && Math.abs(p.z-G.z)<40 && p.x<G.x) p.x=G.x;   // the rock falls in the west wall
}
function receive(pid,msg){
  if(!msg||typeof msg!=='object') return;
  if(msg.t==='hello'){ if(S.players.has(pid)) leave(pid); beginJoin(pid,msg); return; }
  const p=S.players.get(pid); if(!p) return;
  S.ctx=p.inst|0;   // dungeons: what a message causes belongs to the sender's run (0 = the world)
  switch(msg.t){
    case 'pos': setPos(pid,msg.p); break;
    case 'atk': handleAttack(p,msg); break;
    case 'equip': equipP(p,msg.id); break;
    case 'unequip': unequipP(p,msg.slot); break;
    case 'cls': equipClassP(p,msg.cls); break;
    case 'buy': buyP(p,msg.id); break;
    case 'sell': sellP(p,msg.id); break;
    case 'merge': mergeP(p,msg.id); break;
    case 'accept': acceptP(p,msg.id); break;
    case 'turnin': turnInP(p,msg.id); break;
    case 'abandon': abandonP(p,msg.id); break;
    case 'buyskill': buySkillP(p,msg.id); break;
    case 'chat': chatP(p,msg.text); break;
    case 'name': renameP(p,msg.name); break;
    case 'eqskill': equipSkillP(p,msg.id,msg.idx); break;
    case 'unskill': unequipSkillP(p,msg.cls,msg.slot||'skill',msg.idx); break;
    case 'upskill': upgradeSkillP(p,msg.id); break;
    case 'soul': bindSoulP(p,msg.el); break;
    case 'look': if(msg.look&&typeof msg.look==='object'&&JSON.stringify(msg.look).length<2000){ p.look=msg.look; p.saveDirty=true; ev('plook',p.id,p.look); } break;
    case 'warp': warpP(p,typeof msg.to==='string'?msg.to:undefined); break;
    case 'mq': mqMsgP(p,msg); break;
    case 'learn': learnProfP(p,msg.id); break;
    case 'gather': gatherP(p,clampInt(msg.i,0,NODES.length-1,-1)); break;
    case 'sellres': sellResP(p,msg.id,clampInt(msg.n,0,RES_MAX,0)); break;
    case 'craft': craftP(p,msg.slot,msg.tier,msg.rar); break;
    case 'brew': brewP(p,msg.id,msg.n); break;
    case 'potion': drinkP(p,msg.k); break;
    case 'zt': setZoneTierP(p,msg.land,msg.n); break;
    case 'dev': devP(p,msg); break;
    case 'register': registerP(p,msg.user,msg.pass); break;
    case 'logout': logoutP(p,msg.token); break;
    default: if(MSG[msg.t]) MSG[msg.t](p,msg); break;   // dungeons: messages added by feature files (party, dg, ...)
  }
  S.ctx=0;   // dungeons: back to the world's context
}
function tick(dt){
  dt=Math.min(Math.max(dt,0),0.1); S.t+=dt;
  if(S.ff!==null){ const left=((S.ff-S.day)%1+1)%1, step=Math.min(left,dt*0.22); S.day=(S.day+step)%1; if(left-step<1e-4) S.ff=null; }
  else S.day=(S.day+dt/DAY_SECONDS)%1;
  if(S.day<S.prevDay) sunrise();
  S.prevDay=S.day;
  updatePlayersS(dt); S.ctx=0; updateMonstersS(dt); updateProjS(dt); updateAreasS(dt); updateBurnS(dt); S.ctx=0; updateWeatherS(dt); updateNodesS(dt); updateCastsS(); updatePartiesS(dt); updateInstsS(dt); S.ctx=0;   // dungeons: the per-entity loops set S.ctx (the run an event belongs to), so it goes back to the world after them; parties and runs tick here
  for(const p of S.players.values()) if(p.dirty){ p.dirty=false; p.saveDirty=true; sendTo(p.id,youMsg(p)); }
  S.saveT-=dt; if(S.saveT<=0){ S.saveT=5; for(const p of S.players.values()) if(p.saveDirty&&p.acct) saveP(p); }
  S.snapT-=dt; if(S.snapT<=0){ S.snapT=S.snapDt; broadcastSnap(); }
}
// a new day: shop prices go back to normal for everyone
function sunrise(){
  let any=false;
  for(const p of S.players.values()){ refreshOffersP(p); if(Object.keys(p.gear.bought).length){ p.gear.bought={}; p.dirty=true; any=true; } }
  toastTo(null,'Sunrise: new notices on the quest board'+(any?', and the shops are back to their usual prices.':'.'),'good');
}
/* Snapshots are made per player, so traffic grows with what you can see and not with everyone in the world (it used to be one broadcast: every
   client received every awake monster of every player, which is N x N messages). What you get:
   - monsters (mo): only the ones you can see (the client draws monsters within 95 m, bosses within 170 m: SNAP_MON / SNAP_BOSS add a margin),
     and only when their state changed since the last time they were sent to you (p.mk remembers what each player has). Those within SNAP_NEAR
     update every snapshot, farther ones every second snapshot (staggered by id): the client smooths movement, and a monster 60 m away is a
     few pixels. One that comes into range is always sent, and everything in range is re-sent every 3 s in case a message was lost.
   - players (pl): yourself and those within SNAP_PLAYERS (about the fog distance) every snapshot; the others once a second (map and count).
     n is the head count.
   - day, bosses (b), weather (w) and events (ev) are the same for everyone.
   The claude.ai room host sets io.broadcastSnaps: its channel is one shared, size-limited topic, so it keeps a single message for everyone
   (all awake monsters that changed, all players) instead of one per player. */
const SNAP_NEAR=40, SNAP_MON=110, SNAP_BOSS=190, SNAP_PLAYERS=250;
function broadcastSnap(){
  const no=++S.snapNo, full=(S.fullT-=S.snapDt)<=0; if(full) S.fullT=3;
  const rows=[];   // every awake monster once: [monster, entry, state key]
  for(const m of MONS){
    if(m.remove||m.dead||!m.awake) continue;
    const a=[m.id,r1(m.x),r1(m.z),Math.round(m.face*100)/100,Math.ceil(m.hp),(m.aggro?1:0)|(m.slowT>0?4:0)|(m.immune?8:0)|(m.stunT>0?16:0)|(m.burnT>0?32:0)];
    rows.push([m,a,a.join()]);
  }
  const all=[...S.players.values()], prow=all.map(p=>[p.id,r1(p.x),r1(p.y),r1(p.z),Math.round(p.face*100)/100,Math.round(p.hp),p.maxHp,p.level,p.dead?1:0]);
  const day=Math.round(S.day*1e5)/1e5, b=bossState(), w=weatherState(), ev=EVQ; EVQ=[];
  if(io.broadcastSnaps){
    const mo=[]; for(const [m,a,key] of rows) if(full||key!==m.snapKey){ m.snapKey=key; mo.push(a); }
    io.broadcast({t:'snap',day,n:all.length,pl:prow,mo,b,w,ev}); return;
  }
  const farToo=no%10===0;
  for(const p of all){
    const seen=p.mk||(p.mk=new Map()), stamp=p.mkS||(p.mkS=new Map()), mo=[], pl=[];
    for(const [m,a,key] of rows){
      const dx=m.x-p.x, dz=m.z-p.z, d2=dx*dx+dz*dz, R=m.boss?SNAP_BOSS:SNAP_MON; if(d2>R*R) continue;
      stamp.set(m.id,no);
      const known=seen.get(m.id);
      if(full||known===undefined||(known!==key&&(d2<=SNAP_NEAR*SNAP_NEAR||(no+m.id)%2===0))){ seen.set(m.id,key); mo.push(a); }
    }
    for(const [id,s] of stamp) if(s!==no){ stamp.delete(id); seen.delete(id); }   // left your range: sent again from scratch when it returns
    all.forEach((q,i)=>{ const dx=q.x-p.x, dz=q.z-p.z; if(q===p||farToo||dx*dx+dz*dz<=SNAP_PLAYERS*SNAP_PLAYERS) pl.push(prow[i]); });
    io.send(p.id,dgSnapS(p,{t:'snap',day,n:all.length,pl,mo,b,w,ev}));   // dungeons: events of your own run (or the world), its players, its boss row (b) and its HUD tuple (dg)
  }
}
return {join:beginJoin,leave,receive,setPos,tick,flushAll,state:S,monsters:MONS,players:S.players};
