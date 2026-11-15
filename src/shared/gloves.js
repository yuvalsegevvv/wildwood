//@ Gloves, the crit and attack slot the Termite Cathedral pays (eq.gloves, wearable at the piece's own level): six kinds (crit, critdmg, atk, streak, over, echo), base values, growth, names, texts. Pure.
/* Agent map (design: docs/DUNGEON-REVAMP.md section 5c; the ids and records are dungeon-rewards.js)
   owns:    GLV_KINDS (id, name, base value, what grows), GLV_BY_ID, GLV_IDS, GLV_LV_STEP, GLV_STREAK_SECS / GLV_STREAK_MAX (Hot Streak), GLV_ECHO_CHANCE, glvVal(kind,rar,n,t), glvText(it).
   uses:    nothing at load; RAR_MULT (items.js) and enhMult (dungeon-rewards.js) at call time. Loaded after capes.js.
   used by: shared/dungeon-rewards.js (dgParse, dgItem, dgGlovesId, DG_REWARDS.termitecathedral), server/dungeon-gear.js (glvP, glvAtkP, glvStreakP, glvOverP, glvHitS),
            server/combat.js (rollDmgS, damageMonsterS hooks `// dgrev:`), server/players.js (recalcP), inventory / item details.
   test:    tools/gloves-smoke.js.
   Ids: gloves<7|8|9|10>-<kind>[-<rarity key>][+n][~roll]. v = base x rarity (RAR_MULT, a legendary x3 like every other kind) x tempering (+10% a step) x GLV_LV_STEP per equipment level step above 30.
   What v means: crit +v crit chance; critdmg +v crit multiplier; atk +v flat attack; streak +v crit chance per stack; over v = multiplier per 1% of crit chance above the cap (0.03 at base);
   echo v = the second hit's share of the crit's damage (the chance stays GLV_ECHO_CHANCE). */
const GLV_LV_STEP=1.15, GLV_STREAK_SECS=4, GLV_STREAK_MAX=5, GLV_ECHO_CHANCE=0.15;   // x1.15 a level step (percent bonuses stack, so slower than attack's x1.25); Hot Streak: a stack lasts 4 s, up to 5; Echo's chance never grows
const GLV_KINDS=[
  {id:'crit',   name:'Keen Gloves',        base:0.04},
  {id:'critdmg',name:'Brutal Gloves',      base:0.20},
  {id:'atk',    name:'Heavy Gloves',       base:25},
  {id:'streak', name:'Hot Streak Gloves',  base:0.015},
  {id:'over',   name:'Overflow Gloves',    base:0.03},
  {id:'echo',   name:'Echo Gloves',        base:0.40}];
const GLV_BY_ID={}; for(const k of GLV_KINDS) GLV_BY_ID[k.id]=k;
const GLV_IDS=GLV_KINDS.map(k=>k.id);
// the value of a glove: kind id, rarity 0-4, tempering n, level digit t (7 / 8 / 9 / 10); fractions, atk in points
const glvVal=(kind,rar,n,t)=>Math.round(GLV_BY_ID[kind].base*RAR_MULT[rar]*enhMult(n)*Math.pow(GLV_LV_STEP,Math.max(0,t-7))*10000)/10000;
const glvPct=v=>Math.round(v*1000)/10;
function glvText(it){
  const v=it.v;
  return it.stat==='crit'?'+'+glvPct(v)+'% critical hit chance'
    :it.stat==='critdmg'?'Critical hits deal +'+(Math.round(v*100)/100).toFixed(2)+'x'
    :it.stat==='atk'?'+'+Math.round(v)+' attack'
    :it.stat==='streak'?'Each crit adds +'+glvPct(v)+'% crit chance for '+GLV_STREAK_SECS+' s, up to '+GLV_STREAK_MAX+' stacks'
    :it.stat==='over'?'Crit chance above the cap turns into crit damage (1% = +'+(Math.round(v*10000)/10000)+'x)'
    :'A crit has a '+Math.round(GLV_ECHO_CHANCE*100)+'% chance to hit again for '+glvPct(v)+'%';
}
