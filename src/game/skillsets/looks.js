//@ Skill-set looks on the client: every signature skill is drawn in the colours and motifs of its outfit (particles, ground patterns, projectiles, auras), through hooks in skill-fx.js, attacks.js and net/client.js
/* Agent map. Docs: docs/skillkits/VISUALS.md. The server sends the PIECE an effect comes from as the last argument of its events (a skill id such as tansy_2_any, or the id of a passive / bonus row such as tansy_b5):
   area [.., flags, piece], proj [.., tg, piece], chain [pts, el, piece], beam [.., w, piece], ast [pid, kind, v, dur, piece], fxa [pid, 'heal'|'shield', piece]; a swing needs none (the skill row is known: s.set).
   A LOOK is data plus a few optional functions, one file per set (look-<id>.js, ssDefineLook(id, spec)):
     mote:[{sh:shape, c:colour (an index into cols or a hex number), s:size in metres, w:weight, add:1 for glowing, g:gravity, sway, spin}], cols:[..] (default: the set's pal main, accent, glow), decal:'wheat'|'rivets'|'cords'|'dial'|'lens'|'waves'|'flames'|'scallop',
     arcCol (the colour of a swing's arc), zone:{mode:'rise'|'fall'|'in'|'out'|'orbit', rate} (default by the skill's own kb), proj:{sh, c, s, len, glow, trail}, and any of the overrides
     swing(c) cone(c) ring(c) dash(c) muzzle(c) util(c) impact(L,pos,p,hit) fxa(L,o,kind,src) ally(L,o,kind,dur) zoneStart(L,A) zoneTick(L,A,dt,k) zoneEnd(L,A); c = {L,s,f,x,y,z,face,sc,mine,gy,fx,fz,hx,hy,hz}.
   Particles share geometries and materials (they fade by shrinking, never by opacity), at most SSL_MAX alive. Hooks: ssLookFor, ssLookSwing, ssLookArea / ssLookZoneTick / ssLookAreaEnd, ssLookProj / ssLookTrail / ssLookImpact,
   ssLookLine, ssOnFxa, ssLookAlly, ssLookUpdate (from updateSkillFx). Test: client-smoke (every look draws every skill of its set without errors). */
const SSL={ub:false, looks:Object.create(null), bad:[], parts:[], decals:[], geo:Object.create(null), mats:new Map(), tex:Object.create(null), auras:new Map(), flat:null};
const SSL_MAX=LOW?150:380, SSL_Q=LOW?0.5:1;
const sslR=(a,b)=>a+Math.random()*(b-a), sslN=n=>Math.max(1,Math.round(n*SSL_Q*(SSL.ub?1.3:1)));   // ult: a boosted cast draws a third more motes
const ssUbOwn=id=>!!id&&typeof ULT_UI!=='undefined'&&ULT_UI.boost[id]>performance.now();   // ult: is this piece of yours boosted by a burst right now
function sslFan(pts,hub){   // a flat shape in the XY plane (its length along Y): triangles from a hub inside it to each edge
  hub=hub||[0,0]; const v=[]; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; v.push(hub[0],hub[1],0,a[0],a[1],0,b[0],b[1],0); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); return g;
}
const sslStar=(n,r0,r1)=>sslFan(Array.from({length:n*2},(_,i)=>{ const a=i/(n*2)*TAU, r=i%2?r0:r1; return [Math.sin(a)*r,Math.cos(a)*r]; }));
function sslRibbonGeo(){   // a long wavy strip (length along Y, 1 m)
  const v=[], N=8; for(let i=0;i<N;i++){ const y0=i/N-0.5, y1=(i+1)/N-0.5, x0=Math.sin(i*1.2)*0.09, x1=Math.sin((i+1)*1.2)*0.09, w=0.05;
    v.push(x0-w,y0,0,x0+w,y0,0,x1+w,y1,0, x0-w,y0,0,x1+w,y1,0,x1-w,y1,0); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); return g;
}
// the particle shapes (about 1 m across at scale 1; a particle's size s is in metres): flat ones tumble, solid ones are small low-poly bodies
const SSL_SHAPES={   // (streak lies along Z, so a particle with face:true flies point first)
  ear:()=>sslFan([[0,-.5],[.16,-.25],[.14,.2],[0,.5],[-.14,.2],[-.16,-.25]]), chaff:()=>sslFan([[0,-.5],[.3,0],[0,.5],[-.3,0]]),
  feather:()=>sslFan([[0,-.5],[.14,-.3],[.2,.05],[.1,.38],[0,.5],[-.1,.38],[-.18,.05],[-.14,-.3]]), reed:()=>sslFan([[0,-.5],[.06,-.15],[.05,.25],[0,.5],[-.05,.25],[-.06,-.15]]),
  wisp:()=>sslFan([[0,-.5],[.2,-.15],[.12,.2],[0,.5],[-.12,.2],[-.2,-.15]]), ray:()=>sslFan([[-.04,-.5],[.04,-.5],[0,.5]]), streak:()=>sslFan([[-.05,-.5],[.05,-.5],[0,.5]]).rotateX(Math.PI/2), spark:()=>sslStar(4,.1,.55), glint:()=>sslStar(6,.12,.5),
  flame:()=>sslFan([[-.3,-.5],[-.36,.1],[-.18,.5],[-.08,.05],[0,.8],[.08,.05],[.18,.5],[.36,.1],[.3,-.5]],[0,-.2]), pennant:()=>sslFan([[0,.28],[.5,.28],[.32,0],[.5,-.28],[0,-.28]],[.15,0]),
  tag:()=>sslFan([[-.3,-.2],[.3,-.2],[.3,.2],[-.3,.2]]), ribbon:sslRibbonGeo, disc:()=>new THREE.CircleGeometry(.5,18),
  pebble:()=>new THREE.IcosahedronGeometry(.5,0), shard:()=>new THREE.OctahedronGeometry(.5,0).scale(.55,1.5,.55), ember:()=>new THREE.TetrahedronGeometry(.5,0), bubble:()=>new THREE.SphereGeometry(.5,8,6),
  drop:()=>new THREE.LatheGeometry([[0,-.5],[.3,-.35],[.38,-.1],[.3,.15],[.14,.4],[0,.6]].map(q=>new THREE.Vector2(q[0],q[1])),8), slab:()=>new THREE.BoxGeometry(.7,1,.22), bone:()=>new THREE.TorusGeometry(.4,.11,5,10),
  lens:()=>new THREE.TorusGeometry(.45,.04,4,18), lantern:()=>new THREE.CylinderGeometry(.34,.34,.62,8), tick:()=>new THREE.BoxGeometry(.06,.6,.06), cord:()=>new THREE.CylinderGeometry(.03,.03,1,4)
};
const SSL_Z={streak:1};   // shapes whose length already lies along Z
const ssGeo=name=>SSL.geo[name]||(SSL.geo[name]=(SSL_SHAPES[name]||SSL_SHAPES.chaff)());
function sslMat(col,op,add){
  const k=col+'|'+op+'|'+(add?1:0); let m=SSL.mats.get(k);
  if(!m){ m=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}); SSL.mats.set(k,m); }
  return m;
}
const sslOwn=(col,op,add)=>new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:add?THREE.AdditiveBlending:THREE.NormalBlending});   // a material of its own, for a mesh that is disposed with its zone
// ---- registry ----
function ssDefineLook(id,spec){
  const S=SS_SETS[id], bad=why=>{ SSL.bad.push({id,why}); if(typeof console!=='undefined') console.warn('skill-set look '+id+' left out: '+why); return null; };
  if(!S) return bad('no such set');
  if(SSL.looks[id]) return bad('defined twice');
  if(!spec||!Array.isArray(spec.mote)||!spec.mote.length) return bad('mote is a list of {sh, c, s, w}');
  for(const m of spec.mote) if(!SSL_SHAPES[m.sh]) return bad('unknown shape "'+m.sh+'" (known: '+Object.keys(SSL_SHAPES).join(' ')+')');
  if(spec.proj&&spec.proj.sh&&!SSL_SHAPES[spec.proj.sh]) return bad('unknown projectile shape "'+spec.proj.sh+'"');
  const L=Object.assign({id,cols:[S.pal.main,S.pal.accent,S.pal.glow],hot:S.pal.glow,hot2:S.pal.accent,pal:S.pal,decal:'dial',zone:{}},spec); L.tw=spec.mote.reduce((a,m)=>a+(m.w||1),0);
  return (SSL.looks[id]=L);
}
function ssLookFor(src){ return typeof src==='string'&&src?SSL.looks[src.split('_')[0]]||null:null; }
const sslCol=(L,c)=>typeof c==='number'&&c<L.cols.length&&c<8?L.cols[c]:c;
// ---- particles ----
function ssPart(shape,col,x,y,z,o){   // o: v [vx,vy,vz], g (an acceleration along y: negative falls), drag, life, s (or s0 -> s1), spin, add, op, sway, face (look along the velocity), floor (stop on the ground), rot [x,y,z,order] (the starting rotation), fin / fout (the shares of life spent growing / shrinking)
  if(SSL.parts.length>=SSL_MAX) return null;
  if(SSL.ub){ o=Object.assign({},o,{add:1}); if(o.s!==undefined) o.s*=1.25; if(o.s0!==undefined) o.s0*=1.25; if(o.s1!==undefined) o.s1*=1.25; }   // ult: a boosted cast glows and its motes are bigger
  const m=new THREE.Mesh(ssGeo(shape),sslMat(col,o.op===undefined?0.95:o.op,!!o.add)); m.position.set(x,y,z); m.rotation.set(Math.random()*TAU,Math.random()*TAU,Math.random()*TAU); if(o.rot){ m.rotation.order=o.rot[3]||'XYZ'; m.rotation.set(o.rot[0],o.rot[1],o.rot[2]); }
  m.scale.setScalar(0.01); scene.add(m);
  const v=o.v||[0,0,0], life=o.life||0.8;
  const P_={m,vx:v[0],vy:v[1],vz:v[2],g:o.g||0,drag:o.drag||0,life,max:life,s0:o.s0!==undefined?o.s0:(o.s||0.25),s1:o.s1!==undefined?o.s1:(o.s||0.25),spin:o.spin===undefined?3:o.spin,sway:o.sway||0,ph:Math.random()*TAU,face:!!o.face,floor:!!o.floor,fin:o.fin===undefined?0.12:o.fin,fout:o.fout===undefined?0.35:o.fout};
  SSL.parts.push(P_); return P_;
}
function sslPick(L){ let r=Math.random()*L.tw; for(const m of L.mote){ r-=m.w||1; if(r<=0) return m; } return L.mote[0]; }
// one mote of the look: its shape, colour, size, gravity and sway, with o over them
function ssEmit(L,x,y,z,o){
  const m=sslPick(L); o=o||{};
  return ssPart(o.sh||m.sh,sslCol(L,o.c!==undefined?o.c:m.c),x,y,z,Object.assign({s:(o.k||1)*(m.s||0.25)*sslR(0.8,1.25),g:m.g,sway:m.sway,spin:m.spin,add:m.add,op:m.op,face:m.face},o));
}
function sslBurst(L,x,y,z,n,spd,o){   // a ball of motes flying out (spd in m/s)
  for(let i=0;i<sslN(n);i++){ const a=sslR(0,TAU), e=sslR(-0.25,1), c=Math.cos(e), k=spd*sslR(0.4,1);
    ssEmit(L,x,y,z,Object.assign({v:[Math.sin(a)*c*k,Math.sin(e)*k+spd*0.2,Math.cos(a)*c*k],life:sslR(0.4,0.85),drag:1.2},o)); }
}
function sslSector(L,x,y,z,face,arc,r,n,o){   // motes flung along a cone: arc is the half-angle, r the reach
  for(let i=0;i<sslN(n);i++){ const a=face+sslR(-arc,arc), dx=-Math.sin(a), dz=-Math.cos(a), d=sslR(0.25,1)*r, k=r*sslR(1.4,2.4);
    ssEmit(L,x+dx*d*0.4,y+sslR(-0.15,0.5),z+dz*d*0.4,Object.assign({v:[dx*k,sslR(0.2,1.6),dz*k],life:sslR(0.3,0.6),drag:2.5},o)); }
}
function sslRingMotes(L,x,z,r,n,o,inward){   // motes on a circle on the ground, moving out (or in)
  for(let i=0;i<sslN(n);i++){ const a=sslR(0,TAU), sx=Math.sin(a), sz=Math.cos(a), d=inward?r:r*sslR(0.2,0.7), k=(inward?-1:1)*r*sslR(0.9,1.8), px=x+sx*d, pz=z+sz*d;
    ssEmit(L,px,getH(px,pz)+0.2,pz,Object.assign({v:[sx*k,sslR(0.6,2.4),sz*k],life:sslR(0.4,0.8),drag:2},o)); }
}
function sslLine(L,x1,y1,z1,x2,y2,z2,n,o){   // motes spread along a segment (a dash, a beam, a chain)
  for(let i=0;i<sslN(n);i++){ const f=Math.random();
    ssEmit(L,x1+(x2-x1)*f+sslR(-0.2,0.2),y1+(y2-y1)*f+sslR(-0.2,0.2),z1+(z2-z1)*f+sslR(-0.2,0.2),Object.assign({v:[sslR(-0.6,0.6),sslR(0,1.4),sslR(-0.6,0.6)],life:sslR(0.3,0.7)},o)); }
}
// ---- ground patterns ----
function sslCtx(){ const c=document.createElement('canvas'); c.width=c.height=256; return {c,g:c.getContext('2d')}; }
function sslArc(g,r,col,lw){ g.strokeStyle=col; g.lineWidth=lw; g.beginPath(); g.arc(128,128,r,0,TAU); g.stroke(); }
function sslAround(g,n,fn){ for(let i=0;i<n;i++){ g.save(); g.translate(128,128); g.rotate(i/n*TAU); fn(i); g.restore(); } }
const SSL_DECALS={   // each draws a ring pattern on a 256 px canvas (the ring at about 100 to 124 px from the middle): the outfit's trim laid on the ground
  wheat:(g,C)=>{ sslArc(g,118,C[0],5); sslArc(g,96,C[1],3); sslAround(g,16,i=>{ g.fillStyle=i%2?C[0]:C[3]; g.beginPath(); g.ellipse(0,-107,5,13,0,0,TAU); g.fill(); g.strokeStyle=C[2]; g.lineWidth=2; g.beginPath(); g.moveTo(0,-94); g.lineTo(0,-84); g.stroke(); }); sslAround(g,4,()=>{ g.fillStyle=C[1]; g.fillRect(-3,-125,6,12); }); },
  rivets:(g,C)=>{ sslArc(g,108,C[0],14); sslArc(g,92,C[2],3); sslArc(g,122,C[2],3); sslAround(g,16,()=>{ g.fillStyle=C[1]; g.beginPath(); g.arc(0,-108,4.5,0,TAU); g.fill(); }); sslAround(g,4,()=>{ g.fillStyle=C[1]; g.fillRect(-11,-118,22,20); g.fillStyle=C[0]; g.fillRect(-5,-113,10,10); }); },
  cords:(g,C)=>{ sslArc(g,118,C[0],4); sslArc(g,92,C[0],3); g.strokeStyle=C[1]; g.lineWidth=3; g.beginPath(); for(let i=0;i<=120;i++){ const a=i/120*TAU, r=105+9*Math.sin(a*12); i?g.lineTo(128+Math.sin(a)*r,128-Math.cos(a)*r):g.moveTo(128+Math.sin(a)*r,128-Math.cos(a)*r); } g.closePath(); g.stroke(); sslAround(g,12,i=>{ g.fillStyle=C[1]; g.beginPath(); g.arc(0,-114,3,0,TAU); g.fill(); }); sslAround(g,3,i=>{ g.fillStyle=C[2]; g.fillRect(-1.5,-86,3,10); g.fillRect(8,-86,3,10); }); },
  dial:(g,C)=>{ sslArc(g,118,C[0],6); sslArc(g,88,C[1],3); sslAround(g,60,i=>{ g.fillStyle=i%5?C[0]:C[2]; g.fillRect(-1.5,-117,3,i%5?8:16); }); sslAround(g,12,()=>{ g.fillStyle=C[1]; g.fillRect(-3,-86,6,5); }); g.strokeStyle=C[2]; g.lineWidth=3; g.beginPath(); g.moveTo(128,128); g.lineTo(128,40); g.stroke(); g.fillStyle=C[2]; g.beginPath(); g.arc(128,128,6,0,TAU); g.fill(); },
  lens:(g,C)=>{ sslArc(g,118,C[0],4); sslArc(g,56,C[0],2); g.setLineDash&&g.setLineDash([6,6]); sslArc(g,84,C[2],2); g.setLineDash&&g.setLineDash([]); sslAround(g,4,()=>{ g.fillStyle=C[0]; g.fillRect(-1.5,-124,3,40); g.fillStyle=C[1]; g.fillRect(-1.5,-48,3,18); }); sslAround(g,24,i=>{ g.strokeStyle=C[1]; g.lineWidth=2; g.beginPath(); g.moveTo(0,-118); g.lineTo(4,-106); g.stroke(); }); },
  waves:(g,C)=>{ for(const [r0,col,ph] of [[108,C[0],0],[92,C[2],Math.PI]]){ g.strokeStyle=col; g.lineWidth=4; g.beginPath(); for(let i=0;i<=160;i++){ const a=i/160*TAU, r=r0+5*Math.sin(a*14+ph); i?g.lineTo(128+Math.sin(a)*r,128-Math.cos(a)*r):g.moveTo(128+Math.sin(a)*r,128-Math.cos(a)*r); } g.closePath(); g.stroke(); }
            sslAround(g,4,()=>{ g.fillStyle=C[1]; g.beginPath(); g.moveTo(0,-122); g.lineTo(-11,-100); g.quadraticCurveTo(0,-94,11,-100); g.closePath(); g.fill(); }); },
  flames:(g,C)=>{ sslArc(g,104,C[1],4); sslArc(g,90,C[0],2); sslAround(g,12,i=>{ for(const [dx,h,col] of [[-7,16,C[0]],[0,24,C[1]],[7,16,C[0]]]){ g.fillStyle=col; g.beginPath(); g.moveTo(dx-5,-106); g.lineTo(dx,-106-h); g.lineTo(dx+5,-106); g.closePath(); g.fill(); } }); sslAround(g,6,()=>{ g.fillStyle=C[2]; g.beginPath(); g.arc(0,-80,3,0,TAU); g.fill(); }); },
  scallop:(g,C)=>{ sslArc(g,104,C[0],5); sslArc(g,88,C[3],2); sslAround(g,16,i=>{ g.fillStyle=C[0]; g.beginPath(); g.arc(0,-112,10,Math.PI,TAU); g.fill(); g.fillStyle=C[1]; g.beginPath(); g.arc(0,-116,3,0,TAU); g.fill(); }); sslAround(g,8,i=>{ g.fillStyle=C[2]; g.beginPath(); g.moveTo(0,-86); g.lineTo(3,-80); g.lineTo(0,-74); g.lineTo(-3,-80); g.closePath(); g.fill(); }); }
};
function sslDecalTex(L){
  if(SSL.tex[L.id]) return SSL.tex[L.id];
  const {c,g}=sslCtx(), C=[L.cols[0],L.cols[1],L.cols[2],L.cols[3]!==undefined?L.cols[3]:0xfff2d6].map(h=>'#'+('000000'+h.toString(16)).slice(-6));
  try{ (SSL_DECALS[L.decal]||SSL_DECALS.dial)(g,C); }catch(_){}
  const t=new THREE.CanvasTexture(c); return (SSL.tex[L.id]=t);
}
function sslDecal(L,x,z,r,o){   // a patterned mark on the ground; o: life (it fades and, by default, grows), r0 (starting radius share), spin, op, follow (a function giving {x,z})
  o=o||{}; if(!SSL.flat) SSL.flat=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);
  const mat=new THREE.MeshBasicMaterial({map:sslDecalTex(L),transparent:true,opacity:o.op===undefined?0.85:o.op,depthWrite:false,side:THREE.DoubleSide}), m=new THREE.Mesh(SSL.flat,mat);
  m.position.set(x,getH(x,z)+0.1,z); m.scale.setScalar(Math.max(0.1,r*(o.r0===undefined?0.3:o.r0))); scene.add(m);
  const D={m,life:o.life||0.6,max:o.life||0.6,r:r,r0:o.r0===undefined?0.3:o.r0,spin:o.spin===undefined?0:o.spin,op:o.op===undefined?0.85:o.op,follow:o.follow||null,keep:!!o.keep,inward:!!o.inward};
  SSL.decals.push(D); return D;
}
// ---- shared extras the looks build on ----
function sslRays(L,x,y,z,face,arc,n,len,col,o){   // a fan of thin light spikes lying on the air, base at (x,z), tip outward (a lamp's beam, a banner's rays)
  for(let i=0;i<sslN(n);i++){ const a=face+(n>1?arc*(i/(n-1)*2-1):0), dx=-Math.sin(a), dz=-Math.cos(a);
    ssPart('ray',col,x+dx*len*0.5,y,z+dz*len*0.5,Object.assign({s:len*sslR(0.8,1),add:1,life:0.3,spin:0,op:0.6,fin:0.15,fout:0.6,rot:[Math.PI/2,a+Math.PI,0,'YXZ']},o)); }
}
function sslShaft(L,x,z,h,col,o){   // a column of light standing on the ground: three crossed thin planes
  const gy=getH(x,z);
  for(let i=0;i<3;i++) ssPart('ray',col,x,gy+h*0.5,z,Object.assign({s:h,add:1,life:0.9,spin:0,op:0.3,fin:0.2,fout:0.6,rot:[0,i/3*Math.PI,0]},o));
}
function sslSlabs(L,x,z,r,n,col,o){   // slabs of stone (or shields, or boards) thrown up in a ring that fall back
  for(let i=0;i<sslN(n);i++){ const a=i/sslN(n)*TAU+sslR(-0.1,0.1), px=x+Math.sin(a)*r, pz=z+Math.cos(a)*r;
    ssPart('slab',col,px,getH(px,pz)-0.4,pz,Object.assign({v:[0,sslR(4.5,6),0],g:-15,life:0.8,s:sslR(0.9,1.3),spin:0,fin:0.05,fout:0.25,rot:[0,a,0]},o)); }
}
function sslFlash(L,x,y,z,face,dist,size,col,rimCol){   // a round board held up in front of you for an instant (a shield, a sign)
  if(!SSL.geo.flashRim){ SSL.geo.flashRim=new THREE.RingGeometry(0.42,0.5,20); SSL.geo.flashBoss=new THREE.CircleGeometry(0.1,10); }
  const m=new THREE.Mesh(ssGeo('disc'),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));
  const rim=new THREE.Mesh(SSL.geo.flashRim,sslMat(rimCol,0.95,false)), boss=new THREE.Mesh(SSL.geo.flashBoss,sslMat(rimCol,0.95,false)); boss.position.z=0.02; m.add(rim,boss);
  m.position.set(x-Math.sin(face)*dist,y,z-Math.cos(face)*dist); m.rotation.y=face+Math.PI; m.scale.setScalar(size); scene.add(m);
  SSL.decals.push({m,life:0.32,max:0.32,r:size*2,r0:0.5,spin:0,op:0.9,follow:null,own:true});
}
// ---- the hooks ----
function ssLookSwing(L,s,x,y,z,face,sc,mine){   // a signature skill's swing: its arcs, rings and motes (the sounds stay with fxVisuals)
  const fx=-Math.sin(face), fz=-Math.cos(face), c={L,s,f:s.fx,x,y,z,face,sc,mine,gy:getH(x,z),fx,fz,hx:x+fx*0.6,hy:y+1.1*sc,hz:z+fz*0.6};
  if(L.swing){ L.swing(c); return; }
  const f=c.f;
  if(f.cone) (L.cone||sslCone)(c);
  if(f.ring) (L.ring||sslRing)(c);
  if(f.dash) (L.dash||sslDash)(c);
  if(f.proj||f.zone||f.beam||f.chain) (L.muzzle||sslMuzzle)(c);
  (L.util||sslUtil)(c);
}
function sslCone(c){
  const {L,f,x,y,z,face,sc}=c, C=f.cone, n=C.hits||1;
  for(let h=0;h<n;h++) spawnArcAt(x,y+(0.8+0.22*h)*sc,z,face+(h-(n-1)/2)*0.28,L.arcCol!==undefined?L.arcCol:L.hot,C.r/2.6);
  sslSector(L,x,y+0.4*sc,z,face,C.arc,C.r,8+C.r*3*n);
}
function sslRing(c){
  const {L,f,x,z}=c, R=f.ring, pull=R.kb<0;
  sslDecal(L,x,z,R.r,{life:0.6,spin:0.8,inward:pull});
  spawnRingAt(x,c.gy,z,R.r*0.8,L.hot,pull); spawnRingAt(x,c.gy,z,R.r*0.55,L.hot2,pull);
  sslRingMotes(L,x,z,R.r,R.r*3,null,pull);
}
function sslDash(c){
  const {L,x,z,fx,fz,hy}=c;
  sslLine(L,x-fx*6,hy,z-fz*6,x,hy,z,16); sslBurst(L,x,hy-0.3,z,10,3); spawnRingAt(x,c.gy,z,(c.f.ring?c.f.ring.r:3)*0.7,L.hot);
}
function sslMuzzle(c){ const {L,hx,hy,hz}=c; sslBurst(L,hx,hy,hz,6,2); spawnRingAt(hx,hy,hz,1.1,L.hot); }
function sslUtil(c){   // the utility keys of a signature skill: a taunt's shout, a buff's lift (a heal and a shield are drawn on each ally: ssOnFxa)
  const {L,f,x,z}=c;
  if(f.taunt){ spawnRingAt(x,c.gy,z,Math.min(f.taunt.r,10)*0.6,L.hot2); sslBurst(L,x,c.hy,z,6,3.5); }
}
// a zone (area event, kind 'zone') of a piece with a look: the ground pattern, the look's own motes and extras instead of the generic ones
function ssLookArea(A,src){
  A.ub=A.owner===NET.pid&&ssUbOwn(src); SSL.ub=A.ub; try{ sslAreaIn(A,src); } finally{ SSL.ub=false; }   // ult: a boosted zone starts and ticks stronger
}
function sslAreaIn(A,src){
  const L=ssLookFor(src); if(!L||A.kind!=='zone') return;
  A.look=L; A.skill=SKILLS[src]||null; A.zf=A.skill&&A.skill.fx&&A.skill.fx.zone||{};
  const D=sslDecal(L,A.x,A.z,A.r,{life:A.dur,op:0.8,r0:0.05,keep:true,spin:A.zf.kb<0?-0.6:0.5,follow:A.follow?(()=>A):null,inward:false}); D.zoneOf=A; A.deco=D;
  A.fill.material.color.setHex(L.hot); A.edge.material.color.setHex(L.hot2); A.fill.material.opacity=0.12;
  A.col=L.hot;
  if(L.zoneStart) L.zoneStart(L,A);
}
function ssLookZoneTick(A,dt,k){
  SSL.ub=!!A.ub; try{ sslZoneTickIn(A,dt,k); } finally{ SSL.ub=false; }
}
function sslZoneTickIn(A,dt,k){
  const L=A.look; if(!L) return;
  if(A.follow){ const o=A.owner===NET.pid?P:REMOTES.get(A.owner); if(o){ A.x=o.x; A.z=o.z; } }
  if(A.deco){ const m=A.deco.m; m.position.set(A.x,getH(A.x,A.z)+0.1,A.z); m.scale.setScalar(Math.max(0.1,A.r*Math.min(1,0.05+k*6))); }
  const mode=L.zone.mode||(A.zf.kb<0?'in':A.zf.kb>0?'out':'rise'), rate=(L.zone.rate||26)*dt*SSL_Q*Math.min(1.6,A.r/6); A.acc=(A.acc||0)+rate;
  while(A.acc>=1){ A.acc-=1;
    const a=sslR(0,TAU), sx=Math.sin(a), sz=Math.cos(a);
    if(mode==='in'){ const px=A.x+sx*A.r, pz=A.z+sz*A.r; ssEmit(L,px,getH(px,pz)+0.3,pz,{v:[-sx*A.r*0.9-sz*2,sslR(0.2,1.2),-sz*A.r*0.9+sx*2],life:0.9,drag:0.4}); }
    else if(mode==='out'){ const d=A.r*sslR(0.1,0.5), px=A.x+sx*d, pz=A.z+sz*d; ssEmit(L,px,getH(px,pz)+0.3,pz,{v:[sx*A.r*0.9+sz*2,sslR(0.3,1.8),sz*A.r*0.9-sx*2],life:0.8,drag:0.5}); }
    else if(mode==='fall'){ const d=Math.sqrt(Math.random())*A.r, px=A.x+sx*d, pz=A.z+sz*d; ssEmit(L,px,getH(px,pz)+sslR(4,7),pz,{v:[sslR(-0.4,0.4),-sslR(1.2,2.4),sslR(-0.4,0.4)],life:2.6,floor:true}); }
    else if(mode==='orbit'){ const px=A.x+sx*A.r*0.9, pz=A.z+sz*A.r*0.9; ssEmit(L,px,getH(px,pz)+sslR(0.3,1.6),pz,{v:[sz*2.4,sslR(0.4,1.2),-sx*2.4],life:1.1}); }
    else { const d=Math.sqrt(Math.random())*A.r, px=A.x+sx*d, pz=A.z+sz*d; ssEmit(L,px,getH(px,pz)+0.15,pz,{v:[sslR(-0.3,0.3),sslR(0.8,2.4),sslR(-0.3,0.3)],life:sslR(0.9,1.5)}); }
  }
  if(L.zoneTick) L.zoneTick(L,A,dt,k);
}
function ssLookAreaEnd(A){ const L=A.look; if(!L) return; if(A.deco){ A.deco.life=0; } if(L.zoneEnd) L.zoneEnd(L,A); }
// a projectile of a piece: its own body (a shape and a glow, along the flight), a trail, and what happens where it lands
function ssLookProj(L,kind,src){
  const spec=Object.assign({sh:'ear',c:0,s:0.5,len:1,glow:2},L.proj||{}), g=new THREE.Group();
  const body=new THREE.Mesh(ssGeo(spec.sh),sslMat(sslCol(L,spec.c),0.98,false)); if(!SSL_Z[spec.sh]) body.rotation.x=Math.PI/2; body.scale.set(spec.s*0.6,spec.s*spec.len,spec.s*0.6); g.add(body);
  const gl=new THREE.Mesh(coreGeo,sslMat(sslCol(L,spec.glow),0.6,true)); gl.scale.set(1.6,1.6,spec.len>1?spec.len*2.4:2.4); g.add(gl);
  g.scale.setScalar((L.proj&&L.proj.scale||1)*(ssUbOwn(src)?1.3:1)); if(ssUbOwn(src)) gl.scale.multiplyScalar(1.4); return g;   // ult: a boosted piece's shot is bigger and glows
}
function ssLookTrail(L,p,dt){
  p.tr=(p.tr||0)-dt; if(p.tr>0) return; p.tr=0.035;
  const T=L.proj&&L.proj.trail, o={v:[sslR(-0.5,0.5),sslR(-0.2,0.8),sslR(-0.5,0.5)],life:sslR(0.3,0.6)};
  if(T) ssPart(T.sh,sslCol(L,T.c),p.pos.x,p.pos.y,p.pos.z,Object.assign({s:T.s||0.18,add:T.add,g:T.g||0,sway:T.sway||0},o)); else ssEmit(L,p.pos.x,p.pos.y,p.pos.z,o);
}
function ssLookImpact(L,pos,p,hit){
  if(L.impact){ L.impact(L,pos,p,hit); return; }
  sslBurst(L,pos.x,pos.y,pos.z,12,3.2); sslDecal(L,pos.x,pos.z,2.2,{life:0.45,r0:0.4}); spawnRingAt(pos.x,pos.y,pos.z,1.6,L.hot);
}
function ssLookLine(L,pts){   // a chain (points [x,y,z]) or a beam (two points): motes along it
  for(let i=0;i<pts.length-1;i++) sslLine(L,pts[i][0],pts[i][1],pts[i][2],pts[i+1][0],pts[i+1][1],pts[i+1][2],10);
}
// a heal or a shield reached a player (event fxa), and a buff on a player (event ast)
const sslWho=pid=>pid===NET.pid?P:REMOTES.get(pid);
function ssOnFxa(pid,kind,src){
  SSL.ub=pid===NET.pid&&ssUbOwn(src); try{ sslFxaIn(pid,kind,src); } finally{ SSL.ub=false; }   // ult: a boosted passive's proc glows
}
function sslFxaIn(pid,kind,src){
  const L=ssLookFor(src), o=L&&sslWho(pid); if(!L||!o) return;
  if(L.fxa){ L.fxa(L,o,kind,src); return; }
  const y=o.y||getH(o.x,o.z);
  if(kind==='shield'){ sslDome(L,o.x,y,o.z,1.25,L.hot,1.0); }
  else { for(let i=0;i<sslN(9);i++) ssEmit(L,o.x+sslR(-0.5,0.5),y+sslR(0.1,0.8),o.z+sslR(-0.5,0.5),{v:[0,sslR(1,2.2),0],life:sslR(0.7,1.2)}); spawnRingAt(o.x,y+0.1,o.z,1.1,L.hot); }
}
function sslDome(L,x,y,z,r,col,life){   // a translucent bubble round a player that swells and fades
  const m=new THREE.Mesh(ssGeo('bubble'),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.34,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  m.position.set(x,y+0.9,z); m.scale.setScalar(r*2*0.5); scene.add(m); SSL.decals.push({m,life,max:life,r:r*2,r0:0.5,spin:0,op:0.34,follow:null,dome:true,own:true});
}
function ssLookAlly(pid,kind,src,dur){
  const L=ssLookFor(src), o=L&&sslWho(pid); if(!L||!o) return;
  const key=pid+'|'+L.id+'|'+kind, cur=SSL.auras.get(key), until=performance.now()+Math.min(dur,10)*1000;
  if(cur){ cur.until=until; return; }
  if(L.ally){ L.ally(L,o,kind,dur,src); }
  const D=sslDecal(L,o.x,o.z,1.3,{life:Math.min(dur,10),r0:1,op:0.7,keep:true,spin:1.2,follow:()=>sslWho(pid)});
  SSL.auras.set(key,{D,until,L,pid,t:0});
}
// a transformation: extra meshes worn by a player for dur seconds (a halo, wings), built by build() and moved by tick(group, seconds worn); client-only, nothing on the server reads it,
// and it follows the avatar's group (the hiker's, or a remote player's), so a rebuild of the character does not lose it
SSL.worn=new Map();
function sslWear(pid,key,dur,build,tick){
  const o=sslWho(pid), holder=pid===NET.pid?hiker.g:(o&&o.g); if(!o||!holder) return;
  const k=pid+'|'+key, until=performance.now()+Math.min(dur,45)*1000, cur=SSL.worn.get(k);
  if(cur){ cur.until=until; return; }
  const g=build(); holder.add(g); SSL.worn.set(k,{g,holder,until,tick,t0:performance.now()});
}
function sslWornUpdate(){
  const now=performance.now();
  for(const [k,w] of [...SSL.worn]){
    if(now>w.until||!w.holder.parent){ w.holder.remove(w.g); w.g.traverse(o=>{ if(o.material&&o.userData.own) o.material.dispose(); }); SSL.worn.delete(k); continue; }
    if(w.tick) w.tick(w.g,(now-w.t0)/1000);
  }
}
function ssLookUpdate(dt){
  sslWornUpdate();
  const parts=SSL.parts;
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i]; p.life-=dt; if(p.life<=0){ scene.remove(p.m); parts.splice(i,1); continue; }
    const k=1-p.life/p.max, m=p.m, d=Math.max(0,1-p.drag*dt);
    p.vx*=d; p.vz*=d; p.vy=p.vy*d+p.g*dt;
    m.position.x+=p.vx*dt+(p.sway?Math.sin(t*5+p.ph)*p.sway*dt:0); m.position.y+=p.vy*dt; m.position.z+=p.vz*dt+(p.sway?Math.cos(t*4+p.ph)*p.sway*dt:0);
    if(p.floor){ const gy=getH(m.position.x,m.position.z)+0.06; if(m.position.y<gy){ m.position.y=gy; p.vx=p.vy=p.vz=0; p.g=0; p.spin=0; } }
    if(p.face&&(p.vx||p.vz||p.vy)) m.lookAt(m.position.x+p.vx,m.position.y+p.vy,m.position.z+p.vz); else if(p.spin){ m.rotation.x+=p.spin*dt; m.rotation.y+=p.spin*0.7*dt; }
    const s=p.s0+(p.s1-p.s0)*k, fade=k<p.fin?k/p.fin:k>1-p.fout?(1-k)/p.fout:1;
    m.scale.setScalar(Math.max(0.005,s*fade));
  }
  const ds=SSL.decals;
  for(let i=ds.length-1;i>=0;i--){
    const D=ds[i]; D.life-=dt; const k=1-D.life/D.max, m=D.m;
    if(D.follow){ const o=D.follow(); if(o) m.position.set(o.x,(D.dome?(o.y||getH(o.x,o.z))+0.9:getH(o.x,o.z)+0.1),o.z); }
    if(D.zoneOf){ if(D.life<=0.001||!AREA_FX.has(D.zoneOf.id)) D.life=Math.min(D.life,0); }
    else m.scale.setScalar(Math.max(0.05,D.r*(D.inward?1-(1-D.r0)*Math.min(1,k*1.6):D.r0+(1-D.r0)*Math.min(1,k*1.6))));
    if(D.spin) m.rotation.y+=D.spin*dt;
    m.material.opacity=D.zoneOf?D.op*Math.min(1,k*10)*Math.min(1,(1-k)*6):D.keep?D.op*Math.min(1,(1-k)*5):D.op*(1-k)*(1-k*0.3);
    if(D.life<=0){ scene.remove(m); m.material.dispose(); ds.splice(i,1); }
  }
  for(const [key,A] of [...SSL.auras]){
    const o=sslWho(A.pid), now=performance.now();
    if(!o||now>A.until||!A.D||A.D.life<=0){ if(A.D) A.D.life=0; SSL.auras.delete(key); continue; }
    A.D.life=A.D.max; A.t-=dt;
    if(A.t<=0){ A.t=0.45; ssEmit(A.L,o.x+sslR(-0.4,0.4),(o.y||getH(o.x,o.z))+sslR(0.1,0.5),o.z+sslR(-0.4,0.4),{v:[0,sslR(0.8,1.8),0],life:1}); }
  }
}
