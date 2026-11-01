// Headless test of the hair sway (version 3.3, character/hair-sway.js): the hanging hairstyles get their own swinging mesh, the stiff ones do not, a walk and a turn move the tips and leave the roots alone,
// nothing becomes NaN even with a huge step, and standing still puts the hair back exactly as it was cut.
// Usage: node tools/hair-smoke.js
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=o=>Object.assign({},C.LOOK_F,{sex:'female',hat:'none'},o);
const swingMesh=r=>r.head.children.find(m=>m.isMesh&&m.frustumCulled===false);
const hanging=['ponytail','highpony','twintail','braid','sidebraid','long','waves','bob'], stiff=['buzz'];
for(const h of hanging){ let r,e=''; try{ r=C.buildCharacter(look({hair:h}),{q:1}); }catch(err){ e=err.message; }
  const m=r&&swingMesh(r); ok(h+': builds with a swinging hair mesh',!e&&!!m&&r.anims&&r.anims.length>0,e); if(!m) continue;
  const p=m.geometry.attributes.position, base=Float32Array.from(p.array);
  r.hipL.rotation.x=0.5; r.hipR.rotation.x=-0.5; for(let i=0;i<40;i++) r.anims.forEach(f=>f(i*0.016,0.016,0.9));
  let bad=0, moved=0, maxMove=0; for(let i=0;i<p.count;i++){ const d=Math.hypot(p.getX(i)-base[i*3],p.getY(i)-base[i*3+1],p.getZ(i)-base[i*3+2]); if(!isFinite(d)) bad++; if(d>0.003) moved++; maxMove=Math.max(maxMove,d); }
  ok(h+': walking moves the tips, a little, with no NaN',bad===0&&moved>0&&maxMove<0.35,moved+' moved, max '+maxMove.toFixed(3));
  r.hipL.rotation.x=0; r.hipR.rotation.x=0; for(let i=0;i<400;i++) r.anims.forEach(f=>f(2+i*0.016,0.016,0));
  let back=0; for(let i=0;i<p.count*3;i++) back=Math.max(back,Math.abs(p.array[i]-base[i])); ok(h+': standing still puts the hair back as cut',back<1e-5,back);
  r.root.rotation.y=0; for(let i=0;i<10;i++){ r.root.rotation.y+=0.2; r.anims.forEach(f=>f(5+i*0.016,0.016,0)); r.anims.forEach(f=>f(5,10,0)); }   // a fast spin and a huge frame step
  let nan=0; for(let i=0;i<p.count*3;i++) if(!isFinite(p.array[i])) nan++; ok(h+': a fast turn and a huge step stay finite',nan===0); }
for(const h of stiff){ const r=C.buildCharacter(look({hair:h}),{q:1}); ok(h+': a buzz cut stays stiff (no swing mesh)',!swingMesh(r)); }
{ const r=C.buildCharacter(look({hair:'bald'}),{q:1}); ok('bald has nothing to swing',!swingMesh(r)); }
{ const a=C.buildCharacter(look({hair:'ponytail'}),{q:1}), b=C.buildCharacter(look({hair:'ponytail',hat:'cap'}),{q:1}); ok('a hat does not stop the tail swinging and builds finite',!!swingMesh(b)&&C.stats(b).bad===0&&C.stats(a).bad===0); }
{ const lo=C.buildCharacter(look({hair:'long'}),{q:0.4}), hi=C.buildCharacter(look({hair:'long'}),{q:1}); ok('the phone quality (q 0.4) also builds and swings',!!swingMesh(lo)&&C.stats(lo).tris<C.stats(hi).tris); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
