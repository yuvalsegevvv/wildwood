//@ VILLAGERS (hard-coded NPCs of both villages), random villagers, NPC behaviour (updateNPCs)
/* ===================== VILLAGERS =====================
   Hard-coded characters go in this list. Each entry can set:
     id        unique key (use it later to find a character: npcById('maren'))
     name      shown when you talk to them
     title     shown above their head with their name (their profession)
     role      'weaponsmith' / 'armorer' open a shop, 'quests' opens that villager's quest list, 'forge' opens the merge forge, 'trainer' opens the skills panel with lessons to buy,
               'soul' opens the soul shrine where you bind your element (null = just chat)
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
     vil       2 = lives in Hanami, the Sakura Vale's village (same anchors, on that village's plan)
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
    lines:['A strong body is nothing without a practised hand. I teach the same arts Aldric does, and I charge the same.','The fox of the shrine has nine tails and nine tricks. Learn yours before you face her.','Breathe. Strike. Breathe again.'] },
  { id:'daisuke', vil:2, title:'Guard', name:'Daisuke', role:null,
    look:{sex:'male',build:1.1,face:'angular',hair:'short',hairColor:0x1d1714,facial:'none',skin:0xdcb48e,top:'jacket',topColor:0x6a2a26,bottom:'trousers',bottomColor:0x2a2830,hat:'kasa',hatColor:0xc8a868},
    behavior:{type:'patrol',route:['gate','lamp:2','lamp:3','lamp:4','lamp:5','lamp:6','lamp:1','gate'],pause:3}, home:'house:7', schedule:'always', speed:1.2, voice:{rate:1.0,pitch:0.9},
    lines:['Kappa near the ponds, kodama in the old woods. Farther east the oni come down from the crags.','The Demon Gate is in the far north-east corner. Akaoni guards it. Nobody guards us from Akaoni.','You came through the tunnel? Then the Rootwarden is dead. Good riddance.'] },
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
  { id:'linnea', late:true, title:'Healer', icon:'healer', name:'Healer Linnea', role:null,
    look:{sex:'female',height:0.97,build:0.9,face:'oval',hair:'long',hairColor:0x8a6a4a,chest:1.0,top:'jacket',topColor:0x5a7a4a,bottom:'skirt',bottomColor:0x4a3a2a,hat:'none',pack:false,shoes:'boots',shoeColor:0x3a2a1e,facial:'none'},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.9,pitch:1.05},
    lines:['Heartleaf for fever, willow bark for pain, and rest for everything else.','Wren is no worse today. I will take that.','If you find anything strange out there, bring it to me. Strange is what I need.'] },
  // Odran the peddler (a watcher: docs/STORY.md; never say so): his cart by the gate from W8, by Hanami's gate from V8
  { id:'odran', late:true, title:'Peddler', icon:'peddler', name:'Odran', role:'peddler', show:()=>odranHere(1),
    look:{sex:'male',height:1.02,build:1.05,face:'oval',hair:'short',hairColor:0x3a2a20,facial:'stubble',top:'jacket',topColor:0x5a4a6a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x3a3230,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'cart'}, home:'house:4', schedule:'always', voice:{rate:1.1,pitch:0.95},
    lines:['Useful things and useless ones! Mostly useless, but those sell best.','Buttons, buckles, a spoon with a hole in it. Something for everyone.','I go where the roads go. The roads here go to interesting places.'] },
  { id:'odran2', vil:2, late:true, title:'Peddler', icon:'peddler', name:'Odran', role:'peddler', show:()=>odranHere(2),
    look:{sex:'male',height:1.02,build:1.05,face:'oval',hair:'short',hairColor:0x3a2a20,facial:'stubble',top:'jacket',topColor:0x5a4a6a,bottom:'trousers',bottomColor:0x2b2b2e,hat:'ranger',hatColor:0x3a3230,pack:true,shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'cart'}, home:'house:4', schedule:'always', voice:{rate:1.1,pitch:0.95},
    lines:['Cherry blossoms all year round. Somebody here is very good at gardening.','The tunnel was dark, but I have a good lamp. A very good lamp.','Buy something, sell something. The roads do not pay for themselves.'] },
  // the soul shrine: bind your soul to an element from level 15 (panel: economy/soul.js). late: spawned after everyone else, see above
  { id:'kaede', vil:2, late:true, title:'Soul shrine', name:'Shrine Maiden Kaede', role:'soul',
    look:{sex:'female',height:0.97,face:'oval',hair:'long',hairColor:0x1d1714,chest:0.95,skin:0xeac8a6,top:'jacket',topColor:0xe8e4dc,bottom:'skirt',bottomColor:0xb03a3a,hat:'none',shoes:'boots',shoeColor:0x2a1e14},
    behavior:{type:'stationary',at:'garden'}, home:'house:8', schedule:'always', voice:{rate:0.85,pitch:1.15},
    lines:['The three stones in the gravel are older than the village. Fire, water, earth, air, and the twins dark and light: every soul leans toward one.','Come to me at level 15 and I will bind your soul to an element. Your skills of that element grow stronger, and the skills of its opposite grow weaker.','Fire and water, earth and air, dark and light: each has exactly one opposite. Bind yourself as you please, and change your mind as often as you like.','Monsters have elements too, and they follow the wheel: water douses fire, fire burns air, air wears down earth, and earth drinks water, while light and dark break each other. Strike a monster with the element that beats its own and it will feel it. Strike it with its own and it will only shrug.'] }
];
const FILLER_COUNT=LITE?3:(LOW?4:8);
const NAMES_M=['Anders','Henrik','Lukas','Emil','Jonas','Felix','Mattis','Arvid','Elias','Nils','Viggo','Karl'];
const NAMES_F=['Freya','Ingrid','Liv','Astrid','Sigrid','Elin','Hanna','Greta','Noor','Saga','Tove','Alma'];
const NAMES_M2=['Hiroshi','Takumi','Sora','Ren','Haruto','Kaito','Yuto','Daiki','Shun','Riku'];
const NAMES_F2=['Yui','Aoi','Hina','Sakura','Mei','Rin','Emi','Nanami','Koharu','Akari'];
const SMALLTALK2=['The cherry trees never stop blooming here. Nobody remembers why.','Mind the ponds. Kappa like to pull travellers in by the ankles.','Tetsuo and Kenji argue about steel every evening at the brazier.','The bamboo sings when the wind comes off the mountains.','My brother saw foxfire above the shrine again last night.','Sweep the petals in the morning, and by noon there are more.','Daisuke walks that circle so often the stones know his feet.','They say the tunnel was sealed by the Rootwarden itself. Strange that you got through.'];
const SMALLTALK=['Lovely day for a walk in the woods.','The deer come right up to the garden at dawn.','Mind the river, the current is quicker than it looks.','Have you tried the apples at the market?','My grandmother planted half the birches around here.','Foxes got into the hen house again last week.','When the fireflies come out, you know summer is here.','The old path still leads down to the lake, if you know where to look.','The tavern gets loud after sunset. Oskar tells the same stories every night.','Bram thinks he is guarding us from wolves. There are no wolves.'];

const NPCs=[];
let talkNPC=null, nearNPC=null;
function npcById(id){ return NPCs.find(n=>n.def.id===id); }
const vilOf=n=>n.def.vil===2?VIL2:VIL;
function anchorOf(name,V){ V=V||VIL; return V.anchors[name]||V.anchors.plaza0; }
function randomPOI(n){ const V=vilOf(n); let p; for(let i=0;i<6;i++){ p=V.pois[Math.floor(Math.random()*V.pois.length)]; if(Math.hypot(p.x-n.x,p.z-n.z)>3) break; } return {x:p.x+AR(-0.6,0.6),z:p.z+AR(-0.6,0.6),face:p.face}; }
function spawnNPC(def,rng){
  const look=randomLook(rng||Math.random,{villager:true,base:def.look});
  if(def.kin){ look.sex=LOOK.sex; look.hairColor=LOOK.hairColor; look.skin=new THREE.Color(LOOK.skin||0xe0b894).lerp(new THREE.Color(0x9a9a98),0.35).getHex(); }   // your family, greyed by the sickness
  const rig=buildCharacter(look), s=look.height*(look.sex==='female'?0.95:1);
  rig.root.scale.setScalar(s);
  const g=new THREE.Group(); g.add(rig.root); scene.add(g);
  const B=def.behavior||{type:'wander'}; def.behavior=B;
  const V=def.vil===2?VIL2:VIL;
  const start=B.at?anchorOf(B.at,V):(B.route?anchorOf(B.route[0],V):randomPOI({def,x:V.x+99,z:V.z}));
  const n={def,V,look,rig,g,scale:s,x:start.x,z:start.z,y:V.h,face:start.face||0,faceGoal:start.face,vx:0,vz:0,walk:0,state:'idle',timer:AR(0.5,4),
    route:[],inside:false,headYaw:0,line:0,pi:0,stuckT:0,sx:start.x,sz:start.z,partner:null,seed:Math.random()*10};
  NPCs.push(n); return n;
}
function initNPCs(){
  const rng=mulberry32(9001);
  const defs=VILLAGERS.filter(v=>!LITE||v.role);   // light mode keeps everyone with a job
  const used=new Set();
  for(const vil of [1,2]) for(let i=0;i<FILLER_COUNT;i++){
    const sex=rng()<0.5?'male':'female', pool=vil===2?(sex==='male'?NAMES_M2:NAMES_F2):(sex==='male'?NAMES_M:NAMES_F), talk=vil===2?SMALLTALK2:SMALLTALK;
    let name; do{ name=pool[Math.floor(rng()*pool.length)]; }while(used.has(name)); used.add(name);
    const lines=[]; for(let k=0;k<3;k++) lines.push(talk[Math.floor(rng()*talk.length)]);
    // Hanami's people: darker hair, sometimes a straw kasa
    const look=vil===2?{sex,hairColor:rng()<0.8?0x1d1714:0x3a2418,hat:rng()<0.3?'kasa':'none',hatColor:0xc8a868}:{sex};
    defs.push({id:'villager'+(vil===2?'h':'')+i,vil,name,role:null,look,behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
  }
  defs.filter(d=>!d.late).forEach(d=>spawnNPC(d,rng));
  defs.filter(d=>d.late).forEach(d=>spawnNPC(d,mulberry32(9002)));
}
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
      poseRig(n.rig,dt,{sp,ph:n.walk,sit,sitH:0.55/n.scale,talk:speaking&&!lie,headYaw:lie?0:n.headYaw,seed:n.seed});
      if(bed){   // lying on the mattress (feet at the anchor, head at the headboard), or sitting on its front edge facing the plaza
        const a=VIL.bed.rot; n.g.rotation.order='YXZ'; n.g.rotation.x=lie?Math.PI/2:0; n.g.rotation.y=lie?a+Math.PI/2:a;
        if(lie) n.g.position.y=n.y+0.74; else n.g.position.set(n.x+Math.cos(a)*0.55-Math.sin(a)*0.3,n.y,n.z-Math.sin(a)*0.55-Math.cos(a)*0.3);
      }
    }
    if(dp<nd && dp<(n.def.role||n.def.kin?3.8:2.8)){ nd=dp; nearNPC=n; }
  }
  updateTalkUI();
}

