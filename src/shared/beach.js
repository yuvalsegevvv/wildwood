//@ The Crownsea Shore's boss arena (ARENA_TIDE): a flat terrace on the home forest's south beach, where Carapax, the Tide King, lives. Pure.
/* Like the vale's and the Reach's boss arenas (flatSpot in vale.js only searches the vales), but found along the beach: about 50-60 m in from
   the sea, so the arena's south edge is wet sand and the tide's waves (server/boss-kits-home.js) come up out of the water. beachSpot picks the
   flattest terrace near x = cx, away from the river and the road. The zone is a boss zone like the other arenas' (edgeZoneAt in zones.js
   gives it to anyone within r + 26 m, zonePoint centres it: arena:true). */
function beachSpot(cx,span){
  let best=null;
  for(let dx=-span;dx<=span;dx+=10) for(const c of [50,54,58]){
    const x=cx+dx; let z=WZ1-c; for(let i=0;i<6;i++) z+=coastDist(x,z)-c;   // the z that is c metres in from the sea
    if(riverDist(x,z)<70||roadDist(x,z)<25||LAKES.some(L=>Math.hypot(x-L.x,z-L.z)<L.r+25)) continue;
    let mn=1e9,mx=-1e9,sum=0,n=0;
    for(let rr=0;rr<=22;rr+=11) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; n++; }
    const mean=sum/n; if(mean<2.5) continue;
    const score=mx-mn+Math.abs(dx)*0.05;
    if(!best||score<best.score) best={x,z,h:mean,score};
  }
  return best||{x:cx,z:WZ1-54,h:3.4};
}
const ARENA_TIDE=Object.assign(beachSpot(-130,40),{r:20,key:'boss20b',name:"The Tide King's Beach",beach:true});
ARENA_TIDE.zone={key:'boss20b',ring:3,arena:true,x:ARENA_TIDE.x,z:ARENA_TIDE.z,R:20,name:ARENA_TIDE.name,level:20,boss:true};
ZONES.push(ARENA_TIDE.zone); ARENAS.push(ARENA_TIDE);
