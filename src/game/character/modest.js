//@ Child-safe setting (version 3.2): when on, every character drawn on this device, other players too, is dressed modestly by swapping the bare pieces and un-baring the sets; off by default
/* The setting lives in localStorage ('wildwood-modest' = '1', changed in Settings > Graphics' neighbour, the page reloads to apply it like the graphics level). It only changes how THIS client draws people: nothing is sent or saved.
   buildCharacter (model.js) passes every look through modestLook(L) first: the empty top becomes a t-shirt and the bare crafted tops and every dress become the tunic; the empty bottom, the loincloth, short shorts and wrap skirt become trousers, shorts breeches, the pleated skirt a skirt, and skirts are lengthened to the knee.
   The signature outfits that bare skin (Sabir, Genzo, Nephra, Marigold, Torgeir) ask modestOn() in their paint and in Marigold's skirt length. `var` on purpose: the hero is built while the page loads.
   owns: MODEST, modestOn, modestLook, MODEST_TOP, MODEST_BOTTOM.   used by: model.js, outfits/{sabir,genzo,nephra,marigold,torgeir}.js, ui/settings-sound.js.   test: tools/modest-smoke.js (coverage of every look), cospieces-smoke */
var MODEST=false;
try{ MODEST=localStorage.getItem('wildwood-modest')==='1'; }catch(_){}
function modestOn(){ return MODEST; }
// what stands in for each bare piece. tools/modest-smoke.js measures the result (every look, both bodies, the shortest skirt): when it finds a look that still shows the belly, the back, the shoulders or the thighs above the knee, add that piece here.
const MODEST_TOP={none:'tshirt',crop:'tunic',halter:'tunic',harness:'tunic',bikini:'tunic',sundress:'tunic',peasant:'tunic',tiered:'tunic',mermaid:'tunic',ballgown:'tunic',wrapdress:'tunic'};
const MODEST_BOTTOM={none:'trousers',loincloth:'trousers',shortshorts:'trousers',bikinibottom:'trousers',wrapskirt:'trousers',shorts:'breeches',pleated:'skirt'};
const MODEST_SKIRT_LEN={skirt:1.3,kilt:1.15};   // the shortest skirtLen that still reaches the knee (the skirt's own length is 0.4 / 0.46 m: shared/character.js skirtLen, model-garments.js gmSkirt)
const MODEST_SET_TOP=['atuqa','tzaya','meleni','nephra','ottoline','sefi','tamsin','zahra'], MODEST_SET_BOTTOM=['marigold','meleni','nephra','sefi','tzaya'];   // signature pieces that bare skin and are swapped for the plain stand-in (the other sets' own paint asks modestOn())
const modestHas=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
// the look with its bare pieces swapped (a copy; the original is left alone). Runs AFTER gmxAliasLook (the Sigil pieces are their base silhouettes by then, and a dress's bottom is 'none': it becomes trousers under the tunic)
function modestLook(L){
  if(!MODEST||!L) return L;
  const o=Object.assign({},L);
  if(modestHas(MODEST_TOP,o.top)) o.top=MODEST_TOP[o.top]; else if(MODEST_SET_TOP.includes(o.top)) o.top='tunic';
  if(modestHas(MODEST_BOTTOM,o.bottom)) o.bottom=MODEST_BOTTOM[o.bottom]; else if(MODEST_SET_BOTTOM.includes(o.bottom)) o.bottom='trousers';
  if(modestHas(MODEST_SKIRT_LEN,o.bottom)){ const legs=Number.isFinite(o.legs)?Math.max(1,o.legs):1; o.skirtLen=Math.max(Number.isFinite(o.skirtLen)?o.skirtLen:1,MODEST_SKIRT_LEN[o.bottom]*legs); }   // (longer legs, a longer skirt)
  return o;
}
