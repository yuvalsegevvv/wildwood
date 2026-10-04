//@ Dungeon mission kit Hunt: an elusive elite quarry, sighted on the map every 30 s, bolts to the far side of the map when a member comes within 18 m in sight (or hits it); after 3 bolts it is winded and slow; 10 minutes to kill it; its death calls the boss
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names; its helpers are fields of the kit: DG_KITS.hunt.bolt / ping / hud, the quarry of each dungeon DG_KITS.hunt.quarry)
   uses: dgObjS, dgObjDelS, dgBossS (kits.js), dgSpawnS, dgFlowToS (mobs.js), fx.js (dgWalkS, dgFarCellS, dgObjMoveS, dgPacksS, dgGuardiansS, dgWalkersS), dgLoseS (runs.js)
   test: tools/dungeon-missions-smoke.js (won through the boss on two themes; it bolts, is winded after 3, the sightings move; lost when the 10 minutes run out)
   run.k = {q (the quarry: an elite, m.dgOwn while it is elusive: the kit moves it), bolts 0..3, goal {x, z} | null (local: where it is running to), boltT (seconds into the bolt),
            hp0 (its health last tick: a hit makes it bolt), ping (the objective 'ping': v = how many sightings), pingT, pings, winded}
   HUD (run.hud): [sightings so far, bolts 0-3 (3 = winded), seconds left of the 10 minutes]
   Numbers (docs/DUNGEONS.md sections 4 and 12): the quarry of each dungeon (DUNGEON-THEMES section 3's skins): the Hollow Roots a runaway Shroomling, the Jade Springs a Karasu
   Tengu, the Barrow a Barrow Wight (a theme without one: its first walker), an elite (health x2.5, x the party's), set at the free cell farthest from the entrance;
   a sighting every 30 s (the first at once): the objective moves to the middle of a tile within one tile of the quarry's (+-1 tile); it bolts when a living member is
   within 18 m in its line of sight, or when it is hit, while it has bolts left: to the free cell the flow field puts farthest from that member (not the boss hall, not the
   entrance tile), at DG_KITS.hunt.boltV = 8 m/s (a running hiker is 9.5), ignoring everything; a bolt ends when it arrives or after 20 s; after the third it is winded: handed
   back to the walkers' AI (m.dgOwn = false) at 0.4 of its speed (m.slowT) and it fights. The limit is 600 s from setup (not scaled): lose "the quarry got away.". The rest:
   packs of 1-2 walkers at 50% of the mouths, the room guardians. */
dgDefineKit('hunt',{
  quarry:{hollowroots:'shroom',jadesprings:'tengu',bonefrostbarrow:'barrowwight',blackseam:'minegoblin'}, boltV:8, near:18, limit:600, every:30,
  setup(run){
    const H=DG_KITS.hunt, walk=dgWalkersS(run), id=H.quarry[run.th]&&DEF_BY_ID[H.quarry[run.th]]?H.quarry[run.th]:walk[0]||'slime';
    const at=dgFarCellS(run,run.B.start.x,run.B.start.z,0.9)||{x:run.B.start.x,z:run.B.start.z};
    dgPacksS(run,{p:0.5,min:1,max:2,role:'roam',salt:0x47});
    dgGuardiansS(run,{sites:false,rooms:true,role:'guard'});
    const q=dgSpawnS(run,id,at.x,at.z,{elite:true,role:'quarry'});
    run.k={q,bolts:0,goal:null,boltT:0,hp0:q?q.hp:0,ping:null,pingT:0,pings:0,winded:false};
    if(!q){ dgBossS(run); run.hud=[0,0,0]; return; }
    q.dgOwn=true; q.state='idle';
    toastTo(null,'Hunt down the '+q.def.name+' within 10 minutes: it bolts when it sees you coming.','');
    H.ping(run); H.hud(run);
  },
  tick(run,dt){
    const k=run.k, H=DG_KITS.hunt, q=k.q;
    if(!q||q.dead||q.remove){ H.hud(run); return; }
    if(run.t>=H.limit){ dgLoseS(run,'the quarry got away.'); return; }
    k.pingT-=dt; if(k.pingT<=0) H.ping(run);
    if(!k.winded){
      const ql=dgLocalS(run,q.x,q.z);
      if(k.goal){
        k.boltT+=dt;
        const d=dgWalkS(run,q,k.goal.x,k.goal.z,dt,H.boltV,1.2);
        if(d<=1.2||k.boltT>20){ k.goal=null; k.bolts++;
          if(k.bolts>=3){ k.winded=true; q.dgOwn=false; q.slowT=1e6; q.aggro=false; q.tgt=null; toastTo(null,'The '+q.def.name+' is winded and slow: finish it!','good'); } }
      } else {
        q.vx=q.vz=0; q.state='idle'; if(q.stunT>0) q.stunT-=dt;
        const seen=dgMembersS(run).find(p=>Math.hypot(p.x-q.x,p.z-q.z)<H.near&&dgLos(run.B,ql.x,ql.z,p.x-run.ox,p.z-run.oz));
        const hit=q.hp<k.hp0;
        if(seen||hit) H.bolt(run,seen||dgMembersS(run).reduce((a,p)=>!a||Math.hypot(p.x-q.x,p.z-q.z)<Math.hypot(a.x-q.x,a.z-q.z)?p:a,null));
      }
    }
    k.hp0=q.hp;
    H.hud(run);
  },
  bolt(run,p){
    const k=run.k, q=k.q, from=p?dgLocalS(run,p.x,p.z):dgLocalS(run,q.x,q.z), g=dgFarCellS(run,from.x,from.z,Math.min(q.T.rad,DG_WALKER_R));
    if(!g) return;
    k.goal={x:g.x,z:g.z}; k.boltT=0; ev('roar',q.id);
    toastTo(null,'The '+q.def.name+' bolts!','bad');
  },
  // a sighting: the middle of a tile of the layout within one tile of the quarry's
  ping(run){
    const k=run.k, q=k.q, l=dgLocalS(run,q.x,q.z), tx=Math.floor(l.x/DG_TILE), tz=Math.floor(l.z/DG_TILE);
    const near=run.B.layout.cells.filter(c=>Math.abs(c.x-tx)<=1&&Math.abs(c.z-tz)<=1), c=near[Math.floor(Math.random()*near.length)]||{x:tx,z:tz};
    const x=(c.x+0.5)*DG_TILE, z=(c.z+0.5)*DG_TILE;
    k.pings++; k.pingT=DG_KITS.hunt.every;
    if(!k.ping) k.ping=dgObjS(run,'ping',x,z,{r:DG_TILE/2,v:k.pings});
    else { k.ping.v=k.pings; dgObjMoveS(run,k.ping,x,z); }
  },
  onKill(run,m){
    if(m!==run.k.q) return;
    if(run.k.ping){ dgObjDelS(run,run.k.ping); run.k.ping=null; }
    toastTo(null,'The quarry is down!','good');
    dgBossS(run);
  },
  hud(run){ const k=run.k; run.hud=[k.pings,k.bolts,Math.max(0,Math.ceil(DG_KITS.hunt.limit-run.t))]; }
});
