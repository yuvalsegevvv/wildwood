//@ Skills panel: a tab for each attack slot (1 basic, 2 skill, 3 burst) and the passives, drag skills onto the active slots, upgrade with coins and monster drops, learn from the trainers
/* Open it with K, the Skills button in the inventory, the empty skill button, or by talking to Aldric (or Master Ryu in Hanami).
   Top: the active slots of the class you are looking at (drop targets) and the three passive slots (the same for every class, opening at levels 18, 24 and 30: PASSIVE_SLOT_LV).
   Below: a tab per kind and a grid of its skills. Drag a skill you own onto its slot to use it, drag one out of a slot back into the grid to take it
   off; tap a skill for its details, Equip / Take off buttons (for touch) and its upgrade. Learning and upgrading happen at a trainer. */
let skTab=null, skKind='skill';
const SK={sel:null};   // the selected skill or passive id
function openSkills(n,kind){ openPanel('skills',n||null); skTab=clsOf(); if(KIND_TITLE[kind]) skKind=kind; SK.sel=null; renderSkills(); }
function toggleSkills(){ if(!started||customizing) return; if($('#skills').hidden) openSkills(); else closePanels(); }
const skIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`;
const SLOT_TITLE={basic:'1 · Basic attack',skill:'2 · Skill',burst:'3 · Burst'}, KIND_TITLE={basic:'1 · Basic',skill:'2 · Skill',burst:'3 · Burst',pass:'Passive'};
const needLv=s=>s.slot==='passive'?Math.max(PASSIVE_LV,s.lv):Math.max(slotLv(s.slot),s.lv);
const SLOT_NO={basic:1,skill:2,burst:3};
// one skill as a tile: its icon, element dot, and its level (or price / required level when you do not own it yet)
function skTile(s,C,from){
  const own=C.S.owned.includes(s.id), low=C.lv<needLv(s), L=skillLvOf(C.S,s.id), el=elOf(s);
  const drag=true;   // every tile can be dragged, so a drop that is refused always says why (not learned yet, level, the basic slot, a locked slot)
  return `<button class="sk-tile${el!=='basic'?' has-el':''}${SK.sel===s.id?' sel':''}${own?'':' unowned'}${low?' locked':''}${drag?' drag':''}${s.slot==='burst'?' burst':''}" data-id="${s.id}" data-from="${from}" data-drag="${drag?1:0}" style="--el:${el==='basic'?'transparent':ELEMS[el].col}" aria-label="${s.name}${own?', level '+L:''}">${skIcon(s.name)}${el!=='basic'?'<i class="el-dot"></i>':''}<span class="lv">${own?'Lv '+L:s.drop?'Boss':low?'Lv '+needLv(s):s.price?s.price+'c':'Free'}</span></button>`;
}
function skSlotsHtml(C,cls){
  const act=SLOTS.map(slot=>{
    const a=abilityOf(cls,slot,C.S,C.lv), locked=C.lv<slotLv(slot);
    return `<div class="sk-slot${a?' on':''}${locked?' locked':''}" data-slot="${slot}"><span class="sk-n">${SLOT_TITLE[slot]}</span>${a?skTile(a,C,'slot:'+slot):`<div class="sk-tile empty">${skIcon(locked?'lock':'plus')}</div>`}<b>${a?a.name:locked?'Opens at level '+slotLv(slot):'Empty'}</b><small>${a?abilityCd(a,C.S,C.lv).toFixed(1)+' s'+(elOf(a)!=='basic'?' · '+ELEMS[elOf(a)].name:''):locked?'':'Drag one here'}</small></div>`;
  }).join('');
  const open=C.lv>=PASSIVE_LV;
  const pas=Array.from({length:PASSIVE_SLOTS},(_,i)=>{   // slot i opens at level PASSIVE_SLOT_LV[i]
    const id=C.S.pass&&C.S.pass[i], P=PASSIVES[id], usable=C.lv>=PASSIVE_SLOT_LV[i];
    return `<div class="sk-pslot${P?' on':''}${usable?'':' locked'}" data-idx="${i}"><span class="sk-n">Passive ${i+1}</span>${P?skTile(P,C,'pslot:'+i):`<div class="sk-tile empty">${skIcon(usable?'plus':'lock')}</div>`}<b>${P?P.name:usable?'Empty':'Level '+PASSIVE_SLOT_LV[i]}</b><small>${P?passiveText(id,skillLvOf(C.S,id)):usable?'Drag one here':''}</small></div>`;
  }).join('');
  const later=PASSIVE_SLOT_LV.map((l,i)=>C.lv<l?'slot '+(i+1)+' at level '+l:'').filter(Boolean).join(', ');
  return `<div class="sk-load-h">Active skills</div><div class="sk-load">${act}</div><div class="sk-load-h">Passive skills <span>${open?'the same for every class'+(later?' · '+later:''):'open at level '+PASSIVE_LV}</span></div><div class="sk-load pas">${pas}</div>`;
}
// details of the selected skill: what it does at its level, how to equip it, and what its next level costs
function skInfoHtml(C,cls){
  const s=SK.sel&&skillDef(SK.sel);
  if(!s) return `<p class="muted">${isTouch?'Tap':'Click'} a skill for details. Drag one you own onto its slot to use it, or out of its slot to take it off.</p>`;
  const S=C.S, own=S.owned.includes(s.id), L=skillLvOf(S,s.id), pass=s.slot==='passive', low=C.lv<needLv(s), el=elOf(s);
  const PS=S.pass||[], eq=pass?PS.includes(s.id):((abilityOf(s.cls,s.slot,S,C.lv)||{}).id===s.id);
  let stats;
  if(pass) stats=passiveText(s.id,L);
  else stats=abilityCd(s,S,C.lv).toFixed(1)+' s cooldown'+(s.buff?'':' · '+Math.round(s.mult*skillPower(L)*100)+'% damage')
    +(s.buff?' · +'+Math.round((s.buff.dmg-1)*skillPower(L)*100)+'% damage for '+(s.buff.dur+0.5*(L-1))+' s':'');
  const boss=s.drop?BOSS_DEFS.find(b=>b.def.id===s.drop).short:'';   // the boss that drops it (boss skills are not sold and cannot be upgraded yet)
  const tags=`<span class="sk-tag">${pass?'Passive':CLASSES[s.cls].name+' · '+KIND_TITLE[s.slot]}${boss?' · dropped by '+boss:''}</span>${pass?'':elChip(el)}`;
  let acts='';
  if(own){
    if(eq&&!pass&&s.slot!=='basic') acts+=`<button class="chip" data-unskill="${s.slot}">Take off</button>`;
    else if(eq&&pass) acts+=`<button class="chip" data-unpass="${PS.indexOf(s.id)}">Take off</button>`;
    else if(!eq&&!(s.slot==='basic'&&!canSwap(s.cls,'basic'))) acts+=`<button class="chip" data-eqskill="${s.id}" ${low?'disabled':''}>${low?'Level '+needLv(s):'Equip'}</button>`;
  } else if(s.drop) acts+=`<span class="muted">Dropped by ${boss}: ${Math.round(BOSS_SKILL_CHANCE*100)}% per kill</span>`;
  else if(C.trainer) acts+=`<button class="chip buy" data-buyskill="${s.id}" ${GEAR.coins<s.price||C.lv<needLv(s)?'disabled':''}>${C.lv<needLv(s)?'Level '+needLv(s):'Learn: '+s.price+' coins'}</button>`;
  else acts+=`<span class="muted">Aldric (or Master Ryu in Hanami) teaches it at the well: ${s.price} coins</span>`;
  let up='';
  if(own){
    if(s.drop) up=`<div class="sk-up"><b>Boss skill</b><span class="muted">It cannot be upgraded yet.</span></div>`;
    else if(L>=SKILL_MAX_LV) up=`<div class="sk-up"><b>Highest level</b><span class="muted">${s.name} cannot be upgraded any further.</span></div>`;
    else {
      const n=upgradeNeeds(s.id,L+1), have=GEAR.mats||{}, cOk=GEAR.coins>=n.coins, all=cOk&&n.mats.every(m=>(have[m.id]||0)>=m.n);
      const gain=pass?passiveText(s.id,L+1):Math.round((skillPower(L+1)/skillPower(L)-1)*1000)/10+'% more '+(s.buff?'bonus':'damage')+', '+Math.round((1-skillCdMult(L+1)/skillCdMult(L))*1000)/10+'% shorter cooldown';
      up=`<div class="sk-up"><b>Level ${L} &rarr; ${L+1}</b><span>${gain}</span><div class="sk-cost"><span class="${cOk?'ok':'bad'}">${n.coins} coins</span>${n.mats.map(m=>`<span class="${(have[m.id]||0)>=m.n?'ok':'bad'}" title="Dropped by ${MATS[m.id].from} (level ${MATS[m.id].lv})"><i style="background:${MATS[m.id].col}"></i>${MATS[m.id].name} ${have[m.id]||0}/${m.n}</span>`).join('')}</div>`
        +(C.trainer?`<button class="chip buy" data-upskill="${s.id}" ${all?'':'disabled'}>Upgrade</button>`:'<span class="muted">Upgrades happen at Aldric (or Master Ryu in Hanami).</span>')+'</div>';
    }
  }
  const lock=low?`<span class="req bad">needs level ${needLv(s)}</span>`:'';
  return `<div class="sk-ii"><div class="sk-ii-h"><div class="sk-ico">${skIcon(s.name)}</div><div class="sk-ii-main"><b>${s.name}</b><div class="sk-tags">${tags}</div><span class="sk-meta">${own?'Level '+L+' of '+SKILL_MAX_LV+' &middot; ':''}${stats} ${lock}</span></div><div class="sk-ii-btn">${acts}</div></div><p class="sk-desc">${pass?passiveText(s.id,L):s.desc}</p>${up}</div>`;
}
function renderSkills(){
  if($('#skills').hidden) return;
  if(SKD.src&&performance.now()-SKD.t0<8000){ SKD.pending=true; return; }   // not while a tile is being dragged (the server keeps sending updates): after the drop
  const trainer=!!(panelNPC&&panelNPC.def.role==='trainer'), S=GEAR.skills||newSkills(), cls=skTab||clsOf(), lv=PL.level, C={S,lv,trainer};
  $('#skTitle').textContent=trainer?panelNPC.def.name+"'s lessons":'Skills'; $('#skCoins').textContent=GEAR.coins+' coins';
  const pass=skKind==='pass';
  let h=pass?'':`<div class="chips pn-tabs">${Object.keys(CLASSES).map(c=>`<button class="chip" data-sktab="${c}" aria-pressed="${c===cls}">${CLASSES[c].name}${c===clsOf()?' (you)':''}</button>`).join('')}</div>`;
  h+=`<div class="sk-soul">Soul: ${elChip(soulNow())} <span>${PL.level>=SOUL_LV?'Skills of this element deal more damage. Change it at the shrine in Hanami.':'Bind your soul to an element at the shrine in Hanami, from level '+SOUL_LV+'.'}</span></div>`;
  h+=skSlotsHtml(C,cls);
  h+=`<div class="sk-area"><div class="chips sk-kinds">${['basic','skill','burst','pass'].map(k=>`<button class="chip" data-skkind="${k}" aria-pressed="${k===skKind}">${KIND_TITLE[k]}</button>`).join('')}</div>`;
  let ids;
  if(pass){ ids=PASSIVE_IDS; if(lv<PASSIVE_LV) h+=`<p class="muted sk-note">Passive skills open at level ${PASSIVE_LV}. They work for every class.</p>`; }
  else {
    ids=SKILL_IDS.filter(id=>SKILLS[id].cls===cls&&SKILLS[id].slot===skKind);
    if(skKind!=='basic'&&lv<slotLv(skKind)) h+=`<p class="muted sk-note">This slot opens at level ${slotLv(skKind)}.</p>`;
    if(skKind==='basic'&&!canSwap(cls,'basic')) h+=`<p class="muted sk-note">Only mages can change their basic attack.</p>`;
  }
  h+=`<div class="sk-grid">${ids.map(id=>{ const s=skillDef(id); return `<div class="sk-cell">${skTile(s,C,'grid')}<span class="nm">${s.name}</span></div>`; }).join('')}</div></div>`;
  h+=`<div class="sk-info" id="skInfo">${skInfoHtml(C,cls)}</div>`;
  if(cls!==clsOf()&&!pass) h+=`<p class="muted">You fight as a ${CLASSES[clsOf()].name} right now (your weapon decides). This ${CLASSES[cls].name} loadout is used whenever you hold a ${WEAPON_OF[cls]}.</p>`;
  $('#skBody').innerHTML=h;
  const on=(sel,fn)=>$('#skBody').querySelectorAll(sel).forEach(b=>b.onclick=()=>fn(b));
  on('[data-sktab]',b=>{ skTab=b.dataset.sktab; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-skkind]',b=>{ skKind=b.dataset.skkind; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-eqskill]',b=>{ skEquip(b.dataset.eqskill); });
  on('[data-unskill]',b=>{ netSend({t:'unskill',cls,slot:b.dataset.unskill}); UI_SFX.click(); });
  on('[data-unpass]',b=>{ netSend({t:'unskill',slot:'pass',idx:+b.dataset.unpass}); UI_SFX.click(); });
  on('[data-buyskill]',b=>{ b.disabled=true; netSend({t:'buyskill',id:b.dataset.buyskill}); });
  on('[data-upskill]',b=>{ b.disabled=true; netSend({t:'upskill',id:b.dataset.upskill}); });
}
// put a skill you own in its slot (a passive: slot idx, or the first free one)
function skEquip(id,idx){
  const s=skillDef(id); if(!s) return;
  const no=text=>{ toast(text,'bad'); UI_SFX.error(); };
  if(!(GEAR.skills||newSkills()).owned.includes(id)){ no(s.name+' is not learned yet: '+(s.drop?BOSS_DEFS.find(b=>b.def.id===s.drop).short+' drops it':'Aldric (or Master Ryu in Hanami) teaches it at the well')); return; }
  if(s.slot==='basic'&&!canSwap(s.cls,'basic')){ no('Only mages can change their basic attack'); return; }
  if(PL.level<needLv(s)){ no(s.name+' needs level '+needLv(s)); return; }
  if(s.slot==='passive'&&idx!==undefined&&idx>=passiveOpen(PL.level)){ no('Passive slot '+(idx+1)+' opens at level '+PASSIVE_SLOT_LV[idx]); return; }
  netSend(idx===undefined?{t:'eqskill',id}:{t:'eqskill',id,idx}); UI_SFX.pickup();
}
/* ---- drag and drop (pointer events, so it works with a finger too) ---- */
const SKD={src:null,on:false,ghost:null,x0:0,y0:0,pid:null,just:false,t0:0,pending:false};   // pending: a redraw that had to wait for the drag to end
function skTarget(x,y){
  const el=document.elementFromPoint(x,y); if(!el) return null;
  const sl=el.closest('.sk-slot'); if(sl) return {slot:sl.dataset.slot,el:sl};
  const ps=el.closest('.sk-pslot'); if(ps) return {idx:+ps.dataset.idx,el:ps};
  const area=el.closest('.sk-area'); if(area) return {area:true,el:area};
  return null;
}
// a tile out of the grid goes onto its own slot; a tile out of a slot goes back to the grid
function skCanDrop(src,tg){
  if(!tg) return false; const s=skillDef(src.id);
  if(src.from==='grid') return s.slot==='passive'?tg.idx!==undefined&&tg.idx<passiveOpen(PL.level):tg.slot===s.slot;
  return !!tg.area;
}
function skDown(e){
  const t=e.target.closest('.sk-tile[data-id]'); if(!t||e.button>0) return;
  if(SKD.src) skCancel();   // a drag that never ended (a missed pointerup)
  SKD.src={id:t.dataset.id,from:t.dataset.from}; SKD.on=false; SKD.x0=e.clientX; SKD.y0=e.clientY; SKD.pid=e.pointerId; SKD.t0=performance.now(); SKD.pending=false;
  try{ t.setPointerCapture(e.pointerId); }catch(_){}   // the pointerup arrives even if the pointer ends up outside the window
  addEventListener('pointermove',skMove,{passive:false}); addEventListener('pointerup',skUp); addEventListener('pointercancel',skCancel); addEventListener('blur',skCancel);
}
function skMove(e){
  if(e.pointerId!==SKD.pid||!SKD.src) return;
  if(!SKD.on){
    if(Math.hypot(e.clientX-SKD.x0,e.clientY-SKD.y0)<7) return;
    SKD.on=true; const s=skillDef(SKD.src.id);
    SKD.ghost=document.createElement('div'); SKD.ghost.className='drag-ghost sk-ghost'; SKD.ghost.style.borderColor=elOf(s)==='basic'?'':ELEMS[elOf(s)].col; SKD.ghost.innerHTML=skIcon(s.name); document.body.append(SKD.ghost);
    document.body.classList.add('dragging');
    if(SKD.src.from==='grid'){ document.querySelectorAll(s.slot==='passive'?'#skills .sk-pslot:not(.locked)':`#skills .sk-slot[data-slot="${s.slot}"]`).forEach(x=>x.classList.add('can')); }
    else { const a=document.querySelector('#skills .sk-area'); if(a) a.classList.add('can'); }
    const lifted=document.querySelector(`#skills .sk-tile[data-id="${SKD.src.id}"][data-from="${SKD.src.from}"]`); if(lifted) lifted.classList.add('lifted');
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
  const s=skillDef(src.id); if(!tg) return;
  if(src.from==='grid'){
    if(s.slot==='passive'){ if(tg.idx===undefined){ if(tg.slot||tg.area){ toast(s.name+' is a passive: drop it on a passive slot','bad'); UI_SFX.error(); } return; } skEquip(s.id,tg.idx); }
    else {
      if(tg.slot!==s.slot){ if(tg.slot||tg.idx!==undefined){ toast(s.name+' goes in slot '+SLOT_NO[s.slot],'bad'); UI_SFX.error(); } return; }
      skEquip(s.id);
    }
  } else if(tg.area){
    if(src.from==='slot:basic'){ toast(canSwap(skTab||clsOf(),'basic')?'The basic slot is never empty: drop another basic attack onto it':'Only mages can change their basic attack','bad'); UI_SFX.error(); return; }
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
