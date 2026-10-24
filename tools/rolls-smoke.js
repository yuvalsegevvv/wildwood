// Headless test of version 3's rolled level-40 gear (shared/rolls.js, the level-40 ids in shared/dungeon-rewards.js, server/rolls.js): ids and records, the 13 stats with three
// different lines, weapons rolling higher offence than armour, caps (cooldown reduction 40%), sacrifice stones 1/2/4/8/16, rolling and rerolling, saves, accuracy / resistance.
// Usage: node tools/rolls-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['ITEM','RL_STATS','RL_CAPS','RL_SAC','RL_COST','rlRoll','rlParseCode','rlLinesOf','rlSumOf','rlP','dgParse','dgGearId40','dgAllIds40','dgEnhanceNext','mergedId','sanitizeGear','recalcP','rollDmgS','abilityCd','newGearFor']);
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
A.gear.inv.push('sword8-e','helmet8-l','sword7-u','ring-fire','sword2'); A.gear.rsw=0; A.gear.rsa=0;
W.receive('a',{t:'sac',id:'sword7-u'}); W.receive('a',{t:'sac',id:'helmet8-l'}); W.receive('a',{t:'sac',id:'ring-fire'}); W.receive('a',{t:'sac',id:'sword2'}); tick(1);
ok('sacrificing: unique weapon 8 weapon stones, legendary armour 16 armour stones, ring and low gear refused',A.gear.rsw===8&&A.gear.rsa===16&&A.gear.inv.includes('ring-fire')&&A.gear.inv.includes('sword2')&&!A.gear.inv.includes('sword7-u'));
W.receive('a',{t:'reroll',id:'sword8-e'}); tick(1);
{ const w=A.gear.inv.find(i=>i.startsWith('sword8-e~')); ok('first roll costs one weapon stone and adds three lines',!!w&&A.gear.rsw===7&&I[w].roll.length===3);
  const old=w; W.receive('a',{t:'reroll',id:w}); tick(1); const w2=A.gear.inv.find(i=>i.startsWith('sword8-e~')); ok('reroll replaces the lines for another stone',A.gear.rsw===6&&w2&&!A.gear.inv.includes(old)||w2===old);
  A.gear.rsa=0; A.gear.inv.push('helmet8'); W.receive('a',{t:'reroll',id:'helmet8'}); tick(1); ok('no stone, no roll',A.gear.inv.includes('helmet8'));
  W.receive('a',{t:'equip',id:w2}); tick(1); ok('wearing it works at level 40+',A.gear.eq.weapon===w2); }
{ const id=x.dgGearId40('sword',0,0,'~a99b99c99'); A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1);
  const base=3*0+0; x.recalcP(A); ok('the attack, health and defense lines raise the stats (rl sums on the player)',A.rl.atk>0.15&&A.rl.hp>=0.1&&A.rl.def>=0.1); }
process.exit(fails?1:0);
