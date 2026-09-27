//@ Plant materials with wind sway (plantMat) and shared materials
/* ---------- materials ---------- */
function plantMat(o){
  const m = new THREE.MeshLambertMaterial({vertexColors:true, side:o.double?THREE.DoubleSide:THREE.FrontSide});
  const s = o.wind||0, key='plant_'+s+(o.double?'_d':'');
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
        transformed.z += cos(ph*0.83) * wh * ${(s*0.6).toFixed(4)} * gust;`);
    }
    if(o.double) sh.fragmentShader = sh.fragmentShader.replace(/gl_FrontFacing/g,'true');
  };
  m.customProgramCacheKey = () => key;
  return m;
}
const matBark = new THREE.MeshLambertMaterial({vertexColors:true});
const matRock = new THREE.MeshLambertMaterial({vertexColors:true});
const matConifer = plantMat({wind:0.011});
const matBroad = plantMat({wind:0.017});
const matBush = plantMat({wind:0.03});
const matGrass = plantMat({wind:0.24, double:true});
const matFern = plantMat({wind:0.1, double:true});
const matFlower = plantMat({wind:0.22, double:true});
const matReed = plantMat({wind:0.09, double:true});
const matFlat = plantMat({double:true});

