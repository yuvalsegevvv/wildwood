// Headless test of the anti-cheat guard (src/server/api.js setPos, S.guard): prints PASS/FAIL. The guard is on with the testing tools on, as `--guard` does.
// Usage: node tools/guard-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,guard:true,send(){},broadcast(){}},['VIL']);
const {api:W2}=loadServer({dev:true,send(){},broadcast(){}},[]);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
W.join('a',{name:'Walker',look:{},save:{level:1}}); const p=W.players.get('a');
const x0=p.x, z0=p.z;
W.receive('a',{t:'pos',p:[x0+5,p.y,z0,0,0,0]});
ok('a step of 5 m is accepted',Math.abs(p.x-(x0+5))<1e-6,'x '+p.x);
W.receive('a',{t:'pos',p:[x0+400,p.y,z0,0,0,0]});
ok('a 400 m teleport is cut short',p.x-x0<70,'moved '+(p.x-x0));
W2.join('b',{name:'Tester',look:{},save:{level:1}}); const q=W2.players.get('b'), qx=q.x;
W2.receive('b',{t:'pos',p:[qx+400,q.y,q.z,0,0,0]});
ok('without the guard (dev default) the same jump is accepted',Math.abs(q.x-(qx+400))<1e-6);
console.log(fails?fails+' check(s) failed':'all ok'); process.exit(fails?1:0);
