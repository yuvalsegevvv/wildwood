//@ Node host: serves the game page over HTTP and runs the world server over WebSocket (no npm packages needed)
/* Usage:  node wildwood-server.js [--port 8080] [--host 0.0.0.0] [--no-dev]
   Then open http://localhost:8080 in several tabs or on several devices on your network.
   --no-dev (or the environment variable WILDWOOD_DEV=0) turns off the testing tools (set level, free items, coins).
   Hosting (Render and similar): listens on $PORT, serves the page gzip-compressed, answers GET /healthz and
   GET /status, and pings every connection every 25 s so proxies don't close idle games.
   Saves: every player's progress is stored on the server under their account code (hashed, never stored as is):
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
    count(){ try{ return fs.readdirSync(d).filter(n=>n.endsWith('.json')).length; }catch(_){ return 0; } } };
}
function pgStore(url){
  const { Pool }=require('pg');
  const pool=new Pool({connectionString:url,ssl:/localhost|127\.0\.0\.1/.test(url)?false:{rejectUnauthorized:false},max:5});
  const ready=pool.query('CREATE TABLE IF NOT EXISTS wildwood_players (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
  return { kind:'postgres', pool,
    load(acct){ return ready.then(()=>pool.query('SELECT data FROM wildwood_players WHERE id=$1',[keyOf(acct)])).then(r=>r.rows.length?r.rows[0].data:null); },
    save(acct,rec){ return ready.then(()=>pool.query('INSERT INTO wildwood_players (id,data,updated_at) VALUES ($1,$2,now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()',[keyOf(acct),rec])); },
    count(){ return ready.then(()=>pool.query('SELECT count(*)::int AS n FROM wildwood_players')).then(r=>r.rows[0].n); } };
}
let STORE;
if(process.env.DATABASE_URL){ try{ STORE=pgStore(process.env.DATABASE_URL); }catch(e){ console.error('DATABASE_URL is set but Postgres could not be used ('+e.message+'). Run "npm install" so the pg package is there. Falling back to files.'); } }
if(!STORE) STORE=fileStore(process.env.DATA_DIR||path.join(process.cwd(),'data'));
function frame(str){
  const data=Buffer.from(str,'utf8'), n=data.length;
  const head=n<126?Buffer.from([0x81,n]):n<65536?Buffer.from([0x81,126,n>>8,n&255]):(()=>{ const b=Buffer.alloc(10); b[0]=0x81; b[1]=127; b.writeBigUInt64BE(BigInt(n),2); return b; })();
  return Buffer.concat([head,data]);
}
function sendRaw(sock,str){ if(!sock.destroyed) sock.write(frame(str)); }
const world=createWorldServer({
  dev:DEV, snapDt:0.1, store:STORE, log,
  kick(pid){ const s=SOCKETS.get(pid); if(s){ SOCKETS.delete(pid); setTimeout(()=>{ try{ s.end(Buffer.from([0x88,0])); }catch(_){} },300); } },
  send(pid,msg){ const s=SOCKETS.get(pid); if(s) sendRaw(s,JSON.stringify(msg)); },
  broadcast(msg){ const str=JSON.stringify(msg), f=frame(str); for(const s of SOCKETS.values()) if(!s.destroyed) s.write(f); }
});
let last=Date.now();
setInterval(()=>{ const now=Date.now(); world.tick((now-last)/1000); last=now; },50);
const page=PAGE.replace('</head>','<script>window.WILDWOOD_WS=true;</script>\n</head>'), pageGz=zlib.gzipSync(page,{level:9});
const server=http.createServer((req,res)=>{
  if(req.url==='/'||req.url.startsWith('/?')||req.url==='/index.html'){
    const gz=/\bgzip\b/.test(req.headers['accept-encoding']||'');
    res.writeHead(200,Object.assign({'content-type':'text/html; charset=utf-8','cache-control':'no-cache','vary':'accept-encoding'},gz?{'content-encoding':'gzip'}:{}));
    res.end(gz?pageGz:page); return; }
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
