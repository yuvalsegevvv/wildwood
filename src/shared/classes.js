//@ Classes (CLASSES), basic attacks (ACTS), equippable skills with elements (SKILLS, abilityOf), skill levels, class-universal passives (PASSIVES). Pure.
/* ===================== COMBAT =====================
   Three classes, each with a basic attack; skills are equipped separately (below). */
const CLASSES={
  warrior:{name:'Warrior',basic:{name:'Slash',cd:0.7,range:3,mult:1},
           desc:'Sword and shield. Slash hits everything in a wide arc in front of you. Skills: Whirlwind, Shield Bash, Charge.'},
  archer: {name:'Archer', basic:{name:'Shoot',cd:0.8,range:32,mult:0.9},
           desc:'Longbow and quiver. Shoot fires a homing arrow at your target from far away. Skills: Volley, Piercing Shot, Arrow Rain.'},
  mage:   {name:'Mage',   basic:{name:'Firebolt',cd:1.1,range:26,mult:1.3},
           desc:'Staff and spells. Firebolt hurls a ball of fire that bursts on impact and singes nearby foes. Skills: Frost Nova, Chain Lightning, Meteor.'}
};
const ACTS={warrior:{basic:['slash',0.5,0.45]},archer:{basic:['shoot',0.55,0.6]},mage:{basic:['cast',0.6,0.5]}};
/* ===================== SKILLS =====================
   Three slots per class: 'basic' (always open), 'skill' (opens at level SKILL_SLOT_LV) and 'burst' (level
   BURST_SLOT_LV). Only an equipped ability can be used. The first ability of each slot is free; the others are
   taught by Aldric, the trainer at the well. Only the mage can swap its basic attack.
   act = [what happens, seconds, when in the swing it lands]; anim = which body animation it borrows.
   buff = a timed boost instead of a hit: {dur, dmg (damage x), cd (basic cooldown x), crit (+chance), red (damage taken less), steal (heals this share of the damage you deal), regen (health per second, share of max), el}.
   el = the element of the skill (see elements.js; none = 'basic'). A buff's el turns your element-less attacks into that element while it lasts.
   drop = the id of the boss that drops it (not sold; see the boss skills at the end of the table). fx = what a skill with generic effects does. */
const SKILL_SLOT_LV=3, BURST_SLOT_LV=10, SLOTS=['basic','skill','burst'];
const SKILLS={
  // ---- basic attacks ----
  slash:{cls:'warrior',slot:'basic',name:'Slash',cd:0.7,range:3,mult:1,price:0,lv:1,act:['slash',0.5,0.45],desc:'Hit everything in a wide arc in front of you.'},
  shoot:{cls:'archer',slot:'basic',name:'Shoot',cd:0.8,range:32,mult:0.9,price:0,lv:1,act:['shoot',0.55,0.6],desc:'A homing arrow at your target, from far away.'},
  firebolt:{cls:'mage',slot:'basic',el:'fire',name:'Firebolt',cd:1.1,range:26,mult:1.3,price:0,lv:1,act:['cast',0.6,0.5],desc:'A ball of fire that bursts on impact and singes nearby foes.'},
  iceshard:{cls:'mage',slot:'basic',el:'water',name:'Ice Shard',cd:0.7,range:28,mult:0.8,price:250,lv:4,act:['shard',0.42,0.5],anim:'cast',desc:'A fast shard of ice. Quicker than Firebolt, no splash, and it slows what it hits.'},
  missiles:{cls:'mage',slot:'basic',el:'dark',name:'Arcane Missiles',cd:1.5,range:26,mult:0.6,price:900,lv:8,act:['missiles',0.65,0.5],anim:'cast',desc:'Three homing missiles that spread over the enemies around your target.'},
  // ---- skills (level 3) ----
  whirlwind:{cls:'warrior',slot:'skill',el:'air',name:'Whirlwind',cd:6,range:3.4,mult:0.9,price:0,lv:3,act:['spin',0.7,0.45],desc:'Spin and strike every enemy around you.'},
  bash:{cls:'warrior',slot:'skill',el:'light',name:'Shield Bash',cd:7,range:3.2,mult:1.6,price:180,lv:3,act:['bash',0.55,0.5],anim:'slash',desc:'Slam your shield into the enemies in front of you: heavy damage, and they are stunned for 2 seconds.'},
  charge:{cls:'warrior',slot:'skill',el:'fire',name:'Charge',cd:9,range:14,mult:1.4,price:650,lv:6,act:['charge',0.6,0.45],anim:'slash',desc:'Dash up to 14 m to your target and crash down, hitting and knocking back everything where you land.'},
  volley:{cls:'archer',slot:'skill',el:'air',name:'Volley',cd:5,range:32,mult:0.6,price:0,lv:3,act:['volley',0.7,0.6],desc:'Loose three homing arrows in a fan.'},
  pierce:{cls:'archer',slot:'skill',el:'earth',name:'Piercing Shot',cd:6,range:34,mult:1.8,price:180,lv:3,act:['pierce',0.75,0.7],anim:'shoot',desc:'A heavy arrow that flies straight through every enemy in its path.'},
  rain:{cls:'archer',slot:'skill',el:'water',name:'Arrow Rain',cd:11,range:30,mult:0.45,price:650,lv:6,act:['rain',0.7,0.6],anim:'volley',desc:'A storm of arrows on your target\'s area: 5 waves over 2.5 seconds hit everything inside.'},
  frostnova:{cls:'mage',slot:'skill',el:'water',name:'Frost Nova',cd:7,range:5.5,mult:0.8,price:0,lv:3,act:['nova',0.7,0.5],desc:'Blast everything around you with ice and slow it down.'},
  chain:{cls:'mage',slot:'skill',el:'air',name:'Chain Lightning',cd:6,range:26,mult:1.2,price:180,lv:3,act:['chain',0.6,0.5],anim:'cast',desc:'Lightning strikes your target and jumps to 4 more enemies nearby, a little weaker each jump.'},
  meteor:{cls:'mage',slot:'skill',el:'earth',name:'Meteor',cd:12,range:28,mult:2.4,price:650,lv:6,act:['meteor',0.8,0.55],anim:'nova',desc:'Call a meteor down on your target\'s area. It lands 1.2 seconds later, crushing and knocking back everything there.'},
  // ---- bursts (level 10) ----
  quake:{cls:'warrior',slot:'burst',el:'earth',name:'Earthshatter',cd:35,range:7,mult:3,price:0,lv:10,act:['quake',0.9,0.6],anim:'nova',desc:'Smash the ground: huge damage to everything within 7 m, knocked back and stunned for 1.5 seconds.'},
  bladestorm:{cls:'warrior',slot:'burst',el:'dark',name:'Blade Storm',cd:38,range:3.8,mult:0.7,price:2000,lv:12,act:['bladestorm',0.4,0.3],anim:'spin',desc:'Become a whirl of steel for 4 seconds: every enemy near you is hit 10 times, and you can keep moving.'},
  berserk:{cls:'warrior',slot:'burst',name:'Berserk',cd:40,range:0,mult:0,price:4000,lv:14,act:['berserk',0.5,0.4],anim:'nova',buff:{dur:10,dmg:1.5,cd:0.6,crit:0},desc:'For 10 seconds: 50% more damage, and your basic attack is 40% faster.'},
  hail:{cls:'archer',slot:'burst',el:'dark',name:'Hail of Arrows',cd:38,range:32,mult:0.5,price:0,lv:10,act:['hail',0.8,0.6],anim:'volley',desc:'A huge storm of arrows on your target\'s area: 8 waves over 4 seconds on everything within 7 m.'},
  snipe:{cls:'archer',slot:'burst',el:'light',name:'Sniper Shot',cd:30,range:45,mult:6.5,price:2000,lv:12,act:['snipe',1.3,0.8],anim:'shoot',desc:'Take careful aim, then one devastating arrow at your target from up to 45 m.'},
  focus:{cls:'archer',slot:'burst',name:"Hunter's Focus",cd:40,range:0,mult:0,price:4000,lv:14,act:['focus',0.5,0.4],anim:'shoot',buff:{dur:10,dmg:1.15,cd:0.5,crit:0.35},desc:'For 10 seconds: shoot twice as fast, 35% more critical hits and 15% more damage.'},
  blizzard:{cls:'mage',slot:'burst',el:'water',name:'Blizzard',cd:40,range:30,mult:0.42,price:0,lv:10,act:['blizzard',0.8,0.6],anim:'nova',desc:'A blizzard on your target\'s area for 5 seconds: 10 waves of ice on everything within 8 m, and it slows them.'},
  inferno:{cls:'mage',slot:'burst',el:'fire',name:'Inferno',cd:35,range:7,mult:3.4,price:2000,lv:12,act:['inferno',0.9,0.6],anim:'nova',desc:'Explode in a ring of fire: huge damage to everything within 7 m of you, knocked back.'},
  surge:{cls:'mage',slot:'burst',name:'Arcane Surge',cd:45,range:0,mult:0,price:4000,lv:14,act:['surge',0.5,0.4],anim:'cast',buff:{dur:10,dmg:1.4,cd:0.7,crit:0,reset:true},desc:'Your skill is ready again at once, and for 10 seconds you deal 40% more damage and cast 30% faster.'},
  // ---- boss skills: not sold, each has a drop chance from its boss (drop = the boss's id, BOSS_SKILL_CHANCE in drops.js) and cannot be upgraded yet.
  //      fx = what it does, resolved by resolveFxS on the server (ring, cone, beam, chain, proj, zone, dash, buff; see server/combat.js) and drawn from the same
  //      entries on the client. lv = the boss's level. A share k is a fraction of the skill's mult.
  // The Rootwarden (level 15)
  snare:{cls:'warrior',slot:'skill',el:'earth',drop:'boss',name:'Bramble Snare',cd:9,range:7,mult:0.9,price:0,lv:15,act:['snare',0.65,0.45],anim:'nova',fx:{ring:{r:7,kb:-8,stun:1.5}},desc:'Thorned roots lash out and drag every enemy within 7 m to you, rooting them for 1.5 seconds.'},
  lifesap:{cls:'warrior',slot:'burst',el:'water',drop:'boss',name:'Lifesap Frenzy',cd:40,range:0,mult:0,price:0,lv:15,act:['lifesap',0.5,0.4],anim:'nova',fx:{buff:1},buff:{dur:10,dmg:1.2,cd:0.75,crit:0,steal:0.2,el:'water'},desc:'For 10 seconds: 20% more damage, your basic attack is 25% faster, attacks without an element count as Water, and you heal for 20% of all the damage you deal.'},
  spore:{cls:'archer',slot:'skill',el:'air',drop:'boss',name:'Spore Arrow',cd:7,range:34,mult:0.8,price:0,lv:15,act:['spore',0.7,0.6],anim:'shoot',fx:{proj:{kind:'spore',speed:34,turn:8,life:1.4,zone:{r:3.5,dur:3,every:0.5,slow:1.5,k:0.4}}},desc:'An arrow that bursts into a spore cloud where it lands: everything inside is slowed and hurt for 3 seconds.'},
  bloom:{cls:'archer',slot:'burst',el:'dark',drop:'boss',name:'Black Bloom',cd:38,range:30,mult:0.4,price:0,lv:15,act:['bloom',0.8,0.6],anim:'volley',fx:{zone:{r:7,dur:4.5,every:0.35,kb:-3,slow:1}},desc:'Black thorns bloom over your target\'s area for 4.5 seconds: they pull everything within 7 m toward the middle and hurt it again and again.'},
  thorns:{cls:'mage',slot:'skill',el:'earth',drop:'boss',name:'Thorn Shards',cd:6,range:20,mult:0.5,price:0,lv:15,act:['thorns',0.55,0.5],anim:'cast',fx:{proj:{kind:'thorn',n:5,spread:0.12,speed:34,turn:0,life:0.6}},desc:'Fire 5 thorn shards in a fan. Each one hits the first enemy it meets.'},
  drain:{cls:'mage',slot:'burst',el:'dark',drop:'boss',name:'Heartwood Drain',cd:40,range:22,mult:1.1,price:0,lv:15,act:['drain',0.9,0.6],anim:'cast',fx:{beam:{len:22,w:1.4,hits:3,steal:0.35}},desc:'A beam of stolen life through every enemy in a 22 m line: 3 hits each, and you heal for 35% of the damage it deals.'},
  // Akaoni (level 20)
  cleave:{cls:'warrior',slot:'skill',el:'fire',drop:'akaoni',name:'Oni Cleave',cd:7,range:4.2,mult:0.9,price:0,lv:20,act:['cleave',0.6,0.45],anim:'slash',fx:{cone:{r:4.2,arc:1.3,hits:2,kb:3,burn:{dur:4,k:0.3}}},desc:'A flaming double swing in a wide arc: 2 hits, and it sets the enemies on fire (30% of the damage again every second for 4 seconds).'},
  kanabo:{cls:'warrior',slot:'burst',el:'earth',drop:'akaoni',name:'Kanabo Slam',cd:36,range:12,mult:3.6,price:0,lv:20,act:['kanabo',0.7,0.5],anim:'slash',fx:{dash:{ahead:8},ring:{r:6.5,kb:7,stun:1.5}},desc:'Leap up to 12 m to your target and slam the ground: huge damage within 6.5 m, knocked back and stunned for 1.5 seconds.'},
  ember:{cls:'archer',slot:'skill',el:'fire',drop:'akaoni',name:'Ember Shot',cd:6,range:36,mult:1.3,price:0,lv:20,act:['ember',0.65,0.6],anim:'shoot',fx:{proj:{kind:'ember',speed:44,turn:9,life:1.3,splash:{r:3,k:0.5},burn:{dur:4,k:0.25}}},desc:'A blazing arrow that explodes on impact: splash damage around the target, and everything it hits burns for 4 seconds.'},
  pyre:{cls:'archer',slot:'burst',el:'fire',drop:'akaoni',name:'Inferno Volley',cd:36,range:34,mult:0.9,price:0,lv:20,act:['pyre',0.8,0.6],anim:'volley',fx:{proj:{kind:'ember',n:5,spread:0.17,speed:40,turn:9,life:1.4,splash:{r:2.5,k:0.5}}},desc:'Loose 5 flaming arrows in a fan. Each one explodes where it lands.'},
  gale:{cls:'mage',slot:'skill',el:'air',drop:'akaoni',name:'Oni Gale',cd:6,range:10,mult:1,price:0,lv:20,act:['gale',0.6,0.5],anim:'nova',fx:{cone:{r:10,arc:0.9,kb:9,slow:2}},desc:'A roaring gust across a wide cone 10 m long: it hits hard, blows enemies back and slows them for 2 seconds.'},
  gate:{cls:'mage',slot:'burst',el:'dark',drop:'akaoni',name:'Demon Gate',cd:40,range:28,mult:4.2,price:0,lv:20,act:['gate',0.8,0.55],anim:'nova',fx:{zone:{r:8,dur:1.6,once:true,stun:2}},desc:'Open a demon gate over your target\'s area. It slams shut 1.6 seconds later: huge damage within 8 m and everything is stunned for 2 seconds.'},
  // Kyuubi (level 25)
  riposte:{cls:'warrior',slot:'skill',el:'light',drop:'kyuubi',name:'Foxfire Riposte',cd:6,range:3.6,mult:0.6,price:0,lv:25,act:['riposte',0.5,0.4],anim:'slash',fx:{cone:{r:3.6,arc:1.2,hits:3,kb:2}},desc:'Three quick strikes of foxfire in front of you.'},
  dawn:{cls:'warrior',slot:'burst',el:'light',drop:'kyuubi',name:'Dawn Guard',cd:42,range:0,mult:0,price:0,lv:25,act:['dawn',0.5,0.4],anim:'nova',fx:{buff:1},buff:{dur:8,dmg:1.15,cd:0.85,crit:0,red:0.4,regen:0.03,el:'light'},desc:'For 8 seconds: 40% less damage taken, you regain 3% health every second, 15% more damage, and attacks without an element count as Light.'},
  lance:{cls:'archer',slot:'skill',el:'light',drop:'kyuubi',name:'Radiant Lance',cd:7,range:45,mult:1.7,price:0,lv:25,act:['lance',0.7,0.65],anim:'shoot',fx:{beam:{len:40,w:1.2,hits:1}},desc:'A lance of light through every enemy in a 40 m line.'},
  spirits:{cls:'archer',slot:'burst',el:'light',drop:'kyuubi',name:'Fox Spirit Barrage',cd:40,range:34,mult:0.62,price:0,lv:25,act:['spirits',0.8,0.6],anim:'volley',fx:{proj:{kind:'spirit',n:7,spread:0.5,seek:true,speed:22,turn:9,life:1.9}},desc:'Send 7 fox spirits that seek out the enemies around you.'},
  spiritchain:{cls:'mage',slot:'skill',el:'light',drop:'kyuubi',name:'Spirit Chain',cd:6,range:26,mult:1,price:0,lv:25,act:['spiritchain',0.6,0.5],anim:'cast',fx:{chain:{n:7,fall:0.9,range:8}},desc:'Foxfire leaps from your target to 6 more enemies nearby, only 10% weaker with every jump.'},
  tempest:{cls:'mage',slot:'burst',el:'air',drop:'kyuubi',name:'Tempest',cd:38,range:0,mult:0.36,price:0,lv:25,act:['tempest',0.8,0.5],anim:'nova',fx:{zone:{r:6,dur:6,every:0.4,follow:true,kb:2.5,self:true}},desc:'A storm follows you for 6 seconds, hitting everything within 6 m again and again and pushing it away.'},
  // ---- Ymrik, the Rimeking (level 26, boss 'ymrik') ----
  rimecleave:{cls:'warrior',slot:'skill',el:'water',drop:'ymrik',name:'Rime Cleave',cd:7,range:4.4,mult:0.9,price:0,lv:26,act:['rimecleave',0.6,0.45],anim:'slash',fx:{cone:{r:4.4,arc:1.3,hits:2,kb:2,slow:2}},desc:'A frozen double swing in a wide arc: 2 hits, and it slows the enemies for 2 seconds.'},
  glacierslam:{cls:'warrior',slot:'burst',el:'dark',drop:'ymrik',name:'Glacier Slam',cd:36,range:12,mult:3.8,price:0,lv:26,act:['glacierslam',0.7,0.5],anim:'slash',fx:{dash:{ahead:8},ring:{r:6.5,kb:7,stun:1.5}},desc:'Leap up to 12 m to your target and bring a glacier down: huge damage within 6.5 m, knocked back and stunned for 1.5 seconds.'},
  frostshot:{cls:'archer',slot:'skill',el:'water',drop:'ymrik',name:'Frost Shot',cd:7,range:34,mult:0.8,price:0,lv:26,act:['frostshot',0.7,0.6],anim:'shoot',fx:{proj:{kind:'frost',speed:36,turn:8,life:1.4,zone:{r:3.5,dur:3,every:0.5,slow:1.5,k:0.4}}},desc:'An arrow of ice that bursts into a freezing mist where it lands: everything inside is slowed and hurt for 3 seconds.'},
  shardhail:{cls:'archer',slot:'burst',el:'air',drop:'ymrik',name:'Hail of Shards',cd:36,range:32,mult:0.85,price:0,lv:26,act:['shardhail',0.8,0.6],anim:'volley',fx:{proj:{kind:'frost',n:6,spread:0.24,speed:40,turn:9,life:1.4,splash:{r:2.5,k:0.5}}},desc:'Loose 6 shards of ice in a fan. Each one bursts where it lands.'},
  icelance:{cls:'mage',slot:'skill',el:'water',drop:'ymrik',name:'Ice Lance',cd:7,range:28,mult:1.0,price:0,lv:26,act:['icelance',0.7,0.6],anim:'cast',fx:{beam:{len:28,w:1.2,hits:2}},desc:'A lance of ice through every enemy in a 28 m line: 2 hits each.'},
  whiteout:{cls:'mage',slot:'burst',el:'air',drop:'ymrik',name:'Whiteout',cd:40,range:24,mult:0.4,price:0,lv:26,act:['whiteout',0.8,0.6],anim:'cast',fx:{zone:{r:7,dur:5,every:0.4,kb:-2,slow:2}},desc:'A blinding snow over your target\'s area for 5 seconds: it pulls everything within 7 m toward the middle, slows it and hurts it again and again.'},
  // ---- Vetrmaw, the Frost Wyrm (level 30, boss 'vetrmaw') ----
  wyrmfang:{cls:'warrior',slot:'skill',el:'dark',drop:'vetrmaw',name:'Wyrmfang',cd:7,range:4.6,mult:0.85,price:0,lv:30,act:['wyrmfang',0.6,0.45],anim:'slash',fx:{cone:{r:4.6,arc:1.4,hits:3,kb:2}},desc:'Three snapping strikes of frost in a wide arc in front of you.'},
  wyrmhide:{cls:'warrior',slot:'burst',el:'water',drop:'vetrmaw',name:'Wyrm\'s Hide',cd:42,range:0,mult:0,price:0,lv:30,act:['wyrmhide',0.5,0.4],anim:'nova',fx:{buff:1},buff:{dur:9,dmg:1.25,cd:0.8,crit:0.1,red:0.3,regen:0.02,el:'water'},desc:'For 9 seconds: 30% less damage taken, you regain 2% health every second, 25% more damage, your abilities recover 20% faster, and attacks without an element count as Water.'},
  frostbite:{cls:'archer',slot:'skill',el:'water',drop:'vetrmaw',name:'Frostbite Arrow',cd:7,range:40,mult:1.5,price:0,lv:30,act:['frostbite',0.7,0.65],anim:'shoot',fx:{proj:{kind:'frost',speed:46,turn:10,life:1.4,splash:{r:3.2,k:0.6}}},desc:'A biting arrow of ice that bursts on impact: splash damage around the target.'},
  blizzardvolley:{cls:'archer',slot:'burst',el:'air',drop:'vetrmaw',name:'Blizzard Volley',cd:40,range:34,mult:0.45,price:0,lv:30,act:['blizzardvolley',0.8,0.6],anim:'volley',fx:{zone:{r:8,dur:5,every:0.3,slow:1.5}},desc:'A blizzard of arrows over your target\'s area for 5 seconds: everything within 8 m is hurt again and again, and slowed.'},
  frostchain:{cls:'mage',slot:'skill',el:'dark',drop:'vetrmaw',name:'Frost Chain',cd:6,range:26,mult:1.05,price:0,lv:30,act:['frostchain',0.6,0.5],anim:'cast',fx:{chain:{n:7,fall:0.9,range:8}},desc:'Cold leaps from your target to 6 more enemies nearby, only 10% weaker with every jump.'},
  wyrmstorm:{cls:'mage',slot:'burst',el:'air',drop:'vetrmaw',name:'Wyrmstorm',cd:38,range:0,mult:0.38,price:0,lv:30,act:['wyrmstorm',0.8,0.5],anim:'nova',fx:{zone:{r:6.5,dur:6,every:0.4,follow:true,kb:2.5,self:true}},desc:'A storm of wyrm-wind follows you for 6 seconds, hitting everything within 6.5 m again and again and pushing it away.'},
};
const SKILL_IDS=Object.keys(SKILLS);
/* ===================== PASSIVES =====================
   Class-universal: one loadout of PASSIVE_SLOTS for every class, opened at level PASSIVE_LV (only the first PASSIVE_OPEN slots can be used for now,
   the others are locked and unlock later: raise PASSIVE_OPEN). They are learned from the trainers like the
   other skills (the first, Vitality, is free) and upgraded the same way. stat = what the server reads through passiveSum(); v = [value at
   skill level 1, added per level after that]. Stats: hp (max health), dmg (all damage), crit (crit chance), red (damage taken), cd (cooldowns),
   drop (chance of monster drops), xp (XP from kills), soul (added to the soul element's x1.5). These are a first set: swap or add rows freely,
   nothing else needs to change (name, lv, price, stat, v, text with {} for the percent). */
const PASSIVE_LV=18, PASSIVE_SLOTS=3, PASSIVE_OPEN=1;
const PASSIVES={
  vitality:  {name:'Vitality',  lv:18,price:0,   stat:'hp',  v:[0.06,0.02], text:'+{}% maximum health'},
  ferocity:  {name:'Ferocity',  lv:18,price:1500,stat:'dmg', v:[0.05,0.02], text:'+{}% damage with every attack'},
  precision: {name:'Precision', lv:19,price:2000,stat:'crit',v:[0.04,0.015],text:'+{}% critical hit chance'},
  ironwill:  {name:'Iron Will', lv:20,price:2500,stat:'red', v:[0.05,0.015],text:'{}% less damage taken'},
  quickhands:{name:'Quickhands',lv:21,price:3000,stat:'cd',  v:[0.06,0.02], text:'{}% shorter cooldowns'},
  scavenger: {name:'Scavenger', lv:22,price:3500,stat:'drop',v:[0.15,0.05], text:'+{}% chance of monster drops'},
  scholar:   {name:'Scholar',   lv:23,price:4000,stat:'xp',  v:[0.05,0.02], text:'+{}% XP from kills'},
  resonance: {name:'Resonance', lv:24,price:4500,stat:'soul',v:[0.05,0.03], text:'soul element skills deal +{}% more damage'}
};
const PASSIVE_IDS=Object.keys(PASSIVES);
for(const id of PASSIVE_IDS){ const P=PASSIVES[id]; P.id=id; P.slot='passive'; P.cls=null; P.el=null; }
const skillDef=id=>SKILLS[id]||PASSIVES[id]||null;   // an attack skill or a passive
/* Skill levels: every skill and passive can be upgraded from level 1 to SKILL_MAX_LV with coins and monster drops (drops.js).
   An attack skill deals skillPower(level) x its damage (a buff's bonus grows the same way, and lasts 0.5 s longer per level)
   and has a cooldown of skillCdMult(level) x. A passive's value grows by its per-level step. */
const SKILL_MAX_LV=5;
const skillLvOf=(skills,id)=>Math.max(1,Math.min(SKILL_MAX_LV,((skills&&skills.lv&&skills.lv[id])|0)||1));
const skillPower=L=>1+0.12*(L-1), skillCdMult=L=>1-0.03*(L-1);
const passiveValue=(id,L)=>PASSIVES[id].v[0]+PASSIVES[id].v[1]*(L-1);
const pctText=v=>+(v*100).toFixed(1);
const passiveText=(id,L)=>PASSIVES[id].text.replace('{}',pctText(passiveValue(id,L)));
// the total of one passive stat from a loadout (0 before level PASSIVE_LV)
function passiveSum(skills,level,stat){
  if(level<PASSIVE_LV||!skills||!Array.isArray(skills.pass)) return 0;
  let t=0; for(const id of skills.pass.slice(0,PASSIVE_OPEN)){ const P=PASSIVES[id]; if(P&&P.stat===stat&&skills.owned.includes(id)&&level>=P.lv) t+=passiveValue(id,skillLvOf(skills,id)); }
  return t;
}
const ANIM_OF={}; for(const id in SKILLS){ const s=SKILLS[id]; s.id=id; ANIM_OF[s.act[0]]=s.anim||s.act[0]; }
const DEFAULT_OF={};   // DEFAULT_OF[cls][slot] = the free ability of that slot
for(const id in SKILLS){ const s=SKILLS[id]; if(!s.price&&!s.drop){ (DEFAULT_OF[s.cls]=DEFAULT_OF[s.cls]||{})[s.slot]=id; } }
const ACT_SKILL={}; for(const id in SKILLS){ ACT_SKILL[SKILLS[id].act[0]]=SKILLS[id]; }   // the skill behind an attack kind (every skill has its own kind): the client draws generic fx from it
const slotLv=slot=>slot==='burst'?BURST_SLOT_LV:slot==='skill'?SKILL_SLOT_LV:1;
// lv: skill / passive levels above 1 ({id:level}); pass: the passive loadout (PASSIVE_SLOTS ids or null)
const newSkills=()=>({owned:SKILL_IDS.filter(id=>!SKILLS[id].price&&!SKILLS[id].drop),eq:{warrior:{basic:null,skill:null,burst:null},archer:{basic:null,skill:null,burst:null},mage:{basic:null,skill:null,burst:null}},lv:{},pass:new Array(PASSIVE_SLOTS).fill(null)});
// only the mage chooses a basic attack; everyone else always has their class's
const canSwap=(cls,slot)=>slot!=='basic'||cls==='mage';
// the ability behind a slot for a class and a loadout (null if that slot can't be used yet or is empty)
function abilityOf(cls,slot,skills,level){
  if(level<slotLv(slot)) return null;
  if(slot==='basic'){ const id=skills&&skills.eq&&skills.eq[cls]&&skills.eq[cls].basic; const s=SKILLS[id]; return s&&s.cls===cls&&s.slot==='basic'&&skills.owned.includes(id)?s:SKILLS[DEFAULT_OF[cls].basic]; }
  const id=skills&&skills.eq&&skills.eq[cls]&&skills.eq[cls][slot]; const s=SKILLS[id];
  return s&&s.cls===cls&&s.slot===slot&&skills.owned.includes(id)&&level>=s.lv?s:null;
}
// seconds until an ability can be used again: its own cooldown, shorter with skill level and the Quickhands passive
function abilityCd(ab,skills,level){ return ab.cd*skillCdMult(skillLvOf(skills,ab.id))*(1-Math.min(0.6,passiveSum(skills,level,'cd'))); }
