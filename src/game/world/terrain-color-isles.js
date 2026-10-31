//@ The Emberwake Isles' ground colours (ewColor): black volcanic sand at the Landing, pale coral sand round the lagoon, deep jungle humus, terraced ochre grass and grey rock on the Highland, packed coral earth in Coralhaven
/* Agent map: ewColor(x,z,h,g,out) is chosen by landColor (terrain-color.js, land id 7; asked before the Sunscar's catch-all) and the neighbour blend near a border works as for the other lands (the isles have no
   land neighbour: the sea). The zones' own tints (zpTheme e42..e48, zone-props.js) are laid over this by terrainColor. Zones: 42 the Black Sand Landing (black sand), 43 the Lagoon Shallows (white sand, turquoise
   shallows), 44-46 the jungle (humus, moss, the cenote's wet stone), 47-48 the Highland (terraced ochre grass, grey rock). Reads the zone through ewIslePart(x,z) (the nearest island's name from shared/emberwake.js).
   Used by: terrain-color.js. Test: client-smoke (it draws the terrain). Names: ew..., _ew... */
const _ewC={jungle:new THREE.Color(0x3c7a38),jungle2:new THREE.Color(0x5a9a40),humus:new THREE.Color(0x2c4a2a),moss:new THREE.Color(0x4a7a48),black:new THREE.Color(0x2a2a2e),coral:new THREE.Color(0xe9e2c8),
  turq:new THREE.Color(0xa8dcd0),ochre:new THREE.Color(0xa89a52),straw:new THREE.Color(0xc0ae68),rock:new THREE.Color(0x8c8a84),rockHi:new THREE.Color(0xb0aca0),terrace:new THREE.Color(0x7a7a5a),packed:new THREE.Color(0xcdbf98)};
const _ewG=new THREE.Color();
// which part of the isles a point is in: 0 the Landing's island (sand), 1 the jungle (Coralhaven's island and the east isle's west: zones 44-46), 2 the Highland (the east isle's terraces: zones 47-48), 3 the volcano's
// (the nearest island by its ellipse, EW_ISLANDS; the east isle is split by its zone, or by x where there is none: the shore)
function ewIslePart(x,z){
  let best=0,bd=1e9; for(let i=0;i<EW_ISLANDS.length;i++){ const I=EW_ISLANDS[i], d=Math.hypot((x-I.x)/I.rx,(z-I.z)/I.rz); if(d<bd){ bd=d; best=i; } }
  if(best!==2) return best===1?1:best;
  const Z=waZone(x,z); return (Z?Z.key>=47:x>EW_ISLANDS[2].x-40)?2:1;
}
function ewColor(x,z,h,g,out){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5, n3=noise2(x*0.05-20,z*0.05+7)*0.5+0.5, steep=smoothstep(0.4,0.95,g), part=ewIslePart(x,z);
  const high=part===2?1:0, jung=part===1?1:0;
  out.copy(_ewC.jungle).lerp(_ewC.jungle2,smoothstep(0.3,0.8,n1));
  if(jung){ out.lerp(_ewC.humus,0.45+0.35*n3); out.lerp(_ewC.moss,smoothstep(0.6,0.9,n2)*0.5); }   // the jungle floor: dark humus with moss in patches
  if(high){ out.copy(_ewC.ochre).lerp(_ewC.straw,smoothstep(0.35,0.8,n1)*0.8); out.lerp(_ewC.terrace,smoothstep(0.55,0.9,n3)*0.35); { const band=0.5+0.5*Math.sin(h*2.2+n3*2.4); out.lerp(_ewC.rock,band*steep*0.5); } }   // the Highland: ochre and straw, terrace bands in the grey
  out.lerp(_ewC.rockHi,steep*0.7*(0.6+0.4*n2));   // bare rock on the steep slopes
  { const c=coastDist(x,z); if(c<56){ const k=smoothstep(52,30,c)*(1-smoothstep(3.0,5.6,h)); _ewG.copy(part===0&&z<EW_ISLANDS[0].z-20?_ewC.black:_ewC.coral); if(part===0&&x>EW_ISLANDS[0].x) _ewG.copy(_ewC.coral).lerp(_ewC.turq,0.25); out.lerp(_ewG,k); } }   // black sand on the Landing's north shore, pale coral sand elsewhere
  { const wd=waterSurf(x,z)-h; if(wd>-0.9) out.lerp(wd>0.3?COL.mud:COL.dirt2,smoothstep(-0.9,0.5,wd)*0.85); }   // wet banks and the beds of the lagoon and the cenotes
  { const ra=roadAmt(x,z); if(ra>0) out.lerp(COL.dirt2,ra*0.85); }
  { const A=ARENA_E45, da=Math.hypot(x-A.x,z-A.z); if(da<A.r+3) out.lerp(_ewC.terrace,smoothstep(A.r+3,A.r-4,da)*0.8); }   // the Jaguar Court: worn stone
  { const A=ARENA_E46, da=Math.hypot(x-A.x,z-A.z); if(da<A.r+3) out.lerp(_ewC.coral,smoothstep(A.r+3,A.r-4,da)*0.75); }       // Tuila's tidepool: wet sand
  if(vDist(x,z)<VR+30){
    out.lerp(_ewC.packed,smoothstep(VR+8,VR-4,vDist(x,z))*0.45);
    const pa=pathAmt(x,z); if(pa>0) out.lerp(COL.dirt2,pa*0.9);
    const pz=plazaAmt(x,z); if(pz>0) out.lerp(COL.gravel,pz*0.95);
  }
  for(const w of EW_WAYS){ const dw=Math.hypot(x-w.x,z-w.z); if(dw<w.r+8) out.lerp(COL.gravel,smoothstep(w.r+8,w.r-2,dw)*0.85); }   // the camps' paved ground
  return out.multiplyScalar(0.92+n2*0.16);
}
