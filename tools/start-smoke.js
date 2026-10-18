// Headless test of the start card and the first steps of an account (src/game/ui/start-screen.js, account.js, character-editor.js), talking to a
// real world server in this process through a fake WebSocket. Build first (python3 build.py). Prints PASS/FAIL lines.
// Usage: node tools/start-smoke.js
const {bootClient,memoryAccounts}=require('./headless');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms)=>{ for(let t=0;t<(ms||30000);t+=20){ if(f()) return true; await wait(20); } return false; };
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const EXPOSE=['NET','netTick','started:()=>started','customizing:()=>customizing','creating:()=>creating','canStart:()=>canStart','clsOf','setLook','LOOK:()=>LOOK','edTab:()=>edTab','EDIT','CHAR_MODELS','setSub:(t,u)=>{ edTab=t; edSub[t]=u; renderEditor(); }'];
const find=(e,f)=>{ if(f(e)) return e; for(const k of e._kids||[]){ const r=find(k,f); if(r) return r; } return null; };
function fill(c,user,pass,pass2){ c.el('#stUser').value=user; c.el('#stPass').value=pass; c.el('#stPass2').value=pass2===undefined?'':pass2; c.el('#stForm').requestSubmit(); }
async function boot(o){ const c=bootClient(Object.assign({online:true,fast:true,expose:EXPOSE},o)); await until(()=>c.G().canStart()); return c; }

(async()=>{
  const accounts=memoryAccounts();
  accounts.DB.set('user:taken',{v:1,name:'Taken',look:{sex:'female',hair:'bun'},level:1,exp:0,gear:{},auth:{user:'Taken',pass:accounts.auth.hash('secret1'),tokens:[]}});

  // 1. the card on the online server: three ways in, and Play as guest goes straight into the world
  let c=await boot({accounts}), G=c.G();
  ok('the card offers Log in, Register and Play as guest (no solo, no world picker)',!c.el('#stLogin').hidden&&!c.el('#stRegister').hidden&&!c.el('#stGuest').hidden&&c.el('#stSolo').hidden&&c.el('#stRoom').hidden);
  ok('a new visitor\'s one button to press is Play now (a guest); Log in is not the primary one',c.el('#stGuest').textContent==='Play now'&&c.el('#stLogin').textContent==='Log in'&&!c.el('#stGuestNote').hidden);
  ok('the guest and submit buttons wait for the world',c.el('#stGuest').disabled===false&&c.el('#stSubmit').disabled===false);
  c.el('#stGuest').click();
  ok('a brand-new guest makes a character first: the editor opens in creating mode, on the signature characters',await until(()=>c.G().customizing())&&c.G().creating()&&!c.G().started()&&c.G().EDIT[c.G().edTab()].tab==='Presets');
  c.el('#edDone').click();
  ok('...and Enter the world starts the game as a guest',c.G().started()&&!c.G().NET.user&&c.G().NET.mode==='ws');
  // the server stops answering (no message for 8 s): a message that stays, with a Reconnect button, instead of a frozen game that ignores everything
  G=c.G(); ok('while the server answers there is no such message',c.el('#kicked').hidden!==false);
  G.NET.lastMsg=performance.now()-20000; G.netTick(0.016);
  ok('a server that stopped answering puts up a Reconnect message that stays',c.el('#kicked').hidden===false&&/stopped answering/.test(c.el('#kickedText').textContent)&&!c.G().NET.ready);
  c.stop();
  // the connection is closed (the server was stopped or restarted)
  c=await boot({accounts,ls:new Map([['wildwood-look-v1',JSON.stringify({sex:'female',hair:'bun'})]])}); c.el('#stGuest').click();
  ok('a browser that already has a hiker goes straight into the world (no editor)',await until(()=>c.G().started())&&!c.G().customizing()); G=c.G();
  ok('the game is running before the connection drops',G.NET.ready&&c.el('#kicked').hidden!==false);
  G.NET.ws.close();
  ok('a closed connection puts up the Reconnect message at once (it was only a toast that faded)',c.el('#kicked').hidden===false&&/Lost the connection/.test(c.el('#kickedText').textContent)&&!c.G().NET.ready);
  c.stop();

  // 2. login errors, registration errors, then a new account: the editor opens (there is no class row: the class is the weapon you hold)
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
  ok('the editor opens on the signature characters, titled for creating',c.G().EDIT[c.G().edTab()].tab==='Presets'&&c.el('#edTitle').textContent==='Create your hiker'&&c.el('#edDone').textContent==='Enter the world');
  const chip=name=>find(c.el('#edBody'),e=>e.textContent===name);
  ok('there is no Class tab or class row in the editor, and nothing in it resets your level (class follows the weapon; a new hiker holds the sword)',!c.G().EDIT.some(t=>t.tab==='Class')&&!c.G().EDIT.some(t=>t.subs.some(u=>u.rows.some(r=>r.k==='cls'||r.type==='info')))&&c.G().clsOf()==='warrior');
  { // the signature outfits' pieces in the editor's rows (src/game/outfits, docs/areas/character-ui.md): every slot lists every outfit's item, picking one writes that slot, a whole set puts all seven on
    const tab=(n,u)=>{ const i=c.G().EDIT.findIndex(t=>t.tab===n); c.G().setSub(i,Math.max(0,c.G().EDIT[i].subs.findIndex(x=>x.name===u))); }, tile=name=>find(c.el('#edBody'),e=>String(e.className).includes('ctile')&&(e._a['aria-label']||'').startsWith(name)), gold=name=>{ const e=tile(name); return e&&String(e.className).includes('sig')?e:null; };
    const cl=[['Top','Plumb coat'],['Bottom','Footlight skirt'],['Shoes','March boots'],['Hat','Lantern crown'],['Weapon','Stage trim']].map(([u,n])=>{ tab('Clothes',u); return gold(n); }); tab('Face','Hair'); const hr=gold('Gale long'); tab('Face','Beard & marks'); const fc=gold('Scar & braid beard');
    ok('the Clothes, Hair and Beard & marks rows list the outfits\' pieces (a top, bottoms, shoes, a hat, a weapon style, a hair style, a face style)',cl.every(Boolean)&&!!hr&&!!fc);
    c.G().setLook('top','corvin'); c.G().setLook('hat','marigold'); c.G().setLook('hair','sorrel'); c.G().setLook('faceItem','torgeir'); c.G().setLook('bottom','marigold'); c.G().setLook('shoes','dunstan'); c.G().setLook('weaponItem','tansy'); const m=c.G().LOOK();
    ok('picking pieces from different sets writes each slot and leaves the set name alone',m.top==='corvin'&&m.hat==='marigold'&&m.hair==='sorrel'&&m.faceItem==='torgeir'&&m.bottom==='marigold'&&m.shoes==='dunstan'&&m.weaponItem==='tansy'&&m.model==='base');
    tab('Clothes','Top'); ok('the tile of a worn piece is lit, the base item\'s is not, and the colour row now offers Designed colours (it recolours the piece)',tile('Plumb coat')._a['aria-pressed']===true&&tile('T-shirt')._a['aria-pressed']===false&&!!find(c.el('#edBody'),e=>e.textContent==='Designed colours'));
    c.G().setLook('model','dunstan'); const w=c.G().LOOK(); c.G().setLook('model','base'); const b=c.G().LOOK();
    ok('a whole set puts all seven pieces on and \'None\' takes them off again',['top','bottom','shoes','hat','hair','faceItem','weaponItem'].every(k=>w[k]==='dunstan')&&w.model==='dunstan'&&['faceItem','weaponItem'].every(k=>b[k]==='')&&b.top!=='dunstan'&&b.hair!=='dunstan'&&b.model==='base');
    // the Signature tab: one tap sets up the character (gender, sliders, all seven pieces, designed colours), and a worn piece can be recoloured
    tab('Presets','Signature'); const names=['Tansy','Torgeir','Sazanka','Corvin','Sorrel','Ambrose','Dunstan','Marigold','Nephra','Sabir','Ogden','Ottoline'];
    ok('the Signature tab lists the twelve characters and a way to take the outfit off',names.every(n=>gold(n))&&!!tile('Take the outfit off'));
    c.G().setLook('tintTop',0x8a2f2f); c.G().setLook('tintHat',0x2f4a6b); gold('Tansy').onclick();   // (a tap on Tansy's chip)
    const tn=c.G().LOOK(), st=tn.sex==='female'&&c.G().LOOK().model==='tansy';
    ok('tapping a character sets up the look: its gender, all seven pieces, its recommended sliders and the designed colours (the colours picked before are cleared)',st&&['top','bottom','shoes','hat','hair','faceItem','weaponItem'].every(k=>tn[k]==='tansy')&&['tintTop','tintHat','tintBottom','tintShoes','tintHair','tintFace','tintWeapon'].every(k=>tn[k]===-1)&&Object.entries(c.G().CHAR_MODELS.tansy.setups[0].v).every(([k,v])=>Math.abs(tn[k]-v)<0.005));
    gold('Dunstan').onclick(); ok('...and a man\'s set switches the body to a man\'s',c.G().LOOK().sex==='male'&&c.G().LOOK().model==='dunstan'&&c.G().LOOK().top==='dunstan');
    tab('Clothes','Top'); const sw=()=>find(c.el('#edBody'),e=>e.textContent==='Designed colours');
    ok('a worn piece\'s colour rows recolour it: a Designed colours chip (lit) and the swatches write tintTop; the weapon colour row appears with a weapon style',!!sw()&&sw()._a['aria-pressed']===true&&find(c.el('#edBody'),e=>String(e.className).includes('swatches')&&e._kids&&e._kids[0]&&/tintWeapon|weapon|color 1/.test(e._kids[0]._a['aria-label']||''))&&c.G().EDIT.find(t=>t.tab==='Clothes').subs.some(u=>u.rows.some(r=>r.k==='tintWeapon')));
    c.G().setLook('tintTop',0x2f4a6b); tab('Clothes','Top'); ok('...picking a colour lights the swatch and unlights Designed colours; Designed colours puts the original back',c.G().LOOK().tintTop===0x2f4a6b&&sw()._a['aria-pressed']===false&&(c.G().setLook('tintTop',-1),c.G().LOOK().tintTop===-1));
    c.G().setLook('model','base'); const bb=c.G().LOOK(); ok('taking the outfit off restores plain clothes and clears the colours',bb.model==='base'&&bb.top!=='dunstan'&&bb.tintHat===-1);
    c.G().setLook('hair','short'); c.G().setLook('hat','ranger'); c.G().setLook('top','jacket'); }
  c.G().setLook('hair','bun');
  const meNow=()=>[...c.server().players.values()].find(p=>p.user==='Newbie'); await until(()=>{ const q=meNow(); return q&&q.look.hair==='bun'; },8000);   // (the look is sent 0.6 s after the last change: wait for it rather than a fixed second, which a busy machine misses)
  const me=meNow();
  ok('look changes reach the server while creating (before the game starts)',me&&me.look.hair==='bun');
  c.el('#edDone').click();
  ok('Enter the world starts the game',c.G().started()&&!c.G().customizing()&&!c.G().creating());
  const session=c.ls.get('wildwood-session'); c.server().flushAll&&await c.server().flushAll(); c.stop();
  ok('the account is saved with its look and a session token',!!session&&c.accounts.DB.get('user:newbie')&&c.accounts.DB.get('user:newbie').look.hair==='bun');

  // 3. coming back on a device that has never seen this hiker: the account's look is restored
  c=await boot({accounts}); G=c.G();
  ok('a fresh browser starts with the default look',G.LOOK().hair!=='bun');
  c.el('#stLogin').click(); fill(c,'Newbie','secret1');
  ok('logging in with the password enters the game',await until(()=>c.G().started())&&c.G().NET.user==='Newbie');
  ok('the account look (hair) came back from the server',c.G().LOOK().hair==='bun'&&c.G().clsOf()==='warrior');
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
  c.el('#stSolo').click(); await until(()=>c.G().customizing()); c.el('#edDone').click();
  ok('Play solo starts the game (after making a character)',await until(()=>c.G().started())&&c.G().NET.mode==='solo');
  c.stop();
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
