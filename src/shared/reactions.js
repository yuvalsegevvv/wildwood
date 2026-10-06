//@ Elemental reactions (rules, pure): the constants, each element's flavour and the reaction registry defineReaction that builds the chart
/* Agent map. Plan, rules and what is built: docs/REACTIONS.md (read it first); test: tools/reactions-smoke.js.
   Exports: RX_ON, RX_* (the numbers below), RX_FLAVORS, RX_CHART, RX_BAD, defineReaction(d), rxPairKey(a,b), rxChartOf(a,b), rxChartMissing(), rxEffect(el,k).
   Used by: server/reactions.js (the engine), game/combat/reactions.js (names and colours of the display); the rows are in reactions-chart.js.
   All numbers are first guesses (balanced in playtests): change a constant here and nothing else.
   An element's FLAVOUR is one general status; a reaction applies both elements' flavours at k of their strength (RX_REACT_K), a skill's flavor key applies one at
   full strength (RX_DIRECT_K). Strength scales the magnitude of vuln / weak / burn and the time of slow / stun; spread has no strength. */
const RX_ON=true;                       // the master switch: false and no aura, no reaction, no flavor key, no vuln or weak does anything
const RX_AURA_DUR=6;                    // seconds an aura lasts (a refresh by the same element restarts it)
const RX_REACT_K=0.7, RX_DIRECT_K=1;    // the strength of each flavour in a reaction / of a skill's direct flavor
const RX_ICD=3;                         // seconds before the same pair may react again on the same monster
const RX_SPREAD_R=6;                    // metres: how far a spread copies the consumed aura
const RX_ST_CAP={vuln:0.30,weak:0.30};  // the most a monster can take more / deal less, however many sources
const RX_ST_KINDS=['vuln','weak','slow','stun'];   // what a skill's status key may name
const RX_FLAVORS={   // at strength 1; dur in seconds, v a share (0.25 = 25%), k a share of the hit's damage every second
  fire: {burn:{dur:4,k:0.25}},   // the existing burn
  water:{slow:{dur:3}},          // the existing slow
  earth:{stun:{dur:1}},          // not on bosses or heavy enemies, as every stun
  air:  {spread:true},           // the consumed aura is copied onto enemies within RX_SPREAD_R
  dark: {weak:{v:0.25,dur:6}},   // the monster deals less
  light:{vuln:{v:0.20,dur:6}}    // the monster takes more
};
const RX_CHART={}, RX_BAD=[];   // pair key ('fire|water': the two elements in alphabetical order) -> {key,a,b,name,k,burst}; RX_BAD lists the rows left out and why
const rxPairKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const rxChartOf=(a,b)=>RX_CHART[rxPairKey(a,b)]||null;
// one row of the chart: {a, b, name, [k: strength of both flavours, default RX_REACT_K], [burst: bonus damage as a share of the triggering hit]}
function defineReaction(d){
  const why=[], id=d&&d.a&&d.b?rxPairKey(d.a,d.b):'?';
  if(!d||typeof d!=='object') why.push('not an object');
  else {
    if(!RX_FLAVORS[d.a]||!RX_FLAVORS[d.b]) why.push('a and b must be elements with a flavour');
    else if(d.a===d.b) why.push('a and b are the same element (a reaction needs two)');
    if(typeof d.name!=='string'||!d.name.trim()) why.push('a name is needed');
    if(d.k!==undefined&&!(d.k>0&&d.k<=1)) why.push('k must be above 0 and at most 1');
    if(d.burst!==undefined&&!(d.burst>0&&d.burst<=2)) why.push('burst must be above 0 and at most 2');
    if(!why.length&&RX_CHART[id]) why.push('this pair is already defined');
  }
  if(why.length){ RX_BAD.push({id,why:why.join('; ')}); if(typeof console!=='undefined') console.warn('reaction left out ('+id+'): '+why.join('; ')); return null; }
  return (RX_CHART[id]={key:id,a:d.a<d.b?d.a:d.b,b:d.a<d.b?d.b:d.a,name:d.name.trim(),k:d.k||RX_REACT_K,burst:d.burst||0});
}
// the pairs the chart does not have yet (a complete chart has none: six elements make fifteen)
function rxChartMissing(){ const E=Object.keys(RX_FLAVORS), out=[]; for(let i=0;i<E.length;i++) for(let j=i+1;j<E.length;j++) if(!rxChartOf(E[i],E[j])) out.push(rxPairKey(E[i],E[j])); return out; }
// an element's flavour at strength k, as plain numbers (null for an element with none)
function rxEffect(el,k){
  const F=RX_FLAVORS[el]; if(!F) return null; const o={};
  if(F.burn) o.burn={dur:F.burn.dur,k:F.burn.k*k};
  if(F.slow) o.slow=F.slow.dur*k;
  if(F.stun) o.stun=F.stun.dur*k;
  if(F.weak) o.weak={v:F.weak.v*k,dur:F.weak.dur};
  if(F.vuln) o.vuln={v:F.vuln.v*k,dur:F.vuln.dur};
  if(F.spread) o.spread=true;
  return o;
}
