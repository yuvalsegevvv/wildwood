// Headless test of the shields (dungeon revamp D7: shared/shields.js, the shield ids in shared/dungeon-rewards.js, eq.shield, server/dungeon-gear.js shd*, the hooks in players.js / combat.js / boss-fx.js):
// the seven kinds, ids, values by rarity / tempering / level, each effect (health %, defence %, block and the 10% floor, Steady, Last Ward threshold and cooldown, Lifeblood, Mending in and out of combat),
// the caps, equip and sanitize, the Armor Reroll Stone, the Cenote paying shields. Usage: node tools/shields-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['ITEM','SHD_KINDS','SHD_IDS','SHD_BY_ID','SHD_BLOCK_LET','SHD_WARD_CD','SHD_WARD_BELOW','SHD_BLOCK_CAP','SHD_STEADY_CAP','SHD_REGEN_COMBAT','shdVal','shdText','dgParse','dgItem','dgShieldId','dgAllShieldIds','dgEnhanceNext','dgClearReward','DG_REWARDS','sanitizeGear','recalcP','newGearFor','mergedId','rlLinesFor','itemStat','hurtP','shdBlockK','shdSteadyDur','shdWardS','shdRegenP','shdLeechS','damageMonsterS','DMG_TAKEN_MIN','MONS','S']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const I=x.ITEM, near=(a,b)=>Math.abs(a-b)<1e-9, rnd0=Math.random;
const withRandom=(v,f)=>{ Math.random=()=>v; try{ return f(); } finally{ Math.random=rnd0; } };

// ---- ids and values (pure) ----
ok('seven kinds: hp, def, block, steady, ward, leech, regen',x.SHD_IDS.join()==='hp,def,block,steady,ward,leech,regen'&&x.SHD_KINDS.every(k=>k.name&&k.base>0));
ok('245 unrolled shields a level (7 x 35), lv 30 / 40 / 50 / 60, slot shield, kind shield, dg',[7,8,9,10].every((t,i)=>x.dgAllShieldIds(t).length===245&&x.dgAllShieldIds(t).every(id=>I[id]&&I[id].kind==='shield'&&I[id].slot==='shield'&&I[id].lv===30+10*i&&I[id].dg)));
ok('ids parse: shield9-ward-e+4~a57k12 is a level-50 epic Last Ward at +4 with two lines',(()=>{ const q=x.dgParse('shield9-ward-e+4~a57k12'); return q&&q.slot==='shield'&&q.stat==='ward'&&q.rar===2&&q.n===4&&q.t===9&&q.roll==='~a57k12'; })()&&x.dgItem('shield9-ward-e+4~a57k12').roll.length===2);
ok('junk shields are no items: a level-30 roll, a wrong line count, a bad kind, too much tempering',!I['shield7-hp~a57']&&!I['shield8-hp~a57k12']&&!I['shield10-hp~a57k12']&&!I['shield8-xx']&&!I['shield8-hp-c+3']&&!I['shield8-hp-r+9']&&!x.dgItem('shield11-hp'));
{ const g=k=>I['shield7-'+k].v;
  ok('a common +0 level-30 shield has the plan\'s numbers',near(g('hp'),0.08)&&near(g('def'),0.08)&&near(g('block'),0.08)&&near(g('steady'),0.30)&&near(g('ward'),0.20)&&near(g('leech'),0.015)&&near(g('regen'),0.006)); }
{ const base=I['shield7-hp'].v;
  ok('by rarity: x RAR_MULT 1 / 1.3 / 1.7 / 2.2 / 3',near(I['shield7-hp-r'].v,base*1.3)&&near(I['shield7-hp-e'].v,base*1.7)&&near(I['shield7-hp-u'].v,base*2.2)&&near(I['shield7-hp-l'].v,base*3));
  ok('by tempering: +10% a step',near(I['shield7-hp+2'].v,base*1.2)&&near(I['shield7-hp-l+10'].v,base*6));
  ok('by level: x1.15 a step above 30',near(I['shield8-hp'].v,base*1.15)&&near(I['shield9-hp'].v,base*1.3225)&&near(I['shield10-hp'].v,Math.round(base*1.520875*10000)/10000)); }
ok('texts: hp, block (30% let through), ward (30% / 60 s), regen',/^\+8% health$/.test(x.itemStat(I['shield7-hp']))&&/8% chance to block a hit \(it does 30% of its damage\)/.test(x.itemStat(I['shield7-block']))&&/Below 30% health, a shield of 20% of max health \(once every 60 s\)/.test(x.itemStat(I['shield7-ward']))&&/0\.6% of max health a second out of combat, 0\.2% in combat/.test(x.itemStat(I['shield7-regen'])));
ok('the caps show in the text: a legendary +10 level-60 block reads 50%, steady 75%, ward 60%',/^50% chance/.test(x.itemStat(I['shield10-block-l+10']))&&/^75% shorter/.test(x.itemStat(I['shield10-steady-l+10']))&&/shield of 60% of max/.test(x.itemStat(I['shield10-ward-l+10'])));
ok('enhancing keeps the roll and goes up a step; shields merge like the others, a rolled one does not',x.dgEnhanceNext('shield8-hp-r+1~a57')==='shield8-hp-r+2~a57'&&x.mergedId('shield8-hp')==='shield8-hp-r'&&x.mergedId('shield8-hp~a57')===null);
ok('lines by level: 30 none, 40 one, 50 two, 60 three',x.rlLinesFor(7)===0&&I['shield8-hp~a99'].roll[0].v>0&&I['shield10-hp~a99g99h99'].roll.length===3);

// ---- on a player ----
W.join('a',{name:'A',look:{cls:'warrior'},save:{level:60}}); tick(2); const A=W.players.get('a');
const wear=id=>{ if(!A.gear.inv.includes(id)) A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1); };
const unwear=()=>{ A.gear.eq.shield=null; A.shield=null; A.shdWardT=0; x.recalcP(A); };
A.level=60; x.recalcP(A);
ok('a fresh gear has an empty shield slot',x.newGearFor('warrior').eq.shield===null);
wear('top8'); wear('helmet8');
{ const hp0=A.maxHp, def0=A.def;
  wear('shield10-hp-l'); const hp1=A.maxHp;
  ok('Bulwark: equipping puts it in eq.shield and raises max health by its %',A.gear.eq.shield==='shield10-hp-l'&&near(hp1/hp0,1+I['shield10-hp-l'].v)||Math.abs(hp1/hp0-(1+I['shield10-hp-l'].v))<0.002,hp1+' / '+hp0); unwear();
  wear('shield10-def-l'); ok('Ironwall: defence grows by its % (and the cut with it)',Math.abs(A.def/def0-(1+I['shield10-def-l'].v))<0.01&&A.def>def0&&A.maxHp===hp0); unwear(); }

// ---- block, the floor ----
const hurt=(v,rnd)=>{ A.hp=A.maxHp; A.lastHit=-99; A.shield=null; return withRandom(rnd===undefined?0.5:rnd,()=>x.hurtP(A,v,null)); };
{ const plain=hurt(1000);
  wear('shield7-block'); const blocked=hurt(1000,0.0), missed=hurt(1000,0.99);
  ok('Parry: a blocked hit does 30% of its damage, an unblocked one the full',Math.abs(blocked/plain-0.3)<0.02&&missed===plain,plain+' '+blocked+' '+missed);
  let n=0, N=4000; for(let i=0;i<N;i++){ A.hp=A.maxHp; if(x.shdBlockK(A)<1) n++; }
  ok('the chance is 8% (a sweep of the real rolls blocks about 8 in 100)',n>0.05*N&&n<0.11*N,n+' of '+N);
  A.red=0.89; const plain89=(()=>{ unwear(); A.red=0.89; return hurt(1000); })(); wear('shield7-block'); A.red=0.89;
  const floorHit=hurt(1000,0.0);
  ok('the floor holds: with 89% armour a block still does at least 10% ('+x.DMG_TAKEN_MIN+') of the hit',floorHit>=Math.round(1000*x.DMG_TAKEN_MIN)-1,plain89+' / '+floorHit);
  x.recalcP(A); unwear(); }

// ---- Steady ----
ok('Steady: a stun or slow on you is 30% shorter, a push is not',(()=>{ wear('shield7-steady'); const a=x.shdSteadyDur(A,'root',2), b=x.shdSteadyDur(A,'slow',2), c=x.shdSteadyDur(A,'push',2); unwear(); return near(a,1.4)&&near(b,1.4)&&c===2; })());
ok('Steady without a shield changes nothing, and is capped at 75%',x.shdSteadyDur(A,'root',2)===2&&(()=>{ wear('shield10-steady-l+10'); const a=x.shdSteadyDur(A,'root',4); unwear(); return near(a,1); })());

// ---- Last Ward ----
{ wear('shield7-ward'); A.hp=A.maxHp; A.lastHit=-99; A.shield=null; A.shdWardT=0;
  x.hurtP(A,A.maxHp*0.1,null); ok('Last Ward: a hit that leaves you above 30% does not trigger it',!A.shield&&!A.shdWardT);
  A.hp=A.maxHp*0.31; x.hurtP(A,A.maxHp*0.05,null);
  ok('a hit that leaves you below 30% raises a shield of 20% of max health',A.shield&&Math.abs(A.shield.v-A.maxHp*0.2)<2&&A.shdWardT>x.S.t+x.SHD_WARD_CD-1,JSON.stringify(A.shield));
  A.shield=null; A.hp=A.maxHp*0.2; x.hurtP(A,1,null);
  ok('and not again within 60 s',!A.shield);
  x.S.t+=x.SHD_WARD_CD+1; A.hp=A.maxHp*0.2; x.hurtP(A,1,null);
  ok('but again after the cooldown',!!A.shield);
  A.shield.until=x.S.t+5; A.shield.v=1e9; A.hp=A.maxHp; const before=A.hp; const taken=x.hurtP(A,500,null);
  ok('the shield soaks the next blows (the existing absorb pool)',A.hp===before&&taken===0);
  unwear(); }

// ---- Lifeblood, Mending ----
const M=x.MONS.find(m=>!m.boss&&!m.dead&&!m.pl);
{ wear('shield10-leech-l'); const it=I['shield10-leech-l']; M.hp=1e9; A.hp=1; A.lastHit=-99;
  const dealt=withRandom(0.5,()=>{ A.buff=null; return x.damageMonsterS(M,1,A,M.x-1,M.z,0,null); });
  ok('Lifeblood: a hit heals its share of the damage dealt',dealt>0&&Math.abs((A.hp-1)-dealt*it.v)<=Math.max(1.5,dealt*it.v*0.02),(A.hp-1)+' vs '+(dealt*it.v)); unwear(); }
{ wear('shield7-regen'); const it=I['shield7-regen'];
  A.hp=1; A.lastHit=-99; A.lastDealt=-99; x.shdRegenP(A,1); const out=A.hp-1;
  A.hp=1; A.lastHit=x.S.t; x.shdRegenP(A,1); const inn=A.hp-1;
  ok('Mending: 0.6% of max health a second out of combat, a third of that in combat',Math.abs(out-A.maxHp*it.v)<1.5&&Math.abs(inn-A.maxHp*it.v/3)<1.5,out+' / '+inn);
  unwear(); A.hp=1; A.lastHit=-99; x.shdRegenP(A,1); ok('no shield, no Mending',A.hp===1); }
{ wear('shield7-hp'); A.pv={sk:A.gear.skills,pre:1}; ok('on the Proving Isle (p.pv) no shield counts',x.shdSteadyDur(A,'root',2)===2&&x.shdBlockK(A)===1); A.pv=null; unwear(); }

// ---- equip, sanitize, rolls ----
A.level=29; A.gear.eq.shield=null; A.gear.inv.push('shield7-hp'); W.receive('a',{t:'equip',id:'shield7-hp'}); tick(1);
ok('equip refuses a piece above your level',A.gear.eq.shield!=='shield7-hp'); A.level=60;
wear('shield9-def-e'); W.receive('a',{t:'unequip',slot:'shield'}); tick(1);
ok('unequip empties the slot',A.gear.eq.shield===null);
{ const g=x.sanitizeGear({inv:['sword1','shield8-hp','shield7-def','shield11-def'],eq:{weapon:'sword1',shield:'shield8-hp',gloves:'shield7-def'}},'warrior');
  ok('sanitize keeps a worn shield in eq.shield only, drops one in another slot and a junk id',g.eq.shield==='shield8-hp'&&g.eq.gloves===null&&!g.inv.includes('shield11-def')); }
A.gear.rsa=0; A.gear.rsr=0; A.gear.inv.push('shield8-ward-l'); W.receive('a',{t:'sac',id:'shield8-ward-l'}); tick(1);
ok('sacrificing a legendary level-40 shield pays Armor Reroll Stones (not Accessory)',A.gear.rsa>0&&A.gear.rsr===0&&!A.gear.inv.includes('shield8-ward-l'),A.gear.rsa);
{ const n0=A.gear.rsa; A.gear.inv.push('shield9-hp'); W.receive('a',{t:'reroll',id:'shield9-hp'}); tick(1);
  const n=A.gear.inv.find(i=>i.startsWith('shield9-hp~')); ok('a level-50 shield rolls two lines with an Armor stone',!!n&&A.gear.rsa===n0-1&&I[n].roll.length===2&&I[n].stat==='hp'); }
ok('the shields list in the player shops',require('fs').readFileSync(__dirname+'/../src/server/pshop.js','utf8').includes("'shield'"));

// ---- the Cenote ----
ok('the Cenote pays shields: one of the seven kinds, unrolled, level by the rolled eq (default 40)',x.DG_REWARDS.cenote.kind==='shield'&&x.DG_REWARDS.cenote.pool.join()===x.SHD_IDS.join()&&(()=>{ const seen=new Set(); for(let i=0;i<300;i++){ const id=x.dgClearReward('cenote',null), q=x.dgParse(id); if(!q||q.slot!=='shield'||q.t!==8||q.roll) return false; seen.add(q.stat); } return seen.size===7; })());
ok('and at eq 60 shield10',/^shield10-/.test(x.dgClearReward('cenote',null,3)));
process.exit(fails?1:0);
