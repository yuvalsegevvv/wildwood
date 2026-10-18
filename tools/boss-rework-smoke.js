// Headless test of the signature mechanics of the five reworked bosses (Glass Guardian, Mountain Golem, Captain Dredge, Sand Wyrm, Rootwarden), straight from src/ (no build):
// each mechanic is driven by hand and its effect on the players or on the boss is checked (the mirror throws a blow back, the shell soaks and cracks, the chain pulls and is cut,
// the sand strikes whoever stands still, the seasons turn). boss-smoke.js checks that every move happens in a whole fight; this one checks what the moves DO.
// Usage: node tools/boss-rework-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['BOSSES','getH','BOSS_KITS','monK','golemCrackS','wyrmListenS','dredgeHookS','dredgeBilgeTickS','glassStanceS','glassPrismsS','glassSplitS','spawnAddsS','spawnMonS','S']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const keep=()=>{ for(const p of W.players.values()){ p.maxHp=1e7; p.hp=1e7; p.dead=false; } };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); keep(); } };
W.join('a',{name:'Tanker',look:{cls:'warrior'},save:{level:30}}); W.join('b',{name:'Runner',look:{cls:'archer'},save:{level:30}});
W.receive('a',{t:'dev',cmd:'vale',v:2}); W.receive('a',{t:'dev',cmd:'north',v:2}); for(const id of ['a','b']) for(const g of ['river','neck','redgate']) W.receive(id,{t:'dev',cmd:'gate',v:g,n:1}); W.receive('b',{t:'dev',cmd:'vale',v:2}); W.receive('b',{t:'dev',cmd:'north',v:2}); tick(2);
const boss=k=>x.BOSSES.find(B=>B.bd.kit===k), pa=()=>W.players.get('a'), pb=()=>W.players.get('b');
// put the two players in a boss's arena at (dxa,dza) and (dxb,dzb) from its centre and let it notice them
function engage(B,a,b){ const A=B.A, py=x.getH(A.x,A.z); const put=()=>{ W.setPos('a',[A.x+a[0],py,A.z+a[1],0,0,0]); W.setPos('b',[A.x+b[0],py,A.z+b[1],0,0,0]); }; put(); tick(2); put(); return put; }
const run=(put,secs,mv)=>{ for(let i=0;i<secs*20;i++){ if(mv) mv(i); else put(); tick(1); } };
const hurt=p=>1e7-p.hp;

{ // ---- Glass Guardian: a blow in the mirror stance comes back; a burst raises the stance; an unstruck stance stuns it
  const B=boss('glass'), m=B.m, put=engage(B,[4,0],[-9,3]); B.k.stanceT=99; B.k.stanceCd=99;
  x.glassStanceS(B,m); const before=hurt(pa()); x.BOSS_KITS.glass.hit(B,m,pa(),500);
  ok('glass: a blow struck in the mirror stance is thrown back at the attacker',hurt(pa())>before&&B.mode===6&&B.k.refl===1);
  run(put,5,null); ok('glass: the stance ends (donut after a struck mirror) and the mode clears',B.k.stance===0&&B.mode===0);
  B.k.stanceCd=0; B.k.acc=0; x.BOSS_KITS.glass.hit(B,m,pa(),m.maxHp*x.monK(m,pa()).hp*0.1); run(put,2.5,null);
  ok('glass: a burst of damage (7% of its health) raises the mirror',B.k.stance>0||B.mode===6);
  run(put,6,null); B.stunT=0; B.k.stanceCd=0; x.glassStanceS(B,m); run(put,4.6,null);
  ok('glass: nobody struck it, so the glass clouds over and it is stunned',B.stunT>0);
  B.tele=[]; B.k.prisms=[]; x.glassPrismsS(B,m); ok('glass: two black mirrors rise as prisms',B.k.prisms.length===2&&B.adds.filter(q=>q.def===B.bd.totem).length===2);
  const pr=B.k.prisms[0], ang=Math.atan2(-(pr.x-m.x),-(pr.z-m.z)); B.tele=[]; x.glassSplitS(B,m,ang); B.q.forEach(e=>{ e.t=0; }); run(put,0.1,null);
  ok('glass: a line that passes a living prism splits into two more there',B.tele.filter(e=>e.kind==='line'&&Math.hypot(e.x-pr.x,e.z-pr.z)<0.5).length===2);
  pr.dead=true; B.tele=[]; B.q=[]; x.glassSplitS(B,m,ang); ok('glass: a broken prism splits nothing',!B.q.length);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Mountain Golem: the shell soaks a share of every blow, his own boulder cracks it, three cracks stun him and the shell grows back
  const B=boss('golem'), m=B.m, put=engage(B,[4,0],[-9,3]); run(put,0.2,null);
  const h0=m.hp; m.hp-=1000; x.BOSS_KITS.golem.hit(B,m,pa(),1000); const lost=h0-m.hp;
  ok('golem: the shell soaks 35% of a blow',lost>620&&lost<680,'took '+lost+' of 1000');
  B.k.shell=100; B.stunT=0; x.golemCrackS(B,m); x.golemCrackS(B,m); ok('golem: two cracks and no stun yet',B.stunT<=0&&B.k.shell<40);
  x.golemCrackS(B,m); ok('golem: the third crack stuns him and the shell grows back',B.stunT>0&&B.k.shell===100);
  B.stunT=3; const h1=m.hp; m.hp-=1000; x.BOSS_KITS.golem.hit(B,m,pa(),1000); ok('golem: a stunned golem has no shell',h1-m.hp===1000);
  B.stunT=0; B.k.shell=50; const nB=B.adds.length; x.spawnAddsS(B,1,m.x,m.z,0); const rub=B.adds[B.adds.length-1]; rub.x=m.x+1; rub.z=m.z; run(put,0.1,null);
  ok('golem: rubble that reaches him knits into the shell (+15%)',B.adds.length>nB&&(rub.remove||rub.dead)&&B.k.shell>=60,'shell '+B.k.shell);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Captain Dredge: the chain hauls its victim in, an ally within 3 m cuts it, uncut it ends in the anchor's slam; the crew bails the hold
  const B=boss('captain'), m=B.m, put=engage(B,[4,0],[-9,3]); B.k.hookT=99; B.k.handT=99; B.k.volleyT=99; B.k.anchorT=99; B.k.bilge=40;
  const farA=[12,0], farB=[-12,2]; run(put,0.2,null);
  B.k.chain={id:'a',t:0,pull:0}; const A=B.A, py=x.getH(A.x,A.z);
  const mv=()=>{ W.setPos('a',[A.x+farA[0],py,A.z+farA[1],0,0,0]); W.setPos('b',[A.x+farB[0],py,A.z+farB[1],0,0,0]); };
  run(null,7.4,mv); ok('dredge: with no ally near, the chain runs out and the anchor slams down',!B.k.chain&&B.k.cut===0);
  B.k.chain={id:'a',t:0,pull:0}; B.stunT=0;
  run(null,0.3,()=>{ W.setPos('a',[A.x+12,py,A.z,0,0,0]); W.setPos('b',[A.x+10,py,A.z+1,0,0,0]); });
  ok('dredge: a crewmate within 3 m cuts the chain and winds him',!B.k.chain&&B.k.cut===1&&B.stunT>0);
  B.k.bilge=60; const hand={dead:true,bailed:false}; B.adds.push(hand); x.dredgeBilgeTickS(B,m,0.05); ok('dredge: a crewman put down bails a fifth of the hold',hand.bailed&&B.k.bilge<45&&B.k.bilge>38,'bilge '+B.k.bilge.toFixed(1));
  B.adds.pop(); B.k.bilge=99.9; x.dredgeBilgeTickS(B,m,0.1); ok('dredge: at 100 the hold floods (a whirl) and the water starts again',B.k.floods===1&&B.k.bilge===0&&B.zones.some(z=>z.kind==='whirl'));
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Sand Wyrm: it strikes whoever stands still while it listens, and is stranded if everyone kept moving
  const B=boss('sandwyrm'), m=B.m, put=engage(B,[14,0],[-14,0]); B.k.listenT=99; B.k.slideT=99; B.k.sweepT=99; B.k.burrowT=99; B.k.wallT=99; B.k.stormT=99; B.stunT=0;
  const A=B.A, py=x.getH(A.x,A.z); x.wyrmListenS(B,m,{p:pa()});
  run(null,3,i=>{ W.setPos('a',[A.x+14,py,A.z,0,0,0]); W.setPos('b',[A.x-14+(i%40)*0.5,py,A.z,0,0,0]); });   // a stands still, b keeps moving
  ok('wyrm: the player who stood still was struck at',B.k.struck>=1&&B.tele.length+B.k.struck>0);
  run(null,5,i=>{ W.setPos('a',[A.x+14+(i%40)*0.5,py,A.z,0,0,0]); W.setPos('b',[A.x-14+(i%40)*0.5,py,A.z,0,0,0]); });
  B.k.stunT=0; B.stunT=0; B.k.listen=0; B.k.struck=0; B.mode=0; x.wyrmListenS(B,m,{p:pa()}); B.k.struck=0;
  run(null,7.3,i=>{ W.setPos('a',[A.x+10+(i%30)*0.6,py,A.z+3,0,0,0]); W.setPos('b',[A.x-10-(i%30)*0.6,py,A.z-3,0,0,0]); });
  ok('wyrm: everyone kept moving, so it lies stranded',B.stunT>0&&B.k.struck===0);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Rootwarden: the seasons turn in order and the winter bark heals a share of each blow
  const B=boss('roots'), m=B.m, put=engage(B,[4,0],[-9,3]); B.k.seasonT=0.1; run(put,0.5,null);
  ok('roots: the first turn is summer',B.k.season===1&&B.mode===7);
  B.k.seasonT=0.1; run(put,0.5,null); B.k.seasonT=0.1; run(put,0.5,null); ok('roots: then autumn, then winter',B.k.season===3&&B.mode===9);
  const h0=m.hp; m.hp-=1000; x.BOSS_KITS.roots.hit(B,m,pa(),1000); ok('roots: in winter a third of each blow is healed back',h0-m.hp>600&&h0-m.hp<720,'took '+(h0-m.hp));
  B.k.seasonT=0.1; run(put,2.6,null); ok('roots: and the year comes round to spring, with a heartwood bloom',B.k.season===0&&B.mode===6&&!!B.k.bloom);
  m.hp=m.maxHp*0.7; B.k.seasonT=0.1; run(put,2.5,null); B.k.sT=0; run(put,0.2,null);
  ok('roots: a bloom left standing when spring ends heals the Warden',!B.k.bloom&&m.hp>m.maxHp*0.7);
  B.k.season=3; B.k.seasonT=0.1; run(put,2.6,null); const bl=B.k.bloom; bl.dead=true; run(put,0.2,null); ok('roots: a bloom cut down stuns the Warden',B.stunT>0);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
