//@ Presets row of the skills panel: ten saved setups (skills, soul, equipment, an optional linked outfit slot) to save, wear, rename and clear
/* Server rules in server/presets.js. Agent map: prPanelHtml() / prBindPanel(on) (economy/skills.js renderSkills), prWearOutfit(i,of) (net/client.js 'prwear' event).
   The outfit slots live in the browser (character-editor.js wearOutfitSlot); a preset only stores the slot number, -1 = leave the outfit alone. test: tools/presets-smoke.js */
const PRS={sel:0};
function prPanelHtml(){
  const L=(GEAR&&GEAR.pre)||[], i=PRS.sel, e=L[i]||null;
  let h=`<details class="sk-presets"${PRS.open?' open':''}><summary>Presets</summary><div class="chips">`;
  for(let k=0;k<PR_COUNT;k++) h+=`<button class="chip" data-prsel="${k}" aria-pressed="${k===i}" title="${L[k]?'':'Empty'}">${k+1}${L[k]?' ●':''}</button>`;
  h+=`</div><div class="sk-pr-row"><input id="prName" maxlength="${PR_NAME_MAX}" placeholder="Preset ${i+1}" aria-label="Preset name">`;
  h+=`<select id="prOutfit" aria-label="Linked outfit"><option value="-1">Outfit: unchanged</option>`;
  for(let k=0;k<PR_OUTFITS;k++) h+=`<option value="${k}"${e&&e.of===k?' selected':''}>Outfit ${k+1}</option>`;
  h+=`</select></div><div class="sk-pr-row"><button class="btn" data-prwear${e?'':' disabled'}>Wear</button><button class="btn" data-prsave>Save current here</button><button class="btn" data-prclear${e?'':' disabled'}>Clear</button></div>`;
  h+=`<p class="muted sk-note">Saves the 8 skills, your soul and your equipment. Not usable in boss fights, raids, dungeons or on the Proving Isle.</p></details>`;
  return h;
}
function prBindPanel(on){
  { const e=((GEAR&&GEAR.pre)||[])[PRS.sel]; const nm=$('#prName'); if(nm&&e) nm.value=e.n; const w=$('#skBody').querySelector('[data-prwear]'); if(w&&e) w.textContent='Wear '+e.n; }   // (names go in as text, never as markup)
  const d=$('#skBody').querySelector('.sk-presets'); if(d) d.ontoggle=()=>{ PRS.open=d.open; };
  on('[data-prsel]',b=>{ PRS.sel=+b.dataset.prsel; PRS.open=true; UI_SFX.click(); renderSkills(); });
  on('[data-prwear]',()=>{ netSend({t:'prwear',i:PRS.sel}); UI_SFX.click(); });
  on('[data-prsave]',()=>{ const n=$('#prName').value, of=+$('#prOutfit').value; netSend({t:'prsave',i:PRS.sel,n,of}); UI_SFX.click(); });
  on('[data-prclear]',()=>{ netSend({t:'prclear',i:PRS.sel}); UI_SFX.click(); });
}
function prWearOutfit(i,of){ if(of>=0&&typeof outfitSlots==='function'&&outfitSlots()[of]) wearOutfitSlot(of); }
