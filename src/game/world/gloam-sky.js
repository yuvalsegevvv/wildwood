//@ The Gloamhorn's permanent dusk: gloamTint(s,dt) pulls the sky, fog and light toward a fixed violet twilight with a low moon, whatever the hour, blended over the border band
/* Agent map: called from updateTimeOfDay (time-of-day.js) after weatherTint; GLOAM_SKY.k (0..1) is how deep in the land the camera is (the music and the ambience read it too).
   The land is gothic and dim: a rim of last light on the western horizon, a low moon, stars (night ~0.85), a short view (far) so the lighthouse beam and the lamps carry.
   Rain and gales are allowed on top (weather.js); no snow falls here (greySnowAmt stays 0 at the plateau's height). Tested by tools/gloamhorn-smoke.js (the grep and the geometry). */
const GLOAM_SKY={k:0,sun:new THREE.Color(0x6a5a9a),sky:new THREE.Color(0x181436),hor:new THREE.Color(0x6a3a78),fog:new THREE.Color(0x2e284a),hs:new THREE.Color(0x5a52a0),hg:new THREE.Color(0x1c1830),cloud:new THREE.Color(0x3c3260)};
var GLOAM_TORCH=null;   // a soft violet-white light that follows the hiker, so the dark stays but what is near you can be seen (not on LOW / LITE)
function gloamDepth(x,z){ const k=smoothstep(0,60,waLandBorderDist(x,z)); return inGloam(x,z)?0.5+0.5*k:0.5*(1-k); }   // 0 in the Greyspine, 1 inside the Gloamhorn: a 120 m blend over the neck
function gloamTint(s,dt){
  const want=gloamDepth(camera.position.x,camera.position.z);
  GLOAM_SKY.k+=(want-GLOAM_SKY.k)*Math.min(1,(dt||0.016)*2.5); if(Math.abs(want-GLOAM_SKY.k)<0.002) GLOAM_SKY.k=want;
  const k=GLOAM_SKY.k; if(k<=0){ if(GLOAM_TORCH) GLOAM_TORCH.intensity=0; return; }
  const G=GLOAM_SKY;
  s.sun.lerp(G.sun,k); s.sky.lerp(G.sky,k); s.hor.lerp(G.hor,k); s.fog.lerp(G.fog,k); s.hs.lerp(G.hs,k); s.hg.lerp(G.hg,k); s.cloud.lerp(G.cloud,k);
  s.sunI=lerp(s.sunI,0.5,k); s.hi=lerp(s.hi,0.58,k); s.night=lerp(s.night,0.8,k); s.far=lerp(s.far,150,k);
  s.elev=lerp(s.elev,26,k); s.azim=lerp(s.azim,150,k); s.lk=lerp(s.lk===undefined?1:s.lk,1,k);
  s.sE=lerp(s.sE===undefined?s.elev:s.sE,-14,k); s.sA=lerp(s.sA===undefined?s.azim:s.sA,250,k);   // the sun sits just under the sea's edge in the west: only a glow
  s.mE=lerp(s.mE===undefined?-90:s.mE,24,k); s.mA=lerp(s.mA||0,150,k);   // the moon, low over the sea to the south-east
  if(k>0.5) s.name='Gloam';
  if(!(LOW||LITE)){
    if(!GLOAM_TORCH){ GLOAM_TORCH=new THREE.PointLight(0xb8a8ff,0,26,1.6); GLOAM_TORCH.name='gloamTorch'; scene.add(GLOAM_TORCH); }
    GLOAM_TORCH.intensity=1.5*k; GLOAM_TORCH.position.set(P.x,P.y+2.6,P.z);
  }
}
