//@ Background music: one theme per place (the three villages, three home ranges, two vale ranges, two Hoarfrost ranges, each boss), crossfaded; recorded tracks (music-*) or generative
/* ---------- background music ----------
   A small step sequencer (8 steps a bar) plays the theme of where you are. Each theme sets its tempo (beat = seconds
   per step), chords (chordBars bars each), a scale for melodies, and patterns ('x' hit, 'o' soft, '.' rest) for the
   bass, the arpeggio and the drums. Themes change after you have been somewhere new for a moment, with a crossfade
   (every theme plays into its own gain node, so the old one's long pads fade out with it).
   Instruments: pad, bass, pluck (a harp-like triangle), koto, shamisen (sawtooth pluck), flute / shakuhachi (breathy,
   with a bend), bell, and drums (kick, snare, hat, taiko, woodblock), all synthesised with tone() and noiseHit().
   Recorded themes: a file assets/audio/music-<theme>.m4a (AI-generated tracks; fetched when the theme first plays, see samples.js;
   silent until it has arrived, the sequencer takes over if it can't be loaded) replaces that theme's sequencer. It loops
   with a MUSIC_XF-second crossfade from its end back to its start; MUSIC_FILE_VOL matches it to the synthesised themes.
   At night the village track goes through a lowpass (MUSIC_NIGHT_LP Hz) and plays softer: the darker night version.
   MUSIC_FILE_OF lets several themes share one file (music-wild for all home ranges, music-vale for both vale ranges, music-hoar for both Hoarfrost ranges); moving between themes that share
   a file keeps the track playing instead of restarting it. MUSIC_LOOP_FROM (seconds): later passes of a file restart
   there instead of at 0, so a track with a quiet build-up (the bosses) plays it once, then loops its loud part. */
const MUSIC_XF=5, MUSIC_FILE_VOL=0.35, MUSIC_NIGHT_LP=1500;
const MUSIC_FILE_OF={wild1:'wild',wild2:'wild',wild3:'wild',vale1:'vale',vale2:'vale',hoar1:'hoar',hoar2:'hoar'};
const MUSIC_LOOP_FROM={boss15:65.8,boss20:63.5,boss25:48.85,boss26:44.5,boss30:79.0};   // points that sound most like each track's ending
const musicFileKey=th=>th&&MUSIC_FILE_OF[th]||th;
const mtof=m=>440*Math.pow(2,(m-69)/12);
const MUSIC={theme:null,want:null,wantT:0,node:null,step:0,next:0};
const THEMES={
  // the home village: slow warm chords, a harp here and there (the original music); darker chords at night
  village:{beat:0.55,chordBars:2,chords:[[50,57,62,66,69],[47,54,57,62,66],[43,50,55,59,62],[45,52,57,61,64]],
    night:[[50,57,62,65,69],[46,53,58,62,65],[41,48,53,57,60],[45,52,57,60,64]],scale:[62,64,66,69,71,74,76,78,81],nightScale:[62,65,67,69,72,74,77,79],
    pad:{type:'triangle',vol:0.03,ff:1100},bass:'x.......',lead:{inst:'pluck',p:0.22}},
  // levels 1-6: bright G major, a flute over a gentle shaker
  wild1:{beat:0.36,chordBars:2,chords:[[43,50,55,59,62],[40,47,52,55,59],[36,43,48,52,55],[38,45,50,54,57]],scale:[67,69,71,74,76,79,81],
    pad:{type:'sine',vol:0.026,ff:1400},bass:'x...x...',arp:{pat:'x.x.x.x.',inst:'pluck',vol:0.018},lead:{inst:'flute',p:0.2},
    drums:{hat:'..o...o.',kick:'o.......'}},
  // levels 7-11: D dorian, mysterious, a low tom and a ticking woodblock
  wild2:{beat:0.34,chordBars:2,chords:[[38,45,50,53,57],[34,41,46,50,53],[36,43,48,52,55],[33,40,45,48,52]],scale:[62,64,65,67,69,71,72,74,76],
    pad:{type:'triangle',vol:0.026,ff:900},bass:'x..x..x.',arp:{pat:'.x.x.x.x',inst:'pluck',vol:0.016,ff:1800},lead:{inst:'flute',p:0.14},
    drums:{kick:'x...x...',hat:'o.o.o.o.',wood:'......o.'}},
  // levels 12-15: E phrygian, a low drone, a steady march
  wild3:{beat:0.32,chordBars:2,chords:[[40,47,52,55,59],[41,48,53,57,60],[40,47,52,55,59],[38,45,50,53,57]],scale:[64,65,67,69,71,72,74,76],
    pad:{type:'sawtooth',vol:0.013,ff:600},drone:40,bass:'x.x...x.',bassType:'sawtooth',arp:{pat:'x..x..x.',inst:'pluck',vol:0.016,ff:1400},lead:{inst:'flute',p:0.1,oct:-12},
    drums:{kick:'x..x..x.',snare:'....o...',hat:'oooooooo'}},
  // the Rootwarden: C minor, driving eighth-note bass, stabs, a repeating motif, full drums
  boss15:{beat:0.22,chordBars:1,chords:[[36,43,48,51,55],[32,39,44,48,51],[34,41,46,50,53],[31,38,43,47,50]],scale:[72,74,75,77,79,80,82,84],
    stab:'x..x....',pad:{type:'sawtooth',vol:0.016,ff:1500},bass:'xxxxxxxx',bassType:'sawtooth',arp:{pat:'x.x.x.x.',inst:'pluck',vol:0.012,ff:2200,oct:24},
    motif:[72,75,79,78,75,72,70,72],lead:{inst:'bell',p:0.85},drums:{kick:'x..xx...',snare:'..x...x.',hat:'x.x.x.x.'}},
  // Hanami: the yo scale, soft open fourths, a koto and a shakuhachi, no drums
  hanami:{beat:0.6,chordBars:2,chords:[[50,57,64,69],[43,50,57,62],[45,52,59,64],[40,47,55,62]],scale:[62,64,67,69,71,74,76,79],
    pad:{type:'sine',vol:0.026,ff:1000,attack:3},bass:'x.......',arp:{pat:'x...x.x.',inst:'koto',vol:0.022,from:'scale'},lead:{inst:'shaku',p:0.14},
    drums:{wood:'.......o'}},
  // vale levels 16-20: hirajoshi on A, koto runs, a soft taiko
  vale1:{beat:0.34,chordBars:2,chords:[[45,52,57,60],[41,48,53,57],[40,47,52,55],[45,52,57,60]],scale:[69,71,72,76,77,81,83,84],
    pad:{type:'triangle',vol:0.024,ff:1000},bass:'x...x.x.',arp:{pat:'x.xx.x.x',inst:'koto',vol:0.02,from:'scale'},lead:{inst:'shaku',p:0.14},
    drums:{taiko:'o.......',wood:'...o...o'}},
  // vale levels 21-25: the in scale on D, shamisen, heavier taiko
  vale2:{beat:0.3,chordBars:2,chords:[[38,45,50,51],[43,50,55,58],[34,41,46,50],[39,46,51,55]],scale:[62,63,67,69,70,74,75,79],
    pad:{type:'sawtooth',vol:0.012,ff:700},drone:38,bass:'x.x.x...',bassType:'sawtooth',arp:{pat:'x.x.xx.x',inst:'shamisen',vol:0.016,from:'scale'},lead:{inst:'shaku',p:0.1},
    drums:{taiko:'x..x..x.',wood:'....o..o'}},
  // Rimehold: A aeolian, a slow harp over a low drone, a flute far off, one soft frame drum: the long night and the warm hall
  rimehold:{beat:0.62,chordBars:2,chords:[[45,52,57,60],[41,48,53,57],[43,50,55,59],[40,47,52,55]],scale:[69,72,74,76,79,81,84],
    pad:{type:'triangle',vol:0.026,ff:900,attack:3},drone:33,bass:'x.......',arp:{pat:'x...x.x.',inst:'pluck',vol:0.02,from:'scale'},lead:{inst:'flute',p:0.13},
    drums:{taiko:'o.......'}},
  // Hoarfrost levels 22-26: cold and sparse, bells over a soft pad, a flute in the wind
  hoar1:{beat:0.44,chordBars:2,chords:[[45,52,57,60],[41,48,53,57],[43,50,55,59],[40,47,52,55]],scale:[69,72,74,76,79,81,84],
    pad:{type:'sine',vol:0.026,ff:800,attack:3.5},bass:'x.......',arp:{pat:'x...x...',inst:'bell',vol:0.013,from:'scale',echo:true},lead:{inst:'flute',p:0.12},
    drums:{hat:'......o.'}},
  // Hoarfrost levels 27-30: E phrygian, a low drone and a slow drum, the wind under it
  hoar2:{beat:0.34,chordBars:2,chords:[[40,47,52,55],[41,48,53,57],[38,45,50,53],[40,47,52,55]],scale:[64,65,67,69,71,72,76,77],
    pad:{type:'sawtooth',vol:0.012,ff:600,attack:3},drone:28,bass:'x.x...x.',bassType:'sawtooth',arp:{pat:'x..x..x.',inst:'pluck',vol:0.015,from:'scale'},lead:{inst:'flute',p:0.09,oct:-12},
    drums:{kick:'x...x...',taiko:'o...o...'}},
  // Ymrik the Rimeking: horn-like stabs, a marching bass, frame drums
  boss26:{beat:0.21,chordBars:1,chords:[[38,45,50],[36,43,48],[41,48,53],[38,45,50]],scale:[74,77,79,81,84,86],
    stab:'x..x....',pad:{type:'sawtooth',vol:0.017,ff:1400},bass:'xxxxxxxx',bassType:'sawtooth',arp:{pat:'x.x.x.x.',inst:'pluck',vol:0.012,ff:2200,oct:24},
    motif:[74,77,76,72,74,69,72,74],lead:{inst:'bell',p:0.85},drums:{kick:'x..xx...',snare:'..x...x.',taiko:'x.......'}},
  // Vetrmaw the frost wyrm: fast and fierce, taiko and bells over a roaring bass
  boss30:{beat:0.185,chordBars:1,chords:[[33,40,45,48],[36,43,48,52],[31,38,43,46],[33,40,45,48]],scale:[81,84,86,88,91,93],
    stab:'x.x..x..',pad:{type:'sawtooth',vol:0.017,ff:1500},bass:'x.xxx.xx',bassType:'sawtooth',arp:{pat:'xxxxxxxx',inst:'bell',vol:0.011,from:'scale',echo:true},
    motif:[81,84,88,86,84,81,79,81],lead:{inst:'bell',p:0.9},drums:{taiko:'x.xx.xx.',kick:'x...x...',snare:'..x...x.',hat:'oooooooo'}},
  // Akaoni: war drums, fast shamisen, power-chord stabs
  boss20:{beat:0.2,chordBars:1,chords:[[38,45,50],[39,46,51],[43,50,55],[38,45,50]],scale:[74,75,79,81,82,86],
    stab:'x..x..x.',pad:{type:'sawtooth',vol:0.018,ff:1300},bass:'x.x.xxx.',bassType:'sawtooth',arp:{pat:'xxxxxxxx',inst:'shamisen',vol:0.012,from:'scale'},
    motif:[74,75,74,70,69,67,69,70],lead:{inst:'shaku',p:0.8},drums:{taiko:'x.xx.xx.',kick:'x...x...',snare:'....x...',wood:'x.x.x.x.'}},
  // Kyuubi: ethereal and fierce, a koto tremolo, foxfire bells, taiko and snare
  boss25:{beat:0.19,chordBars:1,chords:[[45,52,57,60,64],[41,48,53,57,60],[44,51,56,59],[40,47,52,56,59]],scale:[81,83,84,88,89,93],
    pad:{type:'sawtooth',vol:0.012,ff:1200},bass:'x.xx.x.x',arp:{pat:'xxxxxxxx',inst:'koto',vol:0.011,from:'scale',echo:true},
    motif:[81,84,83,76,77,76,72,71],lead:{inst:'bell',p:0.9},drums:{taiko:'x..x.x..',snare:'..x...x.',hat:'oooooooo'}}
};
// which theme fits where you are: a boss you are fighting (its own def.music, else the one for its level), then the village you are in, then the zone's level
function musicThemeHere(){
  const m=BOSS.m; if(m&&BOSS.engaged&&!m.dead){ const A=arenaOf(m); if(Math.hypot(P.x-A.x,P.z-A.z)<A.r+30){ const bd=bossInfo(m); return (bd&&bd.def.music)||(m.def.level>=30?'boss30':m.def.level>=26?'boss26':m.def.level>=25?'boss25':m.def.level>=20?'boss20':'boss15'); } }
  const V=vilAt(P.x,P.z); if(vDist(P.x,P.z)<VR+22) return V===VIL4||V===VIL3?'rimehold':V===VIL2?'hanami':'village';   // (Highmark has no song of its own yet: Rimehold's)
  if(P.inTun) return MUSIC.theme||'wild3';
  const zn=zoneAt(P.x,P.z), L=zn?zn.level:0;
  if(inHoar(P.x,P.z)||inGrey(P.x,P.z)) return L>=27?'hoar2':'hoar1';   // (the Greyspine has no song of its own yet: the Reach's)
  if(inVale(P.x)) return L>=21?'vale2':'vale1';
  return L>=12?'wild3':L>=7?'wild2':'wild1';
}
// instruments (t = start time)
const hit=(pat,s)=>pat&&pat[s]!=='.'&&pat[s]!==undefined?(pat[s]==='o'?0.5:1):0;
function mNote(inst,m,t,vol,o){
  o=o||{}; const f=mtof(m), bus='song';
  if(inst==='pluck'){ tone({bus,type:'triangle',freq:f,dur:1.2,vol,filter:'lowpass',ff:o.ff||2400,when:t,echo:o.echo,verb:true}); }
  else if(inst==='koto'){ tone({bus,type:'triangle',freq:f,dur:0.9,vol,filter:'lowpass',ff:3200,when:t,echo:o.echo,verb:true}); tone({bus,type:'sine',freq:f*2,dur:0.25,vol:vol*0.35,when:t}); }
  else if(inst==='shamisen'){ tone({bus,type:'sawtooth',freq:f,dur:0.32,vol:vol*0.8,filter:'bandpass',ff:Math.min(3000,f*3),q:1.5,when:t,verb:true}); noiseHit({bus,filter:'highpass',ff:3000,dur:0.02,vol:vol*0.5,when:t}); }
  else if(inst==='flute'){ tone({bus,type:'sine',freq:f*0.995,freq2:f,glide:0.15,dur:1.3,attack:0.09,vol,when:t,echo:true,verb:true}); }
  else if(inst==='shaku'){ tone({bus,type:'sine',freq:f*0.95,freq2:f,glide:0.25,dur:1.8,attack:0.12,vol,when:t,echo:true,verb:true}); noiseHit({bus,filter:'bandpass',ff:f*2,q:3,dur:0.9,attack:0.1,vol:vol*0.35,when:t}); }
  else if(inst==='bell'){ tone({bus,type:'sine',freq:f,dur:1.4,vol,when:t,echo:true,verb:true}); tone({bus,type:'sine',freq:f*2.76,dur:0.4,vol:vol*0.25,when:t}); }
}
function mDrum(k,t,v){
  const bus='song';
  if(k==='kick') tone({bus,type:'sine',freq:110,freq2:42,glide:0.12,dur:0.28,vol:0.11*v,when:t});
  else if(k==='snare'){ noiseHit({bus,filter:'bandpass',ff:1800,dur:0.16,vol:0.06*v,when:t}); tone({bus,type:'triangle',freq:190,freq2:150,dur:0.1,vol:0.03*v,when:t}); }
  else if(k==='hat') noiseHit({bus,filter:'highpass',ff:7000,dur:0.045,vol:0.025*v,when:t});
  else if(k==='taiko'){ tone({bus,type:'sine',freq:78,freq2:48,glide:0.3,dur:0.6,vol:0.14*v,when:t,verb:true}); noiseHit({bus,filter:'lowpass',ff:420,dur:0.18,vol:0.08*v,when:t}); }
  else if(k==='wood') tone({bus,type:'square',freq:1250,dur:0.05,vol:0.018*v,filter:'bandpass',ff:1300,q:4,when:t});
}
function musicStep(T,t){
  const n=MUSIC.step++, s=n%8, bar=Math.floor(n/8), night=envCur.night>0.5;
  const chords=night&&T.night?T.night:T.chords, ci=Math.floor(bar/T.chordBars)%chords.length, ch=chords[ci], scale=night&&T.nightScale?T.nightScale:T.scale, len=T.beat*8*T.chordBars;
  const pad=T.pad, ff=pad.ff*(night?0.7:1);
  if(s===0&&bar%T.chordBars===0&&!T.stab){
    ch.forEach((m,i)=>tone({bus:'song',type:i%2?'sine':pad.type,freq:mtof(m),dur:Math.min(4.5,len*0.5),hold:Math.max(0.2,len-(pad.attack||2.2)-Math.min(4.5,len*0.5)+1),attack:pad.attack||2.2,vol:pad.vol*(i===0?1.2:1),filter:'lowpass',ff,detune:(i-2)*4,when:t,verb:true}));
    if(T.drone) tone({bus:'song',type:'sine',freq:mtof(T.drone-12),dur:3,hold:len-1,attack:1.5,vol:0.04,when:t});
  }
  if(T.stab&&hit(T.stab,s)) ch.forEach((m,i)=>tone({bus:'song',type:pad.type,freq:mtof(m+12),dur:T.beat*1.6,vol:pad.vol*(i===0?1.3:1),filter:'lowpass',ff,detune:(i-1)*6,when:t}));
  const bv=hit(T.bass,s); if(bv){ const saw=T.bassType==='sawtooth', m=ch[0]-(saw?0:12)+(saw&&s%2?12:0);
    tone({bus:'song',type:T.bassType||'sine',freq:mtof(m),dur:saw?T.beat*1.2:(T.beat*8>3?4:T.beat*3),hold:saw?0:0.3,attack:saw?0.01:0.4,vol:(saw?0.035:0.05)*bv,filter:saw?'lowpass':null,ff:saw?420:0,when:t}); }
  const A=T.arp; if(A&&hit(A.pat,s)){ const pool=A.from==='scale'?scale:ch.slice(1).map(m=>m+(A.oct||12)), m=A.from==='scale'?pool[(n*3+Math.floor(n/5))%pool.length]:pool[n%pool.length];
    mNote(A.inst,m,t,A.vol*hit(A.pat,s),{ff:A.ff,echo:A.echo}); }
  const Ld=T.lead;
  if(Ld){ if(T.motif){ if(s%2===0&&Math.random()<Ld.p) mNote(Ld.inst,T.motif[(n/2)%T.motif.length],t,0.03); }
    else if(Math.random()<Ld.p*(night?0.7:1)) mNote(Ld.inst,scale[Math.floor(Math.random()*scale.length)]+(Ld.oct||0),t,Ld.inst==='pluck'?0.045:0.035); }
  if(T.drums) for(const k in T.drums){ const v=hit(T.drums[k],s); if(v) mDrum(k,t,v); }
}
function musicFileTick(now){
  const F=MUSIC.file, buf=musicBuffer(F.key); if(!buf) return;   // still decoding: silence for a moment
  const night=MUSIC.theme==='village'&&envCur.night>0.5;
  F.lp.frequency.setTargetAtTime(night?MUSIC_NIGHT_LP:20000,now,2); F.vol.gain.setTargetAtTime(MUSIC_FILE_VOL*(night?0.8:1),now,2);
  if(F.next>now+0.5) return;
  // start the next pass: on time for a crossfade, or right away (first pass, or the tab slept past the end)
  const t=F.next>now-0.5?F.next:now+0.05, xf=Math.min(MUSIC_XF,buf.duration/4), c=SND.ctx;
  const s=c.createBufferSource(), g=c.createGain(); s.buffer=buf;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(1,t+(F.cur?xf:1.5));
  if(F.cur){ const o=F.cur; o.g.gain.setValueAtTime(1,t); o.g.gain.linearRampToValueAtTime(0.0001,t+xf); try{ o.s.stop(t+xf+0.1); }catch(_){} }
  const off=F.cur?Math.min(MUSIC_LOOP_FROM[F.key]||0,buf.duration/2):0;
  s.connect(g); g.connect(F.lp); s.start(t,off); F.cur={s,g}; F.next=t+buf.duration-off-xf;
}
function musicTick(){
  const c=SND.ctx, now=c.currentTime;
  SND.verbIn.song=SND.verbIn.music;
  // switch themes after 2.5 s somewhere new (right away for a boss fight): fade the old node out, start the new one
  const here=started?musicThemeHere():'village';
  if(here!==MUSIC.theme){ if(here!==MUSIC.want){ MUSIC.want=here; MUSIC.wantT=now; } }
  else MUSIC.want=null;
  if(MUSIC.want && MUSIC.file && musicFileKey(MUSIC.want)===MUSIC.file.key){ MUSIC.theme=MUSIC.want; MUSIC.want=null; }
  if(MUSIC.want && (now-MUSIC.wantT>2.5 || MUSIC.want.startsWith('boss') || !MUSIC.theme)){
    if(MUSIC.node){ const old=MUSIC.node; old.gain.setTargetAtTime(0,now,0.6); setTimeout(()=>{ try{ old.disconnect(); }catch(_){} },6000); }
    if(MUSIC.file&&MUSIC.file.cur) try{ MUSIC.file.cur.s.stop(now+6); }catch(_){}
    const g=c.createGain(); g.gain.setValueAtTime(0.0001,now); g.gain.setTargetAtTime(1,now+0.4,0.8); g.connect(SND.bus.music);
    MUSIC.node=g; SND.bus.song=g; MUSIC.theme=MUSIC.want; MUSIC.want=null; MUSIC.step=0; MUSIC.next=now+0.5;
    MUSIC.file=null;
    const key=musicFileKey(MUSIC.theme);
    if(hasMusicFile(key)){ const lp=c.createBiquadFilter(), v=c.createGain(); lp.type='lowpass'; lp.frequency.value=20000; v.gain.value=MUSIC_FILE_VOL;
      lp.connect(v); v.connect(g); MUSIC.file={key,lp,vol:v,cur:null,next:0}; musicBuffer(key); }
  }
  if(MUSIC.file){
    if(!musicFailed(MUSIC.file.key)){ musicFileTick(now); return; }
    MUSIC.file=null; MUSIC.next=now+0.05;   // the track could not be fetched or decoded: this theme's generated music plays instead
  }
  const T=THEMES[MUSIC.theme]; if(!T) return;
  if(MUSIC.next<now-0.5) MUSIC.next=now+0.05;   // after the tab slept: don't play the missed steps all at once
  while(now+0.3>MUSIC.next){ musicStep(T,MUSIC.next); MUSIC.next+=T.beat; }
}
