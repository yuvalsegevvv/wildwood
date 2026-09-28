//@ Panel open/close helpers (openPanel, closePanels, uiOpen, releasePointer)
/* ----- panels ----- */
const PANELS=['inv','shop','quests','map','forge','skills'];
let panelNPC=null;
// the mouse look is locked while playing; panels, chat and the editor need the pointer back
function releasePointer(){ if(document.pointerLockElement) try{ document.exitPointerLock(); }catch(_){} }
function openPanel(id,npc){
  PANELS.forEach(p=>{ if(p!==id) $('#'+p).hidden=true; });
  const el=$('#'+id), was=!el.hidden; el.hidden=false; panelNPC=npc||null;
  releasePointer();
  if(!was) UI_SFX.open();
}
function closePanels(){ let was=false; PANELS.forEach(p=>{ const e=$('#'+p); if(!e.hidden){ e.hidden=true; was=true; } }); panelNPC=null; if(was) UI_SFX.close(); }
function uiOpen(){ return customizing||PANELS.some(p=>!$('#'+p).hidden); }
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closePanels));
const row=(it,right,note)=>`<div class="it"><span class="it-ico r${it.rar}">${itemIcon(it)}</span><div class="it-main"><b style="color:${RAR_COL[it.rar]}">${it.name}</b><span>${itemStat(it)}</span><span class="${PL.level<it.lv?'req bad':'req'}">Level ${it.lv}${note?' &nbsp; '+note:''}</span></div>${right}</div>`;

