//@ The Seam Foreman's move set (Garrick, the Blackseam): a chain that hauls you in, powder kegs you pop beside him to hurt and stun him, slaglings, a cave-in, Blasting Day
/* Agent map: exports BOSS_KITS.blast (the kit contract of server/boss.js: start, tick, phase), dgBlastKegS (the signature: one keg goes off; registered in DG_BOSS_NEEDS as 'new:keg-blast').
   Uses server/boss-fx.js (addTeleS, castS, laterS, faceS, pfxS, spawnMonS, removeMonS) and server/dungeons/boss-fx.js + boss-kits.js (dgBossFreePtS, dgBossMouthAddsS, dgBossCancelTeleS,
   dgBossHurtInS); the def is DG_BOSS_DEFS.garrick (shared/dungeons/bosses.js). Test: tools/dungeon-boss-smoke.js. Designs and numbers: docs/DUNGEON-THEMES.md section 9.
   THE SIGNATURE, Powder Kegs: Garrick sets out kegs (props that fall to one hit), each under a DG_KEG_FUSE second warning. A keg you POP (kill) goes off at once, 0.3 s later, 1.2 hits on everyone within
   DG_KEG_R: but if Garrick stands within DG_KEG_NEAR of it he takes DG_KEG_HURT of his health, and within DG_KEG_STUN_R he is also stunned DG_KEG_STUN s (a stunned boss takes x1.5). A keg left alone
   goes off when its fuse runs out (1.7 hits on everyone near it, no harm to him). Kegs within DG_KEG_CHAIN of a blast go off 0.4 s later: lure him into a clump, pop it from far away. */
const DG_KEG_FUSE=7, DG_KEG_R=5, DG_KEG_CHAIN=6, DG_KEG_HURT=0.04, DG_KEG_NEAR=7, DG_KEG_STUN_R=3.5, DG_KEG_STUN=3;
// one keg goes off: popped (a player killed it: a short warning, its fuse taken back) or burnt down (its fuse ended: the telegraph itself hurts); then its neighbours follow
function dgBlastKegS(B,m,k,popped){
  if(k.gone) return; k.gone=true;
  const D=m.T.dmg, K=B.k;
  if(popped){
    dgBossCancelTeleS(B,k.e);
    const e=addTeleS(B,k.x,k.z,DG_KEG_R,0.3,'blast',Math.round(D*1.2));
    e.done=()=>{
      if(!B.engaged||m.dead||m.immune) return;
      const d=Math.hypot(m.x-k.x,m.z-k.z);
      if(d<=DG_KEG_NEAR){ m.hp=Math.max(1,m.hp-m.maxHp*DG_KEG_HURT); K.kegHits=(K.kegHits||0)+1; toastTo(null,'Garrick is caught in the blast!','good');
        if(d<=DG_KEG_STUN_R){ B.stunT=Math.max(B.stunT,DG_KEG_STUN); m.act=null; toastTo(null,'Garrick reels from the blast: strike now!','good'); } }
    };
  }
  if(!k.pb.remove) removeMonS(k.pb);
  for(const o of K.kegs) if(!o.gone&&Math.hypot(o.x-k.x,o.z-k.z)<=DG_KEG_CHAIN) laterS(B,0.4,()=>{ if(B.engaged&&!m.dead) dgBlastKegS(B,m,o,true); });
}
// n kegs at least 6 m from him, each with its fuse; the toast says what to do
function dgKegsOutS(B,m,n){
  const K=B.k, D=m.T.dmg;
  for(let i=0;i<n;i++){
    const [x,z]=dgBossFreePtS(B,m.x,m.z,6), pb=spawnMonS(B.bd.prop,x,z,{x,z},true); B.adds.push(pb);
    const k={pb,x,z,gone:false,e:null};
    k.e=addTeleS(B,x,z,DG_KEG_R,DG_KEG_FUSE,'blast',Math.round(D*1.7));
    k.e.done=()=>{ if(k.gone) return; k.gone=true; if(!pb.remove) removeMonS(pb);
      for(const o of K.kegs) if(!o.gone&&Math.hypot(o.x-k.x,o.z-k.z)<=DG_KEG_CHAIN) laterS(B,0.4,()=>{ if(B.engaged&&!m.dead) dgBlastKegS(B,m,o,true); }); };
    K.kegs.push(k);
  }
  toastTo(null,'Garrick rolls out powder kegs: pop them next to him, from far away!','bad');
}
// the chain haul: a strip from him through one player; whoever it catches is dragged to him
function dgChainHaulS(B,m,q){
  const D=m.T.dmg; faceS(m,q.x,q.z); castS(B,m,1.5,1.0);
  const e=addTeleS(B,m.x,m.z,26,1.2,'line',Math.round(D*0.9),m.face,2.2);
  e.hit=p=>{ const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz)||1; pfxS(p,'push',0,dx/d*13,dz/d*13); };
}
BOSS_KITS.blast={
  start(B){ B.k={chainT:6,kegT:4,slagT:99,caveT:99,blastT:99,kegs:[],kegHits:0}; B.aux=0; },
  phase(B,m,n){
    if(n===2){ B.k.slagT=3; B.k.caveT=8; toastTo(null,'Garrick bellows: the slaglings crawl out of the seam!','bad'); }
    else { B.k.blastT=2; B.k.kegT=99; toastTo(null,'Garrick lights the long fuse: it is Blasting Day!','bad'); }
    ev('roar',m.id);
  },
  tick(B,m,dt,C){
    const k=B.k, A=B.A;
    k.kegs=k.kegs.filter(o=>!o.gone&&!o.pb.remove);
    for(const o of k.kegs) if(o.pb.dead) dgBlastKegS(B,m,o,true);   // a player popped it
    B.aux=k.kegs.filter(o=>!o.gone).length;
    k.chainT-=dt; if(k.kegT<90) k.kegT-=dt; if(B.phase>=2){ k.slagT-=dt; k.caveT-=dt; } if(B.phase>=3) k.blastT-=dt;
    if(k.kegT<=0){ k.kegT=16; dgKegsOutS(B,m,4); }
    if(k.blastT<=0){ k.blastT=10; dgKegsOutS(B,m,6); }
    B.aux=k.kegs.filter(o=>!o.gone).length;   // (again: the bar counts the kegs just set out)
    if(k.slagT<=0){ k.slagT=22; dgBossMouthAddsS(B,3,8); }
    if(k.caveT<=0){ k.caveT=13;   // the cave-in: nine rocks over 4.5 s, the first two under players
      const D=m.T.dmg;
      for(let i=0;i<9;i++) laterS(B,i*0.5,()=>{ const ins=playersInArena(A,4); let x,z; if(i<2&&ins.length){ const q=ins[i%ins.length]; x=q.x+AR(-1,1); z=q.z+AR(-1,1); } else [x,z]=arenaPtS(A,A.r-1);
        addTeleS(B,x,z,3,1.2,'rockfall',Math.round(D*0.8)); }); }
    if(B.busy>0||B.mv) return;
    if(k.chainT<=0&&C.inside.length){ k.chainT=B.enraged?7:10; dgChainHaulS(B,m,randPlayerS(C.inside)); }
  }
};
DG_BOSS_NEEDS['new:keg-blast']=dgBlastKegS;   // (DG_BOSS_NEEDS: server/dungeons/boss-kits.js)
