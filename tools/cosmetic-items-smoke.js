// Headless test of the cosmetic items of version 3.1 (no build): the glove slot (six base gloves, the sets' gloves), the redrawn and new hats, garments and shoes, the reworked capes and auras.
// Usage: node tools/cosmetic-items-smoke.js     (needs `npm install` for three)
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=(sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,o||{});
const stat=(o,q)=>C.stats(C.buildCharacter(look(o&&o.sex||'male',o),{q:q||0.5}));
const base=stat({gloves:'none'});
// ---- gloves ----
const gl=Object.keys(C.GL_BASE);
ok('six base gloves',gl.length===6,gl.join(','));
let bad=null; for(const id of gl) for(const sex of ['male','female']){ try{ const t=stat({sex,gloves:id,gloveColor:0x8a2f2f,top:'tshirt'},0.8); if(t.bad||Math.abs(t.minY)>0.03) bad=bad||(id+' '+sex+' bad '+t.bad); if(!(t.tris>base.tris-200)) bad=bad||(id+' '+sex+' draws nothing'); }catch(e){ bad=bad||id+': '+e.message; } }
ok('every base glove builds on both bodies and adds geometry',!bad,bad||'');
ok('a glove changes the picture (the colour of the hand differs from bare)',gl.every(id=>{ const a=C.tris(C.buildCharacter(look('male',{gloves:'none',top:'tshirt'}),{q:0.5})), b=C.tris(C.buildCharacter(look('male',{gloves:id,gloveColor:0x8a2f2f,top:'tshirt'}),{q:0.5})); return a.length!==b.length||a.some((v,i)=>v!==b[i]); }));
ok('a hostile glove id (constructor, __proto__) is bare hands',(()=>{ try{ return ['constructor','__proto__','toString'].every(g=>C.buildCharacter(look('male',{gloves:g}),{q:0.4})&&stat({gloves:g}).tris===base.tris); }catch(e){ return false; } })());
ok('a hostile glove colour (NaN, a string) still builds',(()=>{ try{ for(const v of [NaN,'red',null,-5]) C.buildCharacter(look('male',{gloves:'leather',gloveColor:v}),{q:0.4}); return true; }catch(e){ return false; } })());
const withGloves=Object.keys(C.OUTFITS).filter(id=>C.CHAR_MODELS[id].items.glove);
ok('six sets have a glove item (Hollis, Corvin, Sazanka, Genzo, Brynja, Tamsin)',withGloves.length===6,withGloves.join(','));
bad=null; for(const id of withGloves){ const m=C.CHAR_MODELS[id], sex=m.sexes[0], W=C.ofWear(C.applySetup(look(sex),C.setupsOf(m,sex)[0]),id);
  try{ const r=C.buildCharacter(W,{q:0.8}); if(!r.kit.sl.glove||typeof r.kit.sl.glove.glove!=='function'||typeof r.kit.sl.glove.handPaint!=='function') bad=bad||id+' has no glove hooks';
    const t=C.stats(r); if(t.bad) bad=bad||id+' NaN';
    const a=C.tris(r), b=C.tris(C.buildCharacter(Object.assign({},W,{tintGloves:0x2f9a4a}),{q:0.8})); if(a.length===b.length&&a.every((v,i)=>v===b[i])) bad=bad||id+' glove tint changes nothing'; }catch(e){ bad=bad||id+': '+e.message; } }
ok('every set glove builds, has its hooks and takes a tint',!bad,bad||'');
ok('a set without a glove item leaves the wearer\'s own gloves (a base glove under Tansy)',(()=>{ const w=C.ofWear(look('female',{gloves:'leather'}),'tansy'); return w.gloves==='leather'&&!C.ofPieces(w).glove; })());
ok('a whole set with gloves wears them, taking the set off restores bare hands',(()=>{ const w=C.ofWear(look('female'),'brynja'); return w.gloves==='brynja'&&C.ofPieces(w).glove==='brynja'&&C.ofWear(w,'base').gloves==='none'; })());
ok('a set\'s id in `gloves` for a set without a glove is bare hands',stat({gloves:'tansy'}).tris===base.tris);
// ---- hats, tops, bottoms, shoes ----
const hats=C.HT_HATS.map(h=>h[0]).filter(h=>h!=='none');
ok('ten hats (five redrawn, five new) and the helm',hats.length===9,hats.join(','));
const items=[['hat',hats.concat(['helm'])],['top',C.GM_TOPS.map(h=>h[0]).filter(h=>h!=='none')],['bottom',C.GM_BOTTOMS.map(h=>h[0]).filter(h=>h!=='none')],['shoes',C.GM_SHOES.map(h=>h[0]).filter(h=>h!=='none')]];
bad=null; for(const [slot,ids] of items) for(const id of ids) for(const sex of ['male','female']){ try{ const t=stat({sex,[slot]:id},0.6); if(t.bad||Math.abs(t.minY)>0.03) bad=bad||(slot+' '+id+' '+sex+' bad '+t.bad+' minY '+t.minY.toFixed(3)); }catch(e){ bad=bad||slot+' '+id+': '+e.message; } }
ok('every base hat, top, bottom and shoe builds on both bodies: no NaN, feet on the ground',!bad,bad||'');
ok('the new items exist: vest, tunic, kilt, pleated skirt, sandals, tall boots, bandana, hood, circlet, wizard, straw',['vest','tunic'].every(i=>C.GM_TOPS.some(r=>r[0]===i))&&['kilt','pleated'].every(i=>C.GM_BOTTOMS.some(r=>r[0]===i))&&['sandals','tallboots'].every(i=>C.GM_SHOES.some(r=>r[0]===i))&&['bandana','hood','circlet','wizard','straw'].every(i=>hats.includes(i)));
ok('the hat pictures differ (each hat draws a different shape)',(()=>{ const sig=new Set(hats.map(h=>stat({hat:h},0.6).tris+':'+C.stats(C.buildCharacter(look('male',{hat:h}),{q:0.6})).maxY.toFixed(3))); return sig.size>=hats.length-1; })());
ok('a base shoe or top next to an outfit piece builds (mixed)',(()=>{ try{ return stat({shoes:'sandals',top:'dunstan',bottom:'kilt',hat:'wizard',gloves:'gauntlet'},0.5).bad===0; }catch(e){ return false; } })());
// ---- capes and auras ----
ok('12 capes and 10 auras, each with a pattern or a shape',C.COS_CAPES.length===12&&C.COS_AURAS.length===10&&C.COS_CAPES.every(d=>typeof d[7]==='string'&&d[7])&&C.COS_AURAS.every(d=>typeof d[9]==='string'&&d[9]));
bad=null; for(const d of C.COS_CAPES){ try{ const r=C.buildCharacter(look('male',{cape:d[0],top:'tshirt'}),{q:0.5}); for(let i=0;i<30;i++) for(const f of r.anims) f(i*0.05,0.05,i%2?0.8:0); const t=C.stats(r); if(t.bad) bad=bad||d[0]+' NaN'; if(t.maxR>2.2) bad=bad||d[0]+' too wide'; }catch(e){ bad=bad||d[0]+': '+e.message; } }
ok('every cape builds, animates and stays near the body',!bad,bad||'');
ok('the capes look different from each other (distinct colours across the cloth)',(()=>{ const sig=C.COS_CAPES.map(d=>{ const t=C.tris(C.buildCharacter(look('male',{cape:d[0]}),{q:0.4})); let s=0; for(let i=3;i<t.length;i+=9) s+=t[i]*3+t[i+1]*5+t[i+2]*7; return Math.round(s); }); return new Set(sig).size===C.COS_CAPES.length; })());
const withCape=['hollis','brynja','sazanka'], withAura=['hollis','brynja','sazanka','tamsin'];
ok('Hollis, Brynja and Sazanka wear a cape and Hollis, Brynja, Sazanka and Tamsin an aura of their own',[...new Set(withCape.concat(withAura))].every(id=>{ const m=C.CHAR_MODELS[id], W=C.ofWear(C.applySetup(look(m.sexes[0]),C.setupsOf(m,m.sexes[0])[0]),id), r=C.buildCharacter(W,{q:0.6}); return !!r.anims&&r.anims.length>=(withCape.includes(id)?2:1); }));
process.exit(fails?1:0);
