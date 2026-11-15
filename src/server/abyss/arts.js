//@ The Abyss's artifact engine (B4): the run's bar on the hiker, abP (the product / capped sum read by the hooks), the offer after a won round, pick, skip and drop
/* agent map (docs/ABYSS.md section 5; the rows: shared/abyss/artifacts-stat.js, the registry and abArtStat: shared/abyss.js)
   exports: abP(p,stat) (1 / 0 for a rate stat outside a live Abyss run), abArtsOf(p), abArtsDirtyP(p) (the bar changed: forget the cache), abDrawOfferS(arts), abOfferP(run,p) (store + send the offer of a won round),
            abPickP(p,i), abSkipP(p), abDropP(p,i), abResendOfferP(p)
   hooks marked `// abyss:` (docs/ABYSS.md section 3): combat.js rollDmgS / damageMonsterS / the cooldown line, players.js hurtP / recalcP / healP, basic-hold.js bhSpeedP
   save: gear.ab.run.arts (ids, at most AB_ART_MAX, a repeat id again, at most AB_RANK_MAX of one id), .curses (B6: curse ids, at most AB_CURSE_MAX, outside the 20; abP multiplies their atk / hp / def / heal factors into the bar's), .offer {k:'art',o:[ids]} (stored BEFORE the event abo is sent)
   events: abo [pid,'art',ids] (an offer), aba [pid,id,copies] (a copy taken or thrown away; copies = the copies of that id now); messages abyss{a:'pick',i|'skip'|'drop',i} (server/abyss.js routes them)
   test: tools/abyss-smoke.js.   p.ab = {src,n,cn,v:{stat:value}}: the cache of the bar and the curses, rebuilt when the array or its length changes or abArtsDirtyP is called.
   B6: the combat rules (every 5th hit, kills heal, thorns, Last Breath, the shield, curses on spawns) are in server/abyss/combat.js; abP's def is applied AFTER hurtP's 10% floor and never below AB_DEF_MIN. */
const AB_TXT_FULL='Your bar is full: throw one away first.';
function abArtsOf(p){ const g=p&&p.gear&&p.gear.ab, r=g&&g.run; return r&&Array.isArray(r.arts)?r.arts:null; }
function abArtsDirtyP(p){ p.ab=null; }
// the value of a stat for a hiker: only inside a live Abyss run (never on the Proving Isle), else the neutral 1 (a rate stat: 0)
function abP(p,stat){
  const neutral=AB_RATE[stat]?0:1;
  if(!p.inst||p.pv) return neutral;
  const arts=abArtsOf(p), cur=abCursesOf(p); if(!(arts&&arts.length)&&!(cur&&cur.length)) return neutral;
  const run=DG_RUNS.get(p.inst); if(!run||!run.ab) return neutral;
  let c=p.ab; if(!c||c.src!==arts||c.n!==(arts?arts.length:0)||c.cn!==(cur?cur.length:0)){
    c={src:arts,n:arts?arts.length:0,cn:cur?cur.length:0,v:Object.create(null)};
    for(const s of AB_STATS){ let v=abArtStat(arts,s); if(s==='atk'||s==='hp'||s==='def'||s==='heal') v*=abCurseStat(cur,s); if(s==='def') v=Math.max(AB_DEF_MIN,v);  c.v[s]=v; }   // B6: the curses' own-stat factors join the bar's
    p.ab=c; }
  const v=c.v[stat]; return v===undefined?neutral:v;
}
const abCursesOf=p=>{ const g=p&&p.gear&&p.gear.ab, r=g&&g.run; return r&&Array.isArray(r.curses)?r.curses:null; };
// three different ids by rarity weight (an artifact already held 5 times is not offered); fewer if the pool runs short
function abDrawOfferS(arts,n){
  n=n>=1?Math.min(AB_OFFER_N,n|0):AB_OFFER_N;
  const held={}; for(const id of arts) held[id]=(held[id]||0)+1;
  const pool=Object.keys(AB_ARTS).filter(id=>(held[id]||0)<AB_RANK_MAX), out=[];
  while(out.length<n&&pool.length){
    let tw=0; for(const id of pool) tw+=AB_RAR_W[AB_ARTS[id].rar]||1;
    let r=Math.random()*tw, i=0; for(;i<pool.length-1;i++){ r-=AB_RAR_W[AB_ARTS[pool[i]].rar]||1; if(r<=0) break; }
    out.push(pool.splice(i,1)[0]);
  }
  return out;
}
// a won round: draw, STORE, then tell (a reopen shows the very same offer)
function abOfferP(run,p){
  const g=abSaveOf(p); if(!g.run) return;
  const ids=abDrawOfferS(g.run.arts||(g.run.arts=[]),AB_OFFER_N-abCurseStat(g.run.curses,'offer'));   // B6: a curse takes cards off the offer (at least 1 stays) if(!ids.length) return;
  g.run.offer={k:'art',o:ids}; p.dirty=true; dgEvTo('abo',p.id,'art',ids);
}
function abResendOfferP(p){ const g=abSaveOf(p), o=g.run&&g.run.offer; if(o&&o.k==='art'&&abRunOf(p)) dgEvTo('abo',p.id,'art',o.o.slice()); }
// the run, its saved bar and the offer, only between rounds (a won round that has not ended the run)
function abBetweenP(p){ const run=abRunOf(p); return run&&run.abWon&&!run.endT&&!p.dead&&abSaveOf(p).run?run:null; }
const abIdx=(i,n)=>typeof i==='number'&&Number.isInteger(i)&&i>=0&&i<n;
function abBarChangedP(p,id){
  abArtsDirtyP(p); recalcP(p); p.dirty=true;
  const n=abArtsOf(p).filter(x=>x===id).length; dgEvTo('aba',p.id,id,n);
}
function abPickP(p,i){
  if(!abBetweenP(p)) return; const g=abSaveOf(p), o=g.run.offer; if(!o||o.k!=='art'||!abIdx(i,o.o.length)) return;
  const id=o.o[i]; if(!abIsArt(id)){ g.run.offer=null; return; }
  const arts=g.run.arts||(g.run.arts=[]);
  if(arts.length>=AB_ART_MAX){ toastTo(p.id,AB_TXT_FULL,'bad'); return; }
  if(arts.filter(x=>x===id).length>=AB_RANK_MAX){ toastTo(p.id,AB_ARTS[id].name+' is at rank '+AB_RANK_MAX+' already.','bad'); return; }
  arts.push(id); g.run.offer=null; abBarChangedP(p,id);
}
function abSkipP(p){ if(!abBetweenP(p)) return; const g=abSaveOf(p); if(g.run.offer){ g.run.offer=null; p.dirty=true; } }
function abDropP(p,i){
  const run=abRunOf(p); if(!run||!run.abWon||run.endT){ if(run) toastTo(p.id,'You can throw an artifact away between rounds only.','bad'); return; }
  const g=abSaveOf(p), arts=g.run&&g.run.arts; if(!arts||!abIdx(i,arts.length)) return;
  const id=arts.splice(i,1)[0]; abBarChangedP(p,id);
}
