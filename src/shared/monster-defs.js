//@ Monster families (FAM), the 58 monsters (MON_DEFS: 15 home, 5 on the home forest's edges, 20 in the Sakura Vale, 18 in the Hoarfrost Reach), prepDef, the six bosses (BOSS_DEFS) with the move set (kit) and summons of each, the main quest's grey-veined monsters (GREY_DEFS). Pure.
const FAM={
  slime: {hpK:0.85,dmgPct:0.06,atk:1.6,speed:2.2,rad:0.45,height:0.8,aggro:10,sound:'squish',per:4},
  shroom:{hpK:0.95,dmgPct:0.07,atk:1.7,speed:1.8,rad:0.4, height:1.1,aggro:10,sound:'pip',per:3},
  beetle:{hpK:1.15,dmgPct:0.08,atk:1.4,speed:2.6,rad:0.6, height:0.8,aggro:11,sound:'click',per:3},
  boar:  {hpK:1.0, dmgPct:0.11,atk:2.0,speed:3.4,rad:0.6, height:1.0,aggro:13,sound:'grunt',per:2},
  goblin:{hpK:1.0, dmgPct:0.09,atk:1.3,speed:3.0,rad:0.45,height:1.8,aggro:14,sound:'yelp',per:3},
  treant:{hpK:1.35,dmgPct:0.14,atk:2.4,speed:1.6,rad:0.85,height:3.3,aggro:12,sound:'groan',per:1},
  fox:   {hpK:1.0, dmgPct:0.1, atk:1.5,speed:3.8,rad:0.55,height:1.0,aggro:14,sound:'yelp',per:2},
  wisp:  {hpK:0.9, dmgPct:0.1, atk:1.7,speed:2.6,rad:0.45,height:1.6,aggro:13,sound:'pip',per:3},
  totem: {hpK:1,dmgPct:0,atk:99,speed:0,rad:0.55,height:2.7,aggro:0,sound:'click',per:0},
  wyrm:  {hpK:1.0,dmgPct:0.12,atk:2.2,speed:2.6,rad:0.9,height:2.0,aggro:16,sound:'groan',per:1}
};
const MON_DEFS=[
  {id:'slime',     name:'Slime',            level:1,el:'water', model:'slime', scale:1,   aggro:0, pal:{body:0x5fcf5a,top:0xc2f7a8,mouth:0x1d4a1a}},
  {id:'shroom',    name:'Shroomling',       level:2,el:'air', model:'shroom',scale:1,   aggro:0, pal:{cap:0xc0392b,spot:0xf4efe4,stem:0xe8dcc0,gill:0xcdbf9c,feet:0xd8c8a4}},
  {id:'beetle',    name:'Horned Beetle',    level:3, model:'beetle',scale:1,   pal:{shell:0x28505e,seam:0x14262c,sheen:0x5fa0a8,head:0x1e2a30,horn:0x3a3028,eye:0xd94a3a,legs:0x1a2226}},
  {id:'boar',      name:'Wild Boar',        level:4, model:'boar',  scale:1,   pal:{body:0x5a4030,ridge:0x2e2016,head:0x503828,snout:0x8a6050,tusk:0xf2ead8,legs:0x3a2a1e,eye:0x111111}},
  {id:'goblin',    name:'Goblin',           level:5, model:'goblin',scale:0.72,pal:{skin:0x6f9a3a,eyes:0xd9c23a,top:'tshirt',topColor:0x5a4030,bottom:'shorts',bottomColor:0x4a3a2a,hat:'none',hatColor:0x2b2420,club:0x5a3e28}},
  {id:'treant',    name:'Treant',           level:6,el:'earth', model:'treant',scale:1,   pal:{bark:0x4e3a28,c1:0x3f6d2a,c2:0x4a7a30,c3:0x355f25,eyes:0xffe066}},
  {id:'bogslime',  name:'Bog Slime',        level:7,el:'water', model:'slime', scale:1.35,per:3, pal:{body:0x3f6f6a,top:0x8fc0a0,mouth:0x10201e}},
  {id:'deathcap',  name:'Deathcap',         level:8,el:'dark', model:'shroom',scale:1.3, glow:0x0a2a10, pal:{cap:0x5b3a78,spot:0xb8f06a,stem:0xcfc8b8,gill:0x8a7fa0,feet:0xb8b0a0}},
  {id:'ironshell', name:'Ironshell Beetle', level:9,el:'earth', model:'beetle',scale:1.3, hpK:1.3, pal:{shell:0x6a6e74,seam:0x2a2c30,sheen:0xd8c070,head:0x3a3c40,horn:0xc9a13a,eye:0xffa040,legs:0x2a2c30}},
  {id:'direboar',  name:'Dire Boar',        level:10,el:'dark',model:'boar',  scale:1.35,pal:{body:0x2a2420,ridge:0x8a2f2f,head:0x241e1a,snout:0x5a4040,tusk:0xe8e0c8,legs:0x1a1614,eye:0xff3020}},
  {id:'hobgoblin', name:'Hobgoblin',        level:11,el:'fire',model:'goblin',scale:0.9, pal:{skin:0xa0522d,eyes:0xffd040,top:'jacket',topColor:0x6a6e74,bottom:'trousers',bottomColor:0x3a2a1e,hat:'none',hatColor:0x2b2420,club:0x4a4a4a}},
  {id:'rotwood',   name:'Rotwood Treant',   level:12,el:'fire',model:'treant',scale:1.25,pal:{bark:0x3a2e28,c1:0xa0522d,c2:0xc27a2c,c3:0x7a3a20,eyes:0xff7a30}},
  {id:'magmaslime',name:'Magma Slime',      level:13,el:'fire',model:'slime', scale:1.5, per:3, glow:0x3a1000, dmgPct:0.08, pal:{body:0xd8551e,top:0xffd040,mouth:0x3a0a00}},
  {id:'chieftain', name:'Goblin Chieftain', level:14,el:'dark',model:'goblin',scale:1.0, per:2, hpK:1.3, dmgPct:0.11, pal:{skin:0x4a6a7a,eyes:0xff4030,top:'hoodie',topColor:0x6b2a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x2b2420,club:0x2b2b2e}},
  {id:'ancient',   name:'Ancient Treant',   level:15,el:'light',model:'treant',scale:1.5, hpK:1.6, glow:0x000814, pal:{bark:0x8a8478,c1:0x1f4a3a,c2:0x2a5a48,c3:0x183a2e,eyes:0x7fd8ff}},
  /* the home forest's edges: each lives in its own edge zone (zone, see EDGE_ZONES in zones.js), count of them in all.
     Levels 16-20: side content for players who came back from the vale strong enough, not part of the main quest */
  {id:'crab',      name:'Shore Crab',       level:16,el:'water',model:'beetle',scale:1.15,zone:'shore',count:18,hpK:1.2,pal:{shell:0xc0452a,seam:0x5a1a10,sheen:0xf08a60,head:0x8a2a18,horn:0xc0452a,eye:0x111111,legs:0xa83a22,spider:1}},
  {id:'tideslime', name:'Tide Slime',       level:17,el:'water',model:'slime', scale:1.4, zone:'shore',count:16,per:3,glow:0x04202a,pal:{body:0x3aa8c8,top:0xbff0ff,mouth:0x0a2a3a}},
  {id:'scarab',    name:'Sun Scarab',       level:18,el:'fire', model:'beetle',scale:1.3, zone:'sunfoot',count:20,pal:{shell:0xc0782e,seam:0x4a2a10,sheen:0xffd070,head:0x7a4418,horn:0xe0a040,eye:0x111111,legs:0x5a3418}},
  {id:'ramboar',   name:'Ram-horned Boar',  level:19,el:'earth',model:'boar',  scale:1.4, zone:'foothills',count:18,pal:{body:0x8a8478,ridge:0xe8e4dc,head:0x7a7468,snout:0x9a8a7a,tusk:0xf2ead8,legs:0x4a443c,eye:0xffa030}},
  {id:'cragwarden',name:'Crag Warden',      level:20,el:'earth',model:'treant',scale:1.45,zone:'foothills',count:10,hpK:1.4,pal:{bark:0x6a665e,c1:0x8a8a82,c2:0x9a968c,c3:0x74726a,eyes:0x9fd8ff}},
  /* the Sakura Vale: two kinds per level. Extra look flags for the client models: goblin horns / kasa (straw hat) /
     shell (kappa) / nose + wings (tengu) / weapon 'kanabo' | 'spear' | 'katana'; beetle spider (8 long legs, no horn);
     fox tails (how many); wisp ghost (a trailing body and arms instead of a flame) */
  {id:'sakuraslime',name:'Sakura Slime',    level:16,el:'air',model:'slime', scale:1.4, per:3, pal:{body:0xf29cc0,top:0xffe2ee,mouth:0x6a1a3a}},
  {id:'kappa',     name:'Kappa',            level:16,el:'water',model:'goblin',scale:0.78,pal:{skin:0x5aa08a,eyes:0xf2e04a,top:'tshirt',topColor:0x3f6a4a,bottom:'shorts',bottomColor:0x2f4a3a,hat:'none',hatColor:0x2b2420,club:0x6a5a3a,shell:0x4a6a3a}},
  {id:'kodama',    name:'Kodama',           level:17,el:'light',model:'shroom',scale:1.25,glow:0x0e1a10,pal:{cap:0xe8ecdc,spot:0xc8e8b8,stem:0xf2f2ea,gill:0xd0d8c4,feet:0xe0e4d4}},
  {id:'kabuto',    name:'Kabuto Beetle',    level:17,el:'fire',model:'beetle',scale:1.45,hpK:1.25,pal:{shell:0x3a1614,seam:0x140806,sheen:0xd05a3a,head:0x1e0e0c,horn:0x2a1410,eye:0xffc040,legs:0x1a0c0a}},
  {id:'kitsune',   name:'Kitsune',          level:18,el:'fire',model:'fox',   scale:1.0, pal:{body:0xd8762a,belly:0xf4efe4,tip:0xf8f4ea,eye:0xffd040,legs:0x3a2418,tails:2}},
  {id:'yamaboar',  name:'Mountain Boar',    level:18,el:'earth',model:'boar',  scale:1.45,pal:{body:0x6a5a4a,ridge:0xd8d0c0,head:0x5a4a3c,snout:0x8a6a5a,tusk:0xf6f0e0,legs:0x2e241c,eye:0xffa030}},
  {id:'ashigaru',  name:'Goblin Ashigaru',  level:19,model:'goblin',scale:0.95,pal:{skin:0x7a9a4a,eyes:0xffd040,top:'jacket',topColor:0x6a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'none',hatColor:0x2b2420,club:0x5a3e28,kasa:0xc8a868,weapon:'spear'}},
  {id:'bamboo',    name:'Bamboo Treant',    level:19,el:'earth',model:'treant',scale:1.2, pal:{bark:0x7aa04a,c1:0x5a8a3a,c2:0x6a9a44,c3:0x4a7a30,eyes:0xfff07a}},
  {id:'onibi',     name:'Onibi',            level:20,el:'fire',model:'wisp',  scale:1.0, glow:0x1a3a6a, pal:{body:0x4ab0ff,core:0xe8f6ff,eye:0x0a1a3a}},
  {id:'jorogumo',  name:'Jorogumo',         level:20,el:'dark',model:'beetle',scale:1.5, pal:{shell:0x2a2438,seam:0xe8c030,sheen:0x8a5ab0,head:0x1e1a28,horn:0x2a2438,eye:0xff3a5a,legs:0x1a1622,spider:1}},
  {id:'oni',       name:'Red Oni',          level:21,el:'fire',model:'goblin',scale:1.25,per:2,hpK:1.2,pal:{skin:0xc03a2a,eyes:0xffe060,top:'tshirt',topColor:0xe0a030,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x3a3230,horns:0xf2ead8,weapon:'kanabo'}},
  {id:'yurei',     name:'Yurei',            level:21,el:'dark',model:'wisp',  scale:1.1, glow:0x1a2230, pal:{body:0xdce8f0,core:0xffffff,eye:0x101418,hair:0x101014,ghost:1}},
  {id:'shadowfox', name:'Shadow Kitsune',   level:22,el:'dark',model:'fox',   scale:1.15,glow:0x100820,pal:{body:0x2a2238,belly:0x4a3a5a,tip:0xb070ff,eye:0xff60d0,legs:0x14101c,tails:3}},
  {id:'jadeslime', name:'Jade Slime',       level:22,el:'water',model:'slime', scale:1.7, per:3, glow:0x06281c, pal:{body:0x3aa080,top:0xa0f0d0,mouth:0x0a2a1e}},
  {id:'blueoni',   name:'Blue Oni',         level:23,el:'water',model:'goblin',scale:1.35,per:2,hpK:1.25,pal:{skin:0x3a5ab0,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xd8b040,hat:'none',hatColor:0x2b2420,club:0x6a6e74,horns:0xf2ead8,weapon:'kanabo'}},
  {id:'tengu',     name:'Karasu Tengu',     level:23,el:'air',model:'goblin',scale:0.95,pal:{skin:0x2e2e36,eyes:0xffc030,top:'jacket',topColor:0xe8e4dc,bottom:'trousers',bottomColor:0x2a2830,hat:'none',hatColor:0x2b2420,club:0xc0c6cc,nose:0xd8a030,wings:0x1a1a22,weapon:'katana'}},
  {id:'samurai',   name:'Undead Samurai',   level:24,el:'dark',model:'goblin',scale:1.05,per:2,hpK:1.3,dmgPct:0.11,pal:{skin:0xb8b0a0,eyes:0x7fd8ff,top:'plate',topColor:0x8a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'helm',hatColor:0x24222a,club:0xd9e2ea,weapon:'katana'}},
  {id:'goldkabuto',name:'Golden Kabuto',    level:24,el:'light',model:'beetle',scale:1.7, hpK:1.35,pal:{shell:0xc9a13a,seam:0x5a4010,sheen:0xfff0a0,head:0x6a5018,horn:0xe8c860,eye:0xff4020,legs:0x3a2a10}},
  {id:'sakuratreant',name:'Elder Sakura',   level:25,el:'light',model:'treant',scale:1.6, hpK:1.5, glow:0x14040c, pal:{bark:0x4a3434,c1:0xf2a6c4,c2:0xf8c4d8,c3:0xe68ab0,eyes:0xff70b0}},
  {id:'raiju',     name:'Raiju',            level:25,el:'air',model:'fox',   scale:1.3, per:2, glow:0x1a1a04, pal:{body:0xf2d040,belly:0x3a4a8a,tip:0x9fd8ff,eye:0x7fe0ff,legs:0x2a2a40,tails:1}},
  /* the Hoarfrost Reach (levels 22-30, docs/WORLD.md): two kinds per level, each in its own zone (zone:'h22'..'h30', ZONES in hoarfrost.js).
     Look flags for the client models: fox wolf (a heavy wolf: broad head, small ears, one bushy tail); goblin fur (a shaggy mane and
     shoulders) and weapon 'axe' */
  {id:'frostslime',name:'Frost Slime',      level:22,el:'water',model:'slime', scale:1.6, per:3, zone:'h22', glow:0x06202c, pal:{body:0x8fd0f0,top:0xeaf8ff,mouth:0x1a3a4e}},
  {id:'snowboar',  name:'Snow Boar',        level:22,el:'water',model:'boar',  scale:1.5, zone:'h22', pal:{body:0xe4eaee,ridge:0x8aa4b8,head:0xd6dee4,snout:0xb8a8a0,tusk:0xf6f4ea,legs:0x8a96a0,eye:0x3a7ad8}},
  {id:'icebeetle', name:'Ice Beetle',       level:23,el:'water',model:'beetle',scale:1.5, hpK:1.25, zone:'h23', pal:{shell:0x9ac8e0,seam:0x3a6a8a,sheen:0xf0fbff,head:0x6a98b0,horn:0xd8f2ff,eye:0x1a3a6a,legs:0x5a88a0}},
  {id:'wolf',      name:'Winter Wolf',      level:23,el:'air',  model:'fox',   scale:1.35,zone:'h23', pal:{body:0xb8c2cc,belly:0xeef2f6,tip:0xf8fbff,eye:0x9fe0ff,legs:0x6a747e,tails:1,wolf:1}},
  {id:'reaver',    name:'Frost Reaver',     level:24,el:'dark', model:'goblin',scale:1.05,per:2,hpK:1.2, zone:'h24', pal:{skin:0x7aa0b0,eyes:0xff5a3a,top:'jacket',topColor:0x3a4a5a,bottom:'trousers',bottomColor:0x2a2a34,hat:'none',hatColor:0x2b2420,club:0xc8ced4,weapon:'axe',horns:0xe8e4d8,fur:0xd8e0e8}},
  {id:'rimewisp',  name:'Rime Wisp',        level:24,el:'air',  model:'wisp',  scale:1.1, zone:'h24', glow:0x102a44, pal:{body:0xa8e0ff,core:0xffffff,eye:0x0a2a4a}},
  {id:'rimetreant',name:'Rimebark Treant',  level:25,el:'water',model:'treant',scale:1.7, hpK:1.5, zone:'h25', glow:0x081820, pal:{bark:0x5a5e62,c1:0xdce8ee,c2:0xc4d8e2,c3:0xa8c4d4,eyes:0x7fe0ff}},
  {id:'yeti',      name:'Yeti',             level:25,el:'water',model:'goblin',scale:1.6, per:2,hpK:1.4,dmgPct:0.11,zone:'h25', pal:{skin:0xe8eff4,eyes:0x3aa0e8,top:'hoodie',topColor:0xf0f4f8,bottom:'trousers',bottomColor:0xd8e0e8,hat:'none',hatColor:0x2b2420,club:0x8a9aa8,horns:0xbcd8ea,fur:0xf4f8fb}},
  {id:'draugr',    name:'Draugr',           level:26,el:'dark', model:'goblin',scale:1.1, per:2,hpK:1.3,dmgPct:0.11,zone:'h26', pal:{skin:0x6a7a84,eyes:0x7fe8ff,top:'plate',topColor:0x4a5a6a,bottom:'trousers',bottomColor:0x2a3038,hat:'helm',hatColor:0x3a4650,club:0xb8c4cc,weapon:'axe'}},
  {id:'icewraith', name:'Ice Wraith',       level:26,el:'dark', model:'wisp',  scale:1.2, zone:'h26', glow:0x101c2c, pal:{body:0xc0d4e4,core:0xffffff,eye:0x10141c,hair:0x1c2430,ghost:1}},
  {id:'lynx',      name:'Snow Lynx',        level:27,el:'air',  model:'fox',   scale:1.4, zone:'h27', pal:{body:0xd8d4ca,belly:0xf6f4ee,tip:0x2a2a2e,eye:0xa0e0a0,legs:0x8a867c,tails:1,wolf:1}},
  {id:'crawler',   name:'Glacier Crawler',  level:27,el:'water',model:'beetle',scale:1.7, hpK:1.3, zone:'h27', pal:{shell:0xb0dcf0,seam:0x2a5a7a,sheen:0xffffff,head:0x7aaac0,horn:0xe8f8ff,eye:0xff5a5a,legs:0x4a7a90,spider:1}},
  {id:'frosttroll',name:'Frost Troll',      level:28,el:'water',model:'goblin',scale:1.85,per:2,hpK:1.5,dmgPct:0.12,zone:'h28', pal:{skin:0x86b4c8,eyes:0xffe060,top:'tshirt',topColor:0x5a6a78,bottom:'shorts',bottomColor:0x4a5660,hat:'none',hatColor:0x2b2420,club:0x7a8a98,horns:0xdcecf4,fur:0xc8dce8}},
  {id:'blizzhound',name:'Blizzard Hound',   level:28,el:'air',  model:'fox',   scale:1.5, glow:0x0a1c30, zone:'h28', pal:{body:0x8aa4c0,belly:0xdce8f4,tip:0xffffff,eye:0xc8f0ff,legs:0x4a5e78,tails:1,wolf:1}},
  {id:'revenant',  name:'Rime Revenant',    level:29,el:'dark', model:'goblin',scale:1.2, per:2,hpK:1.35,dmgPct:0.12,zone:'h29', glow:0x081420, pal:{skin:0x9ab0bc,eyes:0x9fe8ff,top:'plate',topColor:0x6a8298,bottom:'trousers',bottomColor:0x2a3644,hat:'helm',hatColor:0x54687c,club:0xdce8f0,weapon:'katana'}},
  {id:'barrowwight',name:'Barrow Wight',    level:29,el:'dark', model:'wisp',  scale:1.3, glow:0x0c1420, zone:'h29', pal:{body:0x8a9cb0,core:0xe8f4ff,eye:0x0a0e14,hair:0x141a24,ghost:1}},
  {id:'alphawolf', name:'Frostfang Alpha',  level:30,el:'air',  model:'fox',   scale:1.75,hpK:1.3, zone:'h30', glow:0x0c1a2c, pal:{body:0x9eb4cc,belly:0xeaf2fa,tip:0xffffff,eye:0xff6a5a,legs:0x566a84,tails:1,wolf:1}},
  {id:'glaciergolem',name:'Glacier Golem',  level:30,el:'water',model:'treant',scale:1.95,hpK:1.6, zone:'h30', glow:0x0a2030, pal:{bark:0x4a5a68,c1:0xa8d8f0,c2:0xc8ecfc,c3:0x88c0e0,eyes:0xffb040}}
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
/* Bosses: health = 70 hits of a same-level player, a hit = 16% of that player's health; props (the Rootwarden's totems, Vetrmaw's warm
   cores) 9 hits. Every boss has its own move set on top of the shared melee and phases (server/boss.js, boss-kits-*.js). */
function bossDef(d){ const L=d.level; prepDef(d); d.hp=Math.round(expDmg(L)*70*highMult(L)); d.dmg=Math.round(expHP(L)*0.16/(1-expRed(L))); d.xp=xpFor(L)*25; return d; }
function totemDef(d){ prepDef(d); d.hp=Math.round(expDmg(d.level)*9*highMult(d.level)); d.xp=0; return d; }
const BOSS_DEF=bossDef({id:'boss',name:'The Rootwarden',level:15,el:'dark',model:'treant',scale:2.4,boss:true,heavy:true,glow:0x12001a,atk:2.6,speed:1.9,aggro:0,
  pal:{bark:0x2e2a36,c1:0x4a2a5a,c2:0x5a3a7a,c3:0x3a1f4a,eyes:0xff5cf0}});
const TOTEM_DEF=totemDef({id:'totem',name:'Heartwood Totem',level:15,el:'dark',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x0a2a10,pal:{crystal:0x7af0a0,band:0x6af08a}});
const THORN_DEF={id:'thornling',name:'Thornling',level:14,el:'dark',model:'treant',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.8,speed:2.4,aggro:30,
  pal:{bark:0x3a2e28,c1:0x5a3a7a,c2:0x4a2a5a,c3:0x3a1f4a,eyes:0xff5cf0}};
prepDef(THORN_DEF);
// the Crownsea Shore (level 20): Carapax, the Tide King, a crab the size of a fishing boat (the beetle model with claws: pal.crab). It plays the Rootwarden's music for now (music: a theme other than the one for its level)
const CARAPAX_DEF=bossDef({id:'carapax',name:'Carapax, the Tide King',level:20,el:'water',model:'beetle',scale:3.4,boss:true,heavy:true,glow:0x04202a,atk:2.5,speed:2.0,aggro:0,music:'boss15',
  pal:{shell:0xc8552e,seam:0x5a1a10,sheen:0xffb080,head:0x8a2a18,horn:0xe8dcc0,eye:0x111111,legs:0xa83a22,crab:1}});
const HATCH_DEF={id:'crabhatch',name:'Tide Hatchling',level:19,el:'water',model:'beetle',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{shell:0xc8552e,seam:0x5a1a10,sheen:0xffb080,head:0x8a2a18,horn:0xe8dcc0,eye:0x111111,legs:0xa83a22,crab:1}};
prepDef(HATCH_DEF);
const AKAONI_DEF=bossDef({id:'akaoni',name:'Akaoni, the Gate Demon',level:20,el:'fire',model:'goblin',scale:2.3,boss:true,heavy:true,glow:0x2a0400,atk:2.4,speed:2.1,aggro:0,
  pal:{skin:0xb02a1e,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x2a2626,horns:0xf6eedc,weapon:'kanabo'}});
const IMP_DEF={id:'oniimp',name:'Oni Imp',level:19,el:'fire',model:'goblin',scale:0.62,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{skin:0xd04a2a,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x3a3230,horns:0xf2ead8,weapon:'kanabo'}};
prepDef(IMP_DEF);
const KYUUBI_DEF=bossDef({id:'kyuubi',name:'Kyuubi, the Nine-Tailed',level:25,el:'light',model:'fox',scale:3.2,boss:true,heavy:true,glow:0x1a0c02,atk:2.2,speed:2.6,aggro:0,
  pal:{body:0xf4ead4,belly:0xfff8ec,tip:0xffa040,eye:0xff5020,legs:0xd8c8a8,tails:9}});
const FOXKIT_DEF={id:'foxkit',name:'Fox Spirit',level:24,el:'light',model:'fox',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.4,speed:4,aggro:30,glow:0x06142a,
  pal:{body:0x6ab8ff,belly:0xd8f0ff,tip:0xffffff,eye:0xffffff,legs:0x2a4a7a,tails:2}};
prepDef(FOXKIT_DEF);
// the Hoarfrost Reach: Ymrik the Rimeking (level 26, a frost giant in his ice hall) and Vetrmaw the frost wyrm (level 30, at the wreck)
const YMRIK_DEF=bossDef({id:'ymrik',name:'Ymrik, the Rimeking',level:26,el:'water',model:'goblin',scale:2.5,boss:true,heavy:true,glow:0x081a2a,atk:2.4,speed:2.1,aggro:0,
  pal:{skin:0xa8c8dc,eyes:0x9fe8ff,top:'plate',topColor:0x4a6278,bottom:'trousers',bottomColor:0x2a3a4a,hat:'helm',hatColor:0x6a8298,club:0xdce8f0,horns:0xeaf4fa,weapon:'axe',fur:0xe8f0f6}});
const THRALL_DEF={id:'frostthrall',name:'Frost Thrall',level:25,el:'water',model:'goblin',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{skin:0x9ab8c8,eyes:0x9fe8ff,top:'tshirt',topColor:0x4a6278,bottom:'shorts',bottomColor:0x2a3a4a,hat:'none',hatColor:0x2b2420,club:0xdce8f0,horns:0xeaf4fa,weapon:'axe'}};
prepDef(THRALL_DEF);
const VETRMAW_DEF=bossDef({id:'vetrmaw',name:'Vetrmaw, the Frost Wyrm',level:30,el:'water',model:'wyrm',scale:2.3,boss:true,heavy:true,glow:0x081c30,atk:2.2,speed:2.5,aggro:0,
  pal:{body:0x9cc4e0,belly:0xe4f2fa,ridge:0x3a6a8c,horn:0xe8f6ff,eye:0xff7a3a,wing:0x6a98bc}});
const CORE_DEF=totemDef({id:'warmcore',name:'Warm Core',level:30,el:'water',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x3a1400,pal:{crystal:0xff9a3a,band:0xffc060}});
const WYRMLING_DEF={id:'wyrmling',name:'Wyrmling',level:29,el:'water',model:'wyrm',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.6,speed:3.6,aggro:30,
  pal:{body:0x9cc4e0,belly:0xe4f2fa,ridge:0x3a6a8c,horn:0xe8f6ff,eye:0xff7a3a,wing:0x6a98bc}};
prepDef(WYRMLING_DEF);
/* kit: the boss's own move set (BOSS_KITS in server/boss-kits-*.js); arena: which clearing (ARENAS in vale.js, hoarfrost.js, beach.js); add: what it
   summons; totem: the Rootwarden's shield-phase totems; prop: what shelters players in Vetrmaw's blizzard; totems: the totems' name for the boss bar;
   bar: what the boss bar says while the boss is in a mode (1 airborne, 2 hidden, 3 shielded, 4 whiteout, 5 blizzard) or stunned */
const BOSS_DEFS=[
  {def:BOSS_DEF,arena:'boss',kit:'roots',totem:TOTEM_DEF,add:THORN_DEF,short:'The Rootwarden',totems:'Heartwood Totems',bar:{stun:'Stunned!'}},
  {def:CARAPAX_DEF,arena:'boss20b',kit:'tide',add:HATCH_DEF,short:'Carapax',bar:{2:'Burrowed: watch the sand!',stun:'Claws stuck: hit it now!'}},
  {def:AKAONI_DEF,arena:'boss20',kit:'oni',add:IMP_DEF,short:'Akaoni',bar:{1:'Leaping!',stun:'Stunned!'}},
  {def:KYUUBI_DEF,arena:'boss25',kit:'kitsune',add:FOXKIT_DEF,short:'Kyuubi',bar:{2:'Vanished: where will it strike?',stun:'Stunned!'}},
  {def:YMRIK_DEF,arena:'boss26',kit:'rime',add:THRALL_DEF,short:'Ymrik',bar:{4:'Whiteout: stay inside the circle!',stun:'Spent: strike now!'}},
  {def:VETRMAW_DEF,arena:'boss30',kit:'wyrm',add:WYRMLING_DEF,prop:CORE_DEF,short:'Vetrmaw',bar:{1:'Airborne: fend off the wyrmlings',5:'Blizzard: shelter at a Warm Core!',stun:'Grounded: hit it now!'}}];
/* The main quest's grey-veined monsters (docs/MAIN-QUEST.md, W9 and V7): tougher copies of a zone's kind, touched by the grey sleep.
   Not in MON_DEFS: no camps and no board quests; the server spawns a few for each player on that step (server/main-quest.js) */
function greyDef(base,id,name,o){
  const d=Object.assign({},MON_DEFS.find(m=>m.id===base),{id,name,grey:true,zone:undefined,count:undefined,aggro:18},o); d.pal=Object.assign({},d.pal,o.pal);
  for(const k of ['rad','height','hp','dmg','xp','color']) delete d[k];
  prepDef(d); d.xp=Math.round(d.xp*3); return d;
}
const GREY_DEFS=[
  greyDef('bogslime','greybog','Grey-veined Bog Slime',{scale:1.9,hpK:2.6,per:0,glow:0x101418,pal:{body:0x6a7470,top:0xc8d0cc,mouth:0x14181a}}),
  greyDef('kitsune','greyfox','Grey Kitsune',{scale:1.15,hpK:2.2,glow:0x101418,pal:{body:0x8a8a86,belly:0xd8d8d2,tip:0x4a4a48,eye:0xe8f0ff,legs:0x3a3a38,tails:3}})];
const ALL_MON_DEFS=[...MON_DEFS,...GREY_DEFS,...BOSS_DEFS.flatMap(b=>[b.def,b.totem,b.add,b.prop].filter(Boolean))];
