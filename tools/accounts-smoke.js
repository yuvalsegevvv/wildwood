// Headless test of registered accounts (src/server/accounts.js) with an in-memory store: prints PASS/FAIL.
// Usage: node tools/accounts-smoke.js
const {loadServer}=require('./load'), {memoryAccounts}=require('./headless');
const inbox={};
const {DB,store,auth}=memoryAccounts();   // accounts kept in memory instead of files or Postgres
const {api:W,x}=loadServer({dev:false,guard:false,store,auth,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); },broadcast(){}},['gainExpP','isGuestP','VIL2','VIL4','setZoneTierP','landAt']);
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
  { const q=W.players.get('g2'); ok('a guest is a guest, a registered player is not',x.isGuestP(q)&&!x.isGuestP(g));
    x.gainExpP(q,1e9); ok('a guest stops at level 20 and keeps no XP past it',q.level===20,'level '+q.level);
    W.receive('g2',{t:'pos',p:[x.VIL2.x,5,x.VIL2.z,0,0,0]});
    ok('a guest may walk in the Sakura Vale (one of the first three lands)',Math.hypot(q.x-x.VIL2.x,q.z-x.VIL2.z)<1,'at '+Math.round(q.x)+','+Math.round(q.z));
    W.receive('g2',{t:'pos',p:[x.VIL4.x,5,x.VIL4.z,0,0,0]});
    ok('a guest cannot walk into the Greyspine (put back inside the first three lands)',Math.hypot(q.x-x.VIL4.x,q.z-x.VIL4.z)>200&&x.landAt(q.x,q.z)==='vale');
    q.gear.zt.home.max=2; x.setZoneTierP(q,'home',1); ok('a guest cannot rank a zone up',q.gear.zt.home.on===0);
    const l0=g.level,e0=g.exp; x.gainExpP(g,1e9); ok('a registered player is not capped at 20',g.level>20,'level '+g.level); g.level=l0; g.exp=e0; }
  W.receive('g2',{t:'register',user:'HAYRU',pass:'secret2'}); await wait();
  ok('same name in other case refused',!W.players.get('g2').user&&/already/.test(last('g2','authfail').text));
  W.receive('g2',{t:'name',name:'Hayru'}); await wait();
  ok('guest cannot rename to a registered name',W.players.get('g2').name!=='Hayru');
  W.receive('g1',{t:'name',name:'Ab'}); await wait(); ok('a registered rename follows the registration rules (3+ characters)',g.name==='Hayru');
  W.receive('g1',{t:'name',name:'Other'}); await wait();
  ok('a registered player can rename: the account moves to the new name',g.name==='Other'&&g.user==='Other'&&g.acct==='user:other'&&DB.has('user:other')&&!DB.has('user:hayru')&&DB.get('user:other').auth.user==='Other'&&last('g1','auth').user==='Other');
  W.receive('g2',{t:'name',name:'Other'}); await wait(); ok('a guest cannot take the renamed name',W.players.get('g2').name!=='Other');
  g.renameT=-999; W.receive('g1',{t:'name',name:'Hayru'}); await wait();
  ok('and back again (the old name was freed)',g.name==='Hayru'&&g.acct==='user:hayru'&&DB.has('user:hayru')&&!DB.has('user:other'));
  g.gear.coins=500; W.leave('g1'); await wait();
  // log in elsewhere with the password, then with the token
  { let n=0; const v=auth.verify; auth.verify=(pw,h)=>{ n++; return v(pw,h); };   // a connection that sends its login again and again while the first is being checked costs one password check, not one each
    for(let i=0;i<5;i++) W.receive('burst',{t:'hello',acct:A3,user:'hayru',pass:'wrong-'+i,name:'x',look:{},save:{level:1}}); await wait(); await wait();
    auth.verify=v; ok('five logins in a row from one connection are one password check',n===1,n+' checks'); W.leave('burst'); inbox.burst=[]; }
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
