//@ Coralhaven, the Emberwake Isles' village (VIL8): the sea folk's stilt town on the first island's north shore, its teleport circle (gear.isles) and harbour landing, and the two waystations Zotchul and Urkuwara (a circle and a few people, no shops). Pure.
/* Coralhaven follows the home village's plan like Tallgrass (layoutVillage: the same houses, stalls, anchors and colliders, so every NPC role works the same) at EW_HUB (shared/emberwake.js, between zones e42 and e43).
   The way in is by sea: Oldhorn's fall (gear.isles 1, server/combat.js) opens Coralhaven's circle to every other circle (the harbour-master's boats, docs/EMBERWAKE.md), and walking into Coralhaven sets gear.isles 2.
   CH_LANDING is the harbour: a plank jetty on the north shore, where Eleaka the wayfinder waits (anchors.landing). EW_WAYS are the two waystations on the way east, each a village-shaped record {x, z, r, h, name, tele}
   like the Deep Cave's mouth (CAVE_MOUTH_V): a flat pad under the circle (ewWayPad, rawHeight's hook), nearCircle / buildCircle / warpP treat it like a village's. Both circles wake with gear.isles 2 (Coralhaven first).
   Used by: village-helpers.js (vNear), vale.js (vilAt), server/players.js (reachCoralhavenP, respawnVil), unstuck.js, the map files, game/village/buildings-isles.js, villagers.js. Test: tools/emberwake-smoke.js, client-smoke.js.
   Names: VIL8, CH_..., EW_WAYS, ewWay... */
const VIL8=(()=>{
  const x=EW_HUB.x, z=EW_HUB.z, h=baseHeight(x,z);
  return layoutVillage({x,z,h},{seed:8181,ent:Math.PI,plan:{arc:0.7,jit:0.12,turn:0.2,rad:(i,pr)=>i===4?24:19+pr()*6,dims:{w:[5.4,7.0],d:[5.4,7.0],wh:[2.8,3.4]},kinds:['plain','wing','plain','loft','tav','plain','wing','plain','loft']}});
})();
VIL8.name='Coralhaven';
VILS.push(VIL8);
CIRCLES.push({id:'coralhaven',name:'Coralhaven',land:'Emberwake Isles',lv:'42-50',V:VIL8,open:g=>g.isles>=1,hint:'The Emberwake Isles open when the Herd-Mother, Oldhorn, falls: the harbour-master sails for the one who ended her'});
const CH_LANDING=(()=>{   // the nearest water to the north of the village: the jetty's foot (on the shore) and its heading out over the water
  const wet=(x,z)=>waCoast(x,z)<0||baseHeight(x,z)<1.2;
  let best=null;
  for(let k=-4;k<=4;k++){ const a=Math.PI+k*0.26, sx=Math.sin(a), cz=Math.cos(a);
    for(let d=VR+14;d<140;d+=4){ const px=VIL8.x+sx*d, pz=VIL8.z+cz*d; if(wet(px,pz)){ if(!best||d<best.d) best={d,a,x:VIL8.x+sx*(d-6),z:VIL8.z+cz*(d-6)}; break; } } }
  return best&&{x:best.x,z:best.z,rot:best.a};
})();
if(CH_LANDING){ const c=Math.cos(CH_LANDING.rot), s=Math.sin(CH_LANDING.rot); VIL8.anchors.landing={x:CH_LANDING.x-s*3,z:CH_LANDING.z-c*3,face:CH_LANDING.rot}; }   // where Eleaka stands: a few steps in from the jetty's foot, facing the water

// the waystations: [x, z] chosen on gentle ground (slope < 0.07) well inland of the shore, one in each of the next two islands' zones (44 on the Jungle Isle, 47 on the Highland); the circle stands at the centre
const EW_WAY_R=16;   // the pad's flat radius (the ground blends back over 14 m more); no monster camp within EW_WAY_R+30 (ewZoneAt)
var EW_WAYS=null;   // (var: rawHeight asks ewWayPad before this file has run)
EW_WAYS=[
  {id:'zotchul',name:'Zotchul',land:'Emberwake Isles',lv:'44-46',x:-660,z:1630,face:Math.PI*0.5,note:'a clearing of the Jungle Edge, where the causeway road meets the first stone steps of the old city'},
  {id:'urkuwara',name:'Urkuwara',land:'Emberwake Isles',lv:'47-48',x:-110,z:1660,face:-Math.PI*0.5,note:'a terrace above the Highland\'s first switchback, where the isthmus road climbs'}
].map(w=>{
  const h=baseHeight(w.x,w.z), r=EW_WAY_R;
  return Object.assign(w,{h,r,tele:{x:w.x,z:w.z,r:2.6}});
});
for(const w of EW_WAYS) CIRCLES.push({id:w.id,name:w.name,land:w.land,lv:w.lv,V:w,open:g=>g.isles>=2,hint:'Walk into Coralhaven first, then the road east is yours'});
function ewWayPad(x,z,h){   // rawHeight's hook: a flat pad under each waystation's circle (emberwake)
  if(!EW_WAYS) return h;
  for(const w of EW_WAYS){ const dx=x-w.x, dz=z-w.z, R=w.r+14; if(dx*dx+dz*dz<R*R) h=lerp(h,w.h,smoothstep(R,w.r,Math.hypot(dx,dz))); }
  return h;
}
function ewWayNear(x,z,m){ if(!EW_WAYS) return null; for(const w of EW_WAYS) if((x-w.x)*(x-w.x)+(z-w.z)*(z-w.z)<(w.r+m)*(w.r+m)) return w; return null; }
