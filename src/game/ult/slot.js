//@ The set burst, client side of the 5th slot: the action-bar tile and its cooldown, casting it, the boost glow, the skills panel's Burst row and tab (equip / take off), the server's ult, ubo and ultget messages
/* Agent map. Rules: docs/ULT.md; registry: shared/ult.js; server: server/ult.js; test: client-smoke (and tools/ult-smoke.js for the rules). The popup of a cast: game/ult/popup.js.
   ULT_UI = {sel (the burst selected in the panel), cdTotal (the cooldown the server last said, for the ring), boost ({piece id: ms it ends})}. Events: ult [pid, setId, cd] (own cast: cooldown + popup), ubo [pid, ids, secs] (the boosted pieces light up),
   ultget [pid, setId] (a toast, and the picture is made ready); message ubo {ids} when a boost ends. The tile #abUlt: below level 35 a lock, owned but not worn "Burst", worn: its name; key KB_ACTIONS 'ult' (5).
   Exports: ultOwnedIds, ultAbilityNow, ultFillTile, ultHudUpdate, ultBarKey, ultDoAttack, ultSlotHtml, ultGridHtml, ultInfoHtml, ultBindPanel. Hooks into other files are marked `// ult:`. */
var ULT_UI={sel:null,cdTotal:60,boost:{}};
function ultOwnedIds(){ return GEAR&&GEAR.skills?Object.keys(ULT_SKILLS).filter(id=>ultOwned(GEAR.skills,GEAR.cave,id)):[]; }   // (functions, not consts: setActionBar calls them at load, before this file runs)
function ultAbilityNow(){   // the burst you can cast right now (worn, owned, slot open, not on the island), else null
  if(!GEAR||!GEAR.skills||PL.level<ULT_LV||(PVC&&PVC.on)) return null;
  const id=GEAR.skills.ult; return ultDef(id)&&ultOwned(GEAR.skills,GEAR.cave,id)?ultDef(id):null;
}
function ultFillTile(){
  const el=$('#abUlt'); if(!el||!GEAR) return;
  const locked=PL.level<ULT_LV, a=ultAbilityNow(), owned=ultOwnedIds().length>0;
  el.querySelector('svg').innerHTML=(a&&ssGlyph(a))||ICONS[locked?'lock':owned?'burst':'plus']||ICONS.burst;
  el.classList.toggle('has-set',!!(a&&ssTint(a))); el.style.setProperty('--set',a&&ssTint(a)||'transparent');
  el.querySelector('.nm').textContent=a?a.name:locked?'Lv '+ULT_LV:'Burst';
  el.classList.toggle('empty',!a);
  const ae=a?elOf(a):'basic'; el.classList.toggle('has-el',ae!=='basic'); el.style.setProperty('--el',ELEMS[ae].col);
  el.setAttribute('aria-label',a?a.name+' (set burst, '+kbName('ult')+')':locked?'Burst slot, opens at level '+ULT_LV:owned?'Burst slot: choose a burst':'Burst slot: earned from skill sets');
  el.querySelector('.key').textContent=kbName('ult');
  if(a) ultWarm();   // the popup's portrait, ready before the first cast
}
function ultHudUpdate(){
  const el=$('#abUlt'); if(!el) return;
  const a=ultAbilityNow(); el.style.setProperty('--p',a?Math.min(1,CB.cd.ult/Math.max(1,ULT_UI.cdTotal)):0);
  el.classList.toggle('ready',!!a&&CB.cd.ult<=0);
  const t=performance.now(), L=pvSkills(), PV=pvLevel(), c=clsOf(), cv=caveAbilityNow();   // the boosted pieces' tiles pulse with the burst's colour
  for(const [b,ab] of [['#abBasic',abilityOf(c,'basic',L,PV)],['#abSkill',abilityOf(c,'skill',L,PV)],['#abBurst',abilityOf(c,'burst',L,PV)],['#abCave',cv]]){ const e=$(b); if(e) e.classList.toggle('ultb',!!ab&&ULT_UI.boost[ab.id]>t); }
}
function ultBarKey(){ return '|u'+(GEAR&&GEAR.skills?(ultAbilityNow()||{}).id:'')+(GEAR?ultOwnedIds().length:0)+Math.min(PL.level,ULT_LV); }
function ultDoAttack(){
  if(!started||!NET.ready||uiOpen()||PL.dead||CB.act||CB.cd.ult>0) return;
  if(PVC.on){ toast('No bursts on the Proving Isle','bad'); UI_SFX.error(); return; }
  if(PL.level<ULT_LV){ toast('Your burst slot opens at level '+ULT_LV,'bad'); UI_SFX.error(); return; }
  const ab=ultAbilityNow();
  if(!ab){ if(ultOwnedIds().length) openSkills(null,'ult'); else toast('Bursts are earned from skill sets: own 3 of a set\'s 7 pieces','bad'); UI_SFX.error(); return; }
  const tgtOK=CB.target&&!CB.target.dead&&Math.hypot(CB.target.x-P.x,CB.target.z-P.z)<=ab.range+3;
  if(!tgtOK){ const t2=pickTarget(Math.max(ab.range+2,8)); if(t2) CB.target=t2; }
  const [k,dur,hitAt]=ab.act;
  CB.act={kind:ANIM_OF[k]||k,sk:k,t:0,dur,hitAt,done:false,skill:true};
  CB.cd.ult=ULT_UI.cdTotal=ultCdOf(ab.set,false);   // (the server's ult event corrects it: a grind set inside a boss fight waits 60 s)
  const T=CB.target;
  if(T&&!T.dead&&Math.hypot(T.x-P.x,T.z-P.z)<ab.range+6) P.face=Math.atan2(-(T.x-P.x),-(T.z-P.z)); else P.face=P.yaw;
  const a=aimDir();
  netSend({t:'atk',k:'ult',tg:T&&!T.dead?T.id:null,face:Math.round(P.face*1000)/1000,aim:[a.x,a.y,a.z].map(v=>Math.round(v*1000)/1000)});
  cSfx.charge(true);
}
EVH.ult=e=>{ if(e[1]!==NET.pid) return; CB.cd.ult=ULT_UI.cdTotal=e[3]; ultPopup(e[2]); };   // own cast: the real cooldown, the popup
EVH.ubo=e=>{ if(e[1]!==NET.pid) return; const t=performance.now(); e[2].forEach((id,i)=>{ ULT_UI.boost[id]=t+e[3][i]*1000; }); };
NETH.ubo=msg=>{ for(const id in ULT_UI.boost) if(!msg.ids.includes(id)) delete ULT_UI.boost[id]; };   // a boost ended: only the ones the server still lists stay
EVH.ultget=e=>{ if(e[1]!==NET.pid) return; ultWarm(); UI_SFX.click(); };   // (the server also sent a toast)
/* ---- the skills panel: the Burst row under the slots and the Burst tab ---- */
function ultPieceName(setId,piece){
  const S=SS_SETS[setId]; if(!S) return piece;
  if(piece==='cave'){ const c=CAVE_SKILL_IDS.map(i=>CAVE_SKILLS[i]).find(q=>q.set===setId); return c?c.name:'Cave skill'; }
  const n=+piece[1], P=S.pos[n]; return piece[0]==='a'?SKILLS[P.ids[0]].name:PASSIVES[P.passive].name;
}
const ULT_MOD_TXT={mult:v=>'damage x'+v,util:v=>'heals, shields and buffs x'+v,cd:v=>'cooldown x'+v,n:v=>'+'+v+' shots or hits',size:v=>'areas x'+v,v:v=>'value x'+v,eff:v=>'effect x'+v,icd:v=>'triggers '+Math.round(1/v*10)/10+'x as often'};
const ultModText=m=>Object.keys(m).map(k=>k==='cdr'?'takes '+Object.keys(m.cdr).map(s=>m.cdr[s]+' s off '+(s==='burst'?'Power':'skill')+' cooldown').join(' and '):ULT_MOD_TXT[k](m[k])).join(', ');
// a burst tile built like skTile (economy/skills.js): the element's border and dot, the set's emblem, a "5" corner mark; data-ult + data-from make it draggable (skDown)
function ultTile(a,from,cls,lbl){
  const el=a.el&&a.el!=='basic'&&ELEMS[a.el]?a.el:'basic', t=ssTint(a);
  return `<button class="sk-tile${el!=='basic'?' has-el':''}${t?' has-set':''}${cls}" data-ult="${a.set}" data-from="${from}" style="--el:${el==='basic'?'transparent':ELEMS[el].col}${t?';--set:'+t:''}" aria-label="${a.name}"><svg ${SS_ICON_ATTR}>${ssGlyph(a)||''}</svg>${el!=='basic'?'<i class="el-dot"></i>':''}<span class="lv">${lbl}</span></button>`;
}
// a burst tile dropped (economy/skills.js skDrop): grid -> the 5th slot wears it; slot -> off it takes it off; anything refused says why
function ultDrop(src,tg){
  const s=ultDef(src.id); if(!s||!tg) return;
  if(src.from==='grid'){
    if(!tg.ult){ if(tg.slot||tg.idx!==undefined||tg.cave){ toast(s.name+' is a burst: it goes in slot 5','bad'); UI_SFX.error(); } return; }
    if(!GEAR||!GEAR.skills||!ultOwned(GEAR.skills,GEAR.cave,s.set)){ toast(s.name+' is not yours yet: own '+ULT_OWN_N+' of its set\'s 7 pieces','bad'); UI_SFX.error(); return; }
    if(PL.level<ULT_LV){ toast('The burst slot opens at level '+ULT_LV,'bad'); UI_SFX.error(); return; }
    netSend({t:'ultequip',id:s.set}); UI_SFX.click();
  } else if(tg.area){ netSend({t:'ultequip',id:null}); UI_SFX.click(); }
}
function ultSlotHtml(C){
  const locked=C.lv<ULT_LV, a=GEAR&&GEAR.skills&&ultDef(GEAR.skills.ult), on=a&&ultOwned(GEAR.skills,GEAR.cave,a.set)&&!locked, owned=ultOwnedIds().length>0;
  const tile=on?ultTile(a,'slot:ult','','Burst'):`<div class="sk-tile empty">${skIcon(locked?'lock':'plus')}</div>`;
  return `<div class="sk-slot ult${on?' on':''}${locked?' locked':''}" data-ultslot="1"><span class="sk-n">5 · Burst</span>${tile}<b>${on?a.name:locked?'Opens at level '+ULT_LV:owned?'Empty':'Earn one'}</b><small>${on?(SS_SETS[a.set].role.main==='grind'?'30 s (60 s in a boss fight)':'60 s'):''}</small></div>`;
}
function ultGridHtml(){
  const ids=Object.keys(ULT_SKILLS); if(!ids.length) return '<p class="muted sk-note">No bursts exist yet.</p>';
  return ids.map(id=>{ const s=ULT_SKILLS[id], own=GEAR&&GEAR.skills&&ultOwned(GEAR.skills,GEAR.cave,id), n=GEAR&&GEAR.skills?ultPieceCount(GEAR.skills,GEAR.cave,id):0;
    return `<div class="sk-cell">${ultTile(s,'grid',(own?'':' unowned')+(ULT_UI.sel===id?' sel':''),own?'Burst':n+'/'+ULT_OWN_N)}<span class="nm">${s.name}</span></div>`; }).join('');
}
function ultInfoHtml(){
  const s=ultDef(ULT_UI.sel);
  if(!s) return `<p class="muted">${isTouch?'Tap':'Click'} a burst for details. Each skill set has one: it is yours when you own ${ULT_OWN_N} of the set's 7 pieces (its 6 skills and passives, and its cave skill). It deals damage, stuns everything it hits for ${ULT_STUN} s (bosses too, once per enemy every ${ULT_STUN_LOCK} s) and strengthens two of the set's pieces while you wear them.</p>`;
  const S=SS_SETS[s.set], own=ultOwned(GEAR.skills,GEAR.cave,s.set), worn=GEAR.skills.ult===s.set, low=PL.level<ULT_LV, n=ultPieceCount(GEAR.skills,GEAR.cave,s.set);
  const act=own?(worn?`<button class="chip" data-ultoff="1">Take off</button>`:`<button class="chip" data-ulton="${s.set}" ${low?'disabled':''}>${low?'Level '+ULT_LV:'Equip'}</button>`):`<span class="muted">Own ${ULT_OWN_N} of ${S.char.name}'s 7 pieces (${n} now)</span>`;
  const cd=S.role.main==='grind'?ULT_CD_GRIND+' s ('+ULT_CD+' s in a boss fight)':ULT_CD+' s';
  const boosts=s.boost.map(b=>`<li><b>${ultPieceName(s.set,b.piece)}</b> for ${b.secs} s: ${ultModText(b.mod)}</li>`).join('');
  return `<div class="sk-ii"><div class="sk-ii-h"><div class="sk-ico has-set" style="--set:${ssTint(s)}"><svg ${SS_ICON_ATTR}>${ssGlyph(s)||''}</svg></div><div class="sk-ii-main"><b>${s.name}</b><div class="sk-tags"><span class="sk-tag">Burst · ${S.name} (${S.char.name}'s set)</span></div></div></div>
    <p>${s.desc}</p><p class="muted">${cd} cooldown (nothing shortens it) · ${Math.round(s.mult*100)}% damage · ${ULT_STUN} s stun on everything it hits, bosses too (the same enemy cannot be stunned by a burst again for ${ULT_STUN_LOCK} s)</p>
    <p class="muted">Strengthens, while you wear it:</p><ul class="sk-boost">${boosts}</ul><p class="muted">You can cast it without the set, but then it strengthens nothing.</p><div class="sk-acts">${act}</div></div>`;
}
function ultBindPanel(on){   // on(selector, fn) of renderSkills
  on('[data-ultslot]',()=>{ skKind='ult'; SK.sel=null; UI_SFX.click(); renderSkills(); });
  on('[data-ult]',b=>{ if(SKD.just) return; ULT_UI.sel=b.dataset.ult; UI_SFX.click(); skKind='ult'; renderSkills(); });
  on('[data-ulton]',b=>{ netSend({t:'ultequip',id:b.dataset.ulton}); UI_SFX.click(); });
  on('[data-ultoff]',()=>{ netSend({t:'ultequip',id:null}); UI_SFX.click(); });
}
