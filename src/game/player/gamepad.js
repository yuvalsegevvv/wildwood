//@ Gamepad support: sticks walk and look, buttons press the keys their actions are bound to (keybinds.js)
/* ---------- gamepad ---------- */
/* agent map: polled once a frame by its own requestAnimationFrame loop (nothing in loop.js). Left stick = joyX / joyY (the touch
   joystick's inputs, movement.js), right stick = look(). A button does not call a handler: it sends a keydown / keyup with the
   action's current key (kbKey), so every handler, the held-key attack and a rebound key keep working. The button -> action table
   (GP_BTN) is fixed, standard layout (Xbox: A B X Y). Test: tools/keys-smoke.js. */
const GP_BTN={0:'jump',1:'run',2:'basic',3:'skill',4:'talk',5:'burst',6:'target',7:'gather',8:'map',9:'inv',10:'view',11:'skills',12:'pot1',13:'pot2',14:'pot3',15:'cave'};
const GP_DEAD=0.18, GP_LOOK=900;   // dead zone of a stick; look speed in "mouse pixels" a second at full tilt
const GP={held:{},sent:{},stick:false,t:0};   // held: button -> action pressed; sent: action -> the code we pressed; stick: the pad owns joyX / joyY
const gpKeyOf=act=>{ const m=KB.map[act]; return m&&(m[0]||m[1])||''; };
function gpEmit(type,code){ try{ dispatchEvent(new KeyboardEvent(type,{code,key:code,bubbles:true,cancelable:true})); }catch(_){} }
function gpRelease(act){ const c=GP.sent[act]; if(c){ delete GP.sent[act]; gpEmit('keyup',c); } }
function gpReleaseAll(){ for(const a of Object.keys(GP.sent)) gpRelease(a); GP.held={}; if(GP.stick){ GP.stick=false; joyX=joyY=0; } }
const gpAxis=v=>{ const a=Math.abs(v||0); return a<GP_DEAD?0:Math.sign(v)*(a-GP_DEAD)/(1-GP_DEAD); };
// one pad's state for dt seconds; pad = {buttons:[{pressed}], axes:[lx,ly,rx,ry]} (the browser's Gamepad)
function gpApply(pad,dt){
  if(!started||KB.cap||CHAT.open){ gpReleaseAll(); return; }
  for(const b in GP_BTN){
    const on=!!(pad.buttons[b]&&pad.buttons[b].pressed), act=GP_BTN[b];
    if(on&&!GP.held[b]){ const c=gpKeyOf(act); if(c){ GP.held[b]=act; GP.sent[act]=c; gpEmit('keydown',c); } }
    else if(!on&&GP.held[b]){ delete GP.held[b]; gpRelease(act); }
  }
  const lx=gpAxis(pad.axes[0]), ly=gpAxis(pad.axes[1]), rx=gpAxis(pad.axes[2]), ry=gpAxis(pad.axes[3]);
  if(lx||ly){ joyX=lx; joyY=ly; GP.stick=true; }
  else if(GP.stick){ joyX=joyY=0; GP.stick=false; }   // only zero what the pad set: a touch joystick keeps its own
  if((rx||ry)&&!uiOpen()) look(rx*GP_LOOK*dt,ry*GP_LOOK*dt,0.0022);
}
function gpPoll(now){
  requestAnimationFrame(gpPoll);
  const dt=Math.min(0.1,Math.max(0,(now-GP.t)/1000)); GP.t=now;
  let pad=null; try{ const l=navigator.getGamepads?navigator.getGamepads():[]; for(const p of l) if(p&&p.connected&&p.buttons&&p.axes){ pad=p; break; } }catch(_){}
  if(pad) gpApply(pad,dt); else if(GP.stick||Object.keys(GP.sent).length) gpReleaseAll();
}
addEventListener('blur',gpReleaseAll);
requestAnimationFrame(gpPoll);
