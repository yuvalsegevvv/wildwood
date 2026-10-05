//@ The aurora over the Hoarfrost Reach: slow green and violet curtains in the northern sky on clear nights
/* Two wide strips of shimmering light (a small shader, additive) hang 500 m north of the camera, high up, and only glow when you are in the Reach (or
   just below its wall), at night, under a clear sky: cloud and snow put it out (WX.inten). Not on the lightest device setting. docs/WORLD.md: "aurora at night". */
const AURORA=[];
if(!LITE){
  const mk=(w,h,y,z,seed,col)=>{
    const g=new THREE.PlaneGeometry(w,h,90,1), mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
      uniforms:{uT:timeU,uAmt:{value:0},uSeed:{value:seed},uLo:{value:new THREE.Color(col[0])},uHi:{value:new THREE.Color(col[1])}},
      vertexShader:'varying vec2 vUv; uniform float uT; uniform float uSeed;\nvoid main(){ vUv=uv; vec3 p=position; p.z+=sin(p.x*0.011+uT*0.12+uSeed)*70.0+sin(p.x*0.027-uT*0.2)*22.0; p.y+=sin(p.x*0.016+uT*0.17+uSeed*2.0)*18.0*uv.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
      fragmentShader:'varying vec2 vUv; uniform float uT; uniform float uAmt; uniform float uSeed; uniform vec3 uLo; uniform vec3 uHi;\nvoid main(){ float s=sin(vUv.x*95.0+uT*0.5+sin(vUv.x*11.0+uT*0.25+uSeed)*3.0)*0.5+0.5; s=0.25+0.75*pow(s,1.6); float fade=smoothstep(0.0,0.18,vUv.y)*(1.0-smoothstep(0.55,1.0,vUv.y)); float side=smoothstep(0.0,0.08,vUv.x)*(1.0-smoothstep(0.92,1.0,vUv.x)); vec3 c=mix(uLo,uHi,smoothstep(0.1,0.9,vUv.y)); gl_FragColor=vec4(c*s*fade*side*uAmt,1.0); }'});
    const m=new THREE.Mesh(g,mat); m.frustumCulled=false; m.renderOrder=3; m.visible=false; m.userData.o=[0,y,z]; scene.add(m); AURORA.push(m); };
  mk(1500,190,150,-520,1.0,[0x2aff9a,0x9a5aff]);
  mk(1300,150,190,-600,4.0,[0x6affd0,0x5a7aff]);
}
function updateAurora(){
  if(!AURORA.length) return;
  const cz=camera.position.z, cx=camera.position.x, k=(cx>borderXN(cz)?smoothstep(borderZ(cx)+160,borderZ(cx)-20,cz):0)*smoothstep(0.35,0.8,envCur.night)*(1-clamp(WX.inten*1.4));
  for(const m of AURORA){ m.visible=k>0.01; if(!m.visible) continue; m.material.uniforms.uAmt.value=k*0.85; m.position.set(cx+m.userData.o[0],m.userData.o[1]+camera.position.y*0.2,cz+m.userData.o[2]); }
}
