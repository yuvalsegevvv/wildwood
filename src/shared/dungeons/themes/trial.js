//@ Dungeon theme: the Trial Roots (the Hollow Roots at level 5, open to everyone, paying nothing; entered through the Trial Gate in the home village)
/* The Wildwood dungeon with its level tuned right down, for learning a dungeon or trying a skill without the grind: the same tiles, hazards, walkers and guardians, the same
   boss (Amanita), the same seven missions, the same hourly offer and board, the same party rules. What differs is `trial`: its level is 5 at any difficulty (dgLevel), anyone may enter at any
   level (dgUnlocked, dgGateOpen), and nothing it holds pays out: no XP, coins, items, materials, chests, clear piece, clear record or skill set (server/dungeons/ checks `theme.trial`). The gate:
   DG_TRIAL_GATE in shared/dungeons.js (temporary). Design: docs/DUNGEON-THEMES.md section 10. */
defineDungeonVariant('hollowroots',{id:'trial',name:'The Trial Roots',lv:5,trial:true});
