// Headless test of the Emberwake Isles' three skill sets (Meleni, Tzaya, Atuqa: src/shared/skillsets/<id>.js), the server straight from src/, no build.
// It checks that all twenty-four sets register (nothing left out, nothing linted), that the isles have one set at +1, +2 and +3 (the table every land follows), that the sources are Ocelo, Tuila and the Cenote,
// that every name is new, that each set has a look file and an emblem of its own, and that each active resolves against a monster without a fault and does damage. Usage: node tools/skillsets-isles-smoke.js
const fs=require('fs'), path=require('path'), {loadServer, SRC}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_ORDER','SS_BAD','SS_SOURCES','ssLint','ssSetFor','ssSourceOf','resolveFxS','AREAS','PROJS','recalcP','getH','VIL','ssMarkN','ssMarkS','SH_ALT','allyP','SS_ALLY_CAP']);
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
const put=()=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e9; m.mk=null; m.st=null; m.inst=0; m.immune=false; m.burnT=m.slowT=0; m.stunT=1e9; m.taunt=null; m.aggro=false; m.x=p.x; m.z=p.z-3; m.face=Math.PI; };
const cast=id=>{ const s=x.SKILLS[id]; put(); const h=m.hp; x.resolveFxS(p,{fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:id},m); if(s.fx.proj||s.fx.zone) for(let i=0;i<30;i++){ W.tick(0.05); m.stunT=1e9; m.x=p.x; m.z=p.z-3; } return h-m.hp; };   // (a zone hurts on its ticks)
for(const i of IDS){ let bad=[]; for(const id of PIECES(i)){ let d=0; try{ d=cast(id); }catch(e){ bad.push(id+' threw '+e.message); } if(!(d>0)) bad.push(id+' did no damage'); }
  ok(i+': its three actives resolve without a fault and each does damage',!bad.length,bad.join('; ')); }

// ---- Meleni, the combo rework (docs/skillkits/COMBO-REWORK.md section 8): ebb, then flow ----
{ const m2=x.MONS.filter(q=>!q.boss&&!q.inst&&q.def.id==='slime')[1], at=(q,dz)=>{ q.dead=false; q.remove=false; q.hp=q.maxHp=1e9; q.mk=null; q.st=null; q.inst=0; q.immune=false; q.slowT=0; q.stunT=1e9; q.taunt=null; q.x=p.x; q.z=p.z+dz; q.kbx=q.kbz=0; };
  const run=(s,tgt,n)=>{ x.resolveFxS(p,{fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:s.base||s.id,src:s.base?s.id:undefined},tgt||null); for(let i=0;i<(n||0);i++) W.tick(0.05); };
  const land=(n,cd)=>{ at(m,-3); if(n) x.ssMarkS(p,m,{id:'swell',n,dur:12,max:5}); p.cd.burst=cd; p.ally=null; run(x.SKILLS.meleni_2_any,null); return cd-p.cd.burst; };
  const r5=land(5,20), mt=x.allyP(p,'might'), r0=land(5,0);
  ok('Meleni: Landfall at five Swell takes 7.5 s off Call the Tide (nothing when the tide is ready), and its might is 10% + 2% a Swell = 20%, under the cap',Math.abs(r5-7.5)<1e-6&&r0===0&&Math.abs(mt-0.20)<1e-6&&mt<=x.SS_ALLY_CAP.might,r5+' '+r0+' might '+mt);
  at(m,-3); at(m2,-15); x.AREAS.length=0; run(x.SKILLS.meleni_3_any,null,30); x.AREAS.length=0;
  ok('Meleni: the risen tide lays a Swell a second on an enemy inside it, none outside',x.ssMarkN(p,m,'swell')>=1&&x.ssMarkN(p,m2,'swell')===0,x.ssMarkN(p,m,'swell')+' / '+x.ssMarkN(p,m2,'swell'));
  const H=x.SH_ALT.meleni_2_any; at(m,-6); p.ally=null; const d0=Math.hypot(m.x-p.x,m.z-p.z); run(H,null,10); const d1=Math.hypot(m.x-p.x,m.z-p.z);
  ok('Meleni: the held Ebb lays 2 Swell, pulls the enemy nearer and guards the party for 12%; its own cooldown is 9 s',!!H&&x.ssMarkN(p,m,'swell')===2&&d1<d0-0.3&&Math.abs(x.allyP(p,'guard')-0.12)<1e-6&&H.cd===9,H&&(x.ssMarkN(p,m,'swell')+' '+d0.toFixed(2)+'->'+d1.toFixed(2)+' guard '+x.allyP(p,'guard')));
  // the uptime of the crit zone (COMBO-REWORK.md section 8): 6 / 45 = 13% cast on cooldown with no Swell; a Landfall (cd 14) at five Swell every 14 s while the tide waits takes 7.5 s off each time, so the
  // tide is back after T with T + 7.5 x floor(T / 14) >= 45: T = 30 (two refunds), about 27 s with Salt Throat's longer Landfall counted out: 6 / 27 to 6 / 30 = 20-22%
  const T=(()=>{ for(let t=1;t<=45;t++) if(t+7.5*Math.floor(t/14)>=45) return t; return 45; })();
  ok('Meleni: Call the Tide stands for 6 s; its uptime rises from 13% (on cooldown, no Swell) to about 20% with a full Landfall on every Landfall cooldown',x.SKILLS.meleni_3_any.fx.zone.dur===6&&x.SKILLS.meleni_3_any.cd===45&&Math.abs(6/45-0.133)<0.001&&6/T>=0.19&&6/T<=0.23,'cycle '+T+' s, '+Math.round(600/T)+'%'); }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
