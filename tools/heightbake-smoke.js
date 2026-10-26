//@ Headless test of the baked height grid (build.py + tools/bake-heights.js + hbLoad in server/world.js): dist/wildwood-server.js and the page carry the grid the server would work out, packed, and a missing, short or wrong bake is refused
// Usage: node tools/heightbake-smoke.js   (needs dist/: python3 build.py; the runner builds it)
// What it covers: the bake in dist/wildwood-server.js and in dist/wildwood.html is the packed HS worked out from src and unpacks to it byte for byte; hbLoad accepts it and returns null for no bake, a short one, one with extra bytes and one with a wrong vertex.
const fs=require('fs'), path=require('path');
const {manifest,read,ROOT}=require('./load');
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
function serverWith(bake){   // the world server from src with HB_BAKE set (undefined = left null)
  const m=manifest(); let code=m.shared.map(f=>read('shared',f)).join('')+m.server.map(f=>read('server',f)).join('');
  if(bake!==undefined){ if(!code.includes('var HB_BAKE=null;')) throw new Error('no placeholder'); code=code.replace('var HB_BAKE=null;','var HB_BAKE='+JSON.stringify(bake)+';'); }
  code=code.replace(/return \{join:/,'globalThis.__EXPOSE={HS,hbLoad,NVX,SEGZ};return {join:');
  new Function('io',"'use strict';\n"+code)({send(){},broadcast(){}}); return globalThis.__EXPOSE;
}
const {hbPack}=require('./bake-heights');
const srv=fs.readFileSync(path.join(ROOT,'dist','wildwood-server.js'),'utf8'), page=fs.readFileSync(path.join(ROOT,'dist','wildwood.html'),'utf8');
const mt=/var HB_BAKE="([A-Za-z0-9+\/=]+)";/.exec(srv), mp=/var HB_BAKE="([A-Za-z0-9+\/=]+)";/.exec(page);
ok('dist/wildwood-server.js carries a baked grid',!!mt,mt?Math.round(mt[1].length/1024)+' KB of base64':'run python3 build.py (not --no-bake)');
ok('the page carries the same bake (its own world server unpacks it too)',!!mp&&!!mt&&mp[1]===mt[1]);
const base=serverWith();   // no bake: hbCompute
ok('without a bake the server works the grid out (hbLoad is null)',base.hbLoad()===null&&base.HS.length===base.NVX*(base.SEGZ+1));
ok('the grid is in whole centimetres (a bake and a fresh computation are the same bytes)',base.HS.every(v=>Math.abs(v*100-Math.round(v*100))<1e-3));
const same=(a,b)=>Buffer.compare(Buffer.from(a.buffer,a.byteOffset,a.byteLength),Buffer.from(b.buffer,b.byteOffset,b.byteLength))===0;
if(mt){
  ok('the baked grid is the packed grid the code works out',mt[1]===hbPack(base.HS,base.NVX));
  const good=serverWith(mt[1]); const g=good.hbLoad();
  ok('hbLoad unpacks the bake to exactly the computed grid and HS uses it',!!g&&same(g,base.HS)&&same(good.HS,base.HS));
  const short=serverWith(mt[1].slice(0,4000)); ok('a short bake is refused (the grid is worked out instead)',short.hbLoad()===null&&same(short.HS,base.HS));
  const long=serverWith(mt[1]+'AAAA'); ok('a bake with extra bytes is refused',long.hbLoad()===null&&same(long.HS,base.HS));
  const bad=new Float32Array(base.HS); bad[Math.floor(bad.length*((1*0.6180339887)%1))]+=5;   // the probe vertex of k = 1
  const wrong=serverWith(hbPack(bad,base.NVX)); ok('a bake with a wrong vertex is refused (the grid is worked out instead)',wrong.hbLoad()===null&&same(wrong.HS,base.HS));
}
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
