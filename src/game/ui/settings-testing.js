//@ Testing tools in the settings popover (sent to the server as dev commands): set level, all items, coins, reset
/* ----- settings: testing tools ----- */
$('#tLevel').value=PL.level;
$('#tSetLv').addEventListener('click',()=>{ const v=clamp(parseInt($('#tLevel').value,10)||1,1,50); netSend({t:'dev',cmd:'level',v}); toast('Level set to '+v,'good'); });
$('#tAll').addEventListener('click',()=>{ netSend({t:'dev',cmd:'giveAll'}); });
function syncStartAll(){ $('#tStartAll').setAttribute('aria-pressed',!!GEAR.startAll); $('#tStartAll').textContent='Start with every item: '+(GEAR.startAll?'on':'off'); }
$('#tStartAll').addEventListener('click',()=>{ GEAR.startAll=!GEAR.startAll; saveGear(); syncStartAll(); netSend({t:'dev',cmd:'startAll',v:GEAR.startAll}); });
$('#tCoins').addEventListener('click',()=>{ netSend({t:'dev',cmd:'coins'}); });
$('#tThree').addEventListener('click',()=>{ netSend({t:'dev',cmd:'three'}); });
let luckyN=0; $('#tLucky').addEventListener('click',()=>{ netSend({t:'dev',cmd:'lucky',v:2+(luckyN++%3)}); });
$('#tReset').addEventListener('click',e=>{
  const b=e.currentTarget; if(!b.dataset.sure){ b.dataset.sure='1'; b.textContent='Tap again to wipe level, items, coins and quests'; return; }
  delete b.dataset.sure; b.textContent='Reset all progress';
  if(NET.ready) netSend({t:'dev',cmd:'reset'});
  else { const keep=GEAR.startAll; GEAR=newGear(); GEAR.startAll=keep; saveGear(); PL.level=1; PL.exp=0; saveProgress(); toast('Progress reset','good'); }
});
syncStartAll();
