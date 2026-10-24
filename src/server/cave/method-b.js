//@ Cave method B on the server, Resonance crystals: three geodes crack only to the element (or two-element chain) written on them; an attack's element is checked when it lands
/* Agent map. Numbers and the elements each floor asks: shared/cave/method-b-crystals.js (p.need[floor] = three entries, an element or [first, second]). State p.cm.B = {st[3] 0 sealed / 1 cracked, au[3] {el, until}: the first of a chain was hit}.
   caveGeodeHitS(p, a) is called by resolveHitS with the attack that lands: the element counts as elemEffS (an enchanting buff gives a basic attack its element); a basic attack with no element counts as your soul's
   (so every hiker can crack at least one kind); the geode must be within the attack's reach (at least `reach`, at most `maxReach` m), in front of you (or very close) and in sight. The reaction chart is not asked:
   the chain IS the reaction (the two elements named). */
function caveGeodeHitS(p,a){
  const M=p.cm; if(!M||p.dead||p.pv||M.n<1||caveCdLeft(p,M.n,'B')>0) return;
  const D=caveMethodDef('B').p, need=D.need[M.n], W=caveAW(M.n), B=M.B;
  let el=elemEffS(p,a.el); if(!el||el==='basic') el=soulOfP(p); if(!el||el==='basic') return;
  const reach=Math.min(D.maxReach,Math.max(D.reach,+a.range||0));
  for(let i=0;i<3;i++){
    if(B.st[i]) continue;
    const g=W.B.geodes[i], dx=g.x-p.x, dz=g.z-p.z, d=Math.hypot(dx,dz); if(d>reach) continue;
    if(d>3&&Math.abs(angDiff(Math.atan2(-dx,-dz),p.face))>0.9) continue;
    if(!caveLos(p.x,p.z,g.x+(g.nx||0)*0.6,g.z+(g.nz||0)*0.6)) continue;
    const w=need[i], chain=Array.isArray(w);
    if(!chain){ if(el===w) caveGeodeCrackS(p,M,i); continue; }
    const au=B.au[i];
    if(au&&au.until>S.t&&el===w[1]){ B.au[i]=null; caveGeodeCrackS(p,M,i); }
    else if(el===w[0]){ B.au[i]={el,until:S.t+D.chain}; caveMTell(p,M,'g'+i,'The geode hums. Now '+ELEMS[w[1]].name+', quickly!','good'); }
  }
}
function caveGeodeCrackS(p,M,i){
  M.B.st[i]=1; const n=M.B.st.filter(x=>x).length;
  toastTo(p.id,'The geode cracks! '+n+' of 3','good');
  if(n===3){ M.B.st=[0,0,0]; M.B.au=[null,null,null]; caveMDoneP(p,M,'B'); }
}
