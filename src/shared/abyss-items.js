//@ The Abyss's two roll items (B11): the Void Anchor (locks one line of a 2-3 line piece for good) and the Ascendant Prism (+10 grade on every line of one piece, now and on every later roll). Names, rules as pure checks.
/* agent map (docs/ABYSS.md section 5b; the roll code and its markers: shared/rolls.js, docs/ROLLS.md)
   owns:    AB_LOCK_NAME, AB_PRISM_NAME, abPrismWhy(it) / abLockWhy(it,i) (null when the item can be used on that piece, else the refusal text; the server and the forge's buttons ask the same functions)
   uses:    rolls.js (RL_PRISM_ADD, the markers on the item record: it.rprism 0/1, it.rlock index or -1, it.roll the lines)
   used by: server/abyss/items.js (abItemP), game/economy/rolls.js (the Roll tab's buttons and badges)
   test:    tools/abyss-smoke.js */
const AB_LOCK_NAME='Void Anchor', AB_PRISM_NAME='Ascendant Prism';
// a piece takes a prism when it is a rolled level-40+ piece with lines and no prism yet (one a piece, for good)
function abPrismWhy(it){
  if(!it||!it.dg||!it.roll0) return 'Only a level-40 or higher dungeon piece can take it';
  if(!it.roll||!it.roll.length) return 'Roll the piece first: it has no lines';
  if(it.rprism) return 'This piece already carries an '+AB_PRISM_NAME;
  return null;
}
// a Void Anchor goes on line i of a piece with 2 or 3 lines (level 50 or 60); the same line cannot be locked twice
function abLockWhy(it,i){
  if(!it||!it.dg||!it.roll0) return 'Only a level-50 or level-60 dungeon piece can take it';
  if(!it.roll||it.roll.length<2) return 'Only a piece with two or three lines (level 50 and 60) can take a '+AB_LOCK_NAME;
  if(!Number.isInteger(i)||i<0||i>=it.roll.length) return 'That line does not exist';
  if(it.rlock===i) return 'That line is already locked';
  return null;
}
