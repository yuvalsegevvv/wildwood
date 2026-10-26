//@ VILLAGERS (hard-coded NPCs of the three villages), random villagers, NPC behaviour (updateNPCs)
/* ===================== VILLAGERS =====================
   Hard-coded characters go in this list. Each entry can set:
     id        unique key (use it later to find a character: npcById('maren'))
     name      shown when you talk to them
     title     shown above their head with their name (their profession)
     role      'weaponsmith' / 'armorer' open a shop, 'quests' opens that villager's quest list, 'forge' opens the merge forge, 'trainer' opens the skills panel with lessons to buy,
               'soul' opens the Soul Hall where you bind your element, 'lodge' opens the Wayfarers' Lodge where you learn professions (null = just chat)
     look      any character-editor fields (sex, hair, top, colors...); anything missing is random
     behavior  { type:'stationary', at:'<anchor>', pose:'sit' (optional) }
               { type:'patrol', route:['<anchor>', ...], pause:seconds }
               { type:'wander' }  walks between the village's points of interest
     home      'house:0' .. 'house:8' — where they go when evening comes
     schedule  'day' (go home at night) or 'always' (stay out; every villager with a job stays at their post all night)
     speed     walking speed in m/s (default 1.35)
     lines     what they say, one line per chat, in order
     voice     optional { pitch, rate, name } for the spoken voice (name matches part of a system voice)
     onTalk    optional function(npc) called every time the player talks to them
     vil       2 = lives in Hanami, the Sakura Vale's village, 3 = in Rimehold, the Hoarfrost Reach's (same anchors, on that village's plan)
     late      true = spawned after the random villagers, with its own random numbers (a new villager must not change everyone else's look)
     icon      the label's icon when it is not the role's (ROLE_ICON in npc-labels.js)
     show      optional function() -> false hides them (and you cannot talk to them): Odran comes and goes with the main quest
     kin       true = looks like your family (your skin and hair colour, greyed by the sickness): Wren
   Anchors: 'well', 'well:far', 'questboard' (in front of the quest board), 'gate', 'garden', 'plaza0'..'plaza7',
            'house:0'..'house:8' (outside the door; house:4 is the tavern),
            'stall:0'..'stall:2' (customer side), 'stall:0:behind'.. (seller side),
            'campfire:seat0'..'seat2', 'campfire:stand0'..'stand2', 'lamp:0'..'lamp:6'
   Random villagers are added after these (FILLER_COUNT) so the village never feels empty. */
const VILLAGERS=[
  { id:'maren', title:'Quest board', name:'Maren', role:'quests',
    look:{sex:'female',height:0.96,build:0.95,face:'oval',hair:'bun',hairColor:0xb9b3aa,chest:0.9,top:'jacket',topColor:0x6b3a5b,bottom:'skirt',bottomColor:0x3d5a3a,hat:'none',pack:false,shoes:'boots',shoeColor:0x4a3526,facial:'none'},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.85,pitch:1.05},
    lines:['Welcome, traveller! The board behind me always has work: hunts, bounties, places to scout. Take what suits you.','New notices go up every sunrise, and I pick ones that fit how strong you have become.','The forest remembers everything. Some of it is waking up.','Come back to me when you have seen what I asked.'] },
  { id:'tomas', title:'Weaponsmith', name:'Tomas', role:'weaponsmith',
    look:{sex:'male',build:1.15,face:'round',hair:'short',hairColor:0x9a4a24,facial:'beard',top:'flannel',topColor:0x2f4a6b,bottom:'trousers',bottomColor:0x2b2b2e,hat:'cap',hatColor:0x8a2f2f,pack:false},
    behavior:{type:'stationary',at:'stall:0:behind'}, home:'house:1', schedule:'always',
    lines:['Swords, bows and wands! The weapon you carry decides how you fight.','Iron, steel, and if you have the coin, something that shines like the sun.'] },
  { id:'ilse', title:'Armorer', name:'Ilse', role:'armorer',
    look:{sex:'female',face:'round',hair:'ponytail',hairColor:0xd8b56e,chest:1.2,top:'tshirt',topColor:0xe8e4dc,bottom:'trousers',bottomColor:0x5c7f9c,hat:'none',pack:false},
    behavior:{type:'stationary',at:'stall:1:behind'}, home:'house:5', schedule:'always',
    lines:['Helmets, mail, plate and boots. Armor fits anyone, whatever you fight with.','Good armor turns a bite into a bruise. Have a look.'] },
  { id:'bram', title:'Hunter', name:'Bram', role:null,
    look:{sex:'male',build:1.1,face:'angular',hair:'short',hairColor:0x1d1714,facial:'mustache',top:'jacket',topColor:0x3d5a3a,bottom:'trousers',bottomColor:0x6b5a2e,hat:'ranger',hatColor:0x7a6142,pack:false},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:1.0,pitch:0.85},
    lines:['All quiet on the edge of the woods. Mostly.','Slimes near the village, shroomlings a bit further. The deeper you go, the nastier it gets.','Goblins and those walking trees keep to the far woods. Do not go out there unprepared.','I walk this circle a hundred times a day. Keeps the knees working.'] },
  { id:'greta', title:'Forge · merges items', name:'Greta', role:'forge',
    look:{sex:'female',build:1.15,face:'angular',hair:'bun',hairColor:0x6a2a1a,chest:1.35,top:'jacket',topColor:0x4a3a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'none',pack:false,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'stall:2:behind'}, home:'house:6', schedule:'always', voice:{rate:0.95,pitch:0.9},
    lines:['Three of the same, and my hammer makes them one, and better. Rare, epic, unique, even legendary.','Common steel is honest steel. Folded three times, it sings.','Found something that glows? Bring me two more like it.'] },
  { id:'aldric', title:'Skill trainer', name:'Aldric', role:'trainer',
    look:{sex:'male',height:1.04,build:0.95,face:'angular',hair:'short',hairColor:0xb9b3aa,facial:'beard',top:'jacket',topColor:0x2f4a6b,bottom:'trousers',bottomColor:0x3a2a1e,hat:'none',pack:false,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'well'}, home:'house:2', schedule:'always', voice:{rate:0.9,pitch:0.8},
    lines:['Every fighter learns one trick early. From level three I can teach you better ones.','A warrior who can charge, an archer whose arrows go through a line of goblins, a mage who calls down the sky. Pick yours.','Skills are kept for each weapon you fight with. Swap your weapon, and your hands remember a different lesson.'] },
  { id:'oskar', title:'Storyteller', name:'Oskar', role:null,
    look:{sex:'male',build:1.2,face:'round',hair:'bald',hairColor:0xb9b3aa,facial:'beard',top:'hoodie',topColor:0x2b2b2e,bottom:'trousers',bottomColor:0x3d5a3a,hat:'beanie',hatColor:0x8a2f2f,pack:false},
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:4', schedule:'always', voice:{rate:0.82,pitch:0.7},
    lines:['Sit a while. The fire does not mind company.','When I was young, the forest came right up to the well.','Have you seen the fireflies by the river at night? Worth the walk.','There is an old circle of stones by the road in. My grandfather swore it once took him over the mountains in a blink.'] },
  /* ---- Hanami, in the Sakura Vale: the same jobs as the home village, their own people ---- */
  { id:'sayuri', vil:2, title:'Quest board', name:'Sayuri', role:'quests',
    look:{sex:'female',height:0.95,face:'oval',hair:'bun',hairColor:0x1d1714,chest:0.95,skin:0xe8c4a0,top:'jacket',topColor:0x8a2a3a,bottom:'skirt',bottomColor:0x2a2830,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.9,pitch:1.1},
    lines:['Welcome to Hanami, traveller from beyond the mountains! The board is full of work for strong arms.','The yokai grow bolder every season. The further east you go, the older and angrier they are.','New notices go up every sunrise, the same as in your village.','Come back when it is done, and the village will pay you well.'] },
  { id:'kenji', vil:2, title:'Weaponsmith', name:'Kenji', role:'weaponsmith',
    look:{sex:'male',build:1.1,face:'angular',hair:'short',hairColor:0x1d1714,facial:'stubble',skin:0xd8b08a,top:'jacket',topColor:0x2a2830,bottom:'trousers',bottomColor:0x3a3a42,hat:'none'},
    behavior:{type:'stationary',at:'stall:0:behind'}, home:'house:1', schedule:'always', voice:{rate:0.95,pitch:0.85},
    lines:['Katana, yumi and blossom wands, folded and lacquered here in Hanami.','A blade from beyond the mountains? Good steel. Mine is better.','The Raijin katana is my finest work. It hums before a storm.'] },
  { id:'haruka', vil:2, title:'Armorer', name:'Haruka', role:'armorer',
    look:{sex:'female',face:'round',hair:'ponytail',hairColor:0x2a1a14,chest:1.1,skin:0xecc8a4,top:'tshirt',topColor:0xe8e4dc,bottom:'trousers',bottomColor:0x2f4a6b,hat:'none'},
    behavior:{type:'stationary',at:'stall:1:behind'}, home:'house:5', schedule:'always',
    lines:['Samurai armor: lacquered plates laced with silk. Light, and it turns an oni club.','Red lacquer for the brave, black for the shogun. Pick yours.'] },
  { id:'tetsuo', vil:2, title:'Forge · merges items', name:'Tetsuo', role:'forge',
    look:{sex:'male',build:1.25,face:'round',hair:'bald',hairColor:0x1d1714,facial:'beard',skin:0xc89a78,top:'jacket',topColor:0x4a3a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'stall:2:behind'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.75},
    lines:['Three the same, and the fire makes one better. Greta on the other side taught me that. Or I taught her.','Rare, epic, unique, legendary. The steel does not care which side of the mountains it came from.'] },
  { id:'ryu', vil:2, title:'Skill trainer', name:'Master Ryu', role:'trainer',
    look:{sex:'male',height:0.98,build:0.9,face:'angular',hair:'bun',hairColor:0xd8d4cc,facial:'mustache',skin:0xd8b08a,top:'jacket',topColor:0x3d5a3a,bottom:'trousers',bottomColor:0x2a2830,hat:'none'},
    behavior:{type:'stationary',at:'well'}, home:'house:2', schedule:'always', voice:{rate:0.8,pitch:0.8},
    lines:['A strong body is nothing without a practised hand. I teach the same arts Aldric does, and I charge the same.','The fox of the hollow has nine tails and nine tricks. Learn yours before you face her.','Breathe. Strike. Breathe again.'] },
  { id:'daisuke', vil:2, title:'Guard', name:'Daisuke', role:null,
    look:{sex:'male',build:1.1,face:'angular',hair:'short',hairColor:0x1d1714,facial:'none',skin:0xdcb48e,top:'jacket',topColor:0x6a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'kasa',hatColor:0xc8a868},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:1.0,pitch:0.9},
    lines:['Kappa near the ponds, kodama in the old woods. Farther east the oni come down from the crags.','The Demon Gate is in the far north-east corner. Akaoni guards it. Nobody guards us from Akaoni.','You came over the bridge? Then the Rootwarden is dead. Good riddance.'] },
  { id:'chiyo', vil:2, title:'Storyteller', name:'Grandmother Chiyo', role:null,
    look:{sex:'female',height:0.9,build:0.95,face:'round',hair:'bun',hairColor:0xcfcac2,chest:0.8,skin:0xe0bc98,top:'hoodie',topColor:0x5a3a5a,bottom:'skirt',bottomColor:0x2a2830,hat:'none'},
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:4', schedule:'always', voice:{rate:0.8,pitch:1.0},
    lines:['Sit, sit. The petals fall whether you hurry or not.','The circle of stones by the road hums for anyone who has walked here on their own feet. Step on it and it carries you home, and back again.','When I was a girl the kitsune were our friends. Then one of them grew nine tails.'] },
  /* ---- the main quest's people (docs/MAIN-QUEST.md, docs/STORY.md). late, so the random villagers keep their looks ---- */
  // Wren, your younger sibling, in the sickbed under the awning of your house by the gate: asleep (lying) unless a quest step
  // wants them awake (wrenAwake), then sitting up
  { id:'wren', late:true, kin:true, title:'Your sibling', icon:'kin', name:'Wren', role:null,
    look:{height:0.82,build:0.85,face:'round',hair:'short',top:'tshirt',topColor:0xd8d0c0,bottom:'trousers',bottomColor:0x6a6e74,hat:'none',pack:false,shoes:'none',facial:'none',chest:0.6},
    behavior:{type:'stationary',at:'bed',pose:'bed'}, home:'house:0', schedule:'always', voice:{rate:1.05,pitch:1.35},
    lines:['(Wren is asleep. The grey lines on their arms have not changed.)','(Wren murmurs something about grey water, and sleeps on.)'] },
  { id:'linnea', late:true, title:'Healer · brews potions', icon:'healer', name:'Healer Linnea', role:'brew',
    look:{sex:'female',height:0.97,build:0.9,face:'oval',hair:'long',hairColor:0x8a6a4a,chest:1.0,top:'jacket',topColor:0x5a7a4a,bottom:'skirt',bottomColor:0x4a3a2a,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2a1e,facial:'none'},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['Heartleaf for fever, willow bark for pain, and rest for everything else.','Bring me herbs and a few coins and I will brew them: a healing potion, a draught of might, an ironbark tonic. Tamsin at the Lodge will teach you to cut the herbs.','Wren is no worse today. I will take that.','If you find anything strange out there, bring it to me. Strange is what I need.'] },
  // Odran the peddler (a watcher: docs/STORY.md; never say so): his cart by the gate from W8, by Hanami's gate from V8
  { id:'odran', late:true, title:'Peddler', icon:'peddler', name:'Odran', role:'peddler', show:()=>odranHere(1),
    look:{sex:'male',height:1.02,build:1.05,face:'oval',hair:'short',hairColor:0x3a2a20,facial:'stubble',top:'jacket',topColor:0x5a4a6a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x3a3230,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'cart'}, home:'house:4', schedule:'always', voice:{rate:1.1,pitch:0.95},
    lines:['Useful things and useless ones! Mostly useless, but those sell best.','Buttons, buckles, a spoon with a hole in it. Something for everyone.','I go where the roads go. The roads here go to interesting places.'] },
  { id:'odran2', vil:2, late:true, title:'Peddler', icon:'peddler', name:'Odran', role:'peddler', show:()=>odranHere(2),
    look:{sex:'male',height:1.02,build:1.05,face:'oval',hair:'short',hairColor:0x3a2a20,facial:'stubble',top:'jacket',topColor:0x5a4a6a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x3a3230,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'cart'}, home:'house:4', schedule:'always', voice:{rate:1.1,pitch:0.95},
    lines:['Cherry blossoms all year round. Somebody here is very good at gardening.','The bridge was long, but I have a good lamp. A very good lamp.','Buy something, sell something. The roads do not pay for themselves.'] },
  // the Soul Hall: bind your soul to an element from level 15 (panel: economy/soul.js). late: spawned after everyone else, see above
  { id:'kaede', vil:2, late:true, title:'Soul Hall', name:'Soul-reader Kaede', role:'soul',
    look:{sex:'female',height:0.97,face:'oval',hair:'long',hairColor:0x1d1714,chest:0.95,skin:0xeac8a6,top:'jacket',topColor:0xe8e4dc,bottom:'skirt',bottomColor:0xb03a3a,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.85,pitch:1.15},
    lines:['The three stones in the gravel are older than the village. Fire, water, earth, air, and the twins dark and light: every soul leans toward one.','Come to me at level 15 and I will bind your soul to an element. Your skills of that element grow stronger, and the skills of its opposite grow weaker.','Fire and water, earth and air, dark and light: each has exactly one opposite. Bind yourself as you please, and change your mind as often as you like.','Monsters have elements too, and they follow the wheel: water douses fire, fire burns air, air wears down earth, and earth drinks water, while light and dark break each other. Strike a monster with the element that beats its own and it will feel it. Strike it with its own and it will only shrug.'] },
  /* ---- Rimehold, in the Hoarfrost Reach: the same jobs again, hunters and ice-fishers in furs (docs/STORY.md, docs/MAIN-QUEST.md). All late, so the other villagers keep their looks ---- */
  { id:'ragna', vil:3, late:true, title:'Quest board', name:'Ragna', role:'quests',
    look:{sex:'female',height:1.0,build:1.05,face:'angular',hair:'long',hairColor:0xc9b48a,chest:1.0,skin:0xe6c8b0,top:'jacket',topColor:0x2f4a6b,bottom:'skirt',bottomColor:0x3a3a42,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.88,pitch:1.0},
    lines:['Welcome to Rimehold. The board is by the road so nobody can say they did not see it: wolves, wraiths, and now and then a man who lost a bet.','New notices go up at sunrise, the same as everywhere. The nights are long here, so the days feel longer.','If you are thinking of the ice hall, ask Hallvard first. Then think again.'] },
  { id:'bjorn', vil:3, late:true, title:'Weaponsmith', name:'Bjorn', role:'weaponsmith',
    look:{sex:'male',height:1.06,build:1.3,face:'round',hair:'short',hairColor:0xb0703a,facial:'beard',skin:0xe2b898,top:'flannel',topColor:0x6a3a2a,bottom:'trousers',bottomColor:0x3a3028,hat:'none',pack:false},
    behavior:{type:'stationary',at:'stall:0:behind'}, home:'house:1', schedule:'always', voice:{rate:0.85,pitch:0.75},
    lines:['Axes, spears, bows of yew and wands of birch, all forged or cut in the cold. Steel that has never been warm does not go soft.','A blade from the south? Nice edge. It will chip on the ice.','The Wolf-Slayer axe hums before a storm. I sell it only to people who answer questions correctly.'] },
  { id:'dagny', vil:3, late:true, title:'Armorer', name:'Dagny', role:'armorer',
    look:{sex:'female',face:'round',hair:'ponytail',hairColor:0x8a5a2a,chest:1.15,skin:0xe4c4a6,top:'hoodie',topColor:0xe0d8c8,bottom:'trousers',bottomColor:0x4a5a6a,hat:'beanie',hatColor:0x8a2a26},
    behavior:{type:'stationary',at:'stall:1:behind'}, home:'house:5', schedule:'always', voice:{rate:0.95,pitch:1.05},
    lines:['Furs, mail and plate, lined with wool. A helm that is cold against the skull is a helm that gets left at home.','Good armor turns a bite into a bruise, and a bad winter into a bad night.'] },
  { id:'ulfhild', vil:3, late:true, title:'Forge · merges items', name:'Ulfhild', role:'forge',
    look:{sex:'female',height:1.03,build:1.3,face:'angular',hair:'bun',hairColor:0x4a2a1a,chest:1.2,skin:0xd8b090,top:'jacket',topColor:0x4a3a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'stall:2:behind'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.85},
    lines:['Three of the same, and the coals make one better. In this cold the steel rings like a bell.','Rare, epic, unique, legendary. Bring me three and I will show you what the north can do.'] },
  { id:'thorvald', vil:3, late:true, title:'Skill trainer', name:'Thorvald', role:'trainer',
    look:{sex:'male',height:1.02,build:1.0,face:'angular',hair:'short',hairColor:0xcfcac2,facial:'beard',skin:0xd8b494,top:'jacket',topColor:0x3a4a5a,bottom:'trousers',bottomColor:0x2a2830,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'well'}, home:'house:2', schedule:'always', voice:{rate:0.8,pitch:0.72},
    lines:['I teach what Aldric and Ryu teach, in the cold, and I charge the same. Ask them: they will say I teach it better.','Learn your skills before you meet the Rimeking. He does not wait for you to catch up.','Breathe in the cold. It clears the head.'] },
  { id:'sigrun', vil:3, late:true, title:'Seer', icon:'story', name:'Old Sigrun', role:null,
    look:{sex:'female',height:0.9,build:0.95,face:'round',hair:'bun',hairColor:0xdad6ce,chest:0.8,skin:0xe4c8ae,top:'hoodie',topColor:0x5a4a6a,bottom:'skirt',bottomColor:0x2a2830,hat:'none'},
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:4', schedule:'always', voice:{rate:0.78,pitch:1.0},
    lines:['Sit. The fire is warmer than it looks, and I am colder than I look.','There was a winter that came after the burning sky. I have the whole saga, if you have the whole night.','The aurora is the sky remembering. Do not stare at it too long: it remembers you back.'] },
  { id:'hallvard', vil:3, late:true, title:'Hunter-captain', name:'Hallvard', role:null,
    look:{sex:'male',height:1.05,build:1.15,face:'angular',hair:'short',hairColor:0x3a2a1e,facial:'mustache',skin:0xdcb894,top:'jacket',topColor:0x4a5a4a,bottom:'trousers',bottomColor:0x3a3a2e,hat:'ranger',hatColor:0x5a4a3a},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:0.95,pitch:0.85},
    lines:['Wolves in the wold, wraiths in the hall, a wyrm in the north. Nothing to worry about, so long as you stay by the fire.','The Rimeking sits in the old ice hall, north-north-east of here. Ymrik was here before the first house.','Frostgate Pass has been shut since my grandfather was a boy. Then it cracked, three nights ago, like the lake in spring.'] },
  // the Wayfarers' Lodge: mining, woodcutting and gathering are learned here (panel: economy/professions.js; there is a lodge in every village)
  { id:'gudrun', vil:3, late:true, title:'Wayfarers\' Lodge · professions', icon:'lodge', name:'Gudrun', role:'lodge',
    look:{sex:'female',height:1.0,build:1.1,face:'oval',hair:'ponytail',hairColor:0x6a4a2a,chest:1.0,skin:0xe2c4a6,top:'jacket',topColor:0x5a6a4a,bottom:'trousers',bottomColor:0x4a3a2a,hat:'beanie',hatColor:0x3a5a6a,shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.92,pitch:1.05},
    lines:['The Lodge teaches the three ways of taking what the north gives: mining, woodcutting, and gathering. Sixty coins each, and a little patience. Bring the right tool: the ore and pines of the Reach want a Hagane edge or better.','Rime ore in the rock, frostpines on the wold, frostbloom under the snow. Take only what you can carry home.','Potions? Ylva has taken her mother\'s chair, over by the fire. She wants frostbloom and snowmoss.'] },
  /* ---- the Wayfarers' Lodge keepers and the healers who brew (docs/MAIN-QUEST.md, professions). late, so the random villagers keep their looks ---- */
  { id:'tamsin', late:true, title:'Wayfarers\' Lodge · professions', icon:'lodge', name:'Tamsin', role:'lodge',
    look:{sex:'female',height:1.0,build:1.0,face:'oval',hair:'ponytail',hairColor:0x8a5a2a,chest:1.0,top:'jacket',topColor:0x5a6a4a,bottom:'trousers',bottomColor:0x4a3a2a,hat:'ranger',hatColor:0x5a4a3a,pack:true,shoes:'boots',shoeColor:0x3a2a1e,facial:'none'},
    behavior:{type:'stationary',at:'plaza2'}, home:'house:8', schedule:'always', voice:{rate:0.95,pitch:1.05},
    lines:['The Wayfarers keep a lodge in every village: mining, woodcutting and gathering. Sixty coins for the teaching, and you buy your own tools.','A sickle for herbs, a pickaxe for ore, an axe for trees. The deeper into the woods you go, the better the edge you need.','Ore goes to the weaponsmith, logs to the armourer, herbs to Linnea\'s kettle. Nothing you cut is wasted.'] },
  { id:'isamu', vil:2, late:true, title:'Wayfarers\' Lodge · professions', icon:'lodge', name:'Isamu', role:'lodge',
    look:{sex:'male',height:1.02,build:1.0,face:'angular',hair:'short',hairColor:0x1d1714,facial:'stubble',skin:0xd8b08a,top:'jacket',topColor:0x3a5a4a,bottom:'trousers',bottomColor:0x3a3a42,hat:'kasa',hatColor:0xc8a868,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'plaza1'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:0.85},
    lines:['I keep Hanami\'s lodge: the same teaching as Tamsin\'s in the west, mining, woodcutting and gathering. The vale grows sunwood and cherry, hagane in the crags, kikyo in the meadows.','A sunwood tree wants a Sunstone edge at least. Bring the right axe, or the tree will laugh at you.','I sell tools and I buy what you cut. Everything is worth something.'] },
  { id:'hinata', vil:2, late:true, title:'Herbalist · brews potions', icon:'healer', name:'Herbalist Hinata', role:'brew',
    look:{sex:'female',height:0.96,build:0.92,face:'oval',hair:'long',hairColor:0x2a1a14,chest:1.0,skin:0xecc8a4,top:'jacket',topColor:0x4a7a5a,bottom:'skirt',bottomColor:0x2a2830,hat:'none',pack:false,shoes:'boots',shoeColor:0x2a1e14,facial:'none'},
    behavior:{type:'stationary',at:'plaza4'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:1.15},
    lines:['Kikyo for mending, yomogi for strength. Bring me herbs and a few coins and I will brew something that works.','Drink the healing potion when you are hurt, the others before a fight. They do not last, so choose your moment.','The herbs of this vale make a stronger brew than the sunpetal of the home woods. The north grows the strongest of all.'] },
  { id:'ylva', vil:3, late:true, title:'Alchemist · brews potions', icon:'healer', name:'Alchemist Ylva', role:'brew',
    look:{sex:'female',height:0.97,build:1.0,face:'round',hair:'bun',hairColor:0xb8b0a4,chest:1.0,skin:0xe4c8ae,top:'hoodie',topColor:0x3a5a6a,bottom:'skirt',bottomColor:0x3a3a42,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2a1e,facial:'none'},
    behavior:{type:'stationary',at:'plaza5'}, home:'house:8', schedule:'always', voice:{rate:0.85,pitch:1.0},
    lines:['Sit. No, not there: that is where the kettle spits.','My mother sat in this chair forty years, and nobody after her. Frostbloom for the healing, snowmoss for the tonic. Bring me some and I will show you what the north can do.','Gudrun sends me everyone with green thumbs. I do not complain. Much.'] },
  /* ---- Highmark, the Greyspine's village (VIL4): miners and monks. late, so the other villages' random looks stay as they were ---- */
  { id:'brenna', vil:4, late:true, title:'Quest board · mine foreman', name:'Foreman Brenna', role:'quests',
    look:{sex:'female',height:1.0,build:1.15,face:'angular',hair:'ponytail',hairColor:0x6a3a22,chest:1.05,skin:0xe0bc9c,top:'jacket',topColor:0x6a5a3a,bottom:'trousers',bottomColor:0x3a3a40,hat:'ranger',hatColor:0x4a4a52,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.92,pitch:0.95},
    lines:['Welcome to Highmark. I keep the mine and the board; the board is the easier of the two. Gryphons, goats gone wrong, and the odd rockfall that is not an accident.','New notices go up at sunrise. The shifts run on the bell, and the bell runs on the monks.','If you are going up the North Fork, take a rope and a friend. Nobody who went alone has been back to complain.'] },
  { id:'gerhard', vil:4, late:true, title:'Weaponsmith', name:'Gerhard', role:'weaponsmith',
    look:{sex:'male',height:1.04,build:1.35,face:'round',hair:'short',hairColor:0x8a8a8a,facial:'beard',skin:0xd4a888,top:'jacket',topColor:0x4a4a52,bottom:'trousers',bottomColor:0x2b2b2e,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'stall:0:behind'}, home:'house:1', schedule:'always', voice:{rate:0.85,pitch:0.78},
    lines:['Steel from the deep seams, tempered in meltwater. It takes an edge like a thought and holds it.','A blade from the lowlands? Soft as butter up here. Let me show you what the mountain makes.','The miners bring me ore, I bring them axes. We are even, and we both complain about it.'] },
  { id:'mechthild', vil:4, late:true, title:'Armorer', name:'Mechthild', role:'armorer',
    look:{sex:'female',height:0.99,build:1.2,face:'round',hair:'bun',hairColor:0x5a3a28,chest:1.1,skin:0xe2c0a0,top:'hoodie',topColor:0x6a6a70,bottom:'trousers',bottomColor:0x4a4a52,hat:'beanie',hatColor:0x4a5a6a},
    behavior:{type:'stationary',at:'stall:1:behind'}, home:'house:5', schedule:'always', voice:{rate:0.95,pitch:1.0},
    lines:['Plate for the pit, mail for the pass, leather for the ones who run. Tell me which you are and I will not argue.','A rockfall teaches the same lesson as a bad helm, only louder.'] },
  { id:'hilda', vil:4, late:true, title:'Forge · merges items', name:'Hilda', role:'forge',
    look:{sex:'female',height:1.02,build:1.3,face:'angular',hair:'ponytail',hairColor:0x2a1a12,chest:1.2,skin:0xd8b090,top:'jacket',topColor:0x3a3a3a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'stall:2:behind'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.85},
    lines:['Three of the same and a hot fire, and the mountain makes one better. Rare, epic, unique, legendary: it has done it before.','The stone down below does not like fire. Odd, that. Everything else does.'] },
  { id:'matthias', vil:4, late:true, title:'Skill trainer', name:'Brother Matthias', role:'trainer',
    look:{sex:'male',height:1.02,build:0.95,face:'oval',hair:'short',hairColor:0xb8b0a4,facial:'none',skin:0xe0c0a0,top:'hoodie',topColor:0x6a5a46,bottom:'trousers',bottomColor:0x4a4038,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'well'}, home:'house:2', schedule:'always', voice:{rate:0.8,pitch:0.8},
    lines:['The abbey teaches what Aldric and Ryu teach, and Thorvald in the cold, only slower and with more bells.','Learn your skills before the peaks. The wind up there does not wait for you to remember them.','Breathe. The air is thin; use less of it.'] },
  { id:'ansgar', vil:4, late:true, title:'Abbot', icon:'story', name:'Abbot Ansgar', role:null,
    look:{sex:'male',height:0.97,build:0.9,face:'oval',hair:'short',hairColor:0xdad6ce,facial:'beard',skin:0xe4c8ae,top:'hoodie',topColor:0x3a3a42,bottom:'trousers',bottomColor:0x2a2830,hat:'none'},
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:4', schedule:'always', voice:{rate:0.78,pitch:0.9},
    lines:['Sit. The abbey keeps the records of four hundred winters, and the fire keeps me.','There is a page missing from our oldest book: cut out, neatly, with a very fine blade. Nobody remembers who read it last.','The miners say the stone hums. I say stones do not hum. We are both listening very carefully.'] },
  { id:'konrad', vil:4, late:true, title:'Gate warden', name:'Warden Konrad', role:null,
    look:{sex:'male',height:1.05,build:1.15,face:'angular',hair:'short',hairColor:0x4a3a2e,facial:'mustache',skin:0xdcb894,top:'jacket',topColor:0x4a5a5a,bottom:'trousers',bottomColor:0x3a3a2e,hat:'ranger',hatColor:0x4a4a52},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:0.95,pitch:0.85},
    lines:['Gryphons on the high ledges, goats on the scree, and a queen on the peak above the cirque. Nothing to worry about, so long as you stay in the village.','The glacier valley split open a few weeks back, with a sound like the sky being torn. Since then we have had more visitors than in ten years.','The mine road goes up the North Fork. I would not take it at night.'] },
  { id:'ruprecht', vil:4, late:true, title:'Wayfarers\' Lodge · professions', icon:'lodge', name:'Ruprecht', role:'lodge',
    look:{sex:'male',height:1.0,build:1.1,face:'oval',hair:'short',hairColor:0x6a4a2a,facial:'stubble',skin:0xe2c4a6,top:'jacket',topColor:0x5a6a4a,bottom:'trousers',bottomColor:0x4a3a2a,hat:'beanie',hatColor:0x3a5a6a,pack:true,shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.92,pitch:0.9},
    lines:['The Lodge teaches the three ways of taking what the mountain gives: mining, woodcutting, and gathering. Sixty coins each, and the right tool. The veins here want a better edge than anything below.','Black stone in the deep seams, larch on the ledges, edelweiss above the treeline. Take only what you can carry down.','Ore goes to Gerhard, logs to Mechthild, herbs to Brother Aurel. Sell me the rest.'] },
  { id:'aurel', vil:4, late:true, title:'Herbalist-monk · brews potions', icon:'healer', name:'Brother Aurel', role:'brew',
    look:{sex:'male',height:0.98,build:0.95,face:'round',hair:'short',hairColor:0x9a8a78,facial:'none',skin:0xe4c8ae,top:'hoodie',topColor:0x5a6a52,bottom:'trousers',bottomColor:0x3a3a42,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'plaza5'}, home:'house:8', schedule:'always', voice:{rate:0.85,pitch:0.95},
    lines:['Gentian for the lungs, edelweiss for the heart, and a little patience for everything else. Bring me herbs and a few coins and I will brew something that works.','Drink the healing draught when you are hurt, the others before a fight. The mountain gives no second chances, but it does give herbs.','The cold keeps them fresh, which is why we are good at this and bad at everything else.'] },
  { id:'odran3', vil:3, late:true, title:'Peddler', icon:'peddler', name:'Odran', role:'peddler', show:()=>odranHere(3),
    look:{sex:'male',height:1.02,build:1.05,face:'oval',hair:'short',hairColor:0x3a2a20,facial:'stubble',top:'jacket',topColor:0x5a4a6a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x3a3230,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'cart'}, home:'house:4', schedule:'always', voice:{rate:1.1,pitch:0.95},
    lines:['Furs, flasks and the odd bit of grey plate. Cold work, but somebody has to keep the north supplied with buttons.','It snows even inside my hat. Do not ask how.','The pass is open? Marvellous. I was beginning to think I had come to the end of the world.'] },
  { id:'odran4', vil:4, late:true, title:'Peddler', icon:'peddler', name:'Odran', role:'peddler', show:()=>odranHere(4),
    look:{sex:'male',height:1.02,build:1.05,face:'oval',hair:'short',hairColor:0x3a2a20,facial:'stubble',top:'jacket',topColor:0x4a4a5a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x3a3230,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'cart'}, home:'house:4', schedule:'always', voice:{rate:1.1,pitch:0.95},
    lines:['Black stone, they call it. I call it a good price. Do not tell the foreman I said that.','Up the glacier valley with a cart. Do not ask me how. I do not know either.','Everyone up here has a headache. It is the thin air. Or the humming. Mostly the air.'] },
  /* ---- Glasswell, the Sunscar's city (VIL5): caravaners and glass-workers. late; no story steps yet, only a trade and small talk ---- */
  { id:'zahra', vil:5, late:true, title:'Quest board · caravan marshal', name:'Marshal Zahra', role:'quests',
    look:{sex:'female',height:1.02,build:1.1,face:'angular',hair:'ponytail',hairColor:0x1d1410,chest:1.05,skin:0xb88a62,top:'jacket',topColor:0xb8883a,bottom:'trousers',bottomColor:0x5a3a24,hat:'ranger',hatColor:0xd8c8a0,shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.95,pitch:0.95},
    lines:['Glasswell keeps the caravans moving. Scorpions on the flats, wyrm-sign by Redgate, and a guardian of black glass that has not blinked in a century. Take a notice.','New notices go up at sunrise. The sun comes up early here, and it does not ask.','Water first, then coin, then glory. In that order, or you will not live to count the last.'] },
  { id:'idris', vil:5, late:true, title:'Weaponsmith', name:'Idris', role:'weaponsmith',
    look:{sex:'male',height:1.04,build:1.3,face:'round',hair:'short',hairColor:0x1d1410,facial:'beard',skin:0xa87c56,top:'tshirt',topColor:0xc8b898,bottom:'trousers',bottomColor:0x4a3626,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'place:weapons'}, home:'house:1', schedule:'always', voice:{rate:0.88,pitch:0.8},
    lines:['Glass-edged, sand-tempered. A blade from here cuts the heat off the air.','Your lowland steel will bend in this sun. Let me show you what the desert makes.','The Guardian sheds shards on the fields. I grind them. It is not stealing if it falls off.'] },
  { id:'samira', vil:5, late:true, title:'Armourer', name:'Samira', role:'armorer',
    look:{sex:'female',height:0.99,build:1.15,face:'round',hair:'bun',hairColor:0x2a1a12,chest:1.1,skin:0xb08460,top:'jacket',topColor:0x8a5a3a,bottom:'trousers',bottomColor:0x4a3a2a,hat:'none'},
    behavior:{type:'stationary',at:'place:armour'}, home:'house:5', schedule:'always', voice:{rate:0.95,pitch:1.0},
    lines:['Layers: linen against the sun, leather against the sand, plate against whatever bites.','Wear light on the flats and heavy at the gate. Not the other way round.'] },
  { id:'karim', vil:5, late:true, title:'Forge · merges items', name:'Karim', role:'forge',
    look:{sex:'male',height:1.0,build:1.25,face:'angular',hair:'short',hairColor:0x1a1210,facial:'mustache',skin:0xa07850,top:'tshirt',topColor:0x6a3a2a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'place:forge'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.85},
    lines:['Three of the same and a fire hot enough to melt the dunes. Out comes one better. Sand into glass, same idea.','Do not stand downwind of the furnace. Or do, and be warm.'] },
  { id:'nadia', vil:5, late:true, title:'Skill trainer', name:'Nadia of the Yards', role:'trainer',
    look:{sex:'female',height:1.0,build:0.95,face:'oval',hair:'long',hairColor:0x2a1810,chest:1.0,skin:0xb48a62,top:'hoodie',topColor:0xd8c8a0,bottom:'skirt',bottomColor:0x7a5a3a,hat:'none',shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'place:trainers'}, home:'house:2', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['The yards teach what Aldric and Ryu teach, with more sand in the boots.','Learn your skills before the glass fields. The light there does not wait for you to remember them.','Breathe slowly. The heat steals the air you waste.'] },
  { id:'omar', vil:5, late:true, title:'Gate captain', name:'Captain Omar', role:null,
    look:{sex:'male',height:1.06,build:1.15,face:'angular',hair:'short',hairColor:0x1d1410,facial:'beard',skin:0xa87c56,top:'jacket',topColor:0x8a2a22,bottom:'trousers',bottomColor:0x3a3028,hat:'ranger',hatColor:0xd8c8a0},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:0.95,pitch:0.85},
    lines:['Three gates, three roads: the river road home to the north-west, Redgate east to whatever is left, and the dunes south. Keep to the roads after dusk.','A wyrm sleeps under the dunes before Redgate. The caravans stopped when the sand started to move on its own.','Nothing gets through the city walls that I have not looked at twice.'] },
  { id:'yusuf', vil:5, late:true, title:'Wayfarers\' Lodge · professions', icon:'lodge', name:'Yusuf', role:'lodge',
    look:{sex:'male',height:1.0,build:1.0,face:'oval',hair:'short',hairColor:0x2a1a10,facial:'stubble',skin:0xb08460,top:'jacket',topColor:0x7a6a4a,bottom:'trousers',bottomColor:0x4a3a2a,hat:'none',pack:true,shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.92,pitch:0.9},
    lines:['The Lodge teaches the three ways of taking what the land gives: mining, woodcutting, and gathering. Sixty coins each, and the right tool.','Red stone from the mesas, palm and thornwood by the river, desert herbs after the rare rains. Take only what you can carry in the heat.'] },
  { id:'amal', vil:5, late:true, title:'Healer · brews potions', icon:'healer', name:'Healer Amal', role:'brew',
    look:{sex:'female',height:0.97,build:0.9,face:'oval',hair:'long',hairColor:0x2a1810,chest:1.0,skin:0xb48a62,top:'jacket',topColor:0x5a7a4a,bottom:'skirt',bottomColor:0x8a6a3a,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2a1e},
    behavior:{type:'stationary',at:'place:physician'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['Aloe for burns, saltbush for thirst, and shade for everything else. Bring me herbs and a few coins and I will brew them.','Drink the healing draught when you are hurt, the others before a fight. The sun gives no second chances.'] },
  /* ---- Wraithwick, the Gloamhorn's hamlet (VIL6): fishers, wreckers' widows and lamp-keepers. late; no story steps, only a trade and small talk ---- */
  { id:'maeve', vil:6, late:true, title:'Quest board · harbour reeve', name:'Reeve Maeve', role:'quests',
    look:{sex:'female',height:1.02,build:1.05,face:'angular',hair:'ponytail',hairColor:0x2a2430,chest:1.0,skin:0xd8c8c0,top:'jacket',topColor:0x2e2a3e,bottom:'trousers',bottomColor:0x1e1c26,hat:'ranger',hatColor:0x24202e,shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.92,pitch:0.95},
    lines:['Wraithwick takes what the tide brings and gives back what it can. There are notices on the board; most of them involve something that should have stayed drowned.','New notices go up at dusk. It is always dusk here, so I put them up when I remember.','Keep a lamp lit and your back to the wall. That is the whole of the law out here.'] },
  { id:'brannoch', vil:6, late:true, title:'Weaponsmith', name:'Brannoch', role:'weaponsmith',
    look:{sex:'male',height:1.05,build:1.3,face:'round',hair:'short',hairColor:0x2a2830,facial:'beard',skin:0xcfc0b4,top:'tshirt',topColor:0x3a3646,bottom:'trousers',bottomColor:0x24222c,hat:'none',shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'place:weapons'}, home:'house:1', schedule:'always', voice:{rate:0.88,pitch:0.8},
    lines:['Wreck-iron, salt-quenched. It takes an edge the dead cannot argue with.','Your steel will rust in this air by the week\'s end. Mine has had practice.','The sea gives me anchors and I give it back blades. It is a fair trade, as far as the sea understands trade.'] },
  { id:'isolde', vil:6, late:true, title:'Armourer', name:'Isolde', role:'armorer',
    look:{sex:'female',height:0.99,build:1.1,face:'round',hair:'bun',hairColor:0x3a3440,chest:1.05,skin:0xd4c4bc,top:'jacket',topColor:0x3e3a4e,bottom:'trousers',bottomColor:0x26242e,hat:'none'},
    behavior:{type:'stationary',at:'place:armour'}, home:'house:5', schedule:'always', voice:{rate:0.95,pitch:1.0},
    lines:['Oilskin over mail over wool. The cold gets in anyway, but it has to work for it.','Whatever follows you home from the cairns, plate will slow it by half a breath.'] },
  { id:'corwin', vil:6, late:true, title:'Forge · merges items', name:'Corwin', role:'forge',
    look:{sex:'male',height:1.0,build:1.25,face:'angular',hair:'short',hairColor:0x24222a,facial:'mustache',skin:0xcabcb0,top:'tshirt',topColor:0x4a3438,bottom:'trousers',bottomColor:0x22202a,hat:'none',shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'place:forge'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.85},
    lines:['Three of the same and a fire that does not go out. Out comes one better. The fire has not gone out since before my grandmother.','Do not ask what the coals were before they were coals.'] },
  { id:'sorcha', vil:6, late:true, title:'Skill trainer', name:'Sorcha of the Cairns', role:'trainer',
    look:{sex:'female',height:1.0,build:0.95,face:'oval',hair:'long',hairColor:0x2a2434,chest:1.0,skin:0xdccdc6,top:'hoodie',topColor:0x30304a,bottom:'skirt',bottomColor:0x24222e,hat:'none',shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'place:trainers'}, home:'house:2', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['The same lessons Aldric and Ryu give, taught by lantern-light and with an ear on the dark.','Learn your skills before the heath. Out there, nothing waits for you to remember them.','Breathe slowly. Fear is the one thing that carries a long way in fog.'] },
  { id:'warden_ross', vil:6, late:true, title:'Gate warden', name:'Warden Ross', role:null,
    look:{sex:'male',height:1.06,build:1.15,face:'angular',hair:'short',hairColor:0x2a2830,facial:'beard',skin:0xcfc0b4,top:'jacket',topColor:0x3a2a4a,bottom:'trousers',bottomColor:0x24202a,hat:'ranger',hatColor:0x24202e},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:0.95,pitch:0.85},
    lines:['The neck pass is the only road in or out that is dry. The rest is cliff, fog and the sea\'s opinion of you.','A captain sleeps in the caves under the cliffs. Some nights the tide comes in with a bell in it. Do not go to meet it.','At the far tip the old light burns, though no keeper has climbed it in living memory. Do not go to meet that, either.'] },
  { id:'finnian', vil:6, late:true, title:'Wayfarers\' Lodge · professions', icon:'lodge', name:'Finnian', role:'lodge',
    look:{sex:'male',height:1.0,build:1.0,face:'oval',hair:'short',hairColor:0x2a2430,facial:'stubble',skin:0xd2c4ba,top:'jacket',topColor:0x38364a,bottom:'trousers',bottomColor:0x26242c,hat:'none',pack:true,shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.92,pitch:0.9},
    lines:['The Lodge teaches the three ways of taking what the land gives: mining, woodcutting, and gathering. Sixty coins each, and the right tool.','Cold ore from the cliff seams, bent pine from the heath, grey moss from the cairns. The same grades as the north, if you can bear the company.'] },
  { id:'nuala', vil:6, late:true, title:'Healer · brews potions', icon:'healer', name:'Healer Nuala', role:'brew',
    look:{sex:'female',height:0.97,build:0.9,face:'oval',hair:'long',hairColor:0x3a3444,chest:1.0,skin:0xdccdc6,top:'jacket',topColor:0x3a4a4a,bottom:'skirt',bottomColor:0x2a2a34,hat:'none',pack:false,shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'place:physician'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['Moss for fever, salt for the wounds that will not close, and a candle in the window for the rest. Bring me herbs and a few coins and I will brew them.','Drink the healing draught when you are hurt, the others before a fight. The dark gives no second chances.'] },
  // the keeper of the Gloam Light (docs/STORY.md: a watcher; kind, never a villain on screen). The side quests' chains of the Gloamhorn are hers (shared/side-quests.js)
  { id:'maelis', vil:6, late:true, title:'Keeper of the Gloam Light', icon:'story', name:'Keeper Maelis', role:null,
    look:{sex:'female',height:1.0,build:0.92,face:'oval',hair:'bun',hairColor:0xb8b4bc,chest:1.0,skin:0xdccfc8,top:'jacket',topColor:0x2a3a4a,bottom:'skirt',bottomColor:0x22262e,hat:'none',shoes:'boots',shoeColor:0x1a1618},
    behavior:{type:'stationary',at:'lamp:0'}, home:'house:0', schedule:'always', voice:{rate:0.86,pitch:1.0},
    lines:['I keep the old light at the tip of the horn. Somebody has to, and I have always been good with stairs.','The beam is for ships. There have been no ships for a long time. I keep it lit all the same: a light is a promise.','Mind the fog after dark. It carries voices further than it should.'] },
  /* ---- Tallgrass, Amber Reach's moot town (VIL7): the Kin, seven houses of animal-folk (docs/SAVANNA.md; the plan in the project files). Dressed in Kin parts (ears, tail, muzzle, fur, horns or mane; Hask, Dessa and Sefi wear their outfit sets' own). late; no story steps, a trade and small talk ---- */
  { id:'oruvi', vil:7, late:true, title:'Warden of the Dawn Seat', icon:'story', name:'Warden Oruvi', role:null,
    look:{kinEars:'cat',kinTail:'tufted',kinMuzzle:'nose',deco1:'mane',furColor:0xc9954a,furColor2:0x5c4a3a,sex:'female',height:1.06,build:1.1,face:'angular',hair:'long',hairColor:0xb07a2a,chest:1.0,skin:0xa87c56,top:'jacket',topColor:0x8a3a1a,bottom:'skirt',bottomColor:0x5a3a1a,hat:'none',shoes:'boots',shoeColor:0x3a2410},
    behavior:{type:'stationary',at:'well'}, home:'house:0', schedule:'always', voice:{rate:0.88,pitch:0.85},
    lines:['The Dawn Seat is the baobab\'s hollow, and it is not a throne. Whoever sits it at first light carries the council\'s patience for the day, and goes home lighter or does not go home.','Seven houses, seven voices, one fire. I am the one who keeps it from going out.','You ended the Wyrm. The scouts spoke for you at the hedge, and I have not been asked to take it back.'] },
  { id:'tamsa', vil:7, late:true, title:'Elder of the Long Memory', icon:'story', name:'Elder Tamsa', role:null,
    look:{kinEars:'round',kinTail:'thin',kinMuzzle:'snout',furColor:0x8d9097,furColor2:0x6a6d73,furMark:'belly',sex:'female',height:1.0,build:1.25,face:'round',hair:'bun',hairColor:0xc8c4bc,chest:1.1,skin:0x8a6a4a,top:'jacket',topColor:0x6a4a8a,bottom:'skirt',bottomColor:0x3a2a1a,hat:'none',shoes:'boots',shoeColor:0x2a1a10},
    behavior:{type:'stationary',at:'campfire:seat1',pose:'sit'}, home:'house:4', schedule:'always', voice:{rate:0.78,pitch:0.8},
    lines:['Hmm. Hmm-hm. Rain on the long grass, grass on the long road. Do you know the next line? Nobody does. We keep singing it so it is not lost.','My mother\'s mother sang it to herd the calves home. I sing it because it is the only thing I own that is older than I am.','Sit. The fire does not mind how long you stay.'] },
  { id:'kesi', vil:7, late:true, title:'Herd-guide', icon:'story', name:'Kesi', role:null,
    look:{kinEars:'antelope',kinTail:'puff',kinMuzzle:'nose',deco1:'lyrehorns',furColor:0xb5602a,furColor2:0xf1e6cf,furMark:'belly',sex:'female',height:0.96,build:0.85,face:'oval',hair:'ponytail',hairColor:0x6a4a22,chest:0.9,skin:0xb88a62,top:'tshirt',topColor:0xd8a040,bottom:'trousers',bottomColor:0x6a4a2a,hat:'none',shoes:'boots',shoeColor:0x4a3018},
    behavior:{type:'stationary',at:'plaza0'}, home:'house:2', schedule:'always', voice:{rate:1.1,pitch:1.2},
    lines:['I was the one who ran to tell Warden Oruvi you were at the hedge! I am the fastest. Do not tell the cheetah.','The pools by the western rocks are the best water; the burnt plain is the worst. Stay off the plain after noon.','If you get lost, walk toward the baobab. You cannot miss it, it is the only tree that is a building.'] },
  { id:'hask', vil:7, late:true, title:'Caravan master · general shop', icon:'peddler', name:'Brindle Hask', role:'peddler',
    look:{kinEars:'brindle',kinTail:'brindle',kinMuzzle:'brindle',furColor:0x9a6b3f,furColor2:0x3a3a3f,furMark:'spots',sex:'male',height:1.02,build:1.1,face:'round',hair:'short',hairColor:0x3a2a1a,facial:'stubble',skin:0x9a704c,top:'flannel',topColor:0x8a5a2a,bottom:'trousers',bottomColor:0x4a3a2a,hat:'cap',hatColor:0x6a4a2a,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'stall:0:behind'}, home:'house:1', schedule:'always', voice:{rate:1.1,pitch:0.9},
    lines:['Ha! Is that what you call a price? No, no. Let me laugh a little first, then we will talk about what it is really worth.','Everything is for sale. Everything. Even the things that are not mine, if the owner is slow.','Maps, rope, rations, a spare hat. I sell the road and I buy what it left behind.'] },
  { id:'dessa', vil:7, late:true, title:'Hornsmith · forge', icon:'forge', name:'Dessa Hornwright', role:'forge',
    look:{kinEars:'dessa',kinTail:'dessa',kinMuzzle:'dessa',furColor:0x8d9097,furColor2:0x3a3a3f,sex:'female',height:1.08,build:1.4,face:'angular',hair:'bun',hairColor:0x2a2420,chest:1.15,skin:0x7a5a42,top:'tshirt',topColor:0x4a3a30,bottom:'trousers',bottomColor:0x2a2420,hat:'none',shoes:'boots',shoeColor:0x241a14},
    behavior:{type:'stationary',at:'stall:2:behind'}, home:'house:6', schedule:'always', voice:{rate:0.85,pitch:0.78},
    lines:['Three of the same and a hot fire, and out comes one better. Horn takes the fire slowly, so I do not hurry it.','My mother cut horn, her mother cut horn. I cut iron, and I still say I am the one who breaks with tradition.','Do not lean on the anvil. It remembers who leaned.'] },
  { id:'ennu', vil:7, late:true, title:'Quest board · season calendar', name:'High Watch Ennu', role:'quests',
    look:{kinEars:'antelope',kinTail:'tufted',kinMuzzle:'nose',deco1:'lyrehorns',furColor:0xe0a830,furColor2:0x7a4a2c,furMark:'patches',sex:'male',height:1.14,build:0.85,face:'oval',hair:'short',hairColor:0x3a2a1a,facial:'beard',skin:0xa8784a,top:'jacket',topColor:0x6a8a3a,bottom:'trousers',bottomColor:0x4a3a22,hat:'none',shoes:'boots',shoeColor:0x3a2814},
    behavior:{type:'stationary',at:'questboard'}, home:'house:3', schedule:'always', voice:{rate:0.88,pitch:0.85},
    lines:['From up here the herd is a river and the board is a stone in it. Take a notice that suits you.','New notices go up at sunrise. The wet season is Greenfall and the dry is Goldfall; the board does not care which, the work does not stop.','Watch the horizon at noon. Smoke is the only weather that arrives on purpose.'] },
  { id:'wiru', vil:7, late:true, title:'Healer · brews potions', icon:'healer', name:'Healer Wiru', role:'brew',
    look:{kinEars:'crest',kinTail:'plume',kinMuzzle:'beak',furColor:0x3a3a3f,furColor2:0xf2f2ee,sex:'female',height:1.04,build:0.8,face:'angular',hair:'long',hairColor:0x2a2420,chest:0.9,skin:0x9a704c,top:'jacket',topColor:0x6a5a4a,bottom:'skirt',bottomColor:0x8a5a3a,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2814},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.88,pitch:1.0},
    lines:['Thornbark for the fever, pool-reed for the burns, and patience for the rest. Bring me herbs and a few coins and I will brew them.','I am looking for a herb that grows only after the grass has burned. If you see one, do not pick it. Come and get me.','Drink the healing draught when you are hurt, the others before a fight.'] },
  { id:'sefi', vil:7, late:true, title:'Courier · keeps the circle and the pier', icon:'story', name:'Sefi', role:null,
    look:{kinEars:'sefi',kinTail:'sefi',kinMuzzle:'sefi',furColor:0xe3c58a,furColor2:0x232124,furMark:'spots',sex:'female',height:1.0,build:0.8,face:'oval',hair:'ponytail',hairColor:0xc89a3a,chest:0.9,skin:0xb88a62,top:'tshirt',topColor:0xd8c070,bottom:'trousers',bottomColor:0x5a4a2a,hat:'none',shoes:'sneakers',shoeColor:0xc8a050},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:4','lamp:6','lamp:1','gate'],pause:1.5}, home:'house:7', schedule:'always', speed:1.5, voice:{rate:1.15,pitch:1.2},
    lines:['The stones in the ring are older than the Kin. They carry you wherever you have already walked, and nowhere else. Hold still and do not think of your lunch.','I keep the circle, and the pier past the south pools: the boats there are for the Emberwake Isles, once the water is safe. It is not yet.','Run with me! No? Everyone says no.'] },
  { id:'mudge', vil:7, late:true, title:'Ferryman of the delta', icon:'story', name:'Old Mudge', role:null,
    look:{kinEars:'round',kinTail:'thin',kinMuzzle:'snout',furColor:0x7a4a2c,furColor2:0x5c4a3a,sex:'male',height:1.02,build:1.5,face:'round',hair:'bald',hairColor:0x8a8a82,facial:'beard',skin:0x7a5a42,top:'hoodie',topColor:0x5a6a5a,bottom:'trousers',bottomColor:0x3a4a3a,hat:'none',shoes:'boots',shoeColor:0x2a2a1e},
    behavior:{type:'stationary',at:'landing'}, home:'house:5', schedule:'always', voice:{rate:0.76,pitch:0.65},
    lines:['Mmm. The river comes in the wet and goes out the dry, and I go where it goes. The reed-kin do not own the water, we only know where it is.','Crocodiles are polite if you are. I have never been rude to one.','Sit on the jetty. Dangle a foot if you like. The water is not that interested.'] },
];
const FILLER_COUNT=LITE?3:(LOW?4:8);
const NAMES_M=['Anders','Henrik','Lukas','Emil','Jonas','Felix','Mattis','Arvid','Elias','Nils','Viggo','Karl'];
const NAMES_F=['Freya','Ingrid','Liv','Astrid','Sigrid','Elin','Hanna','Greta','Noor','Saga','Tove','Alma'];
const NAMES_M2=['Hiroshi','Takumi','Sora','Ren','Haruto','Kaito','Yuto','Daiki','Shun','Riku'];
const NAMES_F2=['Yui','Aoi','Hina','Sakura','Mei','Rin','Emi','Nanami','Koharu','Akari'];
const NAMES_M3=['Ulf','Leif','Eirik','Gunnar','Hakon','Ivar','Orm','Sten','Torben','Rurik'], NAMES_F3=['Ylva','Runa','Solveig','Brynja','Halla','Torvi','Yrsa','Signe','Vigdis','Asa'];
const NAMES_M4=['Anselm','Florian','Josef','Konrad','Rupert','Ulrich','Matthias','Lorenz','Sepp','Veit'], NAMES_F4=['Berta','Frieda','Hedwig','Liesl','Marta','Theresa','Walburga','Agnes','Irmgard','Resi'];
const NAMES_M5=['Tariq','Samir','Hakim','Rashid','Jamal','Faris','Nabil','Khalid','Bashir','Zayd'], NAMES_F5=['Layla','Farah','Dalia','Rania','Soraya','Yasmin','Nour','Huda','Leila','Maysa'];
const SMALLTALK5=['The wells are deep and old. Nobody remembers who dug them.','Glass sings when the wind crosses the fields at night. Do not follow it.','The caravans come in with sand in their teeth and news in their pockets.','Shade is the true currency here. Coin is a distant second.','They say the Wardens kept a library under the Archive. They also say a lot of things.','My camel has opinions about the dunes. She is usually right.'];
const SMALLTALK4=['The bell rings the shifts. Nobody has ever heard it ring wrong, and nobody likes to think what that means.','The goats up on the scree are not ours. We do not claim them.','The stone down the seam is cold even in summer. Cold and, well, loud.','My father cut the steps to the abbey. Four hundred and twelve. I count them every time.','There was a coin in the pay this month that was too round. I gave it to the foreman and she looked at it for a long time.','Mind the ledges after the thaw. The mountain rearranges itself overnight.'];
const SMALLTALK3=['The lake has never frozen this thick. Or this quiet.','Wolves come to the edge of the firelight and just sit there. I do not care for it.','My grandfather fished Frostmere for sixty winters. He never once looked at the north shore.','If you see a blue flower, do not pick it in the daylight. It sulks.','The aurora was green last night. Green means a good winter. Red means the other kind.','They say the wall is open. They also say the Rimeking is friendly. They say a lot at the fire.'];
const SMALLTALK2=['The cherry trees never stop blooming here. Nobody remembers why.','Mind the ponds. Kappa like to pull travellers in by the ankles.','Tetsuo and Kenji argue about steel every evening at the brazier.','The bamboo sings when the wind comes off the mountains.','My brother saw foxfire above the hollow again last night.','Sweep the petals in the morning, and by noon there are more.','Daisuke walks that circle so often the stones know his feet.','They say the bridge gate was sealed by the Rootwarden itself. Strange that you got through.'];
const SMALLTALK=['Lovely day for a walk in the woods.','The deer come right up to the garden at dawn.','Mind the river, the current is quicker than it looks.','Have you tried the apples at the market?','My grandmother planted half the birches around here.','Foxes got into the hen house again last week.','When the fireflies come out, you know summer is here.','The old path still leads down to the lake, if you know where to look.','The tavern gets loud after sunset. Oskar tells the same stories every night.','Bram thinks he is guarding us from wolves. There are no wolves.'];

const NAMES_M6=['Callum','Eoghan','Fergus','Ruaridh','Tavish','Murdoch','Lachlan','Donal','Ewan','Aonghas'], NAMES_F6=['Morag','Isla','Catriona','Eilidh','Mairi','Una','Ailsa','Shona','Brigid','Fenella'];
const NAMES_M7=['Jabari','Kito','Mosi','Zuberi','Baraka','Dume','Ekon','Faraji','Husani','Tendai'], NAMES_F7=['Amani','Zuri','Imani','Neema','Subira','Tisa','Wanza','Ayana','Eshe','Nia'];
const SMALLTALK6=['The tide brings things in at night. We do not look at them until morning, and then only from a distance.','Never whistle near the cairns. The wind answers, and it does not whistle the same tune back.','My husband went out for crabs. The boat came home on its own, which is more than most do.','The old light at the tip still turns. Nobody has wound it in a hundred years.','Keep the lamp trimmed. A dark window is an invitation.','The standing stones lean a little more each winter. Toward us, we think.','There is a bell under the water by the caves. On calm nights you can hear it ring the hours.','The gulls here do not cry. They watch.','Grey fog off the sea, and in it, a ship with no lights. Count to a hundred and it is gone. Mostly.','We sing the drowned home on the longest nights. It is the only time the heath is quiet.'];

const NPCs=[];
let talkNPC=null, nearNPC=null;
function npcById(id){ return NPCs.find(n=>n.def.id===id); }
const vilOf=n=>n.V||(n.def.site?wildSiteOf(n.def.site):VILS[(n.def.vil||1)-1]);
function anchorOf(name,V){ V=V||VIL; return V.anchors[name]||V.anchors.plaza0; }
function randomPOI(n){ const V=vilOf(n); let p; for(let i=0;i<6;i++){ p=V.pois[Math.floor(Math.random()*V.pois.length)]; if(Math.hypot(p.x-n.x,p.z-n.z)>3) break; } return {x:p.x+AR(-0.6,0.6),z:p.z+AR(-0.6,0.6),face:p.face}; }
function spawnNPC(def,rng){
  let look=randomLook(rng||Math.random,{villager:true,base:def.look});
  const outfit=def.outfit||VILLAGERS_OUTFIT_WEAR[def.id];   // a signature set worn whole (village/villagers-outfits.js); light mode keeps plain clothes
  if(outfit&&!LITE) look=npcOutfitLook(look,outfit);
  if(def.kin){ look.sex=LOOK.sex; look.hairColor=LOOK.hairColor; look.skin=new THREE.Color(LOOK.skin||0xe0b894).lerp(new THREE.Color(0x9a9a98),0.35).getHex(); }   // your family, greyed by the sickness
  const rig=buildCharacter(look,{q:charDetail('npc')}), s=lookScale(look);
  rig.root.scale.setScalar(s);
  const g=new THREE.Group(); g.add(rig.root); scene.add(g);
  const B=def.behavior||{type:'wander'}; def.behavior=B;
  const V=def.site?wildSiteOf(def.site):VILS[(def.vil||1)-1];
  const start=B.at?anchorOf(B.at,V):(B.route?anchorOf(B.route[0],V):randomPOI({def,x:V.x+99,z:V.z}));
  const n={def,V,look,rig,g,scale:s,x:start.x,z:start.z,y:V.h,face:start.face||0,faceGoal:start.face,vx:0,vz:0,walk:0,state:'idle',timer:AR(0.5,4),
    route:[],inside:false,headYaw:0,line:0,pi:0,stuckT:0,sx:start.x,sz:start.z,partner:null,seed:Math.random()*10};
  if(def.role==='forge') smithAttach(n);   // smith: a hammer in the hand (village/smith.js)
  NPCs.push(n); return n;
}
function initNPCs(){
  const rng=mulberry32(9001);
  const defs=VILLAGERS.concat(VILLAGERS_OUTFIT).filter(v=>!LITE||v.role);   // light mode keeps everyone with a job
  const used=new Set();
  for(const vil of [1,2]) for(let i=0;i<FILLER_COUNT;i++){
    const sex=rng()<0.5?'male':'female', pool=vil===2?(sex==='male'?NAMES_M2:NAMES_F2):(sex==='male'?NAMES_M:NAMES_F), talk=vil===2?SMALLTALK2:SMALLTALK;
    let name; do{ name=pool[Math.floor(rng()*pool.length)]; }while(used.has(name)); used.add(name);
    const lines=[]; for(let k=0;k<3;k++) lines.push(talk[Math.floor(rng()*talk.length)]);
    // Hanami's people: darker hair, sometimes a straw kasa
    const look=vil===2?{sex,hairColor:rng()<0.8?0x1d1714:0x3a2418,hat:rng()<0.3?'kasa':'none',hatColor:0xc8a868}:{sex};
    defs.push({id:'villager'+(vil===2?'h':'')+i,vil,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
  }
  // Rimehold's people: made with their own rng after everything else, so the other villages' random looks stay as they were
  { const r3=mulberry32(9003);
    for(let i=0;i<FILLER_COUNT;i++){
      const sex=r3()<0.5?'male':'female', pool=sex==='male'?NAMES_M3:NAMES_F3; let name; do{ name=pool[Math.floor(r3()*pool.length)]; }while(used.has(name)); used.add(name);
      const lines=[]; for(let k=0;k<3;k++) lines.push(SMALLTALK3[Math.floor(r3()*SMALLTALK3.length)]);
      const look={sex,hairColor:[0xc9b48a,0x8a5a2a,0x3a2a1e,0xb0703a,0xdad6ce][Math.floor(r3()*5)],hat:r3()<0.4?'beanie':'none',hatColor:[0x8a2a26,0x3a5a6a,0x5a4a3a][Math.floor(r3()*3)],top:r3()<0.5?'hoodie':'jacket'};
      defs.push({id:'villagerr'+i,vil:3,late:true,seed:i+1,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
    } }
  // Highmark's people: their own rng again
  { const r4=mulberry32(9004);
    for(let i=0;i<FILLER_COUNT;i++){
      const sex=r4()<0.5?'male':'female', pool=sex==='male'?NAMES_M4:NAMES_F4; let name; do{ name=pool[Math.floor(r4()*pool.length)]; }while(used.has(name)); used.add(name);
      const lines=[]; for(let k=0;k<3;k++) lines.push(SMALLTALK4[Math.floor(r4()*SMALLTALK4.length)]);
      const look={sex,hairColor:[0x8a6a4a,0x4a3a2e,0x2a1e18,0xb08a5a,0xc8c0b4][Math.floor(r4()*5)],hat:r4()<0.35?'beanie':'none',hatColor:[0x5a5a62,0x4a5a6a,0x6a5a46][Math.floor(r4()*3)],top:r4()<0.5?'hoodie':'jacket'};
      defs.push({id:'villagerg'+i,vil:4,late:true,seed:i+21,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
    } }
  // Glasswell's people: their own rng once more
  { const r5=mulberry32(9005);
    for(let i=0;i<FILLER_COUNT;i++){
      const sex=r5()<0.5?'male':'female', pool=sex==='male'?NAMES_M5:NAMES_F5; let name; do{ name=pool[Math.floor(r5()*pool.length)]; }while(used.has(name)); used.add(name);
      const lines=[]; for(let k=0;k<3;k++) lines.push(SMALLTALK5[Math.floor(r5()*SMALLTALK5.length)]);
      const look={sex,hairColor:[0x1d1410,0x2a1a12,0x3a2418,0x5a3a22][Math.floor(r5()*4)],skin:[0xb88a62,0xa87c56,0xc09468,0x9a704c][Math.floor(r5()*4)],hat:r5()<0.3?'kasa':'none',hatColor:[0xd8c8a0,0xb8883a,0x8a5a3a][Math.floor(r5()*3)],top:r5()<0.5?'tshirt':'jacket'};
      defs.push({id:'villagers'+i,vil:5,late:true,seed:i+41,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
    } }
  // Wraithwick's people
  { const r6=mulberry32(9006);
    for(let i=0;i<FILLER_COUNT;i++){
      const sex=r6()<0.5?'male':'female', pool=sex==='male'?NAMES_M6:NAMES_F6; let name; do{ name=pool[Math.floor(r6()*pool.length)]; }while(used.has(name)); used.add(name);
      const lines=[]; for(let k=0;k<3;k++) lines.push(SMALLTALK6[Math.floor(r6()*SMALLTALK6.length)]);
      const look={sex,hairColor:[0x2a2430,0x3a3440,0x4a4450,0x6a6470][Math.floor(r6()*4)],skin:[0xdccdc6,0xd2c4ba,0xcfc0b4][Math.floor(r6()*3)],hat:r6()<0.3?'beanie':'none',hatColor:[0x24202e,0x2e2a3e,0x3a3646][Math.floor(r6()*3)],top:r6()<0.5?'hoodie':'jacket'};
      defs.push({id:'villagerw'+i,vil:6,late:true,seed:i+61,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
    } }
  // Tallgrass's people
  { const r7=mulberry32(9007);
    for(let i=0;i<FILLER_COUNT;i++){
      const sex=r7()<0.5?'male':'female', pool=sex==='male'?NAMES_M7:NAMES_F7; let name; do{ name=pool[Math.floor(r7()*pool.length)]; }while(used.has(name)); used.add(name);
      const lines=[]; for(let k=0;k<3;k++) lines.push(SMALLTALK7[Math.floor(r7()*SMALLTALK7.length)]);
      const look={sex,hairColor:[0x1d1410,0x2a1a12,0x4a3018,0x8a5a22][Math.floor(r7()*4)],skin:[0xa87c56,0x9a704c,0xb88a62,0x7a5a42][Math.floor(r7()*4)],hat:r7()<0.25?'kasa':'none',hatColor:[0xc8a050,0xa86a2a,0x8a6a3a][Math.floor(r7()*3)],top:r7()<0.5?'tshirt':'jacket',
        kinEars:['cat','round','antelope','rhino','hare'][Math.floor(r7()*5)],kinTail:['thin','puff','tufted','spotted','bushy'][Math.floor(r7()*5)],kinMuzzle:['nose','whiskers','snout'][Math.floor(r7()*3)],
        furColor:KIN_FUR[Math.floor(r7()*KIN_FUR.length)],furColor2:KIN_FUR[Math.floor(r7()*KIN_FUR.length)],furMark:KIN_MARKS[Math.floor(r7()*KIN_MARKS.length)][0],deco1:r7()<0.2?'lyrehorns':''};
      defs.push({id:'villagert'+i,vil:7,late:true,seed:i+81,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
    } }
  defs.filter(d=>!d.late).forEach(d=>spawnNPC(d,rng));
  defs.filter(d=>d.late&&(d.vil||1)<3&&!d.outfit).forEach(d=>spawnNPC(d,mulberry32(9002+(d.seed||0))));
  NPC_DEFER.push(...defs.filter(d=>d.late&&((d.vil||1)>=3||d.outfit)));   // Rimehold's, Highmark's, Glasswell's, Wraithwick's and Tallgrass's people: built in the background (below)
}
/* Half of the villagers (36 of 74, ~36 ms each) live in the Hoarfrost Reach and the Greyspine, far from where the game starts. They are built after the loading screen,
   one a slice, by the stream scheduler (job 'n', streaming.js) when nothing nearer is waiting. Each has an rng of its own (mulberry32(9002+seed)), so building them
   later changes nobody's look; everything that looks an NPC up (npcById, the label loop, the maps) does it when it needs one. */
const NPC_DEFER=[];
function* spawnDeferredNPCs(){ while(NPC_DEFER.length){ const d=NPC_DEFER.shift(); spawnNPC(d,mulberry32(9002+(d.seed||0))); yield; } }
function routeTo(n,pt,state){ n.route=[pt]; n.state=state||'walk'; n.stuckT=0; n.sx=n.x; n.sz=n.z; }
function tryChat(n){
  for(const m of NPCs){
    if(m===n||m.inside||m.state!=='idle'||m.def.behavior.type!=='wander'||talkNPC===m) continue;
    if(Math.hypot(m.x-n.x,m.z-n.z)<7){ const T=AR(5,10); n.state=m.state='chat'; n.timer=m.timer=T; n.partner=m; m.partner=n; n.leader=true; m.leader=false; return true; }
  }
  return false;
}
function updateNPCs(dt){
  if(!NPCs.length) return;
  const night=envCur.night, cx=camera.position.x, cz=camera.position.z;
  nearNPC=null; let nd=3.8;
  for(const n of NPCs){
    const B=n.def.behavior, D=n.def, V=n.V;
    const dxp=P.x-n.x, dzp=P.z-n.z, dp=Math.hypot(dxp,dzp);
    if(Math.hypot(cx-V.x,cz-V.z)>260){ n.g.visible=false; continue; }   // the other village sleeps while you are far away
    const wantHome=D.schedule!=='always' && night>0.6;
    if(wantHome && !n.inside && n.state!=='home'){ if(talkNPC===n) endTalk(); if(n.partner){ n.partner.state='idle'; n.partner.partner=null; n.partner=null; } routeTo(n,anchorOf(D.home||'house:0',V),'home'); }
    if(!wantHome && n.inside){ const h=anchorOf(D.home||'house:0',V); n.inside=false; n.x=h.x; n.z=h.z; n.face=h.face; n.state='idle'; n.timer=AR(0,3); n.route=[]; }
    if(n.inside||(D.show&&!D.show())){ n.g.visible=false; if(talkNPC===n) endTalk(); continue; }
    const talking=talkNPC===n;
    if(talking && dp>4.5) endTalk();
    if(!talking && n.state!=='home'){
      if(B.type==='stationary'){
        const A=anchorOf(B.at,V);
        if(n.state!=='walk' && Math.hypot(A.x-n.x,A.z-n.z)>0.6) routeTo(n,A);
        else if(n.state!=='walk'){ n.state='idle'; n.faceGoal=A.face!==undefined?A.face:Math.atan2(-(V.x-n.x),-(V.z-n.z)); }
      } else if(B.type==='patrol'){
        if(n.state==='idle'){ n.timer-=dt; if(n.timer<=0){ n.pi=(n.pi+1)%B.route.length; routeTo(n,anchorOf(B.route[n.pi],V)); } }
      } else {
        if(n.state==='idle'){ n.timer-=dt; if(n.timer<=0){ if(!(Math.random()<0.35 && tryChat(n))) routeTo(n,randomPOI(n)); } }
        if(n.state==='chat'){
          n.timer-=dt;
          if(n.partner) n.faceGoal=Math.atan2(-(n.partner.x-n.x),-(n.partner.z-n.z));
          if(n.timer<=0||!n.partner){ n.state='idle'; n.timer=AR(1,3); n.partner=null; }
        }
      }
    }
    let moving=false;
    if((n.state==='walk'||n.state==='home') && !talking && n.route.length){
      const tg=n.route[0], dx=tg.x-n.x, dz=tg.z-n.z, d=Math.hypot(dx,dz);
      if(d<0.45){
        n.route.shift();
        if(!n.route.length){
          if(n.state==='home'){ n.inside=true; n.g.visible=false; continue; }
          n.state='idle'; n.timer=B.type==='patrol'?(B.pause||3):AR(4,10);
          if(tg.face!==undefined) n.faceGoal=tg.face;
        }
      } else {
        const blocked=dp<1.3 && (dxp*dx+dzp*dz)>0;
        if(!blocked){ const sp=D.speed||1.35; n.vx=dx/d*sp; n.vz=dz/d*sp; moving=true; n.faceGoal=Math.atan2(-dx,-dz); }
      }
    }
    if(!moving){ n.vx*=0.7; n.vz*=0.7; }
    n.x+=n.vx*dt; n.z+=n.vz*dt;
    if(moving){
      pushOutBoxes(n,0.3);
      nearCols(n.x,n.z,(qx,qz,r)=>{ const ex=n.x-qx, ez=n.z-qz, e=Math.hypot(ex,ez), m=r+0.3; if(e<m&&e>1e-4){ n.x=qx+ex/e*m; n.z=qz+ez/e*m; } });
      for(const m of NPCs){ if(m===n||m.inside) continue; const ex=n.x-m.x, ez=n.z-m.z, e=Math.hypot(ex,ez); if(e<0.6&&e>1e-4){ n.x=m.x+ex/e*0.6; n.z=m.z+ez/e*0.6; } }
      n.stuckT+=dt;
      if(n.stuckT>1.6){
        if(Math.hypot(n.x-n.sx,n.z-n.sz)<0.4){ const a=Math.atan2(n.vx,n.vz)+(Math.random()<0.5?1.4:-1.4); n.route.unshift({x:n.x+Math.sin(a)*2.5,z:n.z+Math.cos(a)*2.5}); if(n.route.length>4) n.route.splice(0,n.route.length-1); }
        n.stuckT=0; n.sx=n.x; n.sz=n.z;
      }
    }
    n.y=getH(n.x,n.z);
    if(talking) n.faceGoal=Math.atan2(-dxp,-dzp);
    if(n.faceGoal!==undefined) n.face=angLerp(n.face,n.faceGoal,1-Math.exp(-6*dt));
    let hy=0; if(dp<7 && !moving) hy=clamp(angDiff(Math.atan2(-dxp,-dzp),n.face),-1,1);
    n.headYaw+=(hy-n.headYaw)*Math.min(1,dt*4);
    const sp=Math.hypot(n.vx,n.vz); n.walk+=Math.sqrt(sp)*dt*3.3;
    n.g.position.set(n.x,n.y,n.z); n.g.rotation.y=n.face;
    n.g.visible=Math.hypot(n.x-cx,n.z-cz)<95;
    if(n.g.visible){
      const speaking=talking||(n.state==='chat' && ((Math.floor(t/2.2+n.seed)%2===0)===!!n.leader));
      const bed=B.pose==='bed', lie=bed&&!wrenAwake(), sit=(B.pose==='sit'||(bed&&!lie)) && n.state==='idle' && !moving && (!talking||bed);
      const idleOn=n.state==='idle'&&!moving&&!talking&&!B.pose, work=idleOn?(D.role==='forge'?smithAct(n,dt,dp):villagerWave(n,dt,dp)):null;   // smith: three blows on the anvil, a pause (village/smith.js)
      poseRig(n.rig,dt,{sp,ph:n.walk,sit,sitH:0.55/n.scale,talk:speaking&&!lie,headYaw:lie?0:n.headYaw,seed:n.seed,act:work});
      if(bed){   // lying on the mattress (feet at the anchor, head at the headboard), or sitting on its front edge facing the plaza
        const a=VIL.bed.rot; n.g.rotation.order='YXZ'; n.g.rotation.x=lie?Math.PI/2:0; n.g.rotation.y=lie?a+Math.PI/2:a;
        if(lie) n.g.position.y=n.y+0.74; else n.g.position.set(n.x+Math.cos(a)*0.55-Math.sin(a)*0.3,n.y,n.z-Math.sin(a)*0.55-Math.cos(a)*0.3);
      }
    }
    if(dp<nd && dp<(n.def.role||n.def.kin?3.8:2.8)){ nd=dp; nearNPC=n; }
  }
  updateTalkUI();
}

