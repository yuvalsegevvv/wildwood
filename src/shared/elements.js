//@ Elements (ELEMS): the soul you bind (SOUL_LV), opposites, and the damage multipliers for your soul and for a monster's element. Pure.
/* Six elements and 'basic' (none). They are listed as a wheel, fire > water > earth > air > fire, with dark and light as a pair; the wheel is
   only the order the soul shrine shows them in. What counts is the opposites: fire / water, earth / air, dark / light.
   - Your soul: bind it to an element at the shrine in Hanami (level SOUL_LV, free, as often as you like). Your skills of that element deal
     x1.5, skills of its opposite deal x1/1.5. Everything else (other elements, 'basic') is unchanged. Basic soul = no bonus, no penalty.
   - A monster's element (el in monster-defs.js): the opposite element hurts it x1.5, its own element only x1/1.5 (it resists).
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
const ELEM_WHEEL=['fire','water','earth','air'];
const ELEM_OPP={fire:'water',water:'fire',earth:'air',air:'earth',dark:'light',light:'dark'};
const SOUL_LV=15, ELEM_BOOST=1.5;
const elOf=x=>x&&ELEMS[x.el]?x.el:'basic';   // the element of a skill or monster definition
// a skill of element el used by a soul bound to soul (bonus: added to the x1.5, from the Resonance passive)
function soulMult(soul,el,bonus){
  if(el==='basic'||soul==='basic'||!ELEM_OPP[soul]) return 1;
  return el===soul?ELEM_BOOST+(bonus||0):ELEM_OPP[soul]===el?1/ELEM_BOOST:1;
}
// a skill of element el hitting a monster of element foe
function foeMult(el,foe){
  if(el==='basic'||foe==='basic'||!ELEM_OPP[foe]) return 1;
  return ELEM_OPP[foe]===el?ELEM_BOOST:foe===el?1/ELEM_BOOST:1;
}
