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
   Slot 1 is your class's basic attack. Slot 2 (a skill) opens at level SKILL_SLOT_LV; only an equipped skill can be
   used. Each class has 3 skills: the first is free, the other two are taught by Aldric, the trainer at the well.
   Slot 3 (a burst skill) opens at level BURST_SLOT_LV: not in the game yet.
   act = [what happens, seconds, when in the swing it lands]; anim = which body animation it borrows. */
const SKILL_SLOT_LV=3, BURST_SLOT_LV=10;
const SKILLS={
  whirlwind:{cls:'warrior',name:'Whirlwind',cd:6,range:3.4,mult:0.9,price:0,lv:3,act:['spin',0.7,0.45],
    desc:'Spin and strike every enemy around you.'},
  bash:{cls:'warrior',name:'Shield Bash',cd:7,range:3.2,mult:1.6,price:180,lv:3,act:['bash',0.55,0.5],anim:'slash',
    desc:'Slam your shield into the enemies in front of you: heavy damage, and they are stunned for 2 seconds.'},
  charge:{cls:'warrior',name:'Charge',cd:9,range:14,mult:1.4,price:650,lv:6,act:['charge',0.6,0.45],anim:'slash',
    desc:'Dash up to 14 m to your target and crash down, hitting and knocking back everything where you land.'},
  volley:{cls:'archer',name:'Volley',cd:5,range:32,mult:0.6,price:0,lv:3,act:['volley',0.7,0.6],
    desc:'Loose three homing arrows in a fan.'},
  pierce:{cls:'archer',name:'Piercing Shot',cd:6,range:34,mult:1.8,price:180,lv:3,act:['pierce',0.75,0.7],anim:'shoot',
    desc:'A heavy arrow that flies straight through every enemy in its path.'},
  rain:{cls:'archer',name:'Arrow Rain',cd:11,range:30,mult:0.45,price:650,lv:6,act:['rain',0.7,0.6],anim:'volley',
    desc:'A storm of arrows on your target\'s area: 5 waves over 2.5 seconds hit everything inside.'},
  frostnova:{cls:'mage',name:'Frost Nova',cd:7,range:5.5,mult:0.8,price:0,lv:3,act:['nova',0.7,0.5],
    desc:'Blast everything around you with ice and slow it down.'},
  chain:{cls:'mage',name:'Chain Lightning',cd:6,range:26,mult:1.2,price:180,lv:3,act:['chain',0.6,0.5],anim:'cast',
    desc:'Lightning strikes your target and jumps to 4 more enemies nearby, a little weaker each jump.'},
  meteor:{cls:'mage',name:'Meteor',cd:12,range:28,mult:2.4,price:650,lv:6,act:['meteor',0.8,0.55],anim:'nova',
    desc:'Call a meteor down on your target\'s area. It lands 1.2 seconds later, crushing and knocking back everything there.'}
};
const FREE_SKILL={warrior:'whirlwind',archer:'volley',mage:'frostnova'};
const SKILL_IDS=Object.keys(SKILLS);
const ANIM_OF={slash:'slash',shoot:'shoot',cast:'cast'}; for(const id in SKILLS){ const s=SKILLS[id]; s.id=id; ANIM_OF[s.act[0]]=s.anim||s.act[0]; }
const newSkills=()=>({owned:SKILL_IDS.filter(id=>!SKILLS[id].price),eq:{warrior:null,archer:null,mage:null}});
// the ability behind a slot for a class and a skill loadout (null if that slot can't be used)
function abilityOf(cls,slot,skills,level){
  if(slot==='basic') return {name:CLASSES[cls].basic.name,cd:CLASSES[cls].basic.cd,range:CLASSES[cls].basic.range,mult:CLASSES[cls].basic.mult,act:ACTS[cls].basic};
  if(slot!=='skill'||level<SKILL_SLOT_LV||!skills) return null;
  const s=SKILLS[skills.eq&&skills.eq[cls]]; return s&&s.cls===cls&&skills.owned.includes(s.id)?s:null;
}
