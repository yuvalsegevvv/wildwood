// Headless test of the Deep Cave's 18 set skills (floors 2-4, step C4): each is registered with its set, floor, cost, element, method and (echo trials) feat; each is cast on a scripted fight and its effect
// is checked; none spends its set's mark; kill refunds stop at 15 charge a cast; a cast of the skill's own set earns double charge. Server straight from src/, no build.
// Usage: node tools/cave-sets-smoke.js
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(pid==='a'&&c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['CAVE_SKILLS','CAVE_SKILL_IDS','CAVE_BAD','CAVE_REFUND_CAP','caveChargeGain','caveLevelK','SS_SETS','SKILLS','MONS','AREAS','VIL','getH','S','ssMarkN','ssMarkSum','ssBehind','ssWhen','fxModK','hurtP','killMonsterS','allyP','rxWeakK','rxVulnK','healP','partyOf','skillPower','CAVE_CHARGE_K','defineCaveSkill']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const near=(a,b,e)=>Math.abs(a-b)<=(e===undefined?1e-6:e);
const IDS=['threshing','shadowstep','shieldwall','lighthouse','cutandrun','marionette','tidepool','intermission','soundcharge','eagleperch','stoppedhour','lampwindow','nightline','bellecho','blackice','landslide','embalm','nightshift'];
const PLAN={threshing:[2,'tansy',30,'H'],shadowstep:[2,'sazanka',25,'E'],shieldwall:[2,'torgeir',35,'F'],lighthouse:[2,'corvin',30,'A'],cutandrun:[2,'sabir',30,'G'],marionette:[2,'ottoline',35,'C'],
  tidepool:[3,'ambrose',35,'B'],intermission:[3,'marigold',30,'C'],soundcharge:[3,'dunstan',35,'F'],eagleperch:[3,'sorrel',30,'A'],stoppedhour:[3,'zahra',40,'D'],lampwindow:[3,'hollis',35,'E'],
  nightline:[4,'pell',30,'D'],bellecho:[4,'genzo',40,'C'],blackice:[4,'brynja',30,'G'],landslide:[4,'tamsin',35,'H'],embalm:[4,'nephra',40,'A'],nightshift:[4,'ogden',30,'F']};
const MARK={threshing:null,shadowstep:'barb',shieldwall:'fixation',lighthouse:'glare',cutandrun:'loot',marionette:'string',tidepool:'ripple',intermission:'applause',soundcharge:'fervor',eagleperch:'sight',
  stoppedhour:'grain',lampwindow:'vigil',nightline:'lure',bellecho:'toll',blackice:'rime',landslide:null,embalm:'linen',nightshift:'rot'};
// ---- the registry ----
ok('no cave skill was left out (CAVE_BAD is empty)',x.CAVE_BAD.length===0,x.CAVE_BAD.map(b=>b.id+': '+b.why).join(' | '));
ok('all 18 set skills exist, on the floor of their set (tier = floor - 1), with the plan\'s set, cost and method',IDS.every(id=>{ const s=x.CAVE_SKILLS[id], P=PLAN[id]; return s&&s.floor===P[0]&&s.set===P[1]&&s.cost===P[2]&&s.method===P[3]&&x.SS_SETS[P[1]]&&x.SS_SETS[P[1]].tier===P[0]-1&&s.desc&&s.slot==='cave'&&s.cls==='any'; }));
ok('each floor has six set skills and each set exactly one',[2,3,4].every(f=>IDS.filter(id=>x.CAVE_SKILLS[id].floor===f).length===6)&&new Set(IDS.map(id=>x.CAVE_SKILLS[id].set)).size===18);
ok('costs are 20-40 and every skill has an element (Tansy: none, her set is basic) and a description',IDS.every(id=>{ const s=x.CAVE_SKILLS[id]; return s.cost>=20&&s.cost<=40&&(id==='threshing'||s.el); }));
ok('the three echo-trial skills carry a feat (Ottoline 6 puppets, Marigold 5 Applause for 20 s, Genzo 4 taunted for 20 s); the others none',
  x.CAVE_SKILLS.marionette.feat.n===6&&x.CAVE_SKILLS.intermission.feat.n===5&&x.CAVE_SKILLS.intermission.feat.secs===20&&x.CAVE_SKILLS.bellecho.feat.n===4&&x.CAVE_SKILLS.bellecho.feat.secs===20
  &&IDS.filter(id=>PLAN[id][3]==='C').length===3&&IDS.filter(id=>x.CAVE_SKILLS[id].feat).length===3);
ok('the Amber Reach\'s three fill one empty place each on floors 2-4 (Burning Glass: B, Seam-Splitter: G, Tailwind: E), each reading its own set\'s mark and none spending it',
  [['burningglass',2,'brindle',30,'B','glint'],['seamsplitter',3,'dessa',35,'G','temper'],['tailwind',4,'sefi',30,'E','stride']].every(([id,f,set,c,m,mk])=>{ const s=x.CAVE_SKILLS[id]; return s&&s.floor===f&&s.set===set&&s.cost===c&&s.method===m&&s.el&&JSON.stringify(s.fx).includes('"id":"'+mk+'"')&&!/pop/.test(JSON.stringify(s.fx)); })
  &&[2,3,4].every(f=>'ABCDEFGH'.split('').filter(m=>Object.values(x.CAVE_SKILLS).some(s=>s.floor===f&&s.method===m)).length===7||Object.values(x.CAVE_SKILLS).filter(s=>s.floor===f&&s.set).length===8));
ok('the Emberwake Isles\' three take the last empty place on floors 2-4 (Slack Water: D, Ember Count: H, Cord Snare: B), each reading its own set\'s mark and none spending it: all eight methods now have a set skill on every floor',
  [['slackwater',2,'meleni',30,'D','swell'],['embercount',3,'tzaya',35,'H','tally'],['cordsnare',4,'atuqa',35,'B','knot']].every(([id,f,set,c,m,mk])=>{ const s=x.CAVE_SKILLS[id]; return s&&s.floor===f&&s.set===set&&s.cost===c&&s.method===m&&s.el&&s.desc&&JSON.stringify(s.fx).includes('"id":"'+mk+'"')&&!/pop/.test(JSON.stringify(s.fx)); })
  &&[2,3,4].every(f=>'ABCDEFGH'.split('').every(m=>Object.values(x.CAVE_SKILLS).some(s=>s.floor===f&&s.method===m&&s.set))));
{ const base={id:'zzprobe',name:'Probe',floor:2,method:'C',set:'tansy',cost:30,desc:'d',mult:1,range:5,fx:{ring:{r:3}}}, n0=x.CAVE_BAD.length;
  const bad=[{feat:{kind:'x'}},{feat:'no'},{fx:{ring:{r:3},refund:{n:3,secs:4,cap:16}}},{fx:{ring:{r:3},refund:{n:0,secs:4}}}].map((o,i)=>x.defineCaveSkill(Object.assign({},base,{id:'zzprobe'+i},o)));
  ok('a bad feat or a refund above the cap (15) is left out and listed',bad.every(v=>v===null)&&x.CAVE_BAD.length===n0+4); x.CAVE_BAD.length=n0; }
// ---- the world ----
const spot=new Map();
Math.random=()=>0.5;   // no spread, no crit: damage is exact
const tick=n=>{ for(let i=0;i<n;i++){ pin(); W.tick(0.05); if(!keepHp) for(const q of W.players.values()){ q.hp=q.maxHp; q.dead=false; } else for(const q of [p,b]) q.lastHit=1e9; } };   // (keepHp: no natural regeneration either)
let keepHp=false;
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:40}}); W.join('b',{name:'Berit',look:{cls:'warrior'},save:{level:40}}); tick(2);
const p=W.players.get('a'), b=W.players.get('b');
W.receive('a',{t:'party',a:'invite',name:'Berit'}); tick(3); W.receive('b',{t:'party',a:'accept'}); tick(3);
ok('a and b are one party',x.partyOf(p)&&x.partyOf(p)===x.partyOf(b));
for(const id of IDS) p.gear.cave.own[id]=1;
const D=x.MONS.filter(m=>!m.boss&&!m.inst&&!m.dead).slice(0,10), BOSS=x.MONS.find(m=>m.boss&&!m.inst);
function pin(){ for(const [m,s] of spot){ m.x=s[0]; m.z=s[1]; m.kbx=m.kbz=0; m.vx=m.vz=0; if(m.dead){ m.dead=false; m.remove=false; } m.aggro=false; m.tgt=null; } }
function reset(n,layout){   // n dummies in the layout [[dx,dz],...] ahead of the hero (facing +z); everything else cleared
  W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,Math.PI,0,0]); W.setPos('b',[x.VIL.x+2,x.getH(x.VIL.x+2,x.VIL.z),x.VIL.z,Math.PI,0,0]);
  for(const q of [p,b]){ q.dead=false; q.hp=q.maxHp; q.act=null; q.cd={basic:0,skill:0,burst:0,cave:0}; q.ssIcd={}; q.ally=null; q.shield=null; q.buff=null; q.cave.fx={}; q.cave.charge=100; q.cave.cur=null; q.lastMove=-99; q.face=Math.PI; }
  x.AREAS.length=0; spot.clear(); keepHp=false;
  D.forEach((m,i)=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e6; m.slowT=m.burnT=m.stunT=0; m.mk=m.st=m.aura=m.rxIcd=m.taunt=m.puppet=null; m.immune=false; m.aggro=false; m.face=0; m.kbx=m.kbz=0;
    if(i<n){ const L=layout[i]; m.x=p.x+L[0]; m.z=p.z+L[1]; m.y=x.getH(m.x,m.z); spot.set(m,[m.x,m.z]); } else { m.x=p.x+400+i*5; m.z=p.z+400; } });
  tick(1);
}
const ring=(n,r)=>Array.from({length:n},(_,i)=>{ const a=i/n*Math.PI*2; return [Math.sin(a)*r,Math.cos(a)*r]; });
const front=(n,d)=>Array.from({length:n},(_,i)=>[(i%3-1)*1.5,d+Math.floor(i/3)*1.5]);
const mark=(m,id,n)=>{ (m.mk||(m.mk={}))[p.id]=Object.assign(m.mk[p.id]||{},{[id]:{n,until:x.S.t+120}}); };
const marks=(id,n,ms)=>{ for(const m of ms||D) mark(m,id,n); };
const hpLost=m=>1e6-m.hp;
function cast(id,tg){ p.cd.cave=0; p.act=null; p.cave.charge=100; p.gear.skills.cave=id; p.cave.cur=null; W.receive('a',{t:'atk',k:'cave',tg:tg||null,face:Math.PI,aim:[0,0,1]}); }
const markSum=(id)=>D.reduce((s,m)=>s+x.ssMarkN(p,m,id),0);
// ---- all: the cost is spent exactly, no mark is spent, a set cast doubles the charge ----
for(const id of IDS){
  const s=x.CAVE_SKILLS[id], mid=MARK[id];
  reset(8,front(8,3)); if(mid) marks(mid,3,D.slice(0,8)); const before=D.slice(0,8).map(m=>mid?x.ssMarkN(p,m,mid):0);
  cast(id,D[0].id); tick(2);
  ok(id+': casting spends exactly its cost ('+s.cost+')',near(p.cave.charge,100-s.cost,0.01),String(p.cave.charge));
  tick(30);
  const after=D.slice(0,8).map(m=>mid?x.ssMarkN(p,m,mid):0);
  ok(id+': the set\'s mark ('+(mid||'none')+') is read, never spent',after.every((n,i)=>n>=before[i]),before.join('')+' -> '+after.join(''));
  const piece=Object.values(x.SKILLS).find(k=>k.set===s.set&&k.slot==='skill');
  ok(id+': a cast of a piece of '+s.set+' earns double charge with it equipped',piece&&near(x.caveChargeGain(piece,s),2*x.CAVE_CHARGE_K*piece.cd)&&near(x.caveChargeGain(x.SKILLS.whirlwind,s),x.CAVE_CHARGE_K*x.SKILLS.whirlwind.cd));
}
// ---- 1 Threshing Floor ----
{ const dmg=n=>{ reset(n,ring(n,5)); cast('threshing'); tick(14); return D.slice(0,n).map(hpLost); };
  const one=dmg(1)[0], ten=dmg(10);
  ok('Threshing Floor hits every enemy in 10 m',ten.every(v=>v>0),ten.join(','));
  ok('the crowd bonus: +6% for each enemy hit (10 enemies deal 1.6 / 1.06 of one enemy\'s hit)',near(ten[0]/one,1.6/1.06,0.05),(ten[0]/one).toFixed(3));
  reset(4,ring(4,7)); spot.clear(); const d0=D.slice(0,4).map(m=>Math.hypot(m.x-p.x,m.z-p.z)); cast('threshing'); let n=0; while(!D[0].kbx&&!D[0].kbz&&n++<30) tick(1);
  ok('and drags them in a little (the knock-back points at the hero)',D.slice(0,4).every(m=>m.kbx*(p.x-m.x)+m.kbz*(p.z-m.z)>0),D.slice(0,4).map(m=>m.kbx.toFixed(2)+','+m.kbz.toFixed(2)).join(' ')); }
function refundTest(id,kills,want,label){
  reset(8,ring(8,4)); spot.clear(); p.cave.charge=0; cast(id); tick(8); p.cave.charge=0; const c0=p.cave.charge;
  for(let i=0;i<kills;i++) x.killMonsterS(D[i],p);
  ok(label+': '+kills+' kills in the window refund '+want+' charge, never more than the cap ('+x.CAVE_REFUND_CAP+')',near(p.cave.charge-c0,want,0.01),String(p.cave.charge-c0)); return c0; }
refundTest('threshing',8,15,'Threshing Floor');
{ reset(8,ring(8,4)); spot.clear(); cast('threshing'); tick(100); p.cave.charge=0; x.killMonsterS(D[0],p); ok('Threshing Floor: a kill after the 4 s window refunds nothing',p.cave.charge===0); }
{ reset(3,front(3,3)); spot.clear(); cast('threshing'); tick(8); p.cave.charge=0; x.killMonsterS(D[0],p); ok('Threshing Floor: one kill gives 3',near(p.cave.charge,3,0.01),String(p.cave.charge)); }
// ---- 2 Shadow Step ----
{ reset(1,[[0,6]]); D[0].face=Math.atan2(-(p.x-D[0].x),-(p.z-D[0].z)); const z0=p.z; cast('shadowstep',D[0].id); tick(14);
  ok('Shadow Step blinks behind the target',p.z>D[0].z+0.5,'hero z '+(p.z-z0).toFixed(1)+' target at +6');
  ok('for 2 s every hit counts as from behind, even though the target turns to face the hero',x.ssBehind(p,D[0])&&x.ssWhen(p,D[0],{behind:true}));
  ok('and it leaves a Barb',x.ssMarkN(p,D[0],'barb')>=1);
  tick(60); ok('the window closes after 2 s',!x.ssBehind(p,D[0])); }
// ---- 3 Shield-Wall ----
{ reset(3,front(3,3)); marks('fixation',1,D.slice(0,1)); const m=D[0], hit=()=>{ const h=p.hp; x.hurtP(p,1000,m); const v=h-p.hp; p.hp=p.maxHp; return v; }; keepHp=true;
  const base=hit(); cast('shieldwall'); tick(14); const walled=hit();
  ok('Shield-Wall: a hit from the front takes 30% + 3% per Fixation (1 of them: 33%) less',near(walled/base,1-0.33,0.03),(walled/base).toFixed(3));
  m.x=p.x; m.z=p.z-3; const back=hit(); ok('a hit from behind is not reduced',near(back/base,1,0.02),(back/base).toFixed(3));
  ok('the enemies in 10 m are taunted',D.slice(0,3).every(n=>n.taunt&&n.taunt.by==='a'));
  tick(130); m.x=p.x; m.z=p.z+3; ok('after 6 s the wall is gone',near(hit()/base,1,0.02)); }
// ---- 4 Lighthouse ----
{ reset(4,ring(4,4)); cast('lighthouse'); tick(52); const g=D.slice(0,4).map(m=>x.ssMarkN(p,m,'glare'));
  ok('Lighthouse puts one Glare a second on the enemies in its beam (3 ticks in 2.6 s, spread over different enemies)',g.reduce((a,c)=>a+c,0)===3&&Math.max(...g)===1,g.join(''));
  ok('and burns what it crosses',D.slice(0,4).every(m=>hpLost(m)>0)); }
// ---- 5 Cut and Run ----
{ const run=loot=>{ reset(1,[[0,2.5]]); spot.clear(); marks('loot',loot,[D[0]]); const px=p.x,pz=p.z; cast('cutandrun',D[0].id); tick(14); return {lost:hpLost(D[0]),m:D[0],dz:p.z-pz}; };
  const a=run(0), c=run(3);
  ok('Cut and Run: +10% for each Loot on the target (3 Loot: 1.3x)',near(c.lost/a.lost,1.3,0.04),(c.lost/a.lost).toFixed(3));
  ok('it burns the target and dashes 8 m away from it, with 20% less damage taken',c.m.burnT>0&&near(c.dz,-8,1)&&near(x.allyP(p,'guard'),0.2),'dz '+c.dz.toFixed(1));
  reset(5,ring(5,3)); spot.clear(); cast('cutandrun',D[0].id); tick(8); p.cave.charge=0; const c0=p.cave.charge; for(let i=0;i<3;i++) x.killMonsterS(D[i],p);
  ok('kills in 4 s refund 10 charge, no more (its own cap)',near(p.cave.charge-c0,10,0.01),String(p.cave.charge-c0)); }
// ---- 6 Marionette ----
{ reset(3,[[0,3],[2,3],[4,3]]); spot.clear(); cast('marionette',D[0].id); tick(14);
  ok('Marionette takes over a normal monster (it stops attacking the hikers) and ties a String to it',D[0].stunT>3&&D[0].puppet==='a'&&x.ssMarkN(p,D[0],'string')>=1);
  tick(25); ok('it attacks its neighbours (they lose health and get a String)',hpLost(D[1])>0&&x.ssMarkN(p,D[1],'string')>=1,String(hpLost(D[1])));
  tick(60); ok('after 4 s it is free again',D[0].puppet===null&&p.cave.fx.pup.length===0);
  ok('the number of monsters puppeted is counted for the feat',p.cave.fx.puppets===1);
  if(BOSS){ const bx=BOSS.x,bz=BOSS.z; BOSS.x=p.x; BOSS.z=p.z+3; BOSS.dead=false; reset(0,[]); BOSS.x=p.x; BOSS.z=p.z+3; spot.set(BOSS,[BOSS.x,BOSS.z]); cast('marionette',BOSS.id); tick(14);
    ok('a boss cannot be puppeted: it is weakened 15% (the shared weak) and tied with a String instead',!BOSS.puppet&&!(BOSS.stunT>0)&&near(x.rxWeakK(BOSS),0.85,0.01)&&x.ssMarkN(p,BOSS,'string')>=1,String(x.rxWeakK(BOSS)));
    spot.delete(BOSS); BOSS.x=bx; BOSS.z=bz; } }
// ---- 7 Tidepool ----
{ reset(4,ring(4,4)); marks('ripple',3,D.slice(0,4)); b.hp=b.maxHp*0.4; keepHp=true; W.setPos('b',[p.x+1,x.getH(p.x+1,p.z+3),p.z+3,0,0,0]); cast('tidepool'); tick(8);
  const hp1=b.hp/b.maxHp; tick(28); const hp2=b.hp/b.maxHp;
  ok('Tidepool: an ally in the pool regenerates 2% a second (ticks of 2%)',hp2>hp1&&near((hp2-hp1)/0.02,Math.round((hp2-hp1)/0.02),0.05),((hp2-hp1)).toFixed(3));
  ok('it hits nobody',D.slice(0,4).every(m=>hpLost(m)===0));
  const A=x.AREAS[0]; let g=0; while(A.t<A.dur-0.12&&g++<400) tick(1); const pre=b.hp/b.maxHp; while(x.AREAS.length&&g++<400) tick(1); const post=b.hp/b.maxHp;
  ok('when it ends, the weakest ally heals 2% for each Ripple within 15 m (counted up to 10: 20%)',post-pre>0.19&&post-pre<0.25,(post-pre).toFixed(3)); }
// ---- 8 Intermission ----
{ reset(3,front(3,4)); marks('applause',3,D.slice(0,3)); b.hp=b.maxHp*0.5; keepHp=true; cast('intermission'); tick(8);
  ok('Intermission is a 1 s bow',p.act&&p.act.dur===1&&p.act.kind==='cv_intermission');
  tick(20); const nx=b.cave.fx.next;
  ok('then every ally gets +4% per Applause on their next skill (9 counted, up to +20%) and heals 3%',nx&&near(nx.v,0.2,0.001)&&near(b.hp/b.maxHp,0.53,0.01)&&p.cave.fx.next&&near(p.cave.fx.next.v,0.2,0.001),nx&&nx.v+' hp '+b.hp/b.maxHp);
  b.cd={basic:0,skill:0,burst:0,cave:0}; b.act=null; W.receive('b',{t:'atk',k:'basic',tg:null,face:Math.PI,aim:[0,0,1]}); tick(2);
  ok('a basic attack does not use the bonus',!!b.cave.fx.next);
  b.cd.skill=0; b.act=null; W.receive('b',{t:'atk',k:'skill',tg:null,face:Math.PI,aim:[0,0,1]});
  const ab=x.SKILLS[b.gear.skills.eq.warrior.skill];
  ok('the next skill is +20% and uses it up',b.act&&b.cave.fx.next===null&&b.act.mult>ab.mult*1.19&&b.act.mult<ab.mult*1.21*x.skillPower(1)+1e-9,b.act&&b.act.mult+' vs '+ab.mult); }
// ---- 9 Sound the Charge ----
{ reset(3,front(3,4)); marks('fervor',2,D.slice(0,3)); for(const q of [p,b]) q.cd.skill=10, q.cd.burst=30;
  cast('soundcharge'); p.cd.skill=10; p.cd.burst=30; tick(14);
  const cut=(10-p.cd.skill)-0.7, cutB=(10-b.cd.skill)-0.7;
  ok('Sound the Charge takes 2 s + 0.5 s per Fervor (6 counted, up to 4 s in all) off the skill and burst cooldowns of the whole party at once',near(cut,4,0.1)&&near(cutB,4,0.1)&&near(30-b.cd.burst-0.7,4,0.1),cut.toFixed(2)+' / '+cutB.toFixed(2));
  reset(3,front(3,4)); for(const q of [p,b]) q.cd.skill=10, q.cd.burst=30; cast('soundcharge'); p.cd.skill=10; p.cd.burst=30; tick(14);
  ok('with no Fervor it is 2 s',near((10-p.cd.skill)-0.7,2,0.1)); }
// ---- 10 Eagle's Perch ----
{ reset(2,[[0,2],[0,12]]); marks('sight',3,D.slice(0,2)); keepHp=true; const near_=D[0], far=D[1]; const hit=m=>{ const h=p.hp; x.hurtP(p,500,m); const v=h-p.hp; p.hp=p.maxHp; return v; };
  const base=hit(near_); cast('eagleperch'); tick(14);
  ok('Eagle\'s Perch: melee within reach cannot hurt you',hit(near_)===0&&base>0);
  ok('a monster further off (an archer, a spell) still can',hit(far)>0);
  ok('your skills hit +5% for each Sight on the target (3: 1.15x)',near(x.fxModK({},p,near_),1.15,0.001),String(x.fxModK({},p,near_)));
  const d=Math.hypot(p.x-far.x,p.z-far.z), rs={rangeScale:{k:2,from:0,to:20}};
  ok('and count 10 m farther for range scaling',near(x.fxModK(rs,p,far),1.15*2,0.01),x.fxModK(rs,p,far)+' at '+d.toFixed(1)+' m');
  tick(100); ok('after 5 s it is over',hit(near_)>0&&near(x.fxModK({},p,near_),1,0.001)); }
// ---- 11 Stopped Hour ----
{ reset(2,front(2,4)); keepHp=true; marks('grain',0,D); cast('stoppedhour'); tick(14); const m=D[0], hp0=p.hp, hpb=b.hp;
  x.hurtP(p,3000,m); x.hurtP(b,3000,m);
  ok('Stopped Hour: the damage you and an ally take is held back for 3 s',p.hp===hp0&&b.hp===hpb);
  tick(60); ok('when time runs again half of it lands',near((hp0-p.hp)/3000,0.5,0.1)&&near((hpb-b.hp)/3000,0.5,0.1),(hp0-p.hp)+' of 3000');
  p.hp=p.maxHp; reset(2,front(2,4)); keepHp=true; marks('grain',3,D); cast('stoppedhour'); tick(14);
  ok('with Grain it lasts longer (9 counted: +3 s, up to 5 s)',near(p.cave.fx.hold.until-x.S.t,5-0.43,0.2),String(p.cave.fx.hold.until-x.S.t));
  x.hurtP(p,x.S.t*0+p.maxHp*5,D[0]); tick(110); ok('and the late hit never knocks anyone out',!p.dead&&p.hp>=1,String(p.hp)); }
// ---- 12 Lamp in the Window ----
{ reset(3,ring(3,3)); marks('vigil',2,D.slice(0,3)); keepHp=true; cast('lampwindow'); tick(14); const A=x.AREAS[0];
  ok('Lamp in the Window lasts 10 s + 1 s per Vigil (6 counted, up to 5)',A&&near(A.dur,15,0.01),A&&String(A.dur));
  tick(10); ok('enemies inside are weakened (the shared weak, 10%)',D.slice(0,3).every(m=>near(x.rxWeakK(m),0.9,0.01)),String(x.rxWeakK(D[0])));
  ok('it hits nobody',D.slice(0,3).every(m=>hpLost(m)===0));
  b.hp=b.maxHp*0.25; tick(22); ok('an ally who falls under 30% inside it heals 15% once',near(b.hp/b.maxHp,0.40,0.02),String(b.hp/b.maxHp));
  b.hp=b.maxHp*0.2; tick(22); ok('and only once',b.hp/b.maxHp<0.25,String(b.hp/b.maxHp)); }
// ---- 13 Night Line ----
{ reset(3,[[0,14],[1,14],[0,15]]); keepHp=true; cast('nightline'); tick(50);
  ok('Night Line: Lures everything within 6 m of the lantern line, 20 m ahead of the hero',D.slice(0,3).every(m=>x.ssMarkN(p,m,'lure')>=1)&&x.AREAS.length===1&&near(Math.hypot(x.AREAS[0].x-p.x,x.AREAS[0].z-p.z),20,1.5));
  ok('it hits nobody',D.slice(0,3).every(m=>hpLost(m)===0));
  p.lastMove=x.S.t; ok('the hero counts as standing still (Steady Hand) while it burns',x.ssWhen(p,D[0],{still:1}));
  tick(200); p.lastMove=x.S.t-0.2; ok('and not after it is gone',!x.ssWhen(p,D[0],{still:1})); }
// ---- 14 Bell Echo ----
{ reset(1,[[0,2]]); keepHp=true; marks('toll',3,[D[0]]); cast('bellecho'); tick(14); const m=D[0]; p.hp=p.maxHp*0.5; b.hp=b.maxHp*0.5; const rs=[];
  ok('Bell Echo rings for the next 3 hits +1 per 2 Toll (3: +1) = 4',p.cave.fx.bell.left===4,String(p.cave.fx.bell.left));
  for(let i=0;i<5;i++){ const h0=m.hp, bh=b.hp; x.hurtP(p,200,m); rs.push([h0-m.hp, b.hp-bh]); p.hp=p.maxHp*0.5; }
  ok('each of them reflects damage to the attacker and heals the party 3%',rs.slice(0,4).every(r=>r[0]>0&&near(r[1]/b.maxHp,0.03,0.003)),JSON.stringify(rs.map(r=>[Math.round(r[0]),Math.round(r[1])])));
  ok('the fifth hit does not ring',rs[4][0]===0&&rs[4][1]===0); }
// ---- 15 Black Ice ----
{ reset(3,[[0,6],[1,9],[0,12]]); keepHp=true; cast('blackice'); tick(14);
  ok('Black Ice: a lane in front of the hero that slows the enemies on it and adds Rime every second',D.slice(0,3).every(m=>m.slowT>0&&x.ssMarkN(p,m,'rime')>=1),D.slice(0,3).map(m=>m.slowT.toFixed(1)+'/'+x.ssMarkN(p,m,'rime')).join(' '));
  ok('it hits nobody',D.slice(0,3).every(m=>hpLost(m)===0));
  ok('on it Momentum is always on (the `moved` condition holds even standing still)',x.ssWhen(p,D[0],{moved:1}));
  tick(140); p.lastMove=-99; ok('and the lane ends',!x.ssWhen(p,D[0],{moved:1})); }
// ---- 16 Landslide ----
{ reset(6,[[0,3],[1,5],[-1,7],[0,9],[1,11],[-1,13]]); spot.clear(); const bx=BOSS&&BOSS.x,bz=BOSS&&BOSS.z;
  if(BOSS){ BOSS.x=p.x+2; BOSS.z=p.z+8; BOSS.dead=false; } const bpos=BOSS&&[BOSS.x,BOSS.z]; cast('landslide'); tick(8);
  const ds=D.slice(0,6).map(m=>Math.hypot(m.x-p.x,m.z-p.z));
  ok('Landslide drags everything in the 14 m slope to its end, stuns and taunts it',ds.every(d=>d>11.5&&d<15.5)&&D.slice(0,6).every(m=>m.stunT>0&&m.taunt&&m.taunt.by==='a'&&hpLost(m)>0),ds.map(v=>v.toFixed(1)).join(' '));
  if(BOSS){ BOSS.x=bx; BOSS.z=bz; }   // (the boss AI puts a boss back at once, so dragging it cannot be observed here: cvSlideS skips m.boss)
  reset(10,ring(10,4)); spot.clear(); cast('landslide'); tick(8); p.cave.charge=0; const c0=p.cave.charge; for(let i=0;i<10;i++) x.killMonsterS(D[i],p);
  ok('Landslide: ten kills in the window refund 15, the cap',near(p.cave.charge-c0,15,0.01),String(p.cave.charge-c0)); }
// ---- 17 Embalm ----
{ reset(2,front(2,4)); marks('linen',3,D.slice(0,2)); keepHp=true; b.hp=b.maxHp*0.3; cast('embalm'); tick(14); const E=b.cave.fx.embalm;
  ok('Embalm wraps the ally who needs it most (not the caster)',E&&!p.cave.fx.embalm);
  const h=b.hp; x.hurtP(b,b.maxHp*3,D[0]);
  ok('they cannot fall below 1 health for 5 s',b.hp>=1&&b.hp<=2&&!b.dead,String(b.hp));
  tick(100); ok('then they heal 10% +2% per Linen (6 counted, up to 5: 20%)',b.hp>1&&near((b.hp-1)/b.maxHp,0.20,0.02),String((b.hp-1)/b.maxHp));
  reset(0,[]); keepHp=true; x.partyOf(p); p.hp=p.maxHp*0.2; b.hp=b.maxHp; cast('embalm'); tick(14); ok('with the caster hurt most, they wrap themselves',!!p.cave.fx.embalm&&!b.cave.fx.embalm); }
// ---- 18 Night Shift ----
{ reset(10,ring(10,5)); spot.clear(); cast('nightshift'); tick(8); const res=[];
  for(let i=0;i<5;i++){   // five kills, each with a victim 2 m from it and everything else far away
    const k=D[i], v=D[5+i]; k.x=p.x+3; k.z=p.z+3; v.x=p.x+5; v.z=p.z+3; for(const m of D) if(m!==k&&m!==v){ m.x=p.x+300; m.z=p.z+300; }
    x.killMonsterS(k,p); res.push(v); }
  ok('Night Shift: each kill near you raises a grave hand, up to 4',p.cave.fx.shift.hands===4,String(p.cave.fx.shift.hands));
  ok('a hand hits, slows and rots a nearby enemy',res.slice(0,4).every(m=>hpLost(m)>0&&m.slowT>=3&&x.ssMarkN(p,m,'rot')>=1),res.map(m=>hpLost(m)+'/'+m.slowT).join(' '));
  ok('the fifth kill raises no hand',hpLost(res[4])===0&&res[4].slowT===0);
  tick(2); ok('the clients are told (cvhand) for the placeholder look',evs.filter(e=>e[0]==='cvhand').length===4,String(evs.filter(e=>e[0]==='cvhand').length)); }
{ reset(6,ring(6,5)); spot.clear(); cast('nightshift'); tick(8); tick(170); for(const m of D.slice(0,3)) x.killMonsterS(m,p); ok('Night Shift: after 8 s a kill raises nothing',p.cave.fx.shift.hands===0); }
console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
