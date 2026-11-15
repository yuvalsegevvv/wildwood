// Headless test of the capes (dungeon revamp D5: shared/capes.js, the cape ids in shared/dungeon-rewards.js, eq.cape, server/rolls.js): the eight combos and their letters, ids, plus (rarity, legendary x2,
// tempering, level x1.15) and minus (tempering only), caps, the minus floor at zero, equip and sanitize, rolled lines, sacrifice, the Gloamvault paying capes. Usage: node tools/capes-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['ITEM','CAPE_COMBOS','CAPE_IDS','CAPE_BY_ID','RL_BY_KEY','RL_CAPS','capeVals','capeNet','dgParse','dgItem','dgCapeId','dgAllCapeIds','dgEnhanceNext','dgClearReward','DG_REWARDS','rlP','rlSumOf','rlMinusOf','sanitizeGear','recalcP','newGearFor','RAR_MULT','mergedId','rlLinesFor','itemStat','psP','CRIT_BASE','CRIT_MULT']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const I=x.ITEM, near=(a,b)=>Math.abs(a-b)<1e-9;

ok('eight combos; each id is plus letter + minus letter of the rolled-stat letters (RL_STATS), plus and minus differ',x.CAPE_COMBOS.length===8&&x.CAPE_COMBOS.every(c=>x.RL_BY_KEY[c.id[0]].id===c.plus.stat&&x.RL_BY_KEY[c.id[1]].id===c.minus.stat&&c.plus.stat!==c.minus.stat));
ok('every one of the six stats is the plus of at least one combo',['atk','crit','critdmg','aspd','cdr','chg'].every(s=>x.CAPE_COMBOS.some(c=>c.plus.stat===s)));
ok('280 unrolled capes a level (8 x 35), lv 30 / 40 / 50 / 60, slot cape, not in a shop list',[7,8,9,10].every((t,i)=>x.dgAllCapeIds(t).length===280&&x.dgAllCapeIds(t).every(id=>I[id]&&I[id].kind==='cape'&&I[id].slot==='cape'&&I[id].lv===30+10*i&&I[id].dg)));
ok('ids parse: cape9-gh-e+4~a57k12 is a level-50 epic Hawk at +4 with two lines',(()=>{ const q=x.dgParse('cape9-gh-e+4~a57k12'); return q&&q.slot==='cape'&&q.combo==='gh'&&q.rar===2&&q.n===4&&q.t===9&&q.roll==='~a57k12'; })()&&x.dgItem('cape9-gh-e+4~a57k12').roll.length===2);
ok('junk capes are no items: a level-30 roll, a wrong line count, a bad combo, too much tempering, as (the old plan id)',!I['cape7-gh~a57']&&!I['cape8-gh~a57k12']&&!I['cape10-gh~a57k12']&&!I['cape8-xx']&&!I['cape8-as']&&!I['cape8-gh-c+3']&&!I['cape8-gh+1~a57~a57']&&!I['cape11-gh']);
{ const a=I['cape7-al'], g=I['cape7-gh'], h=I['cape7-hg'];
  ok('a common +0 level-30 cape has the plan\'s numbers',near(a.plus.v,0.12)&&a.plus.stat==='atk'&&near(a.minus.v,0.05)&&a.minus.stat==='aspd'&&near(g.plus.v,0.06)&&near(g.minus.v,0.15)&&near(h.plus.v,0.30)&&near(h.minus.v,0.03)); }
{ const c=n=>I[n]; const base=c('cape7-al').plus.v;
  ok('plus by rarity: x RAR_MULT (1 / 1.3 / 1.7 / 2.2) and a legendary x2 (not x3)',near(c('cape7-al-r').plus.v,base*1.3)&&near(c('cape7-al-e').plus.v,base*1.7)&&near(c('cape7-al-u').plus.v,base*2.2)&&near(c('cape7-al-l').plus.v,base*2));
  ok('plus by tempering: +10% a step (a +10 legendary: 2 x 2 x base)',near(c('cape7-al+2').plus.v,base*1.2)&&near(c('cape7-al-l+10').plus.v,base*4));
  ok('plus by level: x1.15 a step above 30 (40: 1.15, 50: 1.3225, 60: 1.520875)',near(c('cape8-al').plus.v,base*1.15)&&near(c('cape9-al').plus.v,base*1.3225)&&near(c('cape10-al').plus.v,Math.round(base*1.520875*10000)/10000));
  const m=c('cape7-al').minus.v;
  ok('minus by tempering only: +10% a step; rarity and level do not touch it',near(c('cape7-al+2').minus.v,m*1.2)&&near(c('cape7-al-l+10').minus.v,m*2)&&near(c('cape10-al-l').minus.v,m)&&near(c('cape9-al-e').minus.v,m)); }
ok('the item text names both ends and the name carries rarity and level',/^\+12% attack, -5% attack speed$/.test(I['cape7-al'].plus&&x.itemStat?x.itemStat(I['cape7-al']):'')&&/Legendary Cape of the Hawk Lv60 \+10/.test(I['cape10-gh-l+10'].name));
ok('enhancing a cape keeps its roll and goes up a step; capes merge like the others, a rolled one does not',x.dgEnhanceNext('cape8-gh-r+1~a57')==='cape8-gh-r+2~a57'&&x.mergedId('cape8-gh')==='cape8-gh-r'&&x.mergedId('cape8-gh~a57')===null);
ok('lines by level: 30 none, 40 one, 50 two, 60 three (a cape\'s range is the accessory\'s)',x.rlLinesFor(7)===0&&I['cape8-gh~a99'].roll[0].v>0&&I['cape10-gh~a99g99h99'].roll.length===3);

// ---- caps and the minus floor (pure) ----
{ const items=[{lv:30,kind:'cape',plus:{stat:'cdr',v:0.10},minus:{stat:'atk',v:0.06}},{lv:30,roll:[{stat:'cdr',v:0.38}]}];
  ok('the plus counts inside the cap: cdr 10% cape + 38% line is 40%, not 48%',near(x.rlSumOf(items,'cdr',30),0.40));
  ok('a cape above your level counts for nothing, plus and minus',x.rlSumOf(items,'cdr',29)===0&&x.rlMinusOf(items,'atk',29)===0&&near(x.rlMinusOf(items,'atk',30),0.06)); }
ok('capeNet: the minus comes off the capped sum, never takes the total below zero',near(x.capeNet(0.4,0.05,0),0.35)&&x.capeNet(0.02,0.05,0)===0&&near(x.capeNet(0,0.05,0.03),-0.03)&&x.capeNet(0.1,0,0)===0.1);

// ---- on a player ----
W.join('a',{name:'A',look:{cls:'warrior'},save:{level:60}}); tick(2); const A=W.players.get('a');
const wear=id=>{ if(!A.gear.inv.includes(id)) A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1); };
A.level=60; x.recalcP(A);
ok('a fresh gear has an empty cape slot',x.newGearFor('warrior').eq.cape===null);
const dmg0=A.dmg; wear('cape10-al-l'); 
ok('equipping puts it in eq.cape, and its attack plus raises damage (x1 + 0.12 x 2 x 1.5209)',A.gear.eq.cape==='cape10-al-l'&&near(x.rlP(A,'atk'),I['cape10-al-l'].plus.v)&&A.dmg>dmg0*1.3);
ok('the minus (attack speed) cannot go below zero in total with no attack speed from anywhere else',x.rlP(A,'aspd')===0);
wear('cape8-hg-l'); const crit=x.rlP(A,'critdmg');
ok('Headsman: crit damage plus in the rolled sum, crit chance minus takes from the base 12% (the cape\'s own -3%)',near(crit,I['cape8-hg-l'].plus.v)&&near(x.rlP(A,'crit'),-I['cape8-hg-l'].minus.v));
A.gear.inv.push('cape30-x'); A.gear.eq.cape='cape9-ia'; A.level=40; x.recalcP(A);
ok('a cape above your level counts for nothing (level 50 cape at hiker level 40)',x.rlP(A,'cdr')===0&&x.rlP(A,'atk')===0);
A.level=60; A.gear.eq.cape=null; x.recalcP(A);
W.receive('a',{t:'equip',id:'cape7-ai'}); tick(1); A.level=29; A.gear.eq.cape=null; A.gear.inv.push('cape7-gh'); W.receive('a',{t:'equip',id:'cape7-gh'}); tick(1);
ok('equip refuses a piece above your level',A.gear.eq.cape!=='cape7-gh');
A.level=60; wear('cape9-mi-e'); W.receive('a',{t:'unequip',slot:'cape'}); tick(1);
ok('unequip empties the slot and the bonus goes',A.gear.eq.cape===null&&x.rlP(A,'chg')===0);
{ const g=x.sanitizeGear({inv:['sword1','cape8-gh','cape7-al','cape11-al'],eq:{weapon:'sword1',cape:'cape8-gh',talisman:'cape7-al'}},'warrior');
  ok('sanitize keeps a worn cape in eq.cape only, drops a cape in another slot and a junk id',g.eq.cape==='cape8-gh'&&g.eq.talisman===null&&!g.inv.includes('cape11-al')); }
A.gear.rsr=0; A.gear.inv.push('cape8-gh-l'); W.receive('a',{t:'sac',id:'cape8-gh-l'}); tick(1);
ok('sacrificing a legendary level-40 cape pays 24 Accessory Reroll Stones (16 x1.5); rolling one costs 1',A.gear.rsr===24&&!A.gear.inv.includes('cape8-gh-l'));
A.gear.inv.push('cape9-hg'); W.receive('a',{t:'reroll',id:'cape9-hg'}); tick(1);
{ const n=A.gear.inv.find(i=>i.startsWith('cape9-hg~')); ok('a level-50 cape rolls two lines with an Accessory stone',!!n&&A.gear.rsr===23&&I[n].roll.length===2&&I[n].plus.stat==='critdmg'); }

// ---- the Gloamvault ----
ok('the Gloamvault pays capes: one of the eight combos, unrolled, level by the rolled eq (default 40)',x.DG_REWARDS.gloamvault.kind==='cape'&&x.DG_REWARDS.gloamvault.pool.join()===x.CAPE_IDS.join()&&(()=>{ const seen=new Set(); for(let i=0;i<200;i++){ const id=x.dgClearReward('gloamvault',null), q=x.dgParse(id); if(!q||q.slot!=='cape'||q.t!==8||q.roll) return false; seen.add(q.combo); } return seen.size===8; })());
ok('and at eq 60 a cape10',/^cape10-/.test(x.dgClearReward('gloamvault',null,3)));
process.exit(fails?1:0);
