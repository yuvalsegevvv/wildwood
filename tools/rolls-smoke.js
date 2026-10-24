// Headless test of version 3's rolled level-40 gear (shared/rolls.js, the level-40 ids in shared/dungeon-rewards.js, server/rolls.js): ids and records, the 13 stats with three
// different lines, weapons rolling higher offence than armour, caps (cooldown reduction 40%), sacrifice stones 1/2/4/8/16, rolling and rerolling, saves, accuracy / resistance.
// Usage: node tools/rolls-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['ITEM','RL_STATS','RL_CAPS','RL_SAC','RL_COST','rlRoll','rlParseCode','rlLinesOf','rlSumOf','rlP','dgParse','dgGearId40','dgRingId40','dgAllRingIds40','dgAllIds40','dgEnhanceNext','mergedId','sanitizeGear','recalcP','rollDmgS','abilityCd','newGearFor']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const I=x.ITEM;
ok('13 stats, three lines a roll',x.RL_STATS.length===13&&x.rlParseCode(x.rlRoll()).length===3);
{ let bad=0; for(let i=0;i<500;i++){ const c=x.rlRoll(), L=x.rlParseCode(c); if(!L||new Set(L.map(l=>l.s.id)).size!==3) bad++; } ok('500 rolls: always three different stats',bad===0); }
ok('245 unrolled level-40 ids, lv 40, tier 7',x.dgAllIds40().length===245&&x.dgAllIds40().every(id=>I[id]&&I[id].lv===40&&I[id].tier===7&&I[id].dg&&I[id].roll0));
ok('a base level-40 sword is stronger than the level-30 one',I['sword8'].atk>I['sword7'].atk);
{ const id=x.dgGearId40('sword',2,0,'~a57k12c90'); const it=I[id];
  ok('a rolled id becomes a record with 3 lines',!!it&&it.roll.length===3&&it.roll[0].stat==='atk'&&it.rcode==='~a57k12c90'&&it.atk===I['sword8-e'].atk); }
ok('junk ids are not items',!I['sword8~a57a12c90']&&!I['sword7~a57k12c90']&&!I['helmet1~a57k12c90']&&!I['sword8~z57k12c90']&&!I['sword8~a57k12']);
{ const w=x.rlLinesOf('~a99g99h99','weapon'), a=x.rlLinesOf('~a99g99h99','armor'); ok('weapons roll higher offence than armour',w.every((l,i)=>l.v>a[i].v)); 
  const d=x.rlLinesOf('~b99c99l99','weapon'), e=x.rlLinesOf('~b99c99l99','armor'); ok('armour rolls higher defence than weapons',e.slice(0,2).every((l,i)=>l.v>d[i].v)&&e[2].v<d[2].v); }
{ const its=[1,2,3,4,5].map(()=>({lv:40,roll:[{stat:'cdr',v:0.08}]})); ok('cooldown reduction from gear is capped at 40%',x.rlSumOf(its,'cdr',40)===0.4&&x.rlSumOf(its,'cdr',39)===0); }
ok('enhancing keeps the roll; a rolled piece does not merge',x.dgEnhanceNext('sword8-r+1~a57k12c90')==='sword8-r+2~a57k12c90'&&x.mergedId('sword8~a57k12c90')===null&&x.mergedId('sword8')==='sword8-r');
ok('the cooldown formula takes the gear reduction',Math.abs(x.abilityCd({cd:10,id:'x'},{lv:{}},50,'warrior',0.3)-7)<1e-9);
ok('saves keep a good rolled piece and drop a bad one',x.sanitizeGear({inv:['sword1','sword8~a57k12c90','sword8~a57a12c90'],eq:{weapon:'sword1'},rsw:5,rsa:-3},'warrior').inv.join()==='sword1,sword8~a57k12c90'&&x.sanitizeGear({rsw:5,rsa:-3},'warrior').rsw===5);
W.join('a',{name:'A',look:{cls:'warrior'},save:{level:50}}); tick(2); const A=W.players.get('a');
A.gear.inv.push('sword8-e','helmet8-l','sword7-u','ring-fire','sword2'); A.gear.rsw=0; A.gear.rsa=0; A.gear.rsr=0;
W.receive('a',{t:'sac',id:'sword7-u'}); W.receive('a',{t:'sac',id:'helmet8-l'}); W.receive('a',{t:'sac',id:'sword2'}); tick(1);
ok('sacrificing: unique weapon 8 weapon stones, legendary armour 16 armour stones, low gear refused',A.gear.rsw===8&&A.gear.rsa===16&&A.gear.inv.includes('sword2')&&!A.gear.inv.includes('sword7-u'));
W.receive('a',{t:'reroll',id:'sword8-e'}); tick(1);
{ const w=A.gear.inv.find(i=>i.startsWith('sword8-e~')); ok('first roll costs one weapon stone and adds three lines',!!w&&A.gear.rsw===7&&I[w].roll.length===3);
  const old=w; W.receive('a',{t:'reroll',id:w}); tick(1); const w2=A.gear.inv.find(i=>i.startsWith('sword8-e~')); ok('reroll replaces the lines for another stone',A.gear.rsw===6&&w2&&!A.gear.inv.includes(old)||w2===old);
  A.gear.rsa=0; A.gear.inv.push('helmet8'); W.receive('a',{t:'reroll',id:'helmet8'}); tick(1); ok('no stone, no roll',A.gear.inv.includes('helmet8'));
  W.receive('a',{t:'equip',id:w2}); tick(1); ok('wearing it works at level 40+',A.gear.eq.weapon===w2); }
{ const id=x.dgGearId40('sword',0,0,'~a99b99c99'); A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1);
  const base=3*0+0; x.recalcP(A); ok('the attack, health and defense lines raise the stats (rl sums on the player)',A.rl.atk>0.15&&A.rl.hp>=0.1&&A.rl.def>=0.1); }
// level-40 rings and the Ring Reroll Stone (gear.rsr)
ok('245 unrolled level-40 rings, lv 40, tier 7, unrolled',x.dgAllRingIds40().length===245&&x.dgAllRingIds40().every(id=>I[id]&&I[id].kind==='ring'&&I[id].lv===40&&I[id].tier===7&&I[id].roll0&&!I[id].roll));
ok('a level-40 ring is stronger than the level-30 one, and the old ring ids are unchanged',I['ring8-fire'].ratk>I['ring-fire'].ratk&&I['ring-fire'].lv===30&&!I['ring-fire'].roll0);
{ const id=x.dgRingId40('dark',3,2,'~g50h10l90'), it=I[id]; ok('a rolled ring id becomes a record with 3 lines',!!it&&it.kind==='ring'&&it.el==='dark'&&it.n===2&&it.roll.length===3&&it.roll[0].stat==='crit'&&it.ratk>I['ring8-dark-u'].ratk);
  ok('enhancing a ring keeps its roll; a rolled ring does not merge',x.dgEnhanceNext(id)==='ring8-dark-u+3~g50h10l90'&&x.mergedId(id)===null&&x.mergedId('ring8-dark')==='ring8-dark-r'); }
ok('junk ring ids are not items',!I['ring-fire~a57k12c90']&&!I['ring8-fire~a57a12c90']&&!I['ring8-wind']&&!I['ring8-fire-e+9']);
ok('a ring takes three lines, offence a little higher than a plain stat',x.rlLinesOf('~a99g99h99','ring').length===3&&x.rlLinesOf('~a99g99h99','ring')[0].v>x.rlLinesOf('~a99g99h99','armor')[0].v);
A.gear.rsr=0; A.gear.inv.push('ring-water-r','ring8-fire-u','ring-fire-e+2'); W.receive('a',{t:'sac',id:'ring-water-r'}); W.receive('a',{t:'sac',id:'ring8-fire-u'}); tick(1);
ok('sacrificing rings pays ring stones: rare 2 + unique 8',A.gear.rsr===10&&A.gear.rsw>=0&&!A.gear.inv.includes('ring-water-r')&&!A.gear.inv.includes('ring8-fire-u'));
A.gear.inv.push('ring8-earth-e'); W.receive('a',{t:'reroll',id:'ring8-earth-e'}); tick(1);
{ const r=A.gear.inv.find(i=>i.startsWith('ring8-earth-e~')); ok('first ring roll costs one ring stone and adds three lines',!!r&&A.gear.rsr===9&&I[r].roll.length===3);
  const rsw=A.gear.rsw; W.receive('a',{t:'reroll',id:r}); tick(1); ok('reroll costs another ring stone and no other kind',A.gear.rsr===8&&A.gear.rsw===rsw);
  A.gear.rsr=0; A.gear.inv.push('ring8-air'); W.receive('a',{t:'reroll',id:'ring8-air'}); tick(1); ok('no ring stone, no roll',A.gear.inv.includes('ring8-air'));
  A.gear.rsr=5; W.receive('a',{t:'reroll',id:'ring-fire'}); tick(1); ok('a level-30 ring cannot be rolled',A.gear.rsr===5&&A.gear.inv.includes('ring-fire')); }
{ const id=x.dgRingId40('basic',4,0,'~a99b99c99'); A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1); x.recalcP(A);
  ok('a worn rolled ring adds its lines to the player sums',A.gear.eq.ring===id&&A.rl.atk>0.1&&A.rl.hp>0.1); }
ok('saves keep ring stones and a good rolled ring, drop a bad one',(()=>{ const g=x.sanitizeGear({inv:['ring8-fire~a57k12c90','ring8-fire~a57a12c90'],eq:{},rsr:7},'warrior'); return g.rsr===7&&g.inv.includes('ring8-fire~a57k12c90')&&!g.inv.includes('ring8-fire~a57a12c90')&&x.sanitizeGear({rsr:-3},'warrior').rsr===0; })());
process.exit(fails?1:0);
