// A stub browser for the headless client tests: boots dist/wildwood.html in Node with a fake DOM, WebGL renderer and (optionally) a fake
// WebSocket wired to an in-process world server with an in-memory account store. Build first (python3 build.py); needs the three package.
//   const {bootClient}=require('./headless');
//   const c=bootClient({online:true, expose:['NET','started:()=>started']});  // names from inside the game, read with c.G()
//   c.el('#stGuest').click();   // fake elements remember their listeners: click(), requestSubmit(); ._kids = appended children, ._a = attributes
//   c.stop();                   // ends the frame loop and the server tick
//   options: online (a fake socket to a world server in this process), host:'127.0.0.1:8080' (Node's own WebSocket to a REAL server, see host-lib.js and net-client-smoke.js), page (the HTML to boot instead of dist/wildwood.html), fast, touch, lite, ls, accounts
//   bootClient({touch:true}) / ({lite:true})   // a phone (LOW: fewer plants, thin streaming slices) / light mode (LITE: the least), as the page decides them from the device and localStorage
//   bootClient({fast:true})     // a world without the map's painting, the ground colours and the villagers: ~40% quicker to be ready (start card tests)
const fs=require('fs'), path=require('path'), crypto=require('crypto'), {ROOT}=require('./load');

// children[i] of a fake element is a fake element too (the game builds some of its elements from an innerHTML string, which the stub does not parse: a remote hiker's name tag reads tag.children[0..3])
const kidsProxy=()=>new Proxy([],{get:(a,k)=>typeof k==='string'&&/^\d+$/.test(k)?(a[k]||(a[k]=makeEl())):a[k]});
function makeEl(){
  const e={_h:{},_a:{},_kids:[],children:kidsProxy(),style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},textContent:'',dataset:{},
    offsetWidth:380,offsetHeight:300,scrollTop:0,scrollHeight:0,width:0,height:0,disabled:true,hidden:true,value:'',firstChild:{style:{}},
    remove(){},focus(){},blur(){},select(){},closest(){return null},querySelectorAll:()=>[],querySelector:()=>makeEl(),
    setAttribute(k,v){ e._a[k]=v; },getAttribute(k){ return k in e._a?e._a[k]:null; },
    append(...k){ e._kids.push(...k); },prepend(...k){ e._kids.unshift(...k); },appendChild(k){ e._kids.push(k); return k; },
    addEventListener(t,f){ (e._h[t]=e._h[t]||[]).push(f); },
    fire(t,ev){ for(const f of e._h[t]||[]) f(Object.assign({target:e,currentTarget:e,preventDefault(){},stopPropagation(){}},ev)); },
    click(){ e.fire('click'); },requestSubmit(){ e.fire('submit'); },
    getBoundingClientRect(){return {left:0,top:0,width:600,height:600};},
    getContext(){ return new Proxy({},{get:(o,k)=>k in o?o[k]:(k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):(k==='createRadialGradient'||k==='createLinearGradient')?()=>({addColorStop(){}}):()=>{}),set:(o,k,v)=>{o[k]=v;return true;}}); }};
  Object.defineProperty(e,'innerHTML',{get(){ return e._html||''; },set(v){ e._html=v; e._kids.length=0; }});   // like the real DOM, assigning HTML drops the children
  return e;
}
// accounts kept in memory (what the Node host keeps in files or Postgres) with a plain sha256 "password hash"
function memoryAccounts(){
  const DB=new Map();
  const store={ load:k=>DB.get(k)||null, save:(k,r)=>{ DB.set(k,JSON.parse(JSON.stringify(r))); },
    create:(k,r)=>{ if(DB.has(k)) return false; DB.set(k,JSON.parse(JSON.stringify(r))); return true; },
    remove:k=>{ DB.delete(k); },
    users:()=>[...DB.values()].filter(r=>r.auth).map(r=>r.auth.user),
    ranks:()=>[...DB.values()].filter(r=>r.name&&r.level).map(r=>({n:r.name,l:r.level,x:r.exp,c:r.look&&r.look.cls})) };
  const sha=p=>'s:'+crypto.createHash('sha256').update(p).digest('hex');
  const auth={ hash:sha, verify:(p,h)=>h===sha(p), token:()=>crypto.randomBytes(8).toString('hex'), tokenHash:t=>'t'+t };
  return {DB,store,auth};
}
const NativeWS=global.WebSocket;   // (Node's own client; bootClient removes the global each time and puts it back for the `host` option)
function bootClient(o){
  o=o||{};
  global.THREE=require('three');
  const els={}, ls=o.ls||new Map(); let alive=true, tick=null, seq=0; const socks=new Map();
  const winH={};   // listeners the game put on window: {f, cap}; fireWin() calls them like the browser would (capture first, stop*Propagation honoured)
  const fireWin=(type,ev)=>{ let stop=false, stopAll=false;
    const e=Object.assign({code:'',key:'',repeat:false,target:{tagName:'BODY'},preventDefault(){ e.prevented=true; },stopPropagation(){ stop=true; },stopImmediatePropagation(){ stop=stopAll=true; }},ev), L=winH[type]||[];
    for(const h of L.filter(h=>h.cap)){ h.f(e); if(stopAll) return e; }
    if(!stop) for(const h of L.filter(h=>!h.cap)){ h.f(e); if(stopAll) break; }
    return e; };
  const acc=o.accounts||memoryAccounts();
  if(o.lite) ls.set('wildwood-lite','1');   // light mode (settings): LITE
  Object.defineProperty(global,'navigator',{value:{maxTouchPoints:o.touch?5:0},configurable:true,writable:true});   // touch: a phone, LOW
  Object.assign(global,{window:global,innerWidth:800,innerHeight:600,devicePixelRatio:1,addEventListener(t,f,opt){ (winH[t]=winH[t]||[]).push({f,cap:opt===true||!!(opt&&opt.capture)}); },
    location:{protocol:'http:',host:o.host||'test.local',reload(){}},
    localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>{ ls.set(k,String(v)); },removeItem:k=>{ ls.delete(k); }},
    document:{addEventListener(){},hidden:false,querySelectorAll:()=>[],getElementById:s=>els['#'+s]||(els['#'+s]=makeEl()),querySelector:s=>els[s]||(els[s]=makeEl()),
      createElement:()=>makeEl(),createTextNode:t=>({textContent:t}),body:makeEl(),pointerLockElement:null,baseURI:'http://test.local/'}});
  global.requestAnimationFrame=f=>{ if(alive) setTimeout(f,2); };
  global.showFatal=m=>console.log('FATAL',m);
  delete global.WILDWOOD_WS; delete global.WebSocket;
  if(o.host){ if(!NativeWS) throw new Error('headless host mode needs Node 22+ (a global WebSocket)'); global.WILDWOOD_WS=true; global.WebSocket=NativeWS; }   // the page as the Node host serves it, talking to a real server over a real socket
  if(o.online){
    global.WILDWOOD_WS=true;
    global.WebSocket=class{
      constructor(){ this.readyState=0; this.pid='w'+(++seq); socks.set(this.pid,this); setTimeout(()=>{ this.readyState=1; if(this.onopen) this.onopen(); },1); }
      send(d){ if(this.readyState===1&&global.__srv) global.__srv.receive(this.pid,JSON.parse(d)); }
      close(){ if(this.readyState===3) return; this.readyState=3; if(global.__srv) global.__srv.leave(this.pid); socks.delete(this.pid); if(this.onclose) this.onclose(); }
    };
  }
  const page=o.page||fs.readFileSync(path.join(ROOT,'dist','wildwood.html'),'utf8');   // (o.page: the HTML a server sent, see net-client-smoke)
  const blocks=page.split('<script>').slice(1).map(b=>b.split('</script>')[0]);
  const srvCode=blocks.find(b=>b.includes('function createWorldServer')); let main=blocks.find(b=>b.includes('function wildwoodMain'));
  if(o.fast){   // for tests of the start card and the account flow: skip what only matters to the eye (the map's painting, the ground's colours, the villagers' meshes, the plants). The world, the server and the UI stay real.
    const cut=(from,to)=>{ if(!main.includes(from)) throw new Error('headless fast mode: the game code changed, "'+from+'" is gone (update tools/headless.js)'); main=main.replace(from,to); };
    cut('function mapBuildStep(rows){','function mapBuildStep(rows){ if(1) return;');
    cut('terrainColor(x,z,h,grad(x,z),cc);','cc.setRGB(0.4,0.5,0.3);');
    cut('initMotes(); initAnimals(); initNPCs(); renderQlog();','initMotes(); initAnimals(); renderQlog();');
    cut('const NEAR_R=55, FAR_R=320;','const NEAR_R=1, FAR_R=0;');   // no plants are grown (the start card is ready as soon as the ground is)
  }
  main=main.replace(/new THREE\.WebGLRenderer\([^)]*\)/,'({setPixelRatio(){},setSize(){},shadowMap:{},setClearColor(){},render(){}})')
    .replace('function frame(){','global.__G=()=>({'+(o.expose||[]).join(',')+'});\nfunction frame(){');
  new Function(srvCode+'\nglobal.__cws=createWorldServer;\n'+main+'\nwildwoodMain();')();
  if(o.online){
    let last=Date.now();
    global.__srv=global.__cws({dev:false,snapDt:0.1,store:acc.store,auth:acc.auth,
      send(pid,msg){ const s=socks.get(pid), d=JSON.stringify(msg); if(s) setTimeout(()=>{ if(s.onmessage) s.onmessage({data:d}); },0); },   // asynchronous, like a network; a closed socket has no handler
      broadcast(msg){ const d=JSON.stringify(msg); for(const s of socks.values()) setTimeout(()=>{ if(s.onmessage) s.onmessage({data:d}); },0); },
      kick(pid){ const s=socks.get(pid); if(s) s.close(); }});
    tick=setInterval(()=>{ const n=Date.now(); global.__srv.tick((n-last)/1000); last=n; },50);
  }
  return {G:()=>global.__G(),el:s=>document.querySelector(s),els,ls,accounts:acc,server:()=>global.__srv,fireWin,
    stop(){ alive=false; if(tick) clearInterval(tick); for(const s of [...socks.values()]) { s.onclose=null; s.close(); } }};
}
module.exports={bootClient,makeEl,memoryAccounts};
