//@ Skill sets on the server: granting a set's pieces, wearing a piece for all three classes, the loadout cache p.ss (the sets worn and their bonuses)
/* Agent map. Plan: docs/SKILL-SETS.md; the registry and the checks are shared/skillsets.js; test: tools/skillsets-smoke.js.
   Exports: ssGrantP(p,setId,pos) / ssGrantSetP(p,setId) (the pieces of a position / of the whole set go into gear.skills.owned: a piece is every class version of the active and its passive),
   ssEquipPieceP(p,s) (wear the piece of skill row s for each class that owns its version), ssRefreshP(p) (the cache p.ss = {n:{setId:count}, bonus:[{set,tier,row}]}, rebuilt by recalcP:
   when a piece is worn, a passive moves, the class or the level changes).
   Used by: economy.js (equipSkillP, unequipSkillP, buySkillP, upgradeSkillP, the testing tool 'set'), players.js (recalcP, psP, sanitizeSkills). A piece is earned (M3's sources, not built yet) or given by the testing tool:
   never free, never bought, never upgraded in v1. Events: ssget [pid, setId, pos]. */
function ssPieceIdsOf(setId,pos){ const S=SS_SETS[setId], P=S&&S.pos[pos]; return P?[...P.ids,P.passive]:[]; }
function ssGrantP(p,setId,pos){
  const own=p.gear.skills.owned; let n=0;
  for(const id of ssPieceIdsOf(setId,pos)) if(!own.includes(id)){ own.push(id); n++; }
  if(n){ p.dirty=true; ev('ssget',p.id,setId,pos); }
  return n;
}
function ssGrantSetP(p,setId){ let n=0; for(let pos=1;pos<=3;pos++) n+=ssGrantP(p,setId,pos); return n; }
// wear the piece of skill row s in its slot for every class that owns a version of it (one action for all three: a weapon swap must not silently drop the set)
function ssEquipPieceP(p,s){
  const S=p.gear.skills, P=SS_SETS[s.set].pos[s.pos], need=Math.max(slotLv(s.slot),s.lv);
  if(p.level<need){ toastTo(p.id,s.name+' needs level '+need,'bad'); return false; }
  let worn=false;
  for(const c of SS_CLASSES){
    const vid=P.bound==='any'?P.ids[0]:P.ids.find(i=>SKILLS[i].cls===c);
    if(!vid||!S.owned.includes(vid)||!canSwap(c,s.slot,S)) continue;
    S.eq[c][s.slot]=vid; worn=true;
  }
  if(worn){ recalcP(p); p.dirty=true; }
  return worn;
}
// the sets worn by the class in hand: how many pieces of each and the bonus rows in force (read by whoever needs a set effect at run time)
function ssRefreshP(p){
  const sk=p.gear.skills, cls=clsOfP(p);
  p.ss={n:ssCount(sk,cls,p.level),bonus:ssBonuses(sk,cls,p.level)};
}
