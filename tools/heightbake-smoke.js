//@ Headless test of the baked height grid (build.py + tools/bake-heights.js + hbLoad in server/world.js): dist/wildwood-server.js carries the grid the server would work out, and a missing, short or wrong bake is refused
// Usage: node tools/heightbake-smoke.js   (needs dist/: python3 build.py; the runner builds it)
// What it covers: the bake in dist/wildwood-server.js equals HS worked out from src byte for byte; hbLoad accepts that grid and returns null for no bake, a short one and one with a wrong vertex; the page keeps `var HB_BAKE=null;`.
const fs=require('fs'), path=require('path');
const {manifest,read,ROOT}=require('./load');
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
function serverWith(bake){   // the world server from src with HB_BAKE set (undefined = left null)
  const m=manifest(); let code=m.shared.map(f=>read('shared',f)).join('')+m.server.map(f=>read('server',f)).join('');
  if(bake!==undefined){ if(!code.includes('var HB_BAKE=null;')) throw new Error('no placeholder'); code=code.replace('var HB_BAKE=null;','var HB_BAKE='+JSON.stringify(bake)+';'); }
  code=code.replace(/return \{join:/,'globalThis.__EXPOSE={HS,hbLoad,NVX,SEGZ};return {join:');
  new Function('io',"'use strict';\n"+code)({send(){},broadcast(){}}); return globalThis.__EXPOSE;
}
const b64Of=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
const srv=fs.readFileSync(path.join(ROOT,'dist','wildwood-server.js'),'utf8'), page=fs.readFileSync(path.join(ROOT,'dist','wildwood.html'),'utf8');
const mt=/var HB_BAKE="([A-Za-z0-9+\/=]+)";/.exec(srv);
ok('dist/wildwood-server.js carries a baked grid',!!mt,mt?Math.round(mt[1].length/1024)+' KB of base64':'run python3 build.py (not --no-bake)');
ok('the page keeps the null (its own server works the grid out)',page.includes('var HB_BAKE=null;')&&!/var HB_BAKE="/.test(page));
const base=serverWith();   // no bake: hbCompute
ok('without a bake the server works the grid out (hbLoad is null)',base.hbLoad()===null&&base.HS.length===base.NVX*(base.SEGZ+1));
if(mt){
  ok('the baked grid is byte for byte the grid the code works out',mt[1]===b64Of(base.HS));
  const good=serverWith(mt[1]); const g=good.hbLoad();
  ok('hbLoad accepts the baked grid and it is the one HS uses',!!g&&Buffer.compare(Buffer.from(g.buffer),Buffer.from(good.HS.buffer))===0);
  const short=serverWith(mt[1].slice(0,4000)); ok('a short bake is refused (the grid is worked out instead)',short.hbLoad()===null&&Buffer.compare(Buffer.from(short.HS.buffer),Buffer.from(base.HS.buffer))===0);
  const bad=new Float32Array(base.HS); bad[Math.floor(bad.length*((1*0.6180339887)%1))]+=5;   // the probe vertex of k = 1
  const wrong=serverWith(b64Of(bad)); ok('a bake with a wrong vertex is refused (the grid is worked out instead)',wrong.hbLoad()===null&&Buffer.compare(Buffer.from(wrong.HS.buffer),Buffer.from(base.HS.buffer))===0);
}
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
