//@ The Sigil track's 40 rewards, in order: 32 small pieces (hair styles, decorations, gloves, hats, tops, bottoms, shoes: every part) and every 5th level a land's cape or aura, level 40 the Lampcrown
/* Agent map. Fills PZ_TRACK_COS (shared/puzzles.js) and CP_TRACK (shared/cospieces.js). Levels 1-5 follow the home forest, 6-10 the vale, 11-15 the Reach, 16-20 the Greyspine, 21-25 the Sunscar, 26-30 the Gloamhorn, 31-35 the Amber Reach, 36-40 the Deep Cave:
   four small pieces then a big one. The small pieces are the existing crafted decorations, gloves, hats and shoes sorted by grade (a stable order), so a later level is a finer piece; a track piece can still be made at the Lodge by anyone who has not reached its level.
   The big ones (new capes and auras in shared/cosmetics.js) are earned only here (CP_TRACK). pzTrackP (server/puzzles.js) hands each over with the level's gems. Test: tools/puzzles-smoke.js, tools/cospieces-smoke.js */
const PZ_TRACK_BIG={5:'c:rootcloak',10:'a:sakuraoffer',15:'c:frostmantle',20:'a:peakwind',25:'c:sunmirror',30:'a:shroudveil',35:'c:savannaweave',40:'a:lampcrown'};
{ // every part. EXCLUSIVES are earned only here (no recipe; their text ends 'Earned on the Sigil track.'): the hair styles, new decorations, capes and auras (16 in all) take every second small slot;
  // the other 16 small slots are drawn evenly across the craftable pieces by grade (inside a grade the slots take turns), so the track never runs on one kind
  const done=/Sigil track\./, order='dghtbs', ex=[];
  for(const r of CP_PIECES) if(done.test(r[4])) ex.push([+r[3],r[0]+':'+r[1]]);
  for(const r of COS_CAPES) if(done.test(r[6])) ex.push([+r[2],'c:'+r[0]]);
  for(const r of COS_AURAS) if(done.test(r[8])) ex.push([+r[2],'a:'+r[0]]);
  ex.sort((a,b)=>a[0]-b[0]); const exKeys=ex.map(e=>e[1]), exSet=new Set(exKeys);
  const rows=CP_PIECES.filter(r=>order.indexOf(r[0])>=0&&!exSet.has(r[0]+':'+r[1])), cnt={}, all=rows.map(r=>{ const n=cnt[r[0]]=(cnt[r[0]]|0)+1; return [+r[3],n,order.indexOf(r[0]),r[0]+':'+r[1]]; }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]).map(r=>r[3]);
  const pick=[]; for(let i=0;i<16;i++) pick.push(all[Math.floor(i*all.length/16)]);
  const small=[]; { let ei=0, pi=0; for(let i=0;i<32;i++) small.push(i%2===0&&ei<exKeys.length?exKeys[ei++]:pick[pi++]||exKeys[ei++]); }
  let n=0; for(let L=1;L<=PZ_TRACK_LEVELS;L++){ const k=PZ_TRACK_BIG[L]||small[n++]; PZ_TRACK_COS[L]=k||null; if(PZ_TRACK_BIG[L]||exSet.has(k)) CP_TRACK[k]=L; } }
