//@ Presets panel (the HUD's layers button): ten cards, each a saved setup of skills and equipment with an optional linked outfit slot; wear, save, rename, clear
/* Server rules in server/presets.js. Agent map: renderPresets() (items.js calls it on every `you` update while the panel is open), prWearOutfit(i,of) (net/client.js 'prwear' event).
   The outfit slots live in the browser (character-editor.js wearOutfitSlot); a preset only stores the slot number, -1 = leave the outfit alone. test: tools/presets-smoke.js, client-smoke */
const PRS={name:{}};   // names typed but not yet saved, per card
function prSkillNames(e){
  const out=[]; for(const sl of ['basic','skill','burst']) if(e.sk[sl]&&SKILLS[e.sk[sl]]) out.push(SKILLS[e.sk[sl]].name);
  if(e.cave&&typeof caveSkillDef==='function'&&caveSkillDef(e.cave)) out.push(caveSkillDef(e.cave).name);
  if(e.ult&&typeof ultDef==='function'&&ultDef(e.ult)) out.push(ultDef(e.ult).name);
  const np=(e.pass||[]).filter(Boolean).length; if(np) out.push(np+(np>1?' passives':' passive'));
  return out;
}
// is this card what you are wearing right now?
function prIsNow(e){
  const g=GEAR; if(!g||!e) return false;
  for(const k in g.eq) if(k!=='wpn'&&(g.eq[k]||null)!==(e.eq[k]||null)) return false;
  const S=g.skills||{}, E=(S.eq&&S.eq[e.cls])||{};
  for(const sl of ['basic','skill','burst']) if((E[sl]||null)!==(e.sk[sl]||null)) return false;
  for(let j=0;j<3;j++) if(((S.pass||[])[j]||null)!==((e.pass||[])[j]||null)) return false;
  return (S.ult||null)===(e.ult||null)&&(S.cave||null)===(e.cave||null);
}
function prCard(i,e){
  const card=document.createElement('div'); card.className='pr-card'+(e?'':' empty')+(e&&prIsNow(e)?' now':'');
  const top=document.createElement('div'); top.className='pr-top';
  const no=document.createElement('span'); no.className='pr-no'; no.textContent=String(i+1);
  const nm=document.createElement('input'); nm.className='pr-name'; nm.maxLength=PR_NAME_MAX; nm.placeholder='Preset '+(i+1); nm.setAttribute('aria-label','Name of preset '+(i+1));
  nm.value=PRS.name[i]!==undefined?PRS.name[i]:(e?e.n:''); nm.oninput=()=>{ PRS.name[i]=nm.value; };
  top.append(no,nm); if(e&&prIsNow(e)){ const b=document.createElement('span'); b.className='pr-badge'; b.textContent='Worn'; top.append(b); }
  card.append(top);
  const sum=document.createElement('div'); sum.className='pr-sum';
  if(e){
    const w=ITEM[e.eq.weapon], gear=Object.keys(e.eq).filter(k=>k!=='weapon'&&e.eq[k]).length;
    const line1=document.createElement('div'); line1.className='pr-l1'; line1.textContent=(w?w.name:'No weapon')+(gear?' · '+gear+' gear piece'+(gear>1?'s':''):'');
    const line2=document.createElement('div'); line2.className='pr-l2'; line2.textContent=prSkillNames(e).join(' · ')||'No skills set';
    sum.append(line1,line2);
  } else sum.textContent='Empty: set up your skills and gear, then save here.';
  card.append(sum);
  const ctl=document.createElement('div'); ctl.className='pr-ctl';
  const sel=document.createElement('select'); sel.className='pr-of'; sel.setAttribute('aria-label','Linked outfit for preset '+(i+1)); sel.title='Optional: wear an outfit slot together with this preset';
  const none=document.createElement('option'); none.value='-1'; none.textContent='Outfit: keep current'; sel.append(none);
  const slots=typeof outfitSlots==='function'?outfitSlots():[];
  for(let k=0;k<PR_OUTFITS;k++){ const o=document.createElement('option'); o.value=String(k); o.textContent='Outfit '+(k+1)+(slots[k]?'':' (empty)'); if(e&&e.of===k) o.selected=true; sel.append(o); }
  ctl.append(sel);
  const wear=document.createElement('button'); wear.className='pr-btn pr-wear'; wear.textContent='Wear'; wear.disabled=!e; wear.onclick=()=>{ netSend({t:'prwear',i}); UI_SFX.click(); };
  const save=document.createElement('button'); save.className='pr-btn'; save.textContent=e?'Overwrite':'Save here';
  save.onclick=()=>{ netSend({t:'prsave',i,n:nm.value,of:+sel.value}); delete PRS.name[i]; UI_SFX.click(); };
  const clr=document.createElement('button'); clr.className='pr-btn pr-clr'; clr.textContent='✕'; clr.title='Clear preset '+(i+1); clr.setAttribute('aria-label',clr.title); clr.disabled=!e;
  clr.onclick=()=>{ if(clr.dataset.sure){ netSend({t:'prclear',i}); delete PRS.name[i]; UI_SFX.click(); return; }   // like abandoning a quest: the second tap clears, so a mis-tap cannot lose a saved preset
    clr.dataset.sure='1'; clr.textContent='Tap again'; setTimeout(()=>{ if(clr.isConnected){ delete clr.dataset.sure; clr.textContent='✕'; } },2500); };
  ctl.append(wear,save,clr); card.append(ctl);
  return card;
}
function renderPresets(){
  const body=$('#prBody'); if(!body||$('#presets').hidden) return;
  if(body.contains(document.activeElement)&&document.activeElement.tagName==='INPUT') return;   // not while a name is being typed
  const keep=body.scrollTop, L=(GEAR&&GEAR.pre)||[];
  const note=document.createElement('p'); note.className='pr-note'; note.textContent='Each preset keeps your 8 skills and equipment. Wear one anywhere, except in a boss fight, raid, dungeon or on the Proving Isle. An outfit link is optional: with none, your outfit stays as it is.';
  const grid=document.createElement('div'); grid.className='pr-grid';
  for(let i=0;i<PR_COUNT;i++) grid.append(prCard(i,L[i]||null));
  body.replaceChildren(note,grid); body.scrollTop=keep;
}
function openPresets(){ if(!started||customizing) return; if(!$('#presets').hidden){ closePanels(); return; } openPanel('presets'); renderPresets(); }
$('#bPre').addEventListener('click',e=>{ openPresets(); e.currentTarget.blur(); });
function prWearOutfit(i,of){ if(of>=0&&typeof outfitSlots==='function'&&outfitSlots()[of]) wearOutfitSlot(of); }
