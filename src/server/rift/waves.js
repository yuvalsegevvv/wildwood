//@ Rift mode Waves (the Shardmere): ten waves through the tears, the next at 75% dead or 40 s, the Herald on waves 5 and 10; the last wave dead wins
/* agent map: one RIFT_MODE_KITS entry (server/rift.js: the kit, riftWaveStepS, riftHudS); the text: RIFT_MODES.waves (shared/rift.js). Test: tools/rift-smoke.js */
RIFT_MODE_KITS.waves={
  setup(run){ Object.assign(run.k,{w:0,start:0,size:0,dead:0}); RIFT_MODE_KITS.waves.hud(run); },
  tick(run,dt){ if(riftWaveStepS(run,0)==='won'){ riftWonS(run); return; } RIFT_MODE_KITS.waves.hud(run); },
  onKill(run,m){ if(m.riftW===run.k.w) run.k.dead++; },
  hud(run){ riftHudS(run,run.k.w|0,riftWaveClockS(run),0,0); },
};
