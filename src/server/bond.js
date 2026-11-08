//@ Bonds on the server: gear.bd (each character's Bond and Bondstones, the Wanderer's Realization), buying a Bond step (MSG.bd), stones in and their overflow into coins, the active Bond and what it gives (gear.skills.bdx), the smv-3 migration
/* Agent map (skills revamp step 12; the rules and numbers: shared/bond.js; design: PLAN sections 0, 3, 7, 9; test: tools/bond-smoke.js; hooks: grep -rn "// bond:" src).
   SAVED: gear.bd = {<set id>: {b: -1..6, st: 0..BD_ST_MAX}, wanderer: {r: 0..6, path: the active path (server/wanderer.js)}} (bdSanitize: play = the character picked to play; known set ids only (own-property checks, no dev set), numbers clamped, an empty entry dropped;
          the Realization is recomputed from the main quest (bdRealOf), never trusted from the save).
   MESSAGE: bd {a:'buy', set} (MSG.bd -> bdBuyP): the next Bond step: Bond b+1's stones (BD_COST) and its zone tier in the set's land (bdTierOk: gear.zt[land].max). Returns null when bought, else the reason
          (also toasted). Event bd [pid, set, b]; p.dirty; recalcP. Bond 0 grants the character's actives (every class version of its basic, skill and power: bdGrantActivesP).
   STONES: bdAddStonesP(p, set, n) (step 13's orbs call it): the stones the remaining steps still need are kept, the rest become coins (BD_STONE_COINS each). Returns {st, coins}.
   OWNING: bdOwns(p, set) = Bond 0 or above (server/awakening.js asks it before every purchase). Step 13 narrowed the interim rule: one piece earned the old way (ssGrantP from a drop source, ssClearP) is only a piece, Bond 0 is bought with Bondstones
          (orbs: server/bond-orbs.js); a WHOLE-set grant (ssGrantSetP: the testing tools, the gem shop's outfit sets, tests) and dev 'ult' still give Bond 0; the smv-3 migration gives it to every old owner.
   MAIN CHARACTER (bdMainOf): gear.bd.play when set (bd {a:'play', set}: an owned set id or 'wanderer'; null clears it), else the set of the worn power piece (slot 3, code id 'burst'), else the set with the most pieces worn (ties: the first in SS_ORDER), else the Wanderer. Used by server/awakening.js (the stat nodes).
   WORN (bdWornP): the class in hand's basic / skill / power (abilityOf) and the open passive slot (as ssCount counts them), plus the worn charge skill (the cave slot, from its level) and the worn burst
          (when it can be cast, ultEquippedP): six places, so Bond V / VI can be active.
   ACTIVE BOND (bdRefreshP, called by recalcP after the trees' levels): act = min(Bond, main's pieces worn) - guests (each worn piece of another character); written into gear.skills.bdx (shared/bond.js).
          act >= 1 / 4: the Bond passive works at BD_PASS_LV; >= 2 / 6: the 3- / 5-set row; >= 3 and >= 5: +1 level each to every piece of the main character (owned actives, the kept passive,
          its charge skill, its burst 'u:<set>'). A guest piece: -BD_GUEST_PEN levels (floor 1), none of its own Bond. The Wanderer as main: Realization in place of the Bond (no guests), +1 at III and V
          to every general skill owned (shop and class skills, general passives, general charge skills); BD_WANDERER_ROWS gives the active path's rows for I / II / IV / VI (shared/wanderer.js), and III / V also raise the path's burst ('u:wd_<path>').
   MIGRATION (bdMigrateG, smv 3, from smigSanitize): every set in gear.bdMig and every set of which a piece is owned (an active, a passive, its charge skill) gets Bond 0 at least. Only raises: idempotent.
   TESTING: bdGrantP(p, set, b, st) (dev 'bd' {v: set id | 'all', n: Bond, s: stones}; the test world: Bond VI everywhere). */
const bdOwn=bdOwnKey;
const bdEntry=(gear,k)=>gear&&bdOwn(gear.bd,k)&&k!==BD_WANDERER?gear.bd[k]:null;
const bdEntryW=(gear,k)=>bdEntry(gear,k)||(gear.bd[k]={b:-1,st:0});   // (never called with 'wanderer' / 'pick' / 'chg': callers ask bdSetOk first)
const bdOf=(gear,k)=>{ const e=bdEntry(gear,k); return e?e.b:-1; };
const bdOwns=(p,k)=>bdSetOk(k)&&bdOf(p.gear,k)>=0;
// ---- saves ----
function bdSanitize(g,out){   // sanitizeGear: gear.bd from a save (before the migration)
  const raw=g&&g.bd&&typeof g.bd==='object'&&!Array.isArray(g.bd)?g.bd:null, B={};
  if(raw) for(const k of Object.keys(raw).slice(0,64)){ if(!bdSetOk(k)) continue; const e=raw[k]; if(!e||typeof e!=='object') continue;
    const b=clampInt(e.b,-1,BD_TOP,-1), st=clampInt(e.st,0,BD_ST_MAX,0), o=clampInt(e.o,0,BD_ORB_MAX,0); if(b>=0||st>0||o>0){ B[k]={b,st}; if(o) B[k].o=o; } }
  B[BD_WANDERER]={r:bdRealOf(out),path:wdPathClean(raw&&raw[BD_WANDERER])};   // (out.mq is sanitized before this runs)   // wanderer: the active path (server/wanderer.js)
  if(raw){ const ck=clampInt(raw.chg,0,BD_STIR_CHARGE,0); if(ck) B.chg=ck; if(bdSetOk(raw.pick)) B.pick=raw.pick; if(raw.play===BD_WANDERER||bdSetOk(raw.play)) B.play=raw.play; }   // bond: the Stirrings' charge and the orb pouch's pick (server/bond-orbs.js, bond-stir.js)
  out.bd=B;
}
function bdMigrateG(gear){   // smv 3: Bond 0 for every set an old save owned a piece of (see the agent map)
  if(!gear.bd) gear.bd={[BD_WANDERER]:{r:0}};
  const sets=new Set(Array.isArray(gear.bdMig)?gear.bdMig:[]), sk=gear.skills, own=gear.cave&&gear.cave.own||{};
  for(const id of sk.owned){ const pc=SS_PIECE_OF[id]; if(pc) sets.add(pc.set); }
  for(const id of Object.keys(own)){ const c=caveSkillDef(id); if(c&&c.set) sets.add(c.set); }
  for(const k of SS_ORDER) if(sets.has(k)) bdOwnZeroG(gear,k);
}
function bdOwnZeroG(gear,k){ if(!bdSetOk(k)) return false; const e=bdEntryW(gear,k); if(e.b>=0) return false; e.b=0; return true; }
// ---- buying ----
function bdGrantActivesP(p,k){   // Bond 0: the character's basic, skill and power, every class version
  const own=p.gear.skills.owned, S=SS_SETS[k]; let n=0;
  for(let q=1;q<=3;q++) for(const id of S.pos[q].ids) if(!own.includes(id)){ own.push(id); n++; }
  if(n){ awkSyncG(p.gear); ultCheckP(p); }
  return n;
}
function bdRefuse(p,why){ toastTo(p.id,why,'bad'); return why; }
function bdBuyP(p,k){
  if(!bdSetOk(k)) return 'unknown character';
  const S=SS_SETS[k], cur=bdOf(p.gear,k), to=cur+1, nm=S.char.name;
  if(to>BD_TOP) return bdRefuse(p,nm+' is already at Bond VI');
  if(!bdTierOk(p.gear,S,to)) return bdRefuse(p,'Bond '+BD_ROMAN[to]+' needs zone tier '+ZTIER_ROMAN[bdTierNeed(S,to)]+' in '+ZTIER_NAMES[S.land]+' (defeat its second boss there)');
  const e=bdEntryW(p.gear,k), need=BD_COST[to];
  if(e.st<need) return bdRefuse(p,'Bond '+BD_ROMAN[to]+' needs '+need+' of '+nm+'\'s Bondstones (you have '+e.st+')');
  e.st-=need; e.b=to;
  if(to===0) bdGrantActivesP(p,k);
  toastTo(p.id,to===0?nm+' is yours (Bond 0): their basic, skill and power are in your skills panel':nm+' reached Bond '+BD_ROMAN[to]+'!','good');
  recalcP(p); p.dirty=true; ev('bd',p.id,k,to); return null;
}
MSG.bd=(p,msg)=>{ if(msg.a==='buy'&&typeof msg.set==='string') bdBuyP(p,msg.set); else if(msg.a==='orb') bdOrbBuyP(p,msg.set,msg.n); else if(msg.a==='pick') bdPickP(p,msg.set); else if(msg.a==='path') wdPathP(p,msg.id); else if(msg.a==='play') bdPlayP(p,msg.set); };   // (orb, pick: server/bond-orbs.js)   // wanderer: path (server/wanderer.js)
// stones in (step 13's orbs): what the steps left still need is kept, the rest is paid out in coins
function bdAddStonesP(p,k,n,quiet){
  n=clampInt(n,0,BD_ST_MAX,0); if(!bdSetOk(k)||!n) return {st:0,coins:0};
  const e=bdEntryW(p.gear,k), room=Math.max(0,Math.min(BD_ST_MAX,bdStonesLeft(e.b))-e.st), keep=Math.min(n,room), coins=(n-keep)*BD_STONE_COINS;
  e.st+=keep; if(coins) p.gear.coins=Math.min(COINS_MAX,p.gear.coins+coins);
  p.dirty=true; if(!quiet) toastTo(p.id,(keep?'+'+keep+' '+SS_SETS[k].char.name+' Bondstone'+(keep===1?'':'s'):'')+(keep&&coins?', ':'')+(coins?'+'+coins+' coins (Bondstones beyond Bond VI)':''),'good');
  return {st:keep,coins};
}
// ---- what the active Bond gives ----
// the pieces worn by the class in hand: {n: {set: count}, ids: {set: [skill / cave ids, 'u:<set>' for the burst]}}
function bdWornP(p){
  const sk=p.gear.skills, cls=clsOfP(p), L=p.level, n={}, ids={}, put=(set,id)=>{ n[set]=(n[set]||0)+1; (ids[set]||(ids[set]=[])).push(id); };
  if(!sk||!sk.eq||!SS_ORDER.length) return {n,ids};
  for(const slot of SLOTS){ const ab=abilityOf(cls,slot,sk,L); if(ab&&ab.set) put(ab.set,ab.id); }
  if(Array.isArray(sk.pass)) for(const id of sk.pass.slice(0,passiveOpen(L,sk))){ const P=PASSIVES[id]; if(P&&P.set&&sk.owned.includes(id)&&L>=Math.max(PASSIVE_LV,P.lv)) put(P.set,id); }
  const cid=sk.cave, c=caveSkillDef(cid); if(c&&c.set&&L>=CAVE_SLOT_LV&&p.gear.cave&&bdOwn(p.gear.cave.own,cid)) put(c.set,cid);
  if(!p.pv&&L>=ULT_LV){ const u=ultSetOfP(p); if(u&&awkBranchLv(p.gear,u,'bu')>=1) put(u,'u:'+u); }
  return {n,ids};
}
function bdMainOfW(p,W){
  const pl=p.gear.bd&&p.gear.bd.play; if(pl===BD_WANDERER) return BD_WANDERER; if(bdSetOk(pl)&&bdOf(p.gear,pl)>=0) return pl;   // the character picked to play (bdPlayP), else the old rule
  const ab=abilityOf(clsOfP(p),'burst',p.gear.skills,p.level); if(ab&&ab.set) return ab.set;
  let best=BD_WANDERER, bn=0; for(const id of SS_ORDER) if((W.n[id]|0)>bn){ best=id; bn=W.n[id]; }
  return best;
}
const bdMainOf=p=>bdMainOfW(p,bdWornP(p));   // the character played (see the agent map)
function bdRefreshP(p){
  const g=p.gear, sk=g.skills; if(!sk||!Array.isArray(sk.owned)) return;
  const W=bdWornP(p), main=bdMainOfW(p,W), X={main,act:-1,g:0,p:{},r:[],lv:{}};
  const own=g.cave&&g.cave.own||{};
  if(main!==BD_WANDERER){
    const S=SS_SETS[main]; let guests=0; for(const k of Object.keys(W.n)) if(k!==main) guests+=W.n[k];
    X.g=guests;
    if(S.bonds){
      X.act=Math.max(-1,Math.min(bdOf(g,main),W.n[main]|0)-guests);
      const add=(X.act>=3?1:0)+(X.act>=5?1:0);
      if(X.act>=1) X.p[S.bonds[1]]=BD_PASS_LV; if(X.act>=4) X.p[S.bonds[4]]=BD_PASS_LV;
      if(X.act>=2) X.r.push(S.bonds[2]); if(X.act>=6) X.r.push(S.bonds[6]);
      if(add){
        for(let q=1;q<=3;q++) for(const id of S.pos[q].ids) if(sk.owned.includes(id)) X.lv[id]=add;
        if(S.keptPassive&&sk.owned.includes(S.keptPassive)) X.lv[S.keptPassive]=add;
        for(const id of Object.keys(own)){ const c=caveSkillDef(id); if(c&&c.set===main) X.lv[id]=add; }
        X.lv['u:'+main]=add;
      }
    }
    for(const k of Object.keys(W.ids)) if(k!==main) for(const id of W.ids[k]) X.lv[id]=-BD_GUEST_PEN;
  } else {
    const R=bdRealOf(g), on=wdOnPathP(p); X.g=on.off; X.on=on.on; X.act=Math.max(0,Math.min(R,on.on)-on.off); if(g.bd){ const W=g.bd[BD_WANDERER]; if(W&&typeof W==='object') W.r=R; else g.bd[BD_WANDERER]={r:R}; }   // (the path stays: server/wanderer.js)
    const add=(X.act>=3?1:0)+(X.act>=5?1:0), pk=wdPathOf(g);   // wanderer: Realization works like a Bond: min(Realization, the path's pieces worn) - the off-path pieces worn
    if(add){
      for(const id of sk.owned){ const w=WD_PIECE_OF[id]; if((w&&w.path===pk)||id===wdPassId(pk)) X.lv[id]=add; }
      for(const id of Object.keys(own)){ const c=caveSkillDef(id); if(c&&!c.set) X.lv[id]=add; }
      if(sk.wdu) X.lv['u:'+sk.wdu]=add;   // wanderer: the path's burst
    }
    for(const n of [1,2,4,6]){ const f=BD_WANDERER_ROWS[n]; if(X.act<n||typeof f!=='function') continue;   // wanderer: the active path's rows (shared/wanderer.js wdRealRows)
      const o=f(g)||{}; if(o.p) for(const id of Object.keys(o.p)) if(bdOwn(PASSIVES,id)) X.p[id]=o.p[id]; if(Array.isArray(o.r)) X.r.push(...o.r); }
  }
  sk.bdx=X; p.bdMain=main;
  if(p.look) bdLookCheckP(p);   // bond: the free look follows the character played
}
// the character played: free, any time (the owner: Bonds should not follow the Power piece). set = an owned set id, 'wanderer', or null (back to the Power piece's rule)
function bdPlayP(p,k){
  const B=p.gear.bd||(p.gear.bd={});
  if(k===BD_WANDERER||(bdSetOk(k)&&bdOf(p.gear,k)>=0)) B.play=k; else if(k===null||k===undefined||k==='') delete B.play; else return false;
  wpnApplyP(p);   // wpn: the played character's class decides which carried weapon is in hand (eq.wpn[class]; the basic one when the slot is empty)
  if(k===BD_WANDERER) wdWearP(p); else if(bdSetOk(k)) ssEquipAllP(p,k);   // Play wears the character's whole set (the owner: their skills by default, a swap is a choice); ssEquipAllP toasts what it wore
  recalcP(p); p.dirty=true; return true;
}
// the outfits a hiker may wear for free, whole and unmodified: every character bonded (Bond 0+) that has an outfit (server/amber.js ambCleanLook)
function bdFreeOutfits(g){   // only the character you play now (the owner: the look is the active Bond's; changing who you play takes it off)
  const m=g&&g.skills&&g.skills.bdx&&g.skills.bdx.main, S=bdSetOk(m)?SS_SETS[m]:null;
  return S&&typeof S.outfit==='string'&&bdOf(g,m)>=0?[S.outfit]:[];
}
// after the main character changed: a free look of another character goes back to your own (the base model; your hair, face and colours stay)
function bdLookCheckP(p){
  const L=p.look; if(!L||typeof L.model!=='string'||L.model==='base') return;
  const c=ambCleanLook(L,p.gear.os,bdFreeOutfits(p.gear)); if(c.model!==L.model){ p.look=c; p.saveDirty=true; ev('plook',p.id,p.look); }
}
// ---- testing ----
function bdGrantP(p,k,b,st){
  if(!bdSetOk(k)) return false;
  const e=bdEntryW(p.gear,k), was=e.b; e.b=Math.max(e.b,clampInt(b,-1,BD_TOP,BD_TOP)); if(st!==undefined) e.st=clampInt(st,0,BD_ST_MAX,e.st);
  if(was<0&&e.b>=0) bdGrantActivesP(p,k);
  p.dirty=true; return true;
}
function bdDevP(p,msg){   // dev 'bd' {v: set id | 'all', n: Bond (default VI), s: stones}
  const ks=msg.v==='all'?SS_ORDER.filter(bdSetOk):[msg.v]; let n=0;
  for(const k of ks) if(bdGrantP(p,k,msg.n===undefined?BD_TOP:msg.n,msg.s)) n++;
  recalcP(p); toastTo(p.id,n?'Bonds: '+n+' character'+(n===1?'':'s')+' granted':'No such character (a set id or all)',n?'good':'bad');
}
