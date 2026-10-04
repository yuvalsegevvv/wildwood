// Headless test of the borders between the four lands and of the Greyfall (shared/terrain.js), straight from src/, no build: the border lines are curves
// (borderX / borderZ), pinned where something is built across them, with the land tests (inVale / inHoar / inGrey / landAt) on one side of both; the Vale Wall south
// of the junction is a river (riverK, riverCut), crossed by one stone bridge (TUN, bridgeDeck); the Greyfall (a tarn on the rim, a chute, a plunge pool at the
// foot) feeds it. One line per check; exits 1 on failure.
// Usage: node tools/greyfall-smoke.js
const {loadShared}=require('./load');
const X=loadShared(['borderX','borderZ','riverK','riverCut','riverHalfW','baseHeight','baseHeightRaw','rawHeight','inVale','inHoar','inGrey','landAt','vilAt','VIL','VIL2','VIL3','VIL4',
  'HALF','HZ0','WX0','WX1','WZ0','WZ1','TUN','PASS','GLEN','FALL','fallProfile','fallY','waterSurf','zoneAt','valeZoneAt','northBarZ','WATER','wallW','NODES','bridgeDeck']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const H=(x,z)=>X.rawHeight(x,z);
// ---- the lines wander ----
{ const xs=[]; for(let z=-436;z<=440;z+=4) xs.push(X.borderX(z)-X.HALF); const mean=xs.reduce((a,b)=>a+b,0)/xs.length, sd=Math.sqrt(xs.reduce((a,b)=>a+(b-mean)*(b-mean),0)/xs.length), lo=Math.min(...xs), hi=Math.max(...xs);
  ok('the Vale Wall is not a straight line: the river wanders 100 m or more either side of its mean, and bulges west into the home forest',sd>60&&hi-lo>200&&lo<-120,'sd '+sd.toFixed(0)+' m, from '+lo.toFixed(0)+' to +'+hi.toFixed(0)+' m of x = HALF'); }
{ const zs=[]; for(let x=-436;x<=-20;x+=4) zs.push(X.borderZ(x)-X.HZ0); const sd=Math.sqrt(zs.reduce((a,b)=>a+b*b,0)/zs.length), hi=Math.max(...zs);
  ok('the home forest\'s north wall wanders too (never north of z = HZ0, so the Greyspine keeps its ground; south by 60 m or more in places)',Math.min(...zs)>=-1e-9&&hi>=60&&sd>15,'rms '+sd.toFixed(0)+' m, up to '+hi.toFixed(0)+' m south'); }
{ const zs=[]; for(let x=460;x<=980;x+=4) zs.push(X.borderZ(x)-X.HZ0); ok('and the vale | Reach wall: sinuous, up to 100 m north and 40 m south of z = HZ0 (the vale\'s zones are 140 m from it, the Reach\'s 260 m)',Math.min(...zs)<-80&&Math.max(...zs)<=45+1e-9,'from '+Math.min(...zs).toFixed(0)+' to +'+Math.max(...zs).toFixed(0)+' m'); }
{ const xs=[]; for(let z=-1030;z<=-446;z+=4) xs.push(X.borderX(z)-X.HALF); ok('the Greyspine | Reach wall leans only east (0-55 m: Highmark and the Ledgeway keep their room)',Math.min(...xs)>=-1e-9&&Math.max(...xs)<=55+1e-9&&Math.max(...xs)>20,'0..'+Math.max(...xs).toFixed(0)+' m'); }
// ---- pins: every gate stays where it was ----
ok('the lines are pinned straight at the bridge, the glacier valley, Frostgate Pass and the junction of the four lands',Math.abs(X.borderX(X.TUN.z)-X.HALF)<1e-9&&Math.abs(X.borderX(X.GLEN.z)-X.HALF)<1e-9&&Math.abs(X.borderX(X.HZ0)-X.HALF)<1e-9&&Math.abs(X.borderZ(X.PASS.x)-X.HZ0)<1e-9&&Math.abs(X.borderZ(X.HALF)-X.HZ0)<1e-9);
ok('so the bridge (z -100), Hanami, Frostgate Pass (x 636) and the glacier valley (z -722) are where they were',X.TUN.z===-100&&X.VIL2.x===600&&X.VIL2.z===-100&&X.PASS.x===636&&X.GLEN.z===-722&&X.VIL3.x===690&&X.VIL3.z===-610&&X.VIL4.x===292&&X.VIL4.z===-792);
ok('northBarZ (what a hiker without the Reach\'s key must stay south of): the ice wall in the pass, the crest line elsewhere',X.northBarZ(X.PASS.x)===X.PASS.ice&&X.northBarZ(800)===X.borderZ(800)+8&&X.northBarZ(500)===X.borderZ(500)+8);
// ---- the land tests ----
{ let bad=0, n=0; const names=['home','vale','hoar','grey'];
  for(let z=-1030;z<=438;z+=19) for(let x=-436;x<=988;x+=19){ n++; const f=[!X.inVale(x,z)&&!X.inGrey(x,z),X.inVale(x,z)&&!X.inHoar(x,z),X.inHoar(x,z),X.inGrey(x,z)];
      if(f.filter(Boolean).length!==1||names[f.indexOf(true)]!==X.landAt(x,z)) bad++;
      if(z>=X.WZ0&&x>=X.WX0&&((X.inHoar(x,z)&&X.vilAt(x,z)!==X.VIL3)||(X.inGrey(x,z)&&X.vilAt(x,z)!==X.VIL4)||(X.landAt(x,z)==='vale'&&X.vilAt(x,z)!==X.VIL2)||(X.landAt(x,z)==='home'&&X.vilAt(x,z)!==X.VIL))) bad++; }
  ok('every point is in exactly one of the four lands, and the village of its land (vilAt) agrees with landAt',bad===0,n+' points, '+bad+' wrong'); }
// ---- the river ----
{ const sec=[]; for(let z=-340;z<=-230;z+=10) sec.push(z); for(let z=-40;z<=438;z+=10) sec.push(z);   // (the bridge's own cross section, z -100, is checked below)
  let worst=-1e9, dry=0, narrow=0;
  for(const z of sec){ const bx=X.borderX(z), c=H(bx,z); worst=Math.max(worst,c); if(c>-2.3) dry++;
    let w=0; for(let o=0;o<=60;o+=2) if(H(bx-o,z)<-0.3&&H(bx+o,z)<-0.3) w=o; if(w<10) narrow++; }
  ok('the river runs the whole length of the border south of the junction, bridge included: the channel is 2.8 m deep at its middle and at least 20 m wide, every 10 m',dry===0&&narrow===0&&worst<-2.3,sec.length+' cross sections, '+dry+' shallow, '+narrow+' narrow, highest middle '+worst.toFixed(1)+' m'); }
{ let bad=0; for(const z of [-300,-260,-100,40,150,300,380]){ const bx=X.borderX(z), w=X.riverHalfW(z); if(!(H(bx-w-35,z)>0.3&&H(bx+w+35,z)>0.3)) bad++; } ok('its banks are dry land 35 m from the channel on both sides (no flooding, nothing to swim)',bad===0,bad+' sections flooded'); }
ok('the river is a wall too: the channel is deeper than a hiker may wade (0.8 m) over 20 m, so nobody can cross it but by the bridge',(()=>{ let n=0; for(const z of [-300,-100,100,300]){ const bx=X.borderX(z); for(let o=-10;o<=10;o+=2) if(H(bx+o,z)<-0.8) n++; } return n>=4*8; })());
{ const T=X.TUN, bx=X.borderX(T.z), sp=[]; for(let z=-160;z<=-40;z+=10) sp.push(z);
  ok('no mountain spur where the bridge crosses (the Vale Wall is a river all the way south of the junction): the river is there at full strength and the banks are low land',sp.every(z=>X.riverK(z)===1)&&sp.every(z=>X.baseHeight(X.borderX(z),z)<-1)&&X.baseHeight(bx-60,T.z)<30&&X.baseHeight(bx+60,T.z)<30,'banks '+X.baseHeight(bx-60,T.z).toFixed(0)+' / '+X.baseHeight(bx+60,T.z).toFixed(0)+' m'); }
{ const T=X.TUN, bx=X.borderX(T.z); let gap=0, below=0, dry=0;
  for(let x=T.p0;x<=T.p1;x+=1){ const d=X.bridgeDeck(x,T.z); if(!(d>-50)) gap++; else if(d<X.rawHeight(x,T.z)-0.35) below++; if(d>X.WATER+0.5) dry++; }
  ok('the bridge: a continuous deck (z -100) from bank to bank over the river, above the water and never more than 35 cm under the ground of the banks at its ends, 4 m wide; none beside it',gap===0&&below===0&&dry>=T.p1-T.p0&&T.p0<bx-40&&T.p1>bx+40&&X.bridgeDeck(bx,T.z+T.w+1)<-50&&X.bridgeDeck(T.p0-3,T.z)<-50,'deck '+T.p0.toFixed(0)+'..'+T.p1.toFixed(0)+' over x '+bx.toFixed(0)+', '+gap+' gaps, '+below+' under ground'); }
ok('north of the junction nothing is a river (the Greyspine | Reach wall stays a mountain range) and the river is born below the rim (riverK ramps in over 70 m)',X.riverK(-900)===0&&X.riverK(-500)===0&&X.riverK(X.HZ0+10)===0&&X.riverK(X.HZ0+95)>0.99);
// ---- the Greyfall ----
{ const P=X.fallProfile(); let up=0, float=0; for(let i=1;i<P.length;i++) if(P[i][1]>P[i-1][1]+1e-9) up++;
  for(const p of P) if(p[1]>X.baseHeightRaw(X.FALL.x,p[0])-0.1+1e-6) float++;
  const drop=P[0][1]-P[P.length-1][1];
  ok('the fall\'s path never rises and never floats above the ground; it drops 120 m or more from the tarn to the pool',up===0&&float===0&&drop>=120,P.length+' points, drop '+drop.toFixed(0)+' m, '+up+' rises, '+float+' floating'); }
{ const F=X.FALL, c=H(F.tx,F.tz); let hold=0, n=0; for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, hx=F.tx+Math.sin(a)*(F.tr+2), hz=F.tz+Math.cos(a)*(F.tr+2); n++; if(H(hx,hz)>=F.tl-0.05) hold++; }
  ok('the tarn on the rim: a bowl under its level (waterSurf says so), ringed by ground above the water all round but the outflow',X.waterSurf(F.tx,F.tz)===F.tl&&c<F.tl-1&&hold>=n-5,'floor '+c.toFixed(1)+' m, level '+F.tl+' m, '+hold+'/'+n+' of the rim above it'); }
{ const F=X.FALL; ok('the plunge pool at the foot is below the sea (3 m or more) and the river\'s channel goes on from it',H(F.x,F.pool.z)<=-3&&H(X.borderX(-330),-330)<-2.3&&X.waterSurf(F.x,F.pool.z)===X.WATER); }
{ const F=X.FALL, dry=[[F.tx+30,F.tz],[F.tx,F.tz-30],[F.x-40,F.pool.z-20]]; ok('no water level anywhere else on the rim: waterSurf is the sea\'s level off the tarn',dry.every(p=>X.waterSurf(p[0],p[1])===X.WATER||Math.hypot(p[0]-F.tx,p[1]-F.tz)<F.tr*1.15)); }
// ---- zones ----
{ let far=0; for(let z=-430;z<=430;z+=30) for(let x=240;x<=560;x+=30){ if(!X.inVale(x,z)||X.inHoar(x,z)) continue; const zn=X.valeZoneAt(x,z); if(zn){ let m=1e9; /* the seed the zone belongs to */ m=Math.hypot(x-zn.x,z-zn.z); if(m>260) far++; } }
  ok('a vale zone never reaches far beyond its camps (190 m from its seed, warp included): the strip the river gives the vale has no zone',far===0,far+' points'); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
