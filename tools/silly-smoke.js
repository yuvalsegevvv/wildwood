// Headless test of the silly hand items and left-handedness (version 3.3): every item builds with finite geometry in a sane size, the catalog (shared/cospieces.js slots v and u) matches
// the models (game/character/model-silly.js), a strong item replaces the weapon and a weak one the shield, left-handed swaps the hands, and unknown ids (prototype names) build nothing.
// Usage: node tools/silly-smoke.js
const C=require('./char-load')();
const {loadServer}=require('./load');
const {x}=loadServer({dev:true,send(){}},['CP_PIECES','CP_RECIPE','CP_SLOTS','cosCleanLook','cpDef']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=o=>Object.assign({},C.LOOK_M,{top:'tshirt'},o);
const ids={strong:Object.keys(C.SILLY.strong), weak:Object.keys(C.SILLY.weak)}, slot={strong:'v',weak:'u'}, field={strong:'strongItem',weak:'weakItem'};
for(const k of ['strong','weak']){
  ok(k+': the catalog lists exactly the models',JSON.stringify(x.CP_PIECES.filter(r=>r[0]===slot[k]).map(r=>r[1]).sort())===JSON.stringify(ids[k].slice().sort()));
  ok(k+': every item has a recipe and a name',ids[k].every(i=>x.CP_RECIPE[slot[k]+':'+i]&&C.SILLY[k][i].name&&typeof C.SILLY[k][i].col==='number'&&typeof C.SILLY[k][i].trim==='number'));
  let bad=[]; for(const id of ids[k]){ try{ const r=C.buildCharacter(look({[field[k]]:id}),{q:0.5}), plain=C.buildCharacter(look({}),{q:0.5}), s=C.stats(r), p=C.stats(plain);
      if(s.bad>0||s.tris<=p.tris||s.tris>p.tris+6000||s.maxR>1.4) bad.push(id+' (tris +'+(s.tris-p.tris)+', bad '+s.bad+', reach '+s.maxR.toFixed(2)+')'); }catch(e){ bad.push(id+': '+e.message); } }
  ok(k+': every item builds, adds triangles, stays small and has no NaN',!bad.length,bad.join('; '));
}
{ const r=C.buildCharacter(look({strongItem:'pan',weakItem:'potlid'}),{q:0.5});
  ok('the rig remembers the items and the hand',r.sillyS==='pan'&&r.sillyW==='potlid'&&r.left===false);
  const w=C.weaponsOn(r,'warrior',1); ok('a strong item replaces the weapon (nothing else is drawn)',w.objs.length===0);
  const r2=C.buildCharacter(look({}),{q:0.5}); ok('without one the weapon is drawn in the right hand',C.weaponsOn(r2,'warrior',1).objs.length===1&&r2.elR.children.length>r2.elL.children.length-1); }
{ const mk=(left,shield)=>{ const r=C.buildCharacter(look({left,shield}),{q:0.5}), w=C.weaponsOn(r,'warrior',1); return {r,w}; };
  const a=mk(false,'heater'), b=mk(true,'heater'), a0=mk(false,''), b0=mk(true,'');
  ok('right-handed: the sword is in the right hand, the shield on the left forearm',a.w.objs[0].parent===a.r.elR&&a.r.elL.children.length===a0.r.elL.children.length+1&&a.r.elR.children.length===a0.r.elR.children.length);
  ok('left-handed: the sword and the shield swap hands',b.w.objs[0].parent===b.r.elL&&b.r.elR.children.length===b0.r.elR.children.length+1&&b.r.elL.children.length===b0.r.elL.children.length&&b.r.left===true);
  const lookB=C.buildCharacter(look({left:true,weakItem:'duck'}),{q:0.5}), lookB0=C.buildCharacter(look({left:true}),{q:0.5}); ok('a weak item goes on the weak (right) forearm when left-handed',lookB.elR.children.length===lookB0.elR.children.length+2&&lookB.elL.children.length===lookB0.elL.children.length);   // (the item and its grip)
  const sh=m=>{ let mx=0; m.children.forEach(c=>{ if(c.geometry){ c.geometry.computeBoundingBox(); mx=c.geometry.boundingBox.max.x+c.geometry.boundingBox.min.x; } }); return mx; };
  ok('the shield sits on the outside of whichever arm',Math.sign(sh(a.r.elL))!==Math.sign(sh(b.r.elR))&&sh(a.r.elL)!==0, sh(a.r.elL).toFixed(3)+' vs '+sh(b.r.elR).toFixed(3)); }
{ const r=C.buildCharacter(look({strongItem:'constructor',weakItem:'__proto__',left:'yes'}),{q:0.5}); ok('prototype names and junk build nothing',r.sillyS===''&&r.sillyW===''); }
{ const owned=[], L=look({strongItem:'pan',weakItem:'potlid'}), cl=x.cosCleanLook(L,owned);
  ok('an unmade item is taken off by the server, a made one stays',cl.strongItem===''&&cl.weakItem===''&&x.cosCleanLook(L,['v:pan','u:potlid']).strongItem==='pan'); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
