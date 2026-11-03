//@ The story choice: play the story (voiced, paced, key scenes) or skip it and keep just the objectives; asked when a hiker is created, changeable in Settings, stored on this device
/* Agent map. storySkip() is true when the hiker chose "just objectives" (localStorage 'wildwood-story' = 'skip'). It is asked by: story-voice.js (svSpeakLine: nothing is read aloud, no waiting; the key-scene freeze is off,
   mqLineOf), talking.js (startTalk: a story conversation is cut to its one last line, so one key press hands in or takes the quest; the server is told as usual), side-quests.js (sqShowScene: a place's scene is not shown),
   story-voice.js svToast (boss shouts are not read). The objectives, the journal, the tips and the dark moments stay. Chips: #storyChips in Settings, #edStoryChips on the creation screen (index.html).
   storyCut(lines) keeps the last line that is spoken (not a stage direction). Test: client-smoke. */
var STORY_SKIP=false;
try{ STORY_SKIP=localStorage.getItem('wildwood-story')==='skip'; }catch(_){}
const storySkip=()=>STORY_SKIP;
function storyCut(lines){
  if(!STORY_SKIP||!lines) return lines;
  lines=lines.filter(l=>!String(l).startsWith('@pick '));   // (no choices in the objectives-only mode)
  if(lines.length<2) return lines;
  for(let i=lines.length-1;i>=0;i--) if(lines[i][0]!=='('&&!/^@cine /.test(lines[i])) return [lines[i]];
  return [lines[lines.length-1]];
}
function storyRender(){ document.querySelectorAll('[data-story]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.story==='skip')===STORY_SKIP)); }
function storySet(skip){
  STORY_SKIP=!!skip;
  try{ if(STORY_SKIP) localStorage.setItem('wildwood-story','skip'); else localStorage.removeItem('wildwood-story'); }catch(_){}
  if(STORY_SKIP){ try{ stopSpeech(); svCineEnd(); }catch(_){} }
  storyRender();
}
document.querySelectorAll('[data-story]').forEach(b=>b.addEventListener('click',()=>storySet(b.dataset.story==='skip')));
storyRender();
