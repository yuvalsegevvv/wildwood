//@ Raids: one ruined stronghold per land (eight) (defineRaid registry, the common layout, level and pay by zone tier, the signature-skill upgrade price in raid material, the flat pads)
/* Agent map. Design and numbers: docs/RAIDS.md. A raid is a ruin in an empty part of its land: 28 garrison monsters of the land's own kinds, destructibles (wards seal the inner court, spawners call
   reinforcements, barricades are cover), and a boss picked at random from the land's two world bosses when the raid (re)builds. Stem `raids`, prefix `rd` / `RD_`.
   Exports: RD_BASE_LV, RD_RESET, RD_ABANDON, RD_UP, RD_FOOT, RD_LAYOUT, defineRaid(D), RDS (by id), RD_ORDER, RD_BAD, rdLevel(tier), rdMatFor(tier), rdOfLand(land), rdCourtAt(x,z),
   rdBossRow(id) (a raid boss's BOSS_DEFS row), rdUpNeeds(skill,to) (a signature piece's price to level `to`: coins, the land's monster material, and `rd`: the raid material), rdCapTier(gear,land,raidTier).
   Used by: server/raids.js (the fight), server/economy.js + shared/drops.js (upgrades), game/raids/* (the ruins, the HUD), game/combat/boss.js (arenaOf). The data: shared/raids/<id>.js (one per land).
   Test: node tools/raids-smoke.js. A bad entry is left out and listed in RD_BAD (the game still boots). */
const RD_BASE_LV=40, RD_RESET=1800, RD_ABANDON=600, RD_FOOT=62, RD_MAT_MAX=99999;   // the level at +0; seconds from a clear to the rebuild; seconds with nobody inside before an engaged raid resets; the radius that counts as inside for the clear's pay
const RD_MOB_HP=0.3;   // a garrison monster's health against the same level's ordinary numbers: the boss stays at 22 hits at level 40 while a mob falls in about 7 x this (elites twice that again): 28 full-health mobs outweighed the boss 12 to 1
const RD_UP={2:1,3:2,4:4,5:8};   // raid material a signature piece needs to reach level n (one clear pays level 2); the one number to tune
const RD_MOB_K=3;   // a signature piece asks RD_MOB_K x the usual monster drops (UP_COUNT): the grind is in the woods, the raid is the gate
const RD_LANDS=['home','vale','hoar','grey','sun','gloam','amber','isles'];
/* The layout every raid shares, in metres from the site's middle (x east, z south; the gate looks north). The court is the boss arena (kits read A.x, A.z, A.r). */
const RD_LAYOUT={
  court:{x:0,z:22,r:20}, yard:{x:0,z:-14,r:24},
  wards:[[-9,-1],[0,-3],[9,-1]],                 // seal the court: the boss sleeps until all three are broken
  spawners:[[-24,-24],[24,-24]],                 // call a reinforcement every RD_REINF_T seconds while they stand
  barricades:[[-7,-40],[7,-40],[-8,-27],[8,-27]],// cover and dressing in the gate and the yard
  packs:{gate:[[-12,-34],[12,-34]], yard:[[-16,-14],[16,-14]], wall:[[-30,22],[30,22]]},   // 4 + 4, 4 + 4, 3 + 3 monsters
  packSize:{gate:4,yard:4,wall:3},
  elites:[[-12,-7],[-6,-7],[-3,-9],[3,-9],[6,-7],[12,-7]]   // two stand guard at each ward
};
const RD_REINF_T=40, RD_REINF_MAX=4, RD_ELITE_HP=2, RD_ELITE_S=1.25;
const RDS=Object.create(null), RD_ORDER=[], RD_BAD=[];
function defineRaid(D){
  const id=D&&typeof D.id==='string'?D.id:'?', bad=(field,why)=>{ RD_BAD.push({id,field,why}); if(typeof console!=='undefined') console.warn('raid '+id+' left out: '+field+': '+why); return null; };
  if(!D||typeof D!=='object') return bad('id','not an object');
  if(!/^[a-z][a-z0-9]*$/.test(id)) return bad('id','missing or not a lowercase word');
  if(RDS[id]) return bad('id','defined twice');
  if(typeof D.name!=='string'||!D.name) return bad('name','missing');
  if(!RD_LANDS.includes(D.land)) return bad('land','"'+D.land+'" is not one of '+RD_LANDS.join(' '));
  if(RD_ORDER.some(o=>RDS[o].land===D.land)) return bad('land','"'+D.land+'" already has a raid');
  if(!Number.isFinite(D.x)||!Number.isFinite(D.z)) return bad('x/z','the site is not a point');
  if(typeof D.mat!=='string'||!D.mat) return bad('mat','the raid material needs a name');
  if(typeof D.look!=='string'||!D.look) return bad('look','the look (a key of RD_LOOKS in game/raids/structure.js) is missing');
  const g=D.garrison, need=(list,what)=>{ if(!Array.isArray(list)||list.length<1) return what+' needs a list of monster kinds'; for(const k of list) if(!rdDefOk(k)) return what+': no monster "'+k+'"'; return null; };
  if(!g) return bad('garrison','missing');
  for(const [k,list] of [['gate',g.gate],['yard',g.yard],['wall',g.wall],['reinf',g.reinf]]){ const e=need(list,'garrison.'+k); if(e) return bad('garrison',e); }
  if(!rdDefOk(g.elite)) return bad('garrison','elite: no monster "'+g.elite+'"');
  if(!Array.isArray(D.up)||D.up.length!==4||!D.up.every(rdDefOk)) return bad('up','four monster kinds, for the levels 2, 3, 4 and 5');
  const src=SS_SOURCES[D.land]; if(!src) return bad('land','no world bosses known for '+D.land);
  const bosses=src.slice(0,2); if(!bosses.every(b=>rdBossRow(b))) return bad('bosses','the land\'s two world bosses are not in BOSS_DEFS');
  const L=RD_LAYOUT, at=(p)=>({x:D.x+p[0],z:D.z+p[1]});
  const R=Object.assign({},D,{bosses,second:bosses[1],
    court:Object.assign({key:'rd_'+id+'_court',name:D.name+': the inner court'},at([L.court.x,L.court.z]),{r:L.court.r}),
    yard:Object.assign({key:'rd_'+id+'_yard',name:D.name+': the yard'},at([L.yard.x,L.yard.z]),{r:L.yard.r}),
    wards:L.wards.map(at), spawners:L.spawners.map(at), barricades:L.barricades.map(at), elites:L.elites.map(at),
    packs:['gate','yard','wall'].flatMap(k=>L.packs[k].map(p=>Object.assign(at(p),{zone:k,n:L.packSize[k],kinds:g[k]})))});
  for(const A of [R.court,R.yard]){ A.h=baseHeight(A.x,A.z); A.raid=id; ARENAS.push(A); }   // the pads flatten the ground, arenaDist() keeps camps, plants and nodes off (key not in any BOSS_DEFS row: no world boss lives here)
  RDS[id]=R; RD_ORDER.push(id); return R;
}
const rdBossRow=id=>BOSS_DEFS.find(b=>b.def.id===id)||null;
let RD_DEF_CACHE=null;
const rdDefOk=id=>{ if(!RD_DEF_CACHE) RD_DEF_CACHE=new Set(ALL_MON_DEFS.map(d=>d.id)); return typeof id==='string'&&RD_DEF_CACHE.has(id); };
const rdLevel=tier=>RD_BASE_LV+ZTIER_STEP*tier, rdMatFor=tier=>Math.pow(2,tier);   // level 40 / 50 ... 110; 1 / 2 / 4 ... 128 raid material
const rdOfLand=land=>RD_ORDER.map(i=>RDS[i]).find(r=>r.land===land)||null;
// the raid whose inner court has its middle at (x, z): a raid boss's camp (the client's arenaOf)
const rdCourtAt=(x,z)=>{ for(const i of RD_ORDER){ const A=RDS[i].court; if(Math.abs(A.x-x)<1&&Math.abs(A.z-z)<1) return A; } return null; };
// the tier a player is credited at: the raid's, but never above their own highest unlocked tier in that land
const rdCapTier=(gear,land,raidTier)=>Math.min(raidTier|0,zoneTierMax(gear,land));
/* A signature piece's price to level `to` (2..SKILL_MAX_LV): the usual coins and the land's monster material, and the raid material of the set's land (RD_UP). Level 5 also asks the land's second world boss' trophies. */
function rdUpNeeds(s,to){
  if(!s||!s.set||!(to>=2)||to>SKILL_MAX_LV) return null;
  const set=SS_SETS[s.set], R=set&&rdOfLand(set.land); if(!R) return null;
  const mats=[{id:R.up[to-2],n:UP_COUNT[to]*RD_MOB_K}];
  if(to===SKILL_MAX_LV) mats.push({id:R.second,n:BOSS_UP});
  return {coins:Math.round(UP_COINS[s.slot]*Math.pow(to-1,1.7)/10)*10,mats,rd:{land:set.land,n:RD_UP[to]}};
}
