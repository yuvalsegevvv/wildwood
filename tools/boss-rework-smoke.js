// Headless test of the signature mechanics of the fifteen reworked bosses (Glass Guardian, Mountain Golem, Captain Dredge, Sand Wyrm, Rootwarden; Gloam Warden, Gryphon Queen, Akaoni, Kyuubi, Carapax; Ymrik, Vetrmaw, and the second moves of Dredge, Gryphon, Akaoni), straight from src/ (no build):
// each mechanic is driven by hand and its effect on the players or on the boss is checked (the mirror throws a blow back, the shell soaks and cracks, the chain pulls and is cut,
// the sand strikes whoever stands still, the seasons turn). boss-smoke.js checks that every move happens in a whole fight; this one checks what the moves DO.
// Usage: node tools/boss-rework-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['BOSSES','getH','BOSS_KITS','monK','golemCrackS','wyrmListenS','dredgeHookS','dredgeBilgeTickS','glassStanceS','glassPrismsS','glassSplitS','spawnAddsS','spawnMonS','wardenDarkS','wardenInBeamS','gryphStrafeS','gryphStragglerS','gryphCullS','foxBeamsS','oniBrandS','oniHopsS','oniToriiS','oniEmbersS','foxTrailS','foxBlinkS','tideMoltS','tideClampS','tideWaveS','rimeDecreeS','rimeLaneS','wyrmColdS','wyrmLungeS','gryphHuntS','gryphPreyS','oniTossS','dredgeSpotS','dredgeSpotTickS','S']);
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
const raw=(secs,mv)=>{ for(let i=0;i<secs*20;i++){ mv(i); W.tick(0.05); } };   // (like run, but the players' health is left alone, to read what they lost)

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
{ // ---- Gloam Warden: in the dark hour whoever is outside the beam and the lanterns burns; the beam also makes him weaker
  const B=boss('gloamwarden'), m=B.m, A=B.A, py=x.getH(A.x,A.z), put=engage(B,[6,0],[-14,0]); B.k.darkT=99; B.k.beamT=99; B.k.gloomT=99; B.k.wailT=99; B.k.slamT=99; B.stunT=0;
  const place=()=>{ W.setPos('a',[A.x+6,py,A.z,0,0,0]); W.setPos('b',[A.x-14,py,A.z+14,0,0,0]); };
  x.wardenDarkS(B,m,{x:A.x+6,z:A.z}); B.k.beamDir=0; B.k.dFlip=[]; const lamps=B.k.lamps.slice();   // (the beam is pointed at a and stands still)
  ok('warden: the dark hour sets two soul lanterns and the dark mode',B.mode===6&&lamps.length===2);
  for(const lm of lamps){ lm.x=A.x+40; lm.z=A.z+40; }   // (out of the way: only the beam shelters)
  const hb=pb().hp, ha=pa().hp; for(let i=0;i<40;i++){ place(); W.tick(0.05); } 
  ok('warden: outside the beam (and the lanterns) you burn far more than inside it',(hb-pb().hp)>0&&(hb-pb().hp)>(ha-pa().hp),'a lost '+(ha-pa().hp)+', b lost '+(hb-pb().hp));
  ok('warden: the beam itself is a cone that finds a and not b',x.wardenInBeamS(B,m,pa())&&!x.wardenInBeamS(B,m,pb()));
  const h0=m.hp; m.hp-=1000; x.BOSS_KITS.gloamwarden.hit(B,m,pa(),1000); ok('warden: a blow struck from inside the beam does 25% more',h0-m.hp>1200&&h0-m.hp<1300,'took '+(h0-m.hp));
  const h1=m.hp; m.hp-=1000; x.BOSS_KITS.gloamwarden.hit(B,m,pb(),1000); ok('warden: a blow from the dark does not',h1-m.hp===1000);
  B.k.dark=1.4; B.k.flash=false; run(null,0.1,place); ok('warden: 1.5 s before the end the beam flashes (a cone that does hurt)',B.tele.some(e=>e.kind==='rake'&&e.dmg>0));
  B.k.dark=0.1; run(null,0.4,place); ok('warden: the hour ends, the lanterns go and the mode clears',B.mode===0&&lamps.every(l=>l.remove||l.dead));
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Gryphon Queen: she culls the straggler, flies strafing runs along a line through them, and is spent if three passes hit nobody
  const B=boss('gryphon'), m=B.m, A=B.A, py=x.getH(A.x,A.z); engage(B,[4,0],[-9,3]); B.k.rakeT=99; B.k.swoopT=99; B.k.stormT=99; B.k.strafeT=99; B.stunT=0;
  ok('gryphon: the straggler is the one farthest from the others',x.gryphStragglerS([{x:0,z:0},{x:2,z:0},{x:30,z:0}]).x===30);
  B.tele=[]; x.gryphCullS(B,m,[{x:A.x,z:A.z},{x:A.x+3,z:A.z},{x:A.x+30,z:A.z}]); const cull=B.tele.find(e=>e.kind==='swoop');
  ok('gryphon: she circles the huddle (the middle of the two players close together)',!!cull&&Math.abs(cull.x-(A.x+1.5))<0.1);
  B.tele=[]; x.gryphCullS(B,m,[{x:A.x,z:A.z},{x:A.x+20,z:A.z}]); ok('gryphon: spread out, there is no huddle to circle',!B.tele.length);
  const hit=n=>{ x.gryphStrafeS(B,m); let lines=0; for(let i=0;i<n*20;i++){ if(i%38<2||i%38>=36){ W.setPos('a',[A.x+10,py,A.z,0,0,0]); W.setPos('b',[A.x-10,py,A.z,0,0,0]); } else { W.setPos('a',[A.x+10,py,A.z+12,0,0,0]); W.setPos('b',[A.x-10,py,A.z-12,0,0,0]); } tick(1); if(B.tele.some(e=>e.kind==='line')) lines++; } return lines; };
  const lines=hit(7.2); ok('gryphon: three passes warn with a line each, all dodged, and she lands spent',lines>0&&B.k.hits===0&&B.stunT>0&&B.mode===0,'hits '+B.k.hits+' stun '+B.stunT.toFixed(1));
  B.stunT=0; x.gryphStrafeS(B,m); for(let i=0;i<7.2*20;i++){ W.setPos('a',[A.x+10,py,A.z,0,0,0]); W.setPos('b',[A.x-10,py,A.z,0,0,0]); tick(1); }
  ok('gryphon: standing in the line gets you hit, and then she is not spent',B.k.hits>=1&&B.stunT<=0&&B.mode===0);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Akaoni: a stampede of hops leaves embers, he mends in his own fire, a dead imp leaves a pool
  const B=boss('oni'), m=B.m, put=engage(B,[8,0],[-8,3]); B.k.leapT=99; B.k.hopT=99; B.stunT=0;
  x.oniHopsS(B,m); const z0=B.zones.length; run(put,5,null); ok('oni: the hops land and leave ember pools',B.zones.filter(z=>z.kind==='ember').length>=2||B.zones.length>z0);
  B.tele=[]; B.q=[]; x.oniToriiS(B,m,pa()); const pillars=B.tele.filter(e=>e.kind==='line').length; B.q.forEach(e=>{ e.t=0; }); run(put,0.1,null);
  ok('oni: the torii has two pillars at once and the lintel 0.7 s later',pillars===2&&B.tele.filter(e=>e.kind==='line').length===3);
  B.zones=[]; B.q=[]; B.tele=[]; x.oniBrandS(B,m,[pa(),pb()]); B.q.forEach(e=>{ e.t=0; }); run(put,0.1,null);
  ok('oni: the branded leave a fire behind them as they run',B.zones.filter(z=>z.kind==='ember').length>=2,B.zones.length+' zones');
  B.zones=[]; B.mv=null; B.busy=0; m.hp=m.maxHp*0.5; B.zones.push({id:9999,kind:'ember',x:m.x,z:m.z,r:3,dur:30,a:0,b:0,t:0,tick:9}); const h0=m.hp; x.oniEmbersS(B,m,1); ok('oni: standing in an ember pool he mends',m.hp>h0);
  B.zones=[]; m.hp=m.maxHp*0.5; const h1=m.hp; x.oniEmbersS(B,m,1); ok('oni: out of the fire he does not',m.hp===h1);
  B.adds.push({dead:true,flared:false,x:m.x+20,z:m.z}); x.oniEmbersS(B,m,0.05); ok('oni: a dead imp leaves an ember pool where it fell',B.zones.some(z=>z.kind==='ember'&&z.x===m.x+20));
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Kyuubi: the fox trail lights up your last steps, a tail burns for every ninth of her health, she steps out of the nearest spirit
  const B=boss('kitsune'), m=B.m, A=B.A, py=x.getH(A.x,A.z), put=engage(B,[6,0],[-9,3]); B.k.volT=99; B.k.blinkT=99; B.k.beamT=99; B.k.trailT=99; B.stunT=0;
  run(null,3.6,i=>{ W.setPos('a',[A.x+6+(i%60)*0.4-12,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); });
  ok('kyuubi: her footsteps are followed (a trail per player)',(B.k.trail.get('a')||[]).length>=5);
  B.tele=[]; B.q=[]; B.busy=0; x.foxTrailS(B,m,pa()); B.q.forEach(e=>{ e.t=0; }); run(put,0.1,null);
  ok('kyuubi: the fox trail lights the circles of your path',B.q.length===0&&B.tele.filter(e=>e.kind==='slam').length>=4,B.tele.length+' teles');
  B.k.trail.set('a',Array.from({length:8},()=>[A.x+3,A.z])); B.tele=[]; B.q=[]; B.busy=0; x.foxTrailS(B,m,pa()); ok('kyuubi: standing still lights one circle, not eight',B.q.length===1,B.q.length+' circles');
  m.hp=m.maxHp*0.5; const n0=B.adds.length; run(put,0.2,null); ok('kyuubi: half her health gone: five tails left and a spirit has leapt out',B.aux===5&&B.adds.length>n0,'aux '+B.aux);
  const spN=B.adds.filter(a=>!a.dead&&!a.remove).length; B.tele=[]; x.foxBeamsS(B,m,pa()); ok('kyuubi: every living fox spirit echoes her beams with one of its own',B.tele.filter(e=>e.kind==='line').length===spN,spN+' spirits, '+B.tele.length+' teles');   // (her own three beams come later, on the queue)
  B.tele=[]; B.busy=0; x.foxBlinkS(B,m,[pa(),pb()]); ok('kyuubi: the blink comes with two illusions that fizzle out first',B.tele.filter(e=>e.kind==='slam'&&e.dmg===0&&e.dur<1).length===2&&B.tele.filter(e=>e.kind==='slam'&&e.dmg>0).length===1); B.q=[]; B.tele=[]; B.mode=0; m.immune=false;
  const sp=B.adds[B.adds.length-1]; sp.x=A.x+3; sp.z=A.z-3; B.k.blinkT=99; B.busy=0; x.foxBlinkS(B,m,[pa(),pb()]); ok('kyuubi: she steps out of the spirit nearest her prey, and it is spent',sp.remove===true);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Carapax: it molts at 75% (soft, 40% more damage), clamps a player until the claw is pried open
  const B=boss('tide'), m=B.m, put=engage(B,[4,0],[-9,3]); B.k.waveT=99; B.k.geyT=99; B.k.clampT=99; B.stunT=0; B.k.molts=0;
  m.hp=m.maxHp*0.7; run(put,0.2,null); ok('tide: below 75% it molts: the soft shell, and two hatchlings crawl out',B.k.molts===1&&B.k.soft>0&&B.mode===6&&B.adds.length>=2);
  const h0=m.hp; m.hp-=1000; x.BOSS_KITS.tide.hit(B,m,pa(),1000); ok('tide: a soft shell takes 40% more',h0-m.hp>1350&&h0-m.hp<1450,'took '+(h0-m.hp));
  B.walls=[]; B.adds=[]; x.tideWaveS(B,m); const w0=B.walls[0].speed; B.walls=[]; x.spawnAddsS(B,2); x.tideWaveS(B,m); ok('tide: living hatchlings call the tide (the wave runs faster)',B.walls[0].speed>w0+1.4,w0+' -> '+B.walls[0].speed);
  B.walls=[]; B.k.soft=0; B.mode=0; B.busy=0; B.mv=null; x.tideClampS(B,m,{p:pa(),inside:[pa(),pb()],dp:4}); ok('tide: it clamps a player in the claw',!!B.k.clamp&&B.tele.some(e=>e.kind==='prison'));
  x.BOSS_KITS.tide.hit(B,m,pb(),m.maxHp*x.monK(m,pb()).hp*0.05); ok('tide: enough blows pry the claw open and it reels',B.k.clamp===null&&B.stunT>0);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Ymrik: the decree (kneel: do not move; rise: do not stand still), the frost lane, the cold that spreads from a prison
  const B=boss('rime'), m=B.m, A=B.A, py=x.getH(A.x,A.z), put=engage(B,[6,0],[-9,3]); B.k.fallT=99; B.k.prisonT=99; B.k.decreeT=99; B.k.laneT=99; B.stunT=0;
  const walk=i=>{ W.setPos('a',[A.x+6+(i%40)*0.3,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); };
  x.rimeDecreeS(B,m,[pa(),pb()]); B.k.decree.kneel=true; B.k.decree.pos.set('a',[A.x+6,A.z]); B.k.decree.pos.set('b',[A.x-9,A.z+3]); let a0=pa().hp, b0=pb().hp;
  raw(2.6,walk); ok('rime: KNEEL: the hero who moved was struck, the one who knelt was not',(a0-pa().hp)>0&&(b0-pb().hp)<=0&&B.mode===0,'a '+(a0-pa().hp)+' b '+(b0-pb().hp));
  B.busy=0; x.rimeDecreeS(B,m,[pa(),pb()]); B.k.decree.kneel=false; a0=pa().hp; b0=pb().hp;
  raw(2.6,i=>{ W.setPos('a',[A.x+6+(i%60)*0.4,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); }); ok('rime: RISE: the hero who stood still was struck, the one who moved was not',(b0-pb().hp)>0&&(a0-pa().hp)<=0,'a '+(a0-pa().hp)+' b '+(b0-pb().hp));
  B.tele=[]; x.rimeLaneS(B,m); ok('rime: the frost lane is a row of seven icicles (one gap in eight)',B.tele.filter(e=>e.kind==='icefall').length===7);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Vetrmaw: the chill climbs away from the Warm Cores and drains beside one; at 100 you are frozen; it lunges at a core
  const B=boss('wyrm'), m=B.m, A=B.A, py=x.getH(A.x,A.z), put=engage(B,[4,0],[-9,3]); B.k.breathT=99; B.k.gustT=99; B.k.tailT=99; B.k.lungeT=99; B.stunT=0;
  const cores=B.adds.filter(a=>a.def.id==='warmcore'&&!a.dead&&!a.remove); ok('wyrm: two Warm Cores stand from the start',cores.length===2);
  B.k.cold=new Map(); const far=cores.map(c=>c).reduce((r,c)=>r,0); for(const c of cores){ c.x=A.x+40; c.z=A.z+40; }
  run(null,5,()=>{ W.setPos('a',[A.x+4,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); }); ok('wyrm: away from the cores the chill climbs (about 4% a second)',(B.k.cold.get('a')||0)>15&&B.aux>15,'a '+(B.k.cold.get('a')||0).toFixed(1));
  cores[0].x=A.x+4; cores[0].z=A.z; run(null,2,()=>{ W.setPos('a',[A.x+4,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); }); ok('wyrm: beside a core it drains',(B.k.cold.get('a')||0)<5);
  B.k.cold.set('b',99); const hb=pb().hp; raw(0.6,()=>{ W.setPos('a',[A.x+4,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); }); ok('wyrm: at 100 you are frozen (a bite of frost) and the chill starts again',hb-pb().hp>0&&(B.k.cold.get('b')||0)<10);
  B.busy=0; B.mv=null; m.hp=m.maxHp*0.5; const h0=m.hp; x.wyrmLungeS(B,m,{p:pa()}); run(null,2.2,()=>{ W.setPos('a',[A.x+30,py,A.z,0,0,0]); W.setPos('b',[A.x-9,py,A.z+3,0,0,0]); });
  ok('wyrm: it lunged at a core, smashed it and drank the warmth',cores[0].remove===true&&m.hp>h0);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ // ---- Gryphon: the hunt (prey named, others hit her harder), Akaoni's toss, Dredge's black spot
  const B=boss('gryphon'), m=B.m, put=engage(B,[4,0],[-9,3]); B.stunT=0; x.gryphHuntS(B,m,[pa(),pb()]); const prey=B.k.prey.id, other=prey==='a'?pb():pa(), preyP=prey==='a'?pa():pb();
  ok('gryphon: she hunts one hero',!!prey&&x.gryphPreyS(B,[pa(),pb()]).id===prey);
  const h0=m.hp; m.hp-=1000; x.BOSS_KITS.gryphon.hit(B,m,other,1000); ok('gryphon: a blow from anyone but the prey hits 25% harder',h0-m.hp>1200&&h0-m.hp<1300,'took '+(h0-m.hp));
  const h1=m.hp; m.hp-=1000; x.BOSS_KITS.gryphon.hit(B,m,preyP,1000); ok('gryphon: the prey does not',h1-m.hp===1000);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ const B=boss('oni'), m=B.m, A=B.A, put=engage(B,[5,0],[-9,3]); B.k.leapT=99; B.k.hopT=99; B.k.toriiT=99; B.k.tossT=99; B.stunT=0; B.tele=[]; B.q=[];
  x.oniTossS(B,m,pa()); ok('oni: he seizes the nearest hero (a ring holds them)',B.tele.some(e=>e.kind==='prison'));
  run(put,1.3,null); ok('oni: then hurls them, and a blast is waiting where they land',B.tele.some(e=>e.kind==='slam'&&e.dmg>0));
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
{ const B=boss('captain'), m=B.m, A=B.A, py=x.getH(A.x,A.z), put=engage(B,[12,0],[-12,3]); B.k.hookT=99; B.k.handT=99; B.k.volleyT=99; B.k.anchorT=99; B.k.spotT=99; B.stunT=0; B.k.bilge=0;
  x.dredgeSpotS(B,m,[pa(),pb()]); const first=B.k.spot.id;
  run(null,0.3,()=>{ W.setPos('a',[A.x+12,py,A.z,0,0,0]); W.setPos('b',[A.x+13.5,py,A.z,0,0,0]); }); ok('dredge: touch another hero and the black spot is theirs',B.k.spot&&B.k.spot.id!==first);
  const holder=B.k.spot.id, hp0=holder==='a'?pa().hp:pb().hp; B.k.spot.t=0.05; raw(0.3,()=>{ W.setPos('a',[A.x+12,py,A.z,0,0,0]); W.setPos('b',[A.x-12,py,A.z+3,0,0,0]); });
  ok('dredge: when the time is up it burns the holder',!B.k.spot&&(holder==='a'?pa().hp:pb().hp)<hp0);
  W.setPos('a',[0,5,0,0,0,0]); W.setPos('b',[2,5,0,0,0,0]); tick(3);
}
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
