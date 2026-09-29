//@ Testing tools in the settings popover (sent to the server as dev commands): set level, the main quest's step, all items, coins, weather, the Sakura Vale, reset
/* ----- settings: testing tools ----- */
$('#tLevel').value=PL.level;
$('#tSetLv').addEventListener('click',()=>{ const v=clamp(parseInt($('#tLevel').value,10)||1,1,50); netSend({t:'dev',cmd:'level',v}); toast('Level set to '+v,'good'); });
// the main quest: jump to a step (offered by its giver; set the level too if the step is gated above yours)
$('#tMq').innerHTML=MQ.map(s=>`<option value="${s.id}">${s.id} · ${s.title} (level ${s.gate})</option>`).join('');
$('#tSetMq').addEventListener('click',()=>netSend({t:'dev',cmd:'mq',v:$('#tMq').value}));
$('#tAll').addEventListener('click',()=>{ netSend({t:'dev',cmd:'giveAll'}); });
function syncStartAll(){ $('#tStartAll').setAttribute('aria-pressed',!!GEAR.startAll); $('#tStartAll').textContent='Start with every item: '+(GEAR.startAll?'on':'off'); }
$('#tStartAll').addEventListener('click',()=>{ GEAR.startAll=!GEAR.startAll; saveGear(); syncStartAll(); netSend({t:'dev',cmd:'startAll',v:GEAR.startAll}); });
$('#tCoins').addEventListener('click',()=>{ netSend({t:'dev',cmd:'coins'}); });
$('#tMats').addEventListener('click',()=>netSend({t:'dev',cmd:'mats'}));
$('#tSkills').addEventListener('click',()=>netSend({t:'dev',cmd:'skills'}));
$('#tThree').addEventListener('click',()=>{ netSend({t:'dev',cmd:'three'}); });
$('#tRain').addEventListener('click',()=>netSend({t:'dev',cmd:'weather',v:'rain'}));
$('#tStorm').addEventListener('click',()=>netSend({t:'dev',cmd:'weather',v:'storm'}));
$('#tClear').addEventListener('click',()=>netSend({t:'dev',cmd:'weather',v:'clear'}));
// the vale: open the tunnel (as if you had helped beat the Rootwarden), jump to its west portal, or seal it again
$('#tVale').addEventListener('click',()=>netSend({t:'dev',cmd:'vale',v:1}));
$('#tTunnel').addEventListener('click',e=>netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}));
$('#tSeal').addEventListener('click',()=>{ netSend({t:'dev',cmd:'vale',v:0}); toast('The vale is sealed again','good'); });
let luckyN=0; $('#tLucky').addEventListener('click',()=>{ netSend({t:'dev',cmd:'lucky',v:2+(luckyN++%3)}); });
$('#tReset').addEventListener('click',e=>{
  const b=e.currentTarget; if(!b.dataset.sure){ b.dataset.sure='1'; b.textContent='Tap again to wipe level, items, coins and quests'; return; }
  delete b.dataset.sure; b.textContent='Reset all progress';
  if(NET.ready) netSend({t:'dev',cmd:'reset'});
  else { const keep=GEAR.startAll; GEAR=newGear(); GEAR.startAll=keep; saveGear(); PL.level=1; PL.exp=0; saveProgress(); toast('Progress reset','good'); }
});
syncStartAll();
