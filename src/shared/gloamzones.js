//@ The Gloamhorn's zones m30-m40 (cells round seeds along the horn, one per level) and its two boss arenas (the Drowned Captain's hold, the lighthouse's forecourt). Pure.
/* Eleven zones for levels 30-40, one or two monster kinds each (docs/areas/gloamhorn.md; the levels climb along the horn, 30 at the neck to 40 at the tip). Each is a cell round one seed on the spine
   (GLOAM_PTS, gloamSpine(t)); the nearest seed wins and the border wobbles with noise, so a zone is a slice across the horn; a zone is a circle for camps (zonePoint: x, z, R) cut to its cell
   (gloamZoneAt). No zone on the cliff's last 10 m, in the lighthouse's keep or at the reserved door. */
const GLOAM_ZONE_NAMES={30:'Wraithwick Heath',31:"Wreckers' Reach",32:'The Cairn Fields',33:'Drowned Meadow',34:'Siren Cliffs',35:'Gallows Down',36:'The Mourning Stones',37:'Banshee Tor',38:'Vault Heath',39:'Gargoyle Crag',40:'Lanternfall',mboss35:'The Sea Caves',mboss40:'The Gloam Light'};
const GLOAM_SEEDS=[];
for(let k=30;k<=40;k++){ const S=gloamSpine(0.18+(k-30)*0.08); GLOAM_SEEDS.push({key:k,x:Math.round(S.x),z:Math.round(S.z)}); }
for(const s of GLOAM_SEEDS) ZONES.push({key:'m'+s.key,ring:3,vale:true,gloam:true,x:s.x,z:s.z,R:100,name:GLOAM_ZONE_NAMES[s.key],level:s.key});
const gloamWarp=(x,z)=>[x+noise2(x*0.009+3,z*0.009-8)*22,z+noise2(x*0.009-11,z*0.009+5)*22];
function gloamZoneAt(x,z){
  if(gloamIn(x,z)<10) return null;   // the cliff's edge, the sea
  for(const A of ARENAS) if(A.gloam&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  if(Math.hypot(x-GLOAM_LIGHT.x,z-GLOAM_LIGHT.z)<GLOAM_LIGHT.r+8) return null;
  const [wx,wz]=gloamWarp(x,z); let best=null, bd=1e18;
  for(const s of GLOAM_SEEDS){ const d=(wx-s.x)*(wx-s.x)+(wz-s.z)*(wz-s.z); if(d<bd){ bd=d; best=s; } }
  return ZONES.find(zn=>zn.gloam&&zn.key==='m'+best.key);
}
/* ---- boss arenas (terrain-height.js flattens an arena to its h): ARENA_M35 the Drowned Captain's hold (GLOAM_HOLD, with the cave mouths behind it), ARENA_M40 the forecourt of the lighthouse ---- */
const ARENA_M35={x:GLOAM_HOLD.x,z:GLOAM_HOLD.z,h:baseHeight(GLOAM_HOLD.x,GLOAM_HOLD.z),r:24,key:'mboss35',name:GLOAM_ZONE_NAMES.mboss35,gloam:true};
const ARENA_M40={x:Math.round(GLOAM_LIGHT.x-GLOAM_LIGHT.dx*GLOAM_LIGHT.fore),z:Math.round(GLOAM_LIGHT.z-GLOAM_LIGHT.dz*GLOAM_LIGHT.fore),h:0,r:24,key:'mboss40',name:GLOAM_ZONE_NAMES.mboss40,gloam:true};
ARENA_M40.h=baseHeight(ARENA_M40.x,ARENA_M40.z);
for(const A of [ARENA_M35,ARENA_M40]){ A.zone={key:A.key,ring:3,vale:true,gloam:true,x:A.x,z:A.z,R:A.r,name:A.name,level:A===ARENA_M35?35:40,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
