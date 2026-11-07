// Headless test of Awakening's data (shared/awakening.js tiers, awakening-tree.js the four tree shapes, awakening-cost.js prices and stats; skills revamp step 8, PLAN section 4), straight from src/, no build:
// 116 nodes per shape, every node reachable (and reachable at its own tier), no node before its tier, depth totals within 5%, the joins, every set and the Wanderer on a valid shape, the character allocation,
// the price of a full tree near the PLAN's 82 million, Essence only at the late stages, trophies only on the power and charge branches, the cost functions on junk. One line per check.
// Usage: node tools/awakening-smoke.js
const {loadShared}=require('./load');
const X=loadShared(['AWK_TIERS','awkTierForLevel','AWK_LIMBS','AWK_TOP','AWK_SHAPE_DEFS','AWK_SHAPES','AWK_BAD','AWK_SHAPE_ORDER','AWK_WANDERER_TREE','awkBuildShape','awkShapeOf','awkNode',
  'AWK_R_AVG','awkR','awkShare','AWK_STEP','AWK_TROPHY','AWK_STAT_ROWS','AWK_STAT_DEPTH_STEP','awkStatRow','AWK_KIT_STATS','AWK_STAT_VALUE','AWK_PATH_KIT','awkKitOf','awkStatOf','awkNodeCost','awkTierCost','awkTreeCost','awkInfo',
  'SS_SETS','SS_ORDER','SS_SOURCES']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const near=(a,b,tol)=>Math.abs(a-b)<=Math.abs(b)*tol;
const SH=X.AWK_SHAPES, IDS=X.AWK_SHAPE_ORDER, M=n=>(n/1e6).toFixed(2)+'M';
const sets=X.SS_ORDER.map(i=>X.SS_SETS[i]).filter(s=>!s.dev);

// ---- tiers (PLAN 4a)
ok('tiers A0-A5: hiker levels 0 / 10 / 20 / 28 / 35 / 45, skill level caps 4 / 5 / 6 / 7 / 8 / 10',X.AWK_TIERS.length===6&&X.AWK_TIERS.map(t=>t.lv).join()==='0,10,20,28,35,45'&&X.AWK_TIERS.map(t=>t.cap).join()==='4,5,6,7,8,10');
ok('what each tier opens: basic / skill / power, the passive, the charge, the burst, star1, star2',X.AWK_TIERS.map(t=>t.opens).join('|')==='basic skill power|passive|charge|burst|star1|star2');
ok('awkTierForLevel: levels 1-4 A0, 5 A1, 6 A2, 7 A3, 8 A4, 9 and 10 A5',[1,4,5,6,7,8,9,10].map(X.awkTierForLevel).join()==='0,0,1,2,3,4,5,5');

// ---- the shapes
ok('all four shapes are built and none is in AWK_BAD',IDS.join()==='oak,pine,willow,banyan'&&IDS.every(i=>SH[i])&&Array.isArray(X.AWK_BAD)&&X.AWK_BAD.length===0,JSON.stringify(X.AWK_BAD));
for(const id of IDS){
  const s=SH[id], by=k=>s.nodes.filter(n=>n.kind===k).length;
  ok(id+': 116 nodes = 57 upgrade + 57 stat + 2 special, ids unique, in the same set as the other shapes',s.nodes.length===116&&by('up')===57&&by('stat')===57&&by('star')===2&&Object.keys(s.byId).length===116&&s.nodes.every(n=>SH.oak.byId[n.id]));
  ok(id+': limbs have 9 (basic, skill, power) or 10 (passive, charge, burst) upgrade nodes; the unlock nodes are pa1, ch1, bu1',['ba','sk','po'].every(c=>s.nodes.filter(n=>n.limb===c&&n.kind==='up').length===9)&&['pa','ch','bu'].every(c=>s.nodes.filter(n=>n.limb===c&&n.kind==='up').length===10)&&['pa1','ch1','bu1'].every(i=>s.byId[i])&&!s.byId.ba1&&!s.byId.po1);
  ok(id+': a stat node comes before every upgrade node of its limb (the upgrade needs it)',s.nodes.filter(n=>n.kind==='up').every(n=>n.req.includes('s'+n.id)&&s.byId['s'+n.id]&&s.byId['s'+n.id].kind==='stat'));
  // reachability: buy everything whose prerequisites are bought, once with every tier open, and tier by tier with only the nodes of that tier or below
  const reach=maxTier=>{ const got=new Set(); let more=true; while(more){ more=false; for(const n of s.nodes) if(!got.has(n.id)&&n.tier<=maxTier&&n.req.every(r=>got.has(r))){ got.add(n.id); more=true; } } return got; };
  ok(id+': every node is reachable from the root',reach(5).size===116);
  ok(id+': at each tier every node of that tier or below can be bought (no node waits for a higher tier)',[0,1,2,3,4,5].every(t=>reach(t).size===s.nodes.filter(n=>n.tier<=t).length));
  ok(id+': tiers: a limb opens at its tier (passive A1, charge A2, burst A3), level 5 needs A1 ... level 9-10 A5, star1 A4, star2 A5',
    s.nodes.filter(n=>n.kind!=='star').every(n=>n.tier===Math.max(X.AWK_LIMBS[n.limb].tier,X.awkTierForLevel(n.lv)))&&s.byId.pa1.tier===1&&s.byId.ch1.tier===2&&s.byId.bu1.tier===3&&s.byId.po5.tier===1&&s.byId.po6.tier===2&&s.byId.po7.tier===3&&s.byId.po8.tier===4&&s.byId.po9.tier===5&&s.byId.po10.tier===5&&s.byId.star1.tier===4&&s.byId.star2.tier===5);
  ok(id+': the special nodes hang from the burst limb (star1 from bu8, star2 from bu9)',s.byId.star1.parent==='bu8'&&s.byId.star2.parent==='bu9');
  ok(id+': depth: the first node of a trunk is 1, a child is its parent + 1, and the total is '+s.depthTotal,s.nodes.every(n=>n.depth===(n.parent?s.byId[n.parent].depth+1:1)));
  ok(id+': positions are finite and no two nodes sit closer than 0.5',s.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y))&&s.nodes.every((a,i)=>s.nodes.slice(i+1).every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=0.5)));
}
{ const t=IDS.map(i=>SH[i].depthTotal);
  ok('total depth of all nodes is within 5% of the Oak\'s in every shape',t.every(d=>Math.abs(d-t[0])<=t[0]*0.05),t.join(' / ')); }
// ---- the joins
{ const joinNeeds=s=>s.joins.map(j=>j.node+'>'+j.needs).sort().join();
  for(const id of IDS){ const s=SH[id], D=X.AWK_SHAPE_DEFS[id];
    ok(id+': joins near the crown: the level-9 and 10 nodes of each listed limb also need the deepest stat node of the neighbouring limb',s.joins.length===Object.keys(D.joins).length*2&&s.joins.length>=8
      &&s.joins.every(j=>{ const n=s.byId[j.node], q=s.byId[j.needs]; return n&&q&&n.kind==='up'&&(n.lv===9||n.lv===10)&&q.kind==='stat'&&q.limb!==n.limb&&q.lv===10&&n.req.includes(j.needs)&&n.req.length===2; }),s.joins.length+' joins'); }
  ok('Oak joins: basic to passive, skill to charge, passive and charge to the burst limb',joinNeeds(SH.oak)==='ba10>spa10,ba9>spa10,ch10>sbu10,ch9>sbu10,pa10>sbu10,pa9>sbu10,sk10>sch10,sk9>sch10');
  const roots=s=>s.nodes.filter(n=>n.parent===null).map(n=>n.limb).join('');
  ok('the shapes differ: four different trunks (Oak power, Pine basic, Willow skill, Banyan power and passive), four different sets of joins',roots(SH.oak)==='po'&&roots(SH.pine)==='ba'&&roots(SH.willow)==='sk'&&[...roots(SH.banyan)].sort().join('')==='popask'.split('').sort().join('')&&SH.banyan.byId.spo2.parent===null&&SH.banyan.byId.spa1.parent===null&&new Set(IDS.map(i=>joinNeeds(SH[i]))).size===4);
  ok('Banyan: the charge limb is a beam between the two trunks (its first node needs po5 and pa5) and the burst limb rises from the beam; the basic limb hangs on the power trunk',SH.banyan.byId.sch1.req.includes('po5')&&SH.banyan.byId.sch1.req.includes('pa5')&&SH.banyan.byId.sbu1.parent==='ch7'&&SH.banyan.byId.sba2.parent==='po2');
  ok('Pine: power and skill fork at the foot of the basic trunk, the charge limb lower than the passive; Willow: the passive forks lowest, the power late',SH.pine.byId.ssk2.parent==='ba3'&&SH.pine.byId.spo2.parent==='ba3'&&SH.pine.byId.sch1.parent==='ba4'&&SH.pine.byId.spa1.parent==='ba5'&&SH.willow.byId.spa1.parent==='sk2'&&SH.willow.byId.spo2.parent==='sk4'); }
// ---- bad shapes are refused, not half-built
{ const D=X.AWK_SHAPE_DEFS.oak, cp=o=>JSON.parse(JSON.stringify(o));
  const noPo=cp(D); noPo.limbs=noPo.limbs.filter(l=>l.c!=='po'); const loop=cp(D); loop.limbs[1].from='ba3'; const hi=cp(D); hi.limbs[3].from='po8'; const piled=cp(D); piled.limbs[2].lean=0; piled.limbs[2].side=-1; piled.limbs[1].lean=0; piled.limbs[1].off=0.8; piled.limbs[2].off=0.8;
  ok('a shape missing a limb, forking from an unbuilt node, from a higher tier than its own or drawn on itself is refused with a reason',[noPo,loop,hi,piled,null,{}].every(d=>{ const r=X.awkBuildShape('x',d); return !r.shape&&typeof r.bad==='string'&&r.bad; })); }

// ---- who grows which shape
{ const want={oak:'pell corvin ogden zahra genzo atuqa',pine:'tansy sabir hollis dessa sorrel meleni',willow:'sazanka nephra torgeir brynja sefi ottoline',banyan:'marigold ambrose dunstan tamsin brindle tzaya'};
  ok('all 24 sets map to a valid shape, six to each, as PLAN 4b lists them',sets.length===24&&sets.every(s=>X.awkShapeOf(s)&&X.awkShapeOf(s.id)===X.awkShapeOf(s)&&X.awkShapeOf(s).id===s.tree)&&IDS.every(i=>sets.filter(s=>X.awkShapeOf(s).id===i).map(s=>s.id).sort().join()===want[i].split(' ').sort().join()));
  ok('the Wanderer grows the Oak',X.AWK_WANDERER_TREE==='oak'&&X.awkShapeOf('wanderer')===SH.oak&&X.awkShapeOf({id:'wanderer'})===SH.oak);
  ok('an unknown set, a junk id or a set with a bad tree has no shape',['nobody','__proto__','constructor','toString','',null,undefined,5,{},[],{id:'x',tree:'__proto__'},{id:'x',tree:'maple'}].every(v=>X.awkShapeOf(v)===null)); }

// ---- prices: R and the tables (PLAN 4b-4e)
{ const A=X.awkShare;
  ok('R at 20 / 28 / 35 / 40 / 45 = 3000 x the mean coins of a kill (0.94 / 3.3 / 5.45 / 7.3 / 9.8 million)',[20,28,35,40,45].every((L,k)=>near(X.awkR(L),[0.93e6,3.3e6,5.45e6,7.3e6,9.8e6][k],0.01)));
  ok('shares of R: 0.015R at 20 = 14,000; 0.03R at 20 = 28,000; 0.08R at 28 = 264,000; 0.15R at 35 = 818,000; 0.3R at 40 = 2.2M; 0.6R at 45 = 5.9M; 0.5R at 45 = 4.9M',near(A(0.015,20),14000,0.01)&&near(A(0.03,20),28000,0.01)&&near(A(0.08,28),264000,0.01)&&near(A(0.15,35),818000,0.01)&&near(A(0.3,40),2.2e6,0.01)&&near(A(0.6,45),5.9e6,0.01)&&near(A(0.5,45),4.9e6,0.01));
  ok('awkR is total: any number gives a finite R, rising with the level',[0,1,19.5,28,44,99,-5,NaN,undefined,'x'].every(L=>Number.isFinite(X.awkR(L)))&&X.awkR(10)<X.awkR(20)&&X.awkR(30)<X.awkR(40)); }
{ const pell='pell', P={coins:0,drops:0,mat:0,ess:0,troph:0};   // the skill branch (x1.0) = the PLAN's branch total
  const sk=['sk2','sk3','sk4','sk5','sk6','sk7','sk8','sk9','sk10'].map(i=>X.awkNodeCost(pell,i));
  for(const c of sk){ P.coins+=c.coins; P.drops+=c.drops; P.mat+=c.mats.echo||0; P.ess+=c.mats.ess_fire||0; }
  ok('the skill branch (x1.0), levels 2-10: about 9.2 million coins, 1,017 drops, 109 Echo Shards, 90 Essence',near(P.coins,9.2e6,0.02)&&P.drops===1017&&P.mat===109&&P.ess===90,M(P.coins)+' '+P.drops+' '+P.mat+' '+P.ess);
  ok('level steps: 300 / 700 / 1,500 / 3,000 coins for levels 2-5; level 10 is 5.9M and 35 Essence',sk.slice(0,4).map(c=>c.coins).join()==='300,700,1500,3000'&&near(sk[8].coins,5.9e6,0.01)&&sk[8].mats.ess_fire===35);
  const bm=(c,l)=>X.awkNodeCost(pell,l+c);
  ok('branch multipliers on coins and drops: basic x0.75, skill x1, power x1.25, passive x1, charge x1, burst x1.5; branch material and Essence unchanged',bm(9,'ba').coins===0.75*bm(9,'sk').coins&&bm(9,'po').coins===1.25*bm(9,'sk').coins&&bm(9,'pa').coins===bm(9,'sk').coins&&bm(9,'ch').coins===bm(9,'sk').coins&&bm(9,'bu').coins===1.5*bm(9,'sk').coins&&bm(9,'ba').mats.ess_fire===25&&bm(9,'bu').mats.ess_fire===25&&bm(9,'bu').mats.rd_home===25&&bm(9,'ba').mats.echo===25);
  ok('branch material: Echo Shards on basic, skill and power, the land\'s raid material on passive, charge and burst',['ba','sk','po'].every(l=>X.awkNodeCost(pell,l+'5').mats.echo===5&&!X.awkNodeCost(pell,l+'5').mats.rd_home)&&['pa','ch','bu'].every(l=>X.awkNodeCost(pell,l+'5').mats.rd_home===5&&!X.awkNodeCost(pell,l+'5').mats.echo));
  const u=['pa1','ch1','bu1'].map(i=>X.awkNodeCost(pell,i));
  ok('unlock nodes pa1 / ch1 / bu1: 5,000 coins, 20 drops, 3 raid material each, nothing else',u.every(c=>c.coins===5000&&c.drops===20&&c.mats.rd_home===3&&Object.keys(c.mats).length===1));
  const s1=X.awkNodeCost(pell,'star1'), s2=X.awkNodeCost(pell,'star2');
  ok('star1: 0.1R at 35 (545,000), 150 drops, 20 trophies of each boss, 20 Essence; star2: 0.3R at 45 (2.9M), 300 drops, 40 of each, 40 Essence',near(s1.coins,545000,0.01)&&s1.drops===150&&s1.mats.trophy_boss===20&&s1.mats.trophy_carapax===20&&s1.mats.ess_fire===20&&near(s2.coins,2.9e6,0.02)&&s2.drops===300&&s2.mats.trophy_boss===40&&s2.mats.trophy_carapax===40&&s2.mats.ess_fire===40);
  const T=[1,2,3,4,5].map(t=>X.awkTierCost(pell,t));
  ok('tier costs: A1 2,000 coins + 20 drops; A2 14,000 + 50 + 10 Echo Shards; A3 165,000 + 100 + 2 raid; A4 818,000 + 200 + 5 raid + 20 Prime + 30 Essence; A5 4.9M + 350 + 10 raid + 30 Prime + 50 Essence + 2 trophies of each boss',
    T[0].coins===2000&&T[0].drops===20&&T[1].mats.echo===10&&T[1].drops===50&&near(T[1].coins,14000,0.01)&&near(T[2].coins,165000,0.01)&&T[2].mats.rd_home===2&&near(T[3].coins,818000,0.01)&&T[3].mats.rd_home===5&&T[3].mats.ess_prime===20&&T[3].mats.ess_fire===30
      &&near(T[4].coins,4.9e6,0.01)&&T[4].mats.rd_home===10&&T[4].mats.ess_prime===30&&T[4].mats.ess_fire===50&&T[4].mats.trophy_boss===2&&T[4].mats.trophy_carapax===2&&[T[0],T[1],T[2],T[3],T[4]].map(c=>c.hikerLv).join()==='10,20,28,35,45');
  ok('tier 0 is free; any other tier is null',(c=>c&&c.coins===0&&c.drops===0&&Object.keys(c.mats).length===0)(X.awkTierCost(pell,0))&&[-1,6,1.5,NaN,'1',null,undefined].every(t=>X.awkTierCost(pell,t)===null));
  const w=X.awkTierCost('tansy',4);
  ok('an element-less character (Tansy) pays Prime in place of Essence: A4 asks 20 + 30 Prime; the Wanderer too, with any boss\'s trophy',w.mats.ess_prime===50&&!Object.keys(w.mats).some(k=>/^ess_(?!prime)/.test(k))&&X.awkTierCost('wanderer',5).mats.ess_prime===80&&X.awkTierCost('wanderer',5).mats.trophy_any===4&&X.awkNodeCost('wanderer','po4').mats.trophy_any===4); }
// ---- stat nodes
{ const rows=[1,2,3,4,5,6,7,8,9].map(r=>X.AWK_STAT_ROWS[r]), A=X.awkShare;
  ok('stat node rows s1-s9: 500 / 1,000 / 2,000 / 5,000 / 12,000 coins, then 0.015R at 20, 0.03R at 28, 0.08R at 35, 0.15R at 45; drops 5 ... 100; Essence only on s7-s9 (5 / 7 / 10)',
    [500,1000,2000,5000,12000].every((c,k)=>rows[k].coins===c)&&near(A(rows[5].coins.r,rows[5].coins.at),14000,0.01)&&near(A(rows[6].coins.r,rows[6].coins.at),99000,0.01)&&near(A(rows[7].coins.r,rows[7].coins.at),436000,0.01)&&near(A(rows[8].coins.r,rows[8].coins.at),1.47e6,0.01)
    &&rows.map(r=>r.drops).join()==='5,8,12,18,25,35,50,70,100'&&rows.map(r=>r.ess||0).join()==='0,0,0,0,0,0,5,7,10');
  ok('the row follows depth (deeper = dearer, at most s9) and is held down by the tier (A0 s4, A1 s5, A2 s6, A3 s7, A4 s8, A5 s9)',X.awkStatRow(1,5)===1&&X.awkStatRow(40,5)===9&&X.awkStatRow(40,0)===4&&X.awkStatRow(40,2)===6&&X.awkStatRow(40,3)===7&&X.awkStatRow(40,4)===8&&X.awkStatRow(10,5)<=X.awkStatRow(20,5)&&[0,-3,NaN,undefined,1e9].every(d=>{ const r=X.awkStatRow(d,5); return r>=1&&r<=9; }));
  ok('the passive, charge and burst stat nodes cost more than the foot of the tree because they fork higher (Oak, summed)',(l=>SH.oak.nodes.filter(n=>n.limb===l&&n.kind==='stat').reduce((s,n)=>s+X.awkNodeCost('pell',n.id).coins/X.AWK_LIMBS[l].k,0))('bu')>(l=>SH.oak.nodes.filter(n=>n.limb===l&&n.kind==='stat').reduce((s,n)=>s+X.awkNodeCost('pell',n.id).coins/X.AWK_LIMBS[l].k,0))('po'));
  ok('stats by kit (PLAN 4c): Pell (safe) basic crit, skill dmg, power dmg, passive hp, charge cd, burst crit; Torgeir (tank) hp / red / eff / hp / red / dmg; every set has a kit',
    ['ba','sk','po','pa','ch','bu'].every((l,k)=>X.awkStatOf('pell','s'+l+'9').stat===['crit','dmg','dmg','hp','cd','crit'][k]&&X.awkStatOf('torgeir','s'+l+'9').stat===['hp','red','eff','hp','red','dmg'][k])&&sets.every(s=>X.awkKitOf(s)&&Object.keys(X.AWK_KIT_STATS).includes(X.awkKitOf(s))));
  ok('values by band: dmg +0.5 / 1 / 1.5%, crit 0.3 / 0.6 / 1%, cd and red negative, hp 1 / 2 / 3%, drop 2 / 3 / 5%; a node\'s band is its row\'s',(o=>o.dmg[0]===0.005&&o.crit[2]===0.01&&o.cd[1]===-0.01&&o.red[2]===-0.015&&o.hp[2]===0.03&&o.drop[2]===0.05&&o.heal[0]===0.01&&o.eff[1]===0.02&&o.move[2]===0.015&&o.xp[0]===0.005)(X.AWK_STAT_VALUE)
    &&X.awkStatOf('pell','spo2').band==='shallow'&&X.awkStatOf('pell','spo2').v===0.005&&X.awkStatOf('pell','sbu10').band==='deep'&&X.awkStatOf('pell','sbu10').v===0.01&&X.awkStatOf('pell','spa1').band==='shallow'&&X.awkStatOf('pell','spa1').v===0.01);
  ok('awkStatOf: null for an upgrade node, a star, a junk id; the Wanderer\'s path picks the table (Fury risk, Keen Eye safe, unknown path the default)',X.awkStatOf('pell','po5')===null&&X.awkStatOf('pell','star1')===null&&X.awkStatOf('pell','__proto__')===null
    &&X.awkStatOf('wanderer','spo9','fury').stat==='dmg'&&X.awkStatOf('wanderer','spa9','fury').stat==='move'&&X.awkStatOf('wanderer','spa9','keeneye').stat==='hp'&&X.awkStatOf('wanderer','sba9','constructor').stat==='crit'); }

// ---- a whole character (PLAN 4d): about 82 million coins
{ const TOT=82e6, tot={}; for(const s of sets) tot[s.id]=X.awkTreeCost(s);
  ok('a fully awakened character costs about 82 million coins (within 5%) in every shape: Oak '+M(tot.pell.coins)+', Pine '+M(tot.tansy.coins)+', Willow '+M(tot.torgeir.coins)+', Banyan '+M(tot.marigold.coins),
    sets.every(s=>near(tot[s.id].coins,TOT,0.05)&&tot[s.id].nodes===116),sets.map(s=>s.id+' '+M(tot[s.id].coins)).filter((_,i)=>i%6===0).join(', '));
  ok('... and about 9,900 monster drops (within 5%), about 340 Echo Shards and 350 raid material',sets.every(s=>near(tot[s.id].drops,9900,0.05)&&near(tot[s.id].mats.echo,340,0.05)&&near(tot[s.id].mats['rd_'+s.land],350,0.05)),tot.pell.drops+' '+tot.pell.mats.echo+' '+tot.pell.mats.rd_home);
  ok('... and about 820 Essence (within 8%) of the character\'s element (or Prime), 50 Prime for A4-A5',sets.every(s=>{ const k=s.el==='basic'?'ess_prime':'ess_'+s.el, e=tot[s.id].mats[k]-(k==='ess_prime'?50:0); return near(e,820,0.08)&&tot[s.id].mats.ess_prime>=50; }),tot.pell.mats.ess_fire+' fire, '+tot.pell.mats.ess_prime+' Prime');
  ok('the PLAN\'s other columns: the totals are the same whatever the sets\' kit (stats change values, not prices); the Wanderer costs what an Oak character costs',near(tot.pell.coins,tot.zahra.coins,0.0001)&&X.awkTreeCost('wanderer').coins===tot.pell.coins);
  // the five parts of the PLAN's table
  const sh=SH.oak, part=f=>sh.nodes.filter(f).reduce((s,n)=>s+X.awkNodeCost('pell',n.id).coins,0), tiers=[1,2,3,4,5].reduce((s,t)=>s+X.awkTierCost('pell',t).coins,0);
  ok('parts: basic / skill / power levels about 27.6M, passive / charge / burst levels about 32.2M, unlocks and stars about 3.5M, tiers A1-A5 about 5.9M, the 57 stat nodes about 13M (within 35%)',
    near(part(n=>n.kind==='up'&&n.lv>1&&'ba sk po'.includes(n.limb)),27.6e6,0.02)&&near(part(n=>n.kind==='up'&&n.lv>1&&'pa ch bu'.includes(n.limb)),32.2e6,0.02)&&near(part(n=>n.kind==='star'||(n.kind==='up'&&n.lv===1)),3.5e6,0.02)&&near(tiers,5.9e6,0.02)&&near(part(n=>n.kind==='stat'),13e6,0.35),
    M(part(n=>n.kind==='up'&&n.lv>1&&'ba sk po'.includes(n.limb)))+' '+M(part(n=>n.kind==='up'&&n.lv>1&&'pa ch bu'.includes(n.limb)))+' '+M(part(n=>n.kind==='star'||(n.kind==='up'&&n.lv===1)))+' '+M(tiers)+' '+M(part(n=>n.kind==='stat'))); }

// ---- Essence and trophies sit only where the PLAN puts them
{ const ess=m=>Object.keys(m).filter(k=>k.startsWith('ess_')&&k!=='ess_prime'), bad=[], badT=[];
  for(const s of sets){ const sh=X.awkShapeOf(s), I=X.awkInfo(s), ek=s.el==='basic'?'ess_prime':'ess_'+s.el;
    for(const n of sh.nodes){ const c=X.awkNodeCost(s,n.id), has=Object.keys(c.mats).some(k=>k.startsWith('ess_')), row=n.kind==='stat'?X.awkStatRow(n.depth,n.tier):0;
      const allowed=n.kind==='star'||(n.kind==='up'&&n.lv>=7)||(n.kind==='stat'&&row>=7);
      if(has!==allowed) bad.push(s.id+' '+n.id);
      if(has&&(n.tier<3||c.hikerLv<28)) bad.push(s.id+' '+n.id+' early');
      if(has&&Object.keys(c.mats).filter(k=>k.startsWith('ess_')).some(k=>k!==ek)) bad.push(s.id+' '+n.id+' wrong element');
      const tr=Object.keys(c.mats).filter(k=>k.startsWith('trophy_')), okT=n.kind==='star'?tr.length===2:n.kind==='up'&&n.lv>=2&&X.AWK_LIMBS[n.limb].troph?tr.length===1&&tr[0]==='trophy_'+I.bosses[X.AWK_LIMBS[n.limb].troph-1]:tr.length===0;
      if(!okT) badT.push(s.id+' '+n.id); }
    for(let t=0;t<=5;t++){ const c=X.awkTierCost(s,t); if(Object.keys(c.mats).some(k=>k.startsWith('ess_')&&k!=='ess_prime'||k==='ess_prime'&&!(t>=4))&&!(t>=4)) bad.push(s.id+' tier '+t); if(Object.keys(c.mats).some(k=>k.startsWith('trophy_'))&&t!==5) badT.push(s.id+' tier '+t); } }
  ok('Essence only at skill levels 7-10, stat nodes s7-s9, the two stars and tiers A4-A5, always the character\'s element (Prime if it has none), never before hiker level 28',bad.length===0,bad.slice(0,4).join(', '));
  ok('trophies only on the power branch (the land\'s first boss), the charge branch (its second), the two stars and A5',badT.length===0,badT.slice(0,4).join(', '));
  const tr=(l)=>SH.oak.nodes.filter(n=>n.limb===l&&n.kind==='up').reduce((s,n)=>s+(Object.entries(X.awkNodeCost('pell',n.id).mats).filter(([k])=>k.startsWith('trophy_')).reduce((a,[,v])=>a+v,0)),0);
  ok('163 trophies on the power branch and 163 on the charge branch; none on the other four',tr('po')===163&&tr('ch')===163&&['ba','sk','pa','bu'].every(l=>tr(l)===0)&&X.AWK_TROPHY.slice(2).join()==='1,2,4,6,10,15,25,40,60');
  ok('Essence is the element of the set: fire for Pell, water for Brynja, Prime for Tansy and the Wanderer',X.awkNodeCost('pell','sk10').mats.ess_fire===35&&X.awkNodeCost('brynja','sk10').mats.ess_water===35&&X.awkNodeCost('tansy','sk10').mats.ess_prime===35&&X.awkNodeCost('wanderer','sk10').mats.ess_prime===35); }

// ---- junk never throws
{ const junk=['__proto__','constructor','toString','hasOwnProperty','valueOf','prototype','','x',null,undefined,5,-1,NaN,{},[],true,{id:'__proto__'},{id:'pell',land:'__proto__'},{id:'pell',land:'home',role:{main:'__proto__'},tree:'__proto__'}];
  let threw=null; const run=f=>{ try { return f(); } catch(e){ threw=threw||e; return undefined; } };
  const out=[]; for(const a of junk){ out.push(run(()=>X.awkShapeOf(a)),run(()=>X.awkInfo(a)),run(()=>X.awkKitOf(a,'__proto__')),run(()=>X.awkTreeCost(a)),run(()=>X.awkTierCost(a,3))); for(const b of junk) out.push(run(()=>X.awkNodeCost(a,b)),run(()=>X.awkStatOf(a,b,b)),run(()=>X.awkNode(SH.oak,b)),run(()=>X.awkTierCost('pell',b)),run(()=>X.awkNodeCost('pell',b))); }
  ok('the cost and shape functions do not throw on junk ids or sets (\'__proto__\', \'constructor\', numbers, objects ...)',threw===null,threw&&String(threw));
  ok('... and answer null for them (a junk node of a real set, a junk set, a junk tier)',['__proto__','constructor','toString','',null,{}].every(b=>X.awkNodeCost('pell',b)===null&&X.awkNodeCost(b,'po5')===null&&X.awkNode(SH.oak,b)===null&&X.awkTierCost('pell',b)===null));
  ok('awkNodeCost: a real node of a real set is a plain {coins, drops, land, mats, tier, hikerLv}',(c=>c&&Number.isFinite(c.coins)&&Number.isFinite(c.drops)&&c.land==='home'&&typeof c.mats==='object'&&c.tier===1&&c.hikerLv===10)(X.awkNodeCost('pell','po5'))); }

console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
