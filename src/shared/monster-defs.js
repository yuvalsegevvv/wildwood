//@ Monster families (FAM), the 15 monsters (MON_DEFS), prepDef, boss / totem / thornling defs. Pure.
const FAM={
  slime: {hpK:0.85,dmgPct:0.06,atk:1.6,speed:2.2,rad:0.45,height:0.8,aggro:10,sound:'squish',per:4},
  shroom:{hpK:0.95,dmgPct:0.07,atk:1.7,speed:1.8,rad:0.4, height:1.1,aggro:10,sound:'pip',per:3},
  beetle:{hpK:1.15,dmgPct:0.08,atk:1.4,speed:2.6,rad:0.6, height:0.8,aggro:11,sound:'click',per:3},
  boar:  {hpK:1.0, dmgPct:0.11,atk:2.0,speed:3.4,rad:0.6, height:1.0,aggro:13,sound:'grunt',per:2},
  goblin:{hpK:1.0, dmgPct:0.09,atk:1.3,speed:3.0,rad:0.45,height:1.8,aggro:14,sound:'yelp',per:3},
  treant:{hpK:1.35,dmgPct:0.14,atk:2.4,speed:1.6,rad:0.85,height:3.3,aggro:12,sound:'groan',per:1},
  totem: {hpK:1,dmgPct:0,atk:99,speed:0,rad:0.55,height:2.7,aggro:0,sound:'click',per:0}
};
const MON_DEFS=[
  {id:'slime',     name:'Slime',            level:1, model:'slime', scale:1,   aggro:0, pal:{body:0x5fcf5a,top:0xc2f7a8,mouth:0x1d4a1a}},
  {id:'shroom',    name:'Shroomling',       level:2, model:'shroom',scale:1,   aggro:0, pal:{cap:0xc0392b,spot:0xf4efe4,stem:0xe8dcc0,gill:0xcdbf9c,feet:0xd8c8a4}},
  {id:'beetle',    name:'Horned Beetle',    level:3, model:'beetle',scale:1,   pal:{shell:0x28505e,seam:0x14262c,sheen:0x5fa0a8,head:0x1e2a30,horn:0x3a3028,eye:0xd94a3a,legs:0x1a2226}},
  {id:'boar',      name:'Wild Boar',        level:4, model:'boar',  scale:1,   pal:{body:0x5a4030,ridge:0x2e2016,head:0x503828,snout:0x8a6050,tusk:0xf2ead8,legs:0x3a2a1e,eye:0x111111}},
  {id:'goblin',    name:'Goblin',           level:5, model:'goblin',scale:0.72,pal:{skin:0x6f9a3a,eyes:0xd9c23a,top:'tshirt',topColor:0x5a4030,bottom:'shorts',bottomColor:0x4a3a2a,hat:'none',hatColor:0x2b2420,club:0x5a3e28}},
  {id:'treant',    name:'Treant',           level:6, model:'treant',scale:1,   pal:{bark:0x4e3a28,c1:0x3f6d2a,c2:0x4a7a30,c3:0x355f25,eyes:0xffe066}},
  {id:'bogslime',  name:'Bog Slime',        level:7, model:'slime', scale:1.35,per:3, pal:{body:0x3f6f6a,top:0x8fc0a0,mouth:0x10201e}},
  {id:'deathcap',  name:'Deathcap',         level:8, model:'shroom',scale:1.3, glow:0x0a2a10, pal:{cap:0x5b3a78,spot:0xb8f06a,stem:0xcfc8b8,gill:0x8a7fa0,feet:0xb8b0a0}},
  {id:'ironshell', name:'Ironshell Beetle', level:9, model:'beetle',scale:1.3, hpK:1.3, pal:{shell:0x6a6e74,seam:0x2a2c30,sheen:0xd8c070,head:0x3a3c40,horn:0xc9a13a,eye:0xffa040,legs:0x2a2c30}},
  {id:'direboar',  name:'Dire Boar',        level:10,model:'boar',  scale:1.35,pal:{body:0x2a2420,ridge:0x8a2f2f,head:0x241e1a,snout:0x5a4040,tusk:0xe8e0c8,legs:0x1a1614,eye:0xff3020}},
  {id:'hobgoblin', name:'Hobgoblin',        level:11,model:'goblin',scale:0.9, pal:{skin:0xa0522d,eyes:0xffd040,top:'jacket',topColor:0x6a6e74,bottom:'trousers',bottomColor:0x3a2a1e,hat:'none',hatColor:0x2b2420,club:0x4a4a4a}},
  {id:'rotwood',   name:'Rotwood Treant',   level:12,model:'treant',scale:1.25,pal:{bark:0x3a2e28,c1:0xa0522d,c2:0xc27a2c,c3:0x7a3a20,eyes:0xff7a30}},
  {id:'magmaslime',name:'Magma Slime',      level:13,model:'slime', scale:1.5, per:3, glow:0x3a1000, dmgPct:0.08, pal:{body:0xd8551e,top:0xffd040,mouth:0x3a0a00}},
  {id:'chieftain', name:'Goblin Chieftain', level:14,model:'goblin',scale:1.0, per:2, hpK:1.3, dmgPct:0.11, pal:{skin:0x4a6a7a,eyes:0xff4030,top:'hoodie',topColor:0x6b2a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x2b2420,club:0x2b2b2e}},
  {id:'ancient',   name:'Ancient Treant',   level:15,model:'treant',scale:1.5, hpK:1.6, glow:0x000814, pal:{bark:0x8a8478,c1:0x1f4a3a,c2:0x2a5a48,c3:0x183a2e,eyes:0x7fd8ff}}
];
function prepDef(d){
  const F=FAM[d.model]; for(const k in F) if(d[k]===undefined) d[k]=F[k];
  d.rad=F.rad*d.scale; d.height=F.height*d.scale;
  // health: the hits a same-level, normally geared player needs (4 + 0.45 x level), times the enemy's toughness
  d.hp=Math.round(expDmg(d.level)*(4+0.45*d.level)*d.hpK);
  // damage: a share of a same-level, normally geared player's health, before that player's armor
  d.dmg=Math.max(1,Math.round(expHP(d.level)*d.dmgPct/(1-expRed(d.level))));
  d.xp=xpFor(d.level);
  d.color=d.pal.body||d.pal.cap||d.pal.shell||d.pal.skin||d.pal.c1||0x7af0a0;
}
MON_DEFS.forEach(prepDef);
const BOSS_DEF={id:'boss',name:'The Rootwarden',level:15,model:'treant',scale:2.4,boss:true,heavy:true,glow:0x12001a,atk:2.6,speed:1.9,aggro:0,
  pal:{bark:0x2e2a36,c1:0x4a2a5a,c2:0x5a3a7a,c3:0x3a1f4a,eyes:0xff5cf0}};
prepDef(BOSS_DEF); BOSS_DEF.hp=Math.round(expDmg(15)*70); BOSS_DEF.dmg=Math.round(expHP(15)*0.16/(1-expRed(15))); BOSS_DEF.xp=xpFor(15)*25;
const TOTEM_DEF={id:'totem',name:'Heartwood Totem',level:15,model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x0a2a10,pal:{}};
prepDef(TOTEM_DEF); TOTEM_DEF.hp=Math.round(expDmg(15)*9); TOTEM_DEF.xp=0;
const THORN_DEF={id:'thornling',name:'Thornling',level:14,model:'treant',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.8,speed:2.4,aggro:30,
  pal:{bark:0x3a2e28,c1:0x5a3a7a,c2:0x4a2a5a,c3:0x3a1f4a,eyes:0xff5cf0}};
prepDef(THORN_DEF);
