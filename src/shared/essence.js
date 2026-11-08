//@ Essence: the seven materials the elemental rifts pay and the Awakening trees spend (one per element, and Prime Essence): ids, names, colours, the lookup. Pure; loaded by both sides
/* Agent map (skills revamp step 17a; PLAN section 5; the prices that ask for them: awakening-cost.js, awkEssenceId; the rifts that pay them: rift.js, rift/<id>.js).
   exports: ESS_ORDER (the ids: ess_fire ess_water ess_air ess_earth ess_light ess_dark ess_prime), ESSENCE (id -> {id, key, name}; no prototype), ESS_PRIME_COL,
            essOf(id) (the row or null; own properties only, a string from a save or a client is never a key), essIdOf(key) ('fire'..'dark' | 'prime' -> the id or null), essCol(id) (the icon's colour: the element's, Prime is gold).
   Held in gear.awm[id] (server/awakening.js awkSanitize clamps each to MAT_MAX; rift runs pay them: server/rift.js RIFT_PAY.essence; the Awakening purchase takes them: awkPlanP);
   shown by game/ui/item-icons.js (essIcon), game/economy/inventory.js and the Awakening panel (game/awakening/costs.js). Test: tools/rift-smoke.js, tools/awakening-server-smoke.js. */
const ESSENCE=Object.create(null), ESS_ORDER=[], ESS_PRIME_COL='#e6c46a';
for(const [key,name] of [['fire','Fire Essence'],['water','Water Essence'],['air','Air Essence'],['earth','Earth Essence'],['light','Light Essence'],['dark','Dark Essence'],['prime','Prime Essence']]){
  ESSENCE['ess_'+key]=Object.freeze({id:'ess_'+key,key,name}); ESS_ORDER.push('ess_'+key); }
const essOf=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(ESSENCE,id)?ESSENCE[id]:null;
const essIdOf=key=>typeof key==='string'&&essOf('ess_'+key)?'ess_'+key:null;
const essCol=id=>{ const e=essOf(id); return e&&e.key!=='prime'&&ELEMS[e.key]?ELEMS[e.key].col:ESS_PRIME_COL; };
