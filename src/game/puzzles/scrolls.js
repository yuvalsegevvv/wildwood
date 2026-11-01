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
// the cosmetic a track level gives (its name), '' when none
function pzTrackName(L){ const k=PZ_TRACK_COS[L], D=typeof k==='string'&&cpDef(k[0],k.slice(2)); let t=D?D.name+' ('+CP_SLOTS[k[0]][2].toLowerCase()+')':'a cosmetic'; const st=PZ_TRACK_SETS[L]; if(st) t+=' + a matching set: '+st.map(x=>cpDef(x[0],x.slice(2)).name).join(', '); return t; }
// the whole Sigil track as a list, from level 1 (shown in full at the start): every level's reward, what is paid, where you stand. offer: the button that offers what you carry (only at the statue)
function pzOfferHtml(offer){
  const off=GEAR.sigOff||0, carry=Math.max(0,(GEAR.sig||0)-off), lv=pzTrackLevel(off), into=off%PZ_SIG_LEVEL, tier=pzStatueTier(off), nextStep=PZ_STATUE_STEP-(off%PZ_STATUE_STEP);
  const stepNames=typeof SGS_NAMES!=='undefined'?SGS_NAMES:[];
  let h=`<div class="pz-off-sum"><div><b>${carry}</b> Sigils carried</div><div><b>${off}</b> offered</div><div>Level <b>${lv}</b> / ${PZ_TRACK_LEVELS}</div></div>`;
  h+=`<div class="pz-off-bar" title="${lv<PZ_TRACK_LEVELS?(PZ_SIG_LEVEL-into)+' Sigils to level '+(lv+1):'complete'}"><i style="width:${lv>=PZ_TRACK_LEVELS?100:Math.round(100*into/PZ_SIG_LEVEL)}%"></i></div>`;
  h+=`<p class="muted pz-off-note">${lv<PZ_TRACK_LEVELS?(PZ_SIG_LEVEL-into)+' more Sigils to level '+(lv+1)+'.':'The track is complete.'} The statue grows a step every ${PZ_STATUE_STEP} Sigils offered (step ${tier} of 8${tier<8?', next in '+nextStep:''}${stepNames[tier]&&tier<8?': '+stepNames[tier]:''}).</p>`;
  if(offer) h+=carry>0?`<div class="chips"><button class="chip buy" id="pzOfferGo">Offer ${carry} Sigils</button></div>`:`<p class="muted">You carry no Sigils. Solve puzzle stones for the first time to earn them (1 to 8 each).</p>`;
  h+='<div class="pz-off-list">';
  for(let L=1;L<=PZ_TRACK_LEVELS;L++){
    const k=PZ_TRACK_COS[L], D=typeof k==='string'&&cpDef(k[0],k.slice(2)), st=PZ_TRACK_SETS[L], big=L%PZ_SCROLL_EVERY===0, cls=L<=lv?'done':L===lv+1?'next':'';
    const rew=[`${PZ_LEVEL_GEMS} gems`]; if(big) rew.push('Unique upgrade scroll');
    h+=`<div class="pz-off-row ${cls}${big?' big':''}"><span class="pz-off-n">${L}</span><span class="pz-off-pics">${typeof cosPicHtml==='function'&&D?cosPicHtml(k[0],k.slice(2))+(st?st.map(x=>cosPicHtml(x[0],x.slice(2))).join(''):''):''}</span><span class="pz-off-main"><b>${D?D.name:'A cosmetic'}</b> <small>${D?CP_SLOTS[k[0]][2].toLowerCase():''}</small>${st?`<span class="pz-off-set">+ matching set: ${st.map(x=>cpDef(x[0],x.slice(2)).name).join(', ')}</span>`:''}</span><span class="pz-off-rew">${rew.join(' · ')}</span><span class="pz-off-mark">${L<=lv?'&#10003;':''}</span></div>`;
  }
  return h+'</div>';
}
function pzOfferOpen(){
  openPanel('puzzle'); $('#pzBar').hidden=true; $('#pzClock').textContent=''; $('#pzTitle').textContent='Offering to the statue';
  const host=$('#pzHost'); host.innerHTML=pzOfferHtml(true); cosPicFill(host); const go=$('#pzOfferGo'); if(go) go.addEventListener('click',()=>{ go.disabled=true; netSend({t:'pz',a:'offer'}); });
}
function pzOfferRefresh(){ const go=$('#pzOfferGo'), t=$('#pzTitle'); if(t&&t.textContent==='Offering to the statue'&&!$('#puzzle').hidden) pzOfferOpen(); }
function pzTrackRender(box){
  box.innerHTML='<p class="muted gem-intro">Solve puzzles for the first time to collect Sigils, then offer them at the broken statue in the middle of Glasswell (the Sunscar\'s city).</p>'+pzOfferHtml(false)+`<div class="pz-solver"><b>Puzzle solver</b>: skips the first solve of a puzzle stone (1 for trivial, easy and normal; 2 for hard; 3 for extreme). Not for renewed stones, dungeons or raids. You have <b>${GEAR.psv||0}</b>. <button class="chip" id="pzBuySolver">Buy one: ${PZ_SOLVER_PRICE} gems</button></div>`;
  cosPicFill(box);
  const bs=$('#pzBuySolver'); if(bs) bs.addEventListener('click',()=>netSend({t:'pz',a:'buy',n:1}));
}
