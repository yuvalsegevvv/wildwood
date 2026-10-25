//@ Zone tiers: a harder setting for each land (every enemy in it, bosses included, +10 levels per tier), opened by its second boss, and the symbol bonus. Pure.
/* Each land (the home forest, the Sakura Vale, the Hoarfrost Reach, the Greyspine) has a tier from 0 to ZTIER_MAX (V). At tier t every enemy there is ZTIER_STEP x t
   levels higher: its health, damage, XP, coins and the gear it drops are those of that level (defAt in monster-defs.js), and the level debuffs
   (-5% damage dealt, at most -50%, / +5% damage taken per level above you) use it too. The tier is the player's own setting (gear.zt[land].on), so two players in
   the same land can fight the same monster at different tiers: the server keeps one health pool per monster in the def's own units and
   scales each hit that lands on it and each hit it lands (server/tiers.js).
   Opening tiers: defeating a land's second boss (ZTIER_BOSS) while you play that land at your highest unlocked tier unlocks the next one
   (gear.zt[land].max). Tiers are changed in a village (the map panel; zoneTierVillage). The symbol: every unlocked tier point of every land, added together,
   gives +ZTIER_BONUS attack and health (2 + 2 + 1 + 1 points = +60%), whichever tier you play at, up to ZTIER_SYMBOL_CAP. The Greyspine's badge counts too (ZTIER_SYMBOL_LANDS)
   and the cap is a PLACEHOLDER (docs/NOT-BUILT.md section 3b): the level-60 hero of tools/boss-duel.js (docs/areas/tiers.md) was tuned with three lands' fifteen points (+150%), and with the
   Greyspine's five on top (+200%) that hero beats the tier V bosses standing still, so the symbol stopped at +150%. Version 3: six lands x seven tiers = 42 points = +420% (the owner's "x4.2 from symbols, for now"), ZTIER_SYMBOL_CAP is that whole sum and the one number to change. "Tier" alone means the gear tiers 0-5 elsewhere
   in the code (tierFor, TIER_ATK): these are zone tiers, hence the zoneTier / ZTIER_ names. */
// Amber Reach (the seventh land) is a tier land too, opened by Oldhorn, but is NOT in ZTIER_SYMBOL_LANDS (the symbol stays at the six lands' 42 points, as the Sunscar's and the Gloamhorn's did when they came)
// tiers VI and VII (version 3) came with the level-40 gear and the Sunscar's and the Gloamhorn's symbols; their tiers count toward the symbol like the others
// tiers IV and V were added for the power the level-30 dungeon gear and its enhancements bring; what a kill pays is damped above level 60 (PAY_LV in balance.js)
const ZTIER_STEP=10, ZTIER_MAX=7, ZTIER_BONUS=0.10, ZTIER_SYMBOL_CAP=4.2;   // (version 3: seven tiers in six lands = 42 points = +420%, the symbol's "x4.2"; the cap is the whole of it and is the number to tune, a placeholder)
const ZTIER_LANDS=['home','vale','hoar','grey','sun','gloam','amber'], ZTIER_SYMBOL_LANDS=['home','vale','hoar','grey','sun','gloam'];   // (the lands whose unlocked tiers count toward the symbol: a land left out of this list keeps its tiers but adds nothing)
const ZTIER_NAMES={home:'the home forest',vale:'the Sakura Vale',hoar:'the Hoarfrost Reach',grey:'the Greyspine',sun:'the Sunscar',gloam:'the Gloamhorn',amber:'Amber Reach'};
const ZTIER_ROMAN=['0','I','II','III','IV','V','VI','VII'];
// the second boss of each land (BOSS_DEFS lists a land's two bosses in the order of their levels): Carapax on the beach, Kyuubi, Vetrmaw, the Mountain Golem
const ZTIER_BOSS={home:'carapax',vale:'kyuubi',hoar:'vetrmaw',grey:'mountaingolem',sun:'sandwyrm',gloam:'gloamwarden',amber:'oldhorn'};   // (amber: Oldhorn, the Herd-Mother)
const WA_LAND_OF_ID=['home','vale','hoar','grey','sun','gloam','amber'];
const landAt=(x,z)=>WA_LAND_OF_ID[waLandId(x,z)];   // from the atlas ('amber': the seventh land, shared/savanna.js)
// where a tier can be changed: in a village, its whole area (as far as the zone label says "The village": the gate where you spawn counts)
const zoneTierVillage=(x,z)=>vDist(x,z)<VR+22;
const newZt=()=>({home:{on:0,max:0},vale:{on:0,max:0},hoar:{on:0,max:0},grey:{on:0,max:0},sun:{on:0,max:0},gloam:{on:0,max:0},amber:{on:0,max:0}});
const zoneTierOn=(gear,land)=>{ const t=gear&&gear.zt&&gear.zt[land]; return t?t.on|0:0; };
const zoneTierMax=(gear,land)=>{ const t=gear&&gear.zt&&gear.zt[land]; return t?t.max|0:0; };
// the tier a monster's kill is played at by this player: its land is where its camp is (a boss's camp is its arena)
const monTierOf=(gear,m)=>caveFloorAt(m.camp.x,m.camp.z)>=0?0:zoneTierOn(gear,landAt(m.camp.x,m.camp.z));   // cave: the Deep Cave has no zone tier (its floors lie outside every land)
const zoneTierLv=(d,t)=>d.level+ZTIER_STEP*t;
// how a def's numbers change at tier t: its level then, and the health / damage / XP multipliers against the def's own
const ZT_CACHE=new Map();
function zoneTierK(d,t){
  const key=d.id+':'+t; let k=ZT_CACHE.get(key); if(k) return k;
  if(!t) k={lv:d.level,hp:1,dmg:1,xp:1};
  else { const L=zoneTierLv(d,t), a=defAt(d,L), b=defAt(d,d.level); k={lv:L,hp:a.hp/b.hp,dmg:a.dmg/b.dmg,xp:b.xp?a.xp/b.xp:1}; }   // (against defAt, not d.hp: the grey monsters' XP is tripled after prepDef)
  ZT_CACHE.set(key,k); return k;
}
const symbolPoints=gear=>ZTIER_SYMBOL_LANDS.reduce((n,l)=>n+zoneTierMax(gear,l),0);
const symbolBonus=gear=>Math.min(ZTIER_SYMBOL_CAP,ZTIER_BONUS*symbolPoints(gear));
const symbolCapped=gear=>ZTIER_BONUS*symbolPoints(gear)>ZTIER_SYMBOL_CAP+1e-9;   // (points past the cap add nothing yet)
// version 3: a boss skill (the 72 a world boss drops, SKILLS[id].drop) rises one level for every zone tier of its boss's land you have defeated: level 1 + tiers (up to 1 + ZTIER_MAX), the same skillPower / skillCdMult curve as any skill.
const BOSS_SKILL_MAX_LV=1+ZTIER_MAX;
const ztBossLandCache=new Map();
function ztBossLand(bossId){   // the land of a boss's arena ('home'... 'gloam'), or null for an unknown id
  if(ztBossLandCache.has(bossId)) return ztBossLandCache.get(bossId);
  const b=BOSS_DEFS.find(x=>x.def.id===bossId), A=b&&ARENAS.find(a=>a.key===b.arena), land=A?landAt(A.x,A.z):null;
  if(A) ztBossLandCache.set(bossId,land); return land;
}
const bossSkillLvOf=(gear,id)=>{ const s=SKILLS[id], land=s&&s.drop?ztBossLand(s.drop):null; return land?1+zoneTierMax(gear,land):1; };
