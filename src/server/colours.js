//@ Premium colours on the server: buying one for PREM_PRICE gems (gear.pc, for every piece of the account) and saving the favourites list (gear.fav)
/* Messages: colbuy{i: premium index 0..47} (costs PREM_PRICE gems, once), colfav{l: [colour numbers]} (the favourites, at most PREM_FAV_MAX, in order). A client's number is never a key: i is an integer in range.
   The look is cleaned of unowned premium colours where cosCleanLook runs (premCleanLook, shared/colours.js). Test: tools/colours-smoke.js */
function premBuyP(p,i){
  if(!Number.isInteger(i)||i<0||i>=PREM_COLOURS.length) return;
  if(p.gear.pc.includes(i)){ toastTo(p.id,'You already own '+PREM_COLOURS[i][1],'bad'); return; }
  if((p.gear.gem||0)<PREM_PRICE){ toastTo(p.id,'A premium colour costs '+PREM_PRICE+' gems','bad'); return; }
  ambGemP(p,-PREM_PRICE); p.gear.pc.push(i); p.dirty=true;
  toastTo(p.id,PREM_COLOURS[i][1]+' is yours, on everything. Pick it in any colour row of the character editor.','loot r3');
}
function premFavP(p,list){
  if(!Array.isArray(list)) return;
  const t={}; premSanitize({fav:list.slice(0,64)},t); p.gear.fav=t.fav; p.dirty=true;
}
MSG.colbuy=(p,msg)=>premBuyP(p,msg.i);
MSG.colfav=(p,msg)=>premFavP(p,msg.l);
