//@ The test room on the server: an immortal Training Scarecrow, each hiker's damage counter, and the messages that reset the counter and the cooldowns, refill the cave charge
/* Agent map (docs/TESTROOM.md)
   owns:    troomInitS (makes the scarecrow, called once beside initMonstersS), troomHitS (a hit on it: the hp goes back, the counter grows), troomTickP (sends the counter, at most 5 a second), MSG.troom{a: 'reset'|'cd'|'charge'}.
   hooks:   marked `// testroom:`: damageMonsterS (combat.js) and the skill-set trigger damage (skillsets.js) call troomHitS; monK (tiers.js) gives the scarecrow the tier-0 numbers; bindSoulP (economy.js) works on the pad;
            the player loop (players.js) calls troomTickP.
   protocol: out {t:'troomc',tot,hits,dps,max,secs} (the counter), {t:'troomcd'} (cooldowns cleared: the client zeroes its own); in {t:'troom',a}.
   test:    tools/testroom-smoke.js. */
let TROOM_MON=null;
function troomInitS(){
  const m=makeMon(SCARECROW_DEF,TROOM.x,TROOM.z,{x:TROOM.x,z:TROOM.z},1,false);
  m.tr=true; m.trK=zoneTierK(SCARECROW_DEF,0); m.face=m.faceGoal=Math.atan2(VIL.x-TROOM.x,VIL.z-TROOM.z);   // (it looks at the village; the zone tier's numbers are the plain ones for everyone)
  TROOM_MON=m;
}
// a hit of v on the scarecrow: it takes nothing, the hiker's counter takes it (a counter runs from the first hit and stops at the last)
function troomHitS(m,p,v){
  m.hp=m.maxHp; m.dead=false;
  const c=p.trc||(p.trc={tot:0,hits:0,t0:S.t,t1:S.t,max:0,sent:-9,dirty:false});
  if(!c.hits) c.t0=S.t;
  c.tot+=v; c.hits++; c.t1=S.t; c.max=Math.max(c.max,v); c.dirty=true;
}
function troomSendP(p){
  const c=p.trc; c.dirty=false; c.sent=S.t;
  sendTo(p.id,{t:'troomc',tot:Math.round(c.tot),hits:c.hits,dps:Math.round(c.tot/Math.max(1,c.t1-c.t0)),max:c.max,secs:Math.round((c.t1-c.t0)*10)/10});
}
function troomTickP(p){ const c=p.trc; if(c&&c.dirty&&S.t-c.sent>=0.2) troomSendP(p); }
function troomMsgP(p,msg){
  if(p.dead||p.pv||p.inst) return;
  if(!troomIn(p.x,p.z,2)){ toastTo(p.id,'Step onto the test room\'s pad first','bad'); return; }
  const a=msg.a;
  if(a==='reset'){ p.trc=null; sendTo(p.id,{t:'troomc',tot:0,hits:0,dps:0,max:0,secs:0}); }
  else if(a==='cd'){ for(const k in p.cd) p.cd[k]=0; if(TROOM_MON) TROOM_MON.ultLock=0; sendTo(p.id,{t:'troomcd'}); toastTo(p.id,'Cooldowns reset','good'); }
  else if(a==='charge'){ if(!p.cave||p.level<CAVE_SLOT_LV){ toastTo(p.id,'The cave slot opens at level '+CAVE_SLOT_LV,'bad'); return; } p.cave.charge=CAVE_CHARGE_MAX; p.cave.sent=-1; toastTo(p.id,'Cave charge refilled to '+CAVE_CHARGE_MAX,'good'); }
}
MSG.troom=troomMsgP;
