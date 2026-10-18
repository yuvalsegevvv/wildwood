//@ Child-safe setting (version 3.2): when on, every character drawn on this device, other players too, is dressed modestly by swapping the bare pieces and un-baring the sets; off by default
/* The setting lives in localStorage ('wildwood-modest' = '1', changed in Settings > Graphics' neighbour, the page reloads to apply it like the graphics level). It only changes how THIS client draws people: nothing is sent or saved.
   buildCharacter (model.js) passes every look through modestLook(L) first: the bare crafted tops (crop, halter, harness) become the tunic, the bare crafted bottoms (loincloth, short shorts, wrap skirt) become trousers.
   The signature outfits that bare skin (Sabir, Genzo, Nephra, Marigold, Torgeir) ask modestOn() in their paint and in Marigold's skirt length. `var` on purpose: the hero is built while the page loads.
   owns: MODEST, modestOn, modestLook.   used by: model.js, outfits/{sabir,genzo,nephra,marigold,torgeir}.js, ui/settings-sound.js.   test: tools/cospieces-smoke.js */
var MODEST=false;
try{ MODEST=localStorage.getItem('wildwood-modest')==='1'; }catch(_){}
function modestOn(){ return MODEST; }
const MODEST_TOP={crop:'tunic',halter:'tunic',harness:'tunic'}, MODEST_BOTTOM={loincloth:'trousers',shortshorts:'trousers',wrapskirt:'trousers'};
// the look with its bare pieces swapped (a copy; the original is left alone)
function modestLook(L){
  if(!MODEST||!L) return L;
  const t=Object.prototype.hasOwnProperty.call(MODEST_TOP,L.top)?MODEST_TOP[L.top]:null, b=Object.prototype.hasOwnProperty.call(MODEST_BOTTOM,L.bottom)?MODEST_BOTTOM[L.bottom]:null;
  if(!t&&!b) return L;
  const o=Object.assign({},L); if(t) o.top=t; if(b) o.bottom=b; return o;
}
