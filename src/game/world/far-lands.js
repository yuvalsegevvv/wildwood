//@ The rest of Eldmere as placeholders around the three playable lands (Greyspine, Sunscar, Amber Reach, Stormhorn, Emberwake Isles; the Hoarfrost Reach is built): one smooth-shaded mesh of ridged mountains, high ground seen through the haze
/* Placeholders until each land is built (docs/WORLD.md: regions, map). Nothing here can be walked on: the playable
   rectangle's bounds (player/movement.js) keep you inside. The shapes follow docs/world-map.svg turned into world
   metres: the draft's Wildwood box is the home forest (about 2.1 m per map pixel east-west, 2.8 north-south), the
   vale is squeezed to its 550 m, and the Emberwake Isles are pulled north so they can be seen from the south shore
   (the map is not to scale, WORLD.md section 6). North is -z.
   The mesh is a grid of FAR_CELL cells aligned with the playable rectangle's edges; vertices on those edges take the
   real terrain's height (getH) so the two meet, and cells inside the rectangle or under the sea are left out. Shared vertices, smooth
   normals and colours from smooth noise (the old grid was flat-shaded with a random tint per face, which read as crumpled paper). */
const FAR_CELL=27.5/1.5;
// the continent's coastline (world metres, clockwise from the Stormhorn's tip)
const FAR_COAST=[[-1566,-1244],[-1561,-1138],[-1497,-1028],[-1370,-917],[-1242,-806],[-1135,-751],[-901,-737],[-816,-834],
  [-645,-917],[-411,-1050],[-102,-1111],[100,-1166],[271,-1194],[441,-1125],[580,-958],[721,-723],[846,-560],[955,-470],
  [1005,-410],[1010,-86],[1012,136],[1005,300],[995,452],[700,455],[441,452],[100,456],[-305,455],[-432,579],[-518,745],
  [-603,828],[-699,911],[-752,1078],[-837,1299],[-901,1521],[-1093,1526],[-1199,1479],[-1263,1368],[-1295,1188],
  [-1289,911],[-1259,662],[-1178,482],[-1061,352],[-976,260],[-901,108],[-890,-86],[-922,-252],[-1007,-335],
  [-1125,-418],[-1220,-501],[-1348,-562],[-1455,-626],[-1561,-737],[-1636,-889],[-1664,-1083],[-1625,-1194]];
// the Emberwake Isles: the young volcano in the west (Coralhaven's island), older and lower going east, a sand bar last
const FAR_ISLES=[{x:-560,z:1250,r:115,volcano:true},{x:-330,z:930,r:55},{x:-60,z:1010,r:62},{x:-250,z:1250,r:66},
  {x:230,z:1180,r:72},{x:560,z:1270,r:30,sx:2.6,bar:true}];
const FAR_C={grass:0x5d7446,rock:0x857d70,snow:0xf1f4f6,spruce:0x3e5b4c,ice:0xc4d8e6,frost:0xe9f0f5,sand:0xd6ae6c,mesa:0xb5623e,
  beach:0xdcc796,savanna:0xc4b25a,savanna2:0xa8a44c,heather:0x7f9072,heather2:0x8a7a92,jungle:0x4a9444,ash:0x4a3c34,lava:0xd8561e,smoke:0xb8b4ae};

// signed distance to the coast: + on land, - at sea
function farSD(x,z){
  const P=FAR_COAST, n=P.length; let inside=false, dm=1e18;
  for(let i=0,j=n-1;i<n;j=i++){
    const [x1,z1]=P[i], [x2,z2]=P[j];
    if((z1>z)!==(z2>z) && x<x1+(z-z1)*(x2-x1)/(z2-z1)) inside=!inside;
    const dx=x2-x1, dz=z2-z1, t=clamp(((x-x1)*dx+(z-z1)*dz)/(dx*dx+dz*dz)), ex=x-x1-t*dx, ez=z-z1-t*dz, d=ex*ex+ez*ez;
    if(d<dm) dm=d;
  }
  return (inside?1:-1)*Math.sqrt(dm);
}
// which land a point of the continent belongs to (the lines are the map's borders)
function farRegion(x,z){
  if(x<-1150&&z<-420) return 'horn';
  if(z < -440+(x<-440?(-440-x)*0.378:0)) return x<-120?'grey':'frost';   // north of the Greyspine / Sunscar line
  if(z > 352+(x+1061)*1.039) return 'amber';
  return 'sun';
}
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
  const sd=farSD(x,z);
  if(sd<=0) return Math.max(-4+Math.max(sd,-220)*0.12, -3+isl*0.1);
  const R=farRegion(x,z);
  if(R==='grey') return 8+28*smoothstep(0,120,sd)+ridged(x*0.0034+5,z*0.0034-3,5)*165*smoothstep(0,240,sd)+fbm(x*0.012,z*0.012,3)*12;
  if(R==='frost') return 8+50*smoothstep(0,160,sd)+(fbm(x*0.005+2,z*0.005,3)*0.5+0.5)*30+Math.max(0,noise2(x*0.011,z*0.011+4))*34;
  if(R==='sun') return 4+48*smoothstep(0,45,sd)+noise2(x*0.03,z*0.03)*2.5+(noise2(x*0.007+9,z*0.007-2)>0.45?16:0);
  if(R==='amber') return lerp(1.2,3+16*smoothstep(0,140,sd)+fbm(x*0.008,z*0.008,3)*9,smoothstep(4,30,sd));
  return 3+smoothstep(0,22,sd)*(30+(fbm(x*0.01,z*0.01,3)*0.5+0.5)*45);   // the Stormhorn's ridge
}
function farColor(x,z,h,out){
  const j=0.9+(noise2(x*0.045+3,z*0.045-8)*0.5+0.5)*0.2, [isl,I]=farIsle(x,z);
  let c;
  if(isl>0) c=h<2.6?FAR_C.beach:I.volcano&&isl>I.r*0.8?FAR_C.lava:I.volcano&&h>40?FAR_C.ash:FAR_C.jungle;
  else {
    const R=farRegion(x,z), k=noise2(x*0.022+7,z*0.022-2)*0.5+0.5;
    if(R==='grey') c=h>115?FAR_C.snow:h>45?FAR_C.rock:FAR_C.grass;
    else if(R==='frost') c=h<34&&z>-560?FAR_C.spruce:k<0.3?FAR_C.ice:FAR_C.frost;
    else if(R==='sun') c=h<3?FAR_C.beach:h>58?FAR_C.mesa:FAR_C.sand;
    else if(R==='amber') c=h<2.6?FAR_C.beach:k<0.4?FAR_C.savanna2:FAR_C.savanna;
    else c=h>62?FAR_C.rock:k<0.35?FAR_C.heather2:FAR_C.heather;
  }
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
  const C=FAR_CELL, X0=HX0-46*27.5, Z0=HZ0-32*27.5, NX=Math.round(104*27.5/C), NZ=Math.round(106*27.5/C), W=NX+1;   // (Z0 stays where it was when the rectangle ended at HZ0: the Hoarfrost Reach is built, its rectangle's cells are skipped below)
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
  const V=FAR_ISLES.find(q=>q.volcano), sp=[], sc=[];
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
