//@ Testing tools in the settings popover (sent to the server as dev commands): set level, the main quest's step, all items, coins, weather, the Sakura Vale, the Hoarfrost Reach, the Greyspine, reset
/* ----- settings: testing tools ----- */
$('#tLevel').value=PL.level;
$('#tSetLv').addEventListener('click',()=>{ const v=clamp(parseInt($('#tLevel').value,10)||1,1,PLAYER_MAX_LV); netSend({t:'dev',cmd:'level',v}); toast('Level set to '+v,'good'); });
// the main quest: jump to a step (offered by its giver; set the level too if the step is gated above yours)
$('#tMq').innerHTML=MQ.map(s=>`<option value="${s.id}">${s.id} · ${s.title} (level ${s.gate})</option>`).join('');
$('#tSetMq').addEventListener('click',()=>netSend({t:'dev',cmd:'mq',v:$('#tMq').value}));
$('#tAll').addEventListener('click',()=>{ netSend({t:'dev',cmd:'giveAll'}); });
function syncStartAll(){ $('#tStartAll').setAttribute('aria-pressed',!!GEAR.startAll); $('#tStartAll').textContent='Start with every item: '+(GEAR.startAll?'on':'off'); }
$('#tStartAll').addEventListener('click',()=>{ GEAR.startAll=!GEAR.startAll; saveGear(); syncStartAll(); netSend({t:'dev',cmd:'startAll',v:GEAR.startAll}); });
$('#tCoins').addEventListener('click',()=>{ netSend({t:'dev',cmd:'coins'}); });
$('#tMats').addEventListener('click',()=>netSend({t:'dev',cmd:'mats'}));
$('#tSkills').addEventListener('click',()=>netSend({t:'dev',cmd:'skills'}));
$('#tProf').addEventListener('click',()=>netSend({t:'dev',cmd:'prof'}));
$('#tRes').addEventListener('click',()=>netSend({t:'dev',cmd:'res'}));
$('#tPots').addEventListener('click',()=>netSend({t:'dev',cmd:'pots'}));
$('#tZt').addEventListener('click',()=>netSend({t:'dev',cmd:'zt'}));
$('#tThree').addEventListener('click',()=>{ netSend({t:'dev',cmd:'three'}); });
$('#tRain').addEventListener('click',()=>netSend({t:'dev',cmd:'weather',v:'rain'}));
$('#tStorm').addEventListener('click',()=>netSend({t:'dev',cmd:'weather',v:'storm'}));
$('#tClear').addEventListener('click',()=>netSend({t:'dev',cmd:'weather',v:'clear'}));
// the vale: open the bridge gate (as if you had helped beat the Rootwarden), jump to its west portal, or seal it again
$('#tVale').addEventListener('click',()=>netSend({t:'dev',cmd:'vale',v:1}));
$('#tTunnel').addEventListener('click',e=>netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}));
$('#tSeal').addEventListener('click',()=>{ netSend({t:'dev',cmd:'vale',v:0}); toast('The vale is sealed again','good'); });
// the Hoarfrost Reach: open the ice wall (as if you had helped beat Akaoni), go to either side of it, to Rimehold or the boss halls (those open it first), seal it again
$('#tNorth').addEventListener('click',()=>netSend({t:'dev',cmd:'north',v:1}));
$('#tPass').addEventListener('click',e=>netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}));
for(const id of ['tRime','tHall','tNest']) $('#'+id).addEventListener('click',e=>{ netSend({t:'dev',cmd:'north',v:2}); netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}); });
// the Greyspine: open the ice fall in the glacier valley (as if you had helped beat Ymrik), go to it, to Highmark's shelf or the Gryphon Queen's peak (those open the way first), seal it again
$('#tWest').addEventListener('click',()=>netSend({t:'dev',cmd:'west',v:1}));
$('#tGlen').addEventListener('click',e=>{ netSend({t:'dev',cmd:'vale',v:2}); netSend({t:'dev',cmd:'north',v:2}); netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}); });
for(const id of ['tGateR','tGateN']) $('#'+id).addEventListener('click',e=>netSend({t:'dev',cmd:'gate',v:e.currentTarget.dataset.v,n:1}));
$('#tSealG').addEventListener('click',()=>{ for(const v of ['river','neck']) netSend({t:'dev',cmd:'gate',v,n:0}); toast('Both rock falls are sealed again','good'); });
for(const id of ['tGrey','tQueen','tCavern','tRiverFall','tNeckFall']) $('#'+id).addEventListener('click',e=>{ netSend({t:'dev',cmd:'vale',v:2}); netSend({t:'dev',cmd:'north',v:2}); netSend({t:'dev',cmd:'west',v:2}); netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}); });   // (they open the way first)
for(const id of ['tFall','tRiver','tWallN','tCoastEast','tCoastVale']) $('#'+id).addEventListener('click',e=>{ netSend({t:'dev',cmd:'vale',v:2}); netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}); });
for(const id of ['tCoastReach','tCoastCape','tCoastGrey']) $('#'+id).addEventListener('click',e=>{ netSend({t:'dev',cmd:'vale',v:2}); netSend({t:'dev',cmd:'north',v:2}); netSend({t:'dev',cmd:'west',v:2}); netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}); });   // (the coasts' review spots; the Reach and the Greyspine open their ways first)   // (the borders' review spots: x,z,facing in degrees; the bridge gate opens first so the teleport is not refused)
$('#tSealW').addEventListener('click',()=>{ netSend({t:'dev',cmd:'west',v:0}); toast('The ice fall is sealed again','good'); });
// the boss arenas (to try each boss's moves): the vale's two open the bridge gate first
for(const id of ['tCircle','tTide']) $('#'+id).addEventListener('click',e=>netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}));
for(const id of ['tGate','tShrine']) $('#'+id).addEventListener('click',e=>{ netSend({t:'dev',cmd:'vale',v:2}); netSend({t:'dev',cmd:'tunnel',v:e.currentTarget.dataset.v}); });
$('#tSealN').addEventListener('click',()=>{ netSend({t:'dev',cmd:'north',v:0}); toast('The ice wall is sealed again','good'); });
let luckyN=0; $('#tLucky').addEventListener('click',()=>{ netSend({t:'dev',cmd:'lucky',v:2+(luckyN++%3)}); });
$('#tReset').addEventListener('click',e=>{
  const b=e.currentTarget; if(!b.dataset.sure){ b.dataset.sure='1'; b.textContent='Tap again to wipe level, items, coins and quests'; return; }
  delete b.dataset.sure; b.textContent='Reset all progress';
  if(NET.ready) netSend({t:'dev',cmd:'reset'});
  else { const keep=GEAR.startAll; GEAR=newGear(); GEAR.startAll=keep; saveGear(); PL.level=1; PL.exp=0; saveProgress(); toast('Progress reset','good'); }
});
syncStartAll();
