//@ The spark pool: one THREE.Points draw call for the glows, sparks, trails and shockwave debris that every skill, monster attack and boss move adds to its effect
/* Agent map. Fixed capacity (FXP_N: 640, 260 on phones; the oldest particle is overwritten when it is full), so any number of effects cost one draw call and
   no allocation. FXP_K halves the particle counts on phones. Soft round points, additive, no texture.
   Callers: spawnBurst / spawnRingAt / spawnArcAt (attacks.js: every skill and monster that uses them gains sparks), projectile trails and impacts (attacks.js),
   onChain / onBeam / meteor / arrow rain / auras / zones (skill-fx.js), telegraph ends, zones and waves (boss.js, boss-fx.js), monster swings (onMonAct).
   fxpUpdate(dt) runs from updateSkillFx. Test: client-smoke (every skill is drawn; the pool stays finite). */
const FXP_N=LOW?260:640, FXP_K=LOW?0.5:1;
// a pool of soft round points drawn in one call: additive for light (sparks, glows), normal for smoke
function fxpMakePool(n,blending,soft){
  const geo=new THREE.BufferGeometry(), pool={n,i:0,live:0,vel:new Float32Array(n*3),life:new Float32Array(n),max:new Float32Array(n),g:new Float32Array(n),drag:new Float32Array(n),
    s0:new Float32Array(n),s1:new Float32Array(n),a0:new Float32Array(n),geo};
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3)); geo.setAttribute('aCol',new THREE.BufferAttribute(new Float32Array(n*3),3));
  geo.setAttribute('size',new THREE.BufferAttribute(new Float32Array(n),1)); geo.setAttribute('alpha',new THREE.BufferAttribute(new Float32Array(n),1));
  pool.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending,uniforms:{uScale:{value:600}},
    vertexShader:'attribute vec3 aCol; attribute float size; attribute float alpha; varying vec3 vC; varying float vA; uniform float uScale;\n'+
      'void main(){ vC=aCol; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(180.0,size*uScale/max(0.1,-mv.z)); gl_Position=projectionMatrix*mv; }',
    fragmentShader:'varying vec3 vC; varying float vA;\n'+(soft?
      'void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard; float c=1.0-r; gl_FragColor=vec4(vC,vA*c*c); }':
      'void main(){ float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0) discard; float c=1.0-r; gl_FragColor=vec4(vC*(1.0+c*c*1.2),vA*c*(0.5+0.5*c)); }')});
  pool.pts=new THREE.Points(geo,pool.mat); pool.pts.frustumCulled=false; pool.pts.renderOrder=4; scene.add(pool.pts);
  return pool;
}
const FXP=fxpMakePool(FXP_N,THREE.AdditiveBlending,false), FXP_SMOKE=fxpMakePool(LOW?60:150,THREE.NormalBlending,true);
FXP.later=[];
const _fxpC=new THREE.Color(), _fxpWhite=new THREE.Color(0xffffff);
// one particle. o: g (gravity, m/s²), drag (1/s), grow (end size × start), a (start opacity), white (0-1: mixes the colour toward white)
function fxpAdd(x,y,z,vx,vy,vz,col,size,life,o){ fxpPut(FXP,x,y,z,vx,vy,vz,col,size,life,o); }
function fxpSmoke(x,y,z,vx,vy,vz,col,size,life,o){ fxpPut(FXP_SMOKE,x,y,z,vx,vy,vz,col,size,life,o); }   // dust and smoke: dark, normal-blended, swelling as it rises
function fxpPut(FXP,x,y,z,vx,vy,vz,col,size,life,o){
  o=o||{}; const i=FXP.i; FXP.i=(i+1)%FXP.n; FXP.live=Math.min(FXP.n,FXP.live+1);
  const P_=FXP.geo.attributes.position.array, C_=FXP.geo.attributes.aCol.array;
  P_[i*3]=x; P_[i*3+1]=y; P_[i*3+2]=z; FXP.vel[i*3]=vx; FXP.vel[i*3+1]=vy; FXP.vel[i*3+2]=vz;
  _fxpC.setHex(col); if(o.white) _fxpC.lerp(_fxpWhite,o.white); C_[i*3]=_fxpC.r; C_[i*3+1]=_fxpC.g; C_[i*3+2]=_fxpC.b;
  FXP.life[i]=FXP.max[i]=life; FXP.g[i]=o.g||0; FXP.drag[i]=o.drag||0; FXP.s0[i]=size; FXP.s1[i]=size*(o.grow===undefined?0.2:o.grow); FXP.a0[i]=o.a===undefined?1:o.a;
}
const fxpN=n=>Math.max(1,Math.round(n*FXP_K));   // a count, scaled for the device
function fxpFlare(x,y,z,col,size,life){   // a soft glow with a white heart, gone in a blink: the flash of a hit or a cast
  life=life||0.28; fxpAdd(x,y,z,0,0,0,col,size,life,{grow:1.6,a:0.7}); fxpAdd(x,y,z,0,0,0,0xffffff,size*0.45,life*0.7,{grow:0.4,a:0.9});
}
function fxpSparks(x,y,z,col,n,speed,o){   // sparks thrown out in all directions, falling back (o.up: extra upward speed, o.g, o.size, o.life)
  o=o||{}; n=fxpN(n);
  for(let k=0;k<n;k++){ const a=AR(0,TAU), e=AR(-0.2,1), s=speed*AR(0.4,1), h=Math.sqrt(1-Math.min(1,e*e));
    fxpAdd(x,y,z,Math.sin(a)*h*s,e*s+(o.up||0),Math.cos(a)*h*s,col,(o.size||0.2)*AR(0.6,1.2),(o.life||0.5)*AR(0.6,1.2),{g:o.g===undefined?9:o.g,drag:o.drag===undefined?1.5:o.drag,white:k%2?0.55:0.1,grow:0.1}); }
}
function fxpRingSparks(x,y,z,r,col,n,life,inward){   // sparks racing out along a shockwave ring (or in to the middle)
  n=fxpN(n); life=life||0.5;
  for(let k=0;k<n;k++){ const a=(k+AR(0,1))/n*TAU, sx=Math.sin(a), sz=Math.cos(a), v=r/life*(inward?-0.9:0.9), p0=inward?r:0.3;
    fxpAdd(x+sx*p0,y+0.15,z+sz*p0,sx*v,AR(0.3,1.6),sz*v,col,0.22*AR(0.7,1.3),life*AR(0.8,1.1),{g:3,drag:inward?0:0.6,white:0.35,grow:0.15}); }
}
function fxpLine(x1,y1,z1,x2,y2,z2,col,n,size){   // glints strewn along a bolt or beam
  n=fxpN(n);
  for(let k=0;k<n;k++){ const f=Math.random(); fxpAdd(x1+(x2-x1)*f+AR(-0.2,0.2),y1+(y2-y1)*f+AR(-0.2,0.2),z1+(z2-z1)*f+AR(-0.2,0.2),AR(-1,1),AR(0.5,2),AR(-1,1),col,(size||0.3)*AR(0.6,1.2),AR(0.25,0.5),{g:2,drag:2,white:0.5,grow:0.1}); }
}
function fxpTrail(x,y,z,col,size,life){ fxpAdd(x+AR(-0.05,0.05),y+AR(-0.05,0.05),z+AR(-0.05,0.05),0,0,0,col,size,life||0.3,{grow:0.1,a:0.8}); }
function fxpRise(x,y,z,col,size,life){   // a mote drifting up and shrinking (embers, spores, snow glints, an aura)
  fxpAdd(x,y,z,AR(-0.3,0.3),AR(0.8,2.2),AR(-0.3,0.3),col,size||0.16,life||0.9,{drag:0.4,white:0.3,grow:0.05,a:0.9});
}
function fxpLater(delay,fn){ FXP.later.push({t:delay,fn}); }   // runs fn after delay seconds (a monster's blow lands after its wind-up)
function fxpStep(FXP,dt){
  if(!FXP.live) return;
  const pa=FXP.geo.attributes, P_=pa.position.array, S_=pa.size.array, A_=pa.alpha.array; let live=0;
  for(let i=0;i<FXP.n;i++){
    let l=FXP.life[i]; if(l<=0){ S_[i]=0; continue; }
    l-=dt; FXP.life[i]=l; if(l<=0){ S_[i]=0; A_[i]=0; continue; }
    live++; const k=1-l/FXP.max[i], d=Math.max(0,1-FXP.drag[i]*dt), j=i*3, V=FXP.vel;
    V[j]*=d; V[j+2]*=d; V[j+1]=V[j+1]*d-FXP.g[i]*dt;
    P_[j]+=V[j]*dt; P_[j+1]+=V[j+1]*dt; P_[j+2]+=V[j+2]*dt;
    S_[i]=FXP.s0[i]+(FXP.s1[i]-FXP.s0[i])*k; A_[i]=FXP.a0[i]*(1-k*k);
  }
  FXP.live=live; pa.position.needsUpdate=pa.size.needsUpdate=pa.alpha.needsUpdate=pa.aCol.needsUpdate=true;
}
function fxpUpdate(dt){
  if(FXP.later.length) for(let i=FXP.later.length-1;i>=0;i--){ const q=FXP.later[i]; q.t-=dt; if(q.t<=0){ FXP.later.splice(i,1); try{ q.fn(); }catch(_){} } }
  fxpStep(FXP,dt); fxpStep(FXP_SMOKE,dt);
  if(typeof renderer!=='undefined'&&renderer&&renderer.getDrawingBufferSize&&camera){ const sz=renderer.getDrawingBufferSize(_fxpSz); if(sz&&sz.y){ FXP.mat.uniforms.uScale.value=FXP_SMOKE.mat.uniforms.uScale.value=sz.y/(2*Math.tan(camera.fov*Math.PI/360)); } }
}
const _fxpSz=new THREE.Vector2();
