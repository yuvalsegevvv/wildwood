//@ The signature outfit characters in the world (VILLAGERS_OUTFIT, WILD_SITES, npcOutfitLook): each set's wearer stands in the village or the wild spot that fits their theme
/* Agent map. VILLAGERS_OUTFIT: villager defs (same fields as VILLAGERS in villagers.js) with `outfit:'<id>'`, which spawnNPC turns into the whole set worn on its reference body (npcOutfitLook);
   initNPCs adds them after the hand-written villagers, all `late` with their own rng seeds (101+). A def with `site:'<name>'` stands in the wild at WILD_SITES[name] instead of a village's anchors (wildSiteOf builds the village-shaped record: x, z, h, anchors, pois).
   Tamsin (the Lodge, home village) and Marshal Zahra (Glasswell) are older villagers who now wear their namesake sets (VILLAGERS_OUTFIT_WEAR). Hask, Dessa and Sefi (Tallgrass) already wear theirs as Kin.
   Not built in light mode (a set is 15-22k triangles at full detail). Tests: client-smoke. Designs: docs/skillkits/looks/. */
const WILD_SITES={
  pell:    {x:-154,z:266,face:2.356,note:'the east shore of Mistmere, the home forest\'s lake'},
  ambrose: {x:711, z:579,face:-2.356,note:'the reedy west bank of the vale\'s Mirror Pond'},
  sorrel:  {x:203, z:-543,face:3.1416,note:'a ridge above Highmark, the Greyspine'},
  sabir:   {x:-555,z:61,face:-0.785,note:'a raiders\' camp outside the Bowl, the Sunscar'},
  ogden:   {x:-720,z:-535,face:-1.5708,note:'the hill west of Wraithwick, the Gloamhorn'}
};
const WILD_CACHE={};
function wildSiteOf(name){
  if(WILD_CACHE[name]) return WILD_CACHE[name];
  const S=WILD_SITES[name], a={x:S.x,z:S.z,face:S.face};
  return WILD_CACHE[name]={x:S.x,z:S.z,h:getH(S.x,S.z),anchors:{camp:a,plaza0:a},pois:[a],wild:true};
}
// the look of a set worn whole by a villager: the character's own sex, the seven pieces in their designed colours and the reference body; the villager keeps their skin tone
function npcOutfitLook(look,id){
  const M=Object.prototype.hasOwnProperty.call(CHAR_MODELS,id)&&CHAR_MODELS[id]; if(!M||!OUTFITS[id]) return look;
  let o=Object.assign({},look,{sex:M.sexes[0]}); o=ofWear(o,id);
  const st=setupsOf(M,o.sex)[0]; if(st) o=applySetup(o,st);
  o.custom=true; return o;
}
const VILLAGERS_OUTFIT_WEAR={tamsin:'tamsin', zahra:'zahra'};
const VILLAGERS_OUTFIT=[
  /* ---- the home village ---- */
  { id:'tansy', late:true, seed:101, outfit:'tansy', title:'Farm-hand', name:'Tansy', role:null, look:{skin:0xd9a47c},
    behavior:{type:'stationary',at:'plaza5'}, home:'house:2', schedule:'day', voice:{rate:1.1,pitch:1.15},
    lines:['I can bring in a whole field before breakfast, if the weather holds. Ask anyone. Ask the weather.','Wheat for bread, oats for porridge, and a sprig behind the ear for luck.','The apples at the market are mine. Do not tell Linnea, she thinks they are hers.'] },
  { id:'dunstan', late:true, seed:102, outfit:'dunstan', title:'Standard-bearer', name:'Dunstan', role:null,
    behavior:{type:'stationary',at:'plaza6'}, home:'house:7', schedule:'day', voice:{rate:1.0,pitch:0.85},
    lines:['A flag is only cloth until someone follows it. Then it is a promise with a drum behind it.','Hear that? That is the beat for marching. This one is for waiting. Try to tell them apart.','Whatever is out there, you do not face it alone. Keep your head up and your step on the beat.'] },
  /* ---- Hanami ---- */
  { id:'genzo', vil:2, late:true, seed:103, outfit:'genzo', title:'Gate-keeper', name:'Genzo', role:null,
    behavior:{type:'stationary',at:'gate'}, home:'house:0', schedule:'always', voice:{rate:0.8,pitch:0.7},
    lines:['A gate does not argue. It stands, and whoever is meant to pass, passes.','The bell on my belt rings when something crosses that does not belong. It has rung rarely, and never for you.','Wind, bell, breath. Stand long enough and the three agree.'] },
  { id:'marigold', vil:2, late:true, seed:104, outfit:'marigold', title:'Lantern-stage idol', name:'Marigold', role:null,
    behavior:{type:'stationary',at:'plaza0'}, home:'house:8', schedule:'day', voice:{rate:1.15,pitch:1.35},
    lines:['Is the light good here? The lanterns like to be seen from the back row.','Do not clap yet! I have not even started. Well, you can clap a little.','Every blossom festival I sing the last verse alone. Somebody always cries. It is usually me.'] },
  { id:'sazanka', vil:2, late:true, seed:105, outfit:'sazanka', title:'Night courier', name:'Sazanka', role:null,
    behavior:{type:'stationary',at:'plaza7'}, home:'house:5', schedule:'always', voice:{rate:1.2,pitch:1.0},
    lines:['Letters, parcels, small secrets. I deliver the first two and forget the third.','If a courier is standing still, she is waiting for dark. Come back after sunset and I will be gone.','Do not ask whom the banner on my back is for. It is not for anyone you know.'] },
  /* ---- Rimehold ---- */
  { id:'brynja', vil:3, late:true, seed:106, outfit:'brynja', title:'Ice-skater · frost-hunter', name:'Brynja', role:null,
    behavior:{type:'stationary',at:'plaza1'}, home:'house:2', schedule:'always', voice:{rate:1.1,pitch:1.1},
    lines:['Frostmere holds a skater like a mother holds a child. Mostly. Mind the grey patches.','Blades are faster than boots. Boots are what you wear when you have to stop.','I hunt frost-wolves on the ice. They cannot turn as sharply as I can, so I turn sharply a lot.'] },
  { id:'torgeir', vil:3, late:true, seed:107, outfit:'torgeir', title:'Shield-wall veteran', name:'Torgeir', role:null,
    behavior:{type:'stationary',at:'plaza2'}, home:'house:4', schedule:'always', voice:{rate:0.78,pitch:0.6},
    lines:['I stood in the wall at the pass for nineteen winters. Nothing got through. Most winters, nothing tried.','A shield is a wall you can carry. Learn to hold it and you can carry the village.','The horn is for emergencies. I have never had to blow it. Do not make me.'] },
  /* ---- Highmark ---- */
  { id:'corvin', vil:4, late:true, seed:108, outfit:'corvin', title:'Lamplighter · mine surveyor', name:'Corvin', role:null,
    behavior:{type:'stationary',at:'lamp:0'}, home:'house:3', schedule:'always', voice:{rate:0.95,pitch:0.95},
    lines:['I light the lamps up the seam and I measure the dark between them. The dark is growing, by my figures.','A lamp is a promise to whoever is behind you. Keep one lit and you can always find the way back.','Do not tap the tripod. It has taken me three days to level it, and the mountain moves anyway.'] },
  /* ---- Glasswell ---- */
  { id:'nephra', vil:5, late:true, seed:109, outfit:'nephra', title:'Tomb-keeper', name:'Nephra', role:null,
    behavior:{type:'stationary',at:'place:archive'}, home:'house:12', schedule:'always', voice:{rate:0.8,pitch:0.95},
    lines:['I am a keeper of what is buried, and it seems I am also what was. Do not look so worried. It is restful.','Gold stays. Linen stays. Names do not, unless somebody says them. Say yours.','The sand remembers where it was a river. So do I.'] },
  /* ---- Wraithwick ---- */
  { id:'hollis', vil:6, late:true, seed:110, outfit:'hollis', title:'Lamp-bearer', name:'Hollis', role:null,
    behavior:{type:'stationary',at:'lamp:4'}, home:'house:1', schedule:'always', voice:{rate:0.82,pitch:0.72},
    lines:['I carry the lamp for those who cannot find the door. There are more of them than you would think.','Vigil is a long word for a simple thing. Someone sits so that nobody sits alone.','The fog is thick tonight. Walk close to the light, and do not answer anything that knows your name.'] },
  { id:'ottoline', vil:6, late:true, seed:111, outfit:'ottoline', title:'Porcelain doll', name:'Ottoline', role:null,
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:7', schedule:'always', voice:{rate:0.85,pitch:1.3},
    lines:['I do not blink very often. It is not rudeness. It is only that I would miss something.','Tea? I keep a cup for guests, though nobody has ever finished one.','Someone wound me up once. Nobody has done it since, and yet here I am. Curious.'] },
  /* ---- in the wild: a spot of their own ---- */
  { id:'pell', vil:1, site:'pell', late:true, seed:112, outfit:'pell', title:'Night-fisher', name:'Pell', role:null,
    behavior:{type:'stationary',at:'camp'}, schedule:'always', voice:{rate:0.85,pitch:0.8},
    lines:['Mistmere gives up her best fish after dark, when the torch draws them up. Hold still and she is generous.','Squint at the water long enough and you learn what is a ripple and what is not. Some nights, not.','Keep to the shore, friend. The middle is deeper than it looks.'] },
  { id:'ambrose', vil:2, site:'ambrose', late:true, seed:113, outfit:'ambrose', title:'Marsh herbalist', name:'Ambrose', role:null,
    behavior:{type:'stationary',at:'camp'}, schedule:'always', voice:{rate:0.88,pitch:0.9},
    lines:['Mint for a fever, reed-root for the lungs, and clay for nearly everything else. The marsh keeps a good pharmacy.','Hurt? Sit. Sit, sit. I have vials for it, and a very bad habit of talking while I mend.','The kappa are not so bad. They only want a cucumber and a little respect. I bring both.'] },
  { id:'sorrel', vil:4, site:'sorrel', late:true, seed:114, outfit:'sorrel', title:'Mountain lookout', name:'Sorrel', role:null,
    behavior:{type:'stationary',at:'camp'}, schedule:'always', voice:{rate:1.0,pitch:1.1},
    lines:['From here I can see the whole Greyspine, and most of what is climbing it. Gryphons, mostly. They do not like my lens.','Wind from the north means snow by evening. Wind from the south means I am about to lose my hat.','Do not go to the edge. I am telling you because I have, and the view is not worth the paperwork.'] },
  { id:'sabir', vil:5, site:'sabir', late:true, seed:115, outfit:'sabir', title:'Dune raider', name:'Sabir', role:null,
    behavior:{type:'stationary',at:'camp'}, schedule:'always', voice:{rate:1.0,pitch:0.8},
    lines:['Do not look so worried. If I were raiding you, you would have noticed by now. You would also have fewer coins.','The caravans pay a toll, one way or another. I only collect it quicker than the Wardens do.','Sit by the fire if you like. The sand is cold at night and the wyrm is somebody else\'s problem.'] },
  { id:'ogden', vil:6, site:'ogden', late:true, seed:116, outfit:'ogden', title:'Gravedigger', name:'Ogden', role:null,
    behavior:{type:'stationary',at:'camp'}, schedule:'always', voice:{rate:0.72,pitch:0.6},
    lines:['Mm. Drowned a while back. Did not take. I have been digging ever since, so it is not all bad.','The rusted bell on my spade rings when something is ready to be put down. It rings often.','Do not mind the weed on my cap. It has been there longer than my last customer.'] }
];
