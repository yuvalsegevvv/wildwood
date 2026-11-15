// Headless test of the dungeon ladder (shared/dungeon-tiers.js, revamp step D1): the 11 rows, a run's level = its tier's, the unlock rule (gear.dg.top), the save's
// sanitizing and the old-save migration, the Delve board's tier field and the start message's tier (clamped, refused when locked, the zone tier ignored).
// Usage: node tools/dungeon-tiers-smoke.js
const {loadServer}=require('./load');
const msgs={};
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ (msgs[pid]=msgs[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['DG_TIERS','DG_TIER_MAX','dgtClamp','dgtLevel','dgtOpen','dgtTop','dgtOldLevel','dgLevel','dgUnlocked','dgGateOpen','dgSanitizeSave','sanitizeGear','DG_RUNS','DG_THEMES','DG_ENTRANCES','dgOffer','dgPoolS','dgApron','dgWinS','dgPresentS','DG_ENTRY_LV']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const last=(pid,t)=>{ const a=(msgs[pid]||[]).filter(m=>m.t===t); return a[a.length-1]; };

// ---- the table ----
const LV=[30,38,46,54,62,70,78,86,94,102,110];
ok('11 rows, t 0..10, levels 30,38,...,110',x.DG_TIERS.length===11&&x.DG_TIERS.every((r,i)=>r.t===i&&r.lv===LV[i]));
ok('every eq row sums to 100 and every piece range is ordered',x.DG_TIERS.every(r=>r.eq.length===4&&r.eq.reduce((a,b)=>a+b,0)===100&&r.n.length===2&&r.n[0]>=1&&r.n[0]<=r.n[1]));
ok('spot rows: tier III 25/50/25/0 1-2, tier XI 0/0/25/75 3-5',JSON.stringify(x.DG_TIERS[2].eq)==='[25,50,25,0]'&&x.DG_TIERS[2].n.join()==='1,2'&&JSON.stringify(x.DG_TIERS[10].eq)==='[0,0,25,75]'&&x.DG_TIERS[10].n.join()==='3,5');
ok('dgtClamp: integers 0-10, garbage is 0',x.dgtClamp(-4)===0&&x.dgtClamp(99)===10&&x.dgtClamp('3')===3&&x.dgtClamp(NaN)===0&&x.dgtClamp(undefined)===0&&x.dgtClamp(2.7)===2);

// ---- a run's level is the tier's, whatever the theme or the zone tier ----
ok('dgLevel(theme,t) = DG_TIERS[t].lv for every theme (a level-48 Cenote is 30 at tier I)',Object.values(x.DG_THEMES).filter(T=>T.land).every(T=>x.dgLevel(T,0)===30&&x.dgLevel(T,4)===62&&x.dgLevel(T,10)===110));

// ---- the unlock ----
const hr=x.DG_THEMES.hollowroots, cen=x.DG_THEMES.cenote;
const g0={}, g3={dg:{top:3}}, gAll={dg:{top:11},isles:2};
ok('tier I is open with no save; tier II is not',x.dgUnlocked(g0,30,hr,0).ok&&!x.dgUnlocked(g0,30,hr,1).ok);
ok('the Hollow Roots need no +1 any more (zone tiers ignored): open at tier I even with zt on 0',x.dgUnlocked({zt:{home:{on:0,max:0}}},25,hr,0).ok&&x.dgGateOpen({},hr));
ok('top 3 opens tiers I-IV (index 0-3), not V',x.dgUnlocked(g3,30,hr,3).ok&&!x.dgUnlocked(g3,30,hr,4).ok&&x.dgUnlocked(g3,30,hr,3).level===54);
ok('hiker level 25 enters, 24 does not; no theme asks more (Cenote at 25 with its land gate open)',x.dgUnlocked(g0,25,hr,0).ok&&!x.dgUnlocked(g0,24,hr,0).ok&&x.dgUnlocked({isles:2},25,cen,0).ok);
ok('the land gate stays: the Cenote is sealed before the isles are walked into',!x.dgUnlocked({},60,cen,0).ok&&!x.dgGateOpen({},cen));
ok('tier 11 / -1 / 1.5 do not exist',!x.dgUnlocked(gAll,60,hr,11).ok&&!x.dgUnlocked(gAll,60,hr,-1).ok&&!x.dgUnlocked(gAll,60,hr,1.5).ok&&x.dgUnlocked(gAll,60,hr,10).ok);
ok('no theme has an `entry` field left',Object.values(x.DG_THEMES).every(T=>T.entry===undefined));

// ---- the save ----
const san=(dg,extra)=>x.sanitizeGear(Object.assign({dg},extra||{})).dg;
ok('top is kept and clamped 0-11; garbage is 0',san({top:5}).top===5&&san({top:99}).top===11&&san({top:-3}).top===0&&san({top:'x'}).top===0&&san({top:5,clear:{}}).top===5);
ok('a brand-new save has top 0',san(undefined).top===0);
// migration: the old level at the zone tier's max picks the tier (level 50 -> tier III cleared -> top 3)
ok('migration: no clears -> top 0',san({clear:{}}).top===0);
ok('migration: Jade Springs (vale, lv 30) cleared with zt max 2 = old level 50 -> top 3 (tier IV open)',san({clear:{'jadesprings:purge':1}},{zt:{vale:{on:2,max:2}}}).top===3);
ok('migration: Hollow Roots cleared, zt max 1 (its base) = level 30 -> top 1',san({clear:{'hollowroots:purge':2}},{zt:{home:{on:1,max:1}}}).top===1);
ok('migration: the highest theme wins (Cenote lv 48 at max 3 = 78 -> top 7)',san({clear:{'jadesprings:purge':1,'cenote:purge':1}},{zt:{vale:{on:0,max:0},isles:{on:3,max:3}}}).top===7);
ok('migration runs once: a save that has top keeps it whatever zt says',san({top:2,clear:{'cenote:purge':1}},{zt:{isles:{max:5}}}).top===2);

// ---- the board and the start message ----
const join=(pid,save)=>{ W.join(pid,{name:pid,look:{cls:'warrior'},save:{level:40,gear:Object.assign({sun:2,east:2},save||{})}}); return W.players.get(pid); };
const at=(p,id)=>{ const E=x.DG_ENTRANCES[id]; p.x=E.x+3; p.z=E.z; p.y=0; };
{ const p=join('lead',{dg:{top:2}}); at(p,'hollowroots'); W.receive('lead',{t:'dg',a:'open'});
  const b=last('lead','dgboard');
  ok('dgboard carries top and the highest open tier, and ok at tier I',b&&b.top===2&&b.tier===2&&b.ok===1&&b.L===30,JSON.stringify(b&&{top:b.top,tier:b.tier,ok:b.ok,L:b.L}));
  const offer=x.dgOffer('hollowroots',Date.now(),x.dgPoolS());
  msgs.lead=[]; W.receive('lead',{t:'dg',a:'start',dungeon:'hollowroots',type:offer[0],tier:3});
  ok('a locked tier is refused with a toast and no run',x.DG_RUNS.size===0&&p.inst===undefined||!p.inst);
  W.receive('lead',{t:'dg',a:'start',dungeon:'hollowroots',type:offer[0],tier:2});
  const run=[...x.DG_RUNS.values()][0];
  ok('tier 2 (III) starts a level-46 run with run.tier 2',run&&run.tier===2&&run.L===46,run&&run.tier+' '+run.L);
  if(run){ x.dgWinS(run); ok('winning tier III raises top to 3',W.players.get('lead').gear.dg.top===3);
    for(const r of [...x.DG_RUNS.values()]) x.DG_RUNS.delete(r.id); }
}
{ const p=join('lead2',{dg:{top:0},zt:{home:{on:3,max:3}}}); p.inst=0; at(p,'hollowroots');
  const offer=x.dgOffer('hollowroots',Date.now(),x.dgPoolS());
  W.receive('lead2',{t:'dg',a:'start',dungeon:'hollowroots',type:offer[0],tier:99});
  ok('tier 99 is clamped to 10 and refused (not open), the zone tier 3 does not open anything',![...x.DG_RUNS.values()].length);
  W.receive('lead2',{t:'dg',a:'start',dungeon:'hollowroots',type:offer[0]});
  const run=[...x.DG_RUNS.values()][0];
  ok('no tier in the message = tier I, level 30, whatever the zone tier',run&&run.tier===0&&run.L===30,run&&run.tier+' '+run.L);
}
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
