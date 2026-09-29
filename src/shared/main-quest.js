//@ The main quest line (MQ: acts I-III, docs/MAIN-QUEST.md), its places (Wren's sickbed, Odran's carts, heartleaf, grey spots) and the readable lore spots (LORE: carvings, signs, the drowned roads, the Hoarfrost's runes and wreck). Pure.
/* The story is docs/STORY.md (mind its spoiler rule: hints only, no modern words). Each step:
     id, title, gate (level it is offered from), from (villager id who offers it; null = starts by itself when the step before ends),
     to (villager id you hand it in to), r (XP reward: r x expToNext(gate), so it keeps its share if the curve is tuned),
     tip (a one-time tutorial toast when the step starts), offer / done (what the giver says when offering / handing in; the
     client shows them), parts (what to do; all at once unless a part says after:true, which waits for the parts before it).
   Parts: talk:'<villager id>' (say: their lines; night: only after dark, wait: their lines before that) · kill:'<monster id>', n ·
     grey:'<GREY_DEFS id>', n, zone (a few are spawned for you there) · pick:'herb', n (glowing heartleaf, HERBS) ·
     collect:'<what>', from:[monster ids], n, chance (a quest drop) · gather:'<NODE_KINDS id or profession id>', n (a resource node gathered) · read:'<LORE id>' (walk up
     and read it) · act:'<system>', n (class, buy, armor, skill, burst, board, sell, upskill, merge, soul, warp, hanami, rimehold, learn (prof:'<profession>'), tool (tool:'pick|axe|sickle', tier: a tool
     of at least that tier is worn), craft (kind:'weapon|armor'), brew (kind:'heal|might|guard', minTier 0-2), potion (kind): see server/main-quest.js) · level · tier
     (a weapon of that item tier, 0-based) · boss:'<boss monster id>' (bossLine: toasted when it falls).
   Progress is gear.mq = {s: step index, st: 0 offered / 1 in progress / 2 ready to hand in, n: [per part]}; the server
   (server/main-quest.js) moves it on, the client (game/economy/main-quest.js) draws it. */
const MQ=[
  /* ---------------- Act I: The Grey Rain (Wildwood, levels 1-15) ---------------- */
  {id:'W1',title:'The grey rain',gate:1,from:null,to:'linnea',r:0.6,
   tip:'Move with W A S D (or the joystick) and look around with the mouse. Walk up to someone and press the talk key (E) to talk.',
   parts:[{talk:'wren',text:'See to Wren, under the awning of your house by the gate',say:['(Wren lies still under the awning. Their breathing is slow, and thin grey lines run under the skin of their arms, like frost on a window.)','(You say their name. They do not wake.)']},
          {talk:'linnea',after:true,text:'Fetch Healer Linnea from the herb garden'}],
   done:['Grey lines under the skin, and a sleep that will not break... I have never seen this in Wildwood. Not once in forty years.','It started with the grey rain, did it not? Three days of it, and Wren out in it gathering kindling.','I can keep them comfortable. To do more, I need heartleaf.']},
  {id:'W2',title:'Heartleaf',gate:1,from:'linnea',to:'linnea',r:1.2,
   tip:'Pick heartleaf with the talk key. To fight, face a monster and attack (key 1 or F; Tab switches target). The bar over a monster shows its level.',
   offer:['Heartleaf grows at the edge of the Slime Meadow, just outside the gate. Five sprigs should do.','Mind the slimes. Clear a few while you are there: Bram says they have been bolder since the rain.'],
   parts:[{pick:'herb',n:5,text:'Pick heartleaf in the Slime Meadow'},{kill:'slime',n:5,text:'Defeat slimes'}],
   done:['Good. This will ease the fever.','It will not wake them, though. Nothing I have will.']},
  {id:'W3',title:'A weapon of your own',gate:2,from:'aldric',to:'aldric',r:1.2,
   tip:'The weapon you carry is your class: sword (Warrior), bow (Archer) or wand (Mage). Switch in the character editor or by equipping a weapon in the inventory (I).',
   offer:['So you are Wren\'s elder. I heard. The whole village has.','If you mean to walk the far woods for them, you need a weapon that suits your hands. Sword, bow or wand: try them.','Your class is only the weapon you carry. Change it whenever you like.'],
   parts:[{act:'class',text:'Try another weapon (character editor or inventory)'}],
   done:['Good grip. Your sibling needs someone who can walk the far woods. Start with the near ones.']},
  {id:'W4',title:'Dressed for the woods',gate:3,from:'ilse',to:'ilse',r:1.1,
   tip:'Coins come from monsters and quests. Buy at the stalls, then wear it: the inventory (I) shows what you wear and what you carry.',
   offer:['Beetle horns go through a shirt like it is paper. Let us get something between you and them.','Buy a piece from me, or a blade from Tomas, then put it on.'],
   parts:[{act:'buy',text:'Buy something at Tomas\'s or Ilse\'s stall'},{act:'armor',text:'Wear a piece of armour (inventory)'}],
   done:['It suits you. Tomas says the next one is cheaper, "for Wren". Do not tell him I told you.']},
  {id:'W5',title:'The first trick',gate:3,from:'aldric',to:'aldric',r:0.9,
   tip:'Your skill sits in slot 2 (key Q or 2). It dims while it recovers. The skills panel (K) shows what Aldric can teach.',
   offer:['Every fighter learns one trick early. You have yours now: it sits in your second slot.','Try it on the beetles of the Beetle Thicket. Mind the cooldown.','When you have coins to spare, I teach better tricks.'],
   parts:[{act:'skill',text:'Use your skill (Q or 2)'},{kill:'beetle',n:5,text:'Defeat horned beetles in the Beetle Thicket'}],
   done:['Some of those beetles had grey in their shells, like cracks of ash. Did you see?','...No matter. Well done.']},
  {id:'W6',title:'The board',gate:4,from:'maren',to:'maren',r:0.9,
   tip:'The quest board is how you grow between main quest steps: the main quest alone will not make you strong enough.',
   offer:['Linnea\'s herbs cost coin, and the woods pay those who work. Take a notice from the board behind me.','Hunts, bounties, places to scout. Finish one and hand it in to me.'],
   parts:[{act:'board',text:'Finish a notice from the quest board and hand it in'}],
   done:['There. The board is always here between the bigger things.','The forest remembers everything. Some of it is waking up.']},
  {id:'W6a',title:'Working hands',gate:5,from:'tamsin',to:'tamsin',r:0.5,
   tip:'The Wayfarers\' Lodge teaches three professions, each with its own tool: mining (pickaxe), woodcutting (axe) and gathering (sickle). Wear the tool (inventory, I), walk up to a herb, a vein or a tree and press the talk key. What you take is used by the smiths, the armourers and the healers.',
   offer:['You are Wren\'s elder, the one who walks the far woods? I am Tamsin. The Wayfarers keep a lodge in every village, for people like you.','You bring home a great many monster parts and not one plant. Let us mend that. Gathering first: sixty coins for the teaching, thirty for a sickle, and the woods start giving back.'],
   parts:[{act:'learn',prof:'gathering',text:'Learn Gathering at the Wayfarers\' Lodge (Tamsin)'},{act:'tool',tool:'sickle',text:'Buy a sickle from Tamsin and wear it (inventory)'},{gather:'gathering',n:3,text:'Gather 3 herbs in the woods (sunpetal grows in every zone)'}],
   done:['A sickle looks good on you. Sunpetal is the herb every healer starts with, and there is a knack to cutting it. You have it.','Linnea will want some. She has been asking who in the village still knows a plant from a weed.']},
  {id:'W7',title:'Sap of the Heartwood',gate:5,from:'linnea',to:'wren',r:0.8,
   tip:'The map (N) and the minimap mark where the main quest wants you, with a violet marker.',
   offer:['The trees of the Treant Grove are old, older than the village. Their sap is the strongest medicine I know.','Bring me three measures. The map shows you the way.'],
   parts:[{collect:'Heartwood sap',from:['treant'],n:3,chance:0.5,text:'Take heartwood sap from the treants of the Treant Grove'},
          {talk:'linnea',after:true,text:'Bring the sap to Linnea',say:['Treant sap. The old trees keep something of the Heartwood in them.','Let me warm it... There. Give it to Wren, a drop on the lips.']}],
   done:['(Wren\'s eyes open. For a moment they know you.)','...You are here. I dreamed of grey water. It was so quiet.','(Their eyes close again. The grey lines are a little paler.)']},
  {id:'W7b',title:'Linnea\'s kettle',gate:6,from:'linnea',to:'linnea',r:0.5,
   tip:'Brewing is done at a healer\'s, with herbs and a few coins. Drink a potion with Z (healing), X (might) or C (guard): the strongest one you have is used. A healing potion needs you to be hurt.',
   offer:['Tamsin says you can cut herbs now. Good: the sap will not last, and a fever wants a draught.','Bring me three sunpetal and I will show you the kettle. Then drink one yourself when you are next hurt: a healer who has not tasted her own work is a liar.'],
   parts:[{gather:'sunpetal',n:3,text:'Gather 3 sunpetal'},{act:'brew',kind:'heal',text:'Brew a Healing Potion at Linnea\'s (herbs and a few coins)'},{act:'potion',kind:'heal',text:'Drink a Healing Potion when you are hurt (Z)'}],
   done:['Bitter, is it not? It is meant to be. Anything sweet is lying to you.','Might and guard draughts want other herbs. Herbs are the same everywhere: the north grows the strongest.']},
  {id:'W8',title:'The peddler',gate:6,from:'odran',to:'odran',r:0.6,
   tip:'Sell what you do not need, at any stall or to Odran.',
   offer:['Well met! Odran, trader in useful things and useless ones. Came up the south road the week the rain started. Lucky me.','Got anything to sell? I pay fair. Fairer than Tomas, anyway.'],
   parts:[{act:'sell',n:2,at:'cart',text:'Sell Odran two things at his cart'}],
   done:['A pleasure. Tell me, who here was born in Wildwood? Everyone? And their parents too?','...Just curious. I collect stories as well as spoons.']},
  {id:'W9',title:'Grey in the bog',gate:7,from:'bram',to:'bram',r:0.55,
   tip:'Monsters drop materials (see the inventory): Aldric uses them to upgrade skills. Grey-veined monsters are tougher, and worth more.',
   offer:['Something is wrong in the Bog. Slimes the size of a cart, grey all through, like Wren\'s arms.','Put three of them down before they wander closer.'],
   parts:[{grey:'greybog',n:3,zone:7,text:'Defeat the grey-veined slimes in the Bog'}],
   done:['Grey, all of them. Twenty years I have walked the edge of these woods. The grey starts far out, where the land meets the sea and the mountains, and it creeps inward.','Wildwood has always been the last place anything bad reaches. I would like to know why.']},
  {id:'W10',title:'Sharper',gate:8,from:'aldric',to:'aldric',r:0.5,
   tip:'In the skills panel (K), a skill you own can be upgraded at a trainer with coins and monster drops.',
   offer:['Your hands have learned the basics. Now make a trick sharper: coins and the right monster parts, and I will show you.','Open the skills panel and look for Upgrade.'],
   parts:[{act:'upskill',text:'Upgrade a skill at Aldric (coins and monster drops)'}],
   done:['Better. You know, there is an old tale of a "grey sleep". My mother told it.','I cannot remember where she heard it. I cannot remember how it ends, either. Odd.']},
  {id:'W11',title:'Three of a kind',gate:9,from:'greta',to:'greta',r:0.45,gift:'three',
   tip:'Three identical items (not worn) become one of the next rarity at the forge: common, rare, epic, unique, legendary.',
   offer:['Here: three of the same, fresh off my bench. Now watch what the forge does with three.','Put them in, and out comes one better.'],
   parts:[{act:'merge',text:'Merge three identical items at Greta\'s forge'}],
   done:['Hear it sing? Folded steel always sings.','My father said the old smiths\' steel sang a whole song. Nobody knows how they made it.']},
  {id:'W11b',title:'Made by hand',gate:9,from:'tomas',to:'tomas',r:0.45,
   tip:'Crafting: weapons are made from ore at the weaponsmith\'s (the Craft tab), armour from logs at the armourer\'s. Ore of each grade lies in the zones of its gear tier: copper in the inner woods, iron further out. A tool of too low a tier cannot work a node.',
   offer:['You keep paying me coin for what a good vein of iron would give you for free. Tamsin at the Lodge teaches mining and sells the pickaxe.','Bring me the ore and I will show you how the hammer takes it. Copper from the inner woods will do for a first blade.'],
   parts:[{act:'learn',prof:'mining',text:'Learn Mining at the Wayfarers\' Lodge (Tamsin)'},{act:'tool',tool:'pick',text:'Buy a pickaxe and wear it (inventory)'},{gather:'mining',n:10,text:'Mine 10 ore (copper in the inner woods)'},{act:'craft',kind:'weapon',after:true,text:'Craft a weapon at Tomas\'s (the Craft tab)'}],
   done:['Ha! Rough as a badger, and it will cut. Now you know what my prices pay for.','A rare blade wants more ore than a common one, and an epic one a great deal more. But it is all ore, and ore is free to anyone with a pick.']},
  {id:'W12',title:'Everything at once',gate:10,from:'aldric',to:'aldric',r:0.4,
   tip:'Your burst sits in slot 3 (key R or 3): it hits hard and takes long to come back.',
   offer:['Your third slot is open: a burst.','Try it on the dire boars of the Dire Wallows. Save it for the worst moment.'],
   parts:[{act:'burst',text:'Use your burst (R or 3)'},{kill:'direboar',n:3,text:'Defeat dire boars in the Dire Wallows'}],
   done:['You will want that when the worst moment comes. And it will.']},
  {id:'W13',title:'The storyteller',gate:11,from:'oskar',to:'oskar',r:0.35,
   tip:'A day lasts 20 minutes, half of it night. Some things only happen after dark.',
   offer:['Linnea asked me about the grey sleep. I will tell it properly, after dark, the way it should be told.','Come back when the sun is down. I will be here. I am always here.'],
   parts:[{talk:'oskar',night:true,text:'Sit with Oskar at the campfire after dark',wait:['Not yet. Stories need the dark. Come back when the fire is the only light.'],
           say:['My grandfather told it like this. Long ago, beyond the mountains, a grey sleep took whole villages. The sleepers dreamed of grey water, and never woke.','He said the circle of stones by the East Road once carried him over the mountains in a blink.','And he said the stones have pictures on them. Ships, he said. Ships with no sails.','Go and look, if you like. But do not wake the thing that sleeps inside the circle.']},
          {read:'carvings',after:true,text:'Read the carvings at the Stone Circle (do not wake the guardian)'}],
   done:['Ships with no sails. So he was not lying. Or he was not the only one who dreamed it.','And the guardian, half grey, you say? Then the grey has reached even the Rootwarden.']},
  {id:'W14',title:'Shiny things',gate:12,from:'bram',to:'bram',r:0.3,
   tip:'Harder places go faster together: everyone who hits a monster shares its reward. The chat (Enter) is how you find company.',
   offer:['The goblins of Chieftain\'s Hold have been raiding the south fields, and their chieftains keep a hoard.','Bring it back. Bring friends if you can.'],
   parts:[{collect:'The goblins\' hoard',from:['chieftain'],n:1,chance:0.35,text:'Take the goblins\' hoard from a Goblin Chieftain in Chieftain\'s Hold'}],
   done:['Coins, buckles, a spoon... and this. A glass ball, smooth as an egg, with a thread of metal inside. Like a lamp with no flame.','Odran saw it over my shoulder and offered thirty coins for it on the spot. Thirty! For a glass egg. I sold it. Should I have?']},
  {id:'W15',title:'Beyond the mountains',gate:13,from:'linnea',to:'bram',r:0.25,
   tip:'Every main quest step has a level. Between steps, hunt and take notices: the quest log says where.',
   offer:['The sap no longer helps. Wren sleeps deeper each day.','Across the eastern mountains there is a village called Hanami. Their shrine is said to know every sickness of the soul.','But nobody has crossed since the tunnel was sealed. Ask Bram: he knows the way east.'],
   parts:[{talk:'bram',text:'Ask Bram about the way east',say:['The tunnel east? Sealed, since the guardian woke. The Rootwarden sits in the Stone Circle, and the mountain door will not open while it lives.','Nobody has crossed in my lifetime. If you want to try, you need to be a great deal stronger.']}],
   done:['Level 15, and a weapon worth the name. Then we talk about the Rootwarden.']},
  {id:'W16',title:'Ready',gate:14,from:'bram',to:'bram',r:0.22,
   tip:'A boss needs preparation: your best gear, upgraded skills, and friends if you have them.',
   offer:['Take notices from Maren, hunt the outer woods, see Tomas or Greta for steel.','Come back when you are ready. I will walk you to the circle myself. Well, to the edge of it.'],
   parts:[{level:15,text:'Reach level 15'},{tier:2,text:'Carry a weapon of level 10 or better'}],
   done:['You look ready. As ready as anyone has been.']},
  {id:'W17',title:'The Rootwarden',gate:15,from:'bram',to:'bram',r:0.2,
   tip:'A boss shows where its big attacks will land: step out of the marked ground. Break its shield by destroying the totems. Everyone who helps shares the reward, and it may drop a skill.',
   offer:['It sleeps in the Stone Circle, north-east along the East Road. Wake it, and do not stop until it falls.'],
   parts:[{boss:'boss',text:'Defeat the Rootwarden at the Stone Circle'}],
   bossLine:'The Rootwarden, as it falls: "The roots... cannot hold... for long."',
   done:['It is over? The guardian is down?','...Listen. The mountain is humming. The tunnel door has opened.','Go and see Wren before you leave.']},
  {id:'W18',title:'Goodbye for now',gate:15,from:null,to:'daisuke',r:0.06,
   tip:'The East Road leads through the mountain tunnel to the Sakura Vale. Walking to Hanami attunes the teleport circles.',
   parts:[{talk:'wren',text:'Say goodbye to Wren',say:['(Wren is awake, sitting up, pale but smiling.)','You are going over the mountains? Nobody goes over the mountains.','...Bring me back something pretty. And come back.']},
          {talk:'linnea',text:'See Linnea before you go',say:['Take this charm: heartleaf and treant sap, sewn in linen. It will not stop a blade, but it will remind you what you walk for.','Hanami\'s shrine maiden will know more than I do. Go.']},
          {act:'hanami',after:true,text:'Walk through the tunnel to Hanami'}],
   done:['You came through the tunnel? Then the Rootwarden is dead. Good riddance.','Welcome to Hanami, traveller from beyond the mountains. A sickness, you say? Then you want the shrine. But first, find your feet here.']},
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
   offer:['From beyond the mountains, and still on your feet! Sit, sit.','The circle of stones by the road hums for anyone who has walked here on their own feet. Step on it and it carries you home, and back again.','Go and tell your sibling you have found the shrine. Then come back.'],
   parts:[{act:'warp',text:'Travel home on the teleport circle'}],
   done:['(Wren stirs as you sit down beside the bed.) Cherry trees that bloom all year? ...You are making it up.','(They fall asleep smiling.)']},
  {id:'V5',title:'The soul shrine',gate:16,from:'kaede',to:'kaede',r:0.25,
   tip:'Your soul\'s element makes skills of that element 1.5 times stronger, and its opposite weaker. Change it here whenever you like.',
   offer:['You have come about the sleeping sickness. Chiyo told me.','First, let me see you. Your soul, I mean. Choose an element and I will bind it.'],
   parts:[{act:'soul',text:'Bind your soul to an element at Kaede\'s shrine'}],
   done:['...','Your soul burns brighter than any I have bound. Brighter than anyone\'s from this side of the mountains.','I do not know what that means. I would like to.']},
  {id:'V6',title:'A light for Wren',gate:17,from:'kaede',to:'wren',r:0.2,
   tip:'Monsters have elements (the target frame shows it). Water beats fire, fire beats air, air beats earth, earth beats water; dark and light beat each other.',
   offer:['The grey sleep feeds on the dark. Light holds it back, a little. Not lamplight: living light.','The kodama of Kodama Wood carry it in little lanterns. Bring me six.','The kodama are light: a dark skill hurts them most.'],
   parts:[{collect:'Kodama lantern',from:['kodama'],n:6,chance:0.5,text:'Take kodama lanterns in Kodama Wood'},
          {talk:'kaede',after:true,text:'Bring the lanterns to Kaede',say:['Six little lights. The kodama carry the forest\'s own glow.','I fold it into a talisman, with a thread of your soul. Take it to Wren and keep it near.']}],
   done:['(The talisman glows on the blanket. Wren wakes, and stays awake long enough to talk.)','It is warm. It feels like you.','(They sleep again, but they breathe more easily.)']},
  {id:'V7',title:'The friendly foxes',gate:18,from:'chiyo',to:'chiyo',r:0.2,
   tip:'Passive skills unlock at level 18 and work all the time. Master Ryu and Aldric teach more of them.',
   offer:['When I was a girl the kitsune were our friends. They brought lost children home.','Now some of them have gone grey, like your sibling\'s arms, and they bite. Five of them, up in the Inari Hills.','See Master Ryu first. You are old enough now for what he teaches.'],
   parts:[{talk:'ryu',text:'Ask Master Ryu about passive skills',say:['Level 18? Then your body has learned something your hands have not. Passives: they work without you thinking of them.','Vitality is already in your first slot. I teach others. Now go: the foxes will not wait.']},
          {grey:'greyfox',n:5,zone:18,text:'Drive off the grey kitsune in the Inari Hills'}],
   done:['Grey foxes. In my day... well. In my day a great many things were different.','Then one of them grew nine tails. But that is a story for another night.']},
  {id:'V7b',title:'Lacquer and cherrywood',gate:18,from:'haruka',to:'haruka',r:0.4,
   tip:'Armour is made from logs (woodcutting: an axe). The vale\'s trees need an axe of tier 4 (Sunstone, level 15) or better. Craft at the armourer\'s: the Craft tab.',
   offer:['Silk and lacquer over a frame of good wood: that is samurai armour. The wood is the part nobody thinks about.','Isamu at the Lodge teaches the axe. Bring me a dozen logs from the vale and I will let you make a piece yourself.'],
   parts:[{act:'learn',prof:'woodcutting',text:'Learn Woodcutting at the Wayfarers\' Lodge (Isamu)'},{act:'tool',tool:'axe',tier:3,text:'Buy an axe of level 15 or better (Sunstone) and wear it'},{gather:'woodcutting',n:12,text:'Chop 12 logs in the Sakura Vale'},{act:'craft',kind:'armor',after:true,text:'Craft an armour piece at Haruka\'s (the Craft tab)'}],
   done:['Not bad. The lacquer will forgive the corners.','Rare and epic pieces take more logs, the way they take more of everything.']},
  {id:'V8',title:'A lantern with no flame',gate:19,from:'odran2',to:'odran2',r:0.2,
   offer:['You again! Small world, is it not? Smaller than people think.','I came through the tunnel the day after you opened it. Business, you understand. Sell me something?'],
   parts:[{act:'sell',n:1,at:'cart',text:'Sell Odran something at his cart by Hanami\'s gate'}],
   done:['Pleasure, as always. Oh, this? Just a lantern. See: no flame, and still it glows. Clever, is it not?','...No, it is not for sale. Forget you saw it. (He wraps it in cloth, quickly.)']},
  {id:'V9',title:'The old scrolls',gate:19,from:'kaede',to:'kaede',r:0.2,
   tip:'Kenji and Haruka sell stronger gear from level 20.',
   offer:['The shrine\'s oldest scrolls were stolen by the marsh spirits long ago, and they are the only ones that speak of the grey sleep.','The onibi and the spider-women of the Ghostlight Marsh carry the pieces. Bring me four.'],
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
   done:['Ah! The grey plate. Bless you. Thirty coins a piece, and I never ask where it came from, which is why people keep bringing it.','...It was not a dragon, you know. Dragons do not come in sheets, and the edges are cut clean. Someone made this. (He wraps it in cloth, quickly.) Forget I said that. I am a trader, not a scholar.']},
  {id:'F8',title:'The Rimeking',gate:25,from:'hallvard',to:'sigrun',r:0.25,
   tip:'Ymrik\'s pillars shield him: smash them. Boss skills drop at 10% each, for everyone who helped.',
   offer:['The Rimeking has taken the old ice hall at the heart of the Reach. Hunters go in and come out grey, or do not come out. He was here before the village. The old people say he was never an enemy: that he kept the wolves from the doors.','Something has turned him, the same something that turned the foxes in your vale, I suppose. Go and see. Take friends. The hall is north-north-east of the village, past the lake.'],
   parts:[{boss:'ymrik',text:'Defeat Ymrik, the Rimeking, in his ice hall'}],
   bossLine:'Ymrik, as he falls: "The iron bird... still sings under the ice. And someone... sings back. From a far light on the sea." In the west, ice groans and splits.',
   done:['He said that? "Sings back"?','...Sit. Tell it again, slowly, every word. The old sagas have a verse I never understood. I think I begin to.']},
  {id:'F9',title:'Where the earth\'s heat runs black',gate:25,from:'sigrun',to:'hallvard',r:0.1,
   offer:['Listen now, while the giant is quiet. The saga has a second verse that I did not tell you, because it made no sense.'],
   parts:[{talk:'sigrun',text:'Hear Old Sigrun\'s last verse',say:['"The sickness has a root, where the earth\'s heat runs black. Under the mountains men dig for the root, and call it stone."','The mountains are west, past the glacier valley that has just split. The miners of Highmark dig them. If the grey sleep has a root, that is where your road goes.','But you are not ready. The stone there is older, and what guards it is worse. Grow first. There is a great deal of Hoarfrost yet to see, and a wyrm in the north that nobody has beaten.']}],
   done:['The west valley is open? Then the way to Highmark is open. It is a hard road. Come back and tell us of it, if you can.']}
];
const MQ_BY_ID={}; MQ.forEach((s,i)=>{ s.i=i; MQ_BY_ID[s.id]=s; });
const MQ_END='Act III is over. The glacier valley west of the Hoarfrost Reach has split, but the road to Highmark is not open yet: the story goes on in the Greyspine.';
// which village each quest villager lives in (the server checks you are there when you talk to them); odran2 is Odran's cart in Hanami, odran3 his cart at Rimehold
const MQ_NPC_VIL={tamsin:1,isamu:2,hinata:2,ylva:3,wren:1,linnea:1,odran:1,bram:1,aldric:1,tomas:1,ilse:1,maren:1,greta:1,oskar:1,
  odran2:2,daisuke:2,sayuri:2,kenji:2,haruka:2,tetsuo:2,ryu:2,chiyo:2,kaede:2,
  odran3:3,hallvard:3,ragna:3,bjorn:3,ulfhild:3,thorvald:3,sigrun:3,gudrun:3};
const MQ_NAMES={tamsin:'Tamsin',isamu:'Isamu',hinata:'Herbalist Hinata',ylva:'Alchemist Ylva',wren:'Wren',linnea:'Healer Linnea',odran:'Odran',odran2:'Odran',bram:'Bram',aldric:'Aldric',tomas:'Tomas',ilse:'Ilse',maren:'Maren',greta:'Greta',oskar:'Oskar',
  daisuke:'Daisuke',sayuri:'Sayuri',kenji:'Kenji',haruka:'Haruka',tetsuo:'Tetsuo',ryu:'Master Ryu',chiyo:'Grandmother Chiyo',kaede:'Shrine Maiden Kaede',
  odran3:'Odran',hallvard:'Hallvard',ragna:'Ragna',bjorn:'Bjorn',ulfhild:'Ulfhild',thorvald:'Thorvald',sigrun:'Old Sigrun',gudrun:'Gudrun'};
const mqNeed=pt=>pt.n||1;
// a part can progress: not waiting for the parts before it (after:true)
function mqOpen(step,n,i){ const pt=step.parts[i]; if((n[i]||0)>=mqNeed(pt)) return false; if(!pt.after) return true; for(let k=0;k<i;k++) if((n[k]||0)<mqNeed(step.parts[k])) return false; return true; }
function mqAllDone(step,n){ return step.parts.every((pt,i)=>(n[i]||0)>=mqNeed(pt)); }
function mqReward(step){ return {xp:Math.round(step.r*expToNext(step.gate)), coins:Math.round(step.r*18*coinAvg(step.gate))+10}; }
const mqNight=day=>day>0.53||day<0.005;   // the day clock (0 = 06:00, 0.5 = 18:00): dusk to dawn

// a new character's progress (W1 starts by itself), and a save's, checked
// MQ_VER 2: W6a, W7b, W11b and V7b were inserted after W6 (old index 5), W7 (6), W11 (10) and V7 (22): an older save's step index moves up by the ones before it
const MQ_VER=2, MQ_INSERTED=[[5,1],[6,1],[10,1],[22,1]];
const mqMigrate=s=>s+MQ_INSERTED.reduce((a,[after,n])=>a+(s>after?n:0),0);
function newMq(){ return {s:0,st:1,n:MQ[0].parts.map(()=>0),h:0,ver:MQ_VER}; }
const mqInt=(v,a,b,d)=>{ v=parseInt(v,10); return isFinite(v)?Math.max(a,Math.min(b,v)):d; };
function sanitizeMq(m){
  if(!m||typeof m!=='object') return newMq();
  const s=mqInt(m.ver===MQ_VER?m.s:mqMigrate(mqInt(m.s,0,MQ.length,0)),0,MQ.length,0), st=s>=MQ.length?0:mqInt(m.st,0,2,0), step=MQ[s];
  const n=step?step.parts.map((pt,i)=>mqInt(Array.isArray(m.n)?m.n[i]:0,0,mqNeed(pt),0)):[];
  const out={s,st,n,h:mqInt(m.h,0,31,0),ver:MQ_VER};
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
    if(level<step.gate){ out.lines.push('Come back when you are level '+step.gate+'. Until then, hunt and take notices from the quest board.'); return out; }
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
    const nx=MQ[mq.s+1]; if(nx&&nx.from===npc&&level>=nx.gate){ out.next=true; out.lines.push(...(nx.offer||[])); }
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
for(const V of VILS){
  const a=V.ent-0.28, cx=V.x+Math.sin(a)*(VR+9), cz=V.z+Math.cos(a)*(VR+9);
  V.cart={x:cx,z:cz,rot:V.ent+Math.PI/2};
  V.circles.push([cx,cz,1.5]);
  const b=V.ent-0.2; V.anchors.cart={x:V.x+Math.sin(b)*(VR+6.5),z:V.z+Math.cos(b)*(VR+6.5),face:V.ent};
}

/* ---- readable lore (docs/STORY.md: hints only). Walk up and press the talk key. kind: the prop drawn (game/world/lore-props.js) ---- */
const LORE=(()=>{
  const out=[], add=(id,x,z,kind,name,text,o)=>out.push(Object.assign({id,x,z,kind,name,text,rot:0},o||{}));
  { const [x,z]=arenaGate(ARENA,230,-92,5); add('carvings',x,z,'stone','The Stone Circle\'s carvings','Carvings run round the stone, worn soft by rain: people with their hands raised, a great ring in the sky, and ships. Many ships, long and smooth, with no sails and no oars. Under them runs a line of marks nobody in Wildwood can read. Inside the circle the Rootwarden sleeps, and half its bark has gone grey.',{rot:Math.atan2(x-ARENA.x,z-ARENA.z)}); }
  add('tunnelsign',TUN.x0-18,TUN.z+6,'sign','A sign by the tunnel','Under the painted "HANAMI, BEYOND THE MOUNTAINS", older letters are cut into the rock itself: straight, even, every one the same depth, as if one steady hand cut them all without tiring. Nobody can read them.',{rot:-Math.PI/2});
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
  { const sr=ROADS.find(r=>r.name==='The Shore Road'), [ex,ez]=sr.pts[sr.pts.length-1]; add('wreck',ex+14,ez+6,'wreck','An old fishing boat','The ribs of a fishing boat, bleached and split. Every plank has gone the colour of ash, and nothing grows in the sand around it, not even the sea grass. Farther out, the water is the same grey.',{rot:0.6}); }
  { const [x,z]=arenaGate(ARENA20,850,-300,6); add('demongate',x,z,'stone','The Demon Gate\'s stone','The gate\'s stone is smooth as glass and cold in the sun, with no chisel mark anywhere. Letters run across it, and Kaede\'s scroll gave you the key to them: "Where the ice meets the sky the frost flower grows, and the sleepers wake." Someone has scratched beneath it with a knife: "It was here before the village. It will be here after."',{rot:Math.atan2(x-ARENA20.x,z-ARENA20.z)}); }
  add('offerings',566,-150,'shrine','A roadside shrine','Folded paper prayers are tied to a little roadside shrine. "For a quiet sky to speak again." "For my father, grey since the spring." "For the foxes to be kind again."',{rot:0.8});
  add('icewall',PASS.x,PASS.ice+4.5,'ice','The ice wall','The pass north is shut by a wall of blue ice, taller than the tallest cedar. Deep inside it, dark shapes hang like flies in amber. Somewhere beyond lies the Hoarfrost Reach, and under its glaciers, the Frostbloom.',{rot:0,
    textOpen:'The ice wall is gone. Where it stood there is a slope of grey slush and broken blue blocks, and beyond it Frostgate Pass climbs north. The dark shapes it held lie in the meltwater: old timbers, coils of rope, one boot, and a smooth glass lantern that still glows faintly, with no flame in it.'});
  { const V=VIL3, e=V.ent, rx=4.6, rz=-0.6, px=V.x+Math.sin(e)*(VR+9), pz=V.z+Math.cos(e)*(VR+9);
    add('runes',px+rx*Math.cos(e)+rz*Math.sin(e)-Math.sin(e)*1.4,pz-rx*Math.sin(e)+rz*Math.cos(e)-Math.cos(e)*1.4,'runes','The rune stones at Rimehold\'s gate','Runes are cut into the standing stone, deep and even, in three rows. The lowest row is Rimehold\'s own script, and Old Sigrun\'s grandmother could read it: "Winter came after the burning sky. Under the ice the flower waits. Do not wake what fell." The upper rows are older, straight as ruled lines, and nobody can read those at all.',{rot:e}); }
  { const B=FROST_LAKES[0]; let best=null;
    for(let a=0;a<24&&!best;a++){ const x=B.x+Math.sin(a/24*TAU+2.2)*(B.r+8), z=B.z+Math.cos(a/24*TAU+2.2)*(B.r+8); if(zoneAt(x,z)===ZONES.find(zn=>zn.key==='h24')&&!nearRoad(x,z,6)&&rawHeight(x,z)>30) best=[x,z]; }
    if(best) add('hullplate',best[0],best[1],'hull','A grey plate in the ice','A slab of grey metal juts out of the glacier at a slant, smooth as glass and cold to the touch. It has not rusted or dented. Round-headed studs run across it in even rows, and half scoured away by the wind, a ring with a small sun inside is painted on it. The hunters call it a dragon\'s scale.',{rot:0.6}); }
  { const A=ARENA30, a0=Math.atan2(A.x-VIL3.x,A.z-VIL3.z);
    add('ironbird',A.x+Math.sin(a0)*(A.r+3.5),A.z+Math.cos(a0)*(A.r+3.5),'ironbird','The iron bird','Ahead, nose down in the glacier with one wing snapped, lies a body of grey metal as long as a longhouse, set with even rows of studs and a glass eye cracked black. On its tail fin is a painted ring with a small sun inside it. The hunters call it the dragon\'s skeleton. Warm air sighs from under a wing, and the snow around it never settles.',{rot:a0}); }
  return out;
})();
const LORE_BY_ID={}; LORE.forEach(L=>{ LORE_BY_ID[L.id]=L; });
const LORE_R=4.5;   // how close you must be to read one
function loreNear(x,z){ let best=null,bd=LORE_R; for(const L of LORE){ const d=Math.hypot(x-L.x,z-L.z); if(d<bd){ bd=d; best=L; } } return best; }
// trees and bushes keep clear of the story's spots (the heartleaf, the lore props, Odran's carts) so you can see and reach them
const STORY_SPOTS=[...HERBS.map(([x,z])=>[x,z,5]),...LORE.filter(L=>L.kind!=='ice').map(L=>[L.x,L.z,L.kind==='wreck'?7:5]),...VILS.map(V=>[V.cart.x,V.cart.z,5])];
function storyClear(x,z){ for(const [sx,sz,r] of STORY_SPOTS) if(Math.abs(x-sx)<r&&Math.abs(z-sz)<r&&Math.hypot(x-sx,z-sz)<r) return true; return false; }
