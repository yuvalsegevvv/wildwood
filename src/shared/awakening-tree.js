//@ Awakening tree: the four tree shapes as data (AWK_SHAPES oak / pine / willow / banyan), the node generator, the load-time check (AWK_BAD) and which shape a character grows
/* Agent map (skills revamp step 8; design: PLAN section 4b; prices: awakening-cost.js; tiers and curves: awakening.js).
   exports: AWK_LIMBS (the six limbs: first level, tier, branch multiplier, branch material, trophy), AWK_TOP (the top skill level, 10), AWK_SHAPE_DEFS (the compact descriptions),
            AWK_SHAPES (id -> built shape {id,name,nodes,byId,joins,depthTotal}; a bad one is left out), AWK_BAD ({id,why}), AWK_SHAPE_ORDER, AWK_WANDERER_TREE,
            awkBuildShape(id, def), awkShapeOf(set | set id) (the shape a character grows, null when unknown), awkNode(shape, nodeId) (own-property lookup, null for a junk id).
   Node: {id, limb:'po'|'ba'|'sk'|'pa'|'ch'|'bu', kind:'up'|'stat'|'star', lv (the skill level an 'up' reaches; a stat node: the level of the upgrade it precedes; a star: 0), n (star: 1 or 2),
          parent (id | null = the root), req (parent + the join nodes: all must be bought), tier (the tier it needs: its limb's, or its level's if higher; a stat node takes its upgrade's), depth (nodes from the root, itself
          counted; joins do not count), x, y (drawing units: root at 0,0, y up, one unit a node along a trunk)}.
   Ids are the same in every shape and stay put when a tree grows: 'po5' (power, level 5), 'pa1' (the passive's unlock), 'spo5' (the stat node before po5), 'star1', 'star2'. A save stores ids, never positions.
   A tree grows by: a higher AWK_TOP (new nodes at every limb's tip), a new limb (a row in AWK_LIMBS and in a shape's `limbs`), or a new shape (a row in AWK_SHAPE_DEFS). Nothing else draws a tree.
   Rules checked at load (awkBuildShape): 116 nodes (57 upgrade + 57 stat + 2 star), unique ids, every req exists and is acyclic, no node needs a prerequisite of a higher tier than its own (so every node
   is reachable the moment its tier is), no two nodes closer than 0.5, finite positions, a join on the level-9 and 10 nodes of the limbs listed in `joins`. Test: tools/awakening-smoke.js. */
const AWK_TOP=10;
// limb code -> first (the lowest level its chain has: 1 = an unlock node), tier (the tier that opens the limb), k (branch multiplier on coins and drops), mat (branch material), troph (1 / 2: the land's boss whose trophy this branch takes)
const AWK_LIMBS={
  ba:{name:'basic',   first:2, tier:0, k:0.75, mat:'echo'},
  sk:{name:'skill',   first:2, tier:0, k:1,    mat:'echo'},
  po:{name:'power',   first:2, tier:0, k:1.25, mat:'echo', troph:1},
  pa:{name:'passive', first:1, tier:1, k:1,    mat:'raid'},
  ch:{name:'charge',  first:1, tier:2, k:1,    mat:'raid', troph:2},
  bu:{name:'burst',   first:1, tier:3, k:1.5,  mat:'raid'}
};
/* The four shapes. `limbs`, in build order (a limb's `from` is a node of an earlier one; null = the root, with `off` the x of its first node):
     c    the limb's code;     from  the node it forks from (a tier at or below the limb's own: see the rule above);     via  extra nodes its first node also needs (Banyan's beam);
     side -1 left / 0 straight / +1 right, lean (x per node), rise (y per node), off (the first node's distance from the fork's x), at (draw from this point instead of the fork node's).
   `joins`: {limb: other limb}: the level-9 and 10 upgrade nodes of the limb also need the deepest stat node of the other (the crown is a web).
   `stars`: the node each special burst node hangs from (PLAN: the burst limb's level 9; star1 hangs from level 8, the highest A4 allows, so it can be bought at its tier). */
const AWK_SHAPE_DEFS={
  oak:{name:'Oak', feel:'power is the trunk, a wide crown',
    limbs:[{c:'po',from:null,off:0,side:0,lean:0,rise:1},
           {c:'ba',from:'po2',side:-1,lean:0.9,rise:0.55,off:0.8}, {c:'sk',from:'po2',side:1,lean:0.9,rise:0.55,off:0.8},
           {c:'pa',from:'po5',side:-1,lean:0.8,rise:0.6,off:0.8}, {c:'ch',from:'po6',side:1,lean:0.8,rise:0.6,off:0.8},
           {c:'bu',from:'po7',side:1,lean:0.06,rise:1,off:1.3}],
    joins:{ba:'pa',sk:'ch',pa:'bu',ch:'bu'}, stars:['bu8','bu9']},
  pine:{name:'Pine', feel:'tall and narrow: the basic attack grows fastest',
    limbs:[{c:'ba',from:null,off:0,side:0,lean:0,rise:1},
           {c:'sk',from:'ba3',side:-1,lean:0.8,rise:0.8,off:0.8}, {c:'po',from:'ba3',side:1,lean:0.8,rise:0.8,off:0.8},
           {c:'ch',from:'ba4',side:-1,lean:0.45,rise:0.9,off:0.8}, {c:'pa',from:'ba5',side:1,lean:0.45,rise:0.9,off:0.8},
           {c:'bu',from:'ba7',side:1,lean:0.04,rise:1,off:1.3}],
    joins:{ba:'ch',sk:'ch',po:'pa',ch:'bu',pa:'bu'}, stars:['bu8','bu9']},
  willow:{name:'Willow', feel:'the skill is the trunk; the passive hangs low and comes early, the power late',
    limbs:[{c:'sk',from:null,off:0,side:0,lean:0,rise:1},
           {c:'pa',from:'sk2',side:-1,lean:0.6,rise:0.4,off:0.8},
           {c:'ba',from:'sk4',side:-1,lean:0.95,rise:0.45,off:0.8}, {c:'po',from:'sk4',side:1,lean:0.95,rise:0.45,off:0.8},
           {c:'ch',from:'sk6',side:1,lean:0.5,rise:0.8,off:0.8},
           {c:'bu',from:'sk7',side:-1,lean:0.06,rise:1,off:1.3}],
    joins:{ba:'ch',pa:'ch',po:'bu',sk:'bu',ch:'bu'}, stars:['bu8','bu9']},
  banyan:{name:'Banyan', feel:'two trunks, power and passive, joined by the charge beam',
    limbs:[{c:'po',from:null,off:-1.6,side:0,lean:0,rise:1}, {c:'pa',from:null,off:1.6,side:0,lean:0,rise:1},
           {c:'ba',from:'po2',side:-1,lean:0.8,rise:0.6,off:0.8}, {c:'sk',from:null,off:3.6,side:1,lean:0.8,rise:0.6},
           {c:'ch',from:'po5',via:['pa5'],at:[0,10],side:0,lean:0,rise:1,off:0},
           {c:'bu',from:'ch7',side:1,lean:0.04,rise:1,off:1.3}],
    joins:{ba:'pa',sk:'po',po:'bu',pa:'bu',ch:'bu'}, stars:['bu8','bu9']}
};
const AWK_SHAPE_ORDER=['oak','pine','willow','banyan'], AWK_WANDERER_TREE='oak';
const AWK_SHAPES=Object.create(null), AWK_BAD=[];
const awkHas=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function awkNode(shape,id){ return shape&&typeof id==='string'&&awkHas(shape.byId,id)?shape.byId[id]:null; }
// the id of a limb's upgrade node at a level and of the stat node before it
const awkUpId=(c,lv)=>c+lv, awkStatId=(c,lv)=>'s'+c+lv;
// build one shape from its description; returns the shape, or null with the reason (the caller lists it in AWK_BAD)
function awkBuildShape(id,D){
  const nodes=[], byId=Object.create(null), joins=[]; let why=null;
  const bad=w=>{ if(!why) why=w; return null; };
  if(!D||!Array.isArray(D.limbs)||!D.joins||!Array.isArray(D.stars)||D.stars.length!==2) return {bad:'the description needs limbs, joins and two stars'};
  const add=n=>{ if(awkHas(byId,n.id)) return bad('node '+n.id+' twice'); byId[n.id]=n; nodes.push(n); return n; };
  const built={};
  for(const L of D.limbs){
    const Lm=awkHas(AWK_LIMBS,L.c)?AWK_LIMBS[L.c]:null; if(!Lm) return {bad:'no limb '+L.c};
    if(built[L.c]) return {bad:'limb '+L.c+' twice'};
    let from=null; if(L.from!==null){ from=awkHas(byId,L.from)?byId[L.from]:null; if(!from) return {bad:'limb '+L.c+' forks from '+L.from+', which is not built yet'}; }
    const at=Array.isArray(L.at)?L.at:null, ax=at?at[0]:from?from.x:0, ay=at?at[1]:from?from.y:0, side=L.side||0; let prev=from, i=0;
    built[L.c]=true;
    for(let lv=Lm.first;lv<=AWK_TOP;lv++){
      const tier=Math.max(Lm.tier,awkTierForLevel(lv));
      for(const kind of ['stat','up']){
        i++;
        const n={id:kind==='stat'?awkStatId(L.c,lv):awkUpId(L.c,lv), limb:L.c, kind, lv, parent:prev?prev.id:null, req:[], tier, depth:(prev?prev.depth:0)+1,
                 x:Math.round((ax+((from||at)?side:1)*(L.off||0)+side*(L.lean||0)*i)*1000)/1000, y:Math.round((ay+(L.rise||1)*i)*1000)/1000};
        if(prev) n.req.push(prev.id);
        if(i===1&&L.via) n.req.push(...L.via);
        if(!add(n)) return {bad:why}; prev=n;
      }
    }
  }
  for(const [c,t] of Object.entries(D.joins)){   // the level-9 and 10 upgrades of limb c also need the deepest stat node of limb t
    if(!awkHas(AWK_LIMBS,c)||!awkHas(AWK_LIMBS,t)||c===t) return {bad:'join '+c+' -> '+t};
    const need=awkStatId(t,AWK_TOP); if(!awkHas(byId,need)) return {bad:'join target '+need+' missing'};
    for(const lv of [AWK_TOP-1,AWK_TOP]){ const n=awkHas(byId,awkUpId(c,lv))?byId[awkUpId(c,lv)]:null; if(!n) return {bad:'join node '+awkUpId(c,lv)+' missing'}; n.req.push(need); joins.push({node:n.id,needs:need}); }
  }
  D.stars.forEach((from,k)=>{   // the special burst nodes: the burst's two buffs, A4 and A5
    const p=awkHas(byId,from)?byId[from]:null; if(!p) return bad('star '+(k+1)+' hangs from '+from+', which is missing');
    add({id:'star'+(k+1), limb:'bu', kind:'star', lv:0, n:k+1, parent:p.id, req:[p.id], tier:3+k+1, depth:p.depth+1, x:Math.round((p.x+(k?0.9:-0.9))*1000)/1000, y:Math.round((p.y+0.7)*1000)/1000});
  });
  if(why) return {bad:why};
  const need=Object.keys(AWK_LIMBS).reduce((s,c)=>s+(AWK_TOP-AWK_LIMBS[c].first+1)*2,2);
  if(nodes.length!==need||nodes.length!==116) return {bad:nodes.length+' nodes, expected '+need+' (116)'};
  for(const n of nodes){
    for(const r of n.req){ const q=awkHas(byId,r)?byId[r]:null; if(!q) return {bad:n.id+' needs '+r+', which does not exist'}; if(q.tier>n.tier) return {bad:n.id+' (A'+n.tier+') needs '+r+' (A'+q.tier+'): it could not be bought at its own tier'}; }
    if(!Number.isFinite(n.x)||!Number.isFinite(n.y)) return {bad:n.id+' has no position'};
  }
  const state=Object.create(null);
  const visit=n=>{ if(state[n.id]===2) return true; if(state[n.id]===1) return false; state[n.id]=1; for(const r of n.req) if(!visit(byId[r])) return false; state[n.id]=2; return true; };
  for(const n of nodes) if(!visit(n)) return {bad:'a prerequisite loop through '+n.id};
  for(let a=0;a<nodes.length;a++) for(let b=a+1;b<nodes.length;b++) if(Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y)<0.5) return {bad:nodes[a].id+' and '+nodes[b].id+' are drawn on top of each other'};
  return {shape:{id,name:D.name,feel:D.feel||'',nodes,byId,joins,depthTotal:nodes.reduce((s,n)=>s+n.depth,0),limbs:D.limbs.map(l=>l.c)}};
}
for(const id of AWK_SHAPE_ORDER){
  const r=awkBuildShape(id,AWK_SHAPE_DEFS[id]);
  if(r.shape) AWK_SHAPES[id]=r.shape;
  else { AWK_BAD.push({id,why:r.bad}); if(typeof console!=='undefined') console.warn('awakening shape '+id+' left out: '+r.bad); }
}
// the shape a character grows: its set's `tree` field (a set object or a set id; SS_SETS is defined later in the bundle, so only asked at run time); the Wanderer: oak
function awkShapeOf(set){
  let t=null;
  if(set==='wanderer'||(set&&typeof set==='object'&&set.id==='wanderer')) t=AWK_WANDERER_TREE;
  else { const s=typeof set==='string'?(awkHas(SS_SETS,set)?SS_SETS[set]:null):set; t=s&&typeof s==='object'&&typeof s.tree==='string'?s.tree:null; }
  return t&&awkHas(AWK_SHAPES,t)?AWK_SHAPES[t]:null;
}
