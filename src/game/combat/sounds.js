//@ Combat sounds (cSfx) and monster voices (monSound)
/* combat sounds (interface / game channel) */
const cSfx={
  swing(big){ noiseHit({bus:'ui',filter:'bandpass',ff:700,ff2:3200,dur:big?0.45:0.2,vol:0.12,q:1.2,when:SND.ctx&&SND.ctx.currentTime+(big?0:0.18)}); },
  draw(){ tone({bus:'ui',type:'triangle',freq:120,freq2:170,dur:0.25,vol:0.03}); },
  twang(){ tone({bus:'ui',type:'triangle',freq:190,freq2:105,dur:0.18,vol:0.1}); noiseHit({bus:'ui',filter:'highpass',ff:2500,dur:0.12,vol:0.04}); },
  charge(big){ tone({bus:'ui',type:'sine',freq:big?400:300,freq2:big?1200:700,dur:0.3,vol:0.04}); },
  whoosh(){ noiseHit({bus:'ui',filter:'bandpass',ff:300,ff2:1500,dur:0.35,vol:0.1,q:0.8}); },
  nova(){ tone({bus:'ui',freq:1600,freq2:500,dur:0.5,vol:0.06,echo:true}); noiseHit({bus:'ui',filter:'highpass',ff:3000,ff2:1200,dur:0.5,vol:0.08}); },
  hit(m,crit){ const s=spatial(m.x,m.z,10,50)||{pan:0,gain:1}; noiseHit({bus:'ui',filter:'lowpass',ff:crit?900:600,dur:0.1,vol:0.2*s.gain,pan:s.pan}); tone({bus:'ui',freq:crit?160:130,freq2:60,dur:0.1,vol:0.12*s.gain,pan:s.pan}); },
  thunk(p){ const s=spatial(p.x,p.z,10,50); if(s) noiseHit({bus:'ui',filter:'bandpass',ff:900,dur:0.05,vol:0.08*s.gain,pan:s.pan}); },
  boom(p){ const s=spatial(p.x,p.z,12,60); if(s){ noiseHit({bus:'ui',filter:'lowpass',ff:1400,ff2:180,dur:0.45,vol:0.25*s.gain,pan:s.pan}); tone({bus:'ui',freq:90,freq2:40,dur:0.35,vol:0.12*s.gain,pan:s.pan}); } }
};
function monSound(m,kind){
  if(!SND.ready) return;
  const s=spatial(m.x,m.z,8,45); if(!s) return;
  const g=s.gain*(kind==='die'?1.3:1), pan=s.pan, n=SND.ctx.currentTime;
  switch(m.T.sound){
    case 'squish': tone({bus:'ui',freq:kind==='die'?420:320,freq2:110,dur:0.2,vol:0.12*g,filter:'lowpass',ff:900,pan}); break;
    case 'pip': tone({bus:'ui',type:'square',freq:kind==='die'?900:700,freq2:kind==='die'?300:1000,dur:0.12,vol:0.05*g,filter:'lowpass',ff:2500,pan}); break;
    case 'click': for(let i=0;i<3;i++) noiseHit({bus:'ui',filter:'highpass',ff:2500,dur:0.02,vol:0.1*g,pan,when:n+i*0.05}); break;
    case 'grunt': tone({bus:'ui',type:'sawtooth',freq:kind==='die'?140:95,freq2:70,dur:0.3,vol:0.09*g,filter:'bandpass',ff:500,q:2,pan}); break;
    case 'yelp': tone({bus:'ui',type:'square',freq:kind==='die'?600:480,freq2:kind==='die'?220:720,dur:0.18,vol:0.05*g,filter:'bandpass',ff:1400,q:2,pan}); break;
    case 'groan': tone({bus:'ui',type:'sawtooth',freq:65,freq2:48,dur:0.9,vol:0.12*g,filter:'lowpass',ff:400,pan}); break;
  }
}

