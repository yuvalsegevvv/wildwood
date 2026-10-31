//@ The Sigil track's 40 rewards, in order: 32 small pieces (decorations, gloves, hats, shoes, lowest grade first) and every 5th level a land's cape or aura, level 40 the Lampcrown
/* Agent map. Fills PZ_TRACK_COS (shared/puzzles.js) and CP_TRACK (shared/cospieces.js). Levels 1-5 follow the home forest, 6-10 the vale, 11-15 the Reach, 16-20 the Greyspine, 21-25 the Sunscar, 26-30 the Gloamhorn, 31-35 the Amber Reach, 36-40 the Deep Cave:
   four small pieces then a big one. The small pieces are the existing crafted decorations, gloves, hats and shoes sorted by grade (a stable order), so a later level is a finer piece; a track piece can still be made at the Lodge by anyone who has not reached its level.
   The big ones (new capes and auras in shared/cosmetics.js) are earned only here (CP_TRACK). pzTrackP (server/puzzles.js) hands each over with the level's gems. Test: tools/puzzles-smoke.js, tools/cospieces-smoke.js */
const PZ_TRACK_BIG={5:'c:rootcloak',10:'a:sakuraoffer',15:'c:frostmantle',20:'a:peakwind',25:'c:sunmirror',30:'a:shroudveil',35:'c:savannaweave',40:'a:lampcrown'};
{ const small=CP_PIECES.filter(r=>'dghs'.indexOf(r[0])>=0).map((r,i)=>[+r[3],i,r[0]+':'+r[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(r=>r[2]);
  let n=0; for(let L=1;L<=PZ_TRACK_LEVELS;L++){ const k=PZ_TRACK_BIG[L]||small[n++]; PZ_TRACK_COS[L]=k||null; if(PZ_TRACK_BIG[L]) CP_TRACK[k]=L; } }
