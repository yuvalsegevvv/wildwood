//@ The Gloamhorn's ground colours (gloamColor): dark heath with violet heather, black peat, grey rock on the sea cliffs, wet shingle at the water, trodden earth and cobbles in Wraithwick
/* Agent map: gloamColor(x,z,h,g,out) is blended into terrainColor (terrain-color.js) with the weight smoothstep(GW0+30,GW0-30,x) over the Greyspine's meadows (north of the border). Dim on purpose:
   the sky is a violet dusk (world/gloam-sky.js), so the ground is dark and desaturated and the heather and a few pale bones of stone give it its colour. Uses gloamIn (metres inside the cliff
   edge, shared/gloamhorn.js). Test: client-smoke (it draws the terrain), tools/gloamhorn-smoke.js. */
const _glC={heath:new THREE.Color(0x2e3a30),heath2:new THREE.Color(0x3a4034),heather:new THREE.Color(0x56406a),peat:new THREE.Color(0x1e1c20),rock:new THREE.Color(0x4a4a54),rockHi:new THREE.Color(0x66666e),
  shingle:new THREE.Color(0x2a2c34),moss:new THREE.Color(0x35502f),floor:new THREE.Color(0x242a26),trod:new THREE.Color(0x3c3630),cobble:new THREE.Color(0x56545c),sea:new THREE.Color(0x14181e)};
function gloamColor(x,z,h,g,out){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n2=noise2(x*0.11+5,z*0.11)*0.5+0.5, n3=noise2(x*0.05-20,z*0.05+7)*0.5+0.5, steep=smoothstep(0.55,1.1,g), e=gloamIn(x,z);
  out.copy(_glC.heath).lerp(_glC.heath2,smoothstep(0.4,0.8,n1)*0.7);
  out.lerp(_glC.heather,smoothstep(0.55,0.8,n3)*0.7*(1-steep));                       // violet heather in drifts
  out.lerp(_glC.peat,smoothstep(0.7,0.92,n2)*0.55);                                    // black peat patches
  out.lerp(_glC.moss,smoothstep(0.5,0.9,forestDensity(x,z))*0.4);
  out.lerp(n1<0.5?_glC.rock:_glC.rockHi,steep*0.9);
  { const cl=1-smoothstep(0,10,e); if(cl>0) out.lerp(_glC.rock,cl*0.85); }              // the sea cliffs' face
  { const sh=smoothstep(9,-1,e)*(1-smoothstep(1.2,4.5,h)); if(sh>0) out.lerp(_glC.shingle,sh*0.9); }   // wet black shingle at the foot
  if(h<0.3) out.lerp(_glC.sea,0.6);
  if(vDist(x,z)<VR+30){
    out.lerp(_glC.trod,smoothstep(VR+8,VR-4,vDist(x,z))*0.35);
    const pa=pathAmt(x,z); if(pa>0) out.lerp(_glC.cobble,pa*0.9);
    const pz=plazaAmt(x,z); if(pz>0) out.lerp(_glC.cobble,pz*0.95);
  }
  return out.multiplyScalar(0.9+n2*0.2);
}
