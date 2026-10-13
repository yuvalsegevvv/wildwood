// A screenshot of the built game, for judging a change you cannot test with numbers (colours, terrain, a model in the lighting, a panel): boots dist/wildwood.html in headless Chromium
// (software WebGL), waits for "Ready", plays solo, raises the level (so nothing near you kills you), teleports with the page's own testing tools and saves a PNG.
// Needs playwright and a Chromium (`node tools/doctor.js` says), and a built dist/ (python3 build.py). Software GL is SLOW (a frame takes seconds): keep the small default size; a shot takes 3-8 minutes, so run it in the background.
// Usage: node tools/shot.js out.png [--at x,z[,degrees]] [--go tRime] [--level 60] [--size 480x300] [--frames 25] [--settings]
//   --at x,z,deg   put the hiker there facing deg degrees (integers: the testing tool's button `tPass` takes "x,z,degrees")
//   --go <id>      press one of the testing tools' teleport buttons instead (tPass, tRime, tHall, tNest, tGlen, tGrey, tQueen, tCavern, ...: the ids in src/index.html, #tSec)
//   --frames N     rendered frames to wait after the jump (default 25: the world streams in a slice per frame, a far land colours its ground on arrival, and software GL draws about one frame a second)
//   --settings     leave the settings panel open in the picture (it is closed by default)
// Prints the page's console errors (none is the good answer). The shots of a session are in the path you give; look at them with the Read tool.
const fs=require('fs'), path=require('path'), http=require('http');
const arg=(n,d)=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:d; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'shot.png';
const [W,H]=(arg('--size','480x300')).split('x').map(Number), LEVEL=+arg('--level',60), FRAMES=+arg('--frames',25), AT=arg('--at',null), GO=arg('--go',null);
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(e){} }
if(!chromium){ console.error('shot.js needs the playwright package (node tools/doctor.js)'); process.exit(2); }
const dist=path.join(__dirname,'..','dist');
if(!fs.existsSync(path.join(dist,'wildwood.html'))){ console.error('dist/wildwood.html is not built: python3 build.py'); process.exit(2); }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const srv=http.createServer((q,r)=>{ const f=path.join(dist,q.url==='/'?'wildwood.html':decodeURIComponent(q.url.split('?')[0])); if(!f.startsWith(dist)){ r.writeHead(403); r.end(); return; }
  fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); r.end(); } else { r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.m4a')?'audio/mp4':'application/octet-stream'}); r.end(d); } }); });
srv.listen(0,'127.0.0.1',async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:W,height:H}}); const errs=[];
  pg.on('pageerror',e=>errs.push(String(e).slice(0,200))); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text().slice(0,200)); });
  await pg.addInitScript(()=>{ window.__frames=0; const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=cb=>raf(t=>{ window.__frames++; cb(t); }); });   // (counts the frames the page draws)
  try{
    await pg.goto('http://127.0.0.1:'+srv.address().port+'/');
    for(let i=0;i<3000;i++){ const t=await pg.evaluate(()=>document.getElementById('status').textContent); if(/Ready|forest is ready/.test(t)) break; await sleep(100); }
    await pg.evaluate(()=>document.getElementById('stSolo').click()); await sleep(5000);
    if(AT||GO||LEVEL>1){
      await pg.evaluate(()=>document.getElementById('bSound').click()); await sleep(400);   // the settings popover holds the testing tools
      if(LEVEL>1){ await pg.evaluate(l=>{ document.getElementById('tLevel').value=l; document.getElementById('tSetLv').click(); },LEVEL); await sleep(1500); }
      if(AT){ await pg.evaluate(v=>{ const t=document.getElementById('tPass'); t.setAttribute('data-v',v); t.click(); },AT.split(',').length<3?AT+',0':AT); await sleep(300); }
      else if(GO){ await pg.evaluate(i=>{ const t=document.getElementById(i); if(!t) throw new Error('no testing button #'+i); t.click(); },GO); await sleep(300); }
      if(!process.argv.includes('--settings')) await pg.evaluate(()=>document.getElementById('bSound').click());
    }
    { const f0=await pg.evaluate(()=>window.__frames); for(let i=0;i<3000;i++){ if(await pg.evaluate(f=>window.__frames-f,f0)>=FRAMES) break; await sleep(200); } }   // frames, not seconds: how many a second depends on the machine
    await pg.screenshot({path:out,timeout:240000}); console.log('saved',out,'('+W+'x'+H+')');
  }catch(e){ console.error('shot failed:',e.message.split('\n')[0]); process.exitCode=1; }
  console.log('page errors:',errs.length?errs.slice(0,5):'none');
  await b.close(); srv.close();
});
