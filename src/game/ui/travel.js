//@ The travel window: stepping on a teleport circle and pressing the talk key lists every village (CIRCLES in shared/hoarfrost.js); the ones you have not walked to yet are locked
/* The server does the travelling (warp{to}, warpP in server/players.js) and checks the same rules; this window only shows them. It closes when you
   step off the circle. */
const TR_ICON={
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  hanami:'<path d="M12 3c2 3 2 6 0 9-2-3-2-6 0-9zM12 12c3-2 6-2 9 0-3 2-6 2-9 0zM12 12c2 3 2 6 0 9-2-3-2-6 0-9zM12 12c-3 2-6 2-9 0 3-2 6-2 9 0z"/>',
  rimehold:'<path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/><path d="M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>'
};
function openTravel(){ openPanel('travel'); renderTravel(); }
function renderTravel(){
  if($('#travel').hidden) return;
  const here=nearCircle(), g=GEAR||{};
  let h='<p class="tr-intro">The old stones hum under your feet. Choose where they carry you.</p><div class="tr-grid">';
  for(const C of CIRCLES){
    const cur=here===C.V, open=C.open(g);
    h+=`<button class="tr-dest${cur?' here':''}" data-to="${C.id}" ${cur||!open?'disabled':''}><span class="tr-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TR_ICON[C.id]}</svg></span><b>${C.name}</b><small>${C.land} · levels ${C.lv}</small><span class="tr-state">${cur?'You are here':open?'Travel here':C.hint}</span></button>`;
  }
  h+='</div>';
  $('#trBody').innerHTML=h;
  $('#trBody').querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>{ netSend({t:'warp',to:b.dataset.to}); UI_SFX.click(); closePanels(); });
}
