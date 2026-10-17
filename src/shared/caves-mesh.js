//@ Caves' mesh: cvMesh(S,cell) turns a site's signed distance field into triangles with surface nets (a vertex per mixed cell, a quad per crossed edge, normals from the field) and paints them (strata bands, wet rock, crevices). Pure: arrays in, arrays out.
/* Agent map. Used by game/world/caves.js (the client builds its geometry from the arrays) and tools/caves-smoke.js (the mesh and the field must agree). The surface is the field's zero set between the site's floor-ybot and its top;
   cell = metres per grid cell (the client picks it by device). Returns {pos,nor,col,idx,tris,samples,bbox} (Float32Array x3, Uint32Array); a generator version, cvMeshGen, yields every few layers so the client
   streams it without a hitch. cvColorAt(S,x,y,z,ny,out) is the paint of one surface point (palettes CV_PAL: 'sand' sandstone strata like the sea cliffs of the reference photo, 'grey' bare rock, 'forest' mossy stone). */
// strata palettes: [band colours, top, wet, moss]; sRGB-ish floats because the game's vertex colours are shown as written
const CV_PAL={
  sand:{bands:[[0.91,0.75,0.45],[0.86,0.64,0.30],[0.80,0.52,0.22],[0.92,0.81,0.58],[0.72,0.43,0.20],[0.85,0.68,0.40],[0.62,0.40,0.24]],top:[0.88,0.78,0.56],wet:[0.24,0.17,0.12]},
  grey:{bands:[[0.52,0.52,0.50],[0.44,0.44,0.43],[0.58,0.57,0.54],[0.38,0.39,0.40],[0.50,0.48,0.45]],top:[0.62,0.62,0.60],wet:[0.17,0.18,0.19]},
  forest:{bands:[[0.50,0.47,0.40],[0.43,0.41,0.35],[0.56,0.52,0.43],[0.38,0.37,0.32]],top:[0.34,0.42,0.22],wet:[0.19,0.17,0.13]},
  dusk:{bands:[[0.55,0.49,0.54],[0.46,0.43,0.50],[0.62,0.54,0.56],[0.40,0.38,0.46]],top:[0.56,0.53,0.60],wet:[0.10,0.10,0.14]},
};
function cvColorAt(S,x,y,z,ny,out){
  const P=CV_PAL[S.pal]||CV_PAL.sand, rel=y-S.fy, nb=P.bands.length;
  let q=rel/S.strata.period+0.5*noise2(x*0.06+S.n0,z*0.06)+0.12*noise2(x*0.3,z*0.3+y*0.2), i=Math.floor(q), f=q-i;
  const a=P.bands[((i*7+(i>>2))%nb+nb)%nb], b=P.bands[(((i+1)*7+((i+1)>>2))%nb+nb)%nb], k=f>0.88?(f-0.88)/0.12:0;
  let r=a[0]+(b[0]-a[0])*k, g=a[1]+(b[1]-a[1])*k, bl=a[2]+(b[2]-a[2])*k;
  const gr=noise2(x*0.55+y*0.8,z*0.55-y*0.6)*0.5+0.5, v=0.9+0.2*gr; r*=v; g*=v; bl*=v;
  const up=ny>0.55?Math.min(1,(ny-0.55)/0.3):0; if(up>0){ const tp=P.top; r+=(tp[0]-r)*up*0.8; g+=(tp[1]-g)*up*0.8; bl+=(tp[2]-bl)*up*0.8; }
  if(ny<-0.25){ const d=0.72+0.28*(1+ny)/0.75; r*=d; g*=d; bl*=d; }
  if(S.sea){ const wy=y, w=wy<2.4?Math.min(1,(2.4-wy)/2.2)*(0.7+0.3*gr):0; if(w>0){ const W=P.wet; r+=(W[0]-r)*w; g+=(W[1]-g)*w; bl+=(W[2]-bl)*w; } }
  out[0]=r; out[1]=g; out[2]=bl;
}

function* cvMeshGen(S,cell,step,ground){   // ground(x,z): the carved ground's height; triangles buried under it (a block's sides inside the hill, the floor under a tunnel) are dropped
  const ox=S.bx0, oy=S.fy+S.ybot, oz=S.bz0, nx=Math.ceil((S.bx1-S.bx0)/cell)+1, ny=Math.ceil((S.ytop-S.ybot)/cell)+1, nz=Math.ceil((S.bz1-S.bz0)/cell)+1;
  const F=new Float32Array(nx*ny*nz), at=(i,j,k)=>(k*ny+j)*nx+i;
  for(let k=0;k<nz;k++){ for(let j=0;j<ny;j++){ const y=oy+j*cell, z=oz+k*cell; for(let i=0;i<nx;i++) F[at(i,j,k)]=cvSdf(S,ox+i*cell,y,z); } if(step&&(k%step)===step-1) yield; }
  const vid=new Int32Array((nx-1)*(ny-1)*(nz-1)).fill(-1), vc=(i,j,k)=>(k*(ny-1)+j)*(nx-1)+i, P=[];
  const E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]], cx=[0,1,0,1,0,1,0,1], cy=[0,0,1,1,0,0,1,1], cz=[0,0,0,0,1,1,1,1], f8=new Float32Array(8);
  for(let k=0;k<nz-1;k++){
    for(let j=0;j<ny-1;j++) for(let i=0;i<nx-1;i++){
      let m=0; for(let c=0;c<8;c++){ const f=F[at(i+cx[c],j+cy[c],k+cz[c])]; f8[c]=f; if(f<0) m|=1<<c; }
      if(m===0||m===255) continue;
      let sx=0, sy=0, sz=0, n=0;
      for(let e=0;e<12;e++){
        const a=E[e][0], b=E[e][1]; if(((m>>a)&1)===((m>>b)&1)) continue;
        const t=f8[a]/(f8[a]-f8[b]); sx+=cx[a]+(cx[b]-cx[a])*t; sy+=cy[a]+(cy[b]-cy[a])*t; sz+=cz[a]+(cz[b]-cz[a])*t; n++;
      }
      vid[vc(i,j,k)]=P.length/3; P.push(ox+(i+sx/n)*cell,oy+(j+sy/n)*cell,oz+(k+sz/n)*cell);
    }
    if(step&&(k%(step*2))===step*2-1) yield;
  }
  const idx=[], quad=(a,b,c,d,flip)=>{ if(a<0||b<0||c<0||d<0) return; if(flip) idx.push(a,c,b,a,d,c); else idx.push(a,b,c,a,c,d); };
  for(let k=1;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=1;i<nx-1;i++){
    const s0=F[at(i,j,k)]<0;
    if(s0!==(F[at(i+1,j,k)]<0)) quad(vid[vc(i,j-1,k-1)],vid[vc(i,j,k-1)],vid[vc(i,j,k)],vid[vc(i,j-1,k)],!s0);   // x edge
    if(s0!==(F[at(i,j+1,k)]<0)) quad(vid[vc(i-1,j,k-1)],vid[vc(i-1,j,k)],vid[vc(i,j,k)],vid[vc(i,j,k-1)],!s0);   // y edge
    if(s0!==(F[at(i,j,k+1)]<0)) quad(vid[vc(i-1,j-1,k)],vid[vc(i,j-1,k)],vid[vc(i,j,k)],vid[vc(i-1,j,k)],!s0);   // z edge
  }
  // one Newton step onto the true surface (the averaged crossing sits a little off it), then normals from the field's slope
  const nv=P.length/3, pos=new Float32Array(P), nor=new Float32Array(nv*3), h=cell*0.35;
  for(let v=0;v<nv;v++){
    let x=pos[v*3], y=pos[v*3+1], z=pos[v*3+2];
    for(let it=0;it<2;it++){
      const d=cvSdf(S,x,y,z), gx=cvSdf(S,x+h,y,z)-cvSdf(S,x-h,y,z), gy=cvSdf(S,x,y+h,z)-cvSdf(S,x,y-h,z), gz=cvSdf(S,x,y,z+h)-cvSdf(S,x,y,z-h), g2=(gx*gx+gy*gy+gz*gz)/(4*h*h);
      if(g2<1e-6) break; const s=Math.max(-cell*0.6,Math.min(cell*0.6,d/g2)); x-=gx/(2*h)*s; y-=gy/(2*h)*s; z-=gz/(2*h)*s;
    }
    pos[v*3]=x; pos[v*3+1]=y; pos[v*3+2]=z;
    const gx=cvSdf(S,x+h,y,z)-cvSdf(S,x-h,y,z), gy=cvSdf(S,x,y+h,z)-cvSdf(S,x,y-h,z), gz=cvSdf(S,x,y,z+h)-cvSdf(S,x,y,z-h), l=Math.hypot(gx,gy,gz)||1;
    nor[v*3]=gx/l; nor[v*3+1]=gy/l; nor[v*3+2]=gz/l;
    if(step&&(v%4000)===3999) yield;
  }
  let pos2=pos, nor2=nor, idx2=new Uint32Array(idx), nv2=nv;
  if(ground){   // drop what the ground hides, then renumber the vertices that are left
    const under=new Uint8Array(nv); for(let v=0;v<nv;v++) under[v]=pos[v*3+1]<ground(pos[v*3],pos[v*3+2])-0.35?1:0;
    const keep=[], remap=new Int32Array(nv).fill(-1); let m=0;
    for(let t=0;t<idx.length;t+=3){ const a=idx[t], b=idx[t+1], c=idx[t+2]; if(under[a]&&under[b]&&under[c]) continue; keep.push(a,b,c); for(const q of [a,b,c]) if(remap[q]<0) remap[q]=m++; }
    pos2=new Float32Array(m*3); nor2=new Float32Array(m*3); idx2=new Uint32Array(keep.length); nv2=m;
    for(let v=0;v<nv;v++){ const r=remap[v]; if(r<0) continue; pos2[r*3]=pos[v*3]; pos2[r*3+1]=pos[v*3+1]; pos2[r*3+2]=pos[v*3+2]; nor2[r*3]=nor[v*3]; nor2[r*3+1]=nor[v*3+1]; nor2[r*3+2]=nor[v*3+2]; }
    for(let i=0;i<keep.length;i++) idx2[i]=remap[keep[i]];
    yield;
  }
  const col=new Float32Array(nv2*3), c3=[0,0,0];
  for(let v=0;v<nv2;v++){   // paint: strata, wet rock, and ambient occlusion from the field (crevices and the insides of caves go dark)
    const x=pos2[v*3], y=pos2[v*3+1], z=pos2[v*3+2], nx_=nor2[v*3], ny_=nor2[v*3+1], nz_=nor2[v*3+2];
    cvColorAt(S,x,y,z,ny_,c3);
    let occ=0, sc=0.5; for(let s=1;s<=3;s++){ const hh=s*0.9; occ+=(hh-Math.min(cvSdf(S,x+nx_*hh,y+ny_*hh,z+nz_*hh),hh))*sc; sc*=0.5; }
    const ao=Math.max(0.42,1-0.95*occ/0.9); col[v*3]=c3[0]*ao; col[v*3+1]=c3[1]*ao; col[v*3+2]=c3[2]*ao;
    if(step&&(v%3000)===2999) yield;
  }
  return {pos:pos2,nor:nor2,col,idx:idx2,tris:idx2.length/3,samples:F.length,bbox:[ox,oy,oz,ox+(nx-1)*cell,oy+(ny-1)*cell,oz+(nz-1)*cell]};
}
function cvMesh(S,cell,ground){ const g=cvMeshGen(S,cell,0,ground); let r=g.next(); while(!r.done) r=g.next(); return r.value; }
