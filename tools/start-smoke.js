// Headless test of the start card and the first steps of an account (src/game/ui/start-screen.js, account.js, character-editor.js), talking to a
// real world server in this process through a fake WebSocket. Build first (python3 build.py). Prints PASS/FAIL lines.
// Usage: node tools/start-smoke.js
const {bootClient,memoryAccounts}=require('./headless');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms)=>{ for(let t=0;t<(ms||8000);t+=20){ if(f()) return true; await wait(20); } return false; };
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const EXPOSE=['NET','started:()=>started','customizing:()=>customizing','creating:()=>creating','canStart:()=>canStart','clsOf','setLook','LOOK:()=>LOOK','edTab:()=>edTab','EDIT'];
const find=(e,f)=>{ if(f(e)) return e; for(const k of e._kids||[]){ const r=find(k,f); if(r) return r; } return null; };
function fill(c,user,pass,pass2){ c.el('#stUser').value=user; c.el('#stPass').value=pass; c.el('#stPass2').value=pass2===undefined?'':pass2; c.el('#stForm').requestSubmit(); }
async function boot(o){ const c=bootClient(Object.assign({online:true,expose:EXPOSE},o)); await until(()=>c.G().canStart()); return c; }

(async()=>{
  const accounts=memoryAccounts();
  accounts.DB.set('user:taken',{v:1,name:'Taken',look:{sex:'female',hair:'bun'},level:1,exp:0,gear:{},auth:{user:'Taken',pass:accounts.auth.hash('secret1'),tokens:[]}});

  // 1. the card on the online server: three ways in, and Play as guest goes straight into the world
  let c=await boot({accounts}), G=c.G();
  ok('the card offers Log in, Register and Play as guest (no solo, no world picker)',!c.el('#stLogin').hidden&&!c.el('#stRegister').hidden&&!c.el('#stGuest').hidden&&c.el('#stSolo').hidden&&c.el('#stRoom').hidden);
  ok('the guest and submit buttons wait for the world',c.el('#stGuest').disabled===false&&c.el('#stSubmit').disabled===false);
  c.el('#stGuest').click();
  ok('Play as guest starts the game as a guest',await until(()=>c.G().started())&&!c.G().NET.user&&c.G().NET.mode==='ws');
  c.stop();

  // 2. login errors, registration errors, then a new account: the editor opens on the Class tab and the class can be clicked
  c=await boot({accounts}); G=c.G();
  c.el('#stLogin').click(); ok('Log in opens the form',!c.el('#stForm').hidden&&c.el('#stHome').hidden&&c.el('#stPass2').hidden);
  fill(c,'Taken','wrong'); await until(()=>c.el('#stMsg').textContent);
  ok('a wrong password is refused and the form stays',c.el('#stMsg').textContent==='Wrong password.'&&!c.el('#stForm').hidden&&!c.G().NET.ready&&c.el('#stSubmit').disabled===false);
  fill(c,'Nobody','x'); await until(()=>/no account/.test(c.el('#stMsg').textContent));
  ok('an unknown account is refused',/no account/.test(c.el('#stMsg').textContent));
  c.el('#stBack').click(); c.el('#stRegister').click();
  ok('Register opens the form with a repeat-password field',!c.el('#stForm').hidden&&!c.el('#stPass2').hidden&&c.el('#stSubmit').textContent==='Register');
  fill(c,'Ab','secret1','secret1'); ok('a short name is refused before connecting',/at least 3/.test(c.el('#stMsg').textContent)&&!c.G().NET.ready);
  fill(c,'Newbie','abc','abc'); ok('a short password is refused before connecting',/at least 6/.test(c.el('#stMsg').textContent)&&!c.G().NET.ready);
  fill(c,'Newbie','secret1','secret2'); ok('mismatched passwords are refused before connecting',/do not match/.test(c.el('#stMsg').textContent)&&!c.G().NET.ready);
  fill(c,'taken','secret1','secret1'); await until(()=>/already/.test(c.el('#stMsg').textContent));
  ok('a taken name is refused (any letter case) and the form stays',/already has the name/.test(c.el('#stMsg').textContent)&&!c.el('#stForm').hidden&&c.el('#stSubmit').disabled===false);
  fill(c,'Newbie','secret1','secret1');
  ok('a new account opens the character editor before the game starts',await until(()=>c.G().customizing())&&c.G().creating()&&!c.G().started()&&c.G().NET.user==='Newbie');
  ok('the editor opens on the Class tab, titled for creating',c.G().EDIT[c.G().edTab()].tab==='Class'&&c.el('#edTitle').textContent==='Create your hiker'&&c.el('#edDone').textContent==='Enter the world');
  const chip=name=>find(c.el('#edBody'),e=>e.textContent===name);
  ok('the editor shows the starting class as selected',chip('Sword: Warrior')&&chip('Sword: Warrior')._a['aria-pressed']===true);
  c.G().setLook('cls','archer');     // what clicking the Bow chip does
  ok('clicking Archer switches the class (the bug: it did nothing before connecting)',await until(()=>c.G().clsOf()==='archer'));
  ok('...and the chip lights up once the server confirms',await until(()=>chip('Bow: Archer')&&chip('Bow: Archer')._a['aria-pressed']===true&&chip('Sword: Warrior')._a['aria-pressed']===false));
  c.G().setLook('cls','mage'); await until(()=>c.G().clsOf()==='mage');
  ok('Mage works too',c.G().clsOf()==='mage'&&chip('Wand: Mage')._a['aria-pressed']===true);
  c.G().setLook('hair','bun'); await wait(1000);
  const me=[...c.server().players.values()].find(p=>p.user==='Newbie');
  ok('look changes reach the server while creating (before the game starts)',me&&me.look.hair==='bun'&&me.look.cls==='mage');
  c.el('#edDone').click();
  ok('Enter the world starts the game',c.G().started()&&!c.G().customizing()&&!c.G().creating());
  const session=c.ls.get('wildwood-session'); c.server().flushAll&&await c.server().flushAll(); c.stop();
  ok('the account is saved with its look and a session token',!!session&&c.accounts.DB.get('user:newbie')&&c.accounts.DB.get('user:newbie').look.hair==='bun');

  // 3. coming back on a device that has never seen this hiker: the account's look is restored
  c=await boot({accounts}); G=c.G();
  ok('a fresh browser starts with the default look',G.LOOK().hair!=='bun');
  c.el('#stLogin').click(); fill(c,'Newbie','secret1');
  ok('logging in with the password enters the game',await until(()=>c.G().started())&&c.G().NET.user==='Newbie');
  ok('the account look (hair, class) came back from the server',c.G().LOOK().hair==='bun'&&c.G().LOOK().cls==='mage'&&c.G().clsOf()==='mage');
  c.stop();

  // 4. a browser that holds a session token sees Continue as ...
  c=await boot({accounts,ls:new Map([['wildwood-session',session]])}); G=c.G();
  ok('a remembered session turns Log in into Continue as <name>',c.el('#stLogin').textContent==='Continue as Newbie'&&!c.el('#stNote').hidden);
  c.el('#stLogin').click();
  ok('Continue logs in without a password',await until(()=>c.G().started())&&c.G().NET.user==='Newbie');
  c.stop();

  // 5. no server (the claude.ai artifact, a local file): no accounts, just Play solo
  c=await boot({online:false}); G=c.G();
  ok('without a server the card offers Play solo only',c.el('#stLogin').hidden&&c.el('#stRegister').hidden&&c.el('#stGuest').hidden&&!c.el('#stSolo').hidden&&c.el('#stRoom').hidden);
  c.el('#stSolo').click();
  ok('Play solo starts the game',await until(()=>c.G().started())&&c.G().NET.mode==='solo');
  c.stop();
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
