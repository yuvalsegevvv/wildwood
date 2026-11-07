// Headless test of the ten set passives that act instead of adding a flat number (docs/SKILL-SETS.md, section on passives): Genzo's Toll Taker, Atuqa's Knotted Ground, Torgeir's Iron Return, Dessa's Shrug It Off,
// Brynja's Skate Mark, Sefi's Bolt, Tzaya's Cinder Count, Zahra's Heat Haze, Meleni's Rising Swell, Hollis's Lantern Leans In. The server straight from src/, no build. Each one is worn, its trigger is fired
// by hand, and the result is read off the player and the monsters (a mark, a shield, a buff, a zone, a status, a cooldown); the server also tells the client with a `proc` event [pid, rowId, monId].
// Usage: node tools/skillsets-passives-smoke.js
const {loadServer}=require('./load');
const evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...m.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_BAD','ssEquipPieceP','ssGrantSetP','allyP','ssMarkN','ssTriggerS','AREAS','mstWeakK','recalcP','clsOfP','getH','VIL']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
W.join('a',{name:'Tester',look:{cls:'warrior'},save:{level:60}}); tick(3);
const p=W.players.get('a'), [m1,m2]=x.MONS.filter(m=>!m.boss&&!m.inst&&m.def.id==='slime');
const put=(m,dx,dz)=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e9; m.mk=null; m.st=null; m.inst=0; m.immune=false; m.burnT=m.slowT=0; m.stunT=1e9; m.taunt=null; m.aggro=false; m.x=p.x+dx; m.z=p.z+dz; return m; };
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null; p.face=0; p.level=60;
const wear=id=>{ const K=p.gear.skills; for(const c of ['warrior','archer','mage']) K.eq[c]={basic:null,skill:null,burst:null}; x.ssGrantSetP(p,id); const S=x.SS_SETS[id];
  for(const pos of [1,2,3]){ const P=S.pos[pos], sid=P.bound==='any'?P.ids[0]:P.ids.find(i=>x.SKILLS[i].cls===x.clsOfP(p))||P.ids[0]; x.ssEquipPieceP(p,x.SKILLS[sid]); }
  K.pass=[1,2,3].map(k=>S.pos[k].passive); p.ssIcd={}; p.killTs=[]; p.cd={basic:0,skill:0,burst:0}; p.ally=null; p.shield=null; p.hp=p.maxHp; x.recalcP(p); put(m1,0,-2); put(m2,2,-2); x.AREAS.length=0; evs.length=0; };
const rnd=v=>{ const R=Math.random; Math.random=()=>v; return ()=>{ Math.random=R; }; };
const proc=id=>{ tick(3); return evs.some(e=>e[0]==='proc'&&e[1]==='a'&&e[2]===id); };   // (events leave with the next snapshot)

ok('the ten reworked passives are triggered rows, nothing was left out of the registry',x.SS_BAD.length===0&&['genzo_p2','atuqa_p2','torgeir_p2','dessa_p2','brynja_p1','sefi_p2','tzaya_p3','zahra_p2','meleni_p2','hollis_p2'].every(i=>x.PASSIVES[i]&&x.PASSIVES[i].on),JSON.stringify(x.SS_BAD));

wear('genzo'); x.ssTriggerS(p,'taunt',{m:m1}); const g1=x.ssMarkN(p,m1,'toll'); x.ssTriggerS(p,'taunt',{m:m1}); const g2=x.ssMarkN(p,m1,'toll');
ok('Genzo: Toll Taker leaves a Toll on an enemy taken hold of with a taunt, not again within its 1.5 s wait',g1===1&&g2===1&&proc('genzo_p2'),g1+' '+g2);

wear('atuqa'); x.ssTriggerS(p,'hurt',{m:m1,v:50});
ok('Atuqa: Knotted Ground leaves a Knot on whatever hurt her',x.ssMarkN(p,m1,'knot')===1&&proc('atuqa_p2'),x.ssMarkN(p,m1,'knot'));

wear('torgeir'); { const back=rnd(0.1); try{ const h=m1.hp; x.ssTriggerS(p,'hurt',{m:m2,v:50}); ok('Torgeir: Iron Return answers a blow with a shockwave 3.5 m round him that hurts what is close',m1.hp<h&&proc('torgeir_p2'),Math.round(h-m1.hp)); } finally{ back(); } }
wear('torgeir'); { const back=rnd(0.9); try{ const h=m1.hp; x.ssTriggerS(p,'hurt',{m:m2,v:50}); ok('...but only a third of the time',m1.hp===h,Math.round(h-m1.hp)); } finally{ back(); } }

wear('dessa'); { const back=rnd(0.1); try{ p.cd={basic:0,skill:10,burst:10}; x.ssTriggerS(p,'hurt',{m:m1,v:50}); ok('Dessa: Shrug It Off takes 1.5 s off the skill\'s cooldown when a blow lands (a fifth of them)',Math.abs(p.cd.skill-8.5)<0.2&&p.cd.burst===10&&proc('dessa_p2'),p.cd.skill+' / '+p.cd.burst); } finally{ back(); } }

wear('brynja'); x.ssTriggerS(p,'cast2',{m:m1});
ok('Brynja: casting Glide and Cut leaves a patch of black ice (a zone starts)',x.AREAS.length>0&&proc('brynja_p1'),x.AREAS.length);

wear('sefi'); p.hp=p.maxHp*0.3; x.ssTriggerS(p,'low',{m:m1,v:10}); const sh=p.shield&&p.shield.v;
ok('Sefi: Bolt below 40% health gives 30% shorter cooldowns and a shield worth 10% of health',x.allyP(p,'haste')>0.29&&sh>p.maxHp*0.09&&proc('sefi_p2'),x.allyP(p,'haste')+' '+sh);
p.hp=p.maxHp*0.3; x.ssTriggerS(p,'low',{m:m1,v:10}); ok('...once every 45 s',p.ssIcd.sefi_p2>0,'');
wear('sefi'); p.hp=p.maxHp*0.9; x.ssTriggerS(p,'low',{m:m1,v:10}); ok('...and not while healthy',!p.shield&&x.allyP(p,'haste')===0);

wear('tzaya'); x.ssTriggerS(p,'crit',{m:m1,v:10});
ok('Tzaya: Cinder Count adds a Tally to what a critical hit struck',x.ssMarkN(p,m1,'tally')===1&&proc('tzaya_p3'),x.ssMarkN(p,m1,'tally'));

wear('zahra'); x.ssTriggerS(p,'hurt',{m:m1,v:50});
ok('Zahra: Heat Haze leaves what hurt her dealing 15% less',Math.abs(x.mstWeakK(m1)-0.85)<1e-6&&proc('zahra_p2'),x.mstWeakK(m1));

wear('meleni'); x.ssTriggerS(p,'kill',{m:m1});
ok('Meleni: Rising Swell gives 10% more damage after a kill',x.allyP(p,'might')>=0.1&&proc('meleni_p2'),x.allyP(p,'might'));

wear('hollis'); x.ssTriggerS(p,'hurt',{m:m1,v:50});
ok('Hollis: Lantern Leans In gives 2% regeneration a second when she is hurt',x.allyP(p,'regen')>=0.02&&proc('hollis_p2'),x.allyP(p,'regen'));

console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
