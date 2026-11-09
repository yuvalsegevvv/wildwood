//@ Cave floor 5, the Frostbound Vaults (monsters level 65-74): frozen geodes, blue ice light, rime-furred halls; its generator options, look and ten monsters
/* Agent map. defineCaveFloor (shared/cave-map.js); the Prism theme's builder with an ice palette (look.hues are all blues and whites). See floor-1-grotto.js for the look keys. Pays Echo Shards only (no set has a floor-5 skill). */
caveMobDef('bogslime','rimeslime','Rime Slime',{level:65,el:'water',scale:1.9,glow:0x0a2a40,pal:{deco:'moss',body:0x8fd8ff,top:0xf0ffff,mouth:0x06203a}});
caveMobDef('crystalbeetle','icebeetle','Frostplate Beetle',{level:66,el:'water',scale:1.6,glow:0x0a2a40,pal:{kind:'rock',shell:0xbfe4f4,seam:0x4aa8e0,sheen:0xffffff,head:0x7aa8c0,horn:0xe8f8ff,eye:0x9fffff,legs:0x6a98b0}});
caveMobDef('rimewisp','hoarwisp','Hoar Wisp',{level:67,el:'light',scale:1.4,glow:0x0a3a50,pal:{body:0xc8f0ff,core:0xffffff,eye:0x0a3a50}});
caveMobDef('gloombat','frostbat','Frost Bat',{level:68,el:'air',scale:1.55,pal:{body:0x9ab8d8,belly:0xe8f4ff,wing:0x7a9ac0,horn:0xffffff,eye:0x9fffff}});
caveMobDef('granitegolem','glacierwarden','Glacier Warden',{level:69,el:'earth',scale:2.0,glow:0x0a2a40,pal:{kind:'rock',style:'granite',lichen:0,crack:0x7ae0ff,bark:0x7aa0c0,c1:0xa8d0e8,c2:0xc0e0f0,c3:0x88b0d0,eyes:0x9fffff}});
caveMobDef('hobgoblin','rimegoblin','Rime Goblin',{level:70,el:'water',scale:1.0,pal:{form:'hob',garb:'studs',skin:0xa8c8d8,eyes:0xe8ffff,top:'jacket',topColor:0x3a5a78,bottom:'trousers',bottomColor:0x24384c,hat:'none',hatColor:0x2b2420,club:0x8aa8c0}});
caveMobDef('snowleopard','iceprowler','Ice Prowler',{level:71,el:'water',scale:1.6,pal:{cat:1,pattern:'rosette',spot:0x4a6a90,body:0xe0f0fa,belly:0xffffff,tip:0x3a5a80,eye:0x7affff,legs:0xa8c0d8,tails:1}});
caveMobDef('cragwyvern','rimewyrm','Rime Wyrm',{level:72,el:'water',scale:1.1,pal:{stone:1,body:0xb8d8ec,belly:0xf0faff,ridge:0x4a88c0,horn:0xffffff,eye:0x7affff,wing:0x98c0e0}});
caveMobDef('dustdjinn','blizzarddjinn','Blizzard Djinn',{level:73,el:'air',scale:1.3,glow:0x0a3a50,pal:{dust:0xd8f4ff,body:0x4a88c8,skin:0xc8e0f0,gold:0x9fffff,turban:0xe8f8ff,eye:0xffffff}});
caveMobDef('efreet','frostefreet','Frostbound Efreet',{level:74,el:'dark',scale:1.8,glow:0x0a2a50,pal:{fire:1,flame:0x7ae0ff,body:0x2a58a0,skin:0x6a98c8,gold:0xc8f0ff,turban:0x102a50,eye:0xe8ffff}});
defineCaveFloor({id:'frost',n:5,name:'The Frostbound Vaults',theme:'frost',lv:[65,74],seed:5531,
  mobs:['rimeslime','icebeetle','hoarwisp','frostbat','glacierwarden','rimegoblin','iceprowler','rimewyrm','blizzarddjinn','frostefreet'],
  gen:{cells:168,chambers:11,rMin:8.5,rMax:14,rStart:8,tw:3,wind:7,side:9,loops:3,style:'geode',camps:22,pools:2,start:[0.11,0.88],deep:[0.88,0.12]},
  look:{music:'rimehold',wall:0x5a7490,wall2:0x44668a,floor:0x405a72,ceil:0x2a4060,fog:0x0a1a2e,amb:0.4,light:0xdff4ff,hues:[0x9fe8ff,0xffffff,0x6ab0ff,0xc8f0ff,0x8ad0ff],h0:5,hk:1.5,hmax:18,wobble:0.35,far:62,fx:['geodes','beams','crystals','sparkle']}});
