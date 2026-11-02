// Headless test of player shops (src/server/pshop.js): who may trade, equipment only, escrow, buying, stale offers. Usage: node tools/pshop-smoke.js
const {loadServer}=require('./load'), {memoryAccounts}=require('./headless');
const inbox={}, {store,auth}=memoryAccounts();
const {api:W,x:N}=loadServer({dev:false,store,auth,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); },broadcast(){}},['VIL']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const wait=()=>new Promise(r=>setTimeout(r,20));
const evs=(pid,name)=>{ const out=[]; for(const m of inbox[pid]||[]) if(m.t==='snap') for(const e of m.ev||[]) if(e[0]===name&&e[1]===pid) out.push(e); return out; };
const tick=async()=>{ for(let i=0;i<3;i++){ W.tick(0.1); await wait(); } };
const S=(p,m)=>W.receive(p,Object.assign({t:'pshop'},m));
(async()=>{
  W.join('a',{acct:'a'.repeat(32),name:'Ann',look:{cls:'warrior'},save:{level:20}}); W.join('b',{acct:'b'.repeat(32),name:'Bob',look:{cls:'mage'},save:{level:20}}); await wait();
  const A=W.players.get('a'), B=W.players.get('b');
  for(const q of [A,B]){ q.user='x'+q.name; q.x=0; q.z=0; }   // registered
  // (stand in the home village)
  const V=N.VIL; if(V){ for(const q of [A,B]){ q.x=V.x; q.z=V.z; } }
  const wid=A.gear.inv.find(id=>/^(sword|bow|staff)/.test(id))||A.gear.inv[0];
  A.gear.inv.push('sword1','sword1'); A.gear.coins=0; B.gear.coins=500;
  S('a',{a:'add',id:'sword1',price:100}); await tick();
  ok('a registered level 20 hiker can list',A.gear.psh&&A.gear.psh.length===1,JSON.stringify(A.gear.psh));
  A.gear.mats.x=0; S('a',{a:'add',id:'constructor',price:5}); S('a',{a:'add',id:'notanitem',price:5}); S('a',{a:'add',id:'sword1',price:-5});
  ok('junk, bad prices refused',A.gear.psh.length===1);
  S('a',{a:'open'}); S('b',{a:'browse'}); await tick();
  { const l=evs('b','pshl').pop(); ok('the open shop shows to others',l&&l[2][0]&&l[2][0][0]==='Ann',JSON.stringify(l)); }
  S('b',{a:'buy',name:'Ann',i:0,id:'sword1',price:99}); ok('a stale price is refused',B.gear.coins===500);
  const n0=B.gear.inv.filter(x=>x==='sword1').length;
  S('b',{a:'buy',name:'Ann',i:0,id:'sword1',price:100}); await tick();
  ok('buying moves coins and the item',B.gear.coins===400&&A.gear.coins===100&&B.gear.inv.filter(x=>x==='sword1').length===n0+1&&A.gear.psh.length===0);
  ok('an emptied shop closes',!A.pshOpen);
  S('b',{a:'buy',name:'Ann',i:0,id:'sword1',price:100}); ok('buying from a closed shop does nothing',B.gear.coins===400);
  A.level=5; S('a',{a:'add',id:'sword1',price:10}); ok('level 10 or below cannot list',A.gear.psh.length===0); A.level=20;
  A.user=undefined; S('a',{a:'add',id:'sword1',price:10}); ok('a guest cannot list',A.gear.psh.length===0);
  console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();
