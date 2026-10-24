//@ Cave method H on the server, Cave crafting: gather glow veins (a pickaxe) and cave herbs (a sickle) of the floor's tier standing still near them, then carve the tablet at the stone anvil
/* Agent map. Numbers: shared/cave/method-h-crafting.js (`ore` veins and `herb` herbs needed, the tool tier a floor asks `need[floor]`, the resource kinds, the carving time). Reuses the professions' rules (shared/professions.js):
   nodeBlock(gear, node) says 'learn' / 'tool' / 'weak', castTime(tool) is how long you stand, a gather pays the resource (gear.res) and the profession's xp like finishGatherP. State p.cm.H = {ore, herb, vm / hm (bit masks of
   the veins / herbs you took: yours alone, back when the method is done), cast {kind 'v'|'h', i, end, x, z}, carve (seconds at the anvil)}. Standing within `reach` of an untouched vein or herb starts the cast; moving 1.5 m away breaks it. */
function caveMHNode(M,kind){ const D=caveMethodDef('H').p; return {kind:kind==='v'?D.ore_kind[M.n]:D.herb_kind[M.n],need:D.need[M.n]}; }
function caveMHTickP(p,M,dt){
  const D=caveMethodDef('H').p, H=M.H, W=caveAW(M.n);
  if(caveCdLeft(p,M.n,'H')>0){ H.cast=null; H.carve=0; return; }
  if(H.cast){
    const c=H.cast; if(Math.hypot(p.x-c.x,p.z-c.z)>1.5){ H.cast=null; return; }
    if(S.t>=c.end){ H.cast=null; caveMHGather(p,M,c); }
    return;
  }
  const need=H.ore>=D.ore&&H.herb>=D.herb;
  if(need){ if(caveMd(p,W.H.anvil)<D.anvil){ H.carve+=dt; if(H.carve>=D.carve){ H.carve=0; H.ore=0; H.herb=0; H.vm=0; H.hm=0; caveMDoneP(p,M,'H'); } } else H.carve=0; return; }
  const nodes=[['v',W.H.veins,'vm',H.ore<D.ore],['h',W.H.herbs,'hm',H.herb<D.herb]];
  for(const [k,list,mask,want] of nodes){ if(!want) continue;
    for(let i=0;i<list.length;i++){ if(H[mask]>>i&1||caveMd(p,list[i])>=D.reach) continue;
      const node=caveMHNode(M,k), why=nodeBlock(p.gear,node);
      if(why){ caveMTell(p,M,'h'+k,(k==='v'?'Glow vein: ':'Cave herb: ')+nodeBlockText(why,node),'bad'); continue; }
      const tool=ITEM[p.gear.eq[PROFS[NODE_KINDS[node.kind].prof].tool]];
      H.cast={kind:k,i,end:S.t+castTime(tool),x:p.x,z:p.z}; return; }
  }
}
function caveMHGather(p,M,c){
  const H=M.H, node=caveMHNode(M,c.kind), K=NODE_KINDS[node.kind], pr=p.gear.prof[K.prof];
  if(nodeBlock(p.gear,node)||!pr) return;
  const L=profLvOf(pr.xp), tool=ITEM[p.gear.eq[PROFS[K.prof].tool]], got=1+(Math.random()<doubleChance(L,tool,node.need)?1:0);
  p.gear.res[K.res]=Math.min(RES_MAX,(p.gear.res[K.res]||0)+got); pr.xp=Math.min(99999,pr.xp+K.xp);
  if(c.kind==='v'){ H.vm|=1<<c.i; H.ore++; } else { H.hm|=1<<c.i; H.herb++; }
  const D=caveMethodDef('H').p; p.dirty=true;
  toastTo(p.id,'You gather '+got+' '+RES[K.res].name+(H.ore>=D.ore&&H.herb>=D.herb?'. Take it to the stone anvil.':''),'good');
}
