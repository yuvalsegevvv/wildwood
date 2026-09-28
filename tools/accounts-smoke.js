// Headless test of registered accounts (src/server/accounts.js) with an in-memory store: prints PASS/FAIL.
// Usage: node tools/accounts-smoke.js
const {loadServer}=require('./load'), {memoryAccounts}=require('./headless');
const inbox={};
const {DB,store,auth}=memoryAccounts();   // accounts kept in memory instead of files or Postgres
const {api:W}=loadServer({dev:false,store,auth,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); },broadcast(){}});
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const last=(pid,t)=>[...(inbox[pid]||[])].reverse().find(m=>m.t===t);
const wait=()=>new Promise(r=>setTimeout(r,20));
const A1='a'.repeat(32), A2='b'.repeat(32), A3='c'.repeat(32);
(async()=>{
  // an existing browser joins as a guest with its local progress
  W.join('g1',{acct:A1,name:'Hayru',look:{cls:'warrior'},save:{level:4,exp:3,gear:{coins:77}}}); await wait();
  const g=W.players.get('g1'); ok('guest keeps browser progress',g&&g.level===4&&g.gear.coins===77);
  W.join('g2',{acct:A2,name:'hayru',look:{},save:{level:1}}); await wait();
  ok('duplicate guest name gets a number',W.players.get('g2').name!=='hayru'&&/^hayru \d+$/.test(W.players.get('g2').name),W.players.get('g2').name);
  W.receive('g1',{t:'register',user:'Hayru',pass:'123'}); await wait();
  ok('short password refused',!!last('g1','authfail')&&!g.user);
  W.receive('g1',{t:'register',user:'Hayru',pass:'secret1'}); await wait();
  const au=last('g1','auth');
  ok('register moves progress to the account',g.user==='Hayru'&&au&&au.token&&DB.get(A1).movedTo==='Hayru');
  ok('Hayru gets level 9',g.level===9,'level '+g.level);
  W.receive('g2',{t:'register',user:'HAYRU',pass:'secret2'}); await wait();
  ok('same name in other case refused',!W.players.get('g2').user&&/already/.test(last('g2','authfail').text));
  W.receive('g2',{t:'name',name:'Hayru'}); await wait();
  ok('guest cannot rename to a registered name',W.players.get('g2').name!=='Hayru');
  W.receive('g1',{t:'name',name:'Other'}); ok('registered name is fixed',g.name==='Hayru');
  g.gear.coins=500; W.leave('g1'); await wait();
  // log in elsewhere with the password, then with the token
  W.join('d1',{acct:A3,user:'hayru',pass:'wrong',name:'x',look:{},save:{level:1}}); await wait();
  ok('wrong password refused',!W.players.has('d1')&&last('d1','authfail').text==='Wrong password.');
  // the account's look: set while playing, restored by a login from a browser that has a different one
  W.join('l0',{acct:A3,user:'hayru',pass:'secret1',name:'x',look:{sex:'male',hair:'short'},save:{level:1}}); await wait();
  W.receive('l0',{t:'look',look:{sex:'female',hair:'bun',cls:'mage'}}); W.leave('l0'); await wait();
  W.join('l1',{acct:A3,user:'hayru',pass:'secret1',name:'x',look:{sex:'male',hair:'buzz'},save:{level:1}}); await wait();
  ok('login restores the account look and sends it in welcome',W.players.get('l1').look.hair==='bun'&&last('l1','welcome').look.hair==='bun',JSON.stringify(last('l1','welcome').look));
  W.join('gw',{acct:A2,name:'Guesty',look:{sex:'male',hair:'buzz'},save:{level:1}}); await wait();
  ok('a guest keeps the look its browser sent (no look in welcome)',W.players.get('gw').look.hair==='buzz'&&last('gw','welcome').look===undefined);
  W.leave('gw'); W.leave('l1'); await wait();
  W.join('d1',{acct:A3,user:'hayru',pass:'secret1',name:'x',look:{},save:{level:1}}); await wait();
  const d=W.players.get('d1'); ok('password login loads the account',d&&d.name==='Hayru'&&d.level===9&&d.gear.coins===500);
  const tok=last('d1','auth').token; W.leave('d1'); await wait();
  W.join('d2',{acct:A3,user:'Hayru',token:tok,name:'x',look:{},save:{level:1}}); await wait();
  ok('token login',W.players.has('d2')&&W.players.get('d2').user==='Hayru');
  W.receive('d2',{t:'logout',token:tok}); W.leave('d2'); await wait();
  W.join('d3',{acct:A3,user:'Hayru',token:tok,name:'x',look:{},save:{level:1}}); await wait();
  ok('logged-out token refused',!W.players.has('d3'));
  W.join('n1',{acct:A3,user:'Nobody',pass:'whatever',name:'x',look:{},save:{level:1}}); await wait();
  ok('unknown account refused',/no account/.test(last('n1','authfail').text));
  // the moved guest code starts over instead of reusing the browser copy
  W.join('g3',{acct:A1,name:'Again',look:{},save:{level:4,exp:0,gear:{coins:77}}}); await wait();
  ok('moved guest code starts fresh',W.players.get('g3').level===1&&W.players.get('g3').gear.coins!==77);
  ok('password is not stored in plain text',!JSON.stringify([...DB.values()]).includes('secret1'));
  console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();
