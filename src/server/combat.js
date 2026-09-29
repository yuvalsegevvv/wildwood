//@ Combat on the server: attacks, projectiles, damage (level debuff, crits, elements), generic skill effects (fx), burning, kills, shared rewards, loot, boss skill drops
/* Your damage = 3 x f(level) + weapon attack, times the ability's multiplier (and its skill level: skillPower), +/-15%, 12% chance of x1.7,
   times the Ferocity passive and the element: your soul (elements.js: soulMult, the opposite pairs) and the element wheel against the monster (foeMult).
   -5% damage dealt per level the enemy is above you (never below 10%).
   Everyone who hit a monster in the last 30 s and is within 80 m gets the XP, coins, quest credit and a loot roll. */
const PROJS=[]; let nextProjId=1;
function handleAttack(p,msg){
  if(p.dead||p.act) return;
  const k=SLOTS.includes(msg.k)?msg.k:'basic'; if(p.cd[k]>0.08) return;
  const cls=clsOfP(p), ab=abilityOf(cls,k,p.gear.skills,p.level); if(!ab) return;   // no skill equipped, or the slot is still locked
  const [kind,dur,hitAt]=ab.act;
  const lvl=skillLvOf(p.gear.skills,ab.id);
  p.cd[k]=abilityCd(ab,p.gear.skills,p.level)*(k==='basic'&&p.buff?p.buff.cd:1);
  if(isFinite(+msg.face)) p.face=+msg.face;
  const tg=MON_BY_ID.get(msg.tg);
  const aim=Array.isArray(msg.aim)&&msg.aim.length===3&&msg.aim.every(v=>isFinite(+v))?norm3(msg.aim.map(Number)):[-Math.sin(p.face),0,-Math.cos(p.face)];
  p.act={kind,t:0,dur,hitAt,done:false,skill:k!=='basic',sid:ab.id,lvl,el:elOf(ab),fx:ab.fx,mult:ab.mult*skillPower(lvl),range:ab.range,tg:tg&&!tg.dead?tg.id:null,aim};
  ev('pact',p.id,kind,Math.round(p.face*100)/100);
  if(k!=='basic') mqActP(p,k);   // the main quest's 'use your skill / burst' steps
}
// the element multiplier of an attack of element el (a skill's, 'basic' if none) from p on monster m: their soul and the monster's own element
function elemHitS(p,el,m){ el=el||'basic'; if(el==='basic'&&p.buff&&p.buff.el) el=p.buff.el;   // an enchanting buff gives element-less attacks its element
  return soulMult(soulOfP(p),el,psP(p,'soul'))*(m?foeMult(el,elOf(m.T)):1); }
function rollDmgS(p,mult,m,el){
  const b=p.buff, crit=Math.random()<0.12+psP(p,'crit')+(b?b.crit:0), ld=m?Math.max(0,m.T.level-p.level):0, em=elemHitS(p,el,m);
  return {v:Math.max(1,Math.round(p.dmg*mult*(b?b.dmg:1)*(1+psP(p,'dmg'))*em*Math.max(0.1,1-0.05*ld)*AR(0.85,1.15)*(crit?1.7:1))),crit,fx:em>1.01?1:em<0.99?-1:0};   // fx: 1 = the element helped, -1 = it hurt
}
function damageMonsterS(m,mult,p,fromX,fromZ,kb,el){   // returns the damage dealt (0 if none)
  if(m.dead||m.remove) return 0;
  if(m.immune){ ev('imm',m.id); return 0; }
  if(m.boss && m.B.stunT>0) mult*=1.5;
  const d=rollDmgS(p,mult,m,el);
  if(m.T.heavy) kb=0;
  m.hp-=d.v; m.hitters.set(p.id,S.t);
  if(p.buff&&p.buff.steal) healP(p,d.v*p.buff.steal);
  const ex=m.x-fromX, ez=m.z-fromZ, e=Math.hypot(ex,ez)||1, k=kb===0?0:(kb||3);
  m.kbx+=ex/e*k; m.kbz+=ez/e*k;
  if(!m.aggro||!S.players.get(m.tgt)){ m.aggro=true; m.tgt=p.id; }
  if(d.fx) ev('dmg',m.id,d.v,d.crit?1:0,p.id,d.fx); else ev('dmg',m.id,d.v,d.crit?1:0,p.id);
  if(m.hp<=0){ m.hp=0; killMonsterS(m,p); }
  return d.v;
}
function killMonsterS(m,p){
  m.burnT=0; m.dead=true; m.deadT=0; m.respawnT=35; m.pendingHit=-1; m.aggro=false; m.tgt=null; m.act=null;
  ev('kill',m.id,p?p.id:null);
  if(!m.T.noXp){
    for(const [pid,tm] of m.hitters){ const q=S.players.get(pid); if(!q||S.t-tm>30||Math.hypot(q.x-m.x,q.z-m.z)>80) continue; rewardKill(q,m); }
  }
  m.hitters.clear();
  if(m.boss) bossDefeatedS(m);
}
function rewardKill(q,m){
  gainExpP(q,m.T.xp*(1+psP(q,'xp')),m.id);
  const c=coinsFor(m.def.level)*(m.def.boss?20:1); q.gear.coins+=c; ev('coins',q.id,c,m.id);
  const r=m.def.boss?rollBossRarity():rollMonsterRarity();
  if(r>=0) addItemP(q,randomItem(tierFor(m.def.level),r),false,m.id);
  if(MATS[m.def.id]){ const n=rollDropCount(m.def,psP(q,'drop')); if(n) addMatP(q,m.def.id,n,m.id); }
  questKillP(q,m.def.id); q.dirty=true;
  if(m.def.boss) bossSkillDropP(q,m.def.id);
  mqKillP(q,m);
  if(m.def.id==='boss') openValeP(q);
}
// a boss kill: each of that boss's skills you do not own yet drops with BOSS_SKILL_CHANCE (drops.js); you choose when to equip it
function bossSkillDropP(q,bossId){
  const sk=q.gear.skills;
  for(const id of BOSS_SKILLS[bossId]||[]){
    if(sk.owned.includes(id)||Math.random()>=BOSS_SKILL_CHANCE) continue;
    sk.owned.push(id); q.dirty=true; ev('skilldrop',q.id,id);
    toastTo(q.id,SKILLS[id].name+' dropped! ('+CLASSES[SKILLS[id].cls].name+' skill)','loot r3');
  }
}
function handPosS(p){ return {x:p.x-Math.sin(p.face)*0.4,y:p.y+1.4,z:p.z-Math.cos(p.face)*0.4}; }
function dirToS(p,m){ const c=monCenterS(m), h=handPosS(p); return norm3([c.x-h.x,c.y-h.y,c.z-h.z]); }
function rotY(v,a){ const c=Math.cos(a), s=Math.sin(a); return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c]; }
// where a ground skill lands: on the target if there is one in range, otherwise straight ahead
function aimPoint(p,tgt,range,ahead){
  if(tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<=range+3) return {x:tgt.x,z:tgt.z};
  return {x:p.x-Math.sin(p.face)*ahead,z:p.z-Math.cos(p.face)*ahead};
}
function nearestAhead(p,range){ let best=null,bs=1e9; for(const m of MONS){ if(m.dead||m.remove) continue; const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz); if(d>range) continue; const ang=Math.abs(angDiff(Math.atan2(-dx,-dz),p.face)); if(ang>1.1&&d>4) continue; const sc=d+ang*8; if(sc<bs){ bs=sc; best=m; } } return best; }
function resolveHitS(p,a){
  const cls=clsOfP(p), C=CLASSES[cls], T=a.tg?MON_BY_ID.get(a.tg):null, tgt=T&&!T.dead&&!T.remove?T:null;
  if(tgt && a.kind!=='spin') p.face=Math.atan2(-(tgt.x-p.x),-(tgt.z-p.z));
  const alive=m=>!m.dead&&!m.remove;
  if(a.fx){ resolveFxS(p,a,tgt); return; }
  if(a.kind==='slash'||a.kind==='bash'){
    const bash=a.kind==='bash', reach=bash?3.2:2.9, arc=bash?0.9:1.1;
    for(const m of MONS){ if(!alive(m)) continue; const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz); if(d>reach+m.T.rad) continue;
      const ang=Math.abs(angDiff(Math.atan2(-dx,-dz),p.face)); if(ang<arc||d<m.T.rad+0.6){ damageMonsterS(m,a.mult,p,p.x,p.z,bash?5:4,a.el); if(bash&&!m.T.heavy&&!m.boss&&!m.dead) m.stunT=2; } }
  } else if(a.kind==='spin'){
    for(const m of MONS){ if(alive(m)&&Math.hypot(m.x-p.x,m.z-p.z)<3.3+m.T.rad) damageMonsterS(m,a.mult,p,p.x,p.z,6,a.el); }
  } else if(a.kind==='charge'){
    const L=tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<=a.range+2?(()=>{ const dx=tgt.x-p.x, dz=tgt.z-p.z, d=Math.hypot(dx,dz)||1, o=tgt.T.rad+0.9; return {x:tgt.x-dx/d*o,z:tgt.z-dz/d*o}; })():{x:p.x-Math.sin(p.face)*8,z:p.z-Math.cos(p.face)*8};
    p.x=clamp(L.x,WX0+14,WX1-14); p.z=clamp(L.z,WZ0+14,WZ1-14); p.y=getH(p.x,p.z);
    for(const m of MONS){ if(alive(m)&&Math.hypot(m.x-p.x,m.z-p.z)<2.6+m.T.rad) damageMonsterS(m,a.mult,p,p.x,p.z,6,a.el); }
  } else if(a.kind==='shoot'){
    fireProjS(p,'arrow',tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<36?dirToS(p,tgt):a.aim,tgt,a.mult,a.el);
  } else if(a.kind==='volley'){
    const base=tgt?dirToS(p,tgt):a.aim;
    for(const off of [-0.2,0,0.2]){
      const d=rotY(base,off); let best=null,bs=0.26;
      for(const m of MONS){ if(!alive(m)||Math.hypot(m.x-p.x,m.z-p.z)>34) continue; const v=dirToS(p,m); const ang=Math.acos(clamp(v[0]*d[0]+v[1]*d[1]+v[2]*d[2],-1,1)); if(ang<bs){ bs=ang; best=m; } }
      fireProjS(p,'arrow',d,best,a.mult,a.el);
    }
  } else if(a.kind==='pierce'){
    const d=tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<a.range+2?dirToS(p,tgt):a.aim; const l=Math.hypot(d[0],d[2])||1; fireProjS(p,'pierce',[d[0]/l,0,d[2]/l],null,a.mult,a.el);   // flies level, skimming the ground
  } else if(a.kind==='rain'){
    const c=aimPoint(p,tgt,a.range,10); addAreaS(p,'rain',c.x,c.z,4,2.6,a.mult,false,a.el);
  } else if(a.kind==='meteor'){
    const c=aimPoint(p,tgt,a.range,10); addAreaS(p,'meteor',c.x,c.z,4.5,1.2,a.mult,false,a.el);
  } else if(a.kind==='shard'){
    fireProjS(p,'shard',tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<32?dirToS(p,tgt):a.aim,tgt,a.mult,a.el);
  } else if(a.kind==='missiles'){
    // three homing missiles: the target first, then the nearest other enemies around it
    const first=tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<=a.range+2?tgt:nearestAhead(p,a.range);
    const near=first?MONS.filter(m=>alive(m)&&m!==first&&Math.hypot(m.x-first.x,m.z-first.z)<6).sort((x,y)=>Math.hypot(x.x-first.x,x.z-first.z)-Math.hypot(y.x-first.x,y.z-first.z)):[];
    const tg3=[first,near[0]||first,near[1]||first];
    [-0.35,0,0.35].forEach((off,i)=>fireProjS(p,'missile',rotY(tg3[i]?dirToS(p,tg3[i]):a.aim,off),tg3[i],a.mult,a.el));
  } else if(a.kind==='quake'||a.kind==='inferno'){
    for(const m of MONS){ if(!alive(m)||Math.hypot(m.x-p.x,m.z-p.z)>=a.range+m.T.rad) continue; damageMonsterS(m,a.mult,p,p.x,p.z,7,a.el); if(a.kind==='quake'&&!m.T.heavy&&!m.boss&&!m.dead) m.stunT=1.5; }
  } else if(a.kind==='bladestorm'){
    addAreaS(p,'storm',p.x,p.z,a.range,4,a.mult,true,a.el);
  } else if(a.kind==='hail'){
    const c=aimPoint(p,tgt,a.range,12); addAreaS(p,'hail',c.x,c.z,7,4.1,a.mult,false,a.el);
  } else if(a.kind==='blizzard'){
    const c=aimPoint(p,tgt,a.range,12); addAreaS(p,'blizzard',c.x,c.z,8,5.1,a.mult,false,a.el);
  } else if(a.kind==='snipe'){
    fireProjS(p,'snipe',tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<a.range+2?dirToS(p,tgt):a.aim,tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<a.range+2?tgt:null,a.mult,a.el);
  } else if(a.kind==='berserk'||a.kind==='focus'||a.kind==='surge'){
    applyBuffS(p,a);
  } else if(a.kind==='cast'){
    fireProjS(p,'bolt',tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<30?dirToS(p,tgt):a.aim,tgt,a.mult,a.el);
  } else if(a.kind==='nova'){
    for(const m of MONS){ if(alive(m)&&Math.hypot(m.x-p.x,m.z-p.z)<5.5+m.T.rad){ damageMonsterS(m,a.mult,p,p.x,p.z,5,a.el); m.slowT=3.5; } }
  } else if(a.kind==='chain'){
    // lightning: the target, then up to 4 more, each the nearest unhit enemy within 7 m of the last, 15% weaker per jump
    let cur=tgt&&Math.hypot(tgt.x-p.x,tgt.z-p.z)<=a.range+2?tgt:nearestAhead(p,a.range);
    const h=handPosS(p), pts=[[r1(h.x),r1(h.y),r1(h.z)]], hit=new Set();
    for(let i=0;i<5&&cur;i++){
      hit.add(cur); const c=monCenterS(cur); pts.push([r1(c.x),r1(c.y),r1(c.z)]);
      damageMonsterS(cur,a.mult*Math.pow(0.85,i),p,c.x,c.z,1,a.el);
      let nx=null,nd=7; for(const m of MONS){ if(!alive(m)||hit.has(m)) continue; const d=Math.hypot(m.x-cur.x,m.z-cur.z); if(d<nd){ nd=d; nx=m; } } cur=nx;
    }
    if(pts.length===1){ const e=[h.x-Math.sin(p.face)*8,h.y,h.z-Math.cos(p.face)*8]; pts.push(e.map(r1)); }
    ev('chain',pts);
  }
}
// a buff skill (the row's buff): a timed boost; a higher skill level makes the bonus stronger and 0.5 s longer.
// buff = {dur, dmg (damage x), cd (basic cooldown x), crit (+chance), red (damage taken less), steal (share of your damage you heal), regen (max health per second), el (element of element-less attacks), reset}
function applyBuffS(p,a){
  const b=SKILLS[a.sid].buff, dur=b.dur+0.5*(a.lvl-1);
  p.buff={id:a.sid,until:S.t+dur,dmg:1+(b.dmg-1)*skillPower(a.lvl),cd:b.cd,crit:b.crit,red:b.red||0,steal:b.steal||0,regen:b.regen||0,el:b.el||null};
  if(b.reset) p.cd.skill=0;
  ev('buff',p.id,a.sid,dur);
}
// what a hit does besides damage (an entry of a skill's fx): stun (not bosses or heavy enemies), slow, burn (a share k of the hit's damage again every second)
function statusS(m,s,p,el,mult){
  if(m.dead||m.remove) return;
  if(s.stun&&!m.T.heavy&&!m.boss) m.stunT=Math.max(m.stunT||0,s.stun);
  if(s.slow) m.slowT=Math.max(m.slowT||0,s.slow);
  if(s.burn){ m.burnT=s.burn.dur; m.burnMult=mult*s.burn.k; m.burnBy=p.id; m.burnEl=el; m.burnTick=1; }
}
function updateBurnS(dt){
  for(const m of MONS){
    if(!(m.burnT>0)) continue;
    if(m.dead||m.remove){ m.burnT=0; continue; }
    m.burnT-=dt; m.burnTick-=dt;
    if(m.burnTick<=0){ m.burnTick+=1; const o=S.players.get(m.burnBy); if(o) damageMonsterS(m,m.burnMult,o,m.x,m.z,0,m.burnEl); else m.burnT=0; }
  }
}
/* Skills with generic effects: the row's fx lists what happens, resolved in this order when the swing lands (any of them can be combined):
   buff:1                                the row's buff (and nothing else)
   dash:{ahead}                          jump to the target (within range) or ahead metres, then the rest happens where you land
   ring:{r,kb,stun,slow,burn}            everything within r m of you takes a hit (kb < 0 pulls it to you)
   cone:{r,arc,hits,kb,stun,slow,burn}   everything in front within r m and arc radians takes hits hits
   beam:{len,w,hits,steal}               a line of len m and half-width w through everything, steal = the share of the damage dealt that heals you
   chain:{n,fall,range}                  the target and n-1 more, each the nearest within range of the last, fall x weaker every jump
   proj:{kind,n,spread,seek,speed,turn,life,splash:{r,k},zone:{...},burn,slow,stun}   n projectiles in a fan (seek: each picks a different enemy near you)
   zone:{r,dur,every,once,follow,self,kb,slow,stun}     a ground area at the target (or on you), hitting every 'every' s (once: a single hit at the end)
   k = a share of the skill's mult. Statuses (stun, slow, burn:{dur,k}) go with the entry they are in. */
function resolveFxS(p,a,tgt){
  const f=a.fx, alive=m=>!m.dead&&!m.remove, dist=m=>Math.hypot(m.x-p.x,m.z-p.z), inRange=tgt&&dist(tgt)<=a.range+2;
  const dmg=(m,mult,x,z,kb)=>damageMonsterS(m,mult,p,x,z,kb,a.el)||0;
  if(f.buff){ applyBuffS(p,a); return; }
  if(f.dash){
    const L=inRange?(()=>{ const dx=tgt.x-p.x, dz=tgt.z-p.z, d=Math.hypot(dx,dz)||1, o=tgt.T.rad+0.9; return {x:tgt.x-dx/d*o,z:tgt.z-dz/d*o}; })():{x:p.x-Math.sin(p.face)*f.dash.ahead,z:p.z-Math.cos(p.face)*f.dash.ahead};
    p.x=clamp(L.x,WX0+14,WX1-14); p.z=clamp(L.z,WZ0+14,WZ1-14); p.y=getH(p.x,p.z);
  }
  if(f.ring){ const R=f.ring; for(const m of MONS){ if(!alive(m)||dist(m)>=R.r+m.T.rad) continue; dmg(m,a.mult,p.x,p.z,R.kb||0); statusS(m,R,p,a.el,a.mult); } }
  if(f.cone){ const C=f.cone;
    for(const m of MONS){ if(!alive(m)) continue; const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz); if(d>C.r+m.T.rad) continue;
      if(Math.abs(angDiff(Math.atan2(-dx,-dz),p.face))<C.arc||d<m.T.rad+0.6){ for(let h=0;h<(C.hits||1);h++) dmg(m,a.mult,p.x,p.z,h?0:C.kb||0); statusS(m,C,p,a.el,a.mult); } } }
  if(f.beam){ const B=f.beam, d=inRange?dirToS(p,tgt):a.aim, l=Math.hypot(d[0],d[2])||1, ux=d[0]/l, uz=d[2]/l, h0=handPosS(p); let dealt=0;
    for(const m of MONS){ if(!alive(m)) continue; const rx=m.x-p.x, rz=m.z-p.z, along=rx*ux+rz*uz, perp=Math.abs(rx*uz-rz*ux);
      if(along<0||along>B.len+m.T.rad||perp>B.w+m.T.rad) continue; for(let h=0;h<(B.hits||1);h++) dealt+=dmg(m,a.mult,p.x,p.z,0); }
    if(B.steal&&dealt) healP(p,dealt*B.steal);
    ev('beam',r1(h0.x),r1(h0.y),r1(h0.z),r1(h0.x+ux*B.len),r1(h0.y),r1(h0.z+uz*B.len),a.el,B.w); }
  if(f.chain){ const C=f.chain;
    let cur=inRange?tgt:nearestAhead(p,a.range); const h=handPosS(p), pts=[[r1(h.x),r1(h.y),r1(h.z)]], hit=new Set();
    for(let i=0;i<C.n&&cur;i++){
      hit.add(cur); const c=monCenterS(cur); pts.push([r1(c.x),r1(c.y),r1(c.z)]); dmg(cur,a.mult*Math.pow(C.fall,i),c.x,c.z,1);
      let nx=null,nd=C.range; for(const m of MONS){ if(!alive(m)||hit.has(m)) continue; const d=Math.hypot(m.x-cur.x,m.z-cur.z); if(d<nd){ nd=d; nx=m; } } cur=nx; }
    if(pts.length===1) pts.push([h.x-Math.sin(p.face)*8,h.y,h.z-Math.cos(p.face)*8].map(r1));
    ev('chain',pts,a.el); }
  if(f.proj){ const P=f.proj, n=P.n||1, d0=inRange?dirToS(p,tgt):a.aim;
    let seek=null; if(P.seek){ seek=MONS.filter(m=>alive(m)&&dist(m)<=a.range+2).sort((x,y)=>dist(x)-dist(y)); if(inRange&&seek.includes(tgt)) seek=[tgt,...seek.filter(m=>m!==tgt)]; }
    for(let i=0;i<n;i++){
      const off=(i-(n-1)/2)*(P.spread||0); let base=d0, tg=null;
      if(seek){ tg=seek.length?seek[i%seek.length]:null; base=tg?dirToS(p,tg):a.aim; }
      else if(n===1) tg=inRange?tgt:null;
      else if(P.turn){ const dir=rotY(d0,off); let bs=0.26; for(const m of MONS){ if(!alive(m)||dist(m)>a.range+2) continue; const v=dirToS(p,m), ang=Math.acos(clamp(v[0]*dir[0]+v[1]*dir[1]+v[2]*dir[2],-1,1)); if(ang<bs){ bs=ang; tg=m; } } }
      fireProjS(p,P.kind,rotY(base,off),tg,a.mult,a.el,P);
    } }
  if(f.zone){ const Z=f.zone, c=Z.self?{x:p.x,z:p.z}:aimPoint(p,tgt,a.range,10); addAreaS(p,'zone',c.x,c.z,Z.r,Z.dur,a.mult,!!Z.follow,a.el,Z); }
}
// where a generic projectile (a fx proj) lands: a hit, splash around it, a lingering zone
function impactFxS(owner,pr,hit){
  const P=pr.fx, el=pr.el;
  if(hit){ damageMonsterS(hit,pr.mult,owner,owner.x,owner.z,2,el); statusS(hit,P,owner,el,pr.mult); }
  if(P.splash) for(const m of MONS){ if(m===hit||m.dead||m.remove) continue; const c=monCenterS(m);
    if(Math.hypot(c.x-pr.x,c.y-pr.y,c.z-pr.z)<P.splash.r+m.T.rad*0.5){ damageMonsterS(m,pr.mult*P.splash.k,owner,pr.x,pr.z,3,el); statusS(m,P,owner,el,pr.mult); } }
  if(P.zone){ const Z=P.zone; addAreaS(owner,'zone',pr.x,pr.z,Z.r,Z.dur,pr.mult*Z.k,false,el,Z); }
}
// lingering ground effects: Arrow Rain hits 5 times, Meteor once when it lands
const AREAS=[]; let nextAreaId=1;
const AREA_TIMING={rain:[0.3,0.5],hail:[0.3,0.5],blizzard:[0.3,0.5],storm:[0.2,0.4]};   // first hit, then every ... s (meteor: once, at the end)
// fx: a generic zone's entry (see resolveFxS): how often it hits, what it does to whatever is inside
function addAreaS(p,kind,x,z,r,dur,mult,follow,el,fx){
  const tm=fx?(fx.once?[dur,dur]:[fx.first||0.3,fx.every||0.5]):(AREA_TIMING[kind]||[dur,dur]);
  const A={id:nextAreaId++,kind,owner:p.id,x,z,r,dur,mult,t:0,next:tm[0],every:tm[1],follow:!!follow,el,fx};
  AREAS.push(A); ev('area',A.id,kind,r1(x),r1(z),r,dur,p.id,el,(fx&&fx.once?1:0)|(follow?2:0));
}
function updateAreasS(dt){
  for(let i=AREAS.length-1;i>=0;i--){
    const A=AREAS[i]; A.t+=dt; const o=S.players.get(A.owner);
    if(A.follow&&o){ if(o.dead){ A.t=A.dur; } else { A.x=o.x; A.z=o.z; } }
    if(A.t>=A.next&&A.t<=A.dur+0.01){ A.next+=A.every;
      if(o) for(const m of MONS){ if(!m.dead&&!m.remove&&Math.hypot(m.x-A.x,m.z-A.z)<A.r+m.T.rad*0.5){
        if(A.fx){ damageMonsterS(m,A.mult,o,A.x,A.z,A.fx.kb!==undefined?A.fx.kb:0.5,A.el); statusS(m,A.fx,o,A.el,A.mult); }
        else { damageMonsterS(m,A.mult,o,A.x,A.z,A.kind==='meteor'?7:A.kind==='storm'?1.5:0.5,A.el); if(A.kind==='blizzard'&&!m.dead) m.slowT=1.5; } } } }
    if(A.t>=A.dur){ ev('aend',A.id); AREAS.splice(i,1); }
  }
}
function fireProjS(p,kind,dir,tg,mult,el,spec){   // spec: a generic projectile's fx entry (speed, life, turn, and what happens where it lands)
  const h=handPosS(p), sp=kind==='arrow'?42:20;
  // speed, seconds of flight, how hard it homes
  const P_=spec?[spec.speed,spec.life,spec.turn||0]:(({pierce:[50,0.72,0],shard:[38,1.1,8],missile:[24,1.9,9],snipe:[75,0.9,14],arrow:[42,1.4,10]})[kind]||[20,1.8,6]), pierce=kind==='pierce', spd=P_[0];
  const pr={id:nextProjId++,kind,owner:p.id,x:h.x,y:h.y,z:h.z,vx:dir[0]*spd,vy:dir[1]*spd,vz:dir[2]*spd,tg:tg?tg.id:null,mult,el,fx:spec||null,life:P_[1],turn:P_[2],hit:pierce?new Set():null};
  PROJS.push(pr);
  ev('proj',pr.id,kind,r1(pr.x),r1(pr.y),r1(pr.z),r1(pr.vx),r1(pr.vy),r1(pr.vz),pr.tg);
}
function updateProjS(dt){
  for(let i=PROJS.length-1;i>=0;i--){
    const pr=PROJS[i]; pr.life-=dt;
    const T=pr.tg?MON_BY_ID.get(pr.tg):null, sp=Math.hypot(pr.vx,pr.vy,pr.vz);
    if(T&&!T.dead&&!T.remove){ const c=monCenterS(T), w=norm3([c.x-pr.x,c.y-pr.y,c.z-pr.z]), k=Math.min(1,pr.turn*dt); pr.vx+=(w[0]*sp-pr.vx)*k; pr.vy+=(w[1]*sp-pr.vy)*k; pr.vz+=(w[2]*sp-pr.vz)*k; }
    else if(pr.kind==='arrow') pr.vy-=4*dt;
    const ox=pr.x, oy=pr.y, oz=pr.z;
    pr.x+=pr.vx*dt; pr.y+=pr.vy*dt; pr.z+=pr.vz*dt;
    // distance from a monster's centre to the stretch flown this tick (fast arrows move ~2 m per tick)
    const near=c=>{ const vx=pr.x-ox, vy=pr.y-oy, vz=pr.z-oz, l2=vx*vx+vy*vy+vz*vz||1, t=clamp(((c.x-ox)*vx+(c.y-oy)*vy+(c.z-oz)*vz)/l2); return Math.hypot(c.x-(ox+vx*t),c.y-(oy+vy*t),c.z-(oz+vz*t)); };
    if(pr.kind==='pierce'){
      const owner=S.players.get(pr.owner);
      pr.y=getH(pr.x,pr.z)+1.1;   // hugs the terrain, so the hit test is flat (x, z)
      const flat=c=>{ const vx=pr.x-ox, vz=pr.z-oz, l2=vx*vx+vz*vz||1, t=clamp(((c.x-ox)*vx+(c.z-oz)*vz)/l2); return Math.hypot(c.x-(ox+vx*t),c.z-(oz+vz*t)); };
      for(const m of MONS){ if(m.dead||m.remove||pr.hit.has(m)) continue; const c=monCenterS(m), r=m.T.rad+0.6; if(flat(c)<r){ pr.hit.add(m); if(owner) damageMonsterS(m,pr.mult,owner,pr.x-pr.vx,pr.z-pr.vz,3,pr.el); } }
      if(pr.life<=0){ ev('pend',pr.id,r1(pr.x),r1(pr.y),r1(pr.z),null); PROJS.splice(i,1); }
      continue;
    }
    let hit=null;
    for(const m of MONS){ if(m.dead||m.remove) continue; const c=monCenterS(m), r=m.T.rad+0.3+(m.model==='treant'?0.5:0)+(m.T.height*m.s>2?m.T.height*0.25:0); if(near(c)<r){ hit=m; break; } }
    const ground=pr.y<getH(pr.x,pr.z)-0.3;
    if(!hit&&!ground&&pr.life>0) continue;
    const owner=S.players.get(pr.owner);
    ev('pend',pr.id,r1(pr.x),r1(pr.y),r1(pr.z),hit?hit.id:null);
    if(owner){
      if(pr.fx) impactFxS(owner,pr,hit);
      else if(pr.kind!=='bolt'){ if(hit){ damageMonsterS(hit,pr.mult,owner,owner.x,owner.z,pr.kind==='snipe'?6:2,pr.el); if(pr.kind==='shard'&&!hit.dead) hit.slowT=2; } }
      else {
        if(hit) damageMonsterS(hit,pr.mult,owner,owner.x,owner.z,3,pr.el);
        for(const m of MONS){ if(m!==hit&&!m.dead&&!m.remove){ const c=monCenterS(m); if(Math.hypot(c.x-pr.x,c.y-pr.y,c.z-pr.z)<2.2+m.T.rad*0.5) damageMonsterS(m,0.5,owner,pr.x,pr.z,3,pr.el); } }
      }
    }
    PROJS.splice(i,1);
  }
}
