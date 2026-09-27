//@ Sound files from assets/audio (embedded by build.py as window.WILDWOOD_AUDIO): loadSamples, playSample
/* ---------- recorded / generated sound files ----------
   Drop a .wav/.mp3/.ogg/.m4a into assets/audio and rebuild; the file name (without extension) is its key.
   playSample('sword-hit',{bus:'ui',vol:0.8,pan:0,rate:1,when:0}) returns true if it played,
   false if that file is missing or audio has not started yet, so a synthesised fallback can run. */
const SAMPLES={};
function loadSamples(){
  const src=window.WILDWOOD_AUDIO||{};
  for(const name in src){
    try{
      const bin=atob(src[name]), buf=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
      SND.ctx.decodeAudioData(buf.buffer,b=>{ SAMPLES[name]=b; },e=>console.warn('Could not decode sound',name,e));
    }catch(e){ console.warn('Could not load sound',name,e); }
  }
}
function playSample(name,o){
  o=o||{}; const b=SAMPLES[name];
  if(!b||!SND.ready) return false;
  const c=SND.ctx, s=c.createBufferSource(); s.buffer=b; s.playbackRate.value=o.rate||1;
  const g=c.createGain(); g.gain.value=o.vol===undefined?1:o.vol;
  s.connect(g); g.connect(panNode(o.pan,SND.bus[o.bus||'ui']));
  s.start(o.when||0); return true;
}
