// Headless test of the continent's coast (shared/coasts.js): the sea surrounds the north and east of the world, the outline is no rectangle (an L with capes and bays), the Hoarfrost Reach
// is a landmass as big as the others, islets are islands, the content near the coast keeps its ground, and the sea is flat. Straight from src/, no build. One line per check; exits 1 on failure.
// Usage: node tools/coasts-smoke.js
const {loadShared}=require('./load');
const X=loadShared(['coastDist','csOuter','CS_BASE','CS_POLY','CS_ISLES','CS_ISLANDS','BRIDGES','ZONES','CS_HOLD','csHold','csMain','rawHeight','landAt','borderX','borderZ','ARENAS','NODES','NODE_KEEPOUT','HALF','HZ0','WX0','WX1','WZ0','WZ1','VALE_E','GREY_N','WATER','GREY_QUEEN']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const H=X.rawHeight;
// the outermost ground above 0.5 m along a row (east coast) or a column (north coast), scanning in from the sea
// (ground only counts with ground 30, 60 and 90 m further in: an islet is not the coast; and the big islands are not the coast either)
const onIsland=(x,z)=>X.CS_ISLANDS.some(I=>Math.hypot((x-I[0])/(I[3]||1),z-I[1])<I[2]+40);
const lineE=(z,x0)=>{ for(let x=X.WX1-2;x>(x0===undefined?X.HALF:x0);x-=3) if(H(x,z)>0.5&&H(x-30,z)>0.5&&H(x-60,z)>0.5&&H(x-90,z)>0.5&&!onIsland(x,z)) return x; return null; };
const lineN=x=>{ for(let z=X.WZ0+2;z<X.HZ0;z+=3) if(H(x,z)>0.5&&H(x,z+30)>0.5&&H(x,z+60)>0.5&&H(x,z+90)>0.5) return z; return null; };
const stats=a=>{ const m=a.reduce((p,q)=>p+q,0)/a.length; return {span:Math.max(...a)-Math.min(...a),sd:Math.sqrt(a.reduce((p,q)=>p+(q-m)*(q-m),0)/a.length)}; };
// turns of a line (bays and capes): the number of times it reverses by 40 m or more
const turns=a=>{ let n=0, ref=a[0], dir=0; for(const v of a){ if(dir>=0&&v<ref-40){ if(dir>0) n++; dir=-1; ref=v; } else if(dir<=0&&v>ref+40){ if(dir<0) n++; dir=1; ref=v; } else if(dir>0&&v>ref) ref=v; else if(dir<0&&v<ref) ref=v; else if(dir===0) ref=dir>0?Math.max(ref,v):Math.min(ref,v); } return n; };
// ---- the sea surrounds the north and the east ----
{ const E=[], N=[]; for(let z=X.WZ0+10;z<=X.WZ1-10;z+=6) E.push(H(X.WX1-3,z)); for(let x=X.WX0+10;x<=X.WX1-10;x+=6) N.push(H(x,X.WZ0+3));
  const dry=a=>a.filter(h=>h>0.5).length;
  ok('the world\'s north and east edges are all sea: no mountain wall, no cliff, no ground at either',dry(E)===0&&dry(N)===0,'east '+dry(E)+' dry of '+E.length+', north '+dry(N)+' of '+N.length); }
// ---- the Reach is a landmass like the others ----
{ const area={}, st=12; for(let z=X.WZ0;z<=X.WZ1;z+=st) for(let x=X.WX0;x<=X.WX1;x+=st) if(H(x,z)>0.5){ const l=X.landAt(x,z); area[l]=(area[l]||0)+st*st; }
  ok('the Hoarfrost Reach has 400,000 m2 of land or more (it had 244,000) and at least 85% of the vale\'s',area.hoar>=400e3&&area.hoar>=0.85*area.vale,Object.keys(area).map(l=>l+' '+(area[l]/1e3).toFixed(0)+'k').join(', ')); }
// ---- no rectangle: an L with capes and bays ----
{ const e=[], n=[]; for(let z=-1210;z<=410;z+=10){ const l=lineE(z); if(l!==null) e.push(l); } for(let x=-1000;x<=980;x+=10){ const l=lineN(x); if(l!==null) n.push(l); }
  const se=stats(e), sn=stats(n);
  const swing=a=>{ let m=0; for(let i=0;i+30<=a.length;i++){ const w=a.slice(i,i+30); m=Math.max(m,Math.max(...w)-Math.min(...w)); } return m; };   // the biggest bend of the waterline within 300 m
  ok('the bays and capes are big: the east coast\'s waterline spans 350 m or more (rms 70 m), the north coast\'s 200 m (rms 50 m), and each bends 150 m or more within 300 m',se.span>=350&&se.sd>=70&&sn.span>=200&&sn.sd>=50&&swing(e)>=150&&swing(n)>=150,'east '+se.span.toFixed(0)+'/'+se.sd.toFixed(0)+', north '+sn.span.toFixed(0)+'/'+sn.sd.toFixed(0)+', biggest bend east '+swing(e).toFixed(0)+', north '+swing(n).toFixed(0));
  ok('bays and capes: the east coast turns four times or more by 40 m, the north coast four times',turns(e)>=4&&turns(n)>=4,'east '+turns(e)+', north '+turns(n)); }
{ let reachE=-1e9, valeE=-1e9; for(let z=-1200;z<=-520;z+=6){ const l=lineE(z); if(l!==null) reachE=Math.max(reachE,l); } for(let z=-250;z<=410;z+=6){ const l=lineE(z); if(l!==null) valeE=Math.max(valeE,l); }
  let ne=0; for(let z=X.WZ0+10;z<=X.HZ0-60;z+=6) for(let x=1090;x<=X.WX1-8;x+=6) if(H(x,z)>0.5&&H(x-30,z)>0.5&&H(x+30,z)>0.5&&H(x,z-30)>0.5&&H(x,z+30)>0.5) ne++;   // (an islet is not ground: it has sea within 30 m)
  ok('the Reach\'s north-east corner is cut: its east coast is no farther east than the vale\'s (it ran 150 m beyond it), and no ground lies east of x = 1090 north of the forest\'s rim',reachE<=valeE+10&&ne===0,'Reach east '+reachE+' vs vale '+valeE+', '+ne+' dry samples in the old corner'); }
// ---- the south-east corner is sea; its content lives on the Warlord Isles ----
{ let mainland=0, n=0; for(let z=262;z<=X.WZ1-8;z+=6) for(let x=900;x<=X.WX1-8;x+=6){ n++; if(H(x,z)>0.5&&!onIsland(x,z)) mainland++; }
  ok('the vale\'s south-east corner is gone: no ground east of x = 900 and south of z = 262 but the Warlord Isles',mainland===0,mainland+' dry samples of '+n+' off the islands'); }
{ const z24=X.ZONES.find(z=>z.vale&&!z.hoar&&z.key===24), nodes=X.NODES.filter(n=>n.zone===24), I=X.CS_ISLANDS[0];
  ok('zone 24 (Warlord Ruins) and its nodes stand on the first island, 40 m or more from its shore: the seed at '+z24.x+', '+z24.z+', '+nodes.length+' nodes',Math.hypot((z24.x-I[0])/I[3],z24.z-I[1])<30&&X.coastDist(z24.x,z24.z)>=90&&nodes.length>=6&&nodes.every(n=>onIsland(n.x,n.z)&&X.coastDist(n.x,n.z)>=40),nodes.length+' nodes, nearest shore '+nodes.reduce((m,n)=>Math.min(m,X.coastDist(n.x,n.z)),1e9).toFixed(0)+' m'); }
{ const cw=X.BRIDGES.filter(b=>b.kind==='causeway'), isle=cw.filter(b=>b.road==='The Isle Road'), other=cw.filter(b=>b.road!=='The Isle Road'&&b.len>120);
  ok('the island is joined to the vale by a plank causeway of 60 m or more (The Isle Road) and no other road runs into the sea (no other causeway longer than 120 m)',isle.some(b=>b.len>=60)&&other.length===0,'Isle Road '+isle.map(b=>Math.round(b.len)).join('+')+' m'+(other.length?'; too long: '+other.map(b=>b.road+' '+Math.round(b.len)).join(', '):'')); }
// every zone keeps its ground: 60% or more of each zone's camp disc is dry land
{ const bad=[]; for(const zn of X.ZONES){ if(!isFinite(zn.x)||!isFinite(zn.z)||zn.boss||X.landAt(zn.x,zn.z)==='home') continue; const R=zn.R||75; let l=0,n=0; for(let r=0;r<=R;r+=R/4) for(let k=0;k<Math.max(1,Math.round(r/6));k++){ const a=k/Math.max(1,Math.round(r/6))*Math.PI*2; n++; if(H(zn.x+Math.sin(a)*r,zn.z+Math.cos(a)*r)>1) l++; } if(l/n<0.6) bad.push(zn.key+' '+Math.round(100*l/n)+'%'); }
  ok('every zone of the vale, the Reach and the Greyspine keeps its ground: 60% or more of its camp disc is dry',bad.length===0,bad.join(', ')); }
// ---- islets ----
{ let bad=[]; for(const I of X.CS_ISLES){ const h=H(I[0],I[1]); let ring=0, n=0; for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, rr=I[2]+16; n++; if(H(I[0]+Math.sin(a)*rr,I[1]+Math.cos(a)*rr)<-1) ring++; }
    if(!(h>0.4&&h<20&&ring>=n*0.75)) bad.push(I.join(',')+' (h '+h.toFixed(1)+', '+ring+'/'+n+' sea)'); }
  ok('every islet is dry (0.4-20 m) and surrounded by the sea: three quarters of the ring 16 m beyond its edge is under water',bad.length===0&&X.CS_ISLES.length>=8,X.CS_ISLES.length+' islets'+(bad.length?'; bad: '+bad.join(' ; '):'')); }
// ---- the content keeps its ground ----
{ const nb=X.ARENAS.filter(A=>X.landAt(A.x,A.z)!=='home').map(A=>[A.key,A.x,A.z,X.coastDist(A.x,A.z),H(A.x,A.z),A.h]), bad=nb.filter(a=>a[3]<40||Math.abs(a[4]-a[5])>0.01);
  ok('every boss arena outside the home forest stands 40 m or more from the water, flat at its own height',bad.length===0,nb.map(a=>a[0]+' c '+a[3].toFixed(0)).join(', ')); }
{ const doors=X.NODE_KEEPOUT.map(d=>[d,X.coastDist(d[0],d[1]),H(d[0],d[1])]), bad=doors.filter(d=>d[1]<45||d[2]<2.5);
  ok('the four dungeon doors keep 45 m from the water',bad.length===0,doors.map(d=>d[0].join(',')+' c '+d[1].toFixed(0)).join(' ; ')); }
ok('the Gryphon Queen\'s cone keeps its crown (232 m), a headland in the sea',H(X.GREY_QUEEN.x,X.GREY_QUEEN.z)>=Math.min(231,X.GREY_QUEEN.h),'crown '+H(X.GREY_QUEEN.x,X.GREY_QUEEN.z).toFixed(0)+' m');
{ const lo=X.NODES.map(n=>X.coastDist(n.x,n.z)).reduce((a,b)=>Math.min(a,b),1e9); ok('every resource node is 22 m or more from the waterline',lo>=40,'nearest c '+lo.toFixed(0)); }
// ---- the sea is flat and everything is finite ----
{ let bad=0, n=0, m=0, hi=-1e9; for(let z=X.WZ0+4;z<=X.WZ1-4;z+=17) for(let x=X.WX0+4;x<=X.WX1-4;x+=17){ n++; const c=X.coastDist(x,z), h=H(x,z); if(!isFinite(c)||!isFinite(h)) bad++; else if(c<-30&&X.landAt(x,z)!=='home'&&h>-4.9&&!X.CS_ISLES.some(I=>Math.hypot(x-I[0],z-I[1])<I[2]+30)) hi=Math.max(hi,h); if(c<-30&&X.landAt(x,z)!=='home') m++; }
  ok('coastDist and the ground are finite everywhere, and open sea (30 m beyond the coast) is a flat -5 m',bad===0&&hi<-4.5&&m>500,n+' points, '+m+' in open sea, highest sea floor '+(hi>-1e8?hi.toFixed(2)+' m':'-5.0 m')); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
