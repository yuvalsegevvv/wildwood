// Headless test of version 3's professions and cosmetics revamp, straight from src/: the Wayfarers' Grounds (18 nodes, taken per player, small rewards), the tools' capped stat bonus,
// the three new potions (regen, scholar, fortune), making auras and capes at a lodge, the server's cleaning of a look, and the cape / aura on the character model.
// Usage: node tools/revamp-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['NODES','HOME_YARD','HOME_RESPAWN','NODE_KINDS','RES','ITEM','POTS','POT_KINDS','S','VIL','getH','toolBonusOf','toolBonusStat','TOOL_BONUS_CAP','cosCost','cosCleanLook','sanitizeCos','COS_AURAS','COS_CAPES','cosDef','potBuffP','rewardKill','expToNext']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const evs={a:[],b:[]}; const grab=()=>{ for(const id of ['a','b']){ for(const m of (inbox[id]||[])) if(m.t==='snap'&&m.ev) evs[id].push(...m.ev); inbox[id]=[]; } };
W.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:25}}); W.join('b',{name:'Bo',look:{cls:'warrior'},save:{level:25}}); tick(1);
const pa=W.players.get('a'), pb=W.players.get('b');
const at=(id,xx,zz)=>W.setPos(id,[xx,x.getH(xx,zz),zz,0,0,0]);
const send=(id,m)=>{ W.receive(id,m); tick(1); };
const home=id=>at(id,x.VIL.x+3,x.VIL.z+3);

// ---- the grounds ----
const yard=x.NODES.filter(n=>n.home);
ok('the Wayfarers\' Grounds exist: 18 nodes (6 ore, 6 trees, 6 herbs, every grade), last in the list',!!x.HOME_YARD&&yard.length===18&&x.NODES.slice(-18).every(n=>n.home)&&yard.filter(n=>x.NODE_KINDS[n.kind].prof==='mining').map(n=>n.need).sort().join()==='0,1,2,3,4,5');
ok('the clearing is 35-130 m from the first village, dry ground',Math.hypot(x.HOME_YARD.x-x.VIL.x,x.HOME_YARD.z-x.VIL.z)>=35&&Math.hypot(x.HOME_YARD.x-x.VIL.x,x.HOME_YARD.z-x.VIL.z)<=140&&yard.every(n=>x.getH(n.x,n.z)>1.5));
// tools and professions for both
for(const [id,p] of [['a',pa],['b',pb]]){ p.gear.coins=1e6; home(id); for(const pr of ['mining','woodcutting','gathering']) send(id,{t:'learn',id:pr}); p.gear.inv.push('pick1','axe1','sickle1'); for(const t of ['pick1','axe1','sickle1']) send(id,{t:'equip',id:t}); }
const cu=yard.find(n=>n.kind==='copper');
const gather=(id,n)=>{ at(id,n.x,n.z); W.receive(id,{t:'gather',i:n.i}); tick(30); grab(); };
const xp0=pa.exp, coins0=pa.gear.coins; gather('a',cu);
ok('a gather in the grounds gives the resource, a little exp and coins',(pa.gear.res.copper||0)>=1&&pa.exp>xp0&&pa.gear.coins>coins0);
ok('the exp is tiny (under 0.1% of a level per gather)',pa.exp-xp0<x.expToNext(25)*0.001,Math.round(pa.exp-xp0)+' of '+Math.round(x.expToNext(25)));
ok('only the gatherer is told the node is taken (e.to), and a second gather is refused',evs.a.some(e=>e[0]==='node'&&e[1]===cu.i&&e[2]===1)&&!evs.b.some(e=>e[0]==='node'&&e[1]===cu.i)&&x.S&&(()=>{ const n0=pa.gear.res.copper; gather('a',cu); return pa.gear.res.copper===n0; })());
const nb0=pb.gear.res.copper||0; gather('b',cu);
ok('the same node is still there for the other player',(pb.gear.res.copper||0)>nb0);
tick(Math.round(x.HOME_RESPAWN/0.05)+40); grab();
ok('after HOME_RESPAWN it is back for that player (a node 0 event to them)',!(pa.hback&&pa.hback[cu.i])&&evs.a.some(e=>e[0]==='node'&&e[1]===cu.i&&e[2]===0));
{ const n0=pa.gear.res.copper; gather('a',cu); ok('and can be worked again',pa.gear.res.copper>n0); }
{ const hi=yard.find(n=>n.kind==='rimeore'); const n0=pa.gear.res.rimeore||0; gather('a',hi); ok('a top-grade vein still needs a top-grade pickaxe',(pa.gear.res.rimeore||0)===n0); }

// ---- the tools' bonus ----
{ const g={eq:{pick:'pick1',axe:null,sickle:null}}; const b=(id,slot)=>x.toolBonusOf({eq:{[slot]:id}},slot);
  ok('a tool below the third tier gives nothing; better tools and rarer ones give a little more',b('pick1','pick')===0&&b('pick2','pick')===0&&b('pick3','pick')>0&&b('pick5','pick')>b('pick3','pick')&&b('pick3-l','pick')>b('pick3','pick'));
  ok('the bonus is capped at 2% per tool, so 6% for all three',b('pick6-l','pick')<=x.TOOL_BONUS_CAP+1e-9&&x.TOOL_BONUS_CAP<=0.02); }
{ const h0=pa.maxHp, d0=pa.dmg, df0=pa.def; pa.gear.inv.push('pick5','axe5','sickle5'); pa.level=25; for(const t of ['pick5','axe5','sickle5']) send('a',{t:'equip',id:t});
  ok('good tools worn raise attack, health and defence by a few per cent at most',pa.dmg>d0&&pa.maxHp>h0&&pa.dmg<d0*1.07&&pa.maxHp<h0*1.07,Math.round((pa.dmg/d0-1)*1000)/10+'% attack, '+Math.round((pa.maxHp/h0-1)*1000)/10+'% health'); }

// ---- the new potions ----
ok('eighteen potions in six kinds, the new three brewed from herbs',Object.keys(x.POTS).length===18&&['regen','scholar','fortune'].every(k=>x.POT_KINDS[k]&&x.POTS[k+'1']&&x.POTS[k+'3'].herbs.length>0));
home('a'); pa.gear.pot={regen2:2,scholar1:1,fortune3:1}; pa.hp=Math.round(pa.maxHp*0.3);
send('a',{t:'potion',k:'regen'}); const h1=pa.hp; tick(45);
ok('Mossblood heals over time',pa.hp>h1&&x.potBuffP(pa,'regen')>0,pa.hp+' > '+h1);
send('a',{t:'potion',k:'scholar'}); send('a',{t:'potion',k:'fortune'});
ok('Scholar\'s Brew and Fortune Tea start long buffs (5 minutes)',x.potBuffP(pa,'scholar')===0.10&&x.potBuffP(pa,'fortune')===0.20&&pa.potb.scholar.until-x.S.t>250);
{ const src=require('fs').readFileSync(__dirname+'/../src/server/combat.js','utf8');
  ok('rewardKill adds the scholar term to exp and the fortune term to coins and drops (the kill path itself: server-smoke)',/potBuffP\(q,'scholar'\)/.test(src)&&/potBuffP\(q,'fortune'\)[\s\S]*potBuffP\(q,'fortune'\)/.test(src)); }
pa.gear.res={}; pa.gear.coins=100000; home('a'); for(const [k,res] of [['regen',null]]) { const P=x.POTS.regen2; pa.gear.res[P.herbs[0].res]=20; pa.gear.res[P.herbs[1].res]=20; send('a',{t:'brew',id:'regen2',n:2}); ok('a new potion is brewed like the old ones',(pa.gear.pot.regen2||0)>=2); }

// ---- cosmetics ----
ok('7 auras and 7 capes, each with a cost in ore or logs, a herb and coins',x.COS_AURAS.length===7&&x.COS_CAPES.length===7&&x.COS_AURAS.every(d=>{ const c=x.cosCost('a',d[0]); return c&&c.res.length===2&&c.coins>0; })&&x.COS_CAPES.every(d=>{ const c=x.cosCost('c',d[0]); return c&&c.res.length===2; }));
ok('ids are own properties only (constructor, __proto__ are nothing)',!x.cosDef('a','constructor')&&!x.cosDef('c','__proto__')&&!x.cosDef('a','toString')&&x.cosCost('a','constructor')===null);
ok('a save\'s cosmetics are checked: unknown, repeated and malformed entries go',JSON.stringify(x.sanitizeCos({cos:['a:firefly','a:firefly','c:nope','x:y',7,'c:regal','a:constructor']}))==='["a:firefly","c:regal"]'&&x.sanitizeCos({cos:'a:firefly'}).length===0);
{ at('a',x.VIL.x+150,x.VIL.z+150); pa.gear.res={pine:30,sunpetal:30}; pa.gear.cos=[]; send('a',{t:'cosmake',type:'c',id:'wayfarer'}); ok('cosmetics are made at a lodge only',pa.gear.cos.length===0);
  home('a'); send('a',{t:'cosmake',type:'c',id:'wayfarer'}); const c=x.cosCost('c','wayfarer');
  ok('making a cape takes its logs, herb and fee, and adds it to gear.cos',pa.gear.cos.join()==='c:wayfarer'&&pa.gear.res.pine===30-c.res[0][1]&&pa.gear.coins<100000);
  const n0=pa.gear.coins; send('a',{t:'cosmake',type:'c',id:'wayfarer'}); ok('twice costs nothing the second time',pa.gear.coins===n0&&pa.gear.cos.length===1);
  send('a',{t:'cosmake',type:'a',id:'stellar'}); ok('without the materials nothing is made',pa.gear.cos.length===1);
  send('a',{t:'cosmake',type:'c',id:'constructor'}); send('a',{t:'cosmake',type:'zz',id:'wayfarer'}); ok('garbage ids and types do nothing',pa.gear.cos.length===1); }
send('a',{t:'look',look:{cls:'warrior',cape:'wayfarer',aura:'stellar'}});
ok('the server keeps the cape you own and throws out the aura you do not',pa.look.cape==='wayfarer'&&pa.look.aura==='');
{ const q=W.join('c',{name:'Cy',look:{cls:'warrior',cape:'regal',aura:'wisp'},save:{level:5}}); const pc=W.players.get('c'); ok('a joining look is cleaned the same way',pc.look.cape===''&&pc.look.aura===''); }

// ---- the character model ----
{ const C=require('./char-load')(); const look=(o)=>Object.assign({},C.LOOK_M,o);
  const plain=C.buildCharacter(look({}),{q:1}), cape=C.buildCharacter(look({cape:'regal'}),{q:1}), aura=C.buildCharacter(look({aura:'stellar'}),{q:1}), both=C.buildCharacter(look({cape:'ember',aura:'blossom'}),{q:1});
  ok('no cape and no aura adds nothing; a cape or an aura adds loose parts moved by rig.anims',!plain.anims&&cape.anims&&cape.anims.length===1&&aura.anims&&both.anims.length===2);
  for(const [id,rig] of [['cape',cape],['aura',aura],['both',both]]){ for(let i=0;i<60;i++) for(const f of rig.anims) f(i*0.05,0.05,i%2?0.8:0); const s=C.stats(rig); ok('the '+id+' animates without NaN and stays near the body',s.bad===0&&s.maxR<2.2,s.maxR.toFixed(2)); }
  ok('a hostile look (aura \'constructor\', cape \'__proto__\') builds the plain character',(()=>{ try{ const r=C.buildCharacter(look({aura:'constructor',cape:'__proto__'}),{q:1}); return !r.anims; }catch(e){ return false; } })());
  ok('every cape and aura builds',C.COS_CAPES.every(d=>!!C.buildCharacter(look({cape:d[0]}),{q:0.6}).anims)&&C.COS_AURAS.every(d=>!!C.buildCharacter(look({aura:d[0]}),{q:0.6}).anims));
  const fem=C.buildCharacter(Object.assign({},C.LOOK_F,{cape:'regal'}),{q:1}); ok('the female body wears a cape too',!!fem.anims); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
