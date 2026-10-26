//@ The Deep Cave's methods on the client: the server's state message (cm), the one-line HUD for the method you are in, the board (every floor's eight methods and the skill each gives, in the lift window), the tremor and the vault's seal
/* Agent map. Rules and protocol: docs/CAVE.md section 15, docs/PROTOCOL.md (cm). The server: server/cave/. The props in the floor: method-props.js. Test: tools/client-smoke.js (the cave case), tools/cave-smoke.js.
   exports: CAVE_M = {s (the last cm message), t (when it came), seal (the vault is open here)}, NETH.cm, caveMState() -> the message or null off the floors,
            caveBoardHtml(floor?) (the lift window and the skills panel), caveWhereHtml(skill) (the locked tile's text), caveMethodsEnter(R) / caveMethodsLeave() / caveMethodsFrame(dt) (zone.js, with method-props.js).
   The HUD line #cvMethod shows msg.hud (the server writes the sentence). The vault: while msg.fv.o > 0 the sealed cells are walkable here too (the same rule as the server's), and the boulders at the seal are hidden. */
var CAVE_M={s:null,t:0,seal:false,shakeT:0};   // (var: the net handler is registered at load)
NETH.cm=msg=>{
  CAVE_M.s=msg&&msg.f>0?msg:null; CAVE_M.t=performance.now();
  const el=$('#cvMethod'); if(el){ const txt=msg&&msg.f>0&&msg.hud||''; el.textContent=txt; el.hidden=!txt; }
  caveMSeal(!!(msg&&msg.fv&&msg.fv.o>0));
};
const caveMState=()=>CAVE_RUN&&CAVE_M.s&&CAVE_M.s.f===CAVE_RUN.n?CAVE_M.s:null;
// the vault's seal: walkable on the server while it is open; mirror it so the walls let you through
function caveMSeal(open){
  const R=CAVE_RUN; if(!R||CAVE_M.seal===open) return;
  CAVE_M.seal=open; for(const k of R.B.sealed) R.B.cells[k]=open?1:0;
  if(open){ CAVE_M.shakeT=1.2; if(typeof camShake!=='undefined') camShake=Math.max(camShake,0.7); }
}
function caveMethodsEnter(R){
  CAVE_M.seal=false; for(const k of R.B.sealed) R.B.open[k]=1;   // (the passage to the vault is drawn as cave; the boulders and the cells keep it shut)
  caveMPropsBuild(R);
}
function caveMethodsLeave(){
  if(CAVE_RUN) for(const k of CAVE_RUN.B.sealed) CAVE_RUN.B.cells[k]=0;   // (the bake is cached: the rock goes back)
  caveMPropsClear(); CAVE_M.s=null; CAVE_M.seal=false; const el=$('#cvMethod'); if(el) el.hidden=true;
}
function caveMethodsFrame(dt){
  const R=CAVE_RUN, s=caveMState(); if(!R) return;
  if(s&&s.fv){ if(s.fv.w>0&&s.fv.w<=8&&typeof camShake!=='undefined') camShake=Math.max(camShake,0.12+0.03*(8-s.fv.w)); }   // the tremor rumbles before the vault opens
  if(CAVE_M.shakeT>0) CAVE_M.shakeT-=dt;
  caveMPropsFrame(dt,s);
}
// ---- the board ----
function caveBoardHtml(floor){
  const own=GEAR&&GEAR.cave&&GEAR.cave.own||{}, cd=GEAR&&GEAR.cave&&GEAR.cave.cd||{}, now=Date.now()/1000, floors=floor?[floor]:CAVE_FLOOR_N;
  let h='<div class="cv-board">';
  for(const n of floors){ const F=caveFloorDef(n); if(!F) continue;
    h+=`<h4>Floor ${n} · ${F.name}</h4><ul>`;
    for(const r of caveBoardRows(n)){
      const left=Math.max(0,(cd[n+r.m]||0)-now), pay=r.skill?(Object.prototype.hasOwnProperty.call(own,r.skill.id)?`${r.skill.name} <i>(yours: pays Echo Shards)</i>`:`<b>${r.skill.name}</b>`):'Echo Shards';
      h+=`<li><span class="m">${r.m}</span> <span class="n">${r.name}</span> <span class="s">${pay}${left>0?` · rests ${Math.ceil(left/60)} min`:''}</span><small>${r.short}</small></li>`; }
    h+='</ul>'; }
  return h+'</div>';
}
function caveWhereHtml(s){ const M=caveMethodDef(s.method); return M?`${M.name}, ${caveFloorDef(s.floor).name} (method ${s.method}): ${M.short.toLowerCase()}`:'earned in the Deep Cave'; }
