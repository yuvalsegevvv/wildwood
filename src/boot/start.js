//@ Runs last, after the game bundle and the 3D engine: starts wildwoodMain() and shows a fatal message if it cannot
/* The 3D engine is built into this page (above), so nothing extra has to download. */
(function(){
  if(window.__noWebGL){ showFatal('This browser has 3D graphics (WebGL) turned off or unsupported. Try opening the link in Safari or Chrome.'); return; }
  if(!window.THREE){ showFatal('The 3D engine did not start. Tap to reload.', true); return; }
  try{ wildwoodMain(); }catch(e){ console.error(e); showFatal('Something went wrong starting the forest: '+e.message+'. Tap to reload.', true); }
})();
