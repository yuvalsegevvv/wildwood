//@ Places the puzzle stones of the raids (2 trivial + 1 easy inside each stronghold's walls) and of the Deep Cave (41 over its four floors); both only while PZ_ON
/* Agent map. Data only; the rules (one solver, who is paid, new boards at a rebuild, cave material) are server/puzzles-group.js. Raid stones stand in the yard at fixed offsets from the site (RD_LAYOUT's
   gate-yard, clear of wards, packs and barricades); their kind is the land's (PZ_KIND_OF, 'rootlines' for the isles). Cave stones: floor n (1-4) gets PZ_CAVE_PLAN[n-1] stones (letters t/e/n/h/x = difficulty
   1-5), kinds by floor (PZ_CAVE_KIND), spots drawn from a seeded rng among free floor cells (caveFree, 1.6 m) at least 12 m from the lift, 8 m from a camp and 16 m from another stone. Ids: rd-<land>-1..3,
   cv<floor>-<nn>. Exports: pzGroupPlaceAll(), PZ_CAVE_PLAN, PZ_RAID_SPOTS. Users: server/puzzles.js (pzSwitch), tools/puzzles-smoke.js. Test: node tools/puzzles-smoke.js */
const PZ_RAID_SPOTS=[[-10,-21,1],[10,-21,1],[0,-31,2]];   // [dx, dz, difficulty] from the raid's site (x east, z south; the gate looks north)
const PZ_CAVE_PLAN=[{t:4,e:3,n:2,h:1,x:0},{t:4,e:3,n:2,h:1,x:0},{t:4,e:3,n:2,h:1,x:0},{t:3,e:3,n:2,h:1,x:2}];   // = 15 / 12 / 8 / 4 / 2 = 41
const PZ_CAVE_KIND=['rootlines','nonogram','mirrors','sokoban'];
const PZ_GROUP_DIFF={t:1,e:2,n:3,h:4,x:5};
let PZ_GROUP_DONE=false;
function pzGroupPlaceAll(){
  if(PZ_GROUP_DONE) return; PZ_GROUP_DONE=true;
  for(const id of RD_ORDER){
    const R=RDS[id]; if(!R) continue;
    PZ_RAID_SPOTS.forEach((sp,i)=>pzSiteAdd({id:'rd-'+R.land+'-'+(i+1),kind:PZ_KIND_OF[R.land]||'rootlines',diff:sp[2],x:R.x+sp[0],z:R.z+sp[1],lv:rdLevel(0),raid:R.land}));
  }
  CAVE_FLOOR_N.forEach((n,fi)=>{
    const F=caveFloorDef(n), B=caveBake(n), o=caveFloorOrigin(n), plan=PZ_CAVE_PLAN[fi]; if(!F||!B||!plan) return;
    const rng=mulberry32(0xca7e+n*977), lift=caveLiftOf(n), kind=PZ_CAVE_KIND[fi%PZ_CAVE_KIND.length], mine=[];
    const ok=(x,z)=>caveFree(x,z,1.6)&&Math.hypot(x-lift.x,z-lift.z)>12&&B.camps.every(c=>Math.hypot(o.x+c.x-x,o.z+c.z-z)>8)&&mine.every(s=>Math.hypot(s.x-x,s.z-z)>16);
    let k=0;
    for(const letter of ['x','h','n','e','t']) for(let i=0;i<plan[letter];i++){
      let at=null; for(let t=0;t<6000&&!at;t++){ const x=o.x+rng()*CAVE_SIZE, z=o.z+rng()*CAVE_SIZE; if(ok(x,z)) at={x,z}; }
      if(!at){ PZ_SITE_BAD.push('cv'+n+' no room'); continue; }
      const lv=F.lv?Math.round((F.lv[0]+F.lv[F.lv.length-1])/2):30; mine.push(at);
      pzSiteAdd({id:'cv'+n+'-'+String(++k).padStart(2,'0'),kind,diff:PZ_GROUP_DIFF[letter],x:at.x,z:at.z,lv:Math.max(1,lv),cave:n});
    }
  });
}
if(PZ_ON) pzGroupPlaceAll();
