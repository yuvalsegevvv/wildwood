//@ Monster zones of the home forest (ZONES, zoneAt, zonePoint, defZone): three rings round the village plus the edge zones (shore, Sunwall, foothills), dividing ridges (zoneRidge), boss arena (ARENA); the vale's zones are in vale.js, the Hoarfrost Reach's in hoarfrost.js. Pure.
/* ---------- monster zones ----------
   The wilds are split into 16 zones in three rings around the village, one zone per monster (and one for the boss).
   Zones are walled off by low ridges (well below the border mountains) with a pass in the middle of each wall;
   where the river runs through, it does the separating instead. Levels spiral outward: 1-6 in the inner ring,
   7-11 in the middle ring (7 starts just outside 6), 12-15 and the boss in the outer ring (12 starts just outside 11). */
const RINGS=[70,165,255,358], RIDGE_H=7;
const ZONE_RINGS=[[1,2,3,4,5,6],[7,8,9,10,11],[12,13,14,15,'boss']];
const ZONE_NAMES={1:'Slime Meadow',2:'Mushroom Hollow',3:'Beetle Thicket',4:'Boar Run',5:'Goblin Woods',6:'Treant Grove',7:'The Bog',8:'Deathcap Dell',9:'Ironshell Ridge',10:'Dire Wallows',11:'Hobgoblin Warrens',12:'Rotwood',13:'Ember Flats',14:"Chieftain's Hold",15:'Ancient Grove',boss:'The Stone Circle'};
const ZONES=[], RING_START=[];
{ let start=VIL.ent;
  ZONE_RINGS.forEach((keys,i)=>{
    const w=TAU/keys.length;
    if(i>0){ const prev=ZONE_RINGS[i-1]; start=RING_START[i-1]+(prev.length-1)*(TAU/prev.length); }
    RING_START[i]=start;
    keys.forEach((key,j)=>ZONES.push({key,ring:i,j,center:start+j*w,w,r0:RINGS[i],r1:RINGS[i+1],name:ZONE_NAMES[key],level:key==='boss'?15:key,boss:key==='boss'}));
  });
}
/* The forest's edges have zones of their own, with the creatures that belong there (docs/WORLD.md): the Crownsea Shore
   (shore crabs and tide slimes on the beach), the Sunwall's Foot (sun scarabs in the red scree) and the Greyspine Foothills
   (ram-horned boars and crag wardens). Levels 16-20: optional ground for players back from the vale, not on the main quest's path. Their monsters name their zone (zone:'shore'... in MON_DEFS). Beyond the outer ring, the outer ring's
   zones reach on to the land's edge (all but the boss zone), so every part of the forest has monsters. The Vale Wall (east)
   has none. lvText: the levels a zone holds, when it holds more than one. */
const EDGE_ZONES=[   // label: where the map writes the name (clear of the ring zones' names)
  {key:'shore',name:'The Crownsea Shore',level:16,lvText:'16-17',edge:'shore',label:[170,396]},
  {key:'sunfoot',name:"The Sunwall's Foot",level:18,edge:'west',label:[-350,170]},
  {key:'foothills',name:'The Greyspine Foothills',level:19,lvText:'19-20',edge:'north',label:[250,-372]}];
EDGE_ZONES.forEach(zn=>{ zn.ring=3; ZONES.push(zn); });
// undefined: not near an edge (the rings decide); null: an edge with no monsters (the sea, the cliff face)
function edgeZoneAt(x,z){
  const c=coastDist(x,z); if(c<74) return c>20?EDGE_ZONES[0]:null;
  const w=x-WX0-sunwallLine(z); if(w<62) return w>8?EDGE_ZONES[1]:null;
  if(z-HZ0-rimWobble(x,11)<100) return EDGE_ZONES[2];
  if(HALF-x<58) return null;
  return undefined;
}
// the monster kind's zone: its own (edge kinds) or the zone of its level
function defZone(d){ const k=d.zone||d.level; return ZONES.find(zn=>zn.key===k); }
function zoneAt(x,z){
  if(inVale(x)) return inHoar(x,z)?hoarZoneAt(x,z):valeZoneAt(x,z);
  const ez=edgeZoneAt(x,z); if(ez!==undefined) return ez;
  const dx=x-VIL.x, dz=z-VIL.z, r=Math.hypot(dx,dz);
  if(r<RINGS[0]) return null;
  const i=r<RINGS[1]?0:r<RINGS[2]?1:2, n=ZONE_RINGS[i].length, w=TAU/n;
  const rel=(((Math.atan2(dx,dz)-RING_START[i]+w/2)%TAU)+TAU)%TAU;
  const zn=ZONES.find(zn=>zn.ring===i&&zn.j===Math.floor(rel/w)%n);
  return r>=RINGS[3]&&zn.boss?null:zn;
}
// how far the outer ring reaches from the village along angle a: to 20 m short of the land's edge
function ringReach(a){ const s=Math.sin(a), c=Math.cos(a), t=v=>v>1e-6?(HALF-20)/v:1e9; return Math.min(t(Math.abs(s)),t(Math.abs(c)))-Math.hypot(VIL.x,VIL.z); }
/* fa, fr: -0.5..0.5 across the zone's angle, 0..1 from its inner to its outer edge (vale zones: angle and distance from the centre;
   edge zones: along the edge and in from it). full: an outer-ring zone's whole reach out to the land's edge (the camps), not just
   its ring (labels, quest markers) */
function zonePoint(zn,fa,fr,full){
  if(zn.vale){ const a=fa*TAU, r=Math.abs(fr-0.5)*2*zn.R; return [zn.x+Math.sin(a)*r,zn.z+Math.cos(a)*r]; }
  if(zn.edge==='shore') return [lerp(-410,410,fa+0.5), WZ1-lerp(30,78,fr)];
  if(zn.edge==='west'){ const z=lerp(-400,400,fa+0.5); return [WX0+sunwallLine(z)+lerp(12,60,fr), z]; }
  if(zn.edge==='north'){ const x=lerp(-330,420,fa+0.5); return [x, HZ0+rimWobble(x,11)+lerp(30,98,fr)]; }
  const a=zn.center+fa*zn.w, r1=full&&zn.ring===2&&!zn.boss?Math.max(zn.r1,ringReach(a)):zn.r1, r=zn.r0+fr*(r1-zn.r0);
  return [VIL.x+Math.sin(a)*r,VIL.z+Math.cos(a)*r];
}
function zoneRidge(x,z){
  if(inVale(x)) return inHoar(x,z)?hoarRidge(x,z):valeRidge(x,z);
  const dx=x-VIL.x, dz=z-VIL.z, r=Math.hypot(dx,dz);
  if(r<RINGS[0]-2||r>RINGS[3]-4) return 0;
  const a=Math.atan2(dx,dz); let h=0;
  // walls between the rings, with a pass into the middle of every outer zone
  for(let i=1;i<=2;i++){
    const d=Math.abs(r-RINGS[i]); if(d>=10) continue;
    const n=ZONE_RINGS[i].length, w=TAU/n, rel=(((a-RING_START[i])%w)+w)%w, off=Math.min(rel,w-rel)*r;
    h=Math.max(h,(1-smoothstep(1.5,10,d))*smoothstep(4,11,off));
  }
  // walls between neighbouring zones of the same ring, with a pass halfway along
  const i=r<RINGS[1]?0:r<RINGS[2]?1:2, n=ZONE_RINGS[i].length, w=TAU/n;
  const rel=(((a-RING_START[i]-w/2)%w)+w)%w, d=Math.min(rel,w-rel)*r;
  if(d<10){ const tpos=(r-RINGS[i])/(RINGS[i+1]-RINGS[i]); h=Math.max(h,(1-smoothstep(1.5,10,d))*smoothstep(0.05,0.12,Math.abs(tpos-0.5))*smoothstep(0,0.12,Math.min(tpos,1-tpos)+0.06)); }
  if(h<=0) return 0;
  h*=RIDGE_H*(0.75+0.5*(noise2(x*0.035+7,z*0.035-3)*0.5+0.5));
  return h*smoothstep(5,16,Math.abs(x-riverX(z)));   // never dam the river
}
// the boss arena: a flat clearing ringed by standing stones, in the middle of the boss zone
function findArena(){
  const zn=ZONES.find(z=>z.key==='boss'); let best=null;
  for(let ka=-4;ka<=4;ka++) for(const fr of [0.35,0.45,0.55]){
    const [x,z]=zonePoint(zn,ka*0.07,fr);
    if(Math.abs(x)>HALF-45||Math.abs(z)>HALF-45) continue;
    if(riverDist(x,z)<45||LAKES.some(L=>Math.hypot(x-L.x,z-L.z)<L.r+25)) continue;
    let mn=1e9,mx=-1e9,sum=0,c=0;
    for(let rr=0;rr<=22;rr+=11) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
    const mean=sum/c; if(mean<2.5) continue;
    const score=mx-mn+Math.abs(ka)*0.8;
    if(!best||score<best.score) best={x,z,h:mean,score};
  }
  if(!best){ const [x,z]=zonePoint(zn,0,0.45); best={x,z,h:Math.max(4,baseHeight(x,z))}; }
  return best;
}
const ARENA=Object.assign(findArena(),{r:20,key:'boss'});
