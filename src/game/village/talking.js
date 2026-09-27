//@ Talking to villagers: bubble, prompt, E key, opening shop/quest panels
/* talking */
const bubble=$('#bubble'), bName=$('#bName'), bText=$('#bText'), promptEl=$('#prompt'), bTalk=$('#bTalk');
const _bv=new THREE.Vector3();
function startTalk(n){ talkNPC=n; n.line=0; UI_SFX.talk(); sayLine(n); openRolePanel(n); }
function openRolePanel(n){ const r=n.def.role; if(r==='weaponsmith'||r==='armorer') openShop(n); else if(r==='quests') openQuests(n); else if(r==='forge') openForge(n); else if(r==='trainer') openSkills(n); }
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
  if(canTalk){
    const who=talkNPC||nearNPC;
    promptEl.textContent=isTouch?'':(talkNPC?'E to keep talking to '+who.def.name:'Press E to talk to '+who.def.name);
    promptEl.hidden=isTouch; bTalk.textContent=talkNPC?'Next':'Talk';
    document.body.classList.add('can-talk');
  } else { promptEl.hidden=true; document.body.classList.remove('can-talk'); }
}
bTalk.addEventListener('touchstart',e=>{ e.preventDefault(); interact(); },{passive:false});
bTalk.addEventListener('click',()=>interact());
addEventListener('keydown',e=>{ if(e.code==='KeyE') interact(); });
