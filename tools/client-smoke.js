// Headless client test: runs dist/wildwood.html in Node with a stub DOM/WebGL (tools/headless.js) and plays solo through the real
// client code. Build first (python3 build.py). Needs the three package (npm install). Prints PASS/FAIL lines.
// Usage: node tools/client-smoke.js
const {bootClient}=require('./headless');
const c=bootClient({expose:['ultAbilityNow','ULT_SKILLS','ULT_UI','ultPopup','ultFillTile','CB','RD_ORDER','RDS','RD_FOOT','RD_CL','buildRaids','GW0','WA_GATES','WA_HUBS','waLand','waGround','barStep','westBarX','northBarZ','waLandId','guidePages','openGuide','openQuests','qShowTab','openVersions','verPages','guestGateShow','LOOK','SSL','SS_ORDER','RXV','rxViewUpdate','defineSkillSet','SS_SETS','SK','renderSkills','canSwap','SSV','ssvUpdate','GXJ','borderXN','closePanels','WZ0','WZ1','WX1','wmapOpen','wmapToggle','wmapClick','wmapGo','wmapPin','wmapUpdate','wmapRegionAt','wmapArt','WMAP_W','WMAP_H','WM','WMAP_TOWNS','WMAP_BANNER','WMAP_BANKS','WMAP_LOCK','mapLand:()=>mapLand','VIL2','WX0','slopeBlock','SLOPE_MAX','TUN','bridgeDeck','valeOpen','borderX','borderZ','NET','mqTarget','mqLogRow','mqMark','odranHere','MQ_BY_ID','VIL4','LORE_BY_ID','updateZoneLabel','mapEdgeAlpha','GREY_HM','GREY_QUEEN','greySnowAmt','drawFullMap','drawMinimap','mapCX','landOpen','CHAM','chamoisUpdate','chamoisOK','GLEN','GREY_GATES','slotIcon','PENDANT_STATS','itemStat','HALF','GREY','updateGreyspine','startSolo','scene','beginPlay','MONS','P','PL','CB','GEAR','MAP','CHAT','WX','doAttack','equip','updateMonsters','updateCombat','updateWeather','openSkills','openSoul','PASSIVE_IDS','attackVisuals','applyEvent','SKILLS','ANIM_OF','BOSS_SKILLS','AREA_FX','BOLTS','ACT_SKILL','renderInv','sendChat','openChat','chatText','getH','canStart:()=>canStart','camera','VIL','VIL2','VIL3','PASS','NODES','NODE_VIEWS','NODE_KINDS','NODE_TAKEN','nearNode','nodePrompt','gatherNode','openLodge','openTravel','nearCircle','CIRCLES','snowfall','rain','musicThemeHere','landHere','LANDS','ZONES','northOpen','updateHoarfrost','updateNodes','updateAurora','AURORA','HOAR','terrainColor','worldBounds','HZ0','ITEM','itemIcon','craftHtml','renderBrew','openBrew','openShop','renderShop','panelNPC:()=>panelNPC','drinkPotion','onPotionEvent','updatePotBar','POT_ST','potBar','MQ','CAST','castBar','updateNodes','monTierK','zoneLvText','zoneTierOn','renderTierRow','landOfZone','landAt',
  'DG_RUN:()=>DG_RUN','CAVE_RUN:()=>CAVE_RUN','CVB_FX','CVB_LIFT','CVB_LANE','cvbFrame','cvbSpeedK','cvbLift','caveRunEnter','caveRunLeave','CAVE_MP','CAVE_M','NETH','caveBoardHtml','caveWhereHtml','CAVE_SKILL_IDS','CAVE_SKILLS','CAVE_FLOOR_N','caveMState','caveBake','caveInfoHtml','caveGridHtml','caveDrop','skCanDrop','CAVE_UI','openPanel','renderCaveLift','CAVE_VIS','CAVE_VIS_BAD','CVV','cvv1Wind','DG_VIEW','DG_THEMES','dgFree','dgIn','dgHudText','dgHudTick','dgDownText','sky','water','sun','updateCamera','updateEnv','updatePlayer','applySnap','keys','TERRAIN_BANDS','cullChunks','playerDown','playerUp','Stream','NPCs','NPC_DEFER','npcById','terrainHot','nextLazyTile']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const el=s=>document.querySelector(s);
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('world streams in',G.canStart());
  { const pg=G.guidePages(), ids=Object.keys(pg);   // the Guide: ten tabs of text, opened by its panel
    ok('the guide has its ten tabs, each with text',ids.length===10&&ids.every(i=>pg[i].h.length>200),ids.join());
    ok('the reactions page lists all fifteen',(pg.reactions.h.match(/<tr>/g)||[]).length===15);
    G.guestGateShow('level'); ok('the guest popup says to register',!el('#guestGate').hidden&&/Register/.test(el('#ggText').textContent)); el('#ggLater').click(); ok('and closes with Not now',el('#guestGate').hidden);
    G.openVersions(); ok('the versions panel opens with three lists',!el('#versions').hidden&&Object.keys(G.verPages()).length===3); G.closePanels();
    G.openGuide(); ok('the guide opens as a panel',!el('#guide').hidden); G.closePanels(); ok('and closes with the others',el('#guide').hidden); }
  // the first-load diet: the ground of far lands is coloured when you come near, and the far villages' people are built after the loading screen
  { const bands=G.TERRAIN_BANDS, wait0=bands.filter(b=>!b.ready), ready0=bands.filter(b=>b.ready), npc0=G.NPCs.length;
    ok('terrain: at boot only the tiles by the spawn are coloured; the rest wait for you and are not drawn',ready0.length>0&&wait0.length>ready0.length&&wait0.every(b=>b.lazy&&!b.mesh.visible)&&G.Stream.lazy===wait0.length,ready0.length+' coloured, '+wait0.length+' waiting');
    ok('terrain: a tile coloured at boot has real colours (the ground is not black)',ready0.some(b=>{ let nz=0; for(let i=0;i<b.tc.length;i++) if(b.tc[i]>0) nz++; return nz>b.tc.length*0.9; }));
    const far=wait0.sort((a,b)=>Math.hypot(b.x0-G.P.x,b.z0-G.P.z)-Math.hypot(a.x0-G.P.x,a.z0-G.P.z))[0], home={x:G.P.x,z:G.P.z,y:G.P.y};
    G.P.x=(far.x0+far.x1)/2; G.P.z=(far.z0+far.z1)/2;   // walk (jump) there: the scheduler colours the tile you stand on first
    let t=0; for(;t<600&&!far.ready;t++){ await wait(100); }
    G=c.G(); let nz=0; for(let i=0;i<far.tc.length;i++) if(far.tc[i]>0) nz++;
    ok('terrain: a far tile is coloured once you are there, within seconds, and the count of waiting tiles stays right',far.ready&&!far.lazy&&nz>far.tc.length*0.9&&G.Stream.lazy===G.TERRAIN_BANDS.filter(b=>b.lazy).length,(t/10)+' s, '+Math.round(100*nz/far.tc.length)+'% of the colours set');
    G.P.x=home.x; G.P.z=home.z; G.P.y=home.y;
    for(let i=0;i<300&&G.NPC_DEFER.length;i++){ await wait(100); G=c.G(); }
    ok('villagers: Rimehold\'s and Highmark\'s people are built after the loading screen, not before it',npc0<G.NPCs.length&&G.NPC_DEFER.length===0&&!!G.npcById('villagerr0')&&!!G.npcById('villagerg0'),npc0+' at boot, '+G.NPCs.length+' later'); }
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  ok('solo server: welcome and monster views',G.NET.ready&&G.MONS.length>400,G.MONS.length+' views');
  const s=G.MONS.find(m=>m.def.id==='slime'); G.P.x=s.x+1.5; G.P.z=s.z; G.P.y=G.getH(G.P.x,G.P.z);
  for(let i=0;i<120&&!s.dead;i++){ G.CB.target=s; G.P.yaw=Math.atan2(-(s.x-G.P.x),-(s.z-G.P.z)); G.doAttack('basic'); G.updateMonsters(0.033); G.updateCombat(0.033); await wait(33); }
  G=c.G(); ok('attack through the server kills a slime',s.dead,'xp '+G.PL.exp.toFixed(1));
  { const m=G.MONS.find(x=>!x.dead&&x.def.id==='boar')||G.MONS.find(x=>!x.dead); G.applyEvent(['aura',m.id,'fire',6]); G.applyEvent(['aura',m.id,'water',6]); const n1=G.RXV.marks.size;   // reactions: the client's display
    G.applyEvent(['react',m.id,'fire|water']); G.applyEvent(['st',m.id,'vuln',0.14,6,G.NET.pid]); G.rxViewUpdate(0.033); const shown=G.RXV.marks.get(m.id)&&G.RXV.marks.get(m.id).el==='water'; G.applyEvent(['aura',m.id,0,0]);
    ok('reactions: one aura marker over a monster (it changes element), the reaction and status notes pop without error, and the marker goes with its aura',n1===1&&shown&&G.RXV.marks.size===0); }
  G.equip('bow1'); await wait(300); ok('equip round-trip',c.G().GEAR.eq.weapon==='bow1');
  el('#inv').hidden=false; G.renderInv(); ok('inventory renders body slots, the ring and pendant slots and the three tool slots',(el('#invBody').innerHTML.match(/class="eqslot"/g)||[]).length===10&&['pick','axe','sickle','ring','pendant'].every(k=>el('#invBody').innerHTML.includes('data-slot="'+k+'"')));
  { G.openQuests(null); const q=()=>el('#qBody').innerHTML;   // the quest panel: four tabs, the main quest first; notices to defeat monsters show the monster's picture
    ok('the quest panel opens on the main quest, with its tabs',!el('#quests').hidden&&(el('#qTabs').innerHTML.match(/data-qt=/g)||[]).length===4&&/jq-step/.test(q())&&q().includes(G.MQ[G.GEAR.mq.s].title),q().slice(0,120));
    G.qShowTab('board'); ok('the board tab lists the notices, a hunt with its monster\'s picture, and no Accept away from Maren',(q().match(/class="qc /g)||[]).length===G.GEAR.q.offers.length&&(!G.GEAR.q.offers.some(o=>o.type==='kill')||/data-mp="/.test(q()))&&!/data-accept/.test(q()));
    G.qShowTab('side'); ok('the side quests tab lists the eight chains, each with its land, level and cosmetic, none under way yet',(q().match(/class="sq-card/g)||[]).length===8&&/The Grey Tide/.test(q())&&/Tide King&#39;s Mantle|Tide King's Mantle/.test(q())&&/From level 15/.test(q()),q().slice(0,200));
    G.qShowTab('taken'); ok('the taken tab says when you carry nothing',/carry no notices/.test(q())); G.closePanels(); }
  G.openSkills(); ok('skills panel renders 5 slots (the three class slots, the cave row and the burst row)',(el('#skBody').innerHTML.match(/class="sk-slot/g)||[]).length===5&&/data-ultslot/.test(el('#skBody').innerHTML));
  ok('skills panel: the cave row says what to do (locked below level 23, or Go to the cave)',/data-caveslot/.test(el('#skBody').innerHTML)&&/(Opens at level 23|Go to the cave)/.test(el('#skBody').innerHTML));
  { const h=()=>el('#skBody').innerHTML; ok('skills panel: a tab for 1, 2, 3, Cave, Burst and Passive, and three passive slots',(h().match(/data-skkind=/g)||[]).length===6&&(h().match(/class="sk-pslot/g)||[]).length===3);
    ok('an unowned boss skill shows as Boss in the grid and cannot be bought',/data-id="spore"[^>]*>(?:(?!<\/button>)[\s\S])*<span class="lv">Boss<\/span>/.test(h())&&!/data-buyskill="spore"/.test(h()),G.GEAR.eq.weapon);
    G.NET.send({t:'dev',cmd:'level',v:20}); G.NET.send({t:'dev',cmd:'skills'}); G.NET.send({t:'dev',cmd:'mats'}); await wait(600); G=c.G();
    G.openSkills(null,'pass'); ok('passives tab lists every passive, Vitality is in a slot',(h().match(/data-from="grid"/g)||[]).length===G.PASSIVE_IDS.length&&(h().match(/class="sk-pslot on/g)||[]).length===1,G.GEAR.skills.pass.join());
    G.NET.send({t:'dev',cmd:'level',v:40}); G.NET.send({t:'dev',cmd:'ult'}); await wait(600); G=c.G(); G.openSkills(null,'ult');
    ok('the Burst tab lists a tile for each burst, all owned after the testing tool',(h().match(/data-ult="/g)||[]).length>=Object.keys(G.ULT_SKILLS).length&&!/sk-tile[^"]*unowned/.test(h()),String((h().match(/data-ult="/g)||[]).length));
    { const id=Object.keys(G.ULT_SKILLS)[0]; G.ULT_UI.sel=id; G.openSkills(null,'ult'); ok('a selected burst shows its cooldown, stun and both boosts with an Equip button',/data-ulton=/.test(h())&&/stun/.test(h())&&(h().match(/<li>/g)||[]).length===2); G.NET.send({t:'ultequip',id}); await wait(500); G=c.G();
      G.ultFillTile(); ok('wearing a burst makes it the castable 5th-slot ability (the tile fills without error)',G.GEAR.skills.ult===id&&G.ultAbilityNow()&&G.ultAbilityNow().set===id,G.GEAR.skills.ult+' | '+el('#abUlt').querySelector('.nm').textContent+' | '+id);
      G.ultPopup(id); ok('the cast popup builds its card with the burst\'s name, in the set\'s colours',!el('#ultPopup').hidden&&/./.test(String(el('#ultPopup')._kids&&el('#ultPopup')._kids.length)),String(el('#ultPopup').hidden)); }
    G.openSkills(null,'skill'); ok('a skill tile shows its level and element',/class="sk-tile[^"]*has-el[^"]*"[^>]*data-id="volley"[^>]*data-from="grid"/.test(h()),G.GEAR.eq.weapon);
    G.openSoul(); ok('soul hall lists the seven elements',(el('#soBody').innerHTML.match(/data-soul=/g)||[]).length===7&&!/disabled/.test(el('#soBody').innerHTML));
    el('#inv').hidden=false; G.renderInv(); ok('inventory lists monster drops',(el('#invBody').innerHTML.match(/class="tile r[03] matt"/g)||[]).length>=30&&G.GEAR.mats.slime>=20);
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
    // the looks of the skill sets: every piece of every set, drawn through the real client code (swing, projectile and its landing, zone, beam, chain, buffs, heals and shields on an ally), in the set's own look
    { const me=G.NET.pid, x0=G.P.x+2, y0=G.P.y+1.4, z0=G.P.z, bad=[], total=()=>G.SSL.parts.length+G.SSL.decals.length+G.CB.fx.length+G.CB.projs.length+G.AREA_FX.size+G.BOLTS.length; let n=0, areas=[];
      for(const id of G.SS_ORDER) if(!G.SSL.looks[id]) bad.push(id+': no look');
      for(const id of G.SS_ORDER) for(const pos of [1,2,3]) for(const sid of G.SS_SETS[id].pos[pos].ids){
        const s=G.SKILLS[sid], f=s.fx, k=s.act[0], evs=[], b0=total(); n++;
        G.attackVisuals({kind:G.ANIM_OF[k]||k,sk:k},null);
        if(f.proj) evs.push(['proj',700+n,f.proj.kind,x0,y0,z0,-20,0,0,null,sid],['pend',700+n,x0-6,y0,z0,null]);
        if(f.zone){ evs.push(['area',600+n,'zone',x0,z0,f.zone.r,f.zone.dur,me,s.el,(f.zone.follow?2:0),sid]); areas.push(600+n); }
        if(f.beam) evs.push(['beam',x0,y0,z0,x0-20,y0,z0,s.el,1.4,sid]);
        if(f.chain) evs.push(['chain',[[x0,y0,z0],[x0-3,y0,z0],[x0-6,y0,z0+2]],s.el,sid]);
        if(f.ally) evs.push(['ast',me,(Array.isArray(f.ally)?f.ally[0]:f.ally).kind,0.1,0.2,sid]);
        if(f.heal) evs.push(['fxa',me,'heal',sid]);
        if(f.shield) evs.push(['fxa',me,'shield',sid]);
        for(const e of evs) G.applyEvent(e);
        let peak=total(); for(let j=0;j<6;j++){ G.updateCombat(0.033); peak=Math.max(peak,total()); }
        if(peak<=b0) bad.push(sid);
      }
      for(const id of G.SS_ORDER) for(const t of [3,5]){ const r=G.SS_SETS[id].bonus[t]; G.applyEvent(['ast',me,'haste',0.1,0.2,r.id]); G.applyEvent(['fxa',me,'heal',r.id]); }   // (the passives' and bonuses' own rows name themselves)
      G.applyEvent(['ast',me,'haste',0.1,0.2,'notaset_1']); G.applyEvent(['fxa',me,'heal','notaset_1']);   // (a piece that is not a set's draws nothing and breaks nothing)
      for(const a of areas) G.applyEvent(['aend',a]);
      await wait(350); for(let j=0;j<220;j++) G.updateCombat(0.033);
      ok('skill sets: every set has a look, and every piece of the eight sets draws in it without errors',!bad.length&&!G.SSL.bad.length,bad.length?'nothing drawn for '+bad.join(', '):n+' pieces, '+G.SS_ORDER.length+' looks');
      ok('...and everything they made is gone again (particles, ground patterns, auras, zones)',G.SSL.parts.length===0&&G.SSL.decals.length===0&&G.SSL.auras.size===0&&G.AREA_FX.size===0,G.SSL.parts.length+' particles, '+G.SSL.decals.length+' patterns, '+G.SSL.auras.size+' auras, '+G.AREA_FX.size+' zones'); }
  }
  // gems: the shop icon opens the gem shop, the public button grants 1000 gems, and a locked outfit tile buys on its second tap
  { const n0=c.G().GEAR.gem||0; c.el('#bGems').click(); await wait(100); c.el('#gemFree').click(); await wait(400); const n1=c.G().GEAR.gem||0; const open=!c.el('#gemShop').hidden; c.el('#bInv').click(); await wait(100);
    ok('gems: the shop icon opens the shop and its free button adds 1000 gems (shown in the inventory header)',open&&n1>=n0+1000&&/ gems/.test(c.el('#invGems').textContent),n0+' -> '+n1); c.G().closePanels(); }
  G.openChat(); G.chatText.value='hi'; G.sendChat(); await wait(300); ok('chat line arrives',c.G().CHAT.lines.length>0);
  for(let i=0;i<450&&!c.G().MAP.done;i++) await wait(100); ok('world map painted',c.G().MAP.done);
  G.NET.send({t:'dev',cmd:'weather',v:'rain'}); await wait(300); for(let i=0;i<60;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } ok('rain fades in',G.WX.inten>0.9);
  // ---- the Hoarfrost Reach (levels 22-30): the client side of the third land ----
  G.NET.send({t:'dev',cmd:'weather',v:'clear'}); G.NET.send({t:'dev',cmd:'level',v:24}); G.NET.send({t:'dev',cmd:'vale',v:2}); G.NET.send({t:'dev',cmd:'north',v:2}); G.NET.send({t:'dev',cmd:'prof'}); G.NET.send({t:'dev',cmd:'coins'}); await wait(700); G=c.G();
  ok('the server tells the client about the ice wall and the professions',G.GEAR.north===2&&G.northOpen()&&G.GEAR.prof.mining&&G.GEAR.prof.gathering);
  G.P.x=G.VIL3.x+3; G.P.z=G.VIL3.z+3; G.P.y=G.getH(G.P.x,G.P.z); for(let i=0;i<50;i++) G.updateHoarfrost(0.1);   // (the wall sinks for 3.4 s when the server says it opened)
  // barriers (shared/barriers.js): a shut gate holds; an open land holds nobody. A step is made from (ox, oz) to o, like the movement code does
  const borderAt=(a,b,dx,dz)=>{ for(let x=G.WX0+40;x<G.WX1-40;x+=8) for(let z=G.WZ0+40;z<G.WZ1-40;z+=8){ const p=G.waLandId(x,z), q=G.waLandId(x+dx,z+dz); if((p===a&&q===b)) return {x,z,x2:x+dx,z2:z+dz}; } return null; };   // a cell of land a with a cell of land b one step (dx, dz) away
  const stepOver=(gear,k,v,B)=>{ const g0=G.GEAR[k]; G.GEAR[k]=v; const o={x:B.x2,z:B.z2,inTun:false}; G.worldBounds(o,B.x,0.32,B.z); G.GEAR[k]=g0; return o; };
  { const W=G.PASS, N0=G.GEAR.north, o1={x:W.x,z:W.ice-1,inTun:false}, o4={x:W.x,z:W.ice-1,inTun:false}, o2={x:W.x+8,z:W.ice-5,inTun:false}, o5={x:W.x+30,z:W.ice-5,inTun:false}, B=borderAt(1,2,0,-8)||borderAt(1,2,8,0);
    G.GEAR.north=0; G.worldBounds(o1,W.x,0.32,W.ice+2); G.worldBounds(o2,W.x+8,0.32,W.ice+2); const held=B?stepOver(G.GEAR,'north',0,B):null; G.GEAR.north=1; G.worldBounds(o4,W.x,0.32,W.ice+2); G.worldBounds(o5,W.x+30,0.32,W.ice+2); const free=B?stepOver(G.GEAR,'north',1,B):null; G.GEAR.north=N0;
    ok('the sealed ice wall stops you in the pass and the Reach\'s whole border holds (the vale | Reach border too); once the Reach is open no clamp holds you anywhere along it (the ground and the slope limit do)',o1.z>=W.ice+0.79&&o4.z<W.ice-0.9&&o2.z>=W.ice+0.79&&o5.z<W.ice-4&&!!B&&held.x===B.x&&held.z===B.z&&G.waLandId(free.x,free.z)===2,'sealed '+o1.z.toFixed(1)+', open '+o4.z.toFixed(1)+', wall '+o2.z.toFixed(1)+', open off the pass '+o5.z.toFixed(1)+', border '+JSON.stringify(B)); }
  // the highest ground of the Greyspine (the atlas's spine rises to 150-187 m: the crowns that are white)
  const greyCrown=()=>{ let b={h:-1}; for(let x=G.WX0;x<G.WX1;x+=16) for(let z=G.WZ0;z<G.WZ1;z+=16) if(G.waLand(x,z)==='grey'){ const h=G.getH(x,z); if(h>b.h) b={x,z,h}; } return b; };
  // ---- the Greyspine (the fourth land, terrain only): the client side ----
  { const sv={x:G.P.x,y:G.P.y,z:G.P.z}, H=G.GREY_HM, q=G.GREY_QUEEN, a={x:H.x,z:H.z,inTun:false}, b={x:-300,z:G.HZ0-100,inTun:false}, d={x:-300,z:G.HZ0-5,inTun:false}, lo=new THREE.Color(), hi=new THREE.Color();
    G.worldBounds(a,H.x,0.32,H.z);
    { const B=borderAt(0,3,0,-8)||borderAt(0,3,-8,0)||borderAt(0,3,8,0), held=B?stepOver(G.GEAR,'west',0,B):null, free=B?stepOver(G.GEAR,'west',1,B):null;
    ok('in the Greyspine you can stand (a teleport there is not pulled back); its border with the home forest holds while the ice fall stands (gear.west 0) and holds nobody once it is open',a.z===H.z&&!!B&&held.x===B.x&&held.z===B.z&&free.x===B.x2&&free.z===B.z2,'shelf '+a.z+', border '+JSON.stringify(B)); }
    const crown=greyCrown(), tx=G.VIL4.x-60, tz=G.VIL4.z+90; G.terrainColor(tx,tz,G.getH(tx,tz),0.2,lo); G.terrainColor(crown.x,crown.z,crown.h,0.2,hi);
    ok('the Greyspine has ground colours of its own: green meadow in the trough, white snow on the Queen\'s crown; the map paints it',lo.g>lo.r&&lo.g>lo.b&&hi.r>0.8&&hi.g>0.8&&hi.b>0.8&&G.mapEdgeAlpha(G.VIL4.x,G.VIL4.z)===255,'trough '+[lo.r,lo.g,lo.b].map(v=>v.toFixed(2))+', crown '+[hi.r,hi.g,hi.b].map(v=>v.toFixed(2)));
    let inZone='', bare=null;   // a Greyspine point with a zone label, and one the zones do not cover (the label then names the land)
    for(let x=G.WX0;x<G.WX1&&!(inZone&&bare);x+=40) for(let z=G.WZ0;z<G.WZ1&&!(inZone&&bare);z+=40) if(G.waLand(x,z)==='grey'&&G.landHere){ G.P.x=x; G.P.z=z; G.P.y=G.getH(x,z); G.updateZoneLabel(); const t=c.el('#zone').textContent; if(/\(Lv (2[6-9]|3[0-2])\)$/.test(t)&&!inZone) inZone=t; else if(t==='The Greyspine'&&!bare) bare=t; }
    G.P.x=G.VIL4.x; G.P.z=G.VIL4.z; G.P.y=G.getH(G.P.x,G.P.z);
    ok('standing in the Greyspine the zone label names its zone (levels 26-32) or, where no zone covers, the land, and the map shows its land',!!inZone&&G.landHere()==='grey'&&G.LANDS.grey.z1>G.LANDS.hoar.z0,inZone+' / '+bare+', '+G.landHere());
    G.P.x=sv.x; G.P.y=sv.y; G.P.z=sv.z; }
  { const W0=G.GEAR.west, g=G.GLEN, mk=(x,z)=>({x,z,inTun:false}), bar=Math.max(G.westBarX(g.z),g.ice), a=mk(bar-4,g.z), B=borderAt(2,3,-8,0), b=mk(bar-4,g.z);
    G.GEAR.west=0; G.worldBounds(a,bar+1,0.32,g.z); const held=B?stepOver(G.GEAR,'west',0,B):null;
    G.GEAR.west=1; G.worldBounds(b,bar+1,0.32,g.z); const free=B?stepOver(G.GEAR,'west',1,B):null;
    G.GEAR.west=W0;
    ok('the shut ice fall stops you in the glacier valley (and the Reach | Greyspine border holds all along it); once the fall is open nothing but the ground holds you there',a.x>=bar+0.79&&b.x<bar-3&&!!B&&held.x===B.x&&free.x===B.x2,'shut '+a.x.toFixed(1)+' (the fall '+bar+'), open '+b.x.toFixed(1)+', border '+JSON.stringify(B)); }
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
  { const Gs=G.GREY_GATES.filter(T=>!T.dir), R0=G.GEAR.river, N0=G.GEAR.neck, mk=(x,z)=>({x,z,inTun:false}), res=[];
    for(const T of Gs){ const a=mk(T.x-4,T.z), b=mk(T.x-4,T.z); G.GEAR[T.id]=0; G.worldBounds(a,T.x+1,0.32,T.z); G.GEAR[T.id]=1; G.worldBounds(b,T.x+1,0.32,T.z); res.push([a.x,b.x]); }
    G.GEAR.river=R0; G.GEAR.neck=N0;   // (the river gate's and Redgate's walls run east-west or north-south: sunscar-smoke tests them)
    ok('a shut rock fall stops you east of each west-wall canyon; an open one lets you through to the edge',res.every(([s,o],i)=>s>=Gs[i].x+0.79&&o<Gs[i].x),res.map(r=>r.map(v=>v.toFixed(1)).join('/')).join(' ; ')); }
  ok('the ice wall is hidden once the way is open',G.HOAR.wall&&!G.HOAR.wall.visible);
  ok('Rimehold plays its own music and Frostgate Pass its own zone label',G.musicThemeHere()==='rimehold'&&G.landHere()==='hoar');
  { const h3=G.ZONES.find(z=>z.key==='h23'); G.P.x=h3.x; G.P.z=h3.z; ok('the Reach\'s music (levels 22-26) outside the village',G.musicThemeHere()==='hoar1'); }
  { const h4=G.ZONES.find(z=>z.key==='h29'); G.P.x=h4.x; G.P.z=h4.z; ok('and the harder ranges another (27-30)',G.musicThemeHere()==='hoar2'); }
  G.openLodge(); { const h=el('#loBody').innerHTML; ok('the Wayfarers\' Lodge lists three professions (learned), a tool shop with six tier chips and three tools, and the resources to sell',(h.match(/class="lo-row/g)||[]).length===3&&(h.match(/>Learned</g)||[]).length===3&&(h.match(/data-tier=/g)||[]).length===6&&(h.match(/data-buytool=/g)||[]).length===3&&!/Coming later/.test(h)); }
  ok('every pendant has an icon, the five kinds look different (and a tempered one has its sparkle), the empty slot shows a ghost pendant, and its text says what it does',Object.keys(G.ITEM).filter(id=>id.startsWith('pendant-')).length===175&&Object.keys(G.ITEM).filter(id=>id.startsWith('pendant-')).every(id=>G.itemIcon(G.ITEM[id]).includes('<svg'))&&
    new Set(G.PENDANT_STATS.map(k=>G.itemIcon(G.ITEM['pendant-'+k]))).size===5&&G.itemIcon(G.ITEM['pendant-xp-e'])!==G.itemIcon(G.ITEM['pendant-xp-e+3'])&&G.slotIcon('pendant').includes('ghost')&&G.itemStat(G.ITEM['pendant-xp'])==='+6% XP from kills');
  { G.GEAR.inv.push('pendant-xp-e+3'); G.GEAR.eq.pendant='pendant-xp-e+3'; el('#inv').hidden=false; G.renderInv(); const h=el('#invBody').innerHTML; G.GEAR.eq.pendant=null; G.GEAR.inv=G.GEAR.inv.filter(i=>i!=='pendant-xp-e+3');
    ok('a worn pendant shows in its slot beside the chest',/data-slot="pendant" style="grid-area:neck"/.test(h)&&h.includes('data-id="pendant-xp-e+3"')); }
  ok('the tools have icons of their own',['pick1','axe1','sickle1','pick6-l'].every(id=>G.itemIcon(G.ITEM[id]).includes('<svg'))&&G.itemIcon(G.ITEM.pick1)!==G.itemIcon(G.ITEM.axe1)&&G.itemIcon(G.ITEM.axe1)!==G.itemIcon(G.ITEM.sickle1));
  G.P.x=G.VIL3.tele.x; G.P.z=G.VIL3.tele.z; G.P.y=G.getH(G.P.x,G.P.z); G.openTravel();
  { const h=el('#trBody').innerHTML; ok('stepping on a circle opens a window with every village: this one marked, the open ones to travel to, Highmark cold until you have been there',G.nearCircle()===G.VIL3&&(h.match(/data-to=/g)||[]).length===8&&/You are here/.test(h)&&(h.match(/Travel here/g)||[]).length===3&&(h.match(/<button[^>]*disabled/g)||[]).length===5); }   // (seven villages and the Deep Cave's mouth: this one, three open, Highmark, Glasswell, Wraithwick and Tallgrass still cold)
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
  G.openBrew({def:{name:'Ylva'}}); { const h=el('#brBody').innerHTML; ok('the brewing panel lists eighteen potions with their herbs and a Brew button each',(h.match(/data-brew=/g)||[]).length===36&&(h.match(/class="it"/g)||[]).length===18&&/Greater Healing Potion/.test(h)); }
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
    const q=greyCrown(); at(q.x,q.z); ok('...and on the Gryphon Queen\'s peak it is snowfall',G.WX.snow>0.95&&G.snowfall.visible&&!G.rain.visible);
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
    ok('...the two bosses and the Blackseam\'s door (the Old Adit)',texts.some(x=>/Gryphon Queen/.test(x))&&texts.some(x=>/Mountain Golem/.test(x))&&has('The Old Adit'));
    ok('...and the two rock falls in the west wall (the River Pass and the Windswept Neck)',has('The River Pass')&&has('The Windswept Neck'));
    ok('...with its own zone tier row',c.el('#mapTier').dataset.land==='grey'&&/Zone tier/.test(c.el('#mapTier').innerHTML||''));
    { let na=0; G.mapCX.arc=()=>{ na++; }; const prof=G.GEAR.prof, eq={pick:G.GEAR.eq.pick,axe:G.GEAR.eq.axe,sickle:G.GEAR.eq.sickle};
      G.GEAR.prof={mining:{xp:0},woodcutting:{xp:0},gathering:{xp:0}}; G.GEAR.eq.pick='pick6'; G.GEAR.eq.axe='axe6'; G.GEAR.eq.sickle='sickle6'; G.drawFullMap(); const withP=na; na=0;
      G.GEAR.prof=null; G.drawFullMap(); const without=na; G.GEAR.prof=prof; Object.assign(G.GEAR.eq,eq); G.mapCX.arc=()=>{};
      ok('...and the resource nodes you can work show as dots on it (the Greyspine\'s, as in the Reach)',withP>without+20,withP+' dots with the professions and the best tools, '+without+' without'); }
    let mmErr=null; try{ G.drawMinimap(); }catch(e){ mmErr=e; } ok('the minimap draws in the Greyspine without error (the 90 m around you, from the same painted image)',!mmErr);
    G.P.x=0; G.P.z=0; G.GEAR.west=0; const shut=G.landOpen('grey'); G.GEAR.west=1; const open=G.landOpen('grey'); G.GEAR.west=sv.west;
    ok('the Greyspine\'s map opens from the home forest once the ice fall in the glacier valley is open (gear.west), not before',!shut&&open);
    G.mapCX.fillText=()=>{}; G.MAP.done=sv.done; G.P.x=sv.x; G.P.z=sv.z; }
  // the borders: the border river is not a wall (a hiker walking at it stops short of the deep water and of the crest line)
  {
    // the border river is wadeable (the atlas's fords, about 1.1 m): a hiker crosses it once the vale is open, and is held at it while the vale is locked
    { const E0=G.GEAR.east; let tried=0, crossed=0, held=0, why='';
      for(let z=G.WZ0+300;z<G.WZ1-300&&tried<4;z+=40){ let bx=null; for(let x=G.WX0+40;x<G.WX1-40;x+=4) if(G.waLandId(x,z)===0&&G.waLandId(x+4,z)===1){ bx=x+2; break; } if(bx===null||Math.abs(z-G.TUN.z)<80) continue;
        let flat=true; for(let x=bx-60;x<bx+60;x+=2) if(Math.abs(G.getH(x+2,z)-G.getH(x,z))/2>G.SLOPE_MAX*0.8) flat=false; if(!flat) continue; tried++;
        for(const e of [1,0]){ G.GEAR.east=e; const o={x:bx-50,z,inTun:false}; let ox; for(let i=0;i<110;i++){ ox=o.x; o.x+=1; G.worldBounds(o,ox,0.32,z); } if(e===1){ if(o.x>bx+20) crossed++; else why+=' open z'+z+' x'+o.x.toFixed(0); } else { if(G.waLandId(o.x,z)===0) held++; else why+=' shut z'+z+' x'+o.x.toFixed(0); } } }
      G.GEAR.east=E0;
      ok('the border river is not a wall: a hiker walks across it once the vale is open, and is held on his own bank while it is locked',tried>=2&&crossed===tried&&held===tried,tried+' places, crossed '+crossed+', held '+held+why); }
  }
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
  ok('zone tiers: every land unlocked at tier I shows the symbol (seven points, +70%, a badge for each land, the Amber Reach\'s too)',G.GEAR.zt.home.max===1&&G.GEAR.zt.grey.max===1&&G.GEAR.zt.amber.max===1&&!c.el('#plSym').hidden&&/\+70%/.test(c.el('#plSym').title||'')&&/Greyspine I/.test(c.el('#plSym').title||'')&&/Amber Reach I/.test(c.el('#plSym').title||'')&&/class="zs amber">I</.test(c.el('#plSym').innerHTML),c.el('#plSym').title);
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
    for(let i=0;i<100&&G.MONS.filter(m=>m.dgK).length<=3;i++){ await wait(200); G=c.G(); }   // (the roster arrives in a message of its own: wait for it, a loaded machine was slow once)
    { const dm=G.MONS.filter(m=>m.dgK); ok('dungeon: the run\'s monsters have views at the run\'s level',dm.filter(m=>G.monTierK(m).lv===R.L).length>3,dm.length+' views of the run, levels '+[...new Set(dm.map(m=>G.monTierK(m).lv))].join('/')+', the run\'s level '+R.L); }
    G.applySnap({dg:[0,40,0,3,9]}); G.dgHudTick(0.016); ok('dungeon: the dg snapshot drives the HUD text',el('#dgHudTitle').textContent==='Purge'&&el('#dgHudLines')._kids.some(k=>k.textContent==='Monsters slain: 3 / 9'));
    const me=G.NET.pid; G.applyEvent(['pty',me,me,[[me,'Me',100,100,50,0,R.id],[4242,'Ann',0,120,29,1,R.id]]]);
    ok('dungeon: a downed member shows in the party frame',!el('#dgPtyFrame').hidden&&el('#dgPtyFrame')._kids.length===1&&/down/.test(el('#dgPtyFrame')._kids[0].className));
    G.applyEvent(['pty',me,0,[]]);
    G.applyEvent(['dge',me,0,61,40,12,[],2,'Everyone was down at once.']); ok('dungeon: the results panel appears on dge',!el('#dgResult').hidden&&el('#dgResultTitle').textContent==='The run is lost'&&/Everyone/.test(el('#dgResultWhy').textContent));
    const geos=G.DG_VIEW.geos.slice(); let gone=0; for(const g of geos){ const f=g.dispose.bind(g); g.dispose=()=>{ gone++; f(); }; }
    G.NET.send({t:'dg',a:'leave'}); await wait(700); G=c.G(); for(let i=0;i<3;i++){ G.updateEnv(0.05); G.cullChunks(0.05); } let left=0; G.scene.traverse(o=>{ if(o.name==='dungeon') left++; });
    ok('raids: the seven ruins are built (3 to 5 meshes each) and a raid monster in the roster carries its raid level (roster fields 9, 10)',G.RD_ORDER.length===7&&G.MONS.filter(m=>m.dgK&&G.RD_ORDER.some(i=>Math.hypot(m.camp.x-G.RDS[i].x,m.camp.z-G.RDS[i].z)<G.RD_FOOT)).length>=150);
    ok('dungeon: leaving gives the world back (sky, water, sun shadow, fog, streaming) and disposes the meshes',!G.dgIn()&&sp().inst===0&&left===0&&gone===geos.length&&G.sky.visible&&G.water.visible&&G.sun.castShadow&&G.scene.fog.far>100&&G.camera.far===1200&&!G.MONS.some(m=>m.dgK&&!G.RD_ORDER.some(i=>Math.hypot(m.camp.x-G.RDS[i].x,m.camp.z-G.RDS[i].z)<G.RD_FOOT)),gone+' of '+geos.length+' geometries'); }
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
  // the world map of Eldmere (ui/world-map.js): the atlas painted as a map, the pin, the fog, the pointer, and the way into each land's map
  { G=c.G(); const T=G.WMAP_TOWNS, ids=['home','vale','hoar','grey','sun','gloam','amber'];
    ok('the art is the atlas: every land has a banner and a town that the atlas puts on its own land, and a click on a town finds that land',ids.every(l=>{ const t=G.wmapArt(T[l].x,T[l].z); return G.waLand(T[l].x,T[l].z)===l&&G.wmapRegionAt(t[0],t[1])===l&&!!G.WMAP_BANNER[l]; }));
    { const b0=G.WMAP_BANKS[0];
      ok('a click on a fog bank finds "unbuilt", on open sea nothing, and on Amber Reach its own land',G.wmapRegionAt(b0[0],b0[1])==='unbuilt'&&G.wmapRegionAt(5,5)===null&&G.wmapRegionAt(...G.wmapArt(T.amber.x,T.amber.z))==='amber'); }
    // the pin: exact everywhere (the atlas is the map), and none in a dungeon
    { const p0={x:G.P.x,z:G.P.z}; let bad=[], n=0;
      for(const l of ids){ G.P.x=T[l].x; G.P.z=T[l].z; const p=G.wmapPin(), t=G.wmapArt(T[l].x,T[l].z); if(!p||Math.hypot(p[0]-t[0],p[1]-t[1])>0.01||G.wmapRegionAt(p[0],p[1])!==l) bad.push(l+' village'); }
      for(let z=G.WZ0;z<=G.WZ1;z+=40) for(let x=G.WX0;x<=G.WX1;x+=40){ if(G.getH(x,z)<0.5||!G.waLand(x,z)) continue; G.P.x=x; G.P.z=z; const l=G.landHere(), p=G.wmapPin(); n++; if(!p||G.wmapRegionAt(p[0],p[1])!==l) bad.push(l+' '+x+','+z); }
      G.P.x=p0.x; G.P.z=p0.z;
      ok('your pin is exact at every village and sits on your own land\'s region at every dry point of the world',bad.length===0&&n>1000,n+' points'+(bad.length?'; off: '+bad.slice(0,6).join(' | '):'')); }
    // opening: the panel, the fog of the locked lands, the groups of puffs
    ok('the World button is in the map\'s header and the G key and the panel are known',!!el('#mapWorld')&&!!el('#wmap')&&!!el('#wmapC'));
    // (earlier checks opened every land and left you in the Greyspine: seal them again and go home)
    G.NET.send({t:'dev',cmd:'vale',v:0}); G.NET.send({t:'dev',cmd:'north',v:0}); G.NET.send({t:'dev',cmd:'west',v:0}); G.P.x=G.VIL.x+6; G.P.z=G.VIL.z+6; G.P.y=G.getH(G.P.x,G.P.z); await wait(700); G=c.G();
    ok('the vale, the Reach and the Greyspine are sealed again and you stand in the home forest',['vale','hoar','grey'].every(l=>!G.landOpen(l))&&G.landHere()==='home');
    G.wmapOpen(); G=c.G(); const W=()=>c.G().WM;
    ok('the world map opens (and the land map closes), all of the atlas in view at first and the locked lands under fog',!el('#wmap').hidden&&el('#map').hidden&&W().k>=W().min&&W().k<=W().max&&['vale','hoar','grey','sun','gloam','amber'].every(l=>W().fade[l]===1&&!G.landOpen(l)),'k '+W().k.toFixed(2));
    ok('fog is built for the three banks of open sea and each locked land, at least 40 puffs a group of the unbuilt, 100 for each locked land',W().fog.base.length===3&&W().fog.base.every(g=>g.n>=40)&&['vale','hoar','grey','sun','gloam','amber'].every(l=>W().fog[l].n>=100),W().fog.base.map(g=>g.n).join('/')+' + '+['vale','hoar','grey','sun','gloam','amber'].map(l=>W().fog[l].n).join('/'));
    // the pointer: wheel zooms about the cursor, a drag pans and does not click, two fingers pinch
    { const cv=el('#wmapC'), k0=W().k, w=W(); cv.fire('wheel',{clientX:300,clientY:300,deltaY:-400,deltaMode:0}); const k1=c.G().WM.k; cv.fire('wheel',{clientX:300,clientY:300,deltaY:-4000,deltaMode:0}); const k2=c.G().WM.k;
      cv.fire('wheel',{clientX:300,clientY:300,deltaY:40000,deltaMode:0}); ok('the wheel zooms in and out, between the whole map and 3.5 times that',k1>k0&&k2<=c.G().WM.max+1e-9&&Math.abs(k2/c.G().WM.min-3.5)<1e-6&&Math.abs(c.G().WM.k-c.G().WM.min)<1e-9,k0.toFixed(2)+' > '+k1.toFixed(2)+' > '+k2.toFixed(2));
      for(let i=0;i<3;i++) cv.fire('wheel',{clientX:300,clientY:300,deltaY:-300,deltaMode:0}); const cx0=c.G().WM.cx;
      cv.fire('pointerdown',{pointerId:1,clientX:300,clientY:300}); cv.fire('pointermove',{pointerId:1,clientX:240,clientY:300}); cv.fire('pointerup',{pointerId:1,clientX:240,clientY:300});
      ok('a drag pans the map the other way and does not open anything',c.G().WM.cx>cx0&&!el('#wmap').hidden&&el('#map').hidden,'cx '+cx0.toFixed(0)+' > '+c.G().WM.cx.toFixed(0));
      cv.fire('wheel',{clientX:300,clientY:300,deltaY:40000,deltaMode:0}); const k3=c.G().WM.k; cv.fire('pointerdown',{pointerId:1,clientX:250,clientY:300}); cv.fire('pointerdown',{pointerId:2,clientX:350,clientY:300}); cv.fire('pointermove',{pointerId:2,clientX:450,clientY:300}); cv.fire('pointerup',{pointerId:2,clientX:450,clientY:300}); cv.fire('pointerup',{pointerId:1,clientX:250,clientY:300});
      ok('two fingers moving apart zoom in, and ending the pinch does not click',c.G().WM.k>k3&&!el('#wmap').hidden,k3.toFixed(2)+' > '+c.G().WM.k.toFixed(2)); }
    // clicks: fog says what bars the way, an open land opens its map
    { G=c.G(); G.WM.k=G.WM.min; G.WM.cx=G.WMAP_W/2; G.WM.cy=G.WMAP_H/2; const w=G.WM, sx=ax=>(ax-w.cx)*w.k+w.w/2, sy=ay=>(ay-w.cy)*w.k+w.h/2, tk=()=>el('#toasts')._kids.map(t=>t.textContent);
      { const t=G.wmapArt(G.VIL2.x+80,G.VIL2.z+20); G.wmapClick(sx(t[0]),sy(t[1])); } ok('a click on a locked land says what bars it (the same words as its land map) and the world map stays',tk().includes(G.WMAP_LOCK.vale)&&!el('#wmap').hidden,tk().join('|'));
      { const b=G.WMAP_BANKS[0]; G.wmapClick(sx(b[0]),sy(b[1])); } ok('a click on the not-built fog says it is uncharted, and names nothing',tk().some(t=>/Uncharted/.test(t)&&!/Stormhorn|Sunscar|Amber|Emberwake/.test(t)));
      { const t=G.wmapArt(G.VIL.x+60,G.VIL.z-60); G.wmapClick(sx(t[0]),sy(t[1])); } G=c.G(); ok('a click on Wildwood opens the home forest\'s own map (the one N opens)',el('#wmap').hidden&&!el('#map').hidden&&G.mapLand()===null&&G.landHere()==='home'); }
    // a land that opens: its fog lifts (after a short beat), is remembered, and a click opens that land's map
    G.NET.send({t:'dev',cmd:'vale',v:2}); G.NET.send({t:'dev',cmd:'north',v:2}); G.NET.send({t:'dev',cmd:'west',v:2}); await wait(700); G=c.G();
    { ok('the dev commands opened the vale, the Reach and the Greyspine',['vale','hoar','grey'].every(l=>G.landOpen(l)));
      G.wmapOpen(); G=c.G(); ok('an open land you have not seen open starts under fog',['vale','hoar','grey'].every(l=>G.WM.fade[l]===1));
      for(let i=0;i<60;i++) G.wmapUpdate(0.05); G=c.G(); ok('...and the fog lifts: gone from all three, each remembered as seen (localStorage)',['vale','hoar','grey'].every(l=>G.WM.fade[l]===0)&&['vale','hoar','grey'].every(l=>JSON.parse(c.ls.get('wildwood-wmap')).includes(l)),c.ls.get('wildwood-wmap'));
      G.wmapOpen(); G=c.G(); ok('opened again, an open land stays clear',['vale','hoar','grey'].every(l=>G.WM.fade[l]===0));
      const w=G.WM; w.k=w.min; w.cx=G.WMAP_W/2; w.cy=G.WMAP_H/2; const sx=ax=>(ax-w.cx)*w.k+w.w/2, sy=ay=>(ay-w.cy)*w.k+w.h/2;
      { const t=G.wmapArt(G.VIL3.x+60,G.VIL3.z+20); G.wmapClick(sx(t[0]),sy(t[1])); } G=c.G(); ok('a click on the Hoarfrost Reach opens the Reach\'s map',el('#wmap').hidden&&!el('#map').hidden&&G.mapLand()==='hoar'&&G.LANDS.hoar.name==='The Hoarfrost Reach');
      G.wmapOpen(); G=c.G(); G.wmapClick(sx(G.WMAP_BANNER.grey.x+130),sy(G.WMAP_BANNER.grey.y)); G=c.G(); ok('...the Greyspine\'s map (a click on its banner counts as the land, even over the next region)',G.mapLand()==='grey'&&!el('#map').hidden);
      G.wmapOpen(); G=c.G(); G.wmapClick(sx(G.WMAP_BANNER.vale.x),sy(G.WMAP_BANNER.vale.y)); G=c.G(); ok('...and the Sakura Vale\'s map',G.mapLand()==='vale'&&!el('#map').hidden);
      el('#mapWorld').click(); G=c.G(); ok('the map\'s World button opens the world map, and the G key closes and opens it',!el('#wmap').hidden&&el('#map').hidden&&(c.fireWin('keydown',{code:'KeyG'}),el('#wmap').hidden)&&(c.fireWin('keydown',{code:'KeyG'}),!el('#wmap').hidden)); G.closePanels(); } }
  // skill sets (the base): a fixture set defined in the page's scope (no kit is shipped); its pieces show in the grids once owned, a universal piece in every class's grid, and nothing throws
  { G=c.G(); const E=(pos,k,ex)=>Object.assign({name:'Fx '+pos+k,desc:'A test piece.',cd:5,range:5,mult:1,act:['fx'+pos+k,0.6,0.4],anim:'slash',fx:{ring:{r:3}}},ex), ST=(n,stat,v)=>({name:n,text:'+{}% '+stat,stat,v});
    const set=G.defineSkillSet({id:'fxset',name:'Fixture',land:'home',needs:{tier:1},dev:true,el:'fire',role:{main:'safe'},char:{name:'Fixture',sex:'male',theme:'t',ip:{kind:'original',riffs:'g'}},pal:{main:1,accent:2,glow:3},kit:{mark:'barb',name:'Barb',text:'t'},
      pos:{1:{bound:'class',skill:{warrior:E(1,'w'),archer:E(1,'a'),mage:E(1,'m')},passive:ST('FP1','dmg',[0.04,0])},2:{bound:'any',skill:{any:E(2,'x',{anim:'nova'})},passive:ST('FP2','crit',[0.03,0])},3:{bound:'any',skill:{any:E(3,'x',{anim:'nova'})},passive:ST('FP3','hp',[0.05,0])}},
      bonus:{3:ST('FB3','dmg',0.1),5:ST('FB5','crit',0.1)}});
    ok('skill sets: a set defined in the page registers (the shared registry is in the client too)',!!set&&G.SS_SETS.fxset===set);
    G.openSkills(null,'skill'); G=c.G(); ok('...its pieces stay out of the grids until they are yours',!/data-id="fxset_2_any"/.test(el('#skBody').innerHTML));
    G.GEAR.skills.owned.push('fxset_2_any','fxset_1_warrior','fxset_p1'); G.SK.sel='fxset_2_any'; G.renderSkills(); let h=el('#skBody').innerHTML;
    ok('...a universal piece you own is in the grid and its details say Any class and whose set it is',/data-id="fxset_2_any"[^>]*data-from="grid"/.test(h)&&/Any class/.test(h)&&/Fixture&#39;s set|Fixture's set/.test(h)&&/data-upskill="fxset_2_any"|Upgrade/.test(h)&&!/data-buyskill="fxset_2_any"/.test(h));
    G.GEAR.skills.owned.push('fxset_1_archer'); G.openSkills(null,'basic'); G=c.G(); h=el('#skBody').innerHTML;
    ok('...a slot-1 piece shows only in its own class\'s grid (the page plays an archer), and owning it lets that class swap its basic attack',/data-id="fxset_1_archer"/.test(h)&&!/data-id="fxset_1_warrior"/.test(h)&&G.canSwap('archer','basic',G.GEAR.skills)&&!G.canSwap('warrior','basic',{owned:[]})&&!/Only mages can change/.test(h),h.match(/Only mages[^<]*/));
    G.openSkills(null,'pass'); G=c.G(); h=el('#skBody').innerHTML; ok('...an owned signature passive shows in the passive grid, an unowned one does not',/data-id="fxset_p1"/.test(h)&&!/data-id="fxset_p2"/.test(h));
    { const m=G.MONS.find(x=>!x.dead), pid=G.NET.pid; G.applyEvent(['mk',m.id,'barb',2,10,pid]); G.applyEvent(['mk',m.id,'barb',3,10,pid+1000]); G.ssvUpdate(0.033); const two=G.SSV.marks.get(m.id)&&G.SSV.marks.get(m.id).barb.pips.length;   // (a mark of someone else is not drawn: marks are personal)
      G.applyEvent(['mk',m.id,'barb',3,10,pid]); G.ssvUpdate(0.033); const three=G.SSV.marks.get(m.id).barb.pips.length; G.applyEvent(['mk',m.id,'barb',0,0,pid]);
      ok('skill sets: a mark of yours on a monster shows as pips (2, then 3), someone else\'s is not drawn, and the pips go when the mark is spent',two===2&&three===3&&!G.SSV.marks.has(m.id),two+' '+three); } }
  // skill sets in the skills panel: a piece draws its own set's symbol (never the generic star) and the details and a card under the loadout say the set effect
  { G=c.G(); const T=G.SS_SETS.tansy, star='M12 2l2.5 6.5L21 9';   // (the generic burst glyph)
    G.GEAR.skills.owned.push('tansy_2_any','tansy_p2'); G.SK.sel='tansy_2_any'; G.openSkills(null,'skill'); G=c.G(); G.SK.sel='tansy_2_any'; G.renderSkills(); const h=el('#skBody').innerHTML;
    const tile=(/<button class="sk-tile[^"]*" data-id="tansy_2_any".*?<\/button>/s.exec(h)||[''])[0], det=(/<div class="sk-ii">.*$/s.exec(h)||[''])[0];
    ok('a set piece draws its set\'s own symbol in the set\'s colour, not the generic star (tile and details)',tile.includes(T.emblem.glyph)&&!tile.includes(star)&&/has-set/.test(tile)&&tile.includes('--set:#'+T.emblem.col.toString(16))&&det.includes(T.emblem.glyph)&&!det.includes(star));
    ok('the details name the set and give its set effect: both bonuses by name and text, and how many more pieces each needs',/The Harvest \(Tansy&#39;s set\)|The Harvest \(Tansy's set\)/.test(det)&&/Set effect/.test(det)&&det.includes('Windrow')&&det.includes('Full Basket')&&/3 pieces/.test(det)&&/5 pieces/.test(det)&&/needs 3 more/.test(det)&&/needs 5 more/.test(det));
    ok('set effects list only sets you wear a piece of: owned but unworn shows the empty line and no card',!/class="sk-sets"/.test(h)&&/You wear no signature set pieces/.test(h)&&/Set effects/.test(h));
    G.PL.level=Math.max(G.PL.level,20); G.GEAR.skills.pass=['tansy_p2']; G.openSkills(null,'skill'); G=c.G(); const h2=el('#skBody').innerHTML;
    ok('...wearing one piece shows that set\'s card alone (name, pieces worn, pairs owned)',/class="sk-sets"/.test(h2)&&/The Harvest/.test(h2)&&/1 of 6 pieces worn/.test(h2)&&/3 of 3 pairs owned/.test(h2)&&(h2.match(/class="sk-set[ "]/g)||[]).length===1);
    const sets=Object.keys(G.SS_SETS), syms=new Set(sets.map(id=>G.SS_SETS[id].emblem&&G.SS_SETS[id].emblem.glyph)), cols=new Set(sets.map(id=>G.SS_SETS[id].emblem&&G.SS_SETS[id].emblem.col));
    ok('every set has a symbol of its own and a colour of its own ('+sets.length+' sets)',sets.filter(id=>!G.SS_SETS[id].dev).every(id=>!!G.SS_SETS[id].emblem)&&syms.size===sets.length-(sets.includes('fxset')?1:0)+(sets.includes('fxset')?1:0)&&cols.size>=8); }
  // the Deep Cave's methods (C2): the props of every floor build and are disposed, the state message drives them, the board and the locked tile say where each skill comes from
  { G=c.G(); const errs=[]; const ce=console.error; console.error=(...a)=>{ errs.push(a.join(' ')); };
    for(const n of G.CAVE_FLOOR_N){
      try{ G.caveRunEnter(n); }catch(e){ errs.push(String(e)); }
      G=c.G(); const MP=G.CAVE_MP, R=G.CAVE_RUN();
      ok('floor '+n+': the method props build ('+(MP.g?MP.g.children.length:0)+' meshes, '+MP.upd.length+' updaters), no error',!!R&&!!MP.g&&MP.g.children.length>40&&MP.upd.length>=6&&errs.length===0,errs.join('|'));
      G.NETH.cm({t:'cm',f:n,hud:'Mural pieces 2 of 5',a:5,b:[1,2,0],c:{s:1,k:1,n:5},d:{s:1,h:2},e:{s:1,z:50,w:0},fv:{o:30,w:0},g:0,h:{vm:3,hm:1,o:2,b:1,c:0},cd:{A:120}}); G=c.G();
      for(let i=0;i<3;i++) G.CAVE_MP.upd.forEach(f=>f(G.caveMState(),0.05,i));
      ok('floor '+n+': the state message shows the HUD line, opens the vault\'s seal here too, and the props follow it',el('#cvMethod').textContent==='Mural pieces 2 of 5'&&!el('#cvMethod').hidden&&G.CAVE_M.seal===true&&R.B.sealed.every(k=>R.B.cells[k]===1)&&G.CAVE_MP.carry.visible===true&&errs.length===0,errs.join('|'));
      G.NETH.cm({t:'cm',f:n,hud:'x',a:31,b:[2,2,1],c:{s:0},d:{s:0,h:0},e:{s:1,z:80,w:1},fv:{o:0,w:12},g:9,h:{vm:255,hm:63,o:3,b:2,c:1},cd:{D:60}}); G=c.G();   // the other states: tremor warning, a mole running, the guardian awake, everything held
      for(let i=0;i<3;i++) G.CAVE_MP.upd.forEach(f=>f(G.caveMState(),0.05,i+9));
      ok('floor '+n+': the props follow the tremor warning, the mole, the awake guardian and a full anvil without error',errs.length===0&&G.CAVE_MP.carry.visible===false,errs.join('|'));
      G.NETH.cm({t:'cm',f:n,hud:'',fv:{o:0,w:0}}); G=c.G(); ok('floor '+n+': the seal closes again and the HUD line hides',R.B.sealed.every(k=>R.B.cells[k]===0)&&el('#cvMethod').hidden);
      G.caveRunLeave(); G=c.G();
      ok('floor '+n+': leaving disposes the props and gives the rock back',G.CAVE_MP.g===null&&G.CAVE_MP.upd.length===0&&G.CAVE_RUN()===null&&G.caveBake(n).sealed.every(k=>G.caveBake(n).cells[k]===0));
    }
    console.error=ce;
    const board=G.caveBoardHtml(); ok('the board lists every floor and all eight methods with the skill each gives',G.CAVE_FLOOR_N.every(n=>board.includes('Floor '+n))&&board.includes('Mural fragments')&&board.includes('Echo')&&board.includes('Second Wind')&&(board.match(/<li>/g)||[]).length===8*G.CAVE_FLOOR_N.length);
    { const own=G.GEAR.cave.own, had=own.echo; delete own.echo; ok('a locked skill\'s details say which method and floor give it',/Mural fragments, The Glowworm Grotto/.test((G.CAVE_UI.sel='echo',G.caveInfoHtml()))); if(had) own.echo=had; }   // (the testing tool at the start gave every cave skill)
    { const lv0=G.PL.level; G.NET.send({t:'dev',cmd:'level',v:30}); G.NET.send({t:'dev',cmd:'skills'}); await wait(500); G=c.G();
      const can=G.skCanDrop({id:'flare',from:'grid',cave:true},{cave:true})&&!G.skCanDrop({id:'flare',from:'grid',cave:true},{slot:'skill'});
      G.caveDrop({id:'flare',from:'grid',cave:true},{cave:true}); await wait(500); G=c.G(); const on=G.GEAR.skills.cave==='flare';
      G.caveDrop({id:'flare',from:'slot:cave',cave:true},{area:true}); await wait(500); G=c.G();
      ok('drag and drop: a cave skill drops onto the 4th slot (only there) and wears it; dragged off onto the grid it comes off',can&&on&&G.GEAR.skills.cave===null,'can '+can+', on '+on+', after '+G.GEAR.skills.cave);
      G.NET.send({t:'dev',cmd:'level',v:lv0}); await wait(300); G=c.G(); }
    ok('every floor-1 skill exists',['echo','flare','overdrive','lanternward','burrow','cavein','grapple','secondwind'].filter(id=>G.CAVE_SKILLS[id]).length===8);
    { const MINE=['echo','flare','overdrive','lanternward','burrow','cavein','grapple','secondwind','threshing','shadowstep','shieldwall','lighthouse','cutandrun'], bad=[], me=G.NET.pid, sc=()=>G.scene.children.filter(o=>!o.isInstancedMesh).length, n0=sc();   // C5: the drawings of floor 1 and five floor-2 set skills
      for(const id of MINE){ const ab=G.CAVE_SKILLS[id], v=G.CAVE_VIS[id]; if(!ab||!v){ bad.push(id+': no drawing'); continue; }
        try{ G.cvv1Wind(ab,G.P); v.cast(G.P,ab,null); G.attackVisuals({kind:ab.anim,sk:ab.act[0]},null); G.updateCombat(0.05); if(v.wind) v.wind(G.P,ab); }catch(e){ bad.push(id+': '+e.message); } }
      for(const [id,args] of [['cavein',[900,'zone',G.P.x+3,G.P.z,6,1,me,'earth',1]],['lighthouse',[901,'zone',G.P.x,G.P.z,10,8,me,'light',0]]]){   // the zone events the drawings claim
        try{ G.cvv1Wind(G.CAVE_SKILLS[id],G.P); G.applyEvent(['area',...args]); }catch(e){ bad.push(id+' zone: '+e.message); } }
      try{ for(const e of [['cvfx',me,'ward',6,1],['cvfx',me,'ward',6,0.5],['cvfx',me,'retreat'],['cvfx',me,'wall',6,30],['cvfx',me,'nonsense'],['cvhand',1,1,2,me]]){ G.cvv1Wind(G.CAVE_SKILLS.cutandrun,G.P); G.applyEvent(e); } }catch(e){ bad.push('events: '+e.message); }
      const live=G.CVV.list.length; for(let j=0;j<300;j++){ try{ G.updateCombat(0.1); }catch(e){ bad.push('tick: '+e.message); break; } if(j===10){ G.applyEvent(['aend',900]); G.applyEvent(['aend',901]); } }
      ok('every floor-1 skill and five floor-2 set skills have a cave drawing; casting each, its press, its zones and events throw nothing',!bad.length&&!G.CAVE_VIS_BAD.length&&live>0,bad.concat(G.CAVE_VIS_BAD.map(b=>b.id+': '+b.why)).join('; '));
      ok('...and everything they drew is gone again (timed effects, meshes in the scene)',G.CVV.list.length===0&&sc()<=n0,G.CVV.list.length+' effects left, scene '+n0+' -> '+sc()); }
    ok('every floor-1 skill has a placeholder look (the vis key) and a method',['echo','flare','overdrive','lanternward','burrow','cavein','grapple','secondwind'].filter(id=>G.CAVE_SKILLS[id]).length===8);
    // C5: the drawings of the 13 set skills of floors 2b-4 (vis-floor2b/3/4.js): an entry each; cast through the real client (mine and another player's), every cvfx / cvhand / area event of theirs, then run out: nothing thrown, nothing left behind
    { const mine=['marionette','tidepool','intermission','soundcharge','eagleperch','stoppedhour','lampwindow','nightline','bellecho','blackice','landslide','embalm','nightshift'];
      const me=G.NET.pid, mon=G.MONS.find(m=>!m.dead)||G.MONS[0], x=mon.x+5, z=mon.z, miss=mine.filter(id=>!G.CAVE_VIS[id]), quiet=[], areas=[], fake={id:991,x:x-3,y:G.P.y,z,face:1,scale:1};
      G.P.x=x; G.P.z=z; errs.length=0;
      const base=()=>G.CVB_FX.length+G.SSL.parts.length+G.SSL.decals.length+G.CB.fx.length+G.AREA_FX.size+G.CVB_LIFT.size;
      mine.forEach((id,i)=>{
        const ab=G.CAVE_SKILLS[id], k=ab.act[0], b0=base(), A=(src,r,d,el)=>['area',700+i,'zone',x,z,r,d,me,el,0,src], evs=({
          marionette:[['cvfx',me,'puppet',mon.id,4],['cvfx',me,'weak',mon.id,4]], tidepool:[A('ambrose_tidepool',6,6,'water'),['cvfx',me,'cleanse']], intermission:[['cvfx',me,'next',0.2],['cvfx',991,'next',0]],
          soundcharge:[], eagleperch:[['cvfx',me,'perch',5]], stoppedhour:[['cvfx',me,'hold',3],['cvfx',me,'hold-end',10]], lampwindow:[A('hollis_lampwindow',7,10,'dark'),['cvfx',me,'lamp']],
          nightline:[A('pell_nightline',6,8,'fire')], bellecho:[['cvfx',me,'bell',3],['cvfx',me,'bell',2],['cvfx',me,'bell',0]], blackice:[A('brynja_blackice',6.5,6,'water'),['cvfx',me,'lane',1.5,0.4]],
          landslide:[['cvfx',me,'slide',x,z,x-10,z-10]], embalm:[['cvfx',me,'embalm',5],['cvfx',991,'embalm',5],['cvfx',me,'embalm-end']], nightshift:[['cvhand',x-2,z,mon.id,me],['cvhand',x+2,z,99999,me]] })[id];
        G.CB.act={kind:G.ANIM_OF[k]||k,sk:k,t:0,dur:ab.act[1],hitAt:ab.act[2],done:false}; G.cvbFrame(0.02); G.CB.act=null;   // (the wind-up, drawn once when the cast starts)
        G.attackVisuals({kind:G.ANIM_OF[k]||k,sk:k},null); G.attackVisuals({kind:G.ANIM_OF[k]||k,sk:k},fake);
        for(const e of evs){ G.applyEvent(e); if(e[0]==='area') areas.push(e[1]); }
        let peak=base(); for(let j=0;j<10;j++){ G.updateCombat(0.05); peak=Math.max(peak,base()); } if(peak<=b0) quiet.push(id);
      });
      const lifted=G.cvbLift(me)>0.5, fast=(G.applyEvent(['cvfx',me,'lane',1.5,0.4]),G.cvbSpeedK()>1.3);
      for(const a of areas) G.applyEvent(['aend',a]);
      for(let j=0;j<700;j++) G.updateCombat(0.05);   // 35 s: past the longest effect (the bell's 20 s)
      ok('every floor 2-4 cave skill of effects part 2 has a drawing, and casting each (yours and another player\'s) with its events throws nothing',!miss.length&&!G.CAVE_VIS_BAD.length&&errs.length===0&&!quiet.length,(miss.length?'no drawing: '+miss+'; ':'')+(quiet.length?'draws nothing: '+quiet+'; ':'')+errs.slice(0,2).join(' | '));
      ok('...Eagle\'s Perch lifts the model and Black Ice\'s lane speeds you up, and both end',lifted&&fast&&G.cvbLift(me)===0,'lift '+lifted+', fast '+fast);
      await wait(1200); let own=0; G.scene.traverse(o=>{ if(o.userData&&o.userData.own) own++; });
      ok('...and they leave nothing behind (effects, particles, patterns, zones, meshes in the scene)',G.CVB_FX.length===0&&G.CVB_LIFT.size===0&&G.AREA_FX.size===0&&G.SSL.parts.length===0&&G.SSL.decals.length===0&&own===0,G.CVB_FX.length+' effects, '+G.SSL.parts.length+' particles, '+G.SSL.decals.length+' patterns, '+own+' own meshes'); }   // (the scene's own child count is not compared: the world keeps streaming in, and the first Landslide builds debris pools for good)
    G.openPanel('cvLift'); try{ G.renderCaveLift(); }catch(e){ errs.push(String(e)); } ok('the lift window renders with the board under the floors',errs.length===0); G.closePanels(); }
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
