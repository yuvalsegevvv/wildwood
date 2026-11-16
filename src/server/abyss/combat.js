//@ The Abyss's combat rules (B6): every 5th hit, boss and execute damage, kills heal, thorns, the round-start shield, Last Breath (death prevention), curses on the run (give, spawn factors); one small function per hook
/* agent map (docs/ABYSS.md section 3c; rows: shared/abyss/artifacts-combat.js, curses.js; the product / sum reader abP: server/abyss/arts.js)
   exports: abHitS(p,m,v) (the hit's damage after the bar's rules), abKillP(p,m), abThornsS(p,m), abLastS(p) (true when it stood you up), abShieldS(p), abCurseKS(p) ({mhp,mdmg} for a run's spawns), abCurseAddP(p,id), abGiveArtP(p,id) (dev)
   hooks marked `// abyss:` (docs/ABYSS.md section 3): combat.js damageMonsterS (abHitS) and killMonsterS (abKillP), players.js hurtP (abThornsS, abLastS), rounds.js abStartRoundS (abShieldS, the curse factors) and abSpawnS
   state: p.abHits (the hit counter of the run); the shield is the ordinary p.shield (done:true: a break triggers no skill set); a used-up Last Breath is removed from gear.ab.run.arts and sent as aba [pid,id,copies]
   test: tools/abyss-smoke.js */
function abHitS(p,m,v){
  if(!p.inst||p.pv) return v;
  p.abHits=(p.abHits|0)+1;
  let k=1; if(p.abHits%AB_NTH===0) k*=abP(p,'nth');
  if(m.boss) k*=abP(p,'boss');
  if(m.maxHp>0&&m.hp<=m.maxHp*AB_EXEC_HP) k*=abP(p,'exec');
  return k===1?v:Math.max(1,Math.round(v*k));
}
function abKillP(p,m){ const k=abP(p,'killheal'); if(k>0&&!p.dead) healP(p,p.maxHp*k); }
// a monster that hit you loses a share of ITS maximum health (so it counts at any level; a boss a tenth); the kill goes the normal way
function abThornsS(p,m){
  const t=abP(p,'thorns'); if(t<=0||m.dead||m.remove||m.immune||m.hpDiv||m.pl) return;
  const dmg=t*(m.boss?0.1:1)*m.maxHp; m.hp-=dmg; ev('dmg',m.id,Math.max(1,Math.round(dmg*monK(m,p).hp)),0,p.id);
  if(m.hp<=0){ m.hp=0; killMonsterS(m,p); }
}
// a hit that would kill: the first artifact on the bar with a `last` share is used up and you stand up with that share of your health (a moment's grace so the next blow of the pack does not undo it)
function abLastS(p){
  if(!p.inst||p.pv||p.dead) return false;
  const arts=abArtsOf(p); if(!arts) return false;
  const i=arts.findIndex(id=>abIsArt(id)&&AB_ARTS[id].k.last>0); if(i<0) return false;
  const id=arts.splice(i,1)[0], frac=AB_ARTS[id].k.last;
  abBarChangedP(p,id); p.hp=Math.max(1,Math.round(p.maxHp*frac)); p.vbGrace=S.t+1.5; p.lastHit=S.t;
  toastTo(p.id,AB_ARTS[id].name+' saved you: one copy is used up.','good'); return true;
}
function abShieldS(p){ const s=abP(p,'shield'); if(s>0&&p.maxHp>0){ const v=p.maxHp*s; p.shield={v,v0:v,until:S.t+3600,done:true}; } }
// the curses' factors on every monster of a round (read once at its start, applied by abSpawnS)
function abCurseKS(p){ const c=abCursesOf(p); return {mhp:abCurseStat(c,'mhp'),mdmg:abCurseStat(c,'mdmg')}; }
function abCurseAddP(p,id){
  const g=abSaveOf(p); if(!g.run||!abRunOf(p)||!abIsCurse(id)) return false;
  const cs=g.run.curses||(g.run.curses=[]); if(cs.length>=AB_CURSE_MAX){ toastTo(p.id,'You carry as many curses as you can.','bad'); return false; }
  cs.push(id); abRunOf(p).abCK=abCurseKS(p); abArtsDirtyP(p); recalcP(p); p.dirty=true; toastTo(p.id,'Cursed: '+AB_CURSES[id].name+'. '+AB_CURSES[id].text,'bad'); return true;
}
// testing tool (devP 'abyss' art): a copy straight onto the bar, past the cap of 20 and the rank (the dev decides)
function abGiveArtP(p,id){
  const g=abSaveOf(p); if(!g.run||!abRunOf(p)||!abIsArt(id)) return false;
  const arts=g.run.arts||(g.run.arts=[]); if(arts.length>=AB_ART_MAX||arts.filter(x=>x===id).length>=AB_RANK_MAX) return false;
  arts.push(id); abBarChangedP(p,id); return true;
}
