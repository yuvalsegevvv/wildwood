// Headless test of the cosmetic items of version 3.1 (no build): the glove slot (six base gloves, the sets' gloves), the redrawn and new hats, garments and shoes, the reworked capes and auras.
// Usage: node tools/cosmetic-items-smoke.js     (needs `npm install` for three)
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=(sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,o||{});
const stat=(o,q)=>C.stats(C.buildCharacter(look(o&&o.sex||'male',o),{q:q||0.5}));
const base=stat({gloves:'none'});
// ---- gloves ----
const gl=Object.keys(C.GL_BASE);
ok('six base gloves and three crafted ones',gl.length===9,gl.join(','));
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
ok('19 capes and 17 auras (three of each a side quest\'s reward), each with a pattern or a shape',C.COS_CAPES.length===19&&C.COS_AURAS.length===17&&C.COS_CAPES.every(d=>typeof d[7]==='string'&&d[7])&&C.COS_AURAS.every(d=>typeof d[9]==='string'&&d[9]));
bad=null; for(const d of C.COS_CAPES){ if(d[0]==='pack') continue; try{ const r=C.buildCharacter(look('male',{cape:d[0],top:'tshirt'}),{q:0.5}); for(let i=0;i<30;i++) for(const f of r.anims) f(i*0.05,0.05,i%2?0.8:0); const t=C.stats(r); if(t.bad) bad=bad||d[0]+' NaN'; if(t.maxR>2.2) bad=bad||d[0]+' too wide'; }catch(e){ bad=bad||d[0]+': '+e.message; } }
ok('every cape builds, animates and stays near the body',!bad,bad||'');
ok('the capes look different from each other (distinct colours across the cloth)',(()=>{ const sig=C.COS_CAPES.map(d=>{ const t=C.tris(C.buildCharacter(look('male',{cape:d[0]}),{q:0.4})); let s=0; for(let i=3;i<t.length;i+=9) s+=t[i]*3+t[i+1]*5+t[i+2]*7; return Math.round(s); }); return new Set(sig).size===C.COS_CAPES.length; })());
const withCape=['hollis','brynja','sazanka'], withAura=['hollis','brynja','sazanka','tamsin'];
ok('Hollis, Brynja and Sazanka wear a cape and Hollis, Brynja, Sazanka and Tamsin an aura of their own',[...new Set(withCape.concat(withAura))].every(id=>{ const m=C.CHAR_MODELS[id], W=C.ofWear(C.applySetup(look(m.sexes[0]),C.setupsOf(m,m.sexes[0])[0]),id), r=C.buildCharacter(W,{q:0.6}); return !!r.anims&&r.anims.length>=(withCape.includes(id)?2:1); }));
// ---- round 2: hair gradients, sliders, an aura on every set ----
ok('hair gradients: every mode builds with and without a third colour, hostile values are tolerated',(()=>{ try{ for(const m of C.HG_MODES.map(x=>x[0]).concat(['constructor','__proto__',5])) for(const th of [false,true]) for(const c2 of [0x2f9a4a,NaN,'red']) { const t=stat({hairGrad:m,hairColor2:c2,hairThird:th,hairColor3:0x3a5fa0,hair:'long'},0.5); if(t.bad) return false; } return true; }catch(e){ return false; } })());
ok('a gradient recolours the hair (the colours differ from plain)',(()=>{ const col=o=>{ const r=C.buildCharacter(look('female',Object.assign({hair:'long',hairColor:0x1d1714},o)),{q:0.5}); let s=0; r.root.traverse(m=>{ if(m.isMesh&&m.geometry.attributes.color){ const a=m.geometry.attributes.color.array; for(let i=0;i<a.length;i++) s+=a[i]; } }); return s; }; return col({hairGrad:'ombre',hairColor2:0xeeece6})!==col({hairGrad:'none'}) && col({hairGrad:'ombre',hairColor2:0xeeece6,hairThird:true,hairColor3:0x3a5fa0})!==col({hairGrad:'ombre',hairColor2:0xeeece6}); })());
const gradSets=Object.keys(C.OUTFITS).filter(id=>C.CHAR_MODELS[id].hairGrad);
ok('at least sixteen sets have a hair gradient, wearing one puts it on the look and taking it off clears it',gradSets.length>=16&&gradSets.every(id=>{ const w=C.ofWear(look('female'),id); return w.hairGrad===C.CHAR_MODELS[id].hairGrad.mode&&C.ofWear(w,'base').hairGrad==='none'; }),gradSets.length);
ok('the new sliders (undertone, calves, mouth height, blush) build at both ends and lip colour is tolerated',(()=>{ try{ for(const k of ['undertone','calves','mouthHeight','blush']){ const d=C.BODY_SLIDERS.find(x=>x.k===k); if(!d) return false; for(const v of [d.min,d.max]){ const t=stat({[k]:v},0.5); if(t.bad) return false; } } for(const v of [-1,0xb04a52,NaN,'x']) if(stat({lipColor:v},0.4).bad) return false; return true; }catch(e){ return false; } })());
ok('every set has an aura (its own kit.aura, or one built by its extras)',Object.keys(C.OUTFITS).every(id=>{ const m=C.CHAR_MODELS[id], sex=m.sexes[0], W=C.ofWear(C.applySetup(look(sex),C.setupsOf(m,sex)[0]),id), r=C.buildCharacter(W,{q:0.6}); return r.anims&&r.anims.length>0; }));
// ---- round 3: several colours on one outfit piece ----
ok('every set has a palette of 1-4 colours for its pieces, the glove only where it has one',Object.keys(C.OUTFITS).every(id=>{ const P=C.OF_PAL[id]; return P&&['top','bottom','shoes','hat','hair'].every(sl=>P[sl]&&P[sl].length>=1&&P[sl].length<=4)&&(!!P.glove===!!C.CHAR_MODELS[id].items.glove); }));
const sumCol=r=>{ let s=0; r.root.traverse(m=>{ if(m.isMesh&&m.geometry.attributes.color){ const a=m.geometry.attributes.color.array; for(let i=0;i<a.length;i++) s+=a[i]*((i%7)+1); } }); return s; };
ok('a second, third and fourth colour each change the piece, and differently from each other and from the main colour alone',['top','bottom','shoes','hat'].every(sl=>{ const id='corvin', m=C.CHAR_MODELS[id], W=C.ofWear(C.applySetup(look(m.sexes[0]),C.setupsOf(m,m.sexes[0])[0]),id), n=C.ofPalOf(id,sl).length; if(n<2) return true;
  const f=C.OF_TINTX[sl], b=sumCol(C.buildCharacter(W,{q:0.5})), main=sumCol(C.buildCharacter(Object.assign({},W,{['tint'+sl[0].toUpperCase()+sl.slice(1)]:0x2f9a4a}),{q:0.5})), seen=new Set([b,main]);
  for(let i=1;i<n;i++){ const v=sumCol(C.buildCharacter(Object.assign({},W,{[f[i-1]]:0xd83a3a}),{q:0.5})); if(seen.has(v)) return false; seen.add(v); } return true; }));
ok('hostile tint values (NaN, strings, -1, 2^32) on the extra colours still build',(()=>{ try{ for(const v of [NaN,'red',-1,4294967296,null]) { const t=stat({top:'corvin',tintTop2:v,tintTop3:v,tintHat2:v,hat:'corvin'},0.4); if(t.bad) return false; } return true; }catch(e){ return false; } })());
ok('wearing a whole set resets the extra colours',(()=>{ const w=C.ofWear(look('male',{tintTop2:0xff0000,tintHat3:0x00ff00}),'corvin'); return w.tintTop2===-1&&w.tintHat3===-1; })());
process.exit(fails?1:0);
