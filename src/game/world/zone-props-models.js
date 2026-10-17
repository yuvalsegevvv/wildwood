//@ Zone dressing models, part 1: the helpers (zpDef registry, painted box / cylinder / blob parts) and the home forest's and the Sakura Vale's props (huts, camps, toadstools, webs, shrines, toro, torii)
/* Agent map: zpDef(id,{gen,glow,mat,w,hgt,sink,rad,cast,tilt}) registers a prop kind in ZP_KIND. gen() builds one painted geometry (base at y=0, centred on x/z, about 1 unit = 1 m), glow() an
   optional second geometry drawn unlit (matGlow: lantern panes, embers, rune lines), mat is 'rock' (matRock, default) or 'flat' (matFlat, double sided: webs, boats). w: footprint radius (spacing),
   hgt: height, sink: how far a base is buried (m), rad: collision radius (0 = walk through), tilt: random lean (radians). zpGeo(id) builds a kind once. Parts 2 (zone-props-models2.js) holds the Hoarfrost,
   Greyspine, Sunscar and Gloamhorn props and the ruins. Used by: zone-props.js (themes, placement, boss dressing, ruins). Test: node tools/zoneprops-smoke.js. Doc: docs/areas/zone-props.md.
   Every part is a few hundred triangles at most (the phone draws these too): see the budget check in the smoke test. */
const ZP_KIND={}, ZP_GEO={};
function zpDef(id,o){ ZP_KIND[id]=Object.assign({mat:'rock',w:1,hgt:3,sink:0.15,rad:0,cast:false,tilt:0,glow:null},o); }
function zpGeo(id){ let G=ZP_GEO[id]; if(!G){ const K=ZP_KIND[id]; G=ZP_GEO[id]={geo:K.gen(),glow:K.glow?K.glow():null}; } return G; }
const ZP_WOOD=0x6e4c2e, ZP_DARK=0x4e3622, ZP_BONE=0xe8e0cc, ZP_STONE=0x8a847a, ZP_MOSS=0x5a7a3a, ZP_HIDE=0x8a6a48, ZP_STRAW=0xb89a56, ZP_RED=0x9a2a22, ZP_IRON=0x3a3c42, ZP_SNOW=0xeef4fa, ZP_UP=new THREE.Vector3(0,1,0);
// a vertex-colour function: a base colour with grain, and a lighter colour on upward faces (moss, snow, sand drift)
function zpShade(hex,top,k){ const hc=new THREE.Color(hex), tc=top===undefined?null:new THREE.Color(top), kk=k===undefined?0.75:k;
  return (x,y,z,nx,ny,nz,c)=>{ c.copy(hc).multiplyScalar(0.8+h3(x*4,y*4,z*4)*0.3); if(tc&&ny>0.55) c.lerp(tc,kk); }; }
function zpAt(g,x,y,z,o){ if(o){ if(o.rx) g.rotateX(o.rx); if(o.rz) g.rotateZ(o.rz); if(o.ry) g.rotateY(o.ry); } return g.translate(x,y,z); }
const zpBox=(w,h,d,x,y,z,hex,o)=>paint(zpAt(new THREE.BoxGeometry(w,h,d).translate(0,h/2,0),x,y,z,o),zpShade(hex,o&&o.top,o&&o.k));
const zpCyl=(rt,rb,h,seg,x,y,z,hex,o)=>paint(zpAt(cyl(rt,rb,h,seg).translate(0,h/2,0),x,y,z,o),zpShade(hex,o&&o.top,o&&o.k));
const zpBlob=(r,sx,sy,sz,x,y,z,hex,o)=>paint(zpAt(new THREE.IcosahedronGeometry(r,o&&o.d!==undefined?o.d:1).scale(sx,sy,sz),x,y,z,o),zpShade(hex,o&&o.top,o&&o.k));
const zpDome=(r,sy,seg,x,y,z,hex,o)=>paint(zpAt(new THREE.SphereGeometry(r,seg,Math.ceil(seg/2),0,TAU,0,Math.PI/2).scale(1,sy,1),x,y,z,o),zpShade(hex,o&&o.top,o&&o.k));
// a triangular prism lying along x (a tent, a roof ridge): r = circumradius, the apex up, its lowest edge at y
const zpPrism=(r,len,x,y,z,hex,o)=>paint(zpAt(cyl(r,r,len,3).rotateZ(Math.PI/2).rotateX(-Math.PI/2).translate(0,r/2,0),x,y,z,o),zpShade(hex,o&&o.top,o&&o.k));
// a thin straight strand from a to b (a web thread, a rope): an open three-sided tube
function zpStrand(a,b,t,hex){ const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), L=d.length()||0.01; d.normalize();
  const g=new THREE.CylinderGeometry(t,t,L,3,1,true).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(ZP_UP,d))).translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
  return paint(g,zpShade(hex)); }
// an upright wall-less flat disc (a puddle, a pool, a crater floor)
const zpPool=(r,hex,rim,rimHex)=>merge([zpCyl(r*1.1,r*1.15,0.1,12,0,0,0,rimHex||rim),zpCyl(r*0.92,r,0.13,12,0,0,0,hex)]);
function zpLathe(pts,seg,hex,o){ return paint(zpAt(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg),0,0,0,o),zpShade(hex,o&&o.top)); }
// ribs: n arches across a spine, tallest in the middle (a beast's, a wreck's, a wyrm's)
function zpRibs(n,R,tube,hex,keel){ const p=[];
  for(let i=0;i<n;i++){ const t=n>1?i/(n-1):0.5, k=0.55+0.45*Math.sin(t*Math.PI), x=(i-(n-1)/2)*R*0.42;
    p.push(paint(new THREE.TorusGeometry(R*k,tube,4,9,Math.PI).rotateY(Math.PI/2).translate(x,0,0),zpShade(hex))); }
  p.push(zpCyl(tube*1.2,tube*1.2,n*R*0.42,5,n*R*0.21,tube*1.2,0,keel||hex,{rz:Math.PI/2}));
  return merge(p); }
// a crystal / spire cluster: n prisms (the first the tallest) leaning out of a point. crys: a hexagonal shaft with a tip, otherwise a plain cone (rock)
function zpSpire(a,b,n,h,r,crys){ const p=[], ca=new THREE.Color(a), cb=new THREE.Color(b);
  for(let i=0;i<n;i++){ const hh=h*(i?0.42+0.4*((i*0.37)%1):1), rr=r*(i?0.45+0.25*((i*0.61)%1):1), ang=i*2.4, d=i?r*1.25:0, lean=i?0.2:0.05;
    const g=(crys?merge([paint(cyl(rr,rr*1.05,hh*0.62,6).translate(0,hh*0.31,0),()=>{}),paint(cyl(0,rr,hh*0.38,6).translate(0,hh*0.62+hh*0.19,0),()=>{})]):cyl(0,rr,hh,5).translate(0,hh/2,0));
    g.rotateZ(lean*Math.sin(i*5.1)).rotateX(lean*Math.cos(i*3.3)).translate(Math.sin(ang)*d,-0.05,Math.cos(ang)*d);
    p.push(paint(g,(x,y,z,nx,ny,nz,c)=>{ c.copy(ca).lerp(cb,clamp(y/hh)).multiplyScalar(0.85+h3(x,y,z)*0.25); })); }
  return merge(p); }
// a round hut: a wall drum, a cone roof, a dark door, crossed poles on top
function zpHut(wall,roof,k,flag){ const p=[zpCyl(1.5*k,1.6*k,1.5*k,10,0,0,0,wall),zpCyl(0.02,2.0*k,1.5*k,10,0,1.45*k,0,roof),zpBox(0.7*k,1.1*k,0.3,0,0,1.5*k-0.05,0x2a1e14),
    zpCyl(0.05,0.05,1.3,5,0,2.7*k,0,ZP_WOOD,{rz:0.4}),zpCyl(0.05,0.05,1.3,5,0,2.7*k,0,ZP_WOOD,{rz:-0.4})];
  if(flag==='skull') p.push(zpBlob(0.17,1,1,1,0.6*k,1.5*k+0.1,1.58*k,ZP_BONE));
  if(flag==='band') p.push(zpCyl(1.62*k,1.62*k,0.22*k,10,0,0.95*k,0,ZP_RED));
  return merge(p); }
// sharpened stakes leaning a little, tied with two rails (a barricade, a palisade, a spiked fence)
function zpStakes(n,hex,rail,hgt){ const p=[], span=(n-1)*0.62;
  for(let i=0;i<n;i++){ const hh=hgt*(0.85+0.3*Math.abs(Math.sin(i*2.1))); p.push(zpCyl(0.02,0.12,hh,6,i*0.62-span/2,0,0.02*(i%2),hex,{rx:(i%2?0.1:-0.1)})); }
  p.push(zpBox(span+0.5,0.12,0.12,0,hgt*0.32,0.16,rail)); p.push(zpBox(span+0.5,0.12,0.12,0,hgt*0.62,0.16,rail)); return merge(p); }
function zpBanner(cloth){ return merge([zpCyl(0.06,0.08,4.2,6,0,0,0,ZP_DARK),zpBox(1.1,1.5,0.05,0.62,2.35,0,cloth),zpBox(1.1,0.12,0.06,0.62,2.3,0,0x201810),zpBlob(0.12,1,1,1,0,4.3,0,0xc8a040)]); }
function zpToad(cap,spot,stem,ring){ const p=[];
  for(const [dx,dz,s] of [[0,0,1],[0.9,0.5,0.55],[-0.6,0.8,0.4]]){ const h=0.9*s;
    p.push(zpCyl(0.14*s,0.2*s,h,7,dx,0,dz,stem)); p.push(zpDome(0.62*s,0.62,9,dx,h-0.05*s,dz,cap));
    for(let i=0;i<5;i++){ const a=i*1.3+s*3; p.push(zpBlob(0.07*s,1,0.6,1,dx+Math.sin(a)*0.34*s,h+0.2*s+(i%2)*0.03,dz+Math.cos(a)*0.34*s,spot,{d:0})); } }
  if(ring) p.push(zpCyl(0.2,0.2,0.04,7,0,0.45,0,ring)); return merge(p); }
function zpHusk(c1,c2){ const c=new THREE.Color(c1), d=new THREE.Color(c2);
  return merge([paint(new THREE.SphereGeometry(1.1,10,6,0,TAU,0,Math.PI/2).scale(1,0.62,1.5).rotateZ(0.12),(x,y,z,nx,ny,nz,k)=>{ k.copy(c).lerp(d,clamp(y/0.7+Math.sin(z*3)*0.15)).multiplyScalar(0.85+h3(x,y,z)*0.25); }),
    zpBox(0.05,0.05,2.4,0,0.66,0,0x14100c,{rz:0.12})]); }
function zpFire(){ return merge([zpCyl(0.95,1.0,0.06,10,0,0,0,0x2a2420),...[0,1,2,3,4,5,6,7].map(i=>zpBlob(0.22,1.2,0.8,1,Math.cos(i*0.785)*0.95,0.1,Math.sin(i*0.785)*0.95,ZP_STONE)),
    ...[0,1,2].map(i=>zpCyl(0.09,0.1,1.0,6,0,0.12,0,0x3a2a1e,{rz:Math.PI/2-0.15,ry:i*2.1}))]); }
const ZP_FIRE_GLOW=()=>merge([zpCyl(0,0.34,0.6,6,0,0.1,0,0xff8a20),zpCyl(0,0.18,0.8,6,0,0.1,0,0xffd060)]);
function zpLamp(post,glow,h,cage){ const p=[zpCyl(0.04,0.06,h,5,0,0,0,post)];
  if(cage) p.push(zpBox(0.55,0.1,0.1,0.25,h-0.05,0,post),zpBox(0.34,0.38,0.34,0.5,h-0.5,0,post)); else p.push(zpBox(0.3,0.06,0.06,0.12,h-0.08,0,post));
  return merge(p); }
function zpLampGlow(glow,h,cage){ return cage?zpBox(0.37,0.28,0.37,0.5,h-0.455,0,glow):zpBlob(0.18,1,1.25,1,0.26,h-0.3,0,glow); }

/* ---- the home forest: slime meadow, mushroom hollow, beetle thicket, boar run, goblin woods and warrens, treants, bog, deathcaps, ironshell, rotwood, ember flats, the chieftain's hold, the ancient grove ---- */
zpDef('slimepool',{w:1.4,hgt:0.3,sink:0.02,gen:()=>merge([zpPool(1.25,0x5aa83a,0,0x4a8a30),zpDome(0.8,0.35,8,0.2,0.08,-0.1,0x8be05a),zpDome(0.4,0.4,7,-0.6,0.08,0.4,0x9ae870)])});
zpDef('toadred',{w:1.1,hgt:1.3,gen:()=>zpToad(0xc8362c,0xf4ecd8,0xe8e0cc)});
zpDef('toadpurple',{w:1.1,hgt:1.3,gen:()=>zpToad(0x7a4aa0,0xd8c8f0,0xd8d0c0)});
zpDef('deathcap',{w:1.1,hgt:1.3,gen:()=>zpToad(0x8fa84a,0xe8f0c0,0xe8e8d0,0xd8d8c0)});
zpDef('burrow',{w:1.6,hgt:0.9,gen:()=>merge([zpDome(1.5,0.5,10,0,0,0,0x5a4630),zpBlob(0.5,1,0.8,0.3,0,0.3,1.25,0x14100c),zpBlob(0.3,1,0.7,0.8,-1.0,0.2,0.9,ZP_STONE),zpBlob(0.25,1,0.7,0.8,0.9,0.15,1.0,ZP_STONE)])});
zpDef('husk',{w:1.4,hgt:0.9,sink:0.1,gen:()=>zpHusk(0x2a5a44,0x4a6a88)});
zpDef('ironhusk',{w:1.4,hgt:0.9,sink:0.1,gen:()=>zpHusk(0x6a6e76,0xa0583a)});
zpDef('barricade',{w:1.8,hgt:2.4,rad:1.3,gen:()=>zpStakes(6,ZP_WOOD,ZP_DARK,2.1)});
zpDef('ironstakes',{w:1.8,hgt:2.6,rad:1.3,gen:()=>zpStakes(5,ZP_IRON,0x2a2a2e,2.4)});
zpDef('palisade',{w:2.6,hgt:3.0,rad:1.6,gen:()=>zpStakes(8,0x5a3e26,ZP_DARK,2.7)});
zpDef('wallow',{w:2.2,hgt:0.3,sink:0.04,gen:()=>zpPool(1.9,0x2e2218,0,0x5a4630)});
zpDef('gobhut',{w:2.2,hgt:3.2,rad:1.7,cast:true,gen:()=>zpHut(ZP_HIDE,0x9a7a3a,1,'skull')});
zpDef('warhut',{w:3.0,hgt:4.2,rad:2.3,cast:true,gen:()=>zpHut(0x7a5a40,0x6a4a30,1.4,'band')});
zpDef('campfire',{w:1.2,hgt:0.8,sink:0.05,gen:zpFire,glow:ZP_FIRE_GLOW});
zpDef('gobtotem',{w:0.7,hgt:4.4,rad:0.4,cast:true,gen:()=>merge([zpCyl(0.16,0.2,3.4,7,0,0,0,ZP_WOOD),
  ...[[0xa83a28,0],[0xd0a038,1],[0x3a3028,2]].map(([c,i])=>zpBox(0.5,0.5,0.5,0,0.6+i*0.8,0,c,{ry:i*0.3})),zpBlob(0.2,1,1,1,0,3.6,0,ZP_BONE),zpCyl(0.02,0.03,0.9,4,0.2,3.3,0,0x8a3a2a,{rz:-0.5}),zpCyl(0.02,0.03,0.9,4,-0.2,3.3,0,0x3a5a8a,{rz:0.5})])});
zpDef('bonepile',{w:1.0,hgt:0.8,gen:()=>merge([...[0,1,2,3,4,5].map(i=>zpCyl(0.05,0.06,0.8,5,Math.sin(i*1.9)*0.3,0.05*i%0.2,Math.cos(i*1.9)*0.3,ZP_BONE,{rz:Math.PI/2-0.1*i,ry:i*1.1})),zpBlob(0.2,1,0.85,1.1,0.1,0.2,0.1,ZP_BONE)])});
zpDef('banner',{w:0.8,hgt:4.4,rad:0.25,cast:true,gen:()=>zpBanner(ZP_RED)});
zpDef('banner_blue',{w:0.8,hgt:4.4,rad:0.25,cast:true,gen:()=>zpBanner(0x2e5a9a)});
zpDef('banner_black',{w:0.8,hgt:4.4,rad:0.25,cast:true,gen:()=>zpBanner(0x241c1c)});
zpDef('banner_ice',{w:0.8,hgt:4.4,rad:0.25,cast:true,gen:()=>zpBanner(0x8ab8e0)});
zpDef('rootarch',{w:2.0,hgt:2.4,sink:0.3,rad:0.5,cast:true,gen:()=>merge([paint(new THREE.TorusGeometry(1.3,0.26,6,10,Math.PI),zpShade(0x5a4128,ZP_MOSS,0.5)),zpCyl(0.05,0.3,0.7,5,1.4,-0.6,0,0x5a4128,{rz:0.5}),zpCyl(0.05,0.3,0.7,5,-1.4,-0.6,0,0x5a4128,{rz:-0.5}),zpBlob(0.3,1,0.6,1,1.3,0.1,0.2,0x4a3320)])});
zpDef('hollowstump',{w:1.7,hgt:1.8,rad:1.2,cast:true,gen:()=>merge([zpCyl(1.2,1.5,1.7,9,0,0,0,0x5a4128,{top:ZP_MOSS,k:0.5}),zpCyl(0.7,0.7,0.05,9,0,1.68,0,0x1c140c),...[0,1,2,3].map(i=>zpCyl(0.05,0.3,0.8,5,Math.sin(i*1.57+0.4)*1.4,0,Math.cos(i*1.57+0.4)*1.4,0x4a3320,{rz:Math.sin(i*1.57+0.4)*0.8,rx:-Math.cos(i*1.57+0.4)*0.8}))])});
zpDef('mosstone',{w:1.4,hgt:1.4,sink:0.3,rad:0.9,gen:()=>merge([zpBlob(1.0,1.2,0.8,1,0,0.55,0,0x7a766e,{top:ZP_MOSS,k:0.7}),zpBlob(0.5,1,0.7,1,1.1,0.25,0.5,0x7a766e,{top:ZP_MOSS,k:0.7})])});
function zpRune(stone,top,glow){ return {gen:()=>merge([zpBox(1.1,2.9,0.55,0,0,0,stone,{top,rz:0.03}),zpBox(0.7,0.5,0.5,0.15,2.8,0,stone,{top,rz:0.2})]),
  glow:()=>merge([zpBox(0.12,0.9,0.04,0,0.8,0.28,glow),zpBox(0.5,0.1,0.04,0,1.8,0.28,glow),zpBox(0.1,0.5,0.04,0.2,2.0,0.28,glow)])}; }
zpDef('runestone',Object.assign({w:1.0,hgt:3.2,rad:0.6,cast:true},zpRune(0x7a766e,ZP_MOSS,0x7af0c0)));
zpDef('runestone_ice',Object.assign({w:1.0,hgt:3.2,rad:0.6,cast:true},zpRune(0x7d858c,ZP_SNOW,0x8ad0ff)));
zpDef('runestone_dusk',Object.assign({w:1.0,hgt:3.2,rad:0.6,cast:true},zpRune(0x4a4c54,0x5a6a5a,0xc0a0ff)));
zpDef('deadstump',{w:1.0,hgt:2.2,rad:0.5,tilt:0.05,gen:()=>merge([zpCyl(0.25,0.55,1.3,7,0,0,0,0x3d3228,{rz:0.1}),zpCyl(0.2,0.35,1.0,6,0.25,0.9,0,0x3d3228,{rz:-0.35}),zpCyl(0.05,0.18,0.9,5,-0.1,1.0,0.1,0x3d3228,{rz:0.5}),zpCyl(0.04,0.25,0.7,5,0.3,0,0.3,0x3d3228,{rz:-1.0})])});
zpDef('bogpool',{w:1.8,hgt:0.2,sink:0.04,gen:()=>merge([zpPool(1.6,0x2e3d30,0,0x4a4a30),zpCyl(0.3,0.3,0.03,8,0.5,0.1,0.3,0x4a7a3a),zpCyl(0.22,0.22,0.03,8,-0.6,0.1,-0.2,0x58883f)])});
zpDef('wisplamp',{w:0.5,hgt:2.2,gen:()=>zpLamp(ZP_DARK,0,1.7,false),glow:()=>zpLampGlow(0x9ef0c0,1.7,false)});
zpDef('wisplamp_blue',{w:0.5,hgt:2.2,gen:()=>zpLamp(0x3a3a48,0,1.7,false),glow:()=>zpLampGlow(0x8ab8ff,1.7,false)});
zpDef('foxfire',{w:0.5,hgt:2.2,gen:()=>zpLamp(0x4a4038,0,1.7,false),glow:()=>zpLampGlow(0xa8d8ff,1.7,false)});
zpDef('orerock',{w:1.4,hgt:1.4,sink:0.3,rad:0.9,gen:()=>merge([zpBlob(1.0,1.2,0.85,1,0,0.5,0,0x6a6460),...[0,1,2,3].map(i=>zpBlob(0.2,1,0.8,1,Math.sin(i*1.7)*0.65,0.55+0.2*(i%2),Math.cos(i*1.7)*0.55,0xa0502a))])});
zpDef('rotlog',{w:2.0,hgt:1.6,sink:0.1,rad:0.8,gen:()=>merge([paint(cyl(0.75,0.8,3.6,9).rotateZ(Math.PI/2).translate(0,0.75,0),zpShade(0x4a3a28,ZP_MOSS,0.5)),paint(cyl(0.55,0.55,0.04,9).rotateZ(Math.PI/2).translate(1.82,0.75,0),zpShade(0x1c140c)),
  ...[0,1,2].map(i=>zpBlob(0.35,1,0.22,0.8,-0.9+i*0.8,1.1+0.1*(i%2),0.58,0xd28a3a))])});
zpDef('cinderrock',{w:1.5,hgt:1.4,sink:0.3,rad:0.9,gen:()=>merge([zpBlob(1.0,1.1,0.85,1,0,0.5,0,0x2c2826),zpBlob(0.55,1,0.7,1,1.1,0.25,0.4,0x2c2826)]),
  glow:()=>merge([zpBox(0.9,0.05,0.08,0,0.78,0.1,0xff7a20,{ry:0.5}),zpBox(0.6,0.05,0.07,-0.2,0.7,-0.3,0xffa030,{ry:-0.7}),zpBox(0.5,0.05,0.06,1.1,0.5,0.4,0xff7a20,{ry:0.2})])});
zpDef('charstump',{w:0.9,hgt:2.0,rad:0.5,gen:()=>merge([zpCyl(0.35,0.5,1.8,7,0,0,0,0x1a1614,{rz:0.08}),zpCyl(0.1,0.3,0.7,5,0.2,1.7,0,0x1a1614,{rz:-0.3})]),glow:()=>zpBlob(0.14,1,0.5,1,0.1,1.78,0,0xff7a20)});
zpDef('shell',{w:1.2,hgt:0.9,sink:0.1,gen:()=>zpShellGeo()});
function zpShellGeo(){ const g=new THREE.SphereGeometry(1,10,5,0,TAU,0,Math.PI/2).scale(1,0.45,0.85); return paint(g,(x,y,z,nx,ny,nz,c)=>{ const a=Math.atan2(x,z); c.set(0xe8c0b0).lerp(new THREE.Color(0xf4e4d8),0.5+0.5*Math.sin(a*9)).multiplyScalar(0.9+h3(x,y,z)*0.15); }); }
zpDef('crabpot',{w:0.9,hgt:0.9,gen:()=>merge([zpDome(0.7,0.9,8,0,0,0,0x9a7a48),zpCyl(0.72,0.72,0.06,8,0,0.0,0,0x5a4630),zpBlob(0.12,1,1,1,0.9,0.1,0.3,0xe05a20),zpCyl(0.01,0.01,1.0,3,0.7,0.0,0.25,0x8a7a58,{rz:Math.PI/2})])});
zpDef('driftlog',{w:2.0,hgt:0.9,sink:0.05,rad:0.5,gen:()=>merge([paint(cyl(0.3,0.34,4,7).rotateZ(Math.PI/2).translate(0,0.34,0),zpShade(0x9a8e7a)),zpCyl(0.05,0.12,0.9,5,-0.6,0.5,0,0x8a7e6a,{rz:0.8})])});
zpDef('cairn',{w:0.9,hgt:1.8,sink:0.1,rad:0.5,gen:()=>merge([zpBlob(0.55,1.2,0.5,1,0,0.25,0,ZP_STONE),zpBlob(0.42,1.1,0.45,1,0.05,0.7,0,0x7a766e),zpBlob(0.3,1,0.45,1,-0.03,1.05,0.02,0x8a867e),zpBlob(0.2,1,0.5,1,0,1.38,0,0x9a968c)])});
zpDef('cairn_snow',{w:0.9,hgt:1.8,sink:0.1,rad:0.5,gen:()=>merge([zpBlob(0.55,1.2,0.5,1,0,0.25,0,0x7d858c,{top:ZP_SNOW}),zpBlob(0.42,1.1,0.45,1,0.05,0.7,0,0x7d858c,{top:ZP_SNOW}),zpBlob(0.3,1,0.45,1,-0.03,1.05,0.02,0x8a929a,{top:ZP_SNOW}),zpBlob(0.2,1,0.5,1,0,1.38,0,0x9aa2aa,{top:ZP_SNOW})])});
zpDef('rockspire',{w:1.2,hgt:4.0,sink:0.3,rad:0.7,cast:true,gen:()=>zpSpire(0x7a766e,0x9a968c,3,3.8,0.8,false)});

/* ---- the Sakura Vale ---- */
zpDef('toro',{w:0.7,hgt:2.2,rad:0.35,cast:true,gen:()=>merge([zpCyl(0.5,0.6,0.25,6,0,0,0,0x8a8a86),zpCyl(0.17,0.2,1.0,6,0,0.25,0,0x8a8a86,{top:ZP_MOSS,k:0.3}),zpBox(0.6,0.55,0.6,0,0.98,0,0x8a8a86),zpCyl(0.02,0.68,0.42,4,0,1.53,0,0x7a7a76,{ry:Math.PI/4,top:ZP_MOSS,k:0.3}),zpBlob(0.1,1,1,1,0,2.0,0,0x8a8a86)]),
  glow:()=>merge([zpBox(0.34,0.3,0.64,0,1.1,0,0xffd890),zpBox(0.64,0.3,0.34,0,1.1,0,0xffd890)])});
zpDef('hokora',{w:0.9,hgt:1.8,rad:0.45,cast:true,gen:()=>merge([...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>zpBox(0.1,0.5,0.1,a*0.38,0,b*0.3,ZP_WOOD)),zpBox(1.0,0.1,0.8,0,0.5,0,0x8a6a4a),zpBox(0.8,0.7,0.6,0,0.6,0,0x9a7a56),zpBox(0.34,0.5,0.1,0,0.62,0.3,0x2a1e14),zpCyl(0.02,0.82,0.55,4,0,1.3,0,0x4a3a30,{ry:Math.PI/4})])});
zpDef('jizo',{w:0.6,hgt:1.5,rad:0.3,gen:()=>merge([zpCyl(0.35,0.4,0.3,7,0,0,0,0x8a8a84,{top:ZP_MOSS,k:0.6}),zpCyl(0.15,0.3,0.7,7,0,0.3,0,0x9a9a92,{top:ZP_MOSS,k:0.4}),zpBlob(0.2,1,1,1,0,1.2,0,0x9a9a92),zpCyl(0.17,0.31,0.2,7,0,0.5,0,0xc0301f),zpDome(0.28,0.5,8,0,1.27,0,0xb89a56)])});
zpDef('foxstatue',{w:0.8,hgt:1.7,rad:0.4,cast:true,gen:()=>merge([zpBox(0.8,0.3,0.8,0,0,0,0x9a9a92),zpCyl(0.2,0.38,0.9,7,0,0.3,0,0xd8d4c8),zpBlob(0.22,1,1,1.15,0,1.45,0.1,0xd8d4c8),zpCyl(0,0.1,0.32,5,0,1.4,0.42,0xd8d4c8,{rx:Math.PI/2}),zpCyl(0,0.09,0.3,4,0.14,1.58,0.05,0xd8d4c8),zpCyl(0,0.09,0.3,4,-0.14,1.58,0.05,0xd8d4c8),zpCyl(0.17,0.31,0.14,7,0,1.0,0,0xc0301f),zpBlob(0.18,0.8,1.2,1.4,0.0,0.55,-0.5,0xd8d4c8)])});
function zpTorii(col){ return merge([zpCyl(0.17,0.2,3.6,8,-1.4,0,0,col),zpCyl(0.17,0.2,3.6,8,1.4,0,0,col),zpBox(0.5,0.4,0.5,-1.4,0,0,0x201a18),zpBox(0.5,0.4,0.5,1.4,0,0,0x201a18),zpBox(4.3,0.22,0.42,0,3.55,0,0x201a18),zpBox(3.5,0.18,0.3,0,3.38,0,col),zpBox(3.0,0.16,0.22,0,2.8,0,col)]); }
zpDef('torii',{w:2.2,hgt:4.0,rad:0.3,cast:true,gen:()=>zpTorii(0xb8321f)});
zpDef('torii_dark',{w:2.2,hgt:4.0,rad:0.3,cast:true,gen:()=>zpTorii(0x6a1c18)});
zpDef('bamboofence',{w:2.0,hgt:1.4,rad:0.3,gen:()=>merge([...[-1.8,-0.9,0,0.9,1.8].map(x=>zpCyl(0.06,0.07,1.3,6,x,0,0,0x9ab04a)),paint(cyl(0.04,0.04,3.8,5).rotateZ(Math.PI/2).translate(0,0.5,0.08),zpShade(0xa8bc54)),paint(cyl(0.04,0.04,3.8,5).rotateZ(Math.PI/2).translate(0,1.0,0.08),zpShade(0xa8bc54))])});
zpDef('prayerflags',{w:2.2,hgt:3.4,rad:0.2,gen:()=>merge([zpCyl(0.05,0.07,3.3,5,-1.8,0,0,ZP_DARK),zpCyl(0.05,0.07,3.3,5,1.8,0,0,ZP_DARK),...[0,1,2,3,4].map(i=>{ const t=(i+0.5)/5, x=-1.8+t*3.6, y=3.0-0.55*Math.sin(t*Math.PI); return zpBox(0.4,0.4,0.03,x,y-0.4,0,[0x3a6ab0,0xeeeeee,0xc0302a,0x3a9a4a,0xe0b030][i]); }),zpStrand([-1.8,3.2,0],[0,2.6,0],0.012,0xcccccc),zpStrand([0,2.6,0],[1.8,3.2,0],0.012,0xcccccc)])});
zpDef('kanabo',{w:0.8,hgt:2.8,rad:0.4,tilt:0.06,gen:()=>merge([zpCyl(0.34,0.14,2.6,8,0,0,0,ZP_IRON,{rz:0.1}),zpCyl(0.36,0.36,0.2,8,0,1.9,0,ZP_RED,{rz:0.1}),...[0,1,2,3,4,5,6,7].map(i=>zpBlob(0.09,1,1,1,Math.sin(i*0.785)*0.34+0.2,1.5+0.35*(i%3),Math.cos(i*0.785)*0.34,0x2a2a2e))])});
zpDef('lightrod',{w:0.8,hgt:5.6,rad:0.3,cast:true,gen:()=>merge([zpBox(0.7,0.4,0.7,0,0,0,0x5a5a60),zpCyl(0.05,0.1,5.0,6,0,0.3,0,ZP_IRON),zpCyl(0.02,0.04,0.7,4,0.2,5.1,0,ZP_IRON,{rz:-0.5}),zpCyl(0.02,0.04,0.7,4,-0.2,5.1,0,ZP_IRON,{rz:0.5})]),glow:()=>zpBlob(0.2,1,1,1,0,5.45,0,0xcfe8ff)});
zpDef('weaponrack',{w:1.3,hgt:2.3,rad:0.2,gen:()=>merge([zpCyl(0.07,0.07,1.8,5,-1,0,0,ZP_WOOD),zpCyl(0.07,0.07,1.8,5,1,0,0,ZP_WOOD),zpBox(2.2,0.1,0.1,0,1.5,0,ZP_DARK),zpBox(2.2,0.1,0.1,0,0.7,0,ZP_DARK),
  ...[-0.5,0,0.5].map(x=>merge([zpCyl(0.025,0.025,2.2,5,x,0,0.2,ZP_WOOD,{rx:-0.1}),zpCyl(0,0.07,0.3,4,x,2.2,0.02,0x9a9aa2)])),zpCyl(0.4,0.4,0.06,10,0.8,0.5,0.25,ZP_RED,{rx:Math.PI/2})])});
zpDef('jadespire',{w:1.2,hgt:3.0,sink:0.2,rad:0.6,cast:true,gen:()=>zpSpire(0x2f9a72,0x9af0c8,4,3.0,0.5,true)});
zpDef('web',{mat:'flat',w:1.9,hgt:3.4,gen:()=>{ const r=1.5, cy=1.9, p=[zpCyl(0.05,0.08,3.4,5,-1.75,0,0,0x3d3228,{rz:0.05}),zpCyl(0.05,0.08,3.4,5,1.75,0,0,0x3d3228,{rz:-0.05})], rim=[];
  for(let i=0;i<10;i++){ const a=i/10*TAU; rim.push([Math.sin(a),Math.cos(a)]); p.push(zpStrand([0,cy,0],[Math.sin(a)*r,cy+Math.cos(a)*r,0],0.016,0xeeeeee)); }
  for(const f of [0.35,0.6,0.85]) for(let i=0;i<10;i++){ const A=rim[i], B=rim[(i+1)%10]; p.push(zpStrand([A[0]*r*f,cy+A[1]*r*f,0],[B[0]*r*f,cy+B[1]*r*f,0],0.012,0xe6e6e6)); }
  p.push(zpStrand([-1.75,3.2,0],[-0.5,cy+r*0.9,0],0.014,0xdddddd),zpStrand([1.75,3.2,0],[0.5,cy+r*0.9,0],0.014,0xdddddd)); return merge(p); }});
zpDef('webdome',{mat:'flat',w:1.5,hgt:1.4,sink:0.05,gen:()=>{ const ico=new THREE.IcosahedronGeometry(1.3,1), P=ico.attributes.position, seen=new Set(), p=[zpBlob(0.55,1,0.7,1,0,0.3,0,0xe8e4d8,{k:0})], key=v=>v.map(n=>Math.round(n*100)).join(',');
  for(let i=0;i<P.count;i+=3) for(let e=0;e<3;e++){ const a=[P.getX(i+e),P.getY(i+e)*0.65,P.getZ(i+e)], b=[P.getX(i+(e+1)%3),P.getY(i+(e+1)%3)*0.65,P.getZ(i+(e+1)%3)];
    if(a[1]<-0.05||b[1]<-0.05) continue; const k=key(a)<key(b)?key(a)+'|'+key(b):key(b)+'|'+key(a); if(seen.has(k)) continue; seen.add(k); p.push(zpStrand(a,b,0.02,0xeeeeee)); }
  return merge(p); }});
zpDef('cocoon',{mat:'flat',w:0.9,hgt:2.2,sink:0.1,gen:()=>merge([zpCyl(0.04,0.06,2.0,5,0,0,0,0x3d3228),zpBlob(0.35,1,1.7,1,0.0,1.3,0,0xe8e4d8,{k:0}),zpBlob(0.26,1,1.5,1,0.45,0.55,0.1,0xe0dccf,{k:0}),zpStrand([0,2.0,0],[0.5,0.9,0.1],0.012,0xeeeeee)])});
zpDef('sotoba',{w:0.5,hgt:2.4,rad:0.2,tilt:0.12,gen:()=>merge([zpBox(0.28,2.3,0.06,0,0,0,0xb8a888),...[0.4,0.6,0.8].map(y=>zpBox(0.34,0.04,0.07,0,1.3+y,0,0x6a5a48))])});
