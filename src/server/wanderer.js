//@ The Wanderer's paths on the server: the active path (gear.bd.wanderer.path), changing it (bd {a:'path'}), and the path passive and burst the Wanderer's tree makes his (pa1, bu1)
/* Agent map (skills revamp step 18; the registry and the rules: shared/wanderer.js; design: PLAN sections 3 and 7; test: tools/bond-smoke.js, the paths block; hooks: grep -rn "// wanderer:" src).
   SAVED: gear.bd.wanderer = {r: Realization (recomputed, server/bond.js), path: a known path id (wdPathClean; default WD_DEFAULT)}.
   MESSAGE: bd {a:'path', id} (MSG.bd -> wdPathP): change the active path. Free, any time; the tree (gear.awk.wanderer) and the Realization stay. A worn path passive / burst is swapped for the new path's.
          Returns null when changed (or already active), else the reason (an unknown id: no toast, it is junk). Toast; p.dirty; recalcP (the you update carries gear.bd and gear.skills).
   DERIVED (wdSyncG(gear), from sanitizeGear and recalcP before the trees' levels): the active path's passive 'wd_<path>' is in gear.skills.owned while the Wanderer's pa1 is bought, every other path's
          passive (and any Realization row id) is taken out of owned and the passive slot; gear.skills.wdu = 'wd_<path>' (the burst ultOwned accepts) while bu1 is bought, else null; a worn burst of
          another path is taken off. Nothing of it is trusted from a save. The levels: the path passive is a general passive (the pa branch, awkSyncG), the burst the bu branch (awkUltLvP maps
          'wd_<path>' to the Wanderer's tree), both +1 at Realization III and V (server/bond.js).
   PIECES: the active path's own basic / skill / power (shared/wanderer.js WD_PIECE_OF, placeholders) are owned for every class; another path's are dropped and a worn one swapped for this path's.
   ON THE PATH (wdOnPathP): the Wanderer's Realization works like a Bond: min(Realization, the path's pieces worn) - the off-path pieces worn (server/bond.js).
   IN FORCE only while the Wanderer is the character played (wdMainOk: gear.skills.bdx.main): passiveSum, ssRefreshP and ultEquippedP ask it. */
const wdPathClean=w=>w&&typeof w==='object'&&wdPathOk(w.path)?w.path:WD_DEFAULT;
function wdSyncG(gear){
  const sk=gear&&gear.skills; if(!sk||!Array.isArray(sk.owned)) return;
  const k=wdPathOf(gear), want=k&&awkBranchLv(gear,AWK_WANDERER,'pa')>=1?wdPassId(k):null;
  for(const q of WD_ORDER){ const P=WD_PATHS[q];
    for(const id of [P.passive,P.real[1],P.real[4]]){ if(id===want) continue;
      const i=sk.owned.indexOf(id); if(i>=0) sk.owned.splice(i,1);
      if(Array.isArray(sk.pass)) for(let j=0;j<sk.pass.length;j++) if(sk.pass[j]===id) sk.pass[j]=null;
      if(sk.lv) delete sk.lv[id]; } }
  if(want&&!sk.owned.includes(want)) sk.owned.push(want);
  const P=k&&WD_PATHS[k];   // wanderer: the active path's own actives are owned (every class), every other path's are not; a worn one of another path is swapped for this path's in the same place
  for(const id of Object.keys(WD_PIECE_OF)){ const w=WD_PIECE_OF[id]; if(P&&w.path===k){ if(!sk.owned.includes(id)) sk.owned.push(id); continue; }
    const i=sk.owned.indexOf(id); if(i>=0) sk.owned.splice(i,1);
    const e=sk.eq&&sk.eq[w.cls]; if(e&&e[w.slot]===id) e[w.slot]=P&&P.pieces[w.cls]&&P.pieces[w.cls][w.slot]||null; }
  sk.wdu=k&&awkBranchLv(gear,AWK_WANDERER,'bu')>=1?wdUltId(k):null;
  if(wdIsUlt(sk.ult)&&sk.ult!==sk.wdu) sk.ult=null;
}
// the Wanderer's pieces worn on and off the active path (server/bond.js bdRefreshP): the path's basic / skill / power, its passive, a general charge skill and its burst are on the path;
// any other piece worn in those places (a shop skill, a general passive, a character's piece) is off it. The basic slot always holds something (the class default when empty).
function wdOnPathP(p){
  const g=p.gear, sk=g.skills, cls=clsOfP(p), L=p.level, k=wdPathOf(g), r={on:0,off:0}; if(!sk||!sk.eq||!k) return r;
  const tick=b=>{ if(b) r.on++; else r.off++; };
  for(const slot of SLOTS){ const ab=abilityOf(cls,slot,sk,L); if(ab) tick(ab.wd===k); }
  if(Array.isArray(sk.pass)) for(const id of sk.pass.slice(0,passiveOpen(L))){ if(id&&sk.owned.includes(id)) tick(id===wdPassId(k)); }
  const c=caveSkillDef(sk.cave); if(c&&L>=CAVE_SLOT_LV&&g.cave&&Object.prototype.hasOwnProperty.call(g.cave.own,sk.cave)) tick(!c.set);
  if(!p.pv&&L>=ULT_LV&&sk.ult) tick(sk.ult===sk.wdu);
  return r;
}
function wdPathP(p,id){
  if(!wdPathOk(id)) return 'unknown path';
  const g=p.gear, B=g.bd||(g.bd={}), W=B[BD_WANDERER]&&typeof B[BD_WANDERER]==='object'?B[BD_WANDERER]:(B[BD_WANDERER]={r:bdRealOf(g)}), was=wdPathOf(g);
  if(was===id) return null;
  const sk=g.skills, slot=was?sk.pass.indexOf(wdPassId(was)):-1, wornU=!!was&&sk.ult===wdUltId(was);
  W.path=id; wdSyncG(g);
  if(slot>=0&&sk.owned.includes(wdPassId(id))) sk.pass[slot]=wdPassId(id);   // the new path's passive takes the old one's slot
  if(wornU&&sk.wdu===wdUltId(id)) sk.ult=sk.wdu;   // ... and its burst the burst slot
  recalcP(p); p.dirty=true;
  toastTo(p.id,'The Wanderer walks the path of '+WD_PATHS[id].name+' now','good');
  return null;
}
