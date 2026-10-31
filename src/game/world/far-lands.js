//@ The Emberwake Isles beyond the world's south edge, the one placeholder left (every land of the continent is built on the atlas): a strip of sea with their volcano and islets, seen through the haze
/* The continent that used to stand round the playable lands as placeholders (the Greyspine, the Sunscar, the Gloamhorn) is gone: they are built, on the atlas (shared/world-atlas.js), and the whole map is the playable
   rectangle. What is left is a strip of FAR_CELL cells along the south edge, with the Emberwake Isles (docs/WORLD.md section 6) seen across the sea. Nothing here can be walked on: worldBounds
   (player/movement.js) keeps you inside the rectangle. Vertices on the rectangle's edge take the real ground's height (getH) so the two meet; cells inside it or under the sea are left out. */
const FAR_CELL=27.5/1.5;
// the Emberwake Isles: the young volcano in the west (Coralhaven's island), older and lower going east, a sand bar last
// (the isles themselves are playable now, on the atlas: shared/emberwake.js; what is left here is a few islets on the horizon beyond the new south edge, and the smoke over the volcano)
const FAR_ISLES=[{x:-720,z:2330,r:48},{x:-120,z:2420,r:62},{x:330,z:2380,r:40},{x:880,z:2300,r:30,sx:2.6,bar:true}];
const FAR_SMOKE={x:650,z:1700};   // (the volcano isle's centre, EW_ISLANDS in the atlas)
const FAR_C={grass:0x5d7446,rock:0x857d70,snow:0xf1f4f6,spruce:0x3e5b4c,ice:0xc4d8e6,frost:0xe9f0f5,sand:0xd6ae6c,mesa:0xb5623e,
  beach:0xdcc796,savanna:0xc4b25a,savanna2:0xa8a44c,heather:0x7f9072,heather2:0x8a7a92,jungle:0x4a9444,ash:0x4a3c34,lava:0xd8561e,smoke:0xb8b4ae};

function farIsle(x,z){
  let best=-1e9, I=null;
  for(const q of FAR_ISLES){ const d=q.r-Math.hypot((x-q.x)/(q.sx||1),z-q.z)+noise2(x*0.021+q.x,z*0.021)*q.r*0.22; if(d>best){ best=d; I=q; } }
  return [best,I];
}
function farHeight(x,z){
  const [isl,I]=farIsle(x,z);
  if(isl>0){
    if(I.bar) return 0.8+Math.min(isl,10)*0.12;
    if(I.volcano){ const k=isl-I.r*0.8; return 2+smoothstep(0,20,isl)*2+Math.max(0,isl-20)*1.35-(k>0?k*1.6:0); }
    return 1.5+smoothstep(0,25,isl)*(6+noise2(x*0.03,z*0.03)*3)+Math.max(0,isl-25)*0.35;
  }
  return WA_SEA_FLOOR;   // (the sea beyond the isles: the continent that stood here as a placeholder is the atlas's playable world now)
}
function farColor(x,z,h,out){
  const j=0.9+(noise2(x*0.045+3,z*0.045-8)*0.5+0.5)*0.2, [isl,I]=farIsle(x,z);
  let c;
  if(isl>0) c=h<2.6?FAR_C.beach:I.volcano&&isl>I.r*0.8?FAR_C.lava:I.volcano&&h>40?FAR_C.ash:FAR_C.jungle;
  else c=FAR_C.sand;
  return out.set(c).multiplyScalar(j);
}
/* haze: the far lands fog like the terrain up to the fog's end, then their high ground (25-110 m and up) stays faintly
   visible above it as a pale silhouette, so the Greyspine, the Hoarfrost and the volcano show on the horizon */
function farMaterial(){
  const m=new THREE.MeshLambertMaterial({vertexColors:true});
  m.onBeforeCompile=sh=>{
    sh.vertexShader='varying float vWy;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWy=(modelMatrix*vec4(transformed,1.0)).y;');
    sh.fragmentShader='varying float vWy;\n'+sh.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
      float fogFactor=smoothstep(fogNear,fogFar,fogDepth);
      float sil=smoothstep(fogFar,fogFar+120.0,fogDepth)*smoothstep(25.0,110.0,vWy)*0.45;
      gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogFactor*(1.0-sil));
    #endif`);
  };
  m.customProgramCacheKey=()=>'farlands';
  return m;
}
function buildFarLands(){
  const C=FAR_CELL, X0=WX0-100, Z0=WZ1-4*C, NX=Math.ceil((WX1-WX0+200)/C), NZ=Math.ceil((2560-Z0)/C), W=NX+1;   // (a strip along the world's south edge, a row of cells inside it so the edge vertices meet the real ground: the Emberwake Isles lie beyond it)
  const onRect=(x,z)=>x>=WX0-0.01&&x<=WX1+0.01&&z>=WZ0-0.01&&z<=WZ1+0.01;
  const H=new Float32Array(W*(NZ+1)), pos=new Float32Array(W*(NZ+1)*3), col=new Float32Array(W*(NZ+1)*3), cc=new THREE.Color();
  for(let iz=0;iz<=NZ;iz++) for(let ix=0;ix<=NX;ix++){
    const x=X0+ix*C, z=Z0+iz*C, k=iz*W+ix, h=onRect(x,z)?getH(clamp(x,WX0,WX1),clamp(z,WZ0,WZ1)):farHeight(x,z);
    H[k]=h; pos[k*3]=x; pos[k*3+1]=h; pos[k*3+2]=z;
    farColor(x,z,h,cc); col[k*3]=cc.r; col[k*3+1]=cc.g; col[k*3+2]=cc.b;
  }
  const idx=[];
  for(let iz=0;iz<NZ;iz++) for(let ix=0;ix<NX;ix++){
    const x=X0+ix*C, z=Z0+iz*C;
    if(x>=WX0-0.01&&x+C<=WX1+0.01&&z>=WZ0-0.01&&z+C<=WZ1+0.01) continue;   // the playable lands draw themselves
    const a=iz*W+ix, b=a+1, d=a+W, c=d+1;
    if(Math.max(H[a],H[b],H[c],H[d])<-2.5) continue;                       // deep under the sea
    idx.push(a,d,c, a,c,b);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,farMaterial()); mesh.matrixAutoUpdate=false;
  scene.add(mesh);
  // smoke over the volcano: a few low-poly puffs, high enough to show through the haze
  const V=FAR_SMOKE, sp=[], sc=[];
  [[0,150,16],[8,182,22],[-4,215,27],[14,252,32]].forEach(([dx,y,r],i)=>{
    const sg=new THREE.IcosahedronGeometry(r,0), p=sg.attributes.position;
    for(let k=0;k<p.count;k++){ sp.push(V.x+dx+p.getX(k),y+p.getY(k),V.z-i*6+p.getZ(k)); cc.set(FAR_C.smoke).multiplyScalar(0.9+0.1*i/3); sc.push(cc.r,cc.g,cc.b); }
  });
  const sg=new THREE.BufferGeometry();
  sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.setAttribute('color',new THREE.Float32BufferAttribute(sc,3));
  sg.computeVertexNormals(); sg.computeBoundingSphere();
  const smoke=new THREE.Mesh(sg,farMaterial()); smoke.matrixAutoUpdate=false; scene.add(smoke);
  return mesh;
}
