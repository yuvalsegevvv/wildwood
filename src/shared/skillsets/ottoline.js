//@ Ottoline's skill set, The Porcelain Hour (a debuff and buff support, dark): strings tied to the enemy that weaken it, a dance that quickens the party, and a curtsy that guards everyone; black, porcelain and blood rose
/* Agent map. Kit: docs/skillkits/kit-support.md (focus 'both': the only set that buffs and debuffs); theme and element: docs/skillkits/THEMES.md, ELEMENTS.md (version 3, the Gloamhorn's pair: all six pieces dark, the
   perma-twilight); outfit and palette: docs/skillkits/looks/ottoline.md, game/outfits/ottoline.js; visuals: game/skillsets/look-ottoline.js. Registry: shared/skillsets.js, docs/skillkits/AUTHORING.md. Test: tools/skillsets-v3-smoke.js.
   LAND: the Gloamhorn's set from +4 (see ogden.js). Mark: String (tied by the blows; Dance, Dolly and the bonus read it: weaker enemies, stronger allies). Corvin (debuff) and Dunstan (buff)
   do one half each; she does both at half strength and is fragile for it (Porcelain). */
defineSkillSet({
  id:'ottoline', name:'The Porcelain Hour', land:'gloam', needs:{tier:4}, el:'dark', outfit:'ottoline',
  role:{main:'support', focus:'both'},
  char:{name:'Ottoline', sex:'female', theme:'a porcelain doll who pulls strings: the enemy dances weaker and her friends dance stronger', ip:{kind:'original', riffs:'the porcelain-doll and gothic-fashion genre (a bonnet, ringlets, lace, a corset, a key); no existing character'}},
  pal:{main:0x2a2234, accent:0xf3eee8, glow:0xb06ad8},
  emblem:{col:0xc88ae8, glyph:'<circle cx="12" cy="7.5" r="3.4"/><path d="M12 11v6"/><path d="M7 21l5-4 5 4"/><path d="M4 4l5 4M20 4l-5 4"/>'},
  kit:{mark:'string', name:'String', text:'Every blow ties a String (up to 3) to its target; the more Strings, the weaker it fights and the harder the party hits it.'},
  pos:{
    1:{bound:'class',
       skill:{
         warrior:{name:'Puppet Jab', desc:'A needle-sharp jab: a hit that makes the target deal 5% less damage for 3 seconds (3% less for each String) and quickens your crits for the party. Leaves a String.', cd:0.9, range:3.4, mult:1.2, act:['ottoline1w',0.5,0.35], anim:'slash',
                  fx:{cone:{r:3.4, arc:1.0, status:{kind:'weak', v:0.05, dur:3, perMark:{id:'string', v:0.03}}, mark:{id:'string', n:1, dur:12, max:3}}, ally:{kind:'crit', v:0.04, dur:3, r:18}}},
         archer:{name:'Thread Shot', desc:'A bolt trailing a black thread: a hit that makes the target deal 5% less damage for 3 seconds (3% less for each String) and gives you and your allies 4% more crit chance. Leaves a String.', cd:0.9, range:28, mult:1.1, act:['ottoline1a',0.55,0.5], anim:'shoot',
                 fx:{proj:{kind:'spirit', speed:44, turn:9, life:0.9, status:{kind:'weak', v:0.05, dur:3, perMark:{id:'string', v:0.03}}, mark:{id:'string', n:1, dur:12, max:3}}, ally:{kind:'crit', v:0.04, dur:3, r:18}}},
         mage:{name:'Cat\'s Cradle', desc:'A web of dark thread: a hit that makes the target deal 5% less damage for 3 seconds (3% less for each String) and gives you and your allies 4% more crit chance. Leaves a String.', cd:1.1, range:24, mult:1.3, act:['ottoline1m',0.6,0.5], anim:'cast',
               fx:{proj:{kind:'spirit', speed:32, turn:8, life:1.0, status:{kind:'weak', v:0.05, dur:3, perMark:{id:'string', v:0.03}}, mark:{id:'string', n:1, dur:12, max:3}}, ally:{kind:'crit', v:0.04, dur:3, r:18}}}},
       passive:{name:'Pulled Strings', text:'+{}% critical hit chance against a target carrying Strings', stat:'crit', v:[0.10, 0.01], when:{marked:'string'}}},
    2:{bound:'any',
       skill:{any:{name:'Dance, Dolly', desc:'A music-box waltz at your target\'s feet: for 4 seconds everything in it is slowed and deals 10% less damage, while you and your allies within 25 m deal 10% more (2% more for each String near you). Leaves a String.', cd:12, range:22, mult:0.5, act:['ottoline2x',0.7,0.5], anim:'nova',
                   fx:{zone:{r:7, dur:4, every:1, slow:1.2, status:{kind:'weak', v:0.10, dur:2.5}, mark:{id:'string', n:1, dur:12, max:3}}, ally:{kind:'might', v:0.10, dur:8, r:25, perMark:{id:'string', v:0.02, r:8}}}}},
       passive:{name:'Porcelain', text:'{}% less damage taken; you have 10% less maximum health', stat:'red', v:[0.05, 0.01], cost:{stat:'hp', v:-0.10}}},
    3:{bound:'any',
       skill:{any:{name:'Final Curtsy', desc:'Bow and the strings go taut: every enemy within 12 m deals 20% less damage for 8 seconds (2% less for each String; the cap is 30%), and you and your allies within 25 m take 15% less damage and get 15% more crit damage for 8 seconds.', cd:42, range:12, mult:1.6, act:['ottoline3x',0.9,0.6], anim:'nova',
                   fx:{ring:{r:12, status:{kind:'weak', v:0.20, dur:8, perMark:{id:'string', v:0.02}}, mark:{id:'string', n:1, dur:12, max:3}}, ally:[{kind:'guard', v:0.15, dur:8, r:25}, {kind:'critdmg', v:0.15, dur:8, r:25}]}}},
       passive:{name:'Glass Eyes', text:'+{}% damage with every attack; your cooldowns are 8% longer', stat:'dmg', v:[0.06, 0.01], cost:{stat:'cd', v:-0.08}}}},
  bonus:{
    3:{name:'Tangle', text:'a target carrying your String takes {}% more from you for each String', amp:{id:'string', per:0.08}},
    5:{name:'Last Dance', text:'Your third-slot attack also gives you and your allies within 25 m 15% more damage for 10 seconds and puts a weakening wave over the enemies within 12 m', on:'cast3', buff:{kind:'might', v:0.15, dur:10, r:25}, mult:0.4, range:12, fx:{ring:{r:12, status:{kind:'weak', v:0.12, dur:6}}}}},
});
