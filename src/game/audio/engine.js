//@ Web Audio setup (SND, buses, reverb, echo, noise), tone(), noiseHit(), spatial()
/* ===================== SOUND =====================
   Everything is synthesised live with the Web Audio API (no audio files).
   Four channels, each with its own volume:
     music    generative background music that follows the time of day
     ui       interface / game sounds: UI_SFX.hover(), click(), open(), close(), talk(),
              plus pickup(), success(), error(), notify() kept ready for later game events
     ambient  wind, leaves, water, birds, crickets, owls, frogs, campfire, footsteps, animals
     voice    villager dialogue: the browser's text-to-speech, or a synthesised babble */
const SND={ctx:null,ready:false,muted:false,voiceMode:'speech',vol:{master:0.9,music:0.5,ui:0.6,ambient:0.8,voice:0.9},bus:{},loops:{},duck:1};
try{ const s=JSON.parse(localStorage.getItem('wildwood-audio-v1')||'null'); if(s){ Object.assign(SND.vol,s.vol||{}); SND.muted=!!s.muted; if(s.voiceMode) SND.voiceMode=s.voiceMode; } }catch(_){}
function saveAudio(){ try{ localStorage.setItem('wildwood-audio-v1',JSON.stringify({vol:SND.vol,muted:SND.muted,voiceMode:SND.voiceMode})); }catch(_){} }
const speech={ok:typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance!=='undefined', voices:[]};
function loadVoices(){ try{ const all=speechSynthesis.getVoices(); speech.voices=all.filter(v=>/^en/i.test(v.lang)); if(!speech.voices.length) speech.voices=all; }catch(_){} }
if(speech.ok){ loadVoices(); try{ speechSynthesis.addEventListener('voiceschanged',loadVoices); }catch(_){ speechSynthesis.onvoiceschanged=loadVoices; } }
if(!speech.ok && SND.voiceMode==='speech') SND.voiceMode='babble';

function audioInit(){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;
  if(SND.ctx){ if(SND.ctx.state==='suspended') SND.ctx.resume(); return; }
  const c=new AC(); SND.ctx=c;
  const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=3;
  SND.master=c.createGain(); SND.master.connect(comp); comp.connect(c.destination);
  for(const k of ['music','ui','ambient','voice']){ const g=c.createGain(); g.connect(SND.master); SND.bus[k]=g; }
  // shared reverb
  const len=c.sampleRate*2.6, ir=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3); }
  SND.verb=c.createConvolver(); SND.verb.buffer=ir;
  SND.verbIn={music:c.createGain(),ambient:c.createGain()};
  SND.verbIn.music.gain.value=0.55; SND.verbIn.ambient.gain.value=0.3;
  SND.verbIn.music.connect(SND.verb); SND.verbIn.ambient.connect(SND.verb);
  const vm=c.createGain(); vm.gain.value=1; SND.verb.connect(vm); vm.connect(SND.bus.music);
  // music echo
  const dl=c.createDelay(1.5); dl.delayTime.value=0.42; const fb=c.createGain(); fb.gain.value=0.32; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2200;
  dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(SND.bus.music); SND.echo=dl;
  // white noise
  const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), nd=nb.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1; SND.noise=nb;
  // continuous beds
  SND.loops.wind=noiseLoop('bandpass',520,0.6,'ambient');
  SND.loops.leaves=noiseLoop('highpass',3200,0.7,'ambient');
  SND.loops.water=noiseLoop('lowpass',950,0.8,'ambient');
  SND.loops.fire=noiseLoop('lowpass',380,0.9,'ambient');
  SND.ready=true; loadSamples(); SND.nextChord=c.currentTime+0.5; SND.chordI=0; SND.nextNote=c.currentTime+2;
  applyVolumes();
}
function applyVolumes(){
  if(!SND.ctx) return;
  const n=SND.ctx.currentTime;
  SND.master.gain.setTargetAtTime(SND.muted?0:SND.vol.master,n,0.05);
  SND.bus.music.gain.setTargetAtTime(SND.vol.music*0.8*SND.duck,n,0.25);
  SND.bus.ui.gain.setTargetAtTime(SND.vol.ui,n,0.05);
  SND.bus.ambient.gain.setTargetAtTime(SND.vol.ambient,n,0.05);
  SND.bus.voice.gain.setTargetAtTime(SND.vol.voice,n,0.05);
}
function noiseLoop(type,freq,q,bus){
  const c=SND.ctx, src=c.createBufferSource(); src.buffer=SND.noise; src.loop=true;
  const f=c.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
  const g=c.createGain(); g.gain.value=0; src.connect(f); f.connect(g); g.connect(SND.bus[bus]); src.start();
  return {src,f,g};
}
function panNode(pan,dest){
  const c=SND.ctx;
  if(c.createStereoPanner && pan){ const p=c.createStereoPanner(); p.pan.value=clamp(pan,-1,1); p.connect(dest); return p; }
  return dest;
}
function tone(o){
  if(!SND.ready) return;
  const c=SND.ctx, t0=o.when||c.currentTime, dur=o.dur||0.2;
  const osc=c.createOscillator(); osc.type=o.type||'sine'; osc.frequency.setValueAtTime(o.freq,t0);
  if(o.freq2) osc.frequency.exponentialRampToValueAtTime(o.freq2,t0+(o.glide||dur));
  if(o.detune) osc.detune.value=o.detune;
  const g=c.createGain(); const a=o.attack||0.005;
  g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,o.vol),t0+a);
  if(o.hold) g.gain.setValueAtTime(Math.max(0.0002,o.vol),t0+a+o.hold);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+a+(o.hold||0)+dur);
  let node=osc;
  if(o.filter){ const f=c.createBiquadFilter(); f.type=o.filter; f.frequency.value=o.ff; f.Q.value=o.q||1; node.connect(f); node=f; }
  node.connect(g);
  const dest=SND.bus[o.bus||'ambient'];
  g.connect(panNode(o.pan,dest));
  if(o.verb && SND.verbIn[o.bus]) g.connect(SND.verbIn[o.bus]);
  if(o.echo) g.connect(SND.echo);
  osc.start(t0); osc.stop(t0+a+(o.hold||0)+dur+0.05);
}
function noiseHit(o){
  if(!SND.ready) return;
  const c=SND.ctx, t0=o.when||c.currentTime, dur=o.dur||0.1;
  const src=c.createBufferSource(); src.buffer=SND.noise;
  const f=c.createBiquadFilter(); f.type=o.filter||'lowpass'; f.frequency.setValueAtTime(o.ff||800,t0); f.Q.value=o.q||0.8;
  if(o.ff2) f.frequency.exponentialRampToValueAtTime(o.ff2,t0+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,o.vol),t0+(o.attack||0.004)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  src.connect(f); f.connect(g); g.connect(panNode(o.pan,SND.bus[o.bus||'ambient']));
  if(o.verb) g.connect(SND.verbIn.ambient);
  src.start(t0,Math.random()*1.5,dur+0.05);
}
// where a world position sits in the stereo field, and how loud it should be
const _cf=new THREE.Vector3();
function spatial(x,z,ref,max){
  const dx=x-camera.position.x, dz=z-camera.position.z, d=Math.hypot(dx,dz);
  if(d>(max||60)) return null;
  camera.getWorldDirection(_cf); const fl=Math.hypot(_cf.x,_cf.z)||1, rx=-_cf.z/fl, rz=_cf.x/fl;
  return {pan:d>0.5?clamp((dx*rx+dz*rz)/d)*0.85:0, gain:1/(1+Math.pow(d/(ref||8),1.4)), d};
}

