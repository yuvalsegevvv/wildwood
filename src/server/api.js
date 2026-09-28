//@ Server API: join, leave, receive (message routing), setPos, tick (simulation, private updates, snapshots)
/* Saves: when the host gives io.store = {load(acct) -> record|null, save(acct, record)} (either may return a
   Promise), each player's progress lives on the server under their account code (a secret the browser keeps).
   A player the server doesn't know yet is created from the save their browser sends: that is how progress
   from before server saves carries over, and how it recovers if the server ever loses a record. Without
   io.store (solo, or a shared world hosted in a tab) the browser's own save is used, as before.
   Registered accounts (name + password, Node server only) are in accounts.js.
   Messages in:  hello{acct,name,look,save[,user,pass|token]}  register{user,pass}  logout{token}  pos{p:[x,y,z,face,vx,vz]}  atk{k,tg,face,aim}  equip{id}  unequip{slot}
                 cls{cls}  buy{id}  sell{id}  accept{id}  turnin{id}  look{look}  warp{}  dev{cmd,v}
   Messages out: welcome  mons{list}  you  tp  snap{day,pl,mo,b:[per boss],ev}  auth{user,token}  authfail{text}   (see src/game/net/client.js) */
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
  sendTo(pid,{t:'welcome',pid,day:S.day,dev:S.dev,players:[...S.players.values()].filter(q=>q!==p).map(pubInfo)});
  const ros=MONS.filter(m=>!m.remove).map(monRoster);
  for(let i=0;i<ros.length;i+=40) sendTo(pid,{t:'mons',list:ros.slice(i,i+40)});
  for(const B of BOSSES) for(const e of B.tele) sendTo(pid,{t:'snap',ev:[['tele',e.id,e.kind,r1(e.x),r1(e.z),r1(e.r),e.dur-e.t,Math.round(e.face*100)/100,e.half]]});
  sendTo(pid,youMsg(p)); p.dirty=false;
  ev('pjoin',pubInfo(p));
  return p;
}
function leave(pid){
  PENDING.delete(pid);
  const lp=S.players.get(pid); if(lp&&lp.acct){ saveP(lp); if(ACCT.get(lp.acct)===pid) ACCT.delete(lp.acct); }
  if(!S.players.delete(pid)) return;
  ev('pleave',pid);
  for(const m of MONS) if(m.tgt===pid){ m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; }
}
function setPos(pid,d){
  const p=S.players.get(pid); if(!p||p.dead||!Array.isArray(d)) return;
  const v=d.map(Number); if(!v.slice(0,3).every(isFinite)) return;
  p.x=clamp(v[0],WX0,WX1); p.y=v[1]; p.z=clamp(v[2],WZ0,WZ1); p.face=isFinite(v[3])?v[3]:p.face; p.vx=v[4]||0; p.vz=v[5]||0;
  if(p.gear.east<1 && p.x>TUN.p0) p.x=TUN.p0;   // the sealed tunnel
}
function receive(pid,msg){
  if(!msg||typeof msg!=='object') return;
  if(msg.t==='hello'){ if(S.players.has(pid)) leave(pid); beginJoin(pid,msg); return; }
  const p=S.players.get(pid); if(!p) return;
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
    case 'eqskill': equipSkillP(p,msg.id); break;
    case 'unskill': unequipSkillP(p,msg.cls,msg.slot||'skill'); break;
    case 'look': if(msg.look&&typeof msg.look==='object'&&JSON.stringify(msg.look).length<2000){ p.look=msg.look; p.saveDirty=true; ev('plook',p.id,p.look); } break;
    case 'warp': warpP(p); break;
    case 'dev': devP(p,msg); break;
    case 'register': registerP(p,msg.user,msg.pass); break;
    case 'logout': logoutP(p,msg.token); break;
  }
}
function tick(dt){
  dt=Math.min(Math.max(dt,0),0.1); S.t+=dt;
  if(S.ff!==null){ const left=((S.ff-S.day)%1+1)%1, step=Math.min(left,dt*0.22); S.day=(S.day+step)%1; if(left-step<1e-4) S.ff=null; }
  else S.day=(S.day+dt/DAY_SECONDS)%1;
  if(S.day<S.prevDay) sunrise();
  S.prevDay=S.day;
  updatePlayersS(dt); updateMonstersS(dt); updateProjS(dt); updateAreasS(dt); updateWeatherS(dt);
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
function broadcastSnap(){
  const pl=[...S.players.values()].map(p=>[p.id,r1(p.x),r1(p.y),r1(p.z),Math.round(p.face*100)/100,Math.round(p.hp),p.maxHp,p.level,p.dead?1:0]);
  // monsters: only those near a player whose state changed, plus all of them every 3 s in case a message was lost
  const mo=[], full=(S.fullT-=S.snapDt)<=0; if(full) S.fullT=3;
  for(const m of MONS){
    if(m.remove||m.dead||!m.awake) continue;
    const a=[m.id,r1(m.x),r1(m.z),Math.round(m.face*100)/100,Math.ceil(m.hp),(m.aggro?1:0)|(m.slowT>0?4:0)|(m.immune?8:0)|(m.stunT>0?16:0)], key=a.join();
    if(full||key!==m.snapKey){ m.snapKey=key; mo.push(a); }
  }
  const events=EVQ; EVQ=[];
  io.broadcast({t:'snap',day:Math.round(S.day*1e5)/1e5,pl,mo,b:bossState(),w:weatherState(),ev:events});
}
return {join:beginJoin,leave,receive,setPos,tick,flushAll,state:S,monsters:MONS,players:S.players};
