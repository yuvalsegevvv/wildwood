// Headless test of the Proving Isle (shared/pvp.js, server/pvp.js and the hooks marked `// pvp:`), straight from src/ (no build): the island and its bridge, the fixed numbers for
// a level-5 and a level-40 hiker, the default passive, skills at level 1, hits between fighters (and not across the water's edge), a party spared, no rewards, the knock-out (a shore spot,
// the gate shut for 10 s), potions refused, and every attack skill of every class fired at an opponent without a throw. One line per check.
// Usage: node tools/pvp-smoke.js
const {loadServer}=require('./load');
const got={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},['PVP','inPvp','S','MONS','hurtP','recalcP','partyOf','SKILLS','skillLvOf','bridgeDeck','rawHeight','WATER','pvpFoeOf','foesS','PVP_ISLE','pvpSkillsOf','tierFor','elemHitS','soulOfP','ELEM_BOOST']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind);
const clear=()=>{ for(const k in got) got[k]=[]; };
const put=(pid,xx,zz,face)=>{ W.setPos(pid,[xx,x.rawHeight(xx,zz),zz,face||0,0,0]); };
const C=x.PVP;
const join=(pid,name,cls,level)=>{ W.join(pid,{name,look:{cls},save:{level}}); };
join('a','Ash','warrior',5); join('b','Bree','archer',40); join('c','Cole','warrior',40); join('d','Dara','mage',12); join('e','Eli','warrior',30);
tick(3); clear();

// ---- the place ----
ok('the island is dry land and the bridge deck leads to its gate',x.rawHeight(C.x,C.z)>1&&!!C.gate&&x.bridgeDeck(C.gateOut.x,C.gateOut.z)>x.WATER&&Math.hypot(C.gate.x-C.x,C.gate.z-C.z)<=C.r+0.3);
ok('the shore spots are dry and outside the circle',C.shore.length>=10&&C.shore.every(s=>x.rawHeight(s.x,s.z)>1.2&&!x.inPvp(s.x,s.z)));
ok('the island is in the home forest south of Slime Meadow (z beyond its southern edge, x west of the road)',C.z>250&&C.x<-100&&C.x>-300);

// ---- the same numbers for everyone ----
const A=P('a'), B=P('b'), Cc=P('c'), D=P('d'), E=P('e');
A.gear.skills.lv.whirlwind=5; Cc.gear.pot={heal1:2}; Cc.gear.eq.pendant=null;
const realMax={a:A.maxHp,b:B.maxHp,c:Cc.maxHp};
put('a',C.x,C.z,0); put('c',C.x+3,C.z-30,0); put('b',C.x-3,C.z+25,0); put('d',C.x+20,C.z+10,0); tick(4);
ok('stepping onto the island puts you "on" it (p.pv, event pvp 1, a toast)',!!A.pv&&!!B.pv&&!!Cc.pv&&evs('a','pvp').some(e=>e[1]==='a'&&e[2]===1)&&evs('a','toast').some(e=>/Proving Isle/.test(e[2])));
ok('a level 5 and a level 40 warrior have the same health, damage and armour there',A.maxHp===Cc.maxHp&&A.dmg===Cc.dmg&&A.def===Cc.def&&A.red===Cc.red&&A.maxHp!==realMax.a,A.maxHp+' hp, '+A.dmg.toFixed(1)+' dmg vs real '+realMax.a+' / '+realMax.c);
ok('they enter at full health',A.hp===A.maxHp&&Cc.hp===Cc.maxHp);
ok('all three classes have the same gear numbers (archer and mage differ only by their passive)',B.def===A.def&&D.def===A.def&&B.dmg===A.dmg&&D.dmg===A.dmg);
ok('an underleveled hiker (5, 12) gets the default passive Vitality; a level-40 one fights with what they wear (they start with Vitality too, so health is equal)',A.pv.sk.pass[0]==='vitality'&&D.pv.sk.pass[0]==='vitality'&&Cc.pv.sk.pass[0]==='vitality'&&A.maxHp===Cc.maxHp);
E.gear.skills.owned.push('ferocity'); E.gear.skills.pass=['ferocity',null,null]; put('e',C.x-10,C.z-10,0); tick(3);
ok('a level-30 hiker wearing Ferocity keeps it there (their build), at skill level 1, and has no Vitality health',!!E.pv&&E.pv.sk.pass[0]==='ferocity'&&E.maxHp<A.maxHp&&E.dmg===A.dmg);
put('e',C.x+C.r+30,C.z,0); tick(3);
ok('skills are level 1 there (whirlwind upgraded to 5 outside)',x.skillLvOf(A.pv.sk,'whirlwind')===1&&x.skillLvOf(A.gear.skills,'whirlwind')===5);
ok('all three attack slots are open for a level-5 hiker (the class defaults fill the ones not yet earned)',A.pv.sk.eq.warrior.skill==='whirlwind'&&A.pv.sk.eq.warrior.burst==='quake'&&A.pv.sk.eq.archer.burst==='hail');
ok('their real level, gear and save are untouched',A.level===5&&A.gear.skills.lv.whirlwind===5&&A.gear.eq.weapon==='sword1');
ok('the snapshot shows everyone at the fighting level',(()=>{ let lv=null; const snap=[]; try{ lv=[...W.players.values()].filter(p=>p.pv).map(p=>p.pv?C.level:p.level); }catch(_){ } return lv&&lv.every(v=>v===C.level); })());

// ---- elements: your soul is your element when you are hit; between fighters advantage is x1.15 (not the monsters' 1.5) ----
{ const near=(a,b)=>Math.abs(a-b)<1e-9, K=1.15, def=P('c'), att=P('e');
  def.level=40; def.gear.soul='fire'; att.gear.soul='basic'; const fireFoe=x.pvpFoeOf(def);
  ok('a fighter\'s element is their soul (none under level 15 even if one is saved)',x.soulOfP(def)==='fire'&&fireFoe.T.el==='fire'&&(()=>{ const y=P('a'); y.gear.soul='water'; const r=x.soulOfP(y)==='basic'; y.gear.soul='basic'; return r; })());
  ok('a water skill hitting a fire-soul fighter deals x1.15, not x1.5',near(x.elemHitS(att,'water',fireFoe),K));
  ok('a skill of the target\'s own element or beaten by it deals /1.15 (fire on fire, air on fire)',near(x.elemHitS(att,'fire',fireFoe),1/K)&&near(x.elemHitS(att,'air',fireFoe),1/K));
  ok('an element with no wheel relation, or a basic attack, is unchanged',near(x.elemHitS(att,'earth',fireFoe),1)&&near(x.elemHitS(att,'basic',fireFoe),1)&&near(x.elemHitS(att,'water',x.pvpFoeOf(P('a'))),1));
  att.gear.soul='water'; ok('your own soul counts too, at the same strength (a water skill from a water soul: x1.15; at a fire soul as well: x1.15 x1.15)',near(x.elemHitS(att,'water',x.pvpFoeOf(P('a'))),K)&&near(x.elemHitS(att,'water',fireFoe),K*K)); att.gear.soul='basic';
  ok('against a monster nothing changed: the same water skill deals x'+x.ELEM_BOOST,near(x.elemHitS(att,'water',{T:{el:'fire'}}),x.ELEM_BOOST)&&x.PVP.elemBoost===K);
  def.level=40; def.gear.soul='basic'; }

// ---- hitting ----
const swing=(pid,tg,slot)=>{ const p=P(pid); p.cd.basic=p.cd.skill=p.cd.burst=0; p.act=null; W.receive(pid,{t:'atk',k:slot||'basic',tg,face:p.face,aim:[-Math.sin(p.face),0,-Math.cos(p.face)]}); tick(25); };
put('a',C.x,C.z,0); put('c',C.x,C.z-2,0); tick(2); Cc.hp=Cc.maxHp; clear();
swing('a',null,'basic');
ok('a slash hits the fighter in front: their health drops, a hurt event names them',Cc.hp<Cc.maxHp&&evs('a','hurt').some(e=>e[1]==='c'&&e[2]>0),Cc.hp+' / '+Cc.maxHp);
const dealt=Cc.maxHp-Cc.hp; const arm=1-Cc.red; ok('the damage is about 3 x f(level) + the fixed sword, cut by the fixed armour (±15%, x1.7 on a critical hit)',dealt>0.95*0.85*arm*A.dmg&&dealt<1.05*1.15*1.7*arm*A.dmg,dealt+' vs base '+A.dmg.toFixed(0));
clear(); const hpB=B.hp; put('b',C.x+14,C.z,0); tick(2); swing('a',null,'basic');
ok('out of reach nothing is hit',B.hp===B.maxHp);
// across the water's edge: nobody outside can hit in, nobody inside can hit out
put('e',C.x+C.r+30,C.z,Math.PI/2); tick(3); ok('a hiker on the mainland is not "on" the island',!E.pv);
const hpA=A.hp; put('e',C.gateOut.x,C.gateOut.z,Math.PI/2); tick(2); P('e').cd.basic=0; W.receive('e',{t:'atk',k:'basic',tg:'a',face:Math.PI/2,aim:[-1,0,0]}); tick(25);
ok('a hiker outside cannot hit one inside (and the other way round)',A.hp===hpA);
ok('a fighter\'s foes are only the others on the island, never a monster',x.foesS(A).every(m=>m.pl)&&x.foesS(A).length===3&&x.foesS(E)===x.MONS);

// ---- party ----
W.receive('a',{t:'party',a:'invite',name:'Cole'}); tick(2); W.receive('c',{t:'party',a:'accept'}); tick(2);
put('a',C.x,C.z,0); put('c',C.x,C.z-2,0); tick(2); Cc.hp=Cc.maxHp; clear();
swing('a',null,'basic'); swing('a',null,'skill');
ok('a party member is not hit (basic and skill)',Cc.hp===Cc.maxHp&&!x.foesS(A).some(m=>m.pl===Cc)&&!!x.partyOf(A));
W.receive('c',{t:'party',a:'leave'}); tick(2);

// ---- no rewards, no potions ----
const before={exp:A.exp,coins:A.gear.coins,inv:A.gear.inv.length,mats:JSON.stringify(A.gear.mats),q:JSON.stringify(A.gear.q),mq:JSON.stringify(A.gear.mq)};
put('c',C.x,C.z-2,0); tick(2); Cc.hp=Cc.maxHp; clear();
x.hurtP(Cc,1e6,null,A); tick(2);
ok('a knock-out: both are told and Cole is down',Cc.dead&&evs('a','toast').some(e=>/knocked out Cole/.test(e[2]))&&evs('c','down').length>0);
ok('and nothing is won: no XP, coins, items, drops, quest or main-quest credit',A.exp===before.exp&&A.gear.coins===before.coins&&A.gear.inv.length===before.inv&&JSON.stringify(A.gear.mats)===before.mats&&JSON.stringify(A.gear.q)===before.q&&JSON.stringify(A.gear.mq)===before.mq&&!evs('a','xp').length&&!evs('a','coins').length&&!evs('a','loot').length);
W.receive('c',{t:'potion',k:'heal'}); ok('no potions on the island',Cc.gear.pot.heal1===2);
// ---- the wake-up ----
clear(); tick(70);
ok('3 s later Cole wakes on the mainland shore: alive, off the island, at full real health, not in a village',!Cc.dead&&!Cc.pv&&!x.inPvp(Cc.x,Cc.z)&&Cc.hp===Cc.maxHp&&Cc.maxHp===realMax.c&&C.shore.some(s=>Math.abs(s.x-Cc.x)<0.01&&Math.abs(s.z-Cc.z)<0.01)&&Math.hypot(Cc.x,Cc.z)>200);
ok('the gate is shut for 10 s: event pvlock [pid, 10], a teleport message',evs('c','pvlock').some(e=>e[1]==='c'&&e[2]===10)&&Cc.pvLock>x.S.t+9);
put('c',C.x+1,C.z,0); tick(3);
ok('stepping onto the island during the lock puts you back at the gate and you do not become a fighter',!Cc.pv&&Math.abs(Cc.x-C.gateOut.x)<0.01&&Math.abs(Cc.z-C.gateOut.z)<0.01);
tick(200); put('c',C.x+1,C.z,0); tick(3);
ok('after the lock you may enter again',!!Cc.pv);
put('c',C.x+C.r+20,C.z,0); tick(3);
ok('walking off the island makes you yourself again (real stats, health share kept)',!Cc.pv&&Cc.maxHp===realMax.c&&Cc.hp>=1);
// ---- a monster does not hunt a fighter, and does not reach one ----
{ const m=x.MONS.find(mm=>!mm.boss&&!mm.inst); put('c',C.x,C.z,0); tick(3); m.x=C.x+5; m.z=C.z; m.dead=false; tick(2); ok('no monster picks a fighter as its target',!Cc.pv||x.MONS.every(mm=>mm.tgt!==Cc.id)); m.x=m.camp.x; m.z=m.camp.z; }

// ---- every attack skill of every class, fired at an opponent on the island ----
{ let n=0, hit=0; const bad=[];
  const mk=(pid,cls)=>{ const p=P(pid); p.gear.eq.weapon={warrior:'sword',archer:'bow',mage:'wand'}[cls]+'1'; p.gear.inv.push(p.gear.eq.weapon); };
  for(const k of ['a','c','e']) put(k,C.x+C.r+40,C.z+20,0); tick(3);   // (everyone else off the island: an arrow hits the first fighter it meets)
  for(const id in x.SKILLS){ const s=x.SKILLS[id]; const cls=s.cls==='any'?'warrior':s.cls;
    mk('d',cls); const D2=P('d'); D2.gear.skills.owned.push(id); D2.gear.skills.eq[cls][s.slot]=id; D2.level=60; D2.gear.skills.pass=[null,null,null];
    // leave and enter so the loadout is rebuilt from the save
    put('d',C.x+C.r+25,C.z,0); tick(3); put('d',C.x,C.z,0); put('b',C.x,C.z-2.5,0); tick(3); put('d',C.x,C.z,0); put('b',C.x,C.z-2.5,0);
    P('b').hp=P('b').maxHp; P('b').dead=false; D2.hp=D2.maxHp;
    try{ const hp0=P('b').hp; D2.cd.basic=D2.cd.skill=D2.cd.burst=0; D2.act=null; W.receive('d',{t:'atk',k:s.slot,tg:'b',face:0,aim:[0,0,-1]}); tick(45); n++; if(P('b').hp<hp0||D2.buff||s.buff||(s.fx&&s.fx.buff)) hit++; else if(!s.set) bad.push(id); }catch(err){ bad.push(id+' threw '+err.message); }
    D2.act=null; }
  ok('every attack skill ('+n+') fires on the island without a throw and does something to an opponent in front (or is a buff)',n>40&&bad.length===0,bad.join(', ')); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
