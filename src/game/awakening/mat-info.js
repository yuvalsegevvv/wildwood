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
  try{ const a=JSON.parse(localStorage.getItem(AWT_KEY)||'[]'); if(Array.isArray(a)) for(const r of a) if(r&&typeof r.id==='string'&&r.need>=0&&AWT.tracked.length<AWT_MAX) AWT.tracked.push({id:r.id,need:Math.min(99999,r.need|0)}); }catch(_){}   // need 0: tracked from the Materials panel's search, a count without a goal
  return AWT.tracked;
}
function awtSave(){ try{ localStorage.setItem(AWT_KEY,JSON.stringify(AWT.tracked)); }catch(_){} }
const awtCoinArt='<circle cx="16" cy="16" r="12" fill="#f2cf5a" stroke="#15120e" stroke-width="1.6"/><circle cx="16" cy="16" r="8" fill="none" stroke="#b8902a" stroke-width="1.4"/><path d="M13 11L16 8L19 11M16 8V24" stroke="#b8902a" stroke-width="1.2" fill="none"/>';
const AWT_STONE_COL={temper:'#9ff0c8',rsw:'#ffb070',rsa:'#8fc4ff',rsr:'#e9a0ff',sig:'#ffd24a'};   // the forge's and the puzzles' counts (inv-keys.js IK_ROWS' colours)
const awtRes=id=>(typeof RES!=='undefined'&&RES&&Object.prototype.hasOwnProperty.call(RES,id))?RES[id]:null;   // a gathered resource: ore, a log, an herb, black stone (shared/professions.js)
function awtColOf(id){
  if(id==='coins') return AWC_COIN_COL;
  if(AWT_STONE_COL[id]) return AWT_STONE_COL[id];
  if(id==='bdorb') return '#ff9ad0';
  if(id==='bdstone') return '#c9a6ff';
  const R=awtRes(id); if(R) return R.col;
  return awcHaveOf(id)===null?AWC_DROP_COL:awcMatCol(id);
}
function awtIcon(id,col){
  const c=col||awtColOf(id);
  let art;
  if(id==='coins') art=awtCoinArt;
  else if(id==='echo') art=matIconArt(c,'');
  else if(btOf(id)) art=btIconArt(c);
  else if(id==='trophy_any') art=btIconArt(c);
  else if(essOf(id)) art=essIconArt(c,essOf(id).key==='prime');
  else if(id.startsWith('rd_')) art=matIconArt(c,'');
  else if(awtRes(id)) return '<span class="awt-ic">'+matIcon(c,awtRes(id).prof,id,awtRes(id).name)+'</span>';
  else if(AWT_STONE_COL[id]) art=ikIcon(id==='rsw'||id==='rsa'||id==='rsr'?'die':id,c);
  else if(id==='bdorb'||id==='bdstone') art=ikIcon(id==='bdorb'?'orb':'bst',c);
  else{ const d=MON_DEFS.find(q=>q.id===id); return '<span class="awt-ic">'+matIcon(c,'drop',id,MAT_NAMES[id]||(d&&d.name)||id)+'</span>'; }
  return '<span class="awt-ic"><svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#icoLit)">'+art+'</g></svg></span>';
}
function awtName(id){
  if(id==='coins') return 'Coins';
  if(id==='drops') return 'Monster drops';
  if(id==='temper') return 'Tempering Stones';
  if(id==='rsw') return 'Weapon Reroll Stones';
  if(id==='rsa') return 'Armour Reroll Stones';
  if(id==='rsr') return 'Accessory Reroll Stones';
  if(id==='sig') return 'Sigils';
  if(id==='bdorb') return 'Bond Orbs';
  if(id==='bdstone') return 'Bondstones';
  const R=awtRes(id); if(R) return R.name;
  return MAT_NAMES[id]&&MON_DEFS.some(q=>q.id===id)?MAT_NAMES[id]:awcMatName(id);
}
function awtHave(id){
  if(id==='coins') return (GEAR&&GEAR.coins)|0;
  const R=awtRes(id); if(R) return ((GEAR&&GEAR.res)||{})[id]|0;   // gathered: ore, logs, herbs, black stone
  if(id==='temper') return (GEAR&&GEAR.temper)|0;   // the forge's stones (shared/dungeon-gear.js keeps the count)
  if(id==='rsw'||id==='rsa'||id==='rsr') return (GEAR&&GEAR[id])|0;
  if(id==='sig') return Math.max(0,((GEAR&&GEAR.sig)|0)-((GEAR&&GEAR.sigOff)|0));
  if(id==='bdorb'||id==='bdstone'){ const B=(GEAR&&GEAR.bd)||{}; let n=0; for(const k of SS_ORDER){ const e=B[k]; if(e&&typeof e==='object') n+=(id==='bdorb'?e.o:e.st)|0; } return n; }   // every character's pouch together
  const v=awcHaveOf(id); if(v!==null) return v;
  const M=(GEAR&&GEAR.mats)||{}; return awcHas(M,id)?M[id]|0:0;
}
const awtTrackable=id=>id!=='coins'&&id!=='drops'&&id!=='bdorb'&&id!=='bdstone'&&(awtRes(id)||AWT_STONE_COL[id]||awcHaveOf(id)!==null||MON_DEFS.some(q=>q.id===id));
function awtBossInfo(bossId){
  const d=(typeof BOSS_DEFS!=='undefined'?BOSS_DEFS.map(b=>b.def):[]).find(q=>q.id===bossId); let land='';
  for(const l of Object.keys(SS_SOURCES)) if(SS_SOURCES[l].slice(0,2).includes(bossId)) land=l;
  return {name:d?d.name:bossId,level:d?d.level:0,land};
}
function awtRiftFor(key){
  for(const id of Object.keys(RIFT_DEFS)){ const R=RIFT_DEFS[id]; if(R.reward==='essence'&&R.essence===key) return R; }
  return null;
}
// a gathered resource's lands and zone levels (from the shared NODES table, your private home yard apart), cached: "the home forest (zones 2-14), the Sakura Vale (zones 15-19)"
const AWT_RES_WHERE={}, AWT_RES_NEED={};
function awtResWhere(id){
  if(AWT_RES_WHERE[id]!==undefined) return AWT_RES_WHERE[id];
  const by={};
  for(const n of NODES){
    const K=NODE_KINDS[n.kind]; if(!K||K.res!==id||n.home) continue;
    const zn=zoneAt(n.x,n.z); if(!zn) continue;
    const e=by[landAt(n.x,n.z)]||(by[landAt(n.x,n.z)]={mn:99,mx:0,need:99});
    e.mn=Math.min(e.mn,zn.level); e.mx=Math.max(e.mx,zn.level); e.need=Math.min(e.need,n.need===undefined?tierFor(zn.level):n.need);
  }
  return AWT_RES_WHERE[id]=Object.keys(by).sort((a,b)=>by[a].mn-by[b].mn).map(l=>awcLandName(l)+' (zones '+by[l].mn+'-'+by[l].mx+')').join(', ');
}
// the weakest tool that works its nodes, named as the game's own refusal names it (professions.js nodeBlockText)
function awtResNeed(id){
  if(AWT_RES_NEED[id]!==undefined) return AWT_RES_NEED[id];
  let need=99; for(const n of NODES){ const K=NODE_KINDS[n.kind]; if(K&&K.res===id&&!n.home) need=Math.min(need,n.need===undefined?tierFor(zoneAt(n.x,n.z)?zoneAt(n.x,n.z).level:1):n.need); }
  if(need===99) return '';
  const R=awtRes(id);
  return AWT_RES_NEED[id]=TOOL_MAT[need]+' '+(R?TOOL_KIND[PROFS[R.prof].tool]:'tool');
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
      where:R?'Won in the '+R.name+' rift'+at+', a solo run ('+((RIFT_MODES[R.mode]||RIFT_MODES.waves).name)+'). Rifts open at level '+RIFT_ELEM_LV+'; you pick the monsters\' level, 30 to 80: a full run pays '+RIFT_TIER_ESS[30]+' at level 30 up to '+RIFT_TIER_ESS[80]+' at level 80 (double with the Double, which costs 20 rift energy).':'Paid by an elemental rift (open from level '+RIFT_ELEM_LV+'); that rift is not built yet.'}; }
  if(id.startsWith('rd_')){ const land=id.slice(3), r=land==='any'?null:rdOfLand(land);
    if(land==='any') return {name,what:'Raid material of any land counts here.',where:'Clear a raid on any land: each of the ruined strongholds pays its own material, 2 to the power of its tier a clear.'};
    return {name,what:'Raid material of '+awcLandName(land)+'.',where:r?'Clear the raid '+r.name+' ('+awcLandName(land)+'): 2 to the power of its tier a clear. The stronghold rebuilds 30 minutes after a clear.':'No raid pays it yet.'}; }
  if(id==='temper') return {name,what:'The forge\'s stones: the Temper tab raises a level-30 or level-40 piece one step a stone, up to +10.',
    where:'Dungeon runs drop them instead of equipment once their monsters are level 30 or above (about '+Math.round(ENH_DROP*100)+'% of kills; bosses still drop gear), and puzzle chests sometimes hold them.'};
  if(id==='rsw'||id==='rsa'||id==='rsr'){
    const what={rsw:'Weapon stones: the forge\'s Roll tab rerolls the three lines of a level-40 weapon.',rsa:'Armour stones: the forge\'s Roll tab rerolls the three lines of level-40 armour.',rsr:'Accessory stones: the forge\'s Roll tab rerolls the three lines of a level-40 ring, pendant or talisman.'}[id];
    const rift={rsw:'the Quarry rift',rsa:'the Heart rift',rsr:'the Lanterns rift'}[id], sac={rsw:'a level-30+ weapon',rsa:'level-30+ armour',rsr:'a level-30+ ring, pendant or talisman'}[id];
    return {name,what,where:'Three roads: '+rift+' pays them (a solo stone rift, from level '+RIFT_STONE_LV+'); world bosses drop a random stone (25% at zone tier 0 up to 95% at tier 7, more the higher the tier); and sacrificing '+sac+' at the forge pays stones by its rarity.'};
  }
  if(id==='sig') return {name,what:'The puzzles\' currency: offered at the broken statue in Glasswell, they raise the Sigil track (levels pay gems and cosmetics).',
    where:'Solve a puzzle stone for the first time (the standing stones marked on the map: gems and Sigils by its difficulty) and finish a Deep Cave method for the first time. Then offer them at the statue in the middle of Glasswell.'};
  if(id==='bdorb') return {name,what:'A character\'s orb: opening one pays 1-3 of their Bondstones (60% / 30% / 10%).',
    where:'The orb stall in the home village sells every character\'s for 1 coin. The Stirrings (the hour\'s marked boss, dungeon and raid, on the map) pay opened orbs when you take part.'};
  if(id==='bdstone') return {name,what:'What a Bond rises on: each step of a character\'s Bond asks for their Bondstones (the rest turns into 300 coins each past Bond VI).',
    where:'Open Bond Orbs (the orb stall sells them for 1 coin; the hour\'s Stirrings pay opened orbs) — each orb pays 1-3 Bondstones of its own character.'};
  const R=awtRes(id);
  if(R){
    const P=PROFS[R.prof];
    let kind=''; for(const k in NODE_KINDS){ if(NODE_KINDS[k].res===id){ kind=NODE_KINDS[k].name; break; } }
    const at=awtResWhere(id), tool=awtResNeed(id);
    return {name,
      what:id==='blackstone'?'The Greyspine\'s own stone, the dark made solid: the main quest asks for it and a Wayfarers\' Lodge buys it.':R.prof==='mining'?'Grade '+R.grade+' ore: weapons are forged from it at a weaponsmith (the Craft tab).':R.prof==='woodcutting'?'Grade '+R.grade+' logs: armour is built from them at an armourer (the Craft tab).':'An herb: potions are brewed from it at a healer\'s brewing panel.',
      where:(kind?PROFS[R.prof].name+' works '+kind+'s':'Work its nodes')+(at?' in '+at:'')+'. Learned at a Wayfarers\' Lodge (one in each village); '+(tool?'a '+tool+' or better':'the tool in its slot')+'. Each gather gives one (sometimes two), and the node returns after ~90 s.'};
  }
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
  else{ if(T.length>=AWT_MAX){ toast('You can track '+AWT_MAX+' materials at most','bad'); return false; } T.push({id,need:Math.max(0,need|0)}); }   // need 0: a count without a goal (tracked from the Materials panel's search, which knows no price)
  awtSave(); awcRender(); renderQlog(); return true;
}
function awtUntrack(id){ const T=awtLoad(), i=T.findIndex(t=>t.id===id); if(i>=0){ T.splice(i,1); awtSave(); } awcRender(); renderQlog(); }
// one line each in the quest log: icon, name, have / need
function awtLogRows(){
  return awtLoad().map(t=>{ const have=awtHave(t.id), done=t.need>0&&have>=t.need;
    return '<div class="ql awt'+(done?' ok':'')+'" style="--c:'+awtColOf(t.id)+'">'+awtIcon(t.id)+'<b>'+awtEsc(awtName(t.id))+'</b><span>'+(t.need?awcNum(Math.min(have,99999))+' / '+awcNum(t.need)+(done?' &#10003;':''):awcNum(Math.min(have,99999)))+'</span><button class="awt-x" data-awtun="'+awtEsc(t.id)+'" title="Stop tracking" aria-label="Stop tracking">&times;</button></div>'; }).join('');
}
(function awtBind(){
  const A=$('#awc'), Q=$('#qlog'); if(!A||!A.addEventListener) return;
  A.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target.closest('[data-awtmat],[data-awttrack],[data-awtclose]'):null; if(!t) return;
    if(t.dataset.awtmat) awtToggle(t.dataset.awtmat,t.dataset.awtwhere); else if(t.dataset.awttrack) awtTrack(t.dataset.awttrack,+t.dataset.awtneed); else{ AWT.open=null; awcRender(); }
  });
  if(Q&&Q.addEventListener) Q.addEventListener('click',e=>{ const t=e.target&&e.target.closest?e.target.closest('[data-awtun]'):null; if(!t) return; e.stopPropagation(); awtUntrack(t.dataset.awtun); },true);
})();
