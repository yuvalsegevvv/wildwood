//@ The Sunscar's zones s28-s36 (cells round seeds on the plateau, like the Greyspine's) and its two boss arenas (the Glass Fields' guardian, the sand wyrm's dune pit). Pure.
/* Nine zones for levels 28-36, two monster kinds each (docs/areas/sunscar.md). Each is a cell round one or two seeds (the nearest seed wins, the border wobbles with noise); a zone is a circle for camps
   (zonePoint: x, z, R) cut to its cell (sunZoneAt). The route goes from the River Pass down into the land and round it: 28 the Springhead Flats under the pass, 29 the Weeping Pan in the north-west, 30 the Anvil
   Cliffs west of the city, 31 the Lantern Wash in the north-centre, 32 the Glass Fields (boss: the Glass Guardian), 33 the Twin Buttes in the south-west, 34 the Whitefloor, 35 Bellrock and the Cinder Glass
   in the south-east, 36 the Singing Dunes by Redgate Canyon (boss: the sand wyrm, whose fall opens the canyon). No zone within the city's apron, on the river's water or in the wall. */
const SUN_ZONE_NAMES={28:'Springhead Flats',29:'The Weeping Pan',30:'Anvil Cliffs',31:'Lantern Wash',32:'The Glass Fields',33:'Twin Buttes',34:'The Whitefloor',35:'Bellrock',36:'The Singing Dunes',sboss32:"The Guardian's Court",sboss36:"The Wyrm's Pit"};
const SUN_SEEDS=[
  {key:28,x:-790,z:-135},{key:28,x:-690,z:-170},
  {key:29,x:-930,z:-160},{key:29,x:-885,z:-85},
  {key:30,x:-950,z:50},{key:30,x:-965,z:140},
  {key:31,x:-650,z:-250},{key:31,x:-590,z:-170},
  {key:32,x:-852,z:262},{key:32,x:-790,z:200},
  {key:33,x:-905,z:352},{key:33,x:-960,z:290},
  {key:34,x:-642,z:338},{key:34,x:-700,z:260},
  {key:35,x:-548,z:262},{key:35,x:-515,z:352},
  {key:36,x:-520,z:-60},{key:36,x:-480,z:60}];
for(const k of [28,29,30,31,32,33,34,35,36]){ const ss=SUN_SEEDS.filter(s=>s.key===k), x=ss.reduce((a,s)=>a+s.x,0)/ss.length, z=ss.reduce((a,s)=>a+s.z,0)/ss.length;
  ZONES.push({key:'s'+k,ring:3,vale:true,sun:true,x,z,R:k===36?130:120,name:SUN_ZONE_NAMES[k],level:k}); }
const sunWarp=(x,z)=>[x+noise2(x*0.009+3,z*0.009-8)*26,z+noise2(x*0.009-11,z*0.009+5)*26];
function sunZoneAt(x,z){
  if(Math.min(x-WX0,WZ1-z,z-borderZ(x))<44) return null;                // the Bight, the Crownsea's shore, the north wall
  if(x>HX0-14||Math.hypot(x-SUN_CITY.x,z-SUN_CITY.z)<SUN_FLAT-20) return null;   // the Sunwall, and the city with its apron
  for(const A of ARENAS) if(A.sun&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  const [wx,wz]=sunWarp(x,z); let best=null, bd=1e18;
  for(const s of SUN_SEEDS){ const d=(wx-s.x)*(wx-s.x)+(wz-s.z)*(wz-s.z); if(d<bd){ bd=d; best=s; } }
  return ZONES.find(zn=>zn.sun&&zn.key==='s'+best.key);
}
/* ---- boss arenas: flat clearings (terrain-height.js flattens an arena to its h). ARENA_S32 the Glass Guardian's court in the middle of the Glass Fields, ARENA_S36 the sand wyrm's pit in the dunes by Redgate ---- */
const ARENA_S32={x:-852,z:262,h:baseHeight(-852,262),r:22,key:'sboss32',name:SUN_ZONE_NAMES.sboss32,sun:true};
const ARENA_S36={x:-548,z:-70,h:baseHeight(-548,-70),r:24,key:'sboss36',name:SUN_ZONE_NAMES.sboss36,sun:true};
for(const A of [ARENA_S32,ARENA_S36]){ A.zone={key:A.key,ring:3,vale:true,sun:true,x:A.x,z:A.z,R:A.r,name:A.name,level:A===ARENA_S32?32:36,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
