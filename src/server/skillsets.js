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
   Events: ast [pid, kind, v, dur, piece] (a buff set or replaced, for the buffed player's own display); fxa [pid, 'heal'|'shield', piece] (a heal or a shield reached a player). THE PIECE (ssSrc: a skill id, or the id of a passive / bonus row
   that fired) is also the last field of area, proj, chain and beam events when a set piece caused them, so the client draws them in the set's look (game/skillsets/looks.js); a boss skill's events carry none.
   reflect (a passive stat, read in hurtP) deals a share of the damage taken back to the attacker (ssRawHitS: a hit that is not a skill's, no aura, no triggers).
   Used by: economy.js (equipSkillP, unequipSkillP, buySkillP, upgradeSkillP, the testing tool 'set'), players.js (recalcP, psP, sanitizeSkills, hurtP, updatePlayersS), combat.js (the hooks marked skillsets).
   A piece is earned (M3's sources, not built yet) or given by the testing tool: never free, never bought, never upgraded in v1. Events: ssget [pid, setId, pos], mk. */
function ssPieceIdsOf(setId,pos){ const S=SS_SETS[setId], P=S&&S.pos[pos]; return P?[...P.ids,P.passive]:[]; }
function ssGrantP(p,setId,pos,quiet){
  const own=p.gear.skills.owned; let n=0;
  for(const id of ssPieceIdsOf(setId,pos)) if(!own.includes(id)){ own.push(id); n++; }
  if(n){ p.dirty=true; if(!quiet) ev('ssget',p.id,setId,pos); ultCheckP(p); }   // ult: three of the set's seven pieces grant its burst
  return n;
}
/* ---- where a set comes from (M3, docs/SKILL-SETS.md section 7): the rolls ---- */
const ssRand=()=>Math.random();   // (every roll reads this one function; a test may replace Math.random)
// gear.ss = {pity:{'<set>:<pos>': clears since the last drop}}: only real sets and positions, each count below its pity (reaching it is a sure drop)
function ssSanitizeSave(g){
  const out={pity:{}}, P=g&&typeof g==='object'?g.pity:null; if(!P||typeof P!=='object') return out;
  for(const key of Object.keys(P).slice(0,64)){ const m=/^([a-z0-9]+):([123])$/.exec(key), S=m&&SS_SETS[m[1]]; if(!S||S.dev) continue; out.pity[key]=clampInt(P[key],0,ssOddsOf(S,+m[2]).pity-1,0); }
  return out;
}
// one qualifying clear of source srcId (a world boss's id or a dungeon theme's) by p, fought at +tier: rolls for the land's set of that tier (none at +0). Returns the set id on a drop, else null
function ssClearP(p,srcId,tier){
  const src=ssSourceOf(srcId), set=src&&ssSetFor(src.land,tier|0); if(!set) return null;
  if(ssPieceIdsOf(set.id,src.pos).every(id=>p.gear.skills.owned.includes(id))) return null;   // they own this pair: nothing left to roll
  const ss=p.gear.ss||(p.gear.ss={pity:{}}), key=set.id+':'+src.pos, o=ssOddsOf(set,src.pos), n=(ss.pity[key]|0)+1;
  if(n>=o.pity||ssRand()<o.chance){ ss.pity[key]=0; ssGrantP(p,set.id,src.pos); return set.id; }   // (ssGrantP: the pieces, the ssget event and the client's toast)
  ss.pity[key]=n; p.dirty=true;
  toastTo(p.id,set.char.name+"'s skill set (+"+set.tier+" or above): no drop this time, "+n+' of '+o.pity+' clears to a sure drop ('+Math.round(o.chance*100)+'% each)','');
  return null;
}
// a world boss kill that p helped with: at the tier p fought it at (monTierOf). A dungeon's win: at the run's tier (the leader's; a member needs it unlocked to enter)
const ssBossClearP=(q,m)=>ssClearP(q,m.def.id,monTierOf(q.gear,m));
const ssDungeonClearP=(p,run)=>ssClearP(p,run.theme.id,run.tier);
function ssGrantSetP(p,setId,quiet){ let n=0; for(let pos=1;pos<=3;pos++) n+=ssGrantP(p,setId,pos,quiet); return n; }   // (quiet: no ssget toast for each position)
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
  const cond=[];   // the stat rows (and costs) with a `when`: ssCondP adds them where the fight is known
  const add=(r,lv)=>{ if(r.on) for(const o of [].concat(r.on)) (trig[o]||(trig[o]=[])).push(r); if(r.amp) amp.push(r.amp);
    if(r.stat&&r.when) cond.push({stat:r.stat,v:lv?passiveValue(r.id,lv):r.v[0],when:r.when}); if(r.cost&&r.cost.when) cond.push({stat:r.cost.stat,v:r.cost.v,when:r.cost.when}); };
  if(SS_ORDER.length){
    if(Array.isArray(sk.pass)) for(const id of sk.pass.slice(0,passiveOpen(p.level))){ const P=PASSIVES[id]; if(P&&P.set&&sk.owned.includes(id)&&p.level>=Math.max(PASSIVE_LV,P.lv)) add(P,skillLvOf(sk,id)); }
    for(const b of bonus) add(b.row,0);
  }
  p.ss={n:ssCount(sk,cls,p.level),bonus,trig,amp,cond};
}
// ---- marks ----
let ssDepth=0;   // above 0 while a trigger runs: nothing it does fires another trigger
const ssMarkN=(p,m,id)=>{ const e=m&&m.mk&&m.mk[p.id]&&m.mk[p.id][id]; return e&&e.until>S.t?e.n:0; };   // the stacks of the player's mark on a monster
function ssMarkS(p,m,spec){
  if(!m||m.dead||m.remove||(spec.behind&&!ssBehind(p,m))) return;
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
  if(P.heal&&dealt) healP(p,dealt*P.heal*(1+psP(p,'heal')+ssCondP(p,'heal',tgt)));
}
// a row's amp:{id,per}: the owner's marked target takes per x stacks more from the owner
function ssAmpK(p,m){
  const A=p.ss&&p.ss.amp; if(!A||!A.length||!m.mk) return 1;
  let k=1; for(const a of A) k+=a.per*ssMarkN(p,m,a.id); return k;
}
// ---- conditions: a stat row or a trigger with a `when` (shared/skillsets.js ssWhenProblem lists them) ----
const ssBehind=(p,m)=>{ if(p.cave&&p.cave.fx.behind>S.t) return true;   // cave: Shadow Step's window
  const dx=p.x-m.x, dz=p.z-m.z, d=Math.hypot(dx,dz)||1; return (-Math.sin(m.face)*dx-Math.cos(m.face)*dz)/d<-0.5; };   // within 60 degrees of straight behind the monster
function ssWhen(p,m,w){
  if(!w) return true;
  if(w.moved!==undefined&&!(S.t-(p.lastMove||-99)<=w.moved||(p.cave&&p.cave.fx.moved>S.t))) return false;   // cave: Black Ice keeps Momentum on
  if(w.still!==undefined&&!(S.t-(p.lastMove||-99)>=w.still||(p.cave&&p.cave.fx.still>S.t))) return false;   // cave: Night Line counts as standing still
  if(w.dist){ if(!m) return false; const d=Math.hypot(p.x-m.x,p.z-m.z); if((w.dist.from!==undefined&&d<w.dist.from)||(w.dist.to!==undefined&&d>w.dist.to)) return false; }
  if(w.tgtHp){ if(!m||!(m.maxHp>0)) return false; const h=m.hp/m.maxHp; if((w.tgtHp.above!==undefined&&h<w.tgtHp.above)||(w.tgtHp.below!==undefined&&h>w.tgtHp.below)) return false; }
  if(w.hp){ const h=p.hp/p.maxHp; if((w.hp.above!==undefined&&h<w.hp.above)||(w.hp.below!==undefined&&h>w.hp.below)) return false; }
  if(w.taunting&&!MONS.some(n=>!n.dead&&!n.remove&&n.taunt&&n.taunt.by===p.id&&n.taunt.until>S.t&&(n.inst|0)===(p.inst|0))) return false;
  if(w.marked&&!(m&&ssMarkN(p,m,w.marked)>0)) return false;
  if(w.behind&&!(m&&ssBehind(p,m))) return false;
  if(w.boss&&!(m&&m.boss)) return false;
  if(w.exposed&&!(m&&(m.dead?m.expoDeath:(rxVulnK(m)>0||rxWeakK(m)<1)))) return false;
  if(w.combat&&!(S.t-(p.lastDealt||-99)<6)) return false;
  if(w.shield&&!(p.shield&&p.shield.until>S.t&&p.shield.v>0)) return false;
  if(w.crowd){ let n=0; for(const q of MONS) if(!q.dead&&!q.remove&&(q.inst|0)===(p.inst|0)&&Math.hypot(q.x-p.x,q.z-p.z)<w.crowd.r+q.T.rad*0.5&&++n>=w.crowd.n) break; if(n<w.crowd.n) return false; }
  if(w.allies&&ssAlliesOf(p,w.allies.r).length-1<w.allies.n) return false;
  return true;
}
// the conditional part of a passive stat for this target (m may be null where the stat has no target): added to psP's plain sum where it is read (rollDmgS, hurtP, reactions, heals, buffs)
function ssCondP(p,stat,m){
  const L=p.ss&&p.ss.cond; if(!L||!L.length) return 0;
  let t=0; for(const c of L) if(c.stat===stat&&ssWhen(p,m||null,c.when)) t+=c.v; return t;
}
// a cooldown refund (the cdr effect): seconds taken off the slots' running cooldowns; the client is told (event cdr) because it counts its own bar
function ssCdrS(p,c){
  for(const k of ['basic','skill','burst']){ const sec=(c[k]||0)+(c.all||0); if(sec>0&&p.cd[k]>0){ p.cd[k]=Math.max(0,p.cd[k]-sec); ev('cdr',p.id,k,sec); } }
}
// the stacks of the player's mark on the monsters within r of them (the perMark scaling of an ally buff, a heal or a shield)
const ssMarkSum=(p,id,r)=>{ let n=0; for(const m of MONS) if(!m.dead&&!m.remove&&(m.inst|0)===(p.inst|0)&&Math.hypot(m.x-p.x,m.z-p.z)<(r||12)+m.T.rad) n+=ssMarkN(p,m,id); return n; };
// the multiplier of a skill's own modifiers on one hit (f: its fx): vsBoss (against a boss), behind (the attacker is within 60 degrees of straight behind the monster), rangeScale (grows with the distance)
function fxModK(f,p,m){
  const pk=caveSightK(p,m);   // cave: Eagle's Perch, +% per Sight on the target
  if(!f||(!f.vsBoss&&!f.behind&&!f.rangeScale)) return pk;
  let k=pk;
  if(f.vsBoss&&m.boss) k*=f.vsBoss;
  if(f.behind&&ssBehind(p,m)) k*=f.behind;
  if(f.rangeScale){ const R=f.rangeScale; k*=1+(R.k-1)*Math.max(0,Math.min(1,(Math.hypot(p.x-m.x,p.z-m.z)+caveRangeAdd(p)-R.from)/(R.to-R.from))); }
  return k;
}
// damage that is not a skill's (a reflect): through the same health pool (monK), no aura, no triggers
function ssRawHitS(m,v,p){
  if(m.dead||m.remove||m.immune||!(v>0)) return;
  m.hp-=v/monK(m,p).hp; m.hitters.set(p.id,S.t); ev('dmg',m.id,Math.round(v),0,p.id);
  if(m.hp<=0){ m.hp=0; killMonsterS(m,p); }
}
// ---- triggers ----
// the piece an action comes from, for the events a client dresses in its outfit's look (a triggered row names itself in src; a skill is a piece when it has a set)
const ssSrc=a=>a.src||(a.sid&&SS_PIECE_OF[a.sid]?a.sid:undefined)||(a.cave&&a.set?a.set+'_'+a.id:undefined);   // cave: a set's cave skill names itself "<set>_<skill id>": its zone wears the set's look and the client finds its drawing (game/cave/vis-floor2b.js cvbArea)
function ssRunRowS(p,r,ctx){
  const m=ctx&&ctx.m&&!ctx.m.dead&&!ctx.m.remove?ctx.m:null;
  if(r.heal){ healP(p,p.maxHp*r.heal*(1+psP(p,'heal')+ssCondP(p,'heal',m))); ev('fxa',p.id,'heal',r.id); }
  if(r.cdr) ssCdrS(p,r.cdr);
  if(r.mark&&m) ssMarkS(p,m,r.mark);
  if(r.status&&m) rxDirectS(m,{status:r.status},p,1);
  if(r.buff) for(const q of ssAlliesOf(p,r.buff.r)) ssAllyS(q,r.buff.kind,r.buff.v,r.buff.dur,p.id,r.id);
  if(r.shield) for(const q of ssAlliesOf(p)) ssShieldS(q,r.shield.v,r.shield.dur,r.id);
  if(r.fx){ const at=r.at==='target'&&ctx&&ctx.m?{x:ctx.m.x,z:ctx.m.z}:null;   // at: centred on the monster the trigger is about (a kill: where it died)
    rxQuietS(()=>resolveFxS(p,{fx:r.fx,mult:r.mult||1,range:r.range||10,el:r.el||'basic',aim:[-Math.sin(p.face),0,-Math.cos(p.face)],sid:null,src:r.id,at},m)); }
}
// kind: hit crit kill hurt cast1 cast2 cast3 tick low; ctx: {m, v}. A player with no triggered rows leaves at once.
function ssTriggerS(p,kind,ctx){
  if(kind==='kill'){ const K=p.killTs||(p.killTs=[]); K.push(S.t); while(K.length&&S.t-K[0]>30) K.shift(); }   // (the kills a streak row counts)
  const rows=p.ss&&p.ss.trig&&p.ss.trig[kind]; if(!rows||ssDepth||p.dead) return;
  const icd=p.ssIcd||(p.ssIcd={});
  for(const r of rows){
    if((icd[r.id]||0)>S.t) continue;
    if(kind==='low'&&!(p.hp<p.maxHp*(r.below||0.3))) continue;
    if(r.streak&&kind==='kill'){ let n=0; for(const t of p.killTs) if(S.t-t<=r.streak.secs) n++; if(n<r.streak.n) continue; }   // n kills within secs
    if(r.when&&!ssWhen(p,ctx&&ctx.m||null,r.when)) continue;
    if(r.chance!==undefined&&Math.random()>=r.chance) continue;
    if(r.icd) icd[r.id]=S.t+r.icd;
    ssDepth++; try{ ssRunRowS(p,r,ctx); } finally{ ssDepth--; }
  }
}
// tick rows run every icd seconds while the player is in a fight (dealt damage in the last 6 s)
function ssTickS(p){
  if(Math.hypot(p.vx||0,p.vz||0)>0.5) p.lastMove=S.t;   // (the `moved` and `still` conditions)
  const sh=p.shield; if(sh&&!sh.done&&sh.until<=S.t){ sh.done=true; if(p.ss&&p.ss.trig&&p.ss.trig.shield) ssTriggerS(p,'shield',{full:sh.v>=sh.v0*0.999}); }   // a shield that ran out
  if(p.ss&&p.ss.trig&&p.ss.trig.tick&&!p.dead&&S.t-(p.lastDealt||-99)<6) ssTriggerS(p,'tick',{});
}
const ssShieldBreakS=p=>{ if(p.ss&&p.ss.trig&&p.ss.trig.shield) ssTriggerS(p,'shield',{broken:true}); };   // hurtP: the shield's last point went
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
function ssAllyS(q,kind,v,dur,by,src){
  const cap=SS_ALLY_CAP[kind]; if(!cap||!(v>0)) return;
  const o=S.players.get(by); if(o){ v*=1+psP(o,'buffpow')+ssCondP(o,'buffpow',null)+(kind==='regen'?psP(o,'heal')+ssCondP(o,'heal',null):0); dur=Math.min(45,dur*(1+psP(o,'buffdur')+ssCondP(o,'buffdur',null)+rlP(o,'buffdur'))); }   // buffpow, buffdur (and heal, for a regeneration): the giver's passives
  v=Math.min(v,cap);
  const A=q.ally||(q.ally={}), cur=A[kind], live=!!cur&&cur.until>S.t;
  if(live&&v<cur.v-1e-6) return;
  const equal=live&&Math.abs(v-cur.v)<=1e-6, left=live?cur.until-S.t:0;
  A[kind]={v:equal?cur.v:v,until:equal?Math.max(cur.until,S.t+dur):S.t+dur,by};
  if(!equal||left<dur*0.5) ev('ast',q.id,kind,Math.round(v*100)/100,dur,...(src?[src]:[]));
}
// a shield: a pool of damage absorbed (a share of the target's own maximum health) for dur seconds; the larger pool wins, it is never added up
function ssShieldS(q,v,dur,src){
  const pool=q.maxHp*Math.min(1,v), cur=q.shield;
  if(cur&&cur.until>S.t&&cur.v>=pool) return;
  q.shield={v:pool,v0:pool,until:S.t+dur}; if(src) ev('fxa',q.id,'shield',src);   // (fxa [pid, kind, piece]: a heal or a shield reached this player, drawn in the piece's look)
}
// a party heal: heal power (the giver's stat), only the ally with the least health when lowest, and what would overheal turns into a shield by the overflow stat
function ssHealAllS(p,v,r,src,lowest){
  let L=ssAlliesOf(p,r); if(lowest) L=[L.reduce((a,q)=>q.hp/q.maxHp<a.hp/a.maxHp?q:a,L[0])];
  const k=1+psP(p,'heal')+ssCondP(p,'heal',null), ov=psP(p,'overflow');
  for(const q of L){ const amt=q.maxHp*Math.min(SS_HEAL_CAP,v*k), over=Math.max(0,q.hp+amt-q.maxHp); healP(q,amt); if(ov>0&&over>0) ssShieldS(q,Math.min(0.5,over*Math.min(1,ov)/q.maxHp),6,src); if(src) ev('fxa',q.id,'heal',src); }
}
// the utility keys of a skill's fx (ally, heal, shield, taunt), once, when the skill lands
function ssFxUtilS(p,f,src){
  const pm=(e,key)=>e.perMark?(e.perMark[key]||0)*Math.min(e.perMark.max||5,ssMarkSum(p,e.perMark.id,e.perMark.r)):0;   // perMark: a share (v) or seconds (dur) for each stack of your mark on the enemies near you (counted up to max, default 5, over all of them together)
  if(f.ally) for(const a of Array.isArray(f.ally)?f.ally:[f.ally]){ const v=a.v+pm(a,'v'), dur=a.dur+pm(a,'dur'); for(const q of ssAlliesOf(p,a.r)) ssAllyS(q,a.kind,v,dur,p.id,src); }
  if(f.heal) ssHealAllS(p,f.heal.v+pm(f.heal,'v'),f.heal.r,src,f.heal.lowest);
  if(f.shield){ const v=Math.min(1,f.shield.v+pm(f.shield,'v')), dur=f.shield.dur+pm(f.shield,'dur'); for(const q of ssAlliesOf(p,f.shield.r)) ssShieldS(q,v,dur,src); }
  if(f.taunt) for(const m of MONS) if(!m.dead&&!m.remove&&(m.inst|0)===(p.inst|0)&&Math.hypot(m.x-p.x,m.z-p.z)<f.taunt.r+m.T.rad) ssTauntS(p,m,f.taunt.dur);
}
// a zone's utility, each tick: the allies standing inside it (the owner included)
function ssZoneAlliesS(o,A){
  const Z=A.fx; if(!Z||!(Z.ally||Z.heal||Z.shield)) return;
  for(const q of ssAlliesOf(o,SS_ALLY_R*2)){ if(Math.hypot(q.x-A.x,q.z-A.z)>A.r) continue;
    if(Z.ally) for(const a of Array.isArray(Z.ally)?Z.ally:[Z.ally]) ssAllyS(q,a.kind,a.v,a.dur,o.id,A.src);
    if(Z.heal) healP(q,q.maxHp*Math.min(SS_HEAL_CAP,Z.heal.v));
    if(Z.shield) ssShieldS(q,Z.shield.v,Z.shield.dur); }
}
// health from a regen buff
function ssRegenS(p,dt){ const rg=allyP(p,'regen')+(p.ss?psP(p,'regen')+ssCondP(p,'regen',null):0); if(rg>0&&!p.dead) healP(p,p.maxHp*rg*dt); }   // (the regen stat: always on, a passive's own trickle)
// ---- taunt ----
// the monster comes for p for dur seconds (a boss for SS_TAUNT_BOSS of that, never while it is enraged or shielded); a run's kit-driven monsters ignore it
function ssTauntS(p,m,dur){
  if(m.dgOwn||m.dead||m.remove) return;
  if(m.boss){ if(m.B.enraged||m.immune) return; dur*=SS_TAUNT_BOSS; }
  m.taunt={by:p.id,until:S.t+dur};
  ssTriggerS(p,'taunt',{m});   // on taunt rows (a trigger never fires a trigger: ssDepth)
}
// the taunter, when m is taunted and they can still be reached (alive, in the same run); a stale taunt is dropped
function ssTauntedBy(m){
  const t=m.taunt; if(!t) return null;
  const q=t.until>S.t?S.players.get(t.by):null;
  if(!q||q.dead||(q.inst|0)!==(m.inst|0)){ m.taunt=null; return null; }
  return q;
}
