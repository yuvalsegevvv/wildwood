//@ Professions on the client: the Wayfarers' Lodge panel (learn mining, woodcutting and gathering; potion use is planned), the resource nodes of the Hoarfrost Reach (drawn, taken and back), gathering with the talk key
/* The rules, the nodes' places and the resources are in shared/professions.js; the server (server/professions.js) checks everything. Here:
   - the lodge panel Gudrun opens (role 'lodge'): a row per profession with its level, what it gathers and a Learn button (coins);
   - the nodes: NODES drawn as small props (a rime ore vein, a frostpine with an axe notch, glowing frostbloom, a mound of snowmoss), hidden while taken;
   - gathering: walk up to a node and press the talk key (talking.js asks nearNode / nodePrompt / gatherNode). */
const NODE_VIEWS=[], NODE_TAKEN=new Set();
const nodeTaken=i=>NODE_TAKEN.has(i);
let nodeGlow=null;
function buildNodes(){
  nodeGlow=new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x3a7ac8,emissiveIntensity:0.6});
  const rockC=(x,y,z,nx,ny,nz,c)=>{ c.set(0x6a7480).multiplyScalar(0.8+h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))*0.3); if(ny>0.5) c.lerp(_c.set(0xf0f5f8),0.85); };
  for(const n of NODES){
    const g=new THREE.Group(); g.position.set(n.x,getH(n.x,n.z),n.z); g.rotation.y=h3(n.i,1,2)*TAU;
    if(n.kind==='rimeore'){
      const rock=paint(new THREE.IcosahedronGeometry(1.0,0).scale(1.35,0.75,1.15).translate(0,0.3,0),rockC), cr=[];
      for(let k=0;k<6;k++){ const a=k/6*TAU+h3(n.i,k,3), r=k?0.55:0.1, hgt=0.7+h3(n.i,k,4)*0.7; cr.push(paint(new THREE.OctahedronGeometry(0.2,0).scale(0.8,hgt/0.2*0.5,0.8).rotateZ((h3(n.i,k,5)-0.5)*0.8).translate(Math.sin(a)*r,0.7+hgt*0.3,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.set(k%2?0x9fd8ff:0xc8ecff))); }
      const rm=new THREE.Mesh(rock,matRock); rm.castShadow=true; g.add(rm); g.add(new THREE.Mesh(merge(cr),nodeGlow));
    } else if(n.kind==='frostpine'){
      const T=G.trees.frostspruce, s=1.35, tr=new THREE.Mesh(T.trunk,matBark), lv=new THREE.Mesh(T.leaves,matConifer);
      const col=new THREE.Color(0x5f7f78); lv.material=matConifer; tr.scale.setScalar(s); lv.scale.setScalar(s); tr.castShadow=lv.castShadow=true; g.add(tr,lv);
      g.add(new THREE.Mesh(merge([paint(new THREE.BoxGeometry(0.32,0.5,0.06).translate(0,1.1,-0.42),(x,y,z,nx,ny,nz,c)=>c.set(0xd8a050)),paint(new THREE.BoxGeometry(0.4,0.1,0.1).translate(0,1.4,-0.4).rotateZ(0.4),(x,y,z,nx,ny,nz,c)=>c.set(0xc0c8ce))]),matRock));
    } else if(n.kind==='frostbloom'){
      const p=[];
      for(let k=0;k<7;k++){ const a=k/7*TAU+h3(n.i,k,6), r=k?0.32:0, hgt=0.42+h3(n.i,k,7)*0.28;
        p.push(paint(cyl(0.012,0.02,hgt,4).translate(Math.sin(a)*r,hgt/2,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.set(0x6a9a8a)));
        p.push(paint(new THREE.ConeGeometry(0.11,0.2,6).rotateX(Math.PI).translate(Math.sin(a)*r,hgt+0.08,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.set(k%2?0x7fd0ff:0xa8e4ff)));
        p.push(paint(new THREE.SphereGeometry(0.035,5,4).translate(Math.sin(a)*r,hgt+0.16,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.set(0xffffff))); }
      g.add(new THREE.Mesh(merge(p),nodeGlow));
    } else {   // snowmoss: a low pale mound with a few red berries
      const p=[paint(new THREE.IcosahedronGeometry(0.7,1).scale(1.3,0.45,1.1).translate(0,0.18,0),(x,y,z,nx,ny,nz,c)=>{ c.set(0x9ab894).multiplyScalar(0.85+h3(Math.floor(x*6),Math.floor(y*6),Math.floor(z*6))*0.25); if(ny>0.6&&h3(Math.floor(x*4),1,Math.floor(z*4))>0.6) c.set(0xe8f0f2); })];
      for(let k=0;k<5;k++) p.push(paint(new THREE.SphereGeometry(0.05,5,4).translate((h3(n.i,k,8)-0.5)*0.9,0.36,(h3(n.i,k,9)-0.5)*0.7),(x,y,z,nx,ny,nz,c)=>c.set(0xd8402e)));
      g.add(new THREE.Mesh(merge(p),matRock));
    }
    g.visible=false; scene.add(g); NODE_VIEWS.push({g,n});
  }
}
// every frame: nodes within 130 m that are not taken, and a slow glow on the ore and the flowers
function updateNodes(){
  if(!NODE_VIEWS.length) return;
  for(const v of NODE_VIEWS) v.g.visible=!NODE_TAKEN.has(v.n.i)&&Math.abs(v.n.x-P.x)<130&&Math.abs(v.n.z-P.z)<130;
  nodeGlow.emissiveIntensity=0.5+0.3*Math.sin(t*2.2);
}
function nearNode(){ if(!started||!NODES.length) return -1; const i=nodeNear(P.x,P.z,NODE_R); return i>=0&&!NODE_TAKEN.has(i)?i:-1; }
function nodePrompt(i){
  const n=NODES[i], K=NODE_KINDS[n.kind], D=PROFS[K.prof], mine=GEAR&&GEAR.prof&&GEAR.prof[K.prof];
  return mine?'Press '+(kbName('talk')||'the talk key')+' to '+D.verb+' '+K.name:K.name+': learn '+D.name+' at the Wayfarers\' Lodge in Rimehold';
}
function gatherNode(i){ netSend({t:'gather',i}); UI_SFX.pickup(); }
// the server's answers: a node taken or back (everyone), your own haul
function onNodeEvent(i,state){ if(state) NODE_TAKEN.add(i); else NODE_TAKEN.delete(i); }
function onGatherEvent(i,res,n){
  toast('+'+n+' '+RES[res].name,'good'); UI_SFX.success();
  const nd=NODES[i]; if(nd){ for(let k=0;k<6;k++){ const m=new THREE.Mesh(emberGeo,emberMat); m.position.set(nd.x+AR(-0.4,0.4),getH(nd.x,nd.z)+AR(0.3,1.0),nd.z+AR(-0.4,0.4)); scene.add(m); CB.fx.push({mesh:m,life:0.6,max:0.6,shrink:true}); } }
  if(!$('#inv').hidden) renderInv();
}
/* ---- the lodge panel ---- */
function openLodge(n){ openPanel('lodge',n||null); renderLodge(); }
function renderLodge(){
  if($('#lodge').hidden) return;
  const g=GEAR||{}, prof=g.prof||{}, res=g.res||{}, coins=g.coins||0;
  $('#loTitle').textContent='Wayfarers\' Lodge';
  let h=`<p class="lo-intro">${panelNPC?panelNPC.def.name+' teaches':'The lodge teaches'} the ways of taking what the north gives. Learn a profession once, for coins; then walk up to its resource in the snow and press the talk key. Each profession grows with use, and a higher level sometimes brings a double yield.</p><div class="lo-list">`;
  for(const id of [...PROF_IDS,'potions']){
    const D=PROFS[id], mine=prof[id], lv=mine?profLvOf(mine.xp):0, from=lv?PROF_XP[lv-1]:0, to=lv&&lv<PROF_MAX_LV?PROF_XP[lv]:0;
    const what=D.nodes?D.nodes.map(k=>NODE_KINDS[k].name).join(', '):'';
    h+=`<div class="lo-row${D.soon?' soon':''}${mine?' mine':''}"><div class="lo-main"><b>${D.name}</b><span>${D.desc}</span>${what?`<small>Gathers: ${what}</small>`:''}`;
    if(mine) h+=`<div class="lo-lv"><span>Level ${lv}${lv>=PROF_MAX_LV?' (highest)':''}</span><i><b style="width:${to?Math.round((mine.xp-from)/(to-from)*100):100}%"></b></i></div>`;
    h+=`</div>`;
    if(D.soon) h+=`<span class="lo-state">Coming later</span>`;
    else if(mine) h+=`<span class="lo-state ok">Learned</span>`;
    else h+=`<button class="chip lo-learn" data-learn="${id}" ${coins<D.price?'disabled':''}>Learn · ${D.price} coins</button>`;
    h+=`</div>`;
  }
  h+=`</div>`;
  const have=Object.keys(RES).filter(id=>res[id]>0);
  h+=`<div class="lo-bag"><b>Gathered</b> ${have.length?have.map(id=>`<span class="mat"><i style="background:${RES[id].col}"></i>${RES[id].name} <b>${res[id]}</b></span>`).join(''):'<span class="muted">nothing yet</span>'}</div>`;
  h+=`<p class="lo-note">What the resources are for (crafting, potions) is not ready yet: keep what you gather.</p>`;
  $('#loBody').innerHTML=h;
  $('#loBody').querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{ netSend({t:'learn',id:b.dataset.learn}); UI_SFX.click(); });
}
