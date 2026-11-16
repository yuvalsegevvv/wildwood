//@ The Abyss's Events and Shrines (B8): a round with no fight; the encounter card is drawn, STORED in gear.ab.run.offer and sent, and abyss{a:'pick',i} resolves it against the stored offer
/* agent map (docs/ABYSS.md section 3g; the Event rows: shared/abyss/events.js, the ops: shared/abyss.js)
   exports: abEncounterS(run) (the kit's setup of an Event / Shrine round: draw + store + send), abEventFlagsP(p,id) (which choices can be taken now), abEventPickP(p,i), abShrineOfferS(g) (the stored list), abShrinePickP(p,i), abEncSendP(p) (send the stored one again)
   hooks marked `// abyss:` (docs/ABYSS.md section 3): arts.js abPickP (the dispatch), abResendOfferP
   save: gear.ab.run.offer = {k:'event', o:{id}} | {k:'shrine', o:[{t:'heal'} | {t:'curse', id} | {t:'copy', id}]}; events abo [pid,'event',id,[ok per choice]] / [pid,'shrine',[[t,id],...]]; aba for every copy gained or thrown away
   test: tools/abyss-smoke.js.   A choice that cannot be taken (a curse past AB_CURSE_MAX, a loss of what you do not hold, a gain past the 20 places) is refused with a toast and the offer stays; a gamble counts its worse branch. */
// what the ops of a list ask of the hiker, the worse branch of a gamble: {gain, lose, curse, uncurse}
function abEvNeedS(ops,out){
  out=out||{gain:0,lose:0,curse:0,uncurse:0};
  for(const o of ops){
    if(o.op==='art') out.gain+=o.n||1; else if(o.op==='lose') out.lose+=o.n||1; else if(o.op==='curse') out.curse+=o.n||1; else if(o.op==='uncurse') out.uncurse++;
    else if(o.op==='gamble'){ const a=abEvNeedS(o.win), b=abEvNeedS(o.lose); for(const k in out) out[k]+=Math.max(a[k],b[k]); }
  }
  return out;
}
// '' when the choice can be taken now, else why not
function abEvWhyP(p,ops){
  const g=abSaveOf(p).run, arts=g.arts||[], cur=g.curses||[], n=abEvNeedS(ops);
  if(arts.length<n.lose) return 'You do not hold that many artifacts.';
  if(arts.length-n.lose+n.gain>AB_ART_MAX) return 'Your bar is full: throw one away first.';
  if(cur.length+n.curse>AB_CURSE_MAX) return 'You carry as many curses as you can.';
  if(cur.length<n.uncurse) return 'You carry no curse.';
  return '';
}
const abEventFlagsP=(p,id)=>abIsEvent(id)?AB_EVENTS[id].choices.map(c=>!abEvWhyP(p,c.fx)):[];
// a random artifact of the pool the op names (rarity by weight; an artifact held 5 times is not drawn); null if the pool is empty
function abEvArtS(arts,op){
  const held={}; for(const id of arts) held[id]=(held[id]||0)+1;
  const pool=Object.keys(AB_ARTS).filter(id=>(held[id]||0)<AB_RANK_MAX&&(!op.rar||AB_ARTS[id].rar===op.rar)&&(!op.fam||AB_ARTS[id].fam===op.fam)); if(!pool.length) return null;
  let tw=0; for(const id of pool) tw+=AB_RAR_W[AB_ARTS[id].rar]||1; let r=Math.random()*tw;
  for(const id of pool){ r-=AB_RAR_W[AB_ARTS[id].rar]||1; if(r<=0) return id; } return pool[pool.length-1];
}
// run the ops (checked first by abEvWhyP); say = the lines of the result
function abEvRunP(p,ops,say){
  const g=abSaveOf(p).run, arts=g.arts||(g.arts=[]);
  for(const o of ops){
    if(o.op==='art'){ for(let i=0;i<(o.n||1);i++){ const id=arts.length<AB_ART_MAX?abEvArtS(arts,o):null; if(!id) continue; arts.push(id); abBarChangedP(p,id); say.push('+ '+AB_ARTS[id].name); } }
    else if(o.op==='lose'){ for(let i=0;i<(o.n||1)&&arts.length;i++){ const id=arts.splice(Math.floor(Math.random()*arts.length),1)[0]; abBarChangedP(p,id); say.push('- '+AB_ARTS[id].name); } }
    else if(o.op==='curse'){ for(let i=0;i<(o.n||1);i++){ const id=AB_CURSE_IDS[Math.floor(Math.random()*AB_CURSE_IDS.length)]; if(abCurseAddP(p,id)) say.push('cursed: '+AB_CURSES[id].name); } }
    else if(o.op==='uncurse'){ const cs=g.curses||[]; if(cs.length){ const id=cs.splice(Math.floor(Math.random()*cs.length),1)[0]; abArtsDirtyP(p); recalcP(p); say.push('freed of '+AB_CURSES[id].name); } }
    else if(o.op==='heal'){ p.hp=p.maxHp; say.push('healed'); }
    else if(o.op==='gamble'){ const win=Math.random()<o.p; say.push(win?'luck holds':'luck turns'); abEvRunP(p,win?o.win:o.lose,say); }
  }
}
const AB_CURSE_IDS=Object.keys(AB_CURSES);
// a round with no fight: the hiker waits on the platform for the card (the same state as a won round, so pick / drop / next work); the kit calls it from its setup
function abEncounterS(run){
  run.abWon=true; run.phase='won'; abHudS(run);
  for(const p of dgPresentS(run)){
    const g=abSaveOf(p); if(!g.run) continue;
    if(run.abKind==='event'){ const ids=Object.keys(AB_EVENTS); if(!ids.length) continue; g.run.offer={k:'event',o:{id:ids[Math.floor(Math.random()*ids.length)]}}; }
    else g.run.offer={k:'shrine',o:abShrineOfferS(g.run)};
    p.dirty=true; dgEvTo('abw',p.id,run.abR,run.abKind); abEncSendP(p);
  }
}
function abEncSendP(p){
  const o=abSaveOf(p).run&&abSaveOf(p).run.offer; if(!o) return;
  if(o.k==='event') dgEvTo('abo',p.id,'event',o.o.id,abEventFlagsP(p,o.o.id));
  else if(o.k==='shrine') dgEvTo('abo',p.id,'shrine',o.o.map(c=>[c.t,c.id||'']));
}
// the shrine's cards: heal, a removal for each curse held (distinct), a copy of up to 4 artifacts held (distinct, under rank 5) while a place is free
function abShrineOfferS(run){
  const o=[{t:'heal'}], cs=run.curses||[], arts=run.arts||[];
  for(const id of new Set(cs)) o.push({t:'curse',id});
  if(arts.length<AB_ART_MAX){ const held={}; for(const id of arts) held[id]=(held[id]||0)+1; const ids=Object.keys(held).filter(id=>held[id]<AB_RANK_MAX);
    for(let i=0;i<4&&ids.length;i++) o.push({t:'copy',id:ids.splice(Math.floor(Math.random()*ids.length),1)[0]}); }
  return o;
}
// pick i of an Event: refused (toast, the offer stays) when it cannot be taken
function abEventPickP(p,i){
  const g=abSaveOf(p), o=g.run.offer, E=o&&o.k==='event'&&abIsEvent(o.o.id)?AB_EVENTS[o.o.id]:null; if(!E||!abIdx(i,E.choices.length)) return;
  const c=E.choices[i], why=abEvWhyP(p,c.fx); if(why){ toastTo(p.id,why,'bad'); return; }
  const say=[]; g.run.offer=null; abEvRunP(p,c.fx,say); p.dirty=true;
  toastTo(p.id,E.name+': '+(say.length?say.join(', '):'you walk on')+'.',say.some(s=>/^cursed|turns/.test(s))?'bad':'good'); abAfterPickP(p);
}
function abShrinePickP(p,i){
  const g=abSaveOf(p), o=g.run.offer; if(!o||o.k!=='shrine'||!abIdx(i,o.o.length)) return;
  const c=o.o[i], arts=g.run.arts||(g.run.arts=[]), cs=g.run.curses||(g.run.curses=[]);
  if(c.t==='heal'){ p.hp=p.maxHp; toastTo(p.id,'The shrine heals you to full.','good'); }
  else if(c.t==='curse'){ const k=cs.indexOf(c.id); if(k<0){ toastTo(p.id,'You no longer carry that curse.','bad'); return; } cs.splice(k,1); abArtsDirtyP(p); recalcP(p); toastTo(p.id,'The shrine lifts '+AB_CURSES[c.id].name+'.','good'); }
  else if(c.t==='copy'){
    if(arts.length>=AB_ART_MAX){ toastTo(p.id,AB_TXT_FULL,'bad'); return; }
    if(arts.indexOf(c.id)<0){ toastTo(p.id,'You no longer hold that artifact.','bad'); return; }
    if(arts.filter(x=>x===c.id).length>=AB_RANK_MAX){ toastTo(p.id,AB_ARTS[c.id].name+' is at rank '+AB_RANK_MAX+' already.','bad'); return; }
    arts.push(c.id); abBarChangedP(p,c.id); toastTo(p.id,'The shrine copies '+AB_ARTS[c.id].name+'.','good');
  } else return;
  g.run.offer=null; p.dirty=true; abAfterPickP(p);
}
