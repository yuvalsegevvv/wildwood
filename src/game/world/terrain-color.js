//@ Terrain colours (COL, terrainColor)
const COL = {
  lush:new THREE.Color(0x4c7a2b), dry:new THREE.Color(0x8a8f42), floor:new THREE.Color(0x5b4a30),
  dirt:new THREE.Color(0x6e5738), sand:new THREE.Color(0xb3a27a), mud:new THREE.Color(0x4a3f2f),
  rock:new THREE.Color(0x7d796f), trodden:new THREE.Color(0x6c7436), arena:new THREE.Color(0x4a4238), dirt2:new THREE.Color(0x7a6446), gravel:new THREE.Color(0x8d8170), rockHi:new THREE.Color(0x8c8a83), snow:new THREE.Color(0xeef2f4),
  valeLush:new THREE.Color(0x5c9a38), petal:new THREE.Color(0xd6a2b6)
};
function terrainColor(x,z,h,g,out,noCut){   // noCut: colour as if the tunnel's cutting were not there (its lid)
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5;
  out.copy(COL.lush).lerp(COL.dry, smoothstep(0.45,0.85,n1)*0.8);
  out.lerp(COL.floor, smoothstep(0.45,0.9,forestDensity(x,z))*0.75);
  out.lerp(COL.dirt, smoothstep(0.72,0.92,n2)*0.5);
  out.lerp(COL.sand, 1-smoothstep(0.3,1.4,h));
  if(h<-0.2) out.lerp(COL.mud, clamp(-h/2));
  out.lerp(COL.rock, smoothstep(0.7,1.2,g));
  out.lerp(COL.rockHi, smoothstep(26,36,h)*0.7);
  out.lerp(COL.snow, smoothstep(42,52,h)*(1-smoothstep(0.9,1.4,g)));
  { const da=arenaDist(x,z); if(da<ARENA.r+3) out.lerp(COL.arena,smoothstep(ARENA.r+3,ARENA.r-3,da)*0.7); }
  if(x>HALF-10){   // the vale: fresher green, the forest floor dusted pink with fallen petals
    const v=smoothstep(HALF-10,HALF+30,x)*(1-smoothstep(0.7,1.2,g))*(1-smoothstep(24,34,h));
    out.lerp(COL.valeLush,v*0.45*(1-smoothstep(0.45,0.85,n1)));
    out.lerp(COL.petal,v*smoothstep(0.35,0.8,forestDensity(x,z))*0.45);
  }
  if(!noCut && inTunnelCut(x,z)) out.lerp(COL.gravel,smoothstep(TUN.w+4,TUN.w,Math.abs(z-TUN.z))*0.8);
  if(vDist(x,z)<VR+30){
    out.lerp(COL.trodden, smoothstep(VR+8,VR-4,vDist(x,z))*0.3);
    const pa=pathAmt(x,z); if(pa>0) out.lerp(COL.dirt2,pa*0.9);
    const pz=plazaAmt(x,z); if(pz>0) out.lerp(COL.gravel,pz*0.95);
  }
  out.multiplyScalar(0.92+n2*0.16);
  return out;
}

