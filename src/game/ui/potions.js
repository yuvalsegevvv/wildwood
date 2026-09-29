//@ Potions on the client: the potion belt above the action bar (healing, might and guard, with counts, keys, cooldowns and the running buff), drinking with the keys, and the potion icons
/* The belt shows a button for each kind of potion you carry, or have running. A press sends potion{k}; the server drinks the strongest one you own,
   and answers with a pot event [pid, kind, tier, seconds] that starts the kind's cooldown here and, for might and guard, the buff timer.
   The keys are the rebindable actions pot1 / pot2 / pot3 (player/keybinds.js). */
const POT_ST={cd:{},cdMax:{},until:{}};   // per kind: the time (t) its cooldown ends / its buff ends
function potIcon(kind,tier){
  const c=POT_KINDS[kind].col, big=1+tier*0.06;
  return `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><g transform="translate(16 17) scale(${big}) translate(-16 -17)"><path d="M13 5h6v4l4 6c2.4 3.6 0 12-7 12s-9.4-8.4-7-12l4-6z" fill="rgba(210,230,240,.35)" stroke="#15120e" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M9.2 18.5c1.3-.8 2.6.8 3.9.2s2.6-.9 3.9-.2 2.7 1 4 .2c.6 4-1.4 8-6.8 8s-7.4-4-5-8.2z" fill="${c}"/><rect x="12.4" y="3.2" width="7.2" height="3.2" rx="1" fill="#8a6a44" stroke="#15120e" stroke-width="1"/>
    <circle cx="13" cy="21" r="1" fill="#fff" opacity=".55"/>${tier>=1?'<circle cx="19.5" cy="23" r=".8" fill="#fff" opacity=".5"/>':''}${tier>=2?'<path d="M25 5l.8 1.9 1.9.8-1.9.8L25 10.4l-.8-1.9-1.9-.8 1.9-.8z" fill="#ffe27a"/>':''}</g></svg>`;
}
const potBar=$('#potbar');
function potBarBuild(){
  potBar.innerHTML=POT_KIND_IDS.map(k=>`<button class="pb" data-pot="${k}" data-silent="1" style="--pc:${POT_KINDS[k].col}"><span class="pi"></span><span class="pn"></span><span class="pk"></span><span class="pt"></span></button>`).join('');
  potBar.querySelectorAll('.pb').forEach(b=>{ const go=()=>drinkPotion(b.dataset.pot); b.addEventListener('touchstart',e=>{ e.preventDefault(); go(); },{passive:false}); b.addEventListener('click',go); });
}
potBarBuild();
function potStrongest(kind){ const P=potionToDrink((GEAR&&GEAR.pot)||{},kind); return P; }
function potCount(kind){ let n=0; for(let t=0;t<3;t++) n+=((GEAR&&GEAR.pot)||{})[kind+(t+1)]||0; return n; }
function drinkPotion(kind){
  if(!started||customizing||PL.dead) return;
  if(!potStrongest(kind)){ toast('You have no '+POT_KINDS[kind].name,'bad'); UI_SFX.error(); return; }
  if(t<(POT_ST.cd[kind]||0)) return;
  netSend({t:'potion',k:kind});
}
// the server's answer: you drank a potion of this kind
function onPotionEvent(kind,tier,secs){
  POT_ST.cd[kind]=t+POT_KINDS[kind].cd; POT_ST.cdMax[kind]=POT_KINDS[kind].cd;
  if(secs) POT_ST.until[kind]=t+secs;
  UI_SFX.success();
  for(let k=0;k<10;k++){ const m=new THREE.Mesh(emberGeo,emberMat); m.position.set(P.x+AR(-0.5,0.5),P.y+AR(0.2,1.8),P.z+AR(-0.5,0.5)); scene.add(m); CB.fx.push({mesh:m,life:0.7,max:0.7,shrink:true}); }
  toast(kind==='heal'?'You feel better':kind==='might'?'Might: more damage for '+secs+' s':'Guard: less damage taken for '+secs+' s','good');
  updatePotBar(true);
}
let potSig='';
// every frame: which buttons show, their counts, the cooldown sweep and the buff timer (the DOM is touched only when something changed)
function updatePotBar(force){
  if(!potBar) return;
  const kinds=POT_KIND_IDS.filter(k=>potCount(k)>0||(POT_ST.until[k]||0)>t);
  const sig=kinds.join()+'|'+POT_KIND_IDS.map(k=>potCount(k)+':'+((POT_ST.until[k]||0)>t?Math.ceil(POT_ST.until[k]-t):0)+':'+((POT_ST.cd[k]||0)>t?1:0)).join()+'|'+started;
  potBar.hidden=!started||!kinds.length; if(!started||(!force&&sig===potSig&&!kinds.some(k=>(POT_ST.cd[k]||0)>t))) return;
  potSig=sig;
  potBar.querySelectorAll('.pb').forEach(b=>{
    const k=b.dataset.pot, on=kinds.includes(k), cd=(POT_ST.cd[k]||0)-t, left=(POT_ST.until[k]||0)-t, P=potStrongest(k)||POTS[k+'1'];
    b.hidden=!on; if(!on) return;
    b.querySelector('.pi').innerHTML=potIcon(k,P.tier); b.querySelector('.pn').textContent=potCount(k);
    b.querySelector('.pk').textContent=kbName(POT_KINDS[k].key)||''; b.querySelector('.pt').textContent=left>0?Math.ceil(left)+'s':'';
    b.classList.toggle('active',left>0); b.style.setProperty('--p',cd>0?Math.min(1,cd/(POT_ST.cdMax[k]||1)):0);
    b.setAttribute('aria-label',POTS[P.id].name+', '+potCount(k)+' left ('+(kbName(POT_KINDS[k].key)||'no key')+')');
  });
}
addEventListener('keydown',e=>{
  if(!started||uiOpen()||e.repeat) return;
  for(const k of POT_KIND_IDS) if(kbIs(e.code,POT_KINDS[k].key)) drinkPotion(k);
});
