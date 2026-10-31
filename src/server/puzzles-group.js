//@ Puzzle stones for groups: a dungeon run's three side stones, the raids' stones inside the walls and the Deep Cave's chest in cave material (all behind PZ_ON)
/* Agent map. Doc: docs/PUZZLES.md (round 7). Test: node tools/puzzles-smoke.js. Placement of raid / cave stones: shared/puzzle-group.js.
   DUNGEON: at the run's setup (dgSetupS hook) 2 trivial + 1 easy stones (objective kind 'pzstone') stand beside three monster mouths of the side rooms, boards seeded by the run's seed; a member uses one
   (dg{a:'use'}) and solves it alone while it is open; the chest (the renewable design, no gems, no Sigils, no gear roll) pays every member present. RAID: a stone with S.raid; the board is new at every rebuild
   (RD_PZ[land].gen), one solver at a time, solved = dim until the rebuild; the chest pays every player within RD_FOOT of the site, and an easy stone adds 1 of the raid material. CAVE: a site with S.cave pays
   like any stone, but the chest's drops are that floor's cave material (gear.cave.m). Exports: pzDgSetupS(run), pzDgUseP(run,p,ob), pzRaidOpenP(p,S), pzRaidRebuiltS(land), pzGrpPayP(p,O). Users: server/dungeons/runs.js, lobby.js,
   raids.js, server/puzzles.js. */
const RD_PZ={};   // land -> {gen, solved: Set of site ids, by: {site id: player id}}
const rdPzOf=land=>RD_PZ[land]||(RD_PZ[land]={gen:0,solved:new Set(),by:{}});
function pzRaidRebuiltS(land){ const st=rdPzOf(land); st.gen++; st.solved.clear(); st.by={}; }
// the open board stays this player's while their p.pz points at it
const pzHeldBy=(q,site)=>q&&!q.dead&&q.pz&&q.pz.site===site;
function pzRaidOpenP(p,ST){
  const R=rdOfLand(ST.raid), st=rdPzOf(ST.raid); if(!R) return;
  if(st.solved.has(ST.id)){ pzNo(p,'The stone is dim. It lights again when the stronghold is rebuilt'); return; }
  const by=st.by[ST.id]; if(by&&by!==p.id&&pzHeldBy(S.players.get(by),ST.id)){ pzNo(p,'Someone is already working this stone'); return; }
  st.by[ST.id]=p.id; pzOpenS(p,ST.id,ST.kind,ST.diff,pzSeed(ST.id,ST.diff,st.gen),ST.lv,false,'raid');
}
// dungeons: three stones per run at the mouths of rooms that are not the entrance or the boss hall, drawn by the run's seed
function pzDgSetupS(run){
  if(!PZ_ON||run.endT||run.pzs) return; run.pzs=1;
  const rng=mulberry32((run.seed|0)^0x9e57), mouths=run.B.marks.S.filter(s=>s.role!=='start'&&s.role!=='boss');
  for(let i=mouths.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [mouths[i],mouths[j]]=[mouths[j],mouths[i]]; }
  const kinds=Object.keys(PZ_KINDS);
  [1,1,2].forEach((d,i)=>{
    const m=mouths[i%Math.max(1,mouths.length)]||{x:run.B.start.x,z:run.B.start.z}, at=dgFreeNearS(run,m.x+2.5,m.z+2.5,1);
    const kind=kinds[Math.floor(rng()*kinds.length)], seed=(rng()*4294967295)>>>0;
    dgObjS(run,'pzstone',at.x,at.z,{r:2,pz:{kind,diff:d,seed}});
  });
}
function pzDgUseP(run,p,ob){
  if(!PZ_ON||ob.st!==1||!ob.pz||p.pz) return;
  if(ob.by&&ob.by!==p.id&&pzHeldBy(S.players.get(ob.by),ob.id)){ pzNo(p,'Someone is already working this stone'); return; }
  ob.by=p.id; pzOpenS(p,ob.id,ob.pz.kind,ob.pz.diff,ob.pz.seed,run.L,false,'dg'); p.pz.run=run; p.pz.ob=ob;
}
// a won group board: who is paid, then the chest for each of them (the solver sees the sheet, the others a line)
function pzGrpPayP(p,O){
  let who=[], extra=null;
  if(O.src==='dg'){ const run=O.run; if(!run||run.endT||dgRunOf(p)!==run||O.ob.st!==1) return; dgObjSetS(run,O.ob,2,O.ob.v); who=dgPresentS(run); }
  else if(O.src==='raid'){
    const S0=pzSiteOf(O.site), R=S0&&rdOfLand(S0.raid), st=S0&&rdPzOf(S0.raid); if(!R||st.solved.has(O.site)) return;
    st.solved.add(O.site); delete st.by[O.site];
    who=[...S.players.values()].filter(q=>!q.dead&&Math.hypot(q.x-R.x,q.z-R.z)<=RD_FOOT);
    if(O.diff>=2) extra=R;
  }
  if(!who.includes(p)) who.push(p);
  const out={t:'pz',a:'done',ok:1,diff:O.diff,site:O.site,first:false,src:O.src,secs:Math.round((Date.now()-O.t0)/1000)};
  for(const q of who){
    const got=pzChestP(q,O.diff,O.lv,false);
    if(extra){ const M=rdMatsOf(q); M[extra.land]=Math.min(RD_MAT_MAX,(M[extra.land]|0)+1); got.mats.push([extra.mat,1]); }
    if(q===p) sendTo(q.id,Object.assign({chest:got},out));
    else toastTo(q.id,p.name+' solved the stone: '+got.coins+' coins and a chest of goods for you too.','good');
    q.dirty=true;
  }
}
