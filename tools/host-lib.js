// Helpers for tests that run the built server (dist/wildwood-server.js) as its own process: startHost (a free port, a temp data folder, testing tools off), get (HTTP), wsOpen / send / msgs / frame (a WebSocket client by hand), until, wait.
// Used by host-smoke.js and host-accounts-smoke.js. Build first (python3 build.py).
const fs=require('fs'), path=require('path'), os=require('os'), net=require('net'), http=require('http'), crypto=require('crypto'), cp=require('child_process');
const dist=path.join(__dirname,'..','dist'), exe=path.join(dist,'wildwood-server.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms=8000)=>{ const t0=Date.now(); for(;;){ const v=await f(); if(v) return v; if(Date.now()-t0>ms) return false; await wait(50); } };
const freePort=()=>new Promise(r=>{ const s=net.createServer().listen(0,'127.0.0.1',()=>{ const p=s.address().port; s.close(()=>r(p)); }); });
const get=(port,url,headers={},method='GET')=>new Promise((res,rej)=>{ const q=http.request({host:'127.0.0.1',port,path:url,method,headers,agent:false},r=>{ const b=[]; r.on('data',d=>b.push(d)); r.on('end',()=>res({status:r.statusCode,headers:r.headers,body:Buffer.concat(b)})); }); q.on('error',rej); q.end(); });
// ---- WebSocket by hand: a masked client frame, and a reader of the server's (unmasked) frames
const frame=(op,payload,fin=true)=>{ const d=Buffer.isBuffer(payload)?payload:Buffer.from(payload), n=d.length, mk=crypto.randomBytes(4);
  const head=n<126?Buffer.from([(fin?0x80:0)|op,0x80|n]):n<65536?Buffer.from([(fin?0x80:0)|op,0x80|126,n>>8,n&255]):null; if(!head) throw new Error('frame too long for the test');
  const body=Buffer.from(d); for(let i=0;i<n;i++) body[i]^=mk[i&3]; return Buffer.concat([head,mk,body]); };
function wsOpen(port){ return new Promise((res,rej)=>{
  const key=crypto.randomBytes(16).toString('base64'), s=net.connect(port,'127.0.0.1'); const c={s,frames:[],closed:false,head:''}; let buf=Buffer.alloc(0), upgraded=false;
  s.on('connect',()=>s.write('GET /ws HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: '+key+'\r\nSec-WebSocket-Version: 13\r\n\r\n'));
  s.on('data',d=>{ buf=Buffer.concat([buf,d]);
    if(!upgraded){ const i=buf.indexOf('\r\n\r\n'); if(i<0) return; c.head=buf.slice(0,i).toString(); buf=buf.slice(i+4); upgraded=true;
      c.accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'); res(c); }
    for(;;){ if(buf.length<2) break; const op=buf[0]&15; let len=buf[1]&127, off=2; if(len===126){ if(buf.length<4) break; len=buf.readUInt16BE(2); off=4; } else if(len===127){ if(buf.length<10) break; len=Number(buf.readBigUInt64BE(2)); off=10; }
      if(buf.length<off+len) break; const data=buf.slice(off,off+len); buf=buf.slice(off+len); c.frames.push({op,data}); } });
  s.on('close',()=>{ c.closed=true; }); s.on('error',e=>{ c.closed=true; if(!upgraded) rej(e); }); }); }
const msgs=c=>c.frames.filter(f=>f.op===1).map(f=>{ try{ return JSON.parse(f.data.toString()); }catch(e){ return null; } }).filter(Boolean);
const send=(c,o)=>c.s.write(frame(1,JSON.stringify(o)));

// starts the server; resolves to {port, dir, child, log(), exited(), stop(signal)}; `dir` can be given to start again on the same saves
async function startHost(o={}){
  const dir=o.dir||fs.mkdtempSync(path.join(os.tmpdir(),'wwhost-')), port=await freePort(); let log='', exited=null;
  const env=Object.assign({},process.env,{DATA_DIR:dir}); delete env.DATABASE_URL; delete env.PORT; delete env.WILDWOOD_DEV;
  const child=cp.spawn(process.execPath,[exe,'--port',String(port),'--host','127.0.0.1',...(o.dev?[]:['--no-dev'])],{env,cwd:dir});
  child.stdout.on('data',d=>log+=d); child.stderr.on('data',d=>log+=d); child.on('exit',(code,sig)=>{ exited={code,sig}; });
  const up=await until(()=>/world server running/.test(log)||exited,60000);
  const h={port,dir,child,log:()=>log,exited:()=>exited,up:!!up&&!exited,
    stop:async(sig='SIGTERM')=>{ if(!exited){ child.kill(sig); await until(()=>exited,15000); if(!exited){ try{ child.kill('SIGKILL'); }catch(e){} await until(()=>exited,5000); } } return exited; }};
  return h;
}
module.exports={fs,path,os,dist,exe,wait,until,freePort,get,frame,wsOpen,msgs,send,startHost};
