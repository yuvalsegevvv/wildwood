//@ The Hoarfrost Reach north of the vale: Frostgate Pass and its ice wall (PASS), Rimehold village (VIL3, VILS), zones 22-30 (Voronoi cells, ridges), two boss arenas. Pure.
/* ===================== THE HOARFROST REACH =====================
   A high frozen plateau north of the Sakura Vale (docs/WORLD.md, docs/MAIN-QUEST.md). The vale's north rim is a wall along
   z = HZ0; the only way through is Frostgate Pass, a canyon cut into the rim at PASS.x. An ice wall shuts it (a real wall, drawn
   by game/village/buildings-hoar.js and stopped in player/movement.js and server/api.js) until the player helps defeat Akaoni
   (gear.north: 0 sealed, 1 wall open, 2 walked into Rimehold: the teleport circles are attuned).
   Zones are cells around fixed seeds (as in the vale), levels 22-30, two monster kinds per level; the mid boss (26) has his hall
   and the wyrm (30) her nest in their own cells' arenas. Terrain height itself (plateau, walls, cliffs, lakes) is in terrain.js. */

/* ---- Frostgate Pass: a canyon straight north through the rim, its floor climbing from the vale to the plateau. The floor is
   carved into the heightmap (passCarve, called by rawHeight); the ice wall stands across it at PASS.ice. w: half the floor's
   width. z0: where the cutting starts in the vale (south), z1: where it reaches the plateau. */
const PASS={x:636,w:5,z0:HZ0+95,z1:HZ0-90,ice:HZ0+42};
// the z a hiker without the Reach's key (gear.north) must stay south of: the ice wall in the pass, the crest line (borderZ, shared/terrain.js) elsewhere along the vale's north wall
const northBarZ=x=>Math.abs(x-PASS.x)<PASS.w+10?PASS.ice:borderZ(x)+8;
PASS.h0=Math.max(3,baseHeight(PASS.x,PASS.z0)); PASS.h1=hoarBase(PASS.x,PASS.z1);
PASS.floor=z=>lerp(PASS.h0,PASS.h1,smoothstep(PASS.z0,PASS.z1,z));
function passCarve(x,z,h){
  const dx=Math.abs(x-PASS.x); if(dx>PASS.w+5.5||z>PASS.z0+30||z<PASS.z1-30) return h;
  const k=smoothstep(PASS.w+5.5,PASS.w+0.6,dx)*smoothstep(PASS.z0+30,PASS.z0,z)*smoothstep(PASS.z1-30,PASS.z1,z);
  return lerp(h,PASS.floor(z),k);
}
// keep trees, rocks and camps out of the pass (m = extra margin)
function inPass(x,z,m){ return Math.abs(x-PASS.x)<PASS.w+6+(m||0) && z<PASS.z0+30+(m||0) && z>PASS.z1-30-(m||0); }

/* ---- Rimehold, the reach's village: the same plan as the other two villages (so every NPC role works the same), its road turned
   toward the pass. It stands on the plateau just north of the pass' end. */
function findHoarVillage(){
  const cx=690, cz=-610; let best=null;
  for(let r=0;r<=45;r+=5){
    const n=Math.max(1,Math.round(r/2.5));
    for(let k=0;k<n;k++){
      const a=k/n*TAU, x=cx+Math.sin(a)*r, z=cz+Math.cos(a)*r;
      if(iceDist(x,z)<VR+30) continue;
      let mn=1e9,mx=-1e9,sum=0,c=0;
      for(let rr=0;rr<=VR;rr+=10) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
      const score=(mx-mn)+r*0.3;
      if(!best||score<best.score) best={x,z,h:sum/c,score};
    }
  }
  return best;
}
const VIL3=(()=>{ const v=findHoarVillage(); return layoutVillage(v,{seed:9393,ent:Math.atan2(PASS.x-v.x,PASS.z1-v.z)}); })();
VIL3.name='Rimehold';
const VILS=[VIL,VIL2,VIL3];
/* the teleport circles (one in each village): where each leads and when it is awake. A land's circles wake when you have walked into its village:
   home and Hanami with gear.east 2, Rimehold with gear.north 2. Used by the server's warpP and the client's travel window (ui/travel.js) */
const CIRCLES=[
  {id:'home',name:'The village',land:'Wildwood',lv:'1-15',V:VIL,open:g=>g.east>=2,hint:'Walk to Hanami on the far side of the bridge first'},
  {id:'hanami',name:'Hanami',land:'The Sakura Vale',lv:'16-25',V:VIL2,open:g=>g.east>=2,hint:'Walk to Hanami on the far side of the bridge first'},
  {id:'rimehold',name:'Rimehold',land:'The Hoarfrost Reach',lv:'22-30',V:VIL3,open:g=>g.north>=2,hint:'Walk into Rimehold through Frostgate Pass first'}];

/* ---- zones: seeds on a 3 x 3 grid north of Rimehold. key null = Rimehold's snowfields (no monsters). The route winds:
   22, 23, 24 eastward, 25, 26 (the Rimeking's Hall), 27 back west, then 28, 29, 30 eastward again */
const HOAR_ZONE_NAMES={22:'Rimewood Edge',23:'Whitebirch Flats',24:'Frostmere Shore',25:"Hunters' Wold",26:"The Rimeking's Hall",27:'Glacier Tongue',28:'Blizzard Steppe',29:'Bonefrost Barrow',30:"The Wyrm's Glacier",boss26:"The Rimeking's Hall",boss30:"The Wyrm's Nest"};
const HOAR_SEEDS=[
  {key:null,x:VIL3.x,z:VIL3.z},
  {key:22,x:585,z:-705},{key:23,x:735,z:-705},{key:24,x:885,z:-705},
  {key:25,x:885,z:-805},{key:26,x:735,z:-805},{key:27,x:585,z:-805},
  {key:28,x:585,z:-905},{key:29,x:735,z:-905},{key:30,x:885,z:-905}];
for(const s of HOAR_SEEDS) if(s.key!==null) ZONES.push({key:'h'+s.key,ring:3,vale:true,hoar:true,x:s.x,z:s.z,R:75,name:HOAR_ZONE_NAMES[s.key],level:s.key});
const hoarWarp=(x,z)=>[x+noise2(x*0.009+3,z*0.009-8)*24,z+noise2(x*0.009-11,z*0.009+5)*24];
function hoarSeeds(x,z){
  let a=null,b=null,da=1e18,db=1e18;
  for(const s of HOAR_SEEDS){ const d=(x-s.x)*(x-s.x)+(z-s.z)*(z-s.z); if(d<da){ b=a; db=da; a=s; da=d; } else if(d<db){ b=s; db=d; } }
  return [a,b];
}
function hoarZoneAt(x,z){
  if(Math.min(x-borderX(z),WX1-x,z-WZ0)<44) return null;   // the walls and the cliffs
  for(const A of ARENAS) if(A.hoar&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  const [wx,wz]=hoarWarp(x,z), s=hoarSeeds(wx,wz)[0]; return s.key===null?null:ZONES.find(zn=>zn.hoar&&zn.key==='h'+s.key);
}
function hoarRidge(x,z){
  const e=Math.min(x-borderX(z),WX1-x,z-WZ0); if(e<44) return 0;
  const [wx,wz]=hoarWarp(x,z), [a,b]=hoarSeeds(wx,wz), ux=b.x-a.x, uz=b.z-a.z, L=Math.hypot(ux,uz);
  const da=Math.hypot(wx-a.x,wz-a.z), dbb=Math.hypot(wx-b.x,wz-b.z), d=(dbb*dbb-da*da)/(2*L);   // distance to the wall between a and b
  if(d>=9) return 0;
  const mx=(a.x+b.x)/2, mz=(a.z+b.z)/2, along=Math.abs((wx-mx)*(-uz/L)+(wz-mz)*(ux/L));   // how far along the wall from the pass
  const h=(1-smoothstep(1.5,9,d))*smoothstep(5,12,along)*smoothstep(44,74,e)*smoothstep(borderZ(x)-70,borderZ(x)-110,z)*smoothstep(4,12,iceDist(x,z));   // (none across the frozen lakes)
  return h<=0?0:h*RIDGE_H*(0.75+0.5*(noise2(x*0.035+7,z*0.035-3)*0.5+0.5));
}

/* ---- boss arenas: flat clearings. ARENA26 (Ymrik the Rimeking, in the ice hall), ARENA30 (Vetrmaw the frost wyrm, at the wreck) */
const ARENA26=Object.assign(flatSpot(735,-795,30),{r:20,key:'boss26',name:"The Rimeking's Hall",hoar:true});
const ARENA30=Object.assign(flatSpot(885,-895,30),{r:20,key:'boss30',name:"The Wyrm's Nest",hoar:true});
for(const A of [ARENA26,ARENA30]){ A.zone={key:A.key,ring:3,vale:true,hoar:true,x:A.x,z:A.z,R:20,name:A.name,level:A===ARENA26?26:30,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
