//@ Amber Reach's seasons: Greenfall (wet, green grass, cool sky) and Goldfall (dry, gold grass, heat haze, no rain) in a two-hour cycle; savTint pulls the sky toward the season, savDryAt thins the rain, the terrain is painted again when the season moves
/* Agent map. SAV_SKY.wet (0 Goldfall .. 1 Greenfall) follows savWetAt(seconds): a cycle of SAV_CYCLE_S = 6 game days (6 x 1200 s = two hours), the first half Greenfall, the second Goldfall, with a smooth change of
   about 5 minutes (SAV_BLEND) at each turn. It is read from the wall clock (Date.now), not from the server's day: the server sends only the time of day (0..1, wrapping), no counter of days, and the wall clock
   is the same for every player in solo, shared and server modes, so everyone sees the same season with nothing new synced. The season only changes the look and the weather, never stats or drops.
   SAV_SKY.k (0..1) is how deep in the land the camera is (a 120 m blend over the Ashbed gate, like gloamDepth); SAV_SKY.force (null, or 0..1) pins the season for tests and screenshots.
   - savTint(s,dt): called by updateEnv (time-of-day.js) after weatherTint; steps the season (SAV_SKY.wet, the grass shader's SAV_WET_U) and tints the sky, haze and sun by day: cool and clear in Greenfall,
     a warm gold haze (shorter view) in Goldfall.
   - savDryAt(x,z): 0..1 how dry the air is here: 1 on the Sunscar, 1 - wet in Amber Reach (no rain or lightning flash in Goldfall); weather.js reads it (WX.dry).
   - savSeasonStep(dt): paints the land's terrain tiles again, one tile at a time, within 420 m of the player, when a tile was coloured (B.sw, generation-setup.js) 0.14 or more of a season ago.
   Used by: time-of-day.js, weather.js, terrain-color-savanna.js, plant-models-savanna.js (SAV_WET_U). Test: client-smoke. Names: sav..., SAV_... */
const SAV_CYCLE_S=6*1200, SAV_BLEND=0.02;   // (the change takes 2 x SAV_BLEND of a cycle = 4.8 minutes)
function savWetAt(sec){
  const u=(((sec/SAV_CYCLE_S)+SAV_BLEND)%1+1)%1, w=SAV_BLEND*2, ss=t=>t*t*(3-2*t);
  return u<w?ss(u/w):u<0.5?1:u<0.5+w?1-ss((u-0.5)/w):0;
}
const SAV_SKY={k:0,wet:savWetAt(Date.now()/1000),force:null,warm:new THREE.Color(0xffc878),hazeFog:new THREE.Color(0xe6cc98),hazeHor:new THREE.Color(0xf4d8a0),coolFog:new THREE.Color(0xc4d8da),coolSky:new THREE.Color(0x3a78c8)};
function savDepth(x,z){ const k=smoothstep(0,60,waLandBorderDist(x,z)); return inAmber(x,z)?0.5+0.5*k:0.5*(1-k); }   // 0 beyond the border, 1 deep inside: a 120 m blend
const savDryAt=(x,z)=>inAmber(x,z)?1-SAV_SKY.wet:inSun(x,z)?1:0;
function savTint(s,dt){
  const S=SAV_SKY, want=S.force===null?savWetAt(Date.now()/1000):S.force;
  S.wet+=(want-S.wet)*Math.min(1,(dt||0.016)*0.5); if(Math.abs(want-S.wet)<0.002) S.wet=want;
  SAV_WET_U.value=S.wet;
  savSeasonStep(dt||0.016);
  const wantK=savDepth(camera.position.x,camera.position.z);
  S.k+=(wantK-S.k)*Math.min(1,(dt||0.016)*2.5); if(Math.abs(wantK-S.k)<0.002) S.k=wantK;
  const k=S.k*(1-s.night); if(k<=0.001) return;   // (by day only: the night is the night everywhere)
  const dry=1-S.wet;
  s.fog.lerp(S.hazeFog,0.42*dry*k); s.hor.lerp(S.hazeHor,0.4*dry*k); s.sun.lerp(S.warm,0.3*dry*k); s.far*=1-0.16*dry*k;   // Goldfall: heat haze
  s.fog.lerp(S.coolFog,0.2*S.wet*k); s.sky.lerp(S.coolSky,0.16*S.wet*k);                                                  // Greenfall: a deeper, cleaner sky
}
// the land's terrain tiles painted again when the season has moved: one tile at a time, a slice a frame (terrainTileColors is a generator, it yields every 16 rows)
let savJob=null, savStepT=0;
function savTileHasLand(B){   // does this tile touch Amber Reach? (9 samples over it)
  for(let i=0;i<3;i++) for(let j=0;j<3;j++) if(inAmber(B.x0+(B.x1-B.x0)*(i+0.5)/3,B.z0+(B.z1-B.z0)*(j+0.5)/3)) return true;
  return false;
}
function savSeasonStep(dt){
  if(savJob){ if(savJob.next().done) savJob=null; return; }
  savStepT-=dt; if(savStepT>0||!Stream.terrainDone) return; savStepT=1.5;
  let best=null, bd=420;
  for(const B of TERRAIN_BANDS){
    if(!B.ready||B.busy) continue;
    const d=Math.hypot(Math.max(B.x0-P.x,0,P.x-B.x1),Math.max(B.z0-P.z,0,P.z-B.z1)); if(d>=bd) continue;
    if(B.sav===undefined) B.sav=savTileHasLand(B);
    if(B.sav&&Math.abs((B.sw===undefined?SAV_SKY.wet:B.sw)-SAV_SKY.wet)>=0.14){ bd=d; best=B; }
  }
  if(best){ best.busy=true; savJob=terrainTileColors(best); }
}
