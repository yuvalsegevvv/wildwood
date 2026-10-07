//@ Skill sets (rules, pure): the registry defineSkillSet (one file per set in shared/skillsets/), its checks, the expansion into SKILLS / PASSIVES rows, counting the worn pieces and the 3- / 5-set bonuses
/* Agent map. Plan: docs/SKILL-SETS.md (sections 3 to 6); how to add ONE set as data, and the list of what a piece may use: docs/skillkits/AUTHORING.md; the kits: docs/skillkits/. Test: tools/skillsets-smoke.js.
   Exports: defineSkillSet(D), SS_SETS (by id), SS_ORDER (ids in definition order), SS_BAD ({id,field,why}: the sets left out), SS_PIECE_OF (piece id -> {set,pos,kind:'active'|'passive'}),
   SS_SOURCES, SS_FX_KEYS / SS_ON / SS_EFFECT_KEYS (what a piece may use: add a key here when an engine feature adds it), ssCount, ssBonuses, ssBonusSum, ssSetFor, ssLint, ssOwnsBasic.
   Used by: classes.js (passiveSum reads ssBonusSum, canSwap reads ssOwnsBasic), server/skillsets.js (grants, equipping a piece, the cache p.ss), the client's skills panel.
   A SET is 3 actives + 3 passives (6 pieces) and two bonus rows (3-set, 5-set) that fill no slot: position 1 = the basic attack's slot (always class-bound: a warrior, an archer and a mage version),
   2 = skill, 3 = burst (each class-bound or `any`), each position with one passive. Where a piece comes from is fixed by the land (SS_SOURCES: boss 1, boss 2, the land's dungeon), not by the set.
   THE FILE OF A SET (shared/skillsets/<id>.js, listed in src/manifest.json after the last shared file) is one defineSkillSet({...}) call and no top-level names:
     id ('tansy': a lowercase word, permanent once shipped), name, land (a SS_SOURCES key), needs:{tier} (1..ZTIER_MAX), dev (true: a test set, never obtainable), el ('<element>' | 'basic' | ['<a>','<b>']),
     role:{main:'risk'|'safe'|'grind'|'support'|'heal'|'tank', focus:'buff'|'debuff'|'both' (support only), also:{role, part:'major'|'mild'} (a mixed set)},
     char:{name, sex:'female'|'male', theme, ip:{kind:'original', riffs} | {kind:'licensed', work, license, source, credit}}, pal:{main, accent, glow} (colours), kit:{mark, name, text} (optional),
     pos:{1:{bound:'class', skill:{warrior:E, archer:E, mage:E}, passive:R, from:{chance, pity} (optional odds)}, 2:{bound:'class'|'any', skill:{...} | {any:E}, passive:R}, 3:{...}},
     bonus:{3:R, 5:R}, outfit (an outfit id, optional until outfits exist).
   E, a skill entry, is a SKILLS row minus what the registry fills in (cls, slot, id, lv, price, set, pos): name, desc, cd, range, mult, act:[kind, seconds, when it lands], and optionally anim, el, fx, buff, why.
   R, a passive or bonus row, is {name, text} plus EITHER stat + v (a number, or [value at level 1, added a level]; text has {} for the percent) OR on (a trigger) + at least one of fx / heal / buff / mark / status /
   shield (+ chance, icd, mult, el); and optionally cost:{stat, v} with a negative v: the price this same row pays (less maximum health, more damage taken, longer cooldowns).
   A bad set is LEFT OUT (the game still boots), warned about and listed in SS_BAD; nothing of it is registered. Piece ids: <set>_<pos>_<class|any> for an active, <set>_p<pos> for a passive. */
const SS_ROLES=['risk','safe','grind','support','heal','tank'], SS_FOCUS=['buff','debuff','both'], SS_PARTS=['major','mild'], SS_HYBRID_ROLES=['risk','safe','grind'];
const SS_CLASSES=['warrior','archer','mage'], SS_SLOT_OF=['basic','skill','burst'];
// the three sources of a land (SS_SOURCES[land][position - 1]): boss 1, boss 2, the dungeon's theme id
const SS_SOURCES={home:['boss','carapax','hollowroots'],vale:['akaoni','kyuubi','jadesprings'],hoar:['ymrik','vetrmaw','bonefrostbarrow'],grey:['gryphonqueen','mountaingolem','blackseam']};
const SS_FX_KEYS=['buff','dash','ring','cone','beam','chain','proj','zone'];   // what resolveFxS knows (server/combat.js)
const SS_ON=['hit','crit','kill','hurt','cast1','cast2','cast3','tick','low'], SS_EFFECT_KEYS=['fx','heal','buff','mark','status','shield'];
const SS_ENTRY_KEYS=['name','desc','cd','range','mult','act','anim','el','fx','buff','why'];
const SS_SETS=Object.create(null), SS_ORDER=[], SS_BAD=[], SS_PIECE_OF=Object.create(null);
const ssIsEl=e=>typeof e==='string'&&(e==='basic'||!!ELEM_OPP[e]);   // 'basic' or one of the six elements
function ssFxProblem(fx){
  if(!fx||typeof fx!=='object'||Array.isArray(fx)) return 'fx is an object';
  for(const k in fx) if(!SS_FX_KEYS.includes(k)) return 'unknown fx key "'+k+'" (known: '+SS_FX_KEYS.join(' ')+')';
  return null;
}
// what is wrong with one skill entry (null when nothing); taken: the attack kinds already used inside this set
function ssSkillProblem(e,taken){
  if(!e||typeof e!=='object') return 'missing';
  for(const k in e) if(!SS_ENTRY_KEYS.includes(k)) return 'unknown key "'+k+'" (known: '+SS_ENTRY_KEYS.join(' ')+')';
  if(typeof e.name!=='string'||!e.name) return 'name missing';
  if(typeof e.desc!=='string'||!e.desc) return 'desc missing';
  for(const k of ['cd','range','mult']) if(!(Number.isFinite(e[k])&&e[k]>=0)) return k+' must be a number of 0 or more';
  if(!(e.cd>0)) return 'cd must be above 0';
  const a=e.act; if(!Array.isArray(a)||a.length!==3||typeof a[0]!=='string'||!/^[a-z][a-z0-9]*$/.test(a[0])||!(a[1]>0)||!(a[2]>=0&&a[2]<=a[1])) return 'act is [kind, seconds, when it lands (0 to the seconds)] with a lowercase kind';
  if(ACT_SKILL[a[0]]||taken.has(a[0])) return 'the attack kind "'+a[0]+'" is already used (every skill has its own)';
  if(e.anim!==undefined&&!Object.values(ANIM_OF).includes(e.anim)) return 'anim "'+e.anim+'" is not a body animation that another skill already borrows';
  if(e.el!==undefined&&!ssIsEl(e.el)) return 'el "'+e.el+'" is not an element';
  if(e.fx!==undefined){ const p=ssFxProblem(e.fx); if(p) return p; }
  if(e.buff!==undefined&&!(e.fx&&e.fx.buff)) return 'a buff needs fx:{buff:1}';
  if(e.why!==undefined&&typeof e.why!=='string') return 'why is a sentence';
  return null;
}
// what is wrong with one passive or bonus row (null when nothing)
function ssRowProblem(r,needName){
  if(!r||typeof r!=='object') return 'missing';
  if(needName&&(typeof r.name!=='string'||!r.name)) return 'name missing';
  if(typeof r.text!=='string'||!r.text) return 'text missing';
  const isStat=typeof r.stat==='string'&&!!r.stat, isOn=r.on!==undefined;
  if(isStat===isOn) return 'give stat and v (a stat row) or on and an effect (a triggered row), not both and not neither';
  if(isStat){ const v=Array.isArray(r.v)?r.v:[r.v,0]; if(v.length!==2||!v.every(Number.isFinite)) return 'v is a number or [number, number]'; }
  else {
    if(!SS_ON.includes(r.on)) return 'on is one of '+SS_ON.join(' ');
    if(!SS_EFFECT_KEYS.some(k=>r[k]!==undefined)) return 'a triggered row needs one of '+SS_EFFECT_KEYS.join(' ');
    if(r.fx!==undefined){ const p=ssFxProblem(r.fx); if(p) return p; }
    if(r.chance!==undefined&&!(r.chance>0&&r.chance<=1)) return 'chance is above 0 and at most 1';
    if(r.icd!==undefined&&!(r.icd>=0)) return 'icd (seconds) is 0 or more';
    if(['hit','crit','hurt','tick'].includes(r.on)&&!(r.icd>0)) return 'a '+r.on+' trigger needs an icd above 0 (so it cannot run away)';
  }
  if(r.cost!==undefined){ const c=r.cost; if(!c||typeof c.stat!=='string'||!c.stat||!Number.isFinite(c.v)||c.v>=0) return 'cost is {stat, v} with a negative v'; }
  return null;
}
const ssRow=(r,id,extra)=>Object.assign(JSON.parse(JSON.stringify(r)),{id},extra,{v:r.stat?(Array.isArray(r.v)?r.v.slice():[r.v,0]):[0,0]});
function defineSkillSet(D){
  const id=D&&typeof D.id==='string'?D.id:'?', bad=(field,why)=>{ SS_BAD.push({id,field,why}); if(typeof console!=='undefined') console.warn('skill set '+id+' left out: '+field+': '+why); return null; };
  if(!D||typeof D!=='object') return bad('id','not an object');
  if(!/^[a-z][a-z0-9]*$/.test(id)) return bad('id','missing or not a lowercase word');
  if(SS_SETS[id]) return bad('id','defined twice');
  if(typeof D.name!=='string'||!D.name) return bad('name','missing');
  if(!SS_SOURCES[D.land]) return bad('land','"'+D.land+'" is not one of '+Object.keys(SS_SOURCES).join(' '));
  const tier=D.needs&&D.needs.tier; if(!Number.isInteger(tier)||tier<1||tier>ZTIER_MAX) return bad('needs','tier is a whole number from 1 to '+ZTIER_MAX);
  const dev=D.dev===true;
  if(!dev){ const other=SS_ORDER.map(o=>SS_SETS[o]).find(s=>!s.dev&&s.land===D.land&&s.tier===tier); if(other) return bad('needs','"'+other.id+'" already is the set of '+D.land+' at tier '+tier+' (one for each land and tier)'); }
  // the element(s): one element, none, or a hybrid of two (risk DPS, safe DPS and grind only, never a mixed set)
  const hybrid=Array.isArray(D.el), els=hybrid?D.el:[D.el];
  if(!els.every(ssIsEl)||(hybrid&&(els.length!==2||els[0]===els[1]||els.includes('basic')))) return bad('el','"'+JSON.stringify(D.el)+'" (one element, "basic", or two different elements)');
  const R=D.role; if(!R||!SS_ROLES.includes(R.main)) return bad('role','main is one of '+SS_ROLES.join(' '));
  if(R.main==='support'?!SS_FOCUS.includes(R.focus):R.focus!==undefined) return bad('role','focus ('+SS_FOCUS.join(' ')+') is for support and only for support');
  if(R.also!==undefined&&(!R.also||!SS_ROLES.includes(R.also.role)||R.also.role===R.main||!SS_PARTS.includes(R.also.part))) return bad('role','also is {role: another archetype, part: '+SS_PARTS.join(' or ')+'}');
  if(hybrid&&(!SS_HYBRID_ROLES.includes(R.main)||R.also!==undefined)) return bad('el','a hybrid of two elements is for risk, safe and grind sets with no second role (support, heal, tank and mixed sets have one element or none)');
  const C=D.char; if(!C||typeof C.name!=='string'||!C.name.trim()) return bad('char','name missing');
  if(SS_ORDER.some(o=>SS_SETS[o].char.name.toLowerCase()===C.name.trim().toLowerCase())) return bad('char','the name "'+C.name+'" is another set\'s');
  if(C.sex!=='female'&&C.sex!=='male') return bad('char','sex is female or male');
  if(typeof C.theme!=='string'||!C.theme) return bad('char','theme (one line) missing');
  const ip=C.ip; if(!ip||!(ip.kind==='original'?typeof ip.riffs==='string'&&ip.riffs:ip.kind==='licensed'&&['work','license','source','credit'].every(k=>typeof ip[k]==='string'&&ip[k]))) return bad('char','ip is {kind:"original", riffs} or {kind:"licensed", work, license, source, credit}');
  if(!D.pal||!['main','accent','glow'].every(k=>Number.isInteger(D.pal[k]))) return bad('pal','main, accent and glow colours (whole numbers)');
  if(D.kit!==undefined&&(!D.kit||typeof D.kit.name!=='string'||typeof D.kit.text!=='string'||(D.kit.mark!==undefined&&!/^[a-z]+$/.test(D.kit.mark)))) return bad('kit','kit is {mark (a lowercase word, optional), name, text}');
  if(!D.pos||typeof D.pos!=='object') return bad('pos','missing');
  const src=SS_SOURCES[D.land], taken=new Set(), posEl={}, made=[], th=DG_THEMES[src[2]];
  if(!th||th.land!==D.land) return bad('land','the dungeon "'+src[2]+'" of '+D.land+' is not defined');
  for(let p=1;p<=3;p++){
    const P=D.pos[p], at='pos '+p, slot=SS_SLOT_OF[p-1]; if(!P||typeof P!=='object') return bad('pos',at+' missing');
    if(P.bound!=='class'&&P.bound!=='any') return bad('pos',at+': bound is "class" or "any"'); if(p===1&&P.bound!=='class') return bad('pos','position 1 is always bound to the class');
    const keys=P.bound==='class'?SS_CLASSES:['any']; if(!P.skill||Object.keys(P.skill).sort().join()!==keys.slice().sort().join()) return bad('pos',at+': skill needs exactly '+keys.join(', '));
    let el; const variants=[];
    for(const k of keys){
      const e=P.skill[k], pr=ssSkillProblem(e,taken); if(pr) return bad('pos',at+' '+k+': '+pr);
      taken.add(e.act[0]);
      const ee=e.el!==undefined?e.el:(hybrid?undefined:D.el); if(ee===undefined) return bad('pos',at+' '+k+': a hybrid set names the element of every piece (el)');
      if(el!==undefined&&ee!==el) return bad('pos',at+': the '+keys.join(', ')+' versions must all have one element');
      el=ee; variants.push([k,e]);
    }
    if(hybrid&&!els.includes(el)) return bad('pos',at+': element "'+el+'" is not one of the set\'s '+els.join(' and '));
    posEl[p]=el;
    const pp=ssRowProblem(P.passive,true); if(pp) return bad('pos',at+' passive: '+pp);
    if(P.from!==undefined){ const f=P.from; if(!f||(f.chance!==undefined&&!(f.chance>0&&f.chance<=1))||(f.pity!==undefined&&!(Number.isInteger(f.pity)&&f.pity>=1))) return bad('pos',at+': from is {chance (0 to 1), pity (a whole number)}'); }
    made.push({p,slot,variants,P,el});
  }
  // the element rule: a basic set is element-less all through; a single-element set has at least 4 of its 6 pieces in it (the others say why); a hybrid has both of its elements
  const inEl=e=>made.filter(m=>m.el===e).length*2;
  if(D.el==='basic'&&made.some(m=>m.el!=='basic')) return bad('el','a set with el "basic" is element-less in every piece');
  if(!hybrid&&D.el!=='basic'&&inEl(D.el)<4) return bad('el','at least 4 of the 6 pieces (2 of the 3 positions) are in "'+D.el+'"');
  if(hybrid&&els.some(e=>inEl(e)<2)) return bad('el','each of the two elements has at least one position');
  const bn=D.bonus; if(!bn||ssRowProblem(bn[3],true)||ssRowProblem(bn[5],true)) return bad('bonus','bonus 3 and bonus 5 are rows: '+(!bn?'missing':ssRowProblem(bn[3],true)||ssRowProblem(bn[5],true)));
  // everything checks out: register the pieces
  const set={id,name:D.name,land:D.land,tier,dev,el:D.el,role:JSON.parse(JSON.stringify(R)),char:JSON.parse(JSON.stringify(C)),pal:Object.assign({},D.pal),kit:D.kit?JSON.parse(JSON.stringify(D.kit)):null,outfit:D.outfit||null,pos:{},bonus:{}};
  for(const m of made){
    const lv=m.p<3?BOSS_DEFS.find(b=>b.def.id===src[m.p-1]).def.level:th.lv, ids=[];
    for(const [k,e] of m.variants){
      const rid=id+'_'+m.p+'_'+k, row=Object.assign(JSON.parse(JSON.stringify(e)),{id:rid,cls:k,slot:m.slot,el:m.el,price:0,lv,set:id,pos:m.p});
      SKILLS[rid]=row; SKILL_IDS.push(rid); ANIM_OF[row.act[0]]=row.anim||row.act[0]; ACT_SKILL[row.act[0]]=row; SS_PIECE_OF[rid]={set:id,pos:m.p,kind:'active'}; ids.push(rid);
    }
    const pid=id+'_p'+m.p;
    PASSIVES[pid]=ssRow(m.P.passive,pid,{slot:'passive',cls:null,el:m.el,lv,price:0,set:id,pos:m.p});
    PASSIVE_IDS.push(pid); SS_PIECE_OF[pid]={set:id,pos:m.p,kind:'passive'};
    set.pos[m.p]={slot:m.slot,bound:m.P.bound,from:{kind:m.p<3?'boss':'dungeon',id:src[m.p-1],chance:m.P.from&&m.P.from.chance,pity:m.P.from&&m.P.from.pity},ids,passive:pid,lv,el:m.el};
  }
  for(const t of [3,5]) set.bonus[t]=ssRow(bn[t],id+'_b'+t,{set:id,tier:t,slot:'bonus'});
  SS_SETS[id]=set; SS_ORDER.push(id); return set;
}
// the worn pieces of each set for a class and a level: the three actives (as abilityOf resolves them) and the passives in the slots the level has opened
function ssCount(skills,cls,level){
  const n={}; if(!skills||!skills.eq||!SS_ORDER.length) return n;
  for(const slot of SLOTS){ const ab=abilityOf(cls,slot,skills,level); if(ab&&ab.set) n[ab.set]=(n[ab.set]||0)+1; }
  if(Array.isArray(skills.pass)) for(const id of skills.pass.slice(0,passiveOpen(level))){ const P=PASSIVES[id]; if(P&&P.set&&skills.owned.includes(id)&&level>=Math.max(PASSIVE_LV,P.lv)) n[P.set]=(n[P.set]||0)+1; }
  return n;
}
// the bonus rows in force: a set with 3 pieces worn has its bonus 3, with 5 both (a sixth adds nothing: there is no 6-set bonus)
function ssBonuses(skills,cls,level){
  const out=[], n=ssCount(skills,cls,level);
  for(const id in n){ const S=SS_SETS[id]; if(!S) continue; if(n[id]>=3) out.push({set:id,tier:3,row:S.bonus[3]}); if(n[id]>=5) out.push({set:id,tier:5,row:S.bonus[5]}); }
  return out;
}
// the sum of one stat over the bonus rows in force, a cost counted with it (the passives' own are in passiveSum)
function ssBonusSum(skills,level,stat,cls){
  if(!cls||!SS_ORDER.length) return 0;
  let t=0; for(const b of ssBonuses(skills,cls,level)){ const r=b.row; if(r.stat===stat) t+=r.v[0]; if(r.cost&&r.cost.stat===stat) t+=r.cost.v; }
  return t;
}
// does the loadout own a slot-1 piece for this class? (then the class may change its basic attack: classes.js canSwap)
function ssOwnsBasic(skills,cls){
  if(!SS_ORDER.length||!skills||!Array.isArray(skills.owned)) return false;
  return skills.owned.some(id=>{ const s=SKILLS[id]; return s&&s.set&&s.slot==='basic'&&s.cls===cls; });
}
// the set a clear of this land at this tier rewards: the highest released set at or below the tier, none at +0 (dev sets are never rewarded)
function ssSetFor(land,tier){
  let best=null; for(const id of SS_ORDER){ const s=SS_SETS[id]; if(!s.dev&&s.land===land&&s.tier<=tier&&(!best||s.tier>best.tier)) best=s; }
  return best;
}
// what the owner's rules ask of the released sets as a whole (warnings, not failures of one set): the first grinder is pure basic, two women and two men in the first four, no hybrid of soul opposites,
// a piece in another element than its set says why. Returns [{set, why}]
function ssLint(){
  const out=[], real=SS_ORDER.map(i=>SS_SETS[i]).filter(s=>!s.dev), land=l=>Object.keys(SS_SOURCES).indexOf(l);
  const grinders=real.filter(s=>s.role.main==='grind').sort((a,b)=>land(a.land)-land(b.land)||a.tier-b.tier);
  if(grinders[0]&&grinders[0].el!=='basic') out.push({set:grinders[0].id,why:'the first grinder is pure basic (every piece element-less)'});
  for(const s of SS_ORDER.map(i=>SS_SETS[i])){
    if(Array.isArray(s.el)&&ELEM_OPP[s.el[0]]===s.el[1]) out.push({set:s.id,why:'a hybrid of soul opposites ('+s.el.join(' + ')+'): with the soul on one, the other pays x1/1.5'});
    if(!Array.isArray(s.el)&&s.el!=='basic') for(let p=1;p<=3;p++) if(s.pos[p].el!==s.el&&!SKILLS[s.pos[p].ids[0]].why) out.push({set:s.id,why:'position '+p+' is in "'+s.pos[p].el+'" but the set is "'+s.el+'" and its entry has no why'});
  }
  const f=real.filter(s=>s.char.sex==='female').length, m=real.length-f; if(real.length>=2&&Math.abs(f-m)>1) out.push({set:'*',why:'the gender ratio is '+f+' female to '+m+' male (equal is the owner\'s rule)'});
  return out;
}
