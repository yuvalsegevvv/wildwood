//@ See-through blockers: trees, rocks, buildings and props between the third-person camera and the hiker are drawn with holes (screen-door fade)
/* Agent map. cfHook(mat): opts a material in (wraps its onBeforeCompile, adds '_cf' to its program key). cfUpdate(on,cx,cy,cz,hx,hy,hz): each frame
   from updateCamera (player/movement.js) with the camera and the hiker's head. Hooked: the trees' / bushes' / rocks' materials (engine/materials.js),
   villageMat and windowMat (village/buildings.js: every land's houses), the zone props' rock and flat (world/zone-props.js). Test: client-smoke.
   Why a screen door and not opacity: these meshes are opaque, merged and instanced; true transparency would need sorting and a second pass. A fragment
   near the line from the camera to the hiker's head is discarded on a dither pattern, so the blocker turns half see-through with no sorting, no
   extra draw and no JS per object; the shadow pass uses its own depth material, so shadows stay whole. Numbers: CF_R (m) is the radius of the
   see-through tube round that line (narrower right at the lens), CF_K the share of the pixels dropped at its core. Off in first person and the editor. */
const CF_R=1.25, CF_K=0.7;
const CF_U={uCfA:{value:new THREE.Vector3()}, uCfB:{value:new THREE.Vector3()}, uCfOn:{value:0}};
function cfUpdate(on,cx,cy,cz,hx,hy,hz){ CF_U.uCfOn.value=on?1:0; if(on){ CF_U.uCfA.value.set(cx,cy,cz); CF_U.uCfB.value.set(hx,hy,hz); } }
function cfHook(m){
  const base=m.onBeforeCompile, key=m.customProgramCacheKey;
  m.onBeforeCompile=function(sh,r){
    if(base&&base!==THREE.Material.prototype.onBeforeCompile) base.call(this,sh,r);
    sh.uniforms.uCfA=CF_U.uCfA; sh.uniforms.uCfB=CF_U.uCfB; sh.uniforms.uCfOn=CF_U.uCfOn;
    sh.vertexShader='varying vec3 vCfW;\n'+sh.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      { vec4 cfw=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          cfw=instanceMatrix*cfw;
        #endif
        vCfW=(modelMatrix*cfw).xyz; }`);
    sh.fragmentShader='varying vec3 vCfW;\nuniform vec3 uCfA;\nuniform vec3 uCfB;\nuniform float uCfOn;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
      if(uCfOn>0.5){
        vec3 cfab=uCfB-uCfA; float cft=dot(vCfW-uCfA,cfab)/max(dot(cfab,cfab),1e-4);
        if(cft>-0.05 && cft<0.95){
          float cfd=length(vCfW-(uCfA+cfab*clamp(cft,0.0,1.0))), cfr=${CF_R.toFixed(2)}*mix(0.45,1.0,smoothstep(0.0,0.3,cft));
          float cff=(1.0-smoothstep(cfr*0.6,cfr,cfd))*(1.0-smoothstep(0.82,0.95,cft))*${CF_K.toFixed(2)};
          if(cff>0.0 && fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))<cff) discard;
        }
      }`);
  };
  m.customProgramCacheKey=function(){ return (key?key.call(this):'')+'_cf'; };
  return m;
}
