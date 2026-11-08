//@ Awakening panel: a price chip's picture, its "how to get it" box and the tracker lines in the quest log (awtIcon, awtInfoHtml, awtLogRows)
/* Agent map. A price line (costs.js awcCostLines) carries {id, land}; panel.js awcLinesHtml draws each as a button chip with awtIcon and, under the chips, awtInfoHtml(lines,where) for the open one.
   exports: AWT (state: open {id,where}, tracked [{id,need}]), awtIcon(id,col), awtHow(l) -> {name,what,where}, awtHave(id), awtInfoHtml(lines,where), awtToggle(id,where), awtTrack(id,need), awtUntrack(id), awtLogRows() (hooked into renderQlog, economy/quests.js).
   Tracked materials are a per-viewer convenience in localStorage ('wwAwtTrack'), at most AWT_MAX; nothing goes to the server. The panel's clicks are bound once here (data-awtmat, data-awttrack, data-awtclose), the quest log's x (data-awtun).
   Test: client-smoke (the awakening block). */
const AWT_MAX=3, AWT_KEY='wwAwtTrack';
const AWT={open:null,tracked:null};
const awtEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function awtLoad(){
  if(AWT.tracked) return AWT.tracked; AWT.tracked=[];
  try{ const a=JSON.parse(localStorage.getItem(AWT_KEY)||'[]'); if(Array.isArray(a)) for(const r of a) if(r&&typeof r.id==='string'&&r.need>0&&AWT.tracked.length<AWT_MAX) AWT.tracked.push({id:r.id,need:Math.min(99999,r.need|0)}); }catch(_){}
  return AWT.tracked;
}
function awtSave(){ try{ localStorage.setItem(AWT_KEY,JSON.stringify(AWT.tracked)); }catch(_){} }
const awtCoinArt='<circle cx="16" cy="16" r="12" fill="#f2cf5a" stroke="#15120e" stroke-width="1.6"/><circle cx="16" cy="16" r="8" fill="none" stroke="#b8902a" stroke-width="1.4"/><path d="M13 11L16 8L19 11M16 8V24" stroke="#b8902a" stroke-width="1.2" fill="none"/>';
function awtColOf(id){ return id==='coins'?AWC_COIN_COL:(awcHaveOf(id)===null?AWC_DROP_COL:awcMatCol(id)); }
function awtIcon(id,col){
  const c=col||awtColOf(id);
  let art;
  if(id==='coins') art=awtCoinArt;
  else if(id==='echo') art=matIconArt(c,'');
  else if(btOf(id)) art=btIconArt(c);
  else if(id==='trophy_any') art=btIconArt(c);
  else if(essOf(id)) art=essIconArt(c,essOf(id).key==='prime');
  else if(id.startsWith('rd_')) art=matIconArt(c,'');
  else{ const d=MON_DEFS.find(q=>q.id===id); return '<span class="awt-ic">'+matIcon(c,'drop',id,MAT_NAMES[id]||(d&&d.name)||id)+'</span>'; }
  return '<span class="awt-ic"><svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#icoLit)">'+art+'</g></svg></span>';
}
function awtName(id){ return id==='coins'?'Coins':id==='drops'?'Monster drops':MAT_NAMES[id]&&MON_DEFS.some(q=>q.id===id)?MAT_NAMES[id]:awcMatName(id); }
function awtHave(id){
  if(id==='coins') return (GEAR&&GEAR.coins)|0;
  const v=awcHaveOf(id); if(v!==null) return v;
  const M=(GEAR&&GEAR.mats)||{}; return awcHas(M,id)?M[id]|0:0;
}
const awtTrackable=id=>id!=='coins'&&id!=='drops'&&(awcHaveOf(id)!==null||MON_DEFS.some(q=>q.id===id));
function awtBossInfo(bossId){
  const d=(typeof BOSS_DEFS!=='undefined'?BOSS_DEFS.map(b=>b.def):[]).find(q=>q.id===bossId); let land='';
  for(const l of Object.keys(SS_SOURCES)) if(SS_SOURCES[l].slice(0,2).includes(bossId)) land=l;
  return {name:d?d.name:bossId,level:d?d.level:0,land};
}
function awtRiftFor(key){
  for(const id of Object.keys(RIFT_DEFS)){ const R=RIFT_DEFS[id]; if(R.reward==='essence'&&R.essence===key) return R; }
  return null;
}
// what it is and exactly where it comes from, from the shared rules
function awtHow(l){
  const id=l.id, name=awtName(id);
  if(id==='coins') return {name,what:'The money of the world.',where:'Earned from monster kills, quests and the board, and by selling items.'};
  if(id==='echo') return {name,what:'Shards of the echoes that live in the Deep Cave.',where:'Win the Deep Cave\'s methods (its mouth opens from level 20). Each method you clear pays Echo Shards.'};
  if(id==='trophy_any') return {name,what:'Any boss trophy counts here.',where:'A world boss drops its own trophy when it falls: 1 on the base setting, doubling with each zone tier, to everyone who helped.'};
  const bt=btOf(id);
  if(bt){ const b=awtBossInfo(bt.boss); return {name,what:bt.text||'A trophy of '+b.name+'.',where:'Dropped by '+b.name+(b.level?' (level '+b.level:' (')+(b.land?', '+awcLandName(b.land):'')+') when it falls: 2 to the power of the zone tier a kill (1, 2, 4...), to everyone who helped.'}; }
  const es=essOf(id);
  if(es){ const R=awtRiftFor(es.key); let at='';
    if(R&&R.door){ try{ at=' in '+awcLandName(landAt(R.door.x,R.door.z)); }catch(_){} }
    return {name,what:es.key==='prime'?'The rarest Essence: the root of all elements.':'Essence of the '+es.key+' element.',
      where:R?'Won in the '+R.name+' rift'+at+', a solo run through waves of glass monsters. Rifts open at level '+RIFT_ELEM_LV+'; a full run pays '+RIFT_ESS_FULL+' (double with the Double, which costs 20 rift energy).':'Paid by an elemental rift (open from level '+RIFT_ELEM_LV+'); that rift is not built yet.'}; }
  if(id.startsWith('rd_')){ const land=id.slice(3), r=land==='any'?null:rdOfLand(land);
    if(land==='any') return {name,what:'Raid material of any land counts here.',where:'Clear a raid on any land: each of the ruined strongholds pays its own material, 2 to the power of its tier a clear.'};
    return {name,what:'Raid material of '+awcLandName(land)+'.',where:r?'Clear the raid '+r.name+' ('+awcLandName(land)+'): 2 to the power of its tier a clear. The stronghold rebuilds 30 minutes after a clear.':'No raid pays it yet.'}; }
  const d=MON_DEFS.find(q=>q.id===id);
  if(d) return {name,what:'A material that '+d.name+' drops.',where:'Kill '+d.name+' (level '+d.level+(l.land&&l.land!=='any'?', '+awcLandName(l.land):'')+'). Each kill has a '+Math.round(DROP_CHANCE*100)+'% chance of a drop (more with drop-rate gear), sometimes 2.'};
  if(id==='drops') return {name,what:'The drops of the monsters of this land and tier.',where:(l.note?'Kill monsters: '+l.note+'. ':'Kill monsters of the land. ')+'Any of the kinds counts; each kill has a '+Math.round(DROP_CHANCE*100)+'% chance of a drop.'};
  return {name,what:'A material.',where:'No source is known yet.'};
}
function awtInfoHtml(lines,where){
  const o=AWT.open; if(!o||o.where!==where) return '';
  const l=lines.find(x=>x.id===o.id); if(!l) return '';
  const h=awtHow(l), tr=awtLoad().find(t=>t.id===l.id), can=awtTrackable(l.id);
  return '<div class="awt-box" style="--c:'+l.col+'">'+awtIcon(l.id,l.col)+'<div class="awt-tx"><b>'+awtEsc(h.name)+'</b><p>'+awtEsc(h.what)+'</p><p class="awt-wh"><u>How to get it</u> '+awtEsc(h.where)+'</p>'
    +'<div class="awt-bt">'+(can?'<button class="chip awt-track" data-awttrack="'+awtEsc(l.id)+'" data-awtneed="'+(l.need|0)+'">'+(tr?'Untrack':'Track')+'</button>':'')+'<button class="chip" data-awtclose="1">Close</button></div></div></div>';
}
function awtToggle(id,where){ AWT.open=AWT.open&&AWT.open.id===id&&AWT.open.where===where?null:{id,where}; awcRender(); }
function awtTrack(id,need){
  const T=awtLoad(), i=T.findIndex(t=>t.id===id);
  if(i>=0) T.splice(i,1);
  else{ if(T.length>=AWT_MAX){ toast('You can track '+AWT_MAX+' materials at most','bad'); return false; } T.push({id,need:Math.max(1,need|0)}); }
  awtSave(); awcRender(); renderQlog(); return true;
}
function awtUntrack(id){ const T=awtLoad(), i=T.findIndex(t=>t.id===id); if(i>=0){ T.splice(i,1); awtSave(); } awcRender(); renderQlog(); }
// one line each in the quest log: icon, name, have / need
function awtLogRows(){
  return awtLoad().map(t=>{ const have=awtHave(t.id), done=have>=t.need;
    return '<div class="ql awt'+(done?' ok':'')+'" style="--c:'+awtColOf(t.id)+'">'+awtIcon(t.id)+'<b>'+awtEsc(awtName(t.id))+'</b><span>'+awcNum(Math.min(have,99999))+' / '+awcNum(t.need)+(done?' &#10003;':'')+'</span><button class="awt-x" data-awtun="'+awtEsc(t.id)+'" title="Stop tracking" aria-label="Stop tracking">&times;</button></div>'; }).join('');
}
(function awtBind(){
  const A=$('#awc'), Q=$('#qlog'); if(!A||!A.addEventListener) return;
  A.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target.closest('[data-awtmat],[data-awttrack],[data-awtclose]'):null; if(!t) return;
    if(t.dataset.awtmat) awtToggle(t.dataset.awtmat,t.dataset.awtwhere); else if(t.dataset.awttrack) awtTrack(t.dataset.awttrack,+t.dataset.awtneed); else{ AWT.open=null; awcRender(); }
  });
  if(Q&&Q.addEventListener) Q.addEventListener('click',e=>{ const t=e.target&&e.target.closest?e.target.closest('[data-awtun]'):null; if(!t) return; e.stopPropagation(); awtUntrack(t.dataset.awtun); },true);
})();
