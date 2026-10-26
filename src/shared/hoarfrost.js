//@ The Hoarfrost Reach on the atlas: Frostgate Pass and its ice wall (PASS, at the vale | Reach gate), Rimehold (VIL3, the Reach's hub), zones h22-h30 (the atlas's zones), two boss arenas (the atlas's bosses). Pure.
/* ===================== THE HOARFROST REACH =====================
   A high frozen plateau north of the Sakura Vale (docs/WORLD.md, docs/MAIN-QUEST.md). Everything here stands where the atlas (shared/world-atlas.js, docs/world-atlas.py) puts it: Rimehold on the Reach's hub
   (WA_HUBS.hoar), Frostgate Pass at the vale | Reach gate (WA_GATES), the two boss arenas at the bosses (WA_POIS), the zones h22-h30 are the atlas's zones 22-30 of the Reach. The ground, the lakes (all frozen:
   flat ice, no flowing water) and the passes are the atlas's too (world-atlas-ground.js); this file keeps no terrain, no carve and no ridge.
   While the Reach is locked an ice wall (a mesh, game/village/buildings-hoar.js) stands in the pass at PASS.ice, and northBarZ(x) is the z a hiker without the Reach's key (gear.north) must stay south of;
   it is drawn from the atlas's own border, so it follows the land (the clamps that read it: player/movement.js and server/api.js). gear.north: 0 sealed, 1 wall open, 2 walked into Rimehold (the circles are attuned).
   Agent map: PASS {x, w, z0, z1, ice}, northBarZ, inPass, findHoarVillage, VIL3, VILS, CIRCLES, HOAR_ZONE_NAMES, hoarZoneAt, ARENA26 / ARENA30, northHubH(x,z,R) (the mean ground under a disc: a village's or an arena's pad height; also used by highmark.js and greyzones.js).
   Used by: zones.js (hoarZoneAt), roads.js, main-quest.js, professions.js, the server (economy.js, api.js), the client (movement, map, buildings-hoar). Tests: tools/hoarfrost-smoke.js, atlas-smoke.js. */

/* ---- Frostgate Pass: the atlas's vale | Reach gate. The wall of ice stands across the road at PASS.ice (11 m south of the border, on the vale's side); z0 / z1 are where the pass's keep-out strip (trees, rocks, camps) starts in
   the vale (south) and ends on the plateau. w: half the wall's width (the keep-out strip is a little wider). The ground is the atlas's saddle, not a carved canyon. */
const PASS=(()=>{ const G=WA_GATES.find(g=>g.a==='vale'&&g.b==='hoar'); return {x:G.x,w:5,z0:G.z+95,z1:G.z-90,ice:G.z}; })();
// the Reach's southern edge per 8 m of x (the most southern z of its land there), for northBarZ; null where the Reach does not reach
const HOAR_S0=Math.floor(WX0/8)*8, HOAR_S=(()=>{
  const n=Math.ceil((WX1-WX0)/8)+1, out=new Array(n).fill(null);
  for(let i=0;i<n;i++){ const x=HOAR_S0+i*8; for(let z=-80;z>WZ0;z-=8) if(waLand(x,z)==='hoar'){ for(let zz=z;zz<z+80;zz+=2) if(waLand(x,zz)==='hoar') z=zz; out[i]=z; break; } }
  return out;
})();
// the z a hiker without the Reach's key (gear.north) must stay south of: the ice wall in the pass, 11 m inside the vale from the Reach's edge elsewhere (the pass's gate stands 11 m south of the border, so the two agree)
function northBarZ(x){
  if(Math.abs(x-PASS.x)<PASS.w+10) return PASS.ice;
  const i=Math.round((x-HOAR_S0)/8), s=i>=0&&i<HOAR_S.length?HOAR_S[i]:null;
  return s===null?-1e9:s+11;
}
// how deep inside the Reach a point is, 0 at its border (with any other land) to 1 at w metres in, 0 outside it: the cold the weather, the sky and the ground colours fade in with
function hoarDepth(x,z,w){ return waLandId(x,z)===2?smoothstep(0,w,waLandBorderDist(x,z)):0; }
// keep trees, rocks and camps out of the pass (m = extra margin)
function inPass(x,z,m){ return Math.abs(x-PASS.x)<PASS.w+6+(m||0) && z<PASS.z0+30+(m||0) && z>PASS.z1-30-(m||0); }

/* ---- Rimehold, the reach's village: the same plan as the other villages (so every NPC role works the same), its road turned toward the pass. It stands on the Reach's hub, moved as one piece:
   the village disc's mean ground is its height (rawHeight flattens a pad round it, terrain-height.js). */
function northHubH(x,z,R){
  let sum=0,c=0;
  for(let rr=0;rr<=(R||VR);rr+=10) for(let j=0;j<8;j++){ const b=j/8*TAU; sum+=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); c++; }
  return sum/c;
}
function findHoarVillage(){ const [x,z]=WA_HUBS.hoar; return {x,z,h:northHubH(x,z),score:0}; }
const VIL3=(()=>{ const v=findHoarVillage(); return layoutVillage(v,{seed:9393,ent:Math.atan2(PASS.x-v.x,PASS.z1-v.z),plan:{arc:0.55,jit:0.03,rad:i=>i===4?24:20.5+(i%3)*0.8,dims:{w:[6.8,8.2],d:[5.0,5.8],wh:[2.8,3.2],rh:[2.6,3.2]},kinds:['plain','wing','tower','plain','tav','plain','wing','plain','tower']}}); })();
VIL3.name='Rimehold';
const VILS=[VIL,VIL2,VIL3];
/* the teleport circles (one in each village): where each leads and when it is awake. A land's circles wake when you have walked into its village:
   home and Hanami with gear.east 2, Rimehold with gear.north 2. Used by the server's warpP and the client's travel window (ui/travel.js) */
const CIRCLES=[
  {id:'home',name:'The village',land:'Wildwood',lv:'1-15',V:VIL,open:g=>g.east>=2,hint:'Walk to Hanami on the far side of the bridge first'},
  {id:'hanami',name:'Hanami',land:'The Sakura Vale',lv:'16-25',V:VIL2,open:g=>g.east>=2,hint:'Walk to Hanami on the far side of the bridge first'},
  {id:'rimehold',name:'Rimehold',land:'The Hoarfrost Reach',lv:'22-30',V:VIL3,open:g=>g.north>=2,hint:'Walk into Rimehold through Frostgate Pass first'}];

/* ---- zones: the atlas's zones 22-30 of the Reach (WA_ZONES, land 'hoar'; the route winds as the atlas has it: 22 at Rimehold, 23, 24 east, 25, 26 (the Rimeking's Hall), 27 back west, then 28, 29, 30).
   A zone is a circle for camps (zonePoint: x, z, R) around the atlas's heart spot of the zone (WA_SPOTS, heart), cut to the atlas's own cell by hoarZoneAt. */
const HOAR_ZONE_NAMES={22:'Rimewood Edge',23:'Whitebirch Flats',24:'Frostmere Shore',25:"Hunters' Wold",26:"The Rimeking's Hall",27:'Glacier Tongue',28:'Blizzard Steppe',29:'Bonefrost Barrow',30:"The Wyrm's Glacier",boss26:"The Rimeking's Hall",boss30:"The Wyrm's Nest"};
const HOAR_ZN=new Map();   // the atlas's zone id -> its ZONES entry
for(let k=22;k<=30;k++){
  const Z=waZoneOfKey('hoar',k), H=WA_SPOTS.find(s=>s.land==='hoar'&&s.zone===k&&s.heart)||Z;
  const zn={key:'h'+k,ring:3,vale:true,hoar:true,x:Math.round(H.x),z:Math.round(H.z),R:Math.round(Math.sqrt(Z.area/Math.PI)*0.8),name:HOAR_ZONE_NAMES[k],level:k};
  ZONES.push(zn); HOAR_ZN.set(Z.id,zn);
}
function hoarZoneAt(x,z){
  for(const A of ARENAS) if(A.hoar&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  return HOAR_ZN.get(waZoneId(x,z))||null;
}

/* ---- boss arenas: flat clearings at the atlas's bosses (northArena also builds the Greyspine's two, greyzones.js). ARENA26 (Ymrik the Rimeking, in the ice hall), ARENA30 (Vetrmaw the frost wyrm, at the wreck).
   The atlas's ground at a boss anchor is rugged, and rawHeight flattens a pad (radius 20, blended out to 42 m, terrain-height.js) to the arena's height: so the pad is laid within 22 m of the anchor (the anchor stays
   on the flat) at the spot and height (within 6 m of the disc's mean ground) at which the atlas's road to the boss, once flattened, stays gentlest (its steepest step: atlas-smoke walks it). ---- */
function northArenaSpot(P){
  const rp=[];   // every atlas road within 85 m of the anchor (the boss's own and any that pass by), [x, z, ground, index in its road + 1e6 * the road's number]
  WA_ROADS.forEach((road,ri)=>road.pts.forEach((q,i)=>{ if(Math.hypot(q[0]-P.x,q[1]-P.z)<85) rp.push([q[0],q[1],baseHeight(q[0],q[1]),i+ri*1e6]); }));
  let best=null;
  for(let dx=-22;dx<=22;dx+=3) for(let dz=-22;dz<=22;dz+=3){
    const d0=Math.hypot(dx,dz); if(d0>22) continue;
    const x=P.x+dx, z=P.z+dz, gc=baseHeight(x,z), hm=northHubH(x,z,20); if(gc<4||waWaterDist(x,z)<45||[...WA_SPOTS,...WA_ENTRANCES,...WA_GATES,...WA_POIS].some(o=>{ const d=Math.hypot(o.x-x,o.z-z); return o!==P&&d>=23&&d<45; })) continue;   // (every other anchor is on the flat or clear of the pad's rim)
    for(const dh of [0,-2,2,-4,4,-6,6,-8,8,-10,10]){
      const h=hm+dh; if(Math.abs(h-gc)>=9) continue;
      let rs=0, pm=null;
      for(const q of rp){ const m=lerp(q[2],h,smoothstep(42,22,Math.hypot(q[0]-x,q[1]-z)));
        if(pm&&q[3]===pm[1]+1) rs=Math.max(rs,Math.abs(m-pm[0])/Math.hypot(q[0]-pm[2],q[1]-pm[3])); pm=[m,q[3],q[0],q[1]]; }
      const score=rs+0.01*Math.abs(dh)+0.004*d0; if(!best||score<best.score) best={x,z,h,score,rs};
    }
  }
  return best||{x:P.x,z:P.z,h:northHubH(P.x,P.z,20)};
}
function northArena(poi,key,name,level,land){
  const P=WA_POIS.find(p=>p.name===poi), S=northArenaSpot(P), A={x:S.x,z:S.z,h:S.h,r:20,key,name}; A[land]=true;
  A.zone={key,ring:3,vale:true,x:A.x,z:A.z,R:20,name,level,boss:true}; A.zone[land]=true; ZONES.push(A.zone); ARENAS.push(A); return A;
}
const ARENA26=northArena("The Rimeking's Hall",'boss26',"The Rimeking's Hall",26,'hoar');
const ARENA30=northArena("The Wyrm's Nest",'boss30',"The Wyrm's Nest",30,'hoar');
