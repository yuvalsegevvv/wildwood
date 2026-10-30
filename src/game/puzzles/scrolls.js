//@ Puzzle rewards in the menus: Greta's forge tab for upgrade scrolls, and the gem shop's Sigil track
/* Agent map. pzScrollHtml() / pzScrollBind(root) draw the forge's Scrolls tab (message scroll{id,to}, server/puzzles.js); pzTrackRender(box) draws the Sigil track tab: your Sigils, the next level, the levels as a row
   of lamps, the cosmetic of each level (PZ_TRACK_COS, empty until the content thread fills it). Both read GEAR.scr / GEAR.sig / GEAR.sigPaid. Test: client-smoke (loads). */
function pzScrollHtml(){
  const sc=GEAR.scr||{e:0,u:0}, eligible=to=>[...new Set(GEAR.inv)].filter(id=>{ const it=ITEM[id]; return it&&!it.dg&&id.indexOf('~')<0&&ALL_SLOTS.includes(it.slot)&&(to==='e'?it.rar<=1:it.rar<=2); })
    .sort((a,b)=>ITEM[b].tier-ITEM[a].tier||ITEM[b].rar-ITEM[a].rar||a.localeCompare(b));
  const sect=(to,name,col)=>{ const ids=eligible(to);
    return `<div class="inv-h">${name} upgrade scroll <span>${sc[to]||0} owned</span></div><p class="muted">${to==='e'?'Turns a common or rare piece into epic.':'Turns a common, rare or epic piece into unique.'} Chests of the puzzle stones drop ${to==='e'?'epic':'unique'} scrolls${to==='e'?' (normal, hard and extreme)':' (the Sigil track, every 50 Sigils)'}.</p>`
      +(ids.length?ids.slice(0,40).map(id=>{ const it=ITEM[id]; return `<div class="fg-row"><span class="it-ico r${it.rar}">${itemIcon(it)}</span><div class="fg-main"><b style="color:${RAR_COL[it.rar]}">${it.name}</b><span>Level ${it.lv} &middot; ${itemStat(it)}</span></div><button class="chip forge" data-scroll="${id}" data-to="${to}" ${(sc[to]||0)?'':'disabled'}>Use</button></div>`; }).join(''):'<p class="muted">No piece in your bag can take this scroll.</p>');
  };
  return sect('e','Epic')+sect('u','Unique');
}
function pzScrollBind(root){ root.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>{ b.disabled=true; netSend({t:'scroll',id:b.dataset.scroll,to:b.dataset.to}); }); }
function pzTrackRender(box){
  const sig=GEAR.sig||0, lv=pzTrackLevel(sig), into=sig%PZ_SIG_LEVEL;
  let h=`<p class="muted gem-intro">Solve puzzles for the first time to collect Sigils. Every ${PZ_SIG_LEVEL} Sigils is a level of the track: ${PZ_LEVEL_GEMS} gems and the next cosmetic, and a Unique upgrade scroll every ${PZ_SCROLL_EVERY} levels.</p>
    <div class="pz-track-sum"><b>${sig}</b> Sigils &middot; level <b>${lv}</b> / ${PZ_TRACK_LEVELS}${lv<PZ_TRACK_LEVELS?` &middot; ${PZ_SIG_LEVEL-into} to the next`:' &middot; complete'}</div><div class="pz-lamps">`;
  for(let L=1;L<=PZ_TRACK_LEVELS;L++) h+=`<span class="pz-lamp${L<=lv?' lit':''}${L%PZ_SCROLL_EVERY===0?' big':''}" title="Level ${L}${PZ_TRACK_COS[L]?'':''}">${L%PZ_SCROLL_EVERY===0?L:''}</span>`;
  box.innerHTML=h+'</div>'+(PZ_ON?'':'<p class="muted">Puzzles open with the next big update.</p>');
}
