// Headless test of the world atlas and the ground built on it (shared/world-atlas.js, world-atlas-ground.js, the atlas-driven landAt / inVale / ... / coastDist / baseHeight / vilAt).
// BUILD.md section 2: every anchor is on its land and on dry, walkable ground; every zone is reachable from its village on foot within the slope limit (flood fill on the 4 m grid, the gates open);
// no zone outline is a cliff line; every road's slope stays walkable; the land tests are total and keep their old meanings. Straight from src/, no build. One line per check; exits 1 on failure.
// Usage: node tools/atlas-smoke.js [--verbose]
const fs=require('fs');
const {loadShared,SRC}=require('./load');
const X=loadShared(['rawHeight','baseHeight','landAt','inVale','inHoar','inGrey','inSun','inGloam','vilAt','coastDist','waterSurf','WX0','WX1','WZ0','WZ1','WA_META','WA_ANCHORS','WA_HUBS','WA_GATES','WA_ZONES','WA_POIS',
  'WA_ENTRANCES','WA_SPOTS','WA_ISLANDS','WA_PVP','WA_LAKES','WA_RIVERS','WA_ROADS','waLandId','waLand','waZone','waZoneId','waTarget','waWater','waWaterDist','waWaterSurf','waRoadDist','waBorderDist','waLandBorderDist',
  'waCoast','waIsSea','VIL','VIL2','VIL3','VIL4','VIL5','VIL6','WATER','smoothstep']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const verbose=process.argv.includes('--verbose');
const H=X.rawHeight, SLOPE_MAX=1.2;   // (movement.js: a step climbing more than 1.2 m a metre is turned or dropped)
const LANDS=['home','vale','hoar','grey','sun','gloam'];

// ---- the frame and the baked data
ok('the world frame is the atlas canvas (x -1900..1650, z -1120..1180)',X.WX0===-1900&&X.WX1===1650&&X.WZ0===-1120&&X.WZ1===1180);
{ const sz=fs.statSync(SRC+'/shared/world-atlas-data.js').size; ok('the baked file stays under 600 KB',sz<600*1024,Math.round(sz/1024)+' KB'); }
ok('six lands, seven gates, six hubs, 64 zones',X.WA_ANCHORS.lands.length===7&&X.WA_GATES.length===7&&Object.keys(X.WA_HUBS).length===6&&X.WA_ZONES.length===64);
// ---- the land tests are total and keep their meanings
{ let bad=[], n=0; const cnt={};
  for(let z=X.WZ0;z<=X.WZ1;z+=25) for(let x=X.WX0;x<=X.WX1;x+=25){ n++;
    const l=X.landAt(x,z); cnt[l]=(cnt[l]||0)+1;
    const flags=[X.inVale(x,z),X.inHoar(x,z),X.inGrey(x,z),X.inGloam(x,z),X.inSun(x,z)];
    if(X.inHoar(x,z)&&!X.inVale(x,z)) bad.push('hoar not vale '+x+','+z);
    if(X.inGloam(x,z)&&!X.inGrey(x,z)) bad.push('gloam not grey '+x+','+z);
    if(flags.filter(Boolean).length>(X.inHoar(x,z)||X.inGloam(x,z)?2:1)) bad.push('two lands '+x+','+z);
    const exp=X.inGloam(x,z)?'gloam':X.inHoar(x,z)?'hoar':X.inVale(x,z)?'vale':X.inGrey(x,z)?'grey':X.inSun(x,z)?'sun':'home';
    if(exp!==l) bad.push('landAt '+l+' vs '+exp+' at '+x+','+z);
    const v=X.vilAt(x,z), want={home:X.VIL,vale:X.VIL2,hoar:X.VIL3,grey:X.VIL4,sun:X.VIL5,gloam:X.VIL6}[l];
    if(v!==want) bad.push('vilAt '+l+' '+x+','+z);
    const w=X.waLand(x,z); if(w!==null&&w!=='amber'&&w!==l) bad.push('waLand '+w+' vs landAt '+l);
  }
  ok('landAt / inVale / inHoar / inGrey / inGloam / inSun / vilAt agree at every point of the rectangle and keep their old meanings (hoar is inside vale, gloam inside grey)',bad.length===0,bad.slice(0,3).join('; '));
  ok('all six lands exist, each over 0.5% of the rectangle',LANDS.every(k=>(cnt[k]||0)/n>0.005),JSON.stringify(cnt));
}
{ let bad=0,n=0; for(let z=X.WZ0+50;z<X.WZ1;z+=40) for(let x=X.WX0+50;x<X.WX1;x+=40){ n++; const sea=X.waIsSea(x,z), c=X.waCoast(x,z); if(sea!==(c<=1.5)&&Math.abs(c)>16) bad++; }
  ok('the sea flag and the coast distance agree (sea is where the coast distance is negative)',bad===0,bad+' of '+n); }
ok('coastDist keeps its meaning (inland positive, +21 at the waterline)',(()=>{ const h=X.WA_HUBS.home, c=X.coastDist(h[0],h[1]); return c>100&&X.coastDist(X.WX0+10,X.WZ0+10)<0; })());
// ---- anchors: on their land, dry, walkable
const g4=(x,z)=>H(x,z);
function slopeAt(x,z){ let m=0; const h=H(x,z); for(const [dx,dz] of [[4,0],[-4,0],[0,4],[0,-4],[2.8,2.8],[-2.8,2.8],[2.8,-2.8],[-2.8,-2.8]]) m=Math.max(m,Math.abs(H(x+dx,z+dz)-h)/Math.hypot(dx,dz)); return m; }
const dry=(x,z)=>{ const h=H(x,z); return h>0.3&&X.waWater(x,z)===0&&X.waWaterDist(x,z)>0; };
const ford=(x,z)=>{ const h=H(x,z), w=X.waWater(x,z), s=(w&&w!==1)?X.waWaterSurf(x,z):0; return h>X.WATER-1.5&&(w===0||w===4||(w===3&&s-h<1.3)); };   // (dry, on ice, or in a river's ford)
const gradAt=(x,z)=>Math.max(Math.abs(H(x+4,z)-H(x-4,z)),Math.abs(H(x,z+4)-H(x,z-4)))/8;
{ const bad=[], chk=(what,a)=>{ const x=a.x, z=a.z; const lands=a.land?[a.land]:[a.a,a.b].filter(Boolean); const wl=X.waLand(x,z); const landOk=lands.includes(wl)||(a.b==='amber'&&wl==='amber')||(wl===null&&false);
      if(!landOk) bad.push(what+' '+(a.name||a.key||a.land)+' is on '+wl+', not '+lands.join('/')); const inLake=what==='spot'&&(X.waWater(x,z)===2||X.waWater(x,z)===4); if(!(what==='hub'||what==='poi'||what==='gate'&&a.kind!=='bridge'?dry(x,z):ford(x,z)||inLake)) bad.push(what+' '+(a.name||a.key||a.land)+' is wet or low ('+H(x,z).toFixed(1)+' m)'); const s=inLake?0:gradAt(x,z); if(s>SLOPE_MAX) bad.push(what+' '+(a.name||a.key||a.land)+' slope '+s.toFixed(2)); };
  for(const k of LANDS) chk('hub',{x:X.WA_HUBS[k][0],z:X.WA_HUBS[k][1],land:k,name:k});
  for(const g of X.WA_GATES) chk('gate',g);
  for(const p of X.WA_POIS) chk('poi',p);
  for(const e of X.WA_ENTRANCES) chk('entrance',e);
  for(const s of X.WA_SPOTS) chk('spot',s);
  ok('every hub, gate, boss and door, zone entrance and zone spot is on its land, above 0.3 m, out of deep water (hubs, bosses, doors and gates dry; entrances and spots may stand in a ford, on ice, or - the heart spot of a lake zone, in its lake) and on ground under the slope limit ('+(6+X.WA_GATES.length+X.WA_POIS.length+X.WA_ENTRANCES.length+X.WA_SPOTS.length)+' anchors)',bad.length===0,(verbose?bad.join('\n  '):bad.slice(0,4).join('; ')+(bad.length>4?' ... '+bad.length+' in all':'')));
  const ib=[]; for(const I of X.WA_ISLANDS){ if(!(H(I.x,I.z)>0.3)||X.waLand(I.x,I.z)===null) ib.push(I.name); }
  ok('every island spot is dry land',ib.length===0,ib.join(', '));
  ok("the Proving Isle's centre is dry, its bridge's ends are on the beach and on the isle",H(X.WA_PVP.x,X.WA_PVP.z)>0.3&&H(X.WA_PVP.bridge[0][0],X.WA_PVP.bridge[0][1])>-1.2&&H(X.WA_PVP.bridge[1][0],X.WA_PVP.bridge[1][1])>-2.5,
    H(X.WA_PVP.x,X.WA_PVP.z).toFixed(1)+' / '+H(X.WA_PVP.bridge[0][0],X.WA_PVP.bridge[0][1]).toFixed(1)+' / '+H(X.WA_PVP.bridge[1][0],X.WA_PVP.bridge[1][1]).toFixed(1)); }
// ---- the lakes and rivers
{ const bad=[]; for(const L of X.WA_LAKES){ const w=X.waWater(L.x,L.z), d=X.waWaterDist(L.x,L.z); if(!(d<0&&(w===2||w===4))) bad.push(L.zone+' '+L.land+' '+w+' '+d.toFixed(1)); else if(L.frozen!==(w===4)) bad.push('frozen mismatch '+L.land);
    else if(w===4?!(Math.abs(X.waWaterSurf(L.x,L.z)-X.rawHeight(L.x,L.z))<0.5&&X.waterSurf(L.x,L.z)===X.WATER):!(X.waterSurf(L.x,L.z)>X.rawHeight(L.x,L.z)+0.3)) bad.push('lake not deep (or ice not flat) '+L.zone); }
  ok('every lake is water at its centre (frozen only in the Reach), with its surface above its bed',bad.length===0,bad.join('; ')); }
{ const bad=[]; for(const R of X.WA_RIVERS){ const p=R.pts, a=p[0], b=p[p.length-1]; if(!(X.waCoast(b[0],b[1])<60)) bad.push(R.name+' does not reach the sea ('+X.waCoast(b[0],b[1]).toFixed(0)+' m inland)'); let wet=0; for(const q of p) if(X.waWaterDist(q[0],q[1])<12) wet++; if(wet<p.length*0.8) bad.push(R.name+' is dry along '+(p.length-wet)+' of '+p.length+' points'); }
  ok('the three main rivers run to the sea and are water along their line',bad.length===0,bad.join('; ')); }
// ---- the ground: a 4 m grid, the slope limit, walkability inside the zones, the borders
const STEP=4, NXG=Math.floor((X.WX1-X.WX0)/STEP)+1, NZG=Math.floor((X.WZ1-X.WZ0)/STEP)+1;
const HG=new Float32Array(NXG*NZG), SURF=new Float32Array(NXG*NZG);
let t0=Date.now();
for(let j=0;j<NZG;j++) for(let i=0;i<NXG;i++){ const x=X.WX0+i*STEP, z=X.WZ0+j*STEP; HG[j*NXG+i]=H(x,z); }
const msGrid=Date.now()-t0;
for(let j=0;j<NZG;j++) for(let i=0;i<NXG;i++){ const x=X.WX0+i*STEP, z=X.WZ0+j*STEP; SURF[j*NXG+i]=(!X.waIsSea(x,z)&&X.waWaterDist(x,z)<0)?X.waWaterSurf(x,z):0; }
ok('the ground is finite everywhere and the sea floor is flat at the edge of the world',HG.every(Number.isFinite)&&H(X.WX0+4,X.WZ0+4)===H(X.WX1-4,X.WZ1-4),(HG.length/1000|0)+'k samples in '+msGrid+' ms');
const idx=(x,z)=>Math.round((z-X.WZ0)/STEP)*NXG+Math.round((x-X.WX0)/STEP);
const walkable=k=>HG[k]>X.WATER-1.0&&SURF[k]-HG[k]<1.3;   // (wading to the knees on the coast, and no deeper than the knees in a river)
// zone interiors: how much of the ground is under the slope limit, by land
{ const tot={},ok_={}; let nz=0;
  for(let j=2;j<NZG-2;j+=2) for(let i=2;i<NXG-2;i+=2){ const x=X.WX0+i*STEP, z=X.WZ0+j*STEP, zid=X.waZoneId(x,z); if(zid<0) continue; if(X.waBorderDist(x,z)<30||X.waCoast(x,z)<40||X.waWaterDist(x,z)<20||X.waLandBorderDist(x,z)<90) continue;
    const k=j*NXG+i, s=Math.max(Math.abs(HG[k+1]-HG[k-1]),Math.abs(HG[k+NXG]-HG[k-NXG]))/(2*STEP); const l=X.waLand(x,z); tot[l]=(tot[l]||0)+1; if(s<=SLOPE_MAX) ok_[l]=(ok_[l]||0)+1; }
  const share=Object.fromEntries(LANDS.map(l=>[l,Math.round(1000*(ok_[l]||0)/(tot[l]||1))/10]));
  ok('inside the zones the ground stays grind-friendly: 85%+ of every land under the slope limit',LANDS.every(l=>share[l]>=85),JSON.stringify(share)); }
// borders: no cliff lines
{ const cnt={zone:[0,0],land:[0,0]}; let straight=0;
  for(let j=2;j<NZG-2;j++) for(let i=2;i<NXG-2;i++){ const x=X.WX0+i*STEP, z=X.WZ0+j*STEP; const bd=X.waBorderDist(x,z), ld=X.waLandBorderDist(x,z); if(bd>5&&ld>5) continue; if(X.waCoast(x,z)<30||X.waWaterDist(x,z)<10) continue;
    const k=j*NXG+i, s=Math.max(Math.abs(HG[k+1]-HG[k-1]),Math.abs(HG[k+NXG]-HG[k-NXG]))/(2*STEP), c=ld<=5?cnt.land:cnt.zone; c[0]++; if(s>SLOPE_MAX) c[1]++; }
  const zs=100*cnt.zone[1]/Math.max(1,cnt.zone[0]), ls=100*cnt.land[1]/Math.max(1,cnt.land[0]);
  ok('no zone outline is a cliff line: under 6% of the zone-border cells are steeper than the slope limit',zs<6,zs.toFixed(1)+'% of '+cnt.zone[0]);
  ok('the land borders are ranges with saddles, not walls: under 25% of their cells are steeper than the slope limit',ls<25,ls.toFixed(1)+'% of '+cnt.land[0]); }
// the roads
{ let worst=0, n=0, steep=0, wet=0, wn=0, at=null;
  for(const R of X.WA_ROADS){ let prev=null; for(let q=1;q<R.pts.length;q++){ const a=R.pts[q-1], b=R.pts[q], L=Math.hypot(b[0]-a[0],b[1]-a[1]), m=Math.max(1,Math.ceil(L/STEP)); for(let s=0;s<=m;s++){ const x=a[0]+(b[0]-a[0])*s/m, z=a[1]+(b[1]-a[1])*s/m, h=H(x,z), sw=(!X.waIsSea(x,z)&&X.waWaterDist(x,z)<0)?X.waWaterSurf(x,z):0;
        if(prev!==null){ const sl=Math.abs(h-prev)/(L/m); n++; if(sl>worst){ worst=sl; at=R.name; } if(sl>SLOPE_MAX) steep++; } prev=h; wn++; if(sw-h>1.3||h<X.WATER-1.0) wet++; } prev=null; } }
  ok('every road is walkable end to end: no step of a road climbs more than the slope limit',steep===0,'steepest '+worst.toFixed(2)+' on '+at+', '+n+' steps');
  ok('no road runs through deep water (a river is a ford; the sea and the lakes are not crossed)',wet<=wn*0.002,wet+' of '+wn+' points'); }
// reachability: from each village, over the whole map (the gates are open), climbing no more than the slope limit; wading to the knees
function flood(sx,sz){
  const seen=new Uint8Array(NXG*NZG), q=new Int32Array(NXG*NZG); let h=0,t=0; const s0=idx(sx,sz); seen[s0]=1; q[t++]=s0;
  while(h<t){ const k=q[h++], i=k%NXG, j=(k-i)/NXG;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ if(!di&&!dj) continue; const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=NXG||jj>=NZG) continue; const n=jj*NXG+ii; if(seen[n]||!walkable(n)) continue;
      const d=(di&&dj)?STEP*1.414:STEP; if((HG[n]-HG[k])/d>SLOPE_MAX) continue; seen[n]=1; q[t++]=n; } }
  return seen;
}
{ const bad=[], cover={}; const reach={}; for(const l of LANDS) reach[l]=flood(X.WA_HUBS[l][0],X.WA_HUBS[l][1]);
  for(const z of X.WA_ZONES){ const fl=reach[z.land]; const cells=[]; for(let j=0;j<NZG;j+=2) for(let i=0;i<NXG;i+=2){ const x=X.WX0+i*STEP, y=X.WZ0+j*STEP; if(X.waZoneId(x,y)===z.id&&X.waCoast(x,y)>25&&X.waWaterDist(x,y)>8) cells.push(j*NXG+i); }
    if(!cells.length){ bad.push(z.land+' '+z.key+' has no ground'); continue; } let got=0; for(const k of cells) if(fl[k]) got++; const share=got/cells.length; cover[z.land+z.key]=share;
    if(!fl[idx(z.x,z.y===undefined?z.z:z.z)]&&!cells.some(k=>fl[k])) bad.push(z.land+' '+z.key+' unreachable'); else if(share<0.85) bad.push(z.land+' '+z.key+' only '+Math.round(share*100)+'% reachable'); }
  // the villages reach each other (the gates are open)
  for(const l of LANDS) for(const m of LANDS) if(!reach[l][idx(X.WA_HUBS[m][0],X.WA_HUBS[m][1])]) bad.push(l+' village cannot walk to '+m);
  ok('every one of the 64 zones is reachable on foot from its village (85%+ of its ground), and every village from every other, with the gates open',bad.length===0,bad.slice(0,5).join('; ')+(bad.length>5?' ... '+bad.length:'')); }
// speed (a budget, not a benchmark: the old ground cost about 4 us a call)
{ let s=0, t=process.hrtime.bigint(); const N=200000; let n=0;
  for(let i=0;i<N;i++){ const x=X.WX0+((i*7919)%3550), z=X.WZ0+((i*104729)%2300); s+=H(x,z); n++; }
  const us=Number(process.hrtime.bigint()-t)/1e3/n; ok('rawHeight stays cheap (under 12 us a call, over random points of the whole rectangle)',us<12,us.toFixed(2)+' us/call'); }
// the atlas's own lookups never allocate or throw outside the canvas
ok('lookups outside the canvas are clamped (sea), never NaN',[[-1e5,0],[1e5,1e5],[0,-1e5],[NaN,0]].every(([x,z])=>Number.isFinite(X.waTarget(x,z)||0)&&Number.isFinite(X.waCoast(x,z)||0)&&X.waLandId(x,z)>=0));
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
