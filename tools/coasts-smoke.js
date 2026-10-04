// Headless test of the outer coasts (shared/coasts.js): no mountain wall on the north or east edge of the world, the coast wanders (bays, capes, rounded corners), islets stand
// in the sea, the content near an edge keeps its ground, and the home forest's own south shore is as it was. Straight from src/, no build. One line per check; exits 1 on failure.
// Usage: node tools/coasts-smoke.js
const {loadShared}=require('./load');
const X=loadShared(['coastDist','csOuter','CS_BAYS','CS_ISLES','CS_HOLD','csHold','rawHeight','landAt','inHoar','inVale','inGrey','borderX','borderZ','ARENAS','NODES','NODE_KEEPOUT','HALF','HZ0','WX0','WX1','WZ0','WZ1','WATER','GREY_QUEEN','noise2']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const H=X.rawHeight;
// the waterline along an edge: the innermost ground above 0.5 m, scanning in from the sea
const lineE=z=>{ for(let x=X.WX1-2;x>X.WX0;x-=2) if(H(x,z)>0.5) return x; return null; };
const lineN=x=>{ for(let z=X.WZ0+2;z<X.HZ0;z+=2) if(H(x,z)>0.5) return z; return null; };
const stats=a=>{ const m=a.reduce((p,q)=>p+q,0)/a.length; return {span:Math.max(...a)-Math.min(...a),sd:Math.sqrt(a.reduce((p,q)=>p+(q-m)*(q-m),0)/a.length)}; };
// ---- no walls ----
{ const E=[], N=[], G=[]; for(let z=-1030;z<=420;z+=6) E.push(H(X.WX1-2,z)); for(let x=600;x<=980;x+=6) N.push(H(x,X.WZ0+2)); for(let x=-400;x<=420;x+=6) G.push(H(x,X.WZ0+2));
  ok('no mountain wall on the east edge (the vale and the Reach) or on the north edge of the Reach: the world\'s edge is under 70 m everywhere',Math.max(...E,...N)<70,'east '+Math.max(...E).toFixed(0)+' m, Reach north '+Math.max(...N).toFixed(0)+' m');
  const sea=a=>a.filter(h=>h<-1).length/a.length;
  ok('the edges are mostly sea: more than half of the east edge, 80% of the Reach\'s north edge and 60% of the Greyspine\'s',sea(E)>0.5&&sea(N)>0.8&&sea(G)>0.6,'east '+(100*sea(E)).toFixed(0)+'%, Reach north '+(100*sea(N)).toFixed(0)+'%, Greyspine north '+(100*sea(G)).toFixed(0)+'%'); }
// ---- no rectangle ----
{ const e=[], n=[], g=[]; for(let z=-1000;z<=420;z+=10){ const l=lineE(z); if(l!==null) e.push(l); } for(let x=500;x<=970;x+=10){ const l=lineN(x); if(l!==null) n.push(l); } for(let x=-380;x<=420;x+=10){ const l=lineN(x); if(l!==null) g.push(l); }
  const se=stats(e), sn=stats(n), sg=stats(g);
  ok('the coasts wander: the waterline of the east edge strays 80 m or more (rms 20 m), the Reach\'s north one 80 m (rms 20 m), the Greyspine\'s 100 m (rms 25 m)',se.span>=80&&se.sd>=20&&sn.span>=80&&sn.sd>=20&&sg.span>=100&&sg.sd>=25,'east '+se.span.toFixed(0)+'/'+se.sd.toFixed(0)+', Reach north '+sn.span.toFixed(0)+'/'+sn.sd.toFixed(0)+', Greyspine '+sg.span.toFixed(0)+'/'+sg.sd.toFixed(0)); }
{ const landIn=(x0,z0,x1,z1)=>{ let l=0,n=0; for(let z=z0;z<=z1;z+=6) for(let x=x0;x<=x1;x+=6){ n++; if(H(x,z)>0.5) l++; } return l/n; };
  const ne=landIn(X.WX1-80,X.WZ0,X.WX1,X.WZ0+80), se=landIn(X.WX1-80,X.WZ1-80,X.WX1,X.WZ1);
  ok('the sharp corners are gone: land (islets included) fills under 30% of the 80 m square in the vale\'s south-east corner and in the Reach\'s north-east one',ne<0.3&&se<0.3,'north-east '+(100*ne).toFixed(0)+'%, south-east '+(100*se).toFixed(0)+'%'); }
// ---- islets ----
{ let bad=[]; for(const I of X.CS_ISLES){ const h=H(I[0],I[1]); let ring=0, n=0; for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, rr=I[2]+16; n++; if(H(I[0]+Math.sin(a)*rr,I[1]+Math.cos(a)*rr)<-1) ring++; }
    if(!(h>0.4&&h<20&&ring>=n*0.75)) bad.push(I.join(',')+' (h '+h.toFixed(1)+', '+ring+'/'+n+' sea)'); }
  ok('every islet is dry (0.4-20 m) and surrounded by the sea: three quarters of the ring 16 m beyond its edge is under water',bad.length===0&&X.CS_ISLES.length>=8,X.CS_ISLES.length+' islets'+(bad.length?'; bad: '+bad.join(' ; '):'')); }
// ---- the content keeps its ground ----
{ const nb=X.ARENAS.filter(A=>X.landAt(A.x,A.z)!=='home').map(A=>[A.key,A.x,A.z,X.coastDist(A.x,A.z),H(A.x,A.z),A.h]), bad=nb.filter(a=>a[3]<40||Math.abs(a[4]-a[5])>0.01);
  ok('every boss arena outside the home forest stands 40 m or more from the water, flat at its own height',bad.length===0,nb.map(a=>a[0]+' c '+a[3].toFixed(0)).join(', ')); }
{ const doors=X.NODE_KEEPOUT.map(d=>[d,X.coastDist(d[0],d[1]),H(d[0],d[1])]), bad=doors.filter(d=>d[1]<45||d[2]<2.5);
  ok('the four dungeon doors keep 45 m from the water',bad.length===0,doors.map(d=>d[0].join(',')+' c '+d[1].toFixed(0)).join(' ; ')); }
ok('the Gryphon Queen\'s cone keeps its crown (232 m) at the northern edge, a headland in the sea',H(X.GREY_QUEEN.x,X.GREY_QUEEN.z)>=Math.min(231,X.GREY_QUEEN.h),'crown '+H(X.GREY_QUEEN.x,X.GREY_QUEEN.z).toFixed(0)+' m');
// ---- unchanged and continuous ----
{ let jump=0; for(let z=X.HZ0+100;z<=X.WZ1-4;z+=16) for(const dx of [-2,2]){ const x=X.borderX(z)+dx*20; if(Math.abs(H(x,z)-H(x+dx*0.1,z))>6) jump++; }
  ok('the Greyfall River\'s mouth has no step: the ground a hiker crosses at the river is continuous with the vale\'s new south coast',jump===0,jump+' steps'); }
{ let bad=0, n=0; for(let z=X.WZ0+4;z<=X.WZ1-4;z+=17) for(let x=X.WX0+4;x<=X.WX1-4;x+=17){ n++; const c=X.coastDist(x,z); if(!isFinite(c)||!isFinite(H(x,z))) bad++; }
  ok('coastDist and the ground are finite everywhere',bad===0,n+' points'); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
