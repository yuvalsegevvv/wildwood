//@ Bond Orbs on the server: orbs held per character (gear.bd.<set>.o), the orb stall (bd 'orb': 1 coin each), the pouch's pick (bd 'pick'), opening an orb for 1 / 2 / 3 Bondstones
/* Agent map (skills revamp step 13; design: PLAN section 3; rules and numbers: shared/bond.js BD_ORB_*; the Stirrings that open orbs: server/bond-stir.js; test: tools/bond-smoke.js; hooks: grep -rn "// bond:" src).
   SAVED: gear.bd.<set>.o = orbs held (0..BD_ORB_MAX, dropped when 0), gear.bd.pick = the set whose orbs open next (bdSanitize in server/bond.js; known set ids only).
   MESSAGES (MSG.bd in server/bond.js): bd {a:'orb', set, n}: buy n orbs of one character at BD_ORB_PRICE each, n clamped to 1..BD_ORB_BUY_MAX and charged once (never more than the pouch can hold);
          bd {a:'pick', set}: the pouch's pick (null clears it). Both toast their refusal. An orb arriving also pays out a waiting charge (bdChargeFlushP).
   OPENING: bdOpenOrbP(p) takes one orb of bdOrbSetOf(p) (the pick when it has an orb held, else the set with the most orbs, ties by SS_ORDER), rolls 1 / 2 / 3 stones (BD_ORB_ROLL, ssRand) and hands them to
          bdAddStonesP (what the Bond steps still need is kept, the rest is coins). Event orb [pid, set, stones rolled, coins paid]. Returns {set, n, st, coins} or null when no orb is held.
          bdOpenManyP(p, n): up to n orbs (the stirring boss, dungeon and raid pay this way; an orb not held is not opened and nothing is banked).
   Used by: server/bond.js (MSG.bd, bdSanitize), server/bond-stir.js, game/bond/orbs.js (the stall's panel). */
const bdBagOf=p=>p.gear.bd||(p.gear.bd={[BD_WANDERER]:{r:0}});
const bdOrbsOf=(p,k)=>{ const e=bdSetOk(k)?bdEntry(p.gear,k):null; return e?e.o|0:0; };
const bdOrbsHeldP=p=>{ let n=0; for(const k of SS_ORDER) n+=bdOrbsOf(p,k); return n; };
function bdOrbSetOf(p){
  const pk=bdBagOf(p).pick; if(bdSetOk(pk)&&bdOrbsOf(p,pk)>0) return pk;
  let best=null, bn=0; for(const k of SS_ORDER){ const n=bdOrbsOf(p,k); if(n>bn){ best=k; bn=n; } }
  return best;
}
function bdOrbBuyP(p,k,n){
  if(!bdSetOk(k)) return 'unknown character';
  n=clampInt(n,1,BD_ORB_BUY_MAX,1);
  const e=bdEntryW(p.gear,k), room=BD_ORB_MAX-(e.o|0); n=Math.min(n,room);
  if(n<=0) return bdRefuse(p,'You hold the most '+SS_SETS[k].char.name+' orbs the pouch can carry');
  const cost=n*BD_ORB_PRICE; if(!(p.gear.coins>=cost)) return bdRefuse(p,'Orbs cost '+BD_ORB_PRICE+' coin each: '+n+' need '+cost+' coins');
  p.gear.coins-=cost; e.o=(e.o|0)+n; p.dirty=true;
  toastTo(p.id,'+'+n+' '+SS_SETS[k].char.name+' orb'+(n===1?'':'s'),'good');
  bdChargeFlushP(p); return null;
}
function bdPickP(p,k){
  const B=bdBagOf(p);
  if(k===null||k===''){ delete B.pick; p.dirty=true; return null; }
  if(!bdSetOk(k)) return 'unknown character';
  B.pick=k; p.dirty=true; return null;
}
function bdOpenOrbP(p){
  const k=bdOrbSetOf(p); if(!k) return null;
  const e=bdEntryW(p.gear,k); e.o=(e.o|0)-1; if(e.o<=0) delete e.o;
  const n=bdRollRow(BD_ORB_ROLL,ssRand()), r=bdAddStonesP(p,k,n,true);
  ev('orb',p.id,k,n,r.coins); p.dirty=true;
  return {set:k,n,st:r.st,coins:r.coins};
}
function bdOpenManyP(p,n){
  let got=0; for(let i=0;i<n;i++){ if(!bdOpenOrbP(p)) break; got++; }
  if(got<n&&!got) toastTo(p.id,'Stirring: you hold no Bond Orbs to open (the orb stall in the home village sells them)','');
  return got;
}
