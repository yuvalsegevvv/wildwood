//@ The Deep Cave on the server: the 4th slot's charge (earned by casts that hit, a boss fight sets it), casting the equipped cave skill, equipping, and sanitizing gear.cave
/* Agent map. Plan and rules: docs/CAVE.md; the registry and constants are shared/cave.js; test: tools/cave-smoke.js.
   gear.cave = {own:{<cave skill id>: level 1-5}, cd:{'<floor><method>': epoch seconds the method is ready again}, done:{'<floor><method>': completions}, sh:{shards}} (saved, caveSanitizeSave; the methods are server/cave/); the equipped one is gear.skills.cave (saved, sanitizeSkills; cleared by sanitizeGear when it is not owned).
   p.cave = {charge, sent, cur, fight, fightT} is NOT saved (caveNewState, made by newPlayer): charge 0-100, kept between ordinary fights.
   CHARGE: caveCastS(p,slot,ab) starts a cast (handleAttack); the first damage that cast deals (caveHitS, called from damageMonsterS) pays 0.6 x the ability's base cooldown ONCE (never per enemy),
   doubled when the equipped cave skill has a `set` and the cast ability is a piece of that set. A cast that hits nothing pays nothing; a hit lands up to CAVE_CAST_WINDOW seconds after the cast (projectiles).
   Nothing is paid below level 23, on the Proving Isle, or by the cave skill's own casts. caveAddP caps at 100.
   BOSS FIGHT RULE: a player is in a boss fight while they stand inside an ENGAGED boss's arena (+6 m, the boss's own `inside` list: caveBossTickS, called by updateBossS every tick).
   Entering sets charge to exactly 50 (also for a player who joins mid-fight). Not seen inside for 0.5 s ends their fight: if the boss is dead the fight ended and the charge stays;
   otherwise (they walked out, died, or everyone left and the boss reset) the charge drops to 0. Dungeon bosses count only when their kit runs through updateBossS.
   CAST: caveCastP (handleAttack with k:'cave') needs level 23, the equipped skill owned, charge >= its cost, 0.8 s since the last cave cast; it spends the cost and runs the skill through p.act like any fx skill.
   Messages: cavequip {id|null} (MSG.cavequip), atk {k:'cave'}; server to client: {t:'cave', c: charge rounded} whenever the rounded charge changes (and once on join).
   Used by: players.js (newPlayer, sanitizeGear, updatePlayersS), combat.js (handleAttack, damageMonsterS), boss.js (updateBossS); the hooks are marked `// cave:` and listed in docs/CAVE.md. */
function caveNewState(){ return {charge:0,sent:-1,cur:null,fight:null,fightT:0,last:null,od:null,odT:0,gr:null,bur:0,burT:0,fx:{}}; }   // fx: the set skills' windows (server/cave-fx.js); last: the last skill or burst cast (Echo); od: Overdrive; gr: Grapple Line; bur: Burrow (server/cave/skills.js)
// gear.cave from a save: only cave skills that exist, each at a level 1-5 (an old save has none)
function caveSanitizeSave(g){
  const out={own:{},cd:{},done:{},sh:0}, ok=g&&typeof g==='object'&&!Array.isArray(g), O=ok&&g.own&&typeof g.own==='object'?g.own:null;
  if(O) for(const id of Object.keys(O).slice(0,64)){ if(!caveSkillDef(id)) continue; out.own[id]=clampInt(O[id],1,CAVE_LEVEL_MAX,1); }
  const key=k=>/^[1-9][A-H]$/.test(k)&&caveMethodDef(k[1]);   // a method key is floor digit + letter: only real methods, never a bare client string
  const CD=ok&&g.cd&&typeof g.cd==='object'?g.cd:null, DN=ok&&g.done&&typeof g.done==='object'?g.done:null, now=Date.now()/1000;
  if(CD) for(const k of Object.keys(CD).slice(0,64)){ if(key(k)&&Number.isFinite(+CD[k])) out.cd[k]=Math.min(now+CAVE_METHOD_CD,Math.max(0,+CD[k])); }   // (never later than one cooldown from now: a tampered save cannot lock a method)
  if(DN) for(const k of Object.keys(DN).slice(0,64)){ if(key(k)) out.done[k]=clampInt(DN[k],0,99999,0); }
  out.sh=ok?clampInt(g.sh,0,99999,0):0;
  return out;
}
// the equipped cave skill's ability if p may use it now (level, owned), else null
function caveEquippedP(p){
  if(p.pv||p.level<CAVE_SLOT_LV) return null;
  const id=p.gear.skills.cave, sk=caveSkillDef(id);
  return sk&&p.gear.cave&&Object.prototype.hasOwnProperty.call(p.gear.cave.own,id)?sk:null;
}
function caveAddP(p,n){ const c=p.cave; if(c&&n>0) c.charge=Math.min(CAVE_CHARGE_MAX,c.charge+n); }
function caveCastS(p,slot,ab){   // a basic / skill / burst cast starts (handleAttack): it may pay its charge once, on its first hit
  const c=p.cave; if(!c||p.pv||p.level<CAVE_SLOT_LV) return;
  c.cur={t:S.t,gain:caveChargeGain(ab,caveEquippedP(p)),paid:false};
  if(slot!=='basic') c.last={ab,lvl:skillLvOf(skOfP(p),ab.id)};   // Echo repeats it
  else if(c.od&&c.od.n>0&&c.od.until>S.t){ c.od.n--; c.odT=S.t+0.7; p.cd.basic*=c.od.cd; }   // Overdrive: this basic attack is a sure crit and comes sooner
}
function caveHitS(p){   // damageMonsterS dealt damage for p
  const c=p.cave, cur=c&&c.cur; if(!cur||cur.paid) return;
  if(S.t-cur.t>CAVE_CAST_WINDOW){ c.cur=null; return; }
  cur.paid=true; caveAddP(p,cur.gain*bhChargeP(p));   // basic-hold: charge gain (gear, passives) scales what a cast earns
}
function caveBossTickS(B,inside){   // updateBossS: B is engaged and these players stand in its arena
  for(const q of inside){ const c=q.cave; if(!c) continue;
    if(c.fight!==B){ c.fight=B; c.charge=CAVE_BOSS_START; }   // entering a boss fight: exactly 50
    c.fightT=S.t; }
}
function caveTickP(p){   // every tick, every player: end a boss fight they left, tell the client the charge
  const c=p.cave; if(!c) return;
  caveMTickP(p);   // the methods (server/cave/methods.js): only does anything on a floor
  if(c.bur>S.t) caveBurrowTickS(p,c);   // Burrow: monsters lose track
  if(c.fight&&S.t-c.fightT>0.5){ if(!c.fight.m.dead) c.charge=CAVE_BOSS_LEAVE; c.fight=null; }   // the boss died: the fight ended, keep it; anything else is leaving before the end
  caveFxTickP(p);   // the set skills' timed effects (server/cave-fx.js)
  if(p.gear&&p.gear.caveFull) c.charge=CAVE_CHARGE_MAX;   // the testing toggle (devP 'caveFull'): every cave skill can be tried at once, again and again
  const r=Math.round(c.charge); if(r!==c.sent){ c.sent=r; sendTo(p.id,{t:'cave',c:r}); }
}
function caveCastP(p,msg){   // atk {k:'cave'}: spend the cost and run the skill
  if(p.dead||p.act||!p.cave||p.cd.cave>0.08) return;
  const sk=caveEquippedP(p); if(!sk||p.cave.charge<sk.cost) return;
  p.cave.charge-=sk.cost; p.cd.cave=CAVE_CAST_CD; p.cave.cur=null;   // (a new cast supersedes an unpaid one, and its own hits earn nothing)
  const [kind,dur,hitAt]=sk.act, lvl=p.gear.cave.own[sk.id];
  if(isFinite(+msg.face)) p.face=+msg.face%(2*Math.PI);
  const tg=foeByIdS(p,msg.tg);
  const aim=Array.isArray(msg.aim)&&msg.aim.length===3&&msg.aim.every(v=>isFinite(+v))?norm3(msg.aim.map(Number)):[-Math.sin(p.face),0,-Math.cos(p.face)];
  p.act={kind,t:0,dur,hitAt,done:false,skill:true,sid:sk.id,lvl,el:elOf(sk),fx:sk.fx,mult:sk.mult*caveLvK(p,sk.id),range:sk.range,tg:tg&&!tg.dead?tg.id:null,aim,cave:true};
  ev('pact',p.id,kind,Math.round(p.face*100)/100);
}
// the level scale of an owned cave skill (1 + 0.1 per level above 1): THE one place the level reaches the effect; caveCastP puts it in a.mult (server/cave/skills.js caveFxS) and caveSetFxS reads the same level (server/cave-fx.js)
function caveLvK(p,id,lvl){ const o=p&&p.gear&&p.gear.cave&&p.gear.cave.own; return caveLevelK(o&&Object.prototype.hasOwnProperty.call(o,id)?o[id]:lvl||1); }   // lvl: the cast's own level when id is not an owned cave skill
// caveup {id}: spend Echo Shards (CAVE_LEVEL_COST) to take an owned cave skill one level up, to 5
function caveUpgradeP(p,id){
  const sk=caveSkillDef(id), g=p.gear&&p.gear.cave; if(!sk||!g||!Object.prototype.hasOwnProperty.call(g.own,id)) return;
  const lv=g.own[id]|0; if(lv>=CAVE_LEVEL_MAX){ toastTo(p.id,sk.name+' is at its top level.','bad'); return; }
  const cost=CAVE_LEVEL_COST[lv+1]|0, have=g.sh|0;
  if(have<cost){ toastTo(p.id,'Level '+(lv+1)+' costs '+cost+' Echo Shards; you have '+have+'.','bad'); return; }
  g.sh=have-cost; g.own[id]=lv+1; p.dirty=true;
  toastTo(p.id,sk.name+' is now level '+(lv+1)+' (+'+Math.round(CAVE_LEVEL_STEP*100*lv)+'% effect).','loot r3'); ev('caveup',p.id,id,lv+1);
}
MSG.caveup=(p,msg)=>caveUpgradeP(p,msg.id);
function caveEquipP(p,id){   // cavequip: wear an owned cave skill, or take it off (id null)
  if(id===null||id===undefined||id===''){ if(p.gear.skills.cave){ p.gear.skills.cave=null; p.dirty=true; } return; }
  const sk=caveSkillDef(id); if(!sk||!Object.prototype.hasOwnProperty.call(p.gear.cave.own,id)) return;
  if(p.level<CAVE_SLOT_LV){ toastTo(p.id,'The cave slot opens at level '+CAVE_SLOT_LV,'bad'); return; }
  p.gear.skills.cave=id; p.dirty=true;
}
MSG.cavequip=(p,msg)=>caveEquipP(p,msg.id);
