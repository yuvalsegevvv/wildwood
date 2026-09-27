//@ Skills panel: each class's loadout (basic attack, skill, burst) and Aldric's lessons (learn, equip, take off)
/* Open it with K, the Skills button in the inventory, the empty skill button, or by talking to Aldric at the well.
   Only Aldric sells skills; anywhere else the panel shows where to learn them. Loadouts are kept per class. */
let skTab=null;
function openSkills(n){ openPanel('skills',n||null); skTab=clsOf(); renderSkills(); }
function toggleSkills(){ if(!started||customizing) return; if($('#skills').hidden) openSkills(); else closePanels(); }
const skIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`;
function renderSkills(){
  if($('#skills').hidden) return;
  const trainer=!!(panelNPC&&panelNPC.def.role==='trainer'), S=GEAR.skills||newSkills(), cls=skTab||clsOf(), C=CLASSES[cls], lv=PL.level;
  $('#skTitle').textContent=trainer?"Aldric's lessons":'Skills'; $('#skCoins').textContent=GEAR.coins+' coins';
  let h=`<div class="chips pn-tabs">${Object.keys(CLASSES).map(c=>`<button class="chip" data-sktab="${c}" aria-pressed="${c===cls}">${CLASSES[c].name}${c===clsOf()?' (you)':''}</button>`).join('')}</div>`;
  const eq=SKILLS[S.eq[cls]], sLocked=lv<SKILL_SLOT_LV, bLocked=lv<BURST_SLOT_LV;
  h+=`<div class="sk-load">
    <div class="sk-slot"><span class="sk-n">1 &middot; Basic</span>${skIcon(C.basic.name)}<b>${C.basic.name}</b><small>Always ready</small></div>
    <div class="sk-slot${eq&&!sLocked?' on':''}${sLocked?' locked':''}"><span class="sk-n">2 &middot; Skill</span>${skIcon(sLocked?'lock':eq?eq.name:'plus')}<b>${sLocked?'Opens at level '+SKILL_SLOT_LV:eq?eq.name:'Empty'}</b><small>${sLocked?'':eq?'Cooldown '+eq.cd+' s':'Equip one below'}</small></div>
    <div class="sk-slot locked"><span class="sk-n">3 &middot; Burst</span>${skIcon(bLocked?'lock':'burst')}<b>${bLocked?'Opens at level '+BURST_SLOT_LV:'Coming soon'}</b><small>Big finishers, not in the game yet</small></div></div>`;
  h+=`<div class="inv-h">${C.name} skills</div>`;
  for(const id of SKILL_IDS.filter(id=>SKILLS[id].cls===cls)){
    const s=SKILLS[id], own=S.owned.includes(id), on=S.eq[cls]===id, need=Math.max(SKILL_SLOT_LV,s.lv), low=lv<need;
    let btn;
    if(on) btn=`<span class="tag on">Equipped</span><button class="chip" data-unskill="${cls}">Take off</button>`;
    else if(own) btn=`<button class="chip" data-eqskill="${id}" ${low?'disabled':''}>${low?'Level '+need:'Equip'}</button>`;
    else if(trainer) btn=`<button class="chip buy" data-buyskill="${id}" ${GEAR.coins<s.price||lv<s.lv?'disabled':''}>${lv<s.lv?'Level '+s.lv:'Learn: '+s.price+' coins'}</button>`;
    else btn=`<span class="muted sk-where">Aldric teaches it at the well: ${s.price} coins</span>`;
    h+=`<div class="sk-card${on?' on':''}${own?'':' unowned'}">${skIcon(s.name)}<div class="sk-main"><b>${s.name}</b><span class="sk-meta">${s.price?'':'Free &middot; '}Level ${s.lv} &middot; ${s.cd} s cooldown &middot; ${Math.round(s.mult*100)}% damage</span><span>${s.desc}</span></div><div class="sk-btn">${btn}</div></div>`;
  }
  if(cls!==clsOf()) h+=`<p class="muted">You fight as a ${CLASSES[clsOf()].name} right now (your weapon decides). This ${C.name} loadout is used whenever you hold a ${WEAPON_OF[cls]}.</p>`;
  $('#skBody').innerHTML=h;
  const on=(sel,fn)=>$('#skBody').querySelectorAll(sel).forEach(b=>b.onclick=()=>fn(b));
  on('[data-sktab]',b=>{ skTab=b.dataset.sktab; UI_SFX.click(); renderSkills(); });
  on('[data-eqskill]',b=>{ netSend({t:'eqskill',id:b.dataset.eqskill}); UI_SFX.pickup(); });
  on('[data-unskill]',b=>{ netSend({t:'unskill',cls:b.dataset.unskill}); UI_SFX.click(); });
  on('[data-buyskill]',b=>{ b.disabled=true; netSend({t:'buyskill',id:b.dataset.buyskill}); });
}
