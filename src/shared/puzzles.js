//@ Puzzles (version 4): the registry of puzzle kinds (definePuzzleKind), the five difficulties, what a first solve and a chest pay, the Sigil track, seeds. Pure; the kinds are shared/puzzles/<kind>.js
/* Agent map (docs/PUZZLES.md; plan in the project files puzzles-plan/PLAN.md). Behind PZ_ON: while it is false no stone in the world works and no panel shows the track; the admin Puzzles section (devP 'pz') and the puzzle lab work anyway.
   owns:    PZ_ON, PZ_DIFF (name, target seconds, first-solve gems and Sigils), PZ_RENEW_MS (2 h), PZ_FLOOR_K (anti-farming floor), PZ_CHEST (what a chest of each difficulty holds), PZ_POTION_ODDS, PZ_LUCKY,
            PZ_SIG_LEVEL / PZ_LEVEL_GEMS / PZ_SCROLL_EVERY (the Sigil track), PZ_TRACK_COS (the cosmetic of each track level: filled by the content thread), PZ_SCROLL_DROP (epic scroll odds),
            PZ_KINDS / PZ_KIND_IDS / PZ_BAD / definePuzzleKind(d), pzSeed(site,diff,cycle), pzBoard(kind,diff,seed) (checked generation), pzTrackLevel(sig), pzFloorSecs(diff).
   a kind:  definePuzzleKind({id, name, land, gen(seed,diff) -> board (plain JSON data, may hold its own solution under `sol`), check(board,ans) -> bool, rate(board) -> {..metrics}}). A bad kind is left out and listed in PZ_BAD.
   Seeds:   the client builds the board itself from the seed (integer maths and mulberry32 only: the same on both sides); the server sends {site,kind,diff,seed} and regenerates the board only to check an answer.
   used by: server/puzzles.js, game/puzzles/*, game/economy/gems.js (the track tab), tools/puzzles-smoke.js, tools/puzzle-lab.js.  Test: tools/puzzles-smoke.js */
var PZ_ON=false;   // the master switch (var: the smoke test turns it on); the story revamp's release sets it true
const PZ_DIFF=[null,
  {name:'Trivial',target:5,gems:1,sigils:0},
  {name:'Easy',target:15,gems:2,sigils:0},
  {name:'Normal',target:60,gems:5,sigils:2},
  {name:'Hard',target:180,gems:10,sigils:4},
  {name:'Extreme',target:600,gems:20,sigils:9}];
var PZ_MAX_DIFF=5;   // the game has five difficulties; only the puzzle lab (tools/puzzle-lab-diffs.js) raises this to 10, just for fun
const PZ_RENEW_MS=2*3600*1000, PZ_FLOOR_K=0.3, PZ_REACH=7;   // PZ_REACH: how close (m) you must stand to a stone
// a chest by difficulty: coins x coinsFor(level), potions [min,max], drops (skill-upgrade materials of the level), stones (Tempering, from level 30), amber, scroll (epic scroll chance), gear (first solve: [chance, min rarity])
const PZ_CHEST=[null,
  {coins:2,pot:[0,1],potP:0.4,drops:1,stones:0,amber:0,scroll:0,gear:null},
  {coins:4,pot:[0,2],potP:1,drops:2,stones:0,amber:0,scroll:0,gear:null},
  {coins:8,pot:[1,3],potP:1,drops:3,stones:1,amber:0,scroll:0.02,gear:null},
  {coins:15,pot:[2,4],potP:1,drops:5,stones:2,amber:20,scroll:0.06,gear:[0.1,1]},
  {coins:30,pot:[3,6],potP:1,drops:8,stones:4,amber:50,scroll:0.20,gear:[1,2]}];
const PZ_POTION_ODDS=[['heal',0.55],['might',0.25],['guard',0.20]], PZ_LUCKY=0.10, PZ_STONE_LV=30;
const PZ_SIG_LEVEL=10, PZ_LEVEL_GEMS=10, PZ_SCROLL_EVERY=5, PZ_TRACK_LEVELS=40;
const PZ_TRACK_COS=new Array(PZ_TRACK_LEVELS+1).fill(null);   // [level] = a cosmetic key ('c:regal'); the content thread fills it (section 4 of the plan)
const pzTrackLevel=sig=>Math.min(PZ_TRACK_LEVELS,Math.floor(Math.max(0,sig)/PZ_SIG_LEVEL));
const pzFloorSecs=diff=>diff>=3?Math.round(PZ_DIFF[diff].target*PZ_FLOOR_K):0;
const PZ_KINDS={}, PZ_KIND_IDS=[], PZ_BAD=[];
function definePuzzleKind(d){
  const bad=why=>{ PZ_BAD.push({id:String(d&&d.id),why}); return false; };
  if(!d||typeof d!=='object') return bad('not an object');
  if(typeof d.id!=='string'||!/^[a-z][a-z0-9]{1,15}$/.test(d.id)) return bad('id must be a short lowercase word');
  if(Object.prototype.hasOwnProperty.call(PZ_KINDS,d.id)) return bad('duplicate id');
  if(typeof d.name!=='string'||typeof d.land!=='string') return bad('name and land are strings');
  if(typeof d.gen!=='function'||typeof d.check!=='function') return bad('gen(seed,diff) and check(board,ans) are functions');
  PZ_KINDS[d.id]=Object.assign({rate:()=>({})},d); PZ_KIND_IDS.push(d.id); return true;
}
// a string seed from a site id and cycle: a 32-bit integer (FNV-1a), the same everywhere
function pzSeed(site,diff,cycle){ let h=2166136261; const s=String(site)+'|'+(diff|0)+'|'+(cycle|0); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
// the board of a kind at a difficulty and seed, or null when the kind or the difficulty does not exist (own-property test: a client's string is never a key)
function pzBoard(kind,diff,seed){
  if(typeof kind!=='string'||!Object.prototype.hasOwnProperty.call(PZ_KINDS,kind)) return null;
  diff=diff|0; if(diff<1||diff>PZ_MAX_DIFF) return null;
  return PZ_KINDS[kind].gen(seed>>>0,diff);
}
