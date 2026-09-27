//@ Sky dome shader (gradient, sun/moon, stars, clouds)
/* ---------- sky ---------- */
const skyU = {
  uTop:{value:new THREE.Color()}, uFog:{value:new THREE.Color()}, uHor:{value:new THREE.Color()},
  uBot:{value:new THREE.Color()}, uSunDir:{value:sunDir}, uSunCol:{value:new THREE.Color()},
  uCloud:{value:new THREE.Color()}, uNight:{value:0}, uTime:timeU
};
const sky = new THREE.Mesh(new THREE.SphereGeometry(900,32,16), new THREE.ShaderMaterial({
  uniforms:skyU, side:THREE.BackSide, depthWrite:false, depthTest:false, fog:false,
  vertexShader:`varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`
    uniform vec3 uTop,uFog,uHor,uBot,uSunDir,uSunCol,uCloud; uniform float uNight,uTime; varying vec3 vDir;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }
    float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*vn(p); p*=2.03; a*=0.5; } return v; }
    void main(){
      vec3 d=normalize(vDir); float h=d.y;
      vec3 sd=normalize(uSunDir);
      float toward=pow(max(dot(normalize(d.xz+vec2(1e-5)), normalize(sd.xz+vec2(1e-5))),0.0),3.0);
      vec3 horiz=mix(uFog,uHor,toward*0.75);
      vec3 col=mix(horiz,uTop,pow(clamp(h,0.0,1.0),0.55));
      col=mix(col,uBot,1.0-smoothstep(-0.25,0.0,h));
      float s=max(dot(d,sd),0.0);
      col+=uSunCol*(pow(s,700.0)*3.0 + pow(s,9.0)*0.28*(1.0-uNight*0.8));
      if(h>0.0){
        if(uNight>0.01){
          vec3 sp=floor(d*320.0);
          float st=fract(sin(dot(sp,vec3(12.9898,78.233,37.719)))*43758.5453);
          col+=vec3(step(0.9972,st))*uNight*smoothstep(0.0,0.3,h)*(0.55+0.45*sin(uTime*2.5+st*120.0));
        }
        vec2 uv=d.xz/(h+0.12)*1.2+vec2(uTime*0.006,uTime*0.002);
        float c=smoothstep(0.5,0.86,fbm(uv))*smoothstep(0.0,0.22,h);
        col=mix(col,uCloud*(0.82+0.3*s),c*0.8);
      }
      gl_FragColor=vec4(col,1.0);
    }`
}));
sky.renderOrder = -1; sky.frustumCulled = false;
scene.add(sky);

