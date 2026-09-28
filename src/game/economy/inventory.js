//@ Inventory panel: equipment worn on a body outline, the bag as a grid of icons, drag and drop between them
/* Drag an item from the bag onto its place on the body to put it on; drag a worn item back to the bag to take it off.
   Works with mouse and touch (pointer events). Tap an item to see its details and a button; double-click equips. */
const BODY_SLOTS=[['helmet','head'],['weapon','hand'],['top','chest'],['bottom','legs'],['shoes','feet']];
const INV={sel:null};   // selected item: {id, from:'bag'|slot}
const slotOf=it=>it.kind==='weapon'?'weapon':it.slot;
function bagCounts(){ // items in the bag that are not being worn (one copy of each worn item is on the body)
  const c={}; GEAR.inv.forEach(id=>c[id]=(c[id]||0)+1);
  for(const s in GEAR.eq){ const id=GEAR.eq[s]; if(id&&c[id]){ c[id]--; if(!c[id]) delete c[id]; } }
  return c;
}
function tile(it,from,count){
  const locked=PL.level<it.lv, sel=INV.sel&&INV.sel.id===it.id&&INV.sel.from===from;
  return `<button class="tile r${it.rar}${locked?' locked':''}${sel?' sel':''}${from==='bag'&&count>=MERGE_COUNT&&it.rar<4?' mergeable':''}" data-id="${it.id}" data-from="${from}" aria-label="${it.name}${locked?', needs level '+it.lv:''}">${itemIcon(it)}<span class="lv">${it.lv}</span>${count>1?`<span class="ct">x${count}</span>`:''}${from==='bag'&&count>=MERGE_COUNT&&it.rar<4?'<span class="mg" title="Enough to merge at the forge"></span>':''}</button>`;
}
const SIL='<svg class="doll-sil" viewBox="0 0 120 240" aria-hidden="true"><circle cx="60" cy="30" r="20"/><path d="M60 54c-20 0-34 8-37 26l-8 58c-1 6 7 8 9 2l10-50v62l-4 76c0 7 10 7 11 0l12-66h14l12 66c1 7 11 7 11 0l-4-76v-62l10 50c2 6 10 4 9-2l-8-58c-3-18-17-26-37-26z"/></svg>';
function renderInv(){
  $('#plCoins').textContent=GEAR.coins;
  if($('#inv').hidden) return;
  $('#invCoins').textContent=GEAR.coins+' coins';
  const g=gearStats(), c=CLASSES[clsOf()];
  let h=`<div class="inv-stats"><div><span>Level</span><b>${PL.level}</b></div><div><span>Class</span><b>${c.name}</b></div><div><span>Soul</span><b style="color:${ELEMS[soulNow()].col}">${ELEMS[soulNow()].name}</b></div><div><span>Health</span><b>${PL.maxHp}</b></div><div><span>Damage</span><b>${Math.round(PL.dmg)}</b></div><div><span>Defense</span><b>${g.def} <small>(${Math.round(PL.red*100)}% less damage)</small></b></div></div>`;
  h+='<div class="inv-wrap"><div class="doll" id="invDoll">'+SIL;
  for(const [s,area] of BODY_SLOTS){
    const it=ITEM[GEAR.eq[s]];
    h+=`<div class="eqslot" data-slot="${s}" style="grid-area:${area}"><span class="eq-l">${SLOT_LABEL[s]}</span>${it?tile(it,s,1):`<div class="tile empty">${slotIcon(s)}</div>`}</div>`;
  }
  const counts=bagCounts(), ids=Object.keys(counts).sort((a,b)=>ITEM[a].kind.localeCompare(ITEM[b].kind)||ITEM[b].tier-ITEM[a].tier||ITEM[a].slot.localeCompare(ITEM[b].slot));
  h+=`</div><div class="bag"><div class="inv-h">Bag <span>${GEAR.inv.length} / 80</span></div><div class="bag-grid" id="invBag">${ids.map(id=>tile(ITEM[id],'bag',counts[id])).join('')||'<p class="muted bag-empty">Nothing in your bag. Items you take off land here.</p>'}</div></div></div>`;
  h+=`<div class="inv-info" id="invInfo"></div>`;
  // monster drops: only used to upgrade skills (Skills panel)
  const mats=GEAR.mats||{}, have=MAT_IDS.filter(id=>mats[id]>0);
  h+=`<div class="inv-h">Monster drops <span>${have.length?'for upgrading skills':''}</span></div><div class="mat-row">${have.length?have.map(id=>`<span class="mat" title="Dropped by ${MATS[id].from} (level ${MATS[id].lv})"><i style="background:${MATS[id].col}"></i>${MATS[id].name} <b>${mats[id]}</b></span>`).join(''):'<p class="muted">Monsters sometimes drop materials. You use them to upgrade your skills at a trainer.</p>'}</div>`;
  $('#invBody').innerHTML=h;
  if(INV.sel && !(INV.sel.from==='bag'?counts[INV.sel.id]:GEAR.eq[INV.sel.from]===INV.sel.id)) INV.sel=null;
  renderInvInfo();
}
function statDiff(it,cur){
  const k=it.kind==='weapon'?[['atk','attack']]:[['hp','health'],['def','defense']];
  return k.map(([f,n])=>{ const d=(it[f]||0)-((cur&&cur[f])||0); return d?`<span class="${d>0?'up':'down'}">${d>0?'+':''}${d} ${n}</span>`:''; }).filter(Boolean).join(' ');
}
function renderInvInfo(){
  const el=$('#invInfo'); if(!el) return;
  if(!INV.sel){ el.innerHTML=`<p class="muted">${isTouch?'Tap':'Click'} an item for details. Drag it onto your body to wear it, or back into the bag to take it off.</p>`; return; }
  const it=ITEM[INV.sel.id], worn=INV.sel.from!=='bag', slot=slotOf(it), cur=ITEM[GEAR.eq[slot]], locked=PL.level<it.lv;
  const kind=it.kind==='weapon'?it.slot[0].toUpperCase()+it.slot.slice(1)+' ('+CLASSES[CLASS_OF[it.slot]].name+')':SLOT_LABEL[slot];
  let cmp='';
  const have=bagCounts()[it.id]||0;
  if(!worn && have>=MERGE_COUNT && it.rar<4) cmp=`<span style="color:${RAR_COL[it.rar+1]}">You have ${have}: Greta's forge (or Tetsuo's in Hanami) can merge 3 into a ${RARITY[it.rar+1]} one.</span>`;
  if(!worn){ const d=statDiff(it,cur); cmp=(cmp?cmp+'<br>':'')+(cur?(d?`${d} <span class="muted">compared to your ${cur.name}</span>`:'<span class="muted">Same as what you wear</span>'):'<span class="up">Fills an empty slot</span>'); }
  const btn=worn?(slot==='weapon'?'<span class="muted">You always hold a weapon: drag another one onto your hand to swap.</span>':`<button class="chip" data-unequip="${slot}">Take off</button>`)
    :`<button class="chip" data-equip="${it.id}" ${locked?'disabled':''}>${locked?'Needs level '+it.lv:'Equip'}</button>`;
  el.innerHTML=`<div class="ii-ico r${it.rar}">${itemIcon(it)}</div><div class="ii-main"><b style="color:${RAR_COL[it.rar]}">${it.name}</b>
    <span>${RARITY[it.rar]} ${kind} &middot; <span class="${locked?'req bad':''}">level ${it.lv}</span> &middot; ${itemStat(it)}</span>${cmp?`<span>${cmp}</span>`:''}</div><div class="ii-btn">${btn}</div>`;
  el.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{ equip(b.dataset.equip); INV.sel=null; });
  el.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>{ unequip(b.dataset.unequip); INV.sel=null; });
}
/* ---- drag and drop (pointer events, so it works with a finger too) ---- */
const DRAG={src:null,on:false,ghost:null,x0:0,y0:0,pid:null,just:false};
function dropTargetAt(x,y){
  const el=document.elementFromPoint(x,y); if(!el) return null;
  const slot=el.closest('.eqslot'); if(slot) return {slot:slot.dataset.slot,el:slot};
  const bag=el.closest('.bag'); if(bag) return {bag:true,el:bag};
  return null;
}
function canDrop(src,tg){
  if(!tg) return false; const it=ITEM[src.id];
  if(src.from==='bag') return !!tg.slot && tg.slot===slotOf(it);
  return !!tg.bag && src.from!=='weapon';
}
function invDown(e){
  const t=e.target.closest('.tile[data-id]'); if(!t||e.button>0) return;
  DRAG.src={id:t.dataset.id,from:t.dataset.from}; DRAG.on=false; DRAG.x0=e.clientX; DRAG.y0=e.clientY; DRAG.pid=e.pointerId;
  addEventListener('pointermove',invMove,{passive:false}); addEventListener('pointerup',invUp); addEventListener('pointercancel',invCancel);
}
function invMove(e){
  if(e.pointerId!==DRAG.pid||!DRAG.src) return;
  if(!DRAG.on){
    if(Math.hypot(e.clientX-DRAG.x0,e.clientY-DRAG.y0)<7) return;
    DRAG.on=true; const it=ITEM[DRAG.src.id];
    DRAG.ghost=document.createElement('div'); DRAG.ghost.className='drag-ghost r'+it.rar; DRAG.ghost.innerHTML=itemIcon(it); document.body.append(DRAG.ghost);
    document.body.classList.add('dragging');
    if(DRAG.src.from==='bag'){ const s=document.querySelector(`.eqslot[data-slot="${slotOf(it)}"]`); if(s) s.classList.add('can'); }
    else if(DRAG.src.from!=='weapon'){ const b=document.querySelector('#inv .bag'); if(b) b.classList.add('can'); }
    const src=document.querySelector(`.tile[data-id="${DRAG.src.id}"][data-from="${DRAG.src.from}"]`); if(src) src.classList.add('lifted');
    UI_SFX.click();
  }
  e.preventDefault();
  DRAG.ghost.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%) scale(1.1)`;
  const tg=dropTargetAt(e.clientX,e.clientY);
  document.querySelectorAll('#inv .over').forEach(x=>x.classList.remove('over'));
  if(tg&&canDrop(DRAG.src,tg)) tg.el.classList.add('over');
}
function invEnd(){
  removeEventListener('pointermove',invMove); removeEventListener('pointerup',invUp); removeEventListener('pointercancel',invCancel);
  if(DRAG.ghost){ DRAG.ghost.remove(); DRAG.ghost=null; }
  document.body.classList.remove('dragging');
  document.querySelectorAll('#inv .can,#inv .over,#inv .lifted').forEach(x=>x.classList.remove('can','over','lifted'));
}
function invCancel(){ invEnd(); DRAG.src=null; DRAG.on=false; }
function invUp(e){
  if(e.pointerId!==DRAG.pid) return;
  const src=DRAG.src, was=DRAG.on; invEnd(); DRAG.src=null; DRAG.on=false;
  if(!src||!was) return;                       // a plain tap: the click handler selects the item
  DRAG.just=true; setTimeout(()=>DRAG.just=false,0);
  const it=ITEM[src.id], tg=dropTargetAt(e.clientX,e.clientY);
  if(!tg) return;
  if(src.from==='bag'){
    if(!tg.slot) return;
    if(tg.slot!==slotOf(it)){ toast(it.name+' goes on your '+SLOT_LABEL[slotOf(it)].toLowerCase(),'bad'); UI_SFX.error(); return; }
    equip(it.id); INV.sel=null;
  } else if(tg.bag){
    if(src.from==='weapon'){ toast('You always hold a weapon: drag another one onto your hand to swap','bad'); UI_SFX.error(); return; }
    unequip(src.from); INV.sel=null; UI_SFX.click();
  }
}
$('#invBody').addEventListener('pointerdown',invDown);
$('#invBody').addEventListener('click',e=>{
  if(DRAG.just) return;
  const t=e.target.closest('.tile[data-id]'); if(!t) return;
  const same=INV.sel&&INV.sel.id===t.dataset.id&&INV.sel.from===t.dataset.from;
  INV.sel=same?null:{id:t.dataset.id,from:t.dataset.from}; UI_SFX.click();
  document.querySelectorAll('#inv .tile.sel').forEach(x=>x.classList.remove('sel')); if(!same) t.classList.add('sel');
  renderInvInfo();
});
$('#invBody').addEventListener('dblclick',e=>{
  const t=e.target.closest('.tile[data-id]'); if(!t) return;
  if(t.dataset.from==='bag') equip(t.dataset.id); else unequip(t.dataset.from);
  INV.sel=null;
});
function toggleInv(){ if($('#inv').hidden){ INV.sel=null; openPanel('inv'); renderInv(); } else closePanels(); }
$('#bInv').addEventListener('click',e=>{ e.currentTarget.blur(); toggleInv(); });
$('#invSkills').addEventListener('click',()=>openSkills());
