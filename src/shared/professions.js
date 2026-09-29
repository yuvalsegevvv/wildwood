//@ Professions: mining, woodcutting and gathering (taught at the Wayfarers' Lodge in Rimehold; potion use is planned), the resource nodes in the Hoarfrost Reach, resources and profession levels. Pure.
/* A profession is learned once, for coins, from the lodge keeper (gear.prof[id] = {xp}); its level grows with every node gathered (PROF_XP) and
   raises the chance of a double yield. A node is a spot in the world (NODES: the same on the client and the server, placed from a seeded rng in
   the Hoarfrost Reach's zones) that gives one resource (kept in gear.res) and is taken for NODE.respawn seconds. What the resources are FOR
   (crafting, potions, selling) is not built yet: docs/MAIN-QUEST.md and docs/WORLD.md list it as planned. The main quest asks for frostbloom (step F5). */
const PROFS={
  mining:{name:'Mining',verb:'mine',price:150,desc:'Swing a pickaxe at the blue veins of rime ore that show in the glacier rock.',nodes:['rimeore']},
  woodcutting:{name:'Woodcutting',verb:'chop',price:150,desc:'Fell the old frostpines the wind has not broken, for beams and firewood.',nodes:['frostpine']},
  gathering:{name:'Gathering',verb:'gather',price:150,desc:'Pick frostbloom, snowmoss and the other plants that grow under the ice and snow.',nodes:['frostbloom','snowmoss']},
  potions:{name:'Potion use',soon:true,desc:'Brew what you gather and drink it in a fight. The lodge has no teacher for it yet: it comes with a later land.'}
};
const PROF_IDS=['mining','woodcutting','gathering'];   // the ones that can be learned today
const PROF_XP=[0,6,16,32,56];                           // gathers needed to reach level 1..5 (index = level - 1)
const PROF_MAX_LV=PROF_XP.length;
const profLvOf=xp=>{ let L=1; for(let i=1;i<PROF_XP.length;i++) if(xp>=PROF_XP[i]) L=i+1; return L; };
const RES_MAX=999;
const RES={rimeore:{name:'Rime Ore',col:'#8fd0f0'},frostwood:{name:'Frostpine Log',col:'#b8956a'},frostbloom:{name:'Frostbloom',col:'#8ad8ff'},snowmoss:{name:'Snowmoss',col:'#a8c8a0'}};
const NODE_KINDS={
  rimeore:{prof:'mining',name:'Rime ore vein',res:'rimeore',lv:1,xp:1,respawn:90,r:1.6},
  frostpine:{prof:'woodcutting',name:'Frostpine',res:'frostwood',lv:1,xp:1,respawn:90,r:0.9},
  frostbloom:{prof:'gathering',name:'Frostbloom',res:'frostbloom',lv:1,xp:2,respawn:120,r:0.7},
  snowmoss:{prof:'gathering',name:'Snowmoss',res:'snowmoss',lv:1,xp:1,respawn:75,r:0.9}
};
const NODE_R=3.4;   // how close you must be to gather one
/* the nodes: [zone level, kind, how many]. Frostbloom grows where the ice is thin over warm springs: the first zones and the lakes' shores */
const NODE_PLAN=[[22,'frostbloom',6],[22,'snowmoss',4],[22,'frostpine',4],[22,'rimeore',3],
  [23,'frostbloom',4],[23,'frostpine',4],[23,'rimeore',3],[23,'snowmoss',3],
  [24,'frostbloom',4],[24,'rimeore',4],[24,'snowmoss',3],[24,'frostpine',3],
  [25,'rimeore',4],[25,'frostpine',3],[25,'snowmoss',3],
  [26,'rimeore',3],[26,'frostpine',2],[26,'snowmoss',2],[27,'rimeore',3],[27,'frostpine',2],[27,'snowmoss',2],
  [28,'rimeore',3],[28,'frostpine',2],[28,'snowmoss',2],[29,'rimeore',3],[29,'frostpine',2],[29,'snowmoss',2],[30,'rimeore',3],[30,'frostpine',2],[30,'snowmoss',2]];
const NODES=(()=>{
  const out=[], rng=mulberry32(5150);
  for(const [lv,kind,n] of NODE_PLAN){
    const zn=ZONES.find(z=>z.key==='h'+lv);
    for(let k=0;k<n;k++) for(let t=0;t<80;t++){
      const [x,z]=zonePoint(zn,rng()-0.5,rng());
      if(zoneAt(x,z)!==zn||rawHeight(x,z)<30||nearRoad(x,z,5)||vDist(x,z)<VR+14||arenaDist(x,z)<34||iceDist(x,z)<5||inPass(x,z,6)||zoneRidge(x,z)>0.6) continue;
      if(Math.abs(rawHeight(x+3,z)-rawHeight(x-3,z))>2.2||Math.abs(rawHeight(x,z+3)-rawHeight(x,z-3))>2.2) continue;
      if(out.some(o=>Math.hypot(o.x-x,o.z-z)<9)) continue;
      out.push({i:out.length,kind,x,z,zone:zn.key}); break;
    }
  }
  return out;
})();
// the nearest node within r metres of (x, z) (index into NODES), or -1
function nodeNear(x,z,r){ let best=-1,bd=r; for(const n of NODES){ const d=Math.hypot(x-n.x,z-n.z); if(d<bd){ bd=d; best=n.i; } } return best; }
// a save's professions and resources, checked
function sanitizeProf(g){
  const out={prof:{},res:{}};
  if(g&&g.prof&&typeof g.prof==='object') for(const id of PROF_IDS) if(g.prof[id]&&typeof g.prof[id]==='object') out.prof[id]={xp:Math.max(0,Math.min(99999,Math.floor(+g.prof[id].xp)||0))};
  if(g&&g.res&&typeof g.res==='object') for(const id in RES){ const n=Math.max(0,Math.min(RES_MAX,Math.floor(+g.res[id])||0)); if(n) out.res[id]=n; }
  return out;
}
