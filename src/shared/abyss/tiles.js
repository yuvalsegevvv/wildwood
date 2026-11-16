//@ The Abyss's map tiles (B7): eight land patches and six cave chunks, each a registry row (pool of monster kinds, tint, props, island shape), and abTileLayout, the pure solid island a Fight round is played on
/* agent map (docs/ABYSS.md section 3f; the plan: abyss-plan/PLAN.md section 3 item 4)
   exports: AB_TILES (Object.create(null), the registry), AB_TILE_IDS (in definition order), AB_TILE_BAD (a bad row is left out and listed), defineAbTile(row), abTileOf(id) (the row or null; own-property only),
            AB_PROP_KINDS (the prop names game/abyss/view.js draws), abTileLayout(T,seed,boss) (a layout dgBake takes: abLayout in shared/abyss.js calls it),
            B9: AB_BOSS_CELLS (the boss disc's radius in cells), abTileBase(tile) (a tile string without its 'boss:' prefix: 'boss:forest' is the forest's boss disc, abLayout / abyss/boss.js)
   users: shared/abyss.js (abLayout), server/abyss/tiles.js (the offer), server/abyss/rounds.js (the run's pool), game/abyss/view.js (the look), game/abyss/choice.js (the cards); test: tools/abyss-smoke.js, tools/client-smoke.js
   A row: {id, kind:'land'|'cave', land:<land name> | floor:<cave floor n>, name, pool:[monster ids, 4-10, none a boss], tint:{ground, ground2 (two greens / sands blended over the floor), rim (the rock face under the edge), fog (blended into the void's), chip (the card's colour)},
   props:[AB_PROP_KINDS names, 2-5], shape:{r (the island's radius in 2 m cells, 15-21), wob (how much the rim wanders, 0-0.2), pillars (solid rocks standing on it, 0-6)}}.
   Land tiles take the kinds of their land's zones (shared/monster-defs.js, one varied set of eight); a cave tile takes its floor's ten (shared/cave/floor-*.js, the test compares them). Every kind is re-levelled to the round's level by the server (dgKOf);
   the Abyss never uses the rift's glass copies, so their normal speed stays. The island is a blob of 2 x 2 map tiles (96 m): the radius at every angle is r (1 + wob x two harmonics), all of it open ground, so the flow field and the walls of dgBake just work. */
const AB_TILES=Object.create(null), AB_TILE_IDS=[], AB_TILE_BAD=[];
const AB_PROP_KINDS=['tree','pine','palm','bush','tuft','rock','crystal','cactus','stalagmite','mushroom','pool','ember','grave','pillar','shell','ice'];
const AB_LANDS=['forest','vale','hoar','grey','sun','gloam','amber','isles'];
function defineAbTile(r){
  const bad=why=>{ AB_TILE_BAD.push({id:r&&typeof r.id==='string'?r.id:'?',why}); return false; }, hex=v=>Number.isInteger(v)&&v>=0&&v<=0xffffff;
  if(!r||typeof r!=='object') return bad('not an object');
  if(typeof r.id!=='string'||!/^[a-z][a-z_]{1,23}$/.test(r.id)) return bad('id');
  if(AB_TILES[r.id]) return bad('duplicate id');
  if(r.kind!=='land'&&r.kind!=='cave') return bad('kind');
  if(r.kind==='land'&&AB_LANDS.indexOf(r.land)<0) return bad('land');
  if(r.kind==='cave'&&(!Number.isInteger(r.floor)||!caveFloorDef(r.floor))) return bad('floor (no such cave floor)');
  if(typeof r.name!=='string'||!r.name||r.name.length>32) return bad('name');
  if(!Array.isArray(r.pool)||r.pool.length<4||r.pool.length>10) return bad('pool needs 4-10 monster ids');
  for(const id of r.pool){ const d=typeof id==='string'&&ALL_MON_DEFS.find(m=>m.id===id); if(!d) return bad('pool: no monster '+id); if(d.boss) return bad('pool: '+id+' is a boss'); }
  if(new Set(r.pool).size!==r.pool.length) return bad('pool repeats a kind');
  const t=r.tint; if(!t||typeof t!=='object'||!['ground','ground2','rim','fog','chip'].every(k=>hex(t[k]))) return bad('tint needs ground, ground2, rim, fog, chip as 0xrrggbb');
  if(!Array.isArray(r.props)||r.props.length<2||r.props.length>5||r.props.some(k=>AB_PROP_KINDS.indexOf(k)<0)) return bad('props needs 2-5 of AB_PROP_KINDS');
  const s=r.shape; if(!s||typeof s!=='object'||!(s.r>=15&&s.r<=21)||!(s.wob>=0&&s.wob<=0.2)||!Number.isInteger(s.pillars)||s.pillars<0||s.pillars>6) return bad('shape needs r 15-21, wob 0-0.2, pillars 0-6');
  AB_TILES[r.id]={id:r.id,kind:r.kind,land:r.land||'',floor:r.floor|0,name:r.name,pool:r.pool.slice(),tint:Object.assign({},t),props:r.props.slice(),shape:Object.assign({},s)};
  AB_TILE_IDS.push(r.id); return true;
}
const abTileOf=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(AB_TILES,id)?AB_TILES[id]:null;
const AB_BOSS_CELLS=15, abTileBase=t=>typeof t==='string'&&t.startsWith('boss:')?t.slice(5):t;   // B9: a boss tile is a plain solid disc of 15 cells = 30 m (the boss's circle is 20 m, the rift hub only 16 m), the land's look; no pillars, no wobble, no tears
/* THE LAYOUT. 2 x 2 map tiles = 48 x 48 cells; the island is centred, its rim at angle a is r (1 + wob (0.6 sin(2a+p1) + 0.4 sin(3a+p2))) cells out; pillars are solid discs between 7 cells from the middle and 6 cells inside the rim,
   so they never touch the rim and never cut the island; 'P' (the hiker's landing, the layout's start) in the middle, six tears 'S' just inside the rim, evenly round it. Pure: the same (tile, seed) is the same layout on both sides. */
function abTileLayout(T,seed,boss){
  const N=2*DG_TC, c=N/2, sh=boss?{r:AB_BOSS_CELLS,wob:0,pillars:0}:T.shape, rnd=mulberry32((seed|0)^(T.id.length*7919)^(T.shape.r*104729));   // B9: boss = the boss disc: the landing is 13 cells south of the middle (outside the boss's 10-cell circle), no tears
  const p1=rnd()*TAU, p2=rnd()*TAU, rimAt=a=>sh.r*(1+sh.wob*(0.6*Math.sin(2*a+p1)+0.4*Math.sin(3*a+p2)));
  const g=Array.from({length:N},()=>Array(N).fill('#'));
  for(let z=0;z<N;z++) for(let x=0;x<N;x++){ const dx=x+0.5-c, dz=z+0.5-c; if(Math.hypot(dx,dz)<=rimAt(Math.atan2(dz,dx))) g[z][x]='.'; }
  for(let i=0;i<sh.pillars;i++){
    const a=rnd()*TAU, rr=1.1+rnd()*1.1, rim=rimAt(a), lo=7+rr, hi=rim-6-rr; if(hi<=lo) continue; const d=lo+rnd()*(hi-lo), px=c+Math.cos(a)*d, pz=c+Math.sin(a)*d;
    for(let z=0;z<N;z++) for(let x=0;x<N;x++) if(Math.hypot(x+0.5-px,z+0.5-pz)<=rr) g[z][x]='#';
  }
  g[boss?c+13:c][c]='P';
  const jit=rnd()*TAU/6;
  for(let i=0;i<(boss?0:6);i++){
    const a=jit+i*TAU/6; let d=rimAt(a)-3, x, z;
    for(;d>8;d--){ x=Math.floor(c+Math.cos(a)*d); z=Math.floor(c+Math.sin(a)*d); if(g[z][x]==='.') break; }
    if(d>8) g[z][x]='S';
  }
  const cells=[];
  for(let tz=0;tz<2;tz++) for(let tx=0;tx<2;tx++){
    const art=[]; for(let z=0;z<DG_TC;z++) art.push(g[tz*DG_TC+z].slice(tx*DG_TC,(tx+1)*DG_TC).join(''));
    let mask=0; if(tz>0) mask|=DG_N; if(tx<1) mask|=DG_E; if(tz<1) mask|=DG_S; if(tx>0) mask|=DG_W;
    const start=tx===1&&tz===1;
    cells.push({x:tx,z:tz,mask,id:'ab-tile',rot:0,role:start?'start':'room',dist:Math.abs(tx-1)+Math.abs(tz-1),art});
  }
  return {gw:2,gh:2,start:[1,1],cells,isles:[{x:c*DG_CELL,z:c*DG_CELL,r:sh.r*DG_CELL}],mid:{x:c*DG_CELL,z:c*DG_CELL},seed:seed|0,mission:'abyss',tries:1,theme:T.id,legend:{},rift:null,tile:(boss?'boss:':'')+T.id};
}
/* ---- the eight lands: each a varied set of kinds from its own zones (a mix of small, big, flying and caster kinds) ---- */
defineAbTile({id:'forest',kind:'land',land:'forest',name:'The Home Forest',pool:['slime','shroom','beetle','boar','goblin','treant','deathcap','direboar'],
  tint:{ground:0x3f7a34,ground2:0x6a9a3c,rim:0x4a3a28,fog:0x2a5a2a,chip:0x58a840},props:['tree','bush','tuft','rock'],shape:{r:20,wob:0.1,pillars:0}});
defineAbTile({id:'vale',kind:'land',land:'vale',name:'The Sakura Vale',pool:['sakuraslime','kappa','kodama','kabuto','kitsune','ashigaru','onibi','oni'],
  tint:{ground:0x6aa05a,ground2:0xe8a8c0,rim:0x5a4048,fog:0x6a3a50,chip:0xf08cb8},props:['tree','bush','tuft','rock'],shape:{r:20,wob:0.12,pillars:0}});
defineAbTile({id:'hoar',kind:'land',land:'hoar',name:'The Hoarfrost Reach',pool:['frostslime','snowboar','lynx','wolf','reaver','rimewisp','yeti','draugr'],
  tint:{ground:0xdfeaf2,ground2:0xa8c4dc,rim:0x6a8aa8,fog:0x4a6a90,chip:0x9ad4ff},props:['pine','ice','rock','tuft'],shape:{r:20,wob:0.12,pillars:2}});
defineAbTile({id:'grey',kind:'land',land:'grey',name:'The Greyspine',pool:['granitslime','cliffboar','crystalbeetle','minegoblin','snowleopard','mistwraith','rocktroll','galedrake'],
  tint:{ground:0x7a7c80,ground2:0x9a9a92,rim:0x4a4a52,fog:0x4a5060,chip:0xa8aab4},props:['rock','pine','crystal','tuft'],shape:{r:19,wob:0.16,pillars:3}});
defineAbTile({id:'sun',kind:'land',land:'sun',name:'The Sunscar',pool:['sandslime','gildedscarab','warthog','dunescorpion','raider','cactustreant','mummy','efreet'],
  tint:{ground:0xd2a35a,ground2:0xe8c27a,rim:0x8a5a30,fog:0x8a5a3a,chip:0xf0b040},props:['cactus','rock','palm','tuft'],shape:{r:20,wob:0.14,pillars:2}});
defineAbTile({id:'gloam',kind:'land',land:'gloam',name:'The Gloamhorn',pool:['brineslime','gloomcrab','seaboar','drownedsailor','banshee','ghoul','gargoyle','hollowknight'],
  tint:{ground:0x3a4048,ground2:0x4a5a58,rim:0x24262e,fog:0x1a1a30,chip:0x7a6ac8},props:['grave','pillar','pool','rock'],shape:{r:19,wob:0.14,pillars:3}});
defineAbTile({id:'amber',kind:'land',land:'amber',name:'The Amber Reach',pool:['dustrunner','thornboar','grassstalker','mudcroc','moundsoldier','anvilhawk','cinderbuffalo','deltahippo'],
  tint:{ground:0xb89a48,ground2:0xd0b45c,rim:0x7a5a30,fog:0x8a6a3a,chip:0xe8b84a},props:['tree','tuft','rock','bush'],shape:{r:21,wob:0.1,pillars:1}});
defineAbTile({id:'isles',kind:'land',land:'isles',name:'The Emberwake Isles',pool:['crabbrute','reefraider','coralbeetle','lagoonray','junglehog','stonejaguar','ropespinner','highlandcondor'],
  tint:{ground:0xe6d4a0,ground2:0x58a878,rim:0x6a5a48,fog:0x2a6a78,chip:0x40c8b8},props:['palm','shell','bush','rock'],shape:{r:19,wob:0.16,pillars:1}});
/* ---- the six cave chunks: the floor's own monsters (shared/cave/floor-*.js), its colours ---- */
defineAbTile({id:'cave_grotto',kind:'cave',floor:1,name:'The Glowworm Grotto',pool:['glowslime','lanterncap','palebeetle','grottobat','stoneward','blindgoblin','ghostscorpion','glowwisp','limewyrm','palestalker'],
  tint:{ground:0x4c4e4c,ground2:0x5e6a6a,rim:0x3a3e44,fog:0x0a1624,chip:0x66ccff},props:['stalagmite','mushroom','pool','rock'],shape:{r:19,wob:0.2,pillars:5}});
defineAbTile({id:'cave_prism',kind:'cave',floor:2,name:'The Prism Hollows',pool:['geodeslime','prismbeetle','prismwisp','amethystgolem','shardbat','geodedelver','crystalscorpion','prismstalker','geodedrake','prismdjinn'],
  tint:{ground:0x403c52,ground2:0x5a4a78,rim:0x2a2640,fog:0x160c26,chip:0xff6ad0},props:['crystal','stalagmite','rock'],shape:{r:19,wob:0.18,pillars:5}});
defineAbTile({id:'cave_drowned',kind:'cave',floor:3,name:'The Drowned Galleries',pool:['siltslime','galleryeel','sunkenguard','hallwisp','gallerycrab','drownedknight','hallhound','gallerybat','hallgargoyle','floodsiren'],
  tint:{ground:0x44564e,ground2:0x2a9a90,rim:0x2e3a38,fog:0x08201e,chip:0x6af0d0},props:['pool','pillar','mushroom','rock'],shape:{r:19,wob:0.12,pillars:4}});
defineAbTile({id:'cave_magma',kind:'cave',floor:4,name:'The Magma Heart',pool:['lavaslime','obsidianbeetle','emberwisp','forgeraider','lavascorpion','magmaworm','ashstalker','obsidiandrake','cinderefreet','obsidiancolossus'],
  tint:{ground:0x2a2624,ground2:0x4a3228,rim:0x1c1816,fog:0x1c0903,chip:0xff7a2a},props:['ember','rock','stalagmite','pool'],shape:{r:19,wob:0.2,pillars:5}});
defineAbTile({id:'cave_frost',kind:'cave',floor:5,name:'The Frostbound Vaults',pool:['rimeslime','icebeetle','hoarwisp','frostbat','glacierwarden','rimegoblin','iceprowler','rimewyrm','blizzarddjinn','frostefreet'],
  tint:{ground:0x405a72,ground2:0x7aa0c0,rim:0x2a4060,fog:0x0a1a2e,chip:0xaee8ff},props:['ice','crystal','stalagmite'],shape:{r:19,wob:0.18,pillars:5}});
defineAbTile({id:'cave_umbral',kind:'cave',floor:6,name:'The Umbral Deep',pool:['umbraslime','gloamcap','voidbeetle','shadebat','deepwarden','murkgoblin','gloamscorpion','umbrahound','nightwyrm','abyssalcolossus'],
  tint:{ground:0x2c2840,ground2:0x3e3a5a,rim:0x1a1630,fog:0x0a0618,chip:0xb08aff},props:['stalagmite','mushroom','pool','rock'],shape:{r:19,wob:0.2,pillars:5}});
