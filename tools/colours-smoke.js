// Headless test of the premium colours (shared/colours.js, server/colours.js): 48 unique premium colours that are never a free palette's, buying one costs 500 gems once and is refused without gems / twice /
// for a bad index, the favourites list is cleaned, the look loses unowned premium colours (premCleanLook) and keeps owned ones, saves are sanitized, the test world owns them all.
// Usage: node tools/colours-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({send(){}},['S','PREM_COLOURS','PREM_PRICE','PREM_FAV_MAX','premIndexOf','premLocked','premCleanLook','premSanitize','sanitizeGear','GS_ACH']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const C=require('./char-load')(), FREE=new Set([].concat(C.TINTC||[]));
ok('48 premium colours, unique hexes and names, all real colours',x.PREM_COLOURS.length===48&&new Set(x.PREM_COLOURS.map(c=>c[0])).size===48&&new Set(x.PREM_COLOURS.map(c=>c[1])).size===48&&x.PREM_COLOURS.every(c=>Number.isInteger(c[0])&&c[0]>=0&&c[0]<=0xffffff&&typeof c[1]==='string'));
ok('the price is 500 and the favourites hold 16',x.PREM_PRICE===500&&x.PREM_FAV_MAX===16);
{ const src=require('fs').readFileSync(__dirname+'/../src/game/character/model.js','utf8'), nums=new Set((src.match(/0x[0-9a-fA-F]{6}/g)||[]).map(Number));
  const clash=x.PREM_COLOURS.filter(c=>nums.has(c[0])).map(c=>c[1]); ok('no premium colour is also in a free palette of model.js',!clash.length,clash.join(',')); }
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:5}}); tick(1);
const p=W.players.get('a'); x.S.dev=false; p.gear.ach=x.GS_ACH.map(a=>a.id); p.gear.gem=0;
ok('a new hiker owns none and has no favourites',Array.isArray(p.gear.pc)&&p.gear.pc.length===0&&Array.isArray(p.gear.fav)&&p.gear.fav.length===0);
W.receive('a',{t:'colbuy',i:3}); tick(1); ok('buying without gems is refused',p.gear.pc.length===0&&p.gear.gem===0);
p.gear.gem=1200; W.receive('a',{t:'colbuy',i:3}); tick(1); ok('buying costs 500 gems and is kept',p.gear.pc.includes(3)&&p.gear.gem===700);
W.receive('a',{t:'colbuy',i:3}); tick(1); ok('buying it twice is refused (no second charge)',p.gear.gem===700&&p.gear.pc.length===1);
for(const bad of [-1,48,1.5,'3',null,'constructor',NaN]) W.receive('a',{t:'colbuy',i:bad}); tick(1);
ok('bad indices change nothing',p.gear.gem===700&&p.gear.pc.length===1);
W.receive('a',{t:'colfav',l:[0x5c5c63,x.PREM_COLOURS[3][0],0x5c5c63,-5,1.5,'x',0x1000000,...Array(40).fill(0).map((_,i)=>i*1000+7)]}); tick(1);
ok('the favourites are cleaned: numbers only, no repeats, at most 16, in order',p.gear.fav.length===16&&p.gear.fav[0]===0x5c5c63&&p.gear.fav[1]===x.PREM_COLOURS[3][0]&&new Set(p.gear.fav).size===16&&p.gear.fav.every(v=>Number.isInteger(v)&&v>=0&&v<=0xffffff));
W.receive('a',{t:'colfav',l:'nope'}); W.receive('a',{t:'colfav'}); tick(1); ok('a non-list leaves them alone',p.gear.fav.length===16);
{ const L={hairColor:x.PREM_COLOURS[0][0],topColor:x.PREM_COLOURS[3][0],capeTrim:x.PREM_COLOURS[5][0],tintTop2:x.PREM_COLOURS[0][0],eyes:0x4a2e1c,height:1.2,skin:0xe6b894}, owned=[3];
  const lk=x.premLocked(L,owned), cl=x.premCleanLook(L,owned);
  ok('locked lists each unowned premium colour once',lk.length===2&&lk.some(l=>l.i===0)&&lk.some(l=>l.i===5));
  ok('the clean look puts unowned ones back (a base colour to a plain colour, others to as-designed) and keeps owned ones and everything else',cl.hairColor!==L.hairColor&&cl.hairColor>=0&&cl.capeTrim===-1&&cl.tintTop2===-1&&cl.topColor===L.topColor&&cl.eyes===0x4a2e1c&&cl.height===1.2&&cl.skin===0xe6b894);
  ok('a free look is returned unchanged',JSON.stringify(x.premCleanLook({hairColor:0x3b2619,capeTrim:-1},[]))===JSON.stringify({hairColor:0x3b2619,capeTrim:-1})); }
// the server cleans the look on the look message
W.receive('a',{t:'look',look:{cls:'warrior',hairColor:x.PREM_COLOURS[0][0],topColor:x.PREM_COLOURS[3][0],capeTrim:x.PREM_COLOURS[9][0]}}); tick(1);
ok('the look message keeps the owned colour and drops the rest',p.look.topColor===x.PREM_COLOURS[3][0]&&p.look.hairColor!==x.PREM_COLOURS[0][0]&&p.look.capeTrim===-1);
{ const g=x.sanitizeGear({pc:[1,1,2,99,-1,'a',2.5],fav:[1,1,0x123456,-4]},'warrior'); ok('a save is sanitized',JSON.stringify(g.pc)==='[1,2]'&&JSON.stringify(g.fav)==='[1,1193046]'); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
