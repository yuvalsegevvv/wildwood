//@ The inventory's key resources at the top: Echo Shards, Tempering Stones, the three Reroll Stones and Sigils first (with how much each matters), then Bond Orbs and Bondstones; each with its own icon
/* Agent map. ikHtml() returns the markup of the "Key resources" block; renderMats (inventory.js) puts it above the monster drops in the Inventory panel. Reads the GEAR mirror: awm.echo, temper, rsw / rsa / rsr, sig / sigOff, bd.<set>.o / .st.
   Icons: ikIcon(kind,col) draws on the same 32x32 sheet as the other bag icons (ui/item-icons.js, OUT, icoShade). Styles: 18-skills.css (.ik-*). Test: client-smoke (renders the inventory). */
const IK_ROWS=[   // [id, name, colour, why it matters, importance label]
  ['echo','Echo Shards','#6fe3ff','Raise your charge skills in the Awakening tree. Mined at cave shard nodes and won in cave methods.','Top'],
  ['temper','Tempering Stones','#9ff0c8','Temper level-30 and level-40 gear at the forge, +1, +2, up to +10.','Top'],
  ['rsw','Weapon Reroll Stones','#ffb070','Roll and reroll the three lines of a level-40 weapon at the forge.','High'],
  ['rsa','Armour Reroll Stones','#8fc4ff','Roll and reroll the three lines of level-40 armour at the forge.','High'],
  ['rsr','Accessory Reroll Stones','#e9a0ff','Roll and reroll rings, pendants and talismans at the forge.','High'],
  ['sig','Sigils','#ffd24a','Earned by solving puzzle stones. Offer them at the broken statue in Glasswell for the Sigil track rewards.','High'],];
// em: the character's emblem (a 24 x 24 stroke glyph, shared/skillsets.js) drawn small in the middle of an orb or a plate
function ikIcon(kind,col,em){
  const d=icoShade(col,0.62), l=icoShade(col,1.35); let a;
  if(kind==='echo') a=`<path d="M16 2L25 11L21 29H11L7 11Z" fill="${col}" ${OUT}/><path d="M7 11H25M16 2L12 11L11 29M16 2L20 11L21 29" fill="none" stroke="${d}" stroke-width=".9"/><path d="M10 10L15 4" stroke="${l}" stroke-width="1.3"/>`;
  else if(kind==='temper') a=`<path d="M16 3L27 16L16 29L5 16Z" fill="${col}" ${OUT}/><path d="M5 16H27M16 3V29" fill="none" stroke="${d}" stroke-width=".9"/><path d="M9 14L15 6" stroke="${l}" stroke-width="1.3"/><path d="M12 21H20" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`;
  else if(kind==='sig') a=`<circle cx="16" cy="16" r="12.5" fill="${col}" ${OUT}/><circle cx="16" cy="16" r="8.5" fill="none" stroke="${d}" stroke-width="1.4"/><path d="M16 8L18.4 13.6L24 16L18.4 18.4L16 24L13.6 18.4L8 16L13.6 13.6Z" fill="${l}" stroke="${d}" stroke-width=".8"/>`;
  else if(kind==='orb') a=`<circle cx="16" cy="16" r="12" fill="${col}" ${OUT}/><circle cx="16" cy="16" r="8" fill="${d}" opacity=".45"/><path d="M9 11Q12 6.5 18 7.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>${em||''}`;
  else if(kind==='bst') a=`<rect x="5" y="4" width="22" height="24" rx="4" fill="${col}" ${OUT}/><rect x="8" y="7" width="16" height="18" rx="2.5" fill="${d}" opacity=".4"/><path d="M7 6.5H25" stroke="${l}" stroke-width="1.2" opacity=".8"/>${em||''}`;   // a flat engraved plate
  else a=`<rect x="4" y="4" width="24" height="24" rx="6" fill="${col}" ${OUT}/><rect x="4" y="4" width="24" height="12" rx="6" fill="${l}" opacity=".35"/><circle cx="11" cy="11" r="2.2" fill="${d}"/><circle cx="21" cy="11" r="2.2" fill="${d}"/><circle cx="16" cy="16" r="2.2" fill="${d}"/><circle cx="11" cy="21" r="2.2" fill="${d}"/><circle cx="21" cy="21" r="2.2" fill="${d}"/>`;   // a die: the Reroll Stones
  return `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#icoLit)">${a}</g></svg>`;
}
function ikEmblem(S){ const e=S&&S.emblem; if(!e) return ''; const c='#'+(e.col&0xffffff).toString(16).padStart(6,'0'); return `<g transform="translate(9.5 9.5) scale(.55)" fill="none" stroke="#fff6dc" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".95">${e.glyph}</g>`; }
function ikCount(id){
  const G=GEAR||{};
  if(id==='echo') return (G.awm&&G.awm.echo)|0;
  if(id==='temper') return G.temper|0;
  if(id==='sig') return Math.max(0,(G.sig|0)-(G.sigOff|0));
  return G[id]|0;
}
// Bond Orbs and Bondstones are per character: one tile for each character that has any (gear.bd.<set>.o / .st)
function ikBondRows(){
  const B=(GEAR&&GEAR.bd)||{}, out=[];
  for(const kind of [['o','orb','Bond Orb','Open one for 1-3 Bondstones of this character. Won in the hour\'s Stirrings.','Medium'],['st','bst','Bondstone','Raise this character\'s Bond (I to VI).','Medium']]){
    let any=0;
    for(const k of SS_ORDER){ const e=bdOwnKey(B,k)&&typeof B[k]==='object'?B[k]:null, n=e?(e[kind[0]]|0):0; if(n<=0) continue; any=1; const S=SS_SETS[k], c=S&&S.emblem?'#'+(S.emblem.col&0xffffff).toString(16).padStart(6,'0'):'#c9a6ff';
      out.push({id:kind[1]+':'+k,ic:kind[1],name:(S?S.name:k)+' '+kind[2]+(kind[0]==='st'?'s':'s'),short:(S?S.name:k),col:c,why:kind[3],rank:kind[4],n,em:ikEmblem(S)}); }
    if(!any) out.push({id:kind[1],ic:kind[1],name:kind[2]+'s',short:kind[2]+'s',col:kind[1]==='orb'?'#ff9ad0':'#c9a6ff',why:kind[3]+' None yet.',rank:kind[4],n:0,em:''});
  }
  return out;
}
function ikHtml(){
  const rows=IK_ROWS.map(([id,name,col,why,rank])=>({id,ic:id==='rsw'||id==='rsa'||id==='rsr'?'die':id,name,short:name.replace(' Reroll Stones',' Reroll').replace('Tempering Stones','Tempering'),col,why,rank,n:ikCount(id),em:''})).concat(ikBondRows());
  return `<div class="inv-h">Key resources <span>most important first</span></div><div class="mat-row">`+rows.map(r=>
    `<span class="matc${r.n?'':' ik-none'}" title="${(r.name+' ('+r.rank+'): '+r.why).replace(/"/g,'&quot;')}"><span class="tile r${r.rank==='Top'?3:r.rank==='High'?2:0} matt" aria-label="${r.name} x${r.n}">${ikIcon(r.ic,r.col,r.em)}<span class="ct">x${r.n}</span></span><span class="nm">${r.short}</span></span>`).join('')+`</div>`;
}
