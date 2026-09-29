//@ The Sakura Vale east of the mountains: the tunnel (TUN), Hanami village (VIL2), zones 16-25 (Voronoi cells, ridges), two boss arenas, vilAt (which knows all three villages). Pure.
/* ===================== THE SAKURA VALE =====================
   A second land behind the eastern border mountains, reached through a tunnel that stays sealed for each player
   until they help defeat the Rootwarden (gear.east: 0 sealed, 1 tunnel open, 2 walked to Hanami: circles attuned).
   Zones are cells around fixed seeds (nearest seed wins), walled by low ridges with a pass halfway between two seeds.
   Hanami's own cell has no monsters. Levels 16-25, two monster kinds per zone, bosses at 20 (in zone 20) and 25. */

/* ---- the tunnel: a straight bore east through the mountains at z = TUN.z, its floor ramping between the two lands.
   x0..x1: where the floor is carved (the open cutting outside each portal included); p0..p1: the covered part
   (the portals), where the mountain stands more than 7.5 m above the floor. w: half the floor's width. */
function findTunnel(){
  const x0=HALF-66, x1=HALF+66; let best=null;
  for(let z=-150;z<=-30;z+=5){
    const a=baseHeight(x0-8,z), b=baseHeight(x1+8,z);
    const score=Math.abs(a-b)*0.6+Math.abs(z-ARENA.z)*0.05+(a<3?30:0)+(b<3?30:0)+(a>24?20:0)+(b>24?20:0)+(riverDist(x0-20,z)<30?40:0);
    if(!best||score<best.score) best={z,score,h0:Math.max(3,a),h1:Math.max(3,b)};
  }
  const T={x0,x1,z:best.z,w:4,h0:best.h0,h1:best.h1,roof:6.2};
  T.floor=x=>lerp(T.h0,T.h1,smoothstep(T.x0,T.x1,x));
  T.p0=x1; T.p1=x0;
  for(let x=x0;x<=x1;x+=0.5){ if(baseHeight(x,T.z)-T.floor(x)>7.5){ T.p0=Math.min(T.p0,x); T.p1=Math.max(T.p1,x); } }
  if(T.p1<=T.p0){ T.p0=HALF-30; T.p1=HALF+30; }
  return T;
}
const TUN=findTunnel();
// the carved floor: flat across the bore, fading out beyond the ends of the cutting
function tunnelCarve(x,z,h){
  const dz=Math.abs(z-TUN.z); if(dz>TUN.w+5.5||x<TUN.x0-30||x>TUN.x1+30) return h;
  const k=smoothstep(TUN.w+5.5,TUN.w+0.6,dz)*smoothstep(TUN.x0-30,TUN.x0-8,x)*(1-smoothstep(TUN.x1+8,TUN.x1+30,x));
  return lerp(h,TUN.floor(x),k);
}
// keep trees, rocks and camps out of the cutting (m = extra margin)
function inTunnelCut(x,z,m){ return Math.abs(z-TUN.z)<TUN.w+6+(m||0) && x>TUN.x0-30-(m||0) && x<TUN.x1+30+(m||0); }

/* ---- Hanami, the vale's village: same plan as the home village (so every NPC role works the same), its road
   turned toward the tunnel's east portal */
function findVale2Village(){
  const cx=HALF+160, cz=TUN.z; let best=null;
  for(let r=0;r<=45;r+=5){
    const n=Math.max(1,Math.round(r/2.5));
    for(let k=0;k<n;k++){
      const a=k/n*TAU, x=cx+Math.sin(a)*r, z=cz+Math.cos(a)*r;
      if(LAKES.some(L=>Math.hypot(x-L.x,z-L.z)<L.r+VR+30)) continue;
      let mn=1e9,mx=-1e9,sum=0,c=0;
      for(let rr=0;rr<=VR;rr+=10) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
      const mean=sum/c, score=(mx-mn)+r*0.3+(mean<1.5?40:0);
      if(!best||score<best.score) best={x,z,h:Math.max(mean,2.5),score};
    }
  }
  return best;
}
const VIL2=(()=>{ const v=findVale2Village(); return layoutVillage(v,{seed:7171,ent:Math.atan2(TUN.x1+10-v.x,TUN.z-v.z)}); })();
VIL2.name='Hanami'; VIL.name='the village';
// (VILS, with Rimehold, is in hoarfrost.js)
// on (or m metres from) any village's teleport circle
function nearTele(x,z,m){ const V=vilAt(x,z); return Math.hypot(x-V.tele.x,z-V.tele.z)<V.tele.r+m; }
// the village whose land a point is in (every "near the village" test uses this one): the home forest, the vale, the Hoarfrost Reach
function vilAt(x,z){ return x>HALF?(z<HZ0?VIL3:VIL2):VIL; }

/* ---- zones: seeds on a rough 3 x 4 grid east of Hanami. key null = Hanami's meadows (no monsters) */
const VALE_ZONE_NAMES={16:'Petal Meadow',17:'Kodama Wood',18:'Inari Hills',19:'Bamboo Sea',20:'Ghostlight Marsh',21:'Oni Crags',22:'Jade Falls',23:'Tengu Peaks',24:'Warlord Ruins',25:'Thunder Grove',boss25:'Foxfire Shrine'};
const VALE_SEEDS=[
  {key:null,x:VIL2.x,z:VIL2.z},
  {key:16,x:575,z:105},{key:17,x:570,z:-300},{key:18,x:735,z:-95},{key:19,x:725,z:-300},{key:20,x:880,z:-305},
  {key:21,x:875,z:-90},{key:22,x:885,z:110},{key:23,x:730,z:115},{key:24,x:880,z:305},{key:25,x:725,z:310},{key:'boss25',x:570,z:315}];
for(const s of VALE_SEEDS) if(s.key!==null) ZONES.push({key:s.key,ring:3,vale:true,x:s.x,z:s.z,R:95,name:VALE_ZONE_NAMES[s.key],level:s.key==='boss25'?25:s.key,boss:s.key==='boss25'});
// zone borders are bent by noise (the point is warped up to ~30 m before finding its nearest seeds) so the cells don't form a grid
const valeWarp=(x,z)=>[x+noise2(x*0.009+3,z*0.009-8)*30,z+noise2(x*0.009-11,z*0.009+5)*30];
function valeSeeds(x,z){
  let a=null,b=null,da=1e18,db=1e18;
  for(const s of VALE_SEEDS){ const d=(x-s.x)*(x-s.x)+(z-s.z)*(z-s.z); if(d<da){ b=a; db=da; a=s; da=d; } else if(d<db){ b=s; db=d; } }
  return [a,b];
}
function valeZoneAt(x,z){
  if(Math.min(x-HALF,WX1-x,z-HZ0,WZ1-z)<40) return null;   // the border mountains
  for(const A of ARENAS) if(A.zone&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  const [wx,wz]=valeWarp(x,z), s=valeSeeds(wx,wz)[0]; return s.key===null?null:ZONES.find(zn=>zn.vale&&zn.key===s.key);
}
function valeRidge(x,z){
  const e=Math.min(x-HALF,WX1-x,z-HZ0,WZ1-z); if(e<30) return 0;
  const [wx,wz]=valeWarp(x,z), [a,b]=valeSeeds(wx,wz), ux=b.x-a.x, uz=b.z-a.z, L=Math.hypot(ux,uz);
  const da=Math.hypot(wx-a.x,wz-a.z), dbb=Math.hypot(wx-b.x,wz-b.z), d=(dbb*dbb-da*da)/(2*L);   // distance to the wall between a and b
  if(d>=10) return 0;
  const mx=(a.x+b.x)/2, mz=(a.z+b.z)/2, along=Math.abs((wx-mx)*(-uz/L)+(wz-mz)*(ux/L));   // how far along the wall from the pass
  const h=(1-smoothstep(1.5,10,d))*smoothstep(5,12,along)*smoothstep(30,60,e);
  return h<=0?0:h*RIDGE_H*(0.75+0.5*(noise2(x*0.035+7,z*0.035-3)*0.5+0.5));
}

/* ---- boss arenas: flat clearings like the stone circle. ARENA20 sits in the far corner of zone 20 (Akaoni, the
   Demon Gate), ARENA25 in its own cell (Kyuubi, the Foxfire Shrine) */
function flatSpot(cx,cz,span){
  let best=null;
  for(let dx=-span;dx<=span;dx+=10) for(let dz=-span;dz<=span;dz+=10){
    const x=cx+dx, z=cz+dz;
    if(Math.min(x-HALF,WX1-x,z-WZ0,WZ1-z)<75||(x>HALF&&Math.abs(z-HZ0)<75)) continue;
    if(LAKES.some(L=>Math.hypot(x-L.x,z-L.z)<L.r+25)) continue;
    let mn=1e9,mx=-1e9,sum=0,c=0;
    for(let rr=0;rr<=22;rr+=11) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
    const mean=sum/c; if(mean<2.5) continue;
    const score=mx-mn+Math.hypot(dx,dz)*0.05;
    if(!best||score<best.score) best={x,z,h:mean,score};
  }
  return best||{x:cx,z:cz,h:Math.max(4,baseHeight(cx,cz))};
}
const ARENA20=Object.assign(flatSpot(895,-340,30),{r:20,key:'boss20',name:'Demon Gate'});
const ARENA25=Object.assign(flatSpot(575,320,30),{r:20,key:'boss25',name:'Foxfire Shrine'});
ARENA.name='The Stone Circle';
const ARENAS=[ARENA,ARENA20,ARENA25];
ARENA.zone=ZONES.find(z=>z.key==='boss');
ARENA20.zone={key:'boss20',ring:3,vale:true,x:ARENA20.x,z:ARENA20.z,R:20,name:'Demon Gate',level:20,boss:true}; ZONES.push(ARENA20.zone);
ARENA25.zone=ZONES.find(z=>z.key==='boss25'); ARENA25.zone.x=ARENA25.x; ARENA25.zone.z=ARENA25.z;
// the nearest arena's centre distance (vegetation and camps stay out of all three)
function arenaDist(x,z){ let m=1e9; for(const A of ARENAS){ const d=Math.hypot(x-A.x,z-A.z); if(d<m) m=d; } return m; }
