//@ Dungeon mission kit Siege: three altars in the site rooms, one after another; each fills over 60 s only while a member stands in its circle, its room is hit by waves meanwhile, the next is revealed when it is full, the last wakes the boss
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names; its helpers are fields of the kit: DG_KITS.siege.reveal / hud)
   uses: dgObjS, dgObjSetS, dgBossS (kits.js), dgSpawnS (mobs.js), fx.js (dgMouthsS, dgPacksS, dgGuardiansS, dgFreeNearS, dgAliveS, dgPickWalkerS)
   test: tools/dungeon-missions-smoke.js (won through the boss on two themes; the fill only grows with someone in the circle, decays to its quarter floor; lost = everyone down)
   run.k = {sites (the three site O marks, nearest the entrance first), i (the altar now, 0..2), alt (its objective 'altar': v = its fill %, sent every 5%), fill 0..1, floor
            (the quarter it cannot fall below), on (someone has stepped in: its waves run), spawnT, waves (count), mouths (S marks for this altar), inside (someone in the circle now)}
   HUD (run.hud): [altar 1-3, its fill %, 1 while someone stands in its circle else 0]
   Numbers (docs/DUNGEONS.md sections 4 and 12): the circle is DG_KITS.siege.r = 5 m; a full altar is 60 s of standing in it (the timer is not scaled by the head count);
   EMPTY, IT DECAYS at a third of the fill rate (1/180 a second) but never below the last quarter reached (25 / 50 / 75%): it "does not decay completely". Once someone has
   stepped in, a wave of 3 walkers (4 for the second and third altars) every 12 s from the mouths of its room and the rooms next to it, coming for you, every second wave with
   an elite in it, at most 40 alive. The rest of the map: packs of 1-2 walkers at 45% of the other mouths, and the room guardians. */
dgDefineKit('siege',{
  r:5, fillS:60,
  setup(run){
    const cells=new Map(run.B.layout.cells.map(c=>[c.x+','+c.z,c])), dist=o=>{ const c=cells.get(o.tile[0]+','+o.tile[1]); return c?c.dist:99; };
    const sites=run.B.marks.O.filter(o=>o.role==='site').sort((a,b)=>dist(a)-dist(b)).slice(0,3);
    run.k={sites,i:0,alt:null,fill:0,floor:0,on:false,spawnT:0,waves:0,mouths:[],inside:false};
    dgPacksS(run,{p:0.45,min:1,max:2,role:'roam',salt:0x51,skip:sites.map(o=>o.tile)});
    dgGuardiansS(run,{sites:false,rooms:true,role:'guard'});
    if(!sites.length){ dgBossS(run); run.hud=[3,100,0]; return; }
    DG_KITS.siege.reveal(run);
  },
  reveal(run){
    const k=run.k, o=k.sites[k.i], at=dgFreeNearS(run,o.x,o.z,1);
    k.alt=dgObjS(run,'altar',at.x,at.z,{r:DG_KITS.siege.r,v:0}); k.fill=0; k.floor=0; k.on=false; k.spawnT=3; k.waves=0; k.mouths=dgMouthsS(run,o.tile,0,1);
    toastTo(null,'Altar '+(k.i+1)+' of '+k.sites.length+' is revealed: stand in its circle to channel it.','');
    DG_KITS.siege.hud(run);
  },
  tick(run,dt){
    const k=run.k, G=DG_KITS.siege, a=k.alt; if(!a||a.st!==1){ G.hud(run); return; }
    k.inside=dgMembersS(run).some(p=>Math.hypot(p.x-a.x,p.z-a.z)<=G.r);
    if(k.inside){ if(!k.on){ k.on=true; toastTo(null,'The altar stirs: hold its circle.','bad'); } k.fill=Math.min(1,k.fill+dt/G.fillS); k.floor=Math.max(k.floor,Math.floor(k.fill*4)/4); }
    else k.fill=Math.max(k.floor,k.fill-dt/(G.fillS*3));
    if(k.on){ k.spawnT-=dt; if(k.spawnT<=0){ k.spawnT=12; k.waves++;
      const n=Math.min(k.i?4:3,DG_WAVE_ALIVE-dgAliveS(run));
      for(let j=0;j<n;j++){ const s=k.mouths[(k.waves+j)%k.mouths.length], ang=Math.random()*TAU, r=1+Math.random()*2; dgSpawnS(run,dgPickWalkerS(run),s.x+Math.sin(ang)*r,s.z+Math.cos(ang)*r,{role:'siege',hunt:true,elite:j===0&&k.waves%2===0}); } } }
    const pc=Math.floor(k.fill*100);
    if(k.fill>=1){
      dgObjSetS(run,a,2,100); k.i++;
      toastTo(null,'The altar is full ('+k.i+' of '+k.sites.length+').','good');
      if(k.i>=k.sites.length){ k.alt=null; dgBossS(run); } else G.reveal(run);
    } else if(Math.floor(pc/5)!==Math.floor(a.v/5)) dgObjSetS(run,a,1,pc);
    G.hud(run);
  },
  hud(run){ const k=run.k; run.hud=[Math.min(k.sites.length||3,k.i+1),k.alt?Math.floor(k.fill*100):100,k.inside?1:0]; }
});
