//@ Tracking a skill upgrade: mark one skill and the maps show the camps of the monsters whose drops its next level still needs, and the quest log carries its price lines
/* Agent map. Exports: skTrackId, skTrackToggle(id), skTrackLines() (the next level's price lines, the Awakening panel's own shape: costs.js awcCostLines), skTrackTargets() -> [{x,z,mat}] (one per ~80 m cell of camps), skTrackMarks(x,at,inside,DPR,big)
   (drawn by ui/map.js on the minimap and the land map), skLogRow() (the quest log's line, economy/quests.js renderQlog). Client only: the choice lives in localStorage, nothing is synced.
   The price is the tree's own rule (shared/awakening-cost.js awkNodeCost — ONE rule with the Awakening panel and the server), so the marked camps are the monsters the tree really asks for;
   the trainer's old table (shared/drops.js upgradeNeeds) only prices a skill with no tree node (a signature piece's raid price). Test: client-smoke. */
let skTrackId=null;
try{ skTrackId=localStorage.getItem('ww_sktrack')||null; }catch(e){}
function skTrackToggle(id){
  skTrackId=skTrackId===id?null:id;
  try{ if(skTrackId) localStorage.setItem('ww_sktrack',skTrackId); else localStorage.removeItem('ww_sktrack'); }catch(e){}
}
// the tracked skill's next level's price lines ({id,name,col,have,need,ok} each), exactly as the Awakening tree prices it; null when nothing is tracked or the skill is at its top
function skTrackLines(){
  if(!skTrackId||!GEAR||!GEAR.skills) return null;
  const s=skillDef(skTrackId); if(!s||!(GEAR.skills.owned||[]).includes(skTrackId)) return null;
  const L=skillLvOf(GEAR.skills,skTrackId), k=s.set||'wanderer';   // the tree the panel's Awaken button opens for this skill
  const limb=s.slot==='passive'?'pa':({basic:'ba',skill:'sk',burst:'po'})[s.slot]||'';
  const n=limb?awkNode(awkShapeOf(k),awkUpId(limb,L+1)):null;
  if(n){ const c=awkNodeCost(k,n.id); if(c) return awcCostLines(c); }
  const u=upgradeNeeds(skTrackId,L+1); if(!u) return null;   // (a skill with no node in the tree yet — an old hold-out — or the top level: nothing)
  const out=[{id:'coins',name:'Coins',col:AWC_COIN_COL,have:GEAR.coins|0,need:u.coins,ok:(GEAR.coins|0)>=u.coins}];
  for(const m of u.mats){ const have=awtHave(m.id); out.push({id:m.id,name:awtName(m.id),col:awtColOf(m.id),have,need:m.n,ok:have>=m.n}); }
  return out;
}
// the camps of the monsters that drop a material still missing for the tracked skill's next level (none once it is complete or at the top level)
function skTrackTargets(){
  const lines=skTrackLines(); if(!lines) return [];
  const want=new Set(lines.filter(l=>!l.ok&&MON_DEFS.some(q=>q.id===l.id)).map(l=>l.id)), seen=new Set(), out=[];
  if(!want.size) return out;
  for(const m of MONS){ if(!want.has(m.def.id)) continue; const k=m.def.id+':'+Math.round(m.camp.x/80)+':'+Math.round(m.camp.z/80); if(seen.has(k)) continue; seen.add(k); out.push({x:m.camp.x,z:m.camp.z,mat:m.def.id}); }
  return out;
}
function skTrackMarks(x,at,inside,DPR,big){
  for(const t of skTrackTargets()){ if(!inside(t.x,t.z)) continue; const [a,b]=at(t.x,t.z); x.save(); x.strokeStyle='#ffd24a'; x.lineWidth=2*DPR; x.beginPath(); x.arc(a,b,(big?7:5)*DPR,0,TAU); x.stroke(); dot(x,a,b,(big?3:2)*DPR,'#ffd24a'); x.restore(); }
}
// one line in the quest log, the material tracker's shape (mat-info.js awtLogRows): the skill, its next level, and every price line with what you hold
function skLogRow(){
  if(!skTrackId) return '';
  const lines=skTrackLines(); if(!lines) return '';
  const s=skillDef(skTrackId); if(!s) return '';
  const L=skillLvOf(GEAR.skills,skTrackId), miss=lines.some(l=>!l.ok);
  const mats=lines.map(l=>'<span class="ql-mat'+(l.ok?' ok':'')+'" style="--c:'+l.col+'" title="'+awtEsc(l.name)+(l.note?': '+awtEsc(l.note):'')+'">'+awtIcon(l.id,l.col)+awtEsc(l.name)+' <b>'+awcNum(l.have)+'/'+awcNum(l.need)+'</b>'+(l.ok?' &#10003;':'')+'</span>').join(' ');
  return '<div class="ql sk'+(miss?'':' ok')+'"><b>'+awtEsc(s.name)+' &rarr; level '+(L+1)+'</b><span class="ql-sk-mats">'+mats+'</span><button class="awt-x" data-skun="1" title="Stop tracking" aria-label="Stop tracking">&times;</button></div>';
}
(function skTrackBind(){
  const Q=$('#qlog'); if(!Q||!Q.addEventListener) return;
  Q.addEventListener('click',e=>{ const t=e.target&&e.target.closest?e.target.closest('[data-skun]'):null; if(!t) return; e.stopPropagation(); skTrackToggle(skTrackId); renderQlog(); if(!$('#skills').hidden) renderSkills(); },true);
})();
