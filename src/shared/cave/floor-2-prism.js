//@ Cave floor 2, the Prism Hollows (monsters level 35-44, added in a later step): giant geodes, light split into colours, echoing round chambers; its generator options and look
/* Agent map. defineCaveFloor (shared/cave-map.js); see floor-1-grotto.js for the look keys. `hues` are the colours the geodes and light shafts take in turn. No monsters yet (mobs is empty). */
defineCaveFloor({id:'prism',n:2,name:'The Prism Hollows',theme:'prism',lv:[35,44],seed:4093,mobs:[],
  gen:{cells:168,chambers:10,rMin:9,rMax:15,rStart:8,tw:3,wind:6,side:9,loops:3,style:'geode',camps:20,pools:1,start:[0.89,0.5],deep:[0.11,0.45]},
  look:{wall:0x5a5470,wall2:0x44486a,floor:0x403c52,ceil:0x2a2640,fog:0x0b0614,amb:0.3,light:0xffffff,hues:[0xff6ad0,0x6ae0ff,0xffd05a,0x7aff9a,0xa07aff],h0:5,hk:1.5,hmax:18,wobble:0.35,far:52,fx:['geodes','beams','crystals','sparkle']}});
