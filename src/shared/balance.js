//@ Level formulas: fLv, gear tiers, expected gear, armour negation (soft-capped at 90%), XP curve, coins (the pay doubles every 10 levels above 60). Pure.
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
const tierFor=L=>L>=25?5:L>=20?4:L>=15?3:L>=10?2:L>=5?1:0;   // (tier 5 until the next land brings a better one)
// the highest monster level (zones, quests): the Hoarfrost Reach's 30. VALE_TOP_LV: the highest level skill upgrades ask drops of (the vale's 25)
const MAX_ZONE_LV=30, VALE_TOP_LV=25;
const setHP=t=>ARMOR_HP.helmet[t]+ARMOR_HP.top[t]+ARMOR_HP.bottom[t]+ARMOR_HP.shoes[t];
const setDef=t=>ARMOR_DEF.helmet[t]+ARMOR_DEF.top[t]+ARMOR_DEF.bottom[t]+ARMOR_DEF.shoes[t];
/* Damage negation of armour. Up to RED_KNEE (60%, defense 90: a full set of the top world tier is 76 = 56%) it is the plain d / (d + 60) every enemy was balanced
   against. Above it the curve bends toward a ceiling of RED_CAP (90%) and never reaches it: the same slope at the knee (no kink), then x / (x + RED_H) of the way up
   for the x defense above the knee. Without it the enhanced level-30 sets (about 430 to 580 defense) would negate 88-91% of every hit and more with each step. */
const RED_KNEE=0.6, RED_CAP=0.9, DEF_KNEE=60*RED_KNEE/(1-RED_KNEE), RED_H=(RED_CAP-RED_KNEE)*Math.pow(DEF_KNEE+60,2)/60;
const defRed=d=>d<=DEF_KNEE?d/(d+60):RED_KNEE+(RED_CAP-RED_KNEE)*(d-DEF_KNEE)/(d-DEF_KNEE+RED_H);
// whatever armour, passives, buffs and potions add up to, a hit still does at least this share of its damage (at most 90% negation in all)
const DMG_TAKEN_MIN=0.1;
const PLAYER_MAX_LV=50;   // the highest level a hiker reaches (gainExpP, saves, the testing tool)
const expDmg=L=>3*fLv(L)+TIER_ATK[tierFor(L)];
const expHP=L=>20*fLv(L)+setHP(tierFor(L));
const expRed=L=>defRed(setDef(tierFor(L)));
/* XP: unchanged up to level 5, then later monsters give 15% more per level and levels need more,
   so that level 15 -> 16 takes about 500 level-15 kills */
const xpBase=L=>fLv(L)*Math.pow(1.15,Math.max(0,L-5));
/* Levels 10-15 monsters have 1.5x health (to keep up with burst skills), so they also give 1.5x XP and coins:
   the level curve below still uses the old XP, so each high-level kill moves you further than before. */
const HIGH_LV=10, highMult=L=>L>=HIGH_LV?1.5:1;
/* What a kill pays (XP and coins) climbs steeply with the monster's level, which was fine up to level 60 (a level-30 boss at zone tier III, the top before zone tiers
   IV and V). A level-80 Vetrmaw would pay 915 million XP and 62 million coins by the same curve, so above PAY_LV the pay keeps its level-60 rate and doubles with every
   PAY_DOUBLE levels more (x2 at 70, x4 at 80). Nothing at or below level 60 changes, and no hiker levels past 50, so the level curve below is untouched. */
const PAY_LV=60, PAY_DOUBLE=10, payMult=L=>L>PAY_LV?Math.pow(2,(L-PAY_LV)/PAY_DOUBLE):1;
const xpFor=L=>xpBase(Math.min(L,PAY_LV))*highMult(L)*payMult(L);
const K15=(500*xpBase(15))/(10*(225+Math.pow(7/6,15)));
const expToNext25=L=>10*(L*L+Math.pow(7/6,L))*Math.pow(K15,Math.max(0,L-5)/10);
/* Past level 25 the curve above keeps growing faster than the monsters' XP (level 30 would need ~7,800 same-level kills): from 25 on a
   level costs as many same-level kills as 25 -> 26 does, so the Hoarfrost's levels 26-30 stay a long but bounded grind. */
const KILLS25=expToNext25(25)/xpFor(25);
const expToNext=L=>L<=25?expToNext25(L):KILLS25*xpFor(L);
const coinsFor=L=>{ const P=Math.min(L,PAY_LV); return Math.max(1,Math.round(fLv(P)*AR(1.5,2.5)*Math.pow(1.1,Math.max(0,P-5))*highMult(L)*payMult(L))); };
