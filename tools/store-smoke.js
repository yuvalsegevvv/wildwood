// Test of the Node host's save stores (fileStore and pgStore in src/node/main.js, cut out of the file and run on their own; pgStore against a fake `pg` whose queries take random times): a missing account loads as null, create() writes only for a new account,
// save() replaces a record whole, and many saves of ONE account at the same moment (a disconnect during the periodic save does this) leave a readable record that is one of them and no temp file
// behind (they used to share one temp file name: the second rename failed with ENOENT and, in the worst interleaving, a tail of the longer record could stay in the file). For Postgres: the writes of one
// account commit in the order they were asked (the pool ran them side by side, and a slow older save could replace the newer one), a failed write does not stop the ones behind it, and accounts do not wait for each other.
const fs=require('fs'), path=require('path'), crypto=require('crypto'), os=require('os');
const src=fs.readFileSync(path.join(__dirname,'..','src','node','main.js'),'utf8'), a=src.indexOf('let tmpSeq'), b=src.indexOf('function pgStore');
if(a<0||b<a){ console.log('FAIL could not find fileStore in src/node/main.js (the test cuts it out of the file)'); process.exit(1); }
const {fileStore}=new Function('fs','path','crypto','process',src.slice(src.indexOf('const keyOf='),b)+';return {fileStore};')(fs,path,crypto,process);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wwstore-')), st=fileStore(dir), d=path.join(dir,'players');
  ok('a missing account loads as null',(await st.load('nobody'))===null);
  ok('create() writes a new account and refuses an existing one',(await st.create('u1',{v:1,n:1}))===true&&(await st.create('u1',{v:1,n:2}))===false&&(await st.load('u1')).n===1);
  await st.save('u1',{v:1,n:3}); ok('save() replaces the record whole',JSON.stringify(await st.load('u1'))==='{"v":1,"n":3}');
  let bad=0, thrown=0;
  for(let round=0;round<150;round++){
    const recs=[...Array(6)].map((_,i)=>({v:1,name:'x',gear:{inv:'a'.repeat(200+(i%2?Math.floor(Math.random()*60000):0)+i)}}));
    try{ await Promise.all(recs.map(r=>st.save('acct',r))); }catch(e){ thrown++; continue; }
    try{ const got=await st.load('acct'); if(!recs.some(r=>JSON.stringify(r)===JSON.stringify(got))) bad++; }catch(e){ bad++; }
  }
  ok('150 rounds of 6 saves of one account at the same moment: none fails, every result is one of the records, whole',bad===0&&thrown===0,bad+' unreadable or mixed, '+thrown+' rounds with a failed save');
  ok('no temp file is left behind',fs.readdirSync(d).filter(n=>n.endsWith('.tmp')).length===0);
  fs.rmSync(dir,{recursive:true,force:true});
  // ---- Postgres, against a fake pool: a query takes the time the record asks for (rec.ms), and commits (sets the row) when it ends; rec.fail makes it throw
  const c=src.indexOf('let STORE;'), pgSrc=src.slice(b,c);
  const rows=new Map(), commits=[]; let inflight=0, peak=0;
  class FakePool{ on(){} query(sql,params){
    if(/CREATE TABLE/.test(sql)) return Promise.resolve({rows:[]});
    const [id,rec]=params, ms=rec&&rec.ms||0; inflight++; peak=Math.max(peak,inflight);
    return new Promise((res,rej)=>setTimeout(()=>{ inflight--; if(rec&&rec.fail) return rej(new Error('db down'));
      const had=rows.has(id); if(/DO NOTHING/.test(sql)){ if(!had){ rows.set(id,rec); commits.push(rec.n); } return res({rows:had?[]:[{id}]}); }
      rows.set(id,rec); commits.push(rec.n); res({rows:[]}); },ms)); } }
  const {pgStore}=new Function('require','log','keyOf','process',pgSrc+';return {pgStore};')(()=>({Pool:FakePool}),()=>{},k=>'k:'+k,{env:{}});
  const pg=pgStore('postgres://x/y');
  // the older save is slow, the newer one fast: side by side the newer would commit first and the older would then overwrite it
  await Promise.all([pg.save('a',{n:1,ms:40}),pg.save('a',{n:2,ms:1}),pg.save('a',{n:3,ms:20}),pg.save('a',{n:4,ms:1})]);
  ok('pg: four saves of one account commit in the order they were asked, the last one stays',commits.join()==='1,2,3,4'&&rows.get('k:a').n===4,'commit order '+commits.join()+', stored '+rows.get('k:a').n);
  ok('pg: a save of another account does not wait behind a slow one',await (async()=>{ const t0=Date.now(); const slow=pg.save('b',{n:5,ms:120}); await pg.save('c',{n:6,ms:1}); const quick=Date.now()-t0<100; await slow; return quick; })());
  commits.length=0; let err=null;
  const rs=await Promise.allSettled([pg.save('d',{n:7,ms:5}),pg.save('d',{n:8,fail:1}),pg.save('d',{n:9,ms:1})]);
  ok('pg: a failed write rejects for its own caller only; the ones behind it still run',rs[0].status==='fulfilled'&&rs[1].status==='rejected'&&rs[2].status==='fulfilled'&&rows.get('k:d').n===9,rs.map(r=>r.status).join());
  commits.length=0; const created=await Promise.all([pg.create('e',{n:10,ms:15}),pg.create('e',{n:11,ms:1})]);
  ok('pg: create() keeps its answer (true for the first, false for the second) and the first record stays',created[0]===true&&created[1]===false&&rows.get('k:e').n===10,JSON.stringify(created));
  for(let r=0;r<40;r++){ const k='f'+r, n=[...Array(5)].map((_,i)=>i); await Promise.all(n.map(i=>pg.save(k,{n:i,ms:Math.floor(Math.random()*8)}))); if(rows.get('k:'+k).n!==4){ err=k; break; } }
  ok('pg: 40 rounds of 5 saves with random delays: the last asked is the last stored',err===null,err);
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
