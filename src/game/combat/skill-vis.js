//@ Skill visuals that follow the skill's text: every blow of a multi-hit skill is a swing of its own, waves that travel, props that appear (dolls, anvils, bells...), run from a look's `vis` recipes
/* Agent map. Doc: docs/skillkits/VISUALS.md ("Visuals that follow the text"). A skill that says "swings four times" swings four times (skvPlan: the body animation repeats, one arc and one number a swing),
   "a wave" is a wall of water, light or dust that travels (skvWave), "a doll" is a doll (skill-props.js). A look (game/skillsets/look-<id>.js) lists what to draw in `vis`:
     vis:{ '1'|'2'|'3'|'ult'|'<exact skill id>': { cast:[steps], zone:[steps], end:[steps], hit:[steps] } }
   cast = at the swing (the hit moment), zone = when the skill's ground area starts, end = when it ends, hit = where its projectile lands. A step is {<verb>:{options}} with an optional `at` (seconds later) beside the verb or inside its options.
   Verbs (SKVX): swing wave prop burst ring shaft rays slabs decal shake dust rise flash. Anchors: an option `where` of 'self' (default), 'front' (d metres ahead) or 'target' (your target when it is yours).
   Colours in a step: an index into the look's cols, 'hot' / 'hot2', or a hex number. A bad recipe is dropped and listed in SKV.bad (client-smoke fails naming it).
   Exports: SKV, skvPlan, skvActInit, skvSwings, skvWave, skvWaveAt, skvRunRecipe, skvCheckVis, skvDmgDelay, skvTick. Hooks into other files are marked `// skillvis:`. Props: combat/skill-props.js. Test: client-smoke. */
const SKV={waves:[], bad:[], errs:[], cast:null};   // bad: recipes dropped at definition; errs: steps that threw when run (client-smoke fails on either); cast: the last generic cast with a zone (skill-vis-gen.js)
const SKV_VERBS=['swing','wave','prop','burst','ring','shaft','rays','slabs','decal','shake','dust','rise','flash'];
// ---- swings: a skill with cone.hits blows swings that many times ----
function skvPlan(sk){   // {n, gap}: how many swings and the seconds between them; null for a single blow
  const f=sk&&sk.fx, n=Math.min(8,(f&&f.cone&&f.cone.hits)|0); if(n<2) return null;
  return {n,gap:n>=5?0.09:n>=3?0.12:0.16};
}
// give an attack (CB.act or a remote's act) the plan of its kind: the act lasts long enough for every swing, the first one still lands at the moment the server hits
function skvActInit(act,kind){
  const sp=skvPlan(ACT_SKILL[kind]); if(!sp) return;
  const hitT=act.dur*act.hitAt; act.sw={n:sp.n,gap:sp.gap,start:hitT}; act.dur=hitT+sp.n*sp.gap+0.18; act.hitAt=hitT/act.dur;   // skillvis: the body repeats the blow
}
// the arcs of a multi-hit cone, one after the other, each from the other side; follow: a function giving {x,y,z,face} (the caster moves), else the fixed spot
function skvSwings(o){   // o: n, gap, x,y,z, face, r, col, sc, follow, mine, sparkCol
  const n=o.n||1, gap=o.gap||0.12;
  for(let h=0;h<n;h++){
    const go=()=>{ const q=o.follow?o.follow():o, side=h%2?0.32:-0.32;
      spawnArcAt(q.x,q.y+(0.8+0.12*(h%3))*(o.sc||1),q.z,q.face+(o.turn?h/n*o.turn:n>1?side:0),o.col,o.r/2.6);
      if(o.sparkCol!==undefined) fxpSparks(q.x-Math.sin(q.face)*o.r*0.6,q.y+1,q.z-Math.cos(q.face)*o.r*0.6,o.sparkCol,5,4,{size:0.16});
      if(o.mine&&h>0) cSfx.swing(false); };
    if(h===0) go(); else fxpLater(h*gap,go);
  }
}
// the numbers of a multi-hit blow of yours come one swing at a time: the k-th hit on the same monster waits k swings (a hit that arrives after the flurry is not held)
function skvDmgDelay(monId){
  const a=CB.act, sw=a&&a.sw; if(!sw||a.t>a.dur) return 0;
  const c=a.swc||(a.swc={}), k=c[monId]=(c[monId]||0)+1; return Math.min(sw.n-1,k-1)*sw.gap;
}
// ---- waves: a wall of water, light or dust that travels out (or in) from a point ----
const SKV_WAVE_STYLE={water:{add:1,op:0.5,foam:0xf2fbff},light:{add:1,op:0.42,foam:0xffffff},dust:{add:0,op:0.5,foam:0xd9c9a8},wind:{add:1,op:0.28,foam:0xffffff},fire:{add:1,op:0.5,foam:0xfff0b0},dark:{add:0,op:0.5,foam:0xb08aff}};
const SKV_EL_STYLE={water:'water',air:'wind',earth:'dust',fire:'fire',light:'light',dark:'dark',basic:'light'};
function skvWave(x,z,o){   // o: shape 'ring'|'arc', r (how far), arc (half the angle of an arc), face, h (crest height), life, col, style, inward, delay
  if(SKV.waves.length>=(LOW?6:14)) return;
  const st=SKV_WAVE_STYLE[o.style]||SKV_WAVE_STYLE.light, ring=o.shape!=='arc', arc=ring?Math.PI:(o.arc||0.6), th0=ring?0:o.face+Math.PI-arc, thL=ring?TAU:arc*2;
  const geo=new THREE.CylinderGeometry(1,1,1,Math.max(12,Math.round(thL/TAU*(LOW?28:44))),1,true,th0,thL);
  const mk=(c,op,add)=>new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}));
  const body=mk(o.col,st.op,st.add), crest=mk(st.foam,st.op*0.9,1); scene.add(body,crest);
  const life=o.life||0.8; SKV.waves.push({body,crest,geo,x,z,R:o.r||6,h:o.h||1.1,life,max:life,inward:!!o.inward,ring,th0,thL,col:o.col,foam:st.foam,st:st});
}
const skvWaveAt=(el,x,z,o)=>skvWave(x,z,Object.assign({style:SKV_EL_STYLE[el]||'light'},o));
function skvWaveStep(dt){
  for(let i=SKV.waves.length-1;i>=0;i--){
    const w=SKV.waves[i]; w.life-=dt; const k=Math.min(1,1-w.life/w.max);
    if(w.life<=0){ scene.remove(w.body,w.crest); w.body.material.dispose(); w.crest.material.dispose(); w.geo.dispose(); SKV.waves.splice(i,1); continue; }
    const e=1-(1-k)*(1-k), r=w.inward?Math.max(0.4,w.R*(1-e)):0.4+(w.R-0.4)*e, hh=w.h*Math.pow(Math.sin(Math.min(1,k*1.25+0.05)*Math.PI),0.7), gy=getH(w.x,w.z);
    w.body.scale.set(r,Math.max(0.02,hh),r); w.body.position.set(w.x,gy+hh/2,w.z);
    w.crest.scale.set(r*1.03,Math.max(0.02,hh*0.22),r*1.03); w.crest.position.set(w.x,gy+hh*0.9,w.z);
    w.body.material.opacity=w.st.op*(1-k*k); w.crest.material.opacity=w.st.op*0.9*(1-k*k);
    if(Math.random()<dt*70*FXP_K){ const a=w.ring?AR(0,TAU):w.th0+AR(0,w.thL), sx=Math.sin(a), sz=Math.cos(a);   // foam thrown off the crest
      fxpAdd(w.x+sx*r,gy+hh*0.9,w.z+sz*r,sx*(w.inward?-2:3),AR(0.6,2),sz*(w.inward?-2:3),w.foam,0.2,0.4,{g:5,drag:1.5,white:0.4,grow:0.1}); }
  }
}
// ---- recipes ----
const skvR=(c,o,d)=>o.r!==undefined?o.r:c.r?c.r*(o.rk||1):d;   // a radius: the step's own, or a share of the zone it belongs to, or the default
const skvCol=(L,c)=>c==='hot'?L.hot:c==='hot2'?L.hot2:typeof c==='number'&&c<L.cols.length&&c<8?L.cols[c]:c;
function skvAnchor(c,o){
  const w=(o&&o.where)||'self';
  if(w==='self') return {x:c.x,z:c.z};
  if(w==='target'){ const T=c.mine&&typeof CB!=='undefined'&&CB.target&&!CB.target.dead?CB.target:null; if(T) return {x:T.x,z:T.z}; }
  const d=(o&&o.d)||Math.min(c.s&&c.s.range||5,6);
  return {x:c.x+(c.fx||0)*d,z:c.z+(c.fz||0)*d};
}
const SKVX={
  swing:(L,c,o)=>{ const a=skvAnchor(c,o); skvSwings({n:o.n||3,gap:o.gap||0.1,x:a.x,y:c.y,z:a.z,face:c.face+(o.rot||0),turn:o.turn,r:o.r||3.4,col:skvCol(L,o.col!==undefined?o.col:'hot'),sc:c.sc,mine:c.mine,sparkCol:skvCol(L,'hot2'),follow:c.mine&&(o.where||'self')==='self'?()=>({x:P.x,y:P.y,z:P.z,face:P.face+(o.rot||0)}):null}); },
  wave:(L,c,o)=>{ const a=skvAnchor(c,o); skvWave(a.x,a.z,{shape:o.shape||'ring',r:skvR(c,o,6),arc:o.arc,face:c.face+(o.rot||0),h:o.h,life:o.life,style:o.style,col:skvCol(L,o.col!==undefined?o.col:'hot'),inward:o.inward}); },
  prop:(L,c,o)=>{ const a=skvAnchor(c,o); skpSpawnSet(L,c,a,o); },
  burst:(L,c,o)=>{ const a=skvAnchor(c,o); sslBurst(L,a.x,getH(a.x,a.z)+(o.y||0.9),a.z,o.n||10,o.spd||3.2); },
  ring:(L,c,o)=>{ const a=skvAnchor(c,o); spawnRingAt(a.x,getH(a.x,a.z),a.z,skvR(c,o,4),skvCol(L,o.col!==undefined?o.col:'hot'),!!o.inward); },
  shaft:(L,c,o)=>{ const a=skvAnchor(c,o); sslShaft(L,a.x,a.z,o.h||7,skvCol(L,o.col!==undefined?o.col:'hot')); },
  rays:(L,c,o)=>{ const a=skvAnchor(c,o); sslRays(L,a.x,c.y+(o.y||1.2),a.z,c.face,o.arc||0.8,o.n||7,o.len||6,skvCol(L,o.col!==undefined?o.col:'hot')); },
  slabs:(L,c,o)=>{ const a=skvAnchor(c,o); sslSlabs(L,a.x,a.z,skvR(c,o,4),o.n||8,skvCol(L,o.col!==undefined?o.col:0)); },
  decal:(L,c,o)=>{ const a=skvAnchor(c,o); sslDecal(L,a.x,a.z,skvR(c,o,5),{life:o.life||0.8,spin:o.spin||0.8}); },
  shake:(L,c,o)=>{ if(c.mine||Math.hypot(P.x-c.x,P.z-c.z)<25) camShake=Math.max(camShake,typeof o==='number'?o:o.v||0.3); },
  dust:(L,c,o)=>{ const a=skvAnchor(c,o); fxxDust(a.x,getH(a.x,a.z),a.z,o.n||8,skvR(c,o,3),o.col!==undefined?skvCol(L,o.col):0x8a7a60); },
  rise:(L,c,o)=>{ const a=skvAnchor(c,o); for(let i=0;i<sslN(o.n||10);i++){ const q=AR(0,TAU), d=Math.sqrt(Math.random())*skvR(c,o,2); ssEmit(L,a.x+Math.sin(q)*d,getH(a.x,a.z)+0.2,a.z+Math.cos(q)*d,{v:[0,sslR(1,3),0],life:sslR(0.7,1.3)}); } },
  flash:(L,c,o)=>{ if(c.mine) fxxFlash(skvCol(L,o.col!==undefined?o.col:'hot'),o.a||0.2); }
};
// the recipe of a skill row in a look: the exact id first, then 'ult' / its position
function skvRecipeOf(L,s){
  if(!L||!L.vis||!s) return null;
  return L.vis[s.id]||(s.slot==='ult'?L.vis.ult:L.vis[String(s.pos)])||null;
}
function skvRunRecipe(L,s,phase,c){   // phase: 'cast' | 'zone' | 'end' | 'hit'
  const R=skvRecipeOf(L,s), steps=R&&R[phase]; if(!steps) return;
  c.s=s; if(c.fx===undefined){ c.fx=-Math.sin(c.face||0); c.fz=-Math.cos(c.face||0); }
  for(const st of steps){
    const verb=Object.keys(st).find(k=>k!=='at'), fn=verb&&SKVX[verb]; if(!fn) continue;
    const go=()=>{ try{ fn(L,c,st[verb]); }catch(e){ SKV.errs.push(L.id+' '+verb+': '+e); if(typeof console!=='undefined'&&SKV.errs.length<4) console.warn('skill vis '+L.id+' '+verb+': '+e); } };
    const at=st.at||(st[verb]&&st[verb].at)||0;   // (the delay may stand beside the verb or inside its options)
    if(at) fxpLater(at,go); else go();
  }
}
// at ssDefineLook: a recipe with an unknown verb or prop kind is dropped and listed
function skvCheckVis(L){
  if(!L.vis) return;
  for(const key in L.vis){ const R=L.vis[key];
    for(const ph in R){ if(!['cast','zone','end','hit'].includes(ph)){ SKV.bad.push({id:L.id,why:key+': unknown phase '+ph}); delete L.vis; return; }
      for(const st of R[ph]){ const verb=Object.keys(st).find(k=>k!=='at');
        if(!SKV_VERBS.includes(verb)){ SKV.bad.push({id:L.id,why:key+'.'+ph+': unknown verb '+verb}); delete L.vis; return; }
        if(verb==='prop'&&!SKP_BUILD[st.prop.kind]){ SKV.bad.push({id:L.id,why:key+'.'+ph+': unknown prop '+st.prop.kind}); delete L.vis; return; } } } }
}
function skvTick(dt){ skvWaveStep(dt); skpStep(dt); }   // skillvis: from updateSkillFx
