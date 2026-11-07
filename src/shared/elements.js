//@ Elements (ELEMS): the wheel a skill's element plays against a monster's element (foeMult, foeTraits), the x1.1 an element-less skill gets (ELEM_BASIC_K). Pure.
/* Six elements and 'basic' (none). One rule uses them (the soul and its opposite pairs are gone):
   - A monster's element (foeMult, el in monster-defs.js) works on the WHEEL: water beats fire beats air beats earth beats water (ELEM_BEATS, listed in
     that order in ELEM_WHEEL), and dark and light beat each other. A skill whose element beats the monster's deals x1.5, a skill the monster's element
     beats deals x1/1.5, and a skill of the monster's own element also x1/1.5 (it resists it). Everything else is unchanged.
   - A skill with no element ('basic') deals ELEM_BASIC_K = x1.1 to every monster: neither strong nor weak anywhere (foeTraits never lists it).
   Change ELEM_BOOST / ELEM_BASIC_K to retune everything at once. Used by: server/combat.js (elemHitS), server/pvp.js, game/ui/combat-hud.js (foeTraits), game/ui/element-icons.js (names and colours). Test: tools/skills-smoke.js. */
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
const ELEM_BOOST=1.5, ELEM_BASIC_K=1.1;   // the wheel's strength; what an element-less skill deals to any monster
const elOf=x=>x&&ELEMS[x.el]?x.el:'basic';   // the element of a skill or monster definition
// a skill of element el hitting a monster of element foe: it beats the monster's element x1.5, is beaten by it (or shares it) x1/1.5; an element-less skill deals ELEM_BASIC_K to everything
// (boost: another strength than ELEM_BOOST, PVP.elemBoost between fighters; server/combat.js keeps the basic bonus out of a fight between fighters)
function foeMult(el,foe,boost){
  if(el==='basic') return ELEM_BASIC_K;
  if(!ELEM_BEATS[el]||!ELEM_BEATS[foe]) return 1;   // an unknown element, or a monster with none
  const B=boost||ELEM_BOOST;
  if(ELEM_BEATS[el]===foe) return B;
  if(ELEM_BEATS[foe]===el||el===foe) return 1/B;
  return 1;
}
// what a monster of element foe is weak to and what it resists, as lists of the six elements (the target frame shows them; 'basic' is x1.1 on every monster, so it is in neither list)
function foeTraits(foe){
  const weak=[], resist=[];
  for(const e of ELEM_LIST){ const m=foeMult(e,foe); if(m>1) weak.push(e); else if(m<1) resist.push(e); }
  return {weak,resist};
}
