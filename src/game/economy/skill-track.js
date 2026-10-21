//@ Tracking a skill upgrade: mark one skill and the maps show the camps of the monsters whose drops its next level still needs
/* Agent map. Exports: skTrackId, skTrackToggle(id), skTrackTargets() -> [{x,z,mat}] (one per ~80 m cell of camps), skTrackMarks(x,at,inside,DPR,big)
   (drawn by ui/map.js on the minimap and the land map). Client only: the choice lives in localStorage, nothing is synced. Test: client-smoke. */
let skTrackId=null;
try{ skTrackId=localStorage.getItem('ww_sktrack')||null; }catch(e){}
function skTrackToggle(id){
  skTrackId=skTrackId===id?null:id;
  try{ if(skTrackId) localStorage.setItem('ww_sktrack',skTrackId); else localStorage.removeItem('ww_sktrack'); }catch(e){}
}
// the camps of the monsters that drop a material still missing for the tracked skill's next level (none once it is complete or at the top level)
function skTrackTargets(){
  if(!skTrackId||!GEAR||!GEAR.skills) return [];
  const s=skillDef(skTrackId); if(!s||!(GEAR.skills.owned||[]).includes(skTrackId)) return [];
  const L=skillLvOf(GEAR.skills,skTrackId), n=upgradeNeeds(skTrackId,L+1); if(!n) return [];
  const have=GEAR.mats||{}, want=new Set(n.mats.filter(m=>(have[m.id]||0)<m.n).map(m=>m.id)), seen=new Set(), out=[];
  if(!want.size) return out;
  for(const m of MONS){ if(!want.has(m.def.id)) continue; const k=m.def.id+':'+Math.round(m.camp.x/80)+':'+Math.round(m.camp.z/80); if(seen.has(k)) continue; seen.add(k); out.push({x:m.camp.x,z:m.camp.z,mat:m.def.id}); }
  return out;
}
function skTrackMarks(x,at,inside,DPR,big){
  for(const t of skTrackTargets()){ if(!inside(t.x,t.z)) continue; const [a,b]=at(t.x,t.z); x.save(); x.strokeStyle='#ffd24a'; x.lineWidth=2*DPR; x.beginPath(); x.arc(a,b,(big?7:5)*DPR,0,TAU); x.stroke(); dot(x,a,b,(big?3:2)*DPR,'#ffd24a'); x.restore(); }
}
