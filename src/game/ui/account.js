//@ Account code in settings: show / copy it, or continue with a code from another device
/* Only shown when connected to a server that keeps saves (the Node server). */
const acctIn=$('#acctCode');
$('#acctShow').addEventListener('click',e=>{ const on=e.currentTarget.textContent==='Show'; acctIn.value=on?accountCode():'••••••••••••••••'; e.currentTarget.textContent=on?'Hide':'Show'; });
$('#acctCopy').addEventListener('click',()=>{ const c=accountCode(); const done=()=>toast('Account code copied. Keep it private.','good');
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(done,()=>{ acctIn.value=c; acctIn.select(); toast('Select the code and copy it',''); });
  else { acctIn.value=c; acctIn.select(); toast('Select the code and copy it',''); } });
$('#acctGo').addEventListener('click',()=>{
  const v=$('#acctUse').value.trim().toLowerCase();
  if(!/^[a-f0-9]{32}$/.test(v)){ toast('That does not look like an account code (32 letters and numbers)','bad'); return; }
  if(v===accountCode()){ toast('That is already your code',''); return; }
  try{ localStorage.setItem('wildwood-account',v); }catch(_){}
  toast('Switching account…','good'); setTimeout(()=>location.reload(),600);
});
$('#kickedBtn').addEventListener('click',()=>location.reload());
