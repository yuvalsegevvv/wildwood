//@ The Sakura Vale east of the Greyfall River on the atlas: the border bridge (TUN, once a tunnel, at the home | vale gate), Hanami village (VIL2, at the vale's hub), zones 16-25 (the atlas's cells), the boss arenas of the home forest and the vale (ARENAS), vilAt (which knows all the villages). Pure.
/* ===================== THE SAKURA VALE =====================
   A second land behind the Greyfall River, reached over a bridge whose gate stays shut for each player
   until they help defeat the Rootwarden (gear.east: 0 sealed, 1 bridge open, 2 walked to Hanami: circles attuned).
   Everything stands where the world atlas puts it (shared/world-atlas.js): the bridge at the gate 'The Greyfall Bridge', Hanami at the vale's hub, zones 16-25 as the atlas's cells (zones.js makes their records),
   the boss arenas at the atlas's pois. Hanami's own ground (70 m round the hub) has no monsters. Levels 16-25, two monster kinds per zone, bosses at 20 (in zone 20) and 25. */

/* ---- the border bridge (it was a tunnel through a mountain spur; the home | vale border is the atlas's river now): a stone bridge over the Greyfall River at the atlas's gate, with a gate across its west end
   that stays shut for each player until they help defeat the Rootwarden. The name TUN stays from the tunnel it replaced. The river runs north-south there, the deck east-west.
   x0..x1: the paved approach (no plants, no camps); p0..p1: the deck from bank to bank, kept between its parapets (w: half its width), the gate at p0;
   floor(x): the deck's height (the banks' at both ends, an arch of 1.4 m between); roof: the gate's height. ---- */
function findTunnel(){
  const G=WA_GATES.find(g=>g.name==='The Greyfall Bridge'), z=G.z;
  let xw=G.x, xe=G.x; while(waWaterDist(xw,z)<=1&&xw>G.x-90) xw-=2; while(waWaterDist(xe,z)<=1&&xe<G.x+90) xe+=2;   // the river's banks along the deck
  const p0=xw-16, p1=xe+16, h0=baseHeight(p0,z), h1=baseHeight(p1,z);
  const T={x0:p0-14,x1:p1+14,z,w:4,h0,h1,roof:6.2,p0,p1};
  T.floor=x=>lerp(h0,h1,smoothstep(p0,p1,x))+Math.sin(clamp((x-p0)/(p1-p0))*Math.PI)*1.4;
  return T;
}
const TUN=findTunnel();
// keep trees, rocks and camps off the bridge's approach (m = extra margin)
function inTunnelCut(x,z,m){ return Math.abs(z-TUN.z)<TUN.w+6+(m||0) && x>TUN.x0-30-(m||0) && x<TUN.x1+30+(m||0); }

/* ---- Hanami, the vale's village: same plan as the home village (so every NPC role works the same), at the atlas's hub of the vale, its road turned toward the bridge's east end */
const VIL2=(()=>{ const v=hubVillageSpot('vale'); return layoutVillage(v,{seed:7171,ent:Math.atan2(TUN.x1+10-v.x,TUN.z-v.z),plan:{arc:0.7,jit:0.05,turn:0.14,rad:i=>i===4?24:(i%2?19.5:24.5),dims:{w:[5.2,6.4],d:[5.2,6.2]},kinds:['wing','plain','loft','plain','tav','wing','plain','loft','plain']}}); })();
VIL2.name='Hanami'; VIL.name='the village';
// (VILS, with Rimehold, is in hoarfrost.js)
// on (or m metres from) any village's teleport circle
function nearTele(x,z,m){ const V=vilAt(x,z); return Math.hypot(x-V.tele.x,z-V.tele.z)<V.tele.r+m; }
// the village whose land a point is in (every "near the village" test uses this one): the home forest, the vale, the Hoarfrost Reach
function vilAt(x,z){ const l=waLandId(x,z); return l===0?VIL:l===1?VIL2:l===2?VIL3:l===3?VIL4:l===5?VIL6:l===6?VIL7:VIL5; }   // the village of the point's land (the atlas): VIL5, Glasswell, is in shared/glasswell.js

/* ---- zones 16-25: the atlas's cells of the vale (zones.js: zoneOfAtlas). Zone 16 is Hanami's own (Petal Meadow round the village). */
const VALE_ZONE_NAMES={16:'Petal Meadow',17:'Kodama Wood',18:'Fox Hills',19:'Bamboo Sea',20:'Ghostlight Marsh',21:'Oni Crags',22:'Jade Falls',23:'Tengu Peaks',24:'Warlord Ruins',25:'Thunder Grove',boss25:'Foxfire Hollow'};
for(let k=16;k<=25;k++) zoneOfAtlas(WA_ZONES.find(A=>A.land==='vale'&&A.key===k),{ring:3,vale:true,name:VALE_ZONE_NAMES[k],level:k,boss:false});
function valeZoneAt(x,z){ return atlasZoneAt(x,z); }   // (the vale's zones and the home forest's are read the same way: zones.js)

/* ---- boss arenas: flat clearings like the stone circle, each at the atlas's poi: ARENA the Stone Circle (home zone 15), ARENA20 the Demon Gate (Akaoni, in zone 20), ARENA25 the Foxfire Hollow (Kyuubi, in zone 25) ---- */
// the flattest spot within span of (cx, cz), on dry land clear of the coast, a land border, a river or a lake (for the lands that have not placed their arenas on the atlas's pois yet)
function flatSpot(cx,cz,span){
  let best=null;
  for(let dx=-span;dx<=span;dx+=10) for(let dz=-span;dz<=span;dz+=10){
    const x=cx+dx, z=cz+dz;
    if(waCoast(x,z)<60||waLandBorderDist(x,z)<50||waWaterDist(x,z)<28) continue;
    let mn=1e9,mx=-1e9,sum=0,c=0;
    for(let rr=0;rr<=22;rr+=11) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
    const mean=sum/c; if(mean<1.2) continue;
    const score=mx-mn+Math.hypot(dx,dz)*0.05;
    if(!best||score<best.score) best={x,z,h:mean,score};
  }
  return best||{x:cx,z:cz,h:Math.max(4,baseHeight(cx,cz))};
}
const ARENA20=Object.assign(arenaAtPoi(poiNamed('Demon Gate')),{r:20,key:'boss20',name:'Demon Gate'});
const ARENA25=Object.assign(arenaAtPoi(poiNamed('Foxfire Hollow')),{r:20,key:'boss25',name:'Foxfire Hollow'});
ARENA.name='The Stone Circle';
const ARENAS=[ARENA,ARENA20,ARENA25];
// an arena's own zone (a circle of 20 m: zoneAt gives it to anyone within r + 26 m)
ARENA.zone={key:'boss',ring:2,arena:true,x:ARENA.x,z:ARENA.z,R:20,name:'The Stone Circle',level:15,boss:true}; ZONES.push(ARENA.zone);
ARENA20.zone={key:'boss20',ring:3,arena:true,vale:true,x:ARENA20.x,z:ARENA20.z,R:20,name:'Demon Gate',level:20,boss:true}; ZONES.push(ARENA20.zone);
ARENA25.zone={key:'boss25',ring:3,arena:true,vale:true,x:ARENA25.x,z:ARENA25.z,R:20,name:'Foxfire Hollow',level:25,boss:true}; ZONES.push(ARENA25.zone);
// the nearest arena's centre distance (vegetation and camps stay out of all three; pvp: the Proving Isle counts as one, 15 m closer than it is, so trees, camps and nodes keep off it and its ground is tinted like an arena floor)
function arenaDist(x,z){ let m=Math.hypot(x-PVP_ISLE.x,z-PVP_ISLE.z)-15; for(const A of ARENAS){ const d=Math.hypot(x-A.x,z-A.z); if(d<m) m=d; } return m; }
