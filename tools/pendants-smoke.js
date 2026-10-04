// Headless test of the pendants (shared/pendants.js, pendP in server/players.js, the hooks in rewardKill / rollDmgS), straight from src/, no build: the 100 items and
// their numbers, the slot and its saves, equipping, selling, merging at the forge, what each of the five bonuses does to a kill and to a hit, the caps, the level
// gate, and the testing command. Randomness is pinned (Math.random) wherever a number is compared, so every check is exact. One line per check.
// Usage: node tools/pendants-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},
  ['ITEM','ITEM_LIST','TOOL_LIST','PENDANT_LIST','PENDANT_STATS','PENDANT_LV','PENDANT_TIERS','PENDANT_BASE','CRIT_BASE','CRIT_MULT','CRIT_CAP','CRIT_MULT_CAP','RAR_MULT','pendantId','pendantValue',
   'pendantText','mergedId','sellPrice','newGearFor','sanitizeGear','pendP','recalcP','rollDmgS','rewardKill','monK','MONS','DROP_CHANCE','BAG_MAX','coinsFor']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const near=(a,b,tol)=>Math.abs(a-b)<=tol*Math.max(1e-9,Math.abs(b));
const realRandom=Math.random, pin=v=>{ Math.random=()=>v; }, unpin=()=>{ Math.random=realRandom; };
const I=x.ITEM;

// ---- the items ----
const L=x.PENDANT_LIST;
ok('100 pendants: 5 kinds x 4 dungeon tiers x 5 rarities, all in ITEM, with unique ids of the form pd-<kind><tier>[-<rarity key>]',L.length===100&&new Set(L.map(i=>i.id)).size===100&&L.every(i=>I[i.id]===i&&/^pd-(xp|drop|coin|crit|critdmg)[1-4](-[reul])?$/.test(i.id))&&x.PENDANT_STATS.length===5&&x.PENDANT_TIERS===4);
ok('they are items of kind pendant for the one pendant slot, need level 30 whatever their tier, and are not in ITEM_LIST or TOOL_LIST (no shop, random drop or "all items" gives one)',
  L.every(i=>i.kind==='pendant'&&i.slot==='pendant'&&i.lv===30&&x.PENDANT_LV===30)&&!x.ITEM_LIST.some(i=>i.kind==='pendant')&&!x.TOOL_LIST.some(i=>i.kind==='pendant'));
{ const v=(s,t,r)=>I[x.pendantId(s,t,r)].v;
  ok('the numbers of the plan: a common tier-0 pendant is +6% XP, +10% drops, +10% coins, +2 points of crit, +0.10 crit multiplier; x1 / 1.3 / 1.7 / 2.2 / 3 by rarity',
    v('xp',0,0)===0.06&&v('drop',0,0)===0.1&&v('coin',0,0)===0.1&&v('crit',0,0)===0.02&&v('critdmg',0,0)===0.1&&v('xp',0,4)===0.18&&v('xp',0,1)===0.078&&v('crit',0,3)===0.044&&v('critdmg',0,2)===0.17);
  ok('each dungeon tier adds a quarter of the base: tier III is x1.75 (a legendary XP pendant +31.5%, crit rate +10.5 points, crit multiplier +0.525)',
    v('xp',3,4)===0.315&&v('crit',3,4)===0.105&&v('critdmg',3,4)===0.525&&v('xp',1,0)===0.075&&v('coin',2,0)===0.15); }
ok('their names say what they are (rarity, chain, kind) and their text says what they do',I['pd-xp1'].name==='Slate Pendant of Learning'&&I['pd-critdmg4-l'].name==='Legendary Obsidian Pendant of Ruin'&&
  x.pendantText(I['pd-xp1-r'])==='+7.8% XP from kills'&&x.pendantText(I['pd-drop1'])==='+10% chance of monster drops'&&x.pendantText(I['pd-coin1'])==='+10% coins from kills'&&
  x.pendantText(I['pd-crit1'])==='+2% critical hit chance'&&x.pendantText(I['pd-critdmg1'])==='Critical hits deal x1.80 (instead of x1.7)');
ok('the crit numbers that used to be literals are unchanged (12%, x1.7), with a cap of 60% chance and x2.5 damage',x.CRIT_BASE===0.12&&x.CRIT_MULT===1.7&&x.CRIT_CAP===0.6&&x.CRIT_MULT_CAP===2.5);
ok('the forge works for them: three of one id become the next rarity of the same kind and tier, a legendary has none, and gear and tools merge as before',
  x.mergedId('pd-xp1')==='pd-xp1-r'&&x.mergedId('pd-critdmg4-e')==='pd-critdmg4-u'&&x.mergedId('pd-coin2-u')==='pd-coin2-l'&&x.mergedId('pd-xp1-l')===null&&
  x.mergedId('sword2')==='sword2-r'&&x.mergedId('helmet6-u')==='helmet6-l'&&x.mergedId('pick3-e')==='pick3-u'&&x.mergedId('axe1-l')===null);
ok('every existing item still merges to the id the old rule gave (slot, tier, next rarity)',x.ITEM_LIST.concat(x.TOOL_LIST).every(i=>i.rar>=4?x.mergedId(i.id)===null:x.mergedId(i.id)===i.slot+(i.tier+1)+'-'+'reul'[i.rar]));

// ---- saves ----
{ const g=x.newGearFor('mage'); ok('a new character has an empty pendant slot (and an old save without one loads with it empty)',g.eq.pendant===null&&x.sanitizeGear({inv:['sword1'],eq:{weapon:'sword1',helmet:null}},'warrior').eq.pendant===null); }
{ const s=x.sanitizeGear({inv:['sword1','pd-xp1-e','helmet1'],eq:{weapon:'sword1',pendant:'pd-xp1-e'}},'warrior');
  ok('a worn pendant in the bag is kept',s.eq.pendant==='pd-xp1-e');
  ok('... but not one that is not in the bag, not another kind of item, and not junk',x.sanitizeGear({inv:['sword1'],eq:{weapon:'sword1',pendant:'pd-xp1-e'}},'warrior').eq.pendant===null&&
    x.sanitizeGear({inv:['sword1','helmet1'],eq:{weapon:'sword1',pendant:'helmet1'}},'warrior').eq.pendant===null&&x.sanitizeGear({inv:['sword1'],eq:{weapon:'sword1',pendant:{a:1}}},'warrior').eq.pendant===null&&
    x.sanitizeGear({inv:['sword1','pd-bogus9'],eq:{weapon:'sword1',pendant:'pd-bogus9'}},'warrior').eq.pendant===null);
  ok('a pendant cannot sit in another slot (a helmet slot holding a pendant is cleared)',x.sanitizeGear({inv:['sword1','pd-xp1'],eq:{weapon:'sword1',helmet:'pd-xp1'}},'warrior').eq.helmet===null); }

// ---- the server: equip, take off, buy, sell, merge ----
W.join('a',{name:'Hiker',look:{cls:'warrior'},save:{level:20}}); W.join('b',{name:'Other',look:{cls:'warrior'},save:{level:45}}); tick(2);
const A=W.players.get('a'), B=W.players.get('b');
A.gear.inv.push('pd-xp1','pd-xp1-r'); W.receive('a',{t:'equip',id:'pd-xp1'}); tick(1);
ok('a level-20 hiker cannot wear a level-30 pendant',A.gear.eq.pendant===null);
A.level=30; x.recalcP(A); const hp0=A.maxHp, dmg0=A.dmg; W.receive('a',{t:'equip',id:'pd-xp1'}); tick(1);
ok('at level 30 they can; the slot holds it and the pendant does not touch health or attack',A.gear.eq.pendant==='pd-xp1'&&A.maxHp===hp0&&A.dmg===dmg0);
{ const hp=A.maxHp, dmg=A.dmg; W.receive('a',{t:'equip',id:'pd-xp1-r'}); tick(1); ok('wearing another swaps it',A.gear.eq.pendant==='pd-xp1-r'&&A.maxHp===hp&&A.dmg===dmg); }
W.receive('a',{t:'unequip',slot:'pendant'}); tick(1);
ok('and it comes off (back in the bag)',A.gear.eq.pendant===null&&A.gear.inv.includes('pd-xp1-r'));
{ A.gear.coins=1e6; const n0=A.gear.inv.length; W.receive('a',{t:'buy',id:'pd-xp1'}); W.receive('a',{t:'buy',id:'pd-crit1'}); tick(1);
  ok('no shop sells a pendant (a hostile client cannot buy one with coins)',A.gear.coins===1e6&&A.gear.inv.length===n0); }
{ const c0=A.gear.coins; W.receive('a',{t:'sell',id:'pd-xp1-r'}); tick(1);
  ok('one can be sold for 40% of its price',A.gear.coins===c0+x.sellPrice(I['pd-xp1-r'])&&x.sellPrice(I['pd-xp1-r'])===Math.round(I['pd-xp1-r'].price*0.4)); }
{ A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pd-')); A.gear.inv.push('pd-coin1','pd-coin1','pd-coin1'); A.gear.eq.pendant=null; W.receive('a',{t:'merge',id:'pd-coin1'}); tick(1);
  ok('three common pendants merge at the forge into one rare one of the same kind',A.gear.inv.filter(i=>i==='pd-coin1').length===0&&A.gear.inv.filter(i=>i==='pd-coin1-r').length===1);
  A.gear.inv.push('pd-coin1','pd-coin1'); A.gear.eq.pendant='pd-coin1'; W.receive('a',{t:'merge',id:'pd-coin1'}); tick(1);
  ok('... but the one you wear does not count towards the three',A.gear.inv.filter(i=>i==='pd-coin1').length===2&&A.gear.inv.filter(i=>i==='pd-coin1-r').length===1); }
{ A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pd-')); A.gear.eq.pendant=null; W.receive('a',{t:'dev',cmd:'givePendants'}); tick(1);
  const n=A.gear.inv.filter(i=>i.startsWith('pd-')).length; A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pd-')); W.receive('a',{t:'dev',cmd:'givePendants',v:3}); tick(1);
  const t3=A.gear.inv.filter(i=>i.startsWith('pd-'));
  ok('the testing command adds every pendant (100), or one tier of them (25, tier III here)',n===100&&t3.length===25&&t3.every(i=>/^pd-[a-z]+4/.test(i)),n+' / '+t3.length); }

// ---- what each bonus does ----
const wear=(p,id)=>{ p.gear.eq.pendant=id; if(id&&!p.gear.inv.includes(id)) p.gear.inv.push(id); };
const mon=x.MONS.find(m=>!m.boss&&!m.temp&&m.def.level===28&&m.def.id==='minegoblin')||x.MONS.find(m=>!m.boss&&!m.temp&&m.def.level>=26);
B.level=45; x.recalcP(B);
{ ok('pendP reads only the worn pendant of that kind',(wear(B,null),x.pendP(B,'xp')===0)&&(wear(B,'pd-xp1-l'),x.pendP(B,'xp')===0.18&&x.pendP(B,'coin')===0&&x.pendP(B,'crit')===0)); }
{ pin(0.5); const gain=id=>{ wear(B,id); B.exp=0; B.level=45; x.rewardKill(B,mon); return B.exp; };
  const e0=gain(null), e1=gain('pd-xp1-l'), e2=gain('pd-xp4-l'), e3=gain('pd-coin1-l');
  ok('the XP pendant raises the XP of a kill by its value (+18% legendary, +31.5% tier-III legendary) and a coin pendant does not',e0>0&&near(e1/e0,1.18,1e-3)&&near(e2/e0,1.315,1e-3)&&e3===e0,(e1/e0).toFixed(3)+' / '+(e2/e0).toFixed(3)); unpin(); }
{ pin(0.5); const gain=id=>{ wear(B,id); B.gear.coins=0; x.rewardKill(B,mon); return B.gear.coins; };
  const c0=gain(null), c1=gain('pd-coin1-l'), c2=gain('pd-coin2'), c3=gain('pd-xp1-l');
  ok('the coin pendant raises the coins of a kill (+30% legendary, +12.5% tier-I common), rounded to whole coins; the XP pendant does not',c0>0&&c1===Math.round(c0*1.3)&&c2===Math.round(c0*1.125)&&c3===c0&&Number.isInteger(c1),c0+' / '+c1+' / '+c2); unpin(); }
{ // a drop needs Math.random() < DROP_CHANCE x (1 + bonus): pinned at 0.4 it fails at +0% (0.35) and passes at +30% (0.455) and at +20% (0.42), but not at +10% (0.385)
  const matsOf=p=>Object.values(p.gear.mats||{}).reduce((a,b)=>a+b,0), got=id=>{ wear(B,id); B.gear.mats={}; pin(0.4); x.rewardKill(B,mon); unpin(); return matsOf(B); };
  ok('the drop pendant raises the chance of a material drop (0.35 x 1.3 passes a roll of 0.4, 0.35 x 1.1 does not), and no other kind does',got(null)===0&&got('pd-drop1-l')===1&&got('pd-drop1-e')===1&&got('pd-drop1')===0&&got('pd-xp1-l')===0&&x.DROP_CHANCE===0.35); }
{ // crit rate: a roll of 0.14 is no crit at 12% but is one with +6 points (18%)
  const hit=(p,r)=>{ pin(r); const d=x.rollDmgS(p,1,null,null); unpin(); return d.crit; };
  wear(B,null); const base=hit(B,0.14); wear(B,'pd-crit1-l'); const withP=hit(B,0.14), belowEdge=hit(B,0.19); wear(B,'pd-xp1-l'); const other=hit(B,0.14);
  ok('the crit-rate pendant moves the edge of a crit from 12% to 18% (legendary): a roll of 0.14 crits with it only, 0.19 never; an XP pendant does nothing',!base&&withP&&!belowEdge&&!other);
  // the cap: a huge crit chance still stops at 60%
  const fake=(stat,v)=>{ I['pd-fake']={id:'pd-fake',base:'pd-fake',kind:'pendant',slot:'pendant',stat,v,lv:1,tier:0,rar:0,name:'Fake',price:1}; B.gear.eq.pendant='pd-fake'; };
  fake('crit',5); const cap1=hit(B,0.59), cap2=hit(B,0.61); B.buff={crit:2,dmg:1}; const cap3=hit(B,0.61); B.buff=null;
  ok('total crit chance is capped at 60% however much is stacked (pendant, potion buff)',cap1&&!cap2&&!cap3); }
{ // crit damage: rolls pinned so every hit crits and the +-15% spread is the same; the ratio of the damage is the ratio of the multipliers
  const dmg=id=>{ wear(B,id); pin(0.01); const d=x.rollDmgS(B,1,null,null); unpin(); return d; };
  const d0=dmg(null), d1=dmg('pd-critdmg1-l'), d2=dmg('pd-critdmg4-l'), d3=dmg('pd-crit1-l');
  ok('every pinned hit crits; the crit-damage pendant raises the crit multiplier (1.7 -> 2.0 legendary, 2.225 tier-III legendary), a crit-rate pendant does not',d0.crit&&d1.crit&&near(d1.v/d0.v,2.0/1.7,0.01)&&near(d2.v/d0.v,2.225/1.7,0.01)&&d3.v===d0.v,(d1.v/d0.v).toFixed(3)+' / '+(d2.v/d0.v).toFixed(3));
  I['pd-fake'].v=0; B.gear.eq.pendant='pd-fake'; I['pd-fake'].stat='critdmg'; I['pd-fake'].v=5; pin(0.01); const dc=x.rollDmgS(B,1,null,null); unpin();
  ok('the crit multiplier is capped at x2.5',near(dc.v/d0.v,2.5/1.7,0.01),(dc.v/d0.v).toFixed(3));
  pin(0.99); const n0=x.rollDmgS(B,1,null,null); unpin(); wear(B,null); pin(0.99); const n1=x.rollDmgS(B,1,null,null); unpin();
  ok('a hit that does not crit is untouched by a crit pendant',!n0.crit&&n0.v===n1.v); }
{ delete I['pd-fake']; wear(B,'pd-xp1-l'); B.level=29; ok('below level 30 a worn pendant gives nothing (a lowered level cannot keep the bonus)',x.pendP(B,'xp')===0); B.level=45; ok('... and at 30 or more it does again',x.pendP(B,'xp')===0.18); }

console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
