//@ Classes (CLASSES), basic attacks (ACTS), equippable skills with elements (SKILLS, abilityOf), skill levels, class-universal passives (PASSIVES). Pure.
/* ===================== COMBAT =====================
   Three classes, each with a basic attack; skills are equipped separately (below). */
const CLASSES={
  warrior:{name:'Warrior',basic:{name:'Slash',cd:0.7,range:3,mult:1},
           desc:'Sword and shield. Slash hits everything in a wide arc in front of you. Skills: Whirlwind, Shield Bash, Charge.'},
  archer: {name:'Archer', basic:{name:'Shoot',cd:0.75,range:32,mult:1.2},
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
   fx = what a skill with generic effects does (resolveFxS, server/combat.js). (The 96 boss skills, rows with drop:'<boss id>', were removed in the skill revamp: server/save-mig.js refunds them.) */
const SKILL_SLOT_LV=2, BURST_SLOT_LV=8, SLOTS=['basic','skill','burst'];   // (the plan says skill 3 and power 10, but the main quest teaches the skill at level 2: P5 uses it; left at 2 / 8 until the quest is re-gated)
const SKILLS={
  // ---- basic attacks ----
  slash:{cls:'warrior',slot:'basic',name:'Slash',cd:0.7,range:3,mult:1,price:0,lv:1,act:['slash',0.5,0.45],desc:'Hit everything in a wide arc in front of you.'},
  shoot:{cls:'archer',slot:'basic',name:'Shoot',cd:0.75,range:32,mult:1.2,price:0,lv:1,act:['shoot',0.55,0.6],desc:'A homing arrow at your target, from far away.'},
  firebolt:{cls:'mage',slot:'basic',el:'fire',name:'Firebolt',cd:1.1,range:26,mult:1.3,price:0,lv:1,act:['cast',0.6,0.5],desc:'A ball of fire that bursts on impact and singes nearby foes.'},
  iceshard:{cls:'mage',slot:'basic',el:'water',name:'Ice Shard',cd:0.7,range:28,mult:0.8,price:250,lv:4,act:['shard',0.42,0.5],anim:'cast',desc:'A fast shard of ice. Quicker than Firebolt, no splash, and it slows what it hits.'},
  missiles:{cls:'mage',slot:'basic',el:'dark',name:'Arcane Missiles',cd:1.5,range:26,mult:0.6,price:900,lv:8,act:['missiles',0.65,0.5],anim:'cast',desc:'Three homing missiles that spread over the enemies around your target.'},
  // ---- skills (level 3) ----
  whirlwind:{cls:'warrior',slot:'skill',el:'air',name:'Whirlwind',cd:6,range:3.4,mult:0.9,price:0,lv:2,act:['spin',0.7,0.45],desc:'Spin and strike every enemy around you.'},
  bash:{cls:'warrior',slot:'skill',el:'light',name:'Shield Bash',cd:7,range:3.2,mult:1.6,price:180,lv:3,act:['bash',0.55,0.5],anim:'slash',desc:'Slam your shield into the enemies in front of you: heavy damage, and they are stunned for 2 seconds.'},
  charge:{cls:'warrior',slot:'skill',el:'fire',name:'Charge',cd:9,range:14,mult:1.4,price:650,lv:6,act:['charge',0.6,0.45],anim:'slash',desc:'Dash up to 14 m to your target and crash down, hitting and knocking back everything where you land.'},
  volley:{cls:'archer',slot:'skill',el:'air',name:'Volley',cd:5,range:32,mult:0.6,price:0,lv:2,act:['volley',0.7,0.6],desc:'Loose three homing arrows in a fan.'},
  pierce:{cls:'archer',slot:'skill',el:'earth',name:'Piercing Shot',cd:6,range:34,mult:1.8,price:180,lv:3,act:['pierce',0.75,0.7],anim:'shoot',desc:'A heavy arrow that flies straight through every enemy in its path.'},
  rain:{cls:'archer',slot:'skill',el:'water',name:'Arrow Rain',cd:11,range:30,mult:0.45,price:650,lv:6,act:['rain',0.7,0.6],anim:'volley',desc:'A storm of arrows on your target\'s area: 5 waves over 2.5 seconds hit everything inside.'},
  frostnova:{cls:'mage',slot:'skill',el:'water',name:'Frost Nova',cd:7,range:5.5,mult:0.8,price:0,lv:2,act:['nova',0.7,0.5],desc:'Blast everything around you with ice and slow it down.'},
  chain:{cls:'mage',slot:'skill',el:'air',name:'Chain Lightning',cd:6,range:26,mult:1.2,price:180,lv:3,act:['chain',0.6,0.5],anim:'cast',desc:'Lightning strikes your target and jumps to 4 more enemies nearby, a little weaker each jump.'},
  meteor:{cls:'mage',slot:'skill',el:'earth',name:'Meteor',cd:12,range:28,mult:2.4,price:650,lv:6,act:['meteor',0.8,0.55],anim:'nova',desc:'Call a meteor down on your target\'s area. It lands 1.2 seconds later, crushing and knocking back everything there.'},
  // ---- bursts (level 10) ----
  quake:{cls:'warrior',slot:'burst',el:'earth',name:'Earthshatter',cd:35,range:7,mult:3,price:0,lv:8,act:['quake',0.9,0.6],anim:'nova',desc:'Smash the ground: huge damage to everything within 7 m, knocked back and stunned for 1.5 seconds.'},
  bladestorm:{cls:'warrior',slot:'burst',el:'dark',name:'Blade Storm',cd:38,range:3.8,mult:0.7,price:2000,lv:12,act:['bladestorm',0.4,0.3],anim:'spin',desc:'Become a whirl of steel for 4 seconds: every enemy near you is hit 10 times, and you can keep moving.'},
  berserk:{cls:'warrior',slot:'burst',name:'Berserk',cd:40,range:0,mult:0,price:4000,lv:14,act:['berserk',0.5,0.4],anim:'nova',buff:{dur:10,dmg:1.5,cd:0.6,crit:0},desc:'For 10 seconds: 50% more damage, and your basic attack is 40% faster.'},
  hail:{cls:'archer',slot:'burst',el:'dark',name:'Hail of Arrows',cd:38,range:32,mult:0.5,price:0,lv:8,act:['hail',0.8,0.6],anim:'volley',desc:'A huge storm of arrows on your target\'s area: 8 waves over 4 seconds on everything within 7 m.'},
  snipe:{cls:'archer',slot:'burst',el:'light',name:'Sniper Shot',cd:30,range:45,mult:6.5,price:2000,lv:12,act:['snipe',1.3,0.8],anim:'shoot',desc:'Take careful aim, then one devastating arrow at your target from up to 45 m.'},
  focus:{cls:'archer',slot:'burst',name:"Hunter's Focus",cd:40,range:0,mult:0,price:4000,lv:14,act:['focus',0.5,0.4],anim:'shoot',buff:{dur:10,dmg:1.15,cd:0.5,crit:0.35},desc:'For 10 seconds: shoot twice as fast, 35% more critical hits and 15% more damage.'},
  blizzard:{cls:'mage',slot:'burst',el:'water',name:'Blizzard',cd:40,range:30,mult:0.42,price:0,lv:8,act:['blizzard',0.8,0.6],anim:'nova',desc:'A blizzard on your target\'s area for 5 seconds: 10 waves of ice on everything within 8 m, and it slows them.'},
  inferno:{cls:'mage',slot:'burst',el:'fire',name:'Inferno',cd:35,range:7,mult:3.4,price:2000,lv:12,act:['inferno',0.9,0.6],anim:'nova',desc:'Explode in a ring of fire: huge damage to everything within 7 m of you, knocked back.'},
  surge:{cls:'mage',slot:'burst',name:'Arcane Surge',cd:45,range:0,mult:0,price:4000,lv:14,act:['surge',0.5,0.4],anim:'cast',buff:{dur:10,dmg:1.4,cd:0.7,crit:0,reset:true},desc:'Your skill is ready again at once, and for 10 seconds you deal 40% more damage and cast 30% faster.'},
};
const SKILL_IDS=Object.keys(SKILLS);
/* ===================== PASSIVES =====================
   Class-universal: one loadout of PASSIVE_SLOTS (one slot) for every class, opened at level PASSIVE_LV (10)
   (PASSIVE_SLOT_LV; passiveOpen(level) counts the slots a level has). They are learned from the trainers like the
   other skills (the first, Vitality, is free) and upgraded the same way. stat = what the server reads through passiveSum(); v = [value at
   skill level 1, added per level after that]. Stats: hp (max health), dmg (all damage), crit (crit chance), red (damage taken), cd (cooldowns),
   drop (chance of monster drops), xp (XP from kills), move (movement speed; read by the client's updatePlayer). These are a first set: swap or add rows freely,
   nothing else needs to change (name, lv, price, stat, v, text with {} for the percent). */
const PASSIVE_LV=10, PASSIVE_SLOT_LV=[PASSIVE_LV], PASSIVE_SLOTS=PASSIVE_SLOT_LV.length;   // ONE passive slot (skill revamp: the others became Bond rows); an old save's extra passives stay owned but leave the loadout (sanitizeSkills)
const passiveOpen=level=>PASSIVE_SLOT_LV.filter(l=>level>=l).length;   // how many passive slots a level can use (slot i opens at PASSIVE_SLOT_LV[i])
const PASSIVES={
  vitality:  {name:'Vitality',  lv:10,price:0,   stat:'hp',  v:[0.06,0.02], text:'+{}% maximum health'},
  ferocity:  {name:'Ferocity',  lv:10,price:1500,stat:'dmg', v:[0.05,0.02], text:'+{}% damage with every attack'},
  precision: {name:'Precision', lv:10,price:2000,stat:'crit',v:[0.04,0.015],text:'+{}% critical hit chance'},
  ironwill:  {name:'Iron Will', lv:10,price:2500,stat:'red', v:[0.05,0.015],text:'{}% less damage taken'},
  quickhands:{name:'Quickhands',lv:10,price:3000,stat:'cd',  v:[0.06,0.02], text:'{}% shorter cooldowns'},
  scavenger: {name:'Scavenger', lv:10,price:3500,stat:'drop',v:[0.15,0.05], text:'+{}% chance of monster drops'},
  scholar:   {name:'Scholar',   lv:10,price:4000,stat:'xp',  v:[0.05,0.02], text:'+{}% XP from kills'},
  fleetfoot: {name:'Fleetfoot', lv:10,price:2000,stat:'move',v:[0.08,0.02], text:'+{}% movement speed'}
};
const PASSIVE_IDS=Object.keys(PASSIVES);
for(const id of PASSIVE_IDS){ const P=PASSIVES[id]; P.id=id; P.slot='passive'; P.cls=null; P.el=null; }
const skillDef=id=>SKILLS[id]||PASSIVES[id]||null;   // an attack skill or a passive
/* Skill levels: every skill and passive can be upgraded from level 1 to SKILL_MAX_LV with coins and monster drops (drops.js).
   Every number scales by its curve in shared/awakening.js (awkCurve; skills revamp step 7): an attack skill deals skillPower(level) x its damage
   (x1.17 a level), a buff's bonus grows +6% and lasts +3% a level, the fx numbers through awkFx, the cooldown is skillCdMult(level) x.
   A passive's value is v[0] x (1 + 8% a level); the old per-level step v[1] is no longer read. */
const SKILL_MAX_LV=10, SKILL_OLD_MAX_LV=5;   // awakening: the tree's top (AWK_TOP); the old upgrade path's top: a saved level above it is never trusted (the tree gives the rest, server/awakening.js awkSyncG)
const skillLvOf=(skills,id)=>bdLvAdj(skills,id,Math.max(1,Math.min(SKILL_MAX_LV,((skills&&skills.lv&&skills.lv[id])|0)||1)));   // bond: the active Bond's level change (III / V +1, a guest piece -2; shared/bond.js)
const skillPower=L=>awkCurve('dmg',L), skillCdMult=L=>awkCurve('cd',L);   // awakening: the damage and cooldown curves
const passiveValue=(id,L)=>PASSIVES[id].v[0]*awkCurve('pass',L);   // awakening: +8% of the level-1 value a level
const pctText=v=>+(v*100).toFixed(1);
const passiveText=(id,L)=>PASSIVES[id].text.replace('{}',pctText(passiveValue(id,L)));
// the total of one passive stat from a loadout (0 before level PASSIVE_LV; a slot the level has not opened yet does nothing); cls: the class whose loadout counts the set bonuses (none: no bonuses)
function passiveSum(skills,level,stat,cls,boost){   // boost: {passive id: x} a burst's v boost (ult), on the benefit only
  let t=ssBonusSum(skills,level,stat,cls)+(skills&&skills.aw&&typeof skills.aw[stat]==='number'?skills.aw[stat]:0);   // awakening: the stat nodes of the character played (gear.skills.aw, server/awakening.js awkStatsP)   // skillsets: the 3- / 5-set bonuses in force (none while SS_BONUS_ON is false)
  { const X=skills&&skills.bdx&&skills.bdx.p; if(X) for(const id of Object.keys(X)){ const P=bdOwnKey(PASSIVES,id)?PASSIVES[id]:null; if(!P) continue; if(P.stat===stat&&!P.when) t+=passiveValue(id,X[id])*BD_ROW_K;   /* bond: at BD_ROW_K strength */ if(P.cost&&P.cost.stat===stat&&!P.cost.when) t+=P.cost.v; } }   // bond: the Bond I / IV passives work unequipped (gear.skills.bdx.p, server/bond.js)
  if(level<PASSIVE_LV||!skills||!Array.isArray(skills.pass)) return t;
  for(const id of skills.pass.slice(0,passiveOpen(level))){ const P=PASSIVES[id]; if(!P||!skills.owned.includes(id)||level<P.lv||(P.wd&&!wdMainOk(skills))) continue; if(P.stat===stat&&!P.when) t+=passiveValue(id,skillLvOf(skills,id))*(boost&&boost[id]||1); if(P.cost&&P.cost.stat===stat&&!P.cost.when) t+=P.cost.v; }   // skillsets: a row may pay a cost; a row with a `when` is read by ssCondP (server/skillsets.js)
  return t;
}
const ANIM_OF={}; for(const id in SKILLS){ const s=SKILLS[id]; s.id=id; ANIM_OF[s.act[0]]=s.anim||s.act[0]; }
const DEFAULT_OF={};   // DEFAULT_OF[cls][slot] = the free ability of that slot
for(const id in SKILLS){ const s=SKILLS[id]; if(!s.price){ (DEFAULT_OF[s.cls]=DEFAULT_OF[s.cls]||{})[s.slot]=id; } }
const ACT_SKILL={}; for(const id in SKILLS){ ACT_SKILL[SKILLS[id].act[0]]=SKILLS[id]; }   // the skill behind an attack kind (every skill has its own kind): the client draws generic fx from it
const slotLv=slot=>slot==='burst'?BURST_SLOT_LV:slot==='skill'?SKILL_SLOT_LV:slot==='cave'?CAVE_SLOT_LV:slot==='ult'?ULT_LV:1;   // cave: the 4th slot (shared/cave.js; it is not in SLOTS)
// lv: skill / passive levels above 1 ({id:level}); pass: the passive loadout (PASSIVE_SLOTS ids or null)
const newSkills=()=>({owned:SKILL_IDS.filter(id=>!SKILLS[id].price&&!SKILLS[id].set),eq:{warrior:{basic:null,skill:null,burst:null},archer:{basic:null,skill:null,burst:null},mage:{basic:null,skill:null,burst:null}},lv:{},pass:new Array(PASSIVE_SLOTS).fill(null),cave:null,ult:null,mov:null});   // ult: the worn burst's set id (the 5th slot, shared/ult.js); cave: the worn cave skill (the 4th slot, shared/cave.js)
// only the mage chooses a basic attack; everyone else always has their class's
const canSwap=(cls,slot,skills)=>slot!=='basic'||cls==='mage'||ssOwnsBasic(skills,cls);   // skillsets: a class that owns a slot-1 piece may change its basic attack too
// the ability behind a slot for a class and a loadout (null if that slot can't be used yet or is empty)
function abilityOf(cls,slot,skills,level){
  if(level<slotLv(slot)) return null;
  if(slot==='basic'){ const id=skills&&skills.eq&&skills.eq[cls]&&skills.eq[cls].basic; const s=SKILLS[id]; return s&&s.cls===cls&&s.slot==='basic'&&skills.owned.includes(id)?s:SKILLS[DEFAULT_OF[cls].basic]; }
  const id=skills&&skills.eq&&skills.eq[cls]&&skills.eq[cls][slot]; const s=SKILLS[id];
  return s&&(s.cls===cls||s.cls==='any')&&s.slot===slot&&skills.owned.includes(id)&&level>=s.lv?s:null;   // skillsets: cls 'any' is a skill every class can wear
}
// seconds until an ability can be used again: its own cooldown, shorter with skill level and the Quickhands passive
function abilityCd(ab,skills,level,cls,extra){ return ab.cd*skillCdMult(skillLvOf(skills,ab.id))*(1-Math.max(-1,Math.min(0.6,passiveSum(skills,level,'cd',cls||(ab.cls==='any'?undefined:ab.cls))+(extra||0)))); }   // rolls: extra = the cooldown reduction of rolled gear (at most 40% by itself, 60% with the passives, as before)   // skillsets: the class the bonuses are read for (a cost makes it longer)
