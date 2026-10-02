//@ Dungeons, setup only (nothing calls it yet): map tiles, the seeded layout generator, the baked collision grid with line of sight and a flow field, the mission list (every mission ends with a boss in a round hall the size of a boss arena), party-size scaling. Pure.
/* Design: docs/DUNGEONS.md. A dungeon is a grid of map tiles (a room is authored as 24 x 24 cells of 2 m, so DG_TILE = 48 m a side: big enough for a boss's circle) joined
   by doors in the middle of their sides. dgLayout picks which tile goes where from a seed, so the server and every client build the same dungeon from {mission, seed,
   theme} and no layout is ever sent; dgBake turns it into the cell grid that both sides collide against and the server's monsters walk on. Nothing here touches the
   world (no terrain, no players, no state): the wiring is the build order in the design doc.
   A tile's art is 24 strings of 24 characters: '#' wall, '.' floor, and markers that are floor too: S a monster mouth, O an objective, C a cache, P the portal, B the
   middle of a boss hall (where the boss appears). */
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
/* the test set: bare rooms only to prove the machinery, not a dungeon. The hall is a round room of a boss arena's radius (DG_BOSS_R / DG_CELL = 10 cells) with four pillars
   for cover and the boss's spot in the middle. A real theme lists hand-authored tiles the same way ({id,doors,tags,w,art}), see the design doc. */
const DG_SET_BARE=[
  ...dgKind('pass',['pass'],3,[4,4],[],null,DG_ALL_SHAPES),
  ...dgKind('room',['room'],3,[12,12],[['S',-3,-3],['S',2,2]],null,DG_ALL_SHAPES),
  ...dgKind('hall',['hall'],1,DG_BOSS_R/DG_CELL,[['B',0,0],['S',-7,-7],['S',6,-7],['S',-7,6],['S',6,6]],[[-5,-5],[4,-5],[-5,4],[4,4]],DG_ALL_SHAPES),
  ...dgKind('start',['start'],1,[8,8],[['P',0,0]],null,['dead']),
  ...dgKind('site',['site'],1,[10,10],[['O',0,0]],null,DG_ALL_SHAPES),
  ...dgKind('cache',['cache'],1,[8,8],[['C',0,0]],null,['dead'])];
const DG_THEMES={bare:{name:'Bare test set',tiles:DG_SET_BARE,dev:true}};   // a real theme adds its monsters, palette, music and boss here (design doc, section 3)
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
function dgLayout(o){
  const M=Object.assign({},DG_MISSIONS[o.mission]||{},o.over||{}), V=dgVariantsOf(o.set||DG_SET_BARE), rng=mulberry32((o.seed|0)^0x5bd1e995);
  for(let a=0;a<80;a++){ const L=dgTry(M,V,rng); if(L){ L.seed=o.seed|0; L.mission=o.mission; L.tries=a+1; return L; } }
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
// the baked dungeon: one floor cell grid over the whole layout (metres from its north-west corner) and every marker's place. Used by both sides.
function dgBake(L){
  const W=L.gw*DG_TC, H=L.gh*DG_TC, cells=new Uint8Array(W*H), marks={S:[],O:[],C:[],P:[],B:[]};
  for(const t of L.cells) for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++){
    const ch=t.art[z][x]; if(ch==='#') continue;
    const gx=t.x*DG_TC+x, gz=t.z*DG_TC+z; cells[gz*W+gx]=1;
    if(marks[ch]) marks[ch].push({x:(gx+0.5)*DG_CELL,z:(gz+0.5)*DG_CELL,tile:[t.x,t.z],role:t.role});
  }
  const bm=marks.B.find(m=>m.role==='boss'), boss=bm&&{x:(bm.tile[0]*DG_TC+DG_TC/2)*DG_CELL,z:(bm.tile[1]*DG_TC+DG_TC/2)*DG_CELL,r:DG_BOSS_R};   // boss: the hall's circle, shaped like a boss arena {x,z,r}
  return {w:W,h:H,cells,marks,size:[W*DG_CELL,H*DG_CELL],start:marks.P[0],boss,layout:L};
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
