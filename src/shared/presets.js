//@ Loadout presets: ten saved setups of the eight skills, the soul and the equipment (each optionally linked to one of ten outfit slots), and the outfit slot count
/* ---------- presets ----------
   gear.pre = ten entries, each null or {n:name, cls, eq:{slot:itemId}, sk:{basic,skill,burst}, pass:[3], ult, cave, soul, of:-1..PR_OUTFITS-1}.
   `of` links an outfit slot of the character editor (kept in the browser): -1 = no link and the outfit stays as it is.
   Applying is instant anywhere, except in a boss fight, a raid fight, on the Proving Isle or in a dungeon (server/presets.js prBusyP).
   Messages: prsave {i,n,of}, prwear {i}, prclear {i}. Event: prwear [pid, i, of] (the client wears the linked outfit slot).
   used by: server/presets.js, game/economy/presets.js, game/ui/character-editor.js (PR_OUTFITS). test: tools/presets-smoke.js */
const PR_COUNT=10, PR_OUTFITS=10, PR_NAME_MAX=14;
