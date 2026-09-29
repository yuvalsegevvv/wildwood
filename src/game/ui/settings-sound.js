//@ Sound part of the settings popover
/* ---------- sound settings panel ---------- */
const sndEl=$('#sound');
function renderSound(){
  sndEl.querySelectorAll('input[data-k]').forEach(i=>{ i.value=SND.vol[i.dataset.k]; });
  sndEl.querySelectorAll('[data-voice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.voice===SND.voiceMode));
  const vs=sndEl.querySelector('[data-voice="speech"]'); if(vs) vs.disabled=!speech.ok;
  $('#sMute').setAttribute('aria-pressed',SND.muted); $('#sMute').textContent=SND.muted?'Sound off':'Sound on';
  $('#bSound').classList.toggle('muted',SND.muted);
}
sndEl.querySelectorAll('input[data-k]').forEach(i=>i.addEventListener('input',()=>{ SND.vol[i.dataset.k]=parseFloat(i.value); applyVolumes(); saveAudio(); }));
sndEl.querySelectorAll('input[data-k="ui"]').forEach(i=>i.addEventListener('change',()=>UI_SFX.hover()));
sndEl.querySelectorAll('[data-voice]').forEach(b=>b.addEventListener('click',()=>{ SND.voiceMode=b.dataset.voice; saveAudio(); renderSound(); if(b.dataset.voice==='off') stopSpeech(); }));
function toggleMute(){ SND.muted=!SND.muted; if(SND.muted) stopSpeech(); applyVolumes(); saveAudio(); renderSound(); }
$('#sMute').addEventListener('click',toggleMute);
$('#bSound').addEventListener('click',e=>{ audioInit(); e.currentTarget.blur(); sndEl.hidden=!sndEl.hidden; if(!sndEl.hidden){ renderSound(); UI_SFX.open(); } else UI_SFX.close(); });
$('#sClose').addEventListener('click',()=>{ sndEl.hidden=true; UI_SFX.close(); });
addEventListener('keydown',e=>{ if(kbIs(e.code,'mute') && started) toggleMute(); if(e.code==='Escape') sndEl.hidden=true; });
renderSound();
