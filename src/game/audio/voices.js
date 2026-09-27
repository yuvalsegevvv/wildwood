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
// Pick a voice for a character. Used for villagers now, and ready for the player later: pickVoice(LOOK.sex, seed)
function pickVoice(sex,seed,cfg){
  cfg=cfg||{};
  const want=sex==='female'?'f':'m', vs=speech.voices;
  if(!vs.length) return null;
  const idx=a=>a[Math.floor(Math.abs(seed)*997)%a.length];
  if(cfg.name){ const v=vs.find(x=>x.name.includes(cfg.name)); if(v) return {voice:v,pitch:cfg.pitch||1,rate:cfg.rate||1}; }
  const same=vs.filter(v=>voiceSex(v)===want);
  const local=same.filter(v=>v.localService!==false);
  const jitter=((seed*7)%1-0.5)*0.18;
  if(same.length) return {voice:idx(local.length?local:same),pitch:(cfg.pitch||1)+jitter,rate:cfg.rate||(0.92+((seed*13)%1)*0.12)};
  // no voice of the right sex installed: bend another voice's pitch towards it
  const unknown=vs.filter(v=>voiceSex(v)==='?'), pool=unknown.length?unknown:vs, v=idx(pool), other=voiceSex(v)!=='?';
  const pitch=want==='f'?(other?1.75:1.45):(other?0.5:0.75);
  return {voice:v,pitch:clamp(pitch+jitter,0.1,2),rate:cfg.rate||(0.92+((seed*13)%1)*0.12)};
}
let speakingNPC=null;
function duckMusic(on){ SND.duck=on?0.45:1; applyVolumes(); }
function stopSpeech(){ if(speech.ok){ try{ speechSynthesis.cancel(); }catch(_){} } if(speakingNPC){ speakingNPC.speaking=false; speakingNPC=null; } duckMusic(false); }
function speakLine(n,text){
  stopSpeech();
  if(SND.muted||SND.voiceMode==='off'||SND.vol.voice<=0.01) return;
  if(SND.voiceMode==='speech' && speech.ok){
    if(!speech.voices.length) loadVoices();
    if(speech.voices.length){
      try{
        if(!n.vpick || n.vpickN!==speech.voices.length){ n.vpick=pickVoice(n.look.sex,n.seed,n.def.voice); n.vpickN=speech.voices.length; }
        const P0=n.vpick, u=new SpeechSynthesisUtterance(text);
        if(P0 && P0.voice){ u.voice=P0.voice; u.lang=P0.voice.lang; }
        u.pitch=P0?P0.pitch:1; u.rate=P0?P0.rate:1; u.volume=clamp(SND.vol.master*SND.vol.voice);
        u.onstart=()=>{ n.speaking=true; speakingNPC=n; duckMusic(true); };
        u.onend=u.onerror=()=>{ n.speaking=false; if(speakingNPC===n) speakingNPC=null; duckMusic(false); };
        speechSynthesis.speak(u); return;
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

