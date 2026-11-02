//@ The story's dark moments: when the grey reaches you the world drains of colour, dims, shakes and black veins creep in from the screen's edges, with a low toll (ripple, ash, grey); the cure floods the colour back (green)
/* Agent map. mqDarkFx(kind) runs on the server event mqfx [pid, kind] (net/client.js; sent when a quest part with fx finishes, server/main-quest.js, and by the Rootwarden's kit). Four layers, all made by the Web Animations
   API and one 2D canvas, no CSS file: (1) the game canvas itself loses its colour and brightness (a CSS filter on renderer.domElement), (2) a dark vignette closes in, (3) veins grow from the edges toward the middle (mqVeinDraw),
   (4) the picture shakes and a toll sounds (mqFxSound). kinds: ripple = a quick cold pulse (the first slimes), ash = a longer ash sky (the shrooms), grey = the deep grey of the village (Wren) and the boss fight's grey touch,
   green = the cure undoing the grey (colour floods back, a warm glow, chimes), amber = a warm memory. Players who ask for reduced motion get no shake. Client only. Test: client-smoke. */
const MQ_FX={
  ripple:{gray:0.85,dim:0.78,shake:8,veins:11,ms:3000,vig:[14,18,26],peak:0.8,snd:'pulse'},
  ash:{gray:0.95,dim:0.68,shake:6,veins:16,ms:5000,vig:[26,26,28],peak:0.88,snd:'drone'},
  grey:{gray:1,dim:0.5,shake:14,veins:30,ms:7000,vig:[8,10,16],peak:0.95,snd:'toll'},
  green:{gray:0,dim:1.12,sat:1.9,shake:0,veins:0,ms:3400,vig:[90,190,100],peak:0.55,snd:'chime',glow:true},
  amber:{gray:0.2,dim:1.05,sat:1.4,shake:0,veins:0,ms:4200,vig:[230,170,70],peak:0.6,snd:'chime',glow:true}};
let mqFxVig=null, mqFxVeins=null, mqFxVeinT=0;
function mqFxLayer(z){ const d=document.createElement('div'); d.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:'+z+';opacity:0'; document.body.appendChild(d); return d; }
// veins: each one starts on an edge of the screen, wanders toward the middle, forks now and then; drawn growing over the first part of the effect, then fading with it
function mqVeinPlan(n,w,h){
  const plan=[];
  for(let i=0;i<n;i++){
    const side=i%4, t=Math.random(); let x=side===0?t*w:side===1?w:side===2?(1-t)*w:0, y=side===0?0:side===1?t*h:side===2?h:(1-t)*h;
    const a0=Math.atan2(h/2-y,w/2-x)+(Math.random()-0.5)*0.7, len=(0.28+Math.random()*0.3)*Math.hypot(w,h)/2, steps=22, pts=[[x,y]], forks=[];
    let a=a0, px=x, py=y;
    for(let k=1;k<=steps;k++){ a+=(Math.random()-0.5)*0.6; px+=Math.cos(a)*len/steps; py+=Math.sin(a)*len/steps; pts.push([px,py]);
      if(k>5&&k<steps-3&&Math.random()<0.2){ const fa=a+(Math.random()<0.5?-1:1)*(0.6+Math.random()*0.6), f=[[px,py]]; let qx=px, qy=py; for(let j=0;j<7;j++){ qx+=Math.cos(fa+(Math.random()-0.5)*0.5)*len/steps*0.8; qy+=Math.sin(fa+(Math.random()-0.5)*0.5)*len/steps*0.8; f.push([qx,qy]); } forks.push(f); } }
    plan.push({pts,forks,wd:2.5+Math.random()*3.5});
  }
  return plan;
}
function mqVeinDraw(plan,grow,w,h,ctx){
  ctx.clearRect(0,0,w,h); ctx.lineCap='round'; ctx.lineJoin='round';
  const stroke=(pts,k,wd)=>{ const m=Math.max(2,Math.floor(pts.length*k)); for(let i=1;i<m;i++){ ctx.lineWidth=Math.max(0.6,wd*(1-i/pts.length*0.85)); ctx.beginPath(); ctx.moveTo(pts[i-1][0],pts[i-1][1]); ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke(); } };
  ctx.shadowColor='rgba(120,130,150,0.9)'; ctx.shadowBlur=10; ctx.strokeStyle='rgba(6,8,12,0.92)';
  for(const v of plan){ stroke(v.pts,grow,v.wd); for(const f of v.forks) stroke(f,Math.max(0,(grow-0.35)/0.65),v.wd*0.55); }
}
function mqFxSound(kind){
  if(typeof tone!=='function'||!SND||!SND.ready) return;
  const c=SND.ctx, t=c.currentTime;
  if(kind==='pulse'||kind==='drone'||kind==='toll'){
    const beats=kind==='pulse'?2:kind==='drone'?3:4;
    for(let i=0;i<beats;i++){ tone({freq:78-i*8,freq2:34,dur:0.9,vol:0.55,when:t+i*0.62,bus:'ambient',type:'sine'}); noiseHit({ff:260,vol:0.18,dur:0.5,when:t+i*0.62,bus:'ambient'}); }
    if(kind!=='pulse'){ tone({freq:110,dur:kind==='toll'?5:3,attack:1.2,vol:0.14,when:t,bus:'ambient',type:'sawtooth',filter:'lowpass',ff:340}); tone({freq:116.5,dur:kind==='toll'?5:3,attack:1.4,vol:0.12,when:t,bus:'ambient',type:'sawtooth',filter:'lowpass',ff:320}); }
    if(kind==='toll') tone({freq:196,freq2:185,dur:3.5,vol:0.1,when:t+0.1,bus:'ambient',type:'triangle',verb:true});
  } else { [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone({freq:f,dur:1.4,attack:0.02,vol:0.16,when:t+i*0.16,bus:'ambient',type:'sine',verb:true})); }
}
function mqDarkFx(kind){
  const F=MQ_FX[kind]; if(!F||typeof document==='undefined') return;
  const cv=typeof renderer!=='undefined'&&renderer&&renderer.domElement, reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches, vig=F.vig.join(',');
  if(!mqFxVig) mqFxVig=mqFxLayer(40);
  mqFxVig.style.background=F.glow?'radial-gradient(ellipse at center, rgba('+vig+',0.0) 25%, rgba('+vig+',0.75) 100%)':'radial-gradient(ellipse at center, rgba('+vig+',0.0) 8%, rgba('+vig+',0.82) 78%, rgba('+vig+',1) 100%)';
  if(mqFxVig.animate) mqFxVig.animate([{opacity:0},{opacity:F.peak,offset:0.16},{opacity:F.peak*0.9,offset:0.7},{opacity:0}],{duration:F.ms,easing:'ease-in-out'});
  if(cv&&cv.animate){   // the world itself loses (or, for the cure, gains) its colour
    const hold=F.sat?'saturate('+F.sat+') brightness('+F.dim+')':'grayscale('+F.gray+') brightness('+F.dim+') contrast(1.18)';
    cv.animate([{filter:'none'},{filter:hold,offset:0.14},{filter:hold,offset:0.7},{filter:'none'}],{duration:F.ms,easing:'ease-in-out'});
    if(F.shake&&!reduce){ const fr=[]; for(let i=0;i<16;i++){ const k=1-i/16, a=F.shake*k; fr.push({transform:'translate('+((Math.random()-0.5)*2*a).toFixed(1)+'px,'+((Math.random()-0.5)*2*a).toFixed(1)+'px) scale('+(1+0.035*k).toFixed(3)+')'}); } fr.push({transform:'none'});
      cv.animate(fr,{duration:Math.min(1400,F.ms*0.3),easing:'linear'}); }
  }
  if(F.veins){
    const w=Math.min(innerWidth,1280), h=Math.round(w*innerHeight/Math.max(1,innerWidth));
    if(!mqFxVeins){ mqFxVeins=document.createElement('canvas'); mqFxVeins.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:41;opacity:0'; document.body.appendChild(mqFxVeins); }
    mqFxVeins.width=w; mqFxVeins.height=h; const ctx=mqFxVeins.getContext('2d'), plan=mqVeinPlan(F.veins,w,h), t0=performance.now(), growMs=F.ms*0.3, token=++mqFxVeinT;
    const step=()=>{ if(token!==mqFxVeinT) return; const g=Math.min(1,(performance.now()-t0)/growMs); mqVeinDraw(plan,1-Math.pow(1-g,2),w,h,ctx); if(g<1) requestAnimationFrame(step); };
    step();
    if(mqFxVeins.animate) mqFxVeins.animate([{opacity:0},{opacity:1,offset:0.08},{opacity:0.95,offset:0.72},{opacity:0}],{duration:F.ms,easing:'ease-in-out'});
  }
  try{ mqFxSound(F.snd); }catch(_){}
}
