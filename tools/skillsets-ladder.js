// The power ladder of the skill sets (docs/SKILL-SETS.md 5b): how much damage a set does on one target and on a pack, against the same hero with the best boss and normal skills and no set (= 100): with the
// set's three actives (their bonuses switched off), with the 3-set bonus, the 5-set bonus and all six pieces. Server straight from src/; a bot casts burst, skill and basic as soon as each is ready at a stunned
// dummy (and six more around it for the pack). The numbers are a SANITY BAND, not a verdict (the owner: balanced mostly in playtests): a row outside its band is a warning. --check fails only on the owner's
// orderings, for the damage kits: the pieces beat the best non-set loadout, the 3-set beats the pieces, the 5-set beats the 3-set.
// A set with rangeScale (damage grows with the distance) is also run from 16 m (archer and mage). A risk set is run twice: never behind its targets (careless play, ~0.8 of the safe ladder, warnings only) and always behind (the dummies face away: the owner's 125 / 142 / 170, judged).
// --combo (docs/skillkits/COMBO-REWORK.md E5): a set with kit.combo {order:[a,b], win} is also played in its order: the bot holds b until a was cast within win seconds (unless a's cooldown left is longer than b's own: waiting
//   would cost a whole cast of b), and a burst `a` that spends the kit's mark (a pop) waits for the full stack on the target (at most 10 s); both columns are printed, plain (careless) and in order.
// Usage: node tools/skillsets-ladder.js [--matrix | --bond 0-6 --awk A0-A5 [--guest]] [--wanderer [--path fury]] [--set <id>] [--class warrior|archer|mage] [--secs 60] [--check] [--cave] [--combo] [--orders [--runs N]]  (the slot-4 column doubles the run time, so --check leaves it out unless --cave is given)      (the sets are the ones registered from src/manifest.json)
// Also: require('./skillsets-ladder').ladder({W, x, pid}, opts) for a test (tools/skillsets-smoke.js runs it on a fixture); x must expose NAMES.
const {loadServer}=require('./load');
const NAMES=['ULT_SKILLS','ULT_ACTIVE_PIECES','MONS','SKILLS','SKILL_IDS','SS_SETS','SS_ORDER','abilityOf','abilityCd','clsOfP','recalcP','ssEquipPieceP','ssGrantSetP','CAVE_SKILLS','CAVE_SKILL_IDS','getH','VIL','S','ssBonusSwitch','awkMigGrant','bdGrantP','bdSetOk','WD_PATHS','WD_ORDER','MQ','awkGrantP','AWK_TIERS','skillLvOf','ssMarkN'];
const WEAPON={warrior:'sword1',archer:'bow1',mage:'wand1'}, CLASSES=['warrior','archer','mage'];
// the bands in percent of the baseline: [the pieces alone, the 3-set, the 5-set] (docs/SKILL-SETS.md 5b; a mixed set sits between a support's 90 and its main kit's ladder)
// the same tree measured 93 to 99 for one set's pieces and 128 vs 131 for another's 5- and 3-set between runs (also before the Amber Reach), so the orderings carry this much slack
const LADDER_NOISE=4, LADDER_NOISE_FLOOR=92;
const BANDS={safe:[110,125,150],risk:[125,142,170],riskCareless:[88,100,120],support:[90,90,90],heal:[90,90,90],tank:[90,90,90],grind:[50,50,50]};
function ladder(env,opts){
  opts=opts||{}; const {W,x}=env, secs=opts.secs||60, classes=opts.classes||(opts.dist>4?['archer','mage']:CLASSES), p=W.players.get(env.pid), out=[];
  // castCave false: the charge skill is worn (a Bond counts it) but never cast; combo: the set's kit.combo while --combo plays it (set per set below)
  const R=Math.random; let seed=12345+(opts.seed|0)*7919, castCave=true, combo=null, order=null; const seeded=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const dummies=x.MONS.filter(m=>!m.boss&&!m.inst&&!m.dead).slice(0,7), spot=[];
  // the hero stands in the village (nothing attacks there) with the dummy 2.4 m ahead (the way he faces) and six more around it
  const arrange=()=>{
    W.setPos(env.pid,[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,Math.PI,0,0]); p.face=Math.PI;
    dummies.forEach((m,i)=>{ const a=(i-1)/6*Math.PI*2, c=[p.x,p.z+2.4]; spot[i]=i===0?c:[c[0]+Math.sin(a)*3.5,c[1]+Math.cos(a)*3.5];
      m.face=opts.behind?Math.PI:0; m.dead=false; m.remove=false; m.hp=m.maxHp=1e12; m.slowT=m.burnT=0; m.mk=m.st=m.taunt=null; m.immune=false; m.aggro=false; });
  };
  const pin=()=>dummies.forEach((m,i)=>{ m.x=spot[i][0]; m.z=spot[i][1]; m.kbx=m.kbz=0; m.vx=m.vz=0; m.stunT=1e9; });
  const fresh=()=>{ arrange(); pin(); p.dead=false; p.hp=p.maxHp; p.act=null; p.cd={basic:0,skill:0,burst:0,cave:0,ult:0}; p.ultB=null; p.ultV=null; p.cave.charge=0; p.ssIcd={}; p.ally=null; p.shield=null; p.buff=null; p.lastDealt=-99; x.recalcP(p); };
  const last={}, cast=k=>{ const a0=p.act; W.receive(env.pid,{t:'atk',k,tg:dummies[0].id,face:Math.PI,aim:[0,0,1]}); if(p.act&&p.act!==a0) last[k]=x.S.t; };
  // --combo: should slot k wait (kit.combo's order)?
  let popReady=null;
  const held=k=>{
    if(order==='hold'&&k==='burst'){ const ab=s=>x.abilityOf(x.clsOfP(p),s,p.gear.skills,p.level); return !!ab('skill')&&x.S.t-(last.skill===undefined?-1e9:last.skill)>4; }   // --orders 'hold': the burst waits for a skill cast within 4 s
    if(!combo) return false; const [a,b]=combo.order, ab=s=>x.abilityOf(x.clsOfP(p),s,p.gear.skills,p.level);
    if(k===b){ if(x.S.t-(last[a]===undefined?-1e9:last[a])<=combo.win||!ab(a)) return false; const B=ab(b); return p.cd[a]<=x.abilityCd(B,p.gear.skills,p.level,x.clsOfP(p)); }
    if(k===a&&a==='burst'&&combo.mark){ const A=ab(a); if(!A||!A.fx||!A.fx.pop||A.fx.pop.id!==combo.mark) return false; if(popReady===null) popReady=x.S.t;
      if(x.ssMarkN(p,dummies[0],combo.mark)>=combo.max||x.S.t-popReady>10){ popReady=null; return false; } return true; }
    return false; };
  // seconds of the rotation (burst, then skill, then basic, whichever is ready): damage a second to the dummy and to all seven
  const rotation=s=>{
    fresh(); const h0=dummies.map(m=>m.hp); Math.random=seeded; for(const k of Object.keys(last)) delete last[k]; popReady=null;
    const home=[p.x,p.z], sgn=opts.behind?1:-1;
    try{ for(let t=0;t<s/0.05;t++){ p.dead=false; p.hp=p.maxHp; pin();
      // good play and careless play of a position set: the hero is always on the move (Light Feet), walks back after a dash, and the dummies keep their backs to him (opts.behind) or keep facing him
      p.lastMove=x.S.t; if(Math.hypot(p.x-home[0],p.z-home[1])>0.3){ const f=p.face; W.setPos(env.pid,[home[0],x.getH(home[0],home[1]),home[1],f,0,0]); }
      for(const m of dummies) m.face=Math.atan2(sgn*(p.x-m.x),sgn*(p.z-m.z));
      if(!p.act&&castCave&&p.gear.skills.cave&&p.cave.charge>=x.CAVE_SKILLS[p.gear.skills.cave].cost&&p.cd.cave<=0.08) cast('cave');   // slot 4 (C3): spends its charge as soon as it can
      if(!p.act&&opts.ultOn&&p.gear.skills.ult&&p.cd.ult<=0.08) cast('ult');   // slot 5 (docs/ULT.md): the burst as soon as it is ready
      if(!p.act) for(const k of order==='skill'?['skill','burst','basic']:['burst','skill','basic']) if(p.cd[k]<=0.08&&x.abilityOf(x.clsOfP(p),k,p.gear.skills,p.level)&&!held(k)){ cast(k); break; }
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
  if(x.awkMigGrant) for(const id of x.SS_ORDER) x.awkMigGrant(p.gear,id,{ba:5,sk:5,po:5,pa:5,ch:5,bu:1});   // awakening: a set piece's level is its branch: the same level 5 (and the burst's bu1)
  p.gear.skills.pass=new Array(p.gear.skills.pass.length).fill(null);
  // point mode (--bond / --awk / --guest, step 20): every tree at one tier (all its nodes: the branches at the tier's cap and its stat nodes), the baseline's shop skills at the Wanderer's branches of
  // the same tier (their saved level 1), so a set is measured against the best non-set loadout of a hiker as far along
  const PT=opts.point, tierOf=()=>{ for(const k of Object.keys(p.gear.awk||{})) delete p.gear.awk[k]; };
  const tree=(k,t)=>{ if(p.gear.awk) delete p.gear.awk[k]; x.awkGrantP(p,k,t); };
  if(PT){ tierOf(); for(const id of x.SKILL_IDS) if(!x.SKILLS[id].set) p.gear.skills.lv[id]=1; tree('wanderer',PT.awk); }
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
  if(opts.wanderer) return wandererRows(opts.wanderer);
  // the Wanderer (step 18, --wanderer): the baseline's general skills plus the path passive (level 5, its pa branch) at Realization 0, II and VI (the main quest's acts set it: II after act II, VI after
  // act IV), as the sets are measured at Bond 0, II and VI; the path burst is worn but not cast (like a set's at Bond VI), then one more VI rotation casting it (the `burst` column: its gain)
  function wandererRows(path){
    const P=x.WD_PATHS&&x.WD_PATHS[path]; if(!P) return out;
    const lastOf=L=>{ let i=-1; x.MQ.forEach((q,k)=>{ if(q.id[0]===L) i=k; }); return i; }, mq0=p.gear.mq.s, B=p.gear.bd.wanderer||(p.gear.bd.wanderer={r:0});
    B.path=path; x.awkMigGrant(p.gear,'wanderer',{pa:5,bu:1}); const rows={};
    try{ for(const cls of classes){ const ids=baseline[cls].ids;
      const at=s=>{ p.gear.mq.s=s; wear(cls,[ids.basic,ids.skill,ids.burst],[P.passive]); p.gear.skills.ult=P.ult; x.recalcP(p); return rotation(secs); };
      const pieces=at(0), three=at(lastOf('V')+1), five=at(lastOf('G')+1); opts.ultOn=true; const ult=rotation(secs); opts.ultOn=false;
      rows[cls]={base:baseline[cls],pieces,three,five,six:five,ult:{burst:ult}}; } }
    finally{ p.gear.mq.s=mq0; p.gear.skills.ult=null; opts.ultOn=false; }
    const S=summarize(rows,classes); S.burst=Math.round(classes.reduce((a,c)=>a+pct(rows[c].ult.burst.single,rows[c].five.single),0)/classes.length)-100;
    out.push({id:'wanderer:'+path,role:P.role,also:null,ranged:false,rows,summary:S});
    return out;
  }
  for(const id of x.SS_ORDER){   // (ranged below: the damage GROWS with the distance, a k under 1 is a close-range bonus)
    if(opts.set&&opts.set!==id) continue;
    const S=x.SS_SETS[id], rows={}, P=[1,2,3].map(n=>S.pos[n]), bonus=S.bonus;
    order=opts.order||null;   // --orders: the bot's press order ('skill': skill before burst; 'hold': burst only after a skill)
    combo=null; if(opts.combo){ if(!S.kit||!S.kit.combo) continue;   // --combo: only the sets that name an order
      const mk=S.kit.mark; let max=0; for(const sid of x.SKILL_IDS){ const r=x.SKILLS[sid]; if(r.set!==id||!r.fx) continue; for(const sh of Object.values(r.fx)) if(sh&&sh.mark&&sh.mark.id===mk) max=Math.max(max,sh.mark.max||5); }
      combo={order:S.kit.combo.order,win:S.kit.combo.win,mark:mk||null,max:max||5}; }
    const inert={}; for(const t of [3,5]) inert[t]=Object.assign({},bonus[t],{stat:'inert',v:[0,0],on:undefined,amp:undefined,cost:undefined});
    x.ssGrantSetP(p,id);
    for(const cls of classes){
      const ids=P.map(q=>q.bound==='any'?q.ids[0]:q.ids.find(i=>x.SKILLS[i].cls===cls)), pass=P.map(q=>q.passive);
      if(!ids.every(Boolean)) continue;   // basic-hold: skill 1 belongs to one class, the other classes have no version of the set
      // bond: the rows are Bond II (the 3-set row) and Bond VI (the 5-set row) now, in force while that many of the character's pieces are worn (server/bond.js). A set with Bonds is measured at
      // Bond 0 (the pieces alone), Bond II with its three actives (the 3-set row and the Bond I passive) and Bond VI with all six places worn (the actives, the kept passive, the charge skill and the
      // burst, those two worn for the count only, never cast: both rows, both Bond passives and the two +1 levels); a set without Bonds (a test fixture) the old way
      const bd=x.bdSetOk&&x.bdSetOk(id)?(x.bdGrantP(p,id,6),p.gear.bd[id]):null, cs0=(x.CAVE_SKILL_IDS||[]).map(i=>x.CAVE_SKILLS[i]).find(q=>q.set===id);
      let pieces, three, five, six;
      if(PT&&bd){   // one point: Bond PT.bond, the tree at PT.awk, wearing what that tier opens (A0 the three actives, A1 + the kept passive, A2 + the charge skill, A3 + the burst; those two worn, never cast)
        const t=PT.awk, wearAt=list=>{ wear(cls,list,t>=1&&S.keptPassive?[S.keptPassive]:[]); p.gear.skills.cave=t>=2&&cs0&&p.gear.cave.own[cs0.id]?cs0.id:null; p.gear.skills.ult=t>=3&&x.ULT_SKILLS&&x.ULT_SKILLS[id]?id:null; x.recalcP(p); };
        const off=()=>{ p.gear.skills.cave=null; p.gear.skills.ult=null; };
        tree(id,t); bd.b=PT.bond; castCave=false; wearAt(ids); const act=p.gear.skills.bdx.act; pieces=rotation(secs);
        // --guest: the skill (position 2) is another set's piece of the same class (the next set in SS_ORDER that has one), its tree at the same tier: what one guest costs
        let guest=null; if(PT.guest){ const n=x.SS_ORDER.length, i0=x.SS_ORDER.indexOf(id);
          for(let j=1;j<n&&!guest;j++){ const gid=x.SS_ORDER[(i0+j)%n], G=x.SS_SETS[gid]; if(G.dev||!x.bdSetOk(gid)) continue; const q=G.pos[2], gi=q.bound==='any'?q.ids[0]:q.ids.find(i=>x.SKILLS[i].cls===cls); if(!gi) continue;
            x.ssGrantSetP(p,gid); tree(gid,t); wearAt([ids[0],gi,ids[2]]); guest={id:gid,skill:gi,act:p.gear.skills.bdx.act,lv:x.skillLvOf(p.gear.skills,gi),res:rotation(secs)}; } }
        castCave=true; off(); wear(cls,ids,[]);
        rows[cls]={base:baseline[cls],pieces,three:pieces,five:pieces,six:pieces,act,guest};
        continue;
      }
      if(bd){
        const all6=()=>{ wear(cls,ids,[S.keptPassive]); if(cs0){ p.gear.cave.own[cs0.id]=1; p.gear.skills.cave=cs0.id; } p.gear.skills.ult=x.ULT_SKILLS&&x.ULT_SKILLS[id]?id:null; x.recalcP(p); };
        const off=()=>{ if(cs0){ p.gear.skills.cave=null; delete p.gear.cave.own[cs0.id]; } p.gear.skills.ult=null; };
        bd.b=0; wear(cls,ids,[]); pieces=rotation(secs);
        bd.b=2; wear(cls,ids,[]); three=rotation(secs);
        bd.b=6; castCave=false; all6(); five=rotation(secs); castCave=true; off(); six=five;
      } else {
        S.bonus=inert; wear(cls,ids,[]); pieces=rotation(secs); S.bonus=bonus;
        wear(cls,ids,[]); three=rotation(secs);
        wear(cls,ids,[pass[0],pass[1]]); five=rotation(secs);
        wear(cls,ids,pass); six=rotation(secs);
      }
      if(bd) wear(cls,ids,[S.keptPassive]);   // (slot 4 below: on top of the actives and the kept passive at Bond VI)
      // slot 4 (docs/CAVE.md): the set's own cave skill at level 1 and 5 on top of all six pieces; its charge is fed by the casts, doubled for this set's pieces
      let c1=null, c5=null; const cs=(x.CAVE_SKILL_IDS||[]).map(i=>x.CAVE_SKILLS[i]).find(q=>q.set===id);   // a harness without the cave names (skillsets-smoke) skips slot 4
      if(cs&&opts.cave!==false){ p.gear.cave.own[cs.id]=1; p.gear.skills.cave=cs.id; c1=rotation(secs); p.gear.cave.own[cs.id]=5; c5=rotation(secs); p.gear.skills.cave=null; delete p.gear.cave.own[cs.id]; }
      // slot 5 (docs/ULT.md): one 60 s rotation with the burst and no boost, with only its active boost, only its passive boost, both: each gain over the same rotation without the burst
      let ult=null; const U=opts.ult&&x.ULT_SKILLS?x.ULT_SKILLS[id]:null;   // (a harness without the ult names skips slot 5)
      if(opts.ult&&U){ const all=U.boost, isAct=b=>x.ULT_ACTIVE_PIECES.includes(b.piece); p.gear.skills.ult=id; opts.ultOn=true; ult={};
        try{ for(const [k,keep] of [['none',()=>false],['active',isAct],['passive',b=>!isAct(b)],['both',()=>true]]){ U.boost=all.filter(keep); ult[k]=rotation(secs); } } finally{ U.boost=all; opts.ultOn=false; p.gear.skills.ult=null; } }
      rows[cls]={base:baseline[cls],pieces,three,five,six,c1,c5,ult};
    }
    out.push({id,cave:((x.CAVE_SKILL_IDS||[]).map(i=>x.CAVE_SKILLS[i]).find(q=>q.set===id)||{}).id||null,role:S.role.main,also:S.role.also?S.role.also.role:null,ranged:P.some(q=>q.ids.some(i=>{ const R=x.SKILLS[i].fx&&x.SKILLS[i].fx.rangeScale; return !!R&&R.k>1; })),rows,summary:summarize(rows,classes)});
  }
  return out;
}
const pct=(a,b)=>b>0?Math.round(a/b*100):0;
// the average over the classes tested of each configuration's damage as a percent of that class's baseline
function summarize(rows,classes){
  classes=classes.filter(c=>rows[c]);   // basic-hold: a set's skill 1 is for one class, only that class has a row
  const avg=f=>classes.reduce((a,c)=>a+f(rows[c]),0)/classes.length, S={};
  for(const k of ['pieces','three','five','six']){ S[k]=Math.round(avg(r=>pct(r[k].single,r.base.single))); S[k+'Pack']=Math.round(avg(r=>pct(r[k].pack,r.base.pack))); }
  if(classes.some(c=>rows[c].guest)){ const gs=classes.filter(c=>rows[c].guest); S.guest=Math.round(gs.reduce((a,c)=>a+pct(rows[c].guest.res.single,rows[c].pieces.single),0)/gs.length)-100; S.guestPack=Math.round(gs.reduce((a,c)=>a+pct(rows[c].guest.res.pack,rows[c].pieces.pack),0)/gs.length)-100; }
  if(classes.every(c=>rows[c].c1)){   // the slot-4 column: the gain over the full set (all 6), in percent, single target; level 1 and level 5
    S.cave1=Math.round(avg(r=>pct(r.c1.single,r.six.single))-100); S.cave5=Math.round(avg(r=>pct(r.c5.single,r.six.single))-100);
    S.cave1Pack=Math.round(avg(r=>pct(r.c1.pack,r.six.pack))-100); S.cave5Pack=Math.round(avg(r=>pct(r.c5.pack,r.six.pack))-100); }
  return S;
}
// the warnings for a set (a row outside its sanity band) and the failures of the owner's orderings
function judge(set,mode){   // mode: 'behind' (a risk set always behind its target) or 'range' (a set whose damage grows with the distance, fought from afar); without it those sets are only warned about   // a risk set is judged twice: always behind its targets (the owner's 125 / 142 / 170) and never behind (careless play: 0.8 of the safe ladder, warnings only)
  const S=set.summary, careless=(set.role==='risk'&&mode!=='behind')||(set.ranged&&mode!=='range'), band=set.also||(set.ranged&&mode!=='range')?null:BANDS[careless?'riskCareless':set.role], warn=[], fail=[];
  if(band){ [['pieces',band[0]],['three',band[1]],['five',band[2]]].forEach(([k,v])=>{ if(S[k]<v*0.75||S[k]>v*1.25) warn.push(k+' '+S[k]+' is outside '+v+' +- 25%'); }); }
  else if(set.also){ if(S.three<90||S.five>170) warn.push('a mixed set sits between 90 and its main kit\'s ladder: 3-set '+S.three+', 5-set '+S.five); }
  if(S.cave1!==undefined&&!careless&&(S.cave1>20||S.cave5>30)) warn.push('slot 4 adds '+S.cave1+'% at level 1 and '+S.cave5+'% at level 5 (target +8% / +12%)');
  if(S.six>165&&!careless) warn.push('the full set ('+S.six+') is over about 165');
  if(set.role==='grind'&&S.fivePack<120) warn.push('the pack damage ('+S.fivePack+') is not ahead of the baseline: a grinder should farm about twice as fast');
  if(!set.also&&!careless&&(set.role==='risk'||set.role==='safe')){
    if(S.pieces<LADDER_NOISE_FLOOR) fail.push('the three pieces ('+S.pieces+') do not beat the best non-set loadout (100)');
    if(S.three<S.pieces-LADDER_NOISE) fail.push('the 3-set bonus ('+S.three+') does not beat the pieces alone ('+S.pieces+')');
    if(S.five<S.three-LADDER_NOISE) fail.push('the 5-set bonus ('+S.five+') does not beat the 3-set ('+S.three+')');
  }
  return {warn,fail};
}
function print(list,mode){
  console.log((mode==='behind'?'ALWAYS BEHIND the target (good play of a risk set: the owner\'s 125 / 142 / 170), ':mode==='range'?'FROM 16 m (archer and mage only; a set whose damage grows with the distance), ':'')+'single target, in % of the baseline (the best non-set loadout = 100); the pack is the same on seven monsters\n');
  console.log('set'.padEnd(12)+'role'.padEnd(9)+'pieces'.padStart(8)+'3-set'.padStart(8)+'5-set'.padStart(8)+'all 6'.padStart(8)+'   pack at 5-set   slot 4 (gain over all 6, target +8 / +12): L1 / L5, pack L1 / L5');
  for(const s of list){
    const S=s.summary; console.log(s.id.padEnd(12)+(s.role+(s.also?'+'+s.also:'')).padEnd(9)+String(S.pieces).padStart(8)+String(S.three).padStart(8)+String(S.five).padStart(8)+String(S.six).padStart(8)+'   '+String(S.fivePack).padEnd(14)+(S.cave1===undefined?'':'   '+s.cave+' '+(S.cave1>=0?'+':'')+S.cave1+' / '+(S.cave5>=0?'+':'')+S.cave5+', pack '+S.cave1Pack+' / '+S.cave5Pack));
    const j=judge(s,mode); for(const w of j.warn) console.log('   warning: '+w); for(const f of j.fail) console.log('   FAIL: '+f);
  }
}
// the burst's gain, in percent over the same rotation without it, single target and pack, averaged over the classes: [no boost, active boost only, passive boost only, both]. The passive boost should land within +-25% of the active one
function ultRow(set,classes){
  const cs=classes.filter(c=>set.rows[c]&&set.rows[c].ult); if(!cs.length) return null;
  const g=(k,f)=>Math.round(cs.reduce((a,c)=>{ const r=set.rows[c]; return a+(r.ult[k][f]/Math.max(1,r.six[f])-1)*100; },0)/cs.length);
  return ['none','active','passive','both'].map(k=>[g(k,'single'),g(k,'pack')]);
}
// --wanderer: each path (or --path <id>) at Realization 0 / II / VI next to the damage sets' Bond 0 / II / VI (safe sets as measured, risk sets always behind: the rows the ladder judges); the target
// (PLAN section 7): a damage path at about 80% of the average damage set at Bond VI, a tank path in the tank band (about 90 of the baseline's damage)
const WD_TARGET=0.8;
function wandererReport(env,opts,paths){
  const runs=paths.map(path=>ladder(env,Object.assign({},opts,{wanderer:path}))[0]).filter(Boolean);   // (the paths first: a set's run leaves grants behind that the Wanderer's must not see)
  const dmg=env.x.SS_ORDER.filter(id=>{ const S=env.x.SS_SETS[id]; return !S.dev&&!S.role.also&&(S.role.main==='risk'||S.role.main==='safe'); }), sets=[];
  for(const id of dmg){ const S=env.x.SS_SETS[id]; sets.push(...ladder(env,Object.assign({},opts,{set:id,cave:false,behind:S.role.main==='risk'}))); }
  const avg=k=>Math.round(sets.reduce((a,s)=>a+s.summary[k],0)/Math.max(1,sets.length));
  const A={pieces:avg('pieces'),three:avg('three'),five:avg('five')};
  console.log('the damage sets ('+sets.map(s=>s.id).join(' ')+'; risk ones always behind), average in % of the baseline: Bond 0 '+A.pieces+', Bond II '+A.three+', Bond VI '+A.five+'  ->  80% of Bond VI = '+Math.round(A.five*WD_TARGET)+'\n');
  console.log('path'.padEnd(20)+'role'.padEnd(7)+'R0'.padStart(6)+'R II'.padStart(7)+'R VI'.padStart(7)+'  vs sets (R0 / II / VI)'.padEnd(26)+'pack VI'.padStart(9)+'  burst (gain at VI)');
  const res=[];
  for(const w of runs){ const path=w.id.slice(9), S=w.summary, r=k=>Math.round(S[k]/A[k]*100);
    console.log(w.id.padEnd(20)+w.role.padEnd(7)+String(S.pieces).padStart(6)+String(S.three).padStart(7)+String(S.five).padStart(7)+('  '+r('pieces')+'% / '+r('three')+'% / '+r('five')+'%').padEnd(26)+String(S.fivePack).padStart(9)+'  +'+S.burst+'%');
    const tank=w.role==='tank', band=BANDS[w.role], warn=tank||band&&band[0]<100?(S.five<band[2]*0.75||S.five>band[2]*1.25?'outside its band '+band[2]+' +- 25%':''):(r('five')<70||r('five')>90?'Bond VI ratio '+r('five')+'% is outside 80 +- 10':'');
    if(warn) console.log('   warning: '+warn);
    res.push({id:path,summary:S,ratio:r('five'),sets:A}); }
  return res;
}
module.exports={ultRow,ladder,wandererReport,judge,summarize,print,BANDS,NAMES};
if(require.main===module){
  const args=process.argv.slice(2), val=(f,d)=>{ const i=args.indexOf(f); return i>=0?args[i+1]:d; };
  const {api:W,x}=loadServer({dev:true,send(){}},NAMES);   // bond: the set rows are Bond II / VI (server/bond.js): the ladder grants the Bonds and wears the pieces they ask for
  W.join('l',{name:'Ladder',look:{cls:'warrior'},save:{level:60}}); for(let i=0;i<3;i++) W.tick(0.05);
  if(!x.SS_ORDER.length){ console.log('no skill set is defined (src/shared/skillsets/*.js, listed in src/manifest.json)'); process.exit(0); }
  const cls=val('--class',null), opts={secs:+val('--secs',60),set:val('--set',null),classes:cls?[cls]:undefined,cave:args.includes('--check')?args.includes('--cave'):true}, env={W,x,pid:'l'};
  if(args.includes('--wanderer')){   // step 18: the Wanderer's paths (docs: shared/wanderer.js; --path <id> for one)
    const one=val('--path',null), paths=one?[one]:x.WD_ORDER.slice(); wandererReport(env,Object.assign({},opts,{set:null}),paths); process.exit(0); }
  // step 20 (the balance pass): one point (--bond <0-6> and/or --awk <A0-A5>, --guest adds one guest piece) or --matrix (Bond 0 at A0, Bond II at A3, Bond VI at A5 with the guest cost there):
  // every set in % of the baseline at the same tier, then the median and spread per role and the outliers (more than 25% from the role's median at Bond VI / A5); risk sets always behind
  const tierArg=v=>{ const t=+(String(v||'').replace(/^A/i,'')); return Number.isInteger(t)&&t>=0&&t<=5?t:null; };
  if(args.includes('--bond')||args.includes('--awk')||args.includes('--guest')||args.includes('--matrix')){
    const pts=args.includes('--matrix')?[{bond:0,awk:0},{bond:2,awk:3},{bond:6,awk:5,guest:true}]
      :[{bond:Math.max(0,Math.min(6,+val('--bond',6)|0)),awk:tierArg(val('--awk','A5'))===null?5:tierArg(val('--awk','A5')),guest:args.includes('--guest')}];
    const roman=['0','I','II','III','IV','V','VI'], ids=x.SS_ORDER.filter(id=>!x.SS_SETS[id].dev&&(!opts.set||opts.set===id)), res={};
    for(const P of pts){ const key='Bond '+roman[P.bond]+' / A'+P.awk; res[key]={};
      for(const id of ids){ const r=ladder(env,Object.assign({},opts,{set:id,cave:false,point:P,behind:x.SS_SETS[id].role.main==='risk'}))[0]; if(r) res[key][id]=r; } }
    const keys=Object.keys(res), roleOf=id=>x.SS_SETS[id].role.main, med=a=>{ const b=[...a].sort((p,q)=>p-q), n=b.length; return n?(n%2?b[n>>1]:(b[n/2-1]+b[n/2])/2):0; };
    console.log('set'.padEnd(11)+'role'.padEnd(17)+keys.map(k=>k.padStart(18)).join('')+(pts.some(P=>P.guest)?'   one guest (at the last point): single / pack, its Bond':''));
    for(const id of ids){ const S=x.SS_SETS[id], last=res[keys[keys.length-1]][id];
      console.log(id.padEnd(11)+(S.role.main+(S.role.also?'+'+S.role.also.role:'')).padEnd(17)+keys.map(k=>String(res[k][id]?res[k][id].summary.pieces+' / '+res[k][id].summary.piecesPack:'-').padStart(18)).join('')
        +(last&&last.summary.guest!==undefined?'   '+(last.summary.guest>=0?'+':'')+last.summary.guest+'% / '+(last.summary.guestPack>=0?'+':'')+last.summary.guestPack+'%, Bond '+roman[Math.max(0,Object.values(last.rows)[0].guest.act)]:'')); }
    console.log('\nper role (single target, % of the baseline at the same tier): median [min..max]');
    const roles=[...new Set(ids.map(roleOf))], outl=[];
    for(const role of roles){ const mine=ids.filter(id=>roleOf(id)===role);
      console.log(role.padEnd(9)+keys.map(k=>{ const v=mine.map(id=>res[k][id]&&res[k][id].summary.pieces).filter(n=>n!==undefined); return (Math.round(med(v))+' ['+Math.min(...v)+'..'+Math.max(...v)+']').padStart(18); }).join(''));
      const L=keys[keys.length-1], m=med(mine.map(id=>res[L][id]&&res[L][id].summary.pieces).filter(n=>n!==undefined));
      for(const id of mine){ const v=res[L][id]&&res[L][id].summary.pieces; if(v!==undefined&&Math.abs(v/m-1)>0.25) outl.push(id+' ('+role+') '+v+' at '+L+' vs the median '+Math.round(m)+' ('+(v>m?'+':'')+Math.round((v/m-1)*100)+'%)'); } }
    const gs=ids.map(id=>res[keys[keys.length-1]][id]).filter(r=>r&&r.summary.guest!==undefined).map(r=>r.summary.guest);
    if(gs.length) console.log('\none guest piece costs: median '+med(gs)+'% ['+Math.min(...gs)+'..'+Math.max(...gs)+'] single target');
    console.log(outl.length?'\noutliers (more than 25% from the role median at '+keys[keys.length-1]+'):\n  '+outl.join('\n  '):'\nno outlier (every set within 25% of its role median at '+keys[keys.length-1]+')');
    process.exit(0); }
  if(args.includes('--ult')){   // slot 5: what each set's burst and its two boosts add to a 60 s rotation (gain over the rotation without it, %: single / pack)
    const list=ladder(env,Object.assign({},opts,{ult:true,cave:false}));
    console.log('set'.padEnd(12)+'no boost'.padStart(12)+'active only'.padStart(14)+'passive only'.padStart(14)+'both'.padStart(12)+'   (% over the same rotation without the burst, single / pack)');
    for(const s of list){ const u=ultRow(s,opts.classes||CLASSES); if(!u){ console.log(s.id.padEnd(12)+'(no burst)'); continue; }
      const A=u[1][0]-u[0][0], Pa=u[2][0]-u[0][0]; console.log(s.id.padEnd(12)+u.map(v=>(v[0]+'/'+v[1]).padStart(12)).join('  ')+(A>0&&(Pa<A*0.75||Pa>A*1.25)?'   warning: the passive boost adds '+Pa+' against the active\'s '+A+' (target within 25%)':'')); }
    process.exit(0); }
  if(args.includes('--orders')){   // docs/skillkits/SYNERGY-REWORK.md section 11: each set in three press orders (burst > skill > basic, skill > burst > basic, the burst held until a skill was cast in the last 4 s); an order-free kit's columns lie within the noise of each other
    const ids=x.SS_ORDER.filter(id=>!x.SS_SETS[id].dev&&(!opts.set||opts.set===id));
    console.log('set'.padEnd(12)+'burst first'.padStart(13)+'skill first'.padStart(13)+'burst held'.padStart(13)+'   spread (pieces / pack)');
    const runs=Math.max(1,+val('--runs',1)|0);   // --runs N: each order N times with other seeds, the mean (one seeded run of a set with a pop can land far from its mean)
    for(const id of ids){ const R=['burst','skill','hold'].map(o=>{ const L=[]; for(let i=0;i<runs;i++){ const r=ladder(env,Object.assign({},opts,{set:id,cave:false,order:o==='burst'?null:o,seed:i}))[0]; if(r) L.push(r.summary); } if(!L.length) return null; const mean=k=>Math.round(L.reduce((a,b)=>a+b[k],0)/L.length); return {summary:{pieces:mean('pieces'),fivePack:mean('fivePack')}}; }); if(!R.every(Boolean)) continue;
      const pc=R.map(r=>r.summary.pieces), pk=R.map(r=>r.summary.fivePack), sp=a=>Math.max(...a)-Math.min(...a);
      console.log(id.padEnd(12)+R.map(r=>(r.summary.pieces+' / '+r.summary.fivePack).padStart(13)).join('')+'   '+sp(pc)+' / '+sp(pk)+(runs>1?'   (mean of '+runs+')':'')); }
    process.exit(0); }
  if(args.includes('--combo')){   // E5: each set with a kit.combo, plain (the bot casts whatever is ready: a careless player) and in its order; risk sets always behind, sets with rangeScale from 16 m too
    const ids=x.SS_ORDER.filter(id=>{ const S=x.SS_SETS[id]; return !S.dev&&S.kit&&S.kit.combo&&(!opts.set||opts.set===id); });
    console.log('set'.padEnd(12)+'mode'.padEnd(10)+'plain: pieces / 3-set / 5-set / pack'.padEnd(40)+'in order: pieces / 3-set / 5-set / pack'.padEnd(42)+'order gain (pieces)');
    for(const id of ids){ const S=x.SS_SETS[id], modes=[['plain',{}]]; if(S.role.main==='risk') modes.push(['behind',{behind:true}]);
      if(x.SKILL_IDS.some(i=>x.SKILLS[i].set===id&&x.SKILLS[i].fx&&x.SKILLS[i].fx.rangeScale&&x.SKILLS[i].fx.rangeScale.k>1)) modes.push(['16 m',{dist:16,classes:undefined}]);
      for(const [nm,o] of modes){ const a=ladder(env,Object.assign({},opts,o,{set:id,cave:false}))[0], b=ladder(env,Object.assign({},opts,o,{set:id,cave:false,combo:true}))[0]; if(!a||!b) continue;
        const col=r=>[r.summary.pieces,r.summary.three,r.summary.five,r.summary.fivePack].join(' / ');
        console.log(id.padEnd(12)+nm.padEnd(10)+col(a).padEnd(40)+col(b).padEnd(42)+(b.summary.pieces-a.summary.pieces>=0?'+':'')+(b.summary.pieces-a.summary.pieces)); } }
    process.exit(0); }
  const list=ladder(env,opts); print(list);
  // a risk set is also run with every dummy facing away from the hero (always behind: good play), a set with rangeScale from 16 m; those rows are the ones judged
  const risky=list.filter(s=>s.role==='risk'&&!s.also).map(s=>s.id), ranged=list.filter(s=>s.ranged).map(s=>s.id), behind=[], far=[];
  for(const id of risky) behind.push(...ladder(env,Object.assign({},opts,{set:id,behind:true})));
  for(const id of ranged) far.push(...ladder(env,Object.assign({},opts,{set:id,dist:16,classes:undefined})));
  if(behind.length){ console.log(''); print(behind,'behind'); }
  if(far.length){ console.log(''); print(far,'range'); }
  const bad=[...list.filter(s=>(s.role!=='risk'||s.also)&&!s.ranged),...behind.filter(s=>!s.ranged),...far].filter(s=>judge(s,behind.includes(s)?'behind':far.includes(s)?'range':undefined).fail.length);
  if(args.includes('--check')&&bad.length){ console.log('\n'+bad.length+' set(s) fail the owner\'s orderings'); process.exit(1); }
}
