//@ Free gems on the server: quest steps, the daily quest set (UTC), achievements and the placeholder ad watch
/* Agent map. State (all saved, cleaned by gsSanitize): gear.ach (claimed achievement ids), gear.dq {d: UTC day number, ids: the day's notices, got: the ones handed in}, gear.ad {d, n: ads watched today}.
   Hooks (marked // gems:): mqCompleteP (main-quest.js), sqCompleteP (side-quests.js), turnInP and refreshOffersP (economy.js), the half-second tick (players.js: gsTickP), sanitizeGear (players.js).
   Message adwatch{} grants GEM_AD up to GEM_AD_DAY a day. It is a PLACEHOLDER: no ad service is linked (the game earns nothing yet), the click is the "ad". Test: tools/gem-sources-smoke.js */
function gsGemP(p,n,why){ if(n>0){ ambGemP(p,n); toastTo(p.id,'+'+n+' gems'+(why?' ('+why+')':''),'good'); } }
function gsSanitize(g,out){
  out.ach=Array.isArray(g&&g.ach)?g.ach.filter((id,i,a)=>typeof id==='string'&&GS_ACH.some(x=>x.id===id)&&a.indexOf(id)===i):[];
  const d=g&&g.dq&&typeof g.dq==='object'?g.dq:{}, ok=a=>Array.isArray(a)?a.filter((id,i,s)=>typeof id==='string'&&/^g\d{1,9}$/.test(id)&&s.indexOf(id)===i).slice(0,GEM_DQ_COUNT):[];
  out.dq={d:clampInt(d.d,0,1e7,0),ids:ok(d.ids),got:ok(d.got)};
  const a=g&&g.ad&&typeof g.ad==='object'?g.ad:{}; out.ad={d:clampInt(a.d,0,1e7,0),n:clampInt(a.n,0,GEM_AD_DAY,0)};
}
// a new UTC day: four fresh notices, each worth GEM_DQ_EACH gems extra, and GEM_DQ_ALL more for handing in all four
function gsDailyP(p){
  const D=p.gear.dq, d=gsDayOf(Date.now()); if(D.d===d) return;
  D.d=d; D.got=[]; refreshOffersP(p,true); D.ids=p.gear.q.offers.map(o=>o.id).slice(0,GEM_DQ_COUNT); p.dirty=true;
  toastTo(p.id,'New daily quests on the quest board: '+GEM_DQ_EACH+' gems each','good');
}
const gsKeepOfferP=(p,id)=>p.gear.dq.ids.includes(id)&&!p.gear.dq.got.includes(id);   // a daily notice you have not handed in survives the board's sunrise refresh
function gsTurnedInP(p,id){
  gsDailyP(p); const D=p.gear.dq; if(!D.ids.includes(id)||D.got.includes(id)) return;
  D.got.push(id); gsGemP(p,GEM_DQ_EACH,'daily quest '+D.got.length+' / '+D.ids.length);
  if(D.got.length>=D.ids.length) gsGemP(p,GEM_DQ_ALL,'all daily quests done');
}
function gsTickP(p){
  gsDailyP(p);
  for(const A of GS_ACH) if(!p.gear.ach.includes(A.id)&&A.ok({level:p.level,gear:p.gear})){ p.gear.ach.push(A.id); p.dirty=true; gsGemP(p,A.gems,'achievement: '+A.name); }
}
MSG.adwatch=(p)=>{
  const A=p.gear.ad, d=gsDayOf(Date.now()); if(A.d!==d){ A.d=d; A.n=0; }
  if(A.n>=GEM_AD_DAY){ toastTo(p.id,'No more ads today: '+GEM_AD_DAY+' a day, they come back at 00:00 UTC','bad'); return; }
  A.n++; p.dirty=true; gsGemP(p,GEM_AD,'ad '+A.n+' / '+GEM_AD_DAY);
};
