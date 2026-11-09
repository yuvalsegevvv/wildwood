//@ The Deep Cave's eight methods on the server, the shared part: every player's progress on the floor they stand on, the 10-minute cooldown, a completed method paying Echo Shards (its skill comes from the Awakening tree now), the state message to the client, the HUD line
/* Agent map. Plan: docs/CAVE.md sections 6, 7, 15 (protocol and rules). Test: tools/cave-smoke.js. Method rows (the numbers): shared/cave/method-<a..h>-*.js; the places: the floor's anchors (shared/cave-gen.js, doc section 14).
   The methods run on EVERY floor at once, for any number of players: nothing here is per floor except the anchors it reads (caveAW(n): the floor's anchors in world metres) and the dress. Each player has p.cm (not saved) =
   {n floor, A, B, C, D, E, H progress of their own method runs; F and G are floor-wide (caveMFl(n): the tremor clock and the gem mole)}. Reset when you change floor. Only a hiker of level 23+ on a floor runs them.
   Saved (caveSanitizeSave, server/cave.js): gear.cave.cd['<floor><M>'] (epoch seconds when the method is ready again), .done (completions), (Echo Shards: gear.awm.echo, spent by the Awakening tree).
   exports: caveAW(n), caveMTickP(p) (caveTickP calls it each tick), caveMethodDoneP(p, floor, method) (a method finished: records it, starts the cooldown, pays caveShardsP), caveShardsP(p, floor) (C3 fills this in:
            adds CAVE_SHARDS[floor] to gear.awm.echo), caveCdLeft(p, floor, method), caveMTell(p, M, key, text, kind), caveMMovePTo(p, x, z), caveMFl(n) (the floor's shared state), caveMDoneP(p, M, m).
   Messages: server to client {t:'cm', f: floor (0 = you left the floors), hud: one line of text, cd: {M: seconds left}, a, b, c, d, e, fv, g, h: the props' states} (docs/PROTOCOL.md). No message from the client: everything is proximity.
   Every method file is named in the tick below, in this order: A murals, B geodes (also caveGeodeHitS, from resolveHitS), C echo trial, D lantern, E silent chamber, F collapse (floor-wide), G gem mole (floor-wide), H crafting. */
const CAVE_MAW=Object.create(null);
function caveAW(n){   // the floor's anchors with world coordinates (cached)
  if(CAVE_MAW[n]) return CAVE_MAW[n];
  const B=caveBake(n), o=caveFloorOrigin(n), A=B.anchors, w=q=>Object.assign({},q,{x:o.x+q.x,z:o.z+q.z}), ws=l=>l.map(w);
  const sil=B.chambers.find(c=>c.role==='silent');
  return CAVE_MAW[n]={start:w(A.start),lift:w(A.lift),A:{wall:w(A.A.wall),pieces:ws(A.A.pieces)},B:{geodes:ws(A.B.geodes)},C:{plinth:w(A.C.plinth)},D:{crystal:w(A.D.crystal),altar:w(A.D.altar)},
    E:{entry:w(A.E.entry),shrine:w(A.E.shrine),guard:w(A.E.guard),exit:w(A.E.exit),r:sil?sil.r:9},S:{nodes:ws(A.S.nodes)},G:{burrows:ws(A.G.burrows),holes:ws(A.G.holes)},H:{veins:ws(A.H.veins),herbs:ws(A.H.herbs),anvil:w(A.H.anvil)}};
}
const caveMd=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const caveNow=()=>Date.now()/1000;
function caveGearP(p){ const g=p.gear.cave; if(!g.cd) g.cd={}; if(!g.done) g.done={}; return g; }
function caveCdLeft(p,n,m){ const t=caveGearP(p).cd[n+m]; return t>0?Math.max(0,t-caveNow()):0; }
function caveMNew(n){
  return {n,lt:S.t,sent:'',sendT:-9,tell:{},A:{got:0},B:{st:[0,0,0],au:[null,null,null]},C:{s:0,t0:0,hold:0,mons:[],lock:0,ok:0,tot:0,why:'',left:0},
    D:{s:0,hits:0,lh:0,out:0},N:{cast:null,safe:false},E:{s:0,z:0,act:null,lock:0,wake:0},H:{ore:0,herb:0,vm:0,hm:0,cast:null,carve:0}};
}
function caveMTell(p,M,key,text,kind){ if(S.t-(M.tell[key]||-99)<5) return; M.tell[key]=S.t; toastTo(p.id,text,kind||''); }
function caveMMovePTo(p,x,z){ p.x=x; p.z=z; p.y=getH(x,z); p.vx=p.vz=0; p.act=null; sendTo(p.id,{t:'tp',x,z,face:p.face||0}); }
// ---- a method is finished ----
function caveMethodDoneP(p,floor,method){
  const g=caveGearP(p), key=floor+method, sk=caveSkillAt(floor,method), M=caveMethodDef(method);
  const first=!(g.done[key]|0);   // a first completion of this method on this floor pays a Sigil
  g.done[key]=Math.min(99999,(g.done[key]|0)+1); g.cd[key]=caveNow()+CAVE_METHOD_CD; p.dirty=true;
  { const xp=Math.round(xpFor(p.level)*CAVE_XP_KILLS[floor]); if(xp>0){ gainExpP(p,xp); toastTo(p.id,'+'+xp+' XP: '+M.name+' complete','good'); } }   // every completion pays XP that grows with your level, on top of the skill or shards
  if(first){ const a=CAVE_SIGIL_FIRST[floor]|0; if(a>0){ p.gear.sig=(p.gear.sig|0)+a; toastTo(p.id,'+'+a+' Sigil: first time finishing '+M.name+' (offer them at the statue in Glasswell)','good'); } }
  caveShardsP(p,floor,sk);   // awakening: a method no longer grants its skill (the charge branch's ch1 does): it always pays Echo Shards
}
// the Echo Shards a completion pays (every completion: the skill itself is the Awakening tree's ch1 now)
function caveShardsP(p,floor,sk){
  const w=p.gear.awm||(p.gear.awm={}), n=CAVE_SHARDS[floor]|0; w.echo=Math.min(AWK_STORE_MAX,(w.echo|0)+n);   // awakening: Echo Shards live in gear.awm (the Awakening tree's basic, skill and power branches spend them)
  toastTo(p.id,'+'+n+' Echo Shard'+(n===1?'':'s')+' · '+w.echo+' in all','good'); p.dirty=true; ev('caveshards',p.id,n,w.echo);
}
function caveMDoneP(p,M,m){ caveMethodDoneP(p,M.n,m); M.sent=''; M.sendT=-9; }
// ---- floor-wide state: the tremor clock (F) and the gem mole (G) ----
const CAVE_MG={t:-1,fl:Object.create(null)};
function caveMFl(n){ return CAVE_MG.fl[n]||(CAVE_MG.fl[n]={live:false,moleNext:0,mole:null}); }
function caveMGlobalS(){
  if(CAVE_MG.t===S.t) return; CAVE_MG.t=S.t;
  const dt=0.05, pop={}; for(const q of S.players.values()){ const n=caveFloorAt(q.x,q.z); if(n>=0&&!q.pv&&q.level>=CAVE_SLOT_LV) pop[n]=(pop[n]|0)+1; }
  for(const n of CAVE_FLOOR_N){ const G=caveMFl(n);
    if(!pop[n]){ if(G.live){ G.live=false; if(G.mole){ removeMonS(G.mole); G.mole=null; } } continue; }   // nobody there: the floor sleeps (its tremor and mole start fresh when someone comes)
    if(!G.live){ G.live=true; G.moleNext=S.t+caveMethodDef('G').p.first; G.warned=false; }
    caveMGTickS(n,G,dt); }
}
function caveMTickP(p){
  const n=caveFloorAt(p.x,p.z);
  if(n<0){ if(p.cm){ if(p.cm.n) sendTo(p.id,{t:'cm',f:0}); caveMLeaveP(p,p.cm); p.cm=null; } return; }
  caveMGlobalS();
  if(p.pv||p.level<CAVE_SLOT_LV) return;
  let M=p.cm; if(!M||M.n!==n){ if(M) caveMLeaveP(p,M); M=p.cm=caveMNew(n); }
  const dt=Math.min(0.25,Math.max(0,S.t-M.lt)); M.lt=S.t;
  if(p.dead) caveMDownP(p,M);
  else { caveMATickP(p,M); caveMCTickP(p,M,dt); caveMDTickP(p,M); caveMETickP(p,M,dt); caveMHTickP(p,M,dt); }
  caveEnTickP(p,M,dt);   // energy: drain, low-bar damage, shard nodes (server/cave/energy.js)
  caveMSendP(p,M);
}
function caveMDownP(p,M){ M.N.cast=null; M.D.s=0; M.E.s=0; M.E.z=0; M.H.cast=null; M.H.carve=0; caveMCClear(M,'You were knocked out.'); }
function caveMLeaveP(p,M){ caveMCClear(M,''); }
// ---- what the client is told ----
function caveMHudP(p,M){
  const n=M.n, W=caveMethodDef;
  if(M.E.s) return 'Silent chamber: noise '+Math.round(M.E.z)+'%';
  if(M.D.s) return 'Glow crystal: carry it to the altar ('+(W('D').p.hits-M.D.hits)+' hits left)';
  if(M.C.s) return 'Echo trial: '+M.C.why;
  const fl=caveMFl(n);
  if(fl.mole&&!fl.mole.dead&&!caveCdLeft(p,n,'G')) return 'A gem mole is running! Catch it';
  if(M.A.got&&!caveCdLeft(p,n,'A')) return M.A.got===31?'Mural: all five pieces. Touch the wall':'Mural pieces '+caveBits(M.A.got)+' of 5';
  const bs=M.B.st.filter(x=>x===1).length; if(bs&&!caveCdLeft(p,n,'B')) return 'Geodes cracked '+bs+' of 3';
  const H=M.H; if(H.ore||H.herb){ const P=W('H').p; return H.ore>=P.ore&&H.herb>=P.herb?'Crafting: take it to the stone anvil':'Crafting: ore '+H.ore+'/'+P.ore+', herbs '+H.herb+'/'+P.herb; }
  return '';
}
const caveBits=v=>{ let n=0; for(;v;v>>=1) n+=v&1; return n; };
function caveMSendP(p,M){
  const n=M.n, fl=caveMFl(n), v={t:'cm',f:n,hud:caveMHudP(p,M)}, cd={};
  for(const m of CAVE_METHODS){ if(m===CAVE_METHOD_OFF) continue; const l=Math.ceil(caveCdLeft(p,n,m)); if(l>0) cd[m]=l; }
  if(Object.keys(cd).length) v.cd=cd;
  v.a=M.A.got; v.b=M.B.st.map((s,i)=>s?1:M.B.au[i]&&M.B.au[i].until>S.t?2:0);
  v.c={s:M.C.s,k:M.C.ok,n:M.C.tot}; v.d={s:M.D.s,h:M.D.hits}; v.e={s:M.E.s,z:Math.round(M.E.z),w:M.E.wake>S.t?1:0};
  v.fv={o:0,w:0};   // (the Collapse run's vault is gone: the field stays so an old client still reads the message)
  caveEnSendP(p,M,v);
  v.g=fl.mole&&!fl.mole.dead?fl.mole.id:0; v.h={vm:M.H.vm,hm:M.H.hm,o:M.H.ore,b:M.H.herb,c:M.H.cast?1:0};
  const s=JSON.stringify(v);
  if(s!==M.sent&&S.t-M.sendT>=0.2){ M.sent=s; M.sendT=S.t; sendTo(p.id,v); }
}
