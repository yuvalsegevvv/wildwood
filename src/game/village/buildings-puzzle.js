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
    // the stone's chest: appears beside it after a solve (closed, glinting) until you open it, then stands open and empty while the stone is dim
    const tint=new THREE.Color(PZ_LAND_TINT[S.cave?'cave':landAt(S.x,S.z)]||'#c9b27a'), gold=new THREE.Color(S.diff>=4?0xffd35a:S.diff>=2?0xe0c070:0xb8a886);
    const CH=new THREE.Group(); CH.position.set(1.7,0,0.5); CH.visible=false; CH.rotation.y=-0.5; G.add(CH);
    const wood=new THREE.MeshLambertMaterial({color:0x6b4a2a}), trim=new THREE.MeshLambertMaterial({color:tint}), gm=new THREE.MeshLambertMaterial({color:gold});
    const bx=(w,h,d,x,y,z,m,par)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); (par||CH).add(o); return o; };
    bx(1.0,0.5,0.62,0,0.25,0,wood); bx(1.04,0.1,0.66,0,0.08,0,trim); bx(0.1,0.52,0.66,-0.36,0.25,0,gm); bx(0.1,0.52,0.66,0.36,0.25,0,gm);
    const lid=new THREE.Group(); lid.position.set(0,0.5,-0.31); CH.add(lid);
    bx(1.02,0.16,0.64,0,0.08,0.31,wood,lid); bx(1.06,0.05,0.68,0,0.18,0.31,trim,lid); bx(0.1,0.2,0.68,-0.36,0.09,0.31,gm,lid); bx(0.1,0.2,0.68,0.36,0.09,0.31,gm,lid); bx(0.14,0.14,0.04,0,0.0,0.64,gm,lid);
    const glint=new THREE.Mesh(new THREE.OctahedronGeometry(0.12,0),new THREE.MeshBasicMaterial({color:gold})); glint.position.set(0,1.0,0); CH.add(glint);
    PZ_STONES.push({S,G,mat,rune,back,CH,lid,glint,pend:null,open:0,until:0});
  }
}
const pzNearest=()=>{ if(!PZ_ON||!started||PL.dead) return null; let b=null,bd=PZ_REACH; for(const s of PZ_STONES){ const d=Math.hypot(P.x-s.S.x,P.z-s.S.z); if(d<bd){ bd=d; b=s; } } return b; };
const pzNear=()=>!!pzNearest();
function pzPrompt(tk){ const s=pzNearest(); if(s.pend) return 'Press '+tk+': open the chest'; const  R=GEAR&&GEAR.pz&&GEAR.pz[s.S.id], left=R&&R.t>Date.now()?Math.ceil((R.t-Date.now())/60000):0;
  return left?'The stone is dim: it lights again in '+left+' min':'Press '+tk+': solve the puzzle ('+PZ_DIFF[s.S.diff].name+')'; }
function pzOpenNear(){ const s=pzNearest(); if(s&&s.pend){ const m=s.pend; s.pend=null; pzSheet(m); return; } if(s) netSend({t:'pz',a:'open',site:s.S.id}); }
// a won stone's chest (panel.js pzDone): false when there is no such stone here (the sheet shows at once instead)
function pzChestDrop(m){ const s=PZ_STONES.find(z=>z.S.id===m.site); if(!s) return false; s.pend=m; s.open=0; s.until=Date.now()+PZ_RENEW_MS; toast('A chest appeared beside the stone'); return true; }
let pzLastT=0;
function pzUpdate(dt){
  if(!PZ_STONES.length||!GEAR) return; pzLastT+=dt; const now=Date.now();
  for(const s of PZ_STONES){
    const R=GEAR.pz&&GEAR.pz[s.S.id], dim=!!(R&&R.t>now);
    s.mat.color.setHex(dim?0x4a5560:0x7fe8ff); s.rune.rotation.y=s.back.rotation.y=pzLastT*(dim?0.1:0.9);
    s.rune.position.y=s.back.position.y=1.35+(dim?0:Math.sin(pzLastT*2)*0.06);
    s.CH.visible=!!s.pend||dim||now<s.until; const tg=s.pend?0:1; s.open+=(tg-s.open)*Math.min(1,dt*5); s.lid.rotation.x=-s.open*1.9; s.glint.visible=!!s.pend; if(s.pend){ s.glint.rotation.y=pzLastT*2.5; s.glint.position.y=1.0+Math.sin(pzLastT*3)*0.08; }
  }
}
