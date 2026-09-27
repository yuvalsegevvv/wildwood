function showFatal(msg, reload){
  var st=document.getElementById('status'), start=document.getElementById('start'), go=document.getElementById('go');
  if(start){ start.classList.remove('hide'); }
  document.body.classList.remove('playing');
  if(st) st.textContent=msg;
  if(go){ go.disabled=false; go.textContent=reload?'Reload':'Try again'; go.onclick=function(){ location.reload(); }; }
}
window.addEventListener('error',function(e){ showFatal('Something went wrong: '+(e.message||'unknown error')+'. Tap to reload.', true); });
window.addEventListener('unhandledrejection',function(e){ showFatal('Something went wrong: '+((e.reason&&e.reason.message)||e.reason)+'. Tap to reload.', true); });
(function(){ var l=document.getElementById('fontcss'); if(l){ if(l.sheet) l.media='all'; else l.addEventListener('load',function(){ l.media='all'; }); } })();
(function(){
  var c=document.createElement('canvas'), ok=false;
  try{ ok=!!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl'))); }catch(e){}
  window.__noWebGL=!ok;
})();
