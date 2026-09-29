//@ The main quest on the client: what quest villagers say (mqTalk), the marks over them, the main quest at the top of the quest log, its marker on the maps, where Odran is, heartleaf to pick
/* The server owns the progress (gear.mq, server/main-quest.js); this file only reads GEAR.mq. The talk lines come from the same
   shared mqTalk the server applies, so what a villager says always matches what happens. */
const mqG=()=>(GEAR&&GEAR.mq)||null;
const mqCur=()=>{ const M=mqG(); return M?MQ[M.s]||null:null; };
// Odran's cart stands by the village gate from W8 (when he arrives) until V8 (he moves to Hanami's gate)
function odranHere(vil){ const M=mqG(); if(!M) return false; return vil===1?M.s>=MQ_BY_ID.W8.i&&M.s<MQ_BY_ID.V8.i:M.s>=MQ_BY_ID.V8.i; }
// what a quest villager has to say about the main quest right now (null: nothing, their usual lines)
function mqLinesFor(n){ const M=mqG(); if(!M||!MQ_NPC_VIL[n.def.id]) return null; const T=mqTalk(M,n.def.id,PL.level,mqNight(dayClock)); return T.lines.length?T:null; }
// the mark over a villager: ! a step to take (or a part to do with them), ? a step to hand in
function mqMark(id){
  const M=mqG(), s=mqCur(); if(!s) return '';
  if(M.st===0) return s.from===id&&PL.level>=s.gate?'!':'';
  if(M.st===2) return s.to===id?'?':'';
  return s.parts.some((pt,i)=>pt.talk===id&&mqOpen(s,M.n,i))?'!':'';
}
function mqPicking(){ const M=mqG(), s=mqCur(); return !!(s&&M.st===1&&s.parts.some((pt,i)=>pt.pick&&mqOpen(s,M.n,i))); }
function nearHerb(){ if(!mqPicking()) return -1; const M=mqG(); for(let i=0;i<HERBS.length;i++) if(!((M.h>>i)&1)&&Math.hypot(P.x-HERBS[i][0],P.z-HERBS[i][1])<HERB_R) return i; return -1; }
// where a villager stands (their live position if they are drawn, else their anchor)
function npcSpot(id){ const n=npcById(id); if(n) return {x:n.x,z:n.z,name:n.def.name}; return null; }
const MQ_ACT_AT={buy:'ilse',board:'maren',upskill:'aldric',merge:'greta',soul:'kaede'};
const MQ_GREY_C={};
function mqPartTarget(s,pt){
  if(pt.talk) return npcSpot(pt.talk);
  if(pt.kill||pt.collect){ const d=MON_DEFS.find(m=>m.id===(pt.kill||pt.from[0])), zn=d&&defZone(d); if(!zn) return null; const [x,z]=zonePoint(zn,0,0.5); return {x,z,name:zn.name}; }
  if(pt.grey){ const g=MQ_GREY_C[pt.zone]||(MQ_GREY_C[pt.zone]=mqGreySpot(pt.zone)); return {x:g[0],z:g[1],name:ZONES.find(z=>z.key===pt.zone).name}; }
  if(pt.pick){ const M=mqG(); let best=null,bd=1e9; HERBS.forEach(([x,z],i)=>{ const d=Math.hypot(x-P.x,z-P.z); if(!((M.h>>i)&1)&&d<bd){ bd=d; best={x,z,name:'Heartleaf'}; } }); return best; }
  if(pt.read){ const L=LORE_BY_ID[pt.read]; return {x:L.x,z:L.z,name:L.name}; }
  if(pt.boss){ const bd=BOSS_DEFS.find(b=>b.def.id===pt.boss), A=ARENAS.find(a=>a.key===bd.arena); return {x:A.x,z:A.z,name:A.name}; }
  if(pt.act==='sell'){ const V=MQ_NPC_VIL[s.from]===2?VIL2:VIL; return {x:V.cart.x,z:V.cart.z,name:'Odran\'s cart'}; }
  if(pt.act==='warp') return inVale(P.x)?{x:VIL2.tele.x,z:VIL2.tele.z,name:'the teleport circle'}:null;
  if(pt.act==='hanami') return inVale(P.x)?{x:VIL2.anchors.gate.x,z:VIL2.anchors.gate.z,name:'Hanami'}:{x:TUN.x0,z:TUN.z,name:'the tunnel'};
  return MQ_ACT_AT[pt.act]?npcSpot(MQ_ACT_AT[pt.act]):null;
}
// the main quest's marker for the maps: the giver, the first open part that has a place, or whom to hand in to
function mqTarget(){
  const M=mqG(), s=mqCur(); if(!s) return null;
  if(M.st===0) return s.from&&PL.level>=s.gate?npcSpot(s.from):null;
  if(M.st===2) return npcSpot(s.to);
  for(let i=0;i<s.parts.length;i++) if(mqOpen(s,M.n,i)){ const T=mqPartTarget(s,s.parts[i]); if(T) return T; }
  return null;
}
// the main quest's line at the top of the quest log (text only: every string here comes from shared data, never from a player)
function mqLogRow(){
  const M=mqG(); if(!M) return '';
  const s=mqCur(); if(!s) return `<div class="ql mq"><b>The main quest</b><span>${MQ_END}</span></div>`;
  let what;
  if(M.st===0) what=PL.level<s.gate?'From level '+s.gate+': '+MQ_NAMES[s.from]+'. Until then, hunt and take notices from the quest board':'Talk to '+MQ_NAMES[s.from];
  else what=mqObjective(s,M.n);
  const T=mqTarget(), where=T&&!(M.st===0&&PL.level<s.gate)?(Math.hypot(T.x-P.x,T.z-P.z)<12?'':' &middot; '+Math.round(Math.hypot(T.x-P.x,T.z-P.z))+' m '+dirWord(T.x-P.x,T.z-P.z)):'';
  return `<div class="ql mq${M.st===2?' ok':''}"><b>${s.title}</b><span>${what}${where}</span></div>`;
}
// Wren sits up when a step wants them awake (handing in to Wren, and the goodbye before the tunnel); otherwise they sleep
function wrenAwake(){ const M=mqG(), s=mqCur(); if(!s) return !!M; return (M.st===2&&s.to==='wren')||(s.id==='W18'&&M.st===1&&mqOpen(s,M.n,0)); }
