//@ Accounts on the online server: session token, the server's auth answers, register / log out / guest code in settings
/* Only on a server that keeps saves (the Node server, NET.mode 'ws'); solo and shared worlds have no accounts.
   Guest: progress under this browser's secret account code (accountCode() in net/client.js).
   Registered: name + password; after logging in the browser keeps a session token ('wildwood-session') so the
   next visit logs in without the password. While logged in, the browser's own save is not overwritten: it
   stays the guest's copy (see saveGear / saveProgress). Log in / Register / Play as guest live on the start
   card (ui/start-screen.js); this file has what the server answers and the Account part of the settings.
   Server side: src/server/accounts.js. */
function loadSession(){ try{ const s=JSON.parse(localStorage.getItem('wildwood-session')||'null'); if(s&&typeof s.user==='string'&&typeof s.token==='string') return s; }catch(_){} return null; }
function saveSession(s){ try{ if(s) localStorage.setItem('wildwood-session',JSON.stringify(s)); else localStorage.removeItem('wildwood-session'); }catch(_){} }
/* ---- server answers (the start card's part is in ui/start-screen.js) ---- */
function onAuth(msg){
  if(msg.token) saveSession({user:msg.user,token:msg.token});
  NET.user=msg.user; NET.name=msg.user; NET.login=null;
  $('#regPass').value=''; $('#setName').value=msg.user;
  syncAcctSec();
  if(!started) startAuthed();
}
function onAuthFail(msg){
  if(started){ toast(msg.text,'bad'); $('#regGo').disabled=false; return; }   // a refused registration from the settings
  startAuthFailed(msg);
}
/* ---- settings: who you are, register, log out, guest code ---- */
function syncAcctSec(){
  const u=NET.user;
  $('#acctUser').hidden=!u; $('#acctGuest').hidden=!!u;
  if(u) $('#acctUserNote').textContent='Logged in as '+u+'. Your progress is saved on the server under this name.';
  $('#setName').disabled=$('#setNameBtn').disabled=!!u;
  if(!u&&!$('#regUser').value) $('#regUser').value=NET.name||'';
}
$('#regGo').addEventListener('click',()=>{
  const user=$('#regUser').value.trim(), pass=$('#regPass').value;
  if(user.length<3){ toast('Account names need at least 3 characters','bad'); return; }
  if(pass.length<6){ toast('Passwords need at least 6 characters','bad'); return; }
  if(!NET.ready){ toast('Not connected to the server','bad'); return; }
  $('#regGo').disabled=true; netSend({t:'register',user,pass});
  setTimeout(()=>{ $('#regGo').disabled=false; },3000);
});
$('#acctOut').addEventListener('click',()=>{
  const s=loadSession(); if(s) netSend({t:'logout',token:s.token});
  saveSession(null);
  toast('Logged out','good'); setTimeout(()=>location.reload(),500);
});
const acctIn=$('#acctCode');
$('#acctShow').addEventListener('click',e=>{ const on=e.currentTarget.textContent==='Show'; acctIn.value=on?accountCode():'••••••••••••••••'; e.currentTarget.textContent=on?'Hide':'Show'; });
$('#acctCopy').addEventListener('click',()=>{ const c=accountCode(); const done=()=>toast('Account code copied. Keep it private.','good');
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(done,()=>{ acctIn.value=c; acctIn.select(); toast('Select the code and copy it',''); });
  else { acctIn.value=c; acctIn.select(); toast('Select the code and copy it',''); } });
$('#acctGo').addEventListener('click',()=>{
  const v=$('#acctUse').value.trim().toLowerCase();
  if(!/^[a-f0-9]{32}$/.test(v)){ toast('That does not look like an account code (32 letters and numbers)','bad'); return; }
  if(v===accountCode()){ toast('That is already your code',''); return; }
  try{ localStorage.setItem('wildwood-account',v); }catch(_){}
  toast('Switching account…','good'); setTimeout(()=>location.reload(),600);
});
$('#kickedBtn').addEventListener('click',()=>location.reload());
