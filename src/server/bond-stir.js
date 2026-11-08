//@ The hour's Stirrings on the server: each UTC hour a stirring zone per land, a stirring world boss and a stirring dungeon or raid (alternating); kills charge orbs open, boss kills, dungeon wins and raid clears open them
/* Agent map (skills revamp step 14; design: PLAN section 3b; the numbers: shared/bond.js BD_STIR_*; orbs: server/bond-orbs.js; test: tools/bond-smoke.js; hooks: grep -rn "// bond:" src).
   PICKS: bdStirPickS(ms?) fills S.bdStir = {h: the hour number, zones: {land: zone key}, zs: {String(zone key): true}, boss: BOSS_DEFS id, kind: 'dg' | 'rd', id: the dungeon theme or raid id}.
          Stateless: bdStirPick (shared/bond.js) deals each list in a seeded shuffle per cycle, so the same everywhere, every entry once before any returns, never the same one two hours running.
          Zones: one ordinary zone a land (a non-boss zone of a non-boss MON_DEFS kind: bdZonesByLand); dungeon on even hours, raid on odd hours. bdStirTickS (the tick) re-picks when the hour changes
          (the clock is Date.now(): a test fakes it, or passes ms to bdStirPickS) and sends event stir [msg]; welcome carries the same msg (bdStirMsg: {h, z: {land: key}, b, k, id}).
   CHARGE: bdChargeS(q, m) from rewardKill: a kill of a kind of the stirring zone adds 1 (3 for m.elite) to gear.bd.chg; never a Pipe monster (m.dip), a temp monster, a dungeon or raid monster, a boss or a cave floor's.
          Every BD_STIR_CHARGE opens one orb (bdOpenOrbP). With NO orb held the charge waits at the cap (BD_STIR_CHARGE) and is paid out when an orb arrives (bdChargeFlushP, called by the stall's purchase).
   BOSS: bdStirBossP(q, m, tier) from rewardKill (every helper with kill credit; the tier fought): the stirring boss opens BD_STIR_BOSS[tier] orbs (1 / 2 / 3 by percentage).
   CLEARS: bdStirDungeonP(p, run) from dgWinS opens BD_STIR_DG orbs for each member present when the run is the stirring dungeon; bdStirRaidP(p, R) from rdCheckClearS opens BD_STIR_RD for each member who took part.
   An orb not held is not opened and nothing is banked, except the charge (above). Used by: server/api.js (tick, welcome), combat.js, dungeons/runs.js, raids.js. */
const BD_ZONE_OF=Object.create(null), BD_ZONE_LISTS={};   // a kind's id -> its zone key (a string); land -> its ordinary zone keys (built once, bdZonesByLand)
function bdZonesByLand(){
  if(BD_ZONE_LISTS.built) return BD_ZONE_LISTS.by;
  const by={}, kinds=MON_DEFS.filter(d=>!d.boss).slice().sort((a,b)=>a.level-b.level);
  for(const d of kinds){ const zn=defZone(d); if(!zn||zn.boss) continue; const land=landAt(zn.x,zn.z), key=String(zn.key); BD_ZONE_OF[d.id]=key; if(!by[land]) by[land]=[]; if(!by[land].includes(key)) by[land].push(key); }
  BD_ZONE_LISTS.by=by; BD_ZONE_LISTS.built=true; return by;
}
const bdStirBossIds=()=>BOSS_DEFS.map(b=>b.def.id);
const bdStirDungeonIds=()=>{ const out=[]; for(const k of Object.keys(DG_ENTRANCES)){ const t=DG_ENTRANCES[k].theme; if(bdOwnKey(DG_THEMES,t)&&!DG_THEMES[t].dev&&!out.includes(t)) out.push(t); } return out; };
const bdStirHour=ms=>Math.floor((ms===undefined?Date.now():ms)/(BD_STIR_SECS*1000));
function bdStirPickS(ms){
  const h=bdStirHour(ms), by=bdZonesByLand(), zones={}, zs=Object.create(null);
  for(const land of Object.keys(by)){ const k=bdStirPick('zone:'+land,by[land],h); zones[land]=k; zs[k]=true; }
  const dg=h%2===0, id=dg?bdStirPick('dg',bdStirDungeonIds(),h>>1):bdStirPick('rd',RD_ORDER,h>>1);
  S.bdStir={h,zones,zs,boss:bdStirPick('boss',bdStirBossIds(),h),kind:dg?'dg':'rd',id};
  return S.bdStir;
}
const bdStirMsg=()=>{ const s=S.bdStir||bdStirPickS(); return {h:s.h,z:s.zones,b:s.boss,k:s.kind,id:s.id}; };
function bdStirTickS(){   // bond: the tick: a new hour, new picks, told to everyone
  if(S.bdStir&&S.bdStir.h===bdStirHour()) return;
  bdStirPickS(); ev('stir',bdStirMsg());
}
// charge held, orbs waiting: open one per BD_STIR_CHARGE while orbs are held; with none the charge stays at the cap
function bdChargeFlushP(p){
  const B=bdBagOf(p); let c=B.chg|0;
  while(c>=BD_STIR_CHARGE){ if(!bdOpenOrbP(p)){ c=BD_STIR_CHARGE; break; } c-=BD_STIR_CHARGE; }
  if(c) B.chg=c; else delete B.chg;
}
function bdChargeS(q,m){   // bond: rewardKill, after the raid / boss branches (the cheap tests first: this runs for every kill)
  const st=S.bdStir; if(!st||m.dip||m.inst||m.rd||m.temp||m.def.boss) return;
  const zk=BD_ZONE_OF[m.def.id]; if(zk===undefined||st.zs[zk]!==true||caveFloorAt(m.camp.x,m.camp.z)>=0) return;
  const B=bdBagOf(q); B.chg=Math.min(BD_STIR_CHARGE,(B.chg|0)+(m.elite?BD_STIR_ELITE:1)); bdChargeFlushP(q); q.dirty=true;
}
function bdStirBossP(q,m,tier){   // bond: rewardKill's boss branch
  const st=S.bdStir; if(!st||m.def.id!==st.boss||m.rd||m.inst) return;
  bdOpenManyP(q,bdRollRow(BD_STIR_BOSS[Math.max(0,Math.min(BD_STIR_BOSS.length-1,tier|0))],ssRand()));
}
function bdStirDungeonP(p,run){ const st=S.bdStir; if(st&&st.kind==='dg'&&run.theme&&run.theme.id===st.id) bdOpenManyP(p,BD_STIR_DG); }   // bond: dgWinS, for each member present
function bdStirRaidP(p,R){ const st=S.bdStir; if(st&&st.kind==='rd'&&R&&R.id===st.id) bdOpenManyP(p,BD_STIR_RD); }   // bond: rdCheckClearS, for each member who took part
