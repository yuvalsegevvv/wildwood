//@ Item icons: an SVG for every piece of equipment, coloured like the item looks on your character
/* itemIcon(item) draws the item; slotIcon(slot) draws the faint outline shown in an empty equipment slot.
   Colours come from the same numbers the 3D models use (ARMOR_LOOK, and the weapon colours below). */
const colHex=n=>'#'+(n>>>0).toString(16).padStart(6,'0');
const ICON_COL={
  blade:['#a39a8f','#c0c6cc','#dfe7ee','#f5dc8a','#eef2f6','#cfe4ff'], guard:['#6a5030','#5a5d62','#8a7a4a','#d4a83a','#1a1414','#2a2a40'],
  bow:['#7a5236','#6a4428','#4a3e38','#e8e0c8','#8a2a26','#1e1c22'], bowTip:['#a07850','#8a8f94','#a8b4c0','#d4a83a','#e8c060','#9fd8ff'],
  wand:['#7a5236','#cfd8e6','#3a2a4a','#2a1e14','#f2c6d6','#2a1e14'], orb:['#c8f07a','#9fd8ff','#c59bff','#ffb040','#ff9ad5','#6ab8ff']
};
const OUT='stroke="#15120e" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"';
function icoShade(c,k){ const n=parseInt(c.slice(1),16), f=v=>Math.max(0,Math.min(255,Math.round(v*k))); return '#'+[f(n>>16),f(n>>8&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function itemIcon(it){
  const t=it.tier; let g='';
  if(it.slot==='sword'){
    const b=ICON_COL.blade[t], gd=ICON_COL.guard[t];
    g=`<g transform="translate(16 16) rotate(45) scale(1.14) translate(-16 -16)"><path d="M14.4 21V6.5L16 3l1.6 3.5V21z" fill="${b}" ${OUT}/><path d="M16 4.5V20.5" stroke="${icoShade(b,0.72)}" stroke-width="0.8"/>
       <rect x="${t>1?9.5:10.5}" y="20.5" width="${t>1?13:11}" height="2.6" rx="1.2" fill="${gd}" ${OUT}/><rect x="15" y="23" width="2" height="5" fill="#4a3424" ${OUT}/>
       <circle cx="16" cy="29.2" r="1.6" fill="${gd}" ${OUT}/>${t>=3?`<circle cx="16" cy="21.8" r="1" fill="${t===5?'#6ab8ff':'#e0384a'}"/>`:''}</g>`;
  } else if(it.slot==='bow'){
    const w=ICON_COL.bow[t], tp=ICON_COL.bowTip[t];
    g=`<path d="M11 4 Q27 16 11 28" fill="none" stroke="#15120e" stroke-width="4.2" stroke-linecap="round"/><path d="M11 4 Q27 16 11 28" fill="none" stroke="${w}" stroke-width="2.6" stroke-linecap="round"/>
       <path d="M11 4.5V27.5" stroke="#efe8d8" stroke-width="0.8"/><circle cx="11" cy="4" r="1.6" fill="${tp}" ${OUT}/><circle cx="11" cy="28" r="1.6" fill="${tp}" ${OUT}/>
       <path d="M8 16H25" stroke="#8a6a44" stroke-width="1.2"/><path d="M25 16l-3-1.8v3.6z" fill="#9aa0a6" ${OUT}/><path d="M8 16l-2-1.6M8 16l-2 1.6" stroke="#e8e4dc" stroke-width="1"/>
       ${t>=2?`<path d="M16.6 10.5l1.6 1.2M16.6 21.5l1.6-1.2" stroke="${tp}" stroke-width="1.4"/>`:''}`;
  } else if(it.slot==='wand'){
    const w=ICON_COL.wand[t], o=ICON_COL.orb[t];
    g=`<circle cx="22.5" cy="9.5" r="${6+t*0.6}" fill="${o}" opacity=".25"/><path d="M7 27L20.5 11.5" stroke="#15120e" stroke-width="3.6" stroke-linecap="round"/><path d="M7 27L20.5 11.5" stroke="${w}" stroke-width="2.2" stroke-linecap="round"/>
       ${t===1?`<path d="M22.5 5.5l3.2 4-3.2 4-3.2-4z" fill="${o}" ${OUT}/>`:`<circle cx="22.5" cy="9.5" r="3.2" fill="${o}" ${OUT}/>`}<circle cx="21.6" cy="8.6" r="0.9" fill="#fff" opacity=".8"/>
       ${t>=2?`<path d="M18 14l2 1.2M16.2 16.2l2 1.2" stroke="${icoShade(o,0.8)}" stroke-width="1"/>`:''}`;
  } else if(it.slot==='helmet'){
    const L=ARMOR_LOOK.helmet[t], c=colHex(L.hatColor);
    if(L.hat==='cap') g=`<path d="M7 20Q7 8 16 8Q25 8 25 20Z" fill="${c}" ${OUT}/><path d="M6 20H28Q28 23 24 23H6Z" fill="${icoShade(c,0.8)}" ${OUT}/><path d="M16 8V20" stroke="${icoShade(c,0.7)}" stroke-width="0.9"/>`;
    else g=`${L.plume?`<path d="M16 8Q18 2 24 3Q20 5 19 9Z" fill="${colHex(L.plume)}" ${OUT}/>`:''}<path d="M6.5 22Q6.5 8 16 8Q25.5 8 25.5 22H21V17H11V22Z" fill="${c}" ${OUT}/>
       <path d="M11 17H21" stroke="${icoShade(c,0.6)}" stroke-width="1.4"/><path d="M16 17V25" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><path d="M16 17V25" stroke="#15120e" stroke-width="0.6" opacity=".5"/>
       <path d="M9 12Q16 9 23 12" fill="none" stroke="${icoShade(c,1.25)}" stroke-width="1" opacity=".8"/>${t>=4?`<path d="M11 10Q9 4 12 3M21 10Q23 4 20 3" fill="none" stroke="#e8c060" stroke-width="1.4"/>`:''}${t>=3?'<circle cx="16" cy="11" r="1.2" fill="#e0384a" stroke="#15120e" stroke-width=".6"/>':''}`;
  } else if(it.slot==='top'){
    const L=ARMOR_LOOK.top[t], c=colHex(L.topColor);
    g=`<path d="M10 6L13.5 4.5Q16 7.5 18.5 4.5L22 6L27.5 11.5L24.5 15L22.5 13V27.5H9.5V13L7.5 15L4.5 11.5Z" fill="${c}" ${OUT}/>`;
    if(L.top==='jacket') g+=`<path d="M16 7.5V27.5" stroke="${icoShade(c,0.65)}" stroke-width="1"/><circle cx="17.6" cy="12" r=".8" fill="#2a1e14"/><circle cx="17.6" cy="17" r=".8" fill="#2a1e14"/><circle cx="17.6" cy="22" r=".8" fill="#2a1e14"/>`;
    else if(L.top==='mail') g+=`<g fill="none" stroke="${icoShade(c,0.62)}" stroke-width=".7">${[10,13,16,19,22,25].map(y=>`<path d="M10.5 ${y}q1.5 1.4 3 0t3 0 3 0 3 0"/>`).join('')}</g>`;
    else g+=`<path d="M10 12.5Q16 15.5 22 12.5M10 18Q16 21 22 18M10 23Q16 25.5 22 23" fill="none" stroke="${icoShade(c,0.62)}" stroke-width="1"/><path d="M13 5.5Q16 9 19 5.5" fill="none" stroke="${icoShade(c,1.3)}" stroke-width="1"/>${t>=3?'<circle cx="16" cy="11" r="1.4" fill="#e0384a" stroke="#15120e" stroke-width=".6"/>':''}`;
  } else if(it.slot==='bottom'){
    const L=ARMOR_LOOK.bottom[t], c=colHex(L.bottomColor);
    g=`<path d="M9 4.5H23L24.5 28H18L16 12.5L14 28H7.5Z" fill="${c}" ${OUT}/><path d="M9 4.5H23V7.5H9Z" fill="${icoShade(c,0.7)}" ${OUT}/>`;
    if(t===0) g+=`<rect x="14.8" y="4.8" width="2.4" height="2.4" fill="#c9a24a"/>`;
    else if(t===1) g+=`<g fill="none" stroke="${icoShade(c,0.62)}" stroke-width=".7">${[11,15,19,23].map(y=>`<path d="M9 ${y}q1.3 1.2 2.6 0t2.6 0M18.2 ${y}q1.3 1.2 2.6 0t2.6 0"/>`).join('')}</g>`;
    else g+=`<path d="M8.6 15H14.6M17.4 15H23.6M8.2 21H14.2M17.8 21H24" stroke="${icoShade(c,0.62)}" stroke-width="1.1"/><circle cx="11.5" cy="18" r="1.1" fill="${icoShade(c,1.3)}"/><circle cx="21" cy="18" r="1.1" fill="${icoShade(c,1.3)}"/>`;
  } else if(it.slot==='shoes'){
    const L=ARMOR_LOOK.shoes[t], c=colHex(L.shoeColor);
    g=`<path d="M8 4H18V18.5L25.5 20.5Q28.5 21.5 28.5 25V27.5H8Z" fill="${c}" ${OUT}/><path d="M8 25H28.5" stroke="${icoShade(c,0.55)}" stroke-width="1.6"/><path d="M8 8H18" stroke="${icoShade(c,0.7)}" stroke-width="1.2"/>`;
    if(t===0) g+=`<path d="M11 11H15M11 14H15" stroke="#e8dcc0" stroke-width=".8"/>`;
    else g+=`<path d="M18 18.5Q13 17 8 18.5" fill="none" stroke="${icoShade(c,1.3)}" stroke-width="1"/>${t>=3?'<circle cx="13" cy="12" r="1.2" fill="#e0384a" stroke="#15120e" stroke-width=".6"/>':''}`;
  }
  return `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true">${g}</svg>`;
}
// faint outline for an empty equipment slot
function slotIcon(slot){
  const fake=slot==='weapon'?ITEM.sword1:ITEM[slot+'1'];
  return itemIcon(fake).replace('class="ico"','class="ico ghost"');
}
