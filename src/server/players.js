//@ Players on the server: records, stats, XP and levels, damage taken, knock-out and respawn, private state ("you")
/* Stats: health = 20 x f(level) + armor health; damage = 3 x f(level) + weapon attack; defense cuts damage by def/(def+60).
   Each player's save (level, XP, gear, coins, quests) lives in their own browser and is sent on join;
   the server sends back a "you" message whenever it changes so the client can store it again. */
function sanitizeGear(g,cls){
  const base=newGearFor(cls);
  if(!g||typeof g!=='object') return base;
  const out={inv:Array.isArray(g.inv)?g.inv.filter(id=>ITEM[id]).slice(0,BAG_MAX):base.inv,eq:Object.assign({},base.eq),coins:Math.max(0,Math.floor(+g.coins||0)),q:null,startAll:!!g.startAll,bought:{},east:clampInt(g.east,0,2,0),soul:ELEMS[g.soul]?g.soul:'basic',mats:{}};
  if(g.mats&&typeof g.mats==='object') for(const id in g.mats){ const n=MATS[id]?clampInt(g.mats[id],0,MAT_MAX,0):0; if(n) out.mats[id]=n; }
  if(g.eq) for(const k in out.eq){ const id=g.eq[k]; if(id&&ITEM[id]&&out.inv.includes(id)) out.eq[k]=id; else if(k!=='weapon') out.eq[k]=null; }
  if(!ITEM[out.eq.weapon]) out.eq.weapon=base.eq.weapon;
  if(!out.inv.includes(out.eq.weapon)) out.inv.push(out.eq.weapon);
  if(g.bought&&typeof g.bought==='object') for(const id in g.bought) if(ITEM[id]&&ITEM[id].rar===0) out.bought[id]=clampInt(g.bought[id],0,999,0);
  out.q=sanitizeQuests(g.q);
  out.skills=sanitizeSkills(g.skills);
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
  if(Array.isArray(q.ready)) out.ready=q.ready.filter(id=>id in out.active);
  for(const x of [...out.offers,...Object.values(out.defs)]){ const n=parseInt(x.id.slice(1),10); if(n>=out.next) out.next=n+1; }
  return out;
}
// player names: printable characters only, single spaces, 1-16 characters
function cleanName(s){ return String(s||'').replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,16)||'Hiker'; }
// loadouts: {owned:[ids: skills and passives], eq:{cls:{basic,skill,burst}}, lv:{id:level}, pass:[passive ids], pgiven, v}; older saves had eq:{cls:'skillId'}
function sanitizeSkills(g){
  const out=newSkills(); out.v=2;
  if(!g||typeof g!=='object') return out;
  if(Array.isArray(g.owned)) for(const id of g.owned) if(skillDef(id)&&!out.owned.includes(id)) out.owned.push(id);
  if(g.eq) for(const c in out.eq){
    const e=g.eq[c], slots=typeof e==='string'?{skill:e}:(e&&typeof e==='object'?e:{});
    for(const sl of SLOTS){ const id=slots[sl]; if(SKILLS[id]&&SKILLS[id].cls===c&&SKILLS[id].slot===sl&&out.owned.includes(id)&&canSwap(c,sl)) out.eq[c][sl]=id; }
  }
  if(g.lv&&typeof g.lv==='object') for(const id in g.lv){ const L=out.owned.includes(id)&&!(skillDef(id)&&skillDef(id).drop)?clampInt(g.lv[id],1,SKILL_MAX_LV,1):1; if(L>1) out.lv[id]=L; }   // (boss skills cannot be upgraded yet)
  // only the open passive slots can be used for now: what a save had in a locked slot moves up into the open ones (the rest goes back to the bag)
  if(Array.isArray(g.pass)) [...new Set(g.pass.slice(0,PASSIVE_SLOTS).filter(id=>PASSIVES[id]&&out.owned.includes(id)))].slice(0,PASSIVE_OPEN).forEach((id,i)=>{ out.pass[i]=id; });
  out.pgiven=!!g.pgiven;   // the free passive was handed out once (so taking it off does not bring it back)
  out.v=g.v===2?2:1;   // 1 = from before burst skills: they get their free burst on join
  return out;
}
function newPlayer(pid,hello){
  hello=hello||{}; const save=hello.save||{}, look=(hello.look&&typeof hello.look==='object')?hello.look:{};
  const sp=VIL.spawn;
  const p={id:pid,name:cleanName(hello.name),look,x:sp.x,y:getH(sp.x,sp.z),z:sp.z,face:0,vx:0,vz:0,
    level:clampInt(save.level,1,50,1),exp:Math.max(0,+save.exp||0),gear:sanitizeGear(save.gear,look.cls),
    hp:1,maxHp:1,dmg:1,def:0,red:0,lastHit:-99,dead:false,deadT:0,cd:{basic:0,skill:0,burst:0},buff:null,act:null,dirty:true,travelT:0};
  if(p.gear.startAll) giveAllP(p);
  if(p.gear.skills.v!==2){ autoEquipP(p,'skill'); autoEquipP(p,'burst'); p.gear.skills.v=2; }   // saves from before skills / bursts get the free ones
  autoEquipPassiveP(p);   // ... and from before passives
  recalcP(p); p.hp=p.maxHp; fillOffersP(p); return p;
}
function recalcP(p){
  const g=gearStatsOf(p.gear), ratio=p.maxHp>1?p.hp/p.maxHp:1;
  p.maxHp=Math.round((20*fLv(p.level)+g.hp)*(1+psP(p,'hp'))); p.dmg=3*fLv(p.level)+g.atk; p.def=g.def; p.red=defRed(g.def);
  p.hp=p.dead?0:Math.max(1,Math.min(p.maxHp,Math.round(p.maxHp*ratio)));
}
const clsOfP=p=>classOfGear(p.gear);
const psP=(p,stat)=>passiveSum(p.gear.skills,p.level,stat);   // a passive stat (Vitality's hp, Ferocity's dmg...)
const soulOfP=p=>p.level>=SOUL_LV?p.gear.soul:'basic';
function youMsg(p){ return {t:'you',level:p.level,exp:p.exp,maxHp:p.maxHp,hp:p.hp,dmg:p.dmg,def:p.def,red:p.red,dead:p.dead,gear:p.gear}; }
function pubInfo(p){ return {id:p.id,name:p.name,look:p.look,eq:p.gear.eq,level:p.level}; }
function inVillage(p){ return vDist(p.x,p.z)<VR+12; }
// the teleport circles: standing on one in either village (once you have walked to Hanami) takes you to the other
function warpP(p){
  if(p.dead||S.t-(p.warpT||-9)<2) return;
  const from=VILS.find(V=>Math.hypot(p.x-V.tele.x,p.z-V.tele.z)<V.tele.r+1.5); if(!from) return;
  if(p.gear.east<2){ toastTo(p.id,p.gear.east<1?'The circle is cold. Whatever it answers to lies beyond the eastern mountains.':'The circle hums but will not wake. Walk to Hanami on the far side of the tunnel first.','bad'); return; }
  const to=from===VIL?VIL2:VIL, T=to.tele, a=Math.atan2(to.x-T.x,to.z-T.z), x=T.x+Math.sin(a)*3.2, z=T.z+Math.cos(a)*3.2;
  p.warpT=S.t; ev('warp',p.id,r1(p.x),r1(p.z),r1(x),r1(z));
  p.x=x; p.z=z; p.y=getH(x,z); sendTo(p.id,{t:'tp',x,z,face:Math.atan2(-(to.x-x),-(to.z-z))});
}
// the vale: its tunnel opens for everyone who helped defeat the Rootwarden; walking to Hanami attunes the circles
function openValeP(p){ if(p.gear.east>=1) return; p.gear.east=1; p.dirty=true; ev('vale',p.id,1);
  toastTo(p.id,'A deep rumble rolls in from the eastern mountains: the sealed tunnel has opened for you. The Sakura Vale lies beyond.','good'); }
function reachHanamiP(p){ if(p.gear.east!==1||Math.hypot(p.x-VIL2.x,p.z-VIL2.z)>VIL2.r+14) return; p.gear.east=2; p.dirty=true; ev('vale',p.id,2);
  toastTo(p.id,'Welcome to Hanami! The teleport circles in both villages are attuned to you now.','good'); }
function gainExpP(p,v,monId){
  if(!(v>0)) return;
  p.exp+=v; ev('xp',p.id,r1(v),monId==null?null:monId);
  let up=false; const was=p.level;
  while(p.level<50 && p.exp>=expToNext(p.level)){ p.exp-=expToNext(p.level); p.level++; up=true; }
  if(up){ recalcP(p); p.hp=p.maxHp; ev('lvup',p.id,p.level); refreshOffersP(p); if(was<SKILL_SLOT_LV&&p.level>=SKILL_SLOT_LV) unlockSkillsP(p,'skill'); if(was<BURST_SLOT_LV&&p.level>=BURST_SLOT_LV) unlockSkillsP(p,'burst'); if(was<PASSIVE_LV&&p.level>=PASSIVE_LV) unlockPassivesP(p); }
  p.dirty=true;
}
// +5% damage taken per level the attacker is above you, then your armor and the Iron Will passive
function hurtP(p,v,m){
  if(p.dead) return;
  const ld=m?Math.max(0,m.T.level-p.level):0;
  v=Math.max(1,Math.round(v*(1+0.05*ld)*(1-p.red)*(1-psP(p,'red'))*(1-(p.buff?p.buff.red||0:0))));
  p.hp-=v; p.lastHit=S.t; ev('hurt',p.id,v);
  if(p.hp<=0){
    p.hp=0; p.dead=true; p.deadT=0; p.act=null; ev('down',p.id);
    for(const mm of MONS) if(mm.tgt===p.id){ mm.aggro=false; mm.tgt=null; mm.state='return'; mm.pendingHit=-1; }
  }
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
// level 18: the passive slots open, with Vitality (free) in the first one
function autoEquipPassiveP(p){
  const S=p.gear.skills; if(S.pgiven||p.level<PASSIVE_LV) return false;
  S.pgiven=true; if(!S.owned.includes('vitality')) S.owned.push('vitality');
  const i=S.pass.slice(0,PASSIVE_OPEN).indexOf(null); if(i>=0&&!S.pass.includes('vitality')) S.pass[i]='vitality';
  p.dirty=true; return true;
}
function unlockPassivesP(p){
  if(!autoEquipPassiveP(p)) return;
  recalcP(p); toastTo(p.id,'Passive skills unlocked! Vitality is in your first passive slot. Aldric and Master Ryu teach more.','good'); ev('skillslot',p.id,'passive');
}
function healP(p,v){ if(!p.dead&&v>0) p.hp=Math.min(p.maxHp,p.hp+v); }
function updatePlayersS(dt){
  for(const p of S.players.values()){
    for(const k in p.cd) p.cd[k]=Math.max(0,p.cd[k]-dt);
    if(p.buff&&S.t>=p.buff.until){ p.buff=null; }
    if(p.buff&&p.buff.regen&&!p.dead) healP(p,p.maxHp*p.buff.regen*dt);
    if(p.dead){
      p.deadT+=dt;
      if(p.deadT>3){ const g=(p.x>HALF&&p.gear.east>=2?VIL2:VIL).anchors.gate; p.x=g.x; p.z=g.z; p.y=getH(g.x,g.z); p.dead=false; p.hp=p.maxHp; p.lastHit=-99; sendTo(p.id,{t:'tp',x:g.x,z:g.z,face:g.face}); ev('up',p.id); p.dirty=true; }
      continue;
    }
    if(S.t-p.lastHit>3 && p.hp<p.maxHp) p.hp=Math.min(p.maxHp,p.hp+p.maxHp*0.08*dt);
    if(p.act){ const a=p.act; a.t+=dt; if(!a.done && a.t>=a.dur*a.hitAt){ a.done=true; resolveHitS(p,a); } if(a.t>=a.dur) p.act=null; }
    p.travelT-=dt; if(p.travelT<=0){ p.travelT=0.5; questTravelP(p); reachHanamiP(p); }
  }
}
