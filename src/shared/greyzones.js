//@ The Greyspine's zones 26-32 (cells round seeds along the troughs, like the Reach's) and its two boss arenas (the Gryphon Queen's crown, the golem's cavern). Pure.
/* Seven zones for levels 26-32, two monster kinds each (docs/WORLD.md: the Greyspine is a short range, mostly a crossroads). Each is a cell round one
   or two seeds on a trough's floor (the nearest seed wins, the border wobbles with noise); a zone is a circle for camps (zonePoint: x, z, R) cut to
   its cell (greyZoneAt). The route climbs from Highmark: 26 the Long Valley's east end, 27 the North Fork's ledges, 28 the Long Valley's middle,
   29 the Queen's Fork under her peak, 30 the Long Valley's west end, 31 the Neck, 32 the Sink under the old mine; the mid boss (29, the Gryphon Queen)
   has her crown and the last one (32, the mountain golem) his cavern at the head of the Sink Valley. */
const GREY_ZONE_NAMES={26:'Highmark Pastures',27:'The Ledgeway',28:"Miners' Scree",29:'Gryphon Cirque',30:'Stone Meadow',31:'The Windswept Neck',32:'The Sink',boss29:"The Gryphon Queen's Peak",boss32:"The Golem's Cavern"};
const GREY_SEEDS=[
  {key:null,x:VIL4.x,z:VIL4.z},
  {key:26,x:372,z:-728},
  {key:27,x:272,z:-858},{key:27,x:318,z:-906},
  {key:28,x:112,z:-684},
  {key:29,x:-112,z:-764},{key:29,x:-166,z:-850},
  {key:30,x:-172,z:-628},{key:30,x:-336,z:-582},
  {key:31,x:-298,z:-768},
  {key:32,x:150,z:-584},{key:32,x:112,z:-548}];
for(const k of [26,27,28,29,30,31,32]){ const ss=GREY_SEEDS.filter(s=>s.key===k), x=ss.reduce((a,s)=>a+s.x,0)/ss.length, z=ss.reduce((a,s)=>a+s.z,0)/ss.length;
  ZONES.push({key:'g'+k,ring:3,vale:true,grey:true,x,z,R:125,name:GREY_ZONE_NAMES[k],level:k}); }
const greyWarp=(x,z)=>[x+noise2(x*0.009+3,z*0.009-8)*26,z+noise2(x*0.009-11,z*0.009+5)*26];
function greyZoneAt(x,z){
  if(Math.min(x-WX0,z-WZ0,HZ0-z,HALF-x)<44) return null;   // the walls
  for(const A of ARENAS) if(A.grey&&Math.hypot(x-A.x,z-A.z)<A.r+26) return A.zone;
  const [wx,wz]=greyWarp(x,z); let best=null, bd=1e18;
  for(const s of GREY_SEEDS){ const d=(wx-s.x)*(wx-s.x)+(wz-s.z)*(wz-s.z); if(d<bd){ bd=d; best=s; } }
  return best.key===null?null:ZONES.find(zn=>zn.grey&&zn.key==='g'+best.key);
}
// the flattest spot within span of (cx, cz) (vale.js's flatSpot looks only east of the vale wall)
function greyFlat(cx,cz,span){
  let best=null;
  for(let dx=-span;dx<=span;dx+=10) for(let dz=-span;dz<=span;dz+=10){
    const x=cx+dx, z=cz+dz; if(Math.min(x-WX0,z-WZ0,HZ0-z,HALF-x)<75) continue;
    let mn=1e9,mx=-1e9,sum=0,c=0;
    for(let rr=0;rr<=22;rr+=11) for(let j=0;j<8;j++){ const b=j/8*TAU, h=baseHeight(x+Math.sin(b)*rr,z+Math.cos(b)*rr); mn=Math.min(mn,h); mx=Math.max(mx,h); sum+=h; c++; }
    const score=mx-mn+Math.hypot(dx,dz)*0.05; if(!best||score<best.score) best={x,z,h:sum/c,score};
  }
  return best||{x:cx,z:cz,h:baseHeight(cx,cz)};
}
/* ---- boss arenas: ARENA29 is the Gryphon Queen's crown (shaped in greyspine.js, already flat), ARENA32 a clearing at the head of the Sink Valley ---- */
const ARENA29={x:GREY_QUEEN.x,z:GREY_QUEEN.z,h:GREY_QUEEN.h,r:20,key:'boss29',name:GREY_ZONE_NAMES.boss29,grey:true};
const ARENA32=Object.assign(greyFlat(112,-548,30),{r:20,key:'boss32',name:GREY_ZONE_NAMES.boss32,grey:true});
for(const A of [ARENA29,ARENA32]){ A.zone={key:A.key,ring:3,vale:true,grey:true,x:A.x,z:A.z,R:20,name:A.name,level:A===ARENA29?29:32,boss:true}; ZONES.push(A.zone); ARENAS.push(A); }
