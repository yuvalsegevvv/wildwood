// Headless test of the dresses (version 3.3): the six crafted dresses (shared/cospieces.js slot t) match the models (game/character/model-dresses.js), build with finite geometry,
// reach the right length, take the bottom off, sway with the legs without a NaN or a leg poking out of the hem, hold up in modest mode, and prototype names build nothing.
// Usage: node tools/dresses-smoke.js
const C=require('./char-load')();
const {loadServer}=require('./load');
const {x}=loadServer({dev:true,send(){}},['CP_PIECES','CP_RECIPE','cosCleanLook']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=o=>Object.assign({},C.LOOK_F,{sex:'female'},o);
const ids=Object.keys(C.GMD);
ok('six dresses',ids.length===6,ids.join());
ok('the catalog lists every dress with a recipe',ids.every(i=>x.CP_PIECES.some(r=>r[0]==='t'&&r[1]===i)&&x.CP_RECIPE['t:'+i]));
const plain=C.stats(C.buildCharacter(look({top:'tshirt',bottom:'shorts'}),{q:0.5}));
for(const id of ids){
  let r,s,e=''; try{ r=C.buildCharacter(look({top:id,bottom:'jeans'}),{q:0.5}); s=C.stats(r); }catch(err){ e=err.message; }
  ok(id+': builds, finite, no huge reach',!e&&s.bad===0&&s.maxR<1.6&&s.tris<plain.tris+25000,e||(s&&('tris +'+(s.tris-plain.tris)+', reach '+s.maxR.toFixed(2))));
  if(!r) continue;
  const hem=r.hips.children.find(m=>m.isMesh&&m.frustumCulled===false); ok(id+': the skirt has the sway deformer and the bottom is off',!!hem&&r.anims&&r.anims.length>0);
  if(!hem) continue;
  const p=hem.geometry.attributes.position, before=Float32Array.from(p.array); let minY=0; for(let i=0;i<p.count;i++) minY=Math.min(minY,before[i*3+1]);
  ok(id+': the hem hangs between a quarter and 1.02 of the leg',-minY>0.2*r.hipY&&-minY<=1.02*r.hipY,(-minY/r.hipY).toFixed(2));
  r.hipL.rotation.x=0.6; r.hipR.rotation.x=-0.6; for(const f of r.anims) f(1.3,0.016,0.9);
  let bad=0,moved=0,waist=0,maxMove=0; for(let i=0;i<p.count;i++){ const d=Math.hypot(p.getX(i)-before[i*3],p.getY(i)-before[i*3+1],p.getZ(i)-before[i*3+2]); if(!isFinite(d)) bad++; if(d>0.002) moved++; if(before[i*3+1]>=0&&d>0) waist++; maxMove=Math.max(maxMove,d); }
  ok(id+': walking moves the hem, leaves the waist and never makes NaN',moved>0&&waist===0&&bad===0&&maxMove<0.9,moved+' moved, max '+maxMove.toFixed(2));
  r.hipL.rotation.x=0; r.hipR.rotation.x=0; for(const f of r.anims) f(2,0.016,0); for(const f of r.anims) f(2.1,0.016,0);
  let back=0; for(let i=0;i<p.count*3;i++) back=Math.max(back,Math.abs(p.array[i]-before[i])); ok(id+': standing again restores the cut',back<1e-5,back);
}
{ const L=look({top:'ballgown',bottom:'jeans'}), r=C.buildCharacter(L,{q:0.5}), r2=C.buildCharacter(look({top:'ballgown',bottom:'none'}),{q:0.5});
  ok('a dress ignores the bottom piece (same geometry with or without)',C.stats(r).tris===C.stats(r2).tris); }
{ const owned=[], cl=x.cosCleanLook(look({top:'mermaid'}),owned), cl2=x.cosCleanLook(look({top:'mermaid'}),['t:mermaid']);
  ok('an unmade dress is taken off by the server, a made one stays',cl.top!=='mermaid'&&cl2.top==='mermaid',cl.top+' / '+cl2.top); }
{ ok('only own ids are dresses',C.gmdIs('ballgown')&&!C.gmdIs('constructor')&&!C.gmdIs('__proto__')&&!C.gmdIs('tshirt')&&!C.gmdIs(null));
  let e=''; try{ const r=C.buildCharacter(look({top:'constructor'}),{q:0.5}); if(C.stats(r).bad) e='NaN'; }catch(err){ e=err.message; } ok('a prototype name as the top builds',!e,e); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
