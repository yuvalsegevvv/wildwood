// Stateful fuzz of the skill sets and loadouts, straight from src/ (no build): two players take random but VALID actions (unlock a set with the free ft message, wear or take off pieces, put a passive in a slot,
// change class, raise the level, fight with whatever is worn) and every 40 steps the loadout is checked and put through a save: sanitizeGear(gear) must give a valid loadout again, and again the same.
// What a bad state would look like: a worn skill nobody owns, an unknown id, a passive in a slot the level has not opened or worn twice, a skill in the wrong slot or class, a stat (maxHp, damage, defence) that is not
// a finite number, a gear object that cannot be saved. The scripted tests (skillsets-smoke, skillsets-first8-smoke) prove each rule; this proves they hold in any order.
// Usage: node tools/skillset-fuzz.js [--steps 2500] [--seed 1] [--verbose]
const {loadServer,findNonFinite}=require('./load');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?+process.argv[i+1]:d; };
const STEPS=arg('--steps',2500), VERBOSE=process.argv.includes('--verbose');
let seed=arg('--seed',1)>>>0; const rnd=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const pick=a=>a[Math.floor(rnd()*a.length)];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const nf=findNonFinite(m); if(nf) bad.push('a message to a client holds a NaN or an Infinity (JSON makes it null): '+nf); },broadcast(){}},['MONS','getH','SS_SETS','SS_ORDER','SS_PIECE_OF','SKILLS','PASSIVES','sanitizeGear','passiveOpen','PASSIVE_SLOTS','CLASSES','S']);
const thrown=new Map(), bad=[]; const note=(w,e)=>{ const k=w+': '+String(e&&e.message).slice(0,100)+' @ '+String(e&&e.stack).split('\n').slice(1,3).map(s=>s.trim().replace(/\(.*[\\/]/,'(')).join(' < '); thrown.set(k,(thrown.get(k)||0)+1); };
const tick=n=>{ for(let i=0;i<n;i++){ try{ W.tick(0.05); }catch(e){ note('tick()',e); } } };
const send=(id,m)=>{ try{ W.receive(id,m); }catch(e){ note('receive '+m.t+(m.cmd?'/'+m.cmd:''),e); if(VERBOSE) console.log(JSON.stringify(m)); } };
const ids=['s0','s1'], classes=Object.keys(x.CLASSES), spots=x.MONS.filter(m=>!m.boss&&m.def&&m.def.level<=12);
for(let i=0;i<2;i++){ W.join(ids[i],{name:'Ss'+i,look:{cls:classes[i]},save:{level:1}}); const m=spots[i*40]; W.setPos(ids[i],[m.x+2,x.getH(m.x+2,m.z),m.z,0,0,0]); }
tick(5);
const SK=x.SKILLS;
// is a loadout valid? returns a list of what is wrong
const wrong=(g,lv,where)=>{
  const out=[], S=g.skills, own=new Set(S.owned);
  if(own.size!==S.owned.length) out.push(where+': a skill is owned twice');
  for(const id of S.owned) if(!SK[id]&&!x.PASSIVES[id]) out.push(where+': owns the unknown id '+id);
  for(const cls of classes){ const e=S.eq[cls]; if(!e){ out.push(where+': no loadout for '+cls); continue; }
    for(const slot of ['basic','skill','burst']){ const id=e[slot]; if(id==null) continue;
      const s=SK[id]; if(!s){ out.push(where+': '+cls+'.'+slot+' wears the unknown '+id); continue; }
      if(s.slot!==slot) out.push(where+': '+cls+'.'+slot+' wears '+id+' which is a '+s.slot+' skill');
      if(s.cls&&s.cls!==cls&&!s.set) out.push(where+': '+cls+'.'+slot+' wears '+id+' of class '+s.cls);
      if(!own.has(id)&&!(s.cls===cls&&!s.drop&&!s.set&&s.price===0)) out.push(where+': '+cls+'.'+slot+' wears '+id+' which is not owned'); } }
  const open=x.passiveOpen(lv), P=S.pass||[];
  if(P.length!==x.PASSIVE_SLOTS) out.push(where+': '+P.length+' passive slots');
  const seen=new Set(); P.forEach((id,i)=>{ if(id==null) return; if(!x.PASSIVES[id]) out.push(where+': passive slot '+i+' holds the unknown '+id); if(seen.has(id)) out.push(where+': passive '+id+' is worn twice'); seen.add(id); if(i>=open) out.push(where+': passive slot '+i+' holds '+id+' but only '+open+' are open at level '+lv); });
  return out;
};
const stats=(p,r)=>{ for(const k of ['maxHp','dmg','def','red','hp']) if(typeof p[k]!=='number'||!isFinite(p[k])||(k==='maxHp'&&p[k]<=0)) bad.push(`step ${r}: ${p.id}.${k}=${p[k]}`); };
const check=(r)=>{
  for(const id of ids){ const p=W.players.get(id); if(!p) continue; stats(p,r);
    try{ JSON.stringify(p.gear); }catch(e){ bad.push(`step ${r}: ${id}'s gear cannot be saved`); continue; }
    // the live loadout may be above its level after a dev level DROP (the next save cleans it), so the rules are checked on what a save makes of it, twice
    let s1,s2; try{ s1=x.sanitizeGear(JSON.parse(JSON.stringify(p.gear)),p.look&&p.look.cls); s2=x.sanitizeGear(JSON.parse(JSON.stringify(s1)),p.look&&p.look.cls); }catch(e){ note('sanitizeGear',e); continue; }
    for(const w of wrong(s1,p.level,`step ${r} ${id} (level ${p.level}) after a save`)) bad.push(w);
    if(JSON.stringify(s1.skills)!==JSON.stringify(s2.skills)) bad.push(`step ${r}: ${id}'s skills change when saved a second time`);
  }
};
const setIds=x.SS_ORDER, allSkill=Object.keys(SK), allPass=Object.keys(x.PASSIVES);
for(let r=1;r<=STEPS&&bad.length<15;r++){
  const id=pick(ids), p=W.players.get(id), u=rnd(); if(!p){ continue; }
  const own=p.gear.skills.owned, mine=own.length?pick(own):pick(allSkill);
  if(u<0.10) send(id,{t:'ft',cmd:pick(['set','set','try','try','all']),v:pick(setIds)});
  else if(u<0.38) send(id,{t:'eqskill',id:rnd()<0.8?mine:pick(allSkill)});
  else if(u<0.48) send(id,{t:'eqskill',id:pick(allPass),idx:Math.floor(rnd()*3)});
  else if(u<0.58) send(id,{t:'unskill',cls:pick(classes),slot:pick(['skill','burst','basic','pass']),idx:Math.floor(rnd()*3)});
  else if(u<0.60) send(id,{t:'cls',cls:pick(classes)});
  else if(u<0.62) send(id,{t:'dev',cmd:'level',v:Math.min(60,p.level+1+Math.floor(rnd()*3))});   // (a few levels at a time: the loadout rules change with the level, so the fuzz should spend time in every band (passive slots open at 18, 24 and 30))   // (levels only rise in play; the testing tool can lower one, and then a save cannot clear the slots the lower level no longer opens: sanitizeGear does not know the level)
  else if(u<0.74) send(id,{t:'buyskill',id:pick(allSkill)});
  else if(u<0.76) send(id,{t:'upskill',id:mine});
  else if(u<0.80){ const m=pick(spots); W.setPos(id,[m.x+2,x.getH(m.x+2,m.z),m.z,0,0,0]); }
  else{ let best=null,bd=225; for(const m of W.monsters){ if(m.dead||m.remove||!m.awake) continue; const dx=m.x-p.x, dz=m.z-p.z, d2=dx*dx+dz*dz; if(d2<bd){ bd=d2; best=m; } }
    if(best) send(id,{t:'atk',k:pick(['basic','skill','burst']),tg:best.id,face:Math.atan2(best.x-p.x,best.z-p.z),aim:[best.x-p.x,0,best.z-p.z]}); }
  const q=W.players.get(id); if(q){ if(q.dead||q.hp<q.maxHp*0.4){ q.dead=false; q.hp=q.maxHp; } stats(q,r); }
  if(q) for(const w of wrong(q.gear,q.level,`step ${r} ${id} (level ${q.level}) live, right after the action`)) bad.push(w);   // (levels only rise, so a live loadout is valid at every moment; a slot filled before its level opens would be legitimate again at the next check)
  tick(1+Math.floor(rnd()*8));
  if(r%40===0) check(r);
}
check('end');
let fails=0;
for(const [k,n] of [...thrown].sort((a,b)=>b[1]-a[1])){ console.log(`FAIL threw ${n}x  ${k}`); fails++; }
for(const b of [...new Set(bad)].slice(0,20)){ console.log('FAIL '+b); fails++; }
console.log(fails?`${fails} problem(s)`:`PASS ${STEPS} random loadout actions by 2 players (sets, pieces, passives, class and level changes, fights, saves): every loadout valid after a save, stats finite`);
process.exit(fails?1:0);
