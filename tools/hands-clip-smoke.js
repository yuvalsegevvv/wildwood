// Hands and forearms stay out of the body and the clothes: the base setups and the slider extremes (hips, belly, chest, muscle, thin) in a skirt, a ballgown, a robe, plate and trousers,
// posed by the real poseRig (rest, eight walk phases, a run, both sits, talking, holding a sword and a staff). Every vertex of each forearm and hand (the elbow's meshes) is measured
// against the obstacles arm-clear.js keeps (the torso below the armpit, the meshes on the hips, the thighs and shins: radial envelopes of their own vertices); deeper than LIMIT fails.
// (Seated, a skirt's shell below the waist does not count: it is drawn where the sway pushes it, not round the thighs.)
// Also: the rest abduction stays below a gorilla's, and sitting hands lie on the thighs (near, not floating). node tools/hands-clip-smoke.js [--v] (every look's worst pose)
const fs=require('fs'), path=require('path');
const C=require('./char-load')(code=>code.replace(';return {',';return {aclDepth,aclLook,aclSit,aclCarry,ACL_REST_E,armLean,clamp,'));
const {strip}=require('./load');
const poseSrc=strip(fs.readFileSync(path.join(__dirname,'../src/game/character/pose.js'),'utf8')).split('function animateHiker')[0];
const clock={t:0}, poseRig=new Function('clamp','aclLook','aclSit','aclCarry','ACL_REST_E','clock','return function(r,dt,o){ const t=clock.t; return ('+poseSrc.replace(/^\s*function poseRig/,'function')+')(r,dt,o); }');
const pose=poseRig(C.clamp,C.aclLook,C.aclSit,C.aclCarry,C.ACL_REST_E,clock);
const LIMIT=0.005, GAP=0.03, verbose=process.argv.includes('--v');
const B=C.CHAR_MODELS.base, looks=[];
for(const sex of ['male','female']) for(const s of C.setupsOf(B,sex)) looks.push(['setup '+sex+' '+(s.name||s.id||''),C.applySetup(Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M),s)]);
const EX={hipsMax:{sex:'female',hips:1.3,hipCurve:2.6,hipTall:1.8,thighs:1.35},bellyMax:{belly:1.5,build:1.24},chestMax:{sex:'female',chest:4.5},muscleMax:{muscle:1.5,shoulders:1.25,arms:1.35,build:1.24},thin:{sex:'female',build:0.84,waist:0.75,hips:0.8,shoulders:0.8,arms:0.75,thighs:0.8,chest:0.5,muscle:-1,belly:-1}};
const WEAR={skirt:{top:'tshirt',bottom:'skirt'},ballgown:{top:'ballgown'},robe:{top:'robe',bottom:'trousers'},plate:{top:'plate',bottom:'greaves'},trousers:{top:'tshirt',bottom:'trousers'}};
for(const [en,e] of Object.entries(EX)) for(const [wn,w] of Object.entries(WEAR)) looks.push([en+' '+wn,Object.assign({},e.sex==='female'?C.LOOK_F:C.LOOK_M,{hat:'none',shoes:'boots'},e,w)]);
const POSES=[['rest',{sp:0}]];
for(let i=0;i<8;i++) POSES.push(['walk'+i,{sp:4.2,ph:i*Math.PI/4}]);
POSES.push(['run',{sp:9.5,ph:Math.PI/2}],['run2',{sp:9.5,ph:-Math.PI/2}],['sit1',{sit:1}],['sit2',{sit:2,sitH:0.58}],['talk',{talk:true}],['sword',{hold:'sword'}],['staff',{hold:'staff'}]);
const v=new THREE.Vector3(), inv=new THREE.Matrix4();
function local(env,frame,wp,yMin){ inv.copy(frame.matrixWorld).invert(); v.copy(wp).applyMatrix4(inv); return yMin!==undefined&&v.y<yMin?-1:C.aclDepth(env,v.x,v.y,v.z); }
// the deepest vertex of side sd's forearm and hand, and what it is in
function deepest(rig,sd,sit){
  const el=sd<0?rig.elL:rig.elR, A=rig.acl, i=sd<0?0:1, obs=[[A.torso,rig.spine,'torso']].concat(A.hips.map(E=>[E,rig.hips,'hips mesh',sit?-0.03:undefined]),[[A.thigh[i],sd<0?rig.hipL:rig.hipR,'thigh'],[A.shin[i],sd<0?rig.kneeL:rig.kneeR,'shin']]);
  let best=[-1,'',0]; const w=new THREE.Vector3();
  const ms=[]; el.traverse(m=>{ if(m.isMesh) ms.push(m); });   // (the forearm's lower part and the hand are in the twist group, a child of the elbow)
  for(const m of ms){ const p=m.geometry.attributes.position;
    for(let j=0;j<p.count;j+=2){ w.fromBufferAttribute(p,j).applyMatrix4(m.matrixWorld); if(p.getY(j)>-0.04) continue;
      for(const [E,f,n,ym] of obs){ const d=local(E,f,w,ym); if(d>best[0]) best=[d,n,p.getY(j)]; } } }
  return best;
}
let fails=0, worst={}, restZ=[], sitGap=[]; const t0=Date.now(); let buildMs=0;
for(const [name,L] of looks){
  const tb=Date.now(), rig=C.buildCharacter(L,{q:1.1}); buildMs+=Date.now()-tb;
  if(!rig.acl){ console.log('FAIL',name,'no rig.acl'); fails++; continue; }
  const rz=rig.acl.lean+rig.acl.rest[1].z; restZ.push([name,rz,rig.acl.rest[1]]);
  if(rz>0.42){ console.log('FAIL',name,'rest abduction',rz.toFixed(3),'rad: a gorilla'); fails++; }
  let lw=[-1,''];
  for(const [pn,o] of POSES){
    rig.shL.rotation.set(0,0,0); rig.shR.rotation.set(0,0,0);
    for(let s=0;s<6;s++){ clock.t=1+s*0; pose(rig,0.1,Object.assign({seed:0},o)); }
    rig.root.updateMatrixWorld(true);
    for(const sd of [-1,1]){ const [d,what,y]=deepest(rig,sd,!!o.sit); if(d>(worst[pn]||[-1])[0]) worst[pn]=[d,name,what];
      if(d>lw[0]) lw=[d,pn+(sd<0?' L':' R')+' '+what];
      if(d>LIMIT){ console.log('FAIL',name,pn,sd<0?'left':'right','hand/forearm',(d*1000).toFixed(1),'mm inside the',what,'(at '+(-y).toFixed(2)+' m down the forearm)'); fails++; } }
    if(o.sit) for(const sd of [-1,1]){ const el=sd<0?rig.elL:rig.elR, th=sd<0?rig.hipL:rig.hipR, E=rig.acl.thigh[sd<0?0:1], w=new THREE.Vector3(); let near=-1;   // the hand lies ON the thigh: its closest vertex within GAP of it
      const ms=[]; el.traverse(m=>{ if(m.isMesh) ms.push(m); }); for(const m of ms){ const p=m.geometry.attributes.position; for(let j=0;j<p.count;j+=2){ w.fromBufferAttribute(p,j).applyMatrix4(m.matrixWorld); const d=local(E,th,w); if(d>near) near=d; } }
      sitGap.push(-near); if(-near>GAP){ console.log('FAIL',name,pn,sd<0?'left':'right','hand floats',(-near*100).toFixed(1),'cm over the thigh'); fails++; } }
  }
  if(verbose) console.log(name.padEnd(28),'rest',rz.toFixed(3),'worst',(lw[0]*1000).toFixed(1),'mm',lw[1]);
}
console.log('worst per pose (mm inside; negative = clear):'); for(const [pn] of POSES){ const w=worst[pn]; console.log('  '+pn.padEnd(6),(w[0]*1000).toFixed(1).padStart(6),w[1],w[2]); }
restZ.sort((a,b)=>a[1]-b[1]); console.log('rest abduction (rad): least',restZ[0][0],restZ[0][1].toFixed(3),'| most',restZ[restZ.length-1][0],restZ[restZ.length-1][1].toFixed(3),JSON.stringify(restZ[restZ.length-1][2]));
console.log('sitting, the hand\'s nearest point to the thigh (cm): max',(Math.max(...sitGap)*100).toFixed(1),'min',(Math.min(...sitGap)*100).toFixed(1));
console.log(looks.length+' looks x '+POSES.length+' poses, build '+(buildMs/looks.length).toFixed(0)+' ms a character, '+((Date.now()-t0)/1000).toFixed(1)+' s');
if(fails){ console.log('hands-clip-smoke: FAIL ('+fails+')'); process.exit(1); }
console.log('hands-clip-smoke: OK');
