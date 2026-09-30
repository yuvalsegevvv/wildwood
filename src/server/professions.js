//@ Professions on the server: learning at a Wayfarers' Lodge (one in each village), gathering at resource nodes with the right tool after a short cast (they respawn), profession levels, resources kept in gear.res, selling them
/* Messages: learn{id} (in a village, coins), gather{i} (a node within NODE_R, the profession learned and a tool of high enough tier in its slot: starts
   a cast of castTime(tool) seconds), sellres{id,n} (in a village). Events: node [i, 1 taken / 0 back] for everyone (a joining player is sent the taken
   ones), cast [pid, i, seconds] (the gatherer's cast began: the client shows its bar), castx [pid] (the cast was broken), gather [pid, i, resource id,
   how many] for the gatherer (the cast is over and the haul is in). A cast breaks when you walk more than 1.5 m from where you began or are knocked out
   (a hit does not break it: it is short, and monsters roam near the nodes), and ends in nothing if someone else finished the node first. The rules and where the nodes are: shared/professions.js. */
const NODE_BACK=NODES.map(()=>0);   // 0: there, else the time (S.t) it is back
function learnProfP(p,id){
  const def=PROFS[id]; if(!def||!PROF_IDS.includes(id)||p.dead) return;
  if(!nearLodge(p.x,p.z)){ toastTo(p.id,'The Wayfarers\' Lodge is in every village. Go and see the lodge keeper','bad'); return; }
  if(p.gear.prof[id]){ toastTo(p.id,'You already know '+def.name,'bad'); return; }
  if(p.gear.coins<def.price){ toastTo(p.id,def.name+' costs '+def.price+' coins','bad'); return; }
  p.gear.coins-=def.price; p.gear.prof[id]={xp:0}; p.dirty=true;
  toastTo(p.id,'You learned '+def.name+'. Buy '+(id==='mining'?'a pickaxe':id==='woodcutting'?'an axe':'a sickle')+' from the lodge keeper and wear it, then walk up to '+(id==='mining'?'a vein of ore':id==='woodcutting'?'a tree':'a herb')+' and press the gather key (G by default).','good');
  mqActP(p,'learn',1,{prof:id});
}
// every check a gather needs, at the start of the cast and again when it ends (returns the node, or null after telling the player why not)
function gatherOkP(p,i){
  const n=NODES[i]; if(!n||p.dead) return null;
  if(Math.hypot(p.x-n.x,p.z-n.z)>NODE_R+1.5) return null;
  const why=nodeBlock(p.gear,n); if(why){ toastTo(p.id,nodeBlockText(why,n),'bad'); return null; }
  if(NODE_BACK[i]>S.t){ toastTo(p.id,'Someone has already taken this one','bad'); return null; }
  return n;
}
function gatherP(p,i){
  if(p.cast) return;   // one cast at a time
  const n=gatherOkP(p,i); if(!n) return;
  const dur=castTime(ITEM[p.gear.eq[PROFS[NODE_KINDS[n.kind].prof].tool]]);
  p.cast={i,end:S.t+dur,x:p.x,z:p.z}; ev('cast',p.id,i,r1(dur));
}
function breakCastP(p){ if(!p.cast) return; p.cast=null; ev('castx',p.id); }
function finishGatherP(p){
  const i=p.cast.i; p.cast=null;
  const n=gatherOkP(p,i); if(!n){ ev('castx',p.id); return; }
  const K=NODE_KINDS[n.kind], pr=p.gear.prof[K.prof], L=profLvOf(pr.xp), tool=ITEM[p.gear.eq[PROFS[K.prof].tool]];
  const got=1+(Math.random()<doubleChance(L,tool,n.need)?1:0);
  p.gear.res[K.res]=Math.min(RES_MAX,(p.gear.res[K.res]||0)+got);
  pr.xp=Math.min(99999,pr.xp+K.xp); const L2=profLvOf(pr.xp);
  NODE_BACK[i]=S.t+K.respawn; ev('node',i,1); ev('gather',p.id,i,K.res,got);
  if(L2>L) toastTo(p.id,PROFS[K.prof].name+' is now level '+L2,'good');
  mqGatherP(p,n.kind); p.dirty=true;
}
// every tick: casts that ran out finish, casts that were interrupted break (you walked off or were knocked out)
function updateCastsS(){
  for(const p of S.players.values()){
    const c=p.cast; if(!c) continue;
    if(p.dead||Math.hypot(p.x-c.x,p.z-c.z)>1.5){ breakCastP(p); continue; }
    if(S.t>=c.end) finishGatherP(p);
  }
}
// sell resources to the lodge keeper (n of one kind, or all of it when n is 0)
function sellResP(p,id,n){
  if(!RES[id]||p.dead||!nearLodge(p.x,p.z)) return;
  const have=p.gear.res[id]||0, k=n>0?Math.min(n,have):have; if(k<=0) return;
  p.gear.res[id]=have-k; if(!p.gear.res[id]) delete p.gear.res[id];
  p.gear.coins+=k*RES[id].sell; p.dirty=true; toastTo(p.id,'Sold '+k+' '+RES[id].name+' for '+k*RES[id].sell+' coins','good');
}
let nodeT=0;
function updateNodesS(dt){ nodeT-=dt; if(nodeT>0) return; nodeT=1; for(let i=0;i<NODE_BACK.length;i++) if(NODE_BACK[i]&&NODE_BACK[i]<=S.t){ NODE_BACK[i]=0; ev('node',i,0); } }
const nodeEvents=()=>{ const out=[]; NODE_BACK.forEach((t,i)=>{ if(t>S.t) out.push(['node',i,1]); }); return out; };
