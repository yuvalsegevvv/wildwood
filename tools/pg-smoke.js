// Test of the production save path for real: the built server (dist/wildwood-server.js, as its own process) with DATABASE_URL set, against a real PostgreSQL. A guest plays and is saved to the table, an account registers,
// the process is stopped and started again, and the account logs in from the database alone (no files). Looks into the table itself: ids are hashes, the password is hashed, the guest code that registered holds {movedTo}.
// Where the database comes from: WILDWOOD_TEST_PG (a connection string; the table wildwood_players is emptied first, so never a real database), else a throwaway cluster started in a temp folder from the PostgreSQL
// binaries found in /usr/lib/postgresql/*/bin or the PATH (as the postgres user when run as root). With neither it prints SKIP and exits 0. Needs the pg package (npm install) and a build (python3 build.py).
// Usage: node tools/pg-smoke.js
const {fs,path,os,wait,until,get,wsOpen,msgs,send,startHost}=require('./host-lib'), cp=require('child_process'), crypto=require('crypto');
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
let Pool; try{ Pool=require('pg').Pool; }catch(e){ console.log('SKIP the pg package is not installed (npm install)'); process.exit(0); }
const isRoot=process.getuid&&process.getuid()===0;
function findBin(name){ try{ for(const v of fs.readdirSync('/usr/lib/postgresql').sort().reverse()){ const f='/usr/lib/postgresql/'+v+'/bin/'+name; if(fs.existsSync(f)) return f; } }catch(e){} try{ return cp.execSync('which '+name,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||null; }catch(e){ return null; } }
async function startCluster(){
  const initdb=findBin('initdb'), pgctl=findBin('pg_ctl'); if(!initdb||!pgctl) return null;
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wwpgsmoke-')), port=40000+Math.floor(Math.random()*20000), as=isRoot?['runuser','-u','postgres','--']:[];
  if(isRoot) fs.chownSync(dir,+cp.execSync('id -u postgres',{encoding:'utf8'}),+cp.execSync('id -g postgres',{encoding:'utf8'}));
  const run=(args,opt)=>cp.spawnSync(as.length?as[0]:args[0],[...(as.length?as.slice(1):[]),...args.slice(as.length?0:1)],Object.assign({encoding:'utf8'},opt));
  const a=run([initdb,'-D',dir+'/data','-A','trust']); if(a.status!==0){ console.log('SKIP could not create a database cluster: '+(a.stderr||a.stdout||'').split('\n')[0]); fs.rmSync(dir,{recursive:true,force:true}); return null; }
  const b=run([pgctl,'-D',dir+'/data','-o','-p '+port+' -k '+dir+' -c listen_addresses=127.0.0.1 -c fsync=off','-l',dir+'/log','-w','start']); if(b.status!==0){ console.log('SKIP could not start the database: '+(b.stderr||b.stdout||'').split('\n')[0]); fs.rmSync(dir,{recursive:true,force:true}); return null; }
  return {url:'postgres://postgres@127.0.0.1:'+port+'/postgres',stop(){ run([pgctl,'-D',dir+'/data','-m','immediate','stop']); fs.rmSync(dir,{recursive:true,force:true}); }};
}
const code=()=>crypto.randomBytes(16).toString('hex'), last=(c,t)=>msgs(c).filter(m=>m.t===t).pop();
async function join(port,hello){ const c=await wsOpen(port); send(c,Object.assign({t:'hello',acct:code(),name:'Walker',look:{},save:{level:1}},hello)); await until(()=>msgs(c).some(m=>m.t==='welcome'||m.t==='authfail'),15000); return c; }
(async()=>{
  let cluster=null, url=process.env.WILDWOOD_TEST_PG;
  if(!url){ cluster=await startCluster(); if(!cluster){ if(!process.exitCode) console.log('SKIP no PostgreSQL to test against (set WILDWOOD_TEST_PG, or install the PostgreSQL server binaries)'); process.exit(0); } url=cluster.url; }
  const pool=new Pool({connectionString:url,max:2}); let H=null, H2=null;
  try{
    await pool.query('DROP TABLE IF EXISTS wildwood_players');
    H=await startHost({env:{DATABASE_URL:url}}); ok('the server starts with DATABASE_URL set',H.up&&/saves: postgres/.test(H.log()),H.up?'':H.log().slice(-400));
    if(!H.up) throw new Error('no start');
    const st=JSON.parse((await get(H.port,'/status')).body.toString()); ok('/status says the saves are in postgres',st.saves==='postgres'&&st.accounts===0,JSON.stringify(st));
    // a guest plays: the record appears in the table under a hash of the account code
    const gcode=code(), g=await join(H.port,{acct:gcode,name:'PgGuest',save:{level:6,exp:40,gear:{coins:123}}});
    ok('a guest joins (the table is empty, so the browser\'s progress is moved to the server)',msgs(g).some(m=>m.t==='welcome'));
    const gid=crypto.createHash('sha256').update('wildwood:'+gcode).digest('hex').slice(0,40);
    const row=await until(async()=>{ const r=await pool.query('SELECT data FROM wildwood_players WHERE id=$1',[gid]); return r.rows[0]; },8000);
    ok('...and its record is in the table under the hash of the code, with level and coins',!!row&&row.data.level===6&&row.data.gear.coins===123&&row.data.name==='PgGuest',row&&JSON.stringify(row.data).slice(0,120));
    // it registers: the account row is made, the guest row says where its progress went
    send(g,{t:'register',user:'PgAnna',pass:'sesame-123'}); await until(()=>last(g,'auth'),15000); const token=(last(g,'auth')||{}).token;
    ok('registering answers with a token',typeof token==='string'&&token.length>=32);
    const aid=crypto.createHash('sha256').update('wildwood:user:pganna').digest('hex').slice(0,40);
    const acc=await until(async()=>{ const r=await pool.query('SELECT data FROM wildwood_players WHERE id=$1',[aid]); return r.rows[0]; },8000);
    ok('the account row: name, the level it brought, a salted scrypt hash (not the password) and a hashed token',!!acc&&acc.data.level===6&&/^[0-9a-f]{32}:[0-9a-f]{64}$/.test(acc.data.auth.pass)&&!JSON.stringify(acc.data).includes('sesame-123')&&acc.data.auth.tokens.length===1&&acc.data.auth.tokens[0]!==token,acc&&JSON.stringify(acc.data.auth).slice(0,100));
    const moved=await until(async()=>{ const r=await pool.query('SELECT data FROM wildwood_players WHERE id=$1',[gid]); return r.rows[0]&&r.rows[0].data.movedTo?r.rows[0]:null; },8000);
    ok('the guest\'s row now says {movedTo} (that code cannot be played as a second copy)',!!moved&&moved.data.movedTo==='PgAnna',moved&&JSON.stringify(moved.data));
    // the same name, another case, from another guest: refused (the name is the row's key)
    const g2=await join(H.port,{name:'Other'}); send(g2,{t:'register',user:'pganna',pass:'another-pw'}); await until(()=>last(g2,'authfail'),8000);
    ok('the same name in another case is refused',/already has the name/i.test((last(g2,'authfail')||{}).text||''));
    g.s.destroy(); g2.s.destroy(); await wait(800);
    const ex=await H.stop('SIGTERM'); ok('SIGTERM saves to the database and exits',!!ex&&ex.code===0&&/saved, bye/.test(H.log()),JSON.stringify(ex));
    // a new process, no data folder shared: only the database
    H2=await startHost({env:{DATABASE_URL:url}}); ok('the server starts again (a new empty data folder, the same database)',H2.up);
    if(!H2.up) throw new Error('no restart');
    const st2=JSON.parse((await get(H2.port,'/status')).body.toString()); ok('/status counts the rows',st2.saves==='postgres'&&st2.accounts>=2,JSON.stringify(st2));
    const a=await join(H2.port,{user:'PGANNA',pass:'sesame-123'}); await until(()=>last(a,'you'),8000);
    ok('log in from the database with the password: the level and coins of before',!!last(a,'auth')&&last(a,'auth').user==='PgAnna'&&last(a,'you').level===6&&last(a,'you').gear.coins===123,JSON.stringify(last(a,'you')&&{lv:last(a,'you').level,c:last(a,'you').gear.coins}));
    const a2=await join(H2.port,{user:'PgAnna',token});
    ok('log in with the token from before the restart',msgs(a2).some(m=>m.t==='welcome')&&!last(a2,'authfail'),(last(a2,'authfail')||{}).text);
    const w=await join(H2.port,{user:'PgAnna',pass:'wrong-password'});
    ok('a wrong password is refused',/Wrong password/i.test((last(w,'authfail')||{}).text||''));
    // writes of one account are kept in order: ten changes in a row, the last one is what the table holds
    a2.s.destroy(); await wait(300);
    const b=await join(H2.port,{user:'PgAnna',pass:'sesame-123'}); for(let i=0;i<10;i++){ send(b,{t:'look',look:{cls:'warrior',hair:'v'+i}}); await wait(20); }
    b.s.destroy(); await wait(1500);
    const fin=await pool.query('SELECT data FROM wildwood_players WHERE id=$1',[aid]);
    ok('ten look changes and a disconnect: the table holds the last one',fin.rows[0].data.look&&fin.rows[0].data.look.hair==='v9',JSON.stringify(fin.rows[0].data.look));
    ok('the server logged no error',!/error|exception/i.test((H.log()+H2.log()).replace(/ECONNRESET/gi,'')),((H.log()+H2.log()).match(/.*(error|exception).*/i)||[''])[0].slice(0,200));
  }catch(e){ ok('the test ran to the end',false,e&&e.stack?e.stack.split('\n').slice(0,3).join(' | '):String(e)); }
  if(H2) await H2.stop('SIGKILL'); if(H) await H.stop('SIGKILL');
  try{ await pool.query('DROP TABLE IF EXISTS wildwood_players'); }catch(e){} try{ await pool.end(); }catch(e){}
  if(cluster) cluster.stop();
  for(const h of [H,H2]) if(h) fs.rmSync(h.dir,{recursive:true,force:true});
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
