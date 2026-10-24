//@ Live fire for the zone dressing: smoke, embers and a flickering glow over camp fires and braziers, drifting blue wisps over fox-fire lamps
/* Agent map. genZoneProps (zone-props.js, one marked line in `put`) calls zpfAdd(kind, x, y, z, scale) for every placed 'campfire', 'brazier' and 'foxfire'; the list is keyed by position so a
   chunk that is generated again adds nothing twice. updateZoneFire(dt) (main/loop.js) takes the nearest ZPF_MAX fires within ZPF_NEAR metres of the camera and gives each particles from the
   shared pool (fxpSmoke / fxpAdd, combat/fx-pool.js): grey smoke that rises and swells, embers, and short additive glows that make the flame flicker. The villages' own fires join the list by themselves (zpfScanVillages reads the flame cones in `flames`, buildings.js, and keeps their colour: the dungeon doors' braziers burn blue). The meshes stay the static
   ones in zone-props-models.js. Nothing here is synced or saved; phones (LITE / LOW) get fewer fires and slower smoke. Test: client-smoke (the loop runs it). */
const ZPF_NEAR=LITE?30:(LOW?40:55), ZPF_MAX=LITE?2:(LOW?3:5);
const ZPF_KIND={campfire:{up:0.5,fire:1},brazier:{up:1.55,fire:1},foxfire:{up:1.8,fire:0}};
const ZPF={list:[],seen:new Set(),t:0,fi:0};
function zpfAdd(kind,x,y,z,s){
  const K=ZPF_KIND[kind]; if(!K) return;
  const key=Math.round(x*2)*100003+Math.round(z*2); if(ZPF.seen.has(key)) return; ZPF.seen.add(key);
  ZPF.list.push({kind,x,y:y+K.up*s,z,s,fire:K.fire,acc:Math.random(),acc2:Math.random(),near:0});
}
function zpfScanVillages(){   // the villages' own fires (campfires, braziers, forge coals: the flame cones in `flames`, buildings.js): one fire for each cluster of cones
  for(;ZPF.fi<flames.length;ZPF.fi++){
    const m=flames[ZPF.fi], p=m.position; let dup=false;
    for(const f of ZPF.list) if(Math.abs(f.x-p.x)<0.7&&Math.abs(f.z-p.z)<0.7&&Math.abs(f.y-p.y)<1.2){ dup=true; break; }
    if(!dup&&m.material&&m.material.color) ZPF.list.push({kind:'campfire',x:p.x,y:p.y,z:p.z,s:1,fire:1,acc:Math.random(),acc2:Math.random(),near:0,col:m.material.color.getHex()});
  }
}
function updateZoneFire(dt){
  if(ZPF.fi<flames.length) zpfScanVillages();
  if(!ZPF.list.length||!started||customizing||dgIn()||caveIn()) return;   // cave:
  ZPF.t-=dt; if(ZPF.t>0) return; const T=0.1-ZPF.t; ZPF.t=0.1;   // the fires step ten times a second
  const cx=camera.position.x, cz=camera.position.z, near=[];
  for(const f of ZPF.list){ const d=Math.hypot(f.x-cx,f.z-cz); if(d<ZPF_NEAR){ f.near=d; near.push(f); } }
  if(!near.length) return;
  near.sort((a,b)=>a.near-b.near); if(near.length>ZPF_MAX) near.length=ZPF_MAX;
  const night=envCur.night, wind=0.5+0.4*Math.sin(t*0.2), rate=LOW?0.6:1, cold=inHoar(cx,cz)||inGrey(cx,cz);
  for(const f of near){
    const s=f.s;
    if(f.fire){
      f.acc+=T*3.2*rate; while(f.acc>=1){ f.acc-=1;   // smoke
        fxpSmoke(f.x+AR(-0.08,0.08)*s,f.y+0.1*s,f.z+AR(-0.08,0.08)*s,wind*AR(0.3,0.8),AR(0.9,1.5),wind*AR(-0.3,0.4),cold?0x8a8e94:0x5a5650,0.4*s,AR(2.0,3.0),{drag:0.35,grow:4.2,a:night>0.5?0.14:0.24}); }
      f.acc2+=T*(1.3+Math.random()); if(f.acc2>=1){ f.acc2-=1;   // an ember
        fxpAdd(f.x+AR(-0.15,0.15)*s,f.y+0.05*s,f.z+AR(-0.15,0.15)*s,AR(-0.25,0.25)+wind*0.3,AR(0.9,2.0),AR(-0.25,0.25),(f.col||0xff8a30),0.07*s,AR(0.7,1.4),{g:-0.4,drag:0.5,white:0.2,grow:0.2,a:0.9}); }
      fxpAdd(f.x,f.y+0.12*s,f.z,0,0.15,0,(f.col||0xff9a40),(0.8+0.5*Math.random())*s,0.2,{grow:1.3,a:0.16+0.1*night});   // the flicker of the light on the air
    } else {
      f.acc+=T*1.6*rate; while(f.acc>=1){ f.acc-=1;   // a wisp of fox-fire climbing out of the lamp
        fxpAdd(f.x+AR(-0.1,0.1),f.y,f.z+AR(-0.1,0.1),AR(-0.2,0.2),AR(0.5,1.1),AR(-0.2,0.2),0xa8d8ff,0.1,AR(1.1,1.8),{drag:0.6,white:0.35,grow:0.1,a:0.7}); }
    }
  }
}
