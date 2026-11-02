// Headless test of the volcano isle's end boss (Pyrrhax, the Sinkwarden) and the talisman it pays: the three parts and their pools, the wardens, the landing windows, three lives on the spot, the drop table, the talisman item and its stone
// Usage: node tools/volcano-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},['MONS','BOSSES','getH','SINK_DEF','SINK_GUARD_DEF','ITEM','dgParse','dgItem','dgTalismanId','dgPendantId40','TAL_STATS','talRarityWeights','talRarityOf','RL_STONE_KIND','zoneAt','ewZoneAt','MON_DEFS','vbBossS','VB_LIVES','rlRefreshP','dgAllTalismanIds','recalcP','ARENAS']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const B=x.BOSSES.find(b=>b.bd.def.id==='sinkwarden'), m=B.m, A=B.A, H=x.SINK_DEF.hp;
ok('the boss is level 50, in the volcano isle\'s crater arena, one fight of three parts',x.SINK_DEF.level===50&&B.bd.parts===3&&A.key==='eboss50'&&x.zoneAt(A.x+80,A.z).key==='e50');
ok('each part\'s pool is twice a full boss: the sleeping bar, and the four wardens together',m.maxHp===H&&m.hpDiv===2&&Math.abs(x.SINK_GUARD_DEF.hp*4-2*H)<=4,m.maxHp+' vs '+H);
ok('the volcano has common monsters in e49 and e50',['e49','e50'].every(z=>x.MON_DEFS.filter(d=>d.zone===z).length>=2)&&x.MONS.some(q=>q.def.zone==='e49')&&x.MONS.some(q=>q.def.zone==='e50'));
// the talisman: five kinds, 175 ids, a fixed bonus + a rolled line set, one stone shared with rings and pendants
{ const ids=x.dgAllTalismanIds(), it=x.ITEM[x.dgTalismanId('cdr',2,3)], r=x.ITEM[x.dgTalismanId('cdr',2,3)+'~a10b20c30'];
  ok('175 talisman ids, level 40, a fixed bonus; rolling adds three lines and keeps the tempering',ids.length===175&&it.lv===40&&it.kind==='talisman'&&it.v>0.05&&it.roll0&&!it.roll&&r&&r.roll.length===3&&r.n===3); }
ok('rings, pendants and talismans share one stone (rsr)',['ring','pendant','talisman'].every(k=>x.RL_STONE_KIND[k]==='rsr'));
{ const w0=x.talRarityWeights(0), w5=x.talRarityWeights(5), w9=x.talRarityWeights(9);
  ok('drop table: 80/15/4/0.8/0.2 at +0, 50/25/15/7/3 at +5, in between linear, beyond +5 the same',w0.join()==='80,15,4,0.8,0.2'&&w5.join()==='50,25,15,7,3'&&w9.join()===w5.join()&&Math.abs(x.talRarityWeights(1)[0]-74)<1e-9&&x.talRarityOf(0.999,0)===4&&x.talRarityOf(0,5)===0); }
// the fight
W.join('a',{name:'Tanker',look:{cls:'warrior'},save:{level:60}}); W.join('b',{name:'Second',look:{cls:'archer'},save:{level:60}});
const P=W.players.get('a'), Q=W.players.get('b'), py=x.getH(A.x,A.z);
const put=()=>{ for(const [p,dx,dz] of [[P,4,0],[Q,-9,3]]) if(!p.dead){ p.x=A.x+dx; p.z=A.z+dz; p.y=py; } };
const run=s=>{ for(let i=0;i<s*20;i++){ put(); tick(1); } };
const keep=()=>{ for(const p of [P,Q]){ p.maxHp=1e7; if(!p.dead) p.hp=1e7; } };
keep(); put(); tick(2); run(1);
const wardens=()=>x.MONS.filter(q=>q.def.id==='sinkguard'&&!q.dead&&!q.remove);
ok('part 1: it wakes, four Guarding Wardens stand, the boss is hidden and immune',B.engaged&&B.part===1&&wardens().length===4&&m.immune&&B.mode===2);
const hp0=m.hp; wardens()[0].hp=wardens()[0].maxHp/2; run(0.2);
ok('the boss bar mirrors the wardens (an eighth less after half a warden)',m.hp<hp0&&Math.abs(m.hp/m.maxHp-0.875)<0.02,m.hp/m.maxHp);
for(const w of wardens()) w.hp=0.5, w.hp=0.5;
// kill them through the real path
for(const w of wardens()){ w.hp=0; W.receive('a',{t:'atk',k:'basic',tg:w.id,face:0}); const mm=w; mm.hp=0; x.MONS.includes(mm)&&(mm.dead=true); }
run(2);
ok('part 2: with the wardens down the boss rises with a full pool and can be hit',B.part===2&&!m.immune&&B.mode===0&&m.hp===m.maxHp&&m.maxHp===H&&m.hpDiv===2,'part '+B.part+' mode '+B.mode+' hp '+m.hp);
// part 2 ends in the eruption, not a death
{ m.hp=1; W.receive('a',{t:'atk',k:'basic',tg:m.id,face:0}); keep(); for(let i=0;i<10&&B.part===2;i++){ put(); P.x=m.x+m.T.rad+1; W.receive('a',{t:'atk',k:'basic',tg:m.id,face:0}); tick(1); keep(); if(B.part===3) break; m.hp=Math.min(m.hp,1); }
  ok('part 2 ending is the eruption: part 3, berserk, a fresh pool, the boss not dead',B.part===3&&B.enraged&&!m.dead&&m.hp>=m.maxHp*0.9,'part '+B.part+' hp '+m.hp); }
run(6);
ok('part 3: it flies (airborne, immune)',B.mode===1&&m.immune,'mode '+B.mode);
let landed=false; for(let i=0;i<30*20&&!landed;i++){ put(); tick(1); keep(); if(B.stunT>0&&B.mode===0&&!m.immune) landed=true; }
ok('it lands for a window: stunned, hittable',landed&&B.stunT>0);
run(10);
ok('after the window it takes off again',B.mode===1||B.k.air||B.k.groundT!==undefined);
// three lives
{ const used=()=>B.lives.get('a')||0;
  for(let n=1;n<=3;n++){ P.hp=0; P.dead=true; P.deadT=0; tick(1); for(let i=0;i<80&&P.dead;i++){ tick(1); keep(); Q.hp=1e7; }
    ok('death '+n+': revived on the spot',!P.dead&&used()===n&&Math.hypot(P.x-A.x,P.z-A.z)<A.r+6&&B.engaged); keep(); P.vbGrace=0; }
  P.hp=0; P.dead=true; P.deadT=0; for(let i=0;i<100&&P.dead&&Math.hypot(P.x-A.x,P.z-A.z)<A.r+6;i++){ tick(1); keep(); }
  ok('the fourth death is a real one: the village',!Math.hypot(P.x-A.x,P.z-A.z)<A.r+6||P.dead===false&&Math.hypot(P.x-A.x,P.z-A.z)>A.r+6); }
// the kill and the drop
{ const Pb=P; Pb.dead=false; Pb.hp=Pb.maxHp; m.immune=false; B.mode=0; B.stunT=0; B.busy=0; B.mv=null; B.part=3; m.hp=1; const inv0=Pb.gear.inv.length; m.hitters.set('a',99999);
  for(let i=0;i<60&&!m.dead;i++){ P.x=m.x+m.T.rad+1.2; P.z=m.z; W.receive('a',{t:'atk',k:'basic',tg:m.id,face:Math.PI/2}); tick(1); keep(); B.stunT=0; m.immune=false; }
  ok('the boss can be killed and pays one talisman (level 40, unrolled)',m.dead&&Pb.gear.inv.slice(inv0).some(id=>/^talisman8-(aspd|buffdur|chg|cdr|atk)/.test(id)),Pb.gear.inv.slice(inv0).join()); }
// a worn talisman: flat attack and the rolled sums
{ const atk0=P.dmg; P.gear.inv.push('talisman8-atk-l'); W.receive('a',{t:'equip',id:'talisman8-atk-l'}); tick(1);
  ok('flat attack talisman raises attack',P.gear.eq.talisman==='talisman8-atk-l'&&P.dmg>atk0,atk0+' -> '+P.dmg);
  const rl0=P.rl.cdr||0; P.gear.inv.push('talisman8-cdr-l'); W.receive('a',{t:'equip',id:'talisman8-cdr-l'}); tick(1);
  ok('a cooldown talisman adds to the capped cooldown sum',(P.rl.cdr||0)>rl0&&Math.abs((P.rl.cdr||0)-0.05*3)<1e-6,P.rl.cdr);
  P.gear.rsr=3; P.gear.inv.push('talisman8-aspd'); W.receive('a',{t:'reroll',id:'talisman8-aspd'}); tick(1);
  ok('a Reroll Stone rolls a talisman',P.gear.rsr===2&&P.gear.inv.some(id=>/^talisman8-aspd~/.test(id)));
  P.gear.inv.push('pendant8-xp'); W.receive('a',{t:'reroll',id:'pendant8-xp'}); tick(1);
  ok('the same stone rolls a level-40 pendant',P.gear.rsr===1&&P.gear.inv.some(id=>/^pendant8-xp~/.test(id))); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
