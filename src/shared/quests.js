//@ Quest board: endless random quests (hunt, bounty, scout, boss) scaled to your level, and their rewards. Pure.
/* Maren's board always shows QUEST_OFFERS notices. Each notice's level is drawn from 4 below to 2 above your
   level, much more likely the closer it is to yours. Kinds:
     hunt    defeat 10-20 of a level-1 monster, rising evenly to 30-50 at level 15
                                                             reward: XP, coins, 50% chance of an item
     bounty  1.5x a hunt, the grindy one                     reward: more XP and coins, always an item, 25% rare
     scout   walk to a named place in that level's zone      reward: XP and coins
     boss    the Rootwarden (from level 13), Carapax the Tide King (from 17), Akaoni (from 18), Kyuubi (from 23), Ymrik (from 25), Vetrmaw (from 29)   reward: lots, a rare item, 20% epic
   Levels 16-25 are the Sakura Vale's and 22-30 the Hoarfrost Reach's: two monster kinds per level, so a hunt names one of the two. Levels 12-15 also have the
   home forest's edge kinds (shore crabs...), hunted in their own edge zone.
   Items are of the quest's level tier. Notices refresh when you level up and at sunrise. */
function dirWord(x,z){ const a=Math.atan2(x,-z), i=Math.round(a/(Math.PI/4)); return ['north','north-east','east','south-east','south','south-west','west','north-west','north'][(i+8)%8]; }
const QUEST_OFFERS=4, QUEST_MAX_ACTIVE=5, QUEST_MAX_COUNT=120;
// how many kills a hunt asks for at level L: 10-20 at level 1, growing evenly to 30-50 at level 15
function huntCount(L){ const f=Math.min(1,(L-1)/14), lo=10+20*f, hi=20+30*f; return Math.round(lo+Math.random()*(hi-lo)); }
const coinAvg=L=>fLv(L)*2*Math.pow(1.1,Math.max(0,L-5))*highMult(L);
const qpick=a=>a[Math.floor(Math.random()*a.length)];
function questLevelFor(pl){
  const E=Math.max(1,Math.min(MAX_ZONE_LV,pl)), lo=Math.max(1,E-4), hi=Math.min(MAX_ZONE_LV,E+2), w=[];
  let sum=0; for(let L=lo;L<=hi;L++){ const x=Math.exp(-0.9*Math.abs(L-E))*(L>E?0.55:1); w.push([L,x]); sum+=x; }
  let r=Math.random()*sum; for(const [L,x] of w){ r-=x; if(r<=0) return L; } return E;
}
// places worth scouting at each level: the zone itself, plus any lake inside it
function scoutPlace(L){
  const zs=ZONES.filter(z=>z.level===L&&!z.boss&&!z.edge), zn=qpick(zs), opts=[];   // (levels 22-25 have a vale zone and a Hoarfrost zone)
  const [x,z]=zonePoint(zn,(Math.random()-0.5)*0.5,0.35+Math.random()*0.3); opts.push({x,z,name:zn.name});
  for(const lk of LAKES){ const lz=zoneAt(lk.x,lk.z); if(lz&&lz.key===L) opts.push({x:lk.x,z:lk.z,name:lk.name}); }
  return qpick(opts);
}
// the boss notices: the strongest boss you are ready for (a little below its level), sometimes the one before it
const BOSS_QUESTS=[
  {target:'boss',from:13,level:15,title:'The Rootwarden',text:'Something ancient sleeps in the stone circle at the edge of the world, and the forest sickens around it. Wake it, and end it.'},
  {target:'carapax',from:17,level:20,title:'Carapax, the Tide King',text:'The fishers of the Crownsea Shore have stopped putting to sea. A crab the size of a boat has taken the beach west of the river, and the tide rises whenever it wants. End it.'},
  {target:'akaoni',from:18,level:20,title:'Akaoni, the Gate Demon',text:'A red oni the size of a gatehouse guards the Demon Gate in the far corner of the vale. It leaps like a cat, and fire follows where it lands. End it.'},
  {target:'kyuubi',from:23,level:25,title:'Kyuubi, the Nine-Tailed',text:'Nine tails of foxfire burn above the shrine in the north-west of the vale. The old fox has ruled there for a thousand years. End its reign.'},
  {target:'ymrik',from:25,level:26,title:'Ymrik, the Rimeking',text:'A frost giant has taken the ice hall in the middle of the Hoarfrost Reach, and his thralls raid the wold beyond the lake. The cold in his hall closes in on anyone who lingers: end him before it ends you.'},
  {target:'vetrmaw',from:29,level:30,title:'Vetrmaw, the Frost Wyrm',text:'A wyrm nests in the glacier at the far north-east of the reach, where the iron bird fell. The hunters of Rimehold want it gone.'}];
function bossQuestFor(E){ const ok=BOSS_QUESTS.filter(b=>E>=b.from); if(!ok.length) return null; return ok.length>1&&Math.random()<0.3?ok[ok.length-2]:ok[ok.length-1]; }
function genQuest(pl,id){
  const E=Math.max(1,Math.min(MAX_ZONE_LV,pl)), L=questLevelFor(pl), d=qpick(MON_DEFS.filter(m=>m.level===L)), zn=defZone(d);
  const big=d.model==='treant', many=d.name+'s', x=Math.random(), bq=bossQuestFor(E);
  let q;
  if(bq && x<0.12) q={kind:'boss',type:'kill',target:bq.target,count:1,level:bq.level,title:bq.title,text:bq.text};
  else if(x<0.24){ const p=scoutPlace(L); q={kind:'scout',type:'visit',at:{x:Math.round(p.x),z:Math.round(p.z)},r:18,level:L,place:p.name,
    title:qpick(['Scout '+p.name,'Eyes on '+p.name,'A Look at '+p.name]),
    text:qpick(['Walk out to '+p.name+' and see how things stand. Just get close enough to look around, then come back.','Nobody has been out to '+p.name+' in weeks. Go and have a look, then tell me what you saw.'])}; }
  else if(x<0.42){ const n=Math.round(huntCount(L,big)*1.5); q={kind:'bounty',type:'kill',target:d.id,count:n,level:L,
    title:'Bounty: '+n+' '+many, text:'The village pays well for a big cull: '+n+' '+many+' from '+zn.name+'. Long work, but the reward is worth it, and there is always gear in it for you.'}; }
  else { const n=huntCount(L,big); q={kind:'hunt',type:'kill',target:d.id,count:n,level:L,
    title:qpick([d.name+' Hunt','Thin the '+many,'Trouble in '+zn.name,many+' on the Move']),
    text:qpick([zn.name+' is crawling with '+many+'. Defeat '+n+' of them.','A trapper lost his snares to '+many+' near '+zn.name+'. Deal with '+n+'.','Travellers keep running into '+many+'. Clear out '+n+' around '+zn.name+'.'])}; }
  q.id=id; q.reward=questRewardFor(q); return q;
}
// item: p = chance of an item, r = chance it is rare, e = chance it is epic
function questRewardFor(q){
  const L=q.level, n=q.count||0;
  if(q.kind==='boss') return {xp:Math.round(xpFor(L)*40),coins:Math.round(2500*coinAvg(L)/coinAvg(15)),item:{p:1,r:1,e:0.2}};
  if(q.kind==='scout') return {xp:Math.round(6*xpFor(L)),coins:Math.round(10*coinAvg(L)),item:null};
  if(q.kind==='bounty') return {xp:Math.round(n*xpFor(L)*2.2),coins:Math.round(n*coinAvg(L)*2.6),item:{p:1,r:0.25,e:0}};
  return {xp:Math.round(n*xpFor(L)*1.6),coins:Math.round(n*coinAvg(L)*2),item:{p:0.5,r:0,e:0}};
}
function rollQuestItemRarity(it){ if(!it||Math.random()>=it.p) return -1; return Math.random()<it.e?2:Math.random()<it.r?1:0; }
function rewardItemText(it){
  if(!it) return '';
  if(it.e>0) return 'a rare item ('+Math.round(it.e*100)+'% epic)';
  if(it.p>=1) return it.r>0?'an item ('+Math.round(it.r*100)+'% rare)':'an item';
  return Math.round(it.p*100)+'% chance of an item';
}
