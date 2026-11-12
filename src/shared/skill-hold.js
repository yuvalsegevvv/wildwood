//@ Skill 2 with two modes (pure): a tap casts the skill, a hold of at least `secs` casts its held mode (`alt`); the registry SH_ALT of the held rows, their checks (SH_BAD) and the arming rule
/* Agent map. Design: docs/SKILL-HOLD.md; server: server/skill-hold.js; client: game/combat/skill-hold.js; test: tools/skill-hold-smoke.js.
   exports: SH_TAP_MAX (the default secs), SH_SECS ([min, max] of secs), SH_ALT (base piece id -> its held row), SH_BAD ({id, why}: the held modes left out), shDefine(row, alt, taken) (defineSkillSet, shared/skillsets.js,
            calls it for a position-2 entry that carries alt), shAltOf(skillId), shArmed(heldSeconds, h), shCastAb(ab0, h) (the row a held cast really uses), shSkillRow(id) (a SKILLS row, or a held row by its '<piece>_h' id).
   used by: shared/skillsets.js, server/skill-hold.js + server/combat.js handleAttack, game/combat/skill-hold.js, attacks.js (doAttack), skill-vis.js (skvRecipeOf), skillsets/looks.js, procs.js, economy/skills.js (the two modes' text).
   A held row is {id:'<piece>_h', base:'<piece>', set, pos:2, slot:'skill', cls, el, lv, price:0, name, desc, secs, cd (its own, or the base's), range, mult, act, anim, fx}. It is NOT in SKILLS (shops, drops and
   loadouts iterate SKILLS); its act kind is in ACT_SKILL / ANIM_OF so the animation and the drawing find it. ONE slot and ONE cooldown: a held cast is made under the base piece's id (shCastAb), so its skill level,
   the burst's boost, the cast triggers and the cooldown's passives are the piece's. A bad alt leaves the set in and only the held mode out (rule 5). */
const SH_TAP_MAX=0.5, SH_SECS=[0.3,1.2];
const SH_ALT=Object.create(null), SH_BAD=[];
const SH_KEYS=['name','desc','secs','cd','range','mult','act','anim','fx'];
// what is wrong with a position-2 entry's alt (null when nothing); taken: the attack kinds already used inside the set
function shAltProblem(a,taken){
  if(!a||typeof a!=='object'||Array.isArray(a)) return 'alt is {name, desc, secs, mult, range, act, anim, fx, cd}';
  for(const k in a) if(!SH_KEYS.includes(k)) return 'unknown alt key "'+k+'" (known: '+SH_KEYS.join(' ')+')';
  if(typeof a.name!=='string'||!a.name||typeof a.desc!=='string'||!a.desc) return 'alt needs a name and a desc';
  if(a.secs!==undefined&&!(Number.isFinite(a.secs)&&a.secs>=SH_SECS[0]&&a.secs<=SH_SECS[1])) return 'alt.secs is the hold it needs: '+SH_SECS[0]+' to '+SH_SECS[1]+' seconds';
  if(a.cd!==undefined&&!(Number.isFinite(a.cd)&&a.cd>0)) return 'alt.cd is above 0 (or left out: the tap\'s)';
  for(const k of ['range','mult']) if(!(Number.isFinite(a[k])&&a[k]>=0)) return 'alt.'+k+' is a number of 0 or more';
  const t=a.act; if(!Array.isArray(t)||t.length!==3||typeof t[0]!=='string'||!/^[a-z][a-z0-9]*$/.test(t[0])||!(t[1]>0)||!(t[2]>=0&&t[2]<=t[1])) return 'alt.act is [kind, seconds, when it lands] with a lowercase kind';
  if(ACT_SKILL[t[0]]||taken.has(t[0])) return 'alt.act: the attack kind "'+t[0]+'" is already used';
  if(a.anim!==undefined&&!Object.values(ANIM_OF).includes(a.anim)) return 'alt.anim "'+a.anim+'" is not a body animation another skill borrows';
  const f=ssFxProblem(a.fx,false); if(f) return 'alt.'+f;
  if(a.fx.buff) return 'alt.fx cannot be a buff';
  if(!SS_FX_SHAPES.some(k=>a.fx[k])) return 'alt.fx needs a shape ('+SS_FX_SHAPES.join(' ')+')';
  return null;
}
// register the held mode of the built skill row `row` (a position-2 piece); returns the held row or null (listed in SH_BAD)
function shDefine(row,a,taken){
  const id=row.id+'_h', why=shAltProblem(a,taken);
  if(why){ SH_BAD.push({id,why}); if(typeof console!=='undefined') console.warn('held mode '+id+' left out: '+why); return null; }
  taken.add(a.act[0]);
  const h={id,base:row.id,set:row.set,pos:2,slot:'skill',cls:row.cls,el:row.el,lv:row.lv,price:0,name:a.name,desc:a.desc,secs:a.secs===undefined?SH_TAP_MAX:a.secs,cd:a.cd===undefined?row.cd:a.cd,
    range:a.range,mult:a.mult,act:a.act.slice(),anim:a.anim,fx:JSON.parse(JSON.stringify(a.fx))};
  if(h.fx.vs) h.fx.vs.sid=id;
  SH_ALT[row.id]=h; ANIM_OF[h.act[0]]=h.anim||h.act[0]; ACT_SKILL[h.act[0]]=h;
  return h;
}
const shAltOf=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(SH_ALT,id)?SH_ALT[id]:null;
const shArmed=(held,h)=>!!h&&held>=h.secs;
const shCastAb=(ab0,h)=>Object.assign({},h,{id:ab0.id});   // the held row cast under the base piece's id (one slot: its level, cooldown and boosts are the piece's)
function shSkillRow(id){
  if(typeof id!=='string') return null;
  if(Object.prototype.hasOwnProperty.call(SKILLS,id)) return SKILLS[id];
  return /_h$/.test(id)?shAltOf(id.slice(0,-2)):null;
}
