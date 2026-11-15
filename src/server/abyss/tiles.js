//@ The Abyss's next-tile choice (B7): after a won round and its artifact offer, 2-3 tiles are drawn, stored in gear.ab.run.offer and sent; next,i picks one against the stored offer
/* agent map (docs/ABYSS.md section 3f; the rows: shared/abyss/tiles.js)
   exports: abRandTileS(avoid) (a random tile id, not `avoid` when another exists; '' with no tile defined), abDrawTilesS(avoid) (up to AB_TILE_OFFER_N different ids), abTileOfferP(p) (store + send), abTileSendP(p) (send the stored one again),
            abTilePickP(p,i) (the tile id the stored offer names at index i; '' with no offer pending = the old behaviour; null = refused, with a toast for a pending artifact offer)
   save: gear.ab.run.offer = {k:'tile', o:[{tile:id, kind:'fight'}]} (B8 adds kinds, B9 bosses); event abo [pid,'tile',[[tile,kind],...]]; message abyss{a:'next',i}
   used by: server/abyss/rounds.js (abGoP: round 1 is a random tile; abNextP; abRoundWonS), arts.js (the offer follows a resolved artifact offer: abPickP, abSkipP, abResendOfferP)
   test: tools/abyss-smoke.js */
const AB_TILE_OFFER_N=3;
function abDrawTilesS(avoid){
  const pool=AB_TILE_IDS.filter(id=>id!==avoid); if(pool.length<AB_TILE_OFFER_N) for(const id of AB_TILE_IDS) if(!pool.includes(id)) pool.push(id);
  const out=[]; while(out.length<AB_TILE_OFFER_N&&pool.length) out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  return out;
}
const abRandTileS=avoid=>{ const o=abDrawTilesS(avoid); return o.length?o[Math.floor(Math.random()*o.length)]:''; };
// the offer of the tiles to come: drawn, STORED, then told (a reopen shows the very same offer)
function abTileOfferP(p){
  const g=abSaveOf(p), run=abRunOf(p); if(!g.run||!run||!run.abWon||run.endT) return;
  const ids=abDrawTilesS(run.abTile); if(!ids.length) return;   // (no tile defined: next works as it did, with the plain platforms)
  g.run.offer={k:'tile',o:ids.map(tile=>({tile,kind:'fight'}))}; p.dirty=true; abTileSendP(p);
}
function abTileSendP(p){ const o=abSaveOf(p).run&&abSaveOf(p).run.offer; if(o&&o.k==='tile') dgEvTo('abo',p.id,'tile',o.o.map(t=>[t.tile,t.kind])); }
// next,i: i is an integer index against the stored offer; a pending artifact offer or a bad i is refused
function abTilePickP(p,i){
  const g=abSaveOf(p), o=g.run&&g.run.offer;
  if(!o) return '';
  if(o.k!=='tile'){ toastTo(p.id,'Pick an artifact or skip the offer first.','bad'); return null; }
  if(!abIdx(i,o.o.length)) return null;
  const t=o.o[i]; return abTileOf(t.tile)?t.tile:null;
}
