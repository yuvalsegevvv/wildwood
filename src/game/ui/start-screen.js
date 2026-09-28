//@ Start card: loading state, Log in / Register / Play as guest (Solo / Shared without a server), connecting, beginPlay
/* ---------- the start card ----------
   Where a player can go from the card:
   - a page served by the Node world server (WILDWOOD_WS): Log in, Register, Play as guest. Log in and Register open one small form;
     a browser that still holds a session token shows "Continue as <name>" in place of Log in.
   - any other page (the claude.ai artifact, a local file) has no accounts: Play solo and, inside claude.ai, Play in the shared world.
   Log in and Play as guest start the game as soon as the server's welcome arrives. Register connects as a guest, sends register{user,pass}
   and waits for the answer (onAuth / onAuthFail in ui/account.js call startAuthed / startAuthFailed here); the guest's progress moves
   to the new account, then the character editor opens in creating mode and its Enter button starts the game.
   The card works while the forest is still growing; only the buttons that enter the world wait for canStart. */
const ONLINE=!!window.WILDWOOD_WS, IN_CLAUDE=!!(window.claude&&typeof window.claude.use==='function');
const hint=$('#hint'), barEl=$('#barFill'), growEl=$('#grow');
const stHome=$('#stHome'), stForm=$('#stForm'), stMsg=$('#stMsg'), stNote=$('#stNote'), stUser=$('#stUser'), stPass=$('#stPass'), stPass2=$('#stPass2');
const GUEST_FALLBACK='Hiker '+Math.floor(100+Math.random()*900);
let canStart=false, startView='home', starting=false, pendingReg=null;   // pendingReg: {user,pass} while a registration waits for the server
const guestName=()=>playerName()||GUEST_FALLBACK;
NET.name=guestName(); $('#setName').value=NET.name;

/* ---- loading ---- */
function onStreamProgress(){
  if(!Stream.terrainDone) return;
  const nearTotal=Math.max(1,[...Array(NCH).keys()].filter(i=>distToChunk(i,spawn.x,spawn.z)<NEAR_R).length);
  const nearDone=nearTotal-Stream.needed.size;
  if(!canStart){
    barEl.style.width=(35+65*nearDone/nearTotal).toFixed(0)+'%';
    statusEl.textContent='Planting the forest around you… '+nearDone+' of '+nearTotal+' nearby areas';
    if(Stream.needed.size===0){
      canStart=true;
      barEl.style.width='100%'; $('#bar').classList.add('done');
      statusEl.textContent=growLeft()?'Ready. The rest of the forest keeps growing while you walk.':'The forest is ready.';
      syncStart();
    }
  }
  const left=growLeft();
  if(left){ growEl.textContent='Growing distant areas: '+left+' left'; growEl.hidden=false; }
  else growEl.hidden=true;
}
// chunks still to grow within reach (the far side of the mountains grows only when you get there)
function growLeft(){ return Stream.pending.filter(i=>distToChunk(i,P.x,P.z)<=FAR_R).length+(Stream.job&&Stream.job.kind==='c'?1:0); }
NET.onStatus=text=>{ if(started) toast(text,''); else statusEl.textContent=text; };

/* ---- the card ---- */
function startMsg(text){ stMsg.textContent=text||''; stMsg.hidden=!text; }
function syncStart(){
  const ses=ONLINE?loadSession():null, wait=!canStart||starting, home=startView==='home';
  stHome.hidden=!home; stForm.hidden=home;
  $('#stLogin').hidden=$('#stRegister').hidden=$('#stGuest').hidden=!ONLINE;
  $('#stSolo').hidden=ONLINE; $('#stRoom').hidden=ONLINE||!IN_CLAUDE;
  $('#stLogin').textContent=ses?'Continue as '+ses.user:'Log in';
  $('#stLogin').disabled=!!ses&&wait; $('#stGuest').disabled=$('#stSolo').disabled=$('#stRoom').disabled=$('#stSubmit').disabled=wait;
  stNote.hidden=!ses; stNote.textContent='';
  if(ses){ stNote.append('Logged in as '+ses.user+' on this device.'); const b=document.createElement('button'); b.className='linkbtn'; b.type='button'; b.textContent='Use another account';
    b.addEventListener('click',()=>{ saveSession(null); syncStart(); }); stNote.append(b); }
}
function showStart(view){
  startView=view; startMsg('');
  if(view!=='home'){
    const reg=view==='register';
    $('#stFormTitle').textContent=reg?'Create an account':'Log in'; $('#stSubmit').textContent=reg?'Register':'Log in';
    stPass2.hidden=!reg; stPass.autocomplete=reg?'new-password':'current-password'; stPass.value=stPass2.value='';
    const fine=$('#stFine'); fine.hidden=!reg; fine.textContent=reg?'Your name stays yours and shows over your head. There is no email, so a lost password cannot be reset: keep it safe.':'';
  }
  syncStart();
  if(view!=='home') stUser.focus({preventScroll:true});
}
// every way into the world goes through here. o: {mode:'ws'|'solo'|'room', name, login:{user,pass|token}, register:{user,pass}}
async function enterWorld(o){
  if(!canStart||starting) return;
  startMsg(''); audioInit(); starting=true; syncStart();
  if(o.register&&NET.ready&&NET.mode==='ws'&&!NET.user){ pendingReg=o.register; netSend({t:'register',user:o.register.user,pass:o.register.pass}); return; }   // still connected from a refused registration
  if(NET.ready) netReset();
  NET.name=o.name; NET.login=o.login||null; pendingReg=o.register||null;
  if(!o.login&&!o.register) try{ localStorage.setItem('wildwood-name',NET.name); }catch(_){}
  NET.onReady=()=>{ if(pendingReg) netSend({t:'register',user:pendingReg.user,pass:pendingReg.pass}); else { starting=false; beginPlay(); } };
  try{
    if(o.mode==='room') await startRoom(NET.name);
    else if(o.mode==='ws'){ statusEl.textContent='Connecting to the world server…'; await startWS(); }
    else startSolo();
  }catch(e){ startFail(e.message); }
}
// the server refused the login, or the connection failed: back to the card with the reason
function startFail(text){ netReset(); NET.login=null; pendingReg=null; starting=false; startMsg(text); syncStart(); }
function startAuthFailed(msg){
  if(msg.reg){ pendingReg=null; starting=false; startMsg(msg.text); syncStart(); return; }   // registration refused: still connected as a guest, so another name can be tried
  if(NET.login&&NET.login.token) saveSession(null);
  startFail(msg.text);
}
// registered: the guest's progress is the account's now; the new hiker picks a class and a look before the game starts
function startAuthed(){
  stPass.value=stPass2.value='';
  if(!pendingReg) return;
  pendingReg=null; starting=false; statusEl.textContent=''; syncStart();
  openEditor({create:true});
}
$('#stLogin').addEventListener('click',()=>{ const ses=loadSession(); if(ses) enterWorld({mode:'ws',name:ses.user,login:{user:ses.user,token:ses.token}}); else showStart('login'); });
$('#stRegister').addEventListener('click',()=>showStart('register'));
$('#stGuest').addEventListener('click',()=>enterWorld({mode:'ws',name:guestName()}));
$('#stSolo').addEventListener('click',()=>enterWorld({mode:'solo',name:guestName()}));
$('#stRoom').addEventListener('click',()=>enterWorld({mode:'room',name:guestName()}));
$('#stBack').addEventListener('click',()=>{ if(!starting) showStart('home'); });
stForm.addEventListener('submit',e=>{
  e.preventDefault();
  const user=stUser.value.trim(), pass=stPass.value;
  if(startView==='login'){
    if(!user||!pass) return startMsg('Type your account name and password.');
    return enterWorld({mode:'ws',name:user,login:{user,pass}});
  }
  if(user.length<3) return startMsg('Account names need at least 3 characters.');
  if(pass.length<6) return startMsg('Passwords need at least 6 characters.');
  if(pass!==stPass2.value) return startMsg('The two passwords do not match.');
  enterWorld({mode:'ws',name:user,register:{user,pass}});
});
function beginPlay(){
  started=true;
  $('#start').classList.add('hide');
  document.body.classList.add('playing');
  renderQlog();
  hint.textContent=isTouch?'Drag on the left to walk, on the right to look around. Tap the minimap for the world map.':'WASD to walk, Shift to run, Space to jump, F or click to attack, Q for your skill, E to talk, I for your inventory, N for the map. Click to look with the mouse; T skips ahead in the day, V switches the camera.';
  if(LITE) hint.textContent+=' Running in light mode for this phone.';
  hint.classList.add('show'); setTimeout(()=>hint.classList.remove('show'),9000);
  if(!isTouch && canvas.requestPointerLock){ try{ const r=canvas.requestPointerLock(); if(r && r.catch) r.catch(()=>{}); }catch(_){} }
}
syncStart();
