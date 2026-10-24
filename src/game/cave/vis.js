//@ The Deep Cave's skill drawings: the registry every cave skill's look is added to, and the routes from a cast and from the server's cvfx / cvhand events
/* Agent map. Plan: docs/CAVE.md section 16 (C5). The drawings live in vis-floor1.js, vis-floor1b.js, vis-floor2a.js (floors 1-2) and vis-floor2b.js, vis-floor3.js, vis-floor4.js; this file is only the contract.
   exports: CAVE_VIS (id -> {cast, event}), CAVE_VIS_BAD, caveVisDef(id, {cast(p, ab, tgt), event(e)?}), caveVisCast(ab, p, tgt) -> true when the skill has a drawing, caveVisEvent(e).
   cast(p, ab, tgt): p is the caster (P for you, a REMOTES entry for another hiker), ab the skill row (CAVE_SKILLS), tgt the monster you aimed at (yours only, else null); called when the blow lands (attackVisuals).
   event(e): called for EVERY cvfx / cvhand event, [name, pid, kind, ...] / [name, x, z, targetId, ownerId]: a skill's event() filters on e[0] and e[2] and ignores the rest.
   Hooks (`// cave:`): attackVisuals (attacks.js) asks caveVisCast first and falls back to the generic look. A skill with no entry (or one that throws) is drawn by the generic look (fxVisuals).
   Test: client-smoke (every cave skill has an entry and casting each throws nothing). */
const CAVE_VIS=Object.create(null), CAVE_VIS_BAD=[], CAVE_VIS_WARNED=Object.create(null);
function caveVisDef(id,d){
  const bad=why=>{ CAVE_VIS_BAD.push({id:String(id),why}); if(typeof console!=='undefined') console.warn('cave drawing left out:',id,why); return null; };
  if(typeof id!=='string'||!caveSkillDef(id)) return bad('no such cave skill');
  if(CAVE_VIS[id]) return bad('defined twice');
  if(!d||typeof d.cast!=='function') return bad('cast is a function (p, ab, tgt)');
  if(d.event!==undefined&&typeof d.event!=='function') return bad('event is a function (e)');
  return (CAVE_VIS[id]=d);
}
function caveVisWarn(id,e){ if(!CAVE_VIS_WARNED[id]){ CAVE_VIS_WARNED[id]=1; if(typeof console!=='undefined') console.warn('cave drawing failed:',id,e&&e.message); } }
function caveVisCast(ab,p,tgt){
  const v=ab&&ab.id&&CAVE_VIS[ab.id]; if(!v) return false;
  try{ v.cast(p,ab,tgt||null); }catch(e){ caveVisWarn(ab.id,e); }
  return true;
}
function caveVisEvent(e){   // every drawing sees every cvfx / cvhand event
  for(const id in CAVE_VIS){ const v=CAVE_VIS[id]; if(!v.event) continue; try{ v.event(e); }catch(x){ caveVisWarn(id,x); } }
}
EVH.cvfx=caveVisEvent; EVH.cvhand=caveVisEvent;
