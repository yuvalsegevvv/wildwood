//@ The Abyss on the server (behind AB_ON): the save gear.ab cleaned field by field, the flag the server asks (abOnS) and the window message (abyss{a:'open'}). B1: no run yet
/* agent map (docs/ABYSS.md; numbers: shared/abyss.js)
   exports: abSanitize(g,out) (sanitizeGear hook), abOnS() (AB_ON || the test world || the dev tools), abMsgP (MSG.abyss)
   hooks marked `// abyss:` (docs/ABYSS.md section 3): players.js sanitizeGear
   save: gear.ab = {top (difficulties cleared, 0-5), best (Infinite's best round), clears:[6], as (Abyssal Shards), lock (Void Anchors), sh:{d,n:{id:count}} (today's shop purchases), run:null}
   messages in: abyss{a:'open'} -> {t:'abyss',a:'info',on:1,top,best,diffs:[{id,name,lo,hi,rounds}],lv} (flag off: silence; below level AB_ENTRY_LV: a toast)
   test: tools/abyss-smoke.js */
const AB_SH_KEYS=64;   // at most this many ids in gear.ab.sh.n (the ids themselves are checked against the shop's rows in B10)
function abSanitize(g,out){
  const s=g&&g.ab&&typeof g.ab==='object'&&!Array.isArray(g.ab)?g.ab:{}, cl=Array.isArray(s.clears)?s.clears:[], sh=s.sh&&typeof s.sh==='object'&&!Array.isArray(s.sh)?s.sh:{}, n={};
  const src=sh.n&&typeof sh.n==='object'&&!Array.isArray(sh.n)?sh.n:{}; let kept=0;
  for(const k of Object.keys(src)){   // own keys only; a prototype name is never kept
    if(kept>=AB_SH_KEYS||k.length>32||PROTO_KEY.has(k)||!isFinite(+src[k])||typeof src[k]==='boolean') continue;
    const v=clampInt(src[k],0,9999,0); if(v>0){ n[k]=v; kept++; }
  }
  out.ab={top:clampInt(s.top,0,5,0),best:clampInt(s.best,0,999999,0),clears:AB_DIFFS.map((_,i)=>clampInt(cl[i],0,999999,0)),
    as:clampInt(s.as,0,AB_AS_MAX,0),lock:clampInt(s.lock,0,AB_LOCK_MAX,0),sh:{d:clampInt(sh.d,0,99999,0),n},run:null};   // run: filled in by B2 (a saved run is dropped for now)
}
const abOnS=()=>AB_ON||!!io.test||!!S.dev;
function abMsgP(p,msg){
  if(!abOnS()) return;   // flag off: silence
  const a=msg&&msg.a;
  switch(a){
    case 'open': {
      if((p.level|0)<AB_ENTRY_LV){ toastTo(p.id,'The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
      const g=p.gear.ab||(p.gear.ab={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,sh:{d:0,n:{}},run:null});
      sendTo(p.id,{t:'abyss',a:'info',on:1,top:g.top|0,best:g.best|0,diffs:AB_DIFFS.map(d=>({id:d.id,name:d.name,lo:d.lo,hi:d.hi,rounds:d.rounds})),lv:AB_ENTRY_LV});
      return;
    }
  }
}
MSG.abyss=abMsgP;
