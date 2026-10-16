//@ Glasswell's own water and ground in the city's frame: the splines of the lake and the river, the channel's cut into the Bowl's floor (gwCityCut), where water stands (gwCityWaterAt). Pure.
/* Agent map: gwSpline, gwPolyD, gwRiver (the river's two splines), gwCityCut (metres to add to the Bowl's floor at a point: the lake's bed, the river's channel), gwCityWaterAt / gwWaterRel (the water's surface above the
   floor, or null). In the city's own frame (GLASSWELL, shared/sunscar.js, y up from the floor). Used by shared/sunland.js (the heightmap carries the channel), game/village/sun-rim.js (the model's water) and
   tools/city-preview.js. Test: tools/glasswell-smoke.js, tools/sunscar-smoke.js. Loaded after sunscar-shape.js (gwRimR). */
// the city's own water, in the city's frame (the model, game/village/sun-rim.js, draws the same lake and river): Catmull-Rom splines through the plan's points
function gwSpline(pts,step){ const out=[];
  for(let i=0;i<pts.length-1;i++){ const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)], n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){ const t=k/n, t2=t*t, t3=t2*t, f=(a,b,c,d)=>0.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3); out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]); } }
  out.push(pts[pts.length-1].slice()); return out; }
function gwPolyD(x,z,pts){ let m=1e9,bx=0,bz=0; for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=clamp(((x-a[0])*dx+(z-a[1])*dz)/l2),px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(x-px,z-pz); if(d<m){ m=d; bx=px; bz=pz; } } return [m,bx,bz]; }
var GW_RV=null;
function gwRiver(){ if(GW_RV) return GW_RV; const G=GLASSWELL, lk=G.lake;   // in from the River Gate to the lake's middle, and from the lake out by the Weir
  return GW_RV={rin:gwSpline(G.river.concat([[lk.x,lk.z-lk.rz*0.4]]),1.5),rout:gwSpline([[lk.x-10,lk.z+6]].concat(G.riverOut),1.5)}; }
// how much lower than the Bowl's floor the lake's bed and the river's channel are (negative metres, to add to the target); the water stands 0.35 m under the floor
function gwCityCut(cx,cz){
  if(cx*cx+cz*cz>176*176) return 0;
  const lk=GLASSWELL.lake, e=((cx-lk.x)/(lk.rx+0.6))**2+((cz-lk.z)/(lk.rz+0.6))**2; let cut=0;
  if(e<1.3) cut=-1.5*smoothstep(1.25,0.9,e);
  const R=gwRiver(), a=gwPolyD(cx,cz,R.rin)[0], b=gwPolyD(cx,cz,R.rout)[0], d=Math.min(a,b);
  if(d<4.4) cut=Math.min(cut,-1.25*smoothstep(4.4,2.6,d));
  return cut;
}
// the water's surface in the Bowl's frame at this point, or null on dry ground: the lake's and the river's
function gwCityWaterAt(cx,cz){
  const lk=GLASSWELL.lake; if(((cx-lk.x)/lk.rx)**2+((cz-lk.z)/lk.rz)**2<1) return -0.35;
  if(cx*cx+cz*cz>176*176) return null;
  const R=gwRiver(); if(gwPolyD(cx,cz,R.rin)[0]<2.5||gwPolyD(cx,cz,R.rout)[0]<2.5) return gwWaterRel(cx,cz,gwPolyD(cx,cz,R.rout)[0]<gwPolyD(cx,cz,R.rin)[0]);
  return null;
}
// the river's surface above the floor: level in the Bowl, climbing the River Gate's crack (and falling in the Weir's) with the crack's floor
function gwWaterRel(x,z,weir){ const G=GLASSWELL; if(Math.hypot(x,z)<gwRimR(Math.atan2(x,z),'foot')) return -0.35; const k=smoothstep(G.r,G.foot,Math.hypot(x,z)); return (weir?-6*k:G.skirtH*k)+0.07; }
