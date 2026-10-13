// Test of the deployed server for real: starts dist/wildwood-server.js as its own process (files in a temp folder, testing tools off, a free port) and talks to it over HTTP and raw WebSocket frames.
// HTTP: /healthz, /status, the page (brotli, gzip or plain, the same bytes; an ETag and a 304; the lean page: no world server inside), the music route (found, HEAD, unknown names, a path that tries to leave the folder), a 404.
// WebSocket: the handshake, hello -> welcome and snapshots, a ping answered with a pong, a message in two fragments, garbage that must not end the connection, a control frame too long, a flood of messages that ends the
// connection and leaves the server up, the player gone from /status after a disconnect. Then SIGTERM: the process saves the player's progress to the folder and exits by itself.
// Build first (python3 build.py).   Usage: node tools/host-smoke.js
const fs=require('fs'), path=require('path'), os=require('os'), net=require('net'), http=require('http'), zlib=require('zlib'), crypto=require('crypto'), cp=require('child_process');
const dist=path.join(__dirname,'..','dist'), exe=path.join(dist,'wildwood-server.js');
if(!fs.existsSync(exe)){ console.log('FAIL dist/wildwood-server.js is not built (python3 build.py)'); process.exit(1); }
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
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
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wwhost-')), port=await freePort(); let log='';
  const env=Object.assign({},process.env,{DATA_DIR:dir}); delete env.DATABASE_URL; delete env.PORT; delete env.WILDWOOD_DEV;
  const child=cp.spawn(process.execPath,[exe,'--port',String(port),'--host','127.0.0.1','--no-dev'],{env,cwd:dir}); let exited=null;
  child.stdout.on('data',d=>log+=d); child.stderr.on('data',d=>log+=d); child.on('exit',(code,sig)=>{ exited={code,sig}; });
  const up=await until(()=>/world server running/.test(log)||exited,60000);
  ok('the server starts and listens',up&&!exited&&/saves: files/.test(log),exited?('exited '+JSON.stringify(exited)+'\n'+log.slice(-600)):'');
  if(!up||exited){ fs.rmSync(dir,{recursive:true,force:true}); console.log('stopped: the server did not start'); process.exit(1); }
  try{
    // ---- HTTP
    let r=await get(port,'/healthz'); ok('/healthz answers ok',r.status===200&&r.body.toString()==='ok');
    r=await get(port,'/status'); let st={}; try{ st=JSON.parse(r.body.toString()); }catch(e){}
    ok('/status: nobody online, the monsters are there, saves go to files',r.status===200&&st.players===0&&st.monsters>1000&&/^files/.test(st.saves),JSON.stringify(st));
    await until(async()=>(await get(port,'/',{'accept-encoding':'br'})).headers['content-encoding']==='br',40000);   // (brotli at the best setting is made in the background after the start: gzip is sent until it is ready)
    const br=await get(port,'/',{'accept-encoding':'gzip, br'}), gz=await get(port,'/',{'accept-encoding':'gzip'}), plain=await get(port,'/',{});
    ok('the page is sent brotli to a browser that takes it, gzip to one that takes gzip, plain to the rest',br.headers['content-encoding']==='br'&&gz.headers['content-encoding']==='gzip'&&!plain.headers['content-encoding']&&br.status===200&&/html/.test(br.headers['content-type']||''),[br,gz,plain].map(x=>x.headers['content-encoding']||'plain').join('/'));
    let page=null, same=false; try{ page=zlib.brotliDecompressSync(br.body); same=page.equals(zlib.gunzipSync(gz.body))&&page.equals(plain.body); }catch(e){}
    ok('the three encodings are the same page, and the compressed ones are smaller (brotli smallest)',same&&br.body.length<gz.body.length&&gz.body.length<plain.body.length/2,'plain '+plain.body.length+', gzip '+gz.body.length+', brotli '+br.body.length);
    const html=plain.body.toString();
    ok('it is the game page: the client is in it and the world server is not (the Node host has its own)',/function wildwoodMain/.test(html)&&!/function updateMonstersS\(/.test(html)&&/no world server of its own/.test(html));
    const tag=br.headers.etag, again=await get(port,'/',{'if-none-match':tag,'accept-encoding':'br'}), weak=await get(port,'/',{'if-none-match':'W/'+tag});
    ok('the ETag gives a bodiless 304 (also when a proxy weakens it); a wrong one gets the page',!!tag&&again.status===304&&again.body.length===0&&weak.status===304&&(await get(port,'/',{'if-none-match':'"nope"'})).status===200);
    const tracks=fs.existsSync(path.join(dist,'audio'))?fs.readdirSync(path.join(dist,'audio')).filter(f=>/\.m4a$/.test(f)):[];
    if(tracks.length){ const a=await get(port,'/audio/'+tracks[0]), h=await get(port,'/audio/'+tracks[0],{},'HEAD');
      ok('a music file: served whole, kept for a year (immutable), HEAD has no body',a.status===200&&a.body.length===fs.statSync(path.join(dist,'audio',tracks[0])).size&&/immutable/.test(a.headers['cache-control']||'')&&/max-age=31536000/.test(a.headers['cache-control']||'')&&h.status===200&&h.body.length===0&&+h.headers['content-length']===a.body.length); }
    else ok('a music file: served whole (skipped: dist/audio is empty)',true);
    const bad=await Promise.all(['/audio/nothing.m4a','/audio/..%2fwildwood-server.js','/audio/%2e%2e%2f%2e%2e%2fetc%2fpasswd','/audio/%zz','/audio/'].map(u=>get(port,u)));
    ok('unknown music names, a path out of the folder and a broken escape are all a plain 404',bad.every(x=>x.status===404),bad.map(x=>x.status).join());
    ok('anything else is a 404',(await get(port,'/secret')).status===404&&(await get(port,'/../package.json')).status===404);
    // ---- WebSocket
    const acct=crypto.randomBytes(16).toString('hex');
    const c=await wsOpen(port);
    ok('the WebSocket handshake answers 101 with the right accept key',/^HTTP\/1\.1 101/.test(c.head)&&c.head.includes('Sec-WebSocket-Accept: '+c.accept));
    send(c,{t:'hello',acct,name:'HostSmoke',look:{},save:{level:3,exp:0}});
    const hi=await until(()=>msgs(c).some(m=>m.t==='welcome')&&msgs(c).some(m=>m.t==='snap'),15000);
    ok('hello gets a welcome and then snapshots',!!hi,JSON.stringify(msgs(c).map(m=>m.t)).slice(0,120));
    st=JSON.parse((await get(port,'/status')).body.toString()); ok('/status counts the player',st.players===1,'players '+st.players);
    c.s.write(frame(9,'abc')); const pong=await until(()=>c.frames.find(f=>f.op===10));
    ok('a ping is answered with a pong that repeats its payload',pong&&pong.data.toString()==='abc');
    const text='hello from two fragments '+crypto.randomBytes(3).toString('hex'), j=JSON.stringify({t:'chat',text});
    c.s.write(Buffer.concat([frame(1,j.slice(0,10),false),frame(0,j.slice(10),true)]));
    ok('a message sent in two fragments arrives whole (the chat line comes back in a snapshot)',!!await until(()=>c.frames.some(f=>f.op===1&&f.data.toString().includes(text)),5000));
    c.s.write(frame(1,'{not json')); c.s.write(frame(1,'null')); c.s.write(frame(1,'"a string"')); c.s.write(frame(1,'[1,2]')); c.s.write(frame(1,JSON.stringify({t:'__proto__'})));
    const n0=c.frames.length; await wait(600);
    ok('garbage messages are ignored: the connection stays open and the snapshots keep coming',!c.closed&&c.frames.length>n0,(c.frames.length-n0)+' frames in 0.6 s');
    const c2=await wsOpen(port); c2.s.write(frame(9,Buffer.alloc(126,65)));
    ok('a ping longer than the 125 bytes a control frame may carry ends that connection (the pong could not be written right)',!!await until(()=>c2.closed,3000)&&!c2.frames.some(f=>f.op===10));
    const c3=await wsOpen(port); send(c3,{t:'hello',acct:crypto.randomBytes(16).toString('hex'),name:'Flooder',look:{},save:{level:1}}); await until(()=>msgs(c3).some(m=>m.t==='welcome'),15000);
    const one=frame(1,JSON.stringify({t:'pos',p:[0,0,0,0,0,0]})); c3.s.write(Buffer.concat([...Array(6000)].map(()=>one)));
    ok('a flood of 6000 messages in one go ends that connection',!!await until(()=>c3.closed,8000));
    ok('...and the server is still up, and the other player still gets snapshots',(await get(port,'/healthz')).status===200&&!c.closed&&await (async()=>{ const k=c.frames.length; await wait(500); return c.frames.length>k; })());
    st=JSON.parse((await get(port,'/status')).body.toString()); ok('/status: only the first player is left (the two cut off are gone)',await until(async()=>JSON.parse((await get(port,'/status')).body.toString()).players===1,4000),'players '+st.players);
    // ---- shutdown: SIGTERM saves everyone's progress, then the process ends by itself
    child.kill('SIGTERM');
    ok('SIGTERM: the server saves and exits by itself',!!await until(()=>exited,15000)&&exited.code===0&&/saved, bye/.test(log),exited?JSON.stringify(exited):'still running');
    const files=fs.existsSync(path.join(dir,'players'))?fs.readdirSync(path.join(dir,'players')).filter(f=>f.endsWith('.json')):[];
    let rec=null; for(const f of files){ try{ const r=JSON.parse(fs.readFileSync(path.join(dir,'players',f),'utf8')); if(r.name==='HostSmoke') rec=r; }catch(e){} }
    ok('...and the player who was online has a saved record (name, level)',!!rec&&rec.level>=1,files.length+' record(s)');
    ok('the server logged no error',!/error|exception/i.test(log.replace(/postgres|ECONNRESET/gi,'')),(log.match(/.*(error|exception).*/i)||[''])[0].slice(0,200));
  }catch(e){ ok('the test ran to the end',false,e&&e.stack?e.stack.split('\n').slice(0,3).join(' | '):String(e)); }
  try{ child.kill('SIGKILL'); }catch(e){}
  await wait(200); fs.rmSync(dir,{recursive:true,force:true});
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
