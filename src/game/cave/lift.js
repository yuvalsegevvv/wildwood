//@ The Deep Cave's lift on the client: standing on a lift (beside the mouth, or at the start of a floor) the talk key opens a small window listing the surface and every floor, the shut ones greyed with the reason; the server (server/cave-zone.js caveLiftP) does the moving
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (the cave case: the window lists the floors), tools/cave-smoke.js (the rules).
   exports: caveLiftNear() -> {n (the floor you stand on, 0 = the surface), L} or null, caveLiftOpen() (talking.js interact), caveLiftPrompt(el, btn) (talking.js updateTalkUI), caveLiftTick(dt) (zone.js caveFrame: closes the
            window when you step off), renderCaveLift()
   users: talking.js (two marked lines), panels.js (PANELS has 'cvLift'), index.html (#cvLift). The rules are shared/cave-map.js caveLiftRefusal, the same text the server answers with.
   Protocol: {t:'lift', to: 0 | floor number} (docs/PROTOCOL.md); the answer is a tp (zone.js caveOnTp builds the floor) and a toast. */
function caveLiftNear(){
  if(!started||customizing||PL.dead) return null;
  const n=caveFloorAt(P.x,P.z);
  if(n<0&&!caveMouthNear(P.x,P.z,20)) return null;
  const L=n>=0?caveLiftOf(n):CAVE_LIFT_SURFACE; if(!L) return null;
  return Math.hypot(P.x-L.x,P.z-L.z)<L.r+0.6?{n:Math.max(0,n),L}:null;
}
function caveLiftOpen(){ openPanel('cvLift'); renderCaveLift(); UI_SFX.click(); }
function caveLiftPrompt(el,btn){ el.textContent=isTouch?'':'Press '+(kbName('talk')||'the talk key')+' to use the lift'; el.hidden=isTouch; btn.textContent='Lift'; }
const CAVE_LIFT_ICON='<path d="M5 3h14v18H5z"/><path d="M9 9l3-3 3 3M9 15l3 3 3-3"/>';
function renderCaveLift(){
  if($('#cvLift').hidden) return;
  const here=caveLiftNear(), cur=here?here.n:-1, p={level:PL.level,gear:GEAR};
  let h='<p class="tr-intro">An iron cage on a chain, older than the village. Choose where it carries you.</p><div class="tr-grid">';
  const rows=[[0,'The Wildwood','the surface',null]].concat(CAVE_FLOOR_N.map(n=>{ const F=caveFloorDef(n); return [n,F.name,'Floor '+n+' · Lv '+F.lv[0]+'-'+F.lv[1],caveLiftRefusal(p,n)]; }));
  for(const [n,name,sub,why] of rows){
    const isHere=n===cur, off=isHere||!!why;
    h+=`<button class="tr-dest${isHere?' here':''}" data-to="${n}" ${off?'disabled':''} ${why?`title="${why.replace(/"/g,'&quot;')}"`:''}><span class="tr-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CAVE_LIFT_ICON}</svg></span><b>${name}</b><small>${sub}</small><span class="tr-state">${isHere?'You are here':why||'Open'}</span></button>`;
  }
  h+='</div><p class="tr-intro">The board beside the lift: every floor has the same eight ways to earn a skill. Finish one once for its skill; after that it pays Echo Shards.</p>'+caveBoardHtml();   // cave: where each skill comes from (game/cave/methods.js)
  $('#cvLiftBody').innerHTML=h;
  $('#cvLiftBody').querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>{ netSend({t:'lift',to:+b.dataset.to}); UI_SFX.click(); closePanels(); });
}
function caveLiftTick(dt){
  if(!$('#cvLift').hidden&&!caveLiftNear()) closePanels();   // stepped off the lift
}
