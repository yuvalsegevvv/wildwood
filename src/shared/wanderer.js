//@ The Wanderer's paths (rules, pure): the registry defineWandererPath (one file per path in shared/wanderer/), its checks, the path passive, burst and Realization rows it registers, the active path of a save
/* Agent map (skills revamp step 18; design: PLAN sections 3 (Realization) and 7; the server half: server/wanderer.js; test: tools/bond-smoke.js (the paths block), tools/skillsets-ladder.js --wanderer).
   The Wanderer is the hero with no character's set worn: general skills (the class basic, shop skills and powers, general charge skills) plus ONE path's passive and burst. A path is one data file
   shared/wanderer/<id>.js (listed in src/manifest.json after this file): one defineWandererPath({...}) call and no top-level names (rule 4). fury.js is the worked example.
   THE ENTRY: {id (a lowercase word, permanent once shipped), name, role (an SS_ROLES archetype: risk safe grind support heal tank), kit (an AWK_KIT_STATS key: the Wanderer's branch stats while this path
          is active, written into AWK_PATH_KIT; default = role), from (the shop passive it is built from, a base PASSIVES id; null only for a path with no shop source: Prism), text (one line for the picker),
          el (the burst's element, default 'basic'), passive: R, ult: {the set burst format of shared/ult.js; boost pieces only WD_ULT_PIECES: 'a1'-'a3' the class actives worn, 'p1' the path passive},
          real: {1: R (passive-style), 2: R (like a 3-set row), 4: R (passive-style), 6: R (like a 5-set row)}}.
          R is the set row schema (shared/skillsets.js ssRowProblem: a stat row, a triggered row or an amp), so passiveSum / ssBonuses / ssRefreshP / ssTriggerS read them with no new effect kind.
          The passive must beat its source: when it names the same stat, its level-1 value is above the shop passive's.
   WHAT IT REGISTERS: PASSIVES['wd_<id>'] (the path passive: slot passive, no set, wd:<id>, price 0 but never sold: buySkillP refuses wd rows), PASSIVES['wd_<id>_r1'] / ['wd_<id>_r4'] (Realization I / IV:
          wdRow 1 | 4, never worn: bdIsBondPassive), WD_PATHS[id].rows[2] / [6] (Realization II / VI, row ids 'wd_<id>_r2' / '_r6', read by bdRowById), ULT_SKILLS['wd_<id>'] (the burst, ab.wd = id;
          ultOwned asks skills.wdu), AWK_PATH_KIT[id] = kit. None of them is in PASSIVE_IDS (no shop, no testing grant lists them).
   A bad path is LEFT OUT (the game still boots), warned about and listed in WD_BAD {id, field, why}; nothing of it is registered.
   SAVED: gear.bd.wanderer.path (server/bond.js bdSanitize -> server/wanderer.js wdPathClean: a known path id, default WD_DEFAULT). wdPathOf(gear) reads it safely (the default when it is missing or unknown).
   PIECES: WD_PATHS[id].pieces[cls][slot] = the path's own basic / skill / power (placeholders, WD_PIECE_SRC above); WD_PIECE_OF[skill id] = {path, cls, slot}.
   Exports: WD_PATHS, WD_PIECE_OF, wdPieceId, WD_ORDER, WD_BAD, WD_DEFAULT, WD_ULT_PIECES, WD_REAL_STEPS, defineWandererPath(D), wdPathOk(id), wdPathOf(gear), wdUltId(path), wdPassId(path), wdIsUlt(id), wdMainOk(skills), wdRowById(id), wdRealRows(gear, n).
   Used by: shared/bond.js (BD_WANDERER_ROWS, bdRowById, bdIsBondPassive), shared/ult.js (ultOwned), server/wanderer.js, server/bond.js, server/ult.js, game/bond/panel.js, game/economy/skills.js, game/ult/slot.js. */
const WD_PATHS=Object.create(null), WD_ORDER=[], WD_BAD=[], WD_DEFAULT='fury';
const WD_ULT_PIECES=['a1','a2','a3','p1'], WD_REAL_STEPS=[1,2,4,6];   // the burst may buff the class actives worn or the path passive; Realization I / II / IV / VI hold the path's rows (III and V: +1 level, server/bond.js)
// THE PATH'S OWN ACTIVES (the owner: a path is a full Bond set of the Wanderer, mix and match stays the off-Bond way): per class a basic, a skill and a power, registered as
// SKILLS['wd_<path>_<cls>_<slot>'] (wd: the path, never sold). PLACEHOLDERS for now: a renamed copy of a shop skill (the same attack kind, numbers and look), chosen by the path's role
// (WD_PIECE_SRC) or by the entry's own pieces:{<cls>:[basic, skill, power]}; the path's element, when it has one, replaces the copy's. To be reshaped kit by kit.
const WD_PIECE_SRC={
  risk:  {warrior:['slash','charge','bladestorm'], archer:['shoot','pierce','snipe'], mage:['firebolt','meteor','inferno']},
  safe:  {warrior:['slash','whirlwind','quake'], archer:['shoot','volley','hail'], mage:['iceshard','chain','blizzard']},
  tank:  {warrior:['slash','bash','quake'], archer:['shoot','pierce','hail'], mage:['iceshard','frostnova','blizzard']},
  grind: {warrior:['slash','whirlwind','bladestorm'], archer:['shoot','rain','hail'], mage:['missiles','chain','blizzard']},
  support:{warrior:['slash','bash','berserk'], archer:['shoot','volley','focus'], mage:['missiles','frostnova','surge']},
  heal:  {warrior:['slash','bash','berserk'], archer:['shoot','volley','focus'], mage:['missiles','frostnova','surge']}};
// ONE charge skill and ONE burst for every path FOR NOW (the owner: "just to have something there"): the charge is Echo (a general charge skill), the burst is the default path's
// (Fury's Red Ruin), registered under each path's own id 'wd_<path>' so a path can take back its own (its file keeps its `ult`) by dropping WD_ULT_SHARED.
const WD_CHARGE='echo'; let WD_ULT_SHARED=null;
const WD_PIECE_SLOTS=['basic','skill','burst'], WD_PIECE_OF=Object.create(null);   // WD_PIECE_OF[skill id] = {path, cls, slot}
const wdPieceId=(path,cls,slot)=>'wd_'+path+'_'+cls+'_'+slot;
const wdPathOk=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(WD_PATHS,id);
const wdPathOf=gear=>{ const w=gear&&gear.bd&&gear.bd.wanderer, k=w&&typeof w==='object'?w.path:null; return wdPathOk(k)?k:wdPathOk(WD_DEFAULT)?WD_DEFAULT:(WD_ORDER[0]||null); };
const wdUltId=path=>'wd_'+path, wdPassId=path=>'wd_'+path;   // (the burst's ULT_SKILLS key and the passive's PASSIVES id are the same string, in two registries)
const wdMainOk=skills=>!!skills&&!!skills.bdx&&skills.bdx.main===BD_WANDERER;   // the path passive and burst work only while the Wanderer is the character played (no set's power piece, no set the most worn: server/bond.js bdMainOfW)
const wdIsUlt=id=>typeof id==='string'&&!!ultDef(id)&&!!ULT_SKILLS[id].wd;
// a Realization II / VI row id ('wd_<path>_r2' | '_r6') -> {set: null, wd, tier, row}, or null (bdRowById asks this first)
function wdRowById(id){
  const m=typeof id==='string'?/^wd_([a-z][a-z0-9]*)_r([26])$/.exec(id):null;
  return m&&wdPathOk(m[1])?{set:null,wd:m[1],tier:+m[2],row:WD_PATHS[m[1]].rows[m[2]]}:null;
}
// what Realization step n (1, 2, 4, 6) of the save's active path gives the Bond engine: {p: {passive id: level}} or {r: [row id]} (BD_WANDERER_ROWS)
function wdRealRows(gear,n){
  const k=wdPathOf(gear); if(!k) return null;
  return n===1||n===4?{p:{['wd_'+k+'_r'+n]:BD_PASS_LV}}:{r:['wd_'+k+'_r'+n]};
}
// the marks a path's rows and burst apply and use: a pop, an amp or a `when: marked` must name a mark the path itself makes
function wdMarkProblem(rows,U){
  const made=new Set(), used=new Set(), usedFx=f=>{ if(!f) return; if(f.pop) used.add(f.pop.id); for(const k of SS_FX_SHAPES) if(f[k]&&f[k].status&&f[k].status.perMark) used.add(f[k].status.perMark.id); };
  for(const r of rows){ ssMarksMade(r,made); if(r.amp) used.add(r.amp.id); if(r.when&&r.when.marked) used.add(r.when.marked); if(r.cost&&r.cost.when&&r.cost.when.marked) used.add(r.cost.when.marked); if(r.status&&r.status.perMark) used.add(r.status.perMark.id); usedFx(r.fx); }
  if(U&&U.fx){ ssMarksMade({fx:U.fx},made); usedFx(U.fx); }
  for(const u of used) if(!made.has(u)) return '"'+u+'" is popped, amplified or asked for but nothing in the path applies that mark';
  return null;
}
function defineWandererPath(D){
  const id=D&&typeof D.id==='string'?D.id:'?', bad=(field,why)=>{ WD_BAD.push({id,field,why}); if(typeof console!=='undefined') console.warn('wanderer path '+id+' left out: '+field+': '+why); return null; };
  if(!D||typeof D!=='object') return bad('id','not an object');
  if(!/^[a-z][a-z0-9]*$/.test(id)) return bad('id','missing or not a lowercase word');
  if(wdPathOk(id)) return bad('id','defined twice');
  if(Object.prototype.hasOwnProperty.call(PASSIVES,'wd_'+id)||ultDef('wd_'+id)) return bad('id','"wd_'+id+'" is already a passive or a burst');
  if(typeof D.name!=='string'||!D.name.trim()||D.name.length>24) return bad('name','1 to 24 characters');
  if(!SS_ROLES.includes(D.role)) return bad('role','one of '+SS_ROLES.join(' '));
  const kit=D.kit===undefined?D.role:D.kit; if(typeof kit!=='string'||!Object.prototype.hasOwnProperty.call(AWK_KIT_STATS,kit)) return bad('kit','an Awakening stat table: one of '+Object.keys(AWK_KIT_STATS).join(' '));
  if(typeof D.text!=='string'||!D.text||D.text.length>160) return bad('text','one line for the picker (1 to 160 characters)');
  const from=D.from===undefined?null:D.from, src=from===null?null:(typeof from==='string'&&Object.prototype.hasOwnProperty.call(PASSIVES,from)&&!PASSIVES[from].set&&!PASSIVES[from].wd?PASSIVES[from]:false);
  if(src===false) return bad('from','a shop passive id ('+PASSIVE_IDS.filter(q=>!PASSIVES[q].set).join(' ')+') or null');
  const el=D.el===undefined?'basic':D.el; if(!ssIsEl(el)) return bad('el','"'+JSON.stringify(el)+'" (one element, or "basic")');
  { const p=ssRowProblem(D.passive,true); if(p) return bad('passive',p); }
  if(src&&D.passive.stat===src.stat){ const v=Array.isArray(D.passive.v)?D.passive.v[0]:D.passive.v; if(!(v>src.v[0])) return bad('passive','it is built from '+src.name+' ('+src.v[0]+' at level 1) and has to be stronger'); }
  const R=D.real; if(!R||typeof R!=='object') return bad('real','real is {1: row, 2: row, 4: row, 6: row}');
  for(const n of WD_REAL_STEPS){ const p=ssRowProblem(R[n],true); if(p) return bad('real','Realization '+BD_ROMAN[n]+': '+p); }
  if(Object.keys(R).some(k=>!WD_REAL_STEPS.includes(+k))) return bad('real','only the steps 1, 2, 4 and 6 hold rows (III and V are +1 level)');
  { const p=ultProblem(D.ult); if(p) return bad('ult',p); }
  if(!D.ult.boost.every(b=>WD_ULT_PIECES.includes(b.piece))) return bad('ult','boost pieces are '+WD_ULT_PIECES.join(' ')+' (the class actives worn, the path passive)');
  { const m=wdMarkProblem([D.passive,...WD_REAL_STEPS.map(n=>R[n])],D.ult); if(m) return bad('real',m); }
  const U=WD_ULT_SHARED?Object.assign({},WD_ULT_SHARED,{act:D.ult.act}):D.ult;   // the shared burst (WD_ULT_SHARED) keeps the path's own attack kind: one kind is one skill; the file's own burst is still checked
  // everything checks out: register
  const pid='wd_'+id, base={slot:'passive',cls:null,lv:PASSIVE_LV,price:0,set:null,wd:id};
  PASSIVES[pid]=ssRow(D.passive,pid,base,{el:null});
  for(const n of [1,4]){ const rid=pid+'_r'+n; PASSIVES[rid]=ssRow(R[n],rid,Object.assign({wdRow:n},base),{el:null}); }
  const rows={}; for(const n of [2,6]) rows[n]=ssRow(R[n],pid+'_r'+n,{set:null,wd:id,tier:n,slot:'bonus'},{el:null});
  const ab=ultRegister(pid,U,el); ab.wd=id;
  AWK_PATH_KIT[id]=kit;
  const pieces={}, psrc=D.pieces||WD_PIECE_SRC[D.role]||WD_PIECE_SRC.safe;
  for(const cls of ['warrior','archer','mage']){ pieces[cls]={};
    WD_PIECE_SLOTS.forEach((slot,i)=>{ const o=SKILLS[psrc[cls]&&psrc[cls][i]]; if(!o||o.slot!==slot||o.cls!==cls) return;
      const sid=wdPieceId(id,cls,slot), c=Object.assign({},o,{id:sid,name:D.name.trim()+' '+o.name,price:0,wd:id,icon:o.name,from:o.id,desc:o.desc+' (the path of '+D.name.trim()+')'});
      if(el!=='basic'&&o.el) c.el=el;
      SKILLS[sid]=c; SKILL_IDS.push(sid); WD_PIECE_OF[sid]={path:id,cls,slot}; pieces[cls][slot]=sid; }); }
  const P={id,name:D.name.trim(),role:D.role,kit,from,text:D.text,el,passive:pid,ult:pid,real:{1:pid+'_r1',4:pid+'_r4'},rows,pieces};
  WD_PATHS[id]=P; WD_ORDER.push(id);
  if(id===WD_DEFAULT&&!WD_ULT_SHARED) WD_ULT_SHARED=D.ult;   // every later path borrows the default path's burst (see WD_ULT_SHARED)
  return P;
}
