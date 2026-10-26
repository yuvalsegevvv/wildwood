//@ The Deep Cave, client side of the 4th slot: the action-bar tile and its charge bar, casting it, the skills panel's cave row and tab (equip / take off), the server's charge message
/* Agent map. Rules and plan: docs/CAVE.md; shared constants and the registry: shared/cave.js; the server: server/cave.js; test: tools/cave-smoke.js (and client-smoke for the page).
   CAVE_UI = {charge (0-100, the server's last word; a cast subtracts its cost at once and the server corrects), sel (the cave skill selected in the panel)}. The server sends {t:'cave',c} (NETH.cave).
   The tile #abCave: below level 23 a lock; from 23 with no cave skill owned it says "Go to the cave"; owned but not worn "Cave"; worn: its name, ready (glow) when charge >= cost. The key is KB_ACTIONS 'cave' (4).
   Exports: caveOwnedIds, caveAbilityNow, caveFillTile, caveHudUpdate, caveBarKey, caveDoAttack (doAttack('cave') calls it), caveSlotHtml / caveGridHtml / caveInfoHtml / caveBindPanel (economy/skills.js).
   Hooks into other files are marked `// cave:` (listed in docs/CAVE.md). */
var CAVE_UI={charge:0,sel:null};
const caveIco=s=>{ const g=ssGlyph(s); return g?`<svg ${SS_ICON_ATTR}>${g}</svg>`:skIcon(s.name); };   // a set's cave skill draws its set's emblem (like the set's other pieces), a floor-1 skill its own icon (ICONS, ui/combat-hud.js)
const caveSetAttr=s=>{ const t=ssTint(s); return t?';--set:'+t:''; };   // (var: setActionBar runs at load, before this file)
NETH.cave=msg=>{ CAVE_UI.charge=Math.max(0,Math.min(CAVE_CHARGE_MAX,+msg.c||0)); };
const caveOwnedIds=()=>{ const own=GEAR&&GEAR.cave&&GEAR.cave.own; return own?CAVE_SKILL_IDS.filter(id=>Object.prototype.hasOwnProperty.call(own,id)):[]; };
const caveLevelOf=id=>{ const own=GEAR&&GEAR.cave&&GEAR.cave.own; return own&&Object.prototype.hasOwnProperty.call(own,id)?own[id]:0; };
// the cave skill you can cast right now (worn, owned, slot open), else null
function caveAbilityNow(){
  if(!GEAR||!GEAR.skills||PL.level<CAVE_SLOT_LV) return null;
  const id=GEAR.skills.cave, sk=caveSkillDef(id); return sk&&caveLevelOf(id)?sk:null;
}
function caveFillTile(){
  const el=$('#abCave'); if(!el||!CAVE_UI||!GEAR) return;
  const locked=PL.level<CAVE_SLOT_LV, a=caveAbilityNow(), owned=caveOwnedIds().length>0;
  el.querySelector('svg').innerHTML=(a&&(ssGlyph(a)||ICONS[a.name]))||ICONS[locked?'lock':owned?'burst':'plus']||ICONS.burst;
  el.classList.toggle('has-set',!!(a&&ssTint(a))); el.style.setProperty('--set',a&&ssTint(a)||'transparent');
  el.querySelector('.nm').textContent=a?a.name:locked?'Lv '+CAVE_SLOT_LV:owned?'Charge':'Go to the cave';
  el.classList.toggle('empty',!a);
  const ae=a?elOf(a):'basic'; el.classList.toggle('has-el',ae!=='basic'); el.style.setProperty('--el',ELEMS[ae].col);
  el.style.setProperty('--cost',a?a.cost+'%':'100%');
  el.setAttribute('aria-label',a?a.name+' (charge skill, costs '+a.cost+' charge, '+kbName('cave')+')':locked?'Charge slot, opens at level '+CAVE_SLOT_LV:owned?'Charge slot: choose a charge skill':'Go to the cave: its skills are earned there');
  el.querySelector('.key').textContent=kbName('cave');
}
function caveHudUpdate(){
  const el=$('#abCave'); if(!el||!CAVE_UI) return;
  const a=caveAbilityNow(), c=CAVE_UI.charge;
  el.querySelector('.cv-bar b').style.width=(PL.level<CAVE_SLOT_LV?0:c)+'%';
  el.style.setProperty('--p',a?(CB.cd.cave>0?CB.cd.cave/CAVE_CAST_CD:c>=a.cost?0:1-c/a.cost):0);
  el.classList.toggle('ready',!!a&&c>=a.cost&&CB.cd.cave<=0);
}
const caveBarKey=()=>'|'+(CAVE_UI?(caveAbilityNow()||{}).id:'')+'|'+(GEAR?caveOwnedIds().length:0)+'|'+Math.min(PL.level,CAVE_SLOT_LV);   // the action bar redraws its labels when this changes
function caveDoAttack(){
  if(!started||!NET.ready||uiOpen()||PL.dead||CB.act||CB.cd.cave>0||PVC.on) return;
  if(PL.level<CAVE_SLOT_LV){ toast('Your cave slot opens at level '+CAVE_SLOT_LV,'bad'); UI_SFX.error(); return; }
  const ab=caveAbilityNow();
  if(!ab){ if(caveOwnedIds().length) openSkills(null,'cave'); else toast('Go to the cave: its skills are earned there','bad'); UI_SFX.error(); return; }
  if(CAVE_UI.charge<ab.cost){ toast('Not enough charge ('+Math.floor(CAVE_UI.charge)+' of '+ab.cost+'). Hit enemies to charge it','bad'); UI_SFX.error(); return; }
  CAVE_UI.charge-=ab.cost;
  const tgtOK=CB.target&&!CB.target.dead&&Math.hypot(CB.target.x-P.x,CB.target.z-P.z)<=ab.range+3;
  if(!tgtOK){ const t2=pickTarget(Math.max(ab.range+2,8)); if(t2) CB.target=t2; }
  const [k,dur,hitAt]=ab.act;
  CB.act={kind:ANIM_OF[k]||k,sk:k,t:0,dur,hitAt,done:false,skill:true};
  CB.cd.cave=CAVE_CAST_CD;
  const T=CB.target;
  if(T&&!T.dead&&Math.hypot(T.x-P.x,T.z-P.z)<ab.range+6) P.face=Math.atan2(-(T.x-P.x),-(T.z-P.z)); else P.face=P.yaw;
  const a=aimDir();
  netSend({t:'atk',k:'cave',tg:T&&!T.dead?T.id:null,face:Math.round(P.face*1000)/1000,aim:[a.x,a.y,a.z].map(v=>Math.round(v*1000)/1000)});
  if(ab.fx&&ab.fx.dash) startCharge(T,ab.range,ab.fx.dash.ahead,ab.fx.dash.behind);
  cvv1Wind(ab,P);   // cave: the drawing's wind-up and the press-time memory (cave/vis-floor1.js)
  cSfx.charge(true);
}
/* ---- the skills panel: the cave row under the three slots, and the Cave tab ---- */
function caveSlotHtml(C){
  const locked=C.lv<CAVE_SLOT_LV, a=GEAR&&GEAR.skills&&caveSkillDef(GEAR.skills.cave), on=a&&caveLevelOf(a.id)&&!locked, owned=caveOwnedIds().length>0;
  const tile=on?`<button class="sk-tile${a.el&&a.el!=='basic'?' has-el':''}${ssTint(a)?' has-set':''}" data-cave="${a.id}" data-from="slot:cave" style="--el:${a.el&&a.el!=='basic'?ELEMS[a.el].col:'transparent'}${caveSetAttr(a)}" aria-label="${a.name}">${caveIco(a)}${a.el&&a.el!=='basic'?'<i class="el-dot"></i>':''}<i class="lv">${caveLevelOf(a.id)}</i></button>`:`<div class="sk-tile empty">${skIcon(locked?'lock':'plus')}</div>`;
  return `<div class="sk-slot cave${on?' on':''}${locked?' locked':''}" data-caveslot="1"><span class="sk-n">4 · Charge skill</span>${tile}<b>${on?a.name:locked?'Opens at level '+CAVE_SLOT_LV:owned?'Empty':'Go to the cave'}</b><small>${on?'costs '+a.cost+' charge':locked?'':owned?'Open the Charge tab':'Its skills are earned there'}</small></div>`;
}
function caveGridHtml(){
  if(!CAVE_SKILL_IDS.length) return '<p class="muted sk-note">No charge skills exist yet. They are earned in the Deep Cave.</p>';
  return CAVE_SKILL_IDS.map(id=>{ const s=CAVE_SKILLS[id], L=caveLevelOf(id), el=s.el||'basic';
    return `<div class="sk-cell"><button class="sk-tile${el!=='basic'?' has-el':''}${ssTint(s)?' has-set':''}${L?'':' unowned cv-lock'}${CAVE_UI.sel===id?' sel':''}" data-cave="${id}" data-from="grid" style="--el:${el==='basic'?'transparent':ELEMS[el].col}${caveSetAttr(s)}" aria-label="${s.name}${L?', level '+L:', locked'}"${L?'':` title="${caveWhereText(s)}"`}>${caveIco(s)}${el!=='basic'?'<i class="el-dot"></i>':''}${L?`<i class="lv">${L}</i>`:`<svg class="cv-padlock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">${ICONS.lock}</svg>`}</button><span class="nm">${s.name}</span>${L?'':`<small class="sk-where">${caveMethodDef(s.method).name}</small>`}</div>`; }).join('');
}
function caveInfoHtml(){
  const s=caveSkillDef(CAVE_UI.sel);
  if(!s) return `<p class="muted">${isTouch?'Tap':'Click'} a charge skill for details. The Deep Cave is under the Wildwood; its skills are earned there. A charge skill is fed by charge: every attack that hits adds some, and casting it spends ${CAVE_COST_MIN} to ${CAVE_COST_MAX}.</p>`;
  const L=caveLevelOf(s.id), worn=GEAR.skills.cave===s.id, low=PL.level<CAVE_SLOT_LV;
  const act=L?(worn?`<button class="chip" data-caveoff="1">Take off</button>`:`<button class="chip" data-caveon="${s.id}" ${low?'disabled':''}>${low?'Level '+CAVE_SLOT_LV:'Equip'}</button>`):`<span class="muted">${caveWhereHtml(s)}</span>`;
  const sh=(GEAR.cave&&GEAR.cave.sh)|0, dm=GEAR.cave&&GEAR.cave.m&&GEAR.cave.m[s.floor]|0, dn=CAVE_DROPS[s.floor], nx=L+1;   // cave: C3 levels, Echo Shards and the floor's monster drop
  const up=L&&L<CAVE_LEVEL_MAX?`<div class="sk-up"><button class="chip" data-caveup="${s.id}" ${sh<CAVE_LEVEL_COST[nx]||dm<CAVE_DROP_COST[nx]?'disabled':''}>Level ${nx}: ${CAVE_LEVEL_COST[nx]} Echo Shards + ${CAVE_DROP_COST[nx]} ${dn}</button></div>`:'';
  return `<div class="sk-ii"><div class="sk-ii-h"><div class="sk-ico${ssTint(s)?' has-set':''}" style="${caveSetAttr(s).slice(1)}">${caveIco(s)}</div><div class="sk-ii-main"><b>${s.name}</b><div class="sk-tags"><span class="sk-tag">Any class · Charge skill · floor ${s.floor}${s.set?' · '+SS_SETS[s.set].name+'\'s set':''}</span>${s.el?elChip(s.el):''}</div><span class="sk-meta">${L?'Level '+L+' of '+CAVE_LEVEL_MAX+' &middot; ':''}costs ${s.cost} charge</span></div><div class="sk-ii-btn">${act}</div></div><p class="sk-desc">${s.desc}</p>${L?`<p class="muted">Echo Shards: ${sh}. ${dn}: ${dm} (dropped by floor ${s.floor}'s monsters). Each level adds ${Math.round(CAVE_LEVEL_STEP*100)}% to the effect${L>1?' (now +'+Math.round(CAVE_LEVEL_STEP*100*(L-1))+'%)':''}; the cost stays. Finish a method whose skill you own to earn more.</p>`:''}${up}</div>`;
}
// a cave tile dropped (economy/skills.js skDrop): from the grid onto the 4th slot wears it; off the slot onto the grid takes it off; anything refused says why
function caveDrop(src,tg){
  const s=caveSkillDef(src.id); if(!s||!tg) return;
  if(src.from==='grid'){
    if(!tg.cave){ if(tg.slot||tg.idx!==undefined){ toast(s.name+' is a charge skill: it goes in slot 4','bad'); UI_SFX.error(); } return; }
    if(!caveLevelOf(s.id)){ toast(s.name+' is not yours yet: '+caveWhereText(s),'bad'); UI_SFX.error(); return; }
    if(PL.level<CAVE_SLOT_LV){ toast('The cave slot opens at level '+CAVE_SLOT_LV,'bad'); UI_SFX.error(); return; }
    netSend({t:'cavequip',id:s.id}); UI_SFX.click();
  } else if(tg.area){ netSend({t:'cavequip',id:null}); UI_SFX.click(); }
}
function caveBindPanel(on){   // on(selector, fn) of renderSkills
  on('[data-caveslot]',()=>{ skKind='cave'; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-cave]',b=>{ if(SKD.just) return; CAVE_UI.sel=b.dataset.cave; UI_SFX.click(); renderSkills(); });
  on('[data-caveon]',b=>{ netSend({t:'cavequip',id:b.dataset.caveon}); UI_SFX.click(); });
  on('[data-caveup]',b=>{ netSend({t:'caveup',id:b.dataset.caveup}); UI_SFX.click(); });
  on('[data-caveoff]',()=>{ netSend({t:'cavequip',id:null}); UI_SFX.click(); });
}
