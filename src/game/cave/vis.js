//@ The Deep Cave's skill drawings, the registry: CAVE_VIS by skill id (a cast and the later cvfx / cvhand events), and the routes that send them there
/* Agent map. caveVisDef(id,{cast,event}): cast(p,ab,tgt) draws the cast (p: the caster, P or a remote; ab: the skill row; tgt: your own target, null for other players),
   event(e) is given every cvfx / cvhand event (e[0] is the event name, e[1] the player or x, e[2] the kind: see server/cave-fx.js) and picks out its own.
   The drawings live in vis-floor*.js (one file per floor or half floor), never here. A skill with no entry here is drawn by the generic fxVisuals as before.
   Hooks (grep "// cave:"): attackVisuals (combat/attacks.js) calls caveVisCast; the events come through EVH (net/client.js), registered below.
   Used by: attacks.js, net/client.js (EVH). Test: client-smoke (every skill has an entry and casting each throws nothing). */
const CAVE_VIS=Object.create(null), CAVE_VIS_BAD=[];
function caveVisDef(id,D){
  if(typeof id!=='string'||!caveSkillDef(id)){ CAVE_VIS_BAD.push(String(id)); return null; }
  if(!D||typeof D.cast!=='function'||(D.event!==undefined&&typeof D.event!=='function')){ CAVE_VIS_BAD.push(id); return null; }
  return (CAVE_VIS[id]={cast:D.cast,event:D.event||null});
}
const caveVisCrashed=Object.create(null);   // a drawing that throws is reported once, then skipped for that skill
function caveVisCast(ab,who,mine){   // true when the skill has its own drawing (the generic swing is then not drawn)
  const V=ab&&CAVE_VIS[ab.id]; if(!V) return false;
  if(!caveVisCrashed[ab.id]) try{ V.cast(who||P,ab,mine?CB.target:null); }catch(err){ caveVisCrashed[ab.id]=1; console.error('cave vis cast',ab.id,err); }
  return true;
}
function caveVisEvent(e){
  for(const id in CAVE_VIS){ const V=CAVE_VIS[id]; if(!V.event||caveVisCrashed[id]) continue;
    try{ V.event(e); }catch(err){ caveVisCrashed[id]=1; console.error('cave vis event',id,err); } }
}
EVH.cvfx=caveVisEvent; EVH.cvhand=caveVisEvent;
