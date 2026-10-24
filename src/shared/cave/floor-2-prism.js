//@ Cave floor 2, the Prism Hollows (monsters level 35-44): giant geodes, light split into colours, echoing round chambers; its generator options, look and ten monsters
/* Agent map. defineCaveFloor (shared/cave-map.js); see floor-1-grotto.js for the look keys. `hues` are the colours the geodes and light shafts take in turn. */
caveMobDef('brineslime','geodeslime','Geode Slime',{level:35,el:'light',scale:1.7,glow:0x2a0a3a,pal:{deco:'crust',crust:0xd070ff,body:0x8a3ac8,top:0xf0b0ff,mouth:0x1e0630}});
caveMobDef('crystalbeetle','prismbeetle','Prism Beetle',{level:36,el:'light',scale:1.5,glow:0x0a2a3a,pal:{kind:'ice',shell:0x6ad0f0,seam:0x2a4a7a,sheen:0xe8ffff,head:0x3a5a9a,horn:0xff9ae8,eye:0xffe27a,legs:0x2e4a78}});
caveMobDef('glasswisp','prismwisp','Prism Wisp',{level:37,el:'light',scale:1.35,glow:0x2a0a3a,pal:{shards:0xff9ae8,body:0xc890ff,core:0xffffff,eye:0x3a1058}});
caveMobDef('granitegolem','amethystgolem','Amethyst Golem',{level:38,el:'earth',scale:2,glow:0x1e0a30,pal:{kind:'rock',style:'granite',lichen:0,crack:0xe070ff,bark:0x50407a,c1:0x8a60d0,c2:0xa880e8,c3:0x6a4aa8,eyes:0xff9ae8}});
caveMobDef('gloombat','shardbat','Shard Bat',{level:39,el:'air',scale:1.5,pal:{body:0x5a4a8a,belly:0x9a88d0,wing:0x7a5ac0,horn:0xff9ae8,eye:0xffe27a}});
caveMobDef('minegoblin','geodedelver','Geode Delver',{level:40,el:'earth',scale:1.1,pal:{skin:0x9a88a8,eyes:0xff9ae8,topColor:0x3e3a6a,bottomColor:0x2a2650,hatColor:0x8a70c0,club:0x8a80b0}});
caveMobDef('glassscorpion','crystalscorpion','Crystal Scorpion',{level:41,el:'light',scale:1.75,glow:0x0a2a3a,pal:{glass:1,shell:0x4a8ad8,sheen:0xb8f0ff,head:0x2a3a80,eye:0xffe27a,legs:0x3a4a98,horn:0xff9ae8}});
caveMobDef('duneprowler','prismstalker','Prism Stalker',{level:42,el:'air',scale:1.5,pal:{cat:1,pattern:'rosette',fangs:1,spot:0x6a4ab8,body:0xb89ae8,belly:0xf0e0ff,tip:0x4a3a8a,eye:0x7aff9a,legs:0x8a70c0,tails:1}});
caveMobDef('dunedrake','geodedrake','Geode Drake',{level:43,el:'light',scale:1.35,glow:0x1e0a30,pal:{sail:1,body:0xa078e0,belly:0xf0d8ff,ridge:0xff6ad0,horn:0xffe8ff,eye:0x7affe0,wing:0xc8a0f0}});
caveMobDef('dustdjinn','prismdjinn','Prism Djinn',{level:44,el:'light',scale:1.2,glow:0x2a0a3a,pal:{dust:0xff9ae8,body:0x7a4ac8,skin:0xd8b8f0,gold:0x7aeaff,turban:0xffe27a,eye:0xffffff}});
defineCaveFloor({id:'prism',n:2,name:'The Prism Hollows',theme:'prism',lv:[35,44],seed:4093,
  mobs:['geodeslime','prismbeetle','prismwisp','amethystgolem','shardbat','geodedelver','crystalscorpion','prismstalker','geodedrake','prismdjinn'],
  gen:{cells:168,chambers:10,rMin:9,rMax:15,rStart:8,tw:3,wind:6,side:9,loops:3,style:'geode',camps:20,pools:1,start:[0.89,0.5],deep:[0.11,0.45]},
  look:{music:'rimehold',wall:0x5a5470,wall2:0x44486a,floor:0x403c52,ceil:0x2a2640,fog:0x160c26,amb:0.36,light:0xffffff,hues:[0xff6ad0,0x6ae0ff,0xffd05a,0x7aff9a,0xa07aff],h0:5,hk:1.5,hmax:18,wobble:0.35,far:62,fx:['geodes','beams','crystals','sparkle']}});
