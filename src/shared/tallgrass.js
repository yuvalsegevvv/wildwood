//@ Tallgrass, Amber Reach's village (VIL7): the Kin's moot town round the Moot Baobab, on the savanna hub of the atlas (SAV_HUB); its teleport circle (gear.tall) and the reed landing on the water; joins VILS and CIRCLES. Pure.
/* Tallgrass follows the home village's plan like Wraithwick (layoutVillage: the same houses, stalls, anchors and colliders, so every NPC role works the same) at SAV_HUB (shared/savanna.js, zone a38).
   The road comes in from the Ashbed Gate (SAV_GATE) in the north. Opening the gate (gear.amber 1, the Sand Wyrm's fall) lets you in; walking into Tallgrass sets gear.tall 2 and wakes its circle
   (CIRCLES, used by the server's warpP and the client's travel window). The Moot Baobab stands where the home village's well would be: TG_BAOBAB (x, z, r) is the tree's trunk, a collider the model
   (game/village/buildings-savanna.js, buildTallgrass) draws and the people walk round. TG_LANDING is the reed landing: a short plank jetty on the nearest open water (the delta or one of the
   Seven Pools within 120 m), or null when there is none; Mudge the ferryman stands at its foot. Used by: village-helpers.js (vNear), vale.js (vilAt), server/players.js (reachTallgrassP), the map files.
   Test: tools/client-smoke.js (builds it), tools/server-smoke.js. Names: VIL7, TG_... */
const VIL7=(()=>{
  const x=SAV_HUB[0], z=SAV_HUB[1], h=baseHeight(x,z);
  return layoutVillage({x,z,h},{seed:7171,ent:Math.atan2(SAV_GATE.x-x,SAV_GATE.z-z),plan:{arc:0.7,jit:0.12,turn:0.2,rad:(i,pr)=>i===4?24:19+pr()*6,dims:{w:[5.0,6.4],d:[5.0,6.4],wh:[2.6,3.2]},kinds:['plain','wing','plain','loft','tav','plain','wing','plain','loft']}});
})();
VIL7.name='Tallgrass';
VILS.push(VIL7);
CIRCLES.push({id:'tallgrass',name:'Tallgrass',land:'Amber Reach',lv:'37-45',V:VIL7,open:g=>g.tall>=2,hint:'Walk into Tallgrass through the Ashbed Gate first'});
const TG_BAOBAB={x:VIL7.x,z:VIL7.z,r:3.2};   // the Moot Baobab's trunk, at the village's heart where the home village has its well: the well's collider grows to the trunk and its two anchors step out to the roots
{ const c=VIL7.circles.find(q=>q[0]===VIL7.x&&q[1]===VIL7.z); if(c) c[2]=TG_BAOBAB.r;
  for(const k of ['well','well:far']){ const A=VIL7.anchors[k], a=Math.atan2(A.x-VIL7.x,A.z-VIL7.z); A.x=VIL7.x+Math.sin(a)*(TG_BAOBAB.r+2.2); A.z=VIL7.z+Math.cos(a)*(TG_BAOBAB.r+2.2); } }
const TG_LANDING=(()=>{   // the nearest water edge to the village within 120 m: the foot of the jetty (on the shore) and its heading out over the water
  const wet=(x,z)=>waCoast(x,z)<0||baseHeight(x,z)<1.2;
  let best=null;
  for(let k=0;k<24;k++){ const a=k/24*TAU, sx=Math.sin(a), cz=Math.cos(a);
    for(let d=VR+14;d<120;d+=4){ const px=VIL7.x+sx*d, pz=VIL7.z+cz*d; if(wet(px,pz)){ if(!best||d<best.d) best={d,a,x:VIL7.x+sx*(d-6),z:VIL7.z+cz*(d-6)}; break; } } }
  return best&&{x:best.x,z:best.z,rot:best.a};
})();
if(TG_LANDING){ const c=Math.cos(TG_LANDING.rot), s=Math.sin(TG_LANDING.rot); VIL7.anchors.landing={x:TG_LANDING.x-s*3,z:TG_LANDING.z-c*3,face:TG_LANDING.rot}; }   // where Mudge stands: a few steps in from the jetty's foot, facing the water
