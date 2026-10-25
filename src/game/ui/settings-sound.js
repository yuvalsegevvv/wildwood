//@ Sound part of the settings popover
/* ---------- sound settings panel ---------- */
const sndEl=$('#sound');
function renderSound(){
  sndEl.querySelectorAll('input[data-k]').forEach(i=>{ i.value=SND.vol[i.dataset.k]; });
  sndEl.querySelectorAll('[data-voice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.voice===SND.voiceMode));
  const vs=sndEl.querySelector('[data-voice="speech"]'); if(vs) vs.disabled=!speech.ok;
  hvRender();
  $('#sMute').setAttribute('aria-pressed',SND.muted); $('#sMute').textContent=SND.muted?'Sound off':'Sound on';
  $('#bSound').classList.toggle('muted',SND.muted);
}
sndEl.querySelectorAll('input[data-k]').forEach(i=>i.addEventListener('input',()=>{ SND.vol[i.dataset.k]=parseFloat(i.value); applyVolumes(); saveAudio(); }));
sndEl.querySelectorAll('input[data-k="ui"]').forEach(i=>i.addEventListener('change',()=>UI_SFX.hover()));
sndEl.querySelectorAll('[data-voice]').forEach(b=>b.addEventListener('click',()=>{ SND.voiceMode=b.dataset.voice; saveAudio(); renderSound(); if(b.dataset.voice==='off') stopSpeech(); }));
function hvRender(){ $('#hvChips').querySelectorAll('[data-hv]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.hv===hvChoice())); }
$('#hvChips').querySelectorAll('[data-hv]').forEach(b=>b.addEventListener('click',()=>{ hvSet(b.dataset.hv); hvRender(); if(b.dataset.hv!=='off') hvShout('skill',{name:'Test shout',cls:clsOf()},true); }));
function toggleMute(){ SND.muted=!SND.muted; if(SND.muted) stopSpeech(); applyVolumes(); saveAudio(); renderSound(); }
$('#sMute').addEventListener('click',toggleMute);
$('#bSound').addEventListener('click',e=>{ audioInit(); e.currentTarget.blur(); sndEl.hidden=!sndEl.hidden; if(!sndEl.hidden){ renderSound(); UI_SFX.open(); } else UI_SFX.close(); });
$('#sClose').addEventListener('click',()=>{ sndEl.hidden=true; UI_SFX.close(); });
addEventListener('keydown',e=>{ if(kbIs(e.code,'mute') && started) toggleMute(); if(e.code==='Escape') sndEl.hidden=true; });
renderSound();
/* graphics quality: stored, then the page reloads because the detail levels are read once at load (core/setup.js) */
function renderGfx(){ $('#gfxChips').querySelectorAll('[data-gfx]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.gfx===GFX)); }
$('#gfxChips').querySelectorAll('[data-gfx]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.gfx===GFX) return;
  try{ if(b.dataset.gfx) localStorage.setItem('wildwood-gfx',b.dataset.gfx); else localStorage.removeItem('wildwood-gfx'); localStorage.removeItem('wildwood-lite'); }catch(_){}
  location.reload();
}));
renderGfx();
/* child-safe drawing (character/modest.js): stored, then the page reloads so every character is built again */
function renderModest(){ $('#modestChips').querySelectorAll('[data-modest]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.modest==='1')===MODEST)); }
$('#modestChips').querySelectorAll('[data-modest]').forEach(b=>b.addEventListener('click',()=>{
  if((b.dataset.modest==='1')===MODEST) return;
  try{ if(b.dataset.modest) localStorage.setItem('wildwood-modest','1'); else localStorage.removeItem('wildwood-modest'); }catch(_){}
  location.reload();
}));
renderModest();
