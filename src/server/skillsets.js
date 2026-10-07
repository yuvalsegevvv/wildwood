//@ Skill sets on the server: granting a set's pieces, wearing a piece for all three classes, the loadout cache p.ss (the sets worn and their bonuses)
/* Agent map. Plan: docs/SKILL-SETS.md; the registry and the checks are shared/skillsets.js; test: tools/skillsets-smoke.js.
   Exports: ssGrantP(p,setId,pos) / ssGrantSetP(p,setId) (the pieces of a position / of the whole set go into gear.skills.owned: a piece is every class version of the active and its passive),
   ssEquipPieceP(p,s) (wear the piece of skill row s for each class that owns its version), ssRefreshP(p) (the cache p.ss = {n:{setId:count}, bonus:[{set,tier,row}], trig:{on:[rows]}, amp:[{id,per}]},
   rebuilt by recalcP: when a piece is worn, a passive moves, the class or the level changes).
   MARKS (a kit's own, personal, they stack): m.mk[playerId][markId]={n,until}; ssMarkS applies (a skill shape's mark:{id,n,dur,max}, or a row's), fx.pop spends them (ssPopS), a row's amp:{id,per} makes
   the owner's marked targets take more (ssAmpK), they die with the monster (ssClearS). Event mk [monId, markId, n, dur, ownerId] (only the owner draws it).
   SKILL MODIFIERS of a fx (fxModK): vsBoss, behind, rangeScale: a multiplier on each of the skill's hits, read where the hit is made (resolveFxS, impactFxS, updateAreasS).
   TRIGGERS (ssTriggerS(p,kind,ctx), kinds hit crit kill hurt cast1-3 tick low): the worn passives' and bonuses' rows with on:, each with chance and icd; a trigger never fires a trigger (ssDepth), its damage
   leaves no aura (rxQuietS). Effects: fx (resolveFxS with a synthetic action), heal, mark, status; buff and shield are the ally effects (docs/SKILL-SETS.md 6.3).
   ALLIES (docs/SKILL-SETS.md 6.3): the general buffs p.ally[kind]={v,until,by} (might, guard, haste, crit, critdmg, regen), a shield pool p.shield={v,until}, never stacking (the stronger wins, an equal one
   refreshes, a smaller one is ignored), read at the one place each number is used (allyP: rollDmgS, hurtP, handleAttack, updatePlayersS); a heal, a buff or a shield reaches the caster and their party
   within r metres in the same run (ssAlliesOf), and always the caster alone when there is no party. A skill's fx carries them as ally / heal / shield (ssFxUtilS) and a zone's as it ticks (ssZoneAlliesS).
   TAUNT: m.taunt={by,until}; the monster's own target code reads it (monsters.js, boss.js, dungeons/mobs.js); a boss takes SS_TAUNT_BOSS of the time, none while enraged; a run's kit-driven monsters (dgOwn) ignore it.
   Events: ast [pid, kind, v, dur] (a buff set or replaced, for the buffed player's own display).
   reflect (a passive stat, read in hurtP) deals a share of the damage taken back to the attacker (ssRawHitS: a hit that is not a skill's, no aura, no triggers).
   Used by: economy.js (equipSkillP, unequipSkillP, buySkillP, upgradeSkillP, the testing tool 'set'), players.js (recalcP, psP, sanitizeSkills, hurtP, updatePlayersS), combat.js (the hooks marked skillsets).
   A piece is earned (M3's sources, not built yet) or given by the testing tool: never free, never bought, never upgraded in v1. Events: ssget [pid, setId, pos], mk. */
function ssPieceIdsOf(setId,pos){ const S=SS_SETS[setId], P=S&&S.pos[pos]; return P?[...P.ids,P.passive]:[]; }
function ssGrantP(p,setId,pos){
  const own=p.gear.skills.owned; let n=0;
  for(const id of ssPieceIdsOf(setId,pos)) if(!own.includes(id)){ own.push(id); n++; }
  if(n){ p.dirty=true; ev('ssget',p.id,setId,pos); }
  return n;
}
function ssGrantSetP(p,setId){ let n=0; for(let pos=1;pos<=3;pos++) n+=ssGrantP(p,setId,pos); return n; }
// wear the piece of skill row s in its slot for every class that owns a version of it (one action for all three: a weapon swap must not silently drop the set)
function ssEquipPieceP(p,s){
  const S=p.gear.skills, P=SS_SETS[s.set].pos[s.pos], need=Math.max(slotLv(s.slot),s.lv);
  if(p.level<need){ toastTo(p.id,s.name+' needs level '+need,'bad'); return false; }
  let worn=false;
  for(const c of SS_CLASSES){
    const vid=P.bound==='any'?P.ids[0]:P.ids.find(i=>SKILLS[i].cls===c);
    if(!vid||!S.owned.includes(vid)||!canSwap(c,s.slot,S)) continue;
    S.eq[c][s.slot]=vid; worn=true;
  }
  if(worn){ recalcP(p); p.dirty=true; }
  return worn;
}
// the sets worn by the class in hand: how many pieces of each, the bonus rows in force, and the triggered rows and amplifiers of the worn passives and those bonuses (read at run time)
function ssRefreshP(p){
  const sk=p.gear.skills, cls=clsOfP(p), bonus=ssBonuses(sk,cls,p.level), trig={}, amp=[];
  const add=r=>{ if(r.on) (trig[r.on]||(trig[r.on]=[])).push(r); if(r.amp) amp.push(r.amp); };
  if(SS_ORDER.length){
    if(Array.isArray(sk.pass)) for(const id of sk.pass.slice(0,passiveOpen(p.level))){ const P=PASSIVES[id]; if(P&&P.set&&sk.owned.includes(id)&&p.level>=Math.max(PASSIVE_LV,P.lv)) add(P); }
    for(const b of bonus) add(b.row);
  }
  p.ss={n:ssCount(sk,cls,p.level),bonus,trig,amp};
}
// ---- marks ----
let ssDepth=0;   // above 0 while a trigger runs: nothing it does fires another trigger
const ssMarkN=(p,m,id)=>{ const e=m&&m.mk&&m.mk[p.id]&&m.mk[p.id][id]; return e&&e.until>S.t?e.n:0; };   // the stacks of the player's mark on a monster
function ssMarkS(p,m,spec){
  if(!m||m.dead||m.remove) return;
  const mine=(m.mk||(m.mk={}))[p.id]||(m.mk[p.id]={}), cur=mine[spec.id], dur=spec.dur||8;
  const n=Math.min(spec.max||5,(cur&&cur.until>S.t?cur.n:0)+(spec.n||1));
  mine[spec.id]={n,until:S.t+dur}; ev('mk',m.id,spec.id,n,dur,p.id);
}
function ssClearS(m){ m.mk=null; }
// fx.pop {id,k,r,heal}: spend the player's marks on the target (and on every monster within r metres of it): k x the skill's damage for each stack; heal: a share of the damage dealt comes back
function ssPopS(p,P,tgt,mult,dmg){
  const hit=[]; if(tgt) hit.push(tgt);
  if(P.r){ const cx=tgt?tgt.x:p.x, cz=tgt?tgt.z:p.z; for(const m of MONS) if(m!==tgt&&!m.dead&&!m.remove&&(m.inst|0)===(p.inst|0)&&Math.hypot(m.x-cx,m.z-cz)<P.r+m.T.rad) hit.push(m); }
  let dealt=0;
  for(const m of hit){ const n=ssMarkN(p,m,P.id); if(!n) continue; delete m.mk[p.id][P.id]; ev('mk',m.id,P.id,0,0,p.id); dealt+=dmg(m,mult*P.k*n); }
  if(P.heal&&dealt) healP(p,dealt*P.heal);
}
// a row's amp:{id,per}: the owner's marked target takes per x stacks more from the owner
function ssAmpK(p,m){
  const A=p.ss&&p.ss.amp; if(!A||!A.length||!m.mk) return 1;
  let k=1; for(const a of A) k+=a.per*ssMarkN(p,m,a.id); return k;
}
// the multiplier of a skill's own modifiers on one hit (f: its fx): vsBoss (against a boss), behind (the attacker is within 60 degrees of straight behind the monster), rangeScale (grows with the distance)
function fxModK(f,p,m){
  if(!f||(!f.vsBoss&&!f.behind&&!f.rangeScale)) return 1;
  let k=1;
  if(f.vsBoss&&m.boss) k*=f.vsBoss;
  if(f.behind){ const dx=p.x-m.x, dz=p.z-m.z, d=Math.hypot(dx,dz)||1; if((-Math.sin(m.face)*dx-Math.cos(m.face)*dz)/d<-0.5) k*=f.behind; }
  if(f.rangeScale){ const R=f.rangeScale; k*=1+(R.k-1)*Math.max(0,Math.min(1,(Math.hypot(p.x-m.x,p.z-m.z)-R.from)/(R.to-R.from))); }
  return k;
}
// damage that is not a skill's (a reflect): through the same health pool (monK), no aura, no triggers
function ssRawHitS(m,v,p){
  if(m.dead||m.remove||m.immune||!(v>0)) return;
  m.hp-=v/monK(m,p).hp; m.hitters.set(p.id,S.t); ev('dmg',m.id,Math.round(v),0,p.id);
  if(m.hp<=0){ m.hp=0; killMonsterS(m,p); }
}
// ---- triggers ----
function ssRunRowS(p,r,ctx){
  const m=ctx&&ctx.m&&!ctx.m.dead&&!ctx.m.remove?ctx.m:null;
  if(r.heal) healP(p,p.maxHp*r.heal);
  if(r.mark&&m) ssMarkS(p,m,r.mark);
  if(r.status&&m) rxDirectS(m,{status:r.status},p,1);
  if(r.buff) for(const q of ssAlliesOf(p,r.buff.r)) ssAllyS(q,r.buff.kind,r.buff.v,r.buff.dur,p.id);
  if(r.shield) for(const q of ssAlliesOf(p)) ssShieldS(q,r.shield.v,r.shield.dur);
  if(r.fx) rxQuietS(()=>resolveFxS(p,{fx:r.fx,mult:r.mult||1,range:r.range||10,el:r.el||'basic',aim:[-Math.sin(p.face),0,-Math.cos(p.face)],sid:null},m));
}
// kind: hit crit kill hurt cast1 cast2 cast3 tick low; ctx: {m, v}. A player with no triggered rows leaves at once.
function ssTriggerS(p,kind,ctx){
  const rows=p.ss&&p.ss.trig&&p.ss.trig[kind]; if(!rows||ssDepth||p.dead) return;
  const icd=p.ssIcd||(p.ssIcd={});
  for(const r of rows){
    if((icd[r.id]||0)>S.t) continue;
    if(kind==='low'&&!(p.hp<p.maxHp*(r.below||0.3))) continue;
    if(r.chance!==undefined&&Math.random()>=r.chance) continue;
    if(r.icd) icd[r.id]=S.t+r.icd;
    ssDepth++; try{ ssRunRowS(p,r,ctx); } finally{ ssDepth--; }
  }
}
// tick rows run every icd seconds while the player is in a fight (dealt damage in the last 6 s)
function ssTickS(p){ if(p.ss&&p.ss.trig&&p.ss.trig.tick&&!p.dead&&S.t-(p.lastDealt||-99)<6) ssTriggerS(p,'tick',{}); }
// a monster hurt a player for v: reflect (the passive stat, at most half) sends a share back, then the on-hurt and on-low rows
function ssHurtS(p,m,v){
  const rf=Math.min(0.5,psP(p,'reflect')); if(rf>0) ssRawHitS(m,v*rf,p);
  ssTriggerS(p,'hurt',{m,v}); if(!p.dead) ssTriggerS(p,'low',{m,v});
}
// ---- allies: buffs, heals, shields ----
// the caster and the members of their party within r metres, in the same run: a buff never crosses between the world and a dungeon, or reaches someone outside the party
function ssAlliesOf(p,r){
  const out=[p], pa=partyOf(p); if(!pa) return out;
  for(const q of partyMembersS(pa)) if(q!==p&&!q.dead&&(q.inst|0)===(p.inst|0)&&Math.hypot(q.x-p.x,q.z-p.z)<=(r||SS_ALLY_R)) out.push(q);
  return out;
}
const allyP=(p,kind)=>{ const a=p.ally&&p.ally[kind]; return a&&a.until>S.t?a.v:0; };   // a buff's value on a player now (0 when none)
function ssAllyS(q,kind,v,dur,by){
  const cap=SS_ALLY_CAP[kind]; if(!cap||!(v>0)) return;
  v=Math.min(v,cap);
  const A=q.ally||(q.ally={}), cur=A[kind], live=!!cur&&cur.until>S.t;
  if(live&&v<cur.v-1e-6) return;
  const equal=live&&Math.abs(v-cur.v)<=1e-6, left=live?cur.until-S.t:0;
  A[kind]={v:equal?cur.v:v,until:equal?Math.max(cur.until,S.t+dur):S.t+dur,by};
  if(!equal||left<dur*0.5) ev('ast',q.id,kind,Math.round(v*100)/100,dur);
}
// a shield: a pool of damage absorbed (a share of the target's own maximum health) for dur seconds; the larger pool wins, it is never added up
function ssShieldS(q,v,dur){
  const pool=q.maxHp*Math.min(1,v), cur=q.shield;
  if(cur&&cur.until>S.t&&cur.v>=pool) return;
  q.shield={v:pool,until:S.t+dur};
}
function ssHealAllS(p,v,r){ for(const q of ssAlliesOf(p,r)) healP(q,q.maxHp*Math.min(SS_HEAL_CAP,v)); }
// the utility keys of a skill's fx (ally, heal, shield, taunt), once, when the skill lands
function ssFxUtilS(p,f){
  if(f.ally) for(const a of Array.isArray(f.ally)?f.ally:[f.ally]) for(const q of ssAlliesOf(p,a.r)) ssAllyS(q,a.kind,a.v,a.dur,p.id);
  if(f.heal) ssHealAllS(p,f.heal.v,f.heal.r);
  if(f.shield) for(const q of ssAlliesOf(p,f.shield.r)) ssShieldS(q,f.shield.v,f.shield.dur);
  if(f.taunt) for(const m of MONS) if(!m.dead&&!m.remove&&(m.inst|0)===(p.inst|0)&&Math.hypot(m.x-p.x,m.z-p.z)<f.taunt.r+m.T.rad) ssTauntS(p,m,f.taunt.dur);
}
// a zone's utility, each tick: the allies standing inside it (the owner included)
function ssZoneAlliesS(o,A){
  const Z=A.fx; if(!Z||!(Z.ally||Z.heal||Z.shield)) return;
  for(const q of ssAlliesOf(o,SS_ALLY_R*2)){ if(Math.hypot(q.x-A.x,q.z-A.z)>A.r) continue;
    if(Z.ally) for(const a of Array.isArray(Z.ally)?Z.ally:[Z.ally]) ssAllyS(q,a.kind,a.v,a.dur,o.id);
    if(Z.heal) healP(q,q.maxHp*Math.min(SS_HEAL_CAP,Z.heal.v));
    if(Z.shield) ssShieldS(q,Z.shield.v,Z.shield.dur); }
}
// health from a regen buff
function ssRegenS(p,dt){ const rg=allyP(p,'regen'); if(rg>0&&!p.dead) healP(p,p.maxHp*rg*dt); }
// ---- taunt ----
// the monster comes for p for dur seconds (a boss for SS_TAUNT_BOSS of that, never while it is enraged or shielded); a run's kit-driven monsters ignore it
function ssTauntS(p,m,dur){
  if(m.dgOwn||m.dead||m.remove) return;
  if(m.boss){ if(m.B.enraged||m.immune) return; dur*=SS_TAUNT_BOSS; }
  m.taunt={by:p.id,until:S.t+dur};
}
// the taunter, when m is taunted and they can still be reached (alive, in the same run); a stale taunt is dropped
function ssTauntedBy(m){
  const t=m.taunt; if(!t) return null;
  const q=t.until>S.t?S.players.get(t.by):null;
  if(!q||q.dead||(q.inst|0)!==(m.inst|0)){ m.taunt=null; return null; }
  return q;
}
