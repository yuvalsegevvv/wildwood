//@ The prologue's and Act I's scenes, deepened: more of every conversation (the village and its people, the Silent Years, the roots and the knacks, the witch's past, the north, the Warden), added around the lines of main-quest.js
/* Agent map. MQ_MORE[stepId] = {intro, offer, done: {pre:[lines], post:[lines]}, say: [{pre,post}, ... one per part that has a say]}: `pre` lines go in front of the step's own lines, `post` lines after them.
   mqApplyMore() runs once at load (below) and splices them into MQ's steps, so the structure, the tips, the parts and the saves stay main-quest.js's and only the scenes grow. A line is "Name: text" (the speakers are
   MQ_SPEAKER_NAMES in game/economy/main-quest.js), "(stage direction)" or plain text. A first line "@cine Title" makes the scene a still one: the screen is held, the controls are locked and a title card shows (story-voice.js, svCine).
   Spoiler rule (docs/STORY.md section 0): hints only, every one with an innocent reading; no one says continent, machine or the Concord. Test: tools/mainquest-smoke.js. */
const MQ_MORE={
  P1:{say:[{post:[
    "Tansy: And before you ask, no, I didn't bring bread. I brought something better. Which is a story about bread.",
    "Wren: She's been rehearsing it since sunrise. There's a part with a goat.",
    "Tansy: The goat is essential.",
    "(Behind them the village is waking. Smoke from every chimney, Greta's hammer starting up, a rooster arguing with the bell. Over the roofs the great tree at the forest's heart stands dark and quiet against a pale sky.)",
    "Wren: Do you ever think about it? The Heartwood. Everyone says the roots run under the whole village. Under the well, under our house.",
    "Tansy: Under my barley, if the elders are right. Which explains the barley.",
    "Wren: Mum used to say you could put your ear to the ground by the well on a still night and hear it breathing.",
    "(Wren says it lightly. Nobody says anything for a moment. Then Tansy bumps their shoulder with hers.)",
    "Tansy: She also said I'd be a great lady one day, and look at me. Mud to the knees and happy as a hen.",
    "Wren: You are a great lady. Of mud.",
    "Tansy: Of mud. Right. A crown, then. A proper one. Let's go and fetch it before I get sentimental and start crying into the well."]}]},
  P2:{say:[{post:[
    "Tansy: The Ribbon Row's just up there on the left, see? Every child in the village ties a ribbon on the first autumn.",
    "Tansy: Mine's red. It was yellow once. The sun took it.",
    "Tansy: The elders say a ribbon is how the roots learn your name. Old Bram says it's how the roots learn to put up with you.",
    "(Along the road the grass is thick and wet. A heron lifts out of the reeds and flaps off, complaining.)"]},
    {post:[
    "Tansy: There's a tale about this path. They say it's older than the village. Whoever cut it laid the stones so close you can't get a knife between them.",
    "Tansy: And you can only see it where the moss has worn off. Most people don't look down. That's their loss.",
    "(You look down. Under a skin of moss, a flat grey stone, fitted tight to the next, runs on toward the hedge.)"]},
    {post:[
    "Tansy: Smell that? Wet earth and something sweeter. That's the barley. It's early this year. Everything's early this year.",
    "Tansy: Funny. My gran said that when the wheat comes early, somebody's about to go away. She said it every year. It never meant anything. Someone always goes away."]}],
    done:{post:["Tansy: Right. I'm going to be calm and professional about this. Slimes are slimes."]}},
  P3:{intro:{post:["Tansy: Oh, and don't mind the noise they make. It's not a growl. It's a sort of wet cough. Like Ambrose in the mornings."]},
    done:{pre:["Tansy: Well. That's that. See? Nothing to it. You've got a good eye, pet. You'll go far, or at least as far as my barn."]}},
  P4:{intro:{post:["Tansy: My father built that barn with his own hands, in one summer, and told everyone it took him a year so they'd be impressed.","Tansy: When he died I thought, well, that's that. I'll sell it. Then I walked in and it smelled of hay and him, and I couldn't."]},
    say:[{post:["Tansy: I used to hide up here when I was small, and read. Don't tell anyone I can read. It'll ruin my reputation.","(Through the hatch you see the whole farm: the yard, the coop, the long rows of barley, and past the fence the road you came by, and, beyond it, the dark crest of the forest. Something about the light is wrong. The trees look further away than they should.)","Tansy: Come down when you're ready. Mind the fourth rung."]},
      {post:["Tansy: Go on, try the bow, try the wand. Nobody's watching but Old Hob, and he's seen worse."]}],
    done:{post:["(Behind you the weathervane on the barn swings round against the wind, once, and sticks, pointing north.)","Tansy: Funny. That's never stuck before."]}},
  P5:{intro:{post:["Tansy: Mind the caps. The fat ones with the grey underneath, they pop. And the thin ones, well, they don't pop, they just sulk."]},
    done:{post:["(Far across the roofs a bell begins to ring, not the hour bell, a quick, uneven peal. Someone is pulling the rope too hard.)","Tansy: That's the alarm bell. Nobody's rung that since the flood when I was six.","Tansy: Run. Run, pet. Run!"]}},
  P6:{say:[{pre:["@cine The grey reaches Wren"],post:[
    "Tansy: The doors are all shut. All of them. Why are the doors all shut?",
    "(Somewhere a door opens a crack. A face peers out, a neighbour you have known all your life. It looks at you, then at the bed, and closes again.)",
    "Tansy: ...They're frightened. Of course they are. I would be.",
    "(Wren's breathing is shallow and even. Under the skin of their arm the grey lines move, slowly, like roots finding their way through soil.)",
    "Tansy: Don't look at it. Look at their face. Their face is the same.",
    "(You take Wren's hand. It is as cold as stone.)"]}],
    done:{post:["(The village bell stops. In the silence you can hear the whole forest holding its breath.)","Tansy: Come on. Come on, then. Linnea first, then Dunstan. Whoever we have to ask."]}},
  W1:{say:[{post:["Linnea: And take this. It's willow bark, dried. It won't cure anything. It will make Wren comfortable, and it will make me feel less useless.","Linnea: I used to know someone who could have helped. We... don't speak. It's a very old quarrel. I'll tell you about it one day."]},
    {post:["Dunstan: I've drummed that same slow beat in every village between here and the sea. Every one of them asked me where I learned it. I never had an answer.","Dunstan: I think I learned it from the forest. I think it learned it from something older."]}],
    done:{post:["(Dunstan strikes the drum one last time and lets the sound fade. Down the lane, someone starts singing, low and tuneless, the way people do when they are afraid.)"]}},
  W2:{say:[{post:[
    "Morrow: Come in. Wipe your boots. No, not there, that's the mandrake. Not there either.",
    "(Inside the hut it is warm and dim and crowded. Bunches of herbs hang from the beams, jars of strange things line the shelves, and in the middle of the floor a black kettle simmers, though there is no fire under it.)",
    "Morrow: I won't tell you what I know. I'll tell you what I'll need.",
    "Tansy: A needle in a haystack. Is that what you're going to say? Because I've got a haystack and I'm prepared to use it.",
    "Morrow: (a short dry laugh, almost a cough) Sit down, farmer. You'll do. For now."]}],
    done:{post:["(Morrow pulls a stool out with her foot and does not look at any of you.)","Morrow: Three small things. Don't think they are nothing."]}},
  W2b:{offer:{pre:["Morrow: I don't help strangers for free. Not because I'm cruel. Because help without a price is a favour, and a favour is a debt the other way round."]},
    done:{post:["Morrow: Don't dawdle over the other two. The grey doesn't."]}},
  W6a:{offer:{post:["Hollen: Go gently with the sunpetal. It grows where the ground is least certain of itself.","Hollen: The old healers said the roots feed on whatever the sky forgets. Sunpetal drinks the sun, that's all. It holds what the sun lets go."]},
    done:{post:["Hollen: Gathering is not stealing, you see. The woods give if they're asked. Remember to leave a little for the next."]}},
  W7b:{offer:{post:["Ambrose: Marsh herbs, mint, willow, sunpetal. The whole art is patience, and a good nose. And not forgetting the kettle.","Linnea: He forgot the kettle once. We still talk about it."]},
    done:{post:["Ambrose: You've the hands for it. A good brew is half knack, half stubbornness.","(Linnea wraps a second flask in a cloth and sets it on your pack.)","Linnea: Keep that for yourself. In the north you'll want it more than she will."]}},
  W6:{offer:{post:["Maren: Take a notice and do a good job. The village talks, and what it says about you is what the board will give you."]},
    done:{post:["Maren: Well done. Careful, mind: the board is a ladder, and every rung is a little further from home.","Maren: But a stronger hiker is a safer hiker. And I've a feeling you'll need to be."]}},
  W2c:{say:[{pre:["@cine The grey at the hut","(At the hut's door a thin line of smoke rises from the chimney. Inside the kettle is bubbling with no fire beneath it.)","(Morrow takes the flask you made. She sniffs it, sips, and her face does something complicated.)","Morrow: Bitter. Strong. A little too much willow. ...It'll do."],post:[
    "Morrow: Listen to me. The grey doesn't come from outside. It comes through the roots, from deep under the forest. Something has opened a door.",
    "Tansy: The Circle. You said the Circle.",
    "Morrow: I said I hoped I was wrong. I'm rarely that lucky.",
    "Morrow: Torgeir will walk with you. He's good with a shield, and he doesn't ask questions. And you'll need both."]}]},
  W7:{say:[{post:[
    "Torgeir: (to you, quietly) You don't have to like it. I don't. But the road's easier with someone who's walked it.",
    "Torgeir: I won't say much on the way. If I speak, listen. If I stop, stop.",
    "(He shoulders his shield. It is old and dented and has seen a great deal.)",
    "Tansy: I'll walk with you to the bridge, then it's back to Wren for me. Someone has to sit by that bed. Don't argue."]}]},
  W8:{offer:{post:["Odran: I've a cart full of things that fell off other carts. You'd be amazed what the road brings."]},
    done:{post:["Odran: Lovely. Truly lovely. The things people carry and don't understand. That's my favourite part of the trade.","Odran: A lamp, you say? A lantern, perhaps, that burns without a flame? No, no. I'm only thinking aloud. Forget I spoke."]}},
  W9:{say:[{post:["Pell: One more thing. The fish have gone quiet. A fisherman knows when the water stops talking. It's been a week.","Pell: I'm only a fisherman. But something's wrong with the river. It runs the wrong way at night."]}],
    done:{post:["Torgeir: Come. The Hollow's close. There's something there I want you to see."]}},
  W9a:{say:[{post:[
    "Pip: The trees talk. They talk to me. They don't say words. They say... they say how they feel.",
    "Torgeir: And how do they feel?",
    "Pip: Sad. And tired. And the big one in the middle, the one that hums, it's the saddest of all.",
    "(He picks a fern frond and it uncurls, green and living, between his fingers.)",
    "Pip: I'm not supposed to be here. The village sent me away. They said I made things grow grey.",
    "Pip: I don't. I make them come back. But that's worse, isn't it?",
    "Torgeir: (low) It's neither. It's a gift. It's just a frightening one."]}],
    done:{post:["(You leave a heel of bread beside him. He does not touch it until you have gone, and then he takes it in both hands.)"]}},
  W9b:{say:[{post:["(The kettle sings a rising note. The room smells of cut grass and rain.)","Morrow: Every cure is a bargain. The grey borrows from the body. The cure pays it back, a little at a time, with interest.","Morrow: I had a teacher once who said that medicine is simply the art of arguing with death. She was right. She lost, in the end. They all do.","Morrow: And don't hold back on the stump. It's only a stump. But what you feel when it breaks, that's the real thing. Remember it."]}],
    done:{post:["Morrow: Go home. Wren is waiting. And you've a long road after."]}},
  W9c:{say:[{post:[
    "(You kneel by the bed. Wren's fingers close round yours.)",
    "Wren: I had a dream. The whole forest was singing. It was lovely and it was awful. I couldn't tell which.",
    "Wren: There was a tree, a huge one, and a voice in it saying, over and over, “Not yet. Not yet.”",
    "Tansy: Hush, love. Rest. You're home.",
    "Wren: It wasn't scared, you know. It was only tired. Like Mum was, at the end.",
    "(Nobody speaks. Morrow looks away, out of the window, at the dark line of the north.)"]}]},
  W9d:{offer:{post:["Morrow: Tansy's field is the nearest place the grey has touched. It's a good test. Small enemies, near people who need protecting.","Morrow: And she'll hate it. That's good. Hate keeps you sharp."]},
    done:{post:["Tansy: Pull the small ones before they seed, you said. Funny. That's good advice for most things.","Morrow: It is. It's also the thing I never learned."]}},
  W10:{offer:{post:["Aldric: I fought, once. A long time ago. I'd rather not say where.","Aldric: What I learned is that a knack isn't a weapon. It's a conversation. You ask, and the roots answer."]}},
  W12:{offer:{post:["Torgeir: I won't tell you not to be afraid. I'll tell you to be afraid and move anyway. That's all courage is."]},
    done:{post:["Torgeir: Drink something. Sit. Nobody's watching, and nobody's counting."]}},
  W11:{offer:{post:["Greta: I'm the second smith in this village. My mother was the first. Her mother, before her, was something older. Nobody wrote it down."]}},
  W11b:{offer:{post:["Tomas: The ridge was a quarry once, or a mine. The old people never agreed. Nobody mines it now but me and the badgers."]}},
  W13:{offer:{post:["Dunstan: I'm no fighter. But I can count. And everything that wants to kill you has a rhythm. Learn the rhythm and you've learned half the fight."]},
    say:[{post:["Dunstan: Again. And one, and two, and step. Good. You're the first to get it on the second try. Tansy needed an hour."]}]},
  W14:{offer:{post:["Dunstan: A ribbon on a post, it's only a ribbon. A ribbon on a post at the Circle, with a village behind it, that's a promise."]},
    done:{post:["Dunstan: (quietly) Goblins don't wear ribbons. Goblins don't even know what they are. Somebody gave it to them. Somebody taught them.","Torgeir: Or something taught somebody to teach them."]}},
  W15:{offer:{post:["Morrow: It's said a Warden is chosen, not made. The village forgot. The forest didn't."]},
    say:[{pre:["@cine The boy in Deathcap Dell"],post:["Morrow: I put the first flowers on this grave myself. The next winter I left, and nobody came.","Morrow: People forget the dead faster than they forget the wrong done to them. That's not cruelty. It's only how people are.","(The wind moves through the dell. The silverleaf trembles on the stone, and holds.)"]}],
    done:{post:["Morrow: Thank you. I didn't think anyone would."]}},
  W16:{say:[{post:["Pip: It doesn't mean to. It's like a bell that can't stop ringing. It wants to stop, and it doesn't know how."]}]},
  W16a:{say:[{post:["Pell: It's easy to be brave at the edge of the water. It's the middle that's hard. I only ever go as far as I can swim home."]}]},
  W16b:{say:[{post:["Dunstan: If we break at the first spike, we break. So we don't break. We practise until we don't.","Torgeir: And if it goes wrong, we run. Together."]}]},
  W17:{say:[{pre:["@cine The Warden wakes"],post:[
    "(Overhead the sky goes the colour of old pewter. The air tastes of iron and rain. Around the Circle the stones stand like a ring of old teeth, and in the middle the Warden turns its great slow head toward you.)",
    "Torgeir: Shields up. Whatever happens, we do it together.",
    "Tansy: (a little too loud) I'm not afraid. I'd like that on the record.",
    "Pip: It knows you. It knows all of you. It's only forgotten how to say so.",
    "Morrow: Now. Before it sings again."]}]}
};
/* The second pass: the thin steps (a board notice, a lesson, a forge, a rhythm) given the village's history, its customs and the hints of what lies beyond, in the same shape and applied after MQ_MORE (so its lines come last). */
const MQ_MORE_B={
  P3:{intro:{post:[
    "Tansy: Everyone in the village learns on slimes. My father taught me on one. Mine was called Gerald. Don't ask.",
    "Tansy: They're not clever, they're not cruel. They're the forest's way of tidying up. Whatever falls, they eat.",
    "Tansy: The elders say a knack is a thing you're born with, like a nose. Mine's for finding lost goats. Not much use against a slime, but it's a start."]},
    done:{post:[
    "Tansy: Right. Nobody mentions the colour to Wren. They're worried enough about the barley as it is.",
    "(You look back at the path. Where the slimes fell the grass is not green. It is the grey of a dead coal, and it is spreading by the width of a thumb as you watch.)"]}},
  P5:{done:{post:[
    "Tansy: You've gone quiet. That's the thing about the first hard day. Everything's the same as it was and nothing is.",
    "Tansy: When Dad died I ate a whole loaf standing at the window, just for something to do with my hands. Go and look at Wren. That's all. Look at them."]}},
  W6:{offer:{post:[
    "Maren: I keep the board because someone has to. It's the oldest thing in the village after the well. The posts are older than I am, and I'm older than most.",
    "Maren: Hunts for the sprouts. Bounties for the tuskers. Scouting for places no one's gone in a while. Every notice is somebody's worry written small.",
    "Maren: The first board hung in the Moot Hall before the Silent Years. After them it was nailed to the well, and no one would say why it had to move."]},
    done:{post:[
    "Maren: You see how it is. A village isn't walls. It's a long list of small favours that never quite run out.",
    "Maren: Come back whenever you're stuck. The board never turns anyone away. It's got a poor memory for faces, that's all."]}},
  W7:{say:[{post:[
    "Torgeir: (looking up the road) North of Pell's crossing it gets quieter. That's not the same as safer.",
    "Torgeir: I've walked it twice. Once going. Once coming back.",
    "Tansy: He doesn't mean the second one was worse.",
    "Torgeir: I mean the second one was worse."]}]},
  W8:{offer:{post:[
    "Odran: I've been to every village on this side of the mountains, and a few on the other. Hanami has the loveliest lanterns. Rimehold the worst coffee. And your well, my friends, is the oldest I have seen.",
    "Odran: The things people throw away tell you more than the things they keep. Show me a village's midden and I'll tell you its history.",
    "Tansy: (to you, low) He's lovely. He makes me nervous.",
    "Odran: I heard that. It's quite all right. A little nerves are good for trade."]}},
  W9:{say:[{post:[
    "Pell: You'll see the old posts along the bank. Square-cut stone, once, with a ring cut in the top. Half have fallen in the river.",
    "Pell: My grandfather swore they marked the edge of something. A road, a field, a country. He said when the posts were standing, a hiker could walk from the Heartwood to the sea without a coin in their pocket.",
    "Pell: I don't know what a country is. I know fish. Fish don't need posts."]}]},
  W10:{offer:{post:[
    "Aldric: A knack has a rhythm. The roots hum, you hum back. The first time you do it right, your hair lifts. Don't be alarmed. Everyone's does.",
    "Aldric: A trainer's all I am. A trainer doesn't make the song, only teaches it to be sung."]},
    done:{post:[
    "Aldric: The old stories say there were once many more knacks than three. Cleaving, calling, mending, binding. Every master had a different set. Then something happened, and what's left is what we kept.",
    "Aldric: I tell the children it was a good clean-out. I don't tell them I don't believe it."]}},
  W11:{offer:{post:[
    "Greta: Smithing isn't strength. Anyone can swing a hammer. It's patience. You can hurry iron, but it will remember."]},
    done:{post:[
    "Greta: Put it on. Move your arm. Feel the heft shift? That's balance. You can't buy balance. You can only fold it in.",
    "Greta: My mother's anvil is still in the back. I've never moved it. It faces east, which is wrong for a forge. She would never say why.",
    "Torgeir: (quietly) Some things are built to face a door that's no longer there."]}},
  W11b:{offer:{post:[
    "Tomas: Mind the ground in the old cut. There are places where the floor is smooth as a plate, and no one in the village ever poured it. Don't tell Greta I said so. She'll want to put an anvil on it.",
    "Tomas: Copper's soft but honest. Iron has opinions. Whatever's under the ridge deeper than that, I've never been brave enough to touch."]},
    say:[{post:[
    "(The seam runs back into the hill in a straight line. Nothing in nature runs that straight.)",
    "Tansy: There's a pattern in the floor. Look. A ring, and a line through it.",
    "Tomas's voice, remembered: \"The old people called that a sun. Seems a funny thing to carve where there isn't any.\""]}]},
  W12:{done:{post:[
    "Torgeir: Here. Take the sidestep, not the roll. The roll costs you your feet. The step costs you nothing.",
    "Torgeir: Remember it. The next time something is coming, don't ask whether you can stop it. Ask where it won't be, and stand there."]}},
  W13:{offer:{post:[
    "Dunstan: Every village drummer learns a march. Mine was handed down. The man who taught me said it came from before the Silent Years, when armies walked the road. I thought he was joking. Now I think he wasn't.",
    "Dunstan: It's only four beats. But it never goes wrong. Whenever the roots are quiet and I drum it, they answer. Faintly. Like a sleeper turning over."]},
    say:[{post:[
    "Dunstan: Hear it? That's the tail. The slam comes on the fourth beat of the fourth bar. It always does.",
    "Tansy: Why would a Warden keep a march?",
    "Dunstan: Because it was taught one. I'd say the same hand that taught me taught it. A long time ago."]}]},
  W14:{offer:{post:[
    "Tansy: Mum used to say a village is like a ribbon rope. Each thread is thin. You can snap any one with a finger. But twist enough together and a bull can't break it.",
    "Torgeir: That's all a company is, too. Just a lot of threads that decided not to be thin."]},
    done:{post:[
    "Tansy: I was ten when I tied mine. I asked the roots for a husband, a goat and a bigger barn. I got the goat.",
    "Dunstan: The ribbon in the goblin's hoard. It's yellow, like the ones from the first autumn. Someone gave it up.",
    "Torgeir: Or had it taken."]}},
  W16:{say:[{post:[
    "Pip: Wren taught me to whistle with a blade of grass. It only works if you hold it just right. Wren says the grass has to like you.",
    "Pip: Everyone thinks it's a monster. I think it's very old and very sad and nobody's said anything nice to it in a long time.",
    "(A breeze moves through the hollow. Every blade of grass leans the same way, toward the north-east, and holds.)"]}]},
  W16a:{say:[{post:[
    "Pell: Three totems. Old wood, older than the village. I've seen them in the mud at low water. Black, with a sun cut into the top. They don't rot.",
    "Pell: I'm not saying anything. I'm only saying a thing that doesn't rot ought to make you ask who's been looking after it.",
    "(Far out in the bog a single light moves, slowly, and goes out.)"]}]}
};

function mqApplyMore(){
  const add=(arr,o)=>{ if(!o) return arr||[]; arr=arr||[]; const pre=Array.isArray(o)?[]:o.pre||[], post=Array.isArray(o)?o:o.post||[]; return pre.concat(arr,post); };
  for(const step of MQ) for(const MM of [MQ_MORE,MQ_MORE_B]){
    const M=MM[step.id]; if(!M) continue;
    for(const k of ['intro','offer','done']) if(M[k]) step[k]=add(step[k],M[k]);
    if(M.say){ let i=0; for(const part of step.parts||[]){ if(!part.say) continue; const m=M.say[i++]; if(m&&(m.pre||m.post)) part.say=add(part.say,m); } }
  }
}
mqApplyMore();
