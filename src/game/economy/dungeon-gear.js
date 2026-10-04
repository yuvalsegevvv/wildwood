//@ Level-30 dungeon gear in the UI: the ring's notes in the item details, the Tempering Stone count and drop note, the forge's Temper tab, the testing buttons, the events `stone` and `temper`
/* Agent map (server: server/dungeon-gear.js; rules and items: shared/dungeon-rewards.js, shared/dungeon-items.js)
   owns:    dgInfoHtml (extra lines of the item details: enhancement and next step; a ring's share of your weapon's attack and whether it matches your soul),
            dgRingDiffHtml (what swapping a ring changes, for statDiff), dgStoneChipHtml (the stone count among the materials), dgStatChange, the Temper tab
            (dgTemperHtml / dgTemperBind: a row for every level-30 piece you own, a button sends temper{id[,worn]}), EVH.stone / EVH.temper, the three testing buttons.
   uses:    forge.js (the tab), inventory.js (details, tiles), soul.js (soulNow), the GEAR mirror (gear.temper, gear.eq.ring), popText / UI_SFX.
   hooks:   lines marked `// dungeons:` in inventory.js, forge.js, shops.js, index.html; the table is in docs/DUNGEON-THEMES.md section 7.
   test:    tools/rewards-client-smoke.js */
const dgStones=()=>(GEAR&&GEAR.temper)||0;
const dgPlural=(n,w)=>n+' '+w+(n===1?'':'s');
// what a step changes in a piece's stats, as html ("+142 attack (+7)")
function dgStatChange(it,next){
  const up=(a,b,u)=>`<span class="up">(+${Math.round((b-a)*10)/10}${u||''})</span>`;
  if(it.kind==='weapon') return `+${next.atk} attack ${up(it.atk,next.atk)}`;
  if(it.kind==='armor') return `+${next.hp} health, +${next.def} defense ${up(it.hp,next.hp)}`;
  if(it.kind==='pendant') return `${pendantText(next)} <span class="up">(+${it.stat==='critdmg'?Math.round((next.v-it.v)*100)/100:dgPct(next.v-it.v)+'%'})</span>`;
  const w=ITEM[GEAR.eq.weapon], a=dgRingShare(it,soulNow(),w).atk, b=dgRingShare(next,soulNow(),w).atk;
  return `+${dgPct(next.pct)}% of your weapon's attack ${up(dgPct(it.pct),dgPct(next.pct),'%')}${b>a?` <span class="muted">(+${b} attack with your soul, now +${a})</span>`:''}`;
}
// the extra lines in the item details panel (inventory.js renderInvInfo): '' for anything but a level-30 dungeon piece
function dgInfoHtml(it){
  if(!it.dg) return '';
  const E=dgEnhInfo(it.id), have=dgStones(); let h='';
  if(it.kind==='ring'){
    const sh=dgRingShare(it,soulNow(),ITEM[GEAR.eq.weapon]), sn=ELEMS[sh.soul].name;
    h+=sh.match?`<span class="up">Matches your soul (${sn}): +${sh.atk} attack</span>`:`<span class="down">Your soul is ${sn}: no effect</span> <span class="muted">(it needs a ${dgSoulName(it.el)} soul)</span>`;
  }
  h+=`<span>Tempered +${E.n} of ${E.max}`+(E.next?` &middot; next: ${dgStatChange(it,E.next)} for ${dgPlural(E.stones,ENH_NAME)} <span class="${have>=E.stones?'up':'down'}">(you have ${have})</span>`:' &middot; fully tempered')+'</span>';
  return h;
}
// what swapping to a ring changes in your attack (statDiff in inventory.js): its share of your weapon now, against the worn ring's
function dgRingDiffHtml(it,cur){
  const w=ITEM[GEAR.eq.weapon], soul=soulNow(), d=dgRingShare(it,soul,w).atk-(cur&&cur.kind==='ring'?dgRingShare(cur,soul,w).atk:0);
  return d?`<span class="${d>0?'up':'down'}">${d>0?'+':''}${d} attack</span>`:'';
}
// the stone count, a chip beside the monster drops in the inventory (nothing until you hold one)
function dgStoneChipHtml(){ const n=dgStones(); return n>0?`<span class="mat" title="Dropped by normal monsters of level ${ENH_LV} and above, instead of equipment. Used at the forge to temper level-30 gear."><i style="background:#9ff0c8"></i>${ENH_NAME} <b>${n}</b></span>`:''; }
/* ---- the forge's Temper tab ---- */
function dgTemperRows(){
  const counts={}; GEAR.inv.forEach(id=>{ if(ITEM[id]&&ITEM[id].dg) counts[id]=(counts[id]||0)+1; });
  const worn=new Set(Object.values(GEAR.eq)), spare=bagCounts(), rows=[];
  for(const id in counts){ if(worn.has(id)) rows.push({id,worn:true,n:1}); if(spare[id]) rows.push({id,worn:false,n:spare[id]}); }
  return rows.sort((a,b)=>b.worn-a.worn||ITEM[b.id].rar-ITEM[a.id].rar||ITEM[b.id].n-ITEM[a.id].n||a.id.localeCompare(b.id));
}
function dgTemperHtml(){
  const have=dgStones(), rows=dgTemperRows();
  let h=`<p class="fg-intro">Bring me level-30 gear from the dungeons and ${ENH_NAME}s (normal monsters of level ${ENH_LV} and above drop them instead of equipment). Each step adds ${Math.round(ENH_STEP*100)}% of the piece's own stats and always works; the step to +n costs n stones. Common gear reaches +${ENH_MAX[0]}, rare +${ENH_MAX[1]}, epic +${ENH_MAX[2]}, unique +${ENH_MAX[3]}, legendary +${ENH_MAX[4]}.</p>
    <div class="fg-stones"><i></i>${ENH_NAME}s <b id="fgStones">${have}</b></div>`;
  if(!rows.length) h+='<p class="muted">You have no level-30 gear yet. A dungeon clear pays one piece.</p>';
  for(const r of rows){
    const E=dgEnhInfo(r.id), it=E.it, can=!!E.next&&have>=E.stones;
    const btn=!E.next?'<button class="chip forge" disabled>Fully tempered</button>':`<button class="chip forge" data-temper="${it.id}" data-worn="${r.worn?1:0}" ${can?'':'disabled'}>${can?'Temper: '+dgPlural(E.stones,'stone'):'Need '+dgPlural(E.stones,'stone')}</button>`;
    h+=`<div class="fg-row${can?' ready':''}"><span class="it-ico big r${it.rar}">${itemIcon(it)}</span>${E.next?ARROW+`<span class="it-ico big r${E.next.rar}">${itemIcon(E.next)}</span>`:''}
      <div class="fg-main"><b style="color:${RAR_COL[it.rar]}">${it.name}${E.next?' <span class="fg-step">&rarr; +'+E.next.n+'</span>':''}</b><span>${E.next?dgStatChange(it,E.next):itemStat(it)}</span>
      <span class="muted">+${E.n} of ${E.max}${r.worn?' &middot; worn':r.n>1?' &middot; you have '+r.n:' &middot; in your bag'}</span></div>${btn}</div>`;
  }
  return h;
}
function dgTemperBind(root){
  root.querySelectorAll('[data-temper]').forEach(b=>b.onclick=()=>{ b.disabled=true; b.textContent='Tempering…'; netSend({t:'temper',id:b.dataset.temper,worn:b.dataset.worn==='1'}); });
}
/* ---- server events ---- */
EVH.stone=e=>{   // [pid,n,monId]: a Tempering Stone dropped for you
  if(e[1]!==NET.pid) return;
  const m=MON_BY_ID.get(e[3]), c=m?monCenter(m):{x:P.x,y:P.y+1,z:P.z};
  popText(c.x-0.4,c.y+(m?m.T.height*0.2*m.s:0),c.z,'+'+e[2]+' '+ENH_NAME,'drop'); UI_SFX.pickup();
};
EVH.temper=e=>{   // [pid,newId,oldId]: a piece was tempered (the new gear arrives with the `you` update, which redraws the panels)
  if(e[1]!==NET.pid) return;
  UI_SFX.success(); spawnRingAt(P.x,P.y,P.z,2.4,0x9ff0c8);
};
// testing buttons (markup in index.html #tSec; sent as rwdev messages, which the server only honours in dev mode)
$('#tStones').addEventListener('click',()=>netSend({t:'rwdev',cmd:'stones'}));
$('#tDgAll').addEventListener('click',()=>netSend({t:'rwdev',cmd:'dgall'}));
$('#tDgThree').addEventListener('click',()=>netSend({t:'rwdev',cmd:'dgthree'}));
