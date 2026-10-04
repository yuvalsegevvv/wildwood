//@ The party on the client: the frame under your bars (names, health, level, down, the leader's crown), the invite prompt, the party panel (invite by name, leave, kick, hand on the lead), a tap on a name tag, the party colour on the maps, the revive channel's cast bar
/* agent map
   exports: dgPartyState ({lead: pid, list: [[pid, name, hp, maxHp, level, dead 0|1, run id], ...]}: the pty event as it came; the Delve board reads it, dungeon/board.js), dgPtyOpen(name),
            dgPtyRender(), dgPartyCol(pid) (ui/map.js: a party member's dot), dgPartyTick(dt) (run.js dgFrame: the invite's countdown), dgCastEv(e) (net/client.js's cast line: i < 0, the revive and the kits' channels),
            dgPtyMember(pid) -> row | null, DG_PTY_COL
   events: EVH.pty, EVH.ptyi (each only when e[1] is your pid: a Shared room's one broadcast carries everyone's)
   messages out: party{a:'invite'|'accept'|'decline'|'leave'|'kick'|'lead', name} (server/party.js; /invite name in chat does the same)
   markup: #dgPtyFrame (under the bars), #dgPty (a panel, in PANELS), #dgPtyInv (the invite prompt) in index.html; styles/24-dungeon.css. The run-start prompt (dgi) is the Delve board's.
   keys: 'party' (P) opens the panel, 'accept' (Y) / 'decline' (Backspace) answer the invite on show, or the board's join prompt (#dgJoin)
   test: tools/dungeon-client-smoke.js (frame, invite, panel, map colour, revive bar) */
const dgPartyState={lead:0,list:[]};
const DG_PTY_COL='#7ef0a0', DG_PTY_INV={until:0,secs:30,from:'',want:''};
const dgPtyMember=pid=>dgPartyState.list.find(r=>r[0]===pid)||null;
const dgPartyCol=pid=>pid!==NET.pid&&dgPtyMember(pid)?DG_PTY_COL:'';
PANELS.push('dgPty');
EVH.pty=e=>{ if(e[1]!==NET.pid) return; dgPartyState.lead=e[2]||0; dgPartyState.list=Array.isArray(e[3])?e[3]:[]; dgPtyRender(); };
EVH.ptyi=e=>{
  if(e[1]!==NET.pid) return;
  DG_PTY_INV.from=String(e[3]||'Someone'); DG_PTY_INV.secs=Math.max(1,+e[4]||30); DG_PTY_INV.until=Date.now()+DG_PTY_INV.secs*1000;
  $('#dgPtyInvText').textContent=DG_PTY_INV.from+' invites you to their party.'; $('#dgPtyInv').hidden=false; UI_SFX.notify(); dgPartyTick(0);
};
function dgPtyAnswer(yes){ netSend({t:'party',a:yes?'accept':'decline'}); DG_PTY_INV.until=0; $('#dgPtyInv').hidden=true; UI_SFX.click(); }
$('#dgPtyYes').addEventListener('click',()=>dgPtyAnswer(true));
$('#dgPtyNo').addEventListener('click',()=>dgPtyAnswer(false));
function dgPartyTick(){
  if($('#dgPtyInv').hidden) return;
  const left=Math.max(0,Math.ceil((DG_PTY_INV.until-Date.now())/1000));
  if(!left){ $('#dgPtyInv').hidden=true; return; }
  const s=String(left)+'s'; if($('#dgPtyInvLeft').textContent!==s){ $('#dgPtyInvLeft').textContent=s; $('#dgPtyInvBar').style.width=Math.round(100*left/DG_PTY_INV.secs)+'%'; }
}
const dgPtyEl=(tag,cls,text)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; };
// the frame under your bars: the others, in party order (you have your own bars); dimmed when not in the run you are in (or in the world while you are in a run)
function dgPtyRender(){
  const F=$('#dgPtyFrame'), L=dgPartyState.list, me=NET.pid, run=DG_RUN?DG_RUN.id:0;
  F.innerHTML=''; F.hidden=!L.length;
  for(const r of L){
    if(r[0]===me) continue;
    const row=dgPtyEl('div','dgp-row'+(r[5]?' down':'')+((r[6]|0)!==run?' away':'')), top=dgPtyEl('div','dgp-top');
    if(r[0]===dgPartyState.lead) top.append(dgPtyEl('span','dgp-crown','♛'));
    top.append(dgPtyEl('b','',String(r[1])),dgPtyEl('span','dgp-lv',r[5]?'Down':'Lv '+r[4]));
    const bar=dgPtyEl('div','dgp-bar'), fill=dgPtyEl('i'); fill.style.width=Math.round(100*Math.max(0,r[2])/Math.max(1,r[3]))+'%'; bar.append(fill);
    row.append(top,bar); row.title=(r[6]|0)!==run?(r[6]?String(r[1])+' is in a dungeon run':String(r[1])+' is in the world'):String(r[1]); F.append(row);
  }
  if(!$('#dgPty').hidden) dgPtyPanelRender();
}
// the panel: who is in, what the leader may do, invite by name, leave
function dgPtyPanelRender(){
  const body=$('#dgPtyBody'), L=dgPartyState.list, me=NET.pid, lead=dgPartyState.lead===me;
  body.innerHTML='';
  if(!L.length) body.append(dgPtyEl('p','dgp-note','You are not in a party. Invite up to three others by name (or type /invite and a name in chat); a run started by the leader asks every member to come.'));
  for(const r of L){
    const row=dgPtyEl('div','dgp-mem'), name=dgPtyEl('b','',(r[0]===dgPartyState.lead?'♛ ':'')+String(r[1])+(r[0]===me?' (you)':''));
    row.append(name,dgPtyEl('span','dgp-lv','Lv '+r[4]+(r[5]?' · down':'')+(r[6]?' · in a run':'')));
    if(lead&&r[0]!==me){ for(const [a,txt] of [['lead','Make leader'],['kick','Remove']]){ const b=dgPtyEl('button','chip',txt); b.type='button'; b.dataset.ptya=a; b.addEventListener('click',()=>{ netSend({t:'party',a,name:String(r[1])}); UI_SFX.click(); }); row.append(b); } }
    body.append(row);
  }
  const inv=dgPtyEl('div','dgp-inv'), inp=dgPtyEl('input'), go=dgPtyEl('button','chip buy','Invite');
  inp.id='dgPtyName'; inp.maxLength=16; inp.placeholder='Name of a player online'; inp.autocomplete='off'; inp.spellcheck=false; inp.value=DG_PTY_INV.want||''; go.type='button'; go.id='dgPtyGo';
  const send=()=>{ const n=String(inp.value||'').trim(); if(!n) return; netSend({t:'party',a:'invite',name:n}); DG_PTY_INV.want=''; inp.value=''; UI_SFX.click(); };
  go.addEventListener('click',send); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } e.stopPropagation(); });
  if(!L.length||lead){ inv.append(inp,go); body.append(inv); }
  if(L.length){ const lv=dgPtyEl('button','chip','Leave the party'); lv.type='button'; lv.id='dgPtyLeave'; lv.addEventListener('click',()=>{ netSend({t:'party',a:'leave'}); UI_SFX.click(); }); body.append(lv); }
}
function dgPtyOpen(name){
  if(name!==undefined) DG_PTY_INV.want=String(name);
  openPanel('dgPty'); dgPtyPanelRender();
}
$('#dgPtyFrame').addEventListener('click',()=>{ if($('#dgPty').hidden) dgPtyOpen(); else closePanels(); });
// a tap on another hiker's name tag (net/remote.js marks each tag with its pid) opens the panel with the name filled in
document.addEventListener('click',e=>{
  const tag=e.target&&e.target.closest&&e.target.closest('.ntag'); if(!tag||!tag.dataset||!tag.dataset.pid) return;
  for(const r of REMOTES.values()) if(String(r.id)===tag.dataset.pid){ dgPtyOpen(r.name); return; }
});
addEventListener('keydown',e=>{
  if(!started||customizing||e.repeat) return;
  const tg=e.target&&e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT') return;
  if(kbIs(e.code,'party')){ if($('#dgPty').hidden) dgPtyOpen(); else closePanels(); }
  else if(kbIs(e.code,'accept')||kbIs(e.code,'decline')){
    const yes=kbIs(e.code,'accept');
    if(!$('#dgPtyInv').hidden){ dgPtyAnswer(yes); e.preventDefault(); }
    else if(!$('#dgJoin').hidden){ $(yes?'#dgJoinYes':'#dgJoinNo').click(); e.preventDefault(); }
  }
});
/* a run's channels on the professions' cast bar (walking 1.5 m off breaks it, as on the server; castx [pid] takes it down: net/client.js): cast [pid, -1, seconds, target] the revive (the one
   revived is told), cast [pid, -2, seconds, objective id] a mission kit's channel (Sabotage's 2 s, Escort's 5 s: named by DG_OBJ_KINDS); a resource node's cast (i >= 0) is the professions' own */
function dgCastEv(e){
  const nm=pid=>(dgPtyMember(pid)||[0,(REMOTES.get(pid)||{}).name||'your teammate'])[1], o=DG_RUN&&DG_RUN.objs.get(e[4]);
  if(e[1]===NET.pid){ Object.assign(CAST,{on:true,t0:t,dur:Math.max(0.1,+e[3]||3),x:P.x,z:P.z}); cbName.textContent=e[2]===-1?'Reviving '+nm(e[4]):o?dgObjName(o.kind,DG_RUN.th):'Channelling'; cbFill.style.width='0%'; castBar.hidden=false; }
  else if(e[2]===-1&&e[4]===NET.pid) toast(nm(e[1])+' is reviving you…','good');
}
