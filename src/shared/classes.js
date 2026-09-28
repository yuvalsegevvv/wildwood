//@ Classes (CLASSES), basic attacks (ACTS), equippable skills (SKILLS, abilityOf). Pure.
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
   buff = a timed boost instead of a hit: {dur, dmg (damage x), cd (basic cooldown x), crit (+chance)}. */
const SKILL_SLOT_LV=3, BURST_SLOT_LV=10, SLOTS=['basic','skill','burst'];
const SKILLS={
  // ---- basic attacks ----
  slash:{cls:'warrior',slot:'basic',name:'Slash',cd:0.7,range:3,mult:1,price:0,lv:1,act:['slash',0.5,0.45],desc:'Hit everything in a wide arc in front of you.'},
  shoot:{cls:'archer',slot:'basic',name:'Shoot',cd:0.8,range:32,mult:0.9,price:0,lv:1,act:['shoot',0.55,0.6],desc:'A homing arrow at your target, from far away.'},
  firebolt:{cls:'mage',slot:'basic',name:'Firebolt',cd:1.1,range:26,mult:1.3,price:0,lv:1,act:['cast',0.6,0.5],desc:'A ball of fire that bursts on impact and singes nearby foes.'},
  iceshard:{cls:'mage',slot:'basic',name:'Ice Shard',cd:0.7,range:28,mult:0.8,price:250,lv:4,act:['shard',0.42,0.5],anim:'cast',desc:'A fast shard of ice. Quicker than Firebolt, no splash, and it slows what it hits.'},
  missiles:{cls:'mage',slot:'basic',name:'Arcane Missiles',cd:1.5,range:26,mult:0.6,price:900,lv:8,act:['missiles',0.65,0.5],anim:'cast',desc:'Three homing missiles that spread over the enemies around your target.'},
  // ---- skills (level 3) ----
  whirlwind:{cls:'warrior',slot:'skill',name:'Whirlwind',cd:6,range:3.4,mult:0.9,price:0,lv:3,act:['spin',0.7,0.45],desc:'Spin and strike every enemy around you.'},
  bash:{cls:'warrior',slot:'skill',name:'Shield Bash',cd:7,range:3.2,mult:1.6,price:180,lv:3,act:['bash',0.55,0.5],anim:'slash',desc:'Slam your shield into the enemies in front of you: heavy damage, and they are stunned for 2 seconds.'},
  charge:{cls:'warrior',slot:'skill',name:'Charge',cd:9,range:14,mult:1.4,price:650,lv:6,act:['charge',0.6,0.45],anim:'slash',desc:'Dash up to 14 m to your target and crash down, hitting and knocking back everything where you land.'},
  volley:{cls:'archer',slot:'skill',name:'Volley',cd:5,range:32,mult:0.6,price:0,lv:3,act:['volley',0.7,0.6],desc:'Loose three homing arrows in a fan.'},
  pierce:{cls:'archer',slot:'skill',name:'Piercing Shot',cd:6,range:34,mult:1.8,price:180,lv:3,act:['pierce',0.75,0.7],anim:'shoot',desc:'A heavy arrow that flies straight through every enemy in its path.'},
  rain:{cls:'archer',slot:'skill',name:'Arrow Rain',cd:11,range:30,mult:0.45,price:650,lv:6,act:['rain',0.7,0.6],anim:'volley',desc:'A storm of arrows on your target\'s area: 5 waves over 2.5 seconds hit everything inside.'},
  frostnova:{cls:'mage',slot:'skill',name:'Frost Nova',cd:7,range:5.5,mult:0.8,price:0,lv:3,act:['nova',0.7,0.5],desc:'Blast everything around you with ice and slow it down.'},
  chain:{cls:'mage',slot:'skill',name:'Chain Lightning',cd:6,range:26,mult:1.2,price:180,lv:3,act:['chain',0.6,0.5],anim:'cast',desc:'Lightning strikes your target and jumps to 4 more enemies nearby, a little weaker each jump.'},
  meteor:{cls:'mage',slot:'skill',name:'Meteor',cd:12,range:28,mult:2.4,price:650,lv:6,act:['meteor',0.8,0.55],anim:'nova',desc:'Call a meteor down on your target\'s area. It lands 1.2 seconds later, crushing and knocking back everything there.'},
  // ---- bursts (level 10) ----
  quake:{cls:'warrior',slot:'burst',name:'Earthshatter',cd:35,range:7,mult:3,price:0,lv:10,act:['quake',0.9,0.6],anim:'nova',desc:'Smash the ground: huge damage to everything within 7 m, knocked back and stunned for 1.5 seconds.'},
  bladestorm:{cls:'warrior',slot:'burst',name:'Blade Storm',cd:38,range:3.8,mult:0.7,price:2000,lv:12,act:['bladestorm',0.4,0.3],anim:'spin',desc:'Become a whirl of steel for 4 seconds: every enemy near you is hit 10 times, and you can keep moving.'},
  berserk:{cls:'warrior',slot:'burst',name:'Berserk',cd:40,range:0,mult:0,price:4000,lv:14,act:['berserk',0.5,0.4],anim:'nova',buff:{dur:10,dmg:1.5,cd:0.6,crit:0},desc:'For 10 seconds: 50% more damage, and your basic attack is 40% faster.'},
  hail:{cls:'archer',slot:'burst',name:'Hail of Arrows',cd:38,range:32,mult:0.5,price:0,lv:10,act:['hail',0.8,0.6],anim:'volley',desc:'A huge storm of arrows on your target\'s area: 8 waves over 4 seconds on everything within 7 m.'},
  snipe:{cls:'archer',slot:'burst',name:'Sniper Shot',cd:30,range:45,mult:6.5,price:2000,lv:12,act:['snipe',1.3,0.8],anim:'shoot',desc:'Take careful aim, then one devastating arrow at your target from up to 45 m.'},
  focus:{cls:'archer',slot:'burst',name:"Hunter's Focus",cd:40,range:0,mult:0,price:4000,lv:14,act:['focus',0.5,0.4],anim:'shoot',buff:{dur:10,dmg:1.15,cd:0.5,crit:0.35},desc:'For 10 seconds: shoot twice as fast, 35% more critical hits and 15% more damage.'},
  blizzard:{cls:'mage',slot:'burst',name:'Blizzard',cd:40,range:30,mult:0.42,price:0,lv:10,act:['blizzard',0.8,0.6],anim:'nova',desc:'A blizzard on your target\'s area for 5 seconds: 10 waves of ice on everything within 8 m, and it slows them.'},
  inferno:{cls:'mage',slot:'burst',name:'Inferno',cd:35,range:7,mult:3.4,price:2000,lv:12,act:['inferno',0.9,0.6],anim:'nova',desc:'Explode in a ring of fire: huge damage to everything within 7 m of you, knocked back.'},
  surge:{cls:'mage',slot:'burst',name:'Arcane Surge',cd:45,range:0,mult:0,price:4000,lv:14,act:['surge',0.5,0.4],anim:'cast',buff:{dur:10,dmg:1.4,cd:0.7,crit:0,reset:true},desc:'Your skill is ready again at once, and for 10 seconds you deal 40% more damage and cast 30% faster.'}
};
const SKILL_IDS=Object.keys(SKILLS);
const ANIM_OF={}; for(const id in SKILLS){ const s=SKILLS[id]; s.id=id; ANIM_OF[s.act[0]]=s.anim||s.act[0]; }
const DEFAULT_OF={};   // DEFAULT_OF[cls][slot] = the free ability of that slot
for(const id in SKILLS){ const s=SKILLS[id]; if(!s.price){ (DEFAULT_OF[s.cls]=DEFAULT_OF[s.cls]||{})[s.slot]=id; } }
const FREE_SKILL={warrior:'whirlwind',archer:'volley',mage:'frostnova'};
const slotLv=slot=>slot==='burst'?BURST_SLOT_LV:slot==='skill'?SKILL_SLOT_LV:1;
const newSkills=()=>({owned:SKILL_IDS.filter(id=>!SKILLS[id].price),eq:{warrior:{basic:null,skill:null,burst:null},archer:{basic:null,skill:null,burst:null},mage:{basic:null,skill:null,burst:null}}});
// only the mage chooses a basic attack; everyone else always has their class's
const canSwap=(cls,slot)=>slot!=='basic'||cls==='mage';
// the ability behind a slot for a class and a loadout (null if that slot can't be used yet or is empty)
function abilityOf(cls,slot,skills,level){
  if(level<slotLv(slot)) return null;
  if(slot==='basic'){ const id=skills&&skills.eq&&skills.eq[cls]&&skills.eq[cls].basic; const s=SKILLS[id]; return s&&s.cls===cls&&s.slot==='basic'&&skills.owned.includes(id)?s:SKILLS[DEFAULT_OF[cls].basic]; }
  const id=skills&&skills.eq&&skills.eq[cls]&&skills.eq[cls][slot]; const s=SKILLS[id];
  return s&&s.cls===cls&&s.slot===slot&&skills.owned.includes(id)&&level>=s.lv?s:null;
}
