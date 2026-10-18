//@ Boss move sets of the Gloamhorn: Captain Dredge, the drowned captain (cannon volleys, the anchor rake, deckhands, a tide wall, the whirl, a broadside) and the Gloam Warden (lantern beams, gloom pools, the wail ring, the dark hour with its turning beam and soul lanterns)
/* See boss.js for the kit contract and boss-fx.js for the moves. Numbers: a boss's hit is m.T.dmg. Phase 2 starts at 66% and phase 3 at 33% (boss.js). */

// ---- Captain Dredge (level 35, in the sea caves at the foot of the cliffs) ----
// a cannon volley: shot lands where players stand and a little beside them
function dredgeVolleyS(B,m,C){
  const n=B.enraged?6:B.phase>=2?5:4;
  castS(B,m,1.8,1.0);
  for(let i=0;i<n;i++){ const q=i<2?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i<2?AR(0,1.2):AR(2,7);
    const [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r+1);
    addTeleS(B,x,z,3.2,1.4+i*0.15,'rockfall',Math.round(m.T.dmg*1.5)); }
}
// the anchor rake: a wide arc swung at the nearest player; whoever it hits is dragged slow by the chain
function dredgeAnchorS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.6,1.0);
  const e=addTeleS(B,m.x,m.z,14,1.2,'rake',Math.round(m.T.dmg*1.8),Math.atan2(-(p.x-m.x),-(p.z-m.z)),0.85);
  e.hit=q=>{ pfxS(q,'slow',2.0); };
}
// the tide wall: the sea rolls through the cave mouth with a gap in it
function dredgeTideS(B,m){
  const A=B.A, a=AR(0,TAU), ux=-Math.sin(a), uz=-Math.cos(a), hw=A.r;
  castS(B,m,2.0,2.3);
  addWallS(B,A.x-ux*(A.r+4),A.z-uz*(A.r+4),a,9,hw,AR(-hw*0.5,hw*0.5),3.6,Math.round(m.T.dmg*1.6),1.6);
  toastTo(null,'The tide comes in through the caves! Find the gap.','bad');
  if(B.k.bilge>=60){ addWallS(B,A.x+ux*(A.r+4),A.z+uz*(A.r+4),a+Math.PI,9,hw,AR(-hw*0.5,hw*0.5),3.6,Math.round(m.T.dmg*1.6),3.4); toastTo(null,'High water: a second wave comes back!','bad'); }   // (the flooded hold doubles the tide)
}
// phase 3: a whirlpool at the middle, pulling in
function dredgeWhirlS(B,m){
  const A=B.A, [x,z]=arenaPtS(A,A.r*0.4);
  castS(B,m,2.2,2.3); addZoneS(B,'whirl',x,z,8,9,0,0);
  toastTo(null,'Captain Dredge opens the drowned deep! Keep out of the whirl.','bad');
}
// the broadside (phase 2+): the four cannon ports in the hold's rim fire one after the other round the hold (0.6 s apart), each at wherever a player is when it fires
function dredgeBroadsideS(B,m){
  const A=B.A, a0=AR(0,TAU); castS(B,m,3.0,2.3);
  for(let i=0;i<4;i++) laterS(B,i*0.6,()=>{ const ins=playersInArena(A,4); if(!ins.length||m.dead) return;
    const a=a0+i*TAU/4, px=A.x+Math.sin(a)*(A.r-2), pz=A.z+Math.cos(a)*(A.r-2), q=randPlayerS(ins);
    addTeleS(B,px,pz,2*A.r,1.5,'line',Math.round(m.T.dmg*1.7),Math.atan2(-(q.x-px),-(q.z-pz)),1.6); });
  toastTo(null,'A broadside! The ports fire one after the other.','bad');
}
// the anchor chain: he hooks one player and hauls them in for DREDGE_CHAIN s (a pull every 0.5 s, the chain drawn as a line); when it ends the anchor slams down on him, so whoever is
// still on the chain is crushed. A crewmate standing within 3 m of the hooked player cuts it: nobody is slammed, and he is winded for a moment
const DREDGE_CHAIN=7;
function dredgeHookS(B,m,C){
  const k=B.k, q=randPlayerS(C.inside); faceS(m,q.x,q.z); castS(B,m,1.2,1.0);
  k.chain={id:q.id,t:0,pull:0.4}; toastTo(null,'Dredge hooks '+q.name+' with the anchor! Cut the chain: stand next to them.','bad'); ev('roar',m.id);
}
function dredgeChainTickS(B,m,dt){
  const k=B.k, c=k.chain, q=S.players.get(c.id);
  if(!q||q.dead){ k.chain=null; return; }
  c.t+=dt; c.pull-=dt;
  const ally=playersInArena(B.A,0).find(o=>o!==q&&Math.hypot(o.x-q.x,o.z-q.z)<3);
  if(ally){ k.chain=null; B.stunT=2.5; m.act=null; k.cut=(k.cut||0)+1; toastTo(null,'The chain is cut! Dredge is winded: strike now!','good'); return; }
  if(c.pull<=0){ c.pull=0.5; const dx=m.x-q.x, dz=m.z-q.z, d=Math.hypot(dx,dz)||1;
    if(d>3.5) pfxS(q,'push',0,dx/d*20,dz/d*20);
    addTeleS(B,m.x,m.z,d,0.5,'line',0,Math.atan2(-(q.x-m.x),-(q.z-m.z)),0.35); }
  if(c.t>=DREDGE_CHAIN){ k.chain=null; castS(B,m,1.2,2.3); addTeleS(B,m.x,m.z,7.5,0.9,'slam',Math.round(m.T.dmg*2.2)); toastTo(null,'The anchor slams down!','bad'); }
}
// the bilge: the hold floods all fight long (the bar's number is the water, in %). Every drowned hand put down bails a fifth of it out; at 100 the hold floods: a whirl at the middle for 8 s,
// everyone slowed, and the water starts again from nothing. Keep killing his crew
const DREDGE_BILGE_RATE=2.4, DREDGE_BAIL=20;
function dredgeBilgeTickS(B,m,dt){
  const k=B.k; for(const a of B.adds) if(a.dead&&!a.bailed){ a.bailed=true; k.bilge=Math.max(0,k.bilge-DREDGE_BAIL); }
  const was=k.bilge; k.bilge=Math.min(100,k.bilge+DREDGE_BILGE_RATE*dt*(B.enraged?1.3:1)); B.aux=Math.round(k.bilge);
  if(was<50&&k.bilge>=50) toastTo(null,'The hold is half flooded: put down his crew to bail it out.','bad');
  if(k.bilge>=100){ k.bilge=0; B.aux=0; k.floods++; addZoneS(B,'whirl',B.A.x,B.A.z,12,8,0,0); for(const q of playersInArena(B.A,0)) pfxS(q,'slow',3); castS(B,m,1.5,2.3); ev('roar',m.id); toastTo(null,'The hold floods!','bad'); }
}
BOSS_KITS.captain={
  start(B){ B.k={volleyT:4,anchorT:6,tideT:99,whirlT:99,sideT:99,handT:6,hookT:9,chain:null,cut:0,bilge:0,floods:0}; B.aux=0; },
  phase(B,m,n){
    if(n===2){ B.k.tideT=8; B.k.sideT=13; spawnAddsS(B,2); }
    else { B.k.whirlT=5; spawnAddsS(B,3); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k; k.volleyT-=dt; k.anchorT-=dt; k.tideT-=dt; k.whirlT-=dt; k.sideT-=dt; k.handT-=dt; k.hookT-=dt;
    dredgeBilgeTickS(B,m,dt);
    if(k.chain) dredgeChainTickS(B,m,dt);
    if(k.hookT<=0&&!k.chain&&B.busy<=0){ k.hookT=B.enraged?14:18; dredgeHookS(B,m,C); }
    if(k.handT<=0){ k.handT=B.enraged?12:15; spawnAddsS(B,B.enraged?3:2); }
    if(B.busy>0) return;
    if(k.whirlT<=0){ k.whirlT=B.enraged?14:19; dredgeWhirlS(B,m); }
    else if(k.sideT<=0){ k.sideT=B.enraged?10:15; dredgeBroadsideS(B,m); }
    else if(k.tideT<=0){ k.tideT=B.enraged?10:14; dredgeTideS(B,m); }
    else if(k.anchorT<=0&&C.dp<15){ k.anchorT=B.enraged?4:6; dredgeAnchorS(B,m,C.p); }
    else if(k.volleyT<=0){ k.volleyT=B.enraged?5:7; dredgeVolleyS(B,m,C); }
  }
};

// ---- The Gloam Warden (level 40, the lighthouse at the tip) ----
// the lantern beam: a fan of three lines of cold light swept at the nearest player
function wardenBeamS(B,m,p){
  faceS(m,p.x,p.z); castS(B,m,1.6,1.0);
  const a0=Math.atan2(-(p.x-m.x),-(p.z-m.z));
  for(const d of [-0.3,0,0.3]) addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(m.T.dmg*1.5),a0+d,1.4);
}
// gloom pools: black water wells up where players stand and stays, hurting whoever lingers
function wardenGloomS(B,m,C){
  const n=B.enraged?4:B.phase>=2?3:2;
  castS(B,m,1.6,1.0);
  for(let i=0;i<n;i++){ const q=i===0?C.p:randPlayerS(C.inside), a=AR(0,TAU), r=i===0?0:AR(2,8);
    const [x,z]=inArenaS(B.A,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,B.A.r-2);
    laterS(B,i*0.4,()=>{ if(!m.dead) addZoneS(B,'gloom',x,z,4.5,9,0,0); }); }
}
// the wail: everyone near is hurt except the safe middle ring
function wardenWailS(B,m){
  castS(B,m,2.5,2.3); addTeleS(B,m.x,m.z,20,2.3,'donut',Math.round(m.T.dmg*1.9),0,6); ev('roar',m.id);
}
// a tentacle slam under a player
function wardenSlamS(B,m,C){
  const q=C.p; castS(B,m,1.4,1.0);
  addTeleS(B,q.x,q.z,5.5,1.2,'slam',Math.round(m.T.dmg*1.8));
}
// the dark hour: the lighthouse goes dark for WARDEN_DARK s and its one beam turns slowly round the hall. Anyone outside the beam, and not within WARDEN_LAMP m of a soul lantern, is hurt
// every 0.8 s; 1.5 s before the hour ends the beam flashes where it stands and hurts whoever is still in it. Whoever stands in the beam also hits him 25% harder. The beam stops for a moment and turns back twice (the toast says when); gloom wells up behind it where it has been.
// Enraged, it turns faster, its cones are narrower and a second beam turns opposite the first
const WARDEN_DARK=11, WARDEN_LAMP=5.5, WARDEN_LAMP_END=3.5;   // (a lantern's light shrinks from WARDEN_LAMP to WARDEN_LAMP_END m over the hour: it is failing)
const wardenLampR=k=>WARDEN_LAMP+(WARDEN_LAMP_END-WARDEN_LAMP)*Math.min(1,k.dT/WARDEN_DARK);
const wardenHalf=B=>B.enraged?0.42:0.55, wardenInBeamS=(B,m,q)=>{ if(Math.hypot(q.x-m.x,q.z-m.z)>=30) return false; const a=Math.atan2(-(q.x-m.x),-(q.z-m.z)); return Math.abs(angDiff(a,B.k.beamA))<wardenHalf(B)||(B.enraged&&Math.abs(angDiff(a,B.k.beamA+Math.PI))<wardenHalf(B)); };   // (enraged, a second beam turns opposite the first)
function wardenDarkS(B,m,p){
  const k=B.k, A=B.A; k.dark=WARDEN_DARK; k.beamA=Math.atan2(-(p.x-m.x),-(p.z-m.z)); k.beamDir=Math.random()<0.5?1:-1; k.dTick=1.0; k.dTrail=1.0; k.dFlip=[3.6,7.4]; k.dPause=0; k.dT=0; k.flash=false;
  B.mode=6; castS(B,m,WARDEN_DARK+0.4,2.3); ev('roar',m.id);
  k.lamps=[]; const a0=AR(0,TAU);
  for(let i=0;i<2;i++){ const a=a0+i*Math.PI, x=A.x+Math.sin(a)*12, z=A.z+Math.cos(a)*12, lm=spawnMonS(B.bd.totem,x,z,{x,z},true); B.adds.push(lm); k.lamps.push(lm); }
  toastTo(null,'The lighthouse goes dark! Stay in the beam, or beside a soul lantern.','bad');
}
function wardenDarkEndS(B,m){
  const k=B.k; k.dark=0; B.mode=0;
  for(const lm of k.lamps) if(!lm.dead&&!lm.remove) removeMonS(lm);
  k.lamps=[]; toastTo(null,'The light returns.','good');
}
function wardenDarkTickS(B,m,dt){
  const k=B.k, D=m.T.dmg; k.dark-=dt; k.dT+=dt;
  if(k.dPause>0) k.dPause-=dt; else k.beamA+=k.beamDir*(B.enraged?0.8:0.55)*dt;
  if(k.dFlip.length&&k.dT>=k.dFlip[0]){ k.dFlip.shift(); k.dPause=0.7; k.beamDir=-k.beamDir; toastTo(null,'The beam stops... and turns back!','bad'); }
  k.dTick-=dt; if(k.dTick<=0){ k.dTick=0.8;
    for(const q of playersInArena(B.A,0)){ if(wardenInBeamS(B,m,q)||k.lamps.some(lm=>!lm.dead&&!lm.remove&&Math.hypot(lm.x-q.x,lm.z-q.z)<wardenLampR(k))) continue; hurtP(q,Math.round(D*0.3),m); k.burnt=(k.burnt||0)+1; }
    addTeleS(B,m.x,m.z,30,0.85,'light',0,k.beamA,wardenHalf(B)); if(B.enraged) addTeleS(B,m.x,m.z,30,0.85,'light',0,k.beamA+Math.PI,wardenHalf(B)); }   // (the beam itself, drawn as a cone of light that hurts nobody; redrawn as it turns)
  k.dTrail-=dt; if(k.dTrail<=0){ k.dTrail=1.6; const a=k.beamA-k.beamDir*AR(0.7,1.3), r=AR(6,18), x=m.x-Math.sin(a)*r, z=m.z-Math.cos(a)*r; const [gx,gz]=inArenaS(B.A,x,z,B.A.r-2); addZoneS(B,'gloom',gx,gz,3.5,6,0,0); }
  if(!k.flash&&k.dark<=1.5){ k.flash=true; for(const off of B.enraged?[0,Math.PI]:[0]) addTeleS(B,m.x,m.z,30,1.5,'rake',Math.round(D*1.8),k.beamA+off,wardenHalf(B)); toastTo(null,'The lighthouse is about to flash: leave the beam!','bad'); }   // the beam ends in a flash that hurts whoever still stands in it
  if(k.dark<=0) wardenDarkEndS(B,m);
}
BOSS_KITS.gloamwarden={
  start(B){ B.k={beamT:4,gloomT:7,wailT:11,slamT:99,wheelT:99,darkT:12,dark:0,lamps:[],burnt:0}; },
  hit(B,m,p,v){ const k=B.k; if(k.dark>0&&wardenInBeamS(B,m,p)) m.hp-=v*0.25/monK(m,p).hp; },   // (the light that keeps you alive is the light he is weakest in)
  phase(B,m,n){ if(n===2) spawnAddsS(B,2); else { B.k.wheelT=4; B.k.slamT=6; spawnAddsS(B,3); } ev('roar',m.id); },
  tick(B,m,dt,C){
    const k=B.k;
    if(k.dark>0){ wardenDarkTickS(B,m,dt); return; }
    k.gloomT-=dt; k.beamT-=dt; k.wailT-=dt; k.slamT-=dt; k.darkT-=dt; if(B.phase>=3) k.wheelT-=dt;
    if(B.busy>0) return;
    if(k.darkT<=0){ k.darkT=B.enraged?18:22; wardenDarkS(B,m,C.p); }
    else if(k.wheelT<=0){ k.wheelT=14; const a0=AR(0,TAU); castS(B,m,2.4,2.3); for(let f=0;f<2;f++) laterS(B,f*1.2,()=>{ for(let i=0;i<6;i++) addTeleS(B,m.x,m.z,26,1.3,'line',Math.round(m.T.dmg*1.6),a0+f*TAU/12+i*TAU/6,1.5); }); toastTo(null,'The lighthouse turns! Stand between the beams.','bad'); }
    else if(k.gloomT<=0){ k.gloomT=B.enraged?6:9; wardenGloomS(B,m,C); }
    else if(k.wailT<=0&&C.dp<16){ k.wailT=B.enraged?8:11; wardenWailS(B,m); }
    else if(k.slamT<=0){ k.slamT=B.enraged?5:8; wardenSlamS(B,m,C); }
    else if(k.beamT<=0){ k.beamT=B.enraged?5:7; wardenBeamS(B,m,C.p); }
  }
};
