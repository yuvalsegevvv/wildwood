//@ Places the overworld puzzle stones by rules: 15 trivial, 12 easy, 8 normal, 4 hard and 2 extreme in each of the seven lands that have a puzzle kind (287; the Deep Cave's come with its own files)
/* Agent map. Runs once at load while PZ_ON (pzPlaceAll), after shared/puzzle-sites.js (pzSiteAdd) and the atlas, roads and dungeon doors it reads. Deterministic (mulberry32 seeded by the land, the atlas's own data only: no heights from getH, so the server and every client agree).
   Rules: PZ_KIND_OF says each land's kind. Trivial stones stand beside the roads 60-300 m from the village, easy ones beside roads farther out, normal ones at the atlas's camps (WA_SPOTS), hard ones on a ring round a boss arena or a door (WA_POIS),
   the first extreme one on a ring round the land's top boss (the future lamp shrine of the story plan, B4), the second hidden far from any road in the land's highest zone (B5's letter). Every stone is on flat dry ground, 5 m off a road, clear of villages,
   arenas, doors, the dungeon doors and other stones. The stone's level is its zone's level. The chosen first-time seeds (seed0) are 0 until the rater picks them. Used by: server/puzzles.js, game/village/buildings-puzzle.js, the three maps. Test: tools/puzzles-smoke.js */
const PZ_KIND_OF={home:'rootlines',vale:'sudoku',hoar:'iceslide',grey:'bridges',sun:'mirrors',gloam:'nonogram',amber:'sokoban'};
const PZ_PLAN=[['t',1,15],['e',2,12],['n',3,8],['h',4,4],['x',5,2]];   // letter in the id, difficulty, count per land
const PZ_MIN_GAP=38;   // metres between two stones
function pzFlat(x,z){ const h=waGround(x,z); return Math.max(Math.abs(waGround(x+3,z)-h),Math.abs(waGround(x-3,z)-h),Math.abs(waGround(x,z+3)-h),Math.abs(waGround(x,z-3)-h))<=0.9; }
function pzPlaceLand(land){
  const kind=PZ_KIND_OF[land], hub=WA_HUBS[land], rng=mulberry32(0x5a17+land.split('').reduce((a,c)=>a*31+c.charCodeAt(0)|0,7)), got=[];
  const pois=WA_POIS.filter(p=>p.land===land&&p.kind!=='pier'), bosses=pois.filter(p=>p.kind==='boss'), spots=WA_SPOTS.filter(s=>s.land===land);
  const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const hubD=(x,z)=>Math.hypot(x-hub[0],z-hub[1]);
  const clear=(x,z,gap,ring)=>{
    if(landAt(x,z)!==land||waWaterDist(x,z)<8||waCoast(x,z)<30||hubD(x,z)<55||roadDist(x,z)<3.5||!pzFlat(x,z)) return false;
    for(const p of WA_POIS) if(Math.hypot(p.x-x,p.z-z)<(ring&&p===ring?20:46)) return false;
    for(const k in DG_ENTRANCES) if(Math.hypot(DG_ENTRANCES[k].x-x,DG_ENTRANCES[k].z-z)<30) return false;
    for(const s of PZ_SITES) if(Math.hypot(s.x-x,s.z-z)<(gap||PZ_MIN_GAP)) return false;
    return true;
  };
  const roadPts=[]; for(const r of ROADS) for(let i=3;i<r.pts.length-3;i+=9){ const [x,z]=r.pts[i], [ax,az]=r.pts[i-2], [bx,bz]=r.pts[i+2], L=Math.hypot(bx-ax,bz-az)||1, s=rng()<0.5?-5.5:5.5; const px=x+(bz-az)/L*s, pz=z-(bx-ax)/L*s; if(landAt(px,pz)===land) roadPts.push([px,pz]); }
  const put=(letter,diff,x,z)=>{ const n=got.filter(g=>g.letter===letter).length+1, zn=waZone(x,z), lv=Math.max(1,parseInt(zn&&zn.level,10)||1);
    if(pzSiteAdd({id:land+'-'+letter+(n<10?'0':'')+n,kind,diff,x:Math.round(x*10)/10,z:Math.round(z*10)/10,lv,seed0:0})){ got.push({letter}); return true; } return false; };
  const fromList=(letter,diff,count,cands,gap,ring)=>{ for(const [x,z] of cands){ if(got.filter(g=>g.letter===letter).length>=count) break; if(clear(x,z,gap,ring)) put(letter,diff,x,z); } };
  const ringPts=(P,r)=>{ const out=[]; for(let k=0;k<16;k++){ const a=rng()*6.283; out.push([P.x+Math.sin(a)*r,P.z+Math.cos(a)*r]); } return out; };
  const around=(P,r0,r1)=>{ const out=[]; for(let k=0;k<12;k++){ const a=rng()*6.283, r=r0+rng()*(r1-r0); out.push([P.x+Math.sin(a)*r,P.z+Math.cos(a)*r]); } return out; };
  const nearRoad=(lo,hi)=>shuffle(roadPts.filter(([x,z])=>hubD(x,z)>=lo&&hubD(x,z)<=hi));
  // extreme: ring round the top boss (the lamp shrine), then a hidden one in the highest zone, far from the roads
  const top=bosses.slice().sort((a,b)=>(parseInt((waZone(b.x,b.z)||{}).level,10)||0)-(parseInt((waZone(a.x,a.z)||{}).level,10)||0))[0];
  if(top) for(let t=0;t<6&&!got.some(g=>g.letter==='x');t++) fromList('x',5,1,ringPts(top,62+t*8),30,top);
  const zones=WA_ZONES.filter(z=>z.land===land).sort((a,b)=>(parseInt(b.level,10)||0)-(parseInt(a.level,10)||0)), hz=zones[0];
  if(hz) for(let t=0;t<400&&got.filter(g=>g.letter==='x').length<2;t++){ const a=rng()*6.283, r=20+rng()*170, x=hz.x+Math.sin(a)*r, z=hz.z+Math.cos(a)*r; if(roadDist(x,z)>70&&clear(x,z,60)) put('x',5,x,z); }
  // hard: rings round the other bosses and the doors, then camps of the high zones
  fromList('h',4,4,shuffle([].concat(...pois.filter(p=>p!==top&&p.kind!=='raid').map(p=>ringPts(p,58)))),38);
  fromList('h',4,4,shuffle([].concat(...spots.filter(s=>s.heart).map(s=>around(s,18,40)))));
  // normal: camps (spots); trivial and easy beside the roads
  fromList('n',3,8,shuffle([].concat(...spots.filter(s=>!s.heart).map(s=>around(s,14,34)))));
  fromList('t',1,15,nearRoad(60,300)); fromList('t',1,15,nearRoad(60,700),30);
  fromList('e',2,12,nearRoad(150,800)); fromList('e',2,12,nearRoad(60,1200),28);
  // anything still short is filled from the land's roads with a smaller gap, then from its zone poles
  for(const [letter,diff,count] of PZ_PLAN){ for(const gap of [28,20]) fromList(letter,diff,count,nearRoad(55,2000),gap); fromList(letter,diff,count,shuffle([].concat(...zones.map(z=>around(z,10,90)))),20); }
  return got.length;
}
const PZ_PLACED={};   // land -> stones placed; filled by pzPlaceAll (about 0.2 s: only run while PZ_ON, and by the smoke test through pzSwitch)
function pzPlaceAll(){ if(PZ_PLACED.home) return; for(const land in PZ_KIND_OF) PZ_PLACED[land]=pzPlaceLand(land); }
if(PZ_ON) pzPlaceAll();
