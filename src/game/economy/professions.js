//@ Professions on the client: the Wayfarers' Lodge panel (learn mining, woodcutting and gathering, buy tools, sell resources), the resource nodes of every land (drawn, taken and back), gathering with the talk key and its cast bar
/* The rules, the nodes' places and the resources are in shared/professions.js; the server (server/professions.js) checks everything. Here:
   - the lodge panel the lodge keepers open (role 'lodge', one in each village): a row per profession with its level and a Learn button (coins), the
     tools you can buy (a tier chip picks the tier), and the resources you carry with a Sell button;
   - the nodes: NODES drawn as small props (a vein of ore in the colour of its metal, a tree with a pale axe blaze, flowers or leaves), hidden while taken.
     Geometry is built once per kind and shared by every node of it;
   - gathering: walk up to a node and press the talk key (talking.js asks nearNode / nodePrompt / gatherNode). The server starts a cast (cast event: a bar
     fills for castTime seconds) and finishes it with the gather event; walking off breaks it (the server sends castx, and the bar also hides at once). */
const NODE_VIEWS=[], NODE_TAKEN=new Set(), NODE_GLOWS=[], NODE_GEO={};
const nodeTaken=i=>NODE_TAKEN.has(i);
const TREE_OF={pine:['pine',0],oak:['oakA',1],yew:['spruce',0],sunwood:['maple',1],cherry:['sakura',1],frostpine:['frostspruce',0]};   // [G.trees model, 1 = broadleaf material]
function nodeGlow(col,k){ const m=new THREE.MeshLambertMaterial({vertexColors:true,emissive:col,emissiveIntensity:k}); NODE_GLOWS.push({m,k}); return m; }
// ore: a rock with crystals (or flecks) in the metal's colour; three variants per kind
function oreGeo(kind,v){
  const K=NODE_KINDS[kind], col=new THREE.Color(RES[K.res].col), lite=col.clone().lerp(_c.set(0xffffff),0.35);
  const rockC=(x,y,z,nx,ny,nz,c)=>{ c.set(0x6a7480).multiplyScalar(0.8+h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))*0.3); if(ny>0.5&&kind==='rimeore') c.lerp(_c.set(0xf0f5f8),0.85); };
  const rock=paint(new THREE.IcosahedronGeometry(1.0,0).scale(1.35,0.75,1.15).translate(0,0.3,0),rockC), cr=[];
  for(let k=0;k<6;k++){ const a=k/6*TAU+h3(v,k,3), r=k?0.55:0.1, hgt=0.7+h3(v,k,4)*0.7; cr.push(paint(new THREE.OctahedronGeometry(0.2,0).scale(0.8,hgt/0.2*0.5,0.8).rotateZ((h3(v,k,5)-0.5)*0.8).translate(Math.sin(a)*r,0.7+hgt*0.3,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.copy(k%2?col:lite))); }
  return {rock,cr:merge(cr)};
}
function treeParts(kind){
  const [name,broad]=TREE_OF[kind], T=(G.treesHi||G.trees)[name];   // (the desktop's detailed model: a node is looked at from close by)
  return {trunk:T.trunk,leaves:T.leaves,mat:broad?(G.treesHi?matBroadD:matBroad):(G.treesHi?matConiferD:matConifer),blaze:merge([paint(new THREE.BoxGeometry(0.32,0.5,0.06).translate(0,1.1,-0.42),(x,y,z,nx,ny,nz,c)=>c.set(0xd8a050)),paint(new THREE.BoxGeometry(0.4,0.1,0.1).translate(0,1.4,-0.4).rotateZ(0.4),(x,y,z,nx,ny,nz,c)=>c.set(0xc0c8ce))])};
}
// herbs: flowers on stems (sunpetal, kikyo, frostbloom), leaf blades (ironroot, yomogi), or a low mound (snowmoss)
function herbGeo(kind,v){
  const col=new THREE.Color(RES[kind].col), p=[];
  if(kind==='snowmoss'){   // a low pale mound with a few red berries
    p.push(paint(new THREE.IcosahedronGeometry(0.7,1).scale(1.3,0.45,1.1).translate(0,0.18,0),(x,y,z,nx,ny,nz,c)=>{ c.set(0x9ab894).multiplyScalar(0.85+h3(Math.floor(x*6),Math.floor(y*6),Math.floor(z*6))*0.25); if(ny>0.6&&h3(Math.floor(x*4),1,Math.floor(z*4))>0.6) c.set(0xe8f0f2); }));
    for(let k=0;k<5;k++) p.push(paint(new THREE.SphereGeometry(0.05,5,4).translate((h3(v,k,8)-0.5)*0.9,0.36,(h3(v,k,9)-0.5)*0.7),(x,y,z,nx,ny,nz,c)=>c.set(0xd8402e)));
  } else if(kind==='ironroot'||kind==='yomogi'){   // a tuft of long leaves; ironroot has a red-brown root crown showing
    const leaf=kind==='yomogi'?0x7ab86a:0x5a8a48;
    for(let k=0;k<9;k++){ const a=k/9*TAU+h3(v,k,6), lean=0.5+h3(v,k,7)*0.5, hgt=0.5+h3(v,k,3)*0.35;
      p.push(paint(new THREE.OctahedronGeometry(0.1,0).scale(0.55,hgt/0.1*0.5,0.18).rotateY(a).translate(Math.sin(a)*0.12*lean,hgt*0.5,Math.cos(a)*0.12*lean),(x,y,z,nx,ny,nz,c)=>c.set(leaf).multiplyScalar((k%2?1:0.82)*(0.8+y*0.3)))); }
    if(kind==='ironroot') p.push(paint(new THREE.SphereGeometry(0.13,6,5).scale(1,0.6,1).translate(0,0.06,0),(x,y,z,nx,ny,nz,c)=>c.copy(col)));
  } else {
    for(let k=0;k<7;k++){ const a=k/7*TAU+h3(v,k,6), r=k?0.32:0, hgt=0.42+h3(v,k,7)*0.28;
      p.push(paint(cyl(0.012,0.02,hgt,4).translate(Math.sin(a)*r,hgt/2,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.set(0x6a9a8a)));
      if(kind==='kikyo') p.push(paint(new THREE.ConeGeometry(0.1,0.2,5,1,true).translate(Math.sin(a)*r,hgt+0.05,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.copy(col).multiplyScalar(k%2?1:0.85)));   // a bellflower
      else p.push(paint(new THREE.ConeGeometry(0.11,0.2,6).rotateX(Math.PI).translate(Math.sin(a)*r,hgt+0.08,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.copy(col).lerp(_c.set(0xffffff),k%2?0.25:0)));
      p.push(paint(new THREE.SphereGeometry(0.035,5,4).translate(Math.sin(a)*r,hgt+0.16,Math.cos(a)*r),(x,y,z,nx,ny,nz,c)=>c.set(kind==='sunpetal'?0xfff2b0:0xffffff)));
    }
  }
  return merge(p);
}
function buildNodes(){
  const glowOf={};   // one shining material per kind that glows (rime ore, frostbloom, and a soft one for other metals)
  const glow=(kind,col,k)=>glowOf[kind]||(glowOf[kind]=nodeGlow(col,k));
  for(const n of NODES){
    const K=NODE_KINDS[n.kind], g=new THREE.Group(); g.position.set(n.x,getH(n.x,n.z),n.z); g.rotation.y=h3(n.i,1,2)*TAU;
    const v=n.i%3, key=n.kind+v;
    if(K.prof==='mining'){
      const geo=NODE_GEO[key]||(NODE_GEO[key]=oreGeo(n.kind,v)), rm=new THREE.Mesh(geo.rock,matRock); rm.castShadow=true; g.add(rm);
      g.add(new THREE.Mesh(geo.cr,glow(n.kind,n.kind==='rimeore'?0x3a7ac8:new THREE.Color(RES[K.res].col).multiplyScalar(0.5).getHex(),n.kind==='rimeore'?0.6:0.25)));
    } else if(K.prof==='woodcutting'){
      const P=NODE_GEO[n.kind]||(NODE_GEO[n.kind]=treeParts(n.kind)), s=n.kind==='frostpine'?1.35:1.0;
      const tr=new THREE.Mesh(P.trunk,matBark), lv=new THREE.Mesh(P.leaves,P.mat); tr.scale.setScalar(s); lv.scale.setScalar(s); tr.castShadow=lv.castShadow=true; g.add(tr,lv);
      g.add(new THREE.Mesh(P.blaze,matRock));
    } else {
      const geo=NODE_GEO[key]||(NODE_GEO[key]=herbGeo(n.kind,v));
      g.add(new THREE.Mesh(geo,n.kind==='frostbloom'?glow('frostbloom',0x3a7ac8,0.6):n.kind==='snowmoss'?matRock:matFlower));
    }
    g.visible=false; scene.add(g); NODE_VIEWS.push({g,n});
  }
}
// the cast bar: on from the cast event to the gather event (or castx), and hidden by walking off
const CAST={on:false,t0:0,dur:1,x:0,z:0}, castBar=$('#castbar'), cbFill=$('#cbFill'), cbName=$('#cbName'), CAST_ING={mine:'Mining',chop:'Chopping',gather:'Gathering'};
function onCastEvent(i,dur){
  const K=NODE_KINDS[NODES[i].kind]; Object.assign(CAST,{on:true,t0:t,dur:Math.max(0.1,dur),x:P.x,z:P.z});
  cbName.textContent=CAST_ING[PROFS[K.prof].verb]+' '+K.name; cbFill.style.width='0%'; castBar.hidden=false;
}
function hideCast(){ CAST.on=false; castBar.hidden=true; }
// every frame: nodes within 130 m that are not taken, and a slow glow on the ore and the flowers
function updateNodes(){
  if(CAST.on){ const k=(t-CAST.t0)/CAST.dur; if(k>1.2||Math.hypot(P.x-CAST.x,P.z-CAST.z)>1.5) hideCast(); else cbFill.style.width=Math.round(Math.min(1,k)*100)+'%'; }
  if(!NODE_VIEWS.length) return;
  for(const v of NODE_VIEWS) v.g.visible=!NODE_TAKEN.has(v.n.i)&&Math.abs(v.n.x-P.x)<130&&Math.abs(v.n.z-P.z)<130;
  for(const G of NODE_GLOWS) G.m.emissiveIntensity=G.k*(0.85+0.5*Math.sin(t*2.2));
}
function nearNode(){ if(!started||!NODES.length) return -1; const i=nodeNear(P.x,P.z,NODE_R); return i>=0&&!NODE_TAKEN.has(i)?i:-1; }
function nodePrompt(i){
  const n=NODES[i], K=NODE_KINDS[n.kind], why=GEAR?nodeBlock(GEAR,n):'learn';
  return why?nodeBlockText(why,n):'Press '+(kbName('talk')||'the talk key')+' to '+PROFS[K.prof].verb+' '+K.name;
}
function gatherNode(i){ netSend({t:'gather',i}); UI_SFX.pickup(); }
// the server's answers: a node taken or back (everyone), your own haul
function onNodeEvent(i,state){ if(state) NODE_TAKEN.add(i); else NODE_TAKEN.delete(i); }
function onGatherEvent(i,res,n){
  hideCast();
  toast('+'+n+' '+RES[res].name,'good'); UI_SFX.success();
  const nd=NODES[i]; if(nd){ for(let k=0;k<6;k++){ const m=new THREE.Mesh(emberGeo,emberMat); m.position.set(nd.x+AR(-0.4,0.4),getH(nd.x,nd.z)+AR(0.3,1.0),nd.z+AR(-0.4,0.4)); scene.add(m); CB.fx.push({mesh:m,life:0.6,max:0.6,shrink:true}); } }
  if(!$('#inv').hidden) renderInv();
}
/* ---- the lodge panel ---- */
let loTier=-1;   // the tier shown in the tool shop (-1: the best one you can use)
function openLodge(n){ openPanel('lodge',n||null); loTier=-1; renderLodge(); }
function renderLodge(){
  if($('#lodge').hidden) return;
  const g=GEAR||{}, prof=g.prof||{}, res=g.res||{}, coins=g.coins||0, best=Math.min(TIERS-1,tierFor(PL.level)), tier=loTier<0?best:Math.min(loTier,TIERS-1);
  $('#loTitle').textContent='Wayfarers\' Lodge'; $('#loCoins').textContent=coins+' coins';
  let h=`<p class="lo-intro">${panelNPC?panelNPC.def.name+' keeps':'The Wayfarers keep'} a lodge in every village. Learn a profession once, wear its tool, and walk up to its resource in the woods: press the talk key. Ore becomes weapons at the weaponsmith\'s, logs become armour at the armourer\'s, and herbs become potions at the healer\'s. A better tool reaches the richer nodes of the deeper zones, and a higher level and rarer tool sometimes bring a double yield.</p><div class="lo-list">`;
  for(const id of PROF_IDS){
    const D=PROFS[id], mine=prof[id], lv=mine?profLvOf(mine.xp):0, from=lv?PROF_XP[lv-1]:0, to=lv&&lv<PROF_MAX_LV?PROF_XP[lv]:0, tool=ITEM[(g.eq||{})[D.tool]];
    h+=`<div class="lo-row${mine?' mine':''}"><div class="lo-main"><b>${D.name}</b><span>${D.desc}</span><small>Tool: ${TOOL_KIND[D.tool]}${tool?' (wearing '+tool.name+')':' (none worn)'}</small>`;
    if(mine) h+=`<div class="lo-lv"><span>Level ${lv}${lv>=PROF_MAX_LV?' (highest)':''}</span><i><b style="width:${to?Math.round((mine.xp-from)/(to-from)*100):100}%"></b></i></div>`;
    h+=`</div>`;
    h+=mine?`<span class="lo-state ok">Learned</span>`:`<button class="chip lo-learn" data-learn="${id}" ${coins<D.price?'disabled':''}>Learn · ${D.price} coins</button>`;
    h+=`</div>`;
  }
  h+=`</div><div class="inv-h">Tools <span>${TOOL_MAT[tier]} tier (level ${TIER_LV[tier]})</span></div><div class="chips lo-tiers">`;
  for(let t=0;t<TIERS;t++) h+=`<button class="chip" data-tier="${t}" aria-pressed="${t===tier}" ${t>best?'disabled':''}>${TOOL_MAT[t]}</button>`;
  h+=`</div>`;
  for(const slot of TOOL_SLOTS){
    const it=ITEM[itemId(slot,tier,0)], own=(g.inv||[]).filter(x=>x===it.id).length, n=(g.bought||{})[it.id]||0, price=shopPrice(it,n);
    h+=row(it,`<button class="chip buy" data-buytool="${it.id}" ${coins<price?'disabled':''}>${price} coins</button>`,own?'owned x'+own:'');
  }
  h+=`<div class="inv-h">Resources <span>sold here, or kept for crafting and brewing</span></div><div class="lo-res">`;
  const have=Object.keys(RES).filter(id=>res[id]>0);
  if(!have.length) h+='<p class="muted">You carry nothing yet.</p>';
  for(const id of have) h+=`<div class="lo-sell"><span class="mat"><i style="background:${RES[id].col}"></i>${RES[id].name} <b>${res[id]}</b></span><span class="muted">${RES[id].sell} coins each</span><button class="chip" data-sellres="${id}" data-n="1">Sell 1</button><button class="chip" data-sellres="${id}" data-n="0">Sell all</button></div>`;
  h+=`</div>`;
  $('#loBody').innerHTML=h;
  const B=$('#loBody');
  B.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>{ netSend({t:'learn',id:b.dataset.learn}); UI_SFX.click(); });
  B.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>{ loTier=+b.dataset.tier; renderLodge(); UI_SFX.click(); });
  B.querySelectorAll('[data-buytool]').forEach(b=>b.onclick=()=>{ netSend({t:'buy',id:b.dataset.buytool}); UI_SFX.pickup(); });
  B.querySelectorAll('[data-sellres]').forEach(b=>b.onclick=()=>{ netSend({t:'sellres',id:b.dataset.sellres,n:+b.dataset.n}); UI_SFX.click(); });
}
