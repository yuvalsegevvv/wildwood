//@ Dialogue choices: a "@pick what you say >> the reply | another thing >> its reply" line in a story scene stops it and lets you say one of two or three things; your pick is spoken in your voice and answered
/* Agent map. A line "@pick A >> reply | B >> reply | (C, a gesture) >> reply" (at most 3 options; the reply is optional, may be two speakers' lines; an option that starts with "(" is narrated, not said) sits in a step's offer / say / done list
   like any line. mqSplitLines keeps it whole, sayLine (talking.js) and sqSceneShow (economy/side-quests.js) hand it to svChoiceOpen(line, queue, resume): the scene waits (svPickOn; svTick, interact and the role panel all stand still),
   the options show over the screen (#choice), keys 1-3 or a tap pick, and svChoicePick puts "You: A" and the reply in front of the queue and resumes it. Nobody answers for you after 60 s: the first option is taken.
   "Just objectives" (story-mode.js) drops pick lines (storyCut) and shows no scene. The choices change what is said, not the quest. Uses: mqSplitLines, mqSubst (economy/main-quest.js). Test: client-smoke. */
var svPickOn=null;
let svPickEl=null;
const SV_PICK_AUTO_MS=60000;
function svChoiceParse(line){
  return String(line).slice(6).split(' | ').map(o=>{ const i=o.indexOf(' >> '); return i<0?{say:o.trim(),reply:null}:{say:o.slice(0,i).trim(),reply:o.slice(i+4).trim()}; }).filter(o=>o.say).slice(0,3);
}
function svChoiceHide(){ svPickOn=null; if(svPickEl) svPickEl.hidden=true; }
function svChoiceOpen(line,queue,resume){
  const opts=svChoiceParse(line);
  if(!opts.length||storySkip()){ resume(); return; }
  svPickOn={opts,queue,resume,t:performance.now()}; svTalking=true; svEnd=svStart=performance.now(); stopSpeech();
  if(!svPickEl){ svPickEl=document.createElement('div'); svPickEl.id='choice'; svPickEl.hidden=true; document.body.appendChild(svPickEl); }
  svPickEl.textContent='';
  const h=document.createElement('div'); h.className='ch-head'; h.textContent='Say something'; svPickEl.appendChild(h);
  opts.forEach((o,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='ch-opt'; const k=document.createElement('i'); k.textContent=String(i+1); b.appendChild(k); b.appendChild(document.createTextNode(mqSubst(o.say))); b.addEventListener('click',()=>svChoicePick(i)); svPickEl.appendChild(b); });
  svPickEl.hidden=false; UI_SFX.talk();
}
function svChoicePick(i){
  const P=svPickOn; if(!P) return; svChoiceHide();
  const o=P.opts[i]||P.opts[0], add=[o.say[0]==='('?o.say:'You: '+o.say].concat(o.reply?mqSplitLines([o.reply]):[]);
  P.queue.unshift(...add); UI_SFX.click(); P.resume();
}
function svChoiceTick(now){ if(svPickOn&&now-svPickOn.t>SV_PICK_AUTO_MS) svChoicePick(0); }
addEventListener('keydown',e=>{ if(!svPickOn) return; const k=/^(Digit|Numpad)([1-3])$/.exec(e.code); if(k){ e.preventDefault(); e.stopImmediatePropagation(); svChoicePick(+k[2]-1); } },true);
