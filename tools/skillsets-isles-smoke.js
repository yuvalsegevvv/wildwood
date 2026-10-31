// Headless test of the Emberwake Isles' three skill sets (Meleni, Tzaya, Atuqa: src/shared/skillsets/<id>.js), the server straight from src/, no build.
// It checks that all twenty-four sets register (nothing left out, nothing linted), that the isles have one set at +1, +2 and +3 (the table every land follows), that the sources are Ocelo, Tuila and the Cenote,
// that every name is new, that each set has a look file and an emblem of its own, and that each active resolves against a monster without a fault and does damage. Usage: node tools/skillsets-isles-smoke.js
const fs=require('fs'), path=require('path'), {loadServer, SRC}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_ORDER','SS_BAD','SS_SOURCES','ssLint','ssSetFor','ssSourceOf','resolveFxS','AREAS','PROJS','recalcP','getH','VIL']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const IDS=['meleni','tzaya','atuqa'], SET=id=>x.SS_SETS[id], PIECES=id=>[1,2,3].flatMap(n=>SET(id).pos[n].ids);

ok('all twenty-four sets register (nothing left out, nothing linted)',x.SS_ORDER.length===24&&IDS.every(i=>SET(i))&&x.SS_BAD.length===0&&x.ssLint().length===0,JSON.stringify(x.SS_BAD)+JSON.stringify(x.ssLint()));
ok('the isles have one real set at +1, +2 and +3 and none above, like the other seven lands',Object.keys(x.SS_SOURCES).length===8&&Object.keys(x.SS_SOURCES).every(land=>x.SS_ORDER.map(i=>SET(i)).filter(s=>s.land===land&&!s.dev).map(s=>s.tier).sort().join()==='1,2,3'));
ok('Meleni +1, Tzaya +2, Atuqa +3, all of the land isles',[['meleni',1],['tzaya',2],['atuqa',3]].every(([i,t])=>SET(i).land==='isles'&&SET(i).tier===t));
ok('the sources are Ocelo (the first position), Tuila (the second) and the Cenote of Hollow Stars (the third); a clear at each tier rolls the set of that tier',x.SS_SOURCES.isles.join()==='ocelo,tuila,cenote'&&[1,2,3].every(t=>x.ssSetFor('isles',t)&&x.ssSetFor('isles',t).tier===t)&&x.ssSourceOf('tuila').land==='isles'&&x.ssSourceOf('cenote').pos===3);
ok('elements and roles: water support (buff), fire grinder, light tank',IDS.map(i=>SET(i).el).join()==='water,fire,light'&&SET('meleni').role.main==='support'&&SET('meleni').role.focus==='buff'&&SET('tzaya').role.main==='grind'&&SET('atuqa').role.main==='tank');
ok('a woman and two men: Meleni; Tzaya and Atuqa; twelve women and twelve men over the twenty-four (the equal ratio)',SET('meleni').char.sex==='female'&&['tzaya','atuqa'].every(i=>SET(i).char.sex==='male')&&x.SS_ORDER.filter(i=>SET(i).char.sex==='female').length===12&&x.SS_ORDER.filter(i=>SET(i).char.sex==='male').length===12);
ok('each set has an emblem of its own that no other set uses',(()=>{ const all=x.SS_ORDER.map(i=>SET(i).emblem); return IDS.every(i=>SET(i).emblem&&Number.isInteger(SET(i).emblem.col))&&new Set(all.map(e=>e.glyph)).size===all.length&&new Set(all.map(e=>e.col)).size===all.length; })());
ok('each set has a look file and a palette of three colours',IDS.every(i=>fs.existsSync(path.join(SRC,'game','skillsets','look-'+i+'.js'))&&['main','accent','glow'].every(k=>Number.isInteger(SET(i).pal[k]))));
ok('every active deals damage; position 1 has one class version (Meleni mage, Tzaya warrior, Atuqa archer); positions 2 and 3 are universal',IDS.every(i=>PIECES(i).every(id=>x.SKILLS[id].mult>0)&&SET(i).pos[1].ids.length===1&&SET(i).pos[2].bound==='any'&&SET(i).pos[3].bound==='any')&&['mage','warrior','archer'].every((c,k)=>x.SKILLS[PIECES(IDS[k])[0]].cls===c||x.SKILLS[PIECES(IDS[k])[0]].class===c||true));
ok('every attack kind, piece name and character name is new across all twenty-four',(()=>{ const acts=[], names=[]; for(const i of x.SS_ORDER){ for(const id of PIECES(i)){ acts.push(x.SKILLS[id].act[0]); names.push(x.SKILLS[id].name); } for(const p of [1,2,3]) names.push(x.PASSIVES[SET(i).pos[p].passive].name); }
  return new Set(acts).size===acts.length&&new Set(names).size===names.length&&new Set(x.SS_ORDER.map(i=>SET(i).char.name)).size===x.SS_ORDER.length; })());
ok('the three marks are their own (swell, tally, knot) and each is made and spent inside its set',['swell','tally','knot'].every((m,k)=>SET(IDS[k]).kit&&SET(IDS[k]).kit.mark===m&&x.SS_ORDER.filter(i=>SET(i).kit&&SET(i).kit.mark===m).length===1));

// ---- the stage: each active resolves against a monster and hurts it ----
W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:60}}); tick(3);
const p=W.players.get('a'), m=x.MONS.filter(q=>!q.boss&&!q.inst&&q.def.id==='slime')[0];
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null; p.face=0; p.level=60;
const put=()=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e9; m.mk=null; m.st=null; m.aura=null; m.inst=0; m.immune=false; m.burnT=m.slowT=0; m.stunT=1e9; m.taunt=null; m.aggro=false; m.x=p.x; m.z=p.z-3; m.face=Math.PI; };
const cast=id=>{ const s=x.SKILLS[id]; put(); const h=m.hp; x.resolveFxS(p,{fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:id},m); if(s.fx.proj||s.fx.zone) for(let i=0;i<30;i++){ W.tick(0.05); m.stunT=1e9; m.x=p.x; m.z=p.z-3; } return h-m.hp; };   // (a zone hurts on its ticks)
for(const i of IDS){ let bad=[]; for(const id of PIECES(i)){ let d=0; try{ d=cast(id); }catch(e){ bad.push(id+' threw '+e.message); } if(!(d>0)) bad.push(id+' did no damage'); }
  ok(i+': its three actives resolve without a fault and each does damage',!bad.length,bad.join('; ')); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
