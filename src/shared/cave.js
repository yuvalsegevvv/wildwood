//@ The Deep Cave, shared rules: the 4th skill slot (opens at level 23), the charge that pays for it, the registry of cave skills (defineCaveSkill) and their validation
/* Agent map. Plan: docs/CAVE.md (read its section 0 first). Test: tools/cave-smoke.js.
   The 4th slot is NOT in SLOTS (classes.js): SLOTS is the class skills' three slots, iterated by pvp, sanitizing and the skill sets' cast rows. The cave slot is its own thing:
   one universal skill (works for every class) in gear.skills.cave, owned in gear.cave.own ({id: level 1-5}); its tile is the action bar's fourth button, key 'cave' (KB_ACTIONS).
   Charge (CAVE_*) is per player, server-side, never saved: server/cave.js.
   Exports: CAVE_SLOT_LV, CAVE_SLOT, CAVE_CHARGE_K, CAVE_CHARGE_MAX, CAVE_BOSS_START, CAVE_BOSS_LEAVE, CAVE_COST_MIN/MAX, CAVE_REFUND_CAP, CAVE_LEVEL_MAX, CAVE_LEVEL_STEP, CAVE_CAST_CD, CAVE_CAST_WINDOW, CAVE_FLOORS, CAVE_METHODS,
   CAVE_SKILLS (id -> ability), CAVE_SKILL_IDS, CAVE_BAD (rejected entries {id, why}), defineCaveSkill(def), caveSkillDef(id), caveLevelK(level), caveChargeGain(ab, cave, set), caveUnlocked(level).
   Used by: classes.js (slotLv), server/cave.js, server/players.js (sanitize), server/combat.js (hooks), game/cave/*.js, game/ui/combat-hud.js, game/economy/skills.js.
   SET SKILLS (floors 2-4, C4): shared/cave/skill-<floor>-<id>.js, one per skill set, `set` = its set id; they READ the set's mark (count it) and never spend it. Their extra fx keys (cvstrike, cvzone, wall, hold, ...) are run by server/cave-fx.js.
   `feat` (echo-trial skills, method C): {kind, n, secs?, id?} what the player must do once to earn the skill; the method engine reads it (validated loosely here).
   Entries are data: shared/cave/<floor>-<id>.js call defineCaveSkill({...}) and need no code elsewhere (a skill with `fx` reuses resolveFxS: docs/areas/skills-items.md). */
const CAVE_SLOT='cave', CAVE_SLOT_LV=23;   // the slot opens at this player level
const CAVE_CHARGE_K=0.6;                   // charge per cast = this x the cast ability's base cooldown (one constant to tune)
const CAVE_CHARGE_MAX=100, CAVE_BOSS_START=50, CAVE_BOSS_LEAVE=0;   // the bar's cap; the charge on entering a boss fight; on leaving one before it ends
const CAVE_COST_MIN=20, CAVE_COST_MAX=40;   // what a cave skill may cost
const CAVE_LEVEL_MAX=5, CAVE_LEVEL_STEP=0.1;   // level 2-5: +10% effect each (+40% at 5), the cost stays
const CAVE_LEVEL_COST=[0,0,3,7,15,40];   // Echo Shards to REACH level 2-5 (index = the new level), universal for any cave skill (C3; the owner's 3 / 7 / 15 / 40)
// the cave's monster drops: each floor's monsters drop that floor's material (gear.cave.m[floor]); a level of a cave skill also asks for the material of the skill's own floor
const CAVE_DROPS=[null,'Glow Silk','Prism Splinter','Drowned Pearl','Magma Heart'];   // index = floor
const CAVE_DROP_COST=[0,0,3,6,10,20];   // of the skill's floor's material, to REACH level 2-5
const CAVE_DROP_CHANCE=0.35, CAVE_DROP_MAX=9999;   // a kill on a floor drops one (the same chance as a land's monster material); the count's cap
const CAVE_REFUND_CAP=15;                   // a cast's kill refunds (fx.refund) never give back more than this much charge in all
const CAVE_CAST_CD=0.8;                     // seconds between two cave casts (the charge is the real limit)
const CAVE_CAST_WINDOW=3;                   // a cast may still pay its charge this long after it started (a projectile in flight)
const CAVE_FLOORS=4;                        // floors with skills today (more floors are data rows later)
const CAVE_METHODS='ABCDEFGH';              // the eight ways to earn a skill (docs/CAVE.md section 6)
const CAVE_SKILLS=Object.create(null), CAVE_SKILL_IDS=[], CAVE_BAD=[];
const caveUnlocked=level=>level>=CAVE_SLOT_LV;
const caveLevelK=level=>1+CAVE_LEVEL_STEP*(Math.max(1,Math.min(CAVE_LEVEL_MAX,level|0||1))-1);
/* charge one cast earns: 0.6 x the ability's base cooldown (not its upgraded one), doubled when the equipped cave skill belongs to a skill set and the cast is a piece of that same set */
function caveChargeGain(ab,caveSk){ const dbl=!!(caveSk&&caveSk.set&&ab&&ab.set===caveSk.set); return CAVE_CHARGE_K*(ab&&ab.cd>0?ab.cd:0)*(dbl?2:1); }
const caveSkillDef=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(CAVE_SKILLS,id)?CAVE_SKILLS[id]:null;
/* defineCaveSkill({id, name, floor 1-4, method 'A'-'H', set: a skill set id or null, cost 20-40, desc, mult, range, fx, el?, act?, anim?, icon?, feat? (method C only; kinds in docs/CAVE.md section 15)}) -> the ability, or null (and a CAVE_BAD row) when it is invalid.
   The ability looks like a SKILLS row (cls 'any', slot 'cave') so resolveFxS, the HUD and the panel read it the same way; cd is 0 (the cost is its limit). */
function defineCaveSkill(d){
  const bad=why=>{ CAVE_BAD.push({id:d&&typeof d.id==='string'?d.id:'?',why}); if(typeof console!=='undefined') console.warn('cave skill left out:',d&&d.id,why); return null; };
  if(!d||typeof d!=='object') return bad('not an object');
  if(typeof d.id!=='string'||!/^[a-z][a-z0-9]{1,23}$/.test(d.id)) return bad('id must be 2-24 lowercase letters or digits');
  if(caveSkillDef(d.id)||SKILLS[d.id]||PASSIVES[d.id]) return bad('id already used');
  if(typeof d.name!=='string'||!d.name||d.name.length>24) return bad('name must be 1-24 characters');
  if(!Number.isInteger(d.floor)||d.floor<1||d.floor>CAVE_FLOORS) return bad('floor must be 1-'+CAVE_FLOORS);
  if(typeof d.method!=='string'||d.method.length!==1||!CAVE_METHODS.includes(d.method)) return bad('method must be a letter A-H');
  if(d.set!==null&&d.set!==undefined&&(typeof d.set!=='string'||!Object.prototype.hasOwnProperty.call(SS_SETS,d.set))) return bad('set must be null or a skill set id');
  if(!Number.isInteger(d.cost)||d.cost<CAVE_COST_MIN||d.cost>CAVE_COST_MAX) return bad('cost must be '+CAVE_COST_MIN+'-'+CAVE_COST_MAX);
  if(typeof d.desc!=='string'||!d.desc||d.desc.length>240) return bad('desc must be 1-240 characters');
  if(!(d.mult>=0&&d.mult<=10)) return bad('mult must be 0-10');
  if(!(d.range>=1&&d.range<=60)) return bad('range must be 1-60');
  if(!d.fx||typeof d.fx!=='object'||!Object.keys(d.fx).length) return bad('fx is required (the generic effects of resolveFxS)');
  if(d.el!==undefined&&(typeof d.el!=='string'||!Object.prototype.hasOwnProperty.call(ELEMS,d.el))) return bad('el must be an element id');
  if(d.feat!==undefined&&(!d.feat||typeof d.feat!=='object'||!['pack','holdTaunt','holdMark'].includes(d.feat.kind)||!(d.feat.n>=1&&d.feat.n<=12))) return bad('feat must be {kind pack|holdTaunt|holdMark, n 1-12, ...} (docs/CAVE.md section 15)');
  if(d.feat&&d.method!=='C') return bad('only a method C skill has a feat');
  if(d.fx.refund&&!(d.fx.refund.n>0&&d.fx.refund.secs>0&&(d.fx.refund.cap===undefined||(d.fx.refund.cap>0&&d.fx.refund.cap<=CAVE_REFUND_CAP)))) return bad('fx.refund is {n, secs, cap up to '+CAVE_REFUND_CAP+'}');
  const kind=d.act?d.act[0]:'cv_'+d.id;
  if(d.act&&(!Array.isArray(d.act)||typeof d.act[0]!=='string'||!(d.act[1]>0.2&&d.act[1]<=3)||!(d.act[2]>0&&d.act[2]<1))) return bad('act must be [kind, seconds 0.2-3, hit point 0-1]');
  if(ACT_SKILL[kind]) return bad('act kind already used');
  const ab={id:d.id,cls:'any',slot:CAVE_SLOT,cave:true,name:d.name,cd:0,price:0,lv:CAVE_SLOT_LV,range:d.range,mult:d.mult,fx:d.fx,desc:d.desc,
    act:d.act||[kind,0.6,0.45],anim:d.anim||'cast',cost:d.cost,floor:d.floor,method:d.method,set:d.set||null,icon:d.icon||null};
  if(d.feat) ab.feat=d.feat;   // method C's feat (shared/cave-methods.js caveFeatOf; server/cave/method-c.js runs it)
  if(d.el) ab.el=d.el;
  CAVE_SKILLS[d.id]=ab; CAVE_SKILL_IDS.push(d.id);
  ACT_SKILL[kind]=ab; ANIM_OF[kind]=ab.anim;   // the client draws a cast from its attack kind (attackVisuals), the body plays the borrowed animation
  return ab;
}
