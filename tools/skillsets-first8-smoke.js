// Headless test of the first eight skill sets (Tansy, Torgeir, Sazanka, Corvin, Sorrel, Ambrose, Dunstan, Marigold: src/shared/skillsets/<id>.js), the server straight from src/, no build.
// It checks the registry rules over the whole cast (one set for each land and tier, four and four, the elements, every piece deals damage) and then that each set's pieces do what its kit file says
// (docs/skillkits/kit-*.md; what the engine cannot do and how each piece stands in for it is in each set file's header). The power ladder is a separate tool: node tools/skillsets-ladder.js --check
// Usage: node tools/skillsets-first8-smoke.js
const fs=require('fs'), path=require('path'), {loadServer, SRC}=require('./load');
const evs=[], inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ if(pid==='a'&&m.t==='snap'&&m.ev) evs.push(...m.ev); }},
  ['MONS','S','SKILLS','PASSIVES','SS_SETS','SS_ORDER','SS_BAD','SS_PIECE_OF','SS_SOURCES','ssLint','ssEquipPieceP','ssGrantSetP','partyOf','allyP','ssTauntedBy','ssMarkN','ssMarkS','ssTriggerS','resolveFxS','damageMonsterS','killMonsterS','hurtP','ssCondP','ssWhen','AREAS','PROJS','rxVulnK','fxModK','recalcP','clsOfP','getH','VIL','ZTIER_MAX','ELEM_OPP','psP','abilityOf']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const IDS=['tansy','torgeir','sazanka','corvin','sorrel','ambrose','dunstan','marigold'], SET=id=>x.SS_SETS[id], PIECES=id=>[1,2,3].flatMap(n=>SET(id).pos[n].ids);

// ---- the cast as a whole ----
ok('all eight sets register: nothing left out, nothing linted (the first grinder is basic, four and four, no hybrid of soul opposites)',IDS.every(i=>SET(i))&&x.SS_BAD.length===0&&x.ssLint().length===0,JSON.stringify(x.SS_BAD)+JSON.stringify(x.ssLint()));
ok('every set has a symbol of its own (an emblem: shapes only, in a colour of its own), so its pieces are never the generic star',(()=>{ const g=IDS.map(i=>SET(i).emblem), ok1=g.every(e=>e&&/^(<(path|circle|ellipse|rect|line)( (d|cx|cy|r|rx|ry|x|y|x1|y1|x2|y2|width|height|fill|opacity|stroke-width|transform)="[^"<>&]*")*\/>)+$/.test(e.glyph)&&Number.isInteger(e.col)), glyphs=new Set(g.map(e=>e&&e.glyph)), cols=new Set(g.map(e=>e&&e.col)); return ok1&&glyphs.size===8&&cols.size===8; })());
ok('one set for each land and tier (the first four: tier 1 of the four lands; the second wave: tier 2 of them)',(()=>{ const seen=new Set(IDS.map(i=>SET(i).land+SET(i).tier)); return seen.size===8&&IDS.slice(0,4).every(i=>SET(i).tier===1)&&new Set(IDS.slice(0,4).map(i=>SET(i).land)).size===4&&IDS.slice(4).every(i=>SET(i).tier===2); })(),IDS.map(i=>SET(i).land+SET(i).tier).join(' '));
ok('the roles of THEMES.md: grind, tank, risk, debuff support, safe, healer, buff support, and a mixed safe + mild support',(()=>{ const r=i=>SET(i).role; return r('tansy').main==='grind'&&r('torgeir').main==='tank'&&r('sazanka').main==='risk'&&r('corvin').main==='support'&&r('corvin').focus==='debuff'&&r('sorrel').main==='safe'&&r('ambrose').main==='heal'&&r('dunstan').main==='support'&&r('dunstan').focus==='buff'&&r('marigold').main==='safe'&&r('marigold').also.role==='support'&&r('marigold').also.part==='mild'; })());
ok('four women and four men: Tansy, Sazanka, Sorrel, Marigold / Torgeir, Corvin, Ambrose, Dunstan; two and two among the first four',IDS.filter(i=>SET(i).char.sex==='female').join()==='tansy,sazanka,sorrel,marigold'&&IDS.filter(i=>SET(i).char.sex==='male').join()==='torgeir,corvin,ambrose,dunstan'&&IDS.slice(0,4).filter(i=>SET(i).char.sex==='female').length===2);
ok('the elements of ELEMENTS.md: none, earth, dark + air, light, air, water, fire, light',(()=>{ const e=i=>SET(i).el; return e('tansy')==='basic'&&e('torgeir')==='earth'&&e('sazanka').join()==='dark,air'&&e('corvin')==='light'&&e('sorrel')==='air'&&e('ambrose')==='water'&&e('dunstan')==='fire'&&e('marigold')==='light'; })());
ok('the first four use disjoint elements (none; earth; dark + air; light), so any two of them react when partied',(()=>{ const els=['tansy','torgeir','sazanka','corvin'].map(i=>[].concat(SET(i).el).filter(e=>e!=='basic')); const all=els.flat(); return new Set(all).size===all.length; })());
ok('only risk, safe and grind may be a hybrid; Sazanka\'s air is her first position, her dark the other two, and they are not soul opposites',(()=>{ const S=SET('sazanka'); return IDS.filter(i=>Array.isArray(SET(i).el)).join()==='sazanka'&&S.pos[1].el==='air'&&S.pos[2].el==='dark'&&S.pos[3].el==='dark'&&x.ELEM_OPP.dark!=='air'; })());
ok('Tansy is pure basic: every piece, passive and bonus element-less',PIECES('tansy').every(i=>x.SKILLS[i].el==='basic')&&[1,2,3].every(n=>x.PASSIVES[SET('tansy').pos[n].passive].el==='basic')&&[3,5].every(t=>SET('tansy').bonus[t].el==='basic'));
ok('each set names its outfit, and that outfit exists (game/outfits/<id>.js)',IDS.every(i=>SET(i).outfit===i&&fs.existsSync(path.join(SRC,'game','outfits',i+'.js'))));
ok('each set has a look (game/skillsets/look-<id>.js) and a palette of three colours',IDS.every(i=>fs.existsSync(path.join(SRC,'game','skillsets','look-'+i+'.js'))&&['main','accent','glow'].every(k=>Number.isInteger(SET(i).pal[k]))));
ok('every active deals damage, position 1 has three class versions, positions 2 and 3 are universal (Sorrel\'s burst is class-bound: it needs a weapon)',IDS.every(i=>PIECES(i).every(id=>x.SKILLS[id].mult>0))&&IDS.every(i=>SET(i).pos[1].ids.length===3&&SET(i).pos[2].bound==='any'&&(i==='sorrel'?SET(i).pos[3].bound==='class':SET(i).pos[3].bound==='any')));
ok('each set\'s piece levels are those of its land\'s sources and its dungeon theme exists',IDS.every(i=>{ const S=SET(i); return x.SS_SOURCES[S.land]&&S.pos[1].lv>=15&&S.pos[3].lv>=30; }));
ok('Tansy, the first grinder, is the easiest to get: friendlier odds on every position',IDS.slice(0,1).every(i=>[1,2,3].every(n=>SET(i).pos[n].from.chance>0.1&&SET(i).pos[n].from.pity>0))&&SET('tansy').pos[3].from.chance>SET('tansy').pos[1].from.chance);

// ---- the stage: a, b (a party) and c, three monsters pinned still ----
W.join('a',{name:'Tester',look:{cls:'mage'},save:{level:60}}); W.join('b',{name:'Other',look:{cls:'archer'},save:{level:60}}); W.join('c',{name:'Third',look:{cls:'mage'},save:{level:60}}); tick(3);
const p=W.players.get('a'), pb=W.players.get('b'), pc=W.players.get('c');
W.receive('a',{t:'party',a:'invite',name:'Other'}); tick(3); W.receive('b',{t:'party',a:'accept'}); tick(3);
const norm=x.MONS.filter(m=>!m.boss&&!m.inst&&m.def.id==='slime'), [m1,m2,m3]=norm, bossM=x.MONS.find(m=>m.boss);
const stand=(q,dx,dz)=>{ W.setPos(q.id,[p.x+dx,x.getH(p.x+dx,p.z+dz),p.z+dz,0,0,0]); q.dead=false; q.hp=q.maxHp; q.ally=null; q.shield=null; };
const put=(m,dx,dz,face)=>{ m.dead=false; m.remove=false; m.hp=m.maxHp=1e9; m.mk=null; m.st=null; m.aura=null; m.rxIcd=null; m.inst=0; m.immune=false; m.burnT=m.slowT=0; m.stunT=1e9; m.taunt=null; m.aggro=false; m.x=p.x+dx; m.z=p.z+dz; m.face=face===undefined?Math.PI:face; return m; };
W.setPos('a',[x.VIL.x,x.getH(x.VIL.x,x.VIL.z),x.VIL.z,0,0,0]); p.dead=false; p.hp=p.maxHp; p.act=null; p.face=0; p.level=60;
const reset=()=>{ x.AREAS.length=0; x.PROJS.length=0; stand(p,0,0); p.ally=null; p.shield=null; stand(pb,3,0); stand(pc,0,40); for(const m of [m1,m2,m3]) put(m,0,-30); };
const still=fn=>{ const R=Math.random; Math.random=()=>0.5; try{ return fn(); } finally{ Math.random=R; } };
const lost=(m,fn)=>{ const h=m.hp; fn(); return h-m.hp; };
const cast=(id,tgt,o)=>{ const s=x.SKILLS[id]; x.resolveFxS(p,Object.assign({fx:s.fx,mult:s.mult,range:s.range,el:s.el,aim:[0,0,-1],sid:id},o||{}),tgt||null); };
ok('the stage: a and b are one party, c is not',x.partyOf(p)&&x.partyOf(p)===x.partyOf(pb)&&!x.partyOf(pc));

// wearing a set: nothing worn, then its three actives and the first n passives (n 3 = all six pieces: both bonuses)
const clear=()=>{ const K=p.gear.skills; for(const c of ['warrior','archer','mage']) K.eq[c]={basic:null,skill:null,burst:null}; K.pass=K.pass.map(()=>null); p.ssIcd={}; p.killTs=[]; p.cd={basic:0,skill:0,burst:0}; p.ally=null; p.shield=null; x.recalcP(p); };
const wear=(id,n)=>{ clear(); x.ssGrantSetP(p,id); const S=SET(id); for(const pos of [1,2,3]){ const P=S.pos[pos], sid=P.bound==='any'?P.ids[0]:P.ids.find(i=>x.SKILLS[i].cls===x.clsOfP(p)); x.ssEquipPieceP(p,x.SKILLS[sid]); } const pass=[1,2,3].map(k=>S.pos[k].passive); p.gear.skills.pass=pass.map((pid,k)=>k<n?pid:null); x.recalcP(p); };
const hpOf=q=>q.hp/q.maxHp, pct=v=>Math.round(v*1000)/10;

// ---- Tansy ----
clear(); reset(); put(m1,0,-2); put(m2,0,-6.5); put(m3,0,3);
{ const a=lost(m1,()=>still(()=>cast('tansy_1_warrior',m1))), behind=lost(m3,()=>still(()=>cast('tansy_1_warrior',m1)));
  ok('Tansy: Windrow Sweep (warrior) is a wide light arc: it hits what is in front, a monster beside it too, but not one behind her',a>0&&behind===0,a+' / '+behind); }
reset(); put(m1,4,-5); put(m2,-5,-3); put(m3,0,-9);
ok('Tansy: Gather In is a field wider than a camp\'s gap that PULLS (negative knockback) and nicks everything in it',(()=>{ const z=x.SKILLS.tansy_2_any.fx.zone; return z.kb<0&&z.r>9&&x.SKILLS.tansy_2_any.range>=16; })());
{ const h=[m1,m2,m3].map(m=>m.hp); cast('tansy_2_any',m3); tick(45); ok('...and every monster in the field was hurt',[m1,m2,m3].every((m,i)=>m.hp<h[i]),[m1,m2,m3].map((m,i)=>Math.round(h[i]-m.hp)).join(',')); }
reset(); put(m1,0,-9.5); put(m2,0,-12.5);
{ const a=lost(m1,()=>still(()=>cast('tansy_3_any',null))), b=lost(m2,()=>still(()=>cast('tansy_3_any',null)));
  ok('Tansy: Bumper Crop is the widest ring (11 m): it hits a monster 9.5 m away and not one 12.5 m away',x.SKILLS.tansy_3_any.fx.ring.r===11&&a>0&&b===0,a+' / '+b); }
wear('tansy',3); reset(); put(m1,0,-2); put(m2,3,-3); put(m3,-3,-4);
ok('Tansy: Wide Berth makes every ring, cone and field 25% wider (the area stat) and costs 25% damage against bosses only',near(x.psP(p,'area'),0.25)&&near(x.ssCondP(p,'dmg',bossM),-0.25)&&x.ssCondP(p,'dmg',m1)===0,x.psP(p,'area')+' '+x.ssCondP(p,'dmg',bossM));
{ evs.length=0; cast('tansy_2_any',m1); tick(3); const ar=evs.find(e=>e[0]==='area'&&e[10]==='tansy_2_any'); ok('...the field of Gather In is 9.5 m x 1.25 across (the area event says so)',ar&&near(ar[5],11.875,0.01),ar&&ar[5]); x.AREAS.length=0; }
{ p.hp=p.maxHp*0.5; x.ssTriggerS(p,'kill',{m:m1}); const crowd=hpOf(p); put(m2,0,-30); put(m3,0,-31); p.ssIcd={}; p.hp=p.maxHp*0.5; x.ssTriggerS(p,'kill',{m:m1}); const alone=hpOf(p);
  ok('Tansy: Steady Hands heals a kill in a crowd (three enemies within 8 m: +2%) and not a kill with nothing near',near(crowd,0.52,0.002)&&near(alone,0.5,0.002),pct(crowd)+' / '+pct(alone)); }
{ put(m1,0,-2); put(m2,3,-3); put(m3,-3,-4); p.ssIcd={}; p.killTs=[]; p.cd={basic:0,skill:10,burst:10}; for(let i=0;i<4;i++) x.ssTriggerS(p,'kill',{m:m1}); tick(3);
  ok('Tansy: a kill takes 1 s off every cooldown (Windrow), and four kills within 2 s take 4 s more off Gather In (Second Basket); the client is told (cdr)',near(p.cd.skill,5,0.2)&&near(p.cd.burst,9,0.2)&&evs.some(e=>e[0]==='cdr'&&e[1]==='a'&&e[2]==='skill'),p.cd.skill.toFixed(1)+' / '+p.cd.burst.toFixed(1)); }
{ p.hp=p.maxHp; reset(); put(m1,0,-2); put(m2,3,-3); put(m3,-3,-4); x.AREAS.length=0; clear(); }

// ---- Torgeir ----
reset(); put(m1,0,-2.5); put(m2,0,-6); pb.dead=false; m1.aggro=true; m1.tgt='b';
still(()=>cast('torgeir_1_warrior',m1));
ok('Torgeir: Anchor Strike taunts what it hits (the monster in the cone comes for him, not for the party member it was on; one outside the cone does not) and leaves a Fixation',x.ssTauntedBy(m1)===p&&!x.ssTauntedBy(m2)&&x.ssMarkN(p,m1,'fixation')===1,String(x.ssMarkN(p,m1,'fixation')));
reset(); put(m1,0,-9); put(m2,2,-9); put(m3,0,-25);
{ cast('torgeir_1_archer',m1); tick(30); ok('Torgeir: Pinning Shot taunts what the arrow hits, from range (20 m): the target comes for him, the monster beside it does not',x.ssTauntedBy(m1)===p&&!x.ssTauntedBy(m2)&&x.ssMarkN(p,m1,'fixation')===1); x.PROJS.length=0; }
reset(); put(m1,0,-3); put(m2,0,-10); still(()=>cast('torgeir_2_any',null));
ok('Torgeir: Brace gives him and his party member 20% less damage taken, a shield of 8% of health + 3% for each Fixation near him (the ring leaves one: 11%), and a wide taunt (12 m)',near(x.allyP(p,'guard'),0.2)&&near(x.allyP(pb,'guard'),0.2)&&x.allyP(pc,'guard')===0&&near(p.shield&&p.shield.v,p.maxHp*0.11,1)&&near(pb.shield&&pb.shield.v,pb.maxHp*0.11,1)&&x.ssTauntedBy(m1)===p&&x.ssTauntedBy(m2)===p,pct(p.shield&&p.shield.v/p.maxHp));
reset(); put(m1,0,-3); put(m2,0,-5);
{ x.ssMarkS(p,m1,{id:'fixation',n:3,dur:12,max:5}); x.ssMarkS(p,m2,{id:'fixation',n:5,dur:12,max:5});
  const h=m1.hp+m2.hp; still(()=>cast('torgeir_3_any',null)); const ring=h-(m1.hp+m2.hp);
  const m3p=put(m3,0,-3); m3p.mk=null; const r0=lost(m3p,()=>still(()=>cast('torgeir_3_any',null)));
  ok('Torgeir: Hold the Line shields the party for 14% + 3% a Fixation (counted up to 5: 29%), guards 30%, taunts for 6 s, and THEN spends every Fixation for extra damage',x.ssMarkN(p,m1,'fixation')===0&&x.ssMarkN(p,m2,'fixation')===0&&ring>r0*2.2&&near(x.allyP(pb,'guard'),0.3)&&near(pb.shield.v,pb.maxHp*0.29,1)&&x.ssTauntedBy(m1)===p,Math.round(ring)+' vs '+Math.round(r0)+', shield '+pct(pb.shield.v/pb.maxHp)); }
wear('torgeir',3); reset(); put(m1,0,-3);
ok('Torgeir: Thick Hide gives 10% less damage taken only while he holds an enemy (one he taunted)',x.ssCondP(p,'red',m1)===0&&(m1.taunt={by:p.id,until:x.S.t+5},near(x.ssCondP(p,'red',m1),0.10)),String(x.ssCondP(p,'red',m1)));
{ reset(); put(m1,0,-2.5); p.shield=null; p.ssIcd={}; still(()=>cast('torgeir_1_warrior',m1)); ok('Torgeir: First Contact: the first taunt of a fight raises a shield of 10% of his health',near(p.shield&&p.shield.v,p.maxHp*0.10,1),pct(p.shield&&p.shield.v/p.maxHp)); }
{ reset(); put(m1,0,-3); p.ssIcd={}; p.shield={v:100,v0:100,until:x.S.t+8}; const h=m1.hp; x.hurtP(p,300,m1);
  ok('Torgeir: Shattering Return: when a shield of his breaks the earth answers (a ring round him hits the monster beside him)',m1.hp<h&&!p.dead,Math.round(h-m1.hp)); }
clear();

// ---- Sazanka ----
reset();
{ const front=lost(m1,()=>{ put(m1,0,-2.2,Math.PI); still(()=>cast('sazanka_1_warrior',m1)); }), back=lost(m2,()=>{ put(m2,0,-2.2,0); still(()=>cast('sazanka_1_warrior',m2)); });
  ok('Sazanka: Pinprick hits much harder from behind the monster (its back to her) than from the front',back>front*1.4&&back<front*1.7,Math.round(back)+' vs '+Math.round(front)); }
reset(); put(m1,0,-2.2,Math.PI); for(let i=0;i<6;i++) still(()=>cast('sazanka_1_warrior',m1));
{ const frontBarbs=x.ssMarkN(p,m1,'barb'); put(m1,0,-2.2,0); for(let i=0;i<8;i++) still(()=>cast('sazanka_1_warrior',m1));
  ok('Sazanka: a jab from the front leaves no Barb, a jab from behind does, up to five',frontBarbs===0&&x.ssMarkN(p,m1,'barb')===5,frontBarbs+' / '+x.ssMarkN(p,m1,'barb')); }
{ const heavy=lost(m1,()=>still(()=>cast('sazanka_3_any',m1))); put(m2,0,-2.2,0); const none=lost(m2,()=>still(()=>cast('sazanka_3_any',m2)));
  ok('Sazanka: Dusk Flurry pops every Barb for heavy damage (and they are gone), more than the same skill with none',x.ssMarkN(p,m1,'barb')===0&&heavy>none*1.25,Math.round(heavy)+' vs '+Math.round(none)); }
reset(); put(m1,0,-8,Math.PI);
{ const z0=p.z; cast('sazanka_2_any',m1); ok('Sazanka: Slip Behind dashes PAST its target: she lands on the far side, close to it, and it carries a Barb',p.z<m1.z&&Math.hypot(p.x-m1.x,p.z-m1.z)<3&&Math.hypot(p.z-z0,0)>8&&x.ssMarkN(p,m1,'barb')===1,'z '+p.z.toFixed(1)+' vs '+m1.z.toFixed(1)); stand(p,0,0); }
wear('sazanka',3); reset(); put(m1,0,-2.2,0);
ok('Sazanka: Light Feet: +10% damage for 2 s after she moved, none standing still',(p.lastMove=x.S.t,near(x.ssCondP(p,'dmg',m1),0.10))&&(p.lastMove=-99,x.ssCondP(p,'dmg',m1)===0));
ok('Sazanka: Brittle Edge is +30% critical damage (a stat of its own), Quick Study +12% critical chance against a target carrying Barbs only',near(x.psP(p,'critdmg'),0.30)&&x.ssCondP(p,'crit',m1)===0&&(x.ssMarkS(p,m1,{id:'barb',n:1,dur:10,max:5}),near(x.ssCondP(p,'crit',m1),0.12)));
{ reset(); p.ssIcd={}; put(m1,0,-2.2,Math.PI); still(()=>x.damageMonsterS(m1,1,p,p.x,p.z,0,'basic')); const frontB=x.ssMarkN(p,m1,'barb'); p.ssIcd={}; put(m1,0,-2.2,0); still(()=>x.damageMonsterS(m1,1,p,p.x,p.z,0,'basic')); tick(1);
  ok('Sazanka: First Cut: a hit from behind (every 2 s) adds a Barb and cuts again; a hit from the front does not',frontB===0&&x.ssMarkN(p,m1,'barb')===1,frontB+' / '+x.ssMarkN(p,m1,'barb')); }
{ p.ssIcd={}; p.cd={basic:0,skill:0,burst:10}; x.ssTriggerS(p,'kill',{m:m1}); const a=p.cd.burst; p.ssIcd={}; x.ssTriggerS(p,'crit',{m:m1}); const b=p.cd.burst;
  ok('Sazanka: Open Season: a kill takes 2.5 s off Dusk Flurry\'s cooldown, and so does a critical hit (one row, two triggers)',near(a,7.5,0.1)&&near(b,5,0.1),a+' / '+b); }
clear();

// ---- Corvin ----
reset(); put(m1,0,-2); put(m2,0,-9);
{ still(()=>cast('corvin_1_warrior',m1)); const v1=x.rxVulnK(m1); m1.st=null; still(()=>cast('corvin_1_warrior',m1)); const v2=x.rxVulnK(m1);
  ok('Corvin: Flash Lens exposes its target a little (5% more damage from everyone), 3% more for each Glare it already carries, and leaves a Glare',near(v1,0.05,0.001)&&near(v2,0.08,0.001)&&x.ssMarkN(p,m1,'glare')===2,v1+' / '+v2);
  still(()=>cast('corvin_3_any',null)); ok('Corvin: Noon exposes every enemy within 14 m for 22% + 2% a Glare (the cap is 30%): 26% on the one with two Glares, 22% on the other',near(x.rxVulnK(m1),0.26,0.001)&&near(x.rxVulnK(m2),0.22,0.001)&&x.rxVulnK(m1)<=0.30);
  put(m3,0,-20); ok('...and not one outside the ring',x.rxVulnK(m3)===0);
  m1.st=null; const plain=lost(m1,()=>still(()=>x.damageMonsterS(m1,1,pb,pb.x,pb.z,0,'basic')));
  m1.st={vuln:{v:0.25,until:x.S.t+5,by:p.id}}; const withV=lost(m1,()=>still(()=>x.damageMonsterS(m1,1,pb,pb.x,pb.z,0,'basic')));
  ok('...and it is everyone\'s gain: the party member\'s hit does 25% more on an exposed monster',near(withV/plain,1.25,0.02),(withV/plain).toFixed(3)); }
reset(); put(m1,0,-9);
{ cast('corvin_2_any',m1); tick(35); ok('Corvin: Open the Shutter exposes its area (12%, +3% a Glare: three ticks, 18%) and puts a Glare on each monster in it (up to 3)',near(x.rxVulnK(m1),0.18,0.001)&&x.ssMarkN(p,m1,'glare')===3,x.rxVulnK(m1)+' / '+x.ssMarkN(p,m1,'glare')); x.AREAS.length=0; }
wear('corvin',1); reset(); put(m1,0,-2);
{ still(()=>cast('corvin_1_warrior',m1)); const left=m1.st.vuln.until-x.S.t; ok('Corvin: Long Wick makes his debuffs last 60% longer (a 3 s exposure lasts 4.8 s)',near(left,4.8,0.1),left.toFixed(2)); }
wear('corvin',3); reset(); put(m1,0,-2); put(m2,0,-9.5); put(m3,0,-25);
{ x.ssMarkS(p,m1,{id:'x',n:1,dur:1,max:1}); m1.st={vuln:{v:0.1,until:x.S.t+5,by:p.id}};
  ok('Corvin: Second Look: reactions on a target he exposed are 30% stronger (a plain target: no bonus)',near(x.ssCondP(p,'rxk',m1),0.30)&&x.ssCondP(p,'rxk',m3)===0);
  m2.st=null; p.ssIcd={}; x.killMonsterS(m1,p);   // the exposed one dies where it stands (2 m from her; m2 is 7.5 m from it, 9.5 m from her)
  ok('Corvin: Afterglow: when a target he exposed dies, everything within 6 m of WHERE IT FELL is exposed (15%): a monster 7.5 m from him but 7.5 m from the body, yes; one far away, no',x.rxVulnK(m2)===0||near(x.rxVulnK(m2),0.15,0.001),'m2 '+x.rxVulnK(m2)); }
clear();

// ---- Sorrel ----
reset(); put(m1,0,-6); put(m2,0,-26);
{ const f=x.SKILLS.sorrel_1_archer.fx, near6=x.fxModK(f,p,m1), far26=x.fxModK(f,p,m2);
  ok('Sorrel: Clean Line lands harder the farther the target: x1 up close, about x1.5 at 26 m (capped at x1.6)',near(near6,1.04,0.05)&&far26>1.4&&far26<=1.6001,near6.toFixed(2)+' / '+far26.toFixed(2));
  const g=x.SKILLS.sorrel_3_archer.fx; ok('Sorrel: Long Gale grows to x2.4 with distance, spends Sight, and is a long cast (1.3 s) in all three class versions',near(x.fxModK(g,p,m2),1+1.4*(26-5)/35,0.02)&&['archer','warrior','mage'].every(c=>x.SKILLS['sorrel_3_'+c].act[1]===1.3&&x.SKILLS['sorrel_3_'+c].fx.pop.id==='sight')); }
reset(); put(m1,0,-8); put(m2,3,-8); put(m3,0,-30);
{ cast('sorrel_2_any',m1); tick(30); ok('Sorrel: Mark the Gap puts Sight on its target and its air spreads to the monsters within 6 m (not one 30 m away)',x.ssMarkN(p,m1,'sight')===1&&m2.aura&&m2.aura.el==='air'&&!m3.aura,String(m2.aura&&m2.aura.el)); x.PROJS.length=0; }
reset(); put(m1,0,-8);
{ x.ssMarkS(p,m1,{id:'sight',n:3,dur:12,max:3}); const spent=lost(m1,()=>still(()=>x.resolveFxS(p,{fx:x.SKILLS.sorrel_3_archer.fx,mult:x.SKILLS.sorrel_3_archer.mult,range:45,el:'air',aim:[0,0,-1],sid:'sorrel_3_archer'},m1)));
  ok('Sorrel: casting Long Gale pops the Sight at once (the marks are gone, the pop hit the target before the arrow)',x.ssMarkN(p,m1,'sight')===0&&spent>0,String(Math.round(spent))); x.PROJS.length=0; }
wear('sorrel',3); reset(); put(m1,0,-20); put(m2,0,-5); put(m3,0,-30); m3.hp=m3.maxHp*0.5;
ok('Sorrel: Far Sight: +10% damage on a target 14 m or more away; Dead Zone: -20% on one within 6 m (and +12% on all); Cold Eye: +10% crit on a target at full health, none on a hurt one',near(x.ssCondP(p,'dmg',m1),0.10)&&near(x.ssCondP(p,'dmg',m2),-0.20)&&near(x.ssCondP(p,'crit',m1),0.10)&&x.ssCondP(p,'crit',m3)===0,[x.ssCondP(p,'dmg',m1),x.ssCondP(p,'dmg',m2),x.ssCondP(p,'crit',m1),x.ssCondP(p,'crit',m3)].join(' '));
clear();

// ---- Ambrose ----
reset(); put(m1,0,-2); pb.hp=pb.maxHp*0.3; p.hp=p.maxHp*0.5;
{ still(()=>cast('ambrose_1_warrior',m1)); ok('Ambrose: Reed Lash mends the ONE with the least health (the party member at 30%: +2.5%), not the others; leaves a Ripple',near(hpOf(pb),0.325,0.002)&&near(hpOf(p),0.5,0.002)&&pc.hp===pc.maxHp&&x.ssMarkN(p,m1,'ripple')===1,pct(hpOf(pb))+' / '+pct(hpOf(p))); }
wear('ambrose',1); reset(); put(m1,0,-2); pb.hp=pb.maxHp*0.3;
{ still(()=>cast('ambrose_1_warrior',m1)); ok('Ambrose: Steady Current makes his heals 25% stronger (2.5% becomes 3.1%)',near(hpOf(pb),0.3313,0.002),pct(hpOf(pb))); }
wear('ambrose',2); reset(); p.hp=p.maxHp*0.5; p.lastHit=x.S.t+60; tick(20);   // (lastHit in the future: no natural out-of-combat regen of 8% a second)
ok('Ambrose: Marsh Calm: he always regenerates (0.8% of his health a second): a second of standing still, 0.8% back',near(hpOf(p),0.508,0.003)&&near(x.psP(p,'regen'),0.008),pct(hpOf(p)));
wear('ambrose',3); reset(); put(m1,0,-2); pb.hp=pb.maxHp*0.99; pb.shield=null;
{ still(()=>cast('ambrose_1_warrior',m1)); ok('Ambrose: Overflow (3 pieces): healing that would overheal turns into a shield on the one healed: 60% of the surplus (2.5% healed x1.25 by Steady Current = 3.1%, 1% fits, 2.1% over, 60% of it: 1.3%)',near(hpOf(pb),1,0.001)&&pb.shield&&near(pb.shield.v,pb.maxHp*0.0128,pb.maxHp*0.003),pb.shield&&pct(pb.shield.v/pb.maxHp)); }
{ reset(); p.hp=p.maxHp*0.9; pb.hp=pb.maxHp*0.4; pb.shield=null; p.ssIcd={}; x.ssTriggerS(p,'revive',{q:pb});
  ok('Ambrose: Lifeline (5 pieces): bringing a downed party member back heals him 25% and shields and guards the one who stood up (25% of health, 20% less damage, 8 s)',near(hpOf(p),1,0.001)&&pb.shield&&near(pb.shield.v,pb.maxHp*0.25,2)&&near(x.allyP(pb,'guard'),0.2)); }
{ reset(); p.hp=p.maxHp*0.2; p.ssIcd={}; x.ssTriggerS(p,'low',{m:m1,v:1}); ok('...and so does dropping below 35% health yourself',hpOf(p)>=0.44&&p.shield&&p.shield.v>0); }
reset(); put(m1,0,-3); put(m2,2,-5); pb.hp=pb.maxHp*0.2; p.hp=p.maxHp*0.2; clear(); put(m1,0,-3);
{ x.ssMarkS(p,m1,{id:'ripple',n:4,dur:12,max:5}); const h0=p.hp; still(()=>cast('ambrose_2_any',null)); ok('Ambrose: Ebb and Flow returns every Ripple within 10 m (gone), heals the party for 10% of maximum health, a share of the damage mends him, and shields them',x.ssMarkN(p,m1,'ripple')===0&&p.hp-h0>p.maxHp*0.1&&near(hpOf(pb),0.3,0.01)&&pb.shield&&pb.shield.v>0); }
reset(); pb.hp=pb.maxHp*0.2; p.hp=p.maxHp*0.2; put(m1,0,-3);
{ still(()=>cast('ambrose_3_any',null)); ok('Ambrose: High Water heals the party for 30% (a capped heal), gives 3% regeneration for 8 s and a 15% shield, and the wave slows what is near',near(hpOf(pb),0.5,0.01)&&near(x.allyP(pb,'regen'),0.03)&&near(pb.shield.v,pb.maxHp*0.15,1)&&m1.slowT>0&&x.allyP(pc,'regen')===0); }
ok('...and no heal of his is above the cap of half the maximum health a cast',IDS.every(i=>PIECES(i).every(id=>{ const f=x.SKILLS[id].fx; return !f.heal||f.heal.v<=0.5; })));

// ---- Dunstan ----
clear(); reset(); put(m1,0,-2);
{ still(()=>cast('dunstan_1_warrior',m1)); ok('Dunstan: Rallying Strike quickens him and the party member (10% shorter cooldowns for 3 s), not the third player; leaves a Fervor',near(x.allyP(p,'haste'),0.1)&&near(x.allyP(pb,'haste'),0.1)&&x.allyP(pc,'haste')===0&&x.ssMarkN(p,m1,'fervor')===1); }
reset(); put(m1,0,-3); x.ssMarkS(p,m1,{id:'fervor',n:5,dur:12,max:5});
{ still(()=>cast('dunstan_2_any',null)); ok('Dunstan: Cry of Valor gives the party 10% more damage for 10 s, 2% more for each Fervor near him (five: 20%), and then spends the Fervor for damage',near(x.allyP(pb,'might'),0.20)&&x.ssMarkN(p,m1,'fervor')===0,String(x.allyP(pb,'might')));
  put(m2,0,-3); m2.st=null; const base=lost(m2,()=>still(()=>x.damageMonsterS(m2,1,pb,pb.x,pb.z,0,'basic'))); pb.ally=null; put(m2,0,-3); const plain=lost(m2,()=>still(()=>x.damageMonsterS(m2,1,pb,pb.x,pb.z,0,'basic')));
  ok('...(the party member\'s hit is 20% heavier under the buff)',near(base/plain,1.20,0.03),(base/plain).toFixed(3)); }
reset(); put(m1,0,-3); evs.length=0;
{ still(()=>cast('dunstan_3_any',null)); tick(25); ok('Dunstan: Banner Down plants a banner: a party member standing in it gets crit, critical damage and regeneration, someone outside it nothing, and the flame burns what is in it',near(x.allyP(pb,'crit'),0.2)&&near(x.allyP(pb,'critdmg'),0.4)&&near(x.allyP(pb,'regen'),0.02)&&x.allyP(pc,'crit')===0&&m1.hp<m1.maxHp,x.allyP(pb,'crit')+' '+x.allyP(pb,'critdmg')+' '+x.allyP(pb,'regen')); }
wear('dunstan',1); reset(); put(m1,0,-3);
{ still(()=>cast('dunstan_2_any',null)); const left=pb.ally.might.until-x.S.t; ok('Dunstan: Loud Voice makes the buffs he gives last 40% longer (10 s becomes 14 s)',near(left,14,0.2),left.toFixed(2)); }
wear('dunstan',3); reset(); put(m1,0,-3);
{ still(()=>cast('dunstan_2_any',null)); ok('Dunstan: Rousing (3 pieces): the buffs he gives are 20% stronger (10% -> 12%, still under the cap)',near(x.allyP(pb,'might'),0.12,0.002),String(x.allyP(pb,'might'))); }
clear();

// ---- Marigold ----
reset(); put(m1,0,-3);
{ still(()=>cast('marigold_1_warrior',m1)); ok('Marigold: Ribbon Flourish is a ranged wave of light that leaves Applause and a trickle of regeneration over the party',x.ssMarkN(p,m1,'applause')===1&&near(x.allyP(pb,'regen'),0.005)&&x.allyP(pc,'regen')===0); }
reset(); put(m1,0,-3); evs.length=0;
{ cast('marigold_2_any',null); tick(8);
  ok('Marigold: Center Stage buffs the party member standing in the stage (12% more damage, regeneration), not the one outside it',near(x.allyP(pb,'might'),0.12)&&near(x.allyP(pb,'regen'),0.015)&&x.allyP(pc,'might')===0);
  W.setPos('a',[p.x+10,x.getH(p.x+10,p.z),p.z,0,0,0]); tick(25); const area=evs.filter(e=>e[0]==='area'&&e[10]==='marigold_2_any').length;
  ok('...and the stage follows her: an area event is sent for it (with the piece named), and she carries it with her',area===1&&evs.some(e=>e[0]==='area'&&e[9]&2),'follow flag '+(evs.find(e=>e[0]==='area')||[])[9]); stand(p,0,0); }
reset(); put(m1,0,-3); p.ally=null; x.ssMarkS(p,m1,{id:'applause',n:3,dur:12,max:5});
{ still(()=>cast('marigold_3_any',null)); const left=pb.ally.guard.until-x.S.t;
  ok('Marigold: Curtain Call gives the party 20% less damage taken and 20% shorter cooldowns, a second longer for each Applause (3: 11 s, and the Applause is spent), and hurts what is near',near(x.allyP(p,'guard'),0.2)&&near(x.allyP(pb,'haste'),0.2)&&near(left,11,0.2)&&x.ssMarkN(p,m1,'applause')===0&&m1.hp<m1.maxHp,left.toFixed(2)); }
wear('marigold',1); reset(); put(m1,0,-3);
{ still(()=>cast('marigold_1_warrior',m1)); const withAlly=x.allyP(pb,'regen'); stand(pb,30,0); pb.ally=null; still(()=>cast('marigold_1_warrior',m1)); const alone=x.allyP(pb,'regen');
  ok('Marigold: Crowd Pleaser: with an ally within 9 m the buffs she gives are 20% stronger (0.5% regeneration becomes 0.6%); with none near, not',near(withAlly,0.006,0.0002)&&alone===0,withAlly+' / '+alone); stand(pb,3,0); }
wear('marigold',2); reset(); put(m1,0,-3);
{ p.ssIcd={}; p.cd={basic:0,skill:10,burst:10}; x.ssTriggerS(p,'kill',{m:m1}); ok('Marigold: Encore: a kill takes 3 s off Center Stage\'s cooldown',near(p.cd.skill,7,0.1)&&near(p.cd.burst,10,0.1),p.cd.skill.toFixed(1)); }
{ const S=SET('marigold'); ok('Marigold: a mixed set of one element (light), never a hybrid, its mark is Applause',!Array.isArray(S.el)&&S.el==='light'&&S.kit.mark==='applause'&&PIECES('marigold').every(id=>x.SKILLS[id].el==='light')); }
clear();

// ---- events name their piece (the client dresses them in the outfit's look) ----
reset(); put(m1,0,-9); evs.length=0;
{ cast('sorrel_2_any',m1); cast('tansy_2_any',m1); cast('torgeir_2_any',null); tick(3);
  const proj=evs.find(e=>e[0]==='proj'), area=evs.find(e=>e[0]==='area'), ast=evs.find(e=>e[0]==='ast'&&e[e.length-1]==='torgeir_2_any'), fxa=evs.find(e=>e[0]==='fxa'&&e[2]==='shield');
  ok('a set piece\'s events name the piece they come from as their last argument: a projectile, a zone, a buff, a shield',proj&&proj[proj.length-1]==='sorrel_2_any'&&area&&area[area.length-1]==='tansy_2_any'&&ast&&ast[ast.length-1]==='torgeir_2_any'&&fxa&&fxa[3]==='torgeir_2_any',JSON.stringify([proj,area,ast,fxa]).slice(0,220)); }
reset(); put(m1,0,-9); evs.length=0;
{ const sp=x.SKILLS.spore; x.resolveFxS(p,{fx:sp.fx,mult:sp.mult,range:sp.range,el:sp.el,aim:[0,0,-1],sid:'spore'},m1); const sn=x.SKILLS.snare; x.resolveFxS(p,{fx:sn.fx,mult:sn.mult,range:sn.range,el:sn.el,aim:[0,0,-1],sid:'snare'},null); tick(3);
  const proj=evs.find(e=>e[0]==='proj'); ok('...and a boss skill\'s events carry nothing extra (no piece): its projectile event stays at ten fields, no shield or heal note',proj&&proj.length===10&&!evs.some(e=>e[0]==='fxa'),proj&&proj.length); }

// ---- version2 testing: every player may unlock a set without the server's dev switch (server/skillsets-free.js; remove this block with it) ----
{ const dev0=x.S.dev; x.S.dev=false; const owns=(q,id)=>q.gear.skills.owned.includes(id), all=id=>PIECES(id).concat(SET(id).pos[1].passive,SET(id).pos[2].passive,SET(id).pos[3].passive);
  W.receive('b',{t:'dev',cmd:'set',v:'tansy'}); tick(3);
  ok('free testing tools: with the dev switch off the old testing tool refuses (nothing given) ...',!owns(pb,'tansy_2_any'));
  W.receive('b',{t:'ft',cmd:'set',v:'tansy'}); tick(3);
  ok('... but ft/set gives any player the whole set (three actives of every class version, and the three passives) without it',all('tansy').every(i=>owns(pb,i))&&!owns(pc,'tansy_1_mage'));
  W.receive('b',{t:'ft',cmd:'try',v:'torgeir'}); tick(3);
  { const E=pb.gear.skills.eq, pass=pb.gear.skills.pass.slice(0,3);
    ok('ft/try gives the set AND puts it on: the three signature skills for each of the three classes and its three passives',all('torgeir').every(i=>owns(pb,i))&&['warrior','archer','mage'].every(c=>E[c].basic===SET('torgeir').pos[1].ids.find(i=>x.SKILLS[i].cls===c)&&E[c].skill==='torgeir_2_any'&&E[c].burst==='torgeir_3_any')&&[1,2,3].every(k=>pass[k-1]===SET('torgeir').pos[k].passive)&&pb.ss.n.torgeir===6,JSON.stringify(pass)+' '+JSON.stringify(pb.ss&&pb.ss.n)); }
  pc.level=12; x.recalcP(pc); W.receive('c',{t:'ft',cmd:'try',v:'corvin'}); tick(3);
  ok('...a hero too low for the pieces (level 12; Corvin\'s ask 29 to 32) owns the whole set but wears none of it, and nothing breaks',all('corvin').every(i=>owns(pc,i))&&pc.gear.skills.eq[x.clsOfP(pc)].skill!=='corvin_2_any'&&[1,2,3].every(k=>!pc.gear.skills.pass.includes(SET('corvin').pos[k].passive)),JSON.stringify(pc.gear.skills.pass.slice(0,3)));
  W.receive('c',{t:'ft',cmd:'lv',v:'corvin'}); tick(3);
  ok('...and the free tools never give a level (ft/lv is not a command: the level stays 12)',pc.level===12,String(pc.level));
  pc.level=32; x.recalcP(pc);
  W.receive('c',{t:'ft',cmd:'try',v:'corvin'}); tick(3);
  ok('...and at the level the pieces ask for (32), ft/try puts all of it on',pc.ss.n.corvin===6&&pc.gear.skills.eq[x.clsOfP(pc)].burst==='corvin_3_any',JSON.stringify(pc.ss&&pc.ss.n));
  pc.level=60; x.recalcP(pc);
  W.receive('c',{t:'ft',cmd:'all'}); W.receive('c',{t:'ft',cmd:'set',v:'no such set'}); W.receive('c',{t:'ft',cmd:'try',v:{a:1}}); W.receive('c',{t:'ft',cmd:'nonsense',v:'tansy'}); tick(3);
  ok('ft/all unlocks every set at once, and a wrong set id, an object or an unknown command change nothing and crash nothing',IDS.every(i=>all(i).every(q=>owns(pc,q)))&&x.SS_BAD.length===0);
  x.S.dev=dev0; }

console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
