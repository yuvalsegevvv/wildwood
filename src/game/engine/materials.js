//@ Plant materials (plantMat: wind sway, leaf flutter, sunlight through tree leaves) and shared materials
/* ---------- materials ---------- */
/* o.wind: sway (metres per metre of height); o.double: both sides lit alike; o.leaf: tree foliage. Leaves let the sun through: the side away from the sun
   glows a little and more when you look toward the sun (added to the unshadowed light: it passed through the crown); o.flutter (metres): each leaf
   trembles along its normal on top of the whole crown's sway. The key names every option, so each combination compiles its own program. */
function plantMat(o){
  const m = new THREE.MeshLambertMaterial({vertexColors:true, side:o.double?THREE.DoubleSide:THREE.FrontSide});
  const s = o.wind||0, lf=o.leaf||0, fl=o.flutter||0, key='plant_'+s+(o.double?'_d':'')+(lf?'_l'+lf:'')+(fl?'_f'+fl:'');
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
    if(o.double) sh.fragmentShader = sh.fragmentShader.replace(/gl_FrontFacing/g,'true');
  };
  m.customProgramCacheKey = () => key;
  return m;
}
const matBark = new THREE.MeshLambertMaterial({vertexColors:true});
const matRock = new THREE.MeshLambertMaterial({vertexColors:true});
const matConifer = plantMat({wind:0.011, leaf:1});
const matConiferD = plantMat({wind:0.011, double:true, leaf:1, flutter:0.02});   // the desktop's bough fronds are open polygons
const matBroad = plantMat({wind:0.017, leaf:1});
const matBroadD = plantMat({wind:0.017, double:true, leaf:1, flutter:0.035});   // the desktop's leaf clusters are open polygons, seen from both sides
const matBush = plantMat({wind:0.03});
const matBushD = plantMat({wind:0.03, double:true});
const matGrass = plantMat({wind:0.24, double:true});
const matFern = plantMat({wind:0.1, double:true});
const matFlower = plantMat({wind:0.22, double:true});
const matReed = plantMat({wind:0.09, double:true});
const matFlat = plantMat({double:true});

