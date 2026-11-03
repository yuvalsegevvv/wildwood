//@ Voiced story: every line of a story conversation or place scene is read aloud in its speaker's voice (a villager's own, the hiker's in the hero voice, narration quietly), one after the other with a pause, and carries on while you walk; the boss fight's shouted lines are read too
/* Agent map. svSpeakLine(who,text,n) says one line (who: the speaker's name, 'You', or null for narration or the person you clicked; n: the villager you are talking to) and starts the pause timer;
   svTick() runs every frame from updateTalkUI (talking.js): it plays the next line of the conversation (n.mq, via sayLine) or of the place's scene (sqScene, via sqSceneNext) once the line has been said
   AND at least SV_MIN_MS have passed since it began (the talk key still skips ahead), closes a scene that has been said, and ends a conversation the hiker has walked away from once it is finished;
   svHolds() tells villagers.js / updateTalkUI not to drop a conversation at 4.5 m while it is still being played; svToast(text,kind) is called by toast() for "Name: "line"" shouts of a fight.
   Uses: speakLine / pickVoice (audio/voices.js), hvVoiceSpec (audio/voices-hero.js), sayLine / endTalk (talking.js), sqScene / sqSceneNext (economy/side-quests.js). Test: client-smoke (the scene plays itself, a @cine scene holds and frees the hiker). */
const SV_MIN_MS=5000, SV_AFTER_MS=2200, SV_CLOSE_MS=2500;   // a line gets at least 5 s on screen from its start, and at least 2.2 s of quiet after it has been said; a finished scene stays 2.5 s more
const SV_FEMALE=/^(Tansy|Linnea|Maren|Greta|Hollen|Morrow|Kaede|Sayuri|Haruka|Chiyo|Hinata|Ylva)$/, SV_FAR=7;   // (a name that is not a villager in the world is given a voice by its sex here; beyond SV_FAR metres the bubble leaves the speaker's head and hangs in the middle of the screen)
let svStart=0, svEnd=null, svLen=0, svTalking=false, svVoices={}, svToastQ=[], svToastT=0;
function svNarrator(){ return svVoices.__narr||(svVoices.__narr={look:{sex:'male'},seed:0.91,def:{voice:{rate:0.84,pitch:0.78}},x:0,z:0,speaking:false,synth:true}); }
// one voice per speaker, always the same: a playable character (a signature set: Tansy, Torgeir, Dunstan, Pell, Ambrose, Morrow, Pip...) and the hiker speak with the voice of their voice setting (HV_OUTFIT, voices-hero.js: the same
// system voice, pitch and rate as their battle shouts); everyone else with a voice picked from their name (not from which villager object is nearest: Odran keeps a cart in every village)
const svHash=name=>{ let h=7; for(const c of String(name)) h=(h*31+c.charCodeAt(0))%9973; return (h%997)/997; };
const svOutfit=name=>{ const k=String(name||'').toLowerCase(); return Object.prototype.hasOwnProperty.call(HV_OUTFIT,k)?HV_OUTFIT[k]:null; };
function svHeroSpec(){ const sp=typeof hvVoiceSpec==='function'?hvVoiceSpec():null; if(sp) return sp; const sex=LOOK&&LOOK.sex==='female'?'f':'m'; return Object.assign({sex,tone:null},HV_BASE[sex]); }
function svPick(v,who){   // sets v.vpick (what speakLine uses) for this speaker
  if(!speech.voices.length) return;
  const spec=who==='You'?svHeroSpec():svOutfit(who);
  if(spec){ const pool=voicePool(spec.sex); if(pool.length){ v.vpick={voice:pool[spec.slot%pool.length],pitch:spec.pitch,rate:spec.rate*1.05}; v.vpickN=speech.voices.length; return; } }
  const key=who+'|'+speech.voices.length, c=svVoices.__pick||(svVoices.__pick={});
  if(!c[key]) c[key]=pickVoice(v.look.sex,svHash(who),v.def&&v.def.voice);
  v.vpick=c[key]; v.vpickN=speech.voices.length;
}
function svVoiceFor(who,n){
  if(who==='You'){ const sp=svHeroSpec(), sex=sp.sex==='f'?'female':'male';
    return svVoices.__you&&svVoices.__you.look.sex===sex?svVoices.__you:(svVoices.__you={look:{sex},seed:0.37,def:{voice:{}},x:0,z:0,speaking:false,synth:true}); }
  if(!who) return n;
  let m=null, md=1e9; for(const v of NPCs) if(v.def.name===who||v.def.name.endsWith(' '+who)){ const d=Math.hypot(P.x-v.x,P.z-v.z); if(d<md){ md=d; m=v; } }   // (the nearest of that name, for the mouth and where the voice comes from)
  if(m) return m;
  if(!svVoices[who]){ const root=who==='The Rootwarden', fem=SV_FEMALE.test(who), sp=svOutfit(who); svVoices[who]={look:{sex:sp?(sp.sex==='f'?'female':'male'):fem?'female':'male'},seed:svHash(who),def:{voice:root?{pitch:0.45,rate:0.72}:{}},x:0,z:0,speaking:false,synth:true}; }
  return svVoices[who];
}
function svSpeakLine(who,text,n,quest){
  if(storySkip()){ svTalking=false; svEnd=svStart=performance.now(); return; }   // (just objectives: nothing is read, nothing waits)
  const narr=text[0]==='('&&text.indexOf(')')===text.length-1, said=narr?text.slice(1,-1).trim():mqSpoken(text);
  svStart=performance.now(); svEnd=null; svLen=said.length; svTalking=!!quest;
  if(!said){ svEnd=svStart; return; }
  const v=narr?svNarrator():(svVoiceFor(who,n)||svNarrator()); if(v.synth){ v.x=P.x; v.z=P.z; }
  { const w=who||(v.def&&v.def.name); if(!narr&&w){ try{ svPick(v,w); }catch(_){} } }   // (a voice with no body speaks from where you stand)
  speakLine(v,said,{onEnd:()=>{ svEnd=performance.now(); },quiet:narr});
}
// is a played conversation or scene still going (lines to come, or the last one still being said)? Then walking away does not end it
function svBusy(){ const now=performance.now(); return svTalking&&(svEnd===null||now<svEnd+SV_AFTER_MS||(sqSceneOn()&&sqScene.lines.length>0)||(!!talkNPC&&mqBusy(talkNPC))); }
const svHolds=n=>svTalking&&n===talkNPC&&svBusy();
const svFar=n=>!!n&&svTalking&&Math.hypot(P.x-n.x,P.z-n.z)>SV_FAR;
function svTick(){
  const now=performance.now(); svCineTick(now);
  if(svTalking&&svEnd===null&&now-svStart>Math.max(14000,svLen*170)) svEnd=now;   // (a voice that never reports an end, a browser that wants a tap first: do not stall the scene)
  if(svTalking&&svEnd!==null&&now>=Math.max(svStart+SV_MIN_MS,svEnd+SV_AFTER_MS)){
    if(sqSceneOn()){ if(sqScene.lines.length) sqSceneNext(); else if(now>=svEnd+SV_CLOSE_MS){ sqSceneNext(); svTalking=false; } }
    else if(talkNPC&&mqBusy(talkNPC)) sayLine(talkNPC);
    else if(talkNPC&&svFar(talkNPC)&&now>=svEnd+SV_CLOSE_MS){ svTalking=false; endTalk(); }   // the last line is said and the hiker is away: the conversation is over
    else if(!sqSceneOn()&&!(talkNPC&&mqBusy(talkNPC))) svTalking=false;
  }
  if(!svTalking&&svToastQ.length&&now>=svToastT&&(svEnd===null||now>=svEnd+400)){ const [who,text]=svToastQ.shift(); const v=svVoiceFor(who,null)||svNarrator(); if(v.synth){ v.x=P.x; v.z=P.z; } try{ svPick(v,who); }catch(_){}
    svStart=now; svEnd=null; svLen=text.length; speakLine(v,text,{onEnd:()=>{ svEnd=performance.now(); svToastT=svEnd+900; }}); }
}
// a fight's shouted lines arrive as toasts: Name: "line" (a speaker may have a place after the name: Pip, from the Hem: "...")
const SV_SHOUT=/^((?:The )?[A-Z][a-z]+)(?:, [^:"]+)?: ["“](.+?)["”](?:\s.*)?$/;
function svToast(text,kind){
  if(storySkip()) return;
  if(kind!=='mq'&&kind!=='boss'&&kind!=='good') return;
  const m=SV_SHOUT.exec(String(text)); if(!m) return;
  if(svToastQ.length<4) svToastQ.push([m[1],m[2]]);
}

/* Key scenes: a first line "@cine Title" (mqSplitLines keeps it in front of the next line, mqLineOf calls svCineStart) holds the picture for the scene: letterbox bars close in, a title card names the moment, the hiker stands still
   (updatePlayer zeroes the input, uiOpen() is true so no attack or skill fires) and the lines play on. It ends when the scene or conversation has been said, when the hiker dies, on Escape, when something hurts the hiker, or after SV_CINE_MAX. */
const SV_CINE_MAX=150000;
var cineOn=false;
let svCineT=0, svCineHp=0, svCineEl=null;
function svCineBuild(){
  const d=document.createElement('div'); d.id='cine'; d.hidden=true;
  d.innerHTML='<i class="cn-bar cn-top"></i><i class="cn-bar cn-bot"></i><div class="cn-card"><span>A turning point</span><b></b></div>';
  document.body.appendChild(d); return d;
}
function svCineStart(title){
  if(typeof document==='undefined'||storySkip()) return;
  if(!svCineEl) svCineEl=svCineBuild();
  const card=svCineEl.querySelector('.cn-card'), t=svCineEl.querySelector('b'); t.textContent=String(title||'').slice(0,60);
  if(!cineOn){ cineOn=true; svCineT=performance.now(); svCineHp=PL.hp; svCineEl.hidden=false; document.body.classList.add('cine'); P.vx=0; P.vz=0; }
  card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');   // (a new title restarts the card's fade)
  svCineEl.classList.add('on');
}
function svCineEnd(){
  if(!cineOn) return;
  cineOn=false; document.body.classList.remove('cine');
  if(svCineEl){ svCineEl.classList.remove('on'); const e=svCineEl; setTimeout(()=>{ if(!cineOn) e.hidden=true; },900); }
}
function svCineTick(now){
  if(!cineOn) return;
  if(PL.dead||PL.hp<svCineHp-1||now-svCineT>SV_CINE_MAX||(!svTalking&&now-svCineT>1200&&!sqSceneOn()&&!(talkNPC&&mqBusy(talkNPC)))) svCineEnd();
}
addEventListener('keydown',e=>{ if(cineOn&&e.code==='Escape') svCineEnd(); });
