//@ Players on the server: records, stats, XP and levels, damage taken, knock-out and respawn, private state ("you")
/* Stats: health = 20 x f(level) + armor health; damage = 3 x f(level) + weapon attack; defense cuts damage by def/(def+60).
   Each player's save (level, XP, gear, coins, quests) lives in their own browser and is sent on join;
   the server sends back a "you" message whenever it changes so the client can store it again. */
function sanitizeGear(g,cls){
  const base=newGearFor(cls);
  if(!g||typeof g!=='object') return base;
  const out={inv:Array.isArray(g.inv)?g.inv.filter(id=>typeof id==='string'&&ITEM[id]).slice(0,BAG_MAX):base.inv,eq:Object.assign({},base.eq),coins:Math.min(COINS_MAX,Math.max(0,Math.floor(+g.coins||0))),q:null,startAll:!!g.startAll,bought:{},east:clampInt(g.east,0,2,0),north:clampInt(g.north,0,2,0),west:clampInt(g.west,0,2,0),river:clampInt(g.river,0,1,0),neck:clampInt(g.neck,0,1,0),redgate:clampInt(g.redgate,0,1,0),sun:clampInt(g.sun,0,2,0),soul:ELEMS[g.soul]?g.soul:'basic',mats:{}};
  if(g.mats&&typeof g.mats==='object') for(const id in g.mats){ const n=MATS[id]?clampInt(g.mats[id],0,MAT_MAX,0):0; if(n) out.mats[id]=n; }
  if(g.eq) for(const k in out.eq){ const id=g.eq[k], it=ITEM[id]; if(it&&out.inv.includes(id)&&(k==='weapon'?it.kind==='weapon':it.slot===k)) out.eq[k]=id; else if(k!=='weapon') out.eq[k]=null; }
  if(!ITEM[out.eq.weapon]) out.eq.weapon=base.eq.weapon;
  if(!out.inv.includes(out.eq.weapon)) out.inv.push(out.eq.weapon);
  if(g.bought&&typeof g.bought==='object') for(const id in g.bought) if(ITEM[id]&&ITEM[id].rar===0) out.bought[id]=clampInt(g.bought[id],0,999,0);
  out.q=sanitizeQuests(g.q);
  out.skills=sanitizeSkills(g.skills);
  out.mq=sanitizeMq(g.mq);
  { const pr=sanitizeProf(g); out.prof=pr.prof; out.res=pr.res; out.pot=sanitizePots(g); }
  out.zt=sanitizeZt(g.zt);
  out.ss=ssSanitizeSave(g.ss);   // skillsets: the pity counts of the sources (an old save has none)
  out.dg=dgSanitizeSave(g.dg);   // dungeons: clears and best times per '<theme>:<mission>' (an old save has none)
  rlSanitizeStones(g,out);   // rolls: the weapon / armour reroll stones (an old save has none)
  out.temper=clampInt(g.temper,0,DG_STONE_MAX,0);   // dungeons: the Tempering Stones (a count; an old save has none)
  if(out.north<1&&out.mq.s>MQ_BY_ID.V10.i) out.north=1;   // saves that already got past Akaoni: the ice wall is open for them
  if(out.west<1&&out.mq.s>MQ_BY_ID.F8.i) out.west=1;      // ... and past Ymrik: the glacier valley is
  return out;
}
// quests travel in the player's own save, so check every field and recompute the rewards here
function sanitizeQuest(q){
  if(!q||typeof q!=='object'||!/^g\d{1,9}$/.test(q.id)) return null;
  const L=clampInt(q.level,1,MAX_ZONE_LV,0); if(!L) return null;
  const str=(v,n)=>String(v||'').slice(0,n);
  const o={id:q.id,kind:q.kind,type:q.type,level:L,title:str(q.title,80),text:str(q.text,300)};
  if(q.kind==='boss'){ const b=BOSS_DEFS.find(x=>x.def.id===q.target)||BOSS_DEFS[0]; Object.assign(o,{type:'kill',target:b.def.id,count:1,level:b.def.level}); }
  else if(q.kind==='hunt'||q.kind==='bounty'){ const d=MON_DEFS.find(m=>m.id===q.target&&m.level===L); if(!d) return null; Object.assign(o,{type:'kill',target:d.id,count:clampInt(q.count,1,QUEST_MAX_COUNT,10)}); }
  else if(q.kind==='scout'){ if(!q.at||!isFinite(q.at.x)||!isFinite(q.at.z)) return null; Object.assign(o,{type:'visit',at:{x:clamp(+q.at.x,WX0,WX1),z:clamp(+q.at.z,WZ0,WZ1)},r:18,place:str(q.place,40)}); }
  else return null;
  o.reward=questRewardFor(o); return o;
}
function sanitizeQuests(q){
  const out={offers:[],active:{},defs:{},ready:[],done:0,next:1};
  if(!q||typeof q!=='object') return out;
  out.next=clampInt(q.next,1,1e9,1); out.done=typeof q.done==='number'?clampInt(q.done,0,1e9,0):0;
  if(Array.isArray(q.offers)) out.offers=q.offers.map(sanitizeQuest).filter(Boolean).slice(0,QUEST_OFFERS);
  if(q.defs&&q.active) for(const id in q.active){ const d=sanitizeQuest(q.defs[id]); if(d&&Object.keys(out.active).length<QUEST_MAX_ACTIVE){ out.defs[id]=d; out.active[id]=clampInt(q.active[id],0,d.count||1,0); } }
  if(Array.isArray(q.ready)) out.ready=q.ready.filter(id=>typeof id==='string'&&id in out.active);
  for(const x of [...out.offers,...Object.values(out.defs)]){ const n=parseInt(x.id.slice(1),10); if(n>=out.next) out.next=n+1; }
  return out;
}
// player names: printable characters only, single spaces, 1-16 characters
// invisible characters: zero-width spaces and the bidirectional controls (text that reads backwards): a name or a chat line with one looks like another player's, or reorders what is around it
const INVISIBLE=/[\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g;
function cleanName(s){ return String(s||'').replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').replace(INVISIBLE,'').replace(/\s+/g,' ').trim().slice(0,16)||'Hiker'; }
// loadouts: {owned:[ids: skills and passives], eq:{cls:{basic,skill,burst}}, lv:{id:level}, pass:[passive ids], pgiven, v}; older saves had eq:{cls:'skillId'}
function sanitizeSkills(g){
  const out=newSkills(); out.v=2;
  if(!g||typeof g!=='object') return out;
  if(Array.isArray(g.owned)) for(const id of g.owned) if(typeof id==='string'&&skillDef(id)&&!out.owned.includes(id)) out.owned.push(id);   // (typeof: an id of ["sword1"] is the key 'sword1' to a plain object, passed the lookup and sat in the list as an array)
  if(g.eq) for(const c in out.eq){
    const e=g.eq[c], slots=typeof e==='string'?{skill:e}:(e&&typeof e==='object'?e:{});
    for(const sl of SLOTS){ const id=slots[sl]; if(SKILLS[id]&&(SKILLS[id].cls===c||SKILLS[id].cls==='any')&&SKILLS[id].slot===sl&&out.owned.includes(id)&&canSwap(c,sl,out)) out.eq[c][sl]=id; }   // skillsets: cls 'any' fits every class; owning a slot-1 piece frees the basic slot
  }
  if(g.lv&&typeof g.lv==='object') for(const id in g.lv){ const L=out.owned.includes(id)&&!(skillDef(id)&&(skillDef(id).drop||skillDef(id).set))?clampInt(g.lv[id],1,SKILL_MAX_LV,1):1; if(L>1) out.lv[id]=L; }   // (boss skills cannot be upgraded yet)
  // a passive keeps its slot (which slots a level can use is decided by newPlayer, which knows the level), and sits in one slot only
  if(Array.isArray(g.pass)) g.pass.slice(0,PASSIVE_SLOTS).forEach((id,i)=>{ if(PASSIVES[id]&&out.owned.includes(id)&&!out.pass.includes(id)) out.pass[i]=id; });
  out.pgiven=!!g.pgiven;   // the free passive was handed out once (so taking it off does not bring it back)
  out.v=g.v===2?2:1;   // 1 = from before burst skills: they get their free burst on join
  return out;
}
/* A look is flat (about 50 fields: strings of up to 8 characters, numbers, booleans) and every client that sees the player builds an avatar from it, so what arrives is cut down to that:
   a nested object, a long string, a number that is not finite, more than 80 fields, or a name of Object.prototype ('constructor', '__proto__'...: buildCharacter once threw on
   look.model = 'constructor' for everyone in sight, and a new player joining while that hiker was online could not finish loading) is dropped. Used for hello and for the look message. */
function cleanLookS(look){
  const out={}; if(!look||typeof look!=='object'||Array.isArray(look)) return out;
  let n=0;
  for(const k of Object.keys(look)){
    if(++n>80) break; if(k.length>32||PROTO_KEY.has(k)) continue;
    const v=look[k], t=typeof v;
    if(t==='number'){ if(isFinite(v)) out[k]=v; }
    else if(t==='boolean') out[k]=v;
    else if(t==='string'){ if(v.length<=24&&!PROTO_KEY.has(v)) out[k]=v; }
  }
  return out;
}
function newPlayer(pid,hello){
  hello=hello||{}; const save=hello.save||{}, look=cleanLookS(hello.look);
  const sp=VIL.spawn;
  const p={id:pid,name:cleanName(hello.name),look,x:sp.x,y:getH(sp.x,sp.z),z:sp.z,face:0,vx:0,vz:0,
    level:clampInt(save.level,1,PLAYER_MAX_LV,1),exp:Math.min(EXP_MAX,Math.max(0,+save.exp||0)),gear:sanitizeGear(save.gear,look.cls),
    hp:1,maxHp:1,dmg:1,def:0,red:0,lastHit:-99,dead:false,deadT:0,cd:{basic:0,skill:0,burst:0},buff:null,act:null,dirty:true,travelT:0};
  if(p.gear.startAll) giveAllP(p);
  if(p.gear.skills.v!==2){ autoEquipP(p,'skill'); autoEquipP(p,'burst'); p.gear.skills.v=2; }   // saves from before skills / bursts get the free ones
  p.gear.skills.pass.forEach((id,i)=>{ if(id&&i>=passiveOpen(p.level)) p.gear.skills.pass[i]=null; });   // a passive in a slot this level has not opened goes back to the bag
  autoEquipPassiveP(p);   // ... and from before passives
  recalcP(p); p.hp=p.maxHp; fillOffersP(p); return p;
}
function recalcP(p){
  if(p.pv){ pvpRecalcP(p); return; }   // pvp: on the Proving Isle everyone has the same numbers (server/pvp.js)
  const g=gearStatsOf(p.gear), ratio=p.maxHp>1?p.hp/p.maxHp:1, sym=symbolBonus(p.gear);   // the zone tiers' symbol: +10% health and attack per unlocked tier point
  g.atk+=dgRingAtkP(p);   // dungeons: the worn ring's flat attack, added with the weapon's before everything else (only for a matching soul)
  rlRefreshP(p);   // rolls: the lines of the worn level-40 pieces (p.rl)
  p.maxHp=Math.round((20*fLv(p.level)+g.hp)*(1+psP(p,'hp'))*(1+sym)*(1+rlP(p,'hp'))); p.dmg=(3*fLv(p.level)+g.atk)*(1+sym)*(1+rlP(p,'atk')); p.def=Math.round(g.def*(1+rlP(p,'def'))); p.red=defRed(p.def);   // rolls: hp, atk and def lines
  p.hp=p.dead?0:Math.max(1,Math.min(p.maxHp,Math.round(p.maxHp*ratio)));
  ssRefreshP(p);   // skillsets: the sets worn and their bonuses
}
const clsOfP=p=>classOfGear(p.gear);
const psP=(p,stat)=>passiveSum(skOfP(p),pvLvP(p),stat,p.pv?undefined:clsOfP(p));   // a passive stat (Vitality's hp, Ferocity's dmg...); pvp: on the island the fixed loadout at the fixed level, and no set bonuses
// the bonus of the worn pendant for one stat (pendants.js): read from the item id in the save, never from a number the client sent, and only while you are high enough for it (pvp: none on the island)
function pendP(p,stat){ if(p.pv) return 0; const it=ITEM[p.gear.eq.pendant]; return it&&it.kind==='pendant'&&it.stat===stat&&p.level>=it.lv?it.v:0; }   // pvp: no pendant on the island
const soulOfP=p=>p.level>=SOUL_LV?p.gear.soul:'basic';
function youMsg(p){ return {t:'you',level:p.level,exp:p.exp,maxHp:p.maxHp,hp:p.hp,dmg:p.dmg,def:p.def,red:p.red,dead:p.dead,pv:p.pv?1:0,gear:p.gear}; }   // pvp: pv = standing on the island, where the numbers above are the fixed ones
function pubInfo(p){ return {id:p.id,name:p.name,look:p.look,eq:p.gear.eq,level:p.level}; }
function inVillage(p){ return vNear(p.x,p.z,VR+12); }
// the teleport circles (one in each village): standing on one and choosing a destination (the client's travel window, warp{to}) takes you
// there (CIRCLES in shared/hoarfrost.js: a land's circles wake when you have walked into its village).
function warpP(p,to){
  if(p.dead||S.t-(p.warpT||-9)<2) return;
  if(isGuestP(p)){ guestGateP(p,'travel'); return; }   // accounts: guests stay in the home forest
  const from=CIRCLES.find(C=>Math.hypot(p.x-C.V.tele.x,p.z-C.V.tele.z)<C.V.tele.r+1.5); if(!from) return;
  if(!from.open(p.gear)){ toastTo(p.id,p.gear.east<1?'The circle is cold. Whatever it answers to lies beyond the eastern mountains.':from.id==='highmark'?'The circle hums but will not wake. Walk into Highmark through the glacier valley first.':from.id==='rimehold'?'The circle hums but will not wake. Walk into Rimehold through Frostgate Pass first.':'The circle hums but will not wake. Walk to Hanami on the far side of the bridge first.','bad'); return; }
  const dest=CIRCLES.find(C=>C.id===to)||(from.id==='home'?CIRCLES[1]:CIRCLES[0]);   // no destination given: home <-> Hanami
  if(dest===from) return;
  if(!dest.open(p.gear)){ toastTo(p.id,dest.hint,'bad'); return; }
  const V=dest.V, T=V.tele, a=Math.atan2(V.x-T.x,V.z-T.z), x=T.x+Math.sin(a)*3.2, z=T.z+Math.cos(a)*3.2;
  p.warpT=S.t; ev('warp',p.id,r1(p.x),r1(p.z),r1(x),r1(z)); if(V===VIL) mqActP(p,'warp');
  p.x=x; p.z=z; p.y=getH(x,z); sendTo(p.id,{t:'tp',x,z,face:Math.atan2(-(V.x-x),-(V.z-z))});
}
// the vale: its bridge gate opens for everyone who helped defeat the Rootwarden; walking to Hanami attunes the circles
function openValeP(p){ if(p.gear.east>=1) return; p.gear.east=1; p.dirty=true; ev('vale',p.id,1);
  toastTo(p.id,'A deep rumble rolls in from the eastern mountains: the bridge gate has opened for you. The Sakura Vale lies beyond.','good'); }
function reachHanamiP(p){ if(p.gear.east!==1||Math.hypot(p.x-VIL2.x,p.z-VIL2.z)>VIL2.r+14) return; p.gear.east=2; p.dirty=true; ev('vale',p.id,2); mqActP(p,'hanami');
  toastTo(p.id,'Welcome to Hanami! The teleport circles in both villages are attuned to you now.','good'); }
// the Hoarfrost Reach: the ice wall in Frostgate Pass cracks for everyone who helped defeat Akaoni; walking into Rimehold attunes its circle
function openNorthP(p){ if(p.gear.north>=1) return; p.gear.north=1; p.dirty=true; ev('north',p.id,1);
  toastTo(p.id,'Far to the north, the ice wall in Frostgate Pass cracks and slides apart: the road to the Hoarfrost Reach is open for you.','good'); }
// the Greyspine: the ice fall in the glacier valley breaks up for everyone who helped defeat Ymrik; walking into Highmark attunes its circle
function openWestP(p){ if(p.gear.west>=1) return; p.gear.west=1; p.dirty=true; ev('west',p.id,1);
  toastTo(p.id,'Far to the west, the ice fall in the glacier valley groans and breaks apart: the road to the Greyspine is open for you.','good'); }
function reachHighmarkP(p){ if(p.gear.west!==1||Math.hypot(p.x-VIL4.x,p.z-VIL4.z)>VIL4.r+14) return; p.gear.west=2; p.dirty=true; ev('west',p.id,2); mqActP(p,'highmark');
  toastTo(p.id,'Welcome to Highmark! Its teleport circle is attuned to you now: the circles will take you between all four villages.','good'); }
// the Greyspine's two gates in its west wall: a rock fall slides away for everyone who helped defeat the boss that guards the road
function openGateP(p,id){ if(p.gear[id]>=1) return; p.gear[id]=1; p.dirty=true; ev('gate',p.id,id);
  toastTo(p.id,id==='river'?'Far to the west a rock fall slides down into the river canyon and the way clears: the river road toward the Sunscar is open for you.':id==='redgate'?'In the west the rock fall that choked Redgate Canyon shudders and slides away: the Redgate Road to the Sunscar is open for you.':'Far to the west the stone choking the neck pass crumbles and falls away: the pass toward the Stormhorn is open for you.','good'); }
// the Sunscar: either rock fall (the River Pass, Redgate Canyon) lets you in; walking into Glasswell attunes its circle (gear.sun 2)
function reachGlasswellP(p){ if(p.gear.sun>=2||(p.gear.river<1&&p.gear.redgate<1)||Math.hypot(p.x-VIL5.x,p.z-VIL5.z)>VIL5.r+14) return; p.gear.sun=2; p.dirty=true; ev('sun',p.id,2);
  toastTo(p.id,'Welcome to Glasswell! Its teleport circle is attuned to you now: the circles will take you between all five villages.','good'); }
function reachRimeholdP(p){ if(p.gear.north!==1||Math.hypot(p.x-VIL3.x,p.z-VIL3.z)>VIL3.r+14) return; p.gear.north=2; p.dirty=true; ev('north',p.id,2); mqActP(p,'rimehold');
  toastTo(p.id,'Welcome to Rimehold! Its teleport circle is attuned to you now: the circles will take you between all three villages.','good'); }
// where you wake after being knocked out: the village of the land you are in, once you have been there
const respawnVil=p=>inVale(p.x,p.z)?(inHoar(p.x,p.z)?(p.gear.north>=2?VIL3:p.gear.east>=2?VIL2:VIL):(p.gear.east>=2?VIL2:VIL)):(inGrey(p.x,p.z)?(p.gear.west>=2?VIL4:p.gear.north>=2?VIL3:p.gear.east>=2?VIL2:VIL):(inSun(p.x,p.z)&&p.gear.sun>=2?VIL5:VIL));
function gainExpP(p,v,monId){
  if(!(v>0)) return;
  p.exp+=v; ev('xp',p.id,r1(v),monId==null?null:monId);
  let up=false; const was=p.level;
  const cap=isGuestP(p)?GUEST_MAX_LV:PLAYER_MAX_LV;   // accounts: a guest stops at level 10
  while(p.level<cap && p.exp>=expToNext(p.level)){ p.exp-=expToNext(p.level); p.level++; up=true; }
  if(up){ recalcP(p); p.hp=p.maxHp; ev('lvup',p.id,p.level); refreshOffersP(p); if(was<SKILL_SLOT_LV&&p.level>=SKILL_SLOT_LV) unlockSkillsP(p,'skill'); if(was<BURST_SLOT_LV&&p.level>=BURST_SLOT_LV) unlockSkillsP(p,'burst'); if(passiveOpen(p.level)>passiveOpen(was)) unlockPassivesP(p,was); }
  if(p.level>=cap&&cap<PLAYER_MAX_LV&&p.exp>=expToNext(p.level)-1){ p.exp=Math.max(0,expToNext(p.level)-1); guestGateP(p,'level'); }   // accounts: no XP past the cap, the popup asks them to register
  p.dirty=true;
}
// the attacker's damage at your zone tier (its tiered level's damage), +5% per level the attacker is above you, then your armor (soft-capped, defRed), the Iron Will passive, a buff and a guard potion;
// together they can never take off more than 90% (DMG_TAKEN_MIN)
function hurtP(p,v,m,by){   // returns the damage taken; by: the fighter who hit (pvp, no monster)
  if(p.dead) return 0;
  const K=m?monK(m,p):null, ld=m?Math.max(0,K.lv-p.level):0;
  if(m&&!p.pv&&!m.pl&&rlResists(rlP(p,'res'),m.T.acc)) v=Math.max(1,Math.round(v/2));   // rolls: a resisted hit does half (the monster's accuracy against your resistance)
  v=Math.max(1,Math.round(v*(K?K.dmg:1)*rxWeakK(m)*(1+0.05*ld)*Math.max(DMG_TAKEN_MIN,(1-p.red)*(1-psP(p,'red')-ssCondP(p,'red',m))*(1-(p.buff?p.buff.red||0:0))*(1-potBuffP(p,'guard'))*(1-allyP(p,'guard')))));   // reactions: weak lowers what a monster deals
  if(p.shield&&p.shield.until>S.t&&p.shield.v>0){ const a=Math.min(v,p.shield.v); p.shield.v-=a; v-=a; if(p.shield.v<=0&&!p.shield.done){ p.shield.done=true; ssShieldBreakS(p); } if(v<=0){ p.lastHit=S.t; return 0; } }   // skillsets: a shield soaks the hit first
  p.hp-=v; p.lastHit=S.t; ev('hurt',p.id,v);
  if(p.hp<=0){
    p.hp=0; p.dead=true; p.deadT=0; p.act=null; ev('down',p.id);
    for(const mm of MONS) if(mm.tgt===p.id){ mm.aggro=false; mm.tgt=null; mm.state='return'; mm.pendingHit=-1; }
    if(p.pv) pvpDownS(p,by);   // pvp: knocked out on the island
  }
  if(m&&p.ss) ssHurtS(p,m,v);   // skillsets: reflect, on hurt and on low rows
  return v;
}
// a slot opens (skill at level 3, burst at level 10): every class gets that slot's free ability equipped
function autoEquipP(p,slot){
  if(p.level<slotLv(slot)) return;
  for(const c in DEFAULT_OF){ const id=DEFAULT_OF[c][slot]; if(id&&!p.gear.skills.eq[c][slot]){ if(!p.gear.skills.owned.includes(id)) p.gear.skills.owned.push(id); p.gear.skills.eq[c][slot]=id; } }
  p.dirty=true;
}
function unlockSkillsP(p,slot){
  autoEquipP(p,slot);
  const s=SKILLS[p.gear.skills.eq[clsOfP(p)][slot]];
  toastTo(p.id,(slot==='burst'?'Burst slot unlocked! ':'Skill slot unlocked! ')+(s?s.name:'Your new ability')+' is ready ('+(slot==='burst'?'R':'Q')+'). Aldric, the trainer at the well, teaches more.','good');
  ev('skillslot',p.id,slot);
}
// level 13 (PASSIVE_LV): the passives open, with Vitality (free) in the first slot
function autoEquipPassiveP(p){
  const S=p.gear.skills; if(S.pgiven||p.level<PASSIVE_LV) return false;
  S.pgiven=true; if(!S.owned.includes('vitality')) S.owned.push('vitality');
  const i=S.pass.slice(0,passiveOpen(p.level)).indexOf(null); if(i>=0&&!S.pass.includes('vitality')) S.pass[i]='vitality';
  p.dirty=true; return true;
}
// a level crossed one or more passive slot levels (13 / 16 / 20): tell the player about each new slot
function unlockPassivesP(p,was){
  if(autoEquipPassiveP(p)){ recalcP(p); toastTo(p.id,'Passive skills unlocked! Vitality is in your first passive slot. Aldric and Master Ryu teach more.','good'); ev('skillslot',p.id,'passive'); }
  PASSIVE_SLOT_LV.forEach((lv,i)=>{ if(i>0&&was<lv&&p.level>=lv){ toastTo(p.id,'Passive slot '+(i+1)+' unlocked! Drag a passive onto it in the skills panel (K).','good'); ev('skillslot',p.id,'passive'); } });
}
function healP(p,v){ if(!p.dead&&v>0) p.hp=Math.min(p.maxHp,p.hp+v); }
function updatePlayersS(dt){
  for(const p of S.players.values()){
    S.ctx=p.inst|0;   // dungeons: what a player's tick causes belongs to his run
    for(const k in p.cd) p.cd[k]=Math.max(0,p.cd[k]-dt);
    ssTickS(p); ssRegenS(p,dt);   // skillsets: tick rows while in a fight; a regen buff
    if(p.buff&&S.t>=p.buff.until){ p.buff=null; }
    if(p.buff&&p.buff.regen&&!p.dead) healP(p,p.maxHp*p.buff.regen*dt);
    if(p.dead&&p.inst){ dgDownTickS(p,dt); continue; }   // dungeons: downed in a run: revived, or a respawn at its entrance, never the village
    if(p.dead){
      p.deadT+=dt;
      if(p.deadT>3&&p.pv){ pvpReviveP(p); continue; }   // pvp: a knock-out on the island wakes on the lake's shore, not in a village
      if(p.deadT>3){ const g=respawnVil(p).anchors.gate; p.x=g.x; p.z=g.z; p.y=getH(g.x,g.z); p.dead=false; p.hp=p.maxHp; p.lastHit=-99; sendTo(p.id,{t:'tp',x:g.x,z:g.z,face:g.face}); ev('up',p.id); p.dirty=true; }
      continue;
    }
    if(S.t-p.lastHit>(p.pv?PVP_REGEN_AFTER:3) && p.hp<p.maxHp) p.hp=Math.min(p.maxHp,p.hp+p.maxHp*(p.pv?PVP_REGEN_K:0.08)*dt);   // pvp: slower on the island
    pvpTickP(p,dt);   // pvp: stepping onto / off the island, burning
    if(p.act){ const a=p.act; a.t+=dt; if(!a.done && a.t>=a.dur*a.hitAt){ a.done=true; resolveHitS(p,a); } if(a.t>=a.dur) p.act=null; }
    p.travelT-=dt; if(p.travelT<=0){ p.travelT=0.5; questTravelP(p); reachHanamiP(p); reachRimeholdP(p); reachHighmarkP(p); reachGlasswellP(p); mqTickP(p); }
  }
}
