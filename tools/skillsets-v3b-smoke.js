// Headless test of version 3's second six skill sets (Pell, Genzo, Brynja, Tamsin, Zahra, Hollis: src/shared/skillsets/<id>.js), the server straight from src/, no build.
// It checks that all twenty-one sets register (nothing left out, nothing linted), that every land has exactly one set at +1, +2 and +3 and none at +4 or above (the owner's tier table), the gender ratio, that every id is new,
// that each outfit and look file exists, and that each set's key pieces do what its file says. Usage: node tools/skillsets-v3b-smoke.js
const fs=require('fs'), path=require('path'), {loadServer, SRC}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...m.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_ORDER','SS_BAD','SS_SOURCES','ssLint','ssSetFor','ssEquipPieceP','ssGrantSetP','partyOf','allyP','ssMarkN','ssMarkS','resolveFxS','AREAS','PROJS','rxVulnK','recalcP','clsOfP','getH','VIL','psP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const IDS=['pell','genzo','brynja','tamsin','zahra','hollis'], SET=id=>x.SS_SETS[id], PIECES=id=>[1,2,3].flatMap(n=>SET(id).pos[n].ids);

ok('all twenty-one sets register (nothing left out, nothing linted)',x.SS_ORDER.length===21&&IDS.every(i=>SET(i))&&x.SS_BAD.length===0&&x.ssLint().length===0,JSON.stringify(x.SS_BAD)+JSON.stringify(x.ssLint()));
ok('every land has one real set at +1, +2 and +3 and none above (the seven lands x three tiers)',Object.keys(x.SS_SOURCES).length===7&&Object.keys(x.SS_SOURCES).every(land=>{ const t=x.SS_ORDER.map(i=>SET(i)).filter(s=>s.land===land&&!s.dev).map(s=>s.tier).sort().join(); return t==='1,2,3'; }),Object.keys(x.SS_SOURCES).map(l=>l+':'+x.SS_ORDER.map(i=>SET(i)).filter(s=>s.land===l).map(s=>s.id+'+'+s.tier).join('/')).join(' '));
ok('the new six sit where the table says: Pell Wildwood +3, Genzo Vale +3, Brynja Reach +3, Tamsin Greyspine +3, Zahra Sunscar +2, Hollis Gloamhorn +2; Sabir and Ottoline moved down to +1',[['pell','home',3],['genzo','vale',3],['brynja','hoar',3],['tamsin','grey',3],['zahra','sun',2],['hollis','gloam',2],['sabir','sun',1],['ottoline','gloam',1]].every(([i,l,t])=>SET(i).land===l&&SET(i).tier===t));
ok('a clear at each tier rolls the set of that tier (and +4, +5 roll the +3 set)',['home','vale','hoar','grey','sun','gloam','amber'].every(l=>[1,2,3].every(t=>x.ssSetFor(l,t)&&x.ssSetFor(l,t).tier===t)&&x.ssSetFor(l,5).tier===3&&x.ssSetFor(l,0)===null));
ok('eleven women and ten men over the twenty-one; the six of version 3 are three and three (Brynja, Tamsin, Zahra / Pell, Genzo, Hollis), the Kin three are Dessa and Sefi / Brindle',x.SS_ORDER.filter(i=>SET(i).char.sex==='female').length===11&&x.SS_ORDER.filter(i=>SET(i).char.sex==='male').length===10&&['dessa','sefi'].every(i=>SET(i).char.sex==='female')&&SET('brindle').char.sex==='male'&&IDS.filter(i=>SET(i).char.sex==='female').join()==='brynja,tamsin,zahra'&&IDS.filter(i=>SET(i).char.sex==='male').join()==='pell,genzo,hollis');
ok('the new six: fire, air, earth, light and dark are single elements and Brynja is the hybrid water + dark (the dual-element DPS)',IDS.map(i=>String(SET(i).el)).join()==='fire,air,water,dark,earth,light,dark');
ok('roles: safe DPS, tank, risk DPS, grinder, support (buff), healer',(()=>{ const r=i=>SET(i).role; return r('pell').main==='safe'&&r('genzo').main==='tank'&&r('brynja').main==='risk'&&r('tamsin').main==='grind'&&r('zahra').main==='support'&&r('zahra').focus==='buff'&&r('hollis').main==='heal'; })());
ok('dual roles: Genzo tank + healer, Tamsin grind + tank, Zahra support + safe DPS, Hollis healer + debuff support (all mild); Pell and Brynja are pure DPS',(()=>{ const r=i=>SET(i).role, al=i=>r(i).also&&r(i).also.role; return al('genzo')==='heal'&&al('tamsin')==='tank'&&al('zahra')==='safe'&&al('hollis')==='support'&&!r('pell').also&&!r('brynja').also&&['genzo','tamsin','zahra','hollis'].every(i=>r(i).also.part==='mild'&&!Array.isArray(SET(i).el)); })());
ok('each set has an emblem of its own that no other set uses',(()=>{ const all=x.SS_ORDER.map(i=>SET(i).emblem); return IDS.every(i=>SET(i).emblem&&Number.isInteger(SET(i).emblem.col))&&new Set(all.map(e=>e.glyph)).size===all.length&&new Set(all.map(e=>e.col)).size===all.length; })());
ok('each set names its outfit, which exists, and has a look file and a palette of three colours',IDS.every(i=>SET(i).outfit===i&&fs.existsSync(path.join(SRC,'game','outfits',i+'.js'))&&fs.existsSync(path.join(SRC,'game','skillsets','look-'+i+'.js'))&&['main','accent','glow'].every(k=>Number.isInteger(SET(i).pal[k]))));
ok('every active deals damage; position 1 has one class version; positions 2 and 3 are universal (Pell and Sorrel\'s slot 3 are class-bound)',IDS.every(i=>PIECES(i).every(id=>x.SKILLS[id].mult>0)&&SET(i).pos[1].ids.length===1&&SET(i).pos[2].bound==='any')&&['genzo','brynja','tamsin','zahra','hollis'].every(i=>SET(i).pos[3].bound==='any')&&SET('pell').pos[3].ids.length===3);
ok('every attack kind, piece name and character name is new across all twenty-one',(()=>{ const acts=[], names=[]; for(const i of x.SS_ORDER){ for(const id of PIECES(i)){ acts.push(x.SKILLS[id].act[0]); names.push(x.SKILLS[id].name); } for(const p of [1,2,3]) names.push(x.PASSIVES[SET(i).pos[p].passive].name); }
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
const cast=(id,tgt,o)=>{ const s=x.SKILLS[id]; x.resolveFxS(p,Object.assign({fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:id},o||{}),tgt||null); if(s.fx.proj) for(let i=0;i<30;i++) W.tick(0.05); };
const clear=()=>{ const K=p.gear.skills; for(const c of ['warrior','archer','mage']) K.eq[c]={basic:null,skill:null,burst:null}; K.pass=K.pass.map(()=>null); p.ssIcd={}; p.killTs=[]; p.cd={basic:0,skill:0,burst:0}; p.ally=null; p.shield=null; x.recalcP(p); };
const hpOf=q=>q.hp/q.maxHp;
ok('the stage: a and b are one party',x.partyOf(p)&&x.partyOf(p)===x.partyOf(pb));

// ---- Pell: the lure shot marks, the night-pool spear spends it ----
clear(); reset(); put(m1,0,-12);
{ still(()=>cast('pell_2_any',m1)); tick(20); ok('Pell: Dim the Lamp puts a Lure on the target',x.ssMarkN(p,m1,'lure')===1); }
{ x.ssMarkS(p,m1,{id:'lure',n:3,dur:12,max:3}); still(()=>cast('pell_3_warrior',m1)); x.PROJS.length=0; ok('Pell: the spear\'s pop spends every Lure',x.ssMarkN(p,m1,'lure')===0); }
// ---- Genzo: every strike tolls, Ring the Hour taunts and guards the party ----
clear(); reset(); put(m1,0,-2.5);
{ still(()=>cast('genzo_1_warrior',m1)); ok('Genzo: Bell Mallet leaves a Toll on its target',x.ssMarkN(p,m1,'toll')===1); }
reset(); put(m1,0,-3);
{ still(()=>cast('genzo_2_any',null)); ok('Genzo: Ring the Hour guards the party for 20%',near(x.allyP(pb,'guard'),0.20,0.002),String(x.allyP(pb,'guard'))); }
// ---- Brynja: a skate-dash chills and marks ----
clear(); reset(); put(m1,0,-6);
{ const d=lost(m1,()=>still(()=>cast('brynja_2_any',m1))); ok('Brynja: Glide and Cut hurts the target and leaves Rime',d>0&&x.ssMarkN(p,m1,'rime')>=1,Math.round(d)+' '+x.ssMarkN(p,m1,'rime')); }
// ---- Tamsin: the quake pulls a crowd, the slope's slide hits it ----
clear(); reset(); put(m1,0,-3); put(m2,2,-3);
{ const d=lost(m1,()=>still(()=>cast('tamsin_3_any',null))); ok('Tamsin: The Mountain Moves hits what is near',d>0,String(Math.round(d))); }
// ---- Zahra: Long Noon raises critical damage for the party and spends Grain ----
clear(); reset(); put(m1,0,-3); x.ssMarkS(p,m1,{id:'grain',n:4,dur:12,max:5});
{ still(()=>cast('zahra_2_any',null)); ok('Zahra: Long Noon spends the Grain and gives the party critical damage (30% + 3% a Grain, capped)',x.ssMarkN(p,m1,'grain')===0&&x.allyP(pb,'critdmg')>=0.30-1e-6,String(x.allyP(pb,'critdmg'))); }
// ---- Hollis: the lantern swing mends the weakest, Dusk Lent returns the Vigil ----
clear(); reset(); put(m1,0,-2.5); pb.hp=pb.maxHp*0.5;
{ still(()=>cast('hollis_1_mage',m1)); ok('Hollis: Lantern Swing mends the party member with the least health and leaves a Vigil',hpOf(pb)>0.5&&x.ssMarkN(p,m1,'vigil')===1,hpOf(pb).toFixed(3)); }
reset(); put(m1,0,-3); x.ssMarkS(p,m1,{id:'vigil',n:3,dur:12,max:5}); pb.hp=pb.maxHp*0.5;
{ still(()=>cast('hollis_2_any',null)); ok('Hollis: Dusk Lent spends the Vigil and heals and shields the party',x.ssMarkN(p,m1,'vigil')===0&&hpOf(pb)>=0.6&&pb.shield&&pb.shield.v>0); }
// ---- the Amber Reach's three (Kin): Brindle, Dessa, Sefi. Registered with no outfit yet (the savanna plan's K2), their sources late-bound ----
ok('the Amber Reach: Brindle +1 (fire, safe DPS + support), Dessa +2 (earth, tank), Sefi +3 (air, risk DPS); sources are the two bosses and the Termite Cathedral',
  [['brindle',1,'fire','safe'],['dessa',2,'earth','tank'],['sefi',3,'air','risk']].every(([i,t,el,role])=>SET(i)&&SET(i).land==='amber'&&SET(i).tier===t&&SET(i).el===el&&SET(i).role.main===role&&SET(i).pos[1].ids.length===1&&SET(i).pos[2].bound==='any'&&SET(i).pos[3].bound==='any')
  &&x.SS_SOURCES.amber.join()==='oldthunder,oldhorn,termitecathedral'&&SET('brindle').role.also.role==='support'&&x.ssSetFor('amber',5).id==='sefi'&&x.ssSetFor('amber',0)===null);
ok('each of the three: an emblem and a palette of its own, a unique character name, every active deals damage, and each claims the Kin outfit K2 built (outfit = its own id)',['brindle','dessa','sefi'].every(i=>SET(i).emblem&&['main','accent','glow'].every(k=>Number.isInteger(SET(i).pal[k]))&&PIECES(i).every(id=>x.SKILLS[id].mult>0)&&SET(i).outfit===i));
clear(); reset(); put(m1,0,-8);
{ still(()=>cast('brindle_1_mage',m1)); ok('Brindle: Spark Pebble leaves a Glint on its target',x.ssMarkN(p,m1,'glint')===1,String(x.ssMarkN(p,m1,'glint'))); }
reset(); put(m1,0,-6); x.ssMarkS(p,m1,{id:'glint',n:3,dur:12,max:5});
{ still(()=>cast('brindle_2_any',m1)); ok('Brindle: Sun-Glass Burst adds a Glint and gives the party more critical hits (12% + 2% a Glint, capped)',x.ssMarkN(p,m1,'glint')>=3&&x.allyP(pb,'crit')>=0.12-1e-6,x.ssMarkN(p,m1,'glint')+' '+x.allyP(pb,'crit')); }
reset(); put(m1,0,-8); x.ssMarkS(p,m1,{id:'glint',n:4,dur:12,max:5});
{ still(()=>cast('brindle_3_any',m1)); x.PROJS.length=0; ok('Brindle: Noon Charge spends every Glint and gives the party might and critical damage',x.ssMarkN(p,m1,'glint')===0&&x.allyP(pb,'might')>=0.15-1e-6&&x.allyP(pb,'critdmg')>=0.25-1e-6); }
reset(); put(m1,0,-2.5);
{ still(()=>cast('dessa_1_warrior',m1)); ok('Dessa: Hammer Fall leaves Temper on what it hit',x.ssMarkN(p,m1,'temper')===1,String(x.ssMarkN(p,m1,'temper'))); }
reset(); put(m1,0,-3);
{ const n0=x.AREAS.length; still(()=>cast('dessa_2_any',null)); ok('Dessa: Anvil Down plants a zone round her (the party is guarded while it stands) and leaves Temper',x.AREAS.length>n0&&x.ssMarkN(p,m1,'temper')>=1,String(x.AREAS.length-n0)); }
reset(); put(m1,0,-3); x.ssMarkS(p,m1,{id:'temper',n:4,dur:12,max:5});
{ still(()=>cast('dessa_3_any',null)); ok('Dessa: Break the Herd spends the Temper and guards the party for 30%',x.ssMarkN(p,m1,'temper')===0&&near(x.allyP(pb,'guard'),0.30,0.002),String(x.allyP(pb,'guard'))); }
reset(); put(m1,0,-2.5);
{ still(()=>cast('sefi_1_warrior',m1)); ok('Sefi: Passing Cut leaves a Stride on its target',x.ssMarkN(p,m1,'stride')===1,String(x.ssMarkN(p,m1,'stride'))); }
reset(); put(m1,0,-6);
{ const d=lost(m1,()=>still(()=>cast('sefi_2_any',m1))); ok('Sefi: Gust Dash hurts the target and leaves a Stride',d>0&&x.ssMarkN(p,m1,'stride')>=1,Math.round(d)+' '+x.ssMarkN(p,m1,'stride')); }
reset(); put(m1,0,-5); x.ssMarkS(p,m1,{id:'stride',n:4,dur:12,max:5});
{ const d=lost(m1,()=>still(()=>cast('sefi_3_any',m1))); ok('Sefi: Dead Heat spends every Stride on the target for extra damage',d>0&&x.ssMarkN(p,m1,'stride')===0,Math.round(d)+' '+x.ssMarkN(p,m1,'stride')); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
