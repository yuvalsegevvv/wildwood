//@ Skills panel: a tab for each attack slot (1 basic, 2 skill, 3 burst) and the passives, drag skills onto the active slots, learn from the trainers; levels are bought in the Awakening tree (the Awaken button)
/* Open it with K, the Skills button in the inventory, the empty skill button, or by talking to Aldric (or Master Ryu in Hanami).
   Top: the active slots of the class you are looking at (drop targets) and the one passive slot (the same for every class, opening at level 10: PASSIVE_SLOT_LV).
   Below: a tab per kind and a grid of its skills. Drag a skill you own onto its slot to use it, drag one out of a slot back into the grid to take it
   off; tap a skill for its details, Equip / Take off buttons (for touch) and the Awaken button. Learning happens at a trainer; levels come from the tree (awakening/panel.js). */
let skTab=null, skKind='skill';
const SK={sel:null};   // the selected skill or passive id
function openSkills(n,kind){ openPanel('skills',n||null); skTab=clsOf(); if(KIND_TITLE[kind]) skKind=kind; SK.sel=null; renderSkills(); }
function toggleSkills(){ if(!started||customizing) return; if($('#skills').hidden&&$('#awc').hidden) chrOpen(null,'sk'); else closePanels(); }   // K: the Characters panel on its Skills tab (awakening/hub.js); the slot picker below opens from its swap buttons
addEventListener('keydown',e=>{ if(started&&!customizing&&kbIs(e.code,'skills')&&!e.repeat) toggleSkills(); });   // K opens and closes it: its own listener (the combat keydown's uiOpen guard made the key only ever open it)
const skIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||ICONS.burst||''}</svg>`;   // (skillsets: a signature skill without a glyph of its own gets the generic burst one, as the action bar does)
// a skill's icon: a set piece draws its own set's symbol (skillsets/panel.js), any other its glyph by name (a piece of no set without one gets the generic burst)
const skIconOf=s=>{ const g=ssGlyph(s); return g?`<svg ${SS_ICON_ATTR}>${g}</svg>`:skIcon(s.icon||s.name); };
const SLOT_TITLE={basic:'1 · Basic attack',skill:'2 · Skill',burst:'3 · Power'}, KIND_TITLE={basic:'1 · Basic',skill:'2 · Skill',burst:'3 · Power',cave:'4 · Charge',ult:'5 · Burst',pass:'Passive',mov:'Movement'};
const needLv=s=>s.slot==='passive'?Math.max(PASSIVE_LV,s.lv):Math.max(slotLv(s.slot),s.lv);
const SLOT_NO={basic:1,skill:2,burst:3};
// one skill as a tile: its icon, element dot, and its level (or price / required level when you do not own it yet)
function skTile(s,C,from){
  const own=C.S.owned.includes(s.id), low=C.lv<needLv(s), L=skillLvOf(C.S,s.id), el=elOf(s);
  const drag=true;   // every tile can be dragged, so a drop that is refused always says why (not learned yet, level, the basic slot, a locked slot)
  const tint=ssTint(s);
  return `<button class="sk-tile${el!=='basic'?' has-el':''}${tint?' has-set':''}${SK.sel===s.id?' sel':''}${own?'':' unowned'}${low?' locked':''}${drag?' drag':''}${s.slot==='burst'?' burst':''}" data-id="${s.id}" data-from="${from}" data-drag="${drag?1:0}" style="--el:${el==='basic'?'transparent':ELEMS[el].col}${tint?';--set:'+tint:''}" aria-label="${s.name}${s.set?' ('+SS_SETS[s.set].name+' set)':''}${own?', level '+L:''}">${skIconOf(s)}${el!=='basic'?'<i class="el-dot"></i>':''}${own?bdcTileBadge(C.S,s.id):''}<span class="lv">${own?'Lv '+L:low?'Lv '+needLv(s):s.price?s.price+'c':'Free'}</span></button>`;
}
function skSlotsHtml(C,cls){
  const act=SLOTS.map(slot=>{
    const a=abilityOf(cls,slot,C.S,C.lv), locked=C.lv<slotLv(slot);
    return `<div class="sk-slot${a?' on':''}${locked?' locked':''}" data-slot="${slot}"><span class="sk-n">${SLOT_TITLE[slot]}</span>${a?skTile(a,C,'slot:'+slot):`<div class="sk-tile empty">${skIcon(locked?'lock':'plus')}</div>`}<b>${a?a.name:locked?'Opens at level '+slotLv(slot):'Empty'}</b><small>${a?abilityCd(a,C.S,C.lv,cls,rlUiCdr()).toFixed(1)+' s'+(elOf(a)!=='basic'?' · '+ELEMS[elOf(a)].name:'')+(a.set?' · '+SS_SETS[a.set].name:''):locked?'':'Drag one here'}</small></div>`;
  }).join('');
  const noA1=C.S&&C.S.pa===0, open=C.lv>=PASSIVE_LV&&!noA1;   // awakening: the slot opens with A1 of the character played
  const caveH=caveSlotHtml(C);   // cave: the 4th slot's row   // ult: the 5th slot's row is added to the same line (ultSlotHtml, game/ult/slot.js)
  const pas=Array.from({length:PASSIVE_SLOTS},(_,i)=>{   // slot i opens at level PASSIVE_SLOT_LV[i]
    const id=C.S.pass&&C.S.pass[i], P=PASSIVES[id], usable=C.lv>=PASSIVE_SLOT_LV[i]&&!noA1;
    return `<div class="sk-pslot${P?' on':''}${usable?'':' locked'}" data-idx="${i}"><span class="sk-n">Passive${PASSIVE_SLOTS>1?' '+(i+1):''}</span>${P?skTile(P,C,'pslot:'+i):`<div class="sk-tile empty">${skIcon(usable?'plus':'lock')}</div>`}<b>${P?P.name:usable?'Empty':noA1?'Awakening A1':'Level '+PASSIVE_SLOT_LV[i]}</b><small>${P?passiveText(id,skillLvOf(C.S,id)):usable?'Drag one here':''}</small></div>`;
  }).join('');
  const later=PASSIVE_SLOT_LV.map((l,i)=>C.lv<l?'slot '+(i+1)+' at level '+l:'').filter(Boolean).join(', ');
  return `<div class="sk-lcol"><div class="sk-load-h">Active skills</div><div class="sk-load">${act}${caveH}${ultSlotHtml(C)}</div></div><div class="sk-lcol"><div class="sk-load-h">Passive skill <span>${open?'the same for every class'+(later?' · '+later:''):(noA1?'opens with Awakening A1':'open at level '+PASSIVE_LV)}</span></div><div class="sk-load pas">${pas}</div><div class="sk-load-h">Movement skill <span>free, from level ${MV_SLOT_LV}</span></div><div class="sk-load pas">${mvSlotHtml(C)}</div></div>`;   // movement: the slot below the passives   // two columns: active | passive (18-skills.css)
}
// details of the selected skill: what it does at its level, how to equip it, and what its next level costs
function skInfoHtml(C,cls){
  const s=SK.sel&&skillDef(SK.sel);
  if(!s) return `<p class="muted">${isTouch?'Tap':'Click'} a skill for details. Drag one you own onto its slot to use it, or out of its slot to take it off.</p>`;
  const S=C.S, own=S.owned.includes(s.id), L=skillLvOf(S,s.id), pass=s.slot==='passive', low=C.lv<needLv(s), el=elOf(s);
  const PS=S.pass||[], eq=pass?PS.includes(s.id):((abilityOf(s.cls==='any'?cls:s.cls,s.slot,S,C.lv)||{}).id===s.id);   // skillsets: a universal piece is looked up for the class being viewed
  let stats;
  if(pass) stats=passiveText(s.id,L);
  else stats=(s.slot==='basic'?bhInterval(s,S,bhSpeedUi(),1,0).toFixed(2)+' s per swing · hold to charge':abilityCd(s,S,C.lv,cls,rlUiCdr()).toFixed(1)+' s cooldown')+(s.buff?'':' · '+Math.round(s.mult*skillPower(L)*100)+'% damage')
    +(s.buff?' · +'+Math.round((s.buff.dmg-1)*awkCurve('buff',L)*100)+'% damage for '+Math.round(s.buff.dur*awkCurve('dur',L)*10)/10+' s':'');   // awakening: the buff and duration curves
  const tags=`<span class="sk-tag">${pass?'Passive':(s.cls==='any'?'Any class':CLASSES[s.cls].name)+' · '+KIND_TITLE[s.slot]}${s.set?' · '+SS_SETS[s.set].name+' ('+SS_SETS[s.set].char.name+'\'s set)':''}${s.wd?' · the Wanderer\'s path of '+WD_PATHS[s.wd].name:''}</span>${pass?'':elChip(el)}`;
  let acts='';
  if(own){
    if(eq&&!pass&&s.slot!=='basic') acts+=`<button class="chip" data-unskill="${s.slot}">Take off</button>`;
    else if(eq&&pass) acts+=`<button class="chip" data-unpass="${PS.indexOf(s.id)}">Take off</button>`;
    else if(!eq&&!(s.slot==='basic'&&!canSwap(s.cls,'basic',S))) acts+=`<button class="chip" data-eqskill="${s.id}" ${low?'disabled':''}>${low?'Level '+needLv(s):'Equip'}</button>`;
  } else if(s.set) acts+=`<span class="muted">A signature skill: earned from a boss or a dungeon</span>`;
  else if(s.wd) acts+=`<span class="muted">The Wanderer's path passive: yours with his Awakening tree's passive node (pa1, A1). It works while the Wanderer is the character you play.</span>`;   // wanderer: never taught   // skillsets: never taught
  else if(C.trainer) acts+=`<button class="chip buy" data-buyskill="${s.id}" ${GEAR.coins<s.price||C.lv<needLv(s)?'disabled':''}>${C.lv<needLv(s)?'Level '+needLv(s):'Learn: '+s.price+' coins'}</button>`;
  else acts+=`<span class="muted">Aldric (or Master Ryu in Hanami) teaches it at the well: ${s.price} coins</span>`;
  let up='';
  if(own){   // awakening: a skill's levels are bought in the tree (the trainer's Upgrade button is retired); the button opens it on this skill's character and branch
    const limb=pass?'pa':({basic:'ba',skill:'sk',burst:'po'})[s.slot]||'';
    up=`<div class="sk-up"><b>${L>=SKILL_MAX_LV?'Highest level':'Level '+L+' of '+SKILL_MAX_LV}</b><span class="muted">Skill levels, stats and tiers are bought in the Awakening tree, with coins and monster drops.</span><span class="sk-up-bt"><button class="chip buy" data-awaken="${s.set||'wanderer'}" data-limb="${limb}">Awaken</button>${limb?`<button class="chip" data-sktrack="${s.id}" aria-pressed="${skTrackId===s.id}" title="Carry the next level's price in the quest log and mark the monsters whose drops it needs (map and minimap)">${skTrackId===s.id?'Tracking':'Track'}</button>`:''}</span></div>`;
  }
  const lock=low?`<span class="req bad">needs level ${needLv(s)}</span>`:'';
  return `<div class="sk-ii"><div class="sk-ii-h"><div class="sk-ico${ssTint(s)?' has-set':''}"${ssTint(s)?` style="--set:${ssTint(s)}"`:''}>${skIconOf(s)}</div><div class="sk-ii-main"><b>${s.name}</b><div class="sk-tags">${tags}</div><span class="sk-meta">${own?'Level '+L+' of '+SKILL_MAX_LV+bdcLvNote(S,s.id)+' &middot; ':''}${stats} ${lock}</span></div><div class="sk-ii-btn">${acts}</div></div><p class="sk-desc">${pass?passiveText(s.id,L):s.desc}</p>${s.set?`<div class="sk-set-wrap"><div class="sk-load-h">Set piece <span>${SS_BONUS_ON?'wear 3 pieces for the first effect, 5 for the second':'part of '+SS_SETS[s.set].name}</span></div>${ssCardHtml(s.set,ssCount(S,cls,C.lv)[s.set]||0,ssOwnedPairs(S,s.set))}</div>`:''}${up}</div>`;
}
function renderSkills(){
  if($('#skills').hidden) return;
  if(SKD.src&&performance.now()-SKD.t0<8000){ SKD.pending=true; return; }   // not while a tile is being dragged (the server keeps sending updates): after the drop
  const trainer=!!(panelNPC&&panelNPC.def.role==='trainer'), S=GEAR.skills||newSkills(), cls=skTab||clsOf(), lv=PL.level, C={S,lv,trainer};
  $('#skTitle').textContent=trainer?panelNPC.def.name+"'s lessons":'Skills'; $('#skCoins').textContent=fmtCoins(GEAR.coins)+' coins';
  const pass=skKind==='pass';
  let h=pass?'':`<div class="chips pn-tabs">${Object.keys(CLASSES).map(c=>`<button class="chip" data-sktab="${c}" aria-pressed="${c===cls}">${CLASSES[c].name}${c===clsOf()?' (you)':''}</button>`).join('')}</div>`;
  h+=`<div class="sk-main"><div class="sk-left">${skSlotsHtml(C,cls)}</div>`;   // loadout on the left, the skill list on the right
  const setH=ssSummaryHtml(C,cls);   // skillsets: the set effects
  h+=`<div class="sk-area"><div class="chips sk-kinds">${['basic','skill','burst','cave','ult','mov','pass'].map(k=>`<button class="chip" data-skkind="${k}" aria-pressed="${k===skKind}">${KIND_TITLE[k]}</button>`).join('')}</div>`;
  let ids;
  if(pass){ ids=PASSIVE_IDS.filter(id=>!PASSIVES[id].set||S.owned.includes(id)); { const wk=wdPathOf(GEAR); if(wk) ids.unshift(WD_PATHS[wk].passive); }   // wanderer: the active path's passive, first (equippable once the tree's pa1 is bought)
    if(lv<PASSIVE_LV)   // skillsets: a signature passive shows once it is yours
    h+=`<p class="muted sk-note">Passive skills open at level ${PASSIVE_LV}. They work for every class.</p>`; }
  else {
    ids=SKILL_IDS.filter(id=>(SKILLS[id].cls===cls||SKILLS[id].cls==='any')&&SKILLS[id].slot===skKind&&(!(SKILLS[id].set||SKILLS[id].wd)||S.owned.includes(id)));   // skillsets: a universal piece is in every class's grid; a signature piece shows once it is yours
    if(skKind!=='basic'&&lv<slotLv(skKind)) h+=`<p class="muted sk-note">This slot opens at level ${slotLv(skKind)}.</p>`;
    if(skKind==='basic'&&!canSwap(cls,'basic',S)) h+=`<p class="muted sk-note">Only mages can change their basic attack.</p>`;
  }
  h+=`<div class="sk-grid">${skKind==='cave'?caveGridHtml():skKind==='ult'?ultGridHtml():skKind==='mov'?mvGridHtml():ids.map(id=>{ const s=skillDef(id); return `<div class="sk-cell">${skTile(s,C,'grid')}<span class="nm">${s.name}</span></div>`; }).join('')}</div></div></div>${setH}`;
  h+=`<div class="sk-info" id="skInfo">${skKind==='cave'?caveInfoHtml():skKind==='ult'?ultInfoHtml():skKind==='mov'?mvInfoHtml():skInfoHtml(C,cls)}</div>`;   // cave: the Cave tab's details
  if(cls!==clsOf()&&!pass) h+=`<p class="muted">You fight as a ${CLASSES[clsOf()].name} right now (your weapon decides). This ${CLASSES[cls].name} loadout is used whenever you hold a ${WEAPON_OF[cls]}.</p>`;
  const oldGrid=$('#skBody').querySelector('.sk-grid'), keepTop=oldGrid&&skGridKind===skKind+'|'+cls?oldGrid.scrollTop:0; skGridKind=skKind+'|'+cls;   // the list scrolls inside: keep its place across redraws of the same tab
  $('#skBody').innerHTML=h;
  { const g=$('#skBody').querySelector('.sk-grid'); if(g) g.scrollTop=keepTop; }
  const on=(sel,fn)=>$('#skBody').querySelectorAll(sel).forEach(b=>b.onclick=()=>fn(b));
  on('[data-sktab]',b=>{ skTab=b.dataset.sktab; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-skkind]',b=>{ skKind=b.dataset.skkind; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-ssall]',b=>{ netSend({t:'ssall',set:b.dataset.ssall}); UI_SFX.click(); });   // skillsets: wear every owned piece of the set
  caveBindPanel(on);   // cave: the cave row, tab and buttons
  ultBindPanel(on);   // ult: the burst row, tab and buttons
  mvBindPanel(on);   // movement: the slot, tab and buttons
  on('[data-eqskill]',b=>{ skEquip(b.dataset.eqskill); });
  on('[data-unskill]',b=>{ netSend({t:'unskill',cls,slot:b.dataset.unskill}); UI_SFX.click(); });
  on('[data-unpass]',b=>{ netSend({t:'unskill',slot:'pass',idx:+b.dataset.unpass}); UI_SFX.click(); });
  on('[data-buyskill]',b=>{ b.disabled=true; netSend({t:'buyskill',id:b.dataset.buyskill}); });
  on('[data-sktrack]',b=>{ skTrackToggle(b.dataset.sktrack); UI_SFX.click(); renderSkills(); if(typeof renderQlog==='function') renderQlog(); });   // the quest log carries the tracked skill's price lines
  on('[data-awaken]',b=>awcOpen(b.dataset.awaken,b.dataset.limb));   // awakening: the tree, on this skill's character and branch
}
// put a skill you own in its slot (a passive: slot idx, or the first free one)
function skEquip(id,idx){
  const s=skillDef(id); if(!s) return;
  const no=text=>{ toast(text,'bad'); UI_SFX.error(); };
  if(!(GEAR.skills||newSkills()).owned.includes(id)){ no(s.name+' is not learned yet: '+(s.set?'it is a signature skill, earned from a boss or a dungeon':'Aldric (or Master Ryu in Hanami) teaches it at the well')); return; }
  if(s.slot==='basic'&&!canSwap(s.cls,'basic',GEAR.skills)){ no('Only mages can change their basic attack'); return; }
  if(PL.level<needLv(s)){ no(s.name+' needs level '+needLv(s)); return; }
  if(s.slot==='passive'&&idx!==undefined&&idx>=passiveOpen(PL.level,GEAR.skills)){ no(!(GEAR.skills&&GEAR.skills.pa===0)?'Passive slot '+(idx+1)+' opens at level '+PASSIVE_SLOT_LV[idx]:'The passive slot opens with Awakening A1'); return; }
  netSend(idx===undefined?{t:'eqskill',id}:{t:'eqskill',id,idx}); UI_SFX.pickup();
}
/* ---- drag and drop (pointer events, so it works with a finger too) ---- */
var skGridKind='';   // (var: renderSkills can run before this line at load)
const SKD={src:null,on:false,ghost:null,x0:0,y0:0,pid:null,just:false,t0:0,pending:false};   // pending: a redraw that had to wait for the drag to end
function skTarget(x,y){
  const el=document.elementFromPoint(x,y); if(!el) return null;
  const sl=el.closest('.sk-slot'); if(sl) return sl.dataset.caveslot?{cave:true,el:sl}:sl.dataset.ultslot?{ult:true,el:sl}:{slot:sl.dataset.slot,el:sl};   // cave, ult: the 4th and 5th slots' rows
  const ps=el.closest('.sk-pslot'); if(ps) return {idx:+ps.dataset.idx,el:ps};
  const area=el.closest('.sk-area'); if(area) return {area:true,el:area};
  return null;
}
// a tile out of the grid goes onto its own slot; a tile out of a slot goes back to the grid
const skDragDef=src=>src.cave?caveSkillDef(src.id):src.ult?ultDef(src.id):skillDef(src.id);   // ult: a burst tile (data-ult)
   // cave: a cave tile (data-cave) drags its cave skill
function skCanDrop(src,tg){
  if(!tg) return false; const s=skDragDef(src);
  if(src.ult) return src.from==='grid'?!!tg.ult:!!tg.area;   // ult: a burst goes on the 5th slot, and back to the grid off it
  if(src.cave) return src.from==='grid'?!!tg.cave:!!tg.area;   // cave: a cave skill goes on the 4th slot, and back to the grid off it
  if(src.from==='grid') return s.slot==='passive'?tg.idx!==undefined&&tg.idx<passiveOpen(PL.level,GEAR.skills):tg.slot===s.slot;
  return !!tg.area;
}
function skDown(e){
  const t=e.target.closest('.sk-tile[data-id],.sk-tile[data-cave][data-from],.sk-tile[data-ult][data-from]'); if(!t||e.button>0) return;   // cave: a cave tile too
  if(SKD.src) skCancel();   // a drag that never ended (a missed pointerup)
  SKD.src=t.dataset.ult?{id:t.dataset.ult,from:t.dataset.from,ult:true}:t.dataset.cave?{id:t.dataset.cave,from:t.dataset.from,cave:true}:{id:t.dataset.id,from:t.dataset.from}; SKD.on=false; SKD.x0=e.clientX; SKD.y0=e.clientY; SKD.pid=e.pointerId; SKD.t0=performance.now(); SKD.pending=false;
  try{ t.setPointerCapture(e.pointerId); }catch(_){}   // the pointerup arrives even if the pointer ends up outside the window
  addEventListener('pointermove',skMove,{passive:false}); addEventListener('pointerup',skUp); addEventListener('pointercancel',skCancel); addEventListener('blur',skCancel);
}
function skMove(e){
  if(e.pointerId!==SKD.pid||!SKD.src) return;
  if(!SKD.on){
    if(Math.hypot(e.clientX-SKD.x0,e.clientY-SKD.y0)<7) return;
    SKD.on=true; const s=skDragDef(SKD.src);
    SKD.ghost=document.createElement('div'); SKD.ghost.className='drag-ghost sk-ghost'; SKD.ghost.style.borderColor=elOf(s)==='basic'?'':ELEMS[elOf(s)].col; SKD.ghost.innerHTML=SKD.src.ult?`<svg ${SS_ICON_ATTR}>${ssGlyph(s)||''}</svg>`:skIconOf(s); if(ssTint(s)){ SKD.ghost.classList.add('has-set'); SKD.ghost.style.setProperty('--set',ssTint(s)); } document.body.append(SKD.ghost);
    document.body.classList.add('dragging');
    if(SKD.src.ult&&SKD.src.from==='grid'){ const c=document.querySelector('#skills .sk-slot.ult'); if(c) c.classList.add('can'); }   // ult: the 5th slot
    else if(SKD.src.cave&&SKD.src.from==='grid'){ const c=document.querySelector('#skills .sk-slot.cave'); if(c) c.classList.add('can'); }   // cave: the 4th slot
    else if(SKD.src.from==='grid'){ document.querySelectorAll(s.slot==='passive'?'#skills .sk-pslot:not(.locked)':`#skills .sk-slot[data-slot="${s.slot}"]`).forEach(x=>x.classList.add('can')); }
    else { const a=document.querySelector('#skills .sk-area'); if(a) a.classList.add('can'); }
    const lifted=document.querySelector(`#skills .sk-tile[${SKD.src.ult?'data-ult':SKD.src.cave?'data-cave':'data-id'}="${SKD.src.id}"][data-from="${SKD.src.from}"]`); if(lifted) lifted.classList.add('lifted');
    UI_SFX.click();
  }
  e.preventDefault();
  SKD.ghost.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%) scale(1.1)`;
  const tg=skTarget(e.clientX,e.clientY);
  document.querySelectorAll('#skills .over').forEach(x=>x.classList.remove('over'));
  if(tg&&skCanDrop(SKD.src,tg)) tg.el.classList.add('over');
}
function skEnd(){
  removeEventListener('pointermove',skMove); removeEventListener('pointerup',skUp); removeEventListener('pointercancel',skCancel); removeEventListener('blur',skCancel);
  if(SKD.ghost){ SKD.ghost.remove(); SKD.ghost=null; }
  document.body.classList.remove('dragging');
  document.querySelectorAll('#skills .can,#skills .over,#skills .lifted').forEach(x=>x.classList.remove('can','over','lifted'));
}
function skCancel(){ skEnd(); SKD.src=null; SKD.on=false; skFlush(); }
function skFlush(){ if(SKD.pending){ SKD.pending=false; renderSkills(); } }
function skUp(e){
  if(e.pointerId!==SKD.pid) return;
  const src=SKD.src, was=SKD.on; skEnd(); SKD.src=null; SKD.on=false;
  if(!src||!was){ skFlush(); return; }          // a plain tap: the click handler selects the skill
  SKD.just=true; setTimeout(()=>SKD.just=false,0);
  skDrop(src,skTarget(e.clientX,e.clientY)); skFlush();
}
// what dropping a tile there does; anything refused says why
function skDrop(src,tg){
  if(src.ult){ ultDrop(src,tg); return; }   // ult: game/ult/slot.js
  if(src.cave){ caveDrop(src,tg); return; }   // cave: game/cave/slot.js
  const s=skillDef(src.id); if(!tg) return;
  if(src.from==='grid'){
    if(s.slot==='passive'){ if(tg.idx===undefined){ if(tg.slot||tg.area){ toast(s.name+' is a passive: drop it on a passive slot','bad'); UI_SFX.error(); } return; } skEquip(s.id,tg.idx); }
    else {
      if(tg.slot!==s.slot){ if(tg.slot||tg.idx!==undefined){ toast(s.name+' goes in slot '+SLOT_NO[s.slot],'bad'); UI_SFX.error(); } return; }
      skEquip(s.id);
    }
  } else if(tg.area){
    if(src.from==='slot:basic'){ toast(canSwap(skTab||clsOf(),'basic',GEAR.skills)?'The basic slot is never empty: drop another basic attack onto it':'Only mages can change their basic attack','bad'); UI_SFX.error(); return; }
    if(src.from.startsWith('pslot')) netSend({t:'unskill',slot:'pass',idx:+src.from.split(':')[1]});
    else netSend({t:'unskill',cls:skTab||clsOf(),slot:src.from.split(':')[1]});
    UI_SFX.click();
  }
}
$('#skBody').addEventListener('pointerdown',skDown);
$('#skBody').addEventListener('dragstart',e=>e.preventDefault());   // never the browser's own drag of an icon
$('#skBody').addEventListener('contextmenu',e=>{ if(e.target.closest('.sk-tile')) e.preventDefault(); });   // (a long press on a phone)
$('#skBody').addEventListener('click',e=>{
  if(SKD.just) return;
  const t=e.target.closest('.sk-tile[data-id]'); if(!t) return;
  SK.sel=SK.sel===t.dataset.id?null:t.dataset.id; UI_SFX.click(); renderSkills();
});
$('#skBody').addEventListener('dblclick',e=>{
  const t=e.target.closest('.sk-tile[data-id]'); if(!t||t.dataset.from!=='grid') return;
  const s=skillDef(t.dataset.id); skEquip(s.id);
});
