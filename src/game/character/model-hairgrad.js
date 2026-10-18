//@ Hair colour gradients: a second hair colour blended along the length of the hair (ombre, dipped tips, roots, a streak), applied to the finished hair geometry
/* Called by buildHair (model-hair.js) once the hair is built and before the hat: hgApply(X, parts, n0, n1) recolours the vertices of parts[n0..n1) that are hair-coloured
   (a ribbon or a tie keeps its own colour) by the ratio second colour / hair colour, so the shading the hair already has stays. look.hairGrad is one of HG_MODES, look.hairColor2 the second colour and, when look.hairThird is on, look.hairColor3 a third (the tips of an ombre, a dip's end, the crown of 'roots', the tips of streaks and of a split).
   owns: HG_MODES, hgApply.   used by: model-hair.js, ui/character-editor.js, ui/character-thumbs.js.   test: tools/cosmetic-items-smoke.js */
const HG_MODES=[['none','Plain'],['ombre','Ombre'],['tips','Dipped tips'],['roots','Roots'],['streak','Streaks'],['split','Split']];
function hgApply(X,parts,n0,n1){
  const L=X.L, mode=L.hairGrad;
  if(!mode||mode==='none'||!HG_MODES.some(m=>m[0]===mode)||n1<=n0) return;
  const c2=new THREE.Color(Number.isFinite(L.hairColor2)?L.hairColor2:0xc25a86), c1=X.hairCol, mx=Math.max(c1.r,c1.g,c1.b,0.01);
  const c3=new THREE.Color(Number.isFinite(L.hairColor3)?L.hairColor3:0x6b3f8f), tri=L.hairThird===true;
  const rt=c=>[c.r/Math.max(c1.r,0.04),c.g/Math.max(c1.g,0.04),c.b/Math.max(c1.b,0.04)], r2=rt(c2), r3=rt(c3);
  let top=-1e9, bot=1e9;
  for(let k=n0;k<n1;k++){ const p=parts[k].attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y>top) top=y; if(y<bot) bot=y; } }
  const span=Math.max(top-bot,0.05);
  for(let k=n0;k<n1;k++){ const g=parts[k], p=g.attributes.position, col=g.attributes.color; if(!col) continue;
    for(let i=0;i<p.count;i++){
      const r=col.getX(i), gg=col.getY(i), b=col.getZ(i), m=Math.max(r,gg,b,0.01);
      if(Math.abs(r/m-c1.r/mx)+Math.abs(gg/m-c1.g/mx)+Math.abs(b/m-c1.b/mx)>0.55) continue;   // not hair-coloured: a tie, a ribbon
      const u=Math.min(1,Math.max(0,(top-p.getY(i))/span));
      const x=p.getX(i); let t2, t3=0;
      if(mode==='ombre'){ t2=smoothstep(0.12,0.7,u); t3=tri?smoothstep(0.55,1,u):0; }
      else if(mode==='tips'){ t2=smoothstep(0.55,0.75,u); t3=tri?smoothstep(0.8,0.95,u):0; }
      else if(mode==='roots'){ t2=1-smoothstep(0.08,0.5,u); t3=tri?1-smoothstep(0,0.2,u):0; }
      else if(mode==='split'){ t2=smoothstep(-0.012,0.012,x); t3=tri?smoothstep(0.7,0.95,u):0; }
      else { t2=smoothstep(0.2,0.35,Math.sin(x*70+p.getZ(i)*40)*0.5+0.5)*smoothstep(0.1,0.35,u); t3=tri?smoothstep(0.78,0.95,u):0; }   // streaks: a few bands of the second colour down the locks
      const w2=t2*(1-t3), k=[1+(r2[0]-1)*w2+(r3[0]-1)*t3,1+(r2[1]-1)*w2+(r3[1]-1)*t3,1+(r2[2]-1)*w2+(r3[2]-1)*t3];
      col.setXYZ(i,r*k[0],gg*k[1],b*k[2]); } }
}
