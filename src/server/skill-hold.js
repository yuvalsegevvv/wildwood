//@ Skill 2's held mode on the server: the hold message for skill 2 (the server times the hold itself) and the release that turns a cast into its held mode
/* Agent map (rules: shared/skill-hold.js, docs/SKILL-HOLD.md; test: tools/skill-hold-smoke.js)
   owns:    shHoldP (MSG.hold with k:'skill', called from server/basic-hold.js: p.holdT2 = when the hold began, only while skill 2 is ready), shReleaseP(p, ab0) (the held row when the hold lasted its secs, else null; it always clears p.holdT2).
   hooks:   server/basic-hold.js MSG.hold, server/combat.js handleAttack (marked `// skill-hold:`). The client never sends a duration: a hold message with no wait casts the tap. */
function shHoldP(p,msg){ p.holdT2=(msg.on===1||msg.on===true)&&!p.pv&&!(p.cd.skill>0.08)?S.t:null; }   // (pvp: the island's fixed loadout has no held modes)
function shReleaseP(p,ab0){
  const t0=p.holdT2; p.holdT2=null;
  if(t0==null||p.pv||!ab0) return null;
  const h=shAltOf(ab0.id); return shArmed(S.t-t0,h)?h:null;
}
