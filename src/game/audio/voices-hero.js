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
  zahra:{sex:'f',pitch:0.98,rate:0.9,slot:4,tone:'calm'},
  // the Amber Reach sets: Brindle the loud-laughing hyena tinker, Dessa the rhino smith (tank), Sefi the cheetah courier (fast)
  brindle:{sex:'m',pitch:1.1,rate:1.2,slot:6,tone:'bright'}, dessa:{sex:'f',pitch:0.72,rate:0.84,slot:6,tone:'gruff'},
  sefi:{sex:'f',pitch:1.22,rate:1.32,slot:7,tone:'sly'}};
// Three shouts for every skill. The original skills have their own; every other skill gets three made from its name,
// its element and its class (or the set's tone), fixed by its id so a skill always has the same three to choose from.
const HV_SKILL={
  whirlwind:['Spin with me!','Round and round!','Nobody stands close!'],
  bash:['Shield up, head down!','Back off!','Knock, knock!'],
  charge:['Chaaarge!','Make way!','Right through them!'],
  volley:['Arrows away!','Let them rain!','All at once!'],
  pierce:['Straight and true.','Right through!','This one will not miss.'],
  rain:['Look up!','Arrows from the sky!','Sky full of arrows!'],
  frostnova:['Freeze!','Cold. Cold as stone.','Winter, now!'],
  chain:['Spark to spark!','Let it jump!','Shock them all!'],
  meteor:['Fall, fire!','The sky is falling!','Mind the sky!'],
  quake:['Shake the earth!','Break the ground!','Feel it tremble!'],
  bladestorm:['A storm of steel!','Blades, dance!','Cut them all down!'],
  berserk:['I see red!','Raaagh! No holding back!','Let me loose!'],
  hail:['Hail of arrows!','Count the arrows!','Darken the sky!'],
  snipe:['Hold your breath...','One shot.','Gotcha.'],
  blizzard:['Let it snow!','Winter comes for you!','The blizzard bites!'],
  inferno:['Burn it all!','Fire, answer me!','Into the flames!'],
  surge:['Power, rise!','Arcane surge!','Everything I have!']};
const HV_ELEM={
  fire:{skill:['Feel the heat!','Burn bright!','Fire take you!'],burst:['Let it all burn!','Ashes to ashes!','Fire everywhere!']},
  water:{skill:['Wash them away!','Go with the flow!','Deep and cold!'],burst:['Drown in it!','The tide turns!','Flood, rise!']},
  earth:{skill:['Stone, hold!','Solid as rock!','Root and rise!'],burst:['The ground obeys!','Mountain, move!','Crush them!']},
  air:{skill:['Swift as wind!','Catch the breeze!','Fly, fly!'],burst:['Storm, come!','Wind, carry me!','Blow them away!']},
  light:{skill:['Be blinded!','Light, guide me!','Shine on!'],burst:['Behold the dawn!','Radiance!','Let there be light!']},
  dark:{skill:['Into the dark!','Shadows, take them.','Night falls.'],burst:['Darkness rises!','Swallow the light!','Your end is here.']}};
const HV_CLASS={
  warrior:{skill:['Hyaah!','Feel my blade!','Stand and fight!'],burst:['Rrraagh! Take this!','Hold the line!','No mercy!']},
  mage:{skill:['Magic, mine!','Arcane, answer me!','Be gone!'],burst:['Feel the power!','Behold my magic!','Reality, bend!']},
  archer:{skill:['Eyes sharp!','Steady... now!','Right on target!'],burst:['Loose everything!','Nothing escapes my bow!','Mark and fire!']}};
const HV_TONE={
  bold:['Here I come!','Stand back!','For the road!'],
  calm:['Steady now.','Be still.','Let it end.'],
  gruff:['Hnh! Take that!','Out of my way!','Down you go!'],
  sly:['Too slow!','Catch me if you can.','Gotcha!'],
  bright:['Ta-da!','Here goes!','Go, go, go!']};
function hvHash(id){ let h=7; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return h; }
// the three lines of one skill (ab = the SKILLS entry), spec = the voice's spec (its tone, when it is an outfit set's)
function hvLines3(ab,spec){
  const id=String((ab&&ab.id)||(ab&&ab.name)||'x');
  if(Object.prototype.hasOwnProperty.call(HV_SKILL,id)) return HV_SKILL[id];
  const h=hvHash(id), slot=ab&&ab.slot==='burst'?'burst':'skill', nm=ab&&ab.name?ab.name:'Take this', el=HV_ELEM[ab&&ab.el]?ab.el:null;
  const l1=[nm+'!',nm+', now!','Feel '+nm+'!'][h%3];
  const l2=el?HV_ELEM[el][slot][(h>>>3)%3]:'Here it comes!';
  const l3=spec&&spec.tone?HV_TONE[spec.tone][(h>>>5)%3]:(HV_CLASS[ab&&ab.cls]||HV_CLASS.warrior)[slot][(h>>>5)%3];
  return [l1,l2,l3];
}
let hvLast=0, hvPrev='';
function hvVoiceSpec(){
  if(HV_PICK==='off') return null;
  const m=(LOOK&&LOOK.model)&&Object.prototype.hasOwnProperty.call(HV_OUTFIT,LOOK.model)?HV_OUTFIT[LOOK.model]:null;
  if(m) return m;
  const sex=HV_PICK==='auto'?(LOOK&&LOOK.sex==='female'?'f':'m'):HV_PICK;
  return Object.assign({sex:sex,tone:null},HV_BASE[sex]);
}
// what the editor's Voice tab tells the player
function hvDescribe(){
  const m=LOOK&&LOOK.model&&Object.prototype.hasOwnProperty.call(HV_OUTFIT,LOOK.model)?LOOK.model:null;
  if(HV_PICK==='off') return 'Your skill shouts are silent.';
  if(m) return 'Wearing the '+(CHAR_MODELS[m]?CHAR_MODELS[m].name:m)+' set: its own '+(HV_OUTFIT[m].sex==='f'?'female':'male')+' voice shouts for you. Take the outfit off to use the voice you pick here.';
  return 'Your shouts use the '+(hvVoiceSpec().sex==='f'?'female':'male')+' voice'+(HV_PICK==='auto'?' that matches your hiker.':'.');
}
function hvChoice(){ return HV_PICK; }
function hvSet(v){ HV_PICK=v; try{ localStorage.setItem(HV_KEY,v); }catch(_){} if(v==='off'&&speech.ok){ try{ speechSynthesis.cancel(); }catch(_){} } }
// one of the three at random, never the one just shouted
function hvLine(spec,ab){
  const L=hvLines3(ab,spec).filter(x=>x!==hvPrev), pick=L[Math.floor(Math.random()*L.length)]||'Hyaah!';
  hvPrev=pick; return pick;
}
// say a line in the hero's voice (the chosen one, or the worn outfit set's)
function hvSpeak(text,spec){
  const pool=voicePool(spec.sex), v=pool.length?pool[spec.slot%pool.length]:pickVoice(spec.sex==='f'?'female':'male',0.37).voice;
  const u=new SpeechSynthesisUtterance(text);
  if(v){ u.voice=v; u.lang=v.lang; }
  u.pitch=clamp(spec.pitch*(pool.length?1:(spec.sex==='f'?1.5:0.7)),0.1,2); u.rate=clamp(spec.rate*1.05,0.5,1.8); u.volume=clamp(SND.vol.master*SND.vol.hero);
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function hvCan(){ return speech.ok&&!SND.muted&&SND.voiceMode!=='off'&&SND.vol.hero>0.01&&speech.voices.length>0; }
function hvShout(kind,ab,force){
  try{
    if(kind!=='skill'&&kind!=='burst') return;
    if(!hvCan()) return;
    const spec=hvVoiceSpec(); if(!spec) return;
    const now=performance.now(); if(!force&&now-hvLast<2500) return; hvLast=now;   // a shout is a treat, not a drumbeat
    hvSpeak(hvLine(spec,ab),spec);
  }catch(_){}
}
// Three reactions for each thing that happens to you. hvEvent(kind) is called from the places that show it (marked `// voice:`):
// down (progression.js playerDown), lvup (levelUpFx), rare / epic (net/client.js onLoot), bossskill (lucky.js onSkillDrop),
// bossdown (combat/attacks.js onMonKill, a boss near you), dgwin / dglose (dungeon/hud.js dgResultShow), raidclear (raids/hud.js rdOnState), quest (net/client.js 'mq' / 'sq' handed in)
const HV_EVENT={
  down:['Argh... not like this.','Ugh! I need a moment...','Tell them... I tried.'],
  lvup:['I feel stronger!','Yes! Level up!','Getting better every day!'],
  rare:['Ooh, what is this?','Now that is nice!','Look at that!'],
  epic:['Oh my! Look at this!','Incredible! Finally!','That is a beauty!'],
  bossskill:['A boss skill! Oh yes!','I have never seen this one!','It is mine now!'],
  bossdown:['It is done! We did it!','The beast is down!','Not so tough after all!'],
  dgwin:['Dungeon cleared! What a run!','We made it out!','That is the last of them!'],
  dglose:['We will get them next time.','Ugh. Back to the gate.','That went badly.'],
  raidclear:['The stronghold is ours!','Raid cleared! Hear that?','Burn the banners!'],
  quest:['One step closer.','That is done.','Good, onwards.']};
let hvEvLast=0, hvEvPrev='';
function hvEvent(kind){
  try{
    const L=HV_EVENT[kind]; if(!L||!hvCan()) return;
    const spec=hvVoiceSpec(); if(!spec) return;
    const now=performance.now(); if(now-hvEvLast<1500) return; hvEvLast=now;
    const o=L.filter(x=>x!==hvEvPrev), t=o[Math.floor(Math.random()*o.length)]; hvEvPrev=t;
    hvLast=now; hvSpeak(t,spec);
  }catch(_){}
}
