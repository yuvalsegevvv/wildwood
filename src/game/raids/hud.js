//@ The raids' HUD side: where each stronghold stands (server rows), the strip near one, its door sign, the map marks and tooltips, the raid materials in the bag, the level event
/* Agent map. The server sends 'rdst' rows [index, state 0 ready / 1 engaged / 2 cleared, tier, boss slot, wards, spawners, garrison, seconds to the rebuild, boss awake] when anything changes
   and one per raid on join (net/client.js applyEvent -> rdOnState); 'rdlv' [level, ids] when the first hit locks the tier (rdOnLevel: every listed monster's numbers). RD_CL is the client's copy.
   Used by: net/client.js (events), world/generation-setup.js (buildRaids is structure.js), ui/map.js (rdMapMarks, rdPlaceName), economy/skills.js (rdMatHave), economy/inventory.js (rdMatRows),
   main/loop.js (rdFrame). Data: shared/raids.js. Test: tools/raids-smoke.js. */
const RD_CL=[];
const RD_ROMAN=['+0','I','II','III','IV','V','VI','VII'];
let rdStripT=0;
function rdOnState(row){
  if(!Array.isArray(row)||!(row[0]>=0&&row[0]<RD_ORDER.length)) return;
  { const was=RD_CL[row[0]]; if((row[1]|0)===2&&was&&was.st!==2&&rdNearest(250)===row[0]) hvEvent('raidclear'); }   // voice: audio/voices-hero.js (a stronghold you stand by falls)
  RD_CL[row[0]]={st:row[1]|0,tier:row[2]|0,slot:row[3]|0,wards:row[4]|0,sp:row[5]|0,gar:row[6]|0,left:+row[7]||0,live:!!row[8],at:t};
  rdStructRefresh(row[0]); rdStripT=0;
}
function rdOnLevel(L,ids){ if(!Array.isArray(ids)) return; for(const id of ids){ const m=MON_BY_ID.get(id); if(m) m.dgK=dgMonK(m.def,L|0); } }
const rdMatHave=land=>{ const g=GEAR&&GEAR.rd&&GEAR.rd.mat; return (g&&g[land])|0; };
const rdLeftNow=s=>Math.max(0,Math.round(s.left-(t-s.at)));
const rdClock=sec=>Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
function rdNearest(r){ let best=-1,bd=r*r; RD_ORDER.forEach((id,i)=>{ const R=RDS[id], dx=P.x-R.x, dz=P.z-R.z, d=dx*dx+dz*dz; if(d<bd){ bd=d; best=i; } }); return best; }
function rdSummary(i){
  const R=RDS[RD_ORDER[i]], s=RD_CL[i]; if(!s) return R.name;
  const boss=rdBossRow(R.bosses[s.slot]), lv=rdLevel(s.tier);
  if(s.st===2) return R.name+': cleared, rebuilds in '+rdClock(rdLeftNow(s));
  if(s.st===0) return R.name+': ready. '+(boss?boss.short+' waits inside. ':'')+'Level '+RD_BASE_LV+' at +0; the first hit locks the tier to its attacker\'s';
  return R.name+': tier '+RD_ROMAN[s.tier]+', level '+lv+(boss?' · '+boss.short:'')+' · stones '+s.wards+'/3 · banners '+s.sp+'/2 · garrison '+s.gar;
}
function rdPlaceName(wx,wz){ for(let i=0;i<RD_ORDER.length;i++){ const R=RDS[RD_ORDER[i]]; if(Math.hypot(wx-R.x,wz-R.z)<RD_FOOT) return rdSummary(i); } return null; }
function rdMapMarks(x,at,land,fs,label,DPR){
  for(let i=0;i<RD_ORDER.length;i++){ const R=RDS[RD_ORDER[i]]; if(R.land!==land) continue; const [cx,cy]=at(R.x,R.z), s=RD_CL[i];
    dot(x,cx,cy,5*DPR,s&&s.st===2?'#8a8078':'#ffcf5a'); label(R.name,cx,cy-fs*1.3,fs,'#ffe9a8',true);
    label(s?(s.st===2?'Cleared '+rdClock(rdLeftNow(s)):s.st===1?'Raid, level '+rdLevel(s.tier):'Raid, level 40+'):'Raid',cx,cy+fs*0.9,fs*0.85,'#ffd9a0'); }
}
// the bag's raid material rows: [{land, name, n}] for the lands you hold some of
function rdMatRows(){ return RD_ORDER.map(id=>RDS[id]).map(R=>({land:R.land,name:R.mat,n:rdMatHave(R.land)})).filter(r=>r.n>0); }
// the strip near a raid: every half second, hidden away from one
function rdFrame(dt){
  rdStripT-=dt; if(rdStripT>0) return; rdStripT=0.5; rdStructCull();
  const el=$('#rdStrip'); if(!el) return;
  const i=rdNearest(RD_FOOT+25); if(i<0){ el.hidden=true; return; }
  el.hidden=false; el.textContent=rdSummary(i);
}
