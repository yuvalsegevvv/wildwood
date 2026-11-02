// Checks that the client's height grid is filled by web workers in a real Chromium and that the result is the main thread's own: the page boots to "Ready" with the workers delivering every row,
// no "height workers off" warning (a failed spot check, a blocked blob), and the first row of the grid the page uses is the one the page's own rawHeight gives (checked inside the page by hwCheck).
// Needs playwright + a Chromium and a built dist/ (python3 build.py); skips itself without them. Usage: node tools/height-workers-smoke.js   (about 20 s: software GL)
const fs=require('fs'), path=require('path'), http=require('http');
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(e){} }
if(!chromium){ console.log('SKIP height-workers-smoke: no playwright'); process.exit(0); }
const dist=path.join(__dirname,'..','dist');
if(!fs.existsSync(path.join(dist,'wildwood.html'))){ console.log('SKIP height-workers-smoke: dist/wildwood.html is not built'); process.exit(0); }
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const srv=http.createServer((q,r)=>{ const f=path.join(dist,q.url==='/'?'wildwood.html':decodeURIComponent(q.url.split('?')[0])); if(!f.startsWith(dist)){ r.writeHead(403); r.end(); return; }
  fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); r.end(); } else { r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'application/octet-stream'}); r.end(d); } }); });
srv.listen(0,'127.0.0.1',async()=>{
  let b; try{ b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}); }catch(e){ console.log('SKIP height-workers-smoke: no Chromium ('+e.message.split('\n')[0]+')'); srv.close(); process.exit(0); }
  const pg=await b.newPage({viewport:{width:400,height:260}}), logs=[], errs=[];
  pg.on('console',m=>logs.push(m.text())); pg.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await pg.addInitScript(()=>{ window.__hwlog=1; });
  try{
    await pg.goto('http://127.0.0.1:'+srv.address().port+'/');
    let t=''; for(let i=0;i<1800;i++){ t=await pg.evaluate(()=>document.getElementById('status').textContent); if(/Ready|forest is ready|Something/.test(t)) break; await new Promise(r=>setTimeout(r,100)); }
    ok('the page boots to Ready',/Ready|forest is ready/.test(t),t.slice(0,60));
    ok('the workers delivered every row',logs.some(l=>/^hw done in/.test(l)),logs.filter(l=>/^hw /.test(l)).join(' ')||'no "hw done" line');
    ok('no worker warning (spot check, blob, error)',!logs.some(l=>/height workers off/.test(l)),logs.filter(l=>/height workers off/.test(l))[0]||'');
    ok('no page errors',!errs.length,errs[0]||'');
  }catch(e){ ok('the run finished',false,e.message.split('\n')[0]); }
  await b.close(); srv.close(); process.exit(fails?1:0);
});
