//@ The Abyss's curses (B6): ten burdens a run can carry beside its 20 artifacts (stronger monsters, less healing, fewer offered cards); one defineAbCurse row each; Events (B8) hand them out
/* agent map (docs/ABYSS.md section 3d; registry: shared/abyss.js defineAbCurse, abCurseStat)
   exports: nothing (the rows fill AB_CURSES)
   users: server/abyss/arts.js (abP multiplies the hiker's own factors), server/abyss/rounds.js (abSpawnS: mhp / mdmg on every spawn), server/abyss/arts.js (abOfferP: `offer` takes cards off the offer), game/abyss/choice.js (the curse row)
   test: tools/abyss-smoke.js
   At most AB_CURSE_MAX (5) on the run, a repeat stacks, they do not use the bar's 20 places; a Shrine removes one (B8). */
defineAbCurse({id:'ab_c_hides',name:'Thick Hides',icon:'▣',k:{mhp:1.25},text:'Monsters have 25% more health.'});
defineAbCurse({id:'ab_c_claws',name:'Whetted Claws',icon:'⩔',k:{mdmg:1.25},text:'Monsters deal 25% more damage.'});
defineAbCurse({id:'ab_c_famine',name:'Famine',icon:'☒',k:{heal:0.7},text:'Healing received x0.7.'});
defineAbCurse({id:'ab_c_narrow',name:'Narrow Offers',icon:'⊟',k:{offer:1},text:'One fewer artifact in every offer.'});
defineAbCurse({id:'ab_c_frail',name:'Frail Frame',icon:'♡',k:{hp:0.85},text:'Maximum health x0.85.'});
defineAbCurse({id:'ab_c_dull',name:'Dull Blades',icon:'▽',k:{atk:0.85},text:'Damage dealt x0.85.'});
defineAbCurse({id:'ab_c_horde',name:'Swollen Horde',icon:'❖',k:{mhp:1.5},text:'Monsters have 50% more health.'});
defineAbCurse({id:'ab_c_frenzy',name:'Frenzy',icon:'☄',k:{mdmg:1.5},text:'Monsters deal 50% more damage.'});
defineAbCurse({id:'ab_c_hollow',name:'Hollow Ward',icon:'◍',k:{def:1.2},text:'Damage taken x1.2.'});
defineAbCurse({id:'ab_c_ruin',name:'Creeping Ruin',icon:'☣',k:{mhp:1.1,mdmg:1.1},text:'Monsters have 10% more health and deal 10% more damage.'});
