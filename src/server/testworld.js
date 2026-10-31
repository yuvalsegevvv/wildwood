//@ The public test world: a second, throwaway world on the deployed server where a hiker starts at level 60 with a full kit (no saves, no accounts, no rankings, no XP, no admin tools)
/* Agent map (docs/TESTWORLD.md has the design)
   owns:    testKitP(p) (the starting kit, called by join() when io.test is set), TEST_LV / TEST_COINS / TEST_STONES / TEST_SKILL_LV / TEST_ENH / TEST_TIER (the numbers).
   hooks:   marked `// testworld:`: join() (api.js: the kit; hello's save and login are ignored), beginJoin (api.js), gainExpP (players.js: no XP), frRankP (friends.js: an empty ranking), gemtest (amber.js).
   io.test: the Node host (node/main.js) makes this world with {test:true, dev:false} and no store and no auth: nothing is loaded or saved, accounts are off (isGuestP is false) and S.dev is false.
   test:    tools/testworld-smoke.js. */
const TEST_LV=60, TEST_COINS=10000000, TEST_STONES=1000, TEST_SKILL_LV=4, TEST_ENH=8, TEST_TIER=4, TEST_RAR=3;   // TEST_RAR 3 = Unique (its limit is +8: ENH_MAX); the stones: weapon / armour / ring reroll stones
function testKitP(p){
  const g=p.gear, put=id=>{ if(ITEM[id]&&!g.inv.includes(id)&&g.inv.length<BAG_MAX) g.inv.push(id); };
  // gear: every level-40 piece at Unique +8 (the three weapons, four armour pieces, seven rings), every level-30 pendant kind
  for(const s of WEAPON_SLOTS) put(dgGearId40(s,TEST_RAR,TEST_ENH));
  for(const s of ARMOR_SLOTS) put(dgGearId40(s,TEST_RAR,TEST_ENH));
  for(const e of RING_ELS) put(dgRingId40(e,TEST_RAR,TEST_ENH));
  for(const t of PENDANT_STATS) put(dgPendantId(t,TEST_RAR,TEST_ENH));
  g.coins=TEST_COINS; g.rsw=g.rsa=g.rsr=TEST_STONES;
  // the world: every circle attuned, every gate open (the same values the testing tools set), every land's zone tier unlocked up to TEST_TIER (the symbol)
  g.east=2; g.north=2; g.west=2; g.sun=2; g.gloam=2; g.tall=2; g.isles=2; g.river=1; g.neck=1; g.redgate=1; g.amber=1;
  for(const l of ZTIER_LANDS) g.zt[l].max=TEST_TIER;
  g.os=ambOutfitIds();   // every outfit set
  setLevelP(p,TEST_LV);
  // skills: every class skill, passive and boss skill, every signature set, the burst, every cave skill; each at level TEST_SKILL_LV
  for(const id of [...SKILL_IDS,...PASSIVE_IDS]) if(!g.skills.owned.includes(id)) g.skills.owned.push(id);
  for(const id of SS_ORDER) if(!SS_SETS[id].dev) ssGrantSetP(p,id,true);
  for(const id of CAVE_SKILL_IDS) g.cave.own[id]=CAVE_LEVEL_MAX;
  for(const id of g.skills.owned){ const d=SKILLS[id]; if(d&&!d.drop) g.skills.lv[id]=TEST_SKILL_LV; }
  ultCheckP(p);
  // wear the best of it: the first weapon, every armour piece, a plain ring (the soul is unbound), a crit-damage pendant
  equipP(p,dgGearId40('sword',TEST_RAR,TEST_ENH));
  for(const s of ARMOR_SLOTS) equipP(p,dgGearId40(s,TEST_RAR,TEST_ENH));
  equipP(p,dgRingId40('basic',TEST_RAR,TEST_ENH)); equipP(p,dgPendantId('critdmg',TEST_RAR,TEST_ENH));
  recalcP(p); p.hp=p.maxHp; p.dirty=true;
}
