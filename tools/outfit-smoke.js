// Headless test of the signature outfits (src/game/outfits/*.js): prints PASS/FAIL. Usage: node tools/outfit-smoke.js [--only <id>]   (needs `npm install` for three; no build; ~10 s per outfit)
// Each outfit must: have a signature character model with one reference setup, build on its body with no NaN and its feet on the ground, stay inside the triangle budget, build with every slider at both ends
// on both bodies, and carry a weapon dressing that builds on the warrior's, the archer's and the mage's weapons. Writing an outfit: docs/CHARACTER.md section 9.
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=(sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,o||{});
const only=process.argv.includes('--only')?process.argv[process.argv.indexOf('--only')+1]:null;

/* ---- the signature outfits (src/game/outfits/*.js): each builds on its own body, on every slider extreme, on the other sex, within the triangle budget, with a working weapon dressing ---- */
{ const ids=Object.keys(C.OUTFITS).filter(k=>!only||k===only); ok('there are outfits to check ('+ids.length+')',ids.length>=1);
  const worn=(id,sex,st)=>C.ofWear(C.applySetup(look(sex),st||{v:{}}),id);
  for(const id of ids){
    const m=C.CHAR_MODELS[id], sex=m&&(m.sexes||[])[0], ref=m&&C.setupsOf(m,sex)[0];
    if(!(m&&m.signature&&sex&&ref)){ ok('outfit "'+id+'" has a signature character model with its reference setup',false); continue; }
    let rig, err=null; try{ rig=C.buildCharacter(worn(id,sex,ref),{q:1.1}); }catch(e){ err=e.message; }
    if(err){ ok('outfit "'+id+'" builds on its reference body',false,err); continue; }
    const st=C.stats(rig), plain=C.stats(C.buildCharacter(C.ofWear(worn(id,sex,ref),'base'),{q:1.1}));
    ok('outfit "'+id+'" builds on its reference body: no NaN, feet on the ground',st.bad===0&&Math.abs(st.minY)<0.03,'minY '+st.minY.toFixed(3));
    ok('outfit "'+id+'" stays within the triangle budget (+'+Math.round(st.tris-plain.tris)+' over the base clothes, at most 35,000)',st.tris-plain.tris<=35000);
    ok('outfit "'+id+'" has the hooks: paint, hair, head, a distinct eye style, a weapon dressing',typeof rig.kit.sl.top.paint==='function'&&typeof rig.kit.sl.hair.hair==='function'&&typeof rig.kit.sl.hat.head==='function'&&!!rig.kit.sl.face.eyes&&!!rig.dress);
    ok('outfit "'+id+'" names the main colour of each piece for the player\'s recolouring (main: top, bottom, shoes, hat; hairColor; dress.accent)',['top','bottom','shoes','hat'].every(sl=>rig.kit.sl[sl].main&&typeof rig.kit.sl[sl].main[sl]==='number')&&typeof rig.kit.sl.hair.hairColor==='number'&&typeof rig.dress.accent==='number');
    // every slider at both ends of the whole range, on the reference body and on the other sex, at a low detail
    let bad=null; for(const sx of ['male','female']){ for(const sl of C.BODY_SLIDERS){ for(const v of [sl.min,sl.max]){ try{ const r=C.buildCharacter(Object.assign(worn(id,sx,sx===sex?ref:{v:{}}),{[sl.k]:v}),{q:0.4}), t=C.stats(r); if(t.bad>0&&!bad) bad=sx+' '+sl.k+'='+v+' NaN'; }catch(e){ if(!bad) bad=sx+' '+sl.k+'='+v+': '+e.message; } } } }
    ok('outfit "'+id+'" builds with every slider at both ends, on both bodies',!bad,bad||'');
    // the weapon dressing: all three classes, a charm that has geometry, a colour for every role
    let dres=null; try{ for(const cls of ['warrior','archer','mage']){ const r=C.buildCharacter(worn(id,sex,ref),{q:0.5}), res=C.weaponsOn(r,cls,1); if(!res.objs.length) dres='no weapon objects for '+cls; }
      const d=rig.dress, cm=d.charm(); if(!(cm.lit&&cm.lit.length)) dres='the charm has no geometry'; for(const k of ['grip','metal','wood','accent']) if(typeof d[k]!=='number') dres='dress.'+k+' is not a colour'; if(typeof d.trim!=='function') dres='no trim'; }catch(e){ dres=e.message; }
    ok('outfit "'+id+'" has a weapon dressing that builds on the warrior, the archer and the mage',!dres,dres||'');
    const mod=C.stats(C.buildCharacter(worn(id,sex,ref),{q:0.5})); ok('outfit "'+id+'" builds at the detail of other players',mod.bad===0&&mod.tris<st.tris);
  }
}


/* ---- mixing the pieces (outfit-tools.js "mixing the pieces of the outfits"): any slot may wear any outfit's item, base items mix with them, a remote look cannot break the build ---- */
if(!only){
  const ids=Object.keys(C.OUTFITS), stat=(o,q)=>C.stats(C.buildCharacter(look(o&&o.sex||'male',o),{q:q||0.4}));
  const SLOTS=C.OF_SLOTS, F=C.OF_FIELD, base=stat({}), mk=(sex,a,b)=>look(sex,{top:a,bottom:b,shoes:a,hat:b,hair:a,faceItem:b,weaponItem:b});
  ok('the outfits name seven slots and every outfit has an item name for each (the editor rows)',SLOTS.length===7&&ids.every(id=>SLOTS.every(sl=>C.CHAR_MODELS[id].items&&C.CHAR_MODELS[id].items[sl])));
  ok('the editor lists every outfit once per slot',SLOTS.every(sl=>C.ofItems(sl).length===ids.length));
  // every ordered pair of outfits, interleaved slot by slot, on both bodies
  let bad=null, n=0; for(const sex of ['male','female']) for(const a of ids) for(const b of ids){ if(a===b) continue; n++; try{ const t=stat(mk(sex,a,b)); if(t.bad>0||Math.abs(t.minY)>0.03) bad=bad||(sex+' '+a+'/'+b+' bad='+t.bad+' minY='+t.minY.toFixed(3)); }catch(e){ bad=bad||(sex+' '+a+'/'+b+': '+e.message); } }
  ok('every pair of outfits mixed slot by slot builds on both bodies ('+n+' looks): no NaN, feet on the ground',!bad,bad||'');
  // one outfit item at a time adds geometry to its slot, and the rest stays base
  let none=null; for(const id of ids) for(const sl of SLOTS){ const t=stat({[F[sl]]:id}); if(!(t.tris>base.tris-3000)&&sl!=='weapon') none=none||(id+' '+sl+' '+t.tris+' vs '+base.tris); if(sl==='weapon'&&t.tris!==base.tris) none=none||(id+' weapon changed the body'); }
  ok('every item builds alone on a base body (the weapon dressing is not part of the body)',!none,none||'');
  let each=null; for(const id of ids){ const sex=C.CHAR_MODELS[id].sexes[0]; for(const sl of ['top','bottom','shoes','hat','hair','face']){ const L0=look(sex), L1=look(sex,{[F[sl]]:id}); const sum=L=>{ const t=C.tris(C.buildCharacter(L,{q:1})); let h=0; for(let i=0;i<t.length;i++) h=(h+t[i]*((i%97)+1))%1e9; return t.length+':'+Math.round(h*1000); }; if(sum(L0)===sum(L1)) each=each||(id+' '+sl+' changes nothing'); } }
  ok('every body slot of every outfit changes the body (geometry or colour: a slot is not silently dropped)',!each,each||'');
  // base items mix too
  let bs=null; for(const o of [{top:'tansy',bottom:'skirt',shoes:'sneakers',hat:'beanie'},{top:'jacket',bottom:'corvin',shoes:'boots',hat:'ranger',hair:'ponytail'},{sex:'female',top:'hoodie',bottom:'marigold',shoes:'dunstan',facial:'beard'}]){ try{ const t=stat(o); if(t.bad>0) bs=bs||JSON.stringify(o); }catch(e){ bs=bs||JSON.stringify(o)+': '+e.message; } }
  ok('base items and outfit items mix (a base top over an outfit bottom, outfit boots under base trousers...)',!bs,bs||'');
  // loose parts follow the slot that owns them: Dunstan's drum is his tabard's, his hat has none; Marigold's lanterns are her hat's
  const anim=o=>{ const r=C.buildCharacter(look('male',o),{q:0.4}); return r.anims?r.anims.length:0; };
  ok('animated parts belong to their slot (Dunstan: the drum with the top; Marigold: the lanterns with the hat, the antenna strand with the hair)',anim({top:'dunstan'})>=1&&anim({hat:'dunstan'})===0&&anim({bottom:'dunstan'})===0&&anim({hat:'marigold'})>=1&&anim({hair:'marigold'})>=1&&anim({top:'marigold'})===0);
  // the weapon dressing is the weapon slot's alone
  { const r0=C.buildCharacter(look('male'),{q:0.4}), r1=C.buildCharacter(look('male',{weaponItem:'sorrel'}),{q:0.4}), r2=C.buildCharacter(look('male',{top:'sorrel',hat:'sorrel',hair:'sorrel'}),{q:0.4});
    ok('the weapon dressing comes only from the weapon slot',!r0.dress&&!!r1.dress&&!r2.dress); }
  // an item brings its own colours: hair colour and eye colour follow the hair and face items (a hair item changes the eyebrows' colour)
  { const o={top:'constructor',bottom:'__proto__',shoes:'x',hat:'toString',hair:'nope',faceItem:'hasOwnProperty',weaponItem:'valueOf'}; let err=null, t=null; try{ t=stat(o); }catch(e){ err=e.message; }
    ok('a look with nonsense piece names builds, wearing none of them (a remote look is not sanitized)',!err&&t.bad===0&&Object.keys(C.ofPieces(look('male',o))).length===0,err||''); }
  // recolouring (outfit-tools.js "Recolouring"): a look's tint<Slot> moves a worn piece's main colour to the player's colour; -1 and nonsense mean as designed; a slot without an outfit piece is not affected
  { const sum=L=>{ const t=C.tris(C.buildCharacter(L,{q:0.7})); let h=0; for(let i=0;i<t.length;i++) h=(h+t[i]*((i%89)+1))%1e9; return Math.round(h*1000)+':'+t.length; };
    const TINT={top:'tintTop',bottom:'tintBottom',shoes:'tintShoes',hat:'tintHat',hair:'tintHair',face:'tintFace',weapon:'tintWeapon'};
    let bad=null; for(const id of ids){ const sex=C.CHAR_MODELS[id].sexes[0], W=C.ofWear(look(sex),id), base=sum(W);
      for(const sl of ['top','bottom','shoes','hat','hair','face']){ const one=sum(Object.assign({},W,{[TINT[sl]]:0x2f6f73})); if(one===base) bad=bad||(id+' '+sl+' tint changes nothing'); const alone=sum(look(sex,{[C.OF_FIELD[sl]]:id})), alone0=sum(look(sex,{[C.OF_FIELD[sl]]:id,[TINT[sl]]:0x8a2f2f})); if(alone===alone0) bad=bad||(id+' '+sl+' tint alone changes nothing'); }
      const colour=L=>{ const r=C.buildCharacter(L,{q:0.4}); C.weaponsOn(r,'warrior',1); const t=C.tris(r); let h=0; for(let i=0;i<t.length;i++) h=(h+t[i]*((i%83)+1))%1e9; return Math.round(h*1000); };
      if(colour(W)===colour(Object.assign({},W,{tintWeapon:0x8a2f2f}))) bad=bad||(id+' weapon tint changes nothing'); }
    ok('every slot of every outfit can be recoloured (body slots, the hair and the eyes, the weapon), also one piece alone on plain clothes',!bad,bad||'');
    const W=C.ofWear(look('female'),'marigold'), base=sum(W);
    ok('a tint of -1, a missing one and nonsense ("x", NaN, -5, 1e9) are the designed colours',sum(Object.assign({},W,{tintTop:-1}))===base&&sum(Object.assign({},W,{tintTop:'x',tintBottom:NaN,tintShoes:-5,tintHat:1e9}))===base);
    ok('a tint on a slot that wears no outfit piece changes nothing (the base garments use topColor and the others)',sum(look('male',{tintTop:0x8a2f2f,tintHat:0x2f4a6b,tintWeapon:0x8a2f2f}))===sum(look('male')));
    const a=sum(Object.assign({},W,{tintTop:0x8a2f2f})), b=sum(Object.assign({},W,{tintHat:0x8a2f2f})); ok('each slot is recoloured on its own (top and hat tints give different looks, both different from the designed one)',a!==base&&b!==base&&a!==b);
    ok('wearing a whole set (ofWear) puts the designed colours back',(()=>{ const t=Object.assign({},W,{tintTop:0x8a2f2f,tintWeapon:1}); const w=C.ofWear(t,'tansy'); return Object.values(TINT).every(k=>w[k]===-1)&&Object.values(TINT).every(k=>C.ofWear(t,'base')[k]===-1); })()); }
  // wearing a whole set and taking it off; a look saved before pieces existed
  { const m=C.ofWear(look('female'),'tansy'), p=C.ofPieces(m), off=C.ofWear(m,'base'), mig=C.fullLook({sex:'female',model:'tansy',top:'tshirt'}), keep=C.fullLook({sex:'female',model:'tansy',top:'tshirt',faceItem:''});
    ok('a whole set is seven pieces, taking it off restores the base items, an old save wearing a set through `model` gets its pieces',Object.keys(p).length===7&&Object.values(p).every(v=>v==='tansy')&&m.model==='tansy'&&Object.keys(C.ofPieces(off)).length===0&&off.model==='base'&&off.top===C.LOOK_F.top&&Object.keys(C.ofPieces(mig)).length===7&&Object.keys(C.ofPieces(keep)).length===0);
    const t=C.ofTidy(Object.assign({},m,{top:'tshirt',bottom:'trousers',shoes:'boots',hat:'none',hair:'short',faceItem:'',weaponItem:''})), t2=C.ofTidy(Object.assign({},m,{top:'tshirt'}));
    ok('the set name stays while one of its pieces is worn and goes back to base when none is',t.model==='base'&&t2.model==='tansy'); }
}

console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
