//@ The Crownsea Shore's boss arena (ARENA_TIDE): a flat terrace on the home forest's south beach, where Carapax, the Tide King, lives, at the atlas's poi. Pure.
/* The arena stands at the atlas's poi "Carapax's Beach (20)" in the shore zone, on the beach's terrace, so the arena's south edge is wet sand and the tide's waves (server/boss-kits-home.js) come up out of the
   water. The zone is a boss zone like the other arenas' (atlasZoneAt in zones.js gives it to anyone within r + 26 m, zonePoint centres it: arena:true). */
const ARENA_TIDE=Object.assign(arenaAtPoi(poiNamed("Carapax's Beach (20)")),{r:20,key:'boss20b',name:"The Tide King's Beach",beach:true});
ARENA_TIDE.zone={key:'boss20b',ring:3,arena:true,beach:true,x:ARENA_TIDE.x,z:ARENA_TIDE.z,R:20,name:ARENA_TIDE.name,level:20,boss:true};
ZONES.push(ARENA_TIDE.zone); ARENAS.push(ARENA_TIDE);
