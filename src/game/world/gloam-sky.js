//@ The Gloamhorn's permanent dusk: gloamTint(s,dt) pulls the sky, fog and light toward a fixed violet twilight with a low moon, whatever the hour, blended over the border band
/* Agent map: called from updateTimeOfDay (time-of-day.js) after weatherTint; GLOAM_SKY.k (0..1) is how deep in the land the camera is (the music and the ambience read it too).
   The land is gothic and dim: a rim of last light on the western horizon, a low moon, stars (night ~0.85), a short view (far) so the lighthouse beam and the lamps carry.
   Rain and gales are allowed on top (weather.js); no snow falls here (greySnowAmt stays 0 at the plateau's height). Tested by tools/gloamhorn-smoke.js (the grep and the geometry). */
const GLOAM_SKY={k:0,sun:new THREE.Color(0x6a5a9a),sky:new THREE.Color(0x0c0a1e),hor:new THREE.Color(0x4a2a58),fog:new THREE.Color(0x1c1830),hs:new THREE.Color(0x3a3470),hg:new THREE.Color(0x0c0a14),cloud:new THREE.Color(0x2a2244)};
function gloamDepth(x,z){ return z<borderZ(x)?smoothstep(GW0+70,GW0-50,x):0; }   // 0 in the Greyspine, 1 inside the Gloamhorn: a 120 m blend over the neck
function gloamTint(s,dt){
  const want=gloamDepth(camera.position.x,camera.position.z);
  GLOAM_SKY.k+=(want-GLOAM_SKY.k)*Math.min(1,(dt||0.016)*2.5); if(Math.abs(want-GLOAM_SKY.k)<0.002) GLOAM_SKY.k=want;
  const k=GLOAM_SKY.k; if(k<=0) return;
  const G=GLOAM_SKY;
  s.sun.lerp(G.sun,k); s.sky.lerp(G.sky,k); s.hor.lerp(G.hor,k); s.fog.lerp(G.fog,k); s.hs.lerp(G.hs,k); s.hg.lerp(G.hg,k); s.cloud.lerp(G.cloud,k);
  s.sunI=lerp(s.sunI,0.3,k); s.hi=lerp(s.hi,0.34,k); s.night=lerp(s.night,0.86,k); s.far=lerp(s.far,135,k);
  s.elev=lerp(s.elev,26,k); s.azim=lerp(s.azim,150,k); s.lk=lerp(s.lk===undefined?1:s.lk,1,k);
  s.sE=lerp(s.sE===undefined?s.elev:s.sE,-14,k); s.sA=lerp(s.sA===undefined?s.azim:s.sA,250,k);   // the sun sits just under the sea's edge in the west: only a glow
  s.mE=lerp(s.mE===undefined?-90:s.mE,24,k); s.mA=lerp(s.mA||0,150,k);   // the moon, low over the sea to the south-east
  if(k>0.5) s.name='Gloam';
}
