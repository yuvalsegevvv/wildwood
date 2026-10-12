//@ Marigold's skill look (The Encore): paper lanterns drift up, ribbons and gold sparkles fly, a scalloped gold ring is laid on the ground, eight lanterns circle her stage
/* Agent map. Outfit: game/outfits/marigold.js, docs/skillkits/looks/marigold.md (marigold 0xe59a2b, cream 0xfff2d6, plum 0x5a2a4a, warm glow 0xffd36b). Engine: game/skillsets/looks.js.
   Center Stage is a stage: the scalloped ring with eight paper lanterns turning round its edge and ribbons rising; Curtain Call throws a fountain of lanterns and ribbons from a big ring. The curtain-call look swap (M5) is not built. */
ssDefineLook('marigold',{
  cols:[0xe59a2b,0x5a2a4a,0xffd36b,0xfff2d6,0xf2dca0], hot:0xffd36b, hot2:0xf2dca0, decal:'scallop', arcCol:0xffd36b,
  mote:[{sh:'lantern',c:2,s:0.2,w:2.5,add:1,g:0.8,sway:1.2,spin:1},{sh:'spark',c:2,s:0.22,w:4,add:1},{sh:'ribbon',c:1,s:0.7,w:2,g:-0.4,sway:2},{sh:'ribbon',c:0,s:0.6,w:2,g:-0.4,sway:2},{sh:'chaff',c:3,s:0.2,w:2,g:-1.5,sway:2}],
  proj:{sh:'lantern',c:2,s:0.5,len:1,glow:0,trail:{sh:'spark',c:2,s:0.14,add:1}},
  zone:{mode:'orbit',rate:22},
  ring:c=>{ const {L,x,z,f}=c, R=f.ring;   // the finale: a big scalloped ring, a fountain of lanterns and ribbons
    sslDecal(L,x,z,R.r,{life:0.8,spin:0.7}); spawnRingAt(x,c.gy,z,R.r*0.9,L.hot); spawnRingAt(x,c.gy,z,R.r*0.6,0xfff2d6); sslRingMotes(L,x,z,R.r,R.r*2.6);
    for(let i=0;i<sslN(16);i++){ const a=sslR(0,TAU), k=sslR(1,3.4); ssEmit(L,x,c.gy+0.4,z,{sh:i%3?'lantern':'ribbon',c:i%3?2:(i%2?0:1),v:[Math.sin(a)*k,sslR(4,7),Math.cos(a)*k],g:-4,life:sslR(1,1.6),sway:1.6,k:1.2}); } },
  ally:(L,o,kind,dur,src)=>{ if(src!=='marigold_3_any'||kind!=='guard') return;   // the curtain call: she changes, for as long as it lasts (Applause makes it longer): a halo of lanterns and a pair of ribbon wings
    const pid=o===P?NET.pid:o.id, y=(o.y||getH(o.x,o.z)); sslBurst(L,o.x,y+1,o.z,22,4.5); spawnRingAt(o.x,y+0.1,o.z,3,L.hot); spawnRingAt(o.x,y+0.1,o.z,1.8,0xfff2d6);
    sslWear(pid,'curtain',dur,()=>{ const g=new THREE.Group(), halo=new THREE.Group(); g.userData.halo=halo; g.userData.wings=[];
      for(let i=0;i<6;i++){ const m=new THREE.Mesh(ssGeo('lantern'),sslOwn(0xffd36b,0.95,true)); m.userData.own=1; m.scale.setScalar(0.2); const a=i/6*TAU; m.position.set(Math.sin(a)*0.55,0,Math.cos(a)*0.55); halo.add(m); }
      halo.position.y=2.35; g.add(halo);
      for(const sd of [-1,1]) for(let i=0;i<4;i++){ const m=new THREE.Mesh(ssGeo('ribbon'),sslOwn([0xe59a2b,0xffd36b,0x5a2a4a,0xfff2d6][i],0.85,i%2===1)); m.userData.own=1; m.scale.set(1.6,1.5+i*0.25,1); m.position.set(sd*0.18,1.45,0.2); m.userData.sd=sd; m.userData.i=i; g.add(m); g.userData.wings.push(m); }
      return g; },
      (g,s)=>{ g.userData.halo.rotation.y=s*1.6; g.userData.halo.position.y=2.35+Math.sin(s*3)*0.04;
        for(const m of g.userData.wings){ const sd=m.userData.sd, i=m.userData.i; m.rotation.set(0.3,0,sd*(0.7+i*0.22+Math.sin(s*4+i)*0.12)); } }); },
  zoneStart:(L,A)=>{ A.lan=[]; for(let i=0;i<8;i++){ const m=new THREE.Mesh(ssGeo('lantern'),sslOwn(0xffd36b,0.95,true)); m.scale.setScalar(0.42); scene.add(m); A.objs.push(m); A.lan.push(m); } },   // eight paper lanterns turn round the stage
  zoneTick:(L,A,dt)=>{ if(A.lan) A.lan.forEach((m,i)=>{ const a=t*0.8+i/8*TAU, r=A.r*0.94; m.position.set(A.x+Math.sin(a)*r,getH(A.x,A.z)+1.7+Math.sin(t*2+i)*0.2,A.z+Math.cos(a)*r); m.rotation.y=a; }); }
});
