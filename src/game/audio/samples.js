//@ Sound files from assets/audio: small ones embedded in the page (window.WILDWOOD_AUDIO), music fetched once from audio/ (window.WILDWOOD_AUDIO_URL): loadSamples, playSample, musicBuffer (lazy)
/* ---------- recorded / generated sound files ----------
   Drop a .wav/.mp3/.ogg/.m4a into assets/audio and rebuild; the file name (without extension) is its key.
   playSample('sword-hit',{bus:'ui',vol:0.8,pan:0,rate:1,when:0}) returns true if it played,
   false if that file is missing or audio has not started yet, so a synthesised fallback can run.
   Two ways a file reaches the client (build.py decides by name):
   - small sounds are embedded in the page as base64 (WILDWOOD_AUDIO) and decoded when audio starts;
   - music-* files are NOT in the page (they are 9 MB, the page has a size cap and every visitor downloads it). The build puts them in
     dist/audio/ under a content-hashed name and lists them in WILDWOOD_AUDIO_URL; audioBytes() fetches one when its theme first plays.
   Each file is downloaded at most once: the encoded bytes stay in memory (a track that is decoded again after being dropped costs no
   download), the server sends the hashed URL as immutable so the browser's HTTP cache keeps it across visits, and Cache Storage keeps a
   second copy for browsers that evict the HTTP cache (old hashes are deleted from it).
   Music is decoded only when its theme plays (musicBuffer), because a decoded 2-3 minute stereo track takes ~60 MB; only the last
   MUSIC_KEEP of them stay decoded. If a track can't be fetched or decoded, musicFailed() says so and the theme's generated music plays. */
const SAMPLES={}, MUSIC_BUF={}, MUSIC_KEEP=2, MUSIC_RETRY=30000, AUDIO_URL=window.WILDWOOD_AUDIO_URL||{}, AUDIO_CACHE='wildwood-music-v1';
const AUDIO_BYTES={};   // key -> Promise of the encoded file (ArrayBuffer), fetched files only
function b64bytes(b64){
  const bin=atob(b64), buf=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
  return buf.buffer;
}
// Cache Storage may be missing (plain http on a LAN address) or refuse (private window, sandbox): then only the HTTP cache is used
async function fetchAudio(url){
  let cache=null;
  try{
    cache=await caches.open(AUDIO_CACHE);
    const hit=await cache.match(url); if(hit) return await hit.arrayBuffer();
  }catch(_){ cache=null; }
  const r=await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status);
  if(cache) cache.put(url,r.clone()).then(dropOldAudio,()=>{});
  return r.arrayBuffer();
}
function dropOldAudio(){   // Cache Storage entries of tracks that were re-encoded (new hash in the name) or removed
  if(dropOldAudio.done) return; dropOldAudio.done=true;
  caches.open(AUDIO_CACHE).then(c=>{ const live=new Set(Object.values(AUDIO_URL).map(u=>new URL(u,document.baseURI).href));
    return c.keys().then(ks=>Promise.all(ks.filter(k=>!live.has(k.url)).map(k=>c.delete(k)))); }).catch(()=>{});
}
// the encoded file for a key as a Promise; always a copy, because decodeAudioData takes over the buffer it is given
function audioBytes(key){
  if(window.WILDWOOD_AUDIO&&window.WILDWOOD_AUDIO[key]) return Promise.resolve(b64bytes(window.WILDWOOD_AUDIO[key]));
  if(!AUDIO_URL[key]) return Promise.reject(new Error('no such sound'));
  let p=AUDIO_BYTES[key];
  if(!p){ p=AUDIO_BYTES[key]=fetchAudio(AUDIO_URL[key]); p.catch(()=>{ if(AUDIO_BYTES[key]===p) delete AUDIO_BYTES[key]; }); }   // a failed download may be tried again
  return p.then(b=>b.slice(0));
}
function decodeSound(key,ok,fail){
  audioBytes(key).then(bytes=>SND.ctx.decodeAudioData(bytes,ok,e=>{ console.warn('Could not decode sound',key,e); if(fail) fail(); }))
    .catch(e=>{ console.warn('Could not load sound',key,e); if(fail) fail(); });
}
function loadSamples(){
  const src=window.WILDWOOD_AUDIO||{};
  for(const name in src) decodeSound(name,b=>{ SAMPLES[name]=b; });
}
const hasMusicFile=key=>!!((window.WILDWOOD_AUDIO&&window.WILDWOOD_AUDIO['music-'+key])||AUDIO_URL['music-'+key]);
// the decoded buffer of music-<theme> (theme = a file key, see MUSIC_FILE_OF), or null while it downloads or decodes (the first call starts that)
function musicBuffer(theme){
  const now=performance.now(), e=MUSIC_BUF[theme];
  if(e&&(!e.failed||now-e.failed<MUSIC_RETRY)){ e.used=now; return e.buf; }
  const n=MUSIC_BUF[theme]={buf:null,used:now,failed:0};
  decodeSound('music-'+theme,b=>{ n.buf=b; },()=>{ n.failed=performance.now(); });
  const ks=Object.keys(MUSIC_BUF).sort((a,b)=>MUSIC_BUF[b].used-MUSIC_BUF[a].used);
  for(const k of ks.slice(MUSIC_KEEP)) delete MUSIC_BUF[k];
  return null;
}
const musicFailed=theme=>{ const e=MUSIC_BUF[theme]; return !!(e&&e.failed); };
// every game starts in the village: fetch its song now (while the world is built) so it is ready when the first click starts the audio
if(AUDIO_URL['music-village']) audioBytes('music-village').catch(()=>{});
function playSample(name,o){
  o=o||{}; const b=SAMPLES[name];
  if(!b||!SND.ready) return false;
  const c=SND.ctx, s=c.createBufferSource(); s.buffer=b; s.playbackRate.value=o.rate||1;
  const g=c.createGain(); g.gain.value=o.vol===undefined?1:o.vol;
  s.connect(g); g.connect(panNode(o.pan,SND.bus[o.bus||'ui']));
  s.start(o.when||0); return true;
}
