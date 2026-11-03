// Headless test of /stuck and the stuck message (src/server/unstuck.js): the nearest open village, the cooldown, the combat and gate refusals; travel from anywhere (warp{any:1}). Usage: node tools/unstuck-smoke.js
const {loadServer}=require('./load');
const inbox={}, {api:W,x}=loadServer({dev:false,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); },broadcast(){}},['VIL','VIL2','S']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
W.join('a',{name:'Ann',look:{cls:'warrior'},save:{level:12}}); const A=W.players.get('a');
const tps=()=>(inbox.a||[]).filter(m=>m.t==='tp');
A.x=x.VIL.x+150; A.z=x.VIL.z+60; A.lastHit=-99;
W.receive('a',{t:'stuck'}); ok('a stuck hiker is sent to the home village spawn',tps().length===1&&Math.hypot(A.x-(x.VIL.spawn||x.VIL).x,A.z-(x.VIL.spawn||x.VIL).z)<1,JSON.stringify(tps()[0]));
A.x+=100; W.receive('a',{t:'stuck'}); ok('a second use inside the cooldown does nothing',tps().length===1);
A.unstuckT=-1e9; A.lastHit=x.S.t; A.x+=100; W.receive('a',{t:'stuck'}); ok('not right after a hit',tps().length===1);
A.lastHit=-99; A.gear.east=0; A.x=x.VIL2.x; A.z=x.VIL2.z; W.receive('a',{t:'stuck'}); ok('a closed land\'s village is not a destination (the home village is)',tps().length===2&&Math.hypot(A.x-x.VIL.x,A.z-x.VIL.z)<80);
A.unstuckT=-1e9; A.gear.east=1; A.x=x.VIL2.x+5; A.z=x.VIL2.z; W.receive('a',{t:'stuck'}); ok('an open land sends you to its own village',Math.hypot(A.x-x.VIL2.x,A.z-x.VIL2.z)<80&&tps().length===3);
A.unstuckT=-1e9; A.dead=true; W.receive('a',{t:'stuck'}); ok('not while knocked out',tps().length===3); A.dead=false;
A.unstuckT=-1e9; W.receive('a',{t:'chat',text:'/stuck'}); ok('the chat command works too',tps().length===4);
// travel from anywhere (the map's Travel chip: warp{to,any:1}, warpP in server/players.js; docs/WAYPOINT.md)
{ A.dead=false; A.lastHit=-99; A.inst=0; A.pv=0; A.gear.east=2; x.S.t+=10; A.warpT=-99; A.x=x.VIL.x+150; A.z=x.VIL.z+60; const n0=tps().length;
  W.receive('a',{t:'warp',to:'hanami'}); ok('travel: off a circle, a warp without any does nothing',tps().length===n0);
  W.receive('a',{t:'warp',to:'hanami',any:1}); ok('travel: from anywhere to an awake circle',tps().length===n0+1&&Math.hypot(A.x-x.VIL2.x,A.z-x.VIL2.z)<80);
  x.S.t+=10; A.x=x.VIL2.x+150; A.lastHit=x.S.t; W.receive('a',{t:'warp',to:'home',any:1}); ok('travel: not right after a hit',tps().length===n0+1);
  A.lastHit=-99; x.S.t+=10; A.gear.north=0; W.receive('a',{t:'warp',to:'rimehold',any:1}); ok('travel: not to a circle still asleep',tps().length===n0+1);
  W.receive('a',{t:'warp',to:'nowhere',any:1}); ok('travel: an unknown destination does nothing (no throw)',tps().length===n0+1);
  A.inst=7; W.receive('a',{t:'warp',to:'home',any:1}); ok('travel: not from a dungeon run',tps().length===n0+1); A.inst=0; }
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
