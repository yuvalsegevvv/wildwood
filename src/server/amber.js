//@ Amber on the server: amber (gear.amb, a gear-upgrade material), gems (gear.gem, the premium currency), buying an outfit set for 1000 gems (gear.os), and the one public testing tool that grants gems on every server
/* Messages: gembuy{v: an outfit set id, b: 1 = the bundle: outfit + its whole skill set, GEM_SET_PRICE + GEM_SKILL_PRICE} (without b: costs GEM_SET_PRICE gems and is cosmetic only; with b the skills come too), gemtest{} (the PUBLIC testing tool, honoured even with the dev switch off: +GEM_TEST_GRANT gems).
   The admin tool for amber is devP 'amber' (economy.js, dev switch only). A client's id is never a key: the set must be in ambOutfitIds() (the outfits of SS_SETS).
   Test: tools/amber-smoke.js */
function ambOutfitIds(){ return SS_ORDER.map(k=>SS_SETS[k].outfit).filter(Boolean); }
function ambSanitize(g,out){   // an old save has neither field
  out.gem=Math.min(AMB_MAX,Math.max(0,Math.floor(+(g&&g.gem)||0)));
  out.amb=Math.min(AMB_MAX,Math.max(0,Math.floor(+(g&&g.amb)||0)));   // (not parseInt: it reads 1e99 as 1)
  const ids=ambOutfitIds(); out.os=Array.isArray(g&&g.os)?g.os.filter((id,i,a)=>typeof id==='string'&&ids.includes(id)&&a.indexOf(id)===i):[];
}
/* A look wears an outfit set (look.model, or a piece of it in the fields below, or a Kin part that comes with a set) only when the set is in gear.os; what is not owned goes back to a base piece.
   The editor already refuses to close on a locked set, so this only stops a hacked client (a copy; the look is already flat primitives: cleanLookS). */
const AMB_BASE_PIECE={model:'base',top:'tshirt',bottom:'trousers',shoes:'boots',hat:'none',hair:'short',faceItem:'',weaponItem:'',gloves:'none'};
function ambCleanLook(look,owned){
  if(!look||typeof look!=='object') return look;
  const ids=ambOutfitIds(), has=id=>Array.isArray(owned)&&owned.includes(id), o=Object.assign({},look);
  for(const f of Object.keys(AMB_BASE_PIECE)){ const v=o[f]; if(typeof v==='string'&&ids.includes(v)&&!has(v)) o[f]=AMB_BASE_PIECE[f]; }
  for(const s of Object.keys(KIN_SLOTS)){ const part=kinPart(s,o[KIN_SLOTS[s][0]]); if(part&&part.set&&!has(part.set)) o[KIN_SLOTS[s][0]]=''; }
  return o;
}
function ambAddP(p,n){ p.gear.amb=clampInt((p.gear.amb||0)+n,0,AMB_MAX,0); p.dirty=true; }
function ambGemP(p,n){ p.gear.gem=Math.min(AMB_MAX,Math.max(0,(p.gear.gem||0)+n)); p.dirty=true; }
function ambBuyP(p,id){
  id=String(id||''); if(!ambOutfitIds().includes(id)) return;
  if(p.gear.os.includes(id)){ toastTo(p.id,'You already own that outfit set','bad'); return; }
  if(p.gear.gem<GEM_SET_PRICE){ toastTo(p.id,'An outfit set costs '+GEM_SET_PRICE+' gems','bad'); return; }
  p.gear.gem-=GEM_SET_PRICE; p.gear.os.push(id); p.dirty=true;
  toastTo(p.id,'Outfit set bought. Wear it in the character editor.','loot r3');
}
// the bundle: the outfit AND the skill set of that character (all three positions), 1600 gems in all; whatever of the two you already own is not charged twice. The skill set stays earnable in the world (bosses, dungeons) for free.
const ambSetOfOutfit=id=>SS_ORDER.find(k=>SS_SETS[k].outfit===id);
const ambSkillsOwnedP=(p,sid)=>[1,2,3].every(pos=>ssPieceIdsOf(sid,pos).every(i=>p.gear.skills.owned.includes(i)));
function ambBundleP(p,id){
  id=String(id||''); const sid=ambOutfitIds().includes(id)&&ambSetOfOutfit(id); if(!sid) return;
  const hasO=p.gear.os.includes(id), hasS=ambSkillsOwnedP(p,sid);
  if(hasO&&hasS){ toastTo(p.id,'You already own that outfit set and its skills','bad'); return; }
  const price=(hasO?0:GEM_SET_PRICE)+(hasS?0:GEM_SKILL_PRICE);
  if(p.gear.gem<price){ toastTo(p.id,'That costs '+price+' gems','bad'); return; }
  p.gear.gem-=price; if(!hasO) p.gear.os.push(id); if(!hasS){ ssGrantSetP(p,sid,true); recalcP(p); } p.dirty=true;
  toastTo(p.id,'Bundle bought: the outfit set'+(hasS?'':' and all three skills of it')+'. Wear the outfit in the character editor, equip the skills in the skills panel.','loot r3');
}
MSG.gembuy=(p,msg)=>{ if(msg.b) ambBundleP(p,msg.v); else ambBuyP(p,msg.v); };
MSG.gemtest=(p)=>{ ambGemP(p,GEM_TEST_GRANT); toastTo(p.id,GEM_TEST_GRANT+' gems added (testing)','good'); };
