// Headless client test of the four dungeon doors' dressing: runs dist/wildwood.html in Node with a stub DOM/WebGL (tools/headless.js), solo. Build first (python3 build.py).
// Checks: the doors' meshes stand at DG_ENTRANCES' coordinates on the real ground (a ray down onto the terrain mesh), their size and cost, the way to them is free, the sealed look follows
// your gear (also through the real server's zone tier picker), the signposts, the talk prompt (shown within 4.5 m, not beyond) and the talk key (sealed text, "not ready" stub when no board is defined, the
// Delve board's dgBoardOpen otherwise: swapped out here, so this test never opens the real panel), the ground patch (smooth, only near a door), no trees or rocks at a door (chunks grown beside each door), the maps' markers and hover names, the sounds, and
// that none of it threw while the world was made. Usage: node tools/entrances-client-smoke.js
const errs=[]; const realErr=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ')); };
const {bootClient}=require('./headless');
const c=bootClient({expose:['scene','THREE','getH','P','PL','GEAR','NET','startSolo','beginPlay','canStart:()=>canStart','Stream','distToChunk','colGrid','TERRAIN_BANDS','DG_DOORS','DG_ENTRANCES','DG_THEMES',
  'DG_ENT_CLEAR','DG_ENT_TALK','dgApron','dgEntranceNear','dgEntUpdate','dgEntSealed','dgOpenDoor','dgEntTint','dgEntClear','dgEntWater','dgEntSounds','dgEntMapMarks','dgEntMiniMarks','placeName',
  'drawFullMap','mapCX','drawMinimap','mmX','updateTalkUI','promptEl','bTalk','terrainColor','landHere','MAP','villageMat','dgEntMat2','nearRoad','VIL','landAt','dirWord','dgEntList','dgBoardSwap:f=>{ const o=dgBoardOpen; dgBoardOpen=f; return o; }']});   // (dgBoardSwap: game/dungeon/board.js declares dgBoardOpen inside the game, so a test cannot shadow it with a global: it swaps the binding)
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
(async()=>{
  let G=c.G(); for(let i=0;i<400;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('the world streams in with the doors built, and nothing from them threw (no stream failure, no console error)',G.canStart()&&!G.Stream.failed&&errs.length===0,errs.slice(0,2).join(' | '));
  const T=G.THREE, IDS=Object.keys(G.DG_ENTRANCES), faceV=E=>[Math.sin(E.a),Math.cos(E.a)];
  const setGear=(home,east,north,west)=>{ const g=c.G().GEAR; g.zt={home:{on:home,max:home},vale:{on:0,max:0},hoar:{on:0,max:0},grey:{on:0,max:0}}; g.east=east; g.north=north; g.west=west===undefined?north:west; };   // (west follows north unless given: 2 opens the Greyspine)
  const frame=(n,dt)=>{ for(let i=0;i<(n||1);i++) c.G().dgEntUpdate(dt||0.1); };
  const place=(x,z)=>{ const g=c.G(); g.P.x=x; g.P.z=z; g.P.y=g.getH(x,z); };
  // (the villagers' "near" state, which the talk prompt reads, is updated by the next frame: a short wait after moving, then the checks run at once, before the next one)
  const goto=async(x,z)=>{ place(x,z); c.G().NET.send({t:'pos',p:[x,c.G().P.y,z,0,0,0]}); await wait(150); place(x,z); };
  // ---- the meshes ----
  { const bad=[]; for(const id of IDS){ const D=G.DG_DOORS.doors[id], E=G.DG_ENTRANCES[id]; if(!D){ bad.push(id+' missing'); continue; }
      if(Math.hypot(D.G.position.x-E.x,D.G.position.z-E.z)>0.01||Math.abs(D.G.position.y-G.getH(E.x,E.z))>0.01||Math.abs(D.G.rotation.y-E.a)>1e-6) bad.push(id+' misplaced'); }
    ok('each door stands at its DG_ENTRANCES coordinates, on the ground there, turned to face the way it faces',IDS.length===4&&!bad.length,bad.join(', ')); }
  { const need={hollowroots:26,jadesprings:6,bonefrostbarrow:7,blackseam:8}, bad=[], dims=[];
    for(const id of IDS){ const D=G.DG_DOORS.doors[id], E=D.E; D.G.updateMatrixWorld(true); const box=new T.Box3();
      D.G.traverse(o=>{ if(o.isMesh&&(o.material===G.villageMat||o.material===G.dgEntMat2)) box.expandByObject(o); });   // the solid parts (not the mist or the column of light)
      const h=box.max.y-D.y0; dims.push(id+' '+h.toFixed(1)+' m');
      if(h<need[id]) bad.push(id+' only '+h.toFixed(1)+' m'); if(box.min.y>D.y0+0.1||box.min.y<D.y0-9) bad.push(id+' base '+(box.min.y-D.y0).toFixed(1));
      if(E.x<box.min.x||E.x>box.max.x||E.z<box.min.z||E.z>box.max.z) bad.push(id+' does not cover its door'); }
    ok('the Elder is 26 m or more tall, the Falls rock face 6 m, the Barrow 7 m, the Adit 8 m; each reaches below the door\'s ground (no gap under it) and covers its door',!bad.length,bad.join(', ')||dims.join(', ')); }
  { const bad=[]; let n=0; const ray=new T.Raycaster(), down=new T.Vector3(0,-1,0);
    for(const id of IDS){ const D=G.DG_DOORS.doors[id]; if(D.feet.length<9) bad.push(id+' has only '+D.feet.length+' props that stand on the ground');
      for(const [x,y,z] of D.feet){ const b=G.TERRAIN_BANDS.find(q=>x>=q.x0&&x<=q.x1&&z>=q.z0&&z<=q.z1); if(!b){ bad.push(id+' a prop is off the terrain'); continue; }
        ray.set(new T.Vector3(x,y+60,z),down); const hit=ray.intersectObject(b.mesh)[0]; n++; if(!hit||Math.abs(hit.point.y-y)>0.8) bad.push(id+' prop at '+x.toFixed(1)+','+z.toFixed(1)+' is '+(hit?(y-hit.point.y).toFixed(2):'?')+' m off the terrain mesh'); } }
    ok('every prop that stands on the ground (mushrooms, lanterns, boulders, braziers, standing stones, arch roots) rests on the terrain mesh, found by a ray down onto it',!bad.length&&n>=40,n+' props; '+bad.slice(0,3).join('; ')); }
  { const bad=[], cost=[]; let total=0;
    for(const id of IDS){ const D=G.DG_DOORS.doors[id]; total+=D.tris; cost.push(id+' '+D.tris+' tris / '+D.meshes+' meshes'); if(D.tris>14000||D.meshes>16) bad.push(id+' too heavy');
      D.G.traverse(o=>{ if(o.isMesh&&o.geometry){ const a=o.geometry.attributes; if(!a.position||!a.normal) bad.push(id+' a mesh has no normals'); if(o.material.vertexColors&&!a.color) bad.push(id+' a vertex-coloured mesh has no colours'); if(o.isInstancedMesh) bad.push(id+' instanced'); } }); }
    ok('a door is a handful of merged meshes (16 or fewer, 14,000 triangles or fewer, all three under 22,000), every geometry has normals and its colours',!bad.length&&total<22000,cost.join('; ')); }
  { const bad=[]; for(const id of IDS){ const E=G.DG_ENTRANCES[id], [fx,fz]=faceV(E), cols=[]; for(const [d] of [[2.5],[3.5],[4.4],[7]]){ const x=E.x+fx*d, z=E.z+fz*d; let worst=9; const seen=new Set();
        for(let dx=-12;dx<=12;dx+=6) for(let dz=-12;dz<=12;dz+=6){ const a=G.colGrid.get((Math.floor((x+dx)/6)+200)*1000+(Math.floor((z+dz)/6)+200)); if(a) for(let i=0;i<a.length;i+=3){ const k=a[i]+','+a[i+1]; if(seen.has(k)) continue; seen.add(k); worst=Math.min(worst,Math.hypot(a[i]-x,a[i+1]-z)-a[i+2]); } }
        if(worst<0.45) bad.push(id+' blocked '+d+' m in front ('+worst.toFixed(2)+')'); } }
    ok('the way to each door is open: nothing solid within 0.45 m of the spots 2.5, 3.5, 4.4 m in front of it (talk range) or on its apron',!bad.length,bad.join(', ')); }
  // ---- the signposts ----
  { const bad=[]; for(const id of IDS){ const S=G.DG_DOORS.signs[id], E=G.DG_ENTRANCES[id]; if(!S){ bad.push(id+' no sign'); continue; }
      const dx=E.x-E.sign.x, dz=E.z-E.sign.z, d=Math.hypot(dx,dz), tip=[Math.cos(S.G.rotation.y),-Math.sin(S.G.rotation.y)];
      if(Math.hypot(S.G.position.x-E.sign.x,S.G.position.z-E.sign.z)>0.01||Math.abs(S.G.position.y-G.getH(E.sign.x,E.sign.z))>0.01) bad.push(id+' sign misplaced');
      if(tip[0]*dx/d+tip[1]*dz/d<0.999) bad.push(id+' board does not point at the door');
      if(!G.nearRoad(E.sign.x,E.sign.z,6)) bad.push(id+' not on a road');
      if(S.text[0]!==E.name||S.text[1]!==Math.round(d)+' m, '+G.dirWord(dx,dz)) bad.push(id+' text '+S.text.join(' / '));
      let planes=0; S.G.traverse(o=>{ if(o.isMesh&&o.material.map) planes++; }); if(planes!==2) bad.push(id+' board faces '+planes); }
    ok('a signpost stands on the road at each door\'s sign spot, its board points at the door and names it with the distance and direction, on both faces',!bad.length,bad.join(', ')||IDS.map(i=>G.DG_DOORS.signs[i].text.join(' ')).join(' | ')); }
  // ---- the ground patch ----
  { const bad=[], info=[], out=new T.Color(), a=new T.Color(), b=new T.Color();
    for(const id of IDS){ const E=G.DG_ENTRANCES[id], [fx,fz]=faceV(E), cx=E.x+fx*3.5, cz=E.z+fz*3.5, at=d=>{ const x=cx+fx*d, z=cz+fz*d, h=G.getH(x,z); G.DG_DOORS.noTint=true; G.terrainColor(x,z,h,0.3,a); G.DG_DOORS.noTint=false; G.terrainColor(x,z,h,0.3,b); return [Math.max(Math.abs(a.r-b.r),Math.abs(a.g-b.g),Math.abs(a.b-b.b)),a.clone(),b.clone()]; };
      const mid=at(0)[0], far=at(25)[0], far2=at(-25)[0]; let step=0, prev=at(0)[0]; for(let d=0.25;d<=17;d+=0.25){ const v=at(d)[0]; step=Math.max(step,Math.abs(v-prev)); prev=v; }
      info.push(id+' '+mid.toFixed(2)+'/step '+step.toFixed(3)); if(mid<0.07) bad.push(id+' patch too faint'); if(far>1e-9||far2>1e-9) bad.push(id+' tints 25 m away'); if(step>0.07) bad.push(id+' edge steps '+step.toFixed(3)); }
    G.DG_DOORS.noTint=false; ok('the ground patch changes the colour at the door (the Barrow\'s through the Reach\'s own colour function), fades smoothly (no step over 0.07 per 0.25 m), and is gone 25 m away',!bad.length,bad.join(', ')||info.join('; ')); }
  // ---- sealed or open: the real server's tier picker, then gear set directly ----
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  G.NET.send({t:'dev',cmd:'level',v:30}); G.NET.send({t:'dev',cmd:'zt',v:1}); await wait(500);
  place(G.VIL.x,G.VIL.z); G.NET.send({t:'pos',p:[G.P.x,G.P.y,G.P.z,0,0,0]}); await wait(300); G=c.G(); G.NET.send({t:'zt',land:'home',n:0}); await wait(300); frame(40); G=c.G();
  { const E=G.DG_DOORS.doors.hollowroots; ok('through the server: the Elder is sealed at +0 (knotted roots shown, light dull), and the Falls and Barrow doors are sealed until Hanami and Rimehold are walked into',
      G.GEAR.zt.home.on===0&&E.sealed===true&&E.sealMesh.visible&&E.lit<0.3&&IDS.every(id=>c.G().DG_DOORS.doors[id].sealed===true&&c.G().DG_DOORS.doors[id].sealMesh.visible),'on '+G.GEAR.zt.home.on+', lit '+E.lit); }
  G.NET.send({t:'zt',land:'home',n:1}); await wait(400); G=c.G(); place(G.VIL.x,G.VIL.z); frame(50);
  { const E=G.DG_DOORS.doors.hollowroots; ok('through the server: choosing +1 for Wildwood in the village opens the Elder (roots shown open, light up), and +0 seals it again',G.GEAR.zt.home.on===1&&E.sealed===false&&!E.sealMesh.visible&&E.lit>0.95,'lit '+E.lit.toFixed(2)); }
  G.NET.send({t:'zt',land:'home',n:0}); await wait(400); G=c.G(); frame(50); ok('and +0 seals it again (the knots return, the light eases down)',G.DG_DOORS.doors.hollowroots.sealed===true&&G.DG_DOORS.doors.hollowroots.sealMesh.visible&&G.DG_DOORS.doors.hollowroots.lit<0.3);
  { const bad=[]; const rows=[[0,0,0,0,[true,true,true,true]],[1,0,0,0,[false,true,true,true]],[0,2,0,0,[true,false,true,true]],[0,0,2,0,[true,true,false,true]],[0,0,0,2,[true,true,true,false]],[1,2,2,2,[false,false,false,false]],[0,2,2,2,[true,false,false,false]]];
    for(const [home,east,north,west,want] of rows){ setGear(home,east,north,west); frame(60); IDS.forEach((id,i)=>{ const D=c.G().DG_DOORS.doors[id]; if(D.sealed!==want[i]||D.sealMesh.visible!==want[i]||(want[i]?D.lit>0.3:D.lit<0.95)) bad.push('home +'+home+' east '+east+' north '+north+' west '+west+': '+id+' sealed '+D.sealed+' lit '+D.lit.toFixed(2)); }); }
    ok('the look follows the gear for all four doors (Wildwood: played at +1; the Falls: Hanami walked into; the Barrow: Rimehold; the Adit: Highmark) in every combination tried',!bad.length,bad.slice(0,3).join('; ')); }
  { const E1=G.DG_ENTRANCES.bonefrostbarrow, E2=G.DG_ENTRANCES.jadesprings; setGear(1,2,2); place(E1.x,E1.z+8); frame(60); const D1=c.G().DG_DOORS.doors.bonefrostbarrow, col0=D1.column.material.opacity;
    const f0=D1.flames.map(q=>q.f.scale.y); await wait(160); frame(1,0.05); const flick=D1.flames.some((q,i)=>Math.abs(q.f.scale.y-f0[i])>1e-4);
    place(E2.x,E2.z+8); frame(5); const D2=c.G().DG_DOORS.doors.jadesprings, tex=D2.tex.offset.y; frame(10,0.05);
    ok('open, a door lives: the Barrow\'s flames flicker (the game\'s clock moves them) and its column of light shines, the Falls\' curtain scrolls',flick&&col0>0.03&&D2.tex.offset.y!==tex,'flicker '+flick+', column '+col0.toFixed(3)+', curtain '+(D2.tex.offset.y-tex).toFixed(3));
    setGear(0,0,0); place(E1.x,E1.z+8); frame(60); const D3=c.G().DG_DOORS.doors.bonefrostbarrow; ok('and sealed the column goes out and the flames burn low',D3.column.material.opacity<0.005&&D3.flames.every(q=>q.f.scale.y<0.4),'column '+D3.column.material.opacity.toFixed(3)); }
  { let worst=0; for(const id of IDS){ const E=G.DG_ENTRANCES[id]; setGear(1,2,2); place(E.x,E.z+8); frame(5); const t0=process.hrtime.bigint(); for(let i=0;i<300;i++) c.G().dgEntUpdate(0.016); worst=Math.max(worst,Number(process.hrtime.bigint()-t0)/1e6/300); }
    ok('dgEntUpdate is cheap with a door in full animation (under 0.5 ms a frame in Node, no GPU)',worst<0.5,worst.toFixed(3)+' ms'); }
  { G=c.G(); place(G.VIL.x,G.VIL.z); frame(3); ok('a door hides when the hiker is far from it (the Barrow from the village)',G.DG_DOORS.doors.bonefrostbarrow.G.visible===false);
    place(G.DG_ENTRANCES.bonefrostbarrow.x,G.DG_ENTRANCES.bonefrostbarrow.z+5); frame(3); ok('and shows when near',c.G().DG_DOORS.doors.bonefrostbarrow.G.visible===true); }
  // ---- the talk prompt and the talk key ----
  { const bad=[], seen=[]; G=c.G(); G.PL.dead=false;
    for(const id of IDS){ const E=G.DG_ENTRANCES[id], [fx,fz]=faceV(E);
      for(const [d,want] of [[0.5,true],[3.5,true],[4.4,true],[4.6,false],[6,false],[7,false]]){ await goto(E.x+fx*d,E.z+fz*d); setGear(0,0,0); c.G().updateTalkUI(); const g=c.G(), shown=!g.promptEl.hidden&&g.promptEl.textContent.includes(E.name);
        if(shown!==want) bad.push(id+' at '+d+' m: prompt '+(shown?'shown':'hidden')); if(d===3.5){ seen.push(g.promptEl.textContent+' / '+g.bTalk.textContent); if(!/\(sealed\)$/.test(g.promptEl.textContent)||!/^\S+: /.test(g.promptEl.textContent)||g.bTalk.textContent!=='Look') bad.push(id+' sealed prompt '+g.promptEl.textContent); } }
      await goto(E.x+fx*3,E.z+fz*3); setGear(1,2,2); c.G().updateTalkUI(); { const g=c.G(); if(/sealed/.test(g.promptEl.textContent)||!g.promptEl.textContent.includes(E.name)||g.bTalk.textContent!=='Enter') bad.push(id+' open prompt '+g.promptEl.textContent); } }
    ok('the prompt "<key>: <door name>" shows within 4.5 m of a door (with "(sealed)" while shut) and not at 4.6 m, 6 m or on the apron',!bad.length,bad.join('; ')||seen[0]); }
  { const bad=[], toasts=()=>c.el('#toasts')._kids.map(k=>k.textContent), last=()=>toasts().slice(-1)[0]||''; G=c.G();
    const press=async(E,d)=>{ const [fx,fz]=faceV(E); await goto(E.x+fx*d,E.z+fz*d); c.G().updateTalkUI(); const n=toasts().length; c.fireWin('keydown',{code:'KeyE'}); return n; };   // (returns how many toasts there were just before the key)
    const want={hollowroots:/Wildwood opens its dungeon at \+1 difficulty/,jadesprings:/Walk to Hanami/,bonefrostbarrow:/Walk into Rimehold/,blackseam:/Walk into Highmark/};
    for(const id of IDS){ const E=G.DG_ENTRANCES[id]; setGear(0,0,0); const n0=await press(E,3); const t=last(); if(toasts().length<=n0||!t.includes(E.name+' is sealed')||!want[id].test(t)) bad.push(id+' sealed toast: '+t); }
    setGear(1,2,2); { const orig=G.dgBoardSwap(undefined), E=G.DG_ENTRANCES.hollowroots, n0=await press(E,3); if(last()!=='The way is not ready yet'||toasts().length!==n0+1) bad.push('open stub toast: '+last()); c.G().dgBoardSwap(orig); }
    { let got=null; const orig=G.dgBoardSwap(id=>{ got=id; }); for(const id of IDS){ got=null; const n0=await press(G.DG_ENTRANCES[id],3); if(got!==id||toasts().length!==n0) bad.push(id+' board call '+got); } c.G().dgBoardSwap(orig); }
    { let got=null; const orig=G.dgBoardSwap(id=>{ got=id; }); setGear(0,0,0); await press(G.DG_ENTRANCES.hollowroots,3); if(got!==null) bad.push('a sealed door opened the board'); c.G().dgBoardSwap(orig); }
    { let got=null; const orig=G.dgBoardSwap(id=>{ got=id; }); setGear(1,2,2); await press(G.DG_ENTRANCES.hollowroots,6); if(got!==null) bad.push('the talk key worked from 6 m'); c.G().dgBoardSwap(orig); }
    ok('the talk key at a door: sealed -> a toast naming what unlocks it (+1 difficulty, Hanami, Rimehold, Highmark); open -> dgBoardOpen(theme id) when it exists, else the "not ready" toast; nothing from beyond 4.5 m',!bad.length,bad.join('; ')); }
  // ---- the maps ----
  for(let i=0;i<300&&!c.G().MAP.done;i++) await wait(100);
  { G=c.G(); const bad=[], rec=[], styles=[]; ok('the world map is painted',G.MAP.done);
    G.mapCX.fillText=(t)=>{ rec.push(t); }; G.mapCX.strokeText=()=>{}; Object.defineProperty(G.mapCX,'fillStyle',{set(v){ styles.push(v); },get(){ return '#000'; },configurable:true});
    const at={home:[G.VIL.x,G.VIL.z],vale:[G.DG_ENTRANCES.jadesprings.x+30,G.DG_ENTRANCES.jadesprings.z+30],hoar:[G.DG_ENTRANCES.bonefrostbarrow.x,G.DG_ENTRANCES.bonefrostbarrow.z+30],grey:[G.DG_ENTRANCES.blackseam.x,G.DG_ENTRANCES.blackseam.z+30]};
    for(const land of ['home','vale','hoar','grey']){ for(const sealed of [true,false]){ setGear(sealed?0:1,sealed?0:2,sealed?0:2); place(...at[land]); rec.length=0; styles.length=0; c.G().drawFullMap();
        const names=IDS.map(id=>G.DG_ENTRANCES[id]).filter(E=>G.landAt(E.x,E.z)===land).map(E=>E.name), shown=rec.filter(t=>IDS.some(id=>t.startsWith(G.DG_ENTRANCES[id].name)));
        if(shown.length!==1||names.length!==1||shown[0]!==names[0]+(sealed?' (sealed)':'')) bad.push(land+' '+(sealed?'sealed':'open')+': '+shown.join('|')); if(!styles.includes(sealed?'#8d8880':'#f4c542')) bad.push(land+' icon colour'); } }
    ok('the full map draws one door with its name in each land\'s view (Wildwood\'s Elder, the Vale\'s Falls Door, the Reach\'s Barrow Door, the Greyspine\'s Old Adit), grey with "(sealed)" while shut',!bad.length,bad.join('; '));
    const bad2=[]; for(const id of IDS){ const E=G.DG_ENTRANCES[id]; setGear(0,0,0); const s=c.G().placeName(E.x+5,E.z+5), o=c.G().placeName(E.x+40,E.z+40); setGear(1,2,2); const s2=c.G().placeName(E.x,E.z);
      if(!s.startsWith(E.name+': the way into ')||!/\(sealed\)$/.test(s)||/sealed/.test(s2)||o.startsWith(E.name)) bad2.push(id+': '+s+' | '+s2+' | '+o); }
    ok('hovering a door on the map names it and its dungeon (sealed or not) within 16 m, and only there',!bad2.length,bad2.join('; '));
    const mm=[]; Object.defineProperty(G.mmX,'fillStyle',{set(v){ mm.push(v); },get(){ return '#000'; },configurable:true}); setGear(0,0,0); place(G.DG_ENTRANCES.hollowroots.x+20,G.DG_ENTRANCES.hollowroots.z); c.G().drawMinimap(); const sealedIcon=mm.includes('#8d8880');
    mm.length=0; setGear(1,2,2); c.G().drawMinimap(); const openIcon=mm.includes('#f4c542'); mm.length=0; place(G.VIL.x,G.VIL.z); c.G().drawMinimap();
    ok('the minimap shows a door within its range (grey sealed, gold open) and none far from every door',sealedIcon&&openIcon&&!mm.includes('#f4c542')&&!mm.includes('#8d8880')); }
  // ---- the sounds ----
  { G=c.G(); const E=G.DG_ENTRANCES.jadesprings; ok('the Falls Door\'s cascade raises the water loop near it (0.8 or more at the door, fading to nothing by 100 m)',G.dgEntWater(E.x,E.z)>=0.8&&G.dgEntWater(E.x+100,E.z)===0&&G.dgEntWater(E.x+40,E.z)>0.1);
    let threw=null; try{ G.dgEntSounds(()=>true,()=>({pan:0,gain:1})); }catch(e){ threw=e; } ok('the door sounds do nothing (and do not throw) while the audio is not running',!threw,String(threw||'')); }
  // ---- no trees or rocks at a door: chunks grown beside each door, then every collider within DG_ENT_CLEAR is the door\'s own ----
  G.NET.send({t:'dev',cmd:'vale',v:2}); G.NET.send({t:'dev',cmd:'north',v:2}); G.NET.send({t:'dev',cmd:'west',v:2}); await wait(300);
  for(const id of IDS){ const E=c.G().DG_ENTRANCES[id], g0=c.G(); place(E.x,E.z+3); g0.NET.send({t:'pos',p:[g0.P.x,g0.P.y,g0.P.z,0,0,0]});
    for(let i=0;i<400;i++){ await wait(50); const g=c.G(); g.P.x=E.x; g.P.z=E.z+3; if(!g.Stream.job&&!g.Stream.pending.some(ci=>g.distToChunk(ci,E.x,E.z)<60)) break; }
    const g=c.G(), D=g.DG_DOORS.doors[id], mine=new Set(D.cols.map(q=>q[0].toFixed(3)+','+q[1].toFixed(3))), sg=g.DG_DOORS.signs[id], R=g.DG_ENT_CLEAR; const inRing=[], theirs=[]; let ring=0;
    for(const [k,a] of g.colGrid) for(let i=0;i<a.length;i+=3){ const x=a[i], z=a[i+1], d=Math.hypot(x-E.x,z-E.z); const key=x.toFixed(3)+','+z.toFixed(3);
      if(d<R-0.5&&!mine.has(key)) theirs.push([x.toFixed(1),z.toFixed(1),a[i+2].toFixed(1)].join(',')); if(d>=R&&d<R+14) ring++; if(Math.hypot(x-sg.x,z-sg.z)<2.4&&Math.hypot(x-sg.x,z-sg.z)>0.05) inRing.push(key); }
    ok(id+': no tree or rock collider within '+R+' m of the door (the forest beyond it is there: '+ring+' within 14 m past the edge) and none by its signpost',!theirs.length&&!inRing.length&&(id==='bonefrostbarrow'||ring>0),theirs.slice(0,3).join(' ')+' '+inRing.slice(0,2).join(' ')); }
  { G=c.G(); ok('dgEntClear: true at a door and at a signpost, false 30 m from either',IDS.every(id=>{ const E=G.DG_ENTRANCES[id]; return G.dgEntClear(E.x+3,E.z+3)&&G.dgEntClear(E.sign.x+1,E.sign.z)&&!G.dgEntClear(E.x+30,E.z)&&!G.dgEntClear(E.sign.x+30,E.sign.z); })); }
  { const G2=c.G(); const here=id=>{ const E=G2.DG_ENTRANCES[id], A=G2.dgApron(E); return Math.hypot(c.G().P.x-A.x,c.G().P.z-A.z)<=1.5; }; const out=[];
    for(const [btn,id] of [['#tDoorElder','hollowroots'],['#tDoorFalls','jadesprings'],['#tDoorBarrow','bonefrostbarrow'],['#tDoorMine','blackseam']]){ c.el(btn).click(); await wait(500); if(!here(id)) out.push(id+' '+c.G().P.x.toFixed(1)+','+c.G().P.z.toFixed(1)); }
    ok('the testing tool\'s door buttons put you on each door\'s apron (the Vale\'s and the Reach\'s open the way first)',!out.length,out.join(' | ')); }
  ok('the whole run threw nothing (no stream failure, no console error)',!c.G().Stream.failed&&errs.length===0,errs.slice(0,2).join(' | '));
  c.stop(); console.error=realErr; console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
