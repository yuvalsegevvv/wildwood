// Headless test of sitting (src/server/sitting.js): the sit flag, the player row's 10th field, standing up on a move, refused when dead. Usage: node tools/sitting-smoke.js
const {loadServer}=require('./load');
const sent=[], {api:W,x}=loadServer({dev:false,send(pid,m){},broadcast(m){ if(m.t==='snap') sent.push(m); }},['S']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
W.join('a',{name:'Ann',look:{cls:'warrior'},save:{level:5}}); const A=W.players.get('a');
W.receive('a',{t:'sit',s:2}); ok('sit 2 is kept',A.sit===2);
W.receive('a',{t:'sit',s:7}); ok('a wild value is a ground sit at most',A.sit===0);
W.receive('a',{t:'sit',s:1}); ok('sit 1 is kept',A.sit===1);
W.receive('a',{t:'pos',p:[A.x+0.3,A.y,A.z,0,0,0]}); ok('a small step keeps you sitting',A.sit===1);
W.receive('a',{t:'pos',p:[A.x+5,A.y,A.z,0,0,0]}); ok('walking off stands you up',A.sit===0);
A.dead=true; W.receive('a',{t:'sit',s:1}); ok('not while knocked out',A.sit===0);
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
