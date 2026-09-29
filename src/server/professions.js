//@ Professions on the server: learning at the Wayfarers' Lodge (Rimehold), gathering at resource nodes that respawn, profession levels, resources kept in gear.res
/* Messages: learn{id} (in Rimehold, coins), gather{i} (a node within NODE_R). Events: node [i, 1 taken / 0 back] for everyone (a joining player is sent the
   taken ones), gather [pid, i, resource id, how many] for the gatherer. The rules and where the nodes are: shared/professions.js. */
const NODE_BACK=NODES.map(()=>0);   // 0: there, else the time (S.t) it is back
function learnProfP(p,id){
  const def=PROFS[id]; if(!def||def.soon||!PROF_IDS.includes(id)||p.dead) return;
  if(Math.hypot(p.x-VIL3.x,p.z-VIL3.z)>VR+8){ toastTo(p.id,'The Wayfarers\' Lodge is in Rimehold, in the Hoarfrost Reach','bad'); return; }
  if(p.gear.prof[id]){ toastTo(p.id,'You already know '+def.name,'bad'); return; }
  if(p.gear.coins<def.price){ toastTo(p.id,def.name+' costs '+def.price+' coins','bad'); return; }
  p.gear.coins-=def.price; p.gear.prof[id]={xp:0}; p.dirty=true;
  toastTo(p.id,'You learned '+def.name+'. '+(id==='gathering'?'Walk up to a plant in the snow and use the talk key to gather it.':id==='mining'?'Walk up to a blue vein of rime ore and use the talk key to mine it.':'Walk up to a frostpine and use the talk key to chop it.'),'good');
  if(id==='gathering') mqActP(p,'learn');
}
function gatherP(p,i){
  const n=NODES[i]; if(!n||p.dead||S.t-(p.gatherT||-9)<1.2) return;
  const K=NODE_KINDS[n.kind], pr=p.gear.prof[K.prof];
  if(Math.hypot(p.x-n.x,p.z-n.z)>NODE_R+1.5) return;
  if(!pr){ toastTo(p.id,'You have not learned '+PROFS[K.prof].name+'. The Wayfarers\' Lodge in Rimehold teaches it.','bad'); return; }
  if(NODE_BACK[i]>S.t){ toastTo(p.id,'Someone has already taken this one','bad'); return; }
  const L=profLvOf(pr.xp); if(L<K.lv){ toastTo(p.id,K.name+' needs '+PROFS[K.prof].name+' level '+K.lv,'bad'); return; }
  p.gatherT=S.t;
  const got=1+(Math.random()<0.15*(L-1)?1:0);
  p.gear.res[K.res]=Math.min(RES_MAX,(p.gear.res[K.res]||0)+got);
  pr.xp=Math.min(99999,pr.xp+K.xp); const L2=profLvOf(pr.xp);
  NODE_BACK[i]=S.t+K.respawn; ev('node',i,1); ev('gather',p.id,i,K.res,got);
  if(L2>L) toastTo(p.id,PROFS[K.prof].name+' is now level '+L2,'good');
  mqGatherP(p,n.kind); p.dirty=true;
}
let nodeT=0;
function updateNodesS(dt){ nodeT-=dt; if(nodeT>0) return; nodeT=1; for(let i=0;i<NODE_BACK.length;i++) if(NODE_BACK[i]&&NODE_BACK[i]<=S.t){ NODE_BACK[i]=0; ev('node',i,0); } }
const nodeEvents=()=>{ const out=[]; NODE_BACK.forEach((t,i)=>{ if(t>S.t) out.push(['node',i,1]); }); return out; };
