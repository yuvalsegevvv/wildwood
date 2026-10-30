//@ The puzzle stones in the world: a standing stone with a glowing rune that dims for two hours after a solve; the talk key opens its board (the stones exist only while PZ_ON)
/* Agent map. pzBuild() is called once by generation-setup.js beside troomBuild(); pzNear() / pzPrompt(key) / pzOpenNear() are used by village/talking.js; pzUpdate(dt) runs every frame from main/loop.js and
   lights or dims each rune from GEAR.pz[site].t. Sites: shared/puzzle-sites.js (PZ_SITES). The server checks the distance and the clock again (server/puzzles.js). Test: client-smoke (loads). */
const PZ_STONES=[];
function pzBuild(){
  if(!PZ_ON) return;
  for(const S of PZ_SITES){
    const y=getH(S.x,S.z), G=new THREE.Group(); G.position.set(S.x,y,S.z); G.name='puzzle-stone-'+S.id;
    const rock=(x,yy,z,nx,ny,nz,c)=>{ c.set(0x8c8a84).multiplyScalar(0.7+0.5*h3(x*4,yy*3,z*4)); };
    const body=new THREE.Mesh(merge([paint(vbox(1.1,2.2,0.7,0,1.1,0),rock),paint(vbox(1.5,0.35,1.1,0,0.17,0),rock)]),villageMat); body.castShadow=true; G.add(body);
    const mat=new THREE.MeshBasicMaterial({color:0x7fe8ff}), rune=new THREE.Mesh(new THREE.OctahedronGeometry(0.28,0),mat); rune.position.set(0,1.35,0.4); rune.scale.set(0.8,1.2,0.35); G.add(rune);
    const back=rune.clone(); back.position.z=-0.4; G.add(back);
    G.rotation.y=Math.atan2(VIL.x-S.x,VIL.z-S.z); scene.add(G); addCol(S.x,S.z,0.8);
    PZ_STONES.push({S,G,mat,rune,back});
  }
}
const pzNearest=()=>{ if(!PZ_ON||!started||PL.dead) return null; let b=null,bd=PZ_REACH; for(const s of PZ_STONES){ const d=Math.hypot(P.x-s.S.x,P.z-s.S.z); if(d<bd){ bd=d; b=s; } } return b; };
const pzNear=()=>!!pzNearest();
function pzPrompt(tk){ const s=pzNearest(), R=GEAR&&GEAR.pz&&GEAR.pz[s.S.id], left=R&&R.t>Date.now()?Math.ceil((R.t-Date.now())/60000):0;
  return left?'The stone is dim: it lights again in '+left+' min':'Press '+tk+': solve the puzzle ('+PZ_DIFF[s.S.diff].name+')'; }
function pzOpenNear(){ const s=pzNearest(); if(s) netSend({t:'pz',a:'open',site:s.S.id}); }
let pzLastT=0;
function pzUpdate(dt){
  if(!PZ_STONES.length||!GEAR) return; pzLastT+=dt; const now=Date.now();
  for(const s of PZ_STONES){
    const R=GEAR.pz&&GEAR.pz[s.S.id], dim=!!(R&&R.t>now);
    s.mat.color.setHex(dim?0x4a5560:0x7fe8ff); s.rune.rotation.y=s.back.rotation.y=pzLastT*(dim?0.1:0.9);
    s.rune.position.y=s.back.position.y=1.35+(dim?0:Math.sin(pzLastT*2)*0.06);
  }
}
