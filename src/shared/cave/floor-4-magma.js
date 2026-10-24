//@ Cave floor 4, the Magma Heart (monsters level 55-64): lava tubes, obsidian, ember vents, heat shimmer; its generator options, look and ten monsters
/* Agent map. defineCaveFloor (shared/cave-map.js); see floor-1-grotto.js for the look keys. Lava pools (gen.lava) are not walkable; the layout stays one piece around them. */
caveMobDef('magmaslime','lavaslime','Lava Slime',{level:55,el:'fire',scale:1.9,glow:0x5a1c00,pal:{deco:'crust',body:0xff5a1e,top:0xffd060,mouth:0x3a0c00,crack:0xffe080}});
caveMobDef('crystalbeetle','obsidianbeetle','Obsidian Beetle',{level:56,el:'earth',scale:1.6,glow:0x2a0c00,pal:{kind:'rock',shell:0x20202a,seam:0xff5a1e,sheen:0x8a8a9a,head:0x141418,horn:0x3a3a48,eye:0xffa030,legs:0x2a2a34}});
caveMobDef('onibi','emberwisp','Ember Wisp',{level:57,el:'fire',scale:1.4,glow:0x5a1c00,pal:{body:0xff7a1e,core:0xffe8a0,eye:0x3a0c00}});
caveMobDef('raider','forgeraider','Forge Raider',{level:58,el:'fire',scale:1.2,pal:{skin:0x8a5a40,eyes:0xffd060,topColor:0x4a2018,bottomColor:0x2a1410,club:0x3a3a40,turban:0x8a1c10}});
caveMobDef('dunescorpion','lavascorpion','Lava Scorpion',{level:59,el:'fire',scale:1.8,glow:0x3a1000,pal:{shell:0x2e1a14,sheen:0xff8a30,head:0x1a0c08,eye:0xffd060,legs:0x4a2a1a,horn:0xff5a1e}});
caveMobDef('elderworm','magmaworm','Magma Worm',{level:60,el:'earth',scale:1.8,glow:0x3a1000,pal:{plates:1,body:0x3a2a24,belly:0xc85a20,ridge:0xff6a1e,horn:0xffb060,eye:0xffe080}});
caveMobDef('gravehound','ashstalker','Ash Stalker',{level:61,el:'dark',scale:1.65,glow:0x2a0c00,pal:{body:0x2a2624,belly:0x4a3a34,tip:0xff5a1e,eye:0xff8a30,legs:0x1a1614}});
caveMobDef('dunedrake','obsidiandrake','Obsidian Drake',{level:62,el:'dark',scale:1.5,glow:0x2a0c00,pal:{sail:1,body:0x24242e,belly:0x5a4a48,ridge:0xff5a1e,horn:0xffa060,eye:0xffd060,wing:0x3a2a30}});
caveMobDef('efreet','cinderefreet','Cinder Efreet',{level:63,el:'fire',scale:1.7,glow:0x5a1c00,pal:{fire:1,flame:0xff8a30,body:0xd0381e,skin:0xa04030,gold:0xffd060,turban:0x3a0c08,eye:0xffffa0}});
caveMobDef('granitegolem','obsidiancolossus','Obsidian Colossus',{level:64,el:'earth',scale:2.3,glow:0x3a1000,pal:{kind:'rock',style:'granite',lichen:0,crack:0xff6a1e,bark:0x1c1c24,c1:0x3a3a48,c2:0x4a4a5a,c3:0x2a2a34,eyes:0xffa030}});
defineCaveFloor({id:'magma',n:4,name:'The Magma Heart',theme:'magma',lv:[55,64],seed:8219,
  mobs:['lavaslime','obsidianbeetle','emberwisp','forgeraider','lavascorpion','magmaworm','ashstalker','obsidiandrake','cinderefreet','obsidiancolossus'],
  gen:{cells:168,chambers:15,rMin:5.5,rMax:10,rStart:8,tw:2.4,wind:11,side:10,loops:3,style:'tube',camps:22,pools:0,lava:8,start:[0.5,0.89],deep:[0.5,0.11]},
  look:{music:'gloam2',wall:0x34302e,wall2:0x24201e,floor:0x2a2624,ceil:0x1c1816,fog:0x1c0903,amb:0.46,light:0xff8a3a,glow:0xff6a20,lava:0xff5a1a,h0:4,hk:1.1,hmax:11,wobble:0.7,far:50,fx:['lava','vents','embers','obsidian']}});
