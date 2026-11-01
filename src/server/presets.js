//@ Loadout presets (server): save the eight skills, the soul and the equipment of the worn class into one of ten slots, wear one instantly anywhere outside a boss fight, raid, the Proving Isle or a dungeon
/* gear.pre: see shared/presets.js. Wearing re-checks everything against what the hiker owns now (an item sold, a skill no longer owned is skipped, never trusted).
   Messages prsave / prwear / prclear (MSG). Hooks: sanitizeGear (players.js) calls prSanitize. test: tools/presets-smoke.js */
function prSanitize(g){
  const out=[]; for(let i=0;i<PR_COUNT;i++){
    const e=Array.isArray(g)?g[i]:null; if(!e||typeof e!=='object'){ out.push(null); continue; }
    const eq={}; if(e.eq&&typeof e.eq==='object') for(const k in e.eq){ const id=e.eq[k]; if(typeof id==='string'&&Object.prototype.hasOwnProperty.call(ITEM,id)&&k in newGearFor('warrior').eq) eq[k]=id; }
    const cls=CLASSES[e.cls]?e.cls:'warrior', sk={}; for(const sl of SLOTS) if(e.sk&&typeof e.sk[sl]==='string'&&SKILLS[e.sk[sl]]) sk[sl]=e.sk[sl];
    const pass=[null,null,null]; if(Array.isArray(e.pass)) for(let j=0;j<PASSIVE_SLOTS;j++) if(typeof e.pass[j]==='string'&&PASSIVES[e.pass[j]]) pass[j]=e.pass[j];
    out.push({n:cleanName(e.n).slice(0,PR_NAME_MAX),cls,eq,sk,pass,ult:typeof e.ult==='string'&&ultDef(e.ult)?e.ult:null,cave:typeof e.cave==='string'&&caveSkillDef(e.cave)?e.cave:null,
      soul:ELEMS[e.soul]?e.soul:'basic',of:clampInt(e.of,-1,PR_OUTFITS-1,-1)});
  }
  return out;
}
const prListP=p=>p.gear.pre||(p.gear.pre=prSanitize(null));
// in a fight that must not be rearranged: a dungeon run, the Proving Isle, a world boss that is engaged near you, a raid that is engaged near you
function prBusyP(p){
  if(p.pv||p.dg||(p.inst|0)) return true;
  for(const B of BOSSES) if(B.engaged&&!B.m.dead&&Math.hypot(p.x-B.A.x,p.z-B.A.z)<B.A.r+30) return true;
  for(const st of RD_STATE) if(st.state==='engaged'&&Math.hypot(p.x-st.R.x,p.z-st.R.z)<RD_FOOT+40) return true;
  return false;
}
function prSaveP(p,i,name,of){
  if(!Number.isInteger(i)||i<0||i>=PR_COUNT) return;
  const g=p.gear, S=g.skills, cls=clsOfP(p), L=prListP(p), old=L[i], eq={};
  for(const k in g.eq) if(g.eq[k]) eq[k]=g.eq[k];
  L[i]={n:cleanName(name||(old&&old.n)||'Preset '+(i+1)).slice(0,PR_NAME_MAX),cls,eq,sk:Object.assign({},S.eq[cls]),pass:S.pass.slice(0,PASSIVE_SLOTS),ult:S.ult||null,cave:S.cave||null,soul:g.soul,of:clampInt(of,-1,PR_OUTFITS-1,-1)};
  p.dirty=true; toastTo(p.id,'Saved preset '+(i+1),'good');
}
function prWearP(p,i){
  if(!Number.isInteger(i)||i<0||i>=PR_COUNT||p.dead) return;
  const e=prListP(p)[i]; if(!e) return;
  if(prBusyP(p)){ toastTo(p.id,'Presets cannot be changed in a boss fight, a raid, a dungeon or on the Proving Isle','bad'); return; }
  const g=p.gear, S=g.skills; let skipped=0;
  for(const k in g.eq){   // gear: the weapon is always kept (it decides the class); other slots become what the preset holds, or empty
    const id=e.eq[k], it=id&&ITEM[id];
    if(it&&g.inv.includes(id)&&p.level>=it.lv&&(k==='weapon'?it.kind==='weapon':it.slot===k)) g.eq[k]=id;
    else { if(id) skipped++; if(k!=='weapon') g.eq[k]=null; }
  }
  const C=e.cls;   // (a preset keeps the loadout of the class it was saved with; the weapon decides which class is worn)
  for(const sl of SLOTS){ const id=e.sk[sl]; if(!id) continue;
    const s=SKILLS[id]; if(s&&S.owned.includes(id)&&(s.cls===C||s.cls==='any')&&s.slot===sl&&p.level>=Math.max(slotLv(sl),s.lv)&&canSwap(C,sl,S)) S.eq[C][sl]=id; else skipped++; }
  const np=[null,null,null];
  for(let j=0;j<PASSIVE_SLOTS;j++){ const id=e.pass[j]; if(id&&PASSIVES[id]&&S.owned.includes(id)&&j<passiveOpen(p.level)&&p.level>=Math.max(PASSIVE_LV,PASSIVES[id].lv)&&np.indexOf(id)<0) np[j]=id; else if(id) skipped++; }
  for(let j=0;j<PASSIVE_SLOTS;j++) S.pass[j]=np[j];
  S.ult=e.ult&&ultOwned(S,g.cave,e.ult)&&p.level>=ULT_LV?e.ult:null; if(e.ult&&!S.ult) skipped++;
  S.cave=e.cave&&Object.prototype.hasOwnProperty.call(g.cave.own,e.cave)&&p.level>=CAVE_SLOT_LV?e.cave:null; if(e.cave&&!S.cave) skipped++;
  if(p.level>=SOUL_LV&&e.soul!==g.soul&&ELEMS[e.soul]) g.soul=e.soul;
  recalcP(p); p.dirty=true; ev('pgear',p.id,g.eq); ev('prwear',p.id,i,e.of);
  toastTo(p.id,'Wearing '+e.n+(skipped?' ('+skipped+' item'+(skipped>1?'s':'')+' no longer available)':''),skipped?'':'good');
}
function prClearP(p,i){ if(!Number.isInteger(i)||i<0||i>=PR_COUNT) return; prListP(p)[i]=null; p.dirty=true; }
MSG.prsave=(p,msg)=>prSaveP(p,msg.i,msg.n,msg.of);
MSG.prwear=(p,msg)=>prWearP(p,msg.i);
MSG.prclear=(p,msg)=>prClearP(p,msg.i);
