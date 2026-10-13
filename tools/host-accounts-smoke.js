// Test of registered accounts on the built server as the deployed thing runs them: the real password hashing (scrypt in src/node/main.js), the real file store, real sockets and a real restart.
// A guest registers (their level moves to the account), names are unique whatever the case, short passwords and a taken name are refused, the process is stopped and started again on the same saves, and the account logs in
// with its password and with the session token, a wrong password and a stale token are refused, five wrong passwords lock the account for a while, a second login takes over the first window, a logout ends the token.
// Build first (python3 build.py).   Usage: node tools/host-accounts-smoke.js
const {fs,path,wait,until,get,wsOpen,msgs,send,startHost}=require('./host-lib'), crypto=require('crypto');
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const code=()=>crypto.randomBytes(16).toString('hex');
const last=(c,t)=>msgs(c).filter(m=>m.t===t).pop();
const has=(c,t)=>()=>msgs(c).some(m=>m.t===t);
// a window that has said hello (a guest, or an account with {user,pass} or {user,token}) and been answered
async function join(port,hello){ const c=await wsOpen(port); send(c,Object.assign({t:'hello',acct:code(),name:'Walker',look:{},save:{level:1}},hello)); await until(()=>msgs(c).some(m=>m.t==='welcome'||m.t==='authfail'),15000); return c; }
(async()=>{
  const H=await startHost(), dir=H.dir; let H2=null;
  ok('the server starts',H.up);
  if(!H.up){ console.log(H.log().slice(-500)); process.exit(1); }
  try{
    // ---- a guest registers
    const g=await join(H.port,{name:'Wanderer',save:{level:7,exp:123}});
    await until(()=>last(g,'you'),5000); ok('the guest plays at the level they brought',!!last(g,'you')&&last(g,'you').level===7);
    send(g,{t:'register',user:'HostAnna',pass:'sesame-123'});
    ok('registering answers with the account name and a session token',!!await until(has(g,'auth'),15000));
    const au=last(g,'auth'); ok('...the token is a long random string and the answer says it was a registration',au&&au.user==='HostAnna'&&typeof au.token==='string'&&au.token.length>=32&&au.reg===1,JSON.stringify(au&&{u:au.user,len:au.token&&au.token.length,reg:au.reg}));
    const token=au&&au.token;
    const g2=await join(H.port,{name:'Other'});
    send(g2,{t:'register',user:'hostanna',pass:'another-pw'}); await until(has(g2,'authfail'),8000);
    ok('the same name in another case is refused',/already has the name/i.test((last(g2,'authfail')||{}).text||''),(last(g2,'authfail')||{}).text);
    g2.frames.length=0; send(g2,{t:'register',user:'HostBob',pass:'abc'}); await until(has(g2,'authfail'),8000);
    ok('a password under 6 characters is refused',/6 to 100/.test((last(g2,'authfail')||{}).text||''),(last(g2,'authfail')||{}).text);
    g2.frames.length=0; send(g2,{t:'register',user:'x',pass:'long-enough'}); await until(has(g2,'authfail'),8000);
    ok('a name that is too short is refused',!!last(g2,'authfail'),(last(g2,'authfail')||{}).text);
    g2.frames.length=0; send(g2,{t:'register',user:'HostBob',pass:'bobs-password'}); await until(has(g2,'auth'),15000);
    ok('a second, different account registers',!!last(g2,'auth')&&last(g2,'auth').user==='HostBob');
    await wait(300); const st=JSON.parse((await get(H.port,'/status')).body.toString());
    ok('/status counts the saved records (accounts and the guest codes that moved)',st.accounts>=2,JSON.stringify(st.accounts));
    await wait(5600);   // the periodic save (every 5 s) writes the account's record too
    g.s.destroy(); g2.s.destroy(); await wait(600);
    const ex=await H.stop('SIGTERM'); ok('the server is stopped (saves, exits)',!!ex&&ex.code===0,JSON.stringify(ex));
    // ---- the same saves, a new process
    H2=await startHost({dir}); ok('the server starts again on the same saves',H2.up);
    if(!H2.up) throw new Error('no restart: '+H2.log().slice(-300));
    const names=JSON.parse((await get(H2.port,'/status')).body.toString());
    ok('/status after the restart: nobody online, the accounts are still counted',names.players===0&&names.accounts>=2,JSON.stringify(names));
    let a=await join(H2.port,{user:'hostanna',pass:'sesame-123',name:'ignored'});
    ok('log in with the password (any case of the name): welcome, a fresh token, the progress from before',has(a,'welcome')()&&!!last(a,'auth')&&last(a,'auth').user==='HostAnna'&&last(a,'auth').token!==token);
    await until(()=>last(a,'you'),5000); ok('...the level is the one the guest registered with',!!last(a,'you')&&last(a,'you').level===7,JSON.stringify(last(a,'you')&&last(a,'you').level));
    const a2=await join(H2.port,{user:'HostAnna',token});
    ok('log in with the session token from before the restart (no password)',has(a2,'welcome')()&&!has(a2,'authfail')(),(last(a2,'authfail')||{}).text);
    await wait(300);
    ok('...and that took over the first window (it was kicked, one player is online)',!!last(a,'kicked')&&JSON.parse((await get(H2.port,'/status')).body.toString()).players===1,JSON.stringify(last(a,'kicked')));
    const bad=await join(H2.port,{user:'HostAnna',token:'0'.repeat(48)});
    ok('a token that was never issued is refused',has(bad,'authfail')()&&/session has ended/i.test(last(bad,'authfail').text),(last(bad,'authfail')||{}).text);
    const nobody=await join(H2.port,{user:'NoSuchPerson',pass:'whatever1'});
    ok('an unknown account is refused, naming the problem',/no account called/i.test((last(nobody,'authfail')||{}).text||''));
    const w1=await join(H2.port,{user:'HostBob',pass:'wrong-1'});
    ok('a wrong password is refused',/Wrong password/i.test((last(w1,'authfail')||{}).text||''),(last(w1,'authfail')||{}).text);
    let locked=null; for(let i=2;i<=7&&!locked;i++){ const w=await join(H2.port,{user:'HostBob',pass:'wrong-'+i}); const t=(last(w,'authfail')||{}).text||''; if(/Too many/i.test(t)) locked=i; }
    ok('after five wrong passwords the account is locked for a while (even the right password waits)',locked>=5&&locked<=7,'locked at try '+locked);
    const right=await join(H2.port,{user:'HostBob',pass:'bobs-password'});
    ok('...the lock holds against the right password too',/Too many/i.test((last(right,'authfail')||{}).text||''),(last(right,'authfail')||{}).text);
    // ---- logout ends the token
    a2.frames.length=0; send(a2,{t:'logout',token}); await wait(500);
    const after=await join(H2.port,{user:'HostAnna',token});
    ok('after logout the token no longer works',has(after,'authfail')()&&/session has ended/i.test(last(after,'authfail').text),(last(after,'authfail')||{}).text);
    const again=await join(H2.port,{user:'HostAnna',pass:'sesame-123'});
    ok('...and the password still does',has(again,'welcome')()&&!!last(again,'auth'));
    ok('nothing in the log looks like an error',!/error|exception/i.test((H.log()+H2.log()).replace(/postgres|ECONNRESET/gi,'')),((H.log()+H2.log()).match(/.*(error|exception).*/i)||[''])[0].slice(0,200));
  }catch(e){ ok('the test ran to the end',false,e&&e.stack?e.stack.split('\n').slice(0,3).join(' | '):String(e)); }
  if(H2) await H2.stop('SIGKILL'); await H.stop('SIGKILL'); await wait(200);
  fs.rmSync(dir,{recursive:true,force:true});
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
