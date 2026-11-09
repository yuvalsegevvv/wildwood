//@ Cave floor 6, the Umbral Deep (monsters level 75-84): the deepest dark, violet glowworm threads, black stone halls; its generator options, look and ten monsters
/* Agent map. defineCaveFloor (shared/cave-map.js); the Grotto theme's builder with a violet palette. See floor-1-grotto.js for the look keys. Pays Echo Shards only (no set has a floor-6 skill). */
caveMobDef('bogslime','umbraslime','Umbral Slime',{level:75,el:'dark',scale:2.0,glow:0x1a0a30,pal:{deco:'moss',body:0x4a2a7a,top:0xb08aff,mouth:0x0a0418}});
caveMobDef('kodama','gloamcap','Gloomcap',{level:76,el:'dark',scale:1.5,glow:0x1a0a30,pal:{spirit:1,cap:0x7a4ad0,spot:0xe8d8ff,stem:0xc8b8e0,gill:0x8a6ab8,feet:0xb0a0c8}});
caveMobDef('ironshell','voidbeetle','Void Beetle',{level:77,el:'dark',scale:1.5,pal:{shell:0x2a2240,seam:0x9a6aff,sheen:0x8a7ab8,head:0x181228,horn:0x5a4a88,eye:0xd0a0ff,legs:0x3a3058}});
caveMobDef('gloombat','shadebat','Shade Bat',{level:78,el:'dark',scale:1.6,pal:{body:0x4a3a6a,belly:0x8a7ab0,wing:0x3a2a5a,horn:0xd8c8f0,eye:0xe0a0ff}});
caveMobDef('ancient','deepwarden','Deep Warden',{level:79,el:'earth',scale:1.7,glow:0x120828,pal:{kind:'moss',bark:0x3a2e50,c1:0x5a3a98,c2:0x6a4aa8,c3:0x4a2e80,eyes:0xe0a0ff}});
caveMobDef('hobgoblin','murkgoblin','Murk Goblin',{level:80,el:'dark',scale:1.05,pal:{form:'hob',garb:'studs',skin:0x6a6088,eyes:0xe0a0ff,top:'jacket',topColor:0x2a2048,bottom:'trousers',bottomColor:0x181030,hat:'none',hatColor:0x181028,club:0x4a4060}});
caveMobDef('dunescorpion','gloamscorpion','Gloam Scorpion',{level:81,el:'dark',scale:1.7,pal:{shell:0x2a2040,sheen:0xa07aff,head:0x181028,eye:0xe0a0ff,legs:0x3a3058,horn:0x7a4ad0}});
caveMobDef('gravehound','umbrahound','Umbral Hound',{level:82,el:'dark',scale:1.8,glow:0x1a0a30,pal:{body:0x241c3a,belly:0x4a3a68,tip:0x9a6aff,eye:0xe0a0ff,legs:0x181028}});
caveMobDef('cragwyvern','nightwyrm','Night Wyrm',{level:83,el:'dark',scale:1.2,pal:{stone:1,body:0x3a2e58,belly:0x6a5a88,ridge:0x9a6aff,horn:0xd8c8f0,eye:0xe0a0ff,wing:0x4a3a70}});
caveMobDef('granitegolem','abyssalcolossus','Abyssal Colossus',{level:84,el:'earth',scale:2.4,glow:0x1a0a30,pal:{kind:'rock',style:'granite',lichen:0,crack:0xa070ff,bark:0x241c3a,c1:0x3a2e58,c2:0x4a3e68,c3:0x2a2040,eyes:0xe0a0ff}});
defineCaveFloor({id:'umbral',n:6,name:'The Umbral Deep',theme:'grotto',lv:[75,84],seed:8113,
  mobs:['umbraslime','gloamcap','voidbeetle','shadebat','deepwarden','murkgoblin','gloamscorpion','umbrahound','nightwyrm','abyssalcolossus'],
  gen:{cells:168,chambers:14,rMin:7,rMax:13,rStart:8,tw:3,wind:9,side:10,loops:3,style:'hall',camps:24,pools:3,start:[0.5,0.89],deep:[0.5,0.11]},
  look:{music:'gloam2',wall:0x3a3450,wall2:0x2a2640,floor:0x2c2840,ceil:0x1a1630,fog:0x0a0618,amb:0.36,light:0xb08aff,h0:4.2,hk:1.15,hmax:13,wobble:0.55,far:54,fx:['glowworms','stalactites','pools','strata']}});
