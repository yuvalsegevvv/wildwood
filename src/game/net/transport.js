//@ Connections to the world server: solo (server in this tab), shared room (one player's tab hosts), WebSocket (node server)
/* NET.send(msg) goes to the server whatever the transport. The server's replies arrive in netHandle(msg).
   - solo:  createWorldServer() runs in this tab; messages pass through JSON so the protocol stays honest.
   - room:  claude.ai's live room. Everyone with the page open joins the room 'wildwood-world'; one tab is
            elected host and runs the server for everyone (lowest join time wins; ties by peer label).
            Clients send on topic 'c', the host answers on topic 's' (split into chunks under the 4 KB limit),
            player positions travel in presence at 10 per second. If the host leaves, a new host is elected
            and everyone rejoins it with their own save.
   - ws:    when the page is served by `node wildwood-server.js`, it connects to that server over WebSocket. */
var NET={mode:null,pid:null,ready:false,dev:true,host:false,send:null,room:null,server:null,loop:null,players:1,onReady:null,onStatus:null};
function netSend(msg){ if(NET.send) NET.send(msg); }
const WORLD_ROOM='wildwood-world';
function runServer(srv,snapDt){
  let last=performance.now();
  NET.loop=setInterval(()=>{ const n=performance.now(); srv.tick((n-last)/1000); last=n; },50);
}
function stopServer(){ if(NET.loop){ clearInterval(NET.loop); NET.loop=null; } NET.server=null; NET.host=false; }
function deliver(msg){ queueMicrotask(()=>netHandle(msg)); }
/* ---- solo ---- */
function startSolo(){
  NET.mode='solo'; const pid='you';
  const srv=createWorldServer({dev:true,snapDt:0.05,
    send(to,msg){ if(to===pid) deliver(JSON.parse(JSON.stringify(msg))); },
    broadcast(msg){ deliver(JSON.parse(JSON.stringify(msg))); }});
  NET.server=srv; NET.host=true;
  NET.send=msg=>srv.receive(pid,JSON.parse(JSON.stringify(msg)));
  runServer(srv);
  netHello();
}
/* ---- node server over WebSocket ---- */
function startWS(){
  NET.mode='ws';
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');
    NET.ws=ws;
    ws.onopen=()=>{ NET.send=msg=>{ if(ws.readyState===1) ws.send(JSON.stringify(msg)); }; netHello(); resolve(); };
    ws.onmessage=e=>{ try{ netHandle(JSON.parse(e.data)); }catch(err){ console.error(err); } };
    ws.onerror=()=>reject(new Error('Could not reach the world server.'));
    ws.onclose=()=>{ if(NET.ready&&!NET.kicked){ NET.ready=false; netLost('Lost the connection to the world server. Reload the page to reconnect.'); } };
  });
}
/* ---- claude.ai shared room ---- */
function chunkSend(room,topic,obj){
  const s=JSON.stringify(obj);
  if(s.length<3600) return room.emit(topic,obj).catch(netEmitError);
  const id=Math.random().toString(36).slice(2,8); let size=2400, parts=[];
  for(;;){ parts=[]; for(let i=0;i<s.length;i+=size) parts.push(s.slice(i,i+size)); if(parts.every(p=>JSON.stringify({k:id,i:0,n:parts.length,p,to:obj.to}).length<3800)) break; size=Math.floor(size*0.7); }
  parts.forEach((p,i)=>room.emit(topic,{k:id,i,n:parts.length,p,to:obj.to}).catch(netEmitError));
}
const CHUNKS=new Map();
function unchunk(d){
  if(!d||d.k===undefined) return d;
  let c=CHUNKS.get(d.k); if(!c){ c={n:d.n,got:0,parts:[],t:Date.now()}; CHUNKS.set(d.k,c); }
  if(c.parts[d.i]===undefined){ c.parts[d.i]=d.p; c.got++; }
  for(const [k,v] of CHUNKS) if(Date.now()-v.t>5000) CHUNKS.delete(k);
  if(c.got<c.n) return null;
  CHUNKS.delete(d.k); try{ return JSON.parse(c.parts.join('')); }catch(_){ return null; }
}
function netEmitError(e){ if(e&&e.code==='not_permitted') netLost('You need contributor (or editor) access to this page to play in the shared world. Solo still works.'); }
async function startRoom(name){
  NET.mode='room';
  if(!(window.claude&&window.claude.use)) throw new Error('Shared worlds work inside the Claude app or claude.ai.');
  status('Connecting to the shared world…');
  const lobby=await window.claude.use('room');
  if(!lobby) throw new Error('This page can\'t reach the shared world here. Solo still works.');
  const room=await lobby.join(WORLD_ROOM); NET.room=room;
  const since=Date.now(); NET.since=since;
  await room.presence({ww:1,name,since,host:false});
  let me=null, hostPeer=null, lastHostSeen=0;
  const findMe=()=>{ const p=room.peers().find(x=>x.sameTab); if(p) me=p.peer; return me; };
  const byAge=(a,b)=>((a.presence.since||0)-(b.presence.since||0))||(a.peer<b.peer?-1:1);
  // messages from the host
  room.on('s',msg=>{
    if(NET.host||msg.sameTab||msg.peer!==hostPeer) return;
    const d=unchunk(msg.data); if(!d) return;
    if(d.to==='*'||d.to===me) netHandle(d.m);
  });
  // messages from clients (only the host listens)
  room.on('c',msg=>{ if(!NET.host||msg.sameTab||!NET.server) return; try{ NET.server.receive(msg.peer,msg.data); }catch(e){ console.error(e); } });
  room.onPeers(ch=>{
    if(NET.host&&NET.server) for(const p of ch.left) NET.server.leave(p.peer);
    if(!NET.host&&hostPeer&&ch.left.some(p=>p.peer===hostPeer)){ hostPeer=null; NET.ready=false; status('The host left. Finding a new host…'); toast('The host left; moving the world to another player','bad'); }
  });
  const becomeHost=()=>{
    NET.host=true; hostPeer=me; status('You are hosting this world.');
    const srv=createWorldServer({dev:true,snapDt:0.125,
      send(to,msg){ if(to===me) deliver(JSON.parse(JSON.stringify(msg))); else chunkSend(room,'s',{to,m:msg}); },
      broadcast(msg){ deliver(JSON.parse(JSON.stringify(msg))); chunkSend(room,'s',{to:'*',m:msg}); }});
    NET.server=srv;
    NET.send=msg=>srv.receive(me,JSON.parse(JSON.stringify(msg)));
    let last=performance.now();
    NET.loop=setInterval(()=>{
      for(const p of room.peers()){ if(p.sameTab||!p.presence||!Array.isArray(p.presence.p)) continue; if(!srv.players.has(p.peer)) continue; srv.setPos(p.peer,p.presence.p); }
      const n=performance.now(); srv.tick((n-last)/1000); last=n;
    },50);
    room.presence({host:true});
    netHello();
  };
  const joinHost=peer=>{
    hostPeer=peer; NET.host=false; status('Joining the world hosted by another player…');
    NET.send=msg=>room.emit('c',msg).catch(netEmitError);
    netHello();
  };
  // election: every 1.5 s, check who hosts; the oldest page hosts when nobody does
  const elect=()=>{
    if(!findMe()) return;
    const ww=room.peers().filter(p=>p.presence&&p.presence.ww).sort(byAge);
    const hosts=ww.filter(p=>p.presence.host);
    if(NET.host){
      const older=hosts.find(p=>p.peer!==me&&byAge(p,ww.find(x=>x.peer===me)||p)<0);
      if(older){ stopServer(); room.presence({host:false}); toast('Another player was already hosting; joining their world',''); joinHost(older.peer); }
      return;
    }
    if(hostPeer&&hosts.some(p=>p.peer===hostPeer)){ lastHostSeen=Date.now(); return; }
    if(hosts.length){ joinHost(hosts[0].peer); return; }
    if(Date.now()-since<2500) return;             // give others a moment to answer first
    if(ww[0]&&ww[0].peer===me) becomeHost();
  };
  NET.elect=setInterval(elect,1500); setTimeout(elect,2600);
}
function status(text){ if(NET.onStatus) NET.onStatus(text); }
function netLost(text){ toast(text,'bad'); status(text); }
