//@ Monster families (FAM), the 112 monsters (MON_DEFS: 15 home, 5 on the home forest's edges, 20 in the Sakura Vale, 18 in the Hoarfrost Reach, 14 in the Greyspine, 18 in the Sunscar, 22 in the Gloamhorn), defAt (a def's numbers at a level; above level 60 monsters creep tougher, bosses also stronger), prepDef, the twelve bosses (BOSS_DEFS) with the move set (kit) and summons of each, the main quest's grey-veined monsters (GREY_DEFS). Pure.
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
  keg:   {hpK:1,dmgPct:0,atk:99,speed:0,rad:0.5, height:1.1,aggro:0,sound:'click',per:0},   // Garrick's powder keg (dungeons/bosses.js)
  wyrm:  {hpK:1.0,dmgPct:0.12,atk:2.2,speed:2.6,rad:0.9,height:2.0,aggro:16,sound:'groan',per:1},
  gryphon:{hpK:1.0,dmgPct:0.12,atk:2.1,speed:3.2,rad:0.8,height:2.0,aggro:16,sound:'groan',per:1},
  scorpion:{hpK:1.05,dmgPct:0.1,atk:1.5,speed:3.0,rad:0.7,height:1.0,aggro:12,sound:'click',per:3},   // the Sunscar's (game/combat/monster-desert.js)
  cactus: {hpK:1.35,dmgPct:0.13,atk:2.3,speed:1.5,rad:0.8,height:3.0,aggro:10,sound:'groan',per:1},
  sandworm:{hpK:1.2,dmgPct:0.12,atk:2.2,speed:2.4,rad:0.95,height:2.0,aggro:14,sound:'groan',per:1},
  djinn:  {hpK:0.95,dmgPct:0.11,atk:1.8,speed:2.8,rad:0.5,height:2.3,aggro:15,sound:'pip',per:2},
  sentinel:{hpK:1.0,dmgPct:0.12,atk:2.6,speed:1.9,rad:1.0,height:3.1,aggro:0,sound:'groan',per:0},
  bat:    {hpK:0.8,dmgPct:0.09,atk:1.4,speed:4.0,rad:0.45,height:1.0,aggro:16,sound:'pip',per:4}   // the Gloamhorn's (game/combat/monster-gloam.js)
};
const MON_DEFS=[
  {id:'slime',     name:'Slime',            level:1,el:'water', model:'slime', scale:1,   aggro:0, pal:{body:0x5fcf5a,top:0xc2f7a8,mouth:0x1d4a1a}},
  {id:'shroom',    name:'Shroomling',       level:2,el:'air', model:'shroom',scale:1,   aggro:0, pal:{cap:0xc0392b,spot:0xf4efe4,stem:0xe8dcc0,gill:0xcdbf9c,feet:0xd8c8a4}},
  {id:'beetle',    name:'Horned Beetle',    level:3, model:'beetle',scale:1,   pal:{shell:0x28505e,seam:0x14262c,sheen:0x5fa0a8,head:0x1e2a30,horn:0x3a3028,eye:0xd94a3a,legs:0x1a2226}},
  {id:'boar',      name:'Wild Boar',        level:4, model:'boar',  scale:1,   pal:{body:0x5a4030,ridge:0x2e2016,head:0x503828,snout:0x8a6050,tusk:0xf2ead8,legs:0x3a2a1e,eye:0x111111}},
  {id:'goblin',    name:'Goblin',           level:5, model:'goblin',scale:0.72,pal:{form:'goblin',skin:0x6f9a3a,eyes:0xd9c23a,top:'tshirt',topColor:0x5a4030,bottom:'shorts',bottomColor:0x4a3a2a,hat:'none',hatColor:0x2b2420,club:0x5a3e28}},
  {id:'treant',    name:'Treant',           level:6,el:'earth', model:'treant',scale:1,   pal:{bark:0x4e3a28,c1:0x3f6d2a,c2:0x4a7a30,c3:0x355f25,eyes:0xffe066}},
  {id:'bogslime',  name:'Bog Slime',        level:7,el:'water', model:'slime', scale:1.35,per:3, pal:{deco:'moss',body:0x3f6f6a,top:0x8fc0a0,mouth:0x10201e}},
  {id:'deathcap',  name:'Deathcap',         level:8,el:'dark', model:'shroom',scale:1.3, glow:0x0a2a10, pal:{cap:0x5b3a78,spot:0xb8f06a,stem:0xcfc8b8,gill:0x8a7fa0,feet:0xb8b0a0}},
  {id:'ironshell', name:'Ironshell Beetle', level:9,el:'earth', model:'beetle',scale:1.3, hpK:1.3, pal:{kind:'iron',shell:0x6a6e74,seam:0x2a2c30,sheen:0xd8c070,head:0x3a3c40,horn:0xc9a13a,eye:0xffa040,legs:0x2a2c30}},
  {id:'direboar',  name:'Dire Boar',        level:10,el:'dark',model:'boar',  scale:1.35,pal:{spiky:1,body:0x2a2420,ridge:0x8a2f2f,head:0x241e1a,snout:0x5a4040,tusk:0xe8e0c8,legs:0x1a1614,eye:0xff3020}},
  {id:'hobgoblin', name:'Hobgoblin',        level:11,el:'fire',model:'goblin',scale:0.9, pal:{form:'hob',garb:'studs',skin:0xa0522d,eyes:0xffd040,top:'jacket',topColor:0x6a6e74,bottom:'trousers',bottomColor:0x3a2a1e,hat:'none',hatColor:0x2b2420,club:0x4a4a4a}},
  {id:'rotwood',   name:'Rotwood Treant',   level:12,el:'fire',model:'treant',scale:1.25,pal:{kind:'dead',bark:0x3a2e28,c1:0xa0522d,c2:0xc27a2c,c3:0x7a3a20,eyes:0xff7a30}},
  {id:'magmaslime',name:'Magma Slime',      level:13,el:'fire',model:'slime', scale:1.5, per:3, glow:0x3a1000, dmgPct:0.08, pal:{deco:'crust',body:0xd8551e,top:0xffd040,mouth:0x3a0a00,crack:0xffe060}},
  {id:'chieftain', name:'Goblin Chieftain', level:14,el:'dark',model:'goblin',scale:1.0, per:2, hpK:1.3, dmgPct:0.11, pal:{form:'hob',garb:'chief',skin:0x4a6a7a,eyes:0xff4030,top:'hoodie',topColor:0x6b2a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x2b2420,club:0x2b2b2e}},
  {id:'ancient',   name:'Ancient Treant',   level:15,el:'light',model:'treant',scale:1.5, hpK:1.6, glow:0x000814, pal:{kind:'moss',bark:0x8a8478,c1:0x1f4a3a,c2:0x2a5a48,c3:0x183a2e,eyes:0x7fd8ff}},
  /* the home forest's edges: each lives in its own edge zone (zone, see EDGE_ZONES in zones.js), count of them in all.
     Levels 16-20: side content for players who came back from the vale strong enough, not part of the main quest */
  {id:'crab',      name:'Shore Crab',       level:16,el:'water',model:'beetle',scale:1.15,zone:'shore',count:18,hpK:1.2,pal:{shell:0xc0452a,seam:0x5a1a10,sheen:0xf08a60,head:0x8a2a18,horn:0xc0452a,eye:0x111111,legs:0xa83a22,crab:1}},
  {id:'tideslime', name:'Tide Slime',       level:17,el:'water',model:'slime', scale:1.4, zone:'shore',count:16,per:3,glow:0x04202a,pal:{deco:'shell',body:0x3aa8c8,top:0xbff0ff,mouth:0x0a2a3a}},
  {id:'scarab',    name:'Sun Scarab',       level:18,el:'fire', model:'beetle',scale:1.3, zone:'sunfoot',count:20,pal:{kind:'scarab',shell:0xc0782e,seam:0x4a2a10,sheen:0xffd070,head:0x7a4418,horn:0xe0a040,eye:0x111111,legs:0x5a3418}},
  {id:'ramboar',   name:'Ram-horned Boar',  level:19,el:'earth',model:'boar',  scale:1.4, zone:'foothills',count:18,pal:{ram:1,body:0x8a8478,ridge:0xe8e4dc,head:0x7a7468,snout:0x9a8a7a,tusk:0xf2ead8,legs:0x4a443c,eye:0xffa030}},
  {id:'cragwarden',name:'Crag Warden',      level:20,el:'earth',model:'treant',scale:1.45,zone:'foothills',count:10,hpK:1.4,pal:{kind:'rock',style:'crack',crack:0x9fd8ff,bark:0x6a665e,c1:0x8a8a82,c2:0x9a968c,c3:0x74726a,eyes:0x9fd8ff}},
  /* the Sakura Vale: two kinds per level. Extra look flags for the client models: goblin horns / kasa (straw hat) /
     shell (kappa) / nose + wings (tengu) / weapon 'kanabo' | 'spear' | 'katana'; beetle spider (8 long legs, no horn);
     fox tails (how many); wisp ghost (a trailing body and arms instead of a flame) */
  {id:'sakuraslime',name:'Sakura Slime',    level:16,el:'air',model:'slime', scale:1.4, per:3, pal:{deco:'petal',body:0xf29cc0,top:0xffe2ee,mouth:0x6a1a3a}},
  {id:'kappa',     name:'Kappa',            level:16,el:'water',model:'goblin',scale:0.78,pal:{form:'kappa',skin:0x5aa08a,eyes:0xf2e04a,top:'tshirt',topColor:0x3f6a4a,bottom:'shorts',bottomColor:0x2f4a3a,hat:'none',hatColor:0x2b2420,club:0x6a5a3a,shell:0x4a6a3a}},
  {id:'kodama',    name:'Kodama',           level:17,el:'light',model:'shroom',scale:1.25,glow:0x0e1a10,pal:{spirit:1,cap:0xe8ecdc,spot:0xc8e8b8,stem:0xf2f2ea,gill:0xd0d8c4,feet:0xe0e4d4}},
  {id:'kabuto',    name:'Kabuto Beetle',    level:17,el:'fire',model:'beetle',scale:1.45,hpK:1.25,pal:{kind:'kabuto',shell:0x3a1614,seam:0x140806,sheen:0xd05a3a,head:0x1e0e0c,horn:0x2a1410,eye:0xffc040,legs:0x1a0c0a}},
  {id:'kitsune',   name:'Kitsune',          level:18,el:'fire',model:'fox',   scale:1.0, pal:{body:0xd8762a,belly:0xf4efe4,tip:0xf8f4ea,eye:0xffd040,legs:0x3a2418,tails:2}},
  {id:'yamaboar',  name:'Mountain Boar',    level:18,el:'earth',model:'boar',  scale:1.45,pal:{shaggy:1,body:0x6a5a4a,ridge:0xd8d0c0,head:0x5a4a3c,snout:0x8a6a5a,tusk:0xf6f0e0,legs:0x2e241c,eye:0xffa030}},
  {id:'ashigaru',  name:'Goblin Ashigaru',  level:19,model:'goblin',scale:0.95,pal:{form:'hob',garb:'lame',skin:0x7a9a4a,eyes:0xffd040,top:'jacket',topColor:0x6a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'none',hatColor:0x2b2420,club:0x5a3e28,kasa:0xc8a868,weapon:'spear'}},
  {id:'bamboo',    name:'Bamboo Treant',    level:19,el:'earth',model:'treant',scale:1.2, pal:{kind:'bamboo',bark:0x7aa04a,c1:0x5a8a3a,c2:0x6a9a44,c3:0x4a7a30,eyes:0xfff07a}},
  {id:'onibi',     name:'Onibi',            level:20,el:'fire',model:'wisp',  scale:1.0, glow:0x1a3a6a, pal:{body:0x4ab0ff,core:0xe8f6ff,eye:0x0a1a3a}},
  {id:'jorogumo',  name:'Jorogumo',         level:20,el:'dark',model:'beetle',scale:1.5, pal:{lady:1,shell:0x2a2438,seam:0xe8c030,sheen:0x8a5ab0,head:0x1e1a28,horn:0x2a2438,eye:0xff3a5a,legs:0x1a1622,spider:1}},
  {id:'oni',       name:'Red Oni',          level:21,el:'fire',model:'goblin',scale:1.25,per:2,hpK:1.2,pal:{form:'oni',skin:0xc03a2a,eyes:0xffe060,top:'tshirt',topColor:0xe0a030,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x3a3230,horns:0xf2ead8,weapon:'kanabo'}},
  {id:'yurei',     name:'Yurei',            level:21,el:'dark',model:'wisp',  scale:1.1, glow:0x1a2230, pal:{body:0xdce8f0,core:0xffffff,eye:0x101418,hair:0x101014,ghost:1}},
  {id:'shadowfox', name:'Shadow Kitsune',   level:22,el:'dark',model:'fox',   scale:1.15,glow:0x100820,pal:{flame:1,body:0x2a2238,belly:0x4a3a5a,tip:0xb070ff,eye:0xff60d0,legs:0x14101c,tails:3}},
  {id:'jadeslime', name:'Jade Slime',       level:22,el:'water',model:'slime', scale:1.7, per:3, glow:0x06281c, pal:{deco:'crystal',body:0x3aa080,top:0xa0f0d0,mouth:0x0a2a1e}},
  {id:'blueoni',   name:'Blue Oni',         level:23,el:'water',model:'goblin',scale:1.35,per:2,hpK:1.25,pal:{form:'oni',skin:0x3a5ab0,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xd8b040,hat:'none',hatColor:0x2b2420,club:0x6a6e74,horns:0xf2ead8,weapon:'kanabo'}},
  {id:'tengu',     name:'Karasu Tengu',     level:23,el:'air',model:'goblin',scale:0.95,pal:{form:'tengu',garb:'yama',skin:0x2e2e36,eyes:0xffc030,top:'jacket',topColor:0xe8e4dc,bottom:'trousers',bottomColor:0x2a2830,hat:'none',hatColor:0x2b2420,club:0xc0c6cc,nose:0xd8a030,wings:0x1a1a22,weapon:'katana'}},
  {id:'samurai',   name:'Undead Samurai',   level:24,el:'dark',model:'goblin',scale:1.05,per:2,hpK:1.3,dmgPct:0.11,pal:{form:'undead',skin:0xb8b0a0,eyes:0x7fd8ff,top:'plate',topColor:0x8a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'helm',hatColor:0x24222a,club:0xd9e2ea,weapon:'katana'}},
  {id:'goldkabuto',name:'Golden Kabuto',    level:24,el:'light',model:'beetle',scale:1.7, hpK:1.35,pal:{kind:'kabuto',shell:0xc9a13a,seam:0x5a4010,sheen:0xfff0a0,head:0x6a5018,horn:0xe8c860,eye:0xff4020,legs:0x3a2a10}},
  {id:'sakuratreant',name:'Elder Sakura',   level:25,el:'light',model:'treant',scale:1.6, hpK:1.5, glow:0x14040c, pal:{kind:'blossom',bark:0x4a3434,c1:0xf2a6c4,c2:0xf8c4d8,c3:0xe68ab0,eyes:0xff70b0}},
  {id:'raiju',     name:'Raiju',            level:25,el:'air',model:'fox',   scale:1.3, per:2, glow:0x1a1a04, pal:{mane:1,body:0xf2d040,belly:0x3a4a8a,tip:0x9fd8ff,eye:0x7fe0ff,legs:0x2a2a40,tails:1}},
  /* the Hoarfrost Reach (levels 22-30, docs/WORLD.md): two kinds per level, each in its own zone (zone:'h22'..'h30', ZONES in hoarfrost.js).
     Look flags for the client models: fox wolf (a heavy wolf: broad head, small ears, one bushy tail); goblin fur (a shaggy mane and
     shoulders) and weapon 'axe' */
  {id:'frostslime',name:'Frost Slime',      level:22,el:'water',model:'slime', scale:1.6, per:3, zone:'h22', glow:0x06202c, pal:{deco:'shard',body:0x8fd0f0,top:0xeaf8ff,mouth:0x1a3a4e}},
  {id:'snowboar',  name:'Snow Boar',        level:22,el:'water',model:'boar',  scale:1.5, zone:'h22', pal:{shaggy:1,body:0xe4eaee,ridge:0x8aa4b8,head:0xd6dee4,snout:0xb8a8a0,tusk:0xf6f4ea,legs:0x8a96a0,eye:0x3a7ad8}},
  {id:'icebeetle', name:'Ice Beetle',       level:23,el:'water',model:'beetle',scale:1.5, hpK:1.25, zone:'h23', pal:{kind:'ice',shell:0x9ac8e0,seam:0x3a6a8a,sheen:0xf0fbff,head:0x6a98b0,horn:0xd8f2ff,eye:0x1a3a6a,legs:0x5a88a0}},
  {id:'wolf',      name:'Winter Wolf',      level:23,el:'air',  model:'fox',   scale:1.35,zone:'h23', pal:{pattern:'saddle',body:0xb8c2cc,belly:0xeef2f6,tip:0xf8fbff,eye:0x9fe0ff,legs:0x6a747e,tails:1,wolf:1}},
  {id:'reaver',    name:'Frost Reaver',     level:24,el:'dark', model:'goblin',scale:1.05,per:2,hpK:1.2, zone:'h24', pal:{form:'viking',skin:0x7aa0b0,eyes:0xff5a3a,top:'jacket',topColor:0x3a4a5a,bottom:'trousers',bottomColor:0x2a2a34,hat:'helm',hatColor:0x5a636c,club:0xc8ced4,weapon:'axe',horns:0xe8e4d8,fur:0xd8e0e8}},
  {id:'rimewisp',  name:'Rime Wisp',        level:24,el:'air',  model:'wisp',  scale:1.1, zone:'h24', glow:0x102a44, pal:{frost:1,body:0xa8e0ff,core:0xffffff,eye:0x0a2a4a}},
  {id:'rimetreant',name:'Rimebark Treant',  level:25,el:'water',model:'treant',scale:1.7, hpK:1.5, zone:'h25', glow:0x081820, pal:{kind:'snow',bark:0x5a5e62,c1:0xdce8ee,c2:0xc4d8e2,c3:0xa8c4d4,eyes:0x7fe0ff}},
  {id:'yeti',      name:'Yeti',             level:25,el:'water',model:'goblin',scale:1.6, per:2,hpK:1.4,dmgPct:0.11,zone:'h25', pal:{form:'yeti',skin:0xe8eff4,eyes:0x3aa0e8,top:'hoodie',topColor:0xf0f4f8,bottom:'trousers',bottomColor:0xd8e0e8,hat:'none',hatColor:0x2b2420,club:0x8a9aa8,horns:0xbcd8ea,fur:0xf4f8fb}},
  {id:'draugr',    name:'Draugr',           level:26,el:'dark', model:'goblin',scale:1.1, per:2,hpK:1.3,dmgPct:0.11,zone:'h26', pal:{form:'undead',skin:0x6a7a84,eyes:0x7fe8ff,top:'plate',topColor:0x4a5a6a,bottom:'trousers',bottomColor:0x2a3038,hat:'helm',hatColor:0x3a4650,club:0xb8c4cc,weapon:'axe'}},
  {id:'icewraith', name:'Ice Wraith',       level:26,el:'dark', model:'wisp',  scale:1.2, zone:'h26', glow:0x101c2c, pal:{body:0xc0d4e4,core:0xffffff,eye:0x10141c,hair:0x1c2430,ghost:1}},
  {id:'lynx',      name:'Snow Lynx',        level:27,el:'air',  model:'fox',   scale:1.4, zone:'h27', pal:{cat:1,pattern:'lynx',bob:1,body:0xd8d4ca,belly:0xf6f4ee,tip:0x2a2a2e,eye:0xa0e0a0,legs:0x8a867c,tails:1}},
  {id:'crawler',   name:'Glacier Crawler',  level:27,el:'water',model:'beetle',scale:1.7, hpK:1.3, zone:'h27', pal:{shell:0xb0dcf0,seam:0x2a5a7a,sheen:0xffffff,head:0x7aaac0,horn:0xe8f8ff,eye:0xff5a5a,legs:0x4a7a90,spider:1}},
  {id:'frosttroll',name:'Frost Troll',      level:28,el:'water',model:'goblin',scale:1.85,per:2,hpK:1.5,dmgPct:0.12,zone:'h28', pal:{form:'troll',garb:'ice',mottle:0xe8f4fa,skin:0x86b4c8,eyes:0xffe060,top:'tshirt',topColor:0x5a6a78,bottom:'shorts',bottomColor:0x4a5660,hat:'none',hatColor:0x2b2420,club:0x7a8a98,horns:0xdcecf4,fur:0xc8dce8}},
  {id:'blizzhound',name:'Blizzard Hound',   level:28,el:'air',  model:'fox',   scale:1.5, glow:0x0a1c30, zone:'h28', pal:{pattern:'frost',fangs:1,body:0x8aa4c0,belly:0xdce8f4,tip:0xffffff,eye:0xc8f0ff,legs:0x4a5e78,tails:1,wolf:1}},
  {id:'revenant',  name:'Rime Revenant',    level:29,el:'dark', model:'goblin',scale:1.2, per:2,hpK:1.35,dmgPct:0.12,zone:'h29', glow:0x081420, pal:{form:'undead',skin:0x9ab0bc,eyes:0x9fe8ff,top:'plate',topColor:0x6a8298,bottom:'trousers',bottomColor:0x2a3644,hat:'helm',hatColor:0x54687c,club:0xdce8f0,weapon:'katana'}},
  {id:'barrowwight',name:'Barrow Wight',    level:29,el:'dark', model:'wisp',  scale:1.3, glow:0x0c1420, zone:'h29', pal:{body:0x8a9cb0,core:0xe8f4ff,eye:0x0a0e14,hair:0x141a24,ghost:1}},
  {id:'alphawolf', name:'Frostfang Alpha',  level:30,el:'air',  model:'fox',   scale:1.75,hpK:1.3, zone:'h30', glow:0x0c1a2c, pal:{pattern:'saddle',mane:1,maneC:0xcfeaff,fangs:1,scar:0x8a1e22,body:0x9eb4cc,belly:0xeaf2fa,tip:0xffffff,eye:0xff6a5a,legs:0x566a84,tails:1,wolf:1}},
  {id:'glaciergolem',name:'Glacier Golem',  level:30,el:'water',model:'treant',scale:1.95,hpK:1.6, zone:'h30', glow:0x0a2030, pal:{kind:'ice',bark:0x4a5a68,c1:0xa8d8f0,c2:0xc8ecfc,c3:0x88c0e0,eyes:0xffb040}},
  /* the Greyspine (levels 26-32, docs/WORLD.md): two kinds per level, each in its own zone (zone:'g26'..'g32', ZONES in greyzones.js); elements earth and air.
     The home families come back as mountain kinds (granite and quartz slimes, cliff boars and ibex, crystal and slate beetles, miners and trolls, stone treants
     and golems); the creatures of the place use the models that fit: wyverns and drakes the wyrm, the snow leopard the cat, the mist wraith the ghost */
  {id:'granitslime',name:'Granite Slime',    level:26,el:'earth',model:'slime', scale:1.7, per:3, zone:'g26', pal:{deco:'crust',body:0x8a8a86,top:0xc8c8c0,mouth:0x2a2a28,crust:0x55554f}},
  {id:'cliffboar', name:'Cliff Boar',       level:26,el:'earth',model:'boar',  scale:1.5, zone:'g26', pal:{ram:1,body:0x7a746a,ridge:0xd8d4ca,head:0x6a645a,snout:0x9a8a7a,tusk:0xf2ead8,legs:0x3a342c,eye:0xffa030}},
  {id:'crystalbeetle',name:'Crystal Beetle',level:27,el:'earth',model:'beetle',scale:1.5, hpK:1.25, zone:'g27', glow:0x100a22, pal:{kind:'ice',shell:0x9a8ac8,seam:0x3a2a6a,sheen:0xe8e0ff,head:0x6a5a98,horn:0xdcd0ff,eye:0xffd040,legs:0x4a3a78}},
  {id:'stonetreant',name:'Stone Treant',    level:27,el:'earth',model:'treant',scale:1.75,hpK:1.5, zone:'g27', pal:{kind:'rock',bark:0x6a665e,c1:0x7a8a6a,c2:0x8a9a7a,c3:0x6a7a5a,eyes:0xffd860}},
  {id:'minegoblin',name:'Mountain Goblin',  level:28,el:'earth',model:'goblin',scale:1.1, zone:'g28', pal:{form:'hob',garb:'mail',skin:0x8a9a6a,eyes:0xffd040,top:'jacket',topColor:0x5a5a52,bottom:'trousers',bottomColor:0x3a3a34,hat:'helm',hatColor:0x6a6a70,club:0x8a8a90,weapon:'axe'}},
  {id:'snowleopard',name:'Snow Leopard',    level:28,el:'air',  model:'fox',   scale:1.45,zone:'g28', pal:{cat:1,pattern:'rosette',spot:0x3a3a3e,body:0xcfc8bc,belly:0xf2eee6,tip:0x3a3a3e,eye:0xa0e0b0,legs:0x8a8478,tails:1}},
  {id:'cragwyvern',name:'Crag Wyvern',     level:29,el:'air',  model:'wyrm',  scale:0.85,zone:'g29', pal:{stone:1,body:0x8a7a6a,belly:0xd8ccb8,ridge:0x5a4a3a,horn:0xe8dcc0,eye:0xffd040,wing:0xa89a86}},
  {id:'mistwraith',name:'Mist Wraith',      level:29,el:'air',  model:'wisp',  scale:1.25,zone:'g29', glow:0x101820, pal:{body:0xc8d4dc,core:0xffffff,eye:0x10141c,hair:0x1c2430,ghost:1}},
  {id:'quartzslime',name:'Quartz Slime',    level:30,el:'earth',model:'slime', scale:1.9, per:3, zone:'g30', glow:0x14102a, pal:{deco:'crystal',body:0xb8a8d8,top:0xf0e8ff,mouth:0x2a2040}},
  {id:'ibex',      name:'Ibex Ram',         level:30,el:'air',  model:'boar',  scale:1.55,zone:'g30', pal:{shaggy:1,ram:1,ibex:1,body:0x8a7a6a,ridge:0xe8e0d0,head:0x7a6a5a,snout:0x9a8a7a,tusk:0xf2ead8,legs:0x4a4036,eye:0xffa030}},
  {id:'rocktroll', name:'Rock Troll',       level:31,el:'earth',model:'goblin',scale:1.9, per:2,hpK:1.5,dmgPct:0.12,zone:'g31', pal:{form:'troll',garb:'rock',mottle:0x6a8a4a,skin:0x8a8a82,eyes:0xffe060,top:'tshirt',topColor:0x4a4a44,bottom:'shorts',bottomColor:0x3a3a34,hat:'none',hatColor:0x2b2420,club:0x6a6a70,horns:0xcfcac2,fur:0x7a7a72}},
  {id:'slatecrawler',name:'Slate Crawler',  level:31,el:'earth',model:'beetle',scale:1.75,hpK:1.3, zone:'g31', pal:{shell:0x5a5e66,seam:0x22262a,sheen:0xa0a8b8,head:0x3a3e46,horn:0x8a8e96,eye:0xff6a3a,legs:0x2e3238,spider:1}},
  {id:'galedrake', name:'Gale Drake',       level:32,el:'air',  model:'wyrm',  scale:1.3, hpK:1.3, zone:'g32', pal:{stripe:1,body:0x8aa4b4,belly:0xe0eaf0,ridge:0x4a5a6a,horn:0xe8f0f4,eye:0xff7a3a,wing:0x7a94a8}},
  {id:'granitegolem',name:'Granite Golem',  level:32,el:'earth',model:'treant',scale:2.0, hpK:1.6, zone:'g32', glow:0x0a1018, pal:{kind:'rock',style:'granite',lichen:0,crack:0xffb040,bark:0x5a5a58,c1:0x8a8a84,c2:0x9a9a94,c3:0x74746e,eyes:0xffb040}},
  /* the Sunscar (levels 28-36, docs/areas/sunscar.md): two kinds per level, each in its own zone (zone:'s28'..'s36', ZONES in sunzones.js); elements fire, earth and light. res / acc (version 3, docs/ROLLS.md): the chance to
     resist a hit (half damage, no debuff) and the accuracy that takes the same away from your resistance, 0.05 at level 28 rising to 0.20 at 36; a kind has one of them or both. Look flags: slime deco 'crust';
     boar warthog (long upper tusks); goblin turban (a wrapped cloth) and weapon 'scimitar'; the new models scorpion / cactus / sandworm / djinn / sentinel (game/combat/monster-desert.js) */
  {id:'sandslime', name:'Sand Slime',       level:28,el:'earth',model:'slime',   scale:1.8, per:3, zone:'s28', pal:{deco:'crust',body:0xd9b878,top:0xf6e6b4,mouth:0x4a3a18,crust:0xb8944e}},
  {id:'gildedscarab',name:'Gilded Scarab',  level:28,el:'fire', model:'beetle',  scale:1.6, hpK:1.2, zone:'s28', pal:{kind:'scarab',shell:0xd8a42e,seam:0x5a3a08,sheen:0xfff0a0,head:0x7a5a18,horn:0xf0d070,eye:0x111111,legs:0x4a3410}},
  {id:'warthog',   name:'Tusked Warthog',   level:29,el:'earth',model:'boar',    scale:1.65,zone:'s29', pal:{warthog:1,body:0xa88a64,ridge:0x5a4028,head:0x987854,snout:0xb89a74,tusk:0xf8f0dc,legs:0x5a4630,eye:0xffa030}},
  {id:'dunescorpion',name:'Dune Scorpion',  level:29,el:'fire', model:'scorpion',scale:1.45,zone:'s29', pal:{shell:0xb8602a,sheen:0xffb060,head:0x6a3418,eye:0x111111,legs:0x7a4020,horn:0x2a1a10}},
  {id:'raider',    name:'Desert Raider',    level:30,el:'fire', model:'goblin',  scale:1.05,zone:'s30', per:3, pal:{form:'hob',garb:'sash',skin:0x9a7a4a,eyes:0xffd040,top:'jacket',topColor:0xc8a05a,bottom:'trousers',bottomColor:0x6a4a2a,hat:'none',hatColor:0x2b2420,club:0xc8ced4,weapon:'scimitar',turban:0xe8e0c8}},
  {id:'cactustreant',name:'Cactus Treant',  level:30,el:'earth',model:'cactus',  scale:1.4, hpK:1.4, zone:'s30', pal:{bark:0x4f8a3a,c1:0xf06ab0,c2:0xf2ecd0,eyes:0xffe66a}},
  {id:'sandworm',  name:'Sand Worm',        level:31,el:'earth',model:'sandworm',scale:1.1, hpK:1.3, zone:'s31', pal:{body:0xc8a064,belly:0xe8d4a0,ridge:0x7a5a30,horn:0xe0d0a8,eye:0xffa040}},
  {id:'mummy',     name:'Dune Mummy',       level:31,el:'light',model:'goblin',  scale:1.1, per:2, hpK:1.3, dmgPct:0.11, zone:'s31', pal:{form:'undead',garb:'wrap',skin:0xd8c9a0,eyes:0x9fffc0,top:'tshirt',topColor:0xcfc29a,bottom:'trousers',bottomColor:0xc2b48a,hat:'none',hatColor:0x2b2420,club:0x8a7a5a,turban:0xcfc29a,wraps:0xd6cba4}},
  {id:'glasswisp', name:'Glass Wisp',       level:32,el:'light',model:'wisp',    scale:1.3, zone:'s32', glow:0x10243a, pal:{shards:0xdff4ff,body:0xa8d8f0,core:0xffffff,eye:0x14304a}},
  {id:'glassscorpion',name:'Glass Scorpion',level:32,el:'earth',model:'scorpion',scale:1.7, hpK:1.2, zone:'s32', pal:{glass:1,shell:0x3a4458,sheen:0x9ac8ff,head:0x242a38,eye:0xff6a3a,legs:0x2a3040,horn:0x8ac0f0}},
  {id:'dustdjinn', name:'Dust Djinn',       level:33,el:'fire', model:'djinn',   scale:1.1, zone:'s33', glow:0x120a24, pal:{dust:0xe0c898,body:0x7a5ab8,skin:0xb08ad8,gold:0xe0b030,turban:0xd8c8a0,eye:0xffe070}},
  {id:'duneprowler',name:'Dune Prowler',    level:33,el:'earth',model:'fox',     scale:1.4, zone:'s33', pal:{cat:1,pattern:'stripe',fangs:1,body:0xd2a468,belly:0xf0e0bc,tip:0x3a2a1a,eye:0xffd040,legs:0x8a6a3a,tails:1}},
  {id:'tombguard', name:'Tomb Guardian',    level:34,el:'light',model:'goblin',  scale:1.3, per:2, hpK:1.4, dmgPct:0.12, zone:'s34', pal:{form:'undead',skin:0xc8b070,eyes:0xffe880,top:'plate',topColor:0xd9a032,bottom:'trousers',bottomColor:0x7a5a2a,hat:'helm',hatColor:0xd9a032,club:0xe8c860,weapon:'scimitar'}},
  {id:'sandgolem', name:'Sandstone Golem',  level:34,el:'earth',model:'treant',  scale:1.95,hpK:1.6, zone:'s34', pal:{kind:'rock',style:'sand',lichen:0,bark:0x9a6a4a,c1:0xc08a5a,c2:0xd09a68,c3:0xa87448,eyes:0xffd860}},
  {id:'dunedrake', name:'Dune Drake',       level:35,el:'fire', model:'wyrm',    scale:1.3, hpK:1.3, zone:'s35', pal:{sail:1,body:0xc88a50,belly:0xf0dcb0,ridge:0x8a4a20,horn:0xe8dcc0,eye:0xff6a3a,wing:0xd8a870}},
  {id:'sunpriest', name:'Sun Priest',       level:35,el:'light',model:'goblin',  scale:1.15,per:2, hpK:1.2, zone:'s35', pal:{form:'hob',garb:'priest',skin:0x8a6a4a,eyes:0xffe880,top:'hoodie',topColor:0xf0e8d0,bottom:'trousers',bottomColor:0xd9a032,hat:'none',hatColor:0x2b2420,club:0xe8c860,weapon:'spear',turban:0xd9a032,jewel:0xff5a3a}},
  {id:'elderworm', name:'Elder Sand Worm',  level:36,el:'earth',model:'sandworm',scale:1.6, hpK:1.5, zone:'s36', pal:{plates:1,body:0xb88a50,belly:0xe0c890,ridge:0x6a3a1a,horn:0xe8dcc0,eye:0xff8a30}},
  {id:'efreet',    name:'Efreet',           level:36,el:'fire', model:'djinn',   scale:1.5, hpK:1.3, zone:'s36', glow:0x2a0c04, pal:{fire:1,flame:0xffa030,body:0xd8501e,skin:0xe8884a,gold:0xffd040,turban:0xfff0c0,eye:0xfff080}},
  /* the Gloamhorn (levels 30-40, docs/areas/gloamhorn.md): two kinds per level, each in its own zone (zone:'m30'..'m40', ZONES in gloamzones.js); elements water, air, light and dark. res / acc (version 3, docs/ROLLS.md): 0.10 at
     level 30 rising 0.02 a level to 0.30 at 40, a kind has one of them or both. Look flags: djinn pal.siren (long hair instead of a turban, no beard); wisp pal.ghost styles by id (banshee: the yurei's long hair; wraith: a hood;
     weepingwidow: the yurei again, veiled in black); treant kind 'dead' for the driftwood; beetle crab:1 for the gloom crab (the Gloamhorn's, a mauve shell); boar warthog for the walrus-tusked sea boar; the new model 'bat' (monster-gloam.js) */
  {id:'brineslime', name:'Brine Slime',      level:30,el:'water',model:'slime',   scale:1.9, per:3, zone:'m30', pal:{deco:'foam',body:0x3f7f8a,top:0x9ad8d0,mouth:0x0c2428}},
  {id:'gloomcrab',  name:'Gloom Crab',       level:30,el:'water',model:'beetle',  scale:1.7, hpK:1.3, zone:'m30', pal:{shell:0x6a3a48,seam:0x241018,sheen:0xb08aa0,head:0x3a2030,horn:0xc8b8b0,eye:0xffe060,legs:0x4a2838,crab:1}},
  {id:'seaboar',    name:'Sea Boar',         level:31,el:'water',model:'boar',    scale:1.7, zone:'m31', pal:{warthog:1,sea:1,body:0x5c6670,ridge:0x2a323a,head:0x4c565e,snout:0x7a7e86,tusk:0xf0ead8,legs:0x30363c,eye:0xff6a50}},
  {id:'wrecker',    name:'Wrecker Goblin',   level:31,el:'dark', model:'goblin',  scale:1.1, per:3, zone:'m31', pal:{form:'hob',garb:'rope',skin:0x6a7a5a,eyes:0xffc040,top:'jacket',topColor:0x2a3038,bottom:'trousers',bottomColor:0x1e2228,hat:'ranger',hatColor:0x1a1a20,club:0x9aa0a8,weapon:'scimitar'}},
  {id:'driftwood',  name:'Driftwood Treant', level:32,el:'water',model:'treant',  scale:1.5, hpK:1.5, zone:'m32', pal:{kind:'dead',bark:0x8a8478,c1:0x6a7a6a,c2:0x7a8a78,c3:0x5a6a5a,eyes:0x9fe8ff}},
  {id:'drownedsailor',name:'Drowned Sailor', level:32,el:'water',model:'goblin',  scale:1.15,per:3, hpK:1.2, zone:'m32', pal:{form:'undead',skin:0x7a9a8a,eyes:0x9fffe0,top:'jacket',topColor:0x24384a,bottom:'trousers',bottomColor:0x1c2a36,hat:'ranger',hatColor:0x1a1a22,club:0x8a9094,weapon:'scimitar',weeds:0x2f6a46}},
  {id:'siren',      name:'Siren',            level:33,el:'air',  model:'djinn',   scale:1.1, zone:'m33', glow:0x08202a, pal:{siren:1,fin:0x4ac0c8,body:0x2a7a8a,skin:0xc0dcdc,gold:0xd8eef0,turban:0x1a3a5a,eye:0xffffff}},
  {id:'gloombat',   name:'Gloom Bat',        level:33,el:'air',  model:'bat',     scale:1.5, zone:'m33', pal:{body:0x2a2630,belly:0x4a4250,wing:0x3a3042,horn:0xd8d0e0,eye:0xff4a5a}},
  {id:'lanternwisp',name:'Lantern Wisp',     level:34,el:'light',model:'wisp',    scale:1.3, zone:'m34', glow:0x0c2418, pal:{lantern:1,body:0x9fe0c8,core:0xffffff,eye:0x14304a}},
  {id:'banshee',    name:'Banshee',          level:34,el:'dark', model:'wisp',    scale:1.25,zone:'m34', glow:0x14102a, pal:{wail:1,body:0xcfd0e8,core:0xf6f4ff,eye:0x14101c,hair:0x1c1824,ghost:1}},
  {id:'ghoul',      name:'Ghoul',            level:35,el:'dark', model:'goblin',  scale:1.35,per:2, hpK:1.4, dmgPct:0.12, zone:'m35', pal:{form:'undead',skin:0x8a9084,eyes:0xff4a4a,top:'tshirt',topColor:0x3a3a3c,bottom:'shorts',bottomColor:0x2a2a2e,hat:'none',hatColor:0x2b2420,club:0xcfc8b0,ribs:true,claws:0xd8cfa8,rags:0x2a2a2e}},
  {id:'gloomserpent',name:'Gloom Serpent',   level:35,el:'water',model:'sandworm',scale:1.4, hpK:1.4, zone:'m35', pal:{fin:0x2a6a7a,spots:0x9fffe0,barbels:1,body:0x2a4a5a,belly:0x7a9aa0,ridge:0x14262e,horn:0xc8d8d8,eye:0xffe060}},
  {id:'gargoyle',   name:'Gargoyle',         level:36,el:'dark', model:'wyrm',    scale:1.3, hpK:1.5, zone:'m36', pal:{stone:1,crack:0xff6a3a,body:0x6a6a72,belly:0x8a8a92,ridge:0x3a3a42,horn:0xb8b8c0,eye:0xff3a3a,wing:0x4a4a54}},
  {id:'wraith',     name:'Wraith',           level:36,el:'dark', model:'wisp',    scale:1.3, zone:'m36', glow:0x0c0a1c, pal:{body:0x3a3a52,core:0xb8b0e0,eye:0x14101c,hair:0x101018,ghost:1}},
  {id:'gravehound', name:'Grave Hound',      level:37,el:'dark', model:'fox',     scale:1.5, hpK:1.2, zone:'m37', pal:{wolf:1,ribs:1,fangs:1,body:0x1c1a22,belly:0x3a3640,tip:0x14121a,eye:0x9fffe0,legs:0x14121a}},
  {id:'candlewisp', name:'Candle Wisp',      level:37,el:'light',model:'wisp',    scale:1.4, zone:'m37', glow:0x2a2008, pal:{candle:1,body:0xf0d890,core:0xffffff,eye:0x3a2a08}},
  {id:'hollowknight',name:'Hollow Knight',   level:38,el:'dark', model:'goblin',  scale:1.4, per:2, hpK:1.5, dmgPct:0.13, zone:'m38', glow:0x0a0814, pal:{form:'undead',skin:0x5a5a66,eyes:0xb8a0ff,top:'plate',topColor:0x3a3a48,bottom:'trousers',bottomColor:0x24242e,hat:'helm',hatColor:0x30303c,club:0xa8a8b8,weapon:'katana'}},
  {id:'weepingwidow',name:'Weeping Widow',   level:38,el:'dark', model:'wisp',    scale:1.4, zone:'m38', glow:0x08060e, pal:{veil:1,body:0x1a1a22,core:0xd8d0e8,eye:0x6a5a8a,hair:0x08080c,ghost:1}},
  {id:'stormgargoyle',name:'Storm Gargoyle', level:39,el:'air',  model:'wyrm',    scale:1.5, hpK:1.5, zone:'m39', pal:{stone:1,crack:0x7fe0ff,body:0x5a6a7a,belly:0x8a9aaa,ridge:0x2e3a46,horn:0xc8d4e0,eye:0x9fe8ff,wing:0x3a4a5a}},
  {id:'tidehorror', name:'Tide Horror',      level:39,el:'water',model:'sandworm',scale:1.7, hpK:1.5, zone:'m39', glow:0x041820, pal:{fin:0x1a5a6a,spots:0x9fffe0,barbels:1,body:0x1e3a4a,belly:0x5a8090,ridge:0x0c1c26,horn:0xb8d0d8,eye:0x9fffe0}},
  {id:'blackrevenant',name:'Black Revenant', level:40,el:'dark', model:'goblin',  scale:1.6, per:2, hpK:1.6, dmgPct:0.13, zone:'m40', glow:0x0a0610, pal:{form:'undead',skin:0x4a4a58,eyes:0xd8a0ff,top:'plate',topColor:0x26263a,bottom:'trousers',bottomColor:0x181824,hat:'helm',hatColor:0x22223a,club:0x9890c0,weapon:'katana'}},
  {id:'deepsiren',  name:'Deep Siren',       level:40,el:'water',model:'djinn',   scale:1.5, hpK:1.3, zone:'m40', glow:0x041828, pal:{siren:1,fin:0x2a7a9a,body:0x12405a,skin:0x9ac0c8,gold:0xb8e0e8,turban:0x0c2038,eye:0xd8ffff}}
];
/* What a monster's level does to its health and damage past level 60, the top of the old zone tiers (a level-30 monster at tier III). Two creeps, both applied inside defAt so zone tiers, dungeons and prepDef
   get them alike, and nothing at or below level 60 changes:
   - LATE CREEP (every monster except a prop): health x base^(level - 60). A boss's base is 13/12, the growth of f(L) itself (x1.5 at 65, x2.2 at 70, x3.3 at 75, x4.95 at 80); a normal monster's is the gentler
     LATE_CREEP_MOB 1.065 (x1.9 at 70, x2.6 at 75, x3.5 at 80: fights 10-40% shorter than at 13/12, "a bit easier to kill"). A boss's own adds (`bossAdd`, set below and in
     shared/dungeons/bosses.js) keep the boss's base: they are part of the boss fight, which is calibrated as a whole (tools/boss-duel.js). The level debuff on the damage you deal stops at x0.5 (LV_DMG_MIN in
     balance.js, reached 10 levels above you), so beyond that the only thing that keeps a level-80 monster hard for a maxed level-60 hero is its own health; without this a tier V pack fell in a few
     seconds and Vetrmaw in 34 s. Props (the totems and lamps: `hits` without `boss`) keep the "hits" of their design.
   - BOSS CREEP (bosses only): +BOSS_CREEP_HP of health and +BOSS_CREEP_DMG of damage for every level over BOSS_CREEP_LV (level 70: x1.125 / x1.5, level 80: x1.25 / x2). The expected-gear numbers (balance.js)
     stop growing with the player's level, but a maxed level-60 player (level-30 dungeon gear at +10, the symbol, potions) brings far more than they assume and a boss's own damage is cut by 84% armour, so at x1
     a hero who only stands in melee and drinks potions beat every zone tier V and +V dungeon boss (a greater heal potion out-heals a level-80 boss; docs/areas/tiers.md, tools/boss-duel.js). */
const BOSS_CREEP_LV=60, BOSS_CREEP_HP=0.0125, BOSS_CREEP_DMG=0.05;
const bossCreep=(d,L)=>d.boss&&L>BOSS_CREEP_LV?L-BOSS_CREEP_LV:0;
const LATE_CREEP_LV=60, LATE_CREEP_BOSS=13/12, LATE_CREEP_MOB=1.065;
// an ordinary monster has 1% less health for every level it stands at, at most 25% less from level 25 on (bosses, their adds and props keep theirs)
const mobHpK=(d,L)=>d.boss||d.bossAdd||d.hits?1:1-Math.min(0.25,0.01*L);
const lateCreep=(d,L)=>L>LATE_CREEP_LV&&(d.boss||!d.hits)?Math.pow(d.boss||d.bossAdd?LATE_CREEP_BOSS:LATE_CREEP_MOB,L-LATE_CREEP_LV):1;
/* The numbers of a monster def at level L: prepDef gives it those of its own level, a zone tier (tiers.js) asks for those of a higher one.
   Health: the hits a same-level, normally geared player needs (4 + 0.45 x level), times the enemy's toughness; a boss or a prop has a fixed
   count of hits instead (d.hits). Damage: a share of a same-level, normally geared player's health, before that player's armor (a boss: 16%). */
function defAt(d,L){
  const hits=d.hits||(4+0.45*L), k=d.hits?1:d.hpK, rd=1-expRed(L), c=bossCreep(d,L);
  return {hp:Math.round(expDmg(L)*hits*k*highMult(L)*(1+BOSS_CREEP_HP*c)*lateCreep(d,L)*mobHpK(d,L)),
    dmg:d.boss?Math.round(expHP(L)*0.16/rd*(1+BOSS_CREEP_DMG*c)):Math.max(1,Math.round(expHP(L)*d.dmgPct/rd)),
    xp:d.noXp?0:xpFor(L)*(d.boss?25:1)};
}
function prepDef(d){
  const F=FAM[d.model]; for(const k in F) if(d[k]===undefined) d[k]=F[k];
  d.rad=F.rad*d.scale; d.height=F.height*d.scale;
  Object.assign(d,defAt(d,d.level));
  d.color=d.pal.body||d.pal.cap||d.pal.shell||d.pal.skin||d.pal.c1||0x7af0a0;
}
MON_DEFS.forEach(prepDef);
/* Bosses: health = 70 hits of a same-level player, a hit = 16% of that player's health (more above level 60: BOSS_CREEP_* and LATE_CREEP_*, in defAt); props (the Rootwarden's totems, Vetrmaw's warm
   cores) 9 hits. Every boss has its own move set on top of the shared melee and phases (server/boss.js, boss-kits-*.js). */
function bossDef(d){ d.hits=70; prepDef(d); return d; }
function totemDef(d){ d.hits=9; prepDef(d); return d; }
const BOSS_DEF=bossDef({id:'boss',name:'The Rootwarden',level:15,el:'dark',model:'treant',scale:2.4,boss:true,heavy:true,glow:0x12001a,atk:2.6,speed:1.9,aggro:0,
  pal:{bark:0x2e2a36,c1:0x4a2a5a,c2:0x5a3a7a,c3:0x3a1f4a,eyes:0xff5cf0}});
const TOTEM_DEF=totemDef({id:'totem',name:'Heartwood Totem',level:15,el:'dark',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x0a2a10,pal:{style:'heart',crystal:0x7af0a0,band:0x6af08a}});
const THORN_DEF={id:'thornling',name:'Thornling',level:14,el:'dark',model:'treant',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.8,speed:2.4,aggro:30,
  pal:{kind:'thorn',bark:0x3a2e28,c1:0x5a3a7a,c2:0x4a2a5a,c3:0x3a1f4a,eyes:0xff5cf0}};
prepDef(THORN_DEF);
// the Crownsea Shore (level 20): Carapax, the Tide King, a crab the size of a fishing boat (the beetle model with claws: pal.crab). It plays the Rootwarden's music for now (music: a theme other than the one for its level)
const CARAPAX_DEF=bossDef({id:'carapax',name:'Carapax, the Tide King',level:20,el:'water',model:'beetle',scale:3.4,boss:true,heavy:true,glow:0x04202a,atk:2.5,speed:2.0,aggro:0,music:'boss15',
  pal:{shell:0xc8552e,seam:0x5a1a10,sheen:0xffb080,head:0x8a2a18,horn:0xe8dcc0,eye:0x111111,legs:0xa83a22,crab:1}});
const HATCH_DEF={id:'crabhatch',name:'Tide Hatchling',level:19,el:'water',model:'beetle',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{shell:0xc8552e,seam:0x5a1a10,sheen:0xffb080,head:0x8a2a18,horn:0xe8dcc0,eye:0x111111,legs:0xa83a22,crab:1}};
prepDef(HATCH_DEF);
const AKAONI_DEF=bossDef({id:'akaoni',name:'Akaoni, the Gate Demon',level:20,el:'fire',model:'goblin',scale:2.3,boss:true,heavy:true,glow:0x2a0400,atk:2.4,speed:2.1,aggro:0,
  pal:{form:'oni',embers:0xff8a30,skin:0xb02a1e,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x2a2626,horns:0xf6eedc,weapon:'kanabo'}});
const IMP_DEF={id:'oniimp',name:'Oni Imp',level:19,el:'fire',model:'goblin',scale:0.62,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{form:'oni',skin:0xd04a2a,eyes:0xffe060,top:'tshirt',topColor:0x2a2830,bottom:'shorts',bottomColor:0xe0a030,hat:'none',hatColor:0x2b2420,club:0x3a3230,horns:0xf2ead8,weapon:'kanabo'}};
prepDef(IMP_DEF);
const KYUUBI_DEF=bossDef({id:'kyuubi',name:'Kyuubi, the Nine-Tailed',level:25,el:'light',model:'fox',scale:3.2,boss:true,heavy:true,glow:0x1a0c02,atk:2.2,speed:2.6,aggro:0,
  pal:{flame:1,body:0xf4ead4,belly:0xfff8ec,tip:0xffa040,eye:0xff5020,legs:0xd8c8a8,tails:9}});
const FOXKIT_DEF={id:'foxkit',name:'Fox Spirit',level:24,el:'light',model:'fox',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.4,speed:4,aggro:30,glow:0x06142a,
  pal:{flame:1,body:0x6ab8ff,belly:0xd8f0ff,tip:0xffffff,eye:0xffffff,legs:0x2a4a7a,tails:2}};
prepDef(FOXKIT_DEF);
// the Hoarfrost Reach: Ymrik the Rimeking (level 26, a frost giant in his ice hall) and Vetrmaw the frost wyrm (level 30, at the wreck)
const YMRIK_DEF=bossDef({id:'ymrik',name:'Ymrik, the Rimeking',level:26,el:'water',model:'goblin',scale:2.5,boss:true,heavy:true,glow:0x081a2a,atk:2.4,speed:2.1,aggro:0,
  pal:{form:'viking',embers:0xbfefff,skin:0xa8c8dc,eyes:0x9fe8ff,top:'plate',topColor:0x4a6278,bottom:'trousers',bottomColor:0x2a3a4a,hat:'helm',hatColor:0x6a8298,club:0xdce8f0,horns:0xeaf4fa,weapon:'iceaxe',fur:0xe8f0f6}});
const THRALL_DEF={id:'frostthrall',name:'Frost Thrall',level:25,el:'water',model:'goblin',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{form:'undead',skin:0x9ab8c8,eyes:0x9fe8ff,top:'tshirt',topColor:0x4a6278,bottom:'shorts',bottomColor:0x2a3a4a,hat:'none',hatColor:0x2b2420,club:0xdce8f0,horns:0xeaf4fa,weapon:'axe'}};
prepDef(THRALL_DEF);
const VETRMAW_DEF=bossDef({id:'vetrmaw',name:'Vetrmaw, the Frost Wyrm',level:30,el:'water',model:'wyrm',scale:2.3,boss:true,heavy:true,glow:0x081c30,atk:2.2,speed:2.5,aggro:0,
  pal:{body:0x9cc4e0,belly:0xe4f2fa,ridge:0x3a6a8c,horn:0xe8f6ff,eye:0xff7a3a,wing:0x6a98bc}});
const CORE_DEF=totemDef({id:'warmcore',name:'Warm Core',level:30,el:'water',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x3a1400,pal:{style:'core',crystal:0xff9a3a,band:0xffc060}});
const WYRMLING_DEF={id:'wyrmling',name:'Wyrmling',level:29,el:'water',model:'wyrm',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.6,speed:3.6,aggro:30,
  pal:{body:0x9cc4e0,belly:0xe4f2fa,ridge:0x3a6a8c,horn:0xe8f6ff,eye:0xff7a3a,wing:0x6a98bc}};
prepDef(WYRMLING_DEF);
// the Greyspine: the Gryphon Queen (level 29, on her peak) and the mountain golem (level 32, in his cavern at the head of the Sink Valley)
const GRYPHON_DEF=bossDef({id:'gryphonqueen',name:'The Gryphon Queen',level:29,el:'air',model:'gryphon',scale:2.4,boss:true,heavy:true,glow:0x14100a,atk:2.2,speed:3.0,aggro:0,
  pal:{body:0xc8963a,belly:0xe8d4a0,plume:0xf2ecdc,beak:0xe8b830,eye:0xffd040,wing:0xd8b878,tuft:0x8a5a24}});
const EAGLET_DEF={id:'eaglet',name:'Gryphon Eaglet',level:28,el:'air',model:'gryphon',scale:0.62,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.8,aggro:30,
  pal:{body:0xb88a3a,belly:0xe0cc98,plume:0xe8e0cc,beak:0xe0b030,eye:0xffd040,wing:0xc8aa70,tuft:0x7a5020}};
prepDef(EAGLET_DEF);
const GOLEM_DEF=bossDef({id:'mountaingolem',name:'The Mountain Golem',level:32,el:'earth',model:'treant',scale:3.1,boss:true,heavy:true,glow:0x1a0c02,atk:2.7,speed:1.8,aggro:0,
  pal:{kind:'rock',style:'granite',crack:0xff8a30,bark:0x4a4a48,c1:0x7a7a74,c2:0x8a8a84,c3:0x64645e,eyes:0xff8a30}});
const RUBBLE_DEF={id:'rubble',name:'Rubble Imp',level:31,el:'earth',model:'treant',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.8,speed:2.6,aggro:30,
  pal:{kind:'rock',style:'crack',lichen:0,crack:0xff8a30,bark:0x4a4a48,c1:0x7a7a74,c2:0x8a8a84,c3:0x64645e,eyes:0xff8a30}};
prepDef(RUBBLE_DEF);
const JOINT_DEF=totemDef({id:'ironjoint',name:'Iron Joint',level:32,el:'earth',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x1a1208,pal:{style:'joint',crystal:0xc8a060,band:0x8a8a90}});
// the Sunscar: the Glass Guardian (level 32, in the middle of the Glass Fields) and the sand wyrm (level 36, in its pit in the dunes by Redgate Canyon: its fall opens the canyon, shared/sunland.js)
const GLASSGUARD_DEF=bossDef({id:'glassguardian',name:'The Glass Guardian',level:32,el:'light',model:'sentinel',scale:2.2,boss:true,heavy:true,glow:0x14181e,atk:2.6,speed:1.9,aggro:0,  pal:{stone:0xb08a5a,glass:0x1c2230,glow:0xffd870,gold:0xd9a032}});
const SHARD_DEF={id:'glassshard',name:'Glass Shard',level:31,el:'light',model:'wisp',scale:0.62,hpK:0.6,dmgPct:0.07,atk:1.6,speed:3.6,aggro:30,glow:0x10243a,pal:{shards:0xdff4ff,body:0x9ac8f0,core:0xffffff,eye:0x14304a}};
prepDef(SHARD_DEF);
const MIRROR_DEF=totemDef({id:'blackmirror',name:'Black Mirror',level:32,el:'light',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x10141c,pal:{style:'mirror',crystal:0xffd870,band:0x8ac0f0}});
const SANDWYRM_DEF=bossDef({id:'sandwyrm',name:'The Sand Wyrm',level:36,el:'earth',model:'sandworm',scale:2.9,boss:true,heavy:true,glow:0x2a1204,atk:2.3,speed:2.6,aggro:0,  pal:{body:0xb88a50,belly:0xe8d4a0,ridge:0x6a3a1a,horn:0xe8dcc0,eye:0xff8a30}});
const WHELP_DEF={id:'sandwhelp',name:'Sand Whelp',level:35,el:'earth',model:'sandworm',scale:0.6,hpK:0.6,dmgPct:0.07,atk:1.6,speed:3.4,aggro:30,pal:{body:0xc8a064,belly:0xe8d4a0,ridge:0x7a5a30,horn:0xe0d0a8,eye:0xffa040}};
prepDef(WHELP_DEF);

// the Gloamhorn: Captain Dredge (level 35, in the sea caves) and the Gloam Warden (level 40, the lighthouse's keeper turned wraith-lord; its fall will relight the Gloam Light one day)
const CAPTAIN_DEF=bossDef({id:'drownedcaptain',name:'Captain Dredge, the Drowned',level:35,el:'water',model:'goblin',scale:2.5,boss:true,heavy:true,glow:0x04202a,atk:2.5,speed:2.1,aggro:0,  pal:{form:'viking',skin:0x7a9a8a,eyes:0x9fffe0,top:'jacket',topColor:0x1c3448,bottom:'trousers',bottomColor:0x14222e,hat:'ranger',hatColor:0x14141c,club:0xa8b4bc,horns:0xd8dcd0,weapon:'scimitar',weeds:0x2f6a46}});
const DECKHAND_DEF={id:'drownedhand',name:'Drowned Deckhand',level:34,el:'water',model:'goblin',scale:0.75,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.2,aggro:30,
  pal:{form:'undead',skin:0x7a9a8a,eyes:0x9fffe0,top:'tshirt',topColor:0x24384a,bottom:'shorts',bottomColor:0x1c2a36,hat:'none',hatColor:0x2b2420,club:0x8a9094,weapon:'axe',weeds:0x2f6a46}};
prepDef(DECKHAND_DEF);
const WARDEN_DEF=bossDef({id:'gloamwarden',name:'The Gloam Warden',level:40,el:'dark',model:'wisp',scale:3.2,boss:true,heavy:true,glow:0x120a24,atk:2.4,speed:2.2,aggro:0,  pal:{body:0x3a3050,core:0xb8a0e8,eye:0xd8b0ff,hair:0x101018,ghost:1}});
const SPECTER_DEF={id:'gloamspecter',name:'Gloam Specter',level:39,el:'dark',model:'wisp',scale:0.75,hpK:0.6,dmgPct:0.07,atk:1.6,speed:3.4,aggro:30,glow:0x0c0818,
  pal:{body:0x3a3a52,core:0xb8b0e0,eye:0x14101c,hair:0x101018,ghost:1}};
prepDef(SPECTER_DEF);
const LANTERN_DEF=totemDef({id:'soullantern',name:'Soul Lantern',level:40,el:'light',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x1a1230,pal:{style:'lantern',crystal:0xd8c8ff,band:0x8a78c8}});
/* kit: the boss's own move set (BOSS_KITS in server/boss-kits-*.js); arena: which clearing (ARENAS in vale.js, hoarfrost.js, beach.js); add: what it
   summons; totem: the Rootwarden's shield-phase totems; prop: what shelters players in Vetrmaw's blizzard; totems: the totems' name for the boss bar;
   bar: what the boss bar says while the boss is in a mode (1 airborne, 2 hidden, 3 shielded, 4 whiteout, 5 blizzard) or stunned */
const BOSS_DEFS=[
  {def:BOSS_DEF,arena:'boss',kit:'roots',totem:TOTEM_DEF,add:THORN_DEF,short:'The Rootwarden',totems:'Heartwood Totems',bar:{6:'Spring: thornlings sprout!',7:'Summer: the ground scorches!',8:'Autumn: leaves fall like blades!',9:'Winter: the bark is frozen!',stun:'Stunned!'}},
  {def:CARAPAX_DEF,arena:'boss20b',kit:'tide',add:HATCH_DEF,short:'Carapax',bar:{2:'Burrowed: watch the sand!',6:'Molting: the shell is soft!',stun:'Claws stuck: hit it now!'}},
  {def:AKAONI_DEF,arena:'boss20',kit:'oni',add:IMP_DEF,short:'Akaoni',bar:{1:'Leaping!',stun:'Stunned!'}},
  {def:KYUUBI_DEF,arena:'boss25',kit:'kitsune',add:FOXKIT_DEF,short:'Kyuubi',auxText:'Tails left: {n} of 9',bar:{2:'Vanished: where will it strike?',stun:'Stunned!'}},
  {def:YMRIK_DEF,arena:'boss26',kit:'rime',add:THRALL_DEF,short:'Ymrik',bar:{6:'Decree: obey the king!',4:'Whiteout: stay inside the circle!',stun:'Spent: strike now!'}},
  {def:VETRMAW_DEF,arena:'boss30',kit:'wyrm',add:WYRMLING_DEF,prop:CORE_DEF,short:'Vetrmaw',auxText:'Coldest hero: {n}% chill',bar:{1:'Airborne: fend off the wyrmlings',5:'Blizzard: shelter at a Warm Core!',stun:'Grounded: hit it now!'}},
  {def:GRYPHON_DEF,arena:'boss29',kit:'gryphon',add:EAGLET_DEF,short:'The Gryphon Queen',bar:{1:'Airborne: she dives from the sky!',stun:'Grounded: hit her now!'}},
  {def:GOLEM_DEF,arena:'boss32',kit:'golem',add:RUBBLE_DEF,totem:JOINT_DEF,short:'The Mountain Golem',auxText:'Stone shell: {n}%',bar:{stun:'The shell is broken: hit him now!'}},
  {def:GLASSGUARD_DEF,arena:'sboss32',kit:'glass',add:SHARD_DEF,totem:MIRROR_DEF,short:'The Glass Guardian',totems:'Black Mirrors',bar:{6:'Mirror: hold your attacks!',stun:'The glass is clouded: hit it now!'}},
  {def:SANDWYRM_DEF,arena:'sboss36',kit:'sandwyrm',add:WHELP_DEF,short:'The Sand Wyrm',bar:{2:'Burrowed: watch the sand!',7:'Listening: keep moving!',8:'Sandslide: run from the maw!',4:'Sandstorm: stay inside the circle!',stun:'Beached: hit it now!'}},
  {def:CAPTAIN_DEF,arena:'mboss35',kit:'captain',add:DECKHAND_DEF,short:'Captain Dredge',auxText:'Bilge: {n}% (kill his crew to bail)',bar:{2:'The tide is coming in: find the gap!',stun:'Winded: hit him now!'}},
  {def:WARDEN_DEF,arena:'mboss40',kit:'gloamwarden',add:SPECTER_DEF,totem:LANTERN_DEF,short:'The Gloam Warden',totems:'Soul Lanterns',bar:{6:'Darkness: stay in the beam or by a lantern!',4:'Gloom: stay out of the dark pools!',stun:'The dark is torn: hit it now!'}}];
BOSS_DEFS.forEach(b=>{ b.add.bossAdd=true; });   // (the adds of a boss grow like the boss: LATE_CREEP_BOSS)
/* The main quest's grey-veined monsters (docs/MAIN-QUEST.md, W9 and V7): tougher copies of a zone's kind, touched by the grey sleep.
   Not in MON_DEFS: no camps and no board quests; the server spawns a few for each player on that step (server/main-quest.js) */
function greyDef(base,id,name,o){
  const d=Object.assign({},MON_DEFS.find(m=>m.id===base),{id,name,grey:true,zone:undefined,count:undefined,aggro:18},o); d.pal=Object.assign({},d.pal,o.pal);
  for(const k of ['rad','height','hp','dmg','xp','color']) delete d[k];
  prepDef(d); d.xp=Math.round(d.xp*3); return d;
}
const GREY_DEFS=[
  greyDef('bogslime','greybog','Grey-veined Bog Slime',{scale:1.9,hpK:2.6,per:0,glow:0x101418,pal:{deco:'crust',body:0x6a7470,top:0xc8d0cc,mouth:0x14181a,crust:0x3a4244,crack:0xb8c8d4}}),
  greyDef('kitsune','greyfox','Grey Kitsune',{scale:1.15,hpK:2.2,glow:0x101418,pal:{body:0x8a8a86,belly:0xd8d8d2,tip:0x4a4a48,eye:0xe8f0ff,legs:0x3a3a38,tails:3}}),
  // the Greyspine's (G5, the night shift): a granite slime gone grey to the core, drawn to the black stone; level 29, the step's own
  greyDef('granitslime','greystone','Grey-veined Granite Slime',{level:29,scale:2.1,hpK:2.4,per:0,glow:0x101418,pal:{deco:'crust',body:0x4a4a52,top:0x9a9aa6,mouth:0x101014,crust:0x2e2e36,crack:0xb8c8d4}})];
/* The raids' destructibles (docs/RAIDS.md): props with the totems' mechanism (hits, no attack, no XP). A ward seals a raid's inner court, a spawner calls reinforcements, a barricade is cover. Level 40 = a raid's base level (RD_BASE_LV). */
function rdPropDef(d,hits){ d.hits=hits; prepDef(d); return d; }
const RD_WARD_DEF=rdPropDef({id:'rdward',name:'Warding Stone',level:40,el:'light',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x241a0a,pal:{style:'ward',crystal:0xffd870,band:0xe8b84a}},11);
const RD_SPAWNER_DEF=rdPropDef({id:'rdspawner',name:'War Banner',level:40,el:'fire',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x240a0a,pal:{style:'banner',crystal:0xff7a3a,band:0xb02a2a}},8);
const RD_BARRICADE_DEF=rdPropDef({id:'rdbarricade',name:'Barricade',level:40,el:'earth',model:'totem',scale:1,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:0x120e08,pal:{style:'barricade',crystal:0x8a6a3a,band:0x8a6a3a}},5);
const ALL_MON_DEFS=[...MON_DEFS,...GREY_DEFS,RD_WARD_DEF,RD_SPAWNER_DEF,RD_BARRICADE_DEF,...BOSS_DEFS.flatMap(b=>[b.def,b.totem,b.add,b.prop].filter(Boolean))];
