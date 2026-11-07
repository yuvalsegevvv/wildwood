//@ Rifts on the client: the tear in the wild (a crack of light in a ring of glass shards, glassed trees round its clearing), the talk key, the rift window (energy bar and time to full, the Double, Enter), the wave banner
/* agent map (docs/RIFT.md)
   exports: riftBuild() (world/generation-setup.js, after the pipes: every RIFT_DEFS tear), riftUpdate(dt) (main/loop.js: the tear turns and glows; the window closes when you walk off; the
            energy counts up), riftHere() / riftPrompt(tk) / riftOpenNear() (village/talking.js: the talk key), NETH.rift (the window's info), EVH.riftw (the wave banner), RIFT_UI
   markup: #rift (index.html, a panel: its id is in PANELS), styles 35-rift.css. Test: tools/client-smoke.js (the rift case), tools/rift-smoke.js
   The energy shown is the server's (info: e, full), counted up here at the server's rate between answers, never sent back. */
const RIFT_VIEWS=[], RIFT_UI={info:null,at:0,x2:false,id:null};
function riftBuild(){
  for(const id in RIFT_DEFS){
    const R=RIFT_DEFS[id], y=getH(R.door.x,R.door.z), G=new THREE.Group(); G.position.set(R.door.x,y,R.door.z); G.name='rift-'+id;
    const au=R.aura.map(h=>new THREE.Color(h)), add=(geo,mat,x,yy,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,yy,z); G.add(m); return m; };
    const glass=new THREE.MeshPhongMaterial({color:0xd8ccff,emissive:0x4a3080,shininess:90,specular:0xffffff,transparent:true,opacity:0.7});
    const core=new THREE.MeshBasicMaterial({color:0xfff0ff}), halo=new THREE.MeshBasicMaterial({color:au[1],transparent:true,opacity:0.35,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    // the tear: an upright crack, a white heart in a violet halo, edged with glass
    const crack=add(new THREE.PlaneGeometry(0.7,4.4),core,0,2.6,0); crack.material.side=THREE.DoubleSide;
    const glowM=add(new THREE.PlaneGeometry(2.6,5.4),halo,0,2.6,0);
    const ring=add(new THREE.TorusGeometry(1.5,0.08,5,24),new THREE.MeshBasicMaterial({color:au[2]}),0,2.6,0); ring.scale.y=1.8;
    for(let i=0;i<6;i++){ const e=add(new THREE.OctahedronGeometry(0.22+i%2*0.1,0),glass,(i%2?0.45:-0.45)*(1+i*0.06),0.6+i*0.75,0); e.scale.set(0.7,1.8,0.7); }
    // shards orbiting it, and a ring of glass stuck in the ground round the clearing
    const orbit=new THREE.Group(); orbit.position.y=2.6; G.add(orbit);
    for(let i=0;i<9;i++){ const a=i/9*TAU, m=new THREE.Mesh(new THREE.OctahedronGeometry(0.18+(i%3)*0.08,0),new THREE.MeshBasicMaterial({color:au[i%3]})); m.position.set(Math.sin(a)*2.4,Math.sin(a*2)*0.8,Math.cos(a)*2.4); orbit.add(m); }
    const rng=mulberry32(0x7e1f+id.length);
    for(let i=0;i<22;i++){ const a=i/22*TAU+rng()*0.2, d=9+rng()*4, x=Math.sin(a)*d, z=Math.cos(a)*d, h=0.8+rng()*2.2;
      const m=add(new THREE.ConeGeometry(0.25+rng()*0.35,h,5),glass,x,getH(R.door.x+x,R.door.z+z)-y+h/2-0.15,z); m.rotation.set((rng()-0.5)*0.6,rng()*3,(rng()-0.5)*0.6); }
    const pg=new THREE.CircleGeometry(7,28); pg.rotateX(-Math.PI/2); const pp=pg.attributes.position;
    for(let i=0;i<pp.count;i++) pp.setY(i,getH(R.door.x+pp.getX(i),R.door.z+pp.getZ(i))-y+0.06);
    G.add(new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:au[1],transparent:true,opacity:0.22,depthWrite:false})));
    const light=new THREE.PointLight(au[1].getHex(),LOW?0:1.1,18,2); light.position.y=2.6; G.add(light);
    scene.add(G); addCol(R.door.x,R.door.z,0.9);
    RIFT_VIEWS.push({R,G,orbit,glowM,ring,light});
  }
}
const riftNearest=()=>{ if(!started||PL.dead||dgIn()) return null; return riftDoorNear(P.x,P.z,RIFT_TALK); };
const riftHere=()=>!!riftNearest();
function riftPrompt(tk){ const R=riftNearest(); return 'Press '+tk+': '+R.name+' (a rift: '+RIFT_XP_K+'x XP, solo)'; }
function riftOpenNear(){ const R=riftNearest(); if(!R) return; RIFT_UI.id=R.id; RIFT_UI.info=null; openPanel('rift'); riftRender(); netSend({t:'rift',a:'open'}); UI_SFX.click(); }
NETH.rift=m=>{ if(m.a!=='info') return; RIFT_UI.info=m; RIFT_UI.at=Date.now(); riftRender(); };
const riftEnergyNow=()=>{ const I=RIFT_UI.info; return I?Math.min(RIFT_E_MAX,I.e+(Date.now()-RIFT_UI.at)/RIFT_E_MS):0; };
const riftHms=s=>{ s=Math.max(0,Math.ceil(s)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60); return h?h+' h '+String(m).padStart(2,'0')+' min':m?m+' min':s+' s'; };
function riftRender(){
  const el=$('#riftBody'); if(!el||$('#rift').hidden) return; const I=RIFT_UI.info, R=RIFT_DEFS[RIFT_UI.id];
  if(!I||!R){ el.textContent='The glass hums...'; return; }
  const e=riftEnergyNow(), full=Math.max(0,I.full-(Date.now()-RIFT_UI.at)/1000), canX2=e>=I.cost, low=PL.level<I.lv;
  if(!canX2) RIFT_UI.x2=false;
  el.innerHTML='<p class="rf-blurb"></p>'
    +'<p class="rf-line">The rift fights at <b>your level ('+Math.max(I.lv,PL.level)+')</b>: '+RIFT_WAVES+' waves of glass monsters, each worth <b>'+RIFT_XP_K+'x</b> the XP of the world. Solo only. XP is all it pays.</p>'
    +'<div class="rf-energy"><div class="rf-bar"><i style="width:'+Math.round(100*e/RIFT_E_MAX)+'%"></i></div><span><b>'+Math.floor(e)+'</b> / '+RIFT_E_MAX+' energy'+(full>0?' · full in '+riftHms(full):' · full')+'</span></div>'
    +'<label class="rf-x2'+(canX2?'':' off')+'"><input type="checkbox" id="riftX2"'+(RIFT_UI.x2?' checked':'')+(canX2?'':' disabled')+'> Double reward (costs '+I.cost+' energy): twice the XP for the whole run</label>'
    +'<div class="tr-btns"><button class="chip buy" id="riftGo"'+(low?' disabled':'')+'>'+(low?'Opens at level '+I.lv:'Enter the rift')+'</button></div>'
    +'<p class="tr-note">Energy refills on its own, online or not: '+RIFT_E_MAX+' in '+RIFT_E_FULL_H+' hours. One knock-out sends you back to the hub; a second ends the run. '+(I.clears?'Cleared '+I.clears+' time'+(I.clears>1?'s':'')+(I.best?', best '+dgClockText(I.best):'')+'.':'')+'</p>';
  el.querySelector('.rf-blurb').textContent=R.blurb;
  const cb=el.querySelector('#riftX2'); if(cb) cb.onchange=()=>{ RIFT_UI.x2=cb.checked; };
  const go=el.querySelector('#riftGo'); if(go) go.onclick=()=>{ UI_SFX.click(); netSend({t:'rift',a:'go',x2:RIFT_UI.x2?1:0}); closePanels(); };
}
// the wave banner: riftw [pid, wave]
EVH.riftw=e=>{ if(e[1]!==NET.pid) return; const w=e[2]|0; toast(w>=RIFT_WAVES?'Final wave!':'Wave '+w+' / '+RIFT_WAVES,w>=RIFT_WAVES?'bad':''); if(SND.ready) riftChime({gain:1.4,pan:0}); };
let riftT=0, riftRenderT=0;
function riftUpdate(dt){
  if(!RIFT_VIEWS.length) return; riftT+=dt;
  for(const v of RIFT_VIEWS){ if(Math.abs(v.R.door.x-P.x)>160||Math.abs(v.R.door.z-P.z)>160) continue;
    v.orbit.rotation.y=riftT*0.5; v.ring.rotation.z=Math.sin(riftT*0.7)*0.1; v.glowM.material.opacity=0.28+0.1*Math.sin(riftT*2.3); v.glowM.lookAt(camera.position.x,v.G.position.y+2.6,camera.position.z); }
  if(!$('#rift').hidden){ const R=RIFT_DEFS[RIFT_UI.id]; if(!R||Math.hypot(P.x-R.door.x,P.z-R.door.z)>RIFT_TALK+3) closePanels(); else if((riftRenderT-=dt)<=0){ riftRenderT=1; if(document.activeElement!==$('#riftX2')) riftRender(); } }
}
// the full map's marker for each rift tear in the land being drawn (ctx, world -> canvas, land key, font size, label(), pixel ratio)
function riftMapMarks(x,at,land,fs,label,dpr){
  for(const D of RIFT_DOORS){ if(landAt(D.x,D.z)!==land) continue; const R=RIFT_DEFS[D.id], [cx,cy]=at(D.x,D.z); dot(x,cx,cy,5*dpr,'#7ad0ff'); label(R?R.name:'Rift',cx,cy-fs*1.3,fs,'#c8e8ff',true); label('Rift',cx,cy+fs*0.9,fs*0.85,'#ffb0e0'); }
}
