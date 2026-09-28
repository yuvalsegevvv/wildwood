//@ Sound files from assets/audio (embedded by build.py as window.WILDWOOD_AUDIO): loadSamples, playSample, musicBuffer (lazy)
/* ---------- recorded / generated sound files ----------
   Drop a .wav/.mp3/.ogg/.m4a into assets/audio and rebuild; the file name (without extension) is its key.
   playSample('sword-hit',{bus:'ui',vol:0.8,pan:0,rate:1,when:0}) returns true if it played,
   false if that file is missing or audio has not started yet, so a synthesised fallback can run.
   Files named music-* are background music: decoded only when their theme plays (musicBuffer), because a decoded
   2-3 minute stereo track takes ~60 MB; only the last MUSIC_KEEP of them stay decoded. */
const SAMPLES={}, MUSIC_BUF={}, MUSIC_KEEP=2;
function decodeB64(name,ok){
  try{
    const bin=atob(window.WILDWOOD_AUDIO[name]), buf=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
    SND.ctx.decodeAudioData(buf.buffer,ok,e=>console.warn('Could not decode sound',name,e));
  }catch(e){ console.warn('Could not load sound',name,e); }
}
function loadSamples(){
  const src=window.WILDWOOD_AUDIO||{};
  for(const name in src) if(!name.startsWith('music-')) decodeB64(name,b=>{ SAMPLES[name]=b; });
}
const hasMusicFile=key=>!!(window.WILDWOOD_AUDIO&&window.WILDWOOD_AUDIO['music-'+key]);
// the decoded buffer of music-<theme> (theme = a file key, see MUSIC_FILE_OF), or null while it decodes (starts decoding on the first call)
function musicBuffer(theme){
  const e=MUSIC_BUF[theme]; if(e){ e.used=performance.now(); return e.buf; }
  MUSIC_BUF[theme]={buf:null,used:performance.now()};
  decodeB64('music-'+theme,b=>{ if(MUSIC_BUF[theme]) MUSIC_BUF[theme].buf=b; });
  const ks=Object.keys(MUSIC_BUF).sort((a,b)=>MUSIC_BUF[b].used-MUSIC_BUF[a].used);
  for(const k of ks.slice(MUSIC_KEEP)) delete MUSIC_BUF[k];
  return null;
}
function playSample(name,o){
  o=o||{}; const b=SAMPLES[name];
  if(!b||!SND.ready) return false;
  const c=SND.ctx, s=c.createBufferSource(); s.buffer=b; s.playbackRate.value=o.rate||1;
  const g=c.createGain(); g.gain.value=o.vol===undefined?1:o.vol;
  s.connect(g); g.connect(panNode(o.pan,SND.bus[o.bus||'ui']));
  s.start(o.when||0); return true;
}
