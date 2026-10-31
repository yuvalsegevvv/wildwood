//@ The Emberwake Isles' people: Coralhaven's villagers (VILLAGERS_ISLES, vil 8), the two waystations' keepers (WILD_SITES zotchul / urkuwara) and the small talk and names of Coralhaven's fillers
/* Agent map. VILLAGERS_ISLES: villager defs (same fields as VILLAGERS in villagers.js, all `late`, vil 8) that initNPCs adds after the others; a def with `site:'<id>'` stands at a waystation (WILD_SITES, villagers-outfits.js:
   the entries are added here from EW_WAYS, shared/coralhaven.js) and has no shop, no board. Coralhaven is mostly human (the sea folk: Polynesian in feel) with a few Tidekin (otter-kin, Kin parts 'round' ears, 'thin' tail,
   'whiskers' muzzle). Story: base settings only, Yuval co-writes the rest (docs/EMBERWAKE.md); Chief Makoa and Lani are the main quest's people for later steps. ISLES_NAMES_* / ISLES_TALK feed the filler villagers
   (initNPCs, the vil-8 branch). Tests: client-smoke. Names: ISLES_..., VILLAGERS_ISLES. */
const ISLES_NAMES_M=['Kai','Koa','Makana','Keanu','Tane','Manu','Lono','Ikaika','Kalani','Akamu'], ISLES_NAMES_F=['Leilani','Moana','Malia','Noelani','Kalea','Mahina','Ailani','Naia','Kaia','Iolana'];
const ISLES_TALK=['The reef is green this month. Green means the nets will be full by the new moon.','Eleaka reads the stars like a letter. I read the tide tables and I am usually right too.','Do not whistle on the bridges after dark. The sea hears whistling as an invitation.','They say the island to the east breathes smoke. We do not cross the Ember Bridge after dark.','The Tidekin swim under the bridge faster than I walk over it. I do not take it personally.','A good house leans a little into the wind. A great one leans out of it again.','My grandmother\'s canoe is older than the town. We repaint it every spring and it never complains.','The old city in the jungle has more steps than days in the year. Nobody has finished counting.'];
const ISLES_KIN_FUR=[0x7a4a2c,0x5c4a3a,0x9a6b3f,0x3a3a3f];
for(const w of EW_WAYS){   // the waystations' standing places, in local coordinates round the circle (the keeper faces the circle)
  const c=Math.cos(w.face), s=Math.sin(w.face), at=(lx,lz)=>({x:w.x+lx*c+lz*s,z:w.z-lx*s+lz*c});
  const a=at(-2.6,3.4), b=at(2.8,5.2);
  WILD_SITES[w.id]={x:a.x,z:a.z,face:w.face+Math.PI};
  WILD_SITES[w.id+'2']={x:b.x,z:b.z,face:w.face+Math.PI*0.8};
}
const VILLAGERS_ISLES=[
  /* ---- Coralhaven (VIL8): the sea folk's stilt town ---- */
  { id:'makoa', vil:8, late:true, seed:141, title:'Chief of Coralhaven', icon:'story', name:'Chief Makoa', role:null,
    look:{sex:'male',height:1.08,build:1.35,face:'square',hair:'long',hairColor:0x2a2420,facial:'beard',skin:0xa07250,top:'jacket',topColor:0x2a6ab0,bottom:'trousers',bottomColor:0xe8dcc0,hat:'none',shoes:'boots',shoeColor:0x4a3018},
    behavior:{type:'stationary',at:'well'}, home:'house:4', schedule:'always', voice:{rate:0.82,pitch:0.72},
    lines:['Coralhaven has stood on these posts since before the first of us learned to count. The sea gives and the sea takes, and we have never once been surprised.','You came from the mainland by the old circles. Good. Sit, drink, and tell me what the water has been saying where you were.','Welcome to the Emberwake. We are mostly people here, a few Tidekin, and all of us a little afraid of the mountain in the east.'] },
  { id:'lani', vil:8, late:true, seed:142, title:'Net-mender · the chief\'s daughter', icon:'story', name:'Lani', role:null,
    look:{sex:'female',height:0.98,build:0.9,face:'oval',hair:'long',hairColor:0x1d1410,skin:0xb08060,top:'tshirt',topColor:0xe0583a,bottom:'skirt',bottomColor:0xf0e8d0,hat:'none',shoes:'sneakers',shoeColor:0xe8dcc0},
    behavior:{type:'stationary',at:'plaza0'}, home:'house:2', schedule:'always', voice:{rate:1.05,pitch:1.2},
    lines:['I mend nets because my father says a chief\'s family should have useful hands. I mend them badly, but I do it every day.','You are the one who beat the Herd-Mother? Truly? Then you are the first stranger the bridge has been lifted for in my lifetime.','If you walk east, take water and take care. The jungle road is longer than it looks on a map.'] },
  { id:'eleaka', vil:8, late:true, seed:143, title:'Wayfinder · warden of the bridges', icon:'story', name:'Eleaka', role:null,
    look:{sex:'female',height:1.04,build:1.0,face:'angular',hair:'bun',hairColor:0xc8c4bc,skin:0x9a704c,top:'jacket',topColor:0x2fb6a8,bottom:'trousers',bottomColor:0x2a3a4a,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'gate'}, home:'house:0', schedule:'always', voice:{rate:0.86,pitch:0.9},
    lines:['I read the swell by the soles of my feet and the stars by the back of my neck. The crews cross where I tell them, and I tell them what the sea tells me.','The Herd-Mother\'s fall changed the water. Something let go in it. I had the barrier on the Tide Bridge lifted the same night.','Far in the east the mountain smokes and the stars go out above it, one by one. I mark them in my log. There are fewer every year.'] },
  { id:'ottah', vil:8, late:true, seed:144, title:'Tidekin trader · general shop', icon:'peddler', name:'Ottah', role:'peddler',
    look:{kinEars:'round',kinTail:'thin',kinMuzzle:'whiskers',furColor:0x7a4a2c,furColor2:0xf1e6cf,furMark:'belly',sex:'male',height:0.96,build:1.2,face:'round',hair:'short',hairColor:0x3a2a1a,skin:0xa07250,top:'tshirt',topColor:0xf0c040,bottom:'trousers',bottomColor:0x2a6ab0,hat:'none',pack:true,shoes:'sneakers',shoeColor:0xe8dcc0},
    behavior:{type:'stationary',at:'stall:0:behind'}, home:'house:1', schedule:'always', voice:{rate:1.12,pitch:1.05},
    lines:['Shells, rope, dried fish, a spare knife. I carry what floats and what sinks, and I can tell you which is which by the price.','We Tidekin do not own the sea. We just remember where it keeps things.','Wet coins are still coins. I check them for crabs.'] },
  { id:'pono', vil:8, late:true, seed:145, title:'Smith · forge', icon:'forge', name:'Pono Saltforge', role:'forge',
    look:{sex:'male',height:1.06,build:1.5,face:'square',hair:'short',hairColor:0x1d1410,facial:'stubble',skin:0x946848,top:'tshirt',topColor:0x3a3630,bottom:'trousers',bottomColor:0x2a2420,hat:'none',shoes:'boots',shoeColor:0x241a14},
    behavior:{type:'stationary',at:'stall:2:behind'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.78},
    lines:['Salt air eats iron. So I forge it twice and quench it in the lagoon, and it lasts. Bring me three of the same and I will make one better.','A good blade here is the one that does not rust by the next tide.','Do not stand downwind of the forge. Everything I breathe out is steam.'] },
  { id:'mele', vil:8, late:true, seed:146, title:'Quest board · tide calendar', name:'Warden Mele', role:'quests',
    look:{sex:'female',height:1.06,build:1.0,face:'oval',hair:'ponytail',hairColor:0x2a2420,skin:0xa87c56,top:'jacket',topColor:0x3a9a5a,bottom:'trousers',bottomColor:0xe8dcc0,hat:'none',shoes:'boots',shoeColor:0x3a2814},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.9,pitch:1.0},
    lines:['Notices go up at sunrise, when the tide is at its lowest and the work is at its clearest. Take one that suits you.','The jungle and the highlands both owe us favours. Collect them for us, if you can.','A hunt is just a very long walk with a point at the end.'] },
  { id:'nalu', vil:8, late:true, seed:147, title:'Healer · brews potions', icon:'healer', name:'Healer Nalu', role:'brew',
    look:{sex:'female',height:1.0,build:0.85,face:'oval',hair:'long',hairColor:0x4a3018,skin:0xb08060,top:'jacket',topColor:0xf0e8d0,bottom:'skirt',bottomColor:0x2fb6a8,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2814},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['Sea-grape for the fever, kelp for the burns, coral dust for a bad conscience. Bring me herbs and a few coins and I will brew them.','The jungle herbs are strong but they sulk when dried the wrong way. I will show you if you ask politely.','Drink the healing draught when you are hurt, the others before a fight.'] },
  { id:'hina', vil:8, late:true, seed:148, title:'Elder of the star paths', icon:'story', name:'Old Hina', role:null,
    look:{sex:'female',height:0.94,build:1.2,face:'round',hair:'bun',hairColor:0xd8d4cc,skin:0x946848,top:'jacket',topColor:0x8a4a7a,bottom:'skirt',bottomColor:0x2a2a34,hat:'none',shoes:'boots',shoeColor:0x2a1a10},
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:4', schedule:'always', voice:{rate:0.76,pitch:0.8},
    lines:['Sit by the fire. The star paths are sung, not written, and I have one more verse to give before the night ends.','Seven voyagers left on the first canoe. We sing seven names, and one of them is not the name it was.','The mountain was kind once. It is not unkind now. It is only awake.'] },
  { id:'kekoa', vil:8, late:true, seed:149, title:'Pearl diver', icon:'story', name:'Kekoa', role:null,
    look:{sex:'male',height:0.97,build:0.9,face:'oval',hair:'short',hairColor:0x1d1410,skin:0xa07250,top:'tshirt',topColor:0x2a6ab0,bottom:'trousers',bottomColor:0xe0583a,hat:'none',shoes:'sneakers',shoeColor:0xf0e8d0},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:4','landing','lamp:1','gate'],pause:1.5}, home:'house:7', schedule:'always', speed:1.4, voice:{rate:1.15,pitch:1.1},
    lines:['I held my breath for four minutes once. Then I came up and found out it had only been two.','The best pearls are in the lagoon shallows, and so are the rays. Treat them with respect and they leave you alone.','Race you to the jetty! No? Everyone says no.'] },
  /* ---- the waystations: a keeper and a guide at each circle, no shops ---- */
  { id:'zotz', vil:8, site:'zotchul', late:true, seed:150, title:'Keeper of Zotchul', icon:'story', name:'Keeper Zotz', role:null,
    look:{sex:'male',height:1.04,build:1.1,face:'angular',hair:'long',hairColor:0x1d1410,facial:'beard',skin:0xa07250,top:'jacket',topColor:0x3a9a5a,bottom:'trousers',bottomColor:0xe8dcc0,hat:'none',shoes:'boots',shoeColor:0x3a2814},
    behavior:{type:'stationary',at:'camp'}, home:'house:0', schedule:'always', voice:{rate:0.84,pitch:0.8},
    lines:['This waystation was built over a much older one, and that over an older one still. Every keeper adds a stone and none of us has found the bottom.','The altar behind me is not for sacrifices, whatever the rumours say. It is for lighting a fire when the road is lost.','Beyond the stelae the jungle begins to speak in stone. Listen, but do not answer.'] },
  { id:'nakuk', vil:8, site:'zotchul2', late:true, seed:151, title:'Jungle scout', icon:'story', name:'Nakuk', role:null,
    look:{sex:'female',height:1.0,build:0.85,face:'angular',hair:'ponytail',hairColor:0x1d1410,skin:0xa07250,top:'tshirt',topColor:0xe0583a,bottom:'trousers',bottomColor:0x3a5a3a,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'camp'}, home:'house:1', schedule:'always', voice:{rate:1.0,pitch:1.1},
    lines:['The vines move when nothing else does. I count them each morning and I have never got the same number twice.','There is a cenote past the plaza. It is blue and it is deep and I do not go near it after the sun goes down.','Keep to the stones. The stones remember where the roads were.'] },
  { id:'kipuru', vil:8, site:'urkuwara', late:true, seed:152, title:'Runner of Urkuwara', icon:'story', name:'Chasqui Kipuru', role:null,
    look:{sex:'male',height:0.98,build:0.8,face:'oval',hair:'short',hairColor:0x1d1410,skin:0x9a704c,top:'tshirt',topColor:0xe0583a,bottom:'trousers',bottomColor:0xf0c040,hat:'none',shoes:'sneakers',shoeColor:0xe8dcc0},
    behavior:{type:'stationary',at:'camp'}, home:'house:2', schedule:'always', voice:{rate:1.15,pitch:1.15},
    lines:['I carry knotted cords from here to the sea and back. Each knot is a number and each number is a promise. Do not ask me to read them aloud.','The terraces on the slopes are older than the road, and the road is older than my grandmother\'s grandmother.','Run with me to the next stone? No? Everyone says no.'] },
  { id:'sumaq', vil:8, site:'urkuwara2', late:true, seed:153, title:'Herder of the terraces', icon:'story', name:'Sumaq', role:null,
    look:{sex:'female',height:0.95,build:1.1,face:'round',hair:'long',hairColor:0x1d1410,skin:0x946848,top:'jacket',topColor:0xb0442a,bottom:'skirt',bottomColor:0x2a6ab0,hat:'none',shoes:'boots',shoeColor:0x3a2814},
    behavior:{type:'stationary',at:'camp'}, home:'house:3', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['The condors circle the high terraces every afternoon. The old herders said they were counting us. I count them back.','Wool, stone and water. That is all a highland needs, and the sea takes two of the three.','The wall behind me has no mortar. It has stood through every quake since before my family came here.'] },
];
