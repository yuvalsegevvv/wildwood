//@ Skill 1 (the basic slot) as an attack-speed skill with two modes (pure): attack speed and charge gain, the press / hold split, and what a held release becomes for each class
/* Agent map (design: docs/BASIC-HOLD.md; server: server/basic-hold.js; client: game/combat/basic-hold.js; test: tools/basic-hold-smoke.js)
   owns:    BH_TAP (seconds a press may last), BH_FULL (seconds to a full charge, by class), BH_ASPD_CAP / BH_CHG_CAP, bhSpeedK (the attack speed multiplier of a loadout), bhChargeK, bhFrac (held seconds x attack speed -> 0..1, 0 = a press),
            bhInterval (the seconds between two skill-1 swings: the old cooldown, now divided by the attack speed), bhActDur (the swing / cast time of any slot, divided by the attack speed),
            bhPressMult (a press's damage x), bhHoldAb (the ability a held release at strength f turns into: a copy of the row with its own mult, fx and act).
   uses:    classes.js (skillCdMult, skillLvOf, passiveSum), skillsets.js (a skill-1 entry's `style` and `hold` keys).
   used by: server/basic-hold.js (handleAttack), game/combat/basic-hold.js and attacks.js (the client predicts the same numbers), game/economy/skills.js (the texts).
   THE RULES. Skill 1 has no cooldown: after a swing the next one waits ab.cd / attack speed seconds (and every slot's cast time is divided by the attack speed; the cooldowns of skill 2 and burst are NOT).
   Press (a tap shorter than BH_TAP): the skill as it is. Hold (longer): fires on release, stronger the longer it was held (f from about 0.3 to 1; attack speed fills it faster), and at f = 1 (full) with an extra effect:
     warrior: a wide, heavy blow (the cone / ring / beam grows, knocks back, the swing ends 35% slower; full: stuns the non-boss) -- the "side effects"
     archer:  an aimed shot (no homing, faster, far stronger; full: bursts where it lands)    mage: the bolt becomes an explosion on the target, wider the longer it was held (full: the foes take 12% more for 6 s).
   A skill-1 entry of a skill set may say style:'press' (it hits better pressed: press x1.15, hold x0.9) or style:'hold' (the opposite), and hold:{x:{...}} (keys merged into its main shape at a full charge). */
const BH_TAP=0.25, BH_FULL={warrior:0.9,archer:1.0,mage:1.1}, BH_ASPD_CAP=0.6, BH_CHG_CAP=1.0, BH_RECOVER=0.4;
const BH_STYLE={press:{p:1.15,h:0.9},hold:{p:0.9,h:1.15}}, BH_EVEN={p:1,h:1};
const BH_SHAPES=['cone','ring','beam','chain','zone','proj'], BH_KEEP=['mark','flavor','status','burn','slow','stun','taunt'];
const bhSpeedK=(passive,rolled)=>1+Math.max(0,Math.min(BH_ASPD_CAP,(passive||0)+(rolled||0)));
const bhChargeK=(passive,rolled)=>1+Math.max(0,Math.min(BH_CHG_CAP,(passive||0)+(rolled||0)));
const bhFrac=(held,cls,chgK)=>held>=BH_TAP?Math.min(1,Math.max(0.2,held*(chgK||1)/(BH_FULL[cls]||1))):0;
// seconds between two swings of skill 1: the row's cd is now its base interval (a skill level still shortens it 3% a level); buffCd: a buff's basic-cooldown x; f: a held release recovers longer
const bhInterval=(ab,skills,speedK,buffCd,f)=>ab.cd*skillCdMult(skillLvOf(skills,ab.id))/speedK*(buffCd||1)*(1+BH_RECOVER*(f||0));
const bhActDur=(dur,speedK,buffCd)=>dur/speedK*(buffCd||1);
const bhStyleOf=ab=>BH_STYLE[ab.style]||BH_EVEN;
const bhPressMult=ab=>ab.mult*bhStyleOf(ab).p;
// a basic attack with no fx of its own, as the shape its held release grows from
function bhPlainFx(ab,cls){
  if(cls==='warrior') return {cone:{r:3.1,arc:1.1}};
  if(cls==='archer') return {proj:{kind:'arrow',speed:46,turn:0,life:1.4}};
  const o={r:3}; if(ab.id==='iceshard') o.slow=2.5; return {ring:o};
}
// the ability a held release of strength f (0..1) turns into
function bhHoldAb(ab,cls,f){
  f=Math.max(0,Math.min(1,f)); const full=f>=1, st=bhStyleOf(ab), out=Object.assign({},ab), fx=ab.fx?JSON.parse(JSON.stringify(ab.fx)):bhPlainFx(ab,cls);
  let shape=(cls==='mage'?['proj',...BH_SHAPES]:cls==='archer'?['proj',...BH_SHAPES]:BH_SHAPES).find(k=>fx[k]); if(!shape){ shape='cone'; fx.cone={r:3.1,arc:1.1}; }
  let S=fx[shape];
  if(cls==='archer'&&shape==='proj'){
    S.turn=0; S.speed=(S.speed||44)*1.5; S.life=(S.life||1.2)*0.9; if(S.n>1) S.spread=(S.spread||0.2)*0.4;
    if(full&&!S.splash) S.splash={r:2.8,k:0.5};
    out.mult=ab.mult*(1.3+2*f)*st.h;
  } else if(cls==='mage'){
    const ring=shape==='ring'?S:{kb:0}; for(const k of BH_KEEP) if(S[k]!==undefined) ring[k]=S[k];
    ring.r=2.2+4.3*f; ring.kb=Math.max(ring.kb||0,1+2*f); if(f>=0.6&&!ring.slow) ring.slow=1.5;
    if(shape!=='ring'){ delete fx[shape]; fx.ring=ring; }
    S=ring; if(full&&!S.status) S.status={kind:'vuln',v:0.12,dur:6};
    out.mult=ab.mult*(1.1+1.6*f)*st.h; out.holdAt=true;
  } else {
    if(S.r) S.r*=1+0.35*f; if(S.len) S.len*=1+0.25*f; if(S.arc) S.arc*=1+0.3*f;
    if((shape==='cone'||shape==='ring')&&!(S.kb<0)) S.kb=(S.kb||0)+2+5*f;
    if(full&&S.stun===undefined) S.stun=1.4;
    out.mult=ab.mult*(1.5+1.9*f)*st.h; out.act=[ab.act[0],ab.act[1]*1.35,ab.act[2]];
  }
  if(full&&ab.hold&&ab.hold.x) Object.assign(S,ab.hold.x);
  out.fx=fx; out.holdF=f; return out;
}
