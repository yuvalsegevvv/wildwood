//@ The Dark Infection Pipes: one grind spot in each of the eight lands (a flat, tree-free 20 x 20 square), its levels, spawn counts and rates, upgrade materials and activation cost. Pure
/* Agent map (docs/DIP.md). A pipe is where you "release dark energy": for DIP_SECS (10 minutes) it spawns up to DIP_COUNT[level] monsters of every non-boss kind of its land, refilled every DIP_INTERVAL[level] seconds
   (12 s unupgraded, 3 s at level 5). The level is yours (gear.dip[site id], 0-5) and is bought with the materials four of the land's monster kinds drop (dipUpNeeds); activating costs coins (dipCost: 50% of what
   killing every spawn before each refill tick pays, without coin bonuses). Pipe monsters drop DIP_MAT_K of the usual materials. In the home forest a kind below level 10 spawns as a level-10 monster (DIP_HOME_MIN_LV).
   owns:    DIP_SITES (id 'dip-<land>', {id, land, x, z, lv, kinds:[def ids], mats:[4 def ids], defs}), DIP_BY_ID, DIP_SIDE, DIP_MAX, DIP_SECS, DIP_COUNT, DIP_INTERVAL, DIP_REACH, dipNear(x,z,m), dipKindLv(site,def), dipUpNeeds(site,to), dipCost(site,level).
   used by: server/dip.js, game/dip/*, village-helpers.js (nearPath keeps trees and props off), server/monsters.js (camps keep off). Placed once at load by dipPlaceAll (deterministic: the atlas's own data). Test: tools/dip-smoke.js */
const DIP_SIDE=20, DIP_MAX=5, DIP_SECS=600, DIP_REACH=12, DIP_HOME_MIN_LV=10, DIP_MAT_K=0.25;   // DIP_MAT_K: a pipe monster drops a quarter of the usual material chance
const DIP_COUNT=[10,20,30,40,50,60], DIP_INTERVAL=[12,9.6,7.4,5.5,4,3];   // by pipe level 0-5: monsters alive at most, seconds between refills
const DIP_UP_N=[0,8,15,25,40,60];   // materials of EACH of the four kinds to raise the pipe to level 1-5
const DIP_MAX_RANGE=5;   // the most the ground may rise over the 20 m square
const DIP_SITES=[], DIP_BY_ID={}, DIP_BAD=[];
const dipNear=(x,z,m)=>{ const h=DIP_SIDE/2+m; for(let i=0;i<DIP_SITES.length;i++){ const S=DIP_SITES[i]; if(Math.abs(x-S.x)<=h&&Math.abs(z-S.z)<=h) return true; } return false; };
// the level a kind spawns at here (the home forest's kinds below level 10 are raised to 10)
const dipKindLv=(S,d)=>S.land==='home'?Math.max(DIP_HOME_MIN_LV,d.level):d.level;
// the materials of four of the land's kinds (its lowest, two between and its highest) pay an upgrade: DIP_UP_N of each
function dipUpNeeds(S,to){ if(!(to>=1&&to<=DIP_MAX)) return null; return S.mats.map(id=>({id,n:DIP_UP_N[to]})); }
const DIP_COIN_AVG={};   // level -> the mean coins of one kill (coinsFor rolls 1.5-2.5x; the mean keeps a pipe's price steady)
function dipCoinAvg(L){ if(DIP_COIN_AVG[L]) return DIP_COIN_AVG[L]; let s=0; for(let i=0;i<400;i++) s+=coinsFor(L); return DIP_COIN_AVG[L]=s/400; }
// half of what you earn killing the full count at every refill tick for the whole activation, coins without bonuses (the mean over the kinds' levels)
function dipCost(S,level){
  const L=Math.max(0,Math.min(DIP_MAX,level|0)); let c=0; for(const d of S.defs||[]) c+=dipCoinAvg(dipKindLv(S,d)); c/=Math.max(1,(S.defs||[]).length);
  return Math.max(10,Math.round(0.5*(DIP_SECS/DIP_INTERVAL[L])*DIP_COUNT[L]*c/10)*10);
}
// the height range over the square (25 samples): the flattest square the zone offers wins, a perfectly flat one is taken at once
function dipRange(x,z){ let lo=1e9,hi=-1e9; for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){ const h=waGround(x+i*5,z+j*5); if(h<lo) lo=h; if(h>hi) hi=h; } return lo>1.5?hi-lo:99; }
function dipPlaceAll(){
  if(DIP_SITES.length) return;
  const rng=mulberry32(0xd1b7), byLand={};
  for(const d of MON_DEFS){ if(d.boss) continue; const zn=defZone(d); if(!zn||zn.boss) continue; const land=landAt(zn.x,zn.z); (byLand[land]=byLand[land]||[]).push(d); }
  for(const land in WA_HUBS){
    const defs=(byLand[land]||[]).slice().sort((a,b)=>a.level-b.level); if(!defs.length) continue;
    const hub=WA_HUBS[land], clear=(x,z)=>{
      const zn=zoneAt(x,z); if(landAt(x,z)!==land||!zn||zn.boss||waWaterDist(x,z)<16||waCoast(x,z)<34||vDist(x,z)<VR+40||roadDist(x,z)<14||dipRange(x,z)>DIP_MAX_RANGE) return false;
      if(Math.hypot(x-TROOM.x,z-TROOM.z)<40) return false;
      for(const p of WA_POIS) if(Math.hypot(p.x-x,p.z-z)<56) return false;
      for(const k in DG_ENTRANCES) if(Math.hypot(DG_ENTRANCES[k].x-x,DG_ENTRANCES[k].z-z)<40) return false;
      for(const s of PZ_SITES) if(Math.hypot(s.x-x,s.z-z)<18) return false;
      if(cvNear(x,z,40)) return false;
      if(Math.hypot(x-MQ_FARM.x,z-MQ_FARM.z)<50) return false;   // the story's farm
      for(const k in MQ_PLACES) if(Math.hypot(MQ_PLACES[k].x-x,MQ_PLACES[k].z-z)<(MQ_PLACES[k].r||8)+30) return false;   // the story's places (the hut, the log, the hedge...)
      return true; };
    let got=null, bestR=99;   // the flattest clear square 90-500 m from the land's village (the closest ring wins ties: a perfectly flat square is taken at once)
    for(let r=90;r<=500&&bestR>1.2;r+=10) for(let k=0;k<24&&bestR>1.2;k++){ const a=(k/24+rng()*0.04)*TAU, x=Math.round((hub[0]+Math.sin(a)*r)*10)/10, z=Math.round((hub[1]+Math.cos(a)*r)*10)/10; if(clear(x,z)){ const d=dipRange(x,z); if(d<bestR){ bestR=d; got=[x,z]; } } }
    if(!got){ DIP_BAD.push(land); continue; }
    const pick=f=>defs[Math.min(defs.length-1,Math.floor(f*(defs.length-1)+0.5))].id;
    const mats=[...new Set([pick(0),pick(1/3),pick(2/3),pick(1)])];
    const S={id:'dip-'+land,land,x:got[0],z:got[1],lv:Math.max(...defs.map(d=>dipKindLv({land},d))),kinds:defs.map(d=>d.id),mats,defs};
    DIP_SITES.push(S); DIP_BY_ID[S.id]=S;
  }
}
dipPlaceAll();
