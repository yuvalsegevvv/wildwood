//@ Target frame, player bars, damage numbers, action bar, attack input
/* combat interface: target frame, health bars, damage numbers, action buttons */
const tframe=$('#tframe'), tName=$('#tName'), tLv=$('#tLv'), tEl=$('#tEl'), tBar=$('#tBar'), tHp=$('#tHp');
const dmgPool=[], barPool=[];
for(let i=0;i<20;i++){ const d=document.createElement('div'); d.className='dmg'; d.hidden=true; document.body.append(d); dmgPool.push({el:d,life:0}); }
for(let i=0;i<10;i++){ const d=document.createElement('div'); d.className='hpb'; d.hidden=true; d.innerHTML='<i></i>'; document.body.append(d); barPool.push(d); }
function popText(x,y,z,txt,cls){
  const d=dmgPool.find(p=>p.life<=0)||dmgPool[0];
  d.life=cls==='xp'?1.4:0.9; d.x=x+AR(-0.3,0.3); d.y=y; d.z=z; d.el.textContent=txt; d.el.className='dmg'+(cls?' '+cls:''); d.el.hidden=false;
}
const _sv=new THREE.Vector3();
function toScreen(x,y,z){ _sv.set(x,y,z).project(camera); if(_sv.z>1) return null; return [(_sv.x*0.5+0.5)*innerWidth,(-_sv.y*0.5+0.5)*innerHeight]; }
function updateCombatUI(dt){
  for(const d of dmgPool){
    if(d.life<=0){ d.el.hidden=true; continue; }
    d.life-=dt; d.y+=dt*1.2;
    const s=toScreen(d.x,d.y,d.z); if(!s){ d.el.hidden=true; continue; }
    d.el.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-50%) scale(${1+Math.max(0,d.life-0.7)*2})`; d.el.style.opacity=Math.min(1,d.life*2.5);
  }
  let bi=0;
  if(started && !customizing){
    const list=MONS.filter(m=>!m.dead&&m.g.visible&&(m.hp<m.maxHp||m.aggro||m===CB.target)&&Math.hypot(m.x-P.x,m.z-P.z)<35);
    for(const m of list){
      if(bi>=barPool.length) break;
      const s=toScreen(m.x,m.y+(m.T.height+0.35)*m.s,m.z); if(!s) continue;
      const b=barPool[bi++]; b.hidden=false; b.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-50%)`;
      b.firstChild.style.width=(m.hp/m.maxHp*100)+'%'; b.classList.toggle('tgt',m===CB.target);
    }
  }
  for(;bi<barPool.length;bi++) barPool[bi].hidden=true;
  const T=CB.target;
  const soul=soulNow(); $('#plLv').textContent='Lv '+(PVC&&PVC.on?PVP.level+' (PvP)':PL.level)+(soul!=='basic'?' · '+ELEMS[soul].name:''); $('#plHpT').textContent=Math.ceil(PL.hp)+' / '+PL.maxHp;
  $('#plHp').style.width=(PL.hp/PL.maxHp*100)+'%'; const need=expToNext(PL.level);
  $('#plXp').style.width=Math.min(100,PL.exp/need*100)+'%'; $('#plXpT').textContent='XP '+numC(PL.exp)+' / '+numC(need);
  const bossUI=updateBossUI();
  if(T && started && !customizing && !(bossUI&&T===BOSS.m)){ tframe.hidden=false; tName.textContent=T.T.name; const K=monTierK(T), ld=K.lv-PL.level; tLv.textContent='Lv '+K.lv+(ld>0?'  (-'+ld*5+'% dmg)':''); tLv.classList.toggle('bad',ld>0);
    const te=elOf(T.T); tEl.textContent=te==='basic'?'':ELEMS[te].name; tEl.style.color=ELEMS[te].col; if(te==='basic') tEl.title=''; else { const tr=foeTraits(te), nm=l=>l.map(e=>ELEMS[e].name).join(' and '); tEl.title=ELEMS[te].name+': weak to '+nm(tr.weak)+', resists '+nm(tr.resist); }
    tBar.style.width=(T.hp/T.maxHp*100)+'%'; tHp.textContent=Math.ceil(T.hp*K.hp)+' / '+Math.round(T.maxHp*K.hp); }
  else tframe.hidden=true;
  const L=pvSkills(), PV=pvLevel(), c=clsOf(), ba=abilityOf(c,'basic',L,PV), sk=abilityOf(c,'skill',L,PV), bu=abilityOf(c,'burst',L,PV);   // pvp: the fixed loadout on the island
  abBasic.style.setProperty('--p',ba?CB.cd.basic/(abilityCd(ba,L,PV,c,rlUiCdr())*(CB.buff?CB.buff.cd:1)):0); abSkill.style.setProperty('--p',sk?CB.cd.skill/abilityCd(sk,L,PV,c,rlUiCdr()):0); abBurst.style.setProperty('--p',bu?CB.cd.burst/abilityCd(bu,L,PV,c,rlUiCdr()):0);   // (skillsets: the bonuses of the class in hand)
  abSkill.classList.toggle('ready',!!sk&&CB.cd.skill<=0); abBurst.classList.toggle('ready',!!bu&&CB.cd.burst<=0);
  abBasic.classList.toggle('buffed',!!CB.buff);
  caveHudUpdate();   // cave: the charge bar and the ready glow
  const key=c+'|'+(ba?ba.id:'')+'|'+(sk?sk.id:'')+'|'+(bu?bu.id:'')+'|'+Math.min(PV,BURST_SLOT_LV)+caveBarKey(); if(key!==abKey){ abKey=key; setActionBar(); }
}
const ICONS={
  Slash:'<path d="M5 19L17 7l2-4-4 2L3 17z"/><path d="M8 16l-3 3M15 5l4 4"/>',
  Whirlwind:'<path d="M12 12a3 3 0 1 1 3-3M12 12a6 6 0 1 0 6 6M12 12a9 9 0 0 1-9-9"/>',
  Shoot:'<path d="M5 19L19 5M19 5h-5M19 5v5"/><path d="M5 19l2-4M5 19l4-2"/>',
  Volley:'<path d="M4 20L18 6M9 20L20 9M4 15L15 4"/><path d="M18 6v-3M20 9h3M15 4h-3"/>',
  Firebolt:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"/>',
  'Frost Nova':'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9 4l3 2 3-2M9 20l3-2 3 2"/>',
  'Shield Bash':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 10l3 3 3-3"/>',
  'Charge':'<path d="M3 12h11M10 7l5 5-5 5"/><path d="M17 5v14M21 8v8"/>',
  'Piercing Shot':'<path d="M2 12h18M16 8l4 4-4 4"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="12" r="2"/>',
  'Arrow Rain':'<path d="M6 3v10M12 3v14M18 3v10M4 11l2 3 2-3M10 15l2 3 2-3M16 11l2 3 2-3"/><path d="M3 21h18"/>',
  'Chain Lightning':'<path d="M13 2L5 13h6l-2 9 9-12h-6z"/>',
  'Meteor':'<circle cx="15" cy="15" r="5"/><path d="M11 11L3 3M13 9L8 3M9 13L3 8"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  burst:'<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>',
  'Ice Shard':'<path d="M4 20L15 9l5-5-2 6-9 9z"/><path d="M13 7l4 4"/>',
  'Arcane Missiles':'<circle cx="17" cy="7" r="2.5"/><circle cx="7" cy="9" r="2"/><circle cx="12" cy="17" r="2"/><path d="M3 21l3-3M9 21l2-2M3 15l2-2"/>',
  'Earthshatter':'<path d="M2 20h20"/><path d="M12 20l-2-5 3-3-2-4M7 20l1-3M17 20l-1-4 2-2"/><path d="M9 4l3 2 3-2"/>',
  'Blade Storm':'<circle cx="12" cy="12" r="2"/><path d="M12 10V3l3 3M14 12h7l-3 3M12 14v7l-3-3M10 12H3l3-3"/>',
  'Berserk':'<path d="M4 20l5-9 3 4 3-7 5 12"/><path d="M8 4l2 3M16 3l-1 4M12 2v3"/>',
  'Hail of Arrows':'<path d="M4 3v8M9 3v12M14 3v8M19 3v12M2 9l2 3 2-3M7 13l2 3 2-3M12 9l2 3 2-3M17 13l2 3 2-3"/><path d="M2 21h20"/>',
  'Sniper Shot':'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
  "Hunter's Focus":'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'Blizzard':'<path d="M12 2v20M4 6l16 12M4 18L20 6"/><circle cx="12" cy="12" r="3"/>',
  'Inferno':'<path d="M12 22c-5 0-8-3-8-7 0-4 4-6 4-10 3 2 4 5 4 7 1-2 1-4 0-6 4 2 8 6 8 9 0 4-3 7-8 7z"/>',
  'Arcane Surge':'<path d="M12 2l3 7h7l-6 5 2 8-6-5-6 5 2-8-6-5h7z"/>',
  // the Greyspine's two bosses (the Gryphon Queen's air skills, the Mountain Golem's earth skills)
  'Talon Rake':'<path d="M6 3c2 6 2 12 0 18M12 3c2 6 2 12 0 18M18 3c2 6 2 12 0 18"/>',
  "Eagle's Plunge":'<path d="M12 21V9M7 14l5 7 5-7"/><path d="M3 5c3 1 6 3 9 3s6-2 9-3"/>',
  'Quill Shot':'<path d="M5 19L19 5"/><path d="M19 5c-5-1-9 1-11 5M19 5c1 5-1 9-5 11M12 12l-4 4"/>',
  'Feather Storm':'<path d="M3 7c4-3 9-3 13 0M3 12c4-3 9-3 13 0M8 17c4-3 9-3 13 0"/><path d="M18 3l3 2-3 2"/>',
  'Sky Lance':'<path d="M3 21L16 8"/><path d="M13 4h7v7z"/><path d="M4 11a3 3 0 0 1 5-2"/>',
  'Updraft':'<path d="M6 21V8M3 11l3-4 3 4M12 21V4M9 7l3-4 3 4M18 21V10M15 13l3-4 3 4"/>',
  'Stone Fist':'<path d="M5 9l3-4h8l3 4v6l-3 4H8l-3-4z"/><path d="M9 9v4M12 8v5M15 9v4"/>',
  'Quake Slam':'<path d="M3 20h18"/><path d="M12 20l-1-5 2-3-2-3 1-4"/><path d="M5 12l3 2M19 12l-3 2M7 7l3 1M17 7l-3 1"/>',
  'Boulder Arrow':'<circle cx="16" cy="8" r="4"/><path d="M13 11L3 21M3 21h5M3 21v-5"/>',
  'Hail of Rock':'<path d="M6 3l2 4-3 1zM13 2l2 5-4 1zM19 8l2 4-3 1z"/><path d="M5 14l2 4-3 1zM12 13l2 5-4 1zM19 16l1 4-3 1z"/>',
  'Stone Bind':'<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/><path d="M2 12h2M20 12h2"/>',
  'Avalanche':'<path d="M2 20L9 6l4 8 3-4 6 10z"/><path d="M11 6l3 4M8 20l1-3M13 20l1-2M18 20l1-2"/>',
  // the Glass Guardian's, the Sand Wyrm's, Captain Dredge's and the Gloam Warden's skills (light, earth/fire, water, dark)
  'Prism Cleave':'<path d="M12 4l7 13H5z"/><path d="M4 21L20 3"/><path d="M15 9l5 1"/>',
  'Mirror Break':'<ellipse cx="12" cy="11" rx="6" ry="8"/><path d="M12 3l-2 6 4 3-3 7M6 8l6 3 6-1"/>',
  'Glint Arrow':'<path d="M3 21L16 8M16 8h-5M16 8v5"/><path d="M19 3v5M16.5 5.5h5"/>',
  'Shard Fan':'<path d="M12 21L4 7M12 21V3M12 21L20 7"/><path d="M3 6l2 3 2-3M11 2l1 3 1-3M17 6l2 3 2-3"/>',
  'Prism Beam':'<path d="M3 12h6M9 7l6 5-6 5z"/><path d="M15 12l6-4M15 12h6M15 12l6 4"/>',
  'Glass Storm':'<path d="M8 4l3 3-3 3-3-3zM17 8l2.5 2.5L17 13l-2.5-2.5zM9 14l3 3-3 4-3-4z"/><path d="M14 17l3 1M5 14l-2 1"/>',
  'Wyrm Coil':'<path d="M18 7c-4-4-12-2-12 3s8 5 10 2-3-4-5-2"/><path d="M18 7l3 1-2 2"/><path d="M6 19c4 2 10 2 14-1"/>',
  'Burrow Strike':'<path d="M3 17c4 0 4 2 9 2s5-2 9-2"/><path d="M12 17V6M8 10l4-5 4 5"/><path d="M5 14l-2-2M19 14l2-2"/>',
  'Sand Piercer':'<path d="M2 18c4-5 7-5 10 0M10 18c3-4 6-4 10 0"/><path d="M4 7l15 6M19 13l-5-1M19 13l-2-4"/>',
  'Dune Shower':'<path d="M6 3v7M12 3v9M18 3v7M4 8l2 3 2-3M10 10l2 3 2-3M16 8l2 3 2-3"/><path d="M2 21c4-5 8-5 10 0 3-5 7-5 10 0"/>',
  'Cinder Chain':'<rect x="3" y="9" width="10" height="6" rx="3"/><rect x="11" y="12" width="10" height="6" rx="3"/><path d="M17 3c1 2 3 2 3 4a3 3 0 0 1-6 0c0-1 1-1 1-2"/>',
  'Sandstorm':'<path d="M3 8h12a3 3 0 1 0-3-3M3 13h16a3 3 0 1 1-3 3M3 18h9"/>',
  'Anchor Swing':'<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 11h10M5 15c0 3 3 6 7 6s7-3 7-6"/><path d="M3 14l2 1M21 14l-2 1"/>',
  'Broadside':'<path d="M3 18l3-5h12l3 5z"/><path d="M8 11L5 5M12 11V4M16 11l3-6"/><circle cx="5" cy="4" r="1.2"/><circle cx="12" cy="3" r="1.2"/><circle cx="19" cy="4" r="1.2"/>',
  'Harpoon':'<path d="M3 21L17 7"/><path d="M14 4l6 6-4 1-3-3z"/><path d="M3 21c0-4 3-6 5-6"/>',
  'Grapeshot':'<path d="M3 21l6-6"/><circle cx="14" cy="10" r="2"/><circle cx="19" cy="6" r="1.6"/><circle cx="19" cy="14" r="1.6"/><circle cx="10" cy="5" r="1.6"/><circle cx="14" cy="17" r="1.6"/>',
  'Brine Lash':'<path d="M3 18c4-8 8 2 12-6s4-6 6-6"/><path d="M5 22c3-2 5 2 8 0"/><circle cx="20" cy="5" r="1.3"/>',
  'Undertow':'<path d="M3 8c3-3 5 2 9-1s6 2 9-1"/><path d="M12 12v9M8 17l4 4 4-4"/>',
  'Black Cleave':'<path d="M20 4C10 5 4 11 4 20c3-5 8-8 14-9"/><path d="M6 20l-2 2M9 18l-2 2"/>',
  'Eclipse':'<circle cx="12" cy="12" r="6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M5 19l2-2"/><path d="M12 6a6 6 0 0 1 0 12 4 6 0 0 0 0-12z"/>',
  'Gloom Arrow':'<path d="M3 21L17 7M17 7h-5M17 7v5"/><path d="M19 3a4 4 0 1 0 2 5 3 3 0 0 1-2-5z"/>',
  'Wraith Volley':'<path d="M4 20c2-2 2-4 4-6M9 21c2-2 2-4 5-7M3 14c2-2 3-3 5-5"/><path d="M12 12l5-8M17 14l5-8M8 9l3-5"/><path d="M12 12l-1-3M17 14l-1-3"/>',
  'Soul Siphon':'<path d="M5 5c3 0 5 3 5 6s-2 5-5 5c1-3 0-8 0-11z"/><path d="M12 12h9M18 9l3 3-3 3"/>',
  'Nightfall':'<path d="M16 3a9 9 0 1 0 5 12A7 7 0 0 1 16 3z"/><path d="M5 4l.8 1.6L7.5 6 5.8 6.6 5 8.3 4.3 6.6 2.5 6l1.8-.4z"/>',
  // boss skills
  'Bramble Snare':'<path d="M4 12c4-6 12-6 16 0M4 12c4 6 12 6 16 0"/><path d="M8 8l-1-3M12 6V3M16 8l1-3M8 16l-1 3M12 18v3M16 16l1 3"/>',
  'Lifesap Frenzy':'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><path d="M12 11v6M9 14h6"/>',
  'Spore Arrow':'<path d="M4 20L16 8M16 8h-4M16 8v4"/><circle cx="18" cy="6" r="2"/><circle cx="21" cy="10" r="1.3"/><circle cx="14" cy="4.5" r="1.3"/>',
  'Black Bloom':'<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C12 5 10 3 8 3c0 3 1 5 4 6.5zM14.5 12C19 12 21 10 21 8c-3 0-5 1-6.5 4zM12 14.5c0 4.5 2 6.5 4 6.5 0-3-1-5-4-6.5zM9.5 12C5 12 3 14 3 16c3 0 5-1 6.5-4z"/>',
  'Thorn Shards':'<path d="M4 20L9 6l3 9zM12 20l3-14 3 11z"/><path d="M20 20l1-6"/>',
  'Heartwood Drain':'<path d="M2 12h8"/><path d="M15 20s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7z"/>',
  'Claw Crush':'<path d="M4 20l7-9M20 20l-7-9"/><path d="M8 4c-2 3-1 6 3 7M16 4c2 3 1 6-3 7"/><path d="M11 11l1 3 1-3"/>',
  'Tidal Guard':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M7 12c2-2 3 2 5 0s3 2 5 0"/>',
  'Riptide Arrow':'<path d="M3 21L15 9M15 9h-4M15 9v4"/><path d="M19 5a4 4 0 1 1-4 4"/><path d="M19 8a1.5 1.5 0 1 1-1.5 1.5"/>',
  'Barnacle Barrage':'<circle cx="7" cy="7" r="2.3"/><circle cx="16" cy="9" r="2.3"/><circle cx="10" cy="16" r="2.3"/><path d="M3 21l3-3M14 21l2-2M19 15l2-2"/>',
  'Tidal Surge':'<path d="M3 15c3-4 5 3 9-1s6 2 9-2M3 20c3-4 5 3 9-1s6 2 9-2"/><path d="M12 3v6M9 6l3-3 3 3"/>',
  Maelstrom:'<path d="M12 12a2 2 0 1 1 2 2 5 5 0 1 1-5-5 8 8 0 1 1 8 8"/><path d="M3 12h3M18 12h3"/>',
  'Oni Cleave':'<path d="M4 20L18 4M8 20L20 8"/><path d="M15 3c1 2 3 3 3 5"/>',
  'Kanabo Slam':'<path d="M5 19l9-9"/><path d="M13 5l6 6-3 3-6-6z"/><path d="M3 21h6"/>',
  'Ember Shot':'<path d="M3 21L15 9M15 9h-4M15 9v4"/><path d="M19 3c1 2 3 2 3 5a3 3 0 0 1-6 0c0-1 1-1.5 1-3z"/>',
  'Inferno Volley':'<path d="M3 20L12 11M8 21L17 12M3 14L9 8"/><path d="M17 3c1 2 4 3 4 6a3 3 0 0 1-6 0c0-2 2-3 2-6z"/>',
  'Oni Gale':'<path d="M3 9h12a3 3 0 1 0-3-3M3 14h17a3 3 0 1 1-3 3M3 19h8"/>',
  'Demon Gate':'<path d="M3 6h18M5 6v14M19 6v14M7 11h10M9 6V4M15 6V4"/>',
  'Foxfire Riposte':'<path d="M5 19L17 5M9 20L21 8M4 14L12 5"/><path d="M19 2v3M17.5 3.5h3"/>',
  'Dawn Guard':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><circle cx="12" cy="11" r="2.5"/><path d="M12 5.5v1.5M12 15v1.5M6.5 11H8M16 11h1.5"/>',
  'Radiant Lance':'<path d="M3 21L21 3"/><path d="M15 3h6v6"/><path d="M8 13l3 3M5 16l3 3"/>',
  'Fox Spirit Barrage':'<circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="17" r="2.2"/><circle cx="11" cy="12" r="2.2"/><path d="M3 12h6M3 5l13 1M3 19l13-1"/>',
  'Spirit Chain':'<circle cx="6" cy="6" r="2.5"/><circle cx="12" cy="13" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M7.5 8l3 3M13.5 11l3-3M12 15.5V20"/>',
  Tempest:'<path d="M12 12a2 2 0 1 1 2 2 5 5 0 1 1-5-5 8 8 0 1 1 8 8"/>',
  'Rime Cleave':'<path d="M5 19L17 7l2-4-4 2L3 17z"/><path d="M14 14l5 5M17 12h3M12 17v3"/>',
  'Glacier Slam':'<path d="M3 20h18M6 20l3-9 3 5 3-8 3 12"/>',
  'Frost Shot':'<path d="M4 20L16 8M16 8h-4M16 8v4"/><path d="M18 3v6M15 6h6M16 4l4 4M20 4l-4 4"/>',
  'Hail of Shards':'<path d="M5 4l2 7M11 3l2 8M17 5l1 7M4 20l3-5M10 21l3-6M16 20l3-5"/>',
  'Ice Lance':'<path d="M3 21L21 3M21 3h-6M21 3v6"/><path d="M8 16H5M11 13v-3"/>',
  Whiteout:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><circle cx="12" cy="12" r="9"/>',
  Wyrmfang:'<path d="M4 6c4 0 8 4 8 10 0-6 4-10 8-10-1 6-4 10-8 14-4-4-7-8-8-14z"/>',
  "Wyrm's Hide":'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M8 10l4 4 4-4"/>',
  'Frostbite Arrow':'<path d="M4 20L20 4M20 4h-6M20 4v6"/><path d="M7 14l4 4M13 8l4 4"/>',
  'Blizzard Volley':'<path d="M4 6l4 3-4 3M10 12l4 3-4 3M16 6l4 3-4 3"/>',
  'Frost Chain':'<circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M9 6h6M7.5 8.5l3 7M16.5 8.5l-3 7"/>',
  Wyrmstorm:'<path d="M12 12a2 2 0 1 1 2 2 5 5 0 1 1-5-5 8 8 0 1 1 8 8"/><path d="M12 2v3M12 19v3"/>',
  // passives
  Vitality:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  Ferocity:'<path d="M5 4l5 16M11 3l4 17M17 5l3 14"/>',
  Precision:'<path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>',
  'Iron Will':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M12 8v8"/>',
  Quickhands:'<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>',
  Scavenger:'<path d="M12 3l7 6-7 12L5 9z"/><path d="M5 9h14M9 9l3 12M15 9l-3 12"/>',
  Scholar:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M9 8h6M9 12h6"/>',
  Resonance:'<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/>',
  // cave: the floor-1 cave skills (the set skills draw their set's emblem)
  Echo:'<path d="M9 12h.01"/><path d="M12.5 8.5a5 5 0 0 1 0 7M15.5 5.5a9 9 0 0 1 0 13M6 6.5a8 8 0 0 0 0 11"/>',
  Flare:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M5 19l2.5-2.5M16.5 7.5L19 5"/>',
  Overdrive:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l5-6"/><path d="M7 13l-1-1M12 9V8M17 13l1-1"/>',
  'Lantern Ward':'<path d="M9 5h6M10 3h4M8 7h8l-1 11H9z"/><path d="M12 10c1 1.3 1.5 2.3 0 4-1.5-1.7-1-2.7 0-4z"/><path d="M7 21h10"/>',
  Burrow:'<path d="M3 18c3-6 15-6 18 0z"/><path d="M12 3v8M9 8l3 3 3-3"/>',
  'Cave-in':'<path d="M3 4h18"/><path d="M7 8l2 2-2 2-2-2zM15 10l2.5 2.5L15 15l-2.5-2.5zM10 16l2 2-2 2-2-2z"/>',
  'Grapple Line':'<path d="M12 3v11"/><path d="M12 14a4 4 0 1 1-6-3.5M12 14a4 4 0 1 0 6-3.5"/><path d="M6 10.5l-1-2M18 10.5l1-2"/>',
  'Second Wind':'<path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/>',
};
const abBasic=$('#abBasic'), abSkill=$('#abSkill'), abBurst=$('#abBurst'); let abKey='';
function burstSlot(){ doAttack('burst'); }
function flashSkillSlot(slot){ abKey=''; const el=slot==='burst'?abBurst:abSkill; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
function setActionBar(){
  const c=clsOf(), L=pvSkills();   // pvp: the fixed loadout on the island
  // each button: the equipped ability, a lock until the slot's level, or a + when nothing is equipped
  const fill=(el,slot,key)=>{ const a=abilityOf(c,slot,L,pvLevel()), locked=pvLevel()<slotLv(slot);
    el.querySelector('svg').innerHTML=(a&&ssGlyph(a))||ICONS[a?a.name:locked?'lock':'plus']||ICONS.burst;   // skillsets: a set piece draws its set's own symbol, in the set's colour
    el.classList.toggle('has-set',!!(a&&ssTint(a))); el.style.setProperty('--set',a&&ssTint(a)||'transparent');
    el.querySelector('.nm').textContent=a?a.name:locked?'Lv '+slotLv(slot):(slot==='burst'?'Burst':'Skill');
    el.classList.toggle('empty',!a); const ae=a?elOf(a):'basic'; el.classList.toggle('has-el',ae!=='basic'); el.style.setProperty('--el',ELEMS[ae].col);
    el.setAttribute('aria-label',a?a.name+' ('+key+')':locked?(slot==='burst'?'Burst':'Skill')+' slot, opens at level '+slotLv(slot):'Empty '+slot+' slot: choose one'); };
  fill(abBasic,'basic',kbName('basic')); fill(abSkill,'skill',kbName('skill')); fill(abBurst,'burst',kbName('burst'));
  caveFillTile();   // cave: the 4th tile (Go to the cave / its skill)
}
const press=(el,fn)=>{ el.addEventListener('touchstart',e=>{ e.preventDefault(); fn(); },{passive:false}); el.addEventListener('click',fn); };
press(abBasic,()=>doAttack('basic')); press(abSkill,()=>doAttack('skill')); press(abBurst,burstSlot); press($('#abCave'),()=>doAttack('cave'));   // cave: the 4th slot
addEventListener('keydown',e=>{
  if(!started||uiOpen()) return;
  if(kbIs(e.code,'basic')) doAttack('basic');
  if(kbIs(e.code,'skill')) doAttack('skill');
  if(kbIs(e.code,'burst')) burstSlot();
  if(kbIs(e.code,'cave')) doAttack('cave');   // cave: the 4th slot
  if(kbIs(e.code,'skills') && !e.repeat) toggleSkills();
  if(kbIs(e.code,'target')){ e.preventDefault(); cycleTarget(); }
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
let mDown=null;
canvas.addEventListener('mousedown',e=>{
  if(!started||customizing||altHeld) return;   // Alt held: the mouse is free for the menus, a click on the world does nothing
  const locked=document.pointerLockElement===canvas;
  mDown={x:e.clientX,y:e.clientY,t:performance.now(),locked};
  if(!locked){ if(canvas.dataset.lockTried) canvas.dataset.lockFailed='1'; canvas.dataset.lockTried='1'; }
  if(locked && !uiOpen()) doAttack(e.button===2?'skill':'basic');
});
addEventListener('mouseup',e=>{
  if(!mDown) return; const d=mDown; mDown=null;
  if(d.locked||document.pointerLockElement===canvas) return;
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<5 && performance.now()-d.t<280 && canvas.dataset.lockFailed) doAttack(e.button===2?'skill':'basic');
});
document.addEventListener('pointerlockerror',()=>{ canvas.dataset.lockFailed='1'; });
setActionBar();
attachWeapons();
weaponsReady=true;
