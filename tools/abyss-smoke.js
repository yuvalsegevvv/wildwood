// The Abyss, steps B0-B1 (shared/abyss.js, server/abyss.js), straight from src/, no build: the difficulty and round-level tables (against abyss-plan/PLAN.md section 0), the boss rounds,
// gear.ab cleaned field by field (prototype keys, NaN, negatives, huge numbers, strings), the flag (off: abyss{a:'open'} is silence), on at level 40: the info message, at level 39: a refusal,
// and the slot split (rifts 16-31, the Abyss 32-47).
// Usage: node tools/abyss-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,log(){},send(to,m){ sent.push([to,JSON.parse(JSON.stringify(m))]); }},['AB_DIFFS','AB_INF','abRoundLv','abRounds','abBossRounds','abIsBossRound','abSwitch','abSanitize','abOnS','AB_ART_MAX','AB_RANK_MAX','AB_CURSE_MAX','AB_ENTRY_LV','AB_AS_MAX','AB_LOCK_MAX','AB_SLOT0','DG_MAX_INST','RIFT_SLOT0','sanitizeGear']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const J=JSON.stringify, tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const lvs=(d,n)=>Array.from({length:n},(_,i)=>x.abRoundLv(d,i+1));
// the tables
ok('six difficulties: I-V and Infinite',x.AB_DIFFS.length===6&&x.AB_INF===5&&x.AB_DIFFS[5].rounds===0);
ok('round counts 7 / 10 / 13 / 16 / 19',J(x.AB_DIFFS.slice(0,5).map(d=>d.rounds))==='[7,10,13,16,19]');
ok('difficulty I: 40, 43, 47, 50, 53, 57, 60',J(lvs(0,7))==='[40,43,47,50,53,57,60]',J(lvs(0,7)));
ok('every finite difficulty starts at lo and ends at hi',x.AB_DIFFS.slice(0,5).every((d,i)=>x.abRoundLv(i,1)===d.lo&&x.abRoundLv(i,d.rounds)===d.hi&&d.hi===d.lo+20+10*i));
ok('the last digit cycles 0, 3, 7 in every finite difficulty',x.AB_DIFFS.slice(0,5).every((d,i)=>lvs(i,d.rounds).every((l,r)=>l%10===[0,3,7][r%3])));
ok('Infinite: 90 at round 1, 180 at round 28',x.abRoundLv(5,1)===90&&x.abRoundLv(5,28)===180,x.abRoundLv(5,28));
ok('boss rounds: I [7], II [7,10], III [7,13], IV [7,13,16], V [7,13,19]',J([0,1,2,3,4].map(d=>x.abBossRounds(d)))==='[[7],[7,10],[7,13],[7,13,16],[7,13,19]]');
ok('Infinite boss rounds start 7, 13, 19, 25',J(x.abBossRounds(5).slice(0,4))==='[7,13,19,25]'&&[7,13,19,25,31,61].every(r=>x.abIsBossRound(5,r))&&![1,6,8,12,14,26].some(r=>x.abIsBossRound(5,r)));
ok('abIsBossRound agrees with abBossRounds for every finite round (none past the end)',[0,1,2,3,4].every(d=>{ const b=x.abBossRounds(d); for(let r=1;r<=30;r++) if(x.abIsBossRound(d,r)!==b.includes(r)) return false; return true; }));
ok('caps: 20 artifacts, rank 5, 5 curses, entry level 40',x.AB_ART_MAX===20&&x.AB_RANK_MAX===5&&x.AB_CURSE_MAX===5&&x.AB_ENTRY_LV===40);
ok('slots: the Abyss takes 32-47, the rifts 16-31',x.AB_SLOT0===32&&x.DG_MAX_INST===48&&x.RIFT_SLOT0===16);
// the save
const clean=(g)=>{ const o={}; x.abSanitize({ab:g},o); return o.ab; };
const D={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,sh:{d:0,n:{}},run:null};
ok('no gear.ab (an old save): the default',J(clean(undefined))===J(D)&&J((()=>{ const o={}; x.abSanitize({},o); return o.ab; })())===J(D));
ok('garbage values: strings, NaN, negative, arrays, null give the default',[ 'x',7,null,[],{top:'a',best:NaN,clears:'no',as:-5,lock:'z',sh:'q',run:5},{top:-3,best:-1,clears:[-1,NaN,'x'],as:Infinity,lock:-Infinity,sh:{d:-4,n:[1,2]}} ].every(g=>{ const c=clean(g); return J(c)===J(D)||(c.top===0&&c.best===0&&c.as>=0&&c.lock>=0&&c.run===null&&c.clears.length===6); }));
{ const c=clean({top:9,best:99999999,clears:[1,2,3,4,5,6,7,8],as:1e15,lock:1e15,run:{d:1,r:2}}); ok('huge numbers are capped, clears keeps 6, a run is dropped',c.top===5&&c.best===999999&&c.clears.length===6&&c.as===x.AB_AS_MAX&&c.lock===x.AB_LOCK_MAX&&c.run===null,J(c)); }
{ const g=JSON.parse('{"sh":{"d":5,"n":{"__proto__":3,"constructor":2,"toString":1,"rsw":4,"rsa":-2,"x":"abc","y":1e9,"z":true}}}'), c=clean(g); ok('shop counts: prototype names and bad counts dropped, own ids clamped',J(c.sh)===J({d:5,n:{rsw:4,y:9999}})&&Object.getPrototypeOf(c.sh.n)===Object.prototype,J(c.sh)); }
ok('a clean save stays as it is',(()=>{ const g={top:3,best:21,clears:[4,3,2,0,0,0],as:500,lock:2,sh:{d:20000,n:{rsw:3}},run:null}; return J(clean(g))===J(g); })());
{ const o=x.sanitizeGear({ab:{top:2,as:-1}}); ok('sanitizeGear carries gear.ab (the hook)',o&&o.ab&&o.ab.top===2&&o.ab.as===0&&o.ab.clears.length===6); }
// the flag and the window
W.join('a',{name:'Alice',look:{cls:'warrior'},save:{level:40}}); W.join('b',{name:'Bob',look:{cls:'warrior'},save:{level:39}}); tick(2);
const A=W.players.get('a'), B=W.players.get('b'), abm=pid=>sent.filter(s=>s[0]===pid&&s[1].t==='abyss').map(s=>s[1]);
ok('the flag is off by default (and the deploy-like server has no dev tools)',x.abOnS()===false);
W.receive('a',{t:'abyss',a:'open'}); tick(2); ok('flag off: open is silence',abm('a').length===0);
x.abSwitch(true); ok('abSwitch(true) turns the flag on',x.abOnS()===true);
W.receive('a',{t:'abyss',a:'open'}); const inf=abm('a').pop();
ok('flag on, level 40: the info message',inf&&inf.a==='info'&&inf.on===1&&inf.top===0&&inf.best===0&&inf.lv===40&&inf.diffs.length===6&&inf.diffs[0].lo===40&&inf.diffs[4].rounds===19&&inf.diffs[5].rounds===0,J(inf));
A.gear.ab.top=2; A.gear.ab.best=17; W.receive('a',{t:'abyss',a:'open'}); const inf2=abm('a').pop(); ok('the info carries the save (top, best)',inf2&&inf2.top===2&&inf2.best===17);
sent.length=0; W.receive('b',{t:'abyss',a:'open'}); tick(2);
ok('level 39: no info, a refusal toast',abm('b').length===0&&sent.some(s=>s[1].t==='snap'&&(s[1].ev||[]).some(e=>e&&e[0]==='toast'&&e[1]==='b'&&/level 40/.test(e[2]))),sent.length);
ok('garbage messages do nothing and do not throw',(()=>{ try{ for(const m of [{t:'abyss'},{t:'abyss',a:'constructor'},{t:'abyss',a:7},{t:'abyss',a:null}]) W.receive('a',m); return abm('a').length===0; }catch(e){ return false; } })());
x.abSwitch(false); sent.length=0; W.receive('a',{t:'abyss',a:'open'}); ok('switched off again: silence',abm('a').length===0);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
