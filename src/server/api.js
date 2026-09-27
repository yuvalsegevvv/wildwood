//@ Server API: join, leave, receive (message routing), setPos, tick (simulation, private updates, snapshots)
/* Messages in:  hello{name,look,save}  pos{p:[x,y,z,face,vx,vz]}  atk{k,tg,face,aim}  equip{id}  unequip{slot}
                 cls{cls}  buy{id}  sell{id}  accept{id}  turnin{id}  look{look}  dev{cmd,v}
   Messages out: welcome  mons{list}  you  tp  snap{day,pl,mo,b,ev}   (see src/game/net/client.js) */
initMonstersS(); initBossS();
function join(pid,hello){
  const p=newPlayer(pid,hello); S.players.set(pid,p);
  sendTo(pid,{t:'welcome',pid,day:S.day,dev:S.dev,players:[...S.players.values()].filter(q=>q!==p).map(pubInfo)});
  const ros=MONS.filter(m=>!m.remove).map(monRoster);
  for(let i=0;i<ros.length;i+=40) sendTo(pid,{t:'mons',list:ros.slice(i,i+40)});
  if(BOSS.tele.length) for(const e of BOSS.tele) sendTo(pid,{t:'snap',ev:[['tele',e.id,e.kind,r1(e.x),r1(e.z),r1(e.r),e.dur-e.t,Math.round(e.face*100)/100,e.half]]});
  sendTo(pid,youMsg(p)); p.dirty=false;
  ev('pjoin',pubInfo(p));
  return p;
}
function leave(pid){
  if(!S.players.delete(pid)) return;
  ev('pleave',pid);
  for(const m of MONS) if(m.tgt===pid){ m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; }
}
function setPos(pid,d){
  const p=S.players.get(pid); if(!p||p.dead||!Array.isArray(d)) return;
  const v=d.map(Number); if(!v.slice(0,3).every(isFinite)) return;
  p.x=clamp(v[0],-HALF,HALF); p.y=v[1]; p.z=clamp(v[2],-HALF,HALF); p.face=isFinite(v[3])?v[3]:p.face; p.vx=v[4]||0; p.vz=v[5]||0;
}
function receive(pid,msg){
  if(!msg||typeof msg!=='object') return;
  if(msg.t==='hello'){ if(S.players.has(pid)) leave(pid); join(pid,msg); return; }
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
    case 'eqskill': equipSkillP(p,msg.id); break;
    case 'unskill': unequipSkillP(p,msg.cls); break;
    case 'look': if(msg.look&&typeof msg.look==='object'&&JSON.stringify(msg.look).length<2000){ p.look=msg.look; ev('plook',p.id,p.look); } break;
    case 'dev': devP(p,msg); break;
  }
}
function tick(dt){
  dt=Math.min(Math.max(dt,0),0.1); S.t+=dt;
  if(S.ff!==null){ const left=((S.ff-S.day)%1+1)%1, step=Math.min(left,dt*0.22); S.day=(S.day+step)%1; if(left-step<1e-4) S.ff=null; }
  else S.day=(S.day+dt/DAY_SECONDS)%1;
  if(S.day<S.prevDay) sunrise();
  S.prevDay=S.day;
  updatePlayersS(dt); updateMonstersS(dt); updateProjS(dt); updateAreasS(dt);
  for(const p of S.players.values()) if(p.dirty){ p.dirty=false; sendTo(p.id,youMsg(p)); }
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
  io.broadcast({t:'snap',day:Math.round(S.day*1e5)/1e5,pl,mo,b:bossState(),ev:events});
}
return {join,leave,receive,setPos,tick,state:S,monsters:MONS,players:S.players};
