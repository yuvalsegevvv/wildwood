//@ Client side of the protocol: hello, welcome, snapshots, events -> views, effects and UI; position updates
/* Messages from the server (see src/server/api.js):
   welcome{pid,day,dev,players[,look]}  mons{list}  you{level,exp,hp,maxHp,dmg,def,red,dead,gear}  tp{x,z,face}
   snap{day, n, pl:[[id,x,y,z,face,hp,maxHp,level,dead]], mo:[[id,x,z,face,hp,flags]], b:[[bossId,engaged,phase,immune,enraged,stunned,aux,mode]...], ev:[[kind,...]]} */
function playerName(){ let n=''; try{ n=localStorage.getItem('wildwood-name')||''; }catch(_){} return n; }
/* Your account code: made once in this browser. A server that keeps saves stores your progress under it,
   and the first time it sees the code it takes over this browser's save (that is how old progress moves over). */
function accountCode(){
  let a=''; try{ a=localStorage.getItem('wildwood-account')||''; }catch(_){}
  if(!/^[a-f0-9]{32}$/.test(a)){ const b=new Uint8Array(16); crypto.getRandomValues(b); a=[...b].map(x=>x.toString(16).padStart(2,'0')).join(''); try{ localStorage.setItem('wildwood-account',a); }catch(_){} }
  return a;
}
function netHello(){
  NET.send&&NET.send(Object.assign({t:'hello',acct:accountCode(),name:NET.name||'Hiker',look:LOOK,save:{level:PL.level,exp:PL.exp,gear:GEAR}},NET.login||{}));
}
const NETH=Object.create(null), EVH=Object.create(null), SNAPH=Object.create(null);   // dungeons: handler tables feature files fill: NETH.<message>=msg=>.., EVH.<event>=e=>.., SNAPH.<snapshot field>=value=>..
function netHandle(msg){
  if(!msg||typeof msg!=='object') return;
  switch(msg.t){
    case 'welcome': onWelcome(msg); break;
    case 'mons': (msg.list||[]).forEach(addMonView); break;
    case 'you': applyYou(msg); break;
    case 'tp': dgOnTp(msg); P.x=msg.x; P.z=msg.z; P.inTun=inTunnelBore(P.x,P.z); P.y=getH(P.x,P.z); P.vx=P.vz=P.vy=0; P.face=P.yaw=msg.face; playerUp(); break;   // dungeons: dgOnTp builds or tears down the run's view (msg.dg) before the floor is read (dungeon/run.js)
    case 'snap': applySnap(msg); break;
    case 'auth': onAuth(msg); break;
    case 'authfail': onAuthFail(msg); break;
    default: if(NETH[msg.t]) NETH[msg.t](msg); break;   // dungeons: messages added by feature files
    case 'kicked': NET.ready=false; NET.kicked=true; if(NET.ws) try{ NET.ws.close(); }catch(_){} $('#kicked').hidden=false; $('#kickedText').textContent=msg.text||'Disconnected.'; break;
  }
}
function onWelcome(msg){
  NET.pid=msg.pid; NET.dev=msg.dev; NET.ready=true; NET.lastMsg=performance.now();
  adoptLook(msg.look);
  clearMonViews(); clearRemotes(); clearBossVisuals(); CB.projs.forEach(p=>scene.remove(p.mesh)); CB.projs.length=0; CB.target=null;
  (msg.players||[]).forEach(remoteAdd);
  serverDay=msg.day; dayClock=msg.day;
  $('#tSec').hidden=!msg.dev; $('#acctSec').hidden=NET.mode!=='ws'; syncAcctSec();
  if(NET.onReady){ const f=NET.onReady; NET.onReady=null; f(); }
}
function applySnap(msg){
  if(msg.day!=null) serverDay=msg.day;
  if(msg.pl) applyPlayers(msg.pl,msg.n);
  if(msg.mo) msg.mo.forEach(applyMonSnap);
  if(msg.b) applyBossState(msg.b);
  if(msg.w) applyWeather(msg.w);
  for(const k in SNAPH) if(msg[k]!==undefined) SNAPH[k](msg[k]);   // dungeons: snapshot fields added by feature files (dg, ...)
  if(msg.ev) msg.ev.forEach(applyEvent);
}
function applyPlayers(pl,n){
  for(const a of pl){
    if(a[0]===NET.pid){ PL.hp=a[5]; PL.maxHp=a[6]; if(a[8]&&!PL.dead) playerDown(); continue; }
    remoteSnap(a);
  }
  NET.players=n||pl.length;   // pl holds only the players near you (and everyone once a second): n is the head count
  const on=$('#online'); on.hidden=NET.mode==='solo'; on.textContent=NET.players===1?'Only you in this world':NET.players+' players in this world';
}
function applyEvent(e){
  const me=NET.pid;
  switch(e[0]){
    case 'dmg': onMonDmg(e[1],e[2],e[3],e[4],e[5]); break;
    case 'imm': onMonImmune(e[1]); break;
    case 'kill': onMonKill(e[1],e[2]); break;
    case 'mact': onMonAct(e[1],e[2]); break;
    case 'aggro': { const m=MON_BY_ID.get(e[1]); if(m) monSound(m,'aggro'); break; }
    case 'respawn': { const m=MON_BY_ID.get(e[1]); if(m) monRespawned(m,e[2],e[3]); break; }
    case 'spawn': addMonView(e[1]); break;
    case 'despawn': removeMonView(e[1]); break;
    case 'proj': onProj(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8],e[9]); break;
    case 'pend': onProjEnd(e[1],e[2],e[3],e[4],e[5]); break;
    case 'tele': addTele(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8]); break;
    case 'tend': endTele(e[1],!!e[2],e[3],e[4]); break;
    case 'zone': onBossZone(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8]); break;
    case 'zend': endBossZone(e[1]); break;
    case 'wall': onBossWall(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8],e[9],e[10]); break;
    case 'wend': endBossWall(e[1]); break;
    case 'pfx': if(e[1]===me) onPfx(e[2],e[3],e[4],e[5]); break;
    case 'roar': bossRoar(e[1]); break;
    case 'warp': onWarp(e[1],e[2],e[3],e[4],e[5]); break;
    case 'vale': if(e[1]===me) onValeStep(e[2]); break;
    case 'north': if(e[1]===me) onNorthStep(e[2]); break;
    case 'node': onNodeEvent(e[1],e[2]); break;
    case 'gather': if(e[1]===me) onGatherEvent(e[2],e[3],e[4]); break;
    case 'cast': if(e[2]<0) dgCastEv(e); else if(e[1]===me) onCastEvent(e[2],e[3]); break;   // dungeons: cast [pid, -1 revive | -2 a kit's channel, s, target] is not a resource node (dungeon/party.js)
    case 'castx': if(e[1]===me) hideCast(); break;
    case 'pot': if(e[1]===me) onPotionEvent(e[2],e[3],e[4]); break;
    case 'craft': if(e[1]===me){ const it=ITEM[e[2]]; if(it){ forgeFx(it); if(!$('#shop').hidden) renderShop(); } } else { const r=REMOTES.get(e[1]), it=ITEM[e[2]]; if(r&&it&&it.rar>=2) toast(r.name+' crafted '+it.name+'!','loot r'+it.rar); } break;
    case 'brew': if(e[1]===me) UI_SFX.success(); break;
    case 'thunder': onThunder(e[1],e[2]); break;
    case 'weather': if(!e[1]&&WX.kind&&started) toast(WX.snow>0.5?'The snow is easing off.':'The rain is easing off.',''); break;
    case 'area': onArea(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8],e[9]); break;
    case 'buff': onBuff(e[1],e[2],e[3]); break;
    case 'aend': onAreaEnd(e[1]); break;
    case 'chain': onChain(e[1],e[2]); break;
    case 'beam': onBeam(e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8]); break;
    case 'skilldrop': if(e[1]===me) onSkillDrop(e[2]); break;
    case 'skillslot': if(e[1]===me){ UI_SFX.success(); if(e[2]!=='passive') flashSkillSlot(e[2]); } break;
    case 'skillbuy': case 'skillup': if(e[1]===me) UI_SFX.success(); break;
    case 'soul': if(e[1]===me){ UI_SFX.success(); spawnRing(2.2,parseInt(ELEMS[e[2]].col.slice(1),16),P.y+0.2); } break;
    case 'drop': onDrop(e[1],e[2],e[3],e[4]); break;
    case 'xp': if(e[1]===me){ const m=e[3]!=null?MON_BY_ID.get(e[3]):null; if(m){ const c=monCenter(m); popText(c.x,c.y+m.T.height*0.6,c.z,'+'+e[2].toFixed(1)+' XP','xp'); } } break;
    case 'coins': if(e[1]===me){ const m=MON_BY_ID.get(e[3]); if(m){ const c=monCenter(m); popText(c.x+0.4,c.y+m.T.height*0.35,c.z,'+'+e[2]+' coins','coin'); } } break;
    case 'loot': onLoot(e[1],e[2],e[3]); break;
    case 'merge': if(e[1]===me){ const it=ITEM[e[2]]; if(it) forgeFx(it); } else { const r=REMOTES.get(e[1]), it=ITEM[e[2]]; if(r&&it&&it.rar>=3) toast(r.name+' forged '+it.name+'!','loot r'+it.rar); } break;
    case 'lvup': if(e[1]===me) levelUpFx(e[2]); else remoteLevelUp(e[1],e[2]); break;
    case 'hurt': if(e[1]===me) hurtFx(e[2]); else remoteHurt(e[1],e[2]); break;
    case 'down': if(e[1]===me){ if(!PL.dead) playerDown(); } else remoteDown(e[1],true); break;
    case 'up': if(e[1]===me) playerUp(); else remoteDown(e[1],false); break;
    case 'toast': if(e[1]==null||e[1]===me){ toast(e[2],e[3]); if(e[1]==null&&e[3]==='good') UI_SFX.success(); } break;
    case 'qdone': if(e[1]===me) UI_SFX.notify(); break;
    case 'qturn': if(e[1]===me) UI_SFX.success(); break;
    case 'mq': if(e[1]===me) { if(e[3]===2) UI_SFX.success(); else UI_SFX.notify(); } break;   // a main quest step started (1) or handed in (2)
    case 'pact': if(e[1]!==me) remoteAct(e[1],e[2],e[3]); break;
    case 'pjoin': if(e[1].id!==me && !REMOTES.has(e[1].id)){ remoteAdd(e[1]); chatLine('sys',e[1].name,'joined the world'); } break;
    case 'pleave': { const r=REMOTES.get(e[1]); if(r){ chatLine('sys',r.name,'left the world'); remoteRemove(e[1]); } break; }
    case 'chat': onChat(e[1],e[2],e[3]); break;
    case 'pname': onRename(e[1],e[2],e[3]); break;
    case 'pgear': if(e[1]!==me) remoteGear(e[1],e[2]); break;
    case 'plook': if(e[1]!==me) remoteLook(e[1],e[2]); break;
    default: if(EVH[e[0]]) EVH[e[0]](e); break;   // dungeons: events added by feature files (pty, dgi, dgo, dgb, dge, ...)
  }
}
// an item dropped: epic or better gets the beam, banner and jingle; everyone hears about unique and legendary finds
function onLoot(pid,id,monId){
  const it=ITEM[id]; if(!it) return;
  const m=monId!=null?MON_BY_ID.get(monId):null;
  if(pid===NET.pid){
    if(it.rar>=2){ const x=m?m.x:P.x, z=m?m.z:P.z; luckyFx(x,getH(x,z),z,it.rar,true,it); }
    else UI_SFX.pickup();
  } else {
    const r=REMOTES.get(pid); if(!r) return;
    if(it.rar>=2 && r.g.visible){ const x=m?m.x:r.x, z=m?m.z:r.z; luckyFx(x,getH(x,z),z,it.rar,false,it); }
    if(it.rar>=3) toast(r.name+' found '+it.name+'!','loot r'+it.rar);
  }
}
// your position goes to the server 10 times a second (room: in presence, others: as a message)
let posT=0, lookT=0, lookDirty=false;
function netTick(dt){
  if(!NET.ready) return;
  // a server that stopped answering (a closed socket is caught by onclose); after a long frame gap (a tab that was asleep) give it time to deliver what it sent
  if(NET.mode==='ws'&&started){ if(dt>1.5) NET.lastMsg=performance.now(); else if(performance.now()-NET.lastMsg>NET_STALL_MS){ netDown('The world server stopped answering. Reconnect to carry on (your progress is kept on the server).'); return; } }
  if(lookDirty){ lookT-=dt; if(lookT<=0){ lookDirty=false; netSend({t:'look',look:LOOK}); } }   // also while creating a hiker, before the game starts
  if(!started) return;
  posT-=dt;
  if(posT<=0 && !PL.dead){
    posT=0.1;
    const p=[P.x,P.y,P.z,P.face,P.vx,P.vz].map(v=>Math.round(v*100)/100);
    if(NET.mode==='room'&&!NET.host) NET.room.presence({p}).catch(()=>{});
    else netSend({t:'pos',p});
  }
}
function netLookChanged(){ lookDirty=true; lookT=0.6; }
