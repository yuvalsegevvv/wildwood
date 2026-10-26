//@ Caves, sea arches and overhangs (task C of the world revamp): each site is a signed distance field of a few primitives (defineCave), its floor is the heightmap (cvFloorCarve, called by rawHeight), its rock is a 3D mesh on the client; collision and light queries. Pure.
/* Agent map. Doc: docs/CAVES.md (the model, the hooks table, how to add a site). Test: tools/caves-smoke.js. Sites (data, one file each): shared/caves/<id>.js. Mesh (surface nets): shared/caves-mesh.js; the client's mesh, light and
   hooks: game/world/caves.js.
   THE MODEL. Each site has a local frame: origin (x,z) = the site's position (a plain x,z in its data: move the site by changing them), +u = the direction yaw (radians) points to in the world (u = dx cos + dz sin),
   +v = the right-hand side of u. Heights are metres above the site's floor `fy` (an absolute height: the walking floor of the cave and its shelf). The rock is the union of rounded blocks (`rock`), minus the voids
   (tunnels, arches, chambers, overhang scoops); strata and roughness bend the surface a little. The ground under the site is NOT in the SDF: rawHeight is carved to the floor under the rock, under every void and
   along every pad (a flat walking surface, an approach ramp, a tide-pool shelf), so the server and monsters only ever see the heightmap; the rock over it is mesh (client) and collision (client movement).
   PUBLIC (names are global in both bundles): defineCave(def) -> site or null (a bad entry lands in CV_BAD and warns, never throws); CV_SITES, CV_BAD; cvSdf(S,x,y,z); cvFloorCarve(x,z,h) (pure, one box test per site);
   cvNear(x,z,m) (keep-out for trees, props and monster spawns: shared/village-helpers.js nearPath); cvGroundAt(x,z,y), cvResolve(o,ox,oz,rad), cvCamBoom(...), cvShade(x,y,z) (collision and light, client);
   cvGroundTint(x,z,h,out) (the shelf's colour). */
const CV_SITES=[], CV_BAD=[], CV_STEP=0.9, CV_W={w:0}, CV_NATURAL={on:false};   // CV_NATURAL.on: rawHeight is being sampled WITHOUT the carve (cvTopGrid)   // CV_STEP: the highest ledge a hiker steps up; CV_W.w: the strongest carve weight cvCarveSite met (the ground tint reads it)
const cvFin=v=>typeof v==='number'&&isFinite(v), cvPair=a=>Array.isArray(a)&&a.length>=2&&cvFin(a[0])&&cvFin(a[1]);
// smooth max / min (polynomial, k = the blend width): rounded edges where two primitives meet
const cvSmax=(a,b,k)=>{ const h=Math.max(k-Math.abs(a-b),0)/k; return Math.max(a,b)+h*h*k*0.25; };
const cvSmin=(a,b,k)=>-cvSmax(-a,-b,k);
function cvBad(id,why){ CV_BAD.push({id:String(id),why}); if(typeof console!=='undefined') console.warn('caves: "'+id+'" left out: '+why); return null; }
// one rock block: a rounded rectangle on the ground plane (cu,cv centre, hu,hv half sizes, r corner radius), from y0 up to a top that may slope (su, sv: rise per metre along u and v).
// follow:true: the top is the land as it was before the carve (+ `lift` m, default 0.25; y[1] is then only the highest the top may reach, for the site's box): a hillside or a plateau with a cave in it, whatever the terrain does
function cvRock(p,id){
  if(!p||!Array.isArray(p.u)||!Array.isArray(p.v)||!Array.isArray(p.y)||!cvPair(p.u)||!cvPair(p.v)||!cvPair(p.y)) throw new Error('rock needs u:[a,b], v:[a,b], y:[bottom,top]');
  const hu=(p.u[1]-p.u[0])/2, hv=(p.v[1]-p.v[0])/2; if(!(hu>0&&hv>0)) throw new Error('rock has no size');
  const r=cvFin(p.r)?Math.min(Math.max(p.r,0),Math.min(hu,hv)):1, su=cvFin(p.su)?p.su:0, sv=cvFin(p.sv)?p.sv:0;
  return {cu:(p.u[0]+p.u[1])/2,cv:(p.v[0]+p.v[1])/2,hu,hv,r,y0:p.y[0]<=-1?-200:p.y[0],y1:p.y[1],su,sv,k:1/Math.sqrt(1+su*su+sv*sv),bv:cvFin(p.bevel)?Math.max(0.05,p.bevel):(p.follow?0.2:1.2),follow:!!p.follow,lift:cvFin(p.lift)?p.lift:0.25,ground:p.ground!==false&&p.y[0]<=0.5,
    x0:p.u[0],x1:p.u[1],z0:p.v[0],z1:p.v[1],ytop:p.y[1]+Math.abs(su)*hu+Math.abs(sv)*hv};
}
// a void: 'tunnel' / 'arch' (a segment a->b of half-ellipse cross sections: width w, height h, tapering to w1, h1; floor heights f0 -> f1), 'chamber' (a half ellipsoid on the floor), 'overhang' (a full ellipsoid scooped out of a face)
function cvVoid(p){
  if(!p||typeof p.kind!=='string') throw new Error('void needs a kind');
  if(p.kind==='tunnel'||p.kind==='arch'){
    if(!cvPair(p.a)||!cvPair(p.b)||!(p.w>0)||!(p.h>0)) throw new Error(p.kind+' needs a:[u,v], b:[u,v], w>0, h>0');
    const du=p.b[0]-p.a[0], dv=p.b[1]-p.a[1], l2=du*du+dv*dv; if(!(l2>0)) throw new Error(p.kind+' has no length');
    const w1=cvFin(p.w1)?p.w1:p.w, h1=cvFin(p.h1)?p.h1:p.h;
    return {k:0,au:p.a[0],av:p.a[1],du,dv,l2,rx0:p.w/2,rx1:w1/2,ry0:p.h,ry1:h1,f0:cvFin(p.f0)?p.f0:0,f1:cvFin(p.f1)?p.f1:(cvFin(p.f0)?p.f0:0),bank:cvFin(p.bank)?p.bank:2.5};
  }
  if(p.kind==='chamber'){
    if(!cvPair(p.at)||!(p.ru>0)||!(p.rv>0)||!(p.h>0)) throw new Error('chamber needs at:[u,v], ru, rv, h');
    return {k:1,cu:p.at[0],cv:p.at[1],ru:p.ru,rv:p.rv,h:p.h,f:cvFin(p.f)?p.f:0,bank:cvFin(p.bank)?p.bank:2.5};
  }
  if(p.kind==='overhang'){
    if(!Array.isArray(p.at)||p.at.length<3||!p.at.every(cvFin)||!(p.ru>0)||!(p.rv>0)||!(p.ry>0)) throw new Error('overhang needs at:[u,v,y], ru, rv, ry');
    return {k:2,cu:p.at[0],cv:p.at[1],cy:p.at[2],ru:p.ru,rv:p.rv,ry:p.ry};
  }
  throw new Error('unknown void kind "'+p.kind+'"');
}
// a pad: a flat (or ramped) walking surface the ground is carved to along a polyline [[u,v,y?],...] of full width w, banked out into the land over `bank` metres
function cvPad(p){
  if(!p||!Array.isArray(p.pts)||!p.pts.length||!p.pts.every(q=>Array.isArray(q)&&cvPair(q))||!(p.w>0)) throw new Error('pad needs pts:[[u,v,y?],...] and w>0');
  return {pts:p.pts.map(q=>({u:q[0],v:q[1],y:cvFin(q[2])?q[2]:0})),w:p.w,bank:cvFin(p.bank)?Math.max(0.5,p.bank):4};
}
// the test's walks (plain data, ignored by the engine): `under` = waypoints [[u,v],...] on the floor through the tunnels, `top` = waypoints over the rock's top; both in the site's local frame
function cvWalk(w){
  const ok=a=>Array.isArray(a)&&a.every(cvPair);
  if(w===undefined) return {under:[],top:[]};
  if(!w||!ok(w.under||[])||!ok(w.top||[])) throw new Error('walk needs under:[[u,v],...] and top:[[u,v],...]');
  return {under:(w.under||[]).map(q=>[q[0],q[1]]),top:(w.top||[]).map(q=>[q[0],q[1]])};
}
function defineCave(def){
  const id=def&&typeof def.id==='string'&&def.id?def.id:'(no id)';
  try{
    if(!def||typeof def.id!=='string'||!/^[a-z][a-z0-9_]{1,23}$/.test(def.id)) throw new Error('id must be 2-24 lowercase letters, digits or _');
    if(CV_SITES.some(s=>s.id===def.id)||CV_BAD.some(b=>b.id===def.id)) throw new Error('duplicate id');
    if(!cvFin(def.x)||!cvFin(def.z)) throw new Error('x and z must be finite numbers (the site\'s position: a plain x, z)');
    if(!cvFin(def.fy)) throw new Error('fy (the floor height, metres) must be a finite number');
    if(!Array.isArray(def.rock)||!def.rock.length) throw new Error('a site needs rock');
    const yaw=cvFin(def.yaw)?def.yaw:0, c=Math.cos(yaw), sn=Math.sin(yaw);
    const S={id:def.id,name:String(def.name||def.id).slice(0,40),x:def.x,z:def.z,yaw,c,sn,fy:def.fy,rock:def.rock.map(cvRock),voids:(def.voids||[]).map(cvVoid),pads:(def.pads||[]).map(cvPad),
      inner:cvFin(def.inner)?Math.max(1,def.inner):5,pal:typeof def.pal==='string'?def.pal.slice(0,12):'sand',sea:!!def.sea,walk:cvWalk(def.walk),
      strata:{period:def.strata&&cvFin(def.strata.period)?Math.max(0.6,def.strata.period):3.2,amp:def.strata&&cvFin(def.strata.amp)?def.strata.amp:0.3},rough:cvFin(def.rough)?def.rough:0.3,
      ymin:cvFin(def.ymin)?def.ymin:-4,dark:cvFin(def.dark)?Math.min(1,Math.max(0,def.dark)):0.65,ref:def.ref||null,pools:[],n0:(def.n0||0)};
    if(def.pits){   // the pitted shelf: seeded pools scattered over a rectangle [u0,u1] x [v0,v1] (pits.keep: [[u,v,r],...] circles to leave clear)
      const q=def.pits, rng=mulberry32((q.seed|0)||1), keep=Array.isArray(q.keep)?q.keep:[];
      if(!cvPair(q.u)||!cvPair(q.v)||!(q.n>0)) throw new Error('pits needs u:[a,b], v:[a,b], n>0');
      for(let t=0;t<q.n*12&&S.pools.length<q.n;t++){
        const u=q.u[0]+(q.u[1]-q.u[0])*rng(), v=q.v[0]+(q.v[1]-q.v[0])*rng(), r=(q.rmin||1.6)+((q.rmax||4)-(q.rmin||1.6))*rng(), d=(q.depth||0.5)*(0.6+0.4*rng());
        if(S.pools.some(o=>Math.hypot(o.u-u,o.v-v)<o.r+r+0.8)||keep.some(k=>Math.hypot(k[0]-u,k[1]-v)<(k[2]||0)+r)) continue;
        S.pools.push({u,v,r,depth:d,wx:def.x+u*c-v*sn,wz:def.z+u*sn+v*c});
      }
    }
    // the box (world x,z) the site's rock, voids and pads lie in, and the heights it spans
    let lo=[1e9,1e9], hi=[-1e9,-1e9], lu=[1e9,-1e9], lv=[1e9,-1e9], ytop=0;
    const ext=(u,v)=>{ lu[0]=Math.min(lu[0],u); lu[1]=Math.max(lu[1],u); lv[0]=Math.min(lv[0],v); lv[1]=Math.max(lv[1],v); const x=S.x+u*c-v*sn, z=S.z+u*sn+v*c; lo[0]=Math.min(lo[0],x); hi[0]=Math.max(hi[0],x); lo[1]=Math.min(lo[1],z); hi[1]=Math.max(hi[1],z); };
    for(const p of S.rock){ for(const u of [p.x0,p.x1]) for(const v of [p.z0,p.z1]) ext(u,v); ytop=Math.max(ytop,p.ytop); }
    for(const p of S.voids){ if(p.k===0){ const m=Math.max(p.rx0,p.rx1)+p.bank+1; ext(p.au-m,p.av-m); ext(p.au+p.du+m,p.av+p.dv+m); ext(p.au-m,p.av+m); ext(p.au+m,p.av-m); ext(p.au+p.du-m,p.av+p.dv+m); ext(p.au+p.du+m,p.av+p.dv-m); } else if(p.k===1){ const m=Math.max(p.ru,p.rv)+p.bank+1; ext(p.cu-m,p.cv-m); ext(p.cu+m,p.cv+m); ext(p.cu-m,p.cv+m); ext(p.cu+m,p.cv-m); } }
    for(const p of S.pads) for(const q of p.pts){ const m=p.w/2+p.bank+1; ext(q.u-m,q.v-m); ext(q.u+m,q.v+m); ext(q.u-m,q.v+m); ext(q.u+m,q.v-m); }
    const M=4; S.bx0=lo[0]-M; S.bx1=hi[0]+M; S.bz0=lo[1]-M; S.bz1=hi[1]+M; S.ytop=ytop+2; S.ybot=S.ymin-1.5; S.lu0=lu[0]-M; S.lu1=lu[1]+M; S.lv0=lv[0]-M; S.lv1=lv[1]+M;   // (the box in the site's own frame: the world box of a turned site is much bigger than the site)
    if(!(S.bx1>S.bx0&&S.bz1>S.bz0)||S.bx1-S.bx0>400||S.bz1-S.bz0>400) throw new Error('the site is empty or larger than 400 m');
    CV_SITES.push(S); return S;
  }catch(e){ return cvBad(id,e&&e.message?e.message:String(e)); }
}
/* ---------- the field: negative inside rock ---------- */
function cvVoidD(p,u,v,y){   // signed-ish distance to one void (negative inside it): exact enough for extraction, collision and the radius tests
  if(p.k===0){
    let t=((u-p.au)*p.du+(v-p.av)*p.dv)/p.l2; t=t<0?0:t>1?1:t;
    const dl=Math.hypot(u-(p.au+p.du*t),v-(p.av+p.dv*t)), rx=p.rx0+(p.rx1-p.rx0)*t, ry=p.ry0+(p.ry1-p.ry0)*t, f=p.f0+(p.f1-p.f0)*t, yy=y-f;
    return Math.max((Math.hypot(dl/rx,yy/ry)-1)*Math.min(rx,ry), -yy-0.25);
  }
  if(p.k===1){ const yy=y-p.f, e=(Math.hypot((u-p.cu)/p.ru,(v-p.cv)/p.rv,yy/p.h)-1)*Math.min(p.ru,p.rv,p.h); return Math.max(e,-yy-0.25); }
  return (Math.hypot((u-p.cu)/p.ru,(v-p.cv)/p.rv,(y-p.cy)/p.ry)-1)*Math.min(p.ru,p.rv,p.ry);
}
// the land as it was before the carve, on a 2 m grid over the site's box (built on first use: rawHeight is not ready when the site is defined)
function cvTopGrid(S){
  if(S.tg) return S.tg;
  const st=2, nx=Math.ceil((S.bx1-S.bx0)/st)+1, nz=Math.ceil((S.bz1-S.bz0)/st)+1, h=new Float32Array(nx*nz);
  CV_NATURAL.on=true; try{ for(let j=0;j<nz;j++) for(let i=0;i<nx;i++) h[j*nx+i]=rawHeight(S.bx0+i*st,S.bz0+j*st); } finally{ CV_NATURAL.on=false; }
  return S.tg={st,nx,nz,h};
}
function cvTopAt(S,x,z){
  const g=cvTopGrid(S); let fx=(x-S.bx0)/g.st, fz=(z-S.bz0)/g.st; fx=fx<0?0:fx>g.nx-1.001?g.nx-1.001:fx; fz=fz<0?0:fz>g.nz-1.001?g.nz-1.001:fz;
  const i=fx|0, j=fz|0, a=fx-i, b=fz-j, k=j*g.nx+i, H=g.h;
  return (H[k]*(1-a)+H[k+1]*a)*(1-b)+(H[k+g.nx]*(1-a)+H[k+g.nx+1]*a)*b;
}
function cvSdfL(S,u,v,y,x,z){   // the field in the site's own frame (y above the floor); x,z: the same point in the world
  let d=1e9, ft=-1e9;
  for(let i=0;i<S.rock.length;i++){
    const p=S.rock[i], qu=Math.abs(u-p.cu)-(p.hu-p.r), qv=Math.abs(v-p.cv)-(p.hv-p.r);
    const d2=Math.hypot(qu>0?qu:0,qv>0?qv:0)+Math.min(Math.max(qu,qv),0)-p.r-(p.follow?1.5:0), top=p.follow?cvTopAt(S,x,z)-S.fy+p.lift:0, dy=p.follow?(y-top):(y-(p.y1+p.su*(u-p.cu)+p.sv*(v-p.cv)))*p.k;   // (a hillside's rock reaches 1.5 m past the carve's edge so its top meets the land with no notch)
    const di=Math.max(cvSmax(d2,dy,p.bv),p.y0-y); if(p.follow&&di<3) ft=Math.max(ft,top);
    d=cvSmin(d,di,1.2);
  }
  if(S.voids.length){ let vd=1e9; for(let i=0;i<S.voids.length;i++) vd=cvSmin(vd,cvVoidD(S.voids[i],u,v,y),1.4); d=Math.max(d,-vd); }
  if(d<3&&d>-3){   // strata (the soft layers recess between hard ones) and a rough, pitted skin, only near the surface
    const q=y/S.strata.period*TAU, k=ft>-1e8?Math.min(1,Math.max(0.12,(ft-y)/3)):1;   // (a hillside's own top stays flush with the land: the skin fades out in its top 3 m)
    d+=k*(S.strata.amp*(0.5*Math.sin(q)+0.22*Math.sin(2*q+1.3))+S.rough*(1.5*noise2(u*0.085+y*0.11+S.n0,v*0.085-y*0.09)+0.45*noise2(u*0.3+y*0.42,v*0.3-y*0.36)));
  }
  return d;
}
function cvSdf(S,x,y,z){
  const yy=y-S.fy;
  if(x<S.bx0||x>S.bx1||z<S.bz0||z>S.bz1||yy>S.ytop||yy<S.ybot) return 8;   // (outside the site's box: air)
  const dx=x-S.x, dz=z-S.z; return cvSdfL(S,dx*S.c+dz*S.sn,-dx*S.sn+dz*S.c,yy,x,z);
}
// the site whose box holds this point (sites do not overlap), or null
function cvInside(S,x,z){ if(x<S.bx0||x>S.bx1||z<S.bz0||z>S.bz1) return false; const dx=x-S.x, dz=z-S.z, u=dx*S.c+dz*S.sn, v=-dx*S.sn+dz*S.c; return u>=S.lu0&&u<=S.lu1&&v>=S.lv0&&v<=S.lv1; }
function cvSiteAt(x,z){ for(let i=0;i<CV_SITES.length;i++){ if(cvInside(CV_SITES[i],x,z)) return CV_SITES[i]; } return null; }
// the field over every site whose box holds the point (two sites' boxes may overlap where one is turned; the rock of either is rock): what collision, the camera and the light ask
function cvSdfW(x,y,z){ let d=8; for(let i=0;i<CV_SITES.length;i++){ const S=CV_SITES[i]; if(cvInside(S,x,z)){ const e=cvSdf(S,x,y,z); if(e<d) d=e; } } return d; }
/* ---------- the floor: rawHeight is carved to it ---------- */
const cvSS=(a,b,t)=>{ t=(t-a)/(b-a); t=t<0?0:t>1?1:t; return t*t*(3-2*t); };
function cvSegD(u,v,au,av,bu,bv){ const du=bu-au, dv=bv-av, l2=du*du+dv*dv; let t=l2>0?((u-au)*du+(v-av)*dv)/l2:0; t=t<0?0:t>1?1:t; cvSegD.t=t; return Math.hypot(u-au-du*t,v-av-dv*t); }
function cvCarveSite(S,x,z,h){
  const dx=x-S.x, dz=z-S.z, u=dx*S.c+dz*S.sn, v=-dx*S.sn+dz*S.c, fy=S.fy; let W=0;
  for(let i=0;i<S.rock.length;i++){   // under the rock the ground is the floor (hidden), blended in from the block's edge so its outside is the land as it was
    const p=S.rock[i]; if(!p.ground) continue;
    const qu=Math.abs(u-p.cu)-(p.hu-p.r), qv=Math.abs(v-p.cv)-(p.hv-p.r), d2=Math.hypot(qu>0?qu:0,qv>0?qv:0)+Math.min(Math.max(qu,qv),0)-p.r;
    if(d2<0){ const w=cvSS(0,S.inner,-d2); h+=(fy-h)*w; if(w>W) W=w; }
  }
  for(let i=0;i<S.voids.length;i++){   // under every void: the walking floor
    const p=S.voids[i]; let e, f;
    if(p.k===0){ const d=cvSegD(u,v,p.au,p.av,p.au+p.du,p.av+p.dv), t=cvSegD.t; e=d-(p.rx0+(p.rx1-p.rx0)*t)-1; f=fy+p.f0+(p.f1-p.f0)*t; }
    else if(p.k===1){ const r=Math.hypot((u-p.cu)/p.ru,(v-p.cv)/p.rv); e=(r-1)*Math.min(p.ru,p.rv)-1; f=fy+p.f; }
    else continue;
    const w=cvSS(p.bank,0,e); if(w>0){ h+=(f-h)*w; if(w>W) W=w; }
  }
  for(let i=0;i<S.pads.length;i++){   // approach ramps, shelves
    const P=S.pads[i], n=P.pts.length; let best=1e9, by=0;
    if(n===1){ best=Math.hypot(u-P.pts[0].u,v-P.pts[0].v); by=P.pts[0].y; }
    else for(let j=0;j<n-1;j++){ const a=P.pts[j], b=P.pts[j+1], d=cvSegD(u,v,a.u,a.v,b.u,b.v); if(d<best){ best=d; by=a.y+(b.y-a.y)*cvSegD.t; } }
    const w=cvSS(P.w/2+P.bank,P.w/2,best); if(w>0){ h+=(fy+by-h)*w; if(w>W) W=w; }
  }
  for(let i=0;i<S.pools.length;i++){   // tide pools: shallow dimples on the shelf
    const q=S.pools[i], d=Math.hypot(u-q.u,v-q.v); if(d<q.r&&W>0.9){ h-=q.depth*cvSS(q.r,q.r*0.3,d); }
  }
  CV_W.w=W; return h;
}
function cvFloorCarve(x,z,h){
  if(CV_NATURAL.on) return h;
  for(let i=0;i<CV_SITES.length;i++){ const S=CV_SITES[i]; if(x>=S.bx0&&x<=S.bx1&&z>=S.bz0&&z<=S.bz1) h=cvCarveSite(S,x,z,h); }
  return h;
}
// keep trees, props and monster spawns off a site (and m metres around it): nearPath calls this
function cvNear(x,z,m){ for(let i=0;i<CV_SITES.length;i++){ const S=CV_SITES[i]; if(x>=S.bx0-m&&x<=S.bx1+m&&z>=S.bz0-m&&z<=S.bz1+m) return true; } return false; }
// the shelf and floor take the rock's own colour (pale sandstone, wet and dark in the pits); the sea arches' beach stays sand
function cvGroundTint(x,z,h,out){
  for(let si=0;si<CV_SITES.length;si++){ const S=CV_SITES[si]; if(!cvInside(S,x,z)) continue; cvCarveSite(S,x,z,h); const w=CV_W.w; if(w<=0.02) continue;
  const n=noise2(x*0.7+3,z*0.7)*0.5+0.5, pit=Math.max(0,S.fy-h)*1.6;
  const r=S.pal==='grey'?0.46:S.pal==='forest'?0.42:S.pal==='dusk'?0.5:0.76, g=S.pal==='grey'?0.45:S.pal==='forest'?0.4:S.pal==='dusk'?0.46:0.62, b=S.pal==='grey'?0.43:S.pal==='forest'?0.33:S.pal==='dusk'?0.52:0.42, k=(0.78+0.3*n)*(1-Math.min(0.55,pit));
  const a=w*0.85; out.r+=(r*k-out.r)*a; out.g+=(g*k-out.g)*a; out.b+=(b*k-out.b)*a; }
  return out;
}
/* ---------- collision and light (the client's movement and camera ask these) ---------- */
// highest rock surface under (x,z) that a hiker whose feet are at y can stand on (a ledge up to CV_STEP above the feet); -Infinity if the column holds none
function cvGroundAt(x,z,y){
  const S=cvSiteAt(x,z); if(!S) return -Infinity;
  const top=y+CV_STEP, lo=Math.max(S.fy+S.ybot,top-60); let t=top;
  if(cvSdfW(x,t,z)<0){ let k=0; for(;k<12&&cvSdfW(x,t,z)<0;k++) t+=0.5; if(k>=12) return -Infinity; return t; }   // (put into rock, e.g. by a teleport: stand on what is above)
  let prev=t;
  for(t=top-0.4;t>=lo;t-=0.4){
    if(cvSdfW(x,t,z)<0){ let a=t, b=prev; for(let i=0;i<6;i++){ const m=(a+b)/2; if(cvSdfW(x,m,z)<0) a=m; else b=m; } return b; }   // (a: inside, b: free)
    prev=t;
  }
  return -Infinity;
}
// walls and ledges: push o (x,z; feet at o.y) out of rock at body height by its radius; refuse a move that would climb faster than `slope` (rise over run) onto a ledge
function cvResolve(o,ox,oz,rad,slope){
  const S=cvSiteAt(o.x,o.z); if(!S) return;
  for(let it=0;it<3;it++){
    let moved=false;
    for(const dy of [CV_STEP+0.12,1.35,1.8]){
      const y=o.y+dy, d=cvSdfW(o.x,y,o.z); if(d>=rad) continue;
      const gx=cvSdfW(o.x+0.2,y,o.z)-cvSdfW(o.x-0.2,y,o.z), gz=cvSdfW(o.x,y,o.z+0.2)-cvSdfW(o.x,y,o.z-0.2), gl=Math.hypot(gx,gz);
      if(gl<1e-4) continue;
      const push=Math.min(rad-d,0.6); o.x+=gx/gl*push; o.z+=gz/gl*push; moved=true;
    }
    if(!moved) break;
  }
  if(ox!==undefined&&slope){   // a surface that rises too steeply for the step taken: stay (slide along each axis in turn)
    const run=Math.hypot(o.x-ox,o.z-oz), rise=(g)=>g-o.y;
    if(run>1e-4&&run<4){
      const g=cvGroundAt(o.x,o.z,o.y);
      if(g>-1e8&&g-o.y>Math.max(slope*run+0.12,0.45)){   // (a kerb up to 0.45 m is a stair, not a slope)
        const gx=cvGroundAt(o.x,oz,o.y), gz=cvGroundAt(ox,o.z,o.y);
        if(gx>-1e8&&gx-o.y<=Math.max(slope*Math.abs(o.x-ox)+0.12,0.45)){ o.z=oz; }
        else if(gz>-1e8&&gz-o.y<=Math.max(slope*Math.abs(o.z-oz)+0.12,0.45)){ o.x=ox; }
        else { o.x=ox; o.z=oz; }
      }
    }
  }
}
// shorten the third-person camera's arm so the camera stays out of the rock: returns [x,y,z]
function cvCamBoom(hx,hy,hz,cx,cy,cz){
  const S=cvSiteAt(cx,cz)||cvSiteAt(hx,hz); if(!S) return [cx,cy,cz];
  const dx=cx-hx, dy=cy-hy, dz=cz-hz, n=Math.max(2,Math.ceil(Math.hypot(dx,dy,dz)/0.25));
  for(let i=1;i<=n;i++){ const f=i/n; if(cvSdfW(hx+dx*f,hy+dy*f,hz+dz*f)<0.4){ const k=Math.max(0.02,(i-2)/n); return [hx+dx*k,hy+dy*k,hz+dz*k]; } }
  return [cx,cy,cz];
}
// how enclosed a point is (0 in the open, 1 deep in a cave): five rays up and out, blocked by rock within 16 m; the client darkens the light by it
function cvShade(x,y,z){
  const S=cvSiteAt(x,z); if(!S) return 0; let hit=0, tot=0;
  for(const [a,b,c] of [[0,1,0],[0.7,0.7,0],[-0.7,0.7,0],[0,0.7,0.7],[0,0.7,-0.7],[0.9,0.25,0.35],[-0.9,0.25,-0.35]]){
    tot++; for(let t=1;t<=30;t+=2){ if(cvSdfW(x+a*t,y+1.2+b*t,z+c*t)<0){ hit+=1-t/60; break; } }
  }
  return Math.min(1,hit/tot*1.55);
}
