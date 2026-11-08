// Every skill set has a baked portrait (src/game/ui/portraits-data.js, made by tools/portraits.js), each a small transparent WebP; the total stays inside the page's size budget.
const fs=require('fs'), path=require('path'); const root=path.join(__dirname,'..');
const sets=fs.readdirSync(path.join(root,'src/shared/skillsets')).filter(f=>f.endsWith('.js')).map(f=>f.slice(0,-3));
const txt=fs.readFileSync(path.join(root,'src/game/ui/portraits-data.js'),'utf8'); let bad=0;
const have={}; for(const m of txt.matchAll(/^\s*([a-z]+):'data:image\/webp;base64,([A-Za-z0-9+\/=]+)',?$/gm)) have[m[1]]=Buffer.from(m[2],'base64');
for(const id of sets){ const b=have[id]; if(!b){ console.log('FAIL no portrait for',id,'(node tools/portraits.js)'); bad++; continue; }
  if(b.slice(0,4).toString()!=='RIFF'||b.slice(8,12).toString()!=='WEBP'){ console.log('FAIL not a WebP:',id); bad++; }
  if(b.length>40*1024){ console.log('FAIL over 40 KB:',id,b.length); bad++; } }
const total=Object.values(have).reduce((a,b)=>a+b.length,0); if(total>1.2*1024*1024){ console.log('FAIL portraits total',total); bad++; }
console.log(bad?bad+' failure(s)':'portraits-smoke: '+sets.length+' portraits, '+Math.round(total/1024)+' KB');
process.exit(bad?1:0);
