//@ Headless test of the levels: the XP curve up to level 49 unchanged, the soft cap from level 50 (every level x1.5 dearer, no wall), saves and the testing tool up to the ceiling, and the rule that a kill never pays for more than 10 levels above you (the world and zone tiers)
// Usage: node tools/levels-smoke.js   (server straight from src/, no build; ~2 s)
// What it covers: expToNext, xpLeadK, LV_SOFT / LV_SOFT_GROWTH / PLAYER_MAX_LV (shared/balance.js), gainExpP and newPlayer (server/players.js), rewardKill (server/combat.js), the dev
// level command (server/economy.js). The same rule inside a dungeon run is checked in tools/dungeon-runs-smoke.js. The numbers and the reasoning: docs/areas/tiers.md (Reference numbers).
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','BOSSES','gainExpP','rewardKill','monK','recalcP','expToNext25','expToNext','xpFor','xpLeadK','XP_LEAD','LV_SOFT','LV_SOFT_GROWTH','PLAYER_MAX_LV','psP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const near=(a,b,tol)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));
const join=(pid,level)=>{ W.join(pid,{name:'T'+pid,look:{cls:'warrior'},save:{level}}); tick(1); return W.players.get(pid); };
const zt=(home,vale,hoar)=>({home:{on:home[0],max:home[1]},vale:{on:vale[0],max:vale[1]},hoar:{on:hoar[0],max:hoar[1]}});
const K25=x.expToNext25(25)/x.xpFor(25);   // "same-level kills per level" from level 26 on (about 2,100)

// ---- the curve ----
{ const bad=[]; for(let L=1;L<=49;L++){ const want=L<=25?x.expToNext25(L):K25*x.xpFor(L); if(!near(x.expToNext(L),want,1e-12)) bad.push(L); }
  ok('up to level 49 the XP curve is what it always was (levels 1-25 the old formula, 26-49 about '+Math.round(K25)+' same-level kills each)',!bad.length&&x.LV_SOFT===50,bad.join()); }
{ const g=x.LV_SOFT_GROWTH, per=L=>x.expToNext(L)/x.xpFor(L), row=[]; let mono=true, ratio=true;
  for(let L=50;L<=80;L++){ row.push(per(L)); if(!near(per(L),K25*Math.pow(g,L-49),1e-9)) ratio=false; if(L>50&&!(x.expToNext(L)>x.expToNext(L-1))) mono=false; }
  ok('from level 50 every level costs x'+g+' the same-level kills of the one before (level 50 -> 51: '+Math.round(per(50))+', 55 -> 56: '+Math.round(per(55))+', 60 -> 61: '+Math.round(per(60))+'), and the XP it needs only ever rises (no cliff at the cap)',
    g===1.5&&ratio&&mono&&x.expToNext(50)>x.expToNext(49)); }
{ const kills=L=>x.expToNext(L)/x.xpFor(Math.min(L+10,80));   // the best XP a kill can pay: a monster 10 levels above you (80 is the highest monster)
  ok('with that best XP the last normal level (49 -> 50) is about '+Math.round(kills(49))+' kills, 50 -> 51 about '+Math.round(kills(50))+', 55 -> 56 about '+Math.round(kills(55))+' and 60 -> 61 about '+Math.round(kills(60))+': a slope that stalls, not a wall',
    kills(49)>250&&kills(49)<350&&kills(50)>400&&kills(50)<500&&kills(55)>5000&&kills(55)<8000&&kills(60)>50000); }

// ---- no wall: levels past 50 are gained, saved and set ----
{ const a=join('a',49); a.exp=0; const e49=x.expToNext(49), e50=x.expToNext(50), e51=x.expToNext(51); evs.length=0;
  x.gainExpP(a,e49+e50+e51+123,null); tick(3);
  ok('a hiker at level 49 given the XP for three levels is level 52 with the rest left over (there is no stop at 50)',a.level===52&&near(a.exp,123,1e-6)&&evs.some(e=>e[0]==='lvup'&&e[1]==='a'&&e[2]===52),'level '+a.level+', exp '+a.exp);
  const b=join('b',60), c=join('c',150), d=join('d',0), e=join('e','x');
  ok('a save at level 60 loads at 60; past the technical ceiling ('+x.PLAYER_MAX_LV+') it is clamped there; nonsense becomes level 1',b.level===60&&c.level===x.PLAYER_MAX_LV&&d.level===1&&e.level===1&&x.PLAYER_MAX_LV===99,[b.level,c.level,d.level,e.level].join(','));
  const f=join('f',98); f.exp=0; x.gainExpP(f,x.expToNext(98)*5,null);
  ok('only the ceiling ('+x.PLAYER_MAX_LV+') stops a hiker, however much XP comes in',f.level===x.PLAYER_MAX_LV);
  W.receive('a',{t:'dev',cmd:'level',v:70}); tick(2); const l70=a.level; W.receive('a',{t:'dev',cmd:'level',v:999}); tick(2);
  ok('the testing tool sets any level up to the ceiling (70 -> 70, 999 -> '+x.PLAYER_MAX_LV+')',l70===70&&a.level===x.PLAYER_MAX_LV);
  W.leave('b'); W.leave('c'); W.leave('d'); W.leave('e'); W.leave('f'); }

// ---- a kill never pays for more than 10 levels above you ----
{ const lead=x.XP_LEAD;
  ok('xpLeadK: a monster up to '+lead+' levels above you pays in full (1), one level more is cut, and one far above pays exactly what a monster '+lead+' levels above you does',
    lead===10&&x.xpLeadK(30,40)===1&&x.xpLeadK(30,25)===1&&x.xpLeadK(30,41)<1&&near(x.xpFor(80)*x.xpLeadK(30,80),x.xpFor(40),1e-12)&&near(x.xpFor(60)*x.xpLeadK(49,60),x.xpFor(59),1e-12)); }
const xpOf=(pid,monId)=>{ const e=evs.filter(q=>q[0]==='xp'&&q[1]===pid&&q[3]===monId); return e.length?e[e.length-1][2]:null; };
{ const p=join('p',20); p.gear.zt=zt([3,3],[0,0],[0,0]);
  const boar=x.MONS.find(m=>m.def.id==='boar'&&!m.temp&&!m.dead), K=x.monK(boar,p);   // a level-4 boar at the home forest's tier III: level 34
  const grab=(lv)=>{ p.level=lv; p.exp=0; evs.length=0; x.rewardKill(p,boar); tick(3); return xpOf('p',boar.id); };
  const real=Math.random; Math.random=()=>0.5;
  try{
    const at20=grab(20), at30=grab(30), at40=grab(40);
    ok('a tier III monster (level '+K.lv+') pays a level-20 hiker what a level-30 monster pays (XP '+at20+') and a level-30 or level-40 hiker its own level-34 amount: the cap follows your level',
      K.lv===34&&near(at20,x.xpFor(30),0.001)&&near(at30,x.xpFor(34),0.001)&&near(at40,x.xpFor(34),0.001)&&at20<at30,at20+' / '+at30+' / '+at40);
    p.gear.zt=zt([0,5],[0,0],[0,0]); const sl=x.MONS.find(m=>m.def.id==='slime'&&!m.temp&&!m.dead), pay=t=>{ p.gear.zt=zt([t,5],[0,0],[0,0]); p.level=25; p.exp=0; evs.length=0; x.rewardKill(p,sl); tick(3); return xpOf('p',sl.id); };
    const xs=[0,1,2,3,4,5].map(pay), top=x.xpFor(35);
    ok('for a level-25 hiker every zone tier of a level-1 slime pays more XP only up to +10 levels (level 35): tier III (level 31) is still below it, tiers IV (41) and V (51) pay exactly the level-35 amount',
      xs[0]<xs[1]&&xs[1]<xs[2]&&xs[2]<xs[3]&&xs[3]<top*1.0001&&near(xs[4],top,0.001)&&near(xs[5],top,0.001),xs.map(v=>Math.round(v)).join(' / '));
    // a boss keeps its x25
    const car=x.BOSSES.find(b=>b.bd.def.id==='carapax').m; p.gear.zt=zt([0,0],[0,0],[0,0]); p.level=5; p.exp=0; evs.length=0; x.rewardKill(p,car); tick(3);
    const bx=xpOf('p',car.id), ps=1+x.psP(p,'xp');
    ok('a boss keeps its x25 under the cap: Carapax (level 20) pays a level-5 hiker 25 x the XP of a level-15 monster',near(bx,25*x.xpFor(15)*ps,0.002),bx+' vs '+(25*x.xpFor(15)*ps).toFixed(1));
  } finally { Math.random=real; } }
console.log(fails?'\n'+fails+' FAILED':'\nall checks passed'); process.exit(fails?1:0);
