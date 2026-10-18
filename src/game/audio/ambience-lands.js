//@ Per-land ambience: wind chimes and a temple bell in the Vale, eagles and far rock falls on the Greyspine, cicadas and a hawk over the Sunscar, whispers and a tolling bell in the Gloamhorn
/* Agent map. aml* functions are one-shot sounds in the style of ambience.js (tone / noiseHit, a pan and a gain from spatial()); amlLand(land,r,around,day,night) is called every sound tick by
   driver.js (soundTick) with the land id (waLandId: 0 home, 1 vale, 2 hoar, 3 grey, 4 sun, 5 gloam), r(p) = "an event of rate p per second happens this tick" and around(rmin,rmax) = a place near you.
   AML_FAUNA says which of the forest's own sounds belong to a land (birds, crickets, frogs, owls, leaves), so the desert has no frogs and the Gloamhorn no birdsong. No test runs sound (the
   page's audio needs a user gesture): the functions only use the engine's tone() and noiseHit(), which are no-ops until SND.ready. */
const AML_FAUNA=[   // by land id: [birds, crickets, frogs, owls, leaves]
  [1,1,1,1,1],      // the home forest: everything
  [1,0.8,1,0.7,1],  // the Vale
  [0,0,0,0,0],      // the Reach has its own (wolves) in driver.js
  [0.3,0,0,0.6,0.1],// the Greyspine: a few birds, owls on the crags
  [0,0.5,0,0,0],    // the Sunscar: crickets at night, nothing else green
  [0,0,0,0,0]       // the Gloamhorn: a dusk without birds
];
const AML_PENTA=[784,880,1047,1175,1319,1568,1760];
function amlChime(pan,g){ const n=SND.ctx.currentTime, k=1+Math.floor(Math.random()*3); for(let i=0;i<k;i++){ const f=AML_PENTA[Math.floor(Math.random()*AML_PENTA.length)]; tone({freq:f,dur:2.4,attack:0.004,vol:0.03*g,when:n+i*AR(0.18,0.4),pan,verb:true,echo:true}); tone({freq:f*2.76,dur:0.9,attack:0.003,vol:0.008*g,when:n+i*0.3,pan,verb:true}); } }   // glass-bright notes with a faint inharmonic overtone
function amlBell(pan,g,f0){ const n=SND.ctx.currentTime, f=f0||196; for(const [m,v,d] of [[1,0.07,4.5],[2.0,0.03,3],[2.76,0.035,2.2],[4.07,0.015,1.4]]) tone({freq:f*m,dur:d,attack:0.006,vol:v*g,when:n,pan,verb:true,echo:true}); }   // a struck bell: a fundamental and inharmonic partials
function amlEagle(pan,g){ const n=SND.ctx.currentTime, k=2+Math.floor(Math.random()*2); for(let i=0;i<k;i++) tone({type:'sawtooth',freq:AR(2300,2800)*(1-i*0.05),freq2:AR(1300,1700),dur:0.5,attack:0.04,vol:0.026*g,filter:'bandpass',ff:2600,q:3,when:n+i*0.62,pan,verb:true,echo:true}); }
function amlHawk(pan,g){ const n=SND.ctx.currentTime; tone({type:'sawtooth',freq:3300,freq2:1700,dur:1.0,attack:0.06,vol:0.022*g,filter:'bandpass',ff:3000,q:4,when:n,pan,verb:true,echo:true}); tone({freq:6600,freq2:3400,dur:0.8,attack:0.06,vol:0.008*g,when:n,pan,verb:true}); }
function amlCicada(pan,g){ const n=SND.ctx.currentTime, f=AR(5000,5600); for(let i=0;i<46;i++) tone({freq:f,dur:0.014,vol:0.011*g*(0.5+0.5*Math.sin(i*0.35)),when:n+i*0.034,pan}); }   // a rattle that swells and fades
function amlRockfall(pan,g){ const n=SND.ctx.currentTime; noiseHit({filter:'lowpass',ff:260,ff2:90,dur:2.2,vol:0.13*g,attack:0.25,pan}); for(let i=0;i<9;i++) noiseHit({filter:'bandpass',ff:AR(500,1400),dur:0.05,vol:0.05*g,q:2,when:n+0.2+i*AR(0.08,0.24),pan}); }   // a far slide of stones
function amlWhisper(pan,g){ const n=SND.ctx.currentTime, f=AR(1500,2400); noiseHit({filter:'bandpass',ff:f,ff2:f*AR(0.6,1.4),dur:1.6,vol:0.035*g,q:7,attack:0.5,pan}); noiseHit({filter:'bandpass',ff:f*1.5,ff2:f*AR(0.8,1.2),dur:1.2,vol:0.02*g,q:9,attack:0.4,when:n+0.25,pan}); }   // breath shaped like words
function amlLand(land,r,around,day,night){
  if(land===1){   // the Vale: wind chimes by day and a far temple bell at the turn of the day
    if(r(0.035*(0.4+day))){ const s=around(6,30); if(s) amlChime(s.pan,s.gain*1.8); }
    if(r(0.006)){ const s=around(40,90); if(s) amlBell(s.pan,s.gain*2.4,AR(150,175)); }
  } else if(land===3){   // the Greyspine: an eagle high over the crags, a rock slide far off
    if(r(0.012*day)){ const s=around(40,110); if(s) amlEagle(s.pan,s.gain*2.4); }
    if(r(0.0035)){ const s=around(60,140); if(s) amlRockfall(s.pan,s.gain*2.2); }
  } else if(land===4){   // the Sunscar: cicadas and a hawk in the day's heat
    if(r(0.09*day)){ const s=around(8,40); if(s) amlCicada(s.pan,s.gain*1.6); }
    if(r(0.01*day)){ const s=around(50,120); if(s) amlHawk(s.pan,s.gain*2.4); }
  } else if(land===5){   // the Gloamhorn: whispers close by, a tolling bell far away
    if(r(0.05)){ const s=around(5,25); if(s) amlWhisper(s.pan,s.gain*1.8); }
    if(r(0.007)){ const s=around(50,120); if(s) amlBell(s.pan,s.gain*2.6,AR(90,110)); }
  }
}
