//@ Elements (ELEMS): your soul (SOUL_LV, opposite pairs) and a monster's element (the wheel), with the damage multipliers for both. Pure.
/* Six elements and 'basic' (none). Two different rules use them:
   - Your soul (soulMult) works on PAIRS. Bind it at the shrine in Hanami (level SOUL_LV, free, as often as you like): skills of that element deal
     x1.5, skills of its opposite deal x1/1.5 (opposites: fire / water, earth / air, dark / light), every other skill is unchanged. Basic soul = nothing.
   - A monster's element (foeMult, el in monster-defs.js) works on the WHEEL: water beats fire beats air beats earth beats water (ELEM_BEATS, listed in
     that order in ELEM_WHEEL), and dark and light beat each other. A skill whose element beats the monster's deals x1.5, a skill the monster's element
     beats deals x1/1.5, and a skill of the monster's own element also x1/1.5 (it resists it). Everything else is unchanged.
   Both stack (a water skill from a fire soul at a fire monster: x1/1.5 x1.5). Change ELEM_BOOST to retune everything at once. */
const ELEMS={
  basic:{name:'Basic',col:'#cfc8b8'},
  fire: {name:'Fire', col:'#ff7a45'},
  water:{name:'Water',col:'#4aa8ff'},
  earth:{name:'Earth',col:'#c2914e'},
  air:  {name:'Air',  col:'#8fe6d0'},
  dark: {name:'Dark', col:'#a87aff'},
  light:{name:'Light',col:'#ffe27a'}
};
const ELEM_WHEEL=['water','fire','air','earth'], ELEM_LIST=[...ELEM_WHEEL,'dark','light'];   // the wheel in the order each element beats the next
const ELEM_BEATS={water:'fire',fire:'air',air:'earth',earth:'water',dark:'light',light:'dark'};   // each element beats the one it maps to
const ELEM_OPP={fire:'water',water:'fire',earth:'air',air:'earth',dark:'light',light:'dark'};   // the soul's pairs
const SOUL_LV=15, ELEM_BOOST=1.5;
const elOf=x=>x&&ELEMS[x.el]?x.el:'basic';   // the element of a skill or monster definition
// a skill of element el used by a soul bound to soul (bonus: added to the x1.5, from the Resonance passive)
function soulMult(soul,el,bonus){
  if(el==='basic'||soul==='basic'||!ELEM_OPP[soul]) return 1;
  return el===soul?ELEM_BOOST+(bonus||0):ELEM_OPP[soul]===el?1/ELEM_BOOST:1;
}
// a skill of element el hitting a monster of element foe: it beats the monster's element x1.5, is beaten by it (or shares it) x1/1.5
function foeMult(el,foe){
  if(!ELEM_BEATS[el]||!ELEM_BEATS[foe]) return 1;   // 'basic' on either side
  if(ELEM_BEATS[el]===foe) return ELEM_BOOST;
  if(ELEM_BEATS[foe]===el||el===foe) return 1/ELEM_BOOST;
  return 1;
}
// what a monster of element foe is weak to and what it resists, as lists of elements (the target frame shows them)
function foeTraits(foe){
  const weak=[], resist=[];
  for(const e of ELEM_LIST){ const m=foeMult(e,foe); if(m>1) weak.push(e); else if(m<1) resist.push(e); }
  return {weak,resist};
}
