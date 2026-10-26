//@ The test room: a pad outside the home village's gate with a Training Scarecrow nobody can kill, a damage counter, and the tools for checking a build (reset cooldowns, refill the cave charge, swap soul and skills). Pure.
/* Agent map (docs/TESTROOM.md has the design)
   owns:    TROOM {x,z,r} (the pad: 37 m from the village's centre on the old Trial Gate's bearing, flat ground outside the village wall), troomIn(x,z[,pad]) (is a point on the pad), TROOM_TALK (how close the talk key works to the scarecrow).
   uses:    VIL (shared/village-layout.js). The scarecrow's definition is SCARECROW_DEF (monster-defs.js).
   used by: server/testroom.js (the scarecrow, the counter, the messages), server/economy.js (bindSoulP works on the pad), game/village/buildings-testroom.js, game/ui/testroom.js, village/talking.js, dungeon/entrances.js (dgEntClear: no plants on the pad).
   test:    tools/testroom-smoke.js. */
const TROOM=(()=>{ const g=VIL.ent+0.5, d=37; return {x:VIL.x+Math.sin(g)*d,z:VIL.z+Math.cos(g)*d,r:9}; })();
const troomIn=(x,z,pad)=>Math.hypot(x-TROOM.x,z-TROOM.z)<=TROOM.r+(pad||0);
const TROOM_TALK=3.5;
