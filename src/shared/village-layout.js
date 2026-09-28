//@ Village placement and layout (VIL): houses, stalls, anchors, paths, colliders. Pure.
/* ---------- the village: layout (decided before the terrain is built) ---------- */
const VR=30;
function riverDist(x,z){ let m=1e9; for(let dz=-70;dz<=70;dz+=5){ const d=Math.hypot(x-riverX(z+dz),dz); if(d<m) m=d; } return m; }
function findVillage(){
  let best=null;
  for(let r=0;r<=60;r+=5){
    const n=Math.max(1,Math.round(r/2.5));
    for(let k=0;k<n;k++){
      const a=k/n*TAU, x=Math.sin(a)*r, z=Math.cos(a)*r;
      if(Math.abs(x)>HALF-95||Math.abs(z)>HALF-95) continue;
      if(riverDist(x,z)<VR+22) continue;
      if(Math.hypot(x+75,z-65)<VR+48) continue;
      let mn=1e9,mx=-1e9,sum=0,c=0;
      for(let rr=0;rr<=VR;rr+=10) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
      const mean=sum/c; if(mean<1.5||mean>18) continue;
      const score=(mx-mn)+r*0.3;
      if(!best||score<best.score) best={x,z,h:Math.max(mean,2.5),score};
    }
  }
  return best||{x:0,z:0,h:6};
}
// v = {x,z,h} from findVillage; o.seed shapes the houses, o.ent forces the side the road comes in from (Hanami faces its tunnel)
function layoutVillage(v,o){
  o=o||{};
  const V={x:v.x,z:v.z,h:v.h,r:VR,plaza:9.5,houses:[],stalls:[],lamps:[],benches:[],barrels:[],crates:[],anchors:{},pois:[],paths:[],boxes:[],circles:[]};
  const vr=mulberry32(o.seed||4242), vR=(a,b)=>a+(b-a)*vr();
  const at=(a,r)=>[V.x+Math.sin(a)*r, V.z+Math.cos(a)*r];
  const anchor=(name,p,face,poi)=>{ const o={x:p[0],z:p[1],face}; V.anchors[name]=o; if(poi) V.pois.push(o); return o; };
  // the entrance faces the side whose outskirts sit closest to the village's height
  let ent=o.ent||0,bestE=o.ent!==undefined?-1:1e9;
  for(let k=0;k<16&&bestE>=0;k++){
    const a=k/16*TAU, p=at(a,VR+16), h=baseHeight(p[0],p[1]);
    let e=Math.abs(h-V.h); if(h<1.5) e+=50; if(riverDist(p[0],p[1])<10) e+=50;
    if(e<bestE){ bestE=e; ent=a; }
  }
  V.ent=ent;
  const sp=at(ent,VR+15); V.spawn={x:sp[0],z:sp[1]};
  // the teleport circle, just outside the houses beside the road in (see shared/vale.js)
  { const tp=at(ent-0.5,31); V.tele={x:tp[0],z:tp[1],r:2.4}; }
  // houses around a ring, doors facing the plaza
  const N=9, a0=ent+0.62, step=(TAU-1.24)/(N-1);
  const plasters=[0xe8e0cc,0xd9cdb0,0xcfc2a4,0xe2d6c0,0xd6c7b2], roofs=[0x8e6c3e,0x7d5c34,0x6a4a3a,0x5a4a4a,0x7a5040], accents=[0x3d5a3a,0x2f4a6b,0x8a2f2f,0x6b5a2e,0x4a5a6a];
  const hAng=[];
  for(let i=0;i<N;i++){
    const a=a0+i*step, tav=i===4; hAng.push(a);
    const w=tav?9:vR(5,6.6), d=tav?7:vR(5.5,7.2), wh=tav?4.4:vR(2.8,3.4), rh=tav?3:vR(2,2.8);
    const rad=tav?23:vR(20.5,22.5);
    const p=at(a,rad);
    const H={i,a,x:p[0],z:p[1],rot:a,w,d,wh,rh,tavern:tav,plaster:plasters[i%5],roof:roofs[(i*3)%5],accent:accents[(i*2)%5],chimney:tav||vr()<0.65,woodpile:!tav&&vr()<0.4,flowers:vr()<0.6};
    V.houses.push(H);
    V.boxes.push({x:H.x,z:H.z,rot:a,hw:w/2+0.2,hd:d/2+0.2});
    anchor('house:'+i,at(a,rad-d/2-1.5),a,true);
    V.paths.push([...at(a,V.plaza-0.5),...at(a,rad-d/2-0.2),1.3]);
  }
  const mid=(i,j)=>(hAng[i]+hAng[j])/2;
  // market stalls on the plaza edge
  [mid(1,2),mid(4,5),mid(6,7)].forEach((a,i)=>{
    const p=at(a,12); V.stalls.push({x:p[0],z:p[1],rot:a,i});
    V.boxes.push({x:p[0],z:p[1],rot:a,hw:1.45,hd:0.65});
    anchor('stall:'+i,at(a,10.3),a+Math.PI,true);
    anchor('stall:'+i+':behind',at(a,13.2),a,false);
  });
  // well in the middle
  V.circles.push([V.x,V.z,1.35]);
  anchor('well',at(ent,2.3),ent,true);
  anchor('well:far',at(ent+Math.PI,2.3),ent+Math.PI,true);
  // the quest board: on the plaza edge right beside the road in, its face turned to people walking in
  { const bp=at(ent+0.42,11.2), q=at(ent,7.5), vx=q[0]-bp[0], vz=q[1]-bp[1], l=Math.hypot(vx,vz), ux=vx/l, uz=vz/l, rot=Math.atan2(ux,uz);
    V.board={x:bp[0],z:bp[1],rot};
    V.boxes.push({x:bp[0],z:bp[1],rot,hw:2.05,hd:0.35});
    anchor('questboard',[bp[0]+ux*1.7,bp[1]+uz*1.7],Math.atan2(-ux,-uz),false); }
  // campfire with log benches
  const fa=ent-1.25, fp=at(fa,5.6); V.fire={x:fp[0],z:fp[1]};
  V.circles.push([fp[0],fp[1],0.9]);
  for(let k=0;k<3;k++){
    const b=fa+Math.PI+(k-1)*1.25, bx=fp[0]+Math.sin(b)*2.3, bz=fp[1]+Math.cos(b)*2.3;
    V.benches.push({x:bx,z:bz,rot:b});
    V.boxes.push({x:bx,z:bz,rot:b,hw:0.95,hd:0.28});
    anchor('campfire:seat'+k,[bx+Math.sin(b)*-0.05,bz+Math.cos(b)*-0.05],b,false);
    anchor('campfire:stand'+k,[fp[0]+Math.sin(b+0.6)*1.9,fp[1]+Math.cos(b+0.6)*1.9],b+0.6,true);
  }
  // lamps
  const lampAng=[[ent+0.33,VR-2],[ent-0.33,VR-2],[mid(0,1),15],[mid(2,3),15],[mid(3,4),15],[mid(5,6),15],[mid(7,8),15]];
  lampAng.forEach(([a,r],i)=>{ const p=at(a,r); V.lamps.push({x:p[0],z:p[1],rot:a}); V.circles.push([p[0],p[1],0.2]); anchor('lamp:'+i,at(a,r-1.2),a,false); });
  anchor('gate',at(ent,VR-1),ent+Math.PI,false);
  // plaza spots for wandering
  for(let k=0;k<8;k++){ const a=ent+k/8*TAU+0.2; anchor('plaza'+k,at(a,vR(4.5,7.5)),undefined,true); }
  // garden plot
  const ga=ent-0.95, gp=at(ga,28.5); V.garden={x:gp[0],z:gp[1],rot:ga};
  V.boxes.push({x:gp[0],z:gp[1],rot:ga,hw:3.1,hd:2.35});
  anchor('garden',at(ga,25.4),ga+Math.PI,true);
  // barrels and crates by the tavern and stalls
  const tav=V.houses[4];
  for(const sd of [-1,1]){
    const lx=sd*(tav.w/2-0.6), lz=-tav.d/2-0.9, c=Math.cos(tav.rot), s=Math.sin(tav.rot);
    const x=tav.x+lx*c+lz*s, z=tav.z-lx*s+lz*c;
    V.barrels.push([x,z]); V.circles.push([x,z,0.45]);
  }
  V.stalls.forEach(st=>{ const c=Math.cos(st.rot), s=Math.sin(st.rot), lx=1.9, lz=0.4; const x=st.x+lx*c+lz*s, z=st.z-lx*s+lz*c; V.crates.push([x,z,st.rot]); V.circles.push([x,z,0.5]); });
  // sign by the entrance
  const sg=at(ent+0.2,VR+5); V.sign={x:sg[0],z:sg[1],rot:ent}; V.circles.push([sg[0],sg[1],0.2]);
  // path into the village
  V.paths.push([...at(ent,V.plaza-0.5),...at(ent,VR+24),1.7]);
  return V;
}
function segDist(px,pz,s){
  const ax=s[0],az=s[1],bx=s[2],bz=s[3], vx=bx-ax, vz=bz-az, l2=vx*vx+vz*vz;
  const t=clamp(((px-ax)*vx+(pz-az)*vz)/l2);
  return Math.hypot(px-(ax+vx*t),pz-(az+vz*t));
}
const VIL=layoutVillage(findVillage(),{seed:4242});
