//@ The Gloamhorn's monster models: the gloom bat (model 'bat'); the rest of the land reuses the families with new look flags (djinn siren, wisp ghosts by id, goblin undead, treant dead, wyrm stone, sandworm sea)
/* Agent map: fills MODELS.bat (same contract as monster-parts.js: geo, build, anim; models face -z, metres at scale 1). pal.body / belly (fur), wing (the membrane), horn (claws and fangs), eye. The wings are the
   wyrm's membrane (moWyrmWing, monster-wyrm.js) shrunk to a bat's. Its stats are the FAM row 'bat' (shared/monster-defs.js), its kind the MON_DEFS row 'gloombat' (zone m33). Tested by client-smoke (the roster
   builds) and tools/monster-preview.js. */
MODELS.bat={
  geo(d,p){
    const G={}, W=[-1,1], fur=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.7+0.5*moNoise(x,y,z,8)); moTint(c,p.belly,clamp(-(y-1.0)*4)*0.6); };
    const body=[moEll(0.2,0.23,0.3,0,1.0,0.02,fur,null,10),moEll(0.17,0.16,0.17,0,1.12,-0.32,fur,null,10),moEll(0.14,0.12,0.1,0,0.95,-0.2,p.belly,null,8),moEll(0.045,0.035,0.06,0,1.06,-0.42,p.belly,null,6),moCone([0,0.95,0.26],[0,-0.5,1],0.22,0.07,fur,4)];   // body, head, snout, a stub of tail
    for(const sd of W){ body.push(moCone([sd*0.08,1.24,-0.32],[sd*0.3,1,-0.1],0.38,0.09,fur,5),moCone([sd*0.085,1.2,-0.33],[sd*0.2,0.9,-0.05],0.22,0.04,p.belly,4),moBone([sd*0.08,0.8,0.05],[sd*0.1,0.68,-0.02],0.03,0.018,p.horn,4),moEll(0.028,0.03,0.02,sd*0.07,1.12,-0.4,p.eye,null,5),moCone([sd*0.025,1.0,-0.46],[0,-1,-0.1],0.07,0.012,p.horn,3),moBone([sd*0.1,0.85,-0.05],[sd*0.12,0.7,-0.1],0.03,0.015,p.horn,4)); }
    for(let i=0;i<10;i++){ const a=(i/10-0.5)*2.3; body.push(moCone([Math.sin(a)*0.15,1.02-Math.abs(a)*0.06,-0.27+Math.cos(a)*0.0],[Math.sin(a)*0.5,-0.4,0.6],0.17,0.045,(x,y,z,c)=>{ c.set(p.belly).multiplyScalar(0.8+0.4*moNoise(x,y,z,14)); },4)); }   // a ruff of fur round the neck
    body.push(moCone([0,1.1,-0.46],[0,0.5,-0.6],0.07,0.035,p.belly,4),moEll(0.07,0.04,0.03,0,1.04,-0.45,p.horn,null,5));   // a nose-leaf and the teeth line
    G.body=moMerge(body);
    G.wR=moWyrmWing(1,p).scale(0.55,0.55,0.55); G.wL=moWyrmWing(-1,p).scale(0.55,0.55,0.55);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body);
    const nd=(x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); o.add(mesh); g.add(o); return o; };
    P0.wR=nd(0.12,1.08,0.0,M(G.wR)); P0.wL=nd(-0.12,1.08,0.0,M(G.wL));
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(9+sp*3);
    const fl=Math.sin(m.ph)*0.85, hov=0.55+Math.sin(m.ph*0.5+m.s*3)*0.08;   // it hovers a hand above the ground and beats its wings
    P0.wR.rotation.z=fl; P0.wL.rotation.z=-fl; P0.body.position.y=hov+Math.abs(fl)*0.05; P0.wR.position.y=P0.wL.position.y=1.08+hov;
    P0.body.rotation.x=Math.min(0.3,sp*0.07)-lunge*0.7;
  }
};
