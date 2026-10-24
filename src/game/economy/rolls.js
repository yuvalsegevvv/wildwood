//@ Rolled level-40 gear in the UI (version 3): the three lines in the item details, the forge's Roll and Sacrifice tabs, the reroll stone chips, the cooldown reduction of rolled gear, the events `sac` and `reroll`, the testing buttons
/* Agent map (server: server/rolls.js; the stats and ranges: shared/rolls.js; design docs/ROLLS.md)
   owns:    (a Ring Reroll Stone, gear.rsr, is the third kind: rings roll and sacrifice like gear) rlUiLinesHtml (the lines of a piece, coloured by quality), rlUiInfoHtml (the item details part, called by dgInfoHtml), rlUiCdr (the rolled gear's cooldown reduction, the 5th argument of abilityCd),
            rlUiStoneChipHtml, the Roll tab (rlUiRollHtml) and the Sacrifice tab (rlUiSacHtml), rlUiBind, EVH.sac / EVH.reroll, the three testing buttons.
   uses:    forge.js (the tabs), dungeon-gear.js (dgInfoHtml calls rlUiInfoHtml), inventory.js (tiles), the GEAR mirror (gear.rsw / gear.rsa / gear.rsr), the ITEM Proxy.
   hooks:   lines marked `// rolls:` in inventory.js, forge.js, attacks.js, combat-hud.js, skills.js, client.js, item-icons.js, index.html.
   test:    tools/rolls-client-smoke.js */
const rlUiStones=kind=>(GEAR&&GEAR[kind])||0;
// the cooldown reduction of the worn rolled pieces (a fraction, at most 40%); nothing on the Proving Isle
function rlUiSum(stat){
  if(typeof PVC!=='undefined'&&PVC&&PVC.on) return 0;   // pvp: no gear bonus on the island
  if(!GEAR||!GEAR.eq) return 0;
  const items=[]; for(const s in GEAR.eq){ const it=GEAR.eq[s]?ITEM[GEAR.eq[s]]:null; if(it&&it.roll) items.push(it); }
  return items.length?rlSumOf(items,stat,PL.level):0;
}
function rlUiCdr(){ return rlUiSum('cdr'); }   // (the 5th argument of abilityCd)
// quality 0..99 -> a colour from grey-green to gold
const rlUiCol=q=>q>=85?'#ffd24a':q>=60?'#9ff0c8':q>=30?'#cfd8c8':'#9aa39a';
function rlUiLinesHtml(it){
  return it.roll.map(l=>`<span class="rl-line" style="color:${rlUiCol(l.q)}">${rlText(l)} <small class="muted">(${l.q}/99)</small></span>`).join('');
}
// the extra lines in the item details panel (dgInfoHtml calls it): '' for anything but a level-40 piece
function rlUiInfoHtml(it){
  if(!it||!it.roll0) return '';
  if(!it.roll) return `<span class="rl-un">Unrolled: use a Reroll Stone at the forge</span>`;
  return `<span class="rl-lines">${rlUiLinesHtml(it)}</span>`;
}
const RL_STONE_WORD={rsw:'weapons',rsa:'armour',rsr:'rings'}, RL_STONE_COL={rsw:'#ffb070',rsa:'#8fc4ff',rsr:'#e9a0ff'};
function rlUiStoneChipHtml(){
  return RL_STONE_ORDER.map(k=>{ const w=RL_STONE_WORD[k]; const n=rlUiStones(k); return n>0?`<span class="mat" title="Made by sacrificing level-30 and level-40 ${w} at the forge. Rolls and rerolls the lines of level-40 ${w}."><i style="background:${RL_STONE_COL[k]}"></i>${RL_STONE_NAME[k]} <b>${n}</b></span>`:''; }).join('');
}
function rlUiStoneBarHtml(){
  return `<div class="fg-stones rl-stones"><i class="rsw"></i>Weapon stones <b id="rlStW">${rlUiStones('rsw')}</b><i class="rsa"></i>Armor stones <b id="rlStA">${rlUiStones('rsa')}</b><i class="rsr"></i>Ring stones <b id="rlStR">${rlUiStones('rsr')}</b></div>`;
}
// every piece you own, worn first (the same rows as the Temper tab): pred picks which
function rlUiRows(pred){
  const worn=new Set(Object.values(GEAR.eq)), spare=bagCounts(), rows=[];
  for(const id in spare){ const it=ITEM[id]; if(it&&pred(it)) rows.push({id,worn:false,n:spare[id]}); }
  for(const s in GEAR.eq){ const id=GEAR.eq[s], it=id?ITEM[id]:null; if(it&&pred(it)&&worn.has(id)) rows.push({id,worn:true,n:1}); }
  return rows.sort((a,b)=>b.worn-a.worn||ITEM[b.id].rar-ITEM[a.id].rar||ITEM[b.id].name.localeCompare(ITEM[a.id].name)||a.id.localeCompare(b.id));
}
const rlUiKindOk=it=>(it.kind==='weapon'||it.kind==='armor'||it.kind==='ring')&&it.dg;   // a ring has its own stone (gear.rsr)
function rlUiRollHtml(){
  const rows=rlUiRows(it=>rlUiKindOk(it)&&it.roll0);
  let h=`<p class="fg-intro">Level-40 gear and rings carry three rolled lines out of 13 stats. A roll costs ${RL_COST} Reroll Stone of the piece's kind (weapon, armour or ring) and replaces all three lines. Weapons roll higher offence, armour higher defence. Make stones in the other tab.</p>`+rlUiStoneBarHtml();
  if(!rows.length) h+='<p class="muted">You have no level-40 weapon, armour or ring yet.</p>';
  for(const r of rows){
    const it=ITEM[r.id], kind=RL_STONE_KIND[it.kind], have=rlUiStones(kind), can=have>=RL_COST;
    h+=`<div class="fg-row${can?' ready':''}"><span class="it-ico big r${it.rar}">${itemIcon(it)}</span>
      <div class="fg-main"><b style="color:${RAR_COL[it.rar]}">${it.name}</b>${it.roll?`<span class="rl-lines">${rlUiLinesHtml(it)}</span>`:'<span class="rl-un">Unrolled</span>'}
      <span class="muted">${r.worn?'worn':r.n>1?'you have '+r.n:'in your bag'} &middot; ${RL_STONE_NAME[kind]}: ${have}</span></div>
      <button class="chip forge" data-reroll="${it.id}" data-worn="${r.worn?1:0}" ${can?'':'disabled'}>${can?(it.roll?'Reroll':'Roll')+': '+RL_COST+' stone':'Need '+RL_COST+' stone'}</button></div>`;
  }
  return h;
}
function rlUiSacHtml(){
  const rows=rlUiRows(it=>rlUiKindOk(it)&&it.lv>=30).filter(r=>!r.worn);
  let h=`<p class="fg-intro">Break a level-30 or level-40 weapon, armour piece or ring from your bag into Reroll Stones of its kind: ${RL_SAC.join(' / ')} by rarity (common to legendary). Worn pieces stay safe; take them off first.</p>`+rlUiStoneBarHtml();
  if(!rows.length) h+='<p class="muted">No spare level-30 or level-40 weapon, armour or ring in your bag.</p>';
  for(const r of rows){
    const it=ITEM[r.id], kind=RL_STONE_KIND[it.kind], n=RL_SAC[it.rar];
    h+=`<div class="fg-row"><span class="it-ico big r${it.rar}">${itemIcon(it)}</span>
      <div class="fg-main"><b style="color:${RAR_COL[it.rar]}">${it.name}</b><span>${itemStat(it)}</span>${it.roll?`<span class="rl-lines">${rlUiLinesHtml(it)}</span>`:''}
      <span class="muted">${r.n>1?'you have '+r.n:'in your bag'} &middot; gives ${n} ${RL_STONE_NAME[kind]}${n===1?'':'s'}</span></div>
      <button class="chip forge" data-sac="${it.id}">Sacrifice: +${n}</button></div>`;
  }
  return h;
}
function rlUiBind(root){
  root.querySelectorAll('[data-reroll]').forEach(b=>b.onclick=()=>{ b.disabled=true; b.textContent='Rolling…'; netSend({t:'reroll',id:b.dataset.reroll,worn:b.dataset.worn==='1'}); });
  root.querySelectorAll('[data-sac]').forEach(b=>b.onclick=()=>{ b.disabled=true; b.textContent='Sacrificing…'; netSend({t:'sac',id:b.dataset.sac}); });
}
/* ---- server events ---- */
EVH.sac=e=>{ if(e[1]!==NET.pid) return; UI_SFX.success(); };   // [pid,id,kind,n]: the stones arrive with the `you` update
EVH.reroll=e=>{ if(e[1]!==NET.pid) return; UI_SFX.success(); spawnRingAt(P.x,P.y,P.z,2.4,0xffd24a); };   // [pid,newId,oldId]
// testing buttons (markup in index.html #tSec; rldev messages, honoured only in dev mode)
$('#tRlStones').addEventListener('click',()=>netSend({t:'rldev',cmd:'stones'}));
$('#tRl40').addEventListener('click',()=>netSend({t:'rldev',cmd:'all40'}));
$('#tRlRolled').addEventListener('click',()=>netSend({t:'rldev',cmd:'rolled'}));
