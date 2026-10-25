//@ Your own voice: battle shouts for skills, a male / female voice to pick, and one voice per signature outfit set
/* ---------- the hero's voice ----------
   agent map: hvShout(kind,ab) is called by doAttack (game/combat/attacks.js) when a skill (not a basic attack) is used;
   hvSet / hvChoice / hvRender are used by the sound settings (ui/settings-sound.js, markup `#hvChips` in index.html).
   Voices come from the browser's text-to-speech (voices.js picks the best installed ones); no service, no key.
   The choice is stored in localStorage `wildwood-hero-voice`: 'auto' (follow the hiker's sex), 'm', 'f' or 'off'.
   A signature outfit set (look.model) speaks with its own character: sex, pitch, rate, which of the good voices and a catch phrase. */
const HV_KEY='wildwood-hero-voice';
let HV_PICK='auto'; try{ const s=localStorage.getItem(HV_KEY); if(s==='m'||s==='f'||s==='off'||s==='auto') HV_PICK=s; }catch(_){}
// the two default voices
const HV_BASE={m:{pitch:0.92,rate:1.05,slot:0},f:{pitch:1.12,rate:1.08,slot:0}};
// one voice per outfit set: slot = which of the good voices of its sex (so neighbours differ), tone = which shouts it uses
const HV_OUTFIT={
  ambrose:{sex:'m',pitch:0.95,rate:0.92,slot:1,tone:'calm'},   torgeir:{sex:'m',pitch:0.6,rate:0.85,slot:2,tone:'gruff'},
  corvin:{sex:'m',pitch:0.8,rate:0.95,slot:3,tone:'calm'},     dunstan:{sex:'m',pitch:1.0,rate:1.12,slot:4,tone:'bold'},
  genzo:{sex:'m',pitch:0.55,rate:0.82,slot:5,tone:'gruff'},    hollis:{sex:'m',pitch:0.78,rate:0.86,slot:1,tone:'calm'},
  ogden:{sex:'m',pitch:0.5,rate:0.8,slot:2,tone:'gruff'},      pell:{sex:'m',pitch:0.88,rate:0.98,slot:3,tone:'sly'},
  sabir:{sex:'m',pitch:1.02,rate:1.2,slot:4,tone:'sly'},
  brynja:{sex:'f',pitch:1.2,rate:1.18,slot:1,tone:'bold'},     marigold:{sex:'f',pitch:1.5,rate:1.15,slot:2,tone:'bright'},
  nephra:{sex:'f',pitch:0.8,rate:0.84,slot:3,tone:'calm'},     ottoline:{sex:'f',pitch:1.7,rate:0.95,slot:4,tone:'bright'},
  sazanka:{sex:'f',pitch:1.15,rate:1.25,slot:5,tone:'sly'},    sorrel:{sex:'f',pitch:1.05,rate:1.1,slot:1,tone:'bold'},
  tamsin:{sex:'f',pitch:0.85,rate:0.95,slot:2,tone:'gruff'},   tansy:{sex:'f',pitch:1.28,rate:1.05,slot:3,tone:'bright'},
  zahra:{sex:'f',pitch:0.98,rate:0.9,slot:4,tone:'calm'}};
// a catch phrase and a pool of shouts for every tone; the skill's own name is shouted half of the time
const HV_TONE={
  bold:['Here I come!','Stand back!','For the road!','Watch this!'],
  calm:['Steady now.','Be still.','As you wish.','Let it end.'],
  gruff:['Hnh! Take that!','Out of my way!','Enough!','Down you go!'],
  sly:['Too slow!','Catch me if you can.','Surprise!','Gotcha!'],
  bright:['Ta-da!','Here goes!','Oh, sparkle!','Go, go, go!']};
const HV_CLASS={warrior:['Hyaah!','Rrraagh!','Feel my blade!','Hold the line!'],mage:['Burn!','Arcane, answer me!','Feel the power!','Be gone!'],ranger:['Steady... now!','Right on target!','Eyes sharp!','Loose!']};
let hvLast=0, hvN=0;
function hvVoiceSpec(){
  if(HV_PICK==='off') return null;
  const m=(LOOK&&LOOK.model)&&Object.prototype.hasOwnProperty.call(HV_OUTFIT,LOOK.model)?HV_OUTFIT[LOOK.model]:null;
  if(m) return m;
  const sex=HV_PICK==='auto'?(LOOK&&LOOK.sex==='female'?'f':'m'):HV_PICK;
  return Object.assign({sex:sex,tone:null},HV_BASE[sex]);
}
function hvChoice(){ return HV_PICK; }
function hvSet(v){ HV_PICK=v; try{ localStorage.setItem(HV_KEY,v); }catch(_){} if(v==='off'&&speech.ok){ try{ speechSynthesis.cancel(); }catch(_){} } }
function hvLine(spec,ab,cls){
  hvN++;
  const pool=spec.tone?HV_TONE[spec.tone].concat(HV_CLASS[cls]||[]):(HV_CLASS[cls]||HV_CLASS.warrior);
  if(ab&&ab.name&&hvN%2===0) return ab.name+'!';
  return pool[(hvN*7+(ab&&ab.name?ab.name.length:0))%pool.length];
}
function hvShout(kind,ab,force){
  try{
    if(kind!=='skill'&&kind!=='burst') return;
    if(!speech.ok||SND.muted||SND.voiceMode==='off'||SND.vol.hero<=0.01||!speech.voices.length) return;
    const spec=hvVoiceSpec(); if(!spec) return;
    const now=performance.now(); if(!force&&now-hvLast<2500) return; hvLast=now;   // a shout is a treat, not a drumbeat
    const pool=voicePool(spec.sex), v=pool.length?pool[spec.slot%pool.length]:pickVoice(spec.sex==='f'?'female':'male',0.37).voice;
    const u=new SpeechSynthesisUtterance(hvLine(spec,ab,ab&&ab.cls));
    if(v){ u.voice=v; u.lang=v.lang; }
    u.pitch=clamp(spec.pitch*(pool.length?1:(spec.sex==='f'?1.5:0.7)),0.1,2); u.rate=clamp(spec.rate*1.05,0.5,1.8); u.volume=clamp(SND.vol.master*SND.vol.hero);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(_){}
}
