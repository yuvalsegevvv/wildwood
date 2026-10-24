//@ The Deep Cave's floor-1 skills on the server: the new effect keys of resolveFxS they use (echo, flare, overdrive, ward, burrow, grapple, wind), and the three small reads in the damage code
/* Agent map. Skills: shared/cave/skill-1-*.js. Test: tools/cave-smoke.js. Plan: docs/CAVE.md section 4. Placeholder looks: the `vis` key (client, game/cave/methods.js caveVis); C5 draws the real ones.
   exports: caveFxS(p, a, tgt, f) (resolveFxS, only for a cave cast: a.cave), caveCritP(p) (rollDmgS: Overdrive's sure crit), caveBonusK(p) (rollDmgS: Grapple Line's +30% on the next hit, spent by it), caveBurrowTickS(p, c) (caveTickP).
   `a.mult` of a cave cast is the skill's `mult` x caveLevelK(level), and these skills use mult 1 as a pure level scale (x1.1 per level, +40% at 5): every number below that is a strength is multiplied by it.
   p.cave.last = {ab, lvl}: the last skill / burst cast (caveCastS), what Echo repeats; p.cave.od = {n, until, cd}: Overdrive; p.cave.gr = {k, until}: Grapple Line; p.cave.bur: Burrow lasts until then (hurtP takes no hit). */
function caveFxS(p,a,tgt,f){
  const c=p.cave, L=a.mult||1;
  if(f.echo){   // Echo: the last skill or burst again, at 60% power, no cooldown, no charge (a cave cast clears c.cur)
    const last=c.last; if(!last){ toastTo(p.id,'Echo: nothing to repeat yet','bad'); caveAddP(p,CAVE_SKILLS[a.sid]?CAVE_SKILLS[a.sid].cost:0); return; }
    const ab=last.ab, kind=ab.act[0];
    ev('pact',p.id,kind,Math.round(p.face*100)/100);   // the client draws the repeated cast
    resolveHitS(p,{kind,fx:ab.fx,mult:ab.mult*skillPower(last.lvl)*f.echo.k*L,range:ab.range,el:elOf(ab),tg:a.tg,aim:a.aim,sid:ab.id,lvl:last.lvl,skill:true});
  }
  if(f.flare){   // Flare: blind normal monsters (they swing and miss), weaken bosses
    for(const m of foesS(p)){ if(m.dead||m.remove||m.pl||Math.hypot(m.x-p.x,m.z-p.z)>a.range+m.T.rad) continue;
      if(m.boss) rxStatusS(m,'weak',f.flare.boss,f.flare.bossDur,p); else m.blindT=S.t+f.flare.blind*L; }
  }
  if(f.overdrive){ c.od={n:f.overdrive.n,until:S.t+f.overdrive.sec*L,cd:f.overdrive.cd}; toastTo(p.id,'Overdrive: your next '+f.overdrive.n+' basic attacks are sure crits','good'); }
  if(f.ward){   // Lantern Ward: a shield of a share of max health, half for the allies near
    const W=f.ward; ssShieldS(p,W.v*L,W.dur);
    for(const q of ssAlliesOf(p,W.r)) if(q!==p) ssShieldS(q,W.v*L*W.ally,W.dur);
  }
  if(f.burrow){   // Burrow: untouchable, a short move forward, monsters forget you
    const B=f.burrow, dir=[-Math.sin(p.face),-Math.cos(p.face)], to={x:p.x+dir[0]*B.dist,z:p.z+dir[1]*B.dist};
    if(caveFloorAt(p.x,p.z)>=0) caveDashS(p,to); else { p.x=clamp(to.x,WX0+14,WX1-14); p.z=clamp(to.z,WZ0+14,WZ1-14); p.y=getH(p.x,p.z); }
    if(p.inst) dgDashS(p,to);   // (inside a dungeon run: stays in it, short of the first wall)
    c.bur=S.t+B.sec*L; c.burT=0; caveBurrowTickS(p,c);
  }
  if(f.grapple) c.gr={k:1+(f.grapple.k-1)*L,until:S.t+f.grapple.sec};   // (the pull itself is the fx's `dash`)
  if(f.wind){   // Second Wind: a regeneration over its seconds, and slows / roots cleared (the slows are the client's: pfx)
    const W=f.wind; ssAllyS(p,'regen',W.heal*L/W.sec,W.sec,p.id); ev('pfx',p.id,'clear',0,0,0);
  }
}
const caveCritP=p=>!!(p.cave&&p.cave.odT>S.t);
function caveBonusK(p){ const g=p.cave&&p.cave.gr; if(g&&g.until>S.t){ p.cave.gr=null; return g.k; } return 1; }
function caveBurrowTickS(p,c){   // monsters that hunt you lose track while you are under (bosses keep theirs), about four times a second
  if(S.t<c.burT) return; c.burT=S.t+0.25;
  for(const m of MONS) if(m.tgt===p.id&&!m.boss&&!m.dead){ m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; }
}
