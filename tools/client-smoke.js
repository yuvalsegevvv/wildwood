// Headless client test: runs dist/wildwood.html in Node with a stub DOM/WebGL (tools/headless.js) and plays solo through the real
// client code. Build first (python3 build.py). Needs the three package (npm install). Prints PASS/FAIL lines.
// Usage: node tools/client-smoke.js
const {bootClient}=require('./headless');
const c=bootClient({expose:['closePanels','WZ0','WZ1','WX1','wmapOpen','wmapToggle','wmapClick','wmapGo','wmapPin','wmapFit','wmapUpdate','wmapRegionAt','wmapPip','wmapEdgeDist','WM','WMAP_REG','WMAP_ISLES','WMAP_TOWNS','WMAP_BANNER','WMAP_BANKS','WMAP_LOCK','mapLand:()=>mapLand','VIL2','WX0','slopeBlock','SLOPE_MAX','TUN','bridgeDeck','valeOpen','borderX','borderZ','riverK','FALL','fallProfile','GF','buildGreyfall','updateGreyfall','NET','mqTarget','mqLogRow','mqMark','odranHere','MQ_BY_ID','VIL4','LORE_BY_ID','updateZoneLabel','mapEdgeAlpha','GREY_HM','GREY_QUEEN','greySnowAmt','drawFullMap','drawMinimap','mapCX','landOpen','CHAM','chamoisUpdate','chamoisOK','GLEN','GREY_GATES','slotIcon','PENDANT_STATS','itemStat','HALF','GREY','updateGreyspine','startSolo','scene','beginPlay','MONS','P','PL','CB','GEAR','MAP','CHAT','WX','doAttack','equip','updateMonsters','updateCombat','updateWeather','openSkills','openSoul','PASSIVE_IDS','attackVisuals','applyEvent','SKILLS','ANIM_OF','BOSS_SKILLS','AREA_FX','BOLTS','ACT_SKILL','renderInv','sendChat','openChat','chatText','getH','canStart:()=>canStart','camera','VIL','VIL2','VIL3','PASS','NODES','NODE_VIEWS','NODE_KINDS','NODE_TAKEN','nearNode','nodePrompt','gatherNode','openLodge','openTravel','nearCircle','CIRCLES','snowfall','rain','musicThemeHere','landHere','LANDS','ZONES','northOpen','updateHoarfrost','updateNodes','updateAurora','AURORA','HOAR','terrainColor','worldBounds','HZ0','ITEM','itemIcon','craftHtml','renderBrew','openBrew','openShop','renderShop','panelNPC:()=>panelNPC','drinkPotion','onPotionEvent','updatePotBar','POT_ST','potBar','MQ','CAST','castBar','updateNodes','monTierK','zoneLvText','zoneTierOn','renderTierRow','landOfZone','landAt',
  'DG_RUN:()=>DG_RUN','DG_VIEW','DG_THEMES','dgFree','dgIn','dgHudText','dgHudTick','dgDownText','sky','water','sun','updateCamera','updateEnv','updatePlayer','applySnap','keys','TERRAIN_BANDS','cullChunks','playerDown','playerUp']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const el=s=>document.querySelector(s);
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('world streams in',G.canStart());
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  ok('solo server: welcome and monster views',G.NET.ready&&G.MONS.length>400,G.MONS.length+' views');
  const s=G.MONS.find(m=>m.def.id==='slime'); G.P.x=s.x+1.5; G.P.z=s.z; G.P.y=G.getH(G.P.x,G.P.z);
  for(let i=0;i<120&&!s.dead;i++){ G.CB.target=s; G.P.yaw=Math.atan2(-(s.x-G.P.x),-(s.z-G.P.z)); G.doAttack('basic'); G.updateMonsters(0.033); G.updateCombat(0.033); await wait(33); }
  G=c.G(); ok('attack through the server kills a slime',s.dead,'xp '+G.PL.exp.toFixed(1));
  G.equip('bow1'); await wait(300); ok('equip round-trip',c.G().GEAR.eq.weapon==='bow1');
  el('#inv').hidden=false; G.renderInv(); ok('inventory renders body slots, the ring and pendant slots and the three tool slots',(el('#invBody').innerHTML.match(/class="eqslot"/g)||[]).length===10&&['pick','axe','sickle','ring','pendant'].every(k=>el('#invBody').innerHTML.includes('data-slot="'+k+'"')));
  G.openSkills(); ok('skills panel renders 3 slots',(el('#skBody').innerHTML.match(/class="sk-slot/g)||[]).length===3);
  { const h=()=>el('#skBody').innerHTML; ok('skills panel: a tab for 1, 2, 3 and Passive, and three passive slots',(h().match(/data-skkind=/g)||[]).length===4&&(h().match(/class="sk-pslot/g)||[]).length===3);
    ok('an unowned boss skill shows as Boss in the grid and cannot be bought',/data-id="spore"[^>]*>(?:(?!<\/button>)[\s\S])*<span class="lv">Boss<\/span>/.test(h())&&!/data-buyskill="spore"/.test(h()),G.GEAR.eq.weapon);
    G.NET.send({t:'dev',cmd:'level',v:20}); G.NET.send({t:'dev',cmd:'skills'}); G.NET.send({t:'dev',cmd:'mats'}); await wait(600); G=c.G();
    G.openSkills(null,'pass'); ok('passives tab lists every passive, Vitality is in a slot',(h().match(/data-from="grid"/g)||[]).length===G.PASSIVE_IDS.length&&(h().match(/class="sk-pslot on/g)||[]).length===1,G.GEAR.skills.pass.join());
    G.openSkills(null,'skill'); ok('a skill tile shows its level and element',/class="sk-tile[^"]*has-el[^"]*"[^>]*data-id="volley"[^>]*data-from="grid"/.test(h()),G.GEAR.eq.weapon);
    G.openSoul(); ok('soul shrine lists the seven elements',(el('#soBody').innerHTML.match(/data-soul=/g)||[]).length===7&&!/disabled/.test(el('#soBody').innerHTML));
    el('#inv').hidden=false; G.renderInv(); ok('inventory lists monster drops',(el('#invBody').innerHTML.match(/class="mat"/g)||[]).length>=30&&G.GEAR.mats.slime>=20);
    // every boss skill drawn through the real client code (swing, projectile, zone, beam, chain, buff)
    { const ids=Object.values(G.BOSS_SKILLS).flat(), me=G.NET.pid, base=()=>G.CB.fx.length+G.CB.projs.length+G.AREA_FX.size+G.BOLTS.length; let bad=[]; G.P.x=G.MONS[0].x; G.P.z=G.MONS[0].z;
      for(let i=0;i<ids.length;i++){
        const id=ids[i], s=G.SKILLS[id], f=s.fx, k=s.act[0], b0=base(), x0=G.P.x+2, y0=G.P.y+1.4, z0=G.P.z, evs=[];
        G.attackVisuals({kind:G.ANIM_OF[k]||k,sk:k},null);
        if(f.proj) evs.push(['proj',900+i,f.proj.kind,x0,y0,z0,-20,0,0,null],['pend',900+i,x0-6,y0,z0,null]);
        if(f.zone||(f.proj&&f.proj.zone)) evs.push(['area',500+i,'zone',x0,z0,5,3,me,s.el,(f.zone&&f.zone.once?1:0)|(f.zone&&f.zone.follow?2:0)]);
        if(f.beam) evs.push(['beam',x0,y0,z0,x0-20,y0,z0,s.el,1.4]);
        if(f.chain) evs.push(['chain',[[x0,y0,z0],[x0-3,y0,z0],[x0-6,y0,z0+2]],s.el]);
        if(f.buff) evs.push(['buff',me,id,s.buff.dur]);
        for(const e of evs) G.applyEvent(e);
        let peak=base(); for(let j=0;j<8;j++){ G.updateCombat(0.033); peak=Math.max(peak,base()); }   // (a swing's arc only lives 0.18 s)
        const made=peak>b0||!!(f.buff&&G.CB.buff&&G.CB.buff.id===id);
        for(const e of evs.filter(e=>e[0]==='area')) G.applyEvent(['aend',e[1]]);
        for(let j=0;j<40;j++) G.updateCombat(0.033);
        if(!made) bad.push(id);
      }
      ok('all boss skills draw without errors (rings, arcs, projectiles, zones, beams, chains, auras)',!bad.length&&G.AREA_FX.size===0,bad.length?'nothing drawn for '+bad.join(', '):ids.length+' skills'); }
  }
  G.openChat(); G.chatText.value='hi'; G.sendChat(); await wait(300); ok('chat line arrives',c.G().CHAT.lines.length>0);
  for(let i=0;i<150&&!c.G().MAP.done;i++) await wait(100); ok('world map painted',c.G().MAP.done);
  G.NET.send({t:'dev',cmd:'weather',v:'rain'}); await wait(300); for(let i=0;i<60;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } ok('rain fades in',G.WX.inten>0.9);
  // ---- the Hoarfrost Reach (levels 22-30): the client side of the third land ----
  G.NET.send({t:'dev',cmd:'weather',v:'clear'}); G.NET.send({t:'dev',cmd:'level',v:24}); G.NET.send({t:'dev',cmd:'vale',v:2}); G.NET.send({t:'dev',cmd:'north',v:2}); G.NET.send({t:'dev',cmd:'prof'}); G.NET.send({t:'dev',cmd:'coins'}); await wait(700); G=c.G();
  ok('the server tells the client about the ice wall and the professions',G.GEAR.north===2&&G.northOpen()&&G.GEAR.prof.mining&&G.GEAR.prof.gathering);
  G.P.x=G.VIL3.x+3; G.P.z=G.VIL3.z+3; G.P.y=G.getH(G.P.x,G.P.z); for(let i=0;i<50;i++) G.updateHoarfrost(0.1);   // (the wall sinks for 3.4 s when the server says it opened)
  { const N0=G.GEAR.north, W=G.PASS, o1={x:W.x,z:W.ice-1,inTun:false}, o2={x:W.x+40,z:G.HZ0+5,inTun:false}, o3={x:0,z:G.HZ0-5,inTun:false}, o4={x:W.x,z:W.ice-1,inTun:false}, o5={x:W.x+40,z:G.HZ0-12,inTun:false};
    G.GEAR.north=0; G.worldBounds(o1,W.x,0.32,W.ice+2); G.worldBounds(o2,W.x+40,0.32,G.HZ0+20); G.worldBounds(o3,0,0.32,G.HZ0+30); G.GEAR.north=1; G.worldBounds(o4,W.x,0.32,W.ice+2); G.worldBounds(o5,W.x+40,0.32,G.HZ0+20); G.GEAR.north=N0;
    ok('the sealed ice wall stops you in the pass and the vale\'s north wall holds (so does the home forest\'s); once the Reach is open no clamp holds you anywhere along the wall (the ground and the slope limit do)',o1.z>=W.ice+0.79&&o4.z<W.ice-0.9&&o2.z>=G.HZ0+13.9&&o3.z>=G.HZ0+13.9&&o5.z===G.HZ0-12,'sealed '+o1.z.toFixed(1)+', open '+o4.z.toFixed(1)+', wall '+o2.z.toFixed(1)+', forest '+o3.z.toFixed(1)+', open off the pass '+o5.z.toFixed(1)); }
  // ---- the Greyspine (the fourth land, terrain only): the client side ----
  { const sv={x:G.P.x,y:G.P.y,z:G.P.z}, H=G.GREY_HM, q=G.GREY_QUEEN, a={x:H.x,z:H.z,inTun:false}, b={x:0,z:G.HZ0-100,inTun:false}, d={x:0,z:G.HZ0-5,inTun:false}, lo=new THREE.Color(), hi=new THREE.Color();
    G.worldBounds(a,H.x,0.32,H.z); G.worldBounds(b,0,0.32,G.HZ0-100); G.worldBounds(d,0,0.32,G.HZ0-60);
    ok('in the Greyspine you can stand and walk (a teleport there is not pulled back), but not over the home forest\'s rim: 14 m short of its crest',a.z===H.z&&b.z===G.HZ0-100&&d.z<=G.borderZ(0)-13.9&&d.z>G.HZ0-60,'shelf '+a.z+', '+b.z.toFixed(0)+', rim '+d.z.toFixed(1));
    G.terrainColor(-60,-650,G.getH(-60,-650),0.2,lo); G.terrainColor(q.x,q.z,q.h,0.2,hi);
    ok('the Greyspine has ground colours of its own: green meadow in the trough, white snow on the Queen\'s crown; the map paints it',lo.g>lo.r&&lo.g>lo.b&&hi.r>0.8&&hi.g>0.8&&hi.b>0.8&&G.mapEdgeAlpha(0,-700)===255,'trough '+[lo.r,lo.g,lo.b].map(v=>v.toFixed(2))+', crown '+[hi.r,hi.g,hi.b].map(v=>v.toFixed(2)));
    G.P.x=0; G.P.z=-700; G.P.y=G.getH(0,-700); G.updateZoneLabel(); const inZone=c.el('#zone').textContent;
    G.P.x=G.WX0+20; G.P.z=-700; G.P.y=G.getH(G.WX0+20,-700); G.updateZoneLabel();   // (on the west wall, where the Greyspine has no zone)
    ok('standing in the Greyspine the zone label names its zone (levels 26-32) or, on the spine, the land, and the map shows its land',/^Miners' Scree \(Lv 28\)$/.test(inZone)&&c.el('#zone').textContent==='The Greyspine'&&G.landHere()==='grey'&&G.LANDS.grey.z1>G.HZ0,inZone+' / '+c.el('#zone').textContent+', '+G.landHere());
    G.P.x=sv.x; G.P.y=sv.y; G.P.z=sv.z; }
  { const W0=G.GEAR.west, g=G.GLEN, mk=(x,z)=>({x,z,inTun:false}), a=mk(g.ice-4,g.z), b=mk(G.HALF-5,g.z), c=mk(G.HALF-5,g.z+14), c1=mk(G.HALF-5,g.z+14);
    G.GEAR.west=0; G.worldBounds(a,g.ice+1,0.32,g.z); G.worldBounds(c1,G.HALF-4,0.32,g.z+9);
    G.GEAR.west=1; G.worldBounds(b,G.HALF+3,0.32,g.z); G.worldBounds(c,G.HALF-4,0.32,g.z+9);
    G.GEAR.west=W0;
    ok('the shut ice fall stops you in the glacier valley and inside the cut near the crest you stay between its walls; once the fall is open nothing but the ground holds you there',a.x>=g.ice+0.79&&b.x<G.HALF-4.9&&Math.abs(c1.z-g.z)<=g.w&&c.z===g.z+14,'shut '+a.x.toFixed(1)+', open '+b.x.toFixed(1)+', walls '+(c1.z-g.z).toFixed(1)+', open off the axis '+(c.z-g.z).toFixed(1)); }
  { const E0=G.GEAR.east, T=G.TUN, mk=(x,z)=>({x,z,inTun:false}), a=mk(T.p0+5,T.z), b=mk(T.p0+5,T.z), d=mk(T.p0+5,T.z), e={x:T.p0+20,z:T.z+3.9,inTun:true};
    G.GEAR.east=0; G.worldBounds(a,T.p0-3,0.32,T.z);   // the gate is barred: stopped at its door
    G.GEAR.east=1; G.worldBounds(b,T.p0-3,0.32,T.z); G.worldBounds(d,T.p0+20,0.32,T.z); G.worldBounds(e,T.p0+19,0.32,T.z);   // open: onto the deck, and kept between its parapets
    G.GEAR.east=E0;
    ok('the border bridge: its barred gate stops you at the door; open, you step onto the deck and stay between the parapets (the deck is ground you walk on, the river a wall beside it)',a.x<=T.p0-0.5&&!a.inTun&&b.x>T.p0&&b.inTun&&Math.abs(e.z-T.z)<=T.w-0.3&&G.bridgeDeck(T.p0+20,T.z)>G.getH(T.p0+20,T.z),'barred '+(a.x-T.p0).toFixed(1)+', open '+(b.x-T.p0).toFixed(1)+', parapet '+(e.z-T.z).toFixed(2)); }
  { const sv={x:G.P.x,y:G.P.y,z:G.P.z,g:G.P.ground,vx:G.P.vx,vz:G.P.vz}, S=G.SLOPE_MAX; let cx=null;   // a cliff face: find a place where one 2 m step west-east climbs more than the limit, and another that does not
    for(let z=-60;z>-440&&!cx;z-=4) for(let x=-400;x<400;x+=2) if((G.getH(x+2,z)-G.getH(x,z))/2>S*1.3){ cx=[x,z]; break; }
    const flat=[-40,100]; let ok1=false, ok2=false;
    if(cx){ G.P.ground=true; G.P.x=cx[0]+2; G.P.z=cx[1]; G.P.vx=0; G.P.vz=0; G.slopeBlock(cx[0],cx[1]); const dd=Math.hypot(G.P.x-cx[0],G.P.z-cx[1]); ok1=dd<1e-9||(dd<2+1e-9&&(G.getH(G.P.x,G.P.z)-G.getH(cx[0],cx[1]))/dd<=S+1e-6); }   // (stopped, or slid along the face at a climb the limit allows)
    G.P.ground=true; G.P.x=flat[0]+0.5; G.P.z=flat[1]; G.slopeBlock(flat[0],flat[1]); ok2=Math.abs(G.P.x-(flat[0]+0.5))<1e-9;
    G.P.x=sv.x; G.P.y=sv.y; G.P.z=sv.z; G.P.ground=sv.g; G.P.vx=sv.vx; G.P.vz=sv.vz;
    ok('terrain steeper than the slope limit (1.2) cannot be climbed: the step is turned along the face (or dropped) and never climbs more than the limit; gentle ground is no problem',!!cx&&ok1&&ok2,cx?'steep face at '+cx.join(', '):'no steep face found'); }
  { const Gs=G.GREY_GATES, R0=G.GEAR.river, N0=G.GEAR.neck, mk=(x,z)=>({x,z,inTun:false}), res=[];
    for(const T of Gs){ const a=mk(T.x-4,T.z), b=mk(T.x-4,T.z); G.GEAR[T.id]=0; G.worldBounds(a,T.x+1,0.32,T.z); G.GEAR[T.id]=1; G.worldBounds(b,T.x+1,0.32,T.z); res.push([a.x,b.x]); }
    G.GEAR.river=R0; G.GEAR.neck=N0;
    ok('a shut rock fall stops you east of each west-wall canyon; an open one lets you through to the edge',res.every(([s,o],i)=>s>=Gs[i].x+0.79&&o<Gs[i].x),res.map(r=>r.map(v=>v.toFixed(1)).join('/')).join(' ; ')); }
  ok('the ice wall is hidden once the way is open',G.HOAR.wall&&!G.HOAR.wall.visible);
  ok('Rimehold plays its own music and Frostgate Pass its own zone label',G.musicThemeHere()==='rimehold'&&G.landHere()==='hoar');
  G.P.x=G.PASS.x; G.P.z=G.PASS.z1-40; ok('the Reach\'s music (levels 22-26) outside the village',G.musicThemeHere()==='hoar1');
  { const h4=G.ZONES.find(z=>z.key==='h29'); G.P.x=h4.x; G.P.z=h4.z; ok('and the harder ranges another (27-30)',G.musicThemeHere()==='hoar2'); }
  G.openLodge(); { const h=el('#loBody').innerHTML; ok('the Wayfarers\' Lodge lists three professions (learned), a tool shop with six tier chips and three tools, and the resources to sell',(h.match(/class="lo-row/g)||[]).length===3&&(h.match(/>Learned</g)||[]).length===3&&(h.match(/data-tier=/g)||[]).length===6&&(h.match(/data-buytool=/g)||[]).length===3&&!/Coming later/.test(h)); }
  ok('every pendant has an icon, the five kinds look different (and a tempered one has its sparkle), the empty slot shows a ghost pendant, and its text says what it does',Object.keys(G.ITEM).filter(id=>id.startsWith('pendant-')).length===175&&Object.keys(G.ITEM).filter(id=>id.startsWith('pendant-')).every(id=>G.itemIcon(G.ITEM[id]).includes('<svg'))&&
    new Set(G.PENDANT_STATS.map(k=>G.itemIcon(G.ITEM['pendant-'+k]))).size===5&&G.itemIcon(G.ITEM['pendant-xp-e'])!==G.itemIcon(G.ITEM['pendant-xp-e+3'])&&G.slotIcon('pendant').includes('ghost')&&G.itemStat(G.ITEM['pendant-xp'])==='+6% XP from kills');
  { G.GEAR.inv.push('pendant-xp-e+3'); G.GEAR.eq.pendant='pendant-xp-e+3'; el('#inv').hidden=false; G.renderInv(); const h=el('#invBody').innerHTML; G.GEAR.eq.pendant=null; G.GEAR.inv=G.GEAR.inv.filter(i=>i!=='pendant-xp-e+3');
    ok('a worn pendant shows in its slot beside the chest',/data-slot="pendant" style="grid-area:neck"/.test(h)&&h.includes('data-id="pendant-xp-e+3"')); }
  ok('the tools have icons of their own',['pick1','axe1','sickle1','pick6-l'].every(id=>G.itemIcon(G.ITEM[id]).includes('<svg'))&&G.itemIcon(G.ITEM.pick1)!==G.itemIcon(G.ITEM.axe1)&&G.itemIcon(G.ITEM.axe1)!==G.itemIcon(G.ITEM.sickle1));
  G.P.x=G.VIL3.tele.x; G.P.z=G.VIL3.tele.z; G.P.y=G.getH(G.P.x,G.P.z); G.openTravel();
  { const h=el('#trBody').innerHTML; ok('stepping on a circle opens a window with every village: this one marked, the open ones to travel to, Highmark cold until you have been there',G.nearCircle()===G.VIL3&&(h.match(/data-to=/g)||[]).length===4&&/You are here/.test(h)&&(h.match(/Travel here/g)||[]).length===2&&(h.match(/<button[^>]*disabled/g)||[]).length===2); }   // (four villages: this one, two open, Highmark still cold)
  await wait(400); G.NET.send({t:'warp',to:'hanami'}); await wait(500); G=c.G();   // (the server must have heard where you stand) ok('choosing Hanami in the window carries you there',Math.hypot(G.P.x-G.VIL2.x,G.P.z-G.VIL2.z)<G.VIL2.r);
  ok('a node is drawn for every resource node',G.NODE_VIEWS.length===G.NODES.length&&G.NODES.length>=60);
  { const first=G.NODES.find(n=>n.kind==='snowmoss'), far=n=>Math.min(...G.MONS.map(m=>Math.hypot(m.x-n.x,m.z-n.z)));   // (a snowmoss node of the same tier that is farthest from every monster: beside a camp a level-24 hiker is knocked out before the potion check below)
    const n=G.NODES.filter(q=>q.kind==='snowmoss'&&q.need===first.need).sort((a,b)=>far(b)-far(a))[0]; G.P.x=n.x+1; G.P.z=n.z; G.P.y=G.getH(G.P.x,G.P.z); G.NET.send({t:'pos',p:[G.P.x,G.P.y,G.P.z,0,0,0]}); await wait(300);
    ok('walking up to a node offers to gather it (the prompt names the profession\'s verb)',G.nearNode()===n.i&&/^Press .* to gather Snowmoss$/.test(G.nodePrompt(n.i)),G.nodePrompt(n.i));
    G.gatherNode(n.i); await wait(300); G=c.G(); G.updateNodes(); ok('gathering starts a cast: the bar shows, nothing is in the bag yet',G.CAST.on&&!G.castBar.hidden&&!(G.GEAR.res.snowmoss>=1));
    await wait(1400); G=c.G(); G.updateNodes(); ok('when the cast ends the haul is in, the node is taken and hidden, and the bar is gone',G.GEAR.res.snowmoss>=1&&G.NODE_TAKEN.has(n.i)&&G.nearNode()<0&&!G.CAST.on&&G.castBar.hidden); }
  // ---- crafting, brewing and potions ----
  G.NET.send({t:'dev',cmd:'res'}); G.NET.send({t:'dev',cmd:'pots'}); G.NET.send({t:'dev',cmd:'coins'}); await wait(500); G=c.G();
  { const h=G.craftHtml('weapon'), a=G.craftHtml('armor'); ok('the Craft tab lists the three weapons at the weaponsmith\'s and the four armour pieces at the armourer\'s, with their costs',(h.match(/data-craft=/g)||[]).length===3&&(a.match(/data-craft=/g)||[]).length===4&&(h.match(/data-crtier=/g)||[]).length===6&&(h.match(/data-crrar=/g)||[]).length===3&&/Ore/.test(h)&&/Log/.test(a)); }
  G.openBrew({def:{name:'Ylva'}}); { const h=el('#brBody').innerHTML; ok('the brewing panel lists nine potions with their herbs and a Brew button each',(h.match(/data-brew=/g)||[]).length===18&&(h.match(/class="it"/g)||[]).length===9&&/Greater Healing Potion/.test(h)); }
  G.updatePotBar(true); ok('the potion belt shows once you carry potions (its buttons are checked in the browser: the headless DOM does not parse innerHTML)',!G.potBar.hidden);
  G.P.y=G.getH(G.P.x,G.P.z); G.NET.send({t:'pos',p:[G.P.x,G.P.y,G.P.z,0,0,0]}); await wait(200);
  G.drinkPotion('might'); await wait(600); G=c.G(); ok('drinking a potion: the server drinks the strongest, the client shows its cooldown and buff timer',G.GEAR.pot.might3===4&&(G.POT_ST.until.might||0)>0&&(G.POT_ST.cd.might||0)>0);
  // snow instead of rain in the Reach, rain everywhere else
  G.NET.send({t:'dev',cmd:'weather',v:'rain'}); await wait(300); G.camera.position.set(G.VIL3.x,G.VIL3.h+3,G.VIL3.z); for(let i=0;i<80;i++){ G.WX.t+=0.5; G.updateWeather(0.5); }
  ok('in the Reach the rain becomes snowfall',G.WX.snow>0.95&&G.snowfall.visible&&!G.rain.visible);
  G.camera.position.set(0,10,0); for(let i=0;i<40;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } ok('and in the forest it is rain again',G.WX.snow<0.05&&G.rain.visible&&!G.snowfall.visible);
  // the Greyspine by height: rain on Highmark's shelf, snow on the Gryphon Queen's peak, a sleet band between (both fall: counts scale by 1-snow and snow)
  { const at=(x,z,y)=>{ G.camera.position.set(x,y===undefined?G.getH(x,z)+3:y,z); for(let i=0;i<40;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } };
    at(G.VIL4.x,G.VIL4.z); ok('in the Greyspine the rain stays rain down at Highmark (the shelf is below the snowline)',G.WX.snow<0.05&&G.rain.visible&&!G.snowfall.visible);
    const q=G.GREY_QUEEN; at(q.x,q.z); ok('...and on the Gryphon Queen\'s peak it is snowfall',G.WX.snow>0.95&&G.snowfall.visible&&!G.rain.visible);
    let mid=null; for(let x=-420;x<420&&!mid;x+=12) for(let z=-1030;z<-460;z+=12){ const a=G.greySnowAmt(x,z,G.getH(x,z)); if(a>0.4&&a<0.6){ mid=[x,z]; break; } }
    ok('the sleet band exists on the slopes (some ground has the snow share between 0.4 and 0.6)',!!mid);
    if(mid){ at(mid[0],mid[1]); ok('...there rain and flakes fall together',G.WX.snow>0.2&&G.WX.snow<0.8&&G.rain.visible&&G.snowfall.visible); }
    ok('the line is colder to the north and lower ground never snows: Highmark 0, the queen\'s peak 1, the same height 10 m lower in the far north snows more',G.greySnowAmt(0,-700,0)===0&&G.greySnowAmt(0,-700,300)===1&&G.greySnowAmt(0,-900,125)>=G.greySnowAmt(0,-700,125)); }
  G.camera.position.set(0,10,0); for(let i=0;i<40;i++){ G.WX.t+=0.5; G.updateWeather(0.5); }
  G.NET.send({t:'dev',cmd:'weather',v:'clear'});
  // the Greyspine's map: the full map names its zones, Highmark, bosses, tarns, fjord, the Blackseam's door and the two rock falls, carries the tier row, and opens with the ice fall; the minimap draws there
  { const sv={x:G.P.x,z:G.P.z,done:G.MAP.done,west:G.GEAR.west}, texts=[]; G.mapCX.fillText=t=>texts.push(t); G.MAP.done=true;
    G.P.x=G.VIL4.x; G.P.z=G.VIL4.z; G.drawFullMap(); const has=t=>texts.some(x=>x===t||String(x).startsWith(t));
    ok('map: standing in the Greyspine its full map names Highmark and its zones',has('Highmark')&&has('Highmark Pastures')&&has('The Sink')&&has('Level 26'));
    ok('...its tarns, the fjord, the two bosses and the Blackseam\'s door (the Old Adit)',has('Mirrortarn')&&has("Queen's Tarn")&&has('Highmark Tarn')&&has('The fjord')&&texts.some(x=>/Gryphon Queen/.test(x))&&texts.some(x=>/Mountain Golem/.test(x))&&has('The Old Adit'));
    ok('...and the two rock falls in the west wall (the river road and the neck pass)',has('The river road')&&has('The neck pass'));
    ok('...with its own zone tier row',c.el('#mapTier').dataset.land==='grey'&&/Zone tier/.test(c.el('#mapTier').innerHTML||''));
    { let na=0; G.mapCX.arc=()=>{ na++; }; const prof=G.GEAR.prof, eq={pick:G.GEAR.eq.pick,axe:G.GEAR.eq.axe,sickle:G.GEAR.eq.sickle};
      G.GEAR.prof={mining:{xp:0},woodcutting:{xp:0},gathering:{xp:0}}; G.GEAR.eq.pick='pick6'; G.GEAR.eq.axe='axe6'; G.GEAR.eq.sickle='sickle6'; G.drawFullMap(); const withP=na; na=0;
      G.GEAR.prof=null; G.drawFullMap(); const without=na; G.GEAR.prof=prof; Object.assign(G.GEAR.eq,eq); G.mapCX.arc=()=>{};
      ok('...and the resource nodes you can work show as dots on it (the Greyspine\'s, as in the Reach)',withP>without+20,withP+' dots with the professions and the best tools, '+without+' without'); }
    let mmErr=null; try{ G.drawMinimap(); }catch(e){ mmErr=e; } ok('the minimap draws in the Greyspine without error (the 90 m around you, from the same painted image)',!mmErr);
    G.P.x=0; G.P.z=0; G.GEAR.west=0; const shut=G.landOpen('grey'); G.GEAR.west=1; const open=G.landOpen('grey'); G.GEAR.west=sv.west;
    ok('the Greyspine\'s map opens from the home forest once the ice fall in the glacier valley is open (gear.west), not before',!shut&&open);
    G.mapCX.fillText=()=>{}; G.MAP.done=sv.done; G.P.x=sv.x; G.P.z=sv.z; }
  // the borders: the Greyfall is drawn and shows only when you are near, the river is a wall (a hiker walking at it stops short of the deep water and of the crest line)
  { const F=G.FALL;
    ok('the Greyfall is drawn: a sheet over the chute (two vertices a row of its path), a foam ring and spray at the pool',!!G.GF.built&&G.GF.sheet.geometry.attributes.position.count===G.fallProfile().length*2&&!!G.GF.foam&&!!G.GF.spray);
    G.camera.position.set(F.x,10,F.pool.z-60); G.updateGreyfall(0.1); const near=G.GF.sheet.visible&&G.GF.spray.visible, off0=G.GF.tex.offset.y;
    G.updateGreyfall(0.5); const flows=G.GF.tex.offset.y<off0;
    G.camera.position.set(-300,10,300); G.updateGreyfall(0.1); const far=!G.GF.sheet.visible&&!G.GF.spray.visible;
    ok('...it is drawn within 650 m (spray within 340 m), its streaks run down the chute, and nothing is updated far away',near&&flows&&far);
    for(const [z,dir] of [[300,1],[300,-1],[150,1],[-300,1]]){ const bx=G.borderX(z), o={x:bx-dir*70,z,inTun:false}; let ox; for(let i=0;i<160;i++){ ox=o.x; o.x+=dir; G.worldBounds(o,ox,0.32,z); }
      ok('the river is a wall: a hiker walking at it at z '+z+' from the '+(dir>0?'home forest':'vale')+' side stops on his own bank',dir>0?o.x<bx-5:o.x>bx+5,'x '+o.x.toFixed(1)+', the middle at '+bx.toFixed(1)+', ground '+G.getH(o.x,z).toFixed(1)+' m'); } }
  // chamois: harmless herds that exist only in the Greyspine, stand on the high slopes and bolt from you
  { const sv={x:G.P.x,y:G.P.y,z:G.P.z}; G.P.x=G.VIL4.x; G.P.z=G.VIL4.z; for(let i=0;i<60;i++) G.chamoisUpdate(0.1);
    const on=G.CHAM.list.filter(a=>a.herd.on);
    ok('chamois: in the Greyspine herds are built and placed (3-5 goats each)',G.CHAM.ready&&G.CHAM.herds.length>=2&&on.length>=3&&G.CHAM.herds.every(h=>h.list.length>=3&&h.list.length<=5));
    ok('...on ground chamoisOK allows (high slopes, no water, not Highmark), within 150 m of you',on.every(a=>G.chamoisOK(a.x,a.z)&&Math.hypot(a.x-G.P.x,a.z-G.P.z)<150));
    const a=on[0]; a.x=G.P.x+6; a.z=G.P.z; for(let i=0;i<3;i++) G.chamoisUpdate(0.05);
    ok('...and one 6 m from you bolts away',a.state==='flee'&&a.speed>0);
    G.P.x=0; G.P.z=0; G.chamoisUpdate(0.1);
    ok('in the home forest none is shown (hidden, off, no cost)',!G.CHAM.shown&&G.CHAM.list.every(a=>!a.herd.on)&&G.CHAM.mT.instanceMatrix.array[0]===0&&G.CHAM.mT.instanceMatrix.array[5]===0);
    G.P.x=sv.x; G.P.y=sv.y; G.P.z=sv.z; }
  // zone tiers: unlock through the testing tool, the symbol shows, the picker works in the village, a monster's level and health follow your tier
  G.NET.send({t:'dev',cmd:'zt',v:1}); await wait(500); G=c.G();
  ok('zone tiers: four lands unlocked at tier I show the symbol (four points, +40%, a badge for each land)',G.GEAR.zt.home.max===1&&G.GEAR.zt.grey.max===1&&!c.el('#plSym').hidden&&/\+40%/.test(c.el('#plSym').title||'')&&/Greyspine I/.test(c.el('#plSym').title||''),c.el('#plSym').title);
  G.P.x=G.VIL.x; G.P.z=G.VIL.z; G.P.y=G.getH(G.P.x,G.P.z); G.NET.send({t:'pos',p:[G.P.x,G.P.y,G.P.z,0,0,0]}); await wait(300);
  G.NET.send({t:'zt',land:'home',n:1}); await wait(400); G=c.G();
  { const m=G.MONS.find(q=>!q.boss&&G.landAt(q.camp.x,q.camp.z)==='home'&&q.T.level<15), v=G.MONS.find(q=>!q.boss&&G.landAt(q.camp.x,q.camp.z)==='vale'), zn=G.ZONES.find(z=>!z.boss&&!z.vale&&!z.hoar&&z.level===m.T.level);
    ok('at home tier I a home monster is ten levels higher, its health is shown in tier units, a vale monster is not, and the zone name follows',G.zoneTierOn(G.GEAR,'home')===1&&G.monTierK(m).lv===m.T.level+10&&G.monTierK(m).hp>1&&!!v&&G.monTierK(v).lv===v.T.level&&!!zn&&String(G.zoneLvText(zn))===String(zn.level+10),'lv '+m.T.level+' -> '+G.monTierK(m).lv+' (health x'+G.monTierK(m).hp.toFixed(2)+')');
    G.renderTierRow('home'); const row=c.el('#mapTier'); ok('the picker under the map is filled in for the land you look at (in a village: both arrows are offered)',row.dataset.land==='home'&&/Zone tier/.test(row.innerHTML||'')&&!/disabled/.test((row.innerHTML.match(/<button[^>]*data-zt="0"[^>]*>/)||[''])[0]),row.innerHTML); }
  G.NET.send({t:'dev',cmd:'zt',v:0}); await wait(300);
  // r128 compiles a material's shader once, for whichever instanced mesh draws first: one with instance colours and one without on the same material
  // threw "Cannot read properties of null (reading 'isInterleavedBufferAttribute')" in the render loop, depending on what was nearest at the first frame
  { let n=0, bare=0; G.scene.traverse(o=>{ if(o.isInstancedMesh){ n++; if(!o.instanceColor) bare++; } }); ok('every instanced mesh has instance colours (a material shared by meshes with and without crashed the renderer)',n>100&&bare===0,n+' meshes, '+bare+' without'); }
  // ---- a dungeon run (game/dungeon/*.js; the full set: tools/dungeon-client-smoke.js): built from the tp at its slot, the forest off, walls, camera, monsters, HUD, party, results, leaving ----
  { G.NET.send({t:'dev',cmd:'level',v:50}); G.NET.send({t:'dev',cmd:'dg',v:'hollowroots:purge'}); await wait(900); G=c.G();
    const R=G.DG_RUN(), sp=()=>G.NET.server.players.get('you'); let grp=null; G.scene.traverse(o=>{ if(o.name==='dungeon') grp=o; });
    ok('dungeon: a purge run from the testing tool builds the dungeon\'s meshes at the run\'s slot, where the server has you',!!R&&!!grp&&grp.position.x===R.ox&&grp.position.z===R.oz&&G.DG_VIEW.meshes>=3&&sp().inst===R.id&&Math.abs(G.P.x-sp().x)<0.01,R&&G.DG_VIEW.meshes+' meshes, '+Math.round(G.DG_VIEW.tris)+' triangles');
    for(let i=0;i<3;i++){ G.updateEnv(0.05); G.cullChunks(0.05); }
    ok('dungeon: the forest is off (sky, water, sun shadow, terrain tiles) and the fog is the theme\'s',!G.sky.visible&&!G.water.visible&&!G.sun.castShadow&&!G.TERRAIN_BANDS.some(b=>b.mesh.visible)&&G.scene.fog.color.getHex()===G.DG_THEMES.hollowroots.pal.fog&&G.camera.far<200);
    const B=R.B, lx=()=>G.P.x-R.ox, lz=()=>G.P.z-R.oz; let dir=null;
    for(let a=0;a<8&&!dir;a++){ const dx=Math.sin(a/4*Math.PI), dz=Math.cos(a/4*Math.PI); for(let d=1;d<12;d+=0.25) if(!G.dgFree(B,lx()+dx*d,lz()+dz*d,0.32)){ dir={dx,dz,d}; break; } }
    { const x0=lx(), z0=lz(); G.P.yaw=Math.atan2(-dir.dx,-dir.dz); G.keys.KeyW=true; for(let i=0;i<90;i++) G.updatePlayer(0.05); await wait(500); G.keys.KeyW=false; G=c.G();
      const went=(lx()-x0)*dir.dx+(lz()-z0)*dir.dz;
      ok('dungeon: a wall stops you, and the server agrees where you are',G.dgFree(B,lx(),lz(),0.3)&&went<dir.d&&Math.hypot(sp().x-G.P.x,sp().z-G.P.z)<0.35,'went '+went.toFixed(2)+' of '+dir.d.toFixed(2)+' m'); }
    G.P.x-=dir.dx*1.2; G.P.z-=dir.dz*1.2; G.P.yaw=Math.atan2(dir.dx,dir.dz); G.P.pitch=0; for(let i=0;i<10;i++) G.updateCamera(0.05);
    { const d=Math.hypot(G.camera.position.x-G.P.x,G.camera.position.z-G.P.z); ok('dungeon: with a wall behind you the camera\'s arm shortens',d<2.2,'arm '+d.toFixed(2)+' m'); }
    for(let i=0;i<15&&G.MONS.filter(m=>m.dgK).length<=3;i++){ await wait(200); G=c.G(); }   // (the roster arrives in a message of its own: wait for it, a loaded machine was slow once)
    ok('dungeon: the run\'s monsters have views at the run\'s level',G.MONS.filter(m=>m.dgK&&G.monTierK(m).lv===R.L).length>3);
    G.applySnap({dg:[0,40,0,3,9]}); G.dgHudTick(0.016); ok('dungeon: the dg snapshot drives the HUD text',el('#dgHudTitle').textContent==='Purge'&&el('#dgHudLines')._kids.some(k=>k.textContent==='Monsters slain: 3 / 9'));
    const me=G.NET.pid; G.applyEvent(['pty',me,me,[[me,'Me',100,100,50,0,R.id],[4242,'Ann',0,120,29,1,R.id]]]);
    ok('dungeon: a downed member shows in the party frame',!el('#dgPtyFrame').hidden&&el('#dgPtyFrame')._kids.length===1&&/down/.test(el('#dgPtyFrame')._kids[0].className));
    G.applyEvent(['pty',me,0,[]]);
    G.applyEvent(['dge',me,0,61,40,12,[],2,'Everyone was down at once.']); ok('dungeon: the results panel appears on dge',!el('#dgResult').hidden&&el('#dgResultTitle').textContent==='The run is lost'&&/Everyone/.test(el('#dgResultWhy').textContent));
    const geos=G.DG_VIEW.geos.slice(); let gone=0; for(const g of geos){ const f=g.dispose.bind(g); g.dispose=()=>{ gone++; f(); }; }
    G.NET.send({t:'dg',a:'leave'}); await wait(700); G=c.G(); for(let i=0;i<3;i++){ G.updateEnv(0.05); G.cullChunks(0.05); } let left=0; G.scene.traverse(o=>{ if(o.name==='dungeon') left++; });
    ok('dungeon: leaving gives the world back (sky, water, sun shadow, fog, streaming) and disposes the meshes',!G.dgIn()&&sp().inst===0&&left===0&&gone===geos.length&&G.sky.visible&&G.water.visible&&G.sun.castShadow&&G.scene.fog.far>100&&G.camera.far===1200&&!G.MONS.some(m=>m.dgK),gone+' of '+geos.length+' geometries'); }
  // the main quest's Act IV on the client: Odran moves to Highmark, the marks over its people, the log line and the map target of each new kind of part
  { G=c.G(); const set=(id,st,n)=>{ const i=G.MQ_BY_ID[id].i; G.GEAR.mq={s:i,st,n:n||G.MQ_BY_ID[id].parts.map(()=>0),h:0,ver:2}; };
    set('F7',1); const a=[G.odranHere(3),G.odranHere(4)]; set('G4',1); const b=[G.odranHere(3),G.odranHere(4)]; set('V8',1); const v=[G.odranHere(1),G.odranHere(2),G.odranHere(3)];
    ok('Odran\'s cart follows the story: Rimehold from F7, Highmark from G4 (and no longer Rimehold), Hanami between V8 and F7',a[0]&&!a[1]&&!b[0]&&b[1]&&!v[0]&&v[1]&&!v[2],JSON.stringify([a,b,v]));
    G.PL.level=26; set('G2',0); ok('G2 is offered by Brenna (a mark over her) and only at level 26',G.mqMark('brenna')==='!'&&G.mqMark('ansgar')==='','brenna '+G.mqMark('brenna'));
    set('G2',1); ok('G2: the people to meet are marked, Brenna is not',['ansgar','gerhard','matthias'].every(i=>G.mqMark(i)==='!')&&G.mqMark('brenna')==='');
    G.P.x=0; G.P.z=0; set('G1',1); { const T=G.mqTarget(); ok('G1: the map points at the glacier valley from afar and its log line says what to do',!!T&&T.name==='the glacier valley'&&/Walk the glacier valley west to Highmark/.test(G.mqLogRow()),T&&T.name); }
    G.P.x=G.VIL4.x; G.P.z=G.VIL4.z; { const T=G.mqTarget(); ok('...and at Highmark\'s own door',!!T&&T.name==='Highmark'); }
    G.GEAR.prof={}; set('G3',1); { const T=G.mqTarget(); ok('G3 without a pickaxe: the map points at the stone slimes\' zone, not a vein',!!T&&T.name!=='Black vein'); }
    G.GEAR.prof={mining:{xp:0}}; G.GEAR.eq.pick='pick6'; { const T=G.mqTarget(); ok('G3 with the best pickaxe: the nearest black vein',!!T&&T.name==='Black vein'); }
    set('G5',1); { const T=G.mqTarget(); ok('G5: the shaft head in the Miners\' Scree, and the log says after dark',!!T&&T.name==='Miners\' Scree'&&/after dark/.test(G.mqLogRow())); }
    set('G7',1); { const T=G.mqTarget(), L=G.LORE_BY_ID.deepshaft; ok('G7: the mouth of the deepest shaft',!!T&&T.name==='The deepest shaft'&&T.x===L.x&&T.z===L.z); }
    set('G8',1); { const T=G.mqTarget(); ok('G8: the golem\'s broken stone',!!T&&T.name==='The golem\'s broken stone'); }
    set('G9',1); { const T=G.mqTarget(); ok('G9: the Mountain Golem\'s cavern',!!T&&/Cavern/.test(T.name)); }
    G.GEAR.mq={s:G.MQ_BY_ID.G9.i+1,st:0,n:[],h:0,ver:2}; ok('after G9 the log shows the end of act IV',/Glasswell/.test(G.mqLogRow())); }
  // the world map of Eldmere (ui/world-map.js): the docs map's regions, the pin, the fog, the pointer, and the way into each land's map
  { G=c.G(); const page=require('fs').readFileSync(require('path').join(__dirname,'..','dist','wildwood.html'),'utf8'), m=/window\.WILDWOOD_IMG=\{"world-map":"data:image\/webp;base64,([A-Za-z0-9+\/=]+)"/.exec(page);
    ok('the world map\'s art is embedded in the page as a WebP of 400 KB or less (assets/img/world-map.webp)',!!m&&m[1].length*0.75<400e3&&Buffer.from(m[1].slice(0,16),'base64').toString('latin1',8,12)==='WEBP',m?(m[1].length*0.75/1024).toFixed(0)+' KB':'missing');
    const R=G.WMAP_REG, T=G.WMAP_TOWNS, lands={home:'village',vale:'hanami',hoar:'rimehold',grey:'highmark'}, regOf={home:'wild',vale:'vale',hoar:'frost',grey:'grey'};
    ok('the docs map\'s seven regions and its six islands are there, and the four towns lie well inside their own lands (8 art pixels from the edge)',['wild','vale','frost','grey','horn','sun','amber'].every(k=>R[k]&&R[k].length>=20)&&G.WMAP_ISLES.length===6&&Object.keys(lands).every(l=>G.wmapPip(R[regOf[l]],...T[lands[l]])&&G.wmapEdgeDist(R[regOf[l]],...T[lands[l]])>=8&&G.wmapRegionAt(...T[lands[l]])===l),Object.keys(lands).map(l=>G.wmapEdgeDist(R[regOf[l]],...T[lands[l]]).toFixed(0)).join(', '));
    ok('a click on the not-built regions, the isles and the fog banks finds "unbuilt", on open sea nothing',G.wmapRegionAt(330,480)==='unbuilt'&&G.wmapRegionAt(560,980)==='unbuilt'&&G.wmapRegionAt(G.WMAP_ISLES[1][0][0]+8,G.WMAP_ISLES[1][0][1]+8)==='unbuilt'&&G.wmapRegionAt(1830,170)==='unbuilt'&&G.wmapRegionAt(1100,1100)===null);
    // the pin: each village is exact, and a sweep of every land keeps the pin on its own land's region (the drawing's coast is not the game's)
    { const F=G.wmapFit(), vs=[G.VIL,G.VIL2,G.VIL3,G.VIL4], ts=[T.village,T.hanami,T.rimehold,T.highmark];
      ok('the four villages fit the drawn towns within 25 art pixels (a drawing, not a survey)',vs.every((v,i)=>Math.hypot(F.u[0]*v.x+F.u[1]*v.z+F.u[2]-ts[i][0],F.v[0]*v.x+F.v[1]*v.z+F.v[2]-ts[i][1])<25));
      const p0={x:G.P.x,z:G.P.z}; let bad=[], n=0;
      for(const [i,l] of Object.keys(lands).entries()){ G.P.x=vs[i].x; G.P.z=vs[i].z; const p=G.wmapPin(); if(!p||Math.hypot(p[0]-ts[i][0],p[1]-ts[i][1])>1) bad.push(l+' village'); }
      for(let z=G.WZ0;z<=G.WZ1;z+=30) for(let x=G.WX0;x<=G.WX1;x+=30){ if(G.getH(x,z)<0.5) continue; G.P.x=x; G.P.z=z; const l=G.landHere(), p=G.wmapPin(); n++; if(!p||G.wmapRegionAt(p[0],p[1])!==l) bad.push(l+' '+x+','+z); }
      G.P.x=p0.x; G.P.z=p0.z;
      ok('your pin is exact at your land\'s village and stays in your own land\'s region at every dry point of the world',bad.length===0&&n>1500,n+' points'+(bad.length?'; off: '+bad.slice(0,6).join(' | '):'')); }
    // opening: the panel, the fog of the locked lands, the groups of puffs
    ok('the World button is in the map\'s header and the G key and the panel are known',!!el('#mapWorld')&&!!el('#wmap')&&!!el('#wmapC'));
    // (earlier checks opened every land and left you in the Greyspine: seal them again and go home)
    G.NET.send({t:'dev',cmd:'vale',v:0}); G.NET.send({t:'dev',cmd:'north',v:0}); G.NET.send({t:'dev',cmd:'west',v:0}); G.P.x=G.VIL.x+6; G.P.z=G.VIL.z+6; G.P.y=G.getH(G.P.x,G.P.z); await wait(700); G=c.G();
    ok('the vale, the Reach and the Greyspine are sealed again and you stand in the home forest',['vale','hoar','grey'].every(l=>!G.landOpen(l))&&G.landHere()==='home');
    G.wmapOpen(); G=c.G(); const W=()=>c.G().WM;
    ok('the world map opens (and the land map closes), all of the sea in view at first and the three locked lands under fog',!el('#wmap').hidden&&el('#map').hidden&&W().k>=W().min&&W().k<=W().max&&['vale','hoar','grey'].every(l=>W().fade[l]===1&&!G.landOpen(l)),'k '+W().k.toFixed(2));
    ok('fog is built for the unbuilt regions (west, south-west, isles, three banks) and each locked land, at least 60 puffs a group of the unbuilt, 150 for each locked land',W().fog.base.length===6&&W().fog.base.every(g=>g.n>=60)&&['vale','hoar','grey'].every(l=>W().fog[l].n>=150),W().fog.base.map(g=>g.n).join('/')+' + '+['vale','hoar','grey'].map(l=>W().fog[l].n).join('/'));
    // the pointer: wheel zooms about the cursor, a drag pans and does not click, two fingers pinch
    { const cv=el('#wmapC'), k0=W().k, w=W(); cv.fire('wheel',{clientX:300,clientY:300,deltaY:-400,deltaMode:0}); const k1=c.G().WM.k; cv.fire('wheel',{clientX:300,clientY:300,deltaY:-4000,deltaMode:0}); const k2=c.G().WM.k;
      cv.fire('wheel',{clientX:300,clientY:300,deltaY:40000,deltaMode:0}); ok('the wheel zooms in and out, between the whole map and 3.5 times that',k1>k0&&k2<=c.G().WM.max+1e-9&&Math.abs(k2/c.G().WM.min-3.5)<1e-6&&Math.abs(c.G().WM.k-c.G().WM.min)<1e-9,k0.toFixed(2)+' > '+k1.toFixed(2)+' > '+k2.toFixed(2));
      for(let i=0;i<3;i++) cv.fire('wheel',{clientX:300,clientY:300,deltaY:-300,deltaMode:0}); const cx0=c.G().WM.cx;
      cv.fire('pointerdown',{pointerId:1,clientX:300,clientY:300}); cv.fire('pointermove',{pointerId:1,clientX:240,clientY:300}); cv.fire('pointerup',{pointerId:1,clientX:240,clientY:300});
      ok('a drag pans the map the other way and does not open anything',c.G().WM.cx>cx0&&!el('#wmap').hidden&&el('#map').hidden,'cx '+cx0.toFixed(0)+' > '+c.G().WM.cx.toFixed(0));
      cv.fire('wheel',{clientX:300,clientY:300,deltaY:40000,deltaMode:0}); const k3=c.G().WM.k; cv.fire('pointerdown',{pointerId:1,clientX:250,clientY:300}); cv.fire('pointerdown',{pointerId:2,clientX:350,clientY:300}); cv.fire('pointermove',{pointerId:2,clientX:450,clientY:300}); cv.fire('pointerup',{pointerId:2,clientX:450,clientY:300}); cv.fire('pointerup',{pointerId:1,clientX:250,clientY:300});
      ok('two fingers moving apart zoom in, and ending the pinch does not click',c.G().WM.k>k3&&!el('#wmap').hidden,k3.toFixed(2)+' > '+c.G().WM.k.toFixed(2)); }
    // clicks: fog says what bars the way, an open land opens its map
    { G=c.G(); G.WM.k=G.WM.min; G.WM.cx=1000; G.WM.cy=787; const w=G.WM, sx=ax=>(ax-w.cx)*w.k+w.w/2, sy=ay=>(ay-w.cy)*w.k+w.h/2, tk=()=>el('#toasts')._kids.map(t=>t.textContent);
      G.wmapClick(sx(1300),sy(700)); ok('a click on a locked land says what bars it (the same words as its land map) and the world map stays',tk().includes(G.WMAP_LOCK.vale)&&!el('#wmap').hidden,tk().join('|'));
      G.wmapClick(sx(330),sy(480)); ok('a click on the not-built fog says it is uncharted, and names nothing',tk().some(t=>/Uncharted/.test(t)&&!/Stormhorn|Sunscar|Amber|Emberwake/.test(t)));
      G.wmapClick(sx(1000),sy(600)); G=c.G(); ok('a click on Wildwood opens the home forest\'s own map (the one N opens)',el('#wmap').hidden&&!el('#map').hidden&&G.mapLand()===null&&G.landHere()==='home'); }
    // a land that opens: its fog lifts (after a short beat), is remembered, and a click opens that land's map
    G.NET.send({t:'dev',cmd:'vale',v:2}); G.NET.send({t:'dev',cmd:'north',v:2}); G.NET.send({t:'dev',cmd:'west',v:2}); await wait(700); G=c.G();
    { ok('the dev commands opened the vale, the Reach and the Greyspine',['vale','hoar','grey'].every(l=>G.landOpen(l)));
      G.wmapOpen(); G=c.G(); ok('an open land you have not seen open starts under fog',['vale','hoar','grey'].every(l=>G.WM.fade[l]===1));
      for(let i=0;i<60;i++) G.wmapUpdate(0.05); G=c.G(); ok('...and the fog lifts: gone from all three, each remembered as seen (localStorage)',['vale','hoar','grey'].every(l=>G.WM.fade[l]===0)&&['vale','hoar','grey'].every(l=>JSON.parse(c.ls.get('wildwood-wmap')).includes(l)),c.ls.get('wildwood-wmap'));
      G.wmapOpen(); G=c.G(); ok('opened again, an open land stays clear',['vale','hoar','grey'].every(l=>G.WM.fade[l]===0));
      const w=G.WM; w.k=w.min; w.cx=1000; w.cy=787; const sx=ax=>(ax-w.cx)*w.k+w.w/2, sy=ay=>(ay-w.cy)*w.k+w.h/2;
      G.wmapClick(sx(G.WMAP_TOWNS.rimehold[0]+60),sy(G.WMAP_TOWNS.rimehold[1]-40)); G=c.G(); ok('a click on the Hoarfrost Reach opens the Reach\'s map',el('#wmap').hidden&&!el('#map').hidden&&G.mapLand()==='hoar'&&G.LANDS.hoar.name==='The Hoarfrost Reach');
      G.wmapOpen(); G=c.G(); G.wmapClick(sx(G.WMAP_BANNER.grey.x+130),sy(G.WMAP_BANNER.grey.y)); G=c.G(); ok('...the Greyspine\'s map (a click on its banner counts as the land, even over the next region)',G.mapLand()==='grey'&&!el('#map').hidden);
      G.wmapOpen(); G=c.G(); G.wmapClick(sx(G.WMAP_BANNER.vale.x),sy(G.WMAP_BANNER.vale.y)); G=c.G(); ok('...and the Sakura Vale\'s map',G.mapLand()==='vale'&&!el('#map').hidden);
      el('#mapWorld').click(); G=c.G(); ok('the map\'s World button opens the world map, and the G key closes and opens it',!el('#wmap').hidden&&el('#map').hidden&&(c.fireWin('keydown',{code:'KeyG'}),el('#wmap').hidden)&&(c.fireWin('keydown',{code:'KeyG'}),!el('#wmap').hidden)); G.closePanels(); } }
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
