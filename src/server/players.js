//@ Players on the server: records, stats, XP and levels, damage taken, knock-out and respawn, private state ("you")
/* Stats: health = 20 x f(level) + armor health; damage = 3 x f(level) + weapon attack; defense cuts damage by def/(def+60).
   Each player's save (level, XP, gear, coins, quests) lives in their own browser and is sent on join;
   the server sends back a "you" message whenever it changes so the client can store it again. */
function sanitizeGear(g,cls){
  const base=newGearFor(cls);
  if(!g||typeof g!=='object') return base;
  const out={inv:Array.isArray(g.inv)?g.inv.filter(id=>ITEM[id]).slice(0,BAG_MAX):base.inv,eq:Object.assign({},base.eq),coins:Math.max(0,Math.floor(+g.coins||0)),q:null,startAll:!!g.startAll,bought:{}};
  if(g.eq) for(const k in out.eq){ const id=g.eq[k]; if(id&&ITEM[id]&&out.inv.includes(id)) out.eq[k]=id; else if(k!=='weapon') out.eq[k]=null; }
  if(!ITEM[out.eq.weapon]) out.eq.weapon=base.eq.weapon;
  if(!out.inv.includes(out.eq.weapon)) out.inv.push(out.eq.weapon);
  if(g.bought&&typeof g.bought==='object') for(const id in g.bought) if(ITEM[id]&&ITEM[id].rar===0) out.bought[id]=clampInt(g.bought[id],0,999,0);
  out.q=sanitizeQuests(g.q);
  out.skills=newSkills();
  if(g.skills&&typeof g.skills==='object'){
    if(Array.isArray(g.skills.owned)) for(const id of g.skills.owned) if(SKILLS[id]&&!out.skills.owned.includes(id)) out.skills.owned.push(id);
    if(g.skills.eq) for(const c in out.skills.eq){ const id=g.skills.eq[c]; if(SKILLS[id]&&SKILLS[id].cls===c&&out.skills.owned.includes(id)) out.skills.eq[c]=id; }
  }
  return out;
}
// quests travel in the player's own save, so check every field and recompute the rewards here
function sanitizeQuest(q){
  if(!q||typeof q!=='object'||!/^g\d{1,9}$/.test(q.id)) return null;
  const L=clampInt(q.level,1,15,0); if(!L) return null;
  const str=(v,n)=>String(v||'').slice(0,n);
  const o={id:q.id,kind:q.kind,type:q.type,level:L,title:str(q.title,80),text:str(q.text,300)};
  if(q.kind==='boss'){ Object.assign(o,{type:'kill',target:'boss',count:1,level:15}); }
  else if(q.kind==='hunt'||q.kind==='bounty'){ const d=MON_DEFS.find(m=>m.id===q.target&&m.level===L); if(!d) return null; Object.assign(o,{type:'kill',target:d.id,count:clampInt(q.count,1,20,5)}); }
  else if(q.kind==='scout'){ if(!q.at||!isFinite(q.at.x)||!isFinite(q.at.z)) return null; Object.assign(o,{type:'visit',at:{x:clamp(+q.at.x,-HALF,HALF),z:clamp(+q.at.z,-HALF,HALF)},r:18,place:str(q.place,40)}); }
  else return null;
  o.reward=questRewardFor(o); return o;
}
function sanitizeQuests(q){
  const out={offers:[],active:{},defs:{},ready:[],done:0,next:1};
  if(!q||typeof q!=='object') return out;
  out.next=clampInt(q.next,1,1e9,1); out.done=typeof q.done==='number'?clampInt(q.done,0,1e9,0):0;
  if(Array.isArray(q.offers)) out.offers=q.offers.map(sanitizeQuest).filter(Boolean).slice(0,QUEST_OFFERS);
  if(q.defs&&q.active) for(const id in q.active){ const d=sanitizeQuest(q.defs[id]); if(d&&Object.keys(out.active).length<QUEST_MAX_ACTIVE){ out.defs[id]=d; out.active[id]=clampInt(q.active[id],0,d.count||1,0); } }
  if(Array.isArray(q.ready)) out.ready=q.ready.filter(id=>id in out.active);
  for(const x of [...out.offers,...Object.values(out.defs)]){ const n=parseInt(x.id.slice(1),10); if(n>=out.next) out.next=n+1; }
  return out;
}
function newPlayer(pid,hello){
  hello=hello||{}; const save=hello.save||{}, look=(hello.look&&typeof hello.look==='object')?hello.look:{};
  const sp=VIL.spawn;
  const p={id:pid,name:String(hello.name||'Hiker').slice(0,20),look,x:sp.x,y:getH(sp.x,sp.z),z:sp.z,face:0,vx:0,vz:0,
    level:clampInt(save.level,1,50,1),exp:Math.max(0,+save.exp||0),gear:sanitizeGear(save.gear,look.cls),
    hp:1,maxHp:1,dmg:1,def:0,red:0,lastHit:-99,dead:false,deadT:0,cd:{basic:0,skill:0},act:null,dirty:true,travelT:0};
  if(p.gear.startAll) giveAllP(p);
  if(!(hello.save&&hello.save.gear&&hello.save.gear.skills)&&p.level>=SKILL_SLOT_LV) unlockSkillsP(p,true);   // players from before skills keep theirs
  recalcP(p); p.hp=p.maxHp; fillOffersP(p); return p;
}
function recalcP(p){
  const g=gearStatsOf(p.gear), ratio=p.maxHp>1?p.hp/p.maxHp:1;
  p.maxHp=Math.round(20*fLv(p.level)+g.hp); p.dmg=3*fLv(p.level)+g.atk; p.def=g.def; p.red=defRed(g.def);
  p.hp=p.dead?0:Math.max(1,Math.min(p.maxHp,Math.round(p.maxHp*ratio)));
}
const clsOfP=p=>classOfGear(p.gear);
function youMsg(p){ return {t:'you',level:p.level,exp:p.exp,maxHp:p.maxHp,hp:p.hp,dmg:p.dmg,def:p.def,red:p.red,dead:p.dead,gear:p.gear}; }
function pubInfo(p){ return {id:p.id,name:p.name,look:p.look,eq:p.gear.eq,level:p.level}; }
function inVillage(p){ return vDist(p.x,p.z)<VIL.r+12; }
function gainExpP(p,v,monId){
  if(!(v>0)) return;
  p.exp+=v; ev('xp',p.id,r1(v),monId==null?null:monId);
  let up=false; const was=p.level;
  while(p.level<50 && p.exp>=expToNext(p.level)){ p.exp-=expToNext(p.level); p.level++; up=true; }
  if(up){ recalcP(p); p.hp=p.maxHp; ev('lvup',p.id,p.level); refreshOffersP(p); if(was<SKILL_SLOT_LV&&p.level>=SKILL_SLOT_LV) unlockSkillsP(p); if(was<BURST_SLOT_LV&&p.level>=BURST_SLOT_LV) toastTo(p.id,'Level '+BURST_SLOT_LV+': your burst slot is open. Burst skills are coming soon!','good'); }
  p.dirty=true;
}
// +5% damage taken per level the attacker is above you, then your armor
function hurtP(p,v,m){
  if(p.dead) return;
  const ld=m?Math.max(0,m.T.level-p.level):0;
  v=Math.max(1,Math.round(v*(1+0.05*ld)*(1-p.red)));
  p.hp-=v; p.lastHit=S.t; ev('hurt',p.id,v);
  if(p.hp<=0){
    p.hp=0; p.dead=true; p.deadT=0; p.act=null; ev('down',p.id);
    for(const mm of MONS) if(mm.tgt===p.id){ mm.aggro=false; mm.tgt=null; mm.state='return'; mm.pendingHit=-1; }
  }
}
// level 3: the skill slot opens and every class gets its free skill equipped
function unlockSkillsP(p,quiet){
  for(const c in FREE_SKILL) if(!p.gear.skills.eq[c]) p.gear.skills.eq[c]=FREE_SKILL[c];
  p.dirty=true;
  if(!quiet){ const s=SKILLS[p.gear.skills.eq[clsOfP(p)]]; toastTo(p.id,'Skill slot unlocked! '+(s?s.name:'Your skill')+' is ready. Aldric, the trainer at the well, teaches more.','good'); ev('skillslot',p.id); }
}
function updatePlayersS(dt){
  for(const p of S.players.values()){
    p.cd.basic=Math.max(0,p.cd.basic-dt); p.cd.skill=Math.max(0,p.cd.skill-dt);
    if(p.dead){
      p.deadT+=dt;
      if(p.deadT>3){ const g=VIL.anchors.gate; p.x=g.x; p.z=g.z; p.y=getH(g.x,g.z); p.dead=false; p.hp=p.maxHp; p.lastHit=-99; sendTo(p.id,{t:'tp',x:g.x,z:g.z,face:g.face}); ev('up',p.id); p.dirty=true; }
      continue;
    }
    if(S.t-p.lastHit>3 && p.hp<p.maxHp) p.hp=Math.min(p.maxHp,p.hp+p.maxHp*0.08*dt);
    if(p.act){ const a=p.act; a.t+=dt; if(!a.done && a.t>=a.dur*a.hitAt){ a.done=true; resolveHitS(p,a); } if(a.t>=a.dur) p.act=null; }
    p.travelT-=dt; if(p.travelT<=0){ p.travelT=0.5; questTravelP(p); }
  }
}
