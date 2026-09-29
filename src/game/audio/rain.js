//@ Rain sound (rainSoundTick): a soft low wash, a slowly swelling patter, scattered droplets, a storm rumble; in the snow (WX.snow) a low wind and a blizzard's howl instead
/* ---------- rain ----------
   Played by updateWeather in world/weather.js, scaled by WX.inten (0..1, fades over ~25 s).
   The old rain was one bright band of noise at 2.6 kHz: loud and hissy. This one keeps the energy low:
   - wash:   noise lowpassed at RAIN_SND.washFF, the bulk of the sound, quiet and dark
   - patter: a wide band around 1.6 kHz whose level drifts to a new random target every 1-3 s, so it breathes
   - drops:  short, faint, randomly panned ticks (RAIN_SND.drops per second at full rain)
   - rumble: low noise, much stronger in a thunderstorm (WX.kind 2)
   Volumes are on the ambient bus (its slider applies on top). */
const RAIN_SND={wash:0.09, washFF:900, patter:0.035, drops:5, drop:0.012, rumble:0.025, storm:0.1, wind:0.05, howl:0.09};
const RAINS={nodes:null,swell:1,swellT:0,dropT:0};
function rainSoundTick(dt){
  if(!SND.ready) return;
  const I=WX.inten, tc=SND.ctx.currentTime;
  if(!RAINS.nodes){
    if(I<0.01) return;
    RAINS.nodes={wash:noiseLoop('lowpass',RAIN_SND.washFF,0.5,'ambient'), patter:noiseLoop('bandpass',1600,0.45,'ambient'), rumble:noiseLoop('lowpass',300,0.7,'ambient'), wind:noiseLoop('bandpass',430,0.9,'ambient')};
  }
  const N=RAINS.nodes;
  if((RAINS.swellT-=dt)<=0){ RAINS.swell=0.45+Math.random()*0.55; RAINS.swellT=1+Math.random()*2; }
  const SK=WX.snow;   // 0 rain .. 1 snow
  N.wash.g.gain.setTargetAtTime(RAIN_SND.wash*I*(1-SK*0.85),tc,0.5);
  N.patter.g.gain.setTargetAtTime(RAIN_SND.patter*I*RAINS.swell*(1-SK),tc,0.8);
  N.rumble.g.gain.setTargetAtTime((WX.kind===2?RAIN_SND.storm:RAIN_SND.rumble)*I*(1-SK*0.5),tc,0.8);
  N.wind.g.gain.setTargetAtTime((WX.kind===2?RAIN_SND.howl*(0.6+0.4*RAINS.swell):RAIN_SND.wind*(0.5+0.5*RAINS.swell))*I*SK,tc,0.9);
  if(N.wind.f) N.wind.f.frequency.setTargetAtTime(WX.kind===2?520+380*RAINS.swell:380+140*RAINS.swell,tc,0.8);
  if(I<0.05||SK>0.6) return;
  RAINS.dropT-=dt*RAIN_SND.drops*I;
  while(RAINS.dropT<0){ RAINS.dropT+=0.4+Math.random()*1.2;
    noiseHit({bus:'ambient',filter:'bandpass',ff:2200+Math.random()*2600,q:5,dur:0.03+Math.random()*0.03,vol:RAIN_SND.drop*(0.4+Math.random()*0.6)*I,pan:Math.random()*1.6-0.8,when:tc+Math.random()*0.1}); }
}
