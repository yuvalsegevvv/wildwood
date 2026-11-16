//@ The Abyss's Events (B8): eight encounter cards of 2-3 choices (a rare artifact for a curse, a trade, a gamble, a wildcard, a heal for a curse); one defineAbEvent row each; the Event rounds draw one
/* agent map (docs/ABYSS.md section 3g; registry: shared/abyss.js defineAbEvent, the ops: server/abyss/events.js)
   exports: nothing (the rows fill AB_EVENTS)
   users: server/abyss/events.js (the draw, the availability of a choice, the pick), game/abyss/encounter.js (the card)
   test: tools/abyss-smoke.js (every event's every choice resolves and does what it says)
   Curses come only from here (plan section 5): they sit outside the 20 places, at most AB_CURSE_MAX; a choice that would add one past the cap, throw away what you do not have or add past 20 places is greyed out.
   Every event has a way to walk on (fx []). Ops: art {rar, fam, n}, lose {n}, curse {n}, uncurse, heal, gamble {p, win, lose}. */
defineAbEvent({id:'ab_ev_altar',name:'The Whispering Altar',icon:'♆',text:'A black altar hums your name. Something on it wants to be taken.',choices:[
  {label:'Take what it offers',text:'A rare artifact, and a curse.',fx:[{op:'art',rar:'rare'},{op:'curse'}]},
  {label:'Kneel and pray',text:'Heal to full health.',fx:[{op:'heal'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_peddler',name:'The Void Peddler',icon:'☖',text:'A hooded peddler lays out a blanket of glittering junk. "Everything has a price, hiker."',choices:[
  {label:'Trade one for two',text:'Lose a random artifact, gain two common ones.',fx:[{op:'lose'},{op:'art',rar:'common',n:2}]},
  {label:'Buy a rare on credit',text:'A rare artifact, and a curse.',fx:[{op:'art',rar:'rare'},{op:'curse'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_coin',name:'The Coin of Two Faces',icon:'◐',text:'A coin hangs in the air, spinning. One face glows, the other is a hole.',choices:[
  {label:'Flip it',text:'Even odds: a rare artifact, or a curse.',fx:[{op:'gamble',p:0.5,win:[{op:'art',rar:'rare'}],lose:[{op:'curse'}]}]},
  {label:'Flip it twice',text:'One in three: a wildcard. Otherwise two curses.',fx:[{op:'gamble',p:0.34,win:[{op:'art',fam:'wild'}],lose:[{op:'curse',n:2}]}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_shard',name:'The Bargain Shard',icon:'◆',text:'A shard of black glass floats at eye height. It promises power, with a catch.',choices:[
  {label:'Take the wildcard',text:'A wildcard artifact (a big plus and a real minus).',fx:[{op:'art',fam:'wild'}]},
  {label:'Take a common one, clean',text:'A common artifact.',fx:[{op:'art',rar:'common'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_scars',name:'The Fountain of Scars',icon:'♒',text:'A fountain of violet water. Old wounds close in it, and new ones open.',choices:[
  {label:'Drink',text:'Heal to full health, and take a curse.',fx:[{op:'heal'},{op:'curse'}]},
  {label:'Bathe in it',text:'Wash one curse away.',fx:[{op:'uncurse'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_forge',name:'The Broken Forge',icon:'⚒',text:'A forge with no fire, only a glow. It will melt what you carry into something else.',choices:[
  {label:'Melt one for a rare',text:'Lose a random artifact, gain a rare one.',fx:[{op:'lose'},{op:'art',rar:'rare'}]},
  {label:'Melt two for a wildcard',text:'Lose two random artifacts, gain a wildcard.',fx:[{op:'lose',n:2},{op:'art',fam:'wild'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_mirror',name:'The Hungry Mirror',icon:'◫',text:'A tall mirror shows you with a fuller bar. Its frame is made of teeth.',choices:[
  {label:'Step in',text:'Six in ten: two common artifacts. Otherwise it eats one of yours.',fx:[{op:'gamble',p:0.6,win:[{op:'art',rar:'common',n:2}],lose:[{op:'lose'}]}]},
  {label:'Touch the glass',text:'A common artifact, and a curse.',fx:[{op:'art',rar:'common'},{op:'curse'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
defineAbEvent({id:'ab_ev_tithe',name:'The Tithe Collector',icon:'☗',text:'A tall figure in a ledger-coat holds out a hand. "A tithe, for passage."',choices:[
  {label:'Pay in health and luck',text:'Take a curse: gain a common artifact and heal to full.',fx:[{op:'art',rar:'common'},{op:'heal'},{op:'curse'}]},
  {label:'Pay an artifact',text:'Lose a random artifact: one curse is struck from the ledger.',fx:[{op:'lose'},{op:'uncurse'}]},
  {label:'Walk on',text:'Nothing happens.',fx:[]}]});
