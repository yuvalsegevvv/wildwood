//@ The Deep Cave's mouth on the surface: a craggy rock face with a dark doorway cut into the northern foothills, two lamps, a signboard, the teleport circle and the iron lift cage that carries hikers down; built once with the world
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (the mouth builds), tools/cave-smoke.js (where it stands).
   exports: caveMouthBuild() (generation-setup.js, once), caveMouthUpdate(dt) (zone.js caveFrame: hidden when far, the lamps flicker, the lift's ring breathes), CAVE_MOUTH_VIEW {G, flames, ring}
   users: reads CAVE_MOUTH / caveMouthAt / CAVE_LIFT_SURFACE / CAVE_MOUTH_V (shared/cave-mouth.js: the place and the pad of flat ground rawHeight lays), buildCircle (village/buildings-vale.js: the circle's stones, ring and beam),
          dgEntRock / dgEntSignTex / dgEntWood (village/buildings-dungeon.js: a craggy block, a painted sign), addCol (the colliders)
   The group stands at the mouth turned by its `a`, so in its own frame +x is across, +z OUT of the mouth (downhill, away from the slope) and the hill is at -z; caveMouthAt(u, v) is the same frame in the world. Plants keep 18 m away
   (dgEntClear, game/dungeon/entrances.js), camps 40 m (server/monsters.js). Phones: fewer blocks, no flicker. */
const CAVE_MOUTH_VIEW={G:null,flames:[],ring:null,built:false};
const cavemRock=hex=>(x,y,z,nx,ny,nz,c)=>{ c.set(hex).multiplyScalar(0.66+h3(Math.floor(x*2),Math.floor(y*2),Math.floor(z*2))*0.5); };
function caveMouthBuild(){
  if(CAVE_MOUTH_VIEW.built) return; CAVE_MOUTH_VIEW.built=true;
  const M=CAVE_MOUTH, y0=getH(M.x,M.z), G=new THREE.Group(), low=LOW||LITE; G.position.set(M.x,y0,M.z); G.rotation.y=M.a; G.name='cave-mouth';
  const rock=cavemRock(0x77726a), rockD=cavemRock(0x5a564f), moss=cavemRock(0x4a6a3a), parts=[];
  const gy=(u,v)=>{ const w=caveMouthAt(u,v); return getH(w[0],w[1])-y0; };
  // the face: big blocks left and right of the doorway, a lintel over it, jambs
  const faceZ=-11;
  for(const [u,h,w,d,k] of [[-4.6,5.5,3.4,3.4,1],[-8.2,6.8,4.6,4,0],[-12.4,5.2,4.4,3.6,1],[-16,3.8,3.6,3,0],[4.6,5.4,3.4,3.4,1],[8.4,7.2,4.8,4,0],[12.8,5.4,4.6,3.6,1],[16.4,3.6,3.6,3,0]]){
    if(low&&Math.abs(u)>13) continue; parts.push(dgEntRock(w,h,d,u,gy(u,faceZ)+h/2-0.6,faceZ-d*0.2,0.6,k?rock:rockD,(u*0.37)%1,0)); }
  parts.push(dgEntRock(8.2,1.5,3.2,0,gy(0,faceZ)+4.4,faceZ-0.2,0.35,rock,0,0.02));   // the lintel
  for(const s of [-1,1]) parts.push(dgEntRock(1.5,4.4,2.6,s*3.3,gy(s*3.3,faceZ)+1.6,faceZ-0.1,0.3,rockD,0,0));   // the jambs
  for(const [u,v,r] of [[-6,-9.4,0.8],[6.4,-9.6,0.9],[-2.3,-12.2,1.1],[2.5,-12.4,1]]) parts.push(dgEntRock(r*2,r*1.6,r*2,u,gy(u,v)+r*0.5,v,0.4,moss,u,0));   // a few mossy boulders
  parts.push(dgEntRock(6.4,0.5,2.2,0,gy(0,-8.9)+0.2,-8.9,0.15,rockD,0,0));   // a worn threshold slab
  for(const s of [-1,1]){ parts.push(paint(cyl(0.09,0.12,3.0,6).translate(s*3.9,gy(s*3.9,-8.5)+1.3,-8.5),cavemRock(0x2e2a28))); parts.push(paint(cyl(0.3,0.16,0.25,7).translate(s*3.9,gy(s*3.9,-8.5)+2.95,-8.5),cavemRock(0x2e2a28))); }   // lamp posts
  // the doorway: black, with a faint cold glimmer far inside
  const dark=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.6),new THREE.MeshBasicMaterial({color:0x020304})); dark.position.set(0,gy(0,-10)+1.55,-10.1); G.add(dark);
  const glim=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.2),new THREE.MeshBasicMaterial({color:0x2a7aa8,transparent:true,opacity:0.12,depthWrite:false,blending:THREE.AdditiveBlending})); glim.position.set(0,gy(0,-10)+1.2,-10.05); G.add(glim);
  // the lift: a plank platform in an iron cage, a gantry above with a wheel, a ring on the planks
  const L=caveMouthAt(6.4,-1.2), lg=gy(6.4,-1.2), iron=cavemRock(0x2c2a28), wood=dgEntWood(0x5a4430);
  const lp=[paint(cyl(2.35,2.45,0.28,16).translate(6.4,lg+0.06,-1.2),cavemRock(0x5a5650))];
  for(let k=0;k<6;k++) lp.push(paint(vbox(3.9,0.1,0.55,6.4,lg+0.22,-1.2+(k-2.5)*0.62),wood));
  for(let k=0;k<8;k++){ const a=k/8*TAU+0.39, ux=6.4+Math.sin(a)*2.1, uz=-1.2+Math.cos(a)*2.1; lp.push(paint(cyl(0.07,0.07,2.7,5).translate(ux,lg+1.5,uz),iron)); }
  lp.push(paint(new THREE.TorusGeometry(2.1,0.07,5,18).rotateX(Math.PI/2).translate(6.4,lg+2.85,-1.2),iron), paint(new THREE.TorusGeometry(2.1,0.05,5,18).rotateX(Math.PI/2).translate(6.4,lg+1.1,-1.2),iron));
  for(const s of [-1,1]) lp.push(paint(vbox(0.22,5.2,0.22,6.4+s*2.7,lg+2.6,-1.2),wood));
  lp.push(paint(vbox(6.0,0.22,0.22,6.4,lg+5.1,-1.2),wood), paint(cyl(0.45,0.45,0.14,10).rotateZ(Math.PI/2).translate(6.4,lg+4.7,-1.2),iron));
  lp.push(paint(cyl(0.02,0.02,1.9,4).translate(6.4,lg+3.9,-1.2),iron));   // the chain
  const lift=new THREE.Mesh(merge(lp),villageMat); lift.castShadow=true; lift.receiveShadow=true; G.add(lift);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.75,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffc06a,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending})); ring.position.set(6.4,lg+0.3,-1.2); G.add(ring); CAVE_MOUTH_VIEW.ring=ring;
  const mesh=new THREE.Mesh(merge(parts),villageMat); mesh.castShadow=true; mesh.receiveShadow=true; G.add(mesh);
  // the lamps' flames (unlit cones that flicker)
  for(const s of [-1,1]){ const f=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.55,7),new THREE.MeshBasicMaterial({color:0xffb04a})); f.position.set(s*3.9,gy(s*3.9,-8.5)+3.35,-8.5); G.add(f); CAVE_MOUTH_VIEW.flames.push(f); }
  // the signboard on a post, both faces
  { const sp=[paint(cyl(0.08,0.1,2.6,6).translate(-3.2,gy(-3.2,7)+1.1,7),dgEntWood(0x5e4630)), paint(vbox(2.5,0.07,0.07,-3.2,gy(-3.2,7)+1.55,7),dgEntWood(0x5e4630))];
    const post=new THREE.Mesh(merge(sp),villageMat); G.add(post);
    const mat=new THREE.MeshLambertMaterial({map:dgEntSignTex('THE DEEP CAVE','Lift to the floors · Lv 23+'),emissive:0x2a2418});
    for(const side of [1,-1]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(2.3,0.58),mat); p.position.set(-3.2,gy(-3.2,7)+2.15,7+side*0.05); if(side<0) p.rotation.y=Math.PI; G.add(p); } addCol(caveMouthAt(-3.2,7)[0],caveMouthAt(-3.2,7)[1],0.3); }
  for(let u=-17;u<=17;u+=2.2){ const w=caveMouthAt(u,-10.6); addCol(w[0],w[1],1.3); }   // nobody walks behind the face
  scene.add(G); CAVE_MOUTH_VIEW.G=G;
  buildCircle(CAVE_MOUTH_V);   // the teleport circle (stones, ring, beam; buildings-vale.js)
}
function caveMouthUpdate(dt){
  const V=CAVE_MOUTH_VIEW; if(!V.G) return;
  const vis=Math.hypot(P.x-CAVE_MOUTH.x,P.z-CAVE_MOUTH.z)<420&&!CAVE_RUN; V.G.visible=vis; if(!vis||LOW||LITE) return;
  V.flames.forEach((f,i)=>{ const k=0.85+0.15*Math.sin(t*9+i*2)*Math.sin(t*5.3+i); f.scale.set(k,0.9+0.2*Math.sin(t*7+i),k); });
  if(V.ring) V.ring.material.opacity=0.38+0.14*Math.sin(t*2.2);
}
