// Headless test of the six bosses' move sets, straight from src/ (no build): each boss is fought through its three phases by two players that
// cannot die; the test records what it does (telegraph kinds, zones, walls, orbs, effects on players, modes, summons) and checks that every boss
// has moves no other boss has, that its signature moves happen, and that everything is cleaned up when the fight ends.
// Usage: node tools/boss-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},['MONS','BOSSES','BOSS_DEFS','ARENAS','ARENA_TIDE','getH','zoneAt','edgeZoneAt','SKILLS','BOSS_SKILLS','MATS']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=(n)=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.maxHp=1e7; p.hp=1e7; p.dead=false; } } };   // (a player who dies would reset the fight)
W.join('a',{name:'Tanker',look:{cls:'warrior'},save:{level:30}}); W.join('b',{name:'Runner',look:{cls:'archer'},save:{level:30}});
W.receive('a',{t:'dev',cmd:'vale',v:2}); W.receive('a',{t:'dev',cmd:'north',v:2}); W.receive('b',{t:'dev',cmd:'vale',v:2}); W.receive('b',{t:'dev',cmd:'north',v:2}); tick(2);
ok('six bosses, each with its own kit',x.BOSSES.length===6&&new Set(x.BOSS_DEFS.map(b=>b.kit)).size===6&&x.BOSSES.every(B=>B.kit&&typeof B.kit.tick==='function'),x.BOSS_DEFS.map(b=>b.kit).join(' '));
const A=x.ARENA_TIDE, tide=x.BOSSES.find(B=>B.bd.kit==='tide');
ok('the Tide King lives on the beach: level 20, in the shore zone, in the sea-side south of the forest, on dry land',tide.bd.def.level===20&&A.z>340&&A.z<430&&x.getH(A.x,A.z)>1.5&&x.zoneAt(A.x,A.z)===A.zone&&x.edgeZoneAt(A.x+30,A.z-10)===A.zone,'arena at '+Math.round(A.x)+','+Math.round(A.z)+' h '+x.getH(A.x,A.z).toFixed(1));
ok('it plays the Rootwarden\'s music for now (theme boss15)',tide.bd.def.music==='boss15'&&!x.BOSS_DEFS.filter(b=>b!==tide.bd&&b.def.music).length);
ok('it drops its own six skills (a skill and a burst for each class)',(x.BOSS_SKILLS.carapax||[]).length===6&&['warrior','archer','mage'].every(c=>['skill','burst'].every(sl=>x.BOSS_SKILLS.carapax.some(id=>x.SKILLS[id].cls===c&&x.SKILLS[id].slot===sl))));
ok('and its material has a name',!!x.MATS.carapax&&/Claw/.test(x.MATS.carapax.name));

const sigs={};   // boss id -> Set of what it did
function fight(B){
  const m=B.m, Ar=B.A, seen=new Set(), mons0=new Set(x.MONS.map(q=>q.id)); evs.length=0;
  const put=()=>{ // two players: one in melee, one 9 m away on the other side
    const py=x.getH(Ar.x,Ar.z); W.setPos('a',[Ar.x+4,py,Ar.z,Math.PI/2,0,0]); W.setPos('b',[Ar.x-9,py,Ar.z+3,Math.PI/2,0,0]); };
  const run=(secs)=>{ for(let i=0;i<secs*20;i++){ put(); tick(1);
    for(const e of evs.splice(0)){ if(e[0]==='tele') seen.add('tele:'+e[2]); else if(e[0]==='zone') seen.add('zone:'+e[2]); else if(e[0]==='wall') seen.add('wall'); else if(e[0]==='proj') seen.add('orb:'+e[2]); else if(e[0]==='pfx') seen.add('pfx:'+e[2]); else if(e[0]==='hurt') seen.add('hurt'); }
    if(B.mode) seen.add('mode:'+B.mode); if(B.stunT>0) seen.add('stun');
    for(const q of x.MONS) if(!mons0.has(q.id)&&q.temp) seen.add('summon:'+q.def.id);
    if(m.immune&&B.mode===0) seen.add('immune'); } };
  put(); tick(2); run(30);                                        // phase 1
  const engaged=B.engaged;
  m.hp=m.maxHp*0.55; run(3);                                      // phase 2
  const p2=B.phase===2;
  run(30);
  if(B.bd.kit==='roots'){ for(const t of B.totems) t.dead=true; run(2); }   // break the shield
  for(let i=0;i<40*20&&(m.immune||B.busy>0||B.mv||B.stunT>0);i++) run(0.05);   // let a flight / burrow end
  m.hp=m.maxHp*0.25; run(3);                                      // phase 3
  const p3=B.phase===3&&B.enraged;
  run(35);
  return {seen,engaged,p2,p3};
}
const KEY={ // what each boss must do (its signature), and what no other boss does
  roots:{must:['tele:root','tele:slam','mode:3','summon:totem','summon:thornling'],only:['tele:root','mode:3','summon:totem']},
  tide:{must:['wall','tele:geyser','mode:2','summon:crabhatch','zone:whirl','pfx:push'],only:['wall','tele:geyser','zone:whirl','summon:crabhatch']},
  oni:{must:['tele:slam','mode:1','zone:ember','tele:donut','tele:mark','summon:oniimp'],only:['zone:ember','tele:mark','summon:oniimp']},
  kitsune:{must:['orb:foxfire','mode:2','tele:line','summon:foxkit'],only:['orb:foxfire','summon:foxkit']},
  rime:{must:['tele:icefall','tele:prison','pfx:root','zone:whiteout','mode:4','stun','tele:donut','summon:frostthrall'],only:['tele:icefall','tele:prison','zone:whiteout','summon:frostthrall']},
  wyrm:{must:['tele:gust','pfx:push','tele:breath','mode:1','tele:line','stun','zone:blizzard','mode:5','summon:warmcore','summon:wyrmling'],only:['tele:gust','tele:breath','zone:blizzard','summon:warmcore','summon:wyrmling']}};
for(const B of x.BOSSES){
  const kit=B.bd.kit, r=fight(B); sigs[kit]=r.seen;
  ok(kit+': engages, reaches phase 2 and the enraged phase 3',r.engaged&&r.p2&&r.p3);
  const miss=KEY[kit].must.filter(k=>!r.seen.has(k)); ok(kit+': its own moves all happen',!miss.length,miss.length?'missing '+miss.join(', '):[...r.seen].filter(k=>k!=='hurt').sort().join(' '));
  ok(kit+': it hurts the players',r.seen.has('hurt'));
  // players leave: reset, and nothing it set up remains
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
  ok(kit+': reset when nobody is left in the arena, everything cleared',!B.engaged&&B.phase===1&&B.mode===0&&!B.zones.length&&!B.walls.length&&!B.orbs.length&&!B.tele.length&&!B.q.length&&!B.adds.length&&!B.totems.length&&!B.m.immune&&B.m.hp===B.m.maxHp&&B.busy===0);
}
for(const kit of Object.keys(KEY)){
  const others=Object.keys(KEY).filter(k=>k!==kit), mine=KEY[kit].only.filter(k=>!others.some(o=>sigs[o].has(k)));
  ok(kit+': moves no other boss has ('+KEY[kit].only.length+')',mine.length===KEY[kit].only.length,mine.join(' '));
}
// a real kill: the boss is defeated, its skills and material can drop, and it leaves nothing behind
{ const B=tide, m=B.m, Ar=B.A, py=x.getH(Ar.x,Ar.z); W.setPos('a',[Ar.x+4,py,Ar.z,Math.PI/2,0,0]); tick(3); m.hp=1; W.receive('a',{t:'atk',k:'basic',tg:m.id,face:Math.PI/2}); m.immune=false;
  for(let i=0;i<400&&!m.dead;i++){ W.setPos('a',[m.x+m.T.rad+1.2,py,m.z,Math.PI/2,0,0]); W.receive('a',{t:'atk',k:'basic',tg:m.id,face:Math.PI/2}); tick(1); }
  tick(3); ok('the Tide King can be killed, and leaves nothing behind',m.dead&&!B.zones.length&&!B.walls.length&&!B.orbs.length&&!B.tele.length&&!B.q.length&&!B.adds.length); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
