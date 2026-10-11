// Headless test of the signature outfits (src/game/outfits/*.js): prints PASS/FAIL. Usage: node tools/outfit-smoke.js [--only <id>]   (needs `npm install` for three; no build; ~10 s per outfit)
// Each outfit must: have a signature character model with one reference setup, build on its body with no NaN and its feet on the ground, stay inside the triangle budget, build with every slider at both ends
// on both bodies, and carry a weapon dressing that builds on the warrior's, the archer's and the mage's weapons. Writing an outfit: docs/CHARACTER.md section 9.
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const look=(sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,o||{});
const only=process.argv.includes('--only')?process.argv[process.argv.indexOf('--only')+1]:null;

/* ---- the signature outfits (src/game/outfits/*.js): each builds on its own body, on every slider extreme, on the other sex, within the triangle budget, with a working weapon dressing ---- */
{ const ids=Object.keys(C.OUTFITS).filter(k=>!only||k===only); ok('there are outfits to check ('+ids.length+')',ids.length>=1);
  const worn=(id,sex,st)=>Object.assign(C.applySetup(look(sex),st||{v:{}}),{model:id});
  for(const id of ids){
    const m=C.CHAR_MODELS[id], sex=m&&(m.sexes||[])[0], ref=m&&C.setupsOf(m,sex)[0];
    if(!(m&&m.signature&&sex&&ref)){ ok('outfit "'+id+'" has a signature character model with its reference setup',false); continue; }
    let rig, err=null; try{ rig=C.buildCharacter(worn(id,sex,ref),{q:1.1}); }catch(e){ err=e.message; }
    if(err){ ok('outfit "'+id+'" builds on its reference body',false,err); continue; }
    const st=C.stats(rig), plain=C.stats(C.buildCharacter(Object.assign({},worn(id,sex,ref),{model:'base'}),{q:1.1}));
    ok('outfit "'+id+'" builds on its reference body: no NaN, feet on the ground',st.bad===0&&Math.abs(st.minY)<0.03,'minY '+st.minY.toFixed(3));
    ok('outfit "'+id+'" stays within the triangle budget (+'+Math.round(st.tris-plain.tris)+' over the base clothes, at most 35,000)',st.tris-plain.tris<=35000);
    ok('outfit "'+id+'" has the hooks: paint, hair, head, a distinct eye style, a weapon dressing',typeof rig.kit.paint==='function'&&typeof rig.kit.hair==='function'&&typeof rig.kit.head==='function'&&!!rig.kit.eyes&&!!rig.dress);
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


console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
