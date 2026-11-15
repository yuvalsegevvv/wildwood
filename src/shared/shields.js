//@ Shields, the survival slot the Cenote of Hollow Stars pays (eq.shield, wearable at the piece's own level): seven kinds (hp, def, block, steady, ward, leech, regen), base values, growth, names, texts. Pure.
/* Agent map (design: docs/DUNGEON-REVAMP.md section 5d; the ids and records are dungeon-rewards.js)
   owns:    SHD_KINDS (id, name, base value), SHD_BY_ID, SHD_IDS, SHD_LV_STEP, SHD_BLOCK_LET (30% of a blocked hit gets through), SHD_WARD_BELOW / SHD_WARD_SECS / SHD_WARD_CD, SHD_REGEN_COMBAT (in combat a third of the out-of-combat rate),
            the caps SHD_BLOCK_CAP / SHD_STEADY_CAP / SHD_WARD_CAP, shdVal(kind,rar,n,t), shdText(it).
   uses:    nothing at load; RAR_MULT (items.js) and enhMult (dungeon-rewards.js) at call time. Loaded after gloves.js.
   used by: shared/dungeon-rewards.js (dgParse, dgItem, dgShieldId, DG_REWARDS.cenote), server/dungeon-gear.js (shdP, shdBlockK, shdSteadyDur, shdWardS, shdLeechS, shdRegenP),
            server/players.js (recalcP, hurtP, updatePlayersS), server/combat.js (damageMonsterS), server/boss-fx.js (pfxS) hooks `// dgrev:`, inventory / item details.
   test:    tools/shields-smoke.js.
   Ids: shield<7|8|9|10>-<kind>[-<rarity key>][+n][~roll]. v = base x rarity (RAR_MULT, a legendary x3) x tempering (+10% a step) x SHD_LV_STEP per equipment level step above 30.
   What v means: hp / def +v of max health / defence; block v = chance to block (a blocked hit still does SHD_BLOCK_LET of its damage; the chance is capped); steady v = the share a stun or slow on you is shortened (capped);
   ward v = the shield's size as a share of max health (capped), below SHD_WARD_BELOW health once every SHD_WARD_CD s; leech v = the share of your damage healed; regen v = max health a second out of combat. */
const SHD_LV_STEP=1.15, SHD_BLOCK_LET=0.30, SHD_WARD_BELOW=0.30, SHD_WARD_SECS=8, SHD_WARD_CD=60, SHD_REGEN_COMBAT=1/3, SHD_BLOCK_CAP=0.5, SHD_STEADY_CAP=0.75, SHD_WARD_CAP=0.6;   // x1.15 a level step (percent bonuses, like gloves); the caps keep a legendary +10 level-60 piece honest
const SHD_KINDS=[
  {id:'hp',    name:'Bulwark Shield',  base:0.08},
  {id:'def',   name:'Ironwall Shield', base:0.08},
  {id:'block', name:'Parry Shield',    base:0.08},
  {id:'steady',name:'Steady Shield',   base:0.30},
  {id:'ward',  name:'Last Ward Shield',base:0.20},
  {id:'leech', name:'Lifeblood Shield',base:0.015},
  {id:'regen', name:'Mending Shield',  base:0.006}];
const SHD_BY_ID={}; for(const k of SHD_KINDS) SHD_BY_ID[k.id]=k;
const SHD_IDS=SHD_KINDS.map(k=>k.id);
// the value of a shield: kind id, rarity 0-4, tempering n, level digit t (7 / 8 / 9 / 10); a fraction (uncapped: the consumers cap)
const shdVal=(kind,rar,n,t)=>Math.round(SHD_BY_ID[kind].base*RAR_MULT[rar]*enhMult(n)*Math.pow(SHD_LV_STEP,Math.max(0,t-7))*10000)/10000;
const shdPct=v=>Math.round(v*1000)/10;
function shdText(it){
  const v=it.v;
  return it.stat==='hp'?'+'+shdPct(v)+'% health'
    :it.stat==='def'?'+'+shdPct(v)+'% defence'
    :it.stat==='block'?shdPct(Math.min(SHD_BLOCK_CAP,v))+'% chance to block a hit (it does '+Math.round(SHD_BLOCK_LET*100)+'% of its damage)'
    :it.stat==='steady'?Math.round(Math.min(SHD_STEADY_CAP,v)*100)+'% shorter stuns and slows on you'
    :it.stat==='ward'?'Below '+Math.round(SHD_WARD_BELOW*100)+'% health, a shield of '+Math.round(Math.min(SHD_WARD_CAP,v)*100)+'% of max health (once every '+SHD_WARD_CD+' s)'
    :it.stat==='leech'?'Heal '+shdPct(v)+'% of the damage you deal'
    :'+'+shdPct(v)+'% of max health a second out of combat, '+shdPct(v*SHD_REGEN_COMBAT)+'% in combat';
}
