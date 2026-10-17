// Caves, sea arches and overhangs (src/shared/caves.js, caves-mesh.js, caves/<id>.js; the client's side: src/game/world/caves.js). Part 1 (straight from src/, no build): the registry and bad entries (CV_BAD), the carve touches nothing outside a site's box
// and costs next to nothing there, the heightmap under every tunnel, chamber and pad IS the cave floor, the mesh and the field agree (vertices on the surface, windings outward, vertical rays hit the same top), the floor of every
// site can be walked to from outside (a flood fill over the heightmap with the rock's body clearance and the slope limit). Part 2 (the built page, headless): the real movement code (updatePlayer) walks each site's `walk.under` waypoints
// (through tunnels and arches, down the ramp, into the hall) and `walk.top` waypoints (over the rock), never inside rock, the camera's arm stays out of rock, the client builds each site's mesh when you come near, and the light
// darkens inside a cave. Prints PASS/FAIL lines and the frame-cost numbers (triangles per device level, ms per query). Usage: python3 build.py && node tools/caves-smoke.js [--fast: part 1 only]
const {loadShared}=require('./load'), {bootClient}=require('./headless');
const X=loadShared(['CV_SITES','CV_BAD','CV_NATURAL','defineCave','cvMesh','cvSdf','cvFloorCarve','cvGroundAt','cvNear','cvTopAt','cvShade','cvCamBoom','cvResolve','rawHeight','nearPath','WATER']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const W=(S,u,v)=>[S.x+u*S.c-v*S.sn, S.z+u*S.sn+v*S.c], S_=id=>X.CV_SITES.find(s=>s.id===id), now=()=>Number(process.hrtime.bigint())/1e6;
const IDS=['arches','seacave','wrecker','mine','foothill'];

// ---- the registry ----
ok('five sites are defined, none left out',IDS.every(i=>S_(i))&&X.CV_SITES.length===5&&X.CV_BAD.length===0,X.CV_SITES.map(s=>s.id).join(',')+' bad:'+JSON.stringify(X.CV_BAD));
ok('every site has a walk for the test (under, and over the top where the rock can be climbed)',X.CV_SITES.every(s=>s.walk.under.length>=5)&&['arches','seacave','mine','foothill'].every(i=>S_(i).walk.top.length>=4));
{ const good=X.CV_SITES.length, bad0=X.CV_BAD.length, warn=console.warn; console.warn=()=>{}; let threw=null;
  const bads=[ {id:'cv_noid_x',x:1,z:2,fy:1,rock:[{u:[0,0],v:[0,1],y:[0,1]}],_:'no rock size'}, null, {id:'Bad Id',x:0,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}]}, {id:'cv_nan',x:NaN,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}]},
    {id:'cv_norock',x:0,z:0,fy:0}, {id:'cv_voidkind',x:0,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}],voids:[{kind:'cheese'}]}, {id:'cv_tunnel0',x:0,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}],voids:[{kind:'tunnel',a:[1,1],b:[1,1],w:2,h:2}]},
    {id:'cv_pad',x:0,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}],pads:[{pts:[],w:3}]}, {id:'arches',x:0,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}]}, {id:'cv_huge',x:0,z:0,fy:0,rock:[{u:[0,900],v:[0,10],y:[0,4]}]},
    {id:'cv_walk',x:0,z:0,fy:0,rock:[{u:[0,4],v:[0,4],y:[0,4]}],walk:{under:'no'}} ];
  const rets=[]; try{ for(const b of bads) rets.push(X.defineCave(b)); }catch(e){ threw=e.message; } console.warn=warn;
  ok('bad entries never throw, are not registered and land in CV_BAD with a reason (11 of them: no id, bad id, NaN, no rock, unknown void, empty tunnel, empty pad, duplicate id, over-size, bad walk)',threw===null&&rets.every(r=>r===null)&&X.CV_SITES.length===good&&X.CV_BAD.length===bad0+bads.length&&X.CV_BAD.every(b=>b.why&&b.why.length>3),threw||(X.CV_BAD.length-bad0)+' listed');
  X.CV_BAD.length=bad0; }

// ---- the carve ----
{ const boxes=X.CV_SITES, inBox=(x,z,m)=>boxes.some(s=>x>=s.bx0-m&&x<=s.bx1+m&&z>=s.bz0-m&&z<=s.bz1+m); let n=0, diff=0, seed=12345; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const pts=[]; for(let i=0;i<6000;i++){ const x=-1700+rnd()*3000, z=-1250+rnd()*1650; if(!inBox(x,z,1)) pts.push([x,z]); }
  for(const [x,z] of pts){ X.CV_NATURAL.on=true; const a=X.rawHeight(x,z); X.CV_NATURAL.on=false; if(a!==X.rawHeight(x,z)) diff++; n++; }
  ok('outside every site\'s box the heightmap is exactly what it was (no carve leaks)',diff===0,n+' points');
  const t0=now(); let s=0; for(let i=0;i<200000;i++) s+=X.cvFloorCarve(i*0.37-500,i*0.11-300,5); const per=(now()-t0)/200000*1e6;
  ok('the carve far from every site costs next to nothing (one box test per site)',per<400,per.toFixed(0)+' ns a call, '+X.CV_SITES.length+' sites');
  for(const S of X.CV_SITES){ let ch=0; for(let i=0;i<400;i++){ const x=S.bx0+rnd()*(S.bx1-S.bx0), z=S.bz0+rnd()*(S.bz1-S.bz0); X.CV_NATURAL.on=true; const a=X.rawHeight(x,z); X.CV_NATURAL.on=false; if(Math.abs(a-X.rawHeight(x,z))>0.2) ch++; }
    ok('site '+S.id+': the carve changes the ground inside its box',ch>20,ch+' of 400 points'); } }

// ---- the floor is the heightmap ----
const padNear=(S,u,v)=>S.pads.some(P=>{ let best=1e9; for(let j=0;j<Math.max(1,P.pts.length-1);j++){ const a=P.pts[j], b=P.pts[Math.min(j+1,P.pts.length-1)], du=b.u-a.u, dv=b.v-a.v, l2=du*du+dv*dv; let t=l2>0?((u-a.u)*du+(v-a.v)*dv)/l2:0; t=Math.max(0,Math.min(1,t)); best=Math.min(best,Math.hypot(u-a.u-du*t,v-a.v-dv*t)); } return best<P.w/2+P.bank+0.5; });
for(const S of X.CV_SITES){
  let n=0, bad=0, worst=0;
  for(const p of S.voids){
    if(p.k===0){ for(let i=1;i<=12;i++){ const t=i/13, u=p.au+p.du*t, v=p.av+p.dv*t, f=S.fy+p.f0+(p.f1-p.f0)*t, [x,z]=W(S,u,v); if(padNear(S,u,v)) continue; if(!(X.cvSdf(S,x,f+1.2,z)>0)) continue; n++; const e=Math.abs(X.rawHeight(x,z)-f); worst=Math.max(worst,e); if(e>0.06) bad++; } }
    else if(p.k===1){ for(const [du,dv] of [[0,0],[0.4,0],[-0.4,0],[0,0.4],[0,-0.4]]){ const u=p.cu+du*p.ru, v=p.cv+dv*p.rv, [x,z]=W(S,u,v); if(padNear(S,u,v)) continue; n++; const e=Math.abs(X.rawHeight(x,z)-(S.fy+p.f)); worst=Math.max(worst,e); if(e>0.06) bad++; } }
  }
  ok('site '+S.id+': the heightmap under every tunnel and chamber is the cave floor',n>=4&&bad===0,n+' points, worst '+worst.toFixed(3)+' m');
  let pn=0, pbad=0;
  for(const P of S.pads){ for(let j=0;j<Math.max(1,P.pts.length-1);j++){ const a=P.pts[j], b=P.pts[Math.min(j+1,P.pts.length-1)]; for(let i=0;i<=4;i++){ const t=P.pts.length>1?i/4:0, u=a.u+(b.u-a.u)*t, v=a.v+(b.v-a.v)*t, y=S.fy+a.y+(b.y-a.y)*t, [x,z]=W(S,u,v);
    if(S.pools.some(q=>Math.hypot(q.u-u,q.v-v)<q.r+1)) continue; pn++; if(Math.abs(X.rawHeight(x,z)-y)>0.35) pbad++; } } }   // (the ground is blended from several pads and the voids' floors: within 0.35 m of the pad's own line)
  if(S.pads.length) ok('site '+S.id+': the heightmap along every pad is the pad\'s height',pn>0&&pbad===0,pn+' points, '+pbad+' off');
  if(S.pools.length){ let deep=0; for(const q of S.pools){ const [x,z]=W(S,q.u,q.v); if(X.rawHeight(x,z)<S.fy-q.depth*0.4) deep++; } ok('site '+S.id+': the tide pools are dimples in the shelf',deep>=Math.floor(S.pools.length*0.9),deep+' of '+S.pools.length); }
}

// ---- the mesh and the field agree ----
const CELL=1.4, MESH={};
for(const S of X.CV_SITES){
  const t0=now(), m=X.cvMesh(S,CELL,X.rawHeight); MESH[S.id]=m; const ms=now()-t0, nv=m.pos.length/3;
  let on=0, wind=0, out=0, inn=0, nt=0, bigTri=0;
  for(let v=0;v<nv;v++) if(Math.abs(X.cvSdf(S,m.pos[v*3],m.pos[v*3+1],m.pos[v*3+2]))<0.3) on++;
  for(let t=0;t<m.idx.length;t+=3){
    const a=m.idx[t]*3, b=m.idx[t+1]*3, c=m.idx[t+2]*3, P=m.pos, N=m.nor, ux=P[b]-P[a], uy=P[b+1]-P[a+1], uz=P[b+2]-P[a+2], vx=P[c]-P[a], vy=P[c+1]-P[a+1], vz=P[c+2]-P[a+2];
    const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx, l=Math.hypot(nx,ny,nz); if(l<1e-9) continue; nt++; if(l/2>CELL*CELL*2.2) bigTri++;
    if(nx*(N[a]+N[b]+N[c])+ny*(N[a+1]+N[b+1]+N[c+1])+nz*(N[a+2]+N[b+2]+N[c+2])>0) wind++;
    const cx=(P[a]+P[b]+P[c])/3, cy=(P[a+1]+P[b+1]+P[c+1])/3, cz=(P[a+2]+P[b+2]+P[c+2])/3, gx=nx/l, gy=ny/l, gz=nz/l, h=0.6*CELL;
    if(X.cvSdf(S,cx+gx*h,cy+gy*h,cz+gz*h)>0) out++; if(X.cvSdf(S,cx-gx*h,cy-gy*h,cz-gz*h)<0) inn++;
  }
  ok('site '+S.id+': the mesh lies on the field\'s surface (vertices), winds outward, and has air outside and rock inside of every face',nv>100&&on/nv>0.97&&wind/nt>0.99&&out/nt>0.97&&inn/nt>0.97,
    m.tris+' tris at '+CELL+' m in '+ms.toFixed(0)+' ms; on '+(on/nv*100).toFixed(1)+'%, wound '+(wind/nt*100).toFixed(1)+'%, air out '+(out/nt*100).toFixed(1)+'%, rock in '+(inn/nt*100).toFixed(1)+'%');
}
{ // vertical rays: the highest rock the field has over a column is where the mesh's highest triangle is (columns whose top is above the ground)
  for(const S of X.CV_SITES){
    const m=MESH[S.id]; let seed=7; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }, cs=3, G=new Map();
    for(let t=0;t<m.idx.length;t+=3){ const xs=[0,1,2].map(k=>m.pos[m.idx[t+k]*3]), zs=[0,1,2].map(k=>m.pos[m.idx[t+k]*3+2]); for(let i=Math.floor(Math.min(...xs)/cs);i<=Math.floor(Math.max(...xs)/cs);i++) for(let j=Math.floor(Math.min(...zs)/cs);j<=Math.floor(Math.max(...zs)/cs);j++){ const k=i+','+j; (G.get(k)||G.set(k,[]).get(k)).push(t); } }
    const topMesh=(x,z)=>{ let best=-1e9; for(const t of G.get(Math.floor(x/cs)+','+Math.floor(z/cs))||[]){ const a=m.idx[t]*3, b=m.idx[t+1]*3, c=m.idx[t+2]*3, P=m.pos, d=(P[b+2]-P[c+2])*(P[a]-P[c])+(P[c]-P[b])*(P[a+2]-P[c+2]); if(Math.abs(d)<1e-9) continue;
        const l1=((P[b+2]-P[c+2])*(x-P[c])+(P[c]-P[b])*(z-P[c+2]))/d, l2=((P[c+2]-P[a+2])*(x-P[c])+(P[a]-P[c])*(z-P[c+2]))/d, l3=1-l1-l2; if(l1<-1e-6||l2<-1e-6||l3<-1e-6) continue; best=Math.max(best,l1*P[a+1]+l2*P[b+1]+l3*P[c+1]); } return best; };
    const topSdf=(x,z)=>{ let y=S.fy+S.ytop; for(;y>S.fy+S.ybot;y-=0.1) if(X.cvSdf(S,x,y,z)<0){ let a=y, b=y+0.1; for(let i=0;i<8;i++){ const mm=(a+b)/2; if(X.cvSdf(S,x,mm,z)<0) a=mm; else b=mm; } return b; } return -1e9; };
    let n=0, bad=0, worst=0;
    for(let i=0;i<600&&n<260;i++){ const x=S.bx0+rnd()*(S.bx1-S.bx0), z=S.bz0+rnd()*(S.bz1-S.bz0), ys=topSdf(x,z); if(ys<-1e8||ys<X.rawHeight(x,z)+1.5||X.cvSdf(S,x,ys-CELL*1.1,z)>-0.2) continue; n++;   // thin ridges narrower than a cell are below the mesh's resolution
    const ym=topMesh(x,z), e=Math.abs(ym-ys); worst=Math.max(worst,e); if(!(e<CELL*0.75)) bad++; }
    ok('site '+S.id+': the highest rock over a column is the same in the field and in the mesh',n>=60&&bad<=Math.ceil(n*0.03),n+' columns, '+bad+' off, worst '+worst.toFixed(2)+' m');
  }
}

// ---- the floor of every site can be walked to from outside ----
for(const S of X.CV_SITES){
  const st=2, x0=S.bx0-30, z0=S.bz0-30, nx=Math.ceil((S.bx1-S.bx0+60)/st)+1, nz=Math.ceil((S.bz1-S.bz0+60)/st)+1, H=new Float32Array(nx*nz), free=new Uint8Array(nx*nz);
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const x=x0+i*st, z=z0+j*st, h=X.rawHeight(x,z); H[j*nx+i]=h; free[j*nx+i]=h>X.WATER-0.8&&X.cvSdf(S,x,h+1.0,z)>=0.3&&X.cvSdf(S,x,h+1.7,z)>=0.3?1:0; }
  const cell=(x,z)=>[Math.round((x-x0)/st),Math.round((z-z0)/st)], [sx,sz]=W(S,...S.walk.under[0]), [si,sj]=cell(sx,sz), seen=new Uint8Array(nx*nz), q=[sj*nx+si]; seen[q[0]]=1;
  for(let h=0;h<q.length;h++){ const k=q[h], i=k%nx, j=(k-i)/nx; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){ const a=i+di, b=j+dj; if(a<0||b<0||a>=nx||b>=nz) continue; const n=b*nx+a; if(seen[n]||!free[n]) continue; if(Math.abs(H[n]-H[k])/(st*Math.hypot(di,dj))>1.2&&H[n]>H[k]) continue; seen[n]=1; q.push(n); } }
  const miss=S.walk.under.slice(1).filter(([u,v])=>{ const [x,z]=W(S,u,v), [ci,cj]=cell(x,z); for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const a=ci+di, b=cj+dj; if(a>=0&&b>=0&&a<nx&&b<nz&&seen[b*nx+a]) return false; } return true; });
  ok('site '+S.id+': every waypoint of its walk is reachable on foot from the first one over the heightmap (slope limit, clear of rock at body height, no deep water)',miss.length===0&&free[sj*nx+si]===1,'start free '+free[sj*nx+si]+(miss.length?', not reached: '+JSON.stringify(miss):'')+'; '+q.length+' cells');
}
for(const S of X.CV_SITES){ const [x,z]=W(S,S.walk.under[Math.floor(S.walk.under.length/2)][0],S.walk.under[Math.floor(S.walk.under.length/2)][1]); ok('site '+S.id+': trees, props and monster spawns keep off it (cvNear, nearPath)',X.cvNear(x,z,0)&&X.nearPath(x,z,0)); }

// ---- the cost ----
{ const out={}; for(const S of X.CV_SITES){ for(const [name,cell] of [['desktop',1.4],['phone',1.9],['light',2.6]]){ const m=X.cvMesh(S,cell,X.rawHeight); out[name]=(out[name]||0)+m.tris; (out[name+'Max']=Math.max(out[name+'Max']||0,m.tris)); } }
  console.log('INFO  triangles (all five sites / the biggest): desktop 1.4 m '+out.desktop+' / '+out.desktopMax+', phone 1.9 m '+out.phone+' / '+out.phoneMax+', light 2.6 m '+out.light+' / '+out.lightMax+'; only sites within 420 m are built and only those in view are drawn');
  const S=S_('arches'), [x,z]=W(S,10,0); let t0=now(), s=0; for(let i=0;i<20000;i++) s+=X.cvGroundAt(x+(i%7)*0.1,z,25); console.log('INFO  cvGroundAt (a hiker high over the arches, a 60 m scan): '+((now()-t0)/20000*1000).toFixed(1)+' us');
  const [ex,ez]=W(S,-30,-15); t0=now(); for(let i=0;i<20000;i++) s+=X.cvGroundAt(ex+(i%7)*0.1,ez,2); console.log('INFO  cvGroundAt (on the floor): '+((now()-t0)/20000*1000).toFixed(1)+' us');
  ok('the biggest site is within the triangle budget on a desktop (<= 30k), phone (<= 17k) and light mode (<= 9k)',out.desktopMax<=30000&&out.phoneMax<=17000&&out.lightMax<=9000); }

if(process.argv.includes('--fast')){ console.log(fails?fails+' FAILED':'all passed (part 1 only)'); process.exit(fails?1:0); }

// ---- the built page: real movement, camera, mesh streaming, light ----
(async()=>{
  const c=bootClient({expose:['P','updatePlayer','keys','getH','CVC','CV_SITES','cvSdf','cvGroundAt','cvCamBoom','cvUpdate','cvNeed','Stream','cvLightTint','camera','THREE','updateCamera','setThird:v=>{thirdPerson=v}']});
  const wait=ms=>new Promise(r=>setTimeout(r,ms)); let G=c.G();
  for(let i=0;i<900&&!G.Stream.terrainDone;i++){ await wait(100); G=c.G(); }
  ok('the page boots with the caves in it',G.Stream.terrainDone&&G.CV_SITES.length===5,G.CV_SITES.length+' sites');
  const P=G.P, Wd=(S,u,v)=>[S.x+u*S.c-v*S.sn, S.z+u*S.sn+v*S.c];
  const place=(S,u,v)=>{ const [x,z]=Wd(S,u,v); P.x=x; P.z=z; P.y=Math.max(G.getH(x,z),G.cvGroundAt(x,z,G.getH(x,z)+0.5)); P.vx=P.vz=P.vy=0; P.ground=true; };
  function walk(S,pts){   // the real movement code, a waypoint at a time; returns {reached,steps,minClear,maxY,roofs,camBad}
    place(S,pts[0][0],pts[0][1]); const R={reached:0,steps:0,minClear:9,maxY:-1e9,roofs:0,camBad:0,stuck:false}; G.keys.KeyW=true;
    for(let w=1;w<pts.length;w++){
      const [tx,tz]=Wd(S,pts[w][0],pts[w][1]); let best=1e9, since=0;
      for(let k=0;k<1500;k++){
        const dx=tx-P.x, dz=tz-P.z, d=Math.hypot(dx,dz); if(d<1.4){ R.reached=w; break; }
        if(d<best-0.02){ best=d; since=0; } else if(++since>160){ R.stuck=true; break; }
        P.yaw=Math.atan2(-dx,-dz); G.updatePlayer(0.033); R.steps++; R.maxY=Math.max(R.maxY,P.y);
        const clear=Math.min(G.cvSdf(S,P.x,P.y+0.5,P.z),G.cvSdf(S,P.x,P.y+1.2,P.z),G.cvSdf(S,P.x,P.y+1.7,P.z)); R.minClear=Math.min(R.minClear,clear);
        if(k%12===0){ const hx=P.x, hy=P.y+1.45, hz=P.z, pt=0.28, cx=hx+Math.sin(P.yaw)*Math.cos(pt)*4.6, cz=hz+Math.cos(P.yaw)*Math.cos(pt)*4.6, cy=hy+Math.sin(pt)*4.6, b=G.cvCamBoom(hx,hy,hz,cx,cy,cz); if(G.cvSdf(S,b[0],b[1],b[2])<0.05){ R.camBad++; R.camAt=R.camAt||[hx-S.x,hy,hz-S.z,b[0]-S.x,b[1],b[2]-S.z,G.cvSdf(S,hx,hy,hz)].map(q=>q.toFixed(1)).join(" "); } }
      }
      if(R.stuck||R.reached<w) break;
      let up=false; for(let t=1.5;t<26;t+=1) if(G.cvSdf(S,P.x,P.y+t,P.z)<0){ up=true; break; } if(up) R.roofs++;
    }
    G.keys.KeyW=false; return R;
  }
  for(const id of IDS){
    const S=G.CV_SITES.find(s=>s.id===id);
    { const R=walk(S,S.walk.under), last=S.walk.under.length-1;
      ok('site '+id+': the real movement code walks the whole way under (in, through, out), never inside rock, with a roof over it',R.reached===last&&R.minClear>0.0&&R.roofs>=2,'reached '+R.reached+'/'+last+', '+R.steps+' steps, clearance '+R.minClear.toFixed(2)+' m, roofs '+R.roofs+(R.stuck?', STUCK at waypoint '+(R.reached+1):''));
      ok('site '+id+': the camera\'s arm stops short of the rock all along it',R.camBad===0,R.camBad+' bad '+(R.camAt||'')); }
    if(S.walk.top.length){ const R=walk(S,S.walk.top), last=S.walk.top.length-1, up=P.y-G.getH(P.x,P.z);
      ok('site '+id+': the real movement code walks onto and over the rock\'s top and stands on it',R.reached===last&&(S.rock.every(r=>!r.follow)?up>3:true)&&G.cvSdf(S,P.x,P.y-0.3,P.z)<0.5,'reached '+R.reached+'/'+last+', '+up.toFixed(1)+' m above the ground under it, highest '+(R.maxY-S.fy).toFixed(1)+' m over the floor'+(R.stuck?', STUCK at waypoint '+(R.reached+1):'')); }
  }
  { // a ledge too steep to climb stops the hiker (a wall of the arches' cliff, straight into it from the shelf)
    const S=G.CV_SITES.find(s=>s.id==='arches'); place(S,-12,-27); P.yaw=Math.atan2(-Math.cos(S.yaw),-Math.sin(S.yaw)); G.keys.KeyW=true; for(let i=0;i<120;i++) G.updatePlayer(0.033); G.keys.KeyW=false;
    ok('a sheer wall is a wall: walking straight into the cliff between two arches goes no higher than a step',P.y-G.getH(P.x,P.z)<1.0&&G.cvSdf(S,P.x,P.y+1.2,P.z)>0,(P.y-G.getH(P.x,P.z)).toFixed(2)+' m up'); }
  { // the mesh is streamed in when you come near (a generator job, not a hitch) and the light darkens inside
    const S=G.CV_SITES.find(s=>s.id==='seacave'); place(S,60,0); await wait(200);
    for(let i=0;i<600&&!(G.CVC.built.get('seacave')&&G.CVC.built.get('seacave').mesh);i++){ await wait(100); G=c.G(); }
    const b=G.CVC.built.get('seacave'); ok('the client builds a site\'s mesh when the hiker is within 420 m',!!(b&&b.mesh&&b.tris>1000&&isFinite(b.mesh.geometry.boundingSphere.radius)),b?b.tris+' tris':'none');
    ok('sites out of range are not built yet',!G.CVC.built.has('foothill')&&!G.CVC.built.has('arches'));
    place(S,40,0); for(let i=0;i<20;i++){ G.cvUpdate(0.2); } const inside=G.CVC.sh;
    place(S,80,0); P.y=G.getH(P.x,P.z); for(let i=0;i<30;i++){ G.cvUpdate(0.2); } const outside=G.CVC.sh;
    ok('the light inside the hall is darker than on the plateau above it',inside>0.45&&outside<0.1,'darkness '+inside.toFixed(2)+' inside, '+outside.toFixed(2)+' outside'); }
  c.stop(); console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})().catch(e=>{ console.log('FAIL caves-smoke crashed: '+(e&&e.stack||e)); process.exit(1); });
