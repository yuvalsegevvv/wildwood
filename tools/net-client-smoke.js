// End to end over a real socket: the page the server sends (headless, tools/headless.js `host` and `page` options: Node's own WebSocket) plays on the built server running as its own process (tools/host-lib.js), the way a browser plays on the Render deploy.
// The start card of a page served by the Node host, Play as guest, the roster and snapshots arriving, walking (a second, raw WebSocket client sees the hiker move), chat both ways, Register through the card (scrypt
// on the real host) and Log in with it, and a server that dies under the open game (the Reconnect message). The pieces are covered one by one elsewhere (start-smoke with a fake socket, host-smoke with raw frames);
// this is the join between them.   Build first (python3 build.py).   Usage: node tools/net-client-smoke.js
const {fs,wait,until,get,wsOpen,msgs,send,startHost}=require('./host-lib'), {bootClient}=require('./headless'), crypto=require('crypto');
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const EXPOSE=['NET','netTick','started:()=>started','customizing:()=>customizing','creating:()=>creating','canStart:()=>canStart','P','PL','CHAT','REMOTES','MONS','getH'];
const ready=async(H,o)=>{ const html=(await get(H.port,'/')).body.toString();   // the page the server itself sends (the lean one: no world server inside), not dist/wildwood.html
  const c=bootClient(Object.assign({host:'127.0.0.1:'+H.port,page:html,fast:true,expose:EXPOSE},o)); await until(()=>c.G().canStart(),90000); return c; };
function fill(c,user,pass,pass2){ c.el('#stUser').value=user; c.el('#stPass').value=pass; c.el('#stPass2').value=pass2===undefined?'':pass2; c.el('#stForm').requestSubmit(); }
(async()=>{
  const H=await startHost(), dir=H.dir; ok('the server starts',H.up); if(!H.up){ console.log(H.log().slice(-500)); process.exit(1); }
  const clients=[]; let B=null;
  try{
    // someone already in the world, over a raw socket: the observer
    B=await wsOpen(H.port); send(B,{t:'hello',acct:crypto.randomBytes(16).toString('hex'),name:'Observer',look:{},save:{level:1}}); await until(()=>msgs(B).some(m=>m.t==='welcome'),15000);
    const bPid=(msgs(B).find(m=>m.t==='welcome')||{}).pid;
    // ---- the card, as the Node host serves the page
    let c=await ready(H); clients.push(c);
    ok('the card offers Log in, Register and Play as guest and no solo / shared (it is a page of the Node host)',!c.el('#stLogin').hidden&&!c.el('#stRegister').hidden&&!c.el('#stGuest').hidden&&c.el('#stSolo').hidden&&c.el('#stRoom').hidden);
    c.el('#stGuest').click();
    ok('Play as guest: the game starts, connected over a real WebSocket',await until(()=>c.G().started(),60000)&&c.G().NET.ready&&c.G().NET.mode==='ws'&&!c.G().NET.user);
    let G=c.G();
    ok('the roster of monsters arrives (the server has 1187)',await until(()=>c.G().MONS.length>1000,15000),c.G().MONS.length+' monsters');
    ok('the observer who was already there is in the world as another hiker',await until(()=>[...c.G().REMOTES.values()].some(r=>r.name==='Observer'),8000));
    ok('...and the observer was told about the new hiker',await until(()=>JSON.stringify(msgs(B)).includes('pjoin'),8000));
    // ---- walking: the observer sees the hiker move
    const rowOf=()=>{ const snaps=msgs(B).filter(m=>m.t==='snap'); for(let i=snaps.length-1;i>=0;i--){ const r=(snaps[i].pl||[]).find(r=>r[0]!==bPid); if(r) return r; } return null; };
    await until(()=>rowOf(),8000); const r0=rowOf(); G=c.G();
    ok('the observer sees the hiker where the hiker stands',!!r0&&Math.hypot(r0[1]-G.P.x,r0[3]-G.P.z)<4,r0&&('row '+r0[1]+','+r0[3]+' vs '+G.P.x.toFixed(1)+','+G.P.z.toFixed(1)));
    const x0=G.P.x; for(let i=0;i<8;i++){ G.P.x+=1.2; G.P.y=G.getH(G.P.x,G.P.z); await wait(110); }
    await wait(500); const r1=rowOf();
    ok('after walking 9.6 m east the observer sees the hiker there',!!r1&&Math.abs(r1[1]-(x0+9.6))<3&&Math.abs(r1[1]-r0[1])>5,r1&&('x '+r1[1]+' (was '+r0[1]+'), the hiker is at '+c.G().P.x.toFixed(1)));
    // ---- chat both ways
    const hello='hello from the page '+crypto.randomBytes(2).toString('hex'), reply='and from the socket '+crypto.randomBytes(2).toString('hex');
    c.G().NET.send({t:'chat',text:hello});
    ok('what the hiker says reaches the observer',!!await until(()=>JSON.stringify(msgs(B).filter(m=>m.t==='snap')).includes(hello),6000));
    send(B,{t:'chat',text:reply});
    ok('what the observer says appears in the hiker\'s chat log',!!await until(()=>c.G().CHAT.lines.some(l=>(l.el.textContent||'').includes(reply)||JSON.stringify(l.el._kids||[]).includes(reply)),6000),c.G().CHAT.lines.length+' lines');
    // ---- the server dies under the open game
    const before=c.el('#kicked').hidden;
    await H.stop('SIGKILL');
    ok('a server that dies puts up the Reconnect message',before!==false&&!!await until(()=>c.el('#kicked').hidden===false&&!c.G().NET.ready,8000),c.el('#kickedText').textContent);
    c.stop(); B.s.destroy();
    // ---- registering through the card, then logging in with the account (a new process, the same saves)
    const H2=await startHost({dir}); ok('the server starts again on the same saves',H2.up); if(!H2.up) throw new Error(H2.log().slice(-300));
    c=await ready(H2); clients.push(c);
    c.el('#stRegister').click(); fill(c,'NetAnna','secret1','secret1');
    ok('Register through the card: the account is made and the character editor opens for it',await until(()=>c.G().customizing()&&c.G().creating()&&c.G().NET.user==='NetAnna',30000),c.el('#stMsg').textContent);
    await wait(400); c.stop();
    c=await ready(H2); clients.push(c);
    c.el('#stLogin').click(); fill(c,'netanna','secret1');
    ok('Log in with the account (any case): straight into the game, as that account',await until(()=>c.G().started()&&c.G().NET.user==='NetAnna',30000),c.el('#stMsg').textContent);
    c.stop();
    c=await ready(H2); clients.push(c);
    c.el('#stLogin').click(); fill(c,'NetAnna','not-the-password'); await until(()=>c.el('#stMsg').textContent,15000);
    ok('a wrong password stays on the card with the server\'s answer',c.el('#stMsg').textContent==='Wrong password.'&&!c.G().started());
    c.stop();
    ok('the server logged no error',!/error|exception/i.test((H.log()+H2.log()).replace(/postgres|ECONNRESET/gi,'')),((H.log()+H2.log()).match(/.*(error|exception).*/i)||[''])[0].slice(0,200));
    await H2.stop('SIGKILL');
  }catch(e){ ok('the test ran to the end',false,e&&e.stack?e.stack.split('\n').slice(0,4).join(' | '):String(e)); }
  for(const c of clients) try{ c.stop(); }catch(e){}
  try{ if(B) B.s.destroy(); }catch(e){} await H.stop('SIGKILL'); await wait(200);
  fs.rmSync(dir,{recursive:true,force:true});
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
