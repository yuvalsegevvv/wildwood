// Headless test of the dungeon setup (shared/dungeons.js), straight from src/, no build, no server: the map tiles (every tile in every turn: doors match the art; the round
// hall is a boss arena's circle), the seeded layout generator (connected, reciprocal doors, one-door entrance, the roles each mission asks for, a boss hall in every
// dungeon, same seed = same dungeon), the baked grid (collision, line of sight, the flow field walkers follow round walls), and the party-size table. One line per check.
// Usage: node tools/dungeons-smoke.js            the checks
//        node tools/dungeons-smoke.js --show defense 7   draws that dungeon (the tile graph, then the cells: one character per 2 x 2 cells)
const {loadShared}=require('./load');
const X=loadShared(['DG_CELL','DG_TC','DG_BOSS_R','ARENAS','DG_N','DG_E','DG_S','DG_W','DG_STEP','DG_SET_BARE','DG_MISSIONS','DG_PARTY','DG_MAX_PARTY','dgVariants','dgRotArt','dgRotMask','dgOpp','dgLayout','dgBake','dgSolid','dgFree','dgSlide','dgLos','dgFlow','dgStep','dgParty','dgFightRatio','mulberry32']);
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

// ---- party size ----
ok('one hiker is the baseline (x1 health, x1 groups, x1 objective), and a head count is clamped to 1-'+X.DG_MAX_PARTY,JSON.stringify(X.dgParty(1))==='{"hp":1,"count":1,"obj":1}'&&X.dgParty(0).hp===1&&X.dgParty(NaN).hp===1&&X.dgParty(9).hp===X.dgParty(4).hp);
ok('every extra player makes monsters tougher (health never goes down with the head count)',[2,3,4].every(n=>X.dgParty(n).hp>X.dgParty(n-1).hp));
ok('a party\'s fight with one monster lasts 1 to 1.3 times a solo fight (never faster, never a slog)',[2,3,4].every(n=>X.dgFightRatio(n)>=1&&X.dgFightRatio(n)<=1.3),[2,3,4].map(n=>n+': x'+X.dgFightRatio(n).toFixed(2)).join(', '));

console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
