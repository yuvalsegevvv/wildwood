//@ Puzzles on the server: opening a stone, checking an answer, the 2-hour renewals, the chest, first-solve gems and Sigils, the Sigil track, upgrade scrolls, and the admin Puzzles tool
/* Agent map (docs/PUZZLES.md). State (saved, cleaned by pzSanitize): gear.pz {site id: {n: solves, t: renews at (ms)}}, gear.sig (lifetime Sigils), gear.sigPaid (track levels paid), gear.scr {e: epic scrolls, u: unique scrolls}.
   The open board is p.pz = {site, kind, diff, seed, lv, first, t0} (never saved). Messages in: pz{a:'open', site} (at a stone), pz{a:'solve', ans}, pz{a:'close'}, scroll{id, to: 'e'|'u'} (Greta's forge);
   out: {t:'pz', a:'open', site, kind, diff, seed, lv, first, src} (the client builds the board from the seed) and {t:'pz', a:'done', ok, chest:{...}, gems, sig, track:[levels]} / {t:'pz', a:'no', why}.
   The admin tool is devP 'pz' (pzDevP: open any kind / difficulty / seed, or pay a chest of a difficulty). Anti-farming: a floor on the solve time (PZ_FLOOR_K of the target, normal and up), the renewal, no gems or Sigils on a renewal.
   Dungeon, raid and cave stones are the next thread's; here a party of one. Hooks marked // puzzles:: players.js (sanitizeGear), economy.js (devP), api.js (the message). Test: tools/puzzles-smoke.js */
const PZ_BOARDS=new Map();   // kind|diff|seed -> board: the server makes a board once (the extreme ones take seconds) and keeps the last 48
function pzBoardS(kind,diff,seed){
  const key=kind+'|'+diff+'|'+seed; if(PZ_BOARDS.has(key)) return PZ_BOARDS.get(key);
  const B=pzBoard(kind,diff,seed); if(!B) return null;
  if(PZ_BOARDS.size>=48) PZ_BOARDS.delete(PZ_BOARDS.keys().next().value);
  PZ_BOARDS.set(key,B); return B;
}
function pzSanitize(g,out){
  out.pz={}; const src=g&&g.pz&&typeof g.pz==='object'&&!Array.isArray(g.pz)?g.pz:{};
  for(const id of Object.keys(src).slice(0,600)){ if(!/^[a-z0-9_-]{1,24}$/.test(id)||id==='__proto__') continue; const r=src[id]; if(!r||typeof r!=='object') continue;
    out.pz[id]={n:clampInt(r.n,0,1e6,0),t:clampInt(r.t,0,9e15,0)}; }
  out.sig=clampInt(g&&g.sig,0,PZ_TRACK_LEVELS*PZ_SIG_LEVEL+5000,0);
  out.sigPaid=Math.min(clampInt(g&&g.sigPaid,0,PZ_TRACK_LEVELS,0),pzTrackLevel(out.sig));
  const s=g&&g.scr&&typeof g.scr==='object'?g.scr:{}; out.scr={e:clampInt(s.e,0,999,0),u:clampInt(s.u,0,999,0)};
}
const pzRoll=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
// a chest of difficulty d at level lv for player p: pays everything and returns what it held (for the client's chest window). first: the overworld first solve (adds the gear roll)
function pzChestP(p,d,lv,first){
  const C=PZ_CHEST[d], got={coins:0,pot:{},mats:[],stones:0,amber:0,scroll:0,gear:null,lucky:false};
  got.coins=Math.round(coinsFor(lv)*C.coins); p.gear.coins=Math.min(COINS_MAX,p.gear.coins+got.coins);
  let np=Math.random()<C.potP?pzRoll(C.pot[0],C.pot[1]):0; if(Math.random()<PZ_LUCKY&&np>0){ np*=2; got.lucky=true; }
  const tier=lv>=30?3:lv>=15?2:1;
  for(let i=0;i<np;i++){ let r=Math.random(), kind=PZ_POTION_ODDS[PZ_POTION_ODDS.length-1][0]; for(const [k,pr] of PZ_POTION_ODDS){ if(r<pr){ kind=k; break; } r-=pr; }
    const id=kind+tier; if(POTS[id]){ p.gear.pot[id]=Math.min(POT_MAX,(p.gear.pot[id]||0)+1); got.pot[id]=(got.pot[id]||0)+1; } }
  const pool=MAT_IDS.filter(id=>{ const m=MATS[id]; return !m.boss&&Math.abs(m.lv-lv)<=2; }), pool2=pool.length?pool:MAT_IDS.filter(id=>!MATS[id].boss);
  for(let i=0;i<C.drops;i++){ const id=pool2[Math.floor(Math.random()*pool2.length)]; addMatP(p,id,1); const e=got.mats.find(x=>x[0]===id); if(e) e[1]++; else got.mats.push([id,1]); }
  if(C.stones&&lv>=PZ_STONE_LV){ got.stones=C.stones; dgAddStonesP(p,C.stones); }
  if(C.amber){ got.amber=C.amber; ambAddP(p,C.amber); }
  if(C.scroll&&Math.random()<C.scroll){ got.scroll=1; p.gear.scr.e=Math.min(999,p.gear.scr.e+1); }
  if(first&&C.gear&&Math.random()<C.gear[0]&&p.gear.inv.length<BAG_MAX){
    let t=0; for(let i=0;i<TIERS;i++) if(TIER_LV[i]<=lv) t=i;
    const r=Math.min(4,C.gear[1]+(Math.random()<0.2?1:0)), id=itemId(ALL_SLOTS[Math.floor(Math.random()*ALL_SLOTS.length)],t,r);
    if(ITEM[id]){ p.gear.inv.push(id); got.gear=id; }
  }
  p.dirty=true; return got;
}
// the Sigil track: pay every level reached and not yet paid (10 gems each, a cosmetic when the content thread named one, a unique scroll every 5th level); returns the levels paid
function pzTrackP(p){
  const paid=[]; const lv=pzTrackLevel(p.gear.sig);
  while(p.gear.sigPaid<lv){
    const L=++p.gear.sigPaid; paid.push(L); gsGemP(p,PZ_LEVEL_GEMS,'Sigil track level '+L);
    const cos=PZ_TRACK_COS[L]; if(typeof cos==='string'&&!p.gear.cos.includes(cos)&&p.gear.cos.length<COS_MAX){ p.gear.cos.push(cos); toastTo(p.id,'Sigil track reward: a new cosmetic','loot r3'); }
    if(L%PZ_SCROLL_EVERY===0){ p.gear.scr.u=Math.min(999,p.gear.scr.u+1); toastTo(p.id,'Sigil track reward: a Unique upgrade scroll','loot r3'); }
  }
  if(paid.length) p.dirty=true; return paid;
}
function pzOpenS(p,site,kind,diff,seed,lv,first,src){
  p.pz={site,kind,diff,seed,lv,first,src,t0:Date.now()};
  sendTo(p.id,{t:'pz',a:'open',site,kind,diff,seed,lv,first,src,floor:pzFloorSecs(diff)});
}
function pzNo(p,why){ sendTo(p.id,{t:'pz',a:'no',why}); }
function pzOpenSiteP(p,id){
  if(!PZ_ON){ pzNo(p,'Puzzles are not open yet'); return; }
  const S=pzSiteOf(String(id||'')); if(!S||p.dead||p.dg||p.pv) return;
  if(Math.hypot(p.x-S.x,p.z-S.z)>PZ_REACH+2){ pzNo(p,'Step closer to the stone'); return; }
  const R=p.gear.pz[S.id]||{n:0,t:0}, now=Date.now();
  if(R.t>now){ pzNo(p,'The stone is dim. It lights again in '+Math.ceil((R.t-now)/60000)+' min'); return; }
  const first=R.n===0, seed=first&&S.seed0?S.seed0:pzSeed(S.id,S.diff,R.n);
  pzOpenS(p,S.id,S.kind,S.diff,seed,S.lv,first,'site');
}
function pzSolveP(p,ans){
  const O=p.pz; if(!O) return; p.pz=null;
  const B=pzBoardS(O.kind,O.diff,O.seed); if(!B) return;
  const secs=(Date.now()-O.t0)/1000;
  if(!PZ_KINDS[O.kind].check(B,ans)){ pzNo(p,'That is not a solution'); p.pz=O; return; }
  if(O.src==='site'&&secs<pzFloorSecs(O.diff)){ pzNo(p,'Too quick: the stone does not believe it. Look again.'); p.pz=O; return; }
  const out={t:'pz',a:'done',ok:1,diff:O.diff,site:O.site,first:O.first,src:O.src,secs:Math.round(secs)};
  if(O.src==='site'){
    const R=p.gear.pz[O.site]||(p.gear.pz[O.site]={n:0,t:0}); R.n++; R.t=Date.now()+PZ_RENEW_MS;
    if(O.first){ const D=PZ_DIFF[O.diff]; out.gems=D.gems; gsGemP(p,D.gems,'puzzle'); if(D.sigils){ out.sig=D.sigils; p.gear.sig+=D.sigils; toastTo(p.id,'+'+D.sigils+' Sigils','good'); out.track=pzTrackP(p); } }
    out.chest=pzChestP(p,O.diff,O.lv,O.first);
  } else if(O.src==='dev'){ out.chest=null; }
  p.dirty=true; sendTo(p.id,out);
}
MSG.pz=(p,msg)=>{
  const a=String(msg.a||'');
  if(a==='open') pzOpenSiteP(p,msg.site);
  else if(a==='solve') pzSolveP(p,msg.ans);
  else if(a==='close') p.pz=null;
};
// admin: devP cmd 'pz' {v: {kind, diff, seed} | {chest: diff, first, lv} | {sig: n} | {reset: 1}}; the kind is checked against the registry (a string from a client is never a key)
function pzDevP(p,v){
  if(!v||typeof v!=='object') return;
  if(v.reset){ p.gear.pz={}; p.dirty=true; toastTo(p.id,'All puzzle stones are lit again','good'); return; }
  if(v.sig){ p.gear.sig=clampInt(p.gear.sig+clampInt(v.sig,-5000,5000,0),0,PZ_TRACK_LEVELS*PZ_SIG_LEVEL+5000,0); pzTrackP(p); p.dirty=true; toastTo(p.id,'You have '+p.gear.sig+' Sigils','good'); return; }
  if(v.chest){ const d=clampInt(v.chest,1,5,1), got=pzChestP(p,d,clampInt(v.lv,1,99,p.level),!!v.first); sendTo(p.id,{t:'pz',a:'done',ok:1,diff:d,site:'chest',first:!!v.first,src:'chest',chest:got}); return; }
  const kind=String(v.kind||''), diff=clampInt(v.diff,1,5,1);
  if(!Object.prototype.hasOwnProperty.call(PZ_KINDS,kind)){ toastTo(p.id,'No puzzle kind "'+kind+'" ('+PZ_KIND_IDS.join(', ')+')','bad'); return; }
  const seed=(v.seed==null||v.seed==='')?Math.floor(Math.random()*4294967296):clampInt(v.seed,0,4294967295,1);
  pzOpenS(p,'dev',kind,diff,seed>>>0,p.level,false,'dev');
}
// Greta's forge: an upgrade scroll turns a common/rare piece into epic ('e'), or a common/rare/epic one into unique ('u'). Gear only (tools, rolled and level-30 pieces keep their own rules and are refused); the id keeps its slot and tier.
MSG.scroll=(p,msg)=>{
  const id=String(msg.id||''), to=msg.to==='u'?'u':msg.to==='e'?'e':'', it=Object.prototype.hasOwnProperty.call(ITEM,id)?ITEM[id]:null;
  if(!to||!it||it.dg||id.indexOf('~')>=0||!ALL_SLOTS.includes(it.slot)||!p.gear.inv.includes(id)) return;
  const want=to==='e'?2:3, from=it.rar;
  if(from>=want||(to==='e'&&from>1)||(to==='u'&&from>2)){ toastTo(p.id,to==='e'?'An epic scroll turns a common or rare piece into epic':'A unique scroll turns a common, rare or epic piece into unique','bad'); return; }
  if((p.gear.scr[to]||0)<1){ toastTo(p.id,'You have no '+(to==='e'?'epic':'unique')+' upgrade scroll','bad'); return; }
  const nid=it.base+'-'+RAR_KEY[want]; if(!ITEM[nid]) return;
  p.gear.scr[to]--; const spare=unwornCount(p,id)>=1, worn=Object.keys(p.gear.eq).find(k=>p.gear.eq[k]===id);   // a spare copy in the bag is the one that burns; a worn piece with no spare is changed where it stands
  p.gear.inv.splice(p.gear.inv.indexOf(id),1,nid); if(!spare&&worn) p.gear.eq[worn]=nid;
  gearChangedP(p); toastTo(p.id,'The scroll burns away: '+ITEM[nid].name,'loot r'+ITEM[nid].rar); ev('merge',p.id,nid);
};
function pzSwitch(on){ PZ_ON=!!on; }   // test hook (tools/puzzles-smoke.js)
