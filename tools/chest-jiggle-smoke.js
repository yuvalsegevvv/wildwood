// Headless test of the chest jiggle (character/chest-jiggle.js): a walk and a stop move the bust and not the back, a bigger chest moves more, the slider at 0 turns it off,
// nothing becomes NaN with a huge step, and standing still puts the torso back exactly as cut.
// Usage: node tools/chest-jiggle-smoke.js
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=o=>Object.assign({},C.LOOK_F,{sex:'female',hat:'none'},o);
const torsoOf=r=>{ let best=null; r.root.traverse(m=>{ if(m.isMesh&&m.parent&&m.parent.name==='spine'&&(!best||m.geometry.attributes.position.count>best.geometry.attributes.position.count)) best=m; }); return best; };
function run(o){ const r=C.buildCharacter(look(o),{q:1}), m=torsoOf(r), p=m.geometry.attributes.position, base=Float32Array.from(p.array);
  let max=0, back=0, bad=0, t=0;
  for(let i=0;i<120;i++){ r.hipL.rotation.x=0.5*Math.sin(t*9); r.hipR.rotation.x=-0.5*Math.sin(t*9); r.anims.forEach(f=>f(t,0.016,i<80?0.9:0)); t+=0.016;
    for(let v=0;v<p.count;v++){ const d=Math.hypot(p.getX(v)-base[v*3],p.getY(v)-base[v*3+1],p.getZ(v)-base[v*3+2]); if(!isFinite(d)) bad++; if(base[v*3+2]<-0.02) max=Math.max(max,d); else back=Math.max(back,d); } }
  r.anims.forEach(f=>f(9,10,0));
  r.hipL.rotation.x=0; r.hipR.rotation.x=0; for(let i=0;i<500;i++) r.anims.forEach(f=>f(10+i*0.016,0.016,0));
  let rest=0; for(let i=0;i<p.count*3;i++) rest=Math.max(rest,Math.abs(p.array[i]-base[i]));
  return {max,back,bad,rest}; }
const a=run({chest:1}), b=run({chest:2.6}), off=run({chestJiggle:0}), m=run({sex:'male',chest:1});
ok('walking and stopping moves the bust, a little',a.max>0.002&&a.max<0.05,a.max.toFixed(4));
ok('the back does not move',a.back<1e-6,a.back);
ok('a bigger chest moves more',b.max>a.max,b.max.toFixed(4)+' > '+a.max.toFixed(4));
ok('the slider at 0 turns it off',off.max<1e-6,off.max);
ok('a man\'s chest moves less than a woman\'s',m.max<a.max,m.max.toFixed(4));
ok('no NaN, and standing still restores the cut',a.bad===0&&a.rest<1e-5&&b.rest<1e-5,a.rest);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
