//@ Skill-set marks on the client: pips over a monster, in the colour of the kit (only yours are drawn: marks are personal)
/* Agent map. Plan: docs/SKILL-SETS.md 6.1, 6.7; the server side is server/skillsets.js (ssMarkS). Server event mk [monId, markId, n, dur, ownerId]: applyEvent (net/client.js) calls ssOnMark; n 0 = spent or gone.
   ssvUpdate runs from updateMonsters (combat/monsters.js) and ssvDrop from removeMonView. The pips are small plain meshes on a ring over the head (one shared geometry, a plain material for each colour). Test: client-smoke. */
const SSV={marks:new Map(), geo:null, mats:{}};   // monster id -> {markId: {n, until, pips:[mesh]}}
function ssvColor(markId){ for(const id of SS_ORDER){ const s=SS_SETS[id]; if(s.kit&&s.kit.mark===markId) return s.pal.accent; } return 0xffffff; }
function ssvMat(c){ return SSV.mats[c]||(SSV.mats[c]=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.95,depthWrite:false})); }
function ssvDrop(monId,markId){
  const e=SSV.marks.get(monId); if(!e) return;
  for(const k of markId===undefined?Object.keys(e):[markId]){ if(e[k]){ for(const m of e[k].pips) scene.remove(m); delete e[k]; } }
  if(!Object.keys(e).length) SSV.marks.delete(monId);
}
function ssOnMark(monId,markId,n,dur,by){
  if(by!==NET.pid||!MON_BY_ID.get(monId)) return;
  if(!n){ ssvDrop(monId,markId); return; }
  const e=SSV.marks.get(monId)||SSV.marks.set(monId,{}).get(monId), cur=e[markId]||(e[markId]={n:0,until:0,pips:[]});
  cur.n=n; cur.until=performance.now()/1000+dur;
  while(cur.pips.length<n){ const mesh=new THREE.Mesh(SSV.geo||(SSV.geo=new THREE.SphereGeometry(0.07,6,5)),ssvMat(ssvColor(markId))); mesh.visible=false; scene.add(mesh); cur.pips.push(mesh); }
  while(cur.pips.length>n) scene.remove(cur.pips.pop());
}
function ssvUpdate(dt){
  if(!SSV.marks.size) return;
  const now=performance.now()/1000;
  for(const [id,e] of [...SSV.marks]){
    const m=MON_BY_ID.get(id); if(!m||m.dead){ ssvDrop(id); continue; }
    let row=0;
    for(const k of Object.keys(e)){
      const c=e[k]; if(c.until<now){ ssvDrop(id,k); continue; }
      c.pips.forEach((mesh,i)=>{ const a=now*1.6+i/c.pips.length*Math.PI*2; mesh.visible=m.g.visible; mesh.position.set(m.x+Math.sin(a)*0.34,m.y+m.T.height*m.s+0.9+row*0.2,m.z+Math.cos(a)*0.34); });
      row++;
    }
    if(!Object.keys(e).length) SSV.marks.delete(id);
  }
}
