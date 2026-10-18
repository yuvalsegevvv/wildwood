//@ The "Register to continue" popup a guest sees at the online server's limits (level 20, the first three lands, zone tiers)
/* Agent map: the server sends event 'guest' with a reason ('level' | 'travel' | 'tier'), see isGuestP / guestGateP in server/accounts.js; applyEvent calls guestGateShow.
   The button opens Settings at the account box. Test: client-smoke. */
const GUEST_WHY={level:'Guests can reach level 20. Register to keep levelling and to keep your progress under a name.',
  travel:'Guests can explore the home forest, the Sakura Vale and the Hoarfrost Reach. Register to travel further.',
  tier:'Guests cannot raise a zone\'s difficulty. Register to unlock zone tiers.'};
function guestGateShow(why){
  if(!$('#guestGate').hidden) return;
  $('#ggText').textContent=GUEST_WHY[why]||GUEST_WHY.level; $('#guestGate').hidden=false;
  if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock();
}
$('#ggLater').addEventListener('click',()=>{ $('#guestGate').hidden=true; });
$('#ggReg').addEventListener('click',()=>{ $('#guestGate').hidden=true; const s=$('#sound'); s.hidden=false; renderSound(); syncAcctSec(); const r=$('#regUser'); if(r) r.scrollIntoView({block:'center'}); });
