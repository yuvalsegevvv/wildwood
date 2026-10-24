//@ The Deep Cave's 18 set skills (floors 2-4) on the server: their extra fx keys, the timed effects they leave on players and zones, and the hooks into hurt, kill, zones and set marks
/* Agent map. Plan: docs/CAVE.md section 4; the skills are data (shared/cave/skill-<floor>-<id>.js); test: tools/cave-sets-smoke.js.
   A cave skill's p.act carries `cave:true`; resolveFxS calls caveSetFxS(p,a,tgt,src) last (hook `// cave:`), after the generic keys (dash, ally, heal, taunt...) it also uses.
   RULES: a set skill only READS its set's mark (ssMarkN / ssMarkSum count it, never ssPopS) and may ADD stacks (ssMarkS); kill refunds are capped at CAVE_REFUND_CAP charge a cast;
   heals stay under SS_HEAL_CAP and go through ssHealAllS; weaken uses the shared non-stacking `weak` (rxDirectS); each skill level scales the effect by caveLevelK (a.mult already has it).
   NEW FX KEYS (all run here; the effects agent draws them from the `cvfx` / `cvhand` events and the zone's `area` event; every one is a placeholder look today):
     cvstrike:{r,arc?,kb?,crowd:{per,max}?,markK:{id,per,max}?,behind?,burn?,slow?,stun?,mark?,status?}   a ring (or cone with arc) hit; crowd = +per for each enemy hit (up to max), markK = +per for each stack of the set's mark on that target
     refund:{n,secs,cap?}   each of YOUR kills within secs of the cast gives back n charge, at most cap (up to 15) a cast
     behindWin:secs         for secs every hit counts as from behind (ssBehind)
     retreat:{dist}         a dash dist metres away from the target (or backwards)
     wall:{dur,red,perMark,r,taunt}   Shield-Wall: allies within r behind you take red (+perMark) less from the front; taunts refresh every 2 s
     cvzone:{r,dur,every,ahead?|self?,k?,noHit?,heal?,slow?,status?,mark?,durMark?,cv:{markOne,cleanse,lane,momentum,still,lamp,endHeal}}   a ground zone with the cave hooks (caveZoneTickS / caveZoneEndS)
     next:{perMark,cap,r,dur,heal}    Intermission: your allies' next skill or burst hits harder, and they heal
     cdrParty:{base,perMark,cap,r}    Sound the Charge: skill and burst cooldowns of the party drop at once
     perch:{dur,melee,rangeAdd,sightK}   Eagle's Perch: melee within `melee` m cannot hurt you, range scaling counts rangeAdd m farther, +sightK per Sight on the target
     hold:{dur,perN:{id,n,add},max,r,land}   Stopped Hour: damage taken is held back, `land` of it lands when the hour ends (never kills)
     bell:{n,perMark,reflect,heal,dur}   Bell Echo: your next n hits taken (more with Toll) reflect and heal the party
     slide:{len,w,stun,taunt}         Landslide: drag everything in the slope to its end, stun, taunt (bosses are hit and taunted, not dragged)
     embalm:{dur,heal,perMark,r}      Embalm: an ally or you cannot fall below 1 hp, then heals
     shift:{dur,max,r,k,slow,grab}    Night Shift: each kill near you raises a grave hand (up to max) that hits, slows and rots a nearby enemy
     puppet:{dur,r,every,k,bossWeak,mark}   Marionette: a normal monster fights its neighbours for dur seconds; a boss is weakened instead
   STATE (not saved): p.cave.fx = {ref, behind, wall, next, perch, hold, bell, embalm, shift, still, moved, pup, puppets}.
   EVENTS (placeholders): cvfx [pid, kind, ...] kinds wall, next, perch, hold, hold-end, bell, embalm, embalm-end, cleanse, lane (pid, 'lane', secs, speed: the client may speed the hiker up), weak, retreat, slide, puppet;
   cvhand [x, z, targetId, ownerId] a grave hand.
   HOOKS (grep "// cave:"): resolveFxS (caveFxS), updateAreasS (noHit, caveZoneTickS, caveZoneEndS), hurtP (caveHurtS), killMonsterS (caveKillS), handleAttack (caveNextK), fxModK (caveSightK, caveRangeAdd),
   ssBehind (behind window), ssWhen (still / moved windows), caveTickP (caveFxTickP).
   Used by: combat.js, players.js, skillsets.js, cave.js. */
let caveHurtLive=0;   // S.t until which a hurt hook has something to do (the early-out of caveHurtS)
const cvX=p=>p.cave&&p.cave.fx;
function cvMoveS(p,L){   // the same landing rules as a generic dash
  if(caveFloorAt(p.x,p.z)>=0) caveDashS(p,L);
  else { p.x=clamp(L.x,WX0+14,WX1-14); p.z=clamp(L.z,WZ0+14,WZ1-14); p.y=getH(p.x,p.z); }
  if(p.inst) dgDashS(p,L);
}
function cvAwakeS(p){ return foesS(p).filter(m=>!m.dead&&!m.remove&&!m.pl); }
function cvStrikeS(p,a,C){   // a ring (or cone) hit with a crowd bonus, a bonus for the target's mark, and the usual statuses
  const hit=[];
  for(const m of cvAwakeS(p)){ const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz); if(d>C.r+m.T.rad) continue;
    if(C.arc&&!(Math.abs(angDiff(Math.atan2(-dx,-dz),p.face))<C.arc||d<m.T.rad+0.6)) continue; hit.push(m); }
  const crowd=C.crowd?1+C.crowd.per*Math.min(hit.length,C.crowd.max):1;
  for(const m of hit){ let k=crowd;
    if(C.markK) k*=1+C.markK.per*Math.min(C.markK.max,ssMarkN(p,m,C.markK.id));   // a READ of the set's mark
    if(C.behind) k*=fxModK({behind:C.behind},p,m);
    damageMonsterS(m,a.mult*k,p,p.x,p.z,C.kb||0,a.el); statusS(m,C,p,a.el,a.mult); }
}
function cvZoneS(p,a,tgt,Z,f,src,K){
  let c;
  if(Z.ahead!==undefined) c={x:p.x-Math.sin(p.face)*Z.ahead,z:p.z-Math.cos(p.face)*Z.ahead};
  else if(Z.self) c={x:p.x,z:p.z};
  else c=aimPoint(p,tgt,a.range,Z.dflt||10);
  const D=Z.durMark?Z.durMark.v*Math.min(Z.durMark.max||5,ssMarkSum(p,Z.durMark.id,Z.durMark.r)):0;   // a READ of the set's mark: a longer zone
  const spec=Object.assign({},Z,{cave:Object.assign({K},Z.cv)}); if(Z.heal) spec.heal={v:Z.heal.v*K};
  addAreaS(p,'zone',c.x,c.z,Z.r,Z.dur+D,a.mult*(Z.k===undefined?1:Z.k),false,a.el,spec,f,src);
}
function cvSlideS(p,a,tgt,L){   // Landslide: everything in a len x w slope is pulled to its end
  const ux=-Math.sin(p.face), uz=-Math.cos(p.face), ex=p.x+ux*L.len, ez=p.z+uz*L.len; let i=0;
  for(const m of cvAwakeS(p)){ const rx=m.x-p.x, rz=m.z-p.z, along=rx*ux+rz*uz, perp=Math.abs(rx*uz-rz*ux);
    if(along<0||along>L.len+m.T.rad||perp>L.w+m.T.rad) continue;
    damageMonsterS(m,a.mult,p,p.x,p.z,0,a.el); if(m.dead) continue;
    if(!m.boss&&!m.T.heavy){
      const nx=ex-ux*(Math.floor(i/3)*1.3)+uz*((i%3)-1)*1.4, nz=ez-uz*(Math.floor(i/3)*1.3)-ux*((i%3)-1)*1.4; i++;
      if(!(caveFloorAt(nx,nz)>=0&&caveWallAtS(nx,nz))){ m.x=nx; m.z=nz; m.kbx=m.kbz=0; }
      m.stunT=Math.max(m.stunT||0,L.stun); }
    if(L.taunt) ssTauntS(p,m,L.taunt); }
  ev('cvfx',p.id,'slide',r1(p.x),r1(p.z),r1(ex),r1(ez));
}
function cvPuppetS(p,a,tgt,inRange,P,K){
  const t=inRange?tgt:nearestAhead(p,a.range), X=cvX(p); if(!t||t.dead||t.remove||t.pl) return;
  ssMarkS(p,t,P.mark);   // everything hit gets a String
  if(t.boss){ rxDirectS(t,{status:{kind:'weak',v:Math.min(0.5,P.bossWeak*K),dur:P.dur}},p,1); ev('cvfx',p.id,'weak',t.id,P.dur); return; }   // a boss can't be puppeted: weakened (the shared, non-stacking weak)
  if(t.dgOwn) return;
  t.puppet=p.id; t.stunT=Math.max(t.stunT||0,P.dur); t.taunt=null;   // it stops attacking the hikers and fights its neighbours
  (X.pup||(X.pup=[])).push({m:t,until:S.t+P.dur,next:S.t+P.every,r:P.r,every:P.every,mult:a.mult*P.k,el:a.el,mark:P.mark}); X.puppets=(X.puppets|0)+1;
  ev('cvfx',p.id,'puppet',t.id,P.dur);
}
function cvHandS(p,m,sh){   // Night Shift: a grave hand rises where m died and takes the nearest living enemy
  let best=null, bd=sh.grab;
  for(const n of cvAwakeS(p)){ if(n===m) continue; const d=Math.hypot(n.x-m.x,n.z-m.z); if(d<bd){ bd=d; best=n; } }
  if(!best) return;
  sh.hands++; ev('cvhand',r1(m.x),r1(m.z),best.id,p.id);
  rxQuietS(()=>{ damageMonsterS(best,sh.mult,p,m.x,m.z,0,sh.el); });
  if(!best.dead){ best.slowT=Math.max(best.slowT||0,sh.slow); ssMarkS(p,best,{id:'rot',n:1,dur:12,max:5}); }
}
// ---- the entry: resolveFxS calls it after the generic keys ----
function caveSetFxS(p,a,tgt,src){
  if(!a.cave||!p.cave) return;
  const f=a.fx, X=p.cave.fx, K=caveLevelK(a.lvl), inRange=!!tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<=a.range+2;
  const healK=1+psP(p,'heal')+ssCondP(p,'heal',null);
  if(f.refund) X.ref={until:S.t+f.refund.secs,left:Math.min(CAVE_REFUND_CAP,f.refund.cap||CAVE_REFUND_CAP),n:f.refund.n};
  if(f.behindWin) X.behind=S.t+f.behindWin;
  if(f.cvstrike) cvStrikeS(p,a,f.cvstrike);
  if(f.cvzone) cvZoneS(p,a,tgt,f.cvzone,f,src,K);
  if(f.slide) cvSlideS(p,a,tgt,f.slide);
  if(f.puppet) cvPuppetS(p,a,tgt,inRange,f.puppet,K);
  if(f.retreat){ let ux=Math.sin(p.face), uz=Math.cos(p.face); if(inRange){ const dx=p.x-tgt.x, dz=p.z-tgt.z, d=Math.hypot(dx,dz)||1; ux=dx/d; uz=dz/d; }
    cvMoveS(p,{x:p.x+ux*f.retreat.dist,z:p.z+uz*f.retreat.dist}); ev('cvfx',p.id,'retreat'); }
  if(f.wall){ const W=f.wall, n=Math.min(W.perMark.max,ssMarkSum(p,W.perMark.id,W.perMark.r)), red=Math.min(0.8,(W.red+Math.min(0.15,W.perMark.v*n))*K);
    X.wall={until:S.t+W.dur,x:p.x,z:p.z,fx:-Math.sin(p.face),fz:-Math.cos(p.face),red,r:W.r,taunt:W.taunt,nextT:S.t+2}; caveHurtLive=Math.max(caveHurtLive,X.wall.until); ev('cvfx',p.id,'wall',W.dur,r1(red*100)); }
  if(f.next){ const N=f.next, n=Math.min(N.perMark.max,ssMarkSum(p,N.perMark.id,N.perMark.r)), v=Math.min(N.cap,N.perMark.v*n)*K;
    for(const q of ssAlliesOf(p,N.r)){ if(v>0) q.cave.fx.next={v,until:S.t+N.dur}; healP(q,q.maxHp*Math.min(SS_HEAL_CAP,N.heal*K*healK)); ev('cvfx',q.id,'next',v); } }
  if(f.cdrParty){ const C=f.cdrParty, n=Math.min(C.perMark.max,ssMarkSum(p,C.perMark.id,C.perMark.r)), sec=Math.min(C.cap,C.base+C.perMark.v*n)*K;
    for(const q of ssAlliesOf(p,C.r)) ssCdrS(q,{skill:sec,burst:sec}); }
  if(f.perch){ const P=f.perch; X.perch={until:S.t+P.dur,melee:P.melee,rangeAdd:P.rangeAdd,sightK:P.sightK*K}; caveHurtLive=Math.max(caveHurtLive,X.perch.until); ev('cvfx',p.id,'perch',P.dur); }
  if(f.hold){ const H=f.hold, n=Math.floor(Math.min(10,ssMarkSum(p,H.perN.id,H.r))/H.perN.n), dur=Math.min(H.max,H.dur+H.perN.add*n);
    for(const q of ssAlliesOf(p,H.r)){ q.cave.fx.hold={until:S.t+dur,pool:0,land:H.land}; ev('cvfx',q.id,'hold',dur); } caveHurtLive=Math.max(caveHurtLive,S.t+dur); }
  if(f.bell){ const B=f.bell, n=Math.min(B.perMark.max,Math.floor(ssMarkSum(p,B.perMark.id,B.perMark.r)/B.perMark.per));
    X.bell={left:B.n+n,until:S.t+B.dur,reflect:Math.min(0.9,B.reflect*K),heal:B.heal*K}; caveHurtLive=Math.max(caveHurtLive,X.bell.until); ev('cvfx',p.id,'bell',X.bell.left); }
  if(f.embalm){ const E=f.embalm, n=Math.min(E.perMark.max,ssMarkSum(p,E.perMark.id,E.perMark.r)); let w=p;
    for(const q of ssAlliesOf(p,E.r)) if(q.hp/q.maxHp<w.hp/w.maxHp) w=q;   // the one who needs it most (you, when alone)
    w.cave.fx.embalm={until:S.t+E.dur,heal:(E.heal+E.perMark.v*n)*K*healK}; caveHurtLive=Math.max(caveHurtLive,S.t+E.dur); ev('cvfx',w.id,'embalm',E.dur); }
  if(f.shift){ const sh=f.shift; X.shift={until:S.t+sh.dur,hands:0,max:sh.max,r:sh.r,grab:sh.grab,slow:sh.slow,mult:a.mult*sh.k,el:a.el}; }
}
// ---- zones: updateAreasS calls these for a zone made by cvzone (A.fx.cave) ----
function caveZoneTickS(o,A){
  const C=A.fx.cave, X=o.cave&&o.cave.fx, inZ=q=>Math.hypot(q.x-A.x,q.z-A.z)<=A.r, every=A.fx.every||0.5;
  if(C.markOne){ let best=null, bn=99; for(const m of cvAwakeS(o)){ if(Math.hypot(m.x-A.x,m.z-A.z)>=A.r+m.T.rad) continue; const n=ssMarkN(o,m,C.markOne.id); if(n<bn){ bn=n; best=m; } } if(best) ssMarkS(o,best,C.markOne); }
  const allies=C.cleanse||C.lane||C.lamp?ssAlliesOf(o,SS_ALLY_R*2).filter(inZ):null;
  if(C.cleanse) for(const q of allies) ev('cvfx',q.id,'cleanse');   // (the client drops its slow)
  if(C.lane) for(const q of allies) ev('cvfx',q.id,'lane',every+0.5,C.lane.speed);   // (the client speeds the hiker up while the lane lasts)
  if(C.momentum&&X&&inZ(o)) X.moved=S.t+every+0.3;
  if(C.still&&X) X.still=S.t+every+0.5;
  if(C.lamp){ const L=A.lamp||(A.lamp=new Set());
    for(const q of allies) if(!L.has(q.id)&&q.hp<q.maxHp*C.lamp.below){ L.add(q.id); healP(q,q.maxHp*Math.min(SS_HEAL_CAP,C.lamp.heal*C.K)); ev('cvfx',q.id,'lamp'); } }
}
function caveZoneEndS(o,A){
  const E=A.fx.cave.endHeal; if(!E) return;
  const n=Math.min(E.maxStacks,ssMarkSum(o,E.markId,E.r));
  if(n>0) ssHealAllS(o,Math.min(SS_HEAL_CAP,E.per*n*A.fx.cave.K),25,undefined,true);
}
// ---- hooks ----
function caveKillS(p,m){   // killMonsterS: your kill refunds charge (once per cast, capped) and raises a grave hand
  const X=cvX(p); if(!X) return;
  const r=X.ref; if(r&&S.t<r.until&&r.left>0){ const g=Math.min(r.n,r.left); r.left-=g; caveAddP(p,g); }
  const sh=X.shift; if(sh&&S.t<sh.until&&sh.hands<sh.max&&Math.hypot(m.x-p.x,m.z-p.z)<=sh.r) cvHandS(p,m,sh);
}
function caveHurtS(q,v,m){   // hurtP: what the cave's windows do to a hit q is about to take; returns the damage
  if(S.t>=caveHurtLive||!q.cave) return v;
  const X=q.cave.fx;
  if(X.perch&&X.perch.until>S.t&&m&&!m.boss&&Math.hypot(m.x-q.x,m.z-q.z)<X.perch.melee+m.T.rad) return 0;   // up on the gust: melee cannot reach (a boss's reach is its own business)
  if(m){ let red=0;
    for(const o of S.players.values()){ const W=o.cave&&o.cave.fx.wall; if(!W||W.until<=S.t||(o.inst|0)!==(q.inst|0)||Math.hypot(q.x-W.x,q.z-W.z)>W.r) continue;
      if(o!==q&&!ssAlliesOf(o,W.r).includes(q)) continue;
      const dq=(q.x-W.x)*W.fx+(q.z-W.z)*W.fz, da=(m.x-W.x)*W.fx+(m.z-W.z)*W.fz;   // behind the planted shield, the attacker in front of the victim
      if(dq<=1.5&&da>dq) red=Math.max(red,W.red); }
    if(red) v=Math.max(1,Math.round(v*(1-red))); }
  const H=X.hold; if(H&&H.until>S.t){ H.pool+=v; return 0; }
  const B=X.bell; if(B&&B.left>0&&B.until>S.t&&m&&!m.pl){ B.left--; ssRawHitS(m,v*B.reflect,q); ssHealAllS(q,Math.min(SS_HEAL_CAP,B.heal),SS_ALLY_R); ev('cvfx',q.id,'bell',B.left); }
  const E=X.embalm; if(E&&E.until>S.t) v=Math.min(v,Math.max(0,q.hp-1+(q.shield&&q.shield.until>S.t?q.shield.v:0)));   // cannot fall below 1 health
  return v;
}
function caveNextK(p,slot){   // handleAttack: Intermission's bonus rides on the next skill or burst
  const X=cvX(p), N=X&&X.next; if(!N||slot==='basic') return 1;
  X.next=null; return N.until>S.t?1+N.v:1;
}
function caveSightK(p,m){   // fxModK: Eagle's Perch, +sightK for each Sight on the target (a READ of the mark)
  const X=cvX(p), P=X&&X.perch; if(!P||P.until<=S.t) return 1;
  return 1+P.sightK*ssMarkN(p,m,'sight');
}
function caveRangeAdd(p){ const X=cvX(p), P=X&&X.perch; return P&&P.until>S.t?P.rangeAdd:0; }   // fxModK: shots count as this much farther
function caveFxTickP(p){   // every tick, every player: the windows that end, the wall's taunts, the puppets' blows
  const X=cvX(p); if(!X) return;
  const H=X.hold; if(H&&S.t>=H.until){ X.hold=null; const land=H.pool*H.land; if(land>0&&!p.dead){ p.hp=Math.max(1,p.hp-land); p.lastHit=S.t; ev('hurt',p.id,Math.round(land)); } ev('cvfx',p.id,'hold-end',Math.round(land)); }
  const E=X.embalm; if(E&&S.t>=E.until){ X.embalm=null; healP(p,p.maxHp*Math.min(SS_HEAL_CAP,E.heal)); ev('cvfx',p.id,'embalm-end'); }
  if(X.bell&&S.t>=X.bell.until) X.bell=null;
  if(X.perch&&S.t>=X.perch.until) X.perch=null;
  if(X.next&&S.t>=X.next.until) X.next=null;
  const W=X.wall; if(W){ if(S.t>=W.until) X.wall=null; else if(S.t>=W.nextT){ W.nextT=S.t+2; for(const m of cvAwakeS(p)) if(Math.hypot(m.x-W.x,m.z-W.z)<W.r+m.T.rad) ssTauntS(p,m,W.taunt); } }   // the taunts refresh
  if(X.pup&&X.pup.length) for(let i=X.pup.length-1;i>=0;i--){ const u=X.pup[i], m=u.m;
    if(m.dead||m.remove||S.t>=u.until){ m.puppet=null; X.pup.splice(i,1); continue; }
    if(S.t<u.next) continue; u.next+=u.every;
    let best=null, bd=u.r; for(const n of cvAwakeS(p)){ if(n===m) continue; const d=Math.hypot(n.x-m.x,n.z-m.z); if(d<bd){ bd=d; best=n; } }
    if(best){ damageMonsterS(best,u.mult,p,m.x,m.z,2,u.el); if(!best.dead) ssMarkS(p,best,u.mark); } }
}
