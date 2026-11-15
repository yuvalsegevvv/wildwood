//@ The Abyss's artifact screens (B4-B5, kinds B8): the pick screen (3 cards, Pick / Skip), the tile cards, the artifact bar (icons with a copy count, n / 20), the discard dialog (a full bar, or between rounds); events abo and aba
/* agent map (docs/ABYSS.md section 5; the server side: server/abyss/arts.js)
   exports: abTilesShow(list) / abTilePick(i) (B7: the next-tile cards on the same screen), abBarArts() (the saved bar from GEAR.ab.run.arts), abBarCurses() (B6: GEAR.ab.run.curses, own ids only; drawn as their own row under the bar), abPickShow(ids), abPickHide(), abDropShow(pend), abDropHide(), abArtsRender(), abChoiceUpdate() (abUpdate calls it), EVH.abo, EVH.aba, AB_PK
   markup: #abArts (the bar), #abPick / #abPickCards / #abSkip, #abDrop / #abDropList / #abDropNo (index.html); styles 42-abyss.css. The bar is read from GEAR (the `you` message carries gear.ab.run.arts and .offer).
   messages sent: abyss{a:'next',i} (a tile card), abyss{a:'pick',i} / {a:'skip'} / {a:'drop',i}. Test: tools/client-smoke.js (the Abyss artifacts case). */
const AB_PK={offer:null,pend:-1,ign:0,sig:'',tiles:null,enc:false};   // enc (B8): an Event / Shrine card is showing (abyss/encounter.js)   // tiles (B7): the stored next-tile offer [[tile, kind]] while the pick screen shows it (or was put aside with Later)
const abBarArts=()=>{ const r=GEAR&&GEAR.ab&&GEAR.ab.run; return r&&Array.isArray(r.arts)?r.arts:[]; };
const abBarCurses=()=>{ const r=GEAR&&GEAR.ab&&GEAR.ab.run; return r&&Array.isArray(r.curses)?r.curses.filter(id=>abIsCurse(id)):[]; };   // B6: the curse row (outside the 20)
const abArtCopies=id=>abBarArts().filter(x=>x===id).length;
function abMk(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined) e.textContent=txt; return e; }
// the groups of the bar: [id, copies, index of its first copy], in the order first taken
function abGroups(){ const g=[], seen={}; abBarArts().forEach((id,i)=>{ if(seen[id]===undefined){ seen[id]=g.length; g.push([id,0,i]); } g[seen[id]][1]++; }); return g; }
function abPickShow(ids){
  const el=$('#abPick'), box=$('#abPickCards'); if(!el||!box) return;
  const list=(ids||[]).filter(id=>abIsArt(id)); if(!list.length){ abPickHide(); return; }
  AB_PK.offer=list; AB_PK.tiles=null; AB_PK.enc=false; box.innerHTML=''; $('#abPickT').textContent='Choose an artifact'; $('#abSkip').textContent='Skip';
  list.forEach((id,i)=>{
    const a=AB_ARTS[id], held=abArtCopies(id), c=abMk('div','ab-card ab-'+a.rar);
    c.append(abMk('div','ab-ic',a.icon),abMk('b','ab-nm',a.name),abMk('div','ab-rar',a.fam==='wild'?'wildcard · '+a.rar:a.rar),abMk('p','ab-tx',a.text));
    if(a.minus) c.append(abMk('p','ab-minus',a.minus));   // B6: a wildcard's price, in red
    c.append(abMk('span','ab-held',held?'You hold '+held+' (a copy makes it rank '+Math.min(AB_RANK_MAX,held+1)+')':'New'));
    const b=abMk('button','chip buy ab-pick','Pick'); b.type='button'; b.dataset.i=i;
    b.onclick=()=>{ UI_SFX.click(); if(abBarArts().length>=AB_ART_MAX){ abDropShow(i); return; } AB_PK.pend=-1; netSend({t:'abyss',a:'pick',i}); };
    c.append(b); box.append(c);
  });
  $('#abPickN').textContent=abBarArts().length+' / '+AB_ART_MAX; el.hidden=false;
}
function abPickHide(){ AB_PK.offer=null; AB_PK.tiles=null; AB_PK.enc=false; AB_PK.pend=-1; const el=$('#abPick'); if(el) el.hidden=true; abDropHide(); }
// B7, the next-tile choice: the same screen with a card per tile (name, land or cave, the kind of round, a colour chip, some of its monsters); the button below is "Later" (the bar's Next brings it back)
function abTilesShow(list){
  const el=$('#abPick'), box=$('#abPickCards'); if(!el||!box) return;
  const tiles=(list||[]).filter(t=>Array.isArray(t)&&abIsKind(t[1])&&(abIsEncKind(t[1])||abTileOf(t[0]))); if(!tiles.length){ abPickHide(); return; }
  AB_PK.offer=null; AB_PK.tiles=tiles; AB_PK.enc=false; box.innerHTML=''; $('#abPickT').textContent='Choose the next round'; $('#abPickN').textContent=''; $('#abSkip').textContent='Later';
  tiles.forEach((t,i)=>{   // B8: a card's colour, icon and name are its kind's; an Event / Shrine card has no tile
    const T=abTileOf(t[0]), K=abKindChip(t[1],t[2]), c=abMk('div','ab-card ab-tilec ab-k-'+t[1]), chip=abMk('div','ab-chipc'); chip.style.background=K.col;
    const names=T?T.pool.slice(0,4).map(id=>{ const d=ALL_MON_DEFS.find(m=>m.id===id); return d?d.name:id; }).join(', ')+'...':'';
    c.append(chip,abMk('b','ab-nm',K.icon+' '+(T&&t[1]!=='trial'?T.name:K.name)),abMk('div','ab-rar',T?(T.kind==='cave'?'cave':'land')+(t[1]==='trial'?' · '+T.name:'')+' · '+K.name:K.name),abMk('p','ab-tx',K.line),abMk('p','ab-tx',names),abMk('div','ab-held',K.pays));
    const b=abMk('button','chip buy ab-pick','Go here'); b.type='button'; b.onclick=()=>abTilePick(i); c.append(b); box.append(c);
  });
  el.hidden=false;
}
function abTilePick(i){ if(!AB_PK.tiles||!AB_UI.won) return; UI_SFX.click(); AB_UI.won=false; abBar(false); netSend({t:'abyss',a:'next',i}); abPickHide(); }
// the discard dialog: pend >= 0 = the offer's card that wanted a place (thrown copy first, then the pick is retried)
function abDropShow(pend){
  const el=$('#abDrop'), box=$('#abDropList'); if(!el||!box) return; AB_PK.pend=pend===undefined?-1:pend; box.innerHTML='';
  $('#abDropT').textContent=AB_PK.pend>=0?'Your bar is full ('+abBarArts().length+' / '+AB_ART_MAX+'): throw a copy away to take the new one.':'Throw a copy away (between rounds only).';
  for(const [id,n,first] of abGroups()){
    const a=AB_ARTS[id]; if(!a) continue; const b=abMk('button','ab-dr ab-'+a.rar); b.type='button';
    b.append(abMk('span','ab-ic',a.icon),abMk('span','ab-nm',a.name+(n>1?' x'+n:'')),abMk('span','ab-tx',a.text+(a.minus?' '+a.minus:'')));
    b.onclick=()=>{ UI_SFX.click(); const pend=AB_PK.pend; netSend({t:'abyss',a:'drop',i:first}); abDropHide();
      if(pend>=0){ AB_PK.ign=1; netSend({t:'abyss',a:'pick',i:pend}); } };   // the retry: the drop's aba comes first and must not close the pick screen
    box.append(b);
  }
  el.hidden=false;
}
function abDropHide(){ const el=$('#abDrop'); if(el) el.hidden=true; AB_PK.pend=-1; }
// the bar: one tile per artifact with its copies; a tap between rounds opens the discard dialog
function abArtsRender(){
  const el=$('#abArts'); if(!el) return; const arts=abBarArts(), cur=abBarCurses(), run=NET.ab&&(dgIn()||AB_UI.won);
  AB_PK.sig=arts.join(',')+'|'+cur.join(',')+'|'+(run?1:0); el.hidden=!run||(!arts.length&&!cur.length); el.innerHTML='';
  if(el.hidden) return;
  el.append(abMk('span','ab-cnt',arts.length+' / '+AB_ART_MAX));
  for(const [id,n] of abGroups()){
    const a=AB_ARTS[id]; if(!a) continue; const t=abMk('button','ab-tile ab-'+a.rar); t.type='button'; t.title=a.name+(n>1?' x'+n:'')+': '+a.text+(a.minus?' Price: '+a.minus:'');
    t.append(abMk('span','ab-ic',a.icon)); if(n>1) t.append(abMk('i','ab-n',String(n)));
    t.onclick=()=>{ if(AB_UI.won) abDropShow(-1); else toast('Artifacts can be thrown away between rounds.',''); };
    if(a.minus) t.classList.add('ab-wild');
    el.append(t);
  }
  if(cur.length){   // B6: the curses, their own row, outside the 20 (a tap shows what each does)
    const row=abMk('div','ab-curses'); row.append(abMk('span','ab-cnt','Curses '+cur.length+' / '+AB_CURSE_MAX));
    for(const id of cur){ const c=AB_CURSES[id], t=abMk('button','ab-tile ab-curse'); t.type='button'; t.title=c.name+': '+c.text; t.append(abMk('span','ab-ic',c.icon)); t.onclick=()=>toast(c.name+': '+c.text,'bad'); row.append(t); }
    el.append(row);
  }
}
function abChoiceUpdate(){
  const run=!!(NET.ab&&(dgIn()||AB_UI.won)), sig=abBarArts().join(',')+'|'+abBarCurses().join(',')+'|'+(run?1:0);
  if(sig!==AB_PK.sig) abArtsRender();
  if(!run&&(AB_PK.offer||AB_PK.tiles||AB_PK.enc)) abPickHide();   // the run is gone (a fall, out, a close)
}
// an offer: abo [pid, 'art', ids]
EVH.abo=e=>{ if(e[1]!==NET.pid) return; if(e[2]==='art') abPickShow(e[3]); else if(e[2]==='tile') abTilesShow(e[3]); else if(e[2]==='event') abEncShow('event',e[3],e[4]); else if(e[2]==='shrine') abEncShow('shrine',e[3]); };   // B8: encounters   // B7: 'tile' = the next-tile offer
// a copy taken or thrown away: aba [pid, id, copies]; the pick screen closes when the pick landed
EVH.aba=e=>{
  if(e[1]!==NET.pid) return; const a=abIsArt(e[2])?AB_ARTS[e[2]]:null, n=e[3]|0;
  if(a) toast(n>0?a.name+(n>1?' x'+n:'')+' on your bar.':a.name+' thrown away.','');
  if(AB_PK.ign>0){ AB_PK.ign--; abArtsRender(); return; }
  if(AB_PK.offer&&n>0&&AB_PK.offer.includes(e[2])) abPickHide();
  abArtsRender();
};
