//@ Amber on the server: amber (gear.amb, a gear-upgrade material), gems (gear.gem, the premium currency), buying an outfit set for 1000 gems (gear.os), and the one public testing tool that grants gems on every server
/* Messages: gembuy{v: an outfit set id} (costs GEM_SET_PRICE gems; a bought set is cosmetic only: no skill is given), gemtest{} (the PUBLIC testing tool, honoured even with the dev switch off: +GEM_TEST_GRANT gems).
   The admin tool for amber is devP 'amber' (economy.js, dev switch only). A client's id is never a key: the set must be in ambOutfitIds() (the outfits of SS_SETS).
   Test: tools/amber-smoke.js */
function ambOutfitIds(){ return SS_ORDER.map(k=>SS_SETS[k].outfit).filter(Boolean); }
function ambSanitize(g,out){   // an old save has neither field
  out.gem=Math.min(AMB_MAX,Math.max(0,Math.floor(+(g&&g.gem)||0)));
  out.amb=Math.min(AMB_MAX,Math.max(0,Math.floor(+(g&&g.amb)||0)));   // (not parseInt: it reads 1e99 as 1)
  const ids=ambOutfitIds(); out.os=Array.isArray(g&&g.os)?g.os.filter((id,i,a)=>typeof id==='string'&&ids.includes(id)&&a.indexOf(id)===i):[];
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
MSG.gembuy=(p,msg)=>ambBuyP(p,msg.v);
MSG.gemtest=(p)=>{ ambGemP(p,GEM_TEST_GRANT); toastTo(p.id,GEM_TEST_GRANT+' gems added (testing)','good'); };
