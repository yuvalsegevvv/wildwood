// The power ladder of the skill sets (docs/SKILL-SETS.md 5b): how much damage a set does on one target and on a pack, against the same hero with the best boss and normal skills and no set (= 100): with the
// set's three actives (their bonuses switched off), with the 3-set bonus, the 5-set bonus and all six pieces. Server straight from src/; a bot casts burst, skill and basic as soon as each is ready at a stunned
// dummy (and six more around it for the pack). The numbers are a SANITY BAND, not a verdict (the owner: balanced mostly in playtests): a row outside its band is a warning. --check fails only on the owner's
// orderings, for the damage kits: the pieces beat the best non-set loadout, the 3-set beats the pieces, the 5-set beats the 3-set.
// Usage: node tools/skillsets-ladder.js [--set <id>] [--class warrior|archer|mage] [--secs 60] [--check]      (the sets are the ones registered from src/manifest.json)
// Also: require('./skillsets-ladder').ladder({W, x, pid}, opts) for a test (tools/skillsets-smoke.js runs it on a fixture); x must expose NAMES.
const {loadServer}=require('./load');
const NAMES=['MONS','SKILLS','SKILL_IDS','SS_SETS','SS_ORDER','abilityOf','abilityCd','clsOfP','recalcP','ssEquipPieceP','ssGrantSetP','getH','VIL'];
const WEAPON={warrior:'sword1',archer:'bow1',mage:'staff1'}, CLASSES=['warrior','archer','mage'];
// the bands in percent of the baseline: [the pieces alone, the 3-set, the 5-set] (docs/SKILL-SETS.md 5b; a mixed set sits between a support's 90 and its main kit's ladder)
const BANDS={safe:[110,125,150],risk:[125,142,170],support:[90,90,90],heal:[90,90,90],tank:[90,90,90],grind:[50,50,50]};
function ladder(env,opts){
  opts=opts||{}; const {W,x}=env, secs=opts.secs||60, classes=opts.classes||CLASSES, p=W.players.get(env.pid), out=[];
  const R=Math.random; let seed=12345; const seeded=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const dummies=x.MONS.filter(m=>!m.boss&&!m.inst&&!m.dead).slice(0,7), spot=[];
  // the hero stands in the village (nothing attacks there) with the dummy 2.4 m ahead (the way he faces) and six more around it
  const arrange=()=>{
    W.setPos(env.pid,[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,Math.PI,0,0]); p.face=Math.PI;
    dummies.forEach((m,i)=>{ const a=(i-1)/6*Math.PI*2, c=[p.x,p.z+2.4]; spot[i]=i===0?c:[c[0]+Math.sin(a)*3.5,c[1]+Math.cos(a)*3.5];
      m.dead=false; m.remove=false; m.hp=m.maxHp=1e12; m.slowT=m.burnT=0; m.mk=m.st=m.aura=m.rxIcd=m.taunt=null; m.immune=false; m.aggro=false; });
  };
  const pin=()=>dummies.forEach((m,i)=>{ m.x=spot[i][0]; m.z=spot[i][1]; m.kbx=m.kbz=0; m.vx=m.vz=0; m.stunT=1e9; });
  const fresh=()=>{ arrange(); pin(); p.dead=false; p.hp=p.maxHp; p.act=null; p.cd={basic:0,skill:0,burst:0}; p.ssIcd={}; p.ally=null; p.shield=null; p.buff=null; p.lastDealt=-99; x.recalcP(p); };
  const cast=k=>W.receive(env.pid,{t:'atk',k,tg:dummies[0].id,face:Math.PI,aim:[0,0,1]});
  // seconds of the rotation (burst, then skill, then basic, whichever is ready): damage a second to the dummy and to all seven
  const rotation=s=>{
    fresh(); const h0=dummies.map(m=>m.hp); Math.random=seeded;
    try{ for(let t=0;t<s/0.05;t++){ p.dead=false; p.hp=p.maxHp; pin();
      if(!p.act) for(const k of ['burst','skill','basic']) if(p.cd[k]<=0.08&&x.abilityOf(x.clsOfP(p),k,p.gear.skills,p.level)){ cast(k); break; }
      W.tick(0.05); } } finally{ Math.random=R; }
    const lost=dummies.map((m,i)=>h0[i]-m.hp);
    return {single:lost[0]/s,pack:lost.reduce((a,b)=>a+b,0)/s};
  };
  // one cast of one slot and what it does in 6 s (zones and projectiles included), over its cooldown: the damage a second that skill is worth
  const castValue=(slot,cd)=>{
    fresh(); const h0=dummies[0].hp; Math.random=seeded;
    try{ cast(slot); for(let t=0;t<120;t++){ p.dead=false; p.hp=p.maxHp; pin(); W.tick(0.05); } } finally{ Math.random=R; }
    return (h0-dummies[0].hp)/Math.max(0.5,cd);
  };
  const wear=(cls,ids,pass)=>{
    const S=p.gear.skills; for(const c of CLASSES) S.eq[c]={basic:null,skill:null,burst:null}; S.pass=new Array(S.pass.length).fill(null);
    p.gear.eq.weapon=WEAPON[cls]; if(!p.gear.inv.includes(WEAPON[cls])) p.gear.inv.push(WEAPON[cls]);
    for(const id of ids){ const s=x.SKILLS[id]; if(s.set) x.ssEquipPieceP(p,s); else S.eq[cls][s.slot]=id; }
    (pass||[]).forEach((id,i)=>{ S.pass[i]=id; }); x.recalcP(p);
  };
  p.level=60; p.gear.skills.owned=[...new Set([...p.gear.skills.owned,...x.SKILL_IDS])]; for(const id of x.SKILL_IDS) p.gear.skills.lv[id]=5;   // everything learned, boss skills too, all at level 5
  p.gear.skills.pass=new Array(p.gear.skills.pass.length).fill(null);
  const baseline={};
  for(const cls of classes){
    const best={};
    for(const slot of ['basic','skill','burst']){
      let top=null, topV=-1;
      for(const id of x.SKILL_IDS){ const s=x.SKILLS[id]; if(s.set||s.cls!==cls||s.slot!==slot||s.lv>60) continue;
        wear(cls,[id],[]); const v=castValue(slot,x.abilityCd(s,p.gear.skills,60,cls)); if(v>topV){ topV=v; top=id; } }
      best[slot]=top;
    }
    wear(cls,[best.basic,best.skill,best.burst],[]); baseline[cls]=Object.assign({ids:best},rotation(secs));
  }
  for(const id of x.SS_ORDER){
    if(opts.set&&opts.set!==id) continue;
    const S=x.SS_SETS[id], rows={}, P=[1,2,3].map(n=>S.pos[n]), bonus=S.bonus;
    const inert={}; for(const t of [3,5]) inert[t]=Object.assign({},bonus[t],{stat:'inert',v:[0,0],on:undefined,amp:undefined,cost:undefined});
    x.ssGrantSetP(p,id);
    for(const cls of classes){
      const ids=P.map(q=>q.bound==='any'?q.ids[0]:q.ids.find(i=>x.SKILLS[i].cls===cls)), pass=P.map(q=>q.passive);
      S.bonus=inert; wear(cls,ids,[]); const pieces=rotation(secs); S.bonus=bonus;
      wear(cls,ids,[]); const three=rotation(secs);
      wear(cls,ids,[pass[0],pass[1]]); const five=rotation(secs);
      wear(cls,ids,pass); const six=rotation(secs);
      rows[cls]={base:baseline[cls],pieces,three,five,six};
    }
    out.push({id,role:S.role.main,also:S.role.also?S.role.also.role:null,rows,summary:summarize(rows,classes)});
  }
  return out;
}
const pct=(a,b)=>b>0?Math.round(a/b*100):0;
// the average over the classes tested of each configuration's damage as a percent of that class's baseline
function summarize(rows,classes){
  const avg=f=>classes.reduce((a,c)=>a+f(rows[c]),0)/classes.length, S={};
  for(const k of ['pieces','three','five','six']){ S[k]=Math.round(avg(r=>pct(r[k].single,r.base.single))); S[k+'Pack']=Math.round(avg(r=>pct(r[k].pack,r.base.pack))); }
  return S;
}
// the warnings for a set (a row outside its sanity band) and the failures of the owner's orderings
function judge(set){
  const S=set.summary, band=set.also?null:BANDS[set.role], warn=[], fail=[];
  if(band){ [['pieces',band[0]],['three',band[1]],['five',band[2]]].forEach(([k,v])=>{ if(S[k]<v*0.75||S[k]>v*1.25) warn.push(k+' '+S[k]+' is outside '+v+' +- 25%'); }); }
  else if(set.also){ if(S.three<90||S.five>170) warn.push('a mixed set sits between 90 and its main kit\'s ladder: 3-set '+S.three+', 5-set '+S.five); }
  if(set.role==='grind'&&S.fivePack<120) warn.push('the pack damage ('+S.fivePack+') is not ahead of the baseline: a grinder should farm about twice as fast');
  if(!set.also&&(set.role==='risk'||set.role==='safe')){
    if(S.pieces<100) fail.push('the three pieces ('+S.pieces+') do not beat the best non-set loadout (100)');
    if(S.three<=S.pieces) fail.push('the 3-set bonus ('+S.three+') does not beat the pieces alone ('+S.pieces+')');
    if(S.five<=S.three) fail.push('the 5-set bonus ('+S.five+') does not beat the 3-set ('+S.three+')');
  }
  return {warn,fail};
}
function print(list){
  console.log('single target, in % of the baseline (the best non-set loadout = 100); the pack is the same on seven monsters\n');
  console.log('set'.padEnd(12)+'role'.padEnd(9)+'pieces'.padStart(8)+'3-set'.padStart(8)+'5-set'.padStart(8)+'all 6'.padStart(8)+'   pack at 5-set');
  for(const s of list){
    const S=s.summary; console.log(s.id.padEnd(12)+(s.role+(s.also?'+'+s.also:'')).padEnd(9)+String(S.pieces).padStart(8)+String(S.three).padStart(8)+String(S.five).padStart(8)+String(S.six).padStart(8)+'   '+S.fivePack);
    const j=judge(s); for(const w of j.warn) console.log('   warning: '+w); for(const f of j.fail) console.log('   FAIL: '+f);
  }
}
module.exports={ladder,judge,summarize,print,BANDS,NAMES};
if(require.main===module){
  const args=process.argv.slice(2), val=(f,d)=>{ const i=args.indexOf(f); return i>=0?args[i+1]:d; };
  const {api:W,x}=loadServer({dev:true,send(){}},NAMES); W.join('l',{name:'Ladder',look:{cls:'warrior'},save:{level:60}}); for(let i=0;i<3;i++) W.tick(0.05);
  if(!x.SS_ORDER.length){ console.log('no skill set is defined (src/shared/skillsets/*.js, listed in src/manifest.json)'); process.exit(0); }
  const cls=val('--class',null), list=ladder({W,x,pid:'l'},{secs:+val('--secs',60),set:val('--set',null),classes:cls?[cls]:undefined});
  print(list);
  const bad=list.filter(s=>judge(s).fail.length);
  if(args.includes('--check')&&bad.length){ console.log('\n'+bad.length+' set(s) fail the owner\'s orderings'); process.exit(1); }
}
