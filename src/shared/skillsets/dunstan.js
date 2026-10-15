//@ Dunstan's skill set, The Rally (a buff support, fire): a striking pole that quickens the line, a cry of valor, and a banner planted for the whole fight; ember red, gold and drum cream
/* Agent map. Kit: docs/skillkits/kit-support.md (the buff focus); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (all six pieces fire: his hits leave the aura a partner reacts with into a burn; he debuffs nothing himself);
   outfit and palette: docs/skillkits/looks/dunstan.md, game/outfits/dunstan.js; visuals: game/skillsets/look-dunstan.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-first8-smoke.js,
   tools/skillsets-ladder.js --set dunstan. Land: the Hoarfrost Reach (tier 2, the second wave). Mark: Fervor. Buffs never stack (the stronger wins) and are capped (SS_ALLY_CAP), so a second buffer adds only a different KIND.
   What the engine gives him: a buff-duration stat (Loud Voice), a buff-power stat (Rousing; both are still capped by SS_ALLY_CAP), and `perMark` (Cry of Valor is stronger for each Fervor near him, and then spends them). */
defineSkillSet({
  id:'dunstan', name:'The Rally', land:'hoar', needs:{tier:2}, el:'fire', outfit:'dunstan',
  role:{main:'support', focus:'buff'},
  char:{name:'Dunstan', sex:'male', theme:'a standard-bearer and drummer who rallies the line', ip:{kind:'original', riffs:'the standard-bearer and drummer genre (a plumed shako, a pennant, a drum at the hip); no existing character'}},
  pal:{main:0xb8432a, accent:0xd4a83a, glow:0xff7a3a},
  emblem:{col:0xf0684a, glyph:'<path d="M6 21V4"/><path d="M6 4.5h12l-3.4 4.2 3.4 4.3H6"/><circle cx="6" cy="2.8" r="1"/>'},   // the set's own symbol on its skills and passives (24 x 24 strokes, drawn in col): never the generic star
  kit:{mark:'fervor', name:'Fervor', text:'Every strike leaves a Fervor (up to 5); Cry of Valor spends them for extra damage.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Rallying Strike', desc:'Swing the banner pole: a damaging hit that quickens you and your allies within 18 m (10% shorter cooldowns for 3 seconds). Leaves a Fervor.', cd:0.9, range:3.6, mult:1.35, act:['dunstan1w',0.5,0.35], anim:'slash',
                  fx:{cone:{r:3.6, arc:1.2, mark:{id:'fervor', n:1, dur:12, max:5}}, ally:{kind:'haste', v:0.10, dur:3, r:18}}},
         archer:{name:'Signal Arrow', desc:'An arrow with a pennant on it: a damaging hit that quickens you and your allies within 18 m (10% shorter cooldowns for 3 seconds). Leaves a Fervor.', cd:0.9, range:30, mult:1.25, act:['dunstan1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'ember', speed:44, turn:9, life:0.9, mark:{id:'fervor', n:1, dur:12, max:5}}, ally:{kind:'haste', v:0.10, dur:3, r:18}}},
         mage:{name:'Beacon Bolt', desc:'A beacon of flame: a damaging hit that quickens you and your allies within 18 m (10% shorter cooldowns for 3 seconds). Leaves a Fervor.', cd:1.1, range:24, mult:1.5, act:['dunstan1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'ember', speed:32, turn:8, life:1.0, mark:{id:'fervor', n:1, dur:12, max:5}}, ally:{kind:'haste', v:0.10, dur:3, r:18}}}},
       passive:{name:'Loud Voice', text:'Your buffs last {}% longer', stat:'buffdur', v:[0.4, 0.05]}},
    2:{bound:'any',
       skill:{any:{name:'Cry of Valor', desc:'A cry that carries: you and your allies within 25 m deal 10% more damage for 10 seconds, and 2% more for each Fervor on the enemies near you. A shock of flame round you then spends every Fervor nearby for extra damage.', cd:14, range:6, mult:1.1, act:['dunstan2x',0.7,0.45], anim:'nova',
                   fx:{ring:{r:6, kb:2}, ally:{kind:'might', v:0.10, dur:10, r:25, perMark:{id:'fervor', v:0.02, r:8}}, pop:{id:'fervor', k:0.5, r:6}}}},
       passive:{name:'Warm Hearth', text:'While you fight, you and your allies within 20 m regenerate 1% of maximum health a second (refreshed every 3 s)', on:'tick', icd:3, buff:{kind:'regen', v:0.01, dur:4, r:20}}},
    3:{bound:'any',
       skill:{any:{name:'Banner Down', desc:'Plant the banner at your feet for 8 seconds: you and your allies standing within 9 m get 20% more critical hit chance, 40% more critical damage and 2% health back a second, and the flame at its foot burns the enemies there.', cd:45, range:9, mult:0.5, act:['dunstan3x',0.9,0.6], anim:'nova',
                   fx:{zone:{r:9, dur:8, every:1, self:true, ally:[{kind:'crit', v:0.20, dur:2.5}, {kind:'critdmg', v:0.40, dur:2.5}, {kind:'regen', v:0.02, dur:2.5}]}}}},
       passive:{name:'Hoarse', text:'+{}% damage with every attack; your cooldowns are 8% longer', stat:'dmg', v:[0.06, 0.01], cost:{stat:'cd', v:-0.08}}}},
  bonus:{
    3:{name:'Rousing', text:'The buffs you give are {}% stronger (still capped)', stat:'buffpow', v:0.20},
    5:{name:'Blaze of Glory', text:'Banner Down also quickens you and your allies within 25 m: 20% shorter cooldowns for 8 s', on:'cast3', buff:{kind:'haste', v:0.20, dur:8, r:25}}},
});
