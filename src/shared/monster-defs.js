//@ Monster families (FAM), the 35 monsters (MON_DEFS: 15 home, 20 in the Sakura Vale), prepDef, the three bosses (BOSS_DEFS) with their totems and adds. Pure.
const FAM={
  slime: {hpK:0.85,dmgPct:0.06,atk:1.6,speed:2.2,rad:0.45,height:0.8,aggro:10,sound:'squish',per:4},
  shroom:{hpK:0.95,dmgPct:0.07,atk:1.7,speed:1.8,rad:0.4, height:1.1,aggro:10,sound:'pip',per:3},
  beetle:{hpK:1.15,dmgPct:0.08,atk:1.4,speed:2.6,rad:0.6, height:0.8,aggro:11,sound:'click',per:3},
  boar:  {hpK:1.0, dmgPct:0.11,atk:2.0,speed:3.4,rad:0.6, height:1.0,aggro:13,sound:'grunt',per:2},
  goblin:{hpK:1.0, dmgPct:0.09,atk:1.3,speed:3.0,rad:0.45,height:1.8,aggro:14,sound:'yelp',per:3},
  treant:{hpK:1.35,dmgPct:0.14,atk:2.4,speed:1.6,rad:0.85,height:3.3,aggro:12,sound:'groan',per:1},
  fox:   {hpK:1.0, dmgPct:0.1, atk:1.5,speed:3.8,rad:0.55,height:1.0,aggro:14,sound:'yelp',per:2},
  wisp:  {hpK:0.9, dmgPct:0.1, atk:1.7,speed:2.6,rad:0.45,height:1.6,aggro:13,sound:'pip',per:3},
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
  {id:'ancient',   name:'Ancient Treant',   level:15,model:'treant',scale:1.5, hpK:1.6, glow:0x000814, pal:{bark:0x8a8478,c1:0x1f4a3a,c2:0x2a5a48,c3:0x183a2e,eyes:0x7fd8ff}},
  /* the Sakura Vale: two kinds per level. Extra look flags for the client models: goblin horns / kasa (straw hat) /
     shell (kappa) / nose + wings (tengu) / weapon 'kanabo' | 'spear' | 'katana'; beetle spider (8 long legs, no horn);
     fox tails (how many); wisp ghost (a trailing body and arms instead of a flame) */
  {id:'sakuraslime',name:'Sakura Slime',    level:16,model:'slime', scale:1.4, per:3, pal:{body:0xf29cc0,top:0xffe2ee,mouth:0x6a1a3a}},
  {id:'kappa',     name:'Kappa',            level:16,model:'goblin',scale:0.78,pal:{skin:0x5aa08a,eyes:0xf2e04a,top:'tshirt',topColor:0x3f6a4a,bottom:'shorts',bottomColor:0x2f4a3a,hat:'none',hatColor:0x2b2420,club:0x6a5a3a,shell:0x4a6a3a}},
  {id:'kodama',    name:'Kodama',           level:17,model:'shroom',scale:1.25,glow:0x0e1a10,pal:{cap:0xe8ecdc,spot:0xc8e8b8,stem:0xf2f2ea,gill:0xd0d8c4,feet:0xe0e4d4}},
  {id:'kabuto',    name:'Kabuto Beetle',    level:17,model:'beetle',scale:1.45,hpK:1.25,pal:{shell:0x3a1614,seam:0x140806,sheen:0xd05a3a,head:0x1e0e0c,horn:0x2a1410,eye:0xffc040,legs:0x1a0c0a}},
  {id:'kitsune',   name:'Kitsune',          level:18,model:'fox',   scale:1.0, pal:{body:0xd8762a,belly:0xf4efe4,tip:0xf8f4ea,eye:0xffd040,legs:0x3a2418,tails:2}},
  {id:'yamaboar',  name:'Mountain Boar',    level:18,model:'boar',  scale:1.45,pal:{body:0x6a5a4a,ridge:0xd8d0c0,head:0x5a4a3c,snout:0x8a6a5a,tusk:0xf6f0e0,legs:0x2e241c,eye:0xffa030}},
  {id:'ashigaru',  name:'Goblin Ashigaru',  level:19,model:'goblin',scale:0.95,pal:{skin:0x7a9a4a,eyes:0xffd040,top:'jacket',topColor:0x6a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'none',hatColor:0x2b2420,club:0x5a3e28,kasa:0xc8a868,weapon:'spear'}},
  {id:'bamboo',    name:'Bamboo Treant',    level:19,model:'treant',scale:1.2, pal:{bark:0x7aa04a,c1:0x5a8a3a,c2:0x6a9a44,c3:0x4a7a30,eyes:0xfff07a}},
  {id:'onibi',     name:'Onibi',            level:20,model:'wisp',  scale:1.0, glow:0x1a3a6a, pal:{body:0x4ab0ff,core:0xe8f6ff,eye:0x0a1a3a}},
  {id:'jorogumo',  name:'Jorogumo',         level:20,model:'beetle',scale:1.5, pal:{shell:0x2a2438,seam:0xe8c030,sheen:0x8a5ab0,head:0x1e1a28,horn:0x2a2438,eye:0xff3a5a,legs:0x1a1622,spider:1}},
  {id:'oni',       name:'Red Oni',          level:21,model:'goblin',scale:1.25,per:2,hpK:1.2,pal:{skin:0xc03a2a,eyes:0xffe060,top:'tshirt',topColor:0xe0a030,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x3a3230,horns:0xf2ead8,weapon:'kanabo'}},
  {id:'yurei',     name:'Yurei',            level:21,model:'wisp',  scale:1.1, glow:0x1a2230, pal:{body:0xdce8f0,core:0xffffff,eye:0x101418,hair:0x101014,ghost:1}},
  {id:'shadowfox', name:'Shadow Kitsune',   level:22,model:'fox',   scale:1.15,glow:0x100820,pal:{body:0x2a2238,belly:0x4a3a5a,tip:0xb070ff,eye:0xff60d0,legs:0x14101c,tails:3}},
  {id:'jadeslime', name:'Jade Slime',       level:22,model:'slime', scale:1.7, per:3, glow:0x06281c, pal:{body:0x3aa080,top:0xa0f0d0,mouth:0x0a2a1e}},
  {id:'blueoni',   name:'Blue Oni',         level:23,model:'goblin',scale:1.35,per:2,hpK:1.25,pal:{skin:0x3a5ab0,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xd8b040,hat:'none',hatColor:0x2b2420,club:0x6a6e74,horns:0xf2ead8,weapon:'kanabo'}},
  {id:'tengu',     name:'Karasu Tengu',     level:23,model:'goblin',scale:0.95,pal:{skin:0x2e2e36,eyes:0xffc030,top:'jacket',topColor:0xe8e4dc,bottom:'trousers',bottomColor:0x2a2830,hat:'none',hatColor:0x2b2420,club:0xc0c6cc,nose:0xd8a030,wings:0x1a1a22,weapon:'katana'}},
  {id:'samurai',   name:'Undead Samurai',   level:24,model:'goblin',scale:1.05,per:2,hpK:1.3,dmgPct:0.11,pal:{skin:0xb8b0a0,eyes:0x7fd8ff,top:'plate',topColor:0x8a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'helm',hatColor:0x24222a,club:0xd9e2ea,weapon:'katana'}},
  {id:'goldkabuto',name:'Golden Kabuto',    level:24,model:'beetle',scale:1.7, hpK:1.35,pal:{shell:0xc9a13a,seam:0x5a4010,sheen:0xfff0a0,head:0x6a5018,horn:0xe8c860,eye:0xff4020,legs:0x3a2a10}},
  {id:'sakuratreant',name:'Elder Sakura',   level:25,model:'treant',scale:1.6, hpK:1.5, glow:0x14040c, pal:{bark:0x4a3434,c1:0xf2a6c4,c2:0xf8c4d8,c3:0xe68ab0,eyes:0xff70b0}},
  {id:'raiju',     name:'Raiju',            level:25,model:'fox',   scale:1.3, per:2, glow:0x1a1a04, pal:{body:0xf2d040,belly:0x3a4a8a,tip:0x9fd8ff,eye:0x7fe0ff,legs:0x2a2a40,tails:1}}
];
function prepDef(d){
  const F=FAM[d.model]; for(const k in F) if(d[k]===undefined) d[k]=F[k];
  d.rad=F.rad*d.scale; d.height=F.height*d.scale;
  // health: the hits a same-level, normally geared player needs (4 + 0.45 x level), times the enemy's toughness
  d.hp=Math.round(expDmg(d.level)*(4+0.45*d.level)*d.hpK*highMult(d.level));
  // damage: a share of a same-level, normally geared player's health, before that player's armor
  d.dmg=Math.max(1,Math.round(expHP(d.level)*d.dmgPct/(1-expRed(d.level))));
  d.xp=xpFor(d.level);
  d.color=d.pal.body||d.pal.cap||d.pal.shell||d.pal.skin||d.pal.c1||0x7af0a0;
}
MON_DEFS.forEach(prepDef);
/* Bosses: health = 70 hits of a same-level player, a hit = 16% of that player's health; totems (the shield phase)
   9 hits; adds come in the enrage phase. Every boss fights the same way (server/boss.js). */
function bossDef(d){ const L=d.level; prepDef(d); d.hp=Math.round(expDmg(L)*70*highMult(L)); d.dmg=Math.round(expHP(L)*0.16/(1-expRed(L))); d.xp=xpFor(L)*25; return d; }
function totemDef(d){ prepDef(d); d.hp=Math.round(expDmg(d.level)*9*highMult(d.level)); d.xp=0; return d; }
const BOSS_DEF=bossDef({id:'boss',name:'The Rootwarden',level:15,model:'treant',scale:2.4,boss:true,heavy:true,glow:0x12001a,atk:2.6,speed:1.9,aggro:0,
  pal:{bark:0x2e2a36,c1:0x4a2a5a,c2:0x5a3a7a,c3:0x3a1f4a,eyes:0xff5cf0}});
const TOTEM_DEF=totemDef({id:'totem',name:'Heartwood Totem',level:15,model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x0a2a10,pal:{crystal:0x7af0a0,band:0x6af08a}});
const THORN_DEF={id:'thornling',name:'Thornling',level:14,model:'treant',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.8,speed:2.4,aggro:30,
  pal:{bark:0x3a2e28,c1:0x5a3a7a,c2:0x4a2a5a,c3:0x3a1f4a,eyes:0xff5cf0}};
prepDef(THORN_DEF);
const AKAONI_DEF=bossDef({id:'akaoni',name:'Akaoni, the Gate Demon',level:20,model:'goblin',scale:2.3,boss:true,heavy:true,glow:0x2a0400,atk:2.4,speed:2.1,aggro:0,
  pal:{skin:0xb02a1e,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x2a2626,horns:0xf6eedc,weapon:'kanabo'}});
const LANTERN_DEF=totemDef({id:'onilantern',name:'Oni Lantern',level:20,model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x2a1000,pal:{crystal:0xff8a2a,band:0xffb04a}});
const IMP_DEF={id:'oniimp',name:'Oni Imp',level:19,model:'goblin',scale:0.62,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{skin:0xd04a2a,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x3a3230,horns:0xf2ead8,weapon:'kanabo'}};
prepDef(IMP_DEF);
const KYUUBI_DEF=bossDef({id:'kyuubi',name:'Kyuubi, the Nine-Tailed',level:25,model:'fox',scale:3.2,boss:true,heavy:true,glow:0x1a0c02,atk:2.2,speed:2.6,aggro:0,
  pal:{body:0xf4ead4,belly:0xfff8ec,tip:0xffa040,eye:0xff5020,legs:0xd8c8a8,tails:9}});
const SHRINE_DEF=totemDef({id:'foxshrine',name:'Foxfire Shrine',level:25,model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x06142a,pal:{crystal:0x6ab8ff,band:0x9fd8ff}});
const FOXKIT_DEF={id:'foxkit',name:'Fox Spirit',level:24,model:'fox',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.4,speed:4,aggro:30,glow:0x06142a,
  pal:{body:0x6ab8ff,belly:0xd8f0ff,tip:0xffffff,eye:0xffffff,legs:0x2a4a7a,tails:2}};
prepDef(FOXKIT_DEF);
// arena: which clearing (ARENAS in vale.js); totem / add: the shield-phase totems and the enrage adds
const BOSS_DEFS=[
  {def:BOSS_DEF,arena:'boss',totem:TOTEM_DEF,add:THORN_DEF,short:'The Rootwarden',totems:'Heartwood Totems'},
  {def:AKAONI_DEF,arena:'boss20',totem:LANTERN_DEF,add:IMP_DEF,short:'Akaoni',totems:'Oni Lanterns'},
  {def:KYUUBI_DEF,arena:'boss25',totem:SHRINE_DEF,add:FOXKIT_DEF,short:'Kyuubi',totems:'Foxfire Shrines'}];
const ALL_MON_DEFS=[...MON_DEFS,...BOSS_DEFS.flatMap(b=>[b.def,b.totem,b.add])];
