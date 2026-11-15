//@ The Abyss (a solo roguelike mode, behind AB_ON): the flag, the six difficulties, the round level table, the boss rounds and the caps. Pure; loaded by both sides
/* agent map (docs/ABYSS.md; the plan: abyss-plan/PLAN.md)
   exports: AB_ON, abSwitch(on), AB_DIFFS (6 rows {id,name,lo,hi,rounds}: I-V then Infinite; hi / rounds 0 = no end), AB_INF (the index of Infinite, 5), abRoundLv(d,r), abRounds(d),
            abBossRounds(d) (the finite list; for Infinite the first AB_BOSS_SHOWN), abIsBossRound(d,r), AB_ART_MAX (20 artifacts at once), AB_RANK_MAX (5 copies), AB_CURSE_MAX (5),
            AB_ENTRY_LV (40), AB_AS_MAX / AB_LOCK_MAX (save caps of gear.ab.as / .lock), AB_RUN_KEEP_S (a saved run older than this is dropped), AB_THEME (the rift def a run borrows its look and kinds from for now),
            B4: AB_ARTS (the artifact registry, Object.create(null)), AB_ART_BAD, defineAbArt(row), AB_STATS / AB_RATE / AB_CAPS / AB_RARS / AB_RAR_W, abArtStat(arts,stat) (the pure product / capped sum of a bar), AB_OFFER_N (3), B6: AB_NTH / AB_EXEC_HP / AB_DEF_MIN, AB_CURSES / AB_CURSE_BAD / defineAbCurse(row) / abIsCurse / abCurseStat(curses,stat) (the curse registry), AB_WAVES / AB_COUNT_S / AB_WAVE_S / AB_RELEASE_S / AB_ALIVE_MAX / AB_NEXT_PCT / AB_DEATH_S, abWaveSize(r,w), abLayout(tile,seed) (B7: the tile's island or the rift's plain platforms; B8: 'rift:<id>' a Trial's platforms), B8: AB_KIND_IDS / AB_KIND_W / AB_KIND_PICKS / AB_KIND_INFO, AB_TRIAL_MODES / AB_TRIAL_IDS, abIsKind / abIsEncKind, abEncWindow(r), AB_EVENTS / AB_EVENT_BAD / defineAbEvent / abIsEvent (the registry of the Events), DG_HUD.abyss (the run's HUD row)
   users: server/abyss/arts.js (abP), shared/abyss/artifacts-stat.js (the entries), game/abyss/choice.js,
          server/abyss.js (the flag, the window, the save), server/abyss/rounds.js (the run), server/abyss/events.js + trial.js (B8), game/dungeon/run.js (abLayout); later steps: the run, the artifacts, the client panel
   test: tools/abyss-smoke.js
   Round levels: every finite difficulty climbs 10 levels every 3 rounds, so ONE formula, abRoundLv(d,r) = lo + round((r-1)*10/3): difficulty I (lo 40) gives 40, 43, 47, 50, 53, 57, 60 (the
   last digit cycles 0, 3, 7), V reaches 140 at round 19, Infinite (lo 90, no end) reaches 180 at round 28. Boss rounds: 7, 13, 19... (every 6 from 7) and the last round of a finite difficulty. */
let AB_ON=true;   // the mode's switch (on since step B12); the server also opens it in the test world and with the dev tools (abOnS, server/abyss.js)
function abSwitch(on){ AB_ON=!!on; }
const AB_DIFFS=[
  {id:'I',name:'Difficulty I',lo:40,hi:60,rounds:7},
  {id:'II',name:'Difficulty II',lo:50,hi:80,rounds:10},
  {id:'III',name:'Difficulty III',lo:60,hi:100,rounds:13},
  {id:'IV',name:'Difficulty IV',lo:70,hi:120,rounds:16},
  {id:'V',name:'Difficulty V',lo:80,hi:140,rounds:19},
  {id:'INF',name:'Infinite',lo:90,hi:0,rounds:0}];
const AB_INF=5, AB_ART_MAX=20, AB_RANK_MAX=5, AB_CURSE_MAX=5, AB_ENTRY_LV=40, AB_BOSS_SHOWN=8, AB_AS_MAX=999999999, AB_LOCK_MAX=9999, AB_PRISM_MAX=9999, AB_HEART_MAX=9999, AB_RUN_KEEP_S=1800;
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
/* ROUND KINDS (B8, plan section 3): what an offered tile pays and does. AB_KIND_W are the draw weights (B9: boss 5, offered between the forced boss rounds, never on round 1 or right after a boss), AB_KIND_PICKS the artifact picks a won round pays (an Event or a Shrine pays none:
   its own card is the reward), AB_TRIAL_MODES the rift each Trial mode borrows its platforms from. A guaranteed Event or Shrine lies in rounds 4-6, 10-12, 16-18... (abEncWindow(r): the window's first round or 0). */
const AB_KIND_IDS=['fight','elite','trial','event','shrine','boss'], AB_KIND_W={fight:45,elite:15,trial:10,event:15,shrine:10,boss:5}, AB_KIND_PICKS={fight:1,elite:2,trial:2,event:0,shrine:0,boss:3};
const AB_KIND_INFO={fight:{name:'Fight',icon:'⚔',col:'#d4694a'},elite:{name:'Elite',icon:'★',col:'#f0c040'},trial:{name:'Trial',icon:'◈',col:'#5ab4ff'},event:{name:'Event',icon:'?',col:'#c08aff'},shrine:{name:'Shrine',icon:'✚',col:'#6fd68a'},boss:{name:'Boss',icon:'☠',col:'#ff5a5a'}};
const AB_TRIAL_MODES={heart:'taproot',gale:'petal',beacons:'sunlit',thaw:'rime',lanterns:'longnight',quarry:'stone',gauntlet:'forge'}, AB_TRIAL_IDS=Object.keys(AB_TRIAL_MODES);
const abIsKind=k=>typeof k==='string'&&AB_KIND_IDS.indexOf(k)>=0, abIsEncKind=k=>k==='event'||k==='shrine';
const abEncWindow=r=>{ r=r|0; return r>=4&&(r-4)%6<3?r-((r-4)%6):0; };
/* ENCOUNTERS (B8): an Event is a card of 2-3 choices, a row defined through defineAbEvent({id,name,icon,text,choices:[{label,text,fx:[ops]}]}) in shared/abyss/events.js. An op is data the server runs
   (server/abyss/events.js): {op:'art',rar?:'common'|'rare',fam?:'stat'|'combat'|'wild',n?} a random artifact of the pool (every copy takes one of the 20 places), {op:'lose',n?} a random copy thrown away,
   {op:'curse',n?} a random curse, {op:'uncurse'} one curse off, {op:'heal'} full health, {op:'gamble',p,win:[ops],lose:[ops]}. Order a row's ops losses first, so a full bar can still trade. */
const AB_EVENTS=Object.create(null), AB_EVENT_BAD=[], AB_EV_OPS=['art','lose','curse','uncurse','heal','gamble'];
function abEvOpsBad(ops,depth){
  if(!Array.isArray(ops)||ops.length>4) return 'fx is a list of at most 4 ops';
  for(const o of ops){ if(!o||typeof o!=='object'||AB_EV_OPS.indexOf(o.op)<0) return 'unknown op';
    if(o.n!==undefined&&!(Number.isInteger(o.n)&&o.n>=1&&o.n<=3)) return 'n is 1-3';
    if(o.op==='art'&&((o.rar!==undefined&&AB_RARS.indexOf(o.rar)<0)||(o.fam!==undefined&&AB_FAMS.indexOf(o.fam)<0))) return 'art: rar / fam';
    if(o.op==='gamble'){ if(depth>0) return 'a gamble inside a gamble'; if(!(o.p>0&&o.p<1)) return 'gamble p is between 0 and 1'; const w=abEvOpsBad(o.win,1)||abEvOpsBad(o.lose,1); if(w) return w; } }
  return '';
}
function defineAbEvent(r){
  const bad=why=>{ AB_EVENT_BAD.push({id:r&&typeof r.id==='string'?r.id:'?',why}); return false; };
  if(!r||typeof r!=='object') return bad('not an object');
  if(typeof r.id!=='string'||!/^ab_ev_[a-z0-9_]{1,24}$/.test(r.id)) return bad('id');
  if(AB_EVENTS[r.id]) return bad('duplicate id');
  for(const k of ['name','icon','text']) if(typeof r[k]!=='string'||!r[k]||r[k].length>(k==='icon'?3:k==='name'?32:200)) return bad(k);
  if(!Array.isArray(r.choices)||r.choices.length<2||r.choices.length>3) return bad('2-3 choices');
  for(const c of r.choices){ if(!c||typeof c!=='object'||typeof c.label!=='string'||!c.label||c.label.length>40||typeof c.text!=='string'||!c.text||c.text.length>160) return bad('a choice needs label and text'); const w=abEvOpsBad(c.fx,0); if(w) return bad('choice '+c.label+': '+w); }
  AB_EVENTS[r.id]={id:r.id,name:r.name,icon:r.icon,text:r.text,choices:r.choices.map(c=>({label:c.label,text:c.text,fx:JSON.parse(JSON.stringify(c.fx))}))}; return true;
}
const abIsEvent=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(AB_EVENTS,id);
// the run's layout, rebuilt by the client from the tile id and the seed (game/dungeon/run.js): a land or cave tile is a solid island (abTileLayout, shared/abyss/tiles.js); no tile (the Event and Shrine
// rounds of B8) is the Shardmere's plain rift platforms
const abLayout=(tile,seed)=>{ const bt=typeof tile==='string'&&tile.startsWith('boss:'), T=abTileOf(abTileBase(tile)), tr=!T&&typeof tile==='string'&&tile.startsWith('rift:')?RIFT_DEFS[tile.slice(5)]:null; return T?abTileLayout(T,seed,bt):riftLayout(tr||RIFT_DEFS[AB_THEME]); };   // B9: 'boss:<tile>' = that land's boss disc   // B8: 'rift:<id>' = a Trial's platforms (the mode's own rift shape)
// the snapshot's numbers (run.hud): [round, rounds (0 = Infinite), monsters alive or on their way, wave, waves, seconds to the next wave, kind code (AB_KIND_IDS index)]  (dg[3]...dg[9]);
// a Trial's HUD is the rift mode's own tuple (dg[3]...dg[10], shared/rift.js DG_HUD.rift) with 1, the round and the rounds after it (dg[11]...dg[13])
DG_HUD.abyss=(dg,th)=>{ const r=dg[3]|0, n=dg[4]|0, left=dg[5]|0, w=dg[6]|0, ws=Math.max(1,dg[7]|0), clk=dg[8]|0, kc=dg[9]|0, rl='Round '+r+(n?' / '+n:'');
  if((dg[11]|0)===1){ const h=DG_HUD.rift(dg,th), rr=dg[12]|0, nn=dg[13]|0; h.lines.pop(); h.lines.unshift('Round '+rr+(nn?' / '+nn:'')); h.title='Trial: '+h.title; return h; }   // (the rift's last line is its XP count)
  if(kc===5) return {title:'The Abyss: Boss',lines:[rl,'Defeat the boss'],bar:{v:0,max:1,col:'#ff5a5a',label:'Boss'},warn:false};   // B9 (the boss's own bar is the run's boss bar)
  if(kc===3||kc===4) return {title:'The Abyss',lines:[rl,kc===3?'An Event: choose':'A Shrine: choose'],bar:{v:0,max:1,col:'#9a5cff',label:kc===3?'Event':'Shrine'},warn:false};
  return {title:kc===1?'The Abyss: Elite':'The Abyss',lines:[rl,w?'Wave '+w+' / '+ws+(clk>0&&w<ws?' · next in '+clk+' s':''):'The tears open in '+clk+' s','Monsters: '+left],
    bar:{v:w,max:ws,col:kc===1?'#f0c040':'#9a5cff',label:'Wave '+w+' / '+ws},warn:false}; };
