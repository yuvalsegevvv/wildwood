//@ The Deep Cave's meshes: floor, smoothed rock walls and the domed ceiling from a floor's bake (merged per chunk, light baked into the vertex colours), the water and lava, and the hooks the four themes dress it through; built at the floor's corner, disposed on leaving
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (the cave case builds every floor), tools/cave-smoke.js.
   exports: caveViewBuild(R) (zone.js, entering: R.B the bake, R.K the floor's look, R.ox / R.oz its corner, R.y its base height), caveViewClear() (leaving: every geometry, material and texture disposed),
            caveViewTick(dt) (the themes' animations: lava, water, embers, glowworms), caveCeilAt(x, z) -> the ceiling's height (floor-local metres, collide.js), CAVE_VIEW (what was built: g, geos, mats, meshes, tris, L the
            baked light per cell, ms the build time), CAVE_THEME_VIEW (theme id -> {pre(C), shine, rough}: view-themes.js fills it), cavevDot() (a soft round sprite texture), cavevPoints(C, pos, col, size, opacity)
   users: cave/zone.js, look.js (CAVE_VIEW.lamps), minimap.js (CAVE_VIEW.L), collide.js; reuses the dungeon view's primitives (dgvAcc, dgvPut, dgvCyl, dgvBox, dgvBall, dgvRock, dgvDisc, dgvRing: dungeon/view.js)
   How: the rock is the grid's contour, not its cells. Every corner of the 2 m grid knows how many of its four cells are cave air; the corners on the rim are smoothed along the contour (two passes) and pushed a little
   into the rock by noise, so the walls are rounded and never closer than the grid's. A wall is a strip of rows between a rim corner's floor and its ceiling (the rows bulge out into the rock, the same for a corner wherever
   it is used, so nothing gaps); the ceiling is one quad per cell whose corners rise from the rim's low lip (look.h0) toward the middle of a chamber (look.hk per cell away from the rock, at most look.hmax).
   Light is baked: the theme's emitters (CAVE_THEME_VIEW[theme].pre(C): C.emit.push({x, z, col, i, r, skip}) in floor-local metres) are splatted into a colour per cell with a line of sight test, the theme's fields
   (C.fields) add a wash over the whole floor, and the corner colours average the cells around them. The floor is cut into 16 x 16 cell chunks, each its own meshes (lit, glow, soft), so the frustum culls them;
   the theme's props are C.items placed by pre() ({x, z, fn(A, x, z, C)}) and drawn into the chunk they stand in, so memory stays bounded while building. Phones: Lambert material (per vertex) instead of Phong, no
   soft layers, fewer points. */
const CAVE_VIEW={g:null,geos:[],mats:[],texs:[],meshes:0,tris:0,cy:null,W1:0,L:null,C:null,ticks:[],lamps:[],ms:0};
const CAVE_THEME_VIEW=Object.create(null);
const CAVE_EMIT_K=1.15, CAVE_EMIT_R=1.1, CAVE_CH=16, CAVE_BOOST_W=2.3, CAVE_BOOST_F=2.6, CAVE_AO=[0.5,0.68,0.8,0.92,1];
const cavevHash=(x,z)=>{ const s=Math.sin(x*127.1+z*311.7)*43758.5453; return s-Math.floor(s); };
const _cvC=new THREE.Color(), _cvD=new THREE.Color();
function caveCeilAt(x,z){
  const V=CAVE_VIEW, cy=V.cy; if(!cy) return 6;
  const gx=Math.max(0,Math.min(V.W1-1.001,x/CAVE_CELL)), gz=Math.max(0,Math.min(V.H1-1.001,z/CAVE_CELL)), i=Math.floor(gx), j=Math.floor(gz), fx=gx-i, fz=gz-j, W1=V.W1;
  const a=cy[j*W1+i], b=cy[j*W1+i+1], c=cy[(j+1)*W1+i], d=cy[(j+1)*W1+i+1];
  return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;
}
let _cvDot=null;
function cavevDot(){
  if(_cvDot) return _cvDot;
  try{ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'); if(!x) return null;
    const g=x.createRadialGradient(16,16,0,16,16,16); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.35,'rgba(255,255,255,0.55)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.fillRect(0,0,32,32); _cvDot=new THREE.CanvasTexture(c); }catch(err){ _cvDot=null; }
  return _cvDot;
}
// points of light (glowworms, embers, sparkles, mist): pos / col flat arrays; returns the Points (already in the floor's group)
function cavevPoints(C,pos,col,size,opacity){
  if(!pos.length) return null;
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); geo.computeBoundingSphere();
  const mat=new THREE.PointsMaterial({size,map:cavevDot(),vertexColors:true,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
  const p=new THREE.Points(geo,mat); p.name='cavePoints'; CAVE_VIEW.g.add(p); CAVE_VIEW.geos.push(geo); CAVE_VIEW.mats.push(mat); CAVE_VIEW.meshes++; return p;
}
function cavevMesh(A,mat,name,parent){
  if(!A.p.length) return null;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));
  if(A.uv&&A.uv.length) g.setAttribute('uv',new THREE.Float32BufferAttribute(A.uv,2));
  g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mat); m.name=name; (parent||CAVE_VIEW.g).add(m); CAVE_VIEW.geos.push(g); CAVE_VIEW.meshes++; CAVE_VIEW.tris+=A.p.length/9; return m;
}
const cavevVert=(A,x,y,z,nx,ny,nz,c)=>{ A.p.push(x,y,z); A.n.push(nx,ny,nz); A.c.push(c.r,c.g,c.b); };
function caveViewBuild(R){
  caveViewClear(); const t0=performance.now();
  const B=R.B, K=R.K, F=R.F, W=B.w, H=B.h, W1=W+1, H1=H+1, N=W*H, NV=W1*H1, seed=F.seed|0, V=CAVE_VIEW, M=CAVE_CELL, low=LOW||LITE;
  const g=new THREE.Group(); g.name='cave'; g.position.set(R.ox,R.y,R.oz); scene.add(g); V.g=g; V.W1=W1; V.H1=H1;
  const T=CAVE_THEME_VIEW[F.theme]||{}, amb=K.amb===undefined?0.44:K.amb;
  const C={R,B,K,F,W,H,N,seed,g,amb,low,rng:mulberry32(seed^0x3c6ef372),emit:[],fields:[],items:[],after:[],ticks:V.ticks,L:null,hAt:null,lightAt:null,lit:null,
    water:K.water!==undefined,mats:V.mats,geos:V.geos};
  V.C=C;
  const openAt=(i,j)=>i<0||j<0||i>=W||j>=H?0:B.open[j*W+i];
  // ---- the corners: how many cells around are open, where they lie once smoothed, their floor and ceiling ----
  const cnt=new Uint8Array(NV), px=new Float32Array(NV), pz=new Float32Array(NV), fy=new Float32Array(NV), cy=new Float32Array(NV), dxr=new Float32Array(NV), dzr=new Float32Array(NV);
  for(let j=0;j<H1;j++) for(let i=0;i<W1;i++){ const v=j*W1+i; cnt[v]=openAt(i-1,j-1)+openAt(i,j-1)+openAt(i-1,j)+openAt(i,j); px[v]=i*M; pz[v]=j*M; fy[v]=B.hgt[v]; }
  const contour=(i,j,v)=>{ const r=[]; if(openAt(i,j-1)!==openAt(i,j)) r.push(v+1); if(openAt(i-1,j-1)!==openAt(i-1,j)) r.push(v-1); if(openAt(i-1,j)!==openAt(i,j)) r.push(v+W1); if(openAt(i-1,j-1)!==openAt(i,j-1)) r.push(v-W1); return r; };
  for(let pass=0;pass<2;pass++){ const nx=new Float32Array(px), nz=new Float32Array(pz);
    for(let j=1;j<H;j++) for(let i=1;i<W;i++){ const v=j*W1+i; if(!cnt[v]||cnt[v]===4) continue; const nb=contour(i,j,v); if(!nb.length) continue; let ax=0, az=0; for(const u of nb){ ax+=px[u]; az+=pz[u]; }
      nx[v]=px[v]*0.5+ax/nb.length*0.5; nz[v]=pz[v]*0.5+az/nb.length*0.5; }
    px.set(nx); pz.set(nz); }
  for(let j=1;j<H;j++) for(let i=1;i<W;i++){ const v=j*W1+i, c=cnt[v];
    if(c&&c<4){ let mx=0, mz=0, k=0; for(const [a,b] of [[i-1,j-1],[i,j-1],[i-1,j],[i,j]]) if(openAt(a,b)){ mx+=(a+0.5)*M; mz+=(b+0.5)*M; k++; }
      let dx=i*M-mx/k, dz=j*M-mz/k; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; dxr[v]=dx; dzr[v]=dz;
      const w=(K.wobble||0.4)*(0.15+0.85*caveVn(i*0.8,j*0.8,seed)); px[v]+=dx*w; pz[v]+=dz*w; } }
  for(let j=0;j<H1;j++) for(let i=0;i<W1;i++){ const v=j*W1+i, c=cnt[v]; if(!c) continue;
    const nz1=(caveVn(i*0.27,j*0.27,seed+9)-0.5)*1.5;
    if(c===4){ let dwc=0, k=0; for(const [a,b] of [[i-1,j-1],[i,j-1],[i-1,j],[i,j]]){ dwc+=B.dw[b*W+a]; k++; } dwc/=k; cy[v]=fy[v]+Math.min(K.hmax,K.h0+K.hk*dwc)+nz1; }
    else cy[v]=fy[v]+K.h0*(0.85+0.3*cavevHash(i,j))+nz1*0.6; }
  V.cy=cy;
  C.hAt=(x,z)=>caveGroundY(R.ox+x,R.oz+z)-R.y;
  const cellOf=(x,z)=>{ const gx=Math.max(0,Math.min(W-1,Math.floor(x/M))), gz=Math.max(0,Math.min(H-1,Math.floor(z/M))); return gz*W+gx; };
  C.cellOf=cellOf;
  // ---- the theme: emitters, fields and props ----
  if(T.pre) try{ T.pre(C); }catch(err){ console.error('cave theme '+F.theme+':',err); }
  try{ caveLifeProps(C); }catch(err){ console.error('cave props:',err); }
  { const lift=B.lift; C.emit.push({x:lift.x,z:lift.z,col:0xffc880,i:0.6,r:14,skip:0}); }   // the lift's lamp
  // ---- the light, per cell ----
  const L=new Float32Array(N*3); V.L=L;
  for(const a of C.emit){
    a.i*=CAVE_EMIT_K; a.r*=CAVE_EMIT_R;   // (the owner's playtest: more light; lamps for look.js are copied after, so the point lights follow)
    _cvC.setHex(a.col); const gx0=Math.max(0,Math.floor((a.x-a.r)/M)), gx1=Math.min(W-1,Math.floor((a.x+a.r)/M)), gz0=Math.max(0,Math.floor((a.z-a.r)/M)), gz1=Math.min(H-1,Math.floor((a.z+a.r)/M));
    for(let gz=gz0;gz<=gz1;gz++) for(let gx=gx0;gx<=gx1;gx++){
      const i=gz*W+gx; if(!B.open[i]) continue;
      const cx=(gx+0.5)*M, cz=(gz+0.5)*M, dd=Math.hypot(cx-a.x,cz-a.z); if(dd>=a.r) continue;
      if(dd>2&&!dgvSees(B,a.x,a.z,cx,cz,a.skip||0)) continue;
      const f=a.i*(1-dd/a.r)*(1-dd/a.r); L[i*3]+=_cvC.r*f; L[i*3+1]+=_cvC.g*f; L[i*3+2]+=_cvC.b*f; }
  }
  if(C.fields.length){ const o=[0,0,0]; for(let gz=0;gz<H;gz++) for(let gx=0;gx<W;gx++){ const i=gz*W+gx; if(!B.open[i]) continue; o[0]=o[1]=o[2]=0; for(const f of C.fields) f(i,(gx+0.5)*M,(gz+0.5)*M,o); L[i*3]+=o[0]; L[i*3+1]+=o[1]; L[i*3+2]+=o[2]; } }
  C.L=L;
  const lc=(i,ch)=>Math.min(1.0,L[i*3+ch]);
  C.lightAt=(x,z,out)=>{ const i=cellOf(x,z); out[0]=amb+lc(i,0); out[1]=amb+lc(i,1); out[2]=amb+lc(i,2); return out; };
  const _lo=[0,0,0];
  C.lit=(col,x,z,k)=>{ C.lightAt(x,z,_lo); _cvC.setHex(col); _cvC.r=Math.min(1,_cvC.r*_lo[0]*(k||1)); _cvC.g=Math.min(1,_cvC.g*_lo[1]*(k||1)); _cvC.b=Math.min(1,_cvC.b*_lo[2]*(k||1)); return _cvC.getHex(); };
  // the light at a point of a sheet (water, lava): the four cells round the nearest corner averaged, so no square shows
  C.litSmooth=(col,x,z,k)=>{ const i=Math.max(1,Math.min(W-1,Math.round(x/M))), j=Math.max(1,Math.min(H-1,Math.round(z/M))); let r=0,g=0,b=0,n=0;
    for(const [a,c] of [[i-1,j-1],[i,j-1],[i-1,j],[i,j]]){ const q=c*W+a; if(B.open[q]){ r+=lc(q,0); g+=lc(q,1); b+=lc(q,2); n++; } }
    if(n){ r/=n; g/=n; b/=n; } _cvC.setHex(col); _cvC.r=Math.min(1,_cvC.r*(amb+r)*(k||1)); _cvC.g=Math.min(1,_cvC.g*(amb+g)*(k||1)); _cvC.b=Math.min(1,_cvC.b*(amb+b)*(k||1)); return _cvC.getHex(); };
  // ---- colours of the rock ----
  const cWall=new THREE.Color(K.wall), cWall2=new THREE.Color(K.wall2===undefined?K.wall:K.wall2), cFloor=new THREE.Color(K.floor), cCeil=new THREE.Color(K.ceil===undefined?K.wall:K.ceil);
  const wallCol=(x,y,z,out,u)=>{   // x, z, y floor-local; u: the distance along the wall (masonry's courses)
    if(K.masonry){ const row=Math.floor(y/0.9), col=Math.floor(u/1.4+(row&1)*0.5), h=cavevHash(row*3.7+Math.floor(x*0.01),col*1.9+Math.floor(z*0.01)); out.copy(cWall).lerp(cWall2,h*0.8).multiplyScalar(0.72+h*0.5); return out; }
    const s=0.5+0.5*Math.sin(y*(K.strata||2.4)+noise2(x*0.13,z*0.13)*4); out.copy(cWall).lerp(cWall2,s*0.85).multiplyScalar(0.84+0.3*(noise2(x*0.5+y,z*0.5)*0.5+0.5)); return out; };
  const surfMat=low?new THREE.MeshLambertMaterial({vertexColors:true}):new THREE.MeshPhongMaterial({vertexColors:true,shininess:T.shine||14,specular:new THREE.Color(T.spec===undefined?0x1a1a1a:T.spec)});
  const glowMat=new THREE.MeshBasicMaterial({vertexColors:true}), softMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  V.mats.push(surfMat,glowMat,softMat); V.glowMat=glowMat; C.surfMat=surfMat; C.glowMat=glowMat; C.softMat=softMat;
  // ---- the chunks ----
  const col=new THREE.Color(), cw=new THREE.Color(), nrow=K.masonry?12:3;
  const cornerLight=(v,i,j,ch)=>{ let s=0, n=0; for(const [a,b] of [[i-1,j-1],[i,j-1],[i-1,j],[i,j]]) if(openAt(a,b)){ s+=lc(b*W+a,ch); n++; } return n?s/n:0; };
  const cornerCol=(v,i,j,base,ao,out)=>{ out.copy(base).multiplyScalar(ao); out.r*=amb+cornerLight(v,i,j,0); out.g*=amb+cornerLight(v,i,j,1); out.b*=amb+cornerLight(v,i,j,2); return out; };
  const fnx=new Float32Array(NV), fnz=new Float32Array(NV);
  for(let j=1;j<H;j++) for(let i=1;i<W;i++){ const v=j*W1+i; fnx[v]=-(fy[v+1]-fy[v-1])/(2*M); fnz[v]=-(fy[v+W1]-fy[v-W1])/(2*M); }
  const nrm=(v)=>{ const x=fnx[v], z=fnz[v], l=Math.sqrt(x*x+1+z*z); return [x/l,1/l,z/l]; };
  const nCh=Math.ceil(W/CAVE_CH);
  for(let cj=0;cj<nCh;cj++) for(let ci=0;ci<nCh;ci++){
    const A={lit:dgvAcc(),glow:dgvAcc(),soft:dgvAcc()}, g0=ci*CAVE_CH, g1=Math.min(W,g0+CAVE_CH), z0=cj*CAVE_CH, z1=Math.min(H,z0+CAVE_CH); let any=false;
    for(let gz=z0;gz<z1;gz++) for(let gx=g0;gx<g1;gx++){
      const ce=gz*W+gx; if(!B.open[ce]) continue; any=true;
      const v00=gz*W1+gx, v10=v00+1, v01=v00+W1, v11=v01+1, vs=[v00,v10,v11,v01], cs=[[gx,gz],[gx+1,gz],[gx+1,gz+1],[gx,gz+1]];
      // the floor (a patchy tone: the strata's second colour showing through, wet dark patches)
      const fcol=vs.map((v,k)=>{ const [a,b]=cs[k], n=noise2(a*0.33+3,b*0.33-7)*0.5+0.5, c=new THREE.Color(); c.copy(cFloor).lerp(cWall2,n*0.35).multiplyScalar(CAVE_BOOST_F*(0.9+0.2*cavevHash(a,b)));
        if(T.floorTint) T.floorTint(C,a*M,b*M,c,B.water[ce]); return cornerCol(v,a,b,c,CAVE_AO[cnt[v]],c); });
      for(const q of [[0,3,2],[0,2,1]]) for(const k of q){ const v=vs[k], n=nrm(v); cavevVert(A.lit,px[v],fy[v],pz[v],n[0],n[1],n[2],fcol[k]); }
      // the ceiling
      const ccol=vs.map((v,k)=>{ const [a,b]=cs[k], c=new THREE.Color(); c.copy(cCeil).multiplyScalar(CAVE_BOOST_W*(0.85+0.3*cavevHash(a+9,b))); if(T.ceilTint) T.ceilTint(C,a*M,b*M,c); return cornerCol(v,a,b,c,0.9,c); });
      for(const q of [[0,1,2],[0,2,3]]) for(const k of q){ const v=vs[k]; cavevVert(A.lit,px[v],cy[v],pz[v],0,-1,0,ccol[k]); }
      // the walls on the cell's closed sides
      for(let s=0;s<4;s++){
        const dx=[0,1,0,-1][s], dz=[-1,0,1,0][s]; if(openAt(gx+dx,gz+dz)) continue;
        const a=vs[s], b=vs[(s+1)%4], ia=cs[s], ib=cs[(s+1)%4], la=[lc(ce,0),lc(ce,1),lc(ce,2)], u0=(dx?gz:gx)*M, wb=(K.wobble||0.4)*0.9;
        const ha=wb*(0.4+0.6*cavevHash(ia[0]*1.3,ia[1]*0.7)), hb=wb*(0.4+0.6*cavevHash(ib[0]*1.3,ib[1]*0.7));   // (the bulge belongs to the corner: the same wherever it is used)
        const rows=[]; for(let r=0;r<=nrow;r++){ const tt=r/nrow, sn=Math.sin(Math.PI*tt);
          rows.push([[px[a]+dxr[a]*ha*sn,fy[a]+(cy[a]-fy[a])*tt,pz[a]+dzr[a]*ha*sn],[px[b]+dxr[b]*hb*sn,fy[b]+(cy[b]-fy[b])*tt,pz[b]+dzr[b]*hb*sn],tt]); }
        const put=(p,tt,end,qk)=>{ const fade=1-0.5*tt; let k;
          if(K.masonry){ k=qk; cw.copy(cWall).lerp(cWall2,qk.h*0.8).multiplyScalar(0.62+qk.h*0.75); k=CAVE_BOOST_W*qk.s;
            const band=0.8+0.4*Math.sin(p[1]*0.55+noise2(p[0]*0.05,p[2]*0.05)*5), moss=Math.max(0,1-p[1]/2.6)*Math.max(0,noise2(p[0]*0.17+4,p[2]*0.17)+0.15);   // courses lighter and darker by height, moss low on the stone
            cw.multiplyScalar(band); if(moss>0) cw.lerp(_cvD.setHex(0x3f6a34),Math.min(0.6,moss*0.9)); }
          else { wallCol(p[0],p[1],p[2],cw,u0+end*M); k=CAVE_BOOST_W*(0.62+0.38*(1-tt))*(0.92+0.16*cavevHash(p[0]*0.7,p[2]*0.7+p[1]*0.4)); }
          cavevVert(A.lit,p[0],p[1],p[2],-dx,0,-dz,col.setRGB(cw.r*k*(amb+la[0]*fade),cw.g*k*(amb+la[1]*fade),cw.b*k*(amb+la[2]*fade))); };
        for(let r=0;r<nrow;r++){ const [a0,b0,t0]=rows[r], [a1,b1,t1]=rows[r+1];
          if(K.masonry){   // courses of laid stone: two blocks to an edge, each its own tone, the top of a course a little darker
            const m0=[(a0[0]+b0[0])/2,(a0[1]+b0[1])/2,(a0[2]+b0[2])/2], m1=[(a1[0]+b1[0])/2,(a1[1]+b1[1])/2,(a1[2]+b1[2])/2];
            for(const [p0,q0,p1,q1,hh] of [[a0,m0,a1,m1,0],[m0,b0,m1,b1,1]]){ const h=cavevHash(r*3.1+(r&1)*0.5+gx*0.37+hh,gz*0.53+r*1.7+hh*2.3), lo={h,s:1}, hi={h,s:0.86};
              put(p0,t0,0,lo); put(q0,t0,1,lo); put(q1,t1,1,hi); put(p0,t0,0,lo); put(q1,t1,1,hi); put(p1,t1,0,hi); }
          } else { put(a0,t0,0); put(b0,t0,1); put(b1,t1,1); put(a0,t0,0); put(b1,t1,1); put(a1,t1,0); }
        }
      }
    }
    if(any){
      for(const it of C.items) if(it.x>=g0*M&&it.x<g1*M&&it.z>=z0*M&&it.z<z1*M) try{ it.fn(A,it.x,it.z,C); }catch(err){ console.warn('cave prop:',err); }
      cavevMesh(A.lit,surfMat,'rock'); cavevMesh(A.glow,glowMat,'glow'); if(!low){ const m=cavevMesh(A.soft,softMat,'soft'); if(m) m.renderOrder=2; }
    }
  }
  for(const f of C.after) try{ f(C); }catch(err){ console.error('cave theme '+F.theme+':',err); }
  // the lamps the look follows: the brightest emitters (a few point lights move to the nearest)
  V.lamps=C.emit.filter(a=>a.lamp).map(a=>({x:a.x,z:a.z,col:a.col,i:a.i,r:a.r}));
  V.ms=performance.now()-t0;
}
// a flat sheet at height y over the cells of a mask (their smoothed corners are not used: the sheet sits under the rock's rim), colour fn(x, z) -> hex or Color; uv in tiles of 1/uvk m
function cavevSheet(C,mask,y,colFn,uvk,over){
  const A={p:[],n:[],c:[],uv:[]}, W=C.W, M=CAVE_CELL, e=over===undefined?0.25:over;
  for(let gz=0;gz<C.H;gz++) for(let gx=0;gx<W;gx++){
    if(!mask[gz*W+gx]) continue;
    const x0=gx*M-(gx>0&&!mask[gz*W+gx-1]?0:e), x1=(gx+1)*M+(gx<W-1&&!mask[gz*W+gx+1]?0:e), z0=gz*M-(gz>0&&!mask[(gz-1)*W+gx]?0:e), z1=(gz+1)*M+(gz<C.H-1&&!mask[(gz+1)*W+gx]?0:e);
    for(const [x,z] of [[x0,z0],[x0,z1],[x1,z1],[x0,z0],[x1,z1],[x1,z0]]){ const c=colFn(x,z); _cvD.set(c); A.p.push(x,y,z); A.n.push(0,1,0); A.c.push(_cvD.r,_cvD.g,_cvD.b); A.uv.push(x*uvk,z*uvk); }
  }
  return A;
}
function caveViewTick(dt){
  const V=CAVE_VIEW; if(!V.g) return;
  for(const f of V.ticks) f(dt);
}
function caveViewClear(){
  const V=CAVE_VIEW;
  if(V.g) scene.remove(V.g);
  for(const geo of V.geos) geo.dispose(); for(const m of V.mats) m.dispose(); for(const tx of V.texs) tx.dispose();
  Object.assign(V,{g:null,geos:[],mats:[],texs:[],meshes:0,tris:0,cy:null,L:null,C:null,ticks:[],lamps:[],glowMat:null,ms:0});
}
