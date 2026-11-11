//@ The portrait nudge: while a touch device plays upright, one dismissible card suggests the wide way (the game stays playable in portrait)
/* Agent map. Shows when body.playing + body.touch + portrait (checked on resize/orientationchange), never again once any button is tapped
   (localStorage 'wwRot'). "Turn me sideways" also tries screen.orientation.lock('landscape') — Android honours it in fullscreen only,
   iOS not at all: it fails quietly and the player turns the phone themselves. Styles: 03-touch-controls.css. Test: phone-layout-smoke. */
let rotDone=false;
try{ rotDone=!!localStorage.getItem('wwRot'); }catch(e){}
const rotCard=$('#rotCard');
function rotCheck(){
  if(!rotCard) return;
  const portrait=innerHeight>innerWidth;
  rotCard.hidden=rotDone||!portrait||!document.body.classList.contains('touch')||!document.body.classList.contains('playing')||document.body.classList.contains('editing')||uiOpen();
}
function rotDismiss(){ rotDone=true; try{ localStorage.setItem('wwRot','1'); }catch(e){} rotCheck(); }
if(rotCard){
  $('#rotGo').addEventListener('click',()=>{ try{ if(screen.orientation&&screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} rotDismiss(); });   // (the lock needs fullscreen on Android: dismissed either way)
  $('#rotNo').addEventListener('click',rotDismiss);
  addEventListener('resize',rotCheck);
  addEventListener('orientationchange',rotCheck);
  window.wwRotCheck=rotCheck;   // the layout smoke's handle: the headless DOM has no MutationObserver, so it calls this directly (a real browser re-asks through the observers below)
  if(typeof MutationObserver!=='undefined'){
    const rotObs=new MutationObserver(rotCheck);   // playing / editing turn on body classes; a panel opens by clearing its hidden attribute
    rotObs.observe(document.body,{attributes:true,attributeFilter:['class']});
    for(const p of document.querySelectorAll('.panel')) rotObs.observe(p,{attributes:true,attributeFilter:['hidden']});
  }
}
