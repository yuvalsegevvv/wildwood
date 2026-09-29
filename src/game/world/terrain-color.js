//@ Terrain colours (COL, terrainColor; hoarColor for the Hoarfrost Reach's snow, tundra, ice and needle floor)
const COL = {
  lush:new THREE.Color(0x4c7a2b), dry:new THREE.Color(0x8a8f42), floor:new THREE.Color(0x5b4a30),
  dirt:new THREE.Color(0x6e5738), sand:new THREE.Color(0xb3a27a), mud:new THREE.Color(0x4a3f2f),
  rock:new THREE.Color(0x7d796f), trodden:new THREE.Color(0x6c7436), arena:new THREE.Color(0x4a4238), dirt2:new THREE.Color(0x7a6446), gravel:new THREE.Color(0x8d8170), rockHi:new THREE.Color(0x8c8a83), snow:new THREE.Color(0xeef2f4),
  valeLush:new THREE.Color(0x5c9a38), petal:new THREE.Color(0xd6a2b6),
  beach:new THREE.Color(0xd9c89c), redRock:new THREE.Color(0x96553e), desert:new THREE.Color(0xd2a868),
  frost:new THREE.Color(0xc6d8e6), tundra:new THREE.Color(0x8a8468), needles:new THREE.Color(0x4a5a52), frozenRock:new THREE.Color(0x7d858c), iceBlue:new THREE.Color(0xa8cce4),
  packed:new THREE.Color(0xb4b6b2), slush:new THREE.Color(0x8e8b80)
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
const _hc=new THREE.Color();
function terrainColor(x,z,h,g,out,noCut){   // noCut: colour as if the tunnel's cutting were not there (its lid)
  const hf=x>HALF+2?smoothstep(HZ0+8,HZ0-56,z):0;   // the vale's north crest, over which the ground turns to the Hoarfrost's
  if(hf>=1) return hoarColor(x,z,h,g,out);
  if(x<HALF&&z<HZ0-30){   // the Greyspine's mountains north of the forest (nobody can walk there): bare rock, snow on the high ground, no need for the rest
    const n=noise2(x*0.02,z*0.02)*0.5+0.5; out.copy(COL.rock).lerp(COL.rockHi,n*0.6); out.lerp(COL.snow,smoothstep(38,58,h)*(1-smoothstep(1.3,2.0,g)));
    return out.multiplyScalar(0.92+n*0.16);
  }
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5;
  out.copy(COL.lush).lerp(COL.dry, smoothstep(0.45,0.85,n1)*0.8);
  out.lerp(COL.floor, smoothstep(0.45,0.9,forestDensity(x,z))*0.75);
  out.lerp(COL.dirt, smoothstep(0.72,0.92,n2)*0.5);
  out.lerp(COL.sand, 1-smoothstep(0.3,1.4,h));
  if(h<-0.2) out.lerp(COL.mud, clamp(-h/2));
  { const c=coastDist(x,z); if(c<50) out.lerp(COL.beach, smoothstep(46,32,c)*(1-smoothstep(3.2,5.5,h))); }
  out.lerp(COL.rock, smoothstep(0.7,1.2,g));
  // the Sunwall (home forest, west): red cliffs, a sandy plateau on top, dry scree at its foot, no snow
  const cl=x<HALF?sunwallLine(z):0, sw=x<HALF?smoothstep(cl+20,cl,x-WX0):0;
  if(x<HALF&&x-WX0<cl+70){
    out.lerp(COL.dirt2, smoothstep(cl+68,cl+12,x-WX0)*0.35*(1-smoothstep(0.7,1.1,g)));
    out.lerp(COL.redRock, Math.max(sw*smoothstep(0.45,0.9,g), smoothstep(14,9,Math.abs(z-REDGATE_Z))*smoothstep(REDGATE_CL+48,REDGATE_CL+28,x-WX0)*0.85));
    out.lerp(COL.desert, sw*(1-smoothstep(0.35,0.6,g))*smoothstep(40,48,h));
  }
  out.lerp(COL.rockHi, smoothstep(26,36,h)*0.7*(1-sw));
  // snow: lower on the vale's northern slopes, and it clings to steeper ground there (the Hoarfrost is beyond them)
  { const hn=x>HALF&&z-HZ0<80, lo=hn?34:42; out.lerp(COL.snow, smoothstep(lo,lo+10,h)*(1-(hn?smoothstep(1.4,2.0,g):smoothstep(0.9,1.4,g)))*(1-sw)); }
  { const da=arenaDist(x,z); if(da<ARENA.r+3) out.lerp(COL.arena,smoothstep(ARENA.r+3,ARENA.r-3,da)*0.7); }
  if(x>HALF-10){   // the vale: fresher green, the forest floor dusted pink with fallen petals
    const v=smoothstep(HALF-10,HALF+30,x)*(1-smoothstep(0.7,1.2,g))*(1-smoothstep(24,34,h));
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
  if(hf>0){ hoarColor(x,z,h,g,_hc); out.lerp(_hc,hf); }
  out.multiplyScalar(0.92+n2*0.16);
  return out;
}

