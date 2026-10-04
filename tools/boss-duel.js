//@ Boss duel: a maxed hero (level 60 unless --level; level-30 gear at +10, the ring, the soul, the symbol, potions) against a real boss or a monster camp on the real server, standing in melee and drinking potions, with the share of the damage a player who dodges would avoid; --check asserts the balance targets of the level-80 bosses and the ramp below them
// Usage: node tools/boss-duel.js [--boss vetrmaw|jadesprings|bonefrostbarrow|hollowroots|<zone boss id>|<monster id> --camp] [--tier 5] [--level 60] [--class warrior,archer,mage] [--avoid 0,0.3,0.5,0.7] [--runs 3]   (a table, one cell per avoid share)
//        node tools/boss-duel.js --check      (~20 s: the targets below, exit 1 on a miss)
// What it covers: BOSS_CREEP_* in shared/monster-defs.js (defAt) through the real fights: a zone boss (zoneTierK, the hero's land tiers set to --tier) or a dungeon boss (a Purge run at --tier,
// the boss's finale started with dgBossS, the other mobs removed). The hero never moves except to stay 3.5 m from the boss in a spot it can see; it drinks might and guard at once and a greater heal
// potion below 50% health (999 of each, so the potion supply is not the limit). `avoid` refunds that share of every hit it takes, which stands for dodging telegraphs and taking cover.
// It is a yardstick, not a player: it never kills adds, relights Haugbui's lamps, spills Gawataro's dish or pops Amanita's puffballs, and a ranged class stands in melee range. The reasoning and the
// numbers it gave: docs/areas/tiers.md (Reference numbers, "maxed level-60 hero against the level-80 bosses").
const {loadServer}=require('./load');
const hurts=[];
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ if(m.t==='snap'&&m.ev) for(const e of m.ev) if(e[0]==='hurt'&&e[1]===pid) hurts.push(e[2]); }},
  ['BOSSES','S','recalcP','monK','getH','ARMOR_SLOTS','ZTIER_LANDS','SKILL_IDS','SKILLS','PASSIVES','DG_RUNS','dgBossS','dgLos','dgSolid','MONS']);
const DT=0.05, tick=()=>W.tick(DT), WEAPON={warrior:'sword',archer:'bow',mage:'wand'};
// the best loadout found for each class against these bosses (an earth soul; a skill and a burst that fit)
const BUILD={warrior:{soul:'earth',passive:'ferocity',skill:'clawcrush',burst:'berserk'},archer:{soul:'earth',passive:'ferocity',skill:'pierce',burst:'focus'},
  mage:{soul:'earth',passive:'quickhands',skill:'meteor',burst:'surge',basic:'missiles'}};
let uid=0, lastAng=0;
function makeHero(cls,tier,level){
  const id='d'+(++uid), o=BUILD[cls]; W.join(id,{name:'D'+uid,look:{cls},save:{level:level||60}}); tick();
  const p=W.players.get(id), g=p.gear, items=[WEAPON[cls]+'7-l+10',...x.ARMOR_SLOTS.map(s=>s+'7-l+10'),'ring-'+o.soul+'-l+10'];
  g.inv.push(...items); g.eq.weapon=items[0]; x.ARMOR_SLOTS.forEach((s,i)=>{ g.eq[s]=items[i+1]; }); g.eq.ring=items[items.length-1];
  g.soul=o.soul; g.east=2; g.north=2; for(const l of x.ZTIER_LANDS) g.zt[l]={on:tier,max:5};
  const sk=g.skills; sk.owned=[...x.SKILL_IDS,...Object.keys(x.PASSIVES)]; sk.lv={}; for(const s of sk.owned){ const d=x.SKILLS[s]||x.PASSIVES[s]; if(d&&!d.drop) sk.lv[s]=5; }
  sk.eq[cls].skill=o.skill; sk.eq[cls].burst=o.burst; if(o.basic) sk.eq[cls].basic=o.basic; sk.pass=[o.passive,null,null];
  g.pot={heal3:999,might3:999,guard3:999}; g.coins=0; x.recalcP(p); p.hp=p.maxHp; p.dead=false;
  return {id,p,cls};
}
// the boss: a zone boss in the world, or a dungeon boss in a Purge run of the theme (returns its B state and whether a fight may reset it)
function target(h,boss){
  const zone=x.BOSSES.find(b=>b.bd.def.id===boss); if(zone) return {B:zone,world:true};
  W.receive(h.id,{t:'dev',cmd:'dg',v:boss+':purge:3'}); for(let i=0;i<10;i++) tick();
  const run=x.DG_RUNS.get(h.p.inst); if(!run) throw new Error('no boss or dungeon theme called '+boss);
  for(const m of [...run.mons]) if(!m.boss) m.remove=true; x.dgBossS(run); for(let i=0;i<10;i++) tick();
  return {B:run.boss,world:false,run};
}
function reset(B){ const m=B.m; m.dead=false; m.hp=m.maxHp; B.engaged=false; B.phase=1; B.enraged=false; B.stunT=0; m.immune=false; m.aggro=false; m.tgt=null; m.act=null; m.pendingHit=-1; m.hitters.clear();
  for(const k of ['tele','zones','walls','orbs']) if(B[k]) B[k].length=0; B.mode=0; B.busy=0; B.mv=null; m.x=B.A.x; m.z=B.A.z; for(const a of [...(B.adds||[]),...(B.totems||[])]) a.remove=true; B.adds=[]; B.totems=[]; }
// stand 3.5 m from the boss, in a spot that is not solid and that the boss can be hit from (a run's walls stop hits)
function stand(h,t){
  const m=t.B.m, run=t.run; let px,pz;
  for(let k=0;k<24;k++){
    const ang=lastAng+(k%2?1:-1)*Math.ceil(k/2)*Math.PI/12; px=m.x+Math.cos(ang)*3.5; pz=m.z+Math.sin(ang)*3.5;
    if(!run||(!x.dgSolid(run.B,px-run.ox,pz-run.oz)&&x.dgLos(run.B,px-run.ox,pz-run.oz,m.x-run.ox,m.z-run.oz))){ lastAng=ang; break; }
  }
  h.p.x=px; h.p.z=pz; h.p.y=x.getH(px,pz); h.p.face=Math.atan2(-(m.x-px),-(m.z-pz)); h.p.vx=h.p.vz=0;   // (placed directly: a run's setPos checks the layout and the step length)
}
function act(h,B){
  const p=h.p, m=B.m; if(p.dead) return; const pb=p.potb||{};
  if(!pb.might||pb.might.until<x.S.t+1) W.receive(h.id,{t:'potion',k:'might'});
  if(!pb.guard||pb.guard.until<x.S.t+1) W.receive(h.id,{t:'potion',k:'guard'});
  if(p.hp<p.maxHp*0.5) W.receive(h.id,{t:'potion',k:'heal'});
  if(p.act) return;
  const dx=m.x-p.x, dz=m.z-p.z, dy=x.getH(m.x,m.z)+m.T.height*0.5*m.s-(p.y+1.4), L=Math.hypot(dx,dy,dz)||1, face=Math.atan2(-dx,-dz), aim=[dx/L,dy/L,dz/L];
  for(const k of ['burst','skill','basic']) if(p.cd[k]<=0.08){ W.receive(h.id,{t:'atk',k,tg:m.id,face,aim}); if(p.act) break; }
}
const pool=(B,h)=>B.m.hp*x.monK(B.m,h.p).hp;   // (the boss's health is kept in its def's own units: a hit takes off damage / K.hp)
function fight(h,t,avoid,maxSecs){
  const B=t.B, m=B.m; if(t.world) reset(B); hurts.length=0; const total=B.m.maxHp*x.monK(m,h.p).hp, h0=h.p.gear.pot.heal3; let low=h.p.maxHp;
  stand(h,t); for(let i=0;i<40;i++) tick(); h.p.hp=h.p.maxHp; h.p.dead=false; h.p.cd.basic=h.p.cd.skill=h.p.cd.burst=0;
  for(let s=0;s<maxSecs;s+=DT){
    stand(h,t); act(h,B); tick();
    for(const v of hurts.splice(0)) if(avoid&&!h.p.dead) h.p.hp=Math.min(h.p.maxHp,h.p.hp+v*avoid);
    low=Math.min(low,h.p.hp);
    if(m.dead) return {won:true,secs:s,heals:h0-h.p.gear.pot.heal3,low:low/h.p.maxHp};
    if(h.p.dead) return {won:false,secs:s,heals:h0-h.p.gear.pot.heal3,left:pool(B,h)/total};
  }
  return {won:false,secs:maxSecs,heals:h0-h.p.gear.pot.heal3,left:pool(B,h)/total};
}
// a whole camp of a monster kind (the pack that comes at you when you walk up to it): the hero stands next to it and fires at the nearest until it is dead or the hero is
function camp(h,defId,avoid){
  const m0=x.MONS.find(m=>m.def.id===defId&&!m.temp&&!m.dead&&!m.boss); if(!m0) throw new Error('no camp of '+defId);
  const c=m0.camp, pack=x.MONS.filter(m=>m.camp===c&&!m.dead&&!m.temp&&!m.boss), p=h.p, h0=p.gear.pot.heal3, alive=()=>pack.filter(m=>!m.dead);
  W.setPos(h.id,[c.x+2,x.getH(c.x+2,c.z),c.z,0,0,0]); for(let i=0;i<40;i++) tick(); p.hp=p.maxHp; p.dead=false; hurts.length=0; let low=p.hp, s=0;
  for(;s<300;s+=DT){
    const al=alive(); if(!al.length) break;
    act(h,{m:al.reduce((a,m)=>Math.hypot(m.x-p.x,m.z-p.z)<Math.hypot(a.x-p.x,a.z-p.z)?m:a,al[0])}); tick();
    for(const v of hurts.splice(0)) if(avoid&&!p.dead) p.hp=Math.min(p.maxHp,p.hp+v*avoid);
    low=Math.min(low,p.hp); if(p.dead) break;
  }
  const r={won:!alive().length&&!p.dead,secs:s,heals:h0-p.gear.pot.heal3,low:low/p.maxHp,left:alive().length/pack.length,pack:pack.length,level:x.monK(m0,p).lv};
  for(const m of pack){ m.dead=false; m.hp=m.maxHp; m.aggro=false; m.x=c.x; m.z=c.z; }   // (the pack stands again for the next run)
  return r;
}
const med=a=>[...a].sort((p,q)=>p-q)[Math.floor(a.length/2)];
// n runs of a class against a boss with an avoid share: how many were won, the median time and potions
function duel(boss,tier,cls,avoid,n,level,asCamp){
  const res=[]; for(let i=0;i<n;i++){ const h=makeHero(cls,tier,level); res.push(asCamp?camp(h,boss,avoid):fight(h,target(h,boss),avoid,600)); W.leave(h.id); }
  const won=res.filter(r=>r.won).length;
  return {won,n,secs:med(res.map(r=>r.secs)),heals:med(res.map(r=>r.heals)),low:med(res.map(r=>r.low||0)),text:won+'/'+n+' won ~'+Math.round(med(res.map(r=>r.secs)))+'s, '+med(res.map(r=>r.heals))+' heals'+(won?'':(asCamp?', '+Math.round(med(res.map(r=>r.left))*100)+'% of the pack left':', boss '+Math.round(med(res.map(r=>r.left))*100)+'% left'))};
}
const arg=(k,d)=>{ const i=process.argv.indexOf('--'+k); return i>0?process.argv[i+1]:d; };
if(process.argv.includes('--check')){
  // targets for the level-80 bosses: a hero that only stands and drinks loses, one that avoids half the damage wins in 1.5 to 3 minutes with a handful of potions.
  // (Gawataro is only checked from the winning side: the warrior's crowd control (a slash knocks whelps back) lets it beat him standing, the archer barely loses: docs/areas/tiers.md)
  // And the ramp below them (late creep, shared/monster-defs.js): a boss the hero outlevels falls in seconds, level 70 takes half a minute, level 75 a real fight, 80 is the wall above.
  let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
  const half=(boss,cls)=>{ const r=duel(boss,5,cls,0.5,3); ok(boss+' V, '+cls+': avoiding half the damage wins in 1.5-3 minutes with at most 8 potions ('+r.text+')',r.won===3&&r.secs>=90&&r.secs<=180&&r.heals<=8); };
  for(const cls of ['warrior','archer','mage']){ const r=duel('vetrmaw',5,cls,0,3); ok('vetrmaw V, '+cls+': standing and drinking loses ('+r.text+')',r.won===0); half('vetrmaw',cls); }
  half('jadesprings','archer');
  for(const cls of ['warrior','archer','mage']){
    const r65=duel('kyuubi',4,cls,0,3), r70=duel('vetrmaw',4,cls,0,3), r75=duel('kyuubi',5,cls,0,3);
    ok('kyuubi IV (level 65), '+cls+': standing wins in under 15 s ('+r65.text+')',r65.won===3&&r65.secs<15);
    ok('vetrmaw IV (level 70), '+cls+': standing wins in 20-60 s without a potion ('+r70.text+')',r70.won===3&&r70.secs>=20&&r70.secs<=60&&r70.heals===0);
    ok('kyuubi V (level 75), '+cls+': standing usually wins (at least 2 of 3; the archer and warrior end near 25% health) in 35-100 s, a real fight (at most 6 potions) ('+r75.text+')',r75.won>=2&&r75.secs>=35&&r75.secs<=100&&r75.heals<=6);
  }
  { const r=duel('kodama',5,'warrior',0,3,60,true); ok('a camp of level-67 Kodama at tier V falls in under 25 s with no potion ('+r.text+')',r.won===3&&r.secs<25&&r.heals===0); }
  { const r=duel('vetrmaw',5,'warrior',0.7,2,50); ok('a level-50 hero is not shut out of the level-80 bosses: vetrmaw V, avoiding 70% of the damage, wins in under 4 minutes ('+r.text+')',r.won===2&&r.secs<240); }
  process.exit(fails?1:0);
}
const boss=arg('boss','vetrmaw'), tier=+arg('tier',5), level=+arg('level',60), classes=arg('class','warrior,archer,mage').split(','), avoids=arg('avoid','0,0.3,0.5,0.7').split(',').map(Number), n=+arg('runs',3), asCamp=process.argv.includes('--camp');
console.log(boss+(asCamp?' (the whole camp)':'')+' at tier '+tier+': a maxed level-'+level+' hero standing in melee with potions; cells = runs won, median time, potions');
console.log('class'.padEnd(8),...avoids.map(a=>('avoid '+Math.round(a*100)+'%').padEnd(34)));
for(const cls of classes) console.log(cls.padEnd(8),...avoids.map(a=>duel(boss,tier,cls,a,n,level,asCamp).text.padEnd(34)));
