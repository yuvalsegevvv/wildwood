//@ The main quest line (MQ: acts I-IV, docs/MAIN-QUEST.md), its places (Wren's sickbed, Odran's carts, heartleaf, grey spots) and the readable lore spots (LORE: carvings, signs, the drowned roads, the Hoarfrost's runes and wreck). Pure.
/* The story is docs/STORY.md (mind its spoiler rule: hints only, no modern words). Each step:
     id, title, gate (level it is offered from), from (villager id who offers it; null = starts by itself when the step before ends),
     to (villager id you hand it in to), r (XP reward: r x expToNext(gate), so it keeps its share if the curve is tuned),
     tip (a one-time tutorial toast when the step starts), offer / done (what the giver says when offering / handing in; the
     client shows them), parts (what to do; all at once unless a part says after:true, which waits for the parts before it).
   Parts: talk:'<villager id>' (say: their lines; night: only after dark, wait: their lines before that) · kill:'<monster id>', n ·
     grey:'<GREY_DEFS id>', n, zone (a few are spawned for you there; night:true: only after dark) · pick:'herb', n (glowing heartleaf, HERBS) ·
     collect:'<what>', from:[monster ids], n, chance (a quest drop; with gather:'<NODE_KINDS id>' too, either counts: dig it or take it from the monsters) · gather:'<NODE_KINDS id or profession id>', n (a resource node gathered) · read:'<LORE id>' (walk up
     and read it) · act:'<system>', n (class, buy, armor, skill, burst, board, sell, upskill, merge, warp, hanami, rimehold, highmark, learn (prof:'<profession>'), tool (tool:'pick|axe|sickle', tier: a tool
     of at least that tier is worn), craft (kind:'weapon|armor'), brew (kind:'heal|might|guard', minTier 0-2), potion (kind): see server/main-quest.js) · level · tier
     (a weapon of that item tier, 0-based) · boss:'<boss monster id>' (bossLine: toasted when it falls) · visit:'<MQ_PLACES key>' (walk there; say: lines shown in the speech bubble on arrival).
   A kill or grey part may carry spawn:'<MQ_PLACES key>' (a few of that monster are spawned for you there, like the grey ones); a step may carry at:{npc:[places]} (mqStoryAt) and fx:'ripple|ash|grey' (a dark moment shown on the client when the part finishes). A step may carry intro: lines the
   previous step's last talk says after its own (a step with from:null has no giver to open with). The prologue P1-P6 is docs/WILDWOOD-STORY.md.
   Progress is gear.mq = {s: step index, st: 0 offered / 1 in progress / 2 ready to hand in, n: [per part]}; the server
   (server/main-quest.js) moves it on, the client (game/economy/main-quest.js) draws it. */
const MQ=[
  /* ---------------- Act I: The Grey Rain (Wildwood, levels 1-15) ---------------- */
  /* ---------------- Prologue: The Sheaf-Crown (the home village, levels 1-2; docs/WILDWOOD-STORY.md, scenes 1-6) ---------------- */
  // Tansy leads: her spot moves with the step (mqStoryAt). Wren is well until P6 (the healthy Wren 'wren0'), then the sick one in the bed.
  {id:'P1',title:'A morning in the village',gate:1,from:null,to:'tansy',r:0.08,at:{tansy:['@well']},
   tip:'Move with W A S D (or the joystick) and look around with the mouse. Walk up to someone and press the talk key (E) to talk.',
   parts:[{talk:'tansy',text:'Talk to Tansy by the well',say:[
     '@cine A morning in Wildwood',
     '(Dawn, the week of the harvest moon. Mist lies in the village like milk in a bowl. Greta\'s hammer is already ringing, the bell on the well-post swings for no one, and over the roofs the Heartwood stands up out of the forest: one dark tree, as big as a hill, and very still.)',
     'You: Something about this morning feels borrowed. I know every crack in this village, and I can\'t remember learning a single one.',
     'You: It\'s like I came a very long way to stand here, and someone swept the road behind me. ...Odd. Never mind.',
     'Tansy: There you are, {name}, sleepyhead! Half the village has been up since the roosters.',
     'You: Half the village didn\'t sit up till midnight carving a goat.',
     'Tansy: That goat was a masterpiece. Ask anyone.',
     'Wren: It was a lump, Tansy.',
     'Tansy: A masterpiece of a lump.',
     'Wren: (laughing, to you) Don\'t listen to her. She\'s been awake since last night. She says she can\'t sleep until the barley is counted.',
     'Tansy: The barley is very important, love. Anyway, guess what I remembered.',
     'Wren: The Sheaf-Crown.',
     'Tansy: Wren! I was building to that!',
     'Tansy: The old crown, pet. It\'s still in my barn, under a hundred years of dust and one very offended owl.',
     'Wren: Whoever wears it at sunset is harvest queen, and everyone else tries to snatch it. You always hid behind the scarecrow.',
     'You: It was strategy.',
     'Wren: You said it was "terrain."',
     'Tansy: It was terrain. Strategically placed straw.',
     '(Wren winds a loose blue thread round a finger, not looking at either of you.)',
     'Wren: I haven\'t played it since Mum. Since it\'s just us now. I thought it would be nice. One more time, before it gets cold.',
     '(Nobody says anything. A cart creaks somewhere. The bell on the well-post gives one small, lonely note.)',
     '@pick Then once more it is. And I\'m not hiding behind the scarecrow. >> Wren: Liar. (They smile, properly, for the first time this morning.) | I\'ll play. But I\'m warning you, I\'m winning. >> Wren: Big words from someone who hid behind straw. (They laugh, and the sound startles you both.) | Are you sure you\'re ready for that? >> Wren: (quietly) No. But I\'d rather be not-ready with you than ready without you.',
     'Wren: I have to feed the hens first, or they\'ll sulk. Go and fetch the crown, I\'ll save us a spot at the well. Promise, {brother}?',
     'You: Promise.',
     '(Wren goes off across the green, humming. It is a slow tune, four notes falling, and it stops short, as if the song forgot its ending. You have heard it all your life. You have never heard anyone finish it.)',
     '(Behind you, in the well, a single ripple crosses the water from one wall to the other, and stops. There is no wind.)',
     'Tansy: Come on, pet, before I get sentimental and cry into the well. Out to the farm for the crown, and back before the bread\'s cold.']}],
   done:['Tansy: Right. Out to the farm and back. You\'ll see the crown is every bit as ridiculous as I say. Come on, pet. I\'ll run ahead. Keep up if you can!']},
  {id:'P2',title:'The road to the farm',gate:1,from:null,to:'tansy',r:0.06,at:{tansy:['road1','road2']},
   tip:'You always run; Shift is a quick dash, and Space jumps. L opens your quest log. The minimap (and the map, N) shows where to go: follow the violet marker.',
   parts:[{visit:'road1',text:'Follow Tansy out of the gate',say:['Tansy: Mouse turns the camera. Shift is a dash, for when something is chasing you. Try it, I\'ll wait.','Tansy: There. See the little map in the corner? The violet diamond is where we\'re going. Don\'t lose me. I\'m easy to lose.','Tansy: Do you smell that? That\'s mint. Ambrose says it keeps the marsh-flies off. Ambrose says a lot of things.']},
          {visit:'road2',after:true,text:'Jump the fallen log (Space)',say:['Tansy: Over the log! Space bar. There you go. Look at you, not even out of breath.','Tansy: Funny, isn\'t it? Every child in the village grows up on this path. We all tied our ribbons on the Row the autumn we turned nine, and the elders said the roots knew our names after that.','Tansy: Silly, probably. Roots don\'t know anything. But I\'d never say that to the old folks.','Tansy: Wren\'s ribbon is blue. So is yours. You walked Wren down here yourself, the autumn they turned nine, and held their hand so tight they couldn\'t open it.']}],
   done:['Tansy: Slime. Three of them, in the meadow. They won\'t hurt much, but they bite, and they bite wet.']},
  {id:'P3',title:'Slimes on the path',gate:1,from:null,to:'tansy',r:0.3,at:{tansy:['meadow']},
   tip:'Press Tab to pick a target, then F (or 1) to attack. The bar over a monster shows its health and level.',
   intro:['Tansy: Press Tab to pick one. Then F to swing. That\'s the whole art, honestly.','Tansy: See the bar over its head? Green is its health. The number is its level. Yours is one, same as theirs, so it\'s fair.','Tansy: I\'ll take the little one. You take the others. Watch my feet: never stand where it\'s about to bounce.'],
   parts:[{kill:'slime',n:2,spawn:'meadow',fx:'ripple',text:'Defeat the slimes on the path'}],
   done:['(The last slime goes grey from the edges inward, and lies still. The birds have stopped.)','Tansy: ...That was odd. They don\'t usually go that colour.','Tansy: Rot in the soil, most likely. Happens after a wet week.','Tansy: Don\'t look like that. It\'s a slime. They get things. I had a whole field go grey once and it came back.','Tansy: Come on. The crown\'s waiting.']},
  {id:'P4',title:'The farm',gate:1,from:null,to:'tansy',r:1.2,at:{tansy:['road3','farm']},
   tip:'The weapon you hold is your class: sword (Warrior), bow (Archer) or wand (Mage). Open the inventory (I) and put a different weapon in your hand. Change whenever you like.',
   intro:['Tansy: Nearly there. That\'s my farm ahead. It\'s smaller than I remember saying it was.','Tansy: That\'s the barley. Well, that was the barley. The south corner\'s been poor this year. Don\'t look at that bit. Look at the good bit.','Tansy: That\'s the barn, and that\'s Old Hob in the yard. The scarecrow. He\'s been standing there since before I could walk. He takes a beating well.','Tansy: The crown\'s up in the loft, left of the beam. Mind the ladder: the fourth rung is more of a rumour.'],
   parts:[{visit:'road3',text:'Walk on to the hedge',say:['Tansy: Past that hedge the fields start. My fields. Well. Mine and the barley\'s.','Tansy: Mind the meadow, it\'s wet this week. It\'s been wet a lot lately.','Tansy: The elders say the forest was never this damp when they were young. They say the years before were quiet. Dry, and quiet, whatever that means.','Tansy: Come on.']},
          {visit:'loft',after:true,text:'Fetch the Sheaf-Crown from the barn loft',say:['(You lift the Sheaf-Crown down from its nail.)','Tansy: There she is. Look at that. The moths have been at her, but she\'s still the finest crown in the village.','Tansy: My mother braided that. She said a crown is just a promise tied up in straw. Someone has to wear it, so everybody else has something to run after.']},
          {act:'class',after:true,text:'Try another weapon on Old Hob (inventory, I)',say:['(A rack by the door: a bow, a wand, a sword.)']}],
   done:['Tansy: Right, while we\'re here. The weapon you hold is your class. Sword in your hand, you fight like a warrior. Bow, you hang back and pick them off. Wand, and the sky does what you ask.','Tansy: Hah! Look at you. You\'ve got the hang of it faster than I did.','Tansy: Keep whichever feels like yours. You can change any time. There\'s no wrong answer, just a different kind of tired.','Tansy: Right. Crown, check. Weapon, check. Back to the village before Wren starts without us.','Tansy: ...You know, It\'s nice, having you here when it isn\'t harvest or hoeing. Don\'t tell anyone I said so.']},
  {id:'P5',title:'The road back',gate:2,from:null,to:'tansy',r:0.4,at:{tansy:['clearing']},
   tip:'Your skill sits in slot 2 (key Q or 2). It dims while it recovers: wait for the ring to fill, then use it again. K opens the skills panel.',
   intro:['Tansy: Shrooms. Three of them. The spores make you cough, so keep your distance if you can.','Tansy: You\'ve got more than a swing in you, you know. Everybody does. It just wakes up when it\'s needed.','Tansy: Press Q. Or 2. Go on, I\'ll cover you.'],
   parts:[{act:'skill',text:'Use your new skill (Q or 2)'},{kill:'shroom',n:3,spawn:'clearing',fx:'ash',text:'Defeat the shroomlings in the clearing'}],
   done:['Tansy: Did you feel that? That\'s yours. Aldric at the well teaches the proper ones. But that one\'s yours for free.','Tansy: Skills are big and slow, swings are small and quick. Use both.','(Grey spores drift. The sky over the village has turned the colour of ash.)','Tansy: ...That\'s too many strange things for one day: the slimes, the shrooms, the sky.','Tansy: I don\'t like it. Come on. I want to see Wren.','(She says it lightly, but her humming has stopped.)']},
  {id:'P6',title:'Wren',gate:2,from:null,to:'tansy',r:0.3,at:{tansy:['@bedside']},
   parts:[{visit:'home',fx:'grey',text:'Hurry home to Wren',say:[
     '(The village is silent. No birds. A grey light, at noon. Wren lies on the bed under the awning. Grey lines run under the skin of both arms. The blue ribbon in their hair has gone grey.)',
     'Tansy: Wren? Wren!',
     'Tansy: Don\'t talk, love. Don\'t. We\'ve got you.',
     '(Wren\'s eyes follow you, but no sound comes. Their fingers close, slightly, around your sleeve, then relax.)',
     'Tansy: It\'s the same grey. It\'s the same grey as the slime.',
     'Tansy: Their arms are cold. Why are their arms cold?']}],
   done:['(Tansy sets the Sheaf-Crown gently on the pillow beside Wren\'s head.)','Tansy: I\'m not good at this. I\'m good at barley and I\'m good at shouting. I\'m not good at... this.','Tansy: Someone must know it. Linnea knows every herb in the forest and half of those outside it. And Dunstan has been all over: the road north, the passes, even the sea.','Tansy: I\'ll walk to the end of the world if I have to. You with me?','Tansy: Hold on, little one. We\'re coming back.']},
  {id:'W1',title:'Who knows a cure?',gate:1,from:null,to:'dunstan',r:0.9,
   tip:'Coins come from monsters and quests. Buy at the stalls, then wear it: the inventory (I) shows what you wear and what you carry.',
   parts:[{talk:'linnea',text:'Ask Healer Linnea about the grey',say:['Linnea: I\'ve tried willow, mint and sap. I don\'t know this grey. I can keep Wren comfortable, nothing more.','Linnea: Ask Dunstan. He has walked further than anyone in this village.']},
          {talk:'dunstan',after:true,text:'Ask Dunstan, under his banner',say:[
     '(Dunstan is drumming a slow beat under a banner. He stops when he sees your face.)',
     'Dunstan: Your face says it before you do. It\'s Wren.',
     'Dunstan: Grey under the skin. A sleep that doesn\'t break. I\'ve seen it once. A fisherman\'s boy, on the northern coast. Seven winters ago.',
     'Tansy: What happened to him?',
     'Dunstan: ...A woman came down off the hills, in a grey cloak, with moss and ash on her hands. She did something, and the boy sat up. For a day.',
     'Dunstan: She couldn\'t cure it. But she held it. Long enough for his father to carry him south, to people who knew more. I never heard whether he lived.',
     'Tansy: And the woman? Where is she now?',
     'Dunstan: Here, I think. I never saw her face, but a witch in a grey cloak lives in the east of this forest. Past the Mushroom Hollow, where the paths stop. Everyone in the village has a story about her, and none of the stories agree.',
     'Dunstan: Go. But don\'t go proud. She doesn\'t care who you are or why you\'ve come. And if she says no, don\'t shout. Wait. She says no to everyone, once.',
     'Dunstan: And get something between you and the woods first. Ilse\'s stall. Boots, a cap, anything.',
     '(Dunstan lifts his drum and plays four beats, slow and level.)','Dunstan: That\'s for luck. Go on.']},
          {act:'buy',after:true,text:'Buy a piece of armour at Ilse\'s stall (boots, a cap, anything)'},{act:'armor',after:true,text:'Wear a piece of armour (inventory)'}],
   done:['Dunstan: It suits you. Whatever the witch says, keep your head up and your step on the beat.']},
  /* ---------------- Act I, the cure and the Warden's dark (levels 2-15; docs/WILDWOOD-STORY.md, scenes 8-38) ---------------- */
  // The witch, Morrow, lives east of the Mushroom Hollow; Torgeir (torgeir0, at the gate) walks north with you; Pip lives in a hollow by the Ancient Grove.
  // A step's `at:{npc:[place per open part]}` moves a story villager to that place of MQ_PLACES ('@name' = an anchor of the home village) while the step is under way.
  {id:'W2',title:"The witch's door",gate:2,from:null,to:'morrow',r:0.5,
   tip:'L opens your quest log. The map (N) and the minimap mark where the main quest wants you with a violet marker.',
   parts:[{talk:'morrow',text:'Find the witch east of the Mushroom Hollow, and knock twice',say:[
     '(The hut is small, low and crooked, thatched, with bundles of herbs drying under the eaves. The door opens a crack.)',
     'Morrow: Go away.','Tansy: We\'ve come a long way, and--','Morrow: I know how far. Everyone has come a long way. Go away.',
     '(The door closes. Tansy turns, furious.) Tansy: Of all the--',
     '(You remember Dunstan\'s words, and knock again. The door opens a hand\'s breadth.)',
     'Morrow: You again. You\'re the first to knock twice. ...Who\'s sick?',
     'Tansy: Their sibling. Wren. Grey in the arms. The healer can\'t--',
     'Morrow: I know what it is. I won\'t help. I\'ve seen what comes of helping.',
     'Morrow: But I\'ll tell you why. I don\'t help people who ask for the cure and leave the rest. I help people who\'ll do the work.']}],
   done:[]},
  {id:'W2b',title:'Three small things',gate:2,from:'morrow',to:'morrow',r:0.6,
   tip:'Defeated monsters can drop materials: check your bag (I). A quest drop shows in the quest log.',
   offer:['Morrow: Three small things. Not to impress me. To show you can walk through a forest without breaking it.','Morrow: One. Spore caps from the Hollow. Five. Whole, not bruised.','Morrow: Two. Sunpetal, three stems, cut clean, not torn. Keep them: the third task needs them. The Wayfarers\' Lodge teaches how, if you haven\'t learned. Don\'t tell them I sent you.','Morrow: Three. A healing draught of your own making. Not bought. Brewed, so I know your hands can do it. I can tell a bought one by the taste.','Morrow: Bring them. Or don\'t.'],
   at:{tansy:['@well']},
   parts:[{collect:'Spore cap',from:['shroom'],n:5,chance:0.7,text:'Take five whole spore caps from the shroomlings of the Mushroom Hollow'}],
   done:['Tansy: Don\'t squeeze them. Whole, she said.','(In the garden the herbs are grey at the tips. Crows circle and leave.)','Morrow: ...Thank you. Fresh. Whole. Hm.','(She glances at the grey garden, frowns, and says nothing.)','Morrow: Two more.']},
  {id:'W6a',title:'Working hands',gate:4,from:'tamsin',to:'tamsin',r:0.5,
   tip:"The Wayfarers' Lodge teaches three professions, each with its own tool: mining (pickaxe), woodcutting (axe) and gathering (sickle). Wear the tool (inventory, I), walk up to a herb, a vein or a tree and press the gather key (H, or the talk key E). What you take is used by the smiths, the armourers and the healers.",
   offer:['Hollen: Welcome to the Wayfarers\' Lodge, {name}. The woods give back, if you know how to ask.','Tansy: She wants sunpetal. Cut clean.','Hollen: ...Morrow sent you.','Hollen: I won\'t ask how you know. Everyone\'s been to her door, once. She used to live in the village, you know. She was our healer, before Linnea. Everybody loved her.','Hollen: Then a winter came when she couldn\'t save a child, and a rumour went round that she\'d done it on purpose. She walked out that spring and never came back.','Tansy: That\'s... that\'s horrible.','Hollen: It was. We were wrong. Nobody ever told her so.','Hollen: Gathering is sixty coins to learn, thirty for a sickle. Wear it, stand by the herb, press the gather key. Gently. Don\'t pull.'],
   parts:[{act:'learn',prof:'gathering',text:"Learn Gathering at the Wayfarers' Lodge (Hollen)"},{act:'tool',tool:'sickle',text:'Buy a sickle from Hollen and wear it (inventory)'},{gather:'gathering',n:3,text:'Gather 3 sunpetal in the woods (it grows in every zone)'}],
   done:['Tansy: Funny. All these years I thought she was a monster in a hut.','Hollen: Most of us did. Take her this seed-cake. Tell her... tell her someone remembers.']},
  {id:'W7b',title:"Linnea's kettle",gate:5,from:'linnea',to:'linnea',r:0.5,gift:'herbs',
   tip:'Brewing is done at a healer\'s: three sunpetal and a few coins make one Healing Potion. Keep your sunpetal, do not sell it (Linnea will make sure you have enough). Brew it, then drink it. Drink a potion with Z (healing), X (might) or C (guard): the strongest one you have is used. A healing potion needs you to be hurt.',
   offer:['(Ambrose, a marsh herbalist with a reed hat slung on his back and a mint sprig in his knot, is helping at the kettle.)','Linnea: A draught of your own making? For Morrow? ...Sit. Watch.','Ambrose: There now. Sunpetal and a splash of spring water. Gently, gently.','Linnea: So she\'s asking for a test. She did that to me once. Twenty years ago.','Tansy: She taught you?','Linnea: Everything. The willow, the mint, the patience. And then I stayed when she left, and she never forgave me, and I never found a way to say sorry.','(Linnea hands you a small bundle of dried willow.) Linnea: Take this to her. It\'s the willow she taught me with.','Ambrose: Drink one yourself when you\'re half gone, not when you\'re nearly dead. There now.'],
   parts:[{act:'brew',kind:'heal',text:"Brew a Healing Potion at Linnea's (herbs and a few coins)"},{act:'potion',kind:'heal',text:'Drink a Healing Potion when you are hurt (Z)'}],
   done:['Linnea: Bitter, isn\'t it, {name}? It\'s meant to be. Anything sweet is lying to you.','Linnea: Might and guard draughts want other herbs. Herbs are the same everywhere: the wild ones grow strongest.']},
  {id:'W6',title:'The board',gate:5,from:'maren',to:'maren',r:0.9,
   tip:'The quest board is how you grow between main quest steps: the main quest alone will not make you strong enough. The grey will not wait for someone who cannot fight.',
   offer:['Maren: Coin\'s the thing, then. The woods pay those who work. Take a notice from the board behind me.','Maren: Hunts, bounties, places to scout. Finish one and hand it in to me. You will want a few levels before whatever\'s out there.'],
   parts:[{act:'board',text:'Finish a notice from the quest board and hand it in'}],
   done:['Maren: There. The board is always here between the bigger things.','Maren: The forest remembers everything. Some of it is waking up.']},
  {id:'W2c',title:'The grey reaches her',gate:5,from:null,to:'morrow',r:0.6,
   parts:[{talk:'morrow',fx:'ripple',text:"Bring Morrow Linnea's willow and Hollen's message",say:[
     '(You hand Morrow Linnea\'s willow and the Lodge\'s message.)',
     'Morrow: Willow. ...That girl never could leave well alone. ...Someone remembers, does someone.',
     '(She takes your hand, smells the sunpetal and spring water on your fingers, and nods once. Her thumb rests on your wrist a moment longer than it should, and a small frown crosses her face, as if the hand hummed a chord she does not know... and a grey ripple crosses the clearing from the north. Her hands tremble. Grey veins creep along her wrist, then fade.)',
     'Morrow: ...That wasn\'t there this morning.','Tansy: It\'s the same! It\'s the same as Wren\'s!','Morrow: (very quietly) It\'s coming from the north. From the Circle. I\'d hoped I was wrong.','Morrow: There\'s a keeper in the Circle, the Rootwarden. If the grey is coming past it, the Warden is failing.',
     '(Morrow looks at her wrist, then north along the dark line of the trees.)','Morrow: I swore I\'d stay out of this. It has come to my door anyway, and I can\'t make it stop at my gate.','(She looks at you for the first time.)','Morrow: Come inside. I\'ll help. Not for you. For this forest. ...All right, a little for you.',
     'Morrow: The cure needs two things from the north: ghostcap from the old trees\' bark, and silverleaf from the cold side of the Thicket. The rest I have.',
     'Morrow: It\'s the north, past the Beetle Thicket and the Treant Grove, where the wild things live. They\'ve been quieter lately. I don\'t think that\'s a good sign.',
     'Tansy: Then I\'m coming.','Morrow: You\'re not. You\'re a farmer. You\'ll get yourself killed in an afternoon. Take a shield. Someone with a real one: Torgeir, the big man at your gate, the one who looks at the road all day.']}],
   done:[]},
  {id:'W7',title:'Torgeir at the gate',gate:6,from:null,to:'torgeir0',r:0.3,
   tip:'Torgeir walks the road north with you and waits at each place along it. The north is not the meadow: take board notices and hunt on the way, and come back when a place is too strong for you.',
   parts:[{talk:'torgeir0',text:'Ask the big man at the village gate to walk north with you',say:[
     '(Torgeir leans on a tall shield, watching the road north.)',
     'Torgeir: Heard. All of it. The whole village has.','Torgeir: I don\'t talk much. I\'ll walk the road ahead of you and wait at every bend. You do the fighting. The road is mine.',
     'Tansy: He means yes.','Torgeir: I mean yes.','Torgeir: One rule. If I say stop, you stop. If I say run, you run. The north\'s not the meadow.']}],
   done:[]},
  {id:'W8',title:'The peddler',gate:6,from:'odran',to:'odran',r:0.6,
   tip:'Sell spare items to a peddler: walk up to his cart, press the talk key (E) and use the shop panel to sell. Sell what you do not need.',
   offer:['(A cart rolls up the road, hung with curiosities: Odran, the peddler.)','Odran: Welcome, welcome, one and all! Curiosities, trinkets, a button from the other side of the sea! I buy too: spare shells, odd stones, whatever\'s in your bag.','Odran: Fair price, I think. If it\'s not, tell me and I\'ll tell you a better lie.'],
   parts:[{act:'sell',n:2,at:'cart',text:'Sell Odran two things at his cart'}],
   done:['Odran: A pleasure. Say... forgive me. Which of you was born in the village? Not came. Born.','Tansy: Why?','Odran: Curiosity. It\'s what I trade in. (He smiles. His eyes do not.)','@pick Born here. I think. >> Odran: You think? How very interesting. | Does it matter? >> Odran: Not yet. | (Look at Tansy.) >> Tansy: ...Don\'t look at me. I was born here and I have never been sure of anything.','Torgeir: (low, to you) Don\'t sell him anything you\'ll miss.']},
  {id:'W9',title:'The north road',gate:6,hard:8,from:null,to:'torgeir0',r:0.8,
   at:{torgeir0:['pellsite','thicket','grove']},
   tip:'The number over a monster is its level. Red means it is stronger than you.',
   parts:[{talk:'pell',text:'Pass Pell at the river crossing',say:['(At the water\'s edge Pell squats with a lantern, a spear across his knees.)','Pell: Mind the reeds, {lad}, they bite. You\'re going north.','Pell: Look at the water on the way. Everyone looks at the woods.']},
          {collect:'Silverleaf',from:['beetle'],n:3,chance:0.5,after:true,text:'Pick silverleaf on the cold side of the Beetle Thicket'},
          {collect:'Ghostcap',from:['treant'],n:3,chance:0.5,after:true,fx:'ripple',text:'Take ghostcap from the bark of the Treant Grove'}],
   done:['Torgeir: I watched you at the Thicket. They bite at the knees; the silverleaf\'s on the cold side of the trunks. Good eyes.','Torgeir: And the Grove. A big one. Never stand in a treant\'s shadow. ...Good. That\'s how you did it.','(The ripple crosses the forest. Grass greys in a circle, the treants twist, a beetle goes still.)','Torgeir: That\'s not the first I\'ve seen. I fought in the north, once. A long time ago. There were grey things there too.','Torgeir: I\'ll tell you about it some other time.']},
  {id:'W9a',title:'The lost one',gate:7,hard:10,from:null,to:'pip',r:0.4,
   at:{torgeir0:['pip']},
   parts:[{talk:'pip',text:'Find the child in the hollow beside the Ancient Grove (the old treants nearby are strong)',say:[
     '(A small boy sits barefoot in the grass. All around him the plants are grey, but a circle of green surrounds him, untouched. He has no ribbon, no cord, nothing of the village on him. He looks up at you and does not speak.)',
     'Torgeir: That\'s the lost one. Pip, they call him. No ribbon, no family. The village keeps away from him and doesn\'t come this far north.','Torgeir: Who\'s looking after you, Pip?','Pip: (very quiet) Nobody.','You: (quietly, to the boy) I\'m {name}. I won\'t hurt you.','(He glances at you, then at the grey fern by his foot.)',
     '(Pip touches a grey fern. It turns green under his fingers. He flinches and pulls his hand back.)',
     'Pip: It does that. I don\'t know why. I don\'t like it.','Pip: Everyone else goes away from me. This is the only thing that comes back.','Torgeir: (low) Tell no one. Not yet.',
     '(You offer him bread. He takes it carefully, as if nobody has before.)','Pip: Are you going to take me away?','You: No. But I\'ll come back.','Pip: ...I\'ll be here.']}],
   done:[]},
  {id:'W9b',title:'The cure',gate:8,from:null,to:'morrow',r:0.8,
   tip:'Your Power skill is in slot 3 (R or 3). It has a long cooldown: save it for the big moment.',
   parts:[{level:8,text:'Reach level 8 (the board and the woods will do it)'},
          {talk:'morrow',after:true,text:'Take the ghostcap and silverleaf to Morrow',say:[
     'Morrow: Ghostcap. Silverleaf. Good, no bruises. You can listen after all.','Morrow: Sit. Don\'t touch anything. If the kettle whistles, don\'t run.',
     '(She brews. Steam rises, green then silver. The grey in her wrist glows faintly, then quiets.)',
     'Morrow: There. It won\'t cure. Remember that. It will ease. It will hold the grey for a time. Weeks, perhaps. Not more.','Morrow: The village will call it the cure. Let them. It is a holding draught, and that is all it is.','Morrow: Take it to the child in the bed. A drop on the tongue, a drop on each wrist. Don\'t spill.',
     'Morrow: One more thing. Hold out your hand. The grey brushed you in the Grove. It woke something in you. Not the sickness.',
     'Morrow: Most people have three knacks in them: a trick, a swing, and a thing under the ribs they only find in a corner. Yours is awake early. Don\'t thank me. It\'s the grey\'s doing.',
     'Morrow: ...No. Wait. That isn\'t the grey\'s doing. Hold still.','(She closes her eyes. Her fingers hover above your chest, and the air between them hums with fire, then water, then earth, then air, then dark, then light. Each note in turn, and all six held at once.)',
     'Morrow: One soul carries one element. A rare soul carries two, and sings for years about it. Yours is... not choosing. It carries all six, and none of them is loud.','Morrow: I have not felt that in all my years. I do not know what you are. Keep it to yourself until I do.','You: Is that bad?','Morrow: I don\'t know. Ask me again when the Warden is quiet.','You: Morrow. Since the first morning I have felt as if I came a very long way to get here, and someone swept the road behind me. Is that part of it?','Morrow: (She goes very still.) ...Say that again, later, when I have an answer worth hearing.',
     '(A flash. Something in you answers her, and the third slot on your bar wakes: your Power skill.) Morrow: Hit the stump by the door. Not gently. The grey one.']},
          {act:'burst',after:true,text:'Use your Power skill on the grey stump by Morrow\'s door (R or 3)'}],
   done:['(The stump crumbles, and moss grows over the ground where it stood.)','Morrow: Hm. Good. Now you can see what you\'re up against.','Morrow: Torgeir, mark what I said about the Circle. The Warden. The grey comes from there. Somebody will have to deal with it.','Torgeir: (nodding) Somebody will.']},
  {id:'W9c',title:'Where the drops fell',gate:8,from:null,to:'wren',r:0.7,
   at:{tansy:['@bedside']},
   parts:[{talk:'wren',fx:'green',text:'Take the cure home to Wren',say:[
     '(A drop of the cure falls from the flask as you run. Where it lands on grey grass, green spreads in a ring and holds. Another drop. Another ring. A line of green marks the road home.)',
     'You: ...Did you see that?','Torgeir: I saw. That draught pushes the grey back. Not only in people. In the ground.',
     '(At the bed Wren stirs. The grey lines are paler. Their eyes open, barely, and a hand reaches for yours.)','Wren: ...You came back.','Wren: Tansy... you\'ve got hay in your hair again.','Tansy: (laughing and crying) Days of hay and worry, love, and you wake up to tell me about my hair.','Wren: Did you get the crown?',
     '(The Sheaf-Crown still lies on the pillow. Wren touches the straw, and smiles, tired.) Wren: Take it with you when you go. Bring it back, and I\'ll play when I\'m better.',
     'Dunstan: I heard about the road. The green, the rings of it. It\'s the draught. It pushes the grey back. If we could take it to the source...',
     '(Heads turn in the lane. Morrow has not walked through this gate in twenty years, and nobody says a word.)','Morrow: (arriving behind you) The source is the Circle. The Warden. It needs to be stopped, or freed. Probably both.','Tansy: Then we do it. All of us.','Dunstan: Not yet. We\'ll need to be stronger.','Morrow: I\'ll explain tomorrow.']}],
   done:[]},
  {id:'W9d',title:'Thornlings',gate:8,hard:10,from:'morrow',to:'tansy',r:0.7,
   at:{tansy:['farm']},
   tip:'Tab switches target. Clear the small ones first: a crowd is only dangerous if you let it gather.',
   offer:['Morrow: I couldn\'t sleep. I kept seeing those rings on the road.','Morrow: The Warden isn\'t a monster. It\'s a keeper. The Heartwood feeds every root in this forest, and the Warden guards the Heartwood. For longer than the village has stood, it has held the cold that comes up through the Circle. It takes the cold into itself, so the roots never have to.','Torgeir: The grey.','Morrow: The grey is what the cold does to living things once the Warden can no longer hold it. The Warden looks dark because it has swallowed that cold for longer than the village has stood. And it\'s full.','(In the distance, a low sound like a very long breath. A pulse of grey runs along the ground.)','Dunstan: What was that?',
          'Morrow: The cold pushing up through its roots. I\'ve climbed to the Hem, the ridge above the Circle, to watch it breathe for most of twenty years. When it\'s hurt, it throws up spikes of root and slams the ground.','Dunstan: The Rootwarden? It never harmed anyone.','Morrow: It\'s not harming anyone now. It\'s overflowing. So you must learn to fight what it throws: thornlings, spikes, the beat, the totems.','Tansy: Thornlings first, then. They\'re little thorny saplings that wake when the dark\'s about. In my fields, they\'re weeds. Same advice: pull the small ones before they seed.'],
   parts:[{grey:'thornlet',n:6,spawn:'tansyfield',text:"Clear the thornlings that sprout in Tansy's field"}],
   done:['(After two rounds, her humming stops. She is looking at the south corner of the field. The barley there is grey.)','Tansy: ...Don\'t look at that. It\'s nothing. Rot. ...It\'s been coming for weeks. I buried it. I didn\'t want anyone to worry.','Tansy: I wanted to burn it. All of it. Cut a firebreak and burn the lot.','Morrow: You\'ll do nothing of the kind. Fire kills the fine roots. And the fine roots are what holds the cold down.','Tansy: ...Then what do I do?','Morrow: You plant. And you wait. And you let the grey come to you and find barley.']},
  {id:'W10',title:'Sharper',gate:9,from:'aldric',to:'aldric',r:0.5,
   tip:'In the skills panel (K), a skill you own can be upgraded at a trainer with coins and monster drops.',
   offer:['Aldric: Ah, {name}. Your knack wants sharpening, if it\'s to do more than tickle a sprout.','Aldric: Every kill leaves something behind. Goo, shells, tusks. Feed it to a knack and the knack grows. Open the skills panel and look for Upgrade.'],
   parts:[{act:'upskill',text:'Upgrade a skill at Aldric (coins and monster drops)'}],
   done:['Aldric: There. Feel the weight in it now?','Aldric: Funny thing: my teacher never could say where knacks come from. My grandfather said they come up through the roots, the way water does. He said the Heartwood gives them. That\'s why a child born here finds one early.','Aldric: And that\'s why the Warden matters, I suppose. If the roots fail, the knacks go with them.']},
  {id:'W12',title:'Root spikes',gate:10,hard:11,from:'torgeir0',to:'torgeir0',r:0.5,
   at:{torgeir0:['wallows']},
   tip:'A boss shows a red circle on the ground where a big hit will land: step out of it (Shift to dash). Dire boars do not warn you, but they charge in a straight line: sidestep.',
   offer:['Torgeir: The Warden throws spikes of root up under your feet. You\'ll see a circle on the ground first. That\'s the warning.','Torgeir: Every big hit shows its circle first. The circle is a promise: leave it, and the promise is broken.','Torgeir: The dire boars of the Wallows charge in straight lines: learn to sidestep and the circles will be easy. Shift to dash.'],
   parts:[{kill:'direboar',n:3,text:'Defeat dire boars in the Dire Wallows (they charge: sidestep, Shift to dash)'}],
   done:['Torgeir: Good, {lad}. Shift. Again. ...Good.','Torgeir: I never learned to dodge. I learned to hold. I had twelve men in the company, in the north, and I told them to hold. We held until there was nothing to hold.','Torgeir: It was grey. Same as Wren\'s. It came out of the ground in the night, and in the morning it was in the men.','Torgeir: ...I\'m telling you because you ought to know why I\'m still here. I\'m not brave. I\'m trying to earn a second chance.']},
  {id:'W11',title:'Steel that sings',gate:10,from:'greta',to:'greta',r:0.45,gift:'three',
   tip:'Three identical items (not worn) become one of the next rarity at the forge: common, rare, epic, unique, legendary.',
   offer:['Greta: Three of the same, one hammer, one better. Only matching. Don\'t waste your breath arguing.','Greta: Here: three of the same, fresh off my bench. Put them in, and out comes one better.'],
   parts:[{act:'merge',text:"Merge three identical items at Greta's forge"}],
   done:['Greta: Hear it sing? Folded steel always sings. The old smiths didn\'t use a hammer for it. Or if they did, they never wrote it down. The Silent Years took more than the songs.','Torgeir: What years?','Greta: The ones nobody can count. My grandmother said there\'s a gap in the village ledger, sixty pages cut clean out. Mice, she said. Neat mice.']},
  {id:'W11b',title:'Under the Ridge',gate:11,from:'tomas',to:'tomas',r:0.45,
   tip:'Crafting: weapons are made from ore at the weaponsmith\'s (the Craft tab), armour from logs at the armourer\'s. Ore of each grade lies in the zones of its gear tier: copper in the inner woods, iron further out. A tool of too low a tier cannot work a node.',
   offer:['Tomas: Copper first. Gather beside the vein. Elbows in. Hollen at the Lodge teaches mining and sells the pickaxe.','Tomas: Bring me the ore and I will show you how the hammer takes it. Copper from the inner woods will do for a first blade.'],
   parts:[{act:'learn',prof:'mining',text:"Learn Mining at the Wayfarers' Lodge (Hollen)"},{act:'tool',tool:'pick',text:'Buy a pickaxe and wear it (inventory)'},{gather:'mining',n:10,text:'Mine 10 ore (copper in the inner woods)'},{visit:'ridge',after:true,text:'Look into the mine at Ironshell Ridge',say:['(Behind a seam of ore, a floor of stone slabs, so close-fitted a knife would not go between.)','(Tansy catches up with you at the ridge, hay still on her sleeves.)','Tansy: Who laid a floor in a mine?','Tomas\'s voice, remembered: "Nobody lays floors in mines. ...Nobody now."']},{act:'craft',kind:'weapon',after:true,text:"Craft a weapon at Tomas's (the Craft tab)"}],
   done:['Tomas: Good edge. Rough as a badger, and it will cut. Now you know what my prices pay for.','Tomas: The same paving\'s under the Drowned Road, Oskar says. Under the bridge. Under the well, maybe. Whoever built that floor could have done better, mind. But we haven\'t the faintest idea how.']},
  {id:'W13',title:'The beat',gate:11,hard:12,from:'dunstan',to:'dunstan',r:0.45,
   at:{dunstan:['rotwood']},
   tip:'A boss hits on a rhythm: spikes every few breaths, then a great slam. Watch the ground and move out of the ring.',
   offer:['Dunstan: Here\'s what I noticed. The Warden\'s blows don\'t come at random. Spikes every few breaths, then a great slam. Like a heartbeat, with a hard beat at the end.','Dunstan: Come and listen, at the edge of Rotwood.','Tansy: (arriving, out of breath) I ran from the bedside. Linnea says Wren slept through the night and is no worse. I wanted you to hear it from me, before the drum starts.'],
   parts:[{visit:'rotwood',text:'Listen to the beat at the edge of Rotwood',say:['(A deep drumbeat. In the ground, circles appear in time with it. The big ring comes last.)','Dunstan: Count with me. One, two, three, step. One, two, three, step. And when the big ring comes, get out of it.']}],
   done:['Dunstan: ...You know, I never knew who made this beat. I\'ve drummed it since I was a boy. My master only said it was older than he was.','(A faint hum in the trees answers it, on the same beat.)','Tansy: That\'s the Warden.','Dunstan: ...It\'s the Warden. It\'s been humming my march. Or I\'ve been drumming its song.']},
  {id:'W14',title:'Not alone',gate:12,hard:14,from:'tansy',to:'torgeir0',r:0.5,
   tip:'One Goblin Chieftain is stirred up for you at its Hold, so the fight can be won alone: potions ready (Z), dash its charge (Shift), and rest at the village if it goes badly. Harder places go faster together: everyone who hits a monster shares its reward. P opens the party panel, or type /invite name; the chat (Enter) is how you find company.',
   offer:['(Villagers tie ribbons to posts along the Ribbon Row, one by one. One post stays bare.)','Tansy: The elders say: when the Warden was last angry, the village tied its ribbons around the Circle. The roots knew them, and settled. I think we should do that again.','Dunstan: I\'d like to see someone try it with the dark coming up through the floor.','Torgeir: They can stand at the edge. I\'ll stand in front. Open the party panel and invite whoever you like: the north is easier together.'],
   parts:[{visit:'ribbonrow',text:'Walk the Ribbon Row',say:['(Nine posts, thick with ribbons faded to yellow, red and green, one for every generation of the village\'s children. The tenth post is bare and white, with a hook for one more.)']},
          {kill:'chieftain',n:1,spawn:'hold',text:"Defeat the Goblin Chieftain, in Chieftain's Hold (level 14, alone or with friends)"}],
   done:['(In the Chieftain\'s hoard, among bones and bright stones, lies one yellow ribbon, old and soft with handling.)','Torgeir: (turning the ribbon over) Where did a goblin get a ribbon?','Tansy: ...I don\'t know. Don\'t touch it.','(Nobody explains it. The ribbon goes into your bag.)','You: Whose ribbon was it, before it was a goblin\'s?','Dunstan: That\'s the question. Isn\'t it.']},
  {id:'W15',title:'The big moment',gate:13,from:'morrow',to:'morrow',r:0.5,
   tip:'X is might (more damage). C is guard (less damage taken). Save your Power skill for the stagger. The Rootwarden is level 15: explore, take board notices and hunt until you are ready. Nothing here will run away.',
   offer:['Morrow: The Warden fights with the cold, so you\'ll feel it in your bones. Don\'t waste your best move on the first thing you see.','Morrow: When it hides behind the totems and you break them, it staggers. That is your window. Burst it then, not before.'],
   parts:[{visit:'grave',text:'Walk with Morrow to the grave in Deathcap Dell',say:['Morrow: There\'s a grave here. A boy. A boy of this village, the winter I left. Hollen told you the half of it. The village called it a wasting fever. It was the grey, a small early taste of it, and I was the only one who knew its face. I held it back for a day. It wasn\'t enough.','Morrow: I swore I\'d never help again. I broke that once, up north, for a fisherman\'s boy, when I went looking for a cure of my own. It didn\'t save him either, and I came home and stopped looking. Then a stranger knocked twice.','(You leave a sprig of silverleaf on the grave.)']}],
   done:['Morrow: ...There. Good.']},
  {id:'W16',title:'The song',gate:13,from:null,to:'pip',r:0.5,
   tip:'Passive skills work all the time. Slots open at levels 13, 16 and 20. Aldric and the other trainers teach them.',
   parts:[{talk:'pip',text:'Listen to Pip in the hollow by the Ancient Grove',say:[
     'Pip: It\'s going to throw one up. There. Behind the oak.','(Two seconds later, a spike of root bursts up behind the oak.)','Pip: I hear it. In the roots. It\'s tired. I think it wants to stop.','Pip: Where I stand the spikes never come. I don\'t know why.',
     'Aldric: (arriving with a basket) A passive is the quietest knack. It doesn\'t ask. It helps. Come and find me after, and I\'ll show you how it\'s set.',
     'Pip: ...Will you hurt it?','You: I\'ll try not to.','Pip: It doesn\'t know it\'s hurting people. It just doesn\'t want to die.','(Pip pulls a grass ribbon from his pocket and presses it into your hand.) Pip: For Wren. It\'s green. It stays green.']}],
   done:[]},
  {id:'W16a',title:'Three totems',gate:14,from:null,to:'pell',r:0.5,
   at:{pell:['stump']},
   tip:'Stand off and pick targets with Tab: the totems are broken one by one.',
   parts:[{visit:'stump',text:'Meet Pell at the Whisper Stump in the Bog',say:['Pell: When it\'s hurt enough it hides. Three totems in a ring. Break them and it\'s stunned. That\'s your window.','Pell: Don\'t run in. Stand off. Take one, then the next. Look at me. I never get within arm\'s length of anything.','Pell: Listen.','(The Whisper Stump hums. Low. Familiar.)','Pell: That\'s the same note. I noticed it last month. The stump, the Warden, the casks that boat leaves on the water at night. They hum alike.','You: What boat?','Pell: A boat with no lights. It drops black casks below the stump after dark. Somebody ought to know it\'s there, even if nobody believes me.']}],
   done:['Pell: Those casks have a sun in a ring cut in the lid. Same mark as the totems. Nobody believes me.']},
  {id:'W16b',title:'Ready',gate:14,hard:15,from:null,to:'morrow',r:0.6,
   tip:'A boss needs preparation: your best gear, upgraded skills, potions, and friends if you have them. Check before you go.',
   parts:[{visit:'hem',text:'Join the dress rehearsal at the practice grove on the Hem',say:['(Linnea arrives with a basket of draughts. Morrow sees her. A long silence.)','Linnea: You taught me the willow. I stayed when you left, and I have been sorry for twenty years.','Linnea: I am asking you to forgive me.','Morrow: ...There is nothing to forgive. You were a girl, and I was proud. Give me the basket.','(Morrow takes the basket. A small nod. It is enough.)','Morrow: A smaller Warden, built of the same pieces. Thornlings, spikes, the slam, the totems. All of it, once.','Dunstan: Count the fourth bar! Torgeir: Out of the circles! Tansy: Pull the small ones first! Pell: Stand off the totems!','Morrow: Now. Thornlings first, small ones before they seed.']},
          {grey:'thornlet',n:4,spawn:'hem',after:true,text:'Fight the thornlings that sprout around the practice grove'},{level:15,text:'Reach level 15 (the board and the woods will do it)'},{tier:2,text:'Carry a weapon of level 10 or better'}],
   done:['Morrow: Hold still. Drink. ...There. That is the holding draught, not the cure. It will keep the cold off your skin where we\'re going.','Tansy: Wren\'s gone cold again. The grey is creeping back up their arms. Linnea says the draught is wearing thin.','(Later, at Wren\'s bed, you tie Pip\'s grass ribbon round Wren\'s wrist. It stays green.)','Dunstan: To the Circle, then.','Torgeir: To the Circle.','Pip: (quietly) I\'ll come as far as the Hem.']},
  {id:'W17',title:'The Rootwarden',gate:15,hard:16,from:null,to:'bram',r:0.9,
   tip:'A boss shows where its big attacks will land: step out of the marked ground. Break its shield by destroying the totems. If you fall it heals to full and you wake at the village: come back with your best gear, potions and friends. Everyone who helps shares the reward, and it may drop a skill.',
   parts:[{visit:'circle',text:'Walk to the Stone Circle, north along the Circle Path past the Treant Grove',say:['(Behind you the village calls its goodbyes.)','Maren: Go on, love.','Greta: I\'ll mend what breaks. Bring it back.','(Old Bram, the woodsman who keeps the north path, walks with you to the Circle\'s edge.)','Bram: I walked this wood a thousand times. I\'ve never been afraid. Today I am. ...Go.','(The Stone Circle. The air is heavy, the leaves turning gold and green in turn. The Warden stands in the centre, enormous, half bark, half grey.)','Dunstan: There it is. Torgeir: It\'s bigger than I thought. Tansy: It\'s tired. Look at its arms.','(Morrow pours a thin line of green cure around the Circle\'s rim. Tansy ties a strand of red barley-twine to a stone, and one by one the others follow: Dunstan\'s strip of drum-cord, Torgeir\'s bootlace, a thread from Bram\'s coat. It is not much. It is a village behind you. Pip stands at the Hem\'s edge, hands over his ears, then lowers them.)','Pip: It\'s singing. It\'s the same song. It wants us to stop it.','Morrow: Then we\'ll stop it kindly.','(Oskar, the old rhymer, sits on a fallen stone at the Circle\'s edge.)','Oskar: "Down went the crown, up came the sea, one seed fell where the roots could be." The roots will know them. Whatever happens in there.']},
          {boss:'boss',after:true,fx:'green',text:'Defeat the Rootwarden at the Stone Circle'}],
   bossLine:'The Rootwarden, as it falls: "The roots... cannot hold... for long." The grey drains out of the Grove like water from a bowl.',
   done:['@cine The cost of the Warden',
          '(The Warden does not fall like a tree. It folds. Bark and grey slough off its arms like a coat taken off after a long walk, and the great head lowers, and the Circle goes quiet.)',
          'Bram: Is it over, {lad}? Is the guardian down?',
          '(Then the grey leaves it. It rises off the bark in a slow tide and runs along the ground, away from the stones, toward the nearest living thing. Toward Pip, at the Hem\'s edge. He does not move. He is looking at the Warden, and he is smiling.)',
          'Morrow: No.',
          '(She is across the Circle before anyone can speak. She puts herself between the tide and the boy, and the grey goes into her like water into dry ground. It climbs her wrists, her throat. Her ash staff falls.)',
          'Torgeir: Morrow! (He catches her before she reaches the stones. Her eyes are open. Her hands are grey to the elbow.)',
          'Tansy: Do something! Somebody do something!',
          '@pick Morrow. Look at me. Stay here. >> Torgeir: Stay with us, Morrow. | Pip! The song! Sing it! >> Pip: (already kneeling) I am. I am. | Hold on. Hold on, I\'ve got you. >> Tansy: She can hear you. She can hear you.',
          'Morrow: (a thread of a whisper) Twenty years I kept it out of other people. It\'s only fair it gets one of me.',
          '(Pip kneels in the grey beside her. He does not cry. He hums, and it is the four falling notes, the song nobody has ever finished. At the end of them he sings one more, high and clear, a fifth, and the Circle answers. Every stone rings once.)',
          '(The grey stops, a hand\'s width below her chin. Then, very slowly, it ebbs: down the throat, the wrists, the fingers, until her hands are only hands. Her hair, iron-grey this morning, has gone white.)',
          'Dunstan: ...That\'s the end of it. That was the end of the song.',
          'Pip: (hoarse) It was only ever missing one note.',
          'Morrow: (opening her eyes) Is everyone staring? Rude. I\'m perfectly well. Mostly.',
          'Bram: ...Listen. The river is humming. With the Warden down, the old tunnel gate has opened.',
          'Bram: Go and see Wren before you leave.']},
  {id:'W18',title:'Goodbye for now',gate:15,from:null,to:'daisuke',r:0.4,
   tip:'The East Road leads to the old tunnel and over the Greyfall bridge to the Sakura Vale. Walking to Hanami attunes the teleport circles.',
   parts:[{talk:'linnea',text:"See Linnea at Wren's bed",say:['(Wren sleeps, a green ribbon on their wrist. Their hand is warm.)','(After a quiet minute, three grey ripples rise from far horizons: east, west and north-west. The east one is the strongest.)','Dunstan: ...Do you see that? Torgeir: It isn\'t gone. It\'s moved. Tansy: Moved where?','Morrow: (arriving, breathless) Everywhere else. It was already seeping out a little, up the northern coast, into the high hills. The Warden was the cork. With the cork gone it runs to every place that has no roots to hold it.','You: We stopped it here, and sent it everywhere else.','Morrow: Yes. I would rather you heard that from me than guessed it.','(Far south-east, at the end of the East Road, the old tunnel, sealed for a generation, is open.)','Linnea: It\'s not a cure. But the roots are quiet now. Wren is resting. The worst is over, for now.','Morrow: The worst here. Not the worst.','Morrow: And whoever drops black casks in the bog is no friend of the roots. Pell has seen their mark. Remember it.','Morrow: And ask Kaede about what I felt in you, at my hut. I won\'t guess it aloud. It is hers to read.','Linnea: There\'s a shrine-keeper in Hanami, across the tunnel. Kaede. Her mother taught mine a lullaby about a grey sleep, a long time ago. I never knew what it meant.','Linnea: Take this charm of Wren\'s hair and heartleaf. It will keep the way open.','Morrow: What I brewed is a holding draught. It buys Wren weeks, not a life. A real cure is somewhere out there, and I\'m too old to cross mountains. And someone must stay with your sibling.']},
          {talk:'tansy',text:'Say goodbye to Tansy',say:['Tansy: I\'m staying with Wren. Someone has to. And I have a field to replant.','Tansy: Come back soon. Bring a cure, bring a story, bring bread, I don\'t care. (She hands you the Sheaf-Crown.) Hold this. Wren wants it back when they wake.','Pip: I want to come. Morrow: You can\'t. Your place is here. Pip: I know. But I made this. (He gives you another grass ribbon, green and alive. You tie it to your wrist.) Pip: It won\'t let it touch you. Not much.']},
          {talk:'dunstan',text:'See Dunstan and Torgeir off',say:['Dunstan: We\'ll go north. There\'s something up there. I\'ve drummed a march since I was a boy, and I think I know where it came from.','Torgeir: And I have men to bury. Properly this time.','(Dunstan lifts his drum and plays four beats. Torgeir raises a hand. The two walk away along the old road north.)']},
          {act:'hanami',after:true,text:'Follow the East Road through the old tunnel and over the Greyfall bridge to Hanami'}],
   done:['(The sealed tunnel, now open: old paving stones, fitted close, a carved ring-and-sun on the keystone. At the far end, light and pink petals.)','Daisuke: Halt. Name and business, {sir}. ...You look like you\'ve walked through a storm.','Daisuke: The grey sleep? Here? ...Two of my guard fell to it this season. We thought it was a fever.','Daisuke: The shrine-keeper, Kaede, is at the stone garden. She\'ll see you. She\'s been waiting. She said someone would come.']},
  /* ---------------- Act II: The Blossom and the Blight (the Sakura Vale, levels 15-20; it ends at Akaoni) ---------------- */
  {id:'V3',title:'Hanami',gate:15,from:'daisuke',to:'daisuke',r:0.05,
   tip:'Hanami has the same jobs as your village: a quest board, stalls, a forge, a trainer.',
   offer:['Meet the people who keep this place running. They will keep you running too.'],
   parts:[{talk:'sayuri',text:'Meet Sayuri at the quest board',say:['Welcome! The board works the same as yours at home, but our yokai bite harder.']},
          {talk:'kenji',text:'Meet Kenji, the weaponsmith',say:['A blade from beyond the mountains? Good steel. Mine is better.']},
          {talk:'haruka',text:'Meet Haruka, the armorer',say:['Lacquer and silk. Light, and it turns an oni club.']},
          {talk:'tetsuo',text:'Meet Tetsuo at the forge',say:['Greta taught me the three-into-one. Or I taught her. We argue about it.']}],
   done:['Now you know everyone worth knowing. Except Grandmother Chiyo at the fire. She will want to see you: she wants to see everyone.']},
  {id:'V4',title:'Home in a blink',gate:15,from:'chiyo',to:'wren',r:0.25,
   tip:'Step onto a teleport circle: a window lets you choose where to travel (the talk key opens it again).',
   offer:['From beyond the mountains, and still on your feet! Sit, sit.','The circle of stones by the road hums for anyone who has walked here on their own feet. Step on it and it carries you home, and back again.','Go and tell your sibling you have found the stone garden. Then come back.'],
   parts:[{act:'warp',text:'Travel home on the teleport circle'}],
   done:['(Wren stirs as you sit down beside the bed.) Cherry trees that bloom all year? ...You are making it up.','(They fall asleep smiling.)']},
  {id:'V5',title:'The stone garden',gate:16,from:'kaede',to:'kaede',r:0.25,
   tip:'Skills carry elements, and so do monsters: a skill that beats a monster\'s element hits it 1.5 times harder (the Guide has the wheel). Master Ryu teaches skills.',
   offer:['You have come about the sleeping sickness. Chiyo told me.','Before the old scrolls, you should know who teaches here. Master Ryu trains hikers in the skills of this side of the mountains. Go and meet him, then come back.'],
   parts:[{talk:'ryu',text:'Meet Master Ryu, the trainer',say:['Kaede sent you? Then you are in more trouble than you look. Skills, passives, upgrades: I teach them all.','The old way: fire, water, air and earth beat each other round and round, and dark and light beat each other. Hit a monster with what it fears.']}],
   done:['...','Ryu is a hard teacher and a fair one. If he thinks you will do, you will do.','Now. The sleeping sickness, and what the old scrolls say of it.']},
  {id:'V6',title:'A light for Wren',gate:17,from:'kaede',to:'wren',r:0.2,
   tip:'Monsters have elements (the target frame shows it). Water beats fire, fire beats air, air beats earth, earth beats water; dark and light beat each other.',
   offer:['The grey sleep feeds on the dark. Light holds it back, a little. Not lamplight: living light.','The kodama of Kodama Wood carry it in little lanterns. Bring me six.','The kodama are light: a dark skill hurts them most.'],
   parts:[{collect:'Kodama lantern',from:['kodama'],n:6,chance:0.5,text:'Take kodama lanterns in Kodama Wood'},
          {talk:'kaede',after:true,text:'Bring the lanterns to Kaede',say:['Six little lights. The kodama carry the forest\'s own glow.','I fold it into a talisman, with a thread of your soul. Take it to Wren and keep it near.']}],
   done:['(The talisman glows on the blanket. Wren wakes, and stays awake long enough to talk.)','It is warm. It feels like you.','(They sleep again, but they breathe more easily.)']},
  {id:'V7',title:'The friendly foxes',gate:18,from:'chiyo',to:'chiyo',r:0.2,
   tip:'Passive skills unlock at level 13 (more slots at 16 and 20) and work all the time. Master Ryu and Aldric teach more of them.',
   offer:['When I was a girl the kitsune were our friends. They brought lost children home.','Now some of them have gone grey, like your sibling\'s arms, and they bite. Five of them, up in the Fox Hills.','See Master Ryu first. You are old enough now for what he teaches.'],
   parts:[{talk:'ryu',text:'Ask Master Ryu about passive skills',say:['Past level 13? Then your body has learned something your hands have not. Passives: they work without you thinking of them.','Vitality is already in your first slot. I teach others. Now go: the foxes will not wait.']},
          {grey:'greyfox',n:5,zone:18,text:'Drive off the grey kitsune in the Fox Hills'}],
   done:['Grey foxes. In my day... well. In my day a great many things were different.','Then one of them grew nine tails. But that is a story for another night.']},
  {id:'V7b',title:'Lacquer and cherrywood',gate:18,from:'haruka',to:'haruka',r:0.4,
   tip:'Armour is made from logs (woodcutting: an axe). The vale\'s trees need an axe of tier 4 (Sunstone, level 15) or better. Craft at the armourer\'s: the Craft tab.',
   offer:['Silk and lacquer over a frame of good wood: that is samurai armour. The wood is the part nobody thinks about.','Isamu at the Lodge teaches the axe. Bring me a dozen logs from the vale and I will let you make a piece yourself.'],
   parts:[{act:'learn',prof:'woodcutting',text:'Learn Woodcutting at the Wayfarers\' Lodge (Isamu)'},{act:'tool',tool:'axe',tier:3,text:'Buy an axe of level 15 or better (Sunstone) and wear it'},{gather:'woodcutting',n:12,text:'Chop 12 logs in the Sakura Vale'},{act:'craft',kind:'armor',after:true,text:'Craft an armour piece at Haruka\'s (the Craft tab)'}],
   done:['Not bad. The lacquer will forgive the corners.','Rare and epic pieces take more logs, the way they take more of everything.']},
  {id:'V8',title:'A lantern with no flame',gate:19,from:'odran2',to:'odran2',r:0.2,
   offer:['You again! Small world, is it not? Smaller than people think.','I came over the bridge the day after you opened it. Business, you understand. Sell me something?'],
   parts:[{act:'sell',n:1,at:'cart',text:'Sell Odran something at his cart by Hanami\'s gate'}],
   done:['Pleasure, as always. Oh, this? Just a lantern. See: no flame, and still it glows. Clever, is it not?','...No, it is not for sale. Forget you saw it. (He wraps it in cloth, quickly.)']},
  {id:'V9',title:'The old scrolls',gate:19,from:'kaede',to:'kaede',r:0.2,
   tip:'Kenji and Haruka sell stronger gear from level 20.',
   offer:['The hall\'s oldest scrolls were stolen by the marsh spirits long ago, and they are the only ones that speak of the grey sleep.','The onibi and the spider-women of the Ghostlight Marsh carry the pieces. Bring me four.'],
   parts:[{collect:'Scroll piece',from:['onibi','jorogumo'],n:4,chance:0.45,text:'Recover scroll pieces in the Ghostlight Marsh'}],
   done:['"The grey sleep comes from the sea. It came before, when the sky went quiet, and it will come again."','The sea... A fisher on the east shore fell grey this morning. The first in Hanami.','The rest is written on the Demon Gate\'s own stone, and Akaoni guards it.']},
  {id:'V10',title:'The Demon Gate',gate:20,from:'daisuke',to:'kaede',r:0.2,
   tip:'Boss skills drop at 10% each, for everyone who helped.',
   offer:['Kaede told me. You want to go to the Demon Gate. Of course you do.','Akaoni guards it, and nobody guards us from Akaoni. Take friends, and the best steel Kenji has.','The gate is older than Hanami, cut from a stone nobody can cut. If there are words on it, they are older than any of us.'],
   parts:[{boss:'akaoni',text:'Defeat Akaoni at the Demon Gate'},{read:'demongate',after:true,text:'Read the Demon Gate\'s stone'}],
   bossLine:'Akaoni, as it falls: "They made you forget... They are still watching... Ask the ice what fell from the sky." Far to the north, something cracks like thunder.',
   done:['"They made you forget." A demon said that? To you?','And the stone: "Where the ice meets the sky the frost flower grows, and the sleepers wake." The frost flower. The Frostbloom.']},
  {id:'V11',title:'Frostbloom',gate:20,from:'kaede',to:'wren',r:0.12,
   offer:['The Frostbloom grows only under the glaciers of the Hoarfrost Reach, north past the ice wall. It halts the grey sleep: the scroll is certain of that.','The wall cracked when Akaoni fell. The road north will open. Tell Chiyo, then go home and tell Wren.'],
   parts:[{talk:'chiyo',text:'Tell Grandmother Chiyo what the demon said',say:['"They made you forget"... When I was small, my grandmother spoke of a year nobody could remember. The year the sky went quiet.','Go home first, child. Your sibling should hear this from you.']}],
   done:['(Wren is awake. The talisman glows beside them.)','A flower under the ice? Of course it is under the ice. Nothing is ever easy with you.','...Go. I will still be here. I am not going anywhere, am I?']},
  /* ---------------- Act III: The Frost Flower (the Hoarfrost Reach, levels 20-25; it ends at Ymrik the Rimeking) ---------------- */
  {id:'F1',title:'Beyond the wall',gate:20,from:null,to:'hallvard',r:0.08,
   tip:'Frostgate Pass climbs north from the end of the North Road. Up there rain falls as snow. Walking into Rimehold attunes its teleport circle: the circles now link all three villages.',
   parts:[{act:'rimehold',text:'Walk up Frostgate Pass to Rimehold'}],
   done:['You came up the pass? The wall cracked three nights ago. We heard it in Rimehold, like the ice on Frostmere breaking, and Old Sigrun said: "Someone is coming."','I am Hallvard. I keep the gate and count who comes through it. You are the first from the south in longer than I have been alive.','Go and warm yourself at the fire. Then see Old Sigrun. She has been waiting for you, and she will not say why.']},
  {id:'F2',title:'The hearth-folk',gate:21,from:'hallvard',to:'hallvard',r:0.06,
   tip:'Rimehold has the same jobs as your other villages: a quest board, stalls, a forge, a trainer. It also has the Wayfarers\' Lodge.',
   offer:['Rimehold is a small place and everyone in it has work. Learn who does what: you will need them.'],
   parts:[{talk:'ragna',text:'Meet Ragna at the quest board',say:['The board works the way it does everywhere. Wolves, wraiths, and men who ought to know better. Take what suits you.']},
          {talk:'bjorn',text:'Meet Bjorn, the weaponsmith',say:['Axes, spears and the long knife. Forged in the cold, so it does not go brittle in it.']},
          {talk:'ulfhild',text:'Meet Ulfhild at the forge',say:['Three the same, and the coals make one better. The cold makes it ring.']},
          {talk:'thorvald',text:'Meet Thorvald, the skill trainer',say:['The old wolf teaches what the old wolf knows. Come at me with your hands and I will find the gaps.']}],
   done:['Now you know the hearth-folk. Everyone else is called Ulf or Ylva. It saves time.']},
  {id:'F3',title:'The winter after the burning sky',gate:21,from:'sigrun',to:'sigrun',r:0.12,
   tip:'The north\'s nights are long, and some things only happen after dark. Rune stones like the one at Rimehold\'s gate can be read: walk up and press the talk key.',
   offer:['So the demon spoke to you, and the stone gave you a flower\'s name. Yes. I know the words. My grandmother sang them.','Come and sit when the fire is the only light. I will tell you what the Reach remembers. It is not much, and it is enough.'],
   parts:[{talk:'sigrun',night:true,text:'Sit with Old Sigrun after dark',wait:['Not yet. The sagas want the dark, and the north gives plenty of it. Come back when the fire is the only light.'],
           say:['There was a winter that came after the burning sky. That is how the saga begins, and nobody has ever told me what it burned.','The sky opened, and something fell out of it, and where it fell the ice grew back over a whole summer in one night. The old hunters called it the dragon, and never went near.','The Frostbloom grows in the caves under the glacier, where the ice is thin over the warm springs. It is blue as a vein. It opens in the dark and closes in the light. The old healers used it for the grey sleep, before they forgot how.','The rune stones at the gate say the same, if you can read them. I cannot. I only remember the singing.']},
          {read:'runes',after:true,text:'Read the rune stones at Rimehold\'s gate'}],
   done:['The stones say it too? Then I did not dream the song.','Frostbloom, then. But those hands of yours... you have never picked anything that fights back. The Lodge will teach you.']},
  {id:'F4',title:'Skilled hands',gate:22,from:'sigrun',to:'gudrun',r:0.1,
   tip:'The Reach\'s plants and ore need better tools: a node needs a tool of the tier of its zone (the Reach starts at tier 5, Hagane, level 20). Gudrun\'s Lodge sells them.',
   offer:['Frostbloom does not come out of the ground for just anyone. It shuts at a clumsy touch, and at a dull blade. Gudrun at the Wayfarers\' Lodge will teach you to gather it, and sell you a sickle sharp enough.'],
   parts:[{act:'learn',prof:'gathering',text:'Learn Gathering at the Wayfarers\' Lodge (Gudrun), if you have not yet'},{act:'tool',tool:'sickle',tier:4,text:'Wear a Hagane sickle (level 20): Gudrun sells them'}],
   done:['There. You have the hands for it now, and the edge.','The blue veins in the rock are rime ore, and the old pines make good beams: the Lodge teaches mining and woodcutting too. Potions? Ylva has taken up the alchemist\'s chair at last, and she wants frostbloom more than anyone.']},
  {id:'F5',title:'Frostbloom',gate:22,from:'gudrun',to:'sigrun',r:0.18,
   tip:'Plants and ore show up as marks on the map once you know the profession and wear its tool. Monsters roam near them: the bar over a monster shows its level.',
   offer:['Go out to the Rimewood Edge, west of Rimehold, where the ice is thin over the springs. Six sprigs would be a fair morning. Three will do.','The snow boars go mad for the smell. Deal with a few while you are out there.'],
   parts:[{gather:'frostbloom',n:3,text:'Gather frostbloom in the Rimewood Edge'},{kill:'snowboar',n:5,text:'Defeat snow boars in the Rimewood Edge'}],
   done:['Three. Still blue. And you are still in one piece.','Keep them. A flower for the grey sleep has to be brewed by the hand that carries it home, or it wilts on the road. Ylva sits in the alchemist\'s chair now: take them to her kettle.']},
  {id:'F6',title:'A flower for Wren',gate:23,from:'sigrun',to:'wren',r:0.2,
   tip:'Brew at Ylva\'s kettle in Rimehold: three frostbloom make a Greater Healing Potion. Then step onto a teleport circle: a window lets you choose where to go.',
   offer:['Ylva will show you the kettle. Frostbloom in the water turns it to light, and the brew must be made by whoever carries it home.','Then carry it before it wilts. The circle in the middle of Rimehold will take you, if you have stood on it before. One drop at a time, for Wren: it will not wake them, I think. It will keep the grey from going any further.'],
   parts:[{act:'brew',kind:'heal',minTier:2,text:'Brew the frostbloom tea at Ylva\'s: a Greater Healing Potion (3 frostbloom)'},
          {act:'warp',after:true,text:'Travel home on the teleport circle'}],
   done:['(Wren stirs and opens their eyes. For once the grey lines on their arms are only lines.)','...The grey water has a light in it now. Far away. Like a lamp somewhere in the snow.','(They take a sip, make a face, and sleep again, peacefully. The grey has not moved.)']},
  {id:'F7',title:'Iron in the ice',gate:24,from:'hallvard',to:'odran3',r:0.18,
   tip:'Some drops only come from one kind of monster, and not every time: keep hunting until you have enough.',
   offer:['The Frost Reavers have been wearing scraps of grey plate that does not rust and does not dent. They say they took it from the dragon in the ice at Frostmere, but nobody has seen a dragon in three hundred years.','A peddler has set up his cart outside the gate, and he pays good coin for that plate. Bring him two pieces and see what he says.'],
   parts:[{read:'hullplate',text:'Look at the grey plate in the ice at Frostmere Shore'},{collect:'Reaver plate',from:['reaver'],n:2,chance:0.45,text:'Take plates from the Frost Reavers of Frostmere Shore'}],
   done:['Ah! The grey plate. Well done. Thirty coins a piece, and I never ask where it came from, which is why people keep bringing it.','...It was not a dragon, you know. Dragons do not come in sheets, and the edges are cut clean. Someone made this. (He wraps it in cloth, quickly.) Forget I said that. I am a trader, not a scholar.']},
  {id:'F8',title:'The Rimeking',gate:25,from:'hallvard',to:'sigrun',r:0.25,
   tip:'Ymrik\'s pillars shield him: smash them. Boss skills drop at 10% each, for everyone who helped.',
   offer:['The Rimeking has taken the old ice hall at the heart of the Reach. Hunters go in and come out grey, or do not come out. He was here before the village. The old people say he was never an enemy: that he kept the wolves from the doors.','Something has turned him, the same something that turned the foxes in your vale, I suppose. Go and see. Take friends. The hall is north-north-east of the village, past the lake.'],
   parts:[{boss:'ymrik',text:'Defeat Ymrik, the Rimeking, in his ice hall'}],
   bossLine:'Ymrik, as he falls: "The iron bird... still sings under the ice. And someone... sings back. From a far light on the sea." In the west, ice groans and splits.',
   done:['He said that? "Sings back"?','...Sit. Tell it again, slowly, every word. The old sagas have a verse I never understood. I think I begin to.']},
  {id:'F9',title:'Where the earth\'s heat runs black',gate:25,from:'sigrun',to:'hallvard',r:0.1,
   offer:['Listen now, while the giant is quiet. The saga has a second verse that I did not tell you, because it made no sense.'],
   parts:[{talk:'sigrun',text:'Hear Old Sigrun\'s last verse',say:['"The sickness has a root, where the earth\'s heat runs black. Under the mountains men dig for the root, and call it stone."','The mountains are west, past the glacier valley that has just split. The miners of Highmark dig them. If the grey sleep has a root, that is where your road goes.','But you are not ready. The stone there is older, and what guards it is worse. Grow first. There is a great deal of Hoarfrost yet to see, and a wyrm in the north that nobody has beaten.']}],
   done:['The west valley is open? Then the way to Highmark is open. It is a hard road. Come back and tell us of it, if you can.']},
  /* ---------------- Act IV: The Black Stone (the Greyspine, levels 26-32; it ends at the Mountain Golem) ---------------- */
  {id:'G1',title:'The glacier valley',gate:26,from:null,to:'brenna',r:0.08,
   tip:'The glacier valley runs west from the Reach. Walking into Highmark attunes its teleport circle: the circles now link all four villages.',
   parts:[{act:'highmark',text:'Walk the glacier valley west to Highmark'}],
   done:['You came up the valley? Then the ice fall is down, and Konrad was right, and I owe him a drink. He wrote it in the gate book three weeks ago: "the sky tore".','I am Brenna. I keep the mine and the board. Sit by the fire and get your breath: the air is thin up here and the stairs are long.']},
  {id:'G2',title:'The hearth of Highmark',gate:26,from:'brenna',to:'brenna',r:0.06,
   tip:'Highmark has the same jobs as your other villages: a quest board, stalls, a forge, a trainer, and the Wayfarers\' Lodge.',
   offer:['Highmark is a small place built on a big rock, and everyone in it is needed. Walk it, and meet the ones who keep it standing: the abbot at the fire, Gerhard at the forge, Brother Matthias who teaches.'],
   parts:[{talk:'ansgar',text:'Meet Abbot Ansgar at the fire',say:['Sit, sit. The fire is for everyone. The abbey keeps the records of four hundred winters: births, floods, the year the bell cracked.','There is a gap in the oldest book, you know. Eleven years of it, cut out with a fine blade so neatly that the binding did not even loosen. Nobody remembers who read it last.']},
          {talk:'gerhard',text:'Meet Gerhard, the weaponsmith',say:['Steel from the deep seams, tempered in meltwater. Three of a kind and a hot fire and the mountain makes one better: Hilda has the anvil for that.','Odd thing. The new black stone eats my files. Brenna thinks that is funny. I do not.']},
          {talk:'matthias',text:'Meet Brother Matthias, the skill trainer',say:['The abbey teaches what Aldric teaches, only slower and with more bells.','Learn your skills before the peaks. The air up there is thin, and so is the patience of the gryphons.']}],
   done:['Now you know who to shout for. Good.','Sit a moment longer. There is something I want you to see, and I would rather you saw it with your own hands.']},
  {id:'G3',title:'Black stone',gate:27,from:'brenna',to:'brenna',r:0.15,
   tip:'Mining: a vein needs a pickaxe of the best tier (the Lodge sells it). The black veins lie in the Miners\' Scree and the Ledgeway. The stone slimes carry lumps too, if you would rather fight than dig.',
   offer:['The mine has been giving us something new these three months: black stone. Heavy, and cold even in the sun, and it hums if you hold it to your ear. The buyer wants every lump we dig.','Bring me six. Dig them out of the black veins in the Scree, or take what the stone slimes carry in their bellies: they swallow anything. Mind your hands. It is colder than it has any right to be.'],
   parts:[{collect:'Black stone',from:['granitslime','quartzslime'],gather:'blackstone',n:6,chance:0.3,text:'Bring Brenna six lumps of black stone (mine the black veins, or take them from the stone slimes)'}],
   done:['(She turns a lump over in her bare hand, then sets it down rather fast.)','Cold as a well bottom. And listen... there. A hum, like a bee in a jar. The men who dig it say it calls things down the mountain. I thought they were drunk.','Whatever it is, the buyer pays three times the coal price for it. Odran. A pleasant man. I think I shall have a word with him.']},
  {id:'G4',title:'Too perfect',gate:28,from:'brenna',to:'brenna',r:0.12,
   tip:'Odran\'s cart stands outside Highmark\'s gate. Sell him something, anything, and see what he pays you in.',
   offer:['Odran has set up outside the gate: you will know his cart. He pays the miners for the black stone in coin, and the miners have started to give me odd looks about it.','Sell him something. A spare knife, a lump of ore, anything. Then bring me what he pays you with.'],
   parts:[{act:'sell',n:1,at:'cart',text:'Sell Odran something at his cart outside Highmark\'s gate'},
          {talk:'brenna',after:true,text:'Show Brenna the coins Odran paid you',say:['(She tips the coins out onto the scale and weighs them one by one. Her mouth goes thin.)','Look at that. Every one the same: not a hair of difference in the weight, not a nick on the edge, every face pressed to the same depth. The mint in the capital cannot do that. Nothing a hand makes comes out alike.']}],
   done:['Odran? Oh, he is lovely. He asked after my mother by name. I do not recall telling him her name.','...Keep the coins. Spend them somewhere far from here. And stay out of the Scree after dark.']},
  {id:'G5',title:'The grey shift',gate:29,from:'brenna',to:'brenna',r:0.2,
   tip:'Some things only happen after dark. Grey-veined monsters are tougher, and worth more. Hold the Miners\' Scree at night: they come to you.',
   offer:['They come at night now. Down from the high scree, grey as ash, and straight for the shaft head where the black stone is stacked. The night shift will not go in.','Hold the shaft head in the Miners\' Scree after dark. A dozen should break them. A dozen, no more: I counted.'],
   parts:[{grey:'greystone',n:12,zone:'g28',night:true,text:'Hold the shaft head in the Miners\' Scree after dark: defeat 12 grey-veined stone monsters'}],
   done:['Twelve. And not one of them wanted you. They wanted the stack behind you.','The stone calls, and they come, and when they get there they do not even eat it. They just stand around it and hum. I have never seen anything so patient.','Ansgar knows more about humming than I do. And the Queen on the high peak has begun to roost on the black ledges: her eaglets are on every trail now. Somebody has to do something about her.']},
  {id:'G6',title:'The gryphon queen',gate:29,from:'brenna',to:'brenna',r:0.25,
   tip:'A boss shows where its big attacks will land: step out of the marked ground. Boss skills drop at 10% each, for everyone who helped.',
   offer:['She nests on the peak above the cirque, west across the Long Valley. Half of Highmark has lost a goat to her and two families have lost more than that. Her eaglets guard the nest.','There is an old miners\' saying that a rock fall has choked the river road for a hundred years, and that it would slide away on the day the Queen fell. Konrad swears to it. Konrad swears to a great deal.'],
   parts:[{boss:'gryphonqueen',text:'Defeat the Gryphon Queen on her peak'}],
   bossLine:'The Gryphon Queen, as she falls: "It hums... it calls us... we cannot stop." Far to the west, a rock fall slides down into a canyon.',
   done:['The Queen is down? Then the sky over the cirque is empty for the first time since my grandfather\'s day.','Konrad says he heard stone move in the west at dawn. I told him he heard his own knees.']},
  {id:'G7',title:'What the miners dug into',gate:30,from:'brenna',to:'brenna',r:0.1,
   tip:'Lore spots can be read: walk up and press the talk key. This one is in the Miners\' Scree.',
   offer:['The deepest shaft broke through something a month ago. The crew that went down came up grey in the face and will not say what they saw. The shaft is still timbered, but nobody goes in.','Go and look at the mouth of it, in the Scree. Look, I said. Only look.'],
   parts:[{read:'deepshaft',text:'Look at the mouth of the deepest shaft in the Miners\' Scree'}],
   done:['A hole that round, in a place we never dug? Ansgar says the mountain has older rooms than the village. I told him mountains do not have rooms.','Do not go down. I do not need to say it: I can see it in your face.']},
  {id:'G8',title:'The old giant',gate:31,from:'ansgar',to:'ansgar',r:0.12,
   tip:'The Mountain Golem\'s cavern lies in the Sink, in the south-west of the Greyspine. Read what lies on the ground before you fight it.',
   offer:['Sit. Brenna told me about the shaft. I told her what I tell nobody: the abbey\'s oldest picture-book shows a giant of stone walking down this mountain, with a lamp in its chest, and people kneeling to it.','The picture is older than the abbey. Go and look at the golem\'s cavern in the Sink, at the edge of the clearing, where the frost has broken its stone. If it is only stone, I shall be glad.'],
   parts:[{read:'golemframe',text:'Look at the Mountain Golem\'s broken stone at the edge of its cavern (the Sink)'}],
   done:['Metal. Under the stone. Jointed like a man, and studded like a boat.','Then it is not a giant, whatever the villagers say. Somebody made it, a very long time ago, to fight, and the stone grew over it while it slept.','And the ring with a sun in it? The picture-book has that too, on the lamp. I thought it was a decoration.']},
  {id:'G9',title:'The mountain wakes',gate:32,from:'ansgar',to:'brenna',r:0.25,
   tip:'Boss skills drop at 10% each, for everyone who helped. Break its stone, and take care of its stamp.',
   offer:['It walks, then. The black stone hums louder every night, and every night the cavern rumbles under it. Whatever woke the giant will not stop at one mountain.','End it, if you can. The old road behind its cavern climbs to the neck pass in the west, and the pass has been choked with fallen stone since before my grandfather: it may give way, as the river road did.'],
   parts:[{boss:'mountaingolem',text:'Defeat the Mountain Golem in its cavern'}],
   bossLine:'The Mountain Golem, as it falls: "...the lamp... goes out... the others... are still lit." Far to the west, stone crumbles from a pass.',
   done:['(The mountain is quiet. For the first time in months the stone does not hum.)','Gone dumb, hasn\'t it? I put a lump of the black stone on the table this morning and it just lay there, cold and sulking.','Listen. Odran asked me to tell you something before he packed up his cart. Glasswell, in the Sunscar, he said: the physician there cures what nobody else can. Then he winked and sold me a spoon.']}
];
const MQ_BY_ID={}; MQ.forEach((s,i)=>{ s.i=i; MQ_BY_ID[s.id]=s; });
const MQ_END='Act IV is over. The mountain is quiet, the black stone sleeps, and a road leads on: Glasswell, in the Sunscar, where a physician is said to cure what nobody else can. The story goes on there, once it is told.';
// which village each quest villager lives in (the server checks you are there when you talk to them); odran2 is Odran's cart in Hanami, odran3 his cart at Rimehold, odran4 at Highmark
const MQ_NPC_VIL={tansy:1,dunstan:1,wren0:1,torgeir0:1,morrow:1,pip:1,pell:1,tamsin:1,isamu:2,hinata:2,ylva:3,wren:1,linnea:1,odran:1,bram:1,aldric:1,tomas:1,ilse:1,maren:1,greta:1,oskar:1,
  odran2:2,daisuke:2,sayuri:2,kenji:2,haruka:2,tetsuo:2,ryu:2,chiyo:2,kaede:2,
  odran3:3,hallvard:3,ragna:3,bjorn:3,ulfhild:3,thorvald:3,sigrun:3,gudrun:3,
  odran4:4,brenna:4,ansgar:4,gerhard:4,matthias:4};
const MQ_NAMES={tansy:'Tansy',dunstan:'Dunstan',wren0:'Wren',torgeir0:'Torgeir',morrow:'Morrow',pip:'Pip',pell:'Pell',tamsin:'Hollen',isamu:'Isamu',hinata:'Herbalist Hinata',ylva:'Alchemist Ylva',wren:'Wren',linnea:'Healer Linnea',odran:'Odran',odran2:'Odran',bram:'Bram',aldric:'Aldric',tomas:'Tomas',ilse:'Ilse',maren:'Maren',greta:'Greta',oskar:'Oskar',
  daisuke:'Daisuke',sayuri:'Sayuri',kenji:'Kenji',haruka:'Haruka',tetsuo:'Tetsuo',ryu:'Master Ryu',chiyo:'Grandmother Chiyo',kaede:'Shrine-keeper Kaede',
  odran3:'Odran',hallvard:'Hallvard',ragna:'Ragna',bjorn:'Bjorn',ulfhild:'Ulfhild',thorvald:'Thorvald',sigrun:'Old Sigrun',gudrun:'Gudrun',
  odran4:'Odran',brenna:'Foreman Brenna',ansgar:'Abbot Ansgar',gerhard:'Gerhard',matthias:'Brother Matthias'};
const mqNeed=pt=>pt.n||1;
// the level a step is offered from: its act's (the gate of the act's first step), so the level asked rises only between acts. step.gate stays the step's own
// level, which sizes its reward (mqReward) and says where its monsters are
const MQ_ACT_GATE={}; MQ.forEach(s=>{ const a=s.id[0]; if(MQ_ACT_GATE[a]===undefined) MQ_ACT_GATE[a]=s.gate; });
const mqGate=step=>MQ_ACT_GATE[step.id[0]];
// a part can progress: not waiting for the parts before it (after:true)
function mqOpen(step,n,i){ const pt=step.parts[i]; if((n[i]||0)>=mqNeed(pt)) return false; if(!pt.after) return true; for(let k=0;k<i;k++) if((n[k]||0)<mqNeed(step.parts[k])) return false; return true; }
function mqAllDone(step,n){ return step.parts.every((pt,i)=>(n[i]||0)>=mqNeed(pt)); }
function mqReward(step){ return {xp:Math.round(step.r*expToNext(step.gate)), coins:Math.round(step.r*18*coinAvg(step.gate))+10}; }
const mqNight=day=>day>0.53||day<0.005;   // the day clock (0 = 06:00, 0.5 = 18:00): dusk to dawn

// a new character's progress (W1 starts by itself), and a save's, checked
// MQ_VER 2: W6a, W7b, W11b and V7b were inserted after W6 (old index 5), W7 (6), W11 (10) and V7 (22): an older save's step index moves up by the ones before it.
// MQ_VER 3: the prologue P1-P6 came first and Act I was rewritten around the witch (docs/WILDWOOD-STORY.md): a save older than 3 is moved by step id (MQ_V2_IDS is the list as it was at version 2); a step that no longer exists moves it to the next one that does, and its part counts start again.
const MQ_VER=3, MQ_INSERTED=[[5,1,2],[6,1,2],[10,1,2],[22,1,2]];
const MQ_V2_IDS=['W1','W2','W3','W4','W5','W6','W6a','W7','W7b','W8','W9','W10','W11','W11b','W12','W13','W14','W15','W16','W17','W18','V3','V4','V5','V6','V7','V7b','V8','V9','V10','V11','F1','F2','F3','F4','F5','F6','F7','F8','F9','G1','G2','G3','G4','G5','G6','G7','G8','G9'];
const mqV2Index=(s,ver)=>(ver||1)<2?s+MQ_INSERTED.reduce((a,[after,n])=>a+(s>after?n:0),0):s;   // (a version 1 save's index in the version 2 list)
function mqMigrate(s,ver){
  if((ver||1)>=3) return s;
  if(!s) return 0;   // (an old save still at its first step has finished nothing: it starts the story from the prologue, not at W1)
  s=mqV2Index(s,ver);
  if(s>=MQ_V2_IDS.length) return MQ.length;
  for(let k=s;k<MQ_V2_IDS.length;k++){ const st=MQ_BY_ID[MQ_V2_IDS[k]]; if(st) return st.i; }
  return MQ.length;
}
function newMq(){ return {s:0,st:1,n:MQ[0].parts.map(()=>0),h:0,ver:MQ_VER}; }
const mqInt=(v,a,b,d)=>{ v=parseInt(v,10); return isFinite(v)?Math.max(a,Math.min(b,v)):d; };
function sanitizeMq(m){
  if(!m||typeof m!=='object') return newMq();
  const moved=m.ver!==MQ_VER, s=mqInt(moved?mqMigrate(mqInt(m.s,0,MQ.length,0),m.ver):m.s,0,MQ.length,0), st=s>=MQ.length?0:mqInt(m.st,0,2,0), step=MQ[s];
  const keep=!moved||(step&&step.id[0]!=='W'&&MQ_V2_IDS[mqV2Index(mqInt(m.s,0,99,0),m.ver)]===step.id);   // (a save moved from before version 3 keeps its part counts only in the acts that were not rewritten)
  const n=step?step.parts.map((pt,i)=>keep?mqInt(Array.isArray(m.n)?m.n[i]:0,0,mqNeed(pt),0):0):[];
  const out={s,st:keep||st===0?st:1,n,h:mqInt(m.h,0,31,0),ver:MQ_VER};
  if(step&&st===0&&step.from===null) out.st=1;
  if(step&&out.st===2&&!mqAllDone(step,n)) out.st=1;
  return out;
}
/* Talking to a quest villager: what they say and what it does. Used by both sides: the server applies the result, the client shows
   the lines (so what you read and what happens always agree). mq: gear.mq; returns {lines, start, parts: [part indices done by this
   talk], complete, next (the next step starts too: its giver is the same villager)} */
function mqTalk(mq,npc,level,night){
  const out={lines:[],start:false,parts:[],complete:false,next:false}, step=MQ[mq.s]; if(!step) return out;
  let st=mq.st; const n=mq.n.slice();
  if(st===0&&step.from===npc){
    if(level<mqGate(step)){ out.lines.push('Come back when you are level '+mqGate(step)+'. Until then, hunt and take notices from the quest board.'); return out; }
    out.start=true; st=1; for(let i=0;i<n.length;i++) n[i]=0; out.lines.push(...(step.offer||[]));
  }
  if(st===1){
    step.parts.forEach((pt,i)=>{ if(pt.talk!==npc||!mqOpen(step,n,i)) return;
      if(pt.night&&!night){ out.lines.push(...(pt.wait||[])); return; }
      n[i]=mqNeed(pt); out.parts.push(i); out.lines.push(...(pt.say||[])); });
    if(mqAllDone(step,n)) st=2;
    else if(!out.lines.length&&npc===step.from) out.lines.push('('+mqObjective(step,n)+')');
  }
  if(st===2&&step.to===npc){
    out.complete=true; out.lines.push(...(step.done||[]));
    const nx=MQ[mq.s+1]; if(nx&&nx.from===npc&&level>=mqGate(nx)){ out.next=true; out.lines.push(...(nx.offer||[])); }
    else if(nx&&nx.from===null&&nx.intro) out.lines.push(...nx.intro);   // (the next step starts by itself: its first lines follow in the same talk)
  }
  return out;
}
// what to do now, in a few words (the quest log)
function mqObjective(step,n){
  if(mqAllDone(step,n)) return 'Return to '+MQ_NAMES[step.to];
  const i=step.parts.findIndex((pt,k)=>mqOpen(step,n,k)); if(i<0) return '';
  const pt=step.parts[i], need=mqNeed(pt); return pt.text+(need>1?' ('+(n[i]||0)+' / '+need+')':'');
}

/* ---- places the quest uses ---- */
// a dry spot near a zone's middle (the grey monsters' spawn, the herbs): off the roads, above the water, on gentle ground
function mqSpot(zn,fa,fr){
  for(let k=0;k<40;k++){ const a=fa+(k%5-2)*0.06, r=clamp(fr+(Math.floor(k/5)%8-3.5)*0.05,0.1,0.95), [x,z]=zonePoint(zn,a,r);
    if(rawHeight(x,z)>1.5&&!nearRoad(x,z,4)&&Math.abs(rawHeight(x+3,z)-rawHeight(x-3,z))<2.5&&Math.abs(rawHeight(x,z+3)-rawHeight(x,z-3))<2.5) return [x,z]; }
  return zonePoint(zn,fa,fr);
}
const HERBS=[[-0.3,0.25],[-0.12,0.55],[0.08,0.3],[0.26,0.62],[0.02,0.8]].map(([a,r])=>mqSpot(ZONES.find(z=>z.key===1),a,r));
const HERB_R=3.2;   // how close you must be to pick one
const mqGreySpot=key=>mqSpot(ZONES.find(z=>z.key===key),0,0.5);
// Wren's sickbed, under the awning of the first house right of the gate (the family house); Odran's cart outside each gate
{ const H=VIL.houses[0], tx=Math.cos(H.a), tz=-Math.sin(H.a), out=Math.hypot(H.x-VIL.x,H.z-VIL.z)-H.d/2-1.25, cx=VIL.x+Math.sin(H.a)*out, cz=VIL.z+Math.cos(H.a)*out;
  VIL.bed={x:cx+tx*2.3,z:cz+tz*2.3,rot:H.a};
  VIL.boxes.push({x:VIL.bed.x,z:VIL.bed.z,rot:H.a,hw:1.05,hd:0.55});
  VIL.anchors.bed={x:VIL.bed.x-tx*0.95,z:VIL.bed.z-tz*0.95,face:H.a+Math.PI/2};   // the foot of the bed (Wren lies head toward +tangent)
  VIL.anchors.bedside={x:VIL.bed.x+Math.sin(H.a)*-1.1,z:VIL.bed.z+Math.cos(H.a)*-1.1,face:H.a};
}
/* ---- the story's places (docs/WILDWOOD-STORY.md): Tansy's farm west of the gate and the road to it, the witch's hut, Pip's hollow, the training places, the Circle ---- */
const MQ_FARM={x:-24,z:200};   // (dry ground east of the river, 94 m from the village: the first spot at (-59,219) was in the river)
const MQ_HOLD=mqSpot(ZONES.find(z=>z.key==14),0,0.5);   // (the Goblin Chieftain's Hold: W14 spawns one chieftain for you here)
const MQ_PLACES={
  road1:{x:VIL.anchors.gate.x,z:VIL.anchors.gate.z,r:9,name:'The village gate'},
  road2:{x:-4,z:238,r:8,name:'The fallen log'},
  road3:{x:-36,z:228,r:8,name:'The hedge'},
  meadow:{x:-24,z:246,r:20,name:'The Slime Meadow\'s edge'},
  farm:{x:MQ_FARM.x,z:MQ_FARM.z,r:16,name:'Tansy\'s farm'},
  loft:{x:MQ_FARM.x-5,z:MQ_FARM.z-4,r:5,name:'Tansy\'s barn'},
  tansyfield:{x:MQ_FARM.x+2,z:MQ_FARM.z+9,r:14,name:'Tansy\'s field'},
  clearing:{x:10,z:242,r:14,name:'The clearing'},
  home:{x:VIL.bed.x,z:VIL.bed.z,r:7,name:'Your house'},
  hut:{x:310,z:300,r:8,name:'Morrow\'s hut'},
  pellsite:{x:-154,z:266,r:10,name:'The river crossing'},
  thicket:{x:12,z:34,r:14,name:'The Beetle Thicket'},
  grove:{x:224,z:-8,r:16,name:'The Treant Grove'},
  pip:{x:226,z:-180,r:8,name:'Pip\'s hollow'},
  wallows:{x:-244,z:404,r:14,name:'The Dire Wallows'},
  ridge:{x:358,z:434,r:14,name:'Ironshell Ridge'},
  rotwood:{x:-100,z:-40,r:12,name:'The edge of Rotwood'},
  ribbonrow:{x:VIL.anchors.gate.x+16,z:VIL.anchors.gate.z+12,r:9,name:'The Ribbon Row'},
  grave:{x:386,z:168,r:8,name:'The grave in Deathcap Dell'},
  stump:{x:-78,z:440,r:10,name:'The Whisper Stump'},
  hem:{x:262,z:-200,r:14,name:'The Hem'},
  hold:{x:MQ_HOLD[0],z:MQ_HOLD[1],r:16,name:'Chieftain\'s Hold'},
  circle:{x:257,z:-259,r:26,name:'The Stone Circle'}
};
// the people who live out in the wild stand at a fixed place (the talk counts there, the client builds them at the same spot: WILD_SITES in village/villagers-outfits.js)
const MQ_SITE_NPC={morrow:MQ_PLACES.hut,pip:MQ_PLACES.pip,pell:MQ_PLACES.pellsite};
/* Where a story villager stands now (null: their usual place). A step's `at:{npc:[place per open part]}` moves them while the step is under way ('@name' is an anchor of the home village; a place of
   MQ_PLACES is stood beside, not on). The people of the wild stand at MQ_SITE_NPC unless a step moves them. Used by the client (village/villagers.js moves them, economy/main-quest.js marks them) and the server
   (server/main-quest.js: a talk away from the village counts when you are beside them). mq: gear.mq */
function mqStoryAt(npc,mq){
  if(!mq) return null; const s=MQ[mq.s];
  if(s&&mq.st>=1){
    if(npc==='wren0') return s.id==='P1'?VIL.anchors.well:VIL.anchors.bedside;
    const list=s.at&&s.at[npc];
    if(list){
      let i=s.parts.findIndex((pt,k)=>(mq.n[k]||0)<mqNeed(pt)); if(i<0) i=s.parts.length-1;
      const key=list[Math.min(i,list.length-1)];
      if(key[0]==='@') return VIL.anchors[key.slice(1)];
      const P=MQ_PLACES[key]; return {x:P.x+3,z:P.z+3};
    }
  }
  if(npc==='wren0') return VIL.anchors.bedside;
  return MQ_SITE_NPC[npc]||null;
}
// Wren is well until the prologue's P6 (the healthy Wren, 'wren0'); from P6 on the sick one lies in the bed
const mqWrenSick=mq=>!!mq&&mq.s>=MQ_BY_ID.P6.i;
for(const V of VILS){
  if(V.cart) continue;   // (Glasswell's cart stands where its plan puts it, shared/glasswell.js)
  const a=V.ent-0.28, cx=V.x+Math.sin(a)*(VR+9), cz=V.z+Math.cos(a)*(VR+9);
  V.cart={x:cx,z:cz,rot:V.ent+Math.PI/2};
  V.circles.push([cx,cz,1.5]);
  const b=V.ent-0.2; V.anchors.cart={x:V.x+Math.sin(b)*(VR+6.5),z:V.z+Math.cos(b)*(VR+6.5),face:V.ent};
}

/* ---- readable lore (docs/STORY.md: hints only). Walk up and press the talk key. kind: the prop drawn (game/world/lore-props.js) ---- */
const LORE=(()=>{
  const out=[], add=(id,x,z,kind,name,text,o)=>out.push(Object.assign({id,x,z,kind,name,text,rot:0},o||{}));
  { const [x,z]=arenaGate(ARENA,VIL.x,VIL.z,5); add('carvings',x,z,'stone','The Stone Circle\'s carvings','Carvings run round the stone, worn soft by rain: people with their hands raised, a great ring in the sky, and ships. Many ships, long and smooth, with no sails and no oars. Under them runs a line of marks nobody in Wildwood can read. Inside the circle the Rootwarden sleeps, and half its bark has gone grey.',{rot:Math.atan2(x-ARENA.x,z-ARENA.z)}); }
  add('tunnelsign',TUN.x0-18,TUN.z+6,'sign','A sign by the bridge','Under the painted "HANAMI, BEYOND THE MOUNTAINS", older letters are cut into the rock itself: straight, even, every one the same depth, as if one steady hand cut them all without tiring. Nobody can read them.',{rot:-Math.PI/2});
  for(const B of BRIDGES){
    if(B.kind!=='causeway'||B.name[0]!=='T') continue;
    const e=B.len/2+2.5, x=B.x-B.dx*e+B.dz*2.6, z=B.z-B.dz*e-B.dx*2.6, rot=Math.atan2(-B.dx,-B.dz);
    if(B.name==='The Drowned Road'){
      add('drowned',x,z,'sign','The Drowned Road','A sign nailed to a post: "THE DROWNED ROAD. KEEP TO THE PLANKS." Below the planks the old road runs on under the water, its paving stones fitted so close a knife will not go between them. Nobody in Wildwood cuts stone like that. Oskar says the water came up "the year the sky went quiet". Nobody else remembers such a year.',{rot});
      let u=-B.len/2; while(u<0&&baseHeight(B.x+B.dx*u,B.z+B.dz*u)>WATER-1.2) u+=1;   // where the water is about waist deep
      add('milestone',B.x+B.dx*u+B.dz*3.2,B.z+B.dz*u-B.dx*3.2,'mile','A drowned milestone','A milestone leans out of the water beside the planks. Most of the carving is gone: a number, 12, and above it a ring with a small sun inside.',{rot:rot+0.4});
    } else if(B.name==='The Long Planks') add('longplanks',x,z,'sign','The Long Planks','"THE LONG PLANKS. Laid by the shore folk, mended by whoever falls in." Under the water, the same close-fitted paving as the Drowned Road, running on toward the sea.',{rot});
    else if(B.name==='The Heron Steps') add('heronsteps',x,z,'sign','The Heron Steps','"THE HERON STEPS." Someone has added in chalk: "the herons were here first".',{rot});
  }
  { const ex=EDGE_ZONES[0].x+70; let ez=EDGE_ZONES[0].z; for(let i=0;i<40;i++) ez+=coastDist(ex,ez)-32;   // the old boat lies on the beach of the Crownsea Shore (the shore zone), a few metres up from the waterline
    add('wreck',ex,ez,'wreck','An old fishing boat','The ribs of a fishing boat, bleached and split. Every plank has gone the colour of ash, and nothing grows in the sand around it, not even the sea grass. Farther out, the water is the same grey.',{rot:0.6}); }
  { const [x,z]=arenaGate(ARENA20,VIL2.x,VIL2.z,6); add('demongate',x,z,'stone','The Demon Gate\'s stone','The gate\'s stone is smooth as glass and cold in the sun, with no chisel mark anywhere. Letters run across it, and Kaede\'s scroll gave you the key to them: "Where the ice meets the sky the frost flower grows, and the sleepers wake." Someone has scratched beneath it with a knife: "It was here before the village. It will be here after."',{rot:Math.atan2(x-ARENA20.x,z-ARENA20.z)}); }
  add('offerings',TUN.x1+34,TUN.z-9,'wishpost','A roadside wish-post','Folded paper wishes are tied to a roadside post. "For a quiet sky to speak again." "For my father, grey since the spring." "For the foxes to be kind again."',{rot:0.8});
  add('icewall',PASS.x,PASS.ice+4.5,'ice','The ice wall','The pass north is shut by a wall of blue ice, taller than the tallest cedar. Deep inside it, dark shapes hang like flies in amber. Somewhere beyond lies the Hoarfrost Reach, and under its glaciers, the Frostbloom.',{rot:0,
    textOpen:'The ice wall is gone. Where it stood there is a slope of grey slush and broken blue blocks, and beyond it Frostgate Pass climbs north. The dark shapes it held lie in the meltwater: old timbers, coils of rope, one boot, and a smooth glass lantern that still glows faintly, with no flame in it.'});
  { const V=VIL3, e=V.ent, rx=4.6, rz=-0.6, px=V.x+Math.sin(e)*(VR+9), pz=V.z+Math.cos(e)*(VR+9);
    add('runes',px+rx*Math.cos(e)+rz*Math.sin(e)-Math.sin(e)*1.4,pz-rx*Math.sin(e)+rz*Math.cos(e)-Math.cos(e)*1.4,'runes','The rune stones at Rimehold\'s gate','Runes are cut into the standing stone, deep and even, in three rows. The lowest row is Rimehold\'s own script, and Old Sigrun\'s grandmother could read it: "Winter came after the burning sky. Under the ice the flower waits. Do not wake what fell." The upper rows are older, straight as ruled lines, and nobody can read those at all.',{rot:e}); }
  { const B=FROST_LAKES[0]; let best=null;
    for(let a=0;a<24&&!best;a++){ const x=B.x+Math.sin(a/24*TAU+2.2)*(B.r+8), z=B.z+Math.cos(a/24*TAU+2.2)*(B.r+8); if(zoneAt(x,z)===ZONES.find(zn=>zn.key==='h24')&&!nearRoad(x,z,6)&&iceDist(x,z)>4) best=[x,z]; }
    if(best) add('hullplate',best[0],best[1],'hull','A grey plate in the ice','A slab of grey metal juts out of the glacier at a slant, smooth as glass and cold to the touch. It has not rusted or dented. Round-headed studs run across it in even rows, and half scoured away by the wind, a ring with a small sun inside is painted on it. The hunters call it a dragon\'s scale.',{rot:0.6}); }
  { const A=ARENA30, a0=Math.atan2(A.x-VIL3.x,A.z-VIL3.z);
    add('ironbird',A.x+Math.sin(a0)*(A.r+3.5),A.z+Math.cos(a0)*(A.r+3.5),'ironbird','The iron bird','Ahead, nose down in the glacier with one wing snapped, lies a body of grey metal as long as a longhouse, set with even rows of studs and a glass eye cracked black. On its tail fin is a painted ring with a small sun inside it. The hunters call it the dragon\'s skeleton. Warm air sighs from under a wing, and the snow around it never settles.',{rot:a0}); }
  // the Greyspine's two: the deepest shaft (a timbered mouth in the Miners' Scree, the mine) and the golem's broken stone at the near edge of its cavern (the Sink)
  { const [x,z]=mqSpot(ZONES.find(zn=>zn.key==='g28'),0.3,0.4);
    add('deepshaft',x,z,'shaft','The deepest shaft','The mouth is timbered like any other shaft in the Scree, but the black stone round it has been cut through clean, in a perfect round, wider than a wagon, and it goes down and down. Cold air breathes out of it, and the breath smells of nothing: not damp, not smoke, not rock. Ten fathoms down the walls stop being stone and turn to black metal, ribs as thick as a man, running into the dark like the roots of a tree. Far below, something very large is moving, slowly, with a sound like a hundred bells under water. The crew\'s lamps lie on the lip, still burning.',{rot:Math.atan2(VIL4.x-x,VIL4.z-z)}); }
  // two roadside shrines (optional lore, no step reads them: STORY.md section 7): a piled-slate shrine on the Ledgeway's pass and the miners' lamp shrine at an old drift in the Scree
  { const [x,z]=mqSpot(ZONES.find(zn=>zn.key==='g27'),-0.2,0.45);
    add('ledgeshrine',x,z,'shrine','A shrine on the pass','A little shrine of piled slate stands on the pass, hung with twists of blue wool. Slips of paper are pinned under its stones: "Mountain, keep your sleep." "For the shift that did not come home." "Let the bell ring true." The wool is new. The slate is very old, and every stone in the pile has been cut to exactly the same size.',{rot:0.5}); }
  { const [x,z]=mqSpot(ZONES.find(zn=>zn.key==='g28'),-0.3,0.55);
    add('scrubshrine',x,z,'shrine','The miners\' lamp shrine','A shrine at the mouth of an old drift, with a lamp in its niche, lit and trimmed. The miners always left a lump of coal on the ledge for luck. Lately some have left a lump of black stone instead, and every one of them has been turned face to the wall.',{rot:-0.7}); }
  { const A=ARENA32, a0=Math.atan2(VIL4.x-A.x,VIL4.z-A.z);
    add('golemframe',A.x+Math.sin(a0)*(A.r+3.5),A.z+Math.cos(a0)*(A.r+3.5),'frame','The golem\'s broken stone','The frost has split the golem\'s stone shell here, and a slab of it has fallen away from what lies underneath: a jointed frame of grey metal, thick as a tree trunk, with hinges a man could stand in. Every joint is fitted close, and the whole is studded with round-headed rivets in even rows. On a flat plate at the hip a ring is painted, with a small sun inside it, half gone with weather. Nobody carved this. Somebody made it, long ago, with tools no smith in Highmark owns.',{rot:a0}); }
  return out;
})();
const LORE_BY_ID={}; LORE.forEach(L=>{ LORE_BY_ID[L.id]=L; });
const LORE_R=4.5;   // how close you must be to read one
function loreNear(x,z){ let best=null,bd=LORE_R; for(const L of LORE){ const d=Math.hypot(x-L.x,z-L.z); if(d<bd){ bd=d; best=L; } } return best; }
// trees and bushes keep clear of the story's spots (the heartleaf, the lore props, Odran's carts) so you can see and reach them
const STORY_SPOTS=[[MQ_FARM.x,MQ_FARM.z,22],...['road2','road3','clearing','meadow','hut','pip','grave','stump','ribbonrow'].map(k=>[MQ_PLACES[k].x,MQ_PLACES[k].z,k==='road2'||k==='road3'?6:k==='hut'?14:10]),...HERBS.map(([x,z])=>[x,z,5]),...LORE.filter(L=>L.kind!=='ice').map(L=>[L.x,L.z,L.kind==='wreck'?7:5]),...VILS.map(V=>[V.cart.x,V.cart.z,5])];
function storyClear(x,z){ for(const [sx,sz,r] of STORY_SPOTS) if(Math.abs(x-sx)<r&&Math.abs(z-sz)<r&&Math.hypot(x-sx,z-sz)<r) return true; return false; }
