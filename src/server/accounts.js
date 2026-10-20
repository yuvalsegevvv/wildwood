//@ Registered accounts (name + password) on the online server: log in, register a guest, log out, unique names
/* Two kinds of player on a server that keeps saves (io.store):
   - guest: progress stored under the browser's secret account code (hello.acct), as before accounts existed.
   - registered: progress stored under 'user:'+lowercase name; the name is the key, so it is unique and fixed.
   Passwords never reach the store: the Node host hashes them (io.auth: hash, verify, token, tokenHash, all
   in node/main.js; the server bundle also runs in a browser tab, which has no accounts). After a password
   login or a registration the browser gets a session token so it can log in again without the password; the
   record keeps only the tokens' hashes (last 5 devices).
   A guest who registers moves their progress to the account; the guest record is replaced by {movedTo}
   so the same progress can't be played twice (and the browser's local copy is ignored for it).
   Names are unique among registered accounts and players online: a guest who picks a taken name gets a
   number added. */
const NAMES=new Set(), FAILS=new Map();   // registered names (lowercase); wrong passwords per account key
const ACCOUNTS_ON=!!(io.store&&io.auth);
// friends who lost progress get it back when they register or log in: lowercase name -> level
const GIFT_LEVELS={hayru:9};
if(ACCOUNTS_ON&&io.store.users) Promise.resolve().then(()=>io.store.users()).then(list=>{ for(const n of list||[]) if(n) NAMES.add(String(n).toLowerCase()); })
  .catch(e=>{ if(io.log) io.log('could not list account names',e&&e.message); });
const userKey=n=>'user:'+n.toLowerCase();
function nameTaken(n,self){
  const k=n.toLowerCase();
  if(NAMES.has(k)&&!(self&&self.user&&self.user.toLowerCase()===k)) return true;
  for(const q of S.players.values()) if(q!==self&&q.name.toLowerCase()===k) return true;
  return false;
}
// a guest's name that someone already has: add a number (names are at most 16 characters)
function freeName(n,self){
  if(!nameTaken(n,self)) return n;
  for(let i=0;i<50;i++){ const t=n.slice(0,12)+' '+(100+Math.floor(Math.random()*900)); if(!nameTaken(t,self)) return t; }
  return 'Hiker '+Date.now()%100000;
}
function checkUserName(raw){
  const n=cleanName(raw);
  if(typeof raw!=='string'||n.length<3) return {err:'Names need at least 3 characters'};
  if(!/^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(n)) return {err:'Use letters, numbers, spaces, dots, dashes or underscores'};
  return {name:n};
}
// 5 wrong passwords lock an account's logins for a minute (slows guessing)
function locked(key){ const f=FAILS.get(key); return !!(f&&f.n>=5&&Date.now()<f.until); }
function failed(key){ const f=FAILS.get(key)||{n:0,until:0}; if(Date.now()>f.until) f.n=0; f.n++; f.until=Date.now()+60000; FAILS.set(key,f); }
/* guests (online server only: a browser's secret code, no name and password) are held back so progress cannot be farmed without an account: level 20 at most, the first three
   lands only (GUEST_LANDS: the home forest, the Sakura Vale, the Hoarfrost Reach; each land's own gate still holds until the story opens it), no zone tiers. Existing guest progress is never taken away, it just stops there. Each gate tells the player once in a while (event 'guest' -> the "Register to continue" popup). */
const GUEST_MAX_LV=20;
const GUEST_LANDS=['home','vale','hoar'];   // landAt() names (shared/tiers.js)
const guestLandOk=(x,z)=>GUEST_LANDS.includes(landAt(x,z));
const isGuestP=p=>ACCOUNTS_ON&&!!p.acct&&!p.user;
function guestGateP(p,why){ if(S.t-(p.guestT||-99)<5) return; p.guestT=S.t; ev('guest',p.id,why); }
function giftP(p){
  const lv=GIFT_LEVELS[p.user.toLowerCase()];
  if(lv&&p.level<lv){ setLevelP(p,lv); toastTo(p.id,'Welcome back, '+p.user+'! Your level '+lv+' has been restored.','good'); }
}
function issueToken(auth){ const t=io.auth.token(); auth.tokens=[io.auth.tokenHash(t)].concat(auth.tokens||[]).slice(0,5); return t; }
// hello{user, pass | token}: join as a registered player, or answer authfail (the connection stays open)
function loginJoin(pid,hello){
  const fail=text=>{ PENDING.delete(pid); sendTo(pid,{t:'authfail',text}); };
  if(!ACCOUNTS_ON) return fail('This world has no accounts. Play as a guest.');
  const user=cleanName(hello.user), key=userKey(user);
  if(locked(key)) return fail('Too many wrong passwords. Wait a minute and try again.');
  PENDING.add(pid);
  const live=ACCT.get(key), lp=live!==undefined&&S.players.get(live);
  let rec, token=null;
  Promise.resolve().then(()=>lp?recordOf(lp):io.store.load(key)).then(r=>{
    rec=r; if(!rec||!rec.auth) return false;
    if(typeof hello.token==='string'&&hello.token) return (rec.auth.tokens||[]).includes(io.auth.tokenHash(hello.token));
    return typeof hello.pass==='string'&&io.auth.verify(hello.pass,rec.auth.pass);
  }).then(good=>{
    if(!PENDING.has(pid)) return;   // left while loading
    if(!rec||!rec.auth) return fail('There is no account called '+user+'. Check the name, or go back and register.');
    if(!good){ if(hello.token) return fail('Your session has ended. Log in with your password.'); failed(key); return fail('Wrong password.'); }
    FAILS.delete(key); PENDING.delete(pid);
    const old=ACCT.get(key);
    if(old!==undefined&&old!==pid&&S.players.has(old)){ sendTo(old,{t:'kicked',text:'You logged in somewhere else, so this window was disconnected.'}); leave(old); if(io.kick) io.kick(old); }
    const auth=rec.auth; if(!hello.token) token=issueToken(auth);
    sendTo(pid,{t:'auth',user:auth.user,token});
    // the account's own look (kept in its record) replaces the one this browser sent; welcome hands it back to the client
    const look=rec.look&&typeof rec.look==='object'?rec.look:hello.look;
    const p=join(pid,Object.assign({},hello,{name:auth.user,look,save:{level:rec.level,exp:rec.exp,gear:rec.gear}}),auth);
    p.acct=key; ACCT.set(key,pid); NAMES.add(key.slice(5));
    if(token) p.saveDirty=true;
    giftP(p);
  }).catch(e=>{ if(io.log) io.log('login failed',e&&e.message); fail('The server could not load your account. Try again in a moment.'); });
}
// register{user,pass} from a guest in the game: their progress becomes the account's
function registerP(p,user,pass){
  const no=text=>sendTo(p.id,{t:'authfail',text,reg:1});
  if(!ACCOUNTS_ON||!p.acct) return no('Accounts need the online server.');
  if(p.user) return no('You are already logged in as '+p.user+'.');
  if(p.regBusy) return;
  const c=checkUserName(user); if(c.err) return no(c.err);
  if(typeof pass!=='string'||pass.length<6||pass.length>100) return no('Passwords need 6 to 100 characters');
  if(nameTaken(c.name,p)) return no('Someone already has the name '+c.name+'.');
  const name=c.name, key=userKey(name), guest=p.acct;
  p.regBusy=true;
  Promise.resolve(io.auth.hash(pass)).then(h=>{
    const auth={user:name,pass:h,tokens:[]}, token=issueToken(auth);
    return Promise.resolve(io.store.create(key,Object.assign(recordOf(p),{name,auth}))).then(made=>{
      p.regBusy=false;
      if(!made){ NAMES.add(key.slice(5)); return no('Someone already has the name '+name+'.'); }
      NAMES.add(key.slice(5));
      if(ACCT.get(guest)===p.id) ACCT.delete(guest);
      p.acct=key; p.auth=auth; p.user=name; ACCT.set(key,p.id);
      Promise.resolve(io.store.save(guest,{v:1,movedTo:name,updated:Date.now()})).catch(()=>{});
      if(p.name!==name){ const old=p.name; p.name=name; ev('pname',p.id,name,old); }
      sendTo(p.id,{t:'auth',user:name,token,reg:1});
      toastTo(p.id,'Registered as '+name+'. Log in with your name and password on any device.','good');
      giftP(p); p.dirty=true;
    });
  }).catch(e=>{ p.regBusy=false; if(io.log) io.log('register failed',e&&e.message); no('The server could not create the account. Try again in a moment.'); });
}
// rename{name} from a registered player: the account (its record, key and login name) moves to the new name; same rules as registering (3+ characters, letters / numbers / ._-, unique)
function renameAccountP(p,raw){
  const no=text=>toastTo(p.id,text,'bad');
  if(!ACCOUNTS_ON||!p.auth||!io.store.remove) return no('Your name is your account name and cannot be changed here');
  if(p.regBusy) return;
  const c=checkUserName(raw); if(c.err) return no(c.err);
  if(c.name===p.user) return;
  if(S.t-(p.renameT||-999)<30) return no('Wait a little before changing your name again');
  const name=c.name, key=userKey(name), oldKey=p.acct;
  if(key!==oldKey&&nameTaken(name,p)) return no('Someone already has the name '+name);
  p.regBusy=true; p.renameT=S.t;
  const done=ok=>{ p.regBusy=false; if(!ok) no('Someone already has the name '+name); };
  const fin=()=>{   // the new record exists: switch this player over, then drop the old one
    p.regBusy=false;
    if(key!==oldKey){ if(ACCT.get(oldKey)===p.id) ACCT.delete(oldKey); NAMES.delete(oldKey.slice(5)); NAMES.add(key.slice(5)); p.acct=key; ACCT.set(key,p.id); }
    p.auth.user=name; p.user=name; const old=p.name; p.name=name; ev('pname',p.id,name,old); p.saveDirty=true;
    sendTo(p.id,{t:'auth',user:name,token:issueToken(p.auth)});
    toastTo(p.id,'Your name is now '+name+'. Log in with it from now on.','good');
    if(key!==oldKey) Promise.resolve(io.store.remove(oldKey)).catch(e=>{ if(io.log) io.log('could not remove the old account record',e&&e.message); });
    saveP(p);
  };
  if(key===oldKey){ fin(); return; }   // only the capitals changed: same record
  Promise.resolve(io.store.create(key,Object.assign(recordOf(p),{name,auth:Object.assign({},p.auth,{user:name})}))).then(made=>{ if(!made){ NAMES.add(key.slice(5)); return done(false); } fin(); })
    .catch(e=>{ p.regBusy=false; if(io.log) io.log('rename failed',e&&e.message); no('The server could not change your name. Try again in a moment.'); });
}
// logout{token}: forget this device's session (the page reloads as a guest)
function logoutP(p,token){
  if(!p.auth||typeof token!=='string'||!io.auth) return;
  const h=io.auth.tokenHash(token); p.auth.tokens=(p.auth.tokens||[]).filter(t=>t!==h); saveP(p);
}
