//@ The Abyss's bosses (B9): the pool (the world's bosses but Pyrrhax and the dungeons' eight), the whitelist of the ones that pass the headless check, and the land each boss's disc is dressed as
/* agent map (docs/ABYSS.md section 3h; the plan: abyss-plan/PLAN.md sections 3 and 4)
   exports: AB_BOSS_ALL (the 24 ids: BOSS_DEFS but `sinkwarden`, then DG_BOSS_DEFS), AB_BOSS_OUT ({id: why} a boss kept out of the draw), AB_BOSS_OK (AB_BOSS_ALL without AB_BOSS_OUT: the draw is uniform over it),
            AB_BOSS_LAND ({id: tile id} the land's tile the boss's disc takes its look from), abBossOk(id) (own-property: is this id in the whitelist), abBossRowOf(id) (the row makeBossS takes: a BOSS_DEFS entry or a DG_BOSS_DEFS row, or null),
            abBossTileOf(id) (the tile string of the disc: 'boss:<land tile>')
   users: server/abyss/boss.js (the draw, abBossS), server/abyss/tiles.js (the cards), server/abyss/rounds.js, server/abyss.js (the stored card), game/abyss/choice.js (the card's name); test: tools/abyss-smoke.js (every whitelisted boss spawns, engages and dies on the disc)
   A boss kit was written for an arena of its own (the world's six) or the dungeon's round hall (r = 20); the Abyss gives it a solid disc of AB_BOSS_CELLS (30 m) with the same r = 20 circle, at levels 40-180. Kits that cannot take it stay in AB_BOSS_OUT with the reason (docs/ABYSS.md). */
const AB_BOSS_ALL=BOSS_DEFS.filter(b=>b.def.id!=='sinkwarden').map(b=>b.def.id).concat(Object.keys(DG_BOSS_DEFS));
const AB_BOSS_OUT=Object.assign(Object.create(null),{});   // id -> a one-line reason (the headless check found it fails on the disc)
const AB_BOSS_OK=AB_BOSS_ALL.filter(id=>!AB_BOSS_OUT[id]);
// the look: the land of the boss's arena, or of its dungeon (amanita: the Hollow Roots, in the home forest)
const AB_BOSS_LAND=Object.assign(Object.create(null),{boss:'forest',carapax:'forest',akaoni:'vale',kyuubi:'vale',ymrik:'hoar',vetrmaw:'hoar',gryphonqueen:'grey',mountaingolem:'grey',glassguardian:'sun',sandwyrm:'sun',
  drownedcaptain:'gloam',gloamwarden:'gloam',oldthunder:'amber',oldhorn:'amber',ocelo:'isles',tuila:'isles',amanita:'forest',gawataro:'vale',haugbui:'hoar',garrick:'grey',khet:'sun',abbess:'gloam',ortha:'amber',ahmetl:'isles'});
const abBossOk=id=>typeof id==='string'&&AB_BOSS_OK.indexOf(id)>=0;
function abBossRowOf(id){
  if(typeof id!=='string'||AB_BOSS_ALL.indexOf(id)<0) return null;
  const own=Object.prototype.hasOwnProperty.call(DG_BOSS_DEFS,id)?DG_BOSS_DEFS[id]:null;
  return own||BOSS_DEFS.find(b=>b.def.id===id)||null;
}
const abBossTileOf=id=>'boss:'+(AB_BOSS_LAND[id]||'forest');
