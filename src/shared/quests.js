//@ Quest board: endless random quests (hunt, bounty, scout, boss) scaled to your level, and their rewards. Pure.
/* Maren's board always shows QUEST_OFFERS notices. Each notice's level is drawn from 4 below to 2 above your
   level, much more likely the closer it is to yours. Kinds:
     hunt    defeat 5-8 of a monster (3-4 treants)          reward: XP, coins, 50% chance of an item
     bounty  defeat 12-15 (6-8 treants), the grindy one      reward: more XP and coins, always an item, 25% rare
     scout   walk to a named place in that level's zone      reward: XP and coins
     boss    the Rootwarden (from level 13)                  reward: lots, a rare item, 20% epic
   Items are of the quest's level tier. Notices refresh when you level up and at sunrise. */
function dirWord(x,z){ const a=Math.atan2(x,-z), i=Math.round(a/(Math.PI/4)); return ['north','north-east','east','south-east','south','south-west','west','north-west','north'][(i+8)%8]; }
const QUEST_OFFERS=4, QUEST_MAX_ACTIVE=5;
const coinAvg=L=>fLv(L)*2*Math.pow(1.1,Math.max(0,L-5));
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const qpick=a=>a[Math.floor(Math.random()*a.length)];
function questLevelFor(pl){
  const E=Math.max(1,Math.min(15,pl)), lo=Math.max(1,E-4), hi=Math.min(15,E+2), w=[];
  let sum=0; for(let L=lo;L<=hi;L++){ const x=Math.exp(-0.9*Math.abs(L-E))*(L>E?0.55:1); w.push([L,x]); sum+=x; }
  let r=Math.random()*sum; for(const [L,x] of w){ r-=x; if(r<=0) return L; } return E;
}
// places worth scouting at each level: the zone itself, plus any lake inside it
function scoutPlace(L){
  const zn=ZONES.find(z=>z.key===L), opts=[];
  const [x,z]=zonePoint(zn,(Math.random()-0.5)*0.5,0.35+Math.random()*0.3); opts.push({x,z,name:zn.name});
  for(const lk of LAKES){ const lz=zoneAt(lk.x,lk.z); if(lz&&lz.key===L) opts.push({x:lk.x,z:lk.z,name:lk.name}); }
  return qpick(opts);
}
function genQuest(pl,id){
  const E=Math.max(1,Math.min(15,pl)), L=questLevelFor(pl), d=MON_DEFS.find(m=>m.level===L), zn=ZONES.find(z=>z.key===L);
  const big=d.model==='treant', many=d.name+'s', x=Math.random();
  let q;
  if(E>=13 && x<0.12) q={kind:'boss',type:'kill',target:'boss',count:1,level:15,title:'The Rootwarden',
    text:'Something ancient sleeps in the stone circle at the edge of the world, and the forest sickens around it. Wake it, and end it.'};
  else if(x<0.24){ const p=scoutPlace(L); q={kind:'scout',type:'visit',at:{x:Math.round(p.x),z:Math.round(p.z)},r:18,level:L,place:p.name,
    title:qpick(['Scout '+p.name,'Eyes on '+p.name,'A Look at '+p.name]),
    text:qpick(['Walk out to '+p.name+' and see how things stand. Just get close enough to look around, then come back.','Nobody has been out to '+p.name+' in weeks. Go and have a look, then tell me what you saw.'])}; }
  else if(x<0.42){ const n=big?rint(6,8):rint(12,15); q={kind:'bounty',type:'kill',target:d.id,count:n,level:L,
    title:'Bounty: '+n+' '+many, text:'The village pays well for a big cull: '+n+' '+many+' from '+zn.name+'. Long work, but the reward is worth it, and there is always gear in it for you.'}; }
  else { const n=big?rint(3,4):rint(5,8); q={kind:'hunt',type:'kill',target:d.id,count:n,level:L,
    title:qpick([d.name+' Hunt','Thin the '+many,'Trouble in '+zn.name,many+' on the Move']),
    text:qpick([zn.name+' is crawling with '+many+'. Defeat '+n+' of them.','A trapper lost his snares to '+many+' near '+zn.name+'. Deal with '+n+'.','Travellers keep running into '+many+'. Clear out '+n+' around '+zn.name+'.'])}; }
  q.id=id; q.reward=questRewardFor(q); return q;
}
// item: p = chance of an item, r = chance it is rare, e = chance it is epic
function questRewardFor(q){
  const L=q.level, n=q.count||0;
  if(q.kind==='boss') return {xp:Math.round(xpFor(15)*40),coins:2500,item:{p:1,r:1,e:0.2}};
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
const giverName=()=>'Maren';
