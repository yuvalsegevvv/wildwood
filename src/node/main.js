//@ Node host: serves the game page (gzip, ETag) and the music files (/audio/, cached for a year) over HTTP and runs the world server over WebSocket (no npm packages needed)
/* Usage:  node wildwood-server.js [--port 8080] [--host 0.0.0.0] [--no-dev]
   Then open http://localhost:8080 in several tabs or on several devices on your network.
   --no-dev (or the environment variable WILDWOOD_DEV=0) turns off the testing tools (set level, free items, coins).
   Hosting (Render and similar): listens on $PORT, serves the page gzip-compressed, answers GET /healthz and
   GET /status, and pings every connection every 25 s so proxies don't close idle games.
   Saves: every player's progress is stored on the server under their account code (hashed, never stored as is),
   or under their name for registered accounts (name + password, see AUTH below):
     - DATABASE_URL set (Postgres, e.g. Render Postgres): a table wildwood_players; needs the 'pg' package.
     - otherwise JSON files in DATA_DIR (default ./data). On Render's free plan the disk is wiped on every
       deploy and restart; give the service a persistent disk (DATA_DIR=/var/data) or use Postgres.
     Players' browsers keep a copy too, so a lost record is rebuilt from it the next time they join. */
const http=require('http'), crypto=require('crypto'), os=require('os'), zlib=require('zlib'), fs=require('fs'), path=require('path');
const args=process.argv.slice(2), arg=(n,d)=>{ const i=args.indexOf(n); return i>=0&&args[i+1]?args[i+1]:d; };
const PORT=+arg('--port',process.env.PORT||8080), HOST=arg('--host','0.0.0.0'), DEV=!args.includes('--no-dev')&&!/^(0|false|no|off)$/i.test(process.env.WILDWOOD_DEV||'');
const SOCKETS=new Map(); let nextId=1;
const log=(...a)=>console.log(new Date().toISOString(),...a);
/* ---- where saves go ---- */
const keyOf=acct=>crypto.createHash('sha256').update('wildwood:'+acct).digest('hex').slice(0,40);
function fileStore(dir){
  const d=path.join(dir,'players'); fs.mkdirSync(d,{recursive:true});
  return { kind:'files in '+dir,
    load(acct){ const f=path.join(d,keyOf(acct)+'.json'); try{ return JSON.parse(fs.readFileSync(f,'utf8')); }catch(e){ if(e.code==='ENOENT') return null; throw e; } },
    save(acct,rec){ const f=path.join(d,keyOf(acct)+'.json'), tmp=f+'.'+process.pid+'.tmp';
      return fs.promises.writeFile(tmp,JSON.stringify(rec)).then(()=>fs.promises.rename(tmp,f)); },
    // registration: write only if nobody has this account yet ('wx' fails when the file exists)
    create(acct,rec){ return fs.promises.writeFile(path.join(d,keyOf(acct)+'.json'),JSON.stringify(rec),{flag:'wx'}).then(()=>true,e=>{ if(e.code==='EEXIST') return false; throw e; }); },
    users(){ const out=[]; for(const n of fs.readdirSync(d)) if(n.endsWith('.json')) try{ const r=JSON.parse(fs.readFileSync(path.join(d,n),'utf8')); if(r&&r.auth) out.push(r.auth.user); }catch(_){} return out; },
    count(){ try{ return fs.readdirSync(d).filter(n=>n.endsWith('.json')).length; }catch(_){ return 0; } } };
}
function pgStore(url){
  const { Pool }=require('pg');
  /* Free hosted Postgres (Neon, Supabase) suspends when idle and drops idle connections: close ours before
     they do (idleTimeoutMillis), give a waking database 15 s to answer, and never let a dropped idle client
     crash the server (without an 'error' listener pg rethrows it). */
  const pool=new Pool({connectionString:url,ssl:/localhost|127\.0\.0\.1/.test(url)?false:{rejectUnauthorized:false},max:5,idleTimeoutMillis:60000,connectionTimeoutMillis:15000});
  pool.on('error',e=>log('postgres idle client error',e&&e.message));
  // Create the table once; if that fails (database still waking, network blip) the next query tries again.
  let ready=null;
  const table=()=>ready||(ready=pool.query('CREATE TABLE IF NOT EXISTS wildwood_players (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())').catch(e=>{ ready=null; throw e; }));
  table().catch(e=>log('postgres not ready yet:',e&&e.message));
  return { kind:'postgres', pool,
    load(acct){ return table().then(()=>pool.query('SELECT data FROM wildwood_players WHERE id=$1',[keyOf(acct)])).then(r=>r.rows.length?r.rows[0].data:null); },
    save(acct,rec){ return table().then(()=>pool.query('INSERT INTO wildwood_players (id,data,updated_at) VALUES ($1,$2,now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()',[keyOf(acct),rec])); },
    create(acct,rec){ return table().then(()=>pool.query('INSERT INTO wildwood_players (id,data,updated_at) VALUES ($1,$2,now()) ON CONFLICT (id) DO NOTHING RETURNING id',[keyOf(acct),rec])).then(r=>r.rows.length>0); },
    users(){ return table().then(()=>pool.query("SELECT data->'auth'->>'user' AS u FROM wildwood_players WHERE data ? 'auth'")).then(r=>r.rows.map(x=>x.u)); },
    count(){ return table().then(()=>pool.query('SELECT count(*)::int AS n FROM wildwood_players')).then(r=>r.rows[0].n); } };
}
let STORE;
if(process.env.DATABASE_URL){ try{ STORE=pgStore(process.env.DATABASE_URL); }catch(e){ console.error('DATABASE_URL is set but Postgres could not be used ('+e.message+'). Run "npm install" so the pg package is there. Falling back to files.'); } }
if(!STORE) STORE=fileStore(process.env.DATA_DIR||path.join(process.cwd(),'data'));
/* Account passwords: scrypt with a random salt per account, stored as 'salt:hash' (hex); session tokens are
   random and only their sha256 is stored. The world server calls these (see src/server/accounts.js). */
const AUTH={
  hash(pass){ const salt=crypto.randomBytes(16).toString('hex');
    return new Promise((ok,no)=>crypto.scrypt(pass,salt,32,(e,k)=>e?no(e):ok(salt+':'+k.toString('hex')))); },
  verify(pass,stored){ const [salt,hex]=String(stored||'').split(':'); if(!salt||!hex) return Promise.resolve(false);
    return new Promise((ok,no)=>crypto.scrypt(pass,salt,32,(e,k)=>e?no(e):ok(crypto.timingSafeEqual(k,Buffer.from(hex,'hex'))))); },
  token(){ return crypto.randomBytes(24).toString('hex'); },
  tokenHash(t){ return crypto.createHash('sha256').update('wildwood-session:'+t).digest('hex'); }
};
function frame(str){
  const data=Buffer.from(str,'utf8'), n=data.length;
  const head=n<126?Buffer.from([0x81,n]):n<65536?Buffer.from([0x81,126,n>>8,n&255]):(()=>{ const b=Buffer.alloc(10); b[0]=0x81; b[1]=127; b.writeBigUInt64BE(BigInt(n),2); return b; })();
  return Buffer.concat([head,data]);
}
function sendRaw(sock,str){ if(!sock.destroyed) sock.write(frame(str)); }
const world=createWorldServer({
  dev:DEV, snapDt:0.1, store:STORE, auth:AUTH, log,
  kick(pid){ const s=SOCKETS.get(pid); if(s){ SOCKETS.delete(pid); setTimeout(()=>{ try{ s.end(Buffer.from([0x88,0])); }catch(_){} },300); } },
  send(pid,msg){ const s=SOCKETS.get(pid); if(s) sendRaw(s,JSON.stringify(msg)); }
});
let last=Date.now();
setInterval(()=>{ const now=Date.now(); world.tick((now-last)/1000); last=now; },50);
const page=PAGE.replace('</head>','<script>window.WILDWOOD_WS=true;</script>\n</head>'), pageGz=zlib.gzipSync(page,{level:9});
const pageTag='"'+crypto.createHash('sha1').update(page).digest('hex').slice(0,20)+'"';
/* Music files (dist/audio/, made by build.py; the page fetches them from /audio/ when a theme first plays). Their names hold a hash of
   their content, so a file never changes under its name: browsers may keep it for a year and never ask again (one download per client).
   Only names found in the folder at start are served, so no path can leave it. Already compressed audio: no gzip. */
const AUDIO_DIR=process.env.AUDIO_DIR||path.join(__dirname,'audio'), AUDIO=new Map(), AUDIO_MIME={'.m4a':'audio/mp4','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
try{ for(const f of fs.readdirSync(AUDIO_DIR)){ const file=path.join(AUDIO_DIR,f), st=fs.statSync(file); if(st.isFile()) AUDIO.set(f,{file,size:st.size,type:AUDIO_MIME[path.extname(f).toLowerCase()]||'application/octet-stream'}); } }
catch(e){ log('no audio folder at '+AUDIO_DIR+': the game plays its generated music'); }
function serveAudio(req,res){
  let name; try{ name=decodeURIComponent(req.url.slice(7).split('?')[0]); }catch(_){ name=''; }
  const a=AUDIO.get(name); if(!a){ res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200,{'content-type':a.type,'content-length':a.size,'cache-control':'public, max-age=31536000, immutable'});
  if(req.method==='HEAD'){ res.end(); return; }
  const rs=fs.createReadStream(a.file); rs.on('error',()=>res.destroy()); rs.pipe(res);
}
const server=http.createServer((req,res)=>{
  if(req.url==='/'||req.url.startsWith('/?')||req.url==='/index.html'){
    // no-cache + ETag: the browser asks every visit but gets a bodiless 304 unless the game was updated
    // (includes: a proxy may send the tag weakened, W/"...")
    if((req.headers['if-none-match']||'').includes(pageTag)){ res.writeHead(304,{'etag':pageTag,'cache-control':'no-cache'}); res.end(); return; }
    const gz=/\bgzip\b/.test(req.headers['accept-encoding']||'');
    res.writeHead(200,Object.assign({'content-type':'text/html; charset=utf-8','cache-control':'no-cache','etag':pageTag,'vary':'accept-encoding'},gz?{'content-encoding':'gzip'}:{}));
    res.end(gz?pageGz:page); return; }
  if(req.url.startsWith('/audio/')&&(req.method==='GET'||req.method==='HEAD')){ serveAudio(req,res); return; }
  if(req.url==='/healthz'){ res.writeHead(200,{'content-type':'text/plain'}); res.end('ok'); return; }
  if(req.url==='/status'){ Promise.resolve(STORE.count()).catch(()=>null).then(n=>{ res.writeHead(200,{'content-type':'application/json'}); res.end(JSON.stringify({players:world.players.size,monsters:world.monsters.length,day:world.state.day,saves:STORE.kind,accounts:n})); }); return; }
  res.writeHead(404); res.end('not found');
});
server.on('upgrade',(req,sock)=>{
  if(!req.url.startsWith('/ws')){ sock.destroy(); return; }
  const key=req.headers['sec-websocket-key']; if(!key){ sock.destroy(); return; }
  const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
  sock.setNoDelay(true);
  const pid='p'+(nextId++); SOCKETS.set(pid,sock);
  let buf=Buffer.alloc(0), frag=[]; sock.lastSeen=Date.now();
  const close=()=>{ if(SOCKETS.delete(pid)){ world.leave(pid); console.log(new Date().toISOString(),pid,'left, players:',world.players.size); } };
  sock.on('data',chunk=>{
    sock.lastSeen=Date.now();
    buf=Buffer.concat([buf,chunk]);
    while(buf.length>=2){
      const fin=buf[0]&0x80, op=buf[0]&15, masked=buf[1]&0x80; let len=buf[1]&127, off=2;
      if(len===126){ if(buf.length<4) return; len=buf.readUInt16BE(2); off=4; }
      else if(len===127){ if(buf.length<10) return; len=Number(buf.readBigUInt64BE(2)); off=10; }
      if(len>1<<20){ sock.destroy(); return; }
      const mk=masked?4:0; if(buf.length<off+mk+len) return;
      const mask=masked?buf.slice(off,off+4):null, data=Buffer.from(buf.slice(off+mk,off+mk+len));
      if(mask) for(let i=0;i<data.length;i++) data[i]^=mask[i&3];
      buf=buf.slice(off+mk+len);
      if(op===8){ sock.end(); close(); return; }
      if(op===9){ sock.write(Buffer.concat([Buffer.from([0x8a,data.length]),data])); continue; }
      if(op===1||op===0){ frag.push(data); if(fin){ const txt=Buffer.concat(frag).toString('utf8'); frag=[]; try{ world.receive(pid,JSON.parse(txt)); }catch(e){} } }
    }
  });
  sock.on('close',close); sock.on('error',close);
  console.log(new Date().toISOString(),pid,'joined');
});
// keep connections alive through hosting proxies, and drop sockets that stopped answering
setInterval(()=>{ for(const [pid,s] of SOCKETS){ if(s.destroyed){ SOCKETS.delete(pid); world.leave(pid); continue; } if(Date.now()-(s.lastSeen||0)>70000){ s.destroy(); continue; } s.write(Buffer.from([0x89,0])); } },25000);
// Render (and most hosts) stop the server with SIGTERM on deploys: write everyone's progress first
let stopping=false;
function shutdown(sig){ if(stopping) return; stopping=true; log(sig+': saving',world.players.size,'players'); Promise.race([world.flushAll(),new Promise(r=>setTimeout(r,8000))]).then(()=>{ log('saved, bye'); process.exit(0); }); }
process.on('SIGTERM',()=>shutdown('SIGTERM')); process.on('SIGINT',()=>shutdown('SIGINT'));
server.listen(PORT,HOST,()=>{
  const ips=Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address);
  console.log('Wildwood world server running'+(DEV?' (testing tools on)':'')+', saves: '+STORE.kind);
  console.log('  this computer:  http://localhost:'+PORT);
  ips.forEach(ip=>console.log('  your network:   http://'+ip+':'+PORT));
});
