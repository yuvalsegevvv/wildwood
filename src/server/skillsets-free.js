//@ version2 testing: every player may unlock any skill set and put it on (message ft); REMOVE this file when the real sources (M3) and the wardrobe (M4 / M5) land
/* Agent map. WHY: the sets' real sources (drops, the Delve, a shop: docs/SKILL-SETS.md M3) and the outfits' wardrobe (M4 / M5) are not built, and the owner wants version 2 testers to try every set. The testing tools of
   devP (economy.js) only work with the server's dev switch, and the deployed server runs --no-dev, so this is a separate message that needs no dev switch. It is the ONLY way a set is given to a player who is not a developer.
   Message in: ft{cmd:'set'|'try'|'all', v: a set id}  (set: all six pieces of the set into the skills panel; try: the same, then wear the three signature skills for every class and as many of its passives as the
   level opens; all: every set, quietly). Nothing is spent and NO LEVEL IS GIVEN (the owner's call: levels stay a thing of play and of the dev switch's `level` tool); the outfit is a client choice (game/skillsets/free.js).
   TO REMOVE: this file (and its line in the manifest), the `case 'ft'` line in api.js, game/skillsets/free.js, the #tFree markup in index.html, and the check in tools/skillsets-first8-smoke.js ("free testing tools").
   Test: tools/skillsets-first8-smoke.js. */
function ssFreeP(p,msg){   // version2 testing: remove when M3 / M4 land
  const c=msg.cmd, id=String(msg.v||'');
  if(c==='all'){ let n=0; for(const sid of SS_ORDER) n+=ssGrantSetP(p,sid,true); recalcP(p); p.dirty=true; toastTo(p.id,SS_ORDER.length+' skill sets unlocked: every piece is in the skills panel (K)','good'); return; }
  const S=SS_SETS[id]; if(!S){ toastTo(p.id,'No skill set called "'+id+'" ('+SS_ORDER.join(', ')+')','bad'); return; }
  if(c!=='set'&&c!=='try') return;   // (an unknown command: nothing happens; there is no way to ask for a level here)
  ssGrantSetP(p,id,true);
  if(c==='set'){ recalcP(p); p.dirty=true; toastTo(p.id,S.char.name+'\'s set is yours: all six pieces are in the skills panel (K)','good'); return; }
  const low=[];
  for(let pos=1;pos<=3;pos++){   // the three signature skills (ssEquipPieceP toasts the level one lacks) ...
    if(!ssEquipPieceP(p,SKILLS[S.pos[pos].ids[0]])) low.push('skill '+pos);
    const pid=S.pos[pos].passive, P=PASSIVES[pid];   // ... and the three passives, one for each slot the level has opened
    if(pos-1<passiveOpen(p.level)&&p.level>=Math.max(PASSIVE_LV,P.lv)) equipPassiveP(p,pid,pos-1); else low.push('passive '+pos);
  }
  recalcP(p); p.dirty=true;
  toastTo(p.id,S.char.name+'\'s set is on'+(low.length?' except '+low.join(', ')+' (your level is too low: the pieces wait in the skills panel until you reach it)':'')+'. Open the skills panel (K) to see it','good');
}
