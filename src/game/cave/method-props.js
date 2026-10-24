//@ The Deep Cave's method props in the floor: the mural and its five pieces, the geodes with their element signs, the plinth, the glow crystal and altar, the sleeping guardian, the vault and its boulders, the mole holes, veins, herbs and the stone anvil
/* Agent map. Doc: docs/CAVE.md section 15. Test: tools/client-smoke.js (the cave case builds them on every floor). State comes from the server's cm message (methods.js caveMState): a (mural pieces you hold, bit mask), b (geodes 0 sealed / 1 cracked /
   2 charged), c (echo trial), d (lantern), e (silent chamber: z noise), fv (vault), h (vm / hm: veins and herbs you took). The places are the floor's anchors (caveBake(n).anchors, floor-local metres + R.ox / R.oz).
   exports: caveMPropsBuild(R), caveMPropsClear(), caveMPropsFrame(dt, s).
   Cheap on purpose (a phone): unlit basic materials, a few shared geometries, about 60 small meshes in one group, two canvas textures (the mural, three geode signs); nothing is lit or shadowed. Everything is disposed on leaving. */
const CAVE_MP={g:null,geos:[],mats:[],texs:[],upd:[],carry:null,R:null,mural:null};
function caveMPropsBuild(R){
  caveMPropsClear();
  const A=R.B.anchors, MP=CAVE_MP, g=new THREE.Group(); g.name='caveMethodProps'; MP.g=g; MP.R=R; scene.add(g);
  const geo=(k,o)=>{ const x=o; MP.geos.push(x); return x; };
  const gOct=geo('oct',new THREE.OctahedronGeometry(1)), gIco=geo('ico',new THREE.IcosahedronGeometry(1,0)), gCyl=geo('cyl',new THREE.CylinderGeometry(1,1,1,14)), gCone=geo('cone',new THREE.ConeGeometry(1,1,6)),
    gBox=geo('box',new THREE.BoxGeometry(1,1,1)), gDod=geo('dod',new THREE.DodecahedronGeometry(1,0)), gSph=geo('sph',new THREE.SphereGeometry(1,10,8)), gCirc=geo('circ',new THREE.CircleGeometry(1,16).rotateX(-Math.PI/2)),
    gRing=geo('ring',new THREE.RingGeometry(0.85,1,28).rotateX(-Math.PI/2));
  const mat=(col,o)=>{ const m=new THREE.MeshBasicMaterial(Object.assign({color:col,fog:true},o||{})); MP.mats.push(m); return m; };
  const wy=(x,z)=>caveGroundY(R.ox+x,R.oz+z), put=(mesh,x,z,dy)=>{ mesh.position.set(R.ox+x,wy(x,z)+(dy||0),R.oz+z); g.add(mesh); return mesh; };
  const out=(q,k)=>[q.x+(q.nx||0)*k,q.z+(q.nz||0)*k];   // a wall point, moved k m off the rock
  const mk=(geom,m,sx,sy,sz)=>{ const o=new THREE.Mesh(geom,m); o.scale.set(sx,sy===undefined?sx:sy,sz===undefined?sx:sz); return o; };
  const accent=R.K.light||0x66ccff, MD=caveMethodDef;
  const label=(txt,col)=>{ const c=document.createElement('canvas'); c.width=256; c.height=64; const x=c.getContext('2d'); x.font='bold 30px sans-serif'; x.textAlign='center'; x.fillStyle='rgba(0,0,0,.55)'; x.fillRect(0,8,256,48); x.fillStyle=col; x.fillText(txt,128,43);
    const tex=new THREE.CanvasTexture(c); MP.texs.push(tex); const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}); MP.mats.push(m); const s=new THREE.Sprite(m); s.scale.set(2.4,0.6,1); return s; };
  // ---- A: the mural and its five pieces ----
  { const w=A.A.wall, [x,z]=out(w,0.14), cv=document.createElement('canvas'); cv.width=256; cv.height=176; const tex=new THREE.CanvasTexture(cv); MP.texs.push(tex);
    const pm=mat(0xffffff,{map:tex}), panel=mk(new THREE.PlaneGeometry(2.8,1.9),pm,1,1,1); MP.geos.push(panel.geometry); put(panel,x,z,1.5).rotation.y=Math.atan2(w.nx||0,w.nz||1);
    MP.mural={tex,cv,last:-1};
    const pieces=A.A.pieces.map((q,i)=>{ const o=mk(gOct,mat(0xffd27a),0.2,0.32,0.2); put(o,q.x,q.z,1.0); o.userData={i,x:R.ox+q.x,z:R.oz+q.z}; return o; });
    MP.upd.push((s,dt,tt)=>{
      const got=s?s.a:0; if(MP.mural.last!==got){ MP.mural.last=got; const c=cv.getContext('2d'); c.fillStyle='#2a2926'; c.fillRect(0,0,256,176); c.strokeStyle='#5a564c'; c.lineWidth=6; c.strokeRect(5,5,246,166);
        for(let i=0;i<5;i++){ const on=got>>i&1, a=i/5*Math.PI*2-Math.PI/2; c.strokeStyle=on?'#ffd27a':'#4a463c'; c.lineWidth=on?9:5; c.beginPath(); c.moveTo(128+Math.cos(a)*14,88+Math.sin(a)*14); c.lineTo(128+Math.cos(a)*66,88+Math.sin(a)*54); c.lineTo(128+Math.cos(a+0.9)*66,88+Math.sin(a+0.9)*54); c.stroke(); }
        c.fillStyle=got===31?'#ffd27a':'#4a463c'; c.beginPath(); c.arc(128,88,13,0,7); c.fill(); tex.needsUpdate=true; }
      for(const o of pieces){ const near=Math.hypot(P.x-o.userData.x,P.z-o.userData.z)<(MD('A').p.light), has=s&&(s.a>>o.userData.i&1); o.visible=near&&!has; o.rotation.y+=dt*2; } });
  }
  // ---- B: the geodes and the element each asks ----
  { const need=MD('B').p.need[R.n]||[], geodes=A.B.geodes.map((q,i)=>{
      const w=need[i], els=Array.isArray(w)?w:[w], col=parseInt(ELEMS[els[0]].col.slice(1),16), [x,z]=out(q,0.6);
      const o=mk(gIco,mat(col),0.85,0.85,0.85); put(o,x,z,1.0); const lb=label(els.map(e=>ELEMS[e].name).join(' then '),ELEMS[els[0]].col); put(lb,x,z,2.3);
      const core=mk(gOct,mat(0xffffff,{transparent:true,opacity:0.8}),0.35,0.35,0.35); put(core,x,z,1.0); return {o,lb,core,els}; });
    MP.upd.push((s,dt,tt)=>{ geodes.forEach((G,i)=>{ const st=s?s.b[i]:0; G.o.scale.setScalar(st===1?0.55:0.85+(st===2?0.08*Math.sin(tt*9):0)); G.o.material.opacity=1; G.core.visible=st!==0; G.core.scale.setScalar(st===1?0.5:0.3+0.05*Math.sin(tt*9));
      G.lb.visible=st!==1; G.o.rotation.y+=dt*0.4; }); }); }
  // ---- C: the echo plinth ----
  { const pl=A.C.plinth, r=Math.min(pl.r||4,4), disc=mk(gCyl,mat(0x44484c),r,0.12,r), ring=mk(gRing,mat(accent,{transparent:true,opacity:0.8}),r,1,r), pil=mk(gCyl,mat(0x6a6f74),0.45,1.1,0.45), top=mk(gOct,mat(accent),0.3,0.45,0.3);
    put(disc,pl.x,pl.z,0.04); put(ring,pl.x,pl.z,0.14); put(pil,pl.x,pl.z,0.6); put(top,pl.x,pl.z,1.5);
    MP.upd.push((s,dt,tt)=>{ const on=s&&s.c.s; ring.material.opacity=on?0.6+0.4*Math.sin(tt*6):0.35; ring.scale.set(r*(on?1+0.03*Math.sin(tt*6):1),1,r*(on?1+0.03*Math.sin(tt*6):1)); top.rotation.y+=dt*(on?5:1); top.position.y=wy(pl.x,pl.z)+1.5+0.1*Math.sin(tt*2); }); }
  // ---- D: the glow crystal, the altar, and the crystal you carry ----
  { const c=A.D.crystal, a=A.D.altar, cr=mk(gOct,mat(0x7fe8ff),0.4,0.85,0.4), ped=mk(gCyl,mat(0x5a5e62),0.5,0.9,0.5), bowl=mk(gCyl,mat(0x7a7e82),0.8,0.18,0.8), flame=mk(gOct,mat(0xffe9a8,{transparent:true,opacity:0.0}),0.22,0.4,0.22);
    put(cr,c.x,c.z,0.9); put(ped,a.x,a.z,0.45); put(bowl,a.x,a.z,0.95); put(flame,a.x,a.z,1.3);
    const car=mk(gOct,mat(0x7fe8ff,{transparent:true,opacity:1}),0.3,0.6,0.3); car.visible=false; g.add(car); MP.carry=car;
    MP.upd.push((s,dt,tt)=>{ const has=s&&s.d.s; cr.visible=!has; cr.rotation.y+=dt; cr.position.y=wy(c.x,c.z)+0.9+0.08*Math.sin(tt*2);
      car.visible=!!has; if(has){ const N=MD('D').p.hits, k=1-s.d.h/N; car.position.set(P.x,P.y+2.3+0.1*Math.sin(tt*3),P.z); car.rotation.y+=dt*2; car.scale.set(0.3*k+0.08,0.6*k+0.16,0.3*k+0.08); car.material.opacity=0.35+0.65*k; }
      flame.material.opacity=has?0.0:0.5+0.2*Math.sin(tt*5); }); }
  // ---- E: the sleeping guardian, the shrine, the doorposts ----
  { const E=A.E, gd=E.guard, body=mk(gSph,mat(0x2a2c30),2.0,1.05,1.5), hl=mk(gCone,mat(0x4a4c50),0.3,1.1,0.3), hr=mk(gCone,mat(0x4a4c50),0.3,1.1,0.3), el=mk(gSph,mat(0xff4a3a),0.16), er=mk(gSph,mat(0xff4a3a),0.16);
    put(body,gd.x,gd.z,0.85); put(hl,gd.x-0.8,gd.z,1.9).rotation.z=0.4; put(hr,gd.x+0.8,gd.z,1.9).rotation.z=-0.4; put(el,gd.x-0.5,gd.z+1.15,1.15); put(er,gd.x+0.5,gd.z+1.15,1.15);
    const sh=E.shrine, stele=mk(gBox,mat(0x8a8f94),0.5,1.8,0.3), gem=mk(gOct,mat(accent),0.22,0.32,0.22); put(stele,sh.x,sh.z,0.9); put(gem,sh.x,sh.z,2.1);
    const en=E.entry; for(const k of [-1,1]){ const post=mk(gCyl,mat(0x707478),0.14,1.4,0.14); put(post,en.x+k*1.4,en.z,0.7); }
    MP.upd.push((s,dt,tt)=>{ const z=s?s.e.z/100:0, open=s&&s.e.s?Math.min(1,0.15+z):0.02; el.scale.setScalar(0.02+0.17*open); er.scale.setScalar(0.02+0.17*open); body.scale.set(2.0,1.05+0.03*Math.sin(tt*1.5)*(1+z*4),1.5); gem.rotation.y+=dt*2; }); }
  // ---- F: the boulders that shut the vault (hidden while it is open) and its chest ----
  { const sl=A.F.seal, v=A.F.vault, rocks=[]; for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, o=mk(gDod,mat(i%2?0x6d6a62:0x5a5850),1.0+0.15*(i%3),0.95,1.0); put(o,sl.x+Math.cos(a)*0.9,sl.z+Math.sin(a)*0.9,0.7+(i%2)*0.5); rocks.push(o); }
    const chest=mk(gBox,mat(0x9a7a3a),0.9,0.5,0.6), lid=mk(gBox,mat(0xffd27a),0.95,0.14,0.65); put(chest,v.x,v.z,0.28); put(lid,v.x,v.z,0.6);
    MP.upd.push((s,dt,tt)=>{ const open=s&&s.fv.o>0; for(const r of rocks) r.visible=!open; lid.material.color.setHex(open?0xffe9a8:0xffd27a); lid.position.y=wy(v.x,v.z)+0.6+(open?0.08*Math.sin(tt*4):0); }); }
  // ---- G: the mole's holes and burrows ----
  for(const q of A.G.holes){ const [x,z]=out(q,0.9); put(mk(gCirc,mat(0x050403),0.6,1,0.6),x,z,0.03); }
  for(const q of A.G.burrows){ put(mk(gCone,mat(0x6a5a4a),0.9,0.45,0.9),q.x,q.z,0.2); put(mk(gCirc,mat(0x050403),0.35,1,0.35),q.x,q.z,0.45); }
  // ---- H: veins, herbs, the anvil ----
  { const H=MD('H').p, oc=RES[H.ore_kind[R.n]]?parseInt(RES[H.ore_kind[R.n]].col.slice(1),16):accent, hc=RES[H.herb_kind[R.n]]?parseInt(RES[H.herb_kind[R.n]].col.slice(1),16):0x7ab86a;
    const veins=A.H.veins.map((q,i)=>{ const gr=new THREE.Group(), [x,z]=out(q,0.5); for(let k=0;k<3;k++){ const c=mk(gOct,mat(oc),0.16+0.05*k,0.45+0.15*k,0.16+0.05*k); c.position.set((k-1)*0.28,0.4+0.1*k,0); c.rotation.z=(k-1)*0.35; gr.add(c); }
      put(gr,x,z,0); return gr; });
    const herbs=A.H.herbs.map((q,i)=>{ const gr=new THREE.Group(); for(let k=0;k<4;k++){ const b=mk(gCone,mat(hc),0.07,0.55+0.1*k,0.07); b.position.set((k-1.5)*0.14,0.28,0.03*k); b.rotation.z=(k-1.5)*0.2; gr.add(b); } put(gr,q.x,q.z,0); return gr; });
    const an=A.H.anvil, base=mk(gBox,mat(0x55595c),0.9,0.5,0.6), top=mk(gBox,mat(0x7a7e82),1.2,0.2,0.7); put(base,an.x,an.z,0.25); put(top,an.x,an.z,0.6);
    MP.upd.push((s)=>{ veins.forEach((v,i)=>{ v.visible=!(s&&s.h.vm>>i&1); }); herbs.forEach((v,i)=>{ v.visible=!(s&&s.h.hm>>i&1); }); }); }
}
function caveMPropsFrame(dt,s){
  const MP=CAVE_MP; if(!MP.g) return; const tt=performance.now()/1000;
  for(const f of MP.upd) try{ f(s,dt,tt); }catch(err){ console.error('cave props:',err); MP.upd.length=0; break; }
}
function caveMPropsClear(){
  const MP=CAVE_MP; if(MP.g){ scene.remove(MP.g); }
  for(const o of MP.geos) o.dispose(); for(const o of MP.mats) o.dispose(); for(const o of MP.texs) o.dispose();
  MP.g=null; MP.geos=[]; MP.mats=[]; MP.texs=[]; MP.upd=[]; MP.carry=null; MP.R=null; MP.mural=null;
}
