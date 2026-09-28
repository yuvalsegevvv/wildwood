//@ Element helpers for the interface (icons, chips) and the Soul Shrine panel in Hanami, where you bind your soul to an element
/* Kaede, the shrine maiden at Hanami's raked garden, opens the panel (role 'soul'). It needs level SOUL_LV; changing your soul costs nothing
   and can be done as often as you like. The server checks the level and that you stand in Hanami (bindSoulP), so anywhere else the
   buttons only answer with a toast. The rules and the multipliers are in shared/elements.js. */
const ELEM_ICON={
  basic:'<circle cx="12" cy="12" r="7"/>',
  fire:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"/>',
  water:'<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>',
  earth:'<path d="M3 20l6-11 4 6 3-4 5 9z"/>',
  air:'<path d="M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7"/>',
  dark:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
};
const elSvg=el=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ELEM_ICON[el]||ELEM_ICON.basic}</svg>`;
const elChip=el=>`<span class="el-chip" style="--el:${ELEMS[el].col}">${elSvg(el)}${ELEMS[el].name}</span>`;
// the element you are bound to (the server only counts it from level SOUL_LV)
const soulNow=()=>PL.level>=SOUL_LV&&GEAR&&ELEMS[GEAR.soul]?GEAR.soul:'basic';
function openSoul(n){ openPanel('soul',n||null); renderSoul(); }
function renderSoul(){
  if($('#soul').hidden) return;
  const open=PL.level>=SOUL_LV, cur=soulNow(), cls=clsOf();
  const up=Math.round((ELEM_BOOST-1)*100), down=Math.round((1-1/ELEM_BOOST)*100);
  $('#soTitle').textContent=panelNPC?panelNPC.def.name+"'s shrine":'Soul shrine';
  let h=`<p class="so-intro">Bind your soul to an element. Your skills of that element deal ${up}% more damage, and skills of its opposite deal ${down}% less. Change it whenever you like: it costs nothing.</p>`;
  if(!open) h+=`<p class="so-lock">The shrine answers only hikers of level ${SOUL_LV} and above.</p>`;
  h+=`<div class="so-now">Your soul: ${elChip(cur)}</div><div class="so-grid">`;
  for(const el of [...ELEM_WHEEL,'dark','light','basic']){
    const mine=SKILL_IDS.filter(id=>SKILLS[id].cls===cls&&elOf(SKILLS[id])===el).map(id=>SKILLS[id].name);
    const sub=el==='basic'?'No bonus, no penalty':'Opposite: '+ELEMS[ELEM_OPP[el]].name;
    h+=`<button class="so-el" data-soul="${el}" aria-pressed="${el===cur}" ${open?'':'disabled'} style="--el:${ELEMS[el].col}"><span class="so-ico">${elSvg(el)}</span><b>${ELEMS[el].name}</b><small>${sub}</small><span class="so-sk">${mine.length?'Your '+CLASSES[cls].name+' skills: '+mine.join(', '):(el==='basic'?'':'None of your '+CLASSES[cls].name+' skills')}</span></button>`;
  }
  h+=`</div><p class="so-note">Monsters have elements too. The opposite element hurts them ${up}% more, and their own element only ${100-down}% as much. Their element is shown on the target frame.</p>`;
  $('#soBody').innerHTML=h;
  $('#soBody').querySelectorAll('[data-soul]').forEach(b=>b.onclick=()=>{ if(b.dataset.soul===soulNow()) return; netSend({t:'soul',el:b.dataset.soul}); UI_SFX.click(); });
}
