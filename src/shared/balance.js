//@ Level formulas: fLv, gear tiers, expected gear, XP curve, coins. Pure.
/* ===================== MONSTERS =====================
   15 monsters built from 6 models (slime, shroom, beetle, boar, goblin, treant), recoloured and resized.
   Camps sit at fixed spots in rings around the village: level 1 closest, level 15 farthest.
   Levels 1-2 leave you alone until hit; everything else comes for you when you get close.

   Enemy stats are placeholders until you give the real formulas. For now each enemy has:
     hpK     how tough it is: health = your same-level hit damage x (4 + 0.45 x level) x hpK
     dmgPct  how hard it hits: damage per hit = this share of a same-level player's max health
     atk     seconds between its attacks */
const fLv=L=>L+Math.pow(13/12,L);
/* Equipment numbers (also used to scale enemies to the gear you are expected to have at their level) */
// tiers 0-3 are the home forest's (levels 1, 5, 10, 15), 4-5 the Sakura Vale's (levels 20, 25)
const TIER_ATK=[4,12,26,45,70,100];
const ARMOR_HP={helmet:[8,25,55,100,160,240],top:[15,45,100,180,290,430],bottom:[10,32,70,130,210,310],shoes:[6,18,40,75,120,180]};
const ARMOR_DEF={helmet:[1,3,5,8,11,15],top:[2,5,10,16,22,30],bottom:[1,3,6,10,14,19],shoes:[1,2,4,6,9,12]};
const tierFor=L=>L>=25?5:L>=20?4:L>=15?3:L>=10?2:L>=5?1:0;
// the highest monster level (zones, quests)
const MAX_ZONE_LV=25;
const setHP=t=>ARMOR_HP.helmet[t]+ARMOR_HP.top[t]+ARMOR_HP.bottom[t]+ARMOR_HP.shoes[t];
const setDef=t=>ARMOR_DEF.helmet[t]+ARMOR_DEF.top[t]+ARMOR_DEF.bottom[t]+ARMOR_DEF.shoes[t];
const defRed=d=>d/(d+60);
const expDmg=L=>3*fLv(L)+TIER_ATK[tierFor(L)];
const expHP=L=>20*fLv(L)+setHP(tierFor(L));
const expRed=L=>defRed(setDef(tierFor(L)));
/* XP: unchanged up to level 5, then later monsters give 15% more per level and levels need more,
   so that level 15 -> 16 takes about 500 level-15 kills */
const xpBase=L=>fLv(L)*Math.pow(1.15,Math.max(0,L-5));
/* Levels 10-15 monsters have 1.5x health (to keep up with burst skills), so they also give 1.5x XP and coins:
   the level curve below still uses the old XP, so each high-level kill moves you further than before. */
const HIGH_LV=10, highMult=L=>L>=HIGH_LV?1.5:1;
const xpFor=L=>xpBase(L)*highMult(L);
const K15=(500*xpBase(15))/(10*(225+Math.pow(7/6,15)));
const expToNext=L=>10*(L*L+Math.pow(7/6,L))*Math.pow(K15,Math.max(0,L-5)/10);
const coinsFor=L=>Math.max(1,Math.round(fLv(L)*AR(1.5,2.5)*Math.pow(1.1,Math.max(0,L-5))*highMult(L)));
