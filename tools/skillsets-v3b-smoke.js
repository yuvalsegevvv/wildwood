// Headless test of version 3's second six skill sets (Pell, Genzo, Brynja, Tamsin, Zahra, Hollis: src/shared/skillsets/<id>.js), the server straight from src/, no build.
// It checks that all twenty-four sets register (nothing left out, nothing linted), that every land has exactly one set at +1, +2 and +3 and none at +4 or above (the owner's tier table), the gender ratio, that every id is new,
// that each outfit and look file exists, and that each set's key pieces do what its file says. Usage: node tools/skillsets-v3b-smoke.js
const fs=require('fs'), path=require('path'), {loadServer, SRC}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...m.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_ORDER','SS_BAD','SS_SOURCES','ssLint','ssSetFor','ssEquipPieceP','ssGrantSetP','partyOf','allyP','ssMarkN','ssMarkS','resolveFxS','AREAS','PROJS','mstVulnK','mstWeakK','ssTriggerS','recalcP','clsOfP','getH','VIL','psP','SH_ALT','mstDirectS','SS_HEAL_CAP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const IDS=['pell','genzo','brynja','tamsin','zahra','hollis'], SET=id=>x.SS_SETS[id], PIECES=id=>[1,2,3].flatMap(n=>SET(id).pos[n].ids);

ok('all twenty-four sets register (nothing left out, nothing linted)',x.SS_ORDER.length===24&&IDS.every(i=>SET(i))&&x.SS_BAD.length===0&&x.ssLint().length===0,JSON.stringify(x.SS_BAD)+JSON.stringify(x.ssLint()));
ok('every land has one real set at +1, +2 and +3 and none above (the eight lands x three tiers)',Object.keys(x.SS_SOURCES).length===8&&Object.keys(x.SS_SOURCES).every(land=>{ const t=x.SS_ORDER.map(i=>SET(i)).filter(s=>s.land===land&&!s.dev).map(s=>s.tier).sort().join(); return t==='1,2,3'; }),Object.keys(x.SS_SOURCES).map(l=>l+':'+x.SS_ORDER.map(i=>SET(i)).filter(s=>s.land===l).map(s=>s.id+'+'+s.tier).join('/')).join(' '));
ok('the new six sit where the table says: Pell Wildwood +3, Genzo Vale +3, Brynja Reach +3, Tamsin Greyspine +3, Zahra Sunscar +2, Hollis Gloamhorn +2; Sabir and Ottoline moved down to +1',[['pell','home',3],['genzo','vale',3],['brynja','hoar',3],['tamsin','grey',3],['zahra','sun',2],['hollis','gloam',2],['sabir','sun',1],['ottoline','gloam',1]].every(([i,l,t])=>SET(i).land===l&&SET(i).tier===t));
ok('a clear at each tier rolls the set of that tier (and +4, +5 roll the +3 set)',['home','vale','hoar','grey','sun','gloam','amber'].every(l=>[1,2,3].every(t=>x.ssSetFor(l,t)&&x.ssSetFor(l,t).tier===t)&&x.ssSetFor(l,5).tier===3&&x.ssSetFor(l,0)===null));
ok('twelve women and twelve men over the twenty-four; the six of version 3 are three and three (Brynja, Tamsin, Zahra / Pell, Genzo, Hollis), the Kin three are Dessa and Sefi / Brindle',x.SS_ORDER.filter(i=>SET(i).char.sex==='female').length===12&&x.SS_ORDER.filter(i=>SET(i).char.sex==='male').length===12&&['dessa','sefi'].every(i=>SET(i).char.sex==='female')&&SET('brindle').char.sex==='male'&&IDS.filter(i=>SET(i).char.sex==='female').join()==='brynja,tamsin,zahra'&&IDS.filter(i=>SET(i).char.sex==='male').join()==='pell,genzo,hollis');
ok('the new six: fire, air, water, earth, light and dark: one element each (Brynja is water)',IDS.map(i=>String(SET(i).el)).join()==='fire,air,water,earth,light,dark');
ok('roles: safe DPS, tank, risk DPS, grinder, support (buff), healer',(()=>{ const r=i=>SET(i).role; return r('pell').main==='safe'&&r('genzo').main==='tank'&&r('brynja').main==='risk'&&r('tamsin').main==='grind'&&r('zahra').main==='support'&&r('zahra').focus==='buff'&&r('hollis').main==='heal'; })());
ok('dual roles: Genzo tank + healer, Tamsin grind + tank, Zahra support + safe DPS, Hollis healer + debuff support (all mild); Pell and Brynja are pure DPS',(()=>{ const r=i=>SET(i).role, al=i=>r(i).also&&r(i).also.role; return al('genzo')==='heal'&&al('tamsin')==='tank'&&al('zahra')==='safe'&&al('hollis')==='support'&&!r('pell').also&&!r('brynja').also&&['genzo','tamsin','zahra','hollis'].every(i=>r(i).also.part==='mild'&&!Array.isArray(SET(i).el)); })());
ok('each set has an emblem of its own that no other set uses',(()=>{ const all=x.SS_ORDER.map(i=>SET(i).emblem); return IDS.every(i=>SET(i).emblem&&Number.isInteger(SET(i).emblem.col))&&new Set(all.map(e=>e.glyph)).size===all.length&&new Set(all.map(e=>e.col)).size===all.length; })());
ok('each set names its outfit, which exists, and has a look file and a palette of three colours',IDS.every(i=>SET(i).outfit===i&&fs.existsSync(path.join(SRC,'game','outfits',i+'.js'))&&fs.existsSync(path.join(SRC,'game','skillsets','look-'+i+'.js'))&&['main','accent','glow'].every(k=>Number.isInteger(SET(i).pal[k]))));
ok('every active deals damage; position 1 has one class version; positions 2 and 3 are universal (Pell and Sorrel\'s slot 3 are class-bound)',IDS.every(i=>PIECES(i).every(id=>x.SKILLS[id].mult>0)&&SET(i).pos[1].ids.length===1&&SET(i).pos[2].bound==='any')&&['genzo','brynja','tamsin','zahra','hollis'].every(i=>SET(i).pos[3].bound==='any')&&SET('pell').pos[3].ids.length===3);
ok('every attack kind, piece name and character name is new across all twenty-four',(()=>{ const acts=[], names=[]; for(const i of x.SS_ORDER){ for(const id of PIECES(i)){ acts.push(x.SKILLS[id].act[0]); names.push(x.SKILLS[id].name); } for(const p of [1,2,3]) names.push(x.PASSIVES[SET(i).pos[p].passive].name); }
  return new Set(acts).size===acts.length&&new Set(names).size===names.length&&new Set(x.SS_ORDER.map(i=>SET(i).char.name)).size===x.SS_ORDER.length; })());
ok('the wording rule: no set or character text names a forbidden festival theme',IDS.every(i=>!/halloween|pumpkin/i.test(fs.readFileSync(path.join(SRC,'shared','skillsets',i+'.js'),'utf8')+fs.readFileSync(path.join(SRC,'game','outfits',i+'.js'),'utf8')+fs.readFileSync(path.join(SRC,'game','skillsets','look-'+i+'.js'),'utf8'))));

// ---- the stage ----
W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:60}}); W.join('b',{name:'Other',look:{cls:'archer'},save:{level:60}}); tick(3);
const p=W.players.get('a'), pb=W.players.get('b');
W.receive('a',{t:'party',a:'invite',name:'Other'}); tick(3); W.receive('b',{t:'party',a:'accept'}); tick(3);
const norm=x.MONS.filter(m=>!m.boss&&!m.inst&&m.def.id==='slime'), [m1,m2,m3]=norm;
const stand=(q,dx,dz)=>{ W.setPos(q.id,[p.x+dx,x.getH(p.x+dx,p.z+dz),p.z+dz,0,0,0]); q.dead=false; q.hp=q.maxHp; q.ally=null; q.shield=null; };
const put=(m,dx,dz,face)=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e9; m.mk=null; m.st=null; m.inst=0; m.immune=false; m.burnT=m.slowT=0; m.stunT=1e9; m.taunt=null; m.aggro=false; m.x=p.x+dx; m.z=p.z+dz; m.face=face===undefined?Math.PI:face; return m; };
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null; p.face=0; p.level=60;
const reset=()=>{ x.AREAS.length=0; x.PROJS.length=0; stand(p,0,0); p.ally=null; p.shield=null; p.ssCastT={}; stand(pb,3,0); for(const m of [m1,m2,m3]) put(m,0,-30); };
const still=fn=>{ const R=Math.random; Math.random=()=>0.5; try{ return fn(); } finally{ Math.random=R; } };
const lost=(m,fn)=>{ const h=m.hp; fn(); return h-m.hp; };
const cast=(id,tgt,o)=>{ const s=x.SKILLS[id]; x.resolveFxS(p,Object.assign({fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:id},o||{}),tgt||null); if(s.fx.proj) for(let i=0;i<30;i++) W.tick(0.05); };
const clear=()=>{ const K=p.gear.skills; for(const c of ['warrior','archer','mage']) K.eq[c]={basic:null,skill:null,burst:null}; K.pass=K.pass.map(()=>null); p.ssIcd={}; p.killTs=[]; p.cd={basic:0,skill:0,burst:0}; p.ally=null; p.shield=null; x.recalcP(p); };
const hpOf=q=>q.hp/q.maxHp;
ok('the stage: a and b are one party',x.partyOf(p)&&x.partyOf(p)===x.partyOf(pb));

// ---- Pell: the lure shot marks, the night-pool spear spends it ----
clear(); reset(); put(m1,0,-12);
{ still(()=>cast('pell_2_any',m1)); tick(20); ok('Pell: Dim the Lamp puts a Lure on the target and sets it ablaze (the fire flavor became a plain burn)',x.ssMarkN(p,m1,'lure')===1&&m1.burnT>0&&x.ssMarkN(p,m2,'lure')===0); }
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
// ---- Zahra (synergy, docs/skillkits/SYNERGY-REWORK.md section 4): Grain is glare ----
ok('Zahra (synergy): the registry takes the sandglass\'s status.perMark (the set registered, nothing left out)',!!SET('zahra')&&!(x.SS_BAD||[]).some(b=>String(b.id||b).indexOf('zahra')===0)&&x.SKILLS.zahra_3_any.fx.zone.status.perMark.id==='grain');
clear(); reset(); put(m1,0,-2.5);
{ still(()=>cast('zahra_1_mage',m1)); const g0=x.allyP(pb,'guard'); reset(); put(m1,0,-2.5); x.ssMarkS(p,m1,{id:'grain',n:5,dur:12,max:5}); still(()=>cast('zahra_1_mage',m1));
  ok('Zahra (synergy): Sunlit Bolt guards the party 8% with no Grain near, 13% with five',near(g0,0.08)&&near(x.allyP(pb,'guard'),0.13),g0+' / '+x.allyP(pb,'guard')); x.PROJS.length=0; }
reset(); put(m1,0,-3); put(m2,0,-20); put(m3,2,-3); x.ssMarkS(p,m3,{id:'grain',n:4,dur:12,max:5});
{ still(()=>cast('zahra_3_any',null)); tick(22); const w1=x.mstWeakK(m1), w3=x.mstWeakK(m3);   // (the glass ticks every second, the first at 1 s)
  ok('Zahra (synergy): a sandglass tick leaves a Grain on what stands in it (none outside) and dazzles it: 4% less on a clean monster, 8.8% at four Grain (the tick reads before it lays)',x.ssMarkN(p,m1,'grain')===1&&x.ssMarkN(p,m2,'grain')===0&&near(w1,0.96,1e-6)&&near(w3,0.912,1e-6),w1+' / '+w3);
  tick(20); ok('...a second later the dazzle on the third has climbed to 10% (five Grain), and the party in the glass is guarded 12%',near(x.mstWeakK(m3),0.90,1e-6)&&near(x.allyP(pb,'guard'),0.12),x.mstWeakK(m3)+' / '+x.allyP(pb,'guard')); x.AREAS.length=0; }
clear(); reset(); put(m1,0,-3); p.ssIcd={}; p.ss=Object.assign({},p.ss,{trig:{hurt:[x.PASSIVES.zahra_p2]}});   // (Heat Haze is Bond IV: its row alone, as the Bond engine would add it)
{ x.ssTriggerS(p,'hurt',{m:m1}); clear(); ok('Zahra (synergy): Heat Haze dazzles what hit her (15%) and leaves it a Grain',near(x.mstWeakK(m1),0.85,1e-6)&&x.ssMarkN(p,m1,'grain')===1,x.mstWeakK(m1)+' '+x.ssMarkN(p,m1,'grain')); }
// ---- Hollis: the lantern swing mends the weakest, Dusk Lent returns the Vigil ----
clear(); reset(); put(m1,0,-2.5); pb.hp=pb.maxHp*0.5;
{ still(()=>cast('hollis_1_mage',m1)); ok('Hollis: Lantern Swing mends the party member with the least health and leaves a Vigil',hpOf(pb)>0.5&&x.ssMarkN(p,m1,'vigil')===1,hpOf(pb).toFixed(3)); }
reset(); put(m1,0,-3); x.ssMarkS(p,m1,{id:'vigil',n:3,dur:12,max:5}); pb.hp=pb.maxHp*0.5;
{ still(()=>cast('hollis_2_any',null)); ok('Hollis: Dusk Lent spends the Vigil and heals and shields the party',x.ssMarkN(p,m1,'vigil')===0&&hpOf(pb)>=0.59&&pb.shield&&pb.shield.v>0); }
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

// ================= the combo rework (docs/skillkits/COMBO-REWORK.md sections 3, 4, 6, 7) =================
const procs=(n0,id)=>evs.slice(n0).filter(e=>e[0]==='proc'&&e[2]===id);
const castRow=(s,tgt)=>{ x.resolveFxS(p,{fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:s.base||s.id,src:s.base?s.id:undefined},tgt||null); if(s.fx.proj) for(let i=0;i<30;i++) W.tick(0.05); };
// ---- Brynja: build, chill, shatter ----
clear(); reset(); tick(3); let n0=evs.length;
{ put(m1,0,-6); const clean=lost(m1,()=>still(()=>cast('brynja_2_any',m1)));
  reset(); put(m1,0,-6); x.ssMarkS(p,m1,{id:'rime',n:1,dur:12,max:5}); const rimed=lost(m1,()=>still(()=>cast('brynja_2_any',m1)));
  ok('Brynja: Glide and Cut hits a rimed target 1.4x (Cold Read) and chills it for 4 s',near(rimed/clean,1.4,0.02)&&m1.slowT>=3.9,(rimed/clean).toFixed(3)+' slow '+m1.slowT.toFixed(2)); }
{ reset(); put(m1,0,-10); x.ssMarkS(p,m1,{id:'rime',n:5,dur:12,max:5}); const cold=lost(m1,()=>still(()=>cast('brynja_3_any',m1)));
  reset(); put(m1,0,-10); x.ssMarkS(p,m1,{id:'rime',n:5,dur:12,max:5}); m1.slowT=100; const sh=lost(m1,()=>still(()=>cast('brynja_3_any',m1)));
  const V=x.SKILLS.brynja_3_any.fx.vs; reset(); put(m1,0,-10); x.ssMarkS(p,m1,{id:'rime',n:5,dur:12,max:5}); m1.slowT=100; p.ssCastT={skill:x.S.t}; const tight=lost(m1,()=>still(()=>cast('brynja_3_any',m1)));
  ok('Brynja: Whiteout shatters a chilled target: x'+V.k+' from its impact and its pop together, x'+V.tight.k+' more within '+V.tight.secs+' s of Glide and Cut (combo spread)',near(sh/cold,V.k,0.02)&&near(tight/sh,V.tight.k,0.02),(sh/cold).toFixed(3)+' '+(tight/sh).toFixed(3)); }
tick(3); { const nW=evs.length; reset(); put(m1,0,-10); still(()=>cast('brynja_3_any',m1)); tick(3);
  ok('Brynja: Whiteout\'s own slow lands after its hit: on a clean target it never shatters (no Shatter proc)',procs(nW,'brynja_3_any').length===0&&m1.slowT>0); }
{ const H=x.SH_ALT.brynja_2_any; reset(); put(m1,0,-8); put(m2,0,8); still(()=>castRow(H,m1));
  ok('Brynja: the held Frost Line chills (4 s) and rimes everything in its 12 m line, not what is behind her',!!H&&x.ssMarkN(p,m1,'rime')===1&&m1.slowT>=3.9&&x.ssMarkN(p,m2,'rime')===0,H&&(x.ssMarkN(p,m1,'rime')+' '+m1.slowT.toFixed(2))); }
tick(3); ok('Brynja: the proc events name the pieces whose combo fired (brynja_2_any, brynja_3_any)',procs(n0,'brynja_2_any').length>0&&procs(n0,'brynja_3_any').length>0);
// ---- Sefi: spend, then run the second lap ----
clear(); reset(); tick(3); n0=evs.length;
{ const dh=n=>{ reset(); put(m1,0,-5); if(n) x.ssMarkS(p,m1,{id:'stride',n,dur:12,max:5}); p.cd.skill=10; still(()=>cast('sefi_3_any',m1)); return 10-p.cd.skill; };
  const r5=dh(5), r2=dh(2); p.cd.skill=0.5; x.ssMarkS(p,m1,{id:'stride',n:5,dur:12,max:5}); reset(); put(m1,0,-5); x.ssMarkS(p,m1,{id:'stride',n:5,dur:12,max:5}); still(()=>cast('sefi_3_any',m1)); tick(3);
  ok('Sefi: Dead Heat at 5 Strides takes 7 s off Gust Dash (2.8 s at 2), never below 0, and the cdr event is sent',near(r5,7,1e-6)&&near(r2,2.8,1e-6)&&p.cd.skill===0&&evs.slice(n0).some(e=>e[0]==='cdr'&&e[1]==='a'&&e[2]==='skill'),r5.toFixed(2)+' '+r2.toFixed(2)+' '+p.cd.skill); }
{ reset(); put(m1,0,-6); const clean=lost(m1,()=>still(()=>cast('sefi_2_any',m1)));
  reset(); put(m1,0,-6); x.mstDirectS(m1,{status:{kind:'weak',v:0.1,dur:4}},p); const lap=lost(m1,()=>still(()=>cast('sefi_2_any',m1)));
  const V=x.SKILLS.sefi_2_any.fx.vs; reset(); put(m1,0,-6); x.mstDirectS(m1,{status:{kind:'weak',v:0.1,dur:4}},p); p.ssCastT={burst:x.S.t}; const tl=lost(m1,()=>still(()=>cast('sefi_2_any',m1)));
  tick(3); ok('Sefi: Gust Dash into a weakened target deals x'+V.k+' (Second Lap), x'+V.tight.k+' more within '+V.tight.secs+' s of Dead Heat, and the proc names sefi_2_any',near(lap/clean,V.k,0.02)&&near(tl/lap,V.tight.k,0.02)&&procs(n0,'sefi_2_any').length>0,(lap/clean).toFixed(3)+' '+(tl/lap).toFixed(3)); }
// ---- Hollis: the night keeps the vigil, the dusk returns it ----
clear(); reset();
{ const heal=n=>{ reset(); put(m1,0,-3); if(n) x.ssMarkS(p,m1,{id:'vigil',n,dur:12,max:5}); pb.hp=pb.maxHp*0.5; pb.shield=null; still(()=>cast('hollis_2_any',null)); return hpOf(pb)-0.5; };
  const k=1+x.psP(p,'heal'), h0=heal(0), h5=heal(5);
  ok('Hollis: Dusk Lent heals an ally 6% with no Vigil and 12% with five (x heal power), never above SS_HEAL_CAP',near(h0,0.06*k,0.003)&&near(h5,0.12*k,0.003)&&h5<=x.SS_HEAL_CAP,h0.toFixed(4)+' '+h5.toFixed(4)); }
{ reset(); put(m1,0,-3); put(m2,4,-4); put(m3,0,-20); still(()=>cast('hollis_3_any',null));
  ok('Hollis: The Long Night leaves a full Vigil (5) on every monster within 9 m',x.ssMarkN(p,m1,'vigil')===5&&x.ssMarkN(p,m2,'vigil')===5&&x.ssMarkN(p,m3,'vigil')===0);
  stand(p,0,0); still(()=>cast('hollis_2_any',null)); ok('Hollis: ...and Dusk Lent then returns them all',x.ssMarkN(p,m1,'vigil')===0&&x.ssMarkN(p,m2,'vigil')===0); }
// ---- Tamsin: rattle the slope, then bring it down ----
clear(); reset(); tick(3); n0=evs.length;
{ put(m1,0,-10); still(()=>cast('tamsin_2_any',m1)); tick(12); ok('Tamsin: Pull the Slope\'s tick rattles (slows) what stands in it',m1.slowT>0,m1.slowT.toFixed(2)); x.AREAS.length=0; }
{ const run=slow=>{ reset(); put(m1,0,-2); if(slow) m1.slowT=100; const ring=lost(m1,()=>still(()=>cast('tamsin_3_any',null))); m1.x=p.x; m1.z=p.z-2; m1.kbx=m1.kbz=0;
    const zone=lost(m1,()=>still(()=>{ for(let i=0;i<60;i++){ m1.x=p.x; m1.z=p.z-2; W.tick(0.05); } })); return [ring,zone]; };
  const [rc,zc]=run(false), [rs,zs]=run(true);
  const TK=x.SKILLS.tamsin_3_any.fx.vs.k; ok('Tamsin: a rattled target takes x'+TK+' from The Mountain Moves\' ring and from its slide; a clean one takes 1x for all five ticks (its own zone never rattles)',near(rs/rc,TK,0.02)&&near(zs/zc,TK,0.02)&&near(zc/rc,5,0.05),(rs/rc).toFixed(3)+' '+(zs/zc).toFixed(3)+' ticks '+(zc/rc).toFixed(2)); }
{ reset(); put(m1,0,-2); const plain=lost(m1,()=>still(()=>cast('tamsin_1_warrior',m1))); reset(); put(m1,0,-2); m1.slowT=100; const rat=lost(m1,()=>still(()=>cast('tamsin_1_warrior',m1)));
  ok('Tamsin: Sledge Sweep hits a rattled target 1.25x (Loose Footing)',near(rat/plain,1.25,0.02),(rat/plain).toFixed(3)); }
{ const H=x.SH_ALT.tamsin_2_any; reset(); put(m1,0,-5); still(()=>castRow(H,null)); tick(12);
  ok('Tamsin: the held Dig In taunts, rattles and shields her (8%)',!!H&&m1.taunt&&m1.taunt.by==='a'&&m1.slowT>0&&p.shield&&near(p.shield.v0,p.maxHp*0.08,1),H&&JSON.stringify(m1.taunt)); x.AREAS.length=0; }
tick(3); ok('Tamsin: the proc events name the sweep and the mountain (tamsin_1_warrior, tamsin_3_any)',procs(n0,'tamsin_1_warrior').length>0&&procs(n0,'tamsin_3_any').length>0);
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
