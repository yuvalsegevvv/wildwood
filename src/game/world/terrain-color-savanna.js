//@ Amber Reach's ground colours (savColor): grass that is gold in Goldfall and green in Greenfall, ash on the Burnt Plain, red sandstone on the slopes, mud at the pools, trodden earth in Tallgrass
/* Agent map: savColor(x,z,h,g,out) is chosen by terrainColorBase / landColor (terrain-color.js, land id 6) and the Sunscar's neighbour blend (20 m either side of the border) works as for the other lands. The
   season is SAV_SKY.wet (world/savanna-sky.js, 0 Goldfall .. 1 Greenfall): the colours are baked per terrain tile, so savSeasonStep (savanna-sky.js) paints the tiles of the land again when the season has moved
   0.14 since they were coloured. The zones' own tints (white gravel in the Ashbed, clay in the Cathedrals, ash, red terraces: zpTheme a37..a45, zone-props.js) are laid over this by terrainColor.
   savBurnK(x,z) (0..1) is the Burnt Plain's ash: the grass props and tufts darken with it (SAV_ASH, generation-chunks.js). Reads the atlas's water distance (waWaterDist) and the roads / village helpers like the other lands.
   Used by: terrain-color.js, generation-chunks.js. Test: client-smoke (it draws the terrain), tools/zoneprops-smoke.js. Names: sav..., _sav..., SAV_... */
const SAV_ASH=new THREE.Color(0x2c2623);
const _savC={gold:new THREE.Color(0xcaa84c),straw:new THREE.Color(0xb48e3c),green:new THREE.Color(0x5f9a34),green2:new THREE.Color(0x7aa83c),bare:new THREE.Color(0xa87a48),
  rock:new THREE.Color(0xa05a3c),rockHi:new THREE.Color(0xc08a5c),ash:new THREE.Color(0x3a3330),shoot:new THREE.Color(0x6fa43c),slab:new THREE.Color(0xdcc6a2),scorch:new THREE.Color(0x3a322e)};
const _savG=new THREE.Color(), _savR=new THREE.Color();
// the Burnt Plain's ash (0..1): a blotchy disc about the zone's centre, strongest inside half its radius
function savBurnK(x,z){
  const Z=SAV_ZONE_OF[42], d=Math.hypot(x-Z.x,z-Z.z)+noise2(x*0.03+4,z*0.03-9)*50;
  if(d>Z.R*1.05) return 0;
  return (1-smoothstep(Z.R*0.5,Z.R*0.98,d))*(0.45+0.55*smoothstep(0.25,0.6,noise2(x*0.045-11,z*0.045+3)*0.5+0.5));
}
function savColor(x,z,h,g,out){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5, n3=noise2(x*0.05-20,z*0.05+7)*0.5+0.5, wet=SAV_SKY.wet, steep=smoothstep(0.42,0.95,g);
  out.copy(_savC.gold).lerp(_savC.straw,smoothstep(0.4,0.8,n1)*0.7);
  _savG.copy(_savC.green).lerp(_savC.green2,n1);
  out.lerp(_savG,wet*(0.8+0.2*n3));                                                            // Greenfall: fresh grass to the horizon
  { const wd=waWaterDist(x,z); if(wd<70) out.lerp(_savG,(1-smoothstep(6,70,wd))*0.6*(1-wet)); }   // damp ground by the water stays green in the dry
  out.lerp(_savC.bare,smoothstep(0.7,0.92,n2)*0.45);                                           // bare red earth in patches
  { const b=savBurnK(x,z); if(b>0){ out.lerp(_savC.ash,b*0.92); out.lerp(_savC.shoot,smoothstep(0.78,0.95,n2)*b*0.55*(0.3+wet)); } }   // ash, with new shoots between
  { const band=0.5+0.5*Math.sin(h*1.7+n3*3.2); _savR.copy(_savC.rock).lerp(_savC.rockHi,band); out.lerp(_savR,steep*0.9); }   // red sandstone terraces on the slopes, banded by height
  { const c=coastDist(x,z); if(c<50) out.lerp(COL.beach,smoothstep(46,32,c)*(1-smoothstep(3.2,5.5,h))); }
  { const wd=waterSurf(x,z)-h; if(wd>-0.9) out.lerp(wd>0.3?COL.mud:COL.dirt2,smoothstep(-0.9,0.5,wd)*0.85); }   // wet banks and the beds of the pools and the river
  { const A=ARENA_A41, da=Math.hypot(x-A.x,z-A.z); if(da<A.r+3) out.lerp(_savC.scorch,smoothstep(A.r+3,A.r-4,da)*0.8); }   // Old Thunder's roost: scorched
  { const A=ARENA_A45, da=Math.hypot(x-A.x,z-A.z); if(da<A.r+3) out.lerp(_savC.slab,smoothstep(A.r+3,A.r-4,da)*0.9); }       // the Dawn Slab: pale, polished
  { const ra=roadAmt(x,z); if(ra>0) out.lerp(COL.dirt2,ra*0.85); }
  if(vDist(x,z)<VR+30){
    out.lerp(COL.trodden,smoothstep(VR+8,VR-4,vDist(x,z))*0.3);
    const pa=pathAmt(x,z); if(pa>0) out.lerp(COL.dirt2,pa*0.9);
    const pz=plazaAmt(x,z); if(pz>0) out.lerp(COL.gravel,pz*0.95);
  }
  return out.multiplyScalar(0.92+n2*0.16);
}
