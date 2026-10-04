// Headless test of the dungeon setup (shared/dungeons.js), straight from src/, no build, no server: the map tiles (every tile in every turn: doors match the art; the round
// hall is a boss arena's circle), the seeded layout generator (connected, reciprocal doors, one-door entrance, the roles each mission asks for, a boss hall in every
// dungeon, same seed = same dungeon), the baked grid (collision, line of sight, the flow field walkers follow round walls), the party-size table, the four dungeons' tile kits through the
// theme registry (legends, props, halls against the bosses' pillars, every mission on 300 seeds, bad themes refused into DG_BAD) and the bosses' data against their kits. One line per check.
// Usage: node tools/dungeons-smoke.js            the checks
//        node tools/dungeons-smoke.js --show defense 7   draws that dungeon (the tile graph, then the cells: one character per 2 x 2 cells)
const {loadShared}=require('./load');
const X=loadShared(['NODE_KEEPOUT','DG_CELL','DG_TC','DG_BOSS_R','ARENAS','DG_N','DG_E','DG_S','DG_W','DG_STEP','DG_SET_BARE','DG_MISSIONS','DG_PARTY','DG_MAX_PARTY','dgVariants','dgRotArt','dgRotMask','dgOpp','dgLayout','dgBake','dgSolid','dgFree','dgSlide','dgLos','dgFlow','dgStep','dgParty','dgFightRatio','mulberry32','DG_THEMES','DG_LANDS','DG_LV','DG_ENTRY_LV','dgUnlocked','dgLevel','dgTierOf','ZTIER_STEP','ZTIER_MAX','DG_ENTRANCES','DG_APRON','DG_ENT_CLEAR','DG_ENT_TALK','dgApron','dgEntranceNear','dgGateOpen','rawHeight','zoneAt','vDist','VR','roadDist','arenaDist','inTunnelCut','zoneRidge','NODES','STORY_SPOTS','LAKES','FROST_LAKES','bareGround','ROADS','ROAD_W','WATER','DG_BOSSES','dgOffer','dgOfferLeft','DG_OFFER_HOUR','FAM','ELEMS','ALL_MON_DEFS','MON_DEFS','BOSS_DEFS','ZONES',
  'DG_BAD','defineDungeonTheme','dgTileProblems','dgCarve','DG_SHAPES','DG_MARKS','DG_TAGS','DG_HALL_PILLARS','DG_HALL_PILLAR_HALF','DG_HALL_MOUTHS','DG_BOSS_DEFS','DG_HALL_LAMPS','dgVentAt','dgHallArena']);
const {DG_TC,DG_CELL}=X;
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };

if(process.argv[2]==='--show'){
  const L=X.dgLayout({mission:process.argv[3]||'defense',seed:+process.argv[4]||1}); if(!L){ console.log('no layout'); process.exit(1); }
  const G={start:'S',boss:'B',site:'o',cache:'c',room:'r',pass:'+'}, row=[];
  for(let z=0;z<L.gh*2-1;z++){ row.push(' '.repeat(L.gw*4-1).split('')); }
  for(const t of L.cells){ const x=t.x*4, z=t.z*2; row[z][x]='['; row[z][x+1]=G[t.role]; row[z][x+2]=']'; if(t.mask&X.DG_E) row[z][x+3]='-'; if(t.mask&X.DG_S) row[z+1][x+1]='|'; }
  console.log('mission '+L.mission+', seed '+L.seed+', '+L.cells.length+' tiles, '+L.tries+' tries   (S entrance, B boss hall, o site, c cache, r room, + pass)\n'+row.map(r=>r.join('')).join('\n'));
  const B=X.dgBake(L), out=[]; for(let z=0;z<B.h;z+=2){ let s=''; for(let x=0;x<B.w;x+=2) s+=(B.cells[z*B.w+x]||B.cells[z*B.w+x+1]||B.cells[(z+1)*B.w+x]||B.cells[(z+1)*B.w+x+1])?'.':'#'; out.push(s); }
  for(const k of ['S','O','C','P','B']) for(const m of B.marks[k]) { const r=Math.floor(m.z/DG_CELL/2), c=Math.floor(m.x/DG_CELL/2); out[r]=out[r].slice(0,c)+k+out[r].slice(c+1); }
  console.log('\n'+out.join('\n')); process.exit(0);
}

// ---- the map tiles ----
const V=X.dgVariants(X.DG_SET_BARE), isFloor=ch=>ch!=='#';
{ const bad=[]; for(const v of V){
    const a=v.art; if(a.length!==DG_TC||a.some(r=>r.length!==DG_TC||/[^#.SOCPB]/.test(r))){ bad.push(v.id+' format'); continue; }
    const mid=i=>i===DG_TC/2-1||i===DG_TC/2, edge={N:[],E:[],S:[],W:[]};
    for(let i=0;i<DG_TC;i++){ edge.N.push([i,isFloor(a[0][i])]); edge.S.push([i,isFloor(a[DG_TC-1][i])]); edge.W.push([i,isFloor(a[i][0])]); edge.E.push([i,isFloor(a[i][DG_TC-1])]); }
    for(const [side,bit] of [['N',X.DG_N],['E',X.DG_E],['S',X.DG_S],['W',X.DG_W]]){
      const open=!!(v.doors&bit); if(edge[side].some(([i,f])=>f!==(open&&mid(i)))) bad.push(v.id+' rot'+v.rot+' door '+side);
    }
  }
  ok('every tile in every turn: '+DG_TC+' x '+DG_TC+' cells, a door of its mask is the middle 2 cells of that side and every other cell of the rim is wall',!bad.length,V.length+' variants'+(bad.length?', bad: '+bad.slice(0,3).join('; '):'')); }
ok('the floor of every tile is one piece (you can walk from any cell to any other inside it)',V.every(v=>{
  const a=v.art, seen=new Set(), q=[]; let total=0, s=null;
  for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(isFloor(a[z][x])){ total++; s=s||[x,z]; }
  q.push(s); seen.add(s[1]*DG_TC+s[0]);
  for(let i=0;i<q.length;i++){ const [x,z]=q[i]; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, nz=z+dz, k=nz*DG_TC+nx; if(nx>=0&&nz>=0&&nx<DG_TC&&nz<DG_TC&&isFloor(a[nz][nx])&&!seen.has(k)){ seen.add(k); q.push([nx,nz]); } } }
  return seen.size===total; }));
ok('four quarter turns bring a tile and its mask back',X.DG_SET_BARE.every(t=>{ let a=t.art, m=t.doors; for(let i=0;i<4;i++){ a=X.dgRotArt(a); m=X.dgRotMask(m); } return a.join('')===t.art.join('')&&m===t.doors; }));

// ---- the layouts ----
const MIS=Object.keys(X.DG_MISSIONS), SEEDS=150, layouts={};
const roleCount=(L,r)=>L.cells.filter(c=>c.role===r).length, roleOf=R=>R.as||R.tag;
for(const mi of MIS){
  const M=X.DG_MISSIONS[mi], Ls=[]; let nulls=0, bad=[];
  for(let s=1;s<=SEEDS;s++){
    const L=X.dgLayout({mission:mi,seed:s}); if(!L){ nulls++; continue; } Ls.push(L);
    const at=new Map(L.cells.map(c=>[c.z*L.gw+c.x,c])), tag='seed '+s+': ';
    if(L.cells.length<M.rooms[0]||L.cells.length>M.rooms[1]) bad.push(tag+'size '+L.cells.length);
    for(const c of L.cells) for(const [b,dx,dz] of X.DG_STEP){ if(!(c.mask&b)) continue; const n=at.get((c.z+dz)*L.gw+c.x+dx); if(!n||!(n.mask&X.dgOpp(b))) bad.push(tag+'door without a partner at '+c.x+','+c.z); }
    const st=at.get(L.start[1]*L.gw+L.start[0]); if(!st||st.role!=='start'||[1,2,4,8].filter(b=>st.mask&b).length!==1) bad.push(tag+'entrance');
    const seen=new Set([st&&(st.z*L.gw+st.x)]), q=[st]; for(let i=0;i<q.length;i++){ const c=q[i]; for(const [b,dx,dz] of X.DG_STEP){ if(!(c.mask&b)) continue; const n=at.get((c.z+dz)*L.gw+c.x+dx); if(n&&!seen.has(n.z*L.gw+n.x)){ seen.add(n.z*L.gw+n.x); q.push(n); } } }
    if(seen.size!==L.cells.length) bad.push(tag+'not connected');
    for(const R of M.roles) if(roleCount(L,roleOf(R))!==R.n) bad.push(tag+'role '+roleOf(R));
  }
  layouts[mi]=Ls;
  ok(mi+': '+SEEDS+' seeds all make a layout (the right size, every door has a partner, one entrance door, one connected piece, every role filled)',!nulls&&!bad.length,nulls?nulls+' failed':bad.slice(0,2).join('; '));
  ok(mi+': the same seed gives the same dungeon, other seeds give other ones',JSON.stringify(X.dgLayout({mission:mi,seed:5}))===JSON.stringify(X.dgLayout({mission:mi,seed:5}))&&new Set(Ls.map(L=>L.cells.map(c=>c.x+','+c.z+c.id+c.rot).join())).size>=SEEDS*0.6,new Set(Ls.map(L=>L.cells.map(c=>c.x+','+c.z+c.id+c.rot).join())).size+' of '+SEEDS+' different');
}
for(const mi of ['sabotage','siege']) ok(mi+': its three sites are at least 3 tiles from each other and from the entrance (role min)',layouts[mi].every(l=>{
  const s=l.cells.filter(c=>c.role==='site'), e=l.start, dd=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
  return s.every((a,i)=>Math.abs(a.x-e[0])+Math.abs(a.z-e[1])>=3&&s.every((b,j)=>i===j||dd(a,b)>=3)); }));
{ const L=layouts.defense; ok('defense: the boss hall is the hub, a crossroads (3 or 4 doors) in most dungeons',L.filter(l=>l.cells.find(c=>c.role==='boss').mask&&[1,2,4,8].filter(b=>l.cells.find(c=>c.role==='boss').mask&b).length>=3).length>=SEEDS*0.5); }
ok('the missions\' roles all exist in the test set, their grids can hold their tile counts, and every mission has exactly one boss hall (role \'boss\')',MIS.every(mi=>{ const M=X.DG_MISSIONS[mi]; return M.rooms[1]<=M.grid[0]*M.grid[1]&&M.roles.every(R=>V.some(v=>v.tags.includes(R.tag)))&&M.roles.filter(R=>R.as==='boss'&&R.tag==='hall'&&R.n===1).length===1; }));

// ---- the boss hall is the boss circle ----
ok('every boss arena in ARENAS has the radius DG_BOSS_R ('+X.DG_BOSS_R+' m): the hall is exactly that circle, so the boss kits (they read A.x, A.z, A.r) fit',X.ARENAS.length>=6&&X.ARENAS.every(a=>a.r===X.DG_BOSS_R),X.ARENAS.map(a=>a.r).join(','));
ok('a hall tile is that circle: open floor except its four pillars (16 cells) inside radius '+X.DG_BOSS_R+' m less a cell, one boss spot in the middle, and it fits the tile',DG_TC*DG_CELL>=2*X.DG_BOSS_R+2*DG_CELL&&V.filter(v=>v.tags.includes('hall')).every(v=>{
  const C=DG_TC/2, rIn=X.DG_BOSS_R/DG_CELL-1; let walls=0, b=0, bOk=true;
  for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++){ const ch=v.art[z][x]; if(Math.hypot(x+0.5-C,z+0.5-C)<=rIn&&ch==='#') walls++; if(ch==='B'){ b++; bOk=Math.hypot(x+0.5-C,z+0.5-C)<=1; } }
  return walls===16&&b===1&&bOk; }));
for(const mi of ['purge','sabotage','siege','hunt','escort']) ok(mi+': the boss hall is the furthest tile from the entrance',layouts[mi].every(l=>{ const b=l.cells.find(c=>c.role==='boss'); return !!b&&b.dist===Math.max(...l.cells.map(c=>c.dist)); }));

// ---- the baked grid ----
const rng=X.mulberry32(99), allFloor=B=>{ const f=[]; for(let z=0;z<B.h;z++) for(let x=0;x<B.w;x++) if(B.cells[z*B.w+x]) f.push([(x+0.5)*DG_CELL,(z+0.5)*DG_CELL]); return f; };
{ let bad=[]; for(const mi of MIS) for(const L of layouts[mi].slice(0,40)){
    const B=X.dgBake(L), fl=allFloor(B), flow=X.dgFlow(B,B.start.x,B.start.z), reach=fl.filter(([x,z])=>flow[Math.floor(z/DG_CELL)*B.w+Math.floor(x/DG_CELL)]!==65535).length, M=X.DG_MISSIONS[mi];
    if(reach!==fl.length) bad.push(mi+' '+L.seed+' floor cut off');
    if(B.marks.P.length!==1) bad.push(mi+' '+L.seed+' portal count');
    if(B.marks.B.length!==1||!B.boss||B.boss.r!==X.DG_BOSS_R||X.dgSolid(B,B.boss.x,B.boss.z)) bad.push(mi+' '+L.seed+' boss hall');
    else { let walls=0; for(let z=Math.floor((B.boss.z-X.DG_BOSS_R)/DG_CELL);z<=Math.ceil((B.boss.z+X.DG_BOSS_R)/DG_CELL);z++) for(let x=Math.floor((B.boss.x-X.DG_BOSS_R)/DG_CELL);x<=Math.ceil((B.boss.x+X.DG_BOSS_R)/DG_CELL);x++) if(Math.hypot((x+0.5)*DG_CELL-B.boss.x,(z+0.5)*DG_CELL-B.boss.z)<=X.DG_BOSS_R-DG_CELL&&X.dgSolid(B,(x+0.5)*DG_CELL,(z+0.5)*DG_CELL)) walls++;
      if(walls!==16) bad.push(mi+' '+L.seed+' boss circle has '+walls+' wall cells'); }
    if(B.marks.O.length!==(M.roles.find(r=>r.tag==='site')||{n:0}).n) bad.push(mi+' '+L.seed+' objective count '+B.marks.O.length);
    for(const k of ['S','O','C','P','B']) for(const m of B.marks[k]) if(X.dgSolid(B,m.x,m.z)) bad.push(mi+' '+L.seed+' marker in a wall');
    if(!B.marks.S.length) bad.push(mi+' '+L.seed+' no monster mouth');
  }
  ok('baked: all floor is reachable from the portal, one portal, one boss circle {x,z,r} that is open floor bar its pillars, one objective per site, every marker on floor, monster mouths exist',!bad.length,bad.slice(0,2).join('; ')); }
{ const B=X.dgBake(layouts.defense[0]), fl=allFloor(B);
  ok('outside the grid is solid, and so is a wall cell',X.dgSolid(B,-1,5)&&X.dgSolid(B,5,-1)&&X.dgSolid(B,B.size[0]+1,5)&&X.dgSolid(B,5,B.size[1]+1)&&X.dgSolid(B,0.5,0.5));
  let inWall=0; for(let i=0;i<20000;i++){ const [x,z]=fl[Math.floor(rng()*fl.length)]; if(!X.dgFree(B,x,z,0.6)) continue; const a=rng()*6.283, d=rng()*3, [nx,nz]=X.dgSlide(B,x,z,x+Math.cos(a)*d,z+Math.sin(a)*d,0.6); if(!X.dgFree(B,nx,nz,0.6)) inWall++; }
  ok('sliding along walls never ends inside one (20,000 random moves of up to 3 m, radius 0.6)',inWall===0,inWall+' ended in a wall');
  let sym=true; for(let i=0;i<2000;i++){ const [a,b]=[fl[Math.floor(rng()*fl.length)],fl[Math.floor(rng()*fl.length)]]; if(X.dgLos(B,a[0],a[1],b[0],b[1])!==X.dgLos(B,b[0],b[1],a[0],a[1])) sym=false; }
  const far=fl.reduce((m,c)=>Math.hypot(c[0]-B.start.x,c[1]-B.start.z)>Math.hypot(m[0]-B.start.x,m[1]-B.start.z)?c:m);
  ok('line of sight: you see yourself, it is symmetric, and not through a dungeon\'s whole width of walls',X.dgLos(B,B.start.x,B.start.z,B.start.x,B.start.z)&&sym&&!X.dgLos(B,B.start.x,B.start.z,far[0],far[1])); }

// ---- walking round walls: a walker following the flow field from anywhere reaches the target, also a stout one (0.9 m in the 4 m doors) ----
// (a bigger walker needs wider doors and a clearance-aware field: design doc, section 3; 10 of the 58 monster kinds and all 6 bosses are over 0.9 m)
for(const r of [0.5,0.9]){
  let stuck=0, n=0;
  for(const mi of ['defense','sabotage','hunt']) for(const L of layouts[mi].slice(0,10)){
    const B=X.dgBake(L), fl=allFloor(B).filter(([x,z])=>X.dgFree(B,x,z,r)), goal=B.start, flow=X.dgFlow(B,goal.x,goal.z);
    for(let i=0;i<30;i++){
      let [x,z]=fl[Math.floor(rng()*fl.length)]; n++;
      for(let step=0;step<4000;step++){ if(Math.hypot(x-goal.x,z-goal.z)<1.5) break; const d=X.dgStep(B,flow,x,z); if(!d) break; [x,z]=X.dgSlide(B,x,z,x+d[0]*0.5,z+d[1]*0.5,r); }
      if(Math.hypot(x-goal.x,z-goal.z)>=1.5) stuck++;
    }
  }
  ok('a walker of radius '+r+' m following the flow field reaches the portal from '+n+' random starting points in 30 dungeons',stuck===0,stuck+' got stuck');
}

// ---- the four dungeons, their bosses and the hourly offer (docs/DUNGEON-THEMES.md) ----
const TH=Object.values(X.DG_THEMES).filter(t=>!t.dev), ids=X.MON_DEFS.map(d=>d.id), DEF=Object.fromEntries(X.MON_DEFS.map(d=>[d.id,d]));
const MUSIC=['village','wild1','wild2','wild3','boss15','hanami','vale1','vale2','boss20','boss25','rimehold','hoar1','hoar2','boss26','boss30'];   // the music themes (game/audio/music.js THEMES)
const iVale=ids.indexOf('sakuraslime'), iHoar=ids.indexOf('frostslime'), iGrey=ids.indexOf('granitslime'), landOfDef=id=>{ const i=ids.indexOf(id); return i<0?null:i<iVale?'home':i<iHoar?'vale':i<iGrey?'hoar':'grey'; };
const landOfZone=z=>z.grey?'grey':z.hoar?'hoar':z.vale?'vale':'home';
ok('four dungeons, one for each built land (Wildwood, the Sakura Vale, the Hoarfrost Reach, the Greyspine), level '+X.DG_LV+' at their land\'s base difficulty',TH.length===4&&['home','vale','hoar','grey'].every(l=>TH.filter(t=>t.land===l).length===1)&&TH.every(t=>t.lv===30&&X.DG_LV===30),TH.map(t=>t.id).join(', '));
ok('every dungeon lies under a real zone of its own land',TH.every(t=>{ const z=X.ZONES.find(z=>z.name===t.at); return z&&landOfZone(z)===t.land; }),TH.map(t=>t.at).join(' / '));
ok('every dungeon\'s monsters exist, come from its own land, and the walkers (they make the waves) fit a 4 m door (radius <= 0.9 m); at least 4 kinds of walker; none listed twice',TH.every(t=>{
  const all=[...t.mobs.walkers,...t.mobs.guardians];
  return t.mobs.walkers.length>=4&&new Set(all).size===all.length&&all.every(id=>DEF[id]&&landOfDef(id)===t.land)&&t.mobs.walkers.every(id=>DEF[id].rad<=0.9); }));
ok('the guardians (they stay in their room) are the ones too big for the doors',TH.every(t=>t.mobs.guardians.every(id=>DEF[id].rad>0.9)));
ok('every dungeon has a music track that exists, a palette, a legend and its own tile kit (the art is drawn: not the bare test set)',TH.every(t=>MUSIC.includes(t.music)&&['wall','floor','fog','light'].every(k=>Number.isInteger(t.pal[k]))&&t.tiles!==X.DG_SET_BARE&&t.art===true&&t.legend&&Object.keys(t.legend).length>=5),TH.map(t=>t.id+' '+t.tiles.length+' tiles').join(', '));
ok('every dungeon makes a layout for all seven missions',TH.every(t=>MIS.every(mi=>[1,2,3].every(seed=>!!X.dgLayout({mission:mi,seed,set:t.tiles})))));
// ---- the four dungeons' tile kits (shared/dungeons/themes/<id>.js through defineDungeonTheme; docs/DUNGEON-THEMES.md section 3) ----
ok('the theme registry left nothing out: DG_BAD is empty (each bad theme would be listed here by id and field)',X.DG_BAD.length===0,X.DG_BAD.map(b=>b.id+' '+b.field+': '+b.why).join('; '));
ok('every dungeon\'s legend: one character each, none of # . S O C P B, solid true or false, a prop name; hazards and guardian posts are floor',TH.every(t=>Object.entries(t.legend).every(([ch,e])=>
  ch.length===1&&!'#.SOCPB'.includes(ch)&&typeof e.solid==='boolean'&&typeof e.prop==='string'&&e.prop&&(!(e.hazard||e.post)||!e.solid))),TH.map(t=>t.id+': '+Object.keys(t.legend).join('')).join(', '));
{ const NAMED={hollowroots:['cathedral','sapcellar','fungusalcove','crawlway','heartknot','seednook','burrow'],jadesprings:['basin','bathhall','bamboocellar','steamcorridor','springhead','offering','waterfall'],
    bonefrostbarrow:['burialchamber','cairnroom','urnhall','passagegrave','runecell','gravegoods','barrowdoor'],
    blackseam:['foremansfloor','stope','cartyard','drift','windinghouse','tallyroom','adit']}, ROLE={0:'hall',1:'room',2:'room',3:'pass',4:'site',5:'cache',6:'start'};
  ok('every dungeon draws the tiles its design names (hall, two rooms, pass, site, cache, entrance), each in the role the design gives it',TH.every(t=>NAMED[t.id].every((nm,i)=>t.tiles.some(v=>v.id.split('-')[0]===nm&&v.tags.includes(ROLE[i])))),TH.map(t=>t.id+' '+new Set(t.tiles.map(v=>v.id.split('-')[0])).size+' designs').join(', ')); }
// the test's own reading of a tile (not dgTileProblems): a legend's solid characters are wall, everything else floor
const solidIn=t=>ch=>ch==='#'||!!(t.legend&&t.legend[ch]&&t.legend[ch].solid);
{ const bad=[];
  for(const t of TH){ const sol=solidIn(t), allowed=new Set(['#','.',...'SOCPB',...Object.keys(t.legend)]);
    for(const v of X.dgVariants(t.tiles)){ const a=v.art, tag=t.id+' '+v.id+' rot'+v.rot;
      if(a.length!==DG_TC||a.some(r=>r.length!==DG_TC||[...r].some(ch=>!allowed.has(ch)))){ bad.push(tag+' format'); continue; }
      const mid=i=>i===DG_TC/2-1||i===DG_TC/2;
      for(const [bit,cell] of [[X.DG_N,i=>a[0][i]],[X.DG_S,i=>a[DG_TC-1][i]],[X.DG_W,i=>a[i][0]],[X.DG_E,i=>a[i][DG_TC-1]]]) for(let i=0;i<DG_TC;i++) if(!sol(cell(i))!==(!!(v.doors&bit)&&mid(i))){ bad.push(tag+' door'); break; }
      const fl=[]; for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(!sol(a[z][x])) fl.push(z*DG_TC+x);
      const seen=new Set([fl[0]]), q=[fl[0]]; for(let i=0;i<q.length;i++){ const c=q[i], x=c%DG_TC, z=(c-x)/DG_TC; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, nz=z+dz, k=nz*DG_TC+nx; if(nx>=0&&nz>=0&&nx<DG_TC&&nz<DG_TC&&!sol(a[nz][nx])&&!seen.has(k)){ seen.add(k); q.push(k); } } }
      if(seen.size!==fl.length) bad.push(tag+' floor in pieces');
      if(X.dgTileProblems(v,t.legend).length) bad.push(tag+' '+X.dgTileProblems(v,t.legend)[0]); } }
  ok('every tile of every dungeon in every turn: 24 x 24 cells of the markers and its legend, doors only as the middle two cells of a side (legend solids are wall), one piece of floor, and dgTileProblems agrees',!bad.length,bad.length?bad.slice(0,3).join('; '):TH.map(t=>t.id+' '+X.dgVariants(t.tiles).length+' variants').join(', ')); }
{ const C=DG_TC/2, R=X.DG_BOSS_R/DG_CELL, sets=[{id:'bare',tiles:X.DG_SET_BARE,legend:{}},...TH], bad=[];
  const pillarCells=new Set(); for(const [px,pz] of X.DG_HALL_PILLARS) for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(Math.abs((x+0.5-C)*DG_CELL-px)<X.DG_HALL_PILLAR_HALF&&Math.abs((z+0.5-C)*DG_CELL-pz)<X.DG_HALL_PILLAR_HALF) pillarCells.add(z*DG_TC+x);
  for(const t of sets){ const sol=solidIn(t); for(const v of X.dgVariants(t.tiles).filter(v=>v.tags.includes('hall'))){ let walls=0, wrong=0, b=0;
    for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++){ const d=Math.hypot(x+0.5-C,z+0.5-C), s2=sol(v.art[z][x]); if(d<=R-1&&s2) walls++; if(d<=R&&s2!==pillarCells.has(z*DG_TC+x)) wrong++; if(v.art[z][x]==='B'&&d<=1) b++; }
    if(walls!==16||wrong||b!==1||!X.DG_HALL_MOUTHS.every(([mx,mz])=>v.art[Math.floor(C+mz/DG_CELL)][Math.floor(C+mx/DG_CELL)]==='S')) bad.push(t.id+' '+v.id+' rot'+v.rot+' walls '+walls+' wrong '+wrong); } }
  ok('every hall, the bare set\'s and each dungeon\'s, is the boss circle with its four pillars exactly at DG_HALL_PILLARS (16 cells, where the kits look for cover), the boss spot in the middle and a mouth at each of DG_HALL_MOUTHS',pillarCells.size===16&&!bad.length,bad.slice(0,2).join('; ')); }
ok('the kits\' hall spots fit every hall: Haugbui\'s lamps and Gawataro\'s five vents stand on open floor inside the circle, clear of the pillars',TH.every(t=>{ const L=X.dgLayout({mission:'purge',seed:2,theme:t.id}), B=X.dgBake(L), A=X.dgHallArena(B,100,-50);
  const free=(x,z)=>!A.solid(x,z)&&Math.hypot(x-A.x,z-A.z)<A.r-1.5;
  return X.DG_HALL_LAMPS.every(([lx,lz])=>free(A.x+lx,A.z+lz)&&free(A.x+lx+0.6,A.z+lz+0.6)&&free(A.x+lx-0.6,A.z+lz-0.6))&&[0,1,2,3,4].every(i=>{ const [vx,vz]=X.dgVentAt(A,i); return free(vx,vz); })&&X.DG_HALL_PILLARS.every(([px,pz])=>A.solid(A.x+px,A.z+pz)); }));
{ const bad=[]; let tries=0, n=0;
  for(const t of TH) for(const mi of MIS){ const M=X.DG_MISSIONS[mi];
    for(let s=1;s<=300;s++){ const L=X.dgLayout({mission:mi,seed:s,theme:t.id}); n++; if(!L){ bad.push(t.id+' '+mi+' '+s+' null'); continue; } tries+=L.tries;
      if(L.theme!==t.id||L.legend!==t.legend||L.cells.length<M.rooms[0]||L.cells.length>M.rooms[1]||M.roles.some(R=>roleCount(L,roleOf(R))!==R.n)||roleCount(L,'start')!==1) bad.push(t.id+' '+mi+' '+s); } }
  ok('every dungeon\'s own tile kit makes all seven missions on 300 seeds each (the right size, every role, one entrance, one boss hall)',!bad.length,bad.length?bad.slice(0,3).join('; '):n+' layouts, '+(tries/n).toFixed(2)+' tries on average'); }
{ const bad=[];
  for(const t of TH) for(const mi of MIS) for(let s=1;s<=12;s++){
    const B=X.dgBake(X.dgLayout({mission:mi,seed:s,theme:t.id})), fl=allFloor(B), flow=X.dgFlow(B,B.start.x,B.start.z), tag=t.id+' '+mi+' '+s;
    if(fl.some(([x,z])=>flow[Math.floor(z/DG_CELL)*B.w+Math.floor(x/DG_CELL)]===65535)) bad.push(tag+' floor cut off');
    if(B.marks.P.length!==1||!B.boss||B.boss.r!==X.DG_BOSS_R) bad.push(tag+' portal / boss');
    for(const k of ['S','O','C','P','B']) for(const m of B.marks[k]) if(X.dgSolid(B,m.x,m.z)) bad.push(tag+' marker in a wall');
    let cells=0; for(const c of B.layout.cells) for(const r of c.art) for(const ch of r) if(t.legend[ch]) cells++;
    if(B.props.length!==cells) bad.push(tag+' props '+B.props.length+' of '+cells);
    for(const p of B.props){ const e=Object.values(t.legend).find(e=>e.prop===p.k); if(!e||X.dgSolid(B,p.x,p.z)!==e.solid||(e.hazard||undefined)!==p.hz) { bad.push(tag+' prop '+p.k); break; } }
    if(B.props.some(p=>X.dgLos(B,p.x,p.z,p.x,p.z)===undefined)) bad.push(tag+' los'); }
  ok('baked with a dungeon\'s legend: every legend cell is in B.props {k,x,z} (hazards with hz), solid ones are wall to dgSolid (so to dgFree, dgSlide, dgLos and the flow field) and the rest floor; all floor reachable, one portal, a boss circle, markers on floor',!bad.length,bad.slice(0,3).join('; ')); }
{ const B=X.dgBake(X.dgLayout({mission:'purge',seed:4,theme:'hollowroots'})), pil=B.props.find(p=>p.k==='rootpillar'), hz=B.props.filter(p=>p.hz==='spikes');
  ok('a solid prop blocks like a wall and a floor prop does not: a root pillar stops sight and walkers, root spikes are walked over (and carry their hazard)',!!pil&&X.dgSolid(B,pil.x,pil.z)&&!X.dgFree(B,pil.x,pil.z,0.3)&&!X.dgLos(B,pil.x-3,pil.z,pil.x+3,pil.z)&&hz.length>0&&hz.every(p=>!X.dgSolid(B,p.x,p.z)),hz.length+' spike cells'); }
for(const r of [0.5,0.9]){
  let stuck=0, n=0;
  for(const t of TH) for(const mi of ['defense','sabotage','hunt']) for(let s=1;s<=6;s++){
    const B=X.dgBake(X.dgLayout({mission:mi,seed:s,theme:t.id})), fl=allFloor(B).filter(([x,z])=>X.dgFree(B,x,z,r)), goal=B.start, flow=X.dgFlow(B,goal.x,goal.z);
    for(let i=0;i<25;i++){ let [x,z]=fl[Math.floor(rng()*fl.length)]; n++;
      for(let step=0;step<5000;step++){ if(Math.hypot(x-goal.x,z-goal.z)<1.5) break; const d=X.dgStep(B,flow,x,z); if(!d) break; [x,z]=X.dgSlide(B,x,z,x+d[0]*0.5,z+d[1]*0.5,r); }
      if(Math.hypot(x-goal.x,z-goal.z)>=1.5) stuck++; } }
  ok('a walker of radius '+r+' m following the flow field reaches the portal round every dungeon\'s props and through its doors, from '+n+' random starting points in 54 dungeons',stuck===0,stuck+' got stuck');
}
ok('a dungeon with guardians gives them posts (G) in its rooms or sites; one without guardians has none',TH.every(t=>{ const posts=t.tiles.filter(v=>v.art.some(r=>[...r].some(ch=>t.legend[ch]&&t.legend[ch].post==='guardian'))); return t.mobs.guardians.length?posts.length>0&&posts.every(v=>v.tags.includes('room')||v.tags.includes('site')):posts.length===0; }));
{ const F=loadShared(['defineDungeonTheme','DG_BAD','DG_THEMES','DG_SET_BARE']), warn=console.warn, said=[]; console.warn=m=>said.push(m);
  const good=()=>JSON.parse(JSON.stringify({id:'testcave',name:'Test Cave',land:'home',at:'Ancient Grove',mobs:{walkers:['treant','deathcap','shroom','bogslime'],guardians:[]},boss:'amanita',music:'wild3',
    pal:{wall:1,floor:2,fog:3,light:4},legend:{R:{solid:true,prop:'rock'}},tiles:X.DG_THEMES.hollowroots.tiles.map(v=>({id:v.id,doors:v.doors,tags:v.tags,w:v.w,art:v.art.map(r=>[...r].map(ch=>'#.SOCPB'.includes(ch)?ch:X.DG_THEMES.hollowroots.legend[ch].solid?'#':'.').join(''))}))}));   // the Hollow Roots' kit with its legend drawn as plain wall and floor
  const cases=[['tiles',T=>{ T.tiles[3].art[0]='.'+T.tiles[3].art[0].slice(1); }],['tiles',T=>{ T.tiles[5].art[12]=T.tiles[5].art[12].slice(0,12)+'Q'+T.tiles[5].art[12].slice(13); }],
    ['tiles',T=>{ T.tiles=T.tiles.filter(v=>!v.tags.includes('cache')); }],['tiles',T=>{ const h=T.tiles.find(v=>v.tags.includes('hall')); h.art[12]=h.art[12].slice(0,9)+'#'+h.art[12].slice(10); }],
    ['mobs',T=>{ T.mobs.walkers.push('nosuchmonster'); }],['mobs',T=>{ T.mobs.walkers.push('ancient'); }],['boss',T=>{ T.boss='rootwarden'; }],['at',T=>{ T.at='Nowhere'; }],['legend',T=>{ T.legend['S']={solid:true,prop:'x'}; }],['id',T=>{ T.id='Bad Id'; }]];
  const fine=F.defineDungeonTheme(good()), res=cases.map(([field,f],i)=>{ const T=good(); T.id=T.id==='testcave'?'testcave'+i:T.id; f(T); const n=F.DG_BAD.length, r=F.defineDungeonTheme(T); return r===null&&F.DG_BAD.length===n+1&&F.DG_BAD[n].field===field&&!F.DG_THEMES[T.id]; });
  console.warn=warn;
  ok('a bad theme never stops the game: it is left out, warned about and listed in DG_BAD by id and field (a door off the middle, an unknown character, no cache, a pillar out of place, a missing or oversized walker, an unknown boss or zone, a marker in the legend, a bad id); a good one is taken',
    !!fine&&!!F.DG_THEMES.testcave&&res.every(Boolean)&&said.length===cases.length,res.map((r,i)=>r?'':cases[i][0]+i).filter(Boolean).join(' ')||said.length+' warnings'); }
// ---- the four entrances: real places on the real map ----
{ const E=Object.values(X.DG_ENTRANCES), H=(x,z)=>X.rawHeight(x,z), slope=(x,z,d=2)=>Math.hypot(H(x+d,z)-H(x-d,z),H(x,z+d)-H(x,z-d))/(2*d);
  const zoneName=(x,z)=>{ const q=X.zoneAt(x,z); return q&&q.name; }, landOf=q=>q&&(q.grey?'grey':q.hoar?'hoar':q.vale?'vale':'home');
  const roadD=(x,z)=>{ let m=1e9; for(const rd of X.ROADS) for(let i=1;i<rd.pts.length;i++){ const [ax,az]=rd.pts[i-1],[bx,bz]=rd.pts[i],dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz||1,u=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/L2)); m=Math.min(m,Math.hypot(x-(ax+dx*u),z-(az+dz*u))); } return m; };
  const nearest=(list,x,z,f)=>list.reduce((m,o)=>Math.min(m,f(o,x,z)),1e9);
  ok('one entrance for each of the four dungeons (the dungeon names it, it names the dungeon), at least 300 m apart',E.length===4&&TH.every(t=>E.filter(e=>e.theme===t.id&&X.DG_ENTRANCES[t.id]===e).length===1)&&E.every((a,i)=>E.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.z-b.z)>=300)),E.map(e=>e.name+' ('+e.x+', '+e.z+')').join(', '));
  ok('each stands in its dungeon\'s zone, and the zone holds 25 m all round the door (so it is the right land and not at a zone\'s edge)',E.every(e=>{ const t=X.DG_THEMES[e.theme]; return zoneName(e.x,e.z)===t.at&&landOf(X.zoneAt(e.x,e.z))===t.land&&[0,1,2,3,4,5,6,7].every(k=>zoneName(e.x+Math.sin(k*Math.PI/4)*25,e.z+Math.cos(k*Math.PI/4)*25)===t.at); }));
  ok('the ground: the door at least 2.5 m above the water, the ground rising at least 2 m in the 10 m behind it (a bank to dig into), a flat apron in front (within 2.2 m of the door\'s height, slope <= 0.34 within 4.5 m)',E.every(e=>{
    const ux=Math.sin(e.a), uz=Math.cos(e.a), A=X.dgApron(e); let sm=0; for(let k=0;k<8;k++) for(const r of [2,4.5]) sm=Math.max(sm,slope(A.x+Math.sin(k*Math.PI/4)*r,A.z+Math.cos(k*Math.PI/4)*r));
    return H(e.x,e.z)>=X.WATER+2.5&&H(e.x-ux*10,e.z-uz*10)-H(e.x,e.z)>=2&&Math.abs(H(A.x,A.z)-H(e.x,e.z))<=2.2&&sm<=0.34&&Math.abs(Math.hypot(A.x-e.x,A.z-e.z)-X.DG_APRON)<1e-9; }));
  ok('the node planner\'s keep-out list (shared/professions.js) is the four doors',E.every(e=>X.NODE_KEEPOUT.some(d=>d[0]===e.x&&d[1]===e.z))&&X.NODE_KEEPOUT.length===E.length);
  ok('clear of everything: villages 60 m beyond their walls, arenas 70 m, the tunnel cutting, resource nodes 16 m, story and lore spots 25 m, lakes 25 m, roads 12 m, no zone ridge, no bare ground',E.every(e=>
    X.vDist(e.x,e.z)>=X.VR+60&&X.arenaDist(e.x,e.z)>=70&&!X.inTunnelCut(e.x,e.z,40)&&nearest(X.NODES,e.x,e.z,(n,x,z)=>Math.hypot(n.x-x,n.z-z))>=16&&nearest(X.STORY_SPOTS,e.x,e.z,(s,x,z)=>Math.hypot(s[0]-x,s[1]-z))>=25&&
    nearest([...X.LAKES,...X.FROST_LAKES],e.x,e.z,(L,x,z)=>Math.hypot(L.x-x,L.z-z)-L.r)>=25&&roadD(e.x,e.z)>=12&&X.zoneRidge(e.x,e.z)<0.4&&!X.bareGround(e.x,e.z)));
  { const {loadServer}=require('./load'), camps=loadServer({dev:true},['CAMPS']).x.CAMPS;
    ok('no monster camp within 32 m of a door: keeping camps out of 32 m in server/monsters.js ok() changes none of the world\'s '+camps.length+' camps',E.every(e=>nearest(camps,e.x,e.z,(c,x,z)=>Math.hypot(c.x-x,c.z-z))>=32),E.map(e=>Math.round(nearest(camps,e.x,e.z,(c,x,z)=>Math.hypot(c.x-x,c.z-z)))+' m').join(', ')); }
  ok('the signpost stands on a road (3.5 m off its centre line, toward the door) and a dry route of at most 1.4 times the straight distance leads from it to the apron',E.every(e=>{
    const sg=e.sign, rd=X.roadDist(sg.x,sg.z); if(!(rd>2.5&&rd<4.5)||!X.ROADS.some(r=>r.name===sg.road)) return false;
    const A=X.dgApron(e), cs=4, x0=Math.min(sg.x,A.x)-100, z0=Math.min(sg.z,A.z)-100, W=Math.ceil((Math.abs(sg.x-A.x)+200)/cs), Hh=Math.ceil((Math.abs(sg.z-A.z)+200)/cs), dry=new Uint8Array(W*Hh);
    for(let j=0;j<Hh;j++) for(let i=0;i<W;i++) dry[j*W+i]=H(x0+i*cs,z0+j*cs)>0.2?1:0;
    const cell=(x,z)=>[Math.round((x-x0)/cs),Math.round((z-z0)/cs)], [si,sj]=cell(sg.x,sg.z), [ai,aj]=cell(A.x,A.z), dist=new Float64Array(W*Hh).fill(1e9), todo=[[0,si,sj]]; dist[sj*W+si]=0;
    while(todo.length){ todo.sort((p,q)=>q[0]-p[0]); const [d,i,j]=todo.pop(); if(d>dist[j*W+i]) continue; if(i===ai&&j===aj) break;
      for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){ const ni=i+di,nj=j+dj; if((!di&&!dj)||ni<0||nj<0||ni>=W||nj>=Hh||!dry[nj*W+ni]) continue; const nd=d+Math.hypot(di,dj)*cs; if(nd<dist[nj*W+ni]){ dist[nj*W+ni]=nd; todo.push([nd,ni,nj]); } } }
    return dist[aj*W+ai]<1.4*Math.hypot(sg.x-A.x,sg.z-A.z)+8; }),E.map(e=>e.sign.road).join(', '));
  { const g=(h,v,r,x)=>Object.assign({zt:{home:{on:h[0],max:h[1]},vale:{on:v[0],max:v[1]},hoar:{on:r[0],max:r[1]}}},x||{}), Z=[0,0], go=X.dgGateOpen, T=X.DG_THEMES;
    ok('the door\'s look: Wildwood\'s roots are knotted shut at +0 and open at +1; the Vale\'s door needs Hanami (gear.east 2) and the Reach\'s Rimehold (gear.north 2); for a high-level hiker it says what the entry check says',
      !go(g(Z,Z,Z),T.hollowroots)&&!go(g([0,1],Z,Z),T.hollowroots)&&go(g([1,1],Z,Z),T.hollowroots)&&!go(g(Z,Z,Z,{east:1}),T.jadesprings)&&go(g(Z,Z,Z,{east:2}),T.jadesprings)&&!go(g(Z,Z,Z,{north:1}),T.bonefrostbarrow)&&go(g(Z,Z,Z,{north:2}),T.bonefrostbarrow)&&
      [g(Z,Z,Z),g([1,1],Z,Z),g(Z,Z,Z,{east:2}),g(Z,[1,1],Z,{east:2}),g(Z,Z,Z,{north:2}),g([0,3],Z,Z)].every(gear=>['hollowroots','jadesprings','bonefrostbarrow'].every(id=>go(gear,T[id])===X.dgUnlocked(gear,60,T[id]).ok))); }
  ok('the talk key works within '+X.DG_ENT_TALK+' m of a door only, and the apron is '+X.DG_APRON+' m in front of it',E.every(e=>{ const A=X.dgApron(e); return X.dgEntranceNear(e.x+0.5,e.z)===e&&X.dgEntranceNear(e.x,e.z+X.DG_ENT_TALK-0.1)===e&&X.dgEntranceNear(e.x+X.DG_ENT_TALK+1.5,e.z)===null&&X.dgEntranceNear(e.x,e.z,X.DG_APRON+1)===e&&Math.abs(Math.hypot(A.x-e.x,A.z-e.z)-X.DG_APRON)<1e-9; })); }

// the primitives a move may be made of: the telegraph kinds (the circle kinds include the dungeon bosses' own looks: spore puff pulse vent wail snuff, drawn by game/combat/boss.js,
// resolved as circles by server/boss-fx.js), zones, waves, orbs, effects on players, summons, a glide, modes, stuns and casts
const BS=Object.values(X.DG_BOSSES), KNOWN=new Set(['tele:circle','tele:root','tele:slam','tele:icefall','tele:geyser','tele:gust','tele:spore','tele:puff','tele:pulse','tele:vent','tele:wail','tele:snuff','tele:cleave','tele:breath','tele:line','tele:donut','tele:mark','tele:prison','tele:blast','tele:rockfall',
  'zone:ember','zone:whirl','zone:whiteout','zone:blizzard','wall','orb','pfx:root','pfx:slow','pfx:push','adds','props','move','mode:hidden','mode:shielded','mode:airborne','stun','cast']);
const PALKEYS={shroom:['cap','spot','stem','gill','feet','spirit'],goblin:['form','skin','eyes','top','topColor','bottom','bottomColor','hat','hatColor','club','horns','weapon','fur','embers','shell'],wisp:['body','core','eye','hair','ghost'],totem:['crystal','band'],keg:['wood','band','fuse']};
ok('four new bosses, one for each dungeon, each used once: the dungeon names its boss and the boss names its dungeon (no more random draw)',BS.length===4&&TH.every(t=>BS.filter(b=>b.id===t.boss&&b.dungeon===t.id).length===1)&&new Set(TH.map(t=>t.boss)).size===4,TH.map(t=>t.id+' -> '+t.boss).join(', '));
ok('the bosses are new (their ids, and their adds\' and props\', are in no def), are built from a model and element the game has, with pal flags that model reads, a music track that exists, and fit the hall',BS.every(b=>{
  const ids=[b.id,b.add.id,...(b.prop?[b.prop.id]:[])], used=new Set(X.ALL_MON_DEFS.map(d=>d.id));
  const palOk=(model,pal)=>Object.keys(pal).every(k=>(PALKEYS[model]||[]).includes(k));
  return ids.every(i=>!used.has(i))&&new Set(ids).size===ids.length&&X.FAM[b.model]&&X.ELEMS[b.el]&&b.el!=='basic'&&palOk(b.model,b.pal)&&palOk(b.add.model||b.model,b.add.pal)&&(!b.prop||palOk(b.prop.model||b.model,b.prop.pal))&&
    MUSIC.includes(b.music)&&b.lv===X.DG_LV&&X.FAM[b.model].rad*b.scale>=1&&X.FAM[b.model].rad*b.scale<=X.DG_BOSS_R/5&&b.speed>0&&b.atk>0&&typeof b.bar.stun==='string'; }),BS.map(b=>b.id+': radius '+(((X.FAM[b.model]||{rad:0}).rad)*b.scale).toFixed(2)+' m').join(', '));
ok('every boss has at least 5 moves in all three phases, each made of primitives the bosses already use or declared as new in its `needs` (and every need is used), exactly one signature move, no move id repeated',BS.every(b=>
  b.moves.length>=5&&[1,2,3].every(ph=>b.moves.some(m=>m.phase===ph))&&b.moves.every(m=>m.does.every(tok=>KNOWN.has(tok)||(tok.startsWith('new:')&&b.needs.includes(tok))))&&
  b.needs.every(n=>b.moves.some(m=>m.does.includes(n)))&&b.moves.filter(m=>m.signature).length===1)&&new Set(BS.flatMap(b=>b.moves.map(m=>m.id))).size===BS.reduce((n,b)=>n+b.moves.length,0));
ok('the four are different: three model families (Garrick is a troll of the goblin family, Gawataro an elder), four elements, four kits, four signatures',new Set(BS.map(b=>b.model)).size===3&&new Set(BS.map(b=>b.model+':'+(b.pal.form||''))).size===4&&new Set(BS.map(b=>b.el)).size===4&&new Set(BS.map(b=>b.kit)).size===4&&new Set(BS.map(b=>b.moves.find(m=>m.signature).id)).size===4);
// the bosses' data against their code: the rows makeBossS takes, the kits (server/dungeons/boss-kits.js), what implements each new primitive, and what the client draws
{ const fs=require('fs'), path=require('path'), {SRC,manifest,loadServer}=require('./load'), SV=loadServer({dev:true},['BOSS_KITS','DG_BOSS_NEEDS']).x;
  const game=manifest().game.filter(f=>f!=='@shared').map(f=>fs.readFileSync(path.join(SRC,'game',f),'utf8')).join('\n'), cb=fs.readFileSync(path.join(SRC,'game/combat/boss.js'),'utf8'), cz=fs.readFileSync(path.join(SRC,'game/combat/boss-fx.js'),'utf8');
  const tele=new Set((cb.match(/const TELE_COL=\{([\s\S]*?)\};/)[1].match(/\w+(?=:0x)/g)||[])), zone=new Set((cz.match(/const ZONE_COL=\{([\s\S]*?)\};/)[1].match(/\w+(?=:0x)/g)||[]));
  ok('DG_BOSSES and DG_BOSS_DEFS agree (each design is a row for makeBossS: the def, its kit, add, prop, name, bar and music) and every kit is registered with start, tick and phase',
    Object.keys(X.DG_BOSS_DEFS).length===4&&BS.every(b=>{ const r=X.DG_BOSS_DEFS[b.id], K=SV.BOSS_KITS[b.kit];
      return r&&r.def.id===b.id&&r.def.boss&&r.def.level===b.lv&&r.kit===b.kit&&r.add.id===b.add.id&&(b.prop?r.prop&&r.prop.id===b.prop.id:!r.prop)&&r.short===b.short&&r.bar===b.bar&&r.def.music===b.music&&r.dungeon===b.dungeon&&K&&['start','tick','phase'].every(f=>typeof K[f]==='function'); }));
  ok('every new primitive a boss needs is implemented (DG_BOSS_NEEDS: a server function, or a client function the page defines) and no implemented need is unused',BS.every(b=>b.needs.every(n=>{ const v=SV.DG_BOSS_NEEDS[n];
      return typeof v==='function'||(typeof v==='string'&&/^client:\w+$/.test(v)&&new RegExp('function '+v.slice(7)+'\\(').test(game)); }))&&Object.keys(SV.DG_BOSS_NEEDS).every(n=>BS.some(b=>b.needs.includes(n))),Object.keys(SV.DG_BOSS_NEEDS).join(' '));
  ok('every telegraph and zone the dungeon bosses use has a look on the client (TELE_COL in game/combat/boss.js, ZONE_COL in game/combat/boss-fx.js), and their own circle kinds are no world boss\'s',
    BS.every(b=>b.moves.every(m=>m.does.every(t=>t.startsWith('tele:')?tele.has(t.slice(5)):t.startsWith('zone:')?zone.has(t.slice(5)):true)))&&zone.has('spore')&&['spore','puff','pulse','vent','wail','snuff'].every(k=>tele.has(k)),[...tele].join(' ')); }
// the hourly offer: two different mission types, changing at the top of every hour, the same for everyone
{ const H=X.DG_OFFER_HOUR, T0=Date.UTC(2026,9,3,0,0,0), P=MIS.length*(MIS.length-1)/2, off=(id,h)=>X.dgOffer(id,T0+h*H), key=a=>a.join('+');
  ok('a dungeon offers two different mission types of the seven, the same all hour long, and the same for everyone who asks',TH.every(t=>[0,1,2,3,50,999].every(h=>{ const a=off(t.id,h), b=X.dgOffer(t.id,T0+h*H+H-1); return a.length===2&&a[0]!==a[1]&&a.every(m=>MIS.includes(m))&&key(a)===key(b)&&key(a)===key(X.dgOffer(t.id,T0+h*H)); })));
  ok('it changes at the top of the hour, and is never the same two hours running (also across the 21-hour cycles), for 3 dungeons over 3,000 hours',TH.every(t=>{ for(let h=1;h<3000;h++) if(key(off(t.id,h))===key(off(t.id,h-1))) return false; return true; }));
  ok('every one of the '+P+' pairs comes up exactly once in each '+P+'-hour cycle (fair: a type is not starved), whichever cycle',TH.every(t=>[0,1,7,40,500].every(c=>{ const seen=new Set(); for(let i=0;i<P;i++) seen.add(key(X.dgOffer(t.id,(c*P+i)*H).slice().sort())); return seen.size===P; })));
  ok('each dungeon has its own order (they offer the same pair only now and then), and every type is offered by each of them in a day',(()=>{ const [a,b]=TH; let same=0; for(let h=0;h<500;h++) if(key(off(a.id,h))===key(off(b.id,h))) same++; return same<125; })()&&TH.every(t=>{ const seen=new Set(); for(let h=0;h<24;h++) off(t.id,h).forEach(m=>seen.add(m)); return seen.size===7; }));
  ok('the board can show a countdown: 3,600 s at the top of the hour, 1 s a millisecond before the next',X.dgOfferLeft(T0+5*H)===3600&&X.dgOfferLeft(T0+5*H+H-1)===1&&X.dgOfferLeft(T0+5*H+1800000)===1800);
  ok('a pool of fewer types still works (the missions built so far): 2 types are always offered together',key(X.dgOffer('x',T0,['purge','defense']))==='purge+defense'&&X.dgOffer('x',T0,['purge','defense','survival']).length===2); }
{ const home=TH.filter(t=>t.land==='home'), vale=TH.filter(t=>t.land==='vale'), hoar=TH.filter(t=>t.land==='hoar'), un=(g,lv,t,tier)=>X.dgUnlocked(g,lv,t,tier);
  const gear=(h,v,r,extra)=>Object.assign({zt:{home:{on:h[0],max:h[1]},vale:{on:v[0],max:v[1]},hoar:{on:r[0],max:r[1]}}},extra||{}), Z=[0,0];
  ok('Wildwood\'s dungeons are locked at +0 (even with +1 unlocked, whatever the level) and open at +1, level '+X.DG_LV+', the difficulty being the one you play Wildwood at',home.every(t=>
    !un(gear(Z,Z,Z),50,t).ok&&!un(gear([0,1],Z,Z),50,t).ok&&!un(gear([0,3],Z,Z),50,t).ok&&/\+1 difficulty/.test(un(gear([0,1],Z,Z),50,t).why)&&
    un(gear([1,1],Z,Z),25,t).ok&&un(gear([1,1],Z,Z),25,t).level===30&&un(gear([1,1],Z,Z),25,t).tier===1&&X.dgTierOf(gear([1,1],Z,Z),'home')===1));
  ok('the Vale\'s and the Reach\'s dungeons are level '+X.DG_LV+' at their base, +0 (no tier needed)',[...vale,...hoar].every(t=>{ const g=gear(Z,Z,Z,{east:2,north:2}), r=un(g,25,t); return r.ok&&r.level===30&&r.tier===0; }));
  ok('each tier above the base adds '+X.ZTIER_STEP+' levels, up to tier V: Wildwood +1 ... +5 = 30/40/50/60/70, the Vale and the Reach +0 ... +5 = 30/40/50/60/70/80',
    X.ZTIER_MAX===5&&home.every(t=>[1,2,3,4,5].map(k=>X.dgLevel(t,k)).join()==='30,40,50,60,70')&&[...vale,...hoar].every(t=>[0,1,2,3,4,5].map(k=>X.dgLevel(t,k)).join()==='30,40,50,60,70,80'));
  ok('the way in is level '+X.DG_ENTRY_LV+' at every difficulty, whatever the dungeon\'s own level: Wildwood +1 ... +5 (levels 30-70) and the Vale and the Reach +0 ... +5 (30-80) all open at 25 and not at 24',
    home.every(t=>[1,2,3,4,5].every(k=>!un(gear([k,k],Z,Z),24,t).ok&&un(gear([k,k],Z,Z),25,t).ok&&un(gear([k,k],Z,Z),25,t).level===X.dgLevel(t,k)&&/level 25/.test(un(gear([k,k],Z,Z),10,t).why)))&&
    vale.every(t=>[0,1,2,3,4,5].every(k=>!un(gear(Z,[k,k],Z,{east:2}),24,t).ok&&un(gear(Z,[k,k],Z,{east:2}),25,t).ok&&un(gear(Z,[k,k],Z,{east:2}),25,t).level===X.dgLevel(t,k)))&&
    hoar.every(t=>[0,3,5].every(k=>!un(gear(Z,Z,[k,k],{north:2}),24,t).ok&&un(gear(Z,Z,[k,k],{north:2}),25,t).ok&&un(gear(Z,Z,[k,k],{north:2}),25,t).level===X.dgLevel(t,k))));
  ok('the Vale\'s dungeons need Hanami walked into (gear.east 2) and the Reach\'s Rimehold (gear.north 2); each land uses its own tier, not Wildwood\'s',
    vale.every(t=>!un(gear(Z,Z,Z,{east:1}),30,t).ok&&un(gear(Z,Z,Z,{east:2}),30,t).ok&&un(gear([3,3],Z,Z,{east:2}),30,t).tier===0)&&
    hoar.every(t=>!un(gear(Z,Z,Z,{north:1}),30,t).ok&&un(gear(Z,Z,Z,{north:2}),30,t).ok&&!un(gear(Z,Z,Z,{east:2}),30,t).ok));
  ok('a party plays at its leader\'s tier: a member needs that tier unlocked (not played) and level 25',vale.every(t=>{ const m=gear(Z,[1,1],Z,{east:2}); return un(m,25,t,1).ok&&!un(gear(Z,Z,Z,{east:2}),60,t,1).ok&&/not unlocked \+1/.test(un(gear(Z,Z,Z,{east:2}),60,t,1).why)&&!un(m,24,t,1).ok; })&&
    home.every(t=>un(gear([0,2],Z,Z),40,t,2).ok&&!un(gear([0,2],Z,Z),40,t,0).ok)); }


// ---- party size ----
ok('one hiker is the baseline (x1 health, x1 groups, x1 objective), and a head count is clamped to 1-'+X.DG_MAX_PARTY,JSON.stringify(X.dgParty(1))==='{"hp":1,"count":1,"obj":1}'&&X.dgParty(0).hp===1&&X.dgParty(NaN).hp===1&&X.dgParty(9).hp===X.dgParty(4).hp);
ok('every extra player makes monsters tougher (health never goes down with the head count)',[2,3,4].every(n=>X.dgParty(n).hp>X.dgParty(n-1).hp));
ok('a party\'s fight with one monster lasts 1 to 1.3 times a solo fight (never faster, never a slog)',[2,3,4].every(n=>X.dgFightRatio(n)>=1&&X.dgFightRatio(n)<=1.3),[2,3,4].map(n=>n+': x'+X.dgFightRatio(n).toFixed(2)).join(', '));

// ---- rewards (shared/dungeon-rewards.js) ----
const R=loadShared(['DG_THEMES','DG_REWARDS','DG_REWARD_W','DG_GEAR_LV','DG_TIER','DG_ATK','DG_HP','DG_DEF','RING_ELS','RING_ATK','ENH_MAX','ENH_STEP','ENH_LV','ENH_DROP','dgRewardRarity','dgParse','dgItem','dgClearReward','dgAllIds','ringAtk','dgEnhanceNext','dgEnhanceStones','dgEnhanceTotal','dgDropKind','dgRollStone','dgGearId','dgRingId','dgPendantId','PENDANT_STATS',
  'ITEM','ITEM_LIST','TIERS','tierFor','TIER_ATK','ARMOR_HP','ARMOR_DEF','RAR_MULT','WEAPON_SLOTS','ARMOR_SLOTS','ALL_SLOTS','CLASS_OF','ELEM_LIST','ELEMS','TOOL_LIST','rollMonsterRarity']);
const mulberry=a=>()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
const within=(obs,n,p)=>Math.abs(obs-n*p)<=4*Math.sqrt(n*p*(1-p))+1;   // 4 sigma
const ODDS=[0.7,0.25,0.04,0.008,0.002];   // the owner's table, written out here so a change to the code's own table cannot hide
const RT=Object.values(R.DG_THEMES).filter(t=>!t.dev), RKINDS={home:'weapon',vale:'armor',hoar:'ring',grey:'pendant'};
ok('each of the four dungeons pays one kind of reward: Wildwood weapons, the Vale armour, the Reach rings, the Greyspine pendants (a reward for every theme and no other)',
  RT.length===4&&RT.every(t=>R.DG_REWARDS[t.id]&&R.DG_REWARDS[t.id].kind===RKINDS[t.land])&&Object.keys(R.DG_REWARDS).length===4);
{ const P=id=>R.DG_REWARDS[id].pool;
  ok('the pools are "all kinds": the weapons of all three classes, the four armour pieces, 7 rings (no element and the six elements) and the 5 pendants',
    P('hollowroots').join()===R.WEAPON_SLOTS.join()&&new Set(P('hollowroots').map(s=>R.CLASS_OF[s])).size===3&&P('jadesprings').join()===R.ARMOR_SLOTS.join()&&
    P('bonefrostbarrow').length===7&&new Set(P('bonefrostbarrow')).size===7&&P('bonefrostbarrow')[0]==='basic'&&R.ELEM_LIST.length===6&&R.ELEM_LIST.every(e=>P('bonefrostbarrow').includes(e)&&R.ELEMS[e])&&P('blackseam').join()===R.PENDANT_STATS.join()&&P('blackseam').length===5); }
{ const B=[0,0.6999,0.70,0.9499,0.95,0.9899,0.99,0.9979,0.998,0.99999].map(R.dgRewardRarity).join();
  ok('the rarity of a clear is 70 / 25 / 4 / 0.8 / 0.2% (the table adds up to 100% and every boundary falls in the right rarity)',R.DG_REWARD_W.reduce((a,b)=>a+b,0)===1000&&B==='0,0,1,1,2,2,3,3,4,4',B); }
{ const N=200000, rnd=mulberry(7), cnt=[0,0,0,0,0]; for(let i=0;i<N;i++) cnt[R.dgRewardRarity(rnd())]++;
  ok('over '+N+' rolls the rarities come out at their odds (within 4 sigma)',cnt.every((c,r)=>within(c,N,ODDS[r])),cnt.map(c=>(c/N*100).toFixed(2)+'%').join(' / ')); }
{ const rnd=mulberry(11), N=60000, bad=[];
  for(const t of RT){ const K=R.DG_REWARDS[t.id], seen={}, rar=[0,0,0,0,0];
    for(let i=0;i<N;i++){ const id=R.dgClearReward(t.id,rnd), it=R.dgItem(id);
      if(!it||it.kind!==K.kind||it.n!==0||it.lv!==30){ bad.push(t.id+' '+id); break; } const key=it.el||it.stat||it.slot; seen[key]=(seen[key]||0)+1; rar[it.rar]++; }
    if(!K.pool.every(s=>within(seen[s]||0,N,1/K.pool.length))) bad.push(t.id+' pool not uniform '+JSON.stringify(seen));
    if(!rar.every((c,r)=>within(c,N,ODDS[r]))) bad.push(t.id+' rarity '+rar); }
  ok('a clear pays one fresh (+0) level-30 item of the dungeon\'s kind: every piece of the pool comes up equally often, at the table\'s rarities',!bad.length&&R.dgClearReward('bare')===null&&R.dgClearReward('nope')===null,bad.join('; ')); }
{ const bad=[], all=R.dgAllIds(), ids=new Set(all);
  ok('the ids are a list of strings a save can keep: 19 kinds (7 pieces, 7 rings, 5 pendants) x 35 (rarity, enhancement) = 665, unique, each parses and rebuilds itself',all.length===665&&ids.size===665&&all.every(id=>{ const q=R.dgParse(id), it=R.dgItem(id);
    return q&&it&&it.id===id&&(q.el?R.dgRingId(q.el,q.rar,q.n):q.stat?R.dgPendantId(q.stat,q.rar,q.n):R.dgGearId(q.slot,q.rar,q.n))===id; }));
  const no=['sword7+3','sword7-l+11','sword7-e+7','sword7-u+9','sword7+0','sword7+01','sword6','sword7-x','ring-fire-x','ring-fire+','ring-wind','ring-fire-l+11','shoes7-r+5','sword','ring','','sword7 ','Sword7'], yes=['sword7','sword7+2','sword7-r+4','sword7-e+6','sword7-u+8','ring-dark-l+10','ring-basic','top7-u+6'];
  ok('an id past its rarity\'s limit, or one that is not a level-30 piece, does not parse (limits 2 / 4 / 6 / 8 / 10)',no.every(id=>R.dgParse(id)===null)&&yes.every(id=>R.dgParse(id))&&R.ENH_MAX.join()==='2,4,6,8,10'); }
ok('the level-30 gear is a tier of its own: its 490 ids are ITEM records (shared/dungeon-items.js) but in neither ITEM_LIST nor TOOL_LIST, so shops, tools, drops and the six tiers are untouched (tierFor stops at the old top tier)',
  R.TIERS===6&&R.ITEM_LIST.length===210&&R.tierFor(30)===5&&R.tierFor(50)===5&&R.TOOL_LIST.length===90&&R.dgAllIds().every(id=>R.ITEM[id]&&R.ITEM[id].dg&&!R.ITEM_LIST.includes(R.ITEM[id])&&!R.TOOL_LIST.includes(R.ITEM[id]))&&R.DG_TIER===R.TIERS);
{ const bad=[], ratio=(a,b)=>a/b;
  for(const s of R.WEAPON_SLOTS) for(let r=0;r<5;r++){ const a=R.dgItem(R.dgGearId(s,r,0)), b=R.ITEM[s+'6'+(r?'-'+['','r','e','u','l'][r]:'')]; if(!(a.atk>b.atk)) bad.push(s+r+' atk'); }
  for(const s of R.ARMOR_SLOTS) for(let r=0;r<5;r++){ const a=R.dgItem(R.dgGearId(s,r,0)), b=R.ITEM[s+'6'+(r?'-'+['','r','e','u','l'][r]:'')]; if(!(a.hp>b.hp&&a.def>b.def)) bad.push(s+r+' hp/def'); }
  const stepRatio=ratio(R.DG_ATK,R.TIER_ATK[5]), prev=ratio(R.TIER_ATK[5],R.TIER_ATK[4]);
  ok('a level-30 piece beats the level-25 piece of the same rarity in every stat, and the step is smaller than the last one (the curve flattens: weapon x'+stepRatio.toFixed(2)+' after x'+prev.toFixed(2)+')',
    !bad.length&&stepRatio>1.2&&stepRatio<prev&&R.ARMOR_SLOTS.every(s=>R.DG_HP[s]/R.ARMOR_HP[s][5]>1.2&&R.DG_HP[s]/R.ARMOR_HP[s][5]<R.ARMOR_HP[s][5]/R.ARMOR_HP[s][4]),bad.join(', ')); }
{ const bad=[];
  for(let r=0;r<5;r++){ const M=R.ENH_MAX[r]; let id=R.dgGearId('sword',r,0), last=R.dgItem(id), steps=0, stones=0;
    for(;;){ const nx=R.dgEnhanceNext(id); if(!nx) break; stones+=R.dgEnhanceStones(id); id=nx; steps++; const it=R.dgItem(id); if(!(it.atk>last.atk)) bad.push('atk r'+r+' step '+steps); last=it; }
    if(steps!==M||stones!==R.dgEnhanceTotal(r)||R.dgEnhanceStones(id)!==0) bad.push('r'+r+' steps '+steps+' stones '+stones);
    const base=R.dgItem(R.dgGearId('sword',r,0)).atk, top=R.dgItem(R.dgGearId('sword',r,M)).atk;
    if(Math.abs(top-base*(1+R.ENH_STEP*M))>1.5) bad.push('r'+r+' top '+top+' vs '+base*(1+R.ENH_STEP*M));
    for(const s of R.ARMOR_SLOTS){ let p=R.dgItem(R.dgGearId(s,r,0)); for(let n=1;n<=M;n++){ const q=R.dgItem(R.dgGearId(s,r,n)); if(!(q.hp>p.hp&&q.def>=p.def)) bad.push(s+r+' +'+n); p=q; } }
    for(const e of R.RING_ELS){ let p=R.dgItem(R.dgRingId(e,r,0)); for(let n=1;n<=M;n++){ const q=R.dgItem(R.dgRingId(e,r,n)); if(!(q.ratk>p.ratk)) bad.push(e+r+' +'+n); p=q; } } }
  const tot=[0,1,2,3,4].map(R.dgEnhanceTotal), kills=tot.map(t=>Math.round(t/R.ENH_DROP));
  ok('enhancing walks from +0 to 2 / 4 / 6 / 8 / 10 and stops: the step to +n costs n stones ('+tot.join(' / ')+' to the limit = about '+kills.join(' / ')+' kills at '+R.ENH_DROP*100+'%), and every step raises weapons, armour and rings (the top is +'+Math.round(R.ENH_STEP*R.ENH_MAX[4]*100)+'% for a legendary)',
    !bad.length&&tot.join()==='3,10,21,36,55',bad.join('; ')); }
{ const e=R.RING_ELS, souls=['basic',...R.ELEM_LIST], bad=[];
  for(const el of e) for(const so of souls){ const b=R.ringAtk(R.dgRingId(el,0,0),so); if((b>0)!==(el===so)||(el===so&&b!==R.RING_ATK)) bad.push(el+' ring, '+so+' soul = '+b); }
  const byRar=[0,1,2,3,4].map(r=>R.ringAtk(R.dgRingId('fire',r,0),'fire')), enh=R.ringAtk(R.dgRingId('fire',4,10),'fire');
  ok('a ring adds its flat attack only when its element is the soul\'s (7 rings x 7 souls: only the matching one pays the full RING_ATK; none for the opposite soul)',!bad.length&&R.ringAtk(R.dgRingId('fire',0,0),'water')===0&&R.RING_ATK===20,bad.join('; '));
  ok('the flat attack is 20 / 26 / 34 / 44 / 60 by rarity (RING_ATK x RAR_MULT), is the ring\'s own (no weapon in it) and grows with enhancement (a legendary +10 gives 120), and a hiker with no soul (undefined) counts as basic',
    byRar.join()==='20,26,34,44,60'&&enh===120&&R.ringAtk(R.dgRingId('basic',0,0))===20&&R.ringAtk('sword7','fire')===0&&R.ringAtk(null,'fire')===0&&R.dgItem(R.dgRingId('fire',0,0)).atk===undefined,byRar.join('/')+' '+enh); }
{ const real=Math.random, N=200000, rnd=mulberry(5); let a,b;
  Math.random=()=>R.ENH_DROP-1e-9; a=R.rollMonsterRarity(); Math.random=()=>R.ENH_DROP; b=R.rollMonsterRarity(); Math.random=real;
  ok('the stone\'s chance is exactly the equipment chance it replaces (2.6%: just under it a monster drops equipment, at it nothing)',a>=0&&b===-1&&R.ENH_DROP===0.026);
  let lv30=0, lv29=0, boss=0, lv31=0; for(let i=0;i<N;i++){ lv30+=R.dgRollStone(30,false,rnd); lv29+=R.dgRollStone(29,false,rnd); boss+=R.dgRollStone(30,true,rnd); lv31+=R.dgRollStone(31,false,rnd); }
  ok('only normal monsters of level '+R.ENH_LV+' and above drop the stone, at the level you fight them at (a level-1 slime at tier III is 31): below 30 and every boss keep rolling equipment',
    R.dgDropKind(29,false)==='equipment'&&R.dgDropKind(30,false)==='stone'&&R.dgDropKind(31,false)==='stone'&&R.dgDropKind(30,true)==='equipment'&&R.dgDropKind(60,true)==='equipment'&&lv29===0&&boss===0&&within(lv30,N,R.ENH_DROP)&&within(lv31,N,R.ENH_DROP),
    'lv30 '+(lv30/N*100).toFixed(2)+'%, lv29 '+lv29+', boss '+boss); }

console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
