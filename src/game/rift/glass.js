//@ The rift's glass monsters on the client: the glass material (see-through, the kind's tint mixed into its colours, a bright rim in the rift's blue / purple / pink, a soft glow) and the shatter when one dies
/* agent map
   exports: riftGlassMat(d) (combat/monsters.js addMonView: a def with pal.glass gets this instead of monMat), riftShatter(m) (combat/attacks.js onMonKill: shards and a chime instead of dust and gore)
   test: tools/client-smoke.js (the rift case), tools/rift-smoke.js (the defs carry the flag)
   The material is a Phong one with the monster's vertex colours, so monMat's contract holds (emissive + userData.glow: updateMonsters flashes it on a hit). onBeforeCompile mixes the kind's tint
   (pal.tint) into the colours and adds a fresnel rim, brighter and more opaque at the edges, so the body reads as glass from any side. In LOW mode it is opaque (no sorting cost on a phone):
   the same tint and rim, no transparency. Every glass material compiles to one program (the same code; three.js keys it by onBeforeCompile's text). */
const RIFT_RIM=[new THREE.Color(0x7fb0ff),new THREE.Color(0xc290ff),new THREE.Color(0xff9ad6)];
function riftGlassMat(d){
  const tint=new THREE.Color(d.pal.tint||0xc8b8ff), glow=new THREE.Color(d.glow||0).lerp(tint,0.18), rim=RIFT_RIM[(d.id.length+d.id.charCodeAt(4))%3];
  const m=new THREE.MeshPhongMaterial({vertexColors:true,emissive:glow,shininess:90,specular:0xffffff,transparent:!LOW,opacity:LOW?1:0.62});
  m.userData.glow=glow.clone();
  m.onBeforeCompile=sh=>{
    sh.uniforms.uTint={value:tint}; sh.uniforms.uRim={value:rim};
    sh.fragmentShader='uniform vec3 uTint; uniform vec3 uRim;\n'+sh.fragmentShader
      .replace('#include <color_fragment>','#include <color_fragment>\n  diffuseColor.rgb=mix(diffuseColor.rgb,uTint,0.72);')
      .replace('#include <dithering_fragment>','float rf=pow(1.0-abs(dot(normalize(vNormal),normalize(vViewPosition))),2.2);\n  gl_FragColor.rgb+=uRim*rf*1.1+uTint*0.08;\n  gl_FragColor.a=min(1.0,gl_FragColor.a+rf*0.45);\n#include <dithering_fragment>');
  };
  return m;
}
// a glass monster died: a spray of glinting shards in its tint and the rift's colours, a bright flash, a glass chime
function riftShatter(m){
  const c=monCenter(m), tint=m.T.pal.tint||0xc8b8ff, s=m.T.scale*m.s;
  fxpFlare(c.x,c.y,c.z,tint,1.4*s,0.25);
  fxpSparks(c.x,c.y,c.z,tint,22,6*s,{up:2,size:0.26*s,life:0.9,g:12,drag:1});
  fxpSparks(c.x,c.y,c.z,RIFT_RIM[m.id%3].getHex(),12,4*s,{up:1.5,size:0.18*s,life:0.7,g:10});
  if(SND.ready) riftChime(spatial(c.x,c.z,4,40));
}
// a short glass chime: three high partials, quickly gone (audio/engine.js tone)
function riftChime(at){
  if(!at) return; const f0=AR(1800,2600);
  for(const k of [1,2.76,5.4]) tone({freq:f0*k,freq2:f0*k*0.98,dur:0.45/k+0.12,vol:0.035*at.gain/k,pan:at.pan,verb:true});
}
