//@ Side quests (SQ): six chains of linked, objective-based steps, each leading to a land's second boss (Carapax, Kyuubi, Vetrmaw, the Sand Wyrm) or through the Gloamhorn (Captain Dredge, then the Gloam Warden); rewards are resources, a little XP and a cosmetic at each chain's end. Pure.
/* Agent map. A chain: {id, name, land (a ZTIER_NAMES key), lv (the level it opens from, one for the whole chain), after (a chain that must be finished first),
     res: [ore, log, herb] (what every step pays, more for later steps: sqReward), cos: the cosmetic key its last step gives ('c:<cape>' / 'a:<aura>', CP_QUEST in cospieces.js), steps}.
   A step is a main quest step's shape (shared/main-quest.js): {id, title, from (villager id; null = starts by itself when the step before ends), to (villager id; null = done the moment
     its parts are, where you stand), offer, done, parts, bossLine, doneLine (toasted when to is null)}. Parts: talk (say, night, wait), kill, n, collect, from, n, chance, read (a LORE id),
     gather (a node kind or a profession), boss, and visit:'<SQ_PLACES key>' (walk there; night:true only after dark; say: lines shown in the speech bubble when you arrive).
   Progress: gear.sq = {c: {<chain id>: {s step index, st 0 offered / 1 in progress / 2 ready, n per part}}, t: the tracked chain id}; sanitizeSq checks it.
   The talk rules are sqTalk, used by both sides (the client shows the lines, the server applies them), like mqTalk.
   used by: server/side-quests.js (progress, rewards), game/economy/side-quests.js (lines, marks, the quest panel's tab, the quest log row, the map marker), cospieces.js (CP_QUEST).
   test: tools/sidequests-smoke.js. doc: docs/SIDE-QUESTS.md. Story rules: docs/STORY.md section 0 (hints only, every hint has two readings). */
// the villages of the people who give or take a step (VILS index + 1); a talk only counts in (or at the gate of) their village
const SQ_NPC_VIL={oskar:1,bram:1,linnea:1,chiyo:2,ryu:2,kaede:2,sigrun:3,hallvard:3,ylva:3,omar:5,zahra:5,amal:5,maeve:6,brannoch:6,nuala:6,maelis:6,warden_ross:6,oruvi:7,hask:7,wiru:7,ennu:7,kesi:7,tamsa:7,makoa:8,lani:8,eleaka:8,hina:8,mele:8,nalu:8,kekoa:8};
const SQ_NAMES={oskar:'Oskar',bram:'Bram',linnea:'Healer Linnea',chiyo:'Grandmother Chiyo',ryu:'Master Ryu',kaede:'Soul-reader Kaede',sigrun:'Old Sigrun',hallvard:'Hallvard',ylva:'Alchemist Ylva',
  omar:'Captain Omar',zahra:'Marshal Zahra',amal:'Healer Amal',maeve:'Reeve Maeve',brannoch:'Brannoch',nuala:'Healer Nuala',maelis:'Keeper Maelis',warden_ross:'Warden Ross',oruvi:'Warden Oruvi',hask:'Brindle Hask',wiru:'Healer Wiru',ennu:'High Watch Ennu',kesi:'Kesi',tamsa:'Elder Tamsa',makoa:'Chief Makoa',lani:'Lani',eleaka:'Eleaka',hina:'Elder Hina',mele:'Mele',nalu:'Healer Nalu',kekoa:'Kekoa'};
const SQ_VIL_NAMES=['Wildwood','Hanami','Rimehold','Highmark','Glasswell','Wraithwick','Tallgrass','Coralhaven'];
// the places a visit part walks you to: {x, z, r (how close counts), name}
const sqZone=key=>ZONES.find(z=>z.key===key);
const sqZoneSpot=(key,fa,fr,r)=>{ const zn=sqZone(key), [x,z]=mqSpot(zn,fa,fr); return {x,z,r,name:zn.name}; };
const SQ_PLACES=(()=>{
  const A=k=>ARENAS.find(a=>a.key===k), tide=A('boss20b');
  const m31=sqZone('m31'), wk=GLOAM_WRECKS.slice().sort((a,b)=>Math.hypot(a[0]-m31.x,a[1]-m31.z)-Math.hypot(b[0]-m31.x,b[1]-m31.z))[0];
  return {
    tidebeach:{x:tide.x,z:tide.z,r:tide.r+22,name:tide.name},
    jadefalls:sqZoneSpot(22,0,0.35,26),
    tengu:sqZoneSpot(23,0.4,0.5,24),
    mural:sqZoneSpot(24,-0.3,0.45,20),
    glassfields:sqZoneSpot('s32',0,0.3,28),
    bellrock:sqZoneSpot('s35',0,0.3,26),
    wreck:{x:wk[0],z:wk[1],r:72,name:'The iron wreck below the cliffs'},
    cairns:sqZoneSpot('m32',0.2,0.4,24),
    light:{x:GLOAM_LIGHT.x,z:GLOAM_LIGHT.z,r:42,name:GLOAM_LIGHT.name},
    // the Amber Reach: the atlas's places (the zones themselves come with shared/savannazones.js)
    moot:{x:SAV_MOOT.x,z:SAV_MOOT.z,r:46,name:'The Broken Moot'},
    pools:{x:SAV_POOLS[0].x,z:SAV_POOLS[0].z,r:SAV_POOLS[0].r+30,name:'The Seven Pools'},
    anvil:{x:SAV_BOSS_POI[41].x,z:SAV_BOSS_POI[41].z,r:60,name:'Anvil Rock'},
    memory:{x:SAV_ZONE[43].x,z:SAV_ZONE[43].z,r:60,name:'The memory trees of Baobab Reach'},
    delta:{x:SAV_ZONE[44].x,z:SAV_ZONE[44].z,r:60,name:'The Sedge Delta'},
    // the Emberwake Isles: the lagoon, the Jaguar Court's plaza, the Drowned Strait and the terraces (the zones come with shared/emberwakezones.js)
    lagoon:sqZoneSpot('e43',0.3,0.4,34),
    plaza:{x:ARENA_E45.x,z:ARENA_E45.z,r:ARENA_E45.r+26,name:'The Overgrown Plaza'},
    strait:{x:ARENA_E46.x,z:ARENA_E46.z,r:ARENA_E46.r+40,name:'The Drowned Strait'},
    terraces:sqZoneSpot('e47',0,0.4,30)
  };
})();
const SQ=[
  /* ---------------- The home forest: the shore, the Sunwall's foot and the foothills (levels 15-20), to Carapax ---------------- */
  {id:'tide',name:'The Grey Tide',land:'home',lv:15,res:['silver','yew','ironroot'],cos:'c:tideking',steps:[
    {id:'tide1',title:'Ash-coloured water',from:'oskar',to:'oskar',
     offer:['Sit down a moment. You walk the shore road now, so you should hear this.','When I was a boy the sea off the Crownsea Shore was green as bottle glass. Since the grey rain it has gone the colour of ash, and the boats come home empty.','There is an old fishing boat on the beach, half buried. Go and look at it, and tell me if the grey has got into the wood.'],
     parts:[{read:'wreck',text:'Look at the old fishing boat on the Crownsea Shore'},{kill:'tideslime',n:6,text:'Clear the tide slimes off the shore'}],
     done:['Grey through, every plank. And the slimes leave a grey film on the sand where they crawl, you say.','That is not rot. Rot is brown and smells of something. This smells of nothing at all.','Bram walks the shore more than I do. Ask him what he has seen.']},
    {id:'tide2',title:'What the crabs carry',from:'bram',to:'linnea',
     offer:['Oskar sent you? Then he told you about the water.','The crabs have started bringing things up out of the deep: little grey pearls, hard as stone and cold. I never saw a crab with a pearl before this year.','Get me a few, then take them to Linnea. If anyone can say what they are, she can.'],
     parts:[{collect:'Grey pearls',from:['crab'],n:4,chance:0.45,text:'Take grey pearls from the shore crabs'},
            {talk:'linnea',after:true,text:'Show the pearls to Healer Linnea',say:['Let me see. ...These are not pearls. A pearl is layered, like an onion. These are the same all the way through, like glass poured into a mould.','And they are cold. I held one over the kettle for an hour and it never warmed.']}],
     done:['I do not know what they are, and I do not like not knowing.','The cold seems to come up the coast from the south-west. Bram knows that wind better than anyone.']},
    {id:'tide3',title:'The warm wind fails',from:'bram',to:'bram',
     offer:['Linnea is right. Every spring a warm wind comes over the Sunwall, and the sun scarabs fly with it. This year they crawl. They are cold too.','Go to the Sunwall\'s foot and bring me their wings. And cut Linnea some ironroot while you are out: she wants a warming salve for the fishers.'],
     parts:[{collect:'Dull scarab wings',from:['scarab'],n:4,chance:0.5,text:'Take wings from the sun scarabs at the Sunwall\'s foot'},{gather:'ironroot',n:3,text:'Cut 3 ironroot for Linnea\'s salve'}],
     done:['Their wings should shine like new copper. These are dull as slate.','Something in the sea is drinking the warmth out of everything that comes near the shore: the pearls, the crabs, the wind.','There is one old thing out there the shore folk do not like to name. They call it the Tide King. If anything is drinking the warmth, it is him. Oskar knows the old songs about him.']},
    {id:'tide4',title:'The shore folk\'s bargain',from:'oskar',to:'oskar',
     offer:['So it is the Tide King. My grandmother sang about him: a crab as big as a cottage, who keeps the shallows.','The shore folk had a bargain with him. Before a boat went out they burned crag moss on the beach, and the green smoke told him the boat was a friend.','Crag moss grows only on the crag wardens of the Northern Foothills, and the ram-horned boars do not like visitors up there. Bring me some.'],
     parts:[{collect:'Crag moss',from:['cragwarden'],n:3,chance:0.5,text:'Take crag moss from the crag wardens of the Northern Foothills'},{kill:'ramboar',n:4,text:'Drive off the ram-horned boars on the foothill path'}],
     done:['That is it. Smell it: like rain on hot stones.','Light it on the Tide King\'s beach after dark, on the sand above the waterline, and watch what the sea does.']},
    {id:'tide5',title:'Green smoke at dusk',from:'oskar',to:null,
     parts:[{visit:'tidebeach',night:true,text:'Light the crag moss on the Tide King\'s Beach after dark',say:['(You lay the moss on the sand and strike a light. Green smoke rolls out over the water.)','(Far out, something answers: a slow grinding, like a millstone turning under the sea. The smoke turns grey, all of it at once.)','(The bargain is broken. The Tide King is coming up the beach.)']}],
     doneLine:'The green smoke has turned grey. The Tide King will not bargain: he has to be stopped.'},
    {id:'tide6',title:'The Tide King',from:null,to:'oskar',
     bossLine:'Carapax sinks into the surf. For a moment the water round him runs green, then clear.',
     parts:[{boss:'carapax',text:'Defeat Carapax, the Tide King, on his beach'}],
     done:['You did it? Then that is why the gulls are back on the point. I heard them this morning.','My grandmother said the Tide King kept the shallows. Maybe the grey got into him the way it got into the pearls, and he only did what the grey wanted.','The shore folk left this in my keeping for whoever made the sea green again. It has waited sixty years. Wear it.','(When you cross to Hanami, find Grandmother Chiyo. She tells the fox story better than I ever told this one.)']}
  ]},
  /* ---------------- The Sakura Vale: the Fox Hills, Jade Falls, the Tengu Peaks, the Warlord Ruins, the Thunder Grove (levels 21-25), to Kyuubi ---------------- */
  {id:'ninetails',name:'The Nine Tails',land:'vale',lv:21,res:['sunstone','cherry','kikyo'],cos:'a:foxfire',steps:[
    {id:'nt1',title:'The oldest friend',from:'chiyo',to:'chiyo',
     offer:['You have heard me tell how one of the foxes grew nine tails. Sit, and I will tell you the rest.','The vale named her Kyuubi, and she was our friend. She led lost children home through the fog and kept the foxfire lit on the hill paths.','This year the foxfire burns grey, and the foxes bite. Go to the Fox Hills and see the kitsune for yourself. Bring me the ash of their fire.'],
     parts:[{kill:'kitsune',n:6,text:'Face the kitsune of the Fox Hills'},{collect:'Grey foxfire ash',from:['kitsune'],n:3,chance:0.5,text:'Take foxfire ash from the kitsune'}],
     done:['Grey ash. Foxfire leaves white ash, light as snow.','Something has got into the foxes, and through them into her. Master Ryu knew her better than anyone. Ask him.']},
    {id:'nt2',title:'Nine tails, nine tricks',from:'ryu',to:'ryu',
     offer:['"The fox of the hollow has nine tails and nine tricks." I said it as a joke once. I am not laughing now.','When I was young she showed me where her strength comes from: the water of Jade Falls. It runs down from the north, under the ice, the cleanest water in the vale.','If the falls are fouled, so is she. Go up and look, and bring back jade from the slimes there, so I can read the water in it.'],
     parts:[{visit:'jadefalls',text:'Climb to Jade Falls'},{collect:'Clouded jade',from:['jadeslime'],n:3,chance:0.5,text:'Take jade from the jade slimes'}],
     done:['Clouded. Jade from the falls should be clear as a mountain morning.','The water comes from the north. Whatever is wrong up there runs down to us. The tengu above the falls see everything, but they will not talk to me. They might talk to you, once you have shown them your blade.']},
    {id:'nt3',title:'The sky went quiet',from:'ryu',to:'ryu',
     offer:['Go up to the Tengu Peaks. Tengu respect only those who beat them, so beat a few, and then wait on the high rocks.'],
     parts:[{kill:'tengu',n:5,text:'Defeat karasu tengu on the Tengu Peaks'},{kill:'blueoni',n:3,text:'Drive off the blue oni on the paths'},
            {visit:'tengu',after:true,text:'Wait on the high rocks of the Tengu Peaks',say:['(A tengu lands on the rock beside you and folds its black wings.)','"The sky went quiet," it says, in a voice like a crow\'s. "Long ago, before your village. It was singing, and then it was quiet. The fox remembers. Ask the painted wall."','(Then it is gone, and a single black feather turns in the wind.)']}],
     done:['The sky went quiet? Kaede has a word for that in her old books. And a painted wall... Go to her.']},
    {id:'nt4',title:'Ships without sails',from:'kaede',to:'kaede',
     offer:['Ryu sent you with a riddle. Good. I like riddles better than the souls of the dead, most days.','In the Warlord Ruins there is a wall painted before the warlords ever came. Nobody looks at it now. The undead samurai make sure of that.','Go and look, and tell me what is painted there.'],
     parts:[{kill:'samurai',n:5,text:'Lay the undead samurai of the Warlord Ruins to rest'},
            {visit:'mural',text:'Find the old painted wall in the Warlord Ruins',say:['(Under the moss, a painted wall: a fox with nine tails sits on a hill.)','(Above her, in a sky full of stars, long smooth ships with no sails and no oars. One of them is falling, trailing fire. The fox is looking up at it.)']}],
     done:['A falling ship of the sky, and the fox watching it.','So she was there. Whatever happened when the sky went quiet, Kyuubi saw it. That is what is in her, I think: a memory too heavy to carry, and the grey has turned it sour.','She sleeps in Foxfire Hollow now, past the Thunder Grove, and the raiju have gone wild around her. Clear the way. Chiyo will know how to meet her.']},
    {id:'nt5',title:'Elder blossoms',from:'kaede',to:'chiyo',
     offer:['Chiyo told me once that Kyuubi loved the elder sakura of the Thunder Grove. Bring their blossoms when you go to her.'],
     parts:[{kill:'raiju',n:6,text:'Calm the raiju of the Thunder Grove'},{collect:'Elder blossoms',from:['sakuratreant'],n:3,chance:0.5,text:'Take blossoms from the elder sakura'}],
     done:['Elder blossoms. She used to sleep in them on the hill above the hollow, when she was small enough.','Go to Foxfire Hollow. Lay them at the edge, so she knows who sent you. And if she fights, do not let her suffer.']},
    {id:'nt6',title:'Foxfire Hollow',from:null,to:'chiyo',
     bossLine:'Kyuubi falls. As she fades she speaks, softly: "I kept the light on the hill paths for a thousand years. Keep it now. When the sky sings again, do not answer it until you know the voice."',
     parts:[{boss:'kyuubi',text:'Meet Kyuubi in Foxfire Hollow'}],
     done:['(Chiyo is quiet a long time.)','"When the sky sings again"... My mother used to say the stars hummed when she was a girl. I thought it was a grandmother\'s story.','The foxfire came off the hollow when she fell, and it would not go out. I think she meant it for you.','(Far in the north, they say, the Reach keeps sagas of its own. Old Sigrun of Rimehold knows every one.)']}
  ]},
  /* ---------------- The Hoarfrost Reach: the Glacier Tongue, the Barrow, the Steppe, the Wyrm's Glacier (levels 26-30), to Vetrmaw ---------------- */
  {id:'wyrm',name:'The Wyrm\'s Saga',land:'hoar',lv:26,res:['hagane','frostwood','frostbloom'],cos:'c:wyrmscale',steps:[
    {id:'ws1',title:'A saga left unfinished',from:'sigrun',to:'sigrun',
     offer:['Sit by the fire. Not too close: the young always sit too close.','There is a saga my grandmother would never finish. It begins: "In the year the sky burned, an iron bird fell on the glacier, and a wyrm came to sleep in its belly, for it was warm."','The wyrm is Vetrmaw, and it is waking. The saga\'s road starts at the Glacier Tongue. Walk it, and come back and tell me if it still holds.'],
     parts:[{kill:'lynx',n:5,text:'Defeat snow lynxes on the Glacier Tongue'},{kill:'crawler',n:5,text:'Defeat glacier crawlers'}],
     done:['You came back. The saga\'s road suits you.','The second verse is sung at the barrows: "The dead were laid in the cold to keep, and the cold did not keep them." Hallvard will tell you why that matters now.']},
    {id:'ws2',title:'The cold did not keep them',from:'hallvard',to:'ylva',
     offer:['Sigrun and her sagas. ...She is not wrong, though. Every winter the barrow wights walk further from Bonefrost Barrow, toward the glacier. Toward the warmth, my father said.','Put a few of them back in the ground. Take their ash to Ylva: she says ash remembers fire.'],
     parts:[{kill:'barrowwight',n:5,text:'Put the barrow wights of Bonefrost Barrow down'},{kill:'revenant',n:4,text:'Put the rime revenants down'},{collect:'Barrow ash',from:['barrowwight'],n:3,chance:0.5,text:'Take ash from the wights'}],
     done:['Ash remembers what burned it. This burned hot, hotter than any pyre, and not long ago.','The wights have been lying down beside something warm. Follow the warmth and you will find the wyrm. But not without my tea.']},
    {id:'ws3',title:'Tea against the cold',from:'ylva',to:'ylva',
     offer:['Up on the Wyrm\'s Glacier the cold stops your heart between two steps. Cut me four frostbloom and I will brew you a tea against it.','And the frost trolls of the Blizzard Steppe stand between here and there. Thin them out on your way.'],
     parts:[{gather:'frostbloom',n:4,text:'Cut 4 frostbloom'},{kill:'frosttroll',n:4,text:'Defeat frost trolls on the Blizzard Steppe'}],
     done:['There. It will keep your blood moving for an hour up on the ice.','Go and see the iron bird before you face what sleeps in it. A hunter looks at the trap before the bear.']},
    {id:'ws4',title:'The iron bird',from:'ylva',to:'sigrun',
     offer:['The alphas of the Frostfang pack guard the wreck. They come for the warmth too.'],
     parts:[{read:'ironbird',text:'Find the iron bird at the Wyrm\'s Glacier'},{kill:'alphawolf',n:4,text:'Defeat the Frostfang alphas round the wreck'}],
     done:['A bird of iron, warm under the wing. Then the saga is true, all of it.','The last verse: "The wyrm grew fat on the warmth, and the warmth grew grey in the wyrm." My grandmother stopped there.','I will sing the end when it has been made. Go and make it.']},
    {id:'ws5',title:'Vetrmaw',from:null,to:'sigrun',
     bossLine:'Vetrmaw\'s last breath rolls out of the nest, warm as a summer wind, and the glacier falls silent.',
     parts:[{boss:'vetrmaw',text:'Defeat Vetrmaw in the Wyrm\'s Nest'}],
     done:['(Sigrun closes her eyes and sings, very low.) "...And the wyrm slept, and the bird grew cold, and the hunters came home." There. Finished, after sixty years.','The hunters took what the frost left of it. Its scales never freeze and they hold the warmth. Hallvard had a cloak sewn of them for whoever ended the saga.','(They say far to the south-west, past the Greyspine, there is a city by the glass where the desert sings its own songs.)']}
  ]},
  /* ---------------- The Sunscar: the Glass Fields, the Lantern Wash, Bellrock, the Singing Dunes (levels 31-36), to the Sand Wyrm ---------------- */
  {id:'sunwept',name:'Where the Sun Wept',land:'sun',lv:31,res:['rimeore','frostwood','snowmoss'],cos:'a:sunwept',steps:[
    {id:'sw1',title:'Glass that sings',from:'omar',to:'omar',
     offer:['My caravans come in from the north road shaking. They crossed the Glass Fields at night, they say, and the glass was singing.','Glass does not sing. Go out on the fields and see what frightens my drivers, and bring me some of the glass the wisps carry.'],
     parts:[{visit:'glassfields',text:'Walk out onto the Glass Fields'},{collect:'Singing glass',from:['glasswisp'],n:3,chance:0.5,text:'Take singing glass from the glass wisps'},{kill:'glassscorpion',n:5,text:'Defeat glass scorpions'}],
     done:['Black glass, smooth as still water. Hold it to your ear.','(A thin, high note, very far away.)','The old drivers say the Glass Fields are "where the sun wept": the sun came down there once and cried, and its tears burned the sand to glass. Healer Amal listens to stranger things than glass. Take it to her.']},
    {id:'sw2',title:'A note too high to hear',from:'amal',to:'amal',
     offer:['Omar sent you with glass that sings? Let me listen.','...It is the same note my fever patients hear. The sick of the Lantern Wash all say it: a note too high to be a sound, all night long.','Bring me linen from the dune mummies, the old wrappings, to bind their ears. And four herbs of any kind for a sleeping draught.'],
     parts:[{collect:'Old linen',from:['mummy'],n:4,chance:0.5,text:'Take old linen from the dune mummies of the Lantern Wash'},{gather:'gathering',n:4,text:'Gather 4 herbs'}],
     done:['There. They will sleep tonight.','The note grows louder toward Bellrock, they say. Zahra\'s caravans will not go near it any more. Ask her why.']},
    {id:'sw3',title:'Bellrock',from:'zahra',to:'zahra',
     offer:['Bellrock is called that because it rings. At noon the rock rings, and the sun priests come out to dance. Every caravan marshal knows it.','They are not dancing for the sun any more. Go and watch them, and mind the drakes.'],
     parts:[{kill:'sunpriest',n:5,text:'Defeat sun priests at Bellrock'},{kill:'dunedrake',n:4,text:'Defeat dune drakes'},
            {visit:'bellrock',after:true,text:'Watch Bellrock',say:['(The rock rings: one long note, the same note as the glass.)','(The last sun priests turn their faces to the south-west, all together, and stand very still, listening.)']}],
     done:['South-west. Toward the Singing Dunes, where the wyrm sleeps.','Something under the dunes is singing, and the whole desert is listening. The wyrm lies on top of it like a dog on a hearth.']},
    {id:'sw4',title:'The Singing Dunes',from:'zahra',to:'zahra',
     offer:['Bring me an ember from the efreets of the Singing Dunes. I want to know what they burn.'],
     parts:[{kill:'elderworm',n:5,text:'Defeat elder sand worms in the Singing Dunes'},{collect:'Two-sided ember',from:['efreet'],n:3,chance:0.5,text:'Take embers from the efreets'}],
     done:['Warm on one side and cold on the other. I have never seen fire do that.','The Sand Wyrm\'s pit is past the dunes. End the singing, and Redgate will open to my caravans again.']},
    {id:'sw5',title:'The Sand Wyrm',from:null,to:'omar',
     bossLine:'The Sand Wyrm coils, shudders and lies still. Under the sand the singing stops all at once, as if something down there had heard you.',
     parts:[{boss:'sandwyrm',text:'Defeat the Sand Wyrm in its pit'}],
     done:['My drivers say the glass is quiet. One of them wept, he was so glad.','We kept these flecks from the edge of the Glass Fields for a hundred years, gold and black, sun and glass. The old marshal said: give them to whoever stops the singing. Wear them.','(In Wraithwick, out on the Gloamhorn, they say the drowned have started walking. Reeve Maeve could use you.)']}
  ]},
  /* ---------------- The Gloamhorn, part one: Wreckers' Reach, the wrecks, the Cairn Fields, the Drowned Meadow (levels 30-35), to Captain Dredge ---------------- */
  {id:'drowned',name:'The Drowned Captain',land:'gloam',lv:30,res:['rimeore','frostwood','snowmoss'],cos:'c:greatcoat',steps:[
    {id:'dc1',title:'Wreckers\' lanterns',from:'maeve',to:'maeve',
     offer:['You look like someone who can swing a blade in the fog. Good: Wraithwick needs one.','The wrecker goblins of Wreckers\' Reach hang lanterns on the rocks at night so ships steer for them and break. There have been no ships for years. They do it anyway.','Bring me their lanterns. Every one you take is one less lie on the coast.'],
     parts:[{kill:'wrecker',n:6,text:'Defeat wrecker goblins on Wreckers\' Reach'},{collect:'Wreckers\' lanterns',from:['wrecker'],n:4,chance:0.5,text:'Take their lanterns'}],
     done:['Look at this one. The glass is not blown: it is smooth and even all round. And there is no flame in it. It just glows.','The wreckers pick these out of the wrecks below the cliffs. Brannoch knows the wrecks better than anyone. Ask him.']},
    {id:'dc2',title:'Iron hulls',from:'brannoch',to:'brannoch',
     offer:['The wrecks? I make my blades out of them. Wreck-iron.','But some of those hulls are not planks at all. They are iron plates, riveted, from bow to stern. No ship that ever left a harbour on this coast was built like that.','Go and look down on the big one off the Reach, from the cliffs. And bring me plate from the gloom crabs: they armour themselves with what washes off it.'],
     parts:[{visit:'wreck',text:'Look down on the iron wreck from the cliffs',say:['(Below the cliff a long hull lies on its side in the surf: grey plates in even rows of rivets, and a great bladed wheel at its stern.)','(Crates have burst open on the rocks: small sealed cans with faded pictures of fruit on them, glass bulbs no bigger than an egg, and a black box with a single glass eye.)']},
            {collect:'Hull plate',from:['gloomcrab'],n:4,chance:0.5,text:'Take hull plate from the gloom crabs of Wraithwick Heath'}],
     done:['A wheel with blades at the back of a ship. What would that do? Push the water?','The drowned sailors on the Cairn Fields came off that ship, the reeve says. Nuala sits with the dying. Ask her what the drowned say.']},
    {id:'dc3',title:'What the drowned say',from:'nuala',to:'nuala',
     offer:['The drowned sailors do not die, not properly. They walk up out of the sea and stand among the cairns, looking east.','Lay a few of them down. And when the last one falls, listen. They all say the same three words.'],
     parts:[{kill:'drownedsailor',n:6,text:'Lay the drowned sailors of the Cairn Fields to rest'},{kill:'driftwood',n:4,text:'Defeat the driftwood treants among the cairns'},
            {visit:'cairns',after:true,text:'Listen among the cairns',say:['(The last sailor falls to its knees among the cairns. Its lips move.)','"Hold... the... light."','(Then it is only rope and bone.)']}],
     done:['"Hold the light." Always that.','The keeper of the old light is the only one in Wraithwick who never asks what it means. Go and ask Maelis.']},
    {id:'dc4',title:'The keeper',from:'maelis',to:'maelis',
     offer:['You are the one putting the drowned to rest. Thank you. They were good sailors once.','"Hold the light"? It is what sailors say. A keeper hears it in her sleep.','The one who gives them their orders is down in the Sea Caves: Captain Dredge. He still wears his coat, with the sign of his ship on the shoulder. The sirens of the Drowned Meadow will sing you into the sea before you reach him, so quiet them first.'],
     parts:[{kill:'siren',n:5,text:'Quiet the sirens of the Drowned Meadow'},{kill:'gloombat',n:5,text:'Defeat the gloom bats'}],
     done:['Good. Now go down to the caves. Be quick, and be kind if you can.']},
    {id:'dc5',title:'Captain Dredge',from:null,to:'maelis',
     bossLine:'Captain Dredge falls to one knee in the surf. "Hold the light," he says, "until they come back for us." He touches the sign on his shoulder, a ring with a small sun inside it, and the sea takes him.',
     parts:[{boss:'drownedcaptain',text:'Defeat Captain Dredge in the Sea Caves'}],
     done:['(Maelis listens, and for a moment her face does something you cannot read.)','"Until they come back for us." ...Sailors\' talk. They all hope someone is coming back for them.','The sea gave his coat back on the morning tide. It should go to you. And come and see me again when you are ready to go further out along the horn.']}
  ]},
  /* ---------------- The Gloamhorn, part two: the Mourning Stones, the light, Banshee Tor, Lanternfall (levels 35-40), to the Gloam Warden ---------------- */
  {id:'keeper',name:'The Keeper\'s Light',land:'gloam',lv:35,after:'drowned',res:['rimeore','frostwood','snowmoss'],cos:'a:lamplight',steps:[
    {id:'kl1',title:'Moths to the light',from:'maelis',to:'maelis',
     offer:['You came back. Good.','I climb the tower at the same hour every night. Lately the beam has been dimming by itself, and things come up out of the Mourning Stones toward it, like moths.','Clear the stones for me: the gargoyles and the wraiths.'],
     parts:[{kill:'gargoyle',n:5,text:'Defeat the gargoyles of the Mourning Stones'},{kill:'wraith',n:5,text:'Defeat the wraiths'}],
     done:['Thank you. Now come up the tower with me tonight, and you will see why I worry.']},
    {id:'kl2',title:'After dark',from:'maelis',to:null,
     offer:['Meet me at the Gloam Light after dark. The light is nothing to see by day.'],
     parts:[{visit:'light',night:true,text:'Meet Maelis at the Gloam Light after dark',say:['(Maelis is waiting at the foot of the tower. She takes you up the stairs, round and round, to a door of grey metal with no handle and no keyhole: only a square of small buttons, each marked with a sign you cannot read.)','(She stands so that you cannot see her hands. A soft chime, and the door opens a crack. She slips through alone.)','(Through the gap you hear her speaking quietly, though nobody else is up here, and a voice you do not know answers, thin and crackling, like someone talking through a storm.)','(When she comes out, the door closes behind her by itself.)','"Bad weather at sea. Nothing for you to worry about. Come down, the stairs are steep."']}],
     doneLine:'Maelis did not say who she was talking to. Warden Ross keeps the gate of Wraithwick: he may have heard something.'},
    {id:'kl3',title:'The hum',from:null,to:'warden_ross',
     parts:[{kill:'candlewisp',n:6,text:'Defeat the candle wisps of Banshee Tor (they gather at the light)'},{kill:'gravehound',n:4,text:'Defeat the grave hounds'},
            {talk:'warden_ross',after:true,text:'Ask Warden Ross about the light',say:['A voice in the lamp room? ...I hear the light hum, some nights, from the gate. A low hum, under the wind.','And the seabirds will not roost on the tower. Not one, in all my years.','Do not tell Maelis I said so. She is a good woman. She keeps the light, and the light keeps us.']}],
     done:['The light is dimming, though, and that is my worry. The Warden is waking.']},
    {id:'kl4',title:'Lanternfall',from:'warden_ross',to:'maelis',
     offer:['The thing under the light, at the tip of the horn. Every time the beam dims, it comes further up the rocks.','The black revenants of Lanternfall and the weeping widows of Vault Heath are its outriders. Thin them out, then tell Maelis the road is clear.'],
     parts:[{kill:'weepingwidow',n:4,text:'Defeat the weeping widows of Vault Heath'},{kill:'blackrevenant',n:5,text:'Defeat the black revenants of Lanternfall'}],
     done:['The road is clear? Then it is time.','The Warden has lived under the light longer than Wraithwick has stood. It was never cruel before. Something in the dark got into it, the way it got into the captain.','End it. I will keep the lamp lit so you can see.']},
    {id:'kl5',title:'The Gloam Warden',from:null,to:'maelis',
     bossLine:'The Gloam Warden sinks back into the black water. Above you the beam of the Gloam Light swings round, bright and steady, and somewhere in the tower something hums one low, contented note.',
     parts:[{boss:'gloamwarden',text:'Defeat the Gloam Warden at the Gloam Light'}],
     done:['You did well. The beam is steady; I watched it from the gallery.','You want to ask me about the door. Everyone does, sooner or later. ...Some doors are for keepers. One day it may open for you too. Not today.','Take this: a little of the lamp\'s light to carry with you. Wraithwick owes you more, but it is what a keeper has to give.']}
  ]},
  /* ---------------- The Amber Reach, part one: the Ashbed, Tallgrass Meadows, the Seven Pools, Anvil Rock (levels 37-41), to Old Thunder ---------------- */
  {id:'dawnseat',name:'The Dawn Seat',land:'amber',lv:37,res:['rimeore','frostwood','snowmoss'],cos:'c:dawnseat',steps:[
    {id:'ds1',title:'The seat nobody wants',from:'oruvi',to:'oruvi',
     offer:['Sit, traveller. You are the one who ended the Wyrm, so the Moot will listen to you, which is more than it does for me.','The Dawn Seat speaks first and carries the burden of the year. It should have passed on at Greenfall. Nobody would take it, so I hold it a third turn, and the Dustrunners know a tired warden when they see one.','Thin them out on the Ashbed, and the boars they drive in front of them.'],
     parts:[{kill:'dustrunner',n:6,text:'Drive off the Dustrunners of the Ashbed'},{kill:'thornboar',n:4,text:'Defeat the thornhide boars'}],
     done:['Good. The paths are quieter already. The Moot will notice, and not say so.','Brindle Hask hears everything the caravans hear. Go and ask what is being said about the weather. Do not mind the laughing.']},
    {id:'ds2',title:'What the caravans say',from:'hask',to:'hask',
     offer:['Ha! The warden sends me a hero. No, no, I like it. Heroes pay full price.','Here is what the road says: the storms over Anvil Rock make a great noise and bring no rain. Eleven days now. The grass-cutters in the Meadows are praying for a drop.','Prove you can do something useful first. The grass stalkers and the locust clouds are eating my customers.'],
     parts:[{kill:'grassstalker',n:5,text:'Defeat grass stalkers in Tallgrass Meadows'},{kill:'locusts',n:5,text:'Scatter the locust clouds'}],
     done:['My customers thank you, and so do my accounts.','Dry thunder over a hungry plain. If you want to know what that means ask the healer. She reads the sky and the dead, and says it all with a straight face.']},
    {id:'ds3',title:'The Seven Pools',from:'wiru',to:'wiru',
     offer:['The thunder without rain is bad for the pools. They are shrinking and the herds crowd the last of the water. The sick come to me with grey in their eyes.','Gather me four herbs, and clear the crocs from the shallows so the herds can drink. Then walk down and look at the pools yourself.'],
     parts:[{gather:'gathering',n:4,text:'Gather 4 herbs'},{kill:'mudcroc',n:4,text:'Defeat mudback crocs'},{kill:'poolheron',n:4,text:'Defeat pool herons'},
            {visit:'pools',after:true,text:'Walk down to the Seven Pools',say:['(Seven pools in the reeds, and every one a hand lower than the reed-line says it should be.)','(Far to the west the thunderhead stands on its rock, flickering, and no rain comes out of it.)']}],
     done:['You saw it. The water leaves, and the thunderhead stays.','High Watch Ennu counts the sky for the Moot. Ask whether the storm has ever stood still this long.']},
    {id:'ds4',title:'The calendar breaks',from:'ennu',to:'ennu',
     offer:['Seventy-one seasons I have kept the calendar of the Wide. Greenfall follows Goldfall as dusk follows noon. This year the Goldfall will not end.','Climb to Anvil Rock after dark and see what stands under the cloud. I will not say what I think until you have seen. Bring back the sparks the wisps leave.'],
     parts:[{kill:'sparkwisp',n:5,text:'Defeat spark wisps at Anvil Rock'},{kill:'anvilhawk',n:4,text:'Defeat anvil hawks'},
            {visit:'anvil',night:true,after:true,text:'Watch the thunderhead after dark',say:['(The cloud over Anvil Rock never moves. Inside it something very large turns over, and settles, and the lightning runs along its wings.)','(It is not storming. It is sleepless.)']}],
     done:['A bird, then. I had hoped it was only a very old storm.','The song says the sky keeps the rain for those who ask. Nobody has asked this one anything in a long time. Go back and tell the warden the thunder has a name.']},
    {id:'ds5',title:'Old Thunder',from:null,to:'oruvi',
     bossLine:'Old Thunder folds its great wings and sinks onto Anvil Rock. The cloud above it thins, and far to the east a single honest raindrop falls on the grass.',
     parts:[{boss:'oldthunder',text:'Defeat Old Thunder on Anvil Rock'}],
     done:['It rained. Not much. Enough that the children ran out to stand in it.','The Moot asked who ended the thunder, and I said: someone who was not afraid of the seat. ...They looked at me oddly. Perhaps it is time the Dawn Seat passed on.','Take this for the road. The Wide is a long way from finished with you, or with us.']}
  ]},
  /* ---------------- The Amber Reach, part two: the Burnt Plain, Baobab Reach, the Sedge Delta, the Sunstair (levels 41-45), to Oldhorn ---------------- */
  {id:'drought',name:'The Drought Song',land:'amber',lv:41,after:'dawnseat',res:['rimeore','frostwood','snowmoss'],cos:'a:herdsong',steps:[
    {id:'dr1',title:'Burnt ground',from:'kesi',to:'kesi',
     offer:['You came back! Everyone says the thunder is gone. I only believe it when I see it, and I see the Burnt Plain from my window, and it is still burning.','The grass fires are not grass fires. The cinder buffalo run into them on purpose, and the smoke wraiths come up out of the ash. Please, before the herds I help drive come this way.'],
     parts:[{kill:'cinderbuffalo',n:6,text:'Defeat cinder buffalo on the Burnt Plain'},{kill:'smokewraith',n:5,text:'Disperse the smoke wraiths'}],
     done:['The air smells less of smoke. Thank you.','Elder Tamsa hums a song when she thinks nobody is listening. It is about burnt ground. She says it is nonsense. Ask her again.']},
    {id:'dr2',title:'The memory trees',from:'tamsa',to:'tamsa',
     offer:['Nonsense, child, a lullaby my mother sang. "The herd walks west, the herd walks grey, the Mother leads them where the water was."','Yes. I know what it sounds like. The Long Memory carve our songs into the baobabs of Baobab Reach so they outlast the singers. Go and read what is carved there, and tell me whether I am a foolish old woman.'],
     parts:[{kill:'hollowkin',n:6,text:'Defeat the Hollowed Kin wandering Baobab Reach'},{kill:'baobabtreant',n:4,text:'Defeat baobab treants'},
            {visit:'memory',after:true,text:'Read the memory trees',say:['(The bark is cut with rings of small marks. Whole lines of them are gone, scraped away by something that did not know how to read.)','(What is left says, over and over: "We were given a second shape, and we kept the song, and we forgot what it was for.")']}],
     done:['"Forgot what it was for." Yes. That is the line I could never remember.','The Hollowed walk past the trees every night and do not look up. They were Kin once. Remember that when you meet them, though do not hesitate either.','The song goes on into the delta. Kesi can take you.']},
    {id:'dr3',title:'The delta ferry',from:'kesi',to:'kesi',
     offer:['The ferrymen of the Sedge Delta answer to no house, but they know the old song. I can only take you as far as the reeds, because the hippos have gone strange.'],
     parts:[{kill:'deltahippo',n:5,text:'Defeat delta hippos'},{kill:'reedserpent',n:5,text:'Defeat reed serpents'},{gather:'gathering',n:4,text:'Gather 4 herbs'},
            {visit:'delta',after:true,text:'Cross the Sedge Delta to the ferry',say:['(The ferryman poles in silence. Halfway across he sings, very softly, the same tune as Tamsa.)','"The Mother leads them where the water was." He stops. "That is where it ends, for most of us. We have never asked why."']}],
     done:['He sang it too. So it is not only Elder Tamsa.','The herds follow a leader on the Sunstair, the great one they call Oldhorn. Wiru says the grey sickness is in her too. The healer wants to see you.']},
    {id:'dr4',title:'The relapse herb',from:'wiru',to:'wiru',
     offer:['Grey in the veins, grey in the eyes, and at night they walk toward the Sunstair. I have seen it in Kin, in cattle, in the vultures that used to come to me for company.','I can make a draught to slow it, if you bring me what the sick animals carry: horns from the Greyhide rhinos, feathers from the Dawnless vultures. Take care. They are not angry. They are very, very tired.'],
     parts:[{kill:'greyrhino',n:5,text:'Defeat Greyhide rhinos on the Sunstair'},{kill:'dawnvulture',n:5,text:'Defeat Dawnless vultures'}],
     done:['That will hold the worst of it. I could not heal them. I could only stop them from getting worse.','Go up to the top, to Oldhorn. Tamsa told me the last line of her song this morning. She cried. It goes: "...and the Mother lies down at the top of the stair, and the herd lies down with her."']},
    {id:'dr5',title:'Oldhorn',from:null,to:'tamsa',
     bossLine:'Oldhorn lowers her great head to the stone. The grey drains from her flanks like dust blown off a drum, and the calves below the terraces raise their heads, all together, and listen.',
     parts:[{boss:'oldhorn',text:'Defeat Oldhorn, the Herd-Mother, on the Sunstair'}],
     done:['They stopped. All the herds, in one moment, from the delta to the pools. Kesi says they turned east to face the sunrise as if they had heard their name.','My song ends there. I never knew. I am an old woman who sang a lullaby and did not ask what it was for.','...The Crown gave us a second shape, they say. I wonder now what it took in return. Not today. Today the herds are home.']}
  ]},
  /* ---------------- The Emberwake Isles (levels 42-48), three chains: the Salt Watch (to Ocelo), the Drowned Strait (to Tuila) and the Terrace Road (up to the Seven Gates). BASE SETTINGS ONLY: Yuval co-writes the story zone by zone (docs/EMBERWAKE.md) ---------------- */
  {id:'saltwatch',name:'The Salt Watch',land:'isles',lv:42,res:['rimeore','frostwood','snowmoss'],cos:'a:saltlight',steps:[
    {id:'sw1',title:'Fouled nets',from:'lani',to:'lani',
     offer:['The nets come up full of black sand and nothing else. The crab-brutes have moved into the shallows, and the raiders are taking whatever the crabs leave.','Clear the Black Sand Landing for us, please. Then speak to Eleaka: she has been counting stars again and does not like her answer.'],
     parts:[{kill:'crabbrute',n:6,text:'Defeat crab-brutes at the Black Sand Landing'},{kill:'reefraider',n:5,text:'Drive off the reef raiders'}],
     done:['Thank you. The beach is quiet, and quiet is a start.','Eleaka is on the jetty. She is always on the jetty.']},
    {id:'sw2',title:'The stars that went out',from:'eleaka',to:'eleaka',
     offer:['Every night I mark the stars above the eastern edge of the sea. Every night there are fewer. A navigator who says so aloud is called a poor navigator.','Go to the Lagoon Shallows after dark and look east. Clear the rays and the shell-beetles first, or you will look at the sea from underneath it.'],
     parts:[{kill:'lagoonray',n:5,text:'Defeat lagoon rays'},{kill:'coralbeetle',n:5,text:'Defeat coral beetles'},
            {visit:'lagoon',night:true,after:true,text:'Watch the eastern sky from the Lagoon Shallows',say:['(East of the lagoon the sky is a hand wider and darker than the sky around it. Nothing moves in it. Nothing is lit in it.)','(It might be cloud. It might be the shape of something that drinks light.)']}],
     done:['So it is not my eyes. Thank you.','The old stories say the jungle city kept a lord who ate the sun at night and gave it back at dawn. Elder Hina tells it better. Ask her.']},
    {id:'sw3',title:'The lord of the court',from:'hina',to:'hina',
     offer:['Sit. There are many verses and only one of them matters tonight: "the Jaguar-Lord held the sun in his mouth, and the sun was glad of it."','Glad, mind you. Not trapped. I have sung it for sixty years and never once asked who was glad.','Go to the plaza in the jungle. Do not take the verse as an order, or as a warning. Take it as a question.'],
     parts:[{kill:'junglehog',n:5,text:'Defeat jungle hogs on the Jungle Edge'},{kill:'stonejaguar',n:4,text:'Break the stone jaguars of the plaza'},
            {visit:'plaza',after:true,text:'Walk to the Overgrown Plaza',say:['(A court of long stone walls, grass to the knee, and in the middle a ring of old gold that does not tarnish.)','(Something large is asleep under the ring. It breathes in time with the surf.)']}],
     done:['You have seen it. Then you know why the verse is a question.','Go and ask it, Hina says, and I say it as well, because I cannot say it a second time.']},
    {id:'sw4',title:'Ocelo',from:null,to:'makoa',
     bossLine:'Ocelo lowers his great head onto the gold. The shadow that lay over the eastern sky thins, and one star, then two, come back above the lagoon.',
     parts:[{boss:'ocelo',text:'Defeat Ocelo, the Sun-Jaguar, in the Jaguar Court'}],
     done:['The stars came back. Eleaka counted them twice and wept both times, and denies it.','The verse has a second half, Hina says, that she was never taught. Perhaps the jaguar was the one who knew it.','Take this for the road. The Strait is next, and it is not as patient as the sun.']}
  ]},
  {id:'strait',name:'The Drowned Strait',land:'isles',lv:44,after:'saltwatch',res:['rimeore','frostwood','snowmoss'],cos:'c:tidecape',steps:[
    {id:'st1',title:'The tide that does not turn',from:'eleaka',to:'eleaka',
     offer:['The tide used to come in and go out. For three days it has come in and stayed in, and the strait east of the jungle is a hand higher every morning.','Raiders have taken the cenote rim for a camp: they say the water has opened a way. Clear them out, and tell me what the water is doing.'],
     parts:[{kill:'cenoteeel',n:5,text:'Defeat cenote eels at Cenote Rim'},{kill:'straitraider',n:5,text:'Drive off the strait raiders'}],
     done:['They said the water had opened a way. Where to, they did not say?','Healer Nalu has been treating raiders who came back from the rim. She wants to see you.']},
    {id:'st2',title:'Salt in the herbs',from:'nalu',to:'nalu',
     offer:['The ones who came back have salt in their lungs and cannot say why. They talk about a woman in the water who counts them.','I need herbs that grow above the tideline, and I need to know whether the tideline is where it was. Gather, and then look at the strait.'],
     parts:[{gather:'gathering',n:4,text:'Gather 4 herbs'},{kill:'hollowfaithful',n:5,text:'Defeat the Hollowed Faithful'},
            {visit:'strait',after:true,text:'Look at the Drowned Strait',say:['(The strait is flat as a plate and the colour of a held breath. The posts of a causeway stand in it, up to their necks.)','(A long way out, something rises and sinks. It could be a swell. It could be a head.)']}],
     done:['The water is where the causeway used to be, then. I had hoped the raiders were exaggerating.','Kekoa dives these waters. Ask him what lives at the bottom of the strait, and whether it has been counting.']},
    {id:'st3',title:'Tuila',from:null,to:'kekoa',
     bossLine:'Tuila sinks into her own tidepool, and the strait lets go of a breath it has been holding for three days. Far out, the posts of the old causeway stand dry to the knee.',
     parts:[{boss:'tuila',text:'Defeat Tuila, the Tide-Caller, at her tidepool'}],
     done:['The tide turned! I felt it in my feet before I saw it. The whole jetty groaned.','She counted divers, he said, back then. Not to drown them, I think. To keep them. There is a difference, and I will not say which side I would have been on.']}
  ]},
  {id:'terraces',name:'The Terrace Road',land:'isles',lv:46,after:'strait',res:['rimeore','frostwood','snowmoss'],cos:'a:condorwind',steps:[
    {id:'tr1',title:'The road east',from:'makoa',to:'makoa',
     offer:['With the strait low again the isthmus is dry, and the Highland stands in the sunrise like a held breath. Nobody in Coralhaven has been up the Terrace Road in my lifetime.','Go and see who keeps it. I have a guess, and I would rather you did not tell me which part of it is wrong.'],
     parts:[{kill:'ropespinner',n:5,text:'Defeat rope-spinners on the Terrace Slopes'},{kill:'terracemason',n:5,text:'Defeat the terrace masons'}],
     done:['The road is not empty, then. Somebody has been mending it for a very long time.','Mele keeps the notices. She says there is a name on one that nobody in Coralhaven put there.']},
    {id:'tr2',title:'A notice nobody wrote',from:'mele',to:'mele',
     offer:['It is in a hand I do not know, on a board that did not exist yesterday: "WE ARE STILL COUNTING." Below it is a tally. Seven columns.','Seven columns, and one is not finished. Take a look at the Terrace Road and tell me what is being counted up there.'],
     parts:[{kill:'highlandcondor',n:5,text:'Defeat highland condors on Condor Heights'},{kill:'roadsentinel',n:5,text:'Break road sentinels'},
            {visit:'terraces',after:true,text:'Climb the Terrace Slopes',say:['(Terraces cut into the slope like a stair for something larger than people. Every seventh wall has a niche, and every niche is empty.)','(At the top a gate stands in a wall with no building behind it. It is not locked. It does not need to be.)']}],
     done:['Seven gates, then, and I did not know how many there were.','What goes through them, and which way, is a question for somebody older than I am. Old Hina has not slept, and I do not think she will.']},
    {id:'tr3',title:'What the gates count',from:'hina',to:'hina',
     offer:['Every verse I know ends before the seventh gate. I thought that was because the singers forgot. I think now that they stopped.','Tell Chief Makoa what you saw, all of it. A chief ought to know what is in his own sunrise.'],
     parts:[{talk:'makoa',after:true,text:'Tell Chief Makoa what you saw on the Terrace Road',say:['Seven gates. The sun, the sea, the road, and four more I cannot name.','We will keep the road. Go back to Hina, she will want to hear that it was kept.']}],
     done:['Kept. Then it is a verse with an ending, at last, and I will sing it badly for the rest of my life.','The isles have a long way yet to go before they are finished with you, or you with them. Take this.']}
  ]}
];
const SQ_BY_ID={}; SQ.forEach(C=>{ SQ_BY_ID[C.id]=C; C.steps.forEach((s,i)=>{ s.i=i; s.chain=C.id; }); });
const sqHas=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const sqChain=id=>sqHas(SQ_BY_ID,id)?SQ_BY_ID[id]:null;
// a step's pay: the chain's three resources, more for later steps (the last one pays double), and a little XP (6% of a level at the chain's level: a sixth or less of a main quest step's).
// A side quest is about resources and its cosmetic, never a shortcut to levels.
const SQ_XP_K=0.06;
function sqReward(C,i){
  const last=i===C.steps.length-1, n=(3+i)*(last?2:1);
  return {res:C.res.map((r,k)=>[r,k===2?Math.ceil(n*0.7):n]), xp:Math.round(SQ_XP_K*(last?2:1)*expToNext(C.lv)), cos:last?C.cos:null};
}
// the progress of a chain in a save (a copy of nothing: read only)
const SQ_NONE={s:0,st:0,n:[]};
const sqEntry=(sq,id)=>(sq&&sq.c&&sqHas(sq.c,id)?sq.c[id]:SQ_NONE);
const sqDone=(sq,id)=>{ const C=sqChain(id); return !!C&&sqEntry(sq,id).s>=C.steps.length; };
// can a chain's first step be taken: its level and the chain before it
const sqOpenFor=(C,sq,level)=>level>=C.lv&&(!C.after||sqDone(sq,C.after));
function newSq(){ return {c:{},t:''}; }
function sanitizeSq(m){
  const out=newSq(); if(!m||typeof m!=='object') return out;
  if(m.c&&typeof m.c==='object') for(const C of SQ){ if(!Object.prototype.hasOwnProperty.call(m.c,C.id)) continue; const e=m.c[C.id]; if(!e||typeof e!=='object') continue;
    const s=mqInt(e.s,0,C.steps.length,0), step=C.steps[s];
    const n=step?step.parts.map((pt,i)=>mqInt(Array.isArray(e.n)?e.n[i]:0,0,mqNeed(pt),0)):[];
    let st=step?mqInt(e.st,0,2,0):0;
    if(step&&st===0&&step.from===null) st=1;
    if(step&&st===2&&!mqAllDone(step,n)) st=1;
    if(s||st) out.c[C.id]={s,st,n};
  }
  if(sqChain(m.t)) out.t=m.t;
  return out;
}
/* Talking to someone: what they say about the side quests and what it does, for every chain at once. sq: gear.sq; returns
   {lines, acts: [{c: chain id, start, parts: [part indices done by this talk], complete, next (the chain's next step starts in the same talk)}]} */
function sqTalk(sq,npc,level,night){
  const out={lines:[],acts:[]};
  for(const C of SQ){
    const E=sqEntry(sq,C.id), step=C.steps[E.s]; if(!step) continue;
    let st=E.st; const n=step.parts.map((pt,i)=>E.n[i]||0), a={c:C.id,start:false,parts:[],complete:false,next:false};
    if(st===0&&step.from===npc){
      if(E.s===0&&!sqOpenFor(C,sq,level)) continue;
      a.start=true; st=1; for(let i=0;i<n.length;i++) n[i]=0; out.lines.push(...(step.offer||[]));
    }
    if(st===1){
      step.parts.forEach((pt,i)=>{ if(pt.talk!==npc||!mqOpen(step,n,i)) return;
        if(pt.night&&!night){ out.lines.push(...(pt.wait||[])); return; }
        n[i]=mqNeed(pt); a.parts.push(i); out.lines.push(...(pt.say||[])); });
      if(mqAllDone(step,n)&&step.to!==null) st=2;
      else if(!a.start&&!a.parts.length&&npc===step.from) out.lines.push('('+C.name+': '+sqObjective(step,n)+')');
    }
    if(st===2&&step.to===npc){
      a.complete=true; out.lines.push(...(step.done||[]));
      const nx=C.steps[E.s+1]; if(nx&&nx.from===npc){ a.next=true; out.lines.push(...(nx.offer||[])); }
    }
    if(a.start||a.parts.length||a.complete) out.acts.push(a);
  }
  return out;
}
// what to do now, in a few words (the quest log, a reminder from the giver)
function sqObjective(step,n){
  if(mqAllDone(step,n)) return step.to?'Return to '+SQ_NAMES[step.to]:'';
  const i=step.parts.findIndex((pt,k)=>mqOpen(step,n,k)); if(i<0) return '';
  const pt=step.parts[i], need=mqNeed(pt); return pt.text+(need>1?' ('+(n[i]||0)+' / '+need+')':'');
}
// the name of the person a step wants, with their village (the quest panel and the log)
const sqWho=id=>SQ_NAMES[id]+' in '+SQ_VIL_NAMES[SQ_NPC_VIL[id]-1];
