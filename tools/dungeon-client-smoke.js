// Headless test of a dungeon run's client (game/dungeon/*.js): runs dist/wildwood.html in Node with a stub DOM / WebGL (tools/headless.js), solo, the world server in the page. Build first (python3 build.py).
// Checks: every prop kind of the three themes builds (and an unknown kind draws a rock), the run built from the tp at its slot (meshes, cost, lights), the forest switched off and given back exactly
// (sky, water, sun shadow, camera far plane, fog, streaming, weather, motes), walls stop you (and the server agrees), the camera's arm shortens at a wall, the run's monsters with their level and health,
// the boss bar for a run boss, the HUD text from the dg snapshot, objectives (marker, label, use prompt, done, removed), the boss's appearance, the party frame / invite / panel / map colour,
// the revive cast bar, the downed screen, the results panel, both maps in a run, the Testing tools' row, leaving through the HUD button, everything disposed.  Usage: node tools/dungeon-client-smoke.js
const errs=[]; const realErr=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ')); };
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','canStart:()=>canStart','P','PL','MONS','DG_RUN:()=>DG_RUN','DG_VIEW','DG_LOOK','DG_MINI','DG_HUD_EL','DG_THEMES','DG_MISSIONS','DG_PROP_KINDS','DG_CAM',
  'dgLayout','dgBake','dgFree','dgViewBuild','dgViewClear','dgIn','dgUseNear','dgHudText','dgDownText','dgPartyState','dgPartyCol','dgUsePrompt','scene','camera','sky','water','sun','Stream','streamPump',
  'getH','updatePlayer','updateCamera','updateEnv','keys','applyEvent','applySnap','CAST','castBar','cbName','playerDown','playerUp','drawMinimap','drawFullMap','monTierK','musicThemeHere','updateBossUI',
  'BOSS','ITEM','TERRAIN_BANDS','cullChunks','motes','THREE','WX','updateWeather','promptEl','bTalk','updateTalkUI','thirdPerson:()=>thirdPerson','DG_STEP','DG_CELL','dgPtyOpen','dgHudTick','updateMonsters']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const el=s=>document.querySelector(s);
(async()=>{
  let G=c.G(); for(let i=0;i<400;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  ok('solo world up',G.NET.ready&&G.MONS.length>400);
  // ---- every prop kind of the three themes builds (several missions and seeds until each legend kind has been drawn), an unknown kind draws a rock ----
  { const T=G.THREE, miss=[], made={};
    for(const th of ['hollowroots','jadesprings','bonefrostbarrow']){ const want=new Set(Object.values(G.DG_THEMES[th].legend).map(e=>e.prop)), seen=new Set();
      for(const m of Object.keys(G.DG_MISSIONS)) for(let seed=1;seed<4&&seen.size<want.size;seed++){ const lay=G.dgLayout({mission:m,seed,theme:th}); if(!lay) continue; const B=G.dgBake(lay);
        G.dgViewBuild({B,T:G.DG_THEMES[th],ox:9000,oz:0,y:10,seed,lay}); for(const k in G.DG_VIEW.kinds) seen.add(k); for(const k of Object.keys(G.DG_VIEW.kinds)) if(G.DG_PROP_KINDS[k]&&G.DG_PROP_KINDS[k].wall) seen.add(k);
        for(const pr of B.props) if(G.DG_PROP_KINDS[pr.k]&&G.DG_PROP_KINDS[pr.k].wall) seen.add(pr.k);
        made[th]=(made[th]||0)+1; G.dgViewClear(); }
      for(const k of want) if(!seen.has(k)||!G.DG_PROP_KINDS[k]) miss.push(th+':'+k); }
    ok('every prop kind in the three themes\' legends has a builder and was drawn without an error',!miss.length&&!errs.length,miss.join(', ')||JSON.stringify(made));
    const lay=G.dgLayout({mission:'purge',seed:3,theme:'bare'}), B=G.dgBake(lay); B.props.push({k:'nosuchthing',x:B.start.x+3,z:B.start.z},{k:'nosuchthing',x:B.start.x-3,z:B.start.z});
    G.dgViewBuild({B,T:null,ox:9000,oz:0,y:10,seed:3,lay}); ok('a prop kind no builder knows draws a rock (and the bare test set builds without a palette)',G.DG_VIEW.kinds.nosuchthing===2&&G.DG_VIEW.meshes>=3&&!errs.length); G.dgViewClear();
    let left=0; G.scene.traverse(o=>{ if(o.name==='dungeon') left++; }); ok('dgViewClear takes the group out of the scene',left===0&&!G.DG_VIEW.g); }
  // ---- into a run, from the Testing tools' row ----
  G.NET.send({t:'dev',cmd:'level',v:50}); await wait(200);
  ok('the Testing tools\' Dungeons row lists every theme and the seven missions',(el('#tDgTheme').innerHTML.match(/<option/g)||[]).length===Object.keys(G.DG_THEMES).length&&(el('#tDgMission').innerHTML.match(/<option/g)||[]).length===7);
  const lights0=(()=>{ let n=0; G.scene.traverse(o=>{ if(o.isPointLight&&o.parent===G.scene) n++; }); return n; })();
  const save={far:G.camera.far,fogFar:G.scene.fog.far,fogCol:G.scene.fog.color.getHex(),near:G.scene.fog.near,sky:G.sky.visible,water:G.water.visible,cast:G.sun.castShadow};
  el('#tDgTheme').value='hollowroots'; el('#tDgMission').value='purge'; el('#tDgGo').click(); await wait(900); G=c.G();
  const R=G.DG_RUN(), srv=G.NET.server, sp=()=>srv.players.get('you');
  ok('the run starts: the client rebuilt the same grid and stands where the server put it, in the run\'s slot',!!R&&!!R.B&&sp().inst===R.id&&Math.abs(G.P.x-sp().x)<0.01&&Math.abs(G.P.z-sp().z)<0.01&&G.P.y===R.y&&G.getH(G.P.x,G.P.z)===R.y,R&&R.th+' '+R.ox+','+R.oz);
  { let g=null; G.scene.traverse(o=>{ if(o.name==='dungeon') g=o; });
    ok('the dungeon\'s meshes are in the scene at the slot: 3-5 meshes (floor, walls and props, glow, soft), under 120k triangles',!!g&&g.position.x===R.ox&&g.position.z===R.oz&&G.DG_VIEW.meshes>=3&&G.DG_VIEW.meshes<=5&&G.DG_VIEW.tris<120000,G.DG_VIEW.meshes+' meshes, '+Math.round(G.DG_VIEW.tris)+' triangles');
    let bare=0; g.traverse(o=>{ if(o.isMesh&&o.geometry.attributes.position&&!o.geometry.attributes.normal) bare++; if(o.isInstancedMesh) bare++; }); ok('every mesh has normals and none is instanced',bare===0); }
  for(let i=0;i<3;i++){ G.updateEnv(0.05); G.cullChunks(0.05); G.updateWeather(0.05); }
  { let terrain=0; for(const b of G.TERRAIN_BANDS) if(b.mesh.visible) terrain++;
    ok('the forest is off: no sky dome, water, sun shadow or terrain tiles; the far plane is short; the fog is the theme\'s; no rain; motes hidden',!G.sky.visible&&!G.water.visible&&!G.sun.castShadow&&terrain===0&&G.camera.far===140&&G.scene.fog.color.getHex()===G.DG_THEMES.hollowroots.pal.fog&&G.scene.fog.far<=45&&G.WX.inten===0&&!G.motes.visible,'terrain tiles shown '+terrain+', fog '+G.scene.fog.far);
    const j=G.Stream.job, n=G.Stream.pending.length; G.streamPump(50); ok('no chunks are grown in a run',G.Stream.job===j&&G.Stream.pending.length===n); }
  { let pl=0; G.scene.traverse(o=>{ if(o.isPointLight&&o.parent===G.scene) pl++; }); ok('a torch and two lamps (a desktop) light the run',pl===lights0+3&&G.DG_LOOK.torch.parent===G.scene,pl+' point lights'); }
  ok('the run plays its theme\'s music',G.musicThemeHere()===G.DG_THEMES.hollowroots.music);
  { const ms=G.MONS.filter(m=>m.dgK); ok('the run\'s monsters have views with the run\'s level and their health from the roster',ms.length>3&&ms.every(m=>G.monTierK(m).lv===R.L&&m.maxHp>m.def.hp*0.99&&m.y===R.y),ms.length+' monsters, lv '+(ms[0]&&G.monTierK(ms[0]).lv)); }
  // ---- walls ----
  const B=R.B, loc=()=>[G.P.x-R.ox,G.P.z-R.oz];
  let dir=null; { const [x0,z0]=loc(); let bd=99; for(let a=0;a<8;a++){ const dx=Math.sin(a/8*Math.PI*2), dz=Math.cos(a/8*Math.PI*2); for(let d=0.5;d<14;d+=0.25) if(!G.dgFree(B,x0+dx*d,z0+dz*d,0.32)){ if(d<bd){ bd=d; dir={dx,dz,d}; } break; } } }
  ok('a wall is in reach of the entrance',!!dir&&dir.d>1,dir&&dir.d.toFixed(1)+' m');
  { const [x0,z0]=loc(); G.P.yaw=Math.atan2(-dir.dx,-dir.dz); G.keys.KeyW=true; for(let i=0;i<90;i++) G.updatePlayer(0.05); await wait(400); G.keys.KeyW=false; G=c.G();
    const [x1,z1]=loc(), went=(x1-x0)*dir.dx+(z1-z0)*dir.dz;
    ok('walking into a wall for 4.5 s stops at it (the walk would have gone 19 m)',G.dgFree(B,x1,z1,0.3)&&went<dir.d&&went>dir.d-1.6,'went '+went.toFixed(2)+' m of '+dir.d.toFixed(2));
    await wait(300); ok('the server has you where the client does',Math.hypot(sp().x-G.P.x,sp().z-G.P.z)<0.35,Math.hypot(sp().x-G.P.x,sp().z-G.P.z).toFixed(2)+' m apart'); }
  { const [x1,z1]=loc(); G.P.x-=dir.dx*1.2; G.P.z-=dir.dz*1.2; G.P.yaw=Math.atan2(dir.dx,dir.dz); G.P.pitch=0; for(let i=0;i<20;i++) G.updateCamera(0.05); const d=Math.hypot(G.camera.position.x-G.P.x,G.camera.position.z-G.P.z);
    ok('with the wall behind you the camera\'s arm shortens (in front of the wall, not through it)',G.thirdPerson()&&d<2&&G.dgFree(B,G.camera.position.x-R.ox,G.camera.position.z-R.oz,0.1),'arm '+d.toFixed(2)+' m');
    G.P.yaw+=Math.PI; await wait(700); G=c.G(); G.updateCamera(0.05); const d2=Math.hypot(G.camera.position.x-G.P.x,G.camera.position.z-G.P.z); ok('turned round, it eases back out',d2>4,'arm '+d2.toFixed(2)+' m'); }
  // ---- HUD ----
  await wait(300); G=c.G();
  { const tx=G.dgHudText(R.m,G.DG_RUN().dg); ok('the HUD shows the mission\'s text from the dg snapshot (shared/dungeon-hud.js)',el('#dgHudTitle').textContent===tx.title&&!el('#dgHud').hidden&&/Monsters slain: 0 \//.test(JSON.stringify(tx.lines)),tx.title+' | '+tx.lines.join(' / '));
    G.applySnap({dg:[0,95,0,4,12]}); G.dgHudTick(0.016); ok('a new dg tuple redraws it, and the clock follows the server\'s seconds',el('#dgHudLines')._kids.some(k=>k.textContent==='Monsters slain: 4 / 12')&&/^1:3[45]$/.test(el('#dgHudTime').textContent),el('#dgHudTime').textContent); }
  // ---- objectives ----
  { const me=G.NET.pid, x=G.P.x+1, z=G.P.z;
    G.applyEvent(['dgo',901,'chest',x,z,1,2]); G.applyEvent(['dgo',902,'stone',x+30,z,1,40]); const o=G.DG_RUN().objs.get(901);
    const st=G.DG_RUN().objs.get(902); ok('objectives (dgo) get a marker and a label in the dungeon\'s own words; a share (the stone\'s health) shows as a bar, a chest\'s number does not',!!o&&!!o.view&&!!o.lbl&&G.DG_VIEW.objs===2&&o.lbl.dgName.textContent==='Reward chest'&&o.lbl.dgBar.hidden&&st.lbl.dgName.textContent==='the Heartwood Knot'&&!st.lbl.dgBar.hidden,st.lbl.dgName.textContent);
    const u=G.dgUseNear(); G.updateTalkUI(); ok('standing at it, the talk key would open it and the prompt says so',u&&u.k==='obj'&&u.id===901&&/to open Reward chest/.test(G.promptEl.textContent),G.promptEl.textContent);
    G.applyEvent(['dgo',901,'chest',x,z,2,0]); ok('done: green, no beam, no longer offered',!o.view.userData.beam.visible&&(!G.dgUseNear()||G.dgUseNear().k!=='obj'));
    G.applyEvent(['dgo',901,'chest',x,z,0,0]); G.applyEvent(['dgo',902,'stone',x+30,z,0,0]); ok('removed: marker and label gone',G.DG_VIEW.objs===0&&!G.DG_RUN().objs.has(901)&&!o.view&&!o.lbl);
    G.applyEvent(['dgo',904,'ping',x+5,z,1,1]); G.applyEvent(['dgo',904,'ping',x+9,z+2,1,2]); const pg=G.DG_RUN().objs.get(904);
    ok('a moving objective (the quarry\'s ping, the captive) is moved, not doubled',G.DG_VIEW.objs===1&&Math.abs(pg.view.position.x-(x+9-R.ox))<1e-6&&pg.v===2); G.applyEvent(['dgo',904,'ping',x+9,z+2,0,0]);
    { let threw=null; try{ G.applyEvent(['tele',950,'root',x,z,2,1.2,0,0]); G.applyEvent(['tele',951,'prison',x,z,1.8,3,0,me]); for(let i=0;i<5;i++) G.updateMonsters(0.05); }catch(e){ threw=e.message; }
      const pr=G.BOSS.tele.get(951); ok('the hazards\' telegraphs (root spikes, a prison that follows you) draw on the run\'s floor',!threw&&G.BOSS.tele.has(950)&&pr&&Math.abs(pr.x-G.P.x)<1e-6&&Math.abs(pr.fill.position.y-(R.y+0.08))<1e-6,threw||'');
      G.applyEvent(['tend',950,1,x,z]); G.applyEvent(['tend',951,0,x,z]); ok('and end',!G.BOSS.tele.has(950)&&!G.BOSS.tele.has(951)); }
    const B0=G.DG_RUN().B.boss; G.applyEvent(['dgb',777001,R.ox+B0.x,R.oz+B0.z,20,'amanita']); G.applySnap({dg:[1,120,0,12,12]}); G.dgHudTick(0.016);
    ok('the boss appears (dgb): the HUD says so and an arrow points to its hall',!!G.DG_RUN().boss&&el('#dgHudTitle').textContent==='The boss has appeared!'&&G.DG_HUD_EL.arrows.some(a=>!a.hidden));
    const bx=G.P.x, bz=G.P.z; G.applyEvent(['spawn',[777002,'amanita',bx,bz,1,bx,bz,0,1,30,46800]]); G.applySnap({b:[[777002,1,1,0,0,0,3,0]]});
    const bm=G.MONS.find(m=>m.id===777002); ok('a run boss gets the boss bar with the run\'s level and its party health',!!bm&&G.updateBossUI()&&!el('#bossbar').hidden&&el('#bbLv').textContent==='Lv 30 boss'&&bm.maxHp===46800,el('#bbLv').textContent);
    G.applyEvent(['despawn',777002]); }
  // ---- party ----
  { const me=G.NET.pid;
    G.applyEvent(['pty',me,me,[[me,'Me',100,100,50,0,R.id],[4242,'Ann',0,120,29,1,R.id],[4343,'Bo',90,100,31,0,0]]]);
    const rows=el('#dgPtyFrame')._kids; ok('the party frame shows the others: Ann down, Bo away in the world; the board reads dgPartyState',!el('#dgPtyFrame').hidden&&rows.length===2&&/down/.test(rows[0].className)&&!/away/.test(rows[0].className)&&/away/.test(rows[1].className)&&G.dgPartyState.list.length===3&&G.dgPartyState.lead===me,rows.map(r=>r.className).join(' | ')+' run '+R.id);
    ok('party members get their own colour on the maps',G.dgPartyCol(4242)==='#7ef0a0'&&G.dgPartyCol(me)===''&&G.dgPartyCol(99)==='');
    G.applyEvent(['ptyi',me,4242,'Ann',30]); ok('an invite shows the prompt with who sent it',!el('#dgPtyInv').hidden&&/Ann invites you/.test(el('#dgPtyInvText').textContent));
    c.fireWin('keydown',{code:'Backspace',target:{tagName:'BODY'}}); ok('the decline key answers it',el('#dgPtyInv').hidden);
    G.dgPtyOpen('Cy'); ok('the party panel opens (P, the frame or a name tag) with the leader\'s buttons and the name filled in',!el('#dgPty').hidden&&el('#dgPtyBody')._kids.some(k=>k.dataset&&k._kids&&k._kids.some(b=>b.dataset&&b.dataset.ptya==='kick'))&&el('#dgPtyBody')._kids.some(k=>k._kids&&k._kids.some(i=>i.value==='Cy')));
    let threw=null; try{ G.applyEvent(['cast',me,-1,3,4242]); }catch(e){ threw=e.message; }   // (as a resource node's cast it threw: NODES[-1])
    ok('the revive channel (cast with node -1) shows the cast bar for the reviver, and nothing throws',!threw&&G.CAST.on&&!G.castBar.hidden&&G.cbName.textContent==='Reviving Ann',threw||'');
    G.applyEvent(['dgo',903,'heartroot',G.P.x,G.P.z,1,0]); G.applyEvent(['cast',me,-2,2,903]); ok('a kit\'s channel (cast with node -2) shows the bar with the objective\'s name',G.CAST.on&&G.cbName.textContent==='a heartroot',G.cbName.textContent); G.applyEvent(['dgo',903,'heartroot',G.P.x,G.P.z,0,0]); }
  // ---- down, results, maps ----
  { G.playerDown(); await wait(120); const tx=G.dgDownText(G.DG_RUN());
    ok('downed in a run: the screen says a teammate can revive you, with the bleed-out clock and the respawns left',G.PL.dead&&/teammate can revive you/.test(tx)&&/2 respawns left/.test(tx),tx);
    G.playerUp(); }
  { const me=G.NET.pid, ids=Object.keys(G.ITEM).filter(k=>/7-/.test(k)).slice(0,2);
    G.applyEvent(['dge',me,1,95,1234,560,ids,12,'']); ok('the results panel (dge): cleared, time, XP, coins, the items by name',!el('#dgResult').hidden&&el('#dgResultTitle').textContent==='Cleared!'&&/1:35/.test(el('#dgResultStats').textContent)&&el('#dgResultItems')._kids.length===Math.max(1,ids.length),el('#dgResultStats').textContent); }
  { let threw=null; try{ G.drawMinimap(); G.drawFullMap(); }catch(e){ threw=e.message; } ok('both maps draw the run (explored tiles, marks) instead of the world',!threw&&G.DG_MINI.n>=1&&/Hollow Roots/.test(el('#mapHere').textContent),threw||el('#mapHere').textContent); }
  // ---- leaving through the HUD's button (tapped twice) ----
  const geos=G.DG_VIEW.geos.slice(), mats=G.DG_VIEW.mats.slice(); let disposed=0; for(const g of [...geos,...mats]){ const f=g.dispose.bind(g); g.dispose=()=>{ disposed++; f(); }; }
  el('#dgLeave').click(); el('#dgLeave').click(); await wait(700); G=c.G();
  for(let i=0;i<3;i++){ G.updateEnv(0.05); G.cullChunks(0.05); }
  { let g=0; G.scene.traverse(o=>{ if(o.name==='dungeon') g++; }); let pl=0; G.scene.traverse(o=>{ if(o.isPointLight&&o.parent===G.scene) pl++; });
    ok('leaving: back in the world (the server too), the run\'s monsters gone',!G.dgIn()&&sp().inst===0&&!G.MONS.some(m=>m.dgK)&&G.P.x<1000);
    ok('every geometry and material of the dungeon disposed, the group and the lights out of the scene',g===0&&pl===lights0&&disposed===geos.length+mats.length,disposed+' of '+(geos.length+mats.length));
    ok('the world\'s look is given back exactly: far plane, fog near, sky, water, sun shadow, motes; the fog is the world\'s again',G.camera.far===save.far&&G.scene.fog.near===save.near&&G.sky.visible===save.sky&&G.water.visible===save.water&&G.sun.castShadow===save.cast&&G.motes.visible&&G.scene.fog.far>100&&G.scene.fog.color.getHex()!==G.DG_THEMES.hollowroots.pal.fog,'fog far '+G.scene.fog.far);
    ok('the HUD and the labels are gone, the results stay to be read',el('#dgHud').hidden&&G.DG_HUD_EL.lbls.size===0&&!el('#dgResult').hidden); }
  ok('nothing logged an error',errs.length===0,errs.slice(0,3).join(' | '));
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
