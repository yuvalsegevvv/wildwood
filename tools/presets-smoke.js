// Headless test of loadout presets (server straight from src/): save, wear, the linked outfit event, the busy rule, clearing, a bad save.
// Usage: node tools/presets-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...JSON.parse(JSON.stringify(m.ev))); }},['S','prSanitize','prBusyP','PR_COUNT','PR_OUTFITS']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:40}}); tick(3);
const p=W.players.get('a'), send=m=>{ W.receive('a',m); tick(2); };
ok('ten presets, all empty, and ten outfit slots',p.gear.pre.length===10&&p.gear.pre.every(e=>e===null)&&x.PR_OUTFITS===10);
const S=p.gear.skills, w0=p.gear.eq.weapon;
send({t:'prsave',i:3,n:'Tank',of:4});
ok('save keeps equipment, soul, skills and the outfit link',p.gear.pre[3]&&p.gear.pre[3].n==='Tank'&&p.gear.pre[3].of===4&&p.gear.pre[3].eq.weapon===w0&&p.gear.pre[3].soul===p.gear.soul);
S.eq.warrior.skill=null; p.gear.eq.weapon='bow1'; p.gear.soul='basic';
if(!p.gear.inv.includes('bow1')) p.gear.inv.push('bow1');
evs.length=0; send({t:'prwear',i:3});
ok('wear restores weapon and the skill loadout',p.gear.eq.weapon===w0&&S.eq.warrior.skill===p.gear.pre[3].sk.skill);
ok('wear sends the linked outfit slot',evs.some(e=>e[0]==='prwear'&&e[2]===3&&e[3]===4));
p.pv={}; p.gear.eq.weapon='bow1'; send({t:'prwear',i:3});
ok('refused on the Proving Isle',p.gear.eq.weapon==='bow1'); delete p.pv;
p.inst=5; send({t:'prwear',i:3}); ok('refused in a dungeon',p.gear.eq.weapon==='bow1'); p.inst=0;
p.gear.inv=p.gear.inv.filter(i=>i!==w0); send({t:'prwear',i:3});
ok('an item no longer owned is skipped, nothing throws',p.gear.eq.weapon==='bow1'||p.gear.eq.weapon===w0);
send({t:'prsave',i:99,n:'x'}); send({t:'prsave',i:-1}); send({t:'prwear',i:1.5}); send({t:'prwear',i:7});
ok('bad indexes and empty slots are ignored',p.gear.pre.length===10);
send({t:'prclear',i:3}); ok('clear empties the slot',p.gear.pre[3]===null);
const bad=x.prSanitize([{n:'<b>x</b>',eq:{weapon:'constructor',zzz:'sword1'},sk:{skill:'__proto__'},of:99,soul:'nope'},'junk',5]);
ok('a bad save is cut down',bad.length===10&&bad[0].of===9&&bad[0].soul==='basic'&&Object.keys(bad[0].eq).length===0&&bad[1]===null&&!/[<>]/.test(bad[0].n));
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
