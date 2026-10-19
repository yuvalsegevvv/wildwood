// Headless test of the friend list and the ranking (src/server/friends.js): requests, accepting, saving, removing, the ranking with offline players. Usage: node tools/friends-smoke.js
const {loadServer}=require('./load'), {memoryAccounts}=require('./headless');
const inbox={}, {DB,store,auth}=memoryAccounts();
const {api:W}=loadServer({dev:false,store,auth,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); },broadcast(){}},[]);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const wait=()=>new Promise(r=>setTimeout(r,20));
const evs=(pid,name)=>{ const out=[]; for(const m of inbox[pid]||[]) if(m.t==='snap') for(const e of m.ev||[]) if(e[0]===name&&e[1]===pid) out.push(e); return out; };
const tickAll=async()=>{ for(let i=0;i<3;i++){ W.tick(0.1); await wait(); } };
(async()=>{
  DB.set('user:old',{name:'Oldtimer',level:30,exp:5,look:{cls:'mage'}});
  await wait();
  W.join('a',{acct:'a'.repeat(32),name:'Ann',look:{cls:'warrior'},save:{level:12}}); W.join('b',{acct:'b'.repeat(32),name:'Bob',look:{cls:'mage'},save:{level:7}}); await wait();
  const A=W.players.get('a'), B=W.players.get('b'); for(const q of [A,B]) Object.defineProperty(q,'fr',{get:()=>q.gear.fr||[]});
  W.receive('a',{t:'fr',a:'add',name:'Nobody'}); W.receive('a',{t:'fr',a:'add',name:'Ann'});
  ok('adding an absent player or yourself does nothing',!A.fr.length);
  W.receive('a',{t:'fr',a:'add',name:'bob'}); await tickAll();
  ok('a request reaches the other player',evs('b','fri').length===1&&evs('b','fri')[0][2]==='Ann');
  ok('not friends until accepted',!A.fr.length&&!B.fr.length);
  W.receive('b',{t:'fr',a:'accept',name:'Ann'}); await tickAll();
  ok('accepting makes both friends',A.fr[0]==='Bob'&&B.fr[0]==='Ann');
  W.receive('a',{t:'fr',a:'list'}); await tickAll();
  { const l=evs('a','frl').pop(); ok('the list shows Bob online with his level',l&&l[2][0][0]==='Bob'&&l[2][0][1]===1&&l[2][0][2]===7,JSON.stringify(l)); }
  W.receive('a',{t:'fr',a:'accept',name:'Bob'}); ok('accepting a request nobody made does nothing',A.fr.length===1);
  W.receive('b',{t:'fr',a:'add',name:'Ann'}); ok('adding a friend twice is refused',B.fr.length===1);
  W.receive('a',{t:'fr',a:'rank'}); await tickAll();
  { const r=evs('a','rnk').pop(); ok('the ranking lists an offline account first, then you',r&&r[2][0][1]==='Oldtimer'&&r[2][1][1]==='Ann'&&r[3]===2&&r[4]>=3,JSON.stringify(r&&r.slice(2))); }
  W.leave('b'); await wait(); W.tick(1); W.receive('a',{t:'fr',a:'list'}); await tickAll();
  { const l=evs('a','frl').pop(); ok('a friend who left shows offline with the level he had',l&&l[2][0][1]===0&&l[2][0][2]===7,JSON.stringify(l&&l[2])); }
  W.receive('a',{t:'fr',a:'remove',name:'bob'}); ok('remove drops the friend',A.fr.length===0);
  console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();
