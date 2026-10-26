//@ The test room on the client: the damage counter on the screen, the panel (counter, reset, cooldowns, cave charge, soul and skills), the talk key on the pad
/* Agent map (docs/TESTROOM.md). TROOM_UI holds the server's last counter. NETH.troomc updates it, NETH.troomcd zeroes the cooldowns the client keeps (CB.cd). troomUpdate(dt) runs every frame from main/loop.js:
   shows #troomHud while you stand on the pad and closes the panel when you step off. Markup #troom and #troomHud (index.html), styles 32-testroom.css, server/testroom.js. Test: tools/testroom-smoke.js. */
const TROOM_UI={tot:0,hits:0,dps:0,max:0,secs:0};
const troomNear=()=>started&&!PL.dead&&troomIn(P.x,P.z,0);
const troomFmt=n=>Math.round(n).toLocaleString('en-US');
NETH.troomc=m=>{ TROOM_UI.tot=+m.tot||0; TROOM_UI.hits=+m.hits||0; TROOM_UI.dps=+m.dps||0; TROOM_UI.max=+m.max||0; TROOM_UI.secs=+m.secs||0; troomRender(); };
NETH.troomcd=()=>{ for(const k in CB.cd) CB.cd[k]=0; };
function troomOpen(){ openPanel('troom'); troomRender(); UI_SFX.click(); }
function troomStat(label,val){ return '<div class="tr-stat"><small>'+label+'</small><b>'+val+'</b></div>'; }
function troomRender(){
  const u=TROOM_UI;
  if(!$('#troomHud').hidden||started) $('#troomHud').textContent='Damage '+troomFmt(u.tot)+'  ·  '+troomFmt(u.dps)+'/s  ·  '+u.hits+' hits';
  if($('#troom').hidden) return;
  $('#troomBody').innerHTML='<div class="tr-stats">'+troomStat('Total damage',troomFmt(u.tot))+troomStat('Damage per second',troomFmt(u.dps))+troomStat('Hits',u.hits)+troomStat('Biggest hit',troomFmt(u.max))+'</div>'
    +'<div class="tr-btns"><button class="chip" data-tr="reset">Reset the counter</button><button class="chip" data-tr="cd">Reset cooldowns</button><button class="chip" data-tr="charge">Refill the cave charge to 100</button>'
    +'<button class="chip" data-tr="soul">Change soul</button><button class="chip" data-tr="skills">Change skills</button></div>'
    +'<p class="tr-note">The scarecrow cannot be hurt, so the counter only adds up what you deal. DPS runs from your first hit to your last. Your own gear and level count, as everywhere.</p>';
  $('#troomBody').querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.tr; UI_SFX.click();
    if(a==='soul') openSoul(); else if(a==='skills') openSkills(); else netSend({t:'troom',a});
  });
}
function troomUpdate(dt){
  const on=troomNear(), hud=$('#troomHud');
  if(hud.hidden===on){ hud.hidden=!on; if(on) troomRender(); }
  if(!on&&!$('#troom').hidden&&started) closePanels();
}
