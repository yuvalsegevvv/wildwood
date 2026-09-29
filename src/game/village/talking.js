//@ Talking to villagers: bubble, prompt, talk key (E), the main quest's lines first, opening shop/quest panels; reading lore spots, picking heartleaf; stepping on a teleport circle
/* talking */
const bubble=$('#bubble'), bName=$('#bName'), bText=$('#bText'), promptEl=$('#prompt'), bTalk=$('#bTalk');
const _bv=new THREE.Vector3();
/* A quest villager (the main quest, game/economy/main-quest.js) says their quest lines first, one per talk key press, and the server
   is told once (it applies the same talk: starts, progresses or hands in the step); their shop or panel opens after the last one */
function startTalk(n){ loreOpen=null; talkNPC=n; n.line=0; UI_SFX.talk(); const T=mqLinesFor(n); n.mq=T?T.lines.slice():null; if(T) netSend({t:'mq',a:'talk',id:n.def.id}); sayLine(n); if(!mqBusy(n)) openRolePanel(n); }
const mqBusy=n=>!!(n.mq&&n.mq.length);
function openRolePanel(n){ const r=n.def.role; if(r==='weaponsmith'||r==='armorer'||r==='peddler') openShop(n); else if(r==='quests') openQuests(n); else if(r==='forge') openForge(n); else if(r==='trainer') openSkills(n); else if(r==='soul') openSoul(n); else if(r==='lodge') openLodge(n); else if(r==='brew') openBrew(n); }
function sayLine(n){
  const L=n.def.lines&&n.def.lines.length?n.def.lines:['Hello there.'];
  const quest=mqBusy(n), line=quest?n.mq.shift():L[n.line++%L.length];
  bName.textContent=n.def.name; bText.textContent=line; bubble.classList.toggle('mq',quest); bubble.classList.remove('lore');
  if(line[0]!=='(') speakLine(n,line);   // (lines in brackets are what you see, not what they say)
  if(typeof n.def.onTalk==='function'){ try{ n.def.onTalk(n); }catch(e){ console.error(e); } }
}
/* lore spots (LORE in shared/main-quest.js): the talk key shows the text in the bubble, over the spot; the server hears of it
   (a main quest step may want it read). Heartleaf: the talk key picks it */
let loreOpen=null;
function readLore(L){ if(talkNPC) endTalk(); loreOpen=L; bName.textContent=L.name; bText.textContent=(L.textOpen&&northOpen())?L.textOpen:L.text; bubble.classList.remove('mq'); bubble.classList.add('lore'); UI_SFX.talk(); netSend({t:'mq',a:'read',id:L.id}); }
function pickHerb(i){ netSend({t:'mq',a:'pick',i}); UI_SFX.pickup(); }
function endTalk(){ if(panelNPC && panelNPC===talkNPC) closePanels(); talkNPC=null; stopSpeech(); }
function interact(){
  if(!started||customizing||PL.dead) return;
  if(talkNPC && (nearNPC===talkNPC || Math.hypot(P.x-talkNPC.x,P.z-talkNPC.z)<4.5)){ sayLine(talkNPC); if(!panelNPC&&!mqBusy(talkNPC)) openRolePanel(talkNPC); }
  else if(nearNPC) startTalk(nearNPC);
  else if(nearHerb()>=0) pickHerb(nearHerb());
  else if(loreNear(P.x,P.z)){ const L=loreNear(P.x,P.z); if(loreOpen===L) loreOpen=null; else readLore(L); }
  else if(nearNode()>=0) gatherNode(nearNode());
  else if(nearCircle()) useCircle();
}
// the teleport circles (one in each village): E / the talk button on one sends you to the other, once attuned (GEAR.east 2)
function nearCircle(){ const V=vilAt(P.x,P.z); return V.tele&&Math.hypot(P.x-V.tele.x,P.z-V.tele.z)<V.tele.r+0.6?V:null; }
// the circle: once attuned, stepping onto it (or the talk key) opens the travel window (ui/travel.js) with every village; a cold circle just answers with what is missing
function useCircle(){ const C=CIRCLES.find(c=>c.V===nearCircle()); if(C&&C.open(GEAR)){ openTravel(); UI_SFX.click(); } else { netSend({t:'warp'}); UI_SFX.click(); } }
function circlePrompt(V){
  const C=CIRCLES.find(c=>c.V===V);
  if(C&&C.open(GEAR)) return (isTouch?'Tap Travel to choose where to go':'Press '+(kbName('talk')||'the talk key')+' to choose where to travel');
  return V===VIL3?'The circle hums, but it is not attuned: walk into Rimehold first':GEAR.east>=1?'The circle hums, but it is not attuned: walk to Hanami first':'An old teleport circle. It is cold';
}
// stepping onto an attuned circle opens the travel window by itself (once per visit: step off and on again, or press the talk key, to open it again)
let circleWas=null;
function updateTalkUI(){
  { const cn=started&&!customizing&&!PL.dead?nearCircle():null;
    if(cn&&cn!==circleWas){ const C=CIRCLES.find(c=>c.V===cn); if(C&&C.open(GEAR)&&!uiOpen()){ openTravel(); UI_SFX.click(); } }
    circleWas=cn; }
  const canTalk=started && !customizing && (nearNPC||talkNPC);
  if(loreOpen&&(talkNPC||Math.hypot(P.x-loreOpen.x,P.z-loreOpen.z)>LORE_R+2)) loreOpen=null;
  if(loreOpen){ bubble.style.left=innerWidth/2+'px'; bubble.style.top=Math.round(innerHeight*0.42)+'px'; bubble.hidden=false; }   // a lore spot's text: long, so in the middle of the screen
  else if(talkNPC){
    _bv.set(talkNPC.x,talkNPC.y+2.05*talkNPC.scale,talkNPC.z).project(camera);
    if(_bv.z<1){
      const x=clamp((_bv.x*0.5+0.5)*innerWidth,130,innerWidth-130), y=Math.max(70,(-_bv.y*0.5+0.5)*innerHeight);
      bubble.style.left=x+'px'; bubble.style.top=y+'px'; bubble.hidden=false;
    } else bubble.hidden=true;
  } else bubble.hidden=true;
  if(!$('#travel').hidden&&!nearCircle()) closePanels();   // stepped off the circle
  const free=started && !customizing && !canTalk && !PL.dead, herb=free?nearHerb():-1, lore=free&&herb<0?loreNear(P.x,P.z):null, node=free&&herb<0&&!lore?nearNode():-1, circ=free&&herb<0&&!lore&&node<0?nearCircle():null;
  const tk=kbName('talk')||'the talk key';
  if(herb>=0||lore){
    promptEl.textContent=isTouch?'':herb>=0?'Press '+tk+' to pick the heartleaf':loreOpen===lore?'Press '+tk+' to stop reading':'Press '+tk+' to read: '+lore.name;
    promptEl.hidden=isTouch; bTalk.textContent=herb>=0?'Pick':'Read'; document.body.classList.add('can-talk');
  } else if(node>=0){
    promptEl.textContent=isTouch?'':nodePrompt(node); promptEl.hidden=isTouch; bTalk.textContent=NODE_KINDS[NODES[node].kind].prof==='mining'?'Mine':NODE_KINDS[NODES[node].kind].prof==='woodcutting'?'Chop':'Gather'; document.body.classList.add('can-talk');
  } else if(circ){
    promptEl.textContent=circlePrompt(circ); promptEl.hidden=false; bTalk.textContent=CIRCLES.find(c=>c.V===circ).open(GEAR)?'Travel':'Look';
    document.body.classList.add('can-talk');
  } else if(canTalk){
    const who=talkNPC||nearNPC;
    promptEl.textContent=isTouch?'':(talkNPC?'Press '+tk+' to keep talking to '+who.def.name:'Press '+tk+' to talk to '+who.def.name);
    promptEl.hidden=isTouch; bTalk.textContent=talkNPC?'Next':'Talk';
    document.body.classList.add('can-talk');
  } else { promptEl.hidden=true; document.body.classList.remove('can-talk'); }
}
bTalk.addEventListener('touchstart',e=>{ e.preventDefault(); interact(); },{passive:false});
bTalk.addEventListener('click',()=>interact());
addEventListener('keydown',e=>{ if(kbIs(e.code,'talk')) interact(); });
