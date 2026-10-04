//@ What the bosses can do, shared by every move set: telegraphed hits (circle, cone, line, donut, marks), ground zones, tidal walls, orbs, effects on players, timed casts, summons
/* A boss's move set (BOSS_KITS.<name>, in boss-kits-*.js) decides WHEN it does what; this file is HOW. B = one boss fight's state (server/boss.js).
   Telegraphs ('tele' / 'tend' events; the client draws each kind, game/combat/boss.js). addTeleS(B,x,z,r,dur,kind,dmg,face,half) warns for dur s, then
   hurts every player inside (dmg is the damage before armor):
     circle  root slam icefall geyser gust swoop rockfall quake    within r of (x,z)
     cone    cleave breath rake               within r and half radians of the direction face (a direction is (-sin face, -cos face))
     line    line                             a strip r long and 2 x half wide from (x,z) along face
     donut   donut                            between half (the safe middle) and r of (x,z)
     mark    mark prison                      a ring that follows player number half until it goes off (mark: everyone within r of that player, the player
                                              only half as hard; prison: only that player)
   addTeleS returns the telegraph: give it e.hit(p) (an extra effect on each player it hits) or e.done(e) (after it went off).
   Zones ('zone' / 'zend'): ember (a fire pool), whirl (a whirlpool: the client pulls you in), whiteout (a safe circle that closes from r to b), blizzard (the
   arena, after a windup a: hurts anyone not next to a live warm core). Walls ('wall'): a tidal wave rolling across the arena with a gap in it. Orbs ('proj',
   'pend': the client draws them like a player's projectiles). Effects on a player ('pfx', the client applies them to itself): root, slow, push. Everything
   the boss set up is undone by clearBossFxS. B.q holds timed steps: laterS(B,seconds,fn). */
const BOSS_KITS={};
let nextTeleId=1, nextZoneId=1;
const laterS=(B,delay,fn)=>{ B.q.push({t:delay,fn}); };
// a cast: the boss stands still for `busy` seconds; anim = the swing it shows ('mact' duration: over 2 is the big slam), 0 = none
function castS(B,m,busy,anim){ B.busy=Math.max(B.busy,busy); m.vx=m.vz=0; if(anim) ev('mact',m.id,anim); }
function faceS(m,x,z){ m.face=m.faceGoal=Math.atan2(-(x-m.x),-(z-m.z)); }
// glide the boss to (x,z) over dur seconds (a leap, a dive, going under the sand); it does nothing else meanwhile
function moveBossS(B,x,z,dur){ const m=B.m; B.mv={x0:m.x,z0:m.z,x1:x,z1:z,t:0,dur}; m.faceGoal=Math.atan2(-(x-m.x),-(z-m.z)); }
function farPlayerS(m,ps){ let best=null,bd=-1; for(const q of ps){ const d=Math.hypot(q.x-m.x,q.z-m.z); if(d>bd){ bd=d; best=q; } } return best; }
const randPlayerS=ps=>ps[Math.floor(Math.random()*ps.length)];
function inArenaS(A,x,z,rmax){ const d=Math.hypot(x-A.x,z-A.z); return d>rmax?[A.x+(x-A.x)/d*rmax,A.z+(z-A.z)/d*rmax]:[x,z]; }
function arenaPtS(A,rmax){ const a=AR(0,TAU), r=Math.sqrt(Math.random())*rmax; return [A.x+Math.sin(a)*r,A.z+Math.cos(a)*r]; }
function addTeleS(B,x,z,r,dur,kind,dmg,face,half){
  const e={id:nextTeleId++,x,z,r,t:0,dur,kind,dmg,face:face||0,half:half||0}; B.tele.push(e);
  ev('tele',e.id,kind,r1(x),r1(z),r1(r),dur,Math.round(e.face*100)/100,e.half);
  return e;
}
function clearTeleS(B){ for(const e of B.tele) ev('tend',e.id,0); B.tele=[]; }
function resolveTeleS(e,m){
  const k=e.kind;
  if(k==='mark'||k==='prison'){ const q=S.players.get(e.half); if(q&&!q.dead){ e.x=q.x; e.z=q.z; } }   // it went off where the player is now
  for(const p of S.players.values()){
    if(p.dead) continue;
    const dx=p.x-e.x, dz=p.z-e.z, pd=Math.hypot(dx,dz);
    let inside;
    if(k==='cleave'||k==='breath'||k==='rake') inside=pd<e.r+0.3&&(pd<1.2||Math.abs(angDiff(Math.atan2(-dx,-dz),e.face))<e.half);
    else if(k==='line'){ const ux=-Math.sin(e.face), uz=-Math.cos(e.face), al=dx*ux+dz*uz; inside=al>=0&&al<=e.r&&Math.abs(dx*uz-dz*ux)<e.half+0.3; }
    else if(k==='donut') inside=pd>=e.half-0.3&&pd<e.r+0.3;
    else if(k==='prison') inside=p.id===e.half;
    else inside=pd<e.r+0.3;
    if(!inside) continue;
    const dmg=e.dmg*(k==='mark'&&p.id===e.half?0.5:1);
    if(dmg>0) hurtP(p,Math.round(dmg*AR(0.9,1.1)),m);
    if(e.hit) e.hit(p);
  }
  ev('tend',e.id,1,r1(e.x),r1(e.z));
  if(e.done) e.done(e);
}
function playersInArena(A,pad){ const out=[]; for(const p of S.players.values()) if(!p.dead && Math.hypot(p.x-A.x,p.z-A.z)<A.r+pad) out.push(p); return out; }
// effects on a player, applied by that player's client: root and slow last dur seconds; push shoves (vx, vz metres per second, fading over about half a second)
function pfxS(p,kind,dur,vx,vz){ ev('pfx',p.id,kind,dur,r1(vx||0),r1(vz||0)); }

/* ---- ground zones ---- */
function addZoneS(B,kind,x,z,r,dur,a,b){
  const zn={id:nextZoneId++,kind,x,z,r,dur,a:a||0,b:b||0,t:0,tick:0}; B.zones.push(zn);
  ev('zone',zn.id,kind,r1(x),r1(z),r1(r),dur,zn.a,zn.b);
  return zn;
}
const whiteR=zn=>lerp(zn.r,zn.b,clamp(zn.t/(zn.dur*0.8)));   // a whiteout's safe radius now: it closes over the first 80% of its life
const shelteredS=(B,p)=>B.adds.some(a=>a.def.id==='warmcore'&&!a.dead&&!a.remove&&Math.hypot(a.x-p.x,a.z-p.z)<6.5);
const ZONE_HIT={ember:[0.6,0.2],whirl:[0.5,0.18],whiteout:[0.8,0.3],blizzard:[0.9,0.28]};   // seconds between hits, share of the boss's hit each does
function tickZoneS(B,m,zn,dt){
  zn.tick-=dt; if(zn.tick>0) return;
  const K=ZONE_HIT[zn.kind]; zn.tick=K[0];
  if(zn.kind==='blizzard'&&zn.t<zn.a) return;   // the windup
  for(const p of S.players.values()){
    if(p.dead) continue;
    const d=Math.hypot(p.x-zn.x,p.z-zn.z);
    const hit=zn.kind==='whiteout'?d>whiteR(zn)&&d<zn.r+26:zn.kind==='blizzard'?d<zn.r&&!shelteredS(B,p):d<zn.r+0.3;
    if(hit) hurtP(p,Math.round(m.T.dmg*K[1]*AR(0.9,1.1)),m);
  }
}

/* ---- tidal walls: a strip half x 2 wide rolling from (x,z) along ang at speed m/s after delay s; whoever it passes over outside the gap
   (gapHalf either side of gapC, measured across it) is hurt and shoved along ---- */
function addWallS(B,x,z,ang,speed,half,gapC,gapHalf,dmg,delay){
  const w={id:nextZoneId++,x,z,ang,speed,half,gapC,gapHalf,dmg,delay,t:0,life:delay+60/speed,hit:new Set()}; B.walls.push(w);
  ev('wall',w.id,r1(x),r1(z),Math.round(ang*100)/100,speed,half,r1(gapC),gapHalf,delay,r1(w.life));
  return w;
}
function tickWallS(B,m,w,dt){
  w.t+=dt; const age=w.t-w.delay;
  if(age>=0){
    const s=age*w.speed, ux=-Math.sin(w.ang), uz=-Math.cos(w.ang);
    for(const p of S.players.values()){
      if(p.dead||w.hit.has(p.id)) continue;
      const rx=p.x-w.x, rz=p.z-w.z, al=rx*ux+rz*uz, la=-rx*uz+rz*ux;
      if(Math.abs(al-s)<1.7&&Math.abs(la)<w.half&&Math.abs(la-w.gapC)>=w.gapHalf){ w.hit.add(p.id); hurtP(p,Math.round(w.dmg*AR(0.9,1.1)),m); pfxS(p,'push',0,ux*13,uz*13); }
    }
  }
  if(w.t<w.life) return false;
  ev('wend',w.id); return true;
}

/* ---- orbs: slow bolts flown straight from the boss (kind: a projectile the client knows) ---- */
function fireOrbS(B,kind,x,z,ang,speed,dmg){
  const id=nextProjId++, vx=-Math.sin(ang)*speed, vz=-Math.cos(ang)*speed, y=getH(x,z)+1.4, o={id,kind,x,y,z,vx,vz,dmg,life:2.2};
  B.orbs.push(o); ev('proj',id,kind,r1(x),r1(y),r1(z),r1(vx),0,r1(vz),null);
}
function tickOrbsS(B,m,dt){
  for(let i=B.orbs.length-1;i>=0;i--){
    const o=B.orbs[i]; o.life-=dt; o.x+=o.vx*dt; o.z+=o.vz*dt;
    let hit=false;
    for(const p of S.players.values()){ if(!p.dead&&Math.hypot(p.x-o.x,p.z-o.z)<1.1){ hurtP(p,Math.round(o.dmg*AR(0.9,1.1)),m); hit=true; break; } }
    if(hit||o.life<=0){ ev('pend',o.id,r1(o.x),r1(o.y),r1(o.z),null); B.orbs.splice(i,1); }
  }
}

/* ---- summons: n of the boss's adds around (cx,cz) (default the boss), each hunting the nearest player; props (warm cores) in a ring ---- */
function spawnAddsS(B,n,cx,cz,spread){
  const m=B.m;
  for(let i=0;i<n;i++){
    const a=AR(0,TAU), x=(cx===undefined?m.x:cx)+Math.sin(a)*(spread||5), z=(cz===undefined?m.z:cz)+Math.cos(a)*(spread||5);
    const t2=spawnMonS(B.bd.add,x,z,{x:B.A.x,z:B.A.z},true); t2.aggro=true; const p=nearestFighter(x,z,60); t2.tgt=p?p.id:null; B.adds.push(t2);
  }
}
function spawnPropsS(B,n,radius,a0){
  const A=B.A;
  for(let i=0;i<n;i++){ const a=a0+i/n*TAU, x=A.x+Math.sin(a)*radius, z=A.z+Math.cos(a)*radius; B.adds.push(spawnMonS(B.bd.prop,x,z,{x,z},true)); }
}

/* ---- the driver's per-tick step and the clean-up ---- */
function updateBossFxS(B,m,dt){
  for(const e of B.q) e.t-=dt;
  const ready=B.q.filter(e=>e.t<=0); if(ready.length){ B.q=B.q.filter(e=>e.t>0); for(const e of ready) e.fn(); }
  for(let i=B.zones.length-1;i>=0;i--){ const zn=B.zones[i]; zn.t+=dt; tickZoneS(B,m,zn,dt); if(zn.t>=zn.dur){ B.zones.splice(i,1); ev('zend',zn.id); if(zn.done) zn.done(zn); } }
  for(let i=B.walls.length-1;i>=0;i--) if(tickWallS(B,m,B.walls[i],dt)) B.walls.splice(i,1);
  tickOrbsS(B,m,dt);
}
function clearBossFxS(B){
  B.q=[]; B.mv=null; B.busy=0; B.mode=0; B.aux=0; B.k={};
  for(const zn of B.zones) ev('zend',zn.id); B.zones=[];
  for(const w of B.walls) ev('wend',w.id); B.walls=[];
  for(const o of B.orbs) ev('pend',o.id,r1(o.x),r1(o.y),r1(o.z),null); B.orbs=[];
  clearTeleS(B);
}
