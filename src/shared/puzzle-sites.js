//@ The puzzle stones of the world: id, kind, difficulty, place. Thread 1 has only the tutorial stone in the home village; the 328 others are the content thread's data rows
/* Agent map. PZ_SITES rows {id, kind, diff, x, z, lv, seed0 (a chosen first-time seed, 0 = hash)}. Added by pzSiteAdd(row), checked on definition (a bad row is left out and listed in PZ_SITE_BAD).
   used by: server/puzzles.js (open: nearest stone within PZ_REACH), game/village/buildings-puzzle.js (the stones' meshes), game/village/talking.js (the talk key). Test: tools/puzzles-smoke.js */
const PZ_SITES=[], PZ_SITE_BAD=[];
function pzSiteAdd(r){
  const ok=r&&typeof r.id==='string'&&/^[a-z0-9_-]{1,24}$/.test(r.id)&&typeof r.kind==='string'&&r.diff>=1&&r.diff<=5&&isFinite(r.x)&&isFinite(r.z)&&r.lv>=1&&!PZ_SITES.some(s=>s.id===r.id);
  if(!ok){ PZ_SITE_BAD.push(String(r&&r.id)); return false; }
  const row={id:r.id,kind:r.kind,diff:r.diff|0,x:+r.x,z:+r.z,lv:r.lv|0,seed0:r.seed0>>>0};
  if(r.raid) row.raid=String(r.raid);   // a stone inside a raid's walls (shared/puzzle-group.js): one solver, the chest pays the members inside, new board at each rebuild
  if(r.cave) row.cave=r.cave|0;         // a stone on a Deep Cave floor: pays that floor's cave material instead of ordinary drops
  PZ_SITES.push(row); return true;
}
const pzSiteOf=id=>PZ_SITES.find(s=>s.id===id);
// the tutorial stone: a trivial Rootlines board in the plaza of the home village, 6 m east of its centre (7 m clear of every building and prop) (Linnea's lesson points at it)
pzSiteAdd({id:'tutorial',kind:'rootlines',diff:1,x:VIL.x+6,z:VIL.z,lv:2,seed0:0});
