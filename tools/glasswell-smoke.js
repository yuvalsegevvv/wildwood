// Checks of Glasswell's layout (src/shared/sunscar.js, sunscar-shape.js) and, when a Chromium is at hand, that its model builds (tools/city-preview.js).
// 11 layout checks and 2 about the model. The layout checks are what the future collision boxes and NPC anchors rely on: everything stands on the floor, nothing overlaps, the gates are wide enough for the server's 4 m grid.
// Usage: node tools/glasswell-smoke.js        Prints PASS / FAIL per check, ~10 s with the model check (it is skipped without playwright + Chromium).
const {loadShared}=require('./load'), path=require('path'), os=require('os'), fs=require('fs'), {spawnSync}=require('child_process');
const S=loadShared(['GLASSWELL','gwRimH','gwRimR','gwGateList','gwCrackY']), G=S.GLASSWELL;
let fails=0; const ok=(name,cond,extra)=>{ console.log((cond?'PASS ':'FAIL ')+name+(extra?'  ('+extra+')':'')); if(!cond) fails++; };
// a footprint as a rotated rectangle (the same frame as the game's houses: local -z is the front), and the separating-axis test
const rect=(x,z,w,d,rot)=>{ const c=Math.cos(rot), s=Math.sin(rot); return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([lx,lz])=>[x+lx*c+lz*s,z-lx*s+lz*c]); };
const axes=P=>P.map((p,i)=>{ const q=P[(i+1)%4]; return [-(q[1]-p[1]),q[0]-p[0]]; });
const hit=(A,B,gap)=>!axes(A).concat(axes(B)).some(([ax,az])=>{ const pr=P=>{ const v=P.map(p=>p[0]*ax+p[1]*az); return [Math.min(...v),Math.max(...v)]; }, a=pr(A), b=pr(B), l=Math.hypot(ax,az); return a[1]+gap*l<b[0]||b[1]+gap*l<a[0]; });
const foot=[...G.homes.map((h,i)=>({n:'home '+i,p:rect(h[0],h[1],h[2],h[3],h[4])})), ...G.places.filter(p=>p.w).map(p=>({n:p.id,p:rect(p.x,p.z,p.w,p.d,p.rot)}))];

ok('80 homes, 30 places with unique ids and numbers',G.homes.length===80&&G.places.length===30&&new Set(G.places.map(p=>p.id)).size===30&&new Set(G.places.map(p=>p.n)).size===30);
ok('every footprint stands on the floor inside the rim',foot.every(f=>f.p.every(q=>Math.hypot(q[0],q[1])<G.r-1.5)),foot.filter(f=>!f.p.every(q=>Math.hypot(q[0],q[1])<G.r-1.5)).map(f=>f.n).join(','));
const bad=[]; for(let i=0;i<foot.length;i++) for(let j=i+1;j<foot.length;j++) if(hit(foot[i].p,foot[j].p,0.3)) bad.push(foot[i].n+'/'+foot[j].n);
ok('no two footprints overlap (0.3 m apart at least)',!bad.length,bad.slice(0,6).join(' '));
const inLake=(x,z,m)=>((x-G.lake.x)/(G.lake.rx+m))**2+((z-G.lake.z)/(G.lake.rz+m))**2<1;
ok('nothing stands in the lake',foot.every(f=>f.p.every(q=>!inLake(q[0],q[1],0.5))),foot.filter(f=>f.p.some(q=>inLake(q[0],q[1],0.5))).map(f=>f.n).join(','));
const segD=(x,z,a,b)=>{ const dx=b[0]-a[0], dz=b[1]-a[1], t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1))); return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t); };
const polyD=(x,z,pts)=>Math.min(...pts.slice(1).map((b,i)=>segD(x,z,pts[i],b)));
const onRoad=foot.filter(f=>G.roads.some(R=>f.p.some(q=>polyD(q[0],q[1],R.pts)<R.w/2-0.3))).map(f=>f.n);
ok('no footprint stands on a road',!onRoad.length,onRoad.slice(0,6).join(','));
ok('three gates at least 12 m wide, facing different ways',G.gates.length===3&&G.gateW>=12&&new Set(G.gates.map(g=>Math.round(g.a*10))).size===3);
const gl=S.gwGateList(); ok('the three gates and the Weir are cut through the rim',gl.length===4&&gl.every(g=>{ const ax=Math.sin(g.a)*100, az=Math.cos(g.a)*100, sd=Math.sin(g.a+0.6)*100, sz=Math.cos(g.a+0.6)*100; return S.gwRimH(ax,az)<S.gwCrackY(100,g)+0.5&&S.gwRimH(sd,sz)>10; }));
let maxH=0, flat=true; for(let a=0;a<6.28;a+=0.05){ maxH=Math.max(maxH,S.gwRimH(Math.sin(a)*G.crest,Math.cos(a)*G.crest)); flat=flat&&S.gwRimH(Math.sin(a)*(G.r-2),Math.cos(a)*(G.r-2))===0; }
ok('the floor is flat and the rim rises about '+G.crestH+' m',flat&&maxH>G.crestH*0.8&&maxH<G.crestH*1.3,'crest '+maxH.toFixed(1)+' m');
ok('the river road climbs onto the plateau, the Weir gorge falls away',S.gwCrackY(G.foot,gl[0])===G.skirtH&&S.gwCrackY(G.foot,gl[3])<-4);
ok('the roads start at the gates and end on the floor',G.roads.slice(0,3).every(R=>Math.hypot(R.pts[0][0],R.pts[0][1])>=G.r-8&&Math.hypot(...R.pts[R.pts.length-1])<G.r-30));
ok('both bridges cross the river',G.bridges.length===2&&G.bridges.every(b=>polyD(b[0],b[1],G.river)<2));
// the model itself, in a real browser (skipped when there is none)
let pw=!process.env.GW_SKIP_MODEL; try{ require.resolve('playwright'); }catch(e){ pw=false; }
if(!pw) console.log('SKIP the model builds (no playwright, or GW_SKIP_MODEL is set)');
else{ const out=path.join(os.tmpdir(),'glasswell-smoke'), r=spawnSync(process.execPath,[path.join(__dirname,'city-preview.js'),out,'--views','top','--size','640x400'],{encoding:'utf8',timeout:120000});
  const m=/model: (\{.*\})/.exec(r.stdout||''), st=m&&JSON.parse(m[1]);
  ok('the model builds and draws in a real browser',r.status===0&&!!st&&fs.existsSync(path.join(out,'top.png')),(r.stderr||'').split('\n')[0]);
  if(st){ ok('the model stays within its budget (under 160,000 triangles, under 70 meshes)',st.tris<160000&&st.meshes<70,st.tris+' triangles, '+st.meshes+' meshes, built in '+st.buildMs+' ms'); } }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
