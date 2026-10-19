//@ Admin script: reset a registered account's password in Postgres (DATABASE_URL) or the local DATA_DIR files
/* Usage:  DATABASE_URL='postgres://...' node tools/reset-password.js <account name> <new password>
   Writes the same record format the server uses (src/node/main.js AUTH, src/server/accounts.js): scrypt, random salt, 'salt:hash'.
   Also drops the account's login tokens (other devices must log in again). If the player is online right now, their live state
   overwrites the record on its next save: reset while they are logged out (or restart/redeploy first). */
const crypto=require('crypto'), path=require('path'), fs=require('fs');
const [name,pass]=process.argv.slice(2);
if(!name||!pass||pass.length<6||pass.length>100){ console.error('usage: node tools/reset-password.js <account> <password (6-100 chars)>'); process.exit(1); }
const key='user:'+name.toLowerCase();
const id=crypto.createHash('sha256').update('wildwood:'+key).digest('hex').slice(0,40);
const salt=crypto.randomBytes(16).toString('hex');
const hash=salt+':'+crypto.scryptSync(pass,salt,32).toString('hex');
(async()=>{
  if(process.env.DATABASE_URL){
    const {Pool}=require('pg'), url=process.env.DATABASE_URL;
    const pool=new Pool({connectionString:url,ssl:/localhost|127\.0\.0\.1/.test(url)?false:{rejectUnauthorized:false}});
    const r=await pool.query("SELECT data FROM wildwood_players WHERE id=$1",[id]);
    if(!r.rows.length||!r.rows[0].data.auth){ console.error('No registered account "'+name+'" (id '+id+').'); process.exit(2); }
    const data=r.rows[0].data; data.auth.pass=hash; data.auth.tokens=[];
    await pool.query("UPDATE wildwood_players SET data=$2, updated_at=now() WHERE id=$1",[id,data]);
    console.log('Password reset for '+data.auth.user+' (postgres).'); await pool.end();
  } else {
    const f=path.join(process.env.DATA_DIR||path.join(process.cwd(),'data'),id+'.json');
    if(!fs.existsSync(f)){ console.error('No record file '+f+' (set DATABASE_URL for production).'); process.exit(2); }
    const data=JSON.parse(fs.readFileSync(f,'utf8'));
    if(!data.auth){ console.error('That record has no account.'); process.exit(2); }
    data.auth.pass=hash; data.auth.tokens=[]; fs.writeFileSync(f,JSON.stringify(data));
    console.log('Password reset for '+data.auth.user+' ('+f+').');
  }
})().catch(e=>{ console.error(e.message); process.exit(3); });
