//@ The skill revamp's one save migration (gear.smv): retired boss skills refunded and unequipped, passives from the old slots 2-3 refunded, owned set pieces noted for Bond 0 (gear.bdMig)
/* Agent map. smigSanitize(g,out) runs at the end of sanitizeGear (server/players.js, the hook marked `// savemig:`) with the raw save g and the cleaned gear out.
   The cleaned gear always carries smv = SMIG_VER, so a save is migrated once: a second load (or a second pass of sanitizeGear) only re-checks gear.bdMig.
   Version 2 (skills revamp step 9): awkMigrateG (server/awakening.js) gives each set owned the Awakening nodes and tier of its old levels (only adds: idempotent).
   Rules for a save older than SMIG_VER 1 (the skill revamp plan, section 9 "Migration"):
   1. Boss skills (the 96 rows with drop:'<boss id>' that left SKILLS; SMIG_BOSS_SKILLS keeps what pricing them needs: [0 skill / 1 burst, the row's lv, its element]).
      An equipped one becomes that slot's class default (DEFAULT_OF; sanitizeSkills already emptied the slot), or stays empty without one.
      Each owned one refunds the coins and monster drops of its levels 2..L at today's table price (upNeedsBase, shared/drops.js), L = the higher of its saved
      level and 1 + the zone tiers defeated in its boss's land (what the old bsRefreshP gave it), at most SKILL_OLD_MAX_LV (5). Level 1 was a free drop: nothing for it.
   2. Passives worn in the old slots 2 and 3 (one slot now: sanitizeSkills keeps the first worn one): each bought one (a price, not a set piece) leaves
      the owned list and refunds its price plus the upgrades of its levels (upgradeNeeds). A free one (Vitality) just goes back to the bag.
   3. The soul: nothing to refund (binding it was always free; step 1 already dropped gear.soul).
   4. gear.bdMig: the ids of the sets of which the save owns a piece (SS_PIECE_OF), in SS_ORDER order, for the Bond step (Bond 0). Known set ids only.
   A save with startAll (the testing kit owns everything) gets no refunds. Coins stop at COINS_MAX and drops at MAT_MAX, as everywhere.
   Uses: DEFAULT_OF, PASSIVES, SKILL_MAX_LV, skillLvOf, upgradeNeeds, upNeedsBase, ztBossLand, zoneTierMax, SS_PIECE_OF, SS_SETS, SS_ORDER, clampInt, COINS_MAX, MAT_MAX, MATS.
   Test: server-smoke ('save migration'). */
const SMIG_VER=2;   // 1: boss skills, passive slots, bdMig (step 6); 2: the Awakening trees (step 9, awkMigrateG)
const SMIG_BOSS_SKILLS={   // boss id -> {skill id: [slot (0 skill, 1 burst), lv, element]}: the retired rows, kept only to price their refund
  boss:{snare:[0,15,'earth'],lifesap:[1,15,'water'],spore:[0,15,'air'],bloom:[1,15,'dark'],thorns:[0,15,'earth'],drain:[1,15,'dark']},
  carapax:{clawcrush:[0,20,'earth'],tidalguard:[1,20,'water'],riptide:[0,20,'water'],barnacles:[1,20,'earth'],tidalsurge:[0,20,'water'],maelstrom:[1,20,'water']},
  akaoni:{cleave:[0,20,'fire'],kanabo:[1,20,'earth'],ember:[0,20,'fire'],pyre:[1,20,'fire'],gale:[0,20,'air'],gate:[1,20,'dark']},
  kyuubi:{riposte:[0,25,'light'],dawn:[1,25,'light'],lance:[0,25,'light'],spirits:[1,25,'light'],spiritchain:[0,25,'light'],tempest:[1,25,'air']},
  ymrik:{rimecleave:[0,26,'water'],glacierslam:[1,26,'dark'],frostshot:[0,26,'water'],shardhail:[1,26,'air'],icelance:[0,26,'water'],whiteout:[1,26,'air']},
  vetrmaw:{wyrmfang:[0,30,'dark'],wyrmhide:[1,30,'water'],frostbite:[0,30,'water'],blizzardvolley:[1,30,'air'],frostchain:[0,30,'dark'],wyrmstorm:[1,30,'air']},
  gryphonqueen:{talonrake:[0,29,'air'],eagleplunge:[1,29,'air'],quillshot:[0,29,'air'],featherstorm:[1,29,'earth'],skylance:[0,29,'air'],updraft:[1,29,'air']},
  mountaingolem:{stonefist:[0,32,'earth'],quakeslam:[1,32,'earth'],boulderarrow:[0,32,'earth'],rockhail:[1,32,'earth'],stonebind:[0,32,'earth'],avalanche:[1,32,'earth']},
  glassguardian:{prismcleave:[0,32,'light'],mirrorbreak:[1,32,'light'],glintarrow:[0,32,'light'],shardfan:[1,32,'earth'],prismbeam:[0,32,'light'],glassstorm:[1,32,'light']},
  sandwyrm:{wyrmcoil:[0,36,'earth'],burrowstrike:[1,36,'earth'],sandpiercer:[0,36,'earth'],duneshower:[1,36,'fire'],cinderchain:[0,36,'fire'],sandstorm:[1,36,'earth']},
  drownedcaptain:{anchorswing:[0,35,'water'],broadside:[1,35,'water'],harpoon:[0,35,'water'],grapeshot:[1,35,'air'],brinelash:[0,35,'water'],undertow:[1,35,'water']},
  gloamwarden:{blackcleave:[0,40,'dark'],eclipse:[1,40,'dark'],gloomarrow:[0,40,'dark'],wraithvolley:[1,40,'dark'],soulsiphon:[0,40,'dark'],nightfall:[1,40,'dark']},
  oldthunder:{thunderclap:[0,41,'air'],anvilstrike:[1,41,'air'],boltarrow:[0,41,'air'],skyfall:[1,41,'air'],chainlightning:[0,41,'air'],thunderhead:[1,41,'air']},
  oldhorn:{horngore:[0,45,'earth'],herdcharge:[1,45,'earth'],hollowpoint:[0,45,'earth'],herdrain:[1,45,'earth'],tuskspike:[0,45,'earth'],greyquake:[1,45,'earth']},
  ocelo:{sunclaw:[0,45,'fire'],jaguarleap:[1,45,'fire'],obsidianshard:[0,45,'fire'],sunfall:[1,45,'fire'],solarlance:[0,45,'fire'],darksun:[1,45,'fire']},
  tuila:{tidebreaker:[0,46,'water'],riptiderush:[1,46,'water'],pearlshot:[0,46,'water'],drowningrain:[1,46,'water'],surgebeam:[0,46,'water'],whirlpool:[1,46,'water']},
};
const SMIG_BS=new Map();   // skill id -> {boss, slot, lv, el} (a Map: an id from a save is never a key of a plain object)
for(const b in SMIG_BOSS_SKILLS) for(const id in SMIG_BOSS_SKILLS[b]){ const r=SMIG_BOSS_SKILLS[b][id]; SMIG_BS.set(id,{boss:b,slot:r[0]?'burst':'skill',lv:r[1],el:r[2]}); }
const smigOwn=(o,k)=>!!o&&typeof o==='object'&&typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
// the refund of a retired boss skill at level L: {coins, mats:{id:n}} added into acc
function smigBossRefund(id,L,acc){
  const r=SMIG_BS.get(id); for(let to=2;to<=Math.min(L,SKILL_OLD_MAX_LV);to++) smigAdd(acc,upNeedsBase(id,r,to));
}
function smigAdd(acc,n){ if(!n) return; acc.coins+=n.coins|0; for(const m of n.mats||[]) acc.mats[m.id]=(acc.mats[m.id]||0)+m.n; }
function smigBdList(v){   // a list of known set ids, each once
  const out=[]; if(!Array.isArray(v)) return out;
  for(const id of v) if(typeof id==='string'&&smigOwn(SS_SETS,id)&&!out.includes(id)&&out.length<SS_ORDER.length) out.push(id);
  return out;
}
function smigSanitize(g,out){
  const v=clampInt(g&&g.smv,0,99,0);
  out.smv=SMIG_VER;
  let acc=null;
  if(v<1) acc=smigV1(g,out); else out.bdMig=smigBdList(g.bdMig);
  if(v<2) awkMigrateG(out);   // awakening: smv 2, each owned set's branches at its old levels, the stat nodes below them and the tier covering them (server/awakening.js)
  return acc;   // what the v1 step refunded (server-smoke reads it; nothing else needs it), null when it did not run
}
function smigV1(g,out){
  const raw=g&&g.skills&&typeof g.skills==='object'?g.skills:{}, sk=out.skills, acc={coins:0,mats:{}}, free=!!out.startAll;
  // 1. boss skills: equipped ones fall back to the class default, owned ones are refunded
  if(raw.eq&&typeof raw.eq==='object') for(const c in sk.eq){
    const e=smigOwn(raw.eq,c)?raw.eq[c]:null, slots=typeof e==='string'?{skill:e}:(e&&typeof e==='object'?e:{});
    for(const sl of ['skill','burst']){ const id=smigOwn(slots,sl)?slots[sl]:null; if(typeof id!=='string'||!SMIG_BS.has(id)||sk.eq[c][sl]) continue; const d=DEFAULT_OF[c]&&DEFAULT_OF[c][sl]; sk.eq[c][sl]=d&&sk.owned.includes(d)?d:null; }
  }
  const seen=new Set();
  if(Array.isArray(raw.owned)) for(const id of raw.owned){
    if(typeof id!=='string'||!SMIG_BS.has(id)||seen.has(id)) continue; seen.add(id);
    const land=ztBossLand(SMIG_BS.get(id).boss), saved=smigOwn(raw.lv,id)?clampInt(raw.lv[id],1,99,1):1, L=Math.max(saved,land?1+zoneTierMax(out,land):1);
    if(!free) smigBossRefund(id,L,acc);
  }
  // 2. the old passive slots 2-3: a bought passive there leaves the loadout and the owned list, its price and levels refunded
  const kept=sk.pass[0];
  if(Array.isArray(raw.pass)) for(const id of raw.pass){
    if(typeof id!=='string'||id===kept||!smigOwn(PASSIVES,id)) continue;
    const P=PASSIVES[id], i=sk.owned.indexOf(id); if(i<0||!(P.price>0)||P.set) continue;
    const L=skillLvOf(sk,id); if(!free){ acc.coins+=P.price; for(let to=2;to<=L;to++) smigAdd(acc,upgradeNeeds(id,to)); }
    sk.owned.splice(i,1); delete sk.lv[id];
  }
  // 4. the sets owned (a piece of each), for Bond 0
  const bd=[]; for(const id of sk.owned){ const pc=SS_PIECE_OF[id]; if(pc&&smigOwn(SS_SETS,pc.set)&&!bd.includes(pc.set)) bd.push(pc.set); }
  out.bdMig=SS_ORDER.filter(s=>bd.includes(s));
  out.coins=Math.min(COINS_MAX,out.coins+acc.coins);
  for(const m in acc.mats) if(smigOwn(MATS,m)) out.mats[m]=Math.min(MAT_MAX,(out.mats[m]||0)+acc.mats[m]);
  return acc;
}
