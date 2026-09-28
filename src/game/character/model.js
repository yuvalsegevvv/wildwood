//@ Look presets, save/load, buildCharacter (all outfits and armour looks), hiker, rebuildHiker
/* ---------- the hiker: a customisable character ---------- */
const SKINS=[0xf3d3bd,0xe6b894,0xc98e66,0xa56c45,0x7a4a2c,0x4f2f1d];
// natural shades first (random looks pick from HAIRC.slice(0,HAIRC_NATURAL)), then the dyed / fantasy ones
const HAIRC=[0x1d1714,0x3b2619,0x6a4428,0x9a4a24,0xd8b56e,0xb9b3aa,0x5e2418,0xc47a45,0xeadcb4,0xeeece6,0x2f6f73,0x3a5fa0,0x6b3f8f,0xc25a86,0x9c2a2a];
const HAIRC_NATURAL=10;   // black, dark brown, brown, red, blonde, grey, auburn, copper, platinum, white
const EYEC=[0x4a2e1c,0x6b5a2e,0x3f6b3a,0x3b6a9e,0x7a8288];
const CLOTH=[0xb4552f,0x3d5a3a,0x2f4a6b,0xd8c9a3,0x6b3a5b,0xc9a13a,0x2b2b2e,0xe8e4dc,0x8a2f2f,0x5c7f9c];
const SHOEC=[0x4a3526,0x2b2420,0x7a5a3a,0xe8e4dc,0x2f4a6b,0x8a2f2f];
const HATC=[0x7a6142,0x3d5a3a,0x8a2f2f,0x2f4a6b,0xc9a13a,0xe8e4dc,0x2b2b2e];
const LOOK_M={armor:'show',sex:'male',height:1,build:1,skin:SKINS[1],face:'angular',eyes:EYEC[0],facial:'stubble',hair:'short',hairColor:HAIRC[1],top:'jacket',topColor:CLOTH[0],bottom:'trousers',bottomColor:CLOTH[6],shoes:'boots',shoeColor:SHOEC[0],hat:'ranger',hatColor:HATC[0],pack:false,custom:false,cls:'warrior'};
const LOOK_F={armor:'show',sex:'female',height:1,build:1,skin:SKINS[1],face:'oval',eyes:EYEC[2],facial:'none',hair:'ponytail',hairColor:HAIRC[3],top:'flannel',topColor:CLOTH[8],bottom:'trousers',bottomColor:CLOTH[9],shoes:'boots',shoeColor:SHOEC[0],hat:'none',hatColor:HATC[1],chest:1,pack:false,custom:false,cls:'warrior'};
function loadLook(){
  try{ const s=JSON.parse(localStorage.getItem('wildwood-look-v1')||'null'); if(s && (s.sex==='male'||s.sex==='female')) return Object.assign({}, s.sex==='female'?LOOK_F:LOOK_M, s); }catch(_){}
  return Object.assign({},LOOK_M);
}
function saveLookLocal(){ try{ localStorage.setItem('wildwood-look-v1',JSON.stringify(LOOK)); }catch(_){} }
function saveLook(){ saveLookLocal(); if(typeof netLookChanged==='function') netLookChanged(); }
let LOOK=loadLook();

const csph=(r,w,h)=>new THREE.SphereGeometry(r,w||10,h||8);
// Phong lights every pixel from the interpolated normal; Lambert (per-vertex light) showed each triangle's edges on bodies
const matChar=new THREE.MeshPhongMaterial({vertexColors:true,shininess:6,specular:0x0b0b0b});
const _cc=new THREE.Color(), _tint=new THREE.Color();
function plaid(c,base,u,v){
  c.set(base);
  const a=((u*15)%1+1)%1<0.32, b=((v*15)%1+1)%1<0.32;
  if(a) c.multiplyScalar(0.6); if(b) c.multiplyScalar(0.6);
  if((((u*15+0.5)%1+1)%1<0.08)||(((v*15+0.5)%1+1)%1<0.08)) c.lerp(_tint.set(0xeadfc4),0.35);
}
// a rounded, tapered limb hanging from its joint (0,0,0) down to -len
function limbGeo(r1,r2,len,seg){
  const pts=[], n=5, mid=8;
  for(let i=0;i<=n;i++){ const a=-Math.PI/2+(i/n)*Math.PI/2; pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*r2), -len+Math.sin(a)*r2)); }
  for(let i=1;i<mid;i++){ const f=i/mid; pts.push(new THREE.Vector2(lerp(r2,r1,f), -len+len*f)); }
  for(let i=0;i<=n;i++){ const a=(i/n)*Math.PI/2; pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*r1), Math.sin(a)*r1)); }
  return new THREE.LatheGeometry(pts, seg||12);
}
/* A limb with a muscle profile. prof: [t, radius, zOffset?] from the top joint (t=0) to the bottom (t=1);
   zOffset > 0 pushes that part backwards (the calf), < 0 forwards. sx / sz squash the cross-section.
   Rounded caps at both ends. The limb hangs down from y=0 to y=-len, like before. */
function muscleLimb(prof,len,seg,sx,sz){
  const at=t=>{ for(let i=1;i<prof.length;i++) if(t<=prof[i][0]){ const a=prof[i-1], b=prof[i], f=(t-a[0])/((b[0]-a[0])||1), e=f*f*(3-2*f); return [lerp(a[1],b[1],e),lerp(a[2]||0,b[2]||0,e)]; } const l=prof[prof.length-1]; return [l[1],l[2]||0]; };
  const pts=[], rb=at(1)[0], rt=at(0)[0], n=5, mid=18;
  for(let i=0;i<=n;i++){ const a=-Math.PI/2+(i/n)*Math.PI/2; pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*rb),-len+Math.sin(a)*rb*0.8)); }
  for(let i=1;i<mid;i++){ const t=1-i/mid; pts.push(new THREE.Vector2(at(t)[0],-len*t)); }
  for(let i=0;i<=n;i++){ const a=(i/n)*Math.PI/2; pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*rt),Math.sin(a)*rt*0.8)); }
  const g=new THREE.LatheGeometry(pts,seg||14), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const t=clamp(-p.getY(i)/len), z=at(t)[1]; p.setX(i,p.getX(i)*(sx||1)); p.setZ(i,p.getZ(i)*(sz||1)+z); }
  return smoothN(g);
}
// smooth normals that also match across seams: a lathe/sphere repeats its first column of vertices, and
// computeVertexNormals gives the two copies different normals, which drew a visible line down the body
function smoothN(g){ g.computeVertexNormals(); const p=g.attributes.position, n=g.attributes.normal, acc=new Map(), key=i=>Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4);
  for(let i=0;i<p.count;i++){ const k=key(i), a=acc.get(k)||[0,0,0]; a[0]+=n.getX(i); a[1]+=n.getY(i); a[2]+=n.getZ(i); acc.set(k,a); }
  for(let i=0;i<p.count;i++){ const a=acc.get(key(i)), l=Math.hypot(a[0],a[1],a[2])||1; n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l); }
  return g; }
function densify(prof,k){ const out=[]; for(let i=0;i<prof.length-1;i++){ for(let j=0;j<k;j++){ const f=j/k; out.push([lerp(prof[i][0],prof[i+1][0],f), lerp(prof[i][1],prof[i+1][1],f)]); } } out.push(prof[prof.length-1]); return out; }
function pc(g,fn){ const one=fn.length===1; return paint(g,(x,y,z,nx,ny,nz,c)=>{ if(one) fn(c); else fn(x,y,z,c); c.multiplyScalar(0.985+0.03*noise2(x*7+z*5,y*7-z*3)); }); }   // a faint, smooth variation (a per-vertex hash speckled every triangle)
function solid(g,hex){ return pc(g,(x,y,z,c)=>c.set(hex)); }
function shell(r,t0,tl,gap,tilt){
  const g=new THREE.SphereGeometry(r,22,12, gap?1.5*Math.PI+gap/2:0, gap?TAU-gap:TAU, t0, tl);
  if(tilt) g.rotateX(tilt);
  return g;
}

function buildCharacter(L){
  const fem=L.sex==='female', B=L.build, lr=Math.pow(B,0.9);
  const ch=Math.min(1.6,Math.max(0.5,+L.chest||1));   // chest size (female), 1 = default; clamped: remote looks aren't sanitized
  const skin=new THREE.Color(L.skin);
  const longSleeve=L.top!=='tshirt';
  const topPaint=(c,u,v)=>{
    if(L.top==='flannel') plaid(c,L.topColor,u,v);
    else if(L.top==='mail'){ c.set(L.topColor).multiplyScalar(0.72+0.38*((Math.floor(u*70)+Math.floor(v*70))&1)); }
    else if(L.top==='plate'){ c.set(L.topColor).multiplyScalar(0.82+0.3*(Math.floor(v*13)&1)); }
    else c.set(L.topColor);
  };
  const botPaint=(c,u,v)=>{
    c.set(L.bottomColor);
    if(L.bottomStyle==='mail') c.multiplyScalar(0.72+0.38*((Math.floor((u||0)*70)+Math.floor((v||0)*70))&1));
    else if(L.bottomStyle==='plate') c.multiplyScalar(0.82+0.3*(Math.floor((v||0)*11)&1));
  };
  const skinPaint=c=>c.copy(skin);
  const hem=(L.top==='jacket'||L.top==='hoodie'||L.top==='mail'||L.top==='plate')?-0.035:0.03;

  const root=new THREE.Group();
  const hipY=0.92;
  const hips=new THREE.Group(); hips.name='hips'; hips.position.y=hipY; root.add(hips);
  const spine=new THREE.Group(); spine.name='spine'; hips.add(spine);

  /* torso */
  const prof=fem
    ? [[0.001,-0.11],[0.12,-0.1],[0.172,-0.04],[0.182,0.0],[0.168,0.07],[0.132,0.17],[0.126,0.22],[0.136,0.3],[0.146,0.37],[0.15,0.43],[0.132,0.485],[0.085,0.525],[0.05,0.545]]
    : [[0.001,-0.11],[0.118,-0.1],[0.152,-0.04],[0.158,0.0],[0.15,0.08],[0.146,0.15],[0.158,0.23],[0.178,0.31],[0.19,0.38],[0.19,0.43],[0.165,0.48],[0.1,0.525],[0.052,0.555]];
  const tg=new THREE.LatheGeometry(densify(prof,fem?5:3).map(p=>new THREE.Vector2(p[0],p[1])),fem?48:36);
  { const p=tg.attributes.position, G=(v,m,w)=>Math.exp(-Math.pow((v-m)/w,2));
    for(let i=0;i<p.count;i++){
      const y=p.getY(i), x0=p.getX(i), z0=p.getZ(i), belly=G(y,0.1,0.13)*(B-1)*1.4;
      const x=x0*B*(fem?1:1.04), front=z0<0, ax=Math.abs(x);
      // a flatter front and back than a round tube: bodies are wider than they are deep
      let z=z0*(fem?0.66:0.62)*B*(1+(front?belly:belly*0.3));
      if(front){
        if(!fem) z-=0.011*B*G(y,0.36,0.06)*(1-0.35*G(ax,0,0.025))*G(ax,0.06*B,0.1);   // a broad, flat chest
        z-=0.008*G(y,0.1,0.08)*(1-G(ax,0,0.04))*(fem?0.5:1);              // stomach, a little rounded
        if(fem){
          // bust: part of the torso surface, not two balls. Each side slopes gently down from the collarbone,
          // is fullest low, and tucks in quicker underneath; the two join softly in the middle (fabric bridges them).
          // A larger chest (ch) is deeper, a little wider and sits a little lower.
          const cy=0.315-0.012*(ch-1), wx=0.05*(0.86+0.14*ch), wl=0.036*(0.8+0.2*ch);
          const lobe=sd=>{ const dx=x-sd*0.056*B, dy=y-cy; return Math.exp(-Math.pow(dx/wx,2))*Math.exp(-Math.pow(dy/(dy>0?0.075:wl),2)); };
          const a=lobe(-1), b=lobe(1);
          z-=0.036*lr*ch*(1-(1-a)*(1-b));
        }
      } else {
        z+=0.012*B*G(y,0.37,0.07)*G(ax,0.075*B,0.045);                    // shoulder blades
        z+=(fem?0.034:0.022)*B*G(y,0.0,0.055)*G(ax,0.066*B,0.05);         // glutes
        z-=0.008*G(ax,0,0.018)*G(y,0.2,0.18);                             // the groove of the spine
      }
      p.setX(i,x); p.setZ(i,z);
    }
    smoothN(tg);
  }
  const tparts=[pc(tg,(x,y,z,c)=>{
    if(y>hem) topPaint(c,x,y);
    else if(y>hem-0.035 && L.bottom!=='skirt' && hem>0) c.set(0x3a2a1c);
    else botPaint(c,x,y);
    if((L.top==='jacket'||L.top==='hoodie'||L.top==='mail') && y<hem+0.03 && y>hem) c.multiplyScalar(0.8);
    if(L.top==='plate' && y>0.02 && y<0.07) c.set(0x3a2a1c);
  })];
  // a short neck (about half a head's height shows) that ends inside the head
  const neckR=fem?0.049:0.061;
  { const np=[[neckR*1.5,0.47],[neckR*1.28,0.51],[neckR*1.08,0.55],[neckR,0.59],[neckR*1.0,0.63],[neckR*1.03,0.665],[neckR*0.9,0.69]];
    const ng=new THREE.LatheGeometry(densify(np,3).map(q=>new THREE.Vector2(q[0],q[1])),16), q=ng.attributes.position;
    for(let i=0;i<q.count;i++){ const y=q.getY(i); q.setX(i,q.getX(i)*1.1); q.setZ(i,q.getZ(i)*0.94-(y-0.47)*0.08); }   // wider than deep, top leaning forward
    smoothN(ng); tparts.push(pc(ng,c=>skinPaint(c)));
    if(!fem) tparts.push(pc(csph(0.009,8,6).scale(1.1,1.5,0.7).translate(0,0.585,-neckR*1.02-0.008),c=>skinPaint(c)));   // Adam's apple
  }
  // trapezius: the slope from the neck down to the shoulders
  tparts.push(pc(csph(0.1,16,8).scale((fem?0.95:1.25)*B,0.32,0.62*B).translate(0,0.5,0.012),(x,y,z,c)=>topPaint(c,x,y)));
  if(L.top==='jacket'){
    tparts.push(pc(new THREE.CylinderGeometry(0.068,0.088,0.07,16,1,true).scale(B,1,B*0.8).translate(0,0.545,0),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.8); }));
    tparts.push(solid(new THREE.BoxGeometry(0.01,0.5,0.01).translate(0,0.24,-0.104*B),0x2a2a2a));
  }
  if(L.top==='hoodie'){
    tparts.push(pc(csph(0.1,14,10).scale(1.25*B,0.75,1.0).translate(0,0.545,0.075*B),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.88); }));
    tparts.push(pc(new THREE.BoxGeometry(0.19*B,0.09,0.02).translate(0,0.1,-0.1*B*(1+(B-1)*1.3)),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.85); }));
    for(const sd of [-1,1]) tparts.push(solid(new THREE.BoxGeometry(0.006,0.11,0.006).translate(sd*0.03,0.44,-0.1*B),0xe8e4dc));
  }
  if(L.pack){
    const bz=0.112*B+0.075;
    tparts.push(pc(new THREE.BoxGeometry(0.3,0.42,0.15).translate(0,0.28,bz),c=>c.set(0x566437)));
    tparts.push(pc(new THREE.BoxGeometry(0.22,0.14,0.05).translate(0,0.17,bz+0.095),c=>c.set(0x4a5630)));
    tparts.push(pc(new THREE.CylinderGeometry(0.065,0.065,0.36,12).rotateZ(Math.PI/2).translate(0,0.535,bz),c=>c.set(0x8a3b2c)));
    for(const sd of [-1,1]) tparts.push(pc(new THREE.BoxGeometry(0.035,0.34,0.012).translate(sd*0.085*B,0.33,-0.112*B-(fem?0.02:0)),c=>c.set(0x3b4228)));
  }
  const torso=new THREE.Mesh(merge(tparts),matChar); torso.castShadow=true; spine.add(torso);

  if(L.bottom==='skirt'){
    const sg=pc(new THREE.CylinderGeometry(0.165,0.255,0.4,20,4,true).scale(B,1,B*0.78).translate(0,-0.16,0),(x,y,z,c)=>{ botPaint(c); if(y<-0.33) c.multiplyScalar(0.85); });
    const skirt=new THREE.Mesh(sg,matFlat); skirt.castShadow=true; hips.add(skirt);
  }

  /* head */
  const head=new THREE.Group(); head.name='head'; head.position.y=0.72; spine.add(head);
  const fs=L.face==='oval'?[0.92,1.1]:L.face==='round'?[1.02,0.98]:[0.97,1.04];
  const hparts=[];
  const hairCol=new THREE.Color(L.hairColor);
  // sculpt: turns a ball around the head's centre into a head shape (jaw, chin, cheekbones, the back of the skull).
  // Used on the skull and on everything that wraps it (hair, beards, hats), so they keep fitting.
  const sculpt=(g,face)=>{ const p=g.attributes.position, G=(v,m,w)=>Math.exp(-Math.pow((v-m)/w,2)), sm=(a,b,v)=>{ const t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
    for(let i=0;i<p.count;i++){
      let x=p.getX(i), y=p.getY(i), z=p.getZ(i); const front=z<0, ax=Math.abs(x);
      const jaw=sm(-0.015,-0.1,y);                                   // 0 above the cheeks, 1 at the chin
      x*=1-jaw*(fem?0.36:0.26);                                      // the jaw narrows toward the chin
      if(front){
        z-=0.013*G(y,-0.086,0.022)*G(x,0,0.03);                      // chin
        z*=1-0.07*G(y,0.02,0.05);                                    // a flatter face than a ball
        x+=Math.sign(x)*0.007*G(y,-0.012,0.022)*G(z,-0.075,0.03);    // cheekbones
        if(face){ z+=0.006*G(y,0.013,0.013)*G(ax,0.037,0.016);       // eye sockets
          z-=0.004*G(y,0.042,0.012)*G(ax,0.036,0.03)*(fem?0.5:1); }   // brow ridge
      } else {
        z*=1+0.1*G(y,0.025,0.055);                                   // the back of the skull
        z*=1-0.2*jaw;                                                // tucks in toward the neck
      }
      x*=1-0.035*G(y,0.035,0.03)*sm(-0.02,-0.08,z);                  // temples
      if(y<-0.07) y=-0.07+(y+0.07)*0.75;                              // a shorter underside, so the head meets the neck
      p.setXYZ(i,x,y,z);
    }
    return smoothN(g); };
  const skull=sculpt(csph(0.105,28,20),true);
  hparts.push(pc(skull.scale(fs[0],fs[1],1),(x,y,z,c)=>{
    skinPaint(c);
    if(L.facial==='stubble' && y<-0.018 && z<-0.02) c.lerp(hairCol,0.32);
  }));
  if(L.face==='angular') hparts.push(pc(csph(0.05,12,8).scale(1.3*fs[0],0.62,0.85).translate(0,-0.078,-0.055),(x,y,z,c)=>{ skinPaint(c); if(L.facial==='stubble'&&z<-0.02) c.lerp(hairCol,0.32); }));
  const ex=0.037*fs[0], fz=-0.1;
  for(const sd of [-1,1]){
    hparts.push(solid(csph(0.0215,10,8).scale(1,0.88,0.5).translate(sd*ex,0.012,fz+0.0145),0xf4f1ea));   // eyes a little larger than real
    hparts.push(solid(csph(0.0128,8,6).scale(1,1.05,0.5).translate(sd*ex,0.011,fz+0.0065),L.eyes));
    hparts.push(solid(csph(0.0058,6,4).translate(sd*ex,0.011,fz+0.0015),0x111111));
    hparts.push(pc(new THREE.SphereGeometry(0.023,12,6,0,Math.PI*2,0,Math.PI*0.34).scale(1,0.9,0.55).rotateX(-0.25).translate(sd*ex,0.013,fz+0.0145),c=>skinPaint(c)));   // upper eyelid
    const brow=new THREE.BoxGeometry(0.032,fem?0.006:0.009,0.008).rotateZ(sd*(fem?-0.12:-0.06)).translate(sd*ex,0.044,fz+0.004);
    hparts.push(pc(brow,c=>c.copy(hairCol).multiplyScalar(0.75)));
    hparts.push(pc(csph(0.023,8,6).scale(0.45,1,0.8).translate(sd*0.104*fs[0],-0.005,0.008),c=>skinPaint(c)));
  }
  // nose: a bridge sloping out from the brows, a rounded tip and two small wings
  const nw=fem?0.8:0.92;
  hparts.push(pc(new THREE.BoxGeometry(0.013*nw,0.042,0.016).rotateX(0.42).translate(0,0.004,fz-0.006),c=>skinPaint(c)));
  hparts.push(pc(csph(0.0125*nw,10,8).scale(1,0.9,0.95).translate(0,-0.017,fz-0.013),c=>{ skinPaint(c); c.multiplyScalar(0.97); }));
  for(const sd of [-1,1]) hparts.push(pc(csph(0.008*nw,8,6).scale(1,0.8,1).translate(sd*0.01*nw,-0.021,fz-0.006),c=>{ skinPaint(c); c.multiplyScalar(0.93); }));
  // lips: an upper and a slightly fuller lower lip
  const lips=skin.clone().lerp(_tint.set(0x9c4a48),fem?0.55:0.35);
  hparts.push(pc(csph(0.018,12,6).scale(1.05,fem?0.3:0.24,0.42).translate(0,-0.043,fz+0.006),c=>c.copy(lips)));
  hparts.push(pc(csph(0.016,12,6).scale(1.05,fem?0.4:0.32,0.5).translate(0,-0.051,fz+0.007),c=>c.copy(lips).multiplyScalar(1.05)));
  if(L.facial==='beard'){
    hparts.push(pc(sculpt(new THREE.SphereGeometry(0.114,22,12,Math.PI,Math.PI,0.5*Math.PI,0.42*Math.PI).scale(1,1.1,1).translate(0,-0.004,-0.004),false).scale(fs[0],1,1),c=>c.copy(hairCol).multiplyScalar(0.9)));
  }
  if(L.facial==='beard'||L.facial==='mustache'){
    hparts.push(pc(csph(0.02,10,6).scale(1.9,0.5,0.7).translate(0,-0.034,fz-0.002),c=>c.copy(hairCol).multiplyScalar(0.9)));
  }
  // hair
  const hat=L.hat!=='none';
  const hg=[];
  const H=L.hair;
  const cap=(r,tl,tilt)=>shell(r,0,tl*Math.PI,0,tilt);
  if(H==='buzz') hg.push(cap(0.108,0.42,0.38));
  if(H==='short'){ hg.push(cap(0.114,0.5,0.32)); if(!hat) hg.push(csph(0.05,10,8).scale(1.7,0.55,0.9).translate(0.012,0.08,-0.07)); hg.push(shell(0.111,0.38*Math.PI,0.2*Math.PI,1.9)); }
  if(H==='curly'){ const r=hat?(L.hat==='helm'?0.11:0.118):0.138; const g=cap(r,0.56,0.3); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=1+(h3(x*3,y*3,z*3)-0.5)*0.12; p.setXYZ(i,x*j,y*j,z*j);} g.computeVertexNormals(); hg.push(g); hg.push(shell(r*0.95,0.4*Math.PI,0.22*Math.PI,1.9)); }
  if(H==='bob'||H==='long'){ hg.push(cap(0.116,0.5,0.3)); hg.push(shell(0.121,0.34*Math.PI,0.36*Math.PI,1.55)); }
  if(H==='long'){ hg.push(csph(0.11,12,10).scale(1.02,2.3,0.42).translate(0,-0.14,0.072)); for(const sd of [-1,1]) hg.push(csph(0.034,8,8).scale(1,3.4,1).translate(sd*0.098,-0.1,-0.015)); }
  if(H==='ponytail'||H==='bun'){ hg.push(cap(0.113,0.52,0.24)); }
  if(H==='ponytail'){ hg.push(csph(0.022,8,6).translate(0,0.015,0.115)); hg.push(csph(0.046,10,8).scale(0.8,2.7,0.8).rotateX(0.3).translate(0,-0.09,0.145)); }
  if(H==='bun'&&!hat){ hg.push(csph(0.052,12,10).translate(0,0.085,0.085)); }
  hg.forEach(g=>{ sculpt(g,false).scale(fs[0],fs[1],1); hparts.push(pc(g,c=>c.copy(hairCol))); });
  // hats
  const hc=L.hatColor;
  if(L.hat==='ranger'){
    hparts.push(pc(new THREE.CylinderGeometry(0.205,0.205,0.012,28).translate(0,0.078,0),c=>c.set(hc)));
    hparts.push(pc(new THREE.CylinderGeometry(0.09,0.118,0.105,22).translate(0,0.135,0),c=>c.set(hc)));
    hparts.push(pc(new THREE.CylinderGeometry(0.119,0.119,0.024,22).translate(0,0.095,0),c=>c.set(hc).multiplyScalar(0.55)));
  } else if(L.hat==='beanie'){
    hparts.push(pc(sculpt(shell(0.123,0,0.46*Math.PI,0,0.415),false).scale(fs[0],fs[1],1),c=>c.set(hc)));
    hparts.push(pc(sculpt(shell(0.128,0.36*Math.PI,0.1*Math.PI,0,0.415),false).scale(fs[0],fs[1],1),c=>c.set(hc).multiplyScalar(0.82)));
    hparts.push(pc(csph(0.032,10,8).translate(0,0.125*fs[1],0.05),c=>c.set(0xf2eee4)));
  } else if(L.hat==='helm'){
    hparts.push(pc(sculpt(shell(0.128,0,0.475*Math.PI,0,0.4),false).scale(fs[0],fs[1],1),(x,y,z,c)=>c.set(hc).multiplyScalar(0.88+0.18*clamp(y*6))));
    hparts.push(pc(sculpt(shell(0.133,0.385*Math.PI,0.09*Math.PI,0,0.4),false).scale(fs[0],fs[1],1),c=>c.set(hc).multiplyScalar(0.7)));
    hparts.push(pc(vbox(0.018,0.062,0.016,0,0.03,-0.116).rotateX(0.14),c=>c.set(hc).multiplyScalar(0.8)));
    if(L.plume) hparts.push(pc(new THREE.CylinderGeometry(0.13,0.13,0.024,20,1,false,Math.PI,Math.PI).rotateZ(-Math.PI/2).scale(1,0.8,1.05).translate(0,0.03,0).rotateX(0.4).translate(0,0.02*fs[1],0.0),(x,y,z,c)=>c.set(L.plume).multiplyScalar(0.8+0.35*clamp((y-0.1)*8))));
  } else if(L.hat==='kasa'){   // a conical straw hat (the Sakura Vale)
    hparts.push(pc(new THREE.ConeGeometry(0.3,0.15,20).translate(0,0.14*fs[1],0),(x,y,z,c)=>c.set(hc).multiplyScalar(0.84+0.22*h3(Math.round(Math.atan2(z,x)*8),0,5))));
    hparts.push(pc(new THREE.CylinderGeometry(0.1,0.11,0.05,16).translate(0,0.085*fs[1],0),c=>c.set(hc).multiplyScalar(0.6)));
  } else if(L.hat==='cap'){
    hparts.push(pc(sculpt(shell(0.119,0,0.435*Math.PI,0,0.33),false).scale(fs[0],fs[1],1),c=>c.set(hc)));
    hparts.push(pc(new THREE.CylinderGeometry(0.1,0.1,0.01,18,1,false,Math.PI/2,Math.PI).scale(1,1,1.15).rotateX(-0.12).translate(0,0.062*fs[1],-0.086),c=>c.set(hc).multiplyScalar(0.85)));
  }
  const headMesh=new THREE.Mesh(merge(hparts),matChar); headMesh.castShadow=true; head.add(headMesh);
  // between realistic and anime: a head about 1/7 of the height (a real adult is ~1/7.5, anime ~1/6)
  head.scale.setScalar(fem?1.15:1.18);

  /* arms */
  const shR=(fem?0.148:0.175)*B*(fem?1:1.04)+0.012;
  const mkArm=sd=>{
    const sh=new THREE.Group(); sh.name=sd<0?'shL':'shR'; sh.position.set(sd*shR,0.455,0); sh.rotation.z=sd*(0.1+(B-1)*0.35); spine.add(sh);
    const aw=(fem?0.97:1.2)*lr;   // arm thickness
    // upper arm: a shoulder cap, the biceps in front, narrowing to the elbow
    const ua=pc(muscleLimb([[0,0.054*aw],[0.14,0.056*aw],[0.35,0.047*aw,-0.002],[0.55,0.046*aw,-0.005],[0.8,0.04*aw],[1,0.036*aw]],0.28,14,1,1.04),(x,y,z,c)=>{ if(longSleeve||y>-0.13) topPaint(c,x+sd*0.3,y); else skinPaint(c); });
    const m1=new THREE.Mesh(ua,matChar); m1.castShadow=true; sh.add(m1);
    const el=new THREE.Group(); el.name=sd<0?'elL':'elR'; el.position.y=-0.28; sh.add(el);
    const fa=merge([
      // forearm: thick below the elbow, slim at the wrist, a little wider than deep
      pc(muscleLimb([[0,0.037*aw],[0.18,0.042*aw],[0.45,0.035*aw],[0.8,0.026*aw],[1,0.024*aw]],0.25,14,1.12,0.88),(x,y,z,c)=>{ if(longSleeve && y>-0.225){ topPaint(c,x+sd*0.3,y-0.28); if(y<-0.2) c.multiplyScalar(0.8); } else skinPaint(c); }),
      // hand: palm, fingers, and a thumb on the inner front side
      pc(csph(0.03,12,8).scale(0.95,1.05,0.5).translate(0,-0.277,0),c=>skinPaint(c)),
      pc(csph(0.027,12,8).scale(0.95,1.2,0.45).translate(0,-0.318,-0.002),c=>skinPaint(c)),
      pc(csph(0.011,8,6).scale(1,2.1,1).rotateZ(-sd*0.55).rotateX(-0.35).translate(-sd*0.024,-0.29,-0.012),c=>skinPaint(c))
    ]);
    const m2=new THREE.Mesh(fa,matChar); m2.castShadow=true; el.add(m2);
    return [sh,el];
  };
  const [shL,elL]=mkArm(-1), [shR2,elR]=mkArm(1);
  if(L.top==='plate'){ const pm=new THREE.Mesh(merge([-1,1].map(sd=>pc(csph(0.1*lr,12,8).scale(1.25,0.75,1.15).translate(sd*shR,0.48,0),(x,y,z,c)=>c.set(L.topColor).multiplyScalar(0.9+clamp(y-0.48)*4)))),matChar); pm.castShadow=true; spine.add(pm); }

  /* legs */
  const hx=(fem?0.092:0.085)*B;
  const mkLeg=sd=>{
    const hp=new THREE.Group(); hp.name=sd<0?'hipL':'hipR'; hp.position.set(sd*hx,0,0); hips.add(hp);
    // thigh: full at the top (quads in front), tapering to the knee
    const tw=(fem?1.1:1.07)*lr;
    const th=pc(muscleLimb([[0,0.092*tw],[0.14,0.09*tw],[0.4,0.078*tw,-0.004],[0.7,0.064*tw,-0.002],[0.9,0.055*tw],[1,0.053*tw]],0.43,16,1,1.05),(x,y,z,c)=>{
      if(L.bottom==='trousers'||(L.bottom==='shorts'&&y>-0.23)) botPaint(c,x,y); else skinPaint(c);
      if(L.bottom==='shorts'&&y>-0.23&&y<-0.2) c.multiplyScalar(0.85);
    });
    const m1=new THREE.Mesh(th,matChar); m1.castShadow=true; hp.add(m1);
    const kn=new THREE.Group(); kn.name=sd<0?'kneeL':'kneeR'; kn.position.y=-0.43; hp.add(kn);
    // lower leg: the calf bulges out behind a straight shin, down to a slim ankle
    const cw=(fem?0.98:1.05)*lr;
    const sparts=[pc(muscleLimb([[0,0.053*cw],[0.12,0.057*cw,0.006],[0.3,0.057*cw,0.012],[0.52,0.045*cw,0.006],[0.78,0.034*cw],[0.92,0.031*cw],[1,0.036*cw]],0.42,16,0.95,1.03),(x,y,z,c)=>{ if(L.bottom==='trousers') botPaint(c,x,y); else skinPaint(c); })];
    if(L.bottomStyle==='plate') sparts.push(pc(csph(0.068*lr,10,8).scale(1,0.9,0.8).translate(0,0,-0.03),c=>c.set(L.bottomColor).multiplyScalar(1.1)));
    const boot=L.shoes==='boots';
    sparts.push(pc(csph(0.05,12,8).scale(0.95,0.62,2.15).translate(0,-0.452,-0.045),(x,y,z,c)=>{ c.set(L.shoeColor); if(y<-0.472) c.set(boot?0x221a14:0xf2efe8); }));
    if(boot) sparts.push(pc(new THREE.CylinderGeometry(0.05,0.052,0.12,12).translate(0,-0.39,0),c=>c.set(L.shoeColor)));
    const m2=new THREE.Mesh(merge(sparts),matChar); m2.castShadow=true; kn.add(m2);
    return [hp,kn];
  };
  const [hipL,kneeL]=mkLeg(-1), [hipR,kneeR]=mkLeg(1);
  return {root,hips,spine,head,hipY,shL,elL,shR:shR2,elR,hipL,kneeL,hipR,kneeR};
}

const hiker={g:new THREE.Group(),rig:null,scale:1};
let weaponsReady=false;
scene.add(hiker.g);
function rebuildHiker(){
  if(hiker.rig){ hiker.g.remove(hiker.rig.root); hiker.rig.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  hiker.rig=buildCharacter(GEAR?effectiveLook():LOOK);
  hiker.scale=LOOK.height*(LOOK.sex==='female'?0.95:1);
  hiker.rig.root.scale.setScalar(hiker.scale);
  hiker.g.add(hiker.rig.root);
  if(weaponsReady) attachWeapons();
}
rebuildHiker();

