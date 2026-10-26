//@ Headless Chromium check of the HUD's layout on phones: the top buttons and the minimap fit the screen, the panels are full-width bottom sheets, the popover, the quest log and the toasts stay clear of the button block
// Usage: node tools/phone-layout-smoke.js   (needs dist/: python3 build.py, the runner builds it; skips itself without playwright + Chromium; about 25 s)
// The page is loaded without starting the game (the HUD is markup and CSS): body.playing is switched on and the panels are shown by hand, so nothing here needs the world. Sizes: 390 x 780, 360 x 640 and 430 x 900
// (portrait phones), 700 x 900 (a small tablet, still bottom sheets) and 844 x 390 (a landscape phone). Each failure line names the element and its rectangle.
// What it guards (all found on a real 390 px phone): nine 44 px buttons in a row were 460 px wide (styles/02-hud.css, the 3x3 block up to 520 px), eight panels had a width of their own that the
// phone rule `.panel{ width:auto }` did not beat, the settings popover's max-height came from a later stylesheet. Not covered: what is drawn inside the panels (client-smoke) and the landscape quest log.
const fs=require('fs'), path=require('path'), http=require('http');
const dist=path.join(__dirname,'..','dist');
let chromium; for(const base of [process.cwd(),path.join(__dirname,'..'),'/opt/node-tools','/usr/local/lib']){ try{ chromium=require(require.resolve('playwright',{paths:[base,path.join(base,'node_modules')]})).chromium; break; }catch(e){} }
if(!chromium){ console.log('SKIP phone layout (no playwright, node tools/doctor.js says how to get it)'); process.exit(0); }
if(!fs.existsSync(path.join(dist,'wildwood.html'))){ console.log('FAIL dist/wildwood.html is missing (python3 build.py)'); process.exit(1); }
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(!cond&&info?'  ('+info+')':'')); if(!cond) fails++; };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const srv=http.createServer((q,r)=>{ const f=path.join(dist,q.url==='/'?'wildwood.html':decodeURIComponent(q.url.split('?')[0]));
  if(!f.startsWith(dist)){ r.writeHead(403); r.end(); return; }
  fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); r.end(); } else { r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'application/octet-stream'}); r.end(d); } }); });
// what runs inside the page: returns the rectangles of what is asked about (rounded)
function measure(){
  const R=e=>{ const r=e.getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]; };
  const shown=e=>e&&getComputedStyle(e).display!=='none';
  document.body.classList.add('playing');
  const o={W:innerWidth,H:innerHeight,touch:document.body.classList.contains('touch')};
  o.btns=[...document.querySelectorAll('.btns .icon-btn')].filter(shown).map(e=>[e.id,...R(e)]);
  o.minimap=R(document.getElementById('minimap')); o.brand=R(document.querySelector('.brand'));
  const q=document.getElementById('qlog'); q.hidden=false; const row=document.createElement('div'); row.className='ql'; row.textContent='A quest'; q.appendChild(row); o.qlog=R(row);
  const t=document.getElementById('toasts'); const toast=document.createElement('div'); toast.className='toast'; toast.textContent='A toast'; t.appendChild(toast); o.toast=R(toast);
  o.panels=[]; for(const p of document.querySelectorAll('.panel')){ p.hidden=false; o.panels.push([p.id,...R(p)]); p.hidden=true; }
  const s=document.getElementById('sound'); s.hidden=false; o.sound=R(s); s.hidden=true;
  return o;
}
const inside=(r,W,H)=>r[0]>=-1&&r[1]>=-1&&r[2]<=W+1&&r[3]<=H+1;
const meets=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
srv.listen(0,'127.0.0.1',async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  for(const [w,h] of [[390,780],[360,640],[430,900],[700,900],[844,390]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    const pg=await ctx.newPage();
    await pg.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded'});
    for(let i=0;i<200;i++){ if(await pg.evaluate(()=>document.body.classList.contains('touch'))) break; await sleep(100); }
    await sleep(300);
    const m=await pg.evaluate(measure); const tag=w+'x'+h+': ';
    ok(tag+'the page is in touch mode',m.touch);
    const out=m.btns.filter(r=>!inside(r.slice(1),w,h)).map(r=>r[0]+' '+r.slice(1)); ok(tag+'every top button is on the screen ('+m.btns.length+' shown)',m.btns.length>=8&&!out.length,out.join(' ; '));
    ok(tag+'the minimap is on the screen',inside(m.minimap,w,h),m.minimap.join(','));
    const hit=m.btns.filter(r=>meets(r.slice(1),m.brand)).map(r=>r[0]); ok(tag+'the buttons stay off the name box',!hit.length,hit.join(','));
    const btnBottom=Math.max(...m.btns.map(r=>r[4]));
    if(w<=519){   // a portrait phone: the 3x3 block, and everything that hangs under it
      ok(tag+'the minimap hangs under the button block',m.minimap[1]>=btnBottom,m.minimap[1]+' < '+btnBottom);
      ok(tag+'the quest log hangs under the minimap (not behind the skill buttons)',m.qlog[1]>=m.minimap[3],m.qlog[1]+' < '+m.minimap[3]);
      ok(tag+'toasts start under the button block',m.toast[1]>=btnBottom,m.toast[1]+' < '+btnBottom);
      ok(tag+'the settings popover opens under the block and ends on the screen',m.sound[1]>=btnBottom&&inside(m.sound,w,h),m.sound.join(','));
    } else ok(tag+'the settings popover is on the screen',inside(m.sound,w,h),m.sound.join(','));
    if(w<=719){ const bad=m.panels.filter(p=>p[1]!==0||p[3]!==w).map(p=>p[0]+' '+p[1]+'..'+p[3]); ok(tag+'all '+m.panels.length+' panels are full-width bottom sheets',m.panels.length>=18&&!bad.length,bad.join(' ; ')); }
    else { const bad=m.panels.filter(p=>!inside(p.slice(1),w,h)).map(p=>p[0]+' '+p.slice(1)); ok(tag+'every panel fits the screen',!bad.length,bad.join(' ; ')); }
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
});
