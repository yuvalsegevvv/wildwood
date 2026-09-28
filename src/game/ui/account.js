//@ Accounts on the online server: guest or log in on the start screen; register / log out / guest code in settings
/* Only on a server that keeps saves (the Node server, NET.mode 'ws'); solo and shared worlds have no accounts.
   Guest: progress under this browser's secret account code (accountCode() in net/client.js).
   Registered: name + password; after logging in the browser keeps a session token ('wildwood-session') so the
   next visit logs in without the password. While logged in, the browser's own save is not overwritten: it
   stays the guest's copy (see saveGear / saveProgress). Server side: src/server/accounts.js. */
function loadSession(){ try{ const s=JSON.parse(localStorage.getItem('wildwood-session')||'null'); if(s&&typeof s.user==='string'&&typeof s.token==='string') return s; }catch(_){} return null; }
function saveSession(s){ try{ if(s) localStorage.setItem('wildwood-session',JSON.stringify(s)); else localStorage.removeItem('wildwood-session'); }catch(_){} }
let acctMode=loadSession()?'login':'guest';
try{ const m=localStorage.getItem('wildwood-acctmode'); if(m==='guest'||m==='login') acctMode=m; }catch(_){}
/* ---- start screen: Guest / Log in (shown when the world is "This server") ---- */
function syncAcctPick(){
  const ws=typeof worldMode!=='undefined'&&worldMode==='ws', login=ws&&acctMode==='login', ses=loadSession();
  $('#acctPick').hidden=!ws; $('#loginBox').hidden=!login; $('#namePick').hidden=login;
  document.querySelectorAll('[data-acct]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.acct===acctMode));
  $('#loginFields').hidden=!!ses;
  const note=$('#loginNote'); note.textContent='';
  if(ses){ note.append('Logged in as '+ses.user+' on this device.'); const b=document.createElement('button'); b.className='linkbtn'; b.textContent='Use another account';
    b.addEventListener('click',()=>{ saveSession(null); syncAcctPick(); }); note.append(b); }
  else note.textContent='No account yet? Play as a guest and register in Settings: your progress comes with you.';
}
document.querySelectorAll('[data-acct]').forEach(b=>b.addEventListener('click',()=>{ acctMode=b.dataset.acct; try{ localStorage.setItem('wildwood-acctmode',acctMode); }catch(_){} syncAcctPick(); }));
// read by netHello: null = guest, {user,pass} or {user,token} = log in. Returns an error text when incomplete.
function prepareLogin(){
  NET.login=null;
  if(worldMode!=='ws'||acctMode!=='login') return '';
  const ses=loadSession(); if(ses){ NET.login={user:ses.user,token:ses.token}; return ''; }
  const user=$('#lUser').value.trim(), pass=$('#lPass').value;
  if(!user||!pass) return 'Type your account name and password, or play as a guest.';
  NET.login={user,pass}; return '';
}
/* ---- server answers ---- */
function onAuth(msg){
  if(msg.token) saveSession({user:msg.user,token:msg.token});
  NET.user=msg.user; NET.name=msg.user; NET.login=null;
  try{ localStorage.setItem('wildwood-acctmode','login'); }catch(_){}
  $('#lPass').value=''; $('#regPass').value=''; $('#pname').value=msg.user; $('#setName').value=msg.user;
  syncAcctSec();
}
function onAuthFail(msg){
  if(msg.reg){ toast(msg.text,'bad'); $('#regGo').disabled=false; return; }
  // refused at the start screen: close this connection; the Walk button connects again
  if(NET.login&&NET.login.token) saveSession(null);
  NET.login=null; NET.onReady=null; NET.send=null; if(NET.ws) try{ NET.ws.close(); }catch(_){}
  statusEl.textContent=msg.text; connecting=false; $('#go').disabled=false; syncAcctPick();
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
  saveSession(null); try{ localStorage.setItem('wildwood-acctmode','guest'); }catch(_){}
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
