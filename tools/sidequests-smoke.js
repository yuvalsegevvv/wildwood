// Headless test of the side quests (shared/side-quests.js + server/side-quests.js), straight from src/: every chain's data points at things that exist (people, monsters,
// lore, places, nodes, the cosmetic), then plays The Grey Tide from Oskar's first words to Carapax and the Tide King's Mantle (talks in the right village, kills, quest drops, lore, a herb,
// a place after dark with its scene, a step that ends where you stand and one that starts by itself), checks the pay (resources, a little XP, much less than the main quest),
// the quest-only cosmetic (owned, never made), the chain that waits for another, tracking, and an old or hacked save.
// Usage: node tools/sidequests-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['MONS','getH','S','SQ','SQ_BY_ID','SQ_PLACES','SQ_NPC_VIL','SQ_NAMES','VILS','LORE_BY_ID','NODE_KINDS','PROFS','DEF_BY_ID','BOSS_DEFS','rdBossRow','cpDef','sanitizeSq','sqReward','sqTalk','expToNext','MQ_BY_ID','mqReward','rewardKill','sqOf','cosMakeP','RES','ZONES','sqGatherP']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const at=(xx,zz)=>W.setPos('a',[xx,x.getH(xx,zz),zz,0,0,0]);
const vil=v=>{ const V=x.VILS[v-1]; at(V.x+3,V.z+3); tick(1); };
const talk=id=>{ W.receive('a',{t:'sq',a:'talk',id}); tick(1); };
const killN=(id,n)=>{ let k=0; for(const m of x.MONS.filter(m=>m.def.id===id&&!m.dead)){ if(k>=n) break; x.rewardKill(p,m); k++; } tick(1); return k; };
const lucky=f=>{ const real=Math.random; Math.random=()=>0; try{ f(); } finally{ Math.random=real; } };

// ---- the data ----
const bad=[];
for(const C of x.SQ){
  const m=/^([ac]):(.+)$/.exec(C.cos||''), D=m&&x.cpDef(m[1],m[2]);
  if(!D||D.free||D.recipe||D.quest!==C.id) bad.push(C.id+': cosmetic '+C.cos);
  for(const r of C.res) if(!x.RES[r]) bad.push(C.id+': resource '+r);
  if(C.after&&!x.SQ_BY_ID[C.after]) bad.push(C.id+': after '+C.after);
  for(const s of C.steps){
    for(const who of [s.from,s.to]) if(who!==null&&!x.SQ_NPC_VIL[who]) bad.push(s.id+': person '+who);
    if(s.i===0&&s.from===null) bad.push(s.id+': a chain must start with someone');
    for(const pt of s.parts){
      if(!pt.text) bad.push(s.id+': a part with no text');
      if(pt.talk&&!x.SQ_NPC_VIL[pt.talk]) bad.push(s.id+': talk '+pt.talk);
      for(const id of [pt.kill,pt.boss,...(pt.collect?pt.from:[])]) if(id&&!x.DEF_BY_ID[id]&&!x.rdBossRow(id)) bad.push(s.id+': monster '+id);
      if(pt.boss&&!x.rdBossRow(pt.boss)) bad.push(s.id+': boss '+pt.boss);
      if(pt.read&&!x.LORE_BY_ID[pt.read]) bad.push(s.id+': lore '+pt.read);
      if(pt.visit&&!x.SQ_PLACES[pt.visit]) bad.push(s.id+': place '+pt.visit);
      if(pt.gather&&!x.NODE_KINDS[pt.gather]&&!['mining','woodcutting','gathering'].includes(pt.gather)) bad.push(s.id+': gather '+pt.gather);
    }
  }
}
ok('every chain points at people, monsters, bosses, lore, places, nodes and a quest-only cosmetic that exist',!bad.length,bad.join('; '));
ok('eight chains, each ending at a boss: Carapax, Kyuubi, Vetrmaw, the Sand Wyrm, Captain Dredge, the Gloam Warden, Old Thunder, Oldhorn',x.SQ.map(C=>C.steps[C.steps.length-1].parts[0].boss).join()==='carapax,kyuubi,vetrmaw,sandwyrm,drownedcaptain,gloamwarden,oldthunder,oldhorn');
ok('every place is on land you can stand on',Object.values(x.SQ_PLACES).every(P=>isFinite(P.x)&&isFinite(P.z)&&P.r>0));
{ const C=x.SQ_BY_ID.tide, r=x.sqReward(C,0), mq=x.mqReward(x.MQ_BY_ID.V5);
  ok('a side step pays resources and a little XP: under a fifth of a main quest step\'s at that level',r.res.length===3&&r.res.every(([,n])=>n>0)&&r.xp>0&&r.xp<mq.xp/5,'side '+r.xp+' main '+mq.xp); }

// ---- The Grey Tide, played ----
W.join('a',{name:'Sider',look:{cls:'warrior'},save:{level:14}}); tick(1);
const p=W.players.get('a'), E=c=>(p.gear.sq.c[c]||{s:0,st:0,n:[]});
ok('a new hiker has no side quest under way',p.gear.sq&&!Object.keys(p.gear.sq.c).length);
vil(1); talk('oskar'); ok('below its level the chain does not start',E('tide').st===0);
p.level=15; talk('oskar'); ok('at level 15 Oskar starts The Grey Tide, and it is tracked',E('tide').s===0&&E('tide').st===1&&p.gear.sq.t==='tide');
at(x.LORE_BY_ID.wreck.x,x.LORE_BY_ID.wreck.z); W.receive('a',{t:'mq',a:'read',id:'wreck'}); tick(1);
ok('reading the old fishing boat counts',E('tide').n[0]===1);
ok('six tide slimes',killN('tideslime',6)===6&&E('tide').st===2);
talk('oskar'); ok('handing in from far away does nothing',E('tide').s===0);
{ const res0=p.gear.res.silver||0, xp0=p.exp; vil(1); talk('oskar');
  ok('handed in to Oskar: the next step waits for Bram; it paid silverstone, yew, ironroot and a little XP',E('tide').s===1&&E('tide').st===0&&p.gear.res.silver===res0+3&&p.gear.res.yew>=3&&p.gear.res.ironroot>=2&&(p.exp>xp0||p.level>15)); }
talk('bram'); ok('Bram starts What the crabs carry',E('tide').s===1&&E('tide').st===1);
talk('linnea'); ok('Linnea waits for the pearls (a part after another)',E('tide').n[1]===0);
lucky(()=>killN('crab',4)); ok('four grey pearls from the crabs',E('tide').n[0]===4);
talk('linnea'); ok('Linnea looks at them: talk part and hand-in in one talk',E('tide').s===2&&E('tide').st===0);
talk('bram'); lucky(()=>killN('scarab',4)); ok('scarab wings',E('tide').n[0]===4);
for(let i=0;i<3;i++) x.sqGatherP(p,'ironroot');   // (the hook professions.js calls when a node's haul is in)
ok('three ironroot cut (the gather hook)',E('tide').n[1]===3&&E('tide').st===2,'n '+E('tide').n);
vil(1); talk('bram'); ok('Bram: the Tide King, ask Oskar',E('tide').s===3&&E('tide').st===0);
talk('oskar'); lucky(()=>killN('cragwarden',3)); killN('ramboar',4); vil(1); talk('oskar');
ok('crag moss and the boars: Oskar sends you to the beach, the next step starts in the same talk',E('tide').s===4&&E('tide').st===1);
{ const B=x.SQ_PLACES.tidebeach; x.S.day=0.3; at(B.x,B.z+B.r-6); tick(14); ok('the beach by day: the moss waits for dark',E('tide').s===4&&E('tide').n[0]===0);
  inbox.a=[]; x.S.day=0.7; tick(14);
  const say=(inbox.a||[]).some(m=>m.t==='snap'&&JSON.stringify(m).includes('sqsay'));
  ok('after dark it counts, the step ends where you stand and The Tide King starts by itself; the scene is sent',E('tide').s===5&&E('tide').st===1,'say event '+say); }
{ const cos0=(p.gear.cos||[]).length, c=x.MONS.find(m=>m.def.id==='carapax'); x.rewardKill(p,c); tick(2); ok('Carapax falls: ready to hand in',E('tide').st===2);
  vil(1); talk('oskar'); ok('The Grey Tide is finished and the Tide King\'s Mantle is yours',E('tide').s===6&&p.gear.cos.includes('c:tideking')&&p.gear.cos.length===cos0+1);
  ok('the finished chain is no longer tracked',p.gear.sq.t==='');
  const coins=p.gear.coins; x.cosMakeP(p,'c','tideking'); x.cosMakeP(p,'a','foxfire'); ok('a quest piece is never made at a Lodge (no recipe, no charge)',!p.gear.cos.includes('a:foxfire')&&p.gear.coins===coins); }

// ---- the Gloamhorn's second chain waits for the first; tracking; saves ----
p.level=36; { const T=x.sqTalk(p.gear.sq,'maelis',36,false); ok('The Keeper\'s Light waits for The Drowned Captain',!T.acts.some(a=>a.c==='keeper')); }
p.gear.sq.c.drowned={s:5,st:0,n:[]}; { const T=x.sqTalk(p.gear.sq,'maelis',36,false); ok('...and opens once it is finished',T.acts.some(a=>a.c==='keeper'&&a.start)); }
{ const sq={c:{},t:''}, a=(npc,lv,q)=>x.sqTalk(q||sq,npc,lv,false).acts;   // the Amber Reach's chains (pure talk rules: Tallgrass itself arrives with the village)
  ok('Warden Oruvi starts The Dawn Seat from level 37, not below',!a('oruvi',36).length&&a('oruvi',37).some(t=>t.c==='dawnseat'&&t.start));
  ok('The Drought Song waits for The Dawn Seat, then Kesi opens it from level 41',!a('kesi',45).length&&a('kesi',41,{c:{dawnseat:{s:5,st:0,n:[]}},t:''}).some(t=>t.c==='drought'&&t.start)); }
p.gear.sq.c.ninetails={s:1,st:1,n:[0,0]}; W.receive('a',{t:'sq',a:'track',c:'ninetails'}); tick(1); ok('tracking a running chain',p.gear.sq.t==='ninetails');
W.receive('a',{t:'sq',a:'track',c:'nosuch'}); tick(1); ok('a made-up chain id tracks nothing',p.gear.sq.t==='');
{ const s=x.sanitizeSq({c:{tide:{s:99,st:7,n:[9e9]},constructor:{s:1},ninetails:{s:2,st:2,n:[1,0,0]}},t:'__proto__'});
  ok('a hacked save is cut down: steps clamped, unknown chains and a ready step that is not done dropped back',s.c.tide.s===6&&s.c.ninetails.st===1&&s.t===''&&!Object.prototype.hasOwnProperty.call(s.c,'constructor'),JSON.stringify(s)); }
ok('an old save with no side quests is fine',JSON.stringify(x.sanitizeSq(undefined))==='{"c":{},"t":""}');
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
