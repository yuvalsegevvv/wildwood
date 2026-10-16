//@ The Sunscar's ground colours (sunColor): red-rock mesas and walls, sand, dune sand, white salt pans, black glass fields, green scrub on the river's banks, the Bowl's rim strata and Glasswell's own floor
/* Agent map: sunColor(x,z,h,g,out) is blended into terrainColor (terrain-color.js) with the weight smoothstep(HX0-12,HX0-72,x), the same ramp as sunHook (shared/sunland.js) lifts the ground with.
   Inside the Bowl's foot the floor is gwGround (game/village/sun-rim.js, the model's own colours: roads, lanes, paving), so the city's floor and the ground under it are one colour; its rim is painted
   in strata like the model's rim (gwRim). Uses the colour weights of shared/sunland.js (sunDuneK, sunPanK, sunGlassK, sunGreenK). Test: client-smoke (it draws the terrain). */
const _suC=new THREE.Color(), _suCol={sand:new THREE.Color(0xcfa56a),sand2:new THREE.Color(0xbd8a52),dune:new THREE.Color(0xe2bf84),pan:new THREE.Color(0xebe4d2),pan2:new THREE.Color(0xcfc6ae),
  glass:new THREE.Color(0x262c3a),glass2:new THREE.Color(0x3d4a60),scrub:new THREE.Color(0x71883f),mud:new THREE.Color(0x5b5640),strata:new THREE.Color(0x9c5a40),road:new THREE.Color(0xd2b784),wall:new THREE.Color(0x8a5a46)};
function sunColor(x,z,h,g,out){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5, steep=smoothstep(0.3,0.85,g);
  out.copy(_suCol.sand).lerp(_suCol.sand2,smoothstep(0.35,0.8,n1)*0.55);
  { const dk=sunDuneK(x,z); if(dk>0) out.lerp(_suCol.dune,dk*(0.55+0.3*Math.sin((x*0.6+z*0.8)*0.35+n1*4))); }
  out.lerp(COL.redRock,steep*0.85);
  out.lerp(_suCol.wall,smoothstep(70,110,h)*0.5*(1-steep*0.5));   // the north wall's dark red top
  { const pk=sunPanK(x,z); if(pk>0){ out.lerp(_suC.copy(_suCol.pan).lerp(_suCol.pan2,smoothstep(0.55,0.72,Math.abs(noise2(x*0.09,z*0.09)))*0.7),pk*0.96); } }   // salt pans with a net of cracks
  { const gk=sunGlassK(x,z); if(gk>0){ out.lerp(_suC.copy(_suCol.glass).lerp(_suCol.glass2,smoothstep(0.5,0.8,h3(Math.floor(x*0.8),0,Math.floor(z*0.8)))*0.8),gk*0.95); } }   // black glass sand with a glint
  { const gr=sunGreenK(x,z); if(gr>0) out.lerp(_suCol.scrub,gr*0.6*(1-steep)); }
  { const w=sunWaterSurf(x,z); if(w!==null&&h<w+0.5) out.lerp(_suCol.mud,smoothstep(w+0.5,w-0.6,h)*0.85); }
  { const ra=roadAmt(x,z); if(ra>0) out.lerp(_suCol.road,ra*0.85); }
  { const dp=Math.abs(x-sunPassX(z)); if(z<-200&&z>-580&&dp<SUN_PASS.w+4) out.lerp(COL.gravel,smoothstep(SUN_PASS.w+4,SUN_PASS.w-2,dp)*0.5); }
  { const cx=x-SUN_CITY.x, cz=z-SUN_CITY.z, r=Math.hypot(cx,cz);
    if(r<GLASSWELL.foot+30){   // the Bowl: the rim in strata, the floor as the model paints it
      const a=Math.atan2(cx,cz), foot=gwRimR(a,'foot'), y=h-SUN_CITY.h;
      out.lerp(_suC.copy(_suCol.strata).multiplyScalar(0.88+0.07*Math.sin(y*1.55+noise2(x*0.04,z*0.04)*4)+0.07*n2),smoothstep(0.2,0.55,g)*smoothstep(foot+34,foot+4,r)*0.9);
      if(r<foot+2){ gwGround(cx,cz,_suC); out.lerp(_suC,smoothstep(foot+2,foot-2,r)); } } }
  return out;
}
