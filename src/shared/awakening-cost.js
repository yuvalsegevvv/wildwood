//@ Awakening prices and stats: R (the coin yardstick), the level / stat-node / unlock / star / tier cost tables, stats by kit, awkNodeCost, awkTierCost, awkTreeCost, awkStatOf
/* Agent map (skills revamp step 8; design: PLAN sections 4a-4d; the tree: awakening-tree.js; tiers: awakening.js).
   exports: AWK_R_AVG, AWK_R_PER_KILL, awkR(L) (R = 3000 x the mean coins of a kill at hiker level L: THE one number step 20 tunes), awkShare(share, L) (a coin price as a share of R, to the thousand),
            AWK_STEP (coins / drops / branch material / Essence of a skill level 2-10), AWK_TROPHY, AWK_STAT_ROWS (s1-s9), AWK_STAT_DEPTH_STEP, awkStatRow(depth, tier), AWK_UNLOCK, AWK_STAR, AWK_TIER_COST,
            AWK_KIT_STATS (kit -> the stat of each limb), AWK_STAT_VALUE (stat -> [shallow, middle, deep]), AWK_PATH_KIT (the Wanderer's nine paths), awkInfo(set), awkKitOf(set, path),
            awkStatOf(set, nodeId, path) -> {stat, v, band, row}, awkNodeCost(set, nodeId), awkTierCost(set, tier), awkTreeCost(set) (every node and tier summed),
            AWK_ID_ECHO, AWK_ID_PRIME, awkRaidId(land), awkTrophyId(boss), awkEssenceId(el) (the placeholder item ids below).
   A cost is {coins, drops, land, mats:{id:n}, tier, hikerLv} or null (an unknown set or node: a junk id never throws). `drops` is a count of the character's land's monster drops (`land`; 'any' for the Wanderer, whose
   drops can be any land's), the zone rising with the tier: which MATS kind it is, is the server's (step 9). `mats` holds the rest, by PLACEHOLDER ids that later steps fill:
     'echo'              Echo Shards (today gear.cave.sh; step 9 moves them);        'rd_<land>'      the land's raid material (today gear.rd.mat; step 9 maps it)
     'trophy_<boss id>'  one world boss' own trophy (step 10 adds BOSS_TROPHY; 'trophy_any' = the Wanderer's: any boss's)
     'ess_<element>'     Essence of the character's element (step 17, the rifts);    'ess_prime' Prime Essence (step 17; also an element-less character's, and the Wanderer's)
   Used by: server/awakening.js (step 9, charging), game/awakening (step 15, the panel). Test: tools/awakening-smoke.js. */
// ---- R: one top-level Pipe release's net earnings (PLAN 4e). The mean coins of a kill at a hiker level, measured from coinsFor and kept as a table so a price never changes between two runs; step 20 re-measures (dipCoinAvg).
const AWK_R_AVG={20:312, 28:1100, 35:1818, 40:2431, 45:3259}, AWK_R_PER_KILL=3000;
function awkR(L){
  const ks=Object.keys(AWK_R_AVG).map(Number); L=+L||0;
  if(L<=ks[0]) return AWK_R_PER_KILL*AWK_R_AVG[ks[0]]*L/ks[0];
  for(let i=1;i<ks.length;i++) if(L<=ks[i]){ const a=ks[i-1], b=ks[i], t=(L-a)/(b-a); return AWK_R_PER_KILL*(AWK_R_AVG[a]+(AWK_R_AVG[b]-AWK_R_AVG[a])*t); }
  return AWK_R_PER_KILL*AWK_R_AVG[ks[ks.length-1]];
}
const awkShare=(share,L)=>Math.round(share*awkR(L)/1000)*1000;
// ---- the price tables. A coin price is a number or {r:share, at:the hiker level it is priced at}; drops, mat (branch material), ess (Essence), troph (see AWK_TROPHY)
// a skill level step, by the level it reaches (PLAN 4b; the skill branch, x1.0); branch totals 9.2M coins, 1017 drops, 109 branch material, 90 Essence
const AWK_STEP=[null,null,
  {coins:300,drops:4,mat:1}, {coins:700,drops:8,mat:2}, {coins:1500,drops:15,mat:3}, {coins:3000,drops:25,mat:5},
  {coins:{r:0.03,at:20},drops:45,mat:8}, {coins:{r:0.08,at:28},drops:80,mat:12,ess:12}, {coins:{r:0.15,at:35},drops:140,mat:18,ess:18},
  {coins:{r:0.3,at:40},drops:250,mat:25,ess:25}, {coins:{r:0.6,at:45},drops:450,mat:35,ess:35}];
// trophies of the power (boss 1's) and charge (boss 2's) branches, by the level reached: 163 a branch
const AWK_TROPHY=[0,0,1,2,4,6,10,15,25,40,60];
// the stat nodes, by price row s1-s9 (PLAN 4c); Essence only from s7
const AWK_STAT_ROWS=[null,
  {coins:500,drops:5}, {coins:1000,drops:8}, {coins:2000,drops:12}, {coins:5000,drops:18}, {coins:12000,drops:25}, {coins:{r:0.015,at:20},drops:35},
  {coins:{r:0.03,at:28},drops:50,ess:5}, {coins:{r:0.08,at:35},drops:70,ess:7}, {coins:{r:0.15,at:45},drops:100,ess:10}];
const AWK_STAT_DEPTH_STEP=3;   // a stat node's depth / this = how many rows up the table it is: the price follows depth, but never above what its tier can bear (awkStatRow)
const AWK_UNLOCK={coins:5000,drops:20,mat:3};   // pa1, ch1, bu1: the node that makes the skill yours
const AWK_STAR=[null, {coins:{r:0.1,at:35},drops:150,troph:20,ess:20}, {coins:{r:0.3,at:45},drops:300,troph:40,ess:40}];   // star1 / star2: trophies of EACH of the land's two bosses
// tiers A1-A5 (PLAN 4a): coins, drops, shards (Echo), raid material, Prime, Essence, trophies of each of the land's two bosses
const AWK_TIER_COST=[null,
  {coins:2000,drops:20}, {coins:{r:0.015,at:20},drops:50,echo:10}, {coins:{r:0.05,at:28},drops:100,raid:2},
  {coins:{r:0.15,at:35},drops:200,raid:5,prime:20,ess:30}, {coins:{r:0.5,at:45},drops:350,raid:10,prime:30,ess:50,troph:2}];
// the row of a stat node: its depth sets it (AWK_STAT_DEPTH_STEP nodes a row, at most s9), its tier caps it (A0 s4, A1 s5 ... A5 s9) so Essence never lands before the stage that can pay it
function awkStatRow(depth,tier){
  const cap=Math.min(9,AWK_TIERS[Math.max(0,Math.min(AWK_TIERS.length-1,tier|0))].cap);
  return Math.max(1,Math.min(9,cap,1+Math.floor(((+depth||1)-1)/AWK_STAT_DEPTH_STEP)));
}
// ---- stats by kit (PLAN 4c): the stat of each limb's stat nodes, and its value by band (the row's: s1-s3 shallow, s4-s6 middle, s7-s9 deep)
const AWK_KIT_STATS={
  safe:   {ba:'crit', sk:'dmg',  po:'dmg',  pa:'hp',   ch:'cd',  bu:'crit'},
  risk:   {ba:'dmg',  sk:'crit', po:'dmg',  pa:'move', ch:'cd',  bu:'dmg'},
  grind:  {ba:'move', sk:'dmg',  po:'drop', pa:'xp',   ch:'cd',  bu:'dmg'},
  support:{ba:'cd',   sk:'eff',  po:'eff',  pa:'hp',   ch:'red', bu:'dmg'},
  heal:   {ba:'heal', sk:'heal', po:'eff',  pa:'hp',   ch:'cd',  bu:'red'},
  tank:   {ba:'hp',   sk:'red',  po:'eff',  pa:'hp',   ch:'red', bu:'dmg'}
};
const AWK_STAT_VALUE={dmg:[0.005,0.01,0.015], crit:[0.003,0.006,0.01], cd:[-0.005,-0.01,-0.015], hp:[0.01,0.02,0.03], red:[-0.005,-0.01,-0.015], move:[0.005,0.01,0.015],
  drop:[0.02,0.03,0.05], xp:[0.005,0.01,0.015], heal:[0.01,0.02,0.03], eff:[0.01,0.02,0.03]};
const AWK_BANDS=['shallow','middle','deep'];
// the Wanderer's nine paths pick the table (PLAN section 7: "the branch stats follow the active path's table"); the path ids are placeholders until step 12 defines them
const AWK_PATH_KIT={bulwark:'tank', fury:'risk', keeneye:'safe', stalwart:'tank', tempo:'safe', forager:'grind', lorekeeper:'grind', wayfarer:'risk', prism:'safe'}, AWK_PATH_DEFAULT='safe';
// ---- who is paying: {id, land, el (null: Prime instead of Essence), kit, bosses:[boss 1, boss 2]} from a set object or id, or the Wanderer; null for anything else
function awkInfo(set){
  if(set==='wanderer'||(set&&typeof set==='object'&&set.id==='wanderer')) return {id:'wanderer', land:'any', el:null, kit:null, bosses:['any','any']};
  const s=typeof set==='string'?(awkHas(SS_SETS,set)?SS_SETS[set]:null):set;
  if(!s||typeof s!=='object'||typeof s.id!=='string'||typeof s.land!=='string'||!awkHas(SS_SOURCES,s.land)) return null;
  const kit=s.role&&typeof s.role.main==='string'&&awkHas(AWK_KIT_STATS,s.role.main)?s.role.main:null;
  return {id:s.id, land:s.land, el:typeof s.el==='string'&&s.el!=='basic'?s.el:null, kit, bosses:[SS_SOURCES[s.land][0],SS_SOURCES[s.land][1]]};
}
function awkKitOf(set,path){
  const I=awkInfo(set); if(!I) return null;
  if(I.id==='wanderer') return typeof path==='string'&&awkHas(AWK_PATH_KIT,path)?AWK_PATH_KIT[path]:AWK_PATH_DEFAULT;
  return I.kit;
}
// what a stat node gives: {stat, v (a share, negative for cd / red), band, row}; null for anything that is not a stat node of the set's tree. A character may override a branch later (its file's `awk.stats`, not read yet)
function awkStatOf(set,nodeId,path){
  const kit=awkKitOf(set,path), n=awkNode(awkShapeOf(set),nodeId); if(!kit||!n||n.kind!=='stat') return null;
  const stat=AWK_KIT_STATS[kit][n.limb], row=awkStatRow(n.depth,n.tier), band=row<=3?0:row<=6?1:2;
  return {stat, v:AWK_STAT_VALUE[stat][band], band:AWK_BANDS[band], row};
}
// ---- the placeholder item ids (see the agent map)
const AWK_ID_ECHO='echo', AWK_ID_PRIME='ess_prime';
const awkRaidId=land=>'rd_'+land, awkTrophyId=boss=>'trophy_'+boss, awkEssenceId=el=>el?'ess_'+el:AWK_ID_PRIME;
const awkCoins=c=>typeof c==='number'?c:awkShare(c.r,c.at);
function awkAdd(mats,id,n){ if(n>0) mats[id]=(mats[id]||0)+n; }
// the branch material of a limb for this payer: Echo Shards or the land's raid material
const awkBranchMat=(I,limb)=>AWK_LIMBS[limb].mat==='echo'?AWK_ID_ECHO:awkRaidId(I.land);
function awkBlank(I,tier){ return {coins:0, drops:0, land:I.land, mats:{}, tier, hikerLv:AWK_TIERS[tier].lv}; }
// the price of one node of a character's tree: {coins, drops, land, mats, tier, hikerLv}, or null (unknown set, unknown or junk node id)
function awkNodeCost(set,nodeId){
  const I=awkInfo(set), n=I&&awkNode(awkShapeOf(set),nodeId); if(!n) return null;
  const c=awkBlank(I,n.tier), Lm=AWK_LIMBS[n.limb];
  if(n.kind==='star'){
    const R=AWK_STAR[n.n]; c.coins=awkCoins(R.coins); c.drops=R.drops;
    awkAdd(c.mats,awkTrophyId(I.bosses[0]),R.troph); awkAdd(c.mats,awkTrophyId(I.bosses[1]),R.troph); awkAdd(c.mats,awkEssenceId(I.el),R.ess);
  } else if(n.kind==='stat'){
    const R=AWK_STAT_ROWS[awkStatRow(n.depth,n.tier)]; c.coins=Math.round(awkCoins(R.coins)*Lm.k); c.drops=Math.round(R.drops*Lm.k); awkAdd(c.mats,awkEssenceId(I.el),R.ess||0);
  } else if(n.lv<=1){
    c.coins=AWK_UNLOCK.coins; c.drops=AWK_UNLOCK.drops; awkAdd(c.mats,awkBranchMat(I,n.limb),AWK_UNLOCK.mat);
  } else {
    const R=AWK_STEP[n.lv]; if(!R) return null;
    c.coins=Math.round(awkCoins(R.coins)*Lm.k); c.drops=Math.round(R.drops*Lm.k);
    awkAdd(c.mats,awkBranchMat(I,n.limb),R.mat); awkAdd(c.mats,awkEssenceId(I.el),R.ess||0);
    if(Lm.troph) awkAdd(c.mats,awkTrophyId(I.bosses[Lm.troph-1]),AWK_TROPHY[n.lv]);
  }
  return c;
}
// the price of raising a character to tier 1-5 (tier 0 is free); null for any other tier
function awkTierCost(set,tier){
  const I=awkInfo(set); if(!I||!Number.isInteger(tier)||tier<0||tier>=AWK_TIERS.length) return null;
  const c=awkBlank(I,tier), R=AWK_TIER_COST[tier]; if(!R) return c;
  c.coins=awkCoins(R.coins); c.drops=R.drops;
  awkAdd(c.mats,AWK_ID_ECHO,R.echo||0); awkAdd(c.mats,awkRaidId(I.land),R.raid||0); awkAdd(c.mats,AWK_ID_PRIME,R.prime||0); awkAdd(c.mats,awkEssenceId(I.el),R.ess||0);
  awkAdd(c.mats,awkTrophyId(I.bosses[0]),R.troph||0); awkAdd(c.mats,awkTrophyId(I.bosses[1]),R.troph||0);
  return c;
}
// the whole tree and every tier summed: {coins, drops, mats, nodes}; null for an unknown set
function awkTreeCost(set){
  const I=awkInfo(set), sh=awkShapeOf(set); if(!I||!sh) return null;
  const t={coins:0, drops:0, land:I.land, mats:{}, nodes:0};
  const sum=c=>{ t.coins+=c.coins; t.drops+=c.drops; for(const k of Object.keys(c.mats)) awkAdd(t.mats,k,c.mats[k]); };
  for(const n of sh.nodes){ sum(awkNodeCost(set,n.id)); t.nodes++; }
  for(let k=1;k<AWK_TIERS.length;k++) sum(awkTierCost(set,k));
  return t;
}
