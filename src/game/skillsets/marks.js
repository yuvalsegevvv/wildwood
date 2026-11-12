//@ Skill-set marks on the client: a kit's stacks as shaped, glowing pips over the monster (only yours), a full-stack halo, a burst when they are spent, and a stack chip on the target frame
/* Agent map. Plan: docs/SKILL-SETS.md 6.1, 6.7; the server side is server/skillsets.js (ssMarkS). Server event mk [monId, markId, n, dur, ownerId]: applyEvent (net/client.js) calls ssOnMark; n 0 = spent or gone.
   ssvUpdate runs from updateMonsters (combat/monsters.js) and ssvDrop from removeMonView. Each mark has a SHAPE (SSV_SHAPE: Rime is an ice shard, Toll a bell, Loot a coin...), the pips of one mark orbit the head in the kit's colour;
   a new pip flies in from the body, a full stack (the "up to N" of the kit's text) pulses and wears a spinning halo, and a spent stack bursts into its own shapes. The target frame shows the stack as dots (#tStacks, ssvChip).
   Test: client-smoke. */
const SSV={marks:new Map(), geos:{}, mats:{}, haloGeo:null, shown:'', max:{}, fly:[]};   // monster id -> {markId: {n, until, pips:[mesh], born:[t], full}}
// shape of each kit's mark: orb ring gem shard flame bell coin bar thorn seed knot blob star (a mark not listed here is an orb)
const SSV_SHAPE={ripple:'ring', knot:'knot', glint:'gem', rime:'shard', glare:'star', temper:'flame', fervor:'flame', toll:'bell', vigil:'flame', applause:'star', swell:'ring', linen:'bar', rot:'blob', string:'bar', lure:'orb', loot:'coin', barb:'thorn', stride:'thorn', sight:'ring', fixation:'gem', tally:'bar', grain:'seed', twine:'knot'};
function ssvColor(markId){ for(const id of SS_ORDER){ const s=SS_SETS[id]; if(s.kit&&s.kit.mark===markId) return s.pal.accent; } return 0xffffff; }
function ssvSet(markId){ for(const id of SS_ORDER){ const s=SS_SETS[id]; if(s.kit&&s.kit.mark===markId) return s; } return null; }
function ssvKit(markId){ for(const id of SS_ORDER){ const s=SS_SETS[id]; if(s.kit&&s.kit.mark===markId) return s.kit; } return null; }
function ssvMax(markId){   // the "(up to 5)" of the kit's text; a kit that does not say it holds 5
  if(SSV.max[markId]) return SSV.max[markId];
  const k=ssvKit(markId), m=k&&/up to (\d+)/.exec(k.text||''); return SSV.max[markId]=m?Math.max(1,+m[1]):5;
}
function ssvGeo(shape){
  if(SSV.geos[shape]) return SSV.geos[shape];
  let g;
  if(shape==='ring') g=new THREE.TorusGeometry(0.09,0.022,5,14).rotateX(Math.PI/2);
  else if(shape==='knot') g=new THREE.TorusKnotGeometry(0.06,0.02,26,5);
  else if(shape==='gem') g=new THREE.OctahedronGeometry(0.1,0);
  else if(shape==='shard') g=new THREE.ConeGeometry(0.06,0.2,4).rotateX(Math.PI);
  else if(shape==='flame') g=new THREE.ConeGeometry(0.07,0.2,5);
  else if(shape==='bell') g=new THREE.CylinderGeometry(0.035,0.1,0.14,8);
  else if(shape==='coin') g=new THREE.CylinderGeometry(0.1,0.1,0.03,10).rotateZ(Math.PI/2);
  else if(shape==='bar') g=new THREE.BoxGeometry(0.035,0.2,0.035);
  else if(shape==='thorn') g=new THREE.ConeGeometry(0.035,0.2,4).rotateZ(Math.PI/2);
  else if(shape==='seed') g=new THREE.SphereGeometry(0.07,6,5).scale(0.6,1.1,0.6);
  else if(shape==='blob') g=new THREE.IcosahedronGeometry(0.09,1);
  else if(shape==='star') g=new THREE.OctahedronGeometry(0.11,0).scale(0.5,1.2,0.5);
  else g=new THREE.SphereGeometry(0.075,6,5);
  return SSV.geos[shape]=g;
}
function ssvMat(c){ return SSV.mats[c]||(SSV.mats[c]=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.95,depthWrite:false})); }
function ssvDrop(monId,markId){
  const e=SSV.marks.get(monId); if(!e) return;
  for(const k of markId===undefined?Object.keys(e):[markId]){ if(e[k]){ for(const m of e[k].pips) scene.remove(m); if(e[k].halo) scene.remove(e[k].halo); delete e[k]; } }
  if(!Object.keys(e).length) SSV.marks.delete(monId);
}
function ssvBurst(m,markId,n){   // a spent stack: its own shapes fly out of the head and the body flashes
  const col=ssvColor(markId), cx=m.x, cy=m.y+m.T.height*m.s*0.6, cz=m.z, shape=SSV_SHAPE[markId]||'orb', geo=ssvGeo(shape);
  fxpFlare(cx,cy,cz,col,1.1+0.25*n,0.35); fxpSparks(cx,cy,cz,col,6+n*3,3.2,{up:1.6,size:0.2,life:0.6});
  for(let i=0;i<n;i++){   // (the pips themselves, thrown out and falling: ssvUpdate moves them)
    const mesh=new THREE.Mesh(geo,ssvMat(col).clone()), a=i/n*Math.PI*2+Math.random();
    mesh.position.set(cx,m.y+m.T.height*m.s+0.9,cz); scene.add(mesh); SSV.fly.push({mesh,vx:Math.sin(a)*2.6,vz:Math.cos(a)*2.6,vy:1.2+Math.random()*1.4,t:0});
  }
}
function ssOnMark(monId,markId,n,dur,by){
  const mon=MON_BY_ID.get(monId); if(by!==NET.pid||!mon) return;
  if(!n){ const e=SSV.marks.get(monId), was=e&&e[markId]?e[markId].n:0; ssvDrop(monId,markId); if(was>0){ ssvBurst(mon,markId,Math.min(5,was)); const S=ssvSet(markId), L=S&&SSL.looks[S.id]; if(L&&L.spent) L.spent(L,mon,was); } return; }   // (a look's spent hook: what the spent stacks pay, e.g. Tzaya's tallies flying home)
  const e=SSV.marks.get(monId)||SSV.marks.set(monId,{}).get(monId), cur=e[markId]||(e[markId]={n:0,until:0,pips:[],born:[],full:false}), col=ssvColor(markId), shape=SSV_SHAPE[markId]||'orb', now=performance.now()/1000;
  const grew=n>cur.n; cur.n=n; cur.until=now+dur;
  while(cur.pips.length<n){ const mesh=new THREE.Mesh(ssvGeo(shape),ssvMat(col)); mesh.visible=false; scene.add(mesh); cur.pips.push(mesh); cur.born.push(now); }
  while(cur.pips.length>n){ scene.remove(cur.pips.pop()); cur.born.pop(); }
  if(grew){ fxpFlare(mon.x,mon.y+mon.T.height*mon.s*0.6,mon.z,col,0.55,0.18); fxpSparks(mon.x,mon.y+mon.T.height*mon.s*0.6,mon.z,col,3,1.6,{up:0.8,size:0.12,life:0.35}); }
  const mx=ssvMax(markId);
  if(n>=mx&&mx>1&&!cur.full){ cur.full=true;   // (a one-stack mark, Tansy's Twine, is always "full": no halo on every bound monster)
   // the stack is full: one ring pulse and a halo that stays
    spawnRingAt(mon.x,mon.y+mon.T.height*mon.s+0.9,mon.z,0.9,col); fxpSparks(mon.x,mon.y+mon.T.height*mon.s+0.9,mon.z,col,10,2.4,{up:1,size:0.16,life:0.5});
    const h=new THREE.Mesh(SSV.haloGeo||(SSV.haloGeo=new THREE.TorusGeometry(0.4,0.018,4,28).rotateX(Math.PI/2)),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending}));
    h.visible=false; scene.add(h); cur.halo=h;
  } else if(n<mx&&cur.full){ cur.full=false; if(cur.halo){ scene.remove(cur.halo); cur.halo=null; } }
}
function ssvChip(){   // the target frame: the stacks you hold on the monster in front of you, as dots
  const el=document.getElementById('tStacks'); if(!el) return;
  const T=CB.target, e=T&&SSV.marks.get(T.id); let key='';
  if(e) for(const k of Object.keys(e)) key+=k+':'+e[k].n+';';
  if(key===SSV.shown) return; SSV.shown=key; el.textContent='';
  if(!key){ el.hidden=true; return; }
  el.hidden=false;
  for(const k of Object.keys(e)){
    const kit=ssvKit(k), mx=ssvMax(k), n=e[k].n, chip=document.createElement('span'), col='#'+ssvColor(k).toString(16).padStart(6,'0');
    chip.className='tf-st'+(n>=mx?' full':''); chip.style.setProperty('--c',col);
    const nm=document.createElement('b'); nm.textContent=kit?kit.name:k; chip.appendChild(nm);
    for(let i=0;i<mx;i++){ const d=document.createElement('i'); if(i<n) d.className='on'; chip.appendChild(d); }
    el.appendChild(chip);
  }
}
function ssvUpdate(dt){
  ssvChip();
  for(let i=SSV.fly.length-1;i>=0;i--){ const f=SSV.fly[i]; f.t+=dt; const q=f.mesh; q.position.x+=f.vx*dt; q.position.z+=f.vz*dt; q.position.y+=(f.vy-f.t*7)*dt; q.rotation.x+=7*dt; q.rotation.y+=9*dt; q.material.opacity=Math.max(0,0.95-f.t*1.9);
    if(f.t>0.5){ scene.remove(q); q.material.dispose(); SSV.fly.splice(i,1); } }   // (the spent pips of ssvBurst)
  if(!SSV.marks.size) return;
  const now=performance.now()/1000;
  for(const [id,e] of [...SSV.marks]){
    const m=MON_BY_ID.get(id); if(!m||m.dead){ ssvDrop(id); continue; }
    let row=0;
    for(const k of Object.keys(e)){
      const c=e[k]; if(c.until<now){ ssvDrop(id,k); continue; }
      const top=m.y+m.T.height*m.s+0.9+row*0.22, body=m.y+m.T.height*m.s*0.6, left=c.until-now, fade=left<1.2?(0.5+0.5*Math.sin(now*18)):1;   // (the last second flickers: the stack is about to run out)
      c.pips.forEach((mesh,i)=>{
        const a=now*(c.full?2.6:1.6)+i/c.pips.length*Math.PI*2, ox=Math.sin(a)*0.34, oz=Math.cos(a)*0.34, oy=top+Math.sin(now*3+i*1.3)*0.04, f=Math.min(1,(now-c.born[i])/0.22);   // f: the new pip flying in from the body
        mesh.visible=m.g.visible; mesh.position.set(m.x+ox*f,body+(oy-body)*f,m.z+oz*f);
        const s=(c.full?1.25+0.2*Math.sin(now*7+i):1)*(2-f); mesh.scale.setScalar(s*(0.55+0.45*fade)); mesh.rotation.y=now*2.2+i;   // (the colour's material is shared: only the size flickers)
      });
      if(c.halo){ c.halo.visible=m.g.visible; c.halo.position.set(m.x,top,m.z); c.halo.rotation.y=now*1.4; c.halo.scale.setScalar(1+0.12*Math.sin(now*6)); c.halo.material.opacity=0.55*fade; }
      row++;
    }
    if(!Object.keys(e).length) SSV.marks.delete(id);
  }
}
