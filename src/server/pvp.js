//@ PvP on the Proving Isle, server side: who is on the island, the fixed numbers they fight with, other players as targets of every attack, the knock-out (a shore spot and a shut gate), no rewards
/* agent map
   What: on the island (inPvp, shared/pvp.js) every player has the same level, gear and loadout (p.pv = {sk: the fixed skills object, pre: health share before they came}); all can hit all, except their
   own party (server/party.js); nothing is won or lost (no XP, coins, drops, quest or main-quest credit); a knock-out wakes you on the lake's mainland shore with the gate shut for PVP.lockS seconds.
   Design and numbers: docs/PVP.md. Test: tools/pvp-smoke.js.
   How a hit lands: combat.js loops over foesS(p) instead of MONS: for a fighter on the island that is every other living fighter there, each as a proxy (pvpFoeOf) that looks like a monster to
   those loops (x, z, dead, T.rad, T.height ...) and carries .pl, the player. damageMonsterS / statusS see .pl first and call pvpHitS / pvpStatusS here; the target takes the hit through hurtP (their own armour,
   passives and buffs), the damage number is the existing 'hurt' event. A stun / slow set on a proxy (m.stunT=2) becomes a pfx root / slow on that player (the client applies it to itself).
   Events (ev): pvp [pid, 1 stepped onto the island | 0 left it]  pvlock [pid, seconds the gate is shut]   (the client: game/pvp/state.js). A knock-out is the usual down / up.
   Exports: foesS(p), foeByIdS(p,id), pvpFoeOf(q), pvpHitS, pvpStatusS, pvpTickP(p,dt) (updatePlayersS), pvpDownS(q,by) (hurtP), pvpReviveP(p), skOfP(p), pvLvP(p).
   Hooks into other files are marked `// pvp:` (grep -rn "// pvp:" src). */
const PVP_REGEN_AFTER=6, PVP_REGEN_K=0.04, PVP_STUN_IMM=4, PVP_KB_MAX=8;   // on the island: health comes back 4% a second after 6 s without being hit (3 s and 8% outside); a root cannot be renewed for 4 s after it ends; a shove is at most this many m/s
// the skills object a fighter's attacks and passives are read from (the fixed loadout on the island, their own save elsewhere) and the level the passives are read at
const skOfP=p=>p.pv?p.pv.sk:p.gear.skills;
const pvLvP=p=>p.pv?PVP.level:p.level;
// a fighter as a target: the fields combat.js reads of a monster, read live from the player
function pvpFoeOf(q){
  return q.px||(q.px={pl:q,id:q.id,T:{rad:0.5,height:1.8,heavy:false,get el(){ return soulOfP(q); }},s:1,boss:false,model:'',inst:0,remove:false,
    get x(){ return q.x; }, get z(){ return q.z; }, get dead(){ return q.dead; },
    get stunT(){ return 0; }, set stunT(v){ pvpCcP(q,'root',v); },
    get slowT(){ return 0; }, set slowT(v){ pvpCcP(q,'slow',v); }});
}
const pvpFriendP=(p,q)=>{ const pa=partyOf(p); return !!pa&&q.party===pa.id; };
// who a fighter can hit: everyone else on the island, alive, not in their party. Off the island: the world's monsters, as before.
function foesS(p){
  if(!p||!p.pv) return MONS;
  const out=[]; for(const q of S.players.values()) if(q!==p&&q.pv&&!q.dead&&!pvpFriendP(p,q)) out.push(pvpFoeOf(q));
  return out;
}
// a target by the id an attack names (a monster's number, or a fighter's pid)
function foeByIdS(p,id){ const m=MON_BY_ID.get(id); if(m||!p||!p.pv||typeof id!=='string') return m; const q=S.players.get(id); return q&&q.pv&&!q.dead&&q!==p&&!pvpFriendP(p,q)?pvpFoeOf(q):undefined; }
function pvpCcP(q,kind,dur){
  if(!q.pv||q.dead||!(dur>0)) return;
  if(kind==='root'){ if(S.t<(q.pvImm||0)) return; q.pvImm=S.t+dur+PVP_STUN_IMM; }
  pfxS(q,kind,Math.min(dur,4),0,0);
}
// p hits the fighter behind proxy m: the damage roll is p's (fixed stats, no potion; the elements count, see elemHitS), the rest is the target's (hurtP); returns the damage dealt
function pvpHitS(m,mult,p,fromX,fromZ,kb,el){
  const q=m.pl; if(!q.pv||q.dead||q===p||!p.pv||p.dead||pvpFriendP(p,q)) return 0;
  const d=rollDmgS(p,mult,m,el);   // (the element maths: p's soul and the skill's element against the target's soul, at PVP.elemBoost)
  p.lastDealt=S.t;
  const v=hurtP(q,d.v,null,p);
  if(p.buff&&p.buff.steal) healP(p,v*p.buff.steal);
  const k=Math.max(-PVP_KB_MAX,Math.min(PVP_KB_MAX,kb===0?0:(kb||3)));
  if(k&&!q.dead){ const ex=q.x-fromX, ez=q.z-fromZ, e=Math.hypot(ex,ez)||1; pfxS(q,'push',0.5,ex/e*k,ez/e*k); }
  return v;
}
// what a hit does besides damage (an fx entry's stun / slow / burn); marks, reactions and taunts are skill-set and monster business and do not exist on the island
function pvpStatusS(m,s,p,el,mult){
  const q=m.pl; if(!q.pv||q.dead) return;
  if(s.stun) pvpCcP(q,'root',s.stun);
  if(s.slow) pvpCcP(q,'slow',s.slow);
  if(s.burn) q.pvBurn={t:s.burn.dur,mult:mult*s.burn.k,by:p.id,tick:1};
}
function pvpBurnP(q,dt){
  const b=q.pvBurn; if(!b) return;
  const o=S.players.get(b.by); if(!o||!o.pv||q.dead||!q.pv||pvpFriendP(o,q)){ q.pvBurn=null; return; }
  b.t-=dt; b.tick-=dt;
  if(b.tick<=0){ b.tick+=1; pvpHitS(pvpFoeOf(q),b.mult,o,q.x,q.z,0); }
  if(b.t<=0) q.pvBurn=null;
}
// ---- coming and going ----
function pvpEnterP(p){
  p.pv={sk:pvpSkillsOf(p.gear.skills,p.level),pre:p.maxHp>0?p.hp/p.maxHp:1};
  p.buff=null; p.act=null; p.cd.basic=p.cd.skill=p.cd.burst=0; p.pvBurn=null;
  recalcP(p); p.hp=p.maxHp; p.dirty=true;
  ev('pvp',p.id,1);
  toastTo(p.id,'The Proving Isle: everyone fights here with the same level, gear and skill levels. Nothing is won or lost. Party members are safe from you.','good');
}
function pvpLeaveP(p){
  const pre=p.pv?p.pv.pre:1; p.pv=null; p.pvBurn=null; p.buff=null; p.act=null;
  recalcP(p); if(!p.dead) p.hp=Math.max(1,Math.round(p.maxHp*pre)); p.dirty=true;
  ev('pvp',p.id,0);
}
// the gate is shut: a fighter inside the circle is put back on the planks
function pvpPushOutP(p){
  const g=PVP.gateOut; p.x=g.x; p.z=g.z; p.y=getH(g.x,g.z); sendTo(p.id,{t:'tp',x:g.x,z:g.z,face:g.face+Math.PI});   // (face away from the island: the way they came)
  toastTo(p.id,'The gate is shut for '+Math.ceil(p.pvLock-S.t)+' more seconds.','bad');
}
function pvpTickP(p,dt){
  if(p.pvBurn) pvpBurnP(p,dt);
  if(p.inst||!PVP.gate) return;
  if(p.pv){ if(!p.dead&&!inPvp(p.x,p.z)) pvpLeaveP(p); return; }   // (a dead one stays "on the island" until they wake)
  if(!p.dead&&inPvp(p.x,p.z)){ if(S.t<(p.pvLock||0)) pvpPushOutP(p); else pvpEnterP(p); }
}
// a knock-out on the island: the usual 'down', a word to both, and nothing else (no XP, coins, drops or credit)
function pvpDownS(q,by){
  q.pvBurn=null;
  if(by&&by!==q){ toastTo(by.id,'You knocked out '+q.name+'.','good'); toastTo(q.id,by.name+' knocked you out. You wake on the shore; the gate opens in '+PVP.lockS+' s.',''); }
  else toastTo(q.id,'You were knocked out. You wake on the shore; the gate opens in '+PVP.lockS+' s.','');
}
// the wake-up after a knock-out: a random spot on the lake's mainland shore, the gate shut for PVP.lockS seconds
function pvpReviveP(p){
  const s=pvpShoreSpot(Math.random());
  pvpLeaveP(p);
  p.x=s.x; p.z=s.z; p.y=getH(s.x,s.z); p.dead=false; p.hp=p.maxHp; p.lastHit=-99; p.pvLock=S.t+PVP.lockS;
  sendTo(p.id,{t:'tp',x:s.x,z:s.z,face:s.face}); ev('up',p.id); ev('pvlock',p.id,PVP.lockS); p.dirty=true;
}
// the fixed numbers: the level, the common gear of its tier for the class in hand, the fixed passives; health x PVP.hpK so a fight lasts a while. Nothing here looks at the player's own level, gear, pendant or potions (the soul still counts, as an element: elemHitS).
function pvpRecalcP(p){
  const g=pvpStatsOf(clsOfP(p)), ratio=p.maxHp>1?p.hp/p.maxHp:1;
  p.maxHp=Math.round((20*fLv(PVP.level)+g.hp)*(1+psP(p,'hp'))*PVP.hpK); p.dmg=3*fLv(PVP.level)+g.atk; p.def=g.def; p.red=defRed(g.def);
  p.hp=p.dead?0:Math.max(1,Math.min(p.maxHp,Math.round(p.maxHp*ratio)));
  p.ss={n:{},bonus:[],trig:{},amp:[],cond:[]};   // (no skill-set bonuses, triggers or marks on the island)
}
