//@ The Sigil statue's growing glow: Glasswell's broken statue gains props for every 50 Sigils you have offered to it (runes, braziers, a halo, a floating head of light, banners, a sun disc, orbiting shards, a beam)
/* Agent map. sgsBuild() (from pzBuild, game/village/buildings-puzzle.js) makes the props once at the statue's world place (GW_PLACE.statue); sgsUpdate(dt) runs every frame from pzUpdate and shows the first
   pzStatueTier(GEAR.sigOff) steps. Everything is client-only and per player: each hiker sees their own statue grow. The statue itself is sun-ruin.js (gwStatue, 8 m tall on a plinth of radius 5.6).
   Steps: 1 eight rune stones round the plinth, 2 four braziers, 3 a halo, 4 a head of light, 5 four banners, 6 a sun disc behind it, 7 six orbiting shards, 8 a beam to the sky. Test: client-smoke (loads), docs/PUZZLES.md round 9. */
let SGS=null;
const SGS_NAMES=['Rune stones','Braziers','A halo','A head of light','Banners','A sun disc','Orbiting shards','A beam to the sky'];   // what each step adds (the offering panel lists them)
function sgsBuild(){
  const T=GW_PLACE.statue; if(!T) return;
  const G=new THREE.Group(); G.position.set(T.x,getH(T.x,T.z),T.z); G.visible=false; scene.add(G);
  const glow=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o||0.85,depthWrite:false,blending:THREE.AdditiveBlending});
  const steps=[]; for(let i=0;i<8;i++){ const g=new THREE.Group(); g.visible=false; G.add(g); steps.push(g); }
  for(let k=0;k<8;k++){ const a=k/8*TAU, m=new THREE.Mesh(new THREE.OctahedronGeometry(0.34,0),glow(0x8fe3ff)); m.position.set(Math.sin(a)*6.8,0.9,Math.cos(a)*6.8); m.scale.set(0.7,1.4,0.7); steps[0].add(m); }
  const flames=[]; for(let k=0;k<4;k++){ const a=Math.PI/4+k*Math.PI/2, x=Math.sin(a)*7.8, z=Math.cos(a)*7.8, bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.3,0.5,8),new THREE.MeshLambertMaterial({color:0x5a4a38})), post=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,1.1,6),new THREE.MeshLambertMaterial({color:0x5a4a38}));
    post.position.set(x,0.55,z); bowl.position.set(x,1.3,z); const f=new THREE.Mesh(new THREE.ConeGeometry(0.4,1.2,7),glow(0xffb347)); f.position.set(x,2.1,z); flames.push(f); steps[1].add(post,bowl,f); }
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.5,0.07,6,40),glow(0xfff0a0)); halo.position.y=9.6; halo.rotation.x=Math.PI/2; steps[2].add(halo);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.46,12,10),glow(0xffe08a,0.7)); head.position.y=8.45; steps[3].add(head);
  for(let k=0;k<4;k++){ const a=k*Math.PI/2, b=new THREE.Mesh(new THREE.BoxGeometry(0.1,3.6,1.2),new THREE.MeshLambertMaterial({color:0xc8963a,side:THREE.DoubleSide})); b.position.set(Math.sin(a)*9.5,4.2,Math.cos(a)*9.5); b.rotation.y=a; steps[4].add(b); const t=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,1.5),new THREE.MeshLambertMaterial({color:0x3a2a18})); t.position.set(Math.sin(a)*9.5,6.1,Math.cos(a)*9.5); t.rotation.y=a; steps[4].add(t); }
  const disc=new THREE.Mesh(new THREE.TorusGeometry(3.6,0.14,6,48),glow(0xffd35a,0.55)); disc.position.set(0,8.2,-2.2); steps[5].add(disc);
  const shards=[]; for(let k=0;k<6;k++){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.28,0),glow(0xbfe9ff)); m.userData.k=k; shards.push(m); steps[6].add(m); }
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,1.1,60,12,1,true),glow(0xfff0b0,0.22)); beam.position.y=38; steps[7].add(beam);
  SGS={G,steps,flames,halo,head,disc,shards,beam,tier:-1,t:0};
}
function sgsUpdate(dt){
  if(!SGS||!GEAR) return; const S=SGS, tier=pzStatueTier(GEAR.sigOff||0);
  if(tier!==S.tier){ S.tier=tier; S.G.visible=tier>0; S.steps.forEach((g,i)=>{ g.visible=i<tier; }); }
  if(tier<=0||Math.hypot(P.x-S.G.position.x,P.z-S.G.position.z)>260) return;   // (far away nothing moves)
  S.t+=dt; const t=S.t;
  S.flames.forEach((f,i)=>{ f.scale.y=0.85+0.25*Math.sin(t*7+i*1.7); });
  S.halo.rotation.z=t*0.6; S.halo.position.y=9.6+Math.sin(t*1.4)*0.12; S.head.position.y=8.45+Math.sin(t*1.7)*0.08; S.disc.rotation.z=t*0.15;
  S.shards.forEach((m,i)=>{ const a=t*0.8+i*TAU/6; m.position.set(Math.sin(a)*4.2,6+Math.sin(t*1.1+i)*0.6,Math.cos(a)*4.2); m.rotation.y=t*2; });
  S.beam.material.opacity=0.18+0.06*Math.sin(t*2);
}
