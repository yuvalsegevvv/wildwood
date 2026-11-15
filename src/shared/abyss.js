//@ The Abyss (a solo roguelike mode, behind AB_ON): the flag, the six difficulties, the round level table, the boss rounds and the caps. Pure; loaded by both sides
/* agent map (docs/ABYSS.md; the plan: abyss-plan/PLAN.md)
   exports: AB_ON, abSwitch(on), AB_DIFFS (6 rows {id,name,lo,hi,rounds}: I-V then Infinite; hi / rounds 0 = no end), AB_INF (the index of Infinite, 5), abRoundLv(d,r), abRounds(d),
            abBossRounds(d) (the finite list; for Infinite the first AB_BOSS_SHOWN), abIsBossRound(d,r), AB_ART_MAX (20 artifacts at once), AB_RANK_MAX (5 copies), AB_CURSE_MAX (5),
            AB_ENTRY_LV (40), AB_AS_MAX / AB_LOCK_MAX (save caps of gear.ab.as / .lock), AB_RUN_KEEP_S (a saved run older than this is dropped), AB_THEME (the rift def a run borrows its look and kinds from for now),
            B4: AB_ARTS (the artifact registry, Object.create(null)), AB_ART_BAD, defineAbArt(row), AB_STATS / AB_RATE / AB_CAPS / AB_RARS / AB_RAR_W, abArtStat(arts,stat) (the pure product / capped sum of a bar), AB_OFFER_N (3), B6: AB_NTH / AB_EXEC_HP / AB_DEF_MIN, AB_CURSES / AB_CURSE_BAD / defineAbCurse(row) / abIsCurse / abCurseStat(curses,stat) (the curse registry), AB_WAVES / AB_COUNT_S / AB_WAVE_S / AB_RELEASE_S / AB_ALIVE_MAX / AB_NEXT_PCT / AB_DEATH_S, abWaveSize(r,w), abLayout(tile,seed) (B7: the tile's island or the rift's plain platforms), DG_HUD.abyss (the run's HUD row)
   users: server/abyss/arts.js (abP), shared/abyss/artifacts-stat.js (the entries), game/abyss/choice.js,
          server/abyss.js (the flag, the window, the save), server/abyss/rounds.js (the run), game/dungeon/run.js (abLayout); later steps: the run, the artifacts, the client panel
   test: tools/abyss-smoke.js
   Round levels: every finite difficulty climbs 10 levels every 3 rounds, so ONE formula, abRoundLv(d,r) = lo + round((r-1)*10/3): difficulty I (lo 40) gives 40, 43, 47, 50, 53, 57, 60 (the
   last digit cycles 0, 3, 7), V reaches 140 at round 19, Infinite (lo 90, no end) reaches 180 at round 28. Boss rounds: 7, 13, 19... (every 6 from 7) and the last round of a finite difficulty. */
let AB_ON=false;   // the mode's switch: false on the deploy until step B12; the server also opens it in the test world and with the dev tools (abOnS, server/abyss.js)
function abSwitch(on){ AB_ON=!!on; }
const AB_DIFFS=[
  {id:'I',name:'Difficulty I',lo:40,hi:60,rounds:7},
  {id:'II',name:'Difficulty II',lo:50,hi:80,rounds:10},
  {id:'III',name:'Difficulty III',lo:60,hi:100,rounds:13},
  {id:'IV',name:'Difficulty IV',lo:70,hi:120,rounds:16},
  {id:'V',name:'Difficulty V',lo:80,hi:140,rounds:19},
  {id:'INF',name:'Infinite',lo:90,hi:0,rounds:0}];
const AB_INF=5, AB_ART_MAX=20, AB_RANK_MAX=5, AB_CURSE_MAX=5, AB_ENTRY_LV=40, AB_BOSS_SHOWN=8, AB_AS_MAX=999999999, AB_LOCK_MAX=9999, AB_RUN_KEEP_S=1800;
const abRoundLv=(d,r)=>AB_DIFFS[d].lo+Math.round((Math.max(1,r|0)-1)*10/3);   // d: the index in AB_DIFFS, r: the round from 1
const abRounds=d=>AB_DIFFS[d].rounds|0;   // 0 = Infinite
function abIsBossRound(d,r){ r=r|0; if(r<7) return false; const n=abRounds(d); if(n&&r>n) return false; return (r-7)%6===0||r===n; }
function abBossRounds(d){ const n=abRounds(d), out=[]; for(let r=7;n?r<=n:out.length<AB_BOSS_SHOWN;r+=6) out.push(r); if(n&&out[out.length-1]!==n) out.push(n); return out; }
/* A FIGHT ROUND (B2): AB_WAVES waves through the void's tears, the first after AB_COUNT_S, the next at AB_NEXT_PCT of this one dead or AB_WAVE_S after it began, a wave pours in over AB_RELEASE_S,
   at most AB_ALIVE_MAX alive; the round is won when the last wave is dead. The look and the monster kinds are the Shardmere's for now (B7 brings the tiles). */
const AB_THEME='shardmere', AB_WAVES=3, AB_COUNT_S=3, AB_WAVE_S=30, AB_RELEASE_S=6, AB_ALIVE_MAX=30, AB_NEXT_PCT=0.75, AB_DEATH_S=3;
const abWaveSize=(r,w)=>6+2*(w|0)+Math.floor(Math.max(1,r|0)/2);   // round 1 wave 1: 8, wave 3: 12
/* ARTIFACTS (B4, plan section 5). An artifact is a data row defined through defineAbArt({id,name,fam,rar,icon,k,text}); every COPY held is one place of the AB_ART_MAX and its factors stack,
   so the rank (copies, at most AB_RANK_MAX) is simply more copies. k = {stat: number per copy}. PRODUCT stats (atk: damage dealt, hp: max health, def: damage taken, heal: healing received) are a factor per copy
   and the bar's copies multiply (def < 1 takes less; the 10% floor of hurtP still holds). RATE stats (crit: crit chance points, cdr: cooldown, aspd: attack speed, lifesteal: a share of the damage dealt healed)
   are an amount per copy and add up, capped by AB_CAPS. A bad row is left out and listed in AB_ART_BAD (the smoke test fails naming it). */
const AB_ARTS=Object.create(null), AB_ART_BAD=[], AB_OFFER_N=3;
// B6 adds the combat artifacts' stats: PRODUCTS boss (damage to bosses), exec (damage to a monster under 20% health), nth (every AB_NTH-th hit deals this much); RATES killheal (share of max health healed
// per kill), shield (share of max health as a shield at the start of a round), thorns (share of an attacker's max health it takes each time it hits you; a tenth of that for a boss), last (the share of max
// health you stand up with when a hit would kill you: Last Breath, one copy used up)
const AB_STATS=['atk','hp','def','heal','crit','cdr','aspd','lifesteal','boss','exec','nth','killheal','shield','thorns','last'], AB_RATE={crit:1,cdr:1,aspd:1,lifesteal:1,killheal:1,shield:1,thorns:1,last:1};
const AB_CAPS={crit:0.5,cdr:0.4,aspd:0.6,lifesteal:0.01,killheal:0.3,shield:3,thorns:0.2,last:0.3};
const AB_NTH=5, AB_EXEC_HP=0.2, AB_DEF_MIN=0.1;   // every 5th hit; "below 20% health"; the bar's damage-taken factor never goes under x0.1 (it is applied after the 10% floor of hurtP: the hiker of the sim is AT that floor already)
const AB_RARS=['common','rare'], AB_RAR_W={common:70,rare:30}, AB_FAMS=['stat','combat','wild'];
function defineAbArt(r){
  const bad=why=>{ AB_ART_BAD.push({id:r&&typeof r.id==='string'?r.id:'?',why}); return false; };
  if(!r||typeof r!=='object') return bad('not an object');
  if(typeof r.id!=='string'||!/^[a-z][a-z0-9_]{1,31}$/.test(r.id)) return bad('id');
  if(AB_ARTS[r.id]) return bad('duplicate id');
  if(typeof r.name!=='string'||!r.name||r.name.length>32) return bad('name');
  if(AB_FAMS.indexOf(r.fam)<0) return bad('fam');
  if(AB_RARS.indexOf(r.rar)<0) return bad('rar');
  if(typeof r.icon!=='string'||!r.icon||r.icon.length>3) return bad('icon');
  if(typeof r.text!=='string'||!r.text||r.text.length>160) return bad('text');
  if(r.fam==='wild'&&(typeof r.minus!=='string'||!r.minus||r.minus.length>80)) return bad('a wildcard needs its minus (text)');
  if(r.minus!==undefined&&(typeof r.minus!=='string'||r.minus.length>80)) return bad('minus');
  if(!r.k||typeof r.k!=='object'||Array.isArray(r.k)) return bad('k');
  const ks=Object.keys(r.k); if(!ks.length) return bad('k is empty');
  for(const s of ks){ const v=r.k[s]; if(AB_STATS.indexOf(s)<0) return bad('stat '+s); if(typeof v!=='number'||!isFinite(v)) return bad('value of '+s);
    if(AB_RATE[s]?(v<=0||v>AB_CAPS[s]):(v<=0||v>100)) return bad('range of '+s); }
  AB_ARTS[r.id]={id:r.id,name:r.name,fam:r.fam,rar:r.rar,icon:r.icon,k:Object.assign({},r.k),text:r.text,minus:r.minus||''}; return true;
}
const abIsArt=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(AB_ARTS,id);
// the value of one stat over a bar (an array of artifact ids, a repeat id counts again): a product (1 with none) or, for a rate stat, the capped sum (0 with none)
function abArtStat(arts,stat){
  const rate=!!AB_RATE[stat]; let v=rate?0:1;
  for(const id of arts||[]){ const a=abIsArt(id)?AB_ARTS[id]:null, k=a&&a.k[stat]; if(k) v=rate?v+k:v*k; }
  return rate?Math.min(AB_CAPS[stat],v):v;
}
/* CURSES (B6): a row defined through defineAbCurse({id,name,icon,k,text}) in shared/abyss/curses.js; they sit on gear.ab.run.curses (at most AB_CURSE_MAX, a repeat stacks), OUTSIDE the 20 places.
   k = {stat: factor}: the hiker's own stats atk / hp / def / heal multiply into abP with the bar (def < 1 helps, so a curse on it is > 1); mhp and mdmg multiply every monster the run spawns (abSpawnS);
   offer is a count (offered cards fewer by that much, at least 1 stays). Events (B8) will hand them out; B6 has the engine and a dev way (devP 'abyss' curse). */
const AB_CURSES=Object.create(null), AB_CURSE_BAD=[], AB_CURSE_STATS=['atk','hp','def','heal','mhp','mdmg','offer'];
function defineAbCurse(r){
  const bad=why=>{ AB_CURSE_BAD.push({id:r&&typeof r.id==='string'?r.id:'?',why}); return false; };
  if(!r||typeof r!=='object') return bad('not an object');
  if(typeof r.id!=='string'||!/^ab_c_[a-z0-9_]{1,24}$/.test(r.id)) return bad('id');
  if(AB_CURSES[r.id]||AB_ARTS[r.id]) return bad('duplicate id');
  if(typeof r.name!=='string'||!r.name||r.name.length>32) return bad('name');
  if(typeof r.icon!=='string'||!r.icon||r.icon.length>3) return bad('icon');
  if(typeof r.text!=='string'||!r.text||r.text.length>160) return bad('text');
  if(!r.k||typeof r.k!=='object'||Array.isArray(r.k)) return bad('k');
  const ks=Object.keys(r.k); if(!ks.length) return bad('k is empty');
  for(const s of ks){ const v=r.k[s]; if(AB_CURSE_STATS.indexOf(s)<0) return bad('stat '+s); if(typeof v!=='number'||!isFinite(v)||v<=0||v>100) return bad('value of '+s); }
  AB_CURSES[r.id]={id:r.id,name:r.name,icon:r.icon,k:Object.assign({},r.k),text:r.text}; return true;
}
const abIsCurse=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(AB_CURSES,id);
// a stat over the curses held: the product of the factors (1 with none), or for `offer` the count (0 with none)
function abCurseStat(curses,stat){
  let v=stat==='offer'?0:1;
  for(const id of curses||[]){ const c=abIsCurse(id)?AB_CURSES[id]:null, k=c&&c.k[stat]; if(k) v=stat==='offer'?v+k:v*k; }
  return v;
}
// the run's layout, rebuilt by the client from the tile id and the seed (game/dungeon/run.js): a land or cave tile is a solid island (abTileLayout, shared/abyss/tiles.js); no tile (the Event and Shrine
// rounds of B8) is the Shardmere's plain rift platforms
const abLayout=(tile,seed)=>{ const T=abTileOf(tile); return T?abTileLayout(T,seed):riftLayout(RIFT_DEFS[AB_THEME]); };
// the snapshot's numbers (run.hud): [round, rounds (0 = Infinite), monsters alive or on their way, wave, waves, seconds to the next wave]  (dg[3]...dg[8])
DG_HUD.abyss=dg=>{ const r=dg[3]|0, n=dg[4]|0, left=dg[5]|0, w=dg[6]|0, ws=Math.max(1,dg[7]|0), clk=dg[8]|0;
  return {title:'The Abyss',lines:['Round '+r+(n?' / '+n:''),w?'Wave '+w+' / '+ws+(clk>0&&w<ws?' · next in '+clk+' s':''):'The tears open in '+clk+' s','Monsters: '+left],
    bar:{v:w,max:ws,col:'#9a5cff',label:'Wave '+w+' / '+ws},warn:false}; };
