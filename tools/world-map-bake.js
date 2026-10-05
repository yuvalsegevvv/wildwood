// Bakes the in-game world map's art: runs docs/world-map.py --game (the docs map without its title, compass, legend, frame and lettering, plus src/game/ui/world-map-data.js),
// renders the SVG in headless Chromium (Playwright, found like the other browser tools: NODE_PATH or /opt/node-tools) and saves it as assets/img/world-map.webp, which build.py embeds.
// Not part of `npm test`; run it after changing docs/world-map.py. Usage: node tools/world-map-bake.js [--quality 82] [--width 2000]
const fs=require('fs'), path=require('path'), os=require('os'), {spawnSync}=require('child_process');
const root=path.join(__dirname,'..'), arg=(k,d)=>{ const i=process.argv.indexOf(k); return i>0?+process.argv[i+1]:d; };
const Q=arg('--quality',82)/100, WIDTH=arg('--width',2000), HEIGHT=Math.round(WIDTH*1574/2000);
let pw; for(const p of ['playwright','/opt/node-tools/node_modules/playwright']){ try{ pw=require(p); break; }catch(_){} }
if(!pw){ console.error('Playwright is needed (npm i playwright, or NODE_PATH)'); process.exit(1); }
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wmap-')), svg=path.join(tmp,'game.svg');
const r=spawnSync('python3',[path.join(root,'docs/world-map.py'),svg,'--game',path.join(root,'src/game/ui/world-map-data.js')],{stdio:'inherit'});
if(r.status) process.exit(r.status);
fs.writeFileSync(svg,fs.readFileSync(svg,'utf8').replace('width="1200" height="944"','width="'+WIDTH+'" height="'+HEIGHT+'"'));
(async()=>{
  const b=await pw.chromium.launch({args:['--no-sandbox']}), pg=await b.newPage({viewport:{width:WIDTH,height:HEIGHT}});
  await pg.goto('file://'+svg); await pg.waitForTimeout(1500);
  const png=await pg.screenshot({type:'png'});
  await pg.goto('about:blank');   // (an HTML page to make the canvas in)
  const url=await pg.evaluate(async([b64,q])=>{ const im=new Image(); im.src='data:image/png;base64,'+b64; await im.decode(); const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d').drawImage(im,0,0); return c.toDataURL('image/webp',q); },[png.toString('base64'),Q]);
  await b.close();
  if(!/^data:image\/webp;base64,/.test(url)){ console.error('this Chromium cannot encode WebP'); process.exit(1); }
  const out=path.join(root,'assets/img/world-map.webp'), buf=Buffer.from(url.split(',')[1],'base64'); fs.writeFileSync(out,buf);
  console.log('wrote assets/img/world-map.webp: '+WIDTH+' x '+HEIGHT+', '+(buf.length/1024).toFixed(0)+' KB; and src/game/ui/world-map-data.js');
  fs.rmSync(tmp,{recursive:true,force:true});
})();
