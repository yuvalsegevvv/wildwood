// Headless test of the Emberwake Isles' two world bosses (Ocelo, Tuila): their data, their arenas, their twelve skills, the zone tier's opener, and each kit fought through three phases on a stand-in arena
// Usage: node tools/emberwake-bosses-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},['MONS','BOSSES','ARENAS','ARENA_TIDE','getH','SKILLS','EW_BOSS_ROWS','makeBossS','OCELO_DEF','TUILA_DEF','BOSS_KITS','BOSS_DEFS','ARENA_E45','ARENA_E46','ZTIER_BOSS','MAT_NAMES','openIslesP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.maxHp=1e7; p.hp=1e7; p.dead=false; } } };
ok('two rows: Ocelo 45 (fire) and Tuila 46 (water), each with an add and a kit, in BOSS_DEFS with their arenas',x.EW_BOSS_ROWS.length===2&&x.OCELO_DEF.level===45&&x.OCELO_DEF.el==='fire'&&x.TUILA_DEF.level===46&&x.TUILA_DEF.el==='water'&&x.EW_BOSS_ROWS.every(r=>r.add.bossAdd&&x.BOSS_KITS[r.kit]&&x.BOSS_DEFS.includes(r)&&x.ARENAS.some(a=>a.key===r.arena&&a.isles)));
ok('Tuila is the zone tier\'s opener, both bosses have a material name, and the arenas stand on the isles (not within 120 m of each other)',x.ZTIER_BOSS.isles==='tuila'&&x.MAT_NAMES.ocelo&&x.MAT_NAMES.tuila&&Math.hypot(x.ARENA_E45.x-x.ARENA_E46.x,x.ARENA_E45.z-x.ARENA_E46.z)>120);
for(const id of ['ocelo','tuila']){
  const sk=Object.values(x.SKILLS).filter(s=>s.drop===id);
  ok(id+': drops 6 skills, a skill and a burst for each class, at the boss\'s level',sk.length===6&&['warrior','archer','mage'].every(c=>['skill','burst'].every(sl=>sk.some(s=>s.cls===c&&s.slot===sl)))&&sk.every(s=>s.lv===(id==='ocelo'?45:46)&&s.el===(id==='ocelo'?'fire':'water')));
}
W.join('a',{name:'Tanker',look:{cls:'warrior'},save:{level:50}}); W.join('b',{name:'Runner',look:{cls:'archer'},save:{level:50}});
const T=x.ARENA_TIDE;
const KEY={jaguar:['tele:slam','mode:1','tele:rake','tele:geyser','zone:ember','tele:line','mode:2','summon:jaguaracolyte'],
  tidecaller:['wall','zone:whirl','tele:quake','mode:6','pfx:push','summon:tidespirit']};
for(const row of x.EW_BOSS_ROWS){
  const A={x:T.x+120+(row.kit==='jaguar'?0:300),z:T.z,r:24,key:row.arena+'x'}; A.h=x.getH(A.x,A.z); x.ARENAS.push(A);
  const B=x.makeBossS(row,A); x.BOSSES.push(B); x.MONS.push(B.m); const m=B.m, seen=new Set(), mons0=new Set(x.MONS.map(q=>q.id)); evs.length=0;
  const put=()=>{ const py=x.getH(A.x,A.z); W.setPos('a',[A.x+4,py,A.z,Math.PI/2,0,0]); W.setPos('b',[A.x-9,py,A.z+3,Math.PI/2,0,0]); };
  const run=secs=>{ for(let i=0;i<secs*20;i++){ put(); tick(1);
    for(const e of evs.splice(0)){ if(e[0]==='tele') seen.add('tele:'+e[2]); else if(e[0]==='zone') seen.add('zone:'+e[2]); else if(e[0]==='pfx') seen.add('pfx:'+e[2]); else if(e[0]==='wall') seen.add('wall'); else if(e[0]==='hurt') seen.add('hurt'); }
    if(B.mode) seen.add('mode:'+B.mode);
    for(const q of x.MONS) if(!mons0.has(q.id)&&q.temp) seen.add('summon:'+q.def.id); } };
  put(); tick(2); run(30); const engaged=B.engaged;
  m.hp=m.maxHp*0.55; run(3); const p2=B.phase===2; run(40);
  m.hp=m.maxHp*0.25; run(3); const p3=B.phase===3&&B.enraged; run(40);
  ok(row.kit+': engages, reaches phase 2 and the enraged phase 3',engaged&&p2&&p3);
  const miss=KEY[row.kit].filter(k=>!seen.has(k)); ok(row.kit+': its own moves all happen',!miss.length,miss.length?'missing '+miss.join(', '):[...seen].sort().join(' '));
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
  ok(row.kit+': reset when nobody is left, everything cleared',!B.engaged&&B.phase===1&&B.mode===0&&B.aux===0&&!B.zones.length&&!B.walls.length&&!B.orbs.length&&!B.tele.length&&!B.q.length&&!B.adds.length&&m.hp===m.maxHp);
}
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
