// Test of the Shared (claude.ai room) transport's message splitting, straight from src/game/net/transport.js (chunkSend, unchunk, CHUNKS), against a mock room that enforces the 4 KB limit.
// A room message is at most 4 KB; the host's snapshots and a joiner's hello (saved gear: 2-7 KB) are bigger, so they travel as numbered parts. Checks: small messages go whole, big ones are
// split under the limit and come back equal in any order and interleaved with other senders', a duplicate or a lost part does not corrupt the next message, and an ordinary client message that
// happens to have a `k` field (atk{k:'basic'}, potion{k}) is never taken for a part. No build, no browser.
const fs=require('fs'), path=require('path');
const {SRC}=require('./load');
const src=fs.readFileSync(path.join(SRC,'game','net','transport.js'),'utf8');
const a=src.indexOf('function chunkSend'), b=src.indexOf('function netEmitError');
if(a<0||b<a){ console.log('FAIL could not find chunkSend / unchunk in game/net/transport.js (the test cuts them out of the file)'); process.exit(1); }
let now=1e6; const realDate=Date;
const mk=()=>{ const sent=[]; const room={emit(topic,obj){ const wire=JSON.stringify(obj); if(wire.length>=4096) return Promise.reject(Object.assign(new Error('message too large'),{code:'too_large'})); sent.push({topic,obj:JSON.parse(wire)}); return Promise.resolve(); }};
  const fns=new Function('Date','netEmitError',src.slice(a,b)+';return {chunkSend,unchunk,CHUNKS};')({now:()=>now},e=>{ throw e; }); return {sent,room,...fns}; };
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
let seed=11; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
const blob=n=>{ let s=''; while(s.length<n) s+=String.fromCharCode(32+Math.floor(rnd()*95))+(rnd()<0.01?'😀é"\\\n':''); return s.slice(0,n); };
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

{ const T=mk(); const m={t:'hello',name:'x',save:{level:3}}; T.chunkSend(T.room,'c',m);
  ok('a small message is sent whole, as it is',T.sent.length===1&&JSON.stringify(T.sent[0].obj)===JSON.stringify(m)&&T.unchunk(T.sent[0].obj)===T.sent[0].obj); }
for(const size of [3700,5000,12000,60000,250000]){
  const T=mk(); const m={t:'hello',acct:'ab'.repeat(16),name:'Hiker',look:{hair:blob(300)},save:{level:30,gear:{inv:blob(size)}}};
  T.chunkSend(T.room,'c',m);
  const wires=T.sent.map(s=>JSON.stringify(s.obj).length), got=[]; let out=null;
  for(const s of shuffle([...T.sent])){ const r=T.unchunk(s.obj); if(r) out=r; got.push(r); }
  ok(`a ${size} character message is split under 4 KB and rebuilt equal from parts in any order`,T.sent.length>1&&Math.max(...wires)<3800&&JSON.stringify(out)===JSON.stringify(m)&&got.filter(Boolean).length===1,`${T.sent.length} parts, largest ${Math.max(...wires)} B`);
}
{ const T=mk(); const A={t:'hello',x:blob(9000)}, B={t:'hello',x:blob(9500)}; T.chunkSend(T.room,'c',A); T.chunkSend(T.room,'c',B);
  const out=[]; for(const s of shuffle([...T.sent])){ const r=T.unchunk(s.obj); if(r) out.push(r); }
  ok('two senders\' messages interleaved come out as the two originals',out.length===2&&out.some(o=>o.x===A.x)&&out.some(o=>o.x===B.x)); }
{ const T=mk(); const A={t:'hello',x:blob(9000)}; T.chunkSend(T.room,'c',A);
  const out=[]; for(const s of [T.sent[0],T.sent[0],...T.sent]){ const r=T.unchunk(s.obj); if(r) out.push(r); }
  ok('a part that arrives twice is counted once',out.length===1&&out[0].x===A.x); }
{ const T=mk(); const A={t:'hello',x:blob(9000)}, B={t:'chat',text:blob(8000)}; T.chunkSend(T.room,'c',A); const lost=T.sent.splice(0,T.sent.length); lost.pop();   // the last part of A never arrives
  for(const s of lost) T.unchunk(s.obj); now+=6000; T.chunkSend(T.room,'c',B); const out=[]; for(const s of T.sent){ const r=T.unchunk(s.obj); if(r) out.push(r); }
  ok('a message that lost a part is dropped after 5 s and does not spoil the next one',out.length===1&&out[0].text===B.text&&T.CHUNKS.size===0,'left over: '+T.CHUNKS.size); }
{ const T=mk(); const msgs=[{t:'atk',k:'basic',tg:7,face:1.2,aim:[0,0,1]},{t:'atk',k:'skill',tg:7,face:1.2,aim:[0,0,1]},{t:'potion',k:2},{t:'pos',p:[1,2,3,0,0,0]},{t:'sellres',id:'iron',n:4},{t:'brew',id:'heal',n:2},{t:'mq',a:'talk',id:'W1',i:3}];
  ok('ordinary messages with k, i, n or p fields pass through untouched',msgs.every(m=>T.unchunk(m)===m)); }
{ const T=mk(); let bad=0;
  for(let i=0;i<150;i++){ const m={t:'x',n:i,v:blob(Math.floor(rnd()*30000)),o:{a:[blob(50),null,1e9,-0.5,true]}}; T.chunkSend(T.room,'s',{to:'*',m});
    const parts=shuffle(T.sent.splice(0,T.sent.length)); let out=null; for(const s of parts){ const r=T.unchunk(s.obj); if(r) out=r; }
    if(!out||JSON.stringify(out)!==JSON.stringify({to:'*',m})) bad++; }
  ok('150 random messages up to 30,000 characters (quotes, escapes, emoji) round-trip exactly',bad===0,bad+' broken'); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
