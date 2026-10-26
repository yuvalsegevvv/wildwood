//@ The 5th skill slot on the server (the set burst): owning it, wearing it, the cast with its fixed cooldown, and the 5 s stun with its 50 s per-enemy lock
/* Agent map. Rules: docs/ULT.md; registry and constants: shared/ult.js; test: tools/ult-smoke.js.
   Saved: gear.skills.ult = the worn burst's SET id or null (sanitizeSkills; sanitizeGear clears it unless ultOwned). Ownership is derived (3 of the set's 7 pieces), never saved.
   p.cd.ult is written ONLY here (ultCastP): no abilityCd, rlP cdr, ally haste, ssCdrS (its loop stays on the three class slots) or boost cdr ever touches it.
   CAST: atk {k:'ult'} (handleAttack) needs: alive, not acting, not on the Proving Isle (p.pv), level 35, a burst worn and owned, p.cd.ult ~ 0. It starts the cooldown (60 s, or 30 s for a grind set outside a
   boss fight: p.cave.fight; fixed at the cast), runs the ability's fxU through p.act (like a cave cast) and does NOT go through caveCastS (no charge, Echo cannot repeat it), ssTriggerS or mqActP.
   STUN: statusS sees ult:true on a shape entry (shared/ult.js ultFxOf) and calls ultStunS(m): players, the dead and immune bosses are skipped; m.ultLock (on the monster, shared by every player) blocks a second
   burst stun for 50 s; a normal or heavy monster gets m.stunT=5; a boss gets B.ultStunT (never B.stunT: no x1.5 damage, no kit 'strike now' window), queued in B.ultStunQ behind a kit's own stun. resetBossS clears the lock.
   Messages: ultequip {id|null} (MSG.ultequip). Events: ult [pid, setId, cd seconds], ultget [pid, setId]. Hooks are marked `// ult:` (grep -rn "// ult:" src). */
const ultSetOfP=p=>{ const id=p.gear&&p.gear.skills&&p.gear.skills.ult; return ultDef(id)&&ultOwned(p.gear.skills,p.gear.cave,id)?id:null; };   // the worn burst's set id if p may use it, else null
// the burst's ability if p may cast it now (level 35, not on the island, worn and owned), else null
function ultEquippedP(p){ if(p.pv||p.level<ULT_LV) return null; const id=ultSetOfP(p); return id?ultDef(id):null; }
function ultCastP(p,msg){   // atk {k:'ult'}
  if(p.dead||p.act||p.cd.ult>0.08) return;
  const ab=ultEquippedP(p); if(!ab) return;
  p.cd.ult=ultCdOf(ab.set,!!(p.cave&&p.cave.fight)); if(p.cave) p.cave.cur=null;   // the timer is fixed now; a pending cave charge is not paid by the burst's hits
  const [kind,dur,hitAt]=ab.act;
  if(isFinite(+msg.face)) p.face=+msg.face%(2*Math.PI);
  const tg=foeByIdS(p,msg.tg);
  const aim=Array.isArray(msg.aim)&&msg.aim.length===3&&msg.aim.every(v=>isFinite(+v))?norm3(msg.aim.map(Number)):[-Math.sin(p.face),0,-Math.cos(p.face)];
  p.act={kind,t:0,dur,hitAt,done:false,skill:true,sid:ab.id,lvl:1,el:elOf(ab),fx:ab.fxU,mult:ab.mult,range:ab.range,tg:tg&&!tg.dead?tg.id:null,aim,ult:true};
  ev('pact',p.id,kind,Math.round(p.face*100)/100);
  ev('ult',p.id,ab.set,p.cd.ult);
}
function ultEquipP(p,id){   // ultequip: wear an owned burst, or take it off (id null)
  if(id===null||id===undefined||id===''){ if(p.gear.skills.ult){ p.gear.skills.ult=null; p.dirty=true; } return; }
  if(!ultDef(id)||!ultOwned(p.gear.skills,p.gear.cave,id)) return;
  if(p.level<ULT_LV){ toastTo(p.id,'The burst slot opens at level '+ULT_LV,'bad'); return; }
  p.gear.skills.ult=id; p.dirty=true;
}
MSG.ultequip=(p,msg)=>ultEquipP(p,msg.id);
// p.ultKnown (not saved): the sets whose burst the player already owns, made on join (newPlayer) so only a burst earned later is announced
function ultInitP(p){ p.ultKnown=new Set(Object.keys(ULT_SKILLS).filter(id=>ultOwned(p.gear.skills,p.gear.cave,id))); }
// after a piece is earned (ssGrantP, a cave skill learned): tell the player once when a set's burst becomes theirs
function ultCheckP(p){
  if(!p.ultKnown) return;
  for(const id of Object.keys(ULT_SKILLS)){ if(p.ultKnown.has(id)||!ultOwned(p.gear.skills,p.gear.cave,id)) continue; p.ultKnown.add(id);
    toastTo(p.id,'You learned '+ULT_SKILLS[id].name+' (a burst skill)! Wear it in the Burst slot.','loot r3'); ev('ultget',p.id,id); }
}
// the burst's stun on one enemy (statusS, s.ult): see the agent map
function ultStunS(m){
  if(m.pl||m.dead||m.remove||m.immune||(m.ultLock>S.t)) return;
  m.ultLock=S.t+ULT_STUN_LOCK;
  if(m.boss){ const B=m.B; if(B.stunT>0) B.ultStunQ=ULT_STUN; else B.ultStunT=Math.max(B.ultStunT||0,ULT_STUN); }
  else m.stunT=Math.max(m.stunT||0,ULT_STUN);
  m.act=null; m.pendingHit=-1;
}
