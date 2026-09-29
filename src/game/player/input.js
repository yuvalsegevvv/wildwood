//@ Keyboard, hold Alt to free the mouse, mouse look, touch joystick, HUD buttons
/* ---------- input ---------- */
const keys={};
let joyX=0, joyY=0, jumpReq=false, thirdPerson=true, started=false, dragging=false;
function look(dx,dy,s){ if(customizing){ P.face-=dx*0.01; return; } P.yaw-=dx*s; P.pitch=clamp(P.pitch-dy*s,-1.35,1.35); }
function toggleView(){ thirdPerson=!thirdPerson; hiker.g.visible=thirdPerson||customizing; }
// Hold Alt to get the mouse pointer back and click the HUD, panels and settings without opening a panel or pressing Esc;
// let go and the mouse look locks again (the browser only allows that shortly after a key press, about 5 s: after a longer
// hold the next click on the world locks it, as always). Alt+Tab and the like end the hold without a lock.
let altHeld=false, altRelock=false;
const isAlt=e=>e.code==='AltLeft'||e.code==='AltRight';
function altDown(){
  if(altHeld||!started||customizing) return;
  altHeld=true; altRelock=document.pointerLockElement===canvas; dragging=false;
  releasePointer();
}
function altUp(){
  if(!altHeld) return; altHeld=false;
  if(altRelock && !uiOpen() && !CHAT.open && sndEl.hidden && canvas.requestPointerLock){
    try{ const r=canvas.requestPointerLock(); if(r && r.catch) r.catch(()=>{}); }catch(_){}
  }
  altRelock=false;
}
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(isAlt(e)){ e.preventDefault(); if(!e.repeat) altDown(); return; }   // preventDefault: a lone Alt would focus the browser's menu bar
  if(!started) return;
  if(kbIs(e.code,'jump')){ jumpReq=true; e.preventDefault(); }
  if(kbIs(e.code,'time')) cycleTime();
  if(kbIs(e.code,'view')) toggleView();
});
addEventListener('keyup',e=>{ keys[e.code]=false; if(isAlt(e)){ e.preventDefault(); altUp(); } });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; altHeld=false; altRelock=false; });
canvas.addEventListener('mousedown',()=>{
  if(altHeld || (!started && !customizing)) return; dragging=true; if(customizing) return;
  if(!isTouch && document.pointerLockElement!==canvas && canvas.requestPointerLock){
    try{ const r=canvas.requestPointerLock(); if(r && r.catch) r.catch(()=>{}); }catch(_){}
  }
});
addEventListener('mouseup',()=>{ dragging=false; });
addEventListener('mousemove',e=>{ if((started||customizing) && (document.pointerLockElement===canvas || dragging)) look(e.movementX||0,e.movementY||0,0.0022); });

const joyEl=$('#joy'), knob=$('#knob');
let joyId=null, joyOX=0, joyOY=0, lookId=null, lookX=0, lookY=0;
canvas.addEventListener('touchstart',e=>{
  e.preventDefault(); if(!started && !customizing) return;
  for(const t of e.changedTouches){
    if(!customizing && t.clientX<innerWidth*0.45 && joyId===null){
      joyId=t.identifier; joyOX=t.clientX; joyOY=t.clientY;
      joyEl.style.display='block'; joyEl.style.left=joyOX+'px'; joyEl.style.top=joyOY+'px'; knob.style.transform='translate(0,0)';
    } else if(lookId===null){ lookId=t.identifier; lookX=t.clientX; lookY=t.clientY; }
  }
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===joyId){
      let dx=t.clientX-joyOX, dy=t.clientY-joyOY; const m=Math.hypot(dx,dy), RR=50;
      if(m>RR){ dx*=RR/m; dy*=RR/m; }
      joyX=dx/RR; joyY=dy/RR; knob.style.transform=`translate(${dx}px,${dy}px)`;
    } else if(t.identifier===lookId){ look(t.clientX-lookX,t.clientY-lookY,0.0048); lookX=t.clientX; lookY=t.clientY; }
  }
},{passive:false});
function endTouch(e){
  for(const t of e.changedTouches){
    if(t.identifier===joyId){ joyId=null; joyX=joyY=0; joyEl.style.display='none'; }
    if(t.identifier===lookId) lookId=null;
  }
}
canvas.addEventListener('touchend',endTouch); canvas.addEventListener('touchcancel',endTouch);
const bJump=$('#bJump');
bJump.addEventListener('touchstart',e=>{ e.preventDefault(); jumpReq=true; },{passive:false});
bJump.addEventListener('click',()=>{ jumpReq=true; });
$('#bTime').addEventListener('click',e=>{ cycleTime(); e.currentTarget.blur(); });
$('#bView').addEventListener('click',e=>{ toggleView(); e.currentTarget.blur(); });
