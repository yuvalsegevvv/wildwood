//@ Ground patterns for skill effects: canvas-drawn runes, flames, waves, cracks, gusts, eclipses, stars, frost, leaves and shock rings that replace the plain discs and rings
/* Agent map. fxdMesh(kind,col,op) is a flat 2 m square (radius 1, like teleFill) with the pattern on it, additive and tinted by col; scale it by the radius and turn it with rotation.y.
   fxdKindOfEl(el) gives the pattern of an element (fire flame, water wave, earth cracks, air gust, dark eclipse, light star, basic rune); fxdKindOfArea(kind,el) the one of an area
   event (meteor flame, rain and hail target, blizzard frost, storm gust, zone: its element's). Kinds: rune flame wave cracks gust eclipse star frost leaf target shock aura.
   The textures are drawn once (128 px on phones) from a seeded stream, so a pattern looks the same every time. Used by skill-fx.js (onArea, auras), attacks.js (spawnRingAt),
   fx-extra.js (fxxRune). A piece with a skill-set look keeps its own patterns (skillsets/looks.js). Test: client-smoke. */
const FXD={tex:{},geo:null};
const FXD_EL={fire:'flame',water:'wave',earth:'cracks',air:'gust',dark:'eclipse',light:'star'};
const fxdKindOfEl=el=>FXD_EL[el]||'rune';
function fxdKindOfArea(kind,el){ return kind==='meteor'?'flame':kind==='rain'||kind==='hail'?'target':kind==='blizzard'?'frost':kind==='storm'?'gust':fxdKindOfEl(el); }
function fxdDraw(kind,g){
  const rg=mrng(kind.length*977+kind.charCodeAt(0)*31), rr=rg.R, C=128;
  g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='#fff'; g.fillStyle='#fff'; g.shadowColor='#fff'; g.shadowBlur=5;
  const ring=(r,w,a)=>{ g.globalAlpha=a===undefined?1:a; g.lineWidth=w; g.beginPath(); g.arc(C,C,r,0,TAU); g.stroke(); g.globalAlpha=1; };
  const around=(n,fn,off)=>{ for(let i=0;i<n;i++){ g.save(); g.translate(C,C); g.rotate(i/n*TAU+(off||0)); fn(i); g.restore(); } };   // the figure points up (-y); draw it for one of n turns
  const poly=(n,r,rot,w)=>{ g.lineWidth=w; g.beginPath(); for(let i=0;i<=n;i++){ const a=rot+i/n*TAU; g[i?'lineTo':'moveTo'](C+Math.sin(a)*r,C-Math.cos(a)*r); } g.stroke(); };
  const glow=(r,a)=>{ const k=g.createRadialGradient(C,C,0,C,C,r); k.addColorStop(0,'rgba(255,255,255,'+a+')'); k.addColorStop(1,'rgba(255,255,255,0)'); g.shadowBlur=0; g.fillStyle=k; g.beginPath(); g.arc(C,C,r,0,TAU); g.fill(); g.shadowBlur=5; g.fillStyle='#fff'; };
  const tongue=(r0,r1,w,bend)=>{ g.beginPath(); g.moveTo(-w,-r0); g.quadraticCurveTo(-w*1.2,-(r0+r1)/2,bend,-r1); g.quadraticCurveTo(w*1.2,-(r0+r1)/2,w,-r0); g.closePath(); g.fill(); };
  if(kind==='rune'){
    ring(122,3); ring(114,1); ring(86,2.5); ring(66,1,0.7);
    around(36,i=>{ g.lineWidth=i%3?1.2:2.4; g.beginPath(); g.moveTo(0,-108); g.lineTo(0,-(i%3?113:106)); g.stroke(); });
    around(12,()=>{ g.lineWidth=2.2; g.beginPath(); g.moveTo(rr(-7,7),-93); g.lineTo(rr(-9,9),-98); g.lineTo(rr(-6,6),-102); g.lineTo(rr(-9,9),-106); g.stroke(); });
    poly(3,80,0,2.5); poly(3,80,Math.PI,2.5); ring(20,2); g.beginPath(); g.arc(C,C,5,0,TAU); g.fill(); glow(60,0.18);
  } else if(kind==='flame'){
    ring(118,2.5,0.6); ring(92,3); glow(110,0.2);
    around(14,i=>{ g.globalAlpha=0.95; tongue(94,124,9,i%2?7:-7); }); g.globalAlpha=0.8;
    around(7,i=>{ tongue(46,86,6,i%2?5:-5); },0.22); g.globalAlpha=1; ring(40,2,0.8);
  } else if(kind==='wave'){
    for(const [r,a,ph] of [[116,3,0],[98,2,2],[80,1.5,4]]){ g.lineWidth=a; g.beginPath(); for(let i=0;i<=120;i++){ const t=i/120*TAU, rad=r+5*Math.sin(t*10+ph); g[i?'lineTo':'moveTo'](C+Math.sin(t)*rad,C-Math.cos(t)*rad); } g.stroke(); }
    for(let arm=0;arm<4;arm++){ g.lineWidth=3; g.beginPath(); for(let i=0;i<=40;i++){ const f=i/40, rad=22+80*f, t=arm/4*TAU+f*2.1; g[i?'lineTo':'moveTo'](C+Math.sin(t)*rad,C-Math.cos(t)*rad); } g.stroke(); }
    for(let i=0;i<14;i++){ const a=rr(0,TAU), r=rr(30,100); g.beginPath(); g.arc(C+Math.sin(a)*r,C-Math.cos(a)*r,rr(1.5,3.5),0,TAU); g.fill(); }
    glow(50,0.2);
  } else if(kind==='cracks'){
    ring(120,2.5,0.7); ring(98,1.5,0.5); glow(70,0.28);
    for(let k=0;k<9;k++){ const a0=k/9*TAU+rr(-0.15,0.15); let x=0,y=-12,ang=0; g.save(); g.translate(C,C); g.rotate(a0); g.lineWidth=3.5; g.beginPath(); g.moveTo(0,-10);
      for(let s=0;s<9;s++){ x+=rr(-9,9); y-=rr(10,15); g.lineTo(x,y); if(s===3||s===6){ g.moveTo(x,y); g.lineTo(x+(s===3?-1:1)*rr(14,26),y-rr(8,16)); g.moveTo(x,y); } } g.stroke(); g.restore(); }
    for(let i=0;i<16;i++){ const a=rr(0,TAU), r=rr(50,114), w=rr(2,5); g.save(); g.translate(C+Math.sin(a)*r,C-Math.cos(a)*r); g.rotate(rr(0,TAU)); g.fillRect(-w,-w*0.7,w*2,w*1.4); g.restore(); }
  } else if(kind==='gust'){
    ring(122,2,0.6); ring(40,1.5,0.6);
    around(5,()=>{ g.beginPath(); g.moveTo(0,-34); g.bezierCurveTo(60,-58,100,-20,96,40); g.bezierCurveTo(88,-4,56,-34,0,-34); g.fill(); });
    around(5,()=>{ g.lineWidth=2; g.beginPath(); g.arc(-52,-64,22,0.4,3.4); g.stroke(); },0.6);
    for(let i=0;i<12;i++){ const a=rr(0,TAU), r=rr(50,115); g.beginPath(); g.arc(C+Math.sin(a)*r,C-Math.cos(a)*r,rr(1.2,2.4),0,TAU); g.fill(); }
  } else if(kind==='eclipse'){
    ring(122,4); ring(112,1.2); ring(70,2);
    around(4,()=>{ g.beginPath(); g.arc(0,-92,16,0,TAU); g.fill(); g.globalCompositeOperation='destination-out'; g.beginPath(); g.arc(7,-96,13,0,TAU); g.fill(); g.globalCompositeOperation='source-over'; });
    around(24,i=>{ g.beginPath(); g.moveTo(-3,-66); g.lineTo(3,-66); g.lineTo(0,-(i%2?46:36)); g.closePath(); g.fill(); });
    around(24,i=>{ g.lineWidth=1.5; g.beginPath(); g.moveTo(0,-114); g.lineTo(0,-(i%2?106:101)); g.stroke(); });
    glow(26,0.7);
  } else if(kind==='star'){
    ring(122,2.5); ring(104,1.2,0.8); glow(120,0.16);
    around(24,i=>{ g.lineWidth=i%3?1.2:2.4; g.beginPath(); g.moveTo(0,-108); g.lineTo(0,-(i%3?116:124)); g.stroke(); });
    g.lineWidth=3; g.beginPath(); for(let i=0;i<16;i++){ const a=i/16*TAU, r=i%2?44:98; g[i?'lineTo':'moveTo'](C+Math.sin(a)*r,C-Math.cos(a)*r); } g.closePath(); g.stroke();
    g.beginPath(); for(let i=0;i<8;i++){ const a=i/8*TAU+Math.PI/8, r=i%2?20:62; g[i?'lineTo':'moveTo'](C+Math.sin(a)*r,C-Math.cos(a)*r); } g.closePath(); g.fill(); glow(30,0.9);
  } else if(kind==='frost'){
    ring(122,2.5,0.7); poly(6,104,0,2.5); poly(6,60,Math.PI/6,1.5);
    around(6,()=>{ g.lineWidth=3.5; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-116); g.stroke(); g.lineWidth=2.2;
      for(const [y,l] of [[-36,24],[-62,30],[-86,20]]){ g.beginPath(); g.moveTo(-l*0.7,y-l*0.7); g.lineTo(0,y); g.lineTo(l*0.7,y-l*0.7); g.stroke(); } g.beginPath(); g.moveTo(0,-116); g.lineTo(-7,-124); g.moveTo(0,-116); g.lineTo(7,-124); g.stroke(); });
    glow(40,0.35);
  } else if(kind==='leaf'){
    ring(122,2.5,0.7); ring(60,1.5,0.6);
    around(10,()=>{ g.beginPath(); g.moveTo(0,-62); g.quadraticCurveTo(26,-90,0,-120); g.quadraticCurveTo(-26,-90,0,-62); g.fill(); g.globalCompositeOperation='destination-out'; g.lineWidth=1.8; g.beginPath(); g.moveTo(0,-68); g.lineTo(0,-114); g.stroke(); g.globalCompositeOperation='source-over'; });
    g.lineWidth=2.2; g.beginPath(); for(let i=0;i<=60;i++){ const f=i/60, rad=8+50*f, t=f*8; g[i?'lineTo':'moveTo'](C+Math.sin(t)*rad,C-Math.cos(t)*rad); } g.stroke(); glow(36,0.3);
  } else if(kind==='target'){
    ring(122,3); ring(100,1.5,0.8); ring(70,2); ring(38,1.5,0.8);
    around(4,()=>{ g.lineWidth=2.5; g.beginPath(); g.moveTo(0,-30); g.lineTo(0,-64); g.moveTo(0,-76); g.lineTo(0,-96); g.moveTo(0,-106); g.lineTo(0,-122); g.stroke(); });
    around(24,i=>{ g.lineWidth=1.4; g.beginPath(); g.moveTo(0,-122); g.lineTo(0,-(i%2?127:129)); g.stroke(); }); g.beginPath(); g.arc(C,C,4,0,TAU); g.fill();
  } else if(kind==='shock'){
    const k=g.createRadialGradient(C,C,70,C,C,124); k.addColorStop(0,'rgba(255,255,255,0)'); k.addColorStop(0.8,'rgba(255,255,255,0.35)'); k.addColorStop(0.93,'rgba(255,255,255,1)'); k.addColorStop(1,'rgba(255,255,255,0)');
    g.shadowBlur=0; g.fillStyle=k; g.beginPath(); g.arc(C,C,124,0,TAU); g.fill(); g.shadowBlur=3; g.fillStyle='#fff';
    for(let i=0;i<46;i++){ g.save(); g.translate(C,C); g.rotate(rr(0,TAU)); g.lineWidth=rr(0.8,2); g.globalAlpha=rr(0.4,0.9); g.beginPath(); const r0=rr(72,100); g.moveTo(0,-r0); g.lineTo(0,-r0-rr(10,26)); g.stroke(); g.restore(); } g.globalAlpha=1;
  } else if(kind==='aura'){
    ring(118,4); ring(84,1.5,0.7);
    around(24,i=>{ g.lineWidth=2.4; g.beginPath(); g.moveTo(-6,-98); g.lineTo(0,-108); g.lineTo(6,-98); g.stroke(); });
    around(8,()=>{ g.lineWidth=2; g.beginPath(); g.moveTo(0,-84); g.lineTo(0,-72); g.stroke(); }); glow(80,0.14);
  }
}
function fxdTex(kind){
  if(FXD.tex[kind]) return FXD.tex[kind];
  const S=LOW?128:256, c=document.createElement('canvas'); c.width=c.height=S;
  try{ const g=c.getContext('2d'); g.scale(S/256,S/256); fxdDraw(kind,g); }catch(_){}
  const t=new THREE.CanvasTexture(c); return (FXD.tex[kind]=t);
}
function fxdMesh(kind,col,op){
  if(!FXD.geo) FXD.geo=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);
  return new THREE.Mesh(FXD.geo,new THREE.MeshBasicMaterial({map:fxdTex(kind),color:col,transparent:true,opacity:op===undefined?0.8:op,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
}
