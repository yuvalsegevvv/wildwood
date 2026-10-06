// Headless test of the elemental reactions (server straight from src/, no build): the chart, auras, reactions, the flavours as shared statuses, direct application, and the guards. One line per check.
// Usage: node tools/reactions-smoke.js        (plan and rules: docs/REACTIONS.md)
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(pid==='a'&&c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','S','damageMonsterS','statusS','resolveFxS','hurtP','killMonsterS','psP','PASSIVES','getH','ELEM_LIST','RX_ON','RX_CHART','RX_BAD','RX_FLAVORS','RX_ST_CAP','RX_AURA_DUR','RX_REACT_K','RX_ICD',
   'defineReaction','rxChartMissing','rxEffect','rxPairKey','rxChartOf','rxStatusS','rxVulnK','rxWeakK','rxClearS','DMG_TAKEN_MIN']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const count=(name,id)=>evs.filter(e=>e[0]===name&&e[1]===id).length;
const quiet=fn=>{ const w=console.warn; console.warn=()=>{}; try{ return fn(); } finally{ console.warn=w; } };
const still=fn=>{ const R=Math.random; Math.random=()=>0.5; try{ return fn(); } finally{ Math.random=R; } };   // no damage spread, no crits: the same hit every time

// ---- the chart (shared, pure) ----
ok('chart: all fifteen pairs of the six elements exist and none is missing',Object.keys(x.RX_CHART).length===15&&x.rxChartMissing().length===0&&x.RX_BAD.length===0,x.RX_BAD.map(b=>b.id+': '+b.why).join(' | '));
ok('chart: every element has a flavour, the elements are the six of the wheel',x.ELEM_LIST.length===6&&x.ELEM_LIST.every(e=>x.RX_FLAVORS[e])&&Object.keys(x.RX_FLAVORS).length===6);
ok('chart: a pair is the same in either order and carries a name',x.rxChartOf('water','fire')===x.rxChartOf('fire','water')&&x.rxPairKey('water','fire')==='fire|water'&&Object.values(x.RX_CHART).every(r=>r.name&&r.k>0&&r.k<=1));
ok('chart: the two first-draft overrides (Steam bursts, Eclipse at full strength)',x.rxChartOf('fire','water').burst>0&&x.rxChartOf('dark','light').k===1&&x.rxChartOf('fire','earth').k===x.RX_REACT_K&&!x.rxChartOf('fire','earth').burst);
quiet(()=>{
  const before=Object.keys(x.RX_CHART).length;
  x.defineReaction({a:'fire',b:'fire',name:'Same'}); x.defineReaction({a:'fire',b:'lava',name:'Nope'}); x.defineReaction({a:'fire',b:'water',name:'Again'}); x.defineReaction({a:'dark',b:'earth',name:''}); x.defineReaction({a:'dark',b:'earth',name:'X',k:2});
  ok('registry: a bad row (same element, unknown element, a repeated pair, no name, k out of range) is left out and listed, the chart stays whole',x.RX_BAD.length===5&&Object.keys(x.RX_CHART).length===before&&x.rxChartOf('fire','water').name==='Steam',x.RX_BAD.map(b=>b.id).join(' '));
  x.RX_BAD.length=0;
});
{ const s=x.rxEffect('fire',0.7), w=x.rxEffect('water',0.7), e=x.rxEffect('earth',0.7), l=x.rxEffect('light',0.7), d=x.rxEffect('dark',1), a=x.rxEffect('air',0.7);
  ok('flavours: strength scales the size of burn, weak and vuln and the time of slow and stun; spread has none',near(s.burn.k,0.175)&&s.burn.dur===4&&near(w.slow,2.1)&&near(e.stun,0.7)&&near(l.vuln.v,0.14)&&l.vuln.dur===6&&near(d.weak.v,0.25)&&a.spread===true&&x.rxEffect('basic',1)===null); }

// ---- a world to hit ----
inbox.a=[]; inbox.b=[]; W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:25}}); W.join('b',{name:'Helper',look:{cls:'archer'},save:{level:25}}); tick(1);
const p=W.players.get('a'), q=W.players.get('b');
const norm=x.MONS.filter(m=>!m.boss&&!m.T.heavy&&!m.inst), boss=x.MONS.find(m=>m.boss);
const [m1,m2,m3,m4]=norm.filter(m=>m.def.id==='slime').slice(0,1).concat(norm.filter(m=>m.def.id==='boar').slice(0,1),norm.filter(m=>m.def.id==='shroom').slice(0,1),norm.filter(m=>m.def.id==='magmaslime').slice(0,1));
const fresh=m=>{ x.rxClearS(m); m.dead=false; m.remove=false; m.hp=1e9; m.maxHp=Math.max(m.maxHp,1e9); m.burnT=0; m.slowT=0; m.stunT=0; m.burnMult=0; m.inst=0; m.immune=false; return m; };
const hit=(m,el,mult,pl)=>x.damageMonsterS(m,mult||1,pl||p,m.x+1,m.z,0,el);
ok('the world has monsters to test with',!!(m1&&m2&&m3&&m4&&boss),[m1,m2,m3,m4,boss].map(m=>m&&m.def.id).join(' '));
[m1,m2,m3,m4,boss].forEach(fresh);

// ---- auras ----
hit(m1,'basic'); hit(m1,undefined);
ok('an element-less hit leaves no aura and starts nothing',!m1.aura);
tick(3); const a0=count('aura',m1.id);
hit(m1,'fire'); tick(3);
ok('a hit of an element leaves an aura of it (6 s) and tells the clients once',m1.aura&&m1.aura.el==='fire'&&near(m1.aura.until-x.S.t,x.RX_AURA_DUR,0.5)&&count('aura',m1.id)===a0+1&&evs.some(e=>e[0]==='aura'&&e[1]===m1.id&&e[2]==='fire'&&e[3]===x.RX_AURA_DUR),'aura events '+(count('aura',m1.id)-a0));
{ const u=m1.aura.until, n0=count('aura',m1.id); x.S.t+=0.5; hit(m1,'fire'); tick(3);
  ok('the same element refreshes the aura and sends no new event while it has most of its time',m1.aura.el==='fire'&&m1.aura.until>u&&count('aura',m1.id)===n0); }
{ fresh(m1); const n0=count('aura',m1.id), e0=evs.length; for(let i=0;i<24;i++){ x.S.t+=0.25; hit(m1,'fire'); } tick(3);
  ok('a zone ticking for six seconds sends a few aura events, not one a hit',count('aura',m1.id)-n0<=3,(count('aura',m1.id)-n0)+' events for 24 hits'); }

// ---- reactions ----
fresh(m1); const r0=count('react',m1.id), d0=evs.filter(e=>e[0]==='dmg'&&e[1]===m1.id).length, hp0=m1.hp;
hit(m1,'fire'); hit(m1,'water'); tick(3);
ok('fire then water react once: Steam, the aura is consumed, the second hit leaves none',count('react',m1.id)===r0+1&&evs.some(e=>e[0]==='react'&&e[1]===m1.id&&e[2]==='fire|water')&&!m1.aura,'aura '+JSON.stringify(m1.aura));
ok('a reaction applies both flavours: burn (fire) and slow (water), and Steam bursts for extra damage',m1.burnT>0&&m1.slowT>0&&evs.filter(e=>e[0]==='dmg'&&e[1]===m1.id).length===d0+3,'dmg events '+(evs.filter(e=>e[0]==='dmg'&&e[1]===m1.id).length-d0)+' (2 hits + 1 burst)');
ok('the burst left no aura of its own (nothing chains)',!m1.aura);
fresh(m2); hit(m2,'earth'); hit(m2,'light');
ok('earth then light (Flint): both flavours at 0.7: a stun of 0.7 s and a vulnerability of 14%',near(m2.stunT,0.7,0.06)&&m2.st&&near(m2.st.vuln.v,0.14,1e-6)&&evs.length>0);
fresh(m2); hit(m2,'dark'); hit(m2,'light');
ok('dark and light (Eclipse) are at full strength: weak 25% and vuln 20%',m2.st&&near(m2.st.weak.v,0.25)&&near(m2.st.vuln.v,0.20));
fresh(m2); hit(m2,'fire'); hit(m2,'water'); tick(3); const icdR=count('react',m2.id); hit(m2,'fire'); hit(m2,'water'); tick(3);
ok('the same pair does not react again within its cooldown (the aura stays)',count('react',m2.id)===icdR&&m2.aura&&m2.aura.el==='fire',m2.aura&&m2.aura.el);
x.S.t+=x.RX_ICD+0.1; hit(m2,'water'); tick(3);
ok('...and reacts again once it is over',count('react',m2.id)===icdR+1&&!m2.aura);
fresh(m2); hit(m2,'fire'); hit(m2,'water'); x.S.t+=0.5; hit(m2,'earth'); hit(m2,'air'); tick(3);
ok('a different pair has its own cooldown',count('react',m2.id)>=2&&evs.some(e=>e[0]==='react'&&e[1]===m2.id&&e[2]==='air|earth'));
{ fresh(m3); m3.burnT=3; m3.burnMult=0.5; m3.burnBy='a'; m3.burnEl='fire'; m3.burnTick=0.04; tick(3);
  ok('a burn tick deals damage but leaves no aura and reacts to nothing',m3.hp<1e9&&!m3.aura); }

// ---- vuln and weak (shared, no stacking) ----
const d1=still(()=>{ fresh(m4); return hit(m4,'basic'); });
const d2=still(()=>{ fresh(m4); x.rxStatusS(m4,'vuln',0.2,6,q); return hit(m4,'basic'); });
const d3=still(()=>{ fresh(m4); x.rxStatusS(m4,'vuln',0.2,6,q); return hit(m4,'basic',1,q); });
ok('vuln: the monster takes 20% more from the player who did not apply it, and from the one who did',d1>0&&near(d2/d1,1.2,0.03)&&q.dmg>0&&d3>0,'x'+(d2/d1).toFixed(3));
{ fresh(m4); x.rxStatusS(m4,'vuln',0.2,6,p); const s0=m4.st.vuln.until;
  x.rxStatusS(m4,'vuln',0.1,6,q); ok('no stacking: a smaller vuln is ignored',near(m4.st.vuln.v,0.2)&&m4.st.vuln.until===s0&&m4.st.vuln.by==='a');
  x.S.t+=2; x.rxStatusS(m4,'vuln',0.2,6,q); ok('no stacking: an equal one only refreshes the time (two sources never add)',near(m4.st.vuln.v,0.2)&&m4.st.vuln.until>s0);
  x.rxStatusS(m4,'vuln',0.25,6,q); ok('no stacking: a larger one replaces it',near(m4.st.vuln.v,0.25)&&m4.st.vuln.by==='b');
  x.rxStatusS(m4,'vuln',0.9,6,q); ok('a status is capped (vuln 30%)',near(m4.st.vuln.v,x.RX_ST_CAP.vuln)); }
{ fresh(m4); x.rxStatusS(m4,'weak',0.25,6,p);
  const lose=(m)=>{ p.hp=p.maxHp; p.dead=false; x.hurtP(p,200,m); return p.maxHp-p.hp; };
  fresh(m3); const full=lose(m3), weak=lose(m4);
  ok('weak: a weakened monster deals 25% less',full>0&&near(weak/full,0.75,0.04),weak+' vs '+full);
  const red=p.red; p.red=0.99; fresh(m3); const f2=lose(m3), w2=lose(m4); p.red=red;
  ok('the 10% damage-taken floor still holds with a weakened monster (at least 10% of the weakened hit)',w2>=Math.round(200*0.75*x.DMG_TAKEN_MIN*0.9)&&near(w2/f2,0.75,0.2),w2+' vs '+f2); }
{ fresh(m4); x.rxStatusS(m4,'weak',0.25,6,p); x.S.t+=7; ok('a status ends by itself',x.rxWeakK(m4)===1&&x.rxVulnK(m4)===0); }

// ---- direct application ----
fresh(m1); x.statusS(m1,{flavor:'light'},p,'light',1);
ok('flavor: a skill entry applies its element\'s flavour at full strength (light: vuln 20%) with no partner',m1.st&&near(m1.st.vuln.v,0.2));
fresh(m1); x.statusS(m1,{flavor:'water'},p,'water',1); x.statusS(m1,{flavor:'earth'},p,'earth',1);
ok('flavor: slow 3 s and stun 1 s at full strength',near(m1.slowT,3)&&near(m1.stunT,1));
fresh(boss); x.statusS(boss,{flavor:'earth'},p,'earth',1); x.statusS(boss,{status:{kind:'stun',dur:2}},p,'earth',1); x.statusS(boss,{flavor:'dark'},p,'dark',1);
ok('a boss takes weak but is never stunned (earth flavour and a stun status do nothing)',!(boss.stunT>0)&&boss.st&&near(boss.st.weak.v,0.25));
fresh(m1); x.statusS(m1,{status:{kind:'vuln',v:0.12,dur:5}},p,'light',1); x.statusS(m1,{status:{kind:'bogus',v:9,dur:5}},p,'light',1);
ok('status: a general status by name (vuln 12%); an unknown kind is ignored',m1.st&&near(m1.st.vuln.v,0.12)&&Object.keys(m1.st).length===1);
fresh(m1); x.statusS(m1,{flavor:'fire',burn:{dur:2,k:0.1}},p,'fire',1);
ok('flavor and the old keys work together on one entry',m1.burnT>0&&m1.burnMult>=0.25-1e-9);
{ fresh(m2); W.setPos('a',[m2.x,x.getH(m2.x,m2.z),m2.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null;
  x.resolveFxS(p,{fx:{ring:{r:3,flavor:'dark'}},mult:1,range:5,el:'dark',aim:[0,0,-1],sid:'x'},null);
  ok('a skill\'s fx ring with flavor: the hit leaves its dark aura and the weak status lands',m2.aura&&m2.aura.el==='dark'&&m2.st&&near(m2.st.weak.v,0.25)); }

// ---- the guards ----
{ fresh(boss); hit(boss,'fire'); hit(boss,'earth'); ok('a boss reacts like any monster, but the earth flavour does not stun it',boss.aura===null&&!(boss.stunT>0)&&boss.burnT>0); }
{ [m1,m2,m3].forEach(fresh); m2.x=m1.x+3; m2.z=m1.z; m3.x=m1.x+30; m3.z=m1.z;
  hit(m1,'fire'); hit(m1,'air'); tick(3);
  ok('spread: fire then air (Wildfire) copies the fire aura onto the monster 3 m away, not onto the one 30 m away',m2.aura&&m2.aura.el==='fire'&&!m3.aura&&!m1.aura);
  ok('spread never starts a reaction by itself (the neighbour was not damaged and has no flavour)',!(m2.burnT>0)&&!m2.st); }
{ [m1,m2].forEach(fresh); m2.x=m1.x+3; m2.z=m1.z; m2.inst=7;
  hit(m1,'fire'); hit(m1,'air');
  ok('spread stays inside a dungeon run: a monster of another run is left alone',!m2.aura,m2.aura&&m2.aura.el); m2.inst=0; }
{ [m1,m2].forEach(fresh); m2.x=m1.x+3; m2.z=m1.z; m2.aura={el:'water',until:x.S.t+5,by:'a'};
  hit(m1,'fire'); hit(m1,'air'); ok('spread does not overwrite another element\'s aura',m2.aura.el==='water'); }
{ fresh(m2); hit(m2,'fire'); x.killMonsterS(m2,p); ok('death clears the aura, the statuses and the cooldowns',m2.aura===null&&m2.st===null&&m2.rxIcd===null&&m2.dead); }
{ fresh(m1); m1.dead=true; hit(m1,'fire'); const gone=!m1.aura; m1.dead=false; ok('a dead monster takes no aura',gone); }

// ---- what a kit can add: passives with the stats rxk and rxicd ----
{ x.PASSIVES.rxtest={name:'t',lv:18,price:0,stat:'rxk',v:[0.5,0],text:'{}%'}; x.PASSIVES.rxtest2={name:'t2',lv:18,price:0,stat:'rxicd',v:[0.5,0],text:'{}%'};
  p.level=25; p.gear.skills.owned.push('rxtest','rxtest2'); p.gear.skills.pass=['rxtest'];
  fresh(m2); hit(m2,'earth'); hit(m2,'light'); const strong=m2.st.vuln.v; const stunB=m2.stunT;
  ok('rxk: a passive makes the reactions you trigger stronger (vuln 14% becomes 21%)',near(strong,0.21,1e-6)&&stunB>0.9,strong.toFixed(3));
  p.gear.skills.pass=['rxtest2']; fresh(m2); hit(m2,'fire'); hit(m2,'water'); const t0=x.S.t; const key='fire|water', until=m2.rxIcd[key];
  ok('rxicd: a passive shortens the cooldown of what you trigger (3 s becomes 1.5 s)',near(until-t0,x.RX_ICD*0.5,0.05),(until-t0).toFixed(2));
  p.gear.skills.pass=[]; delete x.PASSIVES.rxtest; delete x.PASSIVES.rxtest2; }

// ---- a hybrid reacts with itself, a solo player's way to react ----
{ fresh(m1); hit(m1,'air',1,p); hit(m1,'dark',1,p);
  ok('a hybrid set (air, then dark) reacts with itself: Dusk, with the monster weakened',m1.st&&near(m1.st.weak.v,0.175,1e-6)&&!m1.aura); }

// ---- the master switch and the quiet of everyone else ----
{ [m1,m3].forEach(fresh); hit(m3,'basic'); hit(m3,'basic'); tick(3); ok('a monster nobody hit with an element carries nothing',!m3.aura&&!m3.st&&!m3.rxIcd); }
ok('the server still runs after all of it (ticks, no throw)',(()=>{ try{ tick(20); return true; }catch(e){ console.log(e); return false; } })());
ok('reactions are on by default (RX_ON), one constant switches them off',x.RX_ON===true);

console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
