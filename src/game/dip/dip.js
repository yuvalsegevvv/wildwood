//@ Dark Infection Pipes on the client: the pipe and its dark 20 x 20 square in each land, the glow while it releases dark energy, the talk key and the panel (level, cost, upgrade, release)
/* Agent map (docs/DIP.md). dipBuild() (generation-setup.js) draws every DIP_SITES row; dipUpdate(dt) (main/loop.js) animates them and closes the panel when you walk off; dipHere / dipPrompt / dipOpenNear are the talk key's (village/talking.js).
   NETH.dip {a:'info'} fills the panel (server/dip.js dipInfoP); NETH.dipa {a:[[id, seconds left]]} lists the active pipes (the glow). Markup #dip (index.html), styles 34-dip.css. Test: client-smoke (loads), tools/dip-smoke.js. */
const DIP_VIEW=[], DIP_UI={info:null,act:{}};   // DIP_UI.act: site id -> epoch ms the dark energy ends
function dipBuild(){
  const dark=new THREE.MeshLambertMaterial({color:0x2a2530}), purple=new THREE.MeshBasicMaterial({color:0xb04cff}), iron=new THREE.MeshLambertMaterial({color:0x3a3640});
  for(const S of DIP_SITES){
    const y=getH(S.x,S.z), G=new THREE.Group(); G.position.set(S.x,y,S.z); G.name='dip-'+S.id;
    // the dark square: a patch that follows the ground
    const pg=new THREE.PlaneGeometry(DIP_SIDE,DIP_SIDE,10,10); pg.rotateX(-Math.PI/2); const pp=pg.attributes.position;
    for(let i=0;i<pp.count;i++) pp.setY(i,getH(S.x+pp.getX(i),S.z+pp.getZ(i))-y+0.07);
    const patch=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x1b1024,transparent:true,opacity:0.6,depthWrite:false})); G.add(patch);
    // four posts with a violet crystal at the corners
    for(const [cx,cz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const px=cx*DIP_SIDE/2, pz=cz*DIP_SIDE/2, gy=getH(S.x+px,S.z+pz)-y;
      const post=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,1.8,6),iron); post.position.set(px,gy+0.9,pz); G.add(post);
      const cr=new THREE.Mesh(new THREE.OctahedronGeometry(0.3,0),purple); cr.position.set(px,gy+2.1,pz); cr.scale.set(0.7,1.3,0.7); G.add(cr); }
    // the pipe: a flange, a stack, an elbow with a glowing mouth
    const fl=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.35,0.4,12),dark); fl.position.y=0.2; G.add(fl);
    const st=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.62,2.8,12),iron); st.position.y=1.8; G.add(st);
    for(const yy of [1.0,2.6]){ const rg=new THREE.Mesh(new THREE.CylinderGeometry(0.72,0.72,0.16,12),dark); rg.position.y=yy; G.add(rg); }
    const el=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,1.8,10),iron); el.rotation.z=Math.PI/2; el.position.set(0.9,3.3,0); G.add(el);
    const mouthM=new THREE.MeshBasicMaterial({color:0x6a2a9a}), mouth=new THREE.Mesh(new THREE.CircleGeometry(0.36,12),mouthM); mouth.rotation.y=Math.PI/2; mouth.position.set(1.81,3.3,0); G.add(mouth);
    const colM=new THREE.MeshBasicMaterial({color:0xb04cff,transparent:true,opacity:0.0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}), col=new THREE.Mesh(new THREE.CylinderGeometry(2.4,1.2,14,14,1,true),colM); col.position.y=7.2; G.add(col);
    scene.add(G); addCol(S.x,S.z,1.2);
    DIP_VIEW.push({S,G,mouthM,colM,col,cry:G.children.filter(c=>c.geometry&&c.geometry.type==='OctahedronGeometry')});
  }
}
const dipNearest=()=>{ if(!started||PL.dead) return null; let b=null,bd=DIP_SIDE*0.55; for(const v of DIP_VIEW){ const d=Math.hypot(P.x-v.S.x,P.z-v.S.z); if(d<bd){ bd=d; b=v.S; } } return b; };
const dipHere=()=>!!dipNearest();
const dipLeft=id=>Math.max(0,Math.ceil(((DIP_UI.act[id]||0)-Date.now())/1000));
function dipPrompt(tk){ const S=dipNearest(); return 'Press '+tk+': the Dark Infection Pipe'+(dipLeft(S.id)?' ('+Math.ceil(dipLeft(S.id)/60)+' min of dark energy left)':''); }
function dipOpenNear(){ const S=dipNearest(); if(!S) return; openPanel('dip'); DIP_UI.id=S.id; DIP_UI.info=null; dipRender(); netSend({t:'dip',a:'open',id:S.id}); UI_SFX.click(); }
NETH.dip=m=>{ if(m.a!=='info') return; DIP_UI.info=m; if(m.act) DIP_UI.act[m.id]=Date.now()+m.act*1000; dipRender(); };
NETH.dipa=m=>{ const now=Date.now(); DIP_UI.act={}; for(const [id,s] of (m.a||[])) DIP_UI.act[id]=now+s*1000; };
const dipFmt=n=>Math.round(n).toLocaleString('en-US');
function dipRender(){
  const el=$('#dipBody'); if(!el||$('#dip').hidden) return; const I=DIP_UI.info;
  if(!I){ el.textContent='Looking at the pipe...'; return; }
  const S=DIP_BY_ID[I.id], lvs=S.defs.map(d=>dipKindLv(S,d)), names='all '+S.defs.length+' kinds of this land (levels '+Math.min(...lvs)+'-'+Math.max(...lvs)+')', left=dipLeft(I.id), coins=GEAR?GEAR.coins:0, have=(GEAR&&GEAR.mats)||{};
  let h='<p class="dp-line">Level <b>'+I.lv+' / '+I.max+'</b> · up to <b>'+I.count+'</b> monsters, refilled every <b>'+I.every+' s</b>, for 10 minutes</p>'
    +'<p class="dp-sub">Monsters: '+names+(S.land==='home'&&S.defs.some(d=>d.level<DIP_HOME_MIN_LV)?'; the weak ones fight at level '+DIP_HOME_MIN_LV+' here':'')+'. They drop fewer materials than usual.</p>'
    +'<div class="tr-btns"><button class="chip buy" data-dp="go"'+(left||coins<I.cost?' disabled':'')+'>'+(left?'Dark energy: '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0'):'Release dark energy · '+dipFmt(I.cost)+' coins')+'</button></div>';
  if(I.needs){
    const ok=I.needs.every(([id,n])=>(have[id]||0)>=n);
    h+='<div class="inv-h">Upgrade to level '+(I.lv+1)+' <span>'+I.next.count+' monsters, every '+I.next.every+' s</span></div><div class="dp-needs">'
      +I.needs.map(([id,n])=>'<div class="'+((have[id]||0)>=n?'ok':'no')+'">'+(have[id]||0)+' / '+n+' × '+(MATS[id]?MATS[id].name:id)+'</div>').join('')+'</div>'
      +'<div class="tr-btns"><button class="chip" data-dp="up"'+(ok?'':' disabled')+'>Upgrade the pipe</button></div>';
  } else h+='<p class="dp-sub">The pipe is at its highest level.</p>';
  h+='<p class="tr-note">Upgrade materials drop from the monsters of this land. Releasing costs coins: half of what killing every monster before each refill would pay.</p>';
  el.innerHTML=h;
  el.querySelectorAll('[data-dp]').forEach(b=>b.onclick=()=>{ UI_SFX.click(); netSend({t:'dip',a:b.dataset.dp,id:I.id}); });
}
let dipT=0;
function dipUpdate(dt){
  if(!DIP_VIEW.length) return; dipT+=dt; const now=Date.now();
  for(const v of DIP_VIEW){ const on=(DIP_UI.act[v.S.id]||0)>now; v.mouthM.color.setHex(on?0xd890ff:0x6a2a9a); v.colM.opacity+=((on?0.28+Math.sin(dipT*3)*0.06:0)-v.colM.opacity)*Math.min(1,dt*3); v.col.visible=v.colM.opacity>0.01; v.col.rotation.y=dipT*0.6; for(const c of v.cry){ c.rotation.y=dipT*(on?1.6:0.5); } }
  if(!$('#dip').hidden){ const S=DIP_BY_ID[DIP_UI.id]; if(!S||Math.hypot(P.x-S.x,P.z-S.z)>DIP_SIDE) closePanels(); else if(dipT%1<dt) dipRender(); }
}
