//@ Talking to villagers: bubble, prompt, talk key (E), opening shop/quest panels; stepping on a teleport circle
/* talking */
const bubble=$('#bubble'), bName=$('#bName'), bText=$('#bText'), promptEl=$('#prompt'), bTalk=$('#bTalk');
const _bv=new THREE.Vector3();
function startTalk(n){ talkNPC=n; n.line=0; UI_SFX.talk(); sayLine(n); openRolePanel(n); }
function openRolePanel(n){ const r=n.def.role; if(r==='weaponsmith'||r==='armorer') openShop(n); else if(r==='quests') openQuests(n); else if(r==='forge') openForge(n); else if(r==='trainer') openSkills(n); else if(r==='soul') openSoul(n); }
function sayLine(n){
  const L=n.def.lines&&n.def.lines.length?n.def.lines:['Hello there.'];
  const line=L[n.line%L.length];
  bName.textContent=n.def.name; bText.textContent=line; n.line++;
  speakLine(n,line);
  if(typeof n.def.onTalk==='function'){ try{ n.def.onTalk(n); }catch(e){ console.error(e); } }
}
function endTalk(){ if(panelNPC && panelNPC===talkNPC) closePanels(); talkNPC=null; stopSpeech(); }
function interact(){
  if(!started||customizing||PL.dead) return;
  if(talkNPC && (nearNPC===talkNPC || Math.hypot(P.x-talkNPC.x,P.z-talkNPC.z)<4.5)){ sayLine(talkNPC); if(!panelNPC) openRolePanel(talkNPC); }
  else if(nearNPC) startTalk(nearNPC);
  else if(nearCircle()) useCircle();
}
// the teleport circles (one in each village): E / the talk button on one sends you to the other, once attuned (GEAR.east 2)
function nearCircle(){ const V=vilAt(P.x,P.z); return V.tele&&Math.hypot(P.x-V.tele.x,P.z-V.tele.z)<V.tele.r+0.6?V:null; }
function useCircle(){ netSend({t:'warp'}); UI_SFX.click(); }
function circlePrompt(V){
  const other=V===VIL?'Hanami':'the village';
  if(GEAR.east>=2) return (isTouch?'Tap Travel to go to ':'Press '+(kbName('talk')||'the talk key')+' to travel to ')+other;
  return GEAR.east>=1?'The circle hums, but it is not attuned: walk to Hanami first':'An old teleport circle. It is cold';
}
function updateTalkUI(){
  const canTalk=started && !customizing && (nearNPC||talkNPC);
  if(talkNPC){
    _bv.set(talkNPC.x,talkNPC.y+2.05*talkNPC.scale,talkNPC.z).project(camera);
    if(_bv.z<1){
      const x=clamp((_bv.x*0.5+0.5)*innerWidth,130,innerWidth-130), y=Math.max(70,(-_bv.y*0.5+0.5)*innerHeight);
      bubble.style.left=x+'px'; bubble.style.top=y+'px'; bubble.hidden=false;
    } else bubble.hidden=true;
  } else bubble.hidden=true;
  const circ=started && !customizing && !canTalk && !PL.dead ? nearCircle() : null;
  if(circ){
    promptEl.textContent=circlePrompt(circ); promptEl.hidden=false; bTalk.textContent=GEAR.east>=2?'Travel':'Look';
    document.body.classList.add('can-talk');
  } else if(canTalk){
    const who=talkNPC||nearNPC;
    const tk=kbName('talk')||'the talk key';
    promptEl.textContent=isTouch?'':(talkNPC?'Press '+tk+' to keep talking to '+who.def.name:'Press '+tk+' to talk to '+who.def.name);
    promptEl.hidden=isTouch; bTalk.textContent=talkNPC?'Next':'Talk';
    document.body.classList.add('can-talk');
  } else { promptEl.hidden=true; document.body.classList.remove('can-talk'); }
}
bTalk.addEventListener('touchstart',e=>{ e.preventDefault(); interact(); },{passive:false});
bTalk.addEventListener('click',()=>interact());
addEventListener('keydown',e=>{ if(kbIs(e.code,'talk')) interact(); });
