//@ Amber Reach's plants: the flat-topped acacia (G.trees.savacacia), the giant baobab (G.trees.baobab) and the tall savanna grass (G.savGrass, a material that turns gold or green with the season)
/* Agent map: makeSavAcacia(), makeBaobab() return {trunk, leaves} like plant-models-sun.js (trunk painted, leaves white-shaded and tinted per instance from PAL.savacacia / PAL.baobab; each draws from its own
   mrng(seed), never the global rand). buildSavGrass() returns the tall tufts (three levels on the desktop, one on phones) and savGrassMat() their material: makeGrassTuft's blades painted all dry-gold, and
   a fragment shift toward fresh green by SAV_WET_U (uniform, set every frame by savTint, world/savanna-sky.js), so one set of instanced tufts follows Greenfall and Goldfall without being rebuilt.
   Placement is the amber branch of genChunk (generation-chunks.js); the kinds are registered in buildGeometries (generation-setup.js: PAL, RAD, G.trees, G.savGrass).
   Used by: generation-setup.js, generation-chunks.js. Test: client-smoke (it builds the geometries). Names: sav..., SAV_... */
function makeSavAcacia(){   // a bare, slightly leaning trunk that forks into three limbs; each carries a flat layered disc of leaves, the middle one the highest
  const Q=mrng(8201), qr=Q.R, tp=[], lp=[], H0=qr(2.1,2.6), C=new THREE.Vector3(0,H0+2.4,0);
  tp.push(paint(cyl(0.15,0.34,H0,6).translate(0,H0/2,0).rotateZ(-0.06),bark(0x6a5a40)));
  const ends=[[0,H0]];
  for(let i=0;i<3;i++){   // limbs: out and up from the fork
    const az=i/3*TAU+qr(-0.3,0.3), tilt=qr(0.55,0.8), L=qr(2.0,2.6), g=cyl(0.06,0.15,L,5).translate(0,L/2,0);
    g.rotateZ(-tilt); g.rotateY(az); g.translate(0,H0*0.96,0); tp.push(paint(g,bark(0x5e4e38)));
    ends.push([Math.sin(tilt)*L*Math.cos(az),H0*0.96+Math.cos(tilt)*L,-Math.sin(tilt)*L*Math.sin(az)]);
  }
  const top=ends[1][1];
  lp.push(blob(qr(2.6,3.0),0,top+0.35,0,0.17,C,1));   // the crown's heart
  for(let i=1;i<4;i++){ const e=ends[i]; lp.push(blob(qr(1.7,2.3),e[0],e[1]+0.25,e[2],0.2,C,1)); }
  const lo=H0+0.6, hi=top+1.2;
  return {trunk:merge(tp),leaves:merge(lp.map(g=>paint(g,shade(lo,hi))))};
}
function makeBaobab(){   // the bottle trunk (a lathe, grooved), nine stubby limbs that reach up and out like roots, a thin crown of leaf clumps at their ends
  const Q=mrng(8202), qr=Q.R, tp=[], lp=[];
  const prof=[[2.5,0],[2.7,0.6],[2.75,2.4],[2.4,4.6],[1.85,6.4],[1.4,7.6],[1.2,8.3],[0,8.5]].map(p=>new THREE.Vector2(p[0],p[1]));
  tp.push(paint(new THREE.LatheGeometry(prof,14),(x,y,z,nx,ny,nz,c)=>{ const a=Math.atan2(z,x); c.set(0x8a7a68).multiplyScalar(0.72+0.26*Math.abs(Math.sin(a*7+y*0.4))+0.1*h3(x,y,z)); if(y>6.8) c.multiplyScalar(0.92); }));
  const C=new THREE.Vector3(0,10.5,0), tips=[];
  for(let i=0;i<9;i++){
    const az=i/9*TAU+qr(-0.2,0.2), tilt=qr(0.75,1.1), L=qr(2.6,3.6), y0=qr(7.4,8.2), g=cyl(0.2,0.5,L,5).translate(0,L/2,0);
    g.rotateZ(-tilt); g.rotateY(az); g.translate(0,y0,0); tp.push(paint(g,bark(0x7a6a58)));
    const ex=Math.sin(tilt)*L*Math.cos(az), ey=y0+Math.cos(tilt)*L, ez=-Math.sin(tilt)*L*Math.sin(az);
    tips.push([ex,ey,ez]); lp.push(blob(qr(1.0,1.5),ex,ey+0.3,ez,0.7,C,1));
  }
  lp.push(blob(1.5,0,9.6,0,0.6,C,1));
  return {trunk:merge(tp),leaves:merge(lp.map(g=>paint(g,shade(7.5,12.5))))};
}
// the tall tufts: all blades gold (dry:1), so savGrassMat's shift is the only place green comes from
function buildSavGrass(){
  const T=(n,s,r,w,seed)=>makeGrassTuft({blades:n,segs:s,radius:r,h:[0.85,1.7],w:[w,w*1.7],bend:[0.2,1.0],dry:1},seed);
  if(VD>=2) return [T(18,5,0.3,0.02,81),T(10,3,0.3,0.034,82),T(7,2,0.22,0.055,83)];
  return [T(8,2,0.24,0.04,81)];
}
const SAV_WET_U={value:0.5};   // 0 Goldfall .. 1 Greenfall: the grass shader's season (world/savanna-sky.js sets it every frame)
function savGrassMat(){   // plantMat's wind sway, then a shift of the gold toward fresh green by SAV_WET_U (the gold keeps its light and shade)
  const m=plantMat({wind:0.24,double:true}), base=m.onBeforeCompile;
  m.onBeforeCompile=sh=>{ base(sh); sh.uniforms.uSavWet=SAV_WET_U;
    sh.fragmentShader='uniform float uSavWet;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      { float sl=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11)); vec3 sg=vec3(sl*0.58,sl*1.18,sl*0.42); diffuseColor.rgb=mix(diffuseColor.rgb,sg,uSavWet*smoothstep(0.02,0.1,sl)); }`); };
  m.customProgramCacheKey=()=>'plant_savgrass';
  return m;
}
const matSavGrass=savGrassMat();
function savAddGrass(items){   // the tall tufts of a chunk (generation-chunks.js), with the same levels of detail as addGrass
  const T=G.savGrass, o={receive:true,maxDist:115,hgt:2.1,rad:0.8};
  if(T.length<3) addInstanced(T[0],matSavGrass,items,o);
  else addInstanced(T[0],matSavGrass,items,Object.assign(o,{lods:[{geo:T[1],from:30,frac:0.85},{geo:T[2],from:64,frac:0.6}]}));
}
