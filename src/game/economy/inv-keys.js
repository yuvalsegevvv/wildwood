//@ The inventory's key resources at the top: Echo Shards, Tempering Stones, the three Reroll Stones and Sigils first (with how much each matters), then Bond Orbs and Bondstones; each with its own icon
/* Agent map. ikHtml() returns the markup of the "Key resources" block; renderInv (inventory.js) puts it above the stats. Reads the GEAR mirror: awm.echo, temper, rsw / rsa / rsr, sig / sigOff, bd.<set>.o / .st.
   Icons: ikIcon(kind,col) draws on the same 32x32 sheet as the other bag icons (ui/item-icons.js, OUT, icoShade). Styles: 18-skills.css (.ik-*). Test: client-smoke (renders the inventory). */
const IK_ROWS=[   // [id, name, colour, why it matters, importance label]
  ['echo','Echo Shards','#6fe3ff','Raise your charge skills in the Awakening tree. Mined at cave shard nodes and won in cave methods.','Top'],
  ['temper','Tempering Stones','#9ff0c8','Temper level-30 and level-40 gear at the forge, +1, +2, up to +10.','Top'],
  ['rsw','Weapon Reroll Stones','#ffb070','Roll and reroll the three lines of a level-40 weapon at the forge.','High'],
  ['rsa','Armour Reroll Stones','#8fc4ff','Roll and reroll the three lines of level-40 armour at the forge.','High'],
  ['rsr','Accessory Reroll Stones','#e9a0ff','Roll and reroll rings, pendants and talismans at the forge.','High'],
  ['sig','Sigils','#ffd24a','Earned by solving puzzle stones. Offer them at the broken statue in Glasswell for the Sigil track rewards.','High'],
  ['orb','Bond Orbs','#ff9ad0','Open one for 1-3 Bondstones of that character. Won in the hour\'s Stirrings.','Medium'],
  ['bst','Bondstones','#c9a6ff','Raise a character\'s Bond (I to VI).','Medium']];
function ikIcon(kind,col){
  const d=icoShade(col,0.62), l=icoShade(col,1.35); let a;
  if(kind==='echo') a=`<path d="M16 2L25 11L21 29H11L7 11Z" fill="${col}" ${OUT}/><path d="M7 11H25M16 2L12 11L11 29M16 2L20 11L21 29" fill="none" stroke="${d}" stroke-width=".9"/><path d="M10 10L15 4" stroke="${l}" stroke-width="1.3"/>`;
  else if(kind==='temper') a=`<path d="M16 3L27 16L16 29L5 16Z" fill="${col}" ${OUT}/><path d="M5 16H27M16 3V29" fill="none" stroke="${d}" stroke-width=".9"/><path d="M9 14L15 6" stroke="${l}" stroke-width="1.3"/><path d="M12 21H20" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`;
  else if(kind==='sig') a=`<circle cx="16" cy="16" r="12.5" fill="${col}" ${OUT}/><circle cx="16" cy="16" r="8.5" fill="none" stroke="${d}" stroke-width="1.4"/><path d="M16 8L18.4 13.6L24 16L18.4 18.4L16 24L13.6 18.4L8 16L13.6 13.6Z" fill="${l}" stroke="${d}" stroke-width=".8"/>`;
  else if(kind==='orb') a=`<circle cx="16" cy="16" r="12" fill="${col}" ${OUT}/><circle cx="16" cy="16" r="7" fill="${l}" opacity=".55"/><path d="M10 11Q13 7 18 8" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
  else if(kind==='bst') a=`<path d="M16 2L27 9V23L16 30L5 23V9Z" fill="${col}" ${OUT}/><path d="M5 9L16 16L27 9M16 16V30" fill="none" stroke="${d}" stroke-width=".9"/><path d="M16 2L10 9.5L16 16L22 9.5Z" fill="${l}" opacity=".6"/>`;
  else a=`<rect x="4" y="4" width="24" height="24" rx="6" fill="${col}" ${OUT}/><rect x="4" y="4" width="24" height="12" rx="6" fill="${l}" opacity=".35"/><circle cx="11" cy="11" r="2.2" fill="${d}"/><circle cx="21" cy="11" r="2.2" fill="${d}"/><circle cx="16" cy="16" r="2.2" fill="${d}"/><circle cx="11" cy="21" r="2.2" fill="${d}"/><circle cx="21" cy="21" r="2.2" fill="${d}"/>`;   // a die: the Reroll Stones
  return `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#icoLit)">${a}</g></svg>`;
}
function ikCount(id){
  const G=GEAR||{};
  if(id==='echo') return (G.awm&&G.awm.echo)|0;
  if(id==='temper') return G.temper|0;
  if(id==='sig') return Math.max(0,(G.sig|0)-(G.sigOff|0));
  if(id==='orb'||id==='bst'){ let n=0; const B=G.bd||{}; for(const k of SS_ORDER){ const e=bdOwnKey(B,k)&&typeof B[k]==='object'?B[k]:null; if(e) n+=(id==='orb'?e.o:e.st)|0; } return n; }
  return G[id]|0;
}
function ikHtml(){
  return `<div class="inv-h">Key resources <span>most important first</span></div><div class="ik-list">`+IK_ROWS.map(([id,name,col,why,rank])=>{
    const n=ikCount(id), ic=id==='rsw'||id==='rsa'||id==='rsr'?'die':id;
    return `<div class="ik-row${n?'':' none'}" title="${why.replace(/"/g,'&quot;')}"><span class="tile r0 matt" aria-label="${name} x${n}">${ikIcon(ic,col)}<span class="ct">x${n}</span></span><span class="ik-t"><b>${name}</b><small>${why}</small></span><em class="ik-${rank.toLowerCase()}">${rank}</em></div>`; }).join('')+`</div>`;
}
