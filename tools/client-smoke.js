// Headless client test: runs dist/wildwood.html in Node with a stub DOM/WebGL (tools/headless.js) and plays solo through the real
// client code. Build first (python3 build.py). Needs the three package (npm install). Prints PASS/FAIL lines.
// Usage: node tools/client-smoke.js
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','updateZoneLabel','mapEdgeAlpha','GREY_HM','GREY_QUEEN','GLEN','GREY_GATES','slotIcon','PENDANT_STATS','itemStat','HALF','GREY','updateGreyspine','startSolo','scene','beginPlay','MONS','P','PL','CB','GEAR','MAP','CHAT','WX','doAttack','equip','updateMonsters','updateCombat','updateWeather','openSkills','openSoul','PASSIVE_IDS','attackVisuals','applyEvent','SKILLS','ANIM_OF','BOSS_SKILLS','AREA_FX','BOLTS','ACT_SKILL','renderInv','sendChat','openChat','chatText','getH','canStart:()=>canStart','camera','VIL','VIL2','VIL3','PASS','NODES','NODE_VIEWS','NODE_KINDS','NODE_TAKEN','nearNode','nodePrompt','gatherNode','openLodge','openTravel','nearCircle','CIRCLES','snowfall','rain','musicThemeHere','landHere','LANDS','ZONES','northOpen','updateHoarfrost','updateNodes','updateAurora','AURORA','HOAR','terrainColor','worldBounds','HZ0','ITEM','itemIcon','craftHtml','renderBrew','openBrew','openShop','renderShop','panelNPC:()=>panelNPC','drinkPotion','onPotionEvent','updatePotBar','POT_ST','potBar','MQ','CAST','castBar','updateNodes','monTierK','zoneLvText','zoneTierOn','renderTierRow','landOfZone','landAt',
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
  { const N0=G.GEAR.north, W=G.PASS, o1={x:W.x,z:W.ice-1,inTun:false}, o2={x:W.x+40,z:G.HZ0+5,inTun:false}, o3={x:0,z:G.HZ0-5,inTun:false}, o4={x:W.x,z:W.ice-1,inTun:false};
    G.GEAR.north=0; G.worldBounds(o1,W.x,0.32,W.ice+2); G.GEAR.north=1; G.worldBounds(o4,W.x,0.32,W.ice+2); G.worldBounds(o2,W.x+40,0.32,G.HZ0+20); G.worldBounds(o3,0,0.32,G.HZ0+30); G.GEAR.north=N0;
    ok('the sealed ice wall stops you in the pass, an open one does not; the north walls of the vale and the home forest hold',o1.z>=W.ice+0.79&&o4.z<W.ice-0.9&&o2.z>=G.HZ0+13.9&&o3.z>=G.HZ0+13.9,'sealed '+o1.z.toFixed(1)+', open '+o4.z.toFixed(1)+', wall '+o2.z.toFixed(1)+', forest '+o3.z.toFixed(1)); }
  // ---- the Greyspine (the fourth land, terrain only): the client side ----
  { const sv={x:G.P.x,y:G.P.y,z:G.P.z}, H=G.GREY_HM, q=G.GREY_QUEEN, a={x:H.x,z:H.z,inTun:false}, b={x:0,z:G.HZ0-100,inTun:false}, d={x:0,z:G.HZ0-5,inTun:false}, lo=new THREE.Color(), hi=new THREE.Color();
    G.worldBounds(a,H.x,0.32,H.z); G.worldBounds(b,0,0.32,G.HZ0-100); G.worldBounds(d,0,0.32,G.HZ0-60);
    ok('in the Greyspine you can stand and walk (a teleport there is not pulled back), but not over the home forest\'s rim: 14 m short of its crest',a.z===H.z&&b.z===G.HZ0-100&&d.z<=G.HZ0-13.9&&d.z>G.HZ0-60,'shelf '+a.z+', '+b.z.toFixed(0)+', rim '+d.z.toFixed(1));
    G.terrainColor(-60,-650,G.getH(-60,-650),0.2,lo); G.terrainColor(q.x,q.z,q.h,0.2,hi);
    ok('the Greyspine has ground colours of its own: green meadow in the trough, white snow on the Queen\'s crown; the map paints it',lo.g>lo.r&&lo.g>lo.b&&hi.r>0.8&&hi.g>0.8&&hi.b>0.8&&G.mapEdgeAlpha(0,-700)===255,'trough '+[lo.r,lo.g,lo.b].map(v=>v.toFixed(2))+', crown '+[hi.r,hi.g,hi.b].map(v=>v.toFixed(2)));
    G.P.x=0; G.P.z=-700; G.P.y=G.getH(0,-700); G.updateZoneLabel(); const inZone=c.el('#zone').textContent;
    G.P.x=0; G.P.z=-1025; G.P.y=G.getH(0,-1025); G.updateZoneLabel();
    ok('standing in the Greyspine the zone label names its zone (levels 26-32) or, on the spine, the land, and the map shows its land',/^Miners' Scree \(Lv 28\)$/.test(inZone)&&c.el('#zone').textContent==='The Greyspine'&&G.landHere()==='grey'&&G.LANDS.grey.z1>G.HZ0,inZone+' / '+c.el('#zone').textContent+', '+G.landHere());
    G.P.x=sv.x; G.P.y=sv.y; G.P.z=sv.z; }
  { const W0=G.GEAR.west, g=G.GLEN, mk=(x,z)=>({x,z,inTun:false}), a=mk(g.ice-4,g.z), b=mk(G.HALF-5,g.z), c=mk(G.HALF-5,g.z+14);
    G.GEAR.west=0; G.worldBounds(a,g.ice+1,0.32,g.z);
    G.GEAR.west=1; G.worldBounds(b,G.HALF+3,0.32,g.z); G.worldBounds(c,G.HALF-4,0.32,g.z+9);
    G.GEAR.west=W0;
    ok('the shut ice fall stops you in the glacier valley; an open one lets you through to the Greyspine, and inside the cut near the crest you stay between its walls',a.x>=g.ice+0.79&&b.x<G.HALF-4.9&&Math.abs(c.z-g.z)<=g.w,'shut '+a.x.toFixed(1)+', open '+b.x.toFixed(1)+', walls '+(c.z-g.z).toFixed(1)); }
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
  G.NET.send({t:'dev',cmd:'weather',v:'clear'});
  // zone tiers: unlock through the testing tool, the symbol shows, the picker works in the village, a monster's level and health follow your tier
  G.NET.send({t:'dev',cmd:'zt',v:1}); await wait(500); G=c.G();
  ok('zone tiers: three lands unlocked at tier I show the symbol (three points, +30%)',G.GEAR.zt.home.max===1&&!c.el('#plSym').hidden&&/\+30%/.test(c.el('#plSym').title||''),c.el('#plSym').title);
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
    ok('dungeon: the run\'s monsters have views at the run\'s level',G.MONS.filter(m=>m.dgK&&G.monTierK(m).lv===R.L).length>3);
    G.applySnap({dg:[0,40,0,3,9]}); G.dgHudTick(0.016); ok('dungeon: the dg snapshot drives the HUD text',el('#dgHudTitle').textContent==='Purge'&&el('#dgHudLines')._kids.some(k=>k.textContent==='Monsters slain: 3 / 9'));
    const me=G.NET.pid; G.applyEvent(['pty',me,me,[[me,'Me',100,100,50,0,R.id],[4242,'Ann',0,120,29,1,R.id]]]);
    ok('dungeon: a downed member shows in the party frame',!el('#dgPtyFrame').hidden&&el('#dgPtyFrame')._kids.length===1&&/down/.test(el('#dgPtyFrame')._kids[0].className));
    G.applyEvent(['pty',me,0,[]]);
    G.applyEvent(['dge',me,0,61,40,12,[],2,'Everyone was down at once.']); ok('dungeon: the results panel appears on dge',!el('#dgResult').hidden&&el('#dgResultTitle').textContent==='The run is lost'&&/Everyone/.test(el('#dgResultWhy').textContent));
    const geos=G.DG_VIEW.geos.slice(); let gone=0; for(const g of geos){ const f=g.dispose.bind(g); g.dispose=()=>{ gone++; f(); }; }
    G.NET.send({t:'dg',a:'leave'}); await wait(700); G=c.G(); for(let i=0;i<3;i++){ G.updateEnv(0.05); G.cullChunks(0.05); } let left=0; G.scene.traverse(o=>{ if(o.name==='dungeon') left++; });
    ok('dungeon: leaving gives the world back (sky, water, sun shadow, fog, streaming) and disposes the meshes',!G.dgIn()&&sp().inst===0&&left===0&&gone===geos.length&&G.sky.visible&&G.water.visible&&G.sun.castShadow&&G.scene.fog.far>100&&G.camera.far===1200&&!G.MONS.some(m=>m.dgK),gone+' of '+geos.length+' geometries'); }
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
