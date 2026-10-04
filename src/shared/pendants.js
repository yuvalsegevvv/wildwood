//@ Pendants, the rules: the five kinds a pendant can be (exp, drop, coin, crit rate, crit damage), their base values and names, their text, and the crit constants and caps rollDmgS uses. The pieces themselves are level-30 dungeon gear (dungeon-items.js). Pure.
/* Agent map (docs/PENDANTS.md has the design and the numbers a designer would tune)
   owns:    PENDANT_STATS, PENDANT_BASE (a common +0 pendant's value for each kind), PENDANT_NAMES, pendantPct / pendantText (the words), CRIT_BASE, CRIT_MULT, CRIT_CAP, CRIT_MULT_CAP.
   uses:    nothing (a leaf, loaded right after items.js).
   used by: dungeon-rewards.js (the ids: dgPendantId, and what the Greyspine's dungeon pays), dungeon-items.js (the ITEM records), items.js (itemStat), server/players.js (pendP),
            server/combat.js (rewardKill: xp, coin, drop; rollDmgS: crit chance and multiplier), game/economy/inventory.js and dungeon-gear.js (the details panel), ui/item-icons.js.
   test:    tools/pendants-smoke.js.
   One pendant has ONE bonus, worn in the one slot eq.pendant (the ring has eq.ring). It is a level-30 piece like the ring: it is made by a dungeon clear (shared/dungeon-rewards.js:
   the Greyspine's pays one at random), its rarity multiplies the value (RAR_MULT), and it can be tempered +1 ... +N with Tempering Stones (+10% of its value a step, N by rarity), so
   enhancing, not the tier, carries the power. What each kind does (the server reads the worn item's value, never a number from the client: pendP in server/players.js):
     xp      +v to the XP multiplier of a kill          (rewardKill, added to the Scholar passive)
     drop    +v to the chance of a material drop         (rollDropCount, added to the Scavenger passive)
     coin    +v to the coins of a kill                   (rewardKill)
     crit    +v to the crit chance, in points            (rollDmgS, with the Precision passive; the total is capped at CRIT_CAP)
     critdmg +v to the crit multiplier                   (rollDmgS; the multiplier is capped at CRIT_MULT_CAP)
   Ids: pendant-<kind>[-<rarity key>][+n], e.g. pendant-xp (common), pendant-critdmg-l+10 (legendary at its limit). */
const PENDANT_STATS=['xp','drop','coin','crit','critdmg'];
const PENDANT_BASE={xp:0.06,drop:0.10,coin:0.10,crit:0.02,critdmg:0.10};   // a common +0 pendant; x RAR_MULT (1 / 1.3 / 1.7 / 2.2 / 3) x (1 + ENH_STEP n)
const PENDANT_NAMES={xp:'Pendant of Learning',drop:'Pendant of Plenty',coin:'Pendant of Fortune',crit:'Pendant of Precision',critdmg:'Pendant of Ruin'};
const CRIT_BASE=0.12, CRIT_MULT=1.7, CRIT_CAP=0.6, CRIT_MULT_CAP=2.5;   // the numbers rollDmgS used to hold as literals; the caps are what stacking passives, potions and a pendant may reach
const pendantPct=v=>String(Math.round(v*1000)/10);   // 0.078 -> "7.8", 0.06 -> "6"
function pendantText(it){
  return it.stat==='xp'?'+'+pendantPct(it.v)+'% XP from kills':it.stat==='drop'?'+'+pendantPct(it.v)+'% chance of monster drops':it.stat==='coin'?'+'+pendantPct(it.v)+'% coins from kills'
    :it.stat==='crit'?'+'+pendantPct(it.v)+'% critical hit chance':'Critical hits deal x'+(CRIT_MULT+it.v).toFixed(2)+' (instead of x'+CRIT_MULT+')';
}
