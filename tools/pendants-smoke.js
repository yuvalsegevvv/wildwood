// Headless test of the pendants (shared/pendants.js, the level-30 pieces of shared/dungeon-rewards.js and dungeon-items.js, pendP in server/players.js, the hooks in rewardKill / rollDmgS),
// straight from src/, no build: the 175 items and their numbers, the pendant slot beside the ring slot and their saves, equipping, selling, merging at the forge, tempering with Tempering Stones
// like every level-30 piece, what a clear of the Greyspine's dungeon pays, what each of the five bonuses does to a kill and to a hit, the caps and the level gate. Randomness is pinned
// (Math.random) wherever a number is compared, so every check is exact. One line per check.
// Usage: node tools/pendants-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},
  ['ITEM','ITEM_LIST','TOOL_LIST','PENDANT_STATS','PENDANT_BASE','PENDANT_NAMES','CRIT_BASE','CRIT_MULT','CRIT_CAP','CRIT_MULT_CAP','RAR_MULT','ENH_MAX','ENH_STEP','DG_REWARDS','DG_REWARD_W','RING_ELS',
   'dgAllIds','dgPendantId','dgRingId','dgGearId','dgItem','dgParse','dgMergedId','dgEnhanceNext','dgClearReward','dgGrantItemP','pendantText','mergedId','sellPrice','newGearFor','sanitizeGear',
   'pendP','recalcP','rollDmgS','rewardKill','monK','MONS','DROP_CHANCE','BAG_MAX','soulOfP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const near=(a,b,tol)=>Math.abs(a-b)<=tol*Math.max(1e-9,Math.abs(b));
const realRandom=Math.random, pin=v=>{ Math.random=()=>v; }, unpin=()=>{ Math.random=realRandom; };
const I=x.ITEM, PID=(s,r,n)=>x.dgPendantId(s,r,n);

// ---- the items ----
const ids=x.dgAllIds().filter(id=>id.startsWith('pendant-'));
ok('175 pendants: 5 kinds x (3 + 5 + 7 + 9 + 11 = 35) rarities and enhancement steps, ids pendant-<kind>[-<rarity key>][+n], all ITEM records',ids.length===175&&new Set(ids).size===175&&x.PENDANT_STATS.length===5&&
  ids.every(id=>I[id]&&/^pendant-(xp|drop|coin|crit|critdmg)(-[reul])?(\+\d{1,2})?$/.test(id))&&x.dgAllIds().length===665);
ok('they are level-30 dungeon pieces of kind pendant for the one pendant slot, and are in neither ITEM_LIST nor TOOL_LIST (no shop, random drop or "all items" gives one)',
  ids.every(id=>{ const it=I[id]; return it.kind==='pendant'&&it.slot==='pendant'&&it.lv===30&&it.dg===true&&it.tier===6; })&&!x.ITEM_LIST.some(i=>i.kind==='pendant')&&!x.TOOL_LIST.some(i=>i.kind==='pendant'));
{ const v=id=>I[id].v;
  ok('the numbers: a common +0 pendant is +6% XP, +10% drops, +10% coins, +2 points of crit, +0.10 crit multiplier; x1 / 1.3 / 1.7 / 2.2 / 3 by rarity',
    v('pendant-xp')===0.06&&v('pendant-drop')===0.1&&v('pendant-coin')===0.1&&v('pendant-crit')===0.02&&v('pendant-critdmg')===0.1&&v('pendant-xp-l')===0.18&&v('pendant-xp-r')===0.078&&
    v('pendant-crit-u')===0.044&&v('pendant-critdmg-e')===0.17);
  ok('each tempering step adds 10% of the piece\'s own value, as for every level-30 piece: a legendary at +10 is twice its +0 (+36% XP), a common at its limit +2 is x1.2',
    v('pendant-xp-l+10')===0.36&&v('pendant-xp+2')===0.072&&v('pendant-critdmg-e+3')===0.221&&v('pendant-crit-l+10')===0.12&&x.ENH_STEP===0.1&&x.ENH_MAX.join()==='2,4,6,8,10'); }
ok('their names say what they are (rarity, kind, step) and their text what they do',I['pendant-xp'].name==='Pendant of Learning'&&I['pendant-critdmg-l+10'].name==='Legendary Pendant of Ruin +10'&&I['pendant-coin-e+3'].name==='Epic Pendant of Fortune +3'&&
  x.pendantText(I['pendant-xp-r'])==='+7.8% XP from kills'&&x.pendantText(I['pendant-xp-l+10'])==='+36% XP from kills'&&x.pendantText(I['pendant-drop'])==='+10% chance of monster drops'&&
  x.pendantText(I['pendant-coin'])==='+10% coins from kills'&&x.pendantText(I['pendant-crit'])==='+2% critical hit chance'&&x.pendantText(I['pendant-critdmg'])==='Critical hits deal x1.80 (instead of x1.7)');
ok('the crit numbers that used to be literals are unchanged (12%, x1.7), with a cap of 60% chance and x2.5 damage',x.CRIT_BASE===0.12&&x.CRIT_MULT===1.7&&x.CRIT_CAP===0.6&&x.CRIT_MULT_CAP===2.5);
ok('ids parse and rebuild themselves, and refuse a step past the rarity\'s limit or a made-up kind',ids.every(id=>{ const q=x.dgParse(id); return q&&q.stat&&PID(q.stat,q.rar,q.n)===id; })&&x.dgParse('pendant-xp+3')===null&&x.dgParse('pendant-xp-l+11')===null&&x.dgParse('pendant-luck')===null&&x.dgParse('pd-xp1')===null);
ok('the forge: three +0 pendants of one kind and rarity become the next rarity (+0); a legendary or a tempered one has no merge; gear, rings and tools merge as before',
  x.mergedId('pendant-xp')==='pendant-xp-r'&&x.mergedId('pendant-critdmg-u')==='pendant-critdmg-l'&&x.mergedId('pendant-xp-l')===null&&x.mergedId('pendant-xp+1')===null&&x.mergedId('pendant-xp-r+2')===null&&
  x.mergedId('sword2')==='sword2-r'&&x.mergedId('ring-fire')==='ring-fire-r'&&x.mergedId('sword7-e')==='sword7-u'&&x.mergedId('pick3-e')==='pick3-u');
ok('every existing item still merges to the id the old rule gave (slot, tier, next rarity)',x.ITEM_LIST.concat(x.TOOL_LIST).every(i=>i.rar>=4?x.mergedId(i.id)===null:x.mergedId(i.id)===i.slot+(i.tier+1)+'-'+'reul'[i.rar]));

// ---- the two jewellery slots and the saves ----
{ const g=x.newGearFor('mage'); ok('a new character has an empty ring slot AND an empty pendant slot',g.eq.ring===null&&g.eq.pendant===null&&'ring' in g.eq&&'pendant' in g.eq); }
{ const s=x.sanitizeGear({inv:['sword1','pendant-xp-e+3','ring-fire-r'],eq:{weapon:'sword1',pendant:'pendant-xp-e+3',ring:'ring-fire-r'}},'warrior');
  ok('a worn pendant and a worn ring are both kept',s.eq.pendant==='pendant-xp-e+3'&&s.eq.ring==='ring-fire-r'); }
ok('an old save without either slot loads with both empty; a pendant that is not in the bag, another kind of item, junk or an enhancement past the limit is dropped',
  (()=>{ const o=x.sanitizeGear({inv:['sword1'],eq:{weapon:'sword1',helmet:null}},'warrior'); return o.eq.pendant===null&&o.eq.ring===null; })()&&
  x.sanitizeGear({inv:['sword1'],eq:{weapon:'sword1',pendant:'pendant-xp-e'}},'warrior').eq.pendant===null&&x.sanitizeGear({inv:['sword1','helmet1'],eq:{weapon:'sword1',pendant:'helmet1'}},'warrior').eq.pendant===null&&
  x.sanitizeGear({inv:['sword1','pendant-xp+5'],eq:{weapon:'sword1',pendant:'pendant-xp+5'}},'warrior').eq.pendant===null&&x.sanitizeGear({inv:['sword1','pd-xp1'],eq:{weapon:'sword1',pendant:'pd-xp1'}},'warrior').inv.join()==='sword1');
ok('a pendant cannot sit in the ring slot, nor a ring in the pendant slot',x.sanitizeGear({inv:['sword1','pendant-xp','ring-basic'],eq:{weapon:'sword1',ring:'pendant-xp',pendant:'ring-basic'}},'warrior').eq.ring===null&&
  x.sanitizeGear({inv:['sword1','pendant-xp','ring-basic'],eq:{weapon:'sword1',ring:'pendant-xp',pendant:'ring-basic'}},'warrior').eq.pendant===null);

// ---- the server: equip, take off, buy, sell, merge, temper ----
W.join('a',{name:'Hiker',look:{cls:'warrior'},save:{level:20}}); W.join('b',{name:'Other',look:{cls:'warrior'},save:{level:45}}); tick(2);
const A=W.players.get('a'), B=W.players.get('b');
A.gear.inv.push('pendant-xp','pendant-xp-r','ring-basic'); W.receive('a',{t:'equip',id:'pendant-xp'}); tick(1);
ok('a level-20 hiker cannot wear a level-30 pendant',A.gear.eq.pendant===null);
A.level=30; x.recalcP(A); const hp0=A.maxHp, dmg0=A.dmg; W.receive('a',{t:'equip',id:'pendant-xp'}); W.receive('a',{t:'equip',id:'ring-basic'}); tick(1);
ok('at level 30 both can be worn together: the pendant in its slot, the ring in its own; the pendant does not touch health or attack',A.gear.eq.pendant==='pendant-xp'&&A.gear.eq.ring==='ring-basic'&&A.maxHp===hp0&&A.dmg>=dmg0);
{ W.receive('a',{t:'equip',id:'pendant-xp-r'}); tick(1); ok('wearing another pendant swaps it and leaves the ring where it is',A.gear.eq.pendant==='pendant-xp-r'&&A.gear.eq.ring==='ring-basic'); }
W.receive('a',{t:'unequip',slot:'pendant'}); tick(1);
ok('and it comes off (back in the bag); the ring stays',A.gear.eq.pendant===null&&A.gear.inv.includes('pendant-xp-r')&&A.gear.eq.ring==='ring-basic');
{ A.gear.coins=1e6; const n0=A.gear.inv.length; W.receive('a',{t:'buy',id:'pendant-xp'}); W.receive('a',{t:'buy',id:'pendant-crit'}); tick(1);
  ok('no shop sells a pendant (a hostile client cannot buy one with coins)',A.gear.coins===1e6&&A.gear.inv.length===n0); }
{ const c0=A.gear.coins; W.receive('a',{t:'sell',id:'pendant-xp-r'}); tick(1);
  ok('one can be sold for 40% of its price',A.gear.coins===c0+x.sellPrice(I['pendant-xp-r'])&&x.sellPrice(I['pendant-xp-r'])===Math.round(I['pendant-xp-r'].price*0.4)); }
{ A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pendant-')); A.gear.inv.push('pendant-coin','pendant-coin','pendant-coin'); A.gear.eq.pendant=null; W.receive('a',{t:'merge',id:'pendant-coin'}); tick(1);
  ok('three common pendants merge at the forge into one rare one of the same kind',A.gear.inv.filter(i=>i==='pendant-coin').length===0&&A.gear.inv.filter(i=>i==='pendant-coin-r').length===1);
  A.gear.inv.push('pendant-coin','pendant-coin'); A.gear.eq.pendant='pendant-coin'; W.receive('a',{t:'merge',id:'pendant-coin'}); tick(1);
  ok('... but the one you wear does not count towards the three',A.gear.inv.filter(i=>i==='pendant-coin').length===2&&A.gear.inv.filter(i=>i==='pendant-coin-r').length===1);
  A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pendant-')); A.gear.eq.pendant=null; A.gear.inv.push('pendant-coin+1','pendant-coin+1','pendant-coin+1'); W.receive('a',{t:'merge',id:'pendant-coin+1'}); tick(1);
  ok('a tempered pendant (+1) does not merge: the forge refuses',A.gear.inv.filter(i=>i==='pendant-coin+1').length===3); }
{ // tempering: the step to +n costs n stones, always works, and the worn copy follows
  A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pendant-')); A.gear.inv.push('pendant-crit-e'); A.gear.eq.pendant=null; A.gear.temper=0; W.receive('a',{t:'temper',id:'pendant-crit-e'}); tick(1);
  ok('tempering needs the stones (a refusal leaves the pendant and the count alone)',A.gear.inv.includes('pendant-crit-e')&&A.gear.temper===0);
  A.gear.temper=10; W.receive('a',{t:'temper',id:'pendant-crit-e'}); tick(1);
  ok('+1 costs 1 stone: the pendant becomes pendant-crit-e+1 (value x1.1) and 9 stones are left',A.gear.inv.includes('pendant-crit-e+1')&&!A.gear.inv.includes('pendant-crit-e')&&A.gear.temper===9&&near(I['pendant-crit-e+1'].v,I['pendant-crit-e'].v*1.1,1e-9));
  W.receive('a',{t:'temper',id:'pendant-crit-e+1'}); tick(1); W.receive('a',{t:'temper',id:'pendant-crit-e+2'}); tick(1);
  ok('+2 costs 2, +3 costs 3: three steps took 1 + 2 + 3 = 6 stones, so 4 are left',A.gear.inv.includes('pendant-crit-e+3')&&A.gear.temper===4);
  A.gear.eq.pendant='pendant-crit-e+3'; W.receive('a',{t:'temper',id:'pendant-crit-e+3',worn:true}); tick(1);
  ok('a worn pendant is tempered in its slot (+4 costs 4 stones) and the hiker is recalculated',A.gear.eq.pendant==='pendant-crit-e+4'&&A.gear.temper===0&&x.pendP(A,'crit')===I['pendant-crit-e+4'].v);
  A.gear.inv.push('pendant-xp+2'); A.gear.temper=99; W.receive('a',{t:'temper',id:'pendant-xp+2'}); tick(1);
  ok('a pendant at its rarity\'s limit (a common at +2) cannot be tempered further',A.gear.inv.includes('pendant-xp+2')&&A.gear.temper===99); }

// ---- what the Greyspine's dungeon pays ----
{ const R=x.DG_REWARDS.blackseam; ok('the Greyspine\'s dungeon (blackseam) pays a pendant: one of the five kinds with equal chance, the rarity from the same 70 / 25 / 4 / 0.8 / 0.2% as every clear',
    R&&R.kind==='pendant'&&R.pool.join()===x.PENDANT_STATS.join()&&x.DG_REWARD_W.join()==='700,250,40,8,2');
  const got=new Set(), rars=new Set(); for(let k=0;k<400;k++){ const id=x.dgClearReward('blackseam'); got.add(x.dgParse(id).stat); rars.add(x.dgParse(id).rar); if(!id.startsWith('pendant-')||x.dgParse(id).n!==0) got.add('bad'); }
  ok('a clear rolls only +0 pendants, all five kinds come up, and the other dungeons still pay what they paid (weapons, armour, rings)',!got.has('bad')&&got.size===5&&rars.has(0)&&rars.has(1)&&
    x.dgParse(x.dgClearReward('hollowroots',()=>0.3)).slot.match(/sword|bow|wand/)&&x.dgParse(x.dgClearReward('jadesprings',()=>0.3)).slot.match(/helmet|top|bottom|shoes/)&&x.dgParse(x.dgClearReward('bonefrostbarrow',()=>0.3)).el);
  A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pendant-')); const n0=A.gear.inv.length; ok('dgGrantItemP puts the clear\'s pendant in the bag',x.dgGrantItemP(A,'pendant-drop-e')&&A.gear.inv.length===n0+1&&A.gear.inv.includes('pendant-drop-e')); }
{ A.gear.inv=A.gear.inv.filter(i=>!i.startsWith('pendant-')); A.gear.inv.length=0; A.gear.inv.push('sword1'); W.receive('a',{t:'rwdev',cmd:'dgall'}); tick(1);
  ok('the testing tool "a level-30 piece of every kind" adds the five pendants with the rest (7 + 7 + 5 = 19 pieces)',A.gear.inv.filter(i=>i.startsWith('pendant-')).length===5&&A.gear.inv.length===20); }

// ---- what each bonus does ----
const wear=(p,id)=>{ p.gear.eq.pendant=id; if(id&&!p.gear.inv.includes(id)) p.gear.inv.push(id); };
const mon=x.MONS.find(m=>!m.boss&&!m.temp&&m.def.level===28&&m.def.id==='minegoblin')||x.MONS.find(m=>!m.boss&&!m.temp&&m.def.level>=26);
B.level=45; x.recalcP(B);
ok('pendP reads only the worn pendant of that kind (and its tempered value)',(wear(B,null),x.pendP(B,'xp')===0)&&(wear(B,'pendant-xp-l'),x.pendP(B,'xp')===0.18&&x.pendP(B,'coin')===0&&x.pendP(B,'crit')===0)&&(wear(B,'pendant-xp-l+10'),x.pendP(B,'xp')===0.36));
{ pin(0.5); const gain=id=>{ wear(B,id); B.exp=0; B.level=45; x.rewardKill(B,mon); return B.exp; };
  const e0=gain(null), e1=gain('pendant-xp-l'), e2=gain('pendant-xp-l+10'), e3=gain('pendant-coin-l');
  ok('the XP pendant raises the XP of a kill by its value (+18% legendary, +36% at +10) and a coin pendant does not',e0>0&&near(e1/e0,1.18,1e-3)&&near(e2/e0,1.36,1e-3)&&e3===e0,(e1/e0).toFixed(3)+' / '+(e2/e0).toFixed(3)); unpin(); }
{ pin(0.5); const gain=id=>{ wear(B,id); B.gear.coins=0; x.rewardKill(B,mon); return B.gear.coins; };
  const c0=gain(null), c1=gain('pendant-coin-l'), c2=gain('pendant-coin+2'), c3=gain('pendant-xp-l');
  ok('the coin pendant raises the coins of a kill (+30% legendary, +12% a common at +2), rounded to whole coins; the XP pendant does not',c0>0&&c1===Math.round(c0*1.3)&&c2===Math.round(c0*1.12)&&c3===c0&&Number.isInteger(c1),c0+' / '+c1+' / '+c2); unpin(); }
{ // a drop needs Math.random() < DROP_CHANCE x (1 + bonus): pinned at 0.4 it fails at +0% (0.35) and +10% (0.385) and passes at +20% (0.42) and +30% (0.455)
  const matsOf=p=>Object.values(p.gear.mats||{}).reduce((a,b)=>a+b,0), got=id=>{ wear(B,id); B.gear.mats={}; pin(0.4); x.rewardKill(B,mon); unpin(); return matsOf(B); };
  ok('the drop pendant raises the chance of a material drop (0.35 x 1.3 passes a roll of 0.4, 0.35 x 1.1 does not, a rare at +4 gives +18% and passes), and no other kind does',
    got(null)===0&&got('pendant-drop-l')===1&&got('pendant-drop-e')===1&&got('pendant-drop')===0&&got('pendant-xp-l')===0&&got('pendant-drop-r+4')===1&&x.DROP_CHANCE===0.35); }
{ // crit rate: a roll of 0.14 is no crit at 12% but is one with +6 points (18%)
  const hit=(p,r)=>{ pin(r); const d=x.rollDmgS(p,1,null,null); unpin(); return d.crit; };
  wear(B,null); const base=hit(B,0.14); wear(B,'pendant-crit-l'); const withP=hit(B,0.14), belowEdge=hit(B,0.19); wear(B,'pendant-xp-l'); const other=hit(B,0.14);
  ok('the crit-rate pendant moves the edge of a crit from 12% to 18% (legendary): a roll of 0.14 crits with it only, 0.19 never; an XP pendant does nothing',!base&&withP&&!belowEdge&&!other);
  wear(B,'pendant-crit-l+10'); ok('tempered to +10 it moves the edge to 24% (12 points): 0.2 crits, 0.25 does not',hit(B,0.2)&&!hit(B,0.25));
  const fake=(stat,v)=>{ I['pendant-fake']={id:'pendant-fake',base:'pendant-fake',kind:'pendant',slot:'pendant',stat,v,lv:1,tier:6,rar:0,n:0,dg:true,name:'Fake',price:1}; B.gear.eq.pendant='pendant-fake'; };
  fake('crit',5); const cap1=hit(B,0.59), cap2=hit(B,0.61); B.buff={crit:2,dmg:1}; const cap3=hit(B,0.61); B.buff=null;
  ok('total crit chance is capped at 60% however much is stacked (pendant, potion buff)',cap1&&!cap2&&!cap3); }
{ // crit damage: rolls pinned so every hit crits and the +-15% spread is the same; the ratio of the damage is the ratio of the multipliers
  const dmg=id=>{ wear(B,id); pin(0.01); const d=x.rollDmgS(B,1,null,null); unpin(); return d; };
  const d0=dmg(null), d1=dmg('pendant-critdmg-l'), d2=dmg('pendant-critdmg-l+10'), d3=dmg('pendant-crit-l');
  ok('every pinned hit crits; the crit-damage pendant raises the crit multiplier (1.7 -> 2.0 legendary, 2.3 at +10), a crit-rate pendant does not',d0.crit&&d1.crit&&near(d1.v/d0.v,2.0/1.7,0.01)&&near(d2.v/d0.v,2.3/1.7,0.01)&&d3.v===d0.v,(d1.v/d0.v).toFixed(3)+' / '+(d2.v/d0.v).toFixed(3));
  I['pendant-fake'].stat='critdmg'; I['pendant-fake'].v=5; B.gear.eq.pendant='pendant-fake'; pin(0.01); const dc=x.rollDmgS(B,1,null,null); unpin();
  ok('the crit multiplier is capped at x2.5',near(dc.v/d0.v,2.5/1.7,0.01),(dc.v/d0.v).toFixed(3));
  pin(0.99); const n0=x.rollDmgS(B,1,null,null); unpin(); wear(B,null); pin(0.99); const n1=x.rollDmgS(B,1,null,null); unpin();
  ok('a hit that does not crit is untouched by a crit pendant',!n0.crit&&n0.v===n1.v); }
{ delete I['pendant-fake']; wear(B,'pendant-xp-l'); B.level=29; ok('below level 30 a worn pendant gives nothing (a lowered level cannot keep the bonus)',x.pendP(B,'xp')===0); B.level=45; ok('... and at 30 or more it does again',x.pendP(B,'xp')===0.18); }
{ B.gear.eq.ring='ring-basic'; B.gear.inv.push('ring-basic'); wear(B,'pendant-coin-l'); x.recalcP(B); ok('the ring and the pendant work side by side: the ring adds to the attack, the pendant to the coins',x.pendP(B,'coin')===0.3&&B.dmg>0&&B.gear.eq.ring==='ring-basic'); }

console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
