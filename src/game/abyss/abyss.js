//@ The Abyss on the client (behind the server's flag, NET.ab): the gate in Glasswell (a dark tear), the talk key, the difficulty window, the round banner and the between-rounds bar (Next round / Leave)
/* agent map (docs/ABYSS.md; the server side: server/abyss.js, server/abyss/rounds.js)
   exports: abBuildGate() (built once, from abUpdate, only when the server said ab:1 in `welcome`), abUpdate(dt) (main/loop.js: the tear turns; the window and the bar close when they should),
            abHere() / abPrompt(tk) / abOpenNear() (village/talking.js: the talk key), NETH.abyss (the window's info), EVH.abr (round banner), EVH.abw (a round won: the bar), AB_UI, AB_GATE
   markup: #abyss (a panel: its id is in PANELS) and #abBar (index.html), styles 42-abyss.css. The gate stands in front of the reserved Guildhall's door (GW_PLACE.guild; the anchor 'place:guild' of VIL5).
   Test: tools/client-smoke.js (the Abyss case). Flag off (NET.ab 0): nothing is built, the talk key finds nothing, no window. */
const AB_UI={info:null,gate:null,won:false}, AB_TALK=3.6;
const AB_GATE=(()=>{ const a=VIL5.anchors['place:guild']; return a?{x:a.x,z:a.z}:null; })();   // the gate's world spot (Glasswell's reserved Guildhall: its door's anchor)
function abBuildGate(){
  if(AB_UI.gate||!AB_GATE) return; const y=getH(AB_GATE.x,AB_GATE.z), G=new THREE.Group(); G.position.set(AB_GATE.x,y,AB_GATE.z); G.name='abyss-gate';
  const add=(geo,mat,x,yy,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,yy,z); G.add(m); return m; };
  const voidM=new THREE.MeshBasicMaterial({color:0x07000f,side:THREE.DoubleSide}), halo=new THREE.MeshBasicMaterial({color:0x6a1fd0,transparent:true,opacity:0.32,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const crack=add(new THREE.PlaneGeometry(1.1,4.6),voidM,0,2.7,0), glowM=add(new THREE.PlaneGeometry(3,5.8),halo,0,2.7,0);
  const ring=add(new THREE.TorusGeometry(1.6,0.09,5,24),new THREE.MeshBasicMaterial({color:0x9a4cff}),0,2.7,0); ring.scale.y=1.8;
  const orbit=new THREE.Group(); orbit.position.y=2.7; G.add(orbit);
  for(let i=0;i<9;i++){ const a=i/9*TAU, m=new THREE.Mesh(new THREE.OctahedronGeometry(0.16+(i%3)*0.07,0),new THREE.MeshBasicMaterial({color:i%2?0x1a0830:0x7a2cd8})); m.position.set(Math.sin(a)*2.5,Math.sin(a*2)*0.8,Math.cos(a)*2.5); orbit.add(m); }
  const pg=new THREE.CircleGeometry(4.5,28); pg.rotateX(-Math.PI/2); const pp=pg.attributes.position;
  for(let i=0;i<pp.count;i++) pp.setY(i,getH(AB_GATE.x+pp.getX(i),AB_GATE.z+pp.getZ(i))-y+0.07);
  G.add(new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x14002a,transparent:true,opacity:0.55,depthWrite:false})));
  const light=new THREE.PointLight(0x7a2cd8,LOW?0:1,16,2); light.position.y=2.7; G.add(light);
  scene.add(G); addCol(AB_GATE.x,AB_GATE.z,0.9); AB_UI.gate={G,orbit,glowM,ring,crack,t:0};
}
const abNearest=()=>NET.ab&&AB_UI.gate&&started&&!PL.dead&&!dgIn()&&Math.hypot(P.x-AB_GATE.x,P.z-AB_GATE.z)<AB_TALK;
const abHere=()=>!!abNearest();
const abPrompt=tk=>'Press '+tk+': the Abyss gate (a solo roguelike, level '+AB_ENTRY_LV+' and up)';
function abOpenNear(){
  if(!abNearest()) return; if(PL.level<AB_ENTRY_LV){ toast('The Abyss is for hikers of level '+AB_ENTRY_LV+' and up.','bad'); return; }
  AB_UI.info=null; openPanel('abyss'); abRender(); netSend({t:'abyss',a:'open'}); UI_SFX.click();
}
NETH.abyss=m=>{ if(m.a!=='info') return; AB_UI.info=m; abRender(); };
function abRender(){
  const el=$('#abBody'); if(!el||$('#abyss').hidden) return; const I=AB_UI.info;
  if(!I){ el.textContent='The dark hums...'; return; }
  el.innerHTML=''; const intro=document.createElement('p'); intro.className='ab-line'; intro.textContent='One hiker, one life. Round after round of monsters at rising levels, and nothing from the world to take home: only what the Abyss itself pays. A fall ends the run.'; el.append(intro);
  const list=document.createElement('div'); list.className='ab-diffs';
  I.diffs.forEach((d,i)=>{
    const open=i<=(I.top|0), inf=!d.rounds, row=document.createElement('div'); row.className='ab-row'+(open?'':' locked');
    const t=document.createElement('div'); t.className='ab-t'; const nm=document.createElement('b'); nm.textContent=d.name; t.append(nm);
    const sub=document.createElement('span'); sub.textContent=inf?'Levels '+d.lo+' and up, no end':'Levels '+d.lo+' to '+d.hi+' in '+d.rounds+' rounds'; t.append(sub);
    const note=document.createElement('span'); note.className='ab-note';
    note.textContent=!open?'Locked: beat '+I.diffs[i-1].name+' first':inf?'Best round: '+(I.best|0):(I.top|0)>i?'Cleared':'Open'; t.append(note); row.append(t);
    const b=document.createElement('button'); b.type='button'; b.className='chip buy ab-go'; b.textContent=open?'Go':'Locked'; b.disabled=!open; b.dataset.d=i;
    b.onclick=()=>{ if(b.disabled) return; UI_SFX.click(); netSend({t:'abyss',a:'go',d:i}); closePanels(); }; row.append(b); list.append(row);
  });
  el.append(list);
}
// a round begins: abr [pid, round, of, lv, tile] (of 0 = Infinite; tile: the tile's id, B7)
EVH.abr=e=>{ if(e[1]!==NET.pid) return; AB_UI.won=false; abBar(false); abPickHide(); abArtsRender(); const r=e[2]|0, n=e[3]|0, lv=e[4]|0, T=abTileOf(e[5]), tn=T?' · '+T.name:''; toast(n?'Round '+r+' of '+n+' · level '+lv+tn:'Round '+r+' · level '+lv+tn,''); };
// a round is won (not the last of a finite difficulty): abw [pid, round]; the bar offers Next round or Leave
EVH.abw=e=>{ if(e[1]!==NET.pid) return; AB_UI.won=true; abBar(true,e[2]|0); };
function abBar(on,r){
  const b=$('#abBar'); if(!b) return; b.hidden=!on; if(on) $('#abBarT').textContent='Round '+r+' won';
}
function abBarInit(){
  const n=$('#abNext'), o=$('#abOut'); if(!n||!o||n._ab) return; n._ab=1;
  const sk=$('#abSkip'), dn=$('#abDropNo'); if(sk) sk.addEventListener('click',()=>{ UI_SFX.click(); if(AB_PK.tiles){ $('#abPick').hidden=true; return; } netSend({t:'abyss',a:'skip'}); abPickHide(); }); /* Later on the tile cards just puts the screen aside */ if(dn) dn.addEventListener('click',()=>{ UI_SFX.click(); abDropHide(); });
  n.addEventListener('click',()=>{ if(!AB_UI.won) return; if(AB_PK.offer){ toast('Pick an artifact or skip the offer first.','bad'); return; } if(AB_PK.tiles){ abTilesShow(AB_PK.tiles); return; }   // B7: Next is the tile choice
    AB_UI.won=false; abBar(false); UI_SFX.click(); netSend({t:'abyss',a:'next'}); });
  o.addEventListener('click',()=>{ if(!AB_UI.won) return; AB_UI.won=false; abBar(false); UI_SFX.click(); netSend({t:'abyss',a:'out'}); });
}
function abUpdate(dt){
  if(!NET.ab) return; if(started&&!AB_UI.gate) abBuildGate(); abBarInit();
  if(AB_UI.won&&!dgIn()){ AB_UI.won=false; abBar(false); }
  abChoiceUpdate();   // the run is gone (out, a fall, a close)
  const g=AB_UI.gate; if(!g) return; g.t+=dt;
  if(Math.abs(AB_GATE.x-P.x)<160&&Math.abs(AB_GATE.z-P.z)<160){ g.orbit.rotation.y=g.t*0.5; g.ring.rotation.z=Math.sin(g.t*0.7)*0.1; g.glowM.material.opacity=0.28+0.1*Math.sin(g.t*2.3);
    for(const m of [g.glowM,g.crack]) m.lookAt(camera.position.x,g.G.position.y+2.7,camera.position.z); }
  if(!$('#abyss').hidden&&Math.hypot(P.x-AB_GATE.x,P.z-AB_GATE.z)>AB_TALK+3) closePanels();
}
