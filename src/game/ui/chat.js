//@ Chat between players: the chat log, the input (Enter / chat button), speech bubbles, /name, joins and leaves
/* Press Enter (or the chat button) to type, Enter to send, Escape to close. Messages go to everyone in the
   world through the server; they appear in the log and as a bubble over the speaker's head for a few seconds.
   "/name New Name" changes your name. While you type, the game ignores the keyboard. */
const CHAT={lines:[],open:false,bubbles:new Map()};
const chatEl=$('#chat'), chatLog=$('#chatLog'), chatIn=$('#chatIn'), chatText=$('#chatText');
function chatLine(kind,name,text){
  const el=document.createElement('div'); el.className='cl '+kind;
  if(name){ const b=document.createElement('b'); b.textContent=name+(kind==='sys'?' ':': '); el.append(b); }
  el.append(document.createTextNode(text));
  chatLog.append(el); CHAT.lines.push({el,t:performance.now()});
  while(CHAT.lines.length>60){ CHAT.lines.shift().el.remove(); }
  chatLog.scrollTop=chatLog.scrollHeight;
  if(kind!=='sys') UI_SFX.click();
}
function openChat(){
  if(!started||customizing||!NET.ready) return;
  CHAT.open=true; chatEl.classList.add('open'); chatIn.hidden=false;
  for(const k in keys) keys[k]=false; joyX=joyY=0;
  releasePointer();
  setTimeout(()=>chatText.focus(),0);
}
function closeChat(){ CHAT.open=false; chatEl.classList.remove('open'); chatIn.hidden=true; chatText.value=''; chatText.blur(); }
function sendChat(){
  const v=chatText.value.trim(); closeChat(); if(!v) return;
  const m=/^\/name\s+(.+)$/i.exec(v);
  if(m){ setMyName(m[1]); return; }
  if(/^\/(help|\?)$/i.test(v)){ chatLine('sys',null,'Type to talk to everyone in this world. /name New Name changes your name.'); return; }
  netSend({t:'chat',text:v.slice(0,160)});
}
function setMyName(n){
  if(NET.user){ toast('Your name is your account name and cannot be changed','bad'); return; }
  n=String(n||'').replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,16);
  if(!n){ toast('That name is empty','bad'); return; }
  NET.name=n; try{ localStorage.setItem('wildwood-name',n); }catch(_){}
  $('#setName').value=n;
  if(NET.ready) netSend({t:'name',name:n}); else toast('Name saved','good');
}
// events from the server
function onChat(pid,name,text){
  const mine=pid===NET.pid;
  chatLine(mine?'me':'pl',name,text);
  CHAT.bubbles.set(pid,{text,until:performance.now()+6000});
}
function onRename(pid,name,old){
  if(pid===NET.pid){ NET.name=name; toast('You are now '+name,'good'); }
  else { const r=REMOTES.get(pid); if(r) r.name=name; }
  chatLine('sys',old,'is now known as '+name);
}
// while typing, stop the game from seeing keys (movement, E, I, N...): Enter sends, Escape closes
addEventListener('keydown',e=>{
  if(e.target===chatText){
    e.stopPropagation();
    if(e.key==='Enter'){ e.preventDefault(); sendChat(); }
    else if(e.key==='Escape'){ e.preventDefault(); closeChat(); }
    return;
  }
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')){ e.stopPropagation(); return; }
  if(e.key==='Enter'&&started&&!customizing&&!uiOpen()&&!CHAT.open){ e.preventDefault(); e.stopPropagation(); openChat(); }
},true);
$('#chatBtn').addEventListener('click',e=>{ e.currentTarget.blur(); CHAT.open?closeChat():openChat(); });
$('#chatSend').addEventListener('click',sendChat);
// name in the settings popover
$('#setNameBtn').addEventListener('click',()=>setMyName($('#setName').value));
$('#setName').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); setMyName($('#setName').value); } });
// fade old lines when the chat is closed; your own speech bubble
const meSay=$('#meSay');
function updateChat(){
  const now=performance.now();
  for(const L of CHAT.lines) L.el.classList.toggle('old',!CHAT.open&&now-L.t>14000);
  chatEl.classList.toggle('empty',!CHAT.lines.length);
  const b=CHAT.bubbles.get(NET.pid);
  if(b&&now<b.until&&started&&!customizing){ const s=toScreen(P.x,P.y+2.35*hiker.scale,P.z); if(s){ meSay.hidden=false; meSay.textContent=b.text; meSay.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-100%)`; } else meSay.hidden=true; }
  else meSay.hidden=true;
}
