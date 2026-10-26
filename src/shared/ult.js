//@ The 5th skill slot, the set burst ("Burst"): its constants, the registry ULT_SKILLS filled by each skill set's `ult` entry, its validation, the 3-of-7 ownership rule and the fixed cooldown
/* Agent map. Plan and rules: docs/ULT.md; test: tools/ult-smoke.js. Stem `ult` (the visible name of slot 3 is "Power" but its code id stays `burst`: never name anything burst* for this slot).
   One burst skill per skill set, written as an `ult:{...}` entry in the set's own file (shared/skillsets/<id>.js) and registered by defineSkillSet through ultDefine().
   It is NOT in SKILLS (too much iterates SKILLS: shops, drops, class loadouts, ssCount): ULT_SKILLS[<set id>] is an ability row {id:'<set>U', cls:'any', slot:'ult', set, cd:0, lv:35, ...}.
   The entry: {name, desc, range, mult, act:[kind,secs,hit], anim?, fx:{ring|cone|proj|zone ...}, boost:[{piece, secs, mod?}, {piece, secs, mod?}]}. The stun is added by the engine (fxU: every shape entry carries ult:true), never written in fx.
   `boost` buffs exactly two of the set's seven pieces: 'a1'-'a3' (the actives), 'cave' (the set's cave skill, an active), 'p1'-'p3' (the passives); at least one an active. mod keys: ULT_MODS.
   Exports: ULT_SLOT, ULT_LV, ULT_CD, ULT_CD_GRIND, ULT_STUN, ULT_STUN_LOCK, ULT_POWER, ULT_OWN_N, ULT_PIECES, ULT_MODS, ULT_SKILLS, ULT_BAD, ultDef(setId), ultDefine(setId,U,el), ultCdOf(setId,inBossFight), ultPieceCount(skills,cave,setId), ultOwned(skills,cave,setId).
   Used by: shared/skillsets.js (defineSkillSet), classes.js (slotLv), server/ult.js, players.js (sanitize), game/ult/*. */
const ULT_SLOT='ult', ULT_LV=35;                 // the slot opens at this player level
const ULT_CD=60, ULT_CD_GRIND=30;                 // the fixed cooldown; a grind set cast outside a boss fight gets the short one. NOTHING reduces either (server/ult.js is the only writer of p.cd.ult)
const ULT_STUN=5, ULT_STUN_LOCK=50;               // seconds of stun; seconds before the same enemy can be burst-stunned again, whoever casts it
const ULT_POWER=[1.35,1.65];                      // a burst's mult against its set's position-3 skill (a lint warning, not a hard rule)
const ULT_OWN_N=3;                                // owning this many of the set's 7 pieces grants the burst (TEMPORARY source, one function: ultOwned)
const ULT_PIECES=['a1','a2','a3','cave','p1','p2','p3'], ULT_ACTIVE_PIECES=['a1','a2','a3','cave'];
const ULT_SHAPES=['ring','cone','proj','zone'];   // the fx shapes a burst may use (the ones that go through statusS)
// the boost vocabulary: key -> {on: 'active' | 'passive', min, max}. Read in one place each (docs/ULT.md); `cdr` is {skill, burst} seconds
const ULT_MODS={mult:{on:'active',min:1,max:3},util:{on:'active',min:1,max:3},cd:{on:'active',min:0.3,max:1},n:{on:'active',min:1,max:4},size:{on:'active',min:1,max:1.6},
  v:{on:'passive',min:1,max:4},eff:{on:'passive',min:1,max:4},icd:{on:'passive',min:0.25,max:1},cdr:{on:'passive',min:0,max:20}};
const ULT_SKILLS=Object.create(null), ULT_BAD=[];
const ultDef=setId=>typeof setId==='string'&&Object.prototype.hasOwnProperty.call(ULT_SKILLS,setId)?ULT_SKILLS[setId]:null;
// the cooldown a cast starts: 60 s, or 30 s for a grind set cast outside a boss fight (fixed at the cast)
function ultCdOf(setId,inBossFight){ const S=SS_SETS[setId]; return S&&S.role.main==='grind'&&!inBossFight?ULT_CD_GRIND:ULT_CD; }
// how many of the set's 7 pieces are owned: each position's active (once for all its class versions) and passive in skills.owned, plus its cave skill in cave.own
function ultPieceCount(skills,cave,setId){
  const S=SS_SETS[setId]; if(!S||!skills||!Array.isArray(skills.owned)) return 0;
  let n=0; for(let p=1;p<=3;p++){ const P=S.pos[p]; if(P.ids.some(id=>skills.owned.includes(id))) n++; if(skills.owned.includes(P.passive)) n++; }
  if(cave&&cave.own) for(const id in CAVE_SKILLS) if(CAVE_SKILLS[id].set===setId&&Object.prototype.hasOwnProperty.call(cave.own,id)){ n++; break; }
  return n;
}
const ultOwned=(skills,cave,setId)=>!!ultDef(setId)&&ultPieceCount(skills,cave,setId)>=ULT_OWN_N;
// what is wrong with one boost entry (null when nothing)
function ultBoostProblem(b){
  if(!b||typeof b!=='object') return 'a boost is {piece, secs, mod?}';
  if(!ULT_PIECES.includes(b.piece)) return 'piece is one of '+ULT_PIECES.join(' ');
  if(!(b.secs>=8&&b.secs<=20)) return 'secs is 8-20';
  const act=ULT_ACTIVE_PIECES.includes(b.piece), mod=b.mod===undefined?(act?{mult:2}:null):b.mod;
  if(!mod||typeof mod!=='object'||Array.isArray(mod)||!Object.keys(mod).length) return 'a passive boost needs a mod (the default x2 damage is for an active)';
  for(const k of Object.keys(mod)){
    const M=ULT_MODS[k]; if(!M) return 'unknown mod "'+k+'" (known: '+Object.keys(ULT_MODS).join(' ')+')';
    if(M.on!==(act?'active':'passive')) return 'mod "'+k+'" is for a'+(M.on==='active'?'n active':' passive')+', not '+b.piece;
    if(k==='cdr'){ const c=mod.cdr; if(!c||typeof c!=='object'||!Object.keys(c).length||!Object.keys(c).every(s=>(s==='skill'||s==='burst')&&c[s]>=0&&c[s]<=M.max)) return 'cdr is {skill?, burst?} seconds 0-'+M.max; }
    else if(!(mod[k]>=M.min&&mod[k]<=M.max)) return 'mod "'+k+'" is '+M.min+'-'+M.max;
  }
  return null;
}
// the burst's fx with the engine's stun switched on: every shape entry carries ult:true (statusS reads it)
function ultFxOf(fx){ const out=JSON.parse(JSON.stringify(fx)); for(const k of ULT_SHAPES) if(out[k]&&typeof out[k]==='object') out[k].ult=true;
  if(out.proj&&out.proj.zone&&typeof out.proj.zone==='object') out.proj.zone.ult=true;   // (a projectile's landing zone)
  return out; }
/* defineSkillSet calls this after it has registered the set: validate U (the set's `ult` entry), register the ability in ULT_SKILLS, or list it in ULT_BAD and leave only the burst out (the set stays). el: the set's position-3 element */
function ultDefine(setId,U,el){
  const bad=why=>{ ULT_BAD.push({id:setId,why}); if(typeof console!=='undefined') console.warn('burst of '+setId+' left out: '+why); return null; };
  if(!U||typeof U!=='object') return bad('not an object');
  if(typeof U.name!=='string'||!U.name||U.name.length>24) return bad('name must be 1-24 characters');
  if(typeof U.desc!=='string'||!U.desc||U.desc.length>240) return bad('desc must be 1-240 characters');
  if(!(U.mult>=0&&U.mult<=10)) return bad('mult must be 0-10');
  if(!(U.range>=1&&U.range<=60)) return bad('range must be 1-60');
  { const p=ssFxProblem(U.fx,false); if(p) return bad(p); }
  if(!ULT_SHAPES.some(k=>U.fx[k])) return bad('fx needs a shape ('+ULT_SHAPES.join(' ')+')');
  for(const k of SS_FX_SHAPES){ const e=U.fx[k]; if(!e) continue; if(!ULT_SHAPES.includes(k)) return bad('shape "'+k+'" is not allowed (only '+ULT_SHAPES.join(' ')+')'); if(e.stun!==undefined||(e.status&&e.status.kind==='stun')) return bad(k+': the stun is added by the engine, do not write one'); }
  const a=U.act; if(!Array.isArray(a)||a.length!==3||typeof a[0]!=='string'||!/^[a-z][a-z0-9]*$/.test(a[0])||!(a[1]>0.2&&a[1]<=3)||!(a[2]>=0&&a[2]<=a[1])) return bad('act is [kind, seconds, when it lands] with a lowercase kind');
  if(ACT_SKILL[a[0]]) return bad('the attack kind "'+a[0]+'" is already used');
  if(U.anim!==undefined&&!Object.values(ANIM_OF).includes(U.anim)) return bad('anim "'+U.anim+'" is not a body animation another skill borrows');
  if(!Array.isArray(U.boost)||U.boost.length!==2) return bad('boost is exactly two entries');
  for(const b of U.boost){ const p=ultBoostProblem(b); if(p) return bad('boost: '+p); }
  if(U.boost[0].piece===U.boost[1].piece) return bad('the two boosts name different pieces');
  if(!U.boost.some(b=>ULT_ACTIVE_PIECES.includes(b.piece))) return bad('at least one boost is on an active');
  const ab={id:setId+'U',cls:'any',slot:ULT_SLOT,ult:true,set:setId,name:U.name,desc:U.desc,cd:0,price:0,lv:ULT_LV,range:U.range,mult:U.mult,fx:JSON.parse(JSON.stringify(U.fx)),fxU:ultFxOf(U.fx),
    act:a.slice(),anim:U.anim||'nova',el,icon:null,boost:U.boost.map(b=>({piece:b.piece,secs:b.secs,mod:JSON.parse(JSON.stringify(b.mod===undefined?{mult:2}:b.mod))}))};
  ULT_SKILLS[setId]=ab; ACT_SKILL[a[0]]=ab; ANIM_OF[a[0]]=ab.anim;   // the client draws a cast from its attack kind, the body plays the borrowed animation
  return ab;
}
