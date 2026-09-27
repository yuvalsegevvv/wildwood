//@ Footsteps, birds, crickets, owls, frogs, ducks, crackle, hooves
/* ---------- ambience ---------- */
function footstep(surf,k,pan,gain){
  const v=(0.4+0.6*k)*(gain===undefined?1:gain), n=SND.ctx.currentTime;
  if(surf==='water'){ noiseHit({filter:'bandpass',ff:1400,ff2:350,dur:0.28,vol:0.1*v,q:1.2,pan}); noiseHit({filter:'highpass',ff:3000,dur:0.12,vol:0.03*v,pan,when:n+0.03}); }
  else if(surf==='gravel'){ for(let i=0;i<3;i++) noiseHit({filter:'highpass',ff:1600+Math.random()*1200,dur:0.035,vol:0.055*v,pan,when:n+i*0.014+Math.random()*0.01}); noiseHit({filter:'lowpass',ff:300,dur:0.07,vol:0.05*v,pan}); }
  else { noiseHit({filter:'lowpass',ff:500+Math.random()*300,dur:0.09,vol:0.08*v,pan}); noiseHit({filter:'bandpass',ff:3200,dur:0.06,vol:0.018*v,q:0.8,pan,when:n+0.01}); }
}
function surfaceAt(x,z){ if(getH(x,z)<WATER-0.1) return 'water'; if(vDist(x,z)<VIL.r+26 && (plazaAmt(x,z)>0.5||pathAmt(x,z)>0.5)) return 'gravel'; return 'grass'; }
function birdSong(pan,g){
  const n=SND.ctx.currentTime, type=Math.floor(Math.random()*4), v=0.045*g;
  if(type===0){ const b=AR(2600,4200), k=Math.floor(AR(6,13)); for(let i=0;i<k;i++) tone({freq:b*(1+0.08*Math.sin(i*1.7)),freq2:b*1.22,dur:0.045,vol:v,when:n+i*0.058,pan,verb:true}); }
  else if(type===1){ const b=AR(2800,3500); for(let r=0;r<2+Math.floor(Math.random()*2);r++){ tone({freq:b,freq2:b*0.93,dur:0.16,vol:v,when:n+r*0.5,pan,verb:true}); tone({freq:b*0.76,freq2:b*0.72,dur:0.18,vol:v,when:n+r*0.5+0.22,pan,verb:true}); } }
  else if(type===2){ tone({freq:AR(4200,5200),freq2:AR(2200,2800),dur:0.38,vol:v,pan,verb:true}); }
  else { const b=AR(3400,4200); for(let i=0;i<4;i++) tone({freq:b,freq2:b*0.8,dur:0.03,vol:v*0.9,when:n+i*0.13,pan,verb:true}); }
}
function crowCaw(pan,g){ const n=SND.ctx.currentTime; for(let i=0;i<2+Math.floor(Math.random()*2);i++){ tone({type:'sawtooth',freq:AR(520,600),freq2:420,dur:0.22,vol:0.05*g,filter:'bandpass',ff:1100,q:2,when:n+i*0.34,pan,verb:true}); } }
function owl(pan,g){ const n=SND.ctx.currentTime; [[0,0.45],[0.75,0.2],[1.02,0.4]].forEach(([d,l])=>tone({freq:390,freq2:360,dur:l,attack:0.06,vol:0.07*g,when:n+d,pan,verb:true})); }
function cricket(pan,g){ const n=SND.ctx.currentTime, f=AR(4200,4900); for(let i=0;i<3;i++) tone({freq:f,dur:0.018,vol:0.02*g,when:n+i*0.035,pan}); }
function frog(pan,g){ const n=SND.ctx.currentTime, f=AR(150,210); for(let i=0;i<2;i++) tone({type:'square',freq:f,freq2:f*1.3,dur:0.06,vol:0.035*g,filter:'bandpass',ff:750,q:3,when:n+i*0.1,pan}); }
function quack(pan,g){ const n=SND.ctx.currentTime; for(let i=0;i<1+Math.floor(Math.random()*3);i++) tone({type:'sawtooth',freq:AR(330,380),freq2:260,dur:0.13,vol:0.06*g,filter:'bandpass',ff:1200,q:4,when:n+i*0.2,pan}); }
function crackle(pan,g){ noiseHit({filter:'highpass',ff:AR(1800,4000),dur:AR(0.01,0.03),vol:0.08*g,pan}); }
function hoof(pan,g){ noiseHit({filter:'lowpass',ff:260,dur:0.07,vol:0.15*g,pan}); }

