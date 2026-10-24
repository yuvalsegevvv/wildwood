//@ Cave method E on the server, The silent chamber: from the entry to the shrine past a sleeping guardian; running, fighting and casting add noise, a full meter wakes it and throws you out
/* Agent map. Numbers: shared/cave/method-e-silent.js (rates per second; skill / basic are added once per attack started). State p.cm.E = {s 0 outside / 1 inside, z noise 0..max, act (the last p.act seen: a new one is a
   new attack), lock (no new entry before), wake (the wake flash, until)}. Inside: speed over `runV` m/s adds `run` noise a second, any slower move `walk`, standing still `still` (negative: it calms). The rates grow
   by `floorK` per floor deeper. Leaving the chamber by the way you came ends it quietly. At `max` the guardian wakes: you land at the exit anchor outside, hurt by nothing, and may try again after `lock` seconds. */
function caveMETickP(p,M,dt){
  const D=caveMethodDef('E').p, E=M.E, W=caveAW(M.n);
  if(caveCdLeft(p,M.n,'E')>0){ E.s=0; return; }
  const k=1+D.floorK*(M.n-1);
  if(!E.s){
    if(S.t>=E.lock&&caveMd(p,W.E.entry)<D.enter){ E.s=1; E.z=0; E.act=p.act; toastTo(p.id,'The guardian sleeps. Cross to the shrine quietly: walk, do not run, do not fight','good'); }
    return;
  }
  if(caveMd(p,W.E.guard)>W.E.r+6){ E.s=0; E.z=0; toastTo(p.id,'You left the silent chamber.',''); return; }
  const v=Math.hypot(p.vx||0,p.vz||0);
  E.z+=(v>D.runV?D.run:v>0.8?D.walk:D.still)*dt*(v>0.8?k:1);
  if(p.act&&p.act!==E.act){ E.z+=(p.act.skill?D.skill:D.basic)*k; }
  E.act=p.act;
  E.z=Math.max(0,E.z);
  if(E.z>=D.max){ E.s=0; E.z=0; E.lock=S.t+D.lock; E.wake=S.t+2; caveMMovePTo(p,W.E.exit.x,W.E.exit.z); toastTo(p.id,'The guardian wakes and throws you out!','bad'); return; }
  if(caveMd(p,W.E.shrine)<D.shrine){ E.s=0; E.z=0; caveMDoneP(p,M,'E'); }
}
