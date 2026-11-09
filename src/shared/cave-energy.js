//@ The Deep Cave's energy: kills on a floor feed it, time drains it (faster the fuller it is), a low bar blinds and burns, a full bar opens the next floor, shard nodes cost it. The numbers and pure rules.
/* Agent map. Doc: docs/CAVE.md section 17. Server: server/cave/energy.js (caveEnTickP, caveEnKillS). Client: game/cave/energy.js (the bar, the blindness). Test: tools/cave-smoke.js (the energy block).
   Energy is p.cave.en (0-CAVE_EN_MAX, NOT saved: a fresh hiker enters a floor with CAVE_EN_START). Reaching the max on floor n sets gear.cave.mx[n] = 1 (saved), which opens floor n + 1 (caveFloorOpen, cave-map.js).
   exports: CAVE_EN_*, caveEnDrain(en) (units a second), caveEnGain(floor) (units a kill), caveEnBlind(en) (0-1, how blind), caveEnSafe(B, x, z) is on the server (it needs the floor's anchors). */
const CAVE_EN_MAX=200;
const CAVE_EN_START=40;          // energy when a hiker steps onto a floor with none yet
const CAVE_EN_LOW=15;            // below this: damage over time (the fog starts earlier, see caveEnBlind)
const CAVE_EN_DRAIN0=0.4, CAVE_EN_DRAIN1=1.8, CAVE_EN_DRAIN_FROM=100;   // a second: DRAIN0 up to 100 energy, then rising slowly to DRAIN0 + DRAIN1 at the max (200)
const CAVE_EN_KILL=[0,10,10,12,12,14,14,16,16,18];       // energy a kill on floor 1-9 gives every hiker on the floor within CAVE_EN_SHARE_R
const CAVE_EN_SHARE_R=45;
const CAVE_EN_SAFE_R=14;         // within this of the floor's lift, nothing drains (and nothing hurts)
const CAVE_EN_DOT=0.02;          // below CAVE_EN_LOW: this share of max health a second (never knocks you out: it stops at 1 hp)
const CAVE_EN_NODES=6;           // shard nodes a floor has
const CAVE_EN_MINE=100;          // energy one shard node costs
const CAVE_EN_NODE_NEED=150;     // energy needed to start mining one
const CAVE_SIGIL_FIRST=[0,1,1,1,1,1,1];   // Sigils (gear.sig, the puzzle track's currency) for finishing a method for the first time, by floor: 1 each, 7 methods x 6 floors = 42 from the cave
const CAVE_EN_MINE_SECS=2.5;     // standing still this long near a node mines it
const CAVE_EN_NODE_REACH=2.6, CAVE_EN_NODE_CD=900;   // metres; seconds before the same hiker may mine the same node again
const CAVE_EN_SHARD_K=2;         // a node pays CAVE_SHARDS[floor] x this many Echo Shards
const caveEnDrain=en=>CAVE_EN_DRAIN0+CAVE_EN_DRAIN1*Math.max(0,Math.min(1,(en-CAVE_EN_DRAIN_FROM)/(CAVE_EN_MAX-CAVE_EN_DRAIN_FROM)));
const caveEnGain=floor=>CAVE_EN_KILL[Math.max(1,Math.min(CAVE_EN_KILL.length-1,floor|0))];
const CAVE_EN_FOG_START=80, CAVE_EN_FOG_FULL=20;   // the void fog: a faint trace from 80 (barely felt around 70, eased), about half at 50, thickest at 20 and under (you start a floor at 40: a little fog from the first step)
const caveEnBlind=en=>{ const k=Math.max(0,Math.min(1,(CAVE_EN_FOG_START-en)/(CAVE_EN_FOG_START-CAVE_EN_FOG_FULL))); return k*k*(3-2*k); };   // 0-1, eased
