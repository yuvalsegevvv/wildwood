//@ Weather on the client: rain streaks around the camera (snowfall and blizzards instead in the Hoarfrost Reach), a darker foggy sky, lightning and thunder (rain and wind sound: audio/rain.js)
/* The server decides the weather (src/server/weather.js); snapshots carry [kind, seconds in, duration] and
   'thunder' events carry where lightning struck. Rain fades in and out over 25 seconds.
   The weather is one for the whole world, but what falls depends on where you stand: in the Hoarfrost Reach (WX.snow, 0..1, follows the
   camera's position over the vale's north rim) rain becomes snow and a storm a blizzard: slow, drifting flakes, a pale close sky, a wind
   in place of the patter. */
const WX={kind:0,t:0,dur:0,inten:0,flash:0,snd:null,snow:0};
const RAIN_N=LITE?700:(LOW?1100:2000);
const rainPos=new Float32Array(RAIN_N*6), rainGeo=new THREE.BufferGeometry();
rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rainMat=new THREE.LineBasicMaterial({color:0xb6c4d2,transparent:true,opacity:0,depthWrite:false});
const rain=new THREE.LineSegments(rainGeo,rainMat); rain.frustumCulled=false; rain.visible=false; scene.add(rain);
const rainSpd=new Float32Array(RAIN_N);
for(let i=0;i<RAIN_N;i++){ rainSpd[i]=AR(18,26); const x=AR(-22,22), y=AR(-10,16), z=AR(-22,22); rainPos.set([x,y,z,x,y+0.7,z],i*6); }
// snow: round soft flakes as points around the camera
const SNOW_N=LITE?600:(LOW?1000:1900);
const flakePos=new Float32Array(SNOW_N*3), flakeSpd=new Float32Array(SNOW_N), flakePh=new Float32Array(SNOW_N), flakeGeo=new THREE.BufferGeometry();
flakeGeo.setAttribute('position',new THREE.BufferAttribute(flakePos,3));
const flakeTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=32; const g=c.getContext&&c.getContext('2d'); if(!g) return null;
  const r=g.createRadialGradient(16,16,0,16,16,16); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.45,'rgba(255,255,255,0.85)'); r.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=r; g.fillRect(0,0,32,32); const t=new THREE.CanvasTexture(c); return t; })();
const flakeMat=new THREE.PointsMaterial({color:0xffffff,size:0.2,map:flakeTex||null,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});
const snowfall=new THREE.Points(flakeGeo,flakeMat); snowfall.frustumCulled=false; snowfall.visible=false; scene.add(snowfall);
for(let i=0;i<SNOW_N;i++){ flakeSpd[i]=AR(1.1,2.2); flakePh[i]=AR(0,TAU); flakePos.set([AR(-24,24),AR(-10,16),AR(-24,24)],i*3); }
function applyWeather(w){
  if(!w) return; const was=WX.kind; WX.kind=w[0]; WX.t=w[1]; WX.dur=w[2];
  if(WX.kind&&!was&&started) toast(WX.snow>0.5?(WX.kind===2?'A blizzard is rolling in…':'Snow is starting to fall…'):(WX.kind===2?'A thunderstorm is rolling in…':'It is starting to rain…'),'');
}
// how strong the weather is right now (0..1): fades in over the first 25 s and out over the last 25 s
function weatherTarget(){ if(!WX.kind) return 0; return clamp(Math.min(WX.t/25,(WX.dur-WX.t)/25,1)); }
const _wg=new THREE.Color(), _ww=new THREE.Color(0xdfe6ff);
function weatherTint(s){
  const k=WX.inten*(WX.kind===2?1:0.8);
  if(k>0.001){
    const lum=(s.fog.r+s.fog.g+s.fog.b)/3, sn=WX.snow;
    _wg.setRGB(lum*(0.82+0.14*sn),lum*(0.87+0.14*sn),lum*(0.93+0.12*sn));   // snow weather: a paler, whiter grey than rain
    s.fog.lerp(_wg,k*0.8); s.sky.lerp(_wg,k*0.85); s.hor.lerp(_wg,k*0.8); s.cloud.lerp(_wg,k*0.7);
    s.sunI*=1-(0.65-0.2*sn)*k; s.hi*=1-0.22*k; s.far*=1-(0.45+0.3*sn*(WX.kind===2?1:0.3))*k;   // a blizzard shortens the sight most
  }
  if(WX.flash>0.001){ const f=WX.flash; s.hi+=f*1.4; s.fog.lerp(_ww,f*0.35); s.sky.lerp(_ww,f*0.6); s.hor.lerp(_ww,f*0.5); }
}
function updateWeather(dt){
  if(WX.kind) WX.t+=dt;
  WX.inten+=(weatherTarget()-WX.inten)*Math.min(1,dt*0.8);
  if(dgIn()) WX.inten=0;   // dungeons: no rain, snow or their sound under the ground (it eases back after a run)
  WX.flash=Math.max(0,WX.flash-dt*3.2);
  // rain or snow: by where the camera is (over the vale's north crest and down onto the plateau it turns to snow over ~50 m)
  { const cx=camera.position.x, cz=camera.position.z, tgt=cx>HALF?smoothstep(HZ0+25,HZ0-25,cz):0; WX.snow+=(tgt-WX.snow)*Math.min(1,dt*2); if(Math.abs(tgt-WX.snow)<0.004) WX.snow=tgt; }
  const on=WX.inten>0.01, sn=WX.snow; rain.visible=on&&sn<0.98; snowfall.visible=on&&sn>0.02;
  if(snowfall.visible){
    const nS=Math.floor(SNOW_N*WX.inten*(WX.kind===2?1:0.55)*sn), blow=WX.kind===2, wind=blow?7.5:0.9;
    flakeGeo.setDrawRange(0,nS); flakeMat.opacity=Math.min(1,WX.inten*1.6)*0.9*Math.min(1,sn*2); flakeMat.size=blow?0.26:0.2;
    const cx=camera.position.x, cy=camera.position.y, cz=camera.position.z, R=blow?15:24;
    for(let i=0;i<nS;i++){
      const o=i*3, ph=flakePh[i]+=dt*(0.8+flakeSpd[i]*0.4);
      let x=flakePos[o]+(Math.sin(ph)*0.5+wind*(0.7+flakeSpd[i]*0.15))*dt, y=flakePos[o+1]-flakeSpd[i]*dt*(blow?1.7:1), z=flakePos[o+2]+Math.cos(ph*0.8)*0.4*dt+(blow?wind*0.25*dt:0);
      if(y<cy-10||Math.abs(x-cx)>R||Math.abs(z-cz)>R){ x=cx+AR(-R,R)-(blow?R*0.5:0); z=cz+AR(-R,R); y=cy+AR(4,16); }
      flakePos[o]=x; flakePos[o+1]=y; flakePos[o+2]=z;
    }
    flakeGeo.attributes.position.needsUpdate=true;
  }
  if(on&&sn<0.98){
    const n=Math.floor(RAIN_N*WX.inten*(1-sn)); rainGeo.setDrawRange(0,n*2);
    rainMat.opacity=(WX.kind===2?0.5:0.4)*Math.min(1,WX.inten*1.5);
    const cx=camera.position.x, cy=camera.position.y, cz=camera.position.z, wind=WX.kind===2?0.35:0.12;
    for(let i=0;i<n;i++){
      const o=i*6, fall=rainSpd[i]*dt;
      let x=rainPos[o]-fall*wind, y=rainPos[o+1]-fall, z=rainPos[o+2];
      if(y<cy-10||Math.abs(x-cx)>22||Math.abs(z-cz)>22){ x=cx+AR(-22,22); z=cz+AR(-22,22); y=cy+AR(8,16); }
      rainPos[o]=x; rainPos[o+1]=y; rainPos[o+2]=z; rainPos[o+3]=x+0.7*wind; rainPos[o+4]=y+0.75; rainPos[o+5]=z;
    }
    rainGeo.attributes.position.needsUpdate=true;
  }
  rainSoundTick(dt);   // audio/rain.js
}
// lightning: a bolt in the sky, a flash for everyone who can see it, thunder after distance / speed of sound
const lightningMat=new THREE.LineBasicMaterial({color:0xf2f4ff,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
function onThunder(x,z){
  const d=Math.hypot(x-P.x,z-P.z), near=clamp(1-d/320);
  WX.flash=Math.max(WX.flash,0.25+0.75*near);
  if(d<420){
    const g=getH(x,z), v=[]; let px=x, pz=z;
    for(let y=g+70;y>g;y-=AR(4,8)){ v.push(px,y,pz); px+=AR(-3,3); pz+=AR(-3,3); v.push(px,Math.max(g,y-AR(4,8)),pz); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    const line=new THREE.LineSegments(geo,lightningMat.clone()); scene.add(line); BOLTS.push({o:line,t:0,life:0.35});
  }
  if(!SND.ready) return;
  const when=SND.ctx.currentTime+d/343, s=spatial(x,z,60,2000)||{gain:0.3,pan:0}, v=0.15+0.5*near;
  if(d<90) noiseHit({bus:'ui',filter:'highpass',ff:1800,dur:0.25,vol:0.35*near,pan:s.pan,when:SND.ctx.currentTime+d/343});
  noiseHit({bus:'ambient',filter:'lowpass',ff:160+300*near,dur:2.6+1.5*(1-near),vol:v,pan:s.pan,when});
  tone({bus:'ambient',type:'sawtooth',freq:55,freq2:28,dur:2.2,vol:0.05*v,filter:'lowpass',ff:220,pan:s.pan,when:when+0.1});
}
