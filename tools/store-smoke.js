// Test of the Node host's file save store (fileStore in src/node/main.js, cut out of the file and run on its own): a missing account loads as null, create() writes only for a new account,
// save() replaces a record whole, and many saves of ONE account at the same moment (a disconnect during the periodic save does this) leave a readable record that is one of them and no temp file
// behind (they used to share one temp file name: the second rename failed with ENOENT and, in the worst interleaving, a tail of the longer record could stay in the file).
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
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
