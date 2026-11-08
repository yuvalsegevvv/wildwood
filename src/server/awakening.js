//@ Awakening on the server: gear.awk (each character's tier and bought tree nodes), buying a tier, an upgrade node or a stat node (MSG.awk), the skill levels the trees give, the stat nodes' totals, Echo Shards (gear.awm) and the smv-2 migration
/* Agent map (skills revamp step 9; design: PLAN section 4 and 9; the data: shared/awakening.js (tiers, curves), awakening-tree.js (AWK_SHAPES), awakening-cost.js (prices, awkStatOf)).
   SAVED: gear.awk = {<set id | 'wanderer'>: {t: tier 0-5, n: {<node id>: 1}}} (awkSanitize: known set ids with a tree shape and 'wanderer' only, own-property checks, node ids of that shape
          only, a node above the tier dropped, a node whose same-limb parent is missing dropped; a fork, a join or a via is NOT re-checked: the migration grants limbs without their fork).
          gear.awm = {echo: n} the Awakening store (AWK_STORE_IDS; Echo Shards moved here from gear.cave.sh, an old save's count folded in once: caveSanitizeSave no longer writes sh).
   MESSAGE: awk {a:'tier', set} | {a:'up', set, id} | {a:'stat', set, id} (MSG.awk; set = a set id or 'wanderer'). Each returns null when bought, else the reason (also toasted).
          awkTierP: the next tier; hiker level AWK_TIERS[t].lv; awkTierCost. awkLevelP ('up' and the two 'star' nodes) / awkStatP ('stat'): the node exists in that character's shape and is of that kind,
          not owned, the tier reached, the hiker level of its tier, every req owned (the parent, a Banyan via, the crown's joins); awkNodeCost. A set needs Bond 0 (bdOwns, server/bond.js); pa1 makes its kept passive yours.
          PAYING (awkPlanP, then awkTakeP): coins, `drops` of the character's land's monster kinds (awkDropKinds: the land's non-boss kinds from the tier's share of its level range up; the
          Wanderer's: any land's, from the tier's hiker level - 5), taken from the kinds held most; 'echo' from gear.awm; 'rd_<land>' from gear.rd.mat ('rd_any': any land's). Everything is checked first and
          taken after; trophy_<boss> from gear.awm (step 10a; 'trophy_any': any boss's), ess_<element> / ess_prime from gear.awm (step 17a, paid by the elemental rifts: server/rift.js; awkEssenceP adds, awkSanitize clamps to MAT_MAX), an unknown id refuses the purchase with a reason. Event awk [pid, set, 't' | node id, tier]; p.dirty; recalcP; mqActP 'upskill' (main quest W10).
          ch1 makes the charge skill yours (a set's own; the Wanderer's: the general ones, set null); bu1 makes the burst usable (awkUltLvP >= 1, read by ultEquippedP / ultEquipP).
   LEVELS (awkSyncG(gear), run by recalcP, ssGrantP, sanitizeGear): a set piece's level = its branch (awkBranchLv: the deepest upgrade node owned in a row, a limb with an unlock node starts at 0),
          capped by the tier's cap: the actives of position 1 / 2 / 3 -> ba / sk / po, the kept passive -> pa, the set's charge skill -> ch (gear.cave.own), the burst -> bu (awkUltLvP, read by ultCastP).
          Written into gear.skills.lv and gear.cave.own, so skillLvOf / caveLvOf and every reader (combat, the panel) follow the tree. A Bond passive keeps its saved level (it works at BD_PASS_LV through the Bond). The active Bond's level changes (III / V +1, a guest -2) are not written here: gear.skills.bdx.lv, added by skillLvOf / caveLvOf / awkUltLvP. A shop skill / passive /
          general charge skill: the Wanderer's branch of its slot (basic ba, skill sk, burst po, passive pa, charge ch), never below its saved level (saved levels are trusted only up to SKILL_OLD_MAX_LV).
   STATS (awkStatsP, run by recalcP): the stat nodes of the character played (bdMainOf, server/bond.js: the worn power piece's set, else the most pieces worn, else the Wanderer), summed into gear.skills.aw
          {passive stat: v}, read by passiveSum (classes.js) like a passive: dmg crit hp drop xp heal move as they are, eff -> buffpow, cd / red as a positive cut.
   MIGRATION (awkMigrateG(gear), called by smigSanitize for a save older than smv 2): every set of which a piece is owned (gear.bdMig, the owned actives and passives, an owned charge skill): its
          branches get the nodes up to the old level (both kinds: the stat nodes below it too), the kept passive pa1..L, the charge skill ch1..L, an owned burst bu1, and the tier that covers it all
          (a level's tier, A1 for the passive, A2 the charge skill, A3 the burst). Only adds (a union, the tier a max): running it twice changes nothing, nobody loses a level.
   TESTING: awkGrantP(p, set, tier, ids?) (dev 'awk' {v: set id | 'all', n: tier}: the whole tree to that tier; testKitP: every tree full). Test: tools/awakening-server-smoke.js. Hooks: grep -rn "// awakening:" src */
const AWK_WANDERER='wanderer', AWK_STORE_IDS=['echo'], AWK_STORE_MAX=99999;
const AWK_POS_LIMB=[null,'ba','sk','po'], AWK_SLOT_LIMB={basic:'ba',skill:'sk',burst:'po',passive:'pa'};
const AWK_STAT_PS={dmg:'dmg',crit:'crit',cd:'cd',hp:'hp',red:'red',move:'move',drop:'drop',xp:'xp',heal:'heal',eff:'buffpow'};   // a stat node's stat -> the passive stat passiveSum reads
const AWK_MAT_NAME={echo:'Echo Shards'};
const awkOwn=(o,k)=>!!o&&typeof o==='object'&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
// a character key a save or a message may name: a set with a tree shape, or the Wanderer
const awkKeyOk=k=>typeof k==='string'&&(k===AWK_WANDERER||(awkOwn(SS_SETS,k)&&!!awkShapeOf(k)));
// ---- saves ----
function awkCleanEntry(k,e){
  if(!e||typeof e!=='object'||Array.isArray(e)) return null;
  const sh=awkShapeOf(k), t=clampInt(e.t,0,AWK_TIERS.length-1,0), n={}, N=e.n&&typeof e.n==='object'&&!Array.isArray(e.n)?e.n:null, want=new Set();
  if(N) for(const id of Object.keys(N).slice(0,256)){ const nd=awkNode(sh,id); if(nd&&nd.tier<=t&&N[id]) want.add(id); }
  for(const nd of sh.nodes){ if(!want.has(nd.id)) continue; const P=nd.parent?sh.byId[nd.parent]:null; if(!P||P.limb!==nd.limb||n[P.id]) n[nd.id]=1; }   // (shape order: a limb's nodes come root-first)
  return {t,n};
}
function awkSanitize(g,out){   // sanitizeGear: gear.awk and gear.awm from a save
  const A={}, raw=g&&g.awk&&typeof g.awk==='object'&&!Array.isArray(g.awk)?g.awk:null;
  if(raw) for(const k of Object.keys(raw).slice(0,64)){ if(!awkKeyOk(k)) continue; const e=awkCleanEntry(k,raw[k]); if(e) A[k]=e; }
  out.awk=A;
  const W=g&&g.awm&&typeof g.awm==='object'&&!Array.isArray(g.awm)?g.awm:null, M={};
  for(const id of AWK_STORE_IDS){ const n=awkOwn(W,id)?clampInt(W[id],0,AWK_STORE_MAX,0):0; if(n) M[id]=n; }
  for(const id of ESS_ORDER){ const n=awkOwn(W,id)?clampInt(W[id],0,MAT_MAX,0):0; if(n) M[id]=n; }   // Essence (step 17a): only the registry's seven ids, clamped to MAT_MAX
  for(const id of BT_ORDER){ const n=awkOwn(W,id)?clampInt(W[id],0,BT_MAX,0):0; if(n) M[id]=n; }   // boss trophies: only the registry's ids, each own property of the save
  const sh=g&&g.cave&&typeof g.cave==='object'?clampInt(g.cave.sh,0,99999,0):0; if(sh) M.echo=Math.min(AWK_STORE_MAX,(M.echo||0)+sh);   // an old save's Echo Shards (gear.cave.sh, no longer written)
  out.awm=M;
}
// boss trophies (step 10a): a world boss kill pays 2^tier of the boss's own trophy (rewardKill), kept in gear.awm under its id
function awkTrophyP(p,bossId,tier){
  const t=btOfBoss(bossId); if(!t) return 0;
  const w=p.gear.awm||(p.gear.awm={}), have=awkOwn(w,t.id)?w[t.id]|0:0, add=Math.min(btCount(tier),BT_MAX-have); if(add<=0) return 0;
  w[t.id]=have+add; p.dirty=true; toastTo(p.id,'+'+add+' '+t.name,'good'); return add;
}
// Essence (step 17a): a rift's pay, kept in gear.awm under its id (ess_<element> | ess_prime); returns how many were added (the pile stops at MAT_MAX)
function awkEssenceP(p,id,n){
  if(!essOf(id)) return 0;
  const w=p.gear.awm||(p.gear.awm={}), have=awkOwn(w,id)?w[id]|0:0, add=Math.min(Math.max(0,n|0),MAT_MAX-have); if(add<=0) return 0;
  w[id]=have+add; p.dirty=true; return add;
}
const awkEntry=(gear,k)=>gear&&awkOwn(gear.awk,k)?gear.awk[k]:null;
const awkEntryW=(gear,k)=>awkEntry(gear,k)||(gear.awk[k]={t:0,n:{}});
// ---- levels ----
// the level a limb's skill has from the tree: the deepest upgrade node owned in a row (a limb with an unlock node starts at 0, the others at 1), capped by the tier
function awkBranchLv(gear,k,limb){
  const Lm=awkOwn(AWK_LIMBS,limb)?AWK_LIMBS[limb]:null; if(!Lm) return 0;
  const e=awkEntry(gear,k); let L=Lm.first-1; if(!e) return L;
  for(let lv=Lm.first;lv<=AWK_TOP;lv++){ if(e.n[awkUpId(limb,lv)]===1) L=lv; else break; }
  return Math.min(L,AWK_TIERS[e.t].cap);
}
const awkUltLvP=(p,setId)=>{ const L=awkBranchLv(p&&p.gear,wdIsUlt(setId)?AWK_WANDERER:setId,'bu');   // wanderer: a path's burst is the Wanderer's bu branch
   return L>0?bdLvAdj(p.gear.skills,'u:'+setId,L):0; };   // the burst's level: 0 = not usable (bu1 needs A3)   // bond: the active Bond's level change ('u:<set>')
function awkSetLv(sk,id,L){ if(L>1) sk.lv[id]=L; else delete sk.lv[id]; }
// write the trees' levels into gear.skills.lv and gear.cave.own (see the agent map)
function awkSyncG(gear){
  const sk=gear&&gear.skills; if(!sk||!Array.isArray(sk.owned)||!sk.lv) return;
  for(const id of sk.owned){
    const pc=SS_PIECE_OF[id];
    if(pc){ const S=SS_SETS[pc.set]; if(!S||!awkShapeOf(S)) continue;
      if(pc.kind==='active') awkSetLv(sk,id,awkBranchLv(gear,pc.set,AWK_POS_LIMB[pc.pos]));
      else if(id===S.keptPassive) awkSetLv(sk,id,awkBranchLv(gear,pc.set,'pa'));
      continue; }   // a Bond passive (step 12) keeps its saved level
    const d=skillDef(id), limb=d&&awkOwn(AWK_SLOT_LIMB,d.slot)?AWK_SLOT_LIMB[d.slot]:null; if(!limb) continue;
    const W=awkBranchLv(gear,AWK_WANDERER,limb); if(W>((sk.lv[id]|0)||1)) awkSetLv(sk,id,W);   // (the saved level, not skillLvOf: that adds the active Bond's change)
  }
  const own=gear.cave&&gear.cave.own; if(!own) return;
  for(const id of Object.keys(own)){ const c=caveSkillDef(id); if(!c) continue;
    if(c.set){ if(awkShapeOf(c.set)) own[id]=Math.max(1,awkBranchLv(gear,c.set,'ch')); }
    else { const W=awkBranchLv(gear,AWK_WANDERER,'ch'); if(W>own[id]) own[id]=W; } }
}
// ---- stats ----
function awkStatsP(p){
  const key=bdMainOf(p), e=awkEntry(p.gear,key), out={};   // bond: the main character (server/bond.js)
  if(e) for(const id of Object.keys(e.n)){ const s=awkStatOf(key,id,key===AWK_WANDERER?wdPathOf(p.gear):null); if(!s) continue; const ps=AWK_STAT_PS[s.stat]; if(ps) out[ps]=(out[ps]||0)+(s.stat==='cd'||s.stat==='red'?-s.v:s.v); }   // wanderer: the active path's table
  for(const k of Object.keys(out)) out[k]=Math.round(out[k]*10000)/10000;
  p.gear.skills.aw=out; p.awMain=key;
}
function awkRefreshP(p){ awkSyncG(p.gear); awkStatsP(p); }   // recalcP
// ---- paying ----
// (awkLandDefs / awkDropKinds, the kinds whose drops pay a price, are shared: shared/awakening-cost.js, the panel shows the same count)
function awkRaidStock(p,land){   // [[land, n]] the raid material that pays rd_<land>
  const m=rdMatsOf(p); if(land==='any') return Object.keys(m).filter(l=>m[l]>0).map(l=>[l,m[l]]);
  return awkOwn(m,land)&&m[land]>0?[[land,m[land]]]:[];
}
const awkMatName=id=>awkOwn(AWK_MAT_NAME,id)?AWK_MAT_NAME[id]:btOf(id)?btOf(id).name:essOf(id)?essOf(id).name:id.startsWith('rd_')?((rdOfLand(id.slice(3))||{}).mat||'raid material'):id;
// greedy take of n from [[key, have]], the biggest stock first: [[key, n]] or null when there is not enough
function awkGreedy(stock,n){
  if(!(n>0)) return [];
  const s=stock.slice().sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)), out=[]; let left=n;
  for(const [k,h] of s){ if(left<=0) break; const t=Math.min(h,left); if(t>0){ out.push([k,t]); left-=t; } }
  return left>0?null:out;
}
// check a whole price: {plan} or {why}; nothing is taken here
function awkPlanP(p,c){
  const g=p.gear; if(!c) return {why:'There is no such step'};
  if((g.coins|0)<c.coins) return {why:'Not enough coins ('+c.coins+' needed)'};
  const plan={coins:c.coins,drops:[],echo:0,rd:[],tr:[],es:[]};
  if(c.drops>0){ const kinds=c.kind?[c.kind]:awkDropKinds(c.land,c.tier), got=awkGreedy(kinds.map(id=>[id,g.mats[id]|0]),c.drops);
    if(!got&&c.kind) return {why:'You need '+c.drops+' '+(MAT_NAMES[c.kind]||c.kind)+' (dropped by '+((MON_DEFS.find(d=>d.id===c.kind)||{}).name||c.kind)+')'};
    if(!got) return {why:'You need '+c.drops+' monster drops of '+(c.land==='any'?'level '+Math.max(1,AWK_TIERS[c.tier].lv-5)+' or above':'that land')+' (from its tougher kinds as the tier rises)'};
    plan.drops=got; }
  for(const id of Object.keys(c.mats)){ const n=c.mats[id];
    if(id==='echo'){ if((g.awm.echo|0)<n) return {why:'You need '+n+' Echo Shards (you have '+(g.awm.echo|0)+')'}; plan.echo=n; }
    else if(id.startsWith('rd_')){ const got=awkGreedy(awkRaidStock(p,id.slice(3)),n); if(!got) return {why:'You need '+n+' '+awkMatName(id)+' (raid material)'}; plan.rd.push(...got); }
    else if(id==='trophy_any'){ const got=awkGreedy(BT_ORDER.map(t=>[t,g.awm[t]|0]),n); if(!got) return {why:'You need '+n+' boss trophies (any boss)'}; plan.tr.push(...got); }   // the Wanderer: any boss's
    else if(btOf(id)){ const have=awkOwn(g.awm,id)?g.awm[id]|0:0; if(have<n) return {why:'You need '+n+' '+btOf(id).name+' (you have '+have+')'}; plan.tr.push([id,n]); }
    else if(essOf(id)){ const have=awkOwn(g.awm,id)?g.awm[id]|0:0; if(have<n) return {why:'You need '+n+' '+essOf(id).name+' (you have '+have+'; the rifts pay it)'}; plan.es.push([id,n]); }   // Essence (step 17a): from gear.awm
    else return {why:'This step needs '+n+' '+id+', which cannot be earned'}; }
  return {plan};
}
function awkTakeP(p,P){
  const g=p.gear, rm=rdMatsOf(p);
  g.coins-=P.coins;
  for(const [id,n] of P.drops){ const left=(g.mats[id]|0)-n; if(left>0) g.mats[id]=left; else delete g.mats[id]; }
  if(P.echo){ const left=(g.awm.echo|0)-P.echo; if(left>0) g.awm.echo=left; else delete g.awm.echo; }
  for(const [id,n] of P.tr){ const left=(g.awm[id]|0)-n; if(left>0) g.awm[id]=left; else delete g.awm[id]; }
  for(const [id,n] of P.es){ const left=(g.awm[id]|0)-n; if(left>0) g.awm[id]=left; else delete g.awm[id]; }
  for(const [l,n] of P.rd){ const left=(rm[l]|0)-n; if(left>0) rm[l]=left; else delete rm[l]; }
}
// ---- buying ----
const awkOwnsChar=(p,k)=>k===AWK_WANDERER||bdOwns(p,k);   // bond: Bond 0 makes the character yours (server/bond.js)
function awkRefuse(p,why){ toastTo(p.id,why,'bad'); return why; }
function awkDoneP(p,k,what,e){ recalcP(p); p.dirty=true; ev('awk',p.id,k,what,e.t); mqActP(p,'upskill'); return null; }   // (W10, "Sharper": any tree step counts)
function awkTierP(p,k){
  if(!awkKeyOk(k)) return 'unknown character';
  if(!awkOwnsChar(p,k)) return awkRefuse(p,'Unlock '+SS_SETS[k].char.name+' first (Bond 0)');
  const cur=awkEntry(p.gear,k), to=(cur?cur.t:0)+1; if(to>=AWK_TIERS.length) return awkRefuse(p,'Already fully awakened');
  if(p.level<AWK_TIERS[to].lv) return awkRefuse(p,'Awakening A'+to+' needs level '+AWK_TIERS[to].lv);
  const r=awkPlanP(p,awkTierCost(k,to)); if(!r.plan) return awkRefuse(p,r.why);
  awkTakeP(p,r.plan); const e=awkEntryW(p.gear,k); e.t=to;
  toastTo(p.id,(k===AWK_WANDERER?'The Wanderer':SS_SETS[k].char.name)+' reached Awakening A'+to+'!','good');
  return awkDoneP(p,k,'t',e);
}
function awkNodeP(p,k,id,kinds){
  if(!awkKeyOk(k)) return 'unknown character';
  const n=awkNode(awkShapeOf(k),id); if(!n||!kinds.includes(n.kind)) return 'unknown node';
  if(!awkOwnsChar(p,k)) return awkRefuse(p,'Unlock '+SS_SETS[k].char.name+' first (Bond 0)');
  const cur=awkEntry(p.gear,k), t=cur?cur.t:0, has=x=>!!cur&&cur.n[x]===1;
  if(has(n.id)) return awkRefuse(p,'Already bought');
  if(t<n.tier) return awkRefuse(p,'This node needs Awakening A'+n.tier);
  if(p.level<AWK_TIERS[n.tier].lv) return awkRefuse(p,'This node needs level '+AWK_TIERS[n.tier].lv);
  const miss=n.req.find(r=>!has(r)); if(miss) return awkRefuse(p,'Buy '+miss+' first');
  const r=awkPlanP(p,awkNodeCost(k,n.id)); if(!r.plan) return awkRefuse(p,r.why);
  awkTakeP(p,r.plan); const e=awkEntryW(p.gear,k); e.n[n.id]=1;
  if(n.id==='ch1') awkChargeOwnP(p,k);
  if(n.id==='pa1') awkPassOwnP(p,k);   // bond: Bond 0 gives the actives only; A1's pa1 makes the kept passive yours
  return awkDoneP(p,k,n.id,e);
}
const awkLevelP=(p,k,id)=>awkNodeP(p,k,id,['up','star']);   // an upgrade node (a skill level) or a special burst node
const awkStatP=(p,k,id)=>awkNodeP(p,k,id,['stat']);
function awkPassOwnP(p,k){   // pa1: the character's one equippable passive is yours (a set's; the Wanderer's passives are the shop's)
  const S=k===AWK_WANDERER?null:SS_SETS[k], id=S&&S.keptPassive, own=p.gear.skills.owned; if(!id||own.includes(id)) return;
  own.push(id); awkSyncG(p.gear); toastTo(p.id,PASSIVES[id].name+' is yours: wear it in the passive slot','loot r3'); ultCheckP(p);
}
function awkChargeOwnP(p,k){   // ch1: the character's charge skill is yours (the Wanderer's: every general one)
  const own=p.gear.cave.own; let got=0;
  for(const id of CAVE_SKILL_IDS){ const c=CAVE_SKILLS[id]; if((k===AWK_WANDERER?!c.set:c.set===k)&&!awkOwn(own,id)){ own[id]=1; got++; ev('caveget',p.id,id); } }
  if(got){ toastTo(p.id,got===1?'A charge skill is yours: wear it in the charge slot':got+' charge skills are yours: wear them in the charge slot','loot r3'); ultCheckP(p); }
}
MSG.awk=(p,msg)=>{ const a=msg.a, k=msg.set, id=msg.id; if(typeof k!=='string') return;
  if(a==='tier') awkTierP(p,k); else if(a==='up'&&typeof id==='string') awkLevelP(p,k,id); else if(a==='stat'&&typeof id==='string') awkStatP(p,k,id); };
// ---- migration (smv 2) and testing ----
// add a character's limbs up to levels {limb: L} (both node kinds) and the tier that covers them; only adds
function awkMigGrant(gear,k,want){
  const sh=awkShapeOf(k); if(!sh) return;
  const e=awkEntryW(gear,k); let t=e.t;
  for(const limb of Object.keys(want)){ const Lm=AWK_LIMBS[limb], L=Math.min(AWK_TOP,want[limb]|0); if(L<Lm.first) continue;
    t=Math.max(t,Lm.tier,awkTierForLevel(L));
    for(let lv=Lm.first;lv<=L;lv++){ e.n[awkStatId(limb,lv)]=1; e.n[awkUpId(limb,lv)]=1; } }
  e.t=Math.min(AWK_TIERS.length-1,t);
}
function awkMigrateG(gear){
  const sk=gear.skills, own=gear.cave&&gear.cave.own||{}, sets=new Set(Array.isArray(gear.bdMig)?gear.bdMig:[]);
  for(const id of sk.owned){ const pc=SS_PIECE_OF[id]; if(pc) sets.add(pc.set); }
  for(const id of Object.keys(own)){ const c=caveSkillDef(id); if(c&&c.set) sets.add(c.set); }
  for(const k of SS_ORDER){
    if(!sets.has(k)) continue; const S=SS_SETS[k]; if(!awkShapeOf(S)) continue;
    const want={};
    for(let q=1;q<=3;q++){ const ids=S.pos[q].ids.filter(i=>sk.owned.includes(i)); if(ids.length) want[AWK_POS_LIMB[q]]=Math.max(...ids.map(i=>Math.min(SKILL_OLD_MAX_LV,skillLvOf(sk,i)))); }
    if(S.keptPassive&&sk.owned.includes(S.keptPassive)) want.pa=Math.min(SKILL_OLD_MAX_LV,skillLvOf(sk,S.keptPassive));
    const cid=CAVE_SKILL_IDS.find(i=>CAVE_SKILLS[i].set===k&&awkOwn(own,i)); if(cid) want.ch=Math.max(1,Math.min(SKILL_OLD_MAX_LV,own[cid]|0));
    if(ultOwned(sk,gear.cave,k)) want.bu=1;
    awkMigGrant(gear,k,want);
  }
}
// testing: a character's whole tree to tier t (default 5): the tier, every node of that tier or below, and what ch1 gives
function awkGrantP(p,k,t){
  if(!awkKeyOk(k)) return false; t=clampInt(t,0,AWK_TIERS.length-1,AWK_TIERS.length-1);
  const e=awkEntryW(p.gear,k); e.t=Math.max(e.t,t);
  for(const n of awkShapeOf(k).nodes) if(n.tier<=e.t) e.n[n.id]=1;
  if(e.n.ch1===1) awkChargeOwnP(p,k);
  if(e.n.pa1===1) awkPassOwnP(p,k);   // bond
  p.dirty=true; return true;
}
function awkDevP(p,msg){   // dev 'awk' {v: set id | 'all', n: tier}
  const ks=msg.v==='all'?[AWK_WANDERER,...SS_ORDER.filter(id=>!SS_SETS[id].dev)]:[msg.v];
  let n=0; for(const k of ks) if(awkGrantP(p,k,msg.n)) n++;
  recalcP(p); toastTo(p.id,n?'Awakening: '+n+' tree'+(n===1?'':'s')+' granted':'No such character (a set id, wanderer or all)',n?'good':'bad');
}
