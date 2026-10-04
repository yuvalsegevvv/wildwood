//@ Dungeons, setup only (nothing calls it yet): map tiles and the theme registry (defineDungeonTheme, DG_BAD), the seeded layout generator, the baked collision grid with props, line of sight and a flow field, the mission list (every mission ends with a boss in a round hall the size of a boss arena), where the three entrances stand, the hourly offer of two mission types, who may enter, party-size scaling. Pure.
/* Design: docs/DUNGEONS.md. A dungeon is a grid of map tiles (a room is authored as 24 x 24 cells of 2 m, so DG_TILE = 48 m a side: big enough for a boss's circle) joined
   by doors in the middle of their sides. dgLayout picks which tile goes where from a seed, so the server and every client build the same dungeon from {mission, seed,
   theme} and no layout is ever sent; dgBake turns it into the cell grid that both sides collide against and the server's monsters walk on. Nothing here touches the
   world (no terrain, no players, no state): the wiring is the build order in the design doc.
   A tile's art is 24 strings of 24 characters: '#' wall, '.' floor, and markers that are floor too: S a monster mouth, O an objective, C a cache, P the portal, B the
   middle of a boss hall (where the boss appears). A theme adds its own characters (its legend: props, solid pillars, hazard spots), docs/DUNGEON-THEMES.md section 3.
   Agent map: exports DG_THEMES (by id; `bare` is the dev test set), defineDungeonTheme / DG_BAD (the registry: one file per theme in shared/dungeons/themes/), dgTileProblems,
   dgCarve, dgLayout({mission,seed,theme|set}), dgBake (cells, marks, props, boss circle), dgSolid / dgFree / dgSlide / dgLos / dgFlow / dgStep, DG_HALL_PILLARS / DG_HALL_MOUTHS
   (the hall's geometry the boss kits rely on), DG_MISSIONS, dgOffer, dgUnlocked, DG_ENTRANCES, dgParty. The bosses are in shared/dungeons/bosses.js. Test: tools/dungeons-smoke.js. */
// DG_BOSS_R: the radius of a boss arena (ARENAS: all six are 20 m), which is also the radius of a boss hall, so the boss kits (they read A.x, A.z, A.r) work in a dungeon as they do in their arenas
const DG_CELL=2, DG_TC=24, DG_TILE=DG_CELL*DG_TC, DG_BOSS_R=20;
const DG_N=1, DG_E=2, DG_S=4, DG_W=8, DG_STEP=[[DG_N,0,-1],[DG_E,1,0],[DG_S,0,1],[DG_W,-1,0]];   // door bit, grid step (z grows south)
const dgOpp=b=>b===DG_N?DG_S:b===DG_S?DG_N:b===DG_E?DG_W:DG_E;
const dgRotMask=m=>((m<<1)|(m>>3))&15;   // a quarter turn clockwise: N -> E -> S -> W -> N
// a quarter turn clockwise of a tile's art (a door in the north wall comes out in the east wall)
function dgRotArt(a){ const o=[]; for(let r=0;r<DG_TC;r++){ let s=''; for(let c=0;c<DG_TC;c++) s+=a[DG_TC-1-c][r]; o.push(s); } return o; }
/* a plain tile: a room (room = [width, height] in cells for a rectangle, or a number, the radius in cells, for a round one), an arm of floor (2 cells = 4 m wide) from each
   door to the middle, optional pillars (2 x 2 cells, [dx,dz] = the top left corner's offset from the middle) and markers [ch,dx,dz] (offsets from the middle, in cells) */
function dgRect(doors,room,marks,pillars){
  const C=DG_TC/2, g=Array.from({length:DG_TC},()=>Array(DG_TC).fill('#')), fill=(x0,z0,x1,z1,ch)=>{ for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) g[z][x]=ch; };
  if(typeof room==='number'){ for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(Math.hypot(x+0.5-C,z+0.5-C)<=room) g[z][x]='.'; }
  else fill(C-room[0]/2,C-room[1]/2,C+room[0]/2-1,C+room[1]/2-1,'.');
  if(doors&DG_N) fill(C-1,0,C,C-1,'.'); if(doors&DG_S) fill(C-1,C,C,DG_TC-1,'.'); if(doors&DG_W) fill(0,C-1,C-1,C,'.'); if(doors&DG_E) fill(C,C-1,DG_TC-1,C,'.');
  for(const [dx,dz] of pillars||[]) fill(C+dx,C+dz,C+dx+1,C+dz+1,'#');
  for(const [ch,dx,dz] of marks||[]) g[C+dz][C+dx]=ch;
  return g.map(r=>r.join(''));
}
// the five ways a tile's doors can be (each is turned to all four directions by dgVariants)
const DG_SHAPES={dead:DG_S, straight:DG_N|DG_S, bend:DG_N|DG_E, tee:DG_N|DG_E|DG_S, cross:15};
const dgKind=(id,tags,w,room,marks,pillars,shapes)=>shapes.map(sh=>({id:id+'-'+sh,doors:DG_SHAPES[sh],tags,w,art:dgRect(DG_SHAPES[sh],room,marks,pillars)}));
const DG_ALL_SHAPES=Object.keys(DG_SHAPES);
/* THE ROUND HALL's geometry, in metres from its middle, the same in every theme (the test checks every hall tile against it) because the dungeon bosses' kits use it:
   four pillars (4 m squares centred at DG_HALL_PILLARS: cover from Amanita's pulse and Haugbui's breath, what stops Gawataro's charge) and four monster mouths
   (DG_HALL_MOUTHS: where adds rise). Placed symmetrically, so a quarter turn of a hall tile leaves them where they were. */
const DG_HALL_PILLARS=[[-10,-10],[10,-10],[-10,10],[10,10]], DG_HALL_PILLAR_HALF=2, DG_HALL_MOUTHS=[[-13,-13],[13,-13],[-13,13],[13,13]];
/* the test set: bare rooms only to prove the machinery, not a dungeon. The hall is a round room of a boss arena's radius (DG_BOSS_R / DG_CELL = 10 cells) with the four pillars
   for cover and the boss's spot in the middle. A real theme lists hand-authored tiles through defineDungeonTheme (below and shared/dungeons/themes/). */
const DG_SET_BARE=[
  ...dgKind('pass',['pass'],3,[4,4],[],null,DG_ALL_SHAPES),
  ...dgKind('room',['room'],3,[12,12],[['S',-3,-3],['S',2,2]],null,DG_ALL_SHAPES),
  ...dgKind('hall',['hall'],1,DG_BOSS_R/DG_CELL,[['B',0,0],...DG_HALL_MOUTHS.map(([x,z])=>['S',x/DG_CELL-0.5,z/DG_CELL-0.5])],DG_HALL_PILLARS.map(([x,z])=>[x/DG_CELL-1,z/DG_CELL-1]),DG_ALL_SHAPES),
  ...dgKind('start',['start'],1,[8,8],[['P',0,0]],null,['dead']),
  ...dgKind('site',['site'],1,[10,10],[['O',0,0]],null,DG_ALL_SHAPES),
  ...dgKind('cache',['cache'],1,[8,8],[['C',0,0]],null,['dead'])];
/* THE THREE DUNGEONS, one for each built land (docs/DUNGEON-THEMES.md has the designs: feel, tile kit, hazard, objective skins, bosses), one file each in shared/dungeons/themes/,
   entered through defineDungeonTheme below. Each is level DG_LV at its land's base difficulty (see DG_LANDS for the difficulty). Which two mission types a dungeon offers changes
   every hour (dgOffer); what a clear pays is shared/dungeon-rewards.js. */
const DG_LV=30, DG_ENTRY_LV=25;   // a dungeon is level 30 at its land's base difficulty; you may enter from level 25 at EVERY difficulty (+0 to +V): the tiers make the monsters harder, not the way in
/* The difficulty a dungeon is played at is its land's own zone tier setting (gear.zt[land].on: the +N chosen under the map in a village, shared/tiers.js). Each land has a
   `base`, the lowest +N its dungeons open at, where they are level DG_LV; every tier above adds ZTIER_STEP (10) levels, as everywhere. Wildwood's base is +1 (its dungeon
   is locked at +0, level 30 at +1, 40 at +2, 50 at +3, 60 at +4, 70 at +5); the Vale's and the Reach's are +0 (level 30, 40, 50, 60, 70, 80). `unlock` is the land's progress gate. */
const DG_LANDS={
  home:{name:'Wildwood',    base:1,unlock:{},          hint:'Wildwood opens its dungeon at +1 difficulty: once Carapax, the Tide King, has fallen, set Wildwood to +1 on the map in a village.'},
  vale:{name:'Sakura Vale', base:0,unlock:{east:2},    hint:'Walk to Hanami, on the far side of the tunnel, first.'},
  hoar:{name:'Hoarfrost Reach',base:0,unlock:{north:2},hint:'Walk into Rimehold, through Frostgate Pass, first.'}};
/* THE THEME REGISTRY. A dungeon theme is one file, shared/dungeons/themes/<id>.js, holding a single defineDungeonTheme({...}) call and no top-level names, plus its line in
   src/manifest.json (after shared/dungeons/bosses.js). defineDungeonTheme checks the theme; a bad one is LEFT OUT (the game still boots), warned about (console.warn) and listed in
   DG_BAD as {id, field, why}: tools/dungeons-smoke.js fails naming them. Fields:
     id ('hollowroots': a lowercase word), name, land (a DG_LANDS key), at (the ZONES name of the zone it lies under), lv (default DG_LV),
     mobs:{walkers, guardians} (MON_DEFS ids; walkers fit the 4 m doors: radius <= 0.9 m, at least 4 kinds; guardians are the big ones that stay in their room),
     boss (a DG_BOSS_DEFS id), music (a music theme), pal:{wall, floor, fog, light} (colours for the client builder),
     legend:{char:{solid, prop, hazard?, light?, post?}}: the theme's own characters (one character each, not # . S O C P B). solid: blocks like '#' (collision, line of sight,
       the flow field); prop: what the client draws there (dgBake lists every legend cell in B.props); hazard: a run-time hazard spot (set off by server/dungeons/hazards.js: 'spikes',
       'steam', 'prison'...); light: a colour if it glows; post: 'guardian' (where a guardian stands).
     tiles: [{id, tags, w, doors, art}] a tile with its doors drawn, or [{id, tags, w, shapes, art}] a room drawn with its rim closed and the door shapes it comes in (DG_SHAPES keys):
       each shape becomes a tile <id>-<shape> with dgCarve opening its doors. Tags: start hall site cache room pass (the roles of DG_MISSIONS). Every tile must pass dgTileProblems,
       and the set must fit every cell a layout can make (dgCoverProblems): start and cache in every dead end, hall, site, room and pass in all 15 door masks. */
const DG_MARKS='SOCPB', DG_TAGS=['start','hall','site','cache','room','pass'];
const DG_THEMES=Object.assign(Object.create(null),{bare:{id:'bare',name:'Bare test set',tiles:DG_SET_BARE,legend:{},dev:true}});   // (no prototype: a lookup by any id is safe)
const DG_BAD=[];
// open a tile's doors: art drawn with its rim closed gets, for each door of `doors`, the middle two cells of that side dug out and on inward through solid cells until the floor is reached
function dgCarve(art,doors,legend){
  const lg=legend||{}, g=art.map(r=>r.split('')), solid=ch=>ch==='#'||!!(lg[ch]&&lg[ch].solid), M=DG_TC/2, E=DG_TC-1;
  for(const [bit] of DG_STEP){
    if(!(doors&bit)) continue;
    for(let i=0;i<DG_TC;i++){
      const pair=bit===DG_N?[[M-1,i],[M,i]]:bit===DG_S?[[M-1,E-i],[M,E-i]]:bit===DG_W?[[i,M-1],[i,M]]:[[E-i,M-1],[E-i,M]];
      if(i>0&&pair.every(([x,z])=>!solid(g[z][x]))) break;
      for(const [x,z] of pair) if(solid(g[z][x])) g[z][x]='.';
    }
  }
  return g.map(r=>r.join(''));
}
// what is wrong with one tile ([] when nothing): its size and characters, tags and weight, its doors against its mask (the middle two cells of a side, every other rim cell solid),
// one piece of floor, the markers its role needs, and for a hall the boss's circle: open floor out to DG_BOSS_R but for the four pillars at DG_HALL_PILLARS, B in the middle, S at DG_HALL_MOUTHS
function dgTileProblems(t,legend){
  const lg=legend||{}, a=t&&t.art, out=[], solid=ch=>ch==='#'||!!(lg[ch]&&lg[ch].solid), C=DG_TC/2;
  if(!Array.isArray(a)||a.length!==DG_TC||a.some(r=>typeof r!=='string'||r.length!==DG_TC)) return ['the art is not '+DG_TC+' strings of '+DG_TC+' characters'];
  for(const r of a) for(const ch of r) if(ch!=='#'&&ch!=='.'&&!DG_MARKS.includes(ch)&&!lg[ch]) return ['the character "'+ch+'" is in neither the markers nor the legend'];
  if(!Number.isInteger(t.doors)||t.doors<1||t.doors>15) out.push('doors '+t.doors+' (a mask of 1-15)');
  if(!Array.isArray(t.tags)||!t.tags.length||t.tags.some(g=>!DG_TAGS.includes(g))) out.push('tags '+JSON.stringify(t.tags)+' (of '+DG_TAGS.join(' ')+')');
  if(!(t.w>0)) out.push('weight '+t.w);
  const mid=i=>i===C-1||i===C;
  for(const [bit,side] of [[DG_N,'north'],[DG_E,'east'],[DG_S,'south'],[DG_W,'west']]) for(let i=0;i<DG_TC;i++){
    const ch=bit===DG_N?a[0][i]:bit===DG_S?a[DG_TC-1][i]:bit===DG_W?a[i][0]:a[i][DG_TC-1];
    if(!solid(ch)!==(!!(t.doors&bit)&&mid(i))){ out.push('the '+side+' rim does not match the doors (a door is the middle two cells, every other rim cell solid)'); break; }
  }
  let total=0, s=null; for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(!solid(a[z][x])){ total++; s=s||[x,z]; }
  if(!s) return out.concat(['no floor']);
  const seen=new Set([s[1]*DG_TC+s[0]]), q=[s];
  for(let i=0;i<q.length;i++){ const [x,z]=q[i]; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, nz=z+dz, k=nz*DG_TC+nx; if(nx>=0&&nz>=0&&nx<DG_TC&&nz<DG_TC&&!solid(a[nz][nx])&&!seen.has(k)){ seen.add(k); q.push([nx,nz]); } } }
  if(seen.size!==total) out.push('the floor is in more than one piece');
  const count=ch=>a.join('').split(ch).length-1, ndoors=[1,2,4,8].filter(b=>t.doors&b).length, tags=t.tags||[];
  if(tags.includes('start')&&(count('P')!==1||ndoors!==1)) out.push('a start tile has one portal P and one door');
  if(tags.includes('cache')&&(count('C')<1||ndoors!==1)) out.push('a cache tile has a cache C and one door');
  if(tags.includes('site')&&count('O')!==1) out.push('a site tile has one objective O');
  if(tags.includes('hall')){
    const R=DG_BOSS_R/DG_CELL, inPillar=(x,z)=>DG_HALL_PILLARS.some(([px,pz])=>Math.abs((x+0.5-C)*DG_CELL-px)<DG_HALL_PILLAR_HALF&&Math.abs((z+0.5-C)*DG_CELL-pz)<DG_HALL_PILLAR_HALF);
    let bad=0, b=0, bOk=true;
    for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++){ const d=Math.hypot(x+0.5-C,z+0.5-C), ch=a[z][x];
      if(d<=R&&solid(ch)!==inPillar(x,z)) bad++;
      if(ch==='B'){ b++; bOk=bOk&&d<=1; } }
    if(bad) out.push('the hall is not the boss circle: '+bad+' cells within '+DG_BOSS_R+' m differ from "floor but the four pillars at DG_HALL_PILLARS"');
    if(b!==1||!bOk) out.push('a hall has one boss spot B in its middle');
    if(!DG_HALL_MOUTHS.every(([mx,mz])=>a[Math.floor(C+mz/DG_CELL)][Math.floor(C+mx/DG_CELL)]==='S')) out.push('a hall has a monster mouth S at each of DG_HALL_MOUTHS');
  }
  return out;
}
// can every cell a layout makes find a tile? (dgTry: the entrance and caches are dead ends; the hall, sites and the fillers, room and pass, may have any doors)
function dgCoverProblems(tiles){
  const V=dgVariants(tiles), out=[], has=(tag,m)=>V.some(v=>v.doors===m&&v.tags.includes(tag));
  for(const tag of DG_TAGS){ const masks=tag==='start'||tag==='cache'?[1,2,4,8]:Array.from({length:15},(_,i)=>i+1), miss=masks.filter(m=>!has(tag,m)); if(miss.length) out.push(tag+' has no tile for door masks '+miss.join(',')); }
  return out;
}
function defineDungeonTheme(T){
  const id=T&&typeof T.id==='string'?T.id:'?', bad=(field,why)=>{ DG_BAD.push({id,field,why}); if(typeof console!=='undefined') console.warn('dungeon theme '+id+' left out: '+field+': '+why); return null; };
  if(!T||!/^[a-z][a-z0-9]*$/.test(id)) return bad('id','missing or not a lowercase word');
  if(DG_THEMES[id]) return bad('id','defined twice');
  if(typeof T.name!=='string'||!T.name) return bad('name','missing');
  if(!DG_LANDS[T.land]) return bad('land','"'+T.land+'" is not one of '+Object.keys(DG_LANDS).join(' '));
  if(!ZONES.some(z=>z.name===T.at)) return bad('at','"'+T.at+'" is not the name of a zone');
  const lv=T.lv===undefined?DG_LV:T.lv; if(!Number.isInteger(lv)||lv<1||lv>99) return bad('lv',String(T.lv));
  const mobs=T.mobs||{}, defOf=mid=>ALL_MON_DEFS.find(d=>d.id===mid);
  if(!Array.isArray(mobs.walkers)||mobs.walkers.length<4) return bad('mobs','at least 4 kinds of walker');
  for(const mid of [...mobs.walkers,...(mobs.guardians||[])]) if(!defOf(mid)) return bad('mobs','no monster "'+mid+'"');
  for(const mid of mobs.walkers) if(defOf(mid).rad>0.9) return bad('mobs','walker "'+mid+'" is too big for the 4 m doors (radius '+defOf(mid).rad.toFixed(2)+' m > 0.9)');
  if(!DG_BOSS_DEFS[T.boss]) return bad('boss','no dungeon boss "'+T.boss+'" in DG_BOSS_DEFS');
  if(typeof T.music!=='string'||!T.music) return bad('music','missing');
  if(!T.pal||!['wall','floor','fog','light'].every(k=>Number.isInteger(T.pal[k]))) return bad('pal','wall, floor, fog and light colours');
  const lg=T.legend||{};
  for(const ch in lg){ const e=lg[ch]; if(ch.length!==1||ch==='#'||ch==='.'||DG_MARKS.includes(ch)) return bad('legend','"'+ch+'" (one character, not # . or a marker)'); if(!e||typeof e.solid!=='boolean'||typeof e.prop!=='string'||!e.prop) return bad('legend','"'+ch+'" needs solid (true / false) and prop (a name)'); }
  if(!Array.isArray(T.tiles)||!T.tiles.length) return bad('tiles','none');
  const tiles=[];
  for(const t of T.tiles){
    if(!t||typeof t.id!=='string') return bad('tiles','a tile without an id');
    const made=t.shapes?t.shapes.map(sh=>DG_SHAPES[sh]===undefined?null:{id:t.id+'-'+sh,doors:DG_SHAPES[sh],tags:t.tags,w:t.w,art:Array.isArray(t.art)?dgCarve(t.art,DG_SHAPES[sh],lg):t.art}):[t];
    for(const v of made){ if(!v) return bad('tiles',t.id+': unknown shape in '+JSON.stringify(t.shapes)); const p=dgTileProblems(v,lg); if(p.length) return bad('tiles',v.id+': '+p.join('; ')); tiles.push(v); }
  }
  const cover=dgCoverProblems(tiles); if(cover.length) return bad('tiles',cover.join('; '));
  const th={id,name:T.name,land:T.land,at:T.at,lv,mobs:{walkers:mobs.walkers.slice(),guardians:(mobs.guardians||[]).slice()},boss:T.boss,music:T.music,pal:Object.assign({},T.pal),legend:lg,tiles,art:true};
  DG_THEMES[id]=th; return th;
}

/* THE THREE ENTRANCES, the only way into a dungeon (docs/DUNGEON-THEMES.md section 6): a door in the world at a place of the dungeon's zone. Found by searching the real terrain for a door
   dug into a bank (the ground rises at least 2 m in the 10 m behind it) with a flat apron in front, clear of roads, villages, arenas, resource nodes, lore spots, lakes, monster camps
   and zone ridges, and checked again by the smoke test. x, z: the door; a: the way it faces (the apron lies along (sin a, cos a) from the door: not the NPCs' convention);
   the apron, DG_APRON m in front of the door, is where you stand to use it and where you are put back when a run ends. sign: where the signpost stands, on the nearest road, 3.5 m
   off it toward the door. DG_ENT_CLEAR: the radius kept clear of trees, rocks and camps (the terrain itself is not changed: a colour patch only). DG_ENT_TALK: how close the talk key works. */
const DG_APRON=7, DG_ENT_CLEAR=14, DG_ENT_TALK=4.5;
const DG_ENTRANCES={
  hollowroots:    {theme:'hollowroots',    name:'The Hollowed Elder', kind:'roots', x:244,z:148,  a:Math.PI/2, sign:{x:114.9,z:25.8,  road:'The East Road'}},
  jadesprings:    {theme:'jadesprings',    name:'The Falls Door',     kind:'falls', x:826,z:82,   a:Math.PI,   sign:{x:864.3,z:-28.5, road:'The Coast Road'}},
  bonefrostbarrow:{theme:'bonefrostbarrow',name:'The Barrow Door',    kind:'barrow',x:688,z:-950, a:0,         sign:{x:752.1,z:-823.5,road:'The Wyrm Road'}}};
const dgApron=E=>({x:E.x+Math.sin(E.a)*DG_APRON,z:E.z+Math.cos(E.a)*DG_APRON});
const dgEntranceNear=(x,z,r)=>{ let best=null,bd=r===undefined?DG_ENT_TALK:r; for(const k in DG_ENTRANCES){ const E=DG_ENTRANCES[k], d=Math.hypot(E.x-x,E.z-z); if(d<=bd){ bd=d; best=E; } } return best; };

/* WHICH TWO MISSION TYPES A DUNGEON OFFERS: every dungeon offers two different types at a time, and they change at the top of every hour (UTC), for everyone at once: the hiker
   picks one of the two when the run starts. Random, but fair and the same everywhere (the server and every client compute it): the pairs of the pool are dealt in a seeded
   shuffle, one pair an hour, every pair once before any comes again (7 types = 21 pairs = a 21-hour cycle), and the last pair of a cycle is never the first of the next, so
   the offer is never the same two hours running. Each dungeon has its own order. A run keeps the type it started with when the hour turns. */
const DG_OFFER_HOUR=3600000;
const dgHash=s=>{ let h=2166136261; for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619); return h>>>0; };
function dgShuffle(id,cycle,pool){
  const a=[]; for(let i=0;i<pool.length;i++) for(let j=i+1;j<pool.length;j++) a.push([pool[i],pool[j]]);
  const rng=mulberry32(dgHash(id)^Math.imul(cycle+1,0x9e3779b1));
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function dgOffer(id,nowMs,pool){
  pool=pool||Object.keys(DG_MISSIONS); if(pool.length<3) return pool.slice(0,2);
  const h=Math.floor(nowMs/DG_OFFER_HOUR), P=pool.length*(pool.length-1)/2, c=Math.floor(h/P), a=dgShuffle(id,c,pool);
  if(c>0){ const last=dgShuffle(id,c-1,pool)[P-1]; if(last[0]===a[0][0]&&last[1]===a[0][1]){ const t=a[0]; a[0]=a[1]; a[1]=t; } }
  return a[h-c*P].slice();
}
const dgOfferLeft=nowMs=>Math.ceil((DG_OFFER_HOUR-((nowMs%DG_OFFER_HOUR)+DG_OFFER_HOUR)%DG_OFFER_HOUR)/1000);   // seconds until the offer changes
const dgTierOf=(gear,land)=>{ const z=gear&&gear.zt&&gear.zt[land]; return z?z.on|0:0; };   // the +N you play the land at
const dgLevel=(T,tier)=>(T.lv||DG_LV)+ZTIER_STEP*Math.max(0,(tier|0)-DG_LANDS[T.land].base);   // a dungeon's level at +tier
/* can this hiker (gear as the server keeps it, level) enter the theme at +tier (default: the land's tier they play at)? {ok, why, tier, level}. A party plays at its leader's
   tier, so a member is checked at that tier: they need it unlocked (gear.zt[land].max) and level DG_ENTRY_LV, whatever tier they play at themselves. A theme may carry its own `unlock`. */
function dgUnlocked(gear,level,T,tier){
  const L=DG_LANDS[T.land], U=T.unlock||L.unlock, g=gear||{}, z=g.zt&&g.zt[T.land], t=tier===undefined?dgTierOf(g,T.land):tier|0;
  if(t<L.base) return {ok:false,why:L.hint};
  if(t>((z?z.max:0)|0)) return {ok:false,why:'You have not unlocked +'+t+' in '+L.name+' yet.'};
  if(U.east!==undefined&&(g.east|0)<U.east) return {ok:false,why:L.hint};
  if(U.north!==undefined&&(g.north|0)<U.north) return {ok:false,why:L.hint};
  const lv=dgLevel(T,t); if((level|0)<DG_ENTRY_LV) return {ok:false,why:'Reach level '+DG_ENTRY_LV+' first.'};   // (the same at every tier: a level-60 dungeon used to ask for 55, which nobody can have)
  return {ok:true,why:'',tier:t,level:lv};
}
// the door's look and what pressing the talk key says: open at the tier you play (Wildwood's roots are knotted shut at +0) and the land's progress; the level is not part of it
const dgGateOpen=(gear,T)=>{ const L=DG_LANDS[T.land], U=T.unlock||L.unlock, g=gear||{}; return dgTierOf(g,T.land)>=L.base&&(U.east===undefined||(g.east|0)>=U.east)&&(U.north===undefined||(g.north|0)>=U.north); };
// every tile in every quarter turn (turns that come out the same are kept once)
function dgVariants(set){
  const out=[], seen=new Set();
  for(const t of set){ let art=t.art, doors=t.doors; for(let r=0;r<4;r++){ const key=t.id+'|'+doors+'|'+art.join(''); if(!seen.has(key)){ seen.add(key); out.push({id:t.id,rot:r,doors,tags:t.tags,w:t.w,art}); } art=dgRotArt(art); doors=dgRotMask(doors); } }
  return out;
}
const DG_VCACHE=new Map();
const dgVariantsOf=set=>{ let v=DG_VCACHE.get(set); if(!v){ v=dgVariants(set); DG_VCACHE.set(set,v); } return v; };

/* The missions (design doc, section 4) as far as the layout is concerned: the grid it grows in, how many tiles, which roles it needs, how many extra loops (a share of the
   neighbouring tiles that get a second door between them), and the chance that a dead end is a cache nook. A role is a tile tag (as: the name the cell goes by, if not the
   tag; pick: 'far' the furthest from the entrance, 'hub' the best connected, 'spread' as far from the others as possible; min: never closer than that many tiles to the
   entrance or to a cell of the same role already placed). Every mission has exactly one boss hall (role 'boss', a hall tile): when the mission's objectives are done the boss appears there
   and killing it clears the mission (in Defense and Survival the hall that is the hub is that hall). What each mission does lives in server/dungeons.js, later. */
const DG_MISSIONS={
  purge:   {name:'Purge',   blurb:'Clear the place, then the boss of the round hall.',          grid:[4,4],rooms:[8,10], roles:[{tag:'hall',as:'boss',n:1,pick:'far'}], loops:0.15,cache:0.6},
  defense: {name:'Defense', blurb:'Hold the ward stone against waves; a boss ends it.',         grid:[4,4],rooms:[8,11], roles:[{tag:'hall',as:'boss',n:1,pick:'hub'}], loops:0.25,cache:0.5},
  survival:{name:'Survival',blurb:'Keep the lantern lit; kills feed it; a boss ends it.',       grid:[4,4],rooms:[9,12], roles:[{tag:'hall',as:'boss',n:1,pick:'hub'}], loops:0.35,cache:0.4},
  sabotage:{name:'Sabotage',blurb:'Break the heartroots; the boss that guarded them comes.',    grid:[6,6],rooms:[12,16],roles:[{tag:'hall',as:'boss',n:1,pick:'far'},{tag:'site',n:3,pick:'spread',min:3}], loops:0.12,cache:0.5},
  siege:   {name:'Siege',   blurb:'Channel the altars one by one; the last wakes the boss.',    grid:[6,6],rooms:[12,16],roles:[{tag:'hall',as:'boss',n:1,pick:'far'},{tag:'site',n:3,pick:'spread',min:3}], loops:0.2, cache:0.5},
  hunt:    {name:'Hunt',    blurb:'Corner the quarry; its death calls the boss.',               grid:[4,4],rooms:[9,12], roles:[{tag:'hall',as:'boss',n:1,pick:'far'}], loops:0.4, cache:0.4},
  escort:  {name:'Escort',  blurb:'Free the captive and lead them to the round hall.',          grid:[4,4],rooms:[8,11], roles:[{tag:'hall',as:'boss',n:1,pick:'far'},{tag:'site',n:1,pick:'spread',min:2}], loops:0.2, cache:0.5}};

/* The layout: tiles grow from the entrance on the rim of the grid as a tree (mostly long winding runs, sometimes branches), a few loops are added between
   neighbours, the mission's roles take the cells that suit them, and every other cell gets a plain tile whose doors match. A try that cannot fit a role
   (no tile of that tag has the doors the cell needs) is thrown away and the next one starts: 80 tries, then null (the caller picks another seed). Same
   seed, same dungeon, on the server and on every client. */
// o: {mission, seed, theme (a DG_THEMES id or entry: its tiles and legend) or set (a tile list, the bare test set by default), over (mission fields to override)}
function dgLayout(o){
  const T=typeof o.theme==='string'?DG_THEMES[o.theme]:o.theme||null, set=o.set||(T&&T.tiles)||DG_SET_BARE;
  const M=Object.assign({},DG_MISSIONS[o.mission]||{},o.over||{}), V=dgVariantsOf(set), rng=mulberry32((o.seed|0)^0x5bd1e995);
  for(let a=0;a<80;a++){ const L=dgTry(M,V,rng); if(L){ L.seed=o.seed|0; L.mission=o.mission; L.tries=a+1; L.theme=T?T.id:null; L.legend=(T&&T.legend)||o.legend||{}; return L; } }
  return null;
}
function dgTry(M,V,rng){
  const [gw,gh]=M.grid, want=M.rooms[0]+Math.floor(rng()*(M.rooms[1]-M.rooms[0]+1)), id=(x,z)=>z*gw+x, N=gw*gh;
  const nb=(x,z)=>DG_STEP.map(([b,dx,dz])=>[b,x+dx,z+dz]).filter(([,nx,nz])=>nx>=0&&nz>=0&&nx<gw&&nz<gh);
  const pop=m=>(m&1)+((m>>1)&1)+((m>>2)&1)+((m>>3)&1);
  const mask=new Array(N).fill(0), used=new Array(N).fill(false), order=[], rim=[];
  for(let z=0;z<gh;z++) for(let x=0;x<gw;x++) if(x===0||z===0||x===gw-1||z===gh-1) rim.push([x,z]);
  const [sx,sz]=rim[Math.floor(rng()*rim.length)], isStart=(x,z)=>x===sx&&z===sz;
  used[id(sx,sz)]=true; order.push([sx,sz]);
  const active=[[sx,sz]]; let kids=0;   // the entrance gets exactly one door: it is a dead end with the portal in it
  while(order.length<want&&active.length){
    const k=rng()<0.6?active.length-1:Math.floor(rng()*active.length), [x,z]=active[k], opts=nb(x,z).filter(([,nx,nz])=>!used[id(nx,nz)]);
    if(!opts.length||(isStart(x,z)&&kids>=1)){ active.splice(k,1); continue; }
    const [b,nx,nz]=opts[Math.floor(rng()*opts.length)];
    mask[id(x,z)]|=b; mask[id(nx,nz)]|=dgOpp(b); used[id(nx,nz)]=true; order.push([nx,nz]); active.push([nx,nz]); if(isStart(x,z)) kids++;
  }
  if(order.length<M.rooms[0]) return null;
  for(const [x,z] of order) for(const [b,nx,nz] of nb(x,z)){   // loops (each pair once)
    if(!used[id(nx,nz)]||(mask[id(x,z)]&b)||id(nx,nz)<id(x,z)||isStart(x,z)||isStart(nx,nz)) continue;
    if(rng()<M.loops){ mask[id(x,z)]|=b; mask[id(nx,nz)]|=dgOpp(b); }
  }
  const dist=new Array(N).fill(-1); { const q=[[sx,sz]]; dist[id(sx,sz)]=0; for(let i=0;i<q.length;i++){ const [x,z]=q[i]; for(const [b,nx,nz] of nb(x,z)) if((mask[id(x,z)]&b)&&dist[id(nx,nz)]<0){ dist[id(nx,nz)]=dist[id(x,z)]+1; q.push([nx,nz]); } } }
  const fits=(x,z,tag)=>V.filter(v=>v.doors===mask[id(x,z)]&&v.tags.includes(tag)), role=new Array(N).fill(null), tagOf=new Array(N).fill(null);   // role: what the cell is for (start, boss, site...); tagOf: the tag its tile needs
  if(!fits(sx,sz,'start').length) return null;
  role[id(sx,sz)]='start'; tagOf[id(sx,sz)]='start'; const chosen=[[sx,sz,'start']];
  for(const R of M.roles) for(let n=0;n<R.n;n++){
    let best=null, bs=-1e9;
    for(const [x,z] of order){
      if(role[id(x,z)]||!fits(x,z,R.tag).length) continue;
      const d=dist[id(x,z)], gap=(a)=>Math.abs(a[0]-x)+Math.abs(a[1]-z), md=Math.min(...chosen.map(gap));   // md: tiles to the nearest cell already taken (the entrance too)
      if(Math.min(...chosen.filter(c=>c[2]==='start'||c[2]===R.tag).map(gap))<(R.min||0)) continue;   // min counts the entrance and the same role only
      const sc=(R.pick==='far'?d:R.pick==='hub'?pop(mask[id(x,z)])*10+Math.min(d,3):R.pick==='spread'?md:0)+rng()*0.9;   // (the noise only breaks ties)
      if(sc>bs){ bs=sc; best=[x,z]; }
    }
    if(!best) return null;
    role[id(...best)]=R.as||R.tag; tagOf[id(...best)]=R.tag; chosen.push([...best,R.tag]);
  }
  const fill=M.fill||{pass:3,room:3}, wpick=(list,key)=>{ let t=list.reduce((s,e)=>s+key(e),0)*rng(); for(const e of list){ t-=key(e); if(t<=0) return e; } return list[list.length-1]; };
  const cells=order.map(([x,z])=>{
    const m=mask[id(x,z)], tag=tagOf[id(x,z)]||(pop(m)===1&&rng()<M.cache?'cache':wpick(Object.keys(fill),t=>fill[t])), v=wpick(fits(x,z,tag),e=>e.w);
    return {x,z,mask:m,id:v.id,rot:v.rot,role:role[id(x,z)]||tag,dist:dist[id(x,z)],art:v.art};
  });
  return {gw,gh,start:[sx,sz],cells};
}
/* the baked dungeon: one floor cell grid over the whole layout (metres from its north-west corner), every marker's place, and B.props: every cell of a legend character
   as {k: its prop, x, z} (the cell's middle; hz: its hazard, if the legend gives one) for the client to draw and the run to read; a solid legend cell is wall in B.cells
   like '#' (legend: the layout's, from its theme, or the one given). Used by both sides. */
function dgBake(L,legend){
  const W=L.gw*DG_TC, H=L.gh*DG_TC, cells=new Uint8Array(W*H), marks={S:[],O:[],C:[],P:[],B:[]}, props=[], lg=legend||L.legend||{};
  for(const t of L.cells) for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++){
    const ch=t.art[z][x]; if(ch==='#') continue;
    const gx=t.x*DG_TC+x, gz=t.z*DG_TC+z, e=lg[ch], px=(gx+0.5)*DG_CELL, pz=(gz+0.5)*DG_CELL;
    if(e){ const pr={k:e.prop,x:px,z:pz}; if(e.hazard) pr.hz=e.hazard; props.push(pr); if(e.solid) continue; }
    cells[gz*W+gx]=1;
    if(marks[ch]) marks[ch].push({x:px,z:pz,tile:[t.x,t.z],role:t.role});
  }
  const bm=marks.B.find(m=>m.role==='boss'), boss=bm&&{x:(bm.tile[0]*DG_TC+DG_TC/2)*DG_CELL,z:(bm.tile[1]*DG_TC+DG_TC/2)*DG_CELL,r:DG_BOSS_R};   // boss: the hall's circle, shaped like a boss arena {x,z,r}
  return {w:W,h:H,cells,marks,props,legend:lg,size:[W*DG_CELL,H*DG_CELL],start:marks.P[0],boss,layout:L};
}
// collision: a wall (or anything outside) is solid; a walker of radius r is free where its four corners are; sliding tries the move whole, then along each axis
const dgSolid=(B,x,z)=>{ const ix=Math.floor(x/DG_CELL), iz=Math.floor(z/DG_CELL); return ix<0||iz<0||ix>=B.w||iz>=B.h||!B.cells[iz*B.w+ix]; };
const dgFree=(B,x,z,r)=>!(dgSolid(B,x-r,z-r)||dgSolid(B,x+r,z-r)||dgSolid(B,x-r,z+r)||dgSolid(B,x+r,z+r));
function dgSlide(B,ox,oz,nx,nz,r){ if(dgFree(B,nx,nz,r)) return [nx,nz]; if(dgFree(B,nx,oz,r)) return [nx,oz]; if(dgFree(B,ox,nz,r)) return [ox,nz]; return [ox,oz]; }
// line of sight (for aggro, aiming and projectiles): no wall between the two points, sampled every cell / 2
function dgLos(B,x0,z0,x1,z1){ const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/(DG_CELL*0.5)); for(let i=1;i<n;i++){ const t=i/n; if(dgSolid(B,x0+(x1-x0)*t,z0+(z1-z0)*t)) return false; } return true; }
/* Walking round walls: monsters in the world walk in a straight line, which a wall defeats. dgFlow(B,x,z) is a breadth-first field of how many steps every floor
   cell is from (x,z) (65535: cut off), made once per target when the target changes cell; dgStep reads it: the direction a walker at (x,z) takes toward the goal.
   A walker steers by cell centres, so in the 2-cell (4 m) doors of the test set it is good up to a radius of about 0.9 m (48 of the 58 monster kinds); the
   treants, big beetles, some wolves and the bosses are bigger and need a clearance-aware field and wider doors (design doc, section 3). */
const DG_NB8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function dgFlow(B,x,z){
  const W=B.w, H=B.h, d=new Uint16Array(W*H).fill(65535), gx=Math.floor(x/DG_CELL), gz=Math.floor(z/DG_CELL), q=new Int32Array(W*H);
  if(gx<0||gz<0||gx>=W||gz>=H||!B.cells[gz*W+gx]) return d;
  let qh=0, qt=0; q[qt++]=gz*W+gx; d[gz*W+gx]=0;
  while(qh<qt){ const c=q[qh++], cx=c%W, cz=(c-cx)/W;
    for(const [dx,dz] of DG_NB8){ const nx=cx+dx, nz=cz+dz; if(nx<0||nz<0||nx>=W||nz>=H||!B.cells[nz*W+nx]||d[nz*W+nx]!==65535) continue;
      if(dx&&dz&&(!B.cells[cz*W+nx]||!B.cells[nz*W+cx])) continue;   // no cutting a wall's corner
      d[nz*W+nx]=d[c]+1; q[qt++]=nz*W+nx; } }
  return d;
}
function dgStep(B,flow,x,z){
  const W=B.w, cx=Math.floor(x/DG_CELL), cz=Math.floor(z/DG_CELL); if(cx<0||cz<0||cx>=W||cz>=B.h) return null;
  let best=flow[cz*W+cx], bx=0, bz=0; if(best===65535||best===0) return null;
  for(const [dx,dz] of DG_NB8){ const nx=cx+dx, nz=cz+dz; if(nx<0||nz<0||nx>=W||nz>=B.h) continue;
    const v=flow[nz*W+nx]; if(v<best&&(!(dx&&dz)||(B.cells[cz*W+nx]&&B.cells[nz*W+cx]))){ best=v; bx=dx; bz=dz; } }
  if(!bx&&!bz) return null;
  const tx=(cx+bx+0.5)*DG_CELL-x, tz=(cz+bz+0.5)*DG_CELL-z, l=Math.hypot(tx,tz)||1; return [tx/l,tz/l];
}

/* Party size (design doc, section 5): the numbers are balanced for one player. Each extra player makes every monster that spawns tougher (health only, as asked:
   DG_PARTY.hp), and optionally spawns bigger groups (count, left at 1 until a playtest says the waves feel empty) and lengthens what the party protects (obj: a
   defense stone's health). dgFightRatio is the check on the table: how much longer a party's fight with one monster lasts than a solo fight, if each extra player
   loses DG_TEAM_LOSS of their damage to overkill, being out of reach and downed time. Kept between 1 and 1.3: a party is never faster than one hiker, never a slog. */
const DG_MAX_PARTY=4, DG_TEAM_LOSS=0.08;
const DG_PARTY={hp:[1,2.0,2.8,3.6],count:[1,1,1,1],obj:[1,1.1,1.2,1.3]};
const dgParty=n=>{ const i=Math.max(1,Math.min(DG_MAX_PARTY,Math.floor(n)||1))-1; return {hp:DG_PARTY.hp[i],count:DG_PARTY.count[i],obj:DG_PARTY.obj[i]}; };
const dgFightRatio=n=>{ n=Math.max(1,Math.min(DG_MAX_PARTY,Math.floor(n)||1)); return dgParty(n).hp/(n*(1-DG_TEAM_LOSS*(n-1))); };
