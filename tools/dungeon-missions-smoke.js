// Headless test of the dungeon mission kits (server/dungeons/kits/*.js on fx.js and hazards.js) and their HUD text (shared/dungeon-hud.js), straight from src/ (no build):
// every mission won through its boss on two dungeons and lost by its own condition (the stone broken, the dark with everyone down, the quarry's 10 minutes, the captive
// dead, a wipe), the HUD numbers moving and dgHudText reading them, party health at spawn (x2.0 for two), chests giving the same to all present, the three hazards
// hurting / rooting / slowing and stopping with the run.
// Usage: node tools/dungeon-missions-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};   // pid -> events / messages received
const NAMES=['DG_RUNS','DG_KITS','DG_KIT_BAD','DG_MISSIONS','DG_PARTY','DG_HUD','DG_HUD_BOSS','DG_OBJ_KINDS','DG_STONE_HITS','DG_CAPTIVE_HITS','DG_TILE','DG_CELL','S','DEF_BY_ID',
  'dgHudText','dgObjName','dgPoolS','dgLocalS','dgWorldS','dgSpawnS','dgRemoveS','dgFree','dgLos','dgFlow','dgStep','dgAvgHitS','dgHzBuildS','dgFxOf','dgLoseS','dgInHallS',
  'killMonsterS','hurtP','ITEM'];
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},NAMES);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set();   // players kept at full health
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.1); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.1));
const P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind);
const last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; };
const lastSnap=pid=>{ const a=(msgs[pid]||[]).filter(m=>m.t==='snap'&&m.dg); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | ');
const clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name)=>{ W.join(pid,{name,look:{cls:'warrior'},save:{level:30}}); IMM.add(pid); return P(pid); };
const dev=(pid,v)=>W.receive(pid,{t:'dev',cmd:'dg',v});
const dg=(pid,a,o)=>W.receive(pid,Object.assign({t:'dg',a},o||{}));
const runOf=pid=>x.DG_RUNS.get(P(pid).inst);
const local=(run,o)=>x.dgLocalS(run,o.x,o.z);
const put=(p,run,lx,lz)=>{ p.x=run.ox+lx; p.z=run.oz+lz; p.dgX=p.x; p.dgZ=p.z; p.vx=p.vz=0; };   // the server's own place for a hiker (a test may jump; setPos would refuse)
const putAt=(p,o)=>{ p.x=o.x; p.z=o.z; p.dgX=p.x; p.dgZ=p.z; };
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };
const alive=(run,f)=>[...run.mons].filter(m=>!m.dead&&!m.remove&&!m.boss&&(!f||f(m)));
const killAll=(run,by,f)=>{ for(const m of alive(run,f)) x.killMonsterS(m,by); };
const party=(lead,mates)=>{ for(const q of mates){ W.receive(lead.id,{t:'party',a:'invite',name:q.name}); tick(1); W.receive(q.id,{t:'party',a:'accept'}); tick(1); } };
const startRun=(lead,v,mates)=>{ clear(); dev(lead.id,v); tick(2); for(const q of mates||[]) dg(q.id,'accept'); tick(3); return runOf(lead.id); };
const leaveAll=(run)=>{ for(const p of x.DG_RUNS.has(run.id)?[...run.members.values()].map(mb=>mb.p).filter(Boolean):[]) dg(p.id,'leave'); tick(2); };
// a free spot dmin..dmax m from (lx, lz) in its line of sight (or not), for something of radius r
function spotNear(run,lx,lz,dmin,dmax,los,r){
  const B=run.B; let best=null;
  for(let i=0;i<B.w*B.h;i++){ const cx=(i%B.w+0.5)*2, cz=(Math.floor(i/B.w)+0.5)*2, d=Math.hypot(cx-lx,cz-lz);
    if(d<dmin||d>dmax||!x.dgFree(B,cx,cz,r||0.5)||(los!==undefined&&x.dgLos(B,lx,lz,cx,cz)!==los)) continue; if(!best||Math.abs(d-(dmin+dmax)/2)<best.e) best={x:cx,z:cz,e:Math.abs(d-(dmin+dmax)/2)}; }
  return best;
}
// walk a hiker toward a local point along the flow field at 8 m/s (the server's place, a tick at a time), killing what stands in the way if asked
function walkTo(p,run,lx,lz,maxS,each){
  const f=x.dgFlow(run.B,lx,lz);
  for(let i=0;i<maxS*10;i++){
    const l=local(run,p), d=Math.hypot(lx-l.x,lz-l.z); if(d<1.2) return true;
    let dir=x.dgStep(run.B,f,l.x,l.z); if(!dir) dir=[(lx-l.x)/d,(lz-l.z)/d];
    put(p,run,l.x+dir[0]*0.8,l.z+dir[1]*0.8); tick(1); if(each) each(i); if(run.endT) return false;
  }
  return false;
}
const hudOf=(pid,mission,th)=>{ const s=lastSnap(pid); return s?{dg:s.dg,t:x.dgHudText(mission,s.dg,th)}:{dg:null,t:null}; };
const winBoss=(run,by)=>{ tick(3); const b=run.boss; if(b) x.killMonsterS(b.m,by); tick(3); return run.phase==='won'; };
const kindsSeen=new Set();
const noteKinds=pid=>{ for(const e of evs(pid,'dgo')) kindsSeen.add(e[2]); };

// ---- the registry and the HUD contract ----
ok('every mission has a kit (none left out) and the offer deals from all seven',x.DG_KIT_BAD.length===0&&Object.keys(x.DG_MISSIONS).every(k=>x.DG_KITS[k])&&x.dgPoolS().length===7,JSON.stringify(x.DG_KIT_BAD));
ok('every mission has a HUD row; dgHudText always answers (no tuple, the start prompt, the end)',Object.keys(x.DG_MISSIONS).every(k=>typeof x.DG_HUD[k]==='function')&&x.dgHudText('defense',undefined).title&&/Waiting for 2/.test(x.dgHudText('siege',[0,0,2]).lines[0])&&x.dgHudText('hunt',[3,9,0]).warn===true&&x.dgHudText('escort',[2,9,0]).title==='Cleared!');
{ const t=x.dgHudText('defense',[1,200,0,2,3,41,0,0]), e=x.dgHudText('escort',[1,9,0,2,17,0]);
  ok('in the boss phase Defense still shows its stone and Escort its captive',/41%/.test(t.lines[0])&&t.bar.v===41&&e.bar.v===17&&e.warn===true); }
ok('objective kinds have their dungeon\'s own names (docs/DUNGEON-THEMES.md section 3)',x.dgObjName('stone','hollowroots')==='the Heartwood Knot'&&x.dgObjName('altar','bonefrostbarrow')==='a rune pillar'&&x.dgObjName('captive','jadesprings')==='the bath-house keeper'&&x.dgObjName('stone','blackseam')==='the winch house'&&x.dgObjName('ping','blackseam')==='the Mountain Goblin'&&x.dgObjName('stone')==='Ward stone');

const A=join('a','Ash'), B=join('b','Bree'), C=join('c','Cole'), D=join('d','Dara'); tick(3);

// ---- Purge, on three more dungeons (the runs smoke wins it in the Hollow Roots and the Blackseam) ----
for(const th of ['jadesprings','bonefrostbarrow','blackseam']){
  const run=startRun(A,th+':purge:4'); killAll(run,A,m=>m.dgRole==='purge'); tick(3);
  ok('Purge ('+th+'): its packs killed, the boss appears; its death clears the run',run.phase==='boss'&&!!run.boss&&winBoss(run,A)&&last('a','dge')[2]===1);
  secs(21);
}
party(C,[D]);
{ const run=startRun(C,'hollowroots:purge:8',[D]); IMM.delete('c'); IMM.delete('d');
  x.hurtP(C,1e9,null); x.hurtP(D,1e9,null); tick(3);
  ok('Purge lost: everyone down at once (the foundation\'s rule, unchanged)',run.phase==='lost'&&/whole party/.test(last('c','dge')[8]||''));
  IMM.add('c'); IMM.add('d'); secs(21); }

// ---- Defense ----
{ // won solo in the Hollow Roots: 2 rotations of 3 waves, breakers, the stone heals, the chests, the boss in the same hall
  const run=startRun(A,'hollowroots:defense:5'), k=run.k, st=k.stone, H=run.B.boss;
  const so=local(run,st);
  ok('Defense: the ward stone stands in the round hall (the hub), with health, sent as dgo [id, "stone", x, z, 1, 100]',!!st&&x.dgInHallS(run,so.x,so.z,0)&&st.max===Math.round(x.DG_STONE_HITS*x.dgAvgHitS(run))&&evs('a','dgo').some(e=>e[2]==='stone'&&e[5]===1&&e[6]===100));
  { const h=hudOf('a','defense','hollowroots'); ok('Defense HUD before the first wave: [1, 1, 100, 0, 12-ish]; the text names the Heartwood Knot, the bar is the stone',!!h.dg&&h.dg[3]===1&&h.dg[4]===1&&h.dg[5]===100&&h.dg[7]>=10&&/Heartwood Knot/.test(h.t.title)&&/Next wave/.test(h.t.lines[1])&&h.t.bar.v===100&&h.t.bar.max===100,JSON.stringify(h.dg)); }
  put(A,run,so.x+3,so.z); secs(16);   // (the first wave at 12 s, all 6 out in groups of 3 every 1.5 s)
  const w1=alive(run,m=>m.dgRole==='wave'||m.dgRole==='breaker'), br=w1.filter(m=>m.dgRole==='breaker');
  const mouthD=w1.map(m=>{ const l=local(run,m); return Math.hypot(l.x-H.x,l.z-H.z); });
  ok('the first wave (6) comes from the mouths out of the hall, a quarter of it breakers (2) that the kit drives',w1.length===6&&br.length===2&&br.every(m=>m.dgOwn)&&mouthD.every(d=>d>H.r),w1.length+' out, '+br.length+' breakers');
  const b0=br[0], d0=Math.hypot(b0.x-st.x,b0.z-st.z); secs(4);
  ok('a breaker ignores you and walks to the stone (the flow field)',Math.hypot(b0.x-st.x,b0.z-st.z)<d0-3,d0.toFixed(1)+' -> '+Math.hypot(b0.x-st.x,b0.z-st.z).toFixed(1));
  { const p=local(run,st); b0.x=st.x+1.5; b0.z=st.z; const hp0=st.hp; secs(4);
    ok('...and its swings take the stone\'s health (dgo with the new %)',st.hp<hp0&&st.v<100&&evs('a','dgo').some(e=>e[2]==='stone'&&e[6]<100),st.v+'%'); }
  st.hp=Math.round(st.max*0.5); st.v=50;   // (half its health, so the heal after the wave is not cut by the top)
  const seen=new Set(); let heal=null, chest1=null, maxRot=0, maxWave=0, hudTexts=new Set();
  for(let i=0;i<2400&&!run.boss&&!run.endT;i++){
    tick(1); for(const m of alive(run,m=>m.dgRole==='wave'||m.dgRole==='breaker')) seen.add(m.id);
    if(i%4===0){ const v0=st.v, w0=k.wave; killAll(run,A,m=>m.dgRole==='wave'||m.dgRole==='breaker'); if(!k.queue.length){ tick(1); if(k.wave!==w0&&heal===null) heal=[v0,st.v]; } }
    const h=lastSnap('a'); if(h){ maxRot=Math.max(maxRot,h.dg[3]); maxWave=Math.max(maxWave,h.dg[4]); hudTexts.add(x.dgHudText('defense',h.dg).lines[0]); }
    const c=run.objs.find(o=>o.kind==='chest'&&o.st===1); if(c&&!chest1){ chest1=c; }
  }
  ok('the stone heals 5% after a wave',!!heal&&Math.abs(heal[1]-heal[0]-5)<=1,JSON.stringify(heal));
  ok('2 rotations x 3 waves of 6 + 2 x rotation + 2 x wave: 54 monsters, then the boss in the same hall',seen.size===54&&!!run.boss&&run.phase==='boss'&&Math.hypot(run.boss.A.x-(run.ox+H.x),run.boss.A.z-(run.oz+H.z))<0.1,seen.size+' monsters');
  ok('the HUD walked through rotation 2 and wave 3, and its text with it',maxRot===2&&maxWave===3&&hudTexts.has('Rotation 2 of 2, wave 3 of 3'),[...hudTexts].slice(-2).join(' / '));
  const chests=run.objs.filter(o=>o.kind==='chest');
  ok('a reward chest at the end of each rotation (dgo "chest", v = its number)',chests.length===2&&chests[0].v===1&&chests[1].v===2&&!!chest1);
  { const c2=chests[1], inv0=A.gear.inv.length; putAt(A,c2); dg('a','use',{id:c2.id}); tick(2); const got2=A.gear.inv.slice(inv0);
    ok('the second chest\'s items are at least rarity 1 (rising with each chest)',got2.length===2&&got2.every(id=>x.ITEM[id]&&x.ITEM[id].rar>=1),got2.join(',')); }
  ok('the stone still stands with the boss up (and the boss-phase HUD shows it)',run.objs.includes(st)&&st.st===1&&/stone still stands/.test(hudOf('a','defense').t.lines[0]||''));
  noteKinds('a');
  ok('Defense won: the boss falls in the hall it guarded',winBoss(run,A));
  secs(21); }
party(A,[B]);
{ // a party of two in the Jade Springs: party health at spawn, the stone x DG_PARTY.obj, a chest the same for both
  const run=startRun(A,'jadesprings:defense:6',[B]), st=run.k.stone;
  ok('two in the run: the stone\'s health x'+x.DG_PARTY.obj[1]+' (DG_PARTY.obj)',st.max===Math.round(x.DG_STONE_HITS*x.dgAvgHitS(run)*x.DG_PARTY.obj[1]),st.max);
  secs(14); const w=alive(run,m=>m.dgRole==='wave'||m.dgRole==='breaker');
  ok('party health at spawn: every wave monster x'+x.DG_PARTY.hp[1]+' (elites x2.5 on top)',w.length>0&&w.every(m=>Math.abs(m.maxHp-m.def.hp*x.DG_PARTY.hp[1]*(m.elite?2.5:1))<1e-6));
  for(let i=0;i<1500&&!run.objs.some(o=>o.kind==='chest');i++){ tick(1); if(i%4===0) killAll(run,A,m=>m.dgRole==='wave'||m.dgRole==='breaker'); }
  const c=run.objs.find(o=>o.kind==='chest'); putAt(A,c); const invA=A.gear.inv.length, invB=B.gear.inv.length, cA=A.gear.coins, cB=B.gear.coins; clear();
  dg('a','use',{id:c.id}); tick(3);
  const nA=A.gear.inv.slice(invA), nB=B.gear.inv.slice(invB);
  ok('the chest: one roll, the same two items and coins for every member present (the far one too)',nA.length===2&&JSON.stringify(nA)===JSON.stringify(nB)&&A.gear.coins-cA===B.gear.coins-cB&&A.gear.coins>cA&&c.st===2,nA+' / '+nB);
  dg('b','use',{id:c.id}); tick(2); ok('an opened chest gives nothing more',B.gear.inv.length===invB+2);
  for(let i=0;i<2400&&!run.boss&&!run.endT;i++){ tick(1); if(i%4===0) killAll(run,A,m=>m.dgRole==='wave'||m.dgRole==='breaker'); }
  ok('Defense won on a second dungeon (the Jade Springs, a party of two)',!!run.boss&&winBoss(run,A));
  secs(21); }
{ // lost: the stone broken (the Barrow)
  const run=startRun(C,'bonefrostbarrow:defense:7',[D]), st=run.k.stone; secs(14);
  const br=alive(run,m=>m.dgRole==='breaker')[0]; st.hp=1; br.x=st.x+1.4; br.z=st.z; clear(); secs(4);
  ok('Defense lost when the ward stone\'s health reaches 0 (dge why: the stone)',run.phase==='lost'&&/ward stone/.test(last('c','dge')[8]||'')&&last('d','dge')[2]===0,run.phase+' '+(last('c','dge')||[]).join(','));
  secs(21); }

// ---- Survival ----
{ const run=startRun(A,'hollowroots:survival:9',[B]), k=run.k, H=run.B.boss;
  ok('Survival: the lantern stands in the round hall, 120 s of light (dgo "lantern")',!!k.lantern&&x.dgInHallS(run,local(run,k.lantern).x,local(run,k.lantern).z,0)&&Math.abs(k.light-120)<1&&evs('a','dgo').some(e=>e[2]==='lantern'&&e[6]===120));
  secs(10.2); let h=hudOf('a','survival','hollowroots');
  ok('the light drains 1 s a second: HUD [light, marks] reads about 110, and the text says so',!!h.dg&&Math.abs(h.dg[3]-110)<=1&&h.dg[4]===0&&/Light: 1:5/.test(h.t.lines[0]),JSON.stringify(h.dg));
  { const m=alive(run)[0], l0=k.light; withRandom(0.5,()=>x.killMonsterS(m,A)); ok('a kill feeds it +2 s',Math.abs(k.light-l0-2)<1e-6); }
  { const m=alive(run)[0], l0=k.light; withRandom(0.05,()=>x.killMonsterS(m,A)); tick(2);
    const f=run.objs.find(o=>o.kind==='flask'); ok('a kill may drop a flask (10%): dgo "flask"',!!f&&evs('a','dgo').some(e=>e[2]==='flask'));
    putAt(B,f); tick(2); ok('walking onto it pours it: +30 s, the flask is gone (dgo st 0)',!run.objs.includes(f)&&k.light>l0+30&&evs('a','dgo').some(e=>e[1]===f.id&&e[5]===0)); }
  { const e0=alive(run).find(m=>m.elite)||x.dgSpawnS(run,'shroom',H.x,H.z,{elite:true,role:'night'}), l0=k.light; const f0=run.objs.filter(o=>o.kind==='flask').length; withRandom(0.5,()=>x.killMonsterS(e0,A));
    ok('an elite +10 s, and always a flask',Math.abs(k.light-l0-10)<1e-6&&run.objs.filter(o=>o.kind==='flask').length===f0+1); tick(1); }
  // spawns thicken: count the newcomers in a minute early and a minute late (killing everything as it comes)
  const count=(s)=>{ const seen=new Set(); for(let i=0;i<s*10;i++){ tick(1); for(const m of alive(run)) seen.add(m.id); if(i%5===0) killAll(run,A); } return seen.size; };
  const early=count(50);
  let chest1=false; for(let i=0;i<2600&&run.t<400;i++){ tick(1); if(i%10===0) killAll(run,A); if(run.objs.some(o=>o.kind==='chest'&&o.v===1)) chest1=true; }
  const late=count(50);
  ok('spawns thicken with time (more newcomers a minute late than early)',late>early*1.8,early+' early, '+late+' late');
  ok('the 5:00 mark: a reward chest',chest1&&k.marks>=1);
  for(let i=0;i<3000&&!run.boss;i++){ tick(1); if(i%10===0) killAll(run,A); }
  ok('the 10:00 mark: a second chest, the lantern topped up and holding (st 2), the boss in the same hall',k.marks===2&&run.objs.filter(o=>o.kind==='chest').length===2&&k.lantern.st===2&&k.light>=120&&!!run.boss&&run.phase==='boss');
  const l1=k.light; secs(8); ok('...and it no longer drains',k.light===l1);
  noteKinds('a');
  ok('Survival won: the boss falls',winBoss(run,A));
  secs(21); }
{ // lost in the dark: everyone down
  const run=startRun(C,'jadesprings:survival:10',[D]), k=run.k; IMM.delete('c'); IMM.delete('d');
  k.light=2; clear(); let wentDark=false;
  for(let i=0;i<500&&!run.endT;i++){ tick(1); for(const m of alive(run)) x.dgRemoveS(run,m); if(k.dark) wentDark=true; }
  const hurt=evs('c','hurt').map(e=>e[2]), share=Math.round(C.maxHp*0.04);
  ok('at 0 light the dark takes 4% of max health a second from everyone (no armour)',wentDark&&hurt.filter(v=>v===share).length>=10&&/lantern is out/.test(toasts('c')),'hits '+hurt.slice(0,4));
  ok('Survival lost: the dark, everyone down',run.phase==='lost'&&last('c','dge')[2]===0&&last('d','dge')[2]===0);
  IMM.add('c'); IMM.add('d'); secs(21); }

// ---- Sabotage ----
for(const th of ['hollowroots','bonefrostbarrow']){
  const run=startRun(A,th+':sabotage:11',[B]), roots=run.k.roots;
  ok('Sabotage ('+th+'): three heartroots, each shielded by its pack (v = wardens)',roots.length===3&&roots.every(o=>o.v>=5&&o.st===1)&&alive(run,m=>m.dgRole==='warden').length===roots.reduce((s,o)=>s+o.v,0));
  if(th==='hollowroots') ok('the Heartwood Knot\'s warden is the Ancient Treant at its post, keeping to its room',alive(run,m=>m.dgRole==='warden'&&m.dgGuard&&m.def.id==='ancient').length>=1);
  const r0=roots[0]; putAt(A,r0); clear(); dg('a','use',{id:r0.id}); tick(2);
  ok('a shielded heartroot cannot be broken (a toast, no channel)',!A.cast&&/shielded/.test(toasts('a'))&&!evs('a','cast').length);
  killAll(run,A,m=>m.dgOb===r0.id); tick(2);
  let h=hudOf('a','sabotage',th);
  ok('its wardens dead: the shield is down (v 0), the HUD counts it unshielded',r0.v===0&&!!h.dg&&h.dg[3]===0&&h.dg[4]===3&&h.dg[5]===1&&/unshielded/.test(h.t.lines[1]),JSON.stringify(h.dg));
  putAt(A,r0); clear(); dg('a','use',{id:r0.id}); tick(2);
  const c=last('a','cast'); ok('using it starts a 2 s channel on the cast bar: cast [pid, -2, 2, id]',!!c&&c[2]===-2&&c[3]===2&&c[4]===r0.id);
  A.x+=3; tick(3); ok('walking off breaks it (castx); the root stands',!!last('a','castx')&&r0.st===1);
  putAt(A,r0); dg('a','use',{id:r0.id}); secs(2.5);
  ok('a full channel breaks the heartroot (st 2), HUD 1 of 3',r0.st===2&&run.k.done===1&&hudOf('a','sabotage').dg[3]===1);
  for(const r of roots.slice(1)){ killAll(run,A,m=>m.dgOb===r.id); tick(2); putAt(A,r); dg('a','use',{id:r.id}); secs(2.5); }
  ok('the third broken calls the boss',run.k.done===3&&!!run.boss&&run.phase==='boss');
  noteKinds('a');
  ok('Sabotage won ('+th+')',winBoss(run,A));
  secs(21);
}

// ---- Siege ----
for(const th of ['jadesprings','bonefrostbarrow']){
  const run=startRun(A,th+':siege:12',[B]), k=run.k;
  const a1=k.alt; ok('Siege ('+th+'): the first altar is revealed (dgo "altar"), nothing fills while nobody stands in it',!!a1&&evs('a','dgo').some(e=>e[2]==='altar'&&e[1]===a1.id)&&(secs(5),k.fill===0));
  putAt(A,a1); secs(6.05); let h=hudOf('a','siege',th);
  ok('standing in its circle fills it (60 s: about 10% after 6 s), HUD [altar, fill %, in]',Math.abs(k.fill-0.1)<0.01&&!!h.dg&&h.dg[3]===1&&h.dg[5]===1&&/Channelling/.test(h.t.lines[1]),JSON.stringify(h.dg));
  secs(6); ok('its room is hit by waves meanwhile',alive(run,m=>m.dgRole==='siege').length>=3);
  killAll(run,A,m=>m.dgRole==='siege'); const f0=k.fill; A.x+=12; secs(9);
  ok('empty, it decays at a third of the rate...',f0<0.25&&Math.abs((f0-k.fill)-9/180)<0.006,(f0*100).toFixed(1)+'% -> '+(k.fill*100).toFixed(1)+'%');
  putAt(A,a1); for(let i=0;i<200&&k.fill<0.3;i++){ tick(1); if(i%20===0) killAll(run,A,m=>m.dgRole==='siege'); } A.x+=12; secs(60);
  ok('...but never below the last quarter reached (25%)',Math.abs(k.fill-0.25)<1e-9,(k.fill*100).toFixed(1)+'%');
  const alts=[a1];
  for(let n=0;n<3&&!run.boss;n++){ const a=k.alt; if(alts.indexOf(a)<0) alts.push(a); putAt(A,a); for(let i=0;i<700&&k.alt===a;i++){ tick(1); if(i%20===0) killAll(run,A,m=>m.dgRole==='siege'); } }
  ok('each full altar reveals the next; the third wakes the boss',alts.length===3&&alts.every(a=>a.st===2&&a.v===100)&&new Set(alts.map(a=>a.id)).size===3&&!!run.boss);
  noteKinds('a');
  ok('Siege won ('+th+')',winBoss(run,A));
  secs(21);
}

// ---- Hunt ----
for(const th of ['hollowroots','jadesprings']){
  const run=startRun(A,th+':hunt:13',[B]), k=run.k, q=k.q;
  ok('Hunt ('+th+'): the quarry is the dungeon\'s own elite ('+q.def.id+'), driven by the kit; a sighting is on the map (dgo "ping")',q.elite&&q.def.id===(th==='hollowroots'?'shroom':'tengu')&&q.dgOwn&&!!k.ping&&evs('a','dgo').some(e=>e[2]==='ping'));
  const p0=[k.ping.x,k.ping.z], pl=local(run,q), tl=[Math.floor(pl.x/x.DG_TILE),Math.floor(pl.z/x.DG_TILE)], pt=[Math.floor((p0[0]-run.ox)/x.DG_TILE),Math.floor((p0[1]-run.oz)/x.DG_TILE)];
  ok('the sighting is within one tile of the quarry',Math.abs(pt[0]-tl[0])<=1&&Math.abs(pt[1]-tl[1])<=1);
  for(let b=0;b<3;b++){
    const ql=local(run,q), s=spotNear(run,ql.x,ql.z,9,14,true); put(A,run,s.x,s.z); clear(); tick(2);
    const goal=k.goal;
    if(b===0) ok('a member within 18 m in its sight makes it bolt (a roar) to the far side of the map',!!goal&&!!last('a','roar')&&Math.hypot(goal.x-ql.x,goal.z-ql.z)>40,goal?Math.hypot(goal.x-ql.x,goal.z-ql.z).toFixed(0)+' m':'no bolt');
    put(A,run,s.x,s.z); for(let i=0;i<300&&k.goal;i++) tick(1);
  }
  ok('after 3 bolts it is winded: back to the AI, slow',k.bolts===3&&k.winded&&!q.dgOwn&&q.slowT>0);
  const pings0=k.pings; secs(31); ok('a new sighting every 30 s',k.pings>pings0&&evs('a','dgo').filter(e=>e[2]==='ping').length>=1);
  const h=hudOf('a','hunt',th);
  ok('Hunt HUD [sightings, bolts, seconds left] and its text',!!h.dg&&h.dg[3]===k.pings&&h.dg[4]===3&&h.dg[5]>400&&h.dg[5]<=600-60&&/Winded/.test(h.t.lines[1]),JSON.stringify(h.dg));
  x.killMonsterS(q,A); tick(3);
  ok('its death calls the boss (the sighting is taken off the map)',!!run.boss&&!run.objs.includes(k.ping)&&!k.ping);
  noteKinds('a');
  ok('Hunt won ('+th+')',winBoss(run,A));
  secs(21);
}
{ const run=startRun(C,'bonefrostbarrow:hunt:14',[D]); ok('the Barrow\'s quarry is a Barrow Wight',run.k.q.def.id==='barrowwight');
  clear(); secs(601);
  ok('Hunt lost after 10 minutes: "the quarry got away"',run.phase==='lost'&&/quarry got away/.test(last('c','dge')[8]||''),run.phase);
  secs(21); }

// ---- Escort ----
for(const th of ['hollowroots','jadesprings']){
  const run=startRun(A,th+':escort:15',[B]), k=run.k, cap=k.cap, H=run.B.boss;
  ok('Escort ('+th+'): the captive waits in the far site room with six jailers (dgo "captive", v 100)',!!cap&&k.state===0&&alive(run,m=>m.dgRole==='jailer').length===6&&evs('a','dgo').some(e=>e[2]==='captive'&&e[6]===100));
  killAll(run,A,m=>m.dgRole==='jailer'||m.dgRole==='roam'||m.dgGuard); tick(2);
  dg('a','use',{id:cap.id}); tick(2); ok('freeing it needs you next to it',!A.cast);
  putAt(A,cap); clear(); dg('a','use',{id:cap.id}); tick(2);
  const c=last('a','cast'); ok('freeing is a 5 s channel: cast [pid, -2, 5, id]',!!c&&c[2]===-2&&c[3]===5&&c[4]===cap.id);
  secs(5.2); let h=hudOf('a','escort',th);
  ok('freed: it follows (HUD [1, 100, metres to the hall])',k.state===1&&!!h.dg&&h.dg[3]===1&&h.dg[4]===100&&h.dg[5]>5&&/Lead them/.test(h.t.lines[0]),JSON.stringify(h.dg));
  { const cl=local(run,cap), s=spotNear(run,cl.x,cl.z,7,9,true,0.5); put(A,run,s.x,s.z); put(B,run,s.x,s.z); clear(); secs(1.5);
    const d=Math.hypot(cap.x-A.x,cap.z-A.z);
    ok('it walks after the nearest member, and the clients hear of it (dgo with its new place)',d<4&&evs('a','dgo').some(e=>e[1]===cap.id&&e[5]===1),d.toFixed(1)+' m'); }
  { const cl=local(run,cap); const m=x.dgSpawnS(run,'shroom',cl.x+3,cl.z,{role:'test'}); withRandom(0.1,()=>tick(6)); const hp0=cap.v; put(A,run,cl.x,cl.z); put(B,run,cl.x,cl.z); secs(5);
    ok('a monster near it may pick the captive (30%): the kit walks it there and its swings take the captive\'s health',m.dgTake&&m.dgOwn&&cap.v<100,'v '+cap.v); x.killMonsterS(m,A); }
  { const pick=v=>{ const cl=local(run,cap), m=x.dgSpawnS(run,'shroom',cl.x+2,cl.z,{role:'test'}); withRandom(v,()=>tick(6)); const r=m.dgPick; x.dgRemoveS(run,m); return r; };
    ok('the chance is 30%: a roll under 0.3 picks the captive, one over keeps to the players (decided once)',pick(0.29)===true&&pick(0.31)===false); }
  B.x=A.x; B.z=A.z;
  const reached=walkTo(A,run,H.x,H.z,120,i=>{ put(B,run,local(run,A).x,local(run,A).z); if(i%10===0) killAll(run,A); });
  tick(5);
  ok('led into the round hall with a member: the boss wakes (state 2)',reached&&k.state===2&&!!run.boss&&run.phase==='boss'&&x.dgInHallS(run,local(run,cap).x,local(run,cap).z,0),'state '+k.state+' hp '+cap.v);
  noteKinds('a');
  ok('Escort won ('+th+'): the boss falls, the captive alive',winBoss(run,A)&&cap.hp>0);
  secs(21);
}
{ const run=startRun(C,'bonefrostbarrow:escort:16',[D]), k=run.k, cap=k.cap;
  killAll(run,C); putAt(C,cap); dg('c','use',{id:cap.id}); secs(5.5);
  const cl=local(run,cap); cap.hp=5; clear();
  withRandom(0.1,()=>{ for(let i=0;i<3;i++) x.dgSpawnS(run,'draugr',cl.x+2,cl.z+(i-1),{role:'test'}); secs(8); });
  ok('Escort lost when the captive dies: "the captive died"',run.phase==='lost'&&/captive died/.test(last('c','dge')[8]||''),run.phase);
  secs(21); }

// ---- every objective kind the kits sent has a look in DG_OBJ_KINDS ----
ok('every objective kind the kits sent has a name and colour in DG_OBJ_KINDS ('+[...kindsSeen].join(', ')+')',kindsSeen.size>=8&&[...kindsSeen].every(k=>x.DG_OBJ_KINDS[k]&&x.DG_OBJ_KINDS[k].name&&x.DG_OBJ_KINDS[k].col));

// ---- hazards: the themes' legend spots at run time ----
const hzRun=(th,seed)=>{ const run=startRun(A,th+':purge:'+seed,[B]); for(const m of alive(run)) x.dgRemoveS(run,m); return run; };
const hzCell=(run,kind,pred)=>run.B.props.filter(p=>p.hz===kind).find(p=>!pred||pred(p));
{ const run=hzRun('hollowroots',17), H=x.dgHzBuildS(run), c=H.list.filter(c=>c.kind==='spikes').sort((a,b)=>b.cells.length-a.cells.length)[0], s=c.cells[0];
  IMM.delete('a'); A.hp=A.maxHp; put(A,run,s.x,s.z); put(B,run,run.B.start.x,run.B.start.z); clear();
  let tele=null; for(let i=0;i<150&&!tele;i++){ tick(1); put(A,run,s.x,s.z); tele=evs('a','tele').find(e=>e[2]==='root'); }
  secs(2);
  const hit=evs('a','hurt').find(e=>e[2]===Math.round(A.maxHp*0.10)), rt=evs('a','pfx').find(e=>e[2]==='root');
  ok('Hollow Roots: standing on root spikes sets off the Rootwarden\'s root telegraph under you; it hurts 10% and roots',!!tele&&!!last('a','tend')&&!!hit&&!!rt,tele?'tele r '+tele[5]:'none');
  IMM.add('a'); leaveAll(run); }
{ const run=hzRun('jadesprings',18), H=x.dgHzBuildS(run), c=H.list.find(c=>c.kind==='steam'), s=c.cells[0];
  IMM.delete('a'); A.hp=A.maxHp; put(A,run,s.x,s.z); put(B,run,run.B.start.x,run.B.start.z); clear();
  let tele=null; for(let i=0;i<150&&!tele;i++){ tick(1); put(A,run,s.x,s.z); tele=evs('a','tele').find(e=>e[2]==='geyser'); }
  secs(1.5);
  const hit=evs('a','hurt').find(e=>e[2]===Math.round(A.maxHp*0.08)), sl=evs('a','pfx').find(e=>e[2]==='slow');
  ok('Jade Springs: a steam vent warns with the geyser telegraph, then scalds 8% and slows',!!tele&&!!hit&&!!sl);
  IMM.add('a'); leaveAll(run); }
{ const run=hzRun('blackseam',18), H=x.dgHzBuildS(run), c=H.list.find(c=>c.kind==='steam'), s=c.cells[0];
  IMM.delete('a'); A.hp=A.maxHp; put(A,run,s.x,s.z); put(B,run,run.B.start.x,run.B.start.z); clear();
  const W0=x.dgWorldS(run,c.x,c.z); let tele=null;   // (the sump has two vent patches: only this patch's own warning counts)
  for(let i=0;i<260&&!tele;i++){ tick(1); put(A,run,s.x,s.z); tele=evs('a','tele').find(e=>e[2]==='geyser'&&Math.hypot(e[3]-W0.x,e[4]-W0.z)<1); }
  secs(1.5);
  const hit=evs('a','hurt').find(e=>e[2]===Math.round(A.maxHp*0.08)), sl=evs('a','pfx').find(e=>e[2]==='slow');
  ok('the Blackseam: a slag vent warns with the geyser telegraph, then scalds 8% and slows',!!tele&&!!hit&&!!sl,'tele '+!!tele+', hurt '+!!hit+', slow '+!!sl+', hurts '+JSON.stringify(evs('a','hurt').slice(0,3))+', patch r '+c.r.toFixed(1)+' of '+H.list.length);
  IMM.add('a'); leaveAll(run); }
{ const run=hzRun('bonefrostbarrow',19), H=x.dgHzBuildS(run), cells=[...H.rime], c0=cells[0], s={x:(c0%run.B.w+0.5)*2,z:(Math.floor(c0/run.B.w)+0.5)*2};
  IMM.delete('a'); A.hp=A.maxHp; put(A,run,s.x,s.z); put(B,run,run.B.start.x,run.B.start.z); clear(); tick(3);
  const tele=evs('a','tele').find(e=>e[2]==='prison'); secs(2);
  const hit=evs('a','hurt').find(e=>e[2]===Math.round(A.maxHp*0.06)), rt=evs('a','pfx').find(e=>e[2]==='root');
  ok('Bonefrost Barrow: on rime an ice-prison mark closes on you (half = your pid): 6% and rooted',!!tele&&tele[8]==='a'&&!!hit&&!!rt);
  const off=spotNear(run,s.x,s.z,6,14,undefined,0.5); let ok2=null; clear();
  for(let i=0;i<120&&!ok2;i++){ tick(1); put(A,run,s.x,s.z); const t=evs('a','tele').find(e=>e[2]==='prison'); if(t){ ok2=t; } }
  let offRime=off; for(const p of [[6,0],[-6,0],[0,6],[0,-6],[8,8],[-8,-8]]){ const q={x:s.x+p[0],z:s.z+p[1]}; const qx=Math.floor(q.x/2), qz=Math.floor(q.z/2); let rime=false; for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) if(H.rime.has((qz+dz)*run.B.w+qx+dx)) rime=true; if(!rime&&x.dgFree(run.B,q.x,q.z,0.4)){ offRime=q; break; } }
  put(A,run,offRime.x,offRime.z); const hp0=A.hp; secs(2);
  ok('step off the rime before it closes and it misses (tend 0, no harm)',!!ok2&&evs('a','tend').some(e=>e[1]===ok2[1]&&e[2]===0)&&A.hp===hp0);
  // stop: the run ends, nothing more stirs
  put(A,run,s.x,s.z); tick(2); x.dgLoseS(run,'test'); clear(); secs(10);
  ok('hazards stop when the run ends (no new warnings; a pending one is taken back)',!evs('a','tele').length);
  IMM.add('a'); secs(12); }

console.log(fails?fails+' FAILED':'all passed');
process.exit(fails?1:0);
