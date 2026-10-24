//@ Cave floor 1, the Glowworm Grotto (monsters level 25-34): wet limestone, blue glowworm ceilings, still pools, stalactites; its generator options, its look for the client and its ten monsters
/* Agent map. defineCaveFloor (shared/cave-map.js). The look keys are read by game/cave/view.js and look.js: wall / wall2 (rock and its strata), floor, ceil, fog, amb (how bright the unlit rock is), light (the main emitters),
   h0 / hk / hmax (the ceiling: h0 m at the rock, hk m more per cell away from it, at most hmax), wobble (how much the walls bulge), far (sight in m), fx (feature names the theme builder switches on). */
caveMobDef('bogslime','glowslime','Glow Slime',{level:25,el:'water',scale:1.55,per:3,glow:0x082a3a,pal:{deco:'moss',body:0x2a7aa0,top:0x8fe0ff,mouth:0x061a28}});
caveMobDef('kodama','lanterncap','Lantern Cap',{level:26,el:'light',scale:1.4,glow:0x0a2a30,pal:{spirit:1,cap:0x4ad0e0,spot:0xe8ffff,stem:0xd8ece8,gill:0x7ab8c0,feet:0xc8e0dc}});
caveMobDef('ironshell','palebeetle','Pale Cave Beetle',{level:27,el:'earth',scale:1.35,pal:{shell:0xc4bfa6,seam:0x5a5648,sheen:0xece8d0,head:0x8a8672,horn:0xe0d8b8,eye:0x7fd8ff,legs:0x6a6652}});
caveMobDef('gloombat','grottobat','Grotto Bat',{level:28,el:'air',scale:1.4,pal:{body:0x6a7a8e,belly:0xa8b8c4,wing:0x5a6a80,horn:0xd8e4f0,eye:0x7fe8ff}});
caveMobDef('ancient','stoneward','Stalagmite Warden',{level:29,el:'earth',scale:1.45,glow:0x061418,pal:{kind:'moss',bark:0xb6ae98,c1:0x3a7a62,c2:0x4a8a70,c3:0x2e6a56,eyes:0x7fe8ff}});
caveMobDef('hobgoblin','blindgoblin','Blind Cave Goblin',{level:30,el:'dark',scale:0.95,pal:{form:'hob',garb:'studs',skin:0xaaa89a,eyes:0xc8d8e0,top:'jacket',topColor:0x4a5a66,bottom:'trousers',bottomColor:0x2e3a42,hat:'none',hatColor:0x2b2420,club:0x6a6a62}});
caveMobDef('dunescorpion','ghostscorpion','Ghost Scorpion',{level:31,el:'dark',scale:1.5,pal:{shell:0xd0ccc0,sheen:0xf4f0e0,head:0x8a8678,eye:0x7fe0ff,legs:0x9a9688,horn:0x6a6658}});
caveMobDef('rimewisp','glowwisp','Glowworm Wisp',{level:32,el:'light',scale:1.25,glow:0x0a3a34,pal:{body:0x4ae8d0,core:0xffffff,eye:0x053a36}});
caveMobDef('cragwyvern','limewyrm','Limestone Wyrm',{level:33,el:'earth',scale:0.95,pal:{stone:1,body:0xb8b09a,belly:0xe8e0cc,ridge:0x6a6a58,horn:0xf0ead0,eye:0x7fe8ff,wing:0xa09a86}});
caveMobDef('snowleopard','palestalker','Pale Stalker',{level:34,el:'dark',scale:1.5,pal:{cat:1,pattern:'rosette',spot:0x4a5a66,body:0xb8c4c8,belly:0xe8f0f0,tip:0x2a3a46,eye:0x9fe8ff,legs:0x7a8a90,tails:1}});
defineCaveFloor({id:'grotto',n:1,name:'The Glowworm Grotto',theme:'grotto',lv:[25,34],seed:2711,
  mobs:['glowslime','lanterncap','palebeetle','grottobat','stoneward','blindgoblin','ghostscorpion','glowwisp','limewyrm','palestalker'],
  gen:{cells:168,chambers:14,rMin:7,rMax:14,rStart:8,tw:3,wind:9,side:10,loops:3,style:'cavern',camps:32,pools:3,start:[0.11,0.5],deep:[0.89,0.55]},
  look:{wall:0x8c8a78,wall2:0x6e7a82,floor:0x4c4e4c,ceil:0x3a3e44,fog:0x040912,amb:0.34,light:0x66ccff,h0:4.2,hk:1.15,hmax:13,wobble:0.55,far:46,fx:['glowworms','stalactites','pools','strata']}});
