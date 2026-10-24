//@ Cave floor 3, the Drowned Galleries (monsters level 45-54, added in a later step): flooded old halls with pillars, an underground river, waterfalls indoors; its generator options and look
/* Agent map. defineCaveFloor (shared/cave-map.js); see floor-1-grotto.js for the look keys. The halls are rectangular and flooded ankle-deep (gen.flood), pillars stand in a grid (gen.pillars), the river runs along the
   main way (gen.river); look.masonry draws the rock as laid stone. No monsters yet (mobs is empty). */
defineCaveFloor({id:'drowned',n:3,name:'The Drowned Galleries',theme:'drowned',lv:[45,54],seed:6151,mobs:[],
  gen:{cells:168,chambers:11,rMin:7,rMax:11,rStart:8,tw:2.8,wind:3,side:9,loops:4,style:'hall',camps:22,pools:0,flood:true,pillars:true,river:true,waterDepth:0.5,relief:0.3,start:[0.11,0.45],deep:[0.89,0.55]},
  look:{wall:0x5e6866,wall2:0x444e4c,floor:0x363e3c,ceil:0x222828,fog:0x03100f,amb:0.3,light:0x6af0d0,water:0x2a9a90,h0:6,hk:1.0,hmax:14,wobble:0.12,far:50,masonry:true,fx:['water','falls','pillars','moss']}});
