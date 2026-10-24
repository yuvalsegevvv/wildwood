//@ Amber Reach, the seventh land (levels 37-45) on the atlas: its hub, the Ashbed Gate, the nine zone records a37..a45 and the places the atlas puts there (dungeon door, boss sites, raid site, cape pier, the Seven Pools, the seasonal river). Pure.
/* Agent map. The ground, the coast and the borders are the atlas's (docs/world-atlas.py bakes shared/world-atlas-data.js; shared/world-atlas-ground.js shapes the ground, land id 6 'amber'); this file only names where
   things are, for the tasks that build on the land. Nothing here is drawn or spawned.
   Asking: inAmber(x,z) (terrain.js; ask it BEFORE inSun, which is true there too, as inGloam before inGrey), landAt(x,z) === 'amber' (tiers.js), waLandId(x,z) === 6. Both coordinates, always.
   Where it is: south of the Sunscar, x -1810..-170, z 520..1130 (0.70 km2, as big as the other lands): a main body along the south coast, a north-western lobe cut off from the Sunscar's fog coast by a bay,
   and the cape in the south-east. The border with the Sunscar is the straight line z 690 (x -1060..-480), where the dry riverbed is. Rain falls here (the Sunscar's does not).
   - SAV_KEYS 37..45 and SAV_ZONE[key] (the atlas's zone record {id,land,key,level,x,z,elev,area,entrance}): 37 the Ashbed (the gate zone), 38 Tallgrass Meadows (the village), 39 the Seven Pools, 40 the Termite
     Cathedrals (the dungeon's door), 41 Anvil Rock (boss), 42 the Burnt Plain, 43 Baobab Reach (the raid's site), 44 the Sedge Delta, 45 the Sunstair (boss, the cape). The walk goes west from the village through 39-41
     and back east along the south coast through 42-44 to 45, which touches only 44.
   - SAV_HUB: the village's place (Tallgrass, VIL7, in zone 38); SAV_GATE: the Ashbed Gate {a:'sun',b:'amber',x,z} (the Sunscar's side; the rock-fall record with gear.amber is SUN_AMBER in sunland.js, and the whole
     border is held by barHold, barriers.js, until gear.amber is 1).
   - SAV_DOOR (zone 40), SAV_BOSS_POI[41] and [45] (the arenas ARENA_A41 / ARENA_A45 stand here), SAV_MOOT (zone 43: the Broken Moot raid), SAV_PIER (zone 45: the sealed cape pier, 36-46 m inland of the water):
     atlas POIs {kind,name,land,zone,x,z}. SAV_POOLS: the Seven Pools (atlas lakes, zone 39: {x,z,r,level}); SAV_RIVER: the seasonal river {name,len,pts} from its spring in the gate zone to the delta's mouth.
   Used by: nothing yet (the tasks W2 zones, W3 Tallgrass, M2 wire-up, D1 dungeon and D2 raid read these). Test: tools/atlas-smoke.js. Names: sav..., SAV_... */
const SAV_KEYS=[37,38,39,40,41,42,43,44,45];
const SAV_HUB=WA_HUBS.amber;
const SAV_GATE=WA_GATES.find(g=>g.a==='sun'&&g.b==='amber');
const SAV_ZONE={37:waZoneOfKey('amber',37),38:waZoneOfKey('amber',38),39:waZoneOfKey('amber',39),40:waZoneOfKey('amber',40),41:waZoneOfKey('amber',41),42:waZoneOfKey('amber',42),43:waZoneOfKey('amber',43),44:waZoneOfKey('amber',44),45:waZoneOfKey('amber',45)};
const SAV_DOOR=WA_POIS.find(q=>q.land==='amber'&&q.kind==='door');
const SAV_BOSS_POI={41:WA_POIS.find(q=>q.land==='amber'&&q.kind==='boss'&&q.zone===41),45:WA_POIS.find(q=>q.land==='amber'&&q.kind==='boss'&&q.zone===45)};
const SAV_MOOT=WA_POIS.find(q=>q.land==='amber'&&q.kind==='raid');
const SAV_PIER=WA_POIS.find(q=>q.land==='amber'&&q.kind==='pier');
const SAV_POOLS=WA_LAKES.filter(L=>L.land==='amber');
const SAV_RIVER=WA_RIVERS.find(r=>r.name.indexOf('The Wet River')===0);
