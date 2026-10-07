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
   R, a passive or bonus row, is {name, text} plus ONE of: stat + v (a number, or [value at level 1, added a level]; text has {} for the percent; stats: hp dmg crit red cd drop xp soul reflect rxk rxicd), OR on (a trigger:
   hit crit kill hurt cast1 cast2 cast3 tick low) + at least one of fx / heal / buff / mark / status / shield (+ chance, icd (a tick's interval), mult, range, el, below (low: the health share)), OR amp:{id, per} (the
   owner's marked targets take per x stacks more from you); and optionally cost:{stat, v} with a negative v: the price this same row pays (less maximum health, more damage taken, longer cooldowns).
   The fx of a skill (docs/SKILL-SETS.md 6, docs/REACTIONS.md): the shapes ring cone beam chain proj zone dash buff, and modifiers vsBoss (damage x against bosses), behind (x from behind: {k} or a number),
   rangeScale ({from, to, k}: damage grows to x k between those distances) and pop ({id, k, r, heal}: spend the player's marks of id: k x the hit's damage for each stack); the utility keys ally ({kind, v, dur, r}
   or a list: the caster and the party within r metres, in the same run), heal ({v, r}), shield ({v, dur, r}) and taunt ({dur, r}: the monsters near the caster come for them); a zone may carry ally / heal /
   shield too (for the allies standing in it); a shape may carry mark:{id, n, dur, max}, flavor ('<element>') and status:{kind, v, dur}.
   A bad set is LEFT OUT (the game still boots), warned about and listed in SS_BAD; nothing of it is registered. Piece ids: <set>_<pos>_<class|any> for an active, <set>_p<pos> for a passive. */
const SS_ROLES=['risk','safe','grind','support','heal','tank'], SS_FOCUS=['buff','debuff','both'], SS_PARTS=['major','mild'], SS_HYBRID_ROLES=['risk','safe','grind'];
const SS_CLASSES=['warrior','archer','mage'], SS_SLOT_OF=['basic','skill','burst'];
// the three sources of a land (SS_SOURCES[land][position - 1]): boss 1, boss 2, the dungeon's theme id
const SS_SOURCES={home:['boss','carapax','hollowroots'],vale:['akaoni','kyuubi','jadesprings'],hoar:['ymrik','vetrmaw','bonefrostbarrow'],grey:['gryphonqueen','mountaingolem','blackseam']};
const SS_FX_SHAPES=['buff','dash','ring','cone','beam','chain','proj','zone'], SS_FX_MODS=['vsBoss','behind','rangeScale','pop','ally','heal','shield','taunt'], SS_FX_KEYS=[...SS_FX_SHAPES,...SS_FX_MODS];   // what resolveFxS knows (server/combat.js)
const SS_BUFF_KINDS=['might','guard','haste','crit','critdmg','regen'];   // the general ally buffs (docs/SKILL-SETS.md 6.3)
// the most each can be (a share: might +50% damage, guard -50% damage taken (the 10% floor still holds), haste -40% cooldowns, crit +40% chance, critdmg +100%, regen 5% of maximum health a second)
const SS_ALLY_CAP={might:0.5,guard:0.5,haste:0.4,crit:0.4,critdmg:1,regen:0.05}, SS_ALLY_R=25, SS_HEAL_CAP=0.5, SS_TAUNT_BOSS=0.5;   // SS_ALLY_R: metres from the caster; SS_HEAL_CAP: of maximum health a cast; SS_TAUNT_BOSS: a boss's share of a taunt's time
const SS_ON=['hit','crit','kill','hurt','cast1','cast2','cast3','tick','low'], SS_EFFECT_KEYS=['fx','heal','buff','mark','status','shield'], SS_ST_KINDS=['vuln','weak','slow','stun'];
const SS_ENTRY_KEYS=['name','desc','cd','range','mult','act','anim','el','fx','buff','why'];
const SS_SETS=Object.create(null), SS_ORDER=[], SS_BAD=[], SS_PIECE_OF=Object.create(null);
const ssIsEl=e=>typeof e==='string'&&(e==='basic'||!!ELEM_OPP[e]);   // 'basic' or one of the six elements
const ssMarkProblem=m=>!m||!/^[a-z]+$/.test(m.id)||!(m.n===undefined||(m.n>=1&&m.n<=5))||!(m.dur===undefined||(m.dur>0&&m.dur<=60))||!(m.max===undefined||(m.max>=1&&m.max<=10))?'mark is {id (a lowercase word), n (1 to 5), dur (seconds, up to 60), max (1 to 10)}':null;
const ssStatusProblem=t=>!t||!SS_ST_KINDS.includes(t.kind)||!(t.kind==='vuln'||t.kind==='weak'?t.v>0&&t.v<=0.5:true)||!(t.dur>0&&t.dur<=30)?'status is {kind: '+SS_ST_KINDS.join(' or ')+', v (vuln, weak: above 0, at most 0.5), dur (seconds)}':null;
function ssFxProblem(fx,inTrigger){
  if(!fx||typeof fx!=='object'||Array.isArray(fx)) return 'fx is an object';
  for(const k in fx) if(!SS_FX_KEYS.includes(k)) return 'unknown fx key "'+k+'" (known: '+SS_FX_KEYS.join(' ')+')';
  if(inTrigger&&fx.buff) return 'a trigger\'s fx cannot be a buff (use the row\'s own buff)';
  if(fx.vsBoss!==undefined&&!(fx.vsBoss>0&&fx.vsBoss<=3)) return 'vsBoss is a number above 0, at most 3';
  if(fx.behind!==undefined&&!(fx.behind>=1&&fx.behind<=4)) return 'behind is a number from 1 to 4';
  const R=fx.rangeScale; if(R!==undefined&&!(R&&R.from>=0&&R.to>R.from&&R.k>0&&R.k<=4)) return 'rangeScale is {from, to (above from), k (up to 4)}';
  { const u=ssUtilProblem(fx,''); if(u) return u; if(fx.zone&&typeof fx.zone==='object'){ const z=ssUtilProblem(fx.zone,'zone.'); if(z) return z; } }
  const P=fx.pop; if(P!==undefined&&(!P||!/^[a-z]+$/.test(P.id)||!(P.k>0&&P.k<=3)||!(P.r===undefined||(P.r>0&&P.r<=20))||!(P.heal===undefined||(P.heal>0&&P.heal<=1)))) return 'pop is {id, k (up to 3), r (metres, optional), heal (a share of the damage, optional)}';
  for(const k of SS_FX_SHAPES){ const e=fx[k]; if(e&&typeof e==='object'){ if(e.mark!==undefined){ const m=ssMarkProblem(e.mark); if(m) return k+'.'+m; } if(e.status!==undefined){ const m=ssStatusProblem(e.status); if(m) return k+'.'+m; } if(e.flavor!==undefined&&!ssIsEl(e.flavor)) return k+'.flavor "'+e.flavor+'" is not an element'; } }
  return null;
}
const ssAllyOk=a=>a&&SS_BUFF_KINDS.includes(a.kind)&&a.v>0&&a.v<=SS_ALLY_CAP[a.kind]&&a.dur>0&&a.dur<=30&&(a.r===undefined||(a.r>0&&a.r<=40));
// the utility keys of a skill's fx (and of a zone entry): ally buffs, a party heal, a shield, a taunt
function ssUtilProblem(o,where){
  if(o.ally!==undefined){ const L=Array.isArray(o.ally)?o.ally:[o.ally]; if(L.length>3||!L.every(ssAllyOk)) return where+'ally is {kind: '+SS_BUFF_KINDS.join(' ')+', v (up to its cap), dur (up to 30 s), r (metres, optional)} or a list of up to 3'; }
  if(o.heal!==undefined&&!(o.heal&&o.heal.v>0&&o.heal.v<=SS_HEAL_CAP&&(o.heal.r===undefined||(o.heal.r>0&&o.heal.r<=40)))) return where+'heal is {v (a share of maximum health, up to '+SS_HEAL_CAP+'), r (optional)}';
  if(o.shield!==undefined&&!(o.shield&&o.shield.v>0&&o.shield.v<=1&&o.shield.dur>0&&o.shield.dur<=30&&(o.shield.r===undefined||(o.shield.r>0&&o.shield.r<=40)))) return where+'shield is {v (a share of maximum health), dur, r (optional)}';
  if(o.taunt!==undefined&&!(o.taunt&&o.taunt.dur>0&&o.taunt.dur<=10&&o.taunt.r>0&&o.taunt.r<=20)) return where+'taunt is {dur (up to 10 s), r (up to 20 m)}';
  return null;
}
// the mark ids a skill's fx or a row applies (so pop and amp can be checked against what the set really makes)
function ssMarksMade(o,out){
  if(!o||typeof o!=='object') return out;
  if(o.mark&&o.mark.id) out.add(o.mark.id);
  for(const k of SS_FX_SHAPES) if(o[k]&&typeof o[k]==='object'&&o[k].mark&&o[k].mark.id) out.add(o[k].mark.id);
  if(o.fx) ssMarksMade(o.fx,out);
  return out;
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
  if(e.fx===undefined) return 'fx missing: a signature skill is data-only, what it does is its fx';
  { const p=ssFxProblem(e.fx,false); if(p) return p; if(!SS_FX_SHAPES.some(k=>e.fx[k])) return 'fx needs a shape ('+SS_FX_SHAPES.join(' ')+')'; }
  if(e.buff!==undefined&&!(e.fx&&e.fx.buff)) return 'a buff needs fx:{buff:1}';
  if(e.why!==undefined&&typeof e.why!=='string') return 'why is a sentence';
  return null;
}
// what is wrong with one passive or bonus row (null when nothing)
function ssRowProblem(r,needName){
  if(!r||typeof r!=='object') return 'missing';
  if(needName&&(typeof r.name!=='string'||!r.name)) return 'name missing';
  if(typeof r.text!=='string'||!r.text) return 'text missing';
  const isStat=typeof r.stat==='string'&&!!r.stat, isOn=r.on!==undefined, isAmp=r.amp!==undefined;
  if((isStat?1:0)+(isOn?1:0)+(isAmp?1:0)!==1) return 'give exactly one of: stat and v (a stat row), on and an effect (a triggered row), amp (a mark amplifier)';
  if(isStat){ const v=Array.isArray(r.v)?r.v:[r.v,0]; if(v.length!==2||!v.every(Number.isFinite)) return 'v is a number or [number, number]'; }
  else if(isAmp){ const A=r.amp; if(!A||!/^[a-z]+$/.test(A.id)||!(A.per>0&&A.per<=0.5)) return 'amp is {id (a mark), per (a share per stack, up to 0.5)}'; }
  else {
    if(!SS_ON.includes(r.on)) return 'on is one of '+SS_ON.join(' ');
    if(!SS_EFFECT_KEYS.some(k=>r[k]!==undefined)) return 'a triggered row needs one of '+SS_EFFECT_KEYS.join(' ');
    if(r.fx!==undefined){ const p=ssFxProblem(r.fx,true); if(p) return p; }
    if(r.heal!==undefined&&!(r.heal>0&&r.heal<=1)) return 'heal is a share of maximum health (above 0, at most 1)';
    if(r.mark!==undefined){ const p=ssMarkProblem(r.mark); if(p) return p; }
    if(r.status!==undefined){ const p=ssStatusProblem(r.status); if(p) return p; }
    if(r.buff!==undefined&&!ssAllyOk(r.buff)) return 'buff is {kind: '+SS_BUFF_KINDS.join(' ')+', v (up to its cap), dur (up to 30 s), r (optional)}';
    if(r.shield!==undefined&&!(r.shield&&r.shield.v>0&&r.shield.v<=1&&r.shield.dur>0&&r.shield.dur<=30)) return 'shield is {v (a share of maximum health), dur}';
    if(r.below!==undefined&&!(r.below>0&&r.below<1)) return 'below is a share of health (0 to 1)';
    if(r.chance!==undefined&&!(r.chance>0&&r.chance<=1)) return 'chance is above 0 and at most 1';
    if(r.icd!==undefined&&!(r.icd>=0)) return 'icd (seconds) is 0 or more';
    if(['hit','crit','hurt','tick','low'].includes(r.on)&&!(r.icd>0)) return 'a '+r.on+' trigger needs an icd above 0 (so it cannot run away)';
  }
  if(r.cost!==undefined){ const c=r.cost; if(!c||typeof c.stat!=='string'||!c.stat||!Number.isFinite(c.v)||c.v>=0) return 'cost is {stat, v} with a negative v'; }
  return null;
}
const ssRow=(r,id,extra,defaults)=>Object.assign({},defaults,JSON.parse(JSON.stringify(r)),{id},extra,{v:r.stat?(Array.isArray(r.v)?r.v.slice():[r.v,0]):[0,0]});   // defaults sit under the row's own keys (an el of its own wins)
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
  // a pop or an amp spends marks: the set must make them (kit.mark, a skill's or a row's mark)
  { const made2=new Set(D.kit&&D.kit.mark?[D.kit.mark]:[]), used=new Set(), rows=[...made.map(m=>m.P.passive),bn[3],bn[5]];
    for(const m of made) for(const [,e] of m.variants){ ssMarksMade(e,made2); if(e.fx.pop) used.add(e.fx.pop.id); }
    for(const r of rows){ ssMarksMade(r,made2); if(r.amp) used.add(r.amp.id); if(r.fx&&r.fx.pop) used.add(r.fx.pop.id); }
    for(const u of used) if(!made2.has(u)) return bad('kit','"'+u+'" is popped or amplified but nothing in the set applies that mark (kit.mark, or a mark on a skill or a row)'); }
  // everything checks out: register the pieces
  const set={id,name:D.name,land:D.land,tier,dev,el:D.el,role:JSON.parse(JSON.stringify(R)),char:JSON.parse(JSON.stringify(C)),pal:Object.assign({},D.pal),kit:D.kit?JSON.parse(JSON.stringify(D.kit)):null,outfit:D.outfit||null,pos:{},bonus:{}};
  for(const m of made){
    const lv=m.p<3?BOSS_DEFS.find(b=>b.def.id===src[m.p-1]).def.level:th.lv, ids=[];
    for(const [k,e] of m.variants){
      const rid=id+'_'+m.p+'_'+k, row=Object.assign(JSON.parse(JSON.stringify(e)),{id:rid,cls:k,slot:m.slot,el:m.el,price:0,lv,set:id,pos:m.p});
      SKILLS[rid]=row; SKILL_IDS.push(rid); ANIM_OF[row.act[0]]=row.anim||row.act[0]; ACT_SKILL[row.act[0]]=row; SS_PIECE_OF[rid]={set:id,pos:m.p,kind:'active'}; ids.push(rid);
    }
    const pid=id+'_p'+m.p;
    PASSIVES[pid]=ssRow(m.P.passive,pid,{slot:'passive',cls:null,lv,price:0,set:id,pos:m.p},{el:m.el});
    PASSIVE_IDS.push(pid); SS_PIECE_OF[pid]={set:id,pos:m.p,kind:'passive'};
    set.pos[m.p]={slot:m.slot,bound:m.P.bound,from:{kind:m.p<3?'boss':'dungeon',id:src[m.p-1],chance:m.P.from&&m.P.from.chance,pity:m.P.from&&m.P.from.pity},ids,passive:pid,lv,el:m.el};
  }
  for(const t of [3,5]) set.bonus[t]=ssRow(bn[t],id+'_b'+t,{set:id,tier:t,slot:'bonus'},{el:hybrid?D.el[0]:D.el});
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
