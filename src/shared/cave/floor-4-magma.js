//@ Cave floor 4, the Magma Heart (monsters level 55-64, added in a later step): lava tubes, obsidian, ember vents, heat shimmer; its generator options and look
/* Agent map. defineCaveFloor (shared/cave-map.js); see floor-1-grotto.js for the look keys. Lava pools (gen.lava) are not walkable; the layout stays one piece around them. No monsters yet (mobs is empty). */
defineCaveFloor({id:'magma',n:4,name:'The Magma Heart',theme:'magma',lv:[55,64],seed:8219,mobs:[],
  gen:{cells:168,chambers:15,rMin:5.5,rMax:10,rStart:8,tw:2.4,wind:11,side:10,loops:3,style:'tube',camps:22,pools:0,lava:8,start:[0.5,0.89],deep:[0.5,0.11]},
  look:{wall:0x34302e,wall2:0x24201e,floor:0x2a2624,ceil:0x1c1816,fog:0x120502,amb:0.42,light:0xff8a3a,glow:0xff6a20,lava:0xff5a1a,h0:4,hk:1.1,hmax:11,wobble:0.7,far:40,fx:['lava','vents','embers','obsidian']}});
