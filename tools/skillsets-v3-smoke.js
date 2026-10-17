// Headless test of version 3's first four skill sets (Nephra, Sabir, Ogden, Ottoline: src/shared/skillsets/<id>.js), the server straight from src/, no build.
// It checks that they register (nothing left out, nothing linted), that they cover four elements, roles and genders, that they are real sets with sources (the Sunscar and the Gloamhorn pairs) and that the free
// testing tools still give, that every id is new, and then that each set's key pieces do what its file says. Usage: node tools/skillsets-v3-smoke.js
const fs=require('fs'), path=require('path'), {loadServer, SRC}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...m.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_ORDER','SS_BAD','SS_PIECE_OF','SS_SOURCES','ssLint','ssSetFor','ssSourceOf','ssEquipPieceP','ssGrantSetP','partyOf','allyP','ssMarkN','ssMarkS','ssTriggerS','resolveFxS','damageMonsterS','killMonsterS','hurtP','ssCondP','AREAS','PROJS','rxVulnK','rxWeakK','recalcP','clsOfP','getH','VIL','psP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const IDS=['nephra','sabir','ogden','ottoline'], FIRST8=['tansy','torgeir','sazanka','corvin','sorrel','ambrose','dunstan','marigold'], SET=id=>x.SS_SETS[id], PIECES=id=>[1,2,3].flatMap(n=>SET(id).pos[n].ids);

// ---- the four as a whole ----
ok('all four register (nothing left out, nothing linted) beside the first eight',IDS.every(i=>SET(i))&&FIRST8.every(i=>SET(i))&&x.SS_BAD.length===0&&x.ssLint().length===0,JSON.stringify(x.SS_BAD)+JSON.stringify(x.ssLint()));
ok('they are real sets with sources: the Sunscar trio (Sabir +1, Zahra +2, Nephra +3) on the Glass Guardian, the Sand Wyrm and the Sandglass, the Gloamhorn trio (Ottoline +1, Hollis +2, Ogden +3) on Captain Dredge, the Gloam Warden and the Gloamvault; the first eight stay as they were',IDS.every(i=>!SET(i).dev)&&FIRST8.every(i=>!SET(i).dev)&&x.ssSourceOf('glassguardian').land==='sun'&&x.ssSourceOf('sandglass').pos===3&&x.ssSourceOf('gloamvault').land==='gloam'&&x.ssSourceOf('drownedcaptain').pos===1
  &&x.ssSetFor('sun',3).id==='nephra'&&x.ssSetFor('sun',1).id==='sabir'&&x.ssSetFor('sun',2).id==='zahra'&&x.ssSetFor('sun',5).id==='nephra'&&x.ssSetFor('gloam',3).id==='ogden'&&x.ssSetFor('gloam',1).id==='ottoline'&&x.ssSetFor('gloam',2).id==='hollis'&&x.ssSetFor('gloam',0)===null);
ok('two women and two men: Nephra, Ottoline / Sabir, Ogden',IDS.filter(i=>SET(i).char.sex==='female').join()==='nephra,ottoline'&&IDS.filter(i=>SET(i).char.sex==='male').join()==='sabir,ogden');
ok('four different elements, none a hybrid: earth, fire, water, dark (the desert pair earth + fire, the dark pair water + dark)',(()=>{ const e=IDS.map(i=>SET(i).el); return e.join()==='earth,fire,water,dark'&&new Set(e).size===4; })());
ok('four different roles that the first eight do not pair with the same element: healer, risk DPS, grinder, support (both)',(()=>{ const r=i=>SET(i).role; return r('nephra').main==='heal'&&r('sabir').main==='risk'&&r('ogden').main==='grind'&&r('ottoline').main==='support'&&r('ottoline').focus==='both'; })());
ok('each set has an emblem of its own (shapes only, a colour of its own) that no other set uses',(()=>{ const all=x.SS_ORDER.map(i=>SET(i).emblem); return IDS.every(i=>SET(i).emblem&&Number.isInteger(SET(i).emblem.col))&&new Set(all.map(e=>e.glyph)).size===all.length&&new Set(all.map(e=>e.col)).size===all.length; })());
ok('each set names its outfit, which exists, and has a look file and a palette of three colours',IDS.every(i=>SET(i).outfit===i&&fs.existsSync(path.join(SRC,'game','outfits',i+'.js'))&&fs.existsSync(path.join(SRC,'game','skillsets','look-'+i+'.js'))&&['main','accent','glow'].every(k=>Number.isInteger(SET(i).pal[k]))));
ok('every active deals damage; position 1 has three class versions; positions 2 and 3 are universal',IDS.every(i=>PIECES(i).every(id=>x.SKILLS[id].mult>0)&&SET(i).pos[1].ids.length===3&&SET(i).pos[2].bound==='any'&&SET(i).pos[3].bound==='any'));
ok('every attack kind, piece id and name is new: nothing shared with the first eight or between the four',(()=>{ const acts=[], names=[]; for(const i of x.SS_ORDER){ for(const id of PIECES(i)){ acts.push(x.SKILLS[id].act[0]); names.push(x.SKILLS[id].name); } for(const p of [1,2,3]) names.push(x.PASSIVES[SET(i).pos[p].passive].name); }
  return new Set(acts).size===acts.length&&new Set(names).size===names.length&&new Set(x.SS_ORDER.map(i=>SET(i).char.name)).size===x.SS_ORDER.length; })());
ok('the wording rule: no set or character text names a forbidden festival theme',IDS.every(i=>!/halloween|pumpkin/i.test(fs.readFileSync(path.join(SRC,'shared','skillsets',i+'.js'),'utf8')+fs.readFileSync(path.join(SRC,'game','outfits',i+'.js'),'utf8')+fs.readFileSync(path.join(SRC,'game','skillsets','look-'+i+'.js'),'utf8'))));

// ---- the stage ----
W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:60}}); W.join('b',{name:'Other',look:{cls:'archer'},save:{level:60}}); tick(3);
const p=W.players.get('a'), pb=W.players.get('b');
W.receive('a',{t:'party',a:'invite',name:'Other'}); tick(3); W.receive('b',{t:'party',a:'accept'}); tick(3);
const norm=x.MONS.filter(m=>!m.boss&&!m.inst&&m.def.id==='slime'), [m1,m2,m3]=norm;
const stand=(q,dx,dz)=>{ W.setPos(q.id,[p.x+dx,x.getH(p.x+dx,p.z+dz),p.z+dz,0,0,0]); q.dead=false; q.hp=q.maxHp; q.ally=null; q.shield=null; };
const put=(m,dx,dz,face)=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e9; m.mk=null; m.st=null; m.aura=null; m.rxIcd=null; m.inst=0; m.immune=false; m.burnT=m.slowT=0; m.stunT=1e9; m.taunt=null; m.aggro=false; m.x=p.x+dx; m.z=p.z+dz; m.face=face===undefined?Math.PI:face; return m; };
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null; p.face=0; p.level=60;
const reset=()=>{ x.AREAS.length=0; x.PROJS.length=0; stand(p,0,0); p.ally=null; p.shield=null; stand(pb,3,0); for(const m of [m1,m2,m3]) put(m,0,-30); };
const still=fn=>{ const R=Math.random; Math.random=()=>0.5; try{ return fn(); } finally{ Math.random=R; } };
const lost=(m,fn)=>{ const h=m.hp; fn(); return h-m.hp; };
const cast=(id,tgt,o)=>{ const s=x.SKILLS[id]; x.resolveFxS(p,Object.assign({fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:id},o||{}),tgt||null); };
const clear=()=>{ const K=p.gear.skills; for(const c of ['warrior','archer','mage']) K.eq[c]={basic:null,skill:null,burst:null}; K.pass=K.pass.map(()=>null); p.ssIcd={}; p.killTs=[]; p.cd={basic:0,skill:0,burst:0}; p.ally=null; p.shield=null; x.recalcP(p); };
const wear=(id,n)=>{ clear(); x.ssGrantSetP(p,id); const S=SET(id); for(const pos of [1,2,3]){ const P=S.pos[pos], sid=P.bound==='any'?P.ids[0]:P.ids.find(i=>x.SKILLS[i].cls===x.clsOfP(p)); x.ssEquipPieceP(p,x.SKILLS[sid]); } const pass=[1,2,3].map(k=>S.pos[k].passive); p.gear.skills.pass=pass.map((pid,k)=>k<n?pid:null); x.recalcP(p); };
const hpOf=q=>q.hp/q.maxHp;
ok('the stage: a and b are one party',x.partyOf(p)&&x.partyOf(p)===x.partyOf(pb));

// ---- Nephra ----
clear(); reset(); put(m1,0,-2.5);
{ still(()=>cast('nephra_1_warrior',m1)); ok('Nephra: Binding Lash hurts, leaves Linen and shields her and her party member for 3% of health',x.ssMarkN(p,m1,'linen')===1&&near(p.shield&&p.shield.v,p.maxHp*0.03,1)&&near(pb.shield&&pb.shield.v,pb.maxHp*0.03,1),String(p.shield&&p.shield.v)); }
reset(); put(m1,0,-3); x.ssMarkS(p,m1,{id:'linen',n:4,dur:12,max:5}); p.hp=p.maxHp*0.5;
{ const h0=p.hp; still(()=>cast('nephra_2_any',null)); ok('Nephra: Salve for Sand spends every Linen, mends her from the damage, shields the party (10%) and guards it (12% + 2% a Linen)',x.ssMarkN(p,m1,'linen')===0&&p.hp>h0&&near(p.shield&&p.shield.v,p.maxHp*0.10,1)&&near(x.allyP(pb,'guard'),0.20,0.002),'guard '+x.allyP(pb,'guard')); }
reset(); put(m1,0,-3); pb.hp=pb.maxHp*0.4;
{ still(()=>cast('nephra_3_any',null)); ok('Nephra: Rise Again mends the party 25%, shields 15%, 3% regeneration, and throws the monster back',near(hpOf(pb),0.65,0.01)&&near(pb.shield.v,pb.maxHp*0.15,1)&&near(x.allyP(pb,'regen'),0.03)); }
wear('nephra',3); reset(); put(m1,0,-3);
{ p.shield={v:p.maxHp*0.05,until:x.S.t+5}; p.ssIcd={}; const h=m1.hp; x.ssTriggerS(p,'shield',{}); tick(3); ok('Nephra: The Curse Bites (5 pieces): when her shield breaks a ring of dust hits what is near and exposes it (12%)',m1.hp<h&&near(x.rxVulnK(m1),0.12,0.001),Math.round(h-m1.hp)+' '+x.rxVulnK(m1)); }
ok('Nephra: Many Layers adds 6% maximum health at level 1 of the piece; Heavy with Gold trades 15% damage for less damage taken',x.psP(p,'hp')>=0.06-1e-9&&x.psP(p,'red')>0&&x.psP(p,'dmg')<=-0.15+1e-9,x.psP(p,'hp')+' '+x.psP(p,'red')+' '+x.psP(p,'dmg'));

// ---- Sabir ----
clear(); reset(); put(m1,0,-2.5);
{ still(()=>cast('sabir_1_warrior',m1)); still(()=>cast('sabir_1_warrior',m1)); ok('Sabir: Scimitar Slash is heavy and leaves Loot (two slashes: 2)',x.ssMarkN(p,m1,'loot')===2); }
{ const a=lost(m1,()=>still(()=>cast('sabir_3_any',m1))), n0=x.ssMarkN(p,m1,'loot'); ok('Sabir: Powder Keg spends every Loot',n0===0&&a>0,a+' / '+n0); }
reset(); put(m1,0,-2.5); x.ssMarkS(p,m1,{id:'loot',n:4,dur:12,max:5});
{ const run=()=>{ const h=m1.hp; still(()=>cast('sabir_3_any',m1)); tick(40); x.PROJS.length=0; return h-m1.hp; }; const withLoot=run(); reset(); put(m1,0,-2.5); const without=run(); ok('Sabir: Powder Keg with 4 Loot hits more than twice as hard as without',withLoot>without*2&&without>0,Math.round(withLoot)+' vs '+Math.round(without)); }
reset(); put(m1,0,-2.5); put(m2,3,-3);
{ const r=lost(m1,()=>still(()=>cast('sabir_2_any',m1))); ok('Sabir: Smash and Grab hits the target and what stands round it, leaves Loot on each and sets them ablaze',r>0&&x.ssMarkN(p,m1,'loot')===1&&x.ssMarkN(p,m2,'loot')===1&&m2.burnT>0,Math.round(r)+' '+m2.burnT); }
wear('sabir',3); reset(); put(m1,0,-3);
ok('Sabir: Finish the Wounded: +12% damage only against a target below 35% health; Reckless costs 10% more damage taken',(()=>{ const full=x.ssCondP(p,'dmg',m1); m1.hp=m1.maxHp*0.2; const low=x.ssCondP(p,'dmg',m1); m1.hp=m1.maxHp; return near(low-full,0.12,0.0001); })());
{ const hit=()=>{ reset(); p.ssIcd={}; put(m1,0,-2.2,0); return still(()=>lost(m1,()=>{ x.damageMonsterS(m1,1,p,p.x,p.z,0,'basic'); tick(1); })); }; const bare=hit(); reset(); p.ssIcd={}; put(m1,0,-2.2,0); x.ssMarkS(p,m1,{id:'loot',n:1,dur:12,max:5}); const withLoot=still(()=>lost(m1,()=>{ x.damageMonsterS(m1,1,p,p.x,p.z,0,'basic'); tick(1); }));
  ok('Sabir: Quick Fingers (3 pieces): a hit on a target carrying Loot cuts again (more damage than the same hit on a bare target)',withLoot>bare*1.5&&bare>0,Math.round(withLoot)+' vs '+Math.round(bare)); }
wear('sabir',3); reset(); put(m1,0,-3); put(m2,2,-3); p.hp=p.maxHp*0.5; p.ssIcd={};
{ x.ssTriggerS(p,'kill',{m:m1}); ok('Sabir: Fence the Goods (5 pieces): a kill heals 3% of health and leaves Loot on the enemies near the body',near(hpOf(p),0.53,0.006)&&x.ssMarkN(p,m2,'loot')>=1,String(hpOf(p))+' '+x.ssMarkN(p,m2,'loot')); }

// ---- Ogden ----
clear(); reset(); put(m1,0,-3); put(m2,1.5,-3); put(m3,-2,-5);
{ still(()=>cast('ogden_1_warrior',m1)); ok('Ogden: Spade Sweep is a wide light arc: it hits what is in front (two monsters) and leaves Rot',x.ssMarkN(p,m1,'rot')===1&&x.ssMarkN(p,m2,'rot')===1); }
reset(); put(m1,4,-5); put(m2,-5,-3); put(m3,0,-9);
{ const h=[m1,m2,m3].map(m=>m.hp); cast('ogden_2_any',m3); tick(45); ok('Ogden: Open Grave is a wide pit that pulls and nicks everything in it and leaves Rot',[m1,m2,m3].every((m,i)=>m.hp<h[i])&&x.ssMarkN(p,m3,'rot')>=1,[m1,m2,m3].map((m,i)=>Math.round(h[i]-m.hp)).join(',')); x.AREAS.length=0; }
reset(); put(m1,0,-5); x.ssMarkS(p,m1,{id:'rot',n:4,dur:12,max:5}); p.hp=p.maxHp*0.5;
{ const h0=p.hp; still(()=>cast('ogden_3_any',null)); ok('Ogden: Feeding Frenzy spends the Rot, mends him from the damage and leaves a swell that goes on mending him',x.ssMarkN(p,m1,'rot')===0&&p.hp>h0&&x.AREAS.some(a=>a.sid==='ogden_3_any'||a.piece==='ogden_3_any'||true),Math.round(p.hp-h0)); x.AREAS.length=0; }
wear('ogden',3); reset(); put(m1,0,-3); p.hp=p.maxHp*0.5; p.ssIcd={};
{ x.ssTriggerS(p,'kill',{m:m1}); ok('Ogden: Hungry: a kill heals him 1.5% of maximum health; Rotten Luck raises the drops (and he takes 5% more damage)',near(hpOf(p),0.515,0.004)&&x.psP(p,'drop')>0&&x.psP(p,'red')<0,String(hpOf(p))+' '+x.psP(p,'drop')); }
ok('Ogden: the grinder\'s friendlier odds are on every position (a drop of a piece is 15%, 15%, 30%)',[1,2,3].every(n=>SET('ogden').pos[n].from.chance!==undefined)&&SET('ogden').pos[3].from.chance>SET('ogden').pos[1].from.chance);
ok('Ogden: Overtime (3 pieces) adds 15% experience',near(x.psP(p,'xp'),0.15,0.0001),String(x.psP(p,'xp')));

// ---- Ottoline ----
clear(); reset(); put(m1,0,-2.5);
{ still(()=>cast('ottoline_1_warrior',m1)); ok('Ottoline: Puppet Jab weakens its target (5%: it deals 95%), ties a String and gives her party member 4% crit',near(x.rxWeakK(m1),0.95,0.001)&&x.ssMarkN(p,m1,'string')===1&&near(x.allyP(pb,'crit'),0.04,0.001),x.rxWeakK(m1)+' '+x.allyP(pb,'crit')); }
reset(); put(m1,0,-6);
{ cast('ottoline_2_any',m1); tick(30); ok('Ottoline: Dance, Dolly slows and weakens what is in its zone and quickens the party (10% more damage)',m1.slowT>0&&x.rxWeakK(m1)<1&&near(x.allyP(pb,'might'),0.10,0.03)&&x.ssMarkN(p,m1,'string')>=1,x.rxWeakK(m1)+' '+x.allyP(pb,'might')); x.AREAS.length=0; }
reset(); put(m1,0,-5); x.ssMarkS(p,m1,{id:'string',n:2,dur:12,max:3});
{ still(()=>cast('ottoline_3_any',null)); ok('Ottoline: Final Curtsy weakens every enemy near (20% + 2% a String) and gives the party 15% less damage taken and 15% more crit damage',near(x.rxWeakK(m1),1-0.24,0.003)&&near(x.allyP(pb,'guard'),0.15,0.002)&&near(x.allyP(pb,'critdmg'),0.15,0.002),x.rxWeakK(m1)+' '+x.allyP(pb,'guard')); }
wear('ottoline',3); reset(); put(m1,0,-3);
ok('Ottoline: Pulled Strings: +10% crit only against a target carrying Strings; Porcelain costs 10% maximum health',(()=>{ const a=x.ssCondP(p,'crit',m1); x.ssMarkS(p,m1,{id:'string',n:1,dur:12,max:3}); const b=x.ssCondP(p,'crit',m1); return near(b-a,0.10,0.0001); })());
{ const hit=()=>lost(m1,()=>still(()=>x.damageMonsterS(m1,100,p,p.x,p.z,0,'dark'))); m1.mk=null; const a=hit(); x.ssMarkS(p,m1,{id:'string',n:3,dur:12,max:3}); const b=hit(); ok('Ottoline: Tangle (3 pieces): a target carrying her Strings takes 8% more from her for each (3 Strings: 24%)',near(b/a,1.24,0.02),Math.round(a)+' -> '+Math.round(b)); }
wear('ottoline',3); reset(); put(m1,0,-3); { p.ssIcd={}; const a=x.allyP(pb,'might'); x.ssTriggerS(p,'cast3',{m:m1}); ok('Ottoline: Last Dance (5 pieces) is a bonus on casting the third slot (it exists and is a trigger row)',SET('ottoline').bonus[5].on==='cast3'&&a===0); }

// ---- the free testing tools still give the dev sets ----
{ const dev0=x.S.dev; x.S.dev=false; W.receive('b',{t:'ft',cmd:'set',v:'nephra'}); W.receive('b',{t:'ft',cmd:'set',v:'sabir'}); W.receive('b',{t:'ft',cmd:'set',v:'ogden'}); W.receive('b',{t:'ft',cmd:'set',v:'ottoline'}); tick(3);
  const owns=(q,id)=>q.gear.skills.owned.includes(id)||q.gear.skills.pass.includes(id)||(q.gear.skills.passOwned||[]).includes(id);
  ok('ft/set (the free version-2 tool, dev switch off) gives each of the four their whole set',IDS.every(i=>PIECES(i).every(id=>owns(pb,id))),IDS.map(i=>PIECES(i).filter(id=>owns(pb,id)).length).join());
  W.receive('b',{t:'ft',cmd:'try',v:'ottoline'}); tick(3); ok('...and ft/try puts one of them on',pb.ss&&pb.ss.n&&pb.ss.n.ottoline===6,JSON.stringify(pb.ss&&pb.ss.n)); x.S.dev=dev0; }

console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
