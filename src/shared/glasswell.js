//@ Glasswell placed in the world: VIL5, the Sunscar's village (a village-shaped record built from GLASSWELL: 80 homes, 26 places, the gates, anchors, colliders, the teleport circle); joins VILS and CIRCLES. Pure.
/* Agent map: VIL5 (x, z = the Bowl's centre, h = its floor, r = 80, bowl:true so rawHeight leaves its ground to sunHook, houses / boxes / circles / anchors / pois / paths / board / fire / tele / spawn / cart as the
   other villages have them), GW_PLACE (id -> the place's world record), gwWorld(x,z) (city frame -> world). Loaded after highmark.js (VILS and CIRCLES exist) and before anything that walks VILS at load (the main
   quest's carts). Anchors the villagers use (game/village/villagers.js, vil:5): 'house:0'..'house:79', 'place:<id>' (in front of a place's door, facing the street), 'well', 'well:far', 'questboard', 'gate' (the River Gate),
   'plaza0'..'plaza7' (the Well Court), 'lamp:0'..'lamp:6' (Bazaar Way), 'campfire:seat0'..'seat2', 'cart', 'garden' (the Lodge's yard), 'spawn'. The model is game/village/sun-*.js (buildGlasswell, called by
   game/village/buildings-sunscar.js). Test: node tools/sunscar-smoke.js. */
const gwWorld=(x,z)=>[SUN_CITY.x+x,SUN_CITY.z+z];
const GW_PLACE={};
const VIL5=(()=>{
  const G=GLASSWELL, C=SUN_CITY, at=(x,z)=>gwWorld(x,z), toward=(rot,r)=>[Math.sin(rot)*r,Math.cos(rot)*r];
  const V={x:C.x,z:C.z,h:C.h,r:C.r,bowl:true,name:'Glasswell',plaza:9.5,houses:[],stalls:[],lamps:[],benches:[],barrels:[],crates:[],anchors:{},pois:[],paths:[],boxes:[],circles:[],ent:G.gates[0].a};
  const anchor=(name,x,z,face,poi)=>{ const p=at(x,z), o={x:p[0],z:p[1],face}; V.anchors[name]=o; if(poi) V.pois.push(o); return o; };
  const plasters=[0xe2cfa0,0xd6bf8a,0xcfb27c,0xe6d4a8,0xd2b88a], roofs=[0xb07a4a,0xa06c40,0x8e6a46,0x9a7a52,0xb8844e], accents=[0x2c4a8c,0x8a3a2a,0x2f6a5a,0xc08a2a,0x5a3a6a];
  // the 80 homes: a house record like a village's (the map draws them), a door anchor, a collider
  G.homes.forEach((h,i)=>{
    const [x,z,w,d,rot]=h, p=at(x,z);
    V.houses.push({i,a:rot,x:p[0],z:p[1],rot,w,d,wh:3.2,rh:1.2,tavern:false,plaster:plasters[i%5],roof:roofs[(i*3)%5],accent:accents[(i*2)%5],chimney:false,woodpile:false,flowers:i%3===0});
    V.boxes.push({x:p[0],z:p[1],rot,hw:w/2+0.2,hd:d/2+0.2});
    const f=toward(rot,d/2+1.3); anchor('house:'+i,x+f[0],z+f[1],rot+Math.PI,false);
  });
  // the places: a collider for each building (the reserved plots too: their doors are chained), an anchor in front of the door facing the street
  for(const pl of G.places){
    const p=at(pl.x,pl.z); GW_PLACE[pl.id]={id:pl.id,n:pl.n,cat:pl.cat,name:pl.name,x:p[0],z:p[1],w:pl.w,d:pl.d,rot:pl.rot};
    if(pl.w>0){ V.boxes.push({x:p[0],z:p[1],rot:pl.rot,hw:pl.w/2+0.2,hd:pl.d/2+0.2}); const f=toward(pl.rot,pl.d/2+1.7); anchor('place:'+pl.id,pl.x+f[0],pl.z+f[1],pl.rot+Math.PI,pl.cat==='shop'||pl.cat==='story'); }
  }
  // the Old Citadel: round towers and the standing stretches of its ring wall, as small colliders (the breaches stay open); the statue; the Great Well
  { const R=18.5, arcs=[[0.1,0.9],[2.15,2.7],[3.1,4.0],[4.5,5.0],[5.35,6.1]];
    for(const [a0,a1] of arcs){ const n=Math.max(1,Math.round((a1-a0)*R/2.4)); for(let k=0;k<=n;k++){ const a=a0+(a1-a0)*k/n, p=at(Math.sin(a)*R,Math.cos(a)*R); V.circles.push([p[0],p[1],1.5]); } }
    for(const [a,rr] of [[0.0,2.6],[6.1,2.6],[2.7,2.6],[3.1,2.6],[5.0,2.6],[0.9,2.6]]){ const p=at(Math.sin(a)*R,Math.cos(a)*R); V.circles.push([p[0],p[1],rr]); }
    V.circles.push([C.x,C.z,3.3]); const w=at(G.well[0],G.well[1]); V.circles.push([w[0],w[1],2.7]); }
  // the gates: a masonry wall built into each crack with an arch 9 m wide and two towers; the Weir's lock closes its crack
  for(const g of gwGateList()){
    const r=G.r+(g.weir?3:8), cx=Math.sin(g.a)*r, cz=Math.cos(g.a)*r, lx=Math.cos(g.a), lz=-Math.sin(g.a);
    if(g.weir){ const p=at(cx,cz); V.boxes.push({x:p[0],z:p[1],rot:g.a,hw:4.9,hd:3.2}); continue; }
    for(const sd of [-1,1]){ const p=at(cx+lx*sd*8.4,cz+lz*sd*8.4); V.boxes.push({x:p[0],z:p[1],rot:g.a,hw:3.7,hd:2.3}); }
  }
  V.spawn=(()=>{ const p=at(G.spawn[0],G.spawn[1]); return {x:p[0],z:p[1]}; })();
  V.tele=(()=>{ const p=at(G.tele.x,G.tele.z); return {x:p[0],z:p[1],r:G.tele.r}; })();
  { const bp=GW_PLACE.board; V.board={x:bp.x,z:bp.z,rot:bp.rot}; V.anchors.questboard=V.anchors['place:board']; }
  { const f=at(G.well[0]+10,G.well[1]-5); V.fire={x:f[0],z:f[1]}; }
  V.sign={x:at(0,0)[0],z:at(0,0)[1],rot:0};
  // the Well Court: eight spots round the well, the great brazier's three seats, the well's own anchors
  { const w=G.well; for(let k=0;k<8;k++){ const a=k/8*TAU+0.2, r=5.5+(k%2)*2; anchor('plaza'+k,w[0]+Math.sin(a)*r,w[1]+Math.cos(a)*r,undefined,true); }
    anchor('well',w[0]+2.9,w[1]+0.4,-Math.PI/2,true); anchor('well:far',w[0]-2.9,w[1]-0.4,Math.PI/2,true);
    const fx=w[0]+10, fz=w[1]-5; for(let k=0;k<3;k++){ const b=Math.PI+(k-1)*1.1; anchor('campfire:seat'+k,fx+Math.sin(b)*2.4,fz+Math.cos(b)*2.4,b+Math.PI,false); anchor('campfire:stand'+k,fx+Math.sin(b+0.5)*2.2,fz+Math.cos(b+0.5)*2.2,b+0.5,true); } }
  anchor('gate',Math.sin(G.gates[0].a)*(G.r-4),Math.cos(G.gates[0].a)*(G.r-4),G.gates[0].a+Math.PI,false);
  anchor('garden',GW_PLACE.lodge.x-C.x+3.5,GW_PLACE.lodge.z-C.z-8.4,0,true);   // the Lodge's yard, in front of its door
  { const cp=GW_PLACE.cart; V.cart={x:cp.x,z:cp.z,rot:cp.rot}; V.anchors.cart={x:cp.x+Math.sin(cp.rot)*2.8,z:cp.z+Math.cos(cp.rot)*2.8,face:cp.rot+Math.PI}; V.circles.push([cp.x,cp.z,1.5]); }
  // Bazaar Way's lamps (patrol routes) and the places people wander to: the street, the lake walk, the circle court, the gates
  { const bw=G.roads[0].pts; for(let i=0;i<7;i++){ const q=bw[Math.min(bw.length-1,Math.round(i*(bw.length-1)/6))]; anchor('lamp:'+i,q[0]+1.6,q[1]+1.6,undefined,false); V.lamps.push({x:C.x+q[0]+1.6,z:C.z+q[1]+1.6,rot:0}); }
    for(let i=0;i<bw.length;i++) anchor('bazaar'+i,bw[i][0]-1.4,bw[i][1]-1.4,undefined,true);
    anchor('lake0',G.lakeWalk0?G.lakeWalk0[0]:-36,G.lakeWalk0?G.lakeWalk0[1]:24,undefined,true); anchor('circle0',G.tele.x+4.2,G.tele.z+1.5,undefined,true); anchor('circle1',G.tele.x-4.2,G.tele.z-1.5,undefined,true); }
  // roads as paths: the camps and the plants keep off them (the floor's colours come from the model's own gwGround)
  for(const R of G.roads) for(let i=0;i<R.pts.length-1;i++){ const a=at(R.pts[i][0],R.pts[i][1]), b=at(R.pts[i+1][0],R.pts[i+1][1]); V.paths.push([a[0],a[1],b[0],b[1],R.w/2]); }
  return V;
})();
VILS.push(VIL5);
CIRCLES.push({id:'glasswell',name:'Glasswell',land:'The Sunscar',lv:'28-36',V:VIL5,open:g=>g.sun>=2,hint:'Walk into Glasswell through the River Road or Redgate first'});
