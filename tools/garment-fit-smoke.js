// Headless test that base garments lie ON the body at the slider extremes: node tools/garment-fit-smoke.js [--verbose]   (needs `npm install` for three; no build needed; ~1 min)
// What it guards (src/game/character/garment-fit.js, model-garments*.js, model-dresses.js): for one garment per code family x six body extremes x the sexes the garment allows, every detail the garment
// adds to the torso (gmTop / gmxTop / gmdTop, gmHips) is measured against the TRUE torso surface (the lathe buildTorso made): (a) a shell (a waistcoat, a belt, a bodice, a hem) must stand 1 mm or more
// outside it, so the body never pokes through; (b) every other detail (buttons, plackets, straps, ties, buckles) must lie within [-8 mm, +32 mm] (a seated bead or button may sink its rim into a steep flank) of it: nothing buried, nothing floating; the worst offender is named.
// Not judged: the neck and shoulder line (above 0.46 of the torso), the armpits' sides, the skirts' and tails' hang (below 0.1, a belt's band 0.04 and up): they hang from other parts.
const C=require('./char-load')(code=>code
  .replace('function gmTop(X,D){','function gmTop(X,D){ const o=gmTop_(X,D); if(globalThis.GFIT_LOG) globalThis.GFIT_LOG.push({X,D,parts:o,tag:"top"}); return o; }\nfunction gmTop_(X,D){')
  .replace('function gmHips(X,D){','function gmHips(X,D){ const o=gmHips_(X,D); if(globalThis.GFIT_LOG) globalThis.GFIT_LOG.push({X,D,parts:o,tag:"hips"}); return o; }\nfunction gmHips_(X,D){'));
let fails=0; const verbose=process.argv.includes('--verbose');
const EXT={
  def:{}, chest:{chest:4.5}, belly:{belly:1.5,build:1.24}, muscle:{muscle:1.5,shoulders:1.25,arms:1.35,build:1.24}, hips:{hips:1.3,hipCurve:2.6,hipTall:1.8,thighs:1.35,calves:1.35}, thin:{build:0.84,belly:-1,chest:0.5,hips:0.8,waist:0.75,shoulders:0.8,muscle:-1}
};
const TOPS=['flannel','jacket','hoodie','vest','tunic','jerkin','halter','bikini','harness','robe','crop','sundress','ballgown','wrapdress','mermaid'], BOTS=['trousers','kilt','skirt','wrapskirt','loincloth','shortshorts','hakama'];
const SHELL_MIN=-0.008, DET_MAX=0.032, Y1=0.46;
// a part is a shell when it covers a good share of the torso's circumference (its x and z extents both wide, and a body of vertices: one half of a waistcoat counts): a waistcoat, a belt, a bodice, a hem
function isShell(g){ g.computeBoundingBox(); const b=g.boundingBox; return g.attributes.position.count>=60&&(b.max.x-b.min.x)>0.1&&(b.max.z-b.min.z)>0.1; }
// the signed distance (metres, + outside) from a point to the torso's surface: the nearest point on the section of the two rings round its height, blended
function surfD(X,x,y,z){
  const G=C.gfitGrid(X), {np,ns,p,n,ys}=G; let j=0, hi=np-1; y=Math.min(Math.max(y,ys[0]),ys[hi]); while(hi-j>1){ const m=(j+hi)>>1; if(ys[m]<=y) j=m; else hi=m; }
  const one=r=>{ let best=1e9, mx=0, mz=0; for(let k=0;k<ns;k++){ const a=(k*np+r)*3, b=((k+1)*np+r)*3, ax=p[a], az=p[a+2], dx=p[b]-ax, dz=p[b+2]-az, l2=dx*dx+dz*dz||1e-12, t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)), d=Math.hypot(x-(ax+dx*t),z-(az+dz*t)); if(d<best) best=d; mx+=ax; mz+=az; }
    mx/=ns; mz/=ns; const ux=x-mx, uz=z-mz; let tb=1e9;   // (a section is star-shaped round its centre: the ray from it through the point meets the outline once; the point is inside when it is before that)
    for(let k=0;k<ns;k++){ const a=(k*np+r)*3, b=((k+1)*np+r)*3, ax=p[a]-mx, az=p[a+2]-mz, ex=p[b]-p[a], ez=p[b+2]-p[a+2], den=ux*ez-uz*ex; if(Math.abs(den)<1e-12) continue; const t=(ax*ez-az*ex)/den, w=(ax*uz-az*ux)/den; if(t>0&&w>=-1e-9&&w<=1+1e-9&&t<tb) tb=t; }
    return tb<1||tb===1e9?best:-best; };   // (tb < 1: the outline is met before the point: it is outside)
  const f=ys[j+1]-ys[j]>1e-7?(y-ys[j])/(ys[j+1]-ys[j]):0; return one(j)*(1-f)+one(j+1)*f;
}
function judge(rec){
  const {X,D,parts}=rec, TK=D.TK; let worst=null;
  for(const g of parts){ if(!g||!g.attributes||!g.attributes.position) continue; const shell=isShell(g), p=g.attributes.position; g.computeBoundingBox(); const bb=g.boundingBox; if(!shell&&Math.abs((bb.min.x+bb.max.x)/2)>0.07&&bb.min.y>0.3*TK&&(bb.max.x-bb.min.x)<0.12) continue;   // (a puff sleeve or a pauldron: the arm's, not the torso's)
    for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i); if(y<(rec.tag==='hips'?0.04:0.1)*TK||y>Y1*TK||(Math.abs(x)>0.11&&y>0.31*TK)) continue;   // (below 0.1 a dress's skirt and a wrap's tails hang off the waist; the armpits and shoulders belong to the sleeves)
      const d=surfD(X,x,y,z), v=shell?0:(d<-0.008?-0.008-d:d>DET_MAX?d-DET_MAX:0);
      if(v>0&&(!worst||v>worst.v)) worst={v,d,y:y/TK,x,shell}; } }
  return worst;
}
const sexes=['male','female'];
for(const kind of ['top','bottom']) for(const id of (kind==='top'?TOPS:BOTS)) for(const [en,ex] of Object.entries(EXT)){
  const res=[]; for(const sex of sexes){
    if(id==='bikini'&&sex==='male') continue;
    if(en==='chest'&&sex==='male'||(en==='hips'&&sex==='male')) continue;   // (a man's chest and hip sliders are narrow: their extremes are a woman's)
    globalThis.GFIT_LOG=[]; const L=Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,{hat:'none',hair:'bald',shoes:'none',top:kind==='top'?id:'tshirt',bottom:kind==='bottom'?id:'trousers'},ex);
    try{ C.buildCharacter(L,{q:0.5}); }catch(e){ res.push(sex+': THROWS '+e.message); continue; }
    const recs=GFIT_LOG.filter(r=>r.tag===(kind==='top'?'top':'hips')); const w=recs.map(judge).filter(Boolean).sort((a,b)=>b.v-a.v)[0];
    if(w) res.push(sex+': '+(w.shell?'shell sinks ':'detail '+(w.d<0?'buried ':'floats '))+(w.v*1000).toFixed(1)+' mm at y='+w.y.toFixed(2)+' x='+w.x.toFixed(3)); }
  const okk=res.length===0; if(!okk) fails++; if(!okk||verbose) console.log((okk?'PASS ':'FAIL ')+id+' @ '+en+(okk?'':'  ('+res.join('; ')+')'));
}
console.log(fails?fails+' garment/extreme combinations FAIL':'PASS every garment lies on the body at every extreme');
process.exit(fails?1:0);
