//@ Zone tiers, client side: a monster's level and health as you fight it, the symbol beside your health, the tier picker on the map panel
/* The numbers are the server's (server/tiers.js, rules in shared/tiers.js). Here: the level a monster or zone shows at your tier for its land, and a
   monster's health in your own units (the snapshot sends it in the def's own units, the same for everyone: your tier's health multiplier turns it
   into what a hit of yours is measured against). The symbol (three badges and the bonus) sits under your XP bar; the picker is a row under the
   map, for the land the map shows, and works in a village only (the server checks it as well). */
const monTierK=m=>zoneTierK(m.T,monTierOf(GEAR,m));
// a zone's level text at your tier for its land ('12', or '16-17' for a zone with two levels)
const zoneLvText=zn=>{ const t=zoneTierOn(GEAR,landOfZone(zn)); return t?String(zn.lvText||zn.level).replace(/\d+/g,n=>+n+ZTIER_STEP*t):(zn.lvText||zn.level); };
const zoneLvNum=zn=>zn.level+ZTIER_STEP*zoneTierOn(GEAR,landOfZone(zn));
const bossLvIn=(def,land)=>zoneTierLv(def,zoneTierOn(GEAR,land));
const ZT_SHORT=land=>BOSS_DEFS.find(b=>b.def.id===ZTIER_BOSS[land]).short;
let ztSymKey='', ztRowKey='', ztRowH=0;
function renderSymbol(){
  const el=$('#plSym'), pts=symbolPoints(GEAR), key=JSON.stringify(GEAR&&GEAR.zt);
  if(key===ztSymKey) return; ztSymKey=key;
  el.hidden=!pts; if(!pts) return;
  el.innerHTML=ZTIER_LANDS.map(l=>`<i class="zs ${l}${zoneTierMax(GEAR,l)?'':' off'}">${ZTIER_ROMAN[zoneTierMax(GEAR,l)]}</i>`).join('')+`<span>+${Math.round(symbolBonus(GEAR)*100)}%</span>`;
  el.title='Zone tier symbol: +'+Math.round(symbolBonus(GEAR)*100)+'% attack and health ('+ZTIER_LANDS.map(l=>ZTIER_NAMES[l]+' '+ZTIER_ROMAN[zoneTierMax(GEAR,l)]).join(', ')+')';
}
// the row's height (it wraps on a phone) takes room from the map: when it changes the map is fitted again
function fitTierRow(row){ const h=row.offsetHeight||0; if(h!==ztRowH){ ztRowH=h; sizeFullMap(); } }
// the picker under the map, for the land the map shows
function renderTierRow(land){
  if(!ZTIER_LANDS.includes(land)){ $('#mapTier').innerHTML=''; ztRowKey=''; fitTierRow($('#mapTier')); return; }   // (the Greyspine has no zone tier yet)
  const row=$('#mapTier'), max=zoneTierMax(GEAR,land), on=zoneTierOn(GEAR,land), inV=zoneTierVillage(P.x,P.z);
  const key=land+'|'+on+'|'+max+'|'+inV; if(key===ztRowKey) return; ztRowKey=key; row.dataset.land=land;
  if(!max){ row.innerHTML=`<span class="mt-i">Zone tiers: defeat ${ZT_SHORT(land)} to unlock a harder ${ZTIER_NAMES[land]}</span>`; fitTierRow(row); return; }
  const next=on===max&&max<ZTIER_MAX?` &middot; defeat ${ZT_SHORT(land)} at this tier to unlock ${ZTIER_ROMAN[max+1]}`:'';
  row.innerHTML=`<span class="mt-l">Zone tier</span><button class="chip" data-zt="${on-1}" aria-label="Lower the tier"${on>0&&inV?'':' disabled'}>&minus;</button><b class="mt-v">${ZTIER_ROMAN[on]}</b><button class="chip" data-zt="${on+1}" aria-label="Raise the tier"${on<max&&inV?'':' disabled'}>+</button>`+
    `<span class="mt-i">${on?'Enemies '+ZTIER_STEP*on+' levels higher':'Enemies at their usual levels'} &middot; unlocked up to ${ZTIER_ROMAN[max]}${inV?'':' &middot; change it in a village'}${next}</span>`;
  fitTierRow(row);
}
$('#mapTier').addEventListener('click',e=>{ const b=e.target.closest('[data-zt]'); if(!b||b.disabled) return; netSend({t:'zt',land:$('#mapTier').dataset.land,n:+b.dataset.zt}); UI_SFX.click(); });
function tiersRefresh(){ ztSymKey=''; ztRowKey=''; renderSymbol(); if(!$('#map').hidden) renderTierRow(mapLand||landHere()); }
