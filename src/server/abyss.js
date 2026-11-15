//@ The Abyss on the server (behind AB_ON): the save gear.ab cleaned field by field, the flag the server asks (abOnS) and the window message (abyss{a:'open'}). B2: Fight rounds (server/abyss/rounds.js)
/* agent map (docs/ABYSS.md; numbers: shared/abyss.js)
   exports: abSanitize(g,out) (sanitizeGear hook), abOnS() (AB_ON || the test world || the dev tools), abMsgP (MSG.abyss)
   hooks marked `// abyss:` (docs/ABYSS.md section 3): players.js sanitizeGear
   save: gear.ab = {top (difficulties cleared, 0-5), best (Infinite's best round), clears:[6], as (Abyssal Shards), lock (Void Anchors), sh:{d,n:{id:count}} (today's shop purchases), run:null | {d,r,at,arts:[ids],curses:[ids],offer:null | {k:'art',o:[ids]}}}
   messages in: abyss{a:'go',d} (a run, round 1), abyss{a:'next'} (after a won round), abyss{a:'out'} (between rounds; rounds.js), abyss{a:'pick',i} / {a:'skip'} / {a:'drop',i} (artifacts: abyss/arts.js), abyss{a:'open'} -> {t:'abyss',a:'info',on:1,top,best,diffs:[{id,name,lo,hi,rounds}],lv} (flag off: silence; below level AB_ENTRY_LV: a toast)
   test: tools/abyss-smoke.js */
const AB_SH_KEYS=64;   // at most this many ids in gear.ab.sh.n (the ids themselves are checked against the shop's rows in B10)
// a saved run {d,r,at}: kept only while valid and younger than AB_RUN_KEEP_S (it is never resumed in B2: the next abyss message ends it, abStaleP)
function abRunSanitize(r){
  if(!r||typeof r!=='object'||Array.isArray(r)) return null;
  const now=Date.now(), at=+r.at, d=+r.d, n=+r.r; if(!isFinite(at)||!isFinite(d)||!isFinite(n)||typeof r.at==='boolean') return null;
  if(!Number.isInteger(d)||d<0||d>AB_INF||!Number.isInteger(n)||n<1||n>999999||(AB_DIFFS[d].rounds&&n>AB_DIFFS[d].rounds)||at<=0||now-at>AB_RUN_KEEP_S*1000) return null;
  const arts=[], held={}; if(Array.isArray(r.arts)) for(const id of r.arts){ if(arts.length>=AB_ART_MAX) break; if(!abIsArt(id)||(held[id]|0)>=AB_RANK_MAX) continue; held[id]=(held[id]|0)+1; arts.push(id); }
  let offer=null, o=r.offer; if(o&&typeof o==='object'&&!Array.isArray(o)&&o.k==='art'&&Array.isArray(o.o)){ const ids=[]; for(const id of o.o) if(ids.length<AB_OFFER_N&&abIsArt(id)&&!ids.includes(id)) ids.push(id); if(ids.length) offer={k:'art',o:ids}; }
  const curses=[]; if(Array.isArray(r.curses)) for(const id of r.curses){ if(curses.length>=AB_CURSE_MAX) break; if(abIsCurse(id)) curses.push(id); }   // own-property ids only, at most AB_CURSE_MAX (they are outside the 20)
  return {d,r:n,at:Math.min(at,now),arts,curses,offer};
}
function abSanitize(g,out){
  const s=g&&g.ab&&typeof g.ab==='object'&&!Array.isArray(g.ab)?g.ab:{}, cl=Array.isArray(s.clears)?s.clears:[], sh=s.sh&&typeof s.sh==='object'&&!Array.isArray(s.sh)?s.sh:{}, n={};
  const src=sh.n&&typeof sh.n==='object'&&!Array.isArray(sh.n)?sh.n:{}; let kept=0;
  for(const k of Object.keys(src)){   // own keys only; a prototype name is never kept
    if(kept>=AB_SH_KEYS||k.length>32||PROTO_KEY.has(k)||!isFinite(+src[k])||typeof src[k]==='boolean') continue;
    const v=clampInt(src[k],0,9999,0); if(v>0){ n[k]=v; kept++; }
  }
  out.ab={top:clampInt(s.top,0,5,0),best:clampInt(s.best,0,999999,0),clears:AB_DIFFS.map((_,i)=>clampInt(cl[i],0,999999,0)),
    as:clampInt(s.as,0,AB_AS_MAX,0),lock:clampInt(s.lock,0,AB_LOCK_MAX,0),sh:{d:clampInt(sh.d,0,99999,0),n},run:abRunSanitize(s.run)};
}
const abOnS=()=>AB_ON||!!io.test||!!S.dev;
function abMsgP(p,msg){
  if(!abOnS()) return;   // flag off: silence
  const a=msg&&msg.a;
  switch(a){
    case 'go': abGoP(p,msg.d); return;   // abyss/rounds.js
    case 'next': abNextP(p); return;
    case 'out': abOutP(p); return;
    case 'pick': abPickP(p,msg.i); return;   // abyss/arts.js
    case 'skip': abSkipP(p); return;
    case 'drop': abDropP(p,msg.i); return;
    case 'open': {
      abStaleP(p);
      if((p.level|0)<AB_ENTRY_LV){ toastTo(p.id,'The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
      const g=p.gear.ab||(p.gear.ab={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,sh:{d:0,n:{}},run:null});
      sendTo(p.id,{t:'abyss',a:'info',on:1,top:g.top|0,best:g.best|0,diffs:AB_DIFFS.map(d=>({id:d.id,name:d.name,lo:d.lo,hi:d.hi,rounds:d.rounds})),lv:AB_ENTRY_LV});
      abResendOfferP(p);   // the offer a won round stored shows again (arts.js)
      return;
    }
  }
}
MSG.abyss=abMsgP;
