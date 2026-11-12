//@ Plant materials (plantMat: wind sway, leaf flutter, sunlight through tree leaves) and shared materials
/* ---------- materials ---------- */
/* o.wind: sway (metres per metre of height); o.double: both sides lit alike; o.leaf: tree foliage. Leaves let the sun through: the side away from the sun
   glows a little and more when you look toward the sun (added to the unshadowed light: it passed through the crown); o.flutter (metres): each leaf
   trembles along its normal on top of the whole crown's sway. The key names every option, so each combination compiles its own program. */
function plantMat(o){
  const m = new THREE.MeshLambertMaterial({vertexColors:true, side:o.double?THREE.DoubleSide:THREE.FrontSide});
  const s = o.wind||0, lf=o.leaf||0, fl=o.flutter||0, key='plant_'+s+(o.double?'_d':'')+(lf?'_l'+lf:'')+(fl?'_f'+fl:'')+(o.snow?'_snow':'');
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = timeU;
    if(s>0){
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = instanceMatrix[3].xyz;
        #endif
        float wh = max(transformed.y, 0.0);
        float ph = uTime*1.6 + ip.x*0.08 + ip.z*0.06;
        float gust = 0.55 + 0.45*sin(uTime*0.35 + ip.x*0.012 + ip.z*0.009);
        transformed.x += (sin(ph) + 0.35*sin(ph*2.7)) * wh * ${s.toFixed(4)} * gust;
        transformed.z += cos(ph*0.83) * wh * ${(s*0.6).toFixed(4)} * gust;`+(fl?`
        transformed += objectNormal * sin(uTime*4.3 + dot(position, vec3(3.1,2.3,2.7)) + ip.x*0.7 + ip.z*0.5) * ${fl.toFixed(4)} * gust * min(wh*0.3, 1.0);`:''));
    }
    if(lf) sh.vertexShader = sh.vertexShader.replace('#include <lights_lambert_vertex>', `#include <lights_lambert_vertex>
      #if NUM_DIR_LIGHTS > 0
      { vec3 ld = directionalLights[0].direction;
        float bk = saturate(-dot(geometry.normal, ld)), vw = saturate(dot(normalize(mvPosition.xyz), ld));
        vIndirectFront += directionalLights[0].color * PI * (bk*${(0.14*lf).toFixed(3)} + vw*vw*vw*${(0.3*lf).toFixed(3)}); }
      #endif`);
    if(o.snow) sh.vertexShader = sh.vertexShader.replace('#include <lights_lambert_vertex>', `#include <lights_lambert_vertex>
      vColor.rgb = mix(vColor.rgb, vec3(0.94,0.97,1.0), smoothstep(0.3,0.62,objectNormal.y)*0.93);   // snow lies on every upward-facing surface (the boughs' tops, the crown's upper side)`);
    if(o.double) sh.fragmentShader = sh.fragmentShader.replace(/gl_FrontFacing/g,'true');
  };
  m.customProgramCacheKey = () => key;
  return m;
}
/* grassMat: the tufts of grass-models.js (they carry the attribute gk = kind, t). Everything is per vertex, from the tuft's world position (no JS per frame):
   - colour: the root keeps the instance colour (the ground's, genChunk) and the tip grows fresher; low-frequency value noise over the meadow makes
     patches (~30 m) of cool blue-green and of yellowing grass whose tips dry first, and darker / lighter ones (~8 m); dry blades and seed stalks are straw
   - wind: one world-space travelling wave train for the whole field under gusts that travel with it, strongest at the tip, so the meadow sways
     together; a bent tip sinks so the blade keeps its length, and catches the light (the waves show as a sheen rolling over the meadow)
   - back-light: tips glow when you look toward the sun, like the tree leaves
   - distance: the tuft's colour fades into the ground's from 55 m and it shrinks away before 100 m (addGrass's maxDist); lod: the tufts whose hash
     says the next level leaves them out (grassSort, grass-models.js) shrink away first (by 24 m and 56 m: the levels switch at 30 / 62 m, less the
     6 m hysteresis), so the thinning never pops. Seed stalks show on 30-75 % of the tufts (more in the dry patches).
   lod: 0 on phones (one tuft, no levels). LITE uses the plain plantMat and the old flat tuft. */
const GRASS_VS_HEAD=`uniform float uTime;
attribute vec2 gk;
float gh12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float gvn(vec2 p){ vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f); return mix(mix(gh12(i),gh12(i+vec2(1.0,0.0)),u.x),mix(gh12(i+vec2(0.0,1.0)),gh12(i+vec2(1.0,1.0)),u.x),u.y); }
`;
function grassMat(lod){
  const m=new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide});
  m.onBeforeCompile=sh=>{
    sh.uniforms.uTime=timeU;
    sh.vertexShader=GRASS_VS_HEAD+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float gsy=1.0; vec3 ip=vec3(0.0); vec3 gic=vec3(1.0); vec3 gc0=vec3(1.0,0.0,0.0), gc2=vec3(0.0,0.0,1.0);
      #ifdef USE_INSTANCING
        gsy=length(instanceMatrix[1].xyz); ip=instanceMatrix[3].xyz; gc0=instanceMatrix[0].xyz; gc2=instanceMatrix[2].xyz;
      #endif
      #ifdef USE_INSTANCING_COLOR
        gic=instanceColor;
      #endif
      float gt=gk.y, gkind=floor(gk.x+0.01), grnd=fract(gk.x)/0.9, ghh=gh12(floor(ip.xz*2.0)), gd=length(ip.xz-cameraPosition.xz);
      float gn1=gvn(ip.xz*0.034+vec2(3.7,9.1)), gn2=gvn(ip.xz*0.12+vec2(17.0,5.0));
      float gdry=smoothstep(0.52,0.86,gn1), gcool=1.0-smoothstep(0.12,0.42,gn1);   // (GLSL smoothstep needs edge0 < edge1: reversed it is undefined, NaN on some GPUs)
      float gkeep=1.0-smoothstep(80.0,99.0,gd);`+(lod?`
      gkeep*=(1.0-step(0.83,ghh)*smoothstep(17.0,24.0,gd))*(1.0-step(0.58,ghh)*smoothstep(46.0,56.0,gd));`:'')+`
      bool gseed=gkind>1.5&&gkind<2.5, glawn=gkind>2.5;
      if(gseed && fract(ghh*7.31)>0.3+0.45*gdry) gkeep=0.0;
      // turf zones: a slow world noise makes some of the meadow short, open turf (tufts at 0.42 height, no seed stalks) and the rest tall meadow
      float gturf=1.0-smoothstep(0.38,0.6,gvn(ip.xz*0.045+vec2(41.0,7.0)));
      if(gseed && gturf>0.5) gkeep=0.0;
      if(glawn){ transformed.y*=(0.9+0.5*ghh)/gsy; gkeep*=1.0-smoothstep(17.0,26.0,gd); }   // the lawn blades ignore the tuft's height (meadow tufts must not grow long lawn) and fade out before the 30 m level switch
      else { transformed.y*=mix(1.0,0.42,gturf); transformed.xz*=mix(1.0,1.25,gturf); }
      // wind: ONE world-space wave train for the whole field (crests 28 m apart, ~11 m/s along gw) under a gust envelope that travels with it
      // (a long sine along the wind, its fronts bent by a slow noise drifting at the same speed): every tuft leans downwind by the gust and sways
      // with the wave; a blade's own phase differs only a little (its place in the tuft, a small per-tuft hash). gw in the tuft's own frame: gwl.
      vec3 gw=vec3(0.8,0.0,0.6); vec2 gwl=vec2(dot(gc0,gw)/dot(gc0,gc0), dot(gc2,gw)/dot(gc2,gc2));
      float galong=dot(ip.xz,gw.xz);
      float ggust=smoothstep(0.15,0.95,0.6*(0.5+0.5*sin(galong*0.045-uTime*0.495))+0.4*gvn((ip.xz-gw.xz*uTime*11.0)*0.012));
      float gsway=sin(galong*0.22-uTime*2.42+(ghh-0.5)*0.35+grnd*1.2+dot(position.xz,gw.xz)*0.8);
      float gpush=0.15+0.55*ggust+(0.12+0.38*ggust)*gsway;
      float gwh=max(transformed.y,0.0);
      float gbend=gpush*gwh*gwh*0.6;
      transformed.xz+=gwl*gbend;
      transformed.y-=min(gbend*gbend/(2.0*max(gwh,0.05)),gwh*0.45);
      if(glawn) transformed.xz+=gwl*gwh*(0.5*ggust+0.35*gsway);   // short blades: the bend above is height squared, so a linear shimmer
      transformed*=gkeep;
      // colour: the meadow's patches, the tip's freshness, straw, the sheen of the bent blades, the far fade into the ground
      vec3 gpatch=mix(mix(vec3(1.0),vec3(0.78,0.96,1.14),gcool),vec3(1.2,1.06,0.62),gdry)*(0.86+0.28*gn2)*vec3(1.0+(ghh-0.5)*0.12,1.0,1.0-(ghh-0.5)*0.14);
      vColor*=mix(vec3(1.0),gpatch,0.45+0.55*gt);
      vec3 gtint=vec3(0.76,0.93,0.64);   // the tuft's colour is the ground's (genChunk), so tufts melted into it and the meadow looked bare: stand them out, darker and greener than the ground they stand on (the far fade below returns to the ground's colour)
      vec3 gtl=mix(vec3(1.0),gtint,smoothstep(0.0,0.3,gt));   // the lowest third is the ground's own colour: the tuft grows out of it
      vColor*=gtl;
      if(gkind<0.5||glawn){ if(grnd>0.92) vColor*=vec3(0.92,0.86,0.7); else if(grnd<0.06) vColor*=vec3(0.9,1.0,1.1); }   // a few olive and blue-green blades
      vColor=mix(vColor,vColor*vec3(1.22,1.06,0.6),gdry*gt*gt*0.55);
      if(gkind>0.5&&!glawn){ vec3 straw=mix(vec3(0.6,0.56,0.33),vec3(0.74,0.64,0.38),gdry)*(0.9+0.2*gn2); if(gseed) straw*=vec3(0.86,0.8,0.8); vColor=color*mix(gic*0.9,straw,0.35+0.6*gt)*gtl; }
      vColor*=1.0+0.3*(gpush-0.45)*gt;
      float gfar=smoothstep(55.0,97.0,gd);
      vColor=mix(vColor,gic,gfar);
      float gglow=gt*gt*(1.0-gfar);`)
      .replace('#include <lights_lambert_vertex>',`#include <lights_lambert_vertex>
      #if NUM_DIR_LIGHTS > 0
      { vec3 ld=directionalLights[0].direction; float vw=saturate(dot(normalize(mvPosition.xyz),ld));
        vIndirectFront+=directionalLights[0].color*PI*(0.05+vw*vw*vw*0.4)*gglow; }
      #endif`);
    sh.fragmentShader=sh.fragmentShader.replace(/gl_FrontFacing/g,'true');
  };
  m.customProgramCacheKey=()=>'grass_'+lod;
  return m;
}
const matBark = new THREE.MeshLambertMaterial({vertexColors:true});
const matRock = new THREE.MeshLambertMaterial({vertexColors:true});
const matConifer = plantMat({wind:0.011, leaf:1});
const matConiferD = plantMat({wind:0.011, double:true, leaf:1, flutter:0.02});   // the desktop's bough fronds are open polygons
const matBroad = plantMat({wind:0.017, leaf:1});
const matBroadD = plantMat({wind:0.017, double:true, leaf:1, flutter:0.035});   // the desktop's leaf clusters are open polygons, seen from both sides
// the snowy zones' trees (frost spruce, dwarf birch, krummholz): the same shading with snow on the upward faces
const matConiferSnow = plantMat({wind:0.011, leaf:1, snow:1});
const matConiferDSnow = plantMat({wind:0.011, double:true, leaf:1, flutter:0.02, snow:1});
const matBroadSnow = plantMat({wind:0.017, leaf:1, snow:1});
const matBroadDSnow = plantMat({wind:0.017, double:true, leaf:1, flutter:0.035, snow:1});
const matBush = plantMat({wind:0.03});
const matBushD = plantMat({wind:0.03, double:true});
const matGrass = LITE ? plantMat({wind:0.24, double:true}) : grassMat(LOW?0:1);   // (light mode: the old flat tuft, which has no gk attribute)
const matFern = plantMat({wind:0.1, double:true});
const matFlower = plantMat({wind:0.22, double:true});
const matReed = plantMat({wind:0.09, double:true});
const matFlat = plantMat({double:true});
[matBark,matRock,matConifer,matConiferD,matBroad,matBroadD,matBush,matBushD].forEach(cfHook);   // trees, bushes and rocks go see-through between the camera and you (engine/cam-fade.js)

