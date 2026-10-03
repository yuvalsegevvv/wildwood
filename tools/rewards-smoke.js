//@ Headless test of the dungeon rewards on the server: level-30 items, the ring's attack and the soul, Tempering Stone drops, tempering, the forge's merge rule, saves, testing commands
// Usage: node tools/rewards-smoke.js   (server straight from src/, no build; ~3 s)
// What it covers: shared/dungeon-items.js, server/dungeon-gear.js and the marked hooks (`// dungeons:`) in items.js, players.js, economy.js, combat.js. Design: docs/DUNGEON-THEMES.md section 7.
const {loadServer}=require('./load');
const inbox={}, evs=[];
const io={dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }};
const NAMES=['MONS','ITEM','ITEM_LIST','TOOL_LIST','dgAllIds','dgItem','dgGearId','dgRingId','sanitizeGear','soulOfP','monK','rewardKill','dgGrantItemP','dgTemperP','VIL2','ENH_LV','ENH_DROP','ENH_NAME','ENH_MAX','DG_STONE_MAX','BAG_MAX','sellPrice','mergedId','effectiveLookOf','ARMOR_LOOK','clsOfP','gearStatsOf','RING_ELS','ALL_SLOTS','ELEM_LIST','newGearFor','fLv'];
const {api:W,x}=loadServer(io,NAMES);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const you=pid=>[...inbox[pid]].reverse().find(m=>m.t==='you');
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const toastsOf=(pid,from)=>evs.slice(from||0).filter(e=>e[0]==='toast'&&e[1]===pid).map(e=>e[2]);
const join=(pid,level,cls)=>{ inbox[pid]=[]; W.join(pid,{name:'T'+pid,look:{cls:cls||'warrior'},save:{level}}); tick(1); return W.players.get(pid); };
const give=(p,...ids)=>{ for(const id of ids) p.gear.inv.push(id); };
const send=(pid,msg)=>{ const n=evs.length; W.receive(pid,msg); tick(3); return n; };   // returns where this message's events start in evs
const near=(a,b,e)=>Math.abs(a-b)<=(e||0.01);

// ---- the items ----
{ const ids=x.dgAllIds(), bad=[];
  for(const id of ids){ const it=x.ITEM[id]; if(!it||!it.dg||it.lv!==30||it.tier!==6||!it.name||!(it.price>0)||typeof it.n!=='number'||!(it.rar>=0)) { bad.push(id); continue; }
    if(it.kind==='weapon'?!(it.atk>0):it.kind==='armor'?!(it.hp>0&&it.def>0):it.kind==='ring'?!(it.pct>0&&it.el&&it.slot==='ring'):true) bad.push(id); }
  ok('all '+ids.length+' level-30 ids are ITEM records with kind, slot, tier 6, level 30, rarity, name, price and stats, and none is in ITEM_LIST or TOOL_LIST (shops, drops and "give every item" ignore them)',
    ids.length===490&&!bad.length&&x.ITEM_LIST.length===210&&x.TOOL_LIST.length===90&&!ids.some(id=>x.ITEM_LIST.includes(x.ITEM[id])||x.TOOL_LIST.includes(x.ITEM[id])),bad.slice(0,4).join(', ')); }

// ---- equip, class, sell ----
const a=join('a',30,'warrior'); const base=a.dmg;
send('a',{t:'rwdev',cmd:'dgall'});
{ const inv=you('a').gear.inv, want=[...x.ALL_SLOTS.map(s=>x.dgGearId(s,0,0)),...x.RING_ELS.map(e=>x.dgRingId(e,0,0))];
  ok('the testing command adds a level-30 piece of every kind: 3 weapons, 4 armour pieces, 7 rings (14 in all)',want.length===14&&want.every(id=>inv.includes(id))); }
send('a',{t:'equip',id:'sword7'});
ok('a level-30 hiker wears a level-30 sword: attack rises by the sword\'s 135 over the starter',a.gear.eq.weapon==='sword7'&&near(a.dmg-base,135-4,0.5),'dmg '+base+' -> '+a.dmg);
const hp0=a.maxHp, def0=a.def;
for(const s of ['helmet7','top7','bottom7','shoes7']) send('a',{t:'equip',id:s});
{ const st=x.gearStatsOf(a.gear);
  ok('level-30 armour adds its health (340 + 600 + 435 + 255, before the Vitality passive) and defence (19 + 38 + 24 + 15), and is worn in its slots',['helmet','top','bottom','shoes'].every(s=>a.gear.eq[s]===s+'7')&&st.hp===1630&&a.def===def0+96&&a.maxHp-hp0>=1630,'hp '+hp0+' -> '+a.maxHp+', def '+def0+' -> '+a.def); }
{ const L=x.effectiveLookOf({},a.gear), top5=x.ARMOR_LOOK.top[5], hel5=x.ARMOR_LOOK.helmet[5], sho5=x.ARMOR_LOOK.shoes[5], bot5=x.ARMOR_LOOK.bottom[5];
  ok('the character wears the top tier\'s look for level-30 armour (the Shogun look is borrowed, nothing is undefined)',L.topColor===top5.topColor&&L.hatColor===hel5.hatColor&&L.shoeColor===sho5.shoeColor&&L.bottomColor===bot5.bottomColor&&L.hat==='helm'&&L.top==='plate'); }
send('a',{t:'equip',id:'bow7'});
ok('a level-30 bow makes the hiker an archer (the class follows the weapon, tier 6 sorts above the rest)',a.gear.eq.weapon==='bow7'&&x.clsOfP(a)==='archer');
send('a',{t:'cls',cls:'mage'});
ok('choosing a class picks the best weapon you own for it: the level-30 wand',a.gear.eq.weapon==='wand7'&&x.clsOfP(a)==='mage');
send('a',{t:'cls',cls:'warrior'}); send('a',{t:'equip',id:'ring-basic'});
ok('the ring goes in its own slot (eq.ring) and leaves the weapon alone',a.gear.eq.ring==='ring-basic'&&a.gear.eq.weapon==='sword7');
send('a',{t:'unequip',slot:'ring'});
ok('a ring can be taken off',a.gear.eq.ring===null&&a.gear.inv.includes('ring-basic'));
{ const lo=join('lo',29); give(lo,'sword7','ring-fire','helmet7'); const n=send('lo',{t:'equip',id:'sword7'}); send('lo',{t:'equip',id:'ring-fire'}); send('lo',{t:'equip',id:'helmet7'});
  ok('below level 30 none of it can be worn (sword, ring, helmet: "needs level 30")',lo.gear.eq.weapon==='sword1'&&!lo.gear.eq.ring&&!lo.gear.eq.helmet&&toastsOf('lo',n).some(t=>/needs level 30/.test(t))); }
{ const c0=a.gear.coins; give(a,'helmet7-r'); send('a',{t:'sell',id:'helmet7-r'});
  ok('selling a level-30 piece pays its sell price (40% of its price)',a.gear.coins-c0===x.sellPrice(x.ITEM['helmet7-r'])&&x.sellPrice(x.ITEM['helmet7-r'])>0&&!a.gear.inv.includes('helmet7-r'),'+'+(a.gear.coins-c0)); }
{ a.gear.coins=10000000; const n=a.gear.inv.length; send('a',{t:'buy',id:'sword7'}); send('a',{t:'buy',id:'ring-basic'});
  ok('the shops never sell level-30 gear, whatever a client asks for',a.gear.inv.length===n&&a.gear.coins===10000000); }

// ---- the ring's attack and the soul ----
{ const r=join('r',30,'warrior'); r.gear.east=2; give(r,'sword7-l','sword7','ring-fire-l','ring-water','ring-basic','ring-basic-u'); send('r',{t:'equip',id:'sword7-l'}); const noRing=r.dmg;
  send('r',{t:'equip',id:'ring-fire-l'});
  ok('a fire ring on an unbound soul adds nothing',near(r.dmg,noRing)&&x.soulOfP(r)==='basic','dmg '+r.dmg);
  r.x=x.VIL2.x; r.z=x.VIL2.z; send('r',{t:'soul',el:'fire'});
  ok('binding the soul to fire recalculates at once: a legendary ring on a legendary sword (405) adds 61 attack ("15%")',near(r.dmg-noRing,61,0.5)&&r.gear.soul==='fire'&&near(you('r').dmg,r.dmg),'+'+(r.dmg-noRing).toFixed(2));
  send('r',{t:'soul',el:'water'});
  ok('changing the soul to the opposite takes the bonus away again, with no other change to the hiker',near(r.dmg,noRing),'dmg '+r.dmg);
  send('r',{t:'soul',el:'fire'}); send('r',{t:'soul',el:'basic'});
  ok('unbinding the soul takes it away too',near(r.dmg,noRing));
  send('r',{t:'equip',id:'ring-basic'});
  ok('the plain ring is the one for the unbound soul: +5% of a legendary sword (20)',near(r.dmg-noRing,20,0.5),'+'+(r.dmg-noRing).toFixed(2));
  send('r',{t:'equip',id:'ring-basic-u'});
  ok('and it grows with rarity (unique: 11% = 45)',near(r.dmg-noRing,45,0.5),'+'+(r.dmg-noRing).toFixed(2));
  send('r',{t:'unequip',slot:'ring'}); ok('taking the ring off removes it',near(r.dmg,noRing));
  send('r',{t:'equip',id:'ring-water'}); send('r',{t:'soul',el:'water'}); const w1=r.dmg; send('r',{t:'equip',id:'sword7'});
  ok('the ring follows the weapon: a smaller weapon gives a smaller bonus',r.dmg<w1&&near(r.dmg-(noRing-(405-135)),7,0.5),'dmg '+r.dmg); }

// ---- the Tempering Stone drop ----
const lv30=x.MONS.find(m=>!m.def.boss&&m.def.level===30), lv29=x.MONS.find(m=>!m.def.boss&&m.def.level===29), slime=x.MONS.find(m=>m.def.id==='slime'), boss=x.MONS.find(m=>m.def.boss&&m.def.level===30);
const withRandom=(v,f)=>{ const real=Math.random; Math.random=typeof v==='function'?v:()=>v; try{ return f(); } finally{ Math.random=real; } };
{ const s=join('s',30), inv0=()=>s.gear.inv.length;
  ok('the test has a level-30 monster, a level-29 monster and a level-30 boss to fight',!!lv30&&!!lv29&&!!boss&&x.monK(lv30,s).lv===30&&x.monK(lv29,s).lv===29,[lv30&&lv30.def.id,lv29&&lv29.def.id].join(' '));
  let n=inv0(); withRandom(0.0005,()=>x.rewardKill(s,lv30)); tick(3);
  ok('a level-30 monster drops a Tempering Stone where it would have dropped equipment (the roll that gave an epic piece gives a stone), and no equipment',s.gear.temper===1&&inv0()===n&&evs.some(e=>e[0]==='stone'&&e[1]==='s'&&e[2]===1)&&toastsOf('s').some(t=>t.includes(x.ENH_NAME)));
  withRandom(0.5,()=>x.rewardKill(s,lv30)); ok('and nothing at all when the roll misses',s.gear.temper===1&&inv0()===n);
  withRandom(0.0005,()=>x.rewardKill(s,lv29)); ok('a level-29 monster still drops equipment (the same roll: an epic piece), and no stone',s.gear.temper===1&&inv0()===n+1);
  n=inv0(); withRandom(0.0005,()=>x.rewardKill(s,boss)); ok('a level-30 boss still drops equipment (legendary at that roll), never a stone',s.gear.temper===1&&inv0()>n);
  s.gear.zt.home={on:3,max:3}; n=inv0(); withRandom(0.0005,()=>x.rewardKill(s,slime));
  ok('the level you fight at counts: a level-1 slime at zone tier III is level '+x.monK(slime,s).lv+' and drops the stone',x.monK(slime,s).lv===31&&s.gear.temper===2&&inv0()===n);
  s.gear.zt.home={on:0,max:0}; s.gear.temper=0; s.gear.inv.length=3; const N=4000; let items=0;
  for(let i=0;i<N;i++){ x.rewardKill(s,lv30); if(s.gear.inv.length>3) items++; }
  const sd=Math.sqrt(N*x.ENH_DROP*(1-x.ENH_DROP)), got=s.gear.temper;
  ok('over '+N+' real rolls a level-30 monster gives stones at 2.6% (within 4 sigma) and not a single piece of equipment',items===0&&Math.abs(got-N*x.ENH_DROP)<=4*sd,got+' stones, expected '+Math.round(N*x.ENH_DROP));
  s.gear.temper=0; let eq=0; for(let i=0;i<N;i++){ const b=s.gear.inv.length; x.rewardKill(s,lv29); if(s.gear.inv.length>b) eq++; if(s.gear.inv.length>200) s.gear.inv.length=3; }
  ok('over the same number of rolls a level-29 monster gives equipment at about the same rate and never a stone',s.gear.temper===0&&Math.abs(eq-N*x.ENH_DROP)<=4*sd,eq+' pieces');
  s.gear.temper=x.DG_STONE_MAX; withRandom(0.0005,()=>x.rewardKill(s,lv30)); ok('the stone count stops at '+x.DG_STONE_MAX,s.gear.temper===x.DG_STONE_MAX); }

// ---- tempering ----
{ const t=join('t',30); give(t,'sword7','sword7','helmet7-r','ring-fire','ring-fire-e+6','sword1','top7+2'); t.gear.temper=10; send('t',{t:'equip',id:'sword7'}); const d0=t.dmg;
  let n=send('t',{t:'temper',id:'sword7'});
  ok('tempering a bag copy: it becomes +1, the worn copy is untouched, one stone is spent, the answer is an event and a toast',t.gear.inv.filter(i=>i==='sword7').length===1&&t.gear.inv.includes('sword7+1')&&t.gear.eq.weapon==='sword7'&&t.gear.temper===9&&near(t.dmg,d0)&&evs.slice(n).some(e=>e[0]==='temper'&&e[1]==='t'&&e[2]==='sword7+1'&&e[3]==='sword7')&&toastsOf('t',n).some(m=>/Tempered/.test(m)));
  n=send('t',{t:'temper',id:'sword7',worn:true});
  ok('tempering the worn copy (worn: true) swaps the slot and recalculates the hiker: 135 -> 142 attack',t.gear.eq.weapon==='sword7+1'&&!t.gear.inv.includes('sword7')&&t.gear.inv.filter(i=>i==='sword7+1').length===2&&t.gear.temper===8&&near(t.dmg-d0,7,0.5),'dmg +'+(t.dmg-d0).toFixed(2));
  send('t',{t:'temper',id:'sword7+1'});
  ok('the step to +2 costs 2 stones; a copy that is both worn and in the bag is raised in the bag first',t.gear.temper===6&&t.gear.inv.includes('sword7+2')&&t.gear.eq.weapon==='sword7+1');
  n=send('t',{t:'temper',id:'sword7+2'});
  ok('a common piece stops at +2: refused, nothing spent',t.gear.temper===6&&t.gear.inv.includes('sword7+2')&&!t.gear.inv.includes('sword7+3')&&toastsOf('t',n).some(m=>/any further/.test(m)));
  send('t',{t:'temper',id:'top7+2'}); ok('(the cap is the rarity\'s: a common top at +2 is full too)',t.gear.temper===6&&!t.gear.inv.includes('top7+3'));
  n=send('t',{t:'temper',id:'ring-fire-e+6'}); ok('an epic ring at +6 is at its limit',t.gear.temper===6&&toastsOf('t',n).some(m=>/any further/.test(m)));
  send('t',{t:'temper',id:'ring-fire'}); ok('rings are tempered like the rest (+1 for a stone)',t.gear.inv.includes('ring-fire+1')&&!t.gear.inv.includes('ring-fire')&&t.gear.temper===5);
  send('t',{t:'temper',id:'helmet7-r'}); send('t',{t:'temper',id:'helmet7-r+1'}); ok('armour of a higher rarity too: rare +1 then +2 (1 + 2 stones)',t.gear.inv.includes('helmet7-r+2')&&t.gear.temper===2,t.gear.inv.filter(i=>/helmet/.test(i)).join());
  n=send('t',{t:'temper',id:'helmet7-r+2'}); ok('without enough stones (the step to +3 costs 3, you have 2): refused, nothing spent or changed',t.gear.temper===2&&t.gear.inv.includes('helmet7-r+2')&&!t.gear.inv.includes('helmet7-r+3')&&toastsOf('t',n).some(m=>/need 3/.test(m)));
  n=send('t',{t:'temper',id:'sword1'}); ok('a piece that is not level-30 dungeon gear cannot be tempered',t.gear.temper===2&&t.gear.inv.includes('sword1')&&toastsOf('t',n).some(m=>/Only dungeon gear/.test(m)));
  const inv=JSON.stringify(t.gear.inv); for(const id of ['sword7-l+1','ring-fire-x','__proto__','constructor',7,null,{},[],'sword7+3']) send('t',{t:'temper',id}); send('t',{t:'temper'});
  ok('an id you do not have, a bad id or no id at all does nothing',JSON.stringify(t.gear.inv)===inv&&t.gear.temper===2);
  const one=join('one',30); give(one,'sword7'); one.gear.temper=3; send('one',{t:'equip',id:'sword7'}); send('one',{t:'temper',id:'sword7'});
  ok('a single copy that is worn is the one that is raised (the slot follows)',one.gear.eq.weapon==='sword7+1'&&one.gear.inv.filter(i=>/^sword7/.test(i)).join()==='sword7+1'&&one.gear.temper===2); }

// ---- the forge: merge +0 only ----
{ const m=join('m',30); give(m,'sword7+1','sword7+1','sword7+1','top7','top7','top7','ring-fire','ring-fire','ring-fire','helmet7-l','helmet7-l','helmet7-l');
  let n=send('m',{t:'merge',id:'sword7+1'});
  ok('three tempered pieces (+1) do not merge: refused with a toast, nothing lost',m.gear.inv.filter(i=>i==='sword7+1').length===3&&!m.gear.inv.includes('sword7-r+1')&&toastsOf('m',n).some(t=>/only \+0 pieces/.test(t)));
  n=send('m',{t:'merge',id:'top7'});
  ok('three +0 level-30 pieces merge into the next rarity at +0 (top7 -> top7-r)',m.gear.inv.filter(i=>i==='top7').length===0&&m.gear.inv.includes('top7-r')&&evs.slice(n).some(e=>e[0]==='merge'&&e[1]==='m'&&e[2]==='top7-r'));
  send('m',{t:'merge',id:'ring-fire'}); ok('rings merge the same way (ring-fire -> ring-fire-r)',m.gear.inv.includes('ring-fire-r')&&!m.gear.inv.includes('ring-fire'));
  send('m',{t:'merge',id:'helmet7-l'}); ok('a legendary piece has no next rarity: it stays',m.gear.inv.filter(i=>i==='helmet7-l').length===3);
  give(m,'sword7','sword7','sword7'); send('m',{t:'merge',id:'sword7'}); ok('weapons: sword7 -> sword7-r',m.gear.inv.includes('sword7-r')&&x.ITEM['sword7-r'].atk===176);
  ok('every +0 id below legendary merges into a real record of the next rarity, +0, and a tempered one into nothing',x.dgAllIds().every(id=>{ const it=x.ITEM[id], nx=x.mergedId(id); return it.rar>=4||it.n>0?nx===null:!!x.ITEM[nx]&&x.ITEM[nx].rar===it.rar+1&&x.ITEM[nx].n===0&&x.ITEM[nx].slot===it.slot&&x.ITEM[nx].el===it.el; })); }

// ---- saves ----
{ const g=x.newGearFor('warrior'); g.inv.push('ring-fire-l+3','sword7-e+2','ring-basic'); g.eq.ring='ring-fire-l+3'; g.eq.weapon='sword7-e+2'; g.temper=42;
  const back=x.sanitizeGear(JSON.parse(JSON.stringify(g)),'warrior');
  ok('a save keeps the worn ring, the enhanced weapon and the stones through sanitizeGear and JSON',back.eq.ring==='ring-fire-l+3'&&back.eq.weapon==='sword7-e+2'&&back.temper===42&&back.inv.includes('ring-fire-l+3'));
  const old=JSON.parse(JSON.stringify(g)); delete old.temper; delete old.eq.ring; const o=x.sanitizeGear(old,'warrior');
  ok('an old save without them loads: no ring, no stones',o.eq.ring===null&&o.temper===0&&o.eq.weapon==='sword7-e+2');
  const bad=JSON.parse(JSON.stringify(g)); bad.eq.ring='sword7'; bad.temper=-5; const b1=x.sanitizeGear(bad,'warrior'); bad.eq.ring='ring-water'; bad.temper='lots'; const b2=x.sanitizeGear(bad,'warrior'); bad.eq.ring='ring-fire-l+3'; bad.temper=1e9; const b3=x.sanitizeGear(bad,'warrior'); bad.eq.ring='ring-fire-l+11'; const b4=x.sanitizeGear(bad,'warrior');
  ok('a ring slot holding a weapon, a ring you do not own or a made-up id is emptied; the stones are clamped to 0..'+x.DG_STONE_MAX,b1.eq.ring===null&&b1.temper===0&&b2.eq.ring===null&&b2.temper===0&&b3.eq.ring==='ring-fire-l+3'&&b3.temper===x.DG_STONE_MAX&&b4.eq.ring===null);
  const j=join('j',30); j.gear.inv.push('ring-air-u+2'); j.gear.eq.ring='ring-air-u+2'; j.gear.temper=7; const saved=JSON.parse(JSON.stringify(j.gear)); W.leave('j'); inbox.j2=[]; W.join('j2',{name:'Back',look:{cls:'warrior'},save:{level:30,gear:saved}}); tick(1);
  const j2=W.players.get('j2'); ok('a hiker who leaves and comes back (a save in hello) still wears the ring and holds the stones, and the "you" update carries both',j2.gear.eq.ring==='ring-air-u+2'&&j2.gear.temper===7&&you('j2').gear.eq.ring==='ring-air-u+2'&&you('j2').gear.temper===7); }

// ---- the clear's item, the testing commands ----
{ const g=join('g',30); const n=send('g',{t:'noop'}); const before=g.gear.inv.length;
  const r1=x.dgGrantItemP(g,'sword7-u'), r2=x.dgGrantItemP(g,'sword1'), r3=x.dgGrantItemP(g,'nope'); tick(3);
  ok('dgGrantItemP hands a level-30 item to a player (loot event + "from the dungeon" toast) and refuses anything else',r1===true&&r2===false&&r3===false&&g.gear.inv.length===before+1&&g.gear.inv.includes('sword7-u')&&evs.some(e=>e[0]==='loot'&&e[1]==='g'&&e[2]==='sword7-u')&&toastsOf('g',n).some(t=>/Unique .* from the dungeon/.test(t)));
  while(g.gear.inv.length<x.BAG_MAX) g.gear.inv.push('sword1'); const f=x.dgGrantItemP(g,'sword7'); ok('with a full bag the grant says so and gives nothing',f===false&&g.gear.inv.length===x.BAG_MAX);
  g.gear.temper=0; send('g',{t:'rwdev',cmd:'stones'}); send('g',{t:'rwdev',cmd:'stones'}); ok('the testing command adds 20 stones each time',g.gear.temper===40&&you('g').gear.temper===40);
  g.gear.inv.length=3; send('g',{t:'rwdev',cmd:'dgthree'}); const c=g.gear.inv.slice(3); ok('"3 of a level-30 piece" adds three of the same +0 piece',c.length===3&&c[0]===c[1]&&c[1]===c[2]&&x.ITEM[c[0]].dg&&x.ITEM[c[0]].n===0,c.join());
  const off=loadServer({dev:false,send(){}},['ITEM']); off.api.join('z',{name:'Z',look:{cls:'warrior'},save:{level:30}}); off.api.receive('z',{t:'rwdev',cmd:'stones'}); off.api.receive('z',{t:'rwdev',cmd:'dgall'});
  const z=off.api.players.get('z'); ok('the testing commands are refused when the server runs without testing tools',z.gear.temper===0&&z.gear.inv.length===3); }

console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
