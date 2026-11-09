//@ The Deep Cave's energy on the client: the bar under the method line, the blindness when it runs low, a hint when you stand in a safe spot, and the echo shard nodes in the floor
/* Agent map. Doc: docs/CAVE.md section 17; rules: shared/cave-energy.js; the server: server/cave/energy.js. The numbers come in the cm message (cave/methods.js): en (0-100), sf (1 = safe spot), sn (bit mask of nodes resting), mc (mining).
   exports: caveEnFrame(dt) (caveMethodsFrame calls it: bar, blindness), caveMpS(X) (the shard nodes' props; method-props.js builds them with the methods'), caveEnHide() (leaving the floors).
   Elements: #cvEnergy (the bar, index.html), #cvBlind (the dark vignette over the screen, pointer-events none). Test: tools/client-smoke.js (the cave case). */
function caveEnFrame(dt){
  const s=typeof caveMState==='function'?caveMState():null, bar=$('#cvEnergy'), bl=$('#cvBlind'); if(!bar||!bl) return;
  if(!s||s.en===undefined){ caveEnHide(); return; }
  const e=s.en, k=caveEnBlind(e); bar.hidden=false;
  const f=bar.firstElementChild; if(f){ f.style.width=Math.max(0,Math.min(100,e/CAVE_EN_MAX*100))+'%'; }
  bar.dataset.low=e<CAVE_EN_LOW?'1':''; bar.dataset.safe=s.sf?'1':''; bar.dataset.full=e>=CAVE_EN_MAX?'1':'';
  const lb=bar.lastElementChild; if(lb) lb.textContent='Cave energy '+e+(s.sf?' · safe':'')+(s.mc?' · mining':'')+(e>=CAVE_EN_MAX?' · floor open':'');
  bl.style.opacity=k?(0.55+0.45*k).toFixed(2):'0'; bl.hidden=!k;
}
function caveEnHide(){ const bar=$('#cvEnergy'), bl=$('#cvBlind'); if(bar) bar.hidden=true; if(bl){ bl.hidden=true; bl.style.opacity='0'; } }
// the shard nodes: a cluster of crystal on the wall that is bright while ready and grey while it rests for you
function caveMpS(X){
  const MP=CAVE_MP, rd=X.rd, stone=caveMpRockC(0x4d4a46,0.35), GL=0x9fe8ff, lite=new THREE.Color(GL).lerp(new THREE.Color(0xffffff),0.4).getHex(), dk=new THREE.Color(GL).multiplyScalar(0.35).getHex();
  const baseM=X.mesh([caveMpPart(caveMpRock(0.7,0.7,0.5,0.4,rd),stone,0,0.7,-0.1)]);
  const crM=X.mesh([[-0.25,0.9,0.4,0.2],[0.1,1.25,0.38,0.17],[0.3,0.7,0.42,0.2]].map(([x,y,z,r],k)=>caveMpPart(new THREE.OctahedronGeometry(r),caveMpGradC(dk,lite,y-r*1.4,y+r*1.4,0.08),x,y,z,{sy:1.5,ry:k,rz:(k-1)*0.25})));
  const nodes=X.A.S.nodes.map((q,i)=>{ const [x,z]=X.out(q,0.5), G=X.at(x,z); G.rotation.y=Math.atan2(q.nx||0,q.nz||1);
    const cr=crM.clone(), h=X.halo(GL,2,0.45); h.position.set(0,1.0,0.5); G.add(baseM.clone(),cr,h); return {G,cr,h,i}; });
  X.add((s,dt,tt)=>{ const sn=(CAVE_M.s&&CAVE_M.s.sn)|0; for(const n of nodes){ const rest=(sn>>n.i)&1; n.cr.visible=!rest; n.h.visible=!rest; if(!rest) n.h.material.opacity=0.35+0.15*Math.sin(tt*2+n.i); } });
}
