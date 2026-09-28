//@ Skills panel: each class's loadout in three slots (basic, skill, burst) and Aldric's lessons (learn, equip, take off)
/* Open it with K, the Skills button in the inventory, the empty skill button, or by talking to Aldric at the well.
   Only Aldric sells skills; anywhere else the panel shows where to learn them. Loadouts are kept per class. */
let skTab=null;
function openSkills(n){ openPanel('skills',n||null); skTab=clsOf(); renderSkills(); }
function toggleSkills(){ if(!started||customizing) return; if($('#skills').hidden) openSkills(); else closePanels(); }
const skIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`;
const SLOT_TITLE={basic:'1 · Basic attack',skill:'2 · Skill',burst:'3 · Burst'};
function renderSkills(){
  if($('#skills').hidden) return;
  const trainer=!!(panelNPC&&panelNPC.def.role==='trainer'), S=GEAR.skills||newSkills(), cls=skTab||clsOf(), C=CLASSES[cls], lv=PL.level;
  $('#skTitle').textContent=trainer?"Aldric's lessons":'Skills'; $('#skCoins').textContent=GEAR.coins+' coins';
  let h=`<div class="chips pn-tabs">${Object.keys(CLASSES).map(c=>`<button class="chip" data-sktab="${c}" aria-pressed="${c===cls}">${CLASSES[c].name}${c===clsOf()?' (you)':''}</button>`).join('')}</div>`;
  // the loadout: what is in each slot right now
  h+='<div class="sk-load">'+SLOTS.map(slot=>{
    const a=abilityOf(cls,slot,S,lv), locked=lv<slotLv(slot);
    return `<div class="sk-slot${a?' on':''}${locked?' locked':''}"><span class="sk-n">${SLOT_TITLE[slot]}</span>${skIcon(a?a.name:locked?'lock':'plus')}<b>${a?a.name:locked?'Opens at level '+slotLv(slot):'Empty'}</b><small>${a?'Cooldown '+a.cd+' s':locked?'':'Equip one below'}</small></div>`;
  }).join('')+'</div>';
  for(const slot of SLOTS){
    const ids=SKILL_IDS.filter(id=>SKILLS[id].cls===cls&&SKILLS[id].slot===slot);
    h+=`<div class="inv-h">${SLOT_TITLE[slot]}${slot!=='basic'&&lv<slotLv(slot)?' <span>opens at level '+slotLv(slot)+'</span>':''}${slot==='basic'&&!canSwap(cls,'basic')?' <span>only mages can change theirs</span>':''}</div>`;
    for(const id of ids){
      const s=SKILLS[id], own=S.owned.includes(id), cur=abilityOf(cls,slot,S,lv), on=cur&&cur.id===id, need=Math.max(slotLv(slot),s.lv), low=lv<need;
      let btn;
      if(on) btn=`<span class="tag on">Equipped</span>`+(slot!=='basic'?`<button class="chip" data-unskill="${cls}|${slot}">Take off</button>`:'');
      else if(own) btn=`<button class="chip" data-eqskill="${id}" ${low?'disabled':''}>${low?'Level '+need:'Equip'}</button>`;
      else if(trainer) btn=`<button class="chip buy" data-buyskill="${id}" ${GEAR.coins<s.price||lv<s.lv?'disabled':''}>${lv<s.lv?'Level '+s.lv:'Learn: '+s.price+' coins'}</button>`;
      else btn=`<span class="muted sk-where">Aldric teaches it at the well: ${s.price} coins</span>`;
      const dmg=s.buff?'buff':(Math.round(s.mult*100)+'% damage');
      h+=`<div class="sk-card${on?' on':''}${own?'':' unowned'}${slot==='burst'?' burst':''}">${skIcon(s.name)}<div class="sk-main"><b>${s.name}</b><span class="sk-meta">${s.price?'':'Free &middot; '}Level ${need} &middot; ${s.cd} s cooldown &middot; ${dmg}</span><span>${s.desc}</span></div><div class="sk-btn">${btn}</div></div>`;
    }
  }
  if(cls!==clsOf()) h+=`<p class="muted">You fight as a ${CLASSES[clsOf()].name} right now (your weapon decides). This ${C.name} loadout is used whenever you hold a ${WEAPON_OF[cls]}.</p>`;
  $('#skBody').innerHTML=h;
  const on=(sel,fn)=>$('#skBody').querySelectorAll(sel).forEach(b=>b.onclick=()=>fn(b));
  on('[data-sktab]',b=>{ skTab=b.dataset.sktab; UI_SFX.click(); renderSkills(); });
  on('[data-eqskill]',b=>{ netSend({t:'eqskill',id:b.dataset.eqskill}); UI_SFX.pickup(); });
  on('[data-unskill]',b=>{ const [c,sl]=b.dataset.unskill.split('|'); netSend({t:'unskill',cls:c,slot:sl}); UI_SFX.click(); });
  on('[data-buyskill]',b=>{ b.disabled=true; netSend({t:'buyskill',id:b.dataset.buyskill}); });
}
