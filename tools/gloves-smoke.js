// Headless test of the gloves (dungeon revamp D6: shared/gloves.js, the gloves ids in shared/dungeon-rewards.js, eq.gloves, server/dungeon-gear.js glv*, the hooks in combat.js / players.js): the six kinds, ids,
// values by rarity / tempering / level, each effect (Keen, Brutal, Heavy, Hot Streak's stacks and expiry, Overflow's conversion, Echo's chance and no chain), the caps, equip and sanitize,
// the Termite Cathedral paying gloves. Usage: node tools/gloves-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['ITEM','GLV_KINDS','GLV_IDS','GLV_BY_ID','GLV_ECHO_CHANCE','GLV_STREAK_SECS','GLV_STREAK_MAX','glvVal','glvText','dgParse','dgItem','dgGlovesId','dgAllGlovesIds','dgEnhanceNext','dgClearReward','DG_REWARDS','sanitizeGear','recalcP','newGearFor','mergedId','rlLinesFor','rollDmgS','damageMonsterS','itemStat','hurtP','glvStreakP','glvOverP','CRIT_CAP','CRIT_MULT_CAP','CRIT_MULT','MONS','S']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const I=x.ITEM, near=(a,b)=>Math.abs(a-b)<1e-9, rnd0=Math.random;
const withRandom=(v,f)=>{ Math.random=()=>v; try{ return f(); } finally{ Math.random=rnd0; } };

// ---- ids and values (pure) ----
ok('six kinds: crit, critdmg, atk, streak, over, echo',x.GLV_IDS.join()==='crit,critdmg,atk,streak,over,echo'&&x.GLV_KINDS.every(k=>k.name&&k.base>0));
ok('210 unrolled gloves a level (6 x 35), lv 30 / 40 / 50 / 60, slot gloves, kind gloves, dg',[7,8,9,10].every((t,i)=>x.dgAllGlovesIds(t).length===210&&x.dgAllGlovesIds(t).every(id=>I[id]&&I[id].kind==='gloves'&&I[id].slot==='gloves'&&I[id].lv===30+10*i&&I[id].dg)));
ok('ids parse: gloves9-echo-e+4~a57k12 is a level-50 epic Echo at +4 with two lines',(()=>{ const q=x.dgParse('gloves9-echo-e+4~a57k12'); return q&&q.slot==='gloves'&&q.stat==='echo'&&q.rar===2&&q.n===4&&q.t===9&&q.roll==='~a57k12'; })()&&x.dgItem('gloves9-echo-e+4~a57k12').roll.length===2);
ok('junk gloves are no items: a level-30 roll, a wrong line count, a bad kind, too much tempering, an old cape id',!I['gloves7-crit~a57']&&!I['gloves8-crit~a57k12']&&!I['gloves10-crit~a57k12']&&!I['gloves8-xx']&&!I['gloves8-crit-c+3']&&!I['gloves8-crit-r+9']&&!x.dgItem('gloves11-crit')&&!x.dgItem('gloves8-opener'));
{ const g=k=>I['gloves7-'+k].v;
  ok('a common +0 level-30 glove has the plan\'s numbers',near(g('crit'),0.04)&&near(g('critdmg'),0.20)&&near(g('atk'),25)&&near(g('streak'),0.015)&&near(g('over'),0.03)&&near(g('echo'),0.40)); }
{ const base=I['gloves7-crit'].v;
  ok('by rarity: x RAR_MULT 1 / 1.3 / 1.7 / 2.2 / 3 (a legendary x3)',near(I['gloves7-crit-r'].v,base*1.3)&&near(I['gloves7-crit-e'].v,base*1.7)&&near(I['gloves7-crit-u'].v,base*2.2)&&near(I['gloves7-crit-l'].v,base*3));
  ok('by tempering: +10% a step',near(I['gloves7-crit+2'].v,base*1.2)&&near(I['gloves7-crit-l+10'].v,base*6));
  ok('by level: x1.15 a step above 30 (not x1.25)',near(I['gloves8-crit'].v,base*1.15)&&near(I['gloves9-crit'].v,base*1.3225)&&near(I['gloves10-crit'].v,Math.round(base*1.520875*10000)/10000)&&near(I['gloves10-atk'].v,Math.round(25*1.520875*10000)/10000)); }
ok('Echo: its chance stays 15% whatever the piece; only the second hit\'s share grows (40% -> x3 x2 at legendary +10)',x.GLV_ECHO_CHANCE===0.15&&near(I['gloves7-echo-l+10'].v,0.4*6)&&/15% chance/.test(x.itemStat(I['gloves10-echo-l+10'])));
ok('texts: keen, atk, streak',/^\+4% critical hit chance$/.test(x.itemStat(I['gloves7-crit']))&&/^\+25 attack$/.test(x.itemStat(I['gloves7-atk']))&&/\+1\.5% crit chance for 4 s, up to 5 stacks/.test(x.itemStat(I['gloves7-streak'])));
ok('enhancing keeps the roll and goes up a step; gloves merge like the others, a rolled one does not',x.dgEnhanceNext('gloves8-crit-r+1~a57')==='gloves8-crit-r+2~a57'&&x.mergedId('gloves8-crit')==='gloves8-crit-r'&&x.mergedId('gloves8-crit~a57')===null);
ok('lines by level: 30 none, 40 one, 50 two, 60 three',x.rlLinesFor(7)===0&&I['gloves8-crit~a99'].roll[0].v>0&&I['gloves10-crit~a99g99h99'].roll.length===3);

// ---- on a player ----
W.join('a',{name:'A',look:{cls:'warrior'},save:{level:60}}); tick(2); const A=W.players.get('a');
const wear=id=>{ if(!A.gear.inv.includes(id)) A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1); };
const unwear=()=>{ A.gear.eq.gloves=null; A.glvS=null; x.recalcP(A); };
A.level=60; x.recalcP(A);
ok('a fresh gear has an empty gloves slot',x.newGearFor('warrior').eq.gloves===null);
const d0=A.dmg; wear('gloves10-atk-l');
ok('Heavy: equipping puts it in eq.gloves and adds its flat attack (the damage base grows by about that many points)',A.gear.eq.gloves==='gloves10-atk-l'&&A.dmg-d0>=I['gloves10-atk-l'].v*0.9&&A.dmg-d0<I['gloves10-atk-l'].v*3);
unwear();
const hit=(stub,buff)=>withRandom(stub,()=>{ A.buff=buff||null; const r=x.rollDmgS(A,1,null,null); A.buff=null; return r; });
{ const plain=hit(0.125);
  wear('gloves7-crit'); const keen=hit(0.125);
  ok('Keen: +4% crit chance (a roll of 0.125 misses the 12% base and lands under 16%)',!plain.crit&&keen.crit); unwear(); }
{ const b={crit:0.5,dmg:1};
  const p0=hit(0.5,b); wear('gloves10-critdmg-l+10'); const p1=hit(0.5,b);
  ok('Brutal: a crit multiplier plus, still inside CRIT_MULT_CAP (1.7 + 1.82 would be 3.5, held at 2.5)',p0.crit&&p1.crit&&Math.abs(p1.v/p0.v-x.CRIT_MULT_CAP/x.CRIT_MULT)<0.01);
  unwear(); wear('gloves7-critdmg'); const p2=hit(0.5,b);
  ok('Brutal below the cap: +0.20x',Math.abs(p2.v/p0.v-(1.7+0.2)/1.7)<0.01); unwear(); }
{ const b={crit:0.55,dmg:1}, p0=hit(0.5,b);
  wear('gloves7-over'); const p1=hit(0.5,b);
  ok('Overflow: crit chance above the 60% cap (12% + 55% = 67%, 7 over) turns into +0.21x crit damage (1% = 0.03x)',p0.crit&&p1.crit&&Math.abs(p1.v/p0.v-(1.7+0.21)/1.7)<0.01);
  ok('Overflow reads the pre-cap sum: nothing happens below the cap, and a bigger glove converts faster',x.glvOverP(A,0.5)===0&&near(x.glvOverP(A,0.65),0.05*100*0.03));
  unwear(); ok('Overflow without the glove converts nothing',x.glvOverP(A,0.9)===0);
  wear('gloves10-over-l+10'); const p3=hit(0.5,{crit:0.9,dmg:1}); ok('caps hold: a huge overflow still stops at CRIT_MULT_CAP',p3.crit&&Math.abs(p3.v/p0.v-x.CRIT_MULT_CAP/x.CRIT_MULT)<0.01); unwear(); }

// ---- Hot Streak, Echo: on a monster ----
const M=x.MONS.find(m=>!m.boss&&!m.dead&&!m.pl);
const strike=(stub,buff)=>withRandom(stub,()=>{ M.hp=1e9; M.dead=false; A.buff=buff||{crit:0.5,dmg:1}; const h0=M.hp; x.damageMonsterS(M,1,A,M.x-1,M.z,0,null); A.buff=null; return h0-M.hp; });
{ wear('gloves7-streak');
  ok('Hot Streak: no stacks to begin with, no bonus',!A.glvS&&x.glvStreakP(A)===0);
  for(let i=0;i<3;i++) strike(0.5);
  ok('each crit adds a stack: three crits, 3 x 1.5%',A.glvS.length===3&&near(x.glvStreakP(A),3*0.015));
  for(let i=0;i<5;i++) strike(0.5);
  ok('up to five stacks',A.glvS.length===5&&near(x.glvStreakP(A),5*0.015));
  const was=x.S.t; x.S.t=was+x.GLV_STREAK_SECS+0.1;
  ok('a stack lasts 4 s: after that the bonus is gone',x.glvStreakP(A)===0);
  strike(0.5); ok('and a new crit starts again at one stack',A.glvS.length===1&&near(x.glvStreakP(A),0.015)); x.S.t=was;
  A.glvS=[x.S.t+9,x.S.t+9]; const nc=hit(0.1); strike(0.99,{crit:0}); ok('a hit that does not crit adds no stack',A.glvS.length===2);
  A.hp=1; x.hurtP(A,99999,null); ok('death clears the stacks',A.glvS===null||A.glvS.length===0); A.dead=false; A.hp=A.maxHp; unwear(); }
{ const noGlove=strike(0.1), base5=strike(0.5);
  wear('gloves7-echo'); const echo=strike(0.1), none=strike(0.5);
  ok('Echo: on a crit with the 15% chance, a second hit for 40% of the crit (total x1.4, one echo, no chain)',noGlove>0&&Math.abs(echo/noGlove-1.4)<0.01,echo/noGlove);
  ok('and without the 15% chance, a crit stays a single hit',Math.abs(none/base5-1)<0.01);
  { let echoes=0, N=4000; M.hp=1e9; for(let i=0;i<N;i++){ let calls=0;   // only the 15% roll varies
      Math.random=()=>{ calls++; return calls===1?0.1:calls===2?0.5:(i%100)/100; }; M.hp=1e9; A.buff={crit:0.5,dmg:1}; x.damageMonsterS(M,1,A,M.x-1,M.z,0,null); A.buff=null; Math.random=rnd0; if(1e9-M.hp>noGlove*1.2) echoes++; }
    ok('the chance is 15% (a swept roll lands the echo about 15 times in 100)',echoes>0.05*N&&echoes<0.25*N,echoes+' of '+N); }
  unwear(); }
{ // nothing of a glove counts on the Proving Isle
  wear('gloves7-streak'); A.pv={sk:A.gear.skills,pre:1}; ok('on the Proving Isle (p.pv) no glove counts',x.glvStreakP(A)===0); A.pv=null; unwear(); }

// ---- equip, sanitize, shop ----
A.level=29; A.gear.eq.gloves=null; A.gear.inv.push('gloves7-crit'); W.receive('a',{t:'equip',id:'gloves7-crit'}); tick(1);
ok('equip refuses a piece above your level',A.gear.eq.gloves!=='gloves7-crit'); A.level=60;
wear('gloves9-atk-e'); W.receive('a',{t:'unequip',slot:'gloves'}); tick(1);
ok('unequip empties the slot',A.gear.eq.gloves===null);
{ const g=x.sanitizeGear({inv:['sword1','gloves8-crit','gloves7-atk','gloves11-atk'],eq:{weapon:'sword1',gloves:'gloves8-crit',cape:'gloves7-atk'}},'warrior');
  ok('sanitize keeps worn gloves in eq.gloves only, drops gloves in another slot and a junk id',g.eq.gloves==='gloves8-crit'&&g.eq.cape===null&&!g.inv.includes('gloves11-atk')); }
A.gear.rsr=0; A.gear.inv.push('gloves8-echo-l'); W.receive('a',{t:'sac',id:'gloves8-echo-l'}); tick(1);
ok('sacrificing a legendary level-40 glove pays 24 Accessory Reroll Stones; rolling one costs 1',A.gear.rsr===24&&!A.gear.inv.includes('gloves8-echo-l'));
A.gear.inv.push('gloves9-crit'); W.receive('a',{t:'reroll',id:'gloves9-crit'}); tick(1);
{ const n=A.gear.inv.find(i=>i.startsWith('gloves9-crit~')); ok('a level-50 glove rolls two lines with an Accessory stone',!!n&&A.gear.rsr===23&&I[n].roll.length===2&&I[n].stat==='crit'); }
ok('the gloves list in the player shops',require('fs').readFileSync(__dirname+'/../src/server/pshop.js','utf8').includes("'gloves'"));

// ---- the Termite Cathedral ----
ok('the Termite Cathedral pays gloves: one of the six kinds, unrolled, level by the rolled eq (default 40)',x.DG_REWARDS.termitecathedral.kind==='gloves'&&x.DG_REWARDS.termitecathedral.pool.join()===x.GLV_IDS.join()&&(()=>{ const seen=new Set(); for(let i=0;i<200;i++){ const id=x.dgClearReward('termitecathedral',null), q=x.dgParse(id); if(!q||q.slot!=='gloves'||q.t!==8||q.roll) return false; seen.add(q.stat); } return seen.size===6; })());
ok('and at eq 60 gloves10',/^gloves10-/.test(x.dgClearReward('termitecathedral',null,3)));
process.exit(fails?1:0);
