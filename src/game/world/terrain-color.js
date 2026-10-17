//@ Terrain colours (COL, terrainColor; hoarColor for the Hoarfrost Reach's snow, tundra, ice and needle floor; greyColor for the Greyspine's alpine meadows, scree, rock and snowfields)
const COL = {
  lush:new THREE.Color(0x4c7a2b), dry:new THREE.Color(0x8a8f42), floor:new THREE.Color(0x5b4a30),
  dirt:new THREE.Color(0x6e5738), sand:new THREE.Color(0xb3a27a), mud:new THREE.Color(0x4a3f2f),
  rock:new THREE.Color(0x7d796f), trodden:new THREE.Color(0x6c7436), arena:new THREE.Color(0x4a4238), dirt2:new THREE.Color(0x7a6446), gravel:new THREE.Color(0x8d8170), rockHi:new THREE.Color(0x8c8a83), snow:new THREE.Color(0xeef2f4),
  valeLush:new THREE.Color(0x5c9a38), petal:new THREE.Color(0xd6a2b6),
  beach:new THREE.Color(0xd9c89c), shingle:new THREE.Color(0xb3ada0), redRock:new THREE.Color(0x96553e), desert:new THREE.Color(0xd2a868),
  frost:new THREE.Color(0xc6d8e6), tundra:new THREE.Color(0x8a8468), needles:new THREE.Color(0x4a5a52), frozenRock:new THREE.Color(0x7d858c), iceBlue:new THREE.Color(0xa8cce4),
  packed:new THREE.Color(0xb4b6b2), slush:new THREE.Color(0x8e8b80),
  alpine:new THREE.Color(0x6a8c3c), scree:new THREE.Color(0x8c8b86), larch:new THREE.Color(0x4f5a34)
};
// the Hoarfrost Reach: white snow with a blue cast in the hollows, wind-scoured tundra showing through, a dark needle floor under the spruce of the
// southern fringe, bare rock on steep ground, blue-white ice on the frozen lakes, trodden snow on roads and in the village
function hoarColor(x,z,h,g,out){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5, n3=noise2(x*0.045-30,z*0.045+12)*0.5+0.5, steep=smoothstep(0.75,1.3,g);
  out.copy(COL.snow).lerp(COL.frost,n1*0.55);
  out.lerp(COL.tundra,smoothstep(0.64,0.84,n3)*0.5*(1-smoothstep(0.9,1.4,g)));
  out.lerp(COL.needles,smoothstep(0.5,0.85,forestDensity(x,z))*smoothstep(-700,-570,z)*0.4*(1-steep));
  out.lerp(COL.frozenRock,steep*0.85);
  { const id=iceDist(x,z); if(id<7) out.lerp(COL.iceBlue,smoothstep(7,-2,id)*0.92); }
  { const c=coastDist(x,z); if(c<50) out.lerp(COL.shingle,smoothstep(46,32,c)*(1-smoothstep(3.2,5.5,h))*0.9); }   // (the northern sea's beaches: cold shingle under the snow's edge)
  { const da=arenaDist(x,z); if(da<ARENA.r+3) out.lerp(COL.slush,smoothstep(ARENA.r+3,ARENA.r-3,da)*0.6); }
  { const ra=roadAmt(x,z); if(ra>0) out.lerp(COL.slush,ra*0.8); }
  if(vDist(x,z)<VR+30){
    out.lerp(COL.packed,smoothstep(VR+8,VR-4,vDist(x,z))*0.45);
    const pa=pathAmt(x,z); if(pa>0) out.lerp(COL.slush,pa*0.85);
    const pz=plazaAmt(x,z); if(pz>0) out.lerp(COL.packed,pz*0.9);
  }
  out.multiplyScalar(0.94+n2*0.12);
  return out;
}
// the Greyspine: alpine meadow in the troughs, a darker needle floor under the conifers, grey scree on the slopes and bare rock where it is steep, snow
// above the snowline (about 130 m, lower on the gentle ground of the north), red badlands in the south-west where the river will leave the range, packed
// earth on Highmark's shelf
function greyColor(x,z,h,g,out){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5, n3=noise2(x*0.045-30,z*0.045+12)*0.5+0.5, steep=smoothstep(0.62,1.15,g);
  out.copy(COL.alpine).lerp(COL.dry,smoothstep(0.45,0.85,n1)*0.5*(1-smoothstep(55,95,h)));   // (the dry yellow only on the low meadows)
  out.lerp(COL.larch,smoothstep(0.5,0.9,forestDensity(x,z))*0.55*(1-smoothstep(82,108,h+n3*12)));
  out.lerp(COL.dirt,smoothstep(0.72,0.92,n2)*0.35);
  out.lerp(COL.scree,smoothstep(72,118,h+n3*14)*0.8+smoothstep(0.45,0.8,g)*0.35);
  out.lerp(n1<0.5?COL.rock:COL.rockHi,steep*0.9);
  out.lerp(COL.snow,smoothstep(112-(z<-860?10:0)+n1*14,128-(z<-860?10:0)+n1*14,h)*(1-smoothstep(0.85,1.4,g)));   // (the snowline fits the atlas's peaks: the spine rises to 150-187 m, its crowns are white from about 115 m)
  { const d=Math.hypot(x-GREY_HM.x,z-GREY_HM.z); if(d<GREY_HM.r+4) out.lerp(COL.gravel,smoothstep(GREY_HM.r+4,GREY_HM.r-6,d)*0.65); }
  { const wd=waterSurf(x,z)-h; if(wd>-0.9) out.lerp(wd>0.3?COL.mud:COL.gravel,smoothstep(-0.9,0.5,wd)*0.85); }   // wet banks and the beds of the tarns and the river
  { const c=coastDist(x,z); if(c<50) out.lerp(COL.shingle,smoothstep(46,32,c)*(1-smoothstep(3.2,5.5,h))*0.9); }   // (the northern sea's beaches)
  return out.multiplyScalar(0.92+n2*0.16);
}
const _hc=new THREE.Color(), _nb=new THREE.Color();
/* The ground's colour is chosen by the atlas's land (waLandId): the home forest and the vale (landColor 0 / 1 below), the Reach, the Greyspine, the Gloamhorn, the Sunscar (and the closed land south of it).
   Near a land border (within 20 m of the crest) the colour of the land on the other side is mixed in, half and half at the border itself, so the two meet without a line. */
function landColor(l,x,z,h,g,out,noCut){
  if(l===2) return hoarColor(x,z,h,g,out);
  if(l===3) return greyColor(x,z,h,g,out);
  if(l===5) return gloamColor(x,z,h,g,out);
  if(l>=4) return sunColor(x,z,h,g,out);
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5;
  out.copy(COL.lush).lerp(COL.dry, smoothstep(0.45,0.85,n1)*0.8);
  out.lerp(COL.floor, smoothstep(0.45,0.9,forestDensity(x,z))*0.75);
  out.lerp(COL.dirt, smoothstep(0.72,0.92,n2)*0.5);
  out.lerp(COL.sand, 1-smoothstep(0.3,1.4,h));
  if(h<-0.2) out.lerp(COL.mud, clamp(-h/2));
  { const c=coastDist(x,z); if(c<50) out.lerp(COL.beach, smoothstep(46,32,c)*(1-smoothstep(3.2,5.5,h))); }
  out.lerp(COL.rock, smoothstep(0.7,1.2,g));
  out.lerp(COL.rockHi, smoothstep(26,36,h)*0.7);
  out.lerp(COL.snow, smoothstep(42,52,h)*(1-smoothstep(0.9,1.4,g)));   // (snow on the high ground of the forest and the vale)
  { const da=arenaDist(x,z); if(da<ARENA.r+3) out.lerp(COL.arena,smoothstep(ARENA.r+3,ARENA.r-3,da)*0.7); }
  if(l===1){   // the vale: fresher green, the forest floor dusted pink with fallen petals
    const v=(1-smoothstep(0.7,1.2,g))*(1-smoothstep(24,34,h));
    out.lerp(COL.valeLush,v*0.45*(1-smoothstep(0.45,0.85,n1)));
    out.lerp(COL.petal,v*smoothstep(0.35,0.8,forestDensity(x,z))*0.45);
  }
  if(!noCut && inTunnelCut(x,z)) out.lerp(COL.gravel,smoothstep(TUN.w+4,TUN.w,Math.abs(z-TUN.z))*0.8);
  { const ra=roadAmt(x,z); if(ra>0) out.lerp(COL.dirt2,ra*0.85); }
  if(vDist(x,z)<VR+30){
    out.lerp(COL.trodden, smoothstep(VR+8,VR-4,vDist(x,z))*0.3);
    const pa=pathAmt(x,z); if(pa>0) out.lerp(COL.dirt2,pa*0.9);
    const pz=plazaAmt(x,z); if(pz>0) out.lerp(COL.gravel,pz*0.95);
  }
  out.multiplyScalar(0.92+n2*0.16);
  return out;
}
function terrainColorBase(x,z,h,g,out,noCut){   // (terrainColor, in zone-props.js, adds the monster zones' ground tint on top)   // noCut: colour as if the tunnel's cutting were not there (its lid)
  const l=waLandId(x,z), d=waLandBorderDist(x,z);
  landColor(l,x,z,h,g,out,noCut);
  if(d<20){   // the land on the other side of the crest, found by looking round for a different land id
    let b=l; for(let r=d+10;r<=d+40&&b===l;r+=15) for(let k=0;k<8;k++){ const a=k*0.7854, q=waLandId(x+Math.sin(a)*r,z+Math.cos(a)*r); if(q!==l){ b=q; break; } }
    if(b!==l){ landColor(b,x,z,h,g,_nb,noCut); out.lerp(_nb,0.5*smoothstep(20,0,d)); }
  }
  return dgEntTint(x,z,out);   // dungeons: the ground round the Elder, the Falls Door, the Barrow Door, the Old Adit
}

