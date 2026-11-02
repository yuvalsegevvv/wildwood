//@ Test: the movement slot (registry, equip message and its level gate, saving, sanitizing, presets save and wear)
// Usage: node tools/movement-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['MV_IDS','MV_SKILLS','MV_SLOT_LV','mvDef','sanitizeSkills','prSanitize']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
ok('six movement skills, each with a button',x.MV_IDS.length===6&&x.MV_IDS.every(id=>x.MV_SKILLS[id].name&&['jump','run','mov'].includes(x.MV_SKILLS[id].btn)));
ok('mvDef refuses prototype names and non-strings',!x.mvDef('constructor')&&!x.mvDef('__proto__')&&!x.mvDef(5)&&!!x.mvDef('leap'));
ok('sanitizeSkills keeps a real id, drops bad ones',x.sanitizeSkills({mov:'glide'}).mov==='glide'&&x.sanitizeSkills({mov:'constructor'}).mov===null&&x.sanitizeSkills({mov:{}}).mov===null&&x.sanitizeSkills(null).mov===null);
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:2}}); W.join('b',{name:'Bo',look:{cls:'warrior'},save:{level:40}}); tick(3);
const lo=W.players.get('a'), hi=W.players.get('b'), send=(id,m)=>{ W.receive(id,m); tick(2); };
send('a',{t:'movequip',id:'leap'}); ok('below the slot level nothing is worn',lo.gear.skills.mov===null);
send('b',{t:'movequip',id:'leap'}); ok('equip works at level 40',hi.gear.skills.mov==='leap');
send('b',{t:'movequip',id:'constructor'}); ok('a bad id changes nothing',hi.gear.skills.mov==='leap');
send('b',{t:'prsave',i:0,n:'Run'}); ok('a preset keeps the movement skill',hi.gear.pre[0]&&hi.gear.pre[0].mov==='leap');
send('b',{t:'movequip',id:null}); ok('take off',hi.gear.skills.mov===null);
send('b',{t:'prwear',i:0}); ok('wearing the preset brings it back',hi.gear.skills.mov==='leap');
ok('a preset with a bad id is cut down',x.prSanitize([{n:'x',cls:'warrior',mov:'zzz'}])[0].mov===null);
process.exit(fails?1:0);
