//@ Item icons: an SVG for every piece of equipment, every tool and every pendant, coloured like the item looks on your character
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
  const t=dgVisTier(it); let g='';   // dungeons: a level-30 piece borrows the top tier's art (and gets the sparkle below)
  if(it.slot==='sword'){
    const b=ICON_COL.blade[t], gd=ICON_COL.guard[t];
    const BL=['M14.4 21V6.5L16 3l1.6 3.5V21z','M14 21V8L16 3l2 5V21z','M16 3Q20.4 9 18.8 21H13.2Q11.6 9 16 3z','M16 2.5L18.9 7.2L18.3 21H13.7L13.1 7.2z','M16 1.8L17.7 5.4L16.7 8L18.5 11.4L17.3 14.6L18.3 21H13.7L14.7 14.6L13.5 11.4L15.3 8L14.3 5.4z','M16 1L18.6 5.6L18.2 21H13.8L13.4 5.6z'][t];   // the blade grows with the tier: plain, broad, leaf, wide, flaming, long and runed
    g=`<g transform="translate(16 16) rotate(45) scale(1.14) translate(-16 -16)">${t===5?`<path d="${BL}" fill="#6ab8ff" opacity=".4" transform="translate(16 12) scale(1.5 1.08) translate(-16 -12)"/>`:''}<path d="${BL}" fill="${b}" ${OUT}/><path d="M16 4.5V20.5" stroke="${icoShade(b,0.72)}" stroke-width="0.8"/>${t===5?'<path d="M16 7v1.6M16 11v1.6M16 15v1.6" stroke="#2a6ab8" stroke-width="1"/>':''}${t===2?`<path d="M14.2 20Q13.4 10 16 5" fill="none" stroke="${icoShade(b,1.25)}" stroke-width=".7"/>`:''}
       <rect x="${t>1?9.5:10.5}" y="20.5" width="${t>1?13:11}" height="2.6" rx="1.2" fill="${gd}" ${OUT}/><rect x="15" y="23" width="2" height="5" fill="#4a3424" ${OUT}/>
       <circle cx="16" cy="29.2" r="1.6" fill="${gd}" ${OUT}/>${t>=3?`<circle cx="16" cy="21.8" r="1" fill="${t===5?'#6ab8ff':'#e0384a'}"/>`:''}</g>`;
  } else if(it.slot==='bow'){
    const w=ICON_COL.bow[t], tp=ICON_COL.bowTip[t], BW=['M11 4 Q27 16 11 28','M11 4 Q28 16 11 28','M8.5 3.5 Q11 5 12 8 Q26 16 12 24 Q11 27 8.5 28.5','M9 3 Q12.5 5 12 9 Q27 16 12 23 Q12.5 27 9 29','M7.5 5 Q13 3.5 12.5 9 Q28 16 12.5 23 Q13 28.5 7.5 27','M6.5 6 Q14 2.5 13 9.5 Q29 16 13 22.5 Q14 29.5 6.5 26'][t];   // the limbs get longer and curl at the tips with the tier
    g=`<path d="${BW}" fill="none" stroke="#15120e" stroke-width="4.2" stroke-linecap="round"/><path d="${BW}" fill="none" stroke="${w}" stroke-width="2.6" stroke-linecap="round"/>
       <path d="M11 4.5V27.5" stroke="#efe8d8" stroke-width="0.8"/><circle cx="11" cy="4" r="1.6" fill="${tp}" ${OUT}/><circle cx="11" cy="28" r="1.6" fill="${tp}" ${OUT}/>
       <path d="M8 16H25" stroke="#8a6a44" stroke-width="1.2"/><path d="M25 16l-3-1.8v3.6z" fill="#9aa0a6" ${OUT}/><path d="M8 16l-2-1.6M8 16l-2 1.6" stroke="#e8e4dc" stroke-width="1"/>
       ${t>=2?`<path d="M16.6 10.5l1.6 1.2M16.6 21.5l1.6-1.2" stroke="${tp}" stroke-width="1.4"/>`:''}`;
  } else if(it.slot==='wand'){
    const w=ICON_COL.wand[t], o=ICON_COL.orb[t];
    g=`<circle cx="22.5" cy="9.5" r="${6+t*0.6}" fill="${o}" opacity=".25"/><path d="M7 27L20.5 11.5" stroke="#15120e" stroke-width="3.6" stroke-linecap="round"/><path d="M7 27L20.5 11.5" stroke="${w}" stroke-width="2.2" stroke-linecap="round"/>
       ${[`<circle cx="22.5" cy="9.5" r="3.2" fill="${o}" ${OUT}/>`,`<path d="M22.5 5.5l3.2 4-3.2 4-3.2-4z" fill="${o}" ${OUT}/>`,`<path d="M18.6 6.4Q22.5 14.4 26.4 6.4" fill="none" stroke="#15120e" stroke-width="3" stroke-linecap="round"/><path d="M18.6 6.4Q22.5 14.4 26.4 6.4" fill="none" stroke="${w}" stroke-width="1.4" stroke-linecap="round"/><circle cx="22.5" cy="8.2" r="2.9" fill="${o}" ${OUT}/>`,`<path d="M22.5 3Q27.6 8.6 25.4 12.2Q22.5 14.6 19.6 12.2Q17.4 8.6 22.5 3z" fill="${o}" ${OUT}/><path d="M22.5 7Q24.2 10 22.5 12.2Q20.8 10 22.5 7z" fill="#fff6c0"/>`,`<ellipse cx="22.5" cy="9.5" rx="6" ry="2" fill="none" stroke="#15120e" stroke-width="2.6" transform="rotate(-30 22.5 9.5)"/><ellipse cx="22.5" cy="9.5" rx="6" ry="2" fill="none" stroke="${icoShade(o,1.2)}" stroke-width="1.2" transform="rotate(-30 22.5 9.5)"/><circle cx="22.5" cy="9.5" r="3.2" fill="${o}" ${OUT}/>`,`<path d="M22.5 2.5l2.4 5.2-2.4 4.8-2.4-4.8z" fill="${o}" ${OUT}/><path d="M26.6 6l2.2 3.6-2.4 3-2-3.4z" fill="${icoShade(o,0.85)}" ${OUT}/><path d="M18.4 6l-2.2 3.6 2.4 3 2-3.4z" fill="${icoShade(o,0.85)}" ${OUT}/>`][t]}<circle cx="21.6" cy="8.6" r="0.9" fill="#fff" opacity=".8"/>
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
    if(t>=2) g+=[6.2,25.8].map(x=>`<ellipse cx="${x}" cy="10.4" rx="3.6" ry="2.7" fill="${icoShade(c,1.12)}" ${OUT}/><path d="M${x-2.4} 10.2Q${x} 8.8 ${x+2.4} 10.2" fill="none" stroke="${icoShade(c,1.4)}" stroke-width=".7"/>`).join('');   // plate pauldrons from the third tier
    if(t>=4) g+=[4.6,27.4].map((x,i)=>`<path d="M${x-1.4} 8.4L${x+(i?1.2:-1.2)} 4.2L${x+1.4} 8.4z" fill="${icoShade(c,1.25)}" ${OUT}/>`).join('');   // spikes on them
    if(t>=1) g+=`<rect x="9.5" y="22.4" width="13" height="2.4" fill="#2a1e14" ${OUT}/><rect x="14.6" y="22.2" width="2.8" height="2.8" rx=".6" fill="${t>=3?'#f0cd45':'#b8bec4'}" ${OUT}/>`;   // a belt
  } else if(it.slot==='bottom'){
    const L=ARMOR_LOOK.bottom[t], c=colHex(L.bottomColor);
    g=`<path d="M9 4.5H23L24.5 28H18L16 12.5L14 28H7.5Z" fill="${c}" ${OUT}/><path d="M9 4.5H23V7.5H9Z" fill="${icoShade(c,0.7)}" ${OUT}/>`;
    if(t===0) g+=`<rect x="14.8" y="4.8" width="2.4" height="2.4" fill="#c9a24a"/>`;
    else if(t===1) g+=`<g fill="none" stroke="${icoShade(c,0.62)}" stroke-width=".7">${[11,15,19,23].map(y=>`<path d="M9 ${y}q1.3 1.2 2.6 0t2.6 0M18.2 ${y}q1.3 1.2 2.6 0t2.6 0"/>`).join('')}</g>`;
    else g+=`<path d="M8.6 15H14.6M17.4 15H23.6M8.2 21H14.2M17.8 21H24" stroke="${icoShade(c,0.62)}" stroke-width="1.1"/><circle cx="11.5" cy="18" r="1.1" fill="${icoShade(c,1.3)}"/><circle cx="21" cy="18" r="1.1" fill="${icoShade(c,1.3)}"/>`;
    if(t>=2) g+=[11.2,20.8].map(x=>`<ellipse cx="${x}" cy="17.4" rx="2.6" ry="2.2" fill="${icoShade(c,1.15)}" ${OUT}/>`).join('');   // knee plates
    if(t>=3) g+=`<path d="M9.5 8H22.5" stroke="#f0cd45" stroke-width="1.4"/><path d="M7.8 26H13.4M18.6 26H24.2" stroke="${icoShade(c,0.55)}" stroke-width="1.6"/>`;   // a gilded waist and cuffs
  } else if(it.slot==='shoes'){
    const L=ARMOR_LOOK.shoes[t], c=colHex(L.shoeColor);
    g=`<path d="M8 4H18V18.5L25.5 20.5Q28.5 21.5 28.5 25V27.5H8Z" fill="${c}" ${OUT}/><path d="M8 25H28.5" stroke="${icoShade(c,0.55)}" stroke-width="1.6"/><path d="M8 8H18" stroke="${icoShade(c,0.7)}" stroke-width="1.2"/>`;
    if(t===0) g+=`<path d="M11 11H15M11 14H15" stroke="#e8dcc0" stroke-width=".8"/>`;
    else g+=`<path d="M18 18.5Q13 17 8 18.5" fill="none" stroke="${icoShade(c,1.3)}" stroke-width="1"/>${t>=3?'<circle cx="13" cy="12" r="1.2" fill="#e0384a" stroke="#15120e" stroke-width=".6"/>':''}`;
    g+=`<path d="M25.6 21.4Q28.6 22.2 28.6 25.6" fill="none" stroke="${icoShade(c,1.35)}" stroke-width="1"/>`;   // a lit toe cap
    if(t>=2) g+=`<rect x="7.4" y="9.4" width="11.2" height="2.2" fill="${icoShade(c,0.5)}" ${OUT}/><rect x="11.6" y="9.2" width="2.6" height="2.6" rx=".5" fill="#c9b27a" ${OUT}/><rect x="7.4" y="14.6" width="11.2" height="2" fill="${icoShade(c,0.5)}" ${OUT}/>`;   // straps and a buckle
    if(t>=4) g+=`<path d="M8 12Q2.6 11.4 2.2 5.6Q6.4 8 8.6 8.4z" fill="${icoShade(c,1.3)}" ${OUT}/>`;   // a wing at the ankle
  }
  else if(it.kind==='tool') g=toolIconArt(it);
  else if(it.kind==='ring') g=ringIconArt(it);   // dungeons: the ring
  else if(it.kind==='pendant') g=pendantIconArt(it);
  if(it.dg&&it.kind!=='ring'&&it.kind!=='pendant') g+=it.roll0?RL_SPARK:DG_SPARK;   // rolls: level-40 gear sparkles gold   // dungeons: a jade sparkle marks level-30 gear (a ring and a pendant draw theirs when tempered)
  return `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#icoLit)">${g}</g></svg>`;
}
// the three tools: a wooden haft and a head in the colour of the tier's ore (ORE_GRADES)
function toolIconArt(it){
  const c=ORE_GRADES[it.tier][2], h='#7a5236';
  if(it.slot==='pick') return `<g transform="rotate(38 16 16)"><rect x="14.7" y="7" width="2.6" height="22" rx="1.1" fill="${h}" ${OUT}/><path d="M3.5 12.5Q16 2.5 28.5 12.5L28.5 14.6Q16 8 3.5 14.6Z" fill="${c}" ${OUT}/><path d="M9 9.6Q16 6.4 23 9.6" fill="none" stroke="${icoShade(c,1.3)}" stroke-width=".9"/></g>`;
  if(it.slot==='axe') return `<g transform="rotate(32 16 16)"><rect x="14.7" y="5" width="2.6" height="24" rx="1.1" fill="${h}" ${OUT}/><path d="M17.3 6Q29 4.5 28 16Q23 13.5 17.3 14.5Z" fill="${c}" ${OUT}/><path d="M20 8.5Q25 8 26 12" fill="none" stroke="${icoShade(c,1.3)}" stroke-width=".9"/></g>`;
  return `<g transform="rotate(20 16 16)"><rect x="14.7" y="17" width="2.6" height="12" rx="1.1" fill="${h}" ${OUT}/><path d="M16 17.6Q3.5 15 7 4.5Q9 10.5 22 10.5Q17 12 16 17.6Z" fill="${c}" ${OUT}/><path d="M9 7Q11 10.5 18 11" fill="none" stroke="${icoShade(c,1.35)}" stroke-width=".9"/></g>`;
}
// the dungeon ring: a gold band and a gem in the colour of its element (ELEMS; the plain ring's gem is pale), a jade sparkle on the band when it is enhanced
const RL_SPARK='<path d="M26.5 2.5l1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1z" fill="#ffd24a" stroke="#15120e" stroke-width=".6"/>';   // rolls: the level-40 sparkle
const DG_SPARK='<path d="M26.5 2.5l1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1z" fill="#9ff0c8" stroke="#15120e" stroke-width=".6"/>';
function ringIconArt(it){
  const c=ELEMS[it.el].col, band=['#cdbd8a','#c9d3e8','#d9c3f5','#f5dc70','#a8ee9c'][it.rar];
  return `<circle cx="16" cy="11" r="9" fill="${c}" opacity=".22"/><circle cx="16" cy="20" r="8" fill="none" stroke="#15120e" stroke-width="5"/><circle cx="16" cy="20" r="8" fill="none" stroke="${band}" stroke-width="3"/>
    <path d="M16 4.5l4.2 4.8-4.2 5.2-4.2-5.2z" fill="${c}" ${OUT}/><path d="M16 4.5l-1.8 4.8 1.8 5.2zM12 9.3h8.4" fill="none" stroke="${icoShade(c,1.3)}" stroke-width=".7"/>${it.n?DG_SPARK:''}`;
}
// the pendants: a chain in the metal of the rarity (the ring's bands) and a gem whose colour and shape tell the kind (a diamond for XP, a drop for drops, a coin, a four-point star for crit rate, a shard for crit damage), a jade sparkle when tempered
const PENDANT_METAL=['#cdbd8a','#c9d3e8','#d9c3f5','#f5dc70','#a8ee9c'], PENDANT_GEM={xp:'#62d66e',drop:'#e8a23a',coin:'#f0cd45',crit:'#e0384a',critdmg:'#b77cf5'};
function pendantIconArt(it){
  const m=PENDANT_METAL[it.rar], c=PENDANT_GEM[it.stat], d=icoShade(c,0.6), l=icoShade(c,1.35);
  let gem;
  if(it.stat==='xp') gem=`<path d="M16 14L22 20.5L16 28L10 20.5Z" fill="${c}" ${OUT}/><path d="M16 14L19 20.5L16 28L13 20.5Z" fill="${l}"/><path d="M10 20.5H22" stroke="${d}" stroke-width=".7"/>`;
  else if(it.stat==='drop') gem=`<path d="M16 13.5Q23.5 21 21.5 24.8Q19.8 28.5 16 28.5Q12.2 28.5 10.5 24.8Q8.5 21 16 13.5Z" fill="${c}" ${OUT}/><path d="M13.4 22Q13 25 15.2 26.3" fill="none" stroke="${l}" stroke-width="1.2"/>`;
  else if(it.stat==='coin') gem=`<circle cx="16" cy="21" r="7.4" fill="${c}" ${OUT}/><circle cx="16" cy="21" r="4.6" fill="none" stroke="${d}" stroke-width=".9"/><path d="M14.2 21H17.8M16 19.2V22.8" stroke="${d}" stroke-width="1"/>`;
  else if(it.stat==='crit') gem=`<path d="M16 12.5L18.3 18.7L24.5 21L18.3 23.3L16 29.5L13.7 23.3L7.5 21L13.7 18.7Z" fill="${c}" ${OUT}/><path d="M16 15.5L17.2 19.8L16 21Z" fill="${l}"/>`;
  else gem=`<path d="M17.5 13L23 19L19.4 20.6L22 29L10 21.5L14 20L11 16Z" fill="${c}" ${OUT}/><path d="M17 15.5L19.5 19L16 20.5Z" fill="${l}"/>`;
  return `<path d="M6.5 3.5Q16 22 25.5 3.5" fill="none" stroke="#15120e" stroke-width="3" stroke-linecap="round"/><path d="M6.5 3.5Q16 22 25.5 3.5" fill="none" stroke="${m}" stroke-width="1.6" stroke-dasharray="2 1.2" stroke-linecap="round"/><circle cx="16" cy="13" r="1.6" fill="${m}" ${OUT}/>${gem}${it.n?DG_SPARK:''}`;
}
// bag icons for what is not equipment: a monster drop (a faceted shard in the monster's colour), ore (a rock), a log, a herb (a sprig)
function matIconArt(col,kind){
  const d=icoShade(col,0.62), l=icoShade(col,1.3);
  if(kind==='mining') return `<path d="M5 24L9 11L17 6L26 11L28 23L18 28Z" fill="${col}" ${OUT}/><path d="M9 11L17 15L26 11M17 15L18 28" fill="none" stroke="${d}" stroke-width=".9"/><path d="M10.5 12.5L16 9.5" stroke="${l}" stroke-width="1.2"/><circle cx="22" cy="19" r="1.6" fill="${l}"/>`;
  if(kind==='woodcutting') return `<rect x="4" y="11" width="24" height="12" rx="2" fill="${col}" ${OUT}/><path d="M7 14H25M7 17.5H25M7 20.5H25" stroke="${d}" stroke-width=".8" opacity=".7"/><ellipse cx="26" cy="17" rx="3" ry="6" fill="${l}" ${OUT}/><ellipse cx="26" cy="17" rx="1.4" ry="3" fill="none" stroke="${d}" stroke-width=".8"/>`;
  if(kind==='gathering') return `<path d="M16 28V13" stroke="#15120e" stroke-width="3.4" stroke-linecap="round"/><path d="M16 28V13" stroke="#5a8a3a" stroke-width="1.6" stroke-linecap="round"/><path d="M16 15Q8 14 7 6Q15 6 16 15Z" fill="${col}" ${OUT}/><path d="M16 19Q24 18 25 10Q17 10 16 19Z" fill="${col}" ${OUT}/><path d="M16 24Q10 24 8 18Q14 17 16 24Z" fill="${l}" ${OUT}/>`;
  return `<path d="M16 3L26 12L16 29L6 12Z" fill="${col}" ${OUT}/><path d="M6 12H26M16 3L12 12L16 29L20 12Z" fill="none" stroke="${d}" stroke-width=".9"/><path d="M9 11L14 5.5" stroke="${l}" stroke-width="1.3"/>`;
}
// id + name given for a monster drop: its own picture (ui/drop-icons.js); a resource passes its profession as `kind`
const matIcon=(col,kind,id,name)=>`<svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g filter="url(#icoLit)">${kind==='drop'&&id?dropIconArt(id,col,name):matIconArt(col,kind)}</g></svg>`;
// faint outline for an empty equipment slot
function slotIcon(slot){
  const fake=slot==='weapon'?ITEM.sword1:slot==='ring'?ITEM['ring-basic']:slot==='pendant'?ITEM['pendant-xp']:ITEM[slot+'1'];  return itemIcon(fake).replace('class="ico"','class="ico ghost"');
}
