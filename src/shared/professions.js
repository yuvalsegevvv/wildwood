//@ Professions: mining, woodcutting and gathering (learned at a Wayfarers' Lodge, each with its own tool slot), the six grades of ore and logs and the three lands' herbs, the resource nodes in every land (the Greyspine's black stone included), profession levels. Pure.
/* A profession is learned once, for coins, at a Wayfarers' Lodge (one in each village; gear.prof[id] = {xp}). To work a node you need its profession
   AND the tool in its slot (pick, axe, sickle: shared/items.js, tier = TIER_LV steps like gear): a node needs a tool of tier n.need or better, where
   need = the gear tier of its zone (tierFor: zone level 1-4 tier 0, 5-9 tier 1, ... 25+ tier 5), so the tools you buy keep pace with the land.
   Every gather (a short cast: castTime) gives one resource (kept in gear.res; two when the double-yield roll hits: profession level + the tool's rarity) and the node is taken
   for NODE_KINDS.respawn seconds. Resources are used in shared/crafting.js: ore makes weapons, logs make armour, herbs make potions (brewing and
   crafting are not professions: they are done at NPCs). NODES are the same on the client and the server (a seeded rng): each ring zone of the home
   forest, the edge zones and each vale zone get 2 ore veins, 2 trees (3 of each in the home forest's zones of levels 1-14), 2 of the land's healing herb and one of its
   strengthening herb; the Hoarfrost Reach and the Greyspine have their own plans. */
const PROFS={
  mining:{name:'Mining',verb:'mine',price:60,tool:'pick',desc:'Swing a pickaxe at the veins of ore in the rock. Ore is what weapons are forged from.'},
  woodcutting:{name:'Woodcutting',verb:'chop',price:60,tool:'axe',desc:'Fell trees with an axe. Logs are what armour is made of.'},
  gathering:{name:'Gathering',verb:'gather',price:60,tool:'sickle',desc:'Cut herbs and flowers with a sickle. Herbs are what potions are brewed from.'}
};
const PROF_IDS=['mining','woodcutting','gathering'];
const PROF_XP=[0,10,30,70,140];                         // xp needed to reach level 1..5 (index = level - 1); a node gives its grade in xp
const PROF_MAX_LV=PROF_XP.length;
const profLvOf=xp=>{ let L=1; for(let i=1;i<PROF_XP.length;i++) if(xp>=PROF_XP[i]) L=i+1; return L; };
const RES_MAX=999;
// ore and logs come in six grades, one for each gear tier: [resource id, name, colour]
const ORE_GRADES=[['copper','Copper Ore','#c98a52'],['iron','Iron Ore','#9aa4ad'],['silver','Silverstone Ore','#d5dbe6'],['sunstone','Sunstone Ore','#e8b84a'],['hagane','Hagane Ore','#a08ab0'],['rimeore','Rime Ore','#8fd0f0']];
const LOG_GRADES=[['pine','Pine Log','#b08a5a'],['oak','Oak Log','#8a6a3a'],['yew','Yew Log','#8a4a3a'],['sunwood','Sunwood Log','#d08a3a'],['cherry','Cherry Log','#e0a0b0'],['frostwood','Frostpine Log','#b8956a']];
// herbs: two for each land (the home forest, the Sakura Vale, the Hoarfrost Reach): the first heals, the second strengthens (potions in crafting.js)
const HERB_LANDS=[[['sunpetal','Sunpetal','#f0c84a'],['ironroot','Ironroot','#a07a54']],[['kikyo','Kikyo Flower','#9a7ae0'],['yomogi','Yomogi','#7ab86a']],[['frostbloom','Frostbloom','#8ad8ff'],['snowmoss','Snowmoss','#a8c8a0']]];
const RES={}, NODE_KINDS={}, RES_SELL=[2,5,12,30,70,150], HERB_SELL=[3,15,60];
ORE_GRADES.forEach(([id,name,col],g)=>{
  RES[id]={name,col,prof:'mining',grade:g+1,sell:RES_SELL[g]};
  NODE_KINDS[id]={prof:'mining',name:name.replace(' Ore',' vein'),res:id,lv:1,xp:g+1,respawn:90,r:1.6};
});
LOG_GRADES.forEach(([id,name,col],g)=>{
  const kind=id==='frostwood'?'frostpine':id;   // (the Hoarfrost's tree kept its old node id)
  RES[id]={name,col,prof:'woodcutting',grade:g+1,sell:RES_SELL[g]};
  NODE_KINDS[kind]={prof:'woodcutting',name:id==='frostwood'?'Frostpine':name.replace(' Log',' tree'),res:id,lv:1,xp:g+1,respawn:90,r:0.9};
});
HERB_LANDS.forEach((pair,land)=>pair.forEach(([id,name,col],k)=>{
  RES[id]={name,col,prof:'gathering',grade:land+1,role:k?'buff':'heal',sell:HERB_SELL[land]};
  NODE_KINDS[id]={prof:'gathering',name,res:id,lv:1,xp:1+2*land,respawn:id==='frostbloom'?120:k?75:90,r:0.7};
}));
// the Greyspine's own ore (docs/MAIN-QUEST.md G3): black stone, the dark made solid. Not a gear grade: nothing is forged from it (the best gear still comes from the six grades),
// the main quest asks for it and the Lodge buys it. Its veins need the same top-tier pickaxe as the Reach's rime ore (a node's need is its zone's gear tier)
RES.blackstone={name:'Black Stone',col:'#5a4e6a',prof:'mining',grade:6,sell:100};
NODE_KINDS.blackstone={prof:'mining',name:'Black vein',res:'blackstone',lv:1,xp:6,respawn:90,r:1.6};
const NODE_R=3.4;   // how close you must be to gather one
/* the Hoarfrost Reach's plan: [zone level, kind, how many]. Frostbloom grows where the ice is thin over warm springs: the first zones and the lakes' shores */
const NODE_PLAN=[[22,'frostbloom',6],[22,'snowmoss',4],[22,'frostpine',4],[22,'rimeore',3],
  [23,'frostbloom',4],[23,'frostpine',4],[23,'rimeore',3],[23,'snowmoss',3],
  [24,'frostbloom',4],[24,'rimeore',4],[24,'snowmoss',3],[24,'frostpine',3],
  [25,'rimeore',4],[25,'frostpine',3],[25,'snowmoss',3],
  [26,'rimeore',3],[26,'frostpine',2],[26,'snowmoss',2],[27,'rimeore',3],[27,'frostpine',2],[27,'snowmoss',2],
  [28,'rimeore',3],[28,'frostpine',2],[28,'snowmoss',2],[29,'rimeore',3],[29,'frostpine',2],[29,'snowmoss',2],[30,'rimeore',3],[30,'frostpine',2],[30,'snowmoss',2]];
// the four dungeon doors (shared/dungeons.js loads after this file: tools/dungeons-smoke.js checks these stay equal to DG_ENTRANCES): no node within 22 m of one
const NODE_KEEPOUT=[[244,148],[826,82],[688,-950],[316,-692]];
const NODES=(()=>{
  const out=[];
  const flat=(x,z)=>Math.abs(rawHeight(x+3,z)-rawHeight(x-3,z))<=2.2&&Math.abs(rawHeight(x,z+3)-rawHeight(x,z-3))<=2.2;
  const apart=(x,z)=>!out.some(o=>Math.hypot(o.x-x,o.z-z)<9);
  const put=(rng,zn,kind,good,need)=>{ for(let t=0;t<240;t++){   // (240 tries: a zone that loses ground to a coast still gets its nodes)
    const [x,z]=zonePoint(zn,rng()-0.5,rng());
    if(zoneAt(x,z)!==zn||!good(x,z)||nearRoad(x,z,5)||vDist(x,z)<VR+14||arenaDist(x,z)<34||zoneRidge(x,z)>0.6||NODE_KEEPOUT.some(d=>Math.hypot(d[0]-x,d[1]-z)<22)||!flat(x,z)||!apart(x,z)) continue;
    out.push({i:out.length,kind,x,z,zone:zn.key,need:need===undefined?tierFor(zn.level):need}); return; } };
  // the Hoarfrost Reach (first, so its nodes keep their numbers)
  { const rng=mulberry32(5150);
    for(const [lv,kind,n] of NODE_PLAN){ const zn=ZONES.find(z=>z.key==='h'+lv); for(let k=0;k<n;k++) put(rng,zn,kind,(x,z)=>rawHeight(x,z)>=30&&iceDist(x,z)>=5&&!inPass(x,z,6)); } }
  // the home forest (ring zones and the three edge zones) and the Sakura Vale: 2 ore, 2 trees and each herb of the land, by the zone's gear tier
  for(const [land,rng] of [[0,mulberry32(5151)],[1,mulberry32(5152)]])
    for(const zn of ZONES){
      if(zn.boss||zn.arena||zn.hoar||zn.grey||!!zn.vale!==!!land) continue;   // (the Greyspine has no nodes yet: it wants its own ore, logs and herbs)
      const t=Math.min(tierFor(zn.level),land?4:3), ore=ORE_GRADES[t][0], log=LOG_GRADES[t][0]==='frostwood'?'frostpine':LOG_GRADES[t][0];
      const good=(x,z)=>rawHeight(x,z)>=2.2&&(land||riverDist(x,z)>8);   // (well above the waterline: the client's finer terrain must not dip a node under it)
      const n=!land&&zn.level<=14?3:2, herbA=HERB_LANDS[land][0][0], herbB=HERB_LANDS[land][1][0];   // the inner woods (copper, iron, silverstone) have only 4-5 zones each: a third vein and tree in each
      for(const kind of [...Array(n).fill(ore),...Array(n).fill(log),herbA,herbA,herbB]) put(rng,zn,kind,good,t);   // (the vale's best zone still gives hagane: no tier-6 tool needed)
    }
  // the Greyspine, last so that every older node keeps its number: in each of its seven zones 2 rime ore, 2 frostpines and 2 snowmoss (the Reach's own top grades: its mountains grow the same),
  // and black stone veins where the miners dig (GREY_BLACK: zone level -> veins): the Ledgeway, the Miners' Scree and the Sink
  { const rng=mulberry32(5153), good=(x,z)=>rawHeight(x,z)>=waterSurf(x,z)+2.2&&!LORE.some(L=>Math.hypot(L.x-x,L.z-z)<8), GREY_BLACK={27:3,28:5,32:3};   // (and clear of the story's lore spots)
    for(const lv of [26,27,28,29,30,31,32]){ const zn=ZONES.find(z=>z.key==='g'+lv);
      for(const kind of ['rimeore','rimeore','frostpine','frostpine','snowmoss','snowmoss',...Array(GREY_BLACK[lv]||0).fill('blackstone')]) put(rng,zn,kind,good); } }
  return out;
})();
// the nearest node within r metres of (x, z) (index into NODES), or -1
function nodeNear(x,z,r){ let best=-1,bd=r; for(const n of NODES){ const d=Math.hypot(x-n.x,z-n.z); if(d<bd){ bd=d; best=n.i; } } return best; }
// why you cannot work a node with this gear right now: 'learn' (the profession), 'tool' (nothing in the tool slot), 'weak' (a tool of too low a tier), or null
function nodeBlock(gear,n){
  const K=NODE_KINDS[n.kind], P=PROFS[K.prof];
  if(!gear.prof||!gear.prof[K.prof]) return 'learn';
  const t=ITEM[gear.eq[P.tool]]; if(!t) return 'tool';
  return t.tier<n.need?'weak':null;
}
function nodeBlockText(why,n){
  const K=NODE_KINDS[n.kind], P=PROFS[K.prof], name=TOOL_MAT[n.need]+' '+TOOL_KIND[P.tool];
  return why==='learn'?'You have not learned '+P.name+'. Any Wayfarers\' Lodge teaches it.':why==='tool'?K.name+': equip a '+TOOL_KIND[P.tool].toLowerCase()+' (Wayfarers\' Lodge)':'Your '+TOOL_KIND[P.tool].toLowerCase()+' is too weak for '+K.name+': it needs a '+name+' or better';
}
// the chance of a double yield: +8% for each profession level above 1, the tool's rarity, and 5% for each tier of tool above the node's need
function doubleChance(L,tool,need){ return Math.min(0.9,0.08*(L-1)+(tool?tool.extra+0.05*Math.max(0,tool.tier-need):0)); }
// how long a gather takes (a cast, no animation): 1.2 s with a copper tool, 0.1 s less for each tier of the tool and 0.04 s for each rarity, never under 0.6 s
const GATHER_CAST=1.2, GATHER_CAST_MIN=0.6;
function castTime(tool){ return Math.max(GATHER_CAST_MIN,GATHER_CAST-(tool?0.1*tool.tier+0.04*tool.rar:0)); }
// a Wayfarers' Lodge is in each village
const nearLodge=(x,z)=>VILS.some(V=>Math.hypot(x-V.x,z-V.z)<=VR+8);
// a save's professions and resources, checked
function sanitizeProf(g){
  const out={prof:{},res:{}};
  if(g&&g.prof&&typeof g.prof==='object') for(const id of PROF_IDS) if(g.prof[id]&&typeof g.prof[id]==='object') out.prof[id]={xp:Math.max(0,Math.min(99999,Math.floor(+g.prof[id].xp)||0))};
  if(g&&g.res&&typeof g.res==='object') for(const id in RES){ const n=Math.max(0,Math.min(RES_MAX,Math.floor(+g.res[id])||0)); if(n) out.res[id]=n; }
  return out;
}
