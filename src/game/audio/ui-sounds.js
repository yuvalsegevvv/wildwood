//@ Interface / game sounds (UI_SFX) and hover/click hooks
/* ---------- interface / game sounds ---------- */
const UI_SFX={
  hover(){ tone({bus:'ui',freq:1760,dur:0.09,vol:0.03}); tone({bus:'ui',freq:2637,dur:0.14,vol:0.018,when:SND.ctx&&SND.ctx.currentTime+0.025}); },
  click(){ tone({bus:'ui',type:'triangle',freq:540,freq2:820,dur:0.07,vol:0.06}); },
  open(){ noiseHit({bus:'ui',filter:'bandpass',ff:500,ff2:2400,dur:0.28,vol:0.05,q:1.4}); tone({bus:'ui',freq:659,dur:0.18,vol:0.035,when:SND.ctx&&SND.ctx.currentTime+0.08}); tone({bus:'ui',freq:988,dur:0.25,vol:0.03,when:SND.ctx&&SND.ctx.currentTime+0.16}); },
  close(){ noiseHit({bus:'ui',filter:'bandpass',ff:2200,ff2:450,dur:0.25,vol:0.045,q:1.4}); tone({bus:'ui',freq:784,dur:0.18,vol:0.03,when:SND.ctx&&SND.ctx.currentTime+0.05}); tone({bus:'ui',freq:523,dur:0.22,vol:0.03,when:SND.ctx&&SND.ctx.currentTime+0.13}); },
  talk(){ const n=SND.ctx&&SND.ctx.currentTime; tone({bus:'ui',freq:880,dur:0.09,vol:0.035,when:n}); tone({bus:'ui',freq:1175,dur:0.14,vol:0.03,when:n&&n+0.08}); },
  // ready for later game events
  pickup(){ const n=SND.ctx&&SND.ctx.currentTime; [784,988,1319].forEach((f,i)=>tone({bus:'ui',type:'triangle',freq:f,dur:0.12,vol:0.05,when:n&&n+i*0.06})); },
  success(){ const n=SND.ctx&&SND.ctx.currentTime; [523,659,784,1047].forEach((f,i)=>tone({bus:'ui',type:'triangle',freq:f,dur:0.3,vol:0.05,when:n&&n+i*0.09,echo:true})); },
  error(){ const n=SND.ctx&&SND.ctx.currentTime; tone({bus:'ui',type:'square',freq:220,dur:0.12,vol:0.03,filter:'lowpass',ff:900,when:n}); tone({bus:'ui',type:'square',freq:185,dur:0.2,vol:0.03,filter:'lowpass',ff:900,when:n&&n+0.13}); },
  notify(){ tone({bus:'ui',freq:1568,dur:0.5,vol:0.035,echo:true}); tone({bus:'ui',freq:2349,dur:0.6,vol:0.02}); }
};
let lastHoverEl=null, lastHoverT=0;
document.addEventListener('pointerover',e=>{
  if(e.pointerType!=='mouse'||!SND.ready) return;
  const el=e.target.closest&&e.target.closest('button,input[type=range]');
  if(el && el!==lastHoverEl && !el.disabled){ const n=performance.now(); if(n-lastHoverT>60){ UI_SFX.hover(); lastHoverT=n; } }
  lastHoverEl=el;
});
document.addEventListener('click',e=>{ const el=e.target.closest&&e.target.closest('button'); if(el && SND.ready && !el.dataset.silent) UI_SFX.click(); },true);
const firstGesture=()=>{ audioInit(); };
addEventListener('pointerdown',firstGesture,{capture:true}); addEventListener('keydown',firstGesture,{capture:true});
addEventListener('touchend',firstGesture,{capture:true}); addEventListener('click',firstGesture,{capture:true});
document.addEventListener('visibilitychange',()=>{ if(!SND.ctx) return; if(document.hidden){ SND.ctx.suspend(); stopSpeech(); } else SND.ctx.resume(); });

