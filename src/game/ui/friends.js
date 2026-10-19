//@ The friends and ranking panel (comma key): add a friend by name (the other player accepts), who is online, invite to a party, remove; the level ranking with your own place
/* agent map
   exports: frState ({tab, friends: [[name, online, level, class]], rank: [[rank, name, level, class, online]], me, total}), frOpen(tab), frRender()
   events: EVH.frl (the friend list), EVH.fri (a friend request), EVH.rnk (the ranking), each only when e[1] is your pid
   messages out: fr{a:'add'|'accept'|'decline'|'remove'|'list'|'rank', name} (server/friends.js); party{a:'invite'} for the invite button (dungeon/party.js)
   markup: #friends (a panel, in PANELS), #frInv (the request prompt), #bFriends in index.html; styles/31-friends.css   test: tools/friends-smoke.js (server side) */
const frState={tab:'friends',friends:[],rank:[],me:0,total:0,from:''};
let frPoll=0;
EVH.frl=e=>{ if(e[1]!==NET.pid) return; frState.friends=Array.isArray(e[2])?e[2]:[]; if(!$('#friends').hidden) frRender(); };
EVH.rnk=e=>{ if(e[1]!==NET.pid) return; frState.rank=Array.isArray(e[2])?e[2]:[]; frState.me=e[3]|0; frState.total=e[4]|0; if(!$('#friends').hidden) frRender(); };
EVH.fri=e=>{
  if(e[1]!==NET.pid) return;
  frState.from=String(e[2]||'Someone'); $('#frInvText').textContent=frState.from+' wants to be your friend.'; $('#frInv').hidden=false; UI_SFX.notify();
  setTimeout(()=>{ if(frState.from===String(e[2]||'Someone')) $('#frInv').hidden=true; },Math.max(1,+e[3]||60)*1000);
};
function frAnswer(yes){ netSend({t:'fr',a:yes?'accept':'decline',name:frState.from}); $('#frInv').hidden=true; frState.from=''; UI_SFX.click(); }
$('#frYes').addEventListener('click',()=>frAnswer(true));
$('#frNo').addEventListener('click',()=>frAnswer(false));
const frEl=(tag,cls,text)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; };
const frClsName=c=>c==='warrior'?'Warrior':c==='mage'?'Mage':c==='ranger'?'Ranger':'';
function frRowSub(lv,cls){ return (lv?'Lv '+lv:'')+(frClsName(cls)?' · '+frClsName(cls):''); }
function frRender(){
  const body=$('#frBody'), F=frState.tab==='friends';
  $('#frTabF').className='chip'+(F?' buy':''); $('#frTabR').className='chip'+(F?'':' buy'); body.innerHTML='';
  if(F){
    const add=frEl('div','fr-add'), inp=frEl('input'), go=frEl('button','chip buy','Add friend');
    inp.id='frName'; inp.maxLength=16; inp.placeholder='Name of a player online'; inp.autocomplete='off'; inp.spellcheck=false; go.type='button'; go.id='frGo';
    const send=()=>{ const n=String(inp.value||'').trim(); if(!n) return; netSend({t:'fr',a:'add',name:n}); inp.value=''; UI_SFX.click(); };
    go.addEventListener('click',send); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } e.stopPropagation(); });
    add.append(inp,go); body.append(add);
    if(!frState.friends.length) body.append(frEl('p','fr-note','No friends yet. Type the name of someone who is online; they get a request and become your friend when they accept.'));
    for(const r of frState.friends){
      const row=frEl('div','fr-row'), dot=frEl('span','fr-dot'+(r[1]?' on':''));
      row.append(dot,frEl('b','',String(r[0])),frEl('span','fr-lv',r[1]?frRowSub(r[2],r[3]):'offline'+(r[2]?' · Lv '+r[2]:'')));
      if(r[1]){ const b=frEl('button','chip','Invite to party'); b.type='button'; b.addEventListener('click',()=>{ netSend({t:'party',a:'invite',name:String(r[0])}); UI_SFX.click(); }); row.append(b); }
      const x=frEl('button','chip','Remove'); x.type='button'; x.addEventListener('click',()=>{ if(!x.dataset.sure){ x.dataset.sure='1'; x.textContent='Sure?'; return; } netSend({t:'fr',a:'remove',name:String(r[0])}); UI_SFX.click(); }); row.append(x);
      body.append(row);
    }
  } else {
    body.append(frEl('p','fr-note',frState.me?'You are number '+frState.me+' of '+frState.total+' hikers, ranked by level, then by experience.':'Hikers ranked by level, then by experience.'));
    for(const r of frState.rank){
      const row=frEl('div','fr-row'+(r[0]===frState.me?' me':'')), nm=frEl('b','',String(r[1])+(r[0]===frState.me?' (you)':''));
      row.append(frEl('span','fr-rk','#'+r[0]),frEl('span','fr-dot'+(r[4]?' on':'')),nm,frEl('span','fr-lv',frRowSub(r[2],r[3])));
      body.append(row);
    }
    if(!frState.rank.length) body.append(frEl('p','fr-note','Nobody is ranked yet.'));
  }
}
function frAsk(){ netSend({t:'fr',a:frState.tab==='friends'?'list':'rank'}); }
function frOpen(tab){ if(tab) frState.tab=tab; openPanel('friends'); frRender(); netSend({t:'fr',a:'list'}); netSend({t:'fr',a:'rank'}); clearInterval(frPoll); frPoll=setInterval(()=>{ if($('#friends').hidden){ clearInterval(frPoll); return; } frAsk(); },8000); }
$('#frTabF').addEventListener('click',()=>{ frState.tab='friends'; frRender(); frAsk(); UI_SFX.click(); });
$('#frTabR').addEventListener('click',()=>{ frState.tab='rank'; frRender(); frAsk(); UI_SFX.click(); });
const frToggle=()=>{ if($('#friends').hidden) frOpen(); else closePanels(); };
$('#bFriends').addEventListener('click',e=>{ frToggle(); e.currentTarget.blur(); });
addEventListener('keydown',e=>{ if(kbIs(e.code,'friends')&&started&&!customizing&&!e.repeat){ const tg=e.target&&e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT') return; frToggle(); } });
