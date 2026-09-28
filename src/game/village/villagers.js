//@ VILLAGERS (hard-coded NPCs), random villagers, NPC behaviour (updateNPCs)
/* ===================== VILLAGERS =====================
   Hard-coded characters go in this list. Each entry can set:
     id        unique key (use it later to find a character: npcById('maren'))
     name      shown when you talk to them
     title     shown above their head with their name (their profession)
     role      'weaponsmith' / 'armorer' open a shop, 'quests' opens that villager's quest list, 'forge' opens the merge forge, 'trainer' opens the skills panel with lessons to buy (null = just chat)
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
    lines:['Sit a while. The fire does not mind company.','When I was young, the forest came right up to the well.','Have you seen the fireflies by the river at night? Worth the walk.'] }
];
const FILLER_COUNT=LITE?3:(LOW?4:8);
const NAMES_M=['Anders','Henrik','Lukas','Emil','Jonas','Felix','Mattis','Arvid','Elias','Nils','Viggo','Karl'];
const NAMES_F=['Freya','Ingrid','Liv','Astrid','Sigrid','Elin','Hanna','Greta','Noor','Saga','Tove','Alma'];
const SMALLTALK=['Lovely day for a walk in the woods.','The deer come right up to the garden at dawn.','Mind the river, the current is quicker than it looks.','Have you tried the apples at the market?','My grandmother planted half the birches around here.','Foxes got into the hen house again last week.','When the fireflies come out, you know summer is here.','The old path still leads down to the lake, if you know where to look.','The tavern gets loud after sunset. Oskar tells the same stories every night.','Bram thinks he is guarding us from wolves. There are no wolves.'];

const NPCs=[];
let talkNPC=null, nearNPC=null;
function npcById(id){ return NPCs.find(n=>n.def.id===id); }
function makeLook(rng,base){
  const rp=a=>a[Math.floor(rng()*a.length)], sex=(base&&base.sex)||(rng()<0.5?'male':'female'), f=sex==='female';
  const L={sex,height:+(0.92+rng()*0.14).toFixed(2),build:+(0.88+rng()*0.3).toFixed(2),skin:rp(SKINS),face:rp(['round','oval','angular']),eyes:rp(EYEC),
    facial:f?'none':rp(['none','stubble','stubble','mustache','beard']),
    hair:f?rp(['long','ponytail','bun','bob','curly','short']):rp(['short','buzz','curly','bald','short']),
    hairColor:rp(HAIRC.slice(0,HAIRC_NATURAL)),top:rp(['tshirt','flannel','jacket','hoodie']),topColor:rp(CLOTH),
    bottom:f?rp(['trousers','skirt','skirt']):'trousers',bottomColor:rp(CLOTH),shoes:rp(['boots','boots','sneakers']),shoeColor:rp(SHOEC),
    hat:rp(['none','none','none','beanie','cap']),hatColor:rp(HATC),pack:false,
    chest:f?+(0.7+rng()*0.65).toFixed(2):1};   // women vary 0.7-1.35 (the model allows 0.5-1.6)
  return Object.assign(L,base||{});
}
function anchorOf(name){ return VIL.anchors[name]||VIL.anchors.plaza0; }
function randomPOI(n){ let p; for(let i=0;i<6;i++){ p=VIL.pois[Math.floor(Math.random()*VIL.pois.length)]; if(Math.hypot(p.x-n.x,p.z-n.z)>3) break; } return {x:p.x+AR(-0.6,0.6),z:p.z+AR(-0.6,0.6),face:p.face}; }
function spawnNPC(def,rng){
  const look=makeLook(rng||Math.random,def.look);
  const rig=buildCharacter(look), s=look.height*(look.sex==='female'?0.95:1);
  rig.root.scale.setScalar(s);
  const g=new THREE.Group(); g.add(rig.root); scene.add(g);
  const B=def.behavior||{type:'wander'}; def.behavior=B;
  const start=B.at?anchorOf(B.at):(B.route?anchorOf(B.route[0]):randomPOI({x:VIL.x+99,z:VIL.z}));
  const n={def,look,rig,g,scale:s,x:start.x,z:start.z,y:VIL.h,face:start.face||0,faceGoal:start.face,vx:0,vz:0,walk:0,state:'idle',timer:AR(0.5,4),
    route:[],inside:false,headYaw:0,line:0,pi:0,stuckT:0,sx:start.x,sz:start.z,partner:null,seed:Math.random()*10};
  NPCs.push(n); return n;
}
function initNPCs(){
  const rng=mulberry32(9001);
  const defs=VILLAGERS.filter(v=>!LITE||v.role);   // light mode keeps everyone with a job
  const used=new Set();
  for(let i=0;i<FILLER_COUNT;i++){
    const sex=rng()<0.5?'male':'female', pool=sex==='male'?NAMES_M:NAMES_F;
    let name; do{ name=pool[Math.floor(rng()*pool.length)]; }while(used.has(name)); used.add(name);
    const lines=[]; for(let k=0;k<3;k++) lines.push(SMALLTALK[Math.floor(rng()*SMALLTALK.length)]);
    defs.push({id:'villager'+i,name,role:null,look:{sex},behavior:{type:'wander'},home:'house:'+(i%9),schedule:'day',lines:[...new Set(lines)]});
  }
  defs.forEach(d=>spawnNPC(d,rng));
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
    const B=n.def.behavior, D=n.def;
    const dxp=P.x-n.x, dzp=P.z-n.z, dp=Math.hypot(dxp,dzp);
    const wantHome=D.schedule!=='always' && night>0.6;
    if(wantHome && !n.inside && n.state!=='home'){ if(talkNPC===n) endTalk(); if(n.partner){ n.partner.state='idle'; n.partner.partner=null; n.partner=null; } routeTo(n,anchorOf(D.home||'house:0'),'home'); }
    if(!wantHome && n.inside){ const h=anchorOf(D.home||'house:0'); n.inside=false; n.x=h.x; n.z=h.z; n.face=h.face; n.state='idle'; n.timer=AR(0,3); n.route=[]; }
    if(n.inside){ n.g.visible=false; continue; }
    const talking=talkNPC===n;
    if(talking && dp>4.5) endTalk();
    if(!talking && n.state!=='home'){
      if(B.type==='stationary'){
        const A=anchorOf(B.at);
        if(n.state!=='walk' && Math.hypot(A.x-n.x,A.z-n.z)>0.6) routeTo(n,A);
        else if(n.state!=='walk'){ n.state='idle'; n.faceGoal=A.face!==undefined?A.face:Math.atan2(-(VIL.x-n.x),-(VIL.z-n.z)); }
      } else if(B.type==='patrol'){
        if(n.state==='idle'){ n.timer-=dt; if(n.timer<=0){ n.pi=(n.pi+1)%B.route.length; routeTo(n,anchorOf(B.route[n.pi])); } }
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
      const sit=B.pose==='sit' && n.state==='idle' && !moving && !talking;
      poseRig(n.rig,dt,{sp,ph:n.walk,sit,sitH:0.5/n.scale,talk:speaking,headYaw:n.headYaw,seed:n.seed});
    }
    if(dp<nd && dp<(n.def.role?3.8:2.8)){ nd=dp; nearNPC=n; }
  }
  updateTalkUI();
}

