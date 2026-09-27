//@ Node host: serves the game page over HTTP and runs the world server over WebSocket (no npm packages needed)
/* Usage:  node wildwood-server.js [--port 8080] [--host 0.0.0.0] [--no-dev]
   Then open http://localhost:8080 in several tabs or on several devices on your network.
   --no-dev turns off the testing tools (set level, free items, coins). */
const http=require('http'), crypto=require('crypto'), os=require('os');
const args=process.argv.slice(2), arg=(n,d)=>{ const i=args.indexOf(n); return i>=0&&args[i+1]?args[i+1]:d; };
const PORT=+arg('--port',process.env.PORT||8080), HOST=arg('--host','0.0.0.0'), DEV=!args.includes('--no-dev');
const SOCKETS=new Map(); let nextId=1;
function frame(str){
  const data=Buffer.from(str,'utf8'), n=data.length;
  const head=n<126?Buffer.from([0x81,n]):n<65536?Buffer.from([0x81,126,n>>8,n&255]):(()=>{ const b=Buffer.alloc(10); b[0]=0x81; b[1]=127; b.writeBigUInt64BE(BigInt(n),2); return b; })();
  return Buffer.concat([head,data]);
}
function sendRaw(sock,str){ if(!sock.destroyed) sock.write(frame(str)); }
const world=createWorldServer({
  dev:DEV, snapDt:0.1,
  send(pid,msg){ const s=SOCKETS.get(pid); if(s) sendRaw(s,JSON.stringify(msg)); },
  broadcast(msg){ const str=JSON.stringify(msg), f=frame(str); for(const s of SOCKETS.values()) if(!s.destroyed) s.write(f); }
});
let last=Date.now();
setInterval(()=>{ const now=Date.now(); world.tick((now-last)/1000); last=now; },50);
const page=PAGE.replace('</head>','<script>window.WILDWOOD_WS=true;</script>\n</head>');
const server=http.createServer((req,res)=>{
  if(req.url==='/'||req.url.startsWith('/?')||req.url==='/index.html'){ res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}); res.end(page); return; }
  if(req.url==='/status'){ res.writeHead(200,{'content-type':'application/json'}); res.end(JSON.stringify({players:world.players.size,monsters:world.monsters.length,day:world.state.day})); return; }
  res.writeHead(404); res.end('not found');
});
server.on('upgrade',(req,sock)=>{
  if(!req.url.startsWith('/ws')){ sock.destroy(); return; }
  const key=req.headers['sec-websocket-key']; if(!key){ sock.destroy(); return; }
  const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
  sock.setNoDelay(true);
  const pid='p'+(nextId++); SOCKETS.set(pid,sock);
  let buf=Buffer.alloc(0), frag=[];
  const close=()=>{ if(SOCKETS.delete(pid)){ world.leave(pid); console.log(new Date().toISOString(),pid,'left, players:',world.players.size); } };
  sock.on('data',chunk=>{
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
server.listen(PORT,HOST,()=>{
  const ips=Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address);
  console.log('Wildwood world server running'+(DEV?' (testing tools on)':''));
  console.log('  this computer:  http://localhost:'+PORT);
  ips.forEach(ip=>console.log('  your network:   http://'+ip+':'+PORT));
});
