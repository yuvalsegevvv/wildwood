//@ Coralhaven, the Emberwake Isles' village (VIL8): the sea folk's stilt town on the second island, the isles' one teleport circle (gear.isles), and the two camps Zotchul and Urkuwara (a flat pad, a landmark and a few people, no circle, no shops). Pure.
/* Coralhaven follows the home village's plan like Tallgrass (layoutVillage: the same houses, stalls, anchors and colliders, so every NPC role works the same) at EW_HUB (shared/emberwake.js), on the west of the second island,
   its road facing west to the bridge from the landing island. The way in is on foot: the Tide Bridge leaves the Amber Reach's south cape (the barrier at the strait: barLocked(6,7), opened by Oldhorn's fall, gear.isles 1),
   then the Reef Bridge reaches Coralhaven's island; walking into Coralhaven sets gear.isles 2, which attunes the village's circle: THE ONLY teleport circle of the isles (CIRCLES id `coralhaven`).
   EW_WAYS are the two camps on the way east (Zotchul in the jungle, Urkuwara on the east isle's terraces), each a village-shaped record {x, z, r, h, name} with a flat pad (ewWayPad, rawHeight's hook), a stone landmark and two people:
   they have no circle and no shop. The bridges are the atlas's four roads (docs/world-atlas.py section 13; roads.js turns the wet stretch into planks).
   Used by: village-helpers.js (vNear), vale.js (vilAt), server/players.js (reachCoralhavenP, respawnVil), unstuck.js, the map files, game/village/buildings-isles.js, villagers.js. Test: tools/emberwake-smoke.js, client-smoke.js.
   Names: VIL8, EW_WAYS, ewWay... */
const VIL8=(()=>{
  const x=EW_HUB.x, z=EW_HUB.z, h=baseHeight(x,z);
  return layoutVillage({x,z,h},{seed:8181,ent:-Math.PI/2,plan:{arc:0.7,jit:0.12,turn:0.2,rad:(i,pr)=>i===4?24:19+pr()*6,dims:{w:[5.4,7.0],d:[5.4,7.0],wh:[2.8,3.4]},kinds:['plain','wing','plain','loft','tav','plain','wing','plain','loft']}});
})();
VIL8.name='Coralhaven';
VILS.push(VIL8);
CIRCLES.push({id:'coralhaven',name:'Coralhaven',land:'Emberwake Isles',lv:'42-50',V:VIL8,open:g=>g.isles>=2,hint:'The Tide Bridge opens when the Herd-Mother, Oldhorn, falls: cross it and walk into Coralhaven to attune the circle'});
// the camps: [x, z] chosen on gentle ground (a 16 m ring varies under 2 m) well inland of the shore, one in the jungle of Coralhaven's island (zone 45) and one on the east isle's terraces (zone 47), 95 m or more from every place of the isles
const EW_WAY_R=16;   // the pad's flat radius (the ground blends back over 14 m more); no monster camp within EW_WAY_R+30 (ewZoneAt)
var EW_WAYS=null;   // (var: rawHeight asks ewWayPad before this file has run)
EW_WAYS=[
  {id:'zotchul',name:'Zotchul',land:'Emberwake Isles',lv:'44-46',x:440,z:1462,face:-Math.PI*0.5,note:'a clearing in the jungle east of Coralhaven, where the first stone steps of the old city begin'},
  {id:'urkuwara',name:'Urkuwara',land:'Emberwake Isles',lv:'47-48',x:1064,z:1380,face:-Math.PI*0.5,note:'a terrace of the east isle, above the first switchback of the climb to the heights'}
].map(w=>{
  const h=baseHeight(w.x,w.z), r=EW_WAY_R;
  return Object.assign(w,{h,r});
});
function ewWayPad(x,z,h){   // rawHeight's hook: a flat pad under each camp (emberwake)
  if(!EW_WAYS) return h;
  for(const w of EW_WAYS){ const dx=x-w.x, dz=z-w.z, R=w.r+14; if(dx*dx+dz*dz<R*R) h=lerp(h,w.h,smoothstep(R,w.r,Math.hypot(dx,dz))); }
  return h;
}
function ewWayNear(x,z,m){ if(!EW_WAYS) return null; for(const w of EW_WAYS) if((x-w.x)*(x-w.x)+(z-w.z)*(z-w.z)<(w.r+m)*(w.r+m)) return w; return null; }
