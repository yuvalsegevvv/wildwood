//@ The Abyss's next-tile choice (B7, kinds B8): after a won round and its artifact offers, 3 cards are drawn (a tile and a round kind each), stored in gear.ab.run.offer and sent; next,i picks one against the stored offer
/* agent map (docs/ABYSS.md section 3f; the rows: shared/abyss/tiles.js)
   B8: every card has a kind (AB_KIND_W weights, abDrawKindsS: round 1 is a Fight, a guaranteed Event or Shrine in rounds 4-6, 10-12...; abKindDev.force pins the kind for tests and the dev tools); an Event / Shrine card has no tile (tile ''), a Trial card a `mode`
   exports: abKindDev ({force}), abDrawKindsS(d,r,es,n), abRandTileS(avoid) (a random tile id, not `avoid` when another exists; '' with no tile defined), abDrawTilesS(avoid) (up to AB_TILE_OFFER_N different ids), abTileOfferP(p) (store + send), abTileSendP(p) (send the stored one again),
            abTilePickP(p,i) (the card {tile,kind,mode} the stored offer names at index i; '' with no offer pending = the old behaviour; null = refused, with a toast for a pending artifact / encounter offer)
   save: gear.ab.run.offer = {k:'tile', o:[{tile:id|'', kind, mode?}]} (B9 adds the boss); gear.ab.run.es = the round of the last Event / Shrine played; event abo [pid,'tile',[[tile,kind,mode],...]]; message abyss{a:'next',i}
   used by: server/abyss/rounds.js (abGoP: round 1 is a random tile; abNextP; abRoundWonS), arts.js (the offer follows a resolved artifact offer: abPickP, abSkipP, abResendOfferP)
   test: tools/abyss-smoke.js */
const AB_TILE_OFFER_N=3;
function abDrawTilesS(avoid){
  const pool=AB_TILE_IDS.filter(id=>id!==avoid); if(pool.length<AB_TILE_OFFER_N) for(const id of AB_TILE_IDS) if(!pool.includes(id)) pool.push(id);
  const out=[]; while(out.length<AB_TILE_OFFER_N&&pool.length) out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  return out;
}
const abRandTileS=avoid=>{ const o=abDrawTilesS(avoid); return o.length?o[Math.floor(Math.random()*o.length)]:''; };
// the kinds of the cards of an offer FOR round r (d: the difficulty; es: the round of the last Event / Shrine played): by weight; the last round of a finite difficulty is never an Event or a Shrine (it wins the run);
// inside a guarantee window (abEncWindow) that has had none yet, one card is an Event or a Shrine, and in the window's last round every card is
const abKindDev={force:'',mode:''};
function abDrawKindsS(d,r,es,n){
  if(abKindDev.force) return Array(n).fill(abKindDev.force);
  const rounds=abRounds(d), last=rounds&&r>=rounds, ks=AB_KIND_IDS.filter(k=>AB_KIND_W[k]>0&&!(last&&abIsEncKind(k)));
  const draw=list=>{ let tw=0; for(const k of list) tw+=AB_KIND_W[k]; let q=Math.random()*tw; for(const k of list){ q-=AB_KIND_W[k]; if(q<=0) return k; } return list[0]; };
  const out=Array.from({length:n},()=>draw(ks)), w0=abEncWindow(r);
  if(w0&&!last&&(es|0)<w0){ const enc=['event','shrine'];
    if(r-w0>=2) for(let i=0;i<n;i++) out[i]=draw(enc); else if(!out.some(abIsEncKind)) out[n-1]=draw(enc); }
  return out;
}
// the offer of the tiles to come: drawn, STORED, then told (a reopen shows the very same offer)
function abTileOfferP(p){
  const g=abSaveOf(p), run=abRunOf(p); if(!g.run||!run||!run.abWon||run.endT) return;
  const ids=abDrawTilesS(run.tile?run.tile.id:''); if(!ids.length) return;   // (no tile defined: next works as it did, with the plain platforms)
  const kinds=abDrawKindsS(run.abD,run.abR+1,g.run.es,ids.length);
  g.run.offer={k:'tile',o:ids.map((tile,i)=>{ const kind=kinds[i];
    return abIsEncKind(kind)?{tile:'',kind}:kind==='trial'?{tile,kind,mode:abKindDev.mode||AB_TRIAL_IDS[Math.floor(Math.random()*AB_TRIAL_IDS.length)]}:{tile,kind}; })}; p.dirty=true; abTileSendP(p);
}
function abTileSendP(p){ const o=abSaveOf(p).run&&abSaveOf(p).run.offer; if(o&&o.k==='tile') dgEvTo('abo',p.id,'tile',o.o.map(t=>[t.tile,t.kind,t.mode||''])); }
// next,i: i is an integer index against the stored offer; a pending artifact offer or a bad i is refused
function abTilePickP(p,i){
  const g=abSaveOf(p), o=g.run&&g.run.offer;
  if(!o) return '';
  if(o.k!=='tile'){ toastTo(p.id,o.k==='art'?'Pick an artifact or skip the offer first.':'Choose on the card first.','bad'); return null; }
  if(!abIdx(i,o.o.length)) return null;
  const t=o.o[i]; return abIsEncKind(t.kind)||abTileOf(t.tile)?t:null;
}
