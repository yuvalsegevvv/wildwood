// Headless test of gems and amber (server/amber.js): the public +1000 gem tool works with the dev switch off, buying an outfit set costs 1000 gems and is refused without funds / twice / for a bad id, the admin amber tool needs the dev switch, saves are sanitized.
// Usage: node tools/amber-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({send(){}},['S','SS_ORDER','SS_SETS','GEM_SET_PRICE','AMB_MAX','sanitizeGear','GS_ACH']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:5}}); tick(1);
const p=W.players.get('a'), id=x.SS_SETS[x.SS_ORDER[0]].outfit;
x.S.dev=false; p.gear.ach=x.GS_ACH.map(a=>a.id); p.gear.gem=0;   // (achievements pay gems too: mark them all claimed so only the tools under test move the purse)
ok('a new hiker has no gems, no amber and no outfit sets',p.gear.gem===0&&p.gear.amb===0&&Array.isArray(p.gear.os)&&p.gear.os.length===0);
W.receive('a',{t:'gembuy',v:id}); tick(1);
ok('buying without gems is refused',!p.gear.os.includes(id)&&p.gear.gem===0);
W.receive('a',{t:'gemtest'}); tick(1);
ok('the public testing tool gives 1000 gems (and no amber) with the dev switch off',p.gear.gem===1000&&p.gear.amb===0,String(p.gear.gem));
W.receive('a',{t:'dev',cmd:'amber',v:5000}); tick(1);
ok('the admin amber tool is refused with the dev switch off',p.gear.amb===0);
W.receive('a',{t:'gembuy',v:'constructor'}); W.receive('a',{t:'gembuy',v:'nope'}); tick(1);
ok('a bad outfit id changes nothing',p.gear.gem===1000&&p.gear.os.length===0);
W.receive('a',{t:'gembuy',v:id}); tick(1);
ok('buying an outfit set costs 1000 gems and adds it',p.gear.gem===0&&p.gear.os.includes(id)&&x.GEM_SET_PRICE===1000);
W.receive('a',{t:'gemtest'}); W.receive('a',{t:'gembuy',v:id}); tick(1);
ok('buying it twice is refused (no second charge)',p.gear.gem===1000&&p.gear.os.length===1);
x.S.dev=true; W.receive('a',{t:'dev',cmd:'amber',v:10000}); tick(1);
ok('the admin tool adds amber with the dev switch on, gems untouched',p.gear.amb===10000&&p.gear.gem===1000);
W.receive('a',{t:'dev',cmd:'amber',v:-x.AMB_MAX}); tick(1);
ok('...and takes it all away without going negative',p.gear.amb===0);
const g=x.sanitizeGear({amb:1e99,gem:1e99,os:[id,id,'x','__proto__',5]},'warrior');
ok('a save is cleaned: purses capped, outfit ids known and unique',g.amb===x.AMB_MAX&&g.gem===x.AMB_MAX&&g.os.length===1&&g.os[0]===id);
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
