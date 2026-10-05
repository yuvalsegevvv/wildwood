//@ Glasswell's shops and the market street: weaponsmith, armourer, forge, trainers' yard, alchemist, quest board, Wayfarers' Lodge, harbour master, fish market; stalls, shade cloths and lamps along the roads
/* Every shop is a limewashed box on a plinth with a striped awning, a sign and a few things that say what it is (gwShopBase, then its own extras). Drawn in the place's own frame (gwFrame):
   local -z is the front. The shopkeepers are not here: the model only (their roles are in docs/DESERT-CITY.md section 4). Flames are pushed to `flames`, which buildings.js animates. */
const gwIron=c=>c.set(0x2a2a30), gwSteel=c=>c.set(0xaeb6bc);
function gwFlame(C,F,x,y,z,k,s){ const m=new THREE.Mesh(new THREE.ConeGeometry(0.2*(s||1),0.55*(s||1),7),flameMats[k||1]); m.position.set(x,y,z).applyMatrix4(F); C.root.add(m); flames.push(m); }
function gwShopBase(C,p,o){
  const F=gwFrame(p), G=gwF(C,F), {A,W,R}=G, w=p.w, d=p.d, H=o.H||4.2, col=o.col||0xd9c08c, P=gwPlaster(col);
  A(vbox(w+0.3,0.4,d+0.3,0,0.2,0),gwStone(0xb09878,0.2)); A(vbox(w,H,d,0,0.4+H/2,0),P); A(vbox(w-0.2,0.1,d-0.2,0,0.4+H+0.04,0),c=>c.set(0xa88a5c)); gwParapet(A,w,d,0.4+H,gwPlaster(col-0x0c0c0c));
  A(vbox(1.2,2.2,0.14,0,1.5,-d/2-0.05),woodC(0x3a2616)); A(vbox(1.6,0.24,0.34,0,2.7,-d/2-0.08),gwStone(0xb09878,0.2));
  for(const s of [-1,1]){ W(vbox(0.8,1.1,0.07,s*w*0.3,2.2,-d/2-0.04)); A(vbox(0.34,1.2,0.05,s*w*0.3+s*0.56,2.2,-d/2-0.05),woodC(o.acc||0x2c8c86)); }
  R(gwCloth(w-0.6,0.09,2.4,o.awn[0],o.awn[1],Math.round(w)).rotateX(0.2).translate(0,3.35,-d/2-1.0)); for(const s of [-1,1]) A(cyl(0.07,0.09,3.3,6).translate(s*(w/2-0.5),1.65,-d/2-2.0),woodC(0x4a3220));
  gwSign(C,F,o.sign||p.name.toUpperCase(),0,H+1.1,-d/2-0.1,Math.min(5.6,w*0.7),0.8,o.sg);
  return G;
}
function gwShops(C){
  { const p=gwPlace('weapons'), {A,R}=gwShopBase(C,p,{col:0xd2b080,awn:[gwIndigo,0xeee4cc],sign:'WEAPONSMITH',sg:{bg:'#2a2a30',ink:'#e6e2d6',line:'#8a8e96'}}), w=p.w, d=p.d;
    A(vbox(1.2,6.2,1.2,-w/2+1.2,3.1,d/2-1.2),gwStone(0xa89a80,0.3)); A(vbox(1.5,0.25,1.5,-w/2+1.2,6.3,d/2-1.2),gwStone(0xa89a80,0.3));   // the forge's chimney
    for(let k=0;k<4;k++) A(vbox(0.1,1.5,0.04,-1.5+k*0.9,1.5,-d/2-1.5).rotateZ(0.08*(k-1.5)),gwSteel);                                    // swords stood in a rack
    A(vbox(3.4,0.12,0.14,-0.6,0.95,-d/2-1.5),woodC(0x4a3220)); A(vbox(0.9,0.5,0.5,w/2-1.3,0.25,-d/2-1.4),woodC(0x4a3220)); A(vbox(1.2,0.22,0.46,w/2-1.3,0.62,-d/2-1.4),gwIron); }   // an anvil on its block
  { const p=gwPlace('armour'), {A}=gwShopBase(C,p,{col:0xcfa26e,awn:[0xb8623a,0xeee4cc],sign:'ARMOURER',sg:{bg:'#4a2a16',ink:'#f0e2c6',line:'#c9a44a'}}), d=p.d;
    for(let k=0;k<3;k++){ const x=-2.2+k*2.2; A(cyl(0.05,0.05,2.0,5).translate(x,1.0,-d/2-1.5),woodC(0x4a3220)); A(cyl(0.4,0.3,0.9,9).translate(x,1.55,-d/2-1.5),k===1?c=>c.set(0x7a5a38):gwSteel); A(new THREE.SphereGeometry(0.26,8,6).translate(x,2.2,-d/2-1.5),gwSteel); }   // armour on stands
    for(let k=0;k<4;k++) A(vbox(0.7,1.0,0.05,-3.0+k*1.5,2.0,d/2+0.08),c=>c.set([0x8a5a34,0x6a4a2c,0x9a6a40,0x7a5030][k])); }                // hides drying on the back wall
  { const p=gwPlace('forge'), {A,W}=gwShopBase(C,p,{col:0xc4a070,awn:[0x3a3a42,0xb8623a],sign:'FORGE',acc:0xb8623a,sg:{bg:'#2a1c14',ink:'#ffd9a0',line:'#b8623a'}}), w=p.w, d=p.d, st=gwStone(0xa89a80,0.3);
    for(const sx of [-1,1]){ A(vbox(1.3,7.0,1.3,sx*(w/2-1.3),3.5,d/2-1.3),st); A(vbox(1.6,0.25,1.6,sx*(w/2-1.3),7.1,d/2-1.3),st); }
    A(vbox(3.2,1.0,1.6,0,0.5,-d/2-1.6),st); A(vbox(2.6,0.25,1.1,0,1.1,-d/2-1.6),c=>c.set(0x2a1c14)); gwFlame(C,gwFrame(p),0,1.5,-d/2-1.6,0,1.4); gwFlame(C,gwFrame(p),0.6,1.4,-d/2-1.5,1,1);   // an open hearth
    A(vbox(1.8,0.6,0.7,-w/2+1.6,0.3,-d/2-1.5),woodC(0x4a3220)); A(vbox(1.6,0.12,0.5,-w/2+1.6,0.65,-d/2-1.5),c=>c.set(0x3a6a8a));      // the quench trough
    for(let k=0;k<5;k++) A(vbox(0.7,0.2,0.3,w/2-1.4,0.1+k*0.2,-d/2-1.4),c=>c.set(k&1?0x8a8e96:0x9a9aa0)); }                               // ingots
  { const p=gwPlace('trainers'), F=gwFrame(p), {A}=gwF(C,F), w=p.w, d=p.d, rail=woodC(0x5a3c26);   // an open yard: a rail fence, straw dummies, racks of wooden swords
    A(vbox(w,0.1,d,0,0.05,0),c=>c.set(0xc9ab72));
    for(let k=0;k<=8;k++){ const fx=-w/2+k*w/8; A(vbox(0.18,1.5,0.18,fx,0.75,d/2),rail); if(Math.abs(fx)>2) A(vbox(0.18,1.5,0.18,fx,0.75,-d/2),rail); }
    for(const z of [d/2,-d/2]) for(const y of [0.55,1.1]) A(vbox(w,0.1,0.1,0,y,z),rail); for(const sx of [-1,1]) for(const y of [0.55,1.1]) A(vbox(0.1,0.1,d,sx*w/2,y,0),rail);
    for(let k=0;k<3;k++){ const x=-3+k*3; A(cyl(0.08,0.1,2.2,6).translate(x,1.1,1.0),rail); A(vbox(1.2,0.12,0.12,x,1.7,1.0),rail); A(cyl(0.4,0.3,0.9,8).translate(x,1.5,1.0),c=>c.set(0xd8c070)); A(new THREE.SphereGeometry(0.28,8,6).translate(x,2.2,1.0),c=>c.set(0xd8c070)); }
    A(vbox(3.2,0.12,0.5,0,1.0,d/2-1.0),rail); for(let k=0;k<5;k++) A(vbox(0.08,0.9,0.05,-1.2+k*0.6,0.55,d/2-1.0).rotateZ(0.2),woodC(0x8a6a44));
    A(vbox(3.6,2.6,3.0,w/2-2.2,1.3,-d/2+2.2),gwPlaster(0xd2b080)); A(vbox(4.0,0.2,3.4,w/2-2.2,2.7,-d/2+2.2),c=>c.set(0xa88a5c));
    gwSign(C,F,"TRAINERS' YARD",0,2.2,-d/2-0.1,3.0,0.6,{bg:'#3a2a1a'}); }
  { const p=gwPlace('alchemist'), F=gwFrame(p), {A,W}=gwShopBase(C,p,{col:0xcfd2b8,awn:[0x2c8c86,0xeee4cc],sign:'ALCHEMIST',acc:0x2c8c86,sg:{bg:'#1c4a48',ink:'#e8f4ec',line:'#7fc8b8'}}), w=p.w, d=p.d;
    A(new THREE.SphereGeometry(2.4,12,6,0,TAU,0,Math.PI/2).translate(w*0.15,4.6,0),gwPlaster(0xdce2c8)); A(cyl(0.6,0.6,1.0,8).translate(w*0.15,7.0,0),c=>c.set(0x6fc8d0)); A(cyl(0.05,0.05,1,5).translate(w*0.15,8.0,0),c=>c.set(gwGoldC));   // a dome with a glass lantern
    for(let k=0;k<7;k++){ const x=-2.6+k*0.9, col=[0x4a9a6a,0xb8623a,0x6a4a8c,0x2c8c86,0xd9a032,0x8a2a40,0x4a9a6a][k]; A(cyl(0.01,0.01,0.4,4).translate(x,3.0,-d/2-1.2),gwIron); A(new THREE.SphereGeometry(0.2,8,6).translate(x,2.6,-d/2-1.2),c=>c.set(col)); } }   // jars hanging under the awning
  { const p=gwPlace('board'), F=gwFrame(p), {A}=gwF(C,F), wood=woodC(0x4a2e1c);   // the quest board: two carved posts, a board with notices, a small roof
    for(const sx of [-1,1]){ A(vbox(0.3,3.8,0.3,sx*1.9,1.9,0),wood); A(vbox(0.7,0.3,0.7,sx*1.9,0.15,0),gwStone(0xb09878,0.2)); A(new THREE.ConeGeometry(0.22,0.5,4).translate(sx*1.9,4.05,0),woodC(0x8a2a26)); }
    A(vbox(3.6,2.1,0.12,0,2.2,0),c=>c.set(0x6a4a30)); A(vbox(4.4,0.3,1.0,0,3.9,0.1),wood); A(vbox(4.4,0.14,0.26,0,1.1,0),wood);
    for(let k=0;k<8;k++) A(vbox(0.55,0.7,0.02,-1.3+(k%4)*0.86,k<4?2.6:1.7,-0.08).rotateZ((h3(k,3,7)-0.5)*0.2),c=>c.set([0xf2ead6,0xe6d8b0,0xf0e0c0,0xe8dcc4][k%4]));
    A(vbox(6.0,0.1,5.0,0,0.05,0),gwStone(0xc4ad82,0.1)); gwSign(C,F,'QUEST BOARD',0,4.7,-0.2,2.6,0.5,{bg:'#1c3346',ink:'#f0f8ff',line:'#b8d8ec'}); }
  { const p=gwPlace('lodge'), F=gwFrame(p), G=gwShopBase(C,p,{col:0xd2b080,H:4.0,awn:[0x4a6a2c,0xeee4cc],sign:"WAYFARERS' LODGE",sg:{bg:'#4a3020',ink:'#fff2d8',line:'#e0c890'}}), {A}=G, w=p.w, d=p.d, wood=woodC(0x5a3c26);
    A(vbox(w,0.1,6,0,0.05,-d/2-5.2),c=>c.set(0xb89a62));                                                                                  // the yard in front
    for(const sx of [-1,1]) A(vbox(0.14,2.3,0.14,sx*1.8-3,1.15,-d/2-7.2),wood); A(vbox(3.8,0.12,0.14,-3,2.3,-d/2-7.2),wood);
    for(let k=0;k<4;k++){ const px=-4.2+k*0.8; A(cyl(0.025,0.025,1.1,5).translate(px,1.6,-d/2-7.15),woodC(0x6a4630)); A(vbox(0.55,0.06,0.06,px,2.12,-d/2-7.15),gwSteel); }   // the tool rack
    A(vbox(1.6,0.7,1.0,3.6,0.6,-d/2-5.4),wood); for(const sx of [-1,1]) A(cyl(0.36,0.36,0.1,10).rotateZ(Math.PI/2).translate(3.6+sx*0.9,0.4,-d/2-5.4),gwIron);        // an ore barrow
    for(let j=0;j<5;j++) A(new THREE.OctahedronGeometry(0.16,0).translate(3.4+Math.sin(j*2.1)*0.3,1.08,-d/2-5.4+Math.cos(j*2.1)*0.2),c=>c.set([0x9fd8ff,0xc8a050,0x8ac8f0][j%3]));
    for(let r=0;r<3;r++) for(let k=0;k<3-r;k++) A(cyl(0.17,0.17,1.3,7).rotateZ(Math.PI/2).translate(-w/2+1.2,0.2+r*0.3,-d/2-4.0+k*0.36+r*0.18),woodC(0x8a6a44)); }   // logs
  { const p=gwPlace('harbour'), F=gwFrame(p), {A,W}=gwShopBase(C,p,{col:0xcfc4a4,H:3.8,awn:[0x2d3f78,0xeee4cc],sign:'HARBOUR MASTER',sg:{bg:'#14304a',ink:'#e6f0f6',line:'#7fb2c8'}}), w=p.w, d=p.d;
    A(vbox(2.6,6.0,2.6,-w/2+1.5,3.0,d/2-1.5),gwPlaster(0xcfc4a4)); A(vbox(3.0,0.3,3.0,-w/2+1.5,6.1,d/2-1.5),gwPlaster(0xb8ad8e)); W(vbox(0.9,1.1,0.08,-w/2+1.5,5.0,d/2-1.5-1.34)); gwFlame(C,F,-w/2+1.5,6.6,d/2-1.5,1,1.3);   // a lamp tower
    A(cyl(0.06,0.06,5,5).translate(w/2-0.7,2.5,-d/2+0.6),woodC(0x3a2616)); A(vbox(0.05,1.1,1.6,w/2-0.7,4.4,-d/2+1.4),c=>c.set(0x2d3f78));
    for(let k=0;k<3;k++) A(new THREE.TorusGeometry(0.4,0.12,5,10).rotateX(Math.PI/2).translate(-1+k*1.0,0.2,-d/2-1.8),woodC(0xb8a070)); }   // rope coils
  gwShopBase(C,gwPlace('fish'),{col:0xd2c4a0,H:3.2,awn:[0x2c6aa0,0xeee4cc],sign:'FISH MARKET',sg:{bg:'#14304a',ink:'#e6f0f6',line:'#7fb2c8'}});
  for(let k=0;k<4;k++){ const x=-36+k*3.4, z=21+(k%2)*0.2, F=frameM(x,0,z,Math.PI), {A,R}=gwF(C,F);   // four stalls on the shore, their backs to the town
    A(vbox(2.6,0.9,1.0,0,0.45,0),woodC(0x6a4630)); for(const sx of [-1,1]) A(cyl(0.06,0.07,2.6,6).translate(sx*1.25,1.3,0.5),woodC(0x4a3220)); R(gwCloth(3.0,0.07,1.9,0x2c6aa0,0xeee4cc,6).rotateX(0.18).translate(0,2.65,0.2));
    for(let f=0;f<5;f++) A(vbox(0.5,0.05,0.18,-1.0+f*0.5,0.95,0.05).rotateZ(((f*7)%5-2)*0.05),c=>c.set(0xb8c4cc)); }
}
// ---- the market street: stalls with awnings along Bazaar Way, shade cloths across it, and iron lamps along every road ----
const gwLen=pts=>{ let L=0; for(let i=0;i<pts.length-1;i++) L+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]); return L; };
function gwAlong(pts,s){ for(let i=0;i<pts.length-1;i++){ const dx=pts[i+1][0]-pts[i][0], dz=pts[i+1][1]-pts[i][1], L=Math.hypot(dx,dz); if(s<=L||i===pts.length-2){ const t=Math.min(1,s/L); return [pts[i][0]+dx*t,pts[i][1]+dz*t,dx/L,dz/L]; } s-=Math.hypot(dx,dz); } }
function gwMarket(C){
  const G=GLASSWELL, bz=G.roads[0].pts, free=(x,z,r)=>!G.places.some(p=>p.w&&Math.hypot(x-p.x,z-p.z)<Math.max(p.w,p.d)/2+r)&&!gwInLake(x,z,3);
  for(let k=0;k<11;k++){ const [px,pz,tx,tz]=gwAlong(bz,22+k*7.2), sd=k%2?1:-1, x=px-tz*sd*4.1, z=pz+tx*sd*4.1; if(!free(x,z,2.4)) continue;
    const {A,R}=gwF(C,frameM(x,0,z,Math.atan2(-(px-x),-(pz-z))));
    A(vbox(3.0,0.9,1.2,0,0.45,0),woodC(0x6a4630)); for(const sx of [-1,1]) A(cyl(0.06,0.07,2.6,6).translate(sx*1.4,1.3,0.5),woodC(0x4a3220));
    R(gwCloth(3.4,0.07,2.1,[0x2d3f78,0xb8623a,0x2c8c86,0xd9a032][k%4],0xeee4cc,7).rotateX(0.2).translate(0,2.7,-0.35));
    for(let g=0;g<5;g++) A(new THREE.IcosahedronGeometry(0.2,0).translate(-1.1+g*0.55,1.1,0),c=>c.set([0xb8623a,0xd9a032,0x6a4a8c,0x4b8a3a,0xc9a44a][(g+k)%5])); }
  for(const s of [39,57,75]){ const [px,pz,tx,tz]=gwAlong(bz,s), {A,R}=gwF(C,frameM(px,0,pz,Math.atan2(tx,tz)));   // a cloth stretched across the street between two poles
    R(gwCloth(7.4,0.05,2.6,gwIndigo,gwGoldC,8).translate(0,5.0,0)); for(const sx of [-1,1]) A(cyl(0.07,0.09,5.0,6).translate(sx*3.8,2.5,0),woodC(0x4a3220)); }
  for(const R of G.roads){ if(R.name==='Lake Walk') continue; let k=0; for(let s=6;s<gwLen(R.pts)-3;s+=15){ const [px,pz,tx,tz]=gwAlong(R.pts,s), sd=(k++)%2?1:-1, x=px-tz*sd*(R.w/2+0.8), z=pz+tx*sd*(R.w/2+0.8); if(Math.hypot(x,z)>G.r-3) break;
      if(free(x,z,1.6)&&Math.hypot(x,z)>20){ const {A}=gwF(C,frameM(x,0,z,0)); A(cyl(0.06,0.09,2.3,6).translate(0,1.15,0),gwIron); A(cyl(0.3,0.17,0.26,8).translate(0,2.4,0),gwIron); A(cyl(0.3,0.3,0.05,8).translate(0,2.55,0),c=>c.set(0x1a1612)); gwFlame(C,frameM(0,0,0,0),x,2.85,z,1,0.75); } } }
}
