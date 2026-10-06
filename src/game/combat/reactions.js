//@ Reactions on the client: the aura marker over a monster, the reaction's name popping up, the vulnerable / weakened notes
/* Agent map. Plan, rules and the table of hooks: docs/REACTIONS.md; the data (names, colours): shared/reactions.js and ELEMS (shared/elements.js).
   Server events: aura [monId, el|0, dur], react [monId, pairKey], st [monId, kind, v, dur, by] (applyEvent in net/client.js calls rxOn*).
   rxViewUpdate runs from updateMonsters (combat/monsters.js) and rxViewDrop from removeMonView. Test: client-smoke (the page builds and runs) and tools/reactions-smoke.js.
   The marker is a small spinning gem in the element's colour, floating over the head: one shared geometry, one plain material for each element, no instancing. */
const RXV={marks:new Map(), geo:null, mats:{}};   // monster id -> {mesh, el, until}
function rxViewMat(el){ return RXV.mats[el]||(RXV.mats[el]=new THREE.MeshBasicMaterial({color:new THREE.Color(ELEMS[el].col),transparent:true,opacity:0.92,depthWrite:false})); }
function rxViewDrop(id){ const a=RXV.marks.get(id); if(a){ scene.remove(a.mesh); RXV.marks.delete(id); } }
function rxOnAura(id,el,dur){
  if(!el){ rxViewDrop(id); return; }
  const m=MON_BY_ID.get(id); if(!m||!ELEMS[el]||el==='basic') return;
  let a=RXV.marks.get(id);
  if(!a){ const mesh=new THREE.Mesh(RXV.geo||(RXV.geo=new THREE.OctahedronGeometry(0.17)),rxViewMat(el)); mesh.visible=false; scene.add(mesh); a={mesh,el,until:0}; RXV.marks.set(id,a); }
  else if(a.el!==el){ a.el=el; a.mesh.material=rxViewMat(el); }
  a.until=performance.now()/1000+dur;
}
function rxOnReact(id,key){
  const m=MON_BY_ID.get(id); if(!m) return;
  const r=RX_CHART[key], c=monCenter(m);
  popText(c.x,c.y+m.T.height*0.5*m.s+0.3,c.z,(r?r.name:'Reaction')+'!','react');
}
const RXV_NOTE={vuln:'Vulnerable',weak:'Weakened'};
function rxOnStatus(id,kind,v,dur,by){
  const m=MON_BY_ID.get(id); if(!m||!RXV_NOTE[kind]) return;
  const c=monCenter(m);
  popText(c.x,c.y+m.T.height*0.5*m.s+0.1,c.z,RXV_NOTE[kind]+' '+(kind==='vuln'?'+':'-')+Math.round(v*100)+'%','rxst');
}
function rxViewUpdate(dt){
  if(!RXV.marks.size) return;
  const now=performance.now()/1000;
  for(const [id,a] of RXV.marks){
    const m=MON_BY_ID.get(id);
    if(!m||m.dead||a.until<now){ scene.remove(a.mesh); RXV.marks.delete(id); continue; }
    a.mesh.visible=m.g.visible;
    a.mesh.position.set(m.x,m.y+m.T.height*m.s+0.55+Math.sin(now*3+id)*0.06,m.z); a.mesh.rotation.y+=dt*2.2;
  }
}
