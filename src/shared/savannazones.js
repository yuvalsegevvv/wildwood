//@ Amber Reach's zones a37-a45 (the atlas's zones of land 'amber', one per level) and its two boss arenas at the atlas's bosses (Old Thunder's roost on Anvil Rock, the slab at the top of the Sunstair). Pure.
/* Agent map. Nine zones for levels 37-45, two monster kinds each (docs/SAVANNA.md once I1 writes it). A zone is the atlas's zone of that level (waZone: WA_ZONES, land 'amber', key 37..45), a circle for camps
   (zonePoint: x, z, R: the record's centre and the radius of its area) cut to its cell (savZoneAt). The walk (shared/savanna.js): 37 the Ashbed at the gate, 38 Tallgrass Meadows round the village, 39 the Seven Pools,
   40 the Termite Cathedrals (the dungeon's door), 41 Anvil Rock (boss: Old Thunder), 42 the Burnt Plain, 43 Baobab Reach (the raid's site), 44 the Sedge Delta, 45 the Sunstair (boss: Oldhorn, the cape). No zone on the
   shore (30 m) or within 70 m of the village's hub.
   Exports: SAV_ZONE_NAMES, SAV_ZONE_OF[37..45] (the ZONES records: key 'a37', flags amber + vale, like the Sunscar's), savZoneAt(x,z), ARENA_A41 / ARENA_A45 (keys aboss41 / aboss45, pushed to ARENAS and ZONES),
   savKeepOut(x,z,m) (the places camps, nodes, plants and props keep off: the village hub, the door, the Broken Moot, the cape pier, the arenas; m metres of margin).
   Used by: zones.js (zoneAt asks inAmber first), professions.js (nodes), game/world/zone-props.js (zpTheme a37..a45, ZP_BOSS aboss41 / aboss45), generation-chunks.js (plants), the tasks M2 (camps, arenas) and
   D1 / D2 (the door, the Moot). Test: tools/zoneprops-smoke.js, tools/tiers-smoke.js. Names: sav..., SAV_... */
const SAV_ZONE_NAMES={37:'The Ashbed',38:'Tallgrass Meadows',39:'The Seven Pools',40:'The Termite Cathedrals',41:'Anvil Rock',42:'The Burnt Plain',43:'Baobab Reach',44:'The Sedge Delta',45:'The Sunstair',aboss41:"Old Thunder's Roost",aboss45:'The Dawn Slab'};
const SAV_ZONE_OF={};   // 37..45 -> its ZONES record
for(const k of SAV_KEYS){ const Z=SAV_ZONE[k], zn={key:'a'+k,ring:3,vale:true,amber:true,x:Math.round(Z.x),z:Math.round(Z.z),R:Math.round(Math.sqrt(Z.area/Math.PI)),name:SAV_ZONE_NAMES[k],level:k};
  ZONES.push(zn); SAV_ZONE_OF[k]=zn; }
const SAV_HUB_R=70;   // the village's own ground has no camps and no zone (atlasZoneAt's 70 m)
function savZoneAt(x,z){
  if(waCoast(x,z)<30||Math.hypot(x-SAV_HUB[0],z-SAV_HUB[1])<SAV_HUB_R) return null;   // the shore, the sea, and the village
  for(const A of ARENAS) if(A.amber&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  const Z=waZone(x,z); return Z&&Z.land==='amber'?SAV_ZONE_OF[Z.key]||null:null;
}
/* ---- boss arenas: flat clearings at the atlas's bosses (terrain-height.js flattens an arena to its h). ARENA_A41 Old Thunder's roost on Anvil Rock (zone 41), ARENA_A45 the slab at the Sunstair's top (zone 45) ---- */
const ARENA_A41={x:SAV_BOSS_POI[41].x,z:SAV_BOSS_POI[41].z,h:baseHeight(SAV_BOSS_POI[41].x,SAV_BOSS_POI[41].z),r:24,key:'aboss41',name:SAV_ZONE_NAMES.aboss41,amber:true};
const ARENA_A45={x:SAV_BOSS_POI[45].x,z:SAV_BOSS_POI[45].z,h:baseHeight(SAV_BOSS_POI[45].x,SAV_BOSS_POI[45].z),r:24,key:'aboss45',name:SAV_ZONE_NAMES.aboss45,amber:true};
for(const A of [ARENA_A41,ARENA_A45]){ A.zone={key:A.key,ring:3,vale:true,amber:true,x:A.x,z:A.z,R:A.r,name:A.name,level:A===ARENA_A41?41:45,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
// where nothing is placed at random (camps, resource nodes, plants, props): the village's hub, the dungeon's door, the Broken Moot (the raid), the cape pier and the arenas, with m metres of margin
const SAV_KEEP=[[SAV_HUB[0],SAV_HUB[1],64],[SAV_DOOR.x,SAV_DOOR.z,24],[SAV_MOOT.x,SAV_MOOT.z,46],[SAV_PIER.x,SAV_PIER.z,30]];
function savKeepOut(x,z,m){
  if(!inAmber(x,z)) return false;
  for(const k of SAV_KEEP){ const r=k[2]+m; if((x-k[0])*(x-k[0])+(z-k[1])*(z-k[1])<r*r) return true; }
  for(const A of ARENAS) if(A.amber&&Math.hypot(x-A.x,z-A.z)<A.r+6+m) return true;
  return false;
}
