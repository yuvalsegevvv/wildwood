// Headless test of the home forest and the Sakura Vale on the world atlas (shared/world-atlas.js, vale.js, zones.js, village-layout.js), straight from src/, no build: the border between the two lands is the
// atlas's river (a wadeable ford, never a wall), crossed by the Greyfall Bridge at the atlas's gate (TUN); each village stands on its land's hub; every zone of the two lands is the atlas's cell, with a
// pole inside it, and zonePoint never leaves it; the boss arenas stand at the atlas's pois. (It used to test the old frame's wandering borderX / borderZ lines and the Greyfall waterfall's tarn and chute:
// the atlas replaced the lines, and the fall is no longer carved into the ground.) One line per check; exits 1 on failure.
// Usage: node tools/greyfall-smoke.js
const {loadShared}=require('./load');
const X=loadShared(['WA_GATES','WA_HUBS','WA_POIS','WA_ZONES','WA_META','waLandId','waWater','waWaterDist','waWaterSurf','rawHeight','baseHeight','TUN','bridgeDeck','VIL','VIL2','VIL3','VIL4','VIL5','VIL6','vilAt','landAt','inVale','inHoar','inGrey','inSun','inGloam',
  'ZONES','ZONE_OF_ID','zoneAt','zonePoint','valeZoneAt','ARENA','ARENA20','ARENA25','ARENA_TIDE','ARENAS','WATER','LAKES','WA_LAKES','inTunnelCut','waCoast']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const H=(x,z)=>X.rawHeight(x,z);
// ---- the lands and their villages ----
{ let bad=0, n=0; const names=['home','vale','hoar','grey','sun','gloam'];
  for(let z=-1100;z<=1170;z+=25) for(let x=-1880;x<=1640;x+=25){ n++; const l=X.waLandId(x,z); if(l===6) continue;   // (6: the closed Amber Reach)
    const f=[l===0,l===1,l===2,l===3,l===4,l===5];
    if(f.filter(Boolean).length!==1||names[l]!==X.landAt(x,z)) bad++;
    if((l===0&&X.vilAt(x,z)!==X.VIL)||(l===1&&X.vilAt(x,z)!==X.VIL2)||(l===2&&X.vilAt(x,z)!==X.VIL3)||(l===3&&X.vilAt(x,z)!==X.VIL4)||(l===4&&X.vilAt(x,z)!==X.VIL5)||(l===5&&X.vilAt(x,z)!==X.VIL6)) bad++; }
  ok('every point is in exactly one land, landAt names it, and the village of its land (vilAt) agrees',bad===0,n+' points, '+bad+' wrong'); }
ok('the home village stands on the atlas\'s home hub and Hanami on the vale\'s, each on dry ground in its own land',X.VIL.x===X.WA_HUBS.home[0]&&X.VIL.z===X.WA_HUBS.home[1]&&X.VIL2.x===X.WA_HUBS.vale[0]&&X.VIL2.z===X.WA_HUBS.vale[1]
  &&X.landAt(X.VIL.x,X.VIL.z)==='home'&&X.landAt(X.VIL2.x,X.VIL2.z)==='vale'&&H(X.VIL.x,X.VIL.z)>2&&H(X.VIL2.x,X.VIL2.z)>2&&Math.abs(H(X.VIL.x,X.VIL.z)-X.VIL.h)<6&&Math.abs(H(X.VIL2.x,X.VIL2.z)-X.VIL2.h)<6);
// ---- the border river ----
const G=X.WA_GATES.find(g=>g.name==='The Greyfall Bridge');
{ const bad=[]; let n=0;
  for(let z=-60;z<=520;z+=20){ n++; let x0=null,x1=null; for(let x=300;x<=620;x+=2) if(X.waWaterDist(x,z)<=0){ if(x0===null) x0=x; x1=x; }
    if(x0===null||x1-x0<14){ bad.push(z+': no river'); continue; }
    const mid=(x0+x1)/2, w=x1-x0; if(X.waLandId(x0-70,z)!==0||X.waLandId(x1+70,z)!==1) bad.push(z+': not home|vale'); if(w>110) bad.push(z+': too wide'); }
  ok('the home | vale border is a river from z -60 almost to the sea (it widens into its mouth below z 520): water at least 14 m wide at every 20 m, home on its west bank and the vale on its east',bad.length===0,n+' cross sections, '+bad.slice(0,4).join('; ')); }
ok('the river is a ford, never a wall: every bed point at most 1.2 m under the water\'s surface (a hiker wades it: nothing is barred by the water alone)',(()=>{ let worst=0; for(let z=-40;z<=520;z+=20) for(let x=330;x<=600;x+=3){ if(X.waWaterDist(x,z)>0) continue; worst=Math.max(worst,X.waWaterSurf(x,z)-H(x,z)); } return worst<=1.2; })());
// ---- the Greyfall Bridge ----
{ const T=X.TUN; let gap=0, below=0, wet=0, low=0, n=0, wmin=1e9, wmax=-1e9;
  for(let x=T.p0;x<=T.p1;x+=1){ n++; const d=X.bridgeDeck(x,T.z); if(!(d>-50)) gap++; else if(d<H(x,T.z)-0.35) below++; if(X.waWaterDist(x,T.z)<=0){ wmin=Math.min(wmin,x); wmax=Math.max(wmax,x); if(d<X.waWaterSurf(x,T.z)+0.3) low++; } else if(X.waWaterDist(x,T.z)>0&&d<H(x,T.z)-0.35) below++; }
  ok('the Greyfall Bridge stands at the atlas\'s gate: TUN.z and its middle are the gate\'s, and the deck (4 m wide) runs from dry bank to dry bank over the whole river, above the water, with no gap and never more than 35 cm under the ground; none beside it',
    T.z===G.z&&T.p0<G.x&&T.p1>G.x&&gap===0&&below===0&&low===0&&T.p0<wmin-10&&T.p1>wmax+10&&X.bridgeDeck(G.x,T.z+T.w+1)<-50&&X.bridgeDeck(T.p0-3,T.z)<-50,
    'gate x '+G.x+', deck '+T.p0.toFixed(0)+'..'+T.p1.toFixed(0)+', water '+wmin+'..'+wmax+', '+gap+' gaps, '+below+' under ground, '+low+' under water'); }
ok('the bridge\'s ends are dry land at a fair height (the river is born higher up: the deck is not a long climb), and the village at its east end faces it',H(X.TUN.p0,X.TUN.z)>X.waWaterSurf(X.TUN.p0,X.TUN.z)-0.5&&H(X.TUN.p1,X.TUN.z)>X.waWaterSurf(X.TUN.p1,X.TUN.z)-0.5&&Math.abs(X.TUN.h0-X.TUN.h1)<6&&Math.hypot(X.VIL2.x-X.TUN.x1,X.VIL2.z-X.TUN.z)<200);
// ---- zones: the atlas's cells ----
{ const wz=X.WA_ZONES.filter(A=>A.land==='home'||A.land==='vale'), bad=[];
  for(const A of wz){ const zn=X.ZONE_OF_ID[A.id]; if(!zn||!zn.name||!(zn.level>=1)){ bad.push(A.land+' '+A.key+': no record'); continue; }
    const pz=X.zoneAt(zn.x,zn.z); if(pz!==zn) bad.push(zn.name+': its pole is zone '+(pz&&pz.name));
    if(H(zn.x,zn.z)<=0.5) bad.push(zn.name+': pole under water');
    let out=0, n=300; for(let i=0;i<n;i++){ const a=Math.sin(i*12.9898)*43758.5453, fa=(a-Math.floor(a))-0.5, b=Math.sin(i*78.233)*12345.678, fr=b-Math.floor(b), [x,z]=X.zonePoint(zn,fa,fr,true), q=X.zoneAt(x,z); if(q!==zn&&q!==null&&!q.arena) out++; }
    if(out>n*0.02) bad.push(zn.name+': '+out+'/'+n+' points outside'); }
  ok('every zone of the home forest (1-15, shore, sunfoot, foothills) and the vale (16-25) is a record with a name and a level, its pole is inside it on dry ground, and zonePoint stays inside it',wz.length===28&&bad.length===0,wz.length+' atlas zones, '+bad.slice(0,4).join('; ')); }
ok('the vale\'s zones are read by valeZoneAt like the forest\'s, level 16-25, and Hanami\'s own ground (70 m round the hub) holds no zone',X.ZONES.filter(z=>z.vale&&!z.boss&&z.wa).map(z=>z.level).sort((a,b)=>a-b).join()==='16,17,18,19,20,21,22,23,24,25'&&X.valeZoneAt(X.VIL2.x+20,X.VIL2.z)===null&&X.zoneAt(X.VIL.x+20,X.VIL.z)===null);
// ---- the arenas: the atlas's pois ----
{ const P=n=>X.WA_POIS.find(p=>p.name===n), pairs=[[X.ARENA,P('The Stone Circle')],[X.ARENA20,P('Demon Gate')],[X.ARENA25,P('Foxfire Hollow')],[X.ARENA_TIDE,P("Carapax's Beach (20)")]];
  ok('the Stone Circle, the Demon Gate, the Foxfire Hollow and the Tide King\'s beach stand at the atlas\'s pois, on land, each with its own zone and a flat pad under it',pairs.every(([A,p])=>p&&A.x===p.x&&A.z===p.z&&H(A.x,A.z)>1&&Math.abs(H(A.x,A.z)-A.h)<0.01&&X.zoneAt(A.x+A.r+10,A.z)===A.zone&&A.zone.boss),pairs.map(([A])=>A.key+' '+H(A.x,A.z).toFixed(0)+' m').join(', ')); }
ok('the lakes of the two lands are the atlas\'s (three of them)',X.LAKES.length===3&&X.LAKES.every(L=>X.WA_LAKES.some(A=>A.x===L.x&&A.z===L.z)));
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
