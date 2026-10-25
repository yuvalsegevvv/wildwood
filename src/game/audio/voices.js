//@ Villager voices: text-to-speech voice picking and babble
/* ---------- villager voices ---------- */
// Works out whether a text-to-speech voice sounds female or male from its name (and Android voice codes)
const FEM_NAMES=['samantha','victoria','karen','moira','tessa','fiona','zira','susan','hazel','aria','jenny','libby','sonia','natasha','serena','allison','ava','kate','emily','joanna','salli','kimberly','ivy','linda','heather','catherine','martha','nicky','tina','veena','kathy','princess','vicki','zoe','sandy','shelley','flo','grandma','emma','michelle','clara','maisie','molly','neerja','leah','ana','amy','olivia','isla','sara','anna','alice','heera','kalpana','eva','amelie','lisa','ellen','nora','ruth','jessa','aoife','yan','female','woman','girl'];
const MAL_NAMES=['daniel','alex','fred','tom','david','mark','george','guy','ryan','oliver','thomas','arthur','rishi','aaron','gordon','lee','james','matthew','brian','joey','justin','russell','albert','bruce','ralph','junior','reed','rocko','grandpa','eddy','william','liam','andrew','christopher','eric','roger','steffan','mitchell','prabhat','luke','connor','sam','jacob','ravi','hemant','evan','nathan','noah','tony','male','man','boy'];
const FEM_RX=new RegExp('\\b('+FEM_NAMES.join('|')+')\\b'), MAL_RX=new RegExp('\\b('+MAL_NAMES.join('|')+')\\b');
const GCODE_F=['sfg','iob','iog','tpc','tpf','tpe','gba','gbc','gbg','afa','auc','ahp','cxx','ene'], GCODE_M=['iol','iom','tpd','gbb','gbd','rjs','aub','aud','end'];
function voiceSex(v){
  const s=((v.name||'')+' '+(v.voiceURI||'')).toLowerCase().replace(/[_().,-]+/g,m=>m.includes('-')?'-':' ');
  if(/\bfemale\b/.test(s)) return 'f';
  if(/\bmale\b/.test(s)) return 'm';
  const g=s.match(/x-([a-z]{3})/); if(g){ if(GCODE_F.includes(g[1])) return 'f'; if(GCODE_M.includes(g[1])) return 'm'; }
  if(FEM_RX.test(s)) return 'f';
  if(MAL_RX.test(s)) return 'm';
  if(/google us english/.test(s)) return 'f';
  return '?';
}
// Voice quality: neural / "natural" system voices sound human, compact and novelty ones sound like a robot. Higher is better.
const VOICE_BAD=/espeak|compact|novelty|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|pipe organ|fred|junior|ralph|kathy/i;
function voiceScore(v){
  const s=((v.name||'')+' '+(v.voiceURI||'')).toLowerCase();
  let q=0;
  if(/natural|neural|online|wavenet|studio/.test(s)) q+=6;
  if(/premium|enhanced|siri/.test(s)) q+=5;
  if(/google/.test(s)) q+=3;
  if(/microsoft/.test(s)&&!/desktop/.test(s)) q+=2;
  if(VOICE_BAD.test(s)) q-=8;
  if(v.localService===false) q+=1;
  if(/^en[-_](us|gb|au|ie|ca)/i.test(v.lang||'')) q+=1;
  return q;
}
// the voices of one sex, best first (only the good ones when there are enough, so nobody gets the robot)
function voicePool(want){
  const vs=speech.voices, ok=vs.filter(v=>voiceScore(v)>=0);
  let same=(ok.length?ok:vs).filter(v=>voiceSex(v)===want).sort((a,b)=>voiceScore(b)-voiceScore(a));
  if(same.length>1){ const top=voiceScore(same[0]); const best=same.filter(v=>voiceScore(v)>=top-3); if(best.length>=2) same=best; }
  return same;
}
// Pick a voice for a character: pickVoice(sex, seed, {name,pitch,rate}). The same seed always gets the same voice;
// villagers with the same system voice are told apart by their own pitch and rate (`voice` in VILLAGERS)
function pickVoice(sex,seed,cfg){
  cfg=cfg||{};
  const want=sex==='female'?'f':'m', vs=speech.voices;
  if(!vs.length) return null;
  const idx=a=>a[Math.floor(Math.abs(seed)*997)%a.length];
  if(cfg.name){ const v=vs.find(x=>x.name.includes(cfg.name)); if(v) return {voice:v,pitch:cfg.pitch||1,rate:cfg.rate||1}; }
  const same=voicePool(want);
  const jitter=((seed*7)%1-0.5)*0.18;
  if(same.length) return {voice:idx(same),pitch:(cfg.pitch||1)+jitter,rate:cfg.rate||(0.92+((seed*13)%1)*0.12)};
  // no voice of the right sex installed: bend another voice's pitch towards it
  const unknown=vs.filter(v=>voiceSex(v)==='?'&&voiceScore(v)>=0), pool=unknown.length?unknown:vs, v=idx(pool), other=voiceSex(v)!=='?';
  const pitch=want==='f'?(other?1.75:1.45):(other?0.5:0.75);
  return {voice:v,pitch:clamp(pitch+jitter,0.1,2),rate:cfg.rate||(0.92+((seed*13)%1)*0.12)};
}
let speakingNPC=null, speakTok=0;
function duckMusic(on){ SND.duck=on?0.45:1; applyVolumes(); }
function stopSpeech(){ speakTok++; if(speech.ok){ try{ speechSynthesis.cancel(); }catch(_){} } if(speakingNPC){ speakingNPC.speaking=false; speakingNPC=null; } duckMusic(false); }
// Speech is cut into phrases so it breathes: a pause after a comma or full stop, a lift on a question, a quicker, higher shout,
// a slow trailing "...". A flat one-shot reading is what makes text-to-speech sound like a machine.
function speechPhrases(text){
  const parts=String(text).replace(/\s+/g,' ').match(/[^.!?…;:,]+[.!?…;:,]*(?:\s|$)/g)||[String(text)];
  const out=[]; for(const t of parts){ const x=t.trim(); if(!x) continue; if(out.length&&x.length<9&&!/[.!?…]$/.test(out[out.length-1])) out[out.length-1]+=' '+x; else out.push(x); }
  return out.length?out:[String(text)];
}
function speakPhrases(P0,text,vol,hooks){
  const tok=++speakTok, ph=speechPhrases(text);
  const next=i=>{
    if(tok!==speakTok) return;
    if(i>=ph.length){ if(hooks.end) hooks.end(); return; }
    const t=ph[i], u=new SpeechSynthesisUtterance(t), last=t.slice(-1);
    if(P0&&P0.voice){ u.voice=P0.voice; u.lang=P0.voice.lang; }
    let pi=P0?P0.pitch:1, ra=P0?P0.rate:1;
    if(last==='?') pi*=1.1; else if(last==='!'){ pi*=1.07; ra*=1.08; } else if(last==='…') ra*=0.88; else if(i===ph.length-1) pi*=0.94;
    if(i%2===1) pi*=0.97;   // the line falls and rises a little from phrase to phrase
    u.pitch=clamp(pi,0.1,2); u.rate=clamp(ra,0.5,1.8); u.volume=vol;
    if(i===0) u.onstart=()=>{ if(hooks.start) hooks.start(); };
    u.onend=()=>{ if(tok!==speakTok) return; if(i+1<ph.length) setTimeout(()=>next(i+1),/[,;:]$/.test(last)?110:/[.!?…]$/.test(last)?260:60); else if(hooks.end) hooks.end(); };
    u.onerror=()=>{ if(tok===speakTok&&hooks.end) hooks.end(); };
    speechSynthesis.speak(u);
  };
  next(0);
}
function speakLine(n,text){
  stopSpeech();
  if(SND.muted||SND.voiceMode==='off'||SND.vol.voice<=0.01) return;
  if(SND.voiceMode==='speech' && speech.ok){
    if(!speech.voices.length) loadVoices();
    if(speech.voices.length){
      try{
        if(!n.vpick || n.vpickN!==speech.voices.length){ n.vpick=pickVoice(n.look.sex,n.seed,n.def.voice); n.vpickN=speech.voices.length; }
        speakPhrases(n.vpick,text,clamp(SND.vol.master*SND.vol.voice),{
          start:()=>{ n.speaking=true; speakingNPC=n; duckMusic(true); },
          end:()=>{ n.speaking=false; if(speakingNPC===n) speakingNPC=null; duckMusic(false); }});
        return;
      }catch(_){}
    }
  }
  babble(n,text,1);
}
// Made-up syllables with vowel formants, like villagers in a cosy game
const VOWELS=[[800,1200],[500,1900],[300,2300],[500,900],[350,800],[650,1700]];
function babble(n,text,loud){
  audioInit();
  if(!SND.ready) return;
  const c=SND.ctx, fem=n.look.sex==='female', base=(fem?225:118)*(0.9+((n.seed*5)%1)*0.25);
  const syl=Math.min(36,Math.max(3,Math.round(text.length/4)));
  const s=spatial(n.x,n.z,8,45); if(!s) return;
  const g=loud>0.5?Math.max(0.75,s.gain):s.gain;
  const out=c.createGain(); out.gain.value=loud*g; out.connect(panNode(s.pan,SND.bus.voice));
  let t0=c.currentTime+0.03;
  for(let i=0;i<syl;i++){
    const d=AR(0.07,0.12), fr=base*Math.pow(2,(Math.random()*6-2)/12)*(i===syl-1?0.82:1), V=VOWELS[Math.floor(Math.random()*VOWELS.length)];
    const o=c.createOscillator(); o.type='sawtooth';
    o.frequency.setValueAtTime(fr,t0); o.frequency.linearRampToValueAtTime(fr*AR(0.92,1.06),t0+d);
    const env=c.createGain();
    env.gain.setValueAtTime(0.0001,t0); env.gain.exponentialRampToValueAtTime(0.35,t0+0.012);
    env.gain.setValueAtTime(0.35,t0+d*0.6); env.gain.exponentialRampToValueAtTime(0.0001,t0+d);
    o.connect(env);
    for(const [ff,q,gv] of [[V[0],5,1],[V[1],7,0.6]]){
      const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=ff*(fem?1.15:1); bp.Q.value=q;
      const gg=c.createGain(); gg.gain.value=gv*2.4; env.connect(bp); bp.connect(gg); gg.connect(out);
    }
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=fem?1100:800;
    const dg=c.createGain(); dg.gain.value=0.3; env.connect(lp); lp.connect(dg); dg.connect(out);
    if(Math.random()<0.45) noiseHit({bus:'voice',filter:'highpass',ff:2600,dur:0.022,vol:0.06*loud*g,pan:s.pan,when:t0});
    o.start(t0); o.stop(t0+d+0.03);
    t0+=d+AR(0.015,0.045)+(Math.random()<0.1?0.14:0);
  }
  n.speaking=true; speakingNPC=n; if(loud>0.5) duckMusic(true);
  setTimeout(()=>{ n.speaking=false; if(speakingNPC===n){ speakingNPC=null; duckMusic(false); } },(t0-c.currentTime)*1000+50);
}

