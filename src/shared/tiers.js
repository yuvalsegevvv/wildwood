//@ Zone tiers: a harder setting for each land (every enemy in it, bosses included, +10 levels per tier), opened by its second boss, and the symbol bonus. Pure.
/* Each land (the home forest, the Sakura Vale, the Hoarfrost Reach) has a tier from 0 to ZTIER_MAX. At tier t every enemy there is ZTIER_STEP x t
   levels higher: its health, damage, XP, coins and the gear it drops are those of that level (defAt in monster-defs.js), and the level debuffs
   (-5% damage dealt / +5% damage taken per level above you) use it too. The tier is the player's own setting (gear.zt[land].on), so two players in
   the same land can fight the same monster at different tiers: the server keeps one health pool per monster in the def's own units and
   scales each hit that lands on it and each hit it lands (server/tiers.js).
   Opening tiers: defeating a land's second boss (ZTIER_BOSS) while you play that land at your highest unlocked tier unlocks the next one
   (gear.zt[land].max). Tiers are changed in a village (the map panel; zoneTierVillage). The symbol: every unlocked tier point of every land, added together,
   gives +ZTIER_BONUS attack and health (2 + 2 + 1 points = +50%), whichever tier you play at. "Tier" alone means the gear tiers 0-5 elsewhere
   in the code (tierFor, TIER_ATK): these are zone tiers, hence the zoneTier / ZTIER_ names. */
const ZTIER_STEP=10, ZTIER_MAX=3, ZTIER_BONUS=0.10;
const ZTIER_LANDS=['home','vale','hoar'];
const ZTIER_NAMES={home:'the home forest',vale:'the Sakura Vale',hoar:'the Hoarfrost Reach'};
const ZTIER_ROMAN=['0','I','II','III'];
// the second boss of each land (BOSS_DEFS lists a land's two bosses in the order of their levels): Carapax on the beach, Kyuubi, Vetrmaw
const ZTIER_BOSS={home:'carapax',vale:'kyuubi',hoar:'vetrmaw'};
const landAt=(x,z)=>inHoar(x,z)?'hoar':inVale(x)?'vale':inGrey(x,z)?'grey':'home';   // ('grey': the Greyspine has no zone tier yet, so every tier lookup there answers 0)
// where a tier can be changed: in a village, its whole area (as far as the zone label says "The village": the gate where you spawn counts)
const zoneTierVillage=(x,z)=>vDist(x,z)<VR+22;
const newZt=()=>({home:{on:0,max:0},vale:{on:0,max:0},hoar:{on:0,max:0}});
const zoneTierOn=(gear,land)=>{ const t=gear&&gear.zt&&gear.zt[land]; return t?t.on|0:0; };
const zoneTierMax=(gear,land)=>{ const t=gear&&gear.zt&&gear.zt[land]; return t?t.max|0:0; };
// the tier a monster's kill is played at by this player: its land is where its camp is (a boss's camp is its arena)
const monTierOf=(gear,m)=>zoneTierOn(gear,landAt(m.camp.x,m.camp.z));
const zoneTierLv=(d,t)=>d.level+ZTIER_STEP*t;
// how a def's numbers change at tier t: its level then, and the health / damage / XP multipliers against the def's own
const ZT_CACHE=new Map();
function zoneTierK(d,t){
  const key=d.id+':'+t; let k=ZT_CACHE.get(key); if(k) return k;
  if(!t) k={lv:d.level,hp:1,dmg:1,xp:1};
  else { const L=zoneTierLv(d,t), a=defAt(d,L), b=defAt(d,d.level); k={lv:L,hp:a.hp/b.hp,dmg:a.dmg/b.dmg,xp:b.xp?a.xp/b.xp:1}; }   // (against defAt, not d.hp: the grey monsters' XP is tripled after prepDef)
  ZT_CACHE.set(key,k); return k;
}
const symbolPoints=gear=>ZTIER_LANDS.reduce((n,l)=>n+zoneTierMax(gear,l),0);
const symbolBonus=gear=>ZTIER_BONUS*symbolPoints(gear);
