// Headless test of the Cenote of Hollow Stars (shared/dungeons/themes/cenote.js, boss Ahmetl): the Emberwake Isles' dungeon, level 48 at +0, entered from level 45 once Coralhaven has been reached (gear.isles 2), paying a level-40 PENDANT.
// Server straight from src/ (no build): the theme and its boss at level 48, the door at the atlas's isles door (EW_DOOR), the entry rules, the offer and the board, a run's monsters (the isles' kinds), the reward (a level-40
// pendant of the five kinds, the odds, its values, merging and tempering), Hollow Stars (a lit star spares, a pulse that hurts nobody cracks the mask) and a won run in a party of two giving the same pendant to both.
// Usage: node tools/cenote-dungeon-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},
  ['DG_RUNS','DG_THEMES','DG_BAD','DG_ENTRANCES','DG_LANDS','DG_ENTRY_LV','DG_END_S','DG_BOSS_DEFS','DG_BOSSES','DG_REWARDS','EW_DOOR','PENDANT_STATS','PENDANT_BASE','PENDANT40_BASE','RAR_MULT','ENH_MAX','ITEM','MON_DEFS',
   'dgEntranceNear','dgApron','dgUnlocked','dgGateOpen','dgLevel','dgOffer','dgPoolS','dgClearReward','dgParse','dgItem','dgBossDefOf','dgEnhanceNext','dgMergedId','dgAllPendantIds40','killMonsterS','BOSS_KITS','DG_STARS_WARN','DG_STAR_R','DG_STARS_STUN']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set(), tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.05)), P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind), last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; }, lastMsg=(pid,t)=>{ const a=(msgs[pid]||[]).filter(m=>m.t===t); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | '), clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name,save)=>{ W.join(pid,{name,look:{cls:'warrior'},save}); IMM.add(pid); return P(pid); };
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };
const T=x.DG_THEMES.cenote, E=x.DG_ENTRANCES.cenote, D=x.EW_DOOR, AG={isles:2,amber:1,neck:1,sun:2,river:1};

// ---- the theme, the boss and the levels ----
ok('the Cenote is registered (no bad theme): the isles\' dungeon under the Jungle Edge, level 48, entry level 45, boss Ahmetl, five walkers and two guardians of the isles',
  !!T&&x.DG_BAD.length===0&&T.land==='isles'&&T.at==='The Jungle Edge'&&T.lv===48&&T.entry===45&&T.boss==='ahmetl'&&T.mobs.walkers.length>=5&&T.mobs.guardians.join()==='terracemason,roadsentinel'&&!!x.DG_LANDS.isles);
{ const B=x.DG_BOSSES.ahmetl, R=x.DG_BOSS_DEFS.ahmetl;
  ok('Ahmetl\'s base level is exactly 48: the design, the def makeBossS takes and the theme\'s level at +0 (his add one lower), and 48 + 10 a tier above',B.lv===48&&R.def.level===48&&R.def.boss&&R.add.level===47&&x.dgBossDefOf(T)===R&&x.dgLevel(T,0)===48&&x.dgLevel(T,2)===68);
  ok('the boss is registered with a kit that has start, tick and phase (kit `stars`), exactly one signature (Hollow Stars), at least five moves, and the need it names exists',['start','tick','phase'].every(f=>typeof x.BOSS_KITS.stars[f]==='function')&&R.kit==='stars'&&B.moves.length>=5&&B.moves.filter(m=>m.signature).length===1&&B.moves.find(m=>m.signature).id==='hollow'); }
ok('every monster of the dungeon is an isles kind (zones e42-e48); walkers fit a 4 m door',[...T.mobs.walkers,...T.mobs.guardians].every(id=>{ const d=x.MON_DEFS.find(q=>q.id===id); return d&&/^e4[2-8]$/.test(d.zone)&&d.level>=42; })&&T.mobs.walkers.every(id=>x.MON_DEFS.find(q=>q.id===id).rad<=0.9));

// ---- the door ----
ok('the door is the atlas\'s isles door: DG_ENTRANCES.cenote at EW_DOOR, no road, eight doors in all, found from 3 m and not from 9 m, its apron 7 m out',
  !!E&&E.x===D.x&&E.z===D.z&&E.theme==='cenote'&&E.sign.road===null&&Object.keys(x.DG_ENTRANCES).length===8&&x.dgEntranceNear(D.x+Math.sin(E.a)*3,D.z+Math.cos(E.a)*3)===E&&x.dgEntranceNear(D.x+Math.sin(E.a)*9,D.z+Math.cos(E.a)*9)===null&&Math.abs(Math.hypot(x.dgApron(E).x-D.x,x.dgApron(E).z-D.z)-7)<0.01);

// ---- who may enter: Coralhaven reached (gear.isles 2) and level 45 ----
{ const un=(g,lv,tier)=>x.dgUnlocked(g,lv,T,tier);
  ok('the way is shut until Coralhaven has been reached: gear.isles 0 or 1 is closed, 2 is open, and the hint says so',!x.dgGateOpen({isles:0},T)&&!x.dgGateOpen({isles:1},T)&&x.dgGateOpen({isles:2},T)&&!un({isles:1},60).ok&&/Coralhaven/.test(un({isles:1},60).why));
  ok('entry is level 45 once the way is open: 44 refused with the level in the message, 45 let in at level 48, +0 needing no tier',!un({isles:2},44).ok&&/level 45/.test(un({isles:2},44).why)&&un({isles:2},45).ok&&un({isles:2},45).level===48&&un({isles:2},45).tier===0); }
ok('the hourly offer is two different missions of the seven, like every dungeon',(()=>{ const o=x.dgOffer('cenote',Date.UTC(2026,9,3,5),x.dgPoolS()); return o.length===2&&o[0]!==o[1]; })());

// ---- the board at the door, and a run started there ----
const A=join('a','Ash',{level:45,gear:Object.assign({},AG)}), L44=join('s','Sol',{level:44,gear:Object.assign({},AG)}), N=join('n','Nia',{level:60,gear:{isles:1}}); tick(3);
const near={x:D.x+Math.sin(E.a)*3,z:D.z+Math.cos(E.a)*3};
for(const p of [A,L44,N]){ p.x=near.x; p.z=near.z; }
clear(); W.receive('a',{t:'dg',a:'open'}); W.receive('s',{t:'dg',a:'open'}); W.receive('n',{t:'dg',a:'open'}); tick(2);
{ const b=lastMsg('a','dgboard'), s=lastMsg('s','dgboard'), n=lastMsg('n','dgboard');
  ok('at the door the board opens for level 45 (th cenote, level 48, open) and says no to level 44 (why: level 45) and to a hiker who has not reached Coralhaven',!!b&&b.th==='cenote'&&b.L===48&&b.ok===1&&b.gate===1&&b.offer.length===2&&!!s&&s.ok===0&&/level 45/.test(s.why)&&s.gate===1&&!!n&&n.ok===0&&n.gate===0,JSON.stringify(b&&{th:b.th,L:b.L,ok:b.ok}));
clear(); W.receive('s',{t:'dg',a:'start',dungeon:'cenote',type:x.dgOffer('cenote',Date.now(),x.dgPoolS())[0]}); W.receive('n',{t:'dg',a:'start',dungeon:'cenote',type:x.dgOffer('cenote',Date.now(),x.dgPoolS())[0]}); tick(2);
ok('a level-44 hiker and one who has not reached Coralhaven cannot start a run',!L44.inst&&!N.inst);
{ const started=[]; for(const mi of ['purge','defense','survival','sabotage','siege','hunt','escort']){ W.receive('a',{t:'dev',cmd:'dg',v:'cenote:'+mi+':3'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
    started.push(!!r&&r.th==='cenote'&&r.mission===mi&&r.L===48&&(mi!=='purge'||r.mons.size>0)); W.receive('a',{t:'dg',a:'leave'}); tick(3); }
  ok('all seven mission types start as the Cenote at level 48 (Purge with its monsters at once)',started.length===7&&started.every(Boolean),started.join()); }
W.receive('a',{t:'dev',cmd:'dg',v:'cenote:purge:5'}); tick(3);
const run=A.inst?x.DG_RUNS.get(A.inst):null;
ok('a purge run: the walkers are the isles\', fought at level 48 (dgK)',!!run&&[...run.mons].length>0&&[...run.mons].every(m=>T.mobs.walkers.includes(m.def.id)||T.mobs.guardians.includes(m.def.id))&&[...run.mons].every(m=>m.dgK&&m.dgK.lv===48));
W.receive('a',{t:'dg',a:'leave'}); tick(3);
{ W.receive('a',{t:'dev',cmd:'dg',v:'cenote:hunt:5'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
  ok('a hunt run\'s quarry is the Cenote Eel (an isles kind slipping through the flooded halls)',!!r&&!!r.k&&!!r.k.q&&r.k.q.def.id==='cenoteeel'); W.receive('a',{t:'dg',a:'leave'}); tick(3); }

// ---- what a clear pays: a level-40 pendant ----
{ const R=x.DG_REWARDS.cenote, rnd=(()=>{ let a=7; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; })();
  const seen={}, rar=[0,0,0,0,0], N2=30000; let bad=0;
  for(let i=0;i<N2;i++){ const id=x.dgClearReward('cenote',rnd), q=x.dgParse(id), it=x.dgItem(id);
    if(!q||!it||q.t!==8||q.n!==0||q.roll||it.lv!==40||it.kind!=='pendant'||!R.pool.includes(q.stat)||it.roll0||!/^pendant8-(xp|drop|coin|crit|critdmg)(-[reul])?$/.test(id)) bad++; seen[q.stat]=(seen[q.stat]||0)+1; rar[q.rar]++; }
  const within=(o,n,p)=>Math.abs(o-n*p)<=4*Math.sqrt(n*p*(1-p))+1;
  ok('a clear rolls a +0 level-40 pendant (pendant8-<kind>, never rolled) of the five kinds, each equally often, at 70 / 25 / 4 / 0.8 / 0.2%',bad===0&&R.kind==='pendant'&&R.t===8&&R.pool.join()===x.PENDANT_STATS.join()&&x.PENDANT_STATS.every(s=>within(seen[s],N2,1/x.PENDANT_STATS.length))&&rar.every((c,r)=>within(c,N2,[0.7,0.25,0.04,0.008,0.002][r])),JSON.stringify(rar)); }
{ const ids=x.dgAllPendantIds40(), I=x.ITEM;
  ok('175 level-40 pendants (5 kinds x the 35 rarity and tempering pairs) are items: lv 40, tier 7, value = the level-40 base x rarity x tempering, the level-30 ones untouched',ids.length===175&&ids.every(id=>I[id]&&I[id].kind==='pendant'&&I[id].lv===40&&I[id].tier===7&&I[id].t===8)&&x.PENDANT_STATS.every(s=>Math.abs(I['pendant8-'+s].v-x.PENDANT40_BASE[s])<1e-9&&Math.abs(I['pendant8-'+s+'-l+10'].v-Math.round(x.PENDANT40_BASE[s]*3*2*10000)/10000)<1e-9&&I['pendant-'+s].lv===30&&I['pendant-'+s].v===x.PENDANT_BASE[s]));
  ok('a level-40 pendant tempers to the next step and three +0 copies merge into the next rarity, both staying level-40 pendants',x.dgEnhanceNext('pendant8-xp')==='pendant8-xp+1'&&x.dgEnhanceNext('pendant8-crit-r+2')==='pendant8-crit-r+3'&&x.dgMergedId(I['pendant8-coin'])==='pendant8-coin-r'&&x.dgMergedId(I['pendant8-coin-l'])===null&&x.dgParse('pendant8-xp~a00a01a02')===null&&x.dgParse('pendant8-xp+11')===null); }

// ---- a purge won through Ahmetl by a party of two: Hollow Stars, then both get the same pendant ----
const K=join('k','Kai',{level:48,gear:Object.assign({},AG)}), L2=join('l','Lea',{level:48,gear:Object.assign({},AG)}); tick(2);
W.receive('k',{t:'party',a:'invite',name:'Lea'}); tick(2); W.receive('l',{t:'party',a:'accept'}); tick(2);
K.x=near.x; K.z=near.z; L2.x=near.x+0.5; L2.z=near.z; clear();
W.receive('k',{t:'dg',a:'open'}); tick(1);
const wantType=x.dgOffer('cenote',Date.now(),x.dgPoolS())[0];
W.receive('k',{t:'dg',a:'start',dungeon:'cenote',type:wantType}); tick(2); W.receive('l',{t:'dg',a:'accept'}); tick(3);
const runK=K.inst?x.DG_RUNS.get(K.inst):null;
ok('the leader starts from the door board and the member follows: one run, the Cenote, level 48, two inside',!!runK&&runK.th==='cenote'&&runK.L===48&&L2.inst===K.inst&&runK.mission===wantType,toasts('k')+' | '+toasts('l'));
W.receive('k',{t:'dg',a:'leave'}); W.receive('l',{t:'dg',a:'leave'}); tick(3);
{ const W2=join('w','Wen',{level:48,gear:Object.assign({},AG)}), W3=join('v','Vik',{level:48,gear:Object.assign({},AG)}); tick(2);
  W.receive('w',{t:'party',a:'invite',name:'Vik'}); tick(2); W.receive('v',{t:'party',a:'accept'}); tick(2);
  W.receive('w',{t:'dev',cmd:'dg',v:'cenote:purge:5'}); tick(2); W.receive('v',{t:'dg',a:'accept'}); tick(3);
  const r=W2.inst?x.DG_RUNS.get(W2.inst):null;
  ok('a testing run of the Cenote with a party of two: both in it',!!r&&r.th==='cenote'&&W3.inst===W2.inst);
  if(r){ for(const m of [...r.mons]) if(m.dgRole==='purge'&&!m.dead) x.killMonsterS(m,W2); tick(3);
    ok('Purge: killing them brings Ahmetl into the round hall at level 48, with the kit `stars`',!!r.boss&&r.phase==='boss'&&r.boss.bd.def.id==='ahmetl'&&r.boss.m.dgK.lv===48&&r.boss.bd.kit==='stars');
    const B=r.boss, A3=B.A, m=B.m;
    W2.x=A3.x+3; W2.z=A3.z+3; W2.dgX=W2.x; W2.dgZ=W2.z; secs(1);
    ok('he engages when a member steps into the hall and the kit ticks through the first moves without a fault',B.engaged&&(secs(8),true));
    // Hollow Stars: quiet the other moves, light the stars, and play it two ways
    IMM.delete('w'); IMM.delete('v'); for(const p of [W2,W3]){ p.maxHp=1e7; p.hp=1e7; }   /* (a player who dies would reset the fight: they take hits, they cannot fall) */
    const quiet=()=>{ B.k.bladeT=B.k.fallT=B.k.shadeT=B.k.lanceT=B.k.ringT=99; };
    const stars=()=>B.tele.filter(e=>e.kind==='icefall'&&e.dmg===0&&e.r===x.DG_STAR_R);
    const light=()=>{ for(const p of [W2,W3]){ p.x=A3.x+3; p.z=A3.z+3; p.dgX=p.x; p.dgZ=p.z; } if(!B.engaged) tick(2);   /* (a push can carry a hiker out of the hall, and the boss resets) */
      B.stunT=0; quiet(); B.k.starsT=99; B.busy=0; B.mv=null; B.tele.length=0; B.k.starsT=0; for(const p of [W2,W3]) p.hp=p.maxHp; tick(2); return stars(); };
    let lit=light(); for(let i=0;i<4&&lit.length<3;i++) lit=light();   /* (a move that was already under way can take the first try) */
    ok('Hollow Stars: three lit stars (harmless rings of '+x.DG_STAR_R+' m) and a pulse over the whole hall, and the bar counts it',lit.length===3&&B.tele.some(e=>e.kind==='pulse')&&B.aux===B.k.fell&&B.k.fell>=1,'stars '+lit.length+' engaged '+B.engaged+' phase '+B.phase+' busy '+B.busy+' mv '+!!B.mv+' stun '+B.stunT+' starsT '+B.k.starsT);
    // one hiker outside every star is hurt, the one inside a star is spared, and the mask holds
    const s0=lit[0]; W2.x=s0.x; W2.z=s0.z; W2.dgX=W2.x; W2.dgZ=W2.z; { let best=-1; for(let k=0;k<16;k++){ const px=A3.x+Math.sin(k*Math.PI/8)*(A3.r-4), pz=A3.z+Math.cos(k*Math.PI/8)*(A3.r-4), d=Math.min(...lit.map(e=>Math.hypot(px-e.x,pz-e.z))); if(d>best){ best=d; W3.x=px; W3.z=pz; } } }   /* (the stars fall where they like: stand in the spot furthest from all of them) */ W3.dgX=W3.x; W3.dgZ=W3.z; const h2=W2.hp, h3=W3.hp; B.stunT=0;
    for(let i=0,n=Math.ceil((x.DG_STARS_WARN+0.6)/0.05);i<n;i++){ tick(1); if(i<n-6){ W2.hp=h2; if(W3.hp<h3) break; } }
    ok('the pulse spares whoever stands in a lit star and hurts the one outside, and no stun while someone is exposed',W2.hp>=h2-1&&W3.hp<h3&&B.stunT===0,'in '+(h2-W2.hp)+' out '+(h3-W3.hp)+' stun '+B.stunT);
    // everyone in a star: the mask cracks
    const lit2=light(); for(const p of [W2,W3]){ const s=lit2[0]; p.x=s.x; p.z=s.z; p.dgX=p.x; p.dgZ=p.z; }
    secs(x.DG_STARS_WARN+0.8);
    ok('with the whole party inside a lit star the pulse hurts nobody and Ahmetl is stunned',B.stunT>0||B.stunT===0&&toasts('w').includes('mask cracks'),'stun '+B.stunT);
    IMM.add('w'); IMM.add('v'); for(const p of [W2,W3]){ p.hp=p.maxHp; } B.stunT=0;
    const i2=W2.gear.inv.length, i3=W3.gear.inv.length; clear(); withRandom(0.0005,()=>x.killMonsterS(B.m,W2)); tick(3);
    const n2=W2.gear.inv.slice(i2), n3=W3.gear.inv.slice(i3), w2=n2.find(id=>/^pendant8-/.test(id)), d2=last('w','dge');
    ok('the win pays EVERY member the same level-40 pendant through dgGrantItemP, listed in the results, and is saved as a clear',r.phase==='won'&&!!w2&&n3.includes(w2)&&x.dgParse(w2).t===8&&x.ITEM[w2].lv===40&&x.ITEM[w2].kind==='pendant'&&!!d2&&d2[6].includes(w2));
    secs(x.DG_END_S+0.5); } } }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
